jest.mock('../../../brain', () => {
	const reel = jest.requireActual('../../../brain')
	return { ...reel, frapperIdentifiant: jest.fn(reel.frapperIdentifiant) }
})

import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import {
	createBrain,
	validateDossier,
	BrainProvider,
	frapperIdentifiant,
	PORTEE_INITIALE,
	type Brain,
	type Dossier,
	type EchecCopilote,
	type FicheBrouillon,
	type ReponseDistribution,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'
import { CARD3_TITRE } from '../textes'

/**
 * LA CARTE 3 « Éclater le synopsis » — activée à l'itération 4, LE SEUL
 * ASSISTANT QUI CRÉE (§ 1 du plan). Couvre : la RECETTE D'ACCEPTATION exacte —
 * SIX clés `{ id, portee, plan_actions, savoirs, fonction, but }`, `nom`
 * ABSENT (KR-221/195, critère 7) ; l'ESPION sur le SITE D'APPEL de
 * `frapperIdentifiant` — jamais un précalcul (§ 8, désaccord n° 7, critère
 * 7) ; le bout-en-bout où le personnage créé est immédiatement recevable par
 * le rôle `personnage-plan` (critère 8) ; les mentions et l'absence de tout
 * ciblage (§ 3.2/3.3 du plan).
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx`, `acceptation.test.tsx`,
 * `detenteurs.test.tsx`, `repliques.test.tsx`, `planActions.test.tsx` et
 * `relations.test.tsx` (précédent constant de cette feature, § 5 du plan) —
 * mêmes petits helpers, DUPLIQUÉS ici à dessein.
 *
 * ⚠ `frapperIdentifiant` est MOQUÉ EN DÉLÉGATION vers le vrai (`jest.fn(reel.
 * frapperIdentifiant)`) : un `jest.fn(() => 'pnj.x')` rendrait « deux
 * identifiants distincts » verte et vide (§ 8, désaccord n° 7).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauCopilote dossierId={dossierId} onSelectSection={() => {}} />
		</BrainProvider>,
	)
}

function semerTon(brain: Brain, dossierId: string, ton: string): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: { ...d.canon, ton },
		monde: d.monde,
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
}

function bouchonnerCopilote(brain: Brain, demander: jest.Mock, estDisponible = () => true): void {
	brain.copilote = { estDisponible, demander }
}

function regionCarte3() {
	return screen.getByRole('region', { name: CARD3_TITRE })
}

function reponsePropose(ajouts: readonly FicheBrouillon[]): ReponseDistribution {
	return { statut: 'propose', proposition: { ajouts } }
}

beforeEach(() => {
	window.localStorage.clear()
	;(frapperIdentifiant as jest.Mock).mockClear()
})

describe('distribution - la recette ecrit exactement les six cles attendues (critere 7, KR-221/165)', () => {
	it('portee vaut PORTEE_INITIALE (importee), plan_actions et savoirs sont vides, nom absent, aucune autre cle', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose([{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte3.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte3.getByText('Accepté')).toBeInTheDocument())

		const personnage = brain.dossiers.get(dossier.id)?.monde.personnages[0]
		expect(personnage).toBeDefined()
		expect(personnage?.portee).toBe(PORTEE_INITIALE)
		expect(personnage?.plan_actions).toEqual([])
		expect(personnage?.savoirs).toEqual([])
		expect(personnage?.fonction).toBe('Le connétable du roi')
		expect(personnage?.but).toEqual({ libelle: 'protéger le trône' })
		expect('nom' in (personnage ?? {})).toBe(false)
		expect(Object.keys(personnage ?? {}).sort()).toEqual(
			['but', 'fonction', 'id', 'plan_actions', 'portee', 'savoirs'].sort(),
		)
	})
})

describe('distribution - espion sur le site d appel de frapperIdentifiant, JAMAIS un precalcul (critere 7, desaccord n7)', () => {
	it('zero appel avant tout clic, zero apres un refus, un puis deux appels aux acceptations, deux identifiants DISTINCTS', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest.fn().mockResolvedValue(
			reponsePropose([
				{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } },
				{ fonction: 'La sorcière de la lande', but: { libelle: 'retrouver son grimoire' } },
				{ fonction: 'Le marchand ambulant', but: { libelle: 'échapper à ses dettes' } },
			]),
		)
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findAllByRole('button', { name: 'Accepter la proposition' })

		// LA LIGNE QUE LE PRÉCALCUL FAIT ROUGIR : les trois fiches sont rendues,
		// aucun clic n'a encore eu lieu — un `useMemo` de précalcul appellerait
		// `frapperIdentifiant` ICI, au rendu.
		expect(frapperIdentifiant).not.toHaveBeenCalled()

		fireEvent.click(carte3.getAllByRole('button', { name: 'Rejeter la proposition' })[1])
		await waitFor(() => expect(carte3.getByText('Rejeté')).toBeInTheDocument())
		expect(frapperIdentifiant).not.toHaveBeenCalled()

		fireEvent.click(carte3.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte3.getAllByText('Accepté')).toHaveLength(1))
		expect(frapperIdentifiant).toHaveBeenCalledTimes(1)
		expect(frapperIdentifiant).toHaveBeenNthCalledWith(1, 'pnj')

		fireEvent.click(carte3.getAllByRole('button', { name: 'Accepter la proposition' })[0])
		await waitFor(() => expect(carte3.getAllByText('Accepté')).toHaveLength(2))
		expect(frapperIdentifiant).toHaveBeenCalledTimes(2)

		const idsFrappes = (frapperIdentifiant as jest.Mock).mock.results.map((r) => r.value as string)
		expect(idsFrappes).toHaveLength(2)
		expect(idsFrappes[0]).not.toBe(idsFrappes[1])

		const personnages = brain.dossiers.get(dossier.id)?.monde.personnages ?? []
		expect(personnages).toHaveLength(2)
		expect(new Set(personnages.map((p) => p.id)).size).toBe(2)
	})
})

describe('distribution - bout-en-bout : recevable par assemblerPlan (critere 8)', () => {
	it('le personnage cree reste accepte par validateDossier et son but.libelle resout pour le role personnage-plan', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerTon(brain, dossier.id, 'sec et mefiant')
		// Le VRAI `demander`, capture AVANT le bouchonnage : sert a exercer le
		// role `personnage-plan` reel apres l'acceptation, sans reseau (aucun
		// worker configure => 'indisponible', jamais un fetch).
		const demanderReel = brain.copilote.demander
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose([{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte3.getByRole('button', { name: 'Accepter la proposition' }))
		await waitFor(() => expect(carte3.getByText('Accepté')).toBeInTheDocument())

		const dossierEcrit = brain.dossiers.get(dossier.id)
		expect(dossierEcrit).toBeDefined()
		expect(validateDossier(dossierEcrit).errors).toEqual([])

		const nouveauId = dossierEcrit?.monde.personnages[0]?.id
		expect(nouveauId).toBeDefined()

		const reponsePlan = await demanderReel(dossierEcrit as Dossier, {
			role: 'personnage-plan',
			acteurId: nouveauId as string,
		})
		// `personnage-plan` ne rend PAS `'cible-a-ecrire'` : son but.libelle
		// resout deja, la fiche est immediatement recevable par ce role deja livre.
		expect(reponsePlan).not.toMatchObject({ statut: 'refuse', motif: 'cible-a-ecrire' })
	})
})

describe('distribution - pas de Select de ciblage, mention permanente AVANT tout clic (§ 3.2)', () => {
	it('aucun combobox rendu, MENTION_PERSONNAGE_SANS_NOM visible des le premier rendu', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		expect(carte3.queryByRole('combobox')).toBeNull()
		expect(
			carte3.getByText(
				"Un personnage accepté n'a pas encore de nom — donnez-lui-en un dans sa fiche (Personnages → Identité).",
			),
		).toBeInTheDocument()
	})
})

describe('distribution - eyebrow numerote, libelles resolus depuis le registre, glyphe de rejet', () => {
	it('deux Field par fiche (FONCTION, CE QU IL VEUT), eyebrow PERSONNAGE PROPOSE n, rejet en ×', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest.fn().mockResolvedValue(
			reponsePropose([
				{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } },
				{ fonction: 'La sorcière de la lande', but: { libelle: 'retrouver son grimoire' } },
			]),
		)
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findAllByRole('button', { name: 'Accepter la proposition' })

		expect(carte3.getByText('PERSONNAGE PROPOSÉ 1')).toBeInTheDocument()
		expect(carte3.getByText('PERSONNAGE PROPOSÉ 2')).toBeInTheDocument()
		expect(carte3.getAllByText('FONCTION')).toHaveLength(2)
		expect(carte3.getAllByText("CE QU'IL VEUT")).toHaveLength(2)
		expect(carte3.getByDisplayValue('Le connétable du roi')).toBeInTheDocument()
		expect(carte3.getByDisplayValue('protéger le trône')).toBeInTheDocument()
		expect(carte3.getAllByRole('button', { name: 'Rejeter la proposition' })[0]).toHaveTextContent('×')
	})
})

describe('distribution - textes de refus de contexte : le SYNOPSIS nomme avant le TON (§ 4.3)', () => {
	const CAS: Array<{ reponse: EchecCopilote; texteAttendu: string }> = [
		{
			reponse: { statut: 'indisponible', raison: 'injoignable' },
			texteAttendu: 'Le copilote est indisponible… Réessayez dans un instant.',
		},
		{
			reponse: { statut: 'illisible', motif: 'schema' },
			texteAttendu: "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer.",
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.mj.synopsis_mj' },
			texteAttendu: "Il manque « SYNOPSIS MJ » pour proposer ce texte — complétez d'abord ce champ.",
		},
		{
			reponse: { statut: 'refuse', motif: 'a-ecrire', chemin: 'canon.ton' },
			texteAttendu: "Il manque « TON » pour proposer ce texte — complétez d'abord ce champ.",
		},
	]

	it('chaque motif rend le texte EXACT qui lui correspond, et les quatre sont deux a deux differents', async () => {
		const textesRendus: string[] = []
		for (const cas of CAS) {
			const brain = createBrain()
			const dossier = brain.dossiers.create('Un dossier')
			const demander = jest.fn().mockResolvedValue(cas.reponse)
			bouchonnerCopilote(brain, demander)
			const { unmount } = renderPanel(brain, dossier.id)

			const carte3 = within(regionCarte3())
			fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))

			const noeud = await carte3.findByText(`⊘ ${cas.texteAttendu}`)
			expect(noeud.textContent).toBe(`⊘ ${cas.texteAttendu}`)
			textesRendus.push(noeud.textContent ?? '')

			unmount()
		}

		expect(new Set(textesRendus).size).toBe(4)
	})
})

describe('distribution - ecriture par update, ordre persistance puis evenement (KR-004)', () => {
	it('un seul appel a update, set avant emit', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose([{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(carte3.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(await carte3.findByText('Accepté')).toBeInTheDocument()
	})

	it('ecriture refusee par validateDossier : rien n est persiste, la proposition reste affichee (KR-234)', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose([{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findByRole('button', { name: 'Accepter la proposition' })

		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')
		jest.spyOn(brain.dossiers, 'update').mockReturnValueOnce({
			statut: 'refuse',
			errors: [
				{
					code: 'reference-pendante',
					severity: 'error',
					message: 'Anomalie de test — refus simule.',
					location: 'Personnage « ? »',
					entityId: undefined,
					path: 'monde.personnages[0].fonction',
				},
			],
			warnings: [],
		})

		fireEvent.click(carte3.getByRole('button', { name: 'Accepter la proposition' }))

		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(carte3.getByText('Anomalie de test — refus simule.')).toBeInTheDocument()
		expect(carte3.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(carte3.getByRole('button', { name: 'Rejeter la proposition' })).toBeInTheDocument()
	})
})

describe('distribution - focus post-decision (aucun plafond, jamais desactive)', () => {
	it('apres acceptation de la premiere ligne, le focus va sur le + de la ligne suivante non decidee', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest.fn().mockResolvedValue(
			reponsePropose([
				{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } },
				{ fonction: 'La sorcière de la lande', but: { libelle: 'retrouver son grimoire' } },
			]),
		)
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findAllByRole('button', { name: 'Accepter la proposition' })

		const [premier] = carte3.getAllByRole('button', { name: 'Accepter la proposition' })
		fireEvent.click(premier)
		await waitFor(() => expect(carte3.getAllByText('Accepté')).toHaveLength(1))

		const [restant] = carte3.getAllByRole('button', { name: 'Accepter la proposition' })
		expect(restant).toBeEnabled()
		expect(restant).toHaveFocus()
	})

	it('quand toutes les lignes sont decidees, le focus revient sur Lancer, qui reste actif', async () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		const demander = jest
			.fn()
			.mockResolvedValue(reponsePropose([{ fonction: 'Le connétable du roi', but: { libelle: 'protéger le trône' } }]))
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		const carte3 = within(regionCarte3())
		fireEvent.click(carte3.getByRole('button', { name: 'Lancer' }))
		await carte3.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(carte3.getByRole('button', { name: 'Accepter la proposition' }))

		const lancer = await carte3.findByRole('button', { name: 'Lancer' })
		// AUCUN plafond de document (§ 2, § 8 n° 6) : l'acceptation ne desactive
		// jamais « Lancer ».
		expect(lancer).toBeEnabled()
		await waitFor(() => expect(lancer).toHaveFocus())
	})
})

describe('distribution - copilote non configure (aucune notion de personnage requis)', () => {
	it('Lancer desactive avec TITRE_COPILOTE_NON_CONFIGURE', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		bouchonnerCopilote(brain, jest.fn(), () => false)
		renderPanel(brain, dossier.id)

		const lancer = within(regionCarte3()).getByRole('button', { name: 'Lancer' })
		expect(lancer).toBeDisabled()
		expect(lancer).toHaveAttribute(
			'title',
			'Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant.',
		)
	})

	it('un monde SANS AUCUN personnage n desactive PAS Lancer : cas nominal du role (§ 4.3)', () => {
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		bouchonnerCopilote(brain, jest.fn())
		renderPanel(brain, dossier.id)

		expect(within(regionCarte3()).getByRole('button', { name: 'Lancer' })).toBeEnabled()
	})
})
