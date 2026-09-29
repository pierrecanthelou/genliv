import fs from 'node:fs'
import path from 'node:path'
import { SESSION_SATUREE } from './__fixtures__/session-saturee'
import { analyserSaisie, executerCommande } from './commandes'
import { consignerRecit } from './recit'
import { ouvrirSession, type EtatSession } from './session'
import type { Dossier } from './types'

/**
 * `consignerRecit` — LA SEULE PORTE D'ÉCRITURE DE `EntreeJournal.recit` (n° 10 it2).
 *
 * LES SESSIONS SONT PRODUITES PAR LE MOTEUR, jamais forgées (précédent
 * `commandes.test.ts`) : une session écrite à la main pour arriver à l'état voulu
 * prouverait la propriété sur un état que le produit ne sait peut-être pas atteindre.
 * Le SCÉNARIO SÉPARATEUR est mesuré dans `dossier-reference.json` : le second pas
 * (`lieu.vigie-du-nord`) franchit `jalon.premiere-vigie`, et la passe des jalons place
 * une entrée de jalon APRÈS l'entrée d'`origine`, au MÊME `tour`. Une implémentation
 * « dernière entrée du pas » y écrirait le récit sur la conséquence de règle.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '__fixtures__', 'dossier-reference.json')

function lire(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

/** Joue une suite de saisies console par le produit lui-même — l'échec est NOMMÉ. */
function jouer(dossier: Dossier, depart: EtatSession, saisies: readonly string[]): EtatSession {
	return saisies.reduce((session, saisie) => {
		const analyse = analyserSaisie(saisie)
		if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
		const resultat = executerCommande(dossier, session, analyse.commande)
		if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
		return resultat.session
	}, depart)
}

const RECIT = 'Vous gravissez les derniers degres ; le feu de la vigie vous brule les yeux.'

describe('consignerRecit — ecrit sur l entree a origine, et sur elle seule', () => {
	it('scenario a jalons : le recit va sur l entree d origine, jamais sur l entree de jalon qui la SUIT', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'])

		// L'ÉTAT SÉPARATEUR, constaté et non supposé : le pas courant porte TROIS entrées,
		// et la DERNIÈRE est celle du jalon, sans `origine`.
		const duPas = s1.journal.filter((entree) => entree.tour === s1.horloge.tour)
		expect(duPas.map((entree) => [entree.role, entree.origine ?? null, entree.deltas !== undefined])).toEqual([
			['joueur', null, false],
			['moteur', 'aller', false],
			['moteur', null, true],
		])

		const s2 = consignerRecit(s1, s1.horloge.tour, RECIT)

		expect(s2.journal[3]).toEqual({ ...s1.journal[3], recit: RECIT })
		expect(s2.journal[3].origine).toBe('aller')
		// L'ENTRÉE DE JALON — la dernière du pas — n'a PAS de récit : pas « présent et
		// indéfini », ABSENT. C'est la ligne qu'une implémentation « dernière entrée »
		// ferait rougir.
		expect('recit' in s2.journal[4]).toBe(false)
		expect(s2.journal[4]).toBe(s1.journal[4])
		// Au plus UN récit par pas, et l'invariant `recit ⇒ origine` tient.
		expect(s2.journal.filter((entree) => entree.recit !== undefined)).toHaveLength(1)
		expect(s2.journal.every((entree) => entree.recit === undefined || entree.origine !== undefined)).toBe(true)
	})

	it('seules la session, la liste du journal et l entree porteuse sont neuves — tout le reste garde son identite', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree', 'ALLER lieu.vigie-du-nord'])
		const avant = JSON.stringify(s1)

		const s2 = consignerRecit(s1, s1.horloge.tour, RECIT)

		expect(s2).not.toBe(s1)
		expect(s2.journal).not.toBe(s1.journal)
		expect(s2.journal[3]).not.toBe(s1.journal[3])
		// PAR RÉFÉRENCE, jamais par égalité : une copie égale du monde serait une seconde
		// source que rien ne resynchronise (KR-013).
		expect(s2.monde).toBe(s1.monde)
		expect(s2.horloge).toBe(s1.horloge)
		const autres = s1.journal.map((entree, rang) => [entree, rang] as const).filter(([, rang]) => rang !== 3)
		expect(autres.every(([entree, rang]) => s2.journal[rang] === entree)).toBe(true)
		expect(autres).toHaveLength(s1.journal.length - 1)
		// ET L'ARGUMENT EST INTACT — pureté mesurée, pas affirmée (KR-169).
		expect(JSON.stringify(s1)).toBe(avant)
		expect(s1.journal.some((entree) => entree.recit !== undefined)).toBe(false)
	})

	it('un pas agir recoit son recit sur son entree moteur, comme un pas aller', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['AGIR'])

		const s2 = consignerRecit(s1, 1, RECIT)

		expect(s2.journal).toEqual([
			{ tour: 1, role: 'joueur', texte: '> AGIR' },
			{ tour: 1, role: 'moteur', texte: 'lieu_courant : lieu.foyer-du-guet', origine: 'agir', recit: RECIT },
		])
		expect(s2.monde).toBe(s1.monde)
	})

	it('le recit du pas COURANT seulement : ceux des pas precedents ne sont jamais reecrits', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree'])
		const pas1 = consignerRecit(s1, 1, 'Un premier recit.')
		const s2 = jouer(dossier, pas1, ['AGIR'])

		const pas2 = consignerRecit(s2, 2, 'Un second recit.')

		expect(pas2.journal.map((entree) => entree.recit ?? null)).toEqual([
			null,
			'Un premier recit.',
			null,
			'Un second recit.',
		])
		// L'entrée du pas 1 est LA MÊME référence : elle n'a pas été reconstruite.
		expect(pas2.journal[1]).toBe(pas1.journal[1])
	})
})

describe('consignerRecit — la MEME reference quand il n y a rien a ecrire (trois cas, toBe)', () => {
	it('cas 1 — un tour qui n est pas le pas courant : perime ou a venir', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree', 'AGIR'])
		expect(s1.horloge.tour).toBe(2)

		// PÉRIMÉ — le pas 1 a une entrée à `origine` SANS récit : sans la garde d'horloge,
		// il en recevrait un. C'est ce qui fait de ce témoin un séparateur, pas un vide.
		expect(s1.journal.some((entree) => entree.tour === 1 && entree.origine !== undefined)).toBe(true)
		expect(consignerRecit(s1, 1, RECIT)).toBe(s1)
		// À VENIR.
		expect(consignerRecit(s1, 3, RECIT)).toBe(s1)
		// Discriminant : sur le pas COURANT, la même session reçoit bien le récit.
		expect(consignerRecit(s1, 2, RECIT)).not.toBe(s1)
	})

	it('cas 2 — aucune entree a origine pour ce pas : le tour zero, et un pas sans commande', () => {
		const dossier = lire()
		const s0 = ouverture(dossier)
		expect(s0.horloge.tour).toBe(0)
		expect(s0.journal).toEqual([])
		expect(consignerRecit(s0, 0, RECIT)).toBe(s0)

		// UN PAS DONT LES ENTRÉES N'ONT AUCUNE `origine` — état que le produit n'écrit pas
		// aujourd'hui, et que la fonction exportée doit pourtant traiter sans lever ni
		// poser un récit orphelin. Dérivé d'une session JOUÉE : seule l'`origine` est ôtée.
		const joue = jouer(dossier, s0, ['ALLER lieu.tour-effondree'])
		const sansOrigine: EtatSession = {
			...joue,
			journal: joue.journal.map((entree) => ({ tour: entree.tour, role: entree.role, texte: entree.texte })),
		}
		expect(consignerRecit(sansOrigine, 1, RECIT)).toBe(sansOrigine)
		// Discriminant : la MÊME session, `origine` gardée, reçoit le récit.
		expect(consignerRecit(joue, 1, RECIT)).not.toBe(joue)
	})

	it('cas 3 — l entree a origine porte DEJA un recit : le premier gagne, jamais ecrase', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['AGIR'])
		const premier = consignerRecit(s1, 1, 'Le recit que le joueur a lu.')

		const second = consignerRecit(premier, 1, 'Un recit tardif.')

		expect(second).toBe(premier)
		expect(second.journal[1].recit).toBe('Le recit que le joueur a lu.')
	})
})

describe('la fixture saturee enseigne l invariant', () => {
	it('recit n y apparait que sur une entree a origine, et une seule fois', () => {
		// La fixture est LE MODÈLE que l'on recopie (sa docstring) : si elle violait
		// `recit ⇒ origine`, elle enseignerait la faute.
		const porteuses = SESSION_SATUREE.journal.filter((entree) => entree.recit !== undefined)
		expect(porteuses).toHaveLength(1)
		expect(porteuses[0].origine).toBeDefined()
		expect(SESSION_SATUREE.journal.every((entree) => entree.recit === undefined || entree.origine !== undefined)).toBe(
			true,
		)
	})
})
