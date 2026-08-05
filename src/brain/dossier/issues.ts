import { feuilleDe } from './identifiers'

/**
 * Le RAPPORT D'ANOMALIE du dossier — une surface de RÉDACTION, pas une trace
 * technique. C'est le contrat que `dossier-controles` (n° 7) consommera pour
 * badger une section, et que la modale d'import rend dès l'itération 1.
 *
 * Trois invariants tiennent ce contrat (KR-164) :
 *  · `code` appartient à une union FERMÉE de douze valeurs, doublée d'un `Record`
 *    de libellés (KR-117) — jamais un `if (code === …)` en cascade chez le
 *    consommateur, jamais un `Partial<Record>` à trou silencieux ;
 *  · `message` est TOUJOURS une phrase française rédigée, jamais une erreur
 *    runtime sérialisée : aucun `expected`, aucun `undefined`, aucun
 *    `is not a function` ne doit pouvoir y apparaître ;
 *  · `location` résout l'entité PAR SON NOM (« Personnage « Aldûr le Sage » »),
 *    avec le repli « {Type} n°{index} (sans nom) ». Le `path` JSON est stable
 *    mais n'est JAMAIS affiché seul — il sert à pointer, pas à expliquer.
 */

/** Les douze anomalies que le schéma 1 sait produire. Union FERMÉE. */
export type DossierIssueCode =
	| 'schema-inconnu'
	| 'racine-manquante'
	| 'champ-requis-vide'
	| 'identifiant-invalide'
	| 'identifiant-duplique'
	| 'reference-pendante'
	| 'dossier-deja-importe'
	| 'texte-trop-long'
	| 'valeur-hors-enumeration'
	| 'delta-en-prose'
	| 'porte-inconnue'
	| 'revelation-sans-porte'

/**
 * Le canal de l'anomalie. `error` bloque l'import ; `warning` ne le bloque
 * jamais, ne dégrade pas le badge et ne désactive pas la confirmation.
 */
export type DossierIssueSeverity = 'error' | 'warning'

export interface DossierIssue {
	code: DossierIssueCode
	severity: DossierIssueSeverity
	/** QUOI — phrase française rédigée, jamais une erreur technique sérialisée. */
	message: string
	/** OÙ — l'entité résolue par son NOM, ou le repli « {Type} n°{index} (sans nom) ». */
	location: string
	/** L'identifiant stable de l'entité fautive, quand elle en porte un. */
	entityId?: string
	/** Chemin JSON stable — le contrat que n° 7 consomme pour badger une section. */
	path: string
}

/**
 * QUOI FAIRE, par code — la troisième ligne de l'anatomie d'une anomalie, celle
 * qui dit à l'auteur quoi corriger. Un `Record` fermé (KR-117) : ajouter un code
 * à l'union sans son libellé ne compile pas.
 *
 * DEUX marqueurs, et deux seulement, vivent dans ce registre : `{racine}`, résolu
 * par le `path` entier, et `{champ}`, résolu par sa FEUILLE. Tous deux se
 * résolvent par `dossierIssueRemediation`, jamais à la main chez le consommateur.
 * Les marqueurs des colonnes QUOI (`{valeur}`, `{nom}`, `{liste attendue}`) sont
 * interpolés au site d'appel, dans `validate.ts` : ils ne transitent jamais par
 * ce registre.
 */
export const DOSSIER_ISSUE_LABELS: Record<DossierIssueCode, string> = {
	'schema-inconnu': '↪ Ouvrez le fichier et réglez « schema » sur 1, puis réimportez-le.',
	'racine-manquante': '↪ Ajoutez la racine « {racine} » dans le fichier, puis réimportez-le.',
	'champ-requis-vide': '↪ Renseignez ce champ dans le fichier, puis réimportez-le.',
	'identifiant-invalide': '↪ Corrigez cet identifiant dans le fichier, puis réimportez-le.',
	'identifiant-duplique': '↪ Attribuez un identifiant unique à cet élément, puis réimportez-le.',
	// GÉNÉRALISÉ à l'itération 2 : ce texte était câblé en dur sur `depart.lieu_id`,
	// et `monstre_ref` en aurait hérité une consigne trompeuse (même famille que
	// BUG-042). Le marqueur nomme désormais le champ réellement fautif.
	'reference-pendante': "↪ Corrigez « {champ} » ou ajoutez l'élément correspondant, puis réimportez-le.",
	// Pas « ↪ Supprimez-le avant de le réimporter » : la suppression d'un dossier
	// n'existe pas en itération 1 (`DossierService` a quatre méthodes, la
	// bibliothèque n'affiche pas encore les dossiers), et une consigne
	// inapplicable met l'auteur dans une impasse. Ce qu'il peut faire AUJOURD'HUI,
	// c'est changer l'identifiant de son fichier.
	'dossier-deja-importe': '↪ Changez le champ « id » du fichier pour en importer une copie distincte.',
	'texte-trop-long': "↪ Resserrez le texte si possible ; l'import n'est pas bloqué.",
	'valeur-hors-enumeration': "↪ Remplacez cette valeur par l'une de celles attendues, puis réimportez-le.",
	'delta-en-prose': "↪ Remplacez ce texte par une liste d'effets, puis réimportez-le.",
	'porte-inconnue': "↪ Supprimez cette clé ou remplacez-la par l'une des quatre portes reconnues, puis réimportez-le.",
	'revelation-sans-porte':
		'↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même.',
}

/**
 * La ligne QUOI FAIRE d'une anomalie donnée, marqueurs résolus. Le consommateur
 * appelle CETTE fonction et n'a jamais à connaître ni le registre, ni les
 * marqueurs, ni le code : ajouter une anomalie interpolée demain ne touchera
 * aucun site d'appel (Open/Closed, KR-117).
 */
export function dossierIssueRemediation(issue: DossierIssue): string {
	return DOSSIER_ISSUE_LABELS[issue.code].replace('{racine}', issue.path).replace('{champ}', feuilleDe(issue.path))
}
