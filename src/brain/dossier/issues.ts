import { feuilleDe } from './identifiers'

/**
 * Le RAPPORT D'ANOMALIE du dossier — une surface de RÉDACTION, pas une trace
 * technique. C'est le contrat que `dossier-controles` (n° 7) consommera pour
 * badger une section, et que la modale d'import rend dès l'itération 1.
 *
 * Trois invariants tiennent ce contrat (KR-164) :
 *  · `code` appartient à une union FERMÉE de dix-neuf valeurs, doublée d'un `Record`
 *    de libellés (KR-117) — jamais un `if (code === …)` en cascade chez le
 *    consommateur, jamais un `Partial<Record>` à trou silencieux ;
 *  · `message` est TOUJOURS une phrase française rédigée, jamais une erreur
 *    runtime sérialisée : aucun `expected`, aucun `undefined`, aucun
 *    `is not a function` ne doit pouvoir y apparaître ;
 *  · `location` résout l'entité PAR SON NOM (« Personnage « Aldûr le Sage » »),
 *    avec le repli « {Type} n°{index} (sans nom) ». Le `path` JSON est stable
 *    mais n'est JAMAIS affiché seul — il sert à pointer, pas à expliquer.
 */

/**
 * Les dix-neuf anomalies que le schéma 1 sait produire. Union FERMÉE.
 *
 * Les QUATRE de la sixième ligne sont les conditions (itération 3), les TROIS
 * dernières les effets de règle et les éléments de liste (itération 4). Aucun
 * code neuf pour les RÉFÉRENCES d'une cible, de condition comme d'effet : une
 * cible mal formée ou de mauvais espace de noms est le même défaut qu'un
 * identifiant d'entité mal formé (`identifiant-invalide`), une cible bien formée
 * qu'aucune entité ne porte est le même défaut qu'une référence pendante
 * (`reference-pendante`). Les deux existent depuis it1 — un code par CAUSE, pas
 * un code par emplacement.
 */
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
	| 'expr-malformee'
	| 'predicat-inconnu'
	| 'arite-invalide'
	| 'condition-sans-expr'
	| 'delta-inconnu'
	| 'delta-malforme'
	| 'element-non-objet'

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
 * interpolés au site d'appel (`validate.ts`, `expr.ts` depuis l'itération 3) : ils ne transitent jamais par
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
	// Les QUATRE consignes des conditions disent quatre GESTES distincts — c'est ce
	// qui rend quatre codes moins chers qu'un seul : un test asserte `issue.code`,
	// jamais une sous-chaîne française, fragile à toute reformulation.
	'expr-malformee':
		'↪ Corrigez la forme de « {champ} » dans le fichier (opérateur, clé ou imbrication), puis réimportez-le.',
	'predicat-inconnu':
		'↪ Remplacez le prédicat de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
	'arite-invalide': '↪ Ajustez le nombre de cibles ou de conditions de « {champ} », puis réimportez-le.',
	'condition-sans-expr':
		'↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d’auteur.',
	// Les TROIS consignes de l'itération 4, mêmes principes que les quatre
	// précédentes : trois GESTES distincts, et jamais une sous-chaîne française
	// asserte par un test — le test asserte `issue.code`.
	'delta-inconnu': '↪ Remplacez l’effet de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
	'delta-malforme':
		'↪ Corrigez la forme de « {champ} » dans le fichier (clé « delta » et ses cibles), puis réimportez-le.',
	'element-non-objet': '↪ Remplacez cet élément de « {champ} » par un objet, puis réimportez-le.',
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
