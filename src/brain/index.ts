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
export { DOSSIER_SCHEMA, BUDGET_MOTS_CANON, BUDGET_MOTS_JALON, CONFIANCE_MIN, CONFIANCE_MAX } from './dossier/types'
export { PORTEES, CERTITUDES } from './dossier/types'
export type {
	Dossier,
	Canon,
	CanonMj,
	CanonPartage,
	Monde,
	Charpente,
	Depart,
	Entite,
	DeltaBrut,
	Portee,
	Certitude,
	PlanAction,
	Revelation,
	Savoir,
	Personnage,
	Resolution,
	Evenement,
	Quete,
	Climat,
	Conditions,
	Jalon,
	Fin,
} from './dossier/types'
export { DOSSIER_ISSUE_LABELS, dossierIssueRemediation } from './dossier/issues'
export type { DossierIssue, DossierIssueCode, DossierIssueSeverity } from './dossier/issues'
export { ESPACES_DE_NOMS, FORME_IDENTIFIANT, estIdentifiantBienForme } from './dossier/identifiers'
export type { EspaceDeNoms, EspaceDeNomsDescripteur } from './dossier/identifiers'
export { validateDossier, type DossierValidation } from './dossier/validate'
export { inspectDossierFile, type DossierInspection, type FileReadErrorCode } from './dossier/read'
export type { DossierService } from './DossierService'
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
export { useOpenBook, useBooks, useBookHealth } from './hooks'
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
