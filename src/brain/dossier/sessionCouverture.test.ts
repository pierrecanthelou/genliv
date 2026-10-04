import { POSTURE_VALUES } from '../combat'
import { SESSION_SATUREE } from './__fixtures__/session-saturee'
import { feuillesDeLaFixture } from './feuilles'
import type { EtatMonde, EtatPnj, EtatSession } from './session'
import { DESTINATION_DES_CHAMPS_DE_SESSION } from './sessionDestinations'

/**
 * LA GARDE DE `DESTINATION_DES_CHAMPS_DE_SESSION` — la table n'entre pas seule,
 * elle entre avec son balayage (KR-241), exactement comme `destinations.ts` est
 * entrée avec `couverture.test.ts`.
 *
 * DEUX PROPRIÉTÉS, ET ELLES NE SE RECOUVRENT PAS :
 *  · les CLÉS RACINES sont exhaustives PAR COMPILATION (`keyof EtatSession`) —
 *    propriété strictement plus forte que celle de `destinations.ts`, dont la
 *    docstring reconnaît elle-même que ses clés sont des chaînes ;
 *  · les CHEMINS DE FEUILLE sont exhaustifs PAR BALAYAGE d'une fixture saturée,
 *    et l'échec nomme LE CHAMP, jamais un compte.
 *
 * LE WALKER EST IMPORTÉ, JAMAIS RÉÉCRIT : `couverture.test.ts` exige que
 * `feuillesDeLaFixture` n'ait qu'un seul porteur dans le module
 * (`feuilles.ts`), et une seconde traversée divergerait en silence de la
 * première — c'est précisément le mode de défaillance que ces gardes existent
 * pour interdire.
 *
 * ── CE QUE CE BALAYAGE NE COUVRE PAS ────────────────────────────────────────
 * Nommé ici plutôt que découvert plus tard (KR-173) :
 *  · LES CONTENEURS. `feuillesDeLaFixture` ne rend JAMAIS un objet non vide comme
 *    feuille : `horloge`, `monde`, `journal`, `attente` (depuis le lot `contrat`
 *    de la n° 10, `moteur-interprete`), `memoire` (non nulle dans la fixture
 *    depuis l'it3), `heros` (depuis le lot `contrat` de la n° 11,
 *    `moteur-arbitre`) et `combat` (depuis le lot `contrat` de la n° 13,
 *    `moteur-combat`) n'ont donc aucune instance, et leurs SEPT lignes de table
 *    sont des DISPENSES DÉCLARÉES, pas des lignes mortes. Elles existent pour
 *    l'exhaustivité par compilation ;
 *  · L'AUDIENCE RÉELLE. La table déclare une intention et force une déclaration ;
 *    elle ne démontre pas le confinement — la moitié CODE de cette preuve est
 *    `moteurSansIA.test.ts`, et pour `attente.question`/`attente.saisie`
 *    spécifiquement, `assemblerInterprete` (`copilote/contexte/interprete.ts`)
 *    est le premier assembleur qui les injecte réellement.
 */

/**
 * LES SEPT DISPENSES, avec leur motif — modèle `SANS_DESTINATION` de
 * `couverture.test.ts`. Elles vivent DANS le test et non dans la table : une
 * dispense est un fait sur l'instrument, pas une audience.
 */
const DISPENSES_DE_FEUILLE: Readonly<Record<string, string>> = {
	horloge: 'clé racine porteuse — son unique feuille est `horloge.tour`',
	monde: 'clé racine porteuse — ses sept feuilles sont déclarées une à une',
	journal:
		'clé racine porteuse — ses onze feuilles sont déclarées une à une (`recit` depuis la n° 10 it2, `jet.carac`/`jet.tc` depuis la n° 11 it2, `interlocuteur` depuis la n° 12 it1)',
	attente: 'clé racine porteuse — ses trois feuilles (`type`, `question`, `saisie`) sont déclarées une à une',
	memoire:
		'clé racine porteuse quand elle retient quelque chose (n° 10 it3) — ses quatre feuilles sont déclarées une à une ; à `null`, elle est sa propre feuille',
	heros:
		'clé racine porteuse (n° 11 moteur-arbitre, it1) — ses huit feuilles sont déclarées une à une, `caracs` collapsée en une seule ligne `<id>`',
	combat:
		'clé racine porteuse (n° 13 moteur-combat, it1) — ses deux feuilles (`monstre_ref`, `postures[]`) sont déclarées une à une',
}

const CLES_DE_LA_TABLE = new Set(Object.keys(DESTINATION_DES_CHAMPS_DE_SESSION))

/**
 * LA NORMALISATION `<id>`, FAITE APRÈS LE RETOUR DU WALKER ET NULLE PART
 * AILLEURS — et c'est une mesure, pas une préférence : le walker efface les
 * INDICES DE TABLEAU (`[0]` → `[]`), jamais les CLÉS D'UN `Record`. Réutilisé tel
 * quel, il rend un chemin par personnage, et le balayage échouerait par
 * CARDINALITÉ au lieu d'échouer par nom de champ.
 *
 * Elle ne vit PAS dans `feuilles.ts` : `couverture.test.ts` exige que le walker
 * ait un porteur unique, et lui apprendre les clés de `Record` reviendrait à
 * ajouter un chemin de session à `CHEMINS_D_ARRET`, c'est-à-dire à faire entrer
 * la session dans l'instrument du dossier (§ 8, D-24).
 *
 * LES CLÉS SONT LUES DANS LA FIXTURE, jamais devinées par une expression
 * régulière : un identifiant de personnage CONTIENT un point (`pnj.aldur-le-sage`),
 * donc le chemin brut est `monde.pnj.pnj.aldur-le-sage.a_dit[]` et un découpage
 * sur le point se tromperait de segment.
 *
 * `heros.caracs` SUBIT LA MÊME NORMALISATION (n° 11 `moteur-arbitre`, it1), pour
 * la raison INVERSE de `monde.pnj` : ses huit clés sont une union FERMÉE
 * (`Characteristic`), jamais des identifiants arbitraires, mais les HUIT
 * partagent la MÊME audience (`'moteur'`, sans exception) — huit lignes de table
 * identiques seraient une redite, pas une distinction. Collapsée en
 * `heros.caracs.<id>`, même précédent que `monde.pnj.<id>`.
 */
function normaliserLesClesDeRecord(chemin: string): string {
	const sansPnj = Object.keys(SESSION_SATUREE.monde.pnj).reduce(
		(courant, cle) => courant.split(`monde.pnj.${cle}.`).join('monde.pnj.<id>.'),
		chemin,
	)
	const heros = SESSION_SATUREE.heros
	if (heros === undefined) return sansPnj
	return Object.keys(heros.caracs).reduce(
		(courant, cle) => courant.split(`heros.caracs.${cle}`).join('heros.caracs.<id>'),
		sansPnj,
	)
}

function cheminsDeLaSession(): string[] {
	return feuillesDeLaFixture(SESSION_SATUREE).map((feuille) => normaliserLesClesDeRecord(feuille.normalise))
}

describe('DESTINATION_DES_CHAMPS_DE_SESSION, exhaustivite', () => {
	it('toute feuille de la session saturee a une ligne de destination', () => {
		const sansAudience = cheminsDeLaSession().filter((chemin) => !CLES_DE_LA_TABLE.has(chemin))

		// L'échec nomme LE CHAMP. Un `toHaveLength(0)` compterait, et le jour où cette
		// ligne rougit, c'est le chemin reçu qu'on veut au rapport.
		expect(sansAudience).toEqual([])
	})

	it('aucune ligne morte, hors les sept dispenses declarees', () => {
		const chemins = cheminsDeLaSession()

		const mortes = [...CLES_DE_LA_TABLE]
			.filter((chemin) => !chemins.includes(chemin))
			.filter((chemin) => DISPENSES_DE_FEUILLE[chemin] === undefined)

		expect(mortes).toEqual([])

		// DISJONCTION (BUG-044) : une dispense qui nomme un chemin RÉELLEMENT instancié
		// ne dispense de rien — mais elle absorberait la perte de la ligne qu'elle
		// nomme. Elle doit tomber, et se nommer en tombant.
		expect(Object.keys(DISPENSES_DE_FEUILLE).filter((chemin) => chemins.includes(chemin))).toEqual([])

		// Et les sept dispenses sont bien DES LIGNES DE LA TABLE : une dispense qui
		// nommerait un chemin absent de la table serait, elle aussi, morte.
		expect(Object.keys(DISPENSES_DE_FEUILLE).filter((chemin) => !CLES_DE_LA_TABLE.has(chemin))).toEqual([])
	})

	it('toute cle racine de la session a sa ligne — le complement runtime de l exhaustivite par compilation', () => {
		// Le typage porte « toute clé de `EtatSession` a une ligne ». Cette ligne-ci
		// porte l'autre sens, que le typage ne voit pas : que la FIXTURE n'ait aucune
		// racine de plus que le type — un champ semé par une itération future sans
		// passer par `EtatSession` serait sinon invisible aux deux.
		const racines = Object.keys(SESSION_SATUREE)

		expect(racines.filter((cle) => !CLES_DE_LA_TABLE.has(cle))).toEqual([])
		// Discriminance : un balayage vide rendrait la ligne ci-dessus vraie sans rien
		// prouver. ONZE racines depuis le lot `contrat` de la n° 13 (`moteur-combat`) —
		// `dossier_maj` est la huitième (2ᵉ exemption nommée à KR-249), `attente` la
		// neuvième (KR-251), `heros` la dixième, `combat` la onzième, toutes deux
		// optionnelles à vie (KR-251) mais bien INSTANCIÉES ici.
		expect(racines).toHaveLength(11)
		expect(racines).toContain('combat')
	})

	it('le balayage descend reellement, et la normalisation COLLAPSE les cles de Record', () => {
		// DISCRIMINANCE DE L'INSTRUMENT (BUG-084) : sans ces lignes, les trois
		// assertions ci-dessus seraient vertes sur un balayage qui ne rendrait rien.
		const bruts = feuillesDeLaFixture(SESSION_SATUREE).map((feuille) => feuille.normalise)
		const normalises = cheminsDeLaSession()

		// La fixture porte DEUX personnages : le walker rend donc DEUX chemins BRUTS
		// distincts pour `a_dit[]` (un par personnage) — TROIS au total depuis l'it3
		// de la n° 12 (`moteur-acteurs`), `pnj.aldur-le-sage` portant EN PLUS sa
		// feuille `confiance`. La table, elle, n'en déclare que DEUX (`a_dit[]` et
		// `confiance`, chacune collapsée sur `<id>`) : c'est exactement ce que la
		// normalisation existe pour résoudre — avec un seul personnage par feuille,
		// elle serait indistinguable de son absence.
		expect(new Set(bruts.filter((chemin) => chemin.startsWith('monde.pnj.'))).size).toBe(3)
		expect(new Set(normalises.filter((chemin) => chemin.startsWith('monde.pnj.'))).size).toBe(2)
		expect(normalises).toContain('monde.pnj.<id>.a_dit[]')
		// ET LA CONFIANCE (n° 12 `moteur-acteurs`, it3) EST BIEN INSTANCIÉE — sur un
		// seul des deux PNJ, précisément pour que l'autre enseigne « absent ≠ vide ».
		expect(normalises).toContain('monde.pnj.<id>.confiance')

		// Et les listes sont bien balayées PAR ÉLÉMENT : une session d'OUVERTURE, dont
		// toutes les listes sont vides, rendrait `monde.lieux_visites` SANS le suffixe,
		// et les quinze lignes de feuille seraient mortes le jour même (§ 8, D-15).
		expect(normalises).toContain('monde.lieux_visites[]')
		expect(normalises).toContain('journal[].texte')

		// ET LE BALAYAGE DESCEND DANS LES `deltas` D'UNE ENTRÉE (itération 3) : ce sont
		// des objets DANS une liste DANS une liste, la seule imbrication de ce genre de
		// toute la session. Sans ces lignes, les trois lignes de table neuves seraient
		// tenues par « aucune ligne morte » et par rien qui nomme le chemin.
		expect(normalises).toContain('journal[].deltas[].delta')
		expect(normalises).toContain('journal[].deltas[].cibles[]')
		expect(normalises).toContain('journal[].deltas[].effet')

		// ET LE RÉCIT DU PAS (n° 10 it2) EST BIEN INSTANCIÉ : sans lui, sa ligne de table
		// serait tenue par la seule « aucune ligne morte », et rien ne nommerait le chemin.
		expect(normalises).toContain('journal[].recit')

		// ET LA MÉMOIRE (n° 10 it3) DESCEND JUSQU'À SES QUATRE FEUILLES — les ancres d'un
		// fait sont une liste DANS un objet DANS une liste, et le pointeur un nombre sous un
		// objet optionnel. `memoire` elle-même n'est PAS une feuille : elle est non nulle.
		expect(normalises).toContain('memoire.faits_etablis[].fait')
		expect(normalises).toContain('memoire.faits_etablis[].sur[]')
		expect(normalises).toContain('memoire.resume.texte')
		expect(normalises).toContain('memoire.resume.jusqu_au_pas')
		expect(normalises).not.toContain('memoire')

		// ET LE HÉROS (n° 11, it1) DESCEND JUSQU'À SES HUIT FEUILLES, `caracs` COLLAPSÉE :
		// sans elles, leurs lignes de table seraient tenues par la seule « aucune ligne
		// morte » et rien ne nommerait le chemin.
		expect(normalises).toContain('heros.name')
		expect(normalises).toContain('heros.pvMax')
		expect(normalises).toContain('heros.pv')
		expect(normalises).toContain('heros.peMax')
		expect(normalises).toContain('heros.pe')
		expect(normalises).toContain('heros.mcBonus')
		expect(normalises).toContain('heros.xp')
		expect(new Set(bruts.filter((chemin) => chemin.startsWith('heros.caracs.'))).size).toBe(8)
		expect(new Set(normalises.filter((chemin) => chemin.startsWith('heros.caracs.'))).size).toBe(1)
		expect(normalises).toContain('heros.caracs.<id>')
		expect(normalises).not.toContain('heros')

		// ET LE COMBAT (n° 13, it1) DESCEND JUSQU'À SES DEUX FEUILLES : `postures` est une
		// liste NON VIDE dans la fixture, donc balayée PAR ÉLÉMENT (`postures[]`) — une
		// liste vide serait sa propre feuille, sans le suffixe, et la ligne de table
		// serait morte. `combat` elle-même n'est PAS une feuille.
		expect(normalises).toContain('combat.monstre_ref')
		expect(normalises).toContain('combat.postures[]')
		expect(normalises).not.toContain('combat')
		expect(normalises).not.toContain('combat.postures')
		// TROIS postures, UN SEUL chemin : le balayage rend une instance PAR ÉLÉMENT, et
		// c'est ce qui fait que CHACUNE rougirait si sa ligne manquait (KR-199).
		const postures = SESSION_SATUREE.combat?.postures ?? []
		expect(postures).toHaveLength(3)
		expect(bruts.filter((chemin) => chemin === 'combat.postures[]')).toHaveLength(postures.length)
	})
})

describe('EtatMonde, les sept champs restent REQUIS et chacun garde sa ligne', () => {
	it('un monde ampute d un champ ne compile pas, et les sept ont une ligne d audience', () => {
		// KR-254 — LA TOTALITÉ EST LA PRÉCONDITION DE LA BIVALENCE (KR-238). Six champs
		// posés optionnels le resteraient À VIE (KR-251) et laisseraient six branches
		// `undefined` sous un aiguillage qui doit LEVER. `@ts-expect-error` ÉCHOUE À LA
		// COMPILATION si l'erreur attendue n'a PAS lieu : c'est le seul instrument qui
		// épingle une exigence de présence.
		//
		// LE CHAMP AMPUTÉ EST `pnj`, ET C'EST LE PIRE CAS À DESSEIN : c'est le seul dont
		// la lecture tolère une CLÉ absente (`pnj[p]` peut manquer), si bien qu'un
		// relecteur pourrait croire que le CHAMP lui-même l'est aussi.
		// @ts-expect-error — `pnj` manquant sur un `EtatMonde`.
		const ampute: EtatMonde = {
			lieu_courant: 'lieu.val-cendre',
			lieux_visites: [],
			objets_possedes: [],
			indices_connus: [],
			jalons_atteints: [],
			evenements_consommes: [],
		}
		// Discriminant : la forme COMPLÈTE compile, elle. Sans cette moitié, la
		// directive serait satisfaite par n'importe quelle erreur de type, y compris
		// « ce type n'existe pas ».
		const complet: EtatMonde = { ...ampute, pnj: {} }

		// ET CHACUN DES SEPT A SA LIGNE D'AUDIENCE, balayée depuis l'objet COMPLET —
		// jamais sept littéraux (KR-117/199). C'est ce qui attraperait un
		// `monde.pnj.<id>.sait` glissé au passage : une feuille sans ligne échoue.
		//
		// LA LIGNE D'UN CHAMP EST CELLE DE SA FEUILLE, et le suffixe varie : `[]` pour
		// une liste, `.<id>.a_dit[]` pour le `Record` des personnages, rien pour le
		// scalaire. On cherche donc un PRÉFIXE — comparer à `monde.<champ>` nu ferait
		// rougir cinq champs sains, et le corriger en retirant le `[]` de la table
		// rendrait les lignes mortes (§ 8, D-15).
		const champs = Object.keys(complet)
		const ligneDe = (champ: string): string[] =>
			[...CLES_DE_LA_TABLE].filter(
				(cle) => cle === `monde.${champ}` || cle.startsWith(`monde.${champ}[`) || cle.startsWith(`monde.${champ}.`),
			)

		// SIX champs, UNE SEULE ligne chacun ; `pnj` EST L'EXCEPTION NOMMÉE depuis le
		// lot `contrat` de la n° 12 (`moteur-acteurs`, it3) : `EtatPnj` porte DEUX
		// feuilles (`a_dit[]`, `confiance`), donc DEUX lignes de table pour le MÊME
		// champ racine — jamais une relecture générique à « 1 partout » qui
		// masquerait l'ajout d'une feuille au champ le plus riche.
		const LIGNES_ATTENDUES: Readonly<Record<string, number>> = { pnj: 2 }

		expect(champs).toHaveLength(7)
		for (const champ of champs) {
			const attendu = LIGNES_ATTENDUES[champ] ?? 1
			expect(`${champ} → ${ligneDe(champ).length}`).toBe(`${champ} → ${attendu}`)
		}
		// Discriminance du préfixe : un champ que la table ne déclare pas — exactement
		// ce que `monde.pnj.<id>.sait` serait — n'a AUCUNE ligne. Sans elle, la boucle
		// ci-dessus serait verte sur un filtre qui rendrait toujours un élément.
		expect(ligneDe('sait')).toEqual([])
	})
})

describe('DESTINATION_DES_CHAMPS_DE_SESSION, la valeur des lignes', () => {
	it('les valeurs sont EXACTEMENT {ia, moteur}, et aucune autre', () => {
		// ASSERTION DE VALEUR, PAS D'EXISTENCE (KR-174) : « ce champ a une destination »
		// ne dit rien tant qu'on n'a pas dit LAQUELLE. L'ensemble des valeurs est
		// épinglé, donc une ligne basculée à `auteur` rougit ici comme une basculée à
		// n'importe quelle troisième valeur.
		//
		// ⚠ CETTE ASSERTION VALAIT `['moteur']` SEULE JUSQU'AU LOT `CONTRAT` DE LA
		// n° 10 (`moteur-interprete`) — corrigée EN VALEUR ici, PARCE QUE LA TABLE A
		// RÉELLEMENT BOUGÉ (KR-195/196 : la ligne, elle, se serait corrigée en
		// commentaire ; ce qui change ici est la MESURE, pas l'intention déclarée).
		// La voisine ci-dessous, elle, était écrite pour être SUPPRIMÉE par ce même
		// lot — elle l'est.
		expect([...new Set(Object.values(DESTINATION_DES_CHAMPS_DE_SESSION))].sort()).toEqual(['ia', 'moteur'])
	})

	it('les lignes ia sont EXACTEMENT les deux de l attente et les trois proses de la memoire, ni plus ni moins', () => {
		// LA MOITIÉ DONNÉES de ce que `moteurSansIA.test.ts` fait côté CODE : un
		// balayage de source ne voit pas une autorisation d'audience, et une
		// autorisation d'audience ne voit pas un appel réseau. Cette assertion-ci
		// nomme l'ENSEMBLE EXACT plutôt que de constater une non-vacuité : une
		// sixième ligne basculée à `ia` par erreur doit rougir ICI, par son nom.
		// L'IT3 DE LA n° 10 EN AJOUTE TROIS — les trois PROSES que la mémoire réinjecte —,
		// et PAS les deux feuilles `'moteur'` de la mémoire (ancres, pointeur).
		const lignesIa = Object.entries(DESTINATION_DES_CHAMPS_DE_SESSION)
			.filter(([, destination]) => destination === 'ia')
			.map(([chemin]) => chemin)
			.sort()

		expect(lignesIa).toEqual(
			[
				'attente.question',
				'attente.saisie',
				'journal[].recit',
				'memoire.faits_etablis[].fait',
				'memoire.resume.texte',
			].sort(),
		)
	})

	it('le combat : sa racine et ses deux feuilles sont moteur, jamais ia, jamais auteur (n 13 it1, KR-294)', () => {
		// ASSERTION DE VALEUR, PAS D'EXISTENCE (KR-174), et par LIGNE NOMMÉE : un
		// `monstre_ref` est un handle du bestiaire, `postures[]` les clés du registre
		// fermé `POSTURES` — aucune fiction. Une ligne basculée à `ia` ouvrirait au
		// modèle les choix du joueur AVANT que le moteur ait résolu le round suivant.
		for (const chemin of ['combat', 'combat.monstre_ref', 'combat.postures[]'] as const) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS_DE_SESSION[chemin]}`).toBe(`${chemin} → moteur`)
		}
		// Les trois lignes sont les SEULES du préfixe `combat` : une quatrième feuille
		// glissée dans le type sans sa ligne casse la compilation, une quatrième ligne sans
		// feuille est morte — et les deux sont attrapées ci-dessus. Ici, l'ENSEMBLE.
		expect([...CLES_DE_LA_TABLE].filter((cle) => cle === 'combat' || cle.startsWith('combat.')).sort()).toEqual([
			'combat',
			'combat.monstre_ref',
			'combat.postures[]',
		])
	})

	it('la fixture joue les TROIS postures du registre, dans un ordre qui n est ni le sien ni son inverse', () => {
		// `postures[]` est le seul tableau de la fixture dont l'ORDRE est l'information (le
		// rejeu le consomme round après round) : une fixture qui le trierait enseignerait
		// qu'il est sans importance. L'affirmation est dans la docstring de la fixture — la
		// voici, éprouvée (KR-169). Balayage depuis `POSTURE_VALUES`, jamais trois littéraux.
		const postures = SESSION_SATUREE.combat?.postures ?? []

		expect([...postures].sort()).toEqual([...POSTURE_VALUES].sort())
		expect(postures).not.toEqual(POSTURE_VALUES)
		expect(postures).not.toEqual([...POSTURE_VALUES].reverse())
	})

	it('journal[].recit est ia depuis l it3 — BASCULE EN VALEUR avec son lecteur, la fenetre glissante', () => {
		// ASSERTION DE VALEUR, PAS D'EXISTENCE (KR-174). `'moteur'` en it2 (narrateur SANS
		// ÉTAT, une ligne `'ia'` aurait été une autorisation dormante) ; `'ia'` en it3, parce
		// que l'assembleur du narrateur relit désormais les récits de la fenêtre et de la
		// tranche à condenser — c'est la datation que l'it2 avait écrite, honorée.
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['journal[].recit']).toBe('ia')
		// Discriminant : la ligne voisine de même famille (`journal[].texte`) RESTE
		// `'moteur'` — la bascule ne s'est pas faite en bloc sur le journal.
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['journal[].texte']).toBe('moteur')
	})

	it('la memoire : ses deux proses sont ia, ses ancres et son pointeur sont moteur, sa racine aussi', () => {
		// Les ancres sont des IDENTIFIANTS du dossier, le pointeur un COMPTE de pas : un modèle
		// qui les lirait apprendrait ce qu'il n'a jamais le droit d'écrire (KR-231/273).
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['memoire.faits_etablis[].fait']).toBe('ia')
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['memoire.resume.texte']).toBe('ia')
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['memoire.faits_etablis[].sur[]']).toBe('moteur')
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['memoire.resume.jusqu_au_pas']).toBe('moteur')
		// La racine n'est JAMAIS une autorisation en bloc.
		expect(DESTINATION_DES_CHAMPS_DE_SESSION.memoire).toBe('moteur')
	})
})

describe('EtatSession, les formes que le type REFUSE', () => {
	it('la memoire gelee en it3 ne represente ni fenetre, ni pointeur en tour, ni pas sur un fait ; pnj.<id>.sait ne compile pas', () => {
		// `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu :
		// c'est le seul instrument qui épingle une NON-représentabilité.

		// ⚠ JUSQU'À L'IT3, `memoire` était typée `null` et CETTE ligne-ci épinglait qu'aucune
		// forme interne n'était représentable. L'it3 GÈLE la forme (`MemoireSession`) : la
		// directive se retourne sur ce que la forme REFUSE, et c'est écrit plutôt que tu.

		// I4 / KR-013 — la fenêtre glissante n'est JAMAIS un champ : elle se dérive de l'horloge.
		// @ts-expect-error — une fenêtre stockée sous `memoire`.
		const fenetreStockee: EtatSession['memoire'] = { faits_etablis: [], fenetre: [] }

		// `docs/REGLES-PLAY.md` § J1 — aucun champ neuf ne porte « tour ».
		// @ts-expect-error — `jusqu_au_tour` au lieu de `jusqu_au_pas`.
		const pointeurEnTour: EtatSession['memoire'] = { faits_etablis: [], resume: { texte: 'x', jusqu_au_tour: 10 } }

		// I3 — aucun `pas` sur un fait : l'ordre du tableau EST la chronologie. Et les noms du
		// RÉSEAU (`phrase`/`ancres`) ne sont pas ceux du stockage (`fait`/`sur`, KR-236).
		// @ts-expect-error — un pas posé sur un fait.
		const faitDate: EtatSession['memoire'] = { faits_etablis: [{ fait: 'x', sur: ['lieu.a'], pas: 3 }] }
		// @ts-expect-error — la forme RÉSEAU d'un constat posée dans le stockage.
		const faitReseau: EtatSession['memoire'] = { faits_etablis: [{ phrase: 'x', ancres: ['A1'] }] }

		// KR-253 — `sait` n'entre NI comme champ NI comme clé réservée : aucun prédicat
		// ne le lit, aucun delta ne peut l'écrire, et le savoir d'un personnage est
		// entièrement déterminé par `monde.personnages[].savoirs[]` du dossier.
		// @ts-expect-error — `sait` posé sur l'état d'un personnage.
		const pnjInterdit: EtatPnj = { a_dit: [], sait: ['indice.sceau-brise'] }

		// Discriminant : les formes LÉGALES compilent, elles — `null` (KR-251 : toute
		// session écrite avant l'it3 reste légale), une mémoire à faits seuls, une mémoire
		// complète. Sans cette moitié, les directives seraient satisfaites par n'importe
		// quelle erreur de type, y compris « ce type n'existe pas ».
		const memoireNulle: EtatSession['memoire'] = null
		const faitsSeuls: EtatSession['memoire'] = { faits_etablis: [{ fait: 'x', sur: ['lieu.a'] }] }
		const complete: EtatSession['memoire'] = {
			faits_etablis: [],
			resume: { texte: 'x', jusqu_au_pas: 10 },
		}
		const pnjLegal: EtatPnj = { a_dit: ['indice.sceau-brise'] }

		expect([
			fenetreStockee,
			pointeurEnTour,
			faitDate,
			faitReseau,
			pnjInterdit,
			memoireNulle,
			faitsSeuls,
			complete,
			pnjLegal,
		]).toHaveLength(9)
	})
})
