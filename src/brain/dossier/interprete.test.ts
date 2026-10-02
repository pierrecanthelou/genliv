import { MARQUEUR_A_ECRIRE } from './amorce'
import { executerCommande } from './commandes'
import { apresInterpretation, resoudreInterpretation, type RefusInterprete } from './interprete'
import type { EtatSession } from './session'
import type { Dossier } from './types'
import type { InterpretationRendue, SortieInterprete, TablesInterprete } from '../copilote/types'

/**
 * DOSSIER DE TEST — trois lieux DÉCRITS reliés en cycle, UN lieu SANS
 * description accessible depuis `lieu.place` (le trou nommé KR-267 : présent
 * dans `destinationsPossibles`, mais jamais rangé). `canon.ton` écrit par
 * défaut ; `tonMarque()` en donne une variante non rédigée pour les tests de
 * dégradation.
 */
function dossierTest(): Dossier {
	return {
		schema: 1,
		id: 'dossier-test-interprete',
		titre: 'Dossier de test',
		createdAt: '2026-09-25T00:00:00.000Z',
		updatedAt: '2026-09-25T00:00:00.000Z',
		canon: {
			mj: { synopsis_mj: 'La vérité de cette histoire.' },
			partage: { accroche_joueur: 'Une accroche.' },
			ton: 'Sombre et feutré, phrases courtes.',
			interdits_ton: [],
			objectifs: [],
		},
		monde: {
			personnages: [],
			lieux: [
				{
					id: 'lieu.place',
					description: 'Une place pavée, au centre du village.',
					acces: ['lieu.marche', 'lieu.tour', 'lieu.sans-description'],
				},
				{ id: 'lieu.marche', description: 'Un marché bruyant, sous des toiles rapiécées.', acces: ['lieu.place'] },
				{ id: 'lieu.tour', description: 'Une tour de guet à moitié écroulée.', acces: ['lieu.place'] },
				{ id: 'lieu.sans-description', nom: 'Un lieu sans description' },
			],
			objets: [],
			indices: [],
			quetes: [],
			evenements: [],
		},
		charpente: {
			depart: { lieu_id: 'lieu.place', texte_ouverture_joueur: 'Tu ouvres les yeux sur la place.' },
			jalons: [],
			fins: [],
		},
	} as unknown as Dossier
}

function tonMarque(dossier: Dossier): Dossier {
	return { ...dossier, canon: { ...dossier.canon, ton: `${MARQUEUR_A_ECRIRE} à écrire` } }
}

function sessionTest(overrides: Partial<EtatSession> = {}): EtatSession {
	return {
		schema: 1,
		dossier_id: 'dossier-test-interprete',
		dossier_maj: '2026-09-25T00:00:00.000Z',
		graine_alea: 1,
		horloge: { tour: 0 },
		monde: {
			lieu_courant: 'lieu.place',
			lieux_visites: ['lieu.place'],
			objets_possedes: [],
			indices_connus: [],
			jalons_atteints: [],
			evenements_consommes: [],
			pnj: {},
		},
		journal: [],
		memoire: null,
		...overrides,
	}
}

const TABLES: TablesInterprete = {
	lieux: new Map([
		['P1', 'lieu.marche'],
		['P2', 'lieu.tour'],
	]),
	personnages: new Map(),
	gestes: new Map([['G1', 'aller']]),
}

/** TABLE AVEC CANDIDATS PNJ (n° 12 `moteur-acteurs`, it1) — `G2` → `parler`,
 *  `I1` → un PNJ réel. Compteur et préfixe SÉPARÉS des lieux (désaccord #4 du
 *  raffinage). */
const TABLES_AVEC_PARLER: TablesInterprete = {
	lieux: new Map([['P1', 'lieu.marche']]),
	personnages: new Map([['I1', 'pnj.harek-le-forgeron']]),
	gestes: new Map([
		['G1', 'aller'],
		['G2', 'parler'],
	]),
}

describe('resoudreInterpretation — re-resolution pure', () => {
	it('aller reconnu : {geste, designe} rend {lecture:commande, commande:{commande,cibles}} sur un rang connu', () => {
		const rendu: InterpretationRendue = { geste: 'G1', designe: ['P1'] }

		expect(resoudreInterpretation(TABLES, rendu)).toEqual({
			lecture: 'commande',
			commande: { commande: 'aller', cibles: ['lieu.marche'] },
		})
	})

	it('precision rend {lecture:clarification, question}', () => {
		const rendu: InterpretationRendue = { precision: 'Lequel des deux voulez-vous rejoindre ?' }

		expect(resoudreInterpretation(TABLES, rendu)).toEqual({
			lecture: 'clarification',
			question: 'Lequel des deux voulez-vous rejoindre ?',
		})
	})

	it('sans_commande rend les SEULS gestes que CETTE table portait, jamais le registre complet', () => {
		const rendu: InterpretationRendue = { sans_commande: true }

		expect(resoudreInterpretation(TABLES, rendu)).toEqual({ lecture: 'sans_commande', gestes_possibles: ['aller'] })

		// Discriminant : une table de gestes VIDE rend une liste VIDE, jamais le
		// registre `COMMANDES` complet re-dérivé en silence.
		const tablesVides: TablesInterprete = { lieux: new Map(), personnages: new Map(), gestes: new Map() }
		expect(resoudreInterpretation(tablesVides, rendu)).toEqual({ lecture: 'sans_commande', gestes_possibles: [] })
	})

	/**
	 * RÉSOLUTION PAR POSITION (n° 12 `moteur-acteurs`, it1) — `resoudreInterpretation`
	 * applique LA MÊME RÈGLE que `validerInterprete` (prédicat 5) : `refKinds[i]`
	 * décide de QUELLE table résout `designe[i]`, jamais `tables.lieux` par défaut.
	 */
	it('parler reconnu : designe un PNJ par sa table dediee, pas celle des lieux', () => {
		const rendu: InterpretationRendue = { geste: 'G2', designe: ['I1'] }

		expect(resoudreInterpretation(TABLES_AVEC_PARLER, rendu)).toEqual({
			lecture: 'commande',
			commande: { commande: 'parler', cibles: ['pnj.harek-le-forgeron'] },
		})
	})

	it('RefusInterprete — geste absent de la table (defensif, KR-175)', () => {
		const rendu: InterpretationRendue = { geste: 'G9', designe: ['P1'] }
		const refus: SortieInterprete | RefusInterprete = resoudreInterpretation(TABLES, rendu)

		expect(refus).toEqual({ type: 'refus_resolution' })
	})

	it('RefusInterprete — un rang de designe absent de la table (defensif, KR-175)', () => {
		const rendu: InterpretationRendue = { geste: 'G1', designe: ['P9'] }
		const refus: SortieInterprete | RefusInterprete = resoudreInterpretation(TABLES, rendu)

		expect(refus).toEqual({ type: 'refus_resolution' })
	})

	it('aucune conversion numerique nulle part : les rangs sont des Map.get, jamais un index', () => {
		// Mutant témoin (BUG-087) : indexer par position plutôt que par `Map.get`
		// résoudrait `P2` au MAUVAIS lieu si l'ordre d'insertion changeait.
		const rendu: InterpretationRendue = { geste: 'G1', designe: ['P2'] }
		expect(resoudreInterpretation(TABLES, rendu)).toEqual({
			lecture: 'commande',
			commande: { commande: 'aller', cibles: ['lieu.tour'] },
		})
	})
})

describe('apresInterpretation — la seule decideuse de la transition', () => {
	const dossier = dossierTest()

	it('lecture:commande, sans attente en cours : MEME session que executerCommande appele directement', () => {
		const session = sessionTest()
		const commande = { commande: 'aller' as const, cibles: ['lieu.marche'] }
		const proposition: SortieInterprete = { lecture: 'commande', commande }

		const parInterpretation = apresInterpretation(dossier, session, proposition, 'va au marche')
		const parExecuterCommande = executerCommande(dossier, session, commande)

		expect(parExecuterCommande.ok).toBe(true)
		expect(parInterpretation.session).toEqual(parExecuterCommande.ok ? parExecuterCommande.session : undefined)
		expect(parInterpretation.avis).toEqual({ type: 'aucun' })
	})

	it('lecture:commande refusee par executerCommande (inatteignable par construction) : refus_moteur, session inchangee', () => {
		const session = sessionTest()
		// Cible hors `destinationsPossibles` — `validerInterprete` l'aurait refusée
		// en amont ; ce test éprouve la défense KR-175 de `apresInterpretation` seule.
		const commande = { commande: 'aller' as const, cibles: ['lieu.introuvable'] }
		const proposition: SortieInterprete = { lecture: 'commande', commande }

		const resultat = apresInterpretation(dossier, session, proposition, 'va ailleurs')

		expect(resultat).toEqual({ session, avis: { type: 'refus_moteur' } })
	})

	it('lecture:sans_commande : avis derive, session inchangee (MEME reference)', () => {
		const session = sessionTest()
		const proposition: SortieInterprete = { lecture: 'sans_commande', gestes_possibles: ['aller'] }

		const resultat = apresInterpretation(dossier, session, proposition, 'danse')

		expect(resultat.session).toBe(session)
		expect(resultat.avis).toEqual({ type: 'non_reconnu', gestes_possibles: ['aller'] })
	})

	it('lecture:clarification, aucune attente en cours, ton ecrit : POSE une attente', () => {
		const session = sessionTest()
		const proposition: SortieInterprete = { lecture: 'clarification', question: 'Lequel des deux ?' }

		const resultat = apresInterpretation(dossier, session, proposition, 'va au')

		expect(resultat.session.attente).toEqual({ type: 'clarification', question: 'Lequel des deux ?', saisie: 'va au' })
		expect(resultat.avis).toEqual({ type: 'clarification', question: 'Lequel des deux ?' })
	})

	it('lecture:clarification, ton NON ecrit : degradation silencieuse en reformuler (§8 desaccord 22)', () => {
		const session = sessionTest()
		const proposition: SortieInterprete = { lecture: 'clarification', question: 'Lequel des deux ?' }

		const resultat = apresInterpretation(tonMarque(dossier), session, proposition, 'va au')

		expect(resultat.session.attente).toBeUndefined()
		expect(resultat.avis).toEqual({ type: 'reformuler' })
	})

	it('anti-boucle KR-264 : une attente deja pendante + une nouvelle reponse quelconque -> reformuler, attente retiree', () => {
		const session = sessionTest({
			attente: { type: 'clarification', question: 'Une question posee au tour precedent ?', saisie: 'va au' },
		})
		const proposition: SortieInterprete = { lecture: 'clarification', question: 'Une SECONDE question, jamais posee ?' }

		const resultat = apresInterpretation(dossier, session, proposition, 'le grand')

		expect(resultat).toEqual({ session: sessionTest(), avis: { type: 'reformuler' } })
	})

	it('anti-boucle : une commande ACCEPTEE alors qu une attente etait pendante la CLOT quand meme', () => {
		// Ligne neuve de la Table C (tour2 narratif-ia) : sans elle, une commande
		// acceptée alors qu'une attente était pendante laisserait une question
		// perimee ré-injectee au tour suivant.
		const session = sessionTest({
			attente: { type: 'clarification', question: 'Le grand marche ?', saisie: 'va au marche' },
		})
		const commande = { commande: 'aller' as const, cibles: ['lieu.marche'] }
		const proposition: SortieInterprete = { lecture: 'commande', commande }

		const resultat = apresInterpretation(dossier, session, proposition, 'le grand')

		expect(resultat.session.attente).toBeUndefined()
		expect(resultat.avis).toEqual({ type: 'aucun' })
	})

	it('le journal ne stocke jamais la saisie brute (KR-248 etendu, preparation n11)', () => {
		const session = sessionTest()
		const commande = { commande: 'aller' as const, cibles: ['lieu.marche'] }
		const proposition: SortieInterprete = { lecture: 'commande', commande }
		const saisieBrute = 'JE-VEUX-ALLER-AU-MARCHE-UNIQUEMENT'

		const resultat = apresInterpretation(dossier, session, proposition, saisieBrute)

		expect(JSON.stringify(resultat.session.journal)).not.toContain(saisieBrute)
	})
})
