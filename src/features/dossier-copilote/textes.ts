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
export const CARD2_BADGE = 'Bientôt — itération 2'
export const CARD2_CORPS = "Proposera qui d'autre pourrait connaître un indice qui manque de détenteurs ou de sources."

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
