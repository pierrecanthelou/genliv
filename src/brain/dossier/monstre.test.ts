import fs from 'node:fs'
import path from 'node:path'
import { BESTIARY, BESTIARY_BY_TEMPLATE } from '../bestiary'
import { monstreDeLaReference } from './monstre'
import type { Dossier } from './types'
import { PREFIXE_BESTIAIRE, validateDossier } from './validate'

/**
 * `monstreDeLaReference` — LA RÉSOLUTION D'UNE RÉFÉRENCE DE BESTIAIRE (n° 13
 * `moteur-combat`, it1, lot `contrat`).
 *
 * TROIS PROPRIÉTÉS, ET ELLES NE SE PROUVENT PAS DE LA MÊME FAÇON :
 *  · la RÉSOLUTION — balayée depuis `BESTIARY`, jamais N littéraux (KR-117/199) ;
 *  · le REFUS — chaque forme de référence qui ne désigne personne rend `undefined`,
 *    SANS lever, y compris les clés héritées d'`Object.prototype` (BUG-053) ;
 *  · l'ACCORD AVEC LE VALIDATEUR — `validateDossier` refuse à l'import exactement
 *    ce que ce module ne résout pas : deux décomposeurs de la même chaîne qui
 *    divergeraient ouvriraient un combat sans monstre sur un dossier accepté.
 *
 * ⚠ CE FICHIER N'ÉPINGLE AUCUNE VALEUR DE RÈGLE : il ne pose ni ne modifie aucune
 * entrée de `BESTIARY` (registre de la table dorée, `rules.golden.test.ts`) — il
 * vérifie qu'une référence mène à l'entrée QUE LE REGISTRE porte, et que la copie
 * rendue est conforme à celle-ci. Les valeurs du bestiaire restent épinglées là-bas,
 * depuis `docs/REGLES-DU-JEU.md` § 4.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

/** Le texte source de `monstre.ts`, fins de ligne NORMALISÉES (l'arbre de travail est en CRLF). */
function sourceDeMonstre(): string {
	return fs.readFileSync(path.join(__dirname, 'monstre.ts'), 'utf8').replace(/\r\n/g, '\n')
}

/** La source PRIVÉE DE SES COMMENTAIRES : la docstring NOMME `'bestiaire.'` pour dire qu'elle ne le retape pas. */
function sansCommentaires(texte: string): string {
	return texte.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/.*$/gm, '')
}

describe('monstreDeLaReference, la resolution', () => {
	it('resout bestiaire.<templateId> vers la configuration du monstre — CHAQUE entree du bestiaire', () => {
		// BALAYÉ DEPUIS `BESTIARY` (KR-117/199) : un monstre de plus entre ici sans
		// qu'on y pense, et le dénombrement empêche un balayage vide d'être vert.
		expect(BESTIARY.length).toBeGreaterThan(0)

		for (const modele of BESTIARY) {
			const monstre = monstreDeLaReference(`${PREFIXE_BESTIAIRE}${modele.templateId}`)

			// L'échec NOMME le monstre : `undefined` ne dirait pas LEQUEL ne résout pas.
			expect(`${modele.templateId} → ${monstre?.templateId}`).toBe(`${modele.templateId} → ${modele.templateId}`)
			expect(monstre).toEqual(modele)
		}
	})

	it('le gobelin et le squelette — les deux monstres des fixtures du disque — sont resolus par leur nom', () => {
		// KR-156 : les deux références viennent du FICHIER du dossier, jamais d'un
		// littéral de test. Le nom (`Gobelin`, `Squelette`) est celui de
		// `docs/REGLES-DU-JEU.md` § 4, Tier 1.
		const refMinimal = lire(CHEMIN_MINIMAL).monde.evenements[0].monstre_ref
		const refReference = lire(CHEMIN_REFERENCE).monde.evenements[0].monstre_ref
		expect(refMinimal).toBe('bestiaire.gobelin')
		expect(refReference).toBe('bestiaire.squelette')

		expect(monstreDeLaReference(refMinimal ?? '')?.name).toBe('Gobelin')
		expect(monstreDeLaReference(refReference ?? '')?.name).toBe('Squelette')
		expect(monstreDeLaReference(refMinimal ?? '')?.templateId).toBe('gobelin')
		expect(monstreDeLaReference(refReference ?? '')?.templateId).toBe('squelette')
	})

	it('rend une COPIE : la muter ne touche NI le registre NI la resolution suivante (COPY-ON-USE, KR-101)', () => {
		const premiere = monstreDeLaReference('bestiaire.gobelin')
		const seconde = monstreDeLaReference('bestiaire.gobelin')
		if (premiere === undefined || seconde === undefined || premiere.stats === undefined) {
			throw new Error('le gobelin doit résoudre, avec son bloc de stats')
		}
		const nomDuRegistre = BESTIARY_BY_TEMPLATE.gobelin.name
		const forceDuRegistre = BESTIARY_BY_TEMPLATE.gobelin.stats?.FO

		// Deux résolutions, deux objets distincts — y compris leurs objets imbriqués.
		expect(premiere).not.toBe(seconde)
		expect(premiere).not.toBe(BESTIARY_BY_TEMPLATE.gobelin)
		expect(premiere.stats).not.toBe(seconde.stats)
		expect(premiere.stats).not.toBe(BESTIARY_BY_TEMPLATE.gobelin.stats)
		expect(premiere.outcomes).not.toBe(BESTIARY_BY_TEMPLATE.gobelin.outcomes)

		// LA MUTATION : un consommateur fautif, le nom et la force du gobelin réécrits.
		premiere.name = 'Gobelin muté'
		premiere.stats.FO = 99

		expect(seconde.name).toBe(nomDuRegistre)
		expect(BESTIARY_BY_TEMPLATE.gobelin.name).toBe(nomDuRegistre)
		expect(BESTIARY_BY_TEMPLATE.gobelin.stats?.FO).toBe(forceDuRegistre)
		expect(monstreDeLaReference('bestiaire.gobelin')?.stats?.FO).toBe(forceDuRegistre)
	})
})

describe('monstreDeLaReference, le refus — jamais une exception', () => {
	it('undefined pour toute reference qui ne designe personne, y compris le prefixe seul et la casse', () => {
		const REFERENCES = [
			'', // vide
			'gobelin', // sans préfixe
			'bestiaire', // préfixe sans point
			'bestiaire.', // préfixe seul : templateId vide
			'bestiaire.dragon', // préfixe correct, monstre absent du jeu
			'bestiaire.griffon-des-cendres', // la référence pendante du test du validateur
			'Bestiaire.gobelin', // casse : la comparaison est EXACTE
			'BESTIAIRE.gobelin',
			' bestiaire.gobelin', // espace de bord : jamais normalisé
			'bestiaire.gobelin ',
			'bestiaire.Gobelin', // le templateId est sensible à la casse aussi
			'monstre.gobelin', // un autre espace de noms
			'lieu.val-cendre',
			'bestiaire.gobelin.extra', // un segment de trop
		]

		for (const reference of REFERENCES) {
			expect(`« ${reference} » → ${monstreDeLaReference(reference)}`).toBe(`« ${reference} » → undefined`)
		}

		// DISCRIMINANCE (KR-199) : la forme exacte, elle, résout — sans cette ligne,
		// quatorze `undefined` seraient vrais d'une fonction qui ne résout rien du tout.
		expect(monstreDeLaReference('bestiaire.gobelin')).toBeDefined()
	})

	it('BUG-053 : une cle heritee d Object.prototype ne passe JAMAIS pour un monstre, et ne leve pas', () => {
		// `BESTIARY_BY_TEMPLATE` est construit par `Object.fromEntries` : un test d'index
		// rendrait la FONCTION héritée `Object.prototype.toString`, et « bestiaire.toString »
		// passerait pour un monstre existant — combat ouvert sur une fonction.
		const HERITEES = ['toString', 'constructor', 'valueOf', 'hasOwnProperty', '__proto__', 'isPrototypeOf']

		for (const heritee of HERITEES) {
			expect(() => monstreDeLaReference(`bestiaire.${heritee}`)).not.toThrow()
			expect(`${heritee} → ${monstreDeLaReference(`bestiaire.${heritee}`)}`).toBe(`${heritee} → undefined`)
		}
		// Discriminant : ces clés SONT bien héritées par le registre — sans cela, la boucle
		// ci-dessus ne protégerait de rien.
		expect(typeof (BESTIARY_BY_TEMPLATE as Record<string, unknown>).toString).toBe('function')
	})
})

describe('monstreDeLaReference, l accord avec validateDossier', () => {
	it('le validateur refuse a l import EXACTEMENT les references que ce module ne resout pas', () => {
		// DEUX DÉCOMPOSEURS DE LA MÊME CHAÎNE (`validate.ts` § 5b, ce module) : s'ils
		// divergeaient, un dossier ACCEPTÉ ouvrirait un combat sans monstre — ou un
		// dossier valide serait refusé. La parité se prouve référence par référence,
		// contre le validateur RÉEL, sur la fixture minimale (dont les erreurs sont
		// vides, donc seul `monstre_ref` fait varier `ok`).
		const REFERENCES = [
			'bestiaire.gobelin',
			'bestiaire.squelette',
			'bestiaire.vampire',
			'bestiaire.dragon',
			'bestiaire.',
			'gobelin',
			'Bestiaire.gobelin',
			'bestiaire.toString',
			'bestiaire.constructor',
		]
		expect(validateDossier(lire(CHEMIN_MINIMAL)).ok).toBe(true)

		for (const reference of REFERENCES) {
			const dossier = lire(CHEMIN_MINIMAL)
			dossier.monde.evenements[0].monstre_ref = reference

			const accepte = validateDossier(dossier).ok
			const resolu = monstreDeLaReference(reference) !== undefined

			expect(`${reference} → validateur ${accepte}, resolution ${resolu}`).toBe(
				`${reference} → validateur ${resolu}, resolution ${resolu}`,
			)
		}
		// Les deux verdicts sont REPRÉSENTÉS : sans cela, la boucle serait verte sur une
		// liste qui n'exercerait qu'un côté.
		expect(REFERENCES.filter((reference) => monstreDeLaReference(reference) !== undefined).length).toBeGreaterThan(0)
		expect(REFERENCES.filter((reference) => monstreDeLaReference(reference) === undefined).length).toBeGreaterThan(0)
	})
})

describe('monstre.ts, les proprietes qui se lisent dans la SOURCE', () => {
	it('le prefixe est PREFIXE_BESTIAIRE, jamais un litteral retape ; l appartenance passe par estCleDe', () => {
		// BUG-053 / KR-165 : une troisième copie du préfixe divergerait en silence de
		// celle qui décide du refus à l'import. La source est privée de ses commentaires :
		// la docstring NOMME le littéral pour dire qu'elle ne le retape pas.
		const code = sansCommentaires(sourceDeMonstre())

		expect(code).toMatch(/\bPREFIXE_BESTIAIRE\b/)
		expect(code).toMatch(/\bestCleDe\(/)
		for (const interdit of ["'bestiaire", '"bestiaire', '`bestiaire']) {
			expect(`${interdit} → ${code.includes(interdit)}`).toBe(`${interdit} → false`)
		}
		// Ni `in`, ni un test d'index nu sur le registre : `estCleDe` est la seule garde.
		expect(code).not.toMatch(/\bin\s+BESTIARY_BY_TEMPLATE\b/)

		// Discriminance du motif : il attrape RÉELLEMENT un littéral retapé.
		expect(sansCommentaires("const p = 'bestiaire.'").includes("'bestiaire")).toBe(true)
		expect(sansCommentaires("// 'bestiaire.' est dans la docstring").includes("'bestiaire")).toBe(false)
	})
})
