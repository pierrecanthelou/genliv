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
import { SECTIONS, type SectionId } from './sections'
import { CHEMINS_DE_DELTAS } from './tables'
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
		const NEUVES: Record<Exclude<ControleId, 'amorce-non-redigee'>, Dossier> = {
			'indice-sans-source': cloneIndiceOrphelin(),
			'depart-desert': cloneSansPresence(),
			'personnage-sans-presence': cloneSansPresence(),
			'personnage-sans-voix': cloneSansVoix(),
		}

		for (const id of Object.keys(NEUVES) as (keyof typeof NEUVES)[]) {
			const constats = CONTROLES[id].controler(NEUVES[id])
			// Discriminance : une règle muette rendrait la boucle suivante vraie sans
			// rien prouver.
			expect(`${id} → ${constats.length > 0}`).toBe(`${id} → true`)
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
		// LE RAPPORT COMPLET, et sur les témoins des CINQ règles : un balayage du seul
		// dossier semé ne verrait que les quatre chemins de l'amorce et laisserait sans
		// preuve les quatre `path` neufs, alors que son nom promet « les path »
		// (KR-199).
		const rapports = [
			controlerDossier(seme()),
			controlerDossier(cloneIndiceOrphelin()),
			controlerDossier(cloneSansPresence()),
			controlerDossier(cloneSansVoix()),
		]
		const controles = rapports.flatMap((rapport) => rapport.controles)

		// Discriminance : les CINQ règles sont représentées dans ce qui est balayé.
		expect(new Set(controles.map((controle) => controle.id)).size).toBe(Object.keys(CONTROLES).length)
		expect(controles.length).toBeGreaterThan(CHAMPS_SEMES.length)

		for (const controle of controles) {
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
