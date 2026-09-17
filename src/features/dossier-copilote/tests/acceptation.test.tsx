import { fireEvent, render, screen } from '@testing-library/react'
import {
	createBrain,
	BrainProvider,
	type Brain,
	type Dossier,
	type DossierIssue,
	type Personnage,
	type ReponseCopilote,
} from '../../../brain'
import { PanneauCopilote } from '../components/PanneauCopilote'

/**
 * L'ACCEPTATION — critère 4 du plan : l'écriture passe UNIQUEMENT par
 * `DossierService.update(id, recette)`, dans l'ordre persistance-puis-
 * événement (KR-004) ; un refus de `validateDossier` ne persiste rien,
 * n'émet rien, et rend les anomalies — cas NOMINAL, pas une branche d'erreur
 * (KR-234). Et § 3.7 : les deux variantes de `LigneProposition`.
 *
 * Fichier SÉPARÉ de `panneauCopilote.test.tsx` (§ 5 du plan) — mêmes petits
 * helpers de montage/seed, DUPLIQUÉS ici à dessein (précédent
 * `fichePersonnage.test.tsx`/`panneauPersonnages.test.tsx`, dossier-fiches).
 */

function renderPanel(brain: Brain, dossierId: string) {
	return render(
		<BrainProvider brain={brain}>
			<PanneauCopilote dossierId={dossierId} onSelectSection={() => {}} />
		</BrainProvider>,
	)
}

function semerPersonnage(brain: Brain, dossierId: string, personnage: Personnage): Dossier {
	const ecriture = brain.dossiers.update(dossierId, (d) => ({
		canon: d.canon,
		monde: { ...d.monde, personnages: [...d.monde.personnages, personnage] },
		charpente: d.charpente,
	}))
	if (ecriture.statut !== 'ecrit') throw new Error(`Seed refuse par le validateur : ${ecriture.statut}`)
	return ecriture.dossier
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

function bouchonnerCopilote(brain: Brain, demander: jest.Mock): void {
	brain.copilote = { estDisponible: () => true, demander }
}

function choisirChamp(nom: string): void {
	fireEvent.click(screen.getByRole('radio', { name: nom }))
}

/** Un dossier prêt avec UN personnage sans fonction (REMPLISSAGE), le
 *  copilote bouchonné, monté. */
function preparer(demander: jest.Mock): { brain: Brain; dossier: Dossier } {
	const brain = createBrain()
	const dossier = brain.dossiers.create('Un dossier')
	semerTon(brain, dossier.id, 'sec et mefiant')
	semerPersonnage(brain, dossier.id, { id: 'pnj.test', portee: 'premier', plan_actions: [], savoirs: [] })
	bouchonnerCopilote(brain, demander)
	renderPanel(brain, dossier.id)
	return { brain, dossier }
}

function reponsePropose(texte: string, entiteId = 'pnj.test'): ReponseCopilote {
	return {
		statut: 'propose',
		proposition: { entiteId, champ: 'monde.personnages[].fonction', texte },
	}
}

beforeEach(() => window.localStorage.clear())

describe('acceptation - ecriture par update seul', () => {
	it('accepter ecrit via DossierService.update, ordre persistance puis evenement, un seul appel', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Gardien du seuil.'))
		const { brain, dossier } = preparer(demander)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))
		await screen.findByRole('button', { name: 'Accepter la proposition' })

		const updateSpy = jest.spyOn(brain.dossiers, 'update')
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(screen.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).toHaveBeenCalled()
		expect(emitSpy).toHaveBeenCalledWith('dossier:updated', { dossierId: dossier.id })
		// ORDRE épinglé (KR-004) : le magasin est écrit AVANT que l'événement parte.
		expect(setSpy.mock.invocationCallOrder[0]).toBeLessThan(emitSpy.mock.invocationCallOrder[0])
		expect(brain.dossiers.get(dossier.id)?.monde.personnages[0]?.fonction).toBe('Gardien du seuil.')
		expect(await screen.findByText('Accepté')).toBeInTheDocument()
	})
})

describe('acceptation - refus de validateDossier, cas nominal', () => {
	it('rien n est persiste, aucun evenement, les anomalies sont rendues, la proposition reste affichee', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Gardien du seuil.'))
		const { brain } = preparer(demander)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))
		await screen.findByRole('button', { name: 'Accepter la proposition' })

		// Aucun mécanisme du dépôt ne fait échouer `validateDossier` sur une prose
		// non vide écrite dans `fonction`/`apparence`/`description_joueur` (aucune
		// des trois n'est un CHAMPS_REQUIS ni bornée en longueur) : ce refus est
		// bouchonné DIRECTEMENT sur `DossierService.update`, la seule façon
		// d'exercer cette branche depuis le code de cette feature.
		const erreurs: DossierIssue[] = [
			{
				code: 'champ-requis-vide',
				severity: 'error',
				message: 'Anomalie de test — refus simule.',
				location: 'Personnage « pnj.test »',
				entityId: 'pnj.test',
				path: 'monde.personnages[0].fonction',
			},
		]
		const updateSpy = jest
			.spyOn(brain.dossiers, 'update')
			.mockReturnValueOnce({ statut: 'refuse', errors: erreurs, warnings: [] })
		const setSpy = jest.spyOn(brain.persistence, 'set')
		const emitSpy = jest.spyOn(brain.events, 'emit')

		fireEvent.click(screen.getByRole('button', { name: 'Accepter la proposition' }))

		expect(updateSpy).toHaveBeenCalledTimes(1)
		expect(setSpy).not.toHaveBeenCalled()
		expect(emitSpy).not.toHaveBeenCalled()
		expect(screen.getByText('Anomalie de test — refus simule.')).toBeInTheDocument()
		// Cas NOMINAL (KR-234), pas une branche d'erreur : la proposition reste
		// affichée, l'auteur peut toujours l'accepter ou la rejeter.
		expect(screen.getByRole('button', { name: 'Accepter la proposition' })).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'Rejeter la proposition' })).toBeInTheDocument()
	})
})

describe('acceptation - les deux variantes de LigneProposition', () => {
	it('cible vide : REMPLISSAGE, un seul Field, aucun bloc AVANT', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Gardien du seuil.'))
		preparer(demander)
		choisirChamp('FONCTION')

		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))

		await screen.findByRole('button', { name: 'Accepter la proposition' })
		expect(screen.queryByText('AVANT')).toBeNull()
		expect(screen.getByRole('textbox', { name: /^FONCTION/ })).toHaveValue('Gardien du seuil.')
	})

	it('cible redigee : REMPLACEMENT, bloc AVANT visible puis le meme Field APRES', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Nouvelle fonction.', 'pnj.redige'))
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerTon(brain, dossier.id, 'sec et mefiant')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.redige',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			fonction: 'Ancienne fonction.',
		})
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)

		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))

		await screen.findByRole('button', { name: 'Accepter la proposition' })
		expect(screen.getByText('AVANT')).toBeInTheDocument()
		expect(screen.getByText('Ancienne fonction.')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /^FONCTION/ })).toHaveValue('Nouvelle fonction.')
	})
})

/**
 * LE DIFF SURVIT À LA DÉCISION — et il montre toujours DEUX textes distincts.
 *
 * La panne que ces deux cas attrapent, écrite pour qu'on la reconnaisse : le
 * « AVANT » est dérivé du dossier au rendu, `useOpenDossier` se réveille sur
 * `dossier:updated`, donc à l'instant de l'acceptation le bloc AVANT se met à
 * porter le texte QU'ON VIENT D'ÉCRIRE. Sur une cible vide, un bloc AVANT
 * apparaît de nulle part ; sur une cible rédigée, le texte de l'auteur disparaît
 * de l'écran au moment précis où il est écrasé. `jest` reste vert, et le seul
 * instrument anti-complaisance de l'itération devient un diff de A contre A.
 */
describe('acceptation - le AVANT est gele au lancement, pas relu au rendu', () => {
	it('cible vide : aucun bloc AVANT n apparait APRES acceptation', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Gardien du seuil.'))
		const { brain, dossier } = preparer(demander)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))
		await screen.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(screen.getByRole('button', { name: 'Accepter la proposition' }))

		// L'écriture a bien eu lieu — sans quoi l'absence du bloc AVANT ne
		// prouverait rien (le dossier n'aurait simplement pas bougé).
		expect(brain.dossiers.get(dossier.id)?.monde.personnages[0]?.fonction).toBe('Gardien du seuil.')
		expect(await screen.findByText('Accepté')).toBeInTheDocument()
		expect(screen.queryByText('AVANT')).toBeNull()
	})

	it('cible redigee : APRES acceptation le bloc AVANT porte encore l ANCIEN texte', async () => {
		const demander = jest.fn().mockResolvedValue(reponsePropose('Nouvelle fonction.', 'pnj.redige'))
		const brain = createBrain()
		const dossier = brain.dossiers.create('Un dossier')
		semerTon(brain, dossier.id, 'sec et mefiant')
		semerPersonnage(brain, dossier.id, {
			id: 'pnj.redige',
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
			fonction: 'Ancienne fonction.',
		})
		bouchonnerCopilote(brain, demander)
		renderPanel(brain, dossier.id)
		choisirChamp('FONCTION')
		fireEvent.click(screen.getByRole('button', { name: 'Lancer' }))
		await screen.findByRole('button', { name: 'Accepter la proposition' })

		fireEvent.click(screen.getByRole('button', { name: 'Accepter la proposition' }))

		expect(brain.dossiers.get(dossier.id)?.monde.personnages[0]?.fonction).toBe('Nouvelle fonction.')
		expect(await screen.findByText('Accepté')).toBeInTheDocument()
		// LE DIFF RESTE UN DIFF : deux textes distincts, l'ancien à gauche, le neuf
		// dans le `Field`. Un AVANT relu au rendu porterait ici « Nouvelle fonction. ».
		expect(screen.getByText('AVANT')).toBeInTheDocument()
		expect(screen.getByText('Ancienne fonction.')).toBeInTheDocument()
		expect(screen.getByRole('textbox', { name: /^FONCTION/ })).toHaveValue('Nouvelle fonction.')
	})
})
