import fs from 'node:fs'
import path from 'node:path'
import { executerCommande } from './commandes'
import { DELTAS } from './deltas'
import {
	appliquerDelta,
	etapeDeclenchee,
	evaluerExpr,
	evenementARencontrer,
	evenementDeClimat,
	finAtteinte,
	projeterJalonsAtteints,
	resoudreJalons,
} from './evaluate'
import type { ExprNode } from './expr'
import type { FaitsDeSession } from './faits'
import { PREDICATES } from './predicates'
import { ouvrirSession, type EtatSession } from './session'
import type { Dossier, Evenement, Jalon, PlanAction } from './types'

/**
 * L'ÉVALUATEUR BIVALENT, LES EFFETS, ET LA PASSE DES JALONS.
 *
 * LES DOSSIERS SONT LUS DU DISQUE (KR-156) puis MUTÉS EN TEST quand le scénario
 * exige un état qu'aucune fixture partagée ne porte — jamais l'inverse : muter la
 * fixture du disque pour arranger un témoin ferait payer treize autres suites.
 *
 * LES SESSIONS SONT OUVERTES PAR `ouvrirSession` partout où c'est possible : une
 * session forgée à la main prouverait le comportement sur un état que le produit
 * ne sait peut-être pas atteindre.
 *
 * ⚠ CE FICHIER EST HORS DU SCORE DE MUTATION (KR-243) : `stryker.config.mjs` est
 * borné aux quatre fichiers d'arithmétique de règles, et l'évaluateur, les deltas
 * et la passe n'en sont pas, alors qu'ils portent une logique de signe. `jest` est
 * leur UNIQUE instrument, et les quatre mutants nommés ci-dessous ont été écrits,
 * VUS ROUGES, puis révoqués — à la main, faute d'outil.
 */

const MODULE_DOSSIER = __dirname
const CHEMIN_REFERENCE = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(MODULE_DOSSIER, '__fixtures__', 'dossier-minimal.json')

/** Le clone d'une fixture, LU DU DISQUE à chaque appel — jamais muté en place. */
function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

/**
 * LES SOURCES BALAYÉES, fins de ligne NORMALISÉES — l'arbre de travail est en
 * CRLF et `prettier` écrit en LF ; une garde qui dépendrait de l'une ou de l'autre
 * rougirait après un simple `git checkout`.
 */
function source(nom: string): string {
	return fs.readFileSync(path.join(MODULE_DOSSIER, nom), 'utf8').replace(/\r\n/g, '\n')
}

/**
 * La source PRIVÉE DE SES COMMENTAIRES **ET DE SES CHAÎNES** — même fonction que
 * `deltas.test.ts`, plus l'effacement des littéraux textuels. Sans le second, les
 * deux balayages ci-dessous seraient rouges sur de la PROSE et sur des CHEMINS :
 * `'charpente.jalons'` est une clé de `tables.ts`, et une règle qui interdirait
 * d'écrire un nom interdirait aussi de le déclarer comme chemin.
 */
function sansCommentaires(texte: string): string {
	return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

function enPositionDeCode(texte: string): string {
	return sansCommentaires(texte)
		.replace(/'[^'\n]*'/g, "''")
		.replace(/"[^"\n]*"/g, '""')
		.replace(/`[^`]*`/gs, '``')
}

function fichiersDuModule(): string[] {
	return fs
		.readdirSync(MODULE_DOSSIER)
		.filter((nom) => nom.endsWith('.ts'))
		.filter((nom) => !nom.endsWith('.test.ts'))
		.sort()
}

/** Les faits d'ouverture d'un dossier — le chemin du produit, jamais un littéral. */
function ouverture(dossier: Dossier): FaitsDeSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session.monde
}

/** La feuille d'un prédicat, ses cibles données telles quelles. */
function feuille(predicat: keyof typeof PREDICATES, ...cibles: string[]): ExprNode {
	return { op: 'predicat', predicat, cibles }
}

function nier(noeud: ExprNode): ExprNode {
	return { op: 'non', enfant: noeud }
}

/** La ligne nommée d'un effet journalisé : un échec dit LEQUEL a bougé. */
function lignesDe(deltas: readonly { delta: string; cibles: readonly string[]; effet: string }[]): string[] {
	return deltas.map((journalise) => `${journalise.delta}(${journalise.cibles.join(', ')}) → ${journalise.effet}`)
}

describe('evaluerExpr, la bivalence et sa frontiere', () => {
	it('leve sur une entree non reconnue, NUE et sous une negation', () => {
		// CRITÈRE 1 — KR-238. LE NŒUD EST FABRIQUÉ, ET AUCUNE FIXTURE NE LE PORTE : le
		// dépôt n'a que trois `fins[].condition_expr`, toutes des `et` à conjoint faux,
		// et le mutant `default: return false` y SURVIT VERT (mesuré au raffinage). Un
		// témoin bâti sur elles n'aurait rien prouvé.
		//
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : remplacer `return jamaisEvalue(noeud)`
		// par `return false` dans `evaluate.ts`. Sous cette mutation, la position NUE
		// rend `false` (l'assertion (a) rougit) et la position NIÉE rend **`true`** —
		// c'est-à-dire un FAUX POSITIF sur une condition de fin, la seule direction
		// d'erreur que cette couche s'interdise.
		const faits = ouverture(lire(CHEMIN_REFERENCE))
		const inconnu = { op: 'xor' } as unknown as ExprNode

		// (a) NU.
		expect(() => evaluerExpr(faits, inconnu)).toThrow()
		// (b) SOUS UN `non` — la moitié qui compte : c'est là que le repli en `false`
		// devient une affirmation.
		expect(() => evaluerExpr(faits, nier(inconnu))).toThrow()
		// (c) ET ENFOUI SOUS UN CONNECTEUR : `et`/`ou` court-circuitent, donc le nœud
		// fautif doit être ATTEIGNABLE pour que la levée se produise.
		expect(() =>
			evaluerExpr(faits, { op: 'ou', enfants: [feuille('lieu_courant_est', 'lieu.jamais-vu'), inconnu] }),
		).toThrow()

		// DISCRIMINANCE (KR-199) : elle ne lève pas sur tout — les quatre opérateurs
		// réels répondent, et les deux valeurs de vérité sont représentées. Sans ces
		// lignes, les trois ci-dessus seraient vertes sur une fonction qui lève toujours.
		const ici = feuille('lieu_courant_est', faits.lieu_courant)
		expect(evaluerExpr(faits, ici)).toBe(true)
		expect(evaluerExpr(faits, nier(ici))).toBe(false)
		expect(evaluerExpr(faits, { op: 'et', enfants: [ici, nier(nier(ici))] })).toBe(true)
		expect(evaluerExpr(faits, { op: 'ou', enfants: [nier(ici), ici] })).toBe(true)
	})

	it('chaque predicat du registre repond, et aucune lecture ne leve sur une cle heritee', () => {
		// LES SEPT SONT BALAYÉS DEPUIS LE REGISTRE, jamais sept littéraux (KR-117/199) :
		// une huitième entrée entre dans ce témoin sans qu'on y pense.
		const faits: FaitsDeSession = {
			lieu_courant: 'lieu.foyer-du-guet',
			lieux_visites: ['lieu.foyer-du-guet'],
			objets_possedes: ['objet.sceau-de-cendre'],
			indices_connus: ['indice.pas-dans-la-cendre'],
			jalons_atteints: ['jalon.premiere-vigie'],
			evenements_consommes: ['evenement.embuscade-de-la-tour'],
			pnj: { 'pnj.corvin-le-marchand': { a_dit: ['indice.lettre-de-la-vigie'] } },
		}
		const VRAIES: Record<keyof typeof PREDICATES, string[]> = {
			possede_objet: ['objet.sceau-de-cendre'],
			indice_connu: ['indice.pas-dans-la-cendre'],
			jalon_atteint: ['jalon.premiere-vigie'],
			lieu_visite: ['lieu.foyer-du-guet'],
			lieu_courant_est: ['lieu.foyer-du-guet'],
			evenement_consomme: ['evenement.embuscade-de-la-tour'],
			pnj_a_revele: ['pnj.corvin-le-marchand', 'indice.lettre-de-la-vigie'],
		}

		for (const predicat of Object.keys(PREDICATES) as (keyof typeof PREDICATES)[]) {
			expect(`${predicat} → ${evaluerExpr(faits, feuille(predicat, ...VRAIES[predicat]))}`).toBe(`${predicat} → true`)
			// Et elle sait rendre FAUX : sans cette ligne, une lecture qui rendrait
			// toujours `true` passerait celle du dessus.
			const ailleurs = VRAIES[predicat].map((cible) => `${cible.split('.')[0]}.jamais-vu`)
			expect(`${predicat} → ${evaluerExpr(faits, feuille(predicat, ...ailleurs))}`).toBe(`${predicat} → false`)
		}

		// KR-175 / BUG-053 : `faits.pnj['toString']` rend une FONCTION, dont `.a_dit`
		// vaut `undefined` — une indexation nue lèverait ici, et `lit` ne LÈVE JAMAIS.
		for (const heritee of ['toString', 'constructor', '__proto__', 'hasOwnProperty', 'valueOf']) {
			expect(() => evaluerExpr(faits, feuille('pnj_a_revele', heritee, 'indice.lettre-de-la-vigie'))).not.toThrow()
			expect(evaluerExpr(faits, feuille('pnj_a_revele', heritee, 'indice.lettre-de-la-vigie'))).toBe(false)
		}
	})
})

describe('appliquerDelta, le journal du demande et de l observe', () => {
	it('effet est DERIVE par identite de reference, et les deux valeurs sont exercees', () => {
		// KR-247 : sans `effet`, « pas demandé » et « demandé sans effet » seraient
		// indistinguables. Et il est MESURÉ, jamais déclaré — le descripteur rend la
		// MÊME RÉFÉRENCE quand rien ne change, et `===` le constate.
		const faits = ouverture(lire(CHEMIN_REFERENCE))

		const premier = appliquerDelta(faits, { delta: 'reveler_indice', cibles: ['indice.pas-dans-la-cendre'] })
		expect(premier.journalise.effet).toBe('applique')
		expect(premier.faits).not.toBe(faits)
		expect(premier.faits.indices_connus).toEqual(['indice.pas-dans-la-cendre'])
		// LES FAITS D'ENTRÉE SONT INTACTS — la fonction est pure, elle ne mute rien.
		expect(faits.indices_connus).toEqual([])

		const second = appliquerDelta(premier.faits, { delta: 'reveler_indice', cibles: ['indice.pas-dans-la-cendre'] })
		expect(second.journalise.effet).toBe('sans_effet')
		// LA MÊME RÉFÉRENCE, et c'est ce qui rend le constat mécanique.
		expect(second.faits).toBe(premier.faits)
		expect(second.faits.indices_connus).toEqual(['indice.pas-dans-la-cendre'])
	})

	it('les quatre effets du registre ecrivent leur champ, et rendent la MEME reference a vide', () => {
		// BALAYÉ DEPUIS `DELTAS` (KR-117/199) : un cinquième effet entre ici sans qu'on
		// y pense. Le second appel de chaque couple est celui qui compte — c'est lui qui
		// tient la propriété « même référence quand rien ne change », dont dépend tout
		// le reste du journal.
		const base = ouverture(lire(CHEMIN_REFERENCE))
		const CIBLES: Record<keyof typeof DELTAS, string[]> = {
			donner_objet: ['objet.sceau-de-cendre'],
			retirer_objet: ['objet.sceau-de-cendre'],
			reveler_indice: ['indice.pas-dans-la-cendre'],
			atteindre_jalon: ['jalon.premiere-vigie'],
		}

		for (const delta of Object.keys(DELTAS) as (keyof typeof DELTAS)[]) {
			const premier = appliquerDelta(base, { delta, cibles: CIBLES[delta] })
			const second = appliquerDelta(premier.faits, { delta, cibles: CIBLES[delta] })
			expect(`${delta} → ${premier.journalise.effet} puis ${second.journalise.effet}`).toBe(
				// `retirer_objet` sur un inventaire VIDE ne change rien DÈS le premier
				// appel : la règle de référence vaut dans les deux sens.
				delta === 'retirer_objet' ? `${delta} → sans_effet puis sans_effet` : `${delta} → applique puis sans_effet`,
			)
			expect(`${delta} → ${second.faits === premier.faits}`).toBe(`${delta} → true`)
		}

		// LE RETRAIT SAIT RETIRER, sinon la ligne `retirer_objet` ci-dessus serait
		// verte sur un descripteur qui ne fait rien du tout.
		const avecObjet = appliquerDelta(base, { delta: 'donner_objet', cibles: ['objet.sceau-de-cendre'] })
		const retire = appliquerDelta(avecObjet.faits, { delta: 'retirer_objet', cibles: ['objet.sceau-de-cendre'] })
		expect(retire.journalise.effet).toBe('applique')
		expect(retire.faits.objets_possedes).toEqual([])
	})

	it('cibles est COPIEE — le journal est un constat, pas une vue sur le dossier', () => {
		// KR-248 : le journal ne partage aucun tableau avec le document dont il vient.
		// Sans cette copie, geler ou muter le dossier changerait un constat déjà écrit.
		const demande = { delta: 'reveler_indice' as const, cibles: ['indice.pas-dans-la-cendre'] }
		const journalise = appliquerDelta(ouverture(lire(CHEMIN_REFERENCE)), demande).journalise

		expect(journalise.cibles).toEqual(demande.cibles)
		expect(journalise.cibles).not.toBe(demande.cibles)
	})
})

describe('resoudreJalons, le point fixe', () => {
	/** Le clone de référence, ses jalons REMPLACÉS — un seul champ muté, en test. */
	function avecJalons(jalons: Jalon[]): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		dossier.charpente.jalons = jalons
		return dossier
	}

	/** Un jalon fabriqué : ses deux proses ne sont jamais lues par le moteur. */
	function jalon(id: string, declencheur: ExprNode | undefined, effet: Jalon['effet']): Jalon {
		return {
			id,
			enonce_texte: `Énoncé de ${id}.`,
			declencheur_texte: `Déclencheur de ${id}.`,
			...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
			effet,
		}
	}

	it('idempotence : deux jalons, le MEME indice, une seule revelation', () => {
		// CRITÈRE 2 — KR-247/248, et le SCÉNARIO SÉPARATEUR EST OBLIGATOIRE : un jalon
		// déjà atteint n'est JAMAIS réévalué, donc « le même effet demandé deux fois »
		// est MÉCANIQUEMENT INATTEIGNABLE avec un seul porteur (BUG-113). Il faut DEUX
		// jalons distincts, résolus dans la MÊME passe.
		//
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : `reveler_indice` en spread
		// INCONDITIONNEL (`{ ...faits, indices_connus: [...liste, id] }` sans le test
		// d'appartenance). Il rougit sous les DEUX mécanismes à la fois — le second
		// `effet` passe à `'applique'`, et `indices_connus` porte un doublon.
		const INDICE = 'indice.pas-dans-la-cendre'
		const dossier = avecJalons([
			jalon('jalon.premiere-vigie', feuille('lieu_visite', 'lieu.foyer-du-guet'), [
				{ delta: 'reveler_indice', cibles: [INDICE] },
			]),
			jalon('jalon.second-guet', feuille('lieu_visite', 'lieu.foyer-du-guet'), [
				{ delta: 'reveler_indice', cibles: [INDICE] },
			]),
		])

		const resolution = resoudreJalons(dossier, ouverture(avecJalons([])))

		// LA PASSE : deux jalons atteints, DANS L'ORDRE DU DOCUMENT, et chacun porte sa
		// marque AVANT son effet — l'ordre CAUSAL, celui que les pastilles rendent.
		expect(resolution.atteints.map((atteint) => atteint.jalon_id)).toEqual([
			'jalon.premiere-vigie',
			'jalon.second-guet',
		])
		expect(lignesDe(resolution.atteints[0].deltas)).toEqual([
			'atteindre_jalon(jalon.premiere-vigie) → applique',
			`reveler_indice(${INDICE}) → applique`,
		])
		// LE SECOND DEMANDE LE MÊME INDICE, ET L'OBSERVE SANS EFFET.
		expect(lignesDe(resolution.atteints[1].deltas)).toEqual([
			'atteindre_jalon(jalon.second-guet) → applique',
			`reveler_indice(${INDICE}) → sans_effet`,
		])

		// ET L'ÉTAT EST SANS DOUBLON — la seconde moitié du mutant.
		expect(resolution.faits.indices_connus).toEqual([INDICE])
		expect(resolution.faits.jalons_atteints).toEqual(['jalon.premiere-vigie', 'jalon.second-guet'])
	})

	it('point fixe : une chaine en ordre INVERSE se resout, quel que soit l ordre d ecriture', () => {
		// CRITÈRE 7 — famille BUG-087. Le jalon écrit EN PREMIER n'est déclenchable que
		// par l'effet du SECOND : une passe unique en ordre de document le rate, et reste
		// VERTE sur le dossier écrit dans l'autre sens.
		//
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : remplacer la boucle bornée par UNE
		// SEULE passe (`for (const jalon of jalons)` sans reboucle). L'ordre INVERSE
		// rougit, l'ordre DIRECT reste vert — c'est exactement ce qui rend le second
		// témoin obligatoire.
		const AMONT = jalon('jalon.second-guet', feuille('lieu_visite', 'lieu.foyer-du-guet'), [])
		const AVAL = jalon('jalon.premiere-vigie', feuille('jalon_atteint', 'jalon.second-guet'), [])

		for (const [ordre, jalons] of [
			['inverse', [AVAL, AMONT]],
			['direct', [AMONT, AVAL]],
		] as const) {
			const resolution = resoudreJalons(avecJalons([...jalons]), ouverture(avecJalons([])))
			expect(`${ordre} → ${[...resolution.faits.jalons_atteints].sort().join(', ')}`).toBe(
				`${ordre} → jalon.premiere-vigie, jalon.second-guet`,
			)
			// L'ORDRE DES `atteints` EST L'ORDRE CAUSAL, jamais celui du document : c'est
			// lui que le journal rendra, ligne après ligne.
			expect(`${ordre} → ${resolution.atteints.map((atteint) => atteint.jalon_id).join(' puis ')}`).toBe(
				`${ordre} → jalon.second-guet puis jalon.premiere-vigie`,
			)
		}
	})

	it('un jalon sans declencheur_expr n est jamais atteint, et un jalon deja atteint n est pas reevalue', () => {
		// LES DEUX CAS LIMITES, DANS LE MÊME TEST. Un jalon sans condition structurée est
		// un état CALME (`types.ts`) : un moteur d'événement le cochera.
		const dossier = avecJalons([
			jalon('jalon.premiere-vigie', undefined, [{ delta: 'reveler_indice', cibles: ['indice.trace-du-guet'] }]),
			jalon('jalon.second-guet', feuille('lieu_visite', 'lieu.foyer-du-guet'), []),
		])

		const premiere = resoudreJalons(dossier, ouverture(avecJalons([])))
		expect(premiere.faits.jalons_atteints).toEqual(['jalon.second-guet'])
		// SON EFFET N'A PAS PARTI NON PLUS — sans cette ligne, « jamais atteint » serait
		// vrai du marqueur sans l'être de la conséquence.
		expect(premiere.faits.indices_connus).toEqual([])

		// REJOUÉE SUR SON PROPRE RÉSULTAT : rien ne bouge, et `atteints` est VIDE — le
		// jalon déjà atteint n'est pas réévalué, donc il ne produit aucune seconde ligne
		// de journal. C'est la terminaison, observée plutôt que promise.
		const seconde = resoudreJalons(dossier, premiere.faits)
		expect(seconde.atteints).toEqual([])
		expect(seconde.faits).toBe(premiere.faits)
	})

	it('un effet vide ne produit que la marque du jalon', () => {
		// `effet: []` — le cas limite que la fixture de référence porte déjà sur
		// `jalon.second-guet`. La ligne de journal existe quand même : c'est le jalon
		// qui est l'événement, pas ses conséquences.
		const dossier = avecJalons([jalon('jalon.second-guet', feuille('lieu_visite', 'lieu.foyer-du-guet'), [])])
		const resolution = resoudreJalons(dossier, ouverture(avecJalons([])))

		expect(lignesDe(resolution.atteints[0].deltas)).toEqual(['atteindre_jalon(jalon.second-guet) → applique'])
	})

	it('elle est PURE — les faits d entree sont intacts, et le dossier aussi', () => {
		// KR-169 : « pure » est écrit au contrat, voici sa porte.
		const dossier = lire(CHEMIN_MINIMAL)
		const avantDossier = JSON.stringify(dossier)
		// `CHEMIN_REFERENCE` : son ouverture n'atteint AUCUN jalon — c'est ce qui rend les
		// deux `toEqual([])` du bas discriminants plutôt que tautologiques.
		const faits = ouverture(lire(CHEMIN_REFERENCE))

		resoudreJalons(dossier, faits)

		expect(JSON.stringify(dossier)).toBe(avantDossier)
		expect(faits.jalons_atteints).toEqual([])
		expect(faits.indices_connus).toEqual([])
	})
})

describe('projeterJalonsAtteints, ce qu un modele pourra voir', () => {
	it('ne porte que jalon_id et enonce, DANS L ORDRE DE LA PARTIE', () => {
		// KR-246. MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ :
		// `dossier.charpente.jalons.filter((jalon) => faits.jalons_atteints.includes(jalon.id))`.
		// Il rougit sur l'ORDRE — le filtre rend l'ordre du DOCUMENT, la projection doit
		// rendre celui où la partie les a atteints —, et il ferait disparaître en
		// silence tout handle que le dossier ne porte plus (voir le témoin suivant).
		const dossier = lire(CHEMIN_REFERENCE)
		const faits: FaitsDeSession = {
			...ouverture(dossier),
			jalons_atteints: ['jalon.second-guet', 'jalon.premiere-vigie'],
		}

		// L'ORDRE DU DOCUMENT EST L'INVERSE — asserté, pas supposé : si la fixture
		// changeait d'ordre, ce témoin rougirait avant de cesser de mesurer.
		expect(dossier.charpente.jalons.map((jalon) => jalon.id)).toEqual(['jalon.premiere-vigie', 'jalon.second-guet'])

		const projection = projeterJalonsAtteints(dossier, faits)

		expect(projection.map((atteint) => atteint.jalon_id)).toEqual(['jalon.second-guet', 'jalon.premiere-vigie'])
		expect(projection.map((atteint) => atteint.enonce)).toEqual(
			['jalon.second-guet', 'jalon.premiere-vigie'].map(
				(id) => dossier.charpente.jalons.find((jalon) => jalon.id === id)?.enonce_texte,
			),
		)

		// DEUX CLÉS, ET DEUX SEULEMENT — garde PAR VALEUR et non par forme (KR-246) :
		// un `Pick<Jalon, …>` se ré-élargit d'un mot en revue.
		for (const atteint of projection) {
			expect(Object.keys(atteint).sort()).toEqual(['enonce', 'jalon_id'])
		}

		// ET LA SÉRIALISATION NE PORTE AUCUNE SOUS-CHAÎNE DES DEUX PROSES QUI NE SORTENT
		// PAS : `declencheur_texte` est d'audience `auteur`, `nom` aussi. L'échec nomme
		// la prose fautive, jamais un booléen.
		const serialisee = JSON.stringify(projection)
		for (const jalon of dossier.charpente.jalons) {
			for (const [champ, prose] of [
				['declencheur_texte', jalon.declencheur_texte],
				['nom', jalon.nom ?? ''],
			] as const) {
				if (prose === '') continue
				expect(`${jalon.id} · ${champ} → ${serialisee.includes(prose.slice(0, 24))}`).toBe(
					`${jalon.id} · ${champ} → false`,
				)
			}
		}
	})

	it('un handle PENDANT est EXPOSE, jamais filtre', () => {
		// KR-021 : une référence orpheline se signale, elle ne disparaît pas. L'auteur a
		// pu supprimer un jalon entre deux aperçus ; une projection qui le tairait
		// rendrait le trou invisible à l'assembleur de la n° 10, qui décidera quoi en
		// faire. La ligne existe, son `enonce` est VIDE — aucune prose n'est inventée.
		const dossier = lire(CHEMIN_REFERENCE)
		const faits: FaitsDeSession = {
			...ouverture(dossier),
			jalons_atteints: ['jalon.disparu-du-dossier', 'jalon.premiere-vigie'],
		}

		expect(projeterJalonsAtteints(dossier, faits)).toEqual([
			{ jalon_id: 'jalon.disparu-du-dossier', enonce: '' },
			{ jalon_id: 'jalon.premiere-vigie', enonce: dossier.charpente.jalons[0].enonce_texte },
		])
	})
})

describe('evenementARencontrer, la rencontre due (n 13 moteur-combat, it1, lot contrat)', () => {
	/** Les deux événements-monstres des fixtures du disque (KR-156) — lus, jamais recopiés. */
	const EVENEMENT_REFERENCE = 'evenement.embuscade-a-la-tour'
	const MONSTRE_REFERENCE = 'bestiaire.squelette'
	const EVENEMENT_MINIMAL = 'evenement.embuscade-du-fanal'
	const MONSTRE_MINIMAL = 'bestiaire.gobelin'

	/** Le lieu de départ du dossier de référence — vrai à l'ouverture, donc une condition « toujours vraie ». */
	const ICI = feuille('lieu_courant_est', 'lieu.foyer-du-guet')
	const AILLEURS = feuille('lieu_courant_est', 'lieu.jamais-vu')

	/** Un événement FABRIQUÉ : ses proses ne sont jamais lues par le moteur. */
	function evenement(id: string, monstre: string | undefined, declencheur: ExprNode | undefined): Evenement {
		return {
			id,
			nom: `Nom de ${id}`,
			...(monstre === undefined ? {} : { monstre_ref: monstre }),
			...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
			resolutions: [],
		}
	}

	/** Le dossier de référence, ses événements REMPLACÉS — un seul champ muté, en test. */
	function avecEvenements(evenements: Evenement[]): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		dossier.monde.evenements = evenements
		return dossier
	}

	function ouverte(dossier: Dossier): EtatSession {
		const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
		return resultat.session
	}

	/** Le pas qui amène le héros à la tour effondrée — par le PRODUIT, jamais une session forgée. */
	function aLaTour(dossier: Dossier, depart: EtatSession): EtatSession {
		const resultat = executerCommande(dossier, depart, { commande: 'aller', cibles: ['lieu.tour-effondree'] })
		if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
		return resultat.session
	}

	/** Le même état, ses événements consommés POSÉS — une seule feuille de `monde` change. */
	function avecConsommes(session: EtatSession, consommes: string[]): EtatSession {
		return { ...session, monde: { ...session.monde, evenements_consommes: consommes } }
	}

	it('rend le premier evenement a monstre_ref, au bon lieu, non consomme — et RIEN avant d y etre', () => {
		// CRITÈRE 1 du plan — LES DEUX FIXTURES DU DISQUE, parce que les deux prédicats
		// de lieu y sont écrits : `lieu_visite` (référence) et `lieu_courant_est`
		// (minimal). L'état séparateur est le LIEU : la même session, avant et après le
		// pas qui l'amène à la tour.
		const reference = lire(CHEMIN_REFERENCE)
		expect(reference.monde.evenements[0].id).toBe(EVENEMENT_REFERENCE)
		expect(reference.monde.evenements[0].monstre_ref).toBe(MONSTRE_REFERENCE)

		const depart = ouverte(reference)
		expect(evenementARencontrer(reference, depart)).toBeUndefined()

		const rencontre = evenementARencontrer(reference, aLaTour(reference, depart))
		expect(rencontre).toEqual({ evenement_id: EVENEMENT_REFERENCE, monstre_ref: MONSTRE_REFERENCE })
		// DEUX CLÉS, ET DEUX SEULEMENT — garde PAR VALEUR (KR-246) : ni `nom` ni
		// `declencheur_texte` (audience `auteur`), ni `resolutions[]`, ne sortent.
		expect(Object.keys(rencontre ?? {}).sort()).toEqual(['evenement_id', 'monstre_ref'])

		// LE MINIMAL : le héros ouvre au lieu de la condition — la rencontre est due
		// DÈS L'OUVERTURE, sans aucun pas.
		const minimal = lire(CHEMIN_MINIMAL)
		expect(evenementARencontrer(minimal, ouverte(minimal))).toEqual({
			evenement_id: EVENEMENT_MINIMAL,
			monstre_ref: MONSTRE_MINIMAL,
		})
	})

	it('rend le PREMIER dans l ordre du DOSSIER, quel que soit l evenement qui est vrai en second', () => {
		// Deux événements dont la condition est vraie ensemble : l'ordre d'écriture
		// DÉCIDE, et le témoin le prouve dans les deux sens — sans la seconde ligne, un
		// moteur qui rendrait toujours `evenements[0]`, ou toujours le dernier, serait
		// vert sur l'un des deux.
		const A = evenement('evenement.a', 'bestiaire.gobelin', ICI)
		const B = evenement('evenement.b', 'bestiaire.squelette', ICI)
		const depart = ouverte(avecEvenements([]))

		for (const [ordre, evenements, attendu] of [
			['A puis B', [A, B], 'evenement.a'],
			['B puis A', [B, A], 'evenement.b'],
		] as const) {
			expect(`${ordre} → ${evenementARencontrer(avecEvenements([...evenements]), depart)?.evenement_id}`).toBe(
				`${ordre} → ${attendu}`,
			)
		}
	})

	it('saute l evenement consomme, puis rend le suivant, puis undefined quand tous le sont', () => {
		// L'événement se consomme à l'OUVERTURE du combat (`resoudreRencontre`) : c'est
		// cette liste, et elle seule, qui empêche de rouvrir le MÊME combat au pas suivant.
		const dossier = avecEvenements([
			evenement('evenement.a', 'bestiaire.gobelin', ICI),
			evenement('evenement.b', 'bestiaire.squelette', ICI),
		])
		const depart = ouverte(dossier)

		expect(evenementARencontrer(dossier, depart)?.evenement_id).toBe('evenement.a')
		expect(evenementARencontrer(dossier, avecConsommes(depart, ['evenement.a']))?.evenement_id).toBe('evenement.b')
		expect(evenementARencontrer(dossier, avecConsommes(depart, ['evenement.a', 'evenement.b']))).toBeUndefined()
		// Consommer LE SECOND ne cache pas le premier : le saut est par identifiant.
		expect(evenementARencontrer(dossier, avecConsommes(depart, ['evenement.b']))?.evenement_id).toBe('evenement.a')
	})

	it('saute l evenement dont la condition est fausse, MEME en premiere position', () => {
		const faux = evenement('evenement.faux', 'bestiaire.gobelin', AILLEURS)
		const vrai = evenement('evenement.vrai', 'bestiaire.squelette', ICI)
		const depart = ouverte(avecEvenements([]))

		expect(evenementARencontrer(avecEvenements([faux, vrai]), depart)?.evenement_id).toBe('evenement.vrai')
		expect(evenementARencontrer(avecEvenements([faux]), depart)).toBeUndefined()
	})

	it('undefined quand un combat existe — MEME avec une rencontre due (KR-295)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const arrivee = aLaTour(dossier, ouverte(dossier))
		// L'ÉTAT SÉPARATEUR : la même session, sans puis avec `combat`.
		expect(evenementARencontrer(dossier, arrivee)?.evenement_id).toBe(EVENEMENT_REFERENCE)

		for (const postures of [[], ['normale', 'defensive']] as const) {
			const enCombat: EtatSession = { ...arrivee, combat: { monstre_ref: MONSTRE_REFERENCE, postures: [...postures] } }
			// Le combat vient d'ouvrir (aucune posture) OU est avancé : l'un comme l'autre ferme.
			expect(evenementARencontrer(dossier, enCombat)).toBeUndefined()
		}
	})

	it('undefined quand l evenement n a pas de monstre_ref, meme condition vraie', () => {
		const sansMonstre = evenement('evenement.rumeur', undefined, ICI)
		const avecMonstre = evenement('evenement.embuscade', 'bestiaire.gobelin', ICI)
		const depart = ouverte(avecEvenements([]))

		expect(evenementARencontrer(avecEvenements([sansMonstre]), depart)).toBeUndefined()
		// DISCRIMINANT : le même événement avec un monstre est rendu, et un événement sans
		// monstre en tête ne cache pas celui qui suit.
		expect(evenementARencontrer(avecEvenements([avecMonstre]), depart)?.evenement_id).toBe('evenement.embuscade')
		expect(evenementARencontrer(avecEvenements([sansMonstre, avecMonstre]), depart)?.evenement_id).toBe(
			'evenement.embuscade',
		)
	})

	it('undefined quand l evenement n a pas de declencheur_expr — jamais declenche automatiquement', () => {
		// Un événement SANS condition formalisée est un état calme (`types.ts`), jamais
		// une alerte : seule la main du narrateur le joue. Même règle que les jalons.
		const sansCondition = evenement('evenement.a-la-main', 'bestiaire.gobelin', undefined)
		const avecCondition = evenement('evenement.auto', 'bestiaire.gobelin', ICI)
		const depart = ouverte(avecEvenements([]))

		expect(evenementARencontrer(avecEvenements([sansCondition]), depart)).toBeUndefined()
		expect(evenementARencontrer(avecEvenements([avecCondition]), depart)?.evenement_id).toBe('evenement.auto')

		// ET SUR L'ÉVÉNEMENT DU DISQUE : la condition retirée, la rencontre due disparaît.
		const dossier = lire(CHEMIN_REFERENCE)
		const arrivee = aLaTour(dossier, ouverte(dossier))
		expect(evenementARencontrer(dossier, arrivee)).toBeDefined()
		delete dossier.monde.evenements[0].declencheur_expr
		expect(evenementARencontrer(dossier, arrivee)).toBeUndefined()
	})

	it('ne resout PAS le monstre : une reference pendante est rendue telle quelle, jamais filtree', () => {
		// KR-021 : la référence orpheline est EXPOSÉE. Résoudre contre le bestiaire est
		// l'affaire de `monstreDeLaReference`, que le rejeu appelle ; `validateDossier`
		// l'a déjà refusée à l'import. Filtrer ici ferait disparaître la rencontre en
		// silence, sans que rien ne dise pourquoi le combat ne s'ouvre jamais.
		const dossier = avecEvenements([evenement('evenement.pendant', 'bestiaire.griffon-des-cendres', ICI)])

		expect(evenementARencontrer(dossier, ouverte(dossier))).toEqual({
			evenement_id: 'evenement.pendant',
			monstre_ref: 'bestiaire.griffon-des-cendres',
		})
	})

	it('leve sur une condition non reconnue, NUE et sous une negation — jamais un faux positif (KR-238)', () => {
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : envelopper l'appel d'`evaluerExpr` d'un
		// `try/catch` qui rend `false`. Sous un `non`, ce repli produit `true` — un combat
		// OUVERT à tort, la seule direction d'erreur que cette couche s'interdise.
		const inconnu = { op: 'xor' } as unknown as ExprNode
		const depart = ouverte(avecEvenements([]))

		expect(() =>
			evenementARencontrer(avecEvenements([evenement('evenement.x', 'bestiaire.gobelin', inconnu)]), depart),
		).toThrow()
		expect(() =>
			evenementARencontrer(avecEvenements([evenement('evenement.x', 'bestiaire.gobelin', nier(inconnu))]), depart),
		).toThrow()

		// DISCRIMINANCE (KR-199) : elle ne lève pas sur tout — la même forme, valide, répond.
		expect(
			evenementARencontrer(avecEvenements([evenement('evenement.x', 'bestiaire.gobelin', nier(AILLEURS))]), depart)
				?.evenement_id,
		).toBe('evenement.x')
	})

	it('elle est PURE — ni le dossier ni la session ne bougent, et le verdict suit l etat', () => {
		// KR-169 : « pure » est écrit au contrat, voici sa porte. Le dernier couple est
		// la mesure « aucune mémoïsation » PAR LE COMPORTEMENT : deux états, deux verdicts.
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverte(dossier)
		const arrivee = aLaTour(dossier, depart)
		const avantDossier = JSON.stringify(dossier)
		const avantSession = JSON.stringify(arrivee)

		evenementARencontrer(dossier, arrivee)

		expect(JSON.stringify(dossier)).toBe(avantDossier)
		expect(JSON.stringify(arrivee)).toBe(avantSession)
		expect(evenementARencontrer(dossier, depart)).toBeUndefined()
		expect(evenementARencontrer(dossier, arrivee)).toBeDefined()
	})
})

describe('evenementDeClimat, le climat du (n 14 moteur-horloge, it4, lot contrat)', () => {
	/** Le lieu de départ du dossier de référence — vrai à l'ouverture, donc une condition « toujours vraie ». */
	const ICI = feuille('lieu_courant_est', 'lieu.foyer-du-guet')
	const AILLEURS = feuille('lieu_courant_est', 'lieu.jamais-vu')

	/** Un événement FABRIQUÉ : seuls `climat_id`, `monstre_ref` et `declencheur_expr` sont lus par le moteur. */
	function evenement(
		id: string,
		climat: string | undefined,
		declencheur: ExprNode | undefined,
		reste: Partial<Evenement> = {},
	): Evenement {
		return {
			id,
			nom: `Nom de ${id}`,
			...(climat === undefined ? {} : { climat_id: climat }),
			...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
			resolutions: [],
			...reste,
		}
	}

	/** Le dossier de référence, ses événements REMPLACÉS — un seul champ muté, en test. */
	function avecEvenements(evenements: Evenement[]): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		dossier.monde.evenements = evenements
		return dossier
	}

	function ouverte(dossier: Dossier): EtatSession {
		const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
		return resultat.session
	}

	/** Le même état, ses événements consommés POSÉS — une seule feuille de `monde` change. */
	function avecConsommes(session: EtatSession, consommes: string[]): EtatSession {
		return { ...session, monde: { ...session.monde, evenements_consommes: consommes } }
	}

	it('rend le premier evenement a climat_id, sans monstre_ref, a condition vraie, non consomme — DEUX cles, ni plus ni moins', () => {
		const dossier = avecEvenements([evenement('evenement.pluie', 'climat.cendres-tenaces', ICI)])
		const activation = evenementDeClimat(dossier, ouverte(dossier))

		expect(activation).toEqual({ evenement_id: 'evenement.pluie', climat_id: 'climat.cendres-tenaces' })
		// GARDE PAR VALEUR (KR-246) : ni `nom` ni `declencheur_texte` (audience `auteur`), ni
		// `resolutions[]`, ni `declencheur_expr` ne sortent — une activation n'est pas une vue sur l'événement.
		expect(Object.keys(activation ?? {}).sort()).toEqual(['climat_id', 'evenement_id'])
	})

	it('rend le PREMIER dans l ordre du DOSSIER, quel que soit l evenement qui est vrai en second', () => {
		const A = evenement('evenement.a', 'climat.a', ICI)
		const B = evenement('evenement.b', 'climat.b', ICI)
		const depart = ouverte(avecEvenements([]))

		for (const [ordre, evenements, attendu] of [
			['A puis B', [A, B], 'evenement.a'],
			['B puis A', [B, A], 'evenement.b'],
		] as const) {
			expect(`${ordre} → ${evenementDeClimat(avecEvenements([...evenements]), depart)?.evenement_id}`).toBe(
				`${ordre} → ${attendu}`,
			)
		}
	})

	it('saute l evenement consomme, puis rend le suivant, puis undefined quand tous le sont', () => {
		// C'est `tickClimat` qui ajoute l'événement à `evenements_consommes`, à l'activation : cette
		// liste, et elle seule, empêche de rallumer le MÊME climat au pas suivant.
		const dossier = avecEvenements([
			evenement('evenement.a', 'climat.a', ICI),
			evenement('evenement.b', 'climat.b', ICI),
		])
		const depart = ouverte(dossier)

		expect(evenementDeClimat(dossier, depart)?.evenement_id).toBe('evenement.a')
		expect(evenementDeClimat(dossier, avecConsommes(depart, ['evenement.a']))?.evenement_id).toBe('evenement.b')
		expect(evenementDeClimat(dossier, avecConsommes(depart, ['evenement.a', 'evenement.b']))).toBeUndefined()
		// Consommer LE SECOND ne cache pas le premier : le saut est par identifiant.
		expect(evenementDeClimat(dossier, avecConsommes(depart, ['evenement.b']))?.evenement_id).toBe('evenement.a')
	})

	it('saute l evenement dont la condition est fausse, MEME en premiere position', () => {
		const faux = evenement('evenement.faux', 'climat.a', AILLEURS)
		const vrai = evenement('evenement.vrai', 'climat.b', ICI)
		const depart = ouverte(avecEvenements([]))

		expect(evenementDeClimat(avecEvenements([faux, vrai]), depart)?.evenement_id).toBe('evenement.vrai')
		expect(evenementDeClimat(avecEvenements([faux]), depart)).toBeUndefined()
	})

	it('un evenement qui porte monstre_ref ET climat_id est IGNORE — la rencontre prime, et les deux selecteurs se PARTITIONNENT', () => {
		// § J3 : la configuration ambiguë est ignorée sans alerte. L'ÉTAT SÉPARATEUR est
		// `monstre_ref` : le MÊME événement, avec puis sans, change de sélecteur.
		const hybride = evenement('evenement.hybride', 'climat.a', ICI, { monstre_ref: 'bestiaire.gobelin' })
		const climatSeul = evenement('evenement.climat', 'climat.a', ICI)
		const depart = ouverte(avecEvenements([]))

		const dossierHybride = avecEvenements([hybride])
		expect(evenementDeClimat(dossierHybride, depart)).toBeUndefined()
		expect(evenementARencontrer(dossierHybride, depart)).toEqual({
			evenement_id: 'evenement.hybride',
			monstre_ref: 'bestiaire.gobelin',
		})

		const dossierClimat = avecEvenements([climatSeul])
		expect(evenementDeClimat(dossierClimat, depart)?.evenement_id).toBe('evenement.climat')
		expect(evenementARencontrer(dossierClimat, depart)).toBeUndefined()

		// Et l'hybride en tête ne CACHE pas l'événement de climat qui le suit.
		expect(evenementDeClimat(avecEvenements([hybride, climatSeul]), depart)?.evenement_id).toBe('evenement.climat')
		// MÊME TEST que `evenementARencontrer` (`=== undefined`) : un `monstre_ref` vide compte comme
		// PRÉSENT des deux côtés, jamais comme absent d'un seul.
		const monstreVide = evenement('evenement.vide', 'climat.a', ICI, { monstre_ref: '' })
		expect(evenementDeClimat(avecEvenements([monstreVide]), depart)).toBeUndefined()
		expect(evenementARencontrer(avecEvenements([monstreVide]), depart)?.evenement_id).toBe('evenement.vide')
	})

	it('undefined quand l evenement n a pas de climat_id — chaine vide ou blanche comprise —, meme condition vraie', () => {
		const depart = ouverte(avecEvenements([]))
		const sansClimat = evenement('evenement.rumeur', undefined, ICI)
		const avecClimat = evenement('evenement.pluie', 'climat.a', ICI)

		expect(evenementDeClimat(avecEvenements([sansClimat]), depart)).toBeUndefined()
		// `''` et `'  '` se LISENT comme l'absence — c'est ce que le validateur tient pour calme.
		for (const vide of ['', '   ']) {
			expect(`« ${vide} » → ${evenementDeClimat(avecEvenements([evenement('evenement.v', vide, ICI)]), depart)}`).toBe(
				`« ${vide} » → undefined`,
			)
		}
		// DISCRIMINANT : le même événement avec un climat est rendu, et un événement sans climat en
		// tête ne cache pas celui qui suit.
		expect(evenementDeClimat(avecEvenements([avecClimat]), depart)?.evenement_id).toBe('evenement.pluie')
		expect(evenementDeClimat(avecEvenements([sansClimat, avecClimat]), depart)?.evenement_id).toBe('evenement.pluie')
	})

	it('undefined quand l evenement n a pas de declencheur_expr — jamais declenche automatiquement', () => {
		const sansCondition = evenement('evenement.a-la-main', 'climat.a', undefined)
		const avecCondition = evenement('evenement.auto', 'climat.a', ICI)
		const depart = ouverte(avecEvenements([]))

		expect(evenementDeClimat(avecEvenements([sansCondition]), depart)).toBeUndefined()
		expect(evenementDeClimat(avecEvenements([avecCondition]), depart)?.evenement_id).toBe('evenement.auto')
	})

	it('ne resout PAS le climat : une reference pendante est rendue telle quelle, jamais filtree', () => {
		// KR-021 : `validateDossier` l'a déjà refusée à l'import ; résoudre est l'affaire de `tickClimat`.
		const dossier = avecEvenements([evenement('evenement.pendant', 'climat.disparu-du-dossier', ICI)])

		expect(evenementDeClimat(dossier, ouverte(dossier))).toEqual({
			evenement_id: 'evenement.pendant',
			climat_id: 'climat.disparu-du-dossier',
		})
	})

	it('leve sur une condition non reconnue, NUE et sous une negation — jamais un faux positif (KR-238)', () => {
		// MUTANT NOMMÉ : envelopper l'appel d'`evaluerExpr` d'un `try/catch` qui rend `false`. Sous un
		// `non`, ce repli produit `true` — un climat ALLUMÉ à tort.
		const inconnu = { op: 'xor' } as unknown as ExprNode
		const depart = ouverte(avecEvenements([]))

		expect(() => evenementDeClimat(avecEvenements([evenement('evenement.x', 'climat.a', inconnu)]), depart)).toThrow()
		expect(() =>
			evenementDeClimat(avecEvenements([evenement('evenement.x', 'climat.a', nier(inconnu))]), depart),
		).toThrow()

		// DISCRIMINANCE (KR-199) : elle ne lève pas sur tout — la même forme, valide, répond.
		expect(
			evenementDeClimat(avecEvenements([evenement('evenement.x', 'climat.a', nier(AILLEURS))]), depart)?.evenement_id,
		).toBe('evenement.x')
	})

	it('elle est PURE — ni le dossier ni la session ne bougent, et le verdict suit l etat', () => {
		const dossier = avecEvenements([
			evenement('evenement.pluie', 'climat.a', feuille('lieu_visite', 'lieu.tour-effondree')),
		])
		const depart = ouverte(dossier)
		const arrivee: EtatSession = {
			...depart,
			monde: { ...depart.monde, lieux_visites: [...depart.monde.lieux_visites, 'lieu.tour-effondree'] },
		}
		const avantDossier = JSON.stringify(dossier)
		const avantSession = JSON.stringify(arrivee)

		evenementDeClimat(dossier, arrivee)

		expect(JSON.stringify(dossier)).toBe(avantDossier)
		expect(JSON.stringify(arrivee)).toBe(avantSession)
		// Deux états, deux verdicts : l'aucune-mémoïsation PAR LE COMPORTEMENT (KR-013/113).
		expect(evenementDeClimat(dossier, depart)).toBeUndefined()
		expect(evenementDeClimat(dossier, arrivee)).toBeDefined()
	})

	it('les DEUX fixtures du disque sont INERTES : aucun climat n est du a l ouverture, donc aucun journal existant ne change', () => {
		// La référence porte `climat_id` sur un événement sans condition structurée ; la minimale, sur
		// l'unique événement qu'elle porte — qui est aussi une rencontre, donc ignoré ici. Ce test est
		// ce qui autorise les deux fixtures partagées à porter le champ sans rien perturber.
		for (const chemin of [CHEMIN_REFERENCE, CHEMIN_MINIMAL]) {
			const dossier = lire(chemin)
			expect(dossier.monde.evenements.some((e) => e.climat_id !== undefined)).toBe(true)
			expect(evenementDeClimat(dossier, ouverte(dossier))).toBeUndefined()
		}
	})
})

describe('etapeDeclenchee, le declencheur d une etape de plan (n 14 moteur-horloge, it1, lot contrat)', () => {
	/** Vrai à l'ouverture du dossier de référence (le héros y part) — une condition « toujours vraie ». */
	const ICI = feuille('lieu_courant_est', 'lieu.foyer-du-guet')
	/** Fausse à l'ouverture : aucun lieu de ce nom n'est le lieu courant. */
	const AILLEURS = feuille('lieu_courant_est', 'lieu.jamais-vu')

	/** Une étape FABRIQUÉE : seuls `declencheur_expr` et, pour les témoins de non-lecture, `duree`/`si_bloque`. */
	function etape(declencheur: ExprNode | undefined, reste: Partial<PlanAction> = {}): PlanAction {
		return {
			etape: 1,
			action: 'Entretenir le mécanisme du beffroi.',
			...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
			...reste,
		}
	}

	it('declencheur absent : false — meme avec une duree posee et un declencheur_texte, jamais lus', () => {
		const faits = ouverture(lire(CHEMIN_REFERENCE))

		// L'ABSENCE d'arbre est un état calme (`tables.ts`) : rien à évaluer, donc rien
		// qui lève, et rien qui avance. `duree: 1` serait « échue » dès le premier pas —
		// c'est LE mutant « avancer à l'échéance quel que soit le déclencheur » (R-1).
		expect(etapeDeclenchee(faits, etape(undefined))).toBe(false)
		expect(
			etapeDeclenchee(
				faits,
				etape(undefined, { duree: 1, declencheur_texte: 'Le joueur arrive au foyer.', si_bloque: 'Il attend.' }),
			),
		).toBe(false)

		// DISCRIMINANT, DANS LE MÊME TEST : la même étape avec un arbre VRAI est vraie.
		expect(etapeDeclenchee(faits, etape(ICI, { duree: 1 }))).toBe(true)
	})

	it('declencheur vrai : true, faux : false — et la valeur suit l etat, jamais la forme de l arbre', () => {
		const faits = ouverture(lire(CHEMIN_REFERENCE))

		expect(etapeDeclenchee(faits, etape(ICI))).toBe(true)
		expect(etapeDeclenchee(faits, etape(AILLEURS))).toBe(false)

		// La NÉGATION inverse : un évaluateur qui rendrait la valeur de l'enfant sans la
		// négation passerait les deux lignes ci-dessus et rougirait ici.
		expect(etapeDeclenchee(faits, etape(nier(ICI)))).toBe(false)
		expect(etapeDeclenchee(faits, etape(nier(AILLEURS)))).toBe(true)
		// Et les connecteurs, dans leurs deux valeurs.
		expect(etapeDeclenchee(faits, etape({ op: 'et', enfants: [ICI, AILLEURS] }))).toBe(false)
		expect(etapeDeclenchee(faits, etape({ op: 'ou', enfants: [AILLEURS, ICI] }))).toBe(true)

		// LE MÊME ARBRE, DEUX ÉTATS : après le pas qui change le lieu courant, il change
		// de valeur (l'étape ne mémorise rien — KR-013/113).
		const ailleurs: FaitsDeSession = { ...faits, lieu_courant: 'lieu.tour-effondree' }
		expect(etapeDeclenchee(ailleurs, etape(ICI))).toBe(false)
		expect(etapeDeclenchee(ailleurs, etape(feuille('lieu_courant_est', 'lieu.tour-effondree')))).toBe(true)
	})

	it('leve sur une condition non reconnue, NUE et sous une negation — jamais un faux positif (KR-238)', () => {
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : envelopper l'appel d'`evaluerExpr` d'un
		// `try/catch` qui rend `false`. Sous un `non`, ce repli produit `true` — une étape
		// franchie à tort, donc un personnage qui change de plan sans que rien ne le justifie.
		const faits = ouverture(lire(CHEMIN_REFERENCE))
		const inconnu = { op: 'xor' } as unknown as ExprNode

		expect(() => etapeDeclenchee(faits, etape(inconnu))).toThrow()
		expect(() => etapeDeclenchee(faits, etape(nier(inconnu)))).toThrow()
		expect(() => etapeDeclenchee(faits, etape({ op: 'ou', enfants: [AILLEURS, inconnu] }))).toThrow()

		// DISCRIMINANCE (KR-199) : elle ne lève pas sur tout — la même forme, valide, répond.
		expect(etapeDeclenchee(faits, etape(nier(AILLEURS)))).toBe(true)
		// Et SANS arbre, il n'y a rien à lever : l'absence n'est pas une entrée non reconnue.
		expect(() => etapeDeclenchee(faits, etape(undefined))).not.toThrow()
	})

	it('elle est PURE — ni les faits ni l etape ne bougent', () => {
		// KR-169 : « pure » est écrit au contrat, voici sa porte.
		const faits = ouverture(lire(CHEMIN_REFERENCE))
		const unite = etape(ICI, { duree: 3 })
		const avantFaits = JSON.stringify(faits)
		const avantEtape = JSON.stringify(unite)

		etapeDeclenchee(faits, unite)

		expect(JSON.stringify(faits)).toBe(avantFaits)
		expect(JSON.stringify(unite)).toBe(avantEtape)
	})
})

describe('finAtteinte, la fin atteinte (n 15 moteur-fins, it1, lot contrat)', () => {
	/**
	 * LES DEUX FINS DU DISQUE, lues — jamais recopiées (KR-156). Les deux conditions sont des `et` :
	 *  · `fin.vigie-sauvee` — possède `objet.sceau-de-cendre` ET `jalon.second-guet` atteint ;
	 *  · `fin.vigie-abandonnee` — `evenement.embuscade-a-la-tour` consommé ET `lieu.vigie-du-nord` JAMAIS visité.
	 */
	const SAUVEE = 'fin.vigie-sauvee'
	const ABANDONNEE = 'fin.vigie-abandonnee'
	const SCEAU = 'objet.sceau-de-cendre'
	const SECOND_GUET = 'jalon.second-guet'
	const EMBUSCADE = 'evenement.embuscade-a-la-tour'

	/** Les faits d'OUVERTURE du dossier de référence : aucune des deux fins n'y est vraie. */
	function depart(dossier: Dossier): FaitsDeSession {
		return ouverture(dossier)
	}

	/** Seule `fin.vigie-sauvee` est vraie — le sceau possédé et le second guet atteint. */
	function monde1(dossier: Dossier): FaitsDeSession {
		return { ...depart(dossier), objets_possedes: [SCEAU], jalons_atteints: [SECOND_GUET] }
	}

	/** Seule `fin.vigie-abandonnee` est vraie — l'embuscade a eu lieu, la vigie du nord n'a jamais été visitée. */
	function monde2(dossier: Dossier): FaitsDeSession {
		return { ...depart(dossier), evenements_consommes: [EMBUSCADE] }
	}

	/** LES DEUX sont vraies : tout ce qui précède, ensemble. */
	function mondeDouble(dossier: Dossier): FaitsDeSession {
		return { ...monde1(dossier), evenements_consommes: [EMBUSCADE] }
	}

	it('finAtteinte rend la premiere fin dont la condition est vraie — et la seconde quand seule celle-la l est, undefined quand aucune ne l est', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		// L'ORDRE DU DISQUE EST LA PRÉCONDITION DU TÉMOIN : sans lui, « première » ne dirait rien.
		expect(dossier.charpente.fins.map((fin) => fin.id)).toEqual([SAUVEE, ABANDONNEE])

		// (1) AUCUNE n'est vraie à l'ouverture : rien n'est rendu — jamais un `fins[0]` par défaut.
		expect(finAtteinte(dossier, { monde: depart(dossier) })).toBeUndefined()

		// (2) SEULE LA PREMIÈRE est vraie, puis (3) SEULE LA SECONDE : un `fins[0]` aveugle ou un
		// `fins[dernier]` aveugle rougit chacun d'un côté.
		expect(finAtteinte(dossier, { monde: monde1(dossier) })?.fin_id).toBe(SAUVEE)
		expect(finAtteinte(dossier, { monde: monde2(dossier) })?.fin_id).toBe(ABANDONNEE)

		// (4) LES DEUX : la première du document, avec SA prose, verbatim, telle que le dossier l'écrit.
		const atteinte = finAtteinte(dossier, { monde: mondeDouble(dossier) })
		expect(atteinte).toEqual({ fin_id: SAUVEE, texte: dossier.charpente.fins[0].texte })
		expect((atteinte?.texte ?? '').length).toBeGreaterThan(0)
	})

	it('KR-302 deux fins vraies, premiere dans l ordre du document — le meme monde, fins INVERSEES, rend l autre', () => {
		// LE SÉPARATEUR : le MÊME monde, où les deux conditions sont vraies, et le SEUL ordre du
		// document change. Ce qui décide est l'INDEX dans `charpente.fins[]`, jamais l'identifiant,
		// jamais l'ordre où les faits ont été posés, jamais la longueur de la condition.
		const dossier = lire(CHEMIN_REFERENCE)
		const monde = mondeDouble(dossier)
		expect(evaluerExpr(monde, dossier.charpente.fins[0].condition_expr as ExprNode)).toBe(true)
		expect(evaluerExpr(monde, dossier.charpente.fins[1].condition_expr as ExprNode)).toBe(true)

		expect(finAtteinte(dossier, { monde })?.fin_id).toBe(SAUVEE)

		const inverse = lire(CHEMIN_REFERENCE)
		inverse.charpente.fins.reverse()
		expect(inverse.charpente.fins.map((fin) => fin.id)).toEqual([ABANDONNEE, SAUVEE])
		const atteinte = finAtteinte(inverse, { monde })
		expect(atteinte).toEqual({ fin_id: ABANDONNEE, texte: inverse.charpente.fins[0].texte })
	})

	it('KR-303 combat ouvert bloque finAtteinte — MEME avec une fin vraie, quelle que soit la forme de combat', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const monde = mondeDouble(dossier)

		// L'ÉTAT SÉPARATEUR : le même monde, sans puis avec `combat`.
		expect(finAtteinte(dossier, { monde })?.fin_id).toBe(SAUVEE)
		expect(finAtteinte(dossier, { monde, combat: undefined })?.fin_id).toBe(SAUVEE)

		// `combat` est `unknown` : seule sa PRÉSENCE compte. Un combat tout juste ouvert, un combat
		// avancé, une fuite posée, et une forme quelconque — tous ferment.
		for (const combat of [
			{ monstre_ref: 'bestiaire.squelette', postures: [] },
			{ monstre_ref: 'bestiaire.squelette', postures: ['normale', 'defensive'] },
			{ monstre_ref: 'bestiaire.squelette', postures: ['defensive'], fuite: true },
			{},
		]) {
			expect(`${JSON.stringify(combat)} → ${finAtteinte(dossier, { monde, combat })}`).toBe(
				`${JSON.stringify(combat)} → undefined`,
			)
		}

		// SUR UN VRAI `EtatSession` aussi — le chemin du produit : l'embuscade ouvre le combat et
		// consomme son événement, donc `fin.vigie-abandonnee` est vraie sur le monde de la session,
		// et un combat ouvert la ferme.
		const ouverte = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!ouverte.ok) throw new Error(`ouverture refusée : ${ouverte.refus}`)
		const sansCombat: EtatSession = {
			...ouverte.session,
			monde: { ...ouverte.session.monde, evenements_consommes: [EMBUSCADE] },
		}
		const enCombat: EtatSession = { ...sansCombat, combat: { monstre_ref: 'bestiaire.squelette', postures: [] } }
		expect(finAtteinte(dossier, sansCombat)?.fin_id).toBe(ABANDONNEE)
		expect(finAtteinte(dossier, enCombat)).toBeUndefined()
	})

	it('fin sans condition_expr ignoree — jamais atteinte, et elle ne CACHE pas la fin qui la suit', () => {
		// Absence de condition = état calme (`types.ts`) : la même règle que le déclencheur d'un jalon
		// ou d'un événement. La fin conserve son `texte` — c'est la CONDITION seule qui est lue.
		const dossier = lire(CHEMIN_REFERENCE)
		delete dossier.charpente.fins[0].condition_expr
		expect(dossier.charpente.fins[0].texte).toBeDefined()
		const monde = mondeDouble(dossier)

		// Les deux conditions seraient vraies : celle qui reste est rendue, la première est sautée.
		expect(finAtteinte(dossier, { monde })?.fin_id).toBe(ABANDONNEE)
		// Et seule SA condition à elle (monde1) ne rend plus rien — elle n'en a plus.
		expect(finAtteinte(dossier, { monde: monde1(dossier) })).toBeUndefined()

		// TOUTES sans condition : rien, même sur le monde où tout serait vrai.
		delete dossier.charpente.fins[1].condition_expr
		expect(finAtteinte(dossier, { monde })).toBeUndefined()

		// Et un dossier SANS AUCUNE FIN n'en rend pas : la boucle ne lit rien.
		const vide = lire(CHEMIN_REFERENCE)
		vide.charpente.fins = []
		expect(finAtteinte(vide, { monde })).toBeUndefined()
	})

	it('le retour porte DEUX cles au plus — fin_id et texte —, la cle texte est ABSENTE quand Fin.texte l est, et son contenu n est jamais juge (KR-307)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const monde = mondeDouble(dossier)

		// GARDE PAR VALEUR (KR-246) : ni `nom`, ni `condition_texte` (audience `auteur`), ni
		// `condition_expr` (la règle elle-même) ne sortent — une `FinAtteinte` n'est pas une vue sur la fin.
		const complete = finAtteinte(dossier, { monde })
		expect(Object.keys(complete ?? {}).sort()).toEqual(['fin_id', 'texte'])

		// `Fin.texte` ABSENT : la CLÉ est absente — jamais `texte: undefined`, que `toEqual` ne distingue
		// pas de l'absence et que cette ligne, si.
		delete dossier.charpente.fins[0].texte
		const sansTexte = finAtteinte(dossier, { monde })
		expect(sansTexte).toEqual({ fin_id: SAUVEE })
		expect('texte' in (sansTexte ?? {})).toBe(false)
		expect(Object.keys(sansTexte ?? {})).toEqual(['fin_id'])

		// LE CONTENU N'EST JAMAIS JUGÉ : vide ou blanc est rendu TEL QUEL. Le repli est l'affaire du
		// consommateur, pas du contrat — sinon `trim` vivrait à DEUX endroits.
		for (const texte of ['', '   ', '\n']) {
			dossier.charpente.fins[0].texte = texte
			const rendue = finAtteinte(dossier, { monde })
			expect(`« ${JSON.stringify(texte)} » → ${JSON.stringify(rendue)}`).toBe(
				`« ${JSON.stringify(texte)} » → ${JSON.stringify({ fin_id: SAUVEE, texte })}`,
			)
		}
	})

	it('leve sur une condition de fin non reconnue, NUE et sous une negation — jamais un faux positif (KR-238)', () => {
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : envelopper l'appel d'`evaluerExpr` d'un `try/catch` qui
		// rend `false`. Sous un `non`, ce repli produit `true` — une fin ATTEINTE à tort, c'est-à-dire
		// la partie TERMINÉE sans raison, la seule direction d'erreur que cette couche s'interdise.
		const inconnu = { op: 'xor' } as unknown as ExprNode
		const monde = depart(lire(CHEMIN_REFERENCE))

		for (const condition of [
			inconnu,
			nier(inconnu),
			{ op: 'ou', enfants: [feuille('lieu_visite', 'lieu.jamais-vu'), inconnu] } as ExprNode,
		]) {
			const dossier = lire(CHEMIN_REFERENCE)
			dossier.charpente.fins[0].condition_expr = condition
			expect(() => finAtteinte(dossier, { monde })).toThrow()
		}

		// DISCRIMINANCE (KR-199) : elle ne lève pas sur tout — la même forme, valide, répond.
		const sain = lire(CHEMIN_REFERENCE)
		sain.charpente.fins[0].condition_expr = nier(feuille('lieu_visite', 'lieu.jamais-vu'))
		expect(finAtteinte(sain, { monde })?.fin_id).toBe(SAUVEE)
		// Et SANS arbre, il n'y a rien à lever : l'absence n'est pas une entrée non reconnue.
		const sans = lire(CHEMIN_REFERENCE)
		delete sans.charpente.fins[0].condition_expr
		expect(() => finAtteinte(sans, { monde })).not.toThrow()
	})

	it('son second parametre est STRUCTUREL : { monde } suffit, un EtatSession entier passe tel quel, et monde est requis', () => {
		// Ce module n'importe NI `session.ts` NI `commandes.ts` : il ne peut pas NOMMER `EtatSession`.
		const dossier = lire(CHEMIN_REFERENCE)
		const monde = mondeDouble(dossier)
		expect(finAtteinte(dossier, { monde })?.fin_id).toBe(SAUVEE)

		const ouverte = ouvrirSession(dossier, { graine_alea: 424242 })
		if (!ouverte.ok) throw new Error(`ouverture refusée : ${ouverte.refus}`)
		const session: EtatSession = { ...ouverte.session, monde }
		expect(finAtteinte(dossier, session)?.fin_id).toBe(SAUVEE)

		// LES TROIS FORMES LÉGALES COMPILENT ET RÉPONDENT — c'est la moitié sans laquelle la directive
		// ci-dessous serait satisfaite par n'importe quelle erreur de type.
		expect(finAtteinte(dossier, { monde, combat: undefined })?.fin_id).toBe(SAUVEE)

		// `@ts-expect-error` ÉCHOUE À LA COMPILATION si l'erreur attendue n'a PAS lieu : c'est le seul
		// instrument qui épingle ce qu'une signature REFUSE. Ce que le typage exige : `monde`.
		// @ts-expect-error — `monde` est REQUIS : une session sans faits n'a rien à évaluer.
		const sansMonde = (): unknown => finAtteinte(dossier, {})
		expect(typeof sansMonde).toBe('function')
	})

	it('elle est PURE — ni le dossier ni la session ne bougent, et le verdict suit l etat', () => {
		// KR-169 : « pure » est écrit au contrat, voici sa porte. Le dernier couple est la mesure
		// « aucune mémoïsation » PAR LE COMPORTEMENT : deux états, deux verdicts.
		const dossier = lire(CHEMIN_REFERENCE)
		const avant = monde2(dossier)
		const apres = mondeDouble(dossier)
		const session = { monde: apres }
		const avantDossier = JSON.stringify(dossier)
		const avantSession = JSON.stringify(session)

		finAtteinte(dossier, session)

		expect(JSON.stringify(dossier)).toBe(avantDossier)
		expect(JSON.stringify(session)).toBe(avantSession)
		expect(finAtteinte(dossier, { monde: avant })?.fin_id).toBe(ABANDONNEE)
		expect(finAtteinte(dossier, { monde: apres })?.fin_id).toBe(SAUVEE)
	})

	it('les DEUX fixtures du disque portent une fin FAUSSE a l ouverture — aucune partie ne naît terminee', () => {
		// Ce test est ce qui autorise `executerCommande` à refuser sur `finAtteinte` sans toucher aux
		// deux fixtures : une fin vraie dès l'ouverture rendrait chaque suite de commandes sans objet.
		for (const chemin of [CHEMIN_REFERENCE, CHEMIN_MINIMAL]) {
			const dossier = lire(chemin)
			expect(dossier.charpente.fins.length).toBeGreaterThan(0)
			expect(finAtteinte(dossier, { monde: depart(dossier) })).toBeUndefined()
		}
	})
})

describe('evaluate.ts, les proprietes qui se lisent dans la SOURCE', () => {
	it('aucun identifiant de registre en chaine — la resolution passe par le descripteur', () => {
		// KR-117 : un aiguillage au site d'appel re-listerait ce que `PREDICATES` et
		// `DELTAS` décident, et divergerait EN SILENCE le jour d'une entrée de plus. La
		// seule clé dont ce module a besoin — l'effet qui marque un jalon — voyage par
		// `DELTA_DU_JALON_ATTEINT`, depuis `deltas.ts`.
		//
		// LA SOURCE EST PRIVÉE DE SES COMMENTAIRES, MAIS PAS DE SES CHAÎNES, et l'ordre
		// des deux comptes : la docstring NOMME `atteindre_jalon` pour dire par où il
		// voyage — une règle qui interdirait d'écrire le mot interdirait aussi de
		// l'expliquer —, et effacer les chaînes rendrait ce balayage-ci vide de sens.
		const code = enPositionDeCode(source('evaluate.ts'))
		const horsCommentaires = sansCommentaires(source('evaluate.ts'))
		const identifiants = [...Object.keys(PREDICATES), ...Object.keys(DELTAS)]

		// Discriminance de l'ENSEMBLE : onze identifiants, pas zéro.
		expect(identifiants.length).toBe(Object.keys(PREDICATES).length + Object.keys(DELTAS).length)

		for (const identifiant of identifiants) {
			for (const guillemet of ["'", '"', '`']) {
				const litteral = `${guillemet}${identifiant}${guillemet}`
				expect(`${litteral} → ${horsCommentaires.includes(litteral)}`).toBe(`${litteral} → false`)
				// Discriminance du motif : il attrape RÉELLEMENT un littéral, sans quoi les
				// onze lignes ci-dessus seraient vertes parce qu'on ne cherche rien.
				expect(`${litteral} → ${sansCommentaires(`const x = ${litteral}`).includes(litteral)}`).toBe(
					`${litteral} → true`,
				)
			}
		}

		// ET LES DEUX RÉSOLUTIONS PASSENT BIEN PAR LE DESCRIPTEUR : sans ces lignes, le
		// balayage ci-dessus serait vert sur un fichier qui ne toucherait aucun registre.
		expect(code).toMatch(/PREDICATES\[[^\]]*\]\.lit\(/)
		expect(code).toMatch(/DELTAS\[[^\]]*\]\.ecrit\(/)
	})

	it('la SEMANTIQUE d un jalon n a qu un lecteur, et la collection en a trois NOMMES', () => {
		// KR-246. LE RECENSEMENT EST UNE MESURE, PAS UNE INTUITION : `charpente.jalons`
		// est déjà nommée par TROIS modules, et l'affirmation « un seul module la
		// nomme » serait fausse le jour où on l'écrirait. Ce que chacun en fait est ce
		// qui compte, et c'est la seconde moitié qui le tient :
		//  · `sections.ts` en lit le NOMBRE, pour un compteur de navigation ;
		//  · `atteignabilite.ts` en lit les `effet[]`, comme PRODUCTEURS possibles d'un
		//    fait — il ne lit aucune prose et ne décide aucune condition ;
		//  · `evaluate.ts` en lit la SÉMANTIQUE — `declencheur_expr` et `enonce_texte` —,
		//    et il est le SEUL. C'est cette unicité-là que KR-246 protège : la prose
		//    `'ia'` d'un jalon n'a qu'un chemin de sortie, la projection.
		const codeDe = (nom: string): string => enPositionDeCode(source(nom))
		const porteurs = (motif: RegExp): string[] => fichiersDuModule().filter((nom) => motif.test(codeDe(nom)))

		expect(porteurs(/\.charpente\.jalons\b/)).toEqual(['atteignabilite.ts', 'evaluate.ts', 'sections.ts'])
		expect(porteurs(/\.enonce_texte\b/)).toEqual(['evaluate.ts'])
		expect(porteurs(/\.declencheur_expr\b/)).toEqual(['evaluate.ts'])

		// Discriminance du motif (KR-199) : sans ces deux lignes, les trois assertions
		// ci-dessus seraient vertes parce que l'expression ne matche rien — les CHEMINS
		// déclarés en chaîne (`tables.ts`, `destinations.ts`) sont effacés avec les
		// littéraux, et c'est exactement ce qu'on veut : déclarer un chemin n'est pas le
		// lire.
		expect(/\.charpente\.jalons\b/.test(enPositionDeCode('const a = dossier.charpente.jalons'))).toBe(true)
		expect(/\.charpente\.jalons\b/.test(enPositionDeCode("const a = { 'charpente.jalons': 1 }"))).toBe(false)
	})

	it('la condition d une etape de plan n a qu un lecteur : etapeDeclenchee, appelee par horloge.ts, jamais exportee par le baril', () => {
		// n° 14 `moteur-horloge`, it1. La garde `.declencheur_expr → ['evaluate.ts']` ci-dessus
		// n'est PAS desserrée : la lecture des étapes de plan vit DANS evaluate.ts, et
		// `horloge.ts` — qui en est le seul appelant — passe par `etapeDeclenchee`. Elle
		// est complétée ici par son versant POSITIF : sans lui, la garde négative serait
		// verte sur un `horloge.ts` qui ne lirait aucune condition du tout.
		const codeDe = (nom: string): string => enPositionDeCode(source(nom))
		const lecteurs = fichiersDuModule().filter((nom) => /\.declencheur_expr\b/.test(codeDe(nom)))

		expect(lecteurs).toEqual(['evaluate.ts'])
		expect(lecteurs).not.toContain('horloge.ts')
		// Versant positif : `etapeDeclenchee` lit l'arbre de l'étape dans evaluate.ts…
		expect(codeDe('evaluate.ts')).toMatch(/\betape\.declencheur_expr\b/)
		// …et `horloge.ts` l'importe de ce module — pas d'un autre, pas de `./expr`.
		expect(source('horloge.ts')).toMatch(/import\s*\{[^}]*\betapeDeclenchee\b[^}]*\}\s*from\s*['"]\.\/evaluate['"]/)
		expect(codeDe('horloge.ts')).toMatch(/\betapeDeclenchee\s*\(/)

		// LE BARIL NE LA SORT PAS : ni elle ni `tickHorloge` — deux fonctions internes au
		// module `brain/dossier/`, dont la seule porte vers une feature est `executerCommande`.
		const baril = fs.readFileSync(path.join(MODULE_DOSSIER, '..', 'index.ts'), 'utf8')
		for (const interne of ['etapeDeclenchee', 'tickHorloge', "'./dossier/horloge'"]) {
			expect(`${interne} → ${baril.includes(interne)}`).toBe(`${interne} → false`)
		}
		// Discriminant du motif : le baril exporte bien, lui, ce que ce module a de public.
		expect(baril.includes('executerCommande')).toBe(true)
		expect(baril.includes('DeltaJournalise')).toBe(true)
	})

	it('garde-baril-blocage : le predicat de blocage est interne a brain/dossier — ni etapeBloqueeAuPas, ni ConstatDeBlocage, ni ./dossier/blocage dans le baril', () => {
		// n° 14 `moteur-horloge`, it3. `etapeBloqueeAuPas` (`blocage.ts`) est appelée par `tickHorloge` et
		// par l'assembleur du narrateur (`copilote/contexte/horloge.ts`, qui l'importe en PROFONDEUR,
		// comme `personnagesPresents`) : aucune feature n'a à décider d'un blocage. La seule porte vers
		// une feature reste `executerCommande`. Lire le texte brut du baril — commentaires compris —
		// est voulu : un symbole cité même en prose y deviendrait un précédent (KR-223).
		const baril = fs.readFileSync(path.join(MODULE_DOSSIER, '..', 'index.ts'), 'utf8')

		for (const interne of ['etapeBloqueeAuPas', 'ConstatDeBlocage', "'./dossier/blocage'", './dossier/blocage']) {
			expect(`${interne} → ${baril.includes(interne)}`).toBe(`${interne} → false`)
		}
		// Discriminant du motif : le même balayage attrape, lui, un module que le baril sort bel et bien.
		for (const exporte of ["'./dossier/commandes'", "'./dossier/evaluate'"]) {
			expect(`${exporte} → ${baril.includes(exporte)}`).toBe(`${exporte} → true`)
		}
		// Et le module existe, avec le symbole : le test ne passe pas faute de fichier.
		expect(fichiersDuModule()).toContain('blocage.ts')
		expect(source('blocage.ts')).toMatch(/export function etapeBloqueeAuPas\(/)
	})

	it('garde-baril-climat : le cycle de vie du climat est interne a brain/dossier — ni tickClimat, ni evenementDeClimat, ni ActivationDeClimat, ni ./dossier/climat dans le baril', () => {
		// n° 14 `moteur-horloge`, it4. `tickClimat` (`climat.ts`) est appelée par `tickHorloge`, et
		// `evenementDeClimat` (`evaluate.ts`) par `tickClimat` seule : aucune feature n'a à allumer ni à
		// éteindre un climat — elle LIT `session.horloge.climat_actif`, que le type exporté porte déjà.
		// La seule porte vers une feature reste `executerCommande`. Texte brut du baril, commentaires
		// compris : un symbole cité même en prose y deviendrait un précédent (KR-223).
		const baril = fs.readFileSync(path.join(MODULE_DOSSIER, '..', 'index.ts'), 'utf8')

		for (const interne of ['tickClimat', 'evenementDeClimat', 'ActivationDeClimat', "'./dossier/climat'"]) {
			expect(`${interne} → ${baril.includes(interne)}`).toBe(`${interne} → false`)
		}
		// Discriminant du motif : le même balayage attrape, lui, un module que le baril sort bel et bien.
		expect(`'./dossier/sessionCombat' → ${baril.includes("'./dossier/sessionCombat'")}`).toBe(
			"'./dossier/sessionCombat' → true",
		)
		// Et le module existe, avec ses deux symboles : le test ne passe pas faute de fichier.
		expect(fichiersDuModule()).toContain('climat.ts')
		expect(source('climat.ts')).toMatch(/export function tickClimat\(/)
		expect(source('evaluate.ts')).toMatch(/export function evenementDeClimat\(/)
	})

	it('garde-baril-fin : la fin atteinte est interne a brain/dossier — ni finAtteinte, ni FinAtteinte dans le baril', () => {
		// n° 15 `moteur-fins`, it1. `finAtteinte` (`evaluate.ts`) est appelée par `executerCommande`
		// (`commandes.ts`), et la feature la lit par le pont `src/player/engine/fin.ts` — import en
		// PROFONDEUR, comme `evenementARencontrer` par `rencontre.ts` : décider qu'une partie est finie est
		// une décision de MOTEUR, jamais d'une feature. Lire le texte brut du baril — commentaires compris —
		// est voulu : un symbole cité même en prose y deviendrait un précédent (KR-223).
		const baril = fs.readFileSync(path.join(MODULE_DOSSIER, '..', 'index.ts'), 'utf8')

		for (const interne of ['finAtteinte', 'FinAtteinte']) {
			expect(`${interne} → ${baril.includes(interne)}`).toBe(`${interne} → false`)
		}
		// Discriminant du motif : le même balayage attrape, lui, ce que le baril sort bel et bien de ce
		// module — `DeltaJournalise` — et le refus que `executerCommande` rend, lui, PUBLIC (`RefusCommande`
		// sort : la feature rétrécit son union).
		for (const exporte of ['DeltaJournalise', 'RefusCommande', "'./dossier/evaluate'"]) {
			expect(`${exporte} → ${baril.includes(exporte)}`).toBe(`${exporte} → true`)
		}
		// Et le module existe, avec ses deux symboles : le test ne passe pas faute de fichier.
		expect(source('evaluate.ts')).toMatch(/export function finAtteinte\(/)
		expect(source('evaluate.ts')).toMatch(/export interface FinAtteinte\b/)
	})

	it('evaluate.ts n importe ni session.ts ni commandes.ts — ce sont EUX qui l appellent', () => {
		// L'ORIENTATION DE L'ARÊTE EST LE CONTRAT : l'évaluateur est une feuille du
		// graphe, appelée par le moteur de session et par celui des commandes. L'arête
		// inverse ferait de lui un second site de décision de ce qu'est une partie.
		const code = source('evaluate.ts')

		expect(code).not.toMatch(/from\s+['"]\.\/session['"]/)
		expect(code).not.toMatch(/from\s+['"]\.\/commandes['"]/)
		// Discriminant : les deux arêtes inverses, elles, existent bien.
		expect(source('session.ts')).toMatch(/from\s+['"]\.\/evaluate['"]/)
		expect(source('commandes.ts')).toMatch(/from\s+['"]\.\/evaluate['"]/)
	})

	it('faits.ts n importe RIEN — c est sa seule raison d etre', () => {
		// Le domicile d'un type que DEUX registres frères doivent nommer sans se
		// dépendre : `deltas.test.ts` interdit l'arête `deltas → predicates`, et un
		// import quelconque ici la rétablirait par la bande.
		expect(enPositionDeCode(source('faits.ts'))).not.toMatch(/\bimport\b/)
		// Et les deux registres le lisent bien — sans quoi la ligne ci-dessus serait
		// vraie d'un fichier que personne n'utilise.
		expect(source('predicates.ts')).toMatch(/from\s+['"]\.\/faits['"]/)
		expect(source('deltas.ts')).toMatch(/from\s+['"]\.\/faits['"]/)
	})

	it('aucun cache ni memoisation, et aucun catch autour de l evaluateur', () => {
		// KR-013/113 pour le cache ; KR-238 pour le `catch` — un repli rouvrirait
		// exactement le faux positif que la levée ferme. Source PRIVÉE DE SES
		// COMMENTAIRES : la docstring nomme ce qu'elle s'interdit, et une règle qui
		// interdirait le mot interdirait aussi d'expliquer pourquoi.
		const code = enPositionDeCode(source('evaluate.ts'))

		for (const interdit of ['new Map', 'new WeakMap', 'cache', 'memo', 'catch', 'try {']) {
			expect(`${interdit} → ${code.toLowerCase().includes(interdit.toLowerCase())}`).toBe(`${interdit} → false`)
		}

		// ET PAR LE COMPORTEMENT : les mêmes faits, mutés entre deux appels, rendent deux
		// verdicts différents. Un cache posé sur la référence rendrait deux fois le premier.
		const dossier = lire(CHEMIN_REFERENCE)
		const faits = ouverture(dossier)
		const condition = feuille('indice_connu', 'indice.pas-dans-la-cendre')

		expect(evaluerExpr(faits, condition)).toBe(false)
		const apres = appliquerDelta(faits, { delta: 'reveler_indice', cibles: ['indice.pas-dans-la-cendre'] }).faits
		expect(evaluerExpr(apres, condition)).toBe(true)
	})
})
