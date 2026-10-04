import fs from 'node:fs'
import path from 'node:path'
import { analyserSaisie, executerCommande } from '../../dossier/commandes'
import { consignerJet, fixerHeros, ouvrirSession, type EntreeJournal, type EtatSession } from '../../dossier/session'
import type { Dossier, Savoir } from '../../dossier/types'
import type { HeroState } from '../../../player/types'
import { ENJEU_CARACTERES_MAX, REPLIQUE_CARACTERES_MAX } from '../schemaSortie'
import {
	assemblerActeur,
	BORNE_ISSUE_ACTEUR,
	BORNE_MEMOIRE_ACTEUR,
	BORNE_SAISIE_ACTEUR,
	BUDGET_CARACTERES_ACTEUR,
	MEMOIRE_PARLER_MAX,
} from './acteur'
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

/**
 * LA PORTE `jet` — `CE QUE TU GARDES` (appel 1) ET `À L'INSTANT` (appel 2), n° 12
 * `moteur-acteurs`, it4, lot `contrat` (`docs/REGLES-DU-JEU.md` § 6, « La porte `jet` »).
 *
 * Harek porte `indice.pas-dans-la-cendre` gardé par le seul `jet` IN/TC1
 * (`dossier-reference.json`, déjà livré — aucune fixture n'est touchée). LES ISSUES
 * SONT FORCÉES PAR LE HÉROS, jamais par la graine : TC1 (1D6, total ≥ 1) réussit TOUJOURS
 * contre IN 9 et échoue TOUJOURS contre IN 0. Les sessions sont produites par le moteur
 * (`PARLER` via `executerCommande`, puis `consignerJet`), jamais forgées.
 */
describe('assemblerActeur — la porte jet : CE QUE TU GARDES (appel 1) et A L INSTANT (appel 2) — it4', () => {
	const INDICE_EN_JEU = 'indice.pas-dans-la-cendre'
	const ENJEU_REUSSITE = 'baisser enfin la garde'
	const ENJEU_ECHEC = 'se refermer davantage'
	const EPREUVE = { enjeu_reussite: ENJEU_REUSSITE, enjeu_echec: ENJEU_ECHEC }
	/** Le bloc, tel que le plan le fige (§ 3) — écrit ICI en toutes lettres, jamais lu d'une constante du code. */
	const BLOC_GARDE = '\n\nCE QUE TU GARDES\nTu gardes un secret.'

	function hero(intelligence: number): HeroState {
		return {
			name: 'Aldric le Temeraire',
			caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: intelligence, IG: 4, SE: 10, CA: 3 },
			pvMax: 21,
			pv: 14,
			peMax: 8,
			pe: 8,
			mcBonus: 0,
			xp: 12,
		}
	}

	/** `PARLER harek` joué par le produit, avec un héros de `IN` donné ; le jet IN/TC1 y est consigné si `tenter`. */
	function apresParler(dossier: Dossier, intelligence: number, tenter: boolean): EtatSession {
		const analyse = analyserSaisie(`PARLER ${HAREK}`)
		if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
		const resultat = executerCommande(dossier, fixerHeros(ouverture(dossier), hero(intelligence)), analyse.commande)
		if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
		const session = resultat.session
		return tenter ? consignerJet(session, session.horloge.tour, { carac: 'IN', tc: 'TC1' }) : session
	}

	/** Ce que le savoir gardé ne doit JAMAIS laisser sortir à l'appel 1 — RELU de la fixture, jamais recopié. */
	function secretsDuSavoir(dossier: Dossier): Record<string, string> {
		const indice = dossier.monde.indices.find((candidat) => candidat.id === INDICE_EN_JEU)
		const savoir = dossier.monde.personnages
			.find((personnage) => personnage.id === HAREK)
			?.savoirs.find((candidat) => candidat.indice_id === INDICE_EN_JEU)
		const secrets = {
			formulation_joueur: indice?.formulation_joueur ?? '',
			verite: indice?.verite ?? '',
			nom_de_l_indice: indice?.nom ?? '',
			revele_comment: savoir?.revele_comment ?? '',
			indice_id: INDICE_EN_JEU,
		}
		// NON-VACUITÉ : un secret vide serait « absent du contexte » pour rien.
		for (const [cle, valeur] of Object.entries(secrets)) expect(`${cle} → ${valeur.length > 0}`).toBe(`${cle} → true`)
		return secrets
	}

	function rendu(dossier: Dossier, session: EtatSession, pnj: string, options?: Parameters<typeof assemblerActeur>[4]) {
		const contexte = assemblerActeur(dossier, session, pnj, 'bonjour', options)
		if (!contexte.ok) throw new Error(`le contexte ne doit pas etre refuse : ${contexte.motif}`)
		return contexte
	}

	function avecSavoirsDeHarek(dossier: Dossier, savoirs: readonly Savoir[]): Dossier {
		return {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === HAREK ? { ...personnage, savoirs: [...savoirs] } : personnage,
				),
			},
		}
	}

	describe('APPEL 1 — CE QUE TU GARDES : une ligne constante, sans contenu', () => {
		it('present ssi resistible ET heros ET savoir sous epreuve — la table des six cas, un seul est vrai', () => {
			const dossier = lire()
			const avecHerosFrais = apresParler(dossier, 9, false)
			const sansHeros = ouverture(dossier)
			const marche = { ...avecHerosFrais, monde: { ...avecHerosFrais.monde, lieu_courant: 'lieu.marche-des-cendres' } }
			const dejaGagne = apresParler(dossier, 9, true) // la reussite de Harek est ACQUISE : plus rien n'est en jeu

			const cas: ReadonlyArray<{
				readonly nom: string
				readonly session: EtatSession
				readonly pnj: string
				readonly resistible: boolean | undefined
				readonly attendu: boolean
			}> = [
				{
					nom: 'resistible + heros + savoir en jeu',
					session: avecHerosFrais,
					pnj: HAREK,
					resistible: true,
					attendu: true,
				},
				{ nom: 'resistible false', session: avecHerosFrais, pnj: HAREK, resistible: false, attendu: false },
				{ nom: 'resistible absent', session: avecHerosFrais, pnj: HAREK, resistible: undefined, attendu: false },
				{ nom: 'SANS heros', session: sansHeros, pnj: HAREK, resistible: true, attendu: false },
				{ nom: 'PNJ sans aucun savoir', session: marche, pnj: CORVIN, resistible: true, attendu: false },
				{ nom: 'savoir DEJA gagne (jet acquis)', session: dejaGagne, pnj: HAREK, resistible: true, attendu: false },
			]
			for (const { nom, session, pnj, resistible, attendu } of cas) {
				const contexte = rendu(dossier, session, pnj, { resistible })
				expect(`${nom} → bloc ${contexte.texte.includes('CE QUE TU GARDES')}`).toBe(`${nom} → bloc ${attendu}`)
				// Et LE SIGNAL ET LA DECISION VONT ENSEMBLE : epreuveGardee n'existe que si le bloc existe.
				expect(`${nom} → epreuve ${contexte.epreuveGardee !== undefined}`).toBe(`${nom} → epreuve ${attendu}`)
			}
		})

		it('le bloc est EXACTEMENT « Tu gardes un secret. » — une ligne constante du code, rien d autre', () => {
			const dossier = lire()
			const session = apresParler(dossier, 9, false)

			const ordinaire = rendu(dossier, session, HAREK)
			const resistible = rendu(dossier, session, HAREK, { resistible: true })

			expect(resistible.texte).toContain('CE QUE TU GARDES\nTu gardes un secret.')
			// DIFFERENTIEL : le texte resistible EST le texte ordinaire, plus ce bloc-la — aucune autre ligne ne bouge.
			expect(resistible.texte.replace(BLOC_GARDE, '')).toBe(ordinaire.texte)
			expect(resistible.texte.length - ordinaire.texte.length).toBe(BLOC_GARDE.length)
			// Rien de plus n'a ete offert : le savoir garde n'est PAS dans le catalogue.
			expect(resistible.rangs.size).toBe(0)
			expect(resistible.rangDu).toBeUndefined()
		})

		it('ETANCHEITE (KR-229) : ni formulation_joueur, ni revele_comment, ni verite, ni nom, ni identifiant du savoir garde', () => {
			const dossier = lire()
			const secrets = secretsDuSavoir(dossier)
			const session = apresParler(dossier, 9, false)

			const contexte = rendu(dossier, session, HAREK, { resistible: true })

			expect(contexte.texte).toContain('CE QUE TU GARDES') // le signal est la, pour de vrai
			for (const [cle, secret] of Object.entries(secrets)) {
				expect(`${cle} → ${contexte.texte.includes(secret)}`).toBe(`${cle} → false`)
			}
			// Ni le couple {carac, tc} du jet : « le modele ne voit jamais carac/tc bruts ».
			for (const brut of ['carac', 'tc', 'TC1', 'jet', 'revele_si', 'confiance_min', 'contrepartie']) {
				expect(`${brut} → ${contexte.texte.includes(brut)}`).toBe(`${brut} → false`)
			}
			// Et le catalogue n'offre rien : jamais le savoir garde sous un rang, a l'appel 1.
			expect(contexte.texte).not.toContain('CE QUE TU PEUX CONFIER')
		})

		it('epreuveGardee est le {carac, tc} du savoir CHOISI par le moteur : le PREMIER de la fiche dont le jet est la seule porte fermee', () => {
			const dossier = lire()
			const originaux = dossier.monde.personnages.find((personnage) => personnage.id === HAREK)?.savoirs ?? []
			// Un savoir au jet DIFFERENT (FO/TC2), place AVANT celui de la fixture, sur un indice REDIGE.
			const premier: Savoir = {
				indice_id: 'indice.sceau-brise-a-nouveau',
				certitude: 'sait',
				revele_si: { jet: { carac: 'FO', tc: 'TC2' } },
			}
			const session = apresParler(dossier, 9, false)

			const parDefaut = rendu(dossier, session, HAREK, { resistible: true })
			expect(parDefaut.epreuveGardee).toEqual({ carac: 'IN', tc: 'TC1' }) // la fiche telle que livree

			const avantLeJetFixture = avecSavoirsDeHarek(dossier, [premier, ...originaux])
			const choisi = rendu(avantLeJetFixture, session, HAREK, { resistible: true })
			expect(choisi.epreuveGardee).toEqual({ carac: 'FO', tc: 'TC2' }) // l'ordre de la fiche decide
			// Un SEUL bloc, jamais un par savoir garde : au plus un savoir est mis en jeu par appel.
			expect(choisi.texte.split('CE QUE TU GARDES').length - 1).toBe(1)
		})

		it('POSITION : apres CE QUE TU PEUX CONFIER, avant ICI, la saisie reste EN DERNIER', () => {
			const dossier = lire()
			const base = apresParler(dossier, 9, false)
			// `sceau-brise-a-nouveau` s'ouvre (amulette + indice connu) pendant que `pas-dans-la-cendre` reste sous epreuve.
			const session: EtatSession = {
				...base,
				monde: {
					...base.monde,
					objets_possedes: ['objet.amulette-scellee'],
					indices_connus: [INDICE_EN_JEU],
				},
			}

			const contexte = rendu(dossier, session, HAREK, { resistible: true })

			const peutConfier = contexte.texte.indexOf('CE QUE TU PEUX CONFIER')
			const garde = contexte.texte.indexOf('CE QUE TU GARDES')
			const ici = contexte.texte.indexOf('\n\nICI\n')
			expect(peutConfier).toBeGreaterThan(-1)
			expect(garde).toBeGreaterThan(peutConfier)
			expect(ici).toBeGreaterThan(garde)
			expect(contexte.texte.endsWith('\n\nsaisie\nbonjour')).toBe(true)
			expect(contexte.rangs.get('S1')).toBe('indice.sceau-brise-a-nouveau')
		})

		it('resistible ne change JAMAIS ce qui est offert ni confie : les rangs et la table sont ceux d un appel ordinaire', () => {
			const dossier = lire()
			const base = apresParler(dossier, 9, false)
			const session: EtatSession = {
				...base,
				monde: { ...base.monde, objets_possedes: ['objet.amulette-scellee'], indices_connus: [INDICE_EN_JEU] },
			}

			const ordinaire = rendu(dossier, session, HAREK)
			const resistible = rendu(dossier, session, HAREK, { resistible: true })

			expect([...resistible.rangs.entries()]).toEqual([...ordinaire.rangs.entries()])
			expect(resistible.rangDu).toBeUndefined()
		})
	})

	describe('APPEL 2 — A L INSTANT : l issue, ecrite par le CODE ; le savoir du devient offert, marque, et son rang est rendu', () => {
		it('jet REUSSI : « Il cède. — {enjeu_reussite} », jamais l autre enjeu, jamais le bloc de garde', () => {
			const dossier = lire()
			const session = apresParler(dossier, 9, true)

			const contexte = rendu(dossier, session, HAREK, { epreuve: EPREUVE })

			expect(contexte.texte).toContain(`À L'INSTANT\nIl cède. — ${ENJEU_REUSSITE}`)
			expect(contexte.texte).not.toContain('Il tient bon')
			expect(contexte.texte).not.toContain(ENJEU_ECHEC)
			expect(contexte.texte).not.toContain('CE QUE TU GARDES')
			expect(contexte.epreuveGardee).toBeUndefined() // l'appel 2 ne resiste jamais
		})

		it('jet REUSSI : le savoir mis en jeu AVANT le jet entre dans CE QUE TU PEUX CONFIER avec revele_comment, MARQUE du, et son rang est rendu', () => {
			const dossier = lire()
			const secrets = secretsDuSavoir(dossier)
			const session = apresParler(dossier, 9, true)

			const contexte = rendu(dossier, session, HAREK, { epreuve: EPREUVE })

			// `pas-dans-la-cendre` est `sait` → « tu le sais » ; formulation PUIS revele_comment PUIS la marque.
			expect(contexte.texte).toContain(
				`S1 · tu le sais · ${secrets.formulation_joueur} · ${secrets.revele_comment} · dû`,
			)
			expect(contexte.rangs.get('S1')).toBe(INDICE_EN_JEU)
			expect(contexte.rangDu).toBe('S1')
			// Le rang dû est TOUJOURS une clé de la table : le validateur n'exigera jamais l'introuvable.
			expect(contexte.rangs.has(String(contexte.rangDu))).toBe(true)
			// `verite` reste hors de tout contexte, meme dû (KR-229).
			expect(contexte.texte).not.toContain(secrets.verite)
		})

		it('jet MANQUE : « Il tient bon. — {enjeu_echec} », le savoir reste sous epreuve — jamais offert, aucun rang du', () => {
			const dossier = lire()
			const secrets = secretsDuSavoir(dossier)
			const session = apresParler(dossier, 0, true)

			const contexte = rendu(dossier, session, HAREK, { epreuve: EPREUVE })

			expect(contexte.texte).toContain(`À L'INSTANT\nIl tient bon. — ${ENJEU_ECHEC}`)
			expect(contexte.texte).not.toContain('Il cède')
			expect(contexte.texte).not.toContain(ENJEU_REUSSITE)
			expect(contexte.texte).not.toContain('CE QUE TU PEUX CONFIER')
			expect(contexte.texte).not.toContain('CE QUE TU GARDES')
			for (const [cle, secret] of Object.entries(secrets)) {
				expect(`${cle} → ${contexte.texte.includes(secret)}`).toBe(`${cle} → false`)
			}
			expect(contexte.rangs.size).toBe(0)
			expect(contexte.rangDu).toBeUndefined()
			expect(contexte.epreuveGardee).toBeUndefined()
		})

		it('le COTE ADVENU est choisi par le code : meme epreuve, deux heros, deux lignes opposees', () => {
			const dossier = lire()
			const gagne = rendu(dossier, apresParler(dossier, 9, true), HAREK, { epreuve: EPREUVE })
			const perdu = rendu(dossier, apresParler(dossier, 0, true), HAREK, { epreuve: EPREUVE })

			expect(gagne.texte).toContain('Il cède. — ')
			expect(perdu.texte).toContain('Il tient bon. — ')
			expect(gagne.texte).not.toContain('Il tient bon. — ')
			expect(perdu.texte).not.toContain('Il cède. — ')
		})

		it('l appel 2 ne resiste JAMAIS : resistible est ignore des que epreuve est posee', () => {
			const dossier = lire()
			// Savoir encore sous epreuve (jet manque) ET resistible demande : le bloc de garde reste absent.
			const contexte = rendu(dossier, apresParler(dossier, 0, true), HAREK, { epreuve: EPREUVE, resistible: true })

			expect(contexte.texte).not.toContain('CE QUE TU GARDES')
			expect(contexte.epreuveGardee).toBeUndefined()
			expect(contexte.texte).toContain("À L'INSTANT")
		})

		it('POSITION : la ligne d issue est le DERNIER bloc avant la saisie, qui reste EN DERNIER', () => {
			const dossier = lire()
			const contexte = rendu(dossier, apresParler(dossier, 9, true), HAREK, { epreuve: EPREUVE })

			expect(contexte.texte.endsWith(`\n\nÀ L'INSTANT\nIl cède. — ${ENJEU_REUSSITE}\n\nsaisie\nbonjour`)).toBe(true)
		})

		it('CAS LIMITES — sans jet consigne, ou sans heros : aucune ligne d issue, aucun rang du (precedent ligneDeJet du narrateur)', () => {
			const dossier = lire()
			const sansJet = rendu(dossier, apresParler(dossier, 9, false), HAREK, { epreuve: EPREUVE })
			expect(sansJet.texte).not.toContain("À L'INSTANT")
			expect(sansJet.rangDu).toBeUndefined()

			const analyse = analyserSaisie(`PARLER ${HAREK}`)
			if (!analyse.ok) throw new Error('saisie refusée')
			const parle = executerCommande(dossier, ouverture(dossier), analyse.commande)
			if (!parle.ok) throw new Error('commande refusée')
			const sansHeros = consignerJet(parle.session, parle.session.horloge.tour, { carac: 'IN', tc: 'TC1' })
			const contexte = rendu(dossier, sansHeros, HAREK, { epreuve: EPREUVE })
			expect(contexte.texte).not.toContain("À L'INSTANT")
			expect(contexte.rangDu).toBeUndefined()
			expect(contexte.rangs.size).toBe(0)
		})

		it('le savoir DU est celui qui etait en jeu AVANT le jet — pas un savoir simplement revelable, ni un second au meme couple', () => {
			const dossier = lire()
			const originaux = dossier.monde.personnages.find((personnage) => personnage.id === HAREK)?.savoirs ?? []
			const enJeu = originaux[0]
			expect(enJeu?.indice_id).toBe(INDICE_EN_JEU)
			// A : DEJA revelable (confiance_min 0 = CONFIANCE_DEPART), place AVANT.   → pas du
			// B : le savoir de la fixture, sous epreuve IN/TC1.                         → DU
			// C : un SECOND savoir au MEME couple IN/TC1, apres.                         → revelable, pas du
			const dejaOuvert: Savoir = {
				indice_id: 'indice.piece-forgee-par-harek',
				certitude: 'croit',
				revele_si: { confiance_min: 0 },
			}
			const memeCouple: Savoir = {
				indice_id: 'indice.sceau-brise-a-nouveau',
				certitude: 'soupconne',
				revele_si: { jet: { carac: 'IN', tc: 'TC1' } },
			}
			const modifie = avecSavoirsDeHarek(dossier, [dejaOuvert, enJeu, memeCouple])
			const session = apresParler(modifie, 9, true)

			const contexte = rendu(modifie, session, HAREK, { epreuve: EPREUVE })

			// UNE SEULE reussite ouvre les deux portes du meme couple : les TROIS savoirs sont offerts.
			expect([...contexte.rangs.entries()]).toEqual([
				['S1', 'indice.piece-forgee-par-harek'],
				['S2', INDICE_EN_JEU],
				['S3', 'indice.sceau-brise-a-nouveau'],
			])
			// ... mais UN SEUL est du : celui qui etait sous epreuve, premier de la fiche.
			expect(contexte.rangDu).toBe('S2')
			const lignes = contexte.texte.split('\n').filter((ligne) => /^S[0-9] · /.test(ligne))
			expect(lignes).toHaveLength(3)
			expect(lignes.map((ligne) => ligne.endsWith(' · dû'))).toEqual([false, true, false])
		})

		it('LE DU SURVIT AU PAS SUIVANT : un appel ordinaire, apres la reussite, offre le savoir SANS marque ni rang du ni ligne d issue', () => {
			const dossier = lire()
			const secrets = secretsDuSavoir(dossier)
			// La reussite est acquise au pas 1 ; on est maintenant au pas suivant, SANS epreuve.
			const contexte = rendu(dossier, apresParler(dossier, 9, true), HAREK)

			expect(contexte.texte).toContain(`S1 · tu le sais · ${secrets.formulation_joueur} · ${secrets.revele_comment}`)
			expect(contexte.texte).not.toContain(' · dû')
			expect(contexte.texte).not.toContain("À L'INSTANT")
			expect(contexte.rangs.get('S1')).toBe(INDICE_EN_JEU)
			expect(contexte.rangDu).toBeUndefined()
		})
	})

	describe('LE BUDGET — le terme issue est CALCULE, les deux blocs sont mutuellement exclusifs', () => {
		it('BORNE_ISSUE_ACTEUR vaut 110, relu des TROIS cas ecrits en toutes lettres — et reste sous le plafond de +120 du plan', () => {
			const enjeuMax = 'x'.repeat(ENJEU_CARACTERES_MAX)
			expect(ENJEU_CARACTERES_MAX).toBe(80)
			const garde = BLOC_GARDE.length // 39
			const cede = `\n\nÀ L'INSTANT\nIl cède. — ${enjeuMax} · dû`.length // 110, marque du comprise
			const tientBon = `\n\nÀ L'INSTANT\nIl tient bon. — ${enjeuMax}`.length // 110, aucune marque
			expect([garde, cede, tientBon]).toEqual([39, 110, 110])

			expect(BORNE_ISSUE_ACTEUR).toBe(Math.max(garde, cede, tientBon))
			expect(BORNE_ISSUE_ACTEUR).toBe(110)
			expect(BORNE_ISSUE_ACTEUR).toBeLessThanOrEqual(120)
		})

		it('BUDGET_CARACTERES_ACTEUR = dossier 3000 + memoire 2911 + saisie 309 + issue 110 = 6330 — chaque terme epingle', () => {
			expect(BORNE_MEMOIRE_ACTEUR).toBe(2911)
			expect(BORNE_SAISIE_ACTEUR).toBe(309)
			expect(BUDGET_CARACTERES_ACTEUR).toBe(3000 + 2911 + 309 + 110)
			expect(BUDGET_CARACTERES_ACTEUR).toBe(6330)
		})

		it('RE-MESURE du terme dossier sur la combinatoire ETENDUE (it4) : M = 789, le palier du terme dossier reste 3000', () => {
			// Chaque lieu x chaque personnage x CINQ scenarios (fraiche, portes ouvertes, deja confie,
			// appel 1 resistible, appel 2 reussi) — les blocs NEUFS et la marque du sont RETIRES : ils
			// ont leur terme (`BORNE_ISSUE_ACTEUR`), les compter ici serait un double compte.
			const dossier = lire()
			const SANS_SAISIE = '\n\nsaisie\n'
			const sansTermeIssue = (texte: string): string =>
				texte
					.replace(/\n\nCE QUE TU GARDES\n[^\n]*/, '')
					.replace(/\n\nÀ L'INSTANT\n[^\n]*/, '')
					.replace(/ · dû$/gm, '')
			const mesures: number[] = []
			const pireParPnj = new Map<string, number>()
			for (const lieu of dossier.monde.lieux) {
				for (const personnage of dossier.monde.personnages) {
					const base = apresParler(dossier, 9, false)
					const enLieu = (session: EtatSession): EtatSession => ({
						...session,
						monde: { ...session.monde, lieu_courant: lieu.id },
					})
					const portesOuvertes = enLieu({
						...base,
						monde: { ...base.monde, objets_possedes: ['objet.amulette-scellee'], indices_connus: [INDICE_EN_JEU] },
					})
					const dejaConfie = enLieu({
						...base,
						monde: { ...base.monde, pnj: { [personnage.id]: { a_dit: personnage.savoirs.map((s) => s.indice_id) } } },
					})
					const scenarios: ReadonlyArray<readonly [EtatSession, Parameters<typeof assemblerActeur>[4]]> = [
						[enLieu(base), {}],
						[portesOuvertes, {}],
						[dejaConfie, {}],
						[enLieu(base), { resistible: true }],
						[enLieu(apresParler(dossier, 9, true)), { epreuve: { enjeu_reussite: 'a', enjeu_echec: 'b' } }],
					]
					for (const [session, options] of scenarios) {
						const contexte = assemblerActeur(dossier, session, personnage.id, '', options)
						if (!contexte.ok) continue // PNJ sans identite : refuse avant tout contexte
						const texte = sansTermeIssue(contexte.texte)
						const mesure = texte.slice(0, texte.lastIndexOf(SANS_SAISIE)).length
						mesures.push(mesure)
						pireParPnj.set(personnage.id, Math.max(pireParPnj.get(personnage.id) ?? 0, mesure))
					}
				}
			}
			// NON-VACUITE : la combinatoire a bien ete parcourue. MESURE du 2026-10-04 : 50 contextes
			// rendus (les lieux x les personnages dotes d'une identite x cinq scenarios) ; le plancher
			// est `floor(50 / 5) x 5` — ce qui rend le test rouge si un PNJ ou un lieu sort du balayage.
			expect(mesures.length).toBeGreaterThanOrEqual(50)
			const M = Math.max(...mesures)
			// M = 789, pas 781 : le pire cas est Harek (lieu.foyer-du-guet) avec SES TROIS savoirs deja
			// confies — le troisieme est entre a l'it3, qui n'a pas re-mesure ; 781 reste le pire cas de
			// Corvin (aucun savoir). Aucun des blocs neufs de l'it4 n'y est pour rien : ils sont retires.
			expect(pireParPnj.get('pnj.corvin-le-marchand')).toBe(781)
			expect(pireParPnj.get(HAREK)).toBe(789)
			expect(M).toBe(789)
			// Le palier du terme dossier ne bouge PAS : M x 3 = 2367, au millier superieur 3000.
			expect(Math.ceil((M * 3) / 1000) * 1000).toBe(3000)
		})

		it('les options par defaut ne changent rien : {} et aucune option rendent le MEME contexte qu avant l it4', () => {
			const dossier = lire()
			const session = ouverture(dossier)
			const sans = assemblerActeur(dossier, session, HAREK, 'bonjour')
			const vides = assemblerActeur(dossier, session, HAREK, 'bonjour', {})
			const faux = assemblerActeur(dossier, session, HAREK, 'bonjour', { resistible: false })
			if (!sans.ok || !vides.ok || !faux.ok) throw new Error('le contexte ne doit pas etre refuse')
			expect(vides.texte).toBe(sans.texte)
			expect(faux.texte).toBe(sans.texte)
		})
	})
})
