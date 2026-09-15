/**
 * LES DIX SECTIONS du dossier d'aventure — le registre que la navigation de
 * l'écran d'édition rend (n° 2 `bascule-editeur`, itération 3), dans l'ORDRE DU
 * SCHÉMA (`dossier/types.ts`) : `canon`, puis `charpente.depart`, puis les sept
 * collections de `monde`, puis `charpente.jalons`/`charpente.fins`.
 *
 * Registre unique plutôt qu'une liste re-listée dans la vue (KR-117) : une
 * section de plus est une entrée de plus ici, zéro modification chez ses
 * consommateurs. Et surtout, `compte()` vit ICI et nulle part ailleurs — la vue
 * n'a aucun `.length` à écrire, donc aucun compteur ne peut diverger d'un écran
 * à l'autre (KR-013/020).
 *
 * CE QUE CE REGISTRE NE PORTE PAS, délibérément : le GLYPHE de la famille et le
 * NUMÉRO DE FEATURE qui livrera l'écran d'édition de la section. `brain/` ne
 * connaît ni ne doit connaître le texte réel d'une feature (« feature n° 3 ») —
 * même règle que `EditorTopBar`, dont la raison de désactivation est injectée
 * par l'écran qui la possède. Ces deux tables restent côté feature, indexées par
 * `SectionId`.
 */
import { plural } from '../utils/plural'
import type { Dossier } from './types'

/**
 * L'identifiant STABLE d'une section — une translittération ASCII de son titre,
 * fixée une fois : elle sert de clé de sélection, de clé React et d'index aux
 * tables de la feature (glyphe, feature propriétaire). Elle n'est JAMAIS
 * affichée : ce que l'auteur lit, c'est `titre` (libellé) et `cle` (sous-titre).
 */
export type SectionId =
	| 'canon'
	| 'depart'
	| 'personnages'
	| 'lieux'
	| 'objets'
	| 'indices'
	| 'quetes'
	| 'evenements'
	| 'conditions'
	| 'jalons-fins'

export interface SectionDescripteur {
	/** Le RANG de la section dans le schéma, 1..10 — l'ordre de rendu de la nav. */
	num: number
	/** L'identifiant stable, jamais affiché (voir `SectionId`). */
	id: SectionId
	/** Le titre AUTEUR, en casse phrase — libellé de la ligne, sujet de l'état vide. */
	titre: string
	/**
	 * La CLÉ TECHNIQUE de la section dans le document, affichée en sous-titre pour
	 * que l'auteur qui relit son JSON s'y retrouve. C'est un texte d'AFFICHAGE, pas
	 * un chemin à déréférencer : la lecture du dossier appartient à `compte()`, et
	 * une section peut en couvrir deux (« Jalons & fins »).
	 */
	cle: string
	/**
	 * Le compteur de la section, TOUJOURS UN TEXTE, jamais un nombre : les dix
	 * sections n'ont pas la même unité (`fiche`, `jalon`/`fin`) et deux d'entre
	 * elles n'en ont aucune. Rendre un nombre obligerait chaque vue à recomposer la
	 * phrase, donc à re-décider de l'accord et du cas « pas une collection » — la
	 * seule règle qui vaille est ici.
	 */
	compte(dossier: Dossier): string
}

/**
 * Le compteur des sections qui ne sont pas des collections de fiches — Canon et
 * Départ. Un TIRET CADRATIN, constant, et surtout PAS « configuré » : cette
 * seconde valeur supposait un départ qui puisse être PENDANT, or
 * `charpente.depart.lieu_id` est un champ requis dont `validateDossier` exige la
 * résolution et que `DossierService.get()` re-valide à chaque lecture. Tout
 * dossier que l'écran peut tenir en main a donc un départ résolu : le voyant
 * serait tautologiquement vert, c'est-à-dire sans information (désaccord 4 du
 * plan d'itération 3).
 *
 * Exportée à l'itération 2 de la n° 7 pour `dossier/pastilles.ts` SEUL, qui en a
 * besoin pour élider le tiret derrière le mot du niveau plutôt que de l'y
 * ajouter ; elle ne sort PAS du baril `brain/index.ts` — aucune vue ne compare
 * un compte, elles les rendent (un test de balayage tient cette propriété).
 */
export const SANS_COMPTE = '—'

/** « 0 fiche », « 1 fiche », « 2 fiches » — accord français (0 au singulier). */
function fiches(nombre: number): string {
	return `${nombre} ${plural(nombre, 'fiche')}`
}

export const SECTIONS: readonly SectionDescripteur[] = [
	{ num: 1, id: 'canon', titre: 'Canon', cle: 'canon', compte: () => SANS_COMPTE },
	{ num: 2, id: 'depart', titre: 'Départ', cle: 'charpente.depart', compte: () => SANS_COMPTE },
	{
		num: 3,
		id: 'personnages',
		titre: 'Personnages',
		cle: 'monde.personnages',
		compte: (dossier) => fiches(dossier.monde.personnages.length),
	},
	{ num: 4, id: 'lieux', titre: 'Lieux', cle: 'monde.lieux', compte: (dossier) => fiches(dossier.monde.lieux.length) },
	{
		num: 5,
		id: 'objets',
		titre: 'Objets',
		cle: 'monde.objets',
		compte: (dossier) => fiches(dossier.monde.objets.length),
	},
	{
		num: 6,
		id: 'indices',
		titre: 'Indices',
		cle: 'monde.indices',
		compte: (dossier) => fiches(dossier.monde.indices.length),
	},
	{
		num: 7,
		id: 'quetes',
		titre: 'Quêtes',
		cle: 'monde.quetes',
		compte: (dossier) => fiches(dossier.monde.quetes.length),
	},
	{
		num: 8,
		id: 'evenements',
		titre: 'Événements',
		cle: 'monde.evenements',
		compte: (dossier) => fiches(dossier.monde.evenements.length),
	},
	{
		// `climat` est la première — et pour l'instant la SEULE — famille de
		// conditions (`Conditions`, `dossier/types.ts`). Le jour où une deuxième
		// arrive (n° 6), c'est cette ligne qui change, pas la vue.
		num: 9,
		id: 'conditions',
		titre: 'Conditions',
		cle: 'monde.conditions',
		compte: (dossier) => fiches(dossier.monde.conditions.climat.length),
	},
	{
		// La seule section qui compte DEUX collections : un jalon n'est pas une fin,
		// et les fondre dans un total unique cacherait un dossier sans aucune fin.
		num: 10,
		id: 'jalons-fins',
		titre: 'Jalons & fins',
		cle: 'charpente.jalons · charpente.fins',
		compte: (dossier) => {
			const jalons = dossier.charpente.jalons.length
			const fins = dossier.charpente.fins.length
			return `${jalons} ${plural(jalons, 'jalon')} · ${fins} ${plural(fins, 'fin')}`
		},
	},
]
