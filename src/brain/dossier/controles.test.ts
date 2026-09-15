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
} from './controles'
import { DESTINATION_DES_CHAMPS } from './destinations'
import { estCleDe } from './identifiers'
import { SECTIONS, type SectionId } from './sections'
import type { Dossier } from './types'

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
const SOURCE_CONTROLES = fs.readFileSync(path.join(__dirname, 'controles.ts'), 'utf8')

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

		// (a) le clone INTACT — aucune prose marquée, donc aucun contrôle. Sans cette
		// moitié, un linter qui signale tout serait indistinguable d'un linter juste.
		expect(controlerDossier(dossier).controles).toEqual([])
		expect(controlerDossier(dossier).jouable).toBe(true)

		// (b) UN SEUL champ muté.
		dossier.charpente.depart.texte_ouverture_joueur = `${MARQUEUR_A_ECRIRE} ${intact}`
		const rouge = controlerDossier(dossier)
		expect(rouge.controles).toHaveLength(1)
		expect(`${rouge.controles[0].path} → ${rouge.controles[0].niveau}`).toBe(
			'charpente.depart.texte_ouverture_joueur → bloquant',
		)
		expect(rouge.jouable).toBe(false)

		// (c) restauration dans le MÊME test : le voyant s'éteint.
		dossier.charpente.depart.texte_ouverture_joueur = intact
		expect(controlerDossier(dossier).controles).toEqual([])
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
		expect(rapport.controles).toHaveLength(1)
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
	})

	it('tout constat rend un niveau declare par sa regle', () => {
		for (const id of Object.keys(CONTROLES) as ControleId[]) {
			const descripteur = CONTROLES[id]
			const constats = descripteur.controler(seme())

			// Discriminance : une règle muette rendrait la boucle ci-dessous vraie sans
			// rien prouver.
			expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
			for (const constat of constats) {
				expect(`${id} · ${constat.path} → ${descripteur.niveaux.includes(constat.niveau)}`).toBe(
					`${id} · ${constat.path} → true`,
				)
			}
		}
	})

	it('les quatre path sont des cles de DESTINATION_DES_CHAMPS', () => {
		const rapport = controlerDossier(seme())

		expect(rapport.controles).toHaveLength(CHAMPS_SEMES.length)
		for (const controle of rapport.controles) {
			// Appartenance PROPRE, jamais `in` (KR-175). Un `path` libre ferait du
			// retour vers le champ fautif une chaîne que personne ne résout.
			expect(`${controle.path} → ${estCleDe(DESTINATION_DES_CHAMPS, controle.path)}`).toBe(`${controle.path} → true`)
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

	it('le rapport ne passe jamais par le canal errors ou warnings du validateur', () => {
		// Un dossier PERSISTÉ ne porte jamais d'anomalie `error` (KR-225) : brancher
		// ce rapport sur ce canal allumerait un voyant qui ne peut pas s'allumer, et
		// ferait rougir les suites qui épinglent déjà ce canal (KR-217).
		expect(SOURCE_CONTROLES).not.toContain('validateDossier')
		expect(SOURCE_CONTROLES).not.toContain("from './validate'")
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
		expect(controlerDossier(dossier).controles).toHaveLength(1)
	})

	it('cas limite : une prose vide ne plante pas et ne declenche pas', () => {
		const dossier = clone()
		dossier.canon.ton = ''

		const rapport = controlerDossier(dossier)
		expect(rapport.controles).toEqual([])
		expect(rapport.jouable).toBe(true)
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
	})
})
