import fs from 'node:fs'
import path from 'node:path'
import { MARQUEUR_A_ECRIRE } from './amorce'
import type { FaitsDeSession } from './faits'
import { evaluerSavoir, savoirsDejaConfies, savoirsRevelables, type EtatSavoir } from './revelation'
import { CONFIANCE_DEPART, type Dossier, type Revelation, type Savoir } from './types'

/**
 * L'ÉVALUATEUR DE RÉVÉLATION (n° 12 `moteur-acteurs`, it2, lot `contrat`) — § 7 du
 * plan d'itération.
 *
 * LA FIXTURE EST `dossier-minimal.json`, CLONÉE À CHAQUE APPEL (KR-156) ET JAMAIS
 * ÉCRITE SUR LE DISQUE : `pnj.aldur-le-sage` y porte DÉJÀ un savoir gardé par les
 * QUATRE portes à la fois (`indice.sceau-brise`, SANS `formulation_joueur` —
 * parfait pour le cas limite « contenu absent » sans y toucher), et
 * `indice.cendres-tiedes` y porte DÉJÀ une `formulation_joueur` rédigée. Chaque
 * test MUTE sa propre copie en mémoire — jamais le fichier partagé, jamais
 * `dossier-reference.json` (dont l'enrichissement se limite à Harek, lot `contrat`,
 * seul besoin démontré par `contexte/acteur.test.ts`/`CopiloteService.test.ts`).
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

function clone(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Dossier
}

const PNJ = 'pnj.aldur-le-sage'
/** Le savoir déjà présent dans la fixture — QUATRE portes posées, AUCUNE formulation_joueur. */
const INDICE_SANS_FORMULE = 'indice.sceau-brise'
/** Un indice de la fixture qui porte DÉJÀ une `formulation_joueur` rédigée. */
const INDICE_AVEC_FORMULE = 'indice.cendres-tiedes'
const OBJET = 'objet.clef-de-basalte'
const AUTRE_INDICE = 'indice.un-autre'

function faitsVides(): FaitsDeSession {
	return {
		lieu_courant: 'lieu.val-cendre',
		lieux_visites: ['lieu.val-cendre'],
		objets_possedes: [],
		indices_connus: [],
		jalons_atteints: [],
		evenements_consommes: [],
		pnj: {},
	}
}

/** Pose `revele_si` sur l'unique savoir d'Aldûr, dans le dossier CLONÉ fourni. */
function avecRevelesi(dossier: Dossier, revele_si: Revelation | undefined): Dossier {
	const savoir: Savoir = { ...dossier.monde.personnages[0].savoirs[0], revele_si }
	return {
		...dossier,
		monde: { ...dossier.monde, personnages: [{ ...dossier.monde.personnages[0], savoirs: [savoir] }] },
	}
}

/** Repointe le savoir d'Aldûr sur un indice donné (par défaut, celui AVEC formulation_joueur). */
function avecIndiceCible(dossier: Dossier, indiceId: string): Dossier {
	const savoir: Savoir = { ...dossier.monde.personnages[0].savoirs[0], indice_id: indiceId }
	return {
		...dossier,
		monde: { ...dossier.monde, personnages: [{ ...dossier.monde.personnages[0], savoirs: [savoir] }] },
	}
}

function savoirDAldur(dossier: Dossier): Savoir {
	return dossier.monde.personnages[0].savoirs[0]
}

describe('evaluerSavoir — conjonction ET fail-closed (KR-280), contrepartie+apres_indice_id', () => {
	it('5 branches : seule (contrepartie VRAIE, apres_indice VRAI) rend revelable', () => {
		const base = avecIndiceCible(clone(), INDICE_AVEC_FORMULE)
		const casParBranche: ReadonlyArray<{
			readonly nom: string
			readonly revele_si: Revelation
			readonly faits: FaitsDeSession
			readonly attendu: string
		}> = [
			{
				nom: 'A — contrepartie seule vraie, apres_indice jamais obtenu',
				revele_si: { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE },
				faits: { ...faitsVides(), objets_possedes: [OBJET] },
				attendu: 'absent',
			},
			{
				nom: 'B — apres_indice seul vrai, objet jamais possede',
				revele_si: { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE },
				faits: { ...faitsVides(), indices_connus: [AUTRE_INDICE] },
				attendu: 'absent',
			},
			{
				nom: 'C — les deux vraies, rien d autre pose : revelable',
				revele_si: { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE },
				faits: { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] },
				attendu: 'revelable',
			},
			{
				nom: 'D — les deux fausses',
				revele_si: { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE },
				faits: faitsVides(),
				attendu: 'absent',
			},
			{
				nom: 'E — les deux conditions vraies MAIS consomme:true : structurellement ferme (it2)',
				revele_si: { contrepartie: { objet_id: OBJET, consomme: true }, apres_indice_id: AUTRE_INDICE },
				faits: { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] },
				attendu: 'absent',
			},
		]

		for (const cas of casParBranche) {
			const dossier = avecRevelesi(base, cas.revele_si)
			const resultat = evaluerSavoir(dossier, cas.faits, PNJ, savoirDAldur(dossier))
			expect(`${cas.nom} → ${resultat}`).toBe(`${cas.nom} → ${cas.attendu}`)
		}
	})
})

describe('evaluerSavoir — vacuite : un savoir sans aucune porte ne se revele jamais de lui-meme', () => {
	it('revele_si absent (undefined) rend absent, jamais revelable par defaut', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), undefined)
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('absent')
	})

	it('revele_si == {} (aucune cle posee) rend absent — jamais ouvert par un every() fautif sur une liste vide', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), {})
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('absent')
		// Discriminant : MEME avec des faits tres riches, {} reste absent.
		const faitsRiches: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
		expect(evaluerSavoir(dossier, faitsRiches, PNJ, savoirDAldur(dossier))).toBe('absent')
	})
})

describe('evaluerSavoir — contenu : sans formulation_joueur redigee, absent du contexte', () => {
	it('indice SANS formulation_joueur (fixture telle quelle) reste absent, memes portes satisfaites', () => {
		// `indice.sceau-brise` porte DÉJÀ les quatre portes dans la fixture ; on les
		// réduit à contrepartie+apres_indice_id SATISFAITES, et le résultat reste absent.
		const dossier = avecRevelesi(clone(), {
			contrepartie: { objet_id: OBJET, consomme: false },
			apres_indice_id: AUTRE_INDICE,
		})
		expect(savoirDAldur(dossier).indice_id).toBe(INDICE_SANS_FORMULE)
		const faits: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('absent')
	})

	it('formulation_joueur blanche (espaces seuls) compte comme absente', () => {
		const dossier = clone()
		dossier.monde.indices = dossier.monde.indices.map((indice) =>
			indice.id === INDICE_AVEC_FORMULE ? { ...indice, formulation_joueur: '   \n\t ' } : indice,
		)
		const avecPortes = avecRevelesi(avecIndiceCible(dossier, INDICE_AVEC_FORMULE), {
			contrepartie: { objet_id: OBJET, consomme: false },
			apres_indice_id: AUTRE_INDICE,
		})
		const faits: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
		expect(evaluerSavoir(avecPortes, faits, PNJ, savoirDAldur(avecPortes))).toBe('absent')
	})

	it('formulation_joueur encore MARQUEE (jamais rediges) compte comme absente', () => {
		const dossier = clone()
		dossier.monde.indices = dossier.monde.indices.map((indice) =>
			indice.id === INDICE_AVEC_FORMULE ? { ...indice, formulation_joueur: `${MARQUEUR_A_ECRIRE} a ecrire` } : indice,
		)
		const avecPortes = avecRevelesi(avecIndiceCible(dossier, INDICE_AVEC_FORMULE), {
			contrepartie: { objet_id: OBJET, consomme: false },
			apres_indice_id: AUTRE_INDICE,
		})
		const faits: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
		expect(evaluerSavoir(avecPortes, faits, PNJ, savoirDAldur(avecPortes))).toBe('absent')
	})
})

describe('evaluerSavoir — fail-closed : jet FERME (it4), confiance_min ENTRE EN CONJONCTION depuis it3', () => {
	const faitsOuverts: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
	const base: Revelation = { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE }

	it('confiance_min EN CONJONCTION avec les deux autres portes : ferme si la confiance manque, meme les deux autres vraies', () => {
		// ⚠ CETTE PORTE FERMAIT INCONDITIONNELLEMENT EN IT2 — le test disait alors
		// « confiance_min pose, meme a une valeur triviale, ferme la porte », valeur
		// -3 comprise. CE N'EST PLUS VRAI DEPUIS L'IT3 (n° 12, lot `contrat`) :
		// `confiance_min` est désormais ÉVALUÉE, pas seulement POSÉE — une confiance
		// insuffisante ferme encore, mais une confiance suffisante ouvre (branche
		// discriminante juste en dessous).
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), { ...base, confiance_min: 2 })
		expect(evaluerSavoir(dossier, faitsOuverts, PNJ, savoirDAldur(dossier))).toBe('absent')
		const faitsAvecConfianceSuffisante: FaitsDeSession = {
			...faitsOuverts,
			pnj: { [PNJ]: { a_dit: [], confiance: 2 } },
		}
		expect(evaluerSavoir(dossier, faitsAvecConfianceSuffisante, PNJ, savoirDAldur(dossier))).toBe('revelable')
	})

	it('jet pose ferme la porte, aucun mecanisme de de n existe (it4)', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), {
			...base,
			jet: { carac: 'CA', tc: 'TC1' },
		})
		expect(evaluerSavoir(dossier, faitsOuverts, PNJ, savoirDAldur(dossier))).toBe('absent')
	})

	it('discriminant : SANS confiance_min ni jet, les deux memes portes ouvrent bien (non-regression du test precedent)', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), base)
		expect(evaluerSavoir(dossier, faitsOuverts, PNJ, savoirDAldur(dossier))).toBe('revelable')
	})
})

/**
 * `confiance_min`, SEULE PORTE POSÉE (n° 12 `moteur-acteurs`, it3, lot
 * `contrat` — `docs/REGLES-DU-JEU.md` § 6, critère d'acceptation #1 du plan).
 * TROIS BRANCHES, aucune autre porte posée : `< N` fermé, `= N` et `> N`
 * ouverts.
 */
describe('evaluerSavoir — confiance_min, SEULE porte posee : 3 branches (critere #1 du plan)', () => {
	it('confiance < N ferme, confiance = N et confiance > N ouvrent — seule cette porte posee', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), { confiance_min: 1 })
		const casParBranche: ReadonlyArray<{ readonly confiance: number; readonly attendu: EtatSavoir }> = [
			{ confiance: 0, attendu: 'absent' },
			{ confiance: 1, attendu: 'revelable' },
			{ confiance: 2, attendu: 'revelable' },
		]

		for (const { confiance, attendu } of casParBranche) {
			const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [], confiance } } }
			expect(`confiance=${confiance} → ${evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))}`).toBe(
				`confiance=${confiance} → ${attendu}`,
			)
		}
	})

	it('un PNJ sans aucune entree faits.pnj[id] lit CONFIANCE_DEPART (= 0) — ferme a confiance_min:1 (critere #4 du plan)', () => {
		expect(CONFIANCE_DEPART).toBe(0)
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), { confiance_min: 1 })
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('absent')
	})

	it('confiance_min:0 ouvre des le defaut CONFIANCE_DEPART, sans aucune entree pour ce PNJ', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), { confiance_min: 0 })
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('revelable')
	})
})

describe('evaluerSavoir — la memoire (a_dit) testee EN PREMIER, avant toute porte (KR-013/175)', () => {
	it('deja_confie meme si AUCUNE porte ne tient (revele_si ferme, ou meme absent) — l historique ne se reecrit pas', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), undefined)
		const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } } }
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('deja_confie')
	})

	it('deja_confie resiste a la fermeture ULTERIEURE d une porte qui etait ouverte (gardee quand meme)', () => {
		const base: Revelation = { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE }
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), base)
		// La porte etait OUVERTE (objet possede, indice connu) au moment du constat ;
		// elle s est refermee depuis (plus d objet possede) — l etat reste deja_confie.
		const faits: FaitsDeSession = {
			...faitsVides(),
			indices_connus: [AUTRE_INDICE],
			pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } },
		}
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('deja_confie')
	})

	it('un indice connu par une AUTRE source (ex. jalon) sans avoir ete confie par CE PNJ reste absent/revelable, jamais deja_confie', () => {
		// indices_connus et a_dit sont DEUX registres distincts (KR-013) : l un ne
		// constitue jamais l autre.
		const base: Revelation = { contrepartie: { objet_id: OBJET, consomme: false }, apres_indice_id: AUTRE_INDICE }
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), base)
		const faits: FaitsDeSession = {
			...faitsVides(),
			objets_possedes: [OBJET],
			indices_connus: [AUTRE_INDICE, INDICE_AVEC_FORMULE],
			pnj: {},
		}
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('revelable')
	})
})

describe('savoirsRevelables / savoirsDejaConfies — le catalogue borne (KR-287)', () => {
	it('savoirsRevelables ne rend que les indice_id REVELABLES, dans l ordre de la fiche', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), {
			contrepartie: { objet_id: OBJET, consomme: false },
			apres_indice_id: AUTRE_INDICE,
		})
		const faits: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
		expect(savoirsRevelables(dossier, faits, PNJ)).toEqual([INDICE_AVEC_FORMULE])
		expect(savoirsDejaConfies(dossier, faits, PNJ)).toEqual([])
	})

	it('savoirsDejaConfies ne rend que les indice_id DEJA CONFIES, sans rang', () => {
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), undefined)
		const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } } }
		expect(savoirsDejaConfies(dossier, faits, PNJ)).toEqual([INDICE_AVEC_FORMULE])
		expect(savoirsRevelables(dossier, faits, PNJ)).toEqual([])
	})

	it('un personnageId qui ne resout pas rend deux listes vides, jamais une levee', () => {
		const dossier = clone()
		expect(savoirsRevelables(dossier, faitsVides(), 'pnj.fantome')).toEqual([])
		expect(savoirsDejaConfies(dossier, faitsVides(), 'pnj.fantome')).toEqual([])
	})

	it('isolation : a_dit d un AUTRE personnage ne rend jamais CE personnage deja_confie, meme indice_id identique', () => {
		// DEUX personnages distincts portent chacun un savoir sur LE MEME indice —
		// seul `pnj.second` l a deja confie (`a_dit`). Aldûr, lui, doit rester
		// REVELABLE : la mémoire d un PNJ n'en contamine jamais un autre (KR-282 étendu).
		const base = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), {
			contrepartie: { objet_id: OBJET, consomme: false },
			apres_indice_id: AUTRE_INDICE,
		})
		const savoirPartage: Savoir = { ...savoirDAldur(base) }
		const dossier: Dossier = {
			...base,
			monde: {
				...base.monde,
				personnages: [
					...base.monde.personnages,
					{ id: 'pnj.second', portee: 'premier', plan_actions: [], savoirs: [savoirPartage] },
				],
			},
		}
		const faits: FaitsDeSession = {
			...faitsVides(),
			objets_possedes: [OBJET],
			indices_connus: [AUTRE_INDICE],
			pnj: { 'pnj.second': { a_dit: [INDICE_AVEC_FORMULE] } },
		}

		expect(savoirsRevelables(dossier, faits, PNJ)).toEqual([INDICE_AVEC_FORMULE])
		expect(savoirsDejaConfies(dossier, faits, PNJ)).toEqual([])
		expect(savoirsRevelables(dossier, faits, 'pnj.second')).toEqual([])
		expect(savoirsDejaConfies(dossier, faits, 'pnj.second')).toEqual([INDICE_AVEC_FORMULE])
	})
})

/**
 * `porteOuverte` (`atteignabilite.ts`) N'EST JAMAIS RÉUTILISÉE ICI (KR-288) —
 * polarité INVERSE (analyse statique optimiste vs évaluation runtime fermée par
 * défaut). Témoin GREPPABLE : aucun fichier de PRODUCTION hors `atteignabilite.ts`
 * ne la nomme.
 */
describe('porteOuverte — jamais reutilisee hors de atteignabilite.ts (KR-288)', () => {
	it('aucun fichier de production de brain/dossier, hors atteignabilite.ts, n APPELLE porteOuverte(…)', () => {
		// ANCRÉ SUR L'APPEL (`porteOuverte(`), jamais le mot nu : `revelation.ts`
		// NOMME la fonction en PROSE, dans sa docstring, pour documenter qu'elle ne
		// l'appelle jamais — un balayage sur le mot nu se mordrait la queue.
		const MARQUE_APPEL = 'porteOuverte('
		const fichiers = fs
			.readdirSync(__dirname)
			.filter((fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.test.ts') && fichier !== 'atteignabilite.ts')
		const porteurs = fichiers.filter((fichier) =>
			fs.readFileSync(path.join(__dirname, fichier), 'utf8').includes(MARQUE_APPEL),
		)
		expect(porteurs).toEqual([])
		// Discriminant : atteignabilite.ts, lui, appelle bien sa propre fonction —
		// sinon le balayage serait vert sur un mot qui n'apparaît nulle part (BUG-084).
		expect(fs.readFileSync(path.join(__dirname, 'atteignabilite.ts'), 'utf8')).toContain(MARQUE_APPEL)
	})
})
