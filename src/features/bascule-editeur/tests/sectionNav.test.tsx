import { render, screen, within } from '@testing-library/react'
import { createBrain, SECTIONS, type Dossier, type NiveauControle, type SectionId } from '../../../brain'
import { SectionNav } from '../components/SectionNav'

/**
 * `SectionNav` rendu DIRECTEMENT, sans `DossierEditorScreen` — sujet DISTINCT
 * (§ 5 du plan d'itération 2 de `dossier-controles`, lot `badges-nav`) : cette
 * suite prouve que la VUE LIT le contrat `niveauxParSection`, jamais qu'elle le
 * PRODUIT (ça, c'est `dossierEditorScreen.test.tsx`, sur `controlerDossier`
 * réel). `niveauxParSection` est FABRIQUÉ ici — seul moyen d'atteindre une
 * section à compte réel avant que l'itération 3 ne câble une règle qui y
 * arrive (critère #6 du plan, complémentaire du critère #7 côté écran).
 */

/** Deux fiches RÉELLES sur `monde.personnages` — copie du dossier, jamais un dossier littéral inline (KR-156). */
function dossierAvecDeuxPersonnages(dossier: Dossier): Dossier {
	return {
		...dossier,
		monde: {
			...dossier.monde,
			personnages: [
				{ id: 'pnj.un', portee: 'premier', plan_actions: [], savoirs: [] },
				{ id: 'pnj.deux', portee: 'premier', plan_actions: [], savoirs: [] },
			],
		},
	}
}

/**
 * Les dix sections, calmes par défaut, `bloquant` posé sur `personnages` SEUL —
 * `canon` et `depart` restent `null` malgré leur `—` : c'est le discriminant du
 * critère #6, celui qui sépare « la vue lit le contrat » de « la vue colore les
 * sections sans compte ».
 */
function niveauxFabriques(): Record<SectionId, NiveauControle | null> {
	const calmes = Object.fromEntries(SECTIONS.map((section) => [section.id, null])) as Record<
		SectionId,
		NiveauControle | null
	>
	return { ...calmes, personnages: 'bloquant' }
}

describe('SectionNav', () => {
	it('lit niveauxParSection et non le compte manquant: Personnages 2 fiches BLOQUANT, Canon et Depart muets malgre leur tiret', () => {
		const brain = createBrain()
		const dossier = dossierAvecDeuxPersonnages(brain.dossiers.create('Un dossier'))

		render(
			<SectionNav dossier={dossier} selectedId={null} onSelect={() => {}} niveauxParSection={niveauxFabriques()} />,
		)

		const nav = screen.getByRole('navigation', { name: 'Sections du dossier' })
		const lignes = within(nav).getAllByRole('button')

		// Personnages (index 2) : compte RÉEL + niveau fabriqué, fusionnés (KR-218).
		const lignePersonnages = lignes[2]
		expect(within(lignePersonnages).getByText('Personnages')).toBeInTheDocument()
		expect(within(lignePersonnages).getByText('2 fiches · BLOQUANT')).toBeInTheDocument()
		expect(within(lignePersonnages).queryByText('2 fiches')).toBeNull()

		// Canon (index 0) et Départ (index 1) : niveau `null` en entrée, donc le
		// tiret SEUL, malgré la présence d'une règle qui les allumerait sur un
		// dossier réel — ce test isole la lecture du contrat de sa production.
		const ligneCanon = lignes[0]
		const ligneDepart = lignes[1]
		expect(within(ligneCanon).getByText('—')).toBeInTheDocument()
		expect(within(ligneDepart).getByText('—')).toBeInTheDocument()
		for (const ligne of [ligneCanon, ligneDepart]) {
			expect(within(ligne).queryByText('BLOQUANT')).toBeNull()
			expect(within(ligne).queryByText('ALERTE')).toBeNull()
			expect(within(ligne).queryByText('INFO')).toBeNull()
		}
	})
})
