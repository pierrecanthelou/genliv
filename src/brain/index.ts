/**
 * brain/ — the application core engine. Drives navigation, cross-feature
 * communication (Event Bus), and service wiring (Service Locator + DI).
 * Feature-agnostic: never imports from features/.
 */
// Le modèle d'arbre vit dans `./tree` depuis la scission de la n° 1 `dossier-format` ;
// il est ré-exporté ici SOUS LES MÊMES NOMS, de sorte qu'aucune ligne des features
// survivantes ne bouge (KR-159). Les types de règles restent dans `./types`.
export type { Book, BookNode, Edge, ChoicePrereq, ChoiceCountdown, NodeActionType } from './tree'
export type { NodeKind, EdgeKind } from './types'
export type {
	GameObject,
	DecorConfig,
	DecorInteraction,
	DecorReveal,
	TakeableKind,
	SkillRoll,
	TakeableObject,
	PnjConfig,
	PnjGift,
	PnjGiftEffect,
	MonsterConfig,
	TrapConfig,
	TrapInventoryLoss,
	TrapInventoryLossKind,
	RollOutcome,
} from './types'
export { ROLL_OUTCOMES, type RollOutcomeDescriptor } from './outcomes'
export {
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	DEFAULT_CHARACTERISTIC,
	CHARACTERISTIC_MAX,
	MONSTER_CHARACTERISTICS,
	maxPV,
	healthState,
	enduranceMalus,
	type Characteristic,
	type CharacteristicDescriptor,
	type MonsterCharacteristic,
	type HeroStats,
} from './characteristics'
export {
	CHALLENGE_TIERS,
	CHALLENGE_TIER_VALUES,
	DEFAULT_CHALLENGE_TIER,
	challengeTierValue,
	rollTier,
	randInt,
	rollDice,
	resolveChallenge,
	type ChallengeTier,
	type ChallengeTierDescriptor,
	type ChallengeResult,
} from './challenge'
export {
	WEAPONS,
	WEAPON_VALUES,
	DEFAULT_WEAPON,
	PROTECTIONS,
	PROTECTION_VALUES,
	DEFAULT_PROTECTION,
	type WeaponId,
	type WeaponDescriptor,
	type ProtectionId,
	type ProtectionDescriptor,
} from './equipment'
export {
	POSTURES,
	POSTURE_VALUES,
	maitriseDesCoups,
	ecartBand,
	pfBase,
	resolveAssault,
	type Posture,
	type PostureDescriptor,
	type HitQuality,
	type EcartBand,
	type Combatant,
	type AssaultResult,
} from './combat'
export {
	tierOf,
	deltaBand,
	challengeXp,
	combatXp,
	characteristicUpgradeCost,
	mcUpgradeCost,
	canUpgradeMC,
	MC_BONUS_MAX,
	MC_REQUIRES_IN,
	type Tier,
	type DeltaBand,
} from './xp'
export { BESTIARY, BESTIARY_BY_TEMPLATE, type MonsterTier } from './bestiary'
export {
	MONSTER_CAPACITIES,
	MONSTER_CAPACITY_VALUES,
	DEFAULT_CAPACITY,
	type MonsterCapacityId,
	type MonsterCapacityDescriptor,
} from './monsterCapacities'
export type { EquipmentEffect, MonsterStatBlock } from './types'
export { CREATURE_TYPES, type CreatureTypeDescriptor, type FleeStrategy } from './creatureTypes'
export { createId } from './utils/id'
export type { EventBus, AppEvents, AppEventName } from './EventBus'
export type { PersistenceService } from './PersistenceService'
export { createLocalStoragePersistence } from './PersistenceService'
export type { SyncStatus } from './types'
export type { CloudSyncService, CloudTransport, CloudSyncOptions } from './CloudSyncService'
export { createLocalStorageTransport } from './LocalStorageTransport'
export { createCloudflareKVTransport } from './CloudflareKVTransport'
export { createCloudSettings, type CloudSettingsService } from './CloudSettingsService'
// ── Le COPILOTE de rédaction (feature n° 8 `dossier-copilote`) ───────────────
// Sort le CONTRAT, jamais la fabrique : `createBrain` construit le service, une
// feature le consomme par `useBrain().copilote`. `RaisonIndisponible` et
// `MotifIllisible` sortent AVEC `ReponseCopilote` et non pour eux-mêmes — ils sont
// membres de sa forme publique, et une feature qui doit annoter une branche
// n'aurait aucun autre moyen de les NOMMER (même motif que `PorteeContreMesure`
// avec `ContreMesure`).
// NE SORTENT PAS : `assemblerProse`, `assemblerDetenteurs`, `ContexteProse`,
// `ContexteDetenteurs`, `CHAMPS_INJECTES`, `DEROGATIONS_AUDIENCE`,
// `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`, `CANDIDATS_MAX` — aucune
// feature n'a de raison de composer un contexte elle-même, ni de lire la garde
// d'audience. Même traitement que `DESTINATION_DES_CHAMPS` et `amorce.ts`.
// NE SORT PAS NON PLUS : `PropositionRendue`, `DetenteursRendus` ni
// `RepliquesRendues`, les formes RÉSEAU. Leur seul consommateur légitime est la
// branche de succès de leur validateur, dans `brain/` ; une feature lit
// `PropositionResolue`, `PropositionDetenteurs` ou `PropositionRepliques`, jamais ce
// que le modèle rend. Les ré-exporter donnerait une ligne publique sans appelant
// (KR-109) — et, pour la troisième, la clé `repliques` voisinerait `ajouts` dans le
// même baril alors que KR-231 exige précisément qu'on ne puisse pas les confondre.
// NE SORTENT PAS ENFIN : `RangInjecte`, `validerDetenteurs`, `validerRepliques`,
// `GABARIT_SORTIE`, `PROPOSITIONS_MAX`, `REPLIQUES_PROPOSEES_MAX`. LA TABLE DES
// RANGS NE SORT JAMAIS DE `brain/copilote/` — KR-231 tenu par la PORTÉE, pas par une
// convention : une feature qui pourrait la lire pourrait la RE-DÉRIVER, et écrire
// dans le personnage n° 3 au lieu du n° 2 quand le dossier a changé entre l'appel et
// l'acceptation. `REPLIQUES_PROPOSEES_MAX` reste dedans elle aussi : elle borne la
// RÉPONSE DU MODÈLE, et la seule borne dont une feature ait besoin au SITE
// D'ÉCRITURE est `PARLER_REPLIQUES` (`dossier/curseurs`), qui borne le DOCUMENT et
// qui est DÉJÀ exportée plus bas — zéro ligne neuve. Les exposer côte à côte
// inviterait à les aligner, ce que le § 8 (TL3a-7) refuse.
// `EchecCopilote` sort, elle : c'est la branche d'échec COMMUNE aux trois rôles, et
// l'état d'écran des trois cartes la porte.
export type {
	CopiloteService,
	CibleCopilote,
	CibleIndice,
	CibleRepliques,
	ReponseCopilote,
	ReponseDetenteurs,
	ReponseRepliques,
	EchecCopilote,
	RaisonIndisponible,
} from './CopiloteService'
export { CHAMPS_PROPOSABLES } from './copilote/types'
export type {
	RoleCopilote,
	ChampProseCle,
	ChampProseChemin,
	PropositionResolue,
	PropositionDetenteurs,
	PropositionRepliques,
} from './copilote/types'
// `MotifIllisible` est INCHANGÉE à l'itération 3a — le troisième validateur n'ajoute
// aucun membre : ses quatre motifs atteignables (`schema`, `vide`, `marqueur`,
// `identifiant`) en sont déjà membres, et `'rang-inconnu'` lui est SANS OBJET.
export type { MotifIllisible } from './copilote/schemaSortie'
// `MotifRefusContexte` sort AVEC `EchecCopilote`, même motif que `MotifIllisible` :
// la carte 2 doit pouvoir NOMMER la branche `'cible-a-ecrire'` ou
// `'aucun-candidat'` pour en tirer son texte, et elle n'a aucun autre moyen de le
// faire. Le registre `LIBELLE_DES_CHAMPS` reste à quatre entrées : les motifs SANS
// charge sont nommés en prose française par la feature, jamais par un libellé
// d'écran (§ 8, TL-8).
export type { MotifRefusContexte } from './copilote/contexte'
export { createUIPreferencesService } from './UIPreferencesService'
export type { UIPreferencesService, BookUIPrefs, Viewport, LayoutSpacing } from './UIPreferencesService'
export { createMonsterLibraryService } from './MonsterLibraryService'
export type { MonsterLibraryService, SavedMonster } from './MonsterLibraryService'
export type { Router, Route } from './Router'
export type { BookService, NodePatch } from './BookService'
export { autoSlot } from './BookService'
// ── Le DOSSIER D'AVENTURE (feature n° 1 `dossier-format`) ────────────────────
// Le contrat entre les deux temps. `deepFreeze`, `collectIds` et `feuilleDe` ne
// sont DÉLIBÉRÉMENT pas ré-exportés ici : le premier n'a qu'un site d'appel
// légitime (la sortie de `validateDossier`, KR-166) et l'exposer inviterait les
// autres ; les deux suivants n'ont d'appelants que le validateur et le registre
// d'anomalies. `DESTINATION_DES_CHAMPS` non plus : aucun consommateur hors de
// `brain/dossier/` avant la n° 10, qui bâtira son contexte à partir d'elle.
// MÊME RÈGLE pour l'itération 3 : les TYPES des conditions sortent (`ExprNode`,
// `Objectif`, `PredicatId` — la n° 3 en aura besoin pour typer ses formulaires),
// les VALEURS restent (`PREDICATES`, `validateExpr`, `collectRefs`,
// `FAMILLES_DE_CONDITIONS`) : aucun consommateur hors de `brain/dossier/` avant
// les n° 3/6/7, et un registre exporté trop tôt se fait lire par des branches
// `if (predicat === …)` avant d'avoir son `Select`.
// MÊME RÈGLE pour l'itération 4 : `Delta` et `DeltaId` sortent (la n° 6 en aura
// besoin pour typer l'éditeur de récompenses), `validateDelta` et
// `collectDeltaRefs` restent — propriété tenue par un test-grep de
// `deltas.test.ts`. `DeltaBrut` disparaît, remplacé par `Delta`.
// ⚠ LE REGISTRE `DELTAS` LUI-MÊME SORT À L'ITÉRATION 3 DE LA N° 6, et le test-grep
// qui l'interdisait est réécrit en ALLOW-LIST NOMMÉE plutôt que supprimé (KR-215) :
// il exige désormais que tout porteur hors de `brain/dossier/` soit l'un des DEUX
// fichiers nommés — ce baril, et `dossier-registres/components/EditeurEffets.tsx`.
// Le consommateur est réel et unique : l'éditeur de récompenses d'une quête (puis,
// SANS FORK, celui des résolutions d'un événement) rend un `Select` dont les options
// sont les entrées du registre DANS SON ORDRE, avec leur `label` VERBATIM, et un
// `Select` de cible PAR ENTRÉE de `refKinds`. Re-lister les quatre libellés côté
// feature — ou en dériver une projection à la main — en ferait une seconde source
// qui divergerait en silence le jour où un cinquième effet est admis (KR-117) : ce
// contournement a été explicitement veto au raffinage. Toute AUTRE feature qui
// voudra consommer `DELTAS` devra ajouter sa ligne à l'allow-list, c'est-à-dire
// prendre la décision au lieu de la subir.
// MÊME RÈGLE pour l'itération 3 de la n° 4 : les DEUX constantes de l'échelle des
// caractéristiques sortent, et chacune a son consommateur réel et unique côté
// feature. `CARACTERISTIQUE_MIN` est le `min` des huit `Stepper` de la fiche — la
// borne basse écrite en dur à l'écran dériverait de celle qui décide réellement du
// refus à l'import (KR-165), et son plafond jumeau `CHARACTERISTIC_MAX` sort déjà
// plus haut. `STATS_INITIALES` est le bloc SEMÉ quand l'auteur règle les
// caractéristiques pour la première fois : reconstruit côté feature, il serait huit
// littéraux qui divergeraient du registre.
// ⚠ `STATS_INITIALES` est une valeur d'ÉCRITURE : `stats ?? STATS_INITIALES` sur un
// chemin de LECTURE est interdit — voir sa docstring. `VALEURS_DE_CARACTERISTIQUE`
// reste dedans, comme `CONFIANCES` : c'est une table de validation, aucun écran ne
// choisit une caractéristique dans une liste.
// MÊME RÈGLE pour l'itération 4 : `DUREE_MIN` sort parce qu'elle est le `min` du
// `Stepper` de durée d'une étape de plan. La borne basse écrite en dur à l'écran
// dériverait de celle qui décide réellement du refus à l'import (KR-165) — et il
// n'y a ici AUCUNE borne haute à mettre en face, ce qui rend la borne basse
// d'autant moins devinable côté feature. Sa jumelle de table, `CHAMPS_ENTIERS`,
// reste dedans, comme `VALEURS_DE_CARACTERISTIQUE` : c'est une table de
// validation, aucun écran ne l'interroge.
// MÊME RÈGLE pour l'itération 5 : `INTENSITE_MIN` et `INTENSITE_MAX` sortent parce
// qu'elles sont le `min` et le `max` du `Stepper` d'intensité d'une relation.
// Écrites en dur à l'écran, elles dériveraient des bornes qui décident réellement du
// refus à l'import (KR-165) — et le piège est ici plus vicieux qu'ailleurs :
// `CONFIANCE_MIN`/`CONFIANCE_MAX`, exportées juste au-dessus, portent AUJOURD'HUI les
// mêmes valeurs, et une feature qui les prendrait « puisque c'est pareil » lierait
// l'échelle d'un sentiment d'auteur à celle d'un état de session. Leur registre dérivé
// `INTENSITES` reste dedans, comme `CONFIANCES` : c'est une table de validation, aucun
// écran ne choisit une intensité dans une liste.
// MÊME RÈGLE pour l'itération 6 : `CONFIANCE_INITIALE_PORTE` sort parce qu'elle est la
// valeur SEMÉE quand l'auteur ouvre la porte de confiance d'un savoir — une graine
// reconstruite côté feature serait un nombre en dur au site de saisie (KR-165), et
// surtout la feature attraperait `CONFIANCE_MIN` « puisqu'elle est déjà exportée » :
// une porte à `-3` n'exige RIEN tout en éteignant l'avertissement
// `revelation-sans-porte`. Les deux bornes sortent avec elle parce qu'elles sont le
// `min` et le `max` du `Stepper` qui règle ensuite le seuil.
// MÊME RÈGLE pour l'itération 8, sur le registre NEUF `dossier/curseurs.ts` : tout ce
// qui a un consommateur d'écran sort, et rien d'autre. `CURSEURS` arme la grille des
// six `Stepper` (libellé + affinité entre parenthèses — six littéraux côté feature
// divergeraient du registre, KR-117) ; `CURSEUR_VALUES` en donne l'ORDRE, jamais
// `Object.keys` refait sur place ; `CURSEUR_MIN`/`CURSEUR_MAX` sont le `min` et le
// `max` de ces Stepper (KR-165, et le piège est ici que `CARACTERISTIQUE_MIN`,
// exportée juste au-dessus, vaut `1` quand un curseur descend à `0` — une feature qui
// la prendrait « puisqu'elle est déjà là » interdirait la valeur la plus basse de
// l'échelle) ; `PARLER_REPLIQUES` décide de la disparition du bouton d'ajout de
// réplique, et elle n'est lue nulle part ailleurs — c'est une borne d'INTERFACE, le
// validateur ne la connaît pas ; `CURSEURS_INITIAUX` est le bloc SEMÉ au geste « Régler
// le caractère… », reconstruit côté feature il serait six littéraux qui divergeraient
// du registre.
// ⚠ `CURSEURS_INITIAUX` est une valeur d'ÉCRITURE : `curseurs ?? CURSEURS_INITIAUX` sur
// un chemin de LECTURE est interdit — voir sa docstring, même doctrine que
// `STATS_INITIALES`. `VALEURS_DE_CURSEUR` reste dedans, comme
// `VALEURS_DE_CARACTERISTIQUE` : c'est une table de validation, aucun écran ne choisit
// une valeur de curseur dans une liste.
export {
	DOSSIER_SCHEMA,
	BUDGET_MOTS_CANON,
	BUDGET_MOTS_JALON,
	CONFIANCE_MIN,
	CONFIANCE_MAX,
	CONFIANCE_INITIALE_PORTE,
	CARACTERISTIQUE_MIN,
	STATS_INITIALES,
	DUREE_MIN,
	INTENSITE_MIN,
	INTENSITE_MAX,
} from './dossier/types'
export {
	CURSEURS,
	CURSEURS_INITIAUX,
	CURSEUR_MIN,
	CURSEUR_MAX,
	CURSEUR_VALUES,
	PARLER_REPLIQUES,
} from './dossier/curseurs'
// `AffiniteCurseur` sort AVEC `CurseurId` et non pour lui-même : il est un membre de
// la forme publique de `CurseurDescripteur`, et une feature qui doit l'annoter n'aurait
// aucun autre moyen de le NOMMER — même motif que `PorteeContreMesure` avec
// `ContreMesure`. `CurseurId` indexe le `Record` que l'écran écrit et relit.
export type { CurseurId, AffiniteCurseur, CurseurDescripteur } from './dossier/curseurs'
// `CAMPS` sort à l'itération 3 de la n° 3 : la carte d'objectif rend un `Select`
// FERMÉ sur ses trois valeurs, et re-lister les camps côté feature en ferait une
// seconde source que le validateur ne connaîtrait pas (KR-117). Les LIBELLÉS
// français, eux, restent côté feature — un seul consommateur réel, précédent
// `sections.ts` (le glyphe et la feature propriétaire n'ont jamais migré ici).
//
// AMENDEMENT du lot contrat de l'itération 1 de la n° 8 : la condition « un seul
// consommateur réel » est TOMBÉE pour QUATRE libellés de champ — `FONCTION`,
// `APPARENCE`, `DESCRIPTION JOUEUR` (`BlocIdentite.tsx`, `dossier-fiches`) et
// `TON` (`PanneauCanon.tsx`, `dossier-canon`). Le panneau Copilote les NOMME à
// l'écran sans être leur fiche d'origine : deux features les lisent, c'est KR-109
// à la lettre, donc ils vivent dans `brain/dossier/libelles.ts` et sortent ici.
// La règle ci-dessus vaut TOUJOURS pour les autres : les libellés de `CAMPS`, de
// `PORTEES`, de `CERTITUDES`, `SYNOPSIS MJ` et `ACCROCHE JOUEUR` restent côté
// feature, faute d'un second lecteur — une promotion spéculative est une dette.
// `CAMPS_PERSONNAGE` et `PORTEE_INITIALE` sortent à l'itération 1 de la n° 4 :
// le premier arme le `SegmentedControl` du camp d'une fiche (re-lister
// « protagoniste / antagoniste » côté feature en ferait une seconde source que le
// validateur ne connaîtrait pas, KR-117) ; la seconde est écrite dans le document
// à la création d'un personnage, et une feature qui prendrait `PORTEES[0]` à sa
// place lierait le plancher du schéma à un ordre d'affichage. Les LIBELLÉS
// français des deux registres restent côté feature — un seul consommateur réel,
// précédent `CAMPS` ci-dessus.
// `CERTITUDE_INITIALE` sort à l'itération 6 de la n° 4, exactement comme
// `PORTEE_INITIALE` : elle est écrite DANS LE DOCUMENT au geste qui crée un savoir, et
// une feature qui prendrait `CERTITUDES[0]` à sa place lierait le plancher du schéma à
// un ordre d'affichage. Ses LIBELLÉS français restent côté feature.
export { PORTEES, PORTEE_INITIALE, CERTITUDES, CERTITUDE_INITIALE, CAMPS, CAMPS_PERSONNAGE } from './dossier/types'
export type {
	Dossier,
	Canon,
	CanonMj,
	CanonPartage,
	Monde,
	Charpente,
	Depart,
	Entite,
	Portee,
	Certitude,
	Camp,
	CampPersonnage,
	PlanAction,
	// LES TROIS TYPES DE L'ITÉRATION 4. `But` et `ContreMesure` ont chacun un
	// consommateur réel côté feature — le bloc « Objectif & plan d'actions » écrit
	// l'un et l'autre par `DossierService.update()`, et les typer sur place
	// reconstruirait deux formes que le validateur ne connaîtrait pas.
	// `PorteeContreMesure` sort AVEC `ContreMesure` et non pour lui-même : il est un
	// membre de sa forme publique, et une feature qui doit l'annoter n'aurait aucun
	// autre moyen de le NOMMER. Le registre `PORTEES_CONTRE_MESURE` qui le porte,
	// lui, reste dedans — aucun écran n'offre ce choix dans cette itération (le champ
	// est `moteur` et n'est rendu nulle part), donc l'exporter serait une affordance
	// sans surface.
	But,
	ContreMesure,
	PorteeContreMesure,
	// LES DEUX TYPES DE L'ITÉRATION 5, pour la même raison que `But` et
	// `ContreMesure` : les blocs « Relations » et « Présence » écrivent l'un et
	// l'autre par `DossierService.update()`, et les typer sur place reconstruirait
	// deux formes que le validateur ne connaîtrait pas.
	Relation,
	Presence,
	// LE TYPE DE L'ITÉRATION 8, pour la même raison que `But`, `ContreMesure`,
	// `Relation` et `Presence` : le bloc « Caractère exploitable » écrit ce bloc par
	// `DossierService.update()`, et le typer sur place reconstruirait une forme que le
	// validateur ne connaîtrait pas. `CurseurId` et `AffiniteCurseur`, membres de sa
	// forme publique, sortent plus haut avec leur registre.
	Caractere,
	Revelation,
	Savoir,
	Personnage,
	Lieu,
	// LE TYPE DE L'ITÉRATION 1 DE LA N° 5, pour la même raison que `But`,
	// `ContreMesure`, `Relation`, `Presence` et `Caractere` : le panneau des objets
	// crée et écrit un objet par `DossierService.update()`, et le typer sur place
	// reconstruirait une forme que le validateur ne connaîtrait pas. Il sort AVEC
	// `Entite`, déjà exporté, dont il n'est qu'une extension d'une seule prose — la
	// feature a besoin des deux : `Entite` pour ce qu'elle LIT des registres voisins,
	// `Objet` pour ce qu'elle ÉCRIT dans le sien.
	Objet,
	// LE TYPE DE L'ITÉRATION 1 DE LA N° 6, même motif que `Objet` juste au-dessus : le
	// panneau des indices crée et écrit un indice par `DossierService.update()`.
	// `PorteeIndice` sort AVEC lui et non pour lui-même — il est un membre de sa forme
	// publique, et une feature qui doit l'annoter n'aurait aucun autre moyen de le
	// NOMMER (précédent exact `PorteeContreMesure` avec `ContreMesure`). Le registre
	// `PORTEES_INDICE` qui le porte, lui, reste dedans : `portee` n'est rendue par
	// AUCUN écran de cette itération, donc l'exporter serait une affordance sans
	// surface — même arbitrage que `PORTEES_CONTRE_MESURE`.
	Indice,
	PorteeIndice,
	Resolution,
	Evenement,
	// LES DEUX TYPES DE L'ITÉRATION 3 DE LA N° 6, même motif que `Objet` et `Indice` :
	// le panneau des quêtes crée et écrit une quête par `DossierService.update()`, et
	// la typer sur place reconstruirait une forme que le validateur ne connaîtrait
	// pas. `EtapeQuete` sort AVEC `Quete` et non pour lui-même — il est un membre de
	// sa forme publique, et la fiche qui écrit `etapes[]` n'aurait aucun autre moyen
	// de le NOMMER (précédent exact `PorteeContreMesure` avec `ContreMesure`).
	Quete,
	EtapeQuete,
	Climat,
	Conditions,
	Jalon,
	Fin,
	Objectif,
} from './dossier/types'
export type { ExprNode } from './dossier/expr'
export type { PredicatId } from './dossier/predicates'
export type { Delta, DeltaId } from './dossier/deltas'
export { DELTAS } from './dossier/deltas'
export { DOSSIER_ISSUE_LABELS, dossierIssueRemediation } from './dossier/issues'
export type { DossierIssue, DossierIssueCode, DossierIssueSeverity } from './dossier/issues'
// `localiserEntite` SORT à l'itération 2 de la n° 3 (`dossier-canon`), qui en est
// le premier consommateur hors de `brain/` : le `Select` du point de départ
// libelle chaque lieu, y compris le lieu SANS `nom` que porte tout dossier neuf,
// par le MÊME repli que le rapport d'anomalies. Réimplémenter « Lieu n°N (sans
// nom) » côté feature en ferait une seconde règle d'affichage, qui dériverait en
// silence de celle qui fait foi. Son corps ne change pas.
// `frapperIdentifiant` SORT à l'itération 3 de la n° 3, qui frappe l'identifiant
// d'un objectif créé à l'écran. Elle n'est pas restée privée à la feature parce
// que son second appelant réel est déjà nommé (la section Lieux, itération
// suivante) : même seuil que `localiserEntite` et `compterMots`. Une frappe
// réimplémentée côté feature retomberait sur `createId()`, dont le `_` est refusé
// par `FORME_IDENTIFIANT` — l'auteur ne l'apprendrait qu'à la relecture du dossier.
export {
	ESPACES_DE_NOMS,
	FORME_IDENTIFIANT,
	estIdentifiantBienForme,
	frapperIdentifiant,
	localiserEntite,
} from './dossier/identifiers'
export type { EspaceDeNoms, EspaceDeNomsDescripteur } from './dossier/identifiers'
// Le REGISTRE DES LIBELLÉS DE CHAMP — ré-exporté parce que DEUX features le
// lisent (KR-109) : la fiche d'origine qui rend le champ, et le panneau Copilote
// qui le NOMME sans être cette fiche. C'est la différence avec `amorce.ts`, que
// rien n'exporte parce qu'aucune feature ne le lit (KR-223).
export { LIBELLE_DES_CHAMPS } from './dossier/libelles'
export type { CheminLibelle, LibelleDeChamp } from './dossier/libelles'
// `compterMots` sort à la n° 3 (`dossier-canon`), qui en est le SECOND appelant
// réel : le compteur « n/BUDGET mots » rendu sous les champs de canon. Un compteur
// d'écran réimplémenté dériverait en silence de la borne qui décide réellement de
// l'avertissement `texte-trop-long`.
// `PREFIXE_BESTIAIRE` sort à l'itération 4 de la n° 6, et son consommateur est réel
// et unique : la fiche d'un événement, dont le `Select` MONSTRE est armé par
// `BESTIARY` (déjà exporté plus haut) et doit COMPOSER `monstre_ref`
// (`${PREFIXE_BESTIAIRE}${templateId}`) puis la DÉCOMPOSER pour retrouver l'entrée
// choisie. Réécrit côté feature, `'bestiaire.'` serait un littéral de seconde source
// face à celui qui décide réellement du refus à l'import (KR-165/117) — et il n'a
// AUCUN jumeau visible : les autres espaces de noms n'entrent jamais dans une
// concaténation d'écran, `frapperIdentifiant` les composant déjà pour eux.
export { validateDossier, compterMots, PREFIXE_BESTIAIRE, type DossierValidation } from './dossier/validate'
export { inspectDossierFile, type DossierInspection, type FileReadErrorCode } from './dossier/read'
// MÊME RÈGLE pour l'itération 3 de la n° 2 : `SECTIONS` sort — la nav de l'écran
// d'édition la rend et n'a PAS le droit de re-lister les dix sections chez elle —
// et avec elle ses deux types, qui ont chacun un consommateur réel : `SectionId`
// indexe les tables de la feature (glyphe, feature propriétaire de l'écran
// d'édition), `SectionDescripteur` type la ligne rendue.
export { SECTIONS, type SectionDescripteur, type SectionId } from './dossier/sections'
// MÊME RÈGLE pour l'itération 1 de la n° 7 : sort ce que le panneau Contrôles rend —
// le rapport, ses types, et la ligne QUOI FAIRE, que le consommateur obtient par une
// FONCTION pour n'avoir jamais à connaître ni le registre ni l'identifiant de la règle
// (précédent exact `dossierIssueRemediation`). Restent dedans, comme `PREDICATES` et
// `DELTAS` avant eux : le registre `CONTROLES`, son descripteur, `ConstatControle` et
// la table des proses — aucun consommateur hors de `brain/dossier/`, et un registre
// exporté trop tôt se fait lire par des branches `if (id === …)` avant d'avoir son
// écran. `NiveauControle` sort AVEC le rapport et non pour lui-même : c'est lui qui
// indexe le `Record` exhaustif des trois pastilles, descendu dans `dossier/pastilles.ts`
// à l'itération 2 (deux appelants, deux features — KR-109).
export { controlerDossier, controleRemediation } from './dossier/controles'
export type { NiveauControle, Controle, ControleId, RapportControles } from './dossier/controles'
// ITÉRATION 2 de la n° 7 : sortent les DEUX FONCTIONS de rendu d'un niveau — le mot
// seul pour le panneau, le badge fondu (compte + mot) pour la navigation. La table des
// trois mots et des trois tons, elle, reste PRIVÉE : deux surfaces partagent la
// décision, jamais la table — un consommateur qui la lirait en ferait un second site
// de décision, et c'est précisément la divergence que cette descente ferme.
export { pastilleNiveau, badgeSection } from './dossier/pastilles'
export type { DossierService, DossierResume, CorpsDossier, EcritureDossier } from './DossierService'
export type { SelectionService } from './SelectionService'
export { effectiveKind, endLabel } from './utils/nodeKind'
export { nodeTitle, textLines } from './utils/nodeView'
export { plural } from './utils/plural'
export {
	NODE_KINDS,
	EDGE_KINDS,
	isNodeKind,
	isEdgeKind,
	isStructural,
	canHaveOutgoing,
	canBeTarget,
	edgeNests,
} from './kinds'
export { getNode, getEdge } from './utils/book'
export { collectObjects, collectLineageObjects, findObject } from './utils/objects'
// `avecOrpheline` sort à l'itération 1 de la n° 6, qui en est le SECOND appelant réel
// (KR-110) : elle était privée à `dossier-fiches/components/BlocSavoirs.tsx`, et le
// registre des indices en a besoin le jour même pour ses `mene_a[]`. Recopiée côté
// feature, elle ferait diverger deux règles d'affichage de la même doctrine — une
// référence orpheline reste SÉLECTIONNÉE et VISIBLE, jamais réécrite en silence
// (KR-021). Même seuil que `localiserEntite`, `compterMots` et `frapperIdentifiant`.
export { avecOrpheline } from './utils/references'
export { deriveAutomaticEdges, deriveMonsterEdges } from './utils/automaticEdges'
export {
	exportBookForPlay,
	PLAY_EXPORT_FORMAT,
	PLAY_EXPORT_VERSION,
	type PlayExport,
	type PlayNode,
	type PlayWarning,
} from './utils/playExport'
export { downloadJson, downloadText, slugifyFilename } from './utils/download'
export { buildAdventureDocument } from './utils/buildAdventureDocument'
export type { NodeKindDescriptor, EdgeKindDescriptor, BadgeMark } from './kinds'
export { useOpenBook, useBooks, useBookHealth, useDossiers, useOpenDossier } from './hooks'
export { type StructuralWarning, type StructuralWarningCode } from './utils/bookHealth'
export { HIT_TARGET_MIN } from './ui'
export {
	createBrain,
	BrainProvider,
	useBrain,
	useRoute,
	useSelectedNode,
	useSyncStatus,
	useSyncPending,
	useBookPending,
	useSyncConflict,
	useUIPreferences,
	useBookNodePositions,
	useBookLayoutSpacing,
	useMonsterLibrary,
	type Brain,
	type CreateBrainOptions,
} from './BrainContext'
export * from './components'
