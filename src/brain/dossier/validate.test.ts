import fs from 'node:fs'
import path from 'node:path'
import { validateDossier } from './validate'
import {
	BUDGET_MOTS_CANON,
	BUDGET_MOTS_JALON,
	CAMPS,
	CAMPS_PERSONNAGE,
	CONFIANCE_MAX,
	CONFIANCE_MIN,
	DOSSIER_SCHEMA,
} from './types'
import { DOSSIER_ISSUE_LABELS, dossierIssueRemediation, type DossierIssue, type DossierIssueCode } from './issues'
import { ENUMERES_FERMES, FAMILLES_DE_CONDITIONS, LISTES_A_ELEMENTS_STRUCTURES, REFERENCES_SIMPLES } from './tables'
import { DELTAS, type Delta } from './deltas'
import { feuilleDe } from './identifiers'

const CHEMIN_FIXTURE = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

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

/** Les six accès profonds de la fixture, nommés une fois. */
const personnage = (doc: Doc): Doc => arr(obj(doc.monde).personnages)[0]
const savoir = (doc: Doc): Doc => arr(personnage(doc).savoirs)[0]
const revele = (doc: Doc): Doc => obj(savoir(doc).revele_si)
const evenement = (doc: Doc): Doc => arr(obj(doc.monde).evenements)[0]
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
		expect(dossierIssueRemediation(depart)).toBe(
			"↪ Corrigez « lieu_id » ou ajoutez l'élément correspondant, puis réimportez-le.",
		)
		expect(dossierIssueRemediation(monstre)).toBe(
			"↪ Corrigez « monstre_ref » ou ajoutez l'élément correspondant, puis réimportez-le.",
		)
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
	 * est DÉRIVÉE (`LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES`), et le cas
	 * d'épreuve l'est aussi : une liste ajoutée à la dérivation sans son poseur se
	 * NOMME ici, elle ne disparaît pas du diff.
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

	it('les dix-neuf codes sont prefixes et sans marqueur residuel', () => {
		const tous = Object.keys(DOSSIER_ISSUE_LABELS) as DossierIssueCode[]

		expect(tous).toHaveLength(19)
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
 * famille absente : un compte se contenterait de « cinq familles », et une famille
 * ajoutée à la table sans son poseur passerait sans bruit.
 */
describe('validateDossier, les conditions', () => {
	const fin = (doc: Doc): Doc => arr(obj(doc.charpente).fins)[0]
	const etape = (doc: Doc): Doc => arr(personnage(doc).plan_actions)[0]

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

	it('jalon, evenement et etape de plan restent calmes sans …_expr — assertion discriminante', () => {
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
