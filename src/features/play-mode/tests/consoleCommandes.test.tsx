import { useState } from 'react'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConsoleCommandes, type ConsoleCommandesProps } from '../components/ConsoleCommandes'

/**
 * `ConsoleCommandes` SEULE — moitié COMPOSANT du critère 5 du plan d'itération 2
 * (§ 3.A/3.C), plus les deux garde-fous propres à ce composant : l'impasse
 * calme et le rendu tel quel des accès (T-15/N-13, KR-021/232).
 *
 * LA CONSOLE NE VALIDE RIEN : ce fichier n'importe ni `analyserSaisie` ni
 * `executerCommande` — seul `EcranPartie`/`deplacement.test.tsx` les câble. Le
 * `Harness` ci-dessous imite la moitié PARENT (l'état `refus`) sans jamais
 * appeler le moteur, pour isoler le contrat PRÉSENTATIONNEL du composant : sur
 * un refus, RIEN dans `ConsoleCommandes` n'efface la saisie ni ne déplace le
 * focus — c'est l'ABSENCE de code qui les préserve (§ 3.A, docstring du composant).
 */

/** Simule la moitié PARENT (état `refus`), sans jamais résoudre de commande. */
function Harness(props: { destinations: readonly string[] }): JSX.Element {
	const [refus, setRefus] = useState<string | null>(null)
	const onSoumettre: ConsoleCommandesProps['onSoumettre'] = (saisie) => {
		setRefus(`Commande inconnue : « ${saisie} ». Commandes disponibles : ALLER.`)
	}
	return <ConsoleCommandes onSoumettre={onSoumettre} refus={refus} destinations={props.destinations} />
}

describe('ConsoleCommandes', () => {
	it('refus rendu, saisie conservee, focus conserve', async () => {
		const user = userEvent.setup()
		render(<Harness destinations={['lieu.tour-effondree']} />)

		const champ = screen.getByLabelText('CONSOLE')
		// Soumission par ENTREE, jamais un onKeyDown maison — un seul `<input>` dans
		// un `<form>` (§ 3.A).
		await user.type(champ, 'ALER lieu.x{Enter}')

		expect(
			await screen.findByText('Commande inconnue : « ALER lieu.x ». Commandes disponibles : ALLER.'),
		).toBeInTheDocument()
		// LA SAISIE FAUTIVE N'EST PAS EFFACEE...
		expect(champ).toHaveValue('ALER lieu.x')
		// ...ET LE FOCUS RESTE — aucun code de ce composant ne le déplace sur un refus.
		expect(champ).toHaveFocus()
	})

	it('impasse calme: le formulaire disparait, le texte d impasse s affiche, aucune erreur', () => {
		render(<Harness destinations={[]} />)

		expect(
			screen.getByText("Aucun accès depuis ce lieu — la console n'a aucune commande à proposer."),
		).toBeInTheDocument()
		expect(screen.queryByLabelText('CONSOLE')).not.toBeInTheDocument()
		expect(screen.queryByRole('button', { name: 'EXÉCUTER' })).not.toBeInTheDocument()
	})

	it('accede rendus tels quels: ni dedoublonnes, ni filtres, jamais un nom', () => {
		// L ETAT SEPARATEUR : un accès répété et un ordre NON alphabétique. Une
		// implémentation fautive qui dédoublonnerait ou trierait rendrait un texte
		// différent — et les deux identifiants ressemblent à des HANDLES, jamais à un
		// `lieux[].nom` d'auteur (KR-232).
		render(<Harness destinations={['lieu.zeta-des-brumes', 'lieu.alpha-du-guet', 'lieu.zeta-des-brumes']} />)

		expect(
			screen.getByText('Accès disponibles : lieu.zeta-des-brumes, lieu.alpha-du-guet, lieu.zeta-des-brumes.'),
		).toBeInTheDocument()
	})
})
