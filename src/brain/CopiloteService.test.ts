import fs from 'node:fs'
import path from 'node:path'
import { createBrain } from './BrainContext'
import type { CloudSettingsService } from './CloudSettingsService'
import {
	createCopiloteService,
	type CibleCopilote,
	type CibleDistribution,
	type CibleIndice,
	type CiblePlan,
	type CibleRelations,
	type CibleRepliques,
} from './CopiloteService'
import {
	assemblerActeur,
	assemblerArbitre,
	assemblerDetenteurs,
	assemblerDistribution,
	assemblerNarrateur,
	assemblerRelations,
	BUDGET_CARACTERES_ACTEUR,
	BUDGET_CARACTERES_ARBITRE,
	BUDGET_CARACTERES_NARRATEUR,
} from './copilote/contexte'
import { GABARIT_SORTIE } from './copilote/schemaSortie'
import type { CibleActeur, CibleArbitre, CibleNarrateur } from './copilote/types'
import { MARQUEUR_A_ECRIRE } from './dossier/amorce'
import { analyserSaisie, executerCommande } from './dossier/commandes'
import { consignerNarration } from './dossier/recit'
import { ouvrirSession, type EtatSession } from './dossier/session'
import { INTENSITE_INITIALE, PORTEE_INITIALE, type Dossier } from './dossier/types'
import type { PersistenceService } from './PersistenceService'

const ROLE = 'personnage-prose'
const URL_WORKER = 'https://genliv.example.workers.dev'
const CLE = 'une-cle-de-synchronisation'

function dossierDeReference(): Dossier {
	const chemin = path.join(__dirname, 'dossier', '__fixtures__', 'dossier-reference.json')
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

function cibleDeReference(dossier: Dossier): CibleCopilote {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.fonction !== undefined)
	if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')
	return { role: ROLE, entiteId: personnage.id, champ: 'monde.personnages[].apparence' }
}

function reglages(url: string | null = URL_WORKER, cle: string | null = CLE): CloudSettingsService {
	return {
		getWorkerUrl: () => url,
		setWorkerUrl: () => undefined,
		getSyncKey: () => cle,
		setSyncKey: () => undefined,
		isConfigured: () => url !== null && cle !== null,
	}
}

/** Réponse du worker — seuls `ok`, `status` et `json()` sont lus par le service.
 *  Même patron de bouchon que `CloudflareKVTransport.test.ts`. */
function reponseWorker(corps: unknown, status = 200): Response {
	return {
		ok: status >= 200 && status < 300,
		status,
		json: async () => corps,
	} as unknown as Response
}

/** UNE sortie conforme. La prose ne porte ni identifiant, ni marqueur, ni chiffre. */
const PROSE_CONFORME = 'Un homme sec au manteau trop large, une lanterne toujours allumee a la ceinture.'
function sortieConforme(prose = PROSE_CONFORME): Record<string, unknown> {
	return { valeur: prose }
}

let fetchMock: jest.Mock
let fetchAvant: typeof globalThis.fetch

beforeEach(() => {
	fetchMock = jest.fn()
	fetchAvant = globalThis.fetch
	globalThis.fetch = fetchMock as unknown as typeof fetch
})

afterEach(() => {
	globalThis.fetch = fetchAvant
})

describe('CopiloteService — disponibilite', () => {
	it('estDisponible ne sonde jamais le reseau', () => {
		expect(createCopiloteService(reglages()).estDisponible()).toBe(true)
		expect(createCopiloteService(reglages(null, CLE)).estDisponible()).toBe(false)
		expect(createCopiloteService(reglages(URL_WORKER, null)).estDisponible()).toBe(false)
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('une configuration incomplete rend indisponible non-configure, sans aucun appel', async () => {
		const dossier = dossierDeReference()

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, cibleDeReference(dossier))

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — un appel sur reponse conforme', () => {
	it('un seul appel, et la proposition est RE-RESOLUE cote client', async () => {
		const dossier = dossierDeReference()
		const cible = cibleDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			// `entiteId` et `champ` viennent de l'ÉTAT D'ÉCRAN, jamais de la réponse :
			// une sortie conforme au schéma pourrait nommer le MAUVAIS champ, et rien
			// n'arbitrerait (KR-231).
			proposition: { entiteId: cible.entiteId, champ: cible.champ, texte: PROSE_CONFORME },
		})
	})

	it('l identifiant de l entite ne franchit JAMAIS le reseau', async () => {
		const dossier = dossierDeReference()
		const cible = cibleDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieConforme()))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE}`)
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(CLE)
		const corps = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(corps).sort()).toEqual(['champ', 'contexte', 'role'])
		expect(String(init.body)).not.toContain(cible.entiteId)
		// Le nom de la fiche ne sort pas non plus : `Entite.nom` est de destination
		// `auteur`, il n'est pas dans les douze chemins injectés.
		const nomme = dossier.monde.personnages.find((candidat) => candidat.id === cible.entiteId)
		expect(String(init.body)).not.toContain(String(nomme?.nom))
	})
})

describe('CopiloteService — le rejeu, exactement une fois', () => {
	it('une premiere reponse non conforme est rejouee une fois, et la seconde passe', async () => {
		// PROPRIÉTÉ 1 sur 2 (KR-230) : le rejeu a bien lieu. Le MUTANT « 0 rejeu »
		// fait rougir CE test — un seul appel, et `illisible` au lieu de `propose`.
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ texte: 'une clé renommée' }))
			.mockResolvedValueOnce(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse.statut).toBe('propose')
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// PROPRIÉTÉ 2 sur 2 : l'arrêt. Le TROISIÈME bouchon est CONFORME — c'est lui
		// le pouvoir séparateur : un rejeu illimité l'atteindrait et rendrait
		// `propose`, donc le MUTANT « rejeu illimité » fait rougir CE test.
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ valeur: '   ' }))
			.mockResolvedValueOnce(reponseWorker({ valeur: 42 }))
			.mockResolvedValueOnce(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
	})

	it('le motif rendu est celui du SECOND echec, jamais du premier', async () => {
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ texte: 'une clé renommée' }))
			.mockResolvedValueOnce(reponseWorker({ valeur: `${MARQUEUR_A_ECRIRE} à rédiger` }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

		expect(reponse).toEqual({ statut: 'illisible', motif: 'marqueur' })
	})

	it('un corps 200 illisible est une violation de FORME, donc rejouee', async () => {
		const dossier = dossierDeReference()
		const illisible = { ok: true, status: 200, json: async () => JSON.parse('pas du json') } as unknown as Response
		fetchMock.mockResolvedValueOnce(illisible).mockResolvedValueOnce(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse.statut).toBe('propose')
	})

	it('sur etat terminal : DossierService.update reste muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		const reponse = await brain.copilote.demander(dossier, cibleDeReference(dossier))

		expect(reponse.statut).toBe('illisible')
		expect(espions.update).not.toHaveBeenCalled()
	})

	it('sur etat terminal : PersistenceService.set reste muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		await brain.copilote.demander(dossier, cibleDeReference(dossier))

		expect(espions.set).not.toHaveBeenCalled()
	})

	it('sur etat terminal : le bus est muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		await brain.copilote.demander(dossier, cibleDeReference(dossier))

		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — aucun rejeu sur indisponibilite', () => {
	it('5xx, 413 et 503 rendent indisponible en UN SEUL appel', async () => {
		// Sans mémoire, le second corps serait IDENTIQUE, donc la garde rendrait
		// identiquement la même erreur : rejouer un déterminisme est une perte sèche.
		const dossier = dossierDeReference()
		const attendus: Array<[number, string]> = [
			[500, 'injoignable'],
			[502, 'injoignable'],
			[413, 'injoignable'],
			[503, 'non-configure'],
		]

		for (const [status, raison] of attendus) {
			fetchMock.mockClear()
			fetchMock.mockResolvedValue(reponseWorker({ erreur: 'peu importe' }, status))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

			expect(`${status} → ${JSON.stringify(reponse)}`).toBe(
				`${status} → ${JSON.stringify({ statut: 'indisponible', raison })}`,
			)
			expect(`${status} → ${fetchMock.mock.calls.length}`).toBe(`${status} → 1`)
		}
	})

	it('une panne reseau rend indisponible injoignable, en un seul appel', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockRejectedValue(new Error('réseau coupé'))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier))

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'injoignable' })
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('un abandon par le signal de l appelant rend indisponible annule', async () => {
		const dossier = dossierDeReference()
		const appelant = new AbortController()
		fetchMock.mockImplementation(
			(_url: string, init: RequestInit) =>
				new Promise((_resolve, rejeter) => {
					init.signal?.addEventListener('abort', () => rejeter(new Error('abandonné')))
				}),
		)

		const enVol = createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier), appelant.signal)
		appelant.abort()

		await expect(enVol).resolves.toEqual({ statut: 'indisponible', raison: 'annule' })
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('un signal deja abandonne ne part meme pas sur le reseau', async () => {
		const dossier = dossierDeReference()
		const appelant = new AbortController()
		appelant.abort()

		const reponse = await createCopiloteService(reglages()).demander(
			dossier,
			cibleDeReference(dossier),
			appelant.signal,
		)

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'annule' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('un abandon ne laisse ni minuteur ni ecouteur derriere lui', async () => {
		// Timer safety (`docs/WORKFLOW.md`) : l'écouteur `abort` est RETIRÉ et le
		// minuteur annulé dans le `finally`. Sans cela, un abandon suivi d'un second
		// lancer verrait le premier écouteur abandonner le second appel.
		const dossier = dossierDeReference()
		const appelant = new AbortController()
		const retires: unknown[] = []
		const retirerVrai = appelant.signal.removeEventListener.bind(appelant.signal)
		appelant.signal.removeEventListener = ((type: string, ecouteur: EventListener) => {
			retires.push(type)
			retirerVrai(type, ecouteur)
		}) as typeof appelant.signal.removeEventListener
		fetchMock.mockResolvedValue(reponseWorker(sortieConforme()))

		await createCopiloteService(reglages()).demander(dossier, cibleDeReference(dossier), appelant.signal)

		expect(retires).toEqual(['abort'])
	})
})

describe('CopiloteService — aucune memoire', () => {
	it('deux demandes independantes produisent des corps STRICTEMENT egaux', async () => {
		// FIXTURES DISJOINTES de celles du rejeu, et c'est obligatoire : réutiliser le
		// bouchon du rejeu ferait rejouer le premier test, et ce test-ci ne mesurerait
		// plus rien.
		const dossier = dossierDeReference()
		const cible: CibleCopilote = {
			role: ROLE,
			entiteId: dossier.monde.personnages[0].id,
			champ: 'monde.personnages[].fonction',
		}
		fetchMock.mockResolvedValue(reponseWorker({ valeur: 'Gardienne du signal, seule a entretenir le mecanisme.' }))

		const service = createCopiloteService(reglages())
		await service.demander(dossier, cible)
		await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// Ni date, ni identifiant, ni nonce : c'est ce qui rend l'égalité STRICTE
		// démontrable, et non une comparaison « aux champs près ».
		expect(premier).not.toContain(cible.entiteId)
	})
})

describe('CopiloteService — le refus de contexte, avant tout appel', () => {
	it('un canon.ton marque refuse en nommant le chemin, sans aucun fetch', async () => {
		const reference = dossierDeReference()
		const dossier: Dossier = {
			...reference,
			canon: { ...reference.canon, ton: `${MARQUEUR_A_ECRIRE} Le registre de langue de cette aventure.` },
		}

		const reponse = await createCopiloteService(reglages()).demander(dossier, cibleDeReference(reference))

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('le refus de contexte passe AVANT la disponibilite : il nomme ce qui manque', async () => {
		// L'ordre inverse ferait dire « indisponible » à un dossier dont il manque
		// seulement le ton — un diagnostic faux, et le premier que l'auteur verra.
		const reference = dossierDeReference()
		const dossier: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, cibleDeReference(reference))

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

// ══ LE SECOND RÔLE — `indice-detenteurs` ═════════════════════════════════════

const ROLE_DETENTEURS = 'indice-detenteurs'

/** UNE cible qui RÉSOUT : l'un des indices de la fixture porte une vérité écrite,
 *  donc le chemin passant y est instanciable sans toucher au fichier. L'unique
 *  indice SIGNALÉ par le linter, lui, n'en a pas — c'est l'écran nominal de la
 *  fixture, le refus `cible-a-ecrire`, et il a son test dans `contexte.test.ts`. */
function cibleIndiceDeReference(dossier: Dossier): CibleIndice {
	const indice = dossier.monde.indices.find((candidat) => (candidat.verite ?? '').trim() !== '')
	if (indice === undefined) throw new Error('la fixture ne porte aucun indice à vérité écrite')
	return { role: ROLE_DETENTEURS, indiceId: indice.id }
}

/** Les rangs que l'assembleur rend pour cette cible — LUS DE LUI, jamais
 *  re-dérivés (KR-231) : c'est la table que le service doit re-résoudre. */
function rangsDeReference(dossier: Dossier, cible: CibleIndice): ReadonlyMap<string, string> {
	const contexte = assemblerDetenteurs(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le test attend un assemblage`)
	return contexte.rangs
}

function sortieDetenteurs(rangs: readonly string[]): Record<string, unknown> {
	return { detenteurs: rangs }
}

describe('CopiloteService — le second role, un appel sur reponse conforme', () => {
	it('un seul appel, et les rangs sont RE-RESOLUS cote client', async () => {
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		const rangs = rangsDeReference(dossier, cible)
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs(['P1'])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { indiceId: cible.indiceId, personnageIds: [rangs.get('P1')] },
		})
		// Discriminant : `P1` désigne un personnage RÉEL — sans lui, l'égalité
		// ci-dessus serait vraie même sur une table de rangs vide.
		expect(dossier.monde.personnages.map((personnage) => personnage.id)).toContain(rangs.get('P1'))
	})

	it('une liste vide est un SUCCES, pas un echec', async () => {
		// CRITÈRE 3 : le prédicat de non-vacuité de l'it1 NE SE TRANSPORTE PAS. Sur une
		// LISTE, le vide EST une réponse — et punir la réponse honnête est une machine
		// à complaisance.
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs([])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({ statut: 'propose', proposition: { indiceId: cible.indiceId, personnageIds: [] } })
	})

	it('ni l identifiant de l indice ni aucun nom ne franchissent le reseau', async () => {
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs([])))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_DETENTEURS}`)
		expect(init.method).toBe('POST')
		const corps = JSON.parse(String(init.body)) as Record<string, unknown>
		// PAS de `champ` : on ne demande pas un champ, on demande QUI.
		expect(Object.keys(corps).sort()).toEqual(['contexte', 'role'])
		expect(String(init.body)).not.toContain(cible.indiceId)
		const noms = [
			...dossier.monde.personnages.map((personnage) => personnage.nom),
			...dossier.monde.indices.map((indice) => indice.nom),
		].filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')
		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => String(init.body).includes(nom))).toEqual([])
	})
})

describe('CopiloteService — le second role, le rejeu exactement une fois', () => {
	it('un rang inconnu rejette le LOT ENTIER, et le rejeu a bien lieu', async () => {
		// CRITÈRE 4, moitié 1 sur 2 (KR-230) : le rejeu a lieu, et le premier lot n'est
		// PAS repêché — ce n'est jamais `['P1']` qui ressort.
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		const rangs = rangsDeReference(dossier, cible)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(sortieDetenteurs(['P1', 'P9'])))
			.mockResolvedValueOnce(reponseWorker(sortieDetenteurs(['P1'])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le résultat vient du SECOND lot, jamais d'un repêchage du premier.
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { indiceId: cible.indiceId, personnageIds: [rangs.get('P1')] },
		})
		// Et `P9` n'appartenait bien pas à la table : sans cette ligne, le premier lot
		// aurait pu être refusé pour une tout autre raison.
		expect([...rangs.keys()]).not.toContain('P9')
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// CRITÈRE 4, moitié 2 sur 2 : l'arrêt. Le TROISIÈME bouchon est CONFORME — c'est
		// lui le pouvoir séparateur : un rejeu illimité l'atteindrait et rendrait
		// `propose`, donc le MUTANT « rejeu illimité » fait rougir CE test.
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(sortieDetenteurs(['P1', 'P1'])))
			.mockResolvedValueOnce(reponseWorker(sortieDetenteurs(['P9'])))
			.mockResolvedValueOnce(reponseWorker(sortieDetenteurs(['P1'])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le motif est celui du SECOND échec — `rang-inconnu` —, jamais du premier
		// (`schema`, le doublon).
		expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
	})

	it('sur etat terminal du second role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs(['P9'])))

		const reponse = await brain.copilote.demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le second role, aucune memoire', () => {
	it('deux lancers, deux corps identiques', async () => {
		const dossier = dossierDeReference()
		const cible = cibleIndiceDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs([])))

		await createCopiloteService(reglages()).demander(dossier, cible)
		await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// Ni date, ni identifiant, ni nonce : c'est ce qui rend l'égalité STRICTE
		// démontrable, et non une comparaison « aux champs près ». Un détenteur REFUSÉ
		// peut donc réapparaître — c'est une propriété, et l'écran le dit.
		expect(premier).not.toContain(cible.indiceId)
	})
})

// ══ LE TROISIÈME RÔLE — `personnage-repliques` ═══════════════════════════════

const ROLE_REPLIQUES = 'personnage-repliques'

/** UNE cible qui RÉSOUT : le personnage porte au moins une ligne d'identité écrite,
 *  donc la disjonction du refus `cible-a-ecrire` est satisfaite. `personnageId`,
 *  JAMAIS `entiteId` (§ 8, TL3a-5). */
function cibleRepliquesDeReference(dossier: Dossier): CibleRepliques {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.fonction !== undefined)
	if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')
	return { role: ROLE_REPLIQUES, personnageId: personnage.id }
}

function sortieRepliques(repliques: readonly string[]): Record<string, unknown> {
	return { repliques }
}

const REPLIQUES_CONFORMES = ['Pose ta bourse, puis pose ta question.', 'Je vends ce que j entends.']

describe('CopiloteService — le troisieme role, un appel sur reponse conforme', () => {
	it('un seul appel, et la proposition est RE-RESOLUE cote client', async () => {
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			// `personnageId` vient de l'ÉTAT D'ÉCRAN, jamais de la réponse (KR-231), et
			// la clé d'écriture se nomme `ajouts` : la feature AJOUTE à `parler[]`, elle
			// n'y substitue rien.
			proposition: { personnageId: cible.personnageId, ajouts: REPLIQUES_CONFORMES },
		})
	})

	it('le corps n a PAS de champ, et l identifiant ne franchit JAMAIS le reseau', async () => {
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_REPLIQUES}`)
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(CLE)
		const corps = JSON.parse(String(init.body)) as Record<string, unknown>
		// PAS de `champ` : LE RÔLE EST LE CHAMP.
		expect(Object.keys(corps).sort()).toEqual(['contexte', 'role'])
		expect(String(init.body)).not.toContain(cible.personnageId)
		// Le nom de la fiche ne sort pas non plus : `Entite.nom` est d'audience `auteur`,
		// il n'est dans aucun des dix chemins injectés (KR-195).
		const nomme = dossier.monde.personnages.find((candidat) => candidat.id === cible.personnageId)
		expect(String(nomme?.nom).trim().length).toBeGreaterThan(0)
		expect(String(init.body)).not.toContain(String(nomme?.nom))
	})

	it('une liste vide est un REFUS, jamais un succes', async () => {
		// L'AMENDEMENT DE L'IT2, vu au niveau du service : rôle de RÉDACTION, donc « je
		// n'écris rien » est une NON-RÉPONSE. Elle est traitée comme toute violation de
		// forme — rejeu unique, puis terminal.
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques([])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})

describe('CopiloteService — le troisieme role, le rejeu exactement une fois', () => {
	it('rejeu une fois : un identifiant en DERNIERE position rejette le LOT, puis la seconde passe', async () => {
		// PROPRIÉTÉ 1 sur 2 (KR-230) : le rejeu a bien lieu, et le premier lot n'est PAS
		// repêché — ce ne sont jamais les deux répliques saines qui ressortent.
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		const porteur = dossier.monde.personnages[0]
		const fautif = [...REPLIQUES_CONFORMES, `Demande donc a ${porteur.id}, il sait tout.`]
		fetchMock
			.mockResolvedValueOnce(reponseWorker(sortieRepliques(fautif)))
			.mockResolvedValueOnce(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le résultat vient du SECOND lot, jamais d'un repêchage du premier.
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { personnageId: cible.personnageId, ajouts: REPLIQUES_CONFORMES },
		})
		// Et l'identifiant du premier lot était bien un identifiant de CE dossier : sans
		// cette ligne, le premier lot aurait pu être refusé pour une tout autre raison.
		expect(fautif[2]).toContain(porteur.id)
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// PROPRIÉTÉ 2 sur 2 : l'arrêt. Le TROISIÈME bouchon est CONFORME — c'est lui le
		// pouvoir séparateur : un rejeu illimité l'atteindrait et rendrait `propose`,
		// donc le MUTANT « rejeu illimité » fait rougir CE test.
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(sortieRepliques([REPLIQUES_CONFORMES[0], REPLIQUES_CONFORMES[0]])))
			.mockResolvedValueOnce(reponseWorker(sortieRepliques([REPLIQUES_CONFORMES[0], '   '])))
			.mockResolvedValueOnce(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le motif est celui du SECOND échec — `vide` —, jamais du premier (`schema`, le
		// doublon).
		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
	})

	it('sur etat terminal du troisieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques([])))

		const reponse = await brain.copilote.demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le troisieme role, les refus de contexte avant tout appel', () => {
	it('les trois refus, discrimines, et AUCUN fetch', async () => {
		// CRITÈRE 2, vu du service : les trois motifs traversent `refuser()` et
		// ressortent en `{statut:'refuse', …}`, le seul `a-ecrire` portant une charge.
		const reference = dossierDeReference()
		const cible = cibleRepliquesDeReference(reference)
		const service = createCopiloteService(reglages())

		// 1 — `a-ecrire`, À CHARGE.
		const sansTon: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }
		const refusTon = await service.demander(sansTon, cible)

		// 2 — `cible-a-ecrire`, SANS charge : un personnage sans une ligne d'identité.
		const muet = { id: 'pnj.sans-identite', portee: 'premier' as const, plan_actions: [], savoirs: [] }
		const avecMuet: Dossier = {
			...reference,
			monde: { ...reference.monde, personnages: [...reference.monde.personnages, muet] },
		}
		const refusCible = await service.demander(avecMuet, { role: ROLE_REPLIQUES, personnageId: muet.id })

		// 3 — `trop-long`, SANS charge non plus : il pointe la fiche, pas un champ.
		const enorme: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: reference.monde.personnages.map((personnage) =>
					personnage.id === cible.personnageId ? { ...personnage, apparence: 'x'.repeat(100_000) } : personnage,
				),
			},
		}
		const refusLong = await service.demander(enorme, cible)

		expect(refusTon).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(refusCible).toEqual({ statut: 'refuse', motif: 'cible-a-ecrire' })
		expect(refusLong).toEqual({ statut: 'refuse', motif: 'trop-long' })
		// LES TROIS SONT DISTINCTS DEUX À DEUX — la moitié que le nom promet (KR-199).
		expect(new Set([refusTon, refusCible, refusLong].map((refus) => JSON.stringify(refus))).size).toBe(3)
		// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des trois.
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('le refus de contexte passe AVANT la disponibilite : il nomme ce qui manque', async () => {
		// L'ordre inverse ferait dire « indisponible » à un dossier dont il manque
		// seulement le ton — un diagnostic faux, et le premier que l'auteur verra.
		const reference = dossierDeReference()
		const dossier: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }

		const reponse = await createCopiloteService(reglages(null, null)).demander(
			dossier,
			cibleRepliquesDeReference(reference),
		)

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le troisieme role, aucune memoire', () => {
	it('deux lancers, deux corps identiques', async () => {
		const dossier = dossierDeReference()
		const cible = cibleRepliquesDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))

		await createCopiloteService(reglages()).demander(dossier, cible)
		await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// Ni date, ni identifiant, ni nonce : c'est ce qui rend l'égalité STRICTE
		// démontrable. ASYMÉTRIE AVEC L'IT2, et elle est délibérée : un détenteur accepté
		// devenait INÉNONÇABLE (il perdait son rang) ; une réplique acceptée N'EST PAS
		// injectée, donc elle PEUT être re-proposée — l'écran le dit à l'auteur.
		expect(premier).not.toContain(cible.personnageId)
	})
})

// ══ LE QUATRIÈME RÔLE — `personnage-plan` ════════════════════════════════════

const ROLE_PLAN = 'personnage-plan'

/** UNE cible qui RÉSOUT : le personnage porte un `but.libelle` écrit, donc le
 *  prédicat nommé du refus `cible-a-ecrire` est satisfait. `acteurId`, JAMAIS
 *  `personnageId` — une cible `{ personnageId }` serait LE MÊME TYPE que
 *  `CibleRepliques` et tomberait dans `demanderRepliques` avec `tsc` vert. */
function ciblePlanDeReference(dossier: Dossier): CiblePlan {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.but?.libelle !== undefined)
	if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à but écrit')
	return { role: ROLE_PLAN, acteurId: personnage.id }
}

/** LA SORTIE CONFORME EST CONSTRUITE DEPUIS LE GABARIT, jamais retapée : la clé de
 *  fil ne s'écrit pas deux fois dans le dépôt (KR-236). */
const CLE_FIL_PLAN = Object.keys(JSON.parse(GABARIT_SORTIE[ROLE_PLAN]) as Record<string, unknown>)[0]
function sortiePlan(intention: unknown): Record<string, unknown> {
	return { [CLE_FIL_PLAN]: intention }
}

const INTENTION_CONFORME = 'Remonter au beffroi avant la nuit et y attendre le passage du guetteur.'

describe('CopiloteService — le quatrieme role, un appel sur reponse conforme', () => {
	it('temoin executable du 4e role : du service a la proposition, en un seul appel', async () => {
		// ⚠ CE TÉMOIN EST ÉCRIT ICI, ET C'EST UNE MESURE, PAS UN CHOIX D'EMPLACEMENT :
		// les témoins exécutables de bout en bout de `worker/frontiere.test.ts` sont
		// TROIS `it` NOMMÉS, pas un `.each` — le quatrième rôle n'en hérite d'AUCUN, et
		// rien n'aurait rougi. Sans cette suite-ci, le rôle neuf partirait avec un témoin
		// de moins que les trois autres.
		// CE QU'IL COUVRE : service → corps sur le fil → validateur → proposition
		// RE-RÉSOLUE, la sortie conforme étant CONSTRUITE depuis `GABARIT_SORTIE`.
		// CE QU'IL NE COUVRE PAS, et c'est écrit plutôt que sous-entendu : la traversée
		// du worker RÉEL (jsdom n'expose ni `Request` ni `Response`). Cette moitié-là est
		// portée pour les QUATRE rôles par le `it.each(ROLES)` de `frontiere.test.ts`
		// (« l'invite réellement composée contient son gabarit ») et par la suite de
		// route de `worker/index.test.ts`.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan(INTENTION_CONFORME)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			// `acteurId` vient de l'ÉTAT D'ÉCRAN, jamais de la réponse (KR-231). Et la
			// clé d'écriture se nomme `action` là où le fil portait `intention` : DEUX
			// MOTS POUR LA MÊME CHAÎNE, délibérément.
			proposition: { acteurId: cible.acteurId, action: INTENTION_CONFORME },
		})
		// La proposition ne porte AUCUN entier : `etape` est posé par le CODE, à
		// l'écriture, sur la liste VIVE — le modèle ne le voit jamais.
		const proposee: Record<string, unknown> = reponse.statut === 'propose' ? { ...reponse.proposition } : {}
		expect(Object.keys(proposee).sort()).toEqual(['acteurId', 'action'])
		expect(Object.values(proposee).filter((valeur) => typeof valeur !== 'string')).toEqual([])
	})

	it('le corps n a PAS de champ, aucun entier, et l identifiant ne franchit JAMAIS le reseau', async () => {
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan(INTENTION_CONFORME)))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_PLAN}`)
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(CLE)
		const corps = JSON.parse(String(init.body)) as Record<string, unknown>
		// PAS de `champ` : LE RÔLE EST LE CHAMP. Et AUCUN entier ne franchit le fil.
		expect(Object.keys(corps).sort()).toEqual(['contexte', 'role'])
		expect(Object.values(corps).filter((valeur) => typeof valeur !== 'string')).toEqual([])
		expect(String(init.body)).not.toContain(cible.acteurId)
		// Le nom de la fiche ne sort pas non plus : `Entite.nom` est d'audience `auteur`,
		// il n'est dans aucun des neuf chemins injectés (KR-195).
		const nomme = dossier.monde.personnages.find((candidat) => candidat.id === cible.acteurId)
		expect(String(nomme?.nom).trim().length).toBeGreaterThan(0)
		expect(String(init.body)).not.toContain(String(nomme?.nom))
	})

	it('le PREFIXE deja ecrit part bien sur le fil, dans l ordre — l amendement, vu du service', async () => {
		// LA CONTREPARTIE DE L'AMENDEMENT, vue à l'endroit où elle se paie : ce rôle est
		// le seul qui envoie au modèle le contenu du champ qu'il écrit. Le test prouve
		// d'abord que la fiche EN PORTE, sinon il ne mesure rien.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		const deja = dossier.monde.personnages
			.find((candidat) => candidat.id === cible.acteurId)
			?.plan_actions.map((etape) => etape.action)
			.filter((action) => action.trim() !== '')
		expect(deja?.length).toBeGreaterThan(0)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan(INTENTION_CONFORME)))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const corps = String((fetchMock.mock.calls[0] as [string, RequestInit])[1].body)
		expect((deja ?? []).filter((action) => !corps.includes(action))).toEqual([])
		// … et les `etape` du document, eux, ne partent PAS : ce sont des entiers.
		expect(corps).not.toContain('etape')
	})

	it('un TABLEAU rendu est refuse, jamais repeche', async () => {
		// LA GARDE DE KR-230, VUE DU SERVICE : deux sorties tableau consécutives ⇒ rejeu
		// unique ⇒ terminal `schema`. À aucun moment `['a','b'][0]` ne devient une
		// proposition — ce qui serait faire ratifier à l'auteur un choix du CODE.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan([INTENTION_CONFORME, 'Une seconde intention.'])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('une chaine vide est un REFUS, jamais un succes', async () => {
		// Rôle de RÉDACTION : « je n'écris rien » est une NON-RÉPONSE, traitée comme
		// toute violation de forme — rejeu unique, puis terminal.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan('   ')))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})

describe('CopiloteService — le quatrieme role, le rejeu exactement une fois', () => {
	it('rejeu une fois : une premiere sortie fautive, puis la seconde passe', async () => {
		// PROPRIÉTÉ 1 sur 2 (KR-230) : le rejeu a bien lieu, et rien du premier essai
		// n'est repêché.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		const porteur = dossier.monde.personnages[0]
		fetchMock
			.mockResolvedValueOnce(reponseWorker(sortiePlan(`Aller voir ${porteur.id} avant la nuit.`)))
			.mockResolvedValueOnce(reponseWorker(sortiePlan(INTENTION_CONFORME)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { acteurId: cible.acteurId, action: INTENTION_CONFORME },
		})
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// PROPRIÉTÉ 2 sur 2 (KR-230), prouvée SÉPARÉMENT de la première.
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan(MARQUEUR_A_ECRIRE)))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'marqueur' })
	})

	it('le motif rendu est celui du SECOND echec, jamais du premier', async () => {
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ intention: 42 }))
			.mockResolvedValueOnce(reponseWorker(sortiePlan('')))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
	})

	it('sur etat terminal du quatrieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan([])))

		const reponse = await brain.copilote.demander(dossier, ciblePlanDeReference(dossier))

		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le quatrieme role, les refus de contexte avant tout appel', () => {
	it('les trois refus, discrimines, et AUCUN fetch', async () => {
		const reference = dossierDeReference()
		const cible = ciblePlanDeReference(reference)
		const service = createCopiloteService(reglages())

		// 1 — `a-ecrire`, À CHARGE.
		const sansTon: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }
		const refusTon = await service.demander(sansTon, cible)

		// 2 — `cible-a-ecrire`, SANS charge : le PRÉDICAT NOMMÉ sur UN chemin. Le
		// personnage ci-dessous est richement rédigé PAR AILLEURS — il lui manque
		// seulement le but, et c'est ce seul manque qui refuse.
		const sansBut: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: reference.monde.personnages.map((personnage) =>
					personnage.id === cible.acteurId ? { ...personnage, but: undefined } : personnage,
				),
			},
		}
		const refusCible = await service.demander(sansBut, cible)

		// 3 — `trop-long`, SANS charge non plus : il pointe la fiche, pas un champ.
		const enorme: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: reference.monde.personnages.map((personnage) =>
					personnage.id === cible.acteurId ? { ...personnage, fonction: 'x'.repeat(100_000) } : personnage,
				),
			},
		}
		const refusLong = await service.demander(enorme, cible)

		expect(refusTon).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(refusCible).toEqual({ statut: 'refuse', motif: 'cible-a-ecrire' })
		expect(refusLong).toEqual({ statut: 'refuse', motif: 'trop-long' })
		// LES TROIS SONT DISTINCTS DEUX À DEUX — la moitié que le nom promet (KR-199).
		expect(new Set([refusTon, refusCible, refusLong].map((refus) => JSON.stringify(refus))).size).toBe(3)
		// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des trois.
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('le refus de contexte passe AVANT la disponibilite : il nomme ce qui manque', async () => {
		const reference = dossierDeReference()
		const dossier: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, ciblePlanDeReference(reference))

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le quatrieme role, aucune memoire', () => {
	it('deux lancers, deux corps identiques', async () => {
		const dossier = dossierDeReference()
		const cible = ciblePlanDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortiePlan(INTENTION_CONFORME)))

		await createCopiloteService(reglages()).demander(dossier, cible)
		await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// Ni date, ni identifiant, ni nonce : c'est ce qui rend l'égalité STRICTE
		// démontrable. Les étapes REFUSÉES ne sont jamais retenues — il n'existe aucune
		// trace à retenir —, et les étapes ÉCRITES sont relues du document à chaque
		// lancer. C'est exactement ce que l'écran a le droit de promettre, et rien de
		// plus : aucun prédicat ne refuse une recopie.
		expect(premier).not.toContain(cible.acteurId)
	})
})

// ══ LE CINQUIÈME RÔLE — `personnage-relations` ═══════════════════════════════

const ROLE_RELATIONS = 'personnage-relations'

/** UNE cible qui RÉSOUT : le personnage porte au moins une ligne de fiche écrite, donc
 *  la disjonction du refus `cible-a-ecrire` est satisfaite. ⚠ SA CHARGE EST CELLE DE
 *  `CibleRepliques` MOT POUR MOT — c'est l'ÉTIQUETTE, et elle seule, qui les sépare. */
function cibleRelationsDeReference(dossier: Dossier): CibleRelations {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.fonction !== undefined)
	if (personnage === undefined) throw new Error('la fixture ne porte aucun personnage à cibler')
	return { role: ROLE_RELATIONS, personnageId: personnage.id }
}

/** LA SORTIE CONFORME EST CONSTRUITE DEPUIS LE GABARIT, jamais retapée : la clé de fil
 *  ne s'écrit pas deux fois dans le dépôt (KR-236). */
const CLE_FIL_RELATIONS = Object.keys(JSON.parse(GABARIT_SORTIE[ROLE_RELATIONS]) as Record<string, unknown>)[0]
function sortieRelations(rapports: unknown): Record<string, unknown> {
	return { [CLE_FIL_RELATIONS]: rapports }
}

/** Les rangs que l'assembleur rend pour cette cible — LUS DE LUI, jamais re-dérivés
 *  (KR-231) : c'est la table que le service doit re-résoudre. */
function rangsDesRelations(dossier: Dossier, cible: CibleRelations): ReadonlyMap<string, string> {
	const contexte = assemblerRelations(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) : le test attend un assemblage`)
	return contexte.rangs
}

const NATURE_CONFORME = 'Il lui doit une dette ancienne, et il evite de croiser son regard depuis.'
const NATURE_CONFORME_2 = 'Elle le tient pour un bavard, et ne lui confie jamais rien qui compte.'

describe('CopiloteService — le cinquieme role, un appel sur reponse conforme', () => {
	it('un seul appel, et CHAQUE element est RE-RESOLU cote client', async () => {
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		const rangs = rangsDesRelations(dossier, cible)
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			// `personnageId` vient de l'ÉTAT D'ÉCRAN, jamais de la réponse (KR-231), et
			// chaque `cibleId` d'un `Map.get` sur la table de CET assemblage-ci. La clé
			// d'écriture se nomme `ajouts` : la feature AJOUTE à `relations[]`.
			proposition: {
				personnageId: cible.personnageId,
				ajouts: [{ cibleId: rangs.get('P1'), lien: NATURE_CONFORME }],
			},
		})
		// Discriminant : `P1` désigne un personnage RÉEL, et ce n'est PAS le porteur —
		// sans lui, l'égalité ci-dessus serait vraie même sur une table de rangs vide.
		expect(dossier.monde.personnages.map((personnage) => personnage.id)).toContain(rangs.get('P1'))
		expect(rangs.get('P1')).not.toBe(cible.personnageId)
	})

	it('la proposition ne porte NI intensite NI secret — la symetrie, vue du service', async () => {
		// `intensite` est ÉCRITE PARCE QUE REQUISE (le code la pose au site d'écriture),
		// `secret` est OMIS PARCE QU'OPTIONNEL (KR-221). Ni l'une ni l'autre ne traverse
		// ce contrat, et pour DEUX raisons différentes.
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		const proposee: Record<string, unknown> = reponse.statut === 'propose' ? { ...reponse.proposition } : {}
		expect(Object.keys(proposee).sort()).toEqual(['ajouts', 'personnageId'])
		const ajouts = (proposee.ajouts ?? []) as Array<Record<string, unknown>>
		expect(ajouts.length).toBeGreaterThan(0)
		for (const ajout of ajouts) expect(Object.keys(ajout).sort()).toEqual(['cibleId', 'lien'])
		// AUCUN entier, AUCUN booléen : tout ce qui traverse est une chaîne.
		for (const ajout of ajouts) expect(Object.values(ajout).filter((valeur) => typeof valeur !== 'string')).toEqual([])
	})

	it('le corps sur le fil vaut EXACTEMENT {role, contexte} — toEqual, jamais inclusion', async () => {
		// CRITÈRE 5, ET C'EST LA PARADE DU RISQUE NEUF DE L'UNION ÉTIQUETÉE : `cible.role`
		// porte LE MÊME NOM que `CorpsDemande.role`, donc un `{ ...cible, contexte }`
		// compilerait, produirait le bon `role`, ET METTRAIT `personnageId` SUR LE FIL.
		// ⚠ L'ÉGALITÉ EST LE GARDE : une INCLUSION (`toMatchObject`, ou un balayage des
		// clés attendues) resterait VERTE sur la clé EN TROP, c'est-à-dire sur le défaut.
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		const contexte = assemblerRelations(dossier, cible)
		if (!contexte.ok) throw new Error('le test attend un assemblage')
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		await createCopiloteService(reglages()).demander(dossier, cible)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_RELATIONS}`)
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(CLE)
		expect(JSON.parse(String(init.body))).toEqual({ role: ROLE_RELATIONS, contexte: contexte.texte })
		// … et la démonstration que l'inclusion NE SUFFIRAIT PAS : le corps FAUTIF que
		// l'étalement produirait satisfait un `toMatchObject` sur les deux clés voulues.
		const corpsFautif = { ...cible, contexte: contexte.texte }
		expect(corpsFautif).toMatchObject({ role: ROLE_RELATIONS, contexte: contexte.texte })
		expect(corpsFautif).not.toEqual({ role: ROLE_RELATIONS, contexte: contexte.texte })
		expect(Object.keys(corpsFautif)).toContain('personnageId')
		// L'identifiant du porteur ne franchit JAMAIS le réseau, ni aucun nom (KR-195).
		expect(String(init.body)).not.toContain(cible.personnageId)
		const nomme = dossier.monde.personnages.find((candidat) => candidat.id === cible.personnageId)
		expect(String(nomme?.nom).trim().length).toBeGreaterThan(0)
		expect(String(init.body)).not.toContain(String(nomme?.nom))
	})

	it('une liste vide est un REFUS, jamais un succes — la regle du cas MIXTE', async () => {
		// Rôle de RÉDACTION (l'acceptation écrit une PROSE RÉDIGÉE PAR LE MODÈLE), donc
		// « je n'écris rien » est une NON-RÉPONSE : rejeu unique, puis terminal.
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})

describe('CopiloteService — le cinquieme role, le rejeu exactement une fois', () => {
	it('un rang inconnu rejette le LOT ENTIER, et le rejeu a bien lieu', async () => {
		// PROPRIÉTÉ 1 sur 2 (KR-230) : le rejeu a lieu, et le premier lot n'est PAS
		// repêché — ce n'est jamais le seul rapport sain qui ressort.
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		const rangs = rangsDesRelations(dossier, cible)
		fetchMock
			.mockResolvedValueOnce(
				reponseWorker(
					sortieRelations([
						{ envers: 'P1', nature: NATURE_CONFORME },
						{ envers: 'P9', nature: NATURE_CONFORME_2 },
					]),
				),
			)
			.mockResolvedValueOnce(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le résultat vient du SECOND lot, jamais d'un repêchage du premier.
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { personnageId: cible.personnageId, ajouts: [{ cibleId: rangs.get('P1'), lien: NATURE_CONFORME }] },
		})
		// Et `P9` n'appartenait bien pas à la table : sans cette ligne, le premier lot
		// aurait pu être refusé pour une tout autre raison.
		expect([...rangs.keys()]).not.toContain('P9')
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// PROPRIÉTÉ 2 sur 2 : l'arrêt. Le TROISIÈME bouchon est CONFORME — c'est lui le
		// pouvoir séparateur : un rejeu illimité l'atteindrait et rendrait `propose`.
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		fetchMock
			.mockResolvedValueOnce(
				reponseWorker(
					sortieRelations([
						{ envers: 'P1', nature: NATURE_CONFORME },
						{ envers: 'P1', nature: NATURE_CONFORME_2 },
					]),
				),
			)
			.mockResolvedValueOnce(reponseWorker(sortieRelations([{ envers: 'P1', nature: '   ' }])))
			.mockResolvedValueOnce(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		// Le motif est celui du SECOND échec — `vide` —, jamais du premier (`schema`, le
		// doublon d'`envers`).
		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
	})

	it('sur etat terminal du cinquieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P9', nature: NATURE_CONFORME }])))

		const reponse = await brain.copilote.demander(dossier, cibleRelationsDeReference(dossier))

		expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le cinquieme role, les refus de contexte avant tout appel', () => {
	it('les QUATRE refus, discrimines, et AUCUN fetch — worker NON CONFIGURE compris', async () => {
		// CRITÈRE 3. ⚠ PREMIER RÔLE À UTILISER LES QUATRE MOTIFS, et le service est
		// délibérément NON CONFIGURÉ : le refus de contexte passe AVANT la disponibilité,
		// donc c'est `a-ecrire` qui sort — JAMAIS `indisponible`. L'ordre inverse ferait
		// dire « indisponible » à un dossier dont il manque seulement le ton, et ce serait
		// le premier diagnostic, FAUX, que l'auteur lirait.
		const reference = dossierDeReference()
		const cible = cibleRelationsDeReference(reference)
		const service = createCopiloteService(reglages(null, null))
		expect(service.estDisponible()).toBe(false)

		// 1 — `a-ecrire`, À CHARGE.
		const sansTon: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }
		const refusTon = await service.demander(sansTon, cible)

		// 2 — `cible-a-ecrire`, SANS charge : un personnage sans une ligne de fiche.
		const muet = { id: 'pnj.sans-identite', portee: 'premier' as const, plan_actions: [], savoirs: [] }
		const avecMuet: Dossier = {
			...reference,
			monde: { ...reference.monde, personnages: [...reference.monde.personnages, muet] },
		}
		const refusCible = await service.demander(avecMuet, { role: ROLE_RELATIONS, personnageId: muet.id })

		// 3 — `aucun-candidat`, SANS charge : le porteur est SEUL au dossier.
		const seul: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: reference.monde.personnages.filter((personnage) => personnage.id === cible.personnageId),
			},
		}
		const refusSeul = await service.demander(seul, cible)

		// 4 — `trop-long`, SANS charge non plus : il pointe la fiche, pas un champ.
		const enorme: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: reference.monde.personnages.map((personnage) =>
					personnage.id === cible.personnageId ? { ...personnage, fonction: 'x'.repeat(100_000) } : personnage,
				),
			},
		}
		const refusLong = await service.demander(enorme, cible)

		expect(refusTon).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(refusCible).toEqual({ statut: 'refuse', motif: 'cible-a-ecrire' })
		expect(refusSeul).toEqual({ statut: 'refuse', motif: 'aucun-candidat' })
		expect(refusLong).toEqual({ statut: 'refuse', motif: 'trop-long' })
		// LES QUATRE SONT DISTINCTS DEUX À DEUX — la moitié que le nom promet (KR-199).
		expect(new Set([refusTon, refusCible, refusSeul, refusLong].map((refus) => JSON.stringify(refus))).size).toBe(4)
		// … et AUCUN n'est `indisponible`, alors que le worker N'EST PAS configuré.
		expect([refusTon, refusCible, refusSeul, refusLong].map((refus) => refus.statut)).toEqual([
			'refuse',
			'refuse',
			'refuse',
			'refuse',
		])
		// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des quatre.
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('CopiloteState — le cinquieme role, aucune memoire', () => {
	it('deux lancers, deux corps identiques par EGALITE STRICTE', async () => {
		const dossier = dossierDeReference()
		const cible = cibleRelationsDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))

		await createCopiloteService(reglages()).demander(dossier, cible)
		await createCopiloteService(reglages()).demander(dossier, cible)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// Ni date, ni identifiant, ni nonce.
		expect(premier).not.toContain(cible.personnageId)
		// ⚠ ET C'EST LE PATRON DE L'IT2, PAS CELUI DE 3a : une relation ACCEPTÉE devient
		// NON RE-PROPOSABLE — non par mémoire, mais parce que LA SÉLECTION L'EXCLUT au
		// lancer suivant. Le témoin est ici, sur le CONTEXTE : une fois la relation
		// écrite, le rang de cette cible disparaît de la table.
		const rangsAvant = rangsDesRelations(dossier, cible)
		const premiereCible = String(rangsAvant.get('P1'))
		const apres: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === cible.personnageId
						? {
								...personnage,
								relations: [
									...(personnage.relations ?? []),
									{ cible_id: premiereCible, lien: NATURE_CONFORME, intensite: INTENSITE_INITIALE },
								],
							}
						: personnage,
				),
			},
		}
		expect([...rangsAvant.values()]).toContain(premiereCible)
		expect([...rangsDesRelations(apres, cible).values()]).not.toContain(premiereCible)
	})
})

describe('CopiloteService — le couple (role, charge) n est plus DEUX VALEURS', () => {
	it('charge incompatible ne compile pas — les QUINZE couples illegaux', async () => {
		// LE TEST EST DE TYPE, PAS DE RUNTIME : `@ts-expect-error` échoue à la
		// COMPILATION si l'erreur attendue n'a PAS lieu.
		// ⚠ CE QUI A CHANGÉ À L'IT3c : le rôle n'est plus un PARAMÈTRE, c'est l'ÉTIQUETTE
		// de la cible. Le couple (rôle, charge) ne peut donc plus DIVERGER — il n'est plus
		// deux valeurs. Ce qui reste représentable, et qui doit être refusé, est une
		// étiquette POSÉE SUR LA MAUVAISE CHARGE.
		// LE DÉCOMPTE, ET SON PRÉDICAT : CINQ étiquettes × QUATRE charges DISTINCTES
		// (`{entiteId,champ}`, `{indiceId}`, `{personnageId}`, `{acteurId}`) = vingt
		// couples, dont CINQ légaux — `personnage-repliques` ET `personnage-relations`
		// partagent la même charge. Les QUINZE autres sont énumérés ici, aucun
		// échantillonnage (KR-199).
		// ⚠ LA SIXIÈME ÉTIQUETTE N'ENTRE PAS DANS CETTE GRILLE, et ce n'est pas un oubli :
		// sa charge est VIDE, donc elle ne se croise avec aucune des quatre. Ses propres
		// couples illégaux sont énumérés dans la suite du sixième rôle, plus bas.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(sortieDetenteurs([])))
		const service = createCopiloteService(reglages())
		const prose = cibleDeReference(dossier)
		const indice = cibleIndiceDeReference(dossier)
		const repliques = cibleRepliquesDeReference(dossier)
		const plan = ciblePlanDeReference(dossier)
		const relations = cibleRelationsDeReference(dossier)

		// ── L'ÉTIQUETTE PROSE sur les trois autres charges ───────────────────────
		// @ts-expect-error — 1/15 : charge d'INDICE.
		await service.demander(dossier, { role: ROLE, indiceId: indice.indiceId })
		// @ts-expect-error — 2/15 : charge de PERSONNAGE.
		await service.demander(dossier, { role: ROLE, personnageId: repliques.personnageId })
		// @ts-expect-error — 3/15 : charge d'ACTEUR.
		await service.demander(dossier, { role: ROLE, acteurId: plan.acteurId })

		// ── L'ÉTIQUETTE DÉTENTEURS ───────────────────────────────────────────────
		// @ts-expect-error — 4/15 : charge de PROSE.
		await service.demander(dossier, { role: ROLE_DETENTEURS, entiteId: prose.entiteId, champ: prose.champ })
		// @ts-expect-error — 5/15 : charge de PERSONNAGE.
		await service.demander(dossier, { role: ROLE_DETENTEURS, personnageId: repliques.personnageId })
		// @ts-expect-error — 6/15 : charge d'ACTEUR.
		await service.demander(dossier, { role: ROLE_DETENTEURS, acteurId: plan.acteurId })

		// ── L'ÉTIQUETTE RÉPLIQUES ────────────────────────────────────────────────
		// @ts-expect-error — 7/15 : charge de PROSE.
		await service.demander(dossier, { role: ROLE_REPLIQUES, entiteId: prose.entiteId, champ: prose.champ })
		// @ts-expect-error — 8/15 : charge d'INDICE.
		await service.demander(dossier, { role: ROLE_REPLIQUES, indiceId: indice.indiceId })
		// @ts-expect-error — 9/15 : charge d'ACTEUR.
		await service.demander(dossier, { role: ROLE_REPLIQUES, acteurId: plan.acteurId })

		// ── L'ÉTIQUETTE PLAN ─────────────────────────────────────────────────────
		// @ts-expect-error — 10/15 : charge de PROSE.
		await service.demander(dossier, { role: ROLE_PLAN, entiteId: prose.entiteId, champ: prose.champ })
		// @ts-expect-error — 11/15 : charge d'INDICE.
		await service.demander(dossier, { role: ROLE_PLAN, indiceId: indice.indiceId })
		// @ts-expect-error — 12/15 : charge de PERSONNAGE.
		await service.demander(dossier, { role: ROLE_PLAN, personnageId: repliques.personnageId })

		// ── L'ÉTIQUETTE RELATIONS ────────────────────────────────────────────────
		// @ts-expect-error — 13/15 : charge de PROSE.
		await service.demander(dossier, { role: ROLE_RELATIONS, entiteId: prose.entiteId, champ: prose.champ })
		// @ts-expect-error — 14/15 : charge d'INDICE.
		await service.demander(dossier, { role: ROLE_RELATIONS, indiceId: indice.indiceId })
		// @ts-expect-error — 15/15 : charge d'ACTEUR.
		await service.demander(dossier, { role: ROLE_RELATIONS, acteurId: plan.acteurId })

		// ⚠ ET LA CIBLE `{ personnageId }` NUE — CELLE QUE LE DISPATCH STRUCTUREL DE 3b
		// AURAIT LAISSÉ COMPILER, et qui serait tombée dans `demanderRepliques` par
		// élimination. Sans étiquette, elle ne satisfait plus AUCUNE surcharge.
		// @ts-expect-error — la charge sans son étiquette.
		await service.demander(dossier, { personnageId: repliques.personnageId })
		// @ts-expect-error — et une étiquette qui n'existe pas.
		await service.demander(dossier, { role: 'personnage-liens', personnageId: repliques.personnageId })

		// Discriminant : les CINQ appels BIEN APPARIÉS compilent, eux. Sans cette moitié,
		// les `@ts-expect-error` ci-dessus seraient satisfaits par n'importe quelle erreur
		// de type, y compris « `demander` n'existe pas ».
		await service.demander(dossier, prose)
		await service.demander(dossier, indice)
		await service.demander(dossier, repliques)
		await service.demander(dossier, plan)
		await service.demander(dossier, relations)
		expect(fetchMock).toHaveBeenCalled()
	})

	it('les CINQ cibles se distinguent par leur ETIQUETTE — et DEUX partagent leur charge', () => {
		// LA MESURE QUI JUSTIFIE TOUT LE LOT, constatée en VALEUR et non déduite :
		// `CibleRepliques` et `CibleRelations` ont EXACTEMENT la même charge
		// (`{ personnageId }`). Jusqu'à 3b le dispatch rétrécissait sur la FORME de la
		// cible : elles auraient donc été LE MÊME TYPE, la surcharge déclarée les aurait
		// acceptées l'une pour l'autre, et l'implémentation aurait exécuté le validateur
		// des RÉPLIQUES sur une demande de RELATIONS — `tsc` VERT.
		const dossier = dossierDeReference()
		const cibles: Record<string, Record<string, unknown>> = {
			prose: { ...cibleDeReference(dossier) },
			indice: { ...cibleIndiceDeReference(dossier) },
			repliques: { ...cibleRepliquesDeReference(dossier) },
			plan: { ...ciblePlanDeReference(dossier) },
			relations: { ...cibleRelationsDeReference(dossier) },
		}
		const charges = Object.fromEntries(
			Object.entries(cibles).map(([nom, cible]) => [
				nom,
				Object.keys(cible)
					.filter((cle) => cle !== 'role')
					.sort()
					.join('+'),
			]),
		)

		// (a) LES CHARGES NE SONT PLUS DEUX À DEUX DISTINCTES — et c'est le fait mesuré.
		expect(charges.relations).toBe(charges.repliques)
		expect(new Set(Object.values(charges)).size).toBe(4)
		expect(Object.keys(cibles)).toHaveLength(5)

		// (b) LES ÉTIQUETTES, ELLES, LE SONT — et ce sont elles, désormais, qui portent la
		// disjonction. Chacune vaut le segment de route de son rôle.
		const etiquettes = Object.values(cibles).map((cible) => String(cible.role))
		expect(new Set(etiquettes).size).toBe(etiquettes.length)
		expect(etiquettes.sort()).toEqual([ROLE, ROLE_DETENTEURS, ROLE_REPLIQUES, ROLE_PLAN, ROLE_RELATIONS].sort())
	})

	it('le dispatch suit l ETIQUETTE : une cible de RELATIONS ne part JAMAIS sur la route des REPLIQUES', async () => {
		// ⚠ LE TÉMOIN DÉCISIF DU LOT, ET IL EST DE RUNTIME, PAS DE TYPE. Les deux cibles
		// portent la MÊME charge : aucune assertion de compilation ne peut dire laquelle
		// des deux branches s'exécute. C'est EXACTEMENT le défaut que le dispatch
		// structurel de 3b aurait produit — rôle annoncé A, validateur exécuté B, `tsc`
		// vert —, et il ne se constate que sur le FIL.
		const dossier = dossierDeReference()
		const relations = cibleRelationsDeReference(dossier)
		const repliques = cibleRepliquesDeReference(dossier)
		// Les deux visent LE MÊME personnage : sans cela, l'URL pourrait différer pour une
		// autre raison que l'étiquette.
		expect(relations.personnageId).toBe(repliques.personnageId)

		fetchMock.mockResolvedValue(reponseWorker(sortieRelations([{ envers: 'P1', nature: NATURE_CONFORME }])))
		await createCopiloteService(reglages()).demander(dossier, relations)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))
		await createCopiloteService(reglages()).demander(dossier, repliques)

		const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
		expect(urls).toEqual([`${URL_WORKER}/ia/${ROLE_RELATIONS}`, `${URL_WORKER}/ia/${ROLE_REPLIQUES}`])
		// … et le `role` DU CORPS suit la même étiquette : c'est lui que le worker indexe
		// pour choisir l'invite.
		const roles = fetchMock.mock.calls.map(
			(appel) => (JSON.parse(String((appel[1] as RequestInit).body)) as { role: string }).role,
		)
		expect(roles).toEqual([ROLE_RELATIONS, ROLE_REPLIQUES])
	})

	it('la garde never rend un SEPTIEME role sans branche NON COMPILABLE', () => {
		// LA PREUVE D'EXHAUSTIVITÉ, et elle remplace une convention : les gardes
		// `'x' in cible` de 3b étaient explicites, mais RIEN ne disait au compilateur
		// qu'elles étaient complètes. La garde est un balayage de SOURCE — son unique
		// instrument possible, puisqu'elle ne produit aucun comportement.
		const source = fs.readFileSync(path.join(__dirname, 'CopiloteService.ts'), 'utf8')
		// LE DÉCOUPAGE EST BORNÉ AU `switch`, jamais « jusqu'à la fin du fichier » : la
		// fabrique rend `{ estDisponible, demander }` plus bas, et un découpage ouvert
		// ferait rougir l'assertion « le repli ne délègue à rien » sur CE `return`-là
		// (KR-226 — une garde qui encode une coïncidence plutôt que son invariant).
		// ⚠ ANCRÉ SUR LA LIGNE DE CODE (indentation comprise), jamais sur la chaîne nue :
		// la docstring du dispatch NOMME le `switch`, et un `indexOf` nu tomberait dessus
		// — la garde porterait alors sur un commentaire (KR-235, famille de la sonde
		// inerte). Mesuré : la première occurrence dans le fichier EST la docstring.
		const debutDispatch = source.indexOf('\t\tswitch (cible.role) {')
		const finDispatch = source.indexOf('\n\treturn {', debutDispatch)
		const dispatch = source.slice(debutDispatch, finDispatch)

		expect(debutDispatch).toBeGreaterThan(source.indexOf('switch (cible.role)'))
		expect(dispatch).toContain('const _exhaustif: never = cible')
		// LES CINQ BRANCHES SONT ÉCRITES, une par rôle — balayées depuis le registre qui
		// fait foi, jamais cinq littéraux (KR-117/199).
		// ⚠ SIX BRANCHES DEPUIS L'ITÉRATION 4, et la garde a SERVI : le sixième rôle l'a
		// fait rougir aux deux sites. La promesse écrite à 3c était donc EXÉCUTABLE, et
		// elle a été exécutée plutôt que crue.
		const roles = [ROLE, ROLE_DETENTEURS, ROLE_REPLIQUES, ROLE_PLAN, ROLE_RELATIONS, ROLE_DISTRIBUTION]
		expect(roles.filter((role) => !dispatch.includes(`case '${role}':`))).toEqual([])
		// ⚠ ET IL N'Y A PLUS DE REPLI : le `default` NE DÉLÈGUE À AUCUNE BRANCHE. À l'it2
		// le dernier `return` valait `demanderDetenteurs(…)` sans garde, et une troisième
		// cible y serait tombée PAR DÉFAUT.
		const parDefaut = dispatch.slice(dispatch.indexOf('default:'))
		expect(parDefaut).not.toContain('demander')
		// Discriminant : le découpage porte bien sur du code réel, et il s'arrête AVANT le
		// `return { estDisponible, demander }` de la fabrique — sans quoi l'assertion
		// ci-dessus serait rouge sans aucun défaut (KR-226).
		expect(dispatch).toContain('switch (cible.role) {')
		expect(dispatch).not.toContain('estDisponible:')
		expect(roles).toHaveLength(6)
	})
})

/**
 * Un `Brain` RÉEL, avec des espions sur les trois chemins d'écriture que l'état
 * terminal ne doit pas emprunter. Il prouve AUSSI que `createBrain` construit bien
 * le copilote depuis `cloudSettings` — sans option de fabrique (KR-109).
 */
function brainEspionne(): {
	brain: ReturnType<typeof createBrain>
	espions: { update: jest.Mock; set: jest.Mock; emit: jest.Mock }
} {
	const magasin: Record<string, unknown> = {}
	// Le patron de bouchon de `docs/WORKFLOW.md` § Testing Patterns — `keys` compris.
	const persistence = {
		get: jest.fn((cle: string) => magasin[cle] ?? null),
		set: jest.fn((cle: string, valeur: unknown) => {
			magasin[cle] = valeur
		}),
		remove: jest.fn(),
		keys: jest.fn((_prefixe: string) => [] as string[]),
	}
	const brain = createBrain({ persistence: persistence as unknown as PersistenceService })
	brain.cloudSettings.setWorkerUrl(URL_WORKER)
	brain.cloudSettings.setSyncKey(CLE)
	// Les espions sont posés AVANT tout appel observé (KR-199 : une sonde posée
	// après l'événement est syntaxiquement présente et sémantiquement morte).
	const update = jest.spyOn(brain.dossiers, 'update') as unknown as jest.Mock
	const set = persistence.set as jest.Mock
	set.mockClear()
	const emit = jest.spyOn(brain.events, 'emit') as unknown as jest.Mock
	return { brain, espions: { update, set, emit } }
}

// ══ LE SIXIÈME RÔLE — `monde-distribution` ══════════════════════════════════

const ROLE_DISTRIBUTION = 'monde-distribution'

/** ⚠ LA CIBLE EST À CHARGE VIDE — la seule des six. Une constante, et non une fonction
 *  paramétrée : il n'y a RIEN à paramétrer, puisque la cible est le dossier. */
const CIBLE_DISTRIBUTION: CibleDistribution = { role: ROLE_DISTRIBUTION }

/** LA SORTIE CONFORME EST CONSTRUITE DEPUIS LE GABARIT, jamais retapée : la clé de fil
 *  ne s'écrit pas deux fois dans le dépôt (KR-236). */
const CLE_FIL_DISTRIBUTION = Object.keys(JSON.parse(GABARIT_SORTIE[ROLE_DISTRIBUTION]) as Record<string, unknown>)[0]
function sortieDistribution(fiches: unknown): Record<string, unknown> {
	return { [CLE_FIL_DISTRIBUTION]: fiches }
}

const PLACE_CONFORME = 'Marchande du quai bas, la seule qui accepte encore les billets du Nord.'
const POURSUITE_CONFORME = 'Racheter la dette de son frere avant que le prochain convoi ne parte.'
const PLACE_CONFORME_2 = 'Capitaine de la garde de nuit, en poste depuis la derniere crue.'
const POURSUITE_CONFORME_2 = 'Faire rouvrir la porte basse, que le conseil a muree sans la consulter.'

describe('CopiloteService — le sixieme role, un appel sur reponse conforme', () => {
	it('un seul appel, et CHAQUE element est RE-RESOLU vers sa DESTINATION', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(
			reponseWorker(
				sortieDistribution([
					{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME },
					{ place: PLACE_CONFORME_2, poursuite: POURSUITE_CONFORME_2 },
				]),
			),
		)

		const reponse = await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		expect(fetchMock).toHaveBeenCalledTimes(1)
		// ⚠ LA PROPOSITION NE PORTE AUCUN IDENTIFIANT DE CIBLE — première des six, et ce
		// n'est pas une omission : LA CIBLE EST LE DOSSIER. `place` → `fonction` et
		// `poursuite` → `but.libelle` sont un RENOMMAGE DE DESTINATION, précédent
		// `intention` → `action` et `nature` → `lien`.
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: {
				ajouts: [
					{ fonction: PLACE_CONFORME, but: { libelle: POURSUITE_CONFORME } },
					{ fonction: PLACE_CONFORME_2, but: { libelle: POURSUITE_CONFORME_2 } },
				],
			},
		})
	})

	it('la proposition ne porte NI id NI portee NI nom — le BROUILLON EST SANS IDENTITE', async () => {
		// ⚠ LE TÉMOIN DE RUNTIME DE LA DÉCISION CENTRALE. `tsc` tient déjà la FORME
		// (`FicheBrouillon` n'est pas assignable à `Personnage`), mais il ne dit rien de
		// ce que le SERVICE compose réellement : un identifiant précalculé ICI
		// compilerait parfaitement.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)

		const reponse = await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		const proposee: Record<string, unknown> = reponse.statut === 'propose' ? { ...reponse.proposition } : {}
		expect(Object.keys(proposee)).toEqual(['ajouts'])
		const ajouts = (proposee.ajouts ?? []) as Array<Record<string, unknown>>
		expect(ajouts.length).toBeGreaterThan(0)
		for (const ajout of ajouts) {
			// DEUX clés, et EXACTEMENT celles-là — KR-221 : aucun optionnel semé.
			expect(Object.keys(ajout).sort()).toEqual(['but', 'fonction'])
			expect(Object.keys(ajout.but as Record<string, unknown>)).toEqual(['libelle'])
		}
		// ⚠ AUCUN IDENTIFIANT NULLE PART dans ce que le contrat rend — ni au niveau de la
		// proposition, ni dans une fiche. Le code frappera l'identifiant À L'ACCEPTATION,
		// côté écran, et jamais avant.
		const serialisee = JSON.stringify(reponse)
		expect(serialisee).not.toContain('"id"')
		expect(serialisee).not.toContain('portee')
		expect(serialisee).not.toContain('"nom"')
		expect(serialisee).not.toContain('plan_actions')
		expect(serialisee).not.toContain('savoirs')
		// Discriminant : la sérialisation N'EST PAS vide — sans lui, les cinq absences
		// ci-dessus seraient vraies pour rien (KR-199).
		expect(serialisee).toContain(PLACE_CONFORME)
	})

	it('le corps sur le fil vaut EXACTEMENT {role, contexte} — toEqual, jamais inclusion', async () => {
		// CRITÈRE 4. ⚠ ICI L'ÉTALEMENT SERAIT INOFFENSIF — la cible est VIDE, il n'y a
		// RIEN à fuiter —, ET C'EST EXACTEMENT POURQUOI LE TÉMOIN EXISTE : un
		// `{ ...cible, contexte }` écrit ici passerait, puis serait GÉNÉRALISÉ aux cinq
		// autres rôles, où il met `personnageId`, `indiceId` ou `champ` SUR LE FIL
		// (KR-231). La règle se tient là où elle ne coûte rien, sinon elle ne tient pas.
		const dossier = dossierDeReference()
		const contexte = assemblerDistribution(dossier, CIBLE_DISTRIBUTION)
		if (!contexte.ok) throw new Error('le test attend un assemblage')
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)

		await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_DISTRIBUTION}`)
		expect(init.method).toBe('POST')
		expect((init.headers as Record<string, string>)['X-Sync-Key']).toBe(CLE)
		// ⚠ L'ÉGALITÉ EST LE GARDE : une INCLUSION (`toMatchObject`) resterait VERTE sur
		// une clé EN TROP, c'est-à-dire sur le défaut.
		expect(JSON.parse(String(init.body))).toEqual({ role: ROLE_DISTRIBUTION, contexte: contexte.texte })
		expect(Object.keys(JSON.parse(String(init.body)) as Record<string, unknown>).sort()).toEqual(['contexte', 'role'])
		// … et la démonstration que l'inclusion NE SUFFIRAIT PAS, faite sur le rôle
		// VOISIN où l'étalement fuite réellement : c'est le défaut que ce témoin-ci
		// existe pour empêcher de naître.
		const cibleQuiFuite = cibleRelationsDeReference(dossier)
		const corpsFautif = { ...cibleQuiFuite, contexte: contexte.texte }
		expect(corpsFautif).toMatchObject({ role: 'personnage-relations', contexte: contexte.texte })
		expect(Object.keys(corpsFautif)).toContain('personnageId')
		// Et AUCUN nom du dossier ne franchit le réseau (KR-195).
		const noms = dossier.monde.personnages
			.map((personnage) => personnage.nom)
			.filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')
		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => String(init.body).includes(nom))).toEqual([])
	})

	it('une liste vide est un REFUS, jamais un succes — la CREATION n a pas de troisieme cas', async () => {
		// Rôle de CRÉATION : IL N'EXISTE AUCUN ENSEMBLE DE CANDIDATS À ÉPUISER, donc la
		// vacuité ne peut rien signifier ⇒ rejeu unique, puis terminal.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(sortieDistribution([])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})
})

describe('CopiloteService — le sixieme role, le rejeu exactement une fois', () => {
	it('un COUPLE en doublon rejette le LOT ENTIER, et le rejeu a bien lieu', async () => {
		// PROPRIÉTÉ 1 sur 2 (KR-230) : le rejeu a lieu, et le premier lot n'est PAS
		// repêché — ce n'est jamais la seule fiche saine qui ressort.
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(
				reponseWorker(
					sortieDistribution([
						{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME },
						{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME },
					]),
				),
			)
			.mockResolvedValueOnce(
				reponseWorker(sortieDistribution([{ place: PLACE_CONFORME_2, poursuite: POURSUITE_CONFORME_2 }])),
			)

		const reponse = await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { ajouts: [{ fonction: PLACE_CONFORME_2, but: { libelle: POURSUITE_CONFORME_2 } }] },
		})
	})

	it('le second echec est TERMINAL, et un troisieme appel n a jamais lieu', async () => {
		// PROPRIÉTÉ 2 sur 2 (KR-230), prouvée SÉPARÉMENT de la première.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: '   ' }])))

		const reponse = await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
	})

	it('sur etat terminal du sixieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ personnages: [] }))

		const reponse = await brain.copilote.demander(dossier, CIBLE_DISTRIBUTION)

		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — le sixieme role, les DEUX refus avant tout appel', () => {
	it('les deux refus, discrimines, et AUCUN fetch — worker NON CONFIGURE compris', async () => {
		// CRITÈRE 2. ⚠ LE REFUS DE CONTEXTE PASSE AVANT LA DISPONIBILITÉ : le service est
		// délibérément NON CONFIGURÉ, et c'est pourtant `a-ecrire` qui sort.
		const reference = dossierDeReference()
		const service = createCopiloteService(reglages(null, null))
		expect(service.estDisponible()).toBe(false)

		// 1 — `a-ecrire('canon.mj.synopsis_mj')` : LA SECONDE VALEUR QUE CETTE CHARGE
		// PREND. Sur cinq rôles elle n'avait jamais pu valoir que `'canon.ton'`.
		const sansSynopsis: Dossier = {
			...reference,
			canon: { ...reference.canon, mj: { ...reference.canon.mj, synopsis_mj: MARQUEUR_A_ECRIRE } },
		}
		const refusSynopsis = await service.demander(sansSynopsis, CIBLE_DISTRIBUTION)

		// 2 — `a-ecrire('canon.ton')`.
		const sansTon: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }
		const refusTon = await service.demander(sansTon, CIBLE_DISTRIBUTION)

		// 3 — `trop-long`, SANS charge : il pointe la fiche, pas un champ.
		const enorme: Dossier = {
			...reference,
			canon: { ...reference.canon, mj: { ...reference.canon.mj, synopsis_mj: 'x'.repeat(100_000) } },
		}
		const refusLong = await service.demander(enorme, CIBLE_DISTRIBUTION)

		expect(refusSynopsis).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.mj.synopsis_mj' })
		expect(refusTon).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		// ⚠ LE CAS QUI SÉPARE, ET IL EST INDISPENSABLE : les deux refus ci-dessus rendent
		// LE MÊME chemin quel que soit l'ordre de la table, puisqu'un seul requis manque à
		// chaque fois. SEUL un dossier à qui manquent LES DEUX fait diverger les deux
		// ordres — mutant de l'ordre VU ROUGE sur ce scénario-là et sur lui seul. C'est la
		// leçon de BUG-113 : une assertion de résultat n'épingle une décision que si le
		// scénario FAIT DIVERGER les sources possibles du résultat.
		const cumul: Dossier = {
			...reference,
			canon: {
				...reference.canon,
				ton: MARQUEUR_A_ECRIRE,
				mj: { ...reference.canon.mj, synopsis_mj: MARQUEUR_A_ECRIRE },
			},
		}
		// L'ÉCRAN NOMME LE SYNOPSIS — le manque le plus SPÉCIFIQUE à cette carte avant le
		// filtre GÉNÉRIQUE des six rôles. Jamais le ton.
		expect(await service.demander(cumul, CIBLE_DISTRIBUTION)).toEqual({
			statut: 'refuse',
			motif: 'a-ecrire',
			chemin: 'canon.mj.synopsis_mj',
		})
		expect(refusLong).toEqual({ statut: 'refuse', motif: 'trop-long' })
		// LES TROIS SONT DISTINCTS DEUX À DEUX — la moitié que le nom promet (KR-199).
		expect(new Set([refusSynopsis, refusTon, refusLong].map((refus) => JSON.stringify(refus))).size).toBe(3)
		// … et AUCUN n'est `indisponible`, alors que le worker N'EST PAS configuré.
		expect([refusSynopsis, refusTon, refusLong].map((refus) => refus.statut)).toEqual(['refuse', 'refuse', 'refuse'])
		// ET AUCUN APPEL RÉSEAU N'EST PARTI.
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('un monde VIDE ne produit AUCUN refus — c est le CAS NOMINAL du role', async () => {
		// ⚠ CRITÈRE 2, SECONDE MOITIÉ, VU DU SERVICE : `'cible-a-ecrire'` et
		// `'aucun-candidat'` sont INATTEIGNABLES ici. Les recopier « par symétrie »
		// refuserait L'USAGE PRINCIPAL DU RÔLE — le premier geste après l'écriture du
		// synopsis, quand `monde.personnages[]` est vide PAR DÉFINITION.
		const reference = dossierDeReference()
		const vide: Dossier = { ...reference, monde: { ...reference.monde, personnages: [] } }
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)

		const reponse = await createCopiloteService(reglages()).demander(vide, CIBLE_DISTRIBUTION)

		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { ajouts: [{ fonction: PLACE_CONFORME, but: { libelle: POURSUITE_CONFORME } }] },
		})
		// L'APPEL EST BIEN PARTI — sans cette ligne, « aucun refus » serait vrai d'un
		// service qui n'aurait rien fait du tout.
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})
})

describe('CopiloteService — le sixieme role, aucune memoire', () => {
	it('deux lancers, deux corps identiques par EGALITE STRICTE', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)

		await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)
		await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [premier, second] = fetchMock.mock.calls.map((appel) => String((appel[1] as RequestInit).body))
		expect(premier).toBe(second)
		// ⚠ ET LA CONSÉQUENCE, ÉCRITE PLUTÔT QUE DÉCOUVERTE : une fiche REFUSÉE ne laisse
		// AUCUNE TRACE et PEUT REVENIR — prix assumé de « le document est la seule
		// mémoire ». Une fiche ACCEPTÉE, elle, disparaît par LE BLOC DES DÉJÀ ÉCRITS, et
		// jamais par une mémoire : le témoin est sur le CONTEXTE.
		const avant = assemblerDistribution(dossier, CIBLE_DISTRIBUTION)
		if (!avant.ok) throw new Error('le test attend un assemblage')
		const apres = assemblerDistribution(
			{
				...dossier,
				monde: {
					...dossier.monde,
					personnages: [
						...dossier.monde.personnages,
						{ id: 'pnj.accepte', portee: PORTEE_INITIALE, plan_actions: [], savoirs: [], fonction: PLACE_CONFORME },
					],
				},
			},
			CIBLE_DISTRIBUTION,
		)
		if (!apres.ok) throw new Error('le test attend un assemblage')
		expect(avant.texte).not.toContain(PLACE_CONFORME)
		expect(apres.texte).toContain(PLACE_CONFORME)
	})
})

describe('CopiloteService — la SIXIEME branche, et la garde never', () => {
	it('la cible a CHARGE VIDE n accepte aucune charge — les CINQ couples illegaux', async () => {
		// LE TEST EST DE TYPE, PAS DE RUNTIME : `@ts-expect-error` échoue à la
		// COMPILATION si l'erreur attendue n'a PAS lieu.
		// ⚠ LE DÉCOMPTE ET SON PRÉDICAT (KR-159) : l'étiquette `monde-distribution`
		// posée sur CHACUNE des QUATRE charges distinctes des cinq rôles livrés, plus la
		// charge `{ dossierId }` que le § 4.1 interdit d'ajouter « par symétrie » — CINQ
		// couples, aucun échantillonnage.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)
		const service = createCopiloteService(reglages())
		const prose = cibleDeReference(dossier)
		const indice = cibleIndiceDeReference(dossier)
		const repliques = cibleRepliquesDeReference(dossier)
		const plan = ciblePlanDeReference(dossier)

		// @ts-expect-error — 1/5 : charge de PROSE.
		await service.demander(dossier, { role: ROLE_DISTRIBUTION, entiteId: prose.entiteId, champ: prose.champ })
		// @ts-expect-error — 2/5 : charge d'INDICE.
		await service.demander(dossier, { role: ROLE_DISTRIBUTION, indiceId: indice.indiceId })
		// @ts-expect-error — 3/5 : charge de PERSONNAGE.
		await service.demander(dossier, { role: ROLE_DISTRIBUTION, personnageId: repliques.personnageId })
		// @ts-expect-error — 4/5 : charge d'ACTEUR.
		await service.demander(dossier, { role: ROLE_DISTRIBUTION, acteurId: plan.acteurId })
		// @ts-expect-error — 5/5 : ⚠ LE `dossierId` « PAR SYMÉTRIE », celui que le § 4.1
		// interdit nommément. Il ne compile pas, donc personne ne l'ajoutera « en
		// passant ».
		await service.demander(dossier, { role: ROLE_DISTRIBUTION, dossierId: dossier.id })

		// Discriminant : LA cible bien formée compile, elle. Sans cette moitié, les cinq
		// `@ts-expect-error` seraient satisfaits par n'importe quelle erreur de type, y
		// compris « `demander` n'existe pas ».
		await service.demander(dossier, CIBLE_DISTRIBUTION)
		expect(fetchMock).toHaveBeenCalled()
	})

	it('la cible VIDE ne se confond avec AUCUNE des cinq autres : elle n a AUCUNE charge', () => {
		// LA MESURE QUI JUSTIFIE LA 6ᵉ SURCHARGE, constatée en VALEUR : les cinq cibles
		// livrées portent toutes au moins une clé hors `role` ; celle-ci n'en porte
		// AUCUNE. Elle est donc DISJOINTE de toutes, par la charge ET par l'étiquette.
		const dossier = dossierDeReference()
		const cibles: Record<string, Record<string, unknown>> = {
			prose: { ...cibleDeReference(dossier) },
			indice: { ...cibleIndiceDeReference(dossier) },
			repliques: { ...cibleRepliquesDeReference(dossier) },
			plan: { ...ciblePlanDeReference(dossier) },
			relations: { ...cibleRelationsDeReference(dossier) },
			distribution: { ...CIBLE_DISTRIBUTION },
		}
		const charges = Object.fromEntries(
			Object.entries(cibles).map(([nom, cible]) => [
				nom,
				Object.keys(cible)
					.filter((cle) => cle !== 'role')
					.sort()
					.join('+'),
			]),
		)

		expect(charges.distribution).toBe('')
		expect(Object.entries(charges).filter(([nom, charge]) => nom !== 'distribution' && charge === '')).toEqual([])
		// Les SIX étiquettes sont deux à deux distinctes, et chacune vaut le segment de
		// route de son rôle.
		const etiquettes = Object.values(cibles).map((cible) => String(cible.role))
		expect(new Set(etiquettes).size).toBe(6)
		expect(etiquettes.sort()).toEqual(
			[ROLE, ROLE_DETENTEURS, ROLE_REPLIQUES, ROLE_PLAN, ROLE_RELATIONS, ROLE_DISTRIBUTION].sort(),
		)
	})

	it('la SIXIEME branche est ecrite aux DEUX sites, et la garde never tient toujours', () => {
		// ⚠ LA SURCHARGE SE POSE AUX DEUX SITES — l'interface publique ET
		// l'implémentation. En oublier un rend l'appel impossible côté feature alors que
		// `tsc` reste vert sur `brain/`, ce qu'aucun test de runtime ne dirait.
		const source = fs.readFileSync(path.join(__dirname, 'CopiloteService.ts'), 'utf8')
		const surcharges = source.match(/demander\(dossier: Dossier, cible: CibleDistribution/g) ?? []
		expect(surcharges).toHaveLength(2)
		// L'un est dans l'INTERFACE (indentation d'un tabulateur), l'autre dans la
		// FABRIQUE (déclaration de fonction) : ce sont bien DEUX sites, pas deux fois le
		// même lu deux fois.
		expect(source).toContain('\tdemander(dossier: Dossier, cible: CibleDistribution, signal?: AbortSignal)')
		expect(source).toContain('\tfunction demander(dossier: Dossier, cible: CibleDistribution, signal?: AbortSignal)')

		// LA GARDE `never`, et le dispatch à SIX branches. Découpage BORNÉ au `switch`
		// (KR-226) et ANCRÉ SUR LA LIGNE DE CODE, jamais sur la chaîne nue.
		const debutDispatch = source.indexOf('\t\tswitch (cible.role) {')
		const finDispatch = source.indexOf('\n\treturn {', debutDispatch)
		const dispatch = source.slice(debutDispatch, finDispatch)
		expect(dispatch).toContain('const _exhaustif: never = cible')
		const roles = [ROLE, ROLE_DETENTEURS, ROLE_REPLIQUES, ROLE_PLAN, ROLE_RELATIONS, ROLE_DISTRIBUTION]
		expect(roles.filter((role) => !dispatch.includes(`case '${role}':`))).toEqual([])
		expect(roles).toHaveLength(6)
		// ET IL N'Y A TOUJOURS PAS DE REPLI : le `default` ne délègue à aucune branche.
		expect(dispatch.slice(dispatch.indexOf('default:'))).not.toContain('demander')
		// Discriminant : le découpage porte sur du code réel et s'arrête AVANT le
		// `return { estDisponible, demander }` de la fabrique (KR-226).
		expect(dispatch).toContain('switch (cible.role) {')
		expect(dispatch).not.toContain('estDisponible:')
	})

	it('le dispatch suit l ETIQUETTE : la 6e cible part sur SA route, jamais sur une autre', async () => {
		// Le témoin de RUNTIME du dispatch, rejoué pour la 6ᵉ branche : l'étiquette
		// décide de la route ET du `role` du corps, que le worker indexe pour choisir
		// l'invite.
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(
			reponseWorker(sortieDistribution([{ place: PLACE_CONFORME, poursuite: POURSUITE_CONFORME }])),
		)
		await createCopiloteService(reglages()).demander(dossier, CIBLE_DISTRIBUTION)
		fetchMock.mockResolvedValue(reponseWorker(sortieRepliques(REPLIQUES_CONFORMES)))
		await createCopiloteService(reglages()).demander(dossier, cibleRepliquesDeReference(dossier))

		const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
		expect(urls).toEqual([`${URL_WORKER}/ia/${ROLE_DISTRIBUTION}`, `${URL_WORKER}/ia/${ROLE_REPLIQUES}`])
		const roles = fetchMock.mock.calls.map(
			(appel) => (JSON.parse(String((appel[1] as RequestInit).body)) as { role: string }).role,
		)
		expect(roles).toEqual([ROLE_DISTRIBUTION, ROLE_REPLIQUES])
	})
})

// ══ LE SEPTIÈME RÔLE — `interprete` (n° 10, `moteur-interprete`) ═════════════
describe('CopiloteService — le septieme role, interprete', () => {
	const ROLE_INTERPRETE = 'interprete'

	/** `lieu.foyer-du-guet` a DEUX accès dans la fixture de référence, dont un
	 *  SEUL décrit (`lieu.tour-effondree`) — le lieu sans description
	 *  (`lieu.marche-des-cendres`) ne reçoit aucun rang (KR-267). C'est le lieu
	 *  courant idéal pour ces tests : UN candidat rangé suffit à l'arité 1
	 *  d'`aller`. */
	function sessionDepuisFoyer(dossier: Dossier): EtatSession {
		return {
			schema: 1,
			dossier_id: dossier.id,
			dossier_maj: dossier.updatedAt,
			graine_alea: 1,
			horloge: { tour: 0 },
			monde: {
				lieu_courant: 'lieu.foyer-du-guet',
				lieux_visites: ['lieu.foyer-du-guet'],
				objets_possedes: [],
				indices_connus: [],
				jalons_atteints: [],
				evenements_consommes: [],
				pnj: {},
			},
			journal: [],
			memoire: null,
		}
	}

	it('un appel, resolu contre la table de CET appel — cibles[] ne franchit jamais le reseau', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)
		fetchMock.mockResolvedValue(reponseWorker({ geste: 'G1', designe: ['P1'] }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je vais a la tour',
			session,
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { lecture: 'commande', commande: { commande: 'aller', cibles: ['lieu.tour-effondree'] } },
		})
		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_INTERPRETE}`)
		const corps = JSON.parse(String(init.body)) as Record<string, unknown>
		expect(Object.keys(corps).sort()).toEqual(['contexte', 'role'])
		expect(String(init.body)).not.toContain('lieu.tour-effondree')
		expect(String(init.body)).not.toContain(dossier.id)
	})

	it('rejeu-un-coup : reponse fautive puis valide = 2 fetch, MEME corps, resolus contre la MEME table', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ texte: 'une cle renommee' }))
			.mockResolvedValueOnce(reponseWorker({ geste: 'G1', designe: ['P1'] }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je vais a la tour',
			session,
		})

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [, initUn] = fetchMock.mock.calls[0] as [string, RequestInit]
		const [, initDeux] = fetchMock.mock.calls[1] as [string, RequestInit]
		expect(JSON.parse(String(initUn.body))).toEqual(JSON.parse(String(initDeux.body)))
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { lecture: 'commande', commande: { commande: 'aller', cibles: ['lieu.tour-effondree'] } },
		})
	})

	it('deux reponses fautives = illisible, avec le motif du SECOND echec', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)
		fetchMock.mockResolvedValue(reponseWorker({ geste: 'G1', designe: ['P1', 'P2'] })) // arite fautive, motif schema

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je vais a la tour',
			session,
		})

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
	})

	it('503/413/reseau/abandon = UN SEUL fetch, jamais un rejeu', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)

		fetchMock.mockResolvedValueOnce(reponseWorker({}, 503))
		const surIndisponible = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'x',
			session,
		})
		expect(surIndisponible).toEqual({ statut: 'indisponible', raison: 'non-configure' })

		fetchMock.mockRejectedValueOnce(new Error('reseau'))
		const surReseau = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'x',
			session,
		})
		expect(surReseau).toEqual({ statut: 'indisponible', raison: 'injoignable' })

		expect(fetchMock).toHaveBeenCalledTimes(2) // un par appel `demander`, jamais un rejeu
	})

	it('impasse : le court-circuit de l it1 est MORT — agir y est range, et le fetch part', async () => {
		// ⚠ RÉÉCRIT À L'IT2. Ce témoin prouvait « aucun geste satisfiable ⇒ `sans_commande`
		// SANS AUCUN fetch ». `agir` (arité 0) est TOUJOURS satisfiable : la branche est
		// devenue inatteignable et a été RETIRÉE du service (KR-235). Sur le MÊME état —
		// `lieu.crypte-scellee`, AUCUN accès —, l'appel part désormais, et un `agir`
		// rendu par le modèle se résout en commande d'arité 0.
		const dossier = dossierDeReference()
		const session: EtatSession = {
			...sessionDepuisFoyer(dossier),
			monde: { ...sessionDepuisFoyer(dossier).monde, lieu_courant: 'lieu.crypte-scellee' },
		}
		fetchMock.mockResolvedValue(reponseWorker({ geste: 'G1', designe: [] }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je fouille la crypte',
			session,
		})

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { lecture: 'commande', commande: { commande: 'agir', cibles: [] } },
		})
		// Et le court-circuit a quitté la SOURCE, pas seulement le comportement.
		const source = fs.readFileSync(path.join(__dirname, 'CopiloteService.ts'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
		expect(source).not.toContain('tables.gestes.size === 0')
	})

	it('agir est atteignable : un geste d arite 0 et un designe VIDE traversent validation et resolution', async () => {
		// CRITÈRE 1 DU PLAN, MOITIÉ CONTRAT : l'invite amendée rend `agir` atteignable, et
		// le client l'ACCEPTE — sur un lieu qui a aussi des accès, où `aller` est `G1` et
		// `agir` `G2`. Un `designe` non vide sur `agir` est une arité fautive, refusée.
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)
		fetchMock.mockResolvedValue(reponseWorker({ geste: 'G2', designe: [] }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je fouille la cendre',
			session,
		})

		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { lecture: 'commande', commande: { commande: 'agir', cibles: [] } },
		})

		fetchMock.mockReset()
		fetchMock.mockResolvedValue(reponseWorker({ geste: 'G2', designe: ['P1'] }))
		const fautif = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je fouille la cendre',
			session,
		})
		expect(fautif).toEqual({ statut: 'illisible', motif: 'schema' })
		expect(fetchMock).toHaveBeenCalledTimes(2)
	})

	it('une saisie de plus de 300 caracteres est refusee AVANT tout fetch, motif trop-long', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)

		const reponse = await createCopiloteService(reglages()).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'x'.repeat(301),
			session,
		})

		expect(fetchMock).not.toHaveBeenCalled()
		expect(reponse).toEqual({ statut: 'refuse', motif: 'trop-long' })
	})

	it('une configuration incomplete rend indisponible non-configure, sans aucun appel', async () => {
		const dossier = dossierDeReference()
		const session = sessionDepuisFoyer(dossier)

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, {
			role: ROLE_INTERPRETE,
			saisie: 'je vais a la tour',
			session,
		})

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

// ══ LE HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2 puis it3) ═════
//
// LE CONTRAT QUE L'ORCHESTRATEUR CONSOMME TEL QUEL : l'ordre des effets (refus de contexte
// ⇒ configuration ⇒ un appel ⇒ rejeu exactement une fois sur la FORME du bloc atomique),
// la forme du corps sur le fil, la re-résolution (renommage de destination + `Map.get` des
// ancres), la GARDE À DEUX NIVEAUX du condensé, et CE QUE LE SERVICE NE FAIT PAS — il
// n'écrit jamais la session qu'il reçoit : sur tout échec, le pas reste acquis.
describe('CopiloteService — le huitieme role, narrateur', () => {
	const ROLE_NARRATEUR = 'narrateur'
	const NARRATION = 'Vous fouillez la cendre froide du foyer ; rien ne bouge, et le beffroi reste muet.'
	const TENTATIVES = ['Monter vers la tour', 'Interroger le village']
	const CONDENSE = 'Vous avez longtemps veillé au foyer, sans que rien ne vienne troubler la cendre.'

	/** Une session JOUÉE par le produit sur le dossier de référence — jamais forgée. */
	function jouer(dossier: Dossier, saisies: readonly string[]): EtatSession {
		const ouverture = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!ouverture.ok) throw new Error(`ouverture refusée : ${ouverture.refus}`)
		return saisies.reduce((session, saisie) => {
			const analyse = analyserSaisie(saisie)
			if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
			const resultat = executerCommande(dossier, session, analyse.commande)
			if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
			return resultat.session
		}, ouverture.session)
	}

	/** Le pas 15 : la tranche 1-10 est DUE — le seul état où le condensé est demandé. */
	const auPas15 = (dossier: Dossier): EtatSession =>
		jouer(
			dossier,
			Array.from({ length: 15 }, () => 'AGIR'),
		)

	function cible(session: EtatSession, saisie = 'je fouille la cendre'): CibleNarrateur {
		return { role: ROLE_NARRATEUR, saisie, session }
	}

	/** Une réponse du modèle CONFORME à la première forme — sans condensé. */
	const conforme = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
		narration: NARRATION,
		tentatives: TENTATIVES,
		constats: [],
		...extra,
	})

	it('un appel, corps EXACTEMENT {role, contexte}, et la proposition RENOMMEE vers sa destination', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		fetchMock.mockResolvedValue(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		// LE RENOMMAGE EST LA RÉ-RÉSOLUTION : `narration` → `recit`, `tentatives` →
		// `suggestions`, `constats` → `faits_etablis`. Aucune réparation, et AUCUN `resume` :
		// rien n'était à condenser au pas 1.
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { recit: NARRATION, suggestions: TENTATIVES, faits_etablis: [] },
		})
		expect(reponse.statut === 'propose' && 'resume' in reponse.proposition).toBe(false)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_NARRATEUR}`)
		// `toEqual` SUR LE CORPS ENTIER, jamais une inclusion : `{ ...cible, contexte }`
		// mettrait la SESSION sur le fil, et une inclusion resterait verte sur la clé en trop.
		const contexte = assemblerNarrateur(dossier, cible(session))
		if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
		expect(JSON.parse(String(init.body))).toEqual({ role: ROLE_NARRATEUR, contexte: contexte.texte })
		// Rien de la SESSION ne franchit le réseau telle quelle : ni un identifiant, ni une
		// ligne de journal, ni la graine, ni l'horloge.
		const corps = String(init.body)
		for (const interdit of [dossier.id, 'lieu.foyer-du-guet', '> AGIR', 'lieu_courant', 'origine', '424242']) {
			expect(`${interdit} → ${corps.includes(interdit)}`).toBe(`${interdit} → false`)
		}
	})

	it('les ancres des constats sont RE-RESOLUES par la table de l assembleur : faits_etablis porte des identifiants', async () => {
		// La table est CELLE DE CET APPEL (KR-231) : au foyer, A1 est le lieu courant.
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		const contexte = assemblerNarrateur(dossier, cible(session))
		if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
		expect(contexte.ancres.get('A1')).toBe('lieu.foyer-du-guet')
		fetchMock.mockResolvedValue(
			reponseWorker(conforme({ constats: [{ phrase: 'Une braise couve sous la cendre.', ancres: ['A1'] }] })),
		)

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(reponse).toEqual({
			statut: 'propose',
			proposition: {
				recit: NARRATION,
				suggestions: TENTATIVES,
				faits_etablis: [{ fait: 'Une braise couve sous la cendre.', sur: ['lieu.foyer-du-guet'] }],
			},
		})
	})

	it('une liste de tentatives VIDE et une liste de constats VIDE sont un succes', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(conforme({ tentatives: [] })))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier, ['AGIR'])))

		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { recit: NARRATION, suggestions: [], faits_etablis: [] },
		})
	})

	it('rejeu-un-coup : une reponse fautive puis une valide = 2 fetch, MEME corps', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ narration: 'Que faites-vous ?' })))
			.mockResolvedValueOnce(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [, un] = fetchMock.mock.calls[0] as [string, RequestInit]
		const [, deux] = fetchMock.mock.calls[1] as [string, RequestInit]
		expect(JSON.parse(String(un.body))).toEqual(JSON.parse(String(deux.body)))
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { recit: NARRATION, suggestions: TENTATIVES, faits_etablis: [] },
		})
	})

	it('deux reponses fautives = illisible, avec le motif du SECOND echec, et jamais un troisieme appel', async () => {
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ narration: 'Que faites-vous ?' }))) // schema
			.mockResolvedValueOnce(reponseWorker(conforme({ narration: 'Le sceau objet.sceau-de-cendre luit.' }))) // identifiant
			.mockResolvedValueOnce(reponseWorker(conforme())) // jamais atteint

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier, ['AGIR'])))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'identifiant' })
	})

	it('un constat fautif refuse le LOT : rejeu, puis illisible rang-inconnu — aucun fait, aucun recit (KR-230)', async () => {
		const dossier = dossierDeReference()
		const fautif = conforme({ constats: [{ phrase: 'Un fait sur rien de connu.', ancres: ['A9'] }] })
		fetchMock.mockResolvedValue(reponseWorker(fautif))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier, ['AGIR'])))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
	})

	it('503, 413 et reseau = UN SEUL fetch chacun, jamais un rejeu', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		const service = createCopiloteService(reglages())

		fetchMock.mockResolvedValueOnce(reponseWorker({}, 503))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		fetchMock.mockResolvedValueOnce(reponseWorker({ erreur: 'trop-grand' }, 413))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'injoignable' })
		fetchMock.mockRejectedValueOnce(new Error('reseau'))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'injoignable' })

		expect(fetchMock).toHaveBeenCalledTimes(3)
	})

	it('les DEUX refus de contexte partent AVANT tout appel — meme worker non configure : ils nomment ce qui manque', async () => {
		const dossier = dossierDeReference()
		// `cible-a-ecrire` — ÉTAT RÉEL : la vigie du dossier de référence n'a pas de
		// description, et le produit y mène en deux pas.
		const vigie = jouer(dossier, ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'])
		// `trop-long` — une saisie qui fait déborder la borne.
		const bavarde = cible(jouer(dossier, ['AGIR']), 'x'.repeat(BUDGET_CARACTERES_NARRATEUR))

		for (const service of [createCopiloteService(reglages()), createCopiloteService(reglages(null, null))]) {
			expect(await service.demander(dossier, cible(vigie))).toEqual({ statut: 'refuse', motif: 'cible-a-ecrire' })
			expect(await service.demander(dossier, bavarde)).toEqual({ statut: 'refuse', motif: 'trop-long' })
		}
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('une configuration incomplete rend indisponible non-configure, sans aucun appel', async () => {
		const dossier = dossierDeReference()

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, cible(jouer(dossier, ['AGIR'])))

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('sur TOUT echec, le pas reste acquis : la session recue n est jamais ecrite, aucun recit n apparait', async () => {
		// Le service ne rend JAMAIS de session ; ce qui se prouve ici est qu'il ne MUTE pas
		// celle qu'il reçoit — ni son journal, ni une entrée, ni sa mémoire, sur aucune des
		// trois branches d'échec (refus, indisponible, illisible).
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		const avant = JSON.stringify(session)
		const service = createCopiloteService(reglages())

		fetchMock.mockResolvedValue(reponseWorker(conforme({ narration: 'Que faites-vous ?' })))
		const illisible = await service.demander(dossier, cible(session))
		fetchMock.mockReset()
		fetchMock.mockResolvedValue(reponseWorker({}, 503))
		const indisponible = await service.demander(dossier, cible(session))
		const refuse = await service.demander(dossier, cible(session, 'x'.repeat(BUDGET_CARACTERES_NARRATEUR)))

		expect([illisible.statut, indisponible.statut, refuse.statut]).toEqual(['illisible', 'indisponible', 'refuse'])
		// Aucune de ces réponses ne porte de proposition — c'est le TYPAGE qui l'interdit.
		expect([illisible, indisponible, refuse].filter((reponse) => 'proposition' in reponse)).toEqual([])
		expect(JSON.stringify(session)).toBe(avant)
		expect(session.journal.some((entree) => entree.recit !== undefined)).toBe(false)
		expect(session.memoire).toBeNull()
		expect(session.horloge.tour).toBe(1)
	})

	it('sur etat terminal du huitieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(conforme({ narration: '', tentatives: [] })))

		const reponse = await brain.copilote.demander(dossier, cible(jouer(dossier, ['AGIR'])))

		expect(reponse).toEqual({ statut: 'illisible', motif: 'vide' })
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})

	it('la memoire part sur le fil par le SEUL contexte : au pas 20, le recit du pas 19 y est, celui du pas 3 non', async () => {
		// REMPLACE le témoin « sans mémoire » d'it2 (pas 2 = pas 40) par SON INVERSE, vu du
		// FIL : le corps grandit avec la fenêtre — jamais avec toute la partie — et il reste
		// EXACTEMENT `{role, contexte}`. Condensation réussie au pas 15.
		const dossier = dossierDeReference()
		let session = jouer(dossier, [])
		for (let pas = 1; pas <= 20; pas += 1) {
			const analyse = analyserSaisie('AGIR')
			if (!analyse.ok) throw new Error('AGIR refusé')
			const resultat = executerCommande(dossier, session, analyse.commande)
			if (!resultat.ok) throw new Error('AGIR refusé')
			if (pas === 20) {
				session = resultat.session
				break
			}
			session = consignerNarration(resultat.session, pas, {
				recit: `Recit du pas ${'i'.repeat(pas)}.`,
				faits_etablis: [],
				...(pas === 15 ? { resume: { texte: 'Vous avez veillé.', jusqu_au_pas: 10 } } : {}),
			})
		}
		fetchMock.mockResolvedValue(reponseWorker(conforme()))

		await createCopiloteService(reglages()).demander(dossier, cible(session))

		const [, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		const corps = JSON.parse(String(init.body)) as { role: string; contexte: string }
		expect(Object.keys(corps).sort()).toEqual(['contexte', 'role'])
		expect(corps.contexte).toContain(`Recit du pas ${'i'.repeat(19)}.`)
		expect(corps.contexte).toContain('Vous avez veillé.')
		expect(corps.contexte).not.toContain(`Recit du pas ${'i'.repeat(3)}.`)
		expect(corps.contexte).not.toContain(`Recit du pas ${'i'.repeat(10)}.`)
	})

	describe('la garde a DEUX niveaux — condense decouple du lot, jamais le recit (KR-271)', () => {
		it('condense du et valide : resume present, jusqu_au_pas POSE PAR LE CODE a la borne haute de la tranche', async () => {
			const dossier = dossierDeReference()
			const session = auPas15(dossier)
			const contexte = assemblerNarrateur(dossier, cible(session))
			if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
			expect(contexte.condensation).toEqual({ de: 1, a: 10 })
			fetchMock.mockResolvedValue(reponseWorker(conforme({ condense: CONDENSE })))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(fetchMock).toHaveBeenCalledTimes(1)
			expect(reponse).toEqual({
				statut: 'propose',
				proposition: {
					recit: NARRATION,
					suggestions: TENTATIVES,
					faits_etablis: [],
					resume: { texte: CONDENSE, jusqu_au_pas: 10 },
				},
			})
		})

		it('M4/M5/M6 — condense du mais INVALIDE ou ABSENT : recit propose, AUCUN resume, et UN SEUL fetch', async () => {
			// MUTANTS OBLIGATOIRES (plan § 7), vérifiés ROUGES puis rétablis :
			//  M4 — le condensé fautif refuse le lot : le récit disparaîtrait ;
			//  M5 — le condensé fautif pose quand même `resume`/`jusqu_au_pas` ;
			//  M6 — le refus du condensé déclenche un rejeu : deux `fetch` au lieu d'un.
			const dossier = dossierDeReference()
			const session = auPas15(dossier)
			for (const brut of [
				conforme(),
				conforme({ condense: 'Que reste-t-il ?' }),
				conforme({ condense: '   ' }),
				conforme({ condense: 42 }),
				conforme({ condense: 'Vous avez gardé objet.sceau-de-cendre.' }),
				conforme({ condense: 'Vous avez quitté A1.' }),
			]) {
				fetchMock.mockReset()
				fetchMock.mockResolvedValue(reponseWorker(brut))

				const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

				const etiquette = JSON.stringify(brut.condense ?? 'absent')
				expect(`${etiquette} → ${fetchMock.mock.calls.length}`).toBe(`${etiquette} → 1`)
				expect(`${etiquette} → ${JSON.stringify(reponse)}`).toBe(
					`${etiquette} → ${JSON.stringify({
						statut: 'propose',
						proposition: { recit: NARRATION, suggestions: TENTATIVES, faits_etablis: [] },
					})}`,
				)
			}
		})

		it('M7 — condense present alors que RIEN n etait du : refus du lot, rejeu, puis illisible schema', async () => {
			// MUTANT OBLIGATOIRE M7 (plan § 7) : un condensé non demandé accepté. Vérifié ROUGE.
			const dossier = dossierDeReference()
			fetchMock.mockResolvedValue(reponseWorker(conforme({ condense: CONDENSE })))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier, ['AGIR'])))

			expect(fetchMock).toHaveBeenCalledTimes(2)
			expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
		})

		it('M8 — AUCUNE composition entre deux essais : un condense valide a l essai REFUSE n est jamais recupere', async () => {
			// MUTANT OBLIGATOIRE M8 (plan § 7) : retenir le condensé du premier essai quand le
			// second est accepté — c'est fusionner deux sorties de modèle, donc réparer (KR-230).
			const dossier = dossierDeReference()
			const session = auPas15(dossier)
			fetchMock
				.mockResolvedValueOnce(reponseWorker(conforme({ narration: 'Que faites-vous ?', condense: CONDENSE })))
				.mockResolvedValueOnce(reponseWorker(conforme()))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(fetchMock).toHaveBeenCalledTimes(2)
			expect(reponse).toEqual({
				statut: 'propose',
				proposition: { recit: NARRATION, suggestions: TENTATIVES, faits_etablis: [] },
			})
			// Discriminant : le MÊME condensé, à l'essai accepté, est bien retenu.
			fetchMock.mockReset()
			fetchMock
				.mockResolvedValueOnce(reponseWorker(conforme({ narration: 'Que faites-vous ?' })))
				.mockResolvedValueOnce(reponseWorker(conforme({ condense: CONDENSE })))
			const retenu = await createCopiloteService(reglages()).demander(dossier, cible(session))
			expect(retenu.statut === 'propose' && retenu.proposition.resume).toEqual({ texte: CONDENSE, jusqu_au_pas: 10 })
		})

		it('M9 — un constat fautif ne se decouple JAMAIS : meme avec un condense valide, le lot tombe', async () => {
			const dossier = dossierDeReference()
			const session = auPas15(dossier)
			fetchMock.mockResolvedValue(
				reponseWorker(conforme({ constats: [{ phrase: 'Rien.', ancres: [] }], condense: CONDENSE })),
			)

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(fetchMock).toHaveBeenCalledTimes(2)
			expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
		})
	})

	it('la HUITIEME surcharge est ecrite aux DEUX sites, et la garde never tient toujours', () => {
		// AC#5 (it3) : récit, faits et résumé sortent du MÊME appel, par la MÊME branche.
		// ⚠ LE DÉCOMPTE TOTAL DU DISPATCH (« AUCUNE neuvième ») A MIGRÉ : ce n'est plus
		// cette branche-ci qui en porte l'instantané le plus récent — précédent exact de
		// la SIXIÈME branche, dont le test ne vérifie plus que SA PROPRE présence depuis
		// que la SEPTIÈME est entrée. Le décompte total vit désormais dans le bloc du
		// NEUVIÈME rôle (n° 11 `moteur-arbitre`, it2), qui migrera à son tour.
		const source = fs.readFileSync(path.join(__dirname, 'CopiloteService.ts'), 'utf8')
		// ⚠ DEUX SITES — l'interface publique ET l'implémentation. En oublier un rend
		// l'appel impossible côté feature alors que `tsc` reste vert sur `brain/`.
		expect(source.match(/demander\(dossier: Dossier, cible: CibleNarrateur/g) ?? []).toHaveLength(2)
		expect(source).toContain('\tdemander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal)')
		expect(source).toContain('\tfunction demander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal)')

		// LE DISPATCH, BORNÉ au `switch` et ANCRÉ sur la ligne de code (KR-226).
		const debut = source.indexOf('\t\tswitch (cible.role) {')
		const dispatch = source.slice(debut, source.indexOf('\n\treturn {', debut))
		expect(dispatch).toContain("case 'narrateur':")
		expect(dispatch).toContain('return demanderNarrateur(dossier, cible, signal)')
		expect(dispatch).toContain('const _exhaustif: never = cible')
		expect(dispatch.slice(dispatch.indexOf('default:'))).not.toContain('demander')
		// Et `jusquAuRejeuUnique` reste GÉNÉRIQUE — aucune branche propre au narrateur.
		const boucle = source.slice(
			source.indexOf('async function jusquAuRejeuUnique'),
			source.indexOf('function refuser('),
		)
		expect(boucle).not.toMatch(/narrat|condense|constat/i)
	})

	it('le dispatch suit l ETIQUETTE : narrateur et interprete, MEME charge, partent chacun sur SA route', async () => {
		// Les deux cibles portent EXACTEMENT la même charge `{saisie, session}` : seule
		// l'étiquette les sépare, et cela ne se constate que sur le FIL.
		const dossier = dossierDeReference()
		const session = jouer(dossier, ['AGIR'])
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ tentatives: [] })))
			.mockResolvedValueOnce(reponseWorker({ sans_commande: true }))
		const service = createCopiloteService(reglages())

		await service.demander(dossier, { role: ROLE_NARRATEUR, saisie: 'je fouille', session })
		await service.demander(dossier, { role: 'interprete', saisie: 'je fouille', session })

		const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
		expect(urls).toEqual([`${URL_WORKER}/ia/narrateur`, `${URL_WORKER}/ia/interprete`])
		const roles = fetchMock.mock.calls.map(
			(appel) => (JSON.parse(String((appel[1] as RequestInit).body)) as { role: string }).role,
		)
		expect(roles).toEqual(['narrateur', 'interprete'])
	})
})

// ══ LE NEUVIÈME RÔLE — `arbitre` (n° 11 `moteur-arbitre`, it2) ══════════════
//
// AUCUNE RE-RÉSOLUTION PAR `Map.get` : `validerArbitre` rend DÉJÀ `PropositionEpreuve`
// (carac/tc narrowed par appartenance aux deux registres fermés) — le service la porte
// telle quelle, exactement comme pour `monde-distribution`. `CibleArbitre` N'A PAS de
// `session` : le héros et la mémoire sont inatteignables PAR COMPILATION.
describe('CopiloteService — le neuvieme role, arbitre', () => {
	const ROLE_ARBITRE = 'arbitre'
	const ENJEU_REUSSITE = 'forcer la porte sans bruit'
	const ENJEU_ECHEC = 'alerter ce qui veille derriere'

	/** Une session JOUÉE par le produit, jusqu'au lieu de départ — jamais forgée. */
	function jouer(dossier: Dossier, saisies: readonly string[] = []): EtatSession {
		const ouverture = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!ouverture.ok) throw new Error(`ouverture refusée : ${ouverture.refus}`)
		return saisies.reduce((session, saisie) => {
			const analyse = analyserSaisie(saisie)
			if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
			const resultat = executerCommande(dossier, session, analyse.commande)
			if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
			return resultat.session
		}, ouverture.session)
	}

	function cible(lieuId: string, saisie = 'je force la porte'): CibleArbitre {
		return { role: ROLE_ARBITRE, saisie, lieuId }
	}

	const conforme = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
		epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC },
		...extra,
	})

	it('un appel, corps EXACTEMENT {role, contexte}, et la proposition PORTEE TELLE QUELLE (aucune re-resolution)', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier)
		fetchMock.mockResolvedValue(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session.monde.lieu_courant))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: {
				epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC },
			},
		})

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_ARBITRE}`)
		// `toEqual` SUR LE CORPS ENTIER, jamais une inclusion : `{ ...cible, contexte }`
		// mettrait `lieuId` sur le fil, et une inclusion resterait verte sur la clé en trop.
		const contexte = assemblerArbitre(dossier, cible(session.monde.lieu_courant))
		if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
		expect(JSON.parse(String(init.body))).toEqual({ role: ROLE_ARBITRE, contexte: contexte.texte })
		// `CibleArbitre` N'A PAS de session : rien d'un héros ni d'une partie en cours ne
		// peut franchir le réseau — vérifié quand même, en DÉFENSE.
		const corps = String(init.body)
		for (const interdit of [dossier.id, '424242', 'heros', 'caracs']) {
			expect(`${interdit} → ${corps.includes(interdit)}`).toBe(`${interdit} → false`)
		}
	})

	it('sans_epreuve traverse TEL QUEL, sans rejeu', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ sans_epreuve: true }))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier).monde.lieu_courant))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		expect(reponse).toEqual({ statut: 'propose', proposition: { sans_epreuve: true } })
	})

	it('rejeu-un-coup : une reponse fautive puis une valide = 2 fetch, MEME corps', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ pourquoi: 'un echo interdit' })))
			.mockResolvedValueOnce(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session.monde.lieu_courant))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [, un] = fetchMock.mock.calls[0] as [string, RequestInit]
		const [, deux] = fetchMock.mock.calls[1] as [string, RequestInit]
		expect(JSON.parse(String(un.body))).toEqual(JSON.parse(String(deux.body)))
		expect(reponse).toEqual({
			statut: 'propose',
			proposition: { epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC } },
		})
	})

	it('deux reponses fautives = illisible, avec le motif du SECOND echec, et jamais un troisieme appel', async () => {
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ pourquoi: 'x' }))) // schema (cle en trop, top-level)
			.mockResolvedValueOnce(
				reponseWorker({
					epreuve: { carac: 'FO', tc: 'TC2', enjeu_reussite: 'tenir 7 secondes', enjeu_echec: ENJEU_ECHEC },
				}),
			) // identifiant (chiffre, DANS enjeu_reussite)
			.mockResolvedValueOnce(reponseWorker(conforme())) // jamais atteint

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(jouer(dossier).monde.lieu_courant))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'identifiant' })
	})

	it('503, 413 et reseau = UN SEUL fetch chacun, jamais un rejeu', async () => {
		const dossier = dossierDeReference()
		const lieuId = jouer(dossier).monde.lieu_courant
		const service = createCopiloteService(reglages())

		fetchMock.mockResolvedValueOnce(reponseWorker({}, 503))
		expect(await service.demander(dossier, cible(lieuId))).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		fetchMock.mockResolvedValueOnce(reponseWorker({ erreur: 'trop-grand' }, 413))
		expect(await service.demander(dossier, cible(lieuId))).toEqual({ statut: 'indisponible', raison: 'injoignable' })
		fetchMock.mockRejectedValueOnce(new Error('reseau'))
		expect(await service.demander(dossier, cible(lieuId))).toEqual({ statut: 'indisponible', raison: 'injoignable' })

		expect(fetchMock).toHaveBeenCalledTimes(3)
	})

	it('les DEUX refus de contexte partent AVANT tout appel, meme worker non configure', async () => {
		const dossier = dossierDeReference()
		// `cible-a-ecrire` — ÉTAT RÉEL : la vigie du dossier de référence n'a pas de
		// description, et le produit y mène en deux pas.
		const vigie = jouer(dossier, ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'])
		// `trop-long` — une saisie qui fait déborder la borne.
		const bavarde = cible(jouer(dossier).monde.lieu_courant, 'x'.repeat(BUDGET_CARACTERES_ARBITRE))

		for (const service of [createCopiloteService(reglages()), createCopiloteService(reglages(null, null))]) {
			expect(await service.demander(dossier, cible(vigie.monde.lieu_courant))).toEqual({
				statut: 'refuse',
				motif: 'cible-a-ecrire',
			})
			expect(await service.demander(dossier, bavarde)).toEqual({ statut: 'refuse', motif: 'trop-long' })
		}
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('une configuration incomplete rend indisponible non-configure, sans aucun appel', async () => {
		const dossier = dossierDeReference()

		const reponse = await createCopiloteService(reglages(null, null)).demander(
			dossier,
			cible(jouer(dossier).monde.lieu_courant),
		)

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('sur etat terminal du neuvieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(conforme({ pourquoi: 'un echo interdit' })))

		const reponse = await brain.copilote.demander(dossier, cible(jouer(dossier).monde.lieu_courant))

		expect(reponse.statut).toBe('illisible')
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})

	it('la NEUVIEME surcharge est ecrite aux DEUX sites, et la garde never ferme toujours l union — UNE DIXIEME EXISTE DESORMAIS (n 12)', () => {
		const source = fs.readFileSync(path.join(__dirname, 'CopiloteService.ts'), 'utf8')
		// ⚠ DEUX SITES — l'interface publique ET l'implémentation.
		expect(source.match(/demander\(dossier: Dossier, cible: CibleArbitre/g) ?? []).toHaveLength(2)
		expect(source).toContain('\tdemander(dossier: Dossier, cible: CibleArbitre, signal?: AbortSignal)')
		expect(source).toContain('\tfunction demander(dossier: Dossier, cible: CibleArbitre, signal?: AbortSignal)')

		const debut = source.indexOf('\t\tswitch (cible.role) {')
		const dispatch = source.slice(debut, source.indexOf('\n\treturn {', debut))
		expect(dispatch).toContain("case 'arbitre':")
		expect(dispatch).toContain('return demanderArbitre(dossier, cible, signal)')
		expect(dispatch).toContain('const _exhaustif: never = cible')
		// DIX branches, une par étiquette (n° 12 `moteur-acteurs`, it1 ajoute `acteur`) —
		// et le `default` ne délègue toujours à rien.
		expect(dispatch.match(/\n\t\t\tcase '[a-z-]+':/g) ?? []).toHaveLength(10)
		expect(dispatch.slice(dispatch.indexOf('default:'))).not.toContain('demander')
		// Et `jusquAuRejeuUnique` reste GÉNÉRIQUE — aucune branche propre à l'arbitre.
		const boucle = source.slice(
			source.indexOf('async function jusquAuRejeuUnique'),
			source.indexOf('function refuser('),
		)
		expect(boucle).not.toMatch(/epreuve|carac|enjeu/i)
	})

	it('le dispatch suit l ETIQUETTE : arbitre part sur SA route, jamais sur une autre', async () => {
		const dossier = dossierDeReference()
		const session = jouer(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme()))
			.mockResolvedValueOnce(reponseWorker({ tentatives: [], constats: [], narration: 'Vous avancez.' }))

		const service = createCopiloteService(reglages())
		await service.demander(dossier, cible(session.monde.lieu_courant))
		await service.demander(dossier, { role: 'narrateur', saisie: 'je force la porte', session })

		const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
		expect(urls).toEqual([`${URL_WORKER}/ia/arbitre`, `${URL_WORKER}/ia/narrateur`])
		const roles = fetchMock.mock.calls.map(
			(appel) => (JSON.parse(String((appel[1] as RequestInit).body)) as { role: string }).role,
		)
		expect(roles).toEqual(['arbitre', 'narrateur'])
	})
})

/**
 * LE DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1 puis it2, lot `contrat`).
 *
 * ⚠ SEUL RÔLE DONT LE SUCCÈS N'EST PAS ENVELOPPÉ `{statut:'propose', proposition}` —
 * `ReponseActeur` est rendue TELLE QUELLE (signature figée § 4 du plan). `replique`
 * n'est JAMAIS re-résolue (prose pure, inchangé depuis l'it1) ; `indices_reveles`,
 * LUI, L'EST DEPUIS L'IT2 — patron « catalogue borné » (KR-287) : le réseau porte des
 * RANGS (`S1…`), `demanderActeur` les re-résout en identifiants (`Map.get` sur la
 * table rendue par `assemblerActeur`), précédent exact `demanderDetenteurs`.
 */
describe('CopiloteService — le dixieme role, acteur', () => {
	const ROLE_ACTEUR = 'acteur'
	const REPLIQUE = "L'enclume ne chôme jamais, même quand le ciel s'assombrit."

	/** Une session OUVERTE par le produit — jamais forgée. Le départ de
	 *  `dossier-reference.json` est `lieu.foyer-du-guet`, où Harek (lot contrat d'it1)
	 *  est présent et identifié. */
	function ouverte(dossier: Dossier): EtatSession {
		const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
		return resultat.session
	}

	function cible(session: EtatSession, personnageId = 'pnj.harek-le-forgeron', saisie = 'bonjour'): CibleActeur {
		return { role: ROLE_ACTEUR, personnageId, saisie, session }
	}

	const conforme = (extra: Record<string, unknown> = {}): Record<string, unknown> => ({
		replique: REPLIQUE,
		indices_reveles: [],
		delta_confiance: 0,
		...extra,
	})

	it('un appel, corps EXACTEMENT {role, contexte}, et la REPONSE RENDUE TELLE QUELLE — SANS wrapper statut/proposition', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		fetchMock.mockResolvedValue(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(fetchMock).toHaveBeenCalledTimes(1)
		// ⚠ PAS DE `{statut:'propose', proposition}` — précédent des neuf rôles rompu
		// délibérément (§ 4 du plan, FIGÉ) : `ReponseActeur` est la réponse ELLE-MÊME.
		// `indices_reveles` VIDE et `delta_confiance: 0` sont un SUCCÈS (franchise
		// honnête, § 4 bis du plan).
		expect(reponse).toEqual({ replique: REPLIQUE, indices_reveles: [], delta_confiance: 0 })
		expect('statut' in reponse).toBe(false)

		const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit]
		expect(url).toBe(`${URL_WORKER}/ia/${ROLE_ACTEUR}`)
		// `toEqual` SUR LE CORPS ENTIER, jamais une inclusion : `{ ...cible, contexte }`
		// mettrait `session`/`personnageId` sur le fil (KR-231).
		const contexte = assemblerActeur(dossier, session, 'pnj.harek-le-forgeron', 'bonjour')
		if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
		expect(JSON.parse(String(init.body))).toEqual({ role: ROLE_ACTEUR, contexte: contexte.texte })
		// `CibleActeur` PORTE une session entière : rien d'elle ne doit franchir le réseau
		// — vérifié en DÉFENSE.
		const corps = String(init.body)
		for (const interdit of [dossier.id, '424242', 'pnj.harek-le-forgeron', 'heros']) {
			expect(`${interdit} → ${corps.includes(interdit)}`).toBe(`${interdit} → false`)
		}
	})

	it('rejeu-un-coup : une reponse fautive puis une valide = 2 fetch, MEME corps', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ ton: 'en trop' })))
			.mockResolvedValueOnce(reponseWorker(conforme()))

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		const [, un] = fetchMock.mock.calls[0] as [string, RequestInit]
		const [, deux] = fetchMock.mock.calls[1] as [string, RequestInit]
		expect(JSON.parse(String(un.body))).toEqual(JSON.parse(String(deux.body)))
		expect(reponse).toEqual({ replique: REPLIQUE, indices_reveles: [], delta_confiance: 0 })
	})

	it('deux reponses fautives = illisible, avec le motif du SECOND echec, et jamais un troisieme appel', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme({ ton: 'x' }))) // schema (cle en trop)
			.mockResolvedValueOnce(reponseWorker(conforme({ replique: 'Revenez dans 7 jours.' }))) // identifiant (chiffre)
			.mockResolvedValueOnce(reponseWorker(conforme())) // jamais atteint

		const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'identifiant' })
	})

	it('503, 413 et reseau = UN SEUL fetch chacun, jamais un rejeu', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		const service = createCopiloteService(reglages())

		fetchMock.mockResolvedValueOnce(reponseWorker({}, 503))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		fetchMock.mockResolvedValueOnce(reponseWorker({ erreur: 'trop-grand' }, 413))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'injoignable' })
		fetchMock.mockRejectedValueOnce(new Error('reseau'))
		expect(await service.demander(dossier, cible(session))).toEqual({ statut: 'indisponible', raison: 'injoignable' })

		expect(fetchMock).toHaveBeenCalledTimes(3)
	})

	it('les DEUX refus de contexte partent AVANT tout appel, meme worker non configure', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		// `cible-a-ecrire` — un PNJ SANS aucune prose d'identité (fiction : Aubry
		// l'intendant, présent nulle part et sans `fonction`/`apparence` dans la fixture).
		const sansIdentite = cible(session, 'pnj.aubry-l-intendant')
		// `trop-long` — une saisie qui fait déborder la borne.
		const bavarde = cible(session, 'pnj.harek-le-forgeron', 'x'.repeat(BUDGET_CARACTERES_ACTEUR))

		for (const service of [createCopiloteService(reglages()), createCopiloteService(reglages(null, null))]) {
			expect(await service.demander(dossier, sansIdentite)).toEqual({ statut: 'refuse', motif: 'cible-a-ecrire' })
			expect(await service.demander(dossier, bavarde)).toEqual({ statut: 'refuse', motif: 'trop-long' })
		}
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('une configuration incomplete rend indisponible non-configure, sans aucun appel', async () => {
		const dossier = dossierDeReference()

		const reponse = await createCopiloteService(reglages(null, null)).demander(dossier, cible(ouverte(dossier)))

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('sur etat terminal du dixieme role : update, persistance et bus restent muets', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker(conforme({ ton: 'en trop' })))

		const reponse = await brain.copilote.demander(dossier, cible(ouverte(dossier)))

		expect('statut' in reponse && reponse.statut).toBe('illisible')
		expect(espions.update).not.toHaveBeenCalled()
		expect(espions.set).not.toHaveBeenCalled()
		expect(espions.emit).not.toHaveBeenCalled()
	})

	it('le dispatch suit l ETIQUETTE : acteur part sur SA route, jamais sur une autre', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)
		fetchMock
			.mockResolvedValueOnce(reponseWorker(conforme()))
			.mockResolvedValueOnce(reponseWorker({ tentatives: [], constats: [], narration: 'Vous avancez.' }))

		const service = createCopiloteService(reglages())
		await service.demander(dossier, cible(session))
		await service.demander(dossier, { role: 'narrateur', saisie: 'je regarde', session })

		const urls = fetchMock.mock.calls.map((appel) => String(appel[0]))
		expect(urls).toEqual([`${URL_WORKER}/ia/acteur`, `${URL_WORKER}/ia/narrateur`])
	})

	/**
	 * `delta_confiance` — PASSTHROUGH IDENTIQUE depuis `SortieActeurBrute` vers
	 * `ReponseActeur` (it3, `docs/REGLES-DU-JEU.md` § 6, KR-231) : AUCUNE
	 * re-résolution, contrairement aux rangs de `indices_reveles` ci-dessous.
	 */
	it('demanderActeur : delta_confiance passe IDENTIQUE de SortieActeurBrute a ReponseActeur, pour les TROIS valeurs legales', async () => {
		const dossier = dossierDeReference()
		const session = ouverte(dossier)

		for (const legal of [-1, 0, 1] as const) {
			fetchMock.mockResolvedValue(reponseWorker(conforme({ delta_confiance: legal })))
			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))
			expect(reponse).toEqual({ replique: REPLIQUE, indices_reveles: [], delta_confiance: legal })
		}
	})

	/**
	 * LA RE-RÉSOLUTION DES RANGS (it2) — patron « catalogue borné » (KR-287),
	 * précédent exact `demanderDetenteurs`. Harek (`dossier-reference.json`, lot
	 * contrat d'it2) porte un savoir gardé par `contrepartie`(consomme:false) +
	 * `apres_indice_id` en conjonction — le seul PNJ atteignable à porter cette
	 * conjonction aujourd'hui.
	 */
	describe('CopiloteService — dixieme role, la re-resolution des rangs (it2, catalogue borne KR-287)', () => {
		const INDICE_REVELABLE = 'indice.sceau-brise-a-nouveau'

		function sessionPortesOuvertes(dossier: Dossier): EtatSession {
			const base = ouverte(dossier)
			return {
				...base,
				monde: {
					...base.monde,
					objets_possedes: ['objet.amulette-scellee'],
					indices_connus: ['indice.pas-dans-la-cendre'],
				},
			}
		}

		it('un rang cite par le modele est re-resolu en IDENTIFIANT — jamais un rang brut dans la reponse', async () => {
			const dossier = dossierDeReference()
			const session = sessionPortesOuvertes(dossier)
			const contexte = assemblerActeur(dossier, session, 'pnj.harek-le-forgeron', 'bonjour')
			if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
			expect(contexte.rangs.get('S1')).toBe(INDICE_REVELABLE)

			fetchMock.mockResolvedValue(reponseWorker({ replique: REPLIQUE, indices_reveles: ['S1'], delta_confiance: 0 }))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			// Le rang `S1` vit SEULEMENT dans la conversation avec le modèle (le contexte
			// assemblé le PROPOSE) ; ce que la feature REÇOIT EN RETOUR est l'IDENTIFIANT
			// re-résolu, jamais le rang brut.
			expect(reponse).toEqual({ replique: REPLIQUE, indices_reveles: [INDICE_REVELABLE], delta_confiance: 0 })
			expect((reponse as { indices_reveles: readonly string[] }).indices_reveles).not.toContain('S1')
		})

		it('un rang hors de rangsOuverts (invente) est refuse ATOMIQUEMENT — rejeu puis illisible', async () => {
			const dossier = dossierDeReference()
			const session = sessionPortesOuvertes(dossier)
			fetchMock.mockResolvedValue(reponseWorker({ replique: REPLIQUE, indices_reveles: ['S9'], delta_confiance: 0 }))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(fetchMock).toHaveBeenCalledTimes(2)
			expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
		})

		it('un rang pris dans CE QUE TU LUI AS DEJA CONFIE (jamais dans rangsOuverts) est refuse comme un rang invente', async () => {
			const dossier = dossierDeReference()
			const base = sessionPortesOuvertes(dossier)
			// Harek l a DEJA confie son seul savoir ouvrable : plus rien a offrir.
			const session: EtatSession = {
				...base,
				monde: { ...base.monde, pnj: { 'pnj.harek-le-forgeron': { a_dit: [INDICE_REVELABLE] } } },
			}
			const contexte = assemblerActeur(dossier, session, 'pnj.harek-le-forgeron', 'bonjour')
			if (!contexte.ok) throw new Error(`contexte refusé : ${contexte.motif}`)
			expect(contexte.rangs.size).toBe(0)

			fetchMock.mockResolvedValue(reponseWorker({ replique: REPLIQUE, indices_reveles: ['S1'], delta_confiance: 0 }))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(reponse).toEqual({ statut: 'illisible', motif: 'rang-inconnu' })
		})

		it('indices_reveles VIDE reste un succes meme quand un rang est offert — la franchise n est jamais un refus', async () => {
			const dossier = dossierDeReference()
			const session = sessionPortesOuvertes(dossier)
			fetchMock.mockResolvedValue(reponseWorker({ replique: REPLIQUE, indices_reveles: [], delta_confiance: 0 }))

			const reponse = await createCopiloteService(reglages()).demander(dossier, cible(session))

			expect(reponse).toEqual({ replique: REPLIQUE, indices_reveles: [], delta_confiance: 0 })
		})
	})
})
