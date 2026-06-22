/**
 * BESTIARY (§ 4) — the 23 canonical monsters, as MonsterConfig templates that
 * SEED the cross-book MonsterLibraryService. The action-monster editor already
 * lets an author « Choisir dans la librairie » (COPY-ON-USE, KR-101); this just
 * pre-populates that library so every author starts with the full bestiary.
 *
 * Pure data — no behaviour branch. Capacités are carried as descriptive text
 * (`capacity`): the editor shows them, the future play runtime interprets them;
 * they are NOT modelled as if/switch (KR-117). `pv` is the base value and
 * `pvVariance` the ± span (resolved to a concrete PV on instantiation in play
 * mode). Reveal `outcomes` are intentionally blank — the author writes the
 * réussite/échec text per encounter when reusing the monster.
 */
import type { MonsterConfig } from './types'
import type { MonsterCharacteristic } from './characteristics'

export type MonsterTier = 1 | 2 | 3 | 4

interface BestiaryRow {
	id: string
	name: string
	tier: MonsterTier
	stats: Record<MonsterCharacteristic, number>
	mc: number
	pv: number
	pvVariance: number
	armour: number
	weaponMultiplier: number
	capacity: string
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
		templateId: r.id,
		outcomes: { reussite: '', echec: '' },
	}
}

const ROWS: BestiaryRow[] = [
	// 🟢 Tier 1
	{ id: 'rat-geant', name: 'Rat géant', tier: 1, stats: { FO: 1, AG: 4, DX: 2, EN: 2, IG: 1 }, mc: 2, pv: 7, pvVariance: 1, armour: 0, weaponMultiplier: 0.3, capacity: 'Maladie : -1 EN max si vaincu avec un Écart > 4.' },
	{ id: 'gobelin', name: 'Gobelin', tier: 1, stats: { FO: 2, AG: 3, DX: 2, EN: 2, IG: 2 }, mc: 2, pv: 7, pvVariance: 1, armour: 0, weaponMultiplier: 1, capacity: 'Vole un objet mineur s’il remporte le premier round.' },
	{ id: 'squelette', name: 'Squelette', tier: 1, stats: { FO: 3, AG: 3, DX: 3, EN: 3, IG: 1 }, mc: 2, pv: 9, pvVariance: 1, armour: 1, weaponMultiplier: 0.8, capacity: 'Pas de jauge d’Endurance (immunisé à l’épuisement).' },
	{ id: 'zombie', name: 'Zombie', tier: 1, stats: { FO: 4, AG: 1, DX: 1, EN: 6, IG: 1 }, mc: 1, pv: 11, pvVariance: 1, armour: 0, weaponMultiplier: 0.8, capacity: 'À 0 PV, se relève avec 1 PV sur un jet de 1D6 (5–6).' },

	// 🟡 Tier 2
	{ id: 'harpie', name: 'Harpie', tier: 2, stats: { FO: 2, AG: 6, DX: 4, EN: 3, IG: 2 }, mc: 4, pv: 11, pvVariance: 2, armour: 0, weaponMultiplier: 0.5, capacity: 'Chant stressant : -1 PE supplémentaire par round.' },
	{ id: 'orque', name: 'Orque', tier: 2, stats: { FO: 5, AG: 3, DX: 4, EN: 5, IG: 2 }, mc: 3, pv: 13, pvVariance: 2, armour: 2, weaponMultiplier: 1.2, capacity: 'Fureur : 1 attaque désespérée gratuite avant de mourir.' },
	{ id: 'hobgobelin', name: 'Hobgobelin', tier: 2, stats: { FO: 4, AG: 4, DX: 4, EN: 4, IG: 4 }, mc: 4, pv: 12, pvVariance: 2, armour: 2, weaponMultiplier: 1, capacity: 'Tacticien : MC = 5 si en groupe.' },
	{ id: 'araignee-geante', name: 'Araignée géante', tier: 2, stats: { FO: 3, AG: 6, DX: 4, EN: 3, IG: 2 }, mc: 4, pv: 12, pvVariance: 2, armour: 1, weaponMultiplier: 0.3, capacity: 'Poison : 1 dégât/round pendant 1D4 rounds sur Coup critique.' },
	{ id: 'loup-geant', name: 'Loup géant', tier: 2, stats: { FO: 5, AG: 5, DX: 4, EN: 5, IG: 3 }, mc: 4, pv: 15, pvVariance: 2, armour: 1, weaponMultiplier: 1.2, capacity: 'Renversement : -2 AT au prochain tour si Écart > 3.' },
	{ id: 'ours', name: 'Ours', tier: 2, stats: { FO: 7, AG: 3, DX: 3, EN: 6, IG: 3 }, mc: 3, pv: 16, pvVariance: 2, armour: 2, weaponMultiplier: 1.5, capacity: 'Étreinte : après 2 victoires consécutives, le 3e assaut fait ×2 garanti.' },

	// 🟠 Tier 3
	{ id: 'serpent-geant', name: 'Serpent géant', tier: 3, stats: { FO: 5, AG: 7, DX: 5, EN: 5, IG: 3 }, mc: 5, pv: 17, pvVariance: 2, armour: 2, weaponMultiplier: 1, capacity: 'Venin : 2 dégâts/round pendant 3 rounds sur Coup critique.' },
	{ id: 'sorciere', name: 'Sorcière', tier: 3, stats: { FO: 2, AG: 4, DX: 6, EN: 4, IG: 8 }, mc: 6, pv: 10, pvVariance: 2, armour: 1, weaponMultiplier: 0.5, capacity: 'Malédiction : round 1, le joueur lâche son arme sur 1D6 (1–3) et passe son tour.' },
	{ id: 'meduse', name: 'Méduse', tier: 3, stats: { FO: 3, AG: 6, DX: 8, EN: 5, IG: 7 }, mc: 7, pv: 14, pvVariance: 2, armour: 1, weaponMultiplier: 0.8, capacity: 'Combat à l’aveugle (-3 AT) OU pétrification (mort instantanée) sur Coup critique.' },
	{ id: 'spectre', name: 'Spectre', tier: 3, stats: { FO: 2, AG: 8, DX: 6, EN: 6, IG: 7 }, mc: 7, pv: 16, pvVariance: 4, armour: 0, weaponMultiplier: 0.8, capacity: 'Intangible : 1 dégât max par coup reçu d’une arme non-magique.' },
	{ id: 'ogre', name: 'Ogre', tier: 3, stats: { FO: 9, AG: 3, DX: 4, EN: 8, IG: 2 }, mc: 3, pv: 20, pvVariance: 2, armour: 2, weaponMultiplier: 1.8, capacity: 'Force écrasante : détruit 1 pt d’Armure/Bouclier même si le héros pare.' },
	{ id: 'momie', name: 'Momie', tier: 3, stats: { FO: 9, AG: 2, DX: 4, EN: 10, IG: 3 }, mc: 3, pv: 21, pvVariance: 2, armour: 4, weaponMultiplier: 1.5, capacity: 'Insensible aux attaques précises. Putréfaction (soins bloqués) sur Coup critique.' },
	{ id: 'manticore', name: 'Manticore', tier: 3, stats: { FO: 8, AG: 6, DX: 5, EN: 8, IG: 4 }, mc: 5, pv: 22, pvVariance: 2, armour: 3, weaponMultiplier: 1.5, capacity: 'Tire 1D3 piques (AT fixe 5, Dégâts 3) avant le corps-à-corps.' },
	{ id: 'troll', name: 'Troll', tier: 3, stats: { FO: 10, AG: 4, DX: 4, EN: 10, IG: 2 }, mc: 3, pv: 24, pvVariance: 4, armour: 2, weaponMultiplier: 1.5, capacity: 'Régénération : 3 PV/round, stoppée par feu/acide.' },
	{ id: 'loup-garou', name: 'Loup-Garou', tier: 3, stats: { FO: 7, AG: 8, DX: 7, EN: 8, IG: 6 }, mc: 7, pv: 23, pvVariance: 2, armour: 2, weaponMultiplier: 1.5, capacity: 'Régénération : 2 PV/round. Armure ignorée par l’argent.' },

	// 🔴 Tier 4
	{ id: 'geant', name: 'Géant', tier: 4, stats: { FO: 12, AG: 5, DX: 6, EN: 12, IG: 6 }, mc: 6, pv: 29, pvVariance: 2, armour: 2, weaponMultiplier: 2, capacity: 'Séisme : chaque coup encaissé force un jet d’AG « Très dur » pour ne pas tomber.' },
	{ id: 'liche', name: 'Liche', tier: 4, stats: { FO: 1, AG: 4, DX: 8, EN: 10, IG: 12 }, mc: 8, pv: 15, pvVariance: 2, armour: 2, weaponMultiplier: 0.5, capacity: 'Magie (ignore l’armure). Draine 1D4 PV max sur Coup critique.' },
	{ id: 'tyrannoeil', name: 'Tyrannœil', tier: 4, stats: { FO: 3, AG: 4, DX: 8, EN: 8, IG: 12 }, mc: 8, pv: 15, pvVariance: 2, armour: 4, weaponMultiplier: 1.5, capacity: 'Rayon aléatoire 1D4/round : 1=Feu (+2 dmg), 2=Lenteur (-2 AT), 3=Saignement (-2 EN), 4=Mort si Écart > 5.' },
	{ id: 'vampire', name: 'Vampire', tier: 4, stats: { FO: 10, AG: 10, DX: 10, EN: 12, IG: 10 }, mc: 10, pv: 30, pvVariance: 4, armour: 3, weaponMultiplier: 1.2, capacity: 'Vol de vie : se soigne de 50 % des dégâts infligés.' },
]

/** The 23 bestiary monsters as MonsterConfig templates (COPY-ON-USE, KR-101). */
export const BESTIARY: MonsterConfig[] = ROWS.map(toConfig)

/** Lookup by templateId. */
export const BESTIARY_BY_TEMPLATE: Record<string, MonsterConfig> = Object.fromEntries(
	BESTIARY.map((m) => [m.templateId as string, m]),
)
