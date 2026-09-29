import fs from 'node:fs'
import path from 'node:path'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { PlayerInputBar } from './PlayerInputBar'
import type { AvisInterprete, EtatSession } from '../../../brain'

/**
 * TESTS DU COMPOSANT `PlayerInputBar` — saisie libre du joueur.
 *
 * PÉRIMÈTRE : le composant lui-même, pas l'orchestration du hook. Le hook est
 * testé séparément (`useTourDeJeu.test.ts`).
 *
 * CHAMP CRITIQUE : AUCUN IMPORT DE `ConsoleCommandes`, ni réciproquement — GARDE
 * MÉCANISÉE ci-dessous (même patron que `moteurSansIA.test.ts` : lecture de
 * source, pas une convention). Un commentaire seul ne protège rien d'une
 * régression (revue tech-lead, it1).
 */

describe('isolation PlayerInputBar / ConsoleCommandes', () => {
	const DOSSIER_COMPOSANTS = path.join(__dirname)

	// ON CHERCHE DU CODE, PAS UNE MENTION — même distinction que la garde
	// `commandes.test.ts` : les deux fichiers NOMMENT l'autre en docstring,
	// précisément pour dire qu'ils ne l'importent pas. Un motif qui interdirait
	// de l'écrire interdirait d'expliquer pourquoi.
	const sansCommentaires = (source: string): string =>
		source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

	it('aucun des deux fichiers n importe l autre', () => {
		const sourcePlayerInputBar = fs.readFileSync(path.join(DOSSIER_COMPOSANTS, 'PlayerInputBar.tsx'), 'utf8')
		const sourceConsoleCommandes = fs.readFileSync(path.join(DOSSIER_COMPOSANTS, 'ConsoleCommandes.tsx'), 'utf8')

		expect(sansCommentaires(sourcePlayerInputBar)).not.toContain('ConsoleCommandes')
		expect(sansCommentaires(sourceConsoleCommandes)).not.toContain('PlayerInputBar')

		// DISCRIMINANCE, DANS LES DEUX SENS — sans elle, l'assertion ci-dessus serait
		// verte sur un balayage qui ne trouve rien (BUG-084) ou qui efface tout.
		expect(sansCommentaires("import { ConsoleCommandes } from './ConsoleCommandes'").includes('ConsoleCommandes')).toBe(
			true,
		)
		expect(sansCommentaires('// mentionne ConsoleCommandes en docstring').includes('ConsoleCommandes')).toBe(false)
		expect(sourcePlayerInputBar.length).toBeGreaterThan(100)
		expect(sourceConsoleCommandes.length).toBeGreaterThan(100)
	})
})

// Mock session vierge — nécessaire pour le test invariant attente/clarification.
const sessionVierge: EtatSession = {
	schema: 1,
	dossier_id: 'test-dossier',
	dossier_maj: '2026-09-25T00:00:00.000Z',
	graine_alea: 0,
	horloge: { tour: 1 },
	monde: {
		lieu_courant: 'lieu_test',
		lieux_visites: [],
		objets_possedes: [],
		indices_connus: [],
		jalons_atteints: [],
		evenements_consommes: [],
		pnj: {},
	},
	journal: [],
	memoire: null,
}

describe('PlayerInputBar — composant de saisie libre', () => {
	it('rend un formulaire avec un Field et un bouton TENTER', () => {
		const noop = async () => false
		render(
			<PlayerInputBar
				executeAction={noop}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByLabelText('QUE FAITES-VOUS ?')).toBeInTheDocument()
		expect(screen.getByRole('button', { name: 'TENTER' })).toBeInTheDocument()
	})

	it('le bouton affiche ... quand isLocked est true', () => {
		const noop = async () => false
		render(
			<PlayerInputBar
				executeAction={noop}
				getGestelabel={() => ''}
				avis={null}
				isLocked={true}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByRole('button', { name: '…' })).toBeInTheDocument()
	})

	it('le Field et le bouton sont disabled quand isLocked est true', () => {
		const noop = async () => false
		render(
			<PlayerInputBar
				executeAction={noop}
				getGestelabel={() => ''}
				avis={null}
				isLocked={true}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		const field = screen.getByLabelText('QUE FAITES-VOUS ?') as HTMLInputElement
		const button = screen.getByRole('button') as HTMLButtonElement

		expect(field.disabled).toBe(true)
		expect(button.disabled).toBe(true)
	})

	it('affiche OutcomeBlock PRÉCISEZ quand avis.type === clarification ET session.attente est défini', () => {
		const sessionAvecAttente: EtatSession = {
			...sessionVierge,
			attente: { type: 'clarification', question: 'Vers quel lieu ?', saisie: 'aller' },
		}
		const avis: AvisInterprete = { type: 'clarification', question: 'Vers quel lieu ?' }

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={avis}
				isLocked={false}
				issueNarrateur={null}
				session={sessionAvecAttente}
			/>,
		)

		expect(screen.getByText('PRÉCISEZ')).toBeInTheDocument()
		expect(screen.getByText('Vers quel lieu ?')).toBeInTheDocument()
	})

	it('n affiche PAS PRÉCISEZ si avis.type === clarification mais session.attente est undefined (invariant)', () => {
		const avis: AvisInterprete = { type: 'clarification', question: 'Vers quel lieu ?' }

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={avis}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.queryByText('PRÉCISEZ')).not.toBeInTheDocument()
	})

	it('affiche OutcomeBlock NON RECONNU avec labels dérivés de gestes_possibles', () => {
		const avis: AvisInterprete = {
			type: 'non_reconnu',
			gestes_possibles: ['aller'],
		}
		const getLabel = (id: string) => (id === 'aller' ? 'Aller' : '')

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={getLabel}
				avis={avis}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByText('NON RECONNU')).toBeInTheDocument()
		expect(screen.getByText(/Aller/)).toBeInTheDocument()
	})

	it('affiche la bannière REFORMULER quand avis.type === reformuler', () => {
		const avis: AvisInterprete = { type: 'reformuler' }

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={avis}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByText('Reformulez votre action.')).toBeInTheDocument()
	})

	it('affiche la bannière REFUS MOTEUR quand avis.type === refus_moteur', () => {
		const avis: AvisInterprete = { type: 'refus_moteur' }

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={avis}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByText("Cette action n'a pas pu s'exécuter.")).toBeInTheDocument()
	})

	it('affiche la bannière INDISPONIBLE pour EchecCopilote (quand avis a statut)', () => {
		const echec = { statut: 'indisponible' as const, raison: 'non-configure' as const }

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={echec}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.getByText('Le service est momentanément indisponible.')).toBeInTheDocument()
	})

	it('n affiche AUCUN bloc si avis est null (avant soumission)', () => {
		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		expect(screen.queryByText('PRÉCISEZ')).not.toBeInTheDocument()
		expect(screen.queryByText('NON RECONNU')).not.toBeInTheDocument()
		expect(screen.queryByText('Reformulez')).not.toBeInTheDocument()
		expect(screen.queryByText('Cette action')).not.toBeInTheDocument()
		expect(screen.queryByText('Le service')).not.toBeInTheDocument()
	})

	it('appelle executeAction(saisie) quand le formulaire est soumis', async () => {
		const user = userEvent.setup()
		const executeAction = jest.fn(async () => false)

		render(
			<PlayerInputBar
				executeAction={executeAction}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		const input = screen.getByLabelText('QUE FAITES-VOUS ?')
		await user.type(input, 'aller au château')
		await user.click(screen.getByRole('button', { name: 'TENTER' }))

		expect(executeAction).toHaveBeenCalledWith('aller au château')
	})

	it('M2 — executeAction retourne true → champ se vide après soumission', async () => {
		const user = userEvent.setup()
		const executeAction = jest.fn(async () => true) // Retourne true = pas consommé

		render(
			<PlayerInputBar
				executeAction={executeAction}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		const input = screen.getByLabelText('QUE FAITES-VOUS ?') as HTMLInputElement
		await user.type(input, 'aller au château')
		expect(input.value).toBe('aller au château')

		await user.click(screen.getByRole('button', { name: 'TENTER' }))

		// Le champ doit être vidé puisque executeAction retourne true
		expect(input.value).toBe('')
	})

	it('M2 — executeAction retourne false → champ garde son contenu après soumission', async () => {
		const user = userEvent.setup()
		const executeAction = jest.fn(async () => false) // Retourne false = pas consommé

		render(
			<PlayerInputBar
				executeAction={executeAction}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={null}
				session={sessionVierge}
			/>,
		)

		const input = screen.getByLabelText('QUE FAITES-VOUS ?') as HTMLInputElement
		await user.type(input, 'action invalide')
		expect(input.value).toBe('action invalide')

		await user.click(screen.getByRole('button', { name: 'TENTER' }))

		// Le champ doit conserver son contenu puisque executeAction retourne false
		expect(input.value).toBe('action invalide')
	})

	it('Lot 2 — affiche OutcomeBlock entete=RÉCIT + suggestions quand récit valide', () => {
		const sessionAvecRecit: EtatSession = {
			...sessionVierge,
			horloge: { tour: 2 },
			journal: [
				{ tour: 2, role: 'joueur', texte: '> action libre' },
				{ tour: 2, role: 'moteur', texte: 'moteur trace', origine: 'agir', recit: 'Vous avancez doucement.' },
			],
		}
		const issueR3 = {
			tour: 2,
			statut: 'raconte' as const,
			suggestions: ['Fouiller', 'Écouter'] as const,
		}

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={issueR3}
				session={sessionAvecRecit}
			/>,
		)

		// Vérifier que le bloc RÉCIT et le contenu du récit sont affichés
		expect(screen.getByText('RÉCIT')).toBeInTheDocument()
		expect(screen.getByText('Vous avancez doucement.')).toBeInTheDocument()

		// Vérifier que les suggestions sont affichées sous le récit
		expect(screen.getByText('Fouiller')).toBeInTheDocument()
		expect(screen.getByText('Écouter')).toBeInTheDocument()

		// Vérifier que les suggestions sont en `<li>` exactement (jamais en interactive <button>)
		// et qu'aucun rôle "button" n'existe dans la liste (garantit non-interactivité)
		const suggestions = screen.getAllByRole('listitem')
		expect(suggestions.length).toBe(2)
		const buttons = screen.queryAllByRole('button')
		expect(buttons).toHaveLength(1) // Seul le bouton TENTER du formulaire, pas dans les suggestions
	})

	it('Lot 2 — n affiche PAS suggestions si liste vide même avec récit valide', () => {
		const sessionAvecRecit: EtatSession = {
			...sessionVierge,
			horloge: { tour: 2 },
			journal: [
				{ tour: 2, role: 'joueur', texte: '> action libre' },
				{ tour: 2, role: 'moteur', texte: 'moteur trace', origine: 'agir', recit: 'Vous avancez doucement.' },
			],
		}
		const issueR3 = {
			tour: 2,
			statut: 'raconte' as const,
			suggestions: [] as readonly string[],
		}

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={issueR3}
				session={sessionAvecRecit}
			/>,
		)

		// Récit affiché
		expect(screen.getByText('Vous avancez doucement.')).toBeInTheDocument()

		// Aucun `<li>` ne doit être rendu (liste vide)
		expect(screen.queryAllByRole('listitem')).toHaveLength(0)
	})

	it('Lot 2 — affiche bannière dégradation quand issueNarrateur.statut === degrade et tour courant', () => {
		const sessionViergeT2 = { ...sessionVierge, horloge: { tour: 2 } }
		const issueDegrade = {
			tour: 2,
			statut: 'degrade' as const,
		}

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={issueDegrade}
				session={sessionViergeT2}
			/>,
		)

		expect(screen.getByText("Le récit n'a pas pu être généré.")).toBeInTheDocument()
	})

	it('Lot 2 — n affiche PAS bannière dégradation si tour périmé', () => {
		const sessionViergeT2 = { ...sessionVierge, horloge: { tour: 2 } }
		const issueDegradePeisme = {
			tour: 1, // tour périmé
			statut: 'degrade' as const,
		}

		render(
			<PlayerInputBar
				executeAction={async () => false}
				getGestelabel={() => ''}
				avis={null}
				isLocked={false}
				issueNarrateur={issueDegradePeisme}
				session={sessionViergeT2}
			/>,
		)

		expect(screen.queryByText("Le récit n'a pas pu être généré.")).not.toBeInTheDocument()
	})
})
