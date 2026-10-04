/**
 * LE VOCABULAIRE DU COPILOTE — les deux formes d'une proposition, et le pont
 * entre les deux façons de nommer un champ.
 *
 * Ce module ne contient AUCUNE logique : il ferme des ensembles (KR-117). La
 * validation de forme vit dans `schemaSortie.ts`, l'assemblage du contexte dans
 * `contexte.ts`, l'appel réseau dans `../CopiloteService.ts`.
 */
// `Commande`/`CommandeId` UNIQUEMENT — `dossier/commandes.ts` n'importe rien de
// `copilote/`, donc AUCUN cycle, ni de type ni de valeur. `import type` reste la
// bonne forme malgré tout : ce module ne consomme que la FORME de `Commande`,
// jamais son registre (`COMMANDES`, `executerCommande`), qui vit dans
// `interprete.ts` et `schemaSortie.ts`.
import type { Commande, CommandeId } from '../dossier/commandes'
// `Characteristic`/`ChallengeTier` (n° 11 `moteur-arbitre`, it2) — TYPE SEUL, ni
// `characteristics.ts` ni `challenge.ts` n'important rien de `copilote/`, donc
// AUCUN cycle. Ce sont les deux registres FERMÉS que R2 choisit par appartenance.
import type { ChallengeTier } from '../challenge'
import type { Characteristic } from '../characteristics'
import type { EtatSession, FaitEtabli, ResumeMemoire } from '../dossier/session'
// LES DEUX FORMES STOCKÉES DE LA MÉMOIRE (n° 10 it3) sont DÉCLARÉES dans
// `dossier/session.ts` — leur seul domicile, parce que `recit.ts` (qui les écrit) ne
// connaît que des types de `dossier/` (KR-260) — et RÉ-EXPORTÉES ici, où la forme
// RÉSOLUE du narrateur (`SortieNarrateur`) les nomme. Le MÊME type, jamais deux qui se
// ressemblent.
export type { FaitEtabli, ResumeMemoire } from '../dossier/session'
// CYCLE DE TYPE SEUL, ET IL DOIT LE RESTER — `../CopiloteService` type-importe ce
// module, et celui-ci type-importe `EchecCopilote` de lui pour composer
// `ReponseNarrateur`. `import type` est EFFACÉ à l'émission : AUCUN cycle au
// runtime. Précédent au dépôt : `contexte/distribution.ts` importe
// `CibleDistribution` du service de la même façon. Ne jamais transformer cette
// ligne en import de VALEUR.
import type { EchecCopilote } from '../CopiloteService'

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

/**
 * LE SEPTIÈME RÔLE — `interprete` (n° 10, `moteur-interprete`) — ET LE PREMIER
 * QUI N'ENTRE PAS DANS `RoleCopilote`. Ce rôle NE PASSE PAS par les registres
 * `Record<RoleCopilote, …>` de `contexte/registres.ts` (`CHAMPS_INJECTES`,
 * `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`) : son contexte n'est ni une
 * fiche d'entité ni une prose de rédaction, c'est une TRADUCTION D'ACTION sur
 * un graphe de lieux, et l'ajouter à ces registres aurait exigé une 7ᵉ entrée
 * partout, y COMPRIS dans des fichiers hors du lot `contrat` de cette
 * itération (`contexte/registres.ts`, `worker/frontiere.test.ts`). Voir le
 * compte rendu de lot pour le détail de ce choix et son coût si on le renverse.
 *
 * CE QUE LE MODÈLE REND — franchit le réseau. TROIS FORMES DISJOINTES, jamais
 * une clé en commun avec `SortieInterprete` (résolu) ni avec `Commande`
 * (domaine) : KR-231 au niveau du RÔLE ENTIER, pas seulement de l'élément.
 * NON ré-exportée par `brain/index.ts` — précédent : les six formes réseau qui
 * la précèdent.
 *
 * `{geste, designe}` — un geste rangé (`G1…`) et ses cibles rangées (`P1…`),
 * dans L'ORDRE ATTENDU par `COMMANDES[id].refKinds` — jamais un `Commande` :
 * `geste`/`designe` sont des RANGS, `Commande.commande`/`Commande.cibles` sont
 * des IDENTIFIANTS résolus. Le pont est `resoudreInterpretation`
 * (`brain/dossier/interprete.ts`), et lui seul.
 *
 * `{precision}` — une question de clarification, prose contrainte (validée par
 * `validerInterprete`).
 *
 * `{sans_commande: true}` — aucune des deux formes ci-dessus ne s'applique.
 * SCALAIRE ET NON UNE LISTE VIDE : narrower que « une liste de gestes rendus
 * vide », ce serait représentable de deux façons pour dire la même chose.
 */
export type InterpretationRendue =
	| { readonly geste: RangInjecte; readonly designe: readonly RangInjecte[] }
	| { readonly precision: string }
	| { readonly sans_commande: true }

/**
 * CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. LE SEUL TYPE QUE LA
 * FEATURE (`play-mode`) VOIT : `interprete.ts` ni `CopiloteService.ts` ne
 * laissent jamais fuiter `InterpretationRendue` au-delà de leur frontière.
 *
 * ZÉRO CLÉ COMMUNE avec `InterpretationRendue` : `{geste,designe,precision,
 * sans_commande} ∩ {lecture,commande,question,gestes_possibles} = ∅` (KR-231).
 * `Commande` N'EST PAS UNE VIOLATION DE CETTE RÈGLE malgré son nom partagé
 * avec le champ `commande` : elle n'apparaît que NESTÉE sous
 * `SortieInterprete.commande`, un type produit UNIQUEMENT par
 * `resoudreInterpretation` après re-résolution complète — jamais la forme
 * brute reçue du réseau.
 *
 * `lecture: 'commande'` — traduite en commande reconnue — un déplacement
 * (`aller`), ou depuis l'it2 une action sur place (`agir`, arité 0, `cibles`
 * VIDE) —, prête pour `executerCommande` (même entonnoir que la console, KR-013).
 *
 * `lecture: 'clarification'` — R1 ne peut pas trancher seul ; `question` est
 * la prose VERBATIM qu'elle a rédigée (audience `'ia'` côté session dès
 * qu'elle repart au tour suivant, jamais recopiée à l'écran comme une fiche).
 *
 * `lecture: 'sans_commande'` — hors `COMMANDES`. `gestes_possibles` NOMME CE
 * QUI ÉTAIT RÉELLEMENT ATTEIGNABLE au tour courant (les clés dont
 * `tables.gestes` portait une entrée) — jamais le registre complet : un geste
 * dont aucune cible n'existait n'est jamais annoncé comme possible (précédent
 * `GABARIT_NON_RECONNU`, `play-mode`, it2).
 * ⚠ LE COURT-CIRCUIT « AUCUN GESTE SATISFIABLE ⇒ `sans_commande` SANS APPEL » DE
 * L'IT1 EST MORT À L'IT2, ET RETIRÉ DU SERVICE : `agir` est d'arité 0, donc
 * TOUJOURS satisfiable (`[].every(…)` vaut `true`), et `tables.gestes` n'est plus
 * jamais vide. `gestes_possibles` n'est donc plus jamais vide non plus.
 */
export type SortieInterprete =
	| { readonly lecture: 'commande'; readonly commande: Commande }
	| { readonly lecture: 'clarification'; readonly question: string }
	| { readonly lecture: 'sans_commande'; readonly gestes_possibles: readonly CommandeId[] }

/**
 * LES TABLES DE RÉ-RÉSOLUTION DU RÔLE `interprete` — rendues par
 * `assemblerInterprete` (`contexte/interprete.ts`), UNE FOIS, AVANT la boucle
 * de rejeu. `validerInterprete` (`schemaSortie.ts`) les CONSULTE pour
 * l'appartenance (`Map.has`) ; `resoudreInterpretation`
 * (`brain/dossier/interprete.ts`) les CONSULTE pour la résolution
 * (`Map.get`) — LA MÊME PAIRE DE TABLES POUR LES DEUX GESTES, jamais deux
 * dérivations qui pourraient diverger (KR-013).
 *
 * NE SORT JAMAIS de `brain/` — précédent exact `ContexteDetenteursRendu.rangs`
 * (`contexte/noyau.ts`) : une feature qui pourrait la lire pourrait la
 * RE-DÉRIVER, et désigner le mauvais lieu quand le dossier a changé entre
 * l'appel et l'exécution.
 */
export interface TablesInterprete {
	/** `P1…` → `Lieu.id`, les seuls lieux à la fois ACCESSIBLES et DÉCRITS. */
	readonly lieux: ReadonlyMap<RangInjecte, string>
	/**
	 * `I1…` → `Personnage.id` (n° 12 `moteur-acteurs`, it1, ADDITIF) — les seuls
	 * PNJ à la fois PRÉSENTS au lieu courant et IDENTIFIÉS (`fonction` ou
	 * `apparence` rédigée). TABLE ET COMPTEUR SÉPARÉS de `lieux` (préfixe `I`,
	 * désaccord #4 du raffinage it1) : un rang `I<n>` tenté sur `lieux` (ou
	 * l'inverse) échoue en `rang-inconnu` (`validerInterprete`, prédicat 5),
	 * jamais une résolution croisée.
	 */
	readonly personnages: ReadonlyMap<RangInjecte, string>
	/** `G1…` → `CommandeId`, les seules commandes SATISFIABLES au tour courant
	 *  (au moins une cible rangée pour chacun de leurs `refKinds`). */
	readonly gestes: ReadonlyMap<RangInjecte, CommandeId>
}

/**
 * L'AVIS QUE LE JOUEUR VOIT — rendu par `apresInterpretation`
 * (`brain/dossier/interprete.ts`), seule décideuse. Union FERMÉE : une carte
 * qui la rétrécit totalement n'a aucun bras muet.
 *
 * `{type:'aucun'}` — commande acceptée, et C'EST LE SEUL MEMBRE QUI OUVRE LE
 * NARRATEUR (it2) : l'orchestrateur n'appelle le rôle `narrateur` que sur lui,
 * APRÈS avoir persisté la session. Le nom n'est pas changé (« aucun AVIS »,
 * pas « aucun récit ») : le récit ne passe JAMAIS par cette union, il est posé
 * sur le journal par `consignerNarration` et relu de là.
 * `{type:'non_reconnu'; gestes_possibles}` — voir `SortieInterprete.sans_commande`
 * ci-dessus, même charge, même règle de dérivation.
 * `{type:'clarification'; question}` — `PRÉCISEZ` ⇔ cette union vaut ce membre
 * ⇔ `session.attente !== undefined` : les trois sont un SEUL invariant, jamais
 * trois à tenir en phase (KR-013).
 * `{type:'reformuler'}` — anti-boucle (KR-264, une attente déjà pendante) OU
 * sortie illisible après un rejeu OU `canon.ton` non écrit (dégradation
 * silencieuse retenue, § 8 désaccord 22 du plan d'itération) : même texte fixe
 * pour les trois, l'auteur n'a pas à distinguer leurs causes à l'écran.
 * `{type:'refus_moteur'}` — `executerCommande` a refusé une commande pourtant
 * validée (inatteignable par construction, gardé par défense KR-175) ou la
 * réponse reçue n'était pas une proposition (panne réseau/contexte, gardé par
 * défense pour la même raison).
 */
export type AvisInterprete =
	| { readonly type: 'aucun' }
	| { readonly type: 'non_reconnu'; readonly gestes_possibles: readonly CommandeId[] }
	| { readonly type: 'clarification'; readonly question: string }
	| { readonly type: 'reformuler' }
	| { readonly type: 'refus_moteur' }

// ══ LE HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2) ══════════
//
// ⚠ SES QUATRE TYPES VIVENT ICI, Y COMPRIS SA CIBLE ET SA RÉPONSE, ALORS QUE LES
// SEPT COUPLES `Cible*`/`Reponse*` PRÉCÉDENTS VIVENT DANS `../CopiloteService.ts`.
// C'est le fichier que le plan d'itération (§ 5, lot 1) leur assigne, et ce n'est
// pas une convention concurrente : le consommateur (`useTourDeJeu`) les lit par le
// baril `brain/index.ts`, qui ne distingue pas les deux domiciles. Le prix, nommé :
// un cycle de TYPE SEUL avec le service (voir l'import de tête).
//
// COMME `interprete`, CE RÔLE N'EST PAS DANS `RoleCopilote` : ni fiche d'entité ni
// prose de rédaction, il n'a rien à faire dans les trois `Record<RoleCopilote, …>`
// de `contexte/registres.ts` — son contexte a SA borne (`BUDGET_CARACTERES_NARRATEUR`,
// `contexte/narrateur.ts`), hors de la parité auteur de `worker/frontiere.test.ts`.

/**
 * LA CIBLE DU HUITIÈME RÔLE — la saisie du joueur et la session D'APRÈS
 * l'exécution, DÉJÀ PERSISTÉE (S1). Même charge que `CibleInterprete`, et c'est
 * l'étiquette seule qui les sépare au dispatch.
 *
 * `session`, et JAMAIS une projection d'`EtatMonde` ni des deltas passés à côté :
 * ce que le pas a changé se DÉRIVE de `session.journal` (entrées dont `tour` vaut
 * `horloge.tour`), dans l'assembleur — une seconde source de ce que le journal dit
 * déjà divergerait sur un pas à jalons (KR-013, § 8 désaccord 6 du plan).
 *
 * LA MÉMOIRE AUSSI SE DÉRIVE DE CETTE MÊME SESSION (it3) : la fenêtre des pas récents
 * de `horloge.tour` et de `journal`, la tranche à condenser et les faits pertinents de
 * `memoire` — par les trois fonctions de `dossier/memoire.ts`, jamais par un champ passé
 * à côté. `attente` n'entre TOUJOURS PAS dans le contexte de ce rôle, ni aucun nombre
 * d'horloge : la session porte tout l'historique, l'assembleur n'en lit que ce que la
 * politique de rétention lui désigne.
 */
export interface CibleNarrateur {
	role: 'narrateur'
	/** La saisie du joueur — ne franchit le réseau qu'en DERNIÈRE position du
	 *  contexte, normalisée, exactement comme pour l'interprète (KR-231). */
	saisie: string
	session: EtatSession
	/**
	 * LES DEUX ENJEUX DE L'ÉPREUVE TENTÉE À CE PAS (n° 11 `moteur-arbitre`, it2),
	 * SI R2 EN A PROPOSÉ UNE — **jamais** stockés en session (prose hors du rejeu,
	 * KR-013), donc transmis ICI par le hook (lot `feature`) depuis la proposition
	 * R2 reçue avant résolution. L'assembleur (`copilote/contexte/narrateur.ts`)
	 * choisit SEUL le côté advenu, via `issueDuJet` + `classifierIssue`
	 * (`brain/dossier/arbitre.ts`) — **jamais** le hook, qui classerait une règle
	 * de jeu hors de `brain/` (décision autonome du lot `contrat`, it2).
	 * `undefined` quand `agir` n'a produit aucune épreuve — pas de ligne de plus
	 * dans `CE PAS`.
	 */
	readonly epreuve?: { readonly enjeu_reussite: string; readonly enjeu_echec: string }
}

/**
 * UN FAIT DURABLE QUE LA NARRATION ÉTABLIT, ÉLÉMENT PAR ÉLÉMENT — franchit le réseau.
 * LE SECOND ÉLÉMENT MIXTE du dépôt (après `RapportRendu`) : de la PROSE (`phrase`) et des
 * JETONS de désignation (`ancres`, `A1`, `A2`, … — préfixe `A`, disjoint des `P`/`G` de
 * l'interprète : deux espaces de rangs, deux scanners).
 *
 * `phrase`/`ancres`, et JAMAIS `fait`/`sur` : ces deux-là NOMMENT LA DESTINATION stockée
 * (`FaitEtabli`, `dossier/session.ts`). `{phrase, ancres} ∩ {fait, sur} = ∅` — KR-231 au
 * NIVEAU DE L'ÉLÉMENT, épinglé par `schemaSortie.test.ts`. `ancres` rime avec le préfixe
 * `A` que le modèle lit dans le contexte.
 *
 * ⚠ LES ANCRES NE SONT JAMAIS PASSÉES AU SCANNER D'IDENTIFIANTS : ce sont NOS PROPRES
 * jetons, constatés par APPARTENANCE à la table de l'assembleur (précédent `envers`).
 */
export interface ConstatRendu {
	readonly phrase: string
	readonly ancres: readonly RangInjecte[]
}

/**
 * CE QUE LE MODÈLE REND — franchit le réseau. TROIS clés toujours, et une QUATRIÈME
 * seulement quand la demande porte une tranche à condenser (it3) :
 *  · `narration` — la prose du pas, scalaire ;
 *  · `tentatives` — 0 à `TENTATIVES_MAX` pistes ;
 *  · `constats` — 0 à `FAITS_PAR_PAS_MAX` faits durables, ancrés par rang ;
 *  · `condense?` — le résumé réécrit, DEMANDÉ OU INTERDIT selon le contexte, jamais
 *    facultatif au sens large : une clé présente alors qu'elle n'était pas demandée est
 *    un REFUS DU LOT (signal de dérive KR-236).
 *
 * `{narration, tentatives, constats}` EST UN BLOC ATOMIQUE sous KR-230 ; `condense` seul
 * en est DÉCOUPLÉ (KR-271) — voir `validerNarrateur`.
 *
 * `narration`, et JAMAIS `recit` : `recit` est le NOM DU CHAMP de destination
 * (`EntreeJournal.recit`), et une clé réseau homonyme du champ est exactement la
 * confusion que KR-231 ferme. `tentatives`, et JAMAIS `relances` (un « crochet
 * d'intrigue » en jargon de MJ : le mot inviterait le modèle à écrire du lore) ni
 * `suggestions` (nom de la forme résolue). `constats`, jamais `faits`/`etablis` (sous-
 * chaînes de la clé résolue) ; `condense`, jamais `resume` (nom de la destination).
 *
 * ZÉRO CLÉ COMMUNE avec `SortieNarrateur`, avec `InterpretationRendue`/`SortieInterprete`
 * et avec la clé du rôle plan (`intention`) — épinglé par `schemaSortie.test.ts`.
 *
 * SON CONSOMMATEUR est la branche de succès de `validerNarrateur` (`schemaSortie.ts`) :
 * une forme réseau que rien ne consomme est une déclaration sans appelant (KR-109).
 * NON ré-exportée par `brain/index.ts` — précédent des sept formes réseau.
 */
export interface NarrationRendue {
	narration: string
	tentatives: readonly string[]
	constats: readonly ConstatRendu[]
	condense?: string
}

/**
 * CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. LE SEUL TYPE DE CE RÔLE QUE
 * LA FEATURE VOIT. La re-résolution est un RENOMMAGE DE DESTINATION pour la prose —
 * `narration` → `recit`, `tentatives` → `suggestions`, `condense` → `resume.texte` — et un
 * `Map.get` pour les ancres — `constats[].ancres` → `faits_etablis[].sur`, sur la table
 * RENDUE PAR L'ASSEMBLEUR, jamais re-dérivée (KR-231). La clé réseau ENSEIGNE au modèle,
 * la clé résolue NOMME la destination. Ne pas « harmoniser ».
 *
 * `recit`, `faits_etablis` et `resume` sont destinés à la session, par
 * `consignerNarration` et elle seule, en UNE transition ; `suggestions` n'est JAMAIS
 * persisté — c'est une donnée d'écran du pas courant.
 *
 * `faits_etablis` est REQUIS — la liste VIDE est la réponse honnête d'un pas où rien de
 * durable n'a été établi. `resume` est OPTIONNEL, et son absence ne dit RIEN du récit :
 * il n'est présent que si la condensation était due ET que `condense` a passé sa propre
 * garde ; `jusqu_au_pas` y est posé par le SERVICE, depuis la tranche que l'assembleur a
 * calculée, jamais par le modèle.
 */
export interface SortieNarrateur {
	readonly recit: string
	readonly suggestions: readonly string[]
	readonly faits_etablis: readonly FaitEtabli[]
	readonly resume?: ResumeMemoire
}

/** LA HUITIÈME UNION NOMMÉE — même doctrine que les sept précédentes : aucun appelant ne
 *  peut lire une proposition sur un échec, c'est le TYPAGE qui l'interdit. Sur un échec,
 *  le pas déjà joué reste ACQUIS et rien n'est posé — ni récit, ni fait, ni résumé : c'est
 *  à l'orchestrateur de ne pas appeler `consignerNarration`, et il n'a rien à lui passer.
 *
 *  ⚠ UN `condense` REFUSÉ N'EST PAS UN ÉCHEC, et ne passe donc JAMAIS par cette union : la
 *  réponse est `propose`, sans `resume`. Le motif du refus du condensé n'en sort pas —
 *  personne ne le lirait (KR-249/268). */
export type ReponseNarrateur = { statut: 'propose'; proposition: SortieNarrateur } | EchecCopilote

// ══ LE NEUVIÈME RÔLE — `arbitre` (n° 11 `moteur-arbitre`, it2) ══════════════
//
// ⚠ SES TROIS TYPES VIVENT ICI, Y COMPRIS SA CIBLE ET SA RÉPONSE, MÊME DOMICILE
// QUE LE HUITIÈME (`narrateur`) — c'est le fichier que le plan d'itération (§ 5,
// lot 1) leur assigne, lu par `CopiloteService.ts` (surcharge + implémentation,
// « deux sites ») et par la feature via le baril `brain/index.ts`.
//
// COMME `interprete` ET `narrateur`, CE RÔLE N'EST PAS DANS `RoleCopilote` : ni
// fiche d'entité ni prose de rédaction, il n'a rien à faire dans les trois
// `Record<RoleCopilote, …>` de `contexte/registres.ts`. Son contexte a SA PROPRE
// borne (`BUDGET_CARACTERES_ARBITRE`, `contexte/arbitre.ts`), hors de la parité
// auteur de `worker/frontiere.test.ts`.

/**
 * LA CIBLE DU NEUVIÈME RÔLE — **sans** `session` : le héros et la mémoire sont
 * INATTEIGNABLES PAR COMPILATION (durci au raffinage, § 8 #2 du plan it2 — R2 ne
 * voit **jamais** les caractéristiques du héros, et c'est le CODE qui lit
 * `heros.caracs[carac]` APRÈS que R2 a choisi `{carac,tc}` à l'aveugle).
 *
 * `saisie` (§ 8 #7, RETENU au raffinage — le tech-lead s'est corrigé lui-même au
 * tour 2) : sans elle, R2 choisirait `{carac,tc}` à l'aveugle de l'action RÉELLE
 * tentée par le joueur, et `dangers` en déciderait seul — exactement le routage
 * par contenu de prose que KR-262/244 ferme.
 *
 * `lieuId`, et JAMAIS `lieu_id` : signature FIGÉE au § 4 du plan it2.
 */
export interface CibleArbitre {
	role: 'arbitre'
	readonly saisie: string
	readonly lieuId: string
}

/**
 * CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau tel quel (la FORME
 * réseau, elle, est validée et narrowed en une seule passe par `validerArbitre`,
 * ce rôle n'ayant aucun jeton à re-résoudre par `Map.get` : `carac`/`tc` sont
 * CONSTATÉS par appartenance aux deux registres FERMÉS `CHARACTERISTICS`/
 * `CHALLENGE_TIERS`, jamais re-dérivés depuis une table rendue par l'assembleur —
 * précédent qui les distingue de tous les rôles à rangs : un registre FIGÉ ne
 * dérive pas entre l'appel et l'acceptation, § 8 #14 du plan it2).
 *
 * LE WRAPPER SEUL EST RENOMMÉ (§ 8 #3, RETENU PARTIELLEMENT) : `jet`/`sans_jet`
 * (texte littéral du cadrage) devient `epreuve`/`sans_epreuve` — homonyme évité
 * avec `EntreeJournal.jet` (précédent `narration` ≠ `recit`, KR-231). `carac`/`tc`/
 * `enjeu_reussite`/`enjeu_echec` restent INCHANGÉS : zéro homonyme réel à lever,
 * et renommer sans motif serait le churn que CLAUDE.md/WORKFLOW.md proscrit.
 *
 * `pourquoi` N'EST PAS ICI (§ 8 #6, RETIRÉ) : zéro lecteur dans les 6 états de la
 * carte (contrat UX exhaustif) — KR-249 s'applique à un champ de sortie de modèle
 * comme à un champ de session.
 *
 * L'ÉPREUVE EST UNE INTERFACE NOMMÉE, jamais un objet inline dans l'union :
 * précédent `FicheReseau`/`FicheBrouillon` — un objet imbriqué directement dans
 * une union à deux branches produit, sous Prettier (`useTabs`), un mélange
 * tabs/espaces sur l'accolade fermante que `no-mixed-spaces-and-tabs` refuse.
 */
export interface EpreuveProposee {
	readonly carac: Characteristic
	readonly tc: ChallengeTier
	readonly enjeu_reussite: string
	readonly enjeu_echec: string
}

export type PropositionEpreuve = { readonly epreuve: EpreuveProposee } | { readonly sans_epreuve: true }

/** LA NEUVIÈME UNION NOMMÉE — même doctrine que les huit précédentes : aucun appelant
 *  ne peut lire une proposition sur un échec, c'est le TYPAGE qui l'interdit. */
export type ReponseArbitre = { statut: 'propose'; proposition: PropositionEpreuve } | EchecCopilote

// ══ LE DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1 à it4) ═══════════
//
// ⚠ SES TYPES VIVENT ICI (`CibleActeur`, `ReponseActeur`, depuis l'it2
// `SortieActeurBrute`, depuis l'it4 `CibleActeurResistible`/`ResistanceActeur`) —
// MÊME DOMICILE QUE `narrateur`/`arbitre` (§ 4/§ 5 du plan d'itération) : c'est le
// fichier que le lot `contrat` leur assigne, lu par `CopiloteService.ts` (surcharge +
// implémentation) et par la feature en import direct (`brain/copilote/types`).
//
// COMME `interprete`/`narrateur`/`arbitre`, CE RÔLE N'EST PAS DANS
// `RoleCopilote` : ni fiche d'entité ni prose de rédaction, il n'a rien à faire
// dans les trois `Record<RoleCopilote, …>` de `contexte/registres.ts`. Son
// contexte a SA PROPRE borne (`BUDGET_CARACTERES_ACTEUR`, `contexte/acteur.ts`),
// hors de la parité auteur de `worker/frontiere.test.ts`.

/**
 * LA CIBLE DU DIXIÈME RÔLE — `session`, `personnageId` et `saisie`, SIGNATURE
 * FIGÉE au § 4 du plan d'itération.
 *
 * `session`, et JAMAIS une projection : l'assembleur (`contexte/acteur.ts`)
 * dérive `TU AS DIT` du journal (`interlocuteur`, `recit`, `tour`) et `ETABLI`
 * de `session.memoire` — une seconde source de ce que la session dit déjà
 * divergerait (KR-013, précédent `CibleNarrateur`).
 *
 * `personnageId`, et JAMAIS `acteurId`/`entiteId` : AUCUN synonyme concurrent
 * n'existe pour ce rôle — c'est le nom du champ que `assemblerActeur` reçoit en
 * troisième position (signature figée).
 *
 * `saisie` — ce que le joueur a tapé à `parler`, EN DERNIÈRE position du
 * contexte, normalisée, bornée (`SAISIE_CARACTERES_MAX`, réutilisée de
 * `./interprete`, précédent `CibleArbitre`).
 *
 * `peutResister?: false` (it4) — L'OPT-IN EST SUR LES DEUX CIBLES : `CibleActeur`
 * ne peut JAMAIS produire `ResistanceActeur`, c'est le TYPE qui l'interdit — la
 * surcharge de `CopiloteService.demander` qui rend `ResistanceActeur` n'accepte
 * que `CibleActeurResistible` (`peutResister: true`), et `true` n'est pas
 * assignable à `false | undefined`. C'est ce qui rend la chaîne R4 → jet → R4 → jet
 * INEXPRIMABLE : l'appel qui suit un jet est une `CibleActeur`. Le champ reste
 * OPTIONNEL : tout appelant d'avant l'it4 compile et se comporte à l'identique.
 *
 * `epreuve?` (it4) — L'APPEL 2, celui qui SUIT la résolution d'un jet : les DEUX
 * ENJEUX que R4 avait proposés avec `resiste`, rendus par le hook (lot `feature`)
 * depuis la `CarteJet` — comme `CibleNarrateur.epreuve`, jamais stockés en session
 * (prose hors du rejeu, KR-013). L'assembleur (`contexte/acteur.ts`) choisit SEUL
 * le côté advenu via `issueDuJet` : jamais le hook, qui classerait une règle de jeu
 * hors de `brain/`. ABSENT, c'est un appel ordinaire.
 */
export interface CibleActeur {
	role: 'acteur'
	readonly personnageId: string
	readonly saisie: string
	readonly session: EtatSession
	readonly peutResister?: false
	readonly epreuve?: Pick<EpreuveProposee, 'enjeu_reussite' | 'enjeu_echec'>
}

/**
 * LA CIBLE QUI PEUT RENDRE `ResistanceActeur` (it4) — mêmes `personnageId`,
 * `saisie` et `session` que `CibleActeur`, PLUS `peutResister: true`, SANS
 * `epreuve` : l'appel 1 d'un échange à jet, jamais l'appel 2. Deux interfaces et non
 * une union de littéraux : le discriminant `peutResister` (`true` contre
 * `false | undefined`) sépare les deux surcharges de `CopiloteService.demander`, et
 * `epreuve?: never` rend un appel « résistible ET résolu » non représentable.
 *
 * `peutResister: true` est une PERMISSION, pas une garantie : R4 n'est invité à
 * résister que si le moteur met réellement un savoir en jeu (`savoirSousEpreuve`,
 * héros présent — décidé par l'assembleur, jamais par l'appelant). Sans savoir en
 * jeu, `{resiste}` est refusé `'schema'`, exactement comme sur une `CibleActeur`.
 */
export interface CibleActeurResistible {
	role: 'acteur'
	readonly personnageId: string
	readonly saisie: string
	readonly session: EtatSession
	readonly peutResister: true
	readonly epreuve?: never
}

/**
 * CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau tel quel, DEPUIS l'it2
 * (n° 12 `moteur-acteurs`, lot `contrat` — patron « catalogue borné », KR-287).
 *
 * `replique` reste de la PROSE PURE, sans rang à re-résoudre — INVARIANT ASSUMÉ
 * conservé depuis l'it1. `indices_reveles`, LUI, EST traduit : le réseau porte des
 * RANGS (`S1…Sk`, voir `SortieActeurBrute`), re-résolus en IDENTIFIANTS par
 * `CopiloteService.demanderActeur` (`Map.get` sur la table rendue par
 * `assemblerActeur`, jamais re-dérivée — précédent `demanderDetenteurs`, KR-231).
 * AU PLUS UN élément (`REVELATIONS_PAR_REPLIQUE_MAX`), et la LISTE VIDE est un
 * SUCCÈS (franchise honnête, pas un refus).
 *
 * `delta_confiance` — TROISIÈME CLÉ DEPUIS L'IT3 (`docs/REGLES-DU-JEU.md` § 6),
 * REQUISE au même titre que `indices_reveles` (KR-236) : AUCUN défaut implicite,
 * son absence est un refus `'schema'` de TOUTE la sortie (`validerActeur`,
 * prédicat 13). PASSTHROUGH IDENTIQUE depuis `SortieActeurBrute`, AUCUNE
 * RE-RÉSOLUTION — contrairement aux rangs de `indices_reveles` : la valeur que
 * le modèle a écrite EST la valeur qu'applique `crediterConfiance`.
 *
 * Le CONSOMMATEUR (`useTourDeJeu`, lot `feature`) passe les TROIS champs à
 * `consignerReponseActeur` (`dossier/recit.ts`), seule porte d'écriture combinée
 * `recit`+`reveler_indice`+`a_dit`+`confiance`.
 */
export interface ReponseActeur {
	readonly replique: string
	readonly indices_reveles: readonly string[]
	readonly delta_confiance: -1 | 0 | 1
}

/**
 * LA DEMANDE DE JET (it4, `docs/REGLES-DU-JEU.md` § 6, « La porte `jet` ») — ce que
 * R4 rend QUAND IL RÉSISTE, à la place d'une réplique : `{ resiste: EpreuveProposee }`,
 * la MÊME forme que l'épreuve de R2 (`EpreuveProposee`), donc la même `CarteJet`,
 * réutilisée telle quelle (KR-289). FORME DISJOINTE de `ReponseActeur` — aucune clé
 * commune, et `'resiste' in réponse` suffit à les séparer (`EchecCopilote` porte
 * toujours `statut`, `ReponseActeur` jamais).
 *
 * `carac`/`tc` ne viennent JAMAIS de R4 : le modèle n'écrit que les deux enjeux
 * (`SortieActeurBrute`), et `CopiloteService.demanderActeur` pose `carac`/`tc` depuis
 * `revele_si.jet` du savoir que le MOTEUR a mis en jeu (`savoirSousEpreuve`,
 * `contexte/acteur.ts`) — une seule décision, un seul décideur. `enjeu_reussite` et
 * `enjeu_echec` ont passé `validerEnjeux` : l'attitude du PNJ, jamais le contenu du
 * savoir gardé.
 *
 * Produite UNIQUEMENT pour une `CibleActeurResistible` : le type de retour de la
 * surcharge qui l'admet est la seule porte (`ReponseActeur | ResistanceActeur |
 * EchecCopilote`). Son LECTEUR est `useTourDeJeu` (lot `feature`) : il pose la
 * `CarteJet` (KR-285 — un champ de sortie IA n'entre qu'avec son lecteur).
 */
export interface ResistanceActeur {
	readonly resiste: EpreuveProposee
}

/**
 * LA FORME A DE LA SORTIE RÉSEAU — la réplique. Type INTERMÉDIAIRE, CÔTÉ VALIDATEUR
 * SEUL (`schemaSortie.ts`) : `indices_reveles` y porte des RANGS BRUTS
 * (`RangInjecte`), jamais des identifiants — ZÉRO clé commune de VALEUR avec
 * `ReponseActeur`, dont le champ homonyme porte la forme RÉSOLUE (KR-231, même
 * invariant que `DetenteursRendus`/`PropositionDetenteurs`).
 *
 * `replique` est identique aux deux formes — PROSE PURE, rien à traduire.
 *
 * `delta_confiance` DEPUIS L'IT3 — `unknown`, BRUT, AVANT VALIDATION
 * (`validerActeur`, prédicat 13, constate son appartenance à `{-1, 0, 1}` avant
 * de rendre `ok: true`) : contrairement à `replique`/`indices_reveles`, qui
 * portent déjà leur forme de SORTIE (une chaîne, un tableau de rangs), ce champ
 * ne promet RIEN de son type tant que le prédicat n'a pas tranché — une
 * garantie que ce type INTERMÉDIAIRE ne fait PAS, par contraste délibéré avec
 * `ReponseActeur.delta_confiance: -1 | 0 | 1`.
 */
export interface RepliqueActeurBrute {
	readonly replique: string
	readonly indices_reveles: readonly RangInjecte[]
	readonly delta_confiance: unknown
}

/**
 * LA FORME B DE LA SORTIE RÉSEAU (it4) — les DEUX ENJEUX SEULS : pas de `carac`, pas
 * de `tc`, pas de savoir désigné, pas de réplique. Légale ssi `resistePermise`
 * (`validerActeur`). Déjà validée par `validerEnjeux` quand ce type est rendu.
 */
export interface ResistanceActeurBrute {
	readonly resiste: {
		readonly enjeu_reussite: string
		readonly enjeu_echec: string
	}
}

/**
 * CE QUE LE MODÈLE REND — franchit le réseau, DEPUIS l'it2 : DEUX FORMES DISJOINTES
 * DEPUIS L'IT4 (`RepliqueActeurBrute` | `ResistanceActeurBrute`), séparées par leurs
 * clés (jamais une forme « qui gagne » sur un mélange : refus `'schema'`). Type
 * INTERMÉDIAIRE, côté validateur ; `CopiloteService.demanderActeur` en tire
 * `ReponseActeur` ou `ResistanceActeur`.
 */
export type SortieActeurBrute = RepliqueActeurBrute | ResistanceActeurBrute
