import fs from 'node:fs'
import path from 'node:path'
import type { HeroState } from '../../player/types'
import { CHALLENGE_TIERS } from '../challenge'
import { CHARACTERISTICS } from '../characteristics'
import { POSTURES } from '../combat'
import type { LectureSession as LectureDuBaril } from '../index'
import { SESSION_SATUREE } from './__fixtures__/session-saturee'
import { COMMANDES, analyserSaisie, executerCommande } from './commandes'
import { DELTAS } from './deltas'
import { deepFreeze } from './freeze'
import { apresInterpretation } from './interprete'
import { CADENCE, borneDeFenetre } from './memoire'
import { consignerNarration } from './recit'
import { validerSession, type LectureSession } from './reprise'
import {
	consignerJet,
	crediterConfiance,
	crediterXp,
	fixerHeros,
	ouvrirSession,
	resoudreRencontre,
	type EtatSession,
} from './session'
import { fuirRencontre, jouerPosture } from './sessionCombat'
import type { Dossier } from './types'

/**
 * `validerSession` — LA FRONTIÈRE DE CONFIANCE DE LA REPRISE (n° 15 `moteur-fins`, it2,
 * lot `contrat`, KR-116).
 *
 * QUATRE VERDICTS, UN TEST CHACUN (KR-199) : un test unique à quatre branches rate le cas
 * limite qu'aucune branche ne nomme. Chacun se prouve PAR OPPOSITION, dans le même test
 * (KR-197/202/244) — un validateur qui rendrait toujours `illisible` passerait n'importe
 * quel test d'un seul cas.
 *
 * LA FORME SE PROUVE PAR BALAYAGE D'UNE FIXTURE SATURÉE, jamais par une liste de champs
 * recopiée à la main : `SESSION_SATUREE` porte une valeur sous CHAQUE chemin de feuille de
 * la session (c'est la fixture que `sessionCouverture.test.ts` garde exhaustive), donc
 * balayer ses membres balaie le type. Chaque balayage nomme les chemins qui le mettent en
 * défaut — jamais un compte —, et chacun assert sa NON-VACUITÉ : un balayage qui ne
 * visite rien est vert sur n'importe quel validateur (BUG-084).
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

/** Le dossier de référence, LU DU DISQUE à chaque appel (KR-156), sous l'identité et l'estampille voulues. */
function dossierDe(id: string, estampille: string): Dossier {
	const dossier = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
	return { ...dossier, id, updatedAt: estampille }
}

/** Le dossier que `SESSION_SATUREE` prétend avoir ouvert : mêmes `id` et estampille. */
const dossierDeLaSaturee = (): Dossier => dossierDe(SESSION_SATUREE.dossier_id, SESSION_SATUREE.dossier_maj)

/** Un clone JSON profond de la fixture — jamais la fixture elle-même, que les balayages ne doivent pas muter. */
const cloneDeLaSaturee = (): Record<string, unknown> => JSON.parse(JSON.stringify(SESSION_SATUREE))

/** La session d'OUVERTURE du dossier de référence : exactement les clés RACINES REQUISES, aucune optionnelle. */
function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

// ── un chemin est une LISTE de segments, jamais une chaîne ───────────────────
// (un identifiant de personnage CONTIENT un point : `pnj.aldur-le-sage` — un découpage sur
// le point se tromperait de segment, précédent de `sessionCouverture.test.ts`.)

type Segment = string | number

/** Le chemin de CHAQUE membre — conteneurs, feuilles et éléments de tableau compris. */
function sentiersDesMembres(valeur: unknown, prefixe: readonly Segment[] = []): Segment[][] {
	if (Array.isArray(valeur)) {
		return valeur.flatMap((element, index) => [
			[...prefixe, index],
			...sentiersDesMembres(element, [...prefixe, index]),
		])
	}
	if (typeof valeur === 'object' && valeur !== null) {
		return Object.entries(valeur).flatMap(([cle, enfant]) => [
			[...prefixe, cle],
			...sentiersDesMembres(enfant, [...prefixe, cle]),
		])
	}
	return []
}

function lireA(courant: unknown, sentier: readonly Segment[]): unknown {
	return sentier.reduce<unknown>((valeur, segment) => (valeur as Record<Segment, unknown>)[segment], courant)
}

/** Une copie où le membre `sentier` vaut `remplacement` — immuable, la racine n'est jamais mutée. */
function remplacerA(courant: unknown, sentier: readonly Segment[], remplacement: unknown): unknown {
	if (sentier.length === 0) return remplacement
	const [tete, ...reste] = sentier
	if (Array.isArray(courant)) {
		return courant.map((element, index) => (index === tete ? remplacerA(element, reste, remplacement) : element))
	}
	const objet = courant as Record<string, unknown>
	return { ...objet, [tete]: remplacerA(objet[tete], reste, remplacement) }
}

/** Une copie où la CLÉ D'OBJET désignée par `sentier` est retirée (jamais un indice de tableau). */
function retirerA(courant: unknown, sentier: readonly Segment[]): unknown {
	const [tete, ...reste] = sentier
	if (reste.length > 0) return remplacerA(courant, [tete], retirerA((courant as Record<string, unknown>)[tete], reste))
	return Object.fromEntries(Object.entries(courant as Record<string, unknown>).filter(([cle]) => cle !== tete))
}

/**
 * Le chemin NORMALISÉ — indices de tableau effacés (`[]`), clés de `Record` libres
 * collapsées (`<id>`) —, dans la convention de `sessionCouverture.test.ts`. Fait sur la
 * LISTE de segments, jamais sur une chaîne.
 */
function normaliser(sentier: readonly Segment[]): string {
	return sentier.reduce<string>((chemin, segment) => {
		if (typeof segment === 'number') return `${chemin}[]`
		const cle = chemin === 'monde.pnj' || chemin === 'heros.caracs' ? '<id>' : segment
		return chemin === '' ? cle : `${chemin}.${cle}`
	}, '')
}

const nomme = (sentier: readonly Segment[]): string => sentier.join(' > ')

function statut(brut: unknown, dossier: Dossier): LectureSession['statut'] {
	return validerSession(brut, dossier).statut
}

// ═══════════════════════════════════════════════════════════════════════════
// LES QUATRE VERDICTS
// ═══════════════════════════════════════════════════════════════════════════

describe('validerSession, les quatre verdicts, un test chacun (KR-199)', () => {
	it('absente - null et undefined rendent absente ; toute autre valeur rangee ne l est jamais', () => {
		const dossier = dossierDeLaSaturee()

		expect(validerSession(null, dossier)).toEqual({ statut: 'absente' })
		expect(validerSession(undefined, dossier)).toEqual({ statut: 'absente' })

		// DISCRIMINANT : `absente` n'est PAS « falsy ». Un `0`, un `''` ou un `false` sont des
		// valeurs RANGÉES qui ne sont pas des sessions — le stockage n'est pas vide, il est
		// abîmé, et le dire « absent » lui ferait écraser le contenu sans que rien ne le dise.
		const rangeesNonSessions: unknown[] = [0, '', false, 42, 'une session', [], {}, [SESSION_SATUREE]]
		const verdicts = rangeesNonSessions.map((valeur) => statut(valeur, dossier))
		expect(verdicts).toEqual(rangeesNonSessions.map(() => 'illisible'))
	})

	it('reprenable - rend la session TELLE QUELLE (toBe), jamais une copie, et sans la muter', () => {
		const dossier = dossierDeLaSaturee()
		// GELÉE EN PROFONDEUR : un validateur qui écrirait dans `brut` (ré-estampiller « pour
		// réparer », normaliser, trier) lèverait ici — l'écriture sur un objet gelé est une
		// erreur en mode strict.
		const brut = deepFreeze(cloneDeLaSaturee())

		const lecture = validerSession(brut, dossier)

		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut !== 'reprenable') return
		// IDENTITÉ, pas égalité : un validateur qui reconstruirait la session perdrait toute
		// clé optionnelle qu'on lui oublie (KR-251) — `toEqual` le laisserait passer.
		expect(lecture.session).toBe(brut)
		expect(lecture).toEqual({ statut: 'reprenable', session: brut })
	})

	it('perimee - dossier_maj different rend perimee ; la MEME session a la meme estampille est reprenable', () => {
		const brut = cloneDeLaSaturee()
		const meme = dossierDeLaSaturee()
		const edite = dossierDe(SESSION_SATUREE.dossier_id, '2026-10-01T00:00:00.000Z')

		// L'OPPOSITION, dans le même test : la session est identique, seule l'estampille du dossier change.
		expect(statut(brut, meme)).toBe('reprenable')
		expect(validerSession(brut, edite)).toEqual({ statut: 'perimee' })
		// `perimee` ne porte AUCUNE session : l'appelant n'a rien qu'il puisse jouer ou « réparer ».
		expect(Object.keys(validerSession(brut, edite))).toEqual(['statut'])
	})

	it('illisible - une cle racine REQUISE manquante rend illisible ; une cle racine OPTIONNELLE manquante reste lisible', () => {
		const dossier = dossierDeLaSaturee()
		const minimale = ouverture(dossierDe('dossier-reference', '2026-08-08T09:00:00.000Z'))
		const racines = Object.keys(SESSION_SATUREE)
		// DÉRIVÉ, jamais recopié : la session d'ouverture porte exactement les clés requises,
		// la saturée toutes ; la différence est l'ensemble des optionnelles à vie (KR-251).
		const requises = Object.keys(minimale)
		const optionnelles = racines.filter((cle) => !requises.includes(cle))

		// NON-VACUITÉ : huit requises, trois optionnelles — onze racines (`sessionCouverture`).
		expect(requises).toHaveLength(8)
		expect([...optionnelles].sort()).toEqual(['attente', 'combat', 'heros'])
		expect(racines).toHaveLength(11)

		const manquanteMaisLisible = requises.filter(
			(cle) => statut(retirerA(cloneDeLaSaturee(), [cle]), dossier) !== 'illisible',
		)
		const absenteMaisIllisible = optionnelles.filter(
			(cle) => statut(retirerA(cloneDeLaSaturee(), [cle]), dossier) !== 'reprenable',
		)
		expect(manquanteMaisLisible).toEqual([])
		expect(absenteMaisIllisible).toEqual([])
		// Et la session d'OUVERTURE, qui n'a AUCUNE des trois optionnelles, est lisible telle quelle.
		expect(statut(JSON.parse(JSON.stringify(minimale)), dossierDe(minimale.dossier_id, minimale.dossier_maj))).toBe(
			'reprenable',
		)
	})

	it('illisible - memoire corrompue rend illisible, et ses formes LEGALES restent lisibles', () => {
		const dossier = dossierDeLaSaturee()
		const avec = (memoire: unknown): unknown => ({ ...cloneDeLaSaturee(), memoire })

		// LA FORME, jusqu'aux primitives (NIA) : chaque ligne est une corruption que le
		// stockage peut produire, et chacune ferait bâtir au tour suivant un contexte de
		// modèle sur une donnée qui n'est pas ce qu'elle prétend.
		const corrompues: ReadonlyArray<readonly [string, unknown]> = [
			['objet vide : faits_etablis manque', {}],
			['faits_etablis est une chaine', { faits_etablis: 'un fait' }],
			['faits_etablis est un objet', { faits_etablis: {} }],
			['fait : la phrase est un nombre', { faits_etablis: [{ fait: 3, sur: [] }] }],
			['fait : sur manque', { faits_etablis: [{ fait: 'x' }] }],
			['fait : sur est une chaine', { faits_etablis: [{ fait: 'x', sur: 'lieu.a' }] }],
			['fait : une ancre est un nombre', { faits_etablis: [{ fait: 'x', sur: [7] }] }],
			['resume : jusqu_au_pas manque', { faits_etablis: [], resume: { texte: 'x' } }],
			['resume : texte est un nombre', { faits_etablis: [], resume: { texte: 1, jusqu_au_pas: 3 } }],
			['resume : jusqu_au_pas est une chaine', { faits_etablis: [], resume: { texte: 'x', jusqu_au_pas: '3' } }],
			['resume : null (jamais | null)', { faits_etablis: [], resume: null }],
			['memoire est une liste', []],
			['memoire est une chaine', 'rien retenu'],
			['memoire est un nombre', 0],
		]
		const lues = corrompues.filter(([, memoire]) => statut(avec(memoire), dossier) !== 'illisible').map(([nom]) => nom)
		expect(lues).toEqual([])

		// L'OPPOSITION, dans le même test : `null` (rien retenu, KR-249), des faits seuls, une
		// mémoire complète, des ancres vides — toutes LISIBLES. Sans cette moitié, la liste
		// ci-dessus serait vraie d'un validateur qui refuserait toute mémoire.
		expect(statut(avec(null), dossier)).toBe('reprenable')
		expect(statut(avec({ faits_etablis: [{ fait: 'x', sur: [] }] }), dossier)).toBe('reprenable')
		expect(statut(avec(SESSION_SATUREE.memoire), dossier)).toBe('reprenable')
		// Et la clé `memoire` ABSENTE ou `undefined` n'est pas `null` : elle est requise.
		expect(statut({ ...cloneDeLaSaturee(), memoire: undefined }, dossier)).toBe('illisible')
	})
})

describe('validerSession, l ordre des verdicts est un contrat', () => {
	it('une session abimee ET perimee est illisible, jamais perimee — l ecran dirait « le dossier a change » d une sauvegarde endommagee', () => {
		const edite = dossierDe(SESSION_SATUREE.dossier_id, '2026-10-01T00:00:00.000Z')
		const abimee = { ...cloneDeLaSaturee(), journal: 'pas un journal' }

		expect(statut(abimee, edite)).toBe('illisible')
		// Les deux défauts séparément, pour que l'ordre soit la SEULE variable : la forme
		// seule est illisible, l'estampille seule est périmée.
		expect(statut(abimee, dossierDeLaSaturee())).toBe('illisible')
		expect(statut(cloneDeLaSaturee(), edite)).toBe('perimee')
	})

	it('un schema autre que 1 est illisible, meme a estampille egale', () => {
		const dossier = dossierDeLaSaturee()
		const avecSchema = (schema: unknown): unknown => ({ ...cloneDeLaSaturee(), schema })

		expect(statut(avecSchema(1), dossier)).toBe('reprenable')
		expect(statut(avecSchema(2), dossier)).toBe('illisible')
		expect(statut(avecSchema('1'), dossier)).toBe('illisible')
		expect(statut(avecSchema(undefined), dossier)).toBe('illisible')
	})

	it('le dossier_id d un AUTRE dossier est illisible, meme a estampille egale, et meme avec une estampille differente', () => {
		const brut = cloneDeLaSaturee()
		const autreDossier = dossierDe('dossier-autre', SESSION_SATUREE.dossier_maj)
		const autreEtEdite = dossierDe('dossier-autre', '2026-10-01T00:00:00.000Z')

		// Ce n'est pas LA MÊME partie qui a vieilli : c'est une clé qui ne contient pas la bonne.
		expect(statut(brut, autreDossier)).toBe('illisible')
		expect(statut(brut, autreEtEdite)).toBe('illisible')
		// L'opposition : le bon dossier, lui, la lit.
		expect(statut(brut, dossierDeLaSaturee())).toBe('reprenable')
	})

	it('une estampille qui n est pas une chaine est un defaut de FORME (illisible), pas une peremption', () => {
		const dossier = dossierDeLaSaturee()

		expect(statut({ ...cloneDeLaSaturee(), dossier_maj: 20260920 }, dossier)).toBe('illisible')
		expect(statut({ ...cloneDeLaSaturee(), dossier_maj: null }, dossier)).toBe('illisible')
		// Une chaîne DIFFÉRENTE, fût-elle vide, est une péremption : la forme est saine.
		expect(statut({ ...cloneDeLaSaturee(), dossier_maj: '' }, dossier)).toBe('perimee')
	})
})

// ═══════════════════════════════════════════════════════════════════════════
// LA FORME, JUSQU'AUX FEUILLES — balayages dérivés de la fixture saturée
// ═══════════════════════════════════════════════════════════════════════════

/**
 * LES MEMBRES OPTIONNELS À VIE (KR-251), par chemin NORMALISÉ — la SEULE liste écrite à la
 * main de ce fichier, et elle est l'énoncé du contrat : tout membre qui n'y est pas est
 * REQUIS, donc son absence rend `illisible`. Un champ ajouté plus tard à la session doit
 * être OPTIONNEL (KR-251) ; il entre donc ici — par un geste délibéré, vu en diff — ou
 * son absence fait rougir le balayage, qui le classe requis.
 */
const OPTIONNELS: readonly string[] = [
	'attente',
	'heros',
	'combat',
	'combat.fuite',
	'horloge.climat_actif',
	'memoire.resume',
	'monde.pnj.<id>',
	'monde.pnj.<id>.confiance',
	'monde.pnj.<id>.etape_plan',
	'monde.pnj.<id>.etape_plan.depuis',
	'journal[].origine',
	'journal[].interlocuteur',
	'journal[].deltas',
	'journal[].recit',
	'journal[].jet',
]

describe('validerSession, la forme jusqu aux feuilles — balayages de la fixture saturee', () => {
	const sentiers = sentiersDesMembres(SESSION_SATUREE)
	const membresObjet = sentiers.filter((sentier) => typeof sentier[sentier.length - 1] === 'string')
	const feuilles = sentiers.filter((sentier) => {
		const valeur = lireA(SESSION_SATUREE, sentier)
		return typeof valeur !== 'object' || valeur === null
	})
	const conteneurs = sentiers.filter((sentier) => !feuilles.includes(sentier))

	it('le balayage visite reellement la session, et la fixture est lisible telle quelle (non-vacuite)', () => {
		// Sans ces planchers, les balayages ci-dessous seraient verts sur une fixture vide
		// (BUG-084). `floor(mesure/5)×5` sur la mesure du jour, jamais un chiffre non mesuré.
		expect(sentiers.length).toBeGreaterThanOrEqual(100)
		expect(feuilles.length).toBeGreaterThanOrEqual(60)
		expect(conteneurs.length).toBeGreaterThanOrEqual(30)
		expect(statut(cloneDeLaSaturee(), dossierDeLaSaturee())).toBe('reprenable')
		// Chaque membre OPTIONNEL déclaré existe dans la fixture : une entrée morte laisserait
		// un champ optionnel sans instance, donc sans preuve.
		const presents = new Set(membresObjet.map(normaliser))
		expect(OPTIONNELS.filter((chemin) => !presents.has(chemin))).toEqual([])
	})

	it('chaque membre D OBJET est REQUIS ou OPTIONNEL, sans troisieme categorie : son retrait rend illisible, ou reste lisible', () => {
		const dossier = dossierDeLaSaturee()

		const malClasses = membresObjet.filter((sentier) => {
			const attendu = OPTIONNELS.includes(normaliser(sentier)) ? 'reprenable' : 'illisible'
			return statut(retirerA(cloneDeLaSaturee(), sentier), dossier) !== attendu
		})

		// L'échec NOMME LES CHAMPS — jamais un compte.
		expect(malClasses.map((sentier) => normaliser(sentier))).toEqual([])
	})

	it('chaque FEUILLE d un autre type est refusee : null, nombre, chaine, booleen, objet ou liste a sa place rend illisible', () => {
		const dossier = dossierDeLaSaturee()
		const genre = (valeur: unknown): string =>
			valeur === null ? 'null' : Array.isArray(valeur) ? 'liste' : typeof valeur
		const AUTRES: readonly unknown[] = [null, 42, '42', true, {}, []]

		const acceptees = feuilles.flatMap((sentier) => {
			const courante = lireA(SESSION_SATUREE, sentier)
			// Les valeurs de ce genre-là sont celles d'une feuille LÉGALE : les refuser serait
			// refuser la session. Elles sont couvertes par la table des unions fermées, plus bas.
			const fausses = AUTRES.filter((fausse) => genre(fausse) !== genre(courante))
			// Un nombre non fini n'est pas du JSON : `NaN` et `Infinity` ne viennent pas du stockage.
			const nonFinies = typeof courante === 'number' ? [Number.NaN, Number.POSITIVE_INFINITY] : []
			return [...fausses, ...nonFinies]
				.filter((fausse) => statut(remplacerA(cloneDeLaSaturee(), sentier, fausse), dossier) !== 'illisible')
				.map((fausse) => `${nomme(sentier)} = ${String(fausse)}`)
		})

		expect(acceptees).toEqual([])
	})

	it('chaque CONTENEUR est refuse sous une autre forme : une chaine, null, une liste a la place d un objet, un objet a la place d une liste', () => {
		const dossier = dossierDeLaSaturee()

		const acceptes = conteneurs.flatMap((sentier) => {
			const courant = lireA(SESSION_SATUREE, sentier)
			// `memoire: null` est LÉGAL (« rien retenu », KR-249) : l'unique exception à `null`.
			const nul = normaliser(sentier) === 'memoire' ? [] : [null]
			const autreForme = Array.isArray(courant) ? {} : []
			return [...nul, 'conteneur', autreForme]
				.filter((faux) => statut(remplacerA(cloneDeLaSaturee(), sentier, faux), dossier) !== 'illisible')
				.map((faux) => `${nomme(sentier)} = ${JSON.stringify(faux)}`)
		})

		expect(acceptes).toEqual([])
		// L'exception est bien une exception, pas un oubli : `memoire: null` est lue.
		expect(statut({ ...cloneDeLaSaturee(), memoire: null }, dossier)).toBe('reprenable')
	})

	it('une chaine a la place d une liste est refusee — String.includes existe, la lecture silencieusement fausse serait pire qu un refus', () => {
		const dossier = dossierDeLaSaturee()
		const avecMonde = (cle: string, valeur: unknown): unknown => {
			const brut = cloneDeLaSaturee()
			return { ...brut, monde: { ...(brut.monde as Record<string, unknown>), [cle]: valeur } }
		}

		// `'lieu.val-cendre'.includes('lieu.val')` répond `true` : une liste de visites écrite
		// comme une chaîne ferait mentir l'évaluateur bivalent sans le faire lever (KR-238).
		expect(statut(avecMonde('lieux_visites', 'lieu.val-cendre'), dossier)).toBe('illisible')
		expect(statut(avecMonde('objets_possedes', 'objet.clef-de-basalte'), dossier)).toBe('illisible')
		expect(statut(avecMonde('pnj', []), dossier)).toBe('illisible')
		// L'opposition : les mêmes champs, bien formés, sont lus.
		expect(statut(avecMonde('lieux_visites', ['lieu.val-cendre']), dossier)).toBe('reprenable')
		expect(statut(avecMonde('pnj', {}), dossier)).toBe('reprenable')
	})

	/**
	 * LES UNIONS FERMÉES — là où la VALEUR du bon genre peut être fausse. Le balayage des
	 * feuilles ci-dessus ne remplace une chaîne que par un autre genre : une chaîne hors du
	 * registre, elle, ne se voit qu'ici. Chaque ligne nomme le champ, et une valeur du MÊME
	 * genre que celle de la fixture qui n'appartient pas à l'ensemble fermé.
	 *
	 * `registre` : l'ensemble est un OBJET (registre ou `Record`), donc `toString` et
	 * `constructor` y sont des clés héritées — l'appartenance doit être PROPRE (KR-175).
	 */
	const UNIONS_FERMEES: ReadonlyArray<{
		readonly sentier: readonly Segment[]
		readonly inconnue: unknown
		readonly registre: boolean
	}> = [
		{ sentier: ['schema'], inconnue: 2, registre: false },
		{ sentier: ['attente', 'type'], inconnue: 'questionnaire', registre: false },
		{ sentier: ['journal', 1, 'role'], inconnue: 'ia', registre: true },
		{ sentier: ['journal', 1, 'origine'], inconnue: 'teleporter', registre: true },
		{ sentier: ['journal', 1, 'jet', 'carac'], inconnue: 'XX', registre: true },
		{ sentier: ['journal', 1, 'jet', 'tc'], inconnue: 'TC9', registre: true },
		{ sentier: ['journal', 2, 'deltas', 0, 'delta'], inconnue: 'creer_objet', registre: true },
		{ sentier: ['journal', 2, 'deltas', 0, 'effet'], inconnue: 'inconnu', registre: true },
		{ sentier: ['combat', 'postures', 0], inconnue: 'furieuse', registre: true },
		{ sentier: ['combat', 'fuite'], inconnue: false, registre: false },
	]

	it('chaque union fermee refuse une valeur du bon genre hors de l ensemble — et l appartenance est PROPRE (toString, constructor)', () => {
		const dossier = dossierDeLaSaturee()

		// Les lignes visent des champs VIVANTS : une valeur de la fixture qui serait déjà
		// l'« inconnue » ferait de la ligne un test à l'envers.
		const mortes = UNIONS_FERMEES.filter((ligne) => lireA(SESSION_SATUREE, ligne.sentier) === ligne.inconnue)
		expect(mortes.map((ligne) => nomme(ligne.sentier))).toEqual([])

		const acceptees = UNIONS_FERMEES.flatMap((ligne) => {
			const hors = ligne.registre ? [ligne.inconnue, 'toString', 'constructor', '__proto__'] : [ligne.inconnue]
			return hors
				.filter((valeur) => statut(remplacerA(cloneDeLaSaturee(), ligne.sentier, valeur), dossier) !== 'illisible')
				.map((valeur) => `${nomme(ligne.sentier)} = ${String(valeur)}`)
		})
		expect(acceptees).toEqual([])

		// L'OPPOSITION : la valeur de la fixture, elle, est lue — sinon tout serait refusé.
		const refusees = UNIONS_FERMEES.filter(
			(ligne) =>
				statut(remplacerA(cloneDeLaSaturee(), ligne.sentier, lireA(SESSION_SATUREE, ligne.sentier)), dossier) !==
				'reprenable',
		)
		expect(refusees.map((ligne) => nomme(ligne.sentier))).toEqual([])
	})

	it('chaque membre des registres fermes est LU : les verbes, les effets, les roles, les postures, les caracs et les paliers', () => {
		const dossier = dossierDeLaSaturee()
		// DÉRIVÉ DES REGISTRES, jamais N littéraux (KR-117/199) : un membre ajouté au registre
		// est lu sans toucher ce test, un membre retiré par erreur du VALIDATEUR rougit ici.
		const lignes = [
			{ sentier: ['journal', 1, 'origine'], valeurs: Object.keys(COMMANDES) },
			{ sentier: ['journal', 2, 'deltas', 0, 'delta'], valeurs: Object.keys(DELTAS) },
			{ sentier: ['journal', 1, 'jet', 'carac'], valeurs: Object.keys(CHARACTERISTICS) },
			{ sentier: ['journal', 1, 'jet', 'tc'], valeurs: Object.keys(CHALLENGE_TIERS) },
			{ sentier: ['combat', 'postures', 0], valeurs: Object.keys(POSTURES) },
			{ sentier: ['journal', 1, 'role'], valeurs: ['joueur', 'moteur'] },
			{ sentier: ['journal', 2, 'deltas', 0, 'effet'], valeurs: ['applique', 'sans_effet'] },
		] as const

		const refusees = lignes.flatMap(({ sentier, valeurs }) =>
			valeurs
				.filter((valeur) => statut(remplacerA(cloneDeLaSaturee(), sentier, valeur), dossier) !== 'reprenable')
				.map((valeur) => `${nomme(sentier)} = ${valeur}`),
		)

		expect(refusees).toEqual([])
		// NON-VACUITÉ : le balayage lit des ensembles non vides.
		expect(lignes.every((ligne) => ligne.valeurs.length >= 2)).toBe(true)
	})

	it('les cles qu aucune table ne nomme sont TOLEREES : une session d un code plus recent reste lisible, et rien n est reconstruit', () => {
		const dossier = dossierDeLaSaturee()
		const futur = { ...cloneDeLaSaturee(), cle_future: 1, horloge: { ...SESSION_SATUREE.horloge, extra: true } }

		const lecture = validerSession(futur, dossier)

		expect(lecture.statut).toBe('reprenable')
		// La session rendue est CELLE du stockage : la clé qu'on ne connaît pas n'est pas perdue en chemin.
		if (lecture.statut === 'reprenable') expect(lecture.session).toBe(futur)
	})
})

// ═══════════════════════════════════════════════════════════════════════════
// CE QUE LE LECTEUR NE FAIT PAS
// ═══════════════════════════════════════════════════════════════════════════

describe('validerSession, ne verifie que la FORME de la memoire — jamais I1 a I5 (decision actee)', () => {
	it('I1, I2 et I5 sont des proprietes du chemin d ecriture : une memoire qui les viole reste LISIBLE', () => {
		const dossier = dossierDeLaSaturee()
		const avec = (memoire: unknown): unknown => ({ ...cloneDeLaSaturee(), memoire })

		// I1 — « rien retenu » ne s'écrit que `null` : `{ faits_etablis: [] }` est une seconde forme
		// du même état, que `consignerNarration` ne produit jamais. Le lecteur ne la refuse pas.
		expect(statut(avec({ faits_etablis: [] }), dossier)).toBe('reprenable')

		// I2 — `jusqu_au_pas` ≤ `borneDeFenetre(horloge.tour)`. Un pointeur AU-DELÀ de la borne
		// est incohérent ; vérifier exigerait la cadence, que ce module ne connaît pas.
		const tour = SESSION_SATUREE.horloge.tour
		const horsBorne = { texte: 'x', jusqu_au_pas: borneDeFenetre(tour) + CADENCE + 1 }
		expect(horsBorne.jusqu_au_pas).toBeGreaterThan(borneDeFenetre(tour))
		expect(statut(avec({ faits_etablis: [], resume: horsBorne }), dossier)).toBe('reprenable')

		// I5 — `sur` ne porte que des `lieu.*` et des `objet.*` : une ancre `indice.*` est lue.
		expect(statut(avec({ faits_etablis: [{ fait: 'x', sur: ['indice.sceau-brise'] }] }), dossier)).toBe('reprenable')
	})

	it('une reference qui ne resout plus n est pas un defaut de forme : le dossier a change, c est perimee', () => {
		const dossier = dossierDeLaSaturee()
		const brut = { ...cloneDeLaSaturee(), monde: { ...SESSION_SATUREE.monde, lieu_courant: 'lieu.disparu' } }

		// La forme est saine ; `validerSession` ne résout aucune référence (il ne lit du dossier
		// que `id` et `updatedAt`). Une partie dont le lieu a disparu du dossier est périmée PAR
		// L'ESTAMPILLE — c'est elle qui dit que le dossier a bougé.
		expect(statut(brut, dossier)).toBe('reprenable')
		expect(statut(brut, dossierDe(dossier.id, '2026-10-01T00:00:00.000Z'))).toBe('perimee')
	})
})

// ═══════════════════════════════════════════════════════════════════════════
// L'ALLER-RETOUR JSON — parité écrivain / lecteur
// ═══════════════════════════════════════════════════════════════════════════

const RECIT = 'Vous gravissez les derniers degres ; le feu de la vigie vous brule les yeux.'

const HEROS: HeroState = {
	name: 'Aldric le Téméraire',
	caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
	pvMax: 21,
	pv: 14,
	peMax: 8,
	pe: 3,
	mcBonus: 0,
	xp: 12,
}

/**
 * UNE PARTIE JOUÉE PAR LES VRAIES PORTES D'ÉCRITURE — jamais forgée à la main (précédent
 * `recit.test.ts`) : une session écrite à la main pour arriver à l'état voulu prouverait la
 * propriété sur un état que le produit ne sait peut-être pas atteindre. C'est la PARITÉ
 * écrivain/lecteur : le jour où une porte écrit une clé que le validateur refuse, c'est
 * ce test qui rougit, pas la reprise d'un joueur.
 *
 * L'ORDRE EST CELUI D'UNE PARTIE : le combat vient en DERNIER, il bloque `executerCommande`
 * (`combat_en_cours`) tant qu'il est ouvert.
 */
function partieJouee(): { readonly dossier: Dossier; readonly session: EtatSession } {
	const dossier = dossierDe('dossier-reference', '2026-08-08T09:00:00.000Z')
	const jouer = (depart: EtatSession, saisie: string): EtatSession => {
		const analyse = analyserSaisie(saisie)
		if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
		const resultat = executerCommande(dossier, depart, analyse.commande)
		if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
		return resultat.session
	}

	let session = ouverture(dossier)
	session = jouer(session, 'ALLER lieu.tour-effondree')
	session = jouer(session, 'ALLER lieu.vigie-du-nord')
	session = consignerNarration(session, session.horloge.tour, {
		recit: RECIT,
		faits_etablis: [
			{ fait: 'Le foyer garde une braise sous la cendre.', sur: ['lieu.foyer-du-guet'] },
			{ fait: 'Le sceau porte une fêlure.', sur: ['objet.sceau-de-cendre', 'lieu.foyer-du-guet'] },
		],
	})
	session = consignerJet(session, session.horloge.tour, { carac: 'AG', tc: 'TC2' })
	session = fixerHeros(session, HEROS)
	session = crediterXp(session, 3)
	session = crediterConfiance(session, 'pnj.corvin-le-marchand', 1)
	session = apresInterpretation(
		dossier,
		session,
		{ lecture: 'clarification', question: 'Lequel des deux ?' },
		'je vais au marche',
	).session

	const evenement = dossier.monde.evenements.find((candidat) => candidat.monstre_ref !== undefined)
	if (evenement?.monstre_ref === undefined) throw new Error('le dossier de référence ne porte aucune rencontre')
	session = resoudreRencontre(session, { evenement_id: evenement.id, monstre_ref: evenement.monstre_ref })
	session = jouerPosture(jouerPosture(session, 'precise'), 'defensive')
	session = fuirRencontre(session)

	return { dossier, session }
}

describe('validerSession, aller-retour JSON — la parite ecrivain / lecteur', () => {
	it('une session ecrite par les vraies portes se relit reprenable, rien perdu en route', () => {
		const { dossier, session } = partieJouee()

		// LE TÉMOIN COUVRE LES ONZE CLÉS RACINES — `attente`, `heros` et `combat` comprises : une
		// partie jouée qui n'en porterait que huit ne prouverait la parité que sur les requises.
		expect(Object.keys(session).sort()).toEqual(Object.keys(SESSION_SATUREE).sort())
		// Et des champs que seules ces portes écrivent, constatés AVANT la sérialisation.
		expect(session.combat).toEqual({
			monstre_ref: 'bestiaire.squelette',
			postures: ['precise', 'defensive'],
			fuite: true,
		})
		expect(session.heros?.xp).toBe(HEROS.xp + 3)
		expect(session.monde.pnj['pnj.corvin-le-marchand']?.confiance).toBe(1)
		expect(session.memoire?.faits_etablis).toHaveLength(2)
		expect(session.attente?.saisie).toBe('je vais au marche')
		expect(session.journal.some((entree) => entree.recit === RECIT && entree.origine === 'aller')).toBe(true)
		expect(session.journal.some((entree) => entree.jet?.carac === 'AG')).toBe(true)
		expect(session.journal.some((entree) => entree.deltas !== undefined)).toBe(true)

		const brut: unknown = JSON.parse(JSON.stringify(session))
		const lecture = validerSession(brut, dossier)

		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut !== 'reprenable') return
		expect(lecture.session).toEqual(session)
		expect(lecture.session).toBe(brut)
		// La même session, relue contre un dossier édité depuis : périmée. L'opposition est
		// dans le même test, sinon « reprenable » serait vrai d'un lecteur qui ignore l'estampille.
		expect(statut(brut, { ...dossier, updatedAt: '2026-10-01T00:00:00.000Z' })).toBe('perimee')
	})

	it('chaque etape de la partie est lisible, de l ouverture au combat fui — pas seulement l etat final', () => {
		// Un lecteur trop strict pour l'ÉTAT D'OUVERTURE (aucune clé optionnelle, journal vide,
		// `monde.pnj` vide) refuserait la toute première partie d'un joueur : l'ouverture est
		// le cas le plus fréquent de la reprise, et le moins couvert par un état final.
		const dossier = dossierDe('dossier-reference', '2026-08-08T09:00:00.000Z')
		const ouverte = ouverture(dossier)

		expect(ouverte.journal).toEqual([])
		expect(ouverte.memoire).toBeNull()
		expect(statut(JSON.parse(JSON.stringify(ouverte)), dossier)).toBe('reprenable')
		expect(statut(JSON.parse(JSON.stringify(partieJouee().session)), dossier)).toBe('reprenable')
	})

	it('la fixture saturee, toutes cles optionnelles posees, survit a l aller-retour et se relit reprenable', () => {
		const brut: unknown = JSON.parse(JSON.stringify(SESSION_SATUREE))
		const lecture = validerSession(brut, dossierDeLaSaturee())

		expect(lecture.statut).toBe('reprenable')
		if (lecture.statut === 'reprenable') expect(lecture.session).toEqual(SESSION_SATUREE)
	})
})

// ═══════════════════════════════════════════════════════════════════════════
// LES PROPRIÉTÉS AFFIRMÉES EN DOCSTRING (KR-169) — chacune a son test
// ═══════════════════════════════════════════════════════════════════════════

const RACINE_SRC = path.join(__dirname, '..', '..')

/** Retire les commentaires — ON CHERCHE DU CODE, PAS UNE MENTION (précédent `commandes.test.ts`). */
const sansCommentaires = (source: string): string => source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

function fichiersDeProduction(racine: string): string[] {
	return fs.readdirSync(racine, { withFileTypes: true }).flatMap((entree) => {
		const chemin = path.join(racine, entree.name)
		if (entree.isDirectory()) return fichiersDeProduction(chemin)
		return /\.tsx?$/.test(entree.name) && !/\.test\.tsx?$/.test(entree.name) ? [chemin] : []
	})
}

describe('la frontiere de reprise.ts est instrumentee, pas conventionnelle (KR-109/169)', () => {
	it('validerSession ne sort PAS du barillet et aucune feature ne l appelle — LectureSession, elle, sort', () => {
		const baril = sansCommentaires(fs.readFileSync(path.join(RACINE_SRC, 'brain', 'index.ts'), 'utf8'))
		const features = fichiersDeProduction(path.join(RACINE_SRC, 'features'))
		// NON-VACUITÉ : le balayage voit réellement le disque.
		expect(features.length).toBeGreaterThan(50)

		const coupables = features.filter((fichier) =>
			sansCommentaires(fs.readFileSync(fichier, 'utf8')).includes('validerSession'),
		)

		expect(baril).not.toContain('validerSession')
		expect(coupables.map((fichier) => path.relative(RACINE_SRC, fichier))).toEqual([])
		expect(baril).toContain('LectureSession')

		// DISCRIMINANCE du balayage, dans les deux sens (BUG-084).
		expect(sansCommentaires("import { validerSession } from './dossier/reprise'")).toContain('validerSession')
		expect(sansCommentaires('// ne jamais appeler validerSession ici')).not.toContain('validerSession')
		expect(sansCommentaires('/** validerSession reste dedans */')).not.toContain('validerSession')
	})

	it('le type LectureSession du barillet EST celui de reprise.ts : un seul type, deux adresses', () => {
		// Vérifié À LA COMPILATION : si les deux types divergeaient, cette affectation ne
		// compilerait pas (ts-jest type-checke ce fichier).
		const lecture: LectureDuBaril = validerSession(null, dossierDeLaSaturee())
		const inverse: LectureSession = lecture

		expect(inverse).toEqual({ statut: 'absente' })
	})

	it('reprise.ts est PUR : il n importe ni service, ni React, ni feature — liste blanche nommee', () => {
		const source = sansCommentaires(fs.readFileSync(path.join(__dirname, 'reprise.ts'), 'utf8'))
		const specificateurs = [...source.matchAll(/from\s+'([^']+)'/g)].map((correspondance) => correspondance[1]).sort()

		// LISTE BLANCHE NOMMÉE (KR-215) : « module pur, extractible avec `src/player/` » est une
		// propriété d'IMPORTS, et une docstring qui l'affirme sans test n'est qu'une intention.
		expect(specificateurs).toEqual(
			[
				'../../player/types',
				'../challenge',
				'../characteristics',
				'../combat',
				'./commandes',
				'./deltas',
				'./evaluate',
				'./faits',
				'./identifiers',
				'./session',
				'./types',
			].sort(),
		)
	})

	it('session.ts n importe reprise.ts qu en TYPE SEUL : le cycle reste un cycle de types, effacé a l emission', () => {
		const source = sansCommentaires(fs.readFileSync(path.join(__dirname, 'session.ts'), 'utf8'))
		const importsDeReprise = source.split('\n').filter((ligne) => /from\s+'\.\/reprise'/.test(ligne))

		// UNE arête, et de type. Une arête de VALEUR nouerait un cycle d'exécution avec
		// `reprise.ts`, qui importe `SCHEMA_SESSION` d'ici en valeur.
		expect(importsDeReprise).toEqual(["import type { LectureSession } from './reprise'"])
	})
})
