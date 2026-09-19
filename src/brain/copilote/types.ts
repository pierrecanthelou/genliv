/**
 * LE VOCABULAIRE DU COPILOTE — les deux formes d'une proposition, et le pont
 * entre les deux façons de nommer un champ.
 *
 * Ce module ne contient AUCUNE logique : il ferme des ensembles (KR-117). La
 * validation de forme vit dans `schemaSortie.ts`, l'assemblage du contexte dans
 * `contexte.ts`, l'appel réseau dans `../CopiloteService.ts`.
 */

/** SIX rôles. Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ — « la prose d'un
 *  personnage », « les détenteurs d'un indice », « les répliques d'un personnage »,
 *  « le plan d'un personnage », « les relations d'un personnage », « la distribution
 *  du monde ».
 *  C'est AUSSI le segment de route (`/ia/indice-detenteurs`), la clé des tables
 *  d'invites et de gabarits, ET — depuis l'itération 3c — LE DISCRIMINANT de l'union
 *  étiquetée des cibles (`CopiloteService.ts`) : un même littéral porte le rôle
 *  annoncé et le rôle exécuté, si bien que les deux ne peuvent plus diverger.
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
export type RoleCopilote =
	| 'personnage-prose'
	| 'indice-detenteurs'
	| 'personnage-repliques'
	| 'personnage-plan'
	/** SANS ACCENT, même motif que `'personnage-repliques'` : la classe `[a-z-]+` de
	 *  la route (`worker/index.ts`) et celle de l'expression d'extraction
	 *  (`worker/frontiere.test.ts`) ne connaissent pas les accents. */
	| 'personnage-relations'
	/**
	 * LE SIXIÈME, ET LE SEUL DONT L'ENTITÉ CIBLE N'EXISTE PAS ENCORE.
	 *
	 * ⚠ `'monde-'` ET JAMAIS `'synopsis-'` : la convention des cinq livrés se lit
	 * ⟨entité CIBLE⟩-⟨ce qu'on demande⟩, et `synopsis-` nommerait LA SOURCE — ce
	 * qu'aucun rôle ne fait. Une clé de route se nomme par sa DESTINATION, qui ne
	 * bouge pas, là où le contexte a bougé à chaque itération ; et `monde-` est le
	 * seul préfixe qui dise « aucune entité cible ».
	 * SANS ACCENT, même motif que ses deux voisins.
	 */
	| 'monde-distribution'

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

/**
 * CE QUE LE MODÈLE REND, ÉLÉMENT PAR ÉLÉMENT — franchit le réseau. LE PREMIER
 * ÉLÉMENT MIXTE du dépôt : un JETON de désignation (`envers`) ET de la PROSE
 * (`nature`) dans le même objet. Aucun rôle livré avant l'itération 3c ne rendait
 * les deux.
 *
 * `envers`, et JAMAIS `vers` : c'est le mot que l'écran rend déjà (`EYEBROW_ENVERS`)
 * — un mot, une notion, des deux côtés de la frontière — et c'est la préposition du
 * sentiment DIRIGÉ, là où `vers` est directionnel.
 *
 * ⚠ `envers` N'EST JAMAIS PASSÉ AU SCANNER D'IDENTIFIANTS. Le jeton est l'une de NOS
 * PROPRES chaînes, constatée par appartenance à la table des rangs : l'y passer
 * serait du code mort présenté comme de la couverture (famille BUG-084, KR-235).
 */
export interface RapportRendu {
	envers: RangInjecte
	nature: string
}

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, une LISTE d'éléments mixtes.
 *
 *  `rapports`, et JAMAIS `liens` : `liens` est le PLURIEL EXACT du champ `lien`, donc
 *  nommer le champ (veto de l'itération 3b) — et la confusion à UNE LETTRE est
 *  précisément ce que KR-231 ferme. Les quatre clés livrées avant celle-ci diffèrent
 *  toutes de leur champ de destination ; un quasi-synonyme est légitime, le mot du
 *  champ non.
 *
 *  SON CONSOMMATEUR est la branche de succès de `validerRelations`
 *  (`schemaSortie.ts`), exactement comme `PropositionRendue` est celui de
 *  `validerSortie` : une forme réseau que rien ne consomme est une déclaration sans
 *  appelant (KR-109). */
export interface RapportsRendus {
	rapports: readonly RapportRendu[]
}

/**
 * CE QUE LE CODE RE-RÉSOUT, ÉLÉMENT PAR ÉLÉMENT — ne franchit JAMAIS le réseau.
 * `cibleId` sort d'un `Map.get` sur la table des rangs RENDUE PAR L'ASSEMBLEUR,
 * jamais re-dérivée (KR-231).
 *
 * ZÉRO CLÉ COMMUNE avec `RapportRendu` — {`envers`,`nature`} ∩ {`cibleId`,`lien`} = ∅.
 * C'est KR-231 au NIVEAU DE L'ÉLÉMENT, et il s'ajoute à celui du niveau de la liste :
 * un rôle mixte porte DEUX frontières, pas une.
 *
 * `lien` NOMME LA DESTINATION dans le document (`Relation.lien`), là où le fil
 * portait `nature` — même précédent que `intention` → `action` au rôle plan, et pour
 * la même raison : `nature` ENSEIGNE AU MODÈLE ce qu'on attend, `lien` rend la
 * recette d'écriture littérale. Ne pas « harmoniser ».
 *
 * `intensite` N'EST PAS ICI, et `secret` NON PLUS : la première est POSÉE PAR LE CODE
 * (`INTENSITE_INITIALE`, `dossier/types.ts`) parce qu'elle est REQUISE, la seconde est
 * OMISE parce qu'elle est OPTIONNELLE (KR-221 — on ne sème pas un optionnel que
 * l'auteur n'a pas posé). La symétrie EST l'arbitrage, et elle se lit ici.
 */
export interface LienResolu {
	cibleId: string
	lien: string
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `RapportsRendus` (KR-231).
 *
 *  `ajouts` et NON `relations` : un champ homonyme du document inviterait
 *  `{...personnage, relations: proposition.relations}` — un ÉCRASEMENT de ce que
 *  l'auteur a déjà écrit, là où la sémantique d'écriture de cette liste est l'AJOUT.
 *  Le nom porte la sémantique d'écriture, précédent `PropositionRepliques.ajouts`. */
export interface PropositionRelations {
	personnageId: string
	ajouts: readonly LienResolu[]
}

/**
 * CE QUE LE MODÈLE REND, ÉLÉMENT PAR ÉLÉMENT — franchit le réseau. LE PREMIER ÉLÉMENT
 * DE PROSE PURE À DEUX CHAMPS : deux textes libres dans le même objet, là où l'élément
 * mixte de l'it3c portait un jeton ET une prose.
 *
 * `place`, et JAMAIS `fonction` : la clé réseau NOMME LA FORME, jamais le champ (règle
 * du dépôt, mesurée sur les cinq rôles livrés). `metier` a été refusé — il RÉTRÉCIT, un
 * seigneur n'a pas de métier —, et ⚠ `role` est une COLLISION FRONTALE avec
 * `CorpsDemande.role` et avec l'étiquette `Cible*.role` : le même mot porterait le rôle
 * de la demande et la charge d'un personnage.
 *
 * `poursuite`, et JAMAIS `but` (nom du champ) : `objectif` est pris (KR-198, la clé
 * voisine `objectif_id` est une RÉFÉRENCE moteur) et `quete` est à la fois une
 * collection du dossier ET un espace de noms d'identifiants — il MORDRAIT le scanner
 * d'identifiants.
 *
 * ⚠ AUCUNE FENTE DE DÉSIGNATION — ni rang, ni handle, et c'est ce qui borne PAR LA
 * FORME le seul risque que ce rôle ne peut pas faire constater : une `poursuite` qui
 * renverrait à une autre proposition du même lot reste confinée dans la prose que
 * l'auteur lit avant d'accepter, et ne peut pas produire de pointeur cassé. C'est la
 * différence avec l'it3c. Qu'on lui ajoute un rang, et la parade tombe.
 *
 * SON CONSOMMATEUR est la branche de succès de `validerDistribution`
 * (`schemaSortie.ts`) : une forme réseau que rien ne consomme est une déclaration sans
 * appelant (KR-109). NON ré-exportée par `brain/index.ts`.
 */
export interface FicheReseau {
	place: string
	poursuite: string
}

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, une LISTE d'éléments de prose.
 *
 *  `distribution` : LE MOT DE LA DÉMO. Pas `personnages` — c'est le nom de la
 *  collection, donc nommer le champ (veto de l'itération 3b) — et pas `fiches`, qui est
 *  un mot d'écran.
 *
 *  NON ré-exportée par `brain/index.ts` : aucune feature ne lit ce que le modèle rend. */
export interface DistributionRendue {
	distribution: readonly FicheReseau[]
}

/**
 * CE QUE LE CODE RE-RÉSOUT, ÉLÉMENT PAR ÉLÉMENT — ne franchit JAMAIS le réseau. ZÉRO
 * clé commune avec `FicheReseau` : {`place`,`poursuite`} ∩ {`fonction`,`but`} = ∅. C'est
 * KR-231 au NIVEAU DE L'ÉLÉMENT, et il s'ajoute à celui du niveau de la liste.
 *
 * ⚠ ELLE N'EST PAS ASSIGNABLE À `Personnage`, ET C'EST UN INVARIANT DE COMPILATION, PAS
 * UNE CONVENTION : `Personnage` exige QUATRE champs (`id`, `portee`, `plan_actions`,
 * `savoirs`) qu'aucune fente de ce type ne porte. « Le brouillon est SANS IDENTITÉ »
 * cesse donc d'être une promesse de docstring — `const p: Personnage = brouillon` ne
 * compile pas.
 * ⚠ MAIS `tsc` TIENT LA FORME, JAMAIS LE MOMENT : un précalcul des N identifiants À
 * CÔTÉ du brouillon compilerait parfaitement. C'est pourquoi le site d'appel de
 * `frapperIdentifiant` est tenu par un ESPION, côté feature, et non par ce type.
 *
 * ⚠ ÉCRITE À LA MAIN ET FERMÉE — jamais `Pick<Personnage, …>` ni `Partial` ni `Omit` :
 * toute dérivation SUIVRAIT le schéma, et le jour où `Personnage` gagne une prose, le
 * modèle gagnerait un champ sans qu'une ligne change ici.
 *
 * ⚠ `but: { libelle: string }` ET NON `But` : `But` autorise `pourquoi` et `echeance`,
 * c'est-à-dire deux champs que personne ne valide dans ce contrat. La forme écrite ici
 * est assignable à `But` sans lui être égale — c'est exactement ce qu'on veut.
 *
 * `fonction` et `but.libelle` NOMMENT LA DESTINATION dans le document, là où le fil
 * portait `place` et `poursuite` — même précédent que `intention` → `action` au rôle
 * plan et que `nature` → `lien` au rôle relations. Ne pas « harmoniser ».
 */
export interface FicheBrouillon {
	fonction: string
	but: { libelle: string }
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune avec
 *  `DistributionRendue` (KR-231).
 *
 *  ⚠ PREMIÈRE PROPOSITION SANS IDENTIFIANT DE CIBLE. L'invariant des cinq rôles livrés
 *  — « la proposition est LA CIBLE PLUS LE CONTENU » — ne s'applique pas : LA CIBLE EST
 *  LE DOSSIER. Ne pas ajouter de `dossierId` « par symétrie » : il n'aurait aucun
 *  lecteur, et le dossier ouvert est déjà celui de l'écran.
 *
 *  `ajouts` et NON `distribution` : le nom porte la SÉMANTIQUE D'ÉCRITURE — la feature
 *  AJOUTE à `monde.personnages[]`, une acceptation à la fois. Précédents
 *  `PropositionRepliques.ajouts` et `PropositionRelations.ajouts`. */
export interface PropositionDistribution {
	ajouts: readonly FicheBrouillon[]
}
