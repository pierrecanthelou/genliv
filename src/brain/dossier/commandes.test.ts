import fs from 'node:fs'
import path from 'node:path'
import {
	COMMANDES,
	analyserSaisie,
	destinationsPossibles,
	executerCommande,
	type Commande,
	type CommandeDescripteur,
	type ResultatCommande,
	type ResultatSaisie,
} from './commandes'
import { ouvrirSession, type EtatSession } from './session'
import type { Dossier } from './types'

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
		expect(messageDe(vide)).toBe('Commande inconnue : «  ». Commandes disponibles : ALLER.')

		const horsRegistre = analyserSaisie('SAUTER lieu.x')
		expect(horsRegistre.ok === false && horsRegistre.refus).toBe('verbe_inconnu')
		expect(messageDe(horsRegistre)).toBe('Commande inconnue : « SAUTER lieu.x ». Commandes disponibles : ALLER.')

		// UN SEUL GABARIT pour les deux refus d'analyse : une arité fautive est une
		// commande qu'on ne reconnaît pas.
		expect(messageDe(analyserSaisie('ALLER lieu.x lieu.y'))).toBe(
			'Commande inconnue : « ALLER lieu.x lieu.y ». Commandes disponibles : ALLER.',
		)
	})

	it('liste des verbes DERIVEE du registre — le second verbe fictif le prouve', () => {
		// AVEC UN SEUL VERBE, RIEN NE SÉPARE : une liste en dur `"… : ALLER."`
		// passerait toutes les lignes ci-dessus. Le mutant est donc OBLIGATOIRE — il
		// est la seule mesure du pouvoir séparateur (BUG-087).
		//
		// `defineRegistre` ne gèle rien (`identifiers.ts` : elle rend la carte telle
		// quelle), donc le registre est écrivable au runtime. C'est aussi pourquoi il
		// DOIT être révoqué : c'est un singleton de MODULE, et un registre pollué fait
		// un faux vert qui se propage aux tests suivants du même fichier.
		const registre = COMMANDES as unknown as Record<string, CommandeDescripteur>
		const SAISIE = 'ALER lieu.foret-noire'

		expect(messageDe(analyserSaisie(SAISIE))).toBe(
			'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER.',
		)

		try {
			registre.sauter = { label: 'saute', verbe: 'SAUTER', refKinds: ['lieu'] }

			expect(messageDe(analyserSaisie(SAISIE))).toBe(
				'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER, SAUTER.',
			)
			// Et le second verbe est RECONNU, arité comprise : la dérivation ne s'arrête
			// pas au message.
			expect(analyserSaisie('SAUTER lieu.x')).toEqual({
				ok: true,
				commande: { commande: 'sauter', cibles: ['lieu.x'] },
			})
		} finally {
			delete registre.sauter
		}

		// RÉVOCATION CONSTATÉE, jamais supposée.
		expect(Object.keys(COMMANDES)).toEqual(['aller'])
		expect(messageDe(analyserSaisie(SAISIE))).toBe(
			'Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER.',
		)
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

		// UNE SEULE ENTRÉE DE PLUS, ET ELLE PORTE LE MÊME `tour` QUE LA COMMANDE : une
		// conséquence enchaînée n'ajoute jamais un pas (§ J1).
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
		expect(etat.journal).toHaveLength(6)

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
