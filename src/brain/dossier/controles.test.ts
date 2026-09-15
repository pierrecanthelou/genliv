import fs from 'node:fs'
import path from 'node:path'
import { AMORCE, MARQUEUR_A_ECRIRE, construireAmorce } from './amorce'
import {
	CONTROLES,
	controleRemediation,
	controlerDossier,
	type Controle,
	type ControleId,
	type NiveauControle,
	type RapportControles,
} from './controles'
import { CURSEURS_INITIAUX, CURSEUR_MIN, CURSEUR_VALUES } from './curseurs'
import type { Delta } from './deltas'
import { DESTINATION_DES_CHAMPS } from './destinations'
import { estCleDe } from './identifiers'
import type { DossierIssueCode } from './issues'
import { SECTIONS, type SectionId } from './sections'
import { BUDGETS_DE_MOTS, CHEMINS_DE_DELTAS, FAMILLES_DE_CONDITIONS } from './tables'
import type { Dossier } from './types'
import { validateDossier } from './validate'

/**
 * LE LINTER DU DOSSIER, règle « amorce non rédigée ».
 *
 * La valeur de la marque n'est JAMAIS écrite dans ce fichier : elle est importée.
 * Sans cela, ce test deviendrait un second porteur du glyphe et ferait rougir la
 * garde d'unicité d'`amorce.test.ts`, qui balaie tout `src/` (KR-223).
 *
 * Les quatre champs contrôlés sont balayés depuis `AMORCE`, jamais re-listés :
 * « les quatre » prouvé sur trois est une énumération échantillonnée (KR-199).
 */

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')
const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

/**
 * LES SOURCES BALAYÉES, fins de ligne NORMALISÉES. L'arbre de travail est en
 * CRLF et `prettier` écrit en LF : une garde de source qui dépendrait de l'une
 * ou de l'autre rougirait après un simple `git checkout`, et son échec ne
 * dirait rien de ce qu'elle surveille.
 */
function lireSource(fichier: string): string {
	return fs.readFileSync(path.join(__dirname, fichier), 'utf8').replace(/\r\n/g, '\n')
}

const SOURCE_CONTROLES = lireSource('controles.ts')
const SOURCE_VALIDATE = lireSource('validate.ts')

/**
 * Un dossier SEMÉ, celui que `DossierService.create()` produit : ses quatre
 * proses portent la marque, et le validateur l'accepte pourtant sans une seule
 * anomalie — c'est tout le motif du type frère.
 */
function seme(): Dossier {
	return construireAmorce('dossier-des-controles', 'La Caverne', '2026-09-15T10:00:00.000Z')
}

/**
 * Un CLONE de la fixture, LU DU DISQUE à chaque appel (KR-156) — aucune prose
 * marquée, donc le dossier calme de référence. Jamais une troisième fixture
 * partagée : la preuve d'une règle se fait par mutation d'un SEUL champ de ce
 * clone, rouge puis calme dans le même test.
 */
function clone(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Dossier
}

/** La feuille d'un chemin pointé — `canon.mj.synopsis_mj` donne `synopsis_mj`. */
function feuille(chemin: string): string {
	return chemin.slice(chemin.lastIndexOf('.') + 1)
}

/** Les quatre champs semés, lus depuis le registre — jamais quatre littéraux. */
const CHAMPS_SEMES = Object.keys(AMORCE)

/**
 * LES CONSTATS D'UNE SEULE RÈGLE. Toute ligne de base se compte FILTRÉE depuis
 * l'itération 3, jamais sur le rapport entier : le clone intact porte une alerte
 * STRUCTURELLE « indice sans source », indépendante du champ que le test mute —
 * et sans ce filtrage la prochaine règle qui parlera sur `dossier-minimal.json`
 * recasserait les mêmes six assertions une troisième fois.
 */
function pourLaRegle(rapport: RapportControles, id: ControleId): readonly Controle[] {
	return rapport.controles.filter((controle) => controle.id === id)
}

/** L'identifiant d'un indice que RIEN du clone ne produit — le témoin d'orphelin. */
const INDICE_ORPHELIN = 'indice.trace-oubliee'

/**
 * Le clone, sa collection d'indices REMPLACÉE par un seul indice sans aucune
 * source. UN SEUL champ muté : les savoirs et les effets du clone continuent de
 * pointer des indices qui ne sont plus dans la collection, donc ils ne
 * contribuent à aucun de ceux qui y sont.
 */
function cloneIndiceOrphelin(): Dossier {
	const dossier = clone()
	dossier.monde.indices = [{ id: INDICE_ORPHELIN }]
	return dossier
}

/** Le clone, son unique personnage retiré de tout lieu — un seul champ. */
function cloneSansPresence(): Dossier {
	const dossier = clone()
	dossier.monde.personnages[0].presence = []
	return dossier
}

/** Le clone, son unique personnage privé de bloc `caractere` — « absent ». */
function cloneSansVoix(): Dossier {
	const dossier = clone()
	delete dossier.monde.personnages[0].caractere
	return dossier
}

/** Le dossier de RÉFÉRENCE, lu du disque à chaque appel — la seconde fixture du dépôt. */
function cloneReference(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

/** Un texte de N mots, sans aucun sens : seul le DÉCOMPTE est en jeu ici. */
function texteDe(nombre: number): string {
	return Array.from({ length: nombre }, (_, rang) => `mot${rang}`).join(' ')
}

/**
 * Le budget d'un chemin, LU DANS LA TABLE QUI FAIT FOI — jamais un seuil retapé
 * (KR-165). Le repli à zéro n'est pas une valeur de secours : un chemin absent de
 * `BUDGETS_DE_MOTS` produirait un témoin d'un mot, dont la sonde rougirait — ce
 * qu'elle doit faire.
 */
function budgetDe(chemin: string): number {
	const budget = BUDGETS_DE_MOTS.find((candidat) => candidat.path === chemin)
	return budget === undefined ? 0 : budget.budget
}

/** Le clone, son synopsis MJ porté à N mots — un seul champ. */
function cloneCanonLong(mots: number): Dossier {
	const dossier = clone()
	dossier.canon.mj.synopsis_mj = texteDe(mots)
	return dossier
}

/** Le clone, la porte de révélation de son unique savoir vidée — un seul champ. */
function cloneSansPorte(): Dossier {
	const dossier = clone()
	dossier.monde.personnages[0].savoirs[0].revele_si = {}
	return dossier
}

/** Le clone, sa fin privée de condition structurée — un seul champ. */
function cloneFinSansExpr(): Dossier {
	const dossier = clone()
	delete dossier.charpente.fins[0].condition_expr
	return dossier
}

/** Le clone, son étape de plan privée de durée — un seul champ. */
function cloneEtapeSansDuree(): Dossier {
	const dossier = clone()
	delete dossier.monde.personnages[0].plan_actions[0].duree
	return dossier
}

/**
 * LES DIX TÉMOINS DU PONT — un par site d'avertissement, chacun obtenu par la
 * mutation d'UN SEUL champ du clone, et la clé EST le chemin de table.
 *
 * Ils sont dix et non quatre : les quatre CODES du validateur ne suffisent pas à
 * prouver dix SITES, et `validate.ts` écrit déjà un message par site, pas par
 * code (les deux phrases de `condition-sans-expr` divergent entre une fin et une
 * étape de plan). Un témoin par code laisserait six lignes de table sans preuve.
 *
 * La table du module, elle, n'est jamais lue ici : elle est privée, et ce que
 * ces sondes confrontent, ce sont les registres qui font foi (`BUDGETS_DE_MOTS`,
 * `FAMILLES_DE_CONDITIONS`) et les deux sites que `validate.ts` écrit à la main.
 */
const TEMOINS_DU_PONT: Record<string, () => Dossier> = {
	'canon.mj': () => cloneCanonLong(budgetDe('canon.mj') + 1),
	'canon.partage': () => {
		const dossier = clone()
		dossier.canon.partage.accroche_joueur = texteDe(budgetDe('canon.partage') + 1)
		return dossier
	},
	'charpente.jalons[].enonce_texte': () => {
		const dossier = clone()
		dossier.charpente.jalons[0].enonce_texte = texteDe(budgetDe('charpente.jalons[].enonce_texte') + 1)
		return dossier
	},
	'monde.conditions.climat[].manifestation': () => {
		const dossier = clone()
		dossier.monde.conditions.climat[0].manifestation = texteDe(budgetDe('monde.conditions.climat[].manifestation') + 1)
		return dossier
	},
	'canon.objectifs[].reussi_si_texte': () => {
		const dossier = clone()
		delete dossier.canon.objectifs[0].reussi_si_expr
		return dossier
	},
	'canon.objectifs[].echoue_si_texte': () => {
		const dossier = clone()
		delete dossier.canon.objectifs[0].echoue_si_expr
		return dossier
	},
	'charpente.fins[].condition_texte': cloneFinSansExpr,
	'monde.personnages[].contre_mesures[].declencheur_texte': () => {
		const dossier = clone()
		const contreMesures = dossier.monde.personnages[0].contre_mesures ?? []
		delete contreMesures[0].declencheur_expr
		return dossier
	},
	'monde.personnages[].savoirs[].revele_si': cloneSansPorte,
	'monde.personnages[].plan_actions[].si_bloque': cloneEtapeSansDuree,
}

/** Les deux niveaux que le pont peut émettre — jamais `bloquant`, tenu aussi par le type. */
const NIVEAUX_DU_PONT: readonly NiveauControle[] = ['alerte', 'info']

/**
 * LA GARDE DE L'ITÉRATION 1, AMENDÉE. Un `path` est une clé de la table des
 * destinations, OU le PRÉFIXE STRICT d'au moins une clé, coupé sur le
 * séparateur : `canon.mj`, `canon.partage` et `…savoirs[].revele_si` sont des
 * CONTENEURS, et cette table n'indexe que des feuilles. Le point final n'est pas
 * décoratif — sans lui, `canon.mj` matcherait `canon.mjolnir`.
 *
 * Elle s'amende, elle ne se retire pas, et `DESTINATION_DES_CHAMPS` ne bouge pas :
 * la garde couvre le retour vers le champ fautif, la table dit une AUDIENCE.
 */
function estCheminDeChamp(chemin: string): boolean {
	if (estCleDe(DESTINATION_DES_CHAMPS, chemin)) return true
	return Object.keys(DESTINATION_DES_CHAMPS).some((cle) => cle.startsWith(`${chemin}.`))
}

describe('controlerDossier, le rapport de controles', () => {
	it('produit les quatre controles sur un dossier fraichement seme', () => {
		const rapport = controlerDossier(seme())

		expect(rapport.controles).toHaveLength(CHAMPS_SEMES.length)
		for (const champ of CHAMPS_SEMES) {
			// L'égalité porte sur une phrase NOMMÉE : un échec dit quel champ a perdu
			// son contrôle, plutôt que « 3 attendu 4 » sur un compte.
			const pourLeChamp = rapport.controles.filter((controle) => feuille(controle.path) === champ)
			expect(`${champ} → ${pourLeChamp.length}`).toBe(`${champ} → 1`)
		}

		const bloquants = rapport.controles.filter((controle) => controle.niveau === 'bloquant')
		expect(bloquants.map((controle) => controle.path)).toEqual(['charpente.depart.texte_ouverture_joueur'])
		expect(bloquants[0].section).toBe('depart')

		const alertes = rapport.controles.filter((controle) => controle.niveau === 'alerte')
		expect(alertes).toHaveLength(3)
		for (const alerte of alertes) {
			expect(`${alerte.path} → ${alerte.section}`).toBe(`${alerte.path} → canon`)
		}

		// ORDRE DE RENDU : le bloquant d'abord. La vue ne trie pas — si l'ordre ne
		// vient pas d'ici, il ne vient de nulle part.
		expect(rapport.controles[0]).toBe(bloquants[0])
		expect(rapport.jouable).toBe(false)
	})

	it('jouable ne bascule vrai qu une fois le bloquant reecrit', () => {
		const canonReecrit = seme()
		canonReecrit.canon.mj.synopsis_mj = 'Le sceau du Gouffre est brisé depuis trois lunes.'
		canonReecrit.canon.partage.accroche_joueur = 'Val-Cendre vous accueille sous une pluie de cendres.'
		canonReecrit.canon.ton = 'sombre et feutré'
		const avecBloquant = controlerDossier(canonReecrit)

		// Les trois alertes réécrites ne suffisent pas : c'est la prose LUE AU JOUEUR
		// qui décide, jamais le matériau du modèle.
		expect(avecBloquant.controles).toHaveLength(1)
		expect(avecBloquant.controles[0].niveau).toBe('bloquant')
		expect(avecBloquant.jouable).toBe(false)
		expect(avecBloquant.jouable).toBe(avecBloquant.controles.every((controle) => controle.niveau !== 'bloquant'))

		const ouvertureReecrite = seme()
		ouvertureReecrite.charpente.depart.texte_ouverture_joueur = "Vous poussez la porte de l'auberge du Fanal."
		const sansBloquant = controlerDossier(ouvertureReecrite)

		expect(sansBloquant.controles).toHaveLength(3)
		expect(sansBloquant.jouable).toBe(true)
		expect(sansBloquant.jouable).toBe(sansBloquant.controles.every((controle) => controle.niveau !== 'bloquant'))
	})

	it('se declenche sur un champ mute et se tait sur son clone intact, meme test', () => {
		const dossier = clone()
		const intact = dossier.charpente.depart.texte_ouverture_joueur

		// (a) le clone INTACT — aucune prose marquée, donc aucun contrôle DE CETTE
		// RÈGLE. Sans cette moitié, un linter qui signale tout serait indistinguable
		// d'un linter juste. Le compte est FILTRÉ : ce que le clone porte PAR AILLEURS
		// est la ligne de base d'une autre règle, épinglée par sa propre sonde.
		expect(pourLaRegle(controlerDossier(dossier), 'amorce-non-redigee')).toEqual([])
		expect(controlerDossier(dossier).jouable).toBe(true)

		// (b) UN SEUL champ muté.
		dossier.charpente.depart.texte_ouverture_joueur = `${MARQUEUR_A_ECRIRE} ${intact}`
		const rouge = controlerDossier(dossier)
		expect(pourLaRegle(rouge, 'amorce-non-redigee')).toHaveLength(1)
		// L'ORDRE DES CLÉS EST L'ORDRE DE RENDU : `controles[0]` n'est le constat de
		// l'amorce que parce que sa règle est déclarée EN PREMIER dans le registre.
		// C'est cette ligne-ci qui rougirait si les entrées de l'itération 3 étaient
		// insérées avant elle — par ordre alphabétique, par exemple.
		expect(Object.keys(CONTROLES)[0]).toBe('amorce-non-redigee')
		expect(`${rouge.controles[0].path} → ${rouge.controles[0].niveau}`).toBe(
			'charpente.depart.texte_ouverture_joueur → bloquant',
		)
		expect(rouge.jouable).toBe(false)

		// (c) restauration dans le MÊME test : le voyant s'éteint.
		dossier.charpente.depart.texte_ouverture_joueur = intact
		expect(pourLaRegle(controlerDossier(dossier), 'amorce-non-redigee')).toEqual([])
		expect(controlerDossier(dossier).jouable).toBe(true)
	})

	it('detecte un marqueur reste au milieu d une prose partiellement reecrite', () => {
		const dossier = clone()
		dossier.canon.ton = `Sombre et feutré, ${MARQUEUR_A_ECRIRE} à resserrer avant la partie.`

		const rapport = controlerDossier(dossier)

		// LE DISCRIMINANT de `includes` contre `startsWith` : la prose ne COMMENCE
		// pas par la marque, et c'est le cas le plus probable d'une reprise
		// inachevée — celui que le dispositif existe pour attraper.
		expect(dossier.canon.ton.startsWith(MARQUEUR_A_ECRIRE)).toBe(false)
		expect(pourLaRegle(rapport, 'amorce-non-redigee')).toHaveLength(1)
		expect(rapport.controles[0].path).toBe('canon.ton')
		expect(rapport.controles[0].niveau).toBe('alerte')
	})

	it('la section de chaque controle est celle declaree, jamais derivee du path', () => {
		// La table attendue est TOTALE sur les champs semés : une cinquième prose ne
		// compile pas ici tant que sa section n'est pas décidée.
		const SECTION_ATTENDUE: Record<keyof typeof AMORCE, SectionId> = {
			texte_ouverture_joueur: 'depart',
			synopsis_mj: 'canon',
			accroche_joueur: 'canon',
			ton: 'canon',
		}
		const rapport = controlerDossier(seme())

		for (const [champ, section] of Object.entries(SECTION_ATTENDUE)) {
			const controle = rapport.controles.find((candidat) => feuille(candidat.path) === champ)
			expect(`${champ} → ${controle?.section}`).toBe(`${champ} → ${section}`)
		}

		const bloquant = rapport.controles.find((controle) => controle.niveau === 'bloquant')
		// Le bloquant vaut `depart` alors que son chemin commence par `charpente` :
		// une dérivation naïve du premier segment du `path` rendrait `charpente`, qui
		// n'est même pas une section.
		expect(bloquant?.section).toBe('depart')
		expect(bloquant?.path.split('.')[0]).toBe('charpente')

		// LES QUATRE ENTRÉES DE L'ITÉRATION 3, et la démonstration porte sur LES
		// QUATRE — pas sur un échantillon (KR-199) : dans chacune, le premier segment
		// du `path` diffère de la `section` déclarée. Une dérivation naïve les
		// enverrait toutes sur `monde` ou `charpente`, deux non-sections. La table est
		// TOTALE par compilation sur `ControleId` moins l'amorce : une sixième règle ne
		// compilera pas ici tant que son auteur n'aura pas exhibé un témoin.
		// LE CHOIX DU TÉMOIN DE LA RÈGLE NEUVE, et il se dit en une phrase parce qu'il
		// se trompe autrement : le témoin de la PREUVE VERTICALE D'ALLUMAGE se choisit
		// sur le COÛT — `canon.mj` via un budget de mots est le moins cher, une seule
		// affectation, aucun risque de fabriquer une anomalie. Le témoin de la GARDE
		// ANTI-DÉRIVATION ci-dessous se choisit sur le CONTRASTE et exclut nommément
		// tout site `canon.*`, dont la racine du `path` égale toujours la section.
		// DEUX TÉMOINS, DEUX TESTS DIFFÉRENTS, JAMAIS LE MÊME SITE POUR LES DEUX
		// PREUVES. `cloneSansPorte()` est celui-ci : racine `monde`, section
		// `personnages`, et il ne produit qu'UN avertissement (mesuré).
		const NEUVES: Record<Exclude<ControleId, 'amorce-non-redigee'>, Dossier> = {
			'indice-sans-source': cloneIndiceOrphelin(),
			'depart-desert': cloneSansPresence(),
			'personnage-sans-presence': cloneSansPresence(),
			'personnage-sans-voix': cloneSansVoix(),
			'avertissement-de-validation': cloneSansPorte(),
		}

		for (const id of Object.keys(NEUVES) as (keyof typeof NEUVES)[]) {
			const constats = CONTROLES[id].controler(NEUVES[id])
			// Discriminance : une règle muette rendrait la boucle suivante vraie sans
			// rien prouver.
			expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
			// LA LIMITE DE CE PRÉDICAT, écrite ici parce qu'elle punira un jour la BONNE
			// réponse : il est structurellement INSATISFIABLE pour la section `canon` —
			// `sections.ts` en fait la seule des dix `cle` sans point, donc la seule où
			// l'identifiant de section et la racine du chemin sont la même chaîne. Une
			// future règle qui déclarera correctement `section: 'canon'` sur un `path` en
			// `canon.*` fera rougir ce test EN ÉTANT JUSTE. Ne pas ajouter un tel témoin
			// ici ; réécrire l'invariant est la charge de qui touchera `canon.*` en
			// premier. L'invariant lui-même — « le module ne découpe jamais un chemin » —
			// est balayé sur la SOURCE par la suite du pont, et celui-là couvre `canon`.
			for (const constat of constats) {
				expect(`${id} · ${constat.path} → ${constat.path.split('.')[0] !== constat.section}`).toBe(
					`${id} · ${constat.path} → true`,
				)
			}
		}
	})

	it('chaque regle du registre exhibe un temoin qui la declenche', () => {
		// UN TÉMOIN PAR RÈGLE, `Record<ControleId, Dossier>` TOTAL PAR COMPILATION —
		// même geste que `PROSES_AMORCE`. Ce balayage exigeait auparavant que CHAQUE
		// entrée parle sur un dossier fraîchement semé : la règle d'it1 le faisait par
		// un hasard heureux (ses quatre proses y sont marquées), mais `personnages` et
		// `indices` y sont VIDES, si bien que les quatre règles d'it3 y sont muettes
		// PAR CONCEPTION. L'exigence juste n'est pas « parler sur le dossier semé »,
		// c'est « exhiber un dossier où elle parle » — et l'exiger PAR COMPILATION rend
		// toute règle future non livrable tant que son auteur n'a pas produit ce
		// dossier.
		const TEMOINS: Record<ControleId, Dossier> = {
			'amorce-non-redigee': seme(),
			'indice-sans-source': cloneIndiceOrphelin(),
			'depart-desert': cloneSansPresence(),
			'personnage-sans-presence': cloneSansPresence(),
			'personnage-sans-voix': cloneSansVoix(),
			'avertissement-de-validation': cloneSansPorte(),
		}

		for (const id of Object.keys(CONTROLES) as ControleId[]) {
			const descripteur = CONTROLES[id]
			const constats = descripteur.controler(TEMOINS[id])

			expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
			for (const constat of constats) {
				expect(`${id} · ${constat.path} → ${descripteur.niveaux.includes(constat.niveau)}`).toBe(
					`${id} · ${constat.path} → true`,
				)
				// KR-217 À L'EXÉCUTION, et pas seulement au typage. L'absence de
				// `severity` sur un littéral est tenue par le contrôle d'excès de
				// propriété de `tsc` ; un constat ASSEMBLÉ dynamiquement y échapperait.
				// Balayé ICI parce que le `Record` des témoins est TOTAL : une règle
				// future est couverte sans que son auteur ait à y penser.
				// `Object.keys` et non `in` — ce dernier remonte la chaîne de
				// prototypes (KR-175).
				expect(`${id} → ${Object.keys(constat).includes('severity')}`).toBe(`${id} → false`)
			}
		}
	})

	it('les path sont des cles de DESTINATION_DES_CHAMPS', () => {
		// LE RAPPORT COMPLET, et sur les témoins des SIX règles : un balayage du seul
		// dossier semé ne verrait que les quatre chemins de l'amorce et laisserait sans
		// preuve les quatre `path` neufs, alors que son nom promet « les path »
		// (KR-199).
		const rapports = [
			controlerDossier(seme()),
			controlerDossier(cloneIndiceOrphelin()),
			controlerDossier(cloneSansPresence()),
			controlerDossier(cloneSansVoix()),
			// LA SIXIÈME RÈGLE, sans quoi la ligne de discriminance juste en dessous
			// rougit : elle compte les identifiants REPRÉSENTÉS contre la taille du
			// registre, et les quatre dossiers ci-dessus ne mutent aucun champ porteur
			// d'avertissement. Elle rougirait EN FAISANT SON TRAVAIL — c'est elle qui
			// force toute règle neuve à entrer dans ce balayage de `path`.
			controlerDossier(cloneSansPorte()),
		]
		const controles = rapports.flatMap((rapport) => rapport.controles)

		// Discriminance : les SIX règles sont représentées dans ce qui est balayé.
		expect(new Set(controles.map((controle) => controle.id)).size).toBe(Object.keys(CONTROLES).length)
		expect(controles.length).toBeGreaterThan(CHAMPS_SEMES.length)

		for (const controle of controles) {
			// Appartenance PROPRE, jamais `in` (KR-175). Un `path` libre ferait du
			// retour vers le champ fautif une chaîne que personne ne résout.
			// CLÉ OU CONTENEUR depuis l'itération 5 : trois des dix sites du pont sont
			// des blocs, préfixes stricts de 1, 1 et 6 clés, et aucun n'est orphelin.
			expect(`${controle.path} → ${estCheminDeChamp(controle.path)}`).toBe(`${controle.path} → true`)
		}
	})

	it('Controle ne porte jamais de severity', () => {
		const NIVEAUX_ATTENDUS: NiveauControle[] = ['bloquant', 'alerte']
		const rapport = controlerDossier(seme())

		expect(rapport.controles).toHaveLength(CHAMPS_SEMES.length)
		for (const controle of rapport.controles) {
			// `severity` dit si le DOCUMENT peut être écrit ; `niveau` si l'AVENTURE
			// peut être jouée. Un contrôle qui porterait les deux mélangerait les axes.
			expect(controle).not.toHaveProperty('severity')
			expect(`${controle.path} → ${NIVEAUX_ATTENDUS.includes(controle.niveau)}`).toBe(`${controle.path} → true`)
		}
	})

	it('les messages francais n ecrivent jamais le glyphe en dur', () => {
		// Le glyphe RENDU à l'exécution est licite ; le glyphe ÉCRIT en source ne
		// l'est nulle part. Les deux moitiés se prouvent ensemble : sans la seconde,
		// un module qui ne parlerait jamais de la marque passerait la première.
		expect(SOURCE_CONTROLES).not.toContain(MARQUEUR_A_ECRIRE)
		expect(SOURCE_CONTROLES).toContain('MARQUEUR_A_ECRIRE')

		for (const controle of controlerDossier(seme()).controles) {
			expect(`${controle.path} → ${controle.message.includes(MARQUEUR_A_ECRIRE)}`).toBe(`${controle.path} → true`)
		}
	})

	it('le rapport lit les avertissements du validateur, jamais ses anomalies', () => {
		// LA GARDE DE L'ITÉRATION 3, RÉTRÉCIE SUR SON PROPRE MOTIF. Elle interdisait
		// le MODULE ENTIER au nom d'un argument qui ne porte que sur un canal : un
		// dossier PERSISTÉ ne porte jamais d'anomalie (KR-225), un voyant branché là
		// ne pourrait pas s'allumer et DOUBLERAIT les suites qui l'épinglent déjà
		// (KR-217). L'autre canal est l'exact inverse — le seul dont tout l'intérêt
		// est qu'il SURVIT à la persistance.
		//
		// LES DEUX MOITIÉS, et la seconde n'est pas décorative : une garde d'absence
		// seule passerait tautologiquement sur un module qui ne mentionnerait pas du
		// tout le validateur.
		expect(SOURCE_CONTROLES).not.toContain('.errors')
		expect(SOURCE_CONTROLES).toContain('.warnings')

		// LA SONDE D'EXÉCUTION, sur un témoin construit pour ne porter AUCUN
		// avertissement : les deux canaux s'empilent INDÉPENDAMMENT, si bien qu'un
		// dossier porteur des deux rendrait ce test vert pour la mauvaise raison.
		const pendant = clone()
		pendant.charpente.depart.lieu_id = 'lieu.englouti'
		const validation = validateDossier(pendant)
		expect(`${validation.errors.length} anomalies · ${validation.warnings.length} avertissements`).toBe(
			'1 anomalies · 0 avertissements',
		)
		expect(pourLaRegle(controlerDossier(pendant), 'avertissement-de-validation')).toEqual([])
	})

	it('parSection porte les dix sections, dans l ordre du registre', () => {
		const rapport = controlerDossier(seme())

		expect(Object.keys(rapport.parSection)).toEqual(SECTIONS.map((section) => section.id))

		const calmes = SECTIONS.map((section) => section.id).filter(
			(id) => !rapport.controles.some((controle) => controle.section === id),
		)
		expect(calmes).toHaveLength(8)
		for (const id of calmes) {
			// `null`, jamais `undefined` : un `Partial` obligerait chaque appelant à
			// écrire `?? null`, et deux silences indistinguables sont un défaut.
			expect(`${id} → ${rapport.parSection[id]}`).toBe(`${id} → null`)
		}

		expect(rapport.parSection.depart).toBe('bloquant')
		expect(rapport.parSection.canon).toBe('alerte')
	})

	it('cas limite : marqueur seul sans consigne', () => {
		const dossier = clone()
		dossier.canon.ton = MARQUEUR_A_ECRIRE

		// Une marque seule est un champ vide déguisé : le validateur l'accepte (non
		// vide), et c'est précisément ce que le linter doit voir.
		expect(pourLaRegle(controlerDossier(dossier), 'amorce-non-redigee')).toHaveLength(1)
	})

	it('cas limite : une prose vide ne plante pas et ne declenche pas', () => {
		const dossier = clone()
		dossier.canon.ton = ''

		const rapport = controlerDossier(dossier)
		expect(pourLaRegle(rapport, 'amorce-non-redigee')).toEqual([])
		expect(rapport.jouable).toBe(true)
	})
})

describe('indice-sans-source, un compteur et deux seuils', () => {
	it('un indice sans aucun producteur bloque, un seul producteur alerte, deux se taisent', () => {
		// LES TROIS ÉTATS SUR LE MÊME CLONE, chacun atteint par la mutation d'UN SEUL
		// champ de plus : une cause unique, deux seuils, et le silence au-delà.
		const dossier = cloneIndiceOrphelin()

		// (a) ZÉRO producteur → BLOQUANT.
		const bloque = pourLaRegle(controlerDossier(dossier), 'indice-sans-source')
		expect(bloque.map((constat) => `${constat.entityId} → ${constat.niveau}`)).toEqual([
			`${INDICE_ORPHELIN} → bloquant`,
		])
		expect(`${bloque[0].section} · ${bloque[0].path}`).toBe('indices · monde.indices[].id')
		// La SECTION est déclarée `indices` alors que le remède se fait dans
		// Personnages : `section` dit où le voyant s'allume, la remédiation dit où il
		// s'éteint, et ce ne sont pas les mêmes écrans (KR-219).
		expect(controlerDossier(dossier).jouable).toBe(false)

		// (b) UN producteur → ALERTE. Le savoir de l'unique personnage est repointé.
		dossier.monde.personnages[0].savoirs[0].indice_id = INDICE_ORPHELIN
		const alerte = pourLaRegle(controlerDossier(dossier), 'indice-sans-source')
		expect(alerte.map((constat) => `${constat.entityId} → ${constat.niveau}`)).toEqual([`${INDICE_ORPHELIN} → alerte`])
		// Une alerte ne bloque pas : le goulot est un risque, pas une impasse.
		expect(controlerDossier(dossier).jouable).toBe(true)

		// (c) DEUX producteurs → SILENCE. L'effet du jalon le révèle à son tour.
		dossier.charpente.jalons[0].effet = [{ delta: 'reveler_indice', cibles: [INDICE_ORPHELIN] }]
		expect(pourLaRegle(controlerDossier(dossier), 'indice-sans-source')).toEqual([])
	})

	it('le clone intact porte exactement une alerte indice-sans-source', () => {
		// SONDE DE LIGNE DE BASE. Sans elle, la prochaine règle qui parlera sur
		// `dossier-minimal.json` referait la même bascule en silence : les six comptes
		// filtrés resteraient verts, et personne ne verrait que le dossier de référence
		// des preuves a changé d'état.
		const rapport = controlerDossier(clone())

		// `indice.cendres-tiedes` n'est détenu par AUCUN savoir : il n'est produit que
		// par le delta d'une résolution d'événement — UN producteur, donc un goulot.
		// `indice.sceau-brise` en compte TROIS (savoir + effet de jalon + `mene_a`) et
		// se tait. C'est la mesure qui a imposé les six chemins : une règle lue depuis
		// `savoirs[]` seul aurait déclaré le premier BLOQUANT — faux positif sur la
		// fixture de toutes les preuves de cette feature.
		expect(rapport.controles.map((controle) => `${controle.id} · ${controle.entityId} → ${controle.niveau}`)).toEqual([
			'indice-sans-source · indice.cendres-tiedes → alerte',
		])
		expect(rapport.jouable).toBe(true)
	})

	it('un cycle mene_a sans autre source rend deux alertes, pas deux bloquants', () => {
		const dossier = clone()
		// UN SEUL champ muté : la collection ENTIÈRE est remplacée. Les savoirs et les
		// effets du clone continuent de pointer `cendres-tiedes` / `sceau-brise`, qui
		// n'y sont plus — ils ne contribuent donc à aucun des deux indices présents, et
		// le cycle est bien SANS autre source. `controlerDossier` ne valide pas : ces
		// références pendantes lui sont indifférentes.
		dossier.monde.indices = [
			{ id: 'indice.anneau-de-cuivre', mene_a: ['indice.anneau-de-fer'] },
			{ id: 'indice.anneau-de-fer', mene_a: ['indice.anneau-de-cuivre'] },
		]

		const constats = pourLaRegle(controlerDossier(dossier), 'indice-sans-source')

		// LECTURE À PLAT, nommée : chacun compte l'arête entrante de l'autre, donc UN
		// producteur chacun, donc deux ALERTES. L'implémentation retenue est celle-là,
		// et la saturation transitive par point fixe — charge d'IT6, qu'elle traverse
		// avec l'atteignabilité — fera DÉLIBÉRÉMENT basculer cette assertion en deux
		// BLOQUANTS. Le sens d'erreur de la lecture à plat est sous-gradué, jamais
		// éteint : c'est ce qui la rend acceptable sur une règle bloquante.
		expect(constats.map((constat) => `${constat.entityId} → ${constat.niveau}`)).toEqual([
			'indice.anneau-de-cuivre → alerte',
			'indice.anneau-de-fer → alerte',
		])
		expect(controlerDossier(dossier).jouable).toBe(true)
	})

	it('mene_a compte comme producteur', () => {
		const dossier = clone()
		// UN SEUL champ : l'effet du jalon, qui révélait `sceau-brise`, est vidé. Il
		// lui reste le savoir d'Aldûr ET l'arête `mene_a` de `cendres-tiedes` — DEUX
		// producteurs, donc le silence.
		dossier.charpente.jalons[0].effet = []
		expect(pourLaRegle(controlerDossier(dossier), 'indice-sans-source').map((constat) => constat.entityId)).toEqual([
			'indice.cendres-tiedes',
		])

		// DISCRIMINANT : la même mutation, l'arête retirée en plus, fait tomber
		// `sceau-brise` à UN seul producteur et l'alerte apparaît. Sans cette moitié,
		// l'assertion ci-dessus serait verte que `mene_a` soit compté ou non.
		dossier.monde.indices[0].mene_a = []
		expect(
			pourLaRegle(controlerDossier(dossier), 'indice-sans-source').map(
				(constat) => `${constat.entityId} → ${constat.niveau}`,
			),
		).toEqual(['indice.cendres-tiedes → alerte', 'indice.sceau-brise → alerte'])
	})

	it('un indice qui se mene_a lui-meme est compte comme tout autre arete, jamais un plantage', () => {
		const dossier = clone()
		// UN SEUL champ. L'auto-référence est LÉGALE au schéma (KR-194) et
		// `validate.test.ts` le prouve côté validateur ; ce qui n'était prouvé NULLE
		// PART, c'est ce que le COMPTEUR en fait.
		dossier.monde.indices = [{ id: 'indice.A', mene_a: ['indice.A'] }]

		// Elle compte pour UN producteur — le sien —, donc ALERTE et non BLOQUANT.
		// C'est la même sous-gradation que le cycle `A↔B` ci-dessus, et pour la même
		// raison : la lecture est À PLAT, elle ne vérifie pas que l'amont soit
		// lui-même atteignable. Un indice qui n'est mené que par lui-même est en
		// vérité inatteignable ; la saturation d'it6 fera basculer cette assertion en
		// `bloquant`, DÉLIBÉRÉMENT.
		expect(
			pourLaRegle(controlerDossier(dossier), 'indice-sans-source').map(
				(constat) => `${constat.entityId} → ${constat.niveau}`,
			),
		).toEqual(['indice.A → alerte'])

		// DISCRIMINANT : l'arête retirée, le même indice tombe à ZÉRO producteur.
		// Sans cette moitié, l'assertion ci-dessus serait verte que l'auto-référence
		// soit comptée, ignorée, ou qu'elle fasse lever.
		dossier.monde.indices = [{ id: 'indice.A' }]
		expect(
			pourLaRegle(controlerDossier(dossier), 'indice-sans-source').map(
				(constat) => `${constat.entityId} → ${constat.niveau}`,
			),
		).toEqual(['indice.A → bloquant'])
	})

	it('les quatre sites de deltas sont tous lus', () => {
		// LA GARDE KR-199 N'EST PAS L'ÉNUMÉRATION, C'EST LA MESURE : « les quatre »
		// prouvé sur trois est un échantillon. Le compte vient de la TABLE, donc un
		// cinquième emplacement d'effets ajouté à `CHEMINS_DE_DELTAS` fait rougir cette
		// ligne avant que quiconque ait à se demander si la règle le lit.
		expect(CHEMINS_DE_DELTAS).toHaveLength(4)

		const REVELATION: Delta = { delta: 'reveler_indice', cibles: [INDICE_ORPHELIN] }
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

		// Les clés SONT les chemins de la table, dans son ordre — jamais quatre
		// littéraux de plus, qui dériveraient d'elle en silence.
		expect(Object.keys(SITES)).toEqual(CHEMINS_DE_DELTAS.map((chemin) => chemin.path))

		for (const [chemin, planter] of Object.entries(SITES)) {
			// UN SITE À LA FOIS, sur un clone NEUF : un dossier qui les porterait tous
			// les quatre resterait vert même si trois d'entre eux n'étaient jamais lus.
			const dossier = cloneIndiceOrphelin()
			const niveauDe = (): string =>
				`${chemin} → ${pourLaRegle(controlerDossier(dossier), 'indice-sans-source')[0]?.niveau}`

			// Rouge AVANT, pour que le vert d'après prouve le site et non l'absence de
			// règle.
			expect(niveauDe()).toBe(`${chemin} → bloquant`)
			planter(dossier)
			expect(niveauDe()).toBe(`${chemin} → alerte`)
		}
	})

	it('un seul site filtre le delta reveler_indice dans brain/dossier', () => {
		// CONTREPARTIE de la charge d'extraction d'it6 : la définition de « ce delta
		// produit un indice » est écrite UNE fois. Deux sites dériveraient le jour où
		// `atteignabilite.ts` naîtra — et c'est un DÉPLACEMENT, relisible en diff, que
		// la revue d'it6 doit pouvoir constater, pas une réécriture.
		//
		// La marque est construite par morceaux pour que la présence de ce test ne
		// suffise pas à faire passer le balayage ; les fichiers de test sont exclus,
		// puisqu'ils PLANTENT des effets sans jamais les filtrer.
		const MARQUE = ["'", 'reveler_indice', "'"].join('')
		const porteurs = fs
			.readdirSync(__dirname)
			.filter((fichier) => fichier.endsWith('.ts') && !fichier.endsWith('.test.ts'))
			.filter((fichier) => fs.readFileSync(path.join(__dirname, fichier), 'utf8').includes(MARQUE))

		expect(porteurs).toEqual(['controles.ts'])
	})
})

describe('depart-desert, personnage-sans-presence, personnage-sans-voix', () => {
	it('le lieu de depart desert bloque, et se tait sur un dossier sans personnage', () => {
		const dossier = cloneSansPresence()
		const constats = pourLaRegle(controlerDossier(dossier), 'depart-desert')

		expect(constats).toHaveLength(1)
		expect(`${constats[0].niveau} · ${constats[0].section} · ${constats[0].path}`).toBe(
			'bloquant · depart · charpente.depart.lieu_id',
		)
		// Le OÙ désigne un LIEU quand la SECTION désigne Départ : deux champs
		// distincts, et la troisième démonstration de KR-219 dans cette suite.
		expect(constats[0].location).toBe('Lieu « Val-Cendre »')
		expect(controlerDossier(dossier).jouable).toBe(false)

		// L'AUTRE MOITIÉ — la garde de VACUITÉ, qui n'est pas une hygiène mais une
		// nécessité logique : « désert » est un prédicat universel, et un prédicat
		// universel sur l'ensemble vide est VRAI. `construireAmorce` sème
		// `personnages: []`, donc sans cette garde TOUT dossier neuf porterait ce
		// bloquant — et le rapport du dossier semé ne compterait plus quatre lignes.
		const rapportSeme = controlerDossier(seme())
		expect(pourLaRegle(rapportSeme, 'depart-desert')).toEqual([])
		expect(rapportSeme.controles).toHaveLength(CHAMPS_SEMES.length)
	})

	it('un depart pendant ne produit aucun controle', () => {
		const dossier = cloneSansPresence()
		const resolu = dossier.charpente.depart.lieu_id

		// TROISIÈME GARDE : le départ ne résout plus aucun lieu. C'est une anomalie
		// `error` du validateur, que le canal des contrôles ne doit pas DOUBLER
		// (KR-217) — et un dossier PERSISTÉ ne peut de toute façon jamais la porter,
		// `DossierService.update` refusant l'écriture (KR-225). Sans cette garde,
		// `localiserEntite` rendrait en production « Lieu n°0 (sans nom) », sur un rang
		// qui n'existe pas.
		dossier.charpente.depart.lieu_id = 'lieu.englouti'
		expect(pourLaRegle(controlerDossier(dossier), 'depart-desert')).toEqual([])

		// Discriminance : le MÊME dossier, départ résolu, porte bien le bloquant — sans
		// quoi ce test serait vert parce que la règle est muette partout.
		dossier.charpente.depart.lieu_id = resolu
		expect(pourLaRegle(controlerDossier(dossier), 'depart-desert')).toHaveLength(1)
	})

	it('un personnage sans presence alerte, un personnage place se tait', () => {
		const dossier = clone()
		const place = dossier.monde.personnages[0]
		// DEUX ENTITÉS dans le MÊME test : un test mono-entité ne distingue pas une
		// alerte PAR ENTITÉ d'un voyant global (KR-197/202).
		dossier.monde.personnages = [place, { ...place, id: 'pnj.la-vigie', nom: 'La vigie', presence: [] }]

		const constats = pourLaRegle(controlerDossier(dossier), 'personnage-sans-presence')

		expect(constats.map((constat) => `${constat.entityId} → ${constat.niveau}`)).toEqual(['pnj.la-vigie → alerte'])
		expect(`${constats[0].section} · ${constats[0].path}`).toBe('personnages · monde.personnages[].presence[].lieu_id')
		expect(constats[0].location).toBe('Personnage « La vigie »')
		// ALERTE et non bloquant : KR-224 porte sur l'EXISTENCE d'un chemin, et un
		// autre chemin peut mener à ce personnage plus tard dans la partie.
		expect(controlerDossier(dossier).jouable).toBe(true)
	})

	it('personnage sans voix propre ne se fonde jamais sur une valeur de curseur', () => {
		const dossier = clone()
		const muet: Dossier['monde']['personnages'][number] = {
			...dossier.monde.personnages[0],
			id: 'pnj.la-vigie',
			nom: 'La vigie',
		}
		delete muet.caractere

		// LE TÉMOIN CALME porte un `caractere` PRÉSENT dont les six curseurs sont au
		// PLANCHER — l'état exact que `CURSEURS_INITIAUX` sème, donc indistinguable
		// d'un réglage délibéré (KR-221). Une règle qui se fonderait sur la VALEUR d'un
		// curseur le signalerait comme non réglé ; celle-ci ne lit que la PRÉSENCE de
		// répliques, et se tait.
		const parlant = {
			...dossier.monde.personnages[0],
			caractere: { curseurs: CURSEURS_INITIAUX, parler: ['Ne traînez pas dehors après la cloche.'] },
		}
		dossier.monde.personnages = [muet, parlant]

		const constats = pourLaRegle(controlerDossier(dossier), 'personnage-sans-voix')

		// `caractere` ABSENT et `parler` vide se valent : le linter ne détecte
		// « jamais réglé » que par présence ou absence.
		expect(constats.map((constat) => `${constat.entityId} → ${constat.niveau}`)).toEqual(['pnj.la-vigie → info'])
		expect(`${constats[0].section} · ${constats[0].path}`).toBe('personnages · monde.personnages[].caractere.parler[]')

		// Les SIX curseurs du témoin calme sont bien TOUS au plancher — balayés depuis
		// le registre, jamais six littéraux. Sans cette ligne, le témoin pourrait
		// porter des valeurs hautes et le test ne dirait rien de KR-221.
		expect(CURSEUR_VALUES.map((curseur) => CURSEURS_INITIAUX[curseur])).toEqual(CURSEUR_VALUES.map(() => CURSEUR_MIN))

		// `info` ne bloque pas — et n'est pas non plus une alerte.
		expect(controlerDossier(dossier).jouable).toBe(true)
	})
})

describe('controleRemediation, la ligne QUOI FAIRE', () => {
	it('rend une consigne distincte pour chacun des quatre controles', () => {
		const controles = controlerDossier(seme()).controles
		const consignes = controles.map(controleRemediation)

		expect(consignes).toHaveLength(CHAMPS_SEMES.length)
		// DISTINCTES : une consigne unique pour quatre champs ne dirait à l'auteur
		// quel geste faire sur aucun d'eux.
		expect(new Set(consignes).size).toBe(consignes.length)
		for (const consigne of consignes) {
			expect(`${consigne} → ${consigne.startsWith('Rédigez')}`).toBe(`${consigne} → true`)
			expect(consigne).not.toContain(MARQUEUR_A_ECRIRE)
		}
	})

	it('un controle forge hors de la table ne fait pas lever controleRemediation', () => {
		const forge: Controle = {
			id: 'amorce-non-redigee',
			niveau: 'alerte',
			section: 'canon',
			message: 'Un constat fabrique par un test.',
			location: 'CANON',
			path: 'canon.chemin-inconnu',
		}

		// Impossible sur un rapport réel, mais un appelant tient des `Controle` en
		// main : la consigne est VIDE plutôt que levée (le panneau tomberait) ou
		// inventée (un texte que personne n'a écrit).
		expect(controleRemediation(forge)).toBe('')

		// MÊME REPLI POUR LA RÈGLE À DEUX SEUILS, dont la consigne dispatche sur le
		// NIVEAU et non sur le `path` : `info` n'est pas une de ses deux clés de prose,
		// et son `Record` ne porte volontairement pas cette ligne — la table est écrite
		// sur les deux seuils qu'elle émet, jamais sur les trois mots de
		// `NiveauControle`.
		const forgeIndice: Controle = {
			id: 'indice-sans-source',
			niveau: 'info',
			section: 'indices',
			message: 'Un constat fabrique par un test.',
			location: 'Indice n°1 (sans nom)',
			path: 'monde.indices[].id',
		}
		expect(controleRemediation(forgeIndice)).toBe('')

		// Discriminance : les deux niveaux que la règle émet VRAIMENT rendent, eux, une
		// consigne non vide et DISTINCTE l'une de l'autre — sans quoi l'assertion
		// ci-dessus serait verte parce que la table est vide.
		const consignes = (['bloquant', 'alerte'] as const).map((niveau) => controleRemediation({ ...forgeIndice, niveau }))
		expect(consignes.filter((consigne) => consigne === '')).toEqual([])
		expect(new Set(consignes).size).toBe(consignes.length)
	})
})

describe('avertissement-de-validation, le pont vers les avertissements du validateur', () => {
	it('allume sur un champ mute, se tait sur le clone intact, et porte le decompte mesure', () => {
		// (a) LE CLONE INTACT — aucun avertissement, donc aucune ligne de CETTE règle.
		// Sans cette moitié, un pont câblé sur « tout » serait indistinguable d'un
		// pont juste. Le compte est FILTRÉ : ce que le clone porte par ailleurs est la
		// ligne de base d'une autre règle, épinglée par sa propre sonde.
		expect(pourLaRegle(controlerDossier(clone()), 'avertissement-de-validation')).toEqual([])

		// (b) UN SEUL champ muté, au premier mot AU-DELÀ du budget — et le budget est
		// LU dans la table qui fait foi, jamais retapé ici (KR-165).
		const juste = budgetDe('canon.mj') + 1
		const large = budgetDe('canon.mj') + 50
		const rougeJuste = pourLaRegle(controlerDossier(cloneCanonLong(juste)), 'avertissement-de-validation')
		const rougeLarge = pourLaRegle(controlerDossier(cloneCanonLong(large)), 'avertissement-de-validation')

		expect(rougeJuste).toHaveLength(1)
		expect(`${rougeJuste[0].niveau} · ${rougeJuste[0].section} · ${rougeJuste[0].path}`).toBe(
			'alerte · canon · canon.mj',
		)
		// LE OÙ EST REPRIS, jamais déclaré : `validate.ts` le résout avec la MÊME
		// `localiserEntite` que ce module importe déjà, et c'est lui qui sépare les
		// deux budgets du canon, dont les messages sont mot pour mot identiques.
		expect(rougeJuste[0].location).toBe('Canon (MJ)')

		// DEUX VOLUMES DANS LE MÊME TEST, et c'est ce qui PROUVE la reprise au lieu de
		// l'affirmer : un message ÉCRIT dans la table de mappage porterait la même
		// phrase aux deux volumes.
		expect(`${juste} mots → ${rougeJuste[0].message.includes(String(juste))}`).toBe(`${juste} mots → true`)
		expect(`${large} mots → ${rougeLarge[0].message.includes(String(large))}`).toBe(`${large} mots → true`)
		expect(rougeJuste[0].message).not.toBe(rougeLarge[0].message)

		// (c) LE QUOI FAIRE est celui du SITE, écrit pour le rapport — jamais la
		// consigne du validateur, qui porte le glyphe d'un autre registre.
		expect(controleRemediation(rougeJuste[0])).toBe('Resserrez le synopsis MJ (Canon → Synopsis MJ).')

		// (d) LE VOYANT S'ÉTEINT À LA BORNE, dans le MÊME test : le budget exact ne
		// dit rien, le budget plus un parle. C'est la moitié « silence » du critère.
		expect(pourLaRegle(controlerDossier(cloneCanonLong(budgetDe('canon.mj'))), 'avertissement-de-validation')).toEqual(
			[],
		)
	})

	it('aucune des quatre mutations ne produit un bloquant, et jouable ne bouge pas', () => {
		// TROIS CODES, atteints par QUATRE mutations d'UN SEUL champ.
		// `condition-sans-expr` en fournit DEUX témoins parce que ses deux messages
		// divergent déjà dans `validate.ts` : une fin parle de condition structurée,
		// une étape de plan parle de durée.
		const MUTES: Record<string, Dossier> = {
			'texte-trop-long': cloneCanonLong(budgetDe('canon.mj') + 1),
			'revelation-sans-porte': cloneSansPorte(),
			'condition-sans-expr · fin': cloneFinSansExpr(),
			'condition-sans-expr · etape': cloneEtapeSansDuree(),
		}

		// L'ensemble FERMÉ de l'entrée ne porte pas `bloquant`, et c'est déjà tenu par
		// le type de la table de mappage ; on le vérifie aussi à l'EXÉCUTION, un
		// constat assemblé dynamiquement échappant au contrôle d'excès de propriété.
		expect(CONTROLES['avertissement-de-validation'].niveaux).toEqual(NIVEAUX_DU_PONT)
		// La ligne de base, sans laquelle « jouable inchangé » ne dirait rien.
		expect(controlerDossier(clone()).jouable).toBe(true)

		for (const [nom, dossier] of Object.entries(MUTES)) {
			const rapport = controlerDossier(dossier)
			const lignes = pourLaRegle(rapport, 'avertissement-de-validation')
			expect(`${nom} → ${lignes.length}`).toBe(`${nom} → 1`)
			expect(`${nom} → ${lignes[0].niveau}`).not.toBe(`${nom} → bloquant`)
			expect(`${nom} → ${NIVEAUX_DU_PONT.includes(lignes[0].niveau)}`).toBe(`${nom} → true`)
			// AUCUN DE CES DIX SITES, PRIS SEUL, NE REND L'AVENTURE INJOUABLE — et
			// jamais « parce que ce sont des avertissements » : la règle de COLLECTION
			// que l'itération 6 doit écrire sera bloquante, et lira le même canal.
			expect(`${nom} → ${rapport.jouable}`).toBe(`${nom} → true`)
		}
	})

	it('la table couvre les dix sites du validateur, aucun de plus, aucune ligne morte', () => {
		// LES DIX SITES BALAYÉS DEPUIS LES REGISTRES QUI FONT FOI (KR-199) — jamais
		// dix littéraux, qui dériveraient d'eux en silence. QUATRE budgets, QUATRE
		// familles de conditions en alerte, et DEUX sites que `validate.ts` écrit à la
		// main, qu'aucune table ne porte.
		const ISOLES = ['monde.personnages[].savoirs[].revele_si', 'monde.personnages[].plan_actions[].si_bloque']
		const ATTENDUS = [
			...BUDGETS_DE_MOTS.map((budget) => budget.path),
			...FAMILLES_DE_CONDITIONS.filter((famille) => famille.alerteSansExpr).map((famille) => famille.texte),
			...ISOLES,
		]
		expect(ATTENDUS).toHaveLength(10)
		expect([...Object.keys(TEMOINS_DU_PONT)].sort()).toEqual([...ATTENDUS].sort())

		// (a) CHACUN A SON ENTRÉE, prouvé À L'EXÉCUTION : le témoin de chaque site
		// produit UNE ligne, à CE chemin, avec une consigne non vide.
		for (const chemin of ATTENDUS) {
			const lignes = pourLaRegle(controlerDossier(TEMOINS_DU_PONT[chemin]()), 'avertissement-de-validation')
			expect(`${chemin} → ${lignes.map((ligne) => ligne.path).join(', ')}`).toBe(`${chemin} → ${chemin}`)
			expect(`${chemin} → ${controleRemediation(lignes[0]) !== ''}`).toBe(`${chemin} → true`)
		}

		// DIX CONSIGNES DISTINCTES : une consigne partagée ne dirait à l'auteur quel
		// geste faire sur aucun des sites qui la partagent.
		const consignes = ATTENDUS.map(
			(chemin) => pourLaRegle(controlerDossier(TEMOINS_DU_PONT[chemin]()), 'avertissement-de-validation')[0],
		).map(controleRemediation)
		expect(new Set(consignes).size).toBe(consignes.length)

		// (b) AUCUNE LIGNE MORTE. La table de mappage est PRIVÉE — elle n'a qu'un
		// appelant, et l'exporter pour un test en ferait un contrat —, donc ses clés
		// se lisent dans sa SOURCE, entre sa déclaration et la fonction qui la suit.
		// Une onzième ligne qu'aucun avertissement ne peut atteindre ne se verrait
		// nulle part ailleurs : par définition, elle ne produit rien.
		const BLOC_DES_SITES = SOURCE_CONTROLES.slice(
			SOURCE_CONTROLES.indexOf('const SITES_AVERTISSEMENT'),
			SOURCE_CONTROLES.indexOf('function cheminDeTable'),
		)
		const declarees = BLOC_DES_SITES.split('\n')
			.map((ligne) => /^\t'(.+)': /.exec(ligne))
			.filter((trouve): trouve is RegExpExecArray => trouve !== null)
			.map((trouve) => trouve[1])
		expect(declarees).toHaveLength(10)
		expect([...declarees].sort()).toEqual([...ATTENDUS].sort())

		// (c) LE RÉSIDU, et il faut le nommer : les deux sites isolés sont écrits À LA
		// MAIN dans `validate.ts`, donc (a) ne peut pas les découvrir tout seul.
		// QUATRE sites d'écriture pour DIX lignes de table — les deux registres se
		// DÉPLIENT, les deux isolés non. Un cinquième emplacement écrit à la main
		// renvoie son auteur ICI, sans quoi son avertissement n'atteindrait le rapport
		// de personne. Ne pas confondre 4 et 10 : les deux gardes sont complémentaires
		// et aucune n'est redondante.
		expect(SOURCE_VALIDATE.split('warnings.push(').length - 1).toBe(4)
	})

	it('le code declare par chaque site est celui que le validateur produit vraiment', () => {
		// LE CHAMP `code` DE LA TABLE EST DÉCLARÉ ET JAMAIS LU par le module — il ne
		// sert qu'ici, et sans cette sonde la table dériverait SANS BRUIT : un site
		// dont le validateur changerait de code continuerait de rendre sa ligne, avec
		// la mauvaise prose et la mauvaise consigne, sans qu'aucun test rougisse.
		//
		// La table étant privée, ses `code` se lisent dans sa SOURCE, par un
		// parcours de ses lignes — même geste que le compte de clés ci-dessus.
		const BLOC_DES_SITES = SOURCE_CONTROLES.slice(
			SOURCE_CONTROLES.indexOf('const SITES_AVERTISSEMENT'),
			SOURCE_CONTROLES.indexOf('function cheminDeTable'),
		)
		const codeDeclare: Record<string, string> = {}
		let siteCourant = ''
		for (const ligne of BLOC_DES_SITES.split('\n')) {
			const cle = /^\t'(.+)': /.exec(ligne)
			if (cle !== null) siteCourant = cle[1]
			const code = /^\t\tcode: '(.+)',$/.exec(ligne)
			if (code !== null && siteCourant !== '') codeDeclare[siteCourant] = code[1]
		}
		expect(Object.keys(codeDeclare)).toHaveLength(10)

		// LES TROIS CODES ATTENDUS, écrits ici depuis la table du plan — un
		// quatrième code qui n'existerait pas dans l'union ne compilerait pas.
		const CODES_DU_PONT: readonly DossierIssueCode[] = [
			'texte-trop-long',
			'condition-sans-expr',
			'revelation-sans-porte',
		]

		for (const [chemin, faireLeTemoin] of Object.entries(TEMOINS_DU_PONT)) {
			const codesProduits = validateDossier(faireLeTemoin()).warnings.map((avertissement) => avertissement.code)
			expect(`${chemin} → ${codesProduits.join(', ')}`).toBe(`${chemin} → ${codeDeclare[chemin]}`)
			expect(`${chemin} → ${CODES_DU_PONT.includes(codesProduits[0])}`).toBe(`${chemin} → true`)
		}
	})

	it('la section de chaque ligne du pont est declaree, et le module ne decoupe jamais un chemin', () => {
		// LES DIX VALEURS ATTENDUES, écrites ici depuis la table du plan d'itération —
		// jamais relues dans le module qu'elles contrôlent. QUATRE sections pour dix
		// sites, et QUATRE de ces sites sont enracinés dans `canon` : aucun prédicat
		// portant sur un constat ne pourrait y distinguer une section DÉCLARÉE d'une
		// section dérivée, les deux chaînes coïncidant. C'est ce que la garde de
		// SOURCE, en bas de ce test, couvre et que l'autre ne peut pas couvrir.
		const SECTION_ATTENDUE: Record<string, SectionId> = {
			'canon.mj': 'canon',
			'canon.partage': 'canon',
			'charpente.jalons[].enonce_texte': 'jalons-fins',
			'monde.conditions.climat[].manifestation': 'conditions',
			'canon.objectifs[].reussi_si_texte': 'canon',
			'canon.objectifs[].echoue_si_texte': 'canon',
			'charpente.fins[].condition_texte': 'jalons-fins',
			'monde.personnages[].contre_mesures[].declencheur_texte': 'personnages',
			'monde.personnages[].savoirs[].revele_si': 'personnages',
			'monde.personnages[].plan_actions[].si_bloque': 'personnages',
		}
		// La table des attendus est TOTALE sur les dix témoins : un onzième site sans
		// section décidée ne passerait pas cette ligne.
		expect([...Object.keys(SECTION_ATTENDUE)].sort()).toEqual([...Object.keys(TEMOINS_DU_PONT)].sort())

		for (const [chemin, faireLeTemoin] of Object.entries(TEMOINS_DU_PONT)) {
			const rapport = controlerDossier(faireLeTemoin())
			const lignes = pourLaRegle(rapport, 'avertissement-de-validation')
			expect(`${chemin} → ${lignes.length}`).toBe(`${chemin} → 1`)
			expect(`${chemin} → ${lignes[0].section}`).toBe(`${chemin} → ${SECTION_ATTENDUE[chemin]}`)
			// La pastille de section s'allume AVEC la ligne : une section déclarée hors
			// de `SECTIONS` laisserait `parSection` muet, et la flèche de la ligne
			// pointerait dans le vide — état illégal représentable.
			expect(`${chemin} → ${rapport.parSection[lignes[0].section]}`).toBe(`${chemin} → ${lignes[0].niveau}`)
		}

		// LA GARDE DE `path` AMENDÉE, éprouvée sur les DIX sites et pas seulement sur
		// celui que le balayage d'it1 rencontre : sept sont des clés, trois sont des
		// CONTENEURS. Le point final du prédicat n'est pas décoratif — le témoin
		// ci-dessous est exactement ce qu'un `startsWith` nu laisserait passer.
		for (const chemin of Object.keys(TEMOINS_DU_PONT)) {
			expect(`${chemin} → ${estCheminDeChamp(chemin)}`).toBe(`${chemin} → true`)
		}
		expect(estCheminDeChamp('canon.m')).toBe(false)

		// L'INVARIANT LUI-MÊME, et non son proxy : toute dérivation d'une section
		// depuis un chemin commencerait par un découpage. Universelle, cette garde
		// couvre les dix sites, `canon` compris — et `cheminDeTable` ne l'enfreint
		// pas, qui EFFACE des indices sans jamais lire un segment.
		expect(SOURCE_CONTROLES).not.toContain("split('.')")
	})

	it('le calme des deux fixtures et du dossier neuf ne bouge pas', () => {
		// LA MOITIÉ SILENCIEUSE : une itération qui allume sans se taire ne prouve pas
		// plus qu'une qui se tait sans allumer. Les trois dossiers que le dépôt
		// possède ne portent AUCUN avertissement — ils sont FINIS, ce qu'un dossier
		// d'auteur en cours n'est jamais —, et c'est ce qui rend ce silence mesurable.
		//
		// L'ÉPINGLE PORTE SUR CE QUE LA RÈGLE DÉCIDE (règle, niveau, section, chemin)
		// et jamais sur le NOM des entités, qui appartient aux fixtures : deux lignes
		// jumelles s'y comptent donc deux fois, ce qui est exactement le propos.
		const ligne = (controle: Controle): string =>
			`${controle.id} · ${controle.niveau} · ${controle.section} · ${controle.path}`
		const SANS_PRESENCE = 'personnage-sans-presence · alerte · personnages · monde.personnages[].presence[].lieu_id'
		const SANS_VOIX = 'personnage-sans-voix · info · personnages · monde.personnages[].caractere.parler[]'

		const neuf = controlerDossier(seme())
		expect(neuf.controles.map(ligne)).toEqual([
			'amorce-non-redigee · bloquant · depart · charpente.depart.texte_ouverture_joueur',
			'amorce-non-redigee · alerte · canon · canon.mj.synopsis_mj',
			'amorce-non-redigee · alerte · canon · canon.partage.accroche_joueur',
			'amorce-non-redigee · alerte · canon · canon.ton',
		])
		expect(neuf.jouable).toBe(false)

		const minimal = controlerDossier(clone())
		expect(minimal.controles.map(ligne)).toEqual(['indice-sans-source · alerte · indices · monde.indices[].id'])
		expect(minimal.jouable).toBe(true)

		const reference = controlerDossier(cloneReference())
		expect(reference.controles.map(ligne)).toEqual([
			'depart-desert · bloquant · depart · charpente.depart.lieu_id',
			SANS_PRESENCE,
			SANS_PRESENCE,
			SANS_PRESENCE,
			SANS_PRESENCE,
			SANS_VOIX,
			SANS_VOIX,
			SANS_VOIX,
			SANS_VOIX,
			SANS_VOIX,
		])
		expect(reference.jouable).toBe(false)

		// LE MÉCANISME du silence, nommé plutôt que constaté : aucun des trois ne
		// porte d'avertissement, donc le pont n'a rien à mapper. Sans cette ligne, un
		// pont DÉBRANCHÉ passerait les trois épingles ci-dessus.
		for (const [nom, dossier] of Object.entries({ neuf: seme(), minimal: clone(), reference: cloneReference() })) {
			expect(`${nom} → ${validateDossier(dossier).warnings.length}`).toBe(`${nom} → 0`)
			expect(pourLaRegle(controlerDossier(dossier), 'avertissement-de-validation')).toEqual([])
		}
	})

	it('les six regles ecrivent le meme registre de langue, sur les deux colonnes', () => {
		// CE QUE L'AUTEUR NE DOIT JAMAIS LIRE : le glyphe d'un autre registre, une clé
		// du schéma, une mention de canal, un geste d'import. DISCRIMINANCE ACQUISE
		// PAR MESURE et non par espoir : les phrases réelles de `condition-sans-expr`
		// portent une clé JSON dans leur prose, si bien que brancher le message du
		// validateur verbatim sur l'un de ces cinq sites FAIT ROUGIR cette sonde —
		// branchement EXÉCUTÉ avant adoption, puis retiré (BUG-084 : une couleur de
		// test annoncée n'est pas une couleur de test observée).
		const TERMES_INTERDITS = [
			'↪',
			'_texte',
			'_expr',
			'si_bloque',
			'revele_si',
			'réimport',
			'bloquant',
			'warning',
			'error',
		]

		const rapports = [
			controlerDossier(seme()),
			controlerDossier(cloneIndiceOrphelin()),
			controlerDossier(cloneSansPresence()),
			controlerDossier(cloneSansVoix()),
			...Object.values(TEMOINS_DU_PONT).map((faireLeTemoin) => controlerDossier(faireLeTemoin())),
		]
		const controles = rapports.flatMap((rapport) => rapport.controles)

		// Discriminance : les SIX règles sont représentées dans ce qui est balayé, et
		// les DIX sites du pont aussi.
		expect(new Set(controles.map((controle) => controle.id)).size).toBe(Object.keys(CONTROLES).length)
		expect(
			new Set(
				controles.filter((controle) => controle.id === 'avertissement-de-validation').map((controle) => controle.path),
			).size,
		).toBe(10)

		for (const controle of controles) {
			for (const colonne of [controle.message, controleRemediation(controle)]) {
				const repere = `${controle.id} · ${controle.path}`
				// AUCUNE N'EST VIDE : deux silences indistinguables — « rien à dire » et
				// « personne ne l'a écrit » — sont un défaut, pas une absence.
				expect(`${repere} → ${colonne !== ''}`).toBe(`${repere} → true`)
				for (const terme of TERMES_INTERDITS) {
					expect(`${repere} · ${terme} → ${colonne.includes(terme)}`).toBe(`${repere} · ${terme} → false`)
				}
			}
		}
	})
})
