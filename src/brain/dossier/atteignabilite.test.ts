import fs from 'node:fs'
import path from 'node:path'
import { producteursParIndice } from './atteignabilite'
import { DELTAS, type Delta } from './deltas'
import { CHEMINS_DE_DELTAS, REFERENCES_SIMPLES } from './tables'
import type { Dossier } from './types'

/**
 * L'ATTEIGNABILITÉ DES INDICES — qui produit quoi, arêtes saturées.
 *
 * Ce que cette suite prouve et que `controles.test.ts` ne peut pas prouver : la
 * saturation elle-même, à l'unité, sans passer par les trois seuils d'une règle.
 * Un compte qui bascule de 1 à 0 se lit là-bas comme une alerte devenue
 * bloquante ; ici il se lit comme un compte. Les deux lectures sont nécessaires —
 * l'une tient la RÈGLE, l'autre tient le CALCUL.
 *
 * LES FIXTURES NE SONT JAMAIS MUTÉES SUR LE DISQUE (KR-156) : chaque témoin est
 * un CLONE lu du fichier à chaque appel, dont on remplace UN SEUL champ — la
 * collection d'indices, et au plus le savoir de l'unique personnage. Les deux
 * fixtures partagées sont lues par huit suites ; exhiber un cycle en les mutant
 * était un `REJETÉ` explicite du raffinage.
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

/** Le clone de la fixture minimale, LU DU DISQUE à chaque appel (KR-156). */
function clone(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Dossier
}

/**
 * LES SOURCES BALAYÉES, fins de ligne NORMALISÉES — l'arbre de travail est en
 * CRLF et `prettier` écrit en LF ; une garde qui dépendrait de l'une ou de
 * l'autre rougirait après un simple `git checkout`.
 */
const SOURCE_ATTEIGNABILITE = fs.readFileSync(path.join(__dirname, 'atteignabilite.ts'), 'utf8').replace(/\r\n/g, '\n')

/** Le COMPTE saturé de chaque identifiant demandé, dans l'ordre demandé. */
function compteDe(dossier: Dossier, ids: readonly string[]): string[] {
	const carte = producteursParIndice(dossier)
	return ids.map((id) => `${id} → ${carte.get(id)?.length ?? 0}`)
}

/**
 * LA CARTE ENTIÈRE, projetée en lignes `id → familles` et TRIÉE. Triée parce que
 * la comparaison qui l'utilise porte sur le CONTENU et non sur l'ordre
 * d'insertion : c'est justement l'indépendance à l'ordre du document qu'elle doit
 * prouver, et un `Map` la porte dans ses clés.
 */
function carteDe(dossier: Dossier): string[] {
	return [...producteursParIndice(dossier).entries()]
		.map(([id, sources]) => {
			const familles = sources.map((source) => source.famille).join('+')
			return `${id} → ${sources.length === 0 ? '(vide)' : familles}`
		})
		.sort()
}

/** Un identifiant que RIEN de la fixture ne produit — la cible des témoins de site. */
const CIBLE_NEUVE = 'indice.jamais-produit'

describe('producteursParIndice, la saturation des aretes par point fixe', () => {
	it('une chaine a quatre maillons se sature en entier, et l ordre du document ne la change pas', () => {
		const dossier = clone()
		// LA CHAÎNE `A(savoir) → B → C → D`, POSÉE DANS L'ORDRE DE DOCUMENT `[D, C, B, A]`.
		//
		// QUATRE MAILLONS ET NON TROIS, et c'est une CORRECTION MESURÉE, pas un excès de
		// zèle : sur trois maillons, une relaxation dont la borne serait figée AVANT la
		// boucle — donc une seule itération au lieu du point fixe — rend A=B=C=1,
		// exactement comme le point fixe. Le témoin était VERT sur la mutation même
		// qu'il portait le nom d'attraper. Le quatrième maillon est le premier qu'une
		// deuxième itération est seule à atteindre, et c'est lui qui rougit.
		//
		// L'ORDRE, lui, reste ADVERSE et le reste nécessairement : sous `[A, B, C, D]`,
		// une passe unique en ordre de document trouverait tout par coïncidence.
		dossier.monde.indices = [
			{ id: 'indice.D' },
			{ id: 'indice.C', mene_a: ['indice.D'] },
			{ id: 'indice.B', mene_a: ['indice.C'] },
			{ id: 'indice.A', mene_a: ['indice.B'] },
		]
		// LA SEULE RACINE du témoin : le savoir de l'unique personnage, repointé sur A.
		// Tout le reste doit venir des arêtes, sans quoi le témoin ne prouve rien.
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.A'

		// UN POINT FIXE ET NON UNE PASSE : D n'est atteint qu'après que C soit entré
		// dans le noyau, lui-même après B. Cette ligne attrape aussi le filtre
		// « racine seulement », qui ne saturerait que le premier maillon.
		expect(compteDe(dossier, ['indice.A', 'indice.B', 'indice.C', 'indice.D'])).toEqual([
			'indice.A → 1',
			'indice.B → 1',
			'indice.C → 1',
			'indice.D → 1',
		])

		// PAIRAGE NÉGATIF, DANS LE MÊME TEST (KR-197/202) : la même chaîne privée de sa
		// DERNIÈRE arête `C → D`, D retombe à ZÉRO pendant que les trois premiers ne
		// bougent pas. Sans cette moitié, l'assertion ci-dessus resterait verte sous une
		// clôture qui mettrait dans le noyau TOUT identifiant cité.
		const rompu = clone()
		rompu.monde.indices = [
			{ id: 'indice.D' },
			{ id: 'indice.C' },
			{ id: 'indice.B', mene_a: ['indice.C'] },
			{ id: 'indice.A', mene_a: ['indice.B'] },
		]
		rompu.monde.personnages[0].savoirs[0].indice_id = 'indice.A'
		expect(compteDe(rompu, ['indice.A', 'indice.B', 'indice.C', 'indice.D'])).toEqual([
			'indice.A → 1',
			'indice.B → 1',
			'indice.C → 1',
			'indice.D → 0',
		])

		// CE QUE CETTE MOITIÉ-CI N'ATTRAPE PAS, écrit parce qu'on a cru le contraire : le
		// maillon perdu y est TOTALEMENT ISOLÉ — aucune arête entrante ni sortante —,
		// si bien qu'une propagation à REBOURS n'aurait rien à lui propager et resterait
		// verte. C'est la charge du témoin d'arête arrière, juste en dessous.

		// L'ORDRE RENVERSÉ REND LA MÊME CARTE, entrée pour entrée et famille pour
		// famille : un point fixe ne dépend pas de l'ordre de lecture, une passe si.
		const renverse = clone()
		renverse.monde.indices = [...dossier.monde.indices].reverse()
		renverse.monde.personnages[0].savoirs[0].indice_id = 'indice.A'
		expect(carteDe(renverse)).toEqual(carteDe(dossier))
	})

	it('une arete qui pointe VERS un indice produit ne produit pas son amont', () => {
		const dossier = clone()
		// LE SENS DE L'ARÊTE, ÉPINGLÉ. `A` porte la seule racine ; `X` ne porte rien et
		// pointe VERS `A` ; `W` ne porte rien et pointe vers `X`. Sous la sémantique
		// juste, RIEN NE REMONTE : qu'un amont désigne un indice produit ne produit pas
		// cet amont. `X` et `W` restent à zéro, et `A` ne compte QUE son savoir.
		//
		// CE QUE CE TÉMOIN ATTRAPE, ET QUE LA CHAÎNE ROMPUE CI-DESSUS NE PEUT PAS
		// ATTRAPER — mesuré, pas supposé : une relaxation qui traiterait les arêtes
		// comme NON ORIENTÉES, ou une clôture par COMPOSANTE CONNEXE, ferait entrer `X`
		// puis `W` dans le noyau. L'arête `W → X` survivrait (X passerait à 1) et
		// `X → A` aussi (A passerait à 2). Le nœud témoin doit donc être RELIÉ au
		// noyau, jamais isolé : c'est tout le point.
		dossier.monde.indices = [
			{ id: 'indice.W', mene_a: ['indice.X'] },
			{ id: 'indice.X', mene_a: ['indice.A'] },
			{ id: 'indice.A' },
		]
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.A'
		expect(compteDe(dossier, ['indice.A', 'indice.X', 'indice.W'])).toEqual([
			'indice.A → 1',
			'indice.X → 0',
			'indice.W → 0',
		])

		// DISCRIMINANT, DANS LE MÊME TEST : l'arête de `X` RETOURNÉE — `A.mene_a` porte
		// `X` au lieu de l'inverse, un seul champ déplacé —, et `X` se met à compter.
		// C'est ce qui prouve que les zéros ci-dessus viennent du SENS de l'arête, et
		// non d'un index qui ne lirait pas `mene_a` du tout. `W`, lui, reste à zéro : il
		// n'est cité par personne, et rien ne le produira jamais par ce chemin.
		const retourne = clone()
		retourne.monde.indices = [
			{ id: 'indice.W', mene_a: ['indice.X'] },
			{ id: 'indice.X' },
			{ id: 'indice.A', mene_a: ['indice.X'] },
		]
		retourne.monde.personnages[0].savoirs[0].indice_id = 'indice.A'
		expect(compteDe(retourne, ['indice.A', 'indice.X', 'indice.W'])).toEqual([
			'indice.A → 1',
			'indice.X → 1',
			'indice.W → 0',
		])
	})

	it('une cle absente, une cle vide et une cle pleine sont trois etats distincts, SANS aucun cycle', () => {
		const dossier = clone()
		// LA CHAÎNE NON RACINÉE `amont → aval`, L'ORPHELIN (aucune source brute) et LA
		// RACINE (un savoir), sur le même dossier — ET PAS UN SEUL CYCLE.
		//
		// C'EST LE POINT DE CE TÉMOIN, et il vient d'une correction de revue : le
		// troisième état n'est PAS « boucle », c'est « des sources, aucune racine ». En
		// remontant les amonts d'un indice non produit dans un graphe FINI, on tombe sur
		// un cycle OU sur une chaîne simplement non racinée — la seconde étant la plus
		// probable, un auteur qui chaîne `A → B → C` et oublie de raciner `A`. Un témoin
		// qui n'aurait exhibé que le cycle laissait passer un message qui AFFIRMAIT la
		// boucle, et personne n'aurait vu qu'il était faux ici.
		dossier.monde.indices = [
			{ id: 'indice.amont', mene_a: ['indice.aval'] },
			{ id: 'indice.aval' },
			{ id: 'indice.orphelin' },
			{ id: 'indice.racine' },
		]
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.racine'

		// AUCUN CYCLE ICI, et ce n'est pas une affirmation de commentaire : la
		// collection ENTIÈRE ne porte qu'UNE arête, et elle n'est pas réflexive. Un
		// graphe à une seule arête non réflexive n'a pas de cycle — la propriété est
		// donc lue sur la donnée, pas promise en prose.
		expect(
			dossier.monde.indices.flatMap((indice) => (indice.mene_a ?? []).map((vise) => `${indice.id} → ${vise}`)),
		).toEqual(['indice.amont → indice.aval'])

		const carte = producteursParIndice(dossier)

		// LES TROIS ÉTATS, et c'est CETTE carte — pas un champ ajouté au constat — qui
		// donne ses DEUX messages au seuil bloquant : le compte est nul dans les deux
		// premiers cas, seule la PRÉSENCE de la clé les sépare. Le jour où la
		// reconstruction laisserait tomber les clés vides, les deux textes
		// redeviendraient un seul, et rien d'autre ne le dirait.
		expect(
			['indice.aval', 'indice.orphelin', 'indice.racine'].map(
				(id) => `${id} → ${carte.has(id)} · ${carte.get(id)?.length ?? 0}`,
			),
		).toEqual(['indice.aval → true · 0', 'indice.orphelin → false · 0', 'indice.racine → true · 1'])

		// LE CYCLE REND LE MÊME ÉTAT, ce qui est la preuve qu'il n'en est qu'un
		// EXEMPLAIRE : deux indices qui se renvoient l'un à l'autre sont clé-présente-
		// vide comme `aval` ci-dessus, ni plus ni moins. La carte ne connaît pas la
		// forme du graphe, seulement l'atteignabilité — et c'est ce que le message doit
		// dire.
		const cycle = clone()
		cycle.monde.indices = [
			{ id: 'indice.boucle-a', mene_a: ['indice.boucle-b'] },
			{ id: 'indice.boucle-b', mene_a: ['indice.boucle-a'] },
		]
		const carteDuCycle = producteursParIndice(cycle)
		expect(
			['indice.boucle-a', 'indice.boucle-b'].map(
				(id) => `${id} → ${carteDuCycle.has(id)} · ${carteDuCycle.get(id)?.length ?? 0}`,
			),
		).toEqual(['indice.boucle-a → true · 0', 'indice.boucle-b → true · 0'])
	})

	it('deux entrees de meme identifiant voient leurs aretes concatenees, jamais ecrasees', () => {
		const dossier = clone()
		// UNE PROMESSE QUI N'ÉTAIT TENUE QUE PAR QUATRE LIGNES DE COMMENTAIRE, relevée
		// en revue de PR (même famille que BUG-087) : remplacer le couple
		// `get`/`push` de la relecture des arêtes par un simple `set` laissait la suite
		// ENTIÈREMENT verte. Or l'index brut, lui, CONCATÈNE — un écrasement ferait
		// compter moins d'occurrences que la lecture à plat, donc casserait
		// l'iso-comportement sur le seul dossier où la question se pose.
		//
		// LE VALIDATEUR REFUSE CE DOSSIER (deux entités de même identifiant), et c'est
		// justement pourquoi le témoin est dû : `producteursParIndice` se promet TOTALE,
		// et une fonction totale est éprouvée sur ce que son type admet, pas sur ce que
		// son appelant habituel lui donne.
		dossier.monde.indices = [
			{ id: 'indice.amont', mene_a: ['indice.aval'] },
			{ id: 'indice.amont', mene_a: ['indice.autre'] },
			{ id: 'indice.aval' },
			{ id: 'indice.autre' },
		]
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.amont'

		// LES DEUX CIBLES COMPTENT. Sous un `set`, la seconde entrée écraserait la
		// première et `aval` retomberait à zéro — la ligne rougit alors sur lui seul.
		expect(compteDe(dossier, ['indice.aval', 'indice.autre'])).toEqual(['indice.aval → 1', 'indice.autre → 1'])
	})

	it('producteursParIndice n a que deux porteurs dans brain/dossier', () => {
		// LA GARDE DE POPULATION DE LA RÉSERVE DU `?? 0`. Les trois états de la carte —
		// clé absente, clé vide, clé pleine — ne se lisent correctement que par un
		// appelant qui les connaît. Aujourd'hui il n'y en a qu'un, et sa lecture est
		// juste ; le jour où un second arrive, cette ligne rougit et quelqu'un relit la
		// docstring au lieu d'écrire `?? 0` de confiance.
		//
		// La MENTION suffit à faire un porteur, appel ou docstring : c'est voulu, un
		// module qui parle de cet index est un module qui le lira.
		const porteurs = fs
			.readdirSync(__dirname)
			.filter((fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.test.ts'))
			.filter((fichier) => fs.readFileSync(path.join(__dirname, fichier), 'utf8').includes('producteursParIndice'))

		expect(porteurs).toEqual(['atteignabilite.ts', 'controles.ts'])
	})

	it('deux occurrences de la meme cible comptent deux fois, comme la lecture a plat', () => {
		const dossier = clone()
		// `mene_a` est une LISTE, pas un ensemble : un doublon y est légal au schéma. La
		// reconstruction compte par OCCURRENCE d'arête et non par cible distincte —
		// c'est ce que faisait la lecture à plat d'it3, et l'iso-comportement l'exige
		// quand tout est atteignable. Deux occurrences suffisent donc au silence.
		dossier.monde.indices = [{ id: 'indice.amont', mene_a: ['indice.aval', 'indice.aval'] }, { id: 'indice.aval' }]
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.amont'
		expect(compteDe(dossier, ['indice.amont', 'indice.aval'])).toEqual(['indice.amont → 1', 'indice.aval → 2'])

		// DISCRIMINANT : l'amont privé de sa racine — UN SEUL champ —, les deux
		// occurrences meurent ENSEMBLE. Le doublon ne produit jamais par lui-même.
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.ailleurs'
		expect(compteDe(dossier, ['indice.amont', 'indice.aval'])).toEqual(['indice.amont → 0', 'indice.aval → 0'])
	})

	it('le module ne connait ni section ni niveau ni phrase d auteur', () => {
		// LA FRONTIÈRE DE COUTURE, ÉPINGLÉE PLUTÔT QU'AFFIRMÉE (KR-169) : ce module dit
		// QUI PRODUIT QUOI, `controles.ts` dit ce qu'on en conclut et comment on le
		// raconte. Une docstring qui l'annonce est une intention ; ces six lignes en
		// font un contrat.
		for (const interdit of ["from './validate'", "from './sections'", 'SectionId', 'NiveauControle']) {
			expect(`${interdit} → ${SOURCE_ATTEIGNABILITE.includes(interdit)}`).toBe(`${interdit} → false`)
		}

		// LES DEUX MOITIÉS : sans celle-ci, un module qui n'importerait RIEN passerait
		// l'interdiction ci-dessus sans rien prouver.
		expect(SOURCE_ATTEIGNABILITE).toContain("from './types'")
		expect(SOURCE_ATTEIGNABILITE).toContain("from './deltas'")
	})
})

describe('le recensement des racines reste borne, et la borne vient des registres', () => {
	it('G1 les quatre sites de CHEMINS_DE_DELTAS sont tous lus, et les cles viennent de la table', () => {
		// LA GARDE KR-199 N'EST PAS L'ÉNUMÉRATION, C'EST LA MESURE : le compte vient de
		// la TABLE, donc un cinquième emplacement d'effets y fait rougir cette ligne
		// avant que quiconque ait à se demander si l'index le lit.
		expect(CHEMINS_DE_DELTAS).toHaveLength(4)

		const REVELATION: Delta = { delta: 'reveler_indice', cibles: [CIBLE_NEUVE] }
		const SITES: Record<string, (dossier: Dossier) => void> = {
			'monde.quetes[].recompense': (dossier) => {
				dossier.monde.quetes[0].recompense = [REVELATION]
			},
			'monde.evenements[].resolutions[].consequence': (dossier) => {
				dossier.monde.evenements[0].resolutions[0].consequence = [REVELATION]
			},
			'monde.conditions.climat[].effets_regles': (dossier) => {
				dossier.monde.conditions.climat[0].effets_regles = [REVELATION]
			},
			'charpente.jalons[].effet': (dossier) => {
				dossier.charpente.jalons[0].effet = [REVELATION]
			},
		}

		// Les clés SONT les chemins de la table, dans son ordre — jamais quatre littéraux
		// de plus, qui dériveraient d'elle en silence.
		expect(Object.keys(SITES)).toEqual(CHEMINS_DE_DELTAS.map((chemin) => chemin.path))

		for (const [chemin, planter] of Object.entries(SITES)) {
			// UN SITE À LA FOIS, sur un clone NEUF : un dossier qui les porterait tous les
			// quatre resterait vert même si trois d'entre eux n'étaient jamais lus.
			const dossier = clone()
			dossier.monde.indices = [{ id: CIBLE_NEUVE }]
			const compte = (): string => `${chemin} → ${producteursParIndice(dossier).get(CIBLE_NEUVE)?.length ?? 0}`

			// Rouge AVANT, pour que le vert d'après prouve le SITE et non l'absence de
			// lecture.
			expect(compte()).toBe(`${chemin} → 0`)
			planter(dossier)
			expect(compte()).toBe(`${chemin} → 1`)
		}
	})

	it('G2 le seul verbe de DELTAS qui nomme un indice est reveler_indice', () => {
		// LE TROU QUE G1 NE VOIT PAS : un VERBE de delta neuf nommant un indice
		// (`oublier_indice`, producteur NÉGATIF lu comme rien) laisse les quatre sites à
		// quatre et le balayage du littéral vert, sans que l'index lise jamais cette
		// source. La liste se dérive donc du registre, jamais de la mémoire.
		expect(
			Object.entries(DELTAS)
				.filter(([, descripteur]) => descripteur.refKinds.includes('indice'))
				.map(([id]) => id),
		).toEqual(['reveler_indice'])
	})

	it('G3 les references simples d espace indice sont les trois chemins d aujourd hui', () => {
		// LE SECOND TROU : un producteur qui arriverait par une RÉFÉRENCE SIMPLE plutôt
		// que par un delta (`Objet.revele_indice_id?` est au moins aussi probable que
		// `Objet.effets?: Delta[]`) n'ajouterait aucune ligne à `CHEMINS_DE_DELTAS`.
		// Cette ligne-ci le verrait.
		//
		// Elle rend aussi MÉCANIQUE la phrase « seconde arête indice → indice » de H2,
		// au lieu de la laisser documentaire : chaque chemin est annoté PRODUCTEUR ou
		// PORTE, et une quatrième entrée d'espace `indice` devra choisir son camp ici.
		expect(
			REFERENCES_SIMPLES.filter((reference) => reference.espace === 'indice').map((reference) => reference.path),
		).toEqual([
			// PRODUCTEUR — un savoir détenu par un personnage. Compté, famille `savoir`.
			'monde.personnages[].savoirs[].indice_id',
			// PORTE — la SECONDE arête indice → indice du schéma. NON saturée ici : c'est
			// une porte de RACINE, charge de la tranche « porte morte, producteur
			// fantôme » (H2).
			'monde.personnages[].savoirs[].revele_si.apres_indice_id',
			// PRODUCTEUR — la PREMIÈRE arête indice → indice, la seule que ce module
			// sature. Comptée par OCCURRENCE, famille `mene_a`.
			'monde.indices[].mene_a[]',
		])
	})
})
