import fs from 'node:fs'
import path from 'node:path'
import { executerCommande, type Commande } from './commandes'
import { tickClimat } from './climat'
import type { ExprNode } from './expr'
import { tickHorloge } from './horloge'
import { ouvrirSession, type EtatSession } from './session'
import type { Delta } from './deltas'
import type { Climat, Dossier, Evenement, Jalon, PlanAction } from './types'

/**
 * LE CLIMAT DE SESSION — `tickClimat` (n° 14 `moteur-horloge`, it4, lot `contrat`,
 * `docs/REGLES-PLAY.md` § J3, écrit AVANT le code).
 *
 * LES DOSSIERS SONT LUS DU DISQUE (KR-156) puis MUTÉS EN TEST — les événements, les climats, parfois
 * un plan ou un jalon — jamais l'inverse : muter la fixture du disque pour arranger un témoin ferait
 * payer treize autres suites. Les `duree` des plans de la référence sont RETIRÉES (même motif que
 * `horloge.test.ts`) : sans cela, Corvin constaterait un blocage au pas 2 et le journal d'un scénario
 * un peu long porterait des lignes que ce fichier ne juge pas.
 *
 * DEUX CHEMINS, ET CHACUN DIT LEQUEL IL EMPRUNTE : `tickClimat` appelée DIRECTEMENT sur une session
 * posée à un pas donné — c'est le seul moyen d'atteindre `tour − depuis > duree`, que le produit ne
 * sait pas écrire puisque le tick éteint dès `=` (c'est exactement ce qui distingue `>=` de `===`) —,
 * et `executerCommande`, le chemin complet du produit, pour tout ce qui parle de l'ORDRE (le climat
 * après les jalons, avant les personnages) et du cycle entier.
 *
 * ⚠ CE FICHIER EST HORS DU SCORE DE MUTATION (KR-243) : `climat.ts` n'est pas l'un des quatre fichiers
 * d'arithmétique de règles. `jest` est son UNIQUE instrument, et les mutants nommés ci-dessous ont été
 * écrits, VUS ROUGES, puis révoqués — à la main, faute d'outil.
 */

const MODULE_DOSSIER = __dirname
const RACINE_SRC = path.join(__dirname, '..', '..')
const CHEMIN_REFERENCE = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-minimal.json')

const HAREK = 'pnj.harek-le-forgeron'
const OBJET = 'objet.amulette-scellee'
const AUTRE_OBJET = 'objet.sceau-de-cendre'

/** Le clone d'une fixture, LU DU DISQUE à chaque appel — jamais muté en place (KR-156). */
function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

/** Vrai à l'ouverture du dossier de référence (le héros y part) — une condition « toujours vraie ». */
const ICI: ExprNode = { op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.foyer-du-guet'] }
/** Fausse pour toujours : aucun lieu de ce nom. */
const AILLEURS: ExprNode = { op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.jamais-vu'] }

function possede(objet: string): ExprNode {
	return { op: 'predicat', predicat: 'possede_objet', cibles: [objet] }
}

function donner(objet: string): Delta {
	return { delta: 'donner_objet', cibles: [objet] }
}

function retirer(objet: string): Delta {
	return { delta: 'retirer_objet', cibles: [objet] }
}

/** Un climat FABRIQUÉ : seuls `id`, `duree` et `effets_regles` sont lus par le moteur. */
function climat(id: string, reste: Partial<Climat> = {}): Climat {
	return { id, nom: `Nom de ${id}`, effets_regles: [], ...reste }
}

/** Un événement FABRIQUÉ : seuls `climat_id`, `monstre_ref` et `declencheur_expr` sont lus par le moteur. */
function evenement(id: string, climatId: string | undefined, declencheur: ExprNode | undefined): Evenement {
	return {
		id,
		nom: `Nom de ${id}`,
		...(climatId === undefined ? {} : { climat_id: climatId }),
		...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
		resolutions: [],
	}
}

/**
 * Le dossier de référence, ses événements et ses climats REMPLACÉS, et SANS aucune `duree` de plan : un
 * seul domaine de décision par témoin.
 */
function dossierAvec(evenements: Evenement[], climats: Climat[]): Dossier {
	const dossier = lire(CHEMIN_REFERENCE)
	dossier.monde.evenements = evenements
	dossier.monde.conditions.climat = climats
	for (const personnage of dossier.monde.personnages) {
		for (const etapeDuPlan of personnage.plan_actions) delete etapeDuPlan.duree
	}
	return dossier
}

function ouverte(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

/** La même session posée au pas `tour`, avec ou sans climat actif — un état que le produit sait écrire, daté à la main. */
function auPas(session: EtatSession, tour: number, actif?: { id: string; depuis: number }): EtatSession {
	return { ...session, horloge: { tour, ...(actif === undefined ? {} : { climat_actif: actif }) } }
}

const AGIR: Commande = { commande: 'agir', cibles: [] }

/** Un pas accepté — le chemin complet du produit. Le refus est un échec de test, jamais avalé. */
function pas(dossier: Dossier, session: EtatSession, commande: Commande = AGIR): EtatSession {
	const resultat = executerCommande(dossier, session, commande)
	if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.session
}

/** Les lignes de climat d'un journal — `climat_actif : …` et `climat_eteint : …`, avec leur pas. */
function lignesDeClimat(session: EtatSession): Array<{ tour: number; texte: string }> {
	return session.journal
		.filter((ligne) => ligne.texte.startsWith('climat_'))
		.map((ligne) => ({ tour: ligne.tour, texte: ligne.texte }))
}

describe('tickClimat, l activation : l evenement du est consomme, les effets sont appliques, le climat est pose', () => {
	const DOSSIER = dossierAvec(
		[evenement('evenement.pluie', 'climat.pluie', ICI)],
		[climat('climat.pluie', { duree: 3, effets_regles: [donner(OBJET)] })],
	)

	it('activation consomme l evenement, pose climat_actif au pas COURANT et ecrit UNE ligne portant ses deltas', () => {
		const depart = auPas(ouverte(DOSSIER), 4)
		const apres = tickClimat(DOSSIER, depart)

		expect(apres.horloge).toStrictEqual({ tour: 4, climat_actif: { id: 'climat.pluie', depuis: 4 } })
		expect(depart.monde.evenements_consommes).toEqual([])
		expect(apres.monde.evenements_consommes).toEqual(['evenement.pluie'])
		// UNE ligne, au pas courant (jamais `+1`), SANS `origine`, `recit`, `jet` ni `interlocuteur` :
		// `toStrictEqual` n'admet aucune clé de plus, `undefined` compris.
		expect(apres.journal).toStrictEqual([
			{
				tour: 4,
				role: 'moteur',
				texte: 'climat_actif : climat.pluie',
				deltas: [{ delta: 'donner_objet', cibles: [OBJET], effet: 'applique' }],
			},
		])
	})

	it('effets delta appliques a l activation : donner_objet met l objet dans l inventaire', () => {
		const depart = auPas(ouverte(DOSSIER), 4)
		expect(depart.monde.objets_possedes).toEqual([])

		const apres = tickClimat(DOSSIER, depart)

		expect(apres.monde.objets_possedes).toEqual([OBJET])
		// Le reste de `monde` n'a pas bougé : seuls `evenements_consommes` et `objets_possedes` different.
		expect({ ...apres.monde, evenements_consommes: [], objets_possedes: [] }).toStrictEqual({
			...depart.monde,
			evenements_consommes: [],
			objets_possedes: [],
		})
	})

	it('donner_objet sur un objet DEJA possede : l activation a lieu, l effet est sans_effet, l inventaire garde sa reference', () => {
		// KR-247 : « demandé sans effet » n'est pas « pas demandé ». L'idempotence est MESURÉE par `===`
		// sur la référence que rend `avecAjout`, jamais déclarée.
		const base = auPas(ouverte(DOSSIER), 4)
		const depart: EtatSession = { ...base, monde: { ...base.monde, objets_possedes: [OBJET] } }

		const apres = tickClimat(DOSSIER, depart)

		expect(apres.horloge.climat_actif).toEqual({ id: 'climat.pluie', depuis: 4 })
		expect(apres.journal[0].deltas).toEqual([{ delta: 'donner_objet', cibles: [OBJET], effet: 'sans_effet' }])
		expect(apres.monde.objets_possedes).toBe(depart.monde.objets_possedes)
	})

	it('les effets sont appliques DANS L ORDRE du dossier, et un delta demande DEUX fois porte applique puis sans_effet', () => {
		// SCÉNARIO SÉPARATEUR (KR-247) : le même delta deux fois. Et l'ordre décide : les mêmes deux
		// effets, dans l'ordre inverse, ne donnent ni le même inventaire ni les mêmes constats.
		const cas: ReadonlyArray<{ effets: Delta[]; objets: string[]; constats: Array<'applique' | 'sans_effet'> }> = [
			{ effets: [donner(OBJET), donner(OBJET)], objets: [OBJET], constats: ['applique', 'sans_effet'] },
			{ effets: [donner(OBJET), retirer(OBJET)], objets: [], constats: ['applique', 'applique'] },
			{ effets: [retirer(OBJET), donner(OBJET)], objets: [OBJET], constats: ['sans_effet', 'applique'] },
		]

		for (const { effets, objets, constats } of cas) {
			const dossier = dossierAvec(
				[evenement('evenement.pluie', 'climat.pluie', ICI)],
				[climat('climat.pluie', { duree: 3, effets_regles: effets })],
			)
			const apres = tickClimat(dossier, auPas(ouverte(dossier), 1))
			const etiquette = effets.map((effet) => effet.delta).join(' puis ')

			expect(`${etiquette} → ${apres.monde.objets_possedes.join(',')}`).toBe(`${etiquette} → ${objets.join(',')}`)
			expect(`${etiquette} → ${apres.journal[0].deltas?.map((delta) => delta.effet).join(',')}`).toBe(
				`${etiquette} → ${constats.join(',')}`,
			)
		}
	})

	it('un climat sans effets_regles s active : la ligne ne porte AUCUNE cle deltas — jamais []', () => {
		// KR-247 : « n'en a pas demandé » n'est pas « en a demandé zéro ». `toStrictEqual` distingue la clé
		// absente de la clé à `undefined`, que `toEqual` ne distingue pas.
		const dossier = dossierAvec(
			[evenement('evenement.pluie', 'climat.pluie', ICI)],
			[climat('climat.pluie', { duree: 3 })],
		)
		const apres = tickClimat(dossier, auPas(ouverte(dossier), 2))

		expect(apres.journal).toStrictEqual([{ tour: 2, role: 'moteur', texte: 'climat_actif : climat.pluie' }])
		expect('deltas' in apres.journal[0]).toBe(false)
	})

	it('aucune activation a l ouverture : pas de pas, pas de tick — le climat ne s allume que dans le tick d une commande acceptee', () => {
		const depart = ouverte(DOSSIER)

		expect(depart.horloge).toStrictEqual({ tour: 0 })
		expect(depart.monde.evenements_consommes).toEqual([])
		// Et le MÊME dossier allume bien son climat au premier pas accepté : l'événement est dû, il attendait.
		expect(pas(DOSSIER, depart).horloge.climat_actif).toEqual({ id: 'climat.pluie', depuis: 1 })
	})

	it('rien a faire : la session est rendue a l identique — MEME reference', () => {
		// Aucun climat actif et aucun événement dû : ni clé, ni ligne, ni copie.
		const calme = dossierAvec([evenement('evenement.attente', 'climat.pluie', AILLEURS)], [climat('climat.pluie')])
		const depart = auPas(ouverte(calme), 4)

		expect(tickClimat(calme, depart)).toBe(depart)
		// Aucun événement du tout.
		const vide = dossierAvec([], [climat('climat.pluie')])
		const departVide = auPas(ouverte(vide), 4)
		expect(tickClimat(vide, departVide)).toBe(departVide)
	})

	it('l evenement n est consomme qu une fois : apres l extinction, il ne rallume rien', () => {
		const allume = tickClimat(DOSSIER, auPas(ouverte(DOSSIER), 4))
		// 7 − 4 = 3 >= 3 : le climat s'éteint, et l'événement — consommé — ne le rallume pas.
		const eteint = tickClimat(DOSSIER, auPas(allume, 7, allume.horloge.climat_actif))

		expect('climat_actif' in eteint.horloge).toBe(false)
		expect(eteint.monde.evenements_consommes).toEqual(['evenement.pluie'])
		expect(lignesDeClimat(eteint)).toEqual([
			{ tour: 4, texte: 'climat_actif : climat.pluie' },
			{ tour: 7, texte: 'climat_eteint : climat.pluie' },
		])
	})
})

describe('tickClimat, l extinction : tour − depuis >= duree, la cle est RETIREE, une ligne sans deltas', () => {
	const DOSSIER = dossierAvec([], [climat('climat.pluie', { duree: 3 })])
	const ACTIF = { id: 'climat.pluie', depuis: 2 }

	it('extinction a la duree : 5 − 2 = 3 >= 3 — la cle disparait, une ligne climat_eteint, sans deltas', () => {
		const depart = auPas(ouverte(DOSSIER), 5, ACTIF)
		const apres = tickClimat(DOSSIER, depart)

		// La CLÉ est absente — pas `undefined` (KR-251) : `toStrictEqual` et `in` le disent tous les deux.
		expect(apres.horloge).toStrictEqual({ tour: 5 })
		expect('climat_actif' in apres.horloge).toBe(false)
		expect(Object.keys(apres.horloge)).toEqual(['tour'])
		expect(apres.journal).toStrictEqual([{ tour: 5, role: 'moteur', texte: 'climat_eteint : climat.pluie' }])
		expect('deltas' in apres.journal[0]).toBe(false)
		// L'argument n'a pas bougé : l'extinction travaille sur une COPIE de l'horloge.
		expect(depart.horloge).toStrictEqual({ tour: 5, climat_actif: ACTIF })
	})

	it('pas d extinction avant la duree : 4 − 2 = 2 < 3 — climat_actif inchange, MEME reference de session, aucune ligne', () => {
		const depart = auPas(ouverte(DOSSIER), 4, ACTIF)
		const apres = tickClimat(DOSSIER, depart)

		expect(apres).toBe(depart)
		expect(apres.horloge.climat_actif).toBe(ACTIF)
		expect(lignesDeClimat(apres)).toEqual([])
	})

	it('extinction a duree + 1 et au-dela (session forgee) : >= couvre, === laisserait un climat eternel', () => {
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : `>=` → `===`. Le produit n'écrit jamais `tour − depuis >
		// duree` (le tick éteint dès `=`), donc SEULE une session forgée — ou persistée contre un dossier édité —
		// sépare les deux gardes ; sous `===`, les lignes 6, 7 et 100 ci-dessous restent actives.
		const cas: ReadonlyArray<readonly [number, 'reste' | 'eteint']> = [
			[1, 'reste'], // avant l'activation : −1 < 3, jamais une extinction ni une levée
			[2, 'reste'], // 0 < 3
			[3, 'reste'], // 1 < 3
			[4, 'reste'], // 2 < 3
			[5, 'eteint'], // 3 >= 3 — la borne
			[6, 'eteint'], // duree + 1
			[7, 'eteint'],
			[100, 'eteint'],
		]

		for (const [tour, attendu] of cas) {
			const apres = tickClimat(DOSSIER, auPas(ouverte(DOSSIER), tour, ACTIF))
			const verdict = 'climat_actif' in apres.horloge ? 'reste' : 'eteint'

			expect(`tour ${tour} → ${verdict}`).toBe(`tour ${tour} → ${attendu}`)
			expect(`tour ${tour} → ${lignesDeClimat(apres).length}`).toBe(`tour ${tour} → ${attendu === 'eteint' ? 1 : 0}`)
		}
	})

	it('la duree est celle du CLIMAT du dossier, jamais un champ de la session : le meme etat, une autre duree, un autre verdict', () => {
		const courte = dossierAvec([], [climat('climat.pluie', { duree: 1 })])
		const longue = dossierAvec([], [climat('climat.pluie', { duree: 10 })])
		const depart = auPas(ouverte(courte), 4, ACTIF)

		// 4 − 2 = 2 : >= 1 s'éteint, < 10 reste.
		expect('climat_actif' in tickClimat(courte, depart).horloge).toBe(false)
		expect(tickClimat(longue, depart)).toBe(depart)
	})

	it('un climat SANS duree est permanent : jamais eteint, quel que soit le pas', () => {
		const permanent = dossierAvec([], [climat('climat.pluie')])
		expect('duree' in permanent.monde.conditions.climat[0]).toBe(false)

		for (const tour of [3, 50, 1000]) {
			const depart = auPas(ouverte(permanent), tour, ACTIF)

			expect(`tour ${tour} → ${tickClimat(permanent, depart) === depart}`).toBe(`tour ${tour} → true`)
		}
		// DISCRIMINANT, DANS LE MÊME TEST : la MÊME session, la durée posée, s'éteint — l'absence de durée
		// est ce qui rend le climat permanent, pas un défaut du balayage.
		const avecDuree = dossierAvec([], [climat('climat.pluie', { duree: 3 })])
		expect('climat_actif' in tickClimat(avecDuree, auPas(ouverte(avecDuree), 50, ACTIF)).horloge).toBe(false)
	})

	it('un climat_actif.id INTROUVABLE dans le dossier s eteint — meme sans duree, meme au pas de son activation', () => {
		// Le conserver créerait un état mort à vie : ni la durée ni aucun événement ne le lèverait.
		const sansLui = dossierAvec([], [climat('climat.autre', { duree: 99 })])
		const orphelin = { id: 'climat.disparu', depuis: 2 }

		for (const tour of [2, 3, 50]) {
			const apres = tickClimat(sansLui, auPas(ouverte(sansLui), tour, orphelin))

			expect(`tour ${tour} → ${'climat_actif' in apres.horloge}`).toBe(`tour ${tour} → false`)
			expect(lignesDeClimat(apres)).toEqual([{ tour, texte: 'climat_eteint : climat.disparu' }])
		}
		// Et `climat.autre`, présent au dossier, n'est PAS éteint dans les mêmes conditions : c'est bien
		// l'introuvable qui éteint, pas le pas.
		const present = { id: 'climat.autre', depuis: 2 }
		const departPresent = auPas(ouverte(sansLui), 3, present)
		expect(tickClimat(sansLui, departPresent)).toBe(departPresent)
	})

	it('un climat dont la duree vaut DUREE_MIN (1) est present apres le pas de son activation, et eteint au pas suivant', () => {
		// « Un climat posé au pas p est présent dans l'état APRÈS les pas p à p + duree − 1 » : pour
		// duree = 1, après le seul pas p. Il n'est JAMAIS éteint dans le tick qui l'allume.
		const dossier = dossierAvec(
			[evenement('evenement.eclair', 'climat.eclair', ICI)],
			[climat('climat.eclair', { duree: 1 })],
		)

		const pas1 = tickClimat(dossier, auPas(ouverte(dossier), 1))
		expect(pas1.horloge.climat_actif).toEqual({ id: 'climat.eclair', depuis: 1 })
		expect(lignesDeClimat(pas1)).toEqual([{ tour: 1, texte: 'climat_actif : climat.eclair' }])

		const pas2 = tickClimat(dossier, auPas(pas1, 2, pas1.horloge.climat_actif))
		expect('climat_actif' in pas2.horloge).toBe(false)
		expect(lignesDeClimat(pas2)).toEqual([
			{ tour: 1, texte: 'climat_actif : climat.eclair' },
			{ tour: 2, texte: 'climat_eteint : climat.eclair' },
		])
	})
})

describe('tickClimat, un seul climat a la fois : le second attend, et s allume au pas ou la place est libre', () => {
	const A = climat('climat.a', { duree: 3 })
	const B = climat('climat.b', { duree: 2, effets_regles: [donner(AUTRE_OBJET)] })
	const DOSSIER = dossierAvec([evenement('evenement.b', 'climat.b', ICI)], [A, B])
	const ACTIF_A = { id: 'climat.a', depuis: 2 }

	it('second evenement non consomme pendant un climat actif : aucune ecriture, MEME reference', () => {
		// 4 − 2 = 2 < 3 : le climat A tient. L'événement de B est dû, et ATTEND.
		const depart = auPas(ouverte(DOSSIER), 4, ACTIF_A)
		const apres = tickClimat(DOSSIER, depart)

		expect(apres).toBe(depart)
		expect(apres.monde.evenements_consommes).toEqual([])
		expect(apres.monde.objets_possedes).toEqual([])
		expect(apres.horloge.climat_actif).toBe(ACTIF_A)
	})

	it('au pas ou le premier s eteint, le second s allume : l extinction D ABORD, puis l activation, deux lignes dans cet ordre', () => {
		// 5 − 2 = 3 >= 3 : A s'éteint, et la place libre allume B dans le MÊME tick.
		const depart = auPas(ouverte(DOSSIER), 5, ACTIF_A)
		const apres = tickClimat(DOSSIER, depart)

		expect(apres.horloge).toStrictEqual({ tour: 5, climat_actif: { id: 'climat.b', depuis: 5 } })
		expect(apres.monde.evenements_consommes).toEqual(['evenement.b'])
		expect(apres.monde.objets_possedes).toEqual([AUTRE_OBJET])
		expect(apres.journal).toStrictEqual([
			{ tour: 5, role: 'moteur', texte: 'climat_eteint : climat.a' },
			{
				tour: 5,
				role: 'moteur',
				texte: 'climat_actif : climat.b',
				deltas: [{ delta: 'donner_objet', cibles: [AUTRE_OBJET], effet: 'applique' }],
			},
		])
	})

	it('un climat qui vient de s allumer n est pas eteint dans le tick qui l allume, meme si le precedent avait la meme duree', () => {
		// L'extinction ne lit que l'état d'ENTRÉE : le `depuis` de B (5) n'est jamais comparé à `duree` au pas 5.
		const apres = tickClimat(DOSSIER, auPas(ouverte(DOSSIER), 5, ACTIF_A))

		expect(apres.horloge.climat_actif?.depuis).toBe(5)
		// Au pas 7 : 7 − 5 = 2 >= 2 (la durée de B), il s'éteint.
		const tard = tickClimat(DOSSIER, auPas(apres, 7, apres.horloge.climat_actif))
		expect('climat_actif' in tard.horloge).toBe(false)
		expect(lignesDeClimat(tard).map((ligne) => ligne.texte)).toEqual([
			'climat_eteint : climat.a',
			'climat_actif : climat.b',
			'climat_eteint : climat.b',
		])
	})
})

describe('un climat_id qui ne resout pas (dossier non accepte) : active sans effet, eteint au tick suivant, jamais une levee', () => {
	it('le journal LIT l anomalie : climat_actif puis climat_eteint, sans deltas, et l evenement est consomme', () => {
		const dossier = dossierAvec([evenement('evenement.fantome', 'climat.fantome', ICI)], [])

		const allume = tickClimat(dossier, auPas(ouverte(dossier), 3))
		expect(allume.horloge.climat_actif).toEqual({ id: 'climat.fantome', depuis: 3 })
		expect(allume.monde.evenements_consommes).toEqual(['evenement.fantome'])
		expect(allume.journal).toStrictEqual([{ tour: 3, role: 'moteur', texte: 'climat_actif : climat.fantome' }])

		const eteint = tickClimat(dossier, auPas(allume, 4, allume.horloge.climat_actif))
		expect('climat_actif' in eteint.horloge).toBe(false)
		expect(lignesDeClimat(eteint).map((ligne) => ligne.texte)).toEqual([
			'climat_actif : climat.fantome',
			'climat_eteint : climat.fantome',
		])
	})
})

describe('tickClimat, elle est PURE et totale — ni le dossier ni la session ne bougent', () => {
	it('activation, extinction et attente laissent leurs arguments intacts', () => {
		const dossier = dossierAvec(
			[evenement('evenement.b', 'climat.b', ICI)],
			[climat('climat.a', { duree: 3 }), climat('climat.b', { effets_regles: [donner(OBJET)] })],
		)
		const cas: ReadonlyArray<readonly [string, EtatSession]> = [
			['activation', auPas(ouverte(dossier), 4)],
			['extinction puis activation', auPas(ouverte(dossier), 5, { id: 'climat.a', depuis: 2 })],
			['attente', auPas(ouverte(dossier), 4, { id: 'climat.a', depuis: 2 })],
		]

		for (const [nom, depart] of cas) {
			const avantDossier = JSON.stringify(dossier)
			const avantSession = JSON.stringify(depart)

			tickClimat(dossier, depart)

			expect(`${nom} → dossier ${JSON.stringify(dossier) === avantDossier}`).toBe(`${nom} → dossier true`)
			expect(`${nom} → session ${JSON.stringify(depart) === avantSession}`).toBe(`${nom} → session true`)
		}
	})
})

describe('tickHorloge appelle tickClimat EN TETE : apres les jalons (latence d un pas), avant les personnages', () => {
	/** Un plan de Harek à deux étapes : la seconde n'est déclenchée que par la possession de `OBJET`. */
	function avecPlanDeHarek(dossier: Dossier): Dossier {
		const harek = dossier.monde.personnages.find((personnage) => personnage.id === HAREK)
		if (harek === undefined) throw new Error('la fixture de référence ne porte plus Harek')
		const plan: PlanAction[] = [
			{ etape: 100, action: 'Intention de la première étape.' },
			{ etape: 99, action: 'Intention de la seconde étape.', declencheur_expr: possede(OBJET) },
		]
		harek.plan_actions = plan
		return dossier
	}

	const EVENEMENT_DU = evenement('evenement.pluie', 'climat.pluie', ICI)
	const CLIMAT_DONNEUR = climat('climat.pluie', { duree: 3, effets_regles: [donner(OBJET)] })

	it('un personnage lit les faits d APRES le climat : l effet qui rend sa condition vraie le fait avancer DANS LE MEME pas, apres la ligne du climat', () => {
		const dossier = avecPlanDeHarek(dossierAvec([EVENEMENT_DU], [CLIMAT_DONNEUR]))
		const apres = pas(dossier, ouverte(dossier))

		expect(apres.monde.objets_possedes).toEqual([OBJET])
		expect(apres.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
		// L'ORDRE DU JOURNAL EST L'ORDRE DU TICK : la commande (deux lignes), le climat, puis le personnage.
		expect(apres.journal.map((ligne) => ligne.texte)).toEqual([
			'> AGIR',
			'lieu_courant : lieu.foyer-du-guet',
			'climat_actif : climat.pluie',
			`etape_plan : ${HAREK} 2`,
		])

		// DISCRIMINANT, DANS LE MÊME TEST : sans le climat (l'événement n'est pas dû), Harek reste en place —
		// c'est bien l'effet du climat qui l'a fait avancer, et pas la condition qui était déjà vraie.
		const sansClimat = avecPlanDeHarek(
			dossierAvec([evenement('evenement.pluie', 'climat.pluie', AILLEURS)], [CLIMAT_DONNEUR]),
		)
		const temoin = pas(sansClimat, ouverte(sansClimat))
		expect(temoin.monde.objets_possedes).toEqual([])
		expect(temoin.monde.pnj[HAREK]).toBeUndefined()
		expect(temoin.journal.map((ligne) => ligne.texte)).toEqual(['> AGIR', 'lieu_courant : lieu.foyer-du-guet'])
	})

	it('un jalon que l effet du climat rend vrai n est resolu qu a la commande SUIVANTE : la latence d un pas, documentee en J3', () => {
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : appeler `tickClimat` AVANT la passe des jalons — le jalon
		// serait alors atteint au pas 1.
		const dossier = dossierAvec([EVENEMENT_DU], [CLIMAT_DONNEUR])
		const jalon: Jalon = {
			id: 'jalon.amulette-trouvee',
			nom: 'Amulette trouvée',
			enonce_texte: 'Le héros porte une amulette.',
			declencheur_texte: 'Le héros met la main sur une amulette.',
			declencheur_expr: possede(OBJET),
			effet: [],
		}
		dossier.charpente.jalons.push(jalon)

		const pas1 = pas(dossier, ouverte(dossier))
		expect(pas1.monde.objets_possedes).toEqual([OBJET])
		expect(pas1.monde.jalons_atteints).not.toContain('jalon.amulette-trouvee')

		const pas2 = pas(dossier, pas1)
		expect(pas2.monde.jalons_atteints).toContain('jalon.amulette-trouvee')
		expect(pas2.journal.filter((ligne) => ligne.texte.startsWith('jalons_atteints : jalon.amulette-trouvee'))).toEqual([
			{
				tour: 2,
				role: 'moteur',
				texte: 'jalons_atteints : jalon.amulette-trouvee',
				deltas: [{ delta: 'atteindre_jalon', cibles: ['jalon.amulette-trouvee'], effet: 'applique' }],
			},
		])
	})

	it('le cycle entier par le produit : allume au pas 1, present aux pas 1, 2 et 3, eteint au pas 4 (duree 3)', () => {
		// L'ARITHMÉTIQUE EXACTE, bout en bout : `depuis = 1`, `duree = 3`, éteint à `4 − 1 = 3 >= 3`. Un climat
		// de durée 3 est présent dans l'état après TROIS pas — le mot « durée » de l'auteur.
		const dossier = dossierAvec([EVENEMENT_DU], [CLIMAT_DONNEUR])
		const pas1 = pas(dossier, ouverte(dossier))
		const pas2 = pas(dossier, pas1)
		const pas3 = pas(dossier, pas2)
		const pas4 = pas(dossier, pas3)

		expect(pas1.horloge).toStrictEqual({ tour: 1, climat_actif: { id: 'climat.pluie', depuis: 1 } })
		expect(pas2.horloge).toStrictEqual({ tour: 2, climat_actif: { id: 'climat.pluie', depuis: 1 } })
		expect(pas3.horloge).toStrictEqual({ tour: 3, climat_actif: { id: 'climat.pluie', depuis: 1 } })
		expect(pas4.horloge).toStrictEqual({ tour: 4 })
		// UNE ligne d'activation et UNE d'extinction sur toute la partie, aux pas exacts.
		expect(lignesDeClimat(pas4)).toEqual([
			{ tour: 1, texte: 'climat_actif : climat.pluie' },
			{ tour: 4, texte: 'climat_eteint : climat.pluie' },
		])
		// Les pas 2 et 3 n'ont rien écrit de climatique : la référence de `climat_actif` est celle du pas 1.
		expect(pas3.horloge.climat_actif).toBe(pas1.horloge.climat_actif)
	})

	it('tickHorloge rend la MEME reference quand le climat ne change pas et qu aucun personnage ne bouge', () => {
		const dossier = dossierAvec(
			[evenement('evenement.attente', 'climat.pluie', AILLEURS)],
			[climat('climat.pluie', { duree: 3 })],
		)
		const depart = auPas(ouverte(dossier), 4, { id: 'climat.pluie', depuis: 3 })

		expect(tickHorloge(dossier, depart)).toBe(depart)
	})
})

describe('les fixtures du disque : aucun climat ne s allume, donc aucun journal de partie existant ne change', () => {
	it('quelques pas sur chacune — aucune ligne climat_, aucune cle climat_actif, aucun evenement consomme par le climat', () => {
		for (const chemin of [CHEMIN_REFERENCE, CHEMIN_MINIMAL]) {
			const dossier = lire(chemin)
			let session = ouverte(dossier)
			for (let rang = 0; rang < 4; rang += 1) session = pas(dossier, session)

			expect(`${path.basename(chemin)} → ${lignesDeClimat(session).length}`).toBe(`${path.basename(chemin)} → 0`)
			expect(`${path.basename(chemin)} → ${'climat_actif' in session.horloge}`).toBe(`${path.basename(chemin)} → false`)
			expect(session.horloge.tour).toBe(4)
		}
	})
})

describe('climat.ts, les proprietes qui se lisent dans la SOURCE', () => {
	const lireSource = (chemin: string): string => fs.readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n')
	const source = (nom: string): string => lireSource(path.join(MODULE_DOSSIER, nom))
	const sansCommentaires = (texte: string): string => texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
	const enPositionDeCode = (texte: string): string =>
		sansCommentaires(texte)
			.replace(/'[^'\n]*'/g, "''")
			.replace(/"[^"\n]*"/g, '""')
			.replace(/`[^`]*`/gs, '``')
	const code = enPositionDeCode(source('climat.ts'))

	/** Les fichiers de PRODUCTION d'un sous-arbre de `src/` : ni tests, ni fixtures. */
	function fichiersDeProduction(racine: string): string[] {
		return fs
			.readdirSync(racine, { withFileTypes: true })
			.flatMap((entreeDuDisque) => {
				const chemin = path.join(racine, entreeDuDisque.name)
				if (entreeDuDisque.isDirectory())
					return entreeDuDisque.name === '__fixtures__' ? [] : fichiersDeProduction(chemin)
				return /\.tsx?$/.test(entreeDuDisque.name) && !/\.test\.tsx?$/.test(entreeDuDisque.name) ? [chemin] : []
			})
			.sort()
	}

	it('il ne lit ni condition, ni la collection d evenements, ni monstre_ref, ni prose : seulement duree, effets_regles, depuis et tour', () => {
		// KR-246 : `declencheur_expr` n'a qu'un lecteur par événement, `evaluate.ts` — `evenementDeClimat` rend
		// déjà l'activation (`ActivationDeClimat`), donc ce module n'a aucune raison de relire un événement : il
		// lit `activation.climat_id`, jamais le champ d'un `Evenement` ni `monde.evenements`.
		const lectures: ReadonlyArray<readonly [string, RegExp]> = [
			['.declencheur_expr', /\.declencheur_expr\b/],
			['.declencheur_texte', /\.declencheur_texte\b/],
			['.evenements (la collection)', /\.evenements\b/],
			['.monstre_ref', /\.monstre_ref\b/],
			['.manifestation (audience ia)', /\.manifestation\b/],
			['.nom (audience auteur)', /\.nom\b/],
			['.op', /\.op\b/],
		]
		for (const [nom, motif] of lectures) {
			expect(`${nom} → ${motif.test(code)}`).toBe(`${nom} → false`)
		}
		// Discriminant : le balayage lit du CODE — les quatre lectures qu'il fait y sont bien.
		expect(code).toMatch(/\.duree\b/)
		expect(code).toMatch(/\.effets_regles\b/)
		expect(code).toMatch(/\.depuis\b/)
		expect(code).toMatch(/\.tour\b/)
		// Et le motif attrape RÉELLEMENT une lecture — et `evenements_consommes`, que ce module lit et écrit
		// légitimement, n'est PAS la collection d'événements.
		expect(/\.evenements\b/.test(enPositionDeCode('const e = dossier.monde.evenements'))).toBe(true)
		expect(/\.evenements\b/.test(enPositionDeCode('const c = session.monde.evenements_consommes'))).toBe(false)
	})

	it('l extinction compare avec >= et lit la duree du CLIMAT : session.horloge.tour − actif.depuis >= duree', () => {
		// § J3 : `>=` parce que l'extinction EFFACE l'état (le blocage, qui constate, tient `===`). Le test
		// comportemental ci-dessus (duree + 1) est ce qui tue `===` ; celui-ci fait que la FORMULE écrite en
		// docstring et la formule écrite en code ne puissent pas diverger en silence (KR-169).
		expect(code).toMatch(/session\.horloge\.tour\s*-\s*actif\.depuis\s*>=\s*duree/)
		expect(code).not.toMatch(/-\s*actif\.depuis\s*===/)
	})

	it('il retire la cle par delete sur une copie, jamais en la posant a undefined (KR-251)', () => {
		expect(code).toMatch(/delete\s+horloge\.climat_actif/)
		expect(code).not.toMatch(/climat_actif\s*:\s*undefined/)
	})

	it('ses imports : evaluate.ts en VALEUR, tout le reste en TYPE seul — aucune arete de valeur vers session.ts ni commandes.ts', () => {
		const imports = [...source('climat.ts').matchAll(/^import\s+(type\s+)?[^;\n]*?from\s+'([^']+)'/gm)].map((m) => ({
			type: m[1] !== undefined,
			de: m[2],
		}))

		expect(imports.map((i) => i.de).sort()).toEqual(['./evaluate', './faits', './session', './types'])
		// `session.ts` en TYPE SEUL : `commandes.ts` appelle `tickHorloge`, qui appelle ce module, et `session.ts`
		// type-importe `commandes.ts` — une arête de VALEUR nouerait un cycle.
		expect(
			imports
				.filter((i) => !i.type)
				.map((i) => i.de)
				.sort(),
		).toEqual(['./evaluate'])
		// Et le sélecteur vient bien de ce module-là — pas d'une relecture locale de l'événement.
		expect(source('climat.ts')).toMatch(/import\s*\{[^}]*\bevenementDeClimat\b[^}]*\}\s*from\s*'\.\/evaluate'/)
		expect(code).toMatch(/\bevenementDeClimat\(/)
	})

	it('pur et total : ni catch, ni cache, ni alea, ni horodatage — et il LEVE, par evaluerExpr, si la condition est inconnue', () => {
		for (const interdit of ['catch', 'try {', 'new Map', 'new WeakMap', 'cache', 'memo', 'Math.random', 'Date']) {
			expect(`${interdit} → ${code.toLowerCase().includes(interdit.toLowerCase())}`).toBe(`${interdit} → false`)
		}
	})

	it('il n ecrit ni origine, ni recit, ni jet, ni interlocuteur : la ligne n est la demande de personne', () => {
		// Les clés sont cherchées en TEXTE BRUT hors commentaires — chaînes comprises : une clé posée sur la ligne
		// passerait par un littéral d'objet, jamais par une chaîne.
		const brut = sansCommentaires(source('climat.ts'))
		for (const cle of ['origine', 'recit', 'jet', 'interlocuteur']) {
			expect(`${cle} → ${new RegExp(`\\b${cle}\\b`).test(brut)}`).toBe(`${cle} → false`)
		}
	})

	it('climat_actif a UN SEUL ecrivain dans src/, hors tests et fixtures : climat.ts — mesure, jamais esperee (KR-258)', () => {
		// Une écriture est une clé d'objet (`climat_actif:`), une affectation, ou un `delete`. Une LECTURE
		// (`session.horloge.climat_actif?.id`) n'en est pas une, et `session.ts` le DÉCLARE (`climat_actif?:`)
		// sans l'écrire. `commandes.ts` écrit `horloge` par spread — il ne nomme pas la clé.
		const ECRITURE = /\bclimat_actif\s*:|\bclimat_actif\s*=(?!=)|delete\s+[\w.]*\bclimat_actif\b/
		const ecrivains = fichiersDeProduction(RACINE_SRC)
			.filter((fichier) => ECRITURE.test(enPositionDeCode(lireSource(fichier))))
			.map((fichier) => path.relative(RACINE_SRC, fichier).split(path.sep).join('/'))

		expect(ecrivains).toEqual(['brain/dossier/climat.ts'])

		// Discriminance du motif (KR-199) : il attrape les trois formes d'écriture et aucune lecture.
		expect(ECRITURE.test(enPositionDeCode('const h = { tour, climat_actif: actif }'))).toBe(true)
		expect(ECRITURE.test(enPositionDeCode('horloge.climat_actif = actif'))).toBe(true)
		expect(ECRITURE.test(enPositionDeCode('delete horloge.climat_actif'))).toBe(true)
		expect(ECRITURE.test(enPositionDeCode('const id = session.horloge.climat_actif?.id'))).toBe(false)
		expect(ECRITURE.test(enPositionDeCode('readonly climat_actif?: { readonly id: string }'))).toBe(false)
		// Et le balayage voit bien le dépôt : sans cela, la liste pourrait être vide parce qu'il ne voit rien.
		expect(fichiersDeProduction(RACINE_SRC).length).toBeGreaterThan(100)
	})

	it('Climat.duree a deux lecteurs de decision dans le moteur — blocage.ts (plan) et climat.ts (climat) — et climat.ts ne lit pas plan_actions', () => {
		// Le balayage par mot de `blocage.test.ts` ne distingue pas les deux champs de même nom : ce témoin
		// distingue les deux SITES, par ce que chacun lit à côté de `.duree`.
		expect(enPositionDeCode(source('blocage.ts'))).toMatch(/\.plan_actions\?\.\[/)
		expect(code).not.toMatch(/\.plan_actions\b/)
		expect(enPositionDeCode(source('blocage.ts'))).not.toMatch(/\.conditions\b/)
		expect(code).toMatch(/\.conditions\.climat\b/)
	})
})
