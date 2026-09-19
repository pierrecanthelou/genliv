import fs from 'node:fs'
import path from 'node:path'
import { createBrain } from './BrainContext'
import type { CloudSettingsService } from './CloudSettingsService'
import {
	createCopiloteService,
	type CibleCopilote,
	type CibleIndice,
	type CiblePlan,
	type CibleRelations,
	type CibleRepliques,
} from './CopiloteService'
import { assemblerDetenteurs, assemblerRelations } from './copilote/contexte'
import { GABARIT_SORTIE } from './copilote/schemaSortie'
import { MARQUEUR_A_ECRIRE } from './dossier/amorce'
import { INTENSITE_INITIALE, type Dossier } from './dossier/types'
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

	it('la garde never rend un SIXIEME role sans branche NON COMPILABLE', () => {
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
		const roles = [ROLE, ROLE_DETENTEURS, ROLE_REPLIQUES, ROLE_PLAN, ROLE_RELATIONS]
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
		expect(roles).toHaveLength(5)
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
