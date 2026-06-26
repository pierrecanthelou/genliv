/**
 * BESTIARY (§ 4) — the 23 canonical monsters, as MonsterConfig templates that
 * SEED the cross-book MonsterLibraryService. The action-monster editor already
 * lets an author « Choisir dans la librairie » (COPY-ON-USE, KR-101); this just
 * pre-populates that library so every author starts with the full bestiary.
 *
 * Pure data — no behaviour branch. Capacités are stored as CAPACITY IDs that
 * reference the MONSTER_CAPACITIES registry (KR-117/133); the editor resolves
 * them to labels and the future play runtime interprets them. `pv` is the base
 * value and `pvVariance` the ± span (resolved to a concrete PV on instantiation
 * in play mode). Reveal `outcomes` are intentionally blank — the author writes
 * the réussite/échec text per encounter when reusing the monster.
 *
 * `creatureType` drives play-mode AI flee behaviour and posture weights (KR-135).
 */
import type { MonsterConfig, CreatureType } from './types'
import type { MonsterCharacteristic } from './characteristics'
import type { MonsterCapacityId } from './monsterCapacities'

export type MonsterTier = 1 | 2 | 3 | 4

interface BestiaryRow {
	id: string
	name: string
	tier: MonsterTier
	/** Creature classification for play-mode AI (flee thresholds, posture weights, KR-135). */
	creatureType: CreatureType
	stats: Record<MonsterCharacteristic, number>
	mc: number
	pv: number
	pvVariance: number
	armour: number
	weaponMultiplier: number
	capacity: MonsterCapacityId
}

function toConfig(r: BestiaryRow): MonsterConfig {
	return {
		name: r.name,
		pv: r.pv,
		pvVariance: r.pvVariance,
		stats: r.stats,
		mc: r.mc,
		armour: r.armour,
		weaponMultiplier: r.weaponMultiplier,
		tier: r.tier,
		capacity: r.capacity,
		creatureType: r.creatureType,
		templateId: r.id,
		outcomes: { reussite: '', echec: '' },
	}
}

const ROWS: BestiaryRow[] = [
	// Tier 1
	{
		id: 'rat-geant',
		name: 'Rat géant',
		tier: 1,
		creatureType: 'animal-geant',
		stats: { FO: 1, AG: 4, DX: 2, EN: 2, IG: 1 },
		mc: 2,
		pv: 7,
		pvVariance: 1,
		armour: 0,
		weaponMultiplier: 0.3,
		capacity: 'maladie',
	},
	{
		id: 'gobelin',
		name: 'Gobelin',
		tier: 1,
		creatureType: 'humanoide',
		stats: { FO: 2, AG: 3, DX: 2, EN: 2, IG: 2 },
		mc: 2,
		pv: 7,
		pvVariance: 1,
		armour: 0,
		weaponMultiplier: 1,
		capacity: 'vol',
	},
	{
		id: 'squelette',
		name: 'Squelette',
		tier: 1,
		creatureType: 'mort-vivant',
		stats: { FO: 3, AG: 3, DX: 3, EN: 3, IG: 1 },
		mc: 2,
		pv: 9,
		pvVariance: 1,
		armour: 1,
		weaponMultiplier: 0.8,
		capacity: 'pas-endurance',
	},
	{
		id: 'zombie',
		name: 'Zombie',
		tier: 1,
		creatureType: 'mort-vivant',
		stats: { FO: 4, AG: 1, DX: 1, EN: 6, IG: 1 },
		mc: 1,
		pv: 11,
		pvVariance: 1,
		armour: 0,
		weaponMultiplier: 0.8,
		capacity: 'se-releve',
	},

	// Tier 2
	{
		id: 'harpie',
		name: 'Harpie',
		tier: 2,
		creatureType: 'creature-magique',
		stats: { FO: 2, AG: 6, DX: 4, EN: 3, IG: 2 },
		mc: 4,
		pv: 11,
		pvVariance: 2,
		armour: 0,
		weaponMultiplier: 0.5,
		capacity: 'chant-stressant',
	},
	{
		id: 'orque',
		name: 'Orque',
		tier: 2,
		creatureType: 'humanoide',
		stats: { FO: 5, AG: 3, DX: 4, EN: 5, IG: 2 },
		mc: 3,
		pv: 13,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1.2,
		capacity: 'fureur',
	},
	{
		id: 'hobgobelin',
		name: 'Hobgobelin',
		tier: 2,
		creatureType: 'humanoide',
		stats: { FO: 4, AG: 4, DX: 4, EN: 4, IG: 4 },
		mc: 4,
		pv: 12,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1,
		capacity: 'tacticien',
	},
	{
		id: 'araignee-geante',
		name: 'Araignée géante',
		tier: 2,
		creatureType: 'animal-geant',
		stats: { FO: 3, AG: 6, DX: 4, EN: 3, IG: 2 },
		mc: 4,
		pv: 12,
		pvVariance: 2,
		armour: 1,
		weaponMultiplier: 0.3,
		capacity: 'poison',
	},
	{
		id: 'loup-geant',
		name: 'Loup géant',
		tier: 2,
		creatureType: 'animal-geant',
		stats: { FO: 5, AG: 5, DX: 4, EN: 5, IG: 3 },
		mc: 4,
		pv: 15,
		pvVariance: 2,
		armour: 1,
		weaponMultiplier: 1.2,
		capacity: 'renversement',
	},
	{
		id: 'ours',
		name: 'Ours',
		tier: 2,
		creatureType: 'animal',
		stats: { FO: 7, AG: 3, DX: 3, EN: 6, IG: 3 },
		mc: 3,
		pv: 16,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1.5,
		capacity: 'etreinte',
	},

	// Tier 3
	{
		id: 'serpent-geant',
		name: 'Serpent géant',
		tier: 3,
		creatureType: 'animal-geant',
		stats: { FO: 5, AG: 7, DX: 5, EN: 5, IG: 3 },
		mc: 5,
		pv: 17,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1,
		capacity: 'venin',
	},
	{
		id: 'sorciere',
		name: 'Sorcière',
		tier: 3,
		creatureType: 'humanoide',
		stats: { FO: 2, AG: 4, DX: 6, EN: 4, IG: 8 },
		mc: 6,
		pv: 10,
		pvVariance: 2,
		armour: 1,
		weaponMultiplier: 0.5,
		capacity: 'malediction',
	},
	{
		id: 'spectre',
		name: 'Spectre',
		tier: 3,
		creatureType: 'mort-vivant',
		stats: { FO: 2, AG: 8, DX: 6, EN: 6, IG: 7 },
		mc: 7,
		pv: 16,
		pvVariance: 4,
		armour: 0,
		weaponMultiplier: 0.8,
		capacity: 'intangible',
	},
	{
		id: 'ogre',
		name: 'Ogre',
		tier: 3,
		creatureType: 'humanoide',
		stats: { FO: 9, AG: 3, DX: 4, EN: 8, IG: 2 },
		mc: 3,
		pv: 20,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1.8,
		capacity: 'force-ecrasante',
	},
	{
		id: 'momie',
		name: 'Momie',
		tier: 3,
		creatureType: 'mort-vivant',
		stats: { FO: 9, AG: 2, DX: 4, EN: 10, IG: 3 },
		mc: 3,
		pv: 21,
		pvVariance: 2,
		armour: 4,
		weaponMultiplier: 1.5,
		capacity: 'insensible',
	},
	{
		id: 'manticore',
		name: 'Manticore',
		tier: 3,
		creatureType: 'creature-magique',
		stats: { FO: 8, AG: 6, DX: 5, EN: 8, IG: 4 },
		mc: 5,
		pv: 22,
		pvVariance: 2,
		armour: 3,
		weaponMultiplier: 1.5,
		capacity: 'piques',
	},
	{
		id: 'troll',
		name: 'Troll',
		tier: 3,
		creatureType: 'creature-magique',
		stats: { FO: 10, AG: 4, DX: 4, EN: 10, IG: 2 },
		mc: 3,
		pv: 24,
		pvVariance: 4,
		armour: 2,
		weaponMultiplier: 1.5,
		capacity: 'regeneration',
	},
	{
		id: 'loup-garou',
		name: 'Loup-Garou',
		tier: 3,
		creatureType: 'creature-magique',
		stats: { FO: 7, AG: 8, DX: 7, EN: 8, IG: 6 },
		mc: 7,
		pv: 23,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 1.5,
		capacity: 'regeneration-argentee',
	},

	// Tier 4
	{
		id: 'geant',
		name: 'Géant',
		tier: 4,
		creatureType: 'humanoide',
		stats: { FO: 12, AG: 5, DX: 6, EN: 12, IG: 6 },
		mc: 6,
		pv: 29,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 2,
		capacity: 'seisme',
	},
	{
		id: 'liche',
		name: 'Liche',
		tier: 4,
		creatureType: 'mort-vivant',
		stats: { FO: 1, AG: 4, DX: 8, EN: 10, IG: 12 },
		mc: 8,
		pv: 15,
		pvVariance: 2,
		armour: 2,
		weaponMultiplier: 0.5,
		capacity: 'magie',
	},
	{
		id: 'tyrannoeil',
		name: 'Tyrannœil',
		tier: 4,
		creatureType: 'creature-magique',
		stats: { FO: 3, AG: 4, DX: 8, EN: 8, IG: 12 },
		mc: 8,
		pv: 15,
		pvVariance: 2,
		armour: 4,
		weaponMultiplier: 1.5,
		capacity: 'rayon',
	},
	{
		id: 'vampire',
		name: 'Vampire',
		tier: 4,
		creatureType: 'mort-vivant',
		stats: { FO: 10, AG: 10, DX: 10, EN: 12, IG: 10 },
		mc: 10,
		pv: 30,
		pvVariance: 4,
		armour: 3,
		weaponMultiplier: 1.2,
		capacity: 'vol-de-vie',
	},
]

/** The 23 bestiary monsters as MonsterConfig templates (COPY-ON-USE, KR-101). */
export const BESTIARY: MonsterConfig[] = ROWS.map(toConfig)

/** Lookup by templateId. */
export const BESTIARY_BY_TEMPLATE: Record<string, MonsterConfig> = Object.fromEntries(
	BESTIARY.map((m) => [m.templateId as string, m]),
)
