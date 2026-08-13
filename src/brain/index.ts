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
// besoin pour typer l'éditeur de récompenses), `DELTAS`, `validateDelta` et
// `collectDeltaRefs` restent — propriété tenue par un test-grep de
// `deltas.test.ts`, de sorte que le jour où la n° 11 voudra câbler le registre
// dans un schéma de sortie, elle devra SUPPRIMER un test, c'est-à-dire prendre la
// décision au lieu de la subir. `DeltaBrut` disparaît, remplacé par `Delta`.
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
export {
	DOSSIER_SCHEMA,
	BUDGET_MOTS_CANON,
	BUDGET_MOTS_JALON,
	CONFIANCE_MIN,
	CONFIANCE_MAX,
	CARACTERISTIQUE_MIN,
	STATS_INITIALES,
	DUREE_MIN,
} from './dossier/types'
// `CAMPS` sort à l'itération 3 de la n° 3 : la carte d'objectif rend un `Select`
// FERMÉ sur ses trois valeurs, et re-lister les camps côté feature en ferait une
// seconde source que le validateur ne connaîtrait pas (KR-117). Les LIBELLÉS
// français, eux, restent côté feature — un seul consommateur réel, précédent
// `sections.ts` (le glyphe et la feature propriétaire n'ont jamais migré ici).
// `CAMPS_PERSONNAGE` et `PORTEE_INITIALE` sortent à l'itération 1 de la n° 4 :
// le premier arme le `SegmentedControl` du camp d'une fiche (re-lister
// « protagoniste / antagoniste » côté feature en ferait une seconde source que le
// validateur ne connaîtrait pas, KR-117) ; la seconde est écrite dans le document
// à la création d'un personnage, et une feature qui prendrait `PORTEES[0]` à sa
// place lierait le plancher du schéma à un ordre d'affichage. Les LIBELLÉS
// français des deux registres restent côté feature — un seul consommateur réel,
// précédent `CAMPS` ci-dessus.
export { PORTEES, PORTEE_INITIALE, CERTITUDES, CAMPS, CAMPS_PERSONNAGE } from './dossier/types'
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
	Revelation,
	Savoir,
	Personnage,
	Lieu,
	Resolution,
	Evenement,
	Quete,
	Climat,
	Conditions,
	Jalon,
	Fin,
	Objectif,
} from './dossier/types'
export type { ExprNode } from './dossier/expr'
export type { PredicatId } from './dossier/predicates'
export type { Delta, DeltaId } from './dossier/deltas'
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
// `compterMots` sort à la n° 3 (`dossier-canon`), qui en est le SECOND appelant
// réel : le compteur « n/BUDGET mots » rendu sous les champs de canon. Un compteur
// d'écran réimplémenté dériverait en silence de la borne qui décide réellement de
// l'avertissement `texte-trop-long`.
export { validateDossier, compterMots, type DossierValidation } from './dossier/validate'
export { inspectDossierFile, type DossierInspection, type FileReadErrorCode } from './dossier/read'
// MÊME RÈGLE pour l'itération 3 de la n° 2 : `SECTIONS` sort — la nav de l'écran
// d'édition la rend et n'a PAS le droit de re-lister les dix sections chez elle —
// et avec elle ses deux types, qui ont chacun un consommateur réel : `SectionId`
// indexe les tables de la feature (glyphe, feature propriétaire de l'écran
// d'édition), `SectionDescripteur` type la ligne rendue.
export { SECTIONS, type SectionDescripteur, type SectionId } from './dossier/sections'
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
