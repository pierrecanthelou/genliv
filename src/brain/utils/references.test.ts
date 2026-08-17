import fs from 'node:fs'
import path from 'node:path'
import { avecOrpheline } from './references'
import { ESPACES_DE_NOMS, type EspaceDeNoms } from '../dossier/identifiers'
import type { SelectOption } from '../components/Select'

/**
 * `avecOrpheline` était PRIVÉE à `dossier-fiches/components/BlocSavoirs.tsx`, où
 * elle n'était éprouvée qu'À TRAVERS un rendu RTL (trois sélecteurs d'un bloc de
 * savoirs). Promue au deuxième appelant réel (KR-110), elle gagne ici le test
 * UNITAIRE qui lui manquait : la règle est une règle de DONNÉE — quelle liste
 * d'options rendre pour quelle valeur —, et la faire dire par un rendu de composant
 * la laissait dépendre du DOM.
 *
 * `savoirs.test.tsx` continue de tourner INCHANGÉ, et c'est ce qui prouve que la
 * promotion n'a rien changé au comportement : les deux tests éprouvent la même
 * fonction, celui-ci à la source, celui-là à l'écran.
 */

const OPTIONS: SelectOption<string>[] = [
	{ value: 'indice.cendres-tiedes', label: 'Indice « Des cendres encore tièdes »' },
	{ value: 'indice.sceau-brise', label: 'Indice « Le sceau du Gouffre est brisé »' },
]

describe('avecOrpheline', () => {
	it('une valeur presente dans les options rend la liste INTACTE', () => {
		const rendu = avecOrpheline(OPTIONS, 'indice.sceau-brise', 'indice')

		// La MÊME référence, pas une copie : rien n'est reconstruit quand rien ne manque.
		expect(rendu).toBe(OPTIONS)
		expect(rendu).toHaveLength(2)
	})

	it('une valeur VIDE rend la liste INTACTE : absence de reference, jamais reference orpheline', () => {
		// `''` est ce qu'un sélecteur « aucun » porte quand rien n'est choisi. Une option
		// « introuvable —  » y serait un faux positif à l'écran, et le pendant exact de
		// la borne du validateur, qui reste calme sur la chaîne vide d'une référence
		// optionnelle.
		expect(avecOrpheline(OPTIONS, '', 'indice')).toBe(OPTIONS)
	})

	it('une valeur ABSENTE des options est AJOUTEE en fin de liste, jamais reecrite ni filtree', () => {
		// KR-021 — le défaut que cette fonction existe pour interdire : un `Select` dont
		// la `value` n'est dans aucune option retombe sur la PREMIÈRE, et le prochain
		// commit d'écran ferait dire au dossier autre chose que ce que l'auteur y a mis.
		const rendu = avecOrpheline(OPTIONS, 'indice.disparu', 'indice')

		expect(rendu).not.toBe(OPTIONS)
		expect(OPTIONS).toHaveLength(2) // l'entrée n'est pas mutée
		expect(rendu).toHaveLength(3)
		// L'option orpheline est la DERNIÈRE : les options réelles gardent leur ordre.
		expect(rendu.slice(0, 2)).toEqual(OPTIONS)
		expect(rendu[2]).toEqual({ value: 'indice.disparu', label: 'Indice introuvable — indice.disparu' })
	})

	it('le libelle du type vient du registre ESPACES_DE_NOMS, pour CHAQUE espace', () => {
		// PROPRIÉTÉ, pas un exemple : la liste des espaces est DÉRIVÉE du registre, de
		// sorte qu'un espace ajouté demain est éprouvé sans qu'on y pense (KR-117). Le
		// libellé « Indice », « Objet », « Personnage » n'est jamais réécrit à la main —
		// c'est le même que celui de `localiserEntite`.
		const espaces = Object.keys(ESPACES_DE_NOMS) as EspaceDeNoms[]

		const fautifs = espaces.filter((espace) => {
			const orpheline = avecOrpheline([], `${espace}.disparu`, espace)[0]
			return orpheline.label !== `${ESPACES_DE_NOMS[espace].label} introuvable — ${espace}.disparu`
		})

		expect(fautifs).toEqual([])
		expect(espaces.length).toBeGreaterThan(0) // discriminant : la boucle a bien tourné
		// Et le libellé DÉPEND réellement de l'espace demandé : sans cette ligne, un
		// libellé constant passerait la boucle ci-dessus.
		expect(avecOrpheline([], 'objet.disparu', 'objet')[0].label).toBe('Objet introuvable — objet.disparu')
		expect(avecOrpheline([], 'objet.disparu', 'indice')[0].label).toBe('Indice introuvable — objet.disparu')
	})

	it('une AUTO-REFERENCE presente dans les options RESOUT, elle ne devient jamais orpheline', () => {
		// KR-194 — l'auto-référence est LÉGALE au schéma (`relations[].cible_id`,
		// `indices[].mene_a[]`), et cette fonction ne la connaît pas : elle ne teste
		// qu'une APPARTENANCE. C'est ce qui oblige l'appelant qui exclut l'entité éditée
		// de sa liste d'AJOUT à garder la liste COMPLÈTE pour ses lignes DÉJÀ ÉCRITES —
		// deux listes distinctes, jamais une seule filtrée.
		const soi = 'indice.cendres-tiedes'

		expect(avecOrpheline(OPTIONS, soi, 'indice')).toBe(OPTIONS)
		// La liste FILTRÉE, elle, fabriquerait un faux orphelin sur une référence qui
		// résout réellement. Le cas est écrit ici plutôt que découvert à l'écran.
		const filtree = OPTIONS.filter((option) => option.value !== soi)
		expect(avecOrpheline(filtree, soi, 'indice')[1].label).toBe(`Indice introuvable — ${soi}`)
	})

	it('elle n est ecrite qu une fois dans le depot', () => {
		// KR-110 : la promotion ne vaut que si la copie de `dossier-fiches` a bien
		// DISPARU. Construit par morceaux pour que la présence de CE littéral ne suffise
		// pas à faire passer le test (même patron que le test-grep du gel).
		const SIGNATURE = ['function avecOr', 'pheline'].join('')

		const porteurs = fichiersSources(path.join(__dirname, '..', '..')).filter((fichier) =>
			fs.readFileSync(fichier, 'utf8').includes(SIGNATURE),
		)

		expect(porteurs.map((fichier) => path.basename(fichier))).toEqual(['references.ts'])
	})
})

/** Les fichiers `.ts`/`.tsx` de `src/`, en pleine profondeur. */
function fichiersSources(racine: string): string[] {
	return fs.readdirSync(racine, { withFileTypes: true }).flatMap((entree) => {
		const chemin = path.join(racine, entree.name)
		if (entree.isDirectory()) return fichiersSources(chemin)
		return /\.tsx?$/.test(entree.name) ? [chemin] : []
	})
}
