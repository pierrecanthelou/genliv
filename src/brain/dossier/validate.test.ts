import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import {
	BUDGET_MOTS_CANON,
	BUDGET_MOTS_JALON,
	CAMPS,
	CAMPS_PERSONNAGE,
	CARACTERISTIQUE_MIN,
	CONFIANCE_MAX,
	CONFIANCE_MIN,
	DOSSIER_SCHEMA,
	INTENSITE_MAX,
	INTENSITE_MIN,
	STATS_INITIALES,
} from './types'
import { DOSSIER_ISSUE_LABELS, dossierIssueRemediation, type DossierIssue, type DossierIssueCode } from './issues'
import {
	CHAMPS_ENTIERS,
	CONFIANCES,
	ENUMERES_FERMES,
	FAMILLES_DE_CONDITIONS,
	INTENSITES,
	LISTES_A_ELEMENTS_STRUCTURES,
	LISTES_OPTIONNELLES_TEXTUELLES,
	REFERENCES_SIMPLES,
	VALEURS_DE_CARACTERISTIQUE,
	VALEURS_DE_CURSEUR,
} from './tables'
import { CURSEURS_INITIAUX, CURSEUR_MAX, CURSEUR_MIN, CURSEUR_VALUES, PARLER_REPLIQUES } from './curseurs'
import { CHARACTERISTIC_MAX, CHARACTERISTIC_VALUES } from '../characteristics'
import { DELTAS, type Delta } from './deltas'
import { feuilleDe } from './identifiers'

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')
const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

type Doc = Record<string, unknown>

/**
 * La fixture, LUE DU DISQUE à chaque appel (KR-156) — jamais un littéral inline.
 * Un nouvel objet à chaque fois : le validateur GÈLE ce qu'il rend, donc une
 * fixture partagée entre deux tests deviendrait immuable au premier.
 */
function fixture(): Doc {
	return JSON.parse(fs.readFileSync(CHEMIN_FIXTURE, 'utf8')) as Doc
}

const obj = (value: unknown): Doc => value as Doc
const arr = (value: unknown): Doc[] => value as Doc[]

/** Les TREIZE accès profonds de la fixture, nommés une fois (remesuré, KR-159). */
const personnage = (doc: Doc): Doc => arr(obj(doc.monde).personnages)[0]
const savoir = (doc: Doc): Doc => arr(personnage(doc).savoirs)[0]
const revele = (doc: Doc): Doc => obj(savoir(doc).revele_si)
const etape = (doc: Doc): Doc => arr(personnage(doc).plan_actions)[0]
const contreMesure = (doc: Doc): Doc => arr(personnage(doc).contre_mesures)[0]
const relation = (doc: Doc): Doc => arr(personnage(doc).relations)[0]
const presence = (doc: Doc): Doc => arr(personnage(doc).presence)[0]
const caractere = (doc: Doc): Doc => obj(personnage(doc).caractere)
const curseurs = (doc: Doc): Doc => obj(caractere(doc).curseurs)
const evenement = (doc: Doc): Doc => arr(obj(doc.monde).evenements)[0]
const quete = (doc: Doc): Doc => arr(obj(doc.monde).quetes)[0]
const jalon = (doc: Doc): Doc => arr(obj(doc.charpente).jalons)[0]
const objectif = (doc: Doc): Doc => arr(obj(doc.canon).objectifs)[0]

/** Les sous-chaînes qui trahissent une erreur runtime sérialisée (KR-164). */
const FUITES_TECHNIQUES = ['expected', 'undefined', 'is not a function']

function codes(issues: readonly DossierIssue[]): DossierIssueCode[] {
	return issues.map((i) => i.code)
}

describe('validateDossier', () => {
	it('la fixture minimale passe sans erreur', () => {
		const resultat = validateDossier(fixture())

		expect(resultat.ok).toBe(true)
		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.dossier).not.toBeNull()
		expect(resultat.dossier?.titre).toBe('Le sceau du Gouffre')
		expect(resultat.dossier?.charpente.depart.lieu_id).toBe('lieu.val-cendre')
		// Les formes de l'itération 2 sont TYPÉES, pas seulement traversées.
		expect(resultat.dossier?.monde.personnages[0].portee).toBe('premier')
		expect(resultat.dossier?.monde.personnages[0].savoirs[0].certitude).toBe('sait')
		// La situation du personnage (itération 1 de la n° 4) est TYPÉE, pas seulement
		// traversée : deux champs OPTIONNELS, tous deux instanciés dans la fixture pour
		// que le balayage de couverture ait une feuille à voir.
		expect(resultat.dossier?.monde.personnages[0].camp).toBe('protagoniste')
		expect(resultat.dossier?.monde.personnages[0].objectif_id).toBe('objectif.refermer-le-sceau')
		expect(resultat.dossier?.monde.evenements[0].monstre_ref).toBe('bestiaire.gobelin')
		expect(resultat.dossier?.charpente.jalons[0].enonce_texte.length).toBeGreaterThan(0)
		// Les effets de l'itération 4 sont TYPÉS, pas seulement traversés — et la liste
		// VIDE du climat est légitime : aucun des quatre effets admis n'est ambiant.
		expect(resultat.dossier?.monde.conditions.climat[0].effets_regles).toEqual([])
		expect(resultat.dossier?.charpente.jalons[0].effet).toEqual([
			{ delta: 'reveler_indice', cibles: ['indice.sceau-brise'] },
		])
	})

	it('schema absent / chaine / 0 / 2 est refuse', () => {
		const cas: unknown[] = [undefined, '1', 0, 2, 1.5, true, null]

		for (const valeurDeSchema of cas) {
			const doc = fixture()
			if (valeurDeSchema === undefined) delete doc.schema
			else doc.schema = valeurDeSchema

			const resultat = validateDossier(doc)

			expect(codes(resultat.errors)).toEqual(['schema-inconnu'])
			expect(resultat.ok).toBe(false)
			// Jamais coercé : aucun dossier ne ressort, et le contenu n'est même pas lu.
			expect(resultat.dossier).toBeNull()
			expect(resultat.errors[0].path).toBe('schema')
		}

		// Discriminant : c'est bien le NOMBRE 1 qui passe, et lui seul.
		const conforme = fixture()
		conforme.schema = DOSSIER_SCHEMA
		expect(validateDossier(conforme).ok).toBe(true)
	})

	it('une racine manquante est bloquante', () => {
		const doc = fixture()
		delete obj(doc.monde).lieux

		const resultat = validateDossier(doc)
		const manquante = resultat.errors.find((e) => e.code === 'racine-manquante')

		expect(resultat.ok).toBe(false)
		expect(manquante).toBeDefined()
		expect(manquante?.path).toBe('monde.lieux') // le path NOMME la racine
		expect(manquante?.message).toContain('monde.lieux')
		expect(manquante?.location).toBe('Lieux')
	})

	it('une racine du mauvais genre est traitee comme manquante', () => {
		const doc = fixture()
		obj(doc.monde).lieux = { 'lieu.val-cendre': {} } // un objet là où une liste est attendue

		const resultat = validateDossier(doc)

		expect(codes(resultat.errors)).toContain('racine-manquante')
	})

	it('un champ obligatoire vide est bloquant', () => {
		const doc = fixture()
		obj(doc.canon).ton = '   '
		personnage(doc).id = ''

		const resultat = validateDossier(doc)
		const surLeTon = resultat.errors.find((e) => e.path === 'canon.ton')
		const surLIdentite = resultat.errors.find((e) => e.path === 'monde.personnages[0].id')

		expect(resultat.ok).toBe(false)
		expect(surLeTon?.code).toBe('champ-requis-vide')
		expect(surLeTon?.message).toContain('« ton »')
		// `location` résout l'entité PAR SON NOM, jamais par son chemin (KR-164).
		expect(surLIdentite?.code).toBe('champ-requis-vide')
		expect(surLIdentite?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('un champ obligatoire vide DANS UNE LISTE IMBRIQUEE nomme son entite porteuse', () => {
		// `savoirs[].indice_id` vit à deux tableaux de profondeur et n'a pas d'entité
		// à lui : le OÙ doit remonter au personnage, pas retomber sur un chemin JSON.
		const doc = fixture()
		savoir(doc).indice_id = ''

		const anomalie = validateDossier(doc).errors.find((e) => e.path === 'monde.personnages[0].savoirs[0].indice_id')

		expect(anomalie?.code).toBe('champ-requis-vide')
		expect(anomalie?.message).toContain('« indice_id »')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('une entite sans nom retombe sur le repli indexe, jamais sur le chemin JSON', () => {
		const doc = fixture()
		delete personnage(doc).nom
		personnage(doc).id = ''

		const anomalie = validateDossier(doc).errors.find((e) => e.path === 'monde.personnages[0].id')

		expect(anomalie?.location).toBe('Personnage n°1 (sans nom)')
	})

	it('un optionnel absent est calme', () => {
		const doc = fixture()
		// Cinq optionnels d'un coup : le `nom` d'une entité en cours de rédaction, la
		// didascalie de révélation, une porte non posée, et la référence de monstre
		// d'un événement qui n'en porte pas.
		delete personnage(doc).nom
		delete jalon(doc).nom
		delete savoir(doc).revele_comment
		delete revele(doc).apres_indice_id
		delete evenement(doc).monstre_ref

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('chaque anomalie a un code ferme et un message redige', () => {
		const documents: Doc[] = []

		// Un document par famille d'anomalie, pour que les ONZE codes de l'itération 2
		// soient TOUS observés. Les QUATRE de l'itération 3 le sont par « les quatre
		// codes neufs sont tous observables » ; `dossier-deja-importe` appartient au
		// magasin (voir DossierService). Un décompte énonce son prédicat (KR-159).
		const mauvaisSchema = fixture()
		mauvaisSchema.schema = 2
		documents.push(mauvaisSchema)

		const sansRacine = fixture()
		delete obj(sansRacine.charpente).fins
		documents.push(sansRacine)

		const champVide = fixture()
		obj(obj(champVide.canon).mj).synopsis_mj = ''
		documents.push(champVide)

		const idInvalide = fixture()
		arr(obj(idInvalide.monde).indices)[0].id = 'INDICE.Cendres Tièdes'
		documents.push(idInvalide)

		const idDuplique = fixture()
		arr(obj(idDuplique.monde).objets).push({ id: 'objet.clef-de-basalte', nom: 'Une autre clef' })
		documents.push(idDuplique)

		const referencePendante = fixture()
		obj(obj(referencePendante.charpente).depart).lieu_id = 'lieu.nulle-part'
		documents.push(referencePendante)

		const monstreInconnu = fixture()
		evenement(monstreInconnu).monstre_ref = 'bestiaire.griffon-des-cendres'
		documents.push(monstreInconnu)

		const canonTropLong = fixture()
		obj(obj(canonTropLong.canon).mj).synopsis_mj = 'mot '.repeat(BUDGET_MOTS_CANON + 1)
		documents.push(canonTropLong)

		const horsEnumeration = fixture()
		personnage(horsEnumeration).portee = 'troisieme'
		documents.push(horsEnumeration)

		const deltaEnProse = fixture()
		jalon(deltaEnProse).effet = 'le bourg se réveille'
		documents.push(deltaEnProse)

		const porteInconnue = fixture()
		revele(porteInconnue).toujours = true
		documents.push(porteInconnue)

		const sansPorte = fixture()
		delete savoir(sansPorte).revele_si
		documents.push(sansPorte)

		const observes = new Set<DossierIssueCode>()
		for (const document of documents) {
			const resultat = validateDossier(document)
			for (const anomalie of [...resultat.errors, ...resultat.warnings]) {
				observes.add(anomalie.code)
				// Le code appartient à l'union fermée : le registre a une entrée pour lui.
				expect(DOSSIER_ISSUE_LABELS[anomalie.code]).toBeDefined()
				expect(anomalie.path.length).toBeGreaterThan(0)
				expect(anomalie.location.length).toBeGreaterThan(0)
				expect(anomalie.message.length).toBeGreaterThan(0)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(anomalie.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}

		expect([...observes].sort()).toEqual([
			'champ-requis-vide',
			'delta-en-prose',
			'identifiant-duplique',
			'identifiant-invalide',
			'porte-inconnue',
			'racine-manquante',
			'reference-pendante',
			'revelation-sans-porte',
			'schema-inconnu',
			'texte-trop-long',
			'valeur-hors-enumeration',
		])
	})

	it('une entree non-objet est refusee sans exception', () => {
		const nonObjets: unknown[] = [null, undefined, 42, 'un texte', [], true]
		for (const entree of nonObjets) {
			expect(() => validateDossier(entree)).not.toThrow()
			expect(validateDossier(entree).ok).toBe(false)
		}

		// Une COLLECTION peuplée de non-objets ne fait pas lever non plus.
		const doc = fixture()
		obj(doc.monde).lieux = [42, 'lieu.val-cendre', null]
		expect(() => validateDossier(doc)).not.toThrow()
		const resultat = validateDossier(doc)
		expect(resultat.ok).toBe(false)
		expect(codes(resultat.errors)).toContain('champ-requis-vide')
	})

	it('depart.lieu_id pendant est bloquant', () => {
		const doc = fixture()
		obj(obj(doc.charpente).depart).lieu_id = 'lieu.nulle-part'

		const resultat = validateDossier(doc)
		const pendante = resultat.errors.find((e) => e.code === 'reference-pendante')

		expect(resultat.ok).toBe(false)
		expect(pendante?.path).toBe('charpente.depart.lieu_id')
		expect(pendante?.entityId).toBe('lieu.nulle-part')
		expect(pendante?.location).toBe('Point de départ')
	})

	it('validateDossier reste TOTAL sur une cle de prototype dans un …_expr', () => {
		// BUG-053, le chemin qui compte : `inspectDossierFile` n'entoure pas
		// `validateDossier` d'un try, et son appelant l'invoque dans `reader.onload`.
		// Une exception y laissait la modale bloquée sur « lecture » — sans anomalie,
		// sans message, sans sortie — sur le SEUL écran de la feature, à partir d'un
		// fichier écrit à la main. Un validateur qui se promet total doit le rester sur
		// une valeur qu'un auteur peut taper.
		for (const heritee of ['toString', 'constructor', '__proto__', 'hasOwnProperty']) {
			const doc = fixture()
			arr(obj(doc.charpente).fins)[0].condition_expr = { op: heritee }

			expect(() => validateDossier(doc)).not.toThrow()

			const resultat = validateDossier(doc)

			expect(resultat.ok).toBe(false)
			expect(resultat.errors.map((e) => e.code)).toContain('expr-malformee')
			for (const issue of resultat.errors) {
				for (const fuite of ['expected', 'undefined', 'is not a function']) {
					expect(issue.message).not.toContain(fuite)
				}
			}
		}

		// Même porte du côté du prédicat, où le descripteur hérité faisait sauter
		// `.refKinds.length` avant même que le message soit rédigé.
		const parPredicat = fixture()
		arr(obj(parPredicat.charpente).fins)[0].condition_expr = { op: 'predicat', predicat: 'toString', cibles: [] }

		expect(() => validateDossier(parPredicat)).not.toThrow()
		expect(validateDossier(parPredicat).errors.map((e) => e.code)).toContain('predicat-inconnu')
	})

	it('monstre_ref pointant une cle de prototype est refuse comme pendant', () => {
		// BUG-053, second site de la même cause racine : `BESTIARY_BY_TEMPLATE` est
		// construit par `Object.fromEntries`, donc un test d'index rendait la FONCTION
		// héritée `Object.prototype.toString` et « bestiaire.toString » passait pour un
		// monstre existant — dossier gelé `ok:true`, combat ouvert en n° 13 sur une
		// fonction.
		for (const heritee of ['bestiaire.toString', 'bestiaire.constructor', 'bestiaire.valueOf']) {
			const doc = fixture()
			evenement(doc).monstre_ref = heritee

			const resultat = validateDossier(doc)

			expect(resultat.ok).toBe(false)
			expect(resultat.errors.map((e) => e.code)).toContain('reference-pendante')
		}

		// Discriminant : un templateId RÉELLEMENT présent au bestiaire reste accepté.
		const valide = fixture()
		expect(validateDossier(valide).ok).toBe(true)
	})

	it('monstre_ref pendant nomme l evenement, pas le monstre', () => {
		const doc = fixture()
		evenement(doc).monstre_ref = 'bestiaire.griffon-des-cendres'

		const resultat = validateDossier(doc)
		const pendante = resultat.errors.find((e) => e.code === 'reference-pendante')

		expect(resultat.ok).toBe(false)
		// L'entité résolue est l'ÉVÉNEMENT : le monstre, lui, n'existe pas dans le
		// dossier — il vit dans le bestiaire du jeu.
		expect(pendante?.location).toBe("Événement « L'embuscade du Fanal »")
		expect(pendante?.path).toBe('monde.evenements[0].monstre_ref')
		expect(pendante?.entityId).toBe('bestiaire.griffon-des-cendres')
		expect(pendante?.message).toContain('bestiaire.griffon-des-cendres')

		// Discriminant : la référence de la fixture, elle, résout contre le bestiaire.
		expect(validateDossier(fixture()).errors).toEqual([])
	})

	it('un monstre_ref pendant sur un evenement sans nom retombe sur le repli indexe', () => {
		const doc = fixture()
		delete evenement(doc).nom
		evenement(doc).monstre_ref = 'bestiaire.griffon-des-cendres'

		const pendante = validateDossier(doc).errors.find((e) => e.code === 'reference-pendante')

		expect(pendante?.location).toBe('Événement n°1 (sans nom)')
	})

	it('le QUOI FAIRE de reference-pendante resout {champ}', () => {
		// Le même code, deux sites, deux champs nommés : c'est ce que le texte câblé
		// en dur sur `depart.lieu_id` rendait impossible (même famille que BUG-042).
		const surLeDepart = fixture()
		obj(obj(surLeDepart.charpente).depart).lieu_id = 'lieu.nulle-part'
		const surLEvenement = fixture()
		evenement(surLEvenement).monstre_ref = 'bestiaire.griffon-des-cendres'

		const depart = validateDossier(surLeDepart).errors.find((e) => e.code === 'reference-pendante')
		const monstre = validateDossier(surLEvenement).errors.find((e) => e.code === 'reference-pendante')

		expect(depart).toBeDefined()
		expect(monstre).toBeDefined()
		if (depart === undefined || monstre === undefined) return
		expect(dossierIssueRemediation(depart)).toBe("↪ Corrigez « lieu_id » ou rétablissez l'élément correspondant.")
		expect(dossierIssueRemediation(monstre)).toBe("↪ Corrigez « monstre_ref » ou rétablissez l'élément correspondant.")
	})

	/**
	 * GARDE DE RÉCURRENCE (dossier-fiches it7, BUG-075 — même classe que
	 * BUG-042/KR-171) : ces DEUX lignes se rendent AUSSI hors de tout import.
	 * `reference-pendante` est ce que le bandeau de refus montre à l'auteur qui
	 * retire un personnage encore référencé, `texte-trop-long` ce que
	 * `FichePersonnage.tsx` affiche pendant une édition — « puis réimportez-le »
	 * et « l'import n'est pas bloqué » y désignent un geste et un contexte qui
	 * n'existent pas. Les DEUX assertions à chaîne exacte ci-dessus figent le
	 * texte ; celle-ci fige la PROPRIÉTÉ, pour qu'une reformulation future ne
	 * ré-introduise pas la consigne d'import par inadvertance.
	 *
	 * Elle ne porte QUE sur ces deux codes : les autres libellés du registre ne
	 * sont rendus qu'au rapport d'import et gardent légitimement la consigne
	 * (hors périmètre d'it7, § 2 du plan).
	 */
	it('la remediation de reference-pendante et texte-trop-long ne contient plus reimportez', () => {
		const codesHorsImport: DossierIssueCode[] = ['reference-pendante', 'texte-trop-long']

		for (const code of codesHorsImport) {
			expect(DOSSIER_ISSUE_LABELS[code]).not.toMatch(/réimport/i)
			expect(DOSSIER_ISSUE_LABELS[code]).not.toMatch(/import/i)
		}
	})

	it('portee hors enumeration est bloquant', () => {
		const doc = fixture()
		personnage(doc).portee = 'troisieme'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('monde.personnages[0].portee')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
		// La valeur fautive ET les valeurs attendues, en français, sans nom de type.
		expect(anomalie?.message).toContain('« troisieme »')
		expect(anomalie?.message).toContain('premier ou second')
		expect(anomalie?.message).not.toContain('|')
		expect(anomalie?.message).not.toContain('string')
	})

	it('certitude hors enumeration est bloquant', () => {
		const doc = fixture()
		savoir(doc).certitude = 'devine'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('monde.personnages[0].savoirs[0].certitude')
		expect(anomalie?.message).toContain('« devine »')
		expect(anomalie?.message).toContain('sait, croit ou soupconne')
	})

	it('le camp d un objectif est un enumere FERME, derive du registre CAMPS', () => {
		// La ligne de table cite le REGISTRE, jamais une liste recopiée (KR-117) :
		// `toBe` et non `toEqual`, pour qu'une copie des trois valeurs — qui dériverait
		// en silence du `Select` de l'écran — fasse rougir ce test.
		const ligne = ENUMERES_FERMES.find((e) => e.path === 'canon.objectifs[].camp')

		expect(ligne).toBeDefined()
		expect(ligne?.valeurs).toBe(CAMPS)
		expect(ligne?.requis).toBe(true)
		expect(ligne?.location).toBe('Objectifs')
		// Les trois camps, dans l'ordre arbitré (§ 3 du plan d'itération, repris du
		// § « Objectifs des camps » de docs/PLAN-BASCULE-IA.dc.html).
		expect(CAMPS).toEqual(['protagonistes', 'antagonistes', 'joueur'])
	})

	it('camp hors enumeration est bloquant et nomme le champ', () => {
		const doc = fixture()
		objectif(doc).camp = 'neutres'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('canon.objectifs[0].camp')
		// Le OÙ est l'OBJECTIF porteur, résolu par `sitesDe` sans qu'aucune table le dise.
		expect(anomalie?.location).toBe('Objectif « Refermer le sceau du Gouffre »')
		expect(anomalie?.message).toContain('« camp »')
		expect(anomalie?.message).toContain('« neutres »')
		expect(anomalie?.message).toContain('protagonistes, antagonistes ou joueur')
	})

	it('camp absent est bloquant : le champ est obligatoire', () => {
		// `requis: true` — un objectif sans camp n'appartient à personne, et le moteur
		// qui conclut la partie ne saurait pas de quel côté elle s'est jouée. Le message
		// dit « vide » et jamais « undefined » (KR-164).
		const doc = fixture()
		delete objectif(doc).camp

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('canon.objectifs[0].camp')
		expect(anomalie?.location).toBe('Objectif « Refermer le sceau du Gouffre »')
		expect(anomalie?.message).toContain('« vide »')
		expect(anomalie?.message).toContain('protagonistes, antagonistes ou joueur')
		for (const fuite of FUITES_TECHNIQUES) {
			expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
		}
	})

	it('chacun des trois camps est accepte', () => {
		// Discriminant des deux refus ci-dessus : ce n'est pas « toute valeur de camp
		// est refusée ». Dérivé du registre — une valeur ajoutée demain est éprouvée
		// sans qu'on y pense.
		const refuses = CAMPS.filter((camp) => {
			const doc = fixture()
			objectif(doc).camp = camp
			return !validateDossier(doc).ok
		})

		expect(refuses).toEqual([])
	})

	it('le camp d un PERSONNAGE lit CAMPS_PERSONNAGE, un registre DISTINCT de CAMPS', () => {
		// Deux registres, jamais fondus (KR-117 + arbitrage du cadrage) : `CAMPS` dit à
		// QUI appartient une victoire (`'joueur'` compris — le joueur n'est pas une
		// entrée de `monde.personnages[]`), celui-ci dit de quel côté un acteur joue.
		// `toBe` et non `toEqual` : une copie des deux valeurs, qui dériverait en
		// silence du `SegmentedControl` de l'écran, fait rougir ce test.
		const ligne = ENUMERES_FERMES.find((e) => e.path === 'monde.personnages[].camp')

		expect(ligne).toBeDefined()
		expect(ligne?.valeurs).toBe(CAMPS_PERSONNAGE)
		expect(ligne?.location).toBe('Personnages')
		expect(CAMPS_PERSONNAGE).toEqual(['protagoniste', 'antagoniste'])
		// Discriminant de la NON-FUSION : aucune valeur n'est commune aux deux
		// registres. Le jour où quelqu'un ferait pointer l'une des deux lignes sur
		// l'autre table, ce test le dirait — un simple `not.toBe` ne l'aurait pas fait.
		const communes = (CAMPS_PERSONNAGE as readonly string[]).filter((camp) =>
			(CAMPS as readonly string[]).includes(camp),
		)
		expect(communes).toEqual([])
	})

	it('camp de personnage ABSENT est calme : ni erreur ni avertissement', () => {
		// KR-191 — c'est la propriété la plus importante de cette ligne de table, et
		// celle qu'un `requis: true` recopié du précédent `Objectif.camp` casserait :
		// `monde.personnages[]` existe depuis la n° 1 sans ce champ, et `schema: 1` n'a
		// aucun chemin de migration. Un camp requis rendrait ILLISIBLE en bibliothèque
		// tout dossier déjà persisté — un défaut qu'aucun test d'écran ne verrait.
		const doc = fixture()
		delete personnage(doc).camp

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
		// La ligne de table PORTE cette optionalité, elle n'en dépend pas d'un hasard.
		expect(ENUMERES_FERMES.find((e) => e.path === 'monde.personnages[].camp')?.requis).toBe(false)
	})

	it('camp de personnage hors enumeration est bloquant et nomme le personnage', () => {
		// Optionnel ne veut pas dire libre : absent est calme, PRÉSENT est contrôlé.
		const doc = fixture()
		personnage(doc).camp = 'neutre'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('monde.personnages[0].camp')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
		expect(anomalie?.message).toContain('« camp »')
		expect(anomalie?.message).toContain('« neutre »')
		expect(anomalie?.message).toContain('protagoniste ou antagoniste')
		// Le vocabulaire de l'AUTRE registre ne fuit pas dans le message : un auteur à
		// qui l'on propose « joueur » sur une fiche de PNJ cherchera longtemps.
		expect(anomalie?.message).not.toContain('joueur')
		for (const fuite of FUITES_TECHNIQUES) {
			expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
		}
	})

	it('chacun des deux camps de personnage est accepte', () => {
		// Discriminant du refus ci-dessus : ce n'est pas « tout camp est refusé ».
		// Dérivé du registre — une valeur ajoutée demain est éprouvée sans qu'on y pense.
		const refuses = CAMPS_PERSONNAGE.filter((camp) => {
			const doc = fixture()
			personnage(doc).camp = camp
			return !validateDossier(doc).ok
		})

		expect(refuses).toEqual([])
	})

	it('les huit caracteristiques lisent VALEURS_DE_CARACTERISTIQUE et sont requises DANS le bloc', () => {
		// Les huit lignes sont DÉRIVÉES de `CHARACTERISTIC_VALUES` (KR-117) : une liste
		// recopiée divergerait du registre en silence. `toBe` et non `toEqual` sur les
		// valeurs — une copie de l'échelle, qui dériverait du `Stepper` de l'écran, fait
		// rougir ce test.
		const lignes = ENUMERES_FERMES.filter((e) => e.path.includes('.stats.'))

		expect(lignes.map((e) => e.path)).toEqual(CHARACTERISTIC_VALUES.map((c) => `monde.personnages[].stats.${c}`))
		for (const ligne of lignes) {
			expect(`${ligne.path} → ${ligne.location}`).toBe(`${ligne.path} → Personnages`)
			// `requis: true` — l'arbitrage du raffinage contre le `requis: false` recopié
			// de `confiance_min`. Le bon précédent est `revele_si.jet.carac`, déjà
			// `requis: true` sous deux porteurs optionnels.
			expect(`${ligne.path} → ${ligne.requis}`).toBe(`${ligne.path} → true`)
			expect(ligne.valeurs).toBe(VALEURS_DE_CARACTERISTIQUE)
		}
		// L'échelle est DÉRIVÉE de ses deux bornes nommées, jamais réécrite (KR-165) :
		// la doc des règles (§ 1, « Échelle ») dit « entier de 1 à 12 », et les deux
		// bornes sont les constantes qui font foi.
		expect(VALEURS_DE_CARACTERISTIQUE[0]).toBe(CARACTERISTIQUE_MIN)
		expect(VALEURS_DE_CARACTERISTIQUE[VALEURS_DE_CARACTERISTIQUE.length - 1]).toBe(CHARACTERISTIC_MAX)
		expect(VALEURS_DE_CARACTERISTIQUE).toHaveLength(CHARACTERISTIC_MAX - CARACTERISTIQUE_MIN + 1)
	})

	it('un bloc stats ABSENT est calme : ni erreur ni avertissement', () => {
		// La MOITIÉ « optionnel en bloc » du contrat, et celle qu'un `requis` posé sur
		// le porteur casserait : `monde.personnages[]` existe depuis la n° 1 sans ce
		// champ, et `schema: 1` n'a aucun chemin de migration (KR-160/191). Un bloc
		// requis rendrait ILLISIBLE en bibliothèque tout dossier déjà persisté.
		const doc = fixture()
		delete personnage(doc).stats

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('un bloc stats a 1-7 cles est refuse, et l anomalie nomme la carac manquante', () => {
		// L'AUTRE moitié : TOTAL quand présent. C'est elle qui rend l'état binaire et
		// vérifiable en UN point — sans elle, le moteur du Temps 2 devrait une garde à
		// CHAQUE site de résolution de jet, et un bloc partiel laisserait le choix entre
		// refuser, prendre un défaut, ou laisser le modèle improviser.
		//
		// Dérivé : CHAQUE clé est retirée à son tour. Un test qui n'en retirerait qu'une
		// laisserait sept lignes de table non éprouvées.
		const refuses = CHARACTERISTIC_VALUES.map((carac) => {
			const doc = fixture()
			delete obj(personnage(doc).stats)[carac]
			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === `monde.personnages[0].stats.${carac}`)
			return {
				carac,
				ok: resultat.ok,
				code: anomalie?.code,
				location: anomalie?.location,
				nommeLaCarac: anomalie?.message.includes(`« ${carac} »`) ?? false,
			}
		})

		expect(refuses).toEqual(
			CHARACTERISTIC_VALUES.map((carac) => ({
				carac,
				ok: false,
				code: 'valeur-hors-enumeration',
				location: 'Personnage « Aldûr le Sage »',
				nommeLaCarac: true,
			})),
		)
	})

	it('un bloc stats reduit a UNE cle est refuse sept fois, jamais une seule', () => {
		// Cas limite du précédent, et il mesure autre chose : chaque ligne de table
		// parle pour SA clé. Une implémentation qui contrôlerait « le bloc » en un seul
		// site rendrait une anomalie unique et laisserait l'auteur chercher les six
		// autres champs à remplir.
		const doc = fixture()
		personnage(doc).stats = { FO: 4 }

		const resultat = validateDossier(doc)
		const anomalies = resultat.errors.filter((e) => e.code === 'valeur-hors-enumeration')

		expect(resultat.ok).toBe(false)
		expect(anomalies.map((e) => e.path)).toEqual(
			CHARACTERISTIC_VALUES.filter((carac) => carac !== 'FO').map((carac) => `monde.personnages[0].stats.${carac}`),
		)
	})

	it('une caracteristique a 1 et a 12 est acceptee ; 0, 13, 2.5 et une chaine sont bloquants', () => {
		// Limite et limite+1 des DEUX côtés (KR-165), plus les deux corruptions de type
		// que l'énumération explicite attrape par la même porte : un non-entier et une
		// chaîne ne sont pas dans la liste, donc ils tombent sans qu'aucune règle de
		// forme n'ait à être écrite.
		//
		// L'échelle vient de `docs/REGLES-DU-JEU.md` § 1, paragraphe « Échelle » : un
		// entier de 1 à 12, plancher compris — le bestiaire du § 4 utilise réellement 1
		// (Rat géant `FO 1`, Zombie `AG 1`).
		for (const valeur of [CARACTERISTIQUE_MIN, CHARACTERISTIC_MAX]) {
			const doc = fixture()
			obj(personnage(doc).stats).FO = valeur

			expect(`${valeur} → ${JSON.stringify(validateDossier(doc).errors)}`).toBe(`${valeur} → []`)
		}

		for (const valeur of [CARACTERISTIQUE_MIN - 1, CHARACTERISTIC_MAX + 1, 2.5, '3']) {
			const doc = fixture()
			obj(personnage(doc).stats).FO = valeur

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

			expect(`${valeur} → ${resultat.ok}`).toBe(`${valeur} → false`)
			expect(anomalie?.path).toBe('monde.personnages[0].stats.FO')
			expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
			expect(anomalie?.message).toContain('« FO »')
			expect(anomalie?.message).toContain(String(valeur))
			// La borne haute est ANNONCÉE dans le message : l'auteur doit lire ce qui est
			// attendu, pas seulement ce qui est refusé.
			expect(anomalie?.message).toContain(String(CHARACTERISTIC_MAX))
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		}
	})

	it('chaque valeur de l echelle est acceptee sur chaque caracteristique', () => {
		// Discriminant des refus ci-dessus : ce n'est pas « toute valeur est refusée ».
		// Dérivé des deux registres — les huit clés × les douze valeurs.
		const refuses = CHARACTERISTIC_VALUES.flatMap((carac) =>
			VALEURS_DE_CARACTERISTIQUE.filter((valeur) => {
				const doc = fixture()
				obj(personnage(doc).stats)[carac] = valeur
				return !validateDossier(doc).ok
			}).map((valeur) => `${carac} = ${valeur}`),
		)

		expect(refuses).toEqual([])
	})

	it('STATS_INITIALES est le bloc des huit cles au plancher, et il passe le validateur', () => {
		// La valeur SEMÉE à l'écriture doit être acceptée par le schéma qui la valide :
		// sans cette assertion, l'écran pourrait écrire un bloc que l'import refuserait,
		// et l'auteur ne l'apprendrait qu'en rouvrant son dossier.
		//
		// Elle est DÉRIVÉE du registre × la borne nommée, jamais huit littéraux.
		expect(STATS_INITIALES).toEqual(Object.fromEntries(CHARACTERISTIC_VALUES.map((c) => [c, CARACTERISTIQUE_MIN])))
		expect(Object.keys(STATS_INITIALES)).toEqual(CHARACTERISTIC_VALUES)

		const doc = fixture()
		personnage(doc).stats = { ...STATS_INITIALES }

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('les six curseurs lisent VALEURS_DE_CURSEUR et sont requis DANS le bloc', () => {
		// MÊME FORME que les huit caractéristiques ci-dessus (jurisprudence d'it3) : les
		// six lignes sont DÉRIVÉES de `CURSEUR_VALUES` (KR-117), une liste recopiée
		// divergerait du registre en silence. `toBe` et non `toEqual` sur les valeurs —
		// une copie de l'échelle, qui dériverait du `Stepper` de l'écran, fait rougir ce
		// test.
		const lignes = ENUMERES_FERMES.filter((e) => e.path.includes('.curseurs.'))

		expect(lignes.map((e) => e.path)).toEqual(CURSEUR_VALUES.map((c) => `monde.personnages[].caractere.curseurs.${c}`))
		for (const ligne of lignes) {
			expect(`${ligne.path} → ${ligne.location}`).toBe(`${ligne.path} → Personnages`)
			// `requis: true` sous un bloc OPTIONNEL — le contrat « optionnel en bloc,
			// TOTAL quand présent », même mécanisme que `stats` pour un motif différent :
			// un curseur manquant ne rend aucun jet irrésoluble, il casse EN AVAL, à
			// l'assemblage du contexte de la n° 10.
			expect(`${ligne.path} → ${ligne.requis}`).toBe(`${ligne.path} → true`)
			expect(ligne.valeurs).toBe(VALEURS_DE_CURSEUR)
		}
		// L'échelle est DÉRIVÉE de ses deux bornes nommées, jamais réécrite (KR-165).
		// Elle ne vient PAS de `docs/REGLES-DU-JEU.md` et n'a pas à en venir : un curseur
		// ne change aucun jet, il colore une prose (KR-193).
		expect(VALEURS_DE_CURSEUR[0]).toBe(CURSEUR_MIN)
		expect(VALEURS_DE_CURSEUR[VALEURS_DE_CURSEUR.length - 1]).toBe(CURSEUR_MAX)
		expect(VALEURS_DE_CURSEUR).toHaveLength(CURSEUR_MAX - CURSEUR_MIN + 1)
		// Discriminant : les deux échelles de personnage ne se partagent pas leur
		// registre. Elles ne portent pas les mêmes valeurs aujourd'hui, mais le jour où
		// l'une d'elles bougerait, une table réutilisée les ferait dériver ensemble.
		expect(VALEURS_DE_CURSEUR).not.toBe(VALEURS_DE_CARACTERISTIQUE)
	})

	it('un bloc curseurs ABSENT est calme, et un bloc caractere ENTIEREMENT absent aussi', () => {
		// LES DEUX MOITIÉS DANS LE NOM ET DANS LES ASSERTIONS (KR-199) : c'est cette
		// moitié-là qui protège tout dossier déjà persisté d'une invalidation
		// rétroactive (KR-160/KR-191) — `monde.personnages[]` existe depuis la n° 1, et
		// AUCUN document écrit avant cette itération ne porte de `caractere`.
		const sansCurseurs = fixture()
		delete obj(caractere(sansCurseurs)).curseurs

		const calme = validateDossier(sansCurseurs)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		const sansCaractere = fixture()
		delete personnage(sansCaractere).caractere

		const calmeAussi = validateDossier(sansCaractere)

		expect(calmeAussi.errors).toEqual([])
		expect(calmeAussi.warnings).toEqual([])
		expect(calmeAussi.ok).toBe(true)
	})

	it('un bloc curseurs a 1-5 cles est refuse, et l anomalie nomme le curseur manquant', () => {
		// L'AUTRE moitié : TOTAL quand présent. Dérivé — CHAQUE clé est retirée à son
		// tour ; un test qui n'en retirerait qu'une laisserait cinq lignes de table non
		// éprouvées (KR-199, énumération échantillonnée).
		const refuses = CURSEUR_VALUES.map((id) => {
			const doc = fixture()
			delete obj(curseurs(doc))[id]
			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === `monde.personnages[0].caractere.curseurs.${id}`)
			return {
				id,
				ok: resultat.ok,
				code: anomalie?.code,
				location: anomalie?.location,
				nommeLeCurseur: anomalie?.message.includes(`« ${id} »`) ?? false,
			}
		})

		expect(refuses).toEqual(
			CURSEUR_VALUES.map((id) => ({
				id,
				ok: false,
				code: 'valeur-hors-enumeration',
				location: 'Personnage « Aldûr le Sage »',
				nommeLeCurseur: true,
			})),
		)

		// Cas limite : un bloc réduit à UNE clé est refusé CINQ fois, jamais une seule —
		// chaque ligne de table parle pour SA clé, sans quoi l'auteur chercherait les
		// quatre autres champs à remplir.
		const doc = fixture()
		caractere(doc).curseurs = { mefiance: 4 }

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		expect(resultat.errors.filter((e) => e.code === 'valeur-hors-enumeration').map((e) => e.path)).toEqual(
			CURSEUR_VALUES.filter((id) => id !== 'mefiance').map((id) => `monde.personnages[0].caractere.curseurs.${id}`),
		)
	})

	it('un curseur a 0 et a 10 est accepte ; -1, 11, 2.5 et une chaine sont bloquants', () => {
		// Limite et limite+1 des DEUX côtés (KR-165), plus les deux corruptions de type
		// que l'énumération explicite attrape par la même porte : un non-entier et une
		// chaîne ne sont pas dans la liste, donc ils tombent sans qu'aucune règle de
		// forme n'ait à être écrite.
		for (const valeur of [CURSEUR_MIN, CURSEUR_MAX]) {
			const doc = fixture()
			obj(curseurs(doc)).mefiance = valeur

			expect(`${valeur} → ${JSON.stringify(validateDossier(doc).errors)}`).toBe(`${valeur} → []`)
		}

		for (const valeur of [CURSEUR_MIN - 1, CURSEUR_MAX + 1, 2.5, '3']) {
			const doc = fixture()
			obj(curseurs(doc)).mefiance = valeur

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

			expect(`${valeur} → ${resultat.ok}`).toBe(`${valeur} → false`)
			expect(anomalie?.path).toBe('monde.personnages[0].caractere.curseurs.mefiance')
			expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
			expect(anomalie?.message).toContain('« mefiance »')
			expect(anomalie?.message).toContain(String(valeur))
			// La borne haute est ANNONCÉE dans le message : l'auteur doit lire ce qui est
			// attendu, pas seulement ce qui est refusé.
			expect(anomalie?.message).toContain(String(CURSEUR_MAX))
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		}
	})

	it('chaque valeur de l echelle est acceptee sur chaque curseur', () => {
		// Discriminant des refus ci-dessus : ce n'est pas « toute valeur est refusée ».
		// Dérivé des deux registres — les six clés × les onze valeurs.
		const refuses = CURSEUR_VALUES.flatMap((id) =>
			VALEURS_DE_CURSEUR.filter((valeur) => {
				const doc = fixture()
				obj(curseurs(doc))[id] = valeur
				return !validateDossier(doc).ok
			}).map((valeur) => `${id} = ${valeur}`),
		)

		expect(refuses).toEqual([])
	})

	it('CURSEURS_INITIAUX est le bloc des six cles au plancher, et il passe le validateur', () => {
		// La valeur SEMÉE à l'écriture doit être acceptée par le schéma qui la valide :
		// sans cette assertion, l'écran pourrait écrire un bloc que l'import refuserait,
		// et l'auteur ne l'apprendrait qu'en rouvrant son dossier. Même garde que
		// `STATS_INITIALES` ci-dessus.
		expect(CURSEURS_INITIAUX).toEqual(Object.fromEntries(CURSEUR_VALUES.map((id) => [id, CURSEUR_MIN])))
		expect(Object.keys(CURSEURS_INITIAUX)).toEqual(CURSEUR_VALUES)

		const doc = fixture()
		caractere(doc).curseurs = { ...CURSEURS_INITIAUX }

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('parler a la limite ET a limite+1 passe : PARLER_REPLIQUES ne refuse rien au SSOT', () => {
		// KR-165 exige qu'une borne soit testée À LA LIMITE ET À LIMITE+1. Celle-ci est
		// une borne d'INTERFACE, tranchée au raffinage (désaccords #3 et #7) : l'écran
		// cesse d'offrir le bouton d'ajout, le SSOT n'a AUCUNE règle de cardinalité — et
		// c'est le sens de ce test, dont les deux cas passent. Un document importé qui
		// porte une réplique de trop se rend EN ENTIER ; c'est l'assembleur n° 10 qui
		// tronquera à l'injection, il n'échouera pas.
		//
		// La moitié « toutes rendues » appartient au lot B (`caractere.test.tsx`) ; celle
		// -ci est la moitié CONTRAT : « aucun refus ».
		const replique = (rang: number): string => `Réplique n°${rang} — le ton, jamais le texte.`

		for (const nombre of [PARLER_REPLIQUES, PARLER_REPLIQUES + 1]) {
			const doc = fixture()
			caractere(doc).parler = Array.from({ length: nombre }, (_, rang) => replique(rang + 1))

			const resultat = validateDossier(doc)

			expect(`${nombre} répliques → ${JSON.stringify(resultat.errors)}`).toBe(`${nombre} répliques → []`)
			expect(`${nombre} répliques → ${JSON.stringify(resultat.warnings)}`).toBe(`${nombre} répliques → []`)
		}

		// Discriminant : le champ est réellement RELU du document — sans cette ligne, un
		// validateur qui écarterait silencieusement `parler` satisferait tout ce qui
		// précède. La liste ressort ENTIÈRE, y compris la réplique de trop.
		const doc = fixture()
		caractere(doc).parler = Array.from({ length: PARLER_REPLIQUES + 1 }, (_, rang) => replique(rang + 1))

		const rendu = validateDossier(doc).dossier?.monde.personnages[0].caractere?.parler

		expect(rendu).toEqual([replique(1), replique(2), replique(3)])
		expect(rendu).toHaveLength(PARLER_REPLIQUES + 1)
	})

	it('les trois proses de caractere sont libres : leur absence ne produit aucune anomalie', () => {
		// `parler`, `jamais` et `cede_si` n'ont AUCUNE règle de forme au schéma 1 —
		// « absent ≠ vide » (KR-191), et leur corruption est dispensée dans
		// `couverture.test.ts` sous le motif des proses d'entité. Ce test dit l'autre
		// moitié : leur absence ne produit rien non plus, pas même un avertissement.
		const doc = fixture()
		delete caractere(doc).parler
		delete caractere(doc).jamais
		delete caractere(doc).cede_si

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
		// Discriminant : les six curseurs, eux, sont toujours là — sans cette ligne, le
		// calme ci-dessus pourrait venir d'un bloc `caractere` devenu vide, qui ne dirait
		// rien de la liberté des trois proses.
		const rendus = resultat.dossier?.monde.personnages[0].caractere?.curseurs

		expect(rendus === undefined ? [] : Object.keys(rendus)).toEqual(CURSEUR_VALUES)
	})

	it('le dossier de reference (6 personnages) reste accepte SANS REGRESSION quand un curseur y est corrompu, et SEULE cette anomalie remonte', () => {
		// MÊME FORME que les tests de non-régression d'it4 et d'it5, et pour la même
		// raison (BUG-072) : les deux moitiés — « le dossier de référence reste accepté
		// sans régression sur les champs hors lot » et « une valeur hors échelle est
		// refusée » — ne valent que prouvées ENSEMBLE, sur le MÊME document et dans le
		// MÊME résultat. Prouvées séparément, une régression qui n'apparaît qu'en
		// présence des cinq autres personnages passerait les deux tests.
		const doc = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
		const corvin = arr(obj(doc.monde).personnages)[1]
		expect(corvin.nom).toBe('Corvin le Marchand')
		obj(obj(corvin.caractere).curseurs).cupidite = CURSEUR_MAX + 1

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		// SEULE l'anomalie attendue : rien d'autre, dans les six personnages et le reste
		// du dossier, n'a régressé du fait de cette corruption. Le message d'échec NOMME
		// le chemin et le OÙ, il ne les compte pas.
		expect(resultat.errors.map((e) => `${e.code} → ${e.path} — ${e.location}`)).toEqual([
			'valeur-hors-enumeration → monde.personnages[1].caractere.curseurs.cupidite — Personnage « Corvin le Marchand »',
		])
		expect(resultat.warnings).toEqual([])

		// Discriminant : le MÊME document, intact, ne produit RIEN. Sans cette ligne, un
		// dossier de référence devenu invalide pour une tout autre raison satisferait
		// l'assertion ci-dessus par accident.
		const intact = validateDossier(JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')))

		expect(intact.errors).toEqual([])
		expect(intact.warnings).toEqual([])
		expect(intact.ok).toBe(true)
	})

	it('un but sans libelle est bloquant, un personnage SANS but reste calme', () => {
		// MÊME CONTRAT QUE `stats` — optionnel EN BLOC, requis DEDANS — et par le même
		// mécanisme : `sitesDe` ne produit aucun site sous un bloc absent, donc le
		// « optionnel en bloc » ne coûte pas une ligne à `validate.ts`.
		//
		// LES DEUX MOITIÉS SONT ASSERTÉES ENSEMBLE, et le nom du test les porte toutes
		// les deux (KR-199) : la moitié « calme » est celle qui protège tout dossier
		// déjà persisté d'une invalidation rétroactive (KR-160/KR-191), et un test qui
		// ne prouverait que le refus la laisserait sans garde.
		const sansBut = fixture()
		delete personnage(sansBut).but

		const calme = validateDossier(sansBut)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		const sansLibelle = fixture()
		personnage(sansLibelle).but = { pourquoi: "Il porte la faute d'avoir laissé le sceau se briser." }

		const resultat = validateDossier(sansLibelle)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.personnages[0].but.libelle')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('champ-requis-vide')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
		expect(anomalie?.message).toContain('« libelle »')

		// Discriminant : un bloc VIDE est refusé lui aussi — sans cette ligne,
		// « présent » se réduirait à « porte au moins une clé ».
		const butVide = fixture()
		personnage(butVide).but = {}

		expect(codes(validateDossier(butVide).errors)).toContain('champ-requis-vide')
	})

	it('une contre-mesure sans action est bloquante, une liste contre_mesures ABSENTE reste calme', () => {
		// Même forme que le test du `but` ci-dessus, sur l'autre porteur optionnel de
		// l'itération : une LISTE au lieu d'un bloc. Les deux moitiés, encore, parce que
		// `contre_mesures` arrive sur une collection qui existe depuis la n° 1 — un
		// dossier déjà persisté n'en porte aucune, et cela doit rester silencieux.
		const sansListe = fixture()
		delete personnage(sansListe).contre_mesures

		const calme = validateDossier(sansListe)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		const sansAction = fixture()
		delete contreMesure(sansAction).action

		const resultat = validateDossier(sansAction)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.personnages[0].contre_mesures[0].action')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('champ-requis-vide')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('une relation sans cible_id ou sans lien est bloquante, une liste relations ABSENTE reste calme', () => {
		// MÊME FORME que les deux tests ci-dessus, sur la liste optionnelle de
		// l'itération 5, et les deux moitiés portées par le nom du test (KR-199) : la
		// moitié CALME est celle qui protège d'une invalidation rétroactive tout dossier
		// déjà persisté — `monde.personnages[]` existe depuis la n° 1 sans ce champ, et
		// `schema: 1` n'a aucun chemin de migration (KR-160/KR-191).
		const sansListe = fixture()
		delete personnage(sansListe).relations

		const calme = validateDossier(sansListe)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		// LES DEUX CHAMPS REQUIS DE L'ÉLÉMENT, chacun retiré à son tour : un test qui
		// n'en retirerait qu'un laisserait l'autre ligne de table non éprouvée.
		const manquants = ['cible_id', 'lien'].map((champ) => {
			const doc = fixture()
			delete relation(doc)[champ]
			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === `monde.personnages[0].relations[0].${champ}`)
			return {
				champ,
				ok: resultat.ok,
				code: anomalie?.code,
				location: anomalie?.location,
				nommeLeChamp: anomalie?.message.includes(`« ${champ} »`) ?? false,
			}
		})

		expect(manquants).toEqual(
			['cible_id', 'lien'].map((champ) => ({
				champ,
				ok: false,
				code: 'champ-requis-vide',
				location: 'Personnage « Aldûr le Sage »',
				nommeLeChamp: true,
			})),
		)
	})

	it('une presence sans lieu_id est bloquante, une liste presence ABSENTE reste calme', () => {
		// Le jumeau du test ci-dessus sur l'autre liste de l'itération : `quand` n'y
		// figure PAS, et c'est le point de contrat — une présence dit OÙ, le moment reste
		// facultatif parce qu'il vient de la session.
		const sansListe = fixture()
		delete personnage(sansListe).presence

		const calme = validateDossier(sansListe)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		const sansLieu = fixture()
		delete presence(sansLieu).lieu_id

		const resultat = validateDossier(sansLieu)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.personnages[0].presence[0].lieu_id')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('champ-requis-vide')
		expect(anomalie?.message).toContain('« lieu_id »')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')

		// Discriminant : `quand` retiré ne dit RIEN — sinon le test ci-dessus prouverait
		// seulement « une présence amputée est refusée », sans dire de quel champ.
		const sansQuand = fixture()
		delete presence(sansQuand).quand

		expect(validateDossier(sansQuand).errors).toEqual([])
		expect(validateDossier(sansQuand).warnings).toEqual([])
	})

	it('intensite : les bornes et le neutre passent, hors bornes ou non entier est bloquant, absente aussi', () => {
		// Limite et limite+1 des DEUX côtés (KR-165), plus les corruptions de type que
		// l'énumération explicite attrape par la même porte — un non-entier, une chaîne
		// et un nul ne sont pas dans la liste. Les bornes sont LUES des constantes
		// nommées, jamais recopiées ici : ce sont elles qui décident à la fois du refus à
		// l'import et du `min`/`max` du `Stepper` de saisie.
		for (const valeur of [INTENSITE_MIN, INTENSITE_MAX, 0]) {
			const doc = fixture()
			relation(doc).intensite = valeur

			expect(`${valeur} → ${JSON.stringify(validateDossier(doc).errors)}`).toBe(`${valeur} → []`)
		}

		for (const valeur of [INTENSITE_MIN - 1, INTENSITE_MAX + 1, 1.5, '2', null]) {
			const doc = fixture()
			relation(doc).intensite = valeur

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

			expect(`${String(valeur)} → ${resultat.ok}`).toBe(`${String(valeur)} → false`)
			expect(anomalie?.path).toBe('monde.personnages[0].relations[0].intensite')
			expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
			expect(anomalie?.message).toContain('« intensite »')
			// Les DEUX bornes sont ANNONCÉES : l'auteur lit ce qui est attendu, pas
			// seulement ce qui est refusé.
			expect(anomalie?.message).toContain(String(INTENSITE_MIN))
			expect(anomalie?.message).toContain(String(INTENSITE_MAX))
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		}

		// `requis: true` DANS l'élément : une relation dont personne n'a réglé
		// l'intensité laisserait indéfini le seuil que le moteur y lira.
		const absente = fixture()
		delete relation(absente).intensite

		expect(validateDossier(absente).errors.map((e) => `${e.code} → ${e.path}`)).toEqual([
			'valeur-hors-enumeration → monde.personnages[0].relations[0].intensite',
		])
	})

	it('la ligne d intensite lit le registre INTENSITES, jamais CONFIANCES', () => {
		// LE DÉFAUT QUE CE TEST EXISTE POUR INTERDIRE : les deux registres portent
		// AUJOURD'HUI les mêmes sept valeurs, donc réutiliser `CONFIANCES` ici serait
		// invisible — aucun test de comportement ne rougirait, et les deux échelles
		// dériveraient ensemble au premier changement de l'une. C'est une identité
		// d'OBJET qui est épinglée, pas une égalité de contenu.
		const ligne = ENUMERES_FERMES.find((e) => e.path === 'monde.personnages[].relations[].intensite')
		const confiance = ENUMERES_FERMES.find((e) => e.path === 'monde.personnages[].savoirs[].revele_si.confiance_min')

		expect(ligne?.valeurs).toBe(INTENSITES)
		expect(ligne?.requis).toBe(true)
		expect(confiance?.valeurs).toBe(CONFIANCES)
		expect(INTENSITES).toEqual(CONFIANCES)
		expect(INTENSITES).not.toBe(CONFIANCES)

		// L'échelle est DÉRIVÉE de ses deux bornes nommées, jamais réécrite (KR-165) —
		// même construction que `CONFIANCES` et `VALEURS_DE_CARACTERISTIQUE`.
		expect(INTENSITES[0]).toBe(INTENSITE_MIN)
		expect(INTENSITES[INTENSITES.length - 1]).toBe(INTENSITE_MAX)
		expect(INTENSITES).toHaveLength(INTENSITE_MAX - INTENSITE_MIN + 1)
	})

	it('secret accepte true et false, son absence reste calme, toute autre valeur est bloquante', () => {
		// `requis: false` : une relation dont l'auteur n'a rien dit n'est pas secrète —
		// « absent se traite comme `false` », JSDoc de `Relation.secret`. Exiger le
		// drapeau invaliderait le premier dossier qui porterait une relation ordinaire.
		for (const valeur of [true, false]) {
			const doc = fixture()
			relation(doc).secret = valeur

			expect(`${valeur} → ${JSON.stringify(validateDossier(doc).errors)}`).toBe(`${valeur} → []`)
		}

		const absent = fixture()
		delete relation(absent).secret

		const calme = validateDossier(absent)

		expect(calme.errors).toEqual([])
		expect(calme.warnings).toEqual([])
		expect(calme.ok).toBe(true)

		const doc = fixture()
		relation(doc).secret = 'oui'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.personnages[0].relations[0].secret')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('valeur-hors-enumeration')
		expect(anomalie?.message).toContain('« secret »')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('une relation AUTO-REFERENTIELLE est acceptee sans erreur ni avertissement (KR-194)', () => {
		// LA PREMIÈRE RÉFÉRENCE AUTO-RÉFÉRENTIELLE DU SCHÉMA, tolérée au SSOT sans garde
		// nouvelle : `cible_id === personnage.id` est une didascalie de conflit intérieur,
		// jouable telle quelle. La fixture minimale ne porte qu'UN personnage, donc sa
		// relation pointe le porteur — c'est délibéré, et l'identifiant est ASSERTÉ plutôt
		// que supposé : sans cette ligne, le test resterait vert le jour où la fixture
		// cesserait d'être auto-référentielle, et la garde disparaîtrait en silence.
		const doc = fixture()

		expect(relation(doc).cible_id).toBe(personnage(doc).id)

		const resultat = validateDossier(doc)

		expect(resultat.errors).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)

		// Discriminant : ce n'est pas « toute cible passe ». L'auto-référence est tolérée
		// parce qu'elle RÉSOUT, pas parce que la règle aurait été désarmée.
		const pendante = fixture()
		relation(pendante).cible_id = 'pnj.nulle-part'

		expect(codes(validateDossier(pendante).errors)).toEqual(['reference-pendante'])
	})

	/**
	 * Où poser une valeur de champ ENTIER, par chemin de `CHAMPS_ENTIERS`. Un chemin
	 * ajouté à la table sans son poseur se NOMME dans le test juste en dessous, il ne
	 * disparaît pas du diff.
	 */
	const POSEURS_D_ENTIER: Record<string, (doc: Doc, valeur: unknown) => void> = {
		'monde.personnages[].plan_actions[].duree': (doc, valeur) => {
			etape(doc).duree = valeur
		},
		'monde.personnages[].contre_mesures[].delai': (doc, valeur) => {
			contreMesure(doc).delai = valeur
		},
	}

	it('les champs entiers ont tous leur poseur, aucun de plus', () => {
		expect(Object.keys(POSEURS_D_ENTIER).sort()).toEqual(CHAMPS_ENTIERS.map((champ) => champ.path).sort())
	})

	for (const champ of CHAMPS_ENTIERS) {
		it(`champ entier ${champ.path} : sous DUREE_MIN, non entier ou non numerique, refuse`, () => {
			// La borne est LUE dans la table, jamais recopiée ici (KR-165) : `DUREE_MIN`
			// décide à la fois du refus à l'import et du `min` du widget de saisie.
			//
			// L'ÉNUMÉRATION DES REFUS remplace ce que l'appartenance disait pour les
			// caractéristiques : faute de borne haute, aucune liste ne peut décrire
			// l'ensemble admis, donc « nombre, entier, au moins min » doit être éprouvé
			// morceau par morceau — sous la borne, non entier, textuel, booléen, nul.
			const REFUSES: unknown[] = [champ.min - 1, -3, 2.5, `${champ.min}`, true, null]

			for (const valeur of REFUSES) {
				const doc = fixture()
				POSEURS_D_ENTIER[champ.path](doc, valeur)

				const resultat = validateDossier(doc)
				const anomalie = resultat.errors.find((e) => e.path.endsWith(feuilleDe(champ.path)))

				expect(`${String(valeur)} → ${anomalie?.code ?? 'aucune anomalie'}`).toBe(
					`${String(valeur)} → valeur-hors-enumeration`,
				)
				expect(anomalie?.message).toContain(`« ${feuilleDe(champ.path)} »`)
				expect(anomalie?.message).toContain(`supérieur ou égal à ${champ.min}`)
				expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
				expect(resultat.ok).toBe(false)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
				}
			}

			// Discriminant (a) : la borne ELLE-MÊME passe, et une valeur bien au-dessus
			// aussi — sans ces deux lignes, « tout est refusé » satisferait la boucle.
			for (const valeur of [champ.min, champ.min + 41]) {
				const doc = fixture()
				POSEURS_D_ENTIER[champ.path](doc, valeur)

				expect(`${valeur} → ${validateDossier(doc).ok}`).toBe(`${valeur} → true`)
			}

			// Discriminant (b) : l'ABSENCE n'est pas une erreur — les deux champs sont
			// optionnels, et une étape que rien ne périme est légitime. (Elle peut, elle,
			// déclencher l'avertissement `si_bloque`, qui ne touche pas `errors`.)
			const absent = fixture()
			POSEURS_D_ENTIER[champ.path](absent, undefined)

			expect(validateDossier(absent).errors).toEqual([])
			expect(validateDossier(absent).ok).toBe(true)
		})
	}

	it('si_bloque sans duree avertit sans bloquer, sur DEUX personnages distincts', () => {
		// CONTRÔLE ISOLÉ, hors `FAMILLES_DE_CONDITIONS` : `si_bloque` n'a aucun jumeau
		// `…_expr`, et ce qui lui manque n'est pas une expression mais l'HORLOGE qui
		// rend le blocage constatable. Même statut que `caractere.cede_si`.
		//
		// DEUX PERSONNAGES, parce que c'est le `path` INDEXÉ qui est le contrat : la
		// fiche filtrera ces avertissements par préfixe de chemin pour n'afficher que
		// ceux du personnage sélectionné. Un test mono-personnage ne distinguerait pas
		// un chemin indexé d'un chemin de table.
		const doc = fixture()
		const second = JSON.parse(JSON.stringify(personnage(doc))) as Doc
		second.id = 'pnj.brise-fer'
		second.nom = 'Brise-Fer'
		arr(obj(doc.monde).personnages).push(second)
		for (const fiche of arr(obj(doc.monde).personnages)) delete arr(fiche.plan_actions)[0].duree

		const resultat = validateDossier(doc)
		const alertes = resultat.warnings.filter((w) => w.code === 'condition-sans-expr')

		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true) // un avertissement ne bloque JAMAIS
		expect(alertes.map((a) => `${a.location} → ${a.path}`)).toEqual([
			'Personnage « Aldûr le Sage » → monde.personnages[0].plan_actions[0].si_bloque',
			'Personnage « Brise-Fer » → monde.personnages[1].plan_actions[0].si_bloque',
		])
		expect(alertes[0].severity).toBe('warning')
		expect(alertes[0].message).toContain('si_bloque')
		expect(dossierIssueRemediation(alertes[0])).toBe(DOSSIER_ISSUE_LABELS['condition-sans-expr'])
		for (const fuite of FUITES_TECHNIQUES) {
			expect(alertes[0].message.toLowerCase()).not.toContain(fuite)
		}
	})

	it('une etape sans duree ET sans si_bloque reste calme — discriminant du controle isole', () => {
		// La moitié qui dit que c'est bien `si_bloque` qui parle : une étape sans
		// échéance est parfaitement légitime, et l'avertissement ne doit surgir que
		// lorsqu'une porte de sortie a été ÉCRITE sans horloge pour l'ouvrir.
		const doc = fixture()
		delete etape(doc).duree
		delete etape(doc).si_bloque

		const resultat = validateDossier(doc)

		expect(resultat.warnings).toEqual([])
		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true)

		// Et l'autre sens : une durée SANS porte de sortie ne dit rien non plus — la
		// durée seule est une échéance d'étape, elle n'appelle aucune réplique.
		const sansSortie = fixture()
		delete etape(sansSortie).si_bloque

		expect(validateDossier(sansSortie).warnings).toEqual([])
	})

	it('une carac ou un TC de jet hors registre est bloquant', () => {
		// Les deux ensembles viennent des registres de règles, pas d'une liste
		// recopiée : un jet de révélation est un challenge ORDINAIRE.
		const doc = fixture()
		obj(revele(doc).jet).carac = 'XX'
		obj(revele(doc).jet).tc = 'TC9'

		const anomalies = validateDossier(doc).errors.filter((e) => e.code === 'valeur-hors-enumeration')

		expect(anomalies.map((e) => e.path)).toEqual([
			'monde.personnages[0].savoirs[0].revele_si.jet.carac',
			'monde.personnages[0].savoirs[0].revele_si.jet.tc',
		])
		expect(anomalies[0].message).toContain('CA')
		expect(anomalies[1].message).toContain('TC4')
	})

	const CAS_DE_DELTAS: ReadonlyArray<readonly [string, (doc: Doc) => void, string]> = [
		[
			'quetes recompense',
			(doc) => {
				arr(obj(doc.monde).quetes)[0].recompense = 'la clef de basalte'
			},
			'monde.quetes[0].recompense',
		],
		[
			'evenements resolutions consequence',
			(doc) => {
				arr(evenement(doc).resolutions)[0].consequence = 'les gobelins fuient'
			},
			'monde.evenements[0].resolutions[0].consequence',
		],
		[
			'conditions climat effets_regles',
			(doc) => {
				arr(obj(obj(doc.monde).conditions).climat)[0].effets_regles = 'la vue est réduite'
			},
			'monde.conditions.climat[0].effets_regles',
		],
		[
			'jalons effet',
			(doc) => {
				jalon(doc).effet = 'le bourg se réveille'
			},
			'charpente.jalons[0].effet',
		],
	]

	for (const [nom, casser, chemin] of CAS_DE_DELTAS) {
		it(`une chaine au chemin de delta ${nom} est refusee`, () => {
			const doc = fixture()
			casser(doc)

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'delta-en-prose')

			expect(resultat.ok).toBe(false)
			expect(anomalie?.path).toBe(chemin)
		})
	}

	/**
	 * Le chemin de delta ABSENT, distinct du chemin en prose. Ces quatre champs
	 * sont OBLIGATOIRES : l'argument « la corruption subsume la suppression » du
	 * balayage de couverture ne vaut que pour les optionnels (`revele_si`,
	 * `monstre_ref`), donc il ne couvre pas cette branche.
	 *
	 * Trou relevé par la QA en mode B, et prouvé réel : neutraliser la branche
	 * `champ-requis-vide` de la boucle des deltas laissait les 85 tests du module
	 * verts.
	 */
	for (const [nom, , chemin] of CAS_DE_DELTAS) {
		it(`un chemin de delta ${nom} absent est bloquant`, () => {
			const doc = fixture()
			const segments = chemin.split('.')
			const feuille = segments.pop() as string
			let porteur: Doc = doc
			for (const segment of segments) {
				const indice = segment.match(/\[(\d+)\]$/)
				porteur = indice ? arr(porteur[segment.slice(0, -indice[0].length)])[Number(indice[1])] : obj(porteur[segment])
			}
			delete porteur[feuille]

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === chemin)

			expect(resultat.ok).toBe(false)
			// Un champ absent est VIDE, pas de la prose : les deux codes ne se confondent pas.
			expect(anomalie?.code).toBe('champ-requis-vide')
			expect(codes(resultat.errors)).not.toContain('delta-en-prose')
		})
	}

	/**
	 * Les LISTES OBLIGATOIRES. `sitesDe` abandonne un segment `[]` dont la valeur
	 * n'est pas un tableau — ce qui lui permet de traverser un document non fiable
	 * sans lever, mais rend muettes les règles portées par ses descendants.
	 *
	 * Relevé à la revue de PR : on croyait `conditions.climat` seul dans ce cas,
	 * il y en avait QUATRE. Un tableau vide est légitime (un personnage sans
	 * savoir existe) ; c'est la clé ABSENTE qui ment au typage.
	 */
	const CAS_DE_LISTES_REQUISES: ReadonlyArray<readonly [string, (doc: Doc) => void, string]> = [
		['plan_actions', (doc) => delete personnage(doc).plan_actions, 'monde.personnages[0].plan_actions'],
		['savoirs', (doc) => delete personnage(doc).savoirs, 'monde.personnages[0].savoirs'],
		['resolutions', (doc) => delete evenement(doc).resolutions, 'monde.evenements[0].resolutions'],
		['climat', (doc) => delete obj(obj(doc.monde).conditions).climat, 'monde.conditions.climat'],
	]

	for (const [nom, casser, chemin] of CAS_DE_LISTES_REQUISES) {
		it(`une liste obligatoire ${nom} absente est bloquante`, () => {
			const doc = fixture()
			casser(doc)

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === chemin)

			expect(resultat.ok).toBe(false)
			expect(anomalie?.code).toBe('champ-requis-vide')
			expect(anomalie?.message).toContain(`« ${nom} »`)
		})

		it(`une liste obligatoire ${nom} VIDE reste calme`, () => {
			// Discriminant : c'est l'absence qui ment au typage, pas le vide.
			const doc = fixture()
			casser(doc)
			const segments = chemin.replace(/\[\d+\]/g, '').split('.')
			const feuille = segments.pop() as string
			let porteur: Doc = doc
			for (const segment of segments)
				porteur = obj(Array.isArray(porteur[segment]) ? arr(porteur[segment])[0] : porteur[segment])
			porteur[feuille] = []

			expect(validateDossier(doc).errors.filter((e) => e.path === chemin)).toEqual([])
		})
	}

	it('un element non-objet d une liste de deltas est delta-malforme, jamais element-non-objet', () => {
		// LA SCISSION du § 3.2, et c'est elle qui interdit de confondre deux frontières.
		// CAUSE EXACTE, corrigée à la revue de PR : la dérivation ne lit JAMAIS
		// `CHEMINS_DE_DELTAS` — elle filtre `LISTES_REQUISES`, et aucun chemin de delta
		// n'y figure. L'exclusion est donc INCIDENTE, pas mécanique ; c'est
		// l'assertion de disjonction de `couverture.test.ts` qui la rend mécanique.
		// (Énoncer une cause fausse pour un fait vrai est exactement la classe que
		// KR-176 vient de poser.) Ce que l'auteur doit corriger n'est pas « mettre un
		// objet » mais « écrire un effet reconnu ».
		const doc = fixture()
		jalon(doc).effet = ['le bourg se réveille']

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'charpente.jalons[0].effet[0]')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('delta-malforme')
		expect(anomalie?.location).toBe('Jalon « La première nuit à Val-Cendre »')
		expect(anomalie?.message).toContain('le bourg se réveille')
		expect(codes(resultat.errors)).not.toContain('element-non-objet')
		// Discriminant : la LISTE ELLE-MÊME remplacée par de la prose reste
		// `delta-en-prose` — la valeur n'est alors même pas une liste.
		expect(codes(resultat.errors)).not.toContain('delta-en-prose')
	})

	it('un objet quelconque aux quatre chemins de delta est desormais refuse', () => {
		// INVERSION ASSUMÉE du test d'it2 (« un objet aux quatre chemins passe »). L'it2
		// ne fermait que la FORME — un objet, jamais de la prose —, en laissant les clés
		// libres parce que leur vocabulaire n'existait pas encore. L'it4 le ferme : une
		// clé neutre n'est plus un effet, c'est un effet malformé.
		const doc = fixture()
		const delta = [{ cle: 'valeur libre' }]
		arr(obj(doc.monde).quetes)[0].recompense = delta
		arr(evenement(doc).resolutions)[0].consequence = delta
		arr(obj(obj(doc.monde).conditions).climat)[0].effets_regles = delta
		jalon(doc).effet = delta

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		expect(codes(resultat.errors).filter((code) => code === 'delta-malforme')).toHaveLength(8)
		// DEUX anomalies par emplacement, et ce sont deux causes distinctes : la clé
		// inconnue, puis la clé `delta` absente.
		expect(resultat.errors.filter((e) => e.message.includes('« cle »'))).toHaveLength(4)
		// LA SCISSION, éprouvée sur les QUATRE chemins et non sur un seul : un
		// emplacement de delta ne produit JAMAIS `element-non-objet`, quel qu'il soit.
		expect(codes(resultat.errors)).not.toContain('element-non-objet')
	})

	it('un element NON-OBJET aux quatre chemins de delta reste delta-malforme, jamais element-non-objet', () => {
		// La scission ne portait que sur `jalons[].effet` ; la propriété qu'elle annonce
		// vaut pour les quatre. Relevé à la revue de PR : une assertion qui ne couvre
		// qu'un chemin ne porte pas la propriété qu'elle nomme.
		const doc = fixture()
		const brut = ['du texte a la place']
		arr(obj(doc.monde).quetes)[0].recompense = brut
		arr(evenement(doc).resolutions)[0].consequence = brut
		arr(obj(obj(doc.monde).conditions).climat)[0].effets_regles = brut
		jalon(doc).effet = brut

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		expect(codes(resultat.errors).filter((code) => code === 'delta-malforme')).toHaveLength(4)
		expect(codes(resultat.errors)).not.toContain('element-non-objet')
	})

	it('un delta inconnu nomme l entite porteuse et la valeur', () => {
		const doc = fixture()
		jalon(doc).effet = [{ delta: 'gagner_xp', cibles: ['objet.clef-de-basalte'] }]

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'delta-inconnu')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('charpente.jalons[0].effet[0]')
		expect(anomalie?.location).toBe('Jalon « La première nuit à Val-Cendre »')
		expect(anomalie?.message).toContain('« gagner_xp »')
		expect(anomalie?.message).toContain('« effet »')
		// Le QUOI FAIRE nomme le CHAMP, jamais le chemin entier ni le rang.
		expect(dossierIssueRemediation(anomalie as DossierIssue)).toContain('« effet »')
		for (const fuite of FUITES_TECHNIQUES) {
			expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
		}
	})

	it('une cible d effet mal formee est identifiant-invalide, une cible non portee est reference-pendante', () => {
		// Deux causes DISTINCTES, deux codes réutilisés d'it1 — un code par CAUSE, pas
		// un code par emplacement. La forme est tranchée par `validateDelta`, la
		// résolution par le validateur, et la seconde n'est consultée que si la
		// première s'est tue.
		const malFormee = fixture()
		jalon(malFormee).effet = [{ delta: 'donner_objet', cibles: ['lieu.val-cendre'] }]

		const surLaForme = validateDossier(malFormee)
		const invalide = surLaForme.errors.find((e) => e.path === 'charpente.jalons[0].effet[0]')

		expect(surLaForme.ok).toBe(false)
		expect(invalide?.code).toBe('identifiant-invalide')
		expect(invalide?.entityId).toBe('lieu.val-cendre')
		expect(invalide?.message).toContain(DELTAS.donner_objet.label)
		expect(codes(surLaForme.errors)).not.toContain('reference-pendante')

		const pendante = fixture()
		jalon(pendante).effet = [{ delta: 'donner_objet', cibles: ['objet.nulle-part'] }]

		const surLaResolution = validateDossier(pendante)
		const orpheline = surLaResolution.errors.find((e) => e.path === 'charpente.jalons[0].effet[0]')

		expect(surLaResolution.ok).toBe(false)
		expect(orpheline?.code).toBe('reference-pendante')
		expect(orpheline?.entityId).toBe('objet.nulle-part')
		expect(orpheline?.location).toBe('Jalon « La première nuit à Val-Cendre »')
		// Le message nomme l'effet par son LIBELLÉ, le champ porteur et l'id fautif.
		expect(orpheline?.message).toContain(DELTAS.donner_objet.label)
		expect(orpheline?.message).toContain('« effet »')
		expect(orpheline?.message).toContain('objet.nulle-part')
	})

	it('les quatre chemins de delta resolvent leurs cibles, pas seulement le premier', () => {
		// DISCRIMINANCE : une boucle qui ne contrôlerait qu'un emplacement passerait
		// pour exhaustive. Chaque chemin reçoit la MÊME cible pendante, chacun doit la
		// signaler à son propre `path`.
		const casser: ReadonlyArray<readonly [(doc: Doc, effet: unknown) => void, string]> = [
			[(doc, effet) => (arr(obj(doc.monde).quetes)[0].recompense = effet), 'monde.quetes[0].recompense[0]'],
			[
				(doc, effet) => (arr(evenement(doc).resolutions)[0].consequence = effet),
				'monde.evenements[0].resolutions[0].consequence[0]',
			],
			[
				(doc, effet) => (arr(obj(obj(doc.monde).conditions).climat)[0].effets_regles = effet),
				'monde.conditions.climat[0].effets_regles[0]',
			],
			[(doc, effet) => (jalon(doc).effet = effet), 'charpente.jalons[0].effet[0]'],
		]

		for (const [poser, chemin] of casser) {
			const doc = fixture()
			poser(doc, [{ delta: 'reveler_indice', cibles: ['indice.nulle-part'] }])

			const anomalie = validateDossier(doc).errors.find((e) => e.path === chemin)

			expect(`${chemin} → ${anomalie?.code ?? 'aucune anomalie'}`).toBe(`${chemin} → reference-pendante`)
		}
	})

	/**
	 * BUG-050 — l'élément de liste non-objet, ouvert depuis l'itération 1. La table
	 * a DEUX moitiés (la requise DÉRIVÉE, l'optionnelle déclarée), et le cas
	 * d'épreuve est dérivé de leur SOMME : une liste ajoutée à l'une ou à l'autre
	 * sans son poseur se NOMME ici, elle ne disparaît pas du diff.
	 *
	 * La quatrième ligne ferme le TROU RÉSIDUEL : la dérivation ne lisait que
	 * `LISTES_REQUISES`, donc AUCUNE liste optionnelle n'était contrôlée élément par
	 * élément — `contre_mesures: ["une chaîne"]` sortait `ok:true`.
	 */
	const POSEURS_DE_LISTE: Record<string, (doc: Doc, valeur: unknown[]) => void> = {
		'monde.personnages[].plan_actions': (doc, valeur) => {
			personnage(doc).plan_actions = valeur
		},
		'monde.personnages[].savoirs': (doc, valeur) => {
			personnage(doc).savoirs = valeur
		},
		'monde.evenements[].resolutions': (doc, valeur) => {
			evenement(doc).resolutions = valeur
		},
		'monde.personnages[].contre_mesures': (doc, valeur) => {
			personnage(doc).contre_mesures = valeur
		},
		'monde.personnages[].relations': (doc, valeur) => {
			personnage(doc).relations = valeur
		},
		'monde.personnages[].presence': (doc, valeur) => {
			personnage(doc).presence = valeur
		},
		// LA CINQUIÈME LIGNE (itération 3 de la n° 6) — et la PREMIÈRE de la moitié
		// déclarée dont le porteur ne soit pas un personnage. La boucle générique ne
		// change pas d'une ligne : le OÙ de son anomalie est la QUÊTE, résolu par
		// `sitesDe` en traversant `monde.quetes`, et c'est exactement ce que
		// l'assertion `location !== liste.location` ci-dessous éprouve.
		'monde.quetes[].etapes': (doc, valeur) => {
			quete(doc).etapes = valeur
		},
	}

	it('les listes a elements structures ont toutes leur poseur, aucune de plus', () => {
		expect(Object.keys(POSEURS_DE_LISTE).sort()).toEqual(LISTES_A_ELEMENTS_STRUCTURES.map((l) => l.path).sort())
	})

	for (const liste of LISTES_A_ELEMENTS_STRUCTURES) {
		it(`un element non-objet de ${liste.path} est element-non-objet`, () => {
			// Le défaut réel : `savoirs: ["du texte"]` sortait `ok:true`, et le dossier
			// gelé promettait un `Savoir` là où il y a une chaîne — le savoir disparaissait
			// SILENCIEUSEMENT du personnage, qui aurait été assemblé au contexte avec
			// moins de savoirs que l'auteur n'en a écrits.
			const doc = fixture()
			POSEURS_DE_LISTE[liste.path](doc, ['du texte'])

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'element-non-objet')

			expect(resultat.ok).toBe(false)
			expect(anomalie?.message).toContain(`« ${feuilleDe(liste.path)} »`)
			expect(anomalie?.message).toContain('du texte')
			// Le OÙ nomme l'ENTITÉ PORTEUSE, et le `path` porte l'INDEX fautif.
			expect(anomalie?.location).not.toBe(liste.location)
			expect(anomalie?.path.endsWith('[0]')).toBe(true)
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		})

		it(`une liste ${liste.path} VIDE ne declenche pas element-non-objet`, () => {
			// Discriminant : c'est l'ÉLÉMENT qui est contrôlé, jamais la liste — un
			// personnage sans savoir reste légitime. Le cas « élément objet » est tenu par
			// la fixture elle-même, qui passe sans anomalie.
			const doc = fixture()
			POSEURS_DE_LISTE[liste.path](doc, [])

			expect(codes(validateDossier(doc).errors)).not.toContain('element-non-objet')
		})
	}

	/**
	 * LE TROISIÈME TROU refermé par l'itération 1 de la n° 6, et il n'est ni celui de
	 * BUG-050 (l'élément), ni celui du § 5 (la valeur non textuelle d'une référence) :
	 * c'est le CONTENEUR. `sitesDe` abandonne un segment `[]` dont la valeur n'est pas
	 * un tableau — ce qui le rend total sur un document non fiable —, si bien qu'un
	 * `mene_a: "indice.x"` sortait `ok: true`, RÉSOLUTION COMPRISE, puis faisait LEVER
	 * le panneau qui le parcourt.
	 *
	 * Un poseur par ligne, l'exhaustivité assertée : une liste ajoutée à la table sans
	 * son poseur se NOMME ici, elle ne disparaît pas du diff. Même dispositif que
	 * `POSEURS_DE_LISTE` juste au-dessus.
	 */
	const POSEURS_DE_LISTE_TEXTUELLE: Record<string, (doc: Doc, valeur: unknown) => void> = {
		'monde.indices[].mene_a': (doc, valeur) => {
			arr(obj(doc.monde).indices)[0].mene_a = valeur
		},
		'monde.personnages[].caractere.parler': (doc, valeur) => {
			caractere(doc).parler = valeur
		},
	}

	it('les listes optionnelles textuelles ont toutes leur poseur, aucune de plus', () => {
		expect(Object.keys(POSEURS_DE_LISTE_TEXTUELLE).sort()).toEqual(
			LISTES_OPTIONNELLES_TEXTUELLES.map((l) => l.path).sort(),
		)
		// Discriminant : la table n'est pas vide, sans quoi la boucle ci-dessous ne
		// mesurerait rien. DEUX lignes dès le premier jour — c'est ce qui la sépare
		// d'une abstraction à un seul appelant.
		expect(LISTES_OPTIONNELLES_TEXTUELLES.length).toBeGreaterThan(1)
	})

	for (const liste of LISTES_OPTIONNELLES_TEXTUELLES) {
		it(`${liste.path} non-tableau ne plante pas : anomalie typee, jamais un throw`, () => {
			const doc = fixture()
			POSEURS_DE_LISTE_TEXTUELLE[liste.path](doc, 'du texte a la place')

			// LA PROPRIÉTÉ D'ABORD : le validateur est TOTAL, il rend un rapport, il ne
			// lève pas. C'est ce qui sépare une frontière de confiance d'un `try/catch`
			// posé à l'écran.
			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'liste-non-textuelle')

			expect(resultat.ok).toBe(false)
			expect(`${liste.path} → ${anomalie?.path ?? 'aucune anomalie'}`).not.toBe(`${liste.path} → aucune anomalie`)
			expect(anomalie?.message).toContain(`« ${feuilleDe(liste.path)} »`)
			expect(anomalie?.message).toContain('du texte a la place')
			// Le OÙ nomme l'ENTITÉ PORTEUSE, jamais le repli de la table.
			expect(anomalie?.location).not.toBe(liste.location)
			expect(dossierIssueRemediation(anomalie as DossierIssue)).toContain(`« ${feuilleDe(liste.path)} »`)
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		})

		it(`${liste.path} ABSENTE ou VIDE reste calme`, () => {
			// Discriminant, et c'est la moitié qui fait de la règle une règle plutôt qu'un
			// refus : ces listes sont OPTIONNELLES (« absent ≠ vide »), et une liste VIDE
			// est un état légitime — un indice qui ne mène nulle part est une feuille de
			// l'enquête, pas une anomalie.
			for (const valeur of [undefined, []]) {
				const doc = fixture()
				POSEURS_DE_LISTE_TEXTUELLE[liste.path](doc, valeur)

				expect(`${liste.path} = ${JSON.stringify(valeur) ?? 'absent'} → ${validateDossier(doc).ok}`).toBe(
					`${liste.path} = ${JSON.stringify(valeur) ?? 'absent'} → true`,
				)
			}
		})
	}

	it('le dossier de reference (4 indices) reste accepte SANS REGRESSION quand un seul mene_a y est corrompu, et SEULE cette anomalie remonte', () => {
		// CRITÈRE #8 DU PLAN D'IT1 DE LA N° 6, MÊME FORME que ceux d'it4 et d'it5 de la
		// n° 4 et pour la même raison (BUG-072) : les deux moitiés — « les indices déjà
		// persistés, et les `savoirs[].indice_id`/`apres_indice_id` qui les référencent,
		// restent acceptés sans régression » et « une référence fautive est refusée » —
		// ne valent que prouvées ENSEMBLE, sur le MÊME document et dans le MÊME résultat.
		// Prouvées séparément, une régression qui n'apparaîtrait qu'à la 4e entité d'une
		// liste, ou qu'en présence des six personnages, passerait les deux tests.
		//
		// LE DOCUMENT EST CELUI D'UNE AVENTURE RÉELLE, et c'est ce qui compte ici : le
		// premier indice porte DEUX cibles, trois personnages le référencent par
		// `indice_id`, et un quatrième par `apres_indice_id`.
		const doc = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
		const premier = arr(obj(doc.monde).indices)[0]
		expect(premier.nom).toBe('Des pas frais dans la cendre')
		expect(premier.mene_a).toHaveLength(2)
		;(premier.mene_a as string[])[1] = 'indice.nulle-part'

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		// SEULE l'anomalie attendue, et au BON RANG : ni la première cible, qui résout,
		// ni les trois autres indices, ni les six personnages qui les référencent n'ont
		// régressé du fait de cette corruption. Le message d'échec NOMME le chemin et le
		// OÙ, il ne les compte pas.
		expect(resultat.errors.map((e) => `${e.code} → ${e.path} — ${e.location}`)).toEqual([
			'reference-pendante → monde.indices[0].mene_a[1] — Indice « Des pas frais dans la cendre »',
		])
		expect(resultat.warnings).toEqual([])

		// Discriminant : le MÊME document, intact, ne produit RIEN. Sans cette ligne, un
		// dossier de référence devenu invalide pour une tout autre raison satisferait
		// l'assertion ci-dessus par accident.
		const intact = validateDossier(JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')))

		expect(intact.errors).toEqual([])
		expect(intact.warnings).toEqual([])
		expect(intact.ok).toBe(true)
	})

	it('liste-non-textuelle ne double JAMAIS une autre anomalie sur la meme cause', () => {
		// KR-164 — un code par CAUSE, jamais deux anomalies pour un seul défaut. Un
		// `mene_a` non-tableau est UNE cause : le conteneur. La résolution du § 5, elle,
		// se tait — `sitesDe` n'a produit aucun site sous le segment `[]`. Sans cette
		// assertion, on pourrait fermer le trou en empilant `element-non-objet` ou
		// `identifiant-invalide` par-dessus, et le rapport deviendrait du bruit.
		const doc = fixture()
		arr(obj(doc.monde).indices)[0].mene_a = 'indice.sceau-brise'

		const resultat = validateDossier(doc)

		expect(resultat.errors.map((e) => `${e.code} → ${e.path}`)).toEqual([
			'liste-non-textuelle → monde.indices[0].mene_a',
		])
		expect(resultat.errors[0].location).toBe('Indice « Des cendres encore tièdes »')
		expect(resultat.errors[0].message).toBe(
			'Le champ « mene_a » attend une liste de textes ; il contient « indice.sceau-brise ».',
		)
	})

	it('le dossier de reference (6 personnages) reste accepte SANS REGRESSION quand une contre-mesure y est corrompue, et SEULE cette anomalie remonte', () => {
		// Critere #8 du plan d iteration 4 : les deux moities du critere — « le
		// dossier de reference reste accepte sans regression sur les champs hors lot »
		// (couverture.test.ts:379, sur le document INTACT) et « une liste malformee
		// est refusee » (le test genere ci-dessus, sur dossier-minimal.json, UN SEUL
		// personnage) — n etaient jamais prouvees ENSEMBLE, sur le MEME document. Une
		// regression qui n apparaitrait qu a la 6e entite d une liste, ou qu en
		// presence des cinq autres personnages, aurait pu passer les deux tests
		// separement sans jamais etre vue.
		const doc = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
		const corvin = arr(obj(doc.monde).personnages)[1]
		expect(corvin.nom).toBe('Corvin le Marchand')
		arr(corvin.contre_mesures)[0] = 'du texte a la place' as unknown as Doc

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		// SEULE l anomalie attendue : rien d autre, dans les six personnages et le
		// reste du dossier, n a regresse a cause de cette corruption.
		expect(codes(resultat.errors)).toEqual(['element-non-objet'])
		expect(resultat.warnings).toEqual([])
		const anomalie = resultat.errors[0]
		expect(anomalie.path).toBe('monde.personnages[1].contre_mesures[0]')
		expect(anomalie.location).toBe('Personnage « Corvin le Marchand »')
	})

	it('le dossier de reference reste accepte SANS REGRESSION quand une relation ET une presence y sont corrompues, et SEULES ces deux anomalies remontent', () => {
		// Critère #8 du plan d'itération 5, MÊME FORME que celui d'it4 juste au-dessus et
		// pour la même raison (BUG-072) : les deux moitiés — « le dossier de référence
		// reste accepté sans régression sur les champs hors lot » et « un élément
		// malformé est refusé » — ne valent que prouvées ENSEMBLE, sur le MÊME document
		// et dans le MÊME résultat. Prouvées séparément, une régression qui n'apparaît
		// qu'en présence des cinq autres personnages passerait les deux tests.
		//
		// DEUX PORTEURS DISTINCTS ET DEUX LISTES DISTINCTES : la boucle générique parle
		// par ligne de table, et une seule corruption ne dirait rien de l'autre ligne.
		const doc = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
		const selene = arr(obj(doc.monde).personnages)[0]
		const corvin = arr(obj(doc.monde).personnages)[1]
		expect(selene.nom).toBe('Sélène la Vigie')
		expect(corvin.nom).toBe('Corvin le Marchand')
		arr(selene.relations)[0] = 'du texte a la place' as unknown as Doc
		arr(corvin.presence)[0] = 42 as unknown as Doc

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		// SEULES les deux anomalies attendues : rien d'autre, dans les six personnages et
		// le reste du dossier, n'a régressé du fait de ces corruptions. Le message d'échec
		// NOMME le chemin et le OÙ, il ne les compte pas.
		expect(resultat.errors.map((e) => `${e.code} → ${e.path} — ${e.location}`)).toEqual([
			'element-non-objet → monde.personnages[0].relations[0] — Personnage « Sélène la Vigie »',
			'element-non-objet → monde.personnages[1].presence[0] — Personnage « Corvin le Marchand »',
		])
		expect(resultat.warnings).toEqual([])

		// Discriminant : le MÊME document, intact, ne produit RIEN. Sans cette ligne, un
		// dossier de référence devenu invalide pour une tout autre raison satisferait
		// l'assertion ci-dessus par accident.
		const intact = validateDossier(JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')))

		expect(intact.errors).toEqual([])
		expect(intact.warnings).toEqual([])
		expect(intact.ok).toBe(true)
	})

	it('une etape sans libelle est bloquante, une quete SANS etapes reste calme', () => {
		// LA SEULE LIGNE DE `CHAMPS_REQUIS` DE L'ITÉRATION 3 DE LA N° 6, et le contrat
		// qu'elle porte a DEUX moitiés qui ne valent que prouvées ensemble : `libelle` est
		// REQUIS DANS SON ÉLÉMENT tandis que la LISTE reste OPTIONNELLE (même mécanique
		// que `contre_mesures[].action` et `relations[].lien`). Prouver la première seule
		// laisserait passer une liste devenue obligatoire, ce qui invaliderait
		// RÉTROACTIVEMENT tout dossier déjà persisté (KR-160/KR-191).
		const absent = fixture()
		arr(quete(absent).etapes)[1] = {}

		const resultatAbsent = validateDossier(absent)

		expect(resultatAbsent.ok).toBe(false)
		expect(resultatAbsent.errors.map((e) => `${e.code} → ${e.path} — ${e.location}`)).toEqual([
			'champ-requis-vide → monde.quetes[0].etapes[1].libelle — Quête « Retrouver la clef de basalte »',
		])
		expect(resultatAbsent.errors[0].message).toContain('« libelle »')

		// La chaîne VIDE est refusée au même titre que l'absence — `CHAMPS_REQUIS` exige
		// une chaîne NON VIDE, et une étape dont le libellé a été effacé n'a pas plus à
		// faire accomplir qu'une étape qui n'en a jamais porté.
		const vide = fixture()
		arr(quete(vide).etapes)[0].libelle = '   '

		expect(codes(validateDossier(vide).errors)).toEqual(['champ-requis-vide'])

		// LA SECONDE MOITIÉ : la LISTE, elle, est optionnelle — absente comme vide, une
		// quête d'un seul tenant est un état calme, ni erreur ni avertissement.
		for (const valeur of [undefined, []]) {
			const doc = fixture()
			quete(doc).etapes = valeur

			const resultat = validateDossier(doc)

			expect(`etapes = ${JSON.stringify(valeur) ?? 'absent'} → ${resultat.ok}`).toBe(
				`etapes = ${JSON.stringify(valeur) ?? 'absent'} → true`,
			)
			expect(resultat.warnings).toEqual([])
		}
	})

	it('deux Delta identiques dans recompense[] sont acceptes', () => {
		// LES DOUBLONS SONT LÉGAUX, et ce n'est pas une tolérance subie : « donne deux
		// fois la clef » est une récompense qu'un auteur peut vouloir écrire, et rien au
		// schéma 1 ne définit ce qu'une déduplication devrait choisir. Le champ est une
		// LISTE, pas un ensemble — c'est le moteur de la n° 9 qui appliquera les effets,
		// dans l'ordre, autant de fois qu'ils sont écrits.
		//
		// SANS CE TEST, la propriété n'est tenue par rien : l'écran d'it3 rend une ligne
		// par entrée avec l'INDEX pour clé React, et il n'aurait aucun moyen de savoir
		// que le SSOT accepte ce qu'il lui envoie.
		const doc = fixture()
		const effet = { delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }
		quete(doc).recompense = [effet, { ...effet, cibles: [...effet.cibles] }]

		const resultat = validateDossier(doc)

		expect(resultat.errors.map((e) => `${e.code} → ${e.path}`)).toEqual([])
		expect(resultat.warnings).toEqual([])
		expect(resultat.ok).toBe(true)
		// Les DEUX entrées survivent au gel et à la copie — un dédoublonnage silencieux
		// en aurait fait disparaître une sans qu'aucune anomalie ne le dise.
		expect(resultat.dossier?.monde.quetes[0].recompense).toHaveLength(2)

		// SONDE DE DISCRIMINANCE (KR-199) — sans elle, l'assertion ci-dessus resterait
		// verte le jour où ce chemin cesserait de refuser POUR TOUT LE MONDE, et le test
		// dirait « les doublons sont acceptés » en ne prouvant que « rien n'est jamais
		// refusé ici ». Une TROISIÈME entrée, elle, fautive, doit être refusée — et une
		// seule fois, au bon rang.
		const temoin = fixture()
		quete(temoin).recompense = [
			effet,
			{ ...effet, cibles: [...effet.cibles] },
			{ delta: 'donner_objet', cibles: ['objet.nulle-part'] },
		]

		const resultatTemoin = validateDossier(temoin)

		expect(resultatTemoin.errors.map((e) => `${e.code} → ${e.path}`)).toEqual([
			'reference-pendante → monde.quetes[0].recompense[2]',
		])
		expect(resultatTemoin.ok).toBe(false)
	})

	it('le dossier de reference reste accepte SANS REGRESSION quand le donneur d une quete y est orphelin, et SEULE cette anomalie remonte', () => {
		// CRITÈRE #1 DU PLAN D'IT3, MÊME FORME que ses aînés d'it4/it5 de la n° 4 et
		// d'it1 de la n° 6, et pour la même raison (BUG-072) : les deux moitiés — « les
		// quêtes déjà persistées restent acceptées sans régression de leurs champs hors
		// du lot » et « une référence fautive est refusée » — ne valent que prouvées
		// ENSEMBLE, sur le MÊME document et dans le MÊME résultat.
		//
		// LE DOCUMENT EST CELUI D'UNE AVENTURE RÉELLE : sa quête porte un donneur, une
		// consigne, trois étapes, une échéance et DEUX effets de récompense, au milieu de
		// six personnages qui référencent quatre indices.
		const doc = JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Doc
		const premiere = arr(obj(doc.monde).quetes)[0]
		expect(premiere.nom).toBe('Retrouver la Vigie')
		expect(premiere.etapes).toHaveLength(3)
		premiere.donneur_id = 'pnj.nulle-part'

		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(false)
		expect(resultat.errors.map((e) => `${e.code} → ${e.path} — ${e.location}`)).toEqual([
			'reference-pendante → monde.quetes[0].donneur_id — Quête « Retrouver la Vigie »',
		])
		expect(resultat.warnings).toEqual([])

		// Discriminant : le MÊME document, intact, ne produit RIEN. Sans cette ligne, un
		// dossier de référence devenu invalide pour une tout autre raison satisferait
		// l'assertion ci-dessus par accident.
		const intact = validateDossier(JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')))

		expect(intact.errors).toEqual([])
		expect(intact.warnings).toEqual([])
		expect(intact.ok).toBe(true)
	})

	it('un element non-objet d une collection identifiee reste champ-requis-vide', () => {
		// C'est la RAISON de la dérivation : les collections identifiées sont DÉJÀ
		// gardées — un élément non-objet y donne `id: null` dans `collectIds`, donc
		// `champ-requis-vide`, bloquant depuis l'itération 1. Les inclure produirait
		// deux anomalies pour une seule cause, et c'est pourquoi une cinquième table
		// aurait été le seul endroit du module où l'oubli passerait inaperçu.
		const doc = fixture()
		arr(obj(doc.monde).lieux).push('un lieu en prose' as unknown as Doc)

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.lieux[1].id')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('champ-requis-vide')
		expect(codes(resultat.errors)).not.toContain('element-non-objet')
	})

	it('une porte inconnue dans revele_si est bloquante', () => {
		const doc = fixture()
		revele(doc).toujours = true

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'porte-inconnue')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('monde.personnages[0].savoirs[0].revele_si.toujours')
		expect(anomalie?.location).toBe('Personnage « Aldûr le Sage »')
		expect(anomalie?.message).toContain('« toujours »')
		// Discriminant : les QUATRE portes de la fixture, elles, sont reconnues.
		expect(codes(validateDossier(fixture()).errors)).not.toContain('porte-inconnue')
	})

	it('une revelation sans aucune porte avertit sans bloquer', () => {
		const doc = fixture()
		savoir(doc).revele_si = {}

		const resultat = validateDossier(doc)

		expect(codes(resultat.warnings)).toEqual(['revelation-sans-porte'])
		expect(resultat.warnings[0].path).toBe('monde.personnages[0].savoirs[0].revele_si')
		expect(resultat.warnings[0].severity).toBe('warning')
		expect(resultat.warnings[0].message).toContain('indice.sceau-brise')
		// Un avertissement ne bloque rien : `errors` reste vide et `ok` reste vrai.
		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true)
		expect(resultat.dossier).not.toBeNull()
	})

	it('un revele_si entierement absent avertit de la meme facon', () => {
		const doc = fixture()
		delete savoir(doc).revele_si

		const resultat = validateDossier(doc)

		expect(codes(resultat.warnings)).toEqual(['revelation-sans-porte'])
		expect(resultat.ok).toBe(true)
	})

	it('une seule porte posee reste calme', () => {
		for (const porte of ['confiance_min', 'jet', 'contrepartie', 'apres_indice_id']) {
			const doc = fixture()
			const portes = revele(doc)
			for (const autre of Object.keys(portes)) {
				if (autre !== porte) delete portes[autre]
			}

			const resultat = validateDossier(doc)

			expect(codes(resultat.warnings)).toEqual([])
			expect(resultat.errors).toEqual([])
		}
	})

	it('un savoir sans indice_id se designe par son rang, jamais par un undefined', () => {
		const doc = fixture()
		delete savoir(doc).indice_id
		savoir(doc).revele_si = {}

		const avertissement = validateDossier(doc).warnings.find((w) => w.code === 'revelation-sans-porte')

		expect(avertissement?.message).toContain('« n°1 »')
		for (const fuite of FUITES_TECHNIQUES) {
			expect(avertissement?.message.toLowerCase()).not.toContain(fuite)
		}
	})

	it('enonce_texte absent est bloquant, a 20 mots calme, a 21 mots un avertissement', () => {
		const sansEnonce = fixture()
		delete jalon(sansEnonce).enonce_texte
		const absent = validateDossier(sansEnonce)

		expect(absent.ok).toBe(false)
		const bloquante = absent.errors.find((e) => e.path === 'charpente.jalons[0].enonce_texte')
		expect(bloquante?.code).toBe('champ-requis-vide')
		expect(bloquante?.location).toBe('Jalon « La première nuit à Val-Cendre »')

		const aLaBorne = fixture()
		jalon(aLaBorne).enonce_texte = Array(BUDGET_MOTS_JALON).fill('mot').join(' ')
		const borne = validateDossier(aLaBorne)

		expect(borne.warnings).toEqual([]) // à la borne EXACTE, rien
		expect(borne.ok).toBe(true)

		const auDela = fixture()
		jalon(auDela).enonce_texte = Array(BUDGET_MOTS_JALON + 1)
			.fill('mot')
			.join(' ')
		const depasse = validateDossier(auDela)

		expect(codes(depasse.warnings)).toEqual(['texte-trop-long'])
		expect(depasse.warnings[0].path).toBe('charpente.jalons[0].enonce_texte')
		expect(depasse.warnings[0].message).toContain(String(BUDGET_MOTS_JALON + 1))
		// Le NOM de la constante ne fuit jamais dans le texte.
		expect(depasse.warnings[0].message).not.toContain('BUDGET')
		expect(depasse.errors).toEqual([])
		expect(depasse.ok).toBe(true)
	})

	it('confiance_min aux bornes et hors bornes', () => {
		for (const valeur of [CONFIANCE_MIN, CONFIANCE_MAX, 0]) {
			const doc = fixture()
			revele(doc).confiance_min = valeur

			expect(validateDossier(doc).errors).toEqual([])
		}

		for (const valeur of [CONFIANCE_MIN - 1, CONFIANCE_MAX + 1, 1.5, 'beaucoup']) {
			const doc = fixture()
			revele(doc).confiance_min = valeur

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.code === 'valeur-hors-enumeration')

			expect(resultat.ok).toBe(false)
			expect(anomalie?.path).toBe('monde.personnages[0].savoirs[0].revele_si.confiance_min')
			expect(anomalie?.message).toContain(String(CONFIANCE_MIN))
			expect(anomalie?.message).toContain(String(CONFIANCE_MAX))
		}
	})

	it('canon a 600 mots ne declenche rien', () => {
		const doc = fixture()
		obj(obj(doc.canon).mj).synopsis_mj = Array(BUDGET_MOTS_CANON).fill('mot').join(' ')

		const resultat = validateDossier(doc)

		expect(resultat.warnings).toEqual([]) // à la borne EXACTE, rien
		expect(resultat.ok).toBe(true)
	})

	it('canon a 601 mots produit un avertissement non bloquant', () => {
		const doc = fixture()
		obj(obj(doc.canon).mj).synopsis_mj = Array(BUDGET_MOTS_CANON + 1)
			.fill('mot')
			.join(' ')

		const resultat = validateDossier(doc)

		expect(codes(resultat.warnings)).toEqual(['texte-trop-long'])
		expect(resultat.warnings[0].path).toBe('canon.mj')
		expect(resultat.warnings[0].severity).toBe('warning')
		expect(resultat.warnings[0].message).toContain(String(BUDGET_MOTS_CANON + 1))
		// Un avertissement ne bloque rien : `errors` reste vide et `ok` reste vrai.
		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true)
		expect(resultat.dossier).not.toBeNull()
	})

	it('le bloc partage porte le meme budget que le bloc mj', () => {
		const doc = fixture()
		obj(obj(doc.canon).partage).accroche_joueur = Array(BUDGET_MOTS_CANON + 1)
			.fill('mot')
			.join(' ')

		const resultat = validateDossier(doc)

		expect(resultat.warnings.map((w) => w.path)).toEqual(['canon.partage'])
	})
})

describe('freeze', () => {
	it('le dossier rendu est gele a tous les niveaux', () => {
		const resultat = validateDossier(fixture())
		const dossier = resultat.dossier

		expect(dossier).not.toBeNull()
		if (dossier === null) return

		expect(Object.isFrozen(dossier)).toBe(true)
		expect(Object.isFrozen(dossier.canon)).toBe(true)
		expect(Object.isFrozen(dossier.canon.mj)).toBe(true)
		expect(Object.isFrozen(dossier.monde)).toBe(true)
		expect(Object.isFrozen(dossier.monde.lieux)).toBe(true) // le TABLEAU
		expect(Object.isFrozen(dossier.monde.lieux[0])).toBe(true) // et son entrée
		expect(Object.isFrozen(dossier.canon.interdits_ton)).toBe(true)
		expect(Object.isFrozen(dossier.charpente.depart)).toBe(true)
		// Les formes profondes de l'itération 2 sont gelées AUSSI BAS que les autres.
		expect(Object.isFrozen(dossier.monde.personnages[0].savoirs[0].revele_si)).toBe(true)
		expect(Object.isFrozen(dossier.monde.personnages[0].savoirs[0].revele_si?.jet)).toBe(true)
		expect(Object.isFrozen(dossier.charpente.jalons[0].effet[0])).toBe(true)
	})

	it('un document refuse ne rend aucun dossier a geler', () => {
		const doc = fixture()
		doc.schema = 2
		expect(validateDossier(doc).dossier).toBeNull()
	})

	/**
	 * La contrepartie du gel : ce qui est gelé est une COPIE. Sans ce test, rien ne
	 * distingue « geler la sortie » de « geler l'argument de l'appelant », et la
	 * seconde lecture rend `validateDossier` impure au pire endroit — un appelant
	 * qui valide un brouillon pour l'afficher le rendrait immuable, et sa mutation
	 * suivante JETTERAIT (module ESM = mode strict).
	 */
	it('gele une copie et rend l argument INTACT', () => {
		const doc = fixture()
		const resultat = validateDossier(doc)

		expect(resultat.ok).toBe(true)
		expect(Object.isFrozen(doc)).toBe(false)
		expect(Object.isFrozen(obj(doc.canon))).toBe(false)
		expect(Object.isFrozen(arr(obj(doc.monde).lieux))).toBe(false)
		// Et l'argument reste réellement mutable, pas seulement non marqué.
		doc.titre = 'Encore modifiable'
		expect(doc.titre).toBe('Encore modifiable')
		// La copie gelée, elle, n'a pas suivi : ce sont deux documents distincts.
		expect(resultat.dossier?.titre).not.toBe('Encore modifiable')
	})
})

/**
 * L'identifiant de dossier est le SEUL champ du fichier qui devient une clé de
 * stockage (`dossierKey`). Sa forme n'est donc pas une coquetterie : `:` est le
 * séparateur réservé du découpage de clés à venir (n° 3 / n° 4).
 */
describe('validateDossier, identifiant de dossier', () => {
	const MAL_FORMES: ReadonlyArray<readonly [string, string]> = [
		['deux-points', 'mon-dossier:content'],
		['espace interne', 'mon dossier'],
		['espace de bord', ' mon-dossier'],
		['majuscule', 'Mon-Dossier'],
		['tiret en tete', '-mon-dossier'],
		['barre oblique', 'mon/dossier'],
		['point', 'mon.dossier'],
	]

	for (const [cas, id] of MAL_FORMES) {
		it(`refuse un id de dossier avec ${cas}`, () => {
			const doc = fixture()
			doc.id = id
			const { ok, errors } = validateDossier(doc)

			expect(ok).toBe(false)
			const anomalie = errors.find((e) => e.path === 'id')
			expect(anomalie?.code).toBe('identifiant-invalide')
			expect(anomalie?.entityId).toBe(id)
			expect(anomalie?.location).toBe('Dossier')
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		})
	}

	it('accepte les formes legitimes', () => {
		for (const id of ['dossier-minimal', 'a', 'a1', '1er-dossier', 'un-tres-long-nom-avec-tirets']) {
			const doc = fixture()
			doc.id = id
			expect(validateDossier(doc).errors.filter((e) => e.path === 'id')).toEqual([])
		}
	})

	it('un id vide reste champ-requis-vide, pas identifiant-invalide', () => {
		const doc = fixture()
		doc.id = '   '
		const codesId = codes(validateDossier(doc).errors.filter((e) => e.path === 'id'))
		// Une seule cause, une seule anomalie : la forme ne se plaint pas en plus du vide.
		expect(codesId).toEqual(['champ-requis-vide'])
	})
})

/**
 * La ligne QUOI FAIRE, isolée de son rendu. Elle est exportée du baril `brain/`
 * et `dossier-controles` (n° 7) la consommera telle quelle : sans assertion, la
 * substitution du marqueur pourrait ne pas se faire — ou porter `location` au
 * lieu de `path` — et tout resterait vert.
 */
describe('dossierIssueRemediation', () => {
	function anomalieDe(code: DossierIssueCode, path: string): DossierIssue {
		return { code, severity: 'error', message: 'peu importe', location: 'Monde', path }
	}

	it('resout le marqueur {racine} par le chemin, pas par le libelle', () => {
		const rendu = dossierIssueRemediation(anomalieDe('racine-manquante', 'monde.lieux'))

		expect(rendu).toContain('monde.lieux')
		expect(rendu).not.toContain('{racine}')
		expect(rendu).not.toContain('Monde') // `location` n'a rien à faire ici
	})

	it('resout le marqueur {champ} par la FEUILLE du chemin, indice de tableau retire', () => {
		const rendu = dossierIssueRemediation(anomalieDe('reference-pendante', 'monde.evenements[3].monstre_ref'))

		expect(rendu).toContain('« monstre_ref »')
		expect(rendu).not.toContain('{champ}')
		expect(rendu).not.toContain('monde.evenements') // jamais le chemin entier
	})

	it('laisse intact un libelle sans marqueur', () => {
		expect(dossierIssueRemediation(anomalieDe('champ-requis-vide', 'canon.ton'))).toBe(
			DOSSIER_ISSUE_LABELS['champ-requis-vide'],
		)
	})
})

describe('issues', () => {
	function anomalieDe(code: DossierIssueCode, path: string): DossierIssue {
		return { code, severity: 'error', message: 'peu importe', location: 'Monde', path }
	}

	it('les vingt codes sont prefixes et sans marqueur residuel', () => {
		const tous = Object.keys(DOSSIER_ISSUE_LABELS) as DossierIssueCode[]

		expect(tous).toHaveLength(20)
		for (const code of tous) {
			const rendu = dossierIssueRemediation(anomalieDe(code, 'monde.personnages'))

			expect(rendu.trim()).not.toBe('')
			expect(rendu).toMatch(/^↪ /) // l'anatomie du § 3.3 : la consigne se préfixe
			// Généralisé : `{racine}` n'est plus le seul marqueur du registre.
			expect(rendu).not.toMatch(/\{[a-z_]+\}/)
			for (const fuite of FUITES_TECHNIQUES) {
				expect(rendu.toLowerCase()).not.toContain(fuite)
			}
		}
	})

	it('les textes des quatre codes neufs sont asserts VERBATIM', () => {
		// Aucun écran ne les rend avant la n° 2 : c'est ici, et nulle part ailleurs,
		// que la rédaction arbitrée est tenue. Jamais « non vide » — l'égalité exacte.
		const horsEnumeration = fixture()
		personnage(horsEnumeration).portee = 'troisieme'
		const enProse = fixture()
		jalon(enProse).effet = 'le bourg se réveille'
		const porteInconnue = fixture()
		revele(porteInconnue).toujours = true
		const sansPorte = fixture()
		savoir(sansPorte).revele_si = {}

		const trouver = (doc: Doc, code: DossierIssueCode): DossierIssue | undefined => {
			const resultat = validateDossier(doc)
			return [...resultat.errors, ...resultat.warnings].find((issue) => issue.code === code)
		}

		expect(trouver(horsEnumeration, 'valeur-hors-enumeration')?.message).toBe(
			"Le champ « portee » vaut « troisieme », qui n'est pas une valeur reconnue (attendu : premier ou second).",
		)
		expect(DOSSIER_ISSUE_LABELS['valeur-hors-enumeration']).toBe(
			"↪ Remplacez cette valeur par l'une de celles attendues, puis réimportez-le.",
		)

		expect(trouver(enProse, 'delta-en-prose')?.message).toBe(
			"Le champ « effet » attend une liste d'effets structurés ; il contient du texte libre.",
		)
		expect(DOSSIER_ISSUE_LABELS['delta-en-prose']).toBe(
			"↪ Remplacez ce texte par une liste d'effets, puis réimportez-le.",
		)

		expect(trouver(porteInconnue, 'porte-inconnue')?.message).toBe(
			"Le savoir « indice.sceau-brise » porte une condition de révélation « toujours » qui n'existe pas dans le format (attendu : confiance minimale, jet, contrepartie, ou indice préalable).",
		)
		expect(DOSSIER_ISSUE_LABELS['porte-inconnue']).toBe(
			"↪ Supprimez cette clé ou remplacez-la par l'une des quatre portes reconnues, puis réimportez-le.",
		)

		expect(trouver(sansPorte, 'revelation-sans-porte')?.message).toBe(
			"Le savoir « indice.sceau-brise » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement.",
		)
		expect(DOSSIER_ISSUE_LABELS['revelation-sans-porte']).toBe(
			'↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même.',
		)
	})

	it('les trois codes neufs sont tous observables, et leur QUOI FAIRE est prefixe', () => {
		const deltaInconnu = fixture()
		jalon(deltaInconnu).effet = [{ delta: 'gagner_xp', cibles: [] }]
		const deltaMalforme = fixture()
		jalon(deltaMalforme).effet = ['le bourg se réveille']
		const elementNonObjet = fixture()
		personnage(elementNonObjet).savoirs = ['du texte']

		const observes = new Set<DossierIssueCode>()
		for (const doc of [deltaInconnu, deltaMalforme, elementNonObjet]) {
			const resultat = validateDossier(doc)
			expect(resultat.ok).toBe(false)
			for (const anomalie of [...resultat.errors, ...resultat.warnings]) {
				observes.add(anomalie.code)
				expect(DOSSIER_ISSUE_LABELS[anomalie.code]).toBeDefined()
				expect(dossierIssueRemediation(anomalie)).toMatch(/^↪ /)
				expect(dossierIssueRemediation(anomalie)).not.toMatch(/\{[a-z_]+\}/)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(anomalie.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}

		expect([...observes].sort()).toEqual(['delta-inconnu', 'delta-malforme', 'element-non-objet'])
	})

	it('les cinq QUOI des effets et des elements sont asserts VERBATIM', () => {
		// Même doctrine que pour les codes d'it2 et d'it3 : aucun écran ne rend ces
		// phrases avant la n° 2, donc c'est ICI, et nulle part ailleurs, que la
		// rédaction arbitrée est tenue. Jamais « non vide » — l'égalité exacte.
		const trouver = (doc: Doc, code: DossierIssueCode): DossierIssue | undefined =>
			validateDossier(doc).errors.find((issue) => issue.code === code)

		const inconnu = fixture()
		jalon(inconnu).effet = [{ delta: 'gagner_xp', cibles: [] }]
		expect(trouver(inconnu, 'delta-inconnu')?.message).toBe(
			"Le champ « effet » utilise l'effet « gagner_xp », qui n'existe pas dans le registre des effets.",
		)

		const malforme = fixture()
		jalon(malforme).effet = ['le bourg se réveille']
		expect(trouver(malforme, 'delta-malforme')?.message).toBe(
			'Le champ « effet » attend un effet structuré reconnu (une clé « delta », puis ses cibles) ; il contient « le bourg se réveille ».',
		)

		const nonObjet = fixture()
		personnage(nonObjet).savoirs = ['du texte']
		expect(trouver(nonObjet, 'element-non-objet')?.message).toBe(
			"Le champ « savoirs » attend une liste d'objets ; l'un de ses éléments n'en est pas un (« du texte »).",
		)

		const pendante = fixture()
		jalon(pendante).effet = [{ delta: 'donner_objet', cibles: ['objet.nulle-part'] }]
		expect(trouver(pendante, 'reference-pendante')?.message).toBe(
			"L'effet « donne l'objet » de « effet » pointe « objet.nulle-part », qui n'existe pas dans ce dossier.",
		)

		const mauvaisEspace = fixture()
		jalon(mauvaisEspace).effet = [{ delta: 'donner_objet', cibles: ['lieu.val-cendre'] }]
		expect(trouver(mauvaisEspace, 'identifiant-invalide')?.message).toBe(
			"L'effet « donne l'objet » de « effet » fournit « lieu.val-cendre », qui n'est pas un identifiant valide.",
		)
	})

	it('les QUOI FAIRE des trois codes neufs sont asserts VERBATIM', () => {
		// Aucun écran ne les rend avant la n° 2 : c'est ici, et nulle part ailleurs, que
		// la rédaction arbitrée est tenue. Trois GESTES distincts — remplacer l'effet,
		// corriger la forme, remplacer l'élément.
		expect(DOSSIER_ISSUE_LABELS['delta-inconnu']).toBe(
			'↪ Remplacez l’effet de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
		)
		expect(DOSSIER_ISSUE_LABELS['delta-malforme']).toBe(
			'↪ Corrigez la forme de « {champ} » dans le fichier (clé « delta » et ses cibles), puis réimportez-le.',
		)
		expect(DOSSIER_ISSUE_LABELS['element-non-objet']).toBe(
			'↪ Remplacez cet élément de « {champ} » par un objet, puis réimportez-le.',
		)
	})
})

/**
 * L'INTÉGRITÉ RÉFÉRENTIELLE DES CONDITIONS — le but de l'itération, énoncé en une
 * phrase : l'auteur peut voir refusée une condition qui référence une entité
 * inexistante.
 *
 * Un test PAR FAMILLE, dérivé de `FAMILLES_DE_CONDITIONS` et échouant par NOM de
 * famille absente : un compte se contenterait d'un NOMBRE de familles — qui se
 * périme à chaque itération, et ne dit pas laquelle manque —, et une famille
 * ajoutée à la table sans son poseur passerait sans bruit.
 */
describe('validateDossier, les conditions', () => {
	const fin = (doc: Doc): Doc => arr(obj(doc.charpente).fins)[0]

	/** Un prédicat dont la cible est BIEN FORMÉE mais que rien ne porte. */
	const PENDANTE = { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.nulle-part'] }

	/** Où poser un `…_expr` et où lire son jumeau, par famille. */
	interface PoseurDeFamille {
		poser: (doc: Doc, expr: unknown) => void
		retirer: (doc: Doc) => void
		/** Le chemin CONCRET du champ porteur, tel que le rapport doit le nommer. */
		chemin: string
		/** Le OÙ attendu : l'entité PORTEUSE, jamais le nœud ni l'étape. */
		location: string
	}

	const POSEURS: Record<string, PoseurDeFamille> = {
		'canon.objectifs[].reussi_si_expr': {
			poser: (doc, expr) => {
				objectif(doc).reussi_si_expr = expr
			},
			retirer: (doc) => delete objectif(doc).reussi_si_expr,
			chemin: 'canon.objectifs[0].reussi_si_expr',
			location: 'Objectif « Refermer le sceau du Gouffre »',
		},
		'canon.objectifs[].echoue_si_expr': {
			poser: (doc, expr) => {
				objectif(doc).echoue_si_expr = expr
			},
			retirer: (doc) => delete objectif(doc).echoue_si_expr,
			chemin: 'canon.objectifs[0].echoue_si_expr',
			location: 'Objectif « Refermer le sceau du Gouffre »',
		},
		'charpente.fins[].condition_expr': {
			poser: (doc, expr) => {
				fin(doc).condition_expr = expr
			},
			retirer: (doc) => delete fin(doc).condition_expr,
			chemin: 'charpente.fins[0].condition_expr',
			location: 'Fin « Le sceau refermé »',
		},
		'charpente.jalons[].declencheur_expr': {
			poser: (doc, expr) => {
				jalon(doc).declencheur_expr = expr
			},
			retirer: (doc) => delete jalon(doc).declencheur_expr,
			chemin: 'charpente.jalons[0].declencheur_expr',
			location: 'Jalon « La première nuit à Val-Cendre »',
		},
		'monde.evenements[].declencheur_expr': {
			poser: (doc, expr) => {
				evenement(doc).declencheur_expr = expr
			},
			retirer: (doc) => delete evenement(doc).declencheur_expr,
			chemin: 'monde.evenements[0].declencheur_expr',
			location: "Événement « L'embuscade du Fanal »",
		},
		'monde.personnages[].plan_actions[].declencheur_expr': {
			poser: (doc, expr) => {
				etape(doc).declencheur_expr = expr
			},
			retirer: (doc) => delete etape(doc).declencheur_expr,
			chemin: 'monde.personnages[0].plan_actions[0].declencheur_expr',
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].contre_mesures[].declencheur_expr': {
			poser: (doc, expr) => {
				contreMesure(doc).declencheur_expr = expr
			},
			retirer: (doc) => delete contreMesure(doc).declencheur_expr,
			chemin: 'monde.personnages[0].contre_mesures[0].declencheur_expr',
			// Le MÊME OÙ que l'étape ci-dessus : une contre-mesure n'a ni nom ni
			// identifiant, le rapport remonte au personnage porteur.
			location: 'Personnage « Aldûr le Sage »',
		},
	}

	it('les familles de conditions ont toutes leur poseur, aucune de plus', () => {
		// C'est CE test qui fait échouer les suivants par NOM : une famille ajoutée à
		// la table sans son cas d'épreuve se nomme ici, elle ne disparaît pas.
		expect(Object.keys(POSEURS).sort()).toEqual(FAMILLES_DE_CONDITIONS.map((famille) => famille.expr).sort())
	})

	for (const famille of FAMILLES_DE_CONDITIONS) {
		const poseur = POSEURS[famille.expr]

		it(`famille ${famille.expr} : une reference absente est bloquante et nomme le champ porteur`, () => {
			const doc = fixture()
			poseur.poser(doc, PENDANTE)

			const resultat = validateDossier(doc)
			const pendante = resultat.errors.find((e) => e.code === 'reference-pendante')

			expect(resultat.ok).toBe(false)
			expect(pendante?.path).toBe(poseur.chemin)
			expect(pendante?.entityId).toBe('jalon.nulle-part')
			expect(pendante?.location).toBe(poseur.location)
			// Le message nomme le prédicat par son LIBELLÉ, le champ porteur et l'id.
			expect(pendante?.message).toContain('le jalon est atteint')
			expect(pendante?.message).toContain(`« ${famille.expr.split('.').pop() as string} »`)
			expect(pendante?.message).toContain('jalon.nulle-part')
			for (const fuite of FUITES_TECHNIQUES) {
				expect(pendante?.message.toLowerCase()).not.toContain(fuite)
			}
		})

		it(`famille ${famille.expr} : une reference PRESENTE reste calme`, () => {
			// Discriminant : c'est bien la RÉSOLUTION qui parle, pas la simple présence
			// d'un prédicat dans le champ.
			const doc = fixture()
			poseur.poser(doc, { op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-nuit'] })

			expect(codes(validateDossier(doc).errors)).not.toContain('reference-pendante')
		})

		it(`famille ${famille.expr} : une expression MAL FORMEE sort avant toute resolution`, () => {
			// Deux anomalies pour une seule cause seraient du bruit : `collectRefs` n'est
			// appelée que si `validateExpr` s'est tue.
			const doc = fixture()
			poseur.poser(doc, { op: 'xor', enfants: [PENDANTE, PENDANTE] })

			const resultat = validateDossier(doc)

			expect(codes(resultat.errors)).toContain('expr-malformee')
			expect(codes(resultat.errors)).not.toContain('reference-pendante')
			expect(resultat.errors.find((e) => e.code === 'expr-malformee')?.path).toBe(poseur.chemin)
		})
	}

	it('la location d une anomalie de plan_actions nomme le PERSONNAGE, jamais l etape', () => {
		// Une étape n'a ni nom ni identifiant : le OÙ remonte au porteur nommé, comme
		// pour `savoirs[]`. Sans cela, le rapport dirait « n°1 » sans dire de qui.
		const doc = fixture()
		etape(doc).declencheur_expr = PENDANTE

		const pendante = validateDossier(doc).errors.find((e) => e.code === 'reference-pendante')

		expect(pendante?.location).toBe('Personnage « Aldûr le Sage »')
		expect(pendante?.location).not.toContain('étape')
		expect(pendante?.location).not.toContain('n°')
	})

	it('un predicat inconnu dans un dossier est bloquant et nomme le champ porteur', () => {
		const doc = fixture()
		fin(doc).condition_expr = { op: 'predicat', predicat: 'quete_achevee', cibles: ['quete.retrouver-la-clef'] }

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.code === 'predicat-inconnu')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.path).toBe('charpente.fins[0].condition_expr')
		expect(anomalie?.location).toBe('Fin « Le sceau refermé »')
		expect(anomalie?.message).toContain('« quete_achevee »')
	})

	it('une cible de mauvais espace est identifiant-invalide, distinct de reference-pendante', () => {
		// L'ENTITÉ EXISTE, mais pas dans l'espace attendu : c'est un défaut de FORME,
		// que `validateExpr` tranche, et il ne se confond pas avec une référence que
		// rien ne porte.
		const doc = fixture()
		fin(doc).condition_expr = { op: 'predicat', predicat: 'possede_objet', cibles: ['lieu.val-cendre'] }

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'charpente.fins[0].condition_expr')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('identifiant-invalide')
		expect(anomalie?.message).toContain('« Objet »')
		expect(codes(resultat.errors)).not.toContain('reference-pendante')
	})

	it('un …_texte sans …_expr avertit sans bloquer, pilote par alerteSansExpr', () => {
		// La règle est LUE dans la table, jamais recopiée : les familles qui alertent
		// et celles qui restent calmes viennent du même endroit que le validateur.
		for (const famille of FAMILLES_DE_CONDITIONS) {
			const doc = fixture()
			POSEURS[famille.expr].retirer(doc)

			const resultat = validateDossier(doc)
			const alertes = resultat.warnings.filter((w) => w.code === 'condition-sans-expr')

			expect(resultat.errors).toEqual([])
			expect(resultat.ok).toBe(true) // un avertissement ne bloque JAMAIS
			expect(alertes).toHaveLength(famille.alerteSansExpr ? 1 : 0)
			if (!famille.alerteSansExpr) continue

			const feuilleTexte = famille.texte.split('.').pop() as string
			expect(alertes[0].severity).toBe('warning')
			expect(alertes[0].message).toContain(`« ${feuilleTexte} »`)
			expect(alertes[0].path.endsWith(feuilleTexte)).toBe(true)
			expect(dossierIssueRemediation(alertes[0])).toBe(DOSSIER_ISSUE_LABELS['condition-sans-expr'])
		}
	})

	it('jalon, evenement et etape restent calmes sans …_expr, la CONTRE-MESURE avertit', () => {
		// Les TROIS familles à `alerteSansExpr: false` d'un seul coup : leur prose sans
		// jumeau structuré est un déclenchement laissé au narrateur, pas un oubli.
		const doc = fixture()
		delete jalon(doc).declencheur_expr
		delete evenement(doc).declencheur_expr
		delete etape(doc).declencheur_expr

		const resultat = validateDossier(doc)

		expect(resultat.warnings).toEqual([])
		expect(resultat.errors).toEqual([])
		expect(resultat.ok).toBe(true)

		// LE CONTRASTE, dans le MÊME test et sur le MÊME document — c'est lui qui rend
		// l'assertion ci-dessus discriminante plutôt que complaisante. Sans lui, un
		// `alerteSansExpr` neutralisé pour TOUTES les familles laisserait ce test vert.
		//
		// Les deux moitiés du contraste sont portées par le MÊME personnage, sous deux
		// clés de MÊME NOM (`declencheur_texte`), à deux étages du même bloc d'écran :
		// l'ÉTAPE se tait, parce qu'un narrateur peut légitimement faire avancer un
		// plan à la main ; la RIPOSTE ARMÉE avertit, parce que rien ne l'armera jamais.
		delete contreMesure(doc).declencheur_expr

		const contraste = validateDossier(doc)
		const alertes = contraste.warnings.filter((w) => w.code === 'condition-sans-expr')

		expect(alertes.map((a) => a.path)).toEqual(['monde.personnages[0].contre_mesures[0].declencheur_texte'])
		expect(alertes[0].location).toBe('Personnage « Aldûr le Sage »')
		expect(contraste.errors).toEqual([])
		expect(contraste.ok).toBe(true) // un avertissement ne bloque JAMAIS
	})

	it('un …_expr sans son …_texte ne dit rien du tout', () => {
		// C8 rejetée : les `…_texte` sont auteur et ne sont injectés dans AUCUN cas,
		// donc « l'IA n'a pas la phrase » ne distingue rien. Ce qui reste est un trou
		// de documentation, affaire du linter n° 7 — pas du validateur.
		const doc = fixture()
		delete objectif(doc).reussi_si_texte
		delete fin(doc).condition_texte

		const resultat = validateDossier(doc)

		// `condition_texte` reste REQUIS depuis it2 : c'est lui qui parle, pas D1.
		expect(codes(resultat.errors)).toEqual(['champ-requis-vide'])
		expect(resultat.errors[0].path).toBe('charpente.fins[0].condition_texte')
		expect(codes(resultat.warnings)).not.toContain('condition-sans-expr')
	})

	it('un texte VIDE ne declenche pas l alerte : absent et vide ne se confondent pas', () => {
		const doc = fixture()
		delete objectif(doc).reussi_si_expr
		objectif(doc).reussi_si_texte = '   '

		expect(codes(validateDossier(doc).warnings)).not.toContain('condition-sans-expr')
	})

	it('les quatre codes neufs sont tous observables, et leur QUOI FAIRE est prefixe', () => {
		const malFormee = fixture()
		fin(malFormee).condition_expr = { op: 'xor' }
		const predicatInconnu = fixture()
		fin(predicatInconnu).condition_expr = { op: 'predicat', predicat: 'jet_reussi', cibles: [] }
		const ariteInvalide = fixture()
		fin(ariteInvalide).condition_expr = { op: 'et', enfants: [] }
		const sansExpr = fixture()
		delete objectif(sansExpr).reussi_si_expr

		const observes = new Set<DossierIssueCode>()
		for (const doc of [malFormee, predicatInconnu, ariteInvalide, sansExpr]) {
			const resultat = validateDossier(doc)
			for (const anomalie of [...resultat.errors, ...resultat.warnings]) {
				observes.add(anomalie.code)
				expect(DOSSIER_ISSUE_LABELS[anomalie.code]).toBeDefined()
				expect(dossierIssueRemediation(anomalie)).toMatch(/^↪ /)
				expect(dossierIssueRemediation(anomalie)).not.toMatch(/\{[a-z_]+\}/)
				for (const fuite of FUITES_TECHNIQUES) {
					expect(anomalie.message.toLowerCase()).not.toContain(fuite)
				}
			}
		}

		expect([...observes].sort()).toEqual([
			'arite-invalide',
			'condition-sans-expr',
			'expr-malformee',
			'predicat-inconnu',
		])
	})

	it('les QUOI FAIRE des quatre codes neufs sont asserts VERBATIM', () => {
		// Aucun écran ne les rend avant la n° 2 : c'est ici, et nulle part ailleurs,
		// que la rédaction arbitrée est tenue. Quatre GESTES distincts, pas quatre fois
		// la même ligne — c'est ce qui rend quatre codes moins chers qu'un seul.
		expect(DOSSIER_ISSUE_LABELS['expr-malformee']).toBe(
			'↪ Corrigez la forme de « {champ} » dans le fichier (opérateur, clé ou imbrication), puis réimportez-le.',
		)
		expect(DOSSIER_ISSUE_LABELS['predicat-inconnu']).toBe(
			'↪ Remplacez le prédicat de « {champ} » par l’un de ceux que le moteur reconnaît, puis réimportez-le.',
		)
		expect(DOSSIER_ISSUE_LABELS['arite-invalide']).toBe(
			'↪ Ajustez le nombre de cibles ou de conditions de « {champ} », puis réimportez-le.',
		)
		expect(DOSSIER_ISSUE_LABELS['condition-sans-expr']).toBe(
			'↪ Ajoutez la condition structurée correspondante si le moteur doit la vérifier, ou laissez tel quel si elle reste une intention d’auteur.',
		)
	})
})

/**
 * LES RÉFÉRENCES SIMPLES — un test PAR CHAMP, dérivé de `REFERENCES_SIMPLES` et
 * échouant par NOM de chemin absent. Un compte se contenterait de « quatre
 * références », et une ligne ajoutée à la table sans son cas d'épreuve passerait
 * sans bruit.
 */
describe('validateDossier, les references simples', () => {
	/** Où poser une référence, et le OÙ que le rapport doit nommer. */
	interface PoseurDeReference {
		poser: (doc: Doc, id: string) => void
		/** Le chemin CONCRET du champ porteur. */
		chemin: string
		/** Le OÙ attendu : l'entité PORTEUSE, jamais le savoir, qui n'a pas de nom. */
		location: string
	}

	const POSEURS: Record<string, PoseurDeReference> = {
		'charpente.depart.lieu_id': {
			poser: (doc, id) => {
				obj(obj(doc.charpente).depart).lieu_id = id
			},
			chemin: 'charpente.depart.lieu_id',
			location: 'Point de départ',
		},
		'monde.personnages[].savoirs[].indice_id': {
			poser: (doc, id) => {
				savoir(doc).indice_id = id
			},
			chemin: 'monde.personnages[0].savoirs[0].indice_id',
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id': {
			poser: (doc, id) => {
				obj(revele(doc).contrepartie).objet_id = id
			},
			chemin: 'monde.personnages[0].savoirs[0].revele_si.contrepartie.objet_id',
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].savoirs[].revele_si.apres_indice_id': {
			poser: (doc, id) => {
				revele(doc).apres_indice_id = id
			},
			chemin: 'monde.personnages[0].savoirs[0].revele_si.apres_indice_id',
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].objectif_id': {
			poser: (doc, id) => {
				personnage(doc).objectif_id = id
			},
			chemin: 'monde.personnages[0].objectif_id',
			// Le OÙ est le personnage lui-même : c'est lui qui porte le champ.
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].relations[].cible_id': {
			poser: (doc, id) => {
				relation(doc).cible_id = id
			},
			chemin: 'monde.personnages[0].relations[0].cible_id',
			// Le OÙ est le PORTEUR de la relation, jamais la cible : c'est sur sa fiche
			// que l'auteur doit aller corriger.
			location: 'Personnage « Aldûr le Sage »',
		},
		'monde.personnages[].presence[].lieu_id': {
			poser: (doc, id) => {
				presence(doc).lieu_id = id
			},
			chemin: 'monde.personnages[0].presence[0].lieu_id',
			location: 'Personnage « Aldûr le Sage »',
		},
		// LA HUITIÈME, ET LA PREMIÈRE DONT LA FEUILLE EST UN ÉLÉMENT DE LISTE : le OÙ
		// n'est plus le repli de la table mais l'INDICE porteur, `monde.indices` étant une
		// collection identifiée — `sitesDe` le résout en traversant, sans qu'aucune ligne
		// ait à le dire.
		'monde.indices[].mene_a[]': {
			poser: (doc, id) => {
				arr(obj(doc.monde).indices)[0].mene_a = [id]
			},
			chemin: 'monde.indices[0].mene_a[0]',
			location: 'Indice « Des cendres encore tièdes »',
		},
		// LA NEUVIÈME (itération 3 de la n° 6) — LE DONNEUR D'UNE QUÊTE. Le OÙ n'est ni
		// le personnage désigné ni le repli de la table, mais la QUÊTE PORTEUSE : c'est
		// sur sa fiche que l'auteur doit aller corriger, exactement comme
		// `relations[].cible_id` nomme le porteur de la relation et jamais sa cible.
		'monde.quetes[].donneur_id': {
			poser: (doc, id) => {
				quete(doc).donneur_id = id
			},
			chemin: 'monde.quetes[0].donneur_id',
			location: 'Quête « Retrouver la clef de basalte »',
		},
	}

	it('depart.lieu_id reste signale quand monde.lieux est une racine ABSENTE', () => {
		// CHANGEMENT DE COMPORTEMENT NOMMÉ au plan (C7), et jusqu'ici éprouvé par
		// personne. Le § 5a supprimait la référence pendante quand `monde.lieux`
		// manquait ; la boucle générique de REFERENCES_SIMPLES ne le fait pas. Ce
		// n'est pas une régression : c'est ce que la section des conditions fait déjà
		// depuis l'itération 3, et la migration rend le module COHÉRENT plutôt que
		// partagé entre deux doctrines. La cascade est donc VOULUE, et ce test est ce
		// qui empêche de la « corriger » par mégarde en la prenant pour un doublon.
		const doc = fixture()
		delete (obj(doc.monde) as Record<string, unknown>).lieux

		const resultat = validateDossier(doc)
		const codesEmis = resultat.errors.map((e) => e.code)

		expect(resultat.ok).toBe(false)
		expect(resultat.errors.some((e) => e.code === 'racine-manquante' && e.path === 'monde.lieux')).toBe(true)
		expect(resultat.errors.some((e) => e.code === 'reference-pendante' && e.path === 'charpente.depart.lieu_id')).toBe(
			true,
		)
		// Discriminant : la cascade n'invente pas d'anomalie d'un troisième genre.
		expect(new Set(codesEmis).has('identifiant-invalide')).toBe(false)
	})

	it('les references simples ont toutes leur poseur, aucune de plus', () => {
		expect(Object.keys(POSEURS).sort()).toEqual(REFERENCES_SIMPLES.map((reference) => reference.path).sort())
	})

	for (const reference of REFERENCES_SIMPLES) {
		const poseur = POSEURS[reference.path]

		it(`reference ${reference.path} : une cible absente du dossier est bloquante`, () => {
			const doc = fixture()
			poseur.poser(doc, `${reference.espace}.nulle-part`)

			const resultat = validateDossier(doc)
			const pendante = resultat.errors.find((e) => e.path === poseur.chemin)

			expect(resultat.ok).toBe(false)
			expect(pendante?.code).toBe('reference-pendante')
			expect(pendante?.entityId).toBe(`${reference.espace}.nulle-part`)
			// Le OÙ nomme le PERSONNAGE porteur, jamais le savoir — qui n'a pas de nom.
			expect(pendante?.location).toBe(poseur.location)
			expect(pendante?.message).toContain(`${reference.espace}.nulle-part`)
			expect(dossierIssueRemediation(pendante as DossierIssue)).toContain(`« ${feuilleDe(reference.path)} »`)
			for (const fuite of FUITES_TECHNIQUES) {
				expect(pendante?.message.toLowerCase()).not.toContain(fuite)
			}
		})

		it(`reference ${reference.path} : une cible PRESENTE reste calme`, () => {
			// Discriminant : c'est bien la RÉSOLUTION qui parle, pas la présence du champ.
			const doc = fixture()
			poseur.poser(doc, `${reference.espace}.nulle-part`)
			expect(validateDossier(doc).ok).toBe(false)

			expect(validateDossier(fixture()).errors.filter((e) => e.path === poseur.chemin)).toEqual([])
		})
	}

	it('une reference simple du MAUVAIS ESPACE est identifiant-invalide, jamais silencieuse', () => {
		// C'est ce que le champ `espace` de la table achète, et sans lui la ligne serait
		// morte : `pnj.aldur-le-sage` EXISTE dans le dossier, donc la seule résolution
		// par appartenance l'aurait accepté dans `depart.lieu_id`. L'entité existe —
		// mais pas là. Même frontière que pour une cible de condition (BUG-052).
		const doc = fixture()
		obj(obj(doc.charpente).depart).lieu_id = 'pnj.aldur-le-sage'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'charpente.depart.lieu_id')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('identifiant-invalide')
		expect(anomalie?.message).toContain('« Lieu »')
		// Deux causes distinctes ne partagent pas un code : la forme n'est pas la
		// résolution, et une seule anomalie sort.
		expect(codes(resultat.errors)).not.toContain('reference-pendante')
	})

	it('objectif_id du MAUVAIS ESPACE (pnj.…) est identifiant-invalide, jamais pendante', () => {
		// Le cas est réaliste et pas théorique : le rattachement d'un personnage se
		// choisit à l'écran dans une liste d'objectifs, et un identifiant de PERSONNAGE
		// rangé là RÉSOUDRAIT par simple appartenance — l'entité existe, mais pas là.
		// C'est ce que le champ `espace` de la ligne de table achète, et sans lui la
		// ligne serait à moitié morte (BUG-052).
		const doc = fixture()
		personnage(doc).objectif_id = 'pnj.aldur-le-sage'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.personnages[0].objectif_id')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('identifiant-invalide')
		expect(anomalie?.message).toContain('« Objectif »')
		// Deux causes distinctes ne partagent pas un code : la forme n'est pas la
		// résolution, et une seule anomalie sort.
		expect(codes(resultat.errors)).not.toContain('reference-pendante')
	})

	it('le sujet du rattachement d un personnage est conserve verbatim', () => {
		// La ligne porte un `sujet` — « Le rattachement de ce personnage » — parce que
		// le repli dérivé aurait écrit « Le champ « objectif_id » », qui nomme une clé
		// JSON là où l'auteur lit une phrase. Assertion de VALEUR, pas d'existence
		// (KR-174) : un `sujet` retiré de la table laisserait le repli passer.
		const doc = fixture()
		personnage(doc).objectif_id = 'objectif.nulle-part'

		const pendante = validateDossier(doc).errors.find((e) => e.path === 'monde.personnages[0].objectif_id')

		expect(pendante?.code).toBe('reference-pendante')
		expect(pendante?.message).toBe(
			"Le rattachement de ce personnage pointe « objectif.nulle-part », qui n'existe pas dans ce dossier.",
		)
	})

	it('un objectif reference par un personnage ne peut plus etre retire en silence', () => {
		// LA RÉGRESSION QUE CE CONTRAT INTRODUIT, épinglée au SSOT plutôt que découverte
		// à l'écran : retirer de `canon.objectifs` un objectif encore cité par un
		// `objectif_id` produit une erreur BLOQUANTE. L'écran qui retire l'objectif doit
		// donc RENDRE le refus de `DossierService.update()`, jamais l'avaler (KR-183).
		const doc = fixture()
		obj(doc.canon).objectifs = []

		const resultat = validateDossier(doc)
		const pendante = resultat.errors.find((e) => e.path === 'monde.personnages[0].objectif_id')

		expect(resultat.ok).toBe(false)
		expect(pendante?.code).toBe('reference-pendante')
		expect(pendante?.entityId).toBe('objectif.refermer-le-sceau')
		expect(pendante?.location).toBe('Personnage « Aldûr le Sage »')
	})

	it('le sujet de la phrase du point de depart est conserve verbatim', () => {
		// La table porte un `sujet` justement parce que « Le champ « lieu_id » » aurait
		// remplacé une phrase que l'auteur lit déjà depuis l'itération 1. Les trois
		// autres n'en ont pas et retombent sur le repli dérivé du champ.
		const doc = fixture()
		obj(obj(doc.charpente).depart).lieu_id = 'lieu.nulle-part'

		const pendante = validateDossier(doc).errors.find((e) => e.path === 'charpente.depart.lieu_id')

		expect(pendante?.message).toBe("Le point de départ pointe « lieu.nulle-part », qui n'existe pas dans ce dossier.")

		const surLIndice = fixture()
		savoir(surLIndice).indice_id = 'indice.nulle-part'

		expect(
			validateDossier(surLIndice).errors.find((e) => e.path === 'monde.personnages[0].savoirs[0].indice_id')?.message,
		).toBe("Le champ « indice_id » pointe « indice.nulle-part », qui n'existe pas dans ce dossier.")
	})

	/** L'accès à la LISTE de références du premier indice — nommé une fois. */
	const meneA = (doc: Doc): unknown[] => arr(obj(doc.monde).indices)[0].mene_a as unknown[]

	it('mene_a orphelin isole au bon rang', () => {
		// DISCRIMINANCE (KR-197/199/202), et elle est le cœur du test : `mene_a` est la
		// PREMIÈRE référence du schéma dont la feuille est un ÉLÉMENT de liste, donc la
		// première où l'on peut se tromper de RANG. Les deux moitiés sont dans le MÊME
		// test — une cible qui résout ET une cible qui ne résout pas, dans la même liste
		// — parce qu'un test qui ne poserait que l'orpheline resterait vert sur une
		// boucle qui signalerait TOUS les éléments.
		const doc = fixture()
		meneA(doc).push('indice.nulle-part')

		const resultat = validateDossier(doc)
		const surLaListe = resultat.errors.filter((e) => e.path.startsWith('monde.indices[0].mene_a'))

		expect(resultat.ok).toBe(false)
		// UNE seule anomalie : l'élément valide ne rougit pas avec son voisin.
		expect(surLaListe.map((e) => `${e.code} → ${e.path}`)).toEqual(['reference-pendante → monde.indices[0].mene_a[1]'])
		expect(surLaListe[0].entityId).toBe('indice.nulle-part')
		// Le OÙ est l'INDICE PORTEUR, résolu par son nom : c'est sur sa fiche que
		// l'auteur doit aller corriger, jamais sur l'indice cible qui n'existe pas.
		expect(surLaListe[0].location).toBe('Indice « Des cendres encore tièdes »')
	})

	it('mene_a message nomme le champ pas l indice', () => {
		// Le correctif de `feuilleDe` vu depuis le message que l'auteur LIT : avec
		// l'ancien motif `\[\d+\]$`, le chemin de TABLE `monde.indices[].mene_a[]` rendait
		// « mene_a[] », et la consigne QUOI FAIRE aurait écrit « Corrigez « mene_a[] » ».
		// Assertions de VALEUR EXACTE, jamais `toContain` (KR-174).
		const doc = fixture()
		meneA(doc)[0] = 'indice.nulle-part'

		const pendante = validateDossier(doc).errors.find((e) => e.path === 'monde.indices[0].mene_a[0]')

		expect(pendante?.message).toBe(
			"Le champ « mene_a » pointe « indice.nulle-part », qui n'existe pas dans ce dossier.",
		)
		expect(dossierIssueRemediation(pendante as DossierIssue)).toBe(
			"↪ Corrigez « mene_a » ou rétablissez l'élément correspondant.",
		)
		// Ni le crochet vide du chemin de table, ni le rang du chemin concret ne fuient
		// dans la phrase.
		expect(pendante?.message).not.toContain('[]')
		expect(pendante?.message).not.toContain('[0]')
	})

	it('mene_a chaine vide est une anomalie, jamais une reference calme', () => {
		// CORRIGE en revue de PR (dossier-registres it1) : l'exemption « chaîne vide =
		// calme » a été écrite pour un champ SCALAIRE optionnel (`objectif_id`,
		// `apres_indice_id` — non-régression couverte par le test « vides » ci-dessus)
		// où `''` est ce qu'écrit un « aucun » de sélecteur. Appliquée telle quelle à
		// un ÉLÉMENT DE LISTE (`mene_a[]`), elle aurait laissé passer `mene_a: ['']` :
		// la PRÉSENCE même de l'élément signale une référence, une chaîne vide n'y est
		// pas « pas de référence » mais une entrée corrompue — et `avecOrpheline()`
		// (brain/utils) renvoie la liste d'options INCHANGÉE sur une valeur vide, donc
		// un `<select value="">` y résoudrait au premier indice de la liste, à l'insu
		// de l'auteur. `reference.path.endsWith('[]')` distingue les deux cas.
		const doc = fixture()
		meneA(doc)[0] = ''

		const resultat = validateDossier(doc)
		const surLElement = resultat.errors.find((e) => e.path === 'monde.indices[0].mene_a[0]')

		expect(resultat.ok).toBe(false)
		expect(surLElement?.code).toBe('identifiant-invalide')
	})

	it('mene_a auto-reference resout, jamais orpheline', () => {
		// KR-194, épinglé au SSOT : un indice qui se pointe lui-même est LÉGAL, et la
		// table ne porte aucune garde. C'est la moitié CONTRAT de l'arbitrage du
		// raffinage — l'autre moitié (la self-exclusion de la ligne d'AJOUT) est une
		// règle d'écran, et elle ne doit RIEN changer ici.
		const doc = fixture()
		meneA(doc)[0] = 'indice.cendres-tiedes'

		const resultat = validateDossier(doc)

		expect(resultat.errors.filter((e) => e.path.startsWith('monde.indices[0].mene_a'))).toEqual([])
		expect(resultat.ok).toBe(true)
	})

	it('mene_a du MAUVAIS ESPACE est identifiant-invalide, jamais pendante', () => {
		// Le cas est réaliste : la liste se remplit par un `Select` qui n'offre que des
		// indices, mais un document écrit à la main peut y ranger n'importe quel
		// identifiant — et `objet.clef-de-basalte` EXISTE, donc la seule résolution par
		// appartenance l'aurait accepté. C'est ce que le champ `espace` de la ligne de
		// table achète (BUG-052).
		const doc = fixture()
		meneA(doc)[0] = 'objet.clef-de-basalte'

		const resultat = validateDossier(doc)
		const anomalie = resultat.errors.find((e) => e.path === 'monde.indices[0].mene_a[0]')

		expect(resultat.ok).toBe(false)
		expect(anomalie?.code).toBe('identifiant-invalide')
		expect(anomalie?.message).toContain('« Indice »')
		expect(codes(resultat.errors)).not.toContain('reference-pendante')
	})

	it('objectif_id et apres_indice_id : la chaine VIDE reste calme, la NON-CHAINE devient bloquante', () => {
		// RÉGRESSION du trou n° 1, sur les DEUX champs préexistants qui partageaient sa
		// cause racine. Le § 5 de `validate.ts` rangeait toute valeur non textuelle avec
		// l'ABSENCE (`typeof site.valeur !== 'string' → continue`) : un `objectif_id: 42`
		// sortait `ok: true`, et le dossier gelé promettait une référence là où il y a un
		// nombre. `mene_a[]` n'a fait que rendre le défaut plus fréquent.
		//
		// LE NOM DE CE TEST DIT LE CONTRAIRE DE CELUI DU § 7 DU PLAN D'ITÉRATION
		// (« valeur non-string reste calme »), et c'est délibéré : le § 5 du même plan
		// pose la borne exacte — « puis toute non-chaîne ⇒ anomalie
		// identifiant-invalide. La chaîne vide reste calme » —, et c'est elle qui fait
		// foi. Le libellé du § 7 décrivait l'ancien comportement.
		//
		// LES DEUX MOITIÉS SONT DANS LE MÊME TEST : sans la première, on prouverait
		// qu'on refuse davantage sans prouver qu'on n'a rien cassé du chemin d'édition
		// vivant ; sans la seconde, l'inverse.
		const vides: ReadonlyArray<readonly [(doc: Doc) => void, string]> = [
			[(doc) => (personnage(doc).objectif_id = ''), 'monde.personnages[0].objectif_id'],
			[(doc) => (revele(doc).apres_indice_id = ''), 'monde.personnages[0].savoirs[0].revele_si.apres_indice_id'],
		]

		for (const [poser, chemin] of vides) {
			const doc = fixture()
			poser(doc)

			const resultat = validateDossier(doc)

			expect(`${chemin} vide → ${resultat.errors.filter((e) => e.path === chemin).length} anomalie(s)`).toBe(
				`${chemin} vide → 0 anomalie(s)`,
			)
		}

		const nonChaines: ReadonlyArray<readonly [(doc: Doc) => void, string]> = [
			[(doc) => (personnage(doc).objectif_id = 42), 'monde.personnages[0].objectif_id'],
			[(doc) => (revele(doc).apres_indice_id = 42), 'monde.personnages[0].savoirs[0].revele_si.apres_indice_id'],
		]

		for (const [poser, chemin] of nonChaines) {
			const doc = fixture()
			poser(doc)

			const resultat = validateDossier(doc)
			const anomalie = resultat.errors.find((e) => e.path === chemin)

			expect(`${chemin} → ${anomalie?.code ?? 'aucune anomalie'}`).toBe(`${chemin} → identifiant-invalide`)
			// La valeur fautive est DÉCRITE, jamais interpolée nue : sur un objet, la
			// phrase dirait « [object Object] » (KR-164).
			expect(anomalie?.message).toContain('« 42 »')
			// Et `entityId` reste ABSENT : il ne porte que des identifiants, jamais un
			// nombre coercé en chaîne.
			expect(anomalie).not.toHaveProperty('entityId')
			for (const fuite of FUITES_TECHNIQUES) {
				expect(anomalie?.message.toLowerCase()).not.toContain(fuite)
			}
		}

		// DISCRIMINANT du dernier point : une valeur STRUCTURÉE ne fait pas fuir sa
		// sérialisation dans une phrase française.
		const objetALaPlace = fixture()
		personnage(objetALaPlace).objectif_id = { id: 'objectif.refermer-le-sceau' }

		const surObjet = validateDossier(objetALaPlace).errors.find((e) => e.path === 'monde.personnages[0].objectif_id')

		expect(surObjet?.code).toBe('identifiant-invalide')
		expect(surObjet?.message).toContain('« un objet »')
		expect(surObjet?.message).not.toContain('[object Object]')
	})
})

describe('types', () => {
	it('Delta refuse une chaine et une cle inconnue a la compilation', () => {
		// @ts-expect-error — un delta est un OBJET, jamais de la prose. C'était le point
		// IRRÉVERSIBLE de l'itération 2, et il tient toujours : de la prose ne se parse
		// pas en delta. Si le type s'élargissait, `tsc` signalerait cette directive
		// comme inutile et rougirait.
		const enProse: Delta = 'le heros gagne 3 points de vie'
		// @ts-expect-error — l'itération 4 ferme le VOCABULAIRE : une clé libre n'est
		// plus un effet. C'est la contrepartie typée de l'inversion du test d'it2.
		const cleLibre: Delta = { cle: 'valeur libre' }
		// @ts-expect-error — et `delta` appartient à l'union DÉRIVÉE du registre : un
		// effet écarté ne se glisse pas dans un dossier typé.
		const ecarte: Delta = { delta: 'gagner_xp', cibles: [] }
		const structure: Delta = { delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }

		expect(typeof enProse).toBe('string')
		expect(cleLibre).toBeDefined()
		expect(ecarte).toBeDefined()
		expect(DELTAS[structure.delta].label).toBe("donne l'objet")
	})
})
