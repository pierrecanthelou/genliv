import fs from 'node:fs'
import path from 'node:path'
import {
	COMMANDES,
	analyserSaisie,
	destinationsPossibles,
	executerCommande,
	personnagesPresents,
	type Commande,
	type CommandeDescripteur,
	type CommandeId,
	type ResultatCommande,
	type ResultatSaisie,
} from './commandes'
import { finAtteinte } from './evaluate'
import type { ExprNode } from './expr'
import { fixerHeros, ouvrirSession, resoudreRencontre, type EtatSession } from './session'
import { cloreCombat } from './sessionCombat'
import type { Dossier, PlanAction } from './types'
import type { HeroState } from '../../player/types'

/**
 * LES COMMANDES — L'ANALYSE D'UNE SAISIE, ET LA TRANSITION QU'ELLE DÉCLENCHE.
 *
 * LES DOSSIERS SONT LUS DU DISQUE, jamais fabriqués (KR-156), et c'est ce qui
 * donne aux témoins leurs états séparateurs, tous MESURÉS dans les deux fixtures
 * partagées :
 *  · `dossier-reference.json` porte `lieu.foyer-du-guet` avec DEUX accès, donc une
 *    cible en SECONDE position — une implémentation qui prendrait `acces[0]`
 *    rendrait un résultat différent ;
 *  · le même dossier porte une ASYMÉTRIE réelle : `tour-effondree → vigie-du-nord`
 *    existe, `vigie-du-nord → tour-effondree` non. Sans elle, une résolution qui
 *    regarderait les arêtes ENTRANTES serait indistinguable d'une résolution
 *    orientée. ⚠ CE N'EST PLUS LE COUPLE `foyer ↔ tour`, et le déplacement est une
 *    CONSÉQUENCE MESURÉE de l'arête ajoutée à l'itération 3 de la n° 9
 *    (`tour-effondree.acces`), sans laquelle `lieu.vigie-du-nord` serait
 *    inatteignable et le jalon de ce dossier injouable. L'asymétrie n'a pas été
 *    perdue : elle a reculé d'un cran vers le nord ;
 *  · `dossier-minimal.json` porte l'AUTO-RÉFÉRENCE `lieu.val-cendre → lui-même`,
 *    donc un déplacement accepté dont le monde ne bouge pas.
 *
 * LES SESSIONS SONT OUVERTES PAR `ouvrirSession`, PUIS DÉPLACÉES PAR LE PRODUIT :
 * aucune session n'est forgée à la main ici. Une session forgée pour arriver à
 * l'état voulu prouverait le comportement sur un état que le produit ne sait
 * peut-être pas atteindre.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')
const CHEMIN_MINIMAL = path.join(__dirname, '__fixtures__', 'dossier-minimal.json')

/** Le clone d'une fixture, LU DU DISQUE à chaque appel — jamais muté en place (KR-156). */
function lire(chemin: string): Dossier {
	return JSON.parse(fs.readFileSync(chemin, 'utf8')) as Dossier
}

/** La session d'ouverture d'un dossier — et l'échec est NOMMÉ, jamais un `!`. */
function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

/** La `Commande` d'une saisie ACCEPTÉE — l'analyse ratée est nommée, jamais avalée. */
function commandeDe(saisie: string): Commande {
	const resultat = analyserSaisie(saisie)
	if (!resultat.ok) throw new Error(`saisie refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.commande
}

/** La session d'un résultat ACCEPTÉ. */
function sessionDe(resultat: ResultatCommande): EtatSession {
	if (!resultat.ok) throw new Error(`commande refusée (${resultat.refus}) : ${resultat.message}`)
	return resultat.session
}

/** Le message d'un refus — l'acceptation est un échec de test, pas un `??`. */
function messageDe(resultat: ResultatSaisie | ResultatCommande): string {
	if (resultat.ok) throw new Error('acceptée, alors que le témoin attend un refus')
	return resultat.message
}

/** Exécute une saisie sur un dossier et une session — le chemin complet du produit. */
function executer(dossier: Dossier, session: EtatSession, saisie: string): ResultatCommande {
	return executerCommande(dossier, session, commandeDe(saisie))
}

/**
 * La longueur de sous-chaîne cherchée dans la clause de NON-RÉCITATION. Elle est
 * NOMMÉE parce qu'elle contraint (KR-176) : trop courte, elle produirait des faux
 * positifs sur des mots français communs ; plus longue que la plus COURTE des trois
 * proses du jalon de référence (`nom`, 17 caractères), elle rendrait la garde
 * partiellement inerte. Sa non-vacuité est assertée à côté de la boucle.
 */
const SEUIL_DE_SOUS_CHAINE = 12

describe('executerCommande, le deplacement accepte', () => {
	it('deplacement le long d un acces oriente, cible en SECONDE position', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		// L'ÉTAT SÉPARATEUR : deux accès, et on vise le SECOND. `acces[0]` rendrait
		// `lieu.marche-des-cendres` et tout le reste du témoin s'écroulerait.
		expect(destinationsPossibles(dossier, depart)).toEqual(['lieu.marche-des-cendres', 'lieu.tour-effondree'])

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))

		expect(session.monde.lieu_courant).toBe('lieu.tour-effondree')
		expect(session.monde.lieux_visites).toEqual(['lieu.foyer-du-guet', 'lieu.tour-effondree'])
		expect(session.horloge.tour).toBe(depart.horloge.tour + 1)

		// DEUX ENTRÉES, UN SEUL PAS : elles portent le MÊME `tour`. Le numéro numérote
		// le PAS, pas la ligne — une demande et son effet.
		expect(session.journal).toEqual([
			{ tour: 1, role: 'joueur', texte: '> ALLER lieu.tour-effondree' },
			{
				tour: 1,
				role: 'moteur',
				texte: 'lieu_courant : lieu.foyer-du-guet → lieu.tour-effondree',
				origine: 'aller',
			},
		])

		// `origine` est ABSENTE de l'entrée `joueur` — pas « présente et indéfinie » :
		// `toEqual` ne distingue pas les deux, cette ligne si.
		expect('origine' in session.journal[0]).toBe(false)
		expect(session.journal.every((entree) => entree.origine === undefined || entree.role === 'moteur')).toBe(true)
	})

	it('auto-reference acceptee, sans doublon dans lieux_visites', () => {
		const dossier = lire(CHEMIN_MINIMAL)
		const depart = ouverture(dossier)

		expect(depart.monde.lieu_courant).toBe('lieu.val-cendre')
		expect(depart.monde.lieux_visites).toEqual(['lieu.val-cendre'])
		expect(destinationsPossibles(dossier, depart)).toEqual(['lieu.val-cendre'])

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.val-cendre'))

		// L'auto-référence est LÉGALE (`types.ts`, docstring de `Lieu.acces`) : jamais
		// un refus. L'implémentation fautive `[...lieux_visites, cible]` produit ici un
		// doublon qu'une assertion sur `lieu_courant` seul ne verrait jamais.
		expect(session.monde.lieux_visites).toEqual(['lieu.val-cendre'])
		expect(session.monde.lieu_courant).toBe('lieu.val-cendre')

		// ET LE PAS EST CONSOMMÉ QUAND MÊME : c'est la DEMANDE qui compte, jamais
		// l'effet (`docs/REGLES-PLAY.md` § J1).
		expect(session.horloge.tour).toBe(depart.horloge.tour + 1)
		expect(session.journal).toHaveLength(2)
	})

	it('le texte est RECONSTRUIT, jamais un echo de la saisie', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		// Casse ET espacement fautifs : ni l'un ni l'autre ne doit survivre. Le verbe
		// vient de `COMMANDES[id].verbe`, la cible de l'identifiant RÉSOLU.
		const session = sessionDe(executer(dossier, depart, '  AlLeR   lieu.tour-effondree  '))

		expect(session.journal[0].texte).toBe('> ALLER lieu.tour-effondree')
		expect(session.journal[1].texte).toBe('lieu_courant : lieu.foyer-du-guet → lieu.tour-effondree')

		// Aucune trace de la frappe : ni la casse d'origine, ni les espaces multiples.
		const textes = session.journal.map((entree) => entree.texte).join('\n')
		expect(textes).not.toContain('AlLeR')
		expect(textes).not.toContain('  ')
	})
})

/** Un `HeroState` plausible, PE en-deca du plafond — valeur d'appel, chaque test
 *  pose le `pe` qu'il lui faut via `avecPe`, jamais un second littéral complet. */
function heroAvec(pe: number): HeroState {
	return {
		name: 'Aldric le Temeraire',
		caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
		pvMax: 21,
		pv: 14,
		peMax: 8,
		pe,
		mcBonus: 0,
		xp: 12,
	}
}

describe('Regle A4 — +5 PE au changement de lieu REEL, plafonne (n 11 moteur-arbitre, it1)', () => {
	it('nominal : changement de lieu reel, pe gagne +5', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heroAvec(2))

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))

		expect(session.heros?.pe).toBe(7)
	})

	it('plafond : +5 ne depasse jamais peMax', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heroAvec(6))

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))

		expect(session.heros?.pe).toBe(8)
	})

	it('auto-reference : meme lieu, pe INCHANGE', () => {
		const dossier = lire(CHEMIN_MINIMAL)
		const depart = fixerHeros(ouverture(dossier), heroAvec(2))

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.val-cendre'))

		expect(session.heros?.pe).toBe(2)
	})

	it('sans heros : aller vers un autre lieu, la cle heros reste ABSENTE', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)
		expect('heros' in depart).toBe(false)

		const session = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))

		expect('heros' in session).toBe(false)
		expect(session.heros).toBeUndefined()
	})

	it('mauvais verbe : agir ne touche jamais pe', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = fixerHeros(ouverture(dossier), heroAvec(2))

		const session = sessionDe(executer(dossier, depart, 'AGIR'))

		expect(session.heros?.pe).toBe(2)
	})
})

describe('executerCommande, les deux refus de resolution', () => {
	it('refus sur une arete asymetrique — et aucun pas consomme', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		// On MONTE jusqu'à `lieu.vigie-du-nord` par le produit lui-même, en deux pas,
		// puis on tente le retour : l'arête est ORIENTÉE, et `vigie-du-nord` n'a pas
		// d'`acces`.
		const tour = sessionDe(executer(dossier, ouverture(dossier), 'ALLER lieu.tour-effondree'))
		const arrive = sessionDe(executer(dossier, tour, 'ALLER lieu.vigie-du-nord'))
		const avant = JSON.stringify(arrive)

		const resultat = executer(dossier, arrive, 'ALLER lieu.tour-effondree')

		expect(resultat.ok).toBe(false)
		expect(resultat.ok === false && resultat.refus).toBe('acces_absent')

		// L'ÉTAT SÉPARATEUR : sans l'asymétrie, l'implémentation fautive qui lirait
		// AUSSI les arêtes entrantes rendrait le même résultat qu'une résolution
		// orientée. Ici elle accepterait, là où le contrat refuse.
		expect(destinationsPossibles(dossier, arrive)).toEqual([])

		// UN REFUS NE CONSOMME AUCUN PAS. Le bras `{ ok: false }` ne PORTE pas de
		// session — c'est la signature figée du plan (§ 4) — donc la propriété
		// « même référence » se prouve sur l'ARGUMENT : il est intact, champ par champ.
		expect(JSON.stringify(arrive)).toBe(avant)
		expect(arrive.monde.lieu_courant).toBe('lieu.vigie-du-nord')
		expect(arrive.monde.lieux_visites).toEqual(['lieu.foyer-du-guet', 'lieu.tour-effondree', 'lieu.vigie-du-nord'])
		expect(arrive.horloge.tour).toBe(2)
	})

	it('impasse : acces absent ou vide — un refus CALME, jamais une anomalie', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const tour = sessionDe(executer(dossier, ouverture(dossier), 'ALLER lieu.tour-effondree'))
		const arrive = sessionDe(executer(dossier, tour, 'ALLER lieu.vigie-du-nord'))

		// (a) `acces` ABSENT — l'état de la fixture, tel quel.
		expect(destinationsPossibles(dossier, arrive)).toEqual([])

		// (b) `acces` VIDE — le MÊME état calme. Un lieu d'où l'on ne part vers nulle
		// part est une impasse jouable (`types.ts`, docstring de `Lieu.acces`), et les
		// deux formes doivent être indistinguables pour l'appelant.
		const avecListeVide = lire(CHEMIN_REFERENCE)
		const cul = avecListeVide.monde.lieux.find((lieu) => lieu.id === 'lieu.vigie-du-nord')
		if (cul === undefined) throw new Error('fixture : `lieu.vigie-du-nord` a disparu')
		cul.acces = []

		expect(destinationsPossibles(avecListeVide, arrive)).toEqual([])

		// Et la commande est REFUSÉE dans les deux cas — elle ne LÈVE jamais, et
		// n'écrit rien : aucune entrée de journal, aucun pas.
		const journalAvant = arrive.journal.length
		for (const variante of [dossier, avecListeVide]) {
			const resultat = executer(variante, arrive, 'ALLER lieu.tour-effondree')
			expect(resultat.ok === false && resultat.refus).toBe('acces_absent')
		}
		expect(arrive.horloge.tour).toBe(2)
		expect(arrive.journal).toHaveLength(journalAvant)
	})

	it('reference pendante NOMMEE — et l ordre des deux refus', () => {
		// Le dossier de référence n'a aucune pendante : on en fabrique une sur un
		// CLONE, parce que c'est l'état qu'aucune fixture partagée ne porte.
		const dossier = lire(CHEMIN_REFERENCE)
		const foyer = dossier.monde.lieux.find((lieu) => lieu.id === 'lieu.foyer-du-guet')
		if (foyer === undefined) throw new Error('fixture : `lieu.foyer-du-guet` a disparu')
		foyer.acces = ['lieu.foret-noire', 'lieu.tour-effondree']

		const depart = ouverture(dossier)

		// LES ACCÈS SONT RENDUS TELS QUELS : la pendante n'est NI filtrée NI masquée
		// (KR-021). Invisible à l'auteur, une orpheline ne se corrige jamais.
		expect(destinationsPossibles(dossier, depart)).toEqual(['lieu.foret-noire', 'lieu.tour-effondree'])

		const pendante = executer(dossier, depart, 'ALLER lieu.foret-noire')

		// ELLE NE LÈVE PAS — KR-238 vise l'évaluateur d'arbre de condition ; lever sur
		// un chemin utilisateur donnerait un écran blanc.
		expect(pendante.ok === false && pendante.refus).toBe('cible_inconnue')
		expect(messageDe(pendante)).toBe(
			"Destination introuvable dans le dossier : « lieu.foret-noire » — l'accès existe, le lieu non.",
		)

		// L'ORDRE DES DEUX REFUS, sur le même dossier : un lieu qui EXISTE mais n'est
		// pas un accès rend l'AUTRE refus. Sans cette moitié, un code qui rendrait
		// toujours `cible_inconnue` serait vert.
		const horsAcces = executer(dossier, depart, 'ALLER lieu.crypte-scellee')
		expect(horsAcces.ok === false && horsAcces.refus).toBe('acces_absent')
		expect(messageDe(horsAcces)).toBe(
			'Destination inconnue depuis ce lieu : « lieu.crypte-scellee ». Accès disponibles : lieu.foret-noire, lieu.tour-effondree.',
		)
	})
})

describe('analyserSaisie, les deux refus d analyse', () => {
	it('arite stricte — exactement 1 + refKinds.length jetons, jamais davantage', () => {
		// `===` ET JAMAIS `>=` : avaler les jetons en trop est la façon dont un canal
		// de texte libre s'ouvre, et le jeton avalé est celui que personne ne relit.
		expect(analyserSaisie('ALLER').ok).toBe(false)
		expect(analyserSaisie('ALLER lieu.x lieu.y').ok).toBe(false)

		const trop = analyserSaisie('ALLER lieu.x lieu.y')
		expect(trop.ok === false && trop.refus).toBe('arite_invalide')
		const pasAssez = analyserSaisie('ALLER')
		expect(pasAssez.ok === false && pasAssez.refus).toBe('arite_invalide')

		// L'ARITÉ EST DÉRIVÉE de `refKinds`, jamais un nombre en dur (KR-165).
		expect(COMMANDES.aller.refKinds).toEqual(['lieu'])
		expect(analyserSaisie('ALLER lieu.x')).toEqual({
			ok: true,
			commande: { commande: 'aller', cibles: ['lieu.x'] },
		})
	})

	it('l analyse NE CONSULTE PAS le dossier — une cible inventee est ACCEPTEE', () => {
		// La frontière du module : `analyserSaisie` lit une chaîne, rien d'autre. La
		// résolution appartient à `executerCommande`, et c'est ce qui permet à la
		// console de ne rien valider du tout.
		expect(analyserSaisie('ALLER ordure')).toEqual({
			ok: true,
			commande: { commande: 'aller', cibles: ['ordure'] },
		})
	})

	it('saisie vide, verbe hors registre : refusees par un message NOMME, jamais ignorees', () => {
		const vide = analyserSaisie('   ')
		expect(vide.ok === false && vide.refus).toBe('verbe_inconnu')
		// LE GABARIT EST APPLIQUÉ TEL QUEL À UNE SAISIE VIDE : les guillemets encadrent
		// une chaîne vide, donc DEUX espaces. C'est le gabarit qui le dit, pas une
		// valeur recopiée d'un rapport d'échec — `« ` + `` + ` »`.
		// ⚠ « ALLER, AGIR, PARLER » DEPUIS LA n° 12 it1 — corrigé EN VALEUR parce que le
		// registre a RÉELLEMENT bougé : la liste est dérivée, et c'est elle qui le dit.
		expect(messageDe(vide)).toBe('Commande inconnue : «  ». Commandes disponibles : ALLER, AGIR, PARLER.')

		const horsRegistre = analyserSaisie('SAUTER lieu.x')
		expect(horsRegistre.ok === false && horsRegistre.refus).toBe('verbe_inconnu')
		expect(messageDe(horsRegistre)).toBe(
			'Commande inconnue : « SAUTER lieu.x ». Commandes disponibles : ALLER, AGIR, PARLER.',
		)

		// UN SEUL GABARIT pour les deux refus d'analyse : une arité fautive est une
		// commande qu'on ne reconnaît pas.
		expect(messageDe(analyserSaisie('ALLER lieu.x lieu.y'))).toBe(
			'Commande inconnue : « ALLER lieu.x lieu.y ». Commandes disponibles : ALLER, AGIR, PARLER.',
		)
	})

	it('liste des verbes DERIVEE du registre — le verbe fictif le prouve', () => {
		// UNE LISTE EN DUR NE SE SÉPARE QUE PAR UN MUTANT : `"… : ALLER, AGIR, PARLER."`
		// écrit à la main passerait toutes les lignes ci-dessus. Le mutant est donc
		// OBLIGATOIRE — il est la seule mesure du pouvoir séparateur (BUG-087). Depuis la
		// n° 12 it1, le registre porte TROIS verbes réels, et le fictif est le QUATRIÈME.
		//
		// `defineRegistre` ne gèle rien (`identifiers.ts` : elle rend la carte telle
		// quelle), donc le registre est écrivable au runtime. C'est aussi pourquoi il
		// DOIT être révoqué : c'est un singleton de MODULE, et un registre pollué fait
		// un faux vert qui se propage aux tests suivants du même fichier.
		const registre = COMMANDES as unknown as Record<string, CommandeDescripteur>
		const SAISIE = 'ALER lieu.foret-noire'

		expect(messageDe(analyserSaisie(SAISIE))).toBe(
			'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER, AGIR, PARLER.',
		)

		try {
			registre.sauter = { label: 'saute', verbe: 'SAUTER', refKinds: ['lieu'] }

			expect(messageDe(analyserSaisie(SAISIE))).toBe(
				'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER, AGIR, PARLER, SAUTER.',
			)
			// Et le verbe fictif est RECONNU, arité comprise : la dérivation ne s'arrête
			// pas au message.
			expect(analyserSaisie('SAUTER lieu.x')).toEqual({
				ok: true,
				commande: { commande: 'sauter', cibles: ['lieu.x'] },
			})
		} finally {
			delete registre.sauter
		}

		// RÉVOCATION CONSTATÉE, jamais supposée — et L'ORDRE des trois verbes réels est
		// celui du registre : `aller` d'abord, `agir` ensuite, `parler` en troisième
		// (ordre des rangs `G1…`).
		expect(Object.keys(COMMANDES)).toEqual(['aller', 'agir', 'parler'])
		expect(messageDe(analyserSaisie(SAISIE))).toBe(
			'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER, AGIR, PARLER.',
		)
	})
})

/**
 * AGIR — LE SECOND VERBE (n° 10 `moteur-interprete`, it2, critère 2 du plan).
 *
 * CE QUI LE DISTINGUE D'`aller`, ET CHAQUE TÉMOIN CI-DESSOUS PORTE UNE DE CES
 * DIFFÉRENCES : arité 0 (il ne désigne rien), aucun refus de résolution (il n'a rien à
 * trouver), et `monde` rendu PAR RÉFÉRENCE (il ne change rien). Ce qu'il PARTAGE :
 * l'horloge avance de 1, et deux entrées de journal de même `tour` sont écrites, la
 * seconde portant `origine` — c'est elle qui recevra le récit du pas.
 */
describe('agir, le verbe d arite zero', () => {
	it('le registre porte agir : arite 0, verbe AGIR, et le libelle FIGE par le plan', () => {
		// L'ARITÉ EST DÉRIVÉE de `refKinds.length`, jamais stockée (KR-165).
		expect(COMMANDES.agir.refKinds).toEqual([])
		expect(COMMANDES.agir.refKinds).toHaveLength(0)
		expect(COMMANDES.agir.verbe).toBe('AGIR')
		// LE LIBELLÉ EST UN CONTRAT NARRATIF (KR-269) : le modèle le LIT à deux endroits,
		// et c'est sa seule source pour la portée du verbe. Texte FIGÉ au § 3 du plan
		// d'itération — épinglé mot pour mot, jamais reformulé par un ouvrier. Sa QUALITÉ
		// (3e personne, présent, portée « sur place », zéro mot de mécanique) est jugée en
		// revue humaine : aucun instrument de ce dépôt ne la constate.
		expect(COMMANDES.agir.label).toBe('agit sur place')
		// Discriminant : `aller` n'a pas bougé, et les deux libellés sont distincts.
		expect(COMMANDES.aller).toEqual({ label: 'va au lieu', verbe: 'ALLER', refKinds: ['lieu'] })
		expect(COMMANDES.agir.label).not.toBe(COMMANDES.aller.label)
	})

	it('analyse : AGIR seul est accepte, et le moindre jeton de plus est refuse', () => {
		// ARITÉ STRICTE, `===` ET JAMAIS `>=` — exactement `1 + 0` jeton.
		expect(analyserSaisie('AGIR')).toEqual({ ok: true, commande: { commande: 'agir', cibles: [] } })
		// Casse et espacement tolérés sur le VERBE, comme pour `aller`.
		expect(analyserSaisie('  aGiR  ')).toEqual({ ok: true, commande: { commande: 'agir', cibles: [] } })

		const avecCible = analyserSaisie('AGIR lieu.x')
		expect(avecCible.ok === false && avecCible.refus).toBe('arite_invalide')
		// Et le refus porte le MÊME gabarit que les autres refus d'analyse.
		expect(messageDe(avecCible)).toBe(
			'Commande inconnue : « AGIR lieu.x ». Commandes disponibles : ALLER, AGIR, PARLER.',
		)
	})

	it('executer : le monde est la MEME reference, l horloge avance de 1, deux entrees dont une a origine', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		const session = sessionDe(executer(dossier, depart, 'AGIR'))

		// LE TÉMOIN CENTRAL : `toBe`, JAMAIS `toEqual` — une COPIE égale du monde passerait
		// `toEqual` et mentirait sur le no-op.
		expect(session.monde).toBe(depart.monde)
		expect(session.horloge.tour).toBe(depart.horloge.tour + 1)
		expect(session.journal).toEqual([
			{ tour: 1, role: 'joueur', texte: '> AGIR' },
			{ tour: 1, role: 'moteur', texte: 'lieu_courant : lieu.foyer-du-guet', origine: 'agir' },
		])
		// Le texte moteur est un RELEVÉ, pas une transition : aucune flèche.
		expect(session.journal[1].texte).not.toContain('→')
		// `origine` ABSENTE de l'entrée `joueur` — pas « présente et indéfinie ».
		expect('origine' in session.journal[0]).toBe(false)
		expect(session.journal.every((entree) => entree.origine === undefined || entree.role === 'moteur')).toBe(true)
		// ET L'ARGUMENT EST INTACT : la session d'entrée n'a pas été mutée.
		expect(depart.horloge.tour).toBe(0)
		expect(depart.journal).toEqual([])
	})

	it('executer : aucun refus, meme dans une impasse ou aller n a plus rien a proposer', () => {
		// L'ÉTAT SÉPARATEUR : `lieu.vigie-du-nord` n'a AUCUN accès. `aller` y est refusé
		// quelle que soit la cible ; `agir`, qui ne désigne rien, y est accepté.
		const dossier = lire(CHEMIN_REFERENCE)
		const tour = sessionDe(executer(dossier, ouverture(dossier), 'ALLER lieu.tour-effondree'))
		const vigie = sessionDe(executer(dossier, tour, 'ALLER lieu.vigie-du-nord'))
		expect(destinationsPossibles(dossier, vigie)).toEqual([])
		expect(executer(dossier, vigie, 'ALLER lieu.tour-effondree').ok).toBe(false)

		const apres = sessionDe(executer(dossier, vigie, 'AGIR'))

		expect(apres.monde).toBe(vigie.monde)
		expect(apres.horloge.tour).toBe(vigie.horloge.tour + 1)
		expect(apres.journal.slice(vigie.journal.length)).toEqual([
			{ tour: 3, role: 'joueur', texte: '> AGIR' },
			{ tour: 3, role: 'moteur', texte: 'lieu_courant : lieu.vigie-du-nord', origine: 'agir' },
		])
		// LES ENTRÉES DÉJÀ ÉCRITES SONT LES MÊMES RÉFÉRENCES : rien du passé n'est recopié.
		expect(apres.journal.slice(0, vigie.journal.length).every((entree, rang) => entree === vigie.journal[rang])).toBe(
			true,
		)
	})

	it('executer : la passe des jalons tourne, et ne peut rien atteindre — aucune ligne de jalon', () => {
		// UN NO-OP N'OUVRE RIEN : la passe tourne après toute commande ACCEPTÉE, mais un
		// monde inchangé ne rend aucune condition nouvellement vraie. Témoin sur le pas
		// qui SUIT l'atteinte du jalon de référence — le seul état où un jalon vient
		// d'être posé, donc le seul où une passe fautive pourrait le réécrire.
		const dossier = lire(CHEMIN_REFERENCE)
		const vigie = ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'].reduce(
			(courante, saisie) => sessionDe(executer(dossier, courante, saisie)),
			ouverture(dossier),
		)
		expect(vigie.monde.jalons_atteints).toEqual(['jalon.premiere-vigie'])

		const apres = sessionDe(executer(dossier, vigie, 'AGIR'))

		expect(apres.monde).toBe(vigie.monde)
		expect(apres.journal.slice(vigie.journal.length)).toHaveLength(2)
		expect(apres.journal.slice(vigie.journal.length).filter((entree) => entree.deltas !== undefined)).toEqual([])
	})

	it('executer : une attente pendante n est pas touchee par la transition — sa cloture appartient a apresInterpretation', () => {
		// `executerCommande` IGNORE `attente` (commandes.ts ne la connaît pas) : c'est
		// `apresInterpretation` qui la retire, et nulle part ailleurs. Un `agir` qui la
		// retirerait ici créerait un SECOND décideur (KR-013).
		const dossier = lire(CHEMIN_REFERENCE)
		const avecAttente: EtatSession = {
			...ouverture(dossier),
			attente: { type: 'clarification', question: 'Le marche ou la tour ?', saisie: 'je vais la-bas' },
		}

		const apres = sessionDe(executer(dossier, avecAttente, 'AGIR'))

		expect(apres.attente).toBe(avecAttente.attente)
		expect(apres.monde).toBe(avecAttente.monde)
	})
})

/**
 * PARLER — n° 12 `moteur-acteurs`, it1, lot `contrat` (§ 6 critère 2, § 7 du plan
 * d'itération : « commandes.test.ts — TRANSITIONS.parler garde »). CE QUI LE
 * DISTINGUE D'`aller`/`agir` : arité 1 sur `refKinds:['pnj']`, DEUX refus de
 * RÉSOLUTION au lieu d'un (`cible_inconnue` puis `cible_indisponible`), et une
 * garde STRUCTURELLE — ni `fonction` ni `apparence` ne sont LUES pour leur
 * CONTENU, seulement constatées non vides. `monde` N'EST JAMAIS TOUCHÉ, comme
 * `agir`. AUCUN appel à `CopiloteService` n'est construit ICI : la garde refuse
 * AVANT toute construction de `CibleActeur` (ce module n'importe d'ailleurs rien
 * de `copilote/`).
 */
describe('parler, le dixieme role — garde structurelle (n 12 moteur-acteurs, it1)', () => {
	it('le registre porte parler : arite 1 sur refKinds:[pnj], verbe PARLER, label FIGE par le plan', () => {
		expect(COMMANDES.parler.refKinds).toEqual(['pnj'])
		expect(COMMANDES.parler.verbe).toBe('PARLER')
		// LIBELLÉ FIGÉ au § 4 du plan d'itération — épinglé mot pour mot.
		expect(COMMANDES.parler.label).toBe("s'adresse à quelqu'un sur place")
		// Discriminant : les trois libellés sont distincts.
		expect(new Set([COMMANDES.aller.label, COMMANDES.agir.label, COMMANDES.parler.label]).size).toBe(3)
	})

	it('analyse : PARLER <id> est accepte en arite 1, comme ALLER', () => {
		expect(analyserSaisie('PARLER pnj.harek-le-forgeron')).toEqual({
			ok: true,
			commande: { commande: 'parler', cibles: ['pnj.harek-le-forgeron'] },
		})
		const sansCible = analyserSaisie('PARLER')
		expect(sansCible.ok === false && sansCible.refus).toBe('arite_invalide')
	})

	it('personnagesPresents : RENDU TEL QUEL, non filtre sur l identite — Harek seul au Foyer du Guet (fixture it1)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		// ÉTAT SÉPARATEUR MESURÉ : Harek est le SEUL personnage de la fixture présent au
		// lieu de départ (lot contrat d'it1, prérequis de la démo). Sélène (tour
		// effondrée) et Corvin (marché des cendres) sont présents AILLEURS.
		expect(personnagesPresents(dossier, depart)).toEqual(['pnj.harek-le-forgeron'])
	})

	it('executer : PARLER a Harek est accepte — un pas consomme, deux entrees, monde INCHANGE', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		const session = sessionDe(executer(dossier, depart, 'PARLER pnj.harek-le-forgeron'))

		// LE TÉMOIN CENTRAL, comme pour `agir` : `toBe`, JAMAIS `toEqual` — `parler` ne
		// touche jamais `monde` en it1 (design_contract).
		expect(session.monde).toBe(depart.monde)
		expect(session.horloge.tour).toBe(depart.horloge.tour + 1)
		expect(session.journal).toEqual([
			{ tour: 1, role: 'joueur', texte: '> PARLER pnj.harek-le-forgeron' },
			{
				tour: 1,
				role: 'moteur',
				texte: 'interlocuteur : pnj.harek-le-forgeron',
				origine: 'parler',
				interlocuteur: 'pnj.harek-le-forgeron',
			},
		])
		// `origine` ABSENTE de l'entrée `joueur`, `recit` ABSENT des deux (pas encore
		// écrit — ce sera `consignerNarration`, hors de ce module).
		expect('origine' in session.journal[0]).toBe(false)
		expect('recit' in session.journal[1]).toBe(false)
		expect(session.journal.every((entree) => entree.interlocuteur === undefined || entree.origine === 'parler')).toBe(
			true,
		)
	})

	it('refus cible_inconnue : un identifiant qui ne resout dans AUCUN monde.personnages[]', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)
		const avant = JSON.stringify(depart)

		const resultat = executer(dossier, depart, 'PARLER pnj.n-existe-pas')

		expect(resultat.ok).toBe(false)
		expect(resultat.ok === false && resultat.refus).toBe('cible_inconnue')
		expect(messageDe(resultat)).toBe("pnj.n-existe-pas n'est pas ici.")
		// AUCUN PAS CONSOMMÉ : l'argument est intact, champ par champ.
		expect(JSON.stringify(depart)).toBe(avant)
	})

	it('refus cible_indisponible : resout mais ABSENT du lieu courant (Selene, a la tour effondree)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		// ÉTAT SÉPARATEUR : Sélène résout bien dans `monde.personnages[]`, et porte une
		// identité (`portee`), mais sa SEULE présence est à `lieu.tour-effondree` — pas
		// au Foyer du Guet, le lieu de départ.
		const resultat = executer(dossier, depart, 'PARLER pnj.selene-la-vigie')

		expect(resultat.ok).toBe(false)
		expect(resultat.ok === false && resultat.refus).toBe('cible_indisponible')
		// MÊME TEXTE D'INTERFACE que `cible_inconnue` (§ 3 du plan) — « {cible} n'est pas
		// ici. » couvre les deux derniers cas.
		expect(messageDe(resultat)).toBe("pnj.selene-la-vigie n'est pas ici.")
	})

	it('refus cible_indisponible : resout, present au lieu, mais SANS aucune prose d identite', () => {
		// FICTION SUR UN CLONE : aucune fixture partagée ne porte ce cas — un
		// personnage présent au départ et pourtant sans `fonction` ni `apparence`.
		const dossier = lire(CHEMIN_REFERENCE)
		const harek = dossier.monde.personnages.find((personnage) => personnage.id === 'pnj.harek-le-forgeron')
		if (harek === undefined) throw new Error('fixture : `pnj.harek-le-forgeron` a disparu')
		delete harek.fonction
		delete harek.apparence
		const depart = ouverture(dossier)

		const resultat = executer(dossier, depart, 'PARLER pnj.harek-le-forgeron')

		expect(resultat.ok).toBe(false)
		expect(resultat.ok === false && resultat.refus).toBe('cible_indisponible')
		expect(messageDe(resultat)).toBe("pnj.harek-le-forgeron n'est pas ici.")
	})

	it('refus cible_indisponible : une identite faite SEULEMENT de blancs ne compte pas (garde structurelle, trim)', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const harek = dossier.monde.personnages.find((personnage) => personnage.id === 'pnj.harek-le-forgeron')
		if (harek === undefined) throw new Error('fixture : `pnj.harek-le-forgeron` a disparu')
		harek.fonction = '   '
		harek.apparence = '\n\t '
		const depart = ouverture(dossier)

		const resultat = executer(dossier, depart, 'PARLER pnj.harek-le-forgeron')

		expect(resultat.ok === false && resultat.refus).toBe('cible_indisponible')
	})

	it('l ordre des deux refus de resolution, sur le MEME dossier : inconnu puis indisponible', () => {
		// Précédent exact `aller` (`reference pendante NOMMEE`) : un identifiant qui
		// n'existe PAS DU TOUT rend `cible_inconnue`, un identifiant qui EXISTE mais ne
		// satisfait pas la garde rend `cible_indisponible` — jamais confondus.
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		const inconnu = executer(dossier, depart, 'PARLER pnj.fantome')
		expect(inconnu.ok === false && inconnu.refus).toBe('cible_inconnue')

		const indisponible = executer(dossier, depart, 'PARLER pnj.selene-la-vigie')
		expect(indisponible.ok === false && indisponible.refus).toBe('cible_indisponible')
	})

	it('aucun refus ne consomme de pas, et la session d entree n est jamais mutee', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)
		const avant = JSON.stringify(depart)

		executer(dossier, depart, 'PARLER pnj.fantome')
		executer(dossier, depart, 'PARLER pnj.selene-la-vigie')

		expect(JSON.stringify(depart)).toBe(avant)
		expect(depart.horloge.tour).toBe(0)
		expect(depart.journal).toEqual([])
	})
})

describe('executerCommande, la passe des jalons', () => {
	/** Le jalon du dossier de référence, lu du document — jamais recopié en littéral. */
	function jalonDeReference(dossier: Dossier) {
		const jalon = dossier.charpente.jalons.find((candidat) => candidat.declencheur_expr !== undefined)
		if (jalon === undefined) throw new Error('fixture : plus aucun jalon à `declencheur_expr`')
		return jalon
	}

	it('un jalon devenu vrai EN COURS de partie ecrit UNE ligne, au MEME tour', () => {
		// CRITÈRE 3, MOITIÉ MOTEUR — le rendu est l'affaire du lot `play-mode`. C'est le
		// SEUL scénario du dépôt où une condition devient vraie PENDANT la partie :
		// `jalon.premiere-vigie` se déclenche sur `lieu_visite(lieu.vigie-du-nord)`, et
		// la vigie n'est atteignable qu'en DEUX pas depuis le départ.
		const dossier = lire(CHEMIN_REFERENCE)
		const depart = ouverture(dossier)

		// L'ÉTAT SÉPARATEUR : rien n'est atteint à l'ouverture, ni après le PREMIER pas.
		expect(depart.monde.jalons_atteints).toEqual([])
		const tour1 = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))
		expect(tour1.monde.jalons_atteints).toEqual([])
		expect(tour1.journal).toHaveLength(2)

		const tour2 = sessionDe(executer(dossier, tour1, 'ALLER lieu.vigie-du-nord'))

		// UNE SEULE ENTRÉE DE JALON, ET ELLE PORTE LE MÊME `tour` QUE LA COMMANDE : une
		// conséquence enchaînée n'ajoute jamais un pas (§ J1). Elle est SUIVIE d'une ligne du tick,
		// `etape_bloquee` (n° 14 it3) : la `duree: 2` de l'étape de départ de Corvin, origine 0,
		// tombe à ce pas — ce n'est pas un second jalon, et elle n'a ni `origine` ni `deltas`.
		expect(tour2.horloge.tour).toBe(2)
		expect(tour2.journal.slice(2)).toEqual([
			{ tour: 2, role: 'joueur', texte: '> ALLER lieu.vigie-du-nord' },
			{
				tour: 2,
				role: 'moteur',
				texte: 'lieu_courant : lieu.tour-effondree → lieu.vigie-du-nord',
				origine: 'aller',
			},
			{
				tour: 2,
				role: 'moteur',
				texte: 'jalons_atteints : jalon.premiere-vigie',
				deltas: [
					{ delta: 'atteindre_jalon', cibles: ['jalon.premiere-vigie'], effet: 'applique' },
					{ delta: 'reveler_indice', cibles: ['indice.pas-dans-la-cendre'], effet: 'applique' },
				],
			},
			{ tour: 2, role: 'moteur', texte: 'etape_bloquee : pnj.corvin-le-marchand 1' },
		])

		// PAS D'`origine` SUR LA LIGNE DE JALON — pas « présente et indéfinie » :
		// `toEqual` ne distingue pas les deux, cette ligne si. Le registre des commandes
		// est ce qu'un JOUEUR peut TAPER, et un jalon franchi n'en est pas.
		expect('origine' in tour2.journal[4]).toBe(false)

		// ET L'ÉTAT A BOUGÉ : la marque et l'effet, tous deux.
		expect(tour2.monde.jalons_atteints).toEqual(['jalon.premiere-vigie'])
		expect(tour2.monde.indices_connus).toEqual(['indice.pas-dans-la-cendre'])
	})

	it('le texte du jalon est RECONSTRUIT — ni enonce_texte, ni nom d auteur', () => {
		// LE VOCABULAIRE EST CLOS : noms de champs d'`EtatMonde`, identifiants
		// `espace.slug`, et les séparateurs `>`, `:`, `→`. Le `→` reste réservé à une
		// transition SCALAIRE — une appartenance d'ensemble n'en porte pas.
		//
		// MUTANT NOMMÉ, ÉCRIT, VU ROUGE, RÉVOQUÉ : composer le texte avec `jalon.nom`
		// au lieu de l'identifiant. `enonce_texte` serait pire encore — une TROISIÈME
		// prose émise verbatim, alors que le dossier n'en compte que deux.
		const dossier = lire(CHEMIN_REFERENCE)
		const jalon = jalonDeReference(dossier)
		const session = ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'].reduce(
			(courante, saisie) => sessionDe(executer(dossier, courante, saisie)),
			ouverture(dossier),
		)

		const ligneDuJalon = session.journal[4]
		expect(ligneDuJalon.texte).toBe(`jalons_atteints : ${jalon.id}`)
		expect(ligneDuJalon.texte).not.toContain('→')

		// AUCUNE LIGNE du journal ne porte une sous-chaîne des deux proses qui ne
		// sortent pas — `enonce_texte` est d'audience `ia`, `nom` d'audience `auteur`.
		// L'échec nomme la ligne ET la prose, jamais un booléen.
		for (const [rang, entree] of session.journal.entries()) {
			for (const [champ, prose] of [
				['enonce_texte', jalon.enonce_texte],
				['declencheur_texte', jalon.declencheur_texte],
				['nom', jalon.nom ?? ''],
			] as const) {
				if (prose === '') continue
				expect(`${rang} · ${champ} → ${entree.texte.includes(prose.slice(0, SEUIL_DE_SOUS_CHAINE))}`).toBe(
					`${rang} · ${champ} → false`,
				)
			}
		}
		// Discriminance des trois proses : elles ne sont pas vides, sinon la boucle
		// ci-dessus ne chercherait rien.
		expect(
			[jalon.enonce_texte, jalon.declencheur_texte, jalon.nom ?? ''].every(
				(prose) => prose.length > SEUIL_DE_SOUS_CHAINE,
			),
		).toBe(true)
	})

	it('la passe tourne apres une commande ACCEPTEE, jamais apres un refus', () => {
		// UN REFUS N'A RIEN CHANGÉ AU MONDE, donc aucune condition n'a pu devenir
		// vraie : rejouer la passe serait du travail pour rien ET une occasion de lever
		// sur un chemin qui n'écrit rien (KR-238/239).
		//
		// LE TÉMOIN SE MONTE SUR UN DOSSIER QUI ATTEINDRAIT UN JALON SI LA PASSE
		// TOURNAIT : sans cela, le silence d'après refus serait vrai d'un dossier sans
		// jalon déclenchable, c'est-à-dire de rien.
		const dossier = lire(CHEMIN_REFERENCE)
		const jalon = jalonDeReference(dossier)
		jalon.declencheur_expr = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.foyer-du-guet'] }

		// (a) LE REFUS — la cible n'est pas un accès du lieu courant. L'argument est
		// intact, champ par champ : ni jalon, ni ligne de journal, ni pas.
		const depart = ouverture(lire(CHEMIN_REFERENCE))
		const avant = JSON.stringify(depart)
		const refus = executer(dossier, depart, 'ALLER lieu.crypte-scellee')

		expect(refus.ok === false && refus.refus).toBe('acces_absent')
		expect(JSON.stringify(depart)).toBe(avant)
		expect(depart.monde.jalons_atteints).toEqual([])
		expect(depart.journal).toEqual([])

		// (b) DISCRIMINANCE, DANS LE MÊME TEST : la MÊME session, une commande ACCEPTÉE,
		// et le même jalon part. Sans cette moitié, le silence de (a) serait celui d'une
		// passe qu'on aurait débranchée des deux côtés.
		const accepte = sessionDe(executer(dossier, depart, 'ALLER lieu.marche-des-cendres'))
		expect(accepte.monde.jalons_atteints).toEqual([jalon.id])
		expect(accepte.journal).toHaveLength(3)
	})
})

describe('executerCommande, le pliage', () => {
	/** Trois pas, dont un RETOUR : il exerce la re-visite sans doublon. */
	const SEQUENCE = ['ALLER lieu.marche-des-cendres', 'ALLER lieu.foyer-du-guet', 'ALLER lieu.tour-effondree'] as const

	function plier(dossier: Dossier, depart: EtatSession): EtatSession {
		return SEQUENCE.reduce((session, saisie) => sessionDe(executer(dossier, session, saisie)), depart)
	}

	it('meme sequence, meme etat — et S0 sort intact', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const s0 = ouverture(dossier)

		// SÉRIALISÉ IMMÉDIATEMENT, ET C'EST MESURÉ, PAS ESTHÉTIQUE : sous l'évasion de
		// type (M2 ci-dessous), les deux pliages PARTAGENT le tableau muté, si bien
		// qu'un `toEqual` sur les deux objets vivants les trouverait égaux. Le premier
		// état doit être figé AVANT que le second ne s'exécute.
		const premier = JSON.stringify(plier(dossier, s0))
		const second = JSON.stringify(plier(dossier, s0))

		expect(second).toEqual(premier)

		// Et l'état plié est celui qu'on attend — sans quoi l'égalité ci-dessus serait
		// vraie de deux pliages également faux.
		const etat = JSON.parse(premier) as EtatSession
		expect(etat.monde.lieu_courant).toBe('lieu.tour-effondree')
		expect(etat.monde.lieux_visites).toEqual(['lieu.foyer-du-guet', 'lieu.marche-des-cendres', 'lieu.tour-effondree'])
		expect(etat.horloge.tour).toBe(3)
		// SIX lignes de commande (deux par pas) et UNE ligne du tick : la `duree: 2` de l'étape de
		// départ de Corvin tombe au pas 2 (n° 14 it3).
		expect(etat.journal).toHaveLength(7)
		expect(etat.journal.filter((ligne) => ligne.texte.startsWith('etape_bloquee : '))).toHaveLength(1)

		// IMMUTABILITÉ AU RUNTIME : le typage `readonly` interdit `push` à la
		// COMPILATION, et une évasion de type l'y ramène. S0 n'a pas bougé.
		expect(s0.monde.lieux_visites).toEqual(['lieu.foyer-du-guet'])
		expect(s0.horloge.tour).toBe(0)
		expect(s0.journal).toEqual([])
	})
})

/**
 * LA FRONTIÈRE DU BARIL, INSTRUMENTÉE PLUTÔT QU'AFFIRMÉE (revue de PR d'it2).
 *
 * `brain/index.ts` affirmait la parité avec `PREDICATES`, `DELTAS` et le marqueur
 * d'amorce — or ces trois-là ont chacun leur test-grep, et `COMMANDES` n'en avait
 * AUCUN : la frontière était conventionnelle, l'affirmation de parité fausse.
 *
 * LE CONTOURNEMENT N'EST PAS THÉORIQUE, et c'est lui qu'on ferme :
 *  · `COMMANDES` importé en profondeur laisserait une feature RE-LISTER les verbes,
 *    alors que le moteur compose déjà le message de refus (Déméter) ;
 *  · `createMagasinDeSession(useBrain().persistence)` — le DÉCORATEUR au lieu du
 *    magasin brut — remettrait silencieusement les sessions dans la file de
 *    synchronisation et annulerait la décision d'audience de cette itération, sans
 *    qu'aucun instrument ne rougisse.
 *
 * PÉRIMÈTRE DÉRIVÉ DU DISQUE (précédent maison : `lintIsolation.test.ts`) : une
 * liste littérale exempterait en silence toute feature neuve. D'où l'assertion de
 * NON-VACUITÉ — sans elle, le balayage passe sur zéro fichier et ne mesure rien
 * (BUG-084).
 */
describe('la frontiere du baril est instrumentee, pas conventionnelle', () => {
	const RACINE_FEATURES = path.join(__dirname, '..', '..', 'features')
	const INTERDITS = ['COMMANDES', 'createMagasinDeSession']

	/**
	 * EXCLUSION NOMMÉE — n° 10 `moteur-interprete` lot 2 (KR-260).
	 * `useTourDeJeu.ts` est le SEUL fichier autorisé à importer COMMANDES
	 * pour convertir CommandeId → label.
	 */
	const FICHIERS_EXCLUS = [path.join(RACINE_FEATURES, 'play-mode', 'hooks', 'useTourDeJeu.ts')]

	function fichiersDeFeature(racine: string): string[] {
		return fs.readdirSync(racine, { withFileTypes: true }).flatMap((entree) => {
			const chemin = path.join(racine, entree.name)
			if (entree.isDirectory()) return fichiersDeFeature(chemin)
			// Exclure les fichiers test du balayage
			if (/\.test\.tsx?$/.test(entree.name)) return []
			return /\.tsx?$/.test(entree.name) ? [chemin] : []
		})
	}

	it('aucune feature n importe COMMANDES ni createMagasinDeSession (sauf exclusion nommee)', () => {
		const fichiers = fichiersDeFeature(RACINE_FEATURES)
		// Non-vacuité : le balayage voit réellement le disque.
		expect(fichiers.length).toBeGreaterThan(50)

		// ON CHERCHE DU CODE, PAS UNE MENTION — même distinction que la garde
		// anti-parseur d'`expr.test.ts` : trois fichiers de `play-mode` NOMMENT
		// `COMMANDES` et `createMagasinDeSession` en docstring, précisément pour dire
		// que la feature ne les touche pas. Une règle qui interdirait de les écrire
		// interdirait d'expliquer pourquoi.
		//
		// Les commentaires sont RETIRÉS, puis on cherche la SOUS-CHAÎNE NUE — jamais
		// une frontière de mot : `\b` dans un gabarit JS est un BACKSPACE, pas une
		// ancre, et le motif se tromperait en silence (même famille que BUG-120).
		const sansCommentaires = (source: string): string =>
			source.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\/\/[^\n]*/g, '')

		const coupables = fichiers.filter((fichier) => {
			// EXCLUSION NOMMÉE
			const estExclu = FICHIERS_EXCLUS.some((exclu) => fichier === exclu)
			if (estExclu) return false

			const code = sansCommentaires(fs.readFileSync(fichier, 'utf8'))
			return INTERDITS.some((nom) => code.includes(nom))
		})
		expect(coupables.map((f) => path.relative(RACINE_FEATURES, f))).toEqual([])

		// DISCRIMINANCE, DANS LES DEUX SENS — sans elle, l'assertion ci-dessus serait
		// verte sur un balayage qui ne trouve rien (BUG-084) ou qui efface tout.
		expect(sansCommentaires("import { COMMANDES } from '../../brain/dossier/commandes'").includes(INTERDITS[0])).toBe(
			true,
		)
		expect(sansCommentaires('const m = createMagasinDeSession(p)').includes(INTERDITS[1])).toBe(true)
		expect(sansCommentaires('// on ne touche pas COMMANDES').includes(INTERDITS[0])).toBe(false)
		expect(sansCommentaires('/** ni createMagasinDeSession */').includes(INTERDITS[1])).toBe(false)
	})
})

/**
 * `combat_en_cours` (n° 13 `moteur-combat`, it1, lot `contrat`) — CRITÈRE 4 DU PLAN,
 * MOITIÉ `RefusCommande` : tant que `session.combat` existe, AUCUNE commande n'est
 * acceptée. Un combat est UN pas d'horloge (KR-295), jamais une suite de commandes.
 *
 * LES TROIS VERBES SONT BALAYÉS DEPUIS `COMMANDES`, jamais trois littéraux : un
 * verbe de plus au registre est refusé sans qu'on y pense — et ce témoin rougit
 * tant qu'on ne lui a pas écrit sa saisie (`Record<CommandeId, …>` exhaustif).
 */
describe('executerCommande, combat_en_cours (n 13 moteur-combat, it1)', () => {
	const RENCONTRE = { evenement_id: 'evenement.embuscade-a-la-tour', monstre_ref: 'bestiaire.squelette' }
	const MESSAGE = "Un combat est en cours : aucune commande n'est acceptée avant son issue."

	/**
	 * UNE SAISIE ACCEPTABLE PAR VERBE, depuis le lieu de départ du dossier de référence
	 * (`lieu.foyer-du-guet`) : `lieu.marche-des-cendres` est un accès, et Harek y est
	 * présent avec une identité. Sans combat, les trois sont ACCEPTÉES — c'est ce qui
	 * donne au refus sa valeur de discriminant.
	 */
	const SAISIES: Record<CommandeId, string> = {
		aller: 'ALLER lieu.marche-des-cendres',
		agir: 'AGIR',
		parler: 'PARLER pnj.harek-le-forgeron',
	}

	/** Le héros au repos, puis le MÊME héros avec un combat OUVERT par le produit. */
	function situation(dossier: Dossier): { auRepos: EtatSession; enCombat: EtatSession } {
		const auRepos = fixerHeros(ouverture(dossier), heroAvec(2))
		return { auRepos, enCombat: resoudreRencontre(auRepos, RENCONTRE) }
	}

	it('refuse CHAQUE verbe du registre tant que combat existe — et les accepte tous sans combat', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const { auRepos, enCombat } = situation(dossier)

		// TOTALITÉ : une saisie par verbe du registre, ni plus ni moins.
		expect(Object.keys(SAISIES).sort()).toEqual(Object.keys(COMMANDES).sort())
		expect('combat' in auRepos).toBe(false)
		expect(enCombat.combat).toEqual({ monstre_ref: 'bestiaire.squelette', postures: [] })

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			// DISCRIMINANT : la même saisie, sur la même session SANS combat, est acceptée.
			expect(`${id} sans combat → ${executer(dossier, auRepos, SAISIES[id]).ok}`).toBe(`${id} sans combat → true`)

			const refus = executer(dossier, enCombat, SAISIES[id])
			expect(`${id} en combat → ${refus.ok === false && refus.refus}`).toBe(`${id} en combat → combat_en_cours`)
			expect(messageDe(refus)).toBe(MESSAGE)
		}
	})

	it('le refus est le PREMIER : il passe avant acces_absent, cible_inconnue et cible_indisponible', () => {
		// UN REFUS PAR CAUSE, chacun avec son refus HABITUEL sans combat (le discriminant)
		// puis `combat_en_cours` avec : sans cette moitié, « toujours combat_en_cours »
		// serait vert sur un moteur qui n'aurait plus aucun autre refus.
		const dossier = lire(CHEMIN_REFERENCE)
		const { auRepos, enCombat } = situation(dossier)
		const AUTRES_REFUS = [
			['ALLER lieu.crypte-scellee', 'acces_absent'],
			['PARLER pnj.fantome', 'cible_inconnue'],
			['PARLER pnj.selene-la-vigie', 'cible_indisponible'],
		] as const

		for (const [saisie, habituel] of AUTRES_REFUS) {
			const sans = executer(dossier, auRepos, saisie)
			expect(`${saisie} sans combat → ${sans.ok === false && sans.refus}`).toBe(`${saisie} sans combat → ${habituel}`)

			const avec = executer(dossier, enCombat, saisie)
			expect(`${saisie} en combat → ${avec.ok === false && avec.refus}`).toBe(`${saisie} en combat → combat_en_cours`)
			expect(messageDe(avec)).toBe(MESSAGE)
		}
	})

	it('un refus ne consomme AUCUN pas : session intacte, horloge, journal, monde, jalons', () => {
		// Le bras `{ ok: false }` ne porte pas de session : la propriété se prouve sur
		// l'ARGUMENT, champ par champ. ET LE DOSSIER EST MONTÉ POUR QU'UN JALON PARTE SI LA
		// PASSE TOURNAIT (précédent « la passe tourne après une commande ACCEPTÉE ») : sans
		// cela, le silence sous combat serait celui d'un dossier sans jalon déclenchable.
		const dossier = lire(CHEMIN_REFERENCE)
		const jalon = dossier.charpente.jalons.find((candidat) => candidat.declencheur_expr !== undefined)
		if (jalon === undefined) throw new Error('fixture : plus aucun jalon à `declencheur_expr`')
		jalon.declencheur_expr = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.foyer-du-guet'] }

		const auRepos = fixerHeros(ouverture(lire(CHEMIN_REFERENCE)), heroAvec(2))
		const enCombat = resoudreRencontre(auRepos, RENCONTRE)
		const avant = JSON.stringify(enCombat)

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			expect(`${id} → ${executer(dossier, enCombat, SAISIES[id]).ok}`).toBe(`${id} → false`)
		}
		expect(JSON.stringify(enCombat)).toBe(avant)
		expect(enCombat.monde.jalons_atteints).toEqual([])
		expect(enCombat.horloge.tour).toBe(0)
		expect(enCombat.journal).toEqual([])

		// DISCRIMINANT, DANS LE MÊME TEST : sans combat, la même commande est acceptée ET
		// le même jalon part — la passe est bien branchée, et c'est le combat qui la coupe.
		const accepte = sessionDe(executer(dossier, auRepos, 'AGIR'))
		expect(accepte.monde.jalons_atteints).toEqual([jalon.id])
	})

	it('mort conserve combat_en_cours : la mort laisse le combat en place, donc aucune commande ne reprend — et le refus n est JAMAIS partie_terminee', () => {
		// CRITÈRE 4 DU PLAN : `cloreCombat` rend la session À L'IDENTIQUE sur `hero-mort`
		// (combat reste), et c'est `combat` — non un drapeau de fin — qui refuse.
		const dossier = lire(CHEMIN_REFERENCE)
		const { enCombat } = situation(dossier)
		const BILAN = { pv: 9, pe: 1, xp: 3, pv_max_delta: 0, pe_max_delta: 0 }

		const mort = cloreCombat(enCombat, { issue: 'hero-mort', ...BILAN })
		expect(mort).toBe(enCombat)

		// L'ÉTAT SÉPARATEUR (n° 15 `moteur-fins`, it1, KR-303) : sur ce MÊME monde, la condition de
		// `fin.vigie-abandonnee` est VRAIE (embuscade consommée à l'ouverture du combat, vigie du
		// nord jamais visitée) — vue SANS le combat, une fin est atteinte ; avec lui, aucune. C'est
		// ce qui fait de `combat_en_cours` le refus de la mort, et de `partie_terminee` celui de la fin
		// seule : les deux sont exclusifs PAR CONSTRUCTION, sans clause de priorité.
		expect(finAtteinte(dossier, { monde: mort.monde })?.fin_id).toBe('fin.vigie-abandonnee')
		expect(finAtteinte(dossier, mort)).toBeUndefined()

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			const refus = executer(dossier, mort, SAISIES[id])
			expect(`${id} après la mort → ${refus.ok === false && refus.refus}`).toBe(`${id} après la mort → combat_en_cours`)
		}
	})

	it('commandes apres victoire, dossier a fins neutralisees : toute issue qui RETIRE combat rend les commandes', () => {
		// À L'INVERSE DE LA MORT, toute issue qui RETIRE `combat` rend les commandes — sans quoi une
		// partie gagnée serait bloquée aussi sûrement qu'une partie perdue. MAIS le dossier de référence
		// porte une fin que ces clôtures rendent vraie (`fin.vigie-abandonnee`, n° 15 `moteur-fins`,
		// it1) : le témoin de reprise se joue donc sur le MÊME dossier, ses fins NEUTRALISÉES, et le
		// discriminant — le dossier entier, la même clôture — est écrit juste après, dans le MÊME test.
		const dossier = lire(CHEMIN_REFERENCE)
		const sansFins = lire(CHEMIN_REFERENCE)
		sansFins.charpente.fins = []
		const { enCombat } = situation(dossier)
		const BILAN = { pv: 9, pe: 1, xp: 3, pv_max_delta: 0, pe_max_delta: 0 }

		for (const issue of ['hero-victory', 'monster-fled', 'hero-survived-unconscious'] as const) {
			const close = cloreCombat(enCombat, { issue, ...BILAN })
			expect(`${issue} → combat ${'combat' in close}`).toBe(`${issue} → combat false`)
			for (const id of Object.keys(COMMANDES) as CommandeId[]) {
				expect(`${issue} / ${id} → ${executer(sansFins, close, SAISIES[id]).ok}`).toBe(`${issue} / ${id} → true`)

				// DISCRIMINANT : la même session close, le dossier ENTIER — la fin est atteinte, la partie
				// est terminée, et ce n'est PLUS `combat_en_cours` (le combat est retiré).
				const terminee = executer(dossier, close, SAISIES[id])
				expect(`${issue} / ${id} → ${terminee.ok === false && terminee.refus}`).toBe(
					`${issue} / ${id} → partie_terminee`,
				)
			}
		}
	})
})

/**
 * `partie_terminee` (n° 15 `moteur-fins`, it1, lot `contrat`) — CRITÈRE 4 DU PLAN : tant que
 * `finAtteinte(dossier, session)` rend un résultat, AUCUNE commande n'est acceptée. SECONDE garde
 * d'`executerCommande`, après `combat_en_cours`, avant `TRANSITIONS`.
 *
 * MÊME FORME QUE LE DESCRIBE DU COMBAT, ET POUR LA MÊME RAISON : les verbes sont BALAYÉS depuis
 * `COMMANDES`, jamais trois littéraux — un verbe de plus est refusé sans qu'on y pense, et ce
 * témoin rougit tant qu'on ne lui a pas écrit sa saisie (`Record<CommandeId, …>` exhaustif).
 *
 * LA PARTIE TERMINÉE EST FABRIQUÉE PAR LE PRODUIT, jamais forgée : la rencontre de l'embuscade
 * consomme son événement à l'ouverture du combat, la victoire retire `combat`, et c'est ALORS que
 * `fin.vigie-abandonnee` (événement consommé ET vigie du nord jamais visitée) devient vraie sur
 * `dossier-reference.json`.
 */
describe('executerCommande, partie_terminee (n 15 moteur-fins, it1)', () => {
	const RENCONTRE = { evenement_id: 'evenement.embuscade-a-la-tour', monstre_ref: 'bestiaire.squelette' }
	const BILAN = { pv: 9, pe: 1, xp: 3, pv_max_delta: 0, pe_max_delta: 0 }
	const MESSAGE = "La partie est terminée : aucune commande n'est acceptée."
	const FIN = 'fin.vigie-abandonnee'
	/** Un nœud que l'évaluateur ne reconnaît pas : le LIRE, c'est LEVER (KR-238). */
	const POISON = { op: 'xor' } as unknown as ExprNode

	/** Une saisie ACCEPTABLE par verbe depuis `lieu.foyer-du-guet` — même table que la garde du combat. */
	const SAISIES: Record<CommandeId, string> = {
		aller: 'ALLER lieu.marche-des-cendres',
		agir: 'AGIR',
		parler: 'PARLER pnj.harek-le-forgeron',
	}

	/** Vrai si l'appel LÈVE — `expect(...).toThrow()` ne se compose pas dans une chaîne nommée. */
	function leve(appel: () => unknown): boolean {
		try {
			appel()
			return false
		} catch {
			return true
		}
	}

	/** Le dossier de référence, ses fins NEUTRALISÉES — le témoin « sans fin » des discriminants. */
	function sansFins(): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		dossier.charpente.fins = []
		return dossier
	}

	/** Le héros au repos, le MÊME héros en combat, puis la partie TERMINÉE — toutes par le produit. */
	function situation(dossier: Dossier): { auRepos: EtatSession; enCombat: EtatSession; terminee: EtatSession } {
		const auRepos = fixerHeros(ouverture(dossier), heroAvec(2))
		const enCombat = resoudreRencontre(auRepos, RENCONTRE)
		return { auRepos, enCombat, terminee: cloreCombat(enCombat, { issue: 'hero-victory', ...BILAN }) }
	}

	it('partie_terminee pour chaque verbe de COMMANDES apres fin — et chaque verbe est accepte sans fin', () => {
		const dossier = lire(CHEMIN_REFERENCE)
		const { auRepos, terminee } = situation(dossier)

		// TOTALITÉ : une saisie par verbe du registre, ni plus ni moins.
		expect(Object.keys(SAISIES).sort()).toEqual(Object.keys(COMMANDES).sort())
		// L'ÉTAT : aucun combat, une fin atteinte — et RIEN avant le combat.
		expect('combat' in terminee).toBe(false)
		expect(finAtteinte(dossier, terminee)?.fin_id).toBe(FIN)
		expect(finAtteinte(dossier, auRepos)).toBeUndefined()

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			// DISCRIMINANT : la même saisie, la même fixture, SANS fin atteinte, est acceptée.
			expect(`${id} sans fin → ${executer(dossier, auRepos, SAISIES[id]).ok}`).toBe(`${id} sans fin → true`)

			const refus = executer(dossier, terminee, SAISIES[id])
			expect(`${id} après la fin → ${refus.ok === false && refus.refus}`).toBe(`${id} après la fin → partie_terminee`)
			expect(messageDe(refus)).toBe(MESSAGE)
		}
	})

	it('le refus passe APRES combat_en_cours et AVANT acces_absent, cible_inconnue et cible_indisponible', () => {
		// UN REFUS PAR CAUSE, chacun avec son refus HABITUEL sans fin (le discriminant) puis
		// `partie_terminee` avec : sans cette moitié, « toujours partie_terminee » serait vert sur un
		// moteur qui n'aurait plus aucun autre refus. Et la garde est bien SOUS `combat_en_cours`.
		const dossier = lire(CHEMIN_REFERENCE)
		const { auRepos, enCombat, terminee } = situation(dossier)
		const AUTRES_REFUS = [
			['ALLER lieu.crypte-scellee', 'acces_absent'],
			['PARLER pnj.fantome', 'cible_inconnue'],
			['PARLER pnj.selene-la-vigie', 'cible_indisponible'],
		] as const

		for (const [saisie, habituel] of AUTRES_REFUS) {
			const sans = executer(dossier, auRepos, saisie)
			expect(`${saisie} sans fin → ${sans.ok === false && sans.refus}`).toBe(`${saisie} sans fin → ${habituel}`)

			const apres = executer(dossier, terminee, saisie)
			expect(`${saisie} après la fin → ${apres.ok === false && apres.refus}`).toBe(
				`${saisie} après la fin → partie_terminee`,
			)
			expect(messageDe(apres)).toBe(MESSAGE)

			// `combat_en_cours` PASSE DEVANT : la même saisie sous combat n'est jamais `partie_terminee`.
			const sous = executer(dossier, enCombat, saisie)
			expect(`${saisie} sous combat → ${sous.ok === false && sous.refus}`).toBe(
				`${saisie} sous combat → combat_en_cours`,
			)
		}
	})

	it('un refus ne consomme AUCUN pas : session intacte, horloge, journal, monde, jalons', () => {
		// MÊME PREUVE QUE LA GARDE DU COMBAT : le bras `{ ok: false }` ne porte pas de session, donc la
		// propriété se prouve sur l'ARGUMENT. ET LE DOSSIER EST MONTÉ POUR QU'UN JALON PARTE SI LA PASSE
		// TOURNAIT : sans cela, le silence serait celui d'un dossier sans jalon déclenchable.
		const declenchable = (dossier: Dossier): string => {
			const jalon = dossier.charpente.jalons.find((candidat) => candidat.declencheur_expr !== undefined)
			if (jalon === undefined) throw new Error('fixture : plus aucun jalon à `declencheur_expr`')
			jalon.declencheur_expr = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.foyer-du-guet'] }
			return jalon.id
		}
		const dossier = lire(CHEMIN_REFERENCE)
		const jalonId = declenchable(dossier)

		const { terminee } = situation(lire(CHEMIN_REFERENCE))
		const avant = JSON.stringify(terminee)

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			expect(`${id} → ${executer(dossier, terminee, SAISIES[id]).ok}`).toBe(`${id} → false`)
		}
		expect(JSON.stringify(terminee)).toBe(avant)
		expect(terminee.monde.jalons_atteints).toEqual([])
		expect(terminee.horloge.tour).toBe(0)
		expect(terminee.journal).toEqual([])

		// DISCRIMINANT, DANS LE MÊME TEST : sans fin, la même commande est acceptée ET le même jalon
		// part — la passe est bien branchée, et c'est la fin qui la coupe.
		const sans = sansFins()
		declenchable(sans)
		const accepte = sessionDe(executer(sans, terminee, 'AGIR'))
		expect(accepte.monde.jalons_atteints).toEqual([jalonId])
		expect(accepte.horloge.tour).toBe(1)
	})

	it('la commande qui AMENE la fin est acceptee ; la suivante est refusee — la garde lit la session d ENTREE', () => {
		// UNE FIN QUE LE PRODUIT ATTEINT PAR UNE COMMANDE : `fin.vigie-sauvee` est réécrite pour dépendre
		// du seul lieu visité. Elle est fausse à l'ouverture, vraie après `ALLER lieu.tour-effondree`.
		const dossier = lire(CHEMIN_REFERENCE)
		dossier.charpente.fins = [
			{
				...dossier.charpente.fins[0],
				condition_expr: { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.tour-effondree'] },
			},
		]
		const depart = ouverture(dossier)
		expect(finAtteinte(dossier, depart)).toBeUndefined()

		// La commande qui produit la fin n'est PAS refusée, elle tick comme toute autre : un pas, ses
		// deux lignes de journal. C'est la commande SUIVANTE qui est refusée.
		const arrivee = sessionDe(executer(dossier, depart, 'ALLER lieu.tour-effondree'))
		expect(arrivee.horloge.tour).toBe(1)
		expect(arrivee.journal).toHaveLength(2)
		expect(finAtteinte(dossier, arrivee)?.fin_id).toBe('fin.vigie-sauvee')

		const suivante = executer(dossier, arrivee, 'AGIR')
		expect(suivante.ok === false && suivante.refus).toBe('partie_terminee')
		// DISCRIMINANT : la même commande, depuis l'état d'AVANT la fin, est acceptée.
		expect(executer(dossier, depart, 'AGIR').ok).toBe(true)
	})

	it('une condition de fin inconnue LEVE a chaque commande, nue et sous une negation — sauf sous combat (KR-238)', () => {
		// MÊME RÉGIME QUE LA PASSE DES JALONS, et la docstring d'`executerCommande` l'écrit : la garde
		// évalue les fins AVANT `TRANSITIONS`, donc elle lève aussi sur une commande qui aurait été
		// refusée plus bas. MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : envelopper `finAtteinte` d'un
		// `try/catch` qui rend `undefined` — sous un `non`, le repli ferait ATTEINDRE une fin à tort.
		const { auRepos, enCombat } = situation(lire(CHEMIN_REFERENCE))

		for (const condition of [POISON, { op: 'non', enfant: POISON } as ExprNode]) {
			const dossier = lire(CHEMIN_REFERENCE)
			dossier.charpente.fins[0].condition_expr = condition

			for (const id of Object.keys(COMMANDES) as CommandeId[]) {
				expect(`${id} → ${leve(() => executer(dossier, auRepos, SAISIES[id]))}`).toBe(`${id} → true`)
			}
			// Une commande qui aurait été REFUSÉE PLUS BAS lève elle aussi : la garde passe devant.
			expect(leve(() => executer(dossier, auRepos, 'ALLER lieu.crypte-scellee'))).toBe(true)
			// SOUS COMBAT, RIEN N'EST LU : `combat_en_cours` tombe avant, et ne lève pas.
			expect(leve(() => executer(dossier, enCombat, 'AGIR'))).toBe(false)
		}

		// DISCRIMINANCE : la même saisie refusée, sur le dossier SAIN, ne lève pas.
		expect(leve(() => executer(lire(CHEMIN_REFERENCE), auRepos, 'ALLER lieu.crypte-scellee'))).toBe(false)
	})

	it('une fin sans texte ferme la partie comme une autre — le refus ne juge jamais la prose (KR-307)', () => {
		// `Fin.texte` est OPTIONNEL (KR-191) : son absence — ou son vide — n'ouvre PAS la porte. Le repli à
		// afficher est l'affaire de l'écran de fin ; la garde, elle, ne lit que le fait « une fin est atteinte ».
		for (const texte of [undefined, '', '   ']) {
			const dossier = lire(CHEMIN_REFERENCE)
			for (const fin of dossier.charpente.fins) {
				if (texte === undefined) delete fin.texte
				else fin.texte = texte
			}
			const { auRepos, terminee } = situation(dossier)
			const etiquette = JSON.stringify(texte ?? null)

			expect(`${etiquette} → ${finAtteinte(dossier, terminee)?.fin_id}`).toBe(`${etiquette} → ${FIN}`)
			for (const id of Object.keys(COMMANDES) as CommandeId[]) {
				const refus = executer(dossier, terminee, SAISIES[id])
				expect(`${etiquette} / ${id} → ${refus.ok === false && refus.refus}`).toBe(
					`${etiquette} / ${id} → partie_terminee`,
				)
				// DISCRIMINANT : avant la fin, le même dossier accepte la commande.
				expect(`${etiquette} / ${id} avant → ${executer(dossier, auRepos, SAISIES[id]).ok}`).toBe(
					`${etiquette} / ${id} avant → true`,
				)
			}
		}
	})

	it('une fin sans condition_expr ne ferme jamais la partie — meme avec un texte', () => {
		// Absence de condition = état calme (`types.ts`), jamais une fin « toujours atteinte ».
		const dossier = lire(CHEMIN_REFERENCE)
		for (const fin of dossier.charpente.fins) delete fin.condition_expr
		expect(dossier.charpente.fins.every((fin) => fin.texte !== undefined)).toBe(true)

		const { terminee } = situation(dossier)
		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			expect(`${id} → ${executer(dossier, terminee, SAISIES[id]).ok}`).toBe(`${id} → true`)
		}
	})
})

/**
 * LA COUTURE DE L'HORLOGE DES PNJ (n° 14 `moteur-horloge`, it1, lot `contrat`,
 * `docs/REGLES-PLAY.md` § J2) : le bras `ok` d'`executerCommande` rend
 * `tickHorloge(dossier, avecJalonsResolus(dossier, résultat.session))`. Ce que `horloge.test.ts`
 * prouve du TICK lui-même n'est pas redit ici — seulement ce que la COUTURE doit tenir : le tick
 * ne tourne ni sur un refus, ni sous un combat ; il tourne sur les faits d'APRÈS les jalons ; et
 * il lève, sans `catch`, sur une condition de plan inconnue (KR-238).
 *
 * « LE TICK N'A PAS TOURNÉ » SE PROUVE PAR UN POISON, JAMAIS PAR UN COMPTEUR D'APPELS : le plan
 * de Harek porte une étape dont la condition est un nœud inconnu, que `evaluerExpr` LÈVE à la
 * moindre lecture (KR-238). Une commande qui n'atteint pas le tick ne lève donc pas — et la même
 * session, une commande ACCEPTÉE, lève : c'est le discriminant, dans le MÊME test, qui prouve que
 * le poison est bien atteint quand le tick tourne (KR-197/202). Un espion sur un import de module
 * prouverait un appel, pas l'absence d'effet, et se casserait à la prochaine réécriture d'import.
 */
describe('executerCommande, la couture de l horloge des PNJ (n 14 moteur-horloge, it1)', () => {
	const HAREK = 'pnj.harek-le-forgeron'
	const FOYER_VISITE: ExprNode = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.foyer-du-guet'] }
	/** Un nœud que l'évaluateur ne reconnaît pas : le LIRE, c'est LEVER. */
	const POISON = { op: 'xor' } as unknown as ExprNode

	function etape(declencheur?: ExprNode): PlanAction {
		return {
			etape: 1,
			action: 'Intention de l’étape.',
			...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
		}
	}

	/** Le dossier de référence, le SEUL plan de Harek remplacé — rien d'autre ne bouge. */
	function avecPlanDeHarek(plan: PlanAction[]): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		const harek = dossier.monde.personnages.find((personnage) => personnage.id === HAREK)
		if (harek === undefined) throw new Error('fixture : Harek a disparu du dossier de référence')
		harek.plan_actions = plan
		return dossier
	}

	/** Vrai si l'appel LÈVE — `expect(...).toThrow()` ne se compose pas dans une chaîne nommée. */
	function leve(appel: () => unknown): boolean {
		try {
			appel()
			return false
		} catch {
			return true
		}
	}

	it('un refus ne tick pas : le poison ne leve pas sur un refus, et leve sur la meme session des qu une commande est acceptee', () => {
		const dossier = avecPlanDeHarek([etape(), etape(POISON)])
		const depart = ouverture(dossier)
		const avant = JSON.stringify(depart)

		// UN REFUS PAR CAUSE DE RÉSOLUTION, chacun avec son code : sans le code, « ne leve
		// pas » serait vert sur n'importe quelle commande qui échouerait ailleurs.
		const REFUS = [
			['ALLER lieu.crypte-scellee', 'acces_absent'],
			['PARLER pnj.fantome', 'cible_inconnue'],
			['PARLER pnj.selene-la-vigie', 'cible_indisponible'],
		] as const
		for (const [saisie, refus] of REFUS) {
			expect(`${saisie} → ${leve(() => executer(dossier, depart, saisie))}`).toBe(`${saisie} → false`)
			const resultat = executer(dossier, depart, saisie)
			expect(`${saisie} → ${resultat.ok === false && resultat.refus}`).toBe(`${saisie} → ${refus}`)
		}
		// La session d'entrée est intacte : ni pas, ni ligne, ni `etape_plan`.
		expect(JSON.stringify(depart)).toBe(avant)
		expect(depart.monde.pnj).toEqual({})

		// DISCRIMINANT, DANS LE MÊME TEST : une commande ACCEPTÉE sur la MÊME session atteint le
		// tick, et le poison lève — ce qui prouve que le silence ci-dessus est celui d'un tick
		// qui n'a pas tourné, pas celui d'un plan que rien ne lirait jamais.
		expect(leve(() => executer(dossier, depart, 'AGIR'))).toBe(true)
	})

	it('combat_en_cours est refuse AVANT tout tick : chaque verbe, poison en place, et le meme poison leve sans combat (KR-295)', () => {
		const dossier = avecPlanDeHarek([etape(), etape(POISON)])
		const auRepos = fixerHeros(ouverture(dossier), heroAvec(2))
		const enCombat = resoudreRencontre(auRepos, {
			evenement_id: 'evenement.embuscade-a-la-tour',
			monstre_ref: 'bestiaire.squelette',
		})
		expect(enCombat.combat).toBeDefined()
		const SAISIES: Record<CommandeId, string> = {
			aller: 'ALLER lieu.marche-des-cendres',
			agir: 'AGIR',
			parler: `PARLER ${HAREK}`,
		}
		expect(Object.keys(SAISIES).sort()).toEqual(Object.keys(COMMANDES).sort())

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			expect(`${id} → ${leve(() => executer(dossier, enCombat, SAISIES[id]))}`).toBe(`${id} → false`)
			const resultat = executer(dossier, enCombat, SAISIES[id])
			expect(`${id} → ${resultat.ok === false && resultat.refus}`).toBe(`${id} → combat_en_cours`)
			// DISCRIMINANT, PAR VERBE : sans combat, la même saisie atteint le tick et lève.
			expect(`${id} sans combat → ${leve(() => executer(dossier, auRepos, SAISIES[id]))}`).toBe(
				`${id} sans combat → true`,
			)
		}
		// Un combat n'ajoute AUCUN pas, et rien ne s'écrit sous lui (KR-295).
		expect(enCombat.horloge.tour).toBe(0)
		expect(enCombat.monde.pnj).toEqual({})
	})

	it('le tick tourne sur les faits d APRES les jalons : une condition que SEUL un jalon rend vraie avance au MEME pas, apres sa ligne', () => {
		// `jalon.premiere-vigie` se déclenche sur `lieu_visite(lieu.vigie-du-nord)`, atteignable
		// en DEUX pas. L'étape B de Harek n'attend que ce jalon : évaluée AVANT la passe, sa
		// condition serait fausse au pas 2 et n'avancerait qu'au pas 3.
		const dossier = avecPlanDeHarek([
			etape(),
			etape({ op: 'predicat', predicat: 'jalon_atteint', cibles: ['jalon.premiere-vigie'] }),
		])
		const pas1 = sessionDe(executer(dossier, ouverture(dossier), 'ALLER lieu.tour-effondree'))
		// L'ÉTAT SÉPARATEUR : rien n'est atteint, rien n'avance, tant que la vigie n'est pas visitée.
		expect(pas1.monde.jalons_atteints).toEqual([])
		expect(pas1.monde.pnj).toEqual({})
		expect(pas1.journal).toHaveLength(2)

		const pas2 = sessionDe(executer(dossier, pas1, 'ALLER lieu.vigie-du-nord'))

		expect(pas2.monde.jalons_atteints).toEqual(['jalon.premiere-vigie'])
		expect(pas2.monde.pnj[HAREK]).toEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 2 } })
		// CINQ lignes pour ce pas, TOUTES au tour 2 — le tick n'ajoute jamais un pas — et les
		// lignes du tick sont les DERNIÈRES : après la demande, son effet, et le jalon. Corvin
		// (qui précède Harek dans `monde.personnages[]`) voit sa `duree: 2` tomber à ce pas
		// (n° 14 it3) : son constat PRÉCÈDE l'avancement de Harek, dans l'ordre du document.
		expect(pas2.horloge.tour).toBe(2)
		expect(pas2.journal.slice(2).map((ligne) => [ligne.tour, ligne.texte])).toEqual([
			[2, '> ALLER lieu.vigie-du-nord'],
			[2, 'lieu_courant : lieu.tour-effondree → lieu.vigie-du-nord'],
			[2, 'jalons_atteints : jalon.premiere-vigie'],
			[2, 'etape_bloquee : pnj.corvin-le-marchand 1'],
			[2, `etape_plan : ${HAREK} 2`],
		])
		// Et chaque ligne du tick ne porte AUCUNE des clés des lignes qui la précèdent.
		expect(Object.keys(pas2.journal[5]).sort()).toEqual(['role', 'texte', 'tour'])
		expect(Object.keys(pas2.journal[6]).sort()).toEqual(['role', 'texte', 'tour'])
	})

	it('une condition de plan inconnue LEVE sur une commande acceptee, nue et sous une negation — jamais un faux positif (KR-238)', () => {
		// MUTANT NOMMÉ, À ÉCRIRE PUIS RÉVOQUER : envelopper l'appel du tick d'un `try/catch`
		// qui rend la session d'avant. Sous un `non`, le repli en `false` ferait AVANCER le
		// personnage — un faux positif sur une étape de plan, que la couche s'interdit.
		for (const condition of [POISON, { op: 'non', enfant: POISON } as ExprNode]) {
			const dossier = avecPlanDeHarek([etape(), etape(condition)])
			expect(leve(() => executer(dossier, ouverture(dossier), 'AGIR'))).toBe(true)
		}
		// DISCRIMINANCE : le même plan, valide, ne lève pas et avance.
		const sain = avecPlanDeHarek([etape(), etape(FOYER_VISITE)])
		expect(sessionDe(executer(sain, ouverture(sain), 'AGIR')).monde.pnj[HAREK]?.etape_plan).toEqual({
			rang: 1,
			depuis: 1,
		})
	})

	it('couture depuis : un avancement ecrit le pas de la commande ACCEPTEE qui le provoque, un refus ne decale rien, et un pas sans avancement n y touche pas (KR-298)', () => {
		// `depuis` vaut `horloge.tour` D'APRÈS la commande : le tick reçoit la session que la
		// transition vient de faire avancer d'un pas. Un tick branché sur la session d'AVANT la
		// commande écrirait `3` au lieu de `4` — c'est ce que ce test sépare. Les valeurs sont
		// toutes DISTINCTES (`rang` 1, `depuis` 4, pas précédent 3, pas suivant 5) : aucune
		// coïncidence `depuis === rang + 1` ni `depuis === 0` ne peut passer pour la bonne.
		const VIGIE_VISITEE: ExprNode = { op: 'predicat', predicat: 'lieu_visite', cibles: ['lieu.vigie-du-nord'] }
		const dossier = avecPlanDeHarek([etape(), etape(VIGIE_VISITEE)])

		const pas1 = sessionDe(executer(dossier, ouverture(dossier), 'AGIR'))
		// UN REFUS ne consomme aucun pas, et n'écrit rien : le pas suivant est le DEUXIÈME.
		const refus = executer(dossier, pas1, 'ALLER lieu.crypte-scellee')
		expect(refus.ok).toBe(false)
		const pas2 = sessionDe(executer(dossier, pas1, 'AGIR'))
		const pas3 = sessionDe(executer(dossier, pas2, 'ALLER lieu.tour-effondree'))
		// Avant l'avancement : aucune entrée, donc aucun `depuis`.
		expect(pas3.horloge.tour).toBe(3)
		expect(pas3.monde.pnj).toEqual({})

		const pas4 = sessionDe(executer(dossier, pas3, 'ALLER lieu.vigie-du-nord'))
		expect(pas4.horloge.tour).toBe(4)
		expect(pas4.monde.pnj[HAREK]).toStrictEqual({ a_dit: [], etape_plan: { rang: 1, depuis: 4 } })
		expect(pas4.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(pas4.horloge.tour)
		// La ligne du tick est au MÊME pas : `depuis` n'est pas un `+1`.
		expect(pas4.journal[pas4.journal.length - 1]).toEqual({
			tour: 4,
			role: 'moteur',
			texte: `etape_plan : ${HAREK} 2`,
		})

		// Un pas SANS avancement (Harek est au dernier rang) : l'entrée est RENDUE TELLE QUELLE,
		// même référence — `depuis` reste `4`, il ne suit pas l'horloge.
		const pas5 = sessionDe(executer(dossier, pas4, 'AGIR'))
		expect(pas5.horloge.tour).toBe(5)
		expect(pas5.monde.pnj[HAREK]).toBe(pas4.monde.pnj[HAREK])
		expect(pas5.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(4)
	})
})

/**
 * `climat_actif` TRAVERSE CHAQUE VERBE (n° 14 `moteur-horloge`, it4, lot `contrat`, critère 3) :
 * les trois transitions écrivent `horloge` EN CONSERVANT ses autres clés
 * (`{ ...session.horloge, tour }`). Sans le spread, le premier pas suivant l'activation
 * effacerait le climat en silence — sans qu'aucune ligne `climat_eteint` ne le dise.
 *
 * LE CLIMAT EST ALLUMÉ PAR LE PRODUIT, jamais forgé : la fixture de référence porte déjà
 * `evenement.rumeur-sans-origine` → `climat.cendres-tenaces` (durée 6), et ce test lui pose une
 * condition vraie à l'ouverture. Un climat forgé à la main prouverait la conservation sur un état
 * que le moteur ne sait peut-être pas écrire.
 */
describe('executerCommande, climat_actif traverse chaque verbe — le spread de l horloge (n 14 it4)', () => {
	const SAISIES: Record<CommandeId, string> = {
		aller: 'ALLER lieu.marche-des-cendres',
		agir: 'AGIR',
		parler: 'PARLER pnj.harek-le-forgeron',
	}

	/** Le dossier de référence, dont l'événement de climat est dû dès l'ouverture — un seul champ muté. */
	function dossierQuiAllume(): Dossier {
		const dossier = lire(CHEMIN_REFERENCE)
		const rumeur = dossier.monde.evenements.find((evenement) => evenement.id === 'evenement.rumeur-sans-origine')
		if (rumeur === undefined) throw new Error('la fixture de référence ne porte plus son événement de climat')
		rumeur.declencheur_expr = { op: 'predicat', predicat: 'lieu_courant_est', cibles: ['lieu.foyer-du-guet'] }
		return dossier
	}

	it('chaque verbe du registre conserve climat_actif, MEME reference — et n ecrit aucune ligne d extinction', () => {
		const dossier = dossierQuiAllume()
		// TOTALITÉ : une saisie par verbe du registre, ni plus ni moins.
		expect(Object.keys(SAISIES).sort()).toEqual(Object.keys(COMMANDES).sort())

		// Le climat s'allume au PREMIER pas accepté — l'ouverture n'a pas de tick (§ J3).
		const ouverte = ouverture(dossier)
		expect('climat_actif' in ouverte.horloge).toBe(false)
		const allume = sessionDe(executer(dossier, ouverte, 'AGIR'))
		expect(allume.horloge).toEqual({ tour: 1, climat_actif: { id: 'climat.cendres-tenaces', depuis: 1 } })

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			const apres = sessionDe(executer(dossier, allume, SAISIES[id]))

			expect(`${id} → tour ${apres.horloge.tour}`).toBe(`${id} → tour 2`)
			// `toBe` : la référence de `climat_actif` est celle d'AVANT, pas une copie recomposée.
			expect(apres.horloge.climat_actif).toBe(allume.horloge.climat_actif)
			// 2 − 1 = 1 < 6 : le climat n'est pas échu, aucune ligne d'extinction n'explique la conservation.
			expect(apres.journal.some((ligne) => ligne.texte.startsWith('climat_eteint'))).toBe(false)
		}
	})

	it('un climat echu s eteint au meme pas que le verbe — la conservation est celle de la cle, pas un oubli d extinction', () => {
		// DISCRIMINANT, DANS LE MÊME TEST : sans lui, « la clé survit » serait vrai d'un moteur qui
		// n'éteindrait jamais. Même état, durée ramenée à 1 : `2 − 1 >= 1`, la clé disparaît.
		const dossier = dossierQuiAllume()
		dossier.monde.conditions.climat[0].duree = 1
		const allume = sessionDe(executer(dossier, ouverture(dossier), 'AGIR'))
		expect(allume.horloge.climat_actif).toEqual({ id: 'climat.cendres-tenaces', depuis: 1 })

		for (const id of Object.keys(COMMANDES) as CommandeId[]) {
			const apres = sessionDe(executer(dossier, allume, SAISIES[id]))

			expect(`${id} → ${'climat_actif' in apres.horloge}`).toBe(`${id} → false`)
			expect(apres.horloge.tour).toBe(2)
		}
	})
})
