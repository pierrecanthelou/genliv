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

/** Total mesuré le 2026-09-20 : 47 fichiers non-test. Le seuil garde la mesure, pas le chiffre. */
const PLANCHER_DE_NON_VACUITE = 20

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
 * Les trois motifs interdits, et ce que chacun attrape :
 *  · un appel réseau, quel qu'en soit le destinataire ;
 *  · le service qui parle au modèle, même importé « juste pour un type » ;
 *  · la construction d'une URL de route IA (un `fetch` indirect en resterait là).
 *
 * `\bfetch\s*\(` et non `fetch` nu : `prefetch(` n'ouvre pas de frontière de mot,
 * et un commentaire qui prononce le mot n'est pas un appel.
 */
const MOTIFS_INTERDITS: ReadonlyArray<{ readonly nom: string; readonly motif: RegExp }> = [
	{ nom: 'appel reseau (fetch)', motif: /\bfetch\s*\(/ },
	{ nom: 'import du CopiloteService', motif: /CopiloteService/ },
	{ nom: 'construction d une URL de route IA', motif: /\/ia\// },
]

const FICHIERS = RACINES_DU_PERIMETRE.flatMap(fichiersDeProduction)

const relatif = (chemin: string): string => path.relative(RACINE_SRC, chemin).split(path.sep).join('/')

describe('le moteur de la n 9 ne genere aucun texte (KR-250)', () => {
	it('le perimetre derive du disque est NON VIDE, et chacune de ses trois racines aussi', () => {
		// Sans cette assertion, les trois balayages ci-dessous seraient verts sur une
		// liste vide — un renommage de répertoire suffirait à éteindre l'instrument
		// sans qu'une seule suite rougisse (BUG-084).
		for (const racine of RACINES_DU_PERIMETRE) {
			expect(`${relatif(racine)} → ${fichiersDeProduction(racine).length > 0}`).toBe(`${relatif(racine)} → true`)
		}
		expect(FICHIERS.length).toBeGreaterThanOrEqual(PLANCHER_DE_NON_VACUITE)
	})

	it('aucun fichier du perimetre n appelle le reseau, n importe le copilote, ni ne compose une URL de route IA', () => {
		const fautifs = FICHIERS.flatMap((chemin) => {
			const source = fs.readFileSync(chemin, 'utf8')
			return MOTIFS_INTERDITS.filter(({ motif }) => motif.test(source)).map(({ nom }) => `${relatif(chemin)} → ${nom}`)
		})

		// Échec PAR NOM DE FICHIER et par motif : « false attendu true » ne dirait ni
		// lequel des 47 fichiers, ni laquelle des trois frontières a été franchie.
		expect(fautifs).toEqual([])
	})
})
