/**
 * LE VOCABULAIRE DU COPILOTE — les deux formes d'une proposition, et le pont
 * entre les deux façons de nommer un champ.
 *
 * Ce module ne contient AUCUNE logique : il ferme des ensembles (KR-117). La
 * validation de forme vit dans `schemaSortie.ts`, l'assemblage du contexte dans
 * `contexte.ts`, l'appel réseau dans `../CopiloteService.ts`.
 */

/** QUATRE rôles. Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ — « la prose d'un
 *  personnage », « les détenteurs d'un indice », « les répliques d'un personnage »,
 *  « le plan d'un personnage ».
 *  C'est AUSSI le segment de route (`/ia/indice-detenteurs`) et la clé des tables
 *  d'invites et de gabarits.
 *
 *  `'personnage-detenteurs'` a été refusé : il se lirait « les détenteurs d'un
 *  personnage ». Et `fiche-prose` promettrait une généralité qu'il faudrait
 *  renommer — or renommer coûte une route, une invite et un test.
 *
 *  `'personnage-voix'` est ÉCARTÉ : ce qu'on demande n'est pas *une voix*
 *  (abstraction qui invite une DESCRIPTION de la voix) mais DES RÉPLIQUES. Un seul
 *  mot traverse le rôle, la clé de fil, le validateur et la borne — aucune surface
 *  d'« harmonisation » pour un ouvrier.
 *  ⚠ SANS ACCENT : `'personnage-répliques'` sortirait de la classe `[a-z-]+` de
 *  l'expression d'extraction (`worker/frontiere.test.ts`) ET de celle de la route
 *  (`worker/index.ts`), le gabarit ne serait pas extrait, et la totalité rougirait
 *  PAR LE MAUVAIS MESSAGE. */
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques' | 'personnage-plan'

/** La CLÉ DE PROPRIÉTÉ dans le document — ce que la recette de `update` écrit. */
export type ChampProseCle = 'fonction' | 'apparence' | 'description_joueur'

/**
 * Le pont entre les DEUX vocabulaires, et l'unique autorité sur leur
 * correspondance : la clé est le CHEMIN (ce qui franchit le réseau, ce que la
 * table d'invites indexe, ce que `DESTINATION_DES_CHAMPS` connaît), la valeur est
 * la CLÉ DE PROPRIÉTÉ. AUCUNE chirurgie de chaîne — jamais de `.split('.').pop()`.
 */
export const CHAMPS_PROPOSABLES = {
	'monde.personnages[].fonction': 'fonction',
	'monde.personnages[].apparence': 'apparence',
	'monde.personnages[].description_joueur': 'description_joueur',
} as const satisfies Record<string, ChampProseCle>

export type ChampProseChemin = keyof typeof CHAMPS_PROPOSABLES

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé. Aucune référence
 *  d'entité, AUCUN écho du champ : la cible est le couple {entiteId, champ},
 *  indivisible, et elle reste côté client (KR-231). Schéma FERMÉ.
 *
 *  SON CONSOMMATEUR est la branche de succès de `validerSortie`
 *  (`schemaSortie.ts`), qui la porte au lieu de retaper `{ valeur: string }` :
 *  une forme réseau que rien ne consomme est une déclaration sans appelant
 *  (KR-109), et une forme réseau consommée par son SEUL validateur est un
 *  invariant que `tsc` tient. NON ré-exportée par `brain/index.ts` : aucune
 *  feature ne lit ce que le modèle rend — elles lisent `PropositionResolue`. */
export interface PropositionRendue {
	valeur: string
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `entiteId` et `champ`
 *  viennent de l'état d'écran. ZÉRO clé commune avec la forme réseau : on ne peut
 *  pas passer l'une pour l'autre par mégarde (KR-231). */
export interface PropositionResolue {
	entiteId: string
	champ: ChampProseChemin
	texte: string
}

/** ALIAS DE LISIBILITÉ, et RIEN DE PLUS : `string` ne garantit rien. La SEULE
 *  garantie d'un rang est son APPARTENANCE à `ContexteDetenteurs.rangs`, constatée
 *  par `validerDetenteurs`. Forme du jeton : `P1`, `P2`, … `PN` — et le préfixe `P`
 *  n'est pas décoratif : un `"1"` inviterait le modèle à émettre le NOMBRE `1`,
 *  autre type JSON, donc un refus `'schema'` évitable.
 *  AUCUNE conversion numérique nulle part — ni `Number`, ni `parseInt`, ni
 *  indexation arithmétique : c'est ce qui supprime la classe entière des décalages
 *  base-0 / base-1. La re-résolution est un `Map.get`. */
export type RangInjecte = string

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, un tableau de JETONS.
 *  Aucun identifiant, aucune prose, aucune certitude (KR-231).
 *
 *  SON CONSOMMATEUR est la branche de succès de `validerDetenteurs`, exactement
 *  comme `PropositionRendue` est celui de `validerSortie` : une forme réseau que
 *  rien ne consomme est une déclaration sans appelant (KR-109).
 *  NON ré-exportée par `brain/index.ts`. */
export interface DetenteursRendus {
	detenteurs: readonly RangInjecte[]
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `DetenteursRendus` : on ne peut pas passer l'une pour l'autre par mégarde.
 *  La CERTITUDE n'est pas ici — le code écrit `CERTITUDE_INITIALE`, exactement
 *  comme l'éditeur quand l'auteur crée un savoir à la main. Un `croit` choisi par
 *  le modèle serait une information FAUSSE inventée puis ratifiée d'un clic. */
export interface PropositionDetenteurs {
	indiceId: string
	personnageIds: readonly string[]
}

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, un tableau de PROSE LIBRE.
 *  Aucun écho du champ : le RÔLE est le champ, il n'y a rien à nommer.
 *
 *  SON CONSOMMATEUR est la branche de succès de `validerRepliques`, exactement
 *  comme `PropositionRendue` est celui de `validerSortie` : une forme réseau que
 *  rien ne consomme est une déclaration sans appelant (KR-109).
 *  NON ré-exportée par `brain/index.ts`. */
export interface RepliquesRendues {
	repliques: readonly string[]
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `RepliquesRendues` : on ne peut pas passer l'une pour l'autre par mégarde
 *  (KR-231).
 *
 *  `ajouts` et NON `textes` : `textes` est à UNE LETTRE de `PropositionResolue.texte`,
 *  et deux formes de proposition voisines dont les clés se confondent à la lecture
 *  sont exactement ce que KR-231 ferme.
 *  `ajouts` et NON `parler` : un champ homonyme du document inviterait
 *  `{...caractere, parler: proposition.parler}` — un ÉCRASEMENT de ce que l'auteur a
 *  déjà écrit, là où la sémantique d'écriture de cette liste est l'AJOUT. Le nom
 *  porte la sémantique d'écriture. */
export interface PropositionRepliques {
	personnageId: string
	ajouts: readonly string[]
}

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, UNE CHAÎNE (scalaire).
 *
 *  SCALAIRE, ET C'EST UNE DÉCISION : une liste bornée à un rendrait « deux »
 *  REPRÉSENTABLE et ne l'interdirait que par une CONSTANTE ; la forme scalaire le
 *  rend NON REPRÉSENTABLE — la meilleure garde est celle qui n'existe pas.
 *
 *  SON CONSOMMATEUR est la branche de succès de `validerIntention`
 *  (`schemaSortie.ts`), exactement comme `PropositionRendue` est celui de
 *  `validerSortie` : une forme réseau que rien ne consomme est une déclaration sans
 *  appelant (KR-109). NON ré-exportée par `brain/index.ts`. */
export interface IntentionRendue {
	intention: string
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `IntentionRendue` (KR-231).
 *
 *  ⚠ DEUX MOTS POUR LA MÊME CHAÎNE, et c'est le précédent `valeur` → `texte` :
 *  `intention` ENSEIGNE AU MODÈLE ce qu'on attend et ne se confond pas avec le
 *  champ du document ; `action` NOMME LA DESTINATION et rend la recette d'écriture
 *  littérale. Quelqu'un « harmonisera » si ce commentaire n'est pas là.
 *
 *  `acteurId` et JAMAIS `personnageId` : la proposition est LA CIBLE PLUS LE
 *  CONTENU (invariant mesuré sur les trois rôles livrés), et la cible de ce rôle
 *  s'appelle `acteurId` pour que le dispatch structurel de `CopiloteService` reste
 *  décidable — voir la docstring de `CiblePlan`.
 *
 *  `etape` N'EST PAS ICI, et c'est le trait neuf de la tranche : l'entier est posé
 *  PAR LE CODE, à l'instant de l'écriture, sur la liste VIVE. Le modèle ne le voit
 *  jamais et n'en rend aucun (doctrine it2, précédent `CERTITUDE_INITIALE`). */
export interface PropositionPlan {
	acteurId: string
	action: string
}
