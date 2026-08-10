import { render, screen } from '@testing-library/react'
import { IssueList } from './IssueList'
import { dossierIssueRemediation, type DossierIssue } from '../dossier/issues'

/**
 * LE RAPPORT D'ANOMALIES, promu de `features/dossier-format/components/` vers
 * `brain/components/` à son second consommateur réel (KR-109) : la modale d'import
 * (n° 1) et le bandeau de refus d'écriture du formulaire de canon (n° 3).
 *
 * Ce que ce fichier tient, et que le déplacement ne doit pas avoir changé : UNE
 * ligne par anomalie, et sur chacune l'anatomie à trois lignes — OÙ, QUOI, QUOI
 * FAIRE. La preuve que le déplacement est à l'IDENTIQUE n'est pas ici : c'est
 * `features/dossier-format/tests/importDossier.test.tsx`, resté vert sans une seule
 * modification.
 */

/**
 * Deux anomalies de FORME réaliste — l'une sans `entityId` (un champ vide n'a pas
 * d'entité à nommer), l'autre avec (une référence pendante en porte une). Les deux
 * cas de la ligne OÙ sont donc couverts par la même fixture.
 */
const ANOMALIES: DossierIssue[] = [
	{
		code: 'champ-requis-vide',
		severity: 'error',
		message: "Le champ « synopsis_mj » est vide alors qu'il est obligatoire.",
		location: 'Canon (MJ)',
		path: 'canon.mj.synopsis_mj',
	},
	{
		code: 'reference-pendante',
		severity: 'error',
		message: "Le point de départ pointe « lieu.disparu », qui n'existe pas dans ce dossier.",
		location: 'Point de départ',
		entityId: 'lieu.disparu',
		path: 'charpente.depart.lieu_id',
	},
]

describe('IssueList', () => {
	it('rend une ligne par anomalie, portant son message', () => {
		render(<IssueList issues={ANOMALIES} />)

		const lignes = screen.getAllByRole('listitem')

		expect(lignes).toHaveLength(2)
		expect(lignes[0]).toHaveTextContent(ANOMALIES[0].message)
		expect(lignes[1]).toHaveTextContent(ANOMALIES[1].message)
		// DISCRIMINANT : chaque message va sur SA ligne, jamais les deux sur la même —
		// une liste qui concatènerait tout passerait les deux assertions ci-dessus.
		expect(lignes[0]).not.toHaveTextContent(ANOMALIES[1].message)
	})

	it('rend les trois lignes de l anatomie : OU, QUOI, QUOI FAIRE', () => {
		render(<IssueList issues={[ANOMALIES[1]]} />)

		const ligne = screen.getAllByRole('listitem')[0]

		expect(ligne).toHaveTextContent('Point de départ')
		expect(ligne).toHaveTextContent(ANOMALIES[1].message)
		// QUOI FAIRE est RÉSOLU par le registre, jamais recopié dans le composant :
		// c'est l'assertion qui interdirait une consigne rédigée en double ici.
		expect(ligne).toHaveTextContent(dossierIssueRemediation(ANOMALIES[1]))
		// L'identifiant stable, entre parenthèses, quand l'entité en porte un.
		expect(ligne).toHaveTextContent('(lieu.disparu)')
	})

	it('ne rend aucune ligne sur une liste vide', () => {
		render(<IssueList issues={[]} />)

		// Un rapport vide n'est pas une erreur de rendu : la modale d'import affiche
		// la liste des avertissements avant d'en avoir un seul.
		expect(screen.queryAllByRole('listitem')).toHaveLength(0)
		expect(screen.getByRole('list')).toBeInTheDocument()
	})
})
