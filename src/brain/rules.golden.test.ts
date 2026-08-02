/**
 * TABLE DORÉE des registres de règles (§ 1 à § 4).
 *
 * Ces registres sont des DONNÉES : le score de mutation n'y produit que des
 * mutants de littéraux, qui gonflent le dénominateur sans rien dire de la
 * qualité des tests. Ils sont donc neutralisés par mutateur
 * (`// Stryker disable StringLiteral,ObjectLiteral,ArrayDeclaration`) dans
 * `challenge.ts`, `characteristics.ts` et `combat.ts`, et `bestiary.ts` est
 * sorti du périmètre muté.
 *
 * Ce fichier est la contrepartie de cette neutralisation, et il tourne dans la
 * PORTE DE COMMIT (jest), pas seulement en fin d'itération : toute valeur de
 * registre modifiée par inadvertance fait rougir la porte. Neutralisation et
 * table dorée vont ensemble — l'une sans l'autre serait un relâchement.
 *
 * Règle : ces tables sont figées à la main. Une évolution volontaire du
 * bestiaire ou d'un registre se répercute ICI, puis dans `PROMPT_SCENE_IA.md`
 * et `public/PROMPT_SCENE_IA.md` (règle « triplet lié » de CLAUDE.md).
 */
import { BESTIARY } from './bestiary'
import { CHALLENGE_TIERS, DEFAULT_CHALLENGE_TIER, type ChallengeTier } from './challenge'
import {
	CHARACTERISTICS,
	CHARACTERISTIC_VALUES,
	CHARACTERISTIC_MAX,
	DEFAULT_CHARACTERISTIC,
	MONSTER_CHARACTERISTICS,
	type Characteristic,
	type MonsterCharacteristic,
} from './characteristics'
import { POSTURES, POSTURE_VALUES, type Posture } from './combat'
import type { CreatureType } from './types'

interface GoldenMonster {
	templateId: string
	name: string
	tier: 1 | 2 | 3 | 4
	creatureType: CreatureType
	stats: Record<MonsterCharacteristic, number>
	mc: number
	pv: number
	pvVariance: number
	armour: number
	weaponMultiplier: number
	capacity: string
}

const EXPECTED_BESTIARY: GoldenMonster[] = [
	// Tier 1
	{
		templateId: 'rat-geant',
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
		templateId: 'gobelin',
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
		templateId: 'squelette',
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
		templateId: 'zombie',
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
		templateId: 'harpie',
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
		templateId: 'orque',
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
		templateId: 'hobgobelin',
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
		templateId: 'araignee-geante',
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
		templateId: 'loup-geant',
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
		templateId: 'ours',
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
		templateId: 'serpent-geant',
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
		templateId: 'sorciere',
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
		templateId: 'spectre',
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
		templateId: 'ogre',
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
		templateId: 'momie',
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
		templateId: 'manticore',
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
		templateId: 'troll',
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
		templateId: 'loup-garou',
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
		templateId: 'geant',
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
		templateId: 'liche',
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
		templateId: 'tyrannoeil',
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
		templateId: 'vampire',
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

describe('table doree — bestiaire (§ 4)', () => {
	it('la table du bestiaire est figee (22 lignes, tous champs)', () => {
		expect(EXPECTED_BESTIARY).toHaveLength(22)
		expect(BESTIARY).toHaveLength(EXPECTED_BESTIARY.length)

		EXPECTED_BESTIARY.forEach((row, i) => {
			const m = BESTIARY[i]
			expect(m.templateId).toBe(row.templateId)
			expect(m.name).toBe(row.name)
			expect(m.tier).toBe(row.tier)
			expect(m.creatureType).toBe(row.creatureType)
			expect(m.stats).toEqual(row.stats)
			expect(m.mc).toBe(row.mc)
			expect(m.pv).toBe(row.pv)
			expect(m.pvVariance).toBe(row.pvVariance)
			expect(m.armour).toBe(row.armour)
			expect(m.weaponMultiplier).toBe(row.weaponMultiplier)
			expect(m.capacity).toBe(row.capacity)
		})
	})

	it('chaque monstre du bestiaire a un templateId unique', () => {
		const templateIds = BESTIARY.map((m) => m.templateId)
		expect(templateIds.every((id) => typeof id === 'string' && id.length > 0)).toBe(true)
		expect(new Set(templateIds).size).toBe(BESTIARY.length)
	})
})

const EXPECTED_TIERS: Record<
	ChallengeTier,
	{ label: string; difficulty: string; dice: { count: number; sides: number }; notation: string; baseXp: number }
> = {
	TC1: { label: 'Simple', difficulty: 'Simple', dice: { count: 1, sides: 6 }, notation: '1D6', baseXp: 1 },
	TC2: { label: 'Dur', difficulty: 'Dur', dice: { count: 2, sides: 5 }, notation: '2D5', baseXp: 2 },
	TC3: { label: 'Très dur', difficulty: 'Très dur', dice: { count: 3, sides: 4 }, notation: '3D4', baseXp: 3 },
	TC4: { label: 'Impossible', difficulty: 'Impossible', dice: { count: 4, sides: 4 }, notation: '4D4', baseXp: 4 },
}

describe('table doree — registres de regles (§ 1 a § 3)', () => {
	it('CHALLENGE_TIERS est fige pour les 4 tiers', () => {
		expect(Object.keys(CHALLENGE_TIERS)).toEqual(['TC1', 'TC2', 'TC3', 'TC4'])
		expect(DEFAULT_CHALLENGE_TIER).toBe('TC1')

		const tiers = Object.keys(EXPECTED_TIERS) as ChallengeTier[]
		tiers.forEach((t) => {
			const expected = EXPECTED_TIERS[t]
			const actual = CHALLENGE_TIERS[t]
			expect(actual.label).toBe(expected.label)
			expect(actual.difficulty).toBe(expected.difficulty)
			expect(actual.dice.count).toBe(expected.dice.count)
			expect(actual.dice.sides).toBe(expected.dice.sides)
			expect(actual.notation).toBe(expected.notation)
			expect(actual.baseXp).toBe(expected.baseXp)
		})
	})

	it('CHARACTERISTICS expose exactement les 8 caracteristiques', () => {
		const expected: Record<Characteristic, { label: string; abbr: string; describe: string }> = {
			FO: { label: 'Force', abbr: 'FO', describe: 'Puissance physique.' },
			AG: { label: 'Agilité', abbr: 'AG', describe: 'Souplesse et vitesse.' },
			DX: { label: 'Dextérité', abbr: 'DX', describe: 'Précision manuelle.' },
			EN: { label: 'Endurance', abbr: 'EN', describe: 'Résistance physique et souffle.' },
			IN: { label: 'Intelligence', abbr: 'IN', describe: 'Connaissances et mémoire.' },
			IG: { label: 'Ingéniosité', abbr: 'IG', describe: 'Débrouillardise et improvisation.' },
			SE: { label: 'Sens', abbr: 'SE', describe: 'Perception, vigilance et instinct ; jets de détection.' },
			CA: { label: 'Caractère', abbr: 'CA', describe: 'Volonté et résilience mentale.' },
		}

		expect(CHARACTERISTIC_VALUES).toEqual(['FO', 'AG', 'DX', 'EN', 'IN', 'IG', 'SE', 'CA'])
		expect(MONSTER_CHARACTERISTICS).toEqual(['FO', 'AG', 'DX', 'EN', 'IG'])
		expect(CHARACTERISTIC_MAX).toBe(12)
		expect(DEFAULT_CHARACTERISTIC).toBe('FO')

		CHARACTERISTIC_VALUES.forEach((c) => {
			expect(CHARACTERISTICS[c].label).toBe(expected[c].label)
			expect(CHARACTERISTICS[c].abbr).toBe(expected[c].abbr)
			expect(CHARACTERISTICS[c].describe).toBe(expected[c].describe)
		})
	})

	it('POSTURES expose 3 postures avec leurs facteurs de degats', () => {
		const expected: Record<Posture, { label: string; damageFactor: number }> = {
			normale: { label: 'Normale', damageFactor: 1 },
			precise: { label: 'Précise', damageFactor: 2 },
			defensive: { label: 'Défensive', damageFactor: 0 },
		}

		expect(POSTURE_VALUES).toEqual(['normale', 'precise', 'defensive'])
		POSTURE_VALUES.forEach((p) => {
			expect(POSTURES[p].label).toBe(expected[p].label)
			expect(POSTURES[p].damageFactor).toBe(expected[p].damageFactor)
		})
	})
})
