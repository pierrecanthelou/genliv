import fs from 'node:fs'
import path from 'node:path'
import { assemblerArbitre, BUDGET_CARACTERES_ARBITRE } from './arbitre'
import type { CibleArbitre } from '../types'
import { MARQUEUR_A_ECRIRE } from '../../dossier/amorce'
import type { Dossier } from '../../dossier/types'

/**
 * `assemblerArbitre` — LE CONTEXTE INJECTÉ AU NEUVIÈME RÔLE (n° 11 `moteur-arbitre`,
 * lot `contrat`, it2, § 4 bis du plan).
 *
 * LES DOSSIERS SONT LUS DU DISQUE, jamais fabriqués pour les cas nominaux — précédent
 * `commandes.test.ts`/`contexte.test.ts`. Les cas limites (refus, budget) fabriquent
 * un dossier minimal, parce qu'aucune fixture partagée ne porte l'état séparateur
 * (un lieu sans description, un texte au-delà du budget).
 */

const CHEMIN_REFERENCE = path.join(__dirname, '..', '..', 'dossier', '__fixtures__', 'dossier-reference.json')

function lireReference(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

function cible(saisie: string, lieuId: string): CibleArbitre {
	return { role: 'arbitre', saisie, lieuId }
}

/** Un dossier MINIMAL pour les cas limites — un seul lieu, DÉCRIT, SANS dangers.
 *  `ton`/`interdits_ton` à `''`/`[]` — « non rédigé », jamais `undefined` : les
 *  deux champs sont REQUIS par le schéma (`Canon`), l'absence s'y lit par le
 *  contenu vide, exactement comme `estRedige` la constate. */
function dossierMinimal(): Dossier {
	const reference = lireReference()
	return {
		...reference,
		canon: { ...reference.canon, ton: '', interdits_ton: [] },
		monde: {
			...reference.monde,
			lieux: [{ id: 'lieu.seul', nom: 'Le lieu seul', description: 'Une salle nue, sans fenêtre.' }],
		},
	}
}

describe('assemblerArbitre — les deux refus, AVANT tout fetch', () => {
	it('cible-a-ecrire : lieuId ne resout dans aucun monde.lieux[]', () => {
		const dossier = lireReference()

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.inexistant'))

		expect(contexte).toEqual({ ok: false, motif: 'cible-a-ecrire' })
	})

	it('cible-a-ecrire : le lieu existe mais sa description est ABSENTE', () => {
		const dossier = lireReference()
		// `lieu.marche-des-cendres` n a ni description ni dangers (fixture reelle).
		const sansDescription = dossier.monde.lieux.find((l) => l.id === 'lieu.marche-des-cendres')
		expect(sansDescription?.description).toBeUndefined()

		const contexte = assemblerArbitre(dossier, cible('Je fouille les cendres.', 'lieu.marche-des-cendres'))

		expect(contexte).toEqual({ ok: false, motif: 'cible-a-ecrire' })
	})

	it('cible-a-ecrire : la description est MARQUEE (jamais injectee verbatim le marqueur)', () => {
		const dossier = dossierMinimal()
		dossier.monde.lieux[0].description = `Une salle ${MARQUEUR_A_ECRIRE} encore vide.`

		const contexte = assemblerArbitre(dossier, cible('Je regarde autour de moi.', 'lieu.seul'))

		expect(contexte).toEqual({ ok: false, motif: 'cible-a-ecrire' })
	})

	it('trop-long : une saisie qui depasse a elle seule le budget fait refuser AVANT tout fetch', () => {
		const dossier = dossierMinimal()
		const saisieEnorme = 'x'.repeat(BUDGET_CARACTERES_ARBITRE + 1000)

		const contexte = assemblerArbitre(dossier, cible(saisieEnorme, 'lieu.seul'))

		expect(contexte).toEqual({ ok: false, motif: 'trop-long' })
	})
})

describe('assemblerArbitre — le contenu injecte, dans l ordre du plan it2 § 4 bis', () => {
	it('ICI porte la description, et AUCUNE ligne de dangers quand il est absent', () => {
		const dossier = dossierMinimal()

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte).toContain('ICI\nUne salle nue, sans fenêtre.')
		// AUCUNE ligne de remplacement, AUCUN refus : l absence de dangers est SILENCE.
		expect(contexte.texte).not.toMatch(/dangers/i)
	})

	it('ICI porte dangers QUAND il est redige, en seconde ligne du bloc', () => {
		const dossier = dossierMinimal()
		dossier.monde.lieux[0].dangers = 'Un courant d air glace siffle depuis le couloir.'

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte).toContain(
			'ICI\nUne salle nue, sans fenêtre.\nUn courant d air glace siffle depuis le couloir.',
		)
	})

	it('le CANON est absent quand ni ton ni interdits_ton ne sont ecrits', () => {
		const dossier = dossierMinimal()

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte).not.toContain('canon.ton')
		expect(contexte.texte).not.toContain('canon.interdits_ton')
	})

	it('le CANON entre QUAND il est ecrit, un bloc par chemin, prefixe du chemin', () => {
		const dossier = dossierMinimal()
		dossier.canon = { ...dossier.canon, ton: 'sec et méfiant', interdits_ton: ['aucun anachronisme'] }

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte).toContain('canon.ton\nsec et méfiant')
		expect(contexte.texte).toContain('canon.interdits_ton[]\naucun anachronisme')
	})

	it('CATALOGUE porte 8 lignes de CHARACTERISTICS puis 4 de CHALLENGE_TIERS, jamais la notation ni baseXp', () => {
		const dossier = dossierMinimal()

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte).toContain('CATALOGUE\nFO — Force : Puissance physique.')
		expect(contexte.texte).toContain('CA — Caractère : Volonté et résilience mentale.')
		expect(contexte.texte).toContain('TC1 — Simple')
		expect(contexte.texte).toContain('TC4 — Impossible')
		// JAMAIS la notation de dés (ex. "2D5") ni baseXp — le modèle choisit par la
		// fiction, jamais par la probabilité (§ 8 #14 du plan it2).
		expect(contexte.texte).not.toMatch(/\dD\d/)
		expect(contexte.texte).not.toContain('baseXp')
	})

	it('la saisie est EN DERNIER, normalisee (trim + espaces collapses)', () => {
		const dossier = dossierMinimal()

		const contexte = assemblerArbitre(dossier, cible('  Je   force   la porte.  ', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		expect(contexte.texte.endsWith('saisie\nJe force la porte.')).toBe(true)
	})

	it('AUCUN identifiant du dossier, AUCUN champ de heros — structurellement absent (CibleArbitre n a pas de session)', () => {
		const dossier = dossierMinimal()

		const contexte = assemblerArbitre(dossier, cible('Je force la porte.', 'lieu.seul'))
		if (!contexte.ok) throw new Error(`refusé (${contexte.motif})`)

		// `lieu.seul` lui-même ne doit jamais apparaître : seule sa PROSE est injectée.
		expect(contexte.texte).not.toContain('lieu.seul')
	})
})
