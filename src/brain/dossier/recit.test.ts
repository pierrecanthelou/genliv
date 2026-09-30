import fs from 'node:fs'
import path from 'node:path'
import { SESSION_SATUREE } from './__fixtures__/session-saturee'
import { analyserSaisie, executerCommande } from './commandes'
import { CADENCE, borneDeFenetre, pasACondenser } from './memoire'
import { consignerNarration } from './recit'
import { ouvrirSession, type EtatSession, type FaitEtabli } from './session'
import type { Dossier } from './types'

/**
 * `consignerNarration` — LA SEULE PORTE D'ÉCRITURE DE `EntreeJournal.recit` (n° 10 it2) ET
 * DE `EtatSession.memoire` (it3), EN UNE TRANSITION.
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

const agirNFois = (dossier: Dossier, depart: EtatSession, n: number): EtatSession =>
	jouer(
		dossier,
		depart,
		Array.from({ length: n }, () => 'AGIR'),
	)

const RECIT = 'Vous gravissez les derniers degres ; le feu de la vigie vous brule les yeux.'

/** L'apport d'un pas SANS mémoire — un récit, aucun fait, aucun résumé. */
const seul = (recit: string): { recit: string; faits_etablis: readonly FaitEtabli[] } => ({ recit, faits_etablis: [] })

const FAIT_FOYER: FaitEtabli = { fait: 'Le foyer garde une braise sous la cendre.', sur: ['lieu.foyer-du-guet'] }
const FAIT_SCEAU: FaitEtabli = {
	fait: 'Le sceau porte une fêlure.',
	sur: ['objet.sceau-de-cendre', 'lieu.foyer-du-guet'],
}

describe('consignerNarration — le recit s ecrit sur l entree a origine, et sur elle seule', () => {
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

		const s2 = consignerNarration(s1, s1.horloge.tour, seul(RECIT))

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

		const s2 = consignerNarration(s1, s1.horloge.tour, seul(RECIT))

		expect(s2).not.toBe(s1)
		expect(s2.journal).not.toBe(s1.journal)
		expect(s2.journal[3]).not.toBe(s1.journal[3])
		// PAR RÉFÉRENCE, jamais par égalité : une copie égale du monde serait une seconde
		// source que rien ne resynchronise (KR-013).
		expect(s2.monde).toBe(s1.monde)
		expect(s2.horloge).toBe(s1.horloge)
		// Sans fait ni résumé, la mémoire garde SA référence — ici `null` (I1).
		expect(s2.memoire).toBeNull()
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

		const s2 = consignerNarration(s1, 1, seul(RECIT))

		expect(s2.journal).toEqual([
			{ tour: 1, role: 'joueur', texte: '> AGIR' },
			{ tour: 1, role: 'moteur', texte: 'lieu_courant : lieu.foyer-du-guet', origine: 'agir', recit: RECIT },
		])
		expect(s2.monde).toBe(s1.monde)
	})

	it('le recit du pas COURANT seulement : ceux des pas precedents ne sont jamais reecrits', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree'])
		const pas1 = consignerNarration(s1, 1, seul('Un premier recit.'))
		const s2 = jouer(dossier, pas1, ['AGIR'])

		const pas2 = consignerNarration(s2, 2, seul('Un second recit.'))

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

describe('consignerNarration — la MEME reference quand il n y a rien a ecrire (trois cas, toBe)', () => {
	it('cas 1 — un pas qui n est pas le pas courant : perime ou a venir', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['ALLER lieu.tour-effondree', 'AGIR'])
		expect(s1.horloge.tour).toBe(2)
		const avecFait = { recit: RECIT, faits_etablis: [FAIT_FOYER] }

		// PÉRIMÉ — le pas 1 a une entrée à `origine` SANS récit : sans la garde d'horloge,
		// il en recevrait un. C'est ce qui fait de ce témoin un séparateur, pas un vide.
		expect(s1.journal.some((entree) => entree.tour === 1 && entree.origine !== undefined)).toBe(true)
		expect(consignerNarration(s1, 1, avecFait)).toBe(s1)
		// À VENIR.
		expect(consignerNarration(s1, 3, avecFait)).toBe(s1)
		// Discriminant : sur le pas COURANT, la même session reçoit bien le récit ET le fait.
		const courant = consignerNarration(s1, 2, avecFait)
		expect(courant).not.toBe(s1)
		expect(courant.memoire?.faits_etablis).toEqual([FAIT_FOYER])
	})

	it('cas 2 — aucune entree a origine pour ce pas : le tour zero, et un pas sans commande', () => {
		const dossier = lire()
		const s0 = ouverture(dossier)
		expect(s0.horloge.tour).toBe(0)
		expect(s0.journal).toEqual([])
		expect(consignerNarration(s0, 0, { recit: RECIT, faits_etablis: [FAIT_FOYER] })).toBe(s0)

		// UN PAS DONT LES ENTRÉES N'ONT AUCUNE `origine` — état que le produit n'écrit pas
		// aujourd'hui, et que la fonction exportée doit pourtant traiter sans lever ni
		// poser un récit orphelin. Dérivé d'une session JOUÉE : seule l'`origine` est ôtée.
		const joue = jouer(dossier, s0, ['ALLER lieu.tour-effondree'])
		const sansOrigine: EtatSession = {
			...joue,
			journal: joue.journal.map((entree) => ({ tour: entree.tour, role: entree.role, texte: entree.texte })),
		}
		expect(consignerNarration(sansOrigine, 1, seul(RECIT))).toBe(sansOrigine)
		// Discriminant : la MÊME session, `origine` gardée, reçoit le récit.
		expect(consignerNarration(joue, 1, seul(RECIT))).not.toBe(joue)
	})

	it('cas 3 — le pas porte DEJA un recit : la premiere narration gagne, pour le recit ET pour la memoire', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['AGIR'])
		const premier = consignerNarration(s1, 1, { recit: 'Le recit que le joueur a lu.', faits_etablis: [FAIT_FOYER] })

		const second = consignerNarration(premier, 1, { recit: 'Un recit tardif.', faits_etablis: [FAIT_SCEAU] })

		expect(second).toBe(premier)
		expect(second.journal[1].recit).toBe('Le recit que le joueur a lu.')
		// Un second appel n'ajoute AUCUN fait à un pas déjà raconté.
		expect(second.memoire?.faits_etablis).toEqual([FAIT_FOYER])
	})
})

describe('consignerNarration — la memoire, dans la MEME transition (it3)', () => {
	it('recit, faits et resume ecrits ENSEMBLE, en une seule session rendue', () => {
		// AU PAS 15 LA TRANCHE 1-10 EST DUE : c'est le seul état où un résumé est recevable.
		const dossier = lire()
		const s15 = agirNFois(dossier, ouverture(dossier), 15)
		expect(pasACondenser(s15)).toEqual({ de: 1, a: 10 })
		const resume = { texte: 'Vous avez veillé longtemps au foyer.', jusqu_au_pas: 10 }

		const s = consignerNarration(s15, 15, { recit: RECIT, faits_etablis: [FAIT_FOYER, FAIT_SCEAU], resume })

		expect(s.journal.filter((entree) => entree.recit !== undefined)).toHaveLength(1)
		expect(s.journal[s.journal.length - 1].recit).toBe(RECIT)
		expect(s.memoire).toEqual({ faits_etablis: [FAIT_FOYER, FAIT_SCEAU], resume })
		// Le résumé est ce que l'apport portait — PAR RÉFÉRENCE, aucune recopie.
		expect(s.memoire?.resume).toBe(resume)
		// Et plus rien n'est dû : le pointeur a avancé exactement à la borne haute de la tranche.
		expect(pasACondenser(s)).toBeNull()
		expect(s.monde).toBe(s15.monde)
		expect(s.horloge).toBe(s15.horloge)
	})

	it('I1 — sans fait ni resume, memoire reste null ; et quand rien d elle ne change, elle garde SA reference', () => {
		const dossier = lire()
		const s1 = jouer(dossier, ouverture(dossier), ['AGIR'])
		expect(consignerNarration(s1, 1, seul(RECIT)).memoire).toBeNull()

		const retenue = consignerNarration(s1, 1, { recit: RECIT, faits_etablis: [FAIT_FOYER] })
		const s2 = jouer(dossier, retenue, ['AGIR'])
		const sansRien = consignerNarration(s2, 2, seul('Rien de durable.'))
		expect(sansRien.memoire).toBe(s2.memoire)
		// Discriminant : un fait neuf, lui, produit une mémoire neuve.
		expect(consignerNarration(s2, 2, { recit: 'x', faits_etablis: [FAIT_SCEAU] }).memoire).not.toBe(s2.memoire)
	})

	it('les faits s AJOUTENT a la fin, dans l ordre, sans jamais reecrire les anciens', () => {
		const dossier = lire()
		const s1 = consignerNarration(jouer(dossier, ouverture(dossier), ['AGIR']), 1, {
			recit: 'a',
			faits_etablis: [FAIT_FOYER],
		})
		const s2 = consignerNarration(jouer(dossier, s1, ['AGIR']), 2, { recit: 'b', faits_etablis: [FAIT_SCEAU] })

		expect(s2.memoire?.faits_etablis).toEqual([FAIT_FOYER, FAIT_SCEAU])
		// L'ancien fait est LA MÊME référence : ajout seul, jamais une réécriture.
		expect(s2.memoire?.faits_etablis[0]).toBe(s1.memoire?.faits_etablis[0])
	})

	it('un fait deja retenu — meme phrase aux blancs pres, memes ancres dans un autre ordre — n est pas ajoute deux fois', () => {
		const dossier = lire()
		const s1 = consignerNarration(jouer(dossier, ouverture(dossier), ['AGIR']), 1, {
			recit: 'a',
			faits_etablis: [FAIT_SCEAU],
		})
		const doublon: FaitEtabli = { fait: `  ${FAIT_SCEAU.fait} `, sur: [...FAIT_SCEAU.sur].reverse() }
		const voisin: FaitEtabli = { fait: FAIT_SCEAU.fait, sur: ['objet.sceau-de-cendre'] }

		const s2 = consignerNarration(jouer(dossier, s1, ['AGIR']), 2, { recit: 'b', faits_etablis: [doublon, voisin] })

		// Le doublon EXACT tombe ; le fait voisin (mêmes mots, AUTRES ancres) est un autre fait.
		expect(s2.memoire?.faits_etablis).toEqual([FAIT_SCEAU, voisin])
		// Et le récit, lui, est posé : ce n'est pas un refus, c'est de l'idempotence de stockage.
		expect(s2.journal[s2.journal.length - 1].recit).toBe('b')
	})

	it('un resume seul, sans fait : memoire porte une liste vide ET le resume — I1 tient, l objet n est pas vide', () => {
		const dossier = lire()
		const s15 = agirNFois(dossier, ouverture(dossier), 15)
		const resume = { texte: 'Vous avez veillé.', jusqu_au_pas: 10 }

		expect(consignerNarration(s15, 15, { recit: RECIT, faits_etablis: [], resume }).memoire).toEqual({
			faits_etablis: [],
			resume,
		})
	})
})

describe('consignerNarration — la garde sur le resume : c est le CHEMIN D ECRITURE qui tient I2', () => {
	it('un resume dont jusqu_au_pas n est PAS la borne haute de la tranche due est ignore — le recit et les faits passent', () => {
		// MUTANT vérifié ROUGE : retirer la comparaison à `pasACondenser(session).a` — le
		// pointeur sauterait à 20, ou reculerait à 0, sans que rien d'autre ne rougisse.
		const dossier = lire()
		const s15 = agirNFois(dossier, ouverture(dossier), 15)
		expect(pasACondenser(s15)?.a).toBe(10)

		for (const faux of [0, 5, 20, 15]) {
			const s = consignerNarration(s15, 15, {
				recit: RECIT,
				faits_etablis: [FAIT_FOYER],
				resume: { texte: 'Un resume venu d ailleurs.', jusqu_au_pas: faux },
			})
			expect(`${faux} → ${JSON.stringify(s.memoire)}`).toBe(
				`${faux} → ${JSON.stringify({ faits_etablis: [FAIT_FOYER] })}`,
			)
			expect(s.journal[s.journal.length - 1].recit).toBe(RECIT)
			// La tranche RESTE DUE : elle sera redemandée au pas narré suivant (KR-271).
			expect(pasACondenser(s)).toEqual({ de: 1, a: 10 })
		}
	})

	it('un resume arrive alors que RIEN n etait du est ignore — meme avec un pointeur plausible', () => {
		const dossier = lire()
		const s14 = agirNFois(dossier, ouverture(dossier), 14)
		expect(pasACondenser(s14)).toBeNull()

		const s = consignerNarration(s14, 14, {
			recit: RECIT,
			faits_etablis: [],
			resume: { texte: 'Trop tot.', jusqu_au_pas: CADENCE },
		})

		expect(s.memoire).toBeNull()
		expect(s.journal[s.journal.length - 1].recit).toBe(RECIT)
	})

	it('un resume ABSENT laisse l ancien en place, et la tranche suivante reste due', () => {
		const dossier = lire()
		const ancien = { texte: 'Vous avez veillé.', jusqu_au_pas: 10 }
		const s15 = consignerNarration(agirNFois(dossier, ouverture(dossier), 15), 15, {
			recit: 'a',
			faits_etablis: [],
			resume: ancien,
		})
		const s25 = agirNFois(dossier, s15, 10)
		expect(pasACondenser(s25)).toEqual({ de: 11, a: 20 })

		const s = consignerNarration(s25, 25, { recit: 'b', faits_etablis: [FAIT_FOYER] })

		expect(s.memoire?.resume).toBe(ancien)
		expect(s.memoire?.faits_etablis).toEqual([FAIT_FOYER])
		expect(pasACondenser(s)).toEqual({ de: 11, a: 20 })
	})

	it('I2 sur toute une partie : le pointeur reste un multiple de CADENCE et ne depasse jamais la borne de fenetre', () => {
		// Une partie de 40 pas où CHAQUE pas propose un résumé au pointeur de SA tranche due —
		// ou, quand rien n'est dû, un pointeur plausible que la garde doit ignorer.
		const dossier = lire()
		let session = ouverture(dossier)
		const fautes: string[] = []
		for (let pas = 1; pas <= 40; pas += 1) {
			session = jouer(dossier, session, ['AGIR'])
			const du = pasACondenser(session)
			session = consignerNarration(session, pas, {
				recit: `r${pas}`,
				faits_etablis: [],
				resume: { texte: `condense ${pas}`, jusqu_au_pas: du?.a ?? CADENCE * pas },
			})
			const pointeur = session.memoire?.resume?.jusqu_au_pas ?? 0
			if (pointeur % CADENCE !== 0) fautes.push(`${pas} : pointeur ${pointeur} non multiple`)
			if (pointeur > borneDeFenetre(pas)) fautes.push(`${pas} : pointeur ${pointeur} > borne ${borneDeFenetre(pas)}`)
		}
		expect(fautes).toEqual([])
		// Discriminant : le pointeur a RÉELLEMENT avancé — trois condensations, aux pas 15, 25, 35.
		expect(session.memoire?.resume?.jusqu_au_pas).toBe(30)
		expect(session.memoire?.resume?.texte).toBe('condense 35')
	})
})

describe('la fixture saturee enseigne les invariants', () => {
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

	it('sa memoire tient I1, I2 et I5', () => {
		const memoire = SESSION_SATUREE.memoire
		expect(memoire).not.toBeNull()
		// I1 — un objet NON VIDE.
		expect((memoire?.faits_etablis.length ?? 0) > 0 || memoire?.resume !== undefined).toBe(true)
		// I2 — le pointeur, multiple de la cadence, jamais au-delà de la borne de SON horloge.
		const pointeur = memoire?.resume?.jusqu_au_pas ?? -1
		expect(pointeur % CADENCE).toBe(0)
		expect(pointeur).toBeGreaterThan(0)
		expect(pointeur).toBeLessThanOrEqual(borneDeFenetre(SESSION_SATUREE.horloge.tour))
		// I5 — des ancres de lieu et d'objet SEULEMENT, une ou deux, distinctes.
		for (const fait of memoire?.faits_etablis ?? []) {
			expect(fait.sur.length).toBeGreaterThanOrEqual(1)
			expect(fait.sur.length).toBeLessThanOrEqual(2)
			expect(new Set(fait.sur).size).toBe(fait.sur.length)
			expect(fait.sur.filter((ancre) => !/^(lieu|objet)\./.test(ancre))).toEqual([])
		}
	})
})
