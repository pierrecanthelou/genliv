import fs from 'node:fs'
import path from 'node:path'
import { premiereFeuilleInaccomplissable, producteursParIndice } from './atteignabilite'
import { DELTAS, type Delta } from './deltas'
import type { ExprNode } from './expr'
import { PREDICATES, type PredicatId } from './predicates'
import { CHEMINS_DE_DELTAS, REFERENCES_SIMPLES } from './tables'
import { CONFIANCE_MAX, type Dossier, type Revelation, type Savoir } from './types'

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
	return ids.map((id) => `${id} → ${carte.get(id)?.retenues.length ?? 0}`)
}

/**
 * LA CARTE ENTIÈRE, projetée en lignes `id → familles` et TRIÉE. Triée parce que
 * la comparaison qui l'utilise porte sur le CONTENU et non sur l'ordre
 * d'insertion : c'est justement l'indépendance à l'ordre du document qu'elle doit
 * prouver, et un `Map` la porte dans ses clés.
 */
function carteDe(dossier: Dossier): string[] {
	return [...producteursParIndice(dossier).entries()]
		.map(([id, entree]) => {
			const familles = entree.retenues.map((source) => source.famille).join('+')
			return `${id} → ${entree.retenues.length === 0 ? '(vide)' : familles}`
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

		// LES TROIS ÉTATS DE LA CARTE. Depuis it9 le seuil bloquant porte TROIS messages,
		// et ils ne se lisent PAS tous ici : la carte en sépare DEUX — clé absente contre
		// clé présente à compte nul — par la seule PRÉSENCE de la clé, et le troisième
		// vient de `savoirSousPorteMorte`, champ ajouté à l'ENTRÉE D'INDEX (jamais au
		// constat, qui reste intact). Le jour où la reconstruction laisserait tomber les
		// clés vides, deux de ces trois textes redeviendraient un seul.
		expect(
			['indice.aval', 'indice.orphelin', 'indice.racine'].map(
				(id) => `${id} → ${carte.has(id)} · ${carte.get(id)?.retenues.length ?? 0}`,
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
				(id) => `${id} → ${carteDuCycle.has(id)} · ${carteDuCycle.get(id)?.retenues.length ?? 0}`,
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

/**
 * LES PORTES D'UN SAVOIR — ce que la saturation d'it6 comptait sans le regarder.
 *
 * Ce que cette suite prouve et qu'aucune autre ne peut prouver : que le point
 * fixe est UNIQUE et ENTRELACÉ, c'est-à-dire que `apres_indice_id` et `mene_a`
 * se relaxent DANS LA MÊME boucle. Les deux implémentations fautives que le plan
 * d'it9 nomme exigent DEUX témoins DISTINCTS, et c'est MESURÉ, pas déduit :
 *  · « portes évaluées AVANT la relaxation » rougit sur la chaîne d'ouverture
 *    (`racine → relais → tardif`) ;
 *  · « point fixe PUIS soustraction, non ré-itérée » y reste VERTE, et ne rougit
 *    que sur la CASCADE de deux savoirs gardés.
 * Un seul témoin laisserait donc passer exactement ce que le plan interdit —
 * BUG-087 rejoué, attrapé cette fois avant l'essaim.
 *
 * LES FIXTURES NE SONT JAMAIS MUTÉES SUR LE DISQUE (KR-156) : chaque témoin est
 * un CLONE lu du fichier, dont on remplace la collection d'indices et les savoirs
 * de l'unique personnage.
 */
describe('producteursParIndice, les portes d un savoir', () => {
	/** Un savoir de témoin — `certitude` est requise au schéma et ne décide de rien ici. */
	function savoir(indiceId: string, revele_si: Revelation): Savoir {
		return { indice_id: indiceId, certitude: 'sait', revele_si }
	}

	/** L'objet que la fixture DONNE — récompense de son unique quête. */
	const OBJET_DONNE = 'objet.clef-de-basalte'
	/** Un objet du dossier que RIEN ne donne — le prix qu'on ne paiera jamais. */
	const OBJET_JAMAIS_DONNE = 'objet.lanterne-eteinte'

	/**
	 * Le clone, PLUS un second objet que personne ne donne. Il EXISTE au dossier —
	 * une référence pendante serait une anomalie du validateur, et le témoin
	 * porterait alors sur autre chose que la porte.
	 */
	function cloneADeuxObjets(): Dossier {
		const dossier = clone()
		dossier.monde.objets = [
			...dossier.monde.objets,
			{
				id: OBJET_JAMAIS_DONNE,
				nom: 'Une lanterne éteinte',
				description_joueur: "Une lanterne de fer noirci, froide, dont personne n'a jamais eu l'usage.",
			},
		]
		return dossier
	}

	it('une contrepartie que personne ne donne ferme la porte, une contrepartie donnee ne la ferme pas', () => {
		const dossier = cloneADeuxObjets()
		// DEUX SAVOIRS DANS LE MÊME DOSSIER (KR-197/202), et UN SEUL caractère les
		// sépare : l'objet réclamé. Un témoin à un seul savoir ne distinguerait pas
		// une porte évaluée PAR SAVOIR d'un module qui aurait cessé de compter les
		// savoirs.
		dossier.monde.indices = [{ id: 'indice.paye' }, { id: 'indice.impaye' }]
		dossier.monde.personnages[0].savoirs = [
			savoir('indice.paye', { contrepartie: { objet_id: OBJET_DONNE, consomme: false } }),
			savoir('indice.impaye', { contrepartie: { objet_id: OBJET_JAMAIS_DONNE, consomme: false } }),
		]

		// LE FAIT EST LU SUR LA DONNÉE, jamais promis en prose : la récompense de
		// l'unique quête donne le premier objet et JAMAIS le second. Sans cette ligne,
		// l'assertion d'après resterait verte le jour où la fixture perdrait sa
		// récompense — et les deux savoirs tomberaient ensemble pour une raison qu'on
		// ne saurait pas nommer.
		expect(
			dossier.monde.quetes
				.flatMap((quete) => quete.recompense)
				.map((effet) => `${effet.delta} → ${effet.cibles.join()}`),
		).toEqual([`donner_objet → ${OBJET_DONNE}`])

		expect(compteDe(dossier, ['indice.paye', 'indice.impaye'])).toEqual(['indice.paye → 1', 'indice.impaye → 0'])

		// ET LE VERBE DÉCIDE, PAS L'ESPACE DE NOMS : la même récompense passée de
		// « donne » à « retire » — UN SEUL champ — ferme la première porte à son tour.
		// `retirer_objet` partage `refKinds: ['objet']` ; une porte dérivée de l'espace
		// resterait verte ici, en comptant une SOUSTRACTION comme un don.
		dossier.monde.quetes[0].recompense = [{ delta: 'retirer_objet', cibles: [OBJET_DONNE] }]
		expect(compteDe(dossier, ['indice.paye', 'indice.impaye'])).toEqual(['indice.paye → 0', 'indice.impaye → 0'])
	})

	it('une porte d indice s ouvre parce qu une arete vient de livrer son indice prealable', () => {
		const dossier = clone()
		// LA CHAÎNE D'OUVERTURE — `racine` (delta) → `relais` (arête) → `tardif`
		// (savoir gardé SUR `relais`). Le savoir ne peut entrer qu'APRÈS que l'arête a
		// livré `relais`, c'est-à-dire APRÈS un tour de relaxation.
		//
		// LE MUTANT QUE CE TÉMOIN ATTRAPE, et lui seul : « les portes sont évaluées
		// AVANT la relaxation ». Sous cette forme-là, `relais` n'est pas encore
		// atteignable quand la porte de `tardif` est lue, le savoir est écarté, et
		// `indice.tardif` retombe à ZÉRO.
		dossier.monde.indices = [
			{ id: 'indice.racine', mene_a: ['indice.relais'] },
			{ id: 'indice.relais' },
			{ id: 'indice.tardif' },
		]
		// LA SEULE RACINE : l'effet du jalon. Les autres effets du clone visent des
		// indices qui ne sont plus dans la collection, donc ils ne produisent rien ici.
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.racine'] }]
		dossier.monde.personnages[0].savoirs = [savoir('indice.tardif', { apres_indice_id: 'indice.relais' })]

		expect(compteDe(dossier, ['indice.racine', 'indice.relais', 'indice.tardif'])).toEqual([
			'indice.racine → 1',
			'indice.relais → 1',
			'indice.tardif → 1',
		])

		// DISCRIMINANT, DANS LE MÊME TEST (KR-197/202) : l'arête retirée — UN SEUL
		// champ —, `relais` n'est plus livré et la porte de `tardif` se referme. Sans
		// cette moitié, le `1` ci-dessus serait vert sous un module qui ne lirait
		// jamais `apres_indice_id`.
		dossier.monde.indices[0].mene_a = []
		expect(compteDe(dossier, ['indice.racine', 'indice.relais', 'indice.tardif'])).toEqual([
			'indice.racine → 1',
			'indice.relais → 0',
			'indice.tardif → 0',
		])
	})

	it('deux savoirs gardes en cascade sur une cible jamais produite comptent zero tous les deux', () => {
		const dossier = clone()
		// LA CASCADE — `mirage` que rien ne produit, `premier` gardé sur `mirage`,
		// `second` gardé sur `premier`. Aucun delta ne vise ces trois-là : l'effet du
		// jalon et la conséquence de l'événement visent des indices qui ne sont plus
		// dans la collection.
		//
		// LE MUTANT QUE CE TÉMOIN ATTRAPE, ET QUE LE PRÉCÉDENT LAISSE VERT : « point
		// fixe d'it6 PUIS soustraction, non ré-itérée ». Cette forme-là compte d'abord
		// les savoirs SANS regarder leurs portes — `premier` et `second` entrent —,
		// puis retire ceux dont la porte est fermée CONTRE L'ENSEMBLE FINAL : la porte
		// de `second` y trouve `premier` et passe pour ouverte. `indice.second` remonte
		// alors à UN.
		//
		// LA PROFONDEUR DEUX EST MESURÉE, PAS CHOISIE : sur un SEUL savoir gardé,
		// `premier` vaut zéro sous les deux implémentations — la fautive le retire
		// aussi, sa cible `mirage` n'étant dans aucun ensemble. C'est le SECOND maillon
		// qui sépare, parce qu'il est le premier dont la porte vise un indice que la
		// soustraction a déjà retiré. Et c'est une chaîne de PORTES, jamais de
		// relaxations : le chiffre QUATRE de la chaîne `mene_a` ne s'y transporte pas.
		dossier.monde.indices = [{ id: 'indice.mirage' }, { id: 'indice.premier' }, { id: 'indice.second' }]
		dossier.monde.personnages[0].savoirs = [
			savoir('indice.premier', { apres_indice_id: 'indice.mirage' }),
			savoir('indice.second', { apres_indice_id: 'indice.premier' }),
		]

		expect(compteDe(dossier, ['indice.mirage', 'indice.premier', 'indice.second'])).toEqual([
			'indice.mirage → 0',
			'indice.premier → 0',
			'indice.second → 0',
		])

		// DISCRIMINANT, DANS LE MÊME TEST : `mirage` racinée par l'effet du jalon — UN
		// SEUL champ —, et LA CASCADE ENTIÈRE s'allume, un maillon par tour. Sans cette
		// moitié, les trois zéros seraient ceux d'un module qui ne compterait jamais un
		// savoir gardé.
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.mirage'] }]
		expect(compteDe(dossier, ['indice.mirage', 'indice.premier', 'indice.second'])).toEqual([
			'indice.mirage → 1',
			'indice.premier → 1',
			'indice.second → 1',
		])
	})

	it('un cycle d apres_indice_id et un cycle MIXTE comptent zero, jamais un', () => {
		// LE PLUS PETIT POINT FIXE, ÉPINGLÉ — et c'est la seule ligne qui sépare le
		// point fixe CROISSANT du point fixe décroissant. Parti de « tout est
		// produit », le second rendrait ici deux membres qui se justifient l'un
		// l'autre : un FAUX NÉGATIF sous une règle bloquante.
		const mutuel = clone()
		mutuel.monde.indices = [{ id: 'indice.jumeau-a' }, { id: 'indice.jumeau-b' }]
		mutuel.monde.personnages[0].savoirs = [
			savoir('indice.jumeau-a', { apres_indice_id: 'indice.jumeau-b' }),
			savoir('indice.jumeau-b', { apres_indice_id: 'indice.jumeau-a' }),
		]
		expect(compteDe(mutuel, ['indice.jumeau-a', 'indice.jumeau-b'])).toEqual([
			'indice.jumeau-a → 0',
			'indice.jumeau-b → 0',
		])

		// LE CYCLE MIXTE — une arête `mene_a` ET une porte `apres_indice_id` sur le
		// même circuit : `amont` n'est produit que par un savoir gardé sur `aval`, et
		// `aval` n'est produit que par l'arête d'`amont`. C'est le témoin qui exige que
		// les DEUX relaxations soient la MÊME : un point fixe qui saturerait les arêtes
		// dans une passe et les portes dans une autre ne verrait jamais que ce circuit
		// se referme sur lui-même.
		const mixte = clone()
		mixte.monde.indices = [{ id: 'indice.amont', mene_a: ['indice.aval'] }, { id: 'indice.aval' }]
		mixte.monde.personnages[0].savoirs = [savoir('indice.amont', { apres_indice_id: 'indice.aval' })]
		mixte.charpente.jalons[0].effet = []
		expect(compteDe(mixte, ['indice.amont', 'indice.aval'])).toEqual(['indice.amont → 0', 'indice.aval → 0'])

		// DISCRIMINANT, DANS LE MÊME TEST : `aval` racinée par l'effet du jalon — UN
		// SEUL champ —, la porte d'`amont` s'ouvre, et son arête revit par-dessus.
		// Sans cette moitié, les quatre zéros ci-dessus seraient ceux d'un module qui
		// ne compte jamais rien.
		mixte.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.aval'] }]
		expect(compteDe(mixte, ['indice.amont', 'indice.aval'])).toEqual(['indice.amont → 1', 'indice.aval → 2'])
	})

	it('les portes se composent en ET, et les deux portes NON evaluees ne ferment jamais', () => {
		const dossier = clone()
		// DEUX SAVOIRS DANS LE MÊME DOSSIER, chacun portant DEUX portes — une évaluée,
		// une non évaluée :
		//  · `ferme` — porte d'indice FERMÉE (son préalable n'est produit par rien)
		//    PLUS une `confiance_min`. Le ET par construction le laisse à ZÉRO ;
		//  · `ouvert` — porte d'indice OUVERTE (son préalable est raciné par l'effet du
		//    jalon) PLUS un `jet`. Les portes non évaluées ne ferment pas : il compte UN.
		//
		// LE MUTANT QUE CE TÉMOIN ATTRAPE : une `porteOuverte` écrite en `some` —
		// « au moins une porte s'ouvre » — au lieu d'une suite de gardes à sortie
		// `false`. Les deux formes se ressemblent tant qu'une seule porte est posée et
		// se contredisent dès la seconde : sous le `some`, la `confiance_min` non
		// évaluée de `ferme` suffirait à l'ouvrir, et `indice.ferme` remonterait à UN.
		dossier.monde.indices = [
			{ id: 'indice.racine' },
			{ id: 'indice.mirage' },
			{ id: 'indice.ferme' },
			{ id: 'indice.ouvert' },
		]
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.racine'] }]
		dossier.monde.personnages[0].savoirs = [
			savoir('indice.ferme', { confiance_min: CONFIANCE_MAX, apres_indice_id: 'indice.mirage' }),
			savoir('indice.ouvert', { jet: { carac: 'CA', tc: 'TC2' }, apres_indice_id: 'indice.racine' }),
		]

		expect(compteDe(dossier, ['indice.ferme', 'indice.ouvert'])).toEqual(['indice.ferme → 0', 'indice.ouvert → 1'])

		// LES DEUX PORTES NON ÉVALUÉES SONT RÉELLEMENT PRÉSENTES AU TÉMOIN, lu sur la
		// donnée : sans cette ligne, les deux comptes ci-dessus seraient ceux de deux
		// savoirs ne portant qu'une porte chacun, et le ET ne serait pas éprouvé.
		expect(
			dossier.monde.personnages[0].savoirs.map(
				(candidat) => `${candidat.indice_id} → ${Object.keys(candidat.revele_si ?? {}).join('+')}`,
			),
		).toEqual(['indice.ferme → confiance_min+apres_indice_id', 'indice.ouvert → jet+apres_indice_id'])

		// ET SEULES, LES NON ÉVALUÉES N'EMPÊCHENT RIEN : la porte d'indice de `ferme`
		// retirée — UN SEUL champ —, sa `confiance_min` reste, et il compte UN. Sans
		// cette moitié, le zéro ci-dessus serait vert sous une implémentation qui
		// FERMERAIT sur `confiance_min`.
		dossier.monde.personnages[0].savoirs[0].revele_si = { confiance_min: CONFIANCE_MAX }
		expect(compteDe(dossier, ['indice.ferme', 'indice.ouvert'])).toEqual(['indice.ferme → 1', 'indice.ouvert → 1'])
	})

	it('un savoir dont la porte est morte est CLASSE sous porte morte, sans quitter les cles', () => {
		const dossier = clone()
		// LE CHAMP `savoirSousPorteMorte` EST LA SEULE CHOSE QUE LE COMPTE NE SAIT PAS
		// DIRE, et son appelant ne peut pas le reconstruire sans refaire le point fixe.
		// Il se prouve donc ICI, à l'unité, et non à travers les trois seuils d'une
		// règle.
		dossier.monde.indices = [{ id: 'indice.mirage' }, { id: 'indice.garde' }, { id: 'indice.servi' }]
		dossier.monde.personnages[0].savoirs = [savoir('indice.garde', { apres_indice_id: 'indice.mirage' })]
		dossier.charpente.jalons[0].effet = []

		const carte = producteursParIndice(dossier)
		// LE DOMAINE DES CLÉS EST INCHANGÉ : une porte fermée retire une SOURCE, jamais
		// une CLÉ — le savoir CITE toujours son indice. `mirage`, que personne ne cite,
		// reste absent ; `servi`, que personne ne cite non plus, aussi.
		expect(
			['indice.garde', 'indice.mirage', 'indice.servi'].map(
				(id) =>
					`${id} → ${carte.has(id)} · ${carte.get(id)?.retenues.length ?? 0} · ${carte.get(id)?.savoirSousPorteMorte}`,
			),
		).toEqual([
			'indice.garde → true · 0 · true',
			'indice.mirage → false · 0 · undefined',
			'indice.servi → false · 0 · undefined',
		])

		// DISCRIMINANT, DANS LE MÊME TEST : `mirage` racinée — UN SEUL champ —, la
		// porte s'ouvre, le compte passe à un ET le classement retombe à `false`. Sans
		// cette moitié, le `true` ci-dessus serait vert sous un champ câblé en dur.
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.mirage'] }]
		const ouverte = producteursParIndice(dossier)
		expect(
			`${ouverte.get('indice.garde')?.retenues.length} · ${ouverte.get('indice.garde')?.savoirSousPorteMorte}`,
		).toBe('1 · false')
	})

	it('objetsDonnesDe a UNE definition et DEUX appelants, et rien n est memoise', () => {
		// UNE DÉFINITION, DEUX APPELANTS — et la ligne de déclaration comprise,
		// `objetsDonnesDe(` paraît TROIS fois : la définition, la porte `contrepartie`
		// d'un savoir, le prédicat `possede_objet`. Deux relevés du même fait
		// dériveraient l'un de l'autre, et ils le feraient en SILENCE : le second à
		// diverger continuerait de rendre un ensemble, simplement faux.
		expect(SOURCE_ATTEIGNABILITE.split('function objetsDonnesDe').length - 1).toBe(1)
		expect(SOURCE_ATTEIGNABILITE.split('objetsDonnesDe(').length - 1).toBe(3)

		// UNE SEULE DÉFINITION DE LA PORTE, pour la même raison et avec un enjeu de
		// plus : `pnj_a_revele` doit lire LA MÊME porte que le compte, sans quoi le
		// même savoir compterait zéro producteur d'un côté et établirait la paire de
		// l'autre. QUATRE occurrences de `porteOuverte(` — la définition, la règle du
		// point fixe, le classement final, la paire.
		expect(SOURCE_ATTEIGNABILITE.split('function porteOuverte').length - 1).toBe(1)
		expect(SOURCE_ATTEIGNABILITE.split('porteOuverte(').length - 1).toBe(4)

		// AUCUNE MÉMOÏSATION (KR-013/113), et c'est prouvé PAR LE COMPORTEMENT plutôt
		// que par l'absence d'un mot dans la source : le MÊME objet dossier, muté entre
		// deux appels, rend deux comptes différents. Un cache posé sur sa référence
		// rendrait ici deux fois le premier.
		const dossier = clone()
		dossier.monde.indices = [{ id: 'indice.paye' }]
		dossier.monde.personnages[0].savoirs = [
			savoir('indice.paye', { contrepartie: { objet_id: OBJET_DONNE, consomme: false } }),
		]
		expect(compteDe(dossier, ['indice.paye'])).toEqual(['indice.paye → 1'])
		dossier.monde.quetes[0].recompense = []
		expect(compteDe(dossier, ['indice.paye'])).toEqual(['indice.paye → 0'])
	})

	it('le module n importe jamais la couche des regles du jeu', () => {
		// KR-193 / KR-130 — LE LINTER DU DOSSIER N'ÉVALUE PAS `jet`, ET C'EST
		// CONSTATABLE plutôt que promis. Évaluer un jet exigerait le tier et sa valeur,
		// donc l'import de la couche des règles dans un module qui ne lance aucun dé ;
		// et le verdict serait CONSTANT — il existe pour chaque tier un héros qui
		// réussit. La garde naît verte et le restera : le module n'importe aujourd'hui
		// que `./deltas`, `./expr`, `./predicates` et `./types`.
		for (const interdit of ["'../challenge'", 'CHALLENGE_TIERS', 'challengeTierValue']) {
			expect(`${interdit} → ${SOURCE_ATTEIGNABILITE.includes(interdit)}`).toBe(`${interdit} → false`)
		}

		// LA SECONDE MOITIÉ, sans laquelle l'interdiction porterait sur un FANTÔME
		// (classe BUG-090) : les deux symboles nommés EXISTENT bel et bien, et ils
		// vivent bien derrière ce chemin-là. Un renommage de la couche des règles
		// rougirait ici, au lieu de laisser trois `not.toContain` verts pour toujours.
		const SOURCE_CHALLENGE = fs.readFileSync(path.join(__dirname, '..', 'challenge.ts'), 'utf8')
		expect(SOURCE_CHALLENGE).toContain('export const CHALLENGE_TIERS')
		expect(SOURCE_CHALLENGE).toContain('export function challengeTierValue')
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
			const compte = (): string => `${chemin} → ${producteursParIndice(dossier).get(CIBLE_NEUVE)?.retenues.length ?? 0}`

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
			// PORTE — la SECONDE arête indice → indice du schéma. ÉVALUÉE depuis it9, sous
			// H4 : elle entre dans la MÊME relaxation que `mene_a`, jamais une passe à part.
			// (Cette annotation disait l'inverse jusqu'à it9 — « NON saturée ici, charge de
			// la tranche à venir » — alors que c'est cette tranche-là. Ce qui reste dû est
			// nommé à H2, et `apres_indice_id` n'y figure plus.)
			'monde.personnages[].savoirs[].revele_si.apres_indice_id',
			// PRODUCTEUR — la PREMIÈRE arête indice → indice, la seule que ce module
			// sature. Comptée par OCCURRENCE, famille `mene_a`.
			'monde.indices[].mene_a[]',
		])
	})
})

/**
 * LA SATISFIABILITÉ D'UNE CONDITION — ce que le dossier peut ÉTABLIR, jamais ce
 * qu'une session évaluerait.
 *
 * Ce que cette suite prouve et que `controles.test.ts` ne peut pas prouver : la
 * sémantique des quatre opérateurs et la décision de chacun des sept prédicats,
 * à l'unité, sans passer par la prose d'une règle. Là-bas un verdict se lit comme
 * une ligne de rapport ; ici il se lit comme un verdict.
 */
describe('premiereFeuilleInaccomplissable, la satisfiabilite d une condition', () => {
	/**
	 * Les libellés français sont ÉCRITS, jamais relus dans le registre : une
	 * attente qui s'alimenterait à la source qu'elle contrôle resterait verte sur
	 * un module qui rendrait la CLÉ technique (KR-199).
	 */
	const LIBELLE_POSSEDE = "possède l'objet"
	const LIBELLE_PAIRE = "le personnage a déjà révélé l'indice"
	const LIBELLE_CONNU = "connaît l'indice"

	it('le non ne descend jamais, et la condition de la fixture minimale reste accomplissable', () => {
		const dossier = clone()
		const condition = dossier.canon.objectifs[0].reussi_si_expr
		if (condition === undefined) throw new Error('la fixture minimale a perdu son reussi_si_expr')

		// LA FORME EST LUE SUR LA DONNÉE, jamais promise en prose : sans cette ligne,
		// l'assertion d'après resterait verte le jour où la fixture perdrait son `non`
		// — et c'est ce `non`-là qui porte tout le témoin.
		const formeDesEnfants = condition.op === 'et' ? condition.enfants.map((enfant) => enfant.op).join('+') : ''
		expect(`${condition.op} · ${formeDesEnfants}`).toBe('et · predicat+non')

		// LE MUTANT QUE CETTE LIGNE ATTRAPE, mesuré et non déduit : un `non` qui
		// DESCEND et INVERSE son enfant trouve ici un `evenement_consomme` que rien
		// n'évalue à it7 — donc établissable —, l'inverse en « inaccomplissable », et
		// allume un BLOQUANT sur la fixture de toutes les preuves.
		expect(premiereFeuilleInaccomplissable(dossier, condition)).toBeNull()

		// LES DEUX SENS, DANS LE MÊME TEST (KR-197/202). Une feuille que RIEN ne
		// produit est bien un défaut quand elle est NUE ; sous une négation, elle ne
		// dit plus rien : les sept prédicats lisent des champs de session qui partent
		// VIDES, donc `non(P)` est vrai au tour zéro. Sans cette moitié, l'assertion
		// ci-dessus serait verte sous une implémentation incapable de rien signaler.
		const nue: ExprNode = { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.rien-de-tel'] }
		expect(premiereFeuilleInaccomplissable(dossier, nue)).toEqual({
			predicat: LIBELLE_POSSEDE,
			cibles: ['objet.rien-de-tel'],
		})
		expect(premiereFeuilleInaccomplissable(dossier, { op: 'non', enfant: nue })).toBeNull()
	})

	it('la table d etablissement porte les sept predicats, et dit de CHACUN ce qu elle en fait', () => {
		// TOTALE PAR COMPILATION — un huitième prédicat ne compile pas tant que
		// personne n'a décidé ce que le linter en fait — ET TOTALE PAR VALEUR : une
		// itération faisant passer `jalon_atteint` d'une colonne à l'autre fait rougir
		// la ligne de ce prédicat, au lieu de glisser en silence (KR-199).
		//
		// « NON ÉVALUÉE À IT9 », jamais « toujours vraie » : un mot plus large que le
		// fait est exactement le défaut que cette garde existe pour attraper. Les deux
		// prédicats de LIEU sont là par KR-224 (monde ouvert, aucun graphe de
		// praticabilité au schéma) ; `jalon_atteint` et `evenement_consomme` y sont
		// parce qu'ils ont DEUX écrivains chacun — un delta ou la main du narrateur,
		// plus un `declencheur_expr` OPTIONNEL —, si bien que H4 ne les tranche pas.
		// LA VERSION PRÉCÉDENTE DE CE COMMENTAIRE LES DONNAIT « à la porte de racine
		// qu'it8 portera » : cette tranche est LIVRÉE et ne les prend pas, et la ligne
		// de H2 qui les y rangeait était fausse — sa correction est écrite au module.
		//
		// LA COLONNE `mord` NE DIT PAS « INCHANGÉE » : `pnj_a_revele` mord toujours,
		// mais il lit désormais la porte du savoir en plus de la paire. C'est le témoin
		// « pnj_a_revele lit la MEME porte que le compte » qui l'épingle, pas celui-ci.
		const DECISION: Record<PredicatId, 'mord' | 'non-evaluee-a-it9'> = {
			possede_objet: 'mord',
			indice_connu: 'mord',
			pnj_a_revele: 'mord',
			jalon_atteint: 'non-evaluee-a-it9',
			evenement_consomme: 'non-evaluee-a-it9',
			lieu_visite: 'non-evaluee-a-it9',
			lieu_courant_est: 'non-evaluee-a-it9',
		}

		// LES SEPT, BALAYÉS DEPUIS LE REGISTRE QUI FAIT FOI — jamais sept littéraux,
		// qui dériveraient de lui en silence.
		expect([...Object.keys(DECISION)].sort()).toEqual([...Object.keys(PREDICATES)].sort())
		// Discriminance : les DEUX colonnes sont réellement peuplées. Une table tout
		// entière d'un seul mot passerait le balayage ci-dessous sans rien séparer.
		expect(Object.values(DECISION).filter((decision) => decision === 'mord')).toHaveLength(3)

		const dossier = clone()
		for (const id of Object.keys(DECISION) as PredicatId[]) {
			// LES CIBLES SONT DÉRIVÉES DE `refKinds`, position par position : l'arité
			// n'est écrite nulle part ici, et le prédicat à deux cibles n'a aucun cas
			// spécial. Aucune ne désigne une entité de la fixture — c'est ce qui rend la
			// colonne lisible : ce qui mord, mord faute de producteur.
			const cibles = PREDICATES[id].refKinds.map((espace) => `${espace}.rien-de-tel`)
			const verdict = premiereFeuilleInaccomplissable(dossier, { op: 'predicat', predicat: id, cibles })
			expect(`${id} → ${verdict === null ? 'non-evaluee-a-it9' : 'mord'}`).toBe(`${id} → ${DECISION[id]}`)
		}
	})

	it('le producteur d un objet est le VERBE donne, jamais son espace de noms', () => {
		const dossier = clone()
		const POSSEDE: ExprNode = { op: 'predicat', predicat: 'possede_objet', cibles: ['objet.clef-de-basalte'] }

		// (a) la récompense de la quête DONNE cet objet → accomplissable.
		expect(premiereFeuilleInaccomplissable(dossier, POSSEDE)).toBeNull()

		// (b) UN SEUL champ muté : le VERBE de cette récompense passe de « donne » à
		// « retire ». Le `refKinds` ne bouge pas — c'est le même espace de noms
		// `objet` —, si bien qu'une productibilité dérivée de l'espace resterait VERTE
		// ici, en comptant une SOUSTRACTION comme un don.
		dossier.monde.quetes[0].recompense = [{ delta: 'retirer_objet', cibles: ['objet.clef-de-basalte'] }]
		expect(premiereFeuilleInaccomplissable(dossier, POSSEDE)).toEqual({
			predicat: LIBELLE_POSSEDE,
			cibles: ['objet.clef-de-basalte'],
		})

		// LE TROU EST RÉEL, PAS HYPOTHÉTIQUE, et il se lit dans le registre : DEUX
		// verbes portent l'espace `objet` aujourd'hui, un positif et un négatif. La
		// liste se dérive de `DELTAS`, jamais de la mémoire — même geste que G2.
		expect(
			Object.entries(DELTAS)
				.filter(([, descripteur]) => descripteur.refKinds.includes('objet'))
				.map(([id]) => id),
		).toEqual(['donner_objet', 'retirer_objet'])

		// ET LE VERBE N'EST NOMMÉ QU'À UN SEUL ENDROIT du module, comme l'est déjà
		// celui qui produit un indice : deux sites dériveraient. La marque est
		// construite par morceaux pour que la présence de ce test ne suffise pas à
		// faire passer le balayage ; les fichiers de test sont exclus, puisqu'ils
		// PLANTENT des effets sans jamais les filtrer.
		const MARQUE = ["'", 'donner_objet', "'"].join('')
		const porteurs = fs
			.readdirSync(__dirname)
			.filter((fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.test.ts'))
			.filter((fichier) => fs.readFileSync(path.join(__dirname, fichier), 'utf8').includes(MARQUE))

		expect(porteurs).toEqual(['atteignabilite.ts'])
	})

	it('pnj_a_revele s evalue par PAIRE, jamais en deux feuilles independantes', () => {
		const dossier = clone()
		const PAIRE: ExprNode = {
			op: 'predicat',
			predicat: 'pnj_a_revele',
			cibles: ['pnj.aldur-le-sage', 'indice.cendres-tiedes'],
		}

		// LES DEUX MOITIÉS DU MUTANT SONT VRAIES, ET C'EST MESURÉ ICI : le personnage
		// existe, et l'indice a bien un producteur. Une implémentation qui évaluerait
		// « ce personnage existe » ET « cet indice a un producteur » comme deux
		// feuilles INDÉPENDANTES conclurait donc « productible », alors qu'aucun
		// savoir ne les relie (H3). Sans ces deux lignes, l'assertion d'après serait
		// verte pour une raison qu'on ne saurait pas nommer.
		expect(dossier.monde.personnages.some((personnage) => personnage.id === 'pnj.aldur-le-sage')).toBe(true)
		expect(producteursParIndice(dossier).get('indice.cendres-tiedes')?.retenues.length).toBe(1)

		expect(premiereFeuilleInaccomplissable(dossier, PAIRE)).toEqual({
			predicat: LIBELLE_PAIRE,
			cibles: ['pnj.aldur-le-sage', 'indice.cendres-tiedes'],
		})

		// DISCRIMINANT, DANS LE MÊME TEST : le savoir de l'unique personnage repointé
		// sur cet indice — UN SEUL champ. La paire est alors portée, et la condition
		// devient accomplissable. Sans cette moitié, l'assertion ci-dessus resterait
		// verte sous une ligne qui rendrait TOUJOURS faux.
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.cendres-tiedes'
		expect(premiereFeuilleInaccomplissable(dossier, PAIRE)).toBeNull()
	})

	it('pnj_a_revele lit la MEME porte que le compte, jamais un savoir compte a part', () => {
		const dossier = clone()
		// LE LIEN EXISTE ET LA PORTE EST MORTE — c'est le seul état qui sépare it9
		// d'it7, et il n'était prouvé NULLE PART : jusqu'ici la paire se contentait
		// qu'un savoir relie le personnage à l'indice, sans jamais regarder à quelle
		// condition ce savoir se révèle. Le même savoir comptait alors ZÉRO producteur
		// pour l'indice et ÉTABLISSAIT la paire : deux lectures du même fait.
		dossier.monde.indices = [{ id: 'indice.mirage' }, { id: 'indice.confie' }]
		dossier.monde.personnages[0].savoirs = [
			{ indice_id: 'indice.confie', certitude: 'sait', revele_si: { apres_indice_id: 'indice.mirage' } },
		]
		// L'effet du jalon visait `sceau-brise`, absent de la nouvelle collection :
		// rien ne produit `mirage`, donc la porte est fermée.
		const PAIRE: ExprNode = {
			op: 'predicat',
			predicat: 'pnj_a_revele',
			cibles: ['pnj.aldur-le-sage', 'indice.confie'],
		}

		// LES DEUX MOITIÉS DU LIEN SONT VRAIES, ET C'EST MESURÉ ICI : le personnage
		// existe, et un savoir à LUI porte bien cet indice. Sans ces deux lignes,
		// l'assertion d'après serait verte pour la raison d'it7 — « aucun savoir ne les
		// relie » — au lieu de la raison d'it9.
		expect(dossier.monde.personnages.some((personnage) => personnage.id === 'pnj.aldur-le-sage')).toBe(true)
		expect(dossier.monde.personnages[0].savoirs.map((candidat) => candidat.indice_id)).toEqual(['indice.confie'])

		expect(premiereFeuilleInaccomplissable(dossier, PAIRE)).toEqual({
			predicat: LIBELLE_PAIRE,
			cibles: ['pnj.aldur-le-sage', 'indice.confie'],
		})

		// DISCRIMINANT, DANS LE MÊME TEST : `mirage` racinée par l'effet du jalon — UN
		// SEUL champ —, la porte s'ouvre et la paire redevient établissable. Sans cette
		// moitié, le verdict ci-dessus serait vert sous une ligne qui rendrait TOUJOURS
		// faux.
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: ['indice.mirage'] }]
		expect(premiereFeuilleInaccomplissable(dossier, PAIRE)).toBeNull()
	})

	it('indice_connu lit le compte SATURE, jamais un second parcours des producteurs', () => {
		const dossier = clone()
		const CONNU: ExprNode = { op: 'predicat', predicat: 'indice_connu', cibles: ['indice.boucle-a'] }

		// UN SEUL champ muté : la collection d'indices devient un cycle que RIEN ne
		// racine. Les savoirs et les effets du clone continuent de pointer des indices
		// qui n'y sont plus, donc ils ne contribuent à aucun des deux.
		dossier.monde.indices = [
			{ id: 'indice.boucle-a', mene_a: ['indice.boucle-b'] },
			{ id: 'indice.boucle-b', mene_a: ['indice.boucle-a'] },
		]

		// CE QUE LA SATURATION ACHÈTE ICI : une lecture À PLAT compterait l'arête
		// entrante de l'autre — UN producteur — et déclarerait la condition
		// accomplissable. Aucune des deux arêtes ne remonte à un personnage ni à un
		// effet : la condition ne peut pas s'accomplir.
		expect(premiereFeuilleInaccomplissable(dossier, CONNU)).toEqual({
			predicat: LIBELLE_CONNU,
			cibles: ['indice.boucle-a'],
		})

		// DISCRIMINANT, DANS LE MÊME TEST : le savoir de l'unique personnage repointé
		// sur le PREMIER maillon — UN SEUL champ de plus. Il devient une racine, et la
		// condition redevient accomplissable. C'est la MÊME carte que celle des trois
		// seuils, réutilisée telle quelle, jamais recomptée.
		dossier.monde.personnages[0].savoirs[0].indice_id = 'indice.boucle-a'
		expect(premiereFeuilleInaccomplissable(dossier, CONNU)).toBeNull()
	})
})
