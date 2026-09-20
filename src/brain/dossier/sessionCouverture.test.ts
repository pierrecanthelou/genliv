import { SESSION_SATUREE } from './__fixtures__/session-saturee'
import { feuillesDeLaFixture } from './feuilles'
import type { EtatPnj, EtatSession } from './session'
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
 *    feuille : `horloge`, `monde` et `journal` n'ont donc aucune instance, et
 *    leurs trois lignes de table sont des DISPENSES DÉCLARÉES, pas des lignes
 *    mortes. Elles existent pour l'exhaustivité par compilation ;
 *  · L'AUDIENCE RÉELLE. La table déclare une intention et force une déclaration ;
 *    elle ne démontre pas le confinement, aucun assembleur n'existant avant la
 *    n° 10. La moitié CODE de cette preuve est `moteurSansIA.test.ts`.
 */

/**
 * LES TROIS DISPENSES, avec leur motif — modèle `SANS_DESTINATION` de
 * `couverture.test.ts`. Elles vivent DANS le test et non dans la table : une
 * dispense est un fait sur l'instrument, pas une audience.
 */
const DISPENSES_DE_FEUILLE: Readonly<Record<string, string>> = {
	horloge: 'clé racine porteuse — son unique feuille est `horloge.tour`',
	monde: 'clé racine porteuse — ses sept feuilles sont déclarées une à une',
	journal: 'clé racine porteuse — ses trois feuilles sont déclarées une à une',
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
		// prouver. Huit racines, et elles sont nommées dans le contrat — `dossier_maj`
		// est la huitième, entrée à la revue de PR (2ᵉ exemption nommée à KR-249).
		expect(racines).toHaveLength(8)
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
		// et les onze lignes de feuille seraient mortes le jour même (§ 8, D-15).
		expect(normalises).toContain('monde.lieux_visites[]')
		expect(normalises).toContain('journal[].texte')
	})
})

describe('DESTINATION_DES_CHAMPS_DE_SESSION, la valeur des lignes', () => {
	it('toutes les lignes valent moteur, et aucune ne vaut autre chose', () => {
		// ASSERTION DE VALEUR, PAS D'EXISTENCE (KR-174) : « ce champ a une destination »
		// ne dit rien tant qu'on n'a pas dit LAQUELLE. L'ensemble des valeurs est
		// épinglé, donc une ligne basculée à `auteur` rougit ici comme une basculée à
		// `ia`.
		expect([...new Set(Object.values(DESTINATION_DES_CHAMPS_DE_SESSION))]).toEqual(['moteur'])
	})

	it('aucune ligne ia — et cette assertion est ecrite POUR ETRE SUPPRIMEE', () => {
		// ⚠ LIGNE À DURÉE DE VIE NOMMÉE. La n° 10 la supprime DANS le lot qui livre son
		// assembleur ET sa borne de résumé — pas avant, pas séparément : sa suppression
		// EST la traversée de frontière, et elle se lit en diff.
		//
		// Ce qu'elle achète par rapport à l'assertion d'ensemble ci-dessus : celle-là
		// dit « la table n'a pas bougé », celle-ci dit POURQUOI une valeur en
		// particulier est interdite aujourd'hui. Une ligne `ia` est une AUTORISATION,
		// pas une prévision, et les lignes d'audience se corrigent en commentaire,
		// jamais en valeur (KR-195/196).
		//
		// C'est la moitié DONNÉES de ce que `moteurSansIA.test.ts` fait côté CODE : un
		// balayage de source ne voit pas une autorisation d'audience, et une
		// autorisation d'audience ne voit pas un appel réseau.
		expect(Object.values(DESTINATION_DES_CHAMPS_DE_SESSION).every((d) => d !== 'ia')).toBe(true)

		// Discriminance : sans cette ligne, la précédente serait vraie sur une table
		// VIDE, qui n'autoriserait rien parce qu'elle ne déclarerait rien.
		expect(Object.keys(DESTINATION_DES_CHAMPS_DE_SESSION).length).toBeGreaterThan(0)
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
