import fs from 'node:fs'
import path from 'node:path'
import { MARQUEUR_A_ECRIRE } from './amorce'
import type { FaitsDeSession } from './faits'
import {
	evaluerSavoir,
	savoirsDejaConfies,
	savoirsRevelables,
	savoirSousEpreuve,
	type EtatSavoir,
	type JetReussi,
} from './revelation'
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

describe('evaluerSavoir — fail-closed : confiance_min ENTRE EN CONJONCTION depuis it3, le jet depuis it4', () => {
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

	it('jet pose, SANS epreuves : jamais ouvert par defaut — sous_epreuve (it4), ni revelable ni absent', () => {
		// ⚠ CE TEST DISAIT « jet pose ferme la porte, aucun mecanisme de de n existe » JUSQU'A
		// L'IT4 (`absent`). Le `jet` est desormais EVALUE, en dernier : seule porte fermee, il
		// rend `sous_epreuve` — jamais `revelable` sans une reussite acquise (fail-closed, KR-280).
		const dossier = avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), {
			...base,
			jet: { carac: 'CA', tc: 'TC1' },
		})
		expect(evaluerSavoir(dossier, faitsOuverts, PNJ, savoirDAldur(dossier))).toBe('sous_epreuve')
		expect(evaluerSavoir(dossier, faitsOuverts, PNJ, savoirDAldur(dossier), [])).toBe('sous_epreuve')
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
 * LA PORTE `jet` (n° 12 `moteur-acteurs`, it4, lot `contrat` — `docs/REGLES-DU-JEU.md`
 * § 6, « La porte `jet` ») : évaluée EN DERNIER, par un TROISIÈME ÉTAT (`sous_epreuve`)
 * plutôt que par une ouverture, et ouverte par une RÉUSSITE ACQUISE du même
 * `(carac, tc)` passée en `epreuves`.
 */
describe('evaluerSavoir — la porte jet : tri-etat, evaluee EN DERNIER (it4, KR-280)', () => {
	const JET: JetReussi = { carac: 'CA', tc: 'TC1' }
	const faitsOuverts: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET], indices_connus: [AUTRE_INDICE] }
	const toutesLesAutresPortes: Revelation = {
		confiance_min: 1,
		contrepartie: { objet_id: OBJET, consomme: false },
		apres_indice_id: AUTRE_INDICE,
	}
	const faitsDeConfiance = (confiance: number): FaitsDeSession => ({
		...faitsOuverts,
		pnj: { [PNJ]: { a_dit: [], confiance } },
	})
	const dossierAvec = (revele_si: Revelation): Dossier =>
		avecRevelesi(avecIndiceCible(clone(), INDICE_AVEC_FORMULE), revele_si)

	it('rend sous_epreuve quand le jet est la SEULE porte posee, sans aucune reussite', () => {
		const dossier = dossierAvec({ jet: JET })
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('sous_epreuve')
	})

	it('rend sous_epreuve quand le jet est la SEULE porte FERMEE : les trois autres, posees, sont toutes ouvertes', () => {
		const dossier = dossierAvec({ ...toutesLesAutresPortes, jet: JET })
		expect(evaluerSavoir(dossier, faitsDeConfiance(1), PNJ, savoirDAldur(dossier))).toBe('sous_epreuve')
		// Discriminant : sans le jet, ces trois memes portes ouvrent — c'est bien lui qui manque.
		const sansJet = dossierAvec(toutesLesAutresPortes)
		expect(evaluerSavoir(sansJet, faitsDeConfiance(1), PNJ, savoirDAldur(sansJet))).toBe('revelable')
	})

	it('rend revelable quand la reussite du MEME (carac, tc) est passee en epreuves', () => {
		const dossier = dossierAvec({ ...toutesLesAutresPortes, jet: JET })
		expect(evaluerSavoir(dossier, faitsDeConfiance(1), PNJ, savoirDAldur(dossier), [JET])).toBe('revelable')
		// La reussite est cherchee DANS la liste, quelle que soit sa place.
		const autre: JetReussi = { carac: 'FO', tc: 'TC4' }
		expect(evaluerSavoir(dossier, faitsDeConfiance(1), PNJ, savoirDAldur(dossier), [autre, JET])).toBe('revelable')
	})

	it('une reussite d un AUTRE couple ne suffit pas : ni la meme carac seule, ni le meme tier seul', () => {
		const dossier = dossierAvec({ jet: JET })
		const faits = faitsVides()
		const memeCaracAutreTier: JetReussi = { carac: JET.carac, tc: 'TC2' }
		const memeTierAutreCarac: JetReussi = { carac: 'FO', tc: JET.tc }
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [memeCaracAutreTier])).toBe('sous_epreuve')
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [memeTierAutreCarac])).toBe('sous_epreuve')
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [memeCaracAutreTier, memeTierAutreCarac])).toBe(
			'sous_epreuve',
		)
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [JET])).toBe('revelable')
	})

	it('rend absent quand le jet est ferme ET confiance_min ferme : le jet vient en dernier', () => {
		const dossier = dossierAvec({ ...toutesLesAutresPortes, jet: JET })
		// confiance 0 < confiance_min 1, les deux autres portes ouvertes.
		expect(evaluerSavoir(dossier, faitsDeConfiance(0), PNJ, savoirDAldur(dossier))).toBe('absent')
		// ET UNE REUSSITE NE LA ROUVRE PAS : un jet gagne n'ouvre jamais ce qu'une autre porte ferme.
		expect(evaluerSavoir(dossier, faitsDeConfiance(0), PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
	})

	it('CAS LIMITE — jet + contrepartie encore fermee : absent, jamais sous_epreuve, meme avec la reussite', () => {
		const dossier = dossierAvec({ contrepartie: { objet_id: OBJET, consomme: false }, jet: JET })
		const faits = faitsVides() // l'objet n'est pas possede
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('absent')
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
		// Discriminant : l'objet possede, la meme fiche passe sous epreuve.
		expect(evaluerSavoir(dossier, { ...faits, objets_possedes: [OBJET] }, PNJ, savoirDAldur(dossier))).toBe(
			'sous_epreuve',
		)
	})

	it('CAS LIMITE — jet + contrepartie consomme:true : absent, structurellement ferme, meme avec la reussite', () => {
		const dossier = dossierAvec({ contrepartie: { objet_id: OBJET, consomme: true }, jet: JET })
		const faits: FaitsDeSession = { ...faitsVides(), objets_possedes: [OBJET] }
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('absent')
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
	})

	it('CAS LIMITE — jet + apres_indice_id encore ferme : absent, meme avec la reussite', () => {
		const dossier = dossierAvec({ apres_indice_id: AUTRE_INDICE, jet: JET })
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('absent')
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
		expect(
			evaluerSavoir(dossier, { ...faitsVides(), indices_connus: [AUTRE_INDICE] }, PNJ, savoirDAldur(dossier)),
		).toBe('sous_epreuve')
	})

	it('la memoire (a_dit) reste testee AVANT le jet : deja_confie, jamais sous_epreuve', () => {
		const dossier = dossierAvec({ jet: JET })
		const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } } }
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier))).toBe('deja_confie')
		expect(evaluerSavoir(dossier, faits, PNJ, savoirDAldur(dossier), [JET])).toBe('deja_confie')
	})

	it('le contenu est teste AVANT le jet : sans formulation_joueur, absent — on ne demande pas un jet pour ne rien confier', () => {
		// `indice.sceau-brise` n'a AUCUNE formulation_joueur dans la fixture.
		const dossier = avecRevelesi(clone(), { jet: JET })
		expect(savoirDAldur(dossier).indice_id).toBe(INDICE_SANS_FORMULE)
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier))).toBe('absent')
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
	})

	it('une reussite n efface pas la fermeture de la fiche : savoir sans aucune porte reste absent', () => {
		const dossier = dossierAvec({})
		expect(evaluerSavoir(dossier, faitsVides(), PNJ, savoirDAldur(dossier), [JET])).toBe('absent')
	})
})

describe('savoirsRevelables / savoirSousEpreuve — le savoir mis en jeu a UN SEUL decideur (it4)', () => {
	const JET: JetReussi = { carac: 'CA', tc: 'TC1' }
	const SECOND_INDICE = 'indice.second-trace'
	const TROISIEME_INDICE = 'indice.troisieme-trace'

	/** `indice.cendres-tiedes` + deux indices REDIGES ajoutes en memoire (jamais sur le disque). */
	function avecTroisSavoirs(revele_si: readonly (Revelation | undefined)[]): Dossier {
		const base = clone()
		const indices = [
			...base.monde.indices,
			{ id: SECOND_INDICE, nom: 'Une seconde trace', formulation_joueur: 'Une seconde trace, plus ancienne.' },
			{ id: TROISIEME_INDICE, nom: 'Une troisieme trace', formulation_joueur: 'Une troisieme trace, a peine visible.' },
		]
		const modele = base.monde.personnages[0].savoirs[0]
		const savoirs: Savoir[] = [INDICE_AVEC_FORMULE, SECOND_INDICE, TROISIEME_INDICE].map((indice_id, rang) => ({
			...modele,
			indice_id,
			revele_si: revele_si[rang],
		}))
		return {
			...base,
			monde: {
				...base.monde,
				indices,
				personnages: [{ ...base.monde.personnages[0], savoirs }, ...base.monde.personnages.slice(1)],
			},
		}
	}

	it('rend le PREMIER savoir en ordre de fiche dont le jet est la seule porte fermee', () => {
		// 1er : pas de porte posee (absent) ; 2e et 3e : un jet chacun, de couples DIFFERENTS.
		const dossier = avecTroisSavoirs([undefined, { jet: JET }, { jet: { carac: 'FO', tc: 'TC2' } }])
		expect(savoirSousEpreuve(dossier, faitsVides(), PNJ)?.indice_id).toBe(SECOND_INDICE)
		// Il rend le SAVOIR lui-meme : c'est dans son `revele_si.jet` que carac/tc se lisent.
		expect(savoirSousEpreuve(dossier, faitsVides(), PNJ)?.revele_si?.jet).toEqual(JET)
	})

	it('une reussite sur le premier le fait passer revelable : le suivant, en ordre de fiche, est alors en jeu', () => {
		const dossier = avecTroisSavoirs([{ jet: JET }, { jet: { carac: 'FO', tc: 'TC2' } }, undefined])
		expect(savoirSousEpreuve(dossier, faitsVides(), PNJ)?.indice_id).toBe(INDICE_AVEC_FORMULE)
		expect(savoirSousEpreuve(dossier, faitsVides(), PNJ, [JET])?.indice_id).toBe(SECOND_INDICE)
		expect(savoirsRevelables(dossier, faitsVides(), PNJ, [JET])).toEqual([INDICE_AVEC_FORMULE])
		expect(savoirsRevelables(dossier, faitsVides(), PNJ)).toEqual([])
	})

	it('un savoir deja confie ou dont une AUTRE porte ferme n est jamais mis en jeu', () => {
		const dossier = avecTroisSavoirs([
			{ jet: JET },
			{ jet: JET, apres_indice_id: AUTRE_INDICE },
			{ jet: { carac: 'FO', tc: 'TC2' } },
		])
		const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } } }
		// 1er deja confie ; 2e : apres_indice ferme (absent) ; 3e : en jeu.
		expect(savoirSousEpreuve(dossier, faits, PNJ)?.indice_id).toBe(TROISIEME_INDICE)
	})

	it('rend undefined quand aucun savoir n est sous epreuve : personnage inconnu, aucun jet pose, jet deja gagne', () => {
		const dossier = avecTroisSavoirs([undefined, { confiance_min: 3 }, { jet: JET }])
		// Le 3e est sous epreuve... mais pas pour un personnage qui n'existe pas.
		expect(savoirSousEpreuve(dossier, faitsVides(), 'pnj.fantome')).toBeUndefined()
		// Aucun jet pose nulle part.
		const sansJet = avecTroisSavoirs([undefined, { confiance_min: 3 }, { confiance_min: 0 }])
		expect(savoirSousEpreuve(sansJet, faitsVides(), PNJ)).toBeUndefined()
		// Le seul jet pose est DEJA gagne : plus rien n'est en jeu.
		const dejaGagne = avecTroisSavoirs([undefined, undefined, { jet: JET }])
		expect(savoirSousEpreuve(dejaGagne, faitsVides(), PNJ)?.indice_id).toBe(TROISIEME_INDICE)
		expect(savoirSousEpreuve(dejaGagne, faitsVides(), PNJ, [JET])).toBeUndefined()
	})

	it('DEUX savoirs au meme (carac, tc) : UNE SEULE reussite ouvre les deux portes — l identite est le couple, pas le savoir', () => {
		const dossier = avecTroisSavoirs([{ jet: JET }, { jet: JET }, { jet: { carac: 'FO', tc: 'TC2' } }])
		expect(savoirsRevelables(dossier, faitsVides(), PNJ)).toEqual([])
		expect(savoirsRevelables(dossier, faitsVides(), PNJ, [JET])).toEqual([INDICE_AVEC_FORMULE, SECOND_INDICE])
		// Le troisieme, d'un AUTRE couple, reste sous epreuve.
		expect(savoirSousEpreuve(dossier, faitsVides(), PNJ, [JET])?.indice_id).toBe(TROISIEME_INDICE)
	})

	it('savoirsDejaConfies ne depend pas des epreuves : a_dit se teste avant toute porte', () => {
		const dossier = avecTroisSavoirs([{ jet: JET }, undefined, undefined])
		const faits: FaitsDeSession = { ...faitsVides(), pnj: { [PNJ]: { a_dit: [INDICE_AVEC_FORMULE] } } }
		expect(savoirsDejaConfies(dossier, faits, PNJ)).toEqual([INDICE_AVEC_FORMULE])
		expect(savoirsRevelables(dossier, faits, PNJ, [JET])).toEqual([])
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
