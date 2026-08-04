/**
 * Le RAPPORT D'ANOMALIE du dossier — une surface de RÉDACTION, pas une trace
 * technique. C'est le contrat que `dossier-controles` (n° 7) consommera pour
 * badger une section, et que la modale d'import rend dès l'itération 1.
 *
 * Trois invariants tiennent ce contrat (KR-164) :
 *  · `code` appartient à une union FERMÉE de huit valeurs, doublée d'un `Record`
 *    de libellés (KR-117) — jamais un `if (code === …)` en cascade chez le
 *    consommateur, jamais un `Partial<Record>` à trou silencieux ;
 *  · `message` est TOUJOURS une phrase française rédigée, jamais une erreur
 *    runtime sérialisée : aucun `expected`, aucun `undefined`, aucun
 *    `is not a function` ne doit pouvoir y apparaître ;
 *  · `location` résout l'entité PAR SON NOM (« Personnage « Aldûr le Sage » »),
 *    avec le repli « {Type} n°{index} (sans nom) ». Le `path` JSON est stable
 *    mais n'est JAMAIS affiché seul — il sert à pointer, pas à expliquer.
 */

/** Les huit anomalies que le schéma 1 sait produire. Union FERMÉE. */
export type DossierIssueCode =
	| 'schema-inconnu'
	| 'racine-manquante'
	| 'champ-requis-vide'
	| 'identifiant-invalide'
	| 'identifiant-duplique'
	| 'reference-pendante'
	| 'dossier-deja-importe'
	| 'canon-trop-long'

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
 * Le marqueur `{racine}` de `racine-manquante` est le SEUL de ce registre ; il se
 * résout par `dossierIssueRemediation`, jamais à la main chez le consommateur.
 */
export const DOSSIER_ISSUE_LABELS: Record<DossierIssueCode, string> = {
	'schema-inconnu': '↪ Ouvrez le fichier et réglez « schema » sur 1, puis réimportez-le.',
	'racine-manquante': '↪ Ajoutez la racine « {racine} » dans le fichier, puis réimportez-le.',
	'champ-requis-vide': '↪ Renseignez ce champ dans le fichier, puis réimportez-le.',
	'identifiant-invalide': '↪ Corrigez cet identifiant dans le fichier, puis réimportez-le.',
	'identifiant-duplique': '↪ Attribuez un identifiant unique à cet élément, puis réimportez-le.',
	'reference-pendante': '↪ Corrigez « depart.lieu_id » ou ajoutez le lieu correspondant.',
	// Pas « ↪ Supprimez-le avant de le réimporter » : la suppression d'un dossier
	// n'existe pas en itération 1 (`DossierService` a quatre méthodes, la
	// bibliothèque n'affiche pas encore les dossiers), et une consigne
	// inapplicable met l'auteur dans une impasse. Ce qu'il peut faire AUJOURD'HUI,
	// c'est changer l'identifiant de son fichier.
	'dossier-deja-importe': '↪ Changez le champ « id » du fichier pour en importer une copie distincte.',
	'canon-trop-long': "↪ Resserrez le texte si possible ; l'import n'est pas bloqué.",
}

/**
 * La ligne QUOI FAIRE d'une anomalie donnée, marqueur résolu. Le consommateur
 * appelle CETTE fonction et n'a jamais à connaître ni le registre, ni le
 * marqueur, ni le code : ajouter une anomalie interpolée demain ne touchera
 * aucun site d'appel (Open/Closed, KR-117).
 */
export function dossierIssueRemediation(issue: DossierIssue): string {
	return DOSSIER_ISSUE_LABELS[issue.code].replace('{racine}', issue.path)
}
