import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import {
	createBrain,
	BrainProvider,
	dossierSessionKey,
	type Brain,
	type Dossier,
	type EtatSession,
} from '../../../brain'
import { dossierKey } from '../../../brain/persistenceKeys'
import { EcranPartie } from '../components/EcranPartie'

/**
 * LE DÉPLACEMENT VU DE L'ÉCRAN — critère 4 (l'état vide cède la place aux
 * lignes) et le bout de câblage saisie → `onSoumettre` → nouvelle session →
 * journal re-rendu (§ 3.A/3.D du plan d'itération 2).
 *
 * LES IDENTIFIANTS DE LIEU SONT CHOISIS SANS LE MOT « tour » EN SOUS-CHAÎNE
 * (ex. `lieu.tour-effondree` des fixtures partagées y contiendrait « tour »
 * entre deux séparateurs non-mot, faisant rougir à tort l'assertion « aucune
 * ligne n'affiche le mot tour » du critère 4) — `lieu.foret-basse` est neutre.
 *
 * Le dossier est celui du SERVICE (`brain.dossiers.create`), comme
 * `ouvertureVerbatim.test.tsx` : seuls `monde.lieux` (pour donner un accès réel
 * au lieu de départ) et la prose d'ouverture sont réécrits, par spread — jamais
 * un littéral de dossier entier (KR-156).
 */

const OUVERTURE_REDIGEE =
	"Le vent siffle sur la lande grise ; la porte du sanctuaire bâille déjà.\n\nVous n'avez pas fait dix pas que la pluie vous rattrape."

const CIBLE = 'lieu.foret-basse'

function avecUnAcces(dossier: Dossier, ouverture: string): Dossier {
	return {
		...dossier,
		monde: {
			...dossier.monde,
			// `CIBLE` porte AUSSI un accès (vers lui-même, légal — cf. commandes.test.ts
			// « auto-reference acceptee ») : sans lui, la console tomberait en IMPASSE une
			// fois arrivée, et « le champ se vide et reprend le focus » n'aurait plus de
			// champ à observer.
			lieux: [
				{ id: dossier.charpente.depart.lieu_id, acces: [CIBLE] },
				{ id: CIBLE, acces: [CIBLE] },
			],
		},
		charpente: {
			...dossier.charpente,
			depart: { ...dossier.charpente.depart, texte_ouverture_joueur: ouverture },
		},
		updatedAt: '2026-09-24T10:00:00.000Z',
	}
}

/** Sème un dossier JOUABLE, avec un unique accès réel, et monte le shell dessus. */
function monterPartieAvecAcces(): { brain: Brain; dossier: Dossier } {
	const brain = createBrain()
	const seme = brain.dossiers.create('La Caverne des Essais')
	brain.persistence.set(dossierKey(seme.id), avecUnAcces(seme, OUVERTURE_REDIGEE))
	const dossier = brain.dossiers.get(seme.id) as Dossier
	render(
		<BrainProvider brain={brain}>
			<EcranPartie dossierId={dossier.id} />
		</BrainProvider>,
	)
	return { brain, dossier }
}

function sessionPersistee(brain: Brain, dossierId: string): EtatSession {
	return brain.persistence.get<EtatSession>(dossierSessionKey(dossierId)) as EtatSession
}

describe('le deplacement, vu de l ecran', () => {
	beforeEach(() => {
		window.localStorage.clear()
	})

	it('l etat vide du journal cede la place aux lignes, [aller] sur la seule ligne moteur, jamais le mot tour', async () => {
		const user = userEvent.setup()
		const { dossier } = monterPartieAvecAcces()

		expect(screen.getByText("Aucun évènement pour l'instant — vos actions y apparaîtront.")).toBeInTheDocument()

		await user.type(screen.getByLabelText('CONSOLE'), `ALLER ${CIBLE}{Enter}`)

		const journal = screen.getByRole('region', { name: 'Journal' })
		expect(
			within(journal).queryByText("Aucun évènement pour l'instant — vos actions y apparaîtront."),
		).not.toBeInTheDocument()

		const lignes = within(journal).getAllByRole('listitem')
		expect(lignes).toHaveLength(2)

		const ligneJoueur = lignes[0]
		const ligneMoteur = lignes[1]

		expect(within(ligneJoueur).getByText('↪ JOUEUR')).toBeInTheDocument()
		expect(within(ligneJoueur).getByText(`> ALLER ${CIBLE}`)).toBeInTheDocument()
		expect(within(ligneJoueur).queryByText('[aller]')).not.toBeInTheDocument()

		expect(within(ligneMoteur).getByText('↻ MOTEUR')).toBeInTheDocument()
		expect(
			within(ligneMoteur).getByText(`lieu_courant : ${dossier.charpente.depart.lieu_id} → ${CIBLE}`),
		).toBeInTheDocument()
		// LA CAUSE APPARAÎT UNIQUEMENT SUR LA LIGNE QUI PORTE L'EFFET.
		expect(within(ligneMoteur).getByText('[aller]')).toBeInTheDocument()

		// AUCUNE LIGNE N'AFFICHE LE MOT « tour » — seul `#{n}` nu numérote le pas
		// (§ J1 : le mot reste réservé au round de combat).
		//
		// PAR LIGNE, SUR `outerHTML`, ET INSENSIBLE À LA CASSE — les trois clauses sont
		// nécessaires, et c'est MESURÉ, pas déduit (BUG-120). Sur le `textContent` de la
		// SECTION, `\b` ne trouve JAMAIS de frontière avant « tour » : le DOM concatène
		// sans séparateur et colle le mot au précédent (`JOURNALtour 1…`, `…bassetour 1…`),
		// si bien que l'assertion était VERTE sous le mutant qu'elle était écrite pour
		// attraper. Sans `i`, un `Tour 1` passait aussi. Et sur `textContent` seul, un mot
		// rendu en `aria-label` ou en `title` resterait invisible.
		// Les deux mutants — `Tour {n}` et `tour {n}` dans `JournalRow` — ont été vérifiés
		// ROUGES SUR CETTE LIGNE, jamais seulement sur la suivante.
		for (const ligne of lignes) {
			expect(ligne.outerHTML).not.toMatch(/\btour\b/i)
		}
		expect(within(ligneJoueur).getByText('#1')).toBeInTheDocument()
		expect(within(ligneMoteur).getByText('#1')).toBeInTheDocument()
	})

	it('bout de cablage: saisie vers onSoumettre vers nouvelle session vers journal re-rendu, et persistee', async () => {
		const user = userEvent.setup()
		const { brain, dossier } = monterPartieAvecAcces()

		const avant = sessionPersistee(brain, dossier.id)
		expect(avant.journal).toEqual([])
		expect(avant.monde.lieu_courant).toBe(dossier.charpente.depart.lieu_id)

		await user.type(screen.getByLabelText('CONSOLE'), `ALLER ${CIBLE}{Enter}`)

		// LE JOURNAL RE-RENDU, À L'ÉCRAN...
		expect(screen.getByText(`> ALLER ${CIBLE}`)).toBeInTheDocument()
		expect(screen.getByText(`lieu_courant : ${dossier.charpente.depart.lieu_id} → ${CIBLE}`)).toBeInTheDocument()

		// ...ET LA NOUVELLE SESSION, PERSISTÉE PAR LE MÊME CÂBLAGE QU'IT1
		// (`useSessionPersistee`, bascule sur `useBrain().sessions` en it2).
		const apres = sessionPersistee(brain, dossier.id)
		expect(apres.monde.lieu_courant).toBe(CIBLE)
		expect(apres.monde.lieux_visites).toEqual([dossier.charpente.depart.lieu_id, CIBLE])
		expect(apres.horloge.tour).toBe(1)
		expect(apres.journal).toHaveLength(2)

		// LE CHAMP SE VIDE ET REPREND LE FOCUS APRÈS UNE COMMANDE ACCEPTÉE (§ 3.A).
		const champ = screen.getByLabelText('CONSOLE')
		expect(champ).toHaveValue('')
		expect(champ).toHaveFocus()
	})
})
