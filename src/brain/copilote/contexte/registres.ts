/**
 * LES REGISTRES DE L'ASSEMBLAGE — et ils sont gardés ENTIERS, délibérément.
 *
 * Ce sont des `Record<RoleCopilote, …>` : LEUR TOTALITÉ EST LE GARDE — « un rôle
 * ajouté sans entrée ne compile pas » —, et c'est le support du confinement
 * KR-232. Les éclater par rôle, un fichier par rôle, détruirait cette totalité à
 * la compilation et la remplacerait par une convention (§ 8, n° 26). C'est
 * exactement l'inverse de la couture des assembleurs, qui, eux, VARIENT par rôle
 * et se scindent.
 *
 * `DESTINATION_DES_CHAMPS` (`../../dossier/destinations`) est importé en chemin
 * profond par le TEST de confinement, jamais ici : la table est une GARDE, jamais
 * un PILOTE (KR-232). `CHAMPS_INJECTES` est écrit à la main, champ par champ, et
 * c'est le test qui prouve que chacun de ses chemins a bien la destination `ia`.
 * L'inverse — dériver la liste de la table — injecterait automatiquement tout
 * champ `ia` ajouté plus tard au schéma, ce qui est exactement la panne que
 * l'asymétrie du regret interdit.
 */
import type { CheminLibelle } from '../../dossier/libelles'
import type { RoleCopilote } from '../types'

/** Les chemins de feuille injectés PAR RÔLE, tous d'audience `'ia'`, chemins à
 *  indices effacés — MÊME vocabulaire que `DESTINATION_DES_CHAMPS`. Les entrées
 *  de personnage sont RESTREINTES aux entités désignées ; celles d'indice, à
 *  l'indice CIBLE. Listes FIXES : un ouvrier n'en ajoute pas une. */
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.parler[]',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
	/** NEUF chemins. `monde.indices[].verite` y entre par la CONDITION D'ÉTAT
	 *  ré-écrite à ses deux sites (`dossier/types.ts` + `dossier/destinations.ts`) :
	 *  un rôle le nomme explicitement ICI, et le schéma de sortie de ce rôle ne peut
	 *  porter aucune prose. Ce n'est PAS une dérogation d'audience — le champ est
	 *  DÉJÀ `ia`. Ne pas confondre les deux : le confondre ferait croire que la
	 *  soupape assertée vide ci-dessous a bougé.
	 *  AUCUN `nom` (KR-195) et aucune `certitude` : le modèle voit des jetons. */
	'indice-detenteurs': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'monde.indices[].verite',
		'monde.indices[].formulation_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].plan_actions[].action',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
	],
	/**
	 * DIX chemins, et le rôle est STRICTEMENT PLUS ÉTROIT que `personnage-prose`.
	 * TROIS retraits, tous délibérés :
	 *
	 *  • `canon.mj.synopsis_mj` — présent chez `personnage-prose`, ABSENT ici. Ce
	 *    qu'il apporte à l'écriture d'une voix : presque rien. Ce qu'il risque : une
	 *    réplique qui le PARAPHRASE met du savoir MJ dans une phrase que le Temps 2
	 *    donnera au rôle ACTEUR et fera PRONONCER — alors qu'une note de fiche est
	 *    LUE par un narrateur. ASYMÉTRIE DU REGRET (KR-232).
	 *  • `caractere.cede_si` — prédicat conditionné par RÔLE ; un rôle de rédaction
	 *    n'est ni narrateur, ni acteur du porteur, ni arbitre : le prédicat n'a pas
	 *    de sujet, il est INAPPLICABLE, et l'inapplicable ne s'injecte pas.
	 *    PROPOSER n'est pas INJECTER (§ 8, TL3a-14).
	 *  • `caractere.curseurs.*` — jamais, veto non contesté.
	 *
	 * ET LA CIBLE ELLE-MÊME, `caractere.parler[]`, EST EXCLUE **PAR ABSENCE** de
	 * cette liste blanche — jamais par un saut à l'exécution. Un chemin listé puis
	 * systématiquement sauté serait une LIGNE MORTE (KR-235) qu'un bogue de cible
	 * pourrait ré-ouvrir ; une absence, elle, ne se ré-ouvre pas.
	 *
	 * `caractere.jamais` est LA LIMITE : elle borne ce que le personnage peut dire,
	 * donc elle a sa place dans une demande de répliques.
	 * `plan_actions[].action` n'est PAS tronqué ici — il n'y a qu'UNE fiche, là où le
	 * rôle détenteurs en numérote jusqu'à `CANDIDATS_MAX`.
	 */
	'personnage-repliques': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
	/**
	 * NEUF chemins, et LE DERNIER EST LE CHAMP CIBLE LUI-MÊME — première fois qu'un
	 * rôle injecte ce qu'il écrit. C'EST UN AMENDEMENT EXPLICITE À LA DOCTRINE DE
	 * L'IT3a, et il la RESTREINT sans l'annuler :
	 *
	 *   UN CHAMP CIBLE INTERCHANGEABLE NE S'INJECTE PAS ;
	 *   UN CHAMP CIBLE ORDONNÉ S'INJECTE.
	 *
	 * `caractere.parler[]` est un ensemble d'échantillons SANS ORDRE : l'élément N ne
	 * présuppose rien, les montrer n'ouvre qu'un canal de paraphrase. `plan_actions[]`
	 * est une SÉQUENCE : l'étape N n'a de sens qu'après 1…N−1. LE PRÉFIXE N'EST PAS LA
	 * RÉPONSE — C'EST LA PRÉMISSE DE LA QUESTION. Sans lui, le modèle repropose
	 * indéfiniment du matériau d'étape 1.
	 * Le chemin est injecté DANS L'ORDRE DU DOCUMENT et NON TRONQUÉ : la troncature au
	 * premier élément est propre au rôle détenteurs, qui numérote jusqu'à
	 * `CANDIDATS_MAX` fiches là où celui-ci n'en porte qu'UNE.
	 * Test de rattachement d'un futur champ cible de liste, décidable : « l'élément N
	 * présuppose-t-il l'élément N−1 ? » Oui ⇒ injection ; non ⇒ précédent 3a inchangé.
	 *
	 * TROIS RETRAITS, tous délibérés, et LEURS MOTIFS NE SONT PAS CEUX DE 3a :
	 *
	 *  • `canon.mj.synopsis_mj` — retiré POUR POINT DE VUE, et NON pour le ton.
	 *    Chez le rôle répliques le risque était la paraphrase PRONONCÉE ; ici le
	 *    synopsis porte ce que le personnage NE SAIT PAS. Un modèle qui l'a écrit des
	 *    étapes qui ANTICIPENT L'INTRIGUE, et la n° 12 les injectera au rôle acteur,
	 *    qui joue un personnage QUI DEVINE — la panne même que l'appareil
	 *    `savoirs`/`revele_si` existe pour empêcher.
	 *  • `apparence` — une apparence ne dit rien d'une intention ; seul chemin de
	 *    fiche dont le retrait ne coûte aucune information d'intention.
	 *  • `caractere.parler[]` — des répliques ne disent pas ce qu'il FAIT, et ce
	 *    serait un canal de paraphrase vers un champ qu'un AUTRE rôle écrit.
	 *
	 * `cede_si` et `caractere.curseurs.*` : précédents 3a inchangés, jamais injectés.
	 * `savoirs[]` et le contenu d'un indice sont REPORTÉS (n° 12) ; `presence[]` et
	 * `relations[]` sont hors tranche (3c).
	 */
	'personnage-plan': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
}

/** La soupape. VIDE, et un test l'asserte vide (KR-232). Zéro dérogation. */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

/**
 * Les champs SANS lesquels la demande n'a pas de sens — refus AVANT tout appel.
 * UNE entrée. Typé `CheminLibelle` et non `string` : c'est ce qui rend « tout
 * champ requis a un libellé d'écran » vrai À LA COMPILATION, donc le texte de
 * refus n'a aucune branche de repli.
 * PAS de disjonction « parmi » : une union `{requis|parmi}` sans instance `parmi`
 * est une abstraction à un seul appelant (KR-109).
 */
export const PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]> = {
	'personnage-prose': ['canon.ton'],
	/** Le rôle détenteurs a le MÊME unique requis. Ce qu'il exige EN PLUS — la
	 *  `verite` de l'indice cible — ne passe PAS par cette table : le champ n'a
	 *  aucune entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8), et
	 *  élargir cette table à `readonly string[]` détruirait la garantie de
	 *  compilation « tout champ requis a un libellé d'écran ». Son refus est donc un
	 *  motif NEUF ET SANS CHARGE, `'cible-a-ecrire'`, dont le texte d'écran nomme le
	 *  champ EN PROSE, côté feature. */
	'indice-detenteurs': ['canon.ton'],
	/** Le rôle répliques a le MÊME unique requis. Ce qu'il exige EN PLUS — une
	 *  IDENTITÉ écrite pour le personnage cible — ne passe pas non plus par cette
	 *  table : ce n'est pas UN champ mais une DISJONCTION sur les sept chemins de
	 *  fiche, donc rien qu'un `CheminLibelle` puisse nommer. Son refus est le même
	 *  motif SANS CHARGE, `'cible-a-ecrire'`. */
	'personnage-repliques': ['canon.ton'],
	/** Le rôle plan a le MÊME unique requis. Ce qu'il exige EN PLUS — un BUT écrit
	 *  pour le personnage cible — ne passe pas non plus par cette table : c'est un
	 *  chemin NOMMÉ (`CHEMIN_BUT_CIBLE`, `./plan`), éprouvé par un prédicat au site
	 *  du refus, exactement comme la `verite` du rôle détenteurs. Son refus est le
	 *  même motif SANS CHARGE, `'cible-a-ecrire'`. */
	'personnage-plan': ['canon.ton'],
}

/** LA VARIABLE LIBRE de la borne de contexte — combien de candidats au plus sont
 *  numérotés et injectés. Le budget ci-dessous en est la DÉRIVÉE. La règle qui
 *  empêche la dérive est écrite : SI LA MESURE DE `M` DÉPLAÎT, ON BAISSE K — ON NE
 *  MONTE JAMAIS LE BUDGET. Elle borne l'ENTRÉE, là où `PROPOSITIONS_MAX`
 *  (`schemaSortie.ts`) borne la SORTIE. */
export const CANDIDATS_MAX = 8

/**
 * LA BORNE DE REFUS DU CONTEXTE, EN CARACTÈRES (`String.length`, UTF-16), mesurée
 * sur le contexte RÉELLEMENT assemblé, APRÈS filtrage d'audience et APRÈS retrait
 * des champs marqués : `budget = ceil(M × 3 / 1000) × 1000`.
 *
 * PAR RÔLE, et c'est le point dur de l'itération 2 : un scalaire partagé ferait
 * desserrer la garde du rôle ÉTROIT par la mesure du rôle LARGE, sans un seul test
 * rouge (KR-235). Chaque entrée est RE-DÉRIVÉE par la même formule sur une mesure
 * de CE rôle-là.
 *
 * Le facteur 3 est une DÉCISION DATÉE du comité (2026-09-17) — la fixture est une
 * épreuve de validateur, pas le dossier d'un auteur ; l'arrondi au millier EST la
 * marge, on n'en ajoute pas une seconde.
 *
 * CE N'EST PAS UN CLIQUET : c'est une borne de refus, RE-DÉRIVÉE par la même
 * formule sur une NOUVELLE mesure à chaque itération qui élargit `CHAMPS_INJECTES`.
 * On ne la desserre jamais « parce que ça a coincé une fois » — et si la mesure
 * déplaît, c'est `CANDIDATS_MAX` qui baisse.
 */
export const BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number> = {
	// MESURÉ le 2026-09-17 à l'itération 1, sur l'entité de mesure composée par
	// `contexte.test.ts` (le personnage le mieux rempli de `dossier-reference.json`,
	// greffé du `but` du seul porteur du dossier) : `fonction` 1763 · `apparence`
	// 1756 · `description_joueur` 1783 caractères, le champ cible étant retiré de sa
	// propre demande. M = 1783 ⇒ ceil(1783 × 3 / 1000) × 1000 = 6000.
	// INCHANGÉ à l'itération 2, NON re-mesuré : les douze chemins n'ont pas bougé.
	'personnage-prose': 6000,
	// MESURÉ le 2026-09-17 à l'itération 2, `CANDIDATS_MAX` SATURÉ, sur un dossier
	// COMPOSÉ PAR `contexte.test.ts` depuis les valeurs réelles de
	// `dossier-reference.json` — la fixture n'appartient à aucun lot, et aucun de ses
	// indices ne porte à la fois une `verite` et huit candidats complets. Le protocole
	// est celui de l'it1 : on asserte d'abord que LES NEUF chemins résolvent non
	// vides, sans quoi le nombre relevé est un PLANCHER et non une mesure.
	// M = 5361 ⇒ ceil(5361 × 3 / 1000) × 1000 = 17000.
	'indice-detenteurs': 17_000,
	// MESURÉ le 2026-09-18 à l'itération 3a, sur l'entité de mesure RE-DÉRIVÉE par
	// `contexte.test.ts` pour CE rôle-ci (le personnage le mieux rempli sur les SEPT
	// chemins de fiche de ce rôle, greffé du `but` du seul porteur du dossier — la
	// fixture n'appartient à aucun lot). Protocole de l'it1 : on asserte d'abord que
	// LES DIX chemins résolvent non vides, sans quoi le nombre relevé est un PLANCHER
	// et non une mesure.
	// M = 1200 ⇒ ceil(1200 × 3 / 1000) × 1000 = 4000.
	// C'est le rôle le plus ÉTROIT des trois, et c'est attendu : dix chemins, UNE
	// fiche, aucun bloc numéroté, `synopsis_mj` retiré.
	'personnage-repliques': 4000,
	// MESURÉ le 2026-09-18 à l'itération 3b, sur l'entité de mesure RE-DÉRIVÉE par
	// `contexte.test.ts` pour CE rôle-ci (le personnage le mieux rempli sur les SIX
	// chemins de fiche de ce rôle, greffé du `but` du seul porteur du dossier — la
	// fixture n'appartient à aucun lot). Protocole de l'it1 : on asserte d'abord que
	// LES NEUF chemins résolvent non vides, sans quoi le nombre relevé est un PLANCHER
	// et non une mesure.
	// M = 1022 ⇒ ceil(1022 × 3 / 1000) × 1000 = 4000.
	// ⚠ LA VALEUR COÏNCIDE AVEC CELLE DE `personnage-repliques`, ET ELLE N'EN EST PAS
	// RECOPIÉE : `M` vaut 1200 là-bas et 1022 ici, deux mesures indépendantes qui
	// tombent dans le même millier après arrondi. C'est écrit parce que la coïncidence
	// invite précisément à la recopie que le `Record` par rôle existe pour interdire
	// (KR-235). CONSÉQUENCE MESURÉE ET TRAITÉE DANS LE MÊME LOT : la fabrication « deux
	// rôles étroits égaux » de `worker/frontiere.test.ts` devenait INERTE — vraie AVANT
	// d'être fabriquée — et a été ré-armée sur un couple dont les budgets DIFFÈRENT.
	'personnage-plan': 4000,
}
