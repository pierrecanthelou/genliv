/**
 * MONSTER CAPACITÉS (§ 4) — the closed set of named special abilities a monster
 * can carry. A KR-117 registry (one Record, never an if/switch) mapping each
 * capacity id to its editor label + play-mode description text. The editor stores
 * the id on MonsterConfig.capacity; the play runtime reads the descriptor to apply
 * the effect (KR-131/133). 'aucune' is the null sentinel (no special ability).
 */

export type MonsterCapacityId =
	| 'aucune'
	| 'maladie'
	| 'vol'
	| 'pas-endurance'
	| 'se-releve'
	| 'chant-stressant'
	| 'fureur'
	| 'tacticien'
	| 'poison'
	| 'renversement'
	| 'etreinte'
	| 'venin'
	| 'malediction'
	| 'regard-petrifiant'
	| 'intangible'
	| 'force-ecrasante'
	| 'insensible'
	| 'piques'
	| 'regeneration'
	| 'regeneration-argentee'
	| 'seisme'
	| 'magie'
	| 'rayon'
	| 'vol-de-vie'

export interface MonsterCapacityDescriptor {
	label: string
	/** Full play-mode description (rule text shown in editor + interpreted at runtime). */
	description: string
	/**
	 * KR-136: when true, a hero wielding a silver weapon bypasses this monster's armour
	 * (and/or armour-replacement effects like regeneration-argentee regen stop). Applied
	 * in combatEngine.ts via session.activeSilverWeapon.
	 */
	bypassedBySilver?: boolean
}

export const MONSTER_CAPACITIES: Record<MonsterCapacityId, MonsterCapacityDescriptor> = {
	aucune: { label: 'Aucune', description: '' },
	maladie: { label: 'Maladie', description: '−1 EN max si vaincu avec un Écart > 4.' },
	vol: { label: 'Vol', description: "Vole un objet mineur s'il remporte le premier round." },
	'pas-endurance': { label: "Pas d'endurance", description: "Immunisé à l'épuisement (pas de jauge d'Endurance)." },
	'se-releve': { label: 'Se relève', description: 'À 0 PV, se relève avec 1 PV sur un jet de 1D6 (5–6).' },
	'chant-stressant': {
		label: 'Chant stressant',
		description: '−1 PE supplémentaire par round.',
	},
	fureur: { label: 'Fureur', description: '1 attaque désespérée gratuite avant de mourir.' },
	tacticien: { label: 'Tacticien', description: 'MC = 5 si en groupe.' },
	poison: { label: 'Poison', description: '1 dégât/round pendant 1D4 rounds sur Coup critique.' },
	renversement: { label: 'Renversement', description: '−2 AT au prochain tour si Écart > 3.' },
	etreinte: { label: 'Étreinte', description: 'Après 2 victoires consécutives, le 3e assaut fait ×2 garanti.' },
	venin: { label: 'Venin', description: '2 dégâts/round pendant 3 rounds sur Coup critique.' },
	malediction: {
		label: 'Malédiction',
		description: "Round 1, le joueur lâche son arme sur 1D6 (1–3) et passe son tour.",
	},
	'regard-petrifiant': {
		label: 'Regard pétrifiant',
		description: "Combat à l'aveugle (−3 AT) OU pétrification (mort instantanée) sur Coup critique.",
	},
	intangible: {
		label: 'Intangible',
		description: "1 dégât max par coup reçu d'une arme non-magique.",
	},
	'force-ecrasante': {
		label: 'Force écrasante',
		description: "Détruit 1 pt d'Armure/Bouclier même si le héros pare.",
	},
	insensible: {
		label: 'Insensible',
		description: "Insensible aux attaques précises. Putréfaction (soins bloqués) sur Coup critique.",
	},
	piques: { label: 'Piques', description: 'Tire 1D3 piques (AT fixe 5, Dégâts 3) avant le corps-à-corps.' },
	regeneration: { label: 'Régénération', description: '3 PV/round, stoppée par feu/acide.' },
	'regeneration-argentee': {
		label: 'Régénération argentée',
		description: "2 PV/round. Armure ignorée par l'argent.",
		bypassedBySilver: true,
	},
	seisme: {
		label: 'Séisme',
		description: "Chaque coup encaissé force un jet d'AG « Très dur » pour ne pas tomber.",
	},
	magie: {
		label: 'Magie',
		description: 'Lance un sort 1D4/round. Niveaux 3–4 : draine −1D4 PV max.',
	},
	rayon: { label: 'Rayon', description: "Attaque à distance (portée 20 m) ignorant l'armure." },
	'vol-de-vie': {
		label: 'Vol de vie',
		description: "Récupère autant de PV qu'il inflige de dégâts.",
	},
}

export const MONSTER_CAPACITY_VALUES = Object.keys(MONSTER_CAPACITIES) as MonsterCapacityId[]
export const DEFAULT_CAPACITY: MonsterCapacityId = 'aucune'
