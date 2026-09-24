import fs from 'node:fs'
import path from 'node:path'
import { DELTAS } from './deltas'
import { appliquerDelta, evaluerExpr, projeterJalonsAtteints, resoudreJalons } from './evaluate'
import type { ExprNode } from './expr'
import type { FaitsDeSession } from './faits'
import { PREDICATES } from './predicates'
import { ouvrirSession } from './session'
import type { Dossier, Jalon } from './types'

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
