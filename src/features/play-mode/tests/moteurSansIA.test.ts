import fs from 'node:fs'
import path from 'node:path'

/**
 * « AUCUNE GÉNÉRATION DE TEXTE » — critère 8 du plan d'itération 1, KR-250.
 *
 * CE QUE CE FICHIER GARDE : le PÉRIMÈTRE DE LA n° 9 `moteur-dossier` — le
 * runtime joueur (`src/player/`), le shell de partie (`src/features/play-mode/`)
 * et la couche dossier de `brain/`. Il ne garde PAS « la feature `play-mode` » :
 * il vit ici parce que `src/features/moteur-dossier/` ne contient qu'un
 * `specification.json` et qu'une feature réduite à un test est un répertoire
 * fantôme (§ 8, D-10). Le jour où le périmètre bouge, c'est la liste des trois
 * racines ci-dessous qu'on amende — jamais le domicile du fichier.
 *
 * POURQUOI UN BALAYAGE ET PAS UNE RELECTURE : la propriété définissante de la
 * feature est une ABSENCE, et rien ne vérifie une absence sans instrument. Le
 * moteur DEMANDE un jet, le code le résout, et c'est l'auteur — jamais un modèle
 * — qui a écrit les deux seules proses émises verbatim.
 *
 * PÉRIMÈTRE DÉRIVÉ DU DISQUE (précédent maison : `lintIsolation.test.ts`) : un
 * littéral de liste de fichiers serait un garde de liste, pas un garde de
 * comportement — il exempterait en silence tout fichier neuf. D'où aussi
 * l'ASSERTION DE NON-VACUITÉ : sans elle, l'instrument passe sur une liste vide
 * et ne mesure rien (BUG-084).
 *
 * `path.join` partout, jamais un littéral à barre obliques : le dépôt tourne
 * aussi sous Windows (KR-215).
 */

const RACINE_SRC = path.join(__dirname, '..', '..', '..')

/** Les trois racines du périmètre de la n° 9 — la SEULE liste écrite à la main. */
const RACINES_DU_PERIMETRE = [
	path.join(RACINE_SRC, 'player'),
	path.join(RACINE_SRC, 'features', 'play-mode'),
	path.join(RACINE_SRC, 'brain', 'dossier'),
]

/**
 * Total mesuré le 2026-09-25 (`moteur-dossier` it4, après extinction des
 * consommateurs de jeu du modèle d'arbre), VENTILÉ par racine : `player` 14 ·
 * `play-mode` 8 · `brain/dossier` 26 = **48** fichiers non-test. Le seuil garde
 * la mesure, pas le chiffre.
 */
const PLANCHER_DE_NON_VACUITE = 20

/**
 * Plancher PAR RACINE (A-7, `moteur-dossier` it4) — `floor(mesure/5)×5` sur la
 * mesure ci-dessus, calculé PAR RACINE et non globalement : un plancher global
 * de 20 est déjà satisfait par `brain/dossier` (26) SEUL, donc **aveugle** si
 * `player` s'effondrait en silence jusqu'à 1 fichier — `PLANCHER_DE_NON_VACUITE`
 * reste un filet global, celui-ci est le garde qui distingue les trois racines.
 * `floor(n/5)×5 = 10` pour tout `n` de 10 à 14 : ce plancher ne certifie donc
 * rien de plus fin que « cette racine n'a pas été vidée par mégarde » — il ne
 * prouve jamais qu'un lot de démolition s'est arrêté exactement au bon endroit.
 */
const PLANCHER_PAR_RACINE: Readonly<Record<string, number>> = {
	player: 10,
	'play-mode': 5,
	dossier: 25,
}

function fichiersDeProduction(racine: string): string[] {
	return fs
		.readdirSync(racine, { withFileTypes: true })
		.flatMap((entree) => {
			const chemin = path.join(racine, entree.name)
			if (entree.isDirectory()) return fichiersDeProduction(chemin)
			if (!/\.tsx?$/.test(entree.name)) return []
			// Les fichiers de TEST sont hors périmètre : celui-ci doit pouvoir écrire
			// les trois motifs qu'il interdit.
			if (/\.test\.tsx?$/.test(entree.name)) return []
			return [chemin]
		})
		.sort()
}

/**
 * Les quatre motifs interdits, et ce que chacun attrape :
 *  · un appel réseau, quel qu'en soit le destinataire ;
 *  · le service qui parle au modèle, même importé « juste pour un type » ;
 *  · la construction d'une URL de route IA (un `fetch` indirect en resterait là) ;
 *  · un appel direct à demander du copilote (lot 2, KR-260).
 *
 * `\bfetch\s*\(` et non `fetch` nu : `prefetch(` n'ouvre pas de frontière de mot,
 * et un commentaire qui prononce le mot n'est pas un appel.
 *
 * `\.demander\s*\(` et non `demander` nu : `.demander(` vise la méthode du service,
 * jamais une variable locale `demander`.
 */
const MOTIFS_INTERDITS: ReadonlyArray<{ readonly nom: string; readonly motif: RegExp }> = [
	{ nom: 'appel reseau (fetch)', motif: /\bfetch\s*\(/ },
	{ nom: 'import du CopiloteService', motif: /CopiloteService/ },
	{ nom: 'construction d une URL de route IA', motif: /\/ia\// },
	{ nom: 'appel a demander du copilote (lot 2, KR-260)', motif: /\.demander\s*\(/ },
]

/**
 * EXCLUSION NOMMÉE PAR FICHIER — n° 10 `moteur-interprete` lot 2 (KR-260).
 * Seuls ces fichiers (par chemin complet) sont autorisés à importer CopiloteService
 * ou construire des URL `/ia/`. Chaque fichier exclus EXIGE un mutant obligatoire
 * vérifié ROUGE au plan § 7.
 *
 * Motif de croissance : chaque nouveau rôle du copilote ajoute UNE ligne ici
 * UNIQUEMENT — un orchestrateur feature qui la consomme et nul autre.
 */
const FICHIERS_EXCLUS_PLAY_MODE = [path.join(RACINE_SRC, 'features', 'play-mode', 'hooks', 'useTourDeJeu.ts')]

const FICHIERS = RACINES_DU_PERIMETRE.flatMap(fichiersDeProduction)

const relatif = (chemin: string): string => path.relative(RACINE_SRC, chemin).split(path.sep).join('/')

describe('le moteur de la n 9 ne genere aucun texte (KR-250)', () => {
	it('le perimetre derive du disque respecte son plancher, PAR RACINE (A-7), et le plancher global aussi', () => {
		// Sans ces assertions, les balayages ci-dessous seraient verts sur une liste
		// vide — un renommage de répertoire suffirait à éteindre l'instrument sans
		// qu'une seule suite rougisse (BUG-084). Le plancher PAR RACINE distingue en
		// plus un effondrement d'une seule racine que le plancher global (26 dans
		// brain/dossier seul) ne verrait pas passer (A-7).
		for (const racine of RACINES_DU_PERIMETRE) {
			const nom = path.basename(racine)
			const plancher = PLANCHER_PAR_RACINE[nom]
			const compte = fichiersDeProduction(racine).length
			expect(`${relatif(racine)} → ${compte} >= ${plancher} → ${compte >= plancher}`).toBe(
				`${relatif(racine)} → ${compte} >= ${plancher} → true`,
			)
		}
		expect(FICHIERS.length).toBeGreaterThanOrEqual(PLANCHER_DE_NON_VACUITE)
	})

	it('aucun fichier du perimetre n appelle le reseau, n importe le copilote, ni ne compose une URL de route IA (sauf exclusion nommee)', () => {
		const fautifs = FICHIERS.flatMap((chemin) => {
			// EXCLUSION NOMMÉE : les fichiers de cette liste sont autorisés.
			const estExclu = FICHIERS_EXCLUS_PLAY_MODE.some((exclu) => chemin === exclu)
			if (estExclu) return []

			const source = fs.readFileSync(chemin, 'utf8')
			return MOTIFS_INTERDITS.filter(({ motif }) => motif.test(source)).map(({ nom }) => `${relatif(chemin)} → ${nom}`)
		})

		// Échec PAR NOM DE FICHIER et par motif : « false attendu true » ne dirait ni
		// lequel des 47 fichiers, ni laquelle des trois frontières a été franchie.
		expect(fautifs).toEqual([])
	})

	describe('Mutants de motif — discriminance', () => {
		// LE MOTIF EST LU DEPUIS `MOTIFS_INTERDITS`, JAMAIS RECOPIÉ : une copie locale
		// prouverait la discriminance d'une regex qui n'est plus celle de l'instrument
		// (KR-270 — même défaut qu'une liste interdite recopiée à la main).
		const { motif } = MOTIFS_INTERDITS.find((m) => m.nom.startsWith('appel a demander'))!

		it('motif du copilote detecte un appel reel a copilote.demander(…)', () => {
			// Preuve que le motif ne matche que les appels réels
			const source = 'const result = await copilote.demander(dossier, cible)'
			expect(motif.test(source)).toBe(true)
		})

		it('motif du copilote naccepte pas une simple declaration de variable', () => {
			// Preuve de discriminance en négatif — une variable `demander` locale ne doit pas matcher
			const source = 'const demander = (arg) => console.log(arg)'
			expect(motif.test(source)).toBe(false)
		})
	})
})
