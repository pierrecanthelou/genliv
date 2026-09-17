import fs from 'node:fs'
import path from 'node:path'
import { createBrain } from './BrainContext'
import type { CloudSettingsService } from './CloudSettingsService'
import { createCopiloteService, type CibleCopilote } from './CopiloteService'
import { MARQUEUR_A_ECRIRE } from './dossier/amorce'
import type { Dossier } from './dossier/types'
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
	return { entiteId: personnage.id, champ: 'monde.personnages[].apparence' }
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

		const reponse = await createCopiloteService(reglages(null, null)).demander(ROLE, dossier, cibleDeReference(dossier))

		expect(reponse).toEqual({ statut: 'indisponible', raison: 'non-configure' })
		expect(fetchMock).not.toHaveBeenCalled()
	})
})

describe('CopiloteService — un appel sur reponse conforme', () => {
	it('un seul appel, et la proposition est RE-RESOLUE cote client', async () => {
		const dossier = dossierDeReference()
		const cible = cibleDeReference(dossier)
		fetchMock.mockResolvedValue(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cible)

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

		await createCopiloteService(reglages()).demander(ROLE, dossier, cible)

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

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

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

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse).toEqual({ statut: 'illisible', motif: 'schema' })
	})

	it('le motif rendu est celui du SECOND echec, jamais du premier', async () => {
		const dossier = dossierDeReference()
		fetchMock
			.mockResolvedValueOnce(reponseWorker({ texte: 'une clé renommée' }))
			.mockResolvedValueOnce(reponseWorker({ valeur: `${MARQUEUR_A_ECRIRE} à rédiger` }))

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

		expect(reponse).toEqual({ statut: 'illisible', motif: 'marqueur' })
	})

	it('un corps 200 illisible est une violation de FORME, donc rejouee', async () => {
		const dossier = dossierDeReference()
		const illisible = { ok: true, status: 200, json: async () => JSON.parse('pas du json') } as unknown as Response
		fetchMock.mockResolvedValueOnce(illisible).mockResolvedValueOnce(reponseWorker(sortieConforme()))

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

		expect(fetchMock).toHaveBeenCalledTimes(2)
		expect(reponse.statut).toBe('propose')
	})

	it('sur etat terminal : DossierService.update reste muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		const reponse = await brain.copilote.demander(ROLE, dossier, cibleDeReference(dossier))

		expect(reponse.statut).toBe('illisible')
		expect(espions.update).not.toHaveBeenCalled()
	})

	it('sur etat terminal : PersistenceService.set reste muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		await brain.copilote.demander(ROLE, dossier, cibleDeReference(dossier))

		expect(espions.set).not.toHaveBeenCalled()
	})

	it('sur etat terminal : le bus est muet', async () => {
		const { brain, espions } = brainEspionne()
		const dossier = dossierDeReference()
		fetchMock.mockResolvedValue(reponseWorker({ valeur: '' }))

		await brain.copilote.demander(ROLE, dossier, cibleDeReference(dossier))

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

			const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

			expect(`${status} → ${JSON.stringify(reponse)}`).toBe(
				`${status} → ${JSON.stringify({ statut: 'indisponible', raison })}`,
			)
			expect(`${status} → ${fetchMock.mock.calls.length}`).toBe(`${status} → 1`)
		}
	})

	it('une panne reseau rend indisponible injoignable, en un seul appel', async () => {
		const dossier = dossierDeReference()
		fetchMock.mockRejectedValue(new Error('réseau coupé'))

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier))

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

		const enVol = createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier), appelant.signal)
		appelant.abort()

		await expect(enVol).resolves.toEqual({ statut: 'indisponible', raison: 'annule' })
		expect(fetchMock).toHaveBeenCalledTimes(1)
	})

	it('un signal deja abandonne ne part meme pas sur le reseau', async () => {
		const dossier = dossierDeReference()
		const appelant = new AbortController()
		appelant.abort()

		const reponse = await createCopiloteService(reglages()).demander(
			ROLE,
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

		await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(dossier), appelant.signal)

		expect(retires).toEqual(['abort'])
	})
})

describe('CopiloteService — aucune memoire', () => {
	it('deux demandes independantes produisent des corps STRICTEMENT egaux', async () => {
		// FIXTURES DISJOINTES de celles du rejeu, et c'est obligatoire : réutiliser le
		// bouchon du rejeu ferait rejouer le premier test, et ce test-ci ne mesurerait
		// plus rien.
		const dossier = dossierDeReference()
		const cible: CibleCopilote = { entiteId: dossier.monde.personnages[0].id, champ: 'monde.personnages[].fonction' }
		fetchMock.mockResolvedValue(reponseWorker({ valeur: 'Gardienne du signal, seule a entretenir le mecanisme.' }))

		const service = createCopiloteService(reglages())
		await service.demander(ROLE, dossier, cible)
		await createCopiloteService(reglages()).demander(ROLE, dossier, cible)

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

		const reponse = await createCopiloteService(reglages()).demander(ROLE, dossier, cibleDeReference(reference))

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
	})

	it('le refus de contexte passe AVANT la disponibilite : il nomme ce qui manque', async () => {
		// L'ordre inverse ferait dire « indisponible » à un dossier dont il manque
		// seulement le ton — un diagnostic faux, et le premier que l'auteur verra.
		const reference = dossierDeReference()
		const dossier: Dossier = { ...reference, canon: { ...reference.canon, ton: MARQUEUR_A_ECRIRE } }

		const reponse = await createCopiloteService(reglages(null, null)).demander(
			ROLE,
			dossier,
			cibleDeReference(reference),
		)

		expect(reponse).toEqual({ statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' })
		expect(fetchMock).not.toHaveBeenCalled()
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
