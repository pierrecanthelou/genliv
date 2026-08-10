import { construireAmorce } from './amorce'
import { SECTIONS, type SectionId } from './sections'
import type { Dossier } from './types'

/**
 * LE REGISTRE DES DIX SECTIONS — sa forme (dix entrées, l'ordre du schéma) et,
 * surtout, la VALEUR EXACTE de chaque compteur. Une assertion d'existence
 * (« la section a un compteur ») n'est jamais une assertion de valeur (KR-174) :
 * c'est le texte rendu que la nav affiche, donc c'est lui qui est épinglé, mot
 * pour mot, sur deux dossiers — un neuf et un peuplé.
 */

const MAINTENANT = '2026-08-09T10:00:00.000Z'

/** Le dossier que `DossierService.create()` sème — le cas NORMAL de l'écran. */
function dossierNeuf(): Dossier {
	return construireAmorce('dossier-neuf', 'Dossier neuf', MAINTENANT)
}

/**
 * Un dossier PEUPLÉ, aux cardinalités toutes différentes (1, 2, 3) : c'est ce
 * qui distingue un compteur juste d'un compteur qui lirait la mauvaise
 * collection — dix fois « 0 fiche » ne prouve rien.
 *
 * Identifiants bien formés (espaces de noms de `identifiers.ts`) par hygiène ;
 * `compte()` ne valide rien, son entrée vient de `DossierService.get()`, qui
 * re-valide déjà.
 */
function dossierPeuple(): Dossier {
	const base = construireAmorce('dossier-peuple', 'Dossier peuplé', MAINTENANT)
	return {
		...base,
		monde: {
			personnages: [
				{ id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [] },
				{ id: 'pnj.mira', portee: 'second', plan_actions: [], savoirs: [] },
			],
			lieux: [{ id: 'lieu.amorce' }, { id: 'lieu.val-cendre' }, { id: 'lieu.gouffre-scelle' }],
			objets: [{ id: 'objet.clef-de-basalte' }],
			indices: [{ id: 'indice.sceau-brise' }, { id: 'indice.rumeur-du-port' }],
			quetes: [{ id: 'quete.retrouver-le-sceau', recompense: [] }],
			evenements: [
				{ id: 'evenement.embuscade', resolutions: [] },
				{ id: 'evenement.tempete', resolutions: [] },
				{ id: 'evenement.marche-de-nuit', resolutions: [] },
			],
			conditions: { climat: [{ id: 'climat.tempete', effets_regles: [] }] },
		},
		charpente: {
			depart: base.charpente.depart,
			jalons: [
				{
					id: 'jalon.premiere-nuit',
					enonce_texte: 'La première nuit est passée.',
					declencheur_texte: 'Le joueur dort à Val-Cendre.',
					effet: [],
				},
				{
					id: 'jalon.sceau-brise',
					enonce_texte: 'Le sceau est brisé.',
					declencheur_texte: 'Le joueur brise le sceau.',
					effet: [],
				},
			],
			fins: [{ id: 'fin.gardien-vaincu', condition_texte: 'Le héros a vaincu le Gardien.' }],
		},
	}
}

/** La table du § 3 du plan, recopiée ICI et confrontée au registre. */
const TABLE_ATTENDUE: Array<{ num: number; id: SectionId; titre: string; cle: string }> = [
	{ num: 1, id: 'canon', titre: 'Canon', cle: 'canon' },
	{ num: 2, id: 'depart', titre: 'Départ', cle: 'charpente.depart' },
	{ num: 3, id: 'personnages', titre: 'Personnages', cle: 'monde.personnages' },
	{ num: 4, id: 'lieux', titre: 'Lieux', cle: 'monde.lieux' },
	{ num: 5, id: 'objets', titre: 'Objets', cle: 'monde.objets' },
	{ num: 6, id: 'indices', titre: 'Indices', cle: 'monde.indices' },
	{ num: 7, id: 'quetes', titre: 'Quêtes', cle: 'monde.quetes' },
	{ num: 8, id: 'evenements', titre: 'Événements', cle: 'monde.evenements' },
	{ num: 9, id: 'conditions', titre: 'Conditions', cle: 'monde.conditions' },
	{ num: 10, id: 'jalons-fins', titre: 'Jalons & fins', cle: 'charpente.jalons · charpente.fins' },
]

describe('SECTIONS, dix entrees dans l ordre du schema', () => {
	it('porte exactement dix descripteurs', () => {
		expect(SECTIONS).toHaveLength(10)
	})

	it('numerote de 1 a 10, strictement croissant', () => {
		expect(SECTIONS.map((section) => section.num)).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10])
	})

	it('porte dix identifiants distincts', () => {
		expect(new Set(SECTIONS.map((section) => section.id)).size).toBe(10)
	})

	it('rend num, id, titre et cle conformes a la table du contrat de design', () => {
		expect(SECTIONS.map(({ num, id, titre, cle }) => ({ num, id, titre, cle }))).toEqual(TABLE_ATTENDUE)
	})
})

describe('SECTIONS, compte() sur un dossier neuf', () => {
	it('rend les dix compteurs exacts, dans l ordre', () => {
		const dossier = dossierNeuf()

		expect(SECTIONS.map((section) => section.compte(dossier))).toEqual([
			'—',
			'—',
			'0 fiche',
			// Un dossier neuf n'a PAS zéro lieu : `construireAmorce` sème `lieu.amorce`
			// pour que `charpente.depart.lieu_id` résolve (KR-178).
			'1 fiche',
			'0 fiche',
			'0 fiche',
			'0 fiche',
			'0 fiche',
			'0 fiche',
			'0 jalon · 0 fin',
		])
	})
})

describe('SECTIONS, compte() sur un dossier peuple', () => {
	it('rend les dix compteurs exacts, dans l ordre', () => {
		const dossier = dossierPeuple()

		expect(SECTIONS.map((section) => section.compte(dossier))).toEqual([
			'—',
			'—',
			'2 fiches',
			'3 fiches',
			'1 fiche',
			'2 fiches',
			'1 fiche',
			'3 fiches',
			'1 fiche',
			'2 jalons · 1 fin',
		])
	})

	it('accorde le singulier a un seul element et a zero', () => {
		const base = dossierNeuf()
		const unSeul: Dossier = { ...base, monde: { ...base.monde, objets: [{ id: 'objet.clef-de-basalte' }] } }
		const deux: Dossier = {
			...base,
			monde: { ...base.monde, objets: [{ id: 'objet.clef-de-basalte' }, { id: 'objet.lanterne' }] },
		}
		const objets = SECTIONS[4]

		expect(objets.id).toBe('objets')
		expect(objets.compte(base)).toBe('0 fiche')
		expect(objets.compte(unSeul)).toBe('1 fiche')
		expect(objets.compte(deux)).toBe('2 fiches')
	})

	it('accorde jalons et fins separement, sans jamais les totaliser', () => {
		const base = dossierNeuf()
		const dossier: Dossier = {
			...base,
			charpente: {
				...base.charpente,
				jalons: [
					{ id: 'jalon.premiere-nuit', enonce_texte: 'Fait.', declencheur_texte: 'Cause.', effet: [] },
					{ id: 'jalon.sceau-brise', enonce_texte: 'Fait.', declencheur_texte: 'Cause.', effet: [] },
				],
				fins: [{ id: 'fin.gardien-vaincu', condition_texte: 'Le Gardien est vaincu.' }],
			},
		}
		const jalonsEtFins = SECTIONS[9]

		expect(jalonsEtFins.id).toBe('jalons-fins')
		// Ni « 3 fiches », ni un total : deux comptes, deux unités, un seul texte.
		expect(jalonsEtFins.compte(dossier)).toBe('2 jalons · 1 fin')
	})
})

describe('SECTIONS, Canon et Depart ne sont pas des collections', () => {
	it('rendent le tiret constant, sur un dossier neuf comme sur un dossier peuple', () => {
		const canon = SECTIONS[0]
		const depart = SECTIONS[1]

		for (const dossier of [dossierNeuf(), dossierPeuple()]) {
			expect(canon.compte(dossier)).toBe('—')
			expect(depart.compte(dossier)).toBe('—')
		}
	})

	it('ne rendent jamais un chiffre ni le mot configure', () => {
		const dossier = dossierPeuple()

		for (const section of [SECTIONS[0], SECTIONS[1]]) {
			// Assertion DISCRIMINANTE : la branche « configuré » a été retirée (désaccord 4),
			// et un compteur numérique ici voudrait dire que la section a été confondue
			// avec une collection.
			expect(section.compte(dossier)).not.toMatch(/\d/)
			expect(section.compte(dossier)).not.toContain('configuré')
		}
	})
})
