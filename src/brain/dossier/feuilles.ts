/**
 * LE BALAYAGE PLEINE PROFONDEUR d'un document — toutes ses feuilles terminales,
 * avec leur chemin normalisé et leur chemin concret.
 *
 * PROMU hors de `couverture.test.ts` au lot contrat de l'itération 1 de
 * `dossier-copilote`, et la promotion est MESURÉE, pas esthétique : importer une
 * fonction depuis un fichier de test EXÉCUTE toutes ses suites dans le fichier
 * importateur (39 `describe`/`it` de plus, 40 tests au lieu de 1). Un module de
 * production est la seule forme d'un utilitaire à deux lecteurs.
 *
 * Il n'est PAS ré-exporté par `brain/index.ts` : ses deux lecteurs sont des tests
 * de `brain/`, aucune feature n'en a l'usage.
 */
import { CHEMINS_DE_DELTAS, FAMILLES_DE_CONDITIONS } from './tables'

export interface FeuilleDeFixture {
	/** Chemin à indices EFFACÉS : `monde.evenements[].monstre_ref`. */
	normalise: string
	/** Chemin réel, indices compris : `monde.evenements[0].monstre_ref`. */
	concret: string
	valeur: unknown
}

/**
 * Les chemins où le balayage S'ARRÊTE — DÉRIVÉS de `FAMILLES_DE_CONDITIONS`, la
 * seule liste de chemins d'expression du dépôt. Une seconde liste, fût-elle
 * identique le jour où elle est écrite, divergerait en silence : une famille
 * ajoutée à la table et pas ici ferait descendre le balayage DANS son arbre, et
 * la table des destinations cesserait de pouvoir être exhaustive.
 */
const CHEMINS_D_ARRET = new Set([
	...FAMILLES_DE_CONDITIONS.map((famille) => famille.expr),
	// Le suffixe `[]` n'est PAS cosmétique, et la sonde l'a établi plutôt que le
	// raisonnement : sans lui l'arrêt tombe sur le TABLEAU, les lignes `…[]` de
	// DESTINATION_DES_CHAMPS deviennent MORTES (trois, mesurées — la quatrième, le
	// climat, porte une liste vide et n'a donc jamais eu de suffixe), et la
	// corruption cesse d'être PAR ÉLÉMENT. Avec le suffixe, l'arrêt tombe sur
	// l'ÉLÉMENT : les destinations existantes survivent, et deux effets dans une
	// même liste restent deux occasions de rougir.
	...CHEMINS_DE_DELTAS.map((chemin) => `${chemin.path}[]`),
])

function estObjetSimple(valeur: unknown): valeur is Record<string, unknown> {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * Toutes les feuilles terminales d'un document, en pleine profondeur, tableaux
 * inclus. Une feuille est ce qui ne se descend plus : une valeur scalaire, mais
 * aussi un objet ou un tableau VIDE — sinon `effet: [{}]` disparaîtrait du
 * balayage, et c'est exactement le champ que l'itération 2 fige. Un arbre
 * d'expression est une feuille ENTIÈRE, par arrêt dérivé (voir `CHEMINS_D_ARRET`).
 *
 * Les indices sont NORMALISÉS : sans cela, ajouter un second personnage
 * doublerait les chemins et le test échouerait par cardinalité au lieu d'échouer
 * par nom de champ. Chaque INSTANCE est conservée à part, parce que la couverture
 * n'est acquise que si CHACUNE rougit — une règle qui ne contrôlerait que `[0]`
 * passerait sinon pour exhaustive.
 */
export function feuillesDeLaFixture(valeur: unknown, normalise = '', concret = ''): FeuilleDeFixture[] {
	if (CHEMINS_D_ARRET.has(normalise)) return [{ normalise, concret, valeur }]
	if (Array.isArray(valeur) && valeur.length > 0) {
		return valeur.flatMap((element, index) => feuillesDeLaFixture(element, `${normalise}[]`, `${concret}[${index}]`))
	}
	if (estObjetSimple(valeur) && Object.keys(valeur).length > 0) {
		return Object.entries(valeur).flatMap(([cle, enfant]) =>
			feuillesDeLaFixture(
				enfant,
				normalise === '' ? cle : `${normalise}.${cle}`,
				concret === '' ? cle : `${concret}.${cle}`,
			),
		)
	}
	return [{ normalise, concret, valeur }]
}
