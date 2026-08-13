import fs from 'node:fs'
import path from 'node:path'

/**
 * KR-192 — le PV (Force + Agilité + Endurance) n'est calculé qu'à UN SEUL
 * endroit du dépôt : `maxPV` (`brain/characteristics.ts`). Test STRUCTUREL
 * (test-grep), même famille que `couverture.test.ts:409` (« le walker n'est
 * écrit qu'une fois ») : aucune assertion de COMPORTEMENT ne peut prouver une
 * ABSENCE d'écriture ailleurs dans le dépôt — seule une lecture de source le
 * peut.
 *
 * Deux gardes, sous `src/features` et `src/player` :
 *  1. aucun fichier ne recalcule la somme à la main par accès point sur les
 *     trois clés du héros (voir `SOMME_A_LA_MAIN` plus bas) ;
 *  2. aucun fichier ne fait retomber une LECTURE de `stats` sur
 *     `STATS_INITIALES` (désaccord n° 9 du plan — ce repli n'est légitime
 *     qu'à l'ÉCRITURE, dans `useEcriturePersonnages.handleReglerCaracteristiques`
 *     — extrait de `PanneauPersonnages` à it4, KR-112).
 *
 * DISCRIMINANT (KR-169) : `BlocCaracteristiques.tsx` importe `maxPV` — sans quoi
 * l'absence du motif 1 ne prouverait rien (elle resterait vraie même si
 * personne n'affichait jamais le PV). Retargeté depuis `FichePersonnage.tsx`
 * à it4 : l'extraction KR-112 (dette datée par it3) a déplacé le bloc
 * caractéristiques, PV compris, dans son propre fichier.
 */

const RACINE_SRC = path.join(__dirname, '..', '..', '..')
const DOSSIERS_SONDES = [path.join(RACINE_SRC, 'features'), path.join(RACINE_SRC, 'player')]

// Construits par assemblage (même précaution que `couverture.test.ts:414`,
// « SIGNATURE ») : ce fichier vit lui-même sous `src/features/**` et serait
// balayé par sa propre sonde — écrire le motif en clair dans un commentaire
// suffirait à le faire se refuser lui-même.
const SOMME_A_LA_MAIN = new RegExp(['\\bstats\\??\\.(FO|AG|EN)\\b', '[^\\n]*\\+'].join(''))
const REPLI_LECTURE = new RegExp(['\\?\\?\\s*', 'STATS_INITIALES'].join(''))

/** Tous les fichiers `.ts`/`.tsx` sous une racine, récursif. */
function fichiersSources(racine: string): string[] {
	if (!fs.existsSync(racine)) return []
	return fs.readdirSync(racine, { withFileTypes: true }).flatMap((entree) => {
		const chemin = path.join(racine, entree.name)
		if (entree.isDirectory()) return fichiersSources(chemin)
		return entree.name.endsWith('.ts') || entree.name.endsWith('.tsx') ? [chemin] : []
	})
}

function fichiersSondes(): string[] {
	return DOSSIERS_SONDES.flatMap(fichiersSources)
}

describe('la somme FO+AG+EN n est ecrite qu une fois, dans brain', () => {
	it('au moins deux fichiers sont balayes, sinon ce test ne mesure rien', () => {
		expect(fichiersSondes().length).toBeGreaterThan(2)
	})

	it('aucun fichier de features/ ou player/ ne recalcule la somme a la main', () => {
		const porteurs = fichiersSondes().filter((fichier) => SOMME_A_LA_MAIN.test(fs.readFileSync(fichier, 'utf8')))

		expect(porteurs).toEqual([])
	})

	it('aucun fichier de features/ ou player/ ne fait retomber une lecture sur STATS_INITIALES', () => {
		const porteurs = fichiersSondes().filter((fichier) => REPLI_LECTURE.test(fs.readFileSync(fichier, 'utf8')))

		expect(porteurs).toEqual([])
	})

	it('DISCRIMINANT : BlocCaracteristiques.tsx importe maxPV (sinon les deux gardes ci dessus ne prouvent rien)', () => {
		const chemin = path.join(RACINE_SRC, 'features', 'dossier-fiches', 'components', 'BlocCaracteristiques.tsx')
		const source = fs.readFileSync(chemin, 'utf8')

		expect(/\bmaxPV\b/.test(source)).toBe(true)
	})
})
