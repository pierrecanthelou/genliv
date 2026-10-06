import fs from 'node:fs'
import path from 'node:path'
import { assemblerActeur } from '../copilote/contexte/acteur'
import { assemblerNarrateur } from '../copilote/contexte/narrateur'
import {
	COMMANDES,
	analyserSaisie,
	executerCommande,
	personnagesPresents,
	type CommandeId,
	type ResultatCommande,
} from './commandes'
import * as evaluateModule from './evaluate'
import type { ExprNode } from './expr'
import type { EtatPnj } from './faits'
import { tickHorloge } from './horloge'
import { consignerNarration, consignerReponseActeur } from './recit'
import { consignerJet, crediterConfiance, ouvrirSession, type EtatSession } from './session'
import type { Dossier, PlanAction } from './types'

/**
 * L'HORLOGE DES PNJ — `tickHorloge` (n° 14 `moteur-horloge`, it1, it2 puis it3, lot `contrat`,
 * `docs/REGLES-PLAY.md` § J2). L'it2 ajoute UNE écriture, `etape_plan.depuis` = le pas de
 * l'avancement, et ses tests : `describe` « depuis ». L'it3 ajoute UN constat, la ligne de journal
 * `etape_bloquee`, et ses tests : `describe` « blocage ». Les tests de l'it1 et de l'it2 sont
 * conservés, indépendants de la durée.
 *
 * LES DOSSIERS SONT LUS DU DISQUE (KR-156) puis MUTÉS EN TEST — un seul champ, le
 * `plan_actions[]` d'un ou deux personnages — quand le scénario exige un plan qu'aucune
 * fixture partagée ne porte : le dossier de référence n'a AUCUN plan à deux étapes ou
 * plus, c'est mesuré (premier test), et c'est ce qui en fait le TÉMOIN « sans tick » :
 * une commande exécutée sur lui rend la session D'AVANT tick, que `tickHorloge` reçoit
 * ensuite directement. Les sessions sont ouvertes par `ouvrirSession` et jouées par
 * `executerCommande` ; seuls les états que le produit ne peut PAS écrire (un rang
 * négatif, non entier, hors plan) sont forgés, et chacun le dit.
 *
 * `lire()` RETIRE LES `duree` du dossier de référence (Sélène 4, Corvin 2), et c'est ce qui garde
 * le témoin « sans tick » un no-op à CHAQUE pas : sans cela, Corvin constaterait un blocage au pas 2
 * et Sélène au pas 4 dans tout scénario un peu long, et le tick appelé à la main sur la session que
 * `executerCommande` vient de produire écrirait la MÊME ligne une seconde fois. `lireBrut()`
 * rend le dossier TEL QUE LE DISQUE LE PORTE, durées comprises, pour les tests du blocage qui
 * veulent les durées réelles (Sélène bloquée au pas 4, Corvin au pas 2).
 *
 * ⚠ CE FICHIER EST HORS DU SCORE DE MUTATION (KR-243) : `horloge.ts` n'est pas l'un des
 * quatre fichiers d'arithmétique de règles. `jest` est son UNIQUE instrument, et les
 * mutants nommés ci-dessous sont à écrire, voir rouges, puis révoquer — à la main.
 */

const MODULE_DOSSIER = __dirname
const CHEMIN_REFERENCE = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-reference.json')

const HAREK = 'pnj.harek-le-forgeron'
const CORVIN = 'pnj.corvin-le-marchand'
const AUBRY = 'pnj.aubry-l-intendant'
const SELENE = 'pnj.selene-la-vigie'

/** Le clone d'une fixture TEL QUE LE DISQUE LE PORTE, durées comprises — jamais muté en place (KR-156). */
function lireBrut(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

/** Le clone d'une fixture, SANS aucune `duree` de plan : l'avancement et le constat sont deux sujets. */
function lire(): Dossier {
	const dossier = lireBrut()
	for (const personnage of dossier.monde.personnages) {
		for (const etapeDuPlan of personnage.plan_actions) delete etapeDuPlan.duree
	}
	return dossier
}

/** Le dossier de référence sans durée : aucun plan à deux étapes, donc `tickHorloge` y est un no-op. */
const REFERENCE = lire()

function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

function executer(dossier: Dossier, session: EtatSession, saisie: string): ResultatCommande {
	const analyse = analyserSaisie(saisie)
	if (!analyse.ok) throw new Error(`saisie refusée (${analyse.refus}) : ${analyse.message}`)
	return executerCommande(dossier, session, analyse.commande)
}

function sessionDe(resultat: ResultatCommande): EtatSession {
	if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.session
}

function jouer(dossier: Dossier, depart: EtatSession, saisies: readonly string[]): EtatSession {
	return saisies.reduce((courante, saisie) => sessionDe(executer(dossier, courante, saisie)), depart)
}

/**
 * LES CONDITIONS D'ESSAI, lues du dossier de référence :
 *  · `FOYER_VISITE` — VRAIE DÈS L'OUVERTURE (le héros y part) ;
 *  · `TOUR_VISITEE`, `MARCHE_VISITE` — fausses jusqu'au pas qui y mène ;
 *  · `JAMAIS` — FAUSSE POUR TOUJOURS : `lieu.crypte-scellee` n'est l'accès d'aucun lieu.
 */
function visite(lieu: string): ExprNode {
	return { op: 'predicat', predicat: 'lieu_visite', cibles: [lieu] }
}
const FOYER_VISITE = visite('lieu.foyer-du-guet')
const TOUR_VISITEE = visite('lieu.tour-effondree')
const MARCHE_VISITE = visite('lieu.marche-des-cendres')
const JAMAIS = visite('lieu.crypte-scellee')

/**
 * UNE ÉTAPE FABRIQUÉE. Son champ `etape` vaut `100 − index` : DÉLIBÉRÉMENT hors de
 * l'ordre du tableau et jamais égal à `index + 1`, pour qu'une lecture du champ au
 * lieu de l'INDEX (KR-198) ne soit jamais confondue avec la bonne par coïncidence.
 */
function etape(index: number, declencheur?: ExprNode, reste: Partial<PlanAction> = {}): PlanAction {
	return {
		etape: 100 - index,
		action: `Intention de l'étape d'index ${index}.`,
		...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
		...reste,
	}
}

/** Le dossier de référence, le plan de CERTAINS personnages remplacé — rien d'autre ne bouge. */
function avecPlans(plans: Readonly<Record<string, PlanAction[]>>): Dossier {
	const dossier = lire()
	for (const personnage of dossier.monde.personnages) {
		const plan = plans[personnage.id]
		if (plan !== undefined) personnage.plan_actions = plan
	}
	return dossier
}

/** Trois étapes, toutes à condition VRAIE : toute sortie du plan serait un avancement visible. */
const TROIS_VRAIES = (): PlanAction[] => [etape(0, FOYER_VISITE), etape(1, FOYER_VISITE), etape(2, FOYER_VISITE)]

/** La session d'ouverture d'un dossier, `pnj[id]` posé tel quel — pour les états que le produit n'écrit pas. */
function avecEntree(session: EtatSession, id: string, entree: EtatSession['monde']['pnj'][string]): EtatSession {
	return { ...session, monde: { ...session.monde, pnj: { ...session.monde.pnj, [id]: entree } } }
}

/** Les lignes d'AVANCEMENT du tick dans un journal — reconnues à leur SEUL préfixe de champ, jamais à `origine`. */
function lignesDuTick(session: EtatSession): EtatSession['journal'] {
	return session.journal.filter((entree) => entree.texte.startsWith('etape_plan : '))
}

/** Les lignes de BLOCAGE du tick (it3) — même reconnaissance, par leur seul préfixe. */
function lignesDeBlocage(session: EtatSession): EtatSession['journal'] {
	return session.journal.filter((entree) => entree.texte.startsWith('etape_bloquee : '))
}

describe('le temoin « sans tick » : le dossier de reference n a aucun plan a deux etapes', () => {
	it('le tick y est un no-op pour chacun des trois verbes — c est ce qui autorise a l utiliser comme temoin', () => {
		expect(REFERENCE.monde.personnages.every((personnage) => personnage.plan_actions.length <= 1)).toBe(true)
		// Discriminant : la mesure n'est pas vide — le dossier porte bien des plans.
		expect(REFERENCE.monde.personnages.some((personnage) => personnage.plan_actions.length === 1)).toBe(true)
		// Et le témoin est SANS DURÉE parce que `lire()` les retire, pas parce que le disque n'en a pas :
		// Sélène (4) et Corvin (2) en portent une, et c'est ce que les tests du blocage lisent.
		expect(
			lireBrut()
				.monde.personnages.filter((personnage) => personnage.plan_actions.some((etapeDuPlan) => etapeDuPlan.duree))
				.map((personnage) => personnage.id)
				.sort(),
		).toEqual([CORVIN, SELENE].sort())
		expect(REFERENCE.monde.personnages.some((personnage) => personnage.plan_actions.some((e) => e.duree))).toBe(false)

		const depart = ouverture(REFERENCE)
		const saisies: Record<CommandeId, string> = {
			aller: 'ALLER lieu.marche-des-cendres',
			agir: 'AGIR',
			parler: `PARLER ${HAREK}`,
		}
		expect(Object.keys(saisies).sort()).toEqual(Object.keys(COMMANDES).sort())
		for (const saisie of Object.values(saisies)) {
			const apres = sessionDe(executer(REFERENCE, depart, saisie))
			expect(tickHorloge(REFERENCE, apres)).toBe(apres)
			expect(lignesDuTick(apres)).toEqual([])
		}
	})
})

describe('tickHorloge, le scenario separateur a trois etapes [A sans declencheur, B declencheur T1, C declencheur T2]', () => {
	/** T1 = la tour est visitée (fausse au départ) ; T2 = le foyer est visité (VRAIE dès le départ). */
	const PLAN = (): PlanAction[] => [etape(0), etape(1, TOUR_VISITEE), etape(2, FOYER_VISITE)]

	it('T1 faux et T2 vrai : rien ; T1 vrai : UN cran ; T2 vrai : UN cran — jamais un saut vers la derniere etape vraie', () => {
		const dossier = avecPlans({ [HAREK]: PLAN() })
		const depart = ouverture(dossier)

		// PAS 1 — T1 FAUX, T2 VRAI. Un tick qui lirait « la dernière étape vraie » sauterait
		// à l'étape C ; un tick qui lirait l'étape COURANTE ne ferait rien non plus — d'où
		// le pas 2, qui sépare. Le pas est joué sur le TÉMOIN pour recevoir la session
		// d'AVANT tick, puis le tick est appelé directement : la référence rendue est la
		// même.
		const pas1 = sessionDe(executer(REFERENCE, depart, 'AGIR'))
		expect(pas1.monde.lieux_visites).toEqual(['lieu.foyer-du-guet'])
		expect(tickHorloge(dossier, pas1)).toBe(pas1)

		// PAS 2 — T1 DEVIENT VRAI (la tour est visitée), et T2 l'est DÉJÀ : UN cran seulement.
		const pas2avant = sessionDe(executer(REFERENCE, pas1, 'ALLER lieu.tour-effondree'))
		const pas2 = tickHorloge(dossier, pas2avant)
		expect(pas2).not.toBe(pas2avant)
		expect(pas2.monde.pnj[HAREK]).toEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 2 } })
		expect(pas2.journal.slice(pas2avant.journal.length)).toEqual([
			{ tour: 2, role: 'moteur', texte: `etape_plan : ${HAREK} 2` },
		])

		// PAS 3 — T2 est vrai depuis le pas 1 : le cran SUIVANT, un pas plus tard.
		const pas3avant = sessionDe(executer(REFERENCE, pas2, 'ALLER lieu.foyer-du-guet'))
		const pas3 = tickHorloge(dossier, pas3avant)
		expect(pas3.monde.pnj[HAREK]).toEqual({ a_dit: [], etape_plan: { rang: 2, depuis: 3 } })
		expect(pas3.journal.slice(pas3avant.journal.length)).toEqual([
			{ tour: 3, role: 'moteur', texte: `etape_plan : ${HAREK} 2 → 3` },
		])

		// PAS 4 — le dernier rang : plus rien, même référence.
		const pas4 = sessionDe(executer(REFERENCE, pas3, 'AGIR'))
		expect(tickHorloge(dossier, pas4)).toBe(pas4)
	})

	it('le chemin complet par executerCommande rend les memes etats que les ticks appeles a la main', () => {
		const dossier = avecPlans({ [HAREK]: PLAN() })
		const depart = ouverture(dossier)
		const etats = ['AGIR', 'ALLER lieu.tour-effondree', 'ALLER lieu.foyer-du-guet', 'AGIR'].reduce<EtatSession[]>(
			(vus, saisie) => [...vus, sessionDe(executer(dossier, vus[vus.length - 1], saisie))],
			[depart],
		)

		expect(etats.map((etat) => etat.monde.pnj[HAREK]?.etape_plan?.rang)).toEqual([undefined, undefined, 1, 2, 2])
		expect(etats.map((etat) => lignesDuTick(etat).map((ligne) => ligne.texte))).toEqual([
			[],
			[],
			[`etape_plan : ${HAREK} 2`],
			[`etape_plan : ${HAREK} 2`, `etape_plan : ${HAREK} 2 → 3`],
			[`etape_plan : ${HAREK} 2`, `etape_plan : ${HAREK} 2 → 3`],
		])
	})

	it('une entree stockee au rang 0 se lit comme l absence : meme avancement, la fleche en plus (absent === rang 0)', () => {
		const dossier = avecPlans({ [HAREK]: PLAN() })
		const pas2avant = sessionDe(executer(REFERENCE, ouverture(dossier), 'ALLER lieu.tour-effondree'))

		const absent = tickHorloge(dossier, pas2avant)
		const aZero = tickHorloge(dossier, avecEntree(pas2avant, HAREK, { a_dit: [], etape_plan: { rang: 0 } }))

		// MÊME ÉTAT, et c'est le contrat de KR-013 : l'absence et `rang: 0` sont deux
		// écritures du même fait.
		expect(aZero.monde.pnj[HAREK]).toEqual(absent.monde.pnj[HAREK])
		// Seule la ligne diffère : « premier écrit » (clé absente) sans flèche, puis avec.
		expect(lignesDuTick(absent).map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 2`])
		expect(lignesDuTick(aZero).map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 1 → 2`])
	})
})

describe('tickHorloge, depuis : le pas de l avancement, ecrit avec rang et jamais autrement (n 14 it2, KR-298)', () => {
	/** B ne devient vraie qu'à la visite de la tour ; C (le foyer est visité) est vraie dès le départ. */
	const PLAN = (): PlanAction[] => [etape(0), etape(1, TOUR_VISITEE), etape(2, FOYER_VISITE)]

	it('avancement ecrit depuis = tour : le pas COURANT — ni 0, ni rang, ni tour + 1 — reecrit a l avancement suivant', () => {
		// MUTANTS NOMMÉS, À ÉCRIRE PUIS RÉVOQUER : `depuis: 0`, `depuis: rang`, `depuis:
		// session.horloge.tour + 1`. Les valeurs sont toutes DISTINCTES au pas 5 (rang 1, pas
		// précédent 4, pas suivant 6) : aucune coïncidence ne peut passer pour la bonne.
		const dossier = avecPlans({ [HAREK]: PLAN() })
		const avant = jouer(REFERENCE, ouverture(dossier), ['AGIR', 'AGIR', 'AGIR', 'AGIR', 'ALLER lieu.tour-effondree'])
		expect(avant.horloge.tour).toBe(5)
		expect(avant.monde.pnj).toEqual({})

		const apres = tickHorloge(dossier, avant)

		expect(apres.monde.pnj[HAREK]).toStrictEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 5 } })
		expect(apres.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(apres.horloge.tour)
		// Le tick n'ajoute PAS de pas (J1) : `depuis` est le pas courant, jamais le suivant.
		expect(apres.horloge).toEqual({ tour: 5 })

		// L'avancement SUIVANT RÉÉCRIT `depuis` : un pas plus tard, C est vraie à son tour.
		const pas6 = sessionDe(executer(REFERENCE, apres, 'AGIR'))
		expect(pas6.horloge.tour).toBe(6)
		expect(tickHorloge(dossier, pas6).monde.pnj[HAREK]?.etape_plan).toStrictEqual({ rang: 2, depuis: 6 })
	})

	it('pas d avancement → pas de depuis : un personnage qui n avance pas garde son entree TELLE QUELLE, sans depuis cree ni touche', () => {
		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : « rafraîchir » `depuis` à chaque tick pour les
		// personnages déjà avancés — il ferait de `depuis` un « dernier pas du tick », et
		// `depuis === horloge.tour` dirait « avancé à ce pas » à tout PNJ du monde.
		const dossier = avecPlans({
			[HAREK]: [etape(0), etape(1, TOUR_VISITEE), etape(2, JAMAIS)],
			[CORVIN]: [etape(0), etape(1, JAMAIS)],
		})
		const pas2 = jouer(dossier, ouverture(dossier), ['AGIR', 'ALLER lieu.tour-effondree'])
		const entree = pas2.monde.pnj[HAREK]
		expect(entree).toStrictEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 2 } })
		// Corvin n'a PAS avancé : aucune entrée du tout, donc aucun `depuis`.
		expect(Object.keys(pas2.monde.pnj)).toEqual([HAREK])

		const pas5 = jouer(dossier, pas2, ['AGIR', 'AGIR', 'AGIR'])

		expect(pas5.horloge.tour).toBe(5)
		// MÊME RÉFÉRENCE : ni créé, ni réécrit, ni « rafraîchi » au pas courant.
		expect(pas5.monde.pnj[HAREK]).toBe(entree)
		expect(pas5.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(2)
		expect(Object.keys(pas5.monde.pnj)).toEqual([HAREK])
		// Et le tick direct rend la MÊME session : rien ne change, `depuis` compris.
		expect(tickHorloge(dossier, pas5)).toBe(pas5)
		// Une session où RIEN n'a jamais avancé ne porte le mot nulle part.
		const jamaisAvance = jouer(REFERENCE, ouverture(dossier), ['AGIR', 'AGIR'])
		expect(JSON.stringify(tickHorloge(dossier, jamaisAvance))).not.toContain('depuis')
	})

	it('un seul des deux personnages avance : celui-la recoit depuis, l autre garde son entree sans y toucher', () => {
		const dossier = avecPlans({
			[CORVIN]: [etape(0), etape(1, FOYER_VISITE)],
			[HAREK]: [etape(0), etape(1, FOYER_VISITE), etape(2, JAMAIS)],
		})
		const base = jouer(REFERENCE, ouverture(dossier), ['AGIR', 'AGIR'])
		// L'entrée de Harek est celle que le tick a écrite à son avancement au pas 1 — posée telle
		// quelle sur la session du pas 2, et sa condition SUIVANTE est fausse pour toujours.
		const depart = avecEntree(base, HAREK, { a_dit: [], etape_plan: { rang: 1, depuis: 1 } })

		const apres = tickHorloge(dossier, depart)

		expect(apres.monde.pnj[CORVIN]).toStrictEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 2 } })
		expect(apres.monde.pnj[HAREK]).toBe(depart.monde.pnj[HAREK])
		expect(apres.monde.pnj[HAREK]?.etape_plan).toStrictEqual({ rang: 1, depuis: 1 })
	})

	it('session 0.7.21 {rang} sans depuis : le tick ne leve pas, n invente aucun depuis, et avance comme a l it1 (KR-251)', () => {
		const AUTRES = ['indice.pas-dans-la-cendre']
		const dossier = avecPlans({ [HAREK]: TROIS_VRAIES() })
		const jouee = jouer(REFERENCE, ouverture(dossier), ['AGIR', 'AGIR', 'AGIR', 'AGIR'])
		// FORGÉE, et c'est le point : la forme que 0.7.21 écrivait — `{ rang }` SANS `depuis` —
		// ne peut plus être produite par le tick, mais reste CELLE DES PARTIES DÉJÀ PERSISTÉES.
		const ancienne = avecEntree(jouee, HAREK, { a_dit: AUTRES, etape_plan: { rang: 1 } })
		const moderne = avecEntree(jouee, HAREK, { a_dit: AUTRES, etape_plan: { rang: 1, depuis: 3 } })
		expect(jouee.horloge.tour).toBe(4)

		// (a) ELLE AVANCE : le rang et la ligne sont ceux de l'it1, et `depuis` est le pas courant.
		const apres = tickHorloge(dossier, ancienne)
		expect(apres.monde.pnj[HAREK]).toStrictEqual({ a_dit: AUTRES, etape_plan: { rang: 2, depuis: 4 } })
		expect(lignesDuTick(apres).map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 2 → 3`])
		// Le `depuis` d'ENTRÉE n'est jamais lu : une entrée au `depuis` périmé (3) rend EXACTEMENT
		// la même session. Un tick qui lirait l'ancien `depuis` ou son absence les distinguerait.
		expect(tickHorloge(dossier, moderne)).toStrictEqual(apres)

		// (b) ELLE N'AVANCE PAS (la suite est fausse) : même référence, aucun `depuis` inventé —
		// ni `0`, ni le pas courant.
		const sansSuite = avecPlans({ [HAREK]: [etape(0), etape(1, FOYER_VISITE), etape(2, JAMAIS)] })
		const fixe = avecEntree(jouer(REFERENCE, ouverture(sansSuite), ['AGIR', 'AGIR']), HAREK, {
			a_dit: [],
			etape_plan: { rang: 1 },
		})
		const rendue = tickHorloge(sansSuite, fixe)
		expect(rendue).toBe(fixe)
		expect(Object.keys(rendue.monde.pnj[HAREK]?.etape_plan ?? {})).toEqual(['rang'])

		// (c) PAR LE CHEMIN COMPLET : la commande suivante la joue sans lever, et date l'avancement.
		const suite = sessionDe(executer(dossier, ancienne, 'AGIR'))
		expect(suite.monde.pnj[HAREK]?.etape_plan).toStrictEqual({ rang: 2, depuis: 5 })
	})
})

describe('tickHorloge, la duree CONSTATE, elle ne fait JAMAIS avancer (REJETE R-1 : la minuterie est abolie, § J2)', () => {
	it('une etape a duree 1 dont le declencheur suivant reste faux : aucun avancement, le constat tombe UNE fois, au pas 1', () => {
		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : faire avancer le PNJ quand `duree` est
		// échue, quel que soit le déclencheur de l'étape suivante. Il écrirait ici `etape_plan` dès
		// le pas 1 — et ferait de la durée une minuterie, que J2 abolit : une durée échue constate
		// un blocage (it3), elle ne fait jamais avancer.
		const dossier = avecPlans({
			[HAREK]: [
				etape(0, undefined, { duree: 1, si_bloque: 'Il change de plan.' }),
				etape(1, JAMAIS, { duree: 1, si_bloque: 'Il change encore.' }),
			],
		})
		let courante = ouverture(dossier)

		for (let pas = 1; pas <= 5; pas += 1) {
			courante = sessionDe(executer(REFERENCE, courante, 'AGIR'))
			expect(`pas ${pas} → ${courante.horloge.tour}`).toBe(`pas ${pas} → ${pas}`)
			const apres = tickHorloge(dossier, courante)
			// `duree: 1`, origine 0 : l'échéance tombe au pas 1, et à AUCUN autre (front `===`).
			expect(`pas ${pas} → ${apres === courante}`).toBe(`pas ${pas} → ${pas !== 1}`)
			// JAMAIS d'avancement, ni d'entrée, ni de `depuis` : le monde garde sa référence.
			expect(apres.monde).toBe(courante.monde)
			expect(apres.monde.pnj).toEqual({})
		}
		expect(courante.monde.pnj).toEqual({})
	})

	it('une etape suivante SANS declencheur, duree posee : elle reste, et sa duree n est jamais lue tant qu on n y est pas', () => {
		const dossier = avecPlans({ [HAREK]: [etape(0, undefined, { duree: 1 }), etape(1, undefined, { duree: 1 })] })
		let courante = ouverture(dossier)

		for (let pas = 1; pas <= 5; pas += 1) {
			courante = sessionDe(executer(REFERENCE, courante, 'AGIR'))
			const apres = tickHorloge(dossier, courante)
			// Au pas 1 le constat de l'étape COURANTE (rang 0, `duree: 1`) ; ensuite rien : la durée de
			// l'étape VISÉE (`duree: 1` aussi) ne s'est lue à aucun pas.
			expect(`pas ${pas} → ${apres === courante}`).toBe(`pas ${pas} → ${pas !== 1}`)
			expect(apres.monde.pnj).toEqual({})
			expect(lignesDuTick(apres)).toEqual([])
		}
	})
})

describe('tickHorloge, blocage : la ligne etape_bloquee, au pas d echeance, une fois (n 14 it3)', () => {
	/** Un plan de Harek sans condition suivante vraie : il reste à son étape, et c'est elle qui se bloque. */
	const PLAN_BLOQUE = (duree: number, reste: Partial<PlanAction> = {}): PlanAction[] => [
		etape(0, undefined, { duree, ...reste }),
		etape(1, JAMAIS),
	]

	function jouerNPas(dossier: Dossier, pas: number): EtatSession[] {
		const etats: EtatSession[] = [ouverture(dossier)]
		for (let i = 1; i <= pas; i += 1) etats.push(sessionDe(executer(dossier, etats[i - 1], 'AGIR')))
		return etats
	}

	it('journal-etape-bloquee : la ligne tombe au pas tour - origine === duree, au tour courant, role moteur, trois cles', () => {
		const dossier = avecPlans({ [HAREK]: PLAN_BLOQUE(3) })

		const etats = jouerNPas(dossier, 6)

		// Zéro ligne aux pas 1 et 2 (duree − 1), UNE au pas 3, et toujours UNE aux pas 4 à 6 (duree + 1 :
		// pas de second constat — le front est `===`, jamais `>=`).
		expect(etats.map((etat) => lignesDeBlocage(etat).length)).toEqual([0, 0, 0, 1, 1, 1, 1])
		const ligne = lignesDeBlocage(etats[3])[0]
		expect(ligne).toEqual({ tour: 3, role: 'moteur', texte: `etape_bloquee : ${HAREK} 1` })
		// TROIS clés, et trois seulement : ni `origine`, ni `deltas`, ni `recit`, ni `jet`, ni `interlocuteur`.
		expect(Object.keys(ligne).sort()).toEqual(['role', 'texte', 'tour'])
		// La ligne est la DERNIÈRE de son pas : après la demande et son effet, au MÊME tour — le tick
		// n'ajoute pas de pas (J1) — et la session n'a ni entrée de personnage ni `etape_plan`.
		expect(etats[3].journal.map((entree) => entree.tour)).toEqual([1, 1, 2, 2, 3, 3, 3])
		expect(etats[3].journal[6]).toBe(ligne)
		expect(etats[3].horloge.tour).toBe(3)
		expect(etats[3].monde.pnj).toEqual({})
		// UNE ligne, pas une par pas : la ligne du pas 3 est LA MÊME référence aux pas suivants.
		expect(lignesDeBlocage(etats[6])[0]).toBe(ligne)
		// L'INVARIANT D'`origine` TIENT : seules les entrées de commande en portent.
		expect(etats[6].journal.filter((entree) => entree.origine !== undefined)).toHaveLength(6)
	})

	it('journal-meme-sans-si-bloque : la ligne s ecrit sans si_bloque redige, et elle ne porte jamais sa prose', () => {
		const PROSE = 'Il change de plan et part pour le marché des cendres.'
		const avec = avecPlans({ [HAREK]: PLAN_BLOQUE(2, { si_bloque: PROSE }) })
		const sans = avecPlans({ [HAREK]: PLAN_BLOQUE(2) })

		const sessionAvec = jouerNPas(avec, 2)[2]
		const sessionSans = jouerNPas(sans, 2)[2]

		// L'auteur voit TOUJOURS le constat, qu'il ait écrit une réplique de repli ou non…
		expect(lignesDeBlocage(sessionSans)).toEqual([{ tour: 2, role: 'moteur', texte: `etape_bloquee : ${HAREK} 1` }])
		// … et la ligne est la MÊME : `si_bloque` ne change rien au journal.
		expect(lignesDeBlocage(sessionAvec)).toEqual(lignesDeBlocage(sessionSans))
		expect(JSON.stringify(sessionAvec.journal)).not.toContain('marché des cendres')
		expect(JSON.stringify(sessionAvec.journal)).not.toContain(PROSE)
	})

	it('le rang de la ligne est en base 1 et l origine est le pas ECRIT : un PNJ avance au pas 2 est bloque a depuis + duree', () => {
		// Harek : B (rang 1, `duree: 2`) devient courante au pas 2 — la tour est visitée — et sa condition
		// SUIVANTE est fausse pour toujours. L'origine 0 donnerait un constat au pas 2 ; `depuis`, au pas 4.
		const dossier = avecPlans({
			[HAREK]: [etape(0), etape(1, TOUR_VISITEE, { duree: 2 }), etape(2, JAMAIS)],
		})
		const etats: EtatSession[] = [ouverture(dossier)]
		for (const saisie of ['AGIR', 'ALLER lieu.tour-effondree', 'AGIR', 'AGIR', 'AGIR']) {
			etats.push(sessionDe(executer(dossier, etats[etats.length - 1], saisie)))
		}

		expect(etats[2].monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 2 })
		expect(etats.map((etat) => lignesDeBlocage(etat).length)).toEqual([0, 0, 0, 0, 1, 1])
		expect(lignesDeBlocage(etats[4])).toEqual([{ tour: 4, role: 'moteur', texte: `etape_bloquee : ${HAREK} 2` }])
		// `etape_plan` n'a PAS bougé au constat : même référence que l'entrée d'avant, `depuis` compris —
		// un blocage ne ré-date pas l'étape.
		expect(etats[4].monde.pnj[HAREK]).toBe(etats[3].monde.pnj[HAREK])
		expect(etats[4].monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 2 })
	})

	it('avancement-emporte-blocage : declencheur vrai ET echeance au meme pas — UNE ligne etape_plan, aucun constat', () => {
		// Harek, rang 0 : `duree: 1`, origine 0 → l'échéance tombe au pas 1, et l'étape visée est VRAIE
		// dès le départ (le foyer est visité). Un tick qui constaterait AVANT d'avancer écrirait deux lignes.
		const dossier = avecPlans({ [HAREK]: [etape(0, undefined, { duree: 1 }), etape(1, FOYER_VISITE)] })
		const pas1 = jouerNPas(dossier, 1)[1]

		expect(lignesDuTick(pas1).map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 2`])
		expect(lignesDeBlocage(pas1)).toEqual([])
		expect(pas1.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
		// Et au pas suivant : le plan est épuisé, l'étape 1 n'a pas de durée — plus rien.
		const pas2 = sessionDe(executer(dossier, pas1, 'AGIR'))
		expect(lignesDeBlocage(pas2)).toEqual([])

		// DISCRIMINANT, DANS LE MÊME TEST : même plan, étape visée FAUSSE — le constat tombe, et seul lui.
		const sansSuite = avecPlans({ [HAREK]: [etape(0, undefined, { duree: 1 }), etape(1, JAMAIS)] })
		const bloque = jouerNPas(sansSuite, 1)[1]
		expect(lignesDeBlocage(bloque).map((ligne) => ligne.texte)).toEqual([`etape_bloquee : ${HAREK} 1`])
		expect(lignesDuTick(bloque)).toEqual([])
	})

	it('le dossier de reference, tel que le disque le porte : Corvin est bloque au pas 2 et Selene au pas 4 — rang 0, origine 0', () => {
		// Les durées RÉELLES (Corvin 2, Sélène 4), et aucune entrée `etape_plan` : l'étape de départ est
		// occupée depuis l'ouverture. Sans l'origine 0 (rang 0 ou absent), ni l'un ni l'autre ne
		// serait JAMAIS atteint — et la `si_bloque` qu'ils portent resterait du contenu mort.
		const dossier = lireBrut()
		const etats = jouerNPas(dossier, 6)

		expect(
			etats.map((etat) =>
				lignesDeBlocage(etat)
					.map((ligne) => `${ligne.tour}:${ligne.texte}`)
					.join(' | '),
			),
		).toEqual([
			'',
			'',
			`2:etape_bloquee : ${CORVIN} 1`,
			`2:etape_bloquee : ${CORVIN} 1`,
			`2:etape_bloquee : ${CORVIN} 1 | 4:etape_bloquee : ${SELENE} 1`,
			`2:etape_bloquee : ${CORVIN} 1 | 4:etape_bloquee : ${SELENE} 1`,
			`2:etape_bloquee : ${CORVIN} 1 | 4:etape_bloquee : ${SELENE} 1`,
		])
		// Aucun des deux n'a avancé, aucune entrée n'a été créée.
		expect(etats[6].monde.pnj).toEqual({})
		expect(lignesDuTick(etats[6])).toEqual([])
	})

	it('{ rang >= 1 } sans depuis n est JAMAIS bloque : pas de depuis invente, aucune ligne, a aucun des dix pas (KR-251)', () => {
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, JAMAIS, { duree: 1 }), etape(2, JAMAIS)] })
		// FORGÉ, c'est le point : la forme que 0.7.21 écrivait — `{ rang }` SANS `depuis`.
		const ancienne = avecEntree(ouverture(dossier), HAREK, { a_dit: [], etape_plan: { rang: 1 } })
		let courante = ancienne

		for (let pas = 1; pas <= 10; pas += 1) {
			courante = sessionDe(executer(dossier, courante, 'AGIR'))
			expect(`pas ${pas} → ${lignesDeBlocage(courante).length}`).toBe(`pas ${pas} → 0`)
		}
		expect(courante.monde.pnj[HAREK]).toBe(ancienne.monde.pnj[HAREK])
		expect(courante.monde.pnj[HAREK]?.etape_plan).toStrictEqual({ rang: 1 })

		// DISCRIMINANT, DANS LE MÊME TEST : la même entrée AVEC `depuis: 2` est bloquée à 2 + 1 = 3.
		const datee = avecEntree(ouverture(dossier), HAREK, { a_dit: [], etape_plan: { rang: 1, depuis: 2 } })
		const suite = Array.from({ length: 4 }, (_, i) => i).reduce<EtatSession[]>(
			(vues) => [...vues, sessionDe(executer(dossier, vues[vues.length - 1], 'AGIR'))],
			[datee],
		)
		expect(suite.map((etat) => lignesDeBlocage(etat).length)).toEqual([0, 0, 0, 1, 1])
		expect(lignesDeBlocage(suite[3])[0].texte).toBe(`etape_bloquee : ${HAREK} 2`)
	})

	it('etape-plan-meme-reference : au pas d echeance seul le journal change — monde, entree et etape_plan gardent leur reference', () => {
		// Une entrée DATÉE, forgée sur la session du pas 4 : B (rang 1, `duree: 2`, `depuis: 2`) tombe à 4.
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, undefined, { duree: 2 }), etape(2, JAMAIS)] })
		const base = jouer(REFERENCE, ouverture(dossier), ['AGIR', 'AGIR', 'AGIR', 'AGIR'])
		const avant = avecEntree(base, HAREK, {
			a_dit: ['indice.pas-dans-la-cendre'],
			confiance: 1,
			etape_plan: { rang: 1, depuis: 2 },
		})
		expect(avant.horloge.tour).toBe(4)

		const apres = tickHorloge(dossier, avant)

		expect(apres).not.toBe(avant)
		// La minuterie reste abolie : RIEN de `monde` n'a été réécrit, pas même par une copie égale.
		expect(apres.monde).toBe(avant.monde)
		expect(apres.monde.pnj).toBe(avant.monde.pnj)
		expect(apres.monde.pnj[HAREK]).toBe(avant.monde.pnj[HAREK])
		expect(apres.monde.pnj[HAREK]?.etape_plan).toBe(avant.monde.pnj[HAREK]?.etape_plan)
		expect(apres.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(2)
		// Seul le journal diffère, d'UNE ligne : la session d'avant, journal rendu, est celle d'après.
		expect(apres.journal).toHaveLength(avant.journal.length + 1)
		expect({ ...apres, journal: avant.journal }).toStrictEqual(avant)
		expect(apres.journal[avant.journal.length]).toEqual({
			tour: 4,
			role: 'moteur',
			texte: `etape_bloquee : ${HAREK} 2`,
		})
		// Aucune horloge ne bouge : le tick n'ajoute pas de pas (J1).
		expect(apres.horloge).toBe(avant.horloge)
	})

	it('les rangs hors bornes ne constatent rien non plus, meme a l echeance : MEME REFERENCE, aucune exception', () => {
		const dossier = avecPlans({ [HAREK]: [etape(0, undefined, { duree: 1 }), etape(1, undefined, { duree: 1 })] })
		const depart: EtatSession = { ...ouverture(dossier), horloge: { tour: 1 } }

		for (const rang of [-1, 1.5, Number.NaN, 7, '1' as unknown as number]) {
			const forge = avecEntree(depart, HAREK, { a_dit: [], etape_plan: { rang, depuis: 0 } })
			expect(`rang ${String(rang)} → ${tickHorloge(dossier, forge) === forge}`).toBe(`rang ${String(rang)} → true`)
		}
		// DISCRIMINANT : les rangs valides, mêmes `depuis` et `duree`, sont bloqués à 0 + 1.
		for (const rang of [0, 1]) {
			const valide = avecEntree(depart, HAREK, { a_dit: [], etape_plan: { rang, depuis: 0 } })
			expect(lignesDeBlocage(tickHorloge(dossier, valide)).map((ligne) => ligne.texte)).toEqual([
				`etape_bloquee : ${HAREK} ${rang + 1}`,
			])
		}
	})

	it('deux constats et un avancement au meme pas : dans l ordre du document, chacun sa ligne, chacun son personnage', () => {
		// Corvin (1er) et Aubry (3e) sont BLOQUÉS ; Harek (2e) AVANCE. L'avancement de l'un n'efface
		// pas le constat des autres : l'exclusion est PAR PERSONNAGE, par le flot de contrôle du tick.
		const dossier = avecPlans({
			[CORVIN]: [etape(0, undefined, { duree: 1 }), etape(1, JAMAIS)],
			[HAREK]: [etape(0, undefined, { duree: 1 }), etape(1, FOYER_VISITE)],
			[AUBRY]: [etape(0, undefined, { duree: 1 }), etape(1, JAMAIS)],
		})
		expect(dossier.monde.personnages.map((p) => p.id).filter((id) => [AUBRY, HAREK, CORVIN].includes(id))).toEqual([
			CORVIN,
			HAREK,
			AUBRY,
		])

		const pas1 = jouerNPas(dossier, 1)[1]

		expect(pas1.journal.slice(2).map((ligne) => ligne.texte)).toEqual([
			`etape_bloquee : ${CORVIN} 1`,
			`etape_plan : ${HAREK} 2`,
			`etape_bloquee : ${AUBRY} 1`,
		])
		expect(Object.keys(pas1.monde.pnj)).toEqual([HAREK])
	})
})

describe('tickHorloge, les cas limites — MEME REFERENCE, aucune ligne, aucune exception', () => {
	interface Cas {
		readonly nom: string
		readonly plan: PlanAction[]
		/** L'entrée `etape_plan` FORGÉE — le produit n'écrit jamais ces rangs-là. */
		readonly rang?: number
	}

	const CAS: readonly Cas[] = [
		{ nom: 'plan vide', plan: [] },
		{ nom: 'plan d une seule etape', plan: [etape(0, FOYER_VISITE)] },
		{ nom: 'dernier rang', plan: TROIS_VRAIES(), rang: 2 },
		{ nom: 'rang 7 sur un plan de 3', plan: TROIS_VRAIES(), rang: 7 },
		// LES DEUX CAS QUE `plan_actions[n] === undefined` SEUL NE COUVRIRAIT PAS : `-1`
		// vise l'étape 0, qui EXISTE, et dont la condition est VRAIE ici.
		{ nom: 'rang -1', plan: TROIS_VRAIES(), rang: -1 },
		{ nom: 'rang 1.5', plan: TROIS_VRAIES(), rang: 1.5 },
		{ nom: 'rang NaN', plan: TROIS_VRAIES(), rang: Number.NaN },
		{ nom: 'declencheur absent sur l etape visee', plan: [etape(0), etape(1)] },
	]

	it('chaque cas rend la session telle quelle, sans lever', () => {
		for (const cas of CAS) {
			const dossier = avecPlans({ [HAREK]: cas.plan })
			const depart = ouverture(dossier)
			const session =
				cas.rang === undefined ? depart : avecEntree(depart, HAREK, { a_dit: [], etape_plan: { rang: cas.rang } })

			expect(`${cas.nom} → ${tickHorloge(dossier, session) === session}`).toBe(`${cas.nom} → true`)
		}
		// DISCRIMINANT, DANS LE MÊME TEST : les mêmes plans, un rang VALIDE, avancent — sans
		// cela, la boucle ci-dessus serait verte sur un tick qui ne ferait jamais rien.
		const dossier = avecPlans({ [HAREK]: TROIS_VRAIES() })
		const depart = ouverture(dossier)
		expect(tickHorloge(dossier, depart)).not.toBe(depart)
		const aUn = avecEntree(depart, HAREK, { a_dit: [], etape_plan: { rang: 1 } })
		// Le tick est appelé DIRECTEMENT sur la session d'ouverture : le pas courant est le pas 0.
		expect(tickHorloge(dossier, aUn).monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 2, depuis: depart.horloge.tour })
	})

	it('un rang negatif ou non entier n ecrit RIEN meme quand l etape visee existe : la garde est explicite', () => {
		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : retirer le test `Number.isInteger(rang) &&
		// rang >= 0` de `horloge.ts`. Le rang `-1` vise alors `plan_actions[0]`, qui existe
		// et dont la condition est vraie : le PNJ « avancerait » au rang 0 avec une ligne
		// `1 → 0`. Seule cette garde sépare ce cas de la « sortie par le haut ».
		const dossier = avecPlans({ [HAREK]: TROIS_VRAIES() })
		const depart = ouverture(dossier)
		const negatif = avecEntree(depart, HAREK, { a_dit: ['indice.pas-dans-la-cendre'], etape_plan: { rang: -1 } })

		const apres = tickHorloge(dossier, negatif)

		expect(apres).toBe(negatif)
		expect(lignesDuTick(apres)).toEqual([])
		expect(apres.monde.pnj[HAREK]).toEqual({ a_dit: ['indice.pas-dans-la-cendre'], etape_plan: { rang: -1 } })
	})

	it('le rang est l INDEX du tableau, jamais le champ etape (KR-198)', () => {
		// Les trois étapes portent `etape: 100, 99, 98` — un tri par `etape` inverserait le
		// tableau. L'index 1 est FAUX, l'index 2 VRAI : sous un tri par `etape`, le rang visé
		// serait la dernière étape (VRAIE) et le PNJ avancerait.
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, JAMAIS), etape(2, FOYER_VISITE)] })
		expect(dossier.monde.personnages.find((p) => p.id === HAREK)?.plan_actions.map((p) => p.etape)).toEqual([
			100, 99, 98,
		])
		const depart = ouverture(dossier)

		expect(tickHorloge(dossier, depart)).toBe(depart)

		// DISCRIMINANT : le même plan, les deux conditions échangées — l'index 1 est vrai.
		const echange = avecPlans({ [HAREK]: [etape(0), etape(1, FOYER_VISITE), etape(2, JAMAIS)] })
		const departEchange = ouverture(echange)
		expect(tickHorloge(echange, departEchange).monde.pnj[HAREK]?.etape_plan).toEqual({
			rang: 1,
			depuis: departEchange.horloge.tour,
		})
	})
})

describe('tickHorloge, un plan ecrit en prose seule : le PNJ est immobile', () => {
	it('aucun declencheur_expr dans aucune etape : trois pas, aucun avancement, aucune ecriture de monde — la duree, elle, se constate', () => {
		const prose = (index: number): PlanAction =>
			etape(index, undefined, { declencheur_texte: `Le joueur fait quelque chose à l'étape ${index}.`, duree: 2 })
		const dossier = avecPlans({ [HAREK]: [prose(0), prose(1), prose(2)], [CORVIN]: [prose(0), prose(1)] })
		const depart = ouverture(dossier)

		const apres = jouer(dossier, depart, ['AGIR', 'ALLER lieu.marche-des-cendres', 'ALLER lieu.foyer-du-guet'])

		expect(apres.monde.pnj).toEqual({})
		expect(lignesDuTick(apres)).toEqual([])
		// HUIT lignes pour trois pas : la demande et son effet, six fois — plus DEUX constats de blocage
		// au pas 2 (it3), un par personnage dont la `duree: 2` de l'étape de départ y tombe, dans l'ordre
		// du document (Corvin, puis Harek). Un plan en prose seule est immobile, il n'est pas muet : la
		// durée constate, elle ne fait jamais avancer.
		expect(apres.journal).toHaveLength(8)
		expect(lignesDeBlocage(apres).map((ligne) => [ligne.tour, ligne.texte])).toEqual([
			[2, `etape_bloquee : ${CORVIN} 1`],
			[2, `etape_bloquee : ${HAREK} 1`],
		])
		// Au pas 3, `3 − 0 !== 2` : aucun second constat, le tick direct rend la même session.
		expect(tickHorloge(dossier, apres)).toBe(apres)
	})
})

describe('tickHorloge, plusieurs personnages : l ordre du document, un cran chacun', () => {
	it('deux pas, trois personnages — l ordre est monde.personnages[], ni l alphabetique ni celui de monde.pnj', () => {
		// L'ORDRE DU DOCUMENT : corvin (1) < harek (4) < aubry (5). L'ordre ALPHABÉTIQUE
		// serait aubry < corvin < harek, et l'ordre d'insertion de `monde.pnj` — posé ici
		// À REBOURS — aubry, harek, corvin : les trois ordres sont deux à deux distincts.
		const dossier = avecPlans({ [AUBRY]: TROIS_VRAIES(), [HAREK]: TROIS_VRAIES(), [CORVIN]: TROIS_VRAIES() })
		expect(dossier.monde.personnages.map((p) => p.id).filter((id) => [AUBRY, HAREK, CORVIN].includes(id))).toEqual([
			CORVIN,
			HAREK,
			AUBRY,
		])
		const base = ouverture(dossier)
		const depart: EtatSession = {
			...base,
			monde: { ...base.monde, pnj: { [AUBRY]: { a_dit: [] }, [HAREK]: { a_dit: [] }, [CORVIN]: { a_dit: [] } } },
		}

		const pas1 = tickHorloge(dossier, depart)
		expect(lignesDuTick(pas1).map((ligne) => ligne.texte)).toEqual([
			`etape_plan : ${CORVIN} 2`,
			`etape_plan : ${HAREK} 2`,
			`etape_plan : ${AUBRY} 2`,
		])
		// UN CRAN : les deux étapes suivantes étaient vraies aussi, et aucun n'a sauté.
		for (const id of [CORVIN, HAREK, AUBRY]) {
			expect(pas1.monde.pnj[id]?.etape_plan).toEqual({ rang: 1, depuis: depart.horloge.tour })
		}

		const pas2 = tickHorloge(dossier, pas1)
		expect(
			lignesDuTick(pas2)
				.slice(3)
				.map((ligne) => ligne.texte),
		).toEqual([`etape_plan : ${CORVIN} 2 → 3`, `etape_plan : ${HAREK} 2 → 3`, `etape_plan : ${AUBRY} 2 → 3`])
		for (const id of [CORVIN, HAREK, AUBRY]) {
			expect(pas2.monde.pnj[id]?.etape_plan).toEqual({ rang: 2, depuis: depart.horloge.tour })
		}

		// Le plan est épuisé : plus rien, même référence.
		expect(tickHorloge(dossier, pas2)).toBe(pas2)
	})

	it('les faits que chaque personnage consulte sont ceux de la session COURANTE du tick, avancements precedents compris', () => {
		const dossier = avecPlans({ [CORVIN]: TROIS_VRAIES(), [HAREK]: TROIS_VRAIES() })
		const depart = ouverture(dossier)
		const espion = jest.spyOn(evaluateModule, 'etapeDeclenchee')

		try {
			tickHorloge(dossier, depart)

			expect(espion).toHaveBeenCalledTimes(2)
			// Le premier appel voit les faits d'ENTRÉE ; le second, ceux que le premier
			// avancement a écrits. Un tick qui figerait `session.monde` au départ rendrait
			// `undefined` au second appel.
			expect(espion.mock.calls[0][0].pnj[CORVIN]).toBeUndefined()
			expect(espion.mock.calls[1][0].pnj[CORVIN]?.etape_plan).toEqual({ rang: 1, depuis: depart.horloge.tour })
			// Chaque appel reçoit l'ÉTAPE VISÉE (index 1), jamais l'étape courante ni le plan.
			expect(espion.mock.calls[0][1]).toBe(dossier.monde.personnages.find((p) => p.id === CORVIN)?.plan_actions[1])
			expect(espion.mock.calls[1][1]).toBe(dossier.monde.personnages.find((p) => p.id === HAREK)?.plan_actions[1])
		} finally {
			espion.mockRestore()
		}
	})

	it('une condition inconnue leve (KR-238), aucun catch — et la session d entree n est pas touchee', () => {
		const inconnu = { op: 'xor' } as unknown as ExprNode
		const dossier = avecPlans({ [CORVIN]: TROIS_VRAIES(), [HAREK]: [etape(0), etape(1, inconnu)] })
		const depart = ouverture(dossier)

		expect(() => tickHorloge(dossier, depart)).toThrow()
		// Le tick est pur : la levée n'a rien écrit, même pour le personnage SAIN qui
		// précède le fautif dans le document.
		expect(depart.monde.pnj).toEqual({})
		// DISCRIMINANT : sans la condition fautive, le même appel avance.
		const sain = avecPlans({ [CORVIN]: TROIS_VRAIES() })
		const departSain = ouverture(sain)
		expect(tickHorloge(sain, departSain)).not.toBe(departSain)
	})
})

describe('tickHorloge, les trois ecrivains de EtatPnj — a_dit, confiance, etape_plan — survivent dans les deux ordres', () => {
	const INDICE = 'indice.sceau-brise-a-nouveau'
	const APPORT = {
		recit: 'Il repose son marteau : « Oui, j’en ai entendu parler. »',
		personnageId: HAREK,
		indicesReveles: [INDICE],
		deltaConfiance: 0,
	} as const

	/** Les portes du savoir de Harek OUVERTES sur une session RÉELLEMENT JOUÉE (précédent `recit.test.ts`). */
	function portesOuvertes(session: EtatSession): EtatSession {
		return {
			...session,
			monde: {
				...session.monde,
				objets_possedes: ['objet.amulette-scellee'],
				indices_connus: ['indice.pas-dans-la-cendre'],
			},
		}
	}

	/** Harek passe à l'étape 2 quand le marché des cendres a été visité — pas avant. */
	const dossier = (): Dossier => avecPlans({ [HAREK]: [etape(0), etape(1, MARCHE_VISITE)] })

	it('le tick PUIS crediterConfiance PUIS consignerReponseActeur : rien n ecrase etape_plan', () => {
		const d = dossier()
		const s1 = jouer(d, ouverture(d), ['ALLER lieu.marche-des-cendres'])
		expect(s1.monde.pnj[HAREK]).toEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 1 } })

		const s2 = jouer(d, s1, ['ALLER lieu.foyer-du-guet'])
		const s3 = crediterConfiance(s2, HAREK, 1)
		expect(s3.monde.pnj[HAREK]).toEqual({ a_dit: [], confiance: 1, etape_plan: { rang: 1, depuis: 1 } })

		const s4 = portesOuvertes(jouer(d, s3, [`PARLER ${HAREK}`]))
		const s5 = consignerReponseActeur(s4, s4.horloge.tour, d, APPORT)

		// `depuis` SURVIT aux deux autres écrivains, et reste le pas de l'AVANCEMENT (1), pas
		// celui de la dernière écriture de l'entrée (3) — c'est ce qui sépare `depuis` d'un
		// « dernier pas où l'entrée a bougé ».
		expect(s5.horloge.tour).toBe(3)
		expect(s5.monde.pnj[HAREK]).toEqual({ a_dit: [INDICE], confiance: 1, etape_plan: { rang: 1, depuis: 1 } })
	})

	it('consignerReponseActeur PUIS crediterConfiance PUIS le tick : rien n ecrase a_dit ni confiance', () => {
		const d = dossier()
		const s1 = portesOuvertes(jouer(d, ouverture(d), [`PARLER ${HAREK}`]))
		// Le tick n'a rien écrit : le marché n'est pas visité.
		expect(s1.monde.pnj).toEqual({})

		const s2 = consignerReponseActeur(s1, s1.horloge.tour, d, APPORT)
		expect(s2.monde.pnj[HAREK]).toEqual({ a_dit: [INDICE] })

		const s3 = crediterConfiance(s2, HAREK, 1)
		const s4 = jouer(d, s3, ['ALLER lieu.marche-des-cendres'])

		expect(s4.monde.pnj[HAREK]).toEqual({ a_dit: [INDICE], confiance: 1, etape_plan: { rang: 1, depuis: 2 } })
		// Et c'est le MÊME état final que dans l'autre ordre — c'est ce que « les deux
		// ordres » veut dire.
		expect(lignesDuTick(s4).map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 2`])
	})
})

describe('tickHorloge, la ligne du tick n est JAMAIS porteuse', () => {
	/** Un pas AGIR dont le tick écrit : la ligne du tick suit les deux lignes de la commande. */
	function pasQuiTick(): { readonly dossier: Dossier; readonly session: EtatSession } {
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, FOYER_VISITE)] })
		return { dossier, session: jouer(dossier, ouverture(dossier), ['AGIR']) }
	}

	it('ni origine, ni deltas, ni recit, ni jet, ni interlocuteur : trois cles, et trois seulement', () => {
		const { session } = pasQuiTick()
		const lignes = lignesDuTick(session)

		expect(lignes).toHaveLength(1)
		expect(Object.keys(lignes[0]).sort()).toEqual(['role', 'texte', 'tour'])
		expect(lignes[0]).toEqual({ tour: 1, role: 'moteur', texte: `etape_plan : ${HAREK} 2` })
		// Elle SUIT les deux lignes de la commande, au MÊME tour : le tick n'ajoute pas de pas.
		expect(session.journal.map((ligne) => ligne.tour)).toEqual([1, 1, 1])
		expect(session.journal[2]).toBe(lignes[0])
		expect(session.horloge.tour).toBe(1)
		// ET L'INVARIANT D'`origine` TIENT : `origine` n'est que sur l'entrée de la commande.
		expect(session.journal.filter((ligne) => ligne.origine !== undefined)).toHaveLength(1)
	})

	it('consignerJet et consignerNarration ne la ramassent pas : elles ne visent que l entree a origine du pas', () => {
		const { session } = pasQuiTick()
		const tick = lignesDuTick(session)[0]

		const avecJet = consignerJet(session, 1, { carac: 'AG', tc: 'TC2' })
		const avecRecit = consignerNarration(session, 1, { recit: 'Vous regardez autour de vous.', faits_etablis: [] })

		for (const apres of [avecJet, avecRecit]) {
			// La ligne du tick est RENDUE telle quelle — même référence, aucune clé de plus…
			expect(apres.journal[2]).toBe(tick)
			// …et l'écriture a bien eu lieu SUR L'AUTRE : sans cette moitié, ce test serait
			// vert sur un écrivain qui ne ferait plus rien.
			expect(apres.journal[1].origine).toBe('agir')
		}
		expect(avecJet.journal[1].jet).toEqual({ carac: 'AG', tc: 'TC2' })
		expect(avecRecit.journal[1].recit).toBe('Vous regardez autour de vous.')
		for (const entree of [avecJet.journal[2], avecRecit.journal[2]]) {
			expect('jet' in entree).toBe(false)
			expect('recit' in entree).toBe(false)
		}
	})
})

describe('tickHorloge, le perimetre : seuls monde.pnj[*].etape_plan et le journal different', () => {
	/** Retire ce que le tick a écrit : les `etape_plan`, les entrées nées d'un tick, les lignes ajoutées. */
	function sansLeTick(apres: EtatSession, avant: EtatSession): EtatSession {
		const pnj: Record<string, EtatPnj> = {}
		for (const [id, etat] of Object.entries(apres.monde.pnj)) {
			// UNE COPIE MUTABLE de l'entrée, d'où la SEULE clé du tick est retirée : tout autre
			// champ — présent ou futur — reste, et c'est ce qui rend le garde-fou discriminant.
			const reste: { -readonly [K in keyof EtatPnj]: EtatPnj[K] } = { ...etat }
			delete reste.etape_plan
			const neePendantLeTick =
				!Object.prototype.hasOwnProperty.call(avant.monde.pnj, id) &&
				Object.keys(reste).length === 1 &&
				reste.a_dit.length === 0
			if (!neePendantLeTick) pnj[id] = reste
		}
		return { ...apres, monde: { ...apres.monde, pnj }, journal: apres.journal.slice(0, avant.journal.length) }
	}

	it('pour chacun des trois verbes, retire le tick, la session est strictement celle d avant', () => {
		const dossier = avecPlans({ [HAREK]: TROIS_VRAIES(), [AUBRY]: [etape(0), etape(1, FOYER_VISITE)] })
		const depart = ouverture(dossier)
		const saisies: Record<CommandeId, string> = {
			aller: 'ALLER lieu.marche-des-cendres',
			agir: 'AGIR',
			parler: `PARLER ${HAREK}`,
		}
		expect(Object.keys(saisies).sort()).toEqual(Object.keys(COMMANDES).sort())

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			// LE TÉMOIN : la même commande, sur le dossier SANS tick — et jalons identiques,
			// la charpente étant la même.
			const sans = sessionDe(executer(REFERENCE, depart, saisies[id]))
			const avec = sessionDe(executer(dossier, depart, saisies[id]))

			// Le tick a bien écrit (discriminant) : deux personnages, deux lignes…
			expect(`${id} → ${lignesDuTick(avec).length}`).toBe(`${id} → 2`)
			expect(avec.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
			expect(avec.monde.pnj[AUBRY]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
			// … et RIEN d'autre n'a bougé, clé par clé, `undefined` explicites compris.
			expect(sansLeTick(avec, sans)).toStrictEqual(sans)
			// La couture est EXACTEMENT « le tick de la session d'après jalons ».
			expect(avec).toStrictEqual(tickHorloge(dossier, sans))
		}
	})

	it('retirer le tick ne suffit pas a rendre la session si UN champ de plus avait ete touche — le garde-fou discrimine', () => {
		// MUTANT NOMMÉ : un tick qui écrirait aussi `horloge.tour` (« un pas de plus »).
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, FOYER_VISITE)] })
		const depart = ouverture(dossier)
		const sans = sessionDe(executer(REFERENCE, depart, 'AGIR'))
		const fautive: EtatSession = { ...tickHorloge(dossier, sans), horloge: { tour: sans.horloge.tour + 1 } }

		expect(sansLeTick(fautive, sans)).not.toStrictEqual(sans)
	})
})

describe('tickHorloge, R4 toujours et R3 hors de portee sont octet-identiques avec et sans tick (KR-295, R-7)', () => {
	it('R3, le narrateur : un avancement HORS DE PORTEE du heros se raconte comme un pas dont le tick n ecrit rien', () => {
		// DEPUIS L'IT2, un personnage PERCEPTIBLE (présent au lieu courant) ET avancé à ce pas entre
		// dans R3 par le bloc `PENDANT CE TEMPS` : c'est le contrat de l'assembleur
		// (`copilote/contexte/horloge.ts`, n° 14 it2), asserté dans `copilote/contexte.test.ts`, et
		// il n'est PAS asserté ici. Ce test tient la FRONTIÈRE de ce contrat, valable avant comme
		// après lui : Corvin avance (le tick écrit) mais se tient au marché des cendres, le héros
		// reste au foyer du guet — hors de portée, donc le contexte ne bouge pas d'un octet.
		const dossier = avecPlans({ [CORVIN]: [etape(0), etape(1, FOYER_VISITE)] })
		const depart = ouverture(dossier)
		const avec = sessionDe(executer(dossier, depart, 'AGIR'))
		const sans = sessionDe(executer(REFERENCE, depart, 'AGIR'))
		expect(avec.monde.pnj[CORVIN]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
		expect(sans.monde.pnj).toEqual({})
		// DISCRIMINANT DE LA FRONTIÈRE : Corvin n'est pas au lieu courant — Harek, lui, y est.
		expect(personnagesPresents(dossier, avec)).not.toContain(CORVIN)
		expect(personnagesPresents(dossier, avec)).toContain(HAREK)

		const cible = (session: EtatSession) => ({
			role: 'narrateur' as const,
			saisie: 'je regarde autour de moi',
			session,
		})
		const contexteAvec = assemblerNarrateur(dossier, cible(avec))
		const contexteSans = assemblerNarrateur(dossier, cible(sans))

		expect(contexteAvec.ok).toBe(true)
		if (!contexteAvec.ok || !contexteSans.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexteAvec.texte).toBe(contexteSans.texte)
		expect(contexteAvec.ancres).toEqual(contexteSans.ancres)
		// Le contexte est NON VIDE (discriminant) et ne dit rien du plan : ni la clé, ni
		// l'identifiant du personnage, ni son rang.
		expect(contexteAvec.texte).toContain('CE PAS')
		expect(contexteAvec.texte).not.toContain('etape_plan')
		expect(contexteAvec.texte).not.toContain(CORVIN)
		expect(contexteAvec.texte).not.toContain("Intention de l'étape")

		// MUTANT NOMMÉ (REJETÉ R-3) : poser une `origine` sur la ligne du tick. Le
		// narrateur la lirait comme un SECOND geste du pas, et le contexte changerait.
		const avecOrigine: EtatSession = {
			...avec,
			journal: avec.journal.map((ligne) =>
				ligne.texte.startsWith('etape_plan : ') ? { ...ligne, origine: 'agir' as const } : ligne,
			),
		}
		const contexteOrigine = assemblerNarrateur(dossier, cible(avecOrigine))
		if (!contexteOrigine.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexteOrigine.texte).not.toBe(contexteSans.texte)
	})

	it('R3 : une ligne etape_bloquee ne change pas le contexte — sans origine, jamais un geste du pas, jamais citee (n 14 it3)', () => {
		// Corvin est bloqué au pas 1 (`duree: 1`, origine 0) mais se tient au marché : hors de portée du
		// héros, donc rien n'entre dans `PENDANT CE TEMPS` quand L2 y injectera `si_bloque` — et la LIGNE
		// du tick, elle, n'est jamais lue par le narrateur, quelle que soit la présence.
		const dossier = avecPlans({ [CORVIN]: [etape(0, undefined, { duree: 1 }), etape(1, JAMAIS)] })
		const depart = ouverture(dossier)
		const avec = sessionDe(executer(dossier, depart, 'AGIR'))
		const sans = sessionDe(executer(REFERENCE, depart, 'AGIR'))
		expect(lignesDeBlocage(avec).map((ligne) => ligne.texte)).toEqual([`etape_bloquee : ${CORVIN} 1`])
		expect(lignesDeBlocage(sans)).toEqual([])
		// DISCRIMINANT DE LA FRONTIÈRE : Corvin n'est pas au lieu courant — Harek, lui, y est.
		expect(personnagesPresents(dossier, avec)).not.toContain(CORVIN)

		const cible = (session: EtatSession) => ({
			role: 'narrateur' as const,
			saisie: 'je regarde autour de moi',
			session,
		})
		const contexteAvec = assemblerNarrateur(dossier, cible(avec))
		const contexteSans = assemblerNarrateur(dossier, cible(sans))
		if (!contexteAvec.ok || !contexteSans.ok) throw new Error('le contexte nominal ne doit pas etre refuse')

		expect(contexteAvec.texte).toBe(contexteSans.texte)
		expect(contexteAvec.ancres).toEqual(contexteSans.ancres)
		expect(contexteAvec.texte).not.toContain('etape_bloquee')
		expect(contexteAvec.texte).not.toContain(CORVIN)

		// MUTANT NOMMÉ : poser une `origine` sur la ligne de blocage. Le narrateur la lirait comme un
		// SECOND geste du pas, et le contexte changerait.
		const avecOrigine: EtatSession = {
			...avec,
			journal: avec.journal.map((ligne) =>
				ligne.texte.startsWith('etape_bloquee : ') ? { ...ligne, origine: 'agir' as const } : ligne,
			),
		}
		const contexteOrigine = assemblerNarrateur(dossier, cible(avecOrigine))
		if (!contexteOrigine.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexteOrigine.texte).not.toBe(contexteSans.texte)
	})

	it('R4, l acteur : le contexte de Harek ne dit rien de SA propre etape, quand le tick vient de l ecrire', () => {
		const dossier = avecPlans({ [HAREK]: [etape(0), etape(1, FOYER_VISITE)] })
		const depart = ouverture(dossier)
		const avec = sessionDe(executer(dossier, depart, `PARLER ${HAREK}`))
		const sans = sessionDe(executer(REFERENCE, depart, `PARLER ${HAREK}`))
		expect(avec.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })

		const contexteAvec = assemblerActeur(dossier, avec, HAREK, 'bonjour')
		const contexteSans = assemblerActeur(dossier, sans, HAREK, 'bonjour')

		expect(contexteAvec.ok).toBe(true)
		if (!contexteAvec.ok || !contexteSans.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexteAvec.texte).toBe(contexteSans.texte)
		expect(contexteAvec.texte).toContain('TOI')
		expect(contexteAvec.texte).not.toContain('etape_plan')
		// Ni l'intention de l'étape visée : `action` n'est pas injectée en it1 (R-4, R-7).
		expect(contexteAvec.texte).not.toContain("Intention de l'étape")
	})
})

describe('horloge.ts, les proprietes qui se lisent dans la SOURCE', () => {
	const source = (nom: string): string => fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8').replace(/\r\n/g, '\n')
	const sansCommentaires = (texte: string): string => texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
	const enPositionDeCode = (texte: string): string =>
		sansCommentaires(texte)
			.replace(/'[^'\n]*'/g, "''")
			.replace(/"[^"\n]*"/g, '""')
			.replace(/`[^`]*`/gs, '``')
	const code = enPositionDeCode(source('horloge.ts'))

	it('il ne lit que plan_actions[], etapeDeclenchee et etapeBloqueeAuPas : ni condition, ni duree, ni depuis, ni si_bloque, ni action, ni etape, ni op', () => {
		// KR-246, N° 14 it3 : `duree` et `depuis` ont UN site de décision, `blocage.ts`
		// (`blocage.test.ts` en balaie la portée mesurée). Le tick l'APPELLE, il ne lit ni l'un ni l'autre.
		const lectures: ReadonlyArray<readonly [string, RegExp]> = [
			['.declencheur_expr (R-5, garde de evaluate.test.ts)', /\.declencheur_expr\b/],
			['.duree (R-1, KR-246 : un seul site de decision, blocage.ts)', /\.duree\b/],
			['.si_bloque', /\.si_bloque\b/],
			['.action (R-4)', /\.action\b/],
			['.etape (KR-198)', /\.etape\b/],
			['.op (expr.test.ts, lecteurs d arbre)', /\.op\b/],
			['.depuis (§ J2 règle 8 : écrit, jamais lu)', /\.depuis\b/],
		]
		for (const [nom, motif] of lectures) {
			expect(`${nom} → ${motif.test(code)}`).toBe(`${nom} → false`)
		}
		// Discriminant du balayage : il lit du CODE — `plan_actions` et les deux appels y sont bien.
		expect(code).toMatch(/\.plan_actions\?\.\[/)
		expect(code).toMatch(/\betapeDeclenchee\(/)
		expect(code).toMatch(/\betapeBloqueeAuPas\(/)
		// Et le motif attrape RÉELLEMENT une lecture de ces deux champs, y compris chaînée : sans cela,
		// les deux lignes `.duree` et `.depuis` ci-dessus seraient vertes sur un motif qui ne matche rien.
		expect(/\.duree\b/.test(enPositionDeCode('const d = courante?.duree'))).toBe(true)
		expect(/\.depuis\b/.test(enPositionDeCode('const d = existant?.etape_plan?.depuis'))).toBe(true)
	})

	it('depuis est ECRIT en UN seul site, avec rang, a horloge.tour — et jamais lu (§ J2 regle 8, KR-298)', () => {
		// UN SEUL site où le mot paraît en position de code : la clé de l'objet écrit. Une
		// lecture — `ancienne.depuis`, `const { depuis } = …`, `existant?.etape_plan?.depuis` —
		// ferait deux sites, et rétablirait la minuterie que J2 abolit.
		expect(code.match(/\bdepuis\b/g) ?? []).toHaveLength(1)
		// Et ce site est EXACTEMENT « le pas courant » : ni `+ 1` (J1), ni `rang`, ni un littéral.
		expect(code).toMatch(/\betape_plan:\s*\{\s*rang,\s*depuis:\s*session\.horloge\.tour\s*\}/)
	})

	it('il n ecrit ni origine, ni deltas, ni recit, ni jet, ni interlocuteur, et ne recopie aucune prose', () => {
		// Les clés sont cherchées en TEXTE BRUT hors commentaires — chaînes comprises : une
		// clé posée sur la ligne passerait par un littéral d'objet, jamais par une chaîne.
		const brut = sansCommentaires(source('horloge.ts'))
		for (const cle of ['origine', 'deltas', 'recit', 'jet', 'interlocuteur']) {
			expect(`${cle} → ${new RegExp(`\\b${cle}\\b`).test(brut)}`).toBe(`${cle} → false`)
		}
	})

	it('aucun catch, aucun cache, aucun alea ni horodatage : pur, total, et il LEVE si la condition est inconnue', () => {
		for (const interdit of ['catch', 'try {', 'new Map', 'new WeakMap', 'cache', 'memo', 'Math.random', 'Date']) {
			expect(`${interdit} → ${code.toLowerCase().includes(interdit.toLowerCase())}`).toBe(`${interdit} → false`)
		}
	})

	it('ses imports : session.ts en TYPE seul, ni commandes.ts ni expr.ts, et commandes.ts l appelle', () => {
		const imports = [...source('horloge.ts').matchAll(/^import\s+(type\s+)?[^;\n]*?from\s+'([^']+)'/gm)].map((m) => ({
			type: m[1] !== undefined,
			de: m[2],
		}))

		expect(imports.map((i) => i.de).sort()).toEqual([
			'./blocage',
			'./evaluate',
			'./faits',
			'./identifiers',
			'./session',
			'./types',
		])
		// `session.ts` en TYPE SEUL : `commandes.ts` appelle ce module, et `session.ts`
		// type-importe `commandes.ts` — une arête de VALEUR nouerait un cycle.
		expect(imports.find((i) => i.de === './session')?.type).toBe(true)
		expect(imports.find((i) => i.de === './faits')?.type).toBe(true)
		expect(imports.find((i) => i.de === './types')?.type).toBe(true)
		// Les arêtes de valeur sont les trois feuilles : le prédicat de blocage (it3), le sélecteur de
		// condition et l'appartenance propre.
		expect(
			imports
				.filter((i) => !i.type)
				.map((i) => i.de)
				.sort(),
		).toEqual(['./blocage', './evaluate', './identifiers'])
		// L'arête inverse existe bien (discriminant) : c'est `commandes.ts` qui l'appelle.
		expect(source('commandes.ts')).toMatch(/import\s*\{\s*tickHorloge\s*\}\s*from\s*'\.\/horloge'/)
		expect(enPositionDeCode(source('commandes.ts'))).toMatch(
			/tickHorloge\(dossier, avecJalonsResolus\(dossier, resultat\.session\)\)/,
		)
	})
})
