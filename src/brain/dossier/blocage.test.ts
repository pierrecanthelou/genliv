import fs from 'node:fs'
import path from 'node:path'
import { etapeBloqueeAuPas } from './blocage'
import type { ExprNode } from './expr'
import type { EtatPnj } from './faits'
import { tickHorloge } from './horloge'
import { ouvrirSession, type EtatSession } from './session'
import type { Dossier, Personnage, PlanAction } from './types'

/**
 * `etapeBloqueeAuPas` — LE PRÉDICAT PUR DU BLOCAGE (n° 14 `moteur-horloge`, it3, lot `contrat`,
 * `docs/REGLES-PLAY.md` § J2). Ce fichier prouve la FORME du contrat : la formule d'échéance et son
 * front (`===`, jamais `>=`), les trois cas de l'origine du décompte, la totalité sur les états que
 * le produit n'écrit pas, et ce que le prédicat ne lit pas. Ce que le TICK en fait (la ligne de
 * journal) est dans `horloge.test.ts`.
 *
 * LES PERSONNAGES SONT CEUX DU DOSSIER DE RÉFÉRENCE, LU DU DISQUE (KR-156), dont seul le
 * `plan_actions[]` est remplacé : le prédicat ne lit que ça, et un littéral de `Personnage`
 * écrit à la main ferait dériver ce fichier de la forme réelle.
 *
 * ⚠ CE FICHIER EST HORS DU SCORE DE MUTATION (KR-243) : `blocage.ts` n'est pas l'un des quatre
 * fichiers d'arithmétique de règles. `jest` est son UNIQUE instrument, et les mutants nommés
 * ci-dessous sont à écrire, voir rouges, puis révoquer — à la main.
 */

const MODULE_DOSSIER = __dirname
const RACINE_SRC = path.join(MODULE_DOSSIER, '..', '..')
const CHEMIN_REFERENCE = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-reference.json')

const SELENE = 'pnj.selene-la-vigie'
const HAREK = 'pnj.harek-le-forgeron'
const FOYER_VISITE: ExprNode = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.foyer-du-guet'] }
const JAMAIS: ExprNode = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.crypte-scellee'] }
/** Un nœud que l'évaluateur ne reconnaît pas : le LIRE, c'est LEVER. Un prédicat de blocage ne le lit pas. */
const POISON = { op: 'xor' } as unknown as ExprNode

function lire(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

/**
 * UNE ÉTAPE FABRIQUÉE. Son champ `etape` vaut `100 − index` : DÉLIBÉRÉMENT hors de l'ordre du
 * tableau, pour qu'une lecture du champ au lieu de l'INDEX (KR-198) ne passe jamais par coïncidence.
 */
function etape(index: number, duree?: number, reste: Partial<PlanAction> = {}): PlanAction {
	return {
		etape: 100 - index,
		action: `Intention de l'étape d'index ${index}.`,
		...(duree === undefined ? {} : { duree }),
		...reste,
	}
}

/** Sélène, du dossier de référence, le plan remplacé — rien d'autre ne bouge. */
function personnageAvec(plan: PlanAction[]): Personnage {
	const base = lire().monde.personnages.find((personnage) => personnage.id === SELENE)
	if (base === undefined) throw new Error('fixture : Sélène a disparu du dossier de référence')
	return { ...base, plan_actions: plan }
}

/** L'entrée `etape_plan` d'un personnage — `depuis` ABSENT quand non fourni, jamais `undefined` posé. */
function entree(rang: number, depuis?: number): EtatPnj {
	return { a_dit: [], etape_plan: depuis === undefined ? { rang } : { rang, depuis } }
}

/** Les pas, de `de` à `a` inclus, où le prédicat rend un constat. */
function toursEnConstat(personnage: Personnage, etat: EtatPnj | undefined, de: number, a: number): number[] {
	const tours: number[] = []
	for (let tour = de; tour <= a; tour += 1) {
		if (etapeBloqueeAuPas(personnage, etat, tour) !== undefined) tours.push(tour)
	}
	return tours
}

describe('etapeBloqueeAuPas, la formule : tour − origine === duree, UN pas et un seul', () => {
	it('duree−1 pas de constat : un pas avant l echeance, rien — a l origine 0 comme a une origine ecrite', () => {
		const plan = personnageAvec([etape(0, 3), etape(1, 3)])

		expect(etapeBloqueeAuPas(plan, undefined, 2)).toBeUndefined()
		// Une origine ÉCRITE (`depuis: 5`) : l'échéance est 5 + 3 = 8, donc 7 est un pas trop tôt.
		expect(etapeBloqueeAuPas(plan, entree(1, 5), 7)).toBeUndefined()
		// Discriminant, DANS LE MÊME TEST : un pas plus tard, le constat tombe — sans lui, les deux
		// silences ci-dessus seraient ceux d'un prédicat qui ne rendrait jamais rien.
		expect(etapeBloqueeAuPas(plan, undefined, 3)).toBeDefined()
		expect(etapeBloqueeAuPas(plan, entree(1, 5), 8)).toBeDefined()
	})

	it('duree produit constat : le rang et l etape COURANTE, la meme reference que dans le plan', () => {
		const plan = personnageAvec([etape(0, 4), etape(1, 2)])

		const constat = etapeBloqueeAuPas(plan, entree(1, 6), 8)

		// MUTANTS NOMMÉS, À ÉCRIRE PUIS RÉVOQUER : `rang` en base 1 ; `courante` = l'étape VISÉE
		// (`plan_actions[rang + 1]`) ; `courante` copiée. Les deux durées (4 et 2) sont distinctes :
		// une lecture de la mauvaise étape ne passe pas par coïncidence.
		expect(constat).toBeDefined()
		expect(constat?.rang).toBe(1)
		expect(constat?.courante).toBe(plan.plan_actions[1])
		expect(Object.keys(constat ?? {}).sort()).toEqual(['courante', 'rang'])
		// L'étape d'index 0 porte `duree: 4` : à 6 + 4 = 10 elle serait en échéance SI le rang
		// était lu à l'envers. Il ne l'est pas.
		expect(etapeBloqueeAuPas(plan, entree(1, 6), 10)).toBeUndefined()
	})

	it('duree+1 pas de second constat : le front est === et jamais >= — a +1 comme tres loin apres', () => {
		const plan = personnageAvec([etape(0, 3)])

		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : `tour - origine >= duree`. Il rendrait un constat à
		// CHAQUE pas suivant — une ligne de journal identique par commande (§ J2, tranché it3).
		expect(toursEnConstat(plan, undefined, 0, 30)).toEqual([3])
		expect(etapeBloqueeAuPas(plan, undefined, 4)).toBeUndefined()
		expect(etapeBloqueeAuPas(plan, undefined, 30)).toBeUndefined()
		// Avec une origine écrite, même front.
		expect(toursEnConstat(personnageAvec([etape(0), etape(1, 3)]), entree(1, 5), 0, 30)).toEqual([8])
	})

	it('un seul pas par entree, pour chacune des durees 1, 2 et 5', () => {
		for (const duree of [1, 2, 5]) {
			const plan = personnageAvec([etape(0, duree)])
			expect(`duree ${duree} → ${toursEnConstat(plan, undefined, 0, 20).join(',')}`).toBe(`duree ${duree} → ${duree}`)
		}
	})

	it('un tour negatif ou non fini ne produit jamais de constat, sans lever', () => {
		const plan = personnageAvec([etape(0, 3)])

		for (const tour of [-3, Number.NaN, Number.POSITIVE_INFINITY, Number.NEGATIVE_INFINITY]) {
			expect(`tour ${tour} → ${etapeBloqueeAuPas(plan, undefined, tour) === undefined}`).toBe(`tour ${tour} → true`)
		}
	})
})

describe('etapeBloqueeAuPas, le dernier rang et le rang courant', () => {
	it('dernier-rang-bloque : le dernier rang d un plan, avec une duree, est bloque comme une etape quelconque', () => {
		// Deux étapes, le personnage à la DERNIÈRE (rang 1) : le tick n'avance plus au-delà, mais la
		// durée de cette étape-là tombe à 3 + 2.
		const plan = personnageAvec([etape(0), etape(1, 2)])

		expect(toursEnConstat(plan, entree(1, 3), 0, 20)).toEqual([5])
		const constat = etapeBloqueeAuPas(plan, entree(1, 3), 5)
		expect(constat?.rang).toBe(1)
		expect(constat?.courante).toBe(plan.plan_actions[1])
		// Et un plan d'UNE seule étape : l'étape de départ est à la fois la première et la dernière.
		expect(toursEnConstat(personnageAvec([etape(0, 4)]), undefined, 0, 20)).toEqual([4])
	})

	it('la duree se lit sur l etape COURANTE, jamais sur la visee ni sur une autre', () => {
		// L'étape de départ n'a PAS de durée, la suivante en a une : au rang 0, personne n'est bloqué.
		const plan = personnageAvec([etape(0), etape(1, 2), etape(2, 2)])

		expect(toursEnConstat(plan, undefined, 0, 20)).toEqual([])
		expect(toursEnConstat(plan, entree(0), 0, 20)).toEqual([])
		// Au rang 2, la durée de l'étape 1 (déjà quittée) n'est pas lue : seule celle de l'étape 2.
		expect(toursEnConstat(plan, entree(2, 6), 0, 20)).toEqual([8])
	})
})

describe('etapeBloqueeAuPas, l origine du decompte (trois cas exclusifs, REGLES-PLAY J2)', () => {
	it('absent-ou-rang0-sans-depuis-origine-0 : etape_plan absent et { rang: 0 } sans depuis valent TOUS DEUX l origine 0', () => {
		const plan = personnageAvec([etape(0, 4), etape(1)])
		const sansEntree = undefined
		const sansEtapePlan: EtatPnj = { a_dit: ['indice.pas-dans-la-cendre'], confiance: 2 }
		const rangZero = entree(0)

		// L'étape de départ de Sélène (`duree: 4`) tombe au PAS 4 : c'est le scénario du dossier de
		// référence, et le critère 4 du plan.
		for (const etat of [sansEntree, sansEtapePlan, rangZero]) {
			expect(`${JSON.stringify(etat)} → ${toursEnConstat(plan, etat, 0, 20).join(',')}`).toBe(
				`${JSON.stringify(etat)} → 4`,
			)
		}
		// Le reste de l'entrée n'est pas lu : `a_dit` et `confiance` ne changent rien.
		expect(etapeBloqueeAuPas(plan, sansEtapePlan, 4)?.rang).toBe(0)
	})

	it('depuis ecrit prime sur l origine 0, y compris au rang 0 : l origine est le pas ecrit', () => {
		// Une entrée `{ rang: 0, depuis: 3 }` n'est jamais écrite par le tick (il écrit `rang ≥ 1`) : elle
		// ne peut venir que d'une session forgée, mais le cas (a) dit « `depuis` écrit → `depuis` ».
		const plan = personnageAvec([etape(0, 4)])

		expect(toursEnConstat(plan, entree(0, 3), 0, 20)).toEqual([7])
	})

	it('rang-ge1-sans-depuis-jamais : { rang: 1 } sans depuis n a AUCUNE origine — jamais en echeance, a aucun pas', () => {
		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : `origine = depuis ?? 0` sans la condition sur le
		// rang. Une session de 0.7.21 (`{ rang }` sans `depuis`) serait alors comptée depuis l'ouverture
		// de la partie : le moteur inventerait le pas d'une entrée qu'il n'a pas datée (KR-251).
		const plan = personnageAvec([etape(0, 2), etape(1, 2), etape(2, 2)])

		for (const rang of [1, 2]) {
			expect(`rang ${rang} → ${toursEnConstat(plan, entree(rang), 0, 60).join(',')}`).toBe(`rang ${rang} → `)
		}
		// DISCRIMINANT, DANS LE MÊME TEST : les mêmes rangs, `depuis` écrit, sont bien en échéance.
		expect(toursEnConstat(plan, entree(1, 4), 0, 60)).toEqual([6])
		expect(toursEnConstat(plan, entree(2, 9), 0, 60)).toEqual([11])
		// Et AUCUN pas particulier ne fait exception : ni 0, ni la durée, ni un pas négatif.
		expect(etapeBloqueeAuPas(plan, entree(1), 0)).toBeUndefined()
		expect(etapeBloqueeAuPas(plan, entree(1), 2)).toBeUndefined()
	})
})

describe('etapeBloqueeAuPas, les etats que le produit n ecrit pas : TOTAL, sans lever', () => {
	it('rang-hors-bornes-no-op : negatif, non entier, non fini, hors plan, ou d un autre type — undefined', () => {
		// `depuis: 0` partout : sans la garde de rang, un rang « vers l'étape 0 » (`-0.5` arrondi, `'0'`
		// indexant `plan_actions['0']`) serait en échéance à `duree`.
		const plan = personnageAvec([etape(0, 1), etape(1, 1)])
		const RANGS: ReadonlyArray<readonly [string, number]> = [
			['-1', -1],
			['-0.5', -0.5],
			['1.5', 1.5],
			['NaN', Number.NaN],
			['Infinity', Number.POSITIVE_INFINITY],
			['2 (hors plan)', 2],
			['7 (hors plan)', 7],
			// FORGÉS : une chaîne indexe `plan_actions['0']`, qui existe.
			['la chaine "0"', '0' as unknown as number],
			['la chaine "1"', '1' as unknown as number],
		]

		for (const [nom, rang] of RANGS) {
			const etat: EtatPnj = { a_dit: [], etape_plan: { rang, depuis: 0 } }
			expect(`${nom} → ${toursEnConstat(plan, etat, 0, 12).join(',')}`).toBe(`${nom} → `)
		}
		// DISCRIMINANT : les rangs VALIDES, eux, constatent au pas 1 (0 + 1) — sans cela, la boucle
		// ci-dessus serait verte sur un prédicat qui ne rendrait jamais rien.
		expect(etapeBloqueeAuPas(plan, { a_dit: [], etape_plan: { rang: 0, depuis: 0 } }, 1)?.rang).toBe(0)
		expect(etapeBloqueeAuPas(plan, { a_dit: [], etape_plan: { rang: 1, depuis: 0 } }, 1)?.rang).toBe(1)
	})

	it('un plan vide, ou un personnage sans plan_actions : pas de constat, sans lever', () => {
		expect(toursEnConstat(personnageAvec([]), undefined, 0, 10)).toEqual([])
		expect(toursEnConstat(personnageAvec([]), entree(3, 2), 0, 10)).toEqual([])
		// FORGÉ : `plan_actions` absent d'un personnage (le type le requiert, un fichier ne l'a pas lu).
		const sansPlan = { ...personnageAvec([]), plan_actions: undefined } as unknown as Personnage
		expect(toursEnConstat(sansPlan, undefined, 0, 10)).toEqual([])
	})

	it('sans-duree-pas-de-constat : une etape sans duree ne bloque jamais, a aucun pas', () => {
		expect(toursEnConstat(personnageAvec([etape(0)]), undefined, 0, 30)).toEqual([])
		expect(toursEnConstat(personnageAvec([etape(0), etape(1)]), entree(1, 2), 0, 30)).toEqual([])
		// `duree: undefined` posé EXPLICITEMENT : même chose que l'absence de la clé.
		expect(toursEnConstat(personnageAvec([etape(0, undefined, { duree: undefined })]), undefined, 0, 30)).toEqual([])
		// FORGÉS : un `null` (JSON) et une chaîne ne sont pas une durée — `tour − origine` ne les égale jamais.
		for (const duree of [null, '2', Number.NaN]) {
			const forgee = personnageAvec([etape(0, undefined, { duree: duree as unknown as number })])
			expect(`duree ${String(duree)} → ${toursEnConstat(forgee, undefined, 0, 30).join(',')}`).toBe(
				`duree ${String(duree)} → `,
			)
		}
		// DISCRIMINANT : la même étape, une durée posée, constate.
		expect(toursEnConstat(personnageAvec([etape(0, 2)]), undefined, 0, 30)).toEqual([2])
	})
})

describe('etapeBloqueeAuPas, ce qu il ne lit pas — et ce qu il ne touche pas', () => {
	it('ni declencheur_*, ni si_bloque, ni action : la meme reponse que l etape soit nue ou chargee, et aucune condition evaluee', () => {
		const nue = personnageAvec([etape(0, 3), etape(1)])
		const chargee = personnageAvec([
			etape(0, 3, {
				action: 'Une autre intention, qui ne change rien.',
				si_bloque: 'Il change de plan.',
				declencheur_texte: 'Une prose d auteur.',
				declencheur_expr: POISON,
			}),
			// L'étape VISÉE porte un nœud inconnu : l'ÉVALUER lèverait. Le prédicat ne l'évalue pas.
			etape(1, undefined, { declencheur_expr: POISON }),
		])

		for (const tour of [0, 2, 3, 4]) {
			const a = etapeBloqueeAuPas(nue, undefined, tour)
			const b = etapeBloqueeAuPas(chargee, undefined, tour)
			expect(`tour ${tour} → ${a === undefined}`).toBe(`tour ${tour} → ${b === undefined}`)
			expect(b?.rang).toBe(a?.rang)
		}
		expect(etapeBloqueeAuPas(chargee, undefined, 3)).toBeDefined()
	})

	it('pur : les arguments ne sont pas touches, et deux appels rendent le meme constat', () => {
		const personnage = personnageAvec([etape(0, 2), etape(1, 2)])
		const etat = entree(1, 4)
		const avant = JSON.stringify([personnage, etat])

		const premier = etapeBloqueeAuPas(personnage, etat, 6)
		const second = etapeBloqueeAuPas(personnage, etat, 6)

		expect(JSON.stringify([personnage, etat])).toBe(avant)
		expect(premier).toBeDefined()
		expect(second).toStrictEqual(premier)
		expect(second?.courante).toBe(premier?.courante)
	})
})

describe('etapeBloqueeAuPas et tickHorloge, l avancement emporte le blocage (KR-246)', () => {
	function ouverture(dossier: Dossier): EtatSession {
		const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
		return resultat.session
	}

	/** Le dossier de référence, le plan de Harek remplacé ET ceux de Sélène et de Corvin vidés de durée. */
	function avecPlanDeHarek(plan: PlanAction[]): Dossier {
		const dossier = lire()
		for (const personnage of dossier.monde.personnages) {
			if (personnage.id === HAREK) personnage.plan_actions = plan
			else for (const etapeDuPlan of personnage.plan_actions) delete etapeDuPlan.duree
		}
		return dossier
	}

	it('avancement-emporte-blocage : quand le declencheur est vrai ET l echeance tombe, le tick n ecrit que l avancement', () => {
		// Harek, rang 0 : `duree: 1`, origine 0 → l'échéance tombe au pas 1. L'étape visée est VRAIE.
		const dossier = avecPlanDeHarek([etape(0, 1), etape(1, undefined, { declencheur_expr: FOYER_VISITE })])
		const harek = dossier.monde.personnages.find((personnage) => personnage.id === HAREK)
		if (harek === undefined) throw new Error('fixture : Harek a disparu')
		const pas1: EtatSession = { ...ouverture(dossier), horloge: { tour: 1 } }

		// LE PRÉDICAT, SEUL, CONSTATE : il ne lit aucune condition, et l'exclusion n'est pas de lui.
		expect(etapeBloqueeAuPas(harek, undefined, pas1.horloge.tour)).toBeDefined()

		// LE TICK, LUI, AVANCE ET NE CONSTATE PAS : une seule ligne, `etape_plan`.
		const apres = tickHorloge(dossier, pas1)
		expect(apres.journal.map((ligne) => ligne.texte)).toEqual([`etape_plan : ${HAREK} 2`])
		expect(apres.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })

		// DISCRIMINANT, DANS LE MÊME TEST : même plan, étape visée FAUSSE — le constat tombe, et seul lui.
		const sansSuite = avecPlanDeHarek([etape(0, 1), etape(1, undefined, { declencheur_expr: JAMAIS })])
		const bloque = tickHorloge(sansSuite, { ...ouverture(sansSuite), horloge: { tour: 1 } })
		expect(bloque.journal.map((ligne) => ligne.texte)).toEqual([`etape_bloquee : ${HAREK} 1`])
		expect(bloque.monde.pnj).toEqual({})
	})
})

describe('blocage.ts, les proprietes qui se lisent dans la SOURCE', () => {
	const sansCommentaires = (texte: string): string => texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
	const enPositionDeCode = (texte: string): string =>
		sansCommentaires(texte)
			.replace(/'[^'\n]*'/g, "''")
			.replace(/"[^"\n]*"/g, '""')
			.replace(/`[^`]*`/gs, '``')
	const lireSource = (chemin: string): string => fs.readFileSync(chemin, 'utf8').replace(/\r\n/g, '\n')
	const source = (nom: string): string => lireSource(path.join(MODULE_DOSSIER, nom))

	/** Les fichiers de PRODUCTION d'un sous-arbre de `src/` : ni tests, ni fixtures. */
	function fichiersDeProduction(racine: string): string[] {
		return fs
			.readdirSync(racine, { withFileTypes: true })
			.flatMap((entreeDuDisque) => {
				const chemin = path.join(racine, entreeDuDisque.name)
				if (entreeDuDisque.isDirectory())
					return entreeDuDisque.name === '__fixtures__' ? [] : fichiersDeProduction(chemin)
				return /\.tsx?$/.test(entreeDuDisque.name) && !/\.test\.tsx?$/.test(entreeDuDisque.name) ? [chemin] : []
			})
			.sort()
	}

	const relatif = (chemin: string): string => path.relative(RACINE_SRC, chemin).split(path.sep).join('/')

	const code = enPositionDeCode(source('blocage.ts'))

	it('il ne lit ni condition, ni prose, ni action, ni le champ etape : seulement duree, depuis et rang', () => {
		const lectures: ReadonlyArray<readonly [string, RegExp]> = [
			['.declencheur_expr', /\.declencheur_expr\b/],
			['.declencheur_texte', /\.declencheur_texte\b/],
			['.si_bloque', /\.si_bloque\b/],
			['.action', /\.action\b/],
			['.etape (KR-198)', /\.etape\b/],
			['.op', /\.op\b/],
		]
		for (const [nom, motif] of lectures) {
			expect(`${nom} → ${motif.test(code)}`).toBe(`${nom} → false`)
		}
		// Discriminant : le balayage lit du CODE — les trois champs qu'il lit y sont bien.
		expect(code).toMatch(/\.duree\b/)
		expect(code).toMatch(/\.depuis\b/)
		expect(code).toMatch(/\.rang\b/)
		expect(code).toMatch(/\.plan_actions\?\.\[/)
	})

	it('ses imports : import type SEULEMENT, vers ./faits et ./types — une feuille, aucune arete de valeur', () => {
		const imports = [...source('blocage.ts').matchAll(/^import\s+(type\s+)?[^;\n]*?from\s+'([^']+)'/gm)].map((m) => ({
			type: m[1] !== undefined,
			de: m[2],
		}))

		expect(imports.map((i) => i.de).sort()).toEqual(['./faits', './types'])
		expect(imports.every((i) => i.type)).toBe(true)
		// Pur : ni aléa, ni horodatage, ni cache, ni modèle.
		for (const interdit of ['Math.random', 'Date', 'new Map', 'new WeakMap', 'catch', 'try {']) {
			expect(`${interdit} → ${code.includes(interdit)}`).toBe(`${interdit} → false`)
		}
	})

	it('la duree n a que deux lecteurs de decision, mesures : blocage.ts (plan_actions[].duree) et climat.ts (Climat.duree) — validate.ts la lit pour un avertissement, aucun autre module du moteur', () => {
		// KR-246, ET KR-258 : la phrase « seul blocage.ts lit `.duree` » est une affirmation SUR LA
		// COULEUR D'UN GREP, donc mesurée AVANT d'être écrite — et elle n'est pas vraie « du dépôt » :
		// `validate.ts` la lit (avertissement sur un `si_bloque` orphelin), et les panneaux d'édition de
		// `src/features/` la lisent pour la saisir. La portée TENUE est celle-ci, par sous-arbre.
		//
		// ⚠ ELLE A CHANGÉ À LA N° 14 IT4 : `climat.ts` lit `Climat.duree` pour l'extinction d'un climat
		// (`docs/REGLES-PLAY.md` § J3). Ce sont DEUX CHAMPS de même nom — `plan_actions[].duree`, lu par
		// `blocage.ts` seul, et `Climat.duree`, lu par `climat.ts` seul —, deux décisions, deux sites : le
		// balayage par MOT ne les distingue pas, et la liste ci-dessous est donc passée de deux à trois
		// fichiers. Le suivant qui lirait l'un des deux dans un troisième module rougit ici.
		const lecteurs = (racine: string): string[] =>
			fichiersDeProduction(racine)
				.filter((fichier) => /\.duree\b/.test(enPositionDeCode(lireSource(fichier))))
				.map(relatif)

		expect(lecteurs(path.join(RACINE_SRC, 'brain'))).toEqual([
			'brain/dossier/blocage.ts',
			'brain/dossier/climat.ts',
			'brain/dossier/validate.ts',
		])
		// Le moteur de session, l'assembleur du narrateur et l'écran de partie : aucun.
		expect(lecteurs(path.join(RACINE_SRC, 'player'))).toEqual([])
		expect(lecteurs(path.join(RACINE_SRC, 'features', 'play-mode'))).toEqual([])
		// `horloge.ts` et l'assembleur de R3 le lisent encore moins : ils passent par le prédicat.
		expect(lecteurs(path.join(RACINE_SRC, 'brain', 'copilote'))).toEqual([])

		// Discriminance du motif (KR-199) : il attrape une LECTURE, pas un chemin déclaré en chaîne.
		expect(/\.duree\b/.test(enPositionDeCode('const a = etape?.duree'))).toBe(true)
		expect(/\.duree\b/.test(enPositionDeCode("const a = { chemin: 'monde.personnages[].plan_actions[].duree' }"))).toBe(
			false,
		)
		// Et le balayage voit bien un fichier qui n'est pas dans le module : sans cela, `play-mode` et
		// `player` pourraient être vides parce que `fichiersDeProduction` ne voit rien.
		expect(fichiersDeProduction(path.join(RACINE_SRC, 'player')).length).toBeGreaterThan(0)
		expect(fichiersDeProduction(path.join(RACINE_SRC, 'features', 'play-mode')).length).toBeGreaterThan(0)
	})

	it('horloge.ts appelle etapeBloqueeAuPas et ne soustrait jamais horloge.tour — climat.ts compare tour et duree, mais pour l extinction d un climat, une AUTRE decision', () => {
		expect(enPositionDeCode(source('horloge.ts'))).toMatch(/\betapeBloqueeAuPas\(/)
		expect(source('horloge.ts')).toMatch(/import\s*\{\s*etapeBloqueeAuPas\s*\}\s*from\s*'\.\/blocage'/)
		// Aucune autre soustraction `tour − …` dans le tick : la formule n'y est pas dupliquée.
		expect(enPositionDeCode(source('horloge.ts'))).not.toMatch(/horloge\.tour\s*-/)
	})
})
