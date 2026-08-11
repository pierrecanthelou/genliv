import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { SegmentedControl, type SegmentedOption } from './SegmentedControl'

/**
 * LE SEGMENTED CONTROL, ET SA VALEUR ABSENTE.
 *
 * Ce qui est éprouvé ici n'est pas le rendu du composant — il existe depuis
 * longtemps — mais l'ÉLARGISSEMENT posé par l'itération 1 de la n° 4 :
 * `value: T | undefined`, où `undefined` signifie « aucun segment actif ».
 * Sans lui, un champ optionnel par contrat (`Personnage.camp`, KR-191) aurait dû
 * se voir forcer une valeur par défaut, et la liste aurait affiché « Protagoniste »
 * sur un personnage dont personne n'a jamais choisi le camp.
 *
 * L'ASYMÉTRIE EST LE CONTRAT : `value` accepte `undefined`, `onChange` ne l'émet
 * jamais. Elle est épinglée deux fois — au COMPORTEMENT par le premier test, et à
 * la COMPILATION par `onChangeStrict` plus bas, dont l'assignabilité tomberait si
 * `onChange` s'élargissait à `T | undefined` (`strictFunctionTypes`).
 *
 * CE QUE CE FICHIER NE PEUT PAS ÉPINGLER, mesuré plutôt que supposé (précédent
 * `ListRow.test.tsx`) : la TEINTE du segment actif. `cssstyle`, l'implémentation
 * CSSOM de jsdom, refuse toute valeur colorée contenant `var(…)` — `background` et
 * `color` disparaissent de l'attribut `style` sérialisé. Le repère observable de
 * l'état actif est donc `aria-checked`, qui est aussi ce que lit un lecteur
 * d'écran : l'assertion accessible et l'assertion visuelle ne divergent pas.
 */

/** Le cas qui a motivé l'élargissement, déclaré localement : le composant reste
 *  content-agnostique et son test ne dépend d'aucun registre du dossier. */
type CampDeTest = 'protagoniste' | 'antagoniste'

const CAMPS_DE_TEST: SegmentedOption<CampDeTest>[] = [
	{ value: 'protagoniste', label: 'Protagoniste' },
	{ value: 'antagoniste', label: 'Antagoniste' },
]

describe('SegmentedControl, la valeur absente', () => {
	it('value undefined : aucun segment actif', () => {
		render(
			<SegmentedControl<CampDeTest>
				options={CAMPS_DE_TEST}
				value={undefined}
				onChange={jest.fn()}
				ariaLabel="Camp du personnage"
			/>,
		)

		const segments = screen.getAllByRole('radio')

		expect(segments).toHaveLength(CAMPS_DE_TEST.length)
		for (const segment of segments) {
			expect(segment).toHaveAttribute('aria-checked', 'false')
		}
		// Les deux libellés restent lisibles : « aucun segment actif » n'est pas
		// « aucun segment rendu » — l'auteur voit ce qu'il peut choisir.
		expect(screen.getByRole('radiogroup', { name: 'Camp du personnage' })).toBeInTheDocument()
	})

	it('discriminant : une valeur definie active exactement un segment', () => {
		// Sans ce test, le précédent passerait aussi sur un composant qui n'activerait
		// JAMAIS rien — l'élargissement aurait alors cassé le cas nominal en silence.
		render(<SegmentedControl<CampDeTest> options={CAMPS_DE_TEST} value="antagoniste" onChange={jest.fn()} />)

		const actifs = screen.getAllByRole('radio').filter((segment) => segment.getAttribute('aria-checked') === 'true')

		expect(actifs).toHaveLength(1)
		expect(actifs[0]).toHaveAccessibleName('Antagoniste')
	})

	it('un clic depuis l etat vide emet la valeur du segment, jamais undefined', async () => {
		const user = userEvent.setup()
		const recues: CampDeTest[] = []
		// ÉPINGLE DE COMPILATION : un gestionnaire qui n'accepte QUE `CampDeTest` doit
		// rester assignable à `onChange`. Si la prop s'élargissait à
		// `(value: CampDeTest | undefined) => void`, `strictFunctionTypes` refuserait
		// cette ligne — et le lot qui l'aurait élargie l'apprendrait ici, pas à
		// l'écriture d'un `undefined` dans le document de l'auteur.
		const onChangeStrict = (valeur: CampDeTest): void => {
			recues.push(valeur)
		}
		render(<SegmentedControl<CampDeTest> options={CAMPS_DE_TEST} value={undefined} onChange={onChangeStrict} />)

		await user.click(screen.getByRole('radio', { name: 'Protagoniste' }))

		expect(recues).toEqual(['protagoniste'])
	})

	it('les segments restent operables au clavier, sans gestionnaire maison', async () => {
		// Ce sont des `<button>` natifs : Tab les atteint et Entrée les active sans
		// qu'aucun `onKeyDown` n'ait à être écrit. L'état vide ne change rien à cela.
		const user = userEvent.setup()
		const onChange = jest.fn()
		render(<SegmentedControl<CampDeTest> options={CAMPS_DE_TEST} value={undefined} onChange={onChange} />)

		await user.tab()
		expect(screen.getByRole('radio', { name: 'Protagoniste' })).toHaveFocus()

		await user.keyboard('{Enter}')

		expect(onChange).toHaveBeenCalledWith('protagoniste')
	})
})
