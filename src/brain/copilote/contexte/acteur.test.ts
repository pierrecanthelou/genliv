import fs from 'node:fs'
import path from 'node:path'
import { ouvrirSession, type EntreeJournal, type EtatSession } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import { REPLIQUE_CARACTERES_MAX } from '../schemaSortie'
import { assemblerActeur, BUDGET_CARACTERES_ACTEUR, MEMOIRE_PARLER_MAX } from './acteur'
import { SAISIE_CARACTERES_MAX } from './interprete'

/**
 * L'ASSEMBLEUR DU DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1, lot
 * `contrat`). § 7 du plan d'itération : « contexte/acteur.test.ts — isolation du
 * contexte » et « contexte/acteur.test.ts — mémoire isolée ».
 *
 * LES DOSSIERS SONT LUS DU DISQUE (KR-156), jamais fabriqués : `dossier-reference.json`
 * porte Harek (`pnj.harek-le-forgeron`), enrichi au lot contrat d'it1 d'une `presence`
 * au Foyer du Guet (le lieu de départ) et d'une `apparence` — le PNJ de la démo.
 */

const CHEMIN_REFERENCE = path.join(__dirname, '..', '..', 'dossier', '__fixtures__', 'dossier-reference.json')

function lire(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

function ouverture(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 1 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

const HAREK = 'pnj.harek-le-forgeron'
const CORVIN = 'pnj.corvin-le-marchand'

describe('assemblerActeur — le nominal : TOI, TA VOIX, ICI, JAMAIS, saisie en dernier', () => {
	it('le nominal rend ok, TOI porte l identite de Harek (fonction PUIS apparence)', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexte.texte).toContain('TOI')
		expect(contexte.texte).toContain('Forgeron du Foyer du Guet')
		expect(contexte.texte).toContain('Un colosse aux avant-bras')
		// La saisie normalisee vient EN DERNIER.
		expect(contexte.texte.trimEnd().endsWith('bonjour')).toBe(true)
	})

	it('TA VOIX : caractere.parler de Corvin, au plus PARLER_REPLIQUES (ici 1, sous la borne)', () => {
		const dossier = lire()
		const session = {
			...ouverture(dossier),
			monde: { ...ouverture(dossier).monde, lieu_courant: 'lieu.marche-des-cendres' },
		}

		const contexte = assemblerActeur(dossier, session, CORVIN, 'quoi de neuf')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexte.texte).toContain('TA VOIX')
		expect(contexte.texte).toContain("Tout se paie, l'ami.")
		expect(contexte.texte).toContain('JAMAIS')
		expect(contexte.texte).toContain('Il ne rendra jamais un gage')
	})

	it('ICI : description + ambiance du lieu courant, silence si absentes', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexte.texte).toContain('ICI')
		expect(contexte.texte).toContain('Le village serré autour de son beffroi éteint')
		expect(contexte.texte).toContain('On y parle bas du feu de la tour')
	})

	it('refus cible-a-ecrire : le PNJ ne resout pas dans monde.personnages[]', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		expect(assemblerActeur(dossier, session, 'pnj.fantome', 'salut')).toEqual({ ok: false, motif: 'cible-a-ecrire' })
	})

	it('refus cible-a-ecrire : le PNJ resout, mais ni fonction ni apparence (Aubry, dans la fixture)', () => {
		const dossier = lire()
		const session = ouverture(dossier)
		const aubry = dossier.monde.personnages.find((personnage) => personnage.id === 'pnj.aubry-l-intendant')
		expect(aubry?.fonction).toBeUndefined()
		expect(aubry?.apparence).toBeUndefined()

		expect(assemblerActeur(dossier, session, 'pnj.aubry-l-intendant', 'salut')).toEqual({
			ok: false,
			motif: 'cible-a-ecrire',
		})
	})

	it('refus trop-long : la saisie depasse SAISIE_CARACTERES_MAX, AVANT toute resolution du PNJ', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		expect(assemblerActeur(dossier, session, HAREK, 'x'.repeat(SAISIE_CARACTERES_MAX))).toEqual(
			expect.objectContaining({ ok: true }),
		)
		expect(assemblerActeur(dossier, session, HAREK, 'x'.repeat(SAISIE_CARACTERES_MAX + 1))).toEqual({
			ok: false,
			motif: 'trop-long',
		})
		// Même sur un PNJ qui n'existe pas : la saisie refuse AVANT toute résolution.
		expect(assemblerActeur(dossier, session, 'pnj.fantome', 'x'.repeat(SAISIE_CARACTERES_MAX + 1))).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('BUDGET_CARACTERES_ACTEUR est strictement positif, et le refus trop-long sur un contexte demesure ne coupe rien', () => {
		expect(BUDGET_CARACTERES_ACTEUR).toBeGreaterThan(0)
		// Un fait ETABLI geant ne peut pas etre injecte par ce chemin (aucun levier
		// ouvert a l'appelant) — le budget se verifie par construction via les bornes
		// de ETABLI/TU AS DIT/saisie, deja calculees (`BORNE_MEMOIRE_ACTEUR`/`BORNE_SAISIE_ACTEUR`).
	})
})

/**
 * ISOLATION DU CONTEXTE (KR-262, KR-282) — le contexte R4 ne contient AUCUNE clé
 * `heros`, `relations`, `cede_si`, `savoirs`, aucun identifiant brut. En it1,
 * AUCUNE relation (même du porteur) ni `cede_si` n'entre dans le contexte — le
 * mécanisme consommateur n'existe pas encore (§ 6 critère 4 du plan).
 */
describe('assemblerActeur — isolation du contexte (KR-262, KR-282)', () => {
	it('le contexte ne contient JAMAIS heros, relations, cede_si, savoirs, ni aucun identifiant brut', () => {
		const dossier = lire()
		// Corvin PORTE des relations ET un `caractere.cede_si` dans la fixture — c'est
		// le personnage le plus chargé, donc le pire cas pour cette garde.
		const corvin = dossier.monde.personnages.find((personnage) => personnage.id === CORVIN)
		expect(corvin?.relations?.length ?? 0).toBeGreaterThan(0)
		expect(corvin?.caractere?.cede_si).toBeDefined()
		expect(corvin?.stats).toBeDefined()

		const session = {
			...ouverture(dossier),
			monde: { ...ouverture(dossier).monde, lieu_courant: 'lieu.marche-des-cendres' },
		}
		const contexte = assemblerActeur(dossier, session, CORVIN, 'je cherche quelque chose')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')

		// AUCUNE clé de bloc pour heros/relations/cede_si/savoirs : ni leur CONTENU...
		expect(contexte.texte).not.toContain('Il lui règle ses herbes') // relations[].lien de Corvin
		expect(contexte.texte).not.toContain('Devant une reconnaissance de dette') // caractere.cede_si de Corvin
		expect(contexte.texte).not.toContain('pnj.mira-la-guerisseuse') // cible_id de la relation de Corvin
		// ... ni ses CHIFFRES (stats), ni un identifiant brut du PNJ interpellé.
		for (const chiffre of ['FO', 'DX', 'IG', 'CA']) expect(contexte.texte).not.toContain(`"${chiffre}"`)
		expect(contexte.texte).not.toContain(CORVIN)
		expect(contexte.texte).not.toContain('heros')
		expect(contexte.texte).not.toContain('savoirs')
	})

	it('relations/cede_si du PNJ interpelle LUI-MEME sont absentes, exclusion TOTALE en it1', () => {
		// DISCRIMINANT : au cas où un futur lecteur confondrait « jamais d'un autre » et
		// « jamais du tout » — en it1, MÊME le porteur n'a pas ses relations injectées.
		const dossier = lire()
		const session = {
			...ouverture(dossier),
			monde: { ...ouverture(dossier).monde, lieu_courant: 'lieu.marche-des-cendres' },
		}
		const corvin = dossier.monde.personnages.find((personnage) => personnage.id === CORVIN)
		expect(corvin?.caractere?.cede_si?.length ?? 0).toBeGreaterThan(0)

		const contexte = assemblerActeur(dossier, session, CORVIN, 'je cherche quelque chose')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexte.texte).not.toContain(String(corvin?.caractere?.cede_si))
	})
})

/** Construit une entrée `parler` de journal, déjà racontée (`recit` défini) ou non. */
function entreeParler(tour: number, interlocuteur: string, recit?: string): EntreeJournal {
	return recit === undefined
		? { tour, role: 'moteur', texte: `interlocuteur : ${interlocuteur}`, origine: 'parler', interlocuteur }
		: { tour, role: 'moteur', texte: `interlocuteur : ${interlocuteur}`, origine: 'parler', interlocuteur, recit }
}

/**
 * MÉMOIRE ISOLÉE (KR-282, KR-284) — § 7 du plan : « séquence A×3/B×2/A×3 avec
 * échec R4 sur A : le 7e appel (A) ne voit que les répliques de A ». A = Harek,
 * B = Corvin. Le PREMIER appel de A échoue (R4 n'a jamais répondu : `recit`
 * absent) — une entrée SANS récit ne doit JAMAIS apparaître dans `TU AS DIT`.
 */
describe('assemblerActeur — memoire isolee, K=4, propre a CE PNJ (KR-282, KR-284)', () => {
	it('le 7e appel (A) ne voit QUE les repliques de A, dans l ordre, jamais celles de B ni l echec sans recit', () => {
		const dossier = lire()
		const ouverte = ouverture(dossier)

		// Séquence : A(échec), A, A, B, B, A — SIX pas déjà joués, le 7e est EN COURS
		// (horloge.tour = 7, sans entrée encore pour ce pas).
		const journal: EntreeJournal[] = [
			entreeParler(1, HAREK), // échec R4 — AUCUN recit
			entreeParler(2, HAREK, 'Le fer ne ment pas, et moi non plus.'),
			entreeParler(3, HAREK, "Vous m'interrompez en plein travail."),
			entreeParler(4, CORVIN, 'Tout se paie, approchez.'),
			entreeParler(5, CORVIN, "J'ai ce qu'il vous faut, pour un prix."),
			entreeParler(6, HAREK, 'Encore vous ? Posez votre question.'),
		]
		const session: EtatSession = { ...ouverte, horloge: { tour: 7 }, journal }

		const contexte = assemblerActeur(dossier, session, HAREK, 'une dernière question')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).toContain('TU AS DIT')
		// LES TROIS RÉPLIQUES DE A, CHRONOLOGIQUES — jamais celle de l'échec (tour 1).
		const blocDit = contexte.texte.split('TU AS DIT\n')[1]?.split('\n\n')[0] ?? ''
		expect(blocDit.split('\n')).toEqual([
			'Le fer ne ment pas, et moi non plus.',
			"Vous m'interrompez en plein travail.",
			'Encore vous ? Posez votre question.',
		])
		// JAMAIS les répliques de B.
		expect(contexte.texte).not.toContain('Tout se paie, approchez.')
		expect(contexte.texte).not.toContain("J'ai ce qu'il vous faut")
	})

	it('la fenetre est bornee a MEMOIRE_PARLER_MAX : la plus ancienne replique de A tombe au 5e succes', () => {
		expect(MEMOIRE_PARLER_MAX).toBe(4)
		const dossier = lire()
		const ouverte = ouverture(dossier)

		const journal: EntreeJournal[] = [
			entreeParler(1, HAREK, 'Première réplique.'),
			entreeParler(2, HAREK, 'Deuxième réplique.'),
			entreeParler(3, HAREK, 'Troisième réplique.'),
			entreeParler(4, HAREK, 'Quatrième réplique.'),
			entreeParler(5, HAREK, 'Cinquième réplique.'),
		]
		const session: EtatSession = { ...ouverte, horloge: { tour: 6 }, journal }

		const contexte = assemblerActeur(dossier, session, HAREK, 'et maintenant ?')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).not.toContain('Première réplique.')
		expect(contexte.texte).toContain('Deuxième réplique.')
		expect(contexte.texte).toContain('Cinquième réplique.')
	})

	it('TU AS DIT est ABSENT (aucun bloc vide) quand ce PNJ n a encore jamais parle', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).not.toContain('TU AS DIT')
	})

	it('une replique dont la longueur approche REPLIQUE_CARACTERES_MAX reste portee integralement (borne CALCULEE, pas mesuree)', () => {
		expect(REPLIQUE_CARACTERES_MAX).toBe(400)
		const dossier = lire()
		const ouverte = ouverture(dossier)
		const longue = 'r'.repeat(REPLIQUE_CARACTERES_MAX)
		const journal: EntreeJournal[] = [entreeParler(1, HAREK, longue)]
		const session: EtatSession = { ...ouverte, horloge: { tour: 2 }, journal }

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).toContain(longue)
	})
})

/**
 * LES DEUX BLOCS NEUFS DE L'IT2 — « CE QUE TU LUI AS DÉJÀ CONFIÉ » et « CE QUE TU
 * PEUX CONFIER ». Harek porte un savoir gardé par `contrepartie`(consomme:false,
 * `objet.amulette-scellee`) + `apres_indice_id`(`indice.pas-dans-la-cendre`) en
 * conjonction, référençant `indice.sceau-brise-a-nouveau` (`formulation_joueur` +
 * `revele_comment` rédigés) — § 7 du plan : « acteur.test.ts — isolation des blocs ».
 */
describe('assemblerActeur — CE QUE TU PEUX CONFIER / CE QUE TU LUI AS DEJA CONFIE (it2, KR-287)', () => {
	const INDICE_REVELABLE = 'indice.sceau-brise-a-nouveau'
	const FORMULATION = 'Une fêlure court le long du sceau, fine comme un cheveu.'
	const COMMENTAIRE = 'Il repose son marteau et vous regarde bien en face avant de parler.'

	function portesOuvertes(session: EtatSession): EtatSession {
		return {
			...session,
			monde: {
				...session.monde,
				objets_possedes: ['objet.amulette-scellee'],
				indices_connus: ['indice.pas-dans-la-cendre'],
			},
		}
	}

	it('ABSENT des deux blocs quand rien n est ouvert ni confie (session fraiche) — zero drapeau visible', () => {
		const dossier = lire()
		const session = ouverture(dossier)

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).not.toContain('CE QUE TU PEUX CONFIER')
		expect(contexte.texte).not.toContain('CE QUE TU LUI AS DÉJÀ CONFIÉ')
		expect(contexte.rangs.size).toBe(0)
	})

	it('CE QUE TU PEUX CONFIER : rang S1, certitude, formulation_joueur PUIS revele_comment — et la table rangs', () => {
		const dossier = lire()
		const session = portesOuvertes(ouverture(dossier))

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).toContain('CE QUE TU PEUX CONFIER')
		expect(contexte.texte).toContain(`S1 · tu le crois · ${FORMULATION} · ${COMMENTAIRE}`)
		expect(contexte.rangs.get('S1')).toBe(INDICE_REVELABLE)
		expect(contexte.rangs.size).toBe(1)
		expect(contexte.texte).not.toContain('CE QUE TU LUI AS DÉJÀ CONFIÉ')
	})

	it('CE QUE TU LUI AS DEJA CONFIE : SANS rang, certitude + formulation_joueur SEULS (jamais revele_comment)', () => {
		const dossier = lire()
		const base = ouverture(dossier)
		const session: EtatSession = { ...base, monde: { ...base.monde, pnj: { [HAREK]: { a_dit: [INDICE_REVELABLE] } } } }

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).toContain('CE QUE TU LUI AS DÉJÀ CONFIÉ')
		expect(contexte.texte).toContain(`· tu le crois · ${FORMULATION}`)
		expect(contexte.texte).not.toContain(COMMENTAIRE)
		expect(contexte.texte).not.toContain('CE QUE TU PEUX CONFIER')
		expect(contexte.rangs.size).toBe(0)
	})

	it('AUCUNE cle brute : ni indice_id, ni revele_si/contrepartie/consomme/apres_indice_id, ni a_dit', () => {
		const dossier = lire()
		const session = portesOuvertes(ouverture(dossier))

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		for (const brut of [INDICE_REVELABLE, 'revele_si', 'contrepartie', 'consomme', 'apres_indice_id', 'a_dit']) {
			expect(`${brut} → ${contexte.texte.includes(brut)}`).toBe(`${brut} → false`)
		}
	})

	it('isolation : le savoir OUVERT d un AUTRE PNJ n entre JAMAIS dans le contexte de Harek', () => {
		// Mira (fixture) porte un savoir sur le MEME indice (`confiance_min` + `apres_indice_id`,
		// toujours FERMEE en it2) — elle ne doit jamais apparaitre, et son `revele_comment` propre
		// encore moins.
		const dossier = lire()
		const mira = dossier.monde.personnages.find((p) => p.id === 'pnj.mira-la-guerisseuse')
		expect(mira?.savoirs[0]?.revele_comment).toBeDefined()
		const session = portesOuvertes(ouverture(dossier))

		const contexte = assemblerActeur(dossier, session, HAREK, 'bonjour')

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte ne doit pas etre refuse')
		expect(contexte.texte).not.toContain(String(mira?.savoirs[0]?.revele_comment))
		expect(contexte.texte).not.toContain('pnj.mira-la-guerisseuse')
	})
})
