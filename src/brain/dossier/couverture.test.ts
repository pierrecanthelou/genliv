import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import type { DossierIssue } from './issues'
import { DESTINATION_DES_CHAMPS } from './destinations'
import {
	BUDGETS_DE_MOTS,
	CHAMPS_ENTIERS,
	CHAMPS_REQUIS,
	CHEMINS_DE_DELTAS,
	ENUMERES_FERMES,
	FAMILLES_DE_CONDITIONS,
	LISTES_A_ELEMENTS_STRUCTURES,
	LISTES_OPTIONNELLES_STRUCTUREES,
	LISTES_OPTIONNELLES_TEXTUELLES,
	LISTES_REQUISES,
	RACINES,
	REFERENCES_SIMPLES,
} from './tables'
import { BUDGET_MOTS_CANON } from './types'
import { COLLECTIONS_IDENTIFIEES } from './identifiers'
import { PREDICATES } from './predicates'
import { DELTAS } from './deltas'
import { CURSEUR_VALUES } from './curseurs'
import { CHARACTERISTIC_VALUES } from '../characteristics'

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
 *    rester totales. Défaut réel, journalisé BUG-050 — non pas couvert ici mais
 *    par `LISTES_A_ELEMENTS_STRUCTURES`, dont la moitié requise est DÉRIVÉE de
 *    `LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES` (itération 4 de la n° 1) et
 *    la moitié optionnelle DÉCLARÉE dans `LISTES_OPTIONNELLES_STRUCTUREES`
 *    (itération 4 de la n° 4, trou résiduel : la dérivation ne pouvait par
 *    construction voir aucune liste OPTIONNELLE). Ce balayage ne peut toujours pas
 *    le voir : il corrompt une feuille EXISTANTE, il n'en change jamais le porteur.
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
		...CHAMPS_ENTIERS.map((c) => ['CHAMPS_ENTIERS', c.path] as const),
		...LISTES_REQUISES.map((l) => ['LISTES_REQUISES', l.path] as const),
		...LISTES_OPTIONNELLES_STRUCTUREES.map((l) => ['LISTES_OPTIONNELLES_STRUCTUREES', l.path] as const),
		...LISTES_OPTIONNELLES_TEXTUELLES.map((l) => ['LISTES_OPTIONNELLES_TEXTUELLES', l.path] as const),
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
 * Le motif partagé des proses d'entité — DIX-SEPT aujourd'hui, remesuré et jamais
 * recopié (KR-159) : les TROIS de `Lieu` (itération 4 de la n° 3), les TROIS
 * d'identité d'un `Personnage` (itération 2 de la n° 4), les DEUX proses libres
 * de son `but` (itération 4 de la n° 4 : `pourquoi` et `echeance` — `libelle`, lui,
 * est REQUIS dans son bloc, donc couvert par la corruption), la note d'auteur de
 * sa `presence[]` (itération 5 : `quand`), les DEUX lignes rouges de son
 * `caractere` (itération 8 : `jamais` et `cede_si` — `parler[]`, lui, porte son
 * propre motif, ses éléments étant des chaînes de LISTE et non une prose de champ),
 * L'UNIQUE prose d'un `Objet` (itération 1 de la n° 5 : `description_joueur`) et les
 * DEUX d'un `Indice` (itération 1 de la n° 6 : `verite` et `formulation_joueur` —
 * `mene_a[]`, lui, N'EST PAS ici, étant une RÉFÉRENCE dont la corruption est refusée
 * par `REFERENCES_SIMPLES`, et une dispense à son nom serait morte), L'UNIQUE
 * prose d'une `Fin` (itération 2 de la n° 6 : `texte` — `condition_texte`, lui,
 * N'EST PAS ici, étant à la fois REQUIS et jumeau prose d'une condition) et les DEUX
 * proses libres d'une `Quete` (itération 3 de la n° 6 : `consigne` et `echeance` —
 * `etapes[].libelle`, lui, N'EST PAS ici, étant REQUIS dans son élément, et
 * `donneur_id` non plus, étant une RÉFÉRENCE ; deux dispenses à leurs noms seraient
 * mortes).
 * Il
 * est DISTINCT de `TEXTE_OPTIONNEL_LIBRE`, et pas par style : celui-là dispense le
 * jumeau prose d'une CONDITION, dont l'absence est calme PAR D1 et dont la
 * présence sans `…_expr` déclenche un avertissement. Ceux-là n'ont aucun
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
	// MÊME MOTIF que son voisin ci-dessus, alors même que les deux familles se
	// comportent à l'OPPOSÉ sur l'ABSENCE du jumeau `…_expr` (l'étape se tait, la
	// contre-mesure avertit) : la dispense ne parle pas de l'absence du jumeau mais
	// de la CORRUPTION du texte en NOMBRE, que la règle D1 ne regarde ni dans un cas
	// ni dans l'autre (`typeof texte !== 'string' → continue`).
	'monde.personnages[].contre_mesures[].declencheur_texte': TEXTE_OPTIONNEL_LIBRE,
	'monde.evenements[].declencheur_texte': TEXTE_OPTIONNEL_LIBRE,
	'monde.personnages[].nom': NOM_LIBRE,
	'monde.personnages[].plan_actions[].etape':
		"l'ordre d'une étape : aucune règle d'ordonnancement (unicité, continuité, départ à 1) n'est arbitrée au schéma 1 — les déclencheurs arrivent en itération 3.",
	'monde.personnages[].savoirs[].revele_comment':
		'didascalie OPTIONNELLE et libre : son absence est calme, et aucune règle ne contraint sa forme.',
	// MÊME NATURE que `revele_comment` ci-dessus — une didascalie, pas une condition
	// — et la dispense tient MALGRÉ le contrôle isolé livré par l'itération 4 : celui
	// -ci parle de la PRÉSENCE de la porte de sortie sans sa `duree`, jamais de sa
	// FORME, et il produit un AVERTISSEMENT là où la corruption exige un refus. Les
	// deux instruments ne se recouvrent pas ; les confondre laisserait croire la
	// forme gardée.
	'monde.personnages[].plan_actions[].si_bloque':
		"didascalie de sortie OPTIONNELLE : le contrôle isolé de l'itération 4 exige une `duree` quand elle est PRÉSENTE — un avertissement, pas un refus — et ne dit rien de sa forme. Même question ouverte que les dispenses « nom », propriétaire n° 2 bascule-editeur.",
	// ⚠ DEUX DISPENSES ONT DISPARU D'ICI À L'ITÉRATION 1 DE LA N° 6, et leur
	// disparition est le résultat le plus visible de son lot contrat — écrit plutôt
	// que laissé au diff. `monde.personnages[].savoirs[].revele_si.apres_indice_id` et
	// `monde.personnages[].objectif_id` étaient dispensés parce que la boucle de
	// `REFERENCES_SIMPLES` se taisait sur TOUTE valeur non textuelle
	// (`typeof site.valeur !== 'string' → continue`) : leur corruption chaîne → NOMBRE
	// traversait `ok: true`. Cette boucle distingue désormais TROIS états — absent
	// (calme), chaîne vide (calme), tout le reste (`identifiant-invalide`) —, donc les
	// deux chemins sont COUVERTS PAR LA CORRUPTION. Deux dispenses laissées là
	// auraient ABSORBÉ la perte de la règle qu'elles nomment, ce que le test
	// d'auto-nettoyage (BUG-044) refuse. Leur non-régression est nommée dans
	// `validate.test.ts`.
	// Les TROIS proses d'identité (it2 de la n° 4) : même motif, mot pour mot, que
	// les trois proses de `Lieu` — une prose d'entité sans jumeau structuré, dont la
	// corruption remplace la chaîne par un NOMBRE. Une SECONDE constante au texte
	// voisin divergerait en silence : une seule, six clés.
	'monde.personnages[].fonction': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].apparence': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].description_joueur': PROSE_D_ENTITE_LIBRE,
	// Les DEUX proses libres du `but` (it4). `libelle` n'est PAS ici, et c'est le
	// point de contrat qui se voit le mieux à cet endroit : il est requis DANS son
	// bloc, donc sa corruption est refusée et une dispense à son nom serait morte —
	// le test « une dispense nommant une feuille deja couverte est morte » le dirait.
	'monde.personnages[].but.pourquoi': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].but.echeance': PROSE_D_ENTITE_LIBRE,
	// LA NOTE D'AUTEUR D'UNE PRÉSENCE (it5), MESURÉE et non supposée : le plan
	// d'itération annonçait « aucune ligne neuve requise » dans ce fichier, ce qui est
	// vrai des CINQ autres chemins — `cible_id`/`lien`/`lieu_id` sont requis dans leur
	// élément (corruption chaîne → nombre refusée), `intensite` et `secret` sont des
	// ensembles fermés. `quand` est le seul optionnel LIBRE des six, exactement comme
	// `but.echeance` juste au-dessus : même motif, même propriétaire de la question.
	'monde.personnages[].presence[].quand': PROSE_D_ENTITE_LIBRE,
	// LES DEUX LIGNES ROUGES DU CARACTÈRE (it8), même motif que les proses ci-dessus
	// et pour la même raison : aucune règle du schéma 1 n'arbitre leur forme quand
	// elles sont présentes, et leur absence est calme. Les SIX curseurs, eux, ne sont
	// PAS ici — ils sont des ensembles fermés, donc leur corruption est refusée et une
	// dispense à leur nom serait morte ; c'est le même point de contrat que
	// `but.libelle`, et il se voit le mieux à cet endroit.
	'monde.personnages[].caractere.jamais': PROSE_D_ENTITE_LIBRE,
	'monde.personnages[].caractere.cede_si': PROSE_D_ENTITE_LIBRE,
	// L'ÉCHANTILLON DE VOIX porte un motif à lui, et la distinction n'est pas de
	// style : ce n'est pas une prose de CHAMP mais un ÉLÉMENT DE LISTE, exactement
	// comme `canon.interdits_ton[]` plus haut. Sa liste n'entre pas dans
	// `LISTES_OPTIONNELLES_STRUCTUREES` (qui ne contrôle que des listes d'OBJETS), et
	// sa cardinalité `PARLER_REPLIQUES` est une borne d'INTERFACE, jamais un chemin de
	// refus du SSOT — un document qui porte trois répliques est ACCEPTÉ.
	'monde.personnages[].caractere.parler[]':
		"échantillon de voix LIBRE : ses éléments sont des CHAÎNES, la liste n'a donc aucune règle d'élément (précédent « canon.interdits_ton[] »), et sa cardinalité est une borne d'INTERFACE, jamais un refus du schéma 1. Un élément présent mais non textuel tombe sous la question ouverte déjà possédée par la n° 2 bascule-editeur, la même qui porte les dispenses « nom ».",
	'monde.lieux[].nom': NOM_LIBRE,
	'monde.lieux[].description': PROSE_D_ENTITE_LIBRE,
	'monde.lieux[].ambiance': PROSE_D_ENTITE_LIBRE,
	'monde.lieux[].dangers': PROSE_D_ENTITE_LIBRE,
	'monde.objets[].nom': NOM_LIBRE,
	// L'UNIQUE PROSE D'UN OBJET (it1 de la n° 5), même motif mot pour mot que les
	// trois proses de `Lieu` juste au-dessus : une prose d'entité sans jumeau
	// structuré, dont la corruption remplace la chaîne par un NOMBRE, et qu'aucune
	// règle du schéma 1 n'arbitre. Elle n'est PAS dispensée pour cause de longueur :
	// `monde.objets[].description_joueur` n'entre dans AUCUNE ligne de
	// `BUDGETS_DE_MOTS` (KR-203, décision explicite d'absence de borne), ce que le
	// test nommé « texte long, aucun avertissement » plus bas prouve par un cas
	// POSITIF plutôt que par cette absence.
	'monde.objets[].description_joueur': PROSE_D_ENTITE_LIBRE,
	'monde.indices[].nom': NOM_LIBRE,
	// LES DEUX PROSES D'UN INDICE (it1 de la n° 6), même motif mot pour mot que les
	// douze précédentes : une prose d'entité sans jumeau structuré, dont la corruption
	// remplace la chaîne par un NOMBRE, et qu'aucune règle du schéma 1 n'arbitre.
	// `mene_a[]` n'a PAS de dispense, et c'est le point de contrat qui se voit le mieux
	// à cet endroit : c'est une RÉFÉRENCE, donc sa corruption en nombre est REFUSÉE
	// (`identifiant-invalide`) depuis le correctif de cette même itération — une
	// dispense à son nom serait morte, et le test « une dispense nommant une feuille
	// deja couverte est morte » le dirait.
	'monde.indices[].verite': PROSE_D_ENTITE_LIBRE,
	'monde.indices[].formulation_joueur': PROSE_D_ENTITE_LIBRE,
	'monde.quetes[].nom': NOM_LIBRE,
	// LES DEUX PROSES LIBRES D'UNE QUÊTE (it3 de la n° 6), même motif mot pour mot que
	// les quinze précédentes : une prose d'entité sans jumeau structuré, dont la
	// corruption remplace la chaîne par un NOMBRE, et qu'aucune règle du schéma 1
	// n'arbitre. `echeance` est bien ici et NON sous `TEXTE_OPTIONNEL_LIBRE` malgré son
	// nom de note d'auteur : elle n'a ni jumeau `…_expr`, ni ligne dans
	// `FAMILLES_DE_CONDITIONS` — précédent exact `but.echeance`, dispensée plus haut
	// sous ce même motif.
	//
	// LES DEUX AUTRES CHAMPS DE L'ITÉRATION N'Y SONT PAS, et c'est le point de contrat
	// qui se voit le mieux à cet endroit : `etapes[].libelle` est REQUIS DANS SON
	// ÉLÉMENT (`CHAMPS_REQUIS`), donc sa corruption chaîne → nombre est refusée par
	// `champ-requis-vide` ; `donneur_id` est une RÉFÉRENCE (`REFERENCES_SIMPLES`), donc
	// la même corruption est refusée par `identifiant-invalide`. Une dispense à l'un ou
	// à l'autre serait MORTE, et le test « une dispense nommant une feuille deja
	// couverte est morte » le dirait.
	'monde.quetes[].consigne': PROSE_D_ENTITE_LIBRE,
	'monde.quetes[].echeance': PROSE_D_ENTITE_LIBRE,
	'monde.evenements[].nom': NOM_LIBRE,
	'monde.conditions.climat[].nom': NOM_LIBRE,
	'charpente.jalons[].nom': NOM_LIBRE,
	'charpente.fins[].nom': NOM_LIBRE,
	// LA PROSE DE FIN (it2 de la n° 6), même motif mot pour mot que les quatorze
	// précédentes : une prose d'entité SANS jumeau structuré, dont la corruption
	// remplace la chaîne par un NOMBRE, et qu'aucune règle du schéma 1 n'arbitre.
	// Elle n'est PAS `TEXTE_OPTIONNEL_LIBRE` malgré son voisinage immédiat avec
	// `condition_texte`, et c'est le point de contrat qui se voit le mieux à cet
	// endroit : `condition_texte` est le jumeau prose d'une CONDITION (famille de
	// `FAMILLES_DE_CONDITIONS`, avertissement D1 quand son `…_expr` manque), et il
	// est REQUIS, donc sa corruption est refusée et une dispense à son nom serait
	// morte. `texte`, lui, n'a ni jumeau `…_expr`, ni famille, ni ligne dans
	// `CHAMPS_REQUIS` — aucun avertissement ne le concerne, et rien ne le refuse.
	'charpente.fins[].texte': PROSE_D_ENTITE_LIBRE,
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
		//
		// LA SONDE A CESSÉ DE SE DÉPLACER, et c'est l'itération 8 qui l'arrête. Elle
		// visait successivement la tranche de schéma À VENIR — `contre_mesures` en it4,
		// `relations` en it5, `caractere` ensuite — et cette cible-là vient d'être
		// instanciée : `dossier-fiches` est close, il n'existe plus AUCUNE tranche
		// interne où la déplacer. La supprimer était exclu (sans elle, `estInstancie`
		// pourrait rendre vrai pour tout et l'assertion ci-dessus serait une constante) ;
		// elle est donc REBASÉE sur un NÉGATIF DE FORME DE CHEMIN — un préfixe qui
		// s'arrête au milieu d'un segment —, exactement le motif que les deux dernières
		// lignes de ce test portaient déjà pour `plan` face à `plan_actions`. Ce négatif
		// ne se périme pas : il ne dépend d'aucun champ futur, seulement de la
		// normalisation sur séparateur qu'`estInstancie` promet.
		const feuilles = cheminsDeLaFixture()

		expect(estInstancie('monde.personnages[].caractere.curseur', feuilles)).toBe(false)
		// Et l'inverse, sur le chemin que l'itération 8 vient d'instancier — sans cette
		// ligne, la sonde ne dirait pas qu'elle sait aussi rendre `true` sur du neuf, et
		// le négatif ci-dessus passerait aussi sur un bloc `caractere` absent.
		expect(estInstancie('monde.personnages[].caractere.curseurs', feuilles)).toBe(true)
		// Les deux chemins de l'itération 5, gardés : ils prouvent que le `true` ne tient
		// pas à la seule tranche la plus récente.
		expect(estInstancie('monde.personnages[].relations', feuilles)).toBe(true)
		expect(estInstancie('monde.personnages[].presence', feuilles)).toBe(true)
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

	it('les 8 caracs sont moteur et instanciees dans les DEUX fixtures', () => {
		// Même construction que les deux tests ci-dessus, et pour la même raison
		// (KR-174) : « toute feuille a une destination » ne dit rien de la VALEUR,
		// « aucune ligne morte » ne dit rien de l'audience. Les deux moitiés nommées
		// ensemble épinglent l'arbitrage — `moteur` et non `ia` : une caractéristique est
		// un SEUIL (§ 2 de `docs/REGLES-DU-JEU.md`, réussite = dés ≤ carac), et un modèle
		// qui lit `FO: 9` connaît la marge avant que le moteur n'ait résolu.
		//
		// LES HUIT CHEMINS SONT DÉRIVÉS de `CHARACTERISTIC_VALUES`, jamais écrits en
		// littéral — c'est ce qui sépare ce test de celui des proses de `Lieu`, où
		// aucune table ne portait la liste. Ici le registre existe : huit littéraux en
		// divergeraient en silence le jour où une caractéristique s'ajouterait.
		//
		// LE MESSAGE D'ÉCHEC NOMME LE CHAMP, jamais un compte : les deux assertions
		// d'instanciation projettent la LISTE DES CHEMINS MANQUANTS, de sorte que le
		// rapport dise « monde.personnages[].stats.SE » et non « attendu 8, reçu 7 ».
		const chemin = (carac: string): string => `monde.personnages[].stats.${carac}`
		const CHEMINS_DE_CARACTERISTIQUES = CHARACTERISTIC_VALUES.map(chemin)
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		expect(CHEMINS_DE_CARACTERISTIQUES.filter((c) => !feuilles.includes(c))).toEqual([])
		// L'INSTANCE DANS LA RÉFÉRENCE est dans le MÊME test : le garde d'exhaustivité
		// balaie la fixture MINIMALE, donc un champ instancié là mais absent d'une
		// aventure réelle resterait vert partout.
		expect(CHEMINS_DE_CARACTERISTIQUES.filter((c) => !feuillesDeLaReference.includes(c))).toEqual([])
		for (const c of CHEMINS_DE_CARACTERISTIQUES) {
			expect(`${c} → ${DESTINATION_DES_CHAMPS[c]}`).toBe(`${c} → moteur`)
		}

		// Discriminant (a) : la dérivation rend réellement des chemins — sans cette
		// ligne, les trois assertions ci-dessus passeraient sur une liste vide.
		expect(CHEMINS_DE_CARACTERISTIQUES.length).toBeGreaterThan(0)
		// Discriminant (b) : la table de VALIDATION et la table d'AUDIENCE parlent des
		// MÊMES chemins. Elles dérivent du même registre aujourd'hui ; le jour où l'une
		// serait recopiée à la main, elles divergeraient sans qu'aucune des assertions
		// générales ne le voie — chacune ne regarde qu'une des deux.
		expect(ENUMERES_FERMES.filter((e) => e.path.includes('.stats.')).map((e) => e.path)).toEqual(
			CHEMINS_DE_CARACTERISTIQUES,
		)
		// Discriminant (c) : AUCUNE ligne porteuse `…stats` sans feuille (veto du
		// raffinage) — `feuillesDeLaFixture` ne rend jamais un objet non vide comme
		// feuille, donc une telle ligne serait morte le jour où elle serait écrite.
		expect(DESTINATION_DES_CHAMPS['monde.personnages[].stats']).toBeUndefined()
	})

	it('les DIX champs du plan d action portent leur destination exacte, dans les DEUX fixtures', () => {
		// Même construction que les quatre tests ci-dessus, et pour la même raison
		// (KR-174, leçon de BUG-051) : « toute feuille a une destination » ne dit rien
		// de la VALEUR, « aucune ligne morte » ne dit rien de l'audience. Nommées
		// ensemble, les deux moitiés épinglent les arbitrages de l'itération, et
		// notamment les DEUX que le comité a le plus disputés :
		//
		//  · `but.echeance` → `auteur`, CONTRE la cohérence de voisinage avec ses deux
		//    sœurs `ia` du même bloc : une échéance en prose reste une donnée d'horloge,
		//    et le précédent le plus proche est celui des `…_texte`. La bascule que ce
		//    test doit faire rougir est « les trois champs de `but` sont `ia` » ;
		//  · `si_bloque` → `ia` alors que `duree`, dans la MÊME étape, est `moteur` :
		//    l'IA joue la sortie, le moteur constate le blocage. La bascule à faire
		//    rougir est « tout ce qui touche à l'horloge est moteur ».
		//
		// Les chemins sont écrits en littéral, et c'est assumé — aucune table du dépôt
		// ne liste les champs d'un bloc d'écran ; le garde contre la divergence est
		// l'assertion d'instanciation ci-dessous, plus les deux assertions générales.
		const AUDIENCES: ReadonlyArray<readonly [string, string]> = [
			['monde.personnages[].but.libelle', 'ia'],
			['monde.personnages[].but.pourquoi', 'ia'],
			['monde.personnages[].but.echeance', 'auteur'],
			['monde.personnages[].plan_actions[].duree', 'moteur'],
			['monde.personnages[].plan_actions[].si_bloque', 'ia'],
			['monde.personnages[].contre_mesures[].action', 'ia'],
			['monde.personnages[].contre_mesures[].declencheur_texte', 'auteur'],
			['monde.personnages[].contre_mesures[].delai', 'moteur'],
			['monde.personnages[].contre_mesures[].portee', 'moteur'],
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const [chemin, audience] of AUDIENCES) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ${audience}`)
			// L'INSTANCE DANS LES DEUX FIXTURES, dans le même test : le garde
			// d'exhaustivité ne balaie que la MINIMALE, donc un champ instancié là mais
			// absent d'une aventure réelle resterait vert partout.
			expect(`${chemin} dans la minimale → ${feuilles.includes(chemin)}`).toBe(`${chemin} dans la minimale → true`)
			expect(`${chemin} dans la reference → ${feuillesDeLaReference.includes(chemin)}`).toBe(
				`${chemin} dans la reference → true`,
			)
		}

		// LE DIXIÈME champ — la condition structurée de la contre-mesure — n'est PAS
		// dans la liste ci-dessus, et ce n'est pas un oubli : son audience est déjà
		// épinglée PAR LA TABLE, dans « tout chemin finissant par …_expr a une
		// destination valant moteur ». L'écrire ici ferait une SECONDE liste de chemins
		// d'expression dans ce fichier — exactement ce que le test de dérivation de
		// l'arrêt interdit, et il vient de le prouver en rougissant sur ce commentaire.
		// Ce qui reste à vérifier ici est donc son instance dans l'AUTRE fixture, que
		// le test dérivé ne regarde pas.
		const CHEMIN_EXPR = FAMILLES_DE_CONDITIONS.map((famille) => famille.expr).filter((expr) =>
			expr.includes('contre_mesures'),
		)

		expect(CHEMIN_EXPR).toHaveLength(1)
		expect(feuillesDeLaReference).toContain(CHEMIN_EXPR[0])
		expect(feuilles).toContain(CHEMIN_EXPR[0])
	})

	it('les SIX champs de relations et de presence portent leur destination exacte, dans les DEUX fixtures', () => {
		// Même construction que les cinq tests ci-dessus, et pour la même raison
		// (KR-174, leçon de BUG-051) : « toute feuille a une destination » ne dit rien de
		// la VALEUR, « aucune ligne morte » ne dit rien de l'audience. Nommées ensemble,
		// les deux moitiés épinglent les TROIS arbitrages que le comité a disputés :
		//
		//  · `intensite` → `moteur` et non `ia`, contre le voisinage de `lien` : un
		//    modèle qui lit `-2` connaît la profondeur d'une inimitié que la scène n'a
		//    pas montrée. La bascule que ce test doit faire rougir est « tout ce qui
		//    décrit une relation est de la matière à jouer » ;
		//  · `secret` → `moteur` : le drapeau commande l'injection de sa propre ligne, il
		//    n'entre lui-même dans aucun contexte ;
		//  · `quand` → `auteur`, CONTRE le voisinage de `lieu_id` et par le même
		//    arbitrage que `but.echeance` : une disponibilité lue par le narrateur le
		//    ferait contredire la scène que le moteur vient d'assembler. La bascule à
		//    faire rougir est « une présence est du décor, donc `ia` ».
		//
		// Les chemins sont écrits en littéral, et c'est assumé — aucune table du dépôt ne
		// liste les champs d'un bloc d'écran ; le garde contre la divergence est
		// l'assertion d'instanciation ci-dessous, plus les deux assertions générales.
		const AUDIENCES: ReadonlyArray<readonly [string, string]> = [
			['monde.personnages[].relations[].cible_id', 'moteur'],
			['monde.personnages[].relations[].lien', 'ia'],
			['monde.personnages[].relations[].intensite', 'moteur'],
			['monde.personnages[].relations[].secret', 'moteur'],
			['monde.personnages[].presence[].lieu_id', 'moteur'],
			['monde.personnages[].presence[].quand', 'auteur'],
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const [chemin, audience] of AUDIENCES) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ${audience}`)
			// L'INSTANCE DANS LES DEUX FIXTURES, dans le même test : le garde
			// d'exhaustivité ne balaie que la MINIMALE, donc un champ instancié là mais
			// absent d'une aventure réelle resterait vert partout.
			expect(`${chemin} dans la minimale → ${feuilles.includes(chemin)}`).toBe(`${chemin} dans la minimale → true`)
			expect(`${chemin} dans la reference → ${feuillesDeLaReference.includes(chemin)}`).toBe(
				`${chemin} dans la reference → true`,
			)
		}
	})

	it('les SIX curseurs sont moteur et instancies dans les DEUX fixtures', () => {
		// MÊME CONSTRUCTION que les 8 caracs plus haut, et pour la même raison
		// (KR-174) : « toute feuille a une destination » ne dit rien de la VALEUR,
		// « aucune ligne morte » ne dit rien de l'audience. Les deux moitiés nommées
		// ensemble épinglent l'arbitrage — `moteur` et non `ia` : un modèle qui lit
		// `mefiance: 8` connaît l'exacte profondeur d'une méfiance que la scène n'a pas
		// montrée, et il la joue au premier tour. La bascule que ce test doit faire
		// rougir est « le caractère est de la matière à jouer, donc tout le bloc est
		// `ia` » — trois de ses quatre champs le sont, les curseurs non.
		//
		// LES SIX CHEMINS SONT DÉRIVÉS de `CURSEUR_VALUES`, jamais écrits en littéral :
		// le registre existe, et six littéraux en divergeraient en silence le jour où un
		// septième curseur s'ajouterait (KR-117).
		const chemin = (curseur: string): string => `monde.personnages[].caractere.curseurs.${curseur}`
		const CHEMINS_DE_CURSEURS = CURSEUR_VALUES.map(chemin)
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		// LE MESSAGE D'ÉCHEC NOMME LE CHAMP, jamais un compte : la liste des chemins
		// manquants, de sorte que le rapport dise « …curseurs.verve » et non « 5/6 ».
		expect(CHEMINS_DE_CURSEURS.filter((c) => !feuilles.includes(c))).toEqual([])
		expect(CHEMINS_DE_CURSEURS.filter((c) => !feuillesDeLaReference.includes(c))).toEqual([])
		for (const c of CHEMINS_DE_CURSEURS) {
			expect(`${c} → ${DESTINATION_DES_CHAMPS[c]}`).toBe(`${c} → moteur`)
		}

		// Discriminant (a) : la dérivation rend réellement des chemins — sans cette
		// ligne, les trois assertions ci-dessus passeraient sur une liste vide.
		expect(CHEMINS_DE_CURSEURS.length).toBeGreaterThan(0)
		// Discriminant (b) : la table de VALIDATION et la table d'AUDIENCE parlent des
		// MÊMES chemins. Elles dérivent du même registre aujourd'hui ; le jour où l'une
		// serait recopiée à la main, elles divergeraient sans qu'aucune des assertions
		// générales ne le voie — chacune ne regarde qu'une des deux.
		expect(ENUMERES_FERMES.filter((e) => e.path.includes('.curseurs.')).map((e) => e.path)).toEqual(CHEMINS_DE_CURSEURS)
		// Discriminant (c) : AUCUNE ligne PORTEUSE, ni sur le bloc `caractere` ni sur
		// son sous-bloc `curseurs` (veto du raffinage) — `feuillesDeLaFixture` ne rend
		// jamais un objet non vide comme feuille, donc l'une ou l'autre serait morte le
		// jour où elle serait écrite. Même point de contrat que `…stats` ci-dessus, à
		// DEUX étages cette fois.
		expect(DESTINATION_DES_CHAMPS['monde.personnages[].caractere']).toBeUndefined()
		expect(DESTINATION_DES_CHAMPS['monde.personnages[].caractere.curseurs']).toBeUndefined()
	})

	it('les TROIS proses de caractere sont ia et instanciees dans les DEUX fixtures', () => {
		// La MOITIÉ `ia` du bloc, séparée des six curseurs juste au-dessus parce que
		// c'est la coupure qui EST l'arbitrage : le chiffre reste au moteur, la voix va
		// au modèle. Même construction que les tests d'it4 et d'it5 (KR-174).
		//
		// `parler[]` porte le suffixe de LISTE, et ce n'est pas cosmétique : ses éléments
		// sont des chaînes, donc la feuille du balayage est l'ÉLÉMENT — précédent exact
		// `canon.interdits_ton[]`. Une ligne sans suffixe serait morte.
		//
		// La bascule que ce test doit faire rougir : passer `cede_si` à `moteur` en
		// croyant qu'un champ à gating de rôle n'est pas injecté. Il l'est — à UN rôle
		// (voir le prédicat, épinglé par le test suivant) : l'audience est `ia`, le
		// destinataire est restreint, et confondre les deux le rendrait inutile.
		const PROSES_DE_CARACTERE: ReadonlyArray<readonly [string, string]> = [
			['monde.personnages[].caractere.parler[]', 'ia'],
			['monde.personnages[].caractere.jamais', 'ia'],
			['monde.personnages[].caractere.cede_si', 'ia'],
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const [chemin, audience] of PROSES_DE_CARACTERE) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ${audience}`)
			expect(`${chemin} dans la minimale → ${feuilles.includes(chemin)}`).toBe(`${chemin} dans la minimale → true`)
			expect(`${chemin} dans la reference → ${feuillesDeLaReference.includes(chemin)}`).toBe(
				`${chemin} dans la reference → true`,
			)
		}
	})

	it('la prose d un objet est ia et instanciee dans les DEUX fixtures', () => {
		// LA SEULE LIGNE DE SCHÉMA DE L'ITÉRATION 1 DE LA N° 5, épinglée par la même
		// construction que ses six aînées ci-dessus, et pour la même raison (KR-174,
		// leçon de BUG-051) : « toute feuille a une destination » ne dit rien de la
		// VALEUR, « aucune ligne morte » ne dit rien de l'audience. Nommées ensemble,
		// les deux moitiés épinglent l'arbitrage — `ia` et non `auteur` : ce que le
		// joueur voit d'un objet qu'il tient est de la donnée de jeu que le narrateur
		// du Temps 2 LIT pour la raconter, pas une note de rédaction.
		//
		// La bascule que ce test doit faire rougir : passer ce champ à `moteur` en
		// croyant que le suffixe `_joueur` désigne une prose émise verbatim. Il désigne
		// l'AUDIENCE, jamais le RÉGIME — même piège que sur le champ jumeau du
		// personnage, et c'est pour cela que les deux tests le disent chacun.
		//
		// L'INSTANCE DANS LA RÉFÉRENCE est dans le MÊME test : le garde d'exhaustivité
		// balaie la fixture MINIMALE, donc un champ instancié là mais absent d'une
		// aventure réelle resterait vert partout. Un champ que la référence n'exerce pas
		// n'est pas un champ qu'on sait utiliser.
		const PROSE_D_OBJET = 'monde.objets[].description_joueur'
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		expect(`${PROSE_D_OBJET} → ${DESTINATION_DES_CHAMPS[PROSE_D_OBJET]}`).toBe(`${PROSE_D_OBJET} → ia`)
		expect(`${PROSE_D_OBJET} dans la minimale → ${feuilles.includes(PROSE_D_OBJET)}`).toBe(
			`${PROSE_D_OBJET} dans la minimale → true`,
		)
		expect(`${PROSE_D_OBJET} dans la reference → ${feuillesDeLaReference.includes(PROSE_D_OBJET)}`).toBe(
			`${PROSE_D_OBJET} dans la reference → true`,
		)
		// Discriminant : le `nom` VOISIN, sur la même entité, reste `auteur`. Sans cette
		// ligne, l'assertion ci-dessus passerait aussi sur une table qui aurait basculé
		// TOUT l'objet vers `ia` — c'est-à-dire sur la réouverture silencieuse de la
		// question transverse que KR-195 laisse fermée jusqu'à l'assembleur n° 10.
		expect(`monde.objets[].nom → ${DESTINATION_DES_CHAMPS['monde.objets[].nom']}`).toBe('monde.objets[].nom → auteur')
	})

	it('les TROIS champs d un indice portent leur destination exacte, dans les DEUX fixtures', () => {
		// Même construction que ses sept aînées ci-dessus, et pour la même raison
		// (KR-174, leçon de BUG-051) : « toute feuille a une destination » ne dit rien de
		// la VALEUR, « aucune ligne morte » ne dit rien de l'audience. Nommées ensemble,
		// les deux moitiés épinglent les arbitrages de l'itération :
		//
		//  · `verite` → `ia` et non `auteur` : c'est de la DONNÉE DE JEU, celle que le
		//    protocole de révélation de la n° 12 fait traverser vers le modèle quand le
		//    moteur a constaté l'indice acquis. La bascule que ce test doit faire rougir
		//    est « la vérité est réservée au MJ, donc c'est une note de rédaction » — le
		//    MJ, ici, c'est le modèle ;
		//  · `mene_a[]` → `moteur` et non `ia`, CONTRE le voisinage de ses deux proses :
		//    un identifiant est un handle, et la liste des indices débloqués est la SUITE
		//    de l'enquête. Un narrateur qui la lit y mène le joueur au lieu de le laisser
		//    chercher. La bascule à faire rougir est « tout ce qui décrit un indice est de
		//    la matière à raconter ».
		//
		// LE SUFFIXE `[]` DE `mene_a` N'EST PAS COSMÉTIQUE : ses éléments sont des
		// chaînes, donc la feuille du balayage est l'ÉLÉMENT — précédent exact
		// `caractere.parler[]` et `canon.interdits_ton[]`. Une ligne sans suffixe serait
		// morte.
		const CHAMPS_D_INDICE: ReadonlyArray<readonly [string, string]> = [
			['monde.indices[].verite', 'ia'],
			['monde.indices[].formulation_joueur', 'ia'],
			['monde.indices[].mene_a[]', 'moteur'],
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const [chemin, audience] of CHAMPS_D_INDICE) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ${audience}`)
			// L'INSTANCE DANS LES DEUX FIXTURES, dans le même test : le garde
			// d'exhaustivité ne balaie que la MINIMALE, donc un champ instancié là mais
			// absent d'une aventure réelle resterait vert partout. Pour `mene_a` c'est plus
			// qu'une précaution : une LISTE VIDE est une feuille pour le balayage, donc une
			// fixture qui en porterait une n'exercerait JAMAIS la clé `…mene_a[]` — ni sa
			// ligne d'audience, ni sa ligne de `REFERENCES_SIMPLES`.
			expect(`${chemin} dans la minimale → ${feuilles.includes(chemin)}`).toBe(`${chemin} dans la minimale → true`)
			expect(`${chemin} dans la reference → ${feuillesDeLaReference.includes(chemin)}`).toBe(
				`${chemin} dans la reference → true`,
			)
		}

		// Discriminant : le `nom` VOISIN, sur la même entité, reste `auteur`. Sans cette
		// ligne, les assertions ci-dessus passeraient aussi sur une table qui aurait
		// basculé TOUT l'indice vers `ia` — c'est-à-dire sur la réouverture silencieuse
		// de la question transverse que KR-195 laisse fermée jusqu'à l'assembleur n° 10.
		expect(`monde.indices[].nom → ${DESTINATION_DES_CHAMPS['monde.indices[].nom']}`).toBe(
			'monde.indices[].nom → auteur',
		)
		// Et `portee` n'a AUCUNE ligne, délibérément (arbitrage d'it1 : elle reste au
		// type, sans consommateur, jusqu'à ce qu'un écran la rende). Une ligne écrite
		// d'avance serait MORTE — aucune fixture ne l'instancie — et l'assertion « aucune
		// ligne morte » la ferait rougir. Écrit ici pour que le jour où le bloc revient,
		// il revienne ENTIER : type + registre + table + audience + fixture + écran.
		expect(DESTINATION_DES_CHAMPS['monde.indices[].portee']).toBeUndefined()
	})

	it('le texte d une fin est moteur, instancie dans les DEUX fixtures, et OPTIONNEL', () => {
		// LA SEULE LIGNE DE SCHÉMA DE L'ITÉRATION 2 DE LA N° 6, épinglée par la même
		// construction que les tests d'audience ci-dessus (aucun compte recopié ici :
		// ceux qu'ils portent sont déjà décalés, KR-159/KR-176), et pour la même raison
		// (KR-174, leçon de BUG-051) : « toute feuille a une destination » ne dit rien
		// de la VALEUR, « aucune ligne morte » ne dit rien de l'audience. Nommées
		// ensemble, les deux moitiés épinglent l'arbitrage — `moteur`, et il se dispute
		// contre LES DEUX autres audiences, ce qui est propre à ce champ :
		//
		//  · contre `ia`, parce que la prose d'une fin ressemble aux proses en
		//    `…_joueur` du monde (`objets[].description_joueur`,
		//    `indices[].formulation_joueur`), qui sont INJECTÉES. Celle-ci est ÉMISE
		//    VERBATIM — à cette itération, le second champ du schéma dans ce cas après
		//    `charpente.depart.texte_ouverture_joueur` —, et la faire écrire au modèle
		//    la ferait varier d'une partie à l'autre. La bascule que ce test doit faire
		//    rougir est « toute prose lue par le joueur est de la matière à raconter » ;
		//  · contre `auteur`, parce que son voisin immédiat `condition_texte` l'est. Ce
		//    voisin est une NOTE DE RÉDACTION que personne ne lira jamais en jeu ;
		//    celui-ci est la seule chose que le joueur lira de cette fin.
		//
		// Consommateur : n° 15 `moteur-fins`.
		const TEXTE_DE_FIN = 'charpente.fins[].texte'
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		expect(`${TEXTE_DE_FIN} → ${DESTINATION_DES_CHAMPS[TEXTE_DE_FIN]}`).toBe(`${TEXTE_DE_FIN} → moteur`)
		// L'INSTANCE DANS LES DEUX FIXTURES, dans le même test : le garde d'exhaustivité
		// ne balaie que la MINIMALE, donc un champ instancié là mais absent d'une
		// aventure réelle resterait vert partout.
		expect(`${TEXTE_DE_FIN} dans la minimale → ${feuilles.includes(TEXTE_DE_FIN)}`).toBe(
			`${TEXTE_DE_FIN} dans la minimale → true`,
		)
		expect(`${TEXTE_DE_FIN} dans la reference → ${feuillesDeLaReference.includes(TEXTE_DE_FIN)}`).toBe(
			`${TEXTE_DE_FIN} dans la reference → true`,
		)

		// Discriminant : les DEUX voisines de la MÊME entité gardent leur audience.
		// Sans ces lignes, l'assertion ci-dessus passerait aussi sur une table qui
		// aurait basculé TOUTE la fin vers `moteur` — c'est-à-dire sur la perte
		// silencieuse du veto D1 sur `condition_texte` (KR-174).
		expect(`charpente.fins[].condition_texte → ${DESTINATION_DES_CHAMPS['charpente.fins[].condition_texte']}`).toBe(
			'charpente.fins[].condition_texte → auteur',
		)
		expect(`charpente.fins[].nom → ${DESTINATION_DES_CHAMPS['charpente.fins[].nom']}`).toBe(
			'charpente.fins[].nom → auteur',
		)

		// L'OPTIONNALITÉ (KR-191), LUE DES TABLES et jamais affirmée : rien de déjà
		// persisté ne devient invalide, et aucune borne de longueur ne s'invente au
		// passage (KR-203, même famille que `Objet.description_joueur`).
		expect(CHAMPS_REQUIS.filter((champ) => champ.path === TEXTE_DE_FIN)).toEqual([])
		expect(BUDGETS_DE_MOTS.filter((budget) => budget.path === TEXTE_DE_FIN)).toEqual([])

		// … et COMPORTEMENTALE, parce qu'une ligne absente d'une table ne prouve rien
		// du validateur : le dossier de RÉFÉRENCE dont on retire les deux proses de fin
		// reste accepté, SANS avertissement — une fin en cours de rédaction est un état
		// calme, jamais une alerte.
		const document = documentDeReference()
		const charpente = document.charpente as { fins: { texte?: string }[] }
		for (const fin of charpente.fins) delete fin.texte

		const resultat = validateDossier(document)

		expect(resultat.warnings.map(lisible)).toEqual([])
		expect(resultat.errors.map(lisible)).toEqual([])
		expect(resultat.ok).toBe(true)

		// SONDE DE DISCRIMINANCE (KR-199) — sans elle, l'assertion ci-dessus resterait
		// verte le jour où `validateDossier` cesserait de refuser POUR TOUT LE MONDE, et
		// le test dirait « ce champ est optionnel » en ne prouvant que « rien n'est
		// jamais refusé ». Le MÊME geste sur le voisin REQUIS de la même entité doit,
		// lui, faire refuser le document — et par son propre nom.
		const temoin = documentDeReference()
		const charpenteTemoin = temoin.charpente as { fins: { condition_texte?: string }[] }
		delete charpenteTemoin.fins[0].condition_texte

		const resultatTemoin = validateDossier(temoin)

		expect(resultatTemoin.errors.map((anomalie) => `${anomalie.code} → ${anomalie.path}`)).toEqual([
			'champ-requis-vide → charpente.fins[0].condition_texte',
		])
		expect(resultatTemoin.ok).toBe(false)
	})

	it('les QUATRE champs d une quete portent leur destination exacte, dans les DEUX fixtures', () => {
		// LES QUATRE LIGNES DE SCHÉMA DE L'ITÉRATION 3 DE LA N° 6, épinglées par la même
		// construction que leurs aînées ci-dessus, et pour la même raison (KR-174, leçon
		// de BUG-051) : « toute feuille a une destination » ne dit rien de la VALEUR,
		// « aucune ligne morte » ne dit rien de l'audience. Nommées ensemble, les deux
		// moitiés épinglent les arbitrages de l'itération — TROIS audiences en quatre
		// champs, et chacune se dispute contre une voisine immédiate :
		//
		//  · `donneur_id` → `moteur` et non `ia`, CONTRE l'idée qu'un narrateur aurait
		//    besoin de savoir qui donne la quête : un identifiant est un HANDLE, le code
		//    le résout, et le modèle reçoit le CONTENU du personnage sous l'audience DU
		//    PERSONNAGE. La bascule que ce test doit faire rougir est « tout ce qui
		//    décrit une quête est de la matière à raconter » ;
		//  · `consigne` → `ia` et non `auteur` : c'est le CONTENU JOUABLE de la quête,
		//    celui sans lequel un narrateur n'a rien à faire de cette entrée du registre.
		//    La bascule à faire rougir est « une quête est une note d'intrigue de
		//    l'auteur » ;
		//  · `etapes[].libelle` → `ia`, par cohérence avec `consigne` et par analogie au
		//    précédent structurel direct `plan_actions[].action`, déjà `ia` ;
		//  · `echeance` → `auteur`, CONTRE le voisinage de ses deux sœurs `ia` du même
		//    objet, et par le MÊME arbitrage que `but.echeance` et `presence[].quand` :
		//    une échéance lue par le narrateur le fait faire tomber l'horloge quand la
		//    scène s'y prête, pendant que le moteur n'a rien constaté. La bascule à faire
		//    rougir est « les quatre champs d'une quête sont du contenu de jeu ».
		//
		// Les chemins sont écrits en littéral, et c'est assumé — aucune table du dépôt ne
		// liste les champs d'une entité ; le garde contre la divergence est l'assertion
		// d'instanciation ci-dessous, plus les deux assertions générales.
		const CHAMPS_DE_QUETE: ReadonlyArray<readonly [string, string]> = [
			['monde.quetes[].donneur_id', 'moteur'],
			['monde.quetes[].consigne', 'ia'],
			['monde.quetes[].etapes[].libelle', 'ia'],
			['monde.quetes[].echeance', 'auteur'],
		]
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		for (const [chemin, audience] of CHAMPS_DE_QUETE) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ${audience}`)
			// L'INSTANCE DANS LES DEUX FIXTURES, dans le même test : le garde
			// d'exhaustivité ne balaie que la MINIMALE, donc un champ instancié là mais
			// absent d'une aventure réelle resterait vert partout.
			expect(`${chemin} dans la minimale → ${feuilles.includes(chemin)}`).toBe(`${chemin} dans la minimale → true`)
			expect(`${chemin} dans la reference → ${feuillesDeLaReference.includes(chemin)}`).toBe(
				`${chemin} dans la reference → true`,
			)
		}

		// Discriminant : le `nom` VOISIN, sur la même entité, reste `auteur`. Sans cette
		// ligne, les assertions ci-dessus passeraient aussi sur une table qui aurait
		// basculé TOUTE la quête vers `ia` — c'est-à-dire sur la réouverture silencieuse
		// de la question transverse que KR-195 laisse fermée jusqu'à l'assembleur n° 10.
		expect(`monde.quetes[].nom → ${DESTINATION_DES_CHAMPS['monde.quetes[].nom']}`).toBe('monde.quetes[].nom → auteur')
		// Discriminant : AUCUNE ligne PORTEUSE sur la liste `etapes` elle-même — même
		// point de contrat que `…stats` et `…caractere.curseurs` plus haut :
		// `feuillesDeLaFixture` ne rend jamais un objet NON VIDE comme feuille, donc une
		// telle ligne serait morte le jour où elle serait écrite.
		expect(DESTINATION_DES_CHAMPS['monde.quetes[].etapes']).toBeUndefined()
	})

	it('le lien a la trame d un evenement est moteur, et ses DEUX valeurs sont instanciees', () => {
		// LA SEULE LIGNE DE SCHÉMA DE L'ITÉRATION 4 DE LA N° 6, épinglée par la même
		// construction que ses aînées ci-dessus, et pour la même raison (KR-174, leçon de
		// BUG-051) : « toute feuille a une destination » ne dit rien de la VALEUR,
		// « aucune ligne morte » ne dit rien de l'audience. Nommées ensemble, les deux
		// moitiés épinglent l'arbitrage — `moteur`, et il se dispute contre les DEUX
		// autres audiences :
		//
		//  · contre `ia`, parce que c'est une CLASSIFICATION, même famille que
		//    `personnages[].portee` et `objectifs[].camp`, tous deux `moteur` pour la
		//    même raison. Injecté, ce drapeau apprendrait au narrateur QUELLES rencontres
		//    sont décoratives : il jouerait les libres comme du remplissage et conduirait
		//    le joueur vers les autres. La bascule que ce test doit faire rougir est
		//    « savoir si une scène compte aide le narrateur à doser » ;
		//  · contre `auteur`, parce que ce n'est pas une note de rédaction mais un FILTRE
		//    que le CODE lit — le registre des événements se partage en deux onglets sur
		//    cette seule valeur.
		const LIEN_A_LA_TRAME = 'monde.evenements[].lie_a_histoire'
		const feuilles = cheminsDeLaFixture()
		const feuillesDeLaReference = feuillesDeLaFixture(documentDeReference()).map((feuille) => feuille.normalise)

		expect(`${LIEN_A_LA_TRAME} → ${DESTINATION_DES_CHAMPS[LIEN_A_LA_TRAME]}`).toBe(`${LIEN_A_LA_TRAME} → moteur`)
		// L'INSTANCE DANS LES DEUX FIXTURES : le garde d'exhaustivité ne balaie que la
		// MINIMALE, donc un champ instancié là mais absent d'une aventure réelle
		// resterait vert partout.
		expect(`${LIEN_A_LA_TRAME} dans la minimale → ${feuilles.includes(LIEN_A_LA_TRAME)}`).toBe(
			`${LIEN_A_LA_TRAME} dans la minimale → true`,
		)
		expect(`${LIEN_A_LA_TRAME} dans la reference → ${feuillesDeLaReference.includes(LIEN_A_LA_TRAME)}`).toBe(
			`${LIEN_A_LA_TRAME} dans la reference → true`,
		)

		// LES DEUX VALEURS SONT EXERCÉES, et cette moitié-là est propre à ce champ : un
		// ensemble fermé à deux valeurs dont les fixtures n'en porteraient qu'UNE serait
		// « instancié » au sens du garde d'exhaustivité tout en laissant l'autre onglet
		// de l'écran sans aucun document qui le peuple. La RÉFÉRENCE porte les deux —
		// une aventure réelle a des rencontres de trame ET des rencontres libres.
		const valeursDe = (document: Doc): unknown[] =>
			feuillesDeLaFixture(document)
				.filter((feuille) => feuille.normalise === LIEN_A_LA_TRAME)
				.map((feuille) => feuille.valeur)

		expect([...valeursDe(documentDeReference())].sort()).toEqual([false, true])
		// … et l'union des deux fixtures ne fait entrer aucune autre valeur : le jour où
		// un `"oui"` s'y glisserait, la ligne d'`ENUMERES_FERMES` le refuserait, mais ce
		// test le dirait par la valeur reçue plutôt que par un compte d'anomalies.
		expect([...new Set([...valeursDe(fixture()), ...valeursDe(documentDeReference())])].sort()).toEqual([false, true])

		// Discriminant : le `nom` VOISIN, sur la même entité, reste `auteur`. Sans cette
		// ligne, l'assertion d'audience passerait aussi sur une table qui aurait basculé
		// TOUT l'événement vers `moteur` — et le `resultat` d'une résolution, lui, doit
		// rester `ia`, c'est la seule matière que le narrateur joue de cet événement.
		expect(`monde.evenements[].nom → ${DESTINATION_DES_CHAMPS['monde.evenements[].nom']}`).toBe(
			'monde.evenements[].nom → auteur',
		)
		expect(
			`monde.evenements[].resolutions[].resultat → ${DESTINATION_DES_CHAMPS['monde.evenements[].resolutions[].resultat']}`,
		).toBe('monde.evenements[].resolutions[].resultat → ia')
	})

	it('description_joueur d un objet, texte long, aucun avertissement', () => {
		// KR-203, ET C'EST UN CAS POSITIF, pas une absence de doc : « aucune borne de
		// longueur » est une DÉCISION du cadrage, et une décision que rien n'exerce se
		// périme sans bruit. Trois moitiés, dans le même test parce qu'aucune ne vaut
		// seule.
		//
		// (a) STRUCTUREL — le champ n'entre dans AUCUNE ligne de `BUDGETS_DE_MOTS`,
		// seule table du schéma 1 qui plafonne un texte. Lu de la table, jamais affirmé.
		expect(BUDGETS_DE_MOTS.filter((budget) => budget.path.startsWith('monde.objets')).map((b) => b.path)).toEqual([])

		// (b) COMPORTEMENTAL — le dossier de RÉFÉRENCE (celui d'une aventure réelle,
		// KR-156) porte une description de DEUX fois le plus large budget du schéma, et
		// il reste accepté SANS avertissement. Le texte est dérivé de la constante, pas
		// d'un nombre en dur : le jour où le budget bouge, le témoin bouge avec lui.
		const TEXTE_TRES_LONG = Array.from({ length: BUDGET_MOTS_CANON * 2 }, (_, rang) => `mot${rang}`).join(' ')
		const document = documentDeReference()
		const monde = document.monde as { objets: { description_joueur?: string }[] }
		monde.objets[0].description_joueur = TEXTE_TRES_LONG

		const resultat = validateDossier(document)

		expect(resultat.warnings.map(lisible)).toEqual([])
		expect(resultat.errors.map(lisible)).toEqual([])
		expect(resultat.ok).toBe(true)

		// (c) SONDE DE DISCRIMINANCE (KR-199) — sans elle, (b) resterait vert le jour où
		// `validateDossier` cesserait d'avertir POUR TOUT LE MONDE, et le test dirait
		// « aucune borne sur ce champ » en ne prouvant que « aucun avertissement nulle
		// part ». Le MÊME texte, versé dans un champ qui, lui, PORTE un budget, doit
		// faire apparaître l'avertissement — et un seul.
		const temoin = documentDeReference()
		const canon = temoin.canon as { mj: { synopsis_mj: string } }
		canon.mj.synopsis_mj = TEXTE_TRES_LONG

		const resultatTemoin = validateDossier(temoin)

		expect(resultatTemoin.warnings.map((avertissement) => avertissement.code)).toEqual(['texte-trop-long'])
		// Un budget dépassé n'a JAMAIS bloqué un import, et ce n'est pas cette sonde qui
		// doit le faire croire.
		expect(resultatTemoin.ok).toBe(true)
	})

	it('le predicat de gating de cede_si est present aux DEUX sites, mot pour mot', () => {
		// MÊME INSTRUMENT que pour `secret` juste en dessous, et il vaut pour la même
		// raison : aucun assembleur n'existe avant la n° 10, donc l'EXCLUSION réelle
		// n'est exerçable par aucun test. Ce qui l'est — et ce qui décide de ce que la
		// n° 10 codera — est la PRÉSENCE du prédicat à ses deux sites, à l'identique.
		//
		// LE PLAN D'IT8 RANGEAIT CE POINT EN « non vérifiable en l'état » au motif que
		// « les commentaires ne sont pas accessibles à l'exécution ». C'est faux depuis
		// l'itération 5, qui a livré exactement cet instrument : le prédicat est LU du
		// JSDoc puis cherché dans `destinations.ts`. Ce qui reste hors instrument est
		// l'autre moitié — que l'assembleur RESPECTE le prédicat —, et elle le reste.
		//
		// Le prédicat n'est PAS écrit en littéral ici : une troisième copie ferait
		// exactement ce que le raffinage interdit (« une phrase, DEUX sites ») et se
		// périmerait en silence le jour où les deux autres changeraient ensemble.
		const types = fs.readFileSync(path.join(MODULE_DOSSIER, 'types.ts'), 'utf8')
		const destinations = fs.readFileSync(path.join(MODULE_DOSSIER, 'destinations.ts'), 'utf8')

		const sansPrefixe = (source: string): string =>
			source.replace(/\r?\n[ \t]*(\*|\/\/) ?/g, ' ').replace(/[ \t]+/g, ' ')
		const debut = "`cede_si` n'entre"
		const fin = "puisse l'adosser."
		const typesAplati = sansPrefixe(types)
		const depart = typesAplati.indexOf(debut)

		expect(depart).toBeGreaterThan(-1)

		const predicat = typesAplati.slice(depart, typesAplati.indexOf(fin, depart) + fin.length)

		// Discriminant : le prédicat extrait porte bien ses quatre clauses — le rôle
		// UNIQUE qui le reçoit, les trois exclusions, l'absence de condition de session,
		// et le moment. Sans elles, la comparaison ci-dessous vaudrait sur une phrase
		// tronquée.
		expect(predicat).toContain("**que** dans le contexte de l'appel")
		expect(predicat).toContain('**narrateur**')
		expect(predicat).toContain("celui de l'**arbitre**")
		expect(predicat).toContain('**dès le premier tour**')

		expect(sansPrefixe(destinations)).toContain(predicat)
	})

	it('le predicat de gating de secret est present aux DEUX sites, mot pour mot', () => {
		// CRITÈRE #7 DU PLAN D'IT5, et le seul instrument dont il dispose : aucun
		// assembleur n'existe avant la n° 10, donc l'EXCLUSION réelle n'est exerçable par
		// aucun test. Ce qui l'est — et ce qui décide de ce que la n° 10 codera — est la
		// PRÉSENCE du prédicat à ses deux sites, à l'identique.
		//
		// Le prédicat n'est PAS écrit en littéral ici : il est LU du JSDoc de
		// `Relation.secret` puis cherché dans `destinations.ts`. Une troisième copie dans
		// ce fichier ferait exactement ce que le raffinage interdit (« une phrase, DEUX
		// sites »), et se périmerait en silence le jour où les deux autres changeraient
		// ensemble.
		const types = fs.readFileSync(path.join(MODULE_DOSSIER, 'types.ts'), 'utf8')
		const destinations = fs.readFileSync(path.join(MODULE_DOSSIER, 'destinations.ts'), 'utf8')

		// Les quatre phrases du prédicat, extraites du JSDoc en effaçant le préfixe de
		// commentaire et les retours à la ligne — la seule chose qui diffère entre les
		// deux sites est ce préfixe (` * ` contre `// `).
		const sansPrefixe = (source: string): string =>
			source.replace(/\r?\n[ \t]*(\*|\/\/) ?/g, ' ').replace(/[ \t]+/g, ' ')
		const debut = "Une ligne de `relations[]` n'entre"
		const fin = "ni dans celui de l'arbitre."
		const typesAplati = sansPrefixe(types)
		const depart = typesAplati.indexOf(debut)

		expect(depart).toBeGreaterThan(-1)

		const predicat = typesAplati.slice(depart, typesAplati.indexOf(fin, depart) + fin.length)

		// Discriminant : le prédicat extrait porte bien ses quatre clauses, sans quoi la
		// comparaison ci-dessous vaudrait sur une phrase tronquée.
		expect(predicat).toContain("**que** dans le contexte de l'appel")
		expect(predicat).toContain('Si `secret !== true`')
		expect(predicat).toContain('**narrateur**')
		expect(predicat).toContain("Elle n'entre **jamais**")

		expect(sansPrefixe(destinations)).toContain(predicat)
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

		// LA MOITIÉ DÉRIVÉE, isolée par soustraction de la moitié DÉCLARÉE — sans cette
		// séparation, l'assertion comparerait la dérivation à une table qui contient en
		// plus des lignes qu'aucune dérivation ne peut produire, et il faudrait la
		// relâcher au lieu de la rendre plus précise.
		const moitieDerivee = LISTES_A_ELEMENTS_STRUCTURES.filter(
			(liste) => !LISTES_OPTIONNELLES_STRUCTUREES.some((optionnelle) => optionnelle.path === liste.path),
		).map((liste) => liste.path)

		expect(deriver(COLLECTIONS_IDENTIFIEES)).toEqual(moitieDerivee)
		// Le trou vaut SEPT chemins depuis l'itération 3 de la n° 6 — REMESURÉ ici,
		// jamais recopié (KR-159) : trois requis dérivés, plus les QUATRE listes
		// OPTIONNELLES structurées, que la dérivation ne peut pas voir (trou résiduel de
		// BUG-050). La quatrième, `monde.quetes[].etapes`, est la première de la moitié
		// déclarée à ne pas vivre sous `monde.personnages[]`.
		expect(LISTES_A_ELEMENTS_STRUCTURES).toHaveLength(7)
		expect(LISTES_A_ELEMENTS_STRUCTURES.map((liste) => liste.path)).toEqual([
			'monde.personnages[].plan_actions',
			'monde.personnages[].savoirs',
			'monde.evenements[].resolutions',
			'monde.personnages[].contre_mesures',
			'monde.personnages[].relations',
			'monde.personnages[].presence',
			'monde.quetes[].etapes',
		])
		// Discriminant du TROU RÉSIDUEL : la dérivation seule ne rend AUCUNE des trois
		// listes optionnelles. Sans cette ligne, on ne saurait pas dire si les trois
		// dernières entrées viennent de la déclaration ou d'un effet de bord de la
		// soustraction. Dérivé de la table déclarée — trois littéraux de plus ici
		// divergeraient d'elle en silence.
		for (const optionnelle of LISTES_OPTIONNELLES_STRUCTUREES) {
			expect(deriver(COLLECTIONS_IDENTIFIEES)).not.toContain(optionnelle.path)
		}

		// Sans sa ligne dans `COLLECTIONS_IDENTIFIEES`, le climat RENTRERAIT dans la
		// dérivation : c'est ce qui rend l'oubli d'une collection visible ici plutôt
		// qu'invisible dans une cinquième table.
		const sansClimat = COLLECTIONS_IDENTIFIEES.filter((collection) => collection.path !== 'monde.conditions.climat')

		expect(deriver(sansClimat)).toContain('monde.conditions.climat')
		expect(deriver(sansClimat)).toHaveLength(moitieDerivee.length + 1)
	})

	it('la derivation lit les deux tables, jamais un litteral de chemin', () => {
		// KR-169 : « DÉRIVÉE, jamais une table recopiée » est une propriété affirmée en
		// docstring. Elle ne se porte pas par le typage — une table écrite à la main
		// aurait exactement le même type —, donc elle se lit dans la SOURCE.
		//
		// Depuis l'itération 4, la déclaration a DEUX moitiés, et la propriété porte sur
		// le CORPS entier : les deux moitiés y sont des RÉFÉRENCES DE TABLE, aucune
		// n'est un chemin réécrit — y compris la moitié optionnelle, dont les chemins
		// vivent dans `LISTES_OPTIONNELLES_STRUCTUREES` et nulle part ailleurs.
		const source = fs.readFileSync(path.join(MODULE_DOSSIER, 'tables.ts'), 'utf8')
		const declaration = source.slice(source.indexOf('export const LISTES_A_ELEMENTS_STRUCTURES'))
		const corps = declaration.slice(0, declaration.indexOf('\n]'))

		expect(corps).toContain('LISTES_REQUISES.filter')
		expect(corps).toContain('COLLECTIONS_IDENTIFIEES.some')
		expect(corps).toContain('LISTES_OPTIONNELLES_STRUCTUREES')
		for (const liste of LISTES_A_ELEMENTS_STRUCTURES) {
			expect(`${liste.path} dans le corps → ${corps.includes(liste.path)}`).toBe(`${liste.path} dans le corps → false`)
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
