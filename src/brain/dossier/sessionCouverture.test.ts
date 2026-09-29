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
 *    feuille : `horloge`, `monde`, `journal` et `attente` (depuis le lot `contrat`
 *    de la n° 10, `moteur-interprete`) n'ont donc aucune instance, et leurs
 *    QUATRE lignes de table sont des DISPENSES DÉCLARÉES, pas des lignes
 *    mortes. Elles existent pour l'exhaustivité par compilation ;
 *  · L'AUDIENCE RÉELLE. La table déclare une intention et force une déclaration ;
 *    elle ne démontre pas le confinement — la moitié CODE de cette preuve est
 *    `moteurSansIA.test.ts`, et pour `attente.question`/`attente.saisie`
 *    spécifiquement, `assemblerInterprete` (`copilote/contexte/interprete.ts`)
 *    est le premier assembleur qui les injecte réellement.
 */

/**
 * LES QUATRE DISPENSES, avec leur motif — modèle `SANS_DESTINATION` de
 * `couverture.test.ts`. Elles vivent DANS le test et non dans la table : une
 * dispense est un fait sur l'instrument, pas une audience.
 */
const DISPENSES_DE_FEUILLE: Readonly<Record<string, string>> = {
	horloge: 'clé racine porteuse — son unique feuille est `horloge.tour`',
	monde: 'clé racine porteuse — ses sept feuilles sont déclarées une à une',
	journal: 'clé racine porteuse — ses huit feuilles sont déclarées une à une (`recit` depuis la n° 10 it2)',
	attente: 'clé racine porteuse — ses trois feuilles (`type`, `question`, `saisie`) sont déclarées une à une',
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
 */
function normaliserLesClesDeRecord(chemin: string): string {
	return Object.keys(SESSION_SATUREE.monde.pnj).reduce(
		(courant, cle) => courant.split(`monde.pnj.${cle}.`).join('monde.pnj.<id>.'),
		chemin,
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

	it('aucune ligne morte, hors les trois dispenses declarees', () => {
		const chemins = cheminsDeLaSession()

		const mortes = [...CLES_DE_LA_TABLE]
			.filter((chemin) => !chemins.includes(chemin))
			.filter((chemin) => DISPENSES_DE_FEUILLE[chemin] === undefined)

		expect(mortes).toEqual([])

		// DISJONCTION (BUG-044) : une dispense qui nomme un chemin RÉELLEMENT instancié
		// ne dispense de rien — mais elle absorberait la perte de la ligne qu'elle
		// nomme. Elle doit tomber, et se nommer en tombant.
		expect(Object.keys(DISPENSES_DE_FEUILLE).filter((chemin) => chemins.includes(chemin))).toEqual([])

		// Et les trois dispenses sont bien DES LIGNES DE LA TABLE : une dispense qui
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
		// prouver. NEUF racines depuis le lot `contrat` de la n° 10 — `dossier_maj`
		// est la huitième, entrée à la revue de PR (2ᵉ exemption nommée à KR-249),
		// `attente` la neuvième, optionnelle à vie (KR-251) mais bien INSTANCIÉE ici.
		expect(racines).toHaveLength(9)
	})

	it('le balayage descend reellement, et la normalisation COLLAPSE les cles de Record', () => {
		// DISCRIMINANCE DE L'INSTRUMENT (BUG-084) : sans ces lignes, les trois
		// assertions ci-dessus seraient vertes sur un balayage qui ne rendrait rien.
		const bruts = feuillesDeLaFixture(SESSION_SATUREE).map((feuille) => feuille.normalise)
		const normalises = cheminsDeLaSession()

		// La fixture porte DEUX personnages : le walker rend donc DEUX chemins distincts
		// là où la table n'en déclare qu'un. C'est exactement ce que la normalisation
		// existe pour résoudre — avec un seul personnage, elle serait indistinguable de
		// son absence.
		expect(new Set(bruts.filter((chemin) => chemin.startsWith('monde.pnj.'))).size).toBe(2)
		expect(new Set(normalises.filter((chemin) => chemin.startsWith('monde.pnj.'))).size).toBe(1)
		expect(normalises).toContain('monde.pnj.<id>.a_dit[]')

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

		expect(champs).toHaveLength(7)
		for (const champ of champs) {
			expect(`${champ} → ${ligneDe(champ).length}`).toBe(`${champ} → 1`)
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

	it('les lignes ia sont EXACTEMENT {attente.question, attente.saisie}, ni plus ni moins', () => {
		// LA MOITIÉ DONNÉES de ce que `moteurSansIA.test.ts` fait côté CODE : un
		// balayage de source ne voit pas une autorisation d'audience, et une
		// autorisation d'audience ne voit pas un appel réseau. Cette assertion-ci
		// nomme l'ENSEMBLE EXACT plutôt que de constater une non-vacuité : une
		// troisième ligne basculée à `ia` par erreur doit rougir ICI, par son nom.
		const lignesIa = Object.entries(DESTINATION_DES_CHAMPS_DE_SESSION)
			.filter(([, destination]) => destination === 'ia')
			.map(([chemin]) => chemin)
			.sort()

		expect(lignesIa).toEqual(['attente.question', 'attente.saisie'])
	})

	it('journal[].recit est moteur en it2 — une prose de modele qu AUCUN modele ne relit', () => {
		// ASSERTION DE VALEUR, PAS D'EXISTENCE (KR-174), sur la SEULE prose de la session.
		// `'moteur'` ET PAS `'ia'` (plan d'itération it2, § 8 désaccord 13) : le narrateur
		// est SANS ÉTAT, aucun assembleur ne relit un récit passé, et une ligne `'ia'`
		// serait une autorisation DORMANTE. La bascule est une politique de rétention —
		// l'it3, avec son lecteur, la corrigera EN VALEUR ici même.
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['journal[].recit']).toBe('moteur')
		// Discriminant : la ligne voisine de même famille (`journal[].texte`), elle aussi
		// `'moteur'`, n'est pas ce qui rend cette assertion vraie — c'est la ligne propre
		// au récit, qui existe DANS la table.
		expect(Object.keys(DESTINATION_DES_CHAMPS_DE_SESSION)).toContain('journal[].recit')
	})
})

describe('EtatSession, les deux formes que le type REFUSE', () => {
	it('memoire est typee null, et pnj.<id>.sait ne compile pas', () => {
		// `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu :
		// c'est le seul instrument qui épingle une NON-représentabilité.

		// KR-249 — `memoire` est une CLÉ RACINE réservée, typée `null`. Sa forme interne
		// appartient à la n° 10 : aucun champ `memoire.*` n'est représentable avant elle.
		// @ts-expect-error — une forme interne posée sous `memoire`.
		const memoireInterdite: EtatSession['memoire'] = { faits_etablis: [] }

		// KR-253 — `sait` n'entre NI comme champ NI comme clé réservée : aucun prédicat
		// ne le lit, aucun delta ne peut l'écrire, et le savoir d'un personnage est
		// entièrement déterminé par `monde.personnages[].savoirs[]` du dossier.
		// @ts-expect-error — `sait` posé sur l'état d'un personnage.
		const pnjInterdit: EtatPnj = { a_dit: [], sait: ['indice.sceau-brise'] }

		// Discriminant : les deux formes LÉGALES compilent, elles. Sans cette moitié,
		// les deux directives seraient satisfaites par n'importe quelle erreur de type,
		// y compris « ce type n'existe pas ».
		const memoireLegale: EtatSession['memoire'] = null
		const pnjLegal: EtatPnj = { a_dit: ['indice.sceau-brise'] }

		expect([memoireInterdite, pnjInterdit, memoireLegale, pnjLegal]).toHaveLength(4)
	})
})
