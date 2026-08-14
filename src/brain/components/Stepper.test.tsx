import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Stepper } from './Stepper'

/**
 * LE STEPPER, ET LE SIGNE DE SA VALEUR.
 *
 * Ce fichier arrive avec le PREMIER APPELANT RÉEL de `prefix` sur une échelle
 * SIGNÉE (`relations[].intensite`, −3..+3, itération 5 de la n° 4). Le composant
 * existait depuis longtemps ; son unique appelant écrivait `min={0}`, si bien que
 * `{prefix}{value}` n'a jamais rencontré de valeur négative et affichait « +-2 »
 * sans que rien ne rougisse — un défaut de RENDU, pas de contrat : `StepperProps`
 * ne change pas d'une ligne.
 *
 * LE SEUIL EST `> 0`, PAS `>= 0`, et c'est l'arbitrage du raffinage (désaccord
 * n° 3) : à `0`, une intensité est NEUTRE — ni hostilité ni attachement — et
 * « +0 » lui prêterait un sens qu'elle n'a pas. Le prefix est un SIGNE, jamais une
 * unité : sous ET à zéro, il s'efface.
 *
 * CE FICHIER RESTE CONTENT-AGNOSTIQUE (précédent `SegmentedControl.test.tsx`) :
 * les bornes sont déclarées ici, et non importées de `brain/dossier/types`. Le
 * composant est une primitive partagée ; son test ne dépend d'aucun registre du
 * dossier, et la ligne qui câble `INTENSITE_MIN`/`INTENSITE_MAX` sur ce `min`/`max`
 * appartient à l'écran qui la rend.
 *
 * L'AFFICHAGE SE LIT SUR LA RÉGION `aria-live`, jamais sur le texte de la ligne
 * entière : c'est exactement le nœud que le composant met à jour, et c'est ce
 * qu'un lecteur d'écran annonce. Une requête par texte global attraperait aussi
 * les deux boutons « − » et « + ».
 */

/** Les bornes de l'échelle signée qui a révélé le défaut — déclarées LOCALEMENT. */
const MIN_SIGNE = -3
const MAX_SIGNE = 3

/** Le contenu de la région vive : ce que le composant AFFICHE, et rien d'autre. */
function affichage(container: HTMLElement): string {
	return container.querySelector('[aria-live="polite"]')?.textContent ?? '(aucune region vive)'
}

/** Le Stepper est CONTRÔLÉ : sans ce porteur d'état, un clic ne changerait rien et
 *  le clamp ne serait éprouvé par personne. */
function StepperControle({ initial }: { initial: number }): JSX.Element {
	const [valeur, setValeur] = useState(initial)
	return <Stepper label="INTENSITÉ" value={valeur} onChange={setValeur} min={MIN_SIGNE} max={MAX_SIGNE} prefix="+" />
}

describe('Stepper, le signe du prefix', () => {
	it('un prefix signe s efface a zero et sous zero', () => {
		// UNE assertion pour les trois cas, projetés en texte : le jour où elle rougit,
		// on veut LIRE la valeur et ce qui s'est affiché — « +-2 » et « +0 » sont
		// exactement les deux chaînes que cette ligne interdit, et « +2 » celle qu'elle
		// exige encore (sans quoi « le prefix ne s'affiche jamais » passerait aussi).
		const rendus = [2, 0, -2].map((valeur) => {
			const { container, unmount } = render(
				<Stepper label="INTENSITÉ" value={valeur} onChange={jest.fn()} min={MIN_SIGNE} max={MAX_SIGNE} prefix="+" />,
			)
			const rendu = `${valeur} → ${affichage(container)}`
			unmount()
			return rendu
		})

		expect(rendus).toEqual(['2 → +2', '0 → 0', '-2 → -2'])
	})

	it('sans prefix, aucun signe ne s ajoute a une valeur positive', () => {
		// Discriminant du test ci-dessus : ce n'est pas « le composant préfixe toujours »
		// devenu « le composant ne préfixe jamais ». Le défaut d'origine tenait au fait
		// que `prefix` par défaut est la chaîne vide, ce qui rendait la branche indolore
		// partout ailleurs — il faut donc éprouver que ce défaut-là reste silencieux.
		const { container } = render(
			<Stepper label="INTENSITÉ" value={2} onChange={jest.fn()} min={MIN_SIGNE} max={MAX_SIGNE} />,
		)

		expect(affichage(container)).toBe('2')
	})

	it('clamp : six clics Diminuer depuis un min negatif y restent, la borne haute retient de meme', async () => {
		const user = userEvent.setup()
		const { container } = render(<StepperControle initial={MIN_SIGNE} />)
		const diminuer = (): HTMLElement => screen.getByRole('button', { name: 'Diminuer INTENSITÉ' })
		const augmenter = (): HTMLElement => screen.getByRole('button', { name: 'Augmenter INTENSITÉ' })

		for (let clic = 0; clic < 6; clic += 1) await user.click(diminuer())

		expect(affichage(container)).toBe('-3')

		// Discriminant (a) : le bouton n'est pas inerte — un clic déplace réellement la
		// valeur. Sans cette ligne, un composant qui ignorerait tout clic passerait.
		await user.click(augmenter())

		expect(affichage(container)).toBe('-2')

		// Discriminant (b) : l'autre borne retient de la même façon, et le signe
		// REPARAÎT dès que la valeur redevient positive — les deux moitiés du correctif
		// tiennent après interaction, pas seulement au premier rendu.
		for (let clic = 0; clic < 8; clic += 1) await user.click(augmenter())

		expect(affichage(container)).toBe('+3')
	})
})
