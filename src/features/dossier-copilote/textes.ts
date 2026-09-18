/**
 * Les textes exacts du § 3 du plan d'itération 1 de `dossier-copilote` —
 * SEULE source : `PanneauCopilote.tsx`, `LigneProposition.tsx` et les tests
 * de cette feature les lisent ici, jamais retapés au site d'appel. Une
 * divergence de typo entre l'écran et le test qui la vérifierait resterait
 * invisible sinon (précédent `EYEBROW_REFUS`, `dossier-canon/utils/refusMessages.ts`).
 *
 * AUCUN mot évaluatif : ni « bonne suggestion », ni « affiner », ni
 * « relancer » — le bouton reste « Lancer » au premier essai comme aux
 * suivants (§ 3.6, il n'y a aucune mémoire).
 */

export const EYEBROW_ASSISTANT = 'ASSISTANT'

export const CARD1_TITRE = 'Compléter une fiche'
export const CARD1_CORPS =
	'Propose un texte pour un champ vide ou resté à écrire — fonction, apparence, description lue par le joueur.'

export const LABEL_PERSONNAGE = 'PERSONNAGE'
export const OPTION_AUCUN_PERSONNAGE = 'Aucun personnage dans ce dossier'
export const TITRE_AUCUN_PERSONNAGE = 'Créez un personnage dans Personnages pour utiliser cet assistant.'

export const LEGENDE_CHAMP = 'CHAMP'
export const TITRE_CHAMP_MANQUANT = 'Choisissez un champ pour activer Lancer.'

export const LABEL_LANCER = 'Lancer'
export const LABEL_ANNULER = 'Annuler'
export const TEXTE_CHARGEMENT = 'Le copilote réfléchit…'

export const CARD2_TITRE = 'Tisser les indices'
export const CARD2_CORPS_ACTIF =
	"Propose qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources."

export const CARD3_TITRE = 'Éclater le synopsis'
export const CARD3_BADGE = 'Bientôt — itération 4'
export const CARD3_CORPS = "Proposera une distribution de personnages à partir du synopsis, de l'accroche et du ton."

/** Les QUATRE textes de § 3.6 — jamais confondus. Les deux premiers sont des
 *  constantes fixes ; les deux derniers (refus de contexte) partagent
 *  « pour proposer ce texte » mais s'ouvrent et se ferment sur des lexiques
 *  opposés, un champ nommé contre aucun champ nommé. */
export const TEXTE_INDISPONIBLE = 'Le copilote est indisponible… Réessayez dans un instant.'
export const TEXTE_ILLISIBLE = "Le copilote n'a pas produit de proposition exploitable. Vous pouvez relancer."

/** `libelle` vient toujours de `LIBELLE_DES_CHAMPS[chemin].libelle` — à l'it1
 *  il ne vaut jamais que « TON », `canon.ton` étant l'unique entrée de
 *  `PARTIES_REQUISES`. */
export function texteRefusAEcrire(libelle: string): string {
	return `Il manque « ${libelle} » pour proposer ce texte — complétez d'abord ce champ.`
}

export const TEXTE_REFUS_TROP_LONG =
	"Le contexte est trop long pour proposer ce texte — raccourcissez d'abord la fiche de ce personnage."

export const LEGENDE_AVANT = 'AVANT'
export const LABEL_ACCEPTER = 'Accepter la proposition'
export const LABEL_REJETER = 'Rejeter la proposition'
export const BADGE_ACCEPTE = 'Accepté'
export const BADGE_REJETE = 'Rejeté'
export const LIEN_OUVRIR_FICHE = '→ Ouvrir la fiche'

/**
 * Les textes de la carte 2 « Tisser les indices » (itération 2 — § 3.3 du
 * plan). `TITRE_COPILOTE_NON_CONFIGURE` est PARTAGÉ avec la carte 1 (priorité
 * (a) de désactivation sur les DEUX cartes) ; `TITRE_AUCUN_PERSONNAGE` aussi
 * (une carte détenteurs sans aucun personnage n'a personne à désigner).
 */
export const LABEL_INDICE = 'INDICE'
export const OPTION_AUCUN_INDICE_SIGNALE = 'Aucun indice signalé'
export const TITRE_AUCUN_INDICE_SIGNALE = 'Ce dossier ne signale aucun indice manquant de détenteur ou de source.'

/** AJOUTÉ À LA REVUE DE PR (finding n° 2), hors du § 3.3 du plan. Il nomme un état
 *  que le plan n'avait pas prévu : la cible GELÉE a quitté la liste des signalés —
 *  typiquement parce que le détenteur qu'on vient d'accepter l'a réparée. Distinct
 *  de `TITRE_AUCUN_INDICE_SIGNALE`, qui parle du DOSSIER entier et serait FAUX ici
 *  puisque d'autres indices restent signalés. Sans lui, « Lancer » reste actif et
 *  ne fait rien. */
export const TITRE_INDICE_PLUS_SIGNALE = 'Cet indice ne manque plus de détenteur ni de source — choisissez-en un autre.'
export const TITRE_COPILOTE_NON_CONFIGURE =
	'Configurez la synchronisation Cloudflare (pastille en bas à droite) pour utiliser cet assistant.'
export const MENTION_SAVOIR_CREE =
	"Un détenteur accepté est enregistré comme sachant l'indice, sans condition de révélation posée — à ajuster ensuite dans sa fiche (Personnages → Savoirs)."
export const MENTION_RELANCE_SANS_MEMOIRE =
	'Chaque lancer repart de zéro — un détenteur refusé peut revenir, un détenteur accepté jamais.'
export const TEXTE_REFUS_CIBLE_A_ECRIRE =
	"Cet indice n'a pas encore de vérité écrite — complétez d'abord sa fiche, dans Indices."
export const TEXTE_REFUS_AUCUN_CANDIDAT =
	"Tous les personnages de ce dossier connaissent déjà cet indice — personne d'autre à désigner."
export const TEXTE_REFUS_TROP_LONG_DETENTEURS =
	'Le contexte est trop long pour désigner des détenteurs — ce dossier a trop de personnages, ou leurs fiches sont trop longues. Raccourcissez-les, dans Personnages.'
export const TEXTE_AUCUN_DETENTEUR_TROUVE = "Le copilote n'a trouvé personne d'autre pour cet indice."

/**
 * Les textes de la carte 4 « Écrire des répliques » (itération 3a — § 3.4 du
 * plan). RETIRÉS du tour 1 de l'UX, à NE PAS écrire : `LABEL_CHAMP_PARLER`
 * (plus de `SegmentedControl`), `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` (zéro
 * producteur — le vide est un REFUS pour ce rôle de rédaction), `MENTION_UNE_REPLIQUE`
 * (le bloc DÉJÀ ÉCRIT porte déjà l'information). Chaque rôle porte SES PROPRES
 * textes de refus de contexte et de relance — ne pas réutiliser `MENTION_SAVOIR_CREE`,
 * `TEXTE_REFUS_TROP_LONG`/`_DETENTEURS`, `TEXTE_REFUS_CIBLE_A_ECRIRE` ou
 * `MENTION_RELANCE_SANS_MEMOIRE`.
 */
export const CARD4_TITRE = 'Écrire des répliques'
export const CARD4_CORPS = "Propose des répliques types, dans la voix de ce personnage — jusqu'à deux par personnage."
export const EYEBROW_DEJA_ECRIT = 'DÉJÀ ÉCRIT'
/** Le bloc « DÉJÀ ÉCRIT » est GELÉ au clic « Lancer » : il décrit l'état du
 *  personnage AU LANCEMENT, pas son état courant. Tant que rien n'a été accepté,
 *  les deux coïncident et `MENTION_ZERO_REPLIQUE` (au présent) est vraie. Dès
 *  qu'une proposition est acceptée, elle devient FAUSSE à l'écran — elle
 *  voisinerait un badge « Accepté » en disant « n'a encore aucune réplique », et
 *  contredirait le `title` de « Lancer ». Geler une LISTE est défendable, geler
 *  une INSTRUCTION PROSPECTIVE ne l'est pas : le passé lève la contradiction sans
 *  dégeler le bloc. */
export const MENTION_ZERO_REPLIQUE_AU_LANCER =
	"Ce personnage n'avait aucune réplique type au lancement de cet assistant."
export const MENTION_ZERO_REPLIQUE =
	"Ce personnage n'a encore aucune réplique type — une proposition acceptée s'ajoute, jusqu'à deux au total."
export const TITRE_REPLIQUES_AU_PLAFOND =
	'Ce personnage a déjà ses deux répliques type — retirez-en une dans Personnages pour en proposer une autre.'
export const TITRE_REPLIQUE_PLAFOND_LIGNE = 'Plafond de deux répliques atteint.'

export function eyebrowRepliqueProposee(n: number): string {
	return `RÉPLIQUE PROPOSÉE ${n}`
}

export const TEXTE_REFUS_CIBLE_A_ECRIRE_REPLIQUES =
	"Ce personnage n'a encore aucune identité écrite — complétez d'abord sa fiche, dans Personnages."
export const TEXTE_REFUS_TROP_LONG_REPLIQUES =
	"Le contexte est trop long pour proposer des répliques — raccourcissez d'abord la fiche de ce personnage."
export const MENTION_RELANCE_SANS_MEMOIRE_REPLIQUES =
	'Chaque lancer repart de zéro : le copilote ne voit pas les répliques déjà écrites de ce personnage, et peut en proposer une très proche.'
