import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import type { DossierIssue } from './issues'
import { DESTINATION_DES_CHAMPS } from './destinations'
import {
	BUDGETS_DE_MOTS,
	CHAMPS_REQUIS,
	CHEMINS_DE_DELTAS,
	ENUMERES_FERMES,
	FAMILLES_DE_CONDITIONS,
	LISTES_A_ELEMENTS_STRUCTURES,
	LISTES_REQUISES,
	RACINES,
	REFERENCES_SIMPLES,
} from './tables'
import { COLLECTIONS_IDENTIFIEES } from './identifiers'
import { PREDICATES } from './predicates'
import { DELTAS } from './deltas'

/**
 * LE SCHÉMA EST ÉCRIT TROIS FOIS — une fois comme types (`types.ts`), une fois
 * comme tables déclaratives (`tables.ts`), une fois comme audiences
 * (`destinations.ts`) — et rien ne relie les trois. Les fondre produirait un DSL
 * de schéma à spécifier, versionner et tester : pire que la dérive qu'il corrige.
 * Ce qui doit être unique n'est pas la table, c'est le GARDE — ce fichier.
 *
 * Il ferme la boucle par la FIXTURE, seul document dont on sait qu'il est
 * complet, et il échoue par NOM de champ, jamais par un compte.
 *
 * DEUX corrections de l'instrument de l'itération 1, toutes deux mesurées :
 *  · il descend en PLEINE PROFONDEUR et ENTRE DANS LES TABLEAUX. L'ancien
 *    s'arrêtait à deux niveaux et excluait `Array.isArray` — or tous les champs
 *    de l'itération 2 vivent dans des tableaux : il serait resté VERT sur du code
 *    faux ;
 *  · le critère passe de la SUPPRESSION à la CORRUPTION. « Supprimer une clé doit
 *    faire échouer la validation » était total tant que toute clé de la fixture
 *    était obligatoire ; dès qu'un optionnel y entre (`revele_si`, `monstre_ref`),
 *    la suppression est légitime. La corruption — remplacer la feuille par une
 *    valeur du MAUVAIS TYPE — subsume la suppression et vaut pour les optionnels
 *    contraints.
 *
 * UN SEUL walker, exporté, réutilisé par toutes les assertions de ce fichier : deux balayeurs
 * de profondeurs différentes sur la même fixture divergeraient en silence — c'est
 * précisément le mode de défaillance que ce test existe pour interdire.
 *
 * ── CE QUE LE BALAYAGE NE COUVRE PAS ─────────────────────────────────────────
 * Nommé ici plutôt que découvert plus tard : un instrument de couverture qui
 * change de critère doit dire ce qu'il CESSE de couvrir (KR-173).
 *  · LES CONTENEURS INTERMÉDIAIRES. La corruption ne remplace que des FEUILLES ;
 *    un objet ou un tableau porteur n'est jamais remplacé par une valeur du
 *    mauvais type. C'est l'angle mort qui a laissé passer BUG-049 (quatre listes
 *    non optionnelles acceptées absentes), aujourd'hui recouvert par une table
 *    dédiée — `LISTES_REQUISES` — et non par ce balayage.
 *  · LES ÉLÉMENTS DE LISTE NON-OBJET. Un `savoirs: ["du texte"]` traversait le
 *    validateur, `ok:true` : les deux traversées abandonnent la branche pour
 *    rester totales. Défaut réel, journalisé BUG-050, corrigé en itération 4 —
 *    non pas ici mais par `LISTES_A_ELEMENTS_STRUCTURES`, DÉRIVÉE de
 *    `LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES`. Ce balayage ne peut
 *    toujours pas le voir : il corrompt une feuille EXISTANTE, il n'en change
 *    jamais le porteur.
 *  · L'INTÉRIEUR DES ARBRES D'EXPRESSION ET DES EFFETS DE RÈGLE. Le balayage
 *    S'ARRÊTE sur chaque `…_expr` et sur chaque ÉLÉMENT d'un chemin de delta
 *    (voir `CHEMINS_D_ARRET`), et l'ensemble de ces points d'arrêt est DÉRIVÉ de
 *    `FAMILLES_DE_CONDITIONS` et de `CHEMINS_DE_DELTAS`, jamais re-listé. Motif :
 *    un arbre peuplé produit des chemins qui VARIENT avec sa forme, donc une
 *    table de destinations qui ne pourrait jamais être exhaustive ; un effet, lui,
 *    est une feuille de fait — sa `cibles[]` n'a pas d'audience propre. La
 *    contrepartie est portée par `validateExpr` ET `validateDelta`, qui refusent
 *    TOUTE clé inconnue — sans elles, l'opacité deviendrait une cachette où un
 *    champ de prose échapperait au balayage des destinations.
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')
/**
 * La SECONDE fixture. Ce fichier balaie la MINIMALE — c'est elle qui porte le
 * garde d'exhaustivité — mais un champ neuf doit être instancié dans les DEUX, et
 * la raison n'est pas symétrique : la minimale ferme la boucle des tables et des
 * destinations, la référence prouve qu'une aventure réelle sait s'en servir. Elle
 * n'est lue ici que par les assertions qui l'exigent.
 */
const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')
const MODULE_DOSSIER = __dirname

type Doc = Record<string, unknown>

/** La fixture, LUE DU DISQUE à chaque appel (KR-156) — jamais un littéral inline. */
function fixture(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Doc
}

/** Le dossier de RÉFÉRENCE, lu du disque au même titre (KR-156). Écrit UNE fois :
 *  trois assertions le lisent désormais, et trois lectures inline de la même
 *  constante finiraient par diverger sur le `as` ou sur l'encodage. */
function documentDeReference(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
}

/** Une anomalie rendue LISIBLE pour un message d'échec : le code, le chemin, et le
 *  OÙ résolu par nom. Jamais un `toHaveLength(0)` — compter n'est pas lire, et le
 *  jour où l'assertion rougit, c'est l'avertissement REÇU qu'on veut au rapport. */
function lisible(issue: DossierIssue): string {
	return `${issue.code} → ${issue.path} — ${issue.location}`
}

export interface FeuilleDeFixture {
	/** Chemin à indices EFFACÉS : `monde.evenements[].monstre_ref`. */
	normalise: string
	/** Chemin réel, indices compris : `monde.evenements[0].monstre_ref`. */
	concret: string
	valeur: unknown
}

/**
 * Les chemins où le balayage S'ARRÊTE — DÉRIVÉS de `FAMILLES_DE_CONDITIONS`, la
 * seule liste de chemins d'expression du dépôt. Une seconde liste, fût-elle
 * identique le jour où elle est écrite, divergerait en silence : une famille
 * ajoutée à la table et pas ici ferait descendre le balayage DANS son arbre, et
 * la table des destinations cesserait de pouvoir être exhaustive.
 */
const CHEMINS_D_ARRET = new Set([
	...FAMILLES_DE_CONDITIONS.map((famille) => famille.expr),
	// Le suffixe `[]` n'est PAS cosmétique, et la sonde l'a établi plutôt que le
	// raisonnement : sans lui l'arrêt tombe sur le TABLEAU, les lignes `…[]` de
	// DESTINATION_DES_CHAMPS deviennent MORTES (trois, mesurées — la quatrième, le
	// climat, porte une liste vide et n'a donc jamais eu de suffixe), et la
	// corruption cesse d'être PAR ÉLÉMENT. Avec le suffixe, l'arrêt tombe sur
	// l'ÉLÉMENT : les destinations existantes survivent, et deux effets dans une
	// même liste restent deux occasions de rougir.
	...CHEMINS_DE_DELTAS.map((chemin) => `${chemin.path}[]`),
])

/**
 * Toutes les feuilles terminales d'un document, en pleine profondeur, tableaux
 * inclus. Une feuille est ce qui ne se descend plus : une valeur scalaire, mais
 * aussi un objet ou un tableau VIDE — sinon `effet: [{}]` disparaîtrait du
 * balayage, et c'est exactement le champ que l'itération 2 fige. Un arbre
 * d'expression est une feuille ENTIÈRE, par arrêt dérivé (voir `CHEMINS_D_ARRET`).
 *
 * Les indices sont NORMALISÉS : sans cela, ajouter un second personnage
 * doublerait les chemins et le test échouerait par cardinalité au lieu d'échouer
 * par nom de champ. Chaque INSTANCE est conservée à part, parce que la couverture
 * n'est acquise que si CHACUNE rougit — une règle qui ne contrôlerait que `[0]`
 * passerait sinon pour exhaustive.
 */
export function feuillesDeLaFixture(valeur: unknown, normalise = '', concret = ''): FeuilleDeFixture[] {
	if (CHEMINS_D_ARRET.has(normalise)) return [{ normalise, concret, valeur }]
	if (Array.isArray(valeur) && valeur.length > 0) {
		return valeur.flatMap((element, index) => feuillesDeLaFixture(element, `${normalise}[]`, `${concret}[${index}]`))
	}
	if (estObjetSimple(valeur) && Object.keys(valeur).length > 0) {
		return Object.entries(valeur).flatMap(([cle, enfant]) =>
			feuillesDeLaFixture(
				enfant,
				normalise === '' ? cle : `${normalise}.${cle}`,
				concret === '' ? cle : `${concret}.${cle}`,
			),
		)
	}
	return [{ normalise, concret, valeur }]
}

/**
 * Les chemins de TOUTES les tables, avec le nom de leur table — le test échoue
 * en NOMMANT la table et le chemin, jamais par un compte (KR-159).
 */
function cheminsDesTables(): ReadonlyArray<readonly [string, string]> {
	return [
		...RACINES.map((r) => ['RACINES', r.path] as const),
		...CHAMPS_REQUIS.map((c) => ['CHAMPS_REQUIS', c.path] as const),
		...ENUMERES_FERMES.map((e) => ['ENUMERES_FERMES', e.path] as const),
		...LISTES_REQUISES.map((l) => ['LISTES_REQUISES', l.path] as const),
		...CHEMINS_DE_DELTAS.map((d) => ['CHEMINS_DE_DELTAS', d.path] as const),
		...REFERENCES_SIMPLES.map((r) => ['REFERENCES_SIMPLES', r.path] as const),
		...BUDGETS_DE_MOTS.map((b) => ['BUDGETS_DE_MOTS', b.path] as const),
		...FAMILLES_DE_CONDITIONS.map((f) => ['FAMILLES_DE_CONDITIONS', f.expr] as const),
		...FAMILLES_DE_CONDITIONS.map((f) => ['FAMILLES_DE_CONDITIONS', f.texte] as const),
	]
}

/**
 * Un chemin de table est INSTANCIÉ dans la fixture quand une feuille lui est
 * égale, ou DESCEND de lui. Le préfixe est indispensable et n'est pas un
 * relâchement : `monde.personnages[].savoirs` (LISTES_REQUISES), `canon.mj`
 * (BUDGETS_DE_MOTS) ou `monde.quetes[].recompense` (CHEMINS_DE_DELTAS) sont des
 * CONTENEURS — aucune feuille ne leur est jamais égale. Le préfixe est normalisé
 * sur un séparateur (`.` ou `[`) pour que `plan_actions` ne couvre pas
 * `plan_actions_bis`.
 */
function estInstancie(cheminDeTable: string, feuilles: readonly string[]): boolean {
	return feuilles.some(
		(feuille) =>
			feuille === cheminDeTable || feuille.startsWith(`${cheminDeTable}.`) || feuille.startsWith(`${cheminDeTable}[`),
	)
}

function estObjetSimple(valeur: unknown): valeur is Doc {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/** Les clés successives d'un chemin concret : `a.b[2].c` → `a`, `b`, 2, `c`. */
function decouper(chemin: string): (string | number)[] {
	const cles: (string | number)[] = []
	for (const segment of chemin.split('.')) {
		cles.push(segment.replace(/\[\d+\]/g, ''))
		for (const marqueur of segment.match(/\[\d+\]/g) ?? []) cles.push(Number(marqueur.slice(1, -1)))
	}
	return cles
}

/** Remplace la feuille par une valeur du MAUVAIS TYPE, sur une copie. */
function corrompre(doc: Doc, chemin: string): Doc {
	const copie = JSON.parse(JSON.stringify(doc)) as Doc
	const cles = decouper(chemin)
	let courant: unknown = copie
	for (const cle of cles.slice(0, -1)) courant = (courant as Record<string | number, unknown>)[cle]
	const derniere = cles[cles.length - 1]
	const porteur = courant as Record<string | number, unknown>
	porteur[derniere] = typeof porteur[derniere] === 'string' ? 42 : 'du texte a la place'
	return copie
}

/** Le motif partagé des `nom` — écrit une fois, chaque chemin restant nommé. */
const NOM_LIBRE =
	"« nom » est OPTIONNEL et libre : une valeur non textuelle retombe sur le repli « {Type} n°{index} (sans nom) », jamais sur une anomalie. C'est la doctrine absent ≠ vide de l'itération 1."

/**
 * Le motif partagé des QUATRE `…_texte` de l'itération 3 — optionnels et non
 * contraints : leur ABSENCE est calme (D1), leur présence n'est arbitrée par
 * aucune règle de forme, donc leur corruption ne fait rien rougir. Ils tombent
 * sous la question ouverte DÉJÀ POSSÉDÉE par la n° 2 (« un champ présent doit
 * être une chaîne »), la même qui porte les neuf dispenses `nom`. Inventer ici
 * une table de textes optionnels trancherait à la place de son propriétaire.
 */
const TEXTE_OPTIONNEL_LIBRE =
	"jumeau prose OPTIONNEL d'une condition : son absence est calme par D1, et aucune règle du schéma 1 ne contraint sa forme quand il est présent. Même question ouverte que les dispenses « nom », propriétaire n° 2 bascule-editeur : une table « présent → doit être une chaîne », ou une garde à l'affichage."

/**
 * Le motif partagé des SIX proses d'entité : les TROIS de `Lieu` (itération 4 de
 * la n° 3) et les TROIS d'identité d'un `Personnage` (itération 2 de la n° 4). Il
 * est DISTINCT de `TEXTE_OPTIONNEL_LIBRE`, et pas par style : celui-là dispense le
 * jumeau prose d'une CONDITION, dont l'absence est calme PAR D1 et dont la
 * présence sans `…_expr` déclenche un avertissement. Ces six-là n'ont aucun
 * jumeau `…_expr`, aucune famille dans `FAMILLES_DE_CONDITIONS`, et donc aucun
 * avertissement possible — les fondre ferait porter à l'un le motif de l'autre,
 * et la dispense cesserait de dire POURQUOI elle existe.
 *
 * Ce qui reste vrai des deux : la corruption remplace la chaîne par un NOMBRE, et
 * aucune règle du schéma 1 n'arbitre un champ optionnel présent mais non textuel.
 * Même question ouverte, même propriétaire.
 *
 * Le motif ne dit plus RIEN de `BUDGETS_DE_MOTS` (arbitrage d'it2 de la n° 4) : la
 * dispense tient par la corruption chaîne → nombre non arbitrée au schéma 1, la
 * longueur n'y est pour rien. Affirmer en passant l'état d'une AUTRE table n'est
 * vérifié par rien ici — ni par le compilateur, ni par le garde d'auto-nettoyage,
 * qui ne porte que sur la corruption — et la porter à six clés doublerait la
 * surface d'une phrase qui deviendrait fausse en silence.
 */
const PROSE_D_ENTITE_LIBRE =
	"prose OPTIONNELLE d'une entité, sans jumeau structuré : son absence est un état calme (doctrine « absent ≠ vide » de l'itération 1, comme « nom »), et aucune règle du schéma 1 ne contraint sa forme quand elle est présente — ni longueur, ni vocabulaire. Même question ouverte que les dispenses « nom », propriétaire n° 2 bascule-editeur : une table « présent → doit être une chaîne », ou une garde à l'affichage."

/**
 * Les feuilles dont la corruption ne fait PAS échouer la validation, chacune
 * avec son motif. Toute entrée devenue inutile fait rougir le test de disjonction
 * plus bas : une liste d'exceptions doit être AUTO-NETTOYANTE (BUG-044).
 */
const LIBRES: Record<string, string> = {
	'canon.interdits_ton[]':
		"consigne de ton libre : la RACINE est vérifiée comme liste (itération 1), le contenu de ses éléments n'est arbitré par aucune règle du schéma 1.",
	'canon.objectifs[].nom': NOM_LIBRE,
	'canon.objectifs[].reussi_si_texte': TEXTE_OPTIONNEL_LIBRE,
	'canon.objectifs[].echoue_si_texte': TEXTE_OPTIONNEL_LIBRE,
	'monde.personnages[].plan_actions[].declencheur_texte': TEXTE_OPTIONNEL_LIBRE,
	'monde.evenements[].declencheur_texte': TEXTE_OPTIONNEL_LIBRE,
	'monde.personnages[].nom': NOM_LIBRE,
	'monde.personnages[].plan_actions[].etape':
		"l'ordre d'une étape : aucune règle d'ordonnancement (unicité, continuité, départ à 1) n'est arbitrée au schéma 1 — les déclencheurs arrivent en itération 3.",
	'monde.personnages[].savoirs[].revele_comment':
		'didascalie OPTIONNELLE et libre : son absence est calme, et aucune règle ne contraint sa forme.',
	// MOTIF RÉÉCRIT en itération 4 : l'ancien annonçait que la résolution arriverait
	// et rendrait la dispense caduque. Elle est arrivée (`REFERENCES_SIMPLES`), et la
	// dispense TIENT QUAND MÊME — parce que la corruption remplace la chaîne par un
	// NOMBRE, et qu'une porte OPTIONNELLE présente mais non textuelle n'est arbitrée
	// par aucune règle du schéma 1. Ce qui reste ouvert n'est donc pas la résolution
	// mais la même question que les dispenses `nom` et `…_texte`.
	'monde.personnages[].savoirs[].revele_si.apres_indice_id':
		"porte OPTIONNELLE : sa résolution vers monde.indices est vivante depuis l'itération 4 (REFERENCES_SIMPLES), mais elle ne parle que d'une CHAÎNE — une valeur présente et non textuelle tombe sous la question ouverte déjà possédée par la n° 2, la même qui porte les dispenses « nom ».",
	// MÊME MOTIF, MÊME FORME que la porte ci-dessus, et c'est ce qui le rend
	// recevable : `objectif_id` est une RÉFÉRENCE SIMPLE résolue depuis l'itération 1
	// de la n° 4, mais la boucle de `REFERENCES_SIMPLES` ne parle que d'une CHAÎNE
	// (`typeof site.valeur !== 'string' → continue`), et la corruption remplace ici la
	// chaîne par un NOMBRE. Une cible pendante, elle, EST bloquante — c'est le test
	// nommé de `validate.test.ts`, pas cette dispense. Rien de neuf n'est arbitré :
	// même question ouverte, même propriétaire.
	'monde.personnages[].objectif_id':
		"rattachement OPTIONNEL : sa résolution vers canon.objectifs est vivante (REFERENCES_SIMPLES), mais elle ne parle que d'une CHAÎNE — une valeur présente et non textuelle tombe sous la question ouverte déjà possédée par la n° 2, la même qui porte les dispenses « nom » et la porte apres_indice_id.",
	// Les TROIS proses d'identité (it2 de la n° 4) : même motif, mot pour mot, que
	// les trois proses de `Lieu` — une prose d'entité sans jumeau structuré, dont la
	// corruption remplace la chaîne par un NOMBRE. Une SECONDE constante au texte
	// voisin divergerait en silence : une seule, six clés.
	'monde.personnages[].fonction': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].apparence': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].description_joueur': PROSE_D_ENTITE_LIBRE,
	'monde.lieux[].nom': NOM_LIBRE,
	'monde.lieux[].description': PROSE_D_ENTITE_LIBRE,
	'monde.lieux[].ambiance': PROSE_D_ENTITE_LIBRE,
	'monde.lieux[].dangers': PROSE_D_ENTITE_LIBRE,
	'monde.objets[].nom': NOM_LIBRE,
	'monde.indices[].nom': NOM_LIBRE,
	'monde.quetes[].nom': NOM_LIBRE,
	'monde.evenements[].nom': NOM_LIBRE,
	'monde.conditions.climat[].nom': NOM_LIBRE,
	'charpente.jalons[].nom': NOM_LIBRE,
	'charpente.fins[].nom': NOM_LIBRE,
}

/**
 * Les feuilles auxquelles on refuse une audience, chacune avec son motif. VIDE
 * aujourd'hui : au schéma 1, tout champ terminal est classable en `ia` / `moteur`
 * / `auteur`. Elle est gardée sous la même assertion de disjonction — une
 * dispense qui nomme un champ DÉJÀ classé absorberait la disparition de sa ligne.
 */
const SANS_DESTINATION: Record<string, string> = {}

/** Les chemins normalisés dont CHAQUE instance corrompue fait échouer la validation. */
function couvertsParCorruption(): string[] {
	const rougit = new Map<string, boolean>()
	for (const feuille of feuillesDeLaFixture(fixture())) {
		const casse = validateDossier(corrompre(fixture(), feuille.concret)).ok === false
		rougit.set(feuille.normalise, (rougit.get(feuille.normalise) ?? true) && casse)
	}
	return [...rougit].filter(([, couvert]) => couvert).map(([chemin]) => chemin)
}

/** Les chemins normalisés de la fixture, dédupliqués. */
function cheminsDeLaFixture(): string[] {
	return [...new Set(feuillesDeLaFixture(fixture()).map((feuille) => feuille.normalise))]
}

describe('couverture', () => {
	it('la fixture est valide et sans avertissement, sinon le balayage ne mesure rien', () => {
		const resultat = validateDossier(fixture())

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('le dossier de reference ne produit ni erreur ni avertissement', () => {
		// Le critère d'itération porte DEUX moitiés — « les six personnages restent
		// ACCEPTÉS » et « SANS avertissement neuf » — et une seule était tenue. La
		// première l'est ailleurs, par construction : `suffisance.test.ts` jette au
		// chargement si la référence ne valide pas. La seconde ne l'était par AUCUN test
		// nommé : l'assertion de tête ci-dessus ne parle que de la fixture MINIMALE, et
		// la référence est justement le document où une prose ajoutée par une itération
		// future franchira un budget en premier — elle porte six personnages et un
		// synopsis MJ long, la minimale un personnage et trois lignes.
		//
		// Un avertissement ne bloque PAS l'import (`severity: 'warning'`) : sans cette
		// assertion, la référence pourrait se mettre à en produire un et rester verte
		// partout, y compris dans la suite de suffisance qui ne regarde que `ok`.
		//
		// Les anomalies sont projetées en TEXTE avant comparaison : le jour où ce test
		// rougit, on veut LIRE le code, le chemin et le OÙ de l'avertissement reçu —
		// `toHaveLength(0)` ferait compter, et un objet brut noierait le nom dans la
		// sérialisation.
		const resultat = validateDossier(documentDeReference())

		expect(resultat.warnings.map(lisible)).toEqual([])
		expect(resultat.errors.map(lisible)).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('toute feuille corrompue est refusee, ou nommee dans LIBRES', () => {
		const couverts = couvertsParCorruption()

		const nonCouverts = cheminsDeLaFixture()
			.filter((chemin) => !couverts.includes(chemin))
			.filter((chemin) => LIBRES[chemin] === undefined)

		expect(nonCouverts).toEqual([])
	})

	it('toute feuille a une destination, ou est nommee dans SANS_DESTINATION', () => {
		const sansAudience = cheminsDeLaFixture()
			.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] === undefined)
			.filter((chemin) => SANS_DESTINATION[chemin] === undefined)

		expect(sansAudience).toEqual([])
	})

	it('aucune ligne morte dans DESTINATION_DES_CHAMPS', () => {
		// Une ligne qui ne correspond à aucune feuille de la fixture ne déclare
		// l'audience de rien : elle survit à la raison qui l'a créée.
		const chemins = cheminsDeLaFixture()

		expect(Object.keys(DESTINATION_DES_CHAMPS).filter((chemin) => !chemins.includes(chemin))).toEqual([])
	})

	it('une dispense nommant une feuille deja couverte est morte', () => {
		// Une dispense ne dispense alors de rien — mais elle ABSORBERAIT la perte de
		// la règle qu'elle nomme. Elle doit tomber, et se nommer en tombant.
		const couverts = couvertsParCorruption()

		expect(Object.keys(LIBRES).filter((chemin) => couverts.includes(chemin))).toEqual([])
		expect(Object.keys(SANS_DESTINATION).filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== undefined)).toEqual([])
	})

	it('le walker de couverture n est ecrit qu une fois dans le module dossier', () => {
		// Construit par morceaux pour que la présence de CE littéral ne suffise pas à
		// faire passer le test si la fonction disparaissait (même patron que le
		// test-grep du gel).
		const SIGNATURE = ['function feuilles', 'DeLaFixture'].join('')

		const porteurs = fs
			.readdirSync(MODULE_DOSSIER)
			.filter((nom) => nom.endsWith('.ts'))
			.filter((nom) => fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8').includes(SIGNATURE))

		expect(porteurs).toEqual(['couverture.test.ts'])
	})

	it('4e assertion : tout chemin de table a une instance dans la fixture, par prefixe normalise', () => {
		// Le dernier chemin de contournement du garde de DESTINATION_DES_CHAMPS : un
		// champ ajouté aux types ET aux tables mais PAS à la fixture restait invisible
		// aux trois assertions précédentes, qui partent toutes de la fixture.
		const feuilles = cheminsDeLaFixture()

		const orphelins = cheminsDesTables()
			.filter(([, chemin]) => !estInstancie(chemin, feuilles))
			.map(([table, chemin]) => `${table} → ${chemin}`)

		expect(orphelins).toEqual([])
	})

	it('la 4e assertion rougit sur un chemin de table absent de la fixture', () => {
		// Discriminant de l'instrument : sans lui, `estInstancie` pourrait rendre vrai
		// pour tout et l'assertion ci-dessus serait une constante.
		const feuilles = cheminsDeLaFixture()

		expect(estInstancie('monde.personnages[].contre_mesures', feuilles)).toBe(false)
		// Et le préfixe se normalise sur un séparateur : un préfixe de NOM ne compte pas.
		expect(estInstancie('monde.personnages[].plan', feuilles)).toBe(false)
		expect(estInstancie('monde.personnages[].plan_actions', feuilles)).toBe(true)
	})

	it('tout chemin finissant par _expr a une destination valant moteur', () => {
		// D1 : `…_expr` est la seule autorité sur ce qui se déclenche, et il n'entre
		// dans aucun contexte de modèle. Une ligne `ia` ici serait exactement la fuite
		// que la table des destinations existe pour rendre impossible.
		const suffixe = ['_ex', 'pr'].join('')

		const cheminsExpr = cheminsDeLaFixture().filter((chemin) => chemin.endsWith(suffixe))

		expect(cheminsExpr).toHaveLength(FAMILLES_DE_CONDITIONS.length)
		for (const chemin of cheminsExpr) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → moteur`)
		}
	})

	it('tout jumeau prose d une condition a une destination valant auteur', () => {
		// Le SYMÉTRIQUE de l'assertion ci-dessus, et il est le plus important des deux.
		// Un `…_texte` est le `…_expr` EN FRANÇAIS : injecté, il met la même règle dans
		// le code ET dans le prompt, et il apprend au modèle à PROVOQUER le jalon ou à
		// conduire à la fin. C'est le veto qui a fait corriger le § D1 du roadmap.
		//
		// Il manquait (BUG-051) : la règle `…_expr → moteur` ne dit RIEN des jumeaux, et
		// basculer `reussi_si_texte` de `auteur` à `ia` laissait la suite entièrement
		// verte. Dérivé de la même table que son symétrique — deux listes de chemins
		// divergeraient en silence, c'est précisément ce qu'on refuse ailleurs.
		const cheminsTexte = FAMILLES_DE_CONDITIONS.map((famille) => famille.texte)

		for (const chemin of cheminsTexte) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → auteur`)
		}
		// Discriminant : la table doit réellement porter ces chemins. Sans cette ligne,
		// l'assertion passerait aussi sur `undefined → undefined` si une ligne tombait.
		expect(cheminsTexte.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] === undefined)).toEqual([])
	})

	it('les trois proses de Lieu portent la destination ia et une instance dans la fixture', () => {
		// Les deux assertions générales ci-dessus couvrent DÉJÀ ces trois chemins —
		// mais chacune par une moitié seulement : « toute feuille a une destination »
		// ne dit rien de la VALEUR (KR-174, leçon de BUG-051), et « aucune ligne morte »
		// ne dit rien de l'audience. Nommées ici ensemble, elles épinglent l'arbitrage
		// du raffinage (désaccord #3, `ia` et non `auteur`) : une prose de lieu est de
		// la donnée de jeu que le narrateur du Temps 2 lit, pas une note de rédaction.
		//
		// Les trois chemins sont écrits en littéral, et c'est assumé : aucune table du
		// dépôt ne liste les proses d'une entité (la dérivation existe pour les
		// conditions, qui ont `FAMILLES_DE_CONDITIONS`, pas ici). Le garde contre la
		// divergence n'est donc pas la dérivation mais les deux assertions générales,
		// qui rougissent si l'un des trois chemins quitte la fixture ou la table.
		const PROSES_DE_LIEU = ['monde.lieux[].description', 'monde.lieux[].ambiance', 'monde.lieux[].dangers']
		const feuilles = cheminsDeLaFixture()

		for (const chemin of PROSES_DE_LIEU) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ia`)
			// L'INSTANCE, dans le même test que l'audience : une ligne de destination
			// livrée sans sa fixture ne déclare l'audience de rien, et la déclaration
			// serait morte le jour même où elle est écrite.
			expect(feuilles).toContain(chemin)
		}
	})

	it('le camp et le rattachement d un personnage sont moteur, et instancies dans les DEUX fixtures', () => {
		// Même construction que les trois proses de `Lieu` juste au-dessus, et pour la
		// même raison (KR-174) : « toute feuille a une destination » ne dit rien de la
		// VALEUR, « aucune ligne morte » ne dit rien de l'audience. Les deux moitiés
		// nommées ensemble épinglent l'arbitrage — `moteur` et non `ia` : le camp d'un
		// PNJ est un spoiler, et un identifiant de rattachement est un handle.
		//
		// L'INSTANCE DANS LA FIXTURE DE RÉFÉRENCE est dans le MÊME test, et ce n'est pas
		// une redondance du garde d'exhaustivité : celui-ci balaie la fixture MINIMALE,
		// donc un champ instancié là mais absent d'une aventure réelle resterait vert
		// partout. Un champ que la référence n'exerce pas n'est pas un champ qu'on sait
		// utiliser.
		const CHAMPS_DE_SITUATION = ['monde.personnages[].camp', 'monde.personnages[].objectif_id']
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const chemin of CHAMPS_DE_SITUATION) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → moteur`)
			expect(feuilles).toContain(chemin)
			expect(feuillesDeLaReference).toContain(chemin)
		}
	})

	it('les trois proses d identite sont ia et instanciees dans les DEUX fixtures', () => {
		// Modelé sur le test du camp et du rattachement juste au-dessus — LES DEUX
		// fixtures, pas seulement la minimale — et pour la même raison (KR-174) :
		// « toute feuille a une destination » ne dit rien de la VALEUR, « aucune ligne
		// morte » ne dit rien de l'audience. Nommées ensemble, les deux moitiés
		// épinglent l'arbitrage : `ia` et non `auteur`, parce qu'un métier, une voix et
		// une réputation sont ce que le narrateur du Temps 2 LIT pour incarner le
		// personnage — pas des notes de rédaction.
		//
		// La bascule que ce test doit faire rougir : passer `description_joueur` à
		// `moteur` en croyant que le suffixe `_joueur` désigne une prose émise verbatim.
		// Il désigne l'AUDIENCE, jamais le RÉGIME (voir le commentaire de la table) :
		// ces trois-là sont INJECTÉES.
		//
		// L'INSTANCE DANS LA RÉFÉRENCE est dans le MÊME test : le garde d'exhaustivité
		// balaie la fixture MINIMALE, donc un champ instancié là mais absent d'une
		// aventure réelle resterait vert partout. Un champ que la référence n'exerce pas
		// n'est pas un champ qu'on sait utiliser.
		const PROSES_D_IDENTITE = [
			'monde.personnages[].fonction',
			'monde.personnages[].apparence',
			'monde.personnages[].description_joueur',
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const chemin of PROSES_D_IDENTITE) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ia`)
			expect(feuilles).toContain(chemin)
			expect(feuillesDeLaReference).toContain(chemin)
		}
	})

	it('chaque entree de PREDICATES a au moins une instance dans la fixture', () => {
		// La fixture est le seul document dont on sait qu'il est complet : c'est elle
		// qui ferme la boucle. Un prédicat sans instance n'est jamais éprouvé de bout
		// en bout — ni sa résolution, ni son arité, ni son libellé.
		const texte = fs.readFileSync(CHEMIN_FIXTURE, 'utf8')

		const absents = Object.keys(PREDICATES).filter((id) => !texte.includes(`"predicat": "${id}"`))

		expect(absents).toEqual([])
	})

	it('l arret du balayage est derive de FAMILLES_DE_CONDITIONS', () => {
		// (a) COMPORTEMENT — le balayage ne descend JAMAIS dans un arbre de condition,
		// et chaque `…_expr` de la fixture y apparaît comme une feuille ENTIÈRE. Une
		// famille ajoutée à la table sans l'être au point d'arrêt ferait apparaître des
		// chemins internes (« ….op », « ….enfants[].predicat ») et ce test rougirait.
		const suffixe = ['_ex', 'pr'].join('')
		const chemins = cheminsDeLaFixture()

		expect(chemins.filter((chemin) => chemin.includes(`${suffixe}.`))).toEqual([])
		expect(chemins.filter((chemin) => chemin.endsWith(suffixe)).sort()).toEqual(
			FAMILLES_DE_CONDITIONS.map((famille) => famille.expr).sort(),
		)

		// (b) SOURCE — aucune SECONDE liste de chemins de condition dans ce fichier :
		// pas un seul littéral de chemin se terminant par le suffixe, les assertions
		// elles-mêmes passant par la table. Deux listes divergeraient en silence.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'couverture.test.ts'), 'utf8')
		const litteraux = source.match(new RegExp(`['"\`][a-z0-9_.[\\]]*${suffixe}['"\`]`, 'g')) ?? []

		expect(litteraux).toEqual([])
		expect(source).toContain('FAMILLES_DE_CONDITIONS.map((famille) => famille.expr)')
	})

	it('la docstring nomme ce que le balayage ne couvre PAS', () => {
		// KR-173 : quand une traversée abandonne une branche pour rester totale, ce
		// qu'elle cesse de visiter doit être ÉCRIT — et l'écrit doit être sous test,
		// sinon il se périme comme n'importe quel commentaire.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'couverture.test.ts'), 'utf8')
		const entete = source.slice(0, source.indexOf('const CHEMIN_FIXTURE'))

		expect(entete).toContain('CE QUE LE BALAYAGE NE COUVRE PAS')
		expect(entete).toContain('LES CONTENEURS INTERMÉDIAIRES')
		expect(entete).toContain('LES ÉLÉMENTS DE LISTE NON-OBJET')
		expect(entete).toContain('BUG-050')
		expect(entete).toContain("L'INTÉRIEUR DES ARBRES D'EXPRESSION")
		// Ce que l'itération 4 lui fait CESSER de couvrir en plus : l'intérieur d'un
		// effet, et le nom de la table qui reprend le trou de BUG-050.
		expect(entete).toContain('DES EFFETS DE RÈGLE')
		expect(entete).toContain('LISTES_A_ELEMENTS_STRUCTURES')
	})

	it('tout chemin de CHEMINS_DE_DELTAS a une destination valant moteur', () => {
		// Un delta est APPLIQUÉ par le moteur. Injecté, il apprendrait au modèle à
		// distribuer lui-même les récompenses et à cocher lui-même les jalons. Une
		// ligne `ia` ici serait exactement la fuite que la table existe pour rendre
		// impossible — et l'assertion porte sur la VALEUR, jamais sur l'existence
		// seule (KR-174, leçon de BUG-051).
		const chemins = cheminsDeLaFixture()

		const sousDelta = chemins.filter((chemin) =>
			CHEMINS_DE_DELTAS.some((delta) => chemin === delta.path || chemin.startsWith(`${delta.path}[`)),
		)

		// Discriminant : les QUATRE emplacements sont réellement représentés — sans
		// cette ligne, la boucle passerait sur une liste vide.
		expect(new Set(sousDelta).size).toBe(CHEMINS_DE_DELTAS.length)
		for (const chemin of sousDelta) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → moteur`)
		}
	})

	it('aucune feuille ne descend dans un effet, et aucune seconde liste de chemins de delta', () => {
		// (a) COMPORTEMENT — un effet est une feuille ENTIÈRE. Une clé `delta` ou une
		// `cibles[]` apparaissant comme chemin signerait un arrêt tombé sur le TABLEAU
		// au lieu de l'ÉLÉMENT, ou pas d'arrêt du tout.
		const chemins = cheminsDeLaFixture()

		for (const delta of CHEMINS_DE_DELTAS) {
			expect(chemins.filter((chemin) => chemin.startsWith(`${delta.path}[].`))).toEqual([])
		}

		// (b) SOURCE — l'arrêt est DÉRIVÉ, et aucun chemin de delta n'est écrit en
		// littéral dans ce fichier. Deux listes divergeraient en silence : une famille
		// d'effets ajoutée à la table sans l'être ici ferait descendre le balayage DANS
		// son effet. Construit par morceaux pour que la présence de CE littéral ne
		// suffise pas à faire passer le test.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'couverture.test.ts'), 'utf8')
		const DERIVATION = ['CHEMINS_DE_DELTAS.map((chemin) => ', '`${chemin.path}[]`', ')'].join('')

		expect(source).toContain(DERIVATION)
		expect(CHEMINS_DE_DELTAS.filter((delta) => source.includes(`'${delta.path}`))).toEqual([])
	})

	it('chaque entree de DELTAS a au moins une instance dans la fixture', () => {
		// Même clôture que pour `PREDICATES` : la fixture est le seul document dont on
		// sait qu'il est complet. Un effet sans instance n'est jamais éprouvé de bout en
		// bout — ni sa résolution, ni son arité, ni son libellé.
		const texte = fs.readFileSync(CHEMIN_FIXTURE, 'utf8')

		const absents = Object.keys(DELTAS).filter((id) => !texte.includes(`"delta": "${id}"`))

		expect(absents).toEqual([])
	})

	it('aucune liste a elements structures n est un chemin de delta', () => {
		// La propriete que le § 3.2 annonce — un emplacement de delta ne produit jamais
		// `element-non-objet` — etait INCIDENTE : la derivation filtre LISTES_REQUISES et
		// ne lit jamais CHEMINS_DE_DELTAS, donc rien n empechait un chemin de delta d y
		// entrer un jour. Assertee ici, elle devient MECANIQUE. Relevee a la revue de PR :
		// un fait vrai dont la cause enoncee est fausse reste vrai par accident (KR-176).
		const chemins = new Set(CHEMINS_DE_DELTAS.map((chemin) => chemin.path))

		expect(LISTES_A_ELEMENTS_STRUCTURES.filter((liste) => chemins.has(liste.path))).toEqual([])
		// Discriminant : les deux ensembles sont non vides, sans quoi la disjonction
		// serait vraie parce qu il n y a rien a comparer.
		expect(LISTES_A_ELEMENTS_STRUCTURES.length).toBeGreaterThan(0)
		expect(chemins.size).toBeGreaterThan(0)
	})

	it('retirer une entree de COLLECTIONS_IDENTIFIEES fait rougir la derivation', () => {
		// DISCRIMINANCE de la dérivation (désaccord C5) : sans elle, `LISTES_REQUISES`
		// tout entier passerait pour « la bonne réponse » et la soustraction ne
		// mesurerait rien. La dérivation est REJOUÉE sur une table amputée — jamais
		// une seconde liste de résultats, que la première assertion épingle sur la
		// valeur réelle.
		const deriver = (collections: readonly { path: string }[]): string[] =>
			LISTES_REQUISES.filter((liste) => !collections.some((collection) => collection.path === liste.path)).map(
				(liste) => liste.path,
			)

		expect(deriver(COLLECTIONS_IDENTIFIEES)).toEqual(LISTES_A_ELEMENTS_STRUCTURES.map((liste) => liste.path))
		// Le trou réel vaut TROIS chemins — remesuré ici, jamais recopié (KR-159).
		expect(LISTES_A_ELEMENTS_STRUCTURES).toHaveLength(3)
		expect(LISTES_A_ELEMENTS_STRUCTURES.map((liste) => liste.path)).toEqual([
			'monde.personnages[].plan_actions',
			'monde.personnages[].savoirs',
			'monde.evenements[].resolutions',
		])

		// Sans sa ligne dans `COLLECTIONS_IDENTIFIEES`, le climat RENTRERAIT dans la
		// dérivation : c'est ce qui rend l'oubli d'une collection visible ici plutôt
		// qu'invisible dans une cinquième table.
		const sansClimat = COLLECTIONS_IDENTIFIEES.filter((collection) => collection.path !== 'monde.conditions.climat')

		expect(deriver(sansClimat)).toContain('monde.conditions.climat')
		expect(deriver(sansClimat)).toHaveLength(LISTES_A_ELEMENTS_STRUCTURES.length + 1)
	})

	it('la derivation lit les deux tables, jamais un litteral des trois chemins', () => {
		// KR-169 : « DÉRIVÉE, jamais une cinquième table » est une propriété affirmée en
		// docstring. Elle ne se porte pas par le typage — une table écrite à la main
		// aurait exactement le même type —, donc elle se lit dans la SOURCE.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'tables.ts'), 'utf8')
		const declaration = source.slice(source.indexOf('export const LISTES_A_ELEMENTS_STRUCTURES'))

		expect(declaration).toContain('LISTES_REQUISES.filter')
		expect(declaration).toContain('COLLECTIONS_IDENTIFIEES.some')
		for (const liste of LISTES_A_ELEMENTS_STRUCTURES) {
			expect(declaration.slice(0, declaration.indexOf('\n)')).includes(liste.path)).toBe(false)
		}
	})

	it('le balayage entre reellement dans les tableaux et normalise les indices', () => {
		// Discriminant de l'instrument lui-même : l'ancien walker s'arrêtait à deux
		// niveaux et ignorait les tableaux — ces trois chemins lui étaient invisibles.
		const chemins = cheminsDeLaFixture()

		expect(chemins).toContain('monde.personnages[].savoirs[].revele_si.jet.carac')
		expect(chemins).toContain('charpente.jalons[].enonce_texte')
		// Un chemin d'effet à DEUX niveaux de tableau, DÉRIVÉ de la table plutôt que
		// re-listé : une seconde liste de chemins de delta divergerait en silence.
		const imbriques = CHEMINS_DE_DELTAS.filter((delta) => delta.path.split('[]').length - 1 >= 2)
		expect(imbriques.length).toBeGreaterThan(0)
		for (const delta of imbriques) expect(chemins).toContain(`${delta.path}[]`)
		// Normalisation : les deux indices de la fixture donnent UN chemin, pas deux.
		expect(chemins.filter((chemin) => chemin === 'monde.indices[].id')).toHaveLength(1)
	})
})
