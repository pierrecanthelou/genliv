import fs from 'node:fs'
import path from 'node:path'
import { AMORCE, MARQUEUR_A_ECRIRE, construireAmorce } from './amorce'
import { validateDossier } from './validate'

/**
 * L'AMORCE et sa MARQUE. Deux propriétés distinctes sont tenues ici :
 *  · les quatre textes semés portent tous la marque, de sorte qu'aucun ne puisse
 *    être pris pour de la prose rédigée par l'auteur ;
 *  · la marque elle-même n'existe qu'à UN endroit dans `src/` — recopiée ailleurs,
 *    elle dériverait en silence de celle qui fait foi, et le balayage de la n° 7
 *    cesserait de tout voir.
 *
 * La valeur de la marque n'est JAMAIS écrite dans ce fichier : elle est importée.
 * C'est ce qui permet au balayage ci-dessous d'attendre UN SEUL porteur plutôt que
 * deux — le test qui vérifie l'unicité ne peut pas être lui-même une seconde copie.
 */

const MODULE_DOSSIER = __dirname
const RACINE_SRC = path.join(MODULE_DOSSIER, '..', '..')

function fichiersTypeScript(racine: string): string[] {
	return fs
		.readdirSync(racine, { withFileTypes: true })
		.flatMap((entree) =>
			entree.isDirectory()
				? fichiersTypeScript(path.join(racine, entree.name))
				: /\.tsx?$/.test(entree.name)
					? [path.join(racine, entree.name)]
					: [],
		)
}

/** Les quatre textes, lus depuis le registre — jamais re-listés à la main. */
const TEXTES = Object.entries(AMORCE)

describe('AMORCE, les textes semes par create()', () => {
	it('compte exactement les quatre champs de prose du seed', () => {
		expect(Object.keys(AMORCE).sort()).toEqual(['accroche_joueur', 'synopsis_mj', 'texte_ouverture_joueur', 'ton'])
	})

	it('chaque texte porte la marque en tete', () => {
		for (const [champ, texte] of TEXTES) {
			// L'égalité porte sur une phrase NOMMÉE : un échec dit quel champ a perdu sa
			// marque, plutôt que « false attendu true » sur le quatrième `startsWith`.
			expect(`${champ} → ${texte.startsWith(MARQUEUR_A_ECRIRE)}`).toBe(`${champ} → true`)
		}
	})

	it('chaque texte dit a l auteur ce que le champ attend, au-dela de la marque', () => {
		for (const [champ, texte] of TEXTES) {
			const consigne = texte.slice(MARQUEUR_A_ECRIRE.length).trim()
			// Une marque seule serait un champ vide déguisé : le validateur l'accepterait
			// (non vide), et l'auteur ne saurait pas ce qu'on attend de lui.
			expect(`${champ} → ${consigne !== ''}`).toBe(`${champ} → true`)
		}
	})

	it('la marque n est ecrite nulle part ailleurs dans src', () => {
		const porteurs = fichiersTypeScript(RACINE_SRC)
			.filter((fichier) => fs.readFileSync(fichier, 'utf8').includes(MARQUEUR_A_ECRIRE))
			.map((fichier) => path.relative(RACINE_SRC, fichier).split(path.sep).join('/'))

		// UN seul porteur : le module qui la déclare. Ce fichier de test n'en est pas
		// un — il importe la constante au lieu de la recopier —, et c'est le
		// discriminant du motif : si le balayage ne trouvait rien du tout, l'assertion
		// serait vide et donc fausse pour la mauvaise raison.
		expect(porteurs).toEqual(['brain/dossier/amorce.ts'])
	})

	it('l amorce ne sort pas du baril brain/index.ts', () => {
		const baril = fs.readFileSync(path.join(RACINE_SRC, 'brain', 'index.ts'), 'utf8')

		// Même règle que `DELTAS` et `DESTINATION_DES_CHAMPS` : aucun consommateur hors
		// de `brain/` avant les n° 7 et n° 9. Le jour où l'un d'eux voudra la lire, il
		// devra SUPPRIMER ce test — c'est-à-dire prendre la décision au lieu de la subir.
		expect(baril).not.toContain('MARQUEUR_A_ECRIRE')
		expect(baril).not.toContain('construireAmorce')
		expect(baril).not.toContain('dossier/amorce')
	})
})

describe('construireAmorce, la forme du seed', () => {
	const SEME = construireAmorce('un-dossier-seme', 'La Caverne', '2026-08-09T10:00:00.000Z')

	it('rend un document que le validateur accepte sans erreur ni avertissement', () => {
		const validation = validateDossier(SEME)

		// Les DEUX tableaux : un avertissement serait un dossier neuf qui s'ouvre déjà
		// avec une alerte, ce que personne n'a demandé à l'auteur de corriger.
		expect(validation.errors).toEqual([])
		expect(validation.warnings).toEqual([])
		expect(validation.ok).toBe(true)
	})

	it('depose les quatre textes marques a leur place', () => {
		expect(SEME.canon.mj.synopsis_mj).toBe(AMORCE.synopsis_mj)
		expect(SEME.canon.partage.accroche_joueur).toBe(AMORCE.accroche_joueur)
		expect(SEME.canon.ton).toBe(AMORCE.ton)
		expect(SEME.charpente.depart.texte_ouverture_joueur).toBe(AMORCE.texte_ouverture_joueur)
	})

	it('seme un lieu unique, sans nom, que le depart resout', () => {
		// `nom` est de destination `auteur` : le logiciel ne l'écrit jamais. Son absence
		// est un état calme (`Entite.nom` optionnel) — le repli « Lieu n°1 (sans nom) »
		// est une sortie de RAPPORT, calculée à l'anomalie, jamais une valeur semée.
		expect(SEME.monde.lieux).toEqual([{ id: 'lieu.amorce' }])
		expect(SEME.monde.lieux[0]).not.toHaveProperty('nom')
		// Une référence orpheline serait bloquante : le départ doit résoudre contre le
		// lieu semé, et c'est la seule raison d'être de ce lieu.
		expect(SEME.charpente.depart.lieu_id).toBe(SEME.monde.lieux[0].id)
	})

	it('reporte l enveloppe recue sans la reecrire', () => {
		expect(SEME.id).toBe('un-dossier-seme')
		expect(SEME.titre).toBe('La Caverne')
		expect(SEME.createdAt).toBe('2026-08-09T10:00:00.000Z')
		expect(SEME.updatedAt).toBe(SEME.createdAt)
		expect(SEME.schema).toBe(1)
	})

	it('ne peuple aucune collection', () => {
		// Un dossier neuf n'a ni personnage, ni objet, ni jalon inventés pour lui : les
		// listes sont PRÉSENTES (le validateur les exige) et VIDES.
		expect(SEME.canon.interdits_ton).toEqual([])
		expect(SEME.canon.objectifs).toEqual([])
		expect(SEME.monde.personnages).toEqual([])
		expect(SEME.monde.objets).toEqual([])
		expect(SEME.monde.indices).toEqual([])
		expect(SEME.monde.quetes).toEqual([])
		expect(SEME.monde.evenements).toEqual([])
		expect(SEME.monde.conditions.climat).toEqual([])
		expect(SEME.charpente.jalons).toEqual([])
		expect(SEME.charpente.fins).toEqual([])
	})

	it('rend un document neuf a chaque appel', () => {
		// Un littéral partagé entre deux dossiers ferait qu'éditer l'un éditerait
		// l'autre — la collection `lieux` est la plus exposée.
		const autre = construireAmorce('un-autre', 'Autre', '2026-08-09T11:00:00.000Z')

		expect(autre.monde.lieux).not.toBe(SEME.monde.lieux)
		expect(autre.canon).not.toBe(SEME.canon)
	})
})
