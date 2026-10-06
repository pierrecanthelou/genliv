import fs from 'node:fs'
import path from 'node:path'
import { MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import {
	COMMANDES,
	analyserSaisie,
	destinationsPossibles,
	executerCommande,
	personnagesPresents,
	type CommandeId,
} from '../dossier/commandes'
import { DESTINATION_DES_CHAMPS } from '../dossier/destinations'
import type { DeltaJournalise } from '../dossier/evaluate'
import type { ExprNode } from '../dossier/expr'
import { feuillesDeLaFixture } from '../dossier/feuilles'
import { collectIds } from '../dossier/identifiers'
import { LIBELLE_DES_CHAMPS } from '../dossier/libelles'
import {
	CADENCE,
	FAITS_INJECTES_MAX,
	FENETRE_MAX,
	FENETRE_MIN,
	faitsPertinents,
	pasACondenser,
} from '../dossier/memoire'
import { consignerNarration } from '../dossier/recit'
import { consignerJet, fixerHeros, ouvrirSession, type EtatSession, type FaitEtabli } from '../dossier/session'
import type { HeroState } from '../../player/types'
import {
	CERTITUDE_INITIALE,
	INTENSITE_INITIALE,
	type Dossier,
	type Objet,
	type Personnage,
	type PlanAction,
	type Portee,
} from '../dossier/types'
import { controlerDossier } from '../dossier/controles'
import type {
	CibleCopilote,
	CibleDistribution,
	CibleIndice,
	CiblePlan,
	CibleRelations,
	CibleRepliques,
} from '../CopiloteService'
import {
	assemblerArbitre,
	assemblerDetenteurs,
	assemblerDistribution,
	assemblerInterprete,
	assemblerNarrateur,
	assemblerPlan,
	assemblerProse,
	assemblerRelations,
	assemblerRepliques,
	BUDGET_CARACTERES_ARBITRE,
	BUDGET_CARACTERES_CONTEXTE,
	BUDGET_CARACTERES_NARRATEUR,
	CANDIDATS_MAX,
	CHAMPS_INJECTES,
	DEJA_ECRITS_MAX,
	DEROGATIONS_AUDIENCE,
	PARTIES_REQUISES,
	SAISIE_CARACTERES_MAX,
} from './contexte'
import { CHEMIN_ACTION_DE_PLAN, CHEMIN_SI_BLOQUE, lignesPendantCeTemps } from './contexte/horloge'
import { AMORCE_ISSUE, BORNE_JET, BORNE_MEMOIRE, CHAMPS_INJECTES_NARRATEUR } from './contexte/narrateur'
import { DESTINATION_DES_CHAMPS_DE_SESSION } from '../dossier/sessionDestinations'
import { CONDENSE_CARACTERES_MAX, FAIT_CARACTERES_MAX, NARRATION_CARACTERES_MAX } from './schemaSortie'
import { CHAMPS_PROPOSABLES, type ChampProseChemin, type CibleArbitre, type CibleNarrateur } from './types'

const ROLE = 'personnage-prose'
/** Les DEUX budgets sont lus du MÊME `Record` : un scalaire aliasé re-créerait à
 *  l'échelle du test la panne que le `Record` ferme au contrat (KR-235). */
const BUDGET_PROSE = BUDGET_CARACTERES_CONTEXTE[ROLE]
/** Le préfixe des chemins RESTREINTS à la fiche désignée — le même que celui de
 *  `contexte.ts`, écrit ici parce que le test doit savoir découper les douze
 *  chemins en deux familles (le canon, global ; la fiche, désignée). */
const PREFIXE_PERSONNAGE = 'monde.personnages[].'

const CHEMIN_REFERENCE = path.join(__dirname, '..', 'dossier', '__fixtures__', 'dossier-reference.json')

/** LES FICHIERS BALAYÉS À LA SOURCE, depuis la scission de `contexte.ts` en dossier.
 *  MESURE DE L'ÉTAPE A, CONTRE LA PRÉDICTION DU PLAN : la scission ne change AUCUNE
 *  instruction d'import (les cinq sites écrivent `…/copilote/contexte` sans
 *  extension), mais ce fichier-ci ne se contente pas d'IMPORTER — deux de ses gardes
 *  LISENT le module sur DISQUE, et un chemin de disque, lui, se déplace. C'est le
 *  seul diff de l'étape A hors des fichiers créés. */
const CHEMIN_CORPS_REPLIQUES = path.join(__dirname, 'contexte', 'repliques.ts')
const CHEMIN_REGISTRES = path.join(__dirname, 'contexte', 'registres.ts')
const CHEMIN_NOYAU = path.join(__dirname, 'contexte', 'noyau.ts')

/** Le dossier de RÉFÉRENCE, LU DU DISQUE à chaque appel (KR-156) — jamais un
 *  littéral inline. */
function dossierDeReference(): Dossier {
	return JSON.parse(fs.readFileSync(CHEMIN_REFERENCE, 'utf8')) as Dossier
}

const CHEMINS = CHAMPS_INJECTES[ROLE]
const CHEMINS_DE_FICHE = CHEMINS.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_DE_CANON = CHEMINS.filter((chemin) => !chemin.startsWith(PREFIXE_PERSONNAGE))

/** Les chemins d'un document qui portent une CHAÎNE NON VIDE, au vocabulaire
 *  normalisé de `feuillesDeLaFixture` — la même normalisation que
 *  `DESTINATION_DES_CHAMPS` et que `CHAMPS_INJECTES`. */
function cheminsRemplis(document: unknown, prefixe = ''): Set<string> {
	const remplis = new Set<string>()
	for (const feuille of feuillesDeLaFixture(document)) {
		if (typeof feuille.valeur === 'string' && feuille.valeur.trim() !== '')
			remplis.add(`${prefixe}${feuille.normalise}`)
	}
	return remplis
}

/**
 * L'ENTITÉ DE MESURE — et sa construction est le point délicat de tout ce
 * fichier, donc elle est écrite ici plutôt que supposée.
 *
 * Le protocole du plan exige que LES DOUZE chemins résolvent NON VIDES avant de
 * relever `M` : sinon le nombre relevé est un PLANCHER, pas une mesure, et le
 * budget qu'on en dérive protège moins que ce qu'il prétend.
 *
 * Or AUCUN personnage de `dossier-reference.json` ne remplit les huit chemins de
 * fiche : le mieux rempli en porte six (les trois proses, la voix, la limite, une
 * action de plan) et n'a PAS de `but` ; le seul qui porte un `but` n'a aucune des
 * trois proses. Le fichier de fixture n'appartient pas au lot contrat de cette
 * itération — on ne le touche pas.
 *
 * L'entité de mesure est donc COMPOSÉE, jamais inventée : on prend le personnage
 * le mieux rempli et on lui GREFFE le `but` du seul porteur du dossier. Toutes
 * les valeurs viennent du document réel, aucune n'est écrite ici, et une fiche
 * portant à la fois ses proses et son but est un état parfaitement atteignable —
 * la fixture ne l'instancie simplement pas.
 */
function mesure(): { dossier: Dossier; entite: Personnage } {
	const reference = dossierDeReference()
	const personnages = reference.monde.personnages
	const note = (personnage: Personnage): number => {
		const remplis = cheminsRemplis(personnage, PREFIXE_PERSONNAGE)
		return CHEMINS_DE_FICHE.filter((chemin) => remplis.has(chemin)).length
	}
	const leMieuxRempli = personnages.reduce((meilleur, candidat) =>
		note(candidat) > note(meilleur) ? candidat : meilleur,
	)
	const porteurDeBut = personnages.find((personnage) => personnage.but !== undefined)
	if (porteurDeBut === undefined) throw new Error('la fixture de référence ne porte aucun `but` : mesure impossible')
	const entite: Personnage = { ...leMieuxRempli, but: porteurDeBut.but }
	return {
		entite,
		dossier: {
			...reference,
			monde: {
				...reference.monde,
				personnages: personnages.map((personnage) => (personnage.id === entite.id ? entite : personnage)),
			},
		},
	}
}

function cibleSur(entiteId: string, champ: ChampProseChemin): CibleCopilote {
	return { role: ROLE, entiteId, champ }
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé — aucune branche de
 *  lecture optimiste (`as`) sur une union discriminée. */
function texteAssemble(dossier: Dossier, cible: CibleCopilote): string {
	const contexte = assemblerProse(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte.texte
}

describe('assemblerProse — confinement d audience', () => {
	it('les 12 chemins injectes ont tous la destination ia, et il y en a douze', () => {
		expect(CHEMINS).toHaveLength(12)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les
		// écarts NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
	})

	it('DEROGATIONS_AUDIENCE est vide, et le test l asserte', () => {
		// La soupape EXISTE pour qu'on puisse voir qu'elle est vide (KR-232). Une
		// dérogation est une décision d'audience, elle ne se prend pas par défaut.
		expect(DEROGATIONS_AUDIENCE).toEqual([])
	})

	it('tout ce que porte le contexte assemble vient d un chemin autorise', () => {
		const { dossier, entite } = mesure()
		const texte = texteAssemble(dossier, cibleSur(entite.id, 'monde.personnages[].fonction'))

		const blocs = texte.split('\n\n')
		const chemins = blocs.map((bloc) => bloc.split('\n')[0])
		// (a) les ÉTIQUETTES : aucun bloc ne nomme un chemin hors de la liste.
		expect(chemins.filter((chemin) => !CHEMINS.includes(chemin))).toEqual([])

		// (b) les VALEURS : chaque ligne de valeur est une feuille du dossier vivant
		// sous un chemin autorisé. Inclusion de CHEMINS, AUCUN seuil numérique — un
		// garde à seuil est aveugle aux nombres et aux étiquettes courtes, et il
		// apprend à modifier le témoin (KR-235).
		const autorisees = new Set<string>()
		for (const feuille of feuillesDeLaFixture(dossier)) {
			if (typeof feuille.valeur !== 'string') continue
			const surLaFiche = feuille.concret.startsWith(`monde.personnages[${dossier.monde.personnages.indexOf(entite)}]`)
			const estDeLaFiche = feuille.normalise.startsWith(PREFIXE_PERSONNAGE)
			if (estDeLaFiche && !surLaFiche) continue
			if (CHEMINS.includes(feuille.normalise)) autorisees.add(feuille.valeur)
		}
		const lignesDeValeur = blocs.flatMap((bloc) => bloc.split('\n').slice(1))
		expect(lignesDeValeur.filter((ligne) => !autorisees.has(ligne))).toEqual([])
		// Discriminant : sans cette ligne, un contexte VIDE passerait les deux
		// assertions ci-dessus.
		expect(lignesDeValeur.length).toBeGreaterThan(0)
	})

	it('aucune fiche etrangere n entre dans le contexte', () => {
		const { dossier, entite } = mesure()
		const texte = texteAssemble(dossier, cibleSur(entite.id, 'monde.personnages[].fonction'))
		const contexte = assemblerProse(dossier, cibleSur(entite.id, 'monde.personnages[].fonction'))

		expect(contexte.ok && contexte.entitesInjectees).toEqual([entite.id])
		// Les proses des AUTRES personnages ne sont pas dans le texte — et le test
		// prouve d'abord qu'il en existe, sinon il ne mesure rien.
		const etrangeres = dossier.monde.personnages
			.filter((personnage) => personnage.id !== entite.id)
			.flatMap((personnage) => [personnage.fonction, personnage.apparence, personnage.description_joueur])
			.filter((prose): prose is string => typeof prose === 'string' && prose.trim() !== '')
		expect(etrangeres.length).toBeGreaterThan(0)
		expect(etrangeres.filter((prose) => texte.includes(prose))).toEqual([])
	})

	it('le champ CIBLE n est jamais injecte dans sa propre demande', () => {
		const { dossier, entite } = mesure()
		for (const chemin of Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]) {
			const texte = texteAssemble(dossier, cibleSur(entite.id, chemin))
			expect(texte.split('\n\n').map((bloc) => bloc.split('\n')[0])).not.toContain(chemin)
			// Et les DEUX autres proses y sont bien, elles : sans cette moitié, un
			// assembleur qui n'injecterait AUCUNE prose passerait le test.
			const autres = (Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]).filter((autre) => autre !== chemin)
			for (const autre of autres) expect(texte).toContain(autre)
		}
	})

	it('CHAMPS_PROPOSABLES compte exactement trois entrees, toutes injectees et toutes libellees', () => {
		const proposables = Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]
		expect(proposables).toHaveLength(3)
		expect(proposables.filter((chemin) => !CHEMINS.includes(chemin))).toEqual([])
		expect(proposables.filter((chemin) => LIBELLE_DES_CHAMPS[chemin] === undefined)).toEqual([])
	})
})

describe('assemblerProse — le marqueur vide une partie requise', () => {
	/** Le seul champ requis de l'it1 — lu du registre, jamais re-listé. */
	const REQUIS = PARTIES_REQUISES[ROLE]

	it('PARTIES_REQUISES porte canon.ton, et son libelle d ecran existe', () => {
		expect(REQUIS).toEqual(['canon.ton'])
		// Le typage en `CheminLibelle` rend ceci vrai à la compilation ; l'assertion
		// dit à un lecteur POURQUOI le texte de refus n'a aucune branche de repli.
		expect(REQUIS.map((chemin) => LIBELLE_DES_CHAMPS[chemin].libelle)).toEqual(['TON'])
	})

	it('un canon.ton marque vide la partie requise, et aucun appel reseau ne part', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, entite } = mesure()
			// Le ton d'un dossier NEUF : `construireAmorce` y écrit le marqueur.
			const marque: Dossier = {
				...dossier,
				canon: { ...dossier.canon, ton: `${MARQUEUR_A_ECRIRE} Le registre de langue de cette aventure.` },
			}

			const contexte = assemblerProse(marque, cibleSur(entite.id, 'monde.personnages[].fonction'))

			expect(contexte).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('un champ marque est RETIRE, jamais remplace par une chaine vide', () => {
		const { dossier, entite } = mesure()
		const marque: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id ? { ...personnage, apparence: `${MARQUEUR_A_ECRIRE} à décrire` } : personnage,
				),
			},
		}

		const texte = texteAssemble(marque, cibleSur(entite.id, 'monde.personnages[].fonction'))

		// RETRAIT : le bloc n'existe pas. Une substitution par `''` laisserait
		// l'étiquette du chemin suivie d'une ligne vide — et enseignerait au modèle
		// « ce personnage n'a pas d'apparence », qui est une AFFIRMATION.
		expect(texte).not.toContain('monde.personnages[].apparence')
		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
	})

	it('une liste interdits_ton vide est un etat calme, jamais un manque', () => {
		const { dossier, entite } = mesure()
		const sansInterdits: Dossier = { ...dossier, canon: { ...dossier.canon, interdits_ton: [] } }

		const contexte = assemblerProse(sansInterdits, cibleSur(entite.id, 'monde.personnages[].fonction'))

		expect(contexte.ok).toBe(true)
		expect(contexte.ok && contexte.texte).not.toContain('canon.interdits_ton[]')
	})
})

describe('assemblerProse — mesure du budget', () => {
	/**
	 * L'ORDRE DES TROIS TEMPS EST LE PROTOCOLE, et il est dans un seul test parce
	 * que les trois ne valent que dans cet ordre : la non-vacuité d'abord, la
	 * mesure ensuite, la formule en dernier. Relever `M` sans la première, c'est
	 * relever un plancher.
	 */
	it('les 12 chemins resolvent non vides, puis M, puis la formule', () => {
		const { dossier, entite } = mesure()

		// TEMPS 1 — non-vacuité, chemin par chemin, NOMMÉE (jamais un compte).
		const remplisDuCanon = cheminsRemplis(dossier)
		const remplisDeLaFiche = cheminsRemplis(entite, PREFIXE_PERSONNAGE)
		const vides = [
			...CHEMINS_DE_CANON.filter((chemin) => !remplisDuCanon.has(chemin)),
			...CHEMINS_DE_FICHE.filter((chemin) => !remplisDeLaFiche.has(chemin)),
		]
		expect(vides).toEqual([])
		// Et DEUX des douze sont des collections non bornées : c'est ce qui rend le
		// refus `trop-long` réellement atteignable, pas seulement représentable.
		expect(CHEMINS.filter((chemin) => chemin.endsWith('[]') || chemin.includes('[].', 1))).not.toHaveLength(0)

		// TEMPS 2 — M, maximum sur les trois cibles possibles : la cible est RETIRÉE
		// de sa propre demande, donc chacune donne un texte différent, et le budget
		// doit couvrir le pire des trois.
		const M = Math.max(
			...(Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]).map(
				(champ) => texteAssemble(dossier, cibleSur(entite.id, champ)).length,
			),
		)
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au
		// millier supérieur : l'arrondi EST la marge. Ce n'est PAS un cliquet — le
		// jour où `CHAMPS_INJECTES` s'élargit, cette ligne rougit et la constante se
		// RE-DÉRIVE sur la nouvelle mesure.
		expect(BUDGET_PROSE).toBe(Math.ceil((M * 3) / 1000) * 1000)
	})

	/**
	 * LE CANARI DE PLAFOND, à ±1 CARACTÈRE. Un plafond dont personne n'a éprouvé
	 * les deux bords est une intention, pas une borne : il pourrait être un `>=`
	 * pour un `>`, ou porter sur la mauvaise grandeur, sans qu'un test rougisse.
	 */
	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		const { dossier, entite } = mesure()
		const cible = cibleSur(entite.id, 'monde.personnages[].fonction')
		const avecSynopsis = (synopsis: string): Dossier => ({
			...dossier,
			canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: synopsis } },
		})

		// La longueur du texte assemblé est AFFINE en celle du synopsis : on mesure
		// l'ordonnée à l'origine sur un synopsis d'un caractère, puis on vise.
		const socle = texteAssemble(avecSynopsis('x'), cible).length - 1
		const aLaLimite = texteAssemble(avecSynopsis('x'.repeat(BUDGET_PROSE - socle)), cible)
		expect(aLaLimite).toHaveLength(BUDGET_PROSE)

		expect(assemblerProse(avecSynopsis('x'.repeat(BUDGET_PROSE - socle)), cible).ok).toBe(true)
		expect(assemblerProse(avecSynopsis('x'.repeat(BUDGET_PROSE - socle + 1)), cible)).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('le refus trop-long ne porte aucune charge, et aucun appel reseau ne part', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, entite } = mesure()
			const enorme: Dossier = {
				...dossier,
				canon: {
					...dossier.canon,
					mj: { ...dossier.canon.mj, synopsis_mj: 'x'.repeat(BUDGET_PROSE + 1) },
				},
			}

			const contexte = assemblerProse(enorme, cibleSur(entite.id, 'monde.personnages[].fonction'))

			// AUCUN `chemin` : « trop long » ne pointe pas un champ, il pointe la fiche.
			expect(contexte).toEqual({ ok: false, motif: 'trop-long' })
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('deux assemblages de la meme cible sur un dossier inchange sont strictement egaux', () => {
		// L'ABSENCE DE MÉMOIRE commence ici : ni date, ni identifiant, ni aléa dans
		// le texte. Sans cette propriété, « deux lancers ⇒ deux corps identiques »
		// n'est pas démontrable par égalité stricte.
		const { dossier, entite } = mesure()
		const cible = cibleSur(entite.id, 'monde.personnages[].apparence')

		expect(texteAssemble(dossier, cible)).toBe(texteAssemble(dossier, cible))
	})
})

// ══ LE SECOND RÔLE — `indice-detenteurs` ═════════════════════════════════════

const ROLE_DETENTEURS = 'indice-detenteurs'
const PREFIXE_INDICE = 'monde.indices[].'
const BUDGET_DETENTEURS = BUDGET_CARACTERES_CONTEXTE[ROLE_DETENTEURS]

const CHEMINS_D = CHAMPS_INJECTES[ROLE_DETENTEURS]
const CHEMINS_DE_L_INDICE = CHEMINS_D.filter((chemin) => chemin.startsWith(PREFIXE_INDICE))
const CHEMINS_DU_CANDIDAT = CHEMINS_D.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_DU_CANON_D = CHEMINS_D.filter(
	(chemin) => !chemin.startsWith(PREFIXE_INDICE) && !chemin.startsWith(PREFIXE_PERSONNAGE),
)

/** LA valeur RÉELLE la plus longue que la fixture porte sous ce chemin. Elle est
 *  LUE du document, jamais écrite ici : composer un dossier de mesure avec des
 *  chaînes inventées mesurerait la longueur de ce que l'ouvrier a tapé, pas celle
 *  d'un dossier d'auteur. La plus LONGUE parce que `M` doit être un PIRE CAS à K
 *  saturé — un cas moyen donnerait un budget qui refuserait des dossiers légitimes. */
function valeurLaPlusLongue(document: unknown, chemin: string): string {
	const valeurs = feuillesDeLaFixture(document)
		.filter((feuille) => feuille.normalise === chemin && typeof feuille.valeur === 'string')
		.map((feuille) => String(feuille.valeur))
		.filter((valeur) => valeur.trim() !== '')
	if (valeurs.length === 0) throw new Error(`la fixture de référence ne porte aucune valeur sous ${chemin}`)
	return valeurs.reduce((meilleure, candidate) => (candidate.length > meilleure.length ? candidate : meilleure))
}

/** Les SIX valeurs réelles dont le dossier de mesure est composé — une par chemin
 *  de feuille du rôle qui n'est pas dans le canon. Toutes viennent du document. */
function valeursReelles(reference: Dossier): Record<string, string> {
	return Object.fromEntries(
		[...CHEMINS_DE_L_INDICE, ...CHEMINS_DU_CANDIDAT].map((chemin) => [chemin, valeurLaPlusLongue(reference, chemin)]),
	)
}

/** Un candidat COMPLET — ses QUATRE chemins remplis avec les valeurs réelles les
 *  plus longues du dossier. `nom` vient d'un personnage réel : c'est ce qui rend
 *  le témoin « aucun nom n'est injecté » capable d'échouer. */
function candidatPlein(modele: Personnage, id: string, portee: Portee, valeurs: Record<string, string>): Personnage {
	return {
		id,
		nom: modele.nom,
		portee,
		savoirs: [],
		plan_actions: [{ etape: 1, action: valeurs['monde.personnages[].plan_actions[].action'] }],
		fonction: valeurs['monde.personnages[].fonction'],
		description_joueur: valeurs['monde.personnages[].description_joueur'],
		but: { libelle: valeurs['monde.personnages[].but.libelle'] },
	}
}

/**
 * LE DOSSIER DE MESURE DU SECOND RÔLE — COMPOSÉ PAR LE TEST, jamais inventé, et
 * jamais la fixture (qui n'appartient à aucun lot de cette itération).
 *
 * Le protocole exige `CANDIDATS_MAX` SATURÉ et les NEUF chemins non vides. Or
 * `dossier-reference.json` ne porte que SIX personnages, dont deux seulement ont
 * une `fonction`, un seul une `description_joueur` et un seul un `but` ; et son
 * unique indice signalé n'a NI `verite` NI `formulation_joueur` — c'est d'ailleurs
 * l'écran nominal de la fixture, le refus `cible-a-ecrire`.
 *
 * On compose donc : l'indice cible reçoit la `verite` et la `formulation_joueur`
 * réelles les plus longues du dossier, et `CANDIDATS_MAX` candidats reçoivent les
 * quatre valeurs de personnage réelles les plus longues. UN détenteur actuel est
 * ajouté EN TÊTE, lui aussi complet : c'est ce qui rend « un détenteur n'est pas
 * filtré, il est inénonçable » observable plutôt qu'affirmé.
 *
 * La `certitude` de ce détenteur est `CERTITUDE_INITIALE` — importée, jamais
 * retapée : c'est la MÊME autorité que l'éditeur manuel.
 */
function mesureDetenteurs(): {
	dossier: Dossier
	cible: CibleIndice
	detenteurId: string
	rangsAttendus: string[]
} {
	const reference = dossierDeReference()
	const valeurs = valeursReelles(reference)
	const modeles = reference.monde.personnages
	const indiceCible = {
		...reference.monde.indices[0],
		verite: valeurs['monde.indices[].verite'],
		formulation_joueur: valeurs['monde.indices[].formulation_joueur'],
	}

	const detenteur: Personnage = {
		...candidatPlein(modeles[0], `${modeles[0].id}-detenteur`, 'premier', valeurs),
		savoirs: [{ indice_id: indiceCible.id, certitude: CERTITUDE_INITIALE }],
	}
	// Les portées ALTERNENT : sans cela, « `premier` d'abord, puis l'ordre du
	// document » serait indistinguable de « l'ordre du document » tout court.
	const candidats = Array.from({ length: CANDIDATS_MAX }, (_, rang) =>
		candidatPlein(
			modeles[rang % modeles.length],
			`${modeles[rang % modeles.length].id}-c${rang}`,
			rang % 2 === 0 ? 'second' : 'premier',
			valeurs,
		),
	)

	return {
		dossier: {
			...reference,
			monde: {
				...reference.monde,
				indices: reference.monde.indices.map((indice) => (indice.id === indiceCible.id ? indiceCible : indice)),
				personnages: [detenteur, ...candidats],
			},
		},
		cible: { role: ROLE_DETENTEURS, indiceId: indiceCible.id },
		detenteurId: detenteur.id,
		// `premier` d'abord, puis l'ordre du document — le détenteur, lui, n'y est pas.
		rangsAttendus: [
			...candidats.filter((candidat) => candidat.portee === 'premier').map((candidat) => candidat.id),
			...candidats.filter((candidat) => candidat.portee !== 'premier').map((candidat) => candidat.id),
		],
	}
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé. */
function contexteDetenteurs(
	dossier: Dossier,
	cible: CibleIndice,
): {
	texte: string
	entitesInjectees: readonly string[]
	rangs: ReadonlyMap<string, string>
} {
	const contexte = assemblerDetenteurs(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte
}

describe('assemblerDetenteurs — confinement d audience du second role', () => {
	it('confinement d audience du second role', () => {
		expect(CHEMINS_D).toHaveLength(9)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les
		// écarts NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS_D.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
		// La soupape n'a pas bougé : injecter `verite` n'est PAS une dérogation
		// d'audience — le champ est DÉJÀ `ia` —, c'est la levée d'une CONDITION
		// TEMPORELLE, ré-écrite à ses deux sites par ce lot.
		expect(DEROGATIONS_AUDIENCE).toEqual([])
		// Et le chemin requis de la cible est bien l'un des neuf : il n'est pas
		// re-listé dans `contexte.ts`, il y est NOMMÉ.
		expect(CHEMINS_D).toContain('monde.indices[].verite')
	})

	it('aucun nom n est injecte', () => {
		// KR-195 : `Entite.nom` est d'audience `auteur`, aux DEUX temps. (a) aucun des
		// neuf chemins ne résout vers un `nom` ;
		expect(CHEMINS_D.filter((chemin) => chemin.endsWith('.nom'))).toEqual([])

		// (b) et le texte réellement assemblé n'en porte aucun. Le test prouve d'abord
		// qu'il EXISTE des noms à trouver, sinon il ne mesure rien.
		const { dossier, cible } = mesureDetenteurs()
		const { texte } = contexteDetenteurs(dossier, cible)
		const noms = [
			...dossier.monde.personnages.map((personnage) => personnage.nom),
			...dossier.monde.indices.map((indice) => indice.nom),
		].filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')

		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => texte.includes(nom))).toEqual([])
	})

	it('entitesInjectees egale cible plus rangs', () => {
		const { dossier, cible } = mesureDetenteurs()
		const { entitesInjectees, rangs } = contexteDetenteurs(dossier, cible)

		// ÉGALITÉ, jamais inclusion : un `⊆` resterait vert sur une entité injectée
		// qu'on aurait oublié d'auditer — le trou que cet audit existe pour fermer.
		expect(entitesInjectees).toEqual([cible.indiceId, ...rangs.values()])
		// Discriminant : sans lui, une table de rangs VIDE satisferait l'égalité.
		expect(rangs.size).toBe(CANDIDATS_MAX)
	})

	it('un detenteur actuel ne recoit aucun rang', () => {
		// ANTI-COMPLAISANCE (b) : « proposer celui qui détient déjà » n'est pas
		// découragé, c'est IMPOSSIBLE — il n'a ni bloc ni rang, donc il est
		// INÉNONÇABLE. C'est pourquoi on ne re-filtre PAS à l'acceptation (§ 8, TL-7).
		const { dossier, cible, detenteurId } = mesureDetenteurs()
		const { texte, entitesInjectees, rangs } = contexteDetenteurs(dossier, cible)

		expect([...rangs.values()]).not.toContain(detenteurId)
		expect(entitesInjectees).not.toContain(detenteurId)
		// Et il était bien détenteur, avec du CONTENU à injecter : sans cette moitié,
		// le test serait vert sur un personnage que rien n'aurait retenu de toute façon.
		const detenteur = dossier.monde.personnages.find((personnage) => personnage.id === detenteurId)
		expect(detenteur?.savoirs.map((savoir) => savoir.indice_id)).toEqual([cible.indiceId])
		expect(detenteur?.fonction).toBeDefined()
		expect(rangs.size).toBeGreaterThan(0)
		expect(texte).not.toContain(detenteurId)
	})

	it('les rangs suivent premier d abord, puis l ordre du document', () => {
		// `portee` est d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS
		// injectée. Les deux moitiés sont ici.
		const { dossier, cible, rangsAttendus } = mesureDetenteurs()
		const { texte, rangs } = contexteDetenteurs(dossier, cible)

		expect([...rangs.keys()]).toEqual(rangsAttendus.map((_, rang) => `P${rang + 1}`))
		expect([...rangs.values()]).toEqual(rangsAttendus)
		expect(texte).not.toContain('portee')
		expect(texte).not.toContain('premier')
	})

	it('un candidat sans aucun champ ne consomme pas de rang', () => {
		// Un bloc de rang sans une seule ligne enseignerait « ce personnage n'a rien »,
		// ce qui est une AFFIRMATION ; le repli est le SILENCE.
		const { dossier, cible } = mesureDetenteurs()
		const muet: Personnage = { id: 'pnj.muet', portee: 'premier', plan_actions: [], savoirs: [] }
		const avecMuet: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: [dossier.monde.personnages[0], muet, ...dossier.monde.personnages.slice(1, 3)],
			},
		}

		const { texte, rangs, entitesInjectees } = contexteDetenteurs(avecMuet, cible)

		expect([...rangs.values()]).not.toContain(muet.id)
		expect(entitesInjectees).not.toContain(muet.id)
		// Les rangs restent CONTIGUS : `P1`, `P2`, … sans trou.
		expect([...rangs.keys()]).toEqual([...rangs.keys()].map((_, rang) => `P${rang + 1}`))
		expect(rangs.size).toBe(2)
		// Et AUCUN bloc de rang n'est vide — un bloc à une seule ligne serait
		// exactement le mode de panne visé.
		const blocsDeRang = texte.split('\n\n').filter((bloc) => /^P\d+$/.test(bloc.split('\n')[0]))
		expect(blocsDeRang).toHaveLength(2)
		expect(blocsDeRang.filter((bloc) => bloc.split('\n').length < 3)).toEqual([])
	})

	it('troncature de LISTE jamais de CHAINE', () => {
		const { dossier, cible } = mesureDetenteurs()
		const premiere = valeurLaPlusLongue(dossierDeReference(), 'monde.personnages[].plan_actions[].action')
		const seconde = 'Seconde etape, qui ne doit jamais entrer dans le contexte.'
		const bavard: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage, rang) =>
					rang === 1
						? {
								...personnage,
								plan_actions: [
									{ etape: 1, action: premiere },
									{ etape: 2, action: seconde },
								],
							}
						: personnage,
				),
			},
		}

		const { texte } = contexteDetenteurs(bavard, cible)

		// TRONCATURE DE LISTE : la seconde étape n'entre pas.
		expect(texte).toContain(premiere)
		expect(texte).not.toContain(seconde)
		// JAMAIS DE CHAÎNE : chaque ligne de valeur est une valeur ENTIÈRE. Une
		// troncature de chaîne produirait une ligne qui n'est valeur de rien.
		const valeursAutorisees = new Set(
			feuillesDeLaFixture(bavard)
				.filter((feuille) => typeof feuille.valeur === 'string')
				.map((feuille) => String(feuille.valeur)),
		)
		const lignesDeValeur = texte
			.split('\n\n')
			.flatMap((bloc) => bloc.split('\n'))
			.filter((ligne) => !CHEMINS_D.includes(ligne) && !/^P\d+$/.test(ligne))
		expect(lignesDeValeur.filter((ligne) => !valeursAutorisees.has(ligne))).toEqual([])
		expect(lignesDeValeur.length).toBeGreaterThan(0)
	})

	it('la forme du texte : le rang est la PREMIERE ligne du bloc de son candidat', () => {
		const { dossier, cible } = mesureDetenteurs()
		const { texte, rangs } = contexteDetenteurs(dossier, cible)
		const blocs = texte.split('\n\n')

		// L'ordre des familles : le canon, puis l'indice cible, puis les candidats.
		const enTetes = blocs.map((bloc) => bloc.split('\n')[0])
		expect(enTetes.slice(0, CHEMINS_DU_CANON_D.length)).toEqual([...CHEMINS_DU_CANON_D])
		expect(enTetes.slice(CHEMINS_DU_CANON_D.length, CHEMINS_DU_CANON_D.length + CHEMINS_DE_L_INDICE.length)).toEqual([
			...CHEMINS_DE_L_INDICE,
		])
		expect(enTetes.slice(CHEMINS_DU_CANON_D.length + CHEMINS_DE_L_INDICE.length)).toEqual([...rangs.keys()])
		// Aucun en-tête hors de la liste autorisée.
		expect(enTetes.filter((entete) => !CHEMINS_D.includes(entete) && !rangs.has(entete))).toEqual([])
	})

	it('les quatre refus, discrimines', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, cible } = mesureDetenteurs()

			// 1 — `a-ecrire` : le seul motif À CHARGE, et la charge est le chemin.
			const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
			expect(assemblerDetenteurs(sansTon, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// 2 — `cible-a-ecrire` : SUR LA FIXTURE INTACTE, et c'est l'écran NOMINAL du
			// dossier de référence — son unique indice signalé n'a pas de vérité écrite.
			const reference = dossierDeReference()
			const nu = reference.monde.indices.find((indice) => indice.verite === undefined)
			expect(nu).toBeDefined()
			expect(assemblerDetenteurs(reference, { role: ROLE_DETENTEURS, indiceId: String(nu?.id) })).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})
			// Une cible qui ne résout plus du tout emprunte le MÊME refus : « pas de
			// vérité écrite » et « plus d'indice du tout » demandent le même geste.
			expect(assemblerDetenteurs(dossier, { role: ROLE_DETENTEURS, indiceId: 'indice.jamais-existe' })).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})

			// 3 — `aucun-candidat` : tout le monde détient déjà.
			const tousDetenteurs: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.map((personnage) => ({
						...personnage,
						savoirs: [{ indice_id: cible.indiceId, certitude: CERTITUDE_INITIALE }],
					})),
				},
			}
			expect(assemblerDetenteurs(tousDetenteurs, cible)).toEqual({ ok: false, motif: 'aucun-candidat' })

			// 4 — `trop-long` : AUCUNE charge, il pointe la fiche, pas un champ.
			const enorme: Dossier = {
				...dossier,
				canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: 'x'.repeat(BUDGET_DETENTEURS + 1) } },
			}
			expect(assemblerDetenteurs(enorme, cible)).toEqual({ ok: false, motif: 'trop-long' })

			// LES QUATRE SONT DISTINCTS DEUX À DEUX — c'est la moitié que le nom du test
			// promet et qu'une liste d'assertions voisines ne prouverait pas.
			const motifs = [
				assemblerDetenteurs(sansTon, cible),
				assemblerDetenteurs(reference, { role: ROLE_DETENTEURS, indiceId: String(nu?.id) }),
				assemblerDetenteurs(tousDetenteurs, cible),
				assemblerDetenteurs(enorme, cible),
			].map((refus) => (refus.ok ? 'ASSEMBLÉ' : refus.motif))
			expect(new Set(motifs).size).toBe(4)

			// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des quatre.
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('BUDGET par role', () => {
		const { dossier, cible } = mesureDetenteurs()

		// TEMPS 1 — non-vacuité, chemin par chemin, NOMMÉE (jamais un compte). Sans
		// elle, `M` est un PLANCHER et le budget qu'on en dérive protège moins qu'il ne
		// prétend.
		const indice = dossier.monde.indices.find((candidat) => candidat.id === cible.indiceId)
		const vides = [
			...CHEMINS_DU_CANON_D.filter((chemin) => !cheminsRemplis(dossier).has(chemin)),
			...CHEMINS_DE_L_INDICE.filter((chemin) => !cheminsRemplis(indice, PREFIXE_INDICE).has(chemin)),
			...CHEMINS_DU_CANDIDAT.filter(
				(chemin) => !cheminsRemplis(dossier.monde.personnages[1], PREFIXE_PERSONNAGE).has(chemin),
			),
		]
		expect(vides).toEqual([])

		// TEMPS 2 — `M`, `CANDIDATS_MAX` SATURÉ. La saturation fait partie du protocole :
		// mesurer à 3 candidats donnerait un budget que le 4ᵉ ferait exploser.
		const contexte = contexteDetenteurs(dossier, cible)
		expect(contexte.rangs.size).toBe(CANDIDATS_MAX)
		const M = contexte.texte.length
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au millier
		// supérieur : l'arrondi EST la marge. Ce n'est PAS un cliquet.
		expect(BUDGET_DETENTEURS).toBe(Math.ceil((M * 3) / 1000) * 1000)
		// Et le rôle ÉTROIT n'a PAS bougé : c'est tout l'objet du passage au `Record` —
		// un scalaire partagé aurait desserré sa garde d'un facteur ~5 sans un seul
		// test rouge (KR-235).
		expect(BUDGET_PROSE).toBe(6000)
		expect(BUDGET_DETENTEURS).not.toBe(BUDGET_PROSE)
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		// LE CANARI DE PLAFOND, à ±1 CARACTÈRE — un plafond dont personne n'a éprouvé
		// les deux bords est une intention, pas une borne.
		const { dossier, cible } = mesureDetenteurs()
		const avecSynopsis = (synopsis: string): Dossier => ({
			...dossier,
			canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: synopsis } },
		})
		const socle = contexteDetenteurs(avecSynopsis('x'), cible).texte.length - 1

		expect(contexteDetenteurs(avecSynopsis('x'.repeat(BUDGET_DETENTEURS - socle)), cible).texte).toHaveLength(
			BUDGET_DETENTEURS,
		)
		expect(assemblerDetenteurs(avecSynopsis('x'.repeat(BUDGET_DETENTEURS - socle + 1)), cible)).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('deux assemblages de la meme cible sur un dossier inchange sont strictement egaux', () => {
		// L'ABSENCE DE MÉMOIRE commence ici : ni date, ni identifiant de session, ni
		// aléa. Sans cette propriété, « deux lancers ⇒ deux corps identiques » n'est
		// pas démontrable par égalité stricte.
		const { dossier, cible } = mesureDetenteurs()

		expect(contexteDetenteurs(dossier, cible).texte).toBe(contexteDetenteurs(dossier, cible).texte)
	})

	it('le clone enrichi ne change pas le constat', () => {
		// MESURE n° 5 du plan, RE-CONFIRMÉE dans le lot : enrichir l'indice signalé
		// d'une `verite` et d'une `formulation_joueur` est une mutation CHIRURGICALE —
		// elle rend le chemin passant instanciable SANS déplacer la ligne de base du
		// linter. Si elle la déplaçait, le cas de recette composé ne prouverait plus
		// rien du produit réel.
		const reference = dossierDeReference()
		const signales = (document: Dossier): string[] =>
			controlerDossier(document)
				.controles.filter((controle) => controle.id === 'indice-sans-source')
				.map((controle) => `${controle.entityId} → ${controle.niveau}`)
		const avant = signales(reference)
		const cibleId = String(controlerDossier(reference).controles.find((c) => c.id === 'indice-sans-source')?.entityId)

		const clone: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				indices: reference.monde.indices.map((indice) =>
					indice.id === cibleId
						? {
								...indice,
								verite: valeurLaPlusLongue(reference, 'monde.indices[].verite'),
								formulation_joueur: valeurLaPlusLongue(reference, 'monde.indices[].formulation_joueur'),
							}
						: indice,
				),
			},
		}

		expect(avant).toHaveLength(1)
		expect(signales(clone)).toEqual(avant)
		// Et l'enrichissement a bien EU LIEU : sans cette moitié, le test serait vert
		// sur un clone identique à l'original.
		const enrichi = clone.monde.indices.find((indice) => indice.id === cibleId)
		expect(enrichi?.verite).toBeDefined()
		expect(reference.monde.indices.find((indice) => indice.id === cibleId)?.verite).toBeUndefined()
		// Le refus AVANT / l'assemblage APRÈS : c'est exactement ce que l'enrichissement
		// achète, et rien d'autre.
		expect(assemblerDetenteurs(reference, { role: ROLE_DETENTEURS, indiceId: cibleId })).toEqual({
			ok: false,
			motif: 'cible-a-ecrire',
		})
		expect(assemblerDetenteurs(clone, { role: ROLE_DETENTEURS, indiceId: cibleId }).ok).toBe(true)
	})
})

// ══ LE TROISIÈME RÔLE — `personnage-repliques` ═══════════════════════════════

const ROLE_REPLIQUES = 'personnage-repliques'
const BUDGET_REPLIQUES = BUDGET_CARACTERES_CONTEXTE[ROLE_REPLIQUES]

const CHEMINS_R = CHAMPS_INJECTES[ROLE_REPLIQUES]
const CHEMINS_R_DE_FICHE = CHEMINS_R.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_R_DE_CANON = CHEMINS_R.filter((chemin) => !chemin.startsWith(PREFIXE_PERSONNAGE))

/** LA CIBLE de ce rôle : `personnageId`, JAMAIS `entiteId` (§ 8, TL3a-5). */
function cibleRepliques(personnageId: string): CibleRepliques {
	return { role: ROLE_REPLIQUES, personnageId }
}

/**
 * L'ENTITÉ DE MESURE DU TROISIÈME RÔLE — même protocole que l'it1, RE-DÉRIVÉ sur LES
 * CHEMINS DE CE RÔLE-CI et non recopié : le rôle ne partage que six des huit chemins
 * de fiche du rôle prose, et il en porte un que celui-ci n'a pas au même rang.
 *
 * Aucun personnage de `dossier-reference.json` ne remplit les SEPT chemins de fiche :
 * le mieux rempli n'a pas de `but`, et le seul porteur d'un `but` n'a aucune des trois
 * proses. La fixture n'appartient à aucun lot de cette itération — on ne la touche
 * pas. L'entité est donc COMPOSÉE, jamais inventée : le mieux rempli, GREFFÉ du `but`
 * du seul porteur. Toutes les valeurs viennent du document réel.
 */
function mesureRepliques(): { dossier: Dossier; entite: Personnage } {
	const reference = dossierDeReference()
	const personnages = reference.monde.personnages
	const note = (personnage: Personnage): number => {
		const remplis = cheminsRemplis(personnage, PREFIXE_PERSONNAGE)
		return CHEMINS_R_DE_FICHE.filter((chemin) => remplis.has(chemin)).length
	}
	const leMieuxRempli = personnages.reduce((meilleur, candidat) =>
		note(candidat) > note(meilleur) ? candidat : meilleur,
	)
	const porteurDeBut = personnages.find((personnage) => personnage.but !== undefined)
	if (porteurDeBut === undefined) throw new Error('la fixture de référence ne porte aucun `but` : mesure impossible')
	const entite: Personnage = { ...leMieuxRempli, but: porteurDeBut.but }
	return {
		entite,
		dossier: {
			...reference,
			monde: {
				...reference.monde,
				personnages: personnages.map((personnage) => (personnage.id === entite.id ? entite : personnage)),
			},
		},
	}
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé. */
function texteRepliques(dossier: Dossier, cible: CibleRepliques): string {
	const contexte = assemblerRepliques(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte.texte
}

describe('assemblerRepliques — confinement d audience du troisieme role', () => {
	it('confinement du 3e role', () => {
		expect(CHEMINS_R).toHaveLength(10)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les écarts
		// NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS_R.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
		// La soupape n'a pas bougé : un TROISIÈME rôle n'ouvre aucune dérogation
		// d'audience — les dix chemins étaient DÉJÀ `ia` (KR-232).
		expect(DEROGATIONS_AUDIENCE).toEqual([])
	})

	it('tout ce que porte le contexte assemble vient d un chemin autorise — LES DEUX COTES', () => {
		const { dossier, entite } = mesureRepliques()
		const texte = texteRepliques(dossier, cibleRepliques(entite.id))

		const blocs = texte.split('\n\n')
		const enTetes = blocs.map((bloc) => bloc.split('\n')[0])
		// (a) les ÉTIQUETTES : aucun bloc ne nomme un chemin hors de la liste.
		expect(enTetes.filter((chemin) => !CHEMINS_R.includes(chemin))).toEqual([])

		// (b) les VALEURS : chaque ligne de valeur est une feuille du dossier vivant sous
		// un chemin autorisé. Inclusion de CHEMINS, AUCUN seuil numérique (KR-235).
		const autorisees = new Set<string>()
		for (const feuille of feuillesDeLaFixture(dossier)) {
			if (typeof feuille.valeur !== 'string') continue
			const surLaFiche = feuille.concret.startsWith(`monde.personnages[${dossier.monde.personnages.indexOf(entite)}]`)
			const estDeLaFiche = feuille.normalise.startsWith(PREFIXE_PERSONNAGE)
			if (estDeLaFiche && !surLaFiche) continue
			if (CHEMINS_R.includes(feuille.normalise)) autorisees.add(feuille.valeur)
		}
		const lignesDeValeur = blocs.flatMap((bloc) => bloc.split('\n').slice(1))
		expect(lignesDeValeur.filter((ligne) => !autorisees.has(ligne))).toEqual([])

		// LE SECOND CÔTÉ DU TÉMOIN, et sans lui l'assertion négative est INERTE : un
		// contexte VIDE passerait les deux `toEqual([])` ci-dessus sans rien prouver.
		expect(lignesDeValeur.length).toBeGreaterThan(0)
		expect(enTetes).toEqual([...CHEMINS_R])
	})

	it('aucune fiche etrangere n entre dans le contexte', () => {
		const { dossier, entite } = mesureRepliques()
		const contexte = assemblerRepliques(dossier, cibleRepliques(entite.id))
		const texte = texteRepliques(dossier, cibleRepliques(entite.id))

		expect(contexte.ok && contexte.entitesInjectees).toEqual([entite.id])
		// Les proses des AUTRES personnages ne sont pas dans le texte — et le test prouve
		// d'abord qu'il en existe, sinon il ne mesure rien.
		const etrangeres = dossier.monde.personnages
			.filter((personnage) => personnage.id !== entite.id)
			.flatMap((personnage) => [personnage.fonction, personnage.apparence, personnage.description_joueur])
			.filter((prose): prose is string => typeof prose === 'string' && prose.trim() !== '')
		expect(etrangeres.length).toBeGreaterThan(0)
		expect(etrangeres.filter((prose) => texte.includes(prose))).toEqual([])
		// Aucun NOM non plus : `Entite.nom` est d'audience `auteur` (KR-195).
		expect(CHEMINS_R.filter((chemin) => chemin.endsWith('.nom'))).toEqual([])
	})

	it('synopsis_mj absent ici, PRESENT chez prose', () => {
		// L'ASYMÉTRIE DU REGRET, et les DEUX côtés sont ici : une assertion d'absence
		// seule serait verte le jour où le chemin disparaîtrait des DEUX rôles, c'est-à-
		// dire au moment où elle cesserait de mesurer quoi que ce soit (KR-199).
		const SYNOPSIS = 'canon.mj.synopsis_mj'

		expect(CHEMINS_R).not.toContain(SYNOPSIS)
		expect(CHAMPS_INJECTES['personnage-prose']).toContain(SYNOPSIS)

		// Et le TEXTE réellement assemblé ne le porte pas non plus : une liste propre ne
		// prouve rien si l'assembleur allait le chercher par ailleurs. Le test prouve
		// d'abord que le dossier EN PORTE un, sinon il ne mesure rien.
		const { dossier, entite } = mesureRepliques()
		const synopsis = String(dossier.canon.mj?.synopsis_mj ?? '')
		expect(synopsis.trim().length).toBeGreaterThan(0)
		expect(texteRepliques(dossier, cibleRepliques(entite.id))).not.toContain(synopsis)
		// … là où le rôle prose, lui, l'injecte bel et bien.
		expect(texteAssemble(dossier, cibleSur(entite.id, 'monde.personnages[].fonction'))).toContain(synopsis)
	})

	it('cede_si absent de CHAQUE entree', () => {
		// GARDE TL3a-14 : PROPOSER n'est pas INJECTER. Un rôle de rédaction n'est ni
		// narrateur, ni acteur du porteur, ni arbitre — le prédicat n'a pas de sujet.
		// Le balayage porte sur CHAQUE entrée du registre, jamais sur le seul rôle neuf :
		// un ouvrier qui « réparerait l'asymétrie » l'ajouterait ailleurs.
		const fautifs = Object.entries(CHAMPS_INJECTES).flatMap(([role, chemins]) =>
			chemins.filter((chemin) => chemin.includes('cede_si')).map((chemin) => `${role} → ${chemin}`),
		)

		expect(fautifs).toEqual([])
		// Discriminant : le balayage voit bien les SIX entrées — sans lui, un registre
		// vide le rendrait vert (KR-199). Le compte suit le registre, qui fait foi.
		expect(Object.keys(CHAMPS_INJECTES)).toHaveLength(6)
	})

	it('aucun chemin caractere.curseurs.* nulle part', () => {
		// GARDE DU VETO : les six curseurs ne sont ni injectés, ni proposables. Balayage
		// sur TOUTES les entrées, même motif que ci-dessus.
		const fautifs = Object.entries(CHAMPS_INJECTES).flatMap(([role, chemins]) =>
			chemins.filter((chemin) => chemin.includes('curseurs')).map((chemin) => `${role} → ${chemin}`),
		)

		expect(fautifs).toEqual([])
		expect(Object.keys(CHAMPS_INJECTES)).toHaveLength(6)
	})

	it('la cible est absente de la liste blanche', () => {
		// KR-235 : la cible `caractere.parler[]` est exclue PAR ABSENCE, jamais par un
		// saut à l'exécution. Un chemin listé puis systématiquement sauté serait une
		// LIGNE MORTE qu'un bogue de cible pourrait ré-ouvrir.
		const CIBLE = 'monde.personnages[].caractere.parler[]'

		expect(CHEMINS_R).not.toContain(CIBLE)
		// (a) LA PREUVE QUE L'ABSENCE EST LA SEULE GARDE : le CORPS de l'assembleur ne
		// contient AUCUN saut nommant la cible — pas de `continue` conditionné par elle,
		// pas même le mot écrit quelque part. Le balayage est BORNÉ À CE CORPS et non au
		// dossier : le rôle prose, lui, injecte LÉGITIMEMENT `caractere.parler[]`, et une
		// garde posée sur les registres encoderait une COÏNCIDENCE plutôt que l'invariant
		// qu'elle nomme (KR-226).
		const source = fs.readFileSync(CHEMIN_CORPS_REPLIQUES, 'utf8')
		const corps = source.slice(source.indexOf('export function assemblerRepliques('))
		expect(corps).not.toContain('parler')
		// Discriminant : le balayage porte bien sur du code réel, et le mot EXISTE dans
		// le registre que ce corps consulte — sans ces deux lignes, une découpe fautive
		// rendrait l'assertion vraie pour rien (KR-235).
		expect(corps).toContain('export function assemblerRepliques(')
		expect(fs.readFileSync(CHEMIN_REGISTRES, 'utf8')).toContain(CIBLE)

		// (b) et le texte assemblé ne porte AUCUNE des répliques déjà écrites — le test
		// prouve d'abord qu'il en existe, sinon il ne mesure rien. C'est aussi ce qui
		// fonde la mention d'écran « le copilote ne voit pas les répliques déjà écrites ».
		const { dossier, entite } = mesureRepliques()
		const dejaEcrites = dossier.monde.personnages
			.flatMap((personnage) => personnage.caractere?.parler ?? [])
			.filter((replique) => replique.trim() !== '')
		expect(dejaEcrites.length).toBeGreaterThan(0)
		const texte = texteRepliques(dossier, cibleRepliques(entite.id))
		expect(dejaEcrites.filter((replique) => texte.includes(replique))).toEqual([])
	})
})

describe('assemblerRepliques — les trois refus, et la mesure', () => {
	it('les trois refus, discrimines, 0 fetch', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, entite } = mesureRepliques()
			const cible = cibleRepliques(entite.id)

			// 1 — `a-ecrire` : le seul motif À CHARGE, et la charge est le chemin.
			const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
			expect(assemblerRepliques(sansTon, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// 2 — `cible-a-ecrire` : AUCUN des SEPT chemins de fiche ne résout non vide.
			// C'est la DISJONCTION, et c'est la seule pièce de mécanisme neuve : l'it2
			// testait UN chemin nommé. Le personnage ci-dessous existe, il est simplement
			// sans une ligne d'identité — on ne peut pas inventer une VOIX à partir de rien.
			const muet: Personnage = { id: 'pnj.sans-identite', portee: 'premier', plan_actions: [], savoirs: [] }
			const avecMuet: Dossier = {
				...dossier,
				monde: { ...dossier.monde, personnages: [...dossier.monde.personnages, muet] },
			}
			expect(assemblerRepliques(avecMuet, cibleRepliques(muet.id))).toEqual({ ok: false, motif: 'cible-a-ecrire' })
			// Une cible qui ne résout plus du tout emprunte le MÊME refus : « plus de
			// fiche » et « une fiche sans une ligne » demandent le même geste à l'auteur.
			expect(assemblerRepliques(dossier, cibleRepliques('pnj.jamais-existe'))).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})

			// 3 — `trop-long` : AUCUNE charge, il pointe la fiche, pas un champ.
			const enorme: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.map((personnage) =>
						personnage.id === entite.id ? { ...personnage, apparence: 'x'.repeat(BUDGET_REPLIQUES + 1) } : personnage,
					),
				},
			}
			expect(assemblerRepliques(enorme, cible)).toEqual({ ok: false, motif: 'trop-long' })

			// LES TROIS SONT DISTINCTS DEUX À DEUX — c'est la moitié que le nom du test
			// promet et qu'une liste d'assertions voisines ne prouverait pas (KR-199).
			const motifs = [
				assemblerRepliques(sansTon, cible),
				assemblerRepliques(avecMuet, cibleRepliques(muet.id)),
				assemblerRepliques(enorme, cible),
			].map((refus) => (refus.ok ? 'ASSEMBLÉ' : refus.motif))
			expect(new Set(motifs).size).toBe(3)

			// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des trois.
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('aucun-candidat est SANS OBJET pour ce role, et n est pas ecrit', () => {
		// Une seule entité, aucun rang à numéroter : l'écrire serait du code mort
		// présenté comme de la couverture (famille BUG-084, KR-235). La garde est un
		// balayage du CORPS de l'assembleur — son unique instrument possible.
		const source = fs.readFileSync(CHEMIN_CORPS_REPLIQUES, 'utf8')
		const corps = source.slice(source.indexOf('export function assemblerRepliques('))

		expect(corps).toContain('cible-a-ecrire')
		expect(corps).not.toContain('aucun-candidat')
		// Discriminant : le motif existe bel et bien dans l'union que ce corps habite —
		// sans cette ligne, une découpe fautive rendrait l'assertion vraie pour rien.
		expect(fs.readFileSync(CHEMIN_NOYAU, 'utf8')).toContain('aucun-candidat')
	})

	it('BUDGET du 3e role, mesure', () => {
		const { dossier, entite } = mesureRepliques()

		// TEMPS 1 — NON-VACUITÉ, chemin par chemin, NOMMÉE (jamais un compte). Sans elle,
		// `M` est un PLANCHER et le budget qu'on en dérive protège moins qu'il ne prétend.
		const remplisDuCanon = cheminsRemplis(dossier)
		const remplisDeLaFiche = cheminsRemplis(entite, PREFIXE_PERSONNAGE)
		const vides = [
			...CHEMINS_R_DE_CANON.filter((chemin) => !remplisDuCanon.has(chemin)),
			...CHEMINS_R_DE_FICHE.filter((chemin) => !remplisDeLaFiche.has(chemin)),
		]
		expect(vides).toEqual([])

		// TEMPS 2 — `M`. Une seule cible possible : le champ visé est exclu PAR ABSENCE,
		// donc il n'y a pas de maximum à prendre sur plusieurs demandes.
		const M = texteRepliques(dossier, cibleRepliques(entite.id)).length
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au millier
		// supérieur : l'arrondi EST la marge. Ce n'est PAS un cliquet — le jour où
		// `CHAMPS_INJECTES` s'élargit, cette ligne rougit et la constante se RE-DÉRIVE.
		// SI LA MESURE DÉPLAÎT, ON RETIRE UN CHEMIN — on ne monte jamais le budget, et on
		// ne le baisse pas non plus pour faire verdir un test (§ 8, n° 35).
		expect(BUDGET_REPLIQUES).toBe(Math.ceil((M * 3) / 1000) * 1000)

		// Et les DEUX autres rôles n'ont PAS bougé : c'est tout l'objet du `Record` — un
		// scalaire partagé aurait desserré la garde d'un rôle par la mesure d'un autre,
		// sans un seul test rouge (KR-235).
		expect(BUDGET_PROSE).toBe(6000)
		expect(BUDGET_DETENTEURS).toBe(17_000)
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		// LE CANARI DE PLAFOND, à ±1 CARACTÈRE — un plafond dont personne n'a éprouvé les
		// deux bords est une intention, pas une borne.
		const { dossier, entite } = mesureRepliques()
		const cible = cibleRepliques(entite.id)
		const avecApparence = (apparence: string): Dossier => ({
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id ? { ...personnage, apparence } : personnage,
				),
			},
		})
		// La longueur du texte assemblé est AFFINE en celle de l'apparence : on mesure
		// l'ordonnée à l'origine sur une apparence d'un caractère, puis on vise.
		const socle = texteRepliques(avecApparence('x'), cible).length - 1

		expect(texteRepliques(avecApparence('x'.repeat(BUDGET_REPLIQUES - socle)), cible)).toHaveLength(BUDGET_REPLIQUES)
		expect(assemblerRepliques(avecApparence('x'.repeat(BUDGET_REPLIQUES - socle)), cible).ok).toBe(true)
		expect(assemblerRepliques(avecApparence('x'.repeat(BUDGET_REPLIQUES - socle + 1)), cible)).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('un champ marque est RETIRE, jamais remplace par une chaine vide', () => {
		const { dossier, entite } = mesureRepliques()
		const marque: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id ? { ...personnage, apparence: `${MARQUEUR_A_ECRIRE} à décrire` } : personnage,
				),
			},
		}

		const texte = texteRepliques(marque, cibleRepliques(entite.id))

		// RETRAIT : le bloc n'existe pas. Une substitution par `''` enseignerait au
		// modèle « ce personnage n'a pas d'apparence », qui est une AFFIRMATION.
		expect(texte).not.toContain('monde.personnages[].apparence')
		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
	})

	it('deux assemblages de la meme cible sur un dossier inchange sont strictement egaux', () => {
		// L'ABSENCE DE MÉMOIRE commence ici : ni date, ni identifiant, ni aléa dans le
		// texte. Sans cette propriété, « deux lancers ⇒ deux corps identiques » n'est pas
		// démontrable par égalité stricte.
		const { dossier, entite } = mesureRepliques()
		const cible = cibleRepliques(entite.id)

		expect(texteRepliques(dossier, cible)).toBe(texteRepliques(dossier, cible))
	})
})

// ══ LE QUATRIÈME RÔLE — `personnage-plan` ════════════════════════════════════

const ROLE_PLAN = 'personnage-plan'
const BUDGET_PLAN = BUDGET_CARACTERES_CONTEXTE[ROLE_PLAN]

const CHEMINS_P = CHAMPS_INJECTES[ROLE_PLAN]
const CHEMINS_P_DE_FICHE = CHEMINS_P.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_P_DE_CANON = CHEMINS_P.filter((chemin) => !chemin.startsWith(PREFIXE_PERSONNAGE))

/** LE CHAMP CIBLE de ce rôle — et le seul des quatre rôles qui l'INJECTE. */
const CIBLE_PLAN = 'monde.personnages[].plan_actions[].action'

/** LA CIBLE de ce rôle : `acteurId`, JAMAIS `personnageId` — une cible
 *  `{ personnageId }` serait LE MÊME TYPE que `CibleRepliques` et tomberait dans
 *  `demanderRepliques` avec `tsc` vert (§ 8, n° 3). */
function ciblePlan(acteurId: string): CiblePlan {
	return { role: ROLE_PLAN, acteurId }
}

/**
 * L'ENTITÉ DE MESURE DU QUATRIÈME RÔLE — même protocole que l'it1, RE-DÉRIVÉ sur LES
 * SIX CHEMINS DE FICHE DE CE RÔLE-CI et non recopié du troisième : celui-ci retire
 * `apparence` et `caractere.parler[]`, et il porte `plan_actions[].action`, que le
 * rôle répliques porte aussi mais qui est ICI LE CHAMP CIBLE.
 *
 * Aucun personnage de `dossier-reference.json` ne remplit les six : le mieux rempli
 * (`pnj.corvin-le-marchand`, 4/6) n'a pas de `but`, et le seul porteur d'un `but`
 * (`pnj.selene-la-vigie`) n'a ni `fonction`, ni `description_joueur`, ni `jamais`.
 * La fixture n'appartient à aucun lot — on ne la touche pas. L'entité est donc
 * COMPOSÉE, jamais inventée : le mieux rempli, GREFFÉ du `but` du seul porteur.
 * Toutes les valeurs viennent du document réel.
 */
function mesurePlan(): { dossier: Dossier; entite: Personnage } {
	const reference = dossierDeReference()
	const personnages = reference.monde.personnages
	const note = (personnage: Personnage): number => {
		const remplis = cheminsRemplis(personnage, PREFIXE_PERSONNAGE)
		return CHEMINS_P_DE_FICHE.filter((chemin) => remplis.has(chemin)).length
	}
	const leMieuxRempli = personnages.reduce((meilleur, candidat) =>
		note(candidat) > note(meilleur) ? candidat : meilleur,
	)
	const porteurDeBut = personnages.find((personnage) => personnage.but !== undefined)
	if (porteurDeBut === undefined) throw new Error('la fixture de référence ne porte aucun `but` : mesure impossible')
	const entite: Personnage = { ...leMieuxRempli, but: porteurDeBut.but }
	return {
		entite,
		dossier: {
			...reference,
			monde: {
				...reference.monde,
				personnages: personnages.map((personnage) => (personnage.id === entite.id ? entite : personnage)),
			},
		},
	}
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé. */
function textePlan(dossier: Dossier, cible: CiblePlan): string {
	const contexte = assemblerPlan(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte.texte
}

describe('assemblerPlan — confinement d audience du quatrieme role', () => {
	it('confinement du 4e role', () => {
		expect(CHEMINS_P).toHaveLength(9)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les écarts
		// NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS_P.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
		// La soupape n'a pas bougé : un QUATRIÈME rôle n'ouvre aucune dérogation
		// d'audience — les neuf chemins étaient DÉJÀ `ia` (KR-232).
		expect(DEROGATIONS_AUDIENCE).toEqual([])
	})

	it('le prefixe est injecte DANS L ORDRE, non tronque', () => {
		// L'AMENDEMENT DE LA TRANCHE, PROUVÉ. Le champ cible est injecté — première fois
		// qu'un rôle montre au modèle ce qu'il écrit — parce que `plan_actions[]` est une
		// SÉQUENCE : le préfixe n'est pas la réponse, c'est la PRÉMISSE de la question.
		const { dossier, entite } = mesurePlan()
		// TROIS étapes, toutes venues du document réel (les `action` des porteurs de la
		// fixture), remises sur la cible DANS UN ORDRE CHOISI : c'est l'ORDRE qui est
		// éprouvé, donc il ne doit pas être celui de la fixture.
		const reelles = dossier.monde.personnages
			.flatMap((personnage) => personnage.plan_actions)
			.map((etape) => etape.action)
			.filter((action) => action.trim() !== '')
		expect(reelles.length).toBeGreaterThanOrEqual(3)
		const suite = [reelles[2], reelles[0], reelles[1]]
		const avecSuite: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id
						? { ...personnage, plan_actions: suite.map((action, rang) => ({ etape: rang + 1, action })) }
						: personnage,
				),
			},
		}

		const texte = textePlan(avecSuite, ciblePlan(entite.id))
		const bloc = texte.split('\n\n').find((candidat) => candidat.startsWith(`${CIBLE_PLAN}\n`))
		expect(bloc).toBeDefined()

		// (a) NON TRONQUÉ : les TROIS y sont, là où le rôle détenteurs, lui, réduit ce
		//     même chemin à son premier élément.
		// (b) DANS L'ORDRE DU DOCUMENT : l'égalité porte sur la LISTE, jamais sur une
		//     appartenance — un `toContain` par élément serait vert sur n'importe quelle
		//     permutation, c'est-à-dire aveugle à la seule chose qu'on mesure.
		expect(String(bloc).split('\n').slice(1)).toEqual(suite)
		// Discriminant : l'ordre éprouvé n'est PAS l'ordre naturel de la fixture — sans
		// cette ligne, l'égalité pourrait être vraie par coïncidence de tri (KR-199).
		expect(suite).not.toEqual([reelles[0], reelles[1], reelles[2]])
		// … et AUCUN entier ne franchit le contexte : le modèle ne voit jamais `etape`.
		expect(texte).not.toContain('etape')
	})

	it('la cible n est PAS exclue ici, contrairement aux 3 autres roles', () => {
		// LA GARDE DE L'AMENDEMENT (KR-235). Il ne dit pas « le champ cible s'injecte » —
		// il dit « un champ cible ORDONNÉ s'injecte, un champ cible INTERCHANGEABLE non ».
		// Les DEUX côtés sont donc ici : sans le second, la garde serait verte le jour où
		// quelqu'un injecterait aussi `caractere.parler[]` dans sa propre demande.
		expect(CHEMINS_P).toContain(CIBLE_PLAN)
		expect(CHAMPS_INJECTES[ROLE_REPLIQUES]).not.toContain('monde.personnages[].caractere.parler[]')
		// Et le rôle prose exclut SA cible à l'exécution, champ par champ : aucune des
		// trois proses proposables n'apparaît dans sa propre demande.
		const { dossier, entite } = mesurePlan()
		const survivants = (Object.keys(CHAMPS_PROPOSABLES) as ChampProseChemin[]).filter((champ) =>
			texteAssemble(dossier, cibleSur(entite.id, champ)).includes(`${champ}\n`),
		)
		expect(survivants).toEqual([])
	})

	it('synopsis_mj absent ici, PRESENT chez prose', () => {
		// RETIRÉ POUR POINT DE VUE, ET NON POUR LE TON — le motif N'EST PAS celui de 3a.
		// Le synopsis porte ce que le personnage NE SAIT PAS : un modèle qui l'a écrit des
		// étapes qui ANTICIPENT L'INTRIGUE, et la n° 12 les injectera au rôle acteur, qui
		// joue un personnage QUI DEVINE.
		// Les DEUX côtés, comme au 3e rôle : une assertion d'absence seule serait verte le
		// jour où le chemin disparaîtrait des DEUX rôles (KR-199).
		const SYNOPSIS = 'canon.mj.synopsis_mj'

		expect(CHEMINS_P).not.toContain(SYNOPSIS)
		expect(CHAMPS_INJECTES['personnage-prose']).toContain(SYNOPSIS)

		const { dossier, entite } = mesurePlan()
		const synopsis = String(dossier.canon.mj?.synopsis_mj ?? '')
		expect(synopsis.trim().length).toBeGreaterThan(0)
		expect(textePlan(dossier, ciblePlan(entite.id))).not.toContain(synopsis)
		// … là où le rôle prose, lui, l'injecte bel et bien.
		expect(texteAssemble(dossier, cibleSur(entite.id, 'monde.personnages[].fonction'))).toContain(synopsis)
	})

	it('apparence et parler absents de ce role, PRESENTS chez prose', () => {
		// Les DEUX AUTRES RETRAITS, prouvés des deux côtés eux aussi : une apparence ne
		// dit rien d'une intention, et des répliques ne disent pas ce que le personnage
		// FAIT — ce serait un canal de paraphrase vers un champ qu'un AUTRE rôle écrit.
		for (const retire of ['monde.personnages[].apparence', 'monde.personnages[].caractere.parler[]']) {
			expect(CHEMINS_P).not.toContain(retire)
			expect(CHAMPS_INJECTES['personnage-prose']).toContain(retire)
		}
	})

	it('tout ce que porte le contexte assemble vient d un chemin autorise — LES DEUX COTES', () => {
		const { dossier, entite } = mesurePlan()
		const texte = textePlan(dossier, ciblePlan(entite.id))

		const blocs = texte.split('\n\n')
		const enTetes = blocs.map((bloc) => bloc.split('\n')[0])
		// (a) les ÉTIQUETTES : aucun bloc ne nomme un chemin hors de la liste.
		expect(enTetes.filter((chemin) => !CHEMINS_P.includes(chemin))).toEqual([])

		// (b) les VALEURS : chaque ligne de valeur est une feuille du dossier vivant sous
		// un chemin autorisé. Inclusion de CHEMINS, AUCUN seuil numérique (KR-235).
		const autorisees = new Set<string>()
		for (const feuille of feuillesDeLaFixture(dossier)) {
			if (typeof feuille.valeur !== 'string') continue
			const surLaFiche = feuille.concret.startsWith(`monde.personnages[${dossier.monde.personnages.indexOf(entite)}]`)
			const estDeLaFiche = feuille.normalise.startsWith(PREFIXE_PERSONNAGE)
			if (estDeLaFiche && !surLaFiche) continue
			if (CHEMINS_P.includes(feuille.normalise)) autorisees.add(feuille.valeur)
		}
		const lignesDeValeur = blocs.flatMap((bloc) => bloc.split('\n').slice(1))
		expect(lignesDeValeur.filter((ligne) => !autorisees.has(ligne))).toEqual([])

		// LE SECOND CÔTÉ DU TÉMOIN, et sans lui l'assertion négative est INERTE : un
		// contexte VIDE passerait les deux `toEqual([])` ci-dessus sans rien prouver.
		expect(lignesDeValeur.length).toBeGreaterThan(0)
		expect(enTetes).toEqual([...CHEMINS_P])
	})

	it('aucune fiche etrangere n entre dans le contexte', () => {
		const { dossier, entite } = mesurePlan()
		const contexte = assemblerPlan(dossier, ciblePlan(entite.id))
		const texte = textePlan(dossier, ciblePlan(entite.id))

		expect(contexte.ok && contexte.entitesInjectees).toEqual([entite.id])
		// Les étapes des AUTRES personnages ne sont pas dans le texte — et le test prouve
		// d'abord qu'il en existe, sinon il ne mesure rien. C'est la contrepartie directe
		// de l'amendement : on injecte LE préfixe de la cible, jamais celui des voisins.
		const etrangeres = dossier.monde.personnages
			.filter((personnage) => personnage.id !== entite.id)
			.flatMap((personnage) => personnage.plan_actions.map((etape) => etape.action))
			.filter((action) => action.trim() !== '')
		expect(etrangeres.length).toBeGreaterThan(0)
		expect(etrangeres.filter((action) => texte.includes(action))).toEqual([])
		// Aucun NOM non plus : `Entite.nom` est d'audience `auteur` (KR-195).
		expect(CHEMINS_P.filter((chemin) => chemin.endsWith('.nom'))).toEqual([])
	})
})

describe('assemblerPlan — les trois refus, et la mesure', () => {
	it('les trois refus, discrimines, 0 fetch', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, entite } = mesurePlan()
			const cible = ciblePlan(entite.id)

			// 1 — `a-ecrire` : le seul motif À CHARGE, et la charge est le chemin.
			const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
			expect(assemblerPlan(sansTon, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// 2 — `cible-a-ecrire` : UN SEUL CHEMIN NOMMÉ, `but.libelle`, et NON la
			// disjonction à sept chemins du rôle répliques. ON N'INVENTE PAS UN PLAN À
			// PARTIR DE RIEN : sans but écrit, toute suite d'étapes se vaut et le modèle
			// inventerait le but en même temps que l'étape.
			const avecBut = (but: Personnage['but']): Dossier => ({
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.map((personnage) =>
						personnage.id === entite.id ? { ...personnage, but } : personnage,
					),
				},
			})
			const sansBut = avecBut(undefined)
			expect(assemblerPlan(sansBut, cible)).toEqual({ ok: false, motif: 'cible-a-ecrire' })
			// … et le MÊME refus sur un `but.libelle` VIDE, puis MARQUÉ : « absent », « vide »
			// et « à écrire » demandent le même geste à l'auteur.
			expect(assemblerPlan(avecBut({ libelle: '   ' }), cible)).toEqual({ ok: false, motif: 'cible-a-ecrire' })
			expect(assemblerPlan(avecBut({ libelle: MARQUEUR_A_ECRIRE }), cible)).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})
			// LE DISCRIMINANT DU PRÉDICAT NOMMÉ, et c'est lui qui distingue ce refus de
			// celui du rôle répliques : une fiche rédigée PAR AILLEURS — fonction,
			// description joueur, limite, plan — MAIS SANS BUT est refusée quand même. Une
			// disjonction sur les chemins de fiche l'aurait ACCEPTÉE, et c'est exactement
			// ce que la ligne suivante constate : le rôle répliques, lui, l'assemble.
			const fiche = sansBut.monde.personnages.find((personnage) => personnage.id === entite.id)
			expect(cheminsRemplis(fiche, PREFIXE_PERSONNAGE).size).toBeGreaterThan(3)
			expect(assemblerRepliques(sansBut, cibleRepliques(entite.id)).ok).toBe(true)
			// Une cible qui ne résout plus du tout emprunte le MÊME refus.
			expect(assemblerPlan(dossier, ciblePlan('pnj.jamais-existe'))).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})

			// 3 — `trop-long` : AUCUNE charge, il pointe la fiche, pas un champ.
			const enorme: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.map((personnage) =>
						personnage.id === entite.id ? { ...personnage, fonction: 'x'.repeat(BUDGET_PLAN + 1) } : personnage,
					),
				},
			}
			expect(assemblerPlan(enorme, cible)).toEqual({ ok: false, motif: 'trop-long' })

			// LES TROIS SONT DISTINCTS DEUX À DEUX — c'est la moitié que le nom du test
			// promet et qu'une liste d'assertions voisines ne prouverait pas (KR-199).
			const motifs = [assemblerPlan(sansTon, cible), assemblerPlan(sansBut, cible), assemblerPlan(enorme, cible)].map(
				(refus) => (refus.ok ? 'ASSEMBLÉ' : refus.motif),
			)
			expect(new Set(motifs).size).toBe(3)
			// ET L'ORDRE EST FIGÉ : un dossier qui cumule les trois défauts rend le PREMIER
			// motif, jamais un autre — sans quoi l'écran nommerait le mauvais geste.
			const cumul: Dossier = {
				...enorme,
				canon: { ...enorme.canon, ton: MARQUEUR_A_ECRIRE },
				monde: {
					...enorme.monde,
					personnages: enorme.monde.personnages.map((personnage) =>
						personnage.id === entite.id ? { ...personnage, but: undefined } : personnage,
					),
				},
			}
			expect(assemblerPlan(cumul, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des cas ci-dessus.
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('aucun-candidat est SANS OBJET pour ce role, et n est pas ecrit', () => {
		// Une seule entité, aucun rang à numéroter : l'écrire serait du code mort
		// présenté comme de la couverture (famille BUG-084, KR-235).
		const source = fs.readFileSync(path.join(__dirname, 'contexte', 'plan.ts'), 'utf8')
		const corps = source.slice(source.indexOf('export function assemblerPlan('))

		expect(corps).toContain('cible-a-ecrire')
		expect(corps).not.toContain('aucun-candidat')
		// Discriminant : le motif existe bel et bien dans l'union que ce corps habite —
		// sans cette ligne, une découpe fautive rendrait l'assertion vraie pour rien.
		expect(fs.readFileSync(CHEMIN_NOYAU, 'utf8')).toContain('aucun-candidat')
	})

	it('BUDGET du 4e role, mesure', () => {
		const { dossier, entite } = mesurePlan()

		// TEMPS 1 — NON-VACUITÉ, chemin par chemin, NOMMÉE (jamais un compte). Sans elle,
		// `M` est un PLANCHER et le budget qu'on en dérive protège moins qu'il ne prétend.
		const remplisDuCanon = cheminsRemplis(dossier)
		const remplisDeLaFiche = cheminsRemplis(entite, PREFIXE_PERSONNAGE)
		const vides = [
			...CHEMINS_P_DE_CANON.filter((chemin) => !remplisDuCanon.has(chemin)),
			...CHEMINS_P_DE_FICHE.filter((chemin) => !remplisDeLaFiche.has(chemin)),
		]
		expect(vides).toEqual([])

		// TEMPS 2 — `M`. Le champ cible EST injecté ici : il n'y a donc pas de demande à
		// maximiser sur plusieurs champs, il n'y a qu'un seul contexte possible.
		const M = textePlan(dossier, ciblePlan(entite.id)).length
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au millier
		// supérieur : l'arrondi EST la marge. Ce n'est PAS un cliquet.
		expect(BUDGET_PLAN).toBe(Math.ceil((M * 3) / 1000) * 1000)

		// ⚠ LA COÏNCIDENCE, ÉPINGLÉE PLUTÔT QUE SUBIE : ce budget VAUT celui du rôle
		// répliques, et il n'en est PAS recopié — les deux `M` diffèrent, et c'est ce que
		// ces deux lignes prouvent. Sans elles, une recopie et une mesure seraient
		// indistinguables (KR-235).
		const mesureTroisieme = mesureRepliques()
		expect(BUDGET_PLAN).toBe(BUDGET_REPLIQUES)
		expect(M).not.toBe(texteRepliques(mesureTroisieme.dossier, cibleRepliques(mesureTroisieme.entite.id)).length)

		// Et les DEUX autres rôles n'ont PAS bougé : c'est tout l'objet du `Record`.
		expect(BUDGET_PROSE).toBe(6000)
		expect(BUDGET_DETENTEURS).toBe(17_000)
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		// LE CANARI DE PLAFOND, à ±1 CARACTÈRE — un plafond dont personne n'a éprouvé les
		// deux bords est une intention, pas une borne.
		const { dossier, entite } = mesurePlan()
		const cible = ciblePlan(entite.id)
		const avecFonction = (fonction: string): Dossier => ({
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id ? { ...personnage, fonction } : personnage,
				),
			},
		})
		const socle = textePlan(avecFonction('x'), cible).length - 1

		expect(textePlan(avecFonction('x'.repeat(BUDGET_PLAN - socle)), cible)).toHaveLength(BUDGET_PLAN)
		expect(assemblerPlan(avecFonction('x'.repeat(BUDGET_PLAN - socle)), cible).ok).toBe(true)
		expect(assemblerPlan(avecFonction('x'.repeat(BUDGET_PLAN - socle + 1)), cible)).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('un champ marque est RETIRE, jamais remplace par une chaine vide', () => {
		const { dossier, entite } = mesurePlan()
		const marque: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === entite.id ? { ...personnage, fonction: `${MARQUEUR_A_ECRIRE} à décrire` } : personnage,
				),
			},
		}

		const texte = textePlan(marque, ciblePlan(entite.id))

		expect(texte).not.toContain('monde.personnages[].fonction')
		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
	})

	it('deux assemblages de la meme cible sur un dossier inchange sont strictement egaux', () => {
		const { dossier, entite } = mesurePlan()
		const cible = ciblePlan(entite.id)

		expect(textePlan(dossier, cible)).toBe(textePlan(dossier, cible))
	})
})

// ══ LE CINQUIÈME RÔLE — `personnage-relations` ═══════════════════════════════

const ROLE_RELATIONS = 'personnage-relations'
const BUDGET_RELATIONS = BUDGET_CARACTERES_CONTEXTE[ROLE_RELATIONS]

const CHEMINS_REL = CHAMPS_INJECTES[ROLE_RELATIONS]
const CHEMINS_REL_DE_FICHE = CHEMINS_REL.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_REL_DE_CANON = CHEMINS_REL.filter((chemin) => !chemin.startsWith(PREFIXE_PERSONNAGE))

/** LE CHEMIN DE LA SCISSION — injecté chez le PORTEUR, jamais chez un CANDIDAT. */
const CHEMIN_POURQUOI = 'monde.personnages[].but.pourquoi'
/** L'EN-TÊTE DU BLOC DU PORTEUR — `FICHE`, jamais `PERSONNAGE` (collision de rangs). */
const EN_TETE_PORTEUR = 'FICHE'
const CHEMIN_CORPS_RELATIONS = path.join(__dirname, 'contexte', 'relations.ts')

/** LA CIBLE de ce rôle — ÉTIQUETÉE depuis l'itération 3c : sa charge est celle de
 *  `CibleRepliques` MOT POUR MOT, et c'est le `role` qui les sépare. */
function cibleRelations(personnageId: string): CibleRelations {
	return { role: ROLE_RELATIONS, personnageId }
}

/** LES CINQ valeurs réelles les plus longues du dossier, une par chemin de fiche de ce
 *  rôle — toutes LUES du document, jamais écrites ici (mêmes motifs que le 2ᵉ rôle). */
function valeursRelations(reference: Dossier): Record<string, string> {
	return Object.fromEntries(CHEMINS_REL_DE_FICHE.map((chemin) => [chemin, valeurLaPlusLongue(reference, chemin)]))
}

/** Une fiche COMPLÈTE sur les CINQ chemins du rôle. `nom` vient d'un personnage réel :
 *  c'est ce qui rend le témoin « aucun nom n'est injecté » capable d'échouer. */
function fichePleine(
	modele: Personnage,
	id: string,
	portee: Portee,
	valeurs: Record<string, string>,
	pourquoi: string,
): Personnage {
	return {
		id,
		nom: modele.nom,
		portee,
		savoirs: [],
		plan_actions: [{ etape: 1, action: valeurs['monde.personnages[].plan_actions[].action'] }],
		fonction: valeurs['monde.personnages[].fonction'],
		description_joueur: valeurs['monde.personnages[].description_joueur'],
		but: { libelle: valeurs['monde.personnages[].but.libelle'], pourquoi },
	}
}

/**
 * LE DOSSIER DE MESURE DU CINQUIÈME RÔLE — COMPOSÉ PAR LE TEST, jamais inventé, et
 * jamais la fixture (qui n'appartient à aucun lot de cette itération).
 *
 * `nbCandidats` est un PARAMÈTRE, et c'est délibéré : la MESURE du budget exige
 * `CANDIDATS_MAX` SATURÉ, alors que le critère « `rangs.size === N−2` » exige au
 * contraire que la TRONCATURE NE MORDE PAS — sinon `N−2` et `CANDIDATS_MAX`
 * coïncideraient et le test ne dirait plus lequel des deux a parlé (KR-199).
 *
 * ⚠ LE `but.pourquoi` DES CANDIDATS EST NON VIDE ET DISTINCT de celui du porteur :
 * c'est le témoin du critère n° 1. La valeur est réelle elle aussi — la plus longue
 * `monde.indices[].verite` du dossier —, choisie parce que ce chemin n'est injecté par
 * AUCUN des huit de ce rôle : sa présence dans le texte assemblé ne pourrait donc venir
 * que de la fuite qu'on cherche.
 */
function construireRelations(nbCandidats: number): {
	dossier: Dossier
	cible: CibleRelations
	porteurId: string
	lieeId: string
	pourquoiDuPorteur: string
	pourquoiDesCandidats: string
	rangsAttendus: string[]
} {
	const reference = dossierDeReference()
	const valeurs = valeursRelations(reference)
	const modeles = reference.monde.personnages
	const pourquoiDuPorteur = valeurs[CHEMIN_POURQUOI]
	const pourquoiDesCandidats = valeurLaPlusLongue(reference, 'monde.indices[].verite')

	const candidats = Array.from({ length: nbCandidats }, (_, rang) =>
		fichePleine(
			modeles[rang % modeles.length],
			`${modeles[rang % modeles.length].id}-c${rang}`,
			// Les portées ALTERNENT : sans cela, « `premier` d'abord, puis l'ordre du
			// document » serait indistinguable de « l'ordre du document » tout court.
			rang % 2 === 0 ? 'second' : 'premier',
			valeurs,
			pourquoiDesCandidats,
		),
	)
	const liee = candidats[0]
	const porteur: Personnage = {
		...fichePleine(modeles[0], 'pnj.le-porteur', 'premier', valeurs, pourquoiDuPorteur),
		// `INTENSITE_INITIALE` est IMPORTÉE, jamais un `0` retapé (KR-165).
		relations: [{ cible_id: liee.id, lien: valeurs[CHEMIN_POURQUOI], intensite: INTENSITE_INITIALE }],
	}
	const enLice = candidats.filter((candidat) => candidat.id !== liee.id)

	return {
		dossier: {
			...reference,
			monde: { ...reference.monde, personnages: [porteur, ...candidats] },
		},
		cible: cibleRelations(porteur.id),
		porteurId: porteur.id,
		lieeId: liee.id,
		pourquoiDuPorteur,
		pourquoiDesCandidats,
		// `premier` d'abord, puis l'ordre du document — le porteur et la cible déjà liée
		// n'y sont PAS.
		rangsAttendus: [
			...enLice.filter((candidat) => candidat.portee === 'premier').map((candidat) => candidat.id),
			...enLice.filter((candidat) => candidat.portee !== 'premier').map((candidat) => candidat.id),
		].slice(0, CANDIDATS_MAX),
	}
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé. */
function contexteRelations(
	dossier: Dossier,
	cible: CibleRelations,
): { texte: string; entitesInjectees: readonly string[]; rangs: ReadonlyMap<string, string> } {
	const contexte = assemblerRelations(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte
}

/** LES QUATRE CHEMINS DE CANDIDAT, EXTRAITS DE LA SOURCE. `CHEMINS_CANDIDAT` est une
 *  const LOCALE à `./contexte/relations.ts` — elle n'a aucun consommateur hors de ce
 *  corps, et l'exporter pour un seul test en ferait une ligne publique sans appelant
 *  (KR-109). Le test la LIT donc là où elle vit, exactement comme les balayages de
 *  source des itérations précédentes. */
function declarationDesCheminsCandidat(): string {
	const source = fs.readFileSync(CHEMIN_CORPS_RELATIONS, 'utf8')
	const debut = source.indexOf('const CHEMINS_CANDIDAT')
	// ⚠ LE DÉCOUPAGE VA DE LA DÉCLARATION À LA LIGNE BLANCHE QUI LA SUIT, et NON d'un
	// `= [` à son `]` : MESURÉ en posant le mutant du § 5.1-9, un découpage qui SUPPOSE
	// la forme littérale ne trouve plus rien sur la forme FILTRÉE — il tombe sur un `= [`
	// plus loin dans le fichier et le balayage anti-soustraction devient VERT sur le
	// défaut même qu'il nomme. Le découpage ne doit rien supposer de la forme qu'il
	// éprouve (KR-235).
	return source.slice(debut, source.indexOf('\n\n', debut))
}

function cheminsCandidatExtraits(): string[] {
	return [...declarationDesCheminsCandidat().matchAll(/'([^']+)'/g)].map((trouve) => trouve[1])
}

describe('assemblerRelations — confinement d audience du cinquieme role', () => {
	it('confinement du 5e role', () => {
		expect(CHEMINS_REL).toHaveLength(8)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les écarts
		// NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS_REL.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
		// La soupape n'a pas bougé : un CINQUIÈME rôle n'ouvre aucune dérogation
		// d'audience — les huit chemins étaient DÉJÀ `ia` (KR-232).
		expect(DEROGATIONS_AUDIENCE).toEqual([])
	})

	it('CHEMINS_CANDIDAT est INCLUS dans l union des huit', () => {
		// PREMIER DES DEUX TESTS, et il rougit si l'UNION RÉTRÉCIT.
		const extraits = cheminsCandidatExtraits()

		expect(extraits).toHaveLength(4)
		expect(extraits.filter((chemin) => !CHEMINS_REL.includes(chemin))).toEqual([])
		// Discriminant : l'extraction a bien lu du code réel — une découpe fautive
		// rendrait l'inclusion vraie sur une liste vide (KR-235).
		expect(declarationDesCheminsCandidat()).toContain(PREFIXE_PERSONNAGE)
		expect(declarationDesCheminsCandidat()).toContain('const CHEMINS_CANDIDAT')
	})

	it('but.pourquoi est ABSENT des candidats — le canari, qui ne se deduit PAS du premier', () => {
		// SECOND DES DEUX TESTS. Le premier resterait VERT le jour où quelqu'un
		// « harmoniserait » les deux ensembles en donnant aux candidats les cinq chemins
		// du porteur : l'inclusion serait toujours vraie. Celui-ci, lui, rougirait.
		const extraits = cheminsCandidatExtraits()

		expect(extraits).not.toContain(CHEMIN_POURQUOI)
		// … et le chemin EXISTE bien dans l'union : sans cette ligne, le canari serait
		// vrai par ABSENCE DE L'UNION plutôt que par absence de la liste des candidats.
		expect(CHEMINS_REL).toContain(CHEMIN_POURQUOI)
		// … et les candidats en portent STRICTEMENT MOINS que le porteur.
		expect(extraits.length).toBeLessThan(CHEMINS_REL_DE_FICHE.length)
	})

	it('CHEMINS_CANDIDAT est une LISTE POSITIVE, jamais une soustraction', () => {
		// LE MUTANT QUE LE PLAN EXIGE DE VOIR ROUGE, et AUCUN TEST DE COMPORTEMENT NE
		// PEUT LE VOIR : `chemins.filter((c) => c !== 'monde.personnages[].but.pourquoi')`
		// rend EXACTEMENT la même liste aujourd'hui — l'inclusion et le canari ci-dessus
		// resteraient tous deux VERTS. Il RÉ-ÉLARGIRAIT TOUT SEUL au NEUVIÈME chemin que
		// l'union gagnerait, sans que rien ne rougisse. Le balayage de SOURCE est donc son
		// SEUL instrument possible (KR-235, famille de la garde inerte).
		const declaration = declarationDesCheminsCandidat()

		expect(declaration).not.toContain('filter')
		expect(declaration).not.toContain('!==')
		expect(declaration).not.toContain('CHAMPS_INJECTES')
		// … et les QUATRE littéraux y sont, un par un, jamais un compte.
		for (const chemin of cheminsCandidatExtraits()) expect(declaration).toContain(`'${chemin}'`)
		// Discriminant : le mot `filter` EXISTE bel et bien dans ce fichier — la sélection
		// des candidats l'emploie légitimement —, donc une découpe trop large rendrait
		// l'assertion fausse, et une découpe trop étroite ne la rendrait pas vraie pour
		// rien.
		expect(fs.readFileSync(CHEMIN_CORPS_RELATIONS, 'utf8')).toContain('.filter(')
	})

	it('le but.pourquoi du PORTEUR entre, celui d un CANDIDAT JAMAIS — sur le TEXTE assemble', () => {
		// CRITÈRE 1, ET C'EST LE TÉMOIN QUI COMPTE : une assertion sur les LISTES seules
		// resterait VERTE sur une boucle qui ignore la liste. Celui-ci porte sur le texte.
		const { dossier, cible, pourquoiDuPorteur, pourquoiDesCandidats } = construireRelations(CANDIDATS_MAX + 1)
		const { texte } = contexteRelations(dossier, cible)

		// Les deux valeurs sont NON VIDES et DISTINCTES — sans cette moitié, l'assertion
		// d'absence serait vraie par construction.
		expect(pourquoiDuPorteur.trim().length).toBeGreaterThan(0)
		expect(pourquoiDesCandidats.trim().length).toBeGreaterThan(0)
		expect(pourquoiDesCandidats).not.toBe(pourquoiDuPorteur)
		// … et les candidats en portent BIEN un au document : c'est ce qui rend la fuite
		// possible, donc le test capable d'échouer.
		const candidats = dossier.monde.personnages.filter((personnage) => personnage.id !== cible.personnageId)
		expect(candidats.filter((candidat) => candidat.but?.pourquoi === pourquoiDesCandidats).length).toBeGreaterThan(0)

		expect(texte).toContain(pourquoiDuPorteur)
		expect(texte).not.toContain(pourquoiDesCandidats)
	})

	it('aucun nom n est injecte', () => {
		// KR-195 : `Entite.nom` est d'audience `auteur`. (a) aucun des huit chemins ne
		// résout vers un `nom` ;
		expect(CHEMINS_REL.filter((chemin) => chemin.endsWith('.nom'))).toEqual([])

		// (b) et le texte réellement assemblé n'en porte aucun. Le test prouve d'abord
		// qu'il EXISTE des noms à trouver, sinon il ne mesure rien.
		const { dossier, cible } = construireRelations(CANDIDATS_MAX + 1)
		const { texte } = contexteRelations(dossier, cible)
		const noms = dossier.monde.personnages
			.map((personnage) => personnage.nom)
			.filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')

		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => texte.includes(nom))).toEqual([])
	})

	it('l en-tete du porteur est FICHE, jamais PERSONNAGE', () => {
		// § 8, n° 36 : un en-tête commençant par `P` ENTRE EN COLLISION avec l'alphabet
		// des rangs — `{"envers":"PERSONNAGE"}` serait classé `rang-inconnu`, rejoué, puis
		// terminal. Un rôle qui échoue sur une réponse de bonne foi.
		const { dossier, cible } = construireRelations(4)
		const { texte, rangs } = contexteRelations(dossier, cible)
		const enTetes = texte.split('\n\n').map((bloc) => bloc.split('\n')[0])

		expect(enTetes).toContain(EN_TETE_PORTEUR)
		// L'en-tête du porteur n'appartient PAS à l'alphabet des rangs, et il ne commence
		// même pas par la lettre qui l'ouvre.
		expect(rangs.has(EN_TETE_PORTEUR)).toBe(false)
		expect(EN_TETE_PORTEUR.startsWith('P')).toBe(false)
		// Et le corps n'écrit nulle part le mot rejeté.
		expect(fs.readFileSync(CHEMIN_CORPS_RELATIONS, 'utf8')).not.toContain("'PERSONNAGE'")
		// Aucun en-tête hors de la liste autorisée : le canon, `FICHE`, les rangs.
		expect(
			enTetes.filter((entete) => !CHEMINS_REL.includes(entete) && entete !== EN_TETE_PORTEUR && !rangs.has(entete)),
		).toEqual([])
	})

	it('le porteur est EXCLU des rangs, la cible deja liee aussi — rangs.size vaut N moins 2', () => {
		// CRITÈRE 2. `nbCandidats` est choisi POUR QUE LA TRONCATURE NE MORDE PAS : sinon
		// `N−2` et `CANDIDATS_MAX` coïncideraient et le test ne dirait pas lequel a parlé.
		const { dossier, cible, porteurId, lieeId, rangsAttendus } = construireRelations(4)
		const { texte, entitesInjectees, rangs } = contexteRelations(dossier, cible)
		const N = dossier.monde.personnages.length

		expect(N - 2).toBeLessThan(CANDIDATS_MAX)
		expect(rangs.size).toBe(N - 2)
		// AUCUN rang ne résout le porteur — et ce n'est PAS un doublon qu'on éviterait par
		// hygiène : `nom` n'étant jamais injecté, le modèle croirait que `FICHE` et `Pn`
		// sont DEUX PERSONNES, et écrirait une FICTION FAUSSE que ni le validateur ni
		// l'écran ne pourraient voir (§ 8, n° 6).
		expect([...rangs.values()]).not.toContain(porteurId)
		// … ni la cible DÉJÀ LIÉE : un doublon cesse d'être REPRÉSENTABLE.
		expect([...rangs.values()]).not.toContain(lieeId)
		expect(texte).not.toContain(lieeId)
		// Et elle était bien liée, avec du CONTENU à injecter : sans cette moitié, le test
		// serait vert sur un personnage que rien n'aurait retenu de toute façon.
		const porteur = dossier.monde.personnages.find((personnage) => personnage.id === porteurId)
		expect(porteur?.relations?.map((relation) => relation.cible_id)).toEqual([lieeId])
		expect(dossier.monde.personnages.find((personnage) => personnage.id === lieeId)?.fonction).toBeDefined()

		// ÉGALITÉ, jamais inclusion — le porteur EN TÊTE, puis les rangs dans l'ordre.
		expect(entitesInjectees).toEqual([porteurId, ...rangs.values()])
		expect(entitesInjectees[0]).toBe(porteurId)
		// `P2` résout le DEUXIÈME identifiant de la table — AUCUNE conversion numérique,
		// c'est un `Map.get` sur la chaîne telle quelle.
		expect(rangs.get('P2')).toBe([...rangs.values()][1])
		expect([...rangs.keys()]).toEqual(rangsAttendus.map((_, rang) => `P${rang + 1}`))
		expect([...rangs.values()]).toEqual(rangsAttendus)
	})

	it('les rangs suivent premier d abord, puis l ordre du document, et portee n est jamais injectee', () => {
		const { dossier, cible, rangsAttendus } = construireRelations(CANDIDATS_MAX + 1)
		const { texte, rangs } = contexteRelations(dossier, cible)

		expect([...rangs.values()]).toEqual(rangsAttendus)
		expect(rangs.size).toBe(CANDIDATS_MAX)
		expect(texte).not.toContain('portee')
		expect(texte).not.toContain('premier')
	})

	it('un candidat sans aucune ligne ne consomme pas de rang', () => {
		// Un bloc de rang sans une seule ligne enseignerait « celui-là n'a rien », ce qui
		// est une AFFIRMATION ; le repli est le SILENCE.
		const { dossier, cible } = construireRelations(4)
		const muet: Personnage = { id: 'pnj.muet', portee: 'premier', plan_actions: [], savoirs: [] }
		const avecMuet: Dossier = {
			...dossier,
			monde: { ...dossier.monde, personnages: [...dossier.monde.personnages, muet] },
		}

		const { texte, rangs, entitesInjectees } = contexteRelations(avecMuet, cible)

		expect([...rangs.values()]).not.toContain(muet.id)
		expect(entitesInjectees).not.toContain(muet.id)
		// Les rangs restent CONTIGUS : `P1`, `P2`, … sans trou.
		expect([...rangs.keys()]).toEqual([...rangs.keys()].map((_, rang) => `P${rang + 1}`))
		expect(rangs.size).toBeGreaterThan(0)
		// Et AUCUN bloc de rang n'est vide — un bloc à une seule ligne serait exactement
		// le mode de panne visé.
		const blocsDeRang = texte.split('\n\n').filter((bloc) => /^P\d+$/.test(bloc.split('\n')[0]))
		expect(blocsDeRang).toHaveLength(rangs.size)
		expect(blocsDeRang.filter((bloc) => bloc.split('\n').length < 3)).toEqual([])
	})

	it('le plan est TRONQUE chez un candidat, NON tronque chez le porteur', () => {
		const { dossier, cible, porteurId, rangsAttendus } = construireRelations(4)
		const premiere = valeurLaPlusLongue(dossierDeReference(), 'monde.personnages[].plan_actions[].action')
		// LA SECONDE ÉTAPE VIENT D'UN CHEMIN QUE CE RÔLE N'INJECTE NULLE PART — mesuré :
		// prise sous `but.libelle`, elle entrerait dans le bloc du candidat PAR CE
		// CHEMIN-LÀ, et le témoin rougirait sans qu'aucune troncature ait manqué.
		const seconde = valeurLaPlusLongue(dossierDeReference(), 'monde.indices[].formulation_joueur')
		const deuxEtapes = [
			{ etape: 1, action: premiere },
			{ etape: 2, action: seconde },
		]
		const bavard: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === porteurId || personnage.id === rangsAttendus[0]
						? { ...personnage, plan_actions: deuxEtapes }
						: personnage,
				),
			},
		}

		const { texte } = contexteRelations(bavard, cible)
		const blocs = texte.split('\n\n')
		const blocPorteur = String(blocs.find((bloc) => bloc.startsWith(`${EN_TETE_PORTEUR}\n`)))
		const blocCandidat = String(blocs.find((bloc) => /^P1\n/.test(bloc)))

		// LE PORTEUR porte les DEUX étapes — il n'y a qu'une fiche, et ce qu'il entreprend
		// est ce qui le lie aux autres.
		expect(blocPorteur).toContain(premiere)
		expect(blocPorteur).toContain(seconde)
		// LE CANDIDAT n'en porte qu'UNE — troncature de LISTE, à son premier élément.
		expect(blocCandidat).toContain(premiere)
		expect(blocCandidat).not.toContain(seconde)
		// JAMAIS DE CHAÎNE : chaque ligne de valeur est une valeur ENTIÈRE. Une troncature
		// de chaîne produirait une ligne qui n'est valeur de rien.
		const valeursAutorisees = new Set(
			feuillesDeLaFixture(bavard)
				.filter((feuille) => typeof feuille.valeur === 'string')
				.map((feuille) => String(feuille.valeur)),
		)
		const lignesDeValeur = blocs
			.flatMap((bloc) => bloc.split('\n'))
			.filter((ligne) => !CHEMINS_REL.includes(ligne) && !/^P\d+$/.test(ligne) && ligne !== EN_TETE_PORTEUR)
		expect(lignesDeValeur.filter((ligne) => !valeursAutorisees.has(ligne))).toEqual([])
		expect(lignesDeValeur.length).toBeGreaterThan(0)
	})

	it('un champ marque est RETIRE, jamais remplace par une chaine vide', () => {
		const { dossier, cible, porteurId } = construireRelations(4)
		const marque: Dossier = {
			...dossier,
			monde: {
				...dossier.monde,
				personnages: dossier.monde.personnages.map((personnage) =>
					personnage.id === porteurId
						? { ...personnage, description_joueur: `${MARQUEUR_A_ECRIRE} à décrire` }
						: personnage,
				),
			},
		}

		const { texte } = contexteRelations(marque, cible)

		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
		const blocPorteur = String(texte.split('\n\n').find((bloc) => bloc.startsWith(`${EN_TETE_PORTEUR}\n`)))
		expect(blocPorteur).not.toContain('monde.personnages[].description_joueur')
	})

	it('deux assemblages de la meme cible sur un dossier inchange sont strictement egaux', () => {
		const { dossier, cible } = construireRelations(4)

		expect(contexteRelations(dossier, cible).texte).toBe(contexteRelations(dossier, cible).texte)
	})
})

describe('assemblerRelations — les QUATRE refus, et la mesure', () => {
	it('les quatre refus, discrimines, 0 fetch', () => {
		// ⚠ PREMIER RÔLE À UTILISER LES QUATRE MOTIFS — aucun motif neuf, aucune charge
		// neuve. Les quatre sont éprouvés DANS LE MÊME TEST, et prouvés DISTINCTS DEUX À
		// DEUX : une liste d'assertions voisines ne prouverait pas la discriminance
		// (KR-197/199).
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier, cible, porteurId } = construireRelations(4)

			// 1 — `a-ecrire` : le seul motif À CHARGE, et la charge est le chemin.
			const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
			expect(assemblerRelations(sansTon, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// 2 — `cible-a-ecrire`, SANS charge : la DISJONCTION sur les chemins de fiche du
			// PORTEUR — un lien peut naître d'une fonction, d'une réputation OU d'un but.
			const muet: Personnage = { id: 'pnj.sans-identite', portee: 'premier', plan_actions: [], savoirs: [] }
			const avecMuet: Dossier = {
				...dossier,
				monde: { ...dossier.monde, personnages: [...dossier.monde.personnages, muet] },
			}
			expect(assemblerRelations(avecMuet, cibleRelations(muet.id))).toEqual({ ok: false, motif: 'cible-a-ecrire' })
			// Une cible qui ne résout plus du tout emprunte le MÊME refus.
			expect(assemblerRelations(dossier, cibleRelations('pnj.jamais-existe'))).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})

			// 3 — `aucun-candidat`, SANS charge : le porteur est DÉJÀ lié à tout le monde.
			const tousLies: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.map((personnage) =>
						personnage.id === porteurId
							? {
									...personnage,
									relations: dossier.monde.personnages
										.filter((autre) => autre.id !== porteurId)
										.map((autre) => ({
											cible_id: autre.id,
											lien: 'Un lien deja ecrit.',
											intensite: INTENSITE_INITIALE,
										})),
								}
							: personnage,
					),
				},
			}
			expect(assemblerRelations(tousLies, cible)).toEqual({ ok: false, motif: 'aucun-candidat' })
			// … et le MÊME refus quand le porteur est SEUL au dossier : « tous sont déjà
			// liés » et « il est seul » demandent le même geste à l'auteur.
			const seul: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					personnages: dossier.monde.personnages.filter((personnage) => personnage.id === porteurId),
				},
			}
			expect(assemblerRelations(seul, cible)).toEqual({ ok: false, motif: 'aucun-candidat' })

			// 4 — `trop-long` : AUCUNE charge, il pointe la fiche, pas un champ.
			// ⚠ LE LEVIER EST `canon.partage.accroche_joueur`, ET NON `canon.mj.synopsis_mj` :
			// ce rôle N'INJECTE PAS le synopsis (retiré POUR POINT DE VUE), donc le gonfler
			// n'allongerait rien et le refus ne partirait jamais — un test vert qui ne mesure
			// pas le refus qu'il nomme (KR-199).
			const enorme: Dossier = {
				...dossier,
				canon: {
					...dossier.canon,
					partage: { ...dossier.canon.partage, accroche_joueur: 'x'.repeat(BUDGET_RELATIONS + 1) },
				},
			}
			expect(assemblerRelations(enorme, cible)).toEqual({ ok: false, motif: 'trop-long' })

			// LES QUATRE SONT DISTINCTS DEUX À DEUX.
			const motifs = [
				assemblerRelations(sansTon, cible),
				assemblerRelations(avecMuet, cibleRelations(muet.id)),
				assemblerRelations(tousLies, cible),
				assemblerRelations(enorme, cible),
			].map((refus) => (refus.ok ? 'ASSEMBLÉ' : refus.motif))
			expect(new Set(motifs).size).toBe(4)

			// ET L'ORDRE EST FIGÉ : un dossier qui cumule les quatre défauts rend le PREMIER
			// motif, jamais un autre — sans quoi l'écran nommerait le mauvais geste.
			const cumul: Dossier = {
				...enorme,
				canon: { ...enorme.canon, ton: MARQUEUR_A_ECRIRE },
				monde: {
					...enorme.monde,
					personnages: enorme.monde.personnages.filter((personnage) => personnage.id === porteurId),
				},
			}
			expect(assemblerRelations(cumul, cible)).toEqual({ ok: false, motif: 'a-ecrire', chemin: 'canon.ton' })

			// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des cas ci-dessus.
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('BUDGET du 5e role, mesure', () => {
		const { dossier, cible, porteurId, rangsAttendus } = construireRelations(CANDIDATS_MAX + 1)

		// TEMPS 1 — NON-VACUITÉ, chemin par chemin, NOMMÉE (jamais un compte). Sans elle,
		// `M` est un PLANCHER et le budget qu'on en dérive protège moins qu'il ne prétend.
		// LES HUIT sont éprouvés : les trois du canon, les CINQ du porteur.
		const porteur = dossier.monde.personnages.find((personnage) => personnage.id === porteurId)
		const unCandidat = dossier.monde.personnages.find((personnage) => personnage.id === rangsAttendus[0])
		const remplisDuCanon = cheminsRemplis(dossier)
		const remplisDuPorteur = cheminsRemplis(porteur, PREFIXE_PERSONNAGE)
		const vides = [
			...CHEMINS_REL_DE_CANON.filter((chemin) => !remplisDuCanon.has(chemin)),
			...CHEMINS_REL_DE_FICHE.filter((chemin) => !remplisDuPorteur.has(chemin)),
		]
		expect(vides).toEqual([])
		// … et les QUATRE chemins d'un candidat résolvent non vides eux aussi, sinon `M`
		// serait un plancher par l'autre bout.
		const remplisDuCandidat = cheminsRemplis(unCandidat, PREFIXE_PERSONNAGE)
		expect(cheminsCandidatExtraits().filter((chemin) => !remplisDuCandidat.has(chemin))).toEqual([])

		// TEMPS 2 — `M`, `CANDIDATS_MAX` SATURÉ. La saturation fait partie du protocole :
		// mesurer à 3 candidats donnerait un budget que le 4ᵉ ferait exploser.
		const contexte = contexteRelations(dossier, cible)
		expect(contexte.rangs.size).toBe(CANDIDATS_MAX)
		const M = contexte.texte.length
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au millier
		// supérieur : l'arrondi EST la marge. Ce n'est PAS un cliquet — et SI LA MESURE
		// DÉPLAÎT, ON BAISSE `CANDIDATS_MAX`, JAMAIS LE BUDGET.
		expect(BUDGET_RELATIONS).toBe(Math.ceil((M * 3) / 1000) * 1000)

		// Et les QUATRE autres rôles n'ont PAS bougé : c'est tout l'objet du `Record` — un
		// scalaire partagé aurait desserré la garde d'un rôle par la mesure d'un autre,
		// sans un seul test rouge (KR-235).
		expect(BUDGET_PROSE).toBe(6000)
		expect(BUDGET_DETENTEURS).toBe(17_000)
		expect(BUDGET_REPLIQUES).toBe(4000)
		expect(BUDGET_PLAN).toBe(4000)
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		// LE CANARI DE PLAFOND, à ±1 CARACTÈRE — un plafond dont personne n'a éprouvé les
		// deux bords est une intention, pas une borne.
		const { dossier, cible } = construireRelations(CANDIDATS_MAX + 1)
		// LE LEVIER EST UN CHEMIN RÉELLEMENT INJECTÉ PAR CE RÔLE — le synopsis ne l'est
		// pas, et viser dessus mesurerait un texte de longueur constante.
		const avecAccroche = (accroche: string): Dossier => ({
			...dossier,
			canon: { ...dossier.canon, partage: { ...dossier.canon.partage, accroche_joueur: accroche } },
		})
		const socle = contexteRelations(avecAccroche('x'), cible).texte.length - 1

		expect(contexteRelations(avecAccroche('x'.repeat(BUDGET_RELATIONS - socle)), cible).texte).toHaveLength(
			BUDGET_RELATIONS,
		)
		expect(assemblerRelations(avecAccroche('x'.repeat(BUDGET_RELATIONS - socle)), cible).ok).toBe(true)
		expect(assemblerRelations(avecAccroche('x'.repeat(BUDGET_RELATIONS - socle + 1)), cible)).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})
})

// ══ LE SIXIÈME RÔLE — `monde-distribution` ══════════════════════════════════

const ROLE_DISTRIBUTION = 'monde-distribution'
const BUDGET_DISTRIBUTION = BUDGET_CARACTERES_CONTEXTE[ROLE_DISTRIBUTION]

const CHEMINS_DIS = CHAMPS_INJECTES[ROLE_DISTRIBUTION]
const CHEMINS_DIS_DE_FICHE = CHEMINS_DIS.filter((chemin) => chemin.startsWith(PREFIXE_PERSONNAGE))
const CHEMINS_DIS_DE_CANON = CHEMINS_DIS.filter((chemin) => !chemin.startsWith(PREFIXE_PERSONNAGE))

/** L'EN-TÊTE DU BLOC DES DÉJÀ ÉCRITS — `DEJA ECRIT`, jamais `P…` ni `FICHE`. */
const EN_TETE_DEJA_ECRIT = 'DEJA ECRIT'
const CHEMIN_SYNOPSIS = 'canon.mj.synopsis_mj'
const CHEMIN_FONCTION = 'monde.personnages[].fonction'
const CHEMIN_CORPS_DISTRIBUTION = path.join(__dirname, 'contexte', 'distribution.ts')

/** ⚠ LA CIBLE DE CE RÔLE EST À CHARGE VIDE — la seule des six. Ce n'est pas une
 *  fonction paramétrée parce qu'il n'y a RIEN à paramétrer : la cible est le dossier. */
const CIBLE_DISTRIBUTION: CibleDistribution = { role: ROLE_DISTRIBUTION }

/**
 * LE DOSSIER DE MESURE DU SIXIÈME RÔLE — COMPOSÉ PAR LE TEST, jamais inventé, et jamais
 * la fixture (qui n'appartient à aucun lot de cette itération).
 *
 * MOTIF DE LA COMPOSITION, MESURÉ : `dossier-reference.json` ne porte que DEUX
 * personnages à `fonction` rédigée, là où `DEJA_ECRITS_MAX` en admet DOUZE. Mesurer sur
 * la fixture intacte donnerait un `M` qui n'a jamais vu la borne saturée, c'est-à-dire
 * un PLANCHER et non une mesure — et le budget qu'on en dériverait protégerait moins
 * qu'il ne le prétend.
 *
 * `nbEcrits` est un PARAMÈTRE, pour la même raison qu'au cinquième rôle : la MESURE
 * exige `DEJA_ECRITS_MAX` SATURÉ, alors que le témoin de troncature exige au contraire
 * qu'on puisse la faire MORDRE et NE PAS mordre — sinon « douze » et « tous » seraient
 * indistinguables (KR-199).
 *
 * ⚠ LES PERSONNAGES MUETS SONT DÉLIBÉRÉS : `nbMuets` fiches SANS `fonction` sont
 * intercalées EN TÊTE. Elles n'excluent rien, donc elles ne doivent NI entrer dans le
 * bloc NI consommer une place de la borne — c'est le témoin du « filtre avant
 * troncature ». La valeur de `fonction` est LUE du document, jamais écrite ici.
 */
function construireDistribution(
	nbEcrits: number,
	nbMuets = 0,
): { dossier: Dossier; fonction: string; ecritsAttendus: string[] } {
	const reference = dossierDeReference()
	const fonction = valeurLaPlusLongue(reference, CHEMIN_FONCTION)
	const modeles = reference.monde.personnages

	const ecrits = Array.from(
		{ length: nbEcrits },
		(_, rang): Personnage => ({
			id: `pnj.ecrit-${rang}`,
			nom: modeles[rang % modeles.length].nom,
			// Les portées ALTERNENT : sans cela, « `premier` d'abord, puis l'ordre du
			// document » serait indistinguable de « l'ordre du document » tout court.
			portee: rang % 2 === 0 ? 'second' : 'premier',
			plan_actions: [],
			savoirs: [],
			fonction,
		}),
	)
	const muets = Array.from(
		{ length: nbMuets },
		(_, rang): Personnage => ({
			id: `pnj.muet-${rang}`,
			// `premier` pour qu'ils soient en TÊTE de l'ordre : s'ils consommaient une
			// place de la borne, ils la prendraient AVANT les fiches écrites.
			portee: 'premier',
			plan_actions: [],
			savoirs: [],
		}),
	)

	return {
		dossier: { ...reference, monde: { ...reference.monde, personnages: [...muets, ...ecrits] } },
		fonction,
		// `premier` d'abord, puis l'ordre du document — les muets n'y sont PAS.
		ecritsAttendus: [
			...ecrits.filter((personnage) => personnage.portee === 'premier').map((personnage) => personnage.id),
			...ecrits.filter((personnage) => personnage.portee !== 'premier').map((personnage) => personnage.id),
		].slice(0, DEJA_ECRITS_MAX),
	}
}

/** Le contexte assemblé, ou l'échec du test s'il a été refusé. */
function contexteDistribution(dossier: Dossier): { texte: string; entitesInjectees: readonly string[] } {
	const contexte = assemblerDistribution(dossier, CIBLE_DISTRIBUTION)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte
}

describe('assemblerDistribution — confinement d audience du sixieme role', () => {
	it('confinement du 6e role — CINQ chemins, tous ia, soupape vide', () => {
		// CRITÈRE 1, PREMIÈRE MOITIÉ.
		expect(CHEMINS_DIS).toHaveLength(5)
		// Assertion de VALEUR, jamais d'existence (KR-174) : `toEqual([])` sur les écarts
		// NOMME le chemin fautif et sa destination réelle.
		const ecarts = CHEMINS_DIS.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia').map(
			(chemin) => `${chemin} → ${DESTINATION_DES_CHAMPS[chemin] ?? 'AUCUNE DESTINATION'}`,
		)
		expect(ecarts).toEqual([])
		// La soupape n'a pas bougé : un SIXIÈME rôle n'ouvre aucune dérogation (KR-232).
		expect(DEROGATIONS_AUDIENCE).toEqual([])
		// La liste exacte, épinglée : QUATRE du canon, UN de fiche.
		expect([...CHEMINS_DIS].sort()).toEqual(
			[
				'canon.mj.synopsis_mj',
				'canon.ton',
				'canon.interdits_ton[]',
				'canon.partage.accroche_joueur',
				'monde.personnages[].fonction',
			].sort(),
		)
	})

	it('le SYNOPSIS est injecte ici, et c est le RENVERSEMENT assume', () => {
		// ⚠ `canon.mj.synopsis_mj` est RETIRÉ des rôles 3a, 3b et 3c « pour point de
		// vue », et INJECTÉ ici comme SOURCE. Le test épingle LES DEUX CÔTÉS : sans la
		// seconde moitié, « injecté ici » serait indistinguable d'« injecté partout ».
		expect(CHEMINS_DIS).toContain(CHEMIN_SYNOPSIS)
		expect(CHAMPS_INJECTES['personnage-prose']).toContain(CHEMIN_SYNOPSIS)
		for (const role of ['personnage-repliques', 'personnage-plan', 'personnage-relations'] as const) {
			expect(`${role} → ${CHAMPS_INJECTES[role].includes(CHEMIN_SYNOPSIS)}`).toBe(`${role} → false`)
		}

		// … et il est RÉELLEMENT dans le texte assemblé, pas seulement dans la liste.
		const { dossier } = construireDistribution(3)
		const texte = contexteDistribution(dossier).texte
		expect(texte).toContain(CHEMIN_SYNOPSIS)
		expect(texte).toContain(String(dossier.canon.mj.synopsis_mj))
	})

	it('description_joueur et but.libelle sont ABSENTS — les deux retraits aux motifs PROPRES', () => {
		// CRITÈRE 1 : les deux retraits sont éprouvés SUR LE TEXTE ASSEMBLÉ, pas seulement
		// sur la liste blanche — une liste juste et une boucle qui lit ailleurs ne se
		// distinguent que là.
		expect(CHEMINS_DIS).not.toContain('monde.personnages[].description_joueur')
		expect(CHEMINS_DIS).not.toContain('monde.personnages[].but.libelle')

		const reference = dossierDeReference()
		const publiques = valeurLaPlusLongue(reference, 'monde.personnages[].description_joueur')
		const vouloirs = valeurLaPlusLongue(reference, 'monde.personnages[].but.libelle')
		const fonction = valeurLaPlusLongue(reference, CHEMIN_FONCTION)
		// Les trois valeurs existent bel et bien au dossier — sinon les absences
		// ci-dessous seraient vraies pour rien (KR-199).
		expect(publiques.length).toBeGreaterThan(0)
		expect(vouloirs.length).toBeGreaterThan(0)

		const dossier: Dossier = {
			...reference,
			monde: {
				...reference.monde,
				personnages: [
					{
						id: 'pnj.tout-rempli',
						portee: 'premier',
						plan_actions: [],
						savoirs: [],
						fonction,
						description_joueur: publiques,
						but: { libelle: vouloirs },
					},
				],
			},
		}
		const texte = contexteDistribution(dossier).texte

		// La `fonction` EST là — discriminant : sans elle, un assembleur qui n'injecterait
		// RIEN de la fiche passerait les deux absences.
		expect(texte).toContain(fonction)
		expect(texte).not.toContain(publiques)
		expect(texte).not.toContain(vouloirs)
	})

	it('le bloc DEJA ECRIT porte l en-tete exact et AUCUN rang', () => {
		// CRITÈRE 1 : `DEJA ECRIT`, jamais `P…` ni `FICHE` (§ 8, n° 40).
		const { dossier, fonction } = construireDistribution(3)
		const texte = contexteDistribution(dossier).texte

		const blocs = texte.split('\n\n')
		const enTetes = blocs.map((bloc) => bloc.split('\n')[0])
		expect(enTetes).toContain(EN_TETE_DEJA_ECRIT)
		// AUCUN RANG nulle part — ni en en-tête, ni en ligne. Le motif est double : une
		// table de rangs serait un instrument SANS CONSOMMATEUR (KR-235) et une invitation
		// à la référence croisée.
		expect(texte).not.toMatch(/^P\d+$/m)
		expect(enTetes).not.toContain('FICHE')
		// Le bloc porte les fonctions, et RIEN d'autre : son en-tête puis N lignes.
		const bloc = blocs.find((candidat) => candidat.startsWith(EN_TETE_DEJA_ECRIT))
		expect(bloc?.split('\n').slice(1)).toEqual([fonction, fonction, fonction])
	})

	it('zero deja ecrit : le bloc est ABSENT, jamais vide — et aucun refus ne part', () => {
		// ⚠ CRITÈRE 1, SECONDE MOITIÉ, ET CRITÈRE 2 : UN MONDE VIDE EST LE CAS NOMINAL de
		// ce rôle — c'est le premier geste après l'écriture du synopsis. Un bloc vide
		// enseignerait « personne n'existe », ce qui est une AFFIRMATION ; le repli est le
		// SILENCE.
		const reference = dossierDeReference()
		const vide: Dossier = { ...reference, monde: { ...reference.monde, personnages: [] } }

		const contexte = assemblerDistribution(vide, CIBLE_DISTRIBUTION)

		expect(contexte.ok).toBe(true)
		expect(contexte.ok && contexte.entitesInjectees).toEqual([])
		expect(contexte.ok && contexte.texte).not.toContain(EN_TETE_DEJA_ECRIT)
		// Et le texte n'est pas vide pour autant : le canon est bien là.
		expect(contexte.ok && contexte.texte).toContain(CHEMIN_SYNOPSIS)

		// … et le MÊME résultat avec des personnages tous MUETS : « personne » et
		// « personne d'écrit » demandent le même silence.
		const { dossier: muets } = construireDistribution(0, 4)
		const avecMuets = assemblerDistribution(muets, CIBLE_DISTRIBUTION)
		expect(avecMuets.ok).toBe(true)
		expect(avecMuets.ok && avecMuets.texte).not.toContain(EN_TETE_DEJA_ECRIT)
	})

	it('le FILTRE precede la TRONCATURE : un muet ne consomme aucune place de la borne', () => {
		// ⚠ LE SENS MÊME DE `DEJA_ECRITS_MAX`, et il DIFFÈRE de `CANDIDATS_MAX` : celle-ci
		// borne les EXCLUS, celle-là les candidats EXAMINÉS. Les muets sont posés EN TÊTE
		// de l'ordre (`portee: 'premier'`) : s'ils consommaient des places, ils les
		// prendraient aux fiches écrites, et le bloc en porterait MOINS que douze.
		const { dossier, ecritsAttendus } = construireDistribution(DEJA_ECRITS_MAX, 5)

		const contexte = contexteDistribution(dossier)

		expect(contexte.entitesInjectees).toHaveLength(DEJA_ECRITS_MAX)
		expect(contexte.entitesInjectees).toEqual(ecritsAttendus)
		// AUCUN muet n'est audité ni injecté.
		expect(contexte.entitesInjectees.filter((id) => id.startsWith('pnj.muet-'))).toEqual([])
		// LE MUTANT, ÉCRIT À CÔTÉ DE LA VRAIE et prouvé fautif sur ce dossier précis :
		// tronquer AVANT de filtrer rendrait MOINS de douze exclusions.
		const mutantTronqueAvant = dossier.monde.personnages
			.slice(0, DEJA_ECRITS_MAX)
			.filter((personnage) => (personnage.fonction ?? '').trim() !== '')
		expect(mutantTronqueAvant.length).toBeLessThan(DEJA_ECRITS_MAX)
	})

	it('la troncature MORD a DEJA_ECRITS_MAX, et portee SELECTIONNE sans etre injectee', () => {
		// Le témoin exige que la troncature morde RÉELLEMENT : `nbEcrits > DEJA_ECRITS_MAX`.
		const { dossier, ecritsAttendus } = construireDistribution(DEJA_ECRITS_MAX + 4)

		const contexte = contexteDistribution(dossier)

		expect(dossier.monde.personnages.length).toBeGreaterThan(DEJA_ECRITS_MAX)
		expect(contexte.entitesInjectees).toHaveLength(DEJA_ECRITS_MAX)
		// `premier` d'abord, puis l'ordre du document — mécanisme de 3c réutilisé tel quel.
		expect(contexte.entitesInjectees).toEqual(ecritsAttendus)
		const premiers = dossier.monde.personnages.filter((personnage) => personnage.portee === 'premier')
		expect(premiers.length).toBeGreaterThan(0)
		expect(contexte.entitesInjectees.slice(0, premiers.length)).toEqual(premiers.map((p) => p.id))
		// ⚠ `portee` SÉLECTIONNE et n'est JAMAIS injectée — elle est d'audience `moteur`.
		expect(contexte.texte).not.toContain('premier')
		expect(contexte.texte).not.toContain('second')
		expect(DESTINATION_DES_CHAMPS['monde.personnages[].portee']).toBe('moteur')
	})

	it('aucun nom n est injecte, et aucun identifiant non plus', () => {
		// KR-195 : `nom` n'est jamais injecté. Les fiches composées en PORTENT un, tiré du
		// document — sans quoi ce témoin serait vrai par absence.
		const { dossier } = construireDistribution(4)
		const texte = contexteDistribution(dossier).texte

		const noms = dossier.monde.personnages
			.map((personnage) => personnage.nom)
			.filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')
		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => texte.includes(nom))).toEqual([])
		// Et aucun identifiant de personnage non plus : le modèle ne peut désigner personne.
		expect(dossier.monde.personnages.filter((personnage) => texte.includes(personnage.id))).toEqual([])
	})

	it('tout ce que porte le contexte assemble vient d un chemin autorise', () => {
		const { dossier, fonction } = construireDistribution(3)
		const texte = contexteDistribution(dossier).texte

		const blocs = texte.split('\n\n')
		const enTetes = blocs.map((bloc) => bloc.split('\n')[0])
		// (a) les ÉTIQUETTES : un chemin autorisé, ou l'en-tête du bloc négatif, et rien
		// d'autre.
		expect(enTetes.filter((enTete) => !CHEMINS_DIS.includes(enTete) && enTete !== EN_TETE_DEJA_ECRIT)).toEqual([])

		// (b) les VALEURS : chaque ligne de valeur est une feuille du dossier vivant sous
		// un chemin autorisé. Inclusion de CHEMINS, AUCUN seuil numérique (KR-235).
		const autorisees = new Set<string>([fonction])
		for (const feuille of feuillesDeLaFixture(dossier)) {
			if (typeof feuille.valeur !== 'string') continue
			if (CHEMINS_DIS.includes(feuille.normalise)) autorisees.add(feuille.valeur)
		}
		const lignesDeValeur = blocs.flatMap((bloc) => bloc.split('\n').slice(1))
		expect(lignesDeValeur.filter((ligne) => !autorisees.has(ligne))).toEqual([])
		// Discriminant : sans cette ligne, un contexte VIDE passerait les deux assertions.
		expect(lignesDeValeur.length).toBeGreaterThan(0)
	})

	it('un champ marque est RETIRE, jamais remplace par une chaine vide', () => {
		const { dossier } = construireDistribution(3)
		const marque: Dossier = {
			...dossier,
			canon: { ...dossier.canon, partage: { ...dossier.canon.partage, accroche_joueur: MARQUEUR_A_ECRIRE } },
		}

		const texte = contexteDistribution(marque).texte

		expect(texte).not.toContain('canon.partage.accroche_joueur')
		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
		// RETRAIT, jamais substitution : aucun bloc d'une seule ligne ne subsiste.
		expect(texte.split('\n\n').filter((bloc) => bloc.split('\n').length < 2)).toEqual([])
	})

	it('deux assemblages sur un dossier inchange sont strictement egaux', () => {
		const { dossier } = construireDistribution(5)
		expect(contexteDistribution(dossier).texte).toBe(contexteDistribution(dossier).texte)
	})
})

describe('assemblerDistribution — les DEUX refus, et les DEUX inatteignables', () => {
	it('les deux refus, discrimines, 0 fetch — et le SYNOPSIS est nomme AVANT le ton', () => {
		// CRITÈRE 2. ⚠ PREMIER RÔLE À DEUX REQUIS, et L'ORDRE DÉCIDE CE QUE L'ÉCRAN NOMME.
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const { dossier } = construireDistribution(3)

			// 1 — `a-ecrire('canon.mj.synopsis_mj')` : LA CHARGE NEUVE. Sur cinq rôles, le
			// `chemin` de ce motif n'avait JAMAIS PU VALOIR QUE `'canon.ton'` — c'est ici
			// qu'il prend sa SECONDE valeur, et c'est la différence entre une CHARGE et une
			// constante déguisée.
			const sansSynopsis: Dossier = {
				...dossier,
				canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: MARQUEUR_A_ECRIRE } },
			}
			expect(assemblerDistribution(sansSynopsis, CIBLE_DISTRIBUTION)).toEqual({
				ok: false,
				motif: 'a-ecrire',
				chemin: CHEMIN_SYNOPSIS,
			})

			// 2 — `a-ecrire('canon.ton')` : le filtre générique des six rôles.
			const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
			expect(assemblerDistribution(sansTon, CIBLE_DISTRIBUTION)).toEqual({
				ok: false,
				motif: 'a-ecrire',
				chemin: 'canon.ton',
			})

			// 3 — `trop-long` : AUCUNE charge, il pointe la fiche, pas un champ.
			const enorme: Dossier = {
				...dossier,
				canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: 'x'.repeat(BUDGET_DISTRIBUTION + 1) } },
			}
			expect(assemblerDistribution(enorme, CIBLE_DISTRIBUTION)).toEqual({ ok: false, motif: 'trop-long' })

			// ⚠ L'ORDRE EST FIGÉ, ET C'EST LE CŒUR DU CRITÈRE : un dossier à qui manquent
			// LES DEUX requis s'entend nommer LE SYNOPSIS, jamais le ton — le manque le plus
			// SPÉCIFIQUE à cette carte avant le manque GÉNÉRIQUE.
			const cumul: Dossier = {
				...enorme,
				canon: {
					...enorme.canon,
					ton: MARQUEUR_A_ECRIRE,
					mj: { ...enorme.canon.mj, synopsis_mj: MARQUEUR_A_ECRIRE },
				},
			}
			expect(assemblerDistribution(cumul, CIBLE_DISTRIBUTION)).toEqual({
				ok: false,
				motif: 'a-ecrire',
				chemin: CHEMIN_SYNOPSIS,
			})
			// LE MUTANT DE L'ORDRE, écrit à côté de la vraie : la table INVERSÉE nommerait
			// le ton. C'est cet ordre-là, et lui seul, que l'écran rend.
			expect([...PARTIES_REQUISES[ROLE_DISTRIBUTION]]).toEqual([CHEMIN_SYNOPSIS, 'canon.ton'])
			expect([...PARTIES_REQUISES[ROLE_DISTRIBUTION]].reverse()[0]).toBe('canon.ton')

			// LES TROIS REFUS SONT DISTINCTS DEUX À DEUX — la moitié que le nom promet.
			const motifs = [
				assemblerDistribution(sansSynopsis, CIBLE_DISTRIBUTION),
				assemblerDistribution(sansTon, CIBLE_DISTRIBUTION),
				assemblerDistribution(enorme, CIBLE_DISTRIBUTION),
			].map((refus) => (refus.ok ? 'ASSEMBLÉ' : JSON.stringify(refus)))
			expect(new Set(motifs).size).toBe(3)

			// ET AUCUN APPEL RÉSEAU N'EST PARTI, pour aucun des cas ci-dessus.
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('cible-a-ecrire et aucun-candidat sont INATTEIGNABLES ici, et c est ASSERTE', () => {
		// ⚠ CRITÈRE 2, SECONDE MOITIÉ — À DIRE, PAS À TAIRE (famille BUG-084, KR-235).
		// Les deux motifs EXISTENT dans `MotifRefusContexte` et sont produits par d'autres
		// rôles ; ce rôle-ci ne peut en produire aucun, et la preuve porte sur les états
		// qui les produiraient ailleurs.
		const reference = dossierDeReference()
		const etats: Array<[string, Dossier]> = [
			// Le monde VIDE — l'état qui donnerait `aucun-candidat` au rôle relations, et qui
			// est LE CAS NOMINAL de celui-ci.
			['monde vide', { ...reference, monde: { ...reference.monde, personnages: [] } }],
			// Un monde de personnages SANS UNE LIGNE — l'état qui donnerait `cible-a-ecrire`
			// aux rôles répliques et relations.
			['tous muets', construireDistribution(0, 6).dossier],
			// Un monde peuplé et rédigé — le cas heureux.
			['peuple', construireDistribution(3).dossier],
		]

		const motifs = etats.map(([nom, dossier]) => {
			const contexte = assemblerDistribution(dossier, CIBLE_DISTRIBUTION)
			return `${nom} → ${contexte.ok ? 'ASSEMBLÉ' : contexte.motif}`
		})

		expect(motifs).toEqual(['monde vide → ASSEMBLÉ', 'tous muets → ASSEMBLÉ', 'peuple → ASSEMBLÉ'])
		// … et le CORPS ne porte NI l'un NI l'autre motif : une branche qu'aucun état ne
		// peut atteindre se constate à la SOURCE.
		const corps = fs.readFileSync(CHEMIN_CORPS_DISTRIBUTION, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
		expect(corps).not.toContain("motif: 'cible-a-ecrire'")
		expect(corps).not.toContain("motif: 'aucun-candidat'")
		// Discriminants : les deux motifs EXISTENT bel et bien ailleurs — sans eux, les
		// deux absences ci-dessus seraient vraies pour rien (KR-199).
		const corpsRelations = fs.readFileSync(CHEMIN_CORPS_RELATIONS, 'utf8').replace(/\/\*[\s\S]*?\*\//g, '')
		expect(corpsRelations).toContain("motif: 'cible-a-ecrire'")
		expect(corpsRelations).toContain("motif: 'aucun-candidat'")
		// … et le corps de ce rôle-ci porte bien SES deux refus : l'absence n'est pas celle
		// d'un assembleur qui ne refuserait rien.
		expect(corps).toContain("motif: 'a-ecrire'")
		expect(corps).toContain("motif: 'trop-long'")
	})

	it('BUDGET du 6e role, mesure', () => {
		// CRITÈRE 5, PREMIÈRE MOITIÉ.
		const { dossier, ecritsAttendus } = construireDistribution(DEJA_ECRITS_MAX + 1)

		// TEMPS 1 — NON-VACUITÉ, chemin par chemin, NOMMÉE (jamais un compte). Sans elle,
		// `M` est un PLANCHER et le budget qu'on en dérive protège moins qu'il ne prétend.
		// LES CINQ sont éprouvés : les QUATRE du canon, et celui de fiche.
		const unEcrit = dossier.monde.personnages.find((personnage) => personnage.id === ecritsAttendus[0])
		const remplisDuCanon = cheminsRemplis(dossier)
		const remplisDeLEcrit = cheminsRemplis(unEcrit, PREFIXE_PERSONNAGE)
		const vides = [
			...CHEMINS_DIS_DE_CANON.filter((chemin) => !remplisDuCanon.has(chemin)),
			...CHEMINS_DIS_DE_FICHE.filter((chemin) => !remplisDeLEcrit.has(chemin)),
		]
		expect(vides).toEqual([])

		// TEMPS 2 — `M`, `DEJA_ECRITS_MAX` SATURÉ. La saturation fait partie du protocole :
		// mesurer à deux déjà écrits — ce que la fixture intacte porte — donnerait un
		// budget que le troisième ferait exploser.
		const contexte = contexteDistribution(dossier)
		expect(contexte.entitesInjectees).toHaveLength(DEJA_ECRITS_MAX)
		const M = contexte.texte.length
		expect(M).toBeGreaterThan(0)

		// TEMPS 3 — la formule. Facteur 3 (décision datée du comité), arrondi au millier
		// supérieur : l'arrondi EST la marge. SI LA MESURE AVAIT DÉPLU, ON AURAIT BAISSÉ
		// `DEJA_ECRITS_MAX`, JAMAIS LE BUDGET.
		expect(BUDGET_DISTRIBUTION).toBe(Math.ceil((M * 3) / 1000) * 1000)

		// Et les CINQ autres rôles n'ont PAS bougé : c'est tout l'objet du `Record`.
		expect(BUDGET_PROSE).toBe(6000)
		expect(BUDGET_DETENTEURS).toBe(17_000)
		expect(BUDGET_REPLIQUES).toBe(4000)
		expect(BUDGET_PLAN).toBe(4000)
		expect(BUDGET_RELATIONS).toBe(17_000)
		// ⚠ ET CELUI-CI NE COÏNCIDE AVEC AUCUN DES CINQ — première entrée du registre à
		// pouvoir l'écrire. Les deux précédentes devaient DIRE qu'elles coïncidaient.
		expect([BUDGET_PROSE, BUDGET_DETENTEURS, BUDGET_REPLIQUES, BUDGET_PLAN, BUDGET_RELATIONS]).not.toContain(
			BUDGET_DISTRIBUTION,
		)
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse', () => {
		// LE CANARI DE PLAFOND, à ±1 CARACTÈRE — un plafond dont personne n'a éprouvé les
		// deux bords est une intention, pas une borne.
		const { dossier } = construireDistribution(DEJA_ECRITS_MAX + 1)
		// LE LEVIER EST LE SYNOPSIS, chemin RÉELLEMENT injecté par ce rôle — et c'est le
		// contraire du rôle relations, où viser le synopsis aurait mesuré un texte de
		// longueur constante.
		const avecSynopsis = (synopsis: string): Dossier => ({
			...dossier,
			canon: { ...dossier.canon, mj: { ...dossier.canon.mj, synopsis_mj: synopsis } },
		})
		const socle = contexteDistribution(avecSynopsis('x')).texte.length - 1

		expect(contexteDistribution(avecSynopsis('x'.repeat(BUDGET_DISTRIBUTION - socle))).texte).toHaveLength(
			BUDGET_DISTRIBUTION,
		)
		expect(assemblerDistribution(avecSynopsis('x'.repeat(BUDGET_DISTRIBUTION - socle)), CIBLE_DISTRIBUTION).ok).toBe(
			true,
		)
		expect(
			assemblerDistribution(avecSynopsis('x'.repeat(BUDGET_DISTRIBUTION - socle + 1)), CIBLE_DISTRIBUTION),
		).toEqual({ ok: false, motif: 'trop-long' })
	})
})

// ══ LE SEPTIÈME ASSEMBLEUR — `interprete` (n° 10, `moteur-interprete`) ═══════
//
// HORS DE LA COUTURE COMMUNE (voir la docstring de tête de `./interprete.ts`) :
// ce rôle n'utilise NI `CHAMPS_INJECTES`, NI `PARTIES_REQUISES`, NI
// `BUDGET_CARACTERES_CONTEXTE` — ses tests ci-dessous ne les référencent donc
// jamais, contrairement à ceux des six rôles précédents.
describe('assemblerInterprete — le septieme role, hors registres partages', () => {
	function dossierInterprete(): Dossier {
		return {
			schema: 1,
			id: 'dossier-test-interprete',
			titre: 'Dossier de test',
			createdAt: '2026-09-25T00:00:00.000Z',
			updatedAt: '2026-09-25T00:00:00.000Z',
			canon: {
				mj: { synopsis_mj: 'La verite de cette histoire.' },
				partage: { accroche_joueur: 'Une accroche.' },
				ton: 'Sombre et feutre, phrases courtes.',
				interdits_ton: ['Jamais de familiarite.'],
				objectifs: [],
			},
			monde: {
				personnages: [],
				lieux: [
					{
						id: 'lieu.place',
						description: 'Une place pavee, au centre du village.',
						acces: ['lieu.marche', 'lieu.tour', 'lieu.sans-description'],
					},
					{ id: 'lieu.marche', description: 'Un marche bruyant, sous des toiles rapiecees.', acces: ['lieu.place'] },
					{ id: 'lieu.tour', description: 'Une tour de guet a moitie ecroulee.', acces: ['lieu.place'] },
					{ id: 'lieu.sans-description', nom: 'Un lieu sans description' },
				],
				objets: [],
				indices: [],
				quetes: [],
				evenements: [],
			},
			charpente: {
				depart: { lieu_id: 'lieu.place', texte_ouverture_joueur: 'Tu ouvres les yeux sur la place.' },
				jalons: [],
				fins: [],
			},
		} as unknown as Dossier
	}

	function sessionInterprete(overrides: Partial<EtatSession> = {}): EtatSession {
		return {
			schema: 1,
			dossier_id: 'dossier-test-interprete',
			dossier_maj: '2026-09-25T00:00:00.000Z',
			graine_alea: 1,
			horloge: { tour: 0 },
			monde: {
				lieu_courant: 'lieu.place',
				lieux_visites: ['lieu.place'],
				objets_possedes: [],
				indices_connus: [],
				jalons_atteints: [],
				evenements_consommes: [],
				pnj: {},
			},
			journal: [],
			memoire: null,
			...overrides,
		}
	}

	it('le nominal : candidats-lieux P1..Pn, gestes G1..Gk, ICI sans rang, saisie en dernier', () => {
		const dossier = dossierInterprete()
		const session = sessionInterprete()

		const contexte = assemblerInterprete(dossier, { saisie: 'je vais au marche', session })

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')

		// Le LIEU SANS DESCRIPTION accessible depuis `lieu.place` ne recoit AUCUN
		// rang (KR-267) : `destinationsPossibles` le rend, l'assembleur le tait.
		expect(destinationsPossibles(dossier, session)).toContain('lieu.sans-description')
		expect([...contexte.tables.lieux.values()]).not.toContain('lieu.sans-description')
		expect([...contexte.tables.lieux.keys()].sort()).toEqual(['P1', 'P2'])
		expect([...contexte.tables.lieux.values()].sort()).toEqual(['lieu.marche', 'lieu.tour'])

		// DEUX GESTES DEPUIS LA n° 10 it2, dans l'ORDRE DU REGISTRE : `aller` puis `agir`.
		// Le second est d'arité 0, et c'est son LIBELLÉ — le contrat narratif de KR-269 —
		// que le contexte apporte au modèle, jamais l'invite.
		expect([...contexte.tables.gestes.keys()]).toEqual(['G1', 'G2'])
		expect(contexte.tables.gestes.get('G1')).toBe('aller')
		expect(contexte.tables.gestes.get('G2')).toBe('agir')
		expect(contexte.texte).toContain('G2 — agit sur place — 0 repère(s)')

		// `ICI` porte la description du lieu COURANT, SANS RANG : elle n'apparait
		// dans AUCUNE valeur de `tables.lieux`.
		expect(contexte.texte).toContain('ICI')
		expect(contexte.texte).toContain('Une place pavee')
		expect([...contexte.tables.lieux.values()]).not.toContain('lieu.place')

		// La saisie normalisee vient EN DERNIER.
		expect(contexte.texte.trimEnd().endsWith('je vais au marche')).toBe(true)
	})

	it('canon.ton et canon.interdits_ton[] sont injectes quand ecrits, et sont d audience ia', () => {
		const dossier = dossierInterprete()
		const contexte = assemblerInterprete(dossier, { saisie: 'salut', session: sessionInterprete() })

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')

		expect(contexte.texte).toContain('Sombre et feutre')
		expect(contexte.texte).toContain('Jamais de familiarite')
		expect(DESTINATION_DES_CHAMPS['canon.ton']).toBe('ia')
		expect(DESTINATION_DES_CHAMPS['canon.interdits_ton[]']).toBe('ia')
	})

	it('attente.question et attente.saisie sont injectes quand une attente est en cours, et sont d audience ia', () => {
		const dossier = dossierInterprete()
		const session = sessionInterprete({
			attente: { type: 'clarification', question: 'Le grand marche ou la vigie ?', saisie: 'je vais au marche' },
		})

		const contexte = assemblerInterprete(dossier, { saisie: 'le grand', session })

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte nominal ne doit pas etre refuse')
		expect(contexte.texte).toContain('Le grand marche ou la vigie ?')
		expect(contexte.texte).toContain('je vais au marche')
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['attente.question']).toBe('ia')
		expect(DESTINATION_DES_CHAMPS_DE_SESSION['attente.saisie']).toBe('ia')
	})

	it('refus trop-long AVANT tout appel quand la saisie depasse SAISIE_CARACTERES_MAX', () => {
		const dossier = dossierInterprete()
		const session = sessionInterprete()

		expect(assemblerInterprete(dossier, { saisie: 'x'.repeat(SAISIE_CARACTERES_MAX), session }).ok).toBe(true)
		expect(assemblerInterprete(dossier, { saisie: 'x'.repeat(SAISIE_CARACTERES_MAX + 1), session })).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('impasse : agir reste range — la table de gestes n est PLUS JAMAIS vide depuis l it2', () => {
		// ⚠ RÉÉCRIT À L'IT2 — ce témoin prouvait le COURT-CIRCUIT de l'it1 (« aucun geste
		// satisfiable ⇒ table vide ⇒ `sans_commande` sans appel »). `agir` est d'arité 0,
		// donc TOUJOURS satisfiable : le court-circuit est mort, et il a été RETIRÉ du
		// service plutôt que gardé « par défense » (KR-235). Ce qui se prouve désormais sur
		// le MÊME état — un lieu sans AUCUN accès, impasse jouable — est l'inverse.
		const dossier: Dossier = {
			...dossierInterprete(),
			monde: { ...dossierInterprete().monde, lieux: [{ id: 'lieu.impasse', description: 'Une impasse.' }] },
		}
		const session = sessionInterprete({ monde: { ...sessionInterprete().monde, lieu_courant: 'lieu.impasse' } })

		const contexte = assemblerInterprete(dossier, { saisie: 'je fais quoi', session })

		expect(contexte.ok).toBe(true)
		if (!contexte.ok) throw new Error('le contexte de l impasse ne doit pas etre refuse')
		// AUCUN lieu rangé, donc `aller` n'est PAS satisfiable et ne reçoit aucun rang…
		expect(contexte.tables.lieux.size).toBe(0)
		expect([...contexte.tables.gestes.values()]).not.toContain('aller')
		// … mais `agir`, qui ne désigne rien, l'est — seul, en `G1`.
		expect([...contexte.tables.gestes.entries()]).toEqual([['G1', 'agir']])
	})

	it('le contexte ne grossit PAS avec la session : 40 ALLER acceptes ramenant au meme lieu -> texte toEqual', () => {
		const dossier = dossierInterprete()
		const neuve = sessionInterprete()

		let courante = neuve
		for (let tour = 0; tour < 40; tour += 1) {
			const cible = courante.monde.lieu_courant === 'lieu.place' ? 'lieu.marche' : 'lieu.place'
			courante = {
				...courante,
				horloge: { tour: courante.horloge.tour + 1 },
				monde: {
					...courante.monde,
					lieu_courant: cible,
					lieux_visites: [...new Set([...courante.monde.lieux_visites, cible])],
				},
				journal: [...courante.journal, { tour: courante.horloge.tour + 1, role: 'joueur', texte: `> ALLER ${cible}` }],
			}
		}
		// Discriminant : on est bien revenu au lieu de depart apres 40 pas pairs.
		expect(courante.monde.lieu_courant).toBe('lieu.place')

		const contexteNeuf = assemblerInterprete(dossier, { saisie: 'je vais au marche', session: neuve })
		const contexteApres40 = assemblerInterprete(dossier, { saisie: 'je vais au marche', session: courante })

		expect(contexteNeuf.ok).toBe(true)
		expect(contexteApres40.ok).toBe(true)
		expect(contexteApres40).toEqual(contexteNeuf)
	})
})

// ══ LE HUITIÈME ASSEMBLEUR — `narrateur` (n° 10 `moteur-interprete`, it2 puis it3) ═════
//
// HORS DE LA COUTURE COMMUNE, comme l'interprète : ni `CHAMPS_INJECTES`, ni
// `PARTIES_REQUISES`, ni `BUDGET_CARACTERES_CONTEXTE`. Ses sessions sont PRODUITES PAR
// LE MOTEUR (`ouvrirSession` + `executerCommande`) chaque fois que l'état visé est
// atteignable, et leur MÉMOIRE par sa seule porte d'écriture (`consignerNarration`) ;
// seule la MESURE du pire cas est composée, comme aux six rôles auteur.

/** Les en-têtes d'assemblage du narrateur, écrits ici parce que le test doit savoir
 *  découper le texte en blocs (précédent `EN_TETE_DEJA_ECRIT`). `ICI A1` porte l'ancre du
 *  lieu courant ; les quatre derniers sont ceux de la MÉMOIRE (it3). `PENDANT CE TEMPS` est
 *  celui de la dérogation de la n° 14 (it2). */
const EN_TETES_NARRATEUR = [
	'ICI A1',
	'CE PAS',
	'PENDANT CE TEMPS',
	'EN SA POSSESSION',
	'DEJA ACCOMPLI',
	'saisie',
	'AUPARAVANT',
	'A CONDENSER',
	'RECEMMENT',
	'ETABLI',
] as const
/** Les quatre amorces d'effet — le SENS du changement pour le héros. Écrites ici pour la
 *  même raison ; un changement de l'une d'elles fait rougir ce test, et c'est voulu. */
const AMORCES_D_EFFET = ['obtient', "n'a plus", 'remarque', 'accomplit'] as const
const AUCUN_CHANGEMENT = 'aucun changement'

function ouvertureNarrateur(dossier: Dossier): EtatSession {
	const resultat = ouvrirSession(dossier, { graine_alea: 424242 })
	if (!resultat.ok) throw new Error(`ouverture refusée : ${resultat.refus}`)
	return resultat.session
}

/** Joue des saisies console PAR LE PRODUIT — l'échec est NOMMÉ, jamais avalé. */
function jouerNarrateur(dossier: Dossier, depart: EtatSession, saisies: readonly string[]): EtatSession {
	return saisies.reduce((session, saisie) => {
		const analyse = analyserSaisie(saisie)
		if (!analyse.ok) throw new Error(`saisie refusée : ${analyse.message}`)
		const resultat = executerCommande(dossier, session, analyse.commande)
		if (!resultat.ok) throw new Error(`commande refusée : ${resultat.message}`)
		return resultat.session
	}, depart)
}

function cibleNarrateur(session: EtatSession, saisie = 'je regarde autour de moi'): CibleNarrateur {
	return { role: 'narrateur', saisie, session }
}

function assemblageNarrateur(dossier: Dossier, cible: CibleNarrateur) {
	const contexte = assemblerNarrateur(dossier, cible)
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un assemblage`)
	return contexte
}

function texteNarrateur(dossier: Dossier, cible: CibleNarrateur): string {
	return assemblageNarrateur(dossier, cible).texte
}

/** Les blocs d'un texte assemblé, indexés par leur en-tête (première ligne). */
function blocsNarrateur(texte: string): Map<string, string[]> {
	return new Map(
		texte.split('\n\n').map((bloc) => {
			const [enTete, ...lignes] = bloc.split('\n')
			return [enTete, lignes] as const
		}),
	)
}

/** Le dossier de référence, où la vigie reçoit une description — la fixture n'en porte
 *  pas (et c'est ce qui fait de la vigie un témoin RÉEL du refus `cible-a-ecrire`). */
const DESCRIPTION_VIGIE = 'Une plate-forme de pierre noircie, ouverte au vent, au sommet de la route du nord.'
function referenceAvecVigieDecrite(): Dossier {
	const dossier = dossierDeReference()
	return {
		...dossier,
		monde: {
			...dossier.monde,
			lieux: dossier.monde.lieux.map((lieu) =>
				lieu.id === 'lieu.vigie-du-nord' ? { ...lieu, description: DESCRIPTION_VIGIE } : lieu,
			),
		},
	}
}

/**
 * LE PIRE CAS DE MESURE DU TERME DOSSIER — COMPOSÉ, jamais inventé : toutes les valeurs
 * viennent du dossier de référence. Le lieu décrit dont `description` + `ambiance` est le
 * plus long ; le geste au libellé le plus long ; au pas COURANT, TOUS les objets donnés,
 * TOUS les indices révélés et TOUS les jalons atteints ; donc TOUS les objets possédés et
 * TOUS les jalons atteints ; une saisie de `SAISIE_CARACTERES_MAX` caractères. L'état est
 * COHÉRENT (un objet donné au pas est possédé après lui) ; il n'est pas atteignable tel
 * quel sur ce dossier — la fixture ne porte pas autant d'effets —, et c'est précisément
 * pourquoi il MAJORE. SANS MÉMOIRE : la mémoire est l'autre terme du budget, calculé.
 *
 * n° 14 `moteur-horloge`, it2 puis it3 — `PENDANT CE TEMPS` : TOUS les personnages du dossier de
 * référence qui portent un plan sont PRÉSENTS au lieu retenu, chacun à une étape ajoutée à son
 * plan — aucun plan de la fixture n'a deux étapes, mesuré, donc l'étape visée n'y existe pas
 * telle quelle (même statut que l'état d'ensemble : un majorant composé de valeurs du document,
 * jamais une prose écrite ici). Un personnage sans plan (Harek) ne dit rien. Et CHACUN dit sa
 * PLUS LONGUE prose, `max(action, si_bloque)` (plan d'it3, § 4 bis : les deux sélections sont
 * DISJOINTES, un personnage n'en dit jamais qu'une par pas) :
 *  · si la plus longue `si_bloque` d'une étape À DURÉE de son plan dépasse sa plus longue
 *    `action`, le personnage est BLOQUÉ à ce pas — l'étape ajoutée reprend cette étape-là, durée
 *    comprise, et `depuis` vaut `tour − duree` (le prédicat de blocage constate, sans rien
 *    inventer) ;
 *  · sinon, il est AVANCÉ à ce pas (`depuis` = `tour`), l'étape ajoutée reprenant sa plus longue
 *    `action`.
 */
function pireCasNarrateur(tour = 12): { dossier: Dossier; cible: CibleNarrateur } {
	const reference = dossierDeReference()
	const poids = (lieu: Dossier['monde']['lieux'][number]): number =>
		(lieu.description ?? '').length + (lieu.ambiance ?? '').length
	const lieu = reference.monde.lieux.reduce((meilleur, candidat) =>
		poids(candidat) > poids(meilleur) ? candidat : meilleur,
	)
	const geste = (Object.keys(COMMANDES) as CommandeId[]).reduce((long, id) =>
		COMMANDES[id].label.length > COMMANDES[long].label.length ? id : long,
	)
	const avances = reference.monde.personnages.filter((personnage) => personnage.plan_actions.length > 0)
	/** L'étape ajoutée au plan d'un personnage, et le `depuis` qui la rend dite à `tour`. */
	const etapeAjoutee = (personnage: Personnage): { etape: PlanAction; rang: number; depuis: number } => {
		const plan = personnage.plan_actions
		const parAction = plan.reduce((long, etape) => (etape.action.length > long.action.length ? etape : long))
		type Bloquable = PlanAction & { duree: number; si_bloque: string }
		const parSiBloque = plan
			.filter((etape): etape is Bloquable => etape.duree !== undefined && (etape.si_bloque ?? '').trim() !== '')
			.reduce<
				Bloquable | undefined
			>((long, etape) => (long === undefined || etape.si_bloque.length > long.si_bloque.length ? etape : long), undefined)
		const rang = plan.length
		if (parSiBloque !== undefined && parSiBloque.si_bloque.length > parAction.action.length)
			return { etape: { ...parSiBloque, etape: rang + 1 }, rang, depuis: tour - parSiBloque.duree }
		return { etape: { ...parAction, etape: rang + 1 }, rang, depuis: tour }
	}
	const ajoutees = new Map(avances.map((personnage) => [personnage.id, etapeAjoutee(personnage)]))
	const dossier: Dossier = {
		...reference,
		monde: {
			...reference.monde,
			personnages: reference.monde.personnages.map((personnage) => {
				const ajoutee = ajoutees.get(personnage.id)
				return ajoutee === undefined
					? personnage
					: {
							...personnage,
							presence: [{ lieu_id: lieu.id }],
							plan_actions: [...personnage.plan_actions, ajoutee.etape],
						}
			}),
		},
	}
	const pnj = Object.fromEntries(
		[...ajoutees].map(([id, ajoutee]) => [
			id,
			{ a_dit: [], etape_plan: { rang: ajoutee.rang, depuis: ajoutee.depuis } },
		]),
	)
	const objets = dossier.monde.objets.map((objet) => objet.id)
	const indices = dossier.monde.indices.map((indice) => indice.id)
	const jalons = dossier.charpente.jalons.map((jalon) => jalon.id)
	const applique = (delta: DeltaJournalise['delta'], cible: string): DeltaJournalise => ({
		delta,
		cibles: [cible],
		effet: 'applique',
	})
	const session: EtatSession = {
		...ouvertureNarrateur(dossier),
		horloge: { tour },
		monde: {
			lieu_courant: lieu.id,
			lieux_visites: [lieu.id],
			objets_possedes: objets,
			indices_connus: indices,
			jalons_atteints: jalons,
			evenements_consommes: [],
			pnj,
		},
		journal: [
			{ tour, role: 'joueur', texte: `> ${COMMANDES[geste].verbe}` },
			{ tour, role: 'moteur', texte: `lieu_courant : ${lieu.id}`, origine: geste },
			{
				tour,
				role: 'moteur',
				texte: `jalons_atteints : ${jalons.join(', ')}`,
				deltas: [
					...objets.map((id) => applique('donner_objet', id)),
					...indices.map((id) => applique('reveler_indice', id)),
					...jalons.map((id) => applique('atteindre_jalon', id)),
				],
			},
		],
	}
	return { dossier, cible: cibleNarrateur(session, 'x'.repeat(SAISIE_CARACTERES_MAX)) }
}

/**
 * LA MÉMOIRE SATURÉE DU PIRE CAS — au pas 34, résumé à 10 : la tranche 11–20 est due ET la
 * fenêtre 21–33 est pleine, soit 23 lignes de pas (retard d'UNE condensation, `FENETRE_MAX
 * − 1 + CADENCE`). CHAQUE terme à SA borne de validateur : chaque récit à
 * `NARRATION_CARACTERES_MAX`, le résumé à `CONDENSE_CARACTERES_MAX`, NEUF faits pertinents
 * à `FAIT_CARACTERES_MAX` (un de plus que ce qui repart). Aucun blanc : le repli des blancs
 * ne raccourcit rien, la mesure est exacte.
 */
function avecMemoireSaturee(session: EtatSession): EtatSession {
	const tour = session.horloge.tour
	const passes: EtatSession['journal'] = Array.from({ length: tour - 1 }, (_, rang) => ({
		tour: rang + 1,
		role: 'moteur' as const,
		texte: 'lieu_courant : x',
		origine: 'agir' as const,
		recit: 'r'.repeat(NARRATION_CARACTERES_MAX),
	}))
	return {
		...session,
		journal: [...passes, ...session.journal],
		memoire: {
			faits_etablis: Array.from({ length: FAITS_INJECTES_MAX + 1 }, () => ({
				fait: 'f'.repeat(FAIT_CARACTERES_MAX),
				sur: [session.monde.lieu_courant],
			})),
			resume: { texte: 'c'.repeat(CONDENSE_CARACTERES_MAX), jusqu_au_pas: 10 },
		},
	}
}

describe('assemblerNarrateur — confinement d audience et liste fermee des onze chemins', () => {
	it('les huit chemins injectes sont tous ia : trois du canon, cinq du monde et de la charpente', () => {
		expect(CHAMPS_INJECTES_NARRATEUR).toHaveLength(8)
		expect(CHAMPS_INJECTES_NARRATEUR.filter((chemin) => DESTINATION_DES_CHAMPS[chemin] !== 'ia')).toEqual([])
		// Et les CHEMINS INTERDITS de ce rôle, nommés un à un : le synopsis (il conduirait
		// vers l'intrigue), les dangers (un jet que personne ne résout avant la n° 11), la
		// vérité d'un indice (la solution), tout `nom` (KR-262), toute fiche de personnage.
		for (const interdit of ['canon.mj.synopsis_mj', 'monde.lieux[].dangers', 'monde.indices[].verite']) {
			expect(`${interdit} → ${(CHAMPS_INJECTES_NARRATEUR as readonly string[]).includes(interdit)}`).toBe(
				`${interdit} → false`,
			)
		}
		expect(CHAMPS_INJECTES_NARRATEUR.filter((chemin) => chemin.endsWith('.nom'))).toEqual([])
		expect(CHAMPS_INJECTES_NARRATEUR.filter((chemin) => chemin.startsWith('monde.personnages[]'))).toEqual([])
		// La soupape reste vide : aucune dérogation d'audience pour ce rôle non plus.
		expect(DEROGATIONS_AUDIENCE).toEqual([])
	})

	it('la liste fermee des onze chemins de prose ia est EXACTE, et la n 10 en ouvre CINQ', () => {
		// LE PRÉDICAT, dérivé de la table qui fait foi — jamais un littéral (KR-159).
		const onze = Object.entries(DESTINATION_DES_CHAMPS)
			.filter(([, destination]) => destination === 'ia')
			.map(([chemin]) => chemin)
			.filter((chemin) => chemin.startsWith('monde.') || chemin.startsWith('charpente.'))
			.filter((chemin) => !chemin.startsWith('monde.personnages[].'))
		expect(onze).toHaveLength(11)

		// LA LISTE ÉCRITE en tête de `narrateur.ts` — lue sur disque, ligne à ligne.
		const source = fs.readFileSync(path.join(__dirname, 'contexte', 'narrateur.ts'), 'utf8')
		const lignes = [...source.matchAll(/^ \* {3}· `([^`]+)` — (OUVERT|FERMÉ)/gm)].map((trouve) => ({
			chemin: trouve[1],
			statut: trouve[2],
		}))
		expect(lignes.map((ligne) => ligne.chemin).sort()).toEqual([...onze].sort())

		// LES CINQ OUVERTS SONT EXACTEMENT : le chemin de l'INTERPRÈTE, lu dans SA source,
		// ∪ les chemins du NARRATEUR qui sont dans les onze — jamais cinq littéraux.
		const corpsInterprete = fs.readFileSync(path.join(__dirname, 'contexte', 'interprete.ts'), 'utf8')
		const cheminInterprete = corpsInterprete.match(/const CHEMIN_DESCRIPTION_LIEU = '([^']+)'/)?.[1]
		expect(cheminInterprete).toBe('monde.lieux[].description')
		const ouvertsParLeCode = new Set([
			String(cheminInterprete),
			...CHAMPS_INJECTES_NARRATEUR.filter((chemin) => onze.includes(chemin)),
		])
		const ouvertsDocumentes = lignes.filter((ligne) => ligne.statut === 'OUVERT').map((ligne) => ligne.chemin)
		expect([...ouvertsDocumentes].sort()).toEqual([...ouvertsParLeCode].sort())
		expect(ouvertsDocumentes).toHaveLength(5)
		// Discriminant : UN SEUL des cinq vient de l'interprète, QUATRE du narrateur.
		expect(
			CHAMPS_INJECTES_NARRATEUR.filter((chemin) => onze.includes(chemin) && chemin !== cheminInterprete),
		).toHaveLength(4)
	})

	it('les trois chemins de SESSION que la memoire injecte sont ia — et ils sont REELLEMENT injectes', () => {
		// AUDIENCE AVANT INJECTION (KR-232) : rien ne repart au modèle sans sa ligne. Les trois
		// proses de la mémoire ont la leur dans `sessionDestinations.ts` ; les deux feuilles
		// `'moteur'` (ancres, pointeur) n'apparaissent JAMAIS dans le texte.
		for (const chemin of ['journal[].recit', 'memoire.resume.texte', 'memoire.faits_etablis[].fait'] as const) {
			expect(`${chemin} → ${DESTINATION_DES_CHAMPS_DE_SESSION[chemin]}`).toBe(`${chemin} → ia`)
		}
		const dossier = dossierDeReference()
		const s15 = jouerNarrateur(
			dossier,
			ouvertureNarrateur(dossier),
			Array.from({ length: 15 }, () => 'AGIR'),
		)
		const retenue = consignerNarration(s15, 15, {
			recit: 'Vous veillez encore.',
			faits_etablis: [{ fait: 'Le foyer garde une braise.', sur: ['lieu.foyer-du-guet'] }],
			resume: { texte: 'Vous avez longtemps veillé au foyer.', jusqu_au_pas: 10 },
		})
		const s16 = jouerNarrateur(dossier, retenue, ['AGIR'])
		const texte = texteNarrateur(dossier, cibleNarrateur(s16))

		expect(texte).toContain('Vous veillez encore.')
		expect(texte).toContain('Le foyer garde une braise.')
		expect(texte).toContain('Vous avez longtemps veillé au foyer.')
		expect(texte).not.toContain('lieu.foyer-du-guet')
		expect(texte).not.toMatch(/\b1[05]\b/)
	})
})

describe('assemblerNarrateur — ce que le narrateur voit d un pas', () => {
	it('le nominal : un pas agir — ICI A1 requise, CE PAS porte le geste et aucun changement, saisie en dernier', () => {
		const dossier = dossierDeReference()
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])

		const contexte = assemblageNarrateur(dossier, cibleNarrateur(s1, '  je   fouille la cendre  '))
		const blocs = blocsNarrateur(contexte.texte)

		const foyer = dossier.monde.lieux.find((lieu) => lieu.id === 'lieu.foyer-du-guet')
		expect(blocs.get('ICI A1')).toEqual([String(foyer?.description), String(foyer?.ambiance)])
		// LE LIBELLÉ DU GESTE est la SEULE source de sa portée pour le modèle (KR-269).
		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, AUCUN_CHANGEMENT])
		// Rien de possédé, rien d'accompli, rien de retenu au pas 1 : pas une ligne, pas de bloc.
		// `PENDANT CE TEMPS` aussi (n° 14, it2) : aucun plan de la référence n'a deux étapes, donc nul
		// personnage n'a avancé à ce pas — le bloc ne s'écrit pas, jamais un en-tête sans ligne.
		for (const absent of [
			'PENDANT CE TEMPS',
			'EN SA POSSESSION',
			'DEJA ACCOMPLI',
			'AUPARAVANT',
			'A CONDENSER',
			'RECEMMENT',
			'ETABLI',
		]) {
			expect(`${absent} → ${blocs.has(absent)}`).toBe(`${absent} → false`)
		}
		// La saisie, NORMALISÉE, en DERNIER.
		expect(contexte.texte.endsWith('saisie\nje fouille la cendre')).toBe(true)
		// Le canon écrit est là, sous ses chemins.
		expect(blocs.get('canon.ton')).toEqual([dossier.canon.ton])
		expect(blocs.get('canon.partage.accroche_joueur')).toEqual([dossier.canon.partage.accroche_joueur])
		// L'ancre du lieu courant, SEULE entrée de la table, et rien n'est dû.
		expect([...contexte.ancres.entries()]).toEqual([['A1', 'lieu.foyer-du-guet']])
		expect(contexte.condensation).toBeNull()
	})

	it('un pas aller qui franchit un jalon : CE PAS porte le geste, puis CHAQUE effet applique avec son amorce', () => {
		const dossier = referenceAvecVigieDecrite()
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [
			'ALLER lieu.tour-effondree',
			'ALLER lieu.vigie-du-nord',
		])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s1)))

		const jalon = dossier.charpente.jalons.find((candidat) => candidat.id === 'jalon.premiere-vigie')
		const indice = dossier.monde.indices.find((candidat) => candidat.id === 'indice.pas-dans-la-cendre')
		// L'ORDRE CAUSAL du journal : le geste, la marque du jalon, puis son effet.
		expect(blocs.get('CE PAS')).toEqual([
			COMMANDES.aller.label,
			`accomplit — ${String(jalon?.enonce_texte)}`,
			`remarque — ${String(indice?.formulation_joueur)}`,
		])
		expect(blocs.get('ICI A1')).toEqual([DESCRIPTION_VIGIE])
		expect(blocs.get('DEJA ACCOMPLI')).toEqual([String(jalon?.enonce_texte)])
		// ⚠ LA VÉRITÉ DE L'INDICE N'ENTRE PAS — seule sa formulation (condition d'état n° 12).
		expect([...blocs.values()].flat().join('\n')).not.toContain(String(indice?.verite))
		expect(String(indice?.verite).length).toBeGreaterThan(0)
	})

	it('un jalon atteint a un pas ANTERIEUR figure dans DEJA ACCOMPLI, jamais dans CE PAS', () => {
		const dossier = referenceAvecVigieDecrite()
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [
			'ALLER lieu.tour-effondree',
			'ALLER lieu.vigie-du-nord',
			'AGIR',
		])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s1)))

		const enonce = String(dossier.charpente.jalons.find((jalon) => jalon.id === 'jalon.premiere-vigie')?.enonce_texte)
		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, AUCUN_CHANGEMENT])
		expect(blocs.get('DEJA ACCOMPLI')).toEqual([enonce])
	})

	it('un effet sans_effet n est JAMAIS raconte, et aucun changement ne s ecrit que s il n y a RIEN d applique', () => {
		// L'état séparateur de KR-247 : un delta DEMANDÉ SANS EFFET. Composé depuis une
		// session JOUÉE — on ajoute au pas courant une entrée qui porte un effet sans effet.
		const dossier = dossierDeReference()
		const joue = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const indice = dossier.monde.indices.find((candidat) => (candidat.formulation_joueur ?? '').trim() !== '')
		if (indice === undefined) throw new Error('fixture : aucun indice à formulation rédigée')
		const avecSansEffet: EtatSession = {
			...joue,
			journal: [
				...joue.journal,
				{
					tour: 1,
					role: 'moteur',
					texte: 'jalons_atteints : jalon.x',
					deltas: [{ delta: 'reveler_indice', cibles: [indice.id], effet: 'sans_effet' }],
				},
			],
		}

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(avecSansEffet)))

		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, AUCUN_CHANGEMENT])
		expect([...blocs.values()].flat().join('\n')).not.toContain(String(indice.formulation_joueur))
	})

	it('un effet applique mais NON REDIGE se tait — et aucun changement n est alors PAS ecrit, ni une ancre posee', () => {
		// « aucun changement » serait une AFFIRMATION FAUSSE : quelque chose a changé, que
		// le dossier ne sait pas dire. Le silence, jamais un repli sur `nom`.
		const dossier = dossierDeReference()
		const muet = dossier.monde.objets.find((objet) => (objet.description_joueur ?? '').trim() === '')
		if (muet === undefined) throw new Error('fixture : plus aucun objet sans description_joueur')
		const joue = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const avecObjetMuet: EtatSession = {
			...joue,
			monde: { ...joue.monde, objets_possedes: [muet.id] },
			journal: [
				...joue.journal,
				{
					tour: 1,
					role: 'moteur',
					texte: 'jalons_atteints : jalon.x',
					deltas: [{ delta: 'donner_objet', cibles: [muet.id], effet: 'applique' }],
				},
			],
		}

		const contexte = assemblageNarrateur(dossier, cibleNarrateur(avecObjetMuet))
		const blocs = blocsNarrateur(contexte.texte)

		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label])
		expect(blocs.has('EN SA POSSESSION')).toBe(false)
		if (muet.nom !== undefined) expect([...blocs.values()].flat().join('\n')).not.toContain(muet.nom)
		// On n'ancre pas ce qu'on ne montre pas : l'objet muet n'a AUCUN rang.
		expect([...contexte.ancres.values()]).toEqual(['lieu.foyer-du-guet'])
	})

	it('un objet retire se dit PERDU, un objet donne se dit OBTENU — la meme prose, deux amorces, et la meme ancre', () => {
		const dossier = dossierDeReference()
		const objet = dossier.monde.objets.find((candidat) => (candidat.description_joueur ?? '').trim() !== '')
		if (objet === undefined) throw new Error('fixture : aucun objet à description rédigée')
		const joue = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const avec = (delta: DeltaJournalise['delta']): EtatSession => ({
			...joue,
			journal: [
				...joue.journal,
				{ tour: 1, role: 'moteur', texte: 'x', deltas: [{ delta, cibles: [objet.id], effet: 'applique' }] },
			],
		})

		const donne = assemblageNarrateur(dossier, cibleNarrateur(avec('donner_objet')))
		const retire = assemblageNarrateur(dossier, cibleNarrateur(avec('retirer_objet')))

		expect(blocsNarrateur(donne.texte).get('CE PAS')).toEqual([
			COMMANDES.agir.label,
			`obtient A2 — ${String(objet.description_joueur)}`,
		])
		expect(blocsNarrateur(retire.texte).get('CE PAS')).toEqual([
			COMMANDES.agir.label,
			`n'a plus A2 — ${String(objet.description_joueur)}`,
		])
		// Sans l'amorce, les deux seraient INDISTINGUABLES — et un objet perdu se
		// raconterait comme un objet trouvé. Un objet PERDU reste désignable : la présence
		// d'un objet peut disparaître puis revenir (KR-272).
		expect(donne.ancres.get('A2')).toBe(objet.id)
		expect(retire.ancres.get('A2')).toBe(objet.id)
	})
})

describe('assemblerNarrateur — les ancres (it3) : le lieu courant et les objets, jamais un indice ni un jalon', () => {
	it('UN rang par identifiant : l objet obtenu a ce pas garde le MEME rang dans CE PAS et EN SA POSSESSION', () => {
		const { dossier, cible } = pireCasNarrateur()
		const contexte = assemblageNarrateur(dossier, cible)
		const blocs = blocsNarrateur(contexte.texte)

		const rediges = dossier.monde.objets.filter((objet) => (objet.description_joueur ?? '').trim() !== '')
		expect(rediges.length).toBeGreaterThan(1)
		// La table : le lieu courant en A1, puis chaque objet RÉDIGÉ, une fois.
		expect([...contexte.ancres.values()]).toEqual([cible.session.monde.lieu_courant, ...rediges.map((o) => o.id)])
		expect(new Set(contexte.ancres.values()).size).toBe(contexte.ancres.size)
		// Et le rang écrit dans les deux blocs est le MÊME, sorti de la même table.
		for (const [rang, id] of contexte.ancres) {
			if (id === cible.session.monde.lieu_courant) continue
			const prose = String(dossier.monde.objets.find((objet) => objet.id === id)?.description_joueur)
			expect(blocs.get('CE PAS')).toContain(`obtient ${rang} — ${prose}`)
			expect(blocs.get('EN SA POSSESSION')).toContain(`${rang} — ${prose}`)
		}
	})

	it('AC#8 / KR-272 — un indice revele et un jalon atteint AU PAS COURANT ne recoivent AUCUN rang', () => {
		// MUTANT OBLIGATOIRE (plan § 7) : une ancre posée sur `indice.*` ou `jalon.*` à
		// l'assemblage — `ancrable: true` sur leurs lectures. Vérifié ROUGE, puis rétabli.
		const dossier = referenceAvecVigieDecrite()
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [
			'ALLER lieu.tour-effondree',
			'ALLER lieu.vigie-du-nord',
		])
		// État séparateur, constaté : un jalon ET un indice sont appliqués à ce pas.
		const appliques = s1.journal
			.filter((entree) => entree.tour === s1.horloge.tour)
			.flatMap((entree) => entree.deltas ?? [])
			.filter((delta) => delta.effet === 'applique')
			.map((delta) => delta.delta)
		expect(appliques).toEqual(expect.arrayContaining(['atteindre_jalon', 'reveler_indice']))

		const contexte = assemblageNarrateur(dossier, cibleNarrateur(s1))

		expect([...contexte.ancres.entries()]).toEqual([['A1', 'lieu.vigie-du-nord']])
		// Balayé sur le PIRE CAS aussi, qui applique TOUS les indices et TOUS les jalons.
		const pireCas = pireCasNarrateur()
		const pire = assemblageNarrateur(pireCas.dossier, pireCas.cible)
		expect([...pire.ancres.values()].filter((id) => !/^(lieu|objet)\./.test(id))).toEqual([])
		expect([...pire.ancres.values()].some((id) => id.startsWith('objet.'))).toBe(true)
		// Et aucune ligne d'indice ni de jalon ne porte de rang dans le texte.
		const lignesCePas = blocsNarrateur(pire.texte).get('CE PAS') ?? []
		expect(lignesCePas.filter((ligne) => /^(remarque|accomplit) A\d+/.test(ligne))).toEqual([])
		expect(lignesCePas.filter((ligne) => /^(remarque|accomplit) — /.test(ligne)).length).toBeGreaterThan(1)
	})
})

// ══ PENDANT CE TEMPS (n° 14 `moteur-horloge`, it2, lot `contrat`) ═══════════════════════════
//
// LE BLOC QUE LE TICK ALIMENTE (`etape_plan.depuis`, lot précédent) ET QUE CE LOT LIT. Les
// sessions sont PRODUITES PAR LE MOTEUR (`ouvrirSession` + `executerCommande`, donc le tick
// réel) chaque fois que l'état visé est atteignable : c'est la couture des deux lots, et ce
// qui la prouve. Seuls les états que le produit ne peut PAS écrire — un `depuis` absent
// (session de 0.7.21), un rang hors plan, un ordre d'insertion inversé — sont forgés, et
// chacun le dit. Le dossier de référence n'a AUCUN plan à deux étapes (mesuré) : les plans
// sont posés sur Harek (au Foyer du Guet, où le héros part), Aubry, Corvin et Sélène, rien
// d'autre ne bouge. Les proses d'essai sont sans chiffre ni identifiant : c'est ce qui rend
// le balayage numérique de `depuis et rang absents` discriminant.

const HAREK = 'pnj.harek-le-forgeron'
const AUBRY = 'pnj.aubry-l-intendant'
const CORVIN = 'pnj.corvin-le-marchand'
const SELENE = 'pnj.selene-la-vigie'
const FOYER_DU_GUET = 'lieu.foyer-du-guet'
const MARCHE_DES_CENDRES = 'lieu.marche-des-cendres'
const TOUR_EFFONDREE = 'lieu.tour-effondree'
const EN_TETE_PENDANT = 'PENDANT CE TEMPS'

/** Le marché n'a AUCUNE description dans la fixture : sans elle, le narrateur refuserait de le
 *  raconter (`cible-a-ecrire`), et Corvin ne pourrait jamais être « présent » dans un test. */
const DESCRIPTION_MARCHE = 'Un marché de planches grises, où les étals se replient dès que le jour baisse.'

const PROSE_DE_DEPART = 'Il tient son poste sans rien changer.'
const PROSE_HAREK = 'Il rallume sa forge et range ses tenailles sur son établi.'
const PROSE_AUBRY = 'Il ouvre son registre et consigne chaque entrée du soir.'
const PROSE_CORVIN = 'Il replie son étal et glisse sa bourse sous son manteau.'
const PROSE_SELENE_UN = 'Elle gagne le haut du beffroi et vérifie la mèche du feu.'
const PROSE_SELENE_DEUX = 'Elle redescend sans bruit et guette la route du nord.'

function lieuVisite(lieu: string): ExprNode {
	return { op: 'predicat', predicat: 'lieu_visite', cibles: [lieu] }
}
/** VRAIE dès l'ouverture (le héros part du foyer) — le tick avance au PREMIER pas joué. */
const FOYER_VISITE = lieuVisite(FOYER_DU_GUET)
const TOUR_VISITEE = lieuVisite(TOUR_EFFONDREE)

/**
 * UNE ÉTAPE FABRIQUÉE. Son champ `etape` vaut `100 − index` : DÉLIBÉRÉMENT hors de l'ordre du
 * tableau, pour qu'une lecture du champ au lieu de l'INDEX (KR-198) ne soit jamais confondue
 * avec la bonne par coïncidence.
 */
function etapeDePlan(
	index: number,
	action: string,
	declencheur?: ExprNode,
	reste: Partial<PlanAction> = {},
): PlanAction {
	return {
		etape: 100 - index,
		action,
		...(declencheur === undefined ? {} : { declencheur_expr: declencheur }),
		...reste,
	}
}

/** Le dossier de référence (ou `dossier`, quand le test en pose un autre), le plan de CERTAINS
 *  personnages remplacé (et leur présence, quand `presences` en nomme une) — rien d'autre ne bouge. */
function referenceAvecPlans(
	plans: Readonly<Record<string, PlanAction[]>>,
	presences: Readonly<Record<string, string>> = {},
	dossier: Dossier = dossierDeReference(),
): Dossier {
	return {
		...dossier,
		monde: {
			...dossier.monde,
			personnages: dossier.monde.personnages.map((personnage) => {
				const plan = plans[personnage.id]
				const lieu = presences[personnage.id]
				return {
					...personnage,
					...(plan === undefined ? {} : { plan_actions: plan }),
					...(lieu === undefined ? {} : { presence: [{ lieu_id: lieu }] }),
				}
			}),
		},
	}
}

function avecLieuDecrit(dossier: Dossier, id: string, description: string): Dossier {
	return {
		...dossier,
		monde: {
			...dossier.monde,
			lieux: dossier.monde.lieux.map((lieu) => (lieu.id === id ? { ...lieu, description } : lieu)),
		},
	}
}

/** Un plan à deux étapes : l'étape de départ, puis `prose` dont la condition est VRAIE dès l'ouverture. */
const planDeDeux = (prose: string): PlanAction[] => [
	etapeDePlan(0, PROSE_DE_DEPART),
	etapeDePlan(1, prose, FOYER_VISITE),
]

/** La session d'une partie, `pnj[id]` posé tel quel — pour les états que le produit n'écrit pas. */
function avecEntreePnj(session: EtatSession, id: string, entree: EtatSession['monde']['pnj'][string]): EtatSession {
	return { ...session, monde: { ...session.monde, pnj: { ...session.monde.pnj, [id]: entree } } }
}

/** Les lignes du bloc, lues dans le TEXTE assemblé — `undefined` quand le bloc n'est pas écrit. */
function bloc(dossier: Dossier, session: EtatSession): string[] | undefined {
	return blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(session))).get(EN_TETE_PENDANT)
}

/**
 * Le CODE d'un fichier, commentaires retirés — en UN passage de gauche à droite : un commentaire
 * de ligne qui CONTIENT `/**` (« `features/**` », que `narrateur.ts` écrit) ouvrirait un faux bloc
 * sous deux `replace` successifs et mangerait le code qui le suit. Les chaînes sont consommées
 * entières, donc un `//` dans une URL ou un `/*` dans un littéral ne compte pas non plus.
 */
const sansCommentaires = (source: string): string =>
	source.replace(
		/\/\*[\s\S]*?\*\/|\/\/[^\n]*|('(?:\\.|[^'\\\n])*'|"(?:\\.|[^"\\\n])*"|`(?:\\.|[^`\\])*`)/g,
		(_trouve, chaine: string | undefined) => chaine ?? '',
	)

describe('assemblerNarrateur — PENDANT CE TEMPS (n 14 moteur-horloge, it2) : ce que les presents ont fait pendant ce pas', () => {
	it('PENDANT CE TEMPS : PNJ avance + present + action — la prose de action, une ligne, entre CE PAS et EN SA POSSESSION', () => {
		const dossier = referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) })
		const joue = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		// Un objet rédigé est possédé : EN SA POSSESSION existe, et l'ordre des blocs se lit.
		const session: EtatSession = { ...joue, monde: { ...joue.monde, objets_possedes: ['objet.sceau-de-cendre'] } }
		// DISCRIMINANTS : le tick a bien écrit `depuis`, et Harek est bien là — le bloc n'est pas
		// vert par vacuité de la sélection.
		expect(joue.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
		expect(personnagesPresents(dossier, joue)).toContain(HAREK)

		const contexte = assemblageNarrateur(dossier, cibleNarrateur(session))
		const blocs = blocsNarrateur(contexte.texte)

		expect(blocs.get(EN_TETE_PENDANT)).toEqual([PROSE_HAREK])
		const ordre = [...blocs.keys()]
		expect(ordre.indexOf(EN_TETE_PENDANT)).toBe(ordre.indexOf('CE PAS') + 1)
		expect(ordre.indexOf('EN SA POSSESSION')).toBe(ordre.indexOf(EN_TETE_PENDANT) + 1)
		// `CE PAS` est INCHANGÉ : la ligne du tick (`role: moteur`, sans `origine`) n'est ni un
		// second geste ni un effet — et l'étape de DÉPART n'est pas celle qu'on raconte.
		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, AUCUN_CHANGEMENT])
		expect(contexte.texte).not.toContain(PROSE_DE_DEPART)
		// AUCUN repère : le personnage n'est pas désignable, la table d'ancres ne bouge pas.
		expect([...contexte.ancres.entries()]).toEqual([
			['A1', FOYER_DU_GUET],
			['A2', 'objet.sceau-de-cendre'],
		])
	})

	it('lignesPendantCeTemps est pure et totale : mêmes entrées, mêmes lignes, aucune écriture', () => {
		const dossier = referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) })
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const avantSession = JSON.stringify(session)
		const avantDossier = JSON.stringify(dossier)

		expect(lignesPendantCeTemps(dossier, session)).toEqual([PROSE_HAREK])
		expect(lignesPendantCeTemps(dossier, session)).toEqual(lignesPendantCeTemps(dossier, session))
		expect(JSON.stringify(session)).toBe(avantSession)
		expect(JSON.stringify(dossier)).toBe(avantDossier)
		// Et la session d'ouverture, où personne n'a avancé : aucune ligne, jamais une levée.
		expect(lignesPendantCeTemps(dossier, ouvertureNarrateur(dossier))).toEqual([])
	})

	it('PENDANT CE TEMPS : PNJ absent du lieu → silence — la presence se juge sur le lieu OU LE PAS LAISSE le heros', () => {
		const sansMarche = referenceAvecPlans({
			[HAREK]: planDeDeux(PROSE_HAREK),
			[CORVIN]: planDeDeux(PROSE_CORVIN),
		})
		const dossier = avecLieuDecrit(sansMarche, MARCHE_DES_CENDRES, DESCRIPTION_MARCHE)
		const depart = ouvertureNarrateur(dossier)

		// UN pas au foyer : les DEUX avancent (le tick l'écrit), seul Harek se tient ici — dans
		// le MÊME test, pour qu'un blocage global ne passe pas pour un filtre (KR-197/202).
		const auFoyer = jouerNarrateur(dossier, depart, ['AGIR'])
		expect(auFoyer.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(1)
		expect(auFoyer.monde.pnj[CORVIN]?.etape_plan?.depuis).toBe(1)
		const texteFoyer = texteNarrateur(dossier, cibleNarrateur(auFoyer))
		expect(blocsNarrateur(texteFoyer).get(EN_TETE_PENDANT)).toEqual([PROSE_HAREK])
		expect(texteFoyer).not.toContain(PROSE_CORVIN)

		// Le MÊME plan, le héros file au marché : le tick tourne APRÈS le déplacement, c'est le lieu
		// d'arrivée qui compte — Corvin est ici, Harek reste au foyer.
		const auMarche = jouerNarrateur(dossier, depart, [`ALLER ${MARCHE_DES_CENDRES}`])
		expect(auMarche.monde.pnj[HAREK]?.etape_plan?.depuis).toBe(1)
		const texteMarche = texteNarrateur(dossier, cibleNarrateur(auMarche))
		expect(blocsNarrateur(texteMarche).get(EN_TETE_PENDANT)).toEqual([PROSE_CORVIN])
		expect(texteMarche).not.toContain(PROSE_HAREK)

		// Corvin SEUL avance, le héros est au foyer : pas une ligne, pas même l'en-tête.
		const corvinSeul = referenceAvecPlans({ [CORVIN]: planDeDeux(PROSE_CORVIN) })
		const sansPresent = jouerNarrateur(corvinSeul, ouvertureNarrateur(corvinSeul), ['AGIR'])
		expect(sansPresent.monde.pnj[CORVIN]?.etape_plan?.depuis).toBe(1)
		const texteAbsent = texteNarrateur(corvinSeul, cibleNarrateur(sansPresent))
		expect(texteAbsent).not.toContain(EN_TETE_PENDANT)
		expect(texteAbsent).not.toContain(PROSE_CORVIN)
	})

	it('PENDANT CE TEMPS : action non redigee → silence, jamais un repli sur le nom ni un bloc vide', () => {
		const sansAction = (): PlanAction => {
			const etape: Partial<PlanAction> = etapeDePlan(1, 'x', FOYER_VISITE)
			delete etape.action
			return etape as PlanAction
		}
		const variantes: ReadonlyArray<readonly [string, PlanAction]> = [
			['vide', etapeDePlan(1, '', FOYER_VISITE)],
			['blancs', etapeDePlan(1, '  \n\t ', FOYER_VISITE)],
			['marqueur seul', etapeDePlan(1, MARQUEUR_A_ECRIRE, FOYER_VISITE)],
			['marqueur dans la prose', etapeDePlan(1, `${PROSE_HAREK} ${MARQUEUR_A_ECRIRE}`, FOYER_VISITE)],
			['cle absente', sansAction()],
		]

		for (const [nom, etape] of variantes) {
			const dossier = referenceAvecPlans({ [HAREK]: [etapeDePlan(0, PROSE_DE_DEPART), etape] })
			const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
			// Le silence est celui de l'ÉTAPE, pas de la sélection : Harek avance, et il est ici.
			expect(`${nom} → ${session.monde.pnj[HAREK]?.etape_plan?.depuis}`).toBe(`${nom} → 1`)
			expect(personnagesPresents(dossier, session)).toContain(HAREK)

			const texte = texteNarrateur(dossier, cibleNarrateur(session))
			expect(`${nom} → ${texte.includes(EN_TETE_PENDANT)}`).toBe(`${nom} → false`)
			expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
			// Jamais un repli sur `nom` (KR-262) ni sur l'étape de départ.
			expect(texte).not.toContain(String(dossier.monde.personnages.find((p) => p.id === HAREK)?.nom))
			expect(texte).not.toContain(PROSE_DE_DEPART)
		}
		// DISCRIMINANT : la MÊME composition, l'action rédigée, donne le bloc.
		const redigee = referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) })
		expect(bloc(redigee, jouerNarrateur(redigee, ouvertureNarrateur(redigee), ['AGIR']))).toEqual([PROSE_HAREK])
	})

	it('chemin action : audience ia, garde dediee — hors des huit, hors des onze, et seul l action entre', () => {
		expect(CHEMIN_ACTION_DE_PLAN).toBe('monde.personnages[].plan_actions[].action')
		// SON AUDIENCE : `ia`, par la table — la dérogation est à la DOCTRINE du rôle, pas à la table.
		expect(DESTINATION_DES_CHAMPS[CHEMIN_ACTION_DE_PLAN]).toBe('ia')
		expect(DEROGATIONS_AUDIENCE).toEqual([])
		// SA GARDE DÉDIÉE : un chemin À PART. Il n'est pas un neuvième des huit…
		expect(CHAMPS_INJECTES_NARRATEUR).toHaveLength(8)
		expect((CHAMPS_INJECTES_NARRATEUR as readonly string[]).includes(CHEMIN_ACTION_DE_PLAN)).toBe(false)
		// … ni un douzième des onze, dont le prédicat (dérivé de la table, KR-159) exclut les personnages.
		const onze = Object.entries(DESTINATION_DES_CHAMPS)
			.filter(([, destination]) => destination === 'ia')
			.map(([chemin]) => chemin)
			.filter((chemin) => chemin.startsWith('monde.') || chemin.startsWith('charpente.'))
			.filter((chemin) => !chemin.startsWith('monde.personnages[].'))
		expect(onze).toHaveLength(11)
		expect(onze.includes(CHEMIN_ACTION_DE_PLAN)).toBe(false)

		// LA SOURCE : `narrateur.ts` n'écrit AUCUN chemin de personnage en code — il appelle le
		// module dédié, et lui seul porte la constante, une fois. Ni le baril, ni `brain/index.ts`
		// ne l'exportent.
		const source = (...segments: string[]): string => fs.readFileSync(path.join(__dirname, ...segments), 'utf8')
		const codeNarrateur = sansCommentaires(source('contexte', 'narrateur.ts'))
		expect(codeNarrateur).not.toContain('monde.personnages[]')
		expect(codeNarrateur).toContain("from './horloge'")
		const codeHorloge = sansCommentaires(source('contexte', 'horloge.ts'))
		expect(codeHorloge.match(/'monde\.personnages\[\]\.plan_actions\[\]\.action'/g)).toHaveLength(1)
		for (const porte of [source('contexte', 'index.ts'), source('..', 'index.ts')]) {
			const code = sansCommentaires(porte)
			expect(code).not.toContain('lignesPendantCeTemps')
			expect(code).not.toContain('CHEMIN_ACTION_DE_PLAN')
			expect(code).not.toContain('contexte/horloge')
		}
		// Et la DÉROGATION est écrite dans le code qu'elle déroge : le lecteur de `narrateur.ts` la trouve.
		const doc = source('contexte', 'narrateur.ts')
		expect(doc).toMatch(/LA DÉROGATION[\s\S]*CHEMIN_ACTION_DE_PLAN/)

		// SEULE LA PROSE entre : tout autre champ du plan, et le personnage, portent une SENTINELLE
		// qui ne doit jamais paraître — `si_bloque` est `ia` lui aussi : c'est le SECOND chemin de la
		// dérogation (it3), mais il ne se lit qu'au pas d'un BLOCAGE. Harek AVANCE ici, il ne bloque pas
		// (`duree: 7331`, jamais échue), donc sa sentinelle `si_bloque` reste silencieuse.
		const dossier = referenceAvecPlans({
			[HAREK]: [
				etapeDePlan(0, PROSE_DE_DEPART),
				etapeDePlan(1, PROSE_HAREK, FOYER_VISITE, {
					etape: 4242,
					duree: 7331,
					declencheur_texte: 'SENTINELLE DECLENCHEUR',
					si_bloque: 'SENTINELLE SI BLOQUE',
				}),
			],
		})
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const texte = texteNarrateur(dossier, cibleNarrateur(session))
		expect(blocsNarrateur(texte).get(EN_TETE_PENDANT)).toEqual([PROSE_HAREK])
		for (const sentinelle of ['SENTINELLE', '4242', '7331']) {
			expect(`${sentinelle} → ${texte.includes(sentinelle)}`).toBe(`${sentinelle} → false`)
		}
		// Les champs voisins ne sont pas `ia` — sauf `si_bloque`, SECOND chemin de la dérogation (gardé
		// à part, plus bas : `chemin si_bloque`) : un champ `ia` de plus au plan ferait rougir ceci, et
		// exigerait qu'on décide s'il entre ici.
		const iaDuPlan = Object.entries(DESTINATION_DES_CHAMPS)
			.filter(
				([chemin, destination]) => chemin.startsWith('monde.personnages[].plan_actions[].') && destination === 'ia',
			)
			.map(([chemin]) => chemin)
			.sort()
		expect(iaDuPlan).toEqual([CHEMIN_ACTION_DE_PLAN, 'monde.personnages[].plan_actions[].si_bloque'])
	})

	it('depuis et rang absents du texte de contexte — ni nombre, ni identifiant, ni mot du plan, ni nom', () => {
		// UN PERSONNAGE À TROIS ÉTAPES, avancé en deux temps par le produit : rang 2, depuis 3, tour 3 —
		// trois nombres DISTINCTS que le texte ne doit jamais porter, et deux proses d'étape qui se
		// distinguent (c'est l'INDEX qui désigne, KR-198).
		const dossier = referenceAvecPlans({
			[SELENE]: [
				etapeDePlan(0, PROSE_DE_DEPART),
				etapeDePlan(1, PROSE_SELENE_UN, FOYER_VISITE),
				etapeDePlan(2, PROSE_SELENE_DEUX, TOUR_VISITEE),
			],
		})
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR', 'AGIR', `ALLER ${TOUR_EFFONDREE}`])
		expect(session.monde.pnj[SELENE]?.etape_plan).toEqual({ rang: 2, depuis: 3 })
		expect(session.horloge.tour).toBe(3)
		expect(personnagesPresents(dossier, session)).toContain(SELENE)

		const lignes = bloc(dossier, session)
		expect(lignes).toEqual([PROSE_SELENE_DEUX])
		// La prose d'essai n'a pas de chiffre : tout chiffre de la ligne viendrait donc du code.
		expect(PROSE_SELENE_DEUX).not.toMatch(/\d/)
		expect(String(lignes?.join('\n'))).not.toMatch(/\d/)
		const texte = texteNarrateur(dossier, cibleNarrateur(session))
		expect(texte).not.toContain(PROSE_SELENE_UN)
		expect(texte).not.toContain(PROSE_DE_DEPART)
		for (const interdit of [SELENE, 'etape_plan', 'depuis', 'rang', 'declencheur']) {
			expect(`${interdit} → ${texte.includes(interdit)}`).toBe(`${interdit} → false`)
		}
		expect(texte).not.toContain(String(dossier.monde.personnages.find((p) => p.id === SELENE)?.nom))
	})

	it('PENDANT CE TEMPS : plusieurs presents — l ordre est celui de monde.personnages[], ni l id ni l insertion de monde.pnj', () => {
		const dossier = referenceAvecPlans(
			{ [HAREK]: planDeDeux(PROSE_HAREK), [AUBRY]: planDeDeux(PROSE_AUBRY) },
			{ [AUBRY]: FOYER_DU_GUET },
		)
		const joue = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const ids = dossier.monde.personnages.map((personnage) => personnage.id)
		// L'ordre du DOCUMENT et l'ordre ALPHABÉTIQUE sont opposés : c'est ce qui les sépare.
		expect(ids.indexOf(HAREK)).toBeLessThan(ids.indexOf(AUBRY))
		expect([AUBRY, HAREK].sort()).toEqual([AUBRY, HAREK])
		// … et l'insertion dans `monde.pnj`, FORGÉE à l'envers (le tick écrit dans l'ordre du document).
		const inverse = avecEntreePnj({ ...joue, monde: { ...joue.monde, pnj: {} } }, AUBRY, joue.monde.pnj[AUBRY])
		const inverseComplete = avecEntreePnj(inverse, HAREK, joue.monde.pnj[HAREK])
		expect(Object.keys(inverseComplete.monde.pnj)).toEqual([AUBRY, HAREK])

		expect(bloc(dossier, joue)).toEqual([PROSE_HAREK, PROSE_AUBRY])
		expect(bloc(dossier, inverseComplete)).toEqual([PROSE_HAREK, PROSE_AUBRY])
	})

	it('PENDANT CE TEMPS : avance a un AUTRE pas, ou depuis absent (session 0.7.21) → silence, a un pas pres des deux cotes', () => {
		const dossier = referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) })
		const pas1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		expect(bloc(dossier, pas1)).toEqual([PROSE_HAREK])

		// PAS 2, par le produit : Harek est toujours à `rang: 1`, `depuis: 1`, toujours ici — mais
		// il n'a plus avancé À CE pas : le récit du pas 2 ne le raconte pas.
		const pas2 = jouerNarrateur(dossier, pas1, ['AGIR'])
		expect(pas2.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })
		expect(pas2.horloge.tour).toBe(2)
		expect(bloc(dossier, pas2)).toBeUndefined()

		// FORGÉS, au tour 1 : le bon `depuis` raconte, un pas de trop ou de moins se tait, et
		// l'absence de `depuis` n'est PAS « avancé » (ni 0, ni le pas courant).
		const entrees: ReadonlyArray<readonly [string, { rang: number; depuis?: number }, readonly string[] | undefined]> =
			[
				['depuis = tour', { rang: 1, depuis: 1 }, [PROSE_HAREK]],
				['depuis = tour + 1', { rang: 1, depuis: 2 }, undefined],
				['depuis = tour - 1', { rang: 1, depuis: 0 }, undefined],
				['depuis absent', { rang: 1 }, undefined],
			]
		for (const [nom, etape, attendu] of entrees) {
			const forgee = avecEntreePnj(pas1, HAREK, { a_dit: [], etape_plan: etape })
			expect(`${nom} → ${JSON.stringify(bloc(dossier, forgee))}`).toBe(`${nom} → ${JSON.stringify(attendu)}`)
		}
		// L'ouverture (tour 0) : un `depuis` absent n'est pas non plus égal à 0.
		const ouverture = ouvertureNarrateur(dossier)
		expect(ouverture.horloge.tour).toBe(0)
		expect(bloc(dossier, avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang: 1 } }))).toBeUndefined()
		expect(bloc(dossier, avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang: 1, depuis: 0 } }))).toEqual([
			PROSE_HAREK,
		])
		// Un personnage sans entrée dans `monde.pnj` n'a pas avancé.
		expect(bloc(dossier, { ...pas1, monde: { ...pas1.monde, pnj: {} } })).toBeUndefined()
	})

	it('PENDANT CE TEMPS : un rang hors du plan ne leve jamais et ne dit rien — negatif, fractionnaire, au bout du plan, au-dela', () => {
		const dossier = referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) })
		const pas1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		// L'état n'est pas écrivable par le produit : le tick ne produit que des rangs de l'intervalle du plan.
		const rangs: ReadonlyArray<readonly [string, number]> = [
			['negatif', -1],
			['fractionnaire', 1.5],
			['au bout du plan (longueur)', 2],
			['au-dela', 99],
			['NaN', Number.NaN],
			['infini', Number.POSITIVE_INFINITY],
			// Des clés héritées d'un tableau : jamais une prose, et jamais une levée (KR-116/175).
			['constructor', 'constructor' as unknown as number],
			['__proto__', '__proto__' as unknown as number],
			['length', 'length' as unknown as number],
		]
		for (const [nom, rang] of rangs) {
			const forgee = avecEntreePnj(pas1, HAREK, { a_dit: [], etape_plan: { rang, depuis: 1 } })
			expect(`${nom} → ${JSON.stringify(bloc(dossier, forgee))}`).toBe(`${nom} → undefined`)
		}
		// DISCRIMINANT : le rang 1, lui, désigne l'étape et la dit.
		expect(bloc(dossier, avecEntreePnj(pas1, HAREK, { a_dit: [], etape_plan: { rang: 1, depuis: 1 } }))).toEqual([
			PROSE_HAREK,
		])
		// L'INDEX, jamais le champ `etape` (= 100 − index) : le rang 0 lit l'index 0.
		expect(bloc(dossier, avecEntreePnj(pas1, HAREK, { a_dit: [], etape_plan: { rang: 0, depuis: 1 } }))).toEqual([
			PROSE_DE_DEPART,
		])
	})

	it('PENDANT CE TEMPS : une prose multiligne est REPLIEE — elle ne peut imiter ni un en-tete de bloc ni la saisie', () => {
		const multiligne = `Il écoute.\n\nCE PAS\nvous obtenez la clef   de la crypte.\n\n\tsaisie\nje pars.\n`
		const dossier = referenceAvecPlans({ [HAREK]: planDeDeux(multiligne) })
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])

		const texte = texteNarrateur(dossier, cibleNarrateur(session, 'je regarde autour de moi'))

		expect(blocsNarrateur(texte).get(EN_TETE_PENDANT)).toEqual([
			'Il écoute. CE PAS vous obtenez la clef de la crypte. saisie je pars.',
		])
		// Aucun bloc contrefait : UN `CE PAS`, UNE `saisie`, et la saisie est bien la DERNIÈRE.
		const blocs = texte.split('\n\n')
		expect(blocs.filter((b) => b.startsWith('CE PAS'))).toHaveLength(1)
		expect(blocs.filter((b) => b.startsWith('saisie'))).toHaveLength(1)
		expect(texte.endsWith('saisie\nje regarde autour de moi')).toBe(true)
	})
})

// ══ PENDANT CE TEMPS, `si_bloque` (n° 14 `moteur-horloge`, it3, lot `contrat`) ═══════════════
//
// LA SECONDE PROSE DU BLOC : celle d'une étape que le prédicat de blocage (`dossier/blocage.ts`)
// constate au pas COURANT. Même doctrine que l'it2 : les sessions sont PRODUITES PAR LE MOTEUR
// (`ouvrirSession` + `executerCommande`, donc le tick réel, qui écrit `etape_bloquee` au journal) —
// la couture des deux lots —, et seuls les états que le produit n'écrit pas (un `depuis` absent
// sur un rang ≥ 1, un rang hors plan) sont forgés, chacun le disant. Les proses d'essai sont sans
// chiffre, sans identifiant, et sans aucun des mots que le texte ne doit jamais porter (`rang`,
// `depuis`, `declencheur`, `etape_plan`).

const PROSE_HAREK_BLOQUE = 'Il remise ses tenailles et se met à forger des clous, faute de commande à honorer.'
const PROSE_AUBRY_BLOQUE = 'Il referme son registre et attend qu un visiteur se présente à son comptoir.'
const PROSE_CORVIN_BLOQUE = 'Il double son prix et guette si le héros cède avant la fermeture.'

/** Un plan à UNE étape bloquable : la durée et la didascalie de sortie sont sur l'étape de départ. */
const planBloquable = (duree: number, siBloque: string): PlanAction[] => [
	etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree, si_bloque: siBloque }),
]

/** Les lignes d'un journal qui commencent par `prefixe`, chacune précédée de son pas. */
const lignesDuJournal = (session: EtatSession, prefixe: string): string[] =>
	session.journal.filter((ligne) => ligne.texte.startsWith(prefixe)).map((ligne) => `${ligne.tour} ${ligne.texte}`)

/** Une partie de `n` pas `agir` : les sessions d'APRÈS chacun des pas 1 à `n`, jouées par le produit. */
function pasJoues(dossier: Dossier, n: number): EtatSession[] {
	const sessions: EtatSession[] = []
	let session = ouvertureNarrateur(dossier)
	for (let pas = 1; pas <= n; pas += 1) {
		session = jouerNarrateur(dossier, session, ['AGIR'])
		sessions.push(session)
	}
	return sessions
}

describe('assemblerNarrateur — PENDANT CE TEMPS, si_bloque (n 14 moteur-horloge, it3) : ce que les presents ont fait QUAND IL SONT COINCES', () => {
	it('pnj-bloque-present-si-bloque : la prose de si_bloque, une ligne, au pas d echeance SEULEMENT — un pas avant et un pas apres, rien', () => {
		const dossier = referenceAvecPlans({ [HAREK]: planBloquable(2, PROSE_HAREK_BLOQUE) })
		const [pas1, pas2, pas3] = pasJoues(dossier, 3)
		// DISCRIMINANTS : le tick a constaté le blocage au pas 2 ET A LUI SEUL (le journal est la moitié
		// auteur du même fait), Harek est ici aux trois pas, et le constat n'écrit RIEN dans `monde.pnj`
		// — le bloc n'est donc pas vert par vacuité de la sélection, ni par un état stocké (KR-013).
		expect(lignesDuJournal(pas3, `etape_bloquee : ${HAREK}`)).toEqual([`2 etape_bloquee : ${HAREK} 1`])
		expect(pas2.monde.pnj[HAREK]).toBeUndefined()
		for (const session of [pas1, pas2, pas3]) expect(personnagesPresents(dossier, session)).toContain(HAREK)

		// PAS 2 — la prose, entre `CE PAS` et la suite, sans rang ni repère.
		const contexte = assemblageNarrateur(dossier, cibleNarrateur(pas2))
		const blocs = blocsNarrateur(contexte.texte)
		expect(blocs.get(EN_TETE_PENDANT)).toEqual([PROSE_HAREK_BLOQUE])
		const ordre = [...blocs.keys()]
		expect(ordre.indexOf(EN_TETE_PENDANT)).toBe(ordre.indexOf('CE PAS') + 1)
		// `CE PAS` est INCHANGÉ : la ligne du tick (`role: moteur`, sans `origine`) n'est ni un geste ni
		// un effet — et le constat n'est JAMAIS raconté comme tel (ni mot de mécanique, ni la durée).
		expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, AUCUN_CHANGEMENT])
		expect(contexte.texte).not.toContain('etape_bloquee')
		expect(contexte.texte).not.toContain(PROSE_DE_DEPART)
		expect([...contexte.ancres.entries()]).toEqual([['A1', FOYER_DU_GUET]])

		// UN PAS AVANT (duree − 1) ET UN PAS APRÈS (duree + 1) : silence. C'est le front `===` — le
		// blocage est un ÉVÉNEMENT du pas, pas un niveau que R3 raconterait à chaque commande.
		expect(bloc(dossier, pas1)).toBeUndefined()
		expect(bloc(dossier, pas3)).toBeUndefined()
		expect(texteNarrateur(dossier, cibleNarrateur(pas3))).not.toContain(PROSE_HAREK_BLOQUE)

		// PURE ET TOTALE : mêmes entrées, mêmes lignes, aucune écriture.
		const avantSession = JSON.stringify(pas2)
		const avantDossier = JSON.stringify(dossier)
		expect(lignesPendantCeTemps(dossier, pas2)).toEqual([PROSE_HAREK_BLOQUE])
		expect(lignesPendantCeTemps(dossier, pas2)).toEqual(lignesPendantCeTemps(dossier, pas2))
		expect(JSON.stringify(pas2)).toBe(avantSession)
		expect(JSON.stringify(dossier)).toBe(avantDossier)
	})

	it('le dossier de reference tel quel : Selene, a la tour, dit son si_bloque au PAS 4 — la prose de la fixture, lue de la fixture', () => {
		const dossier = dossierDeReference()
		const selene = dossier.monde.personnages.find((personnage) => personnage.id === SELENE)
		const attendue = String(selene?.plan_actions[0].si_bloque)
		// DISCRIMINANTS : la fixture porte bien `duree: 4` et un `si_bloque` rédigé — rien n'est inventé ici.
		expect(selene?.plan_actions[0].duree).toBe(4)
		expect(attendue.trim()).not.toBe('')

		const depart = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [`ALLER ${TOUR_EFFONDREE}`])
		const pas = [depart]
		for (let n = 2; n <= 6; n += 1) pas.push(jouerNarrateur(dossier, pas[pas.length - 1], ['AGIR']))

		// Le héros est à la tour du pas 1 au pas 6, Sélène aussi : seul le PAS 4 la fait parler.
		for (const session of pas) expect(personnagesPresents(dossier, session)).toContain(SELENE)
		expect(
			pas.filter((session) => bloc(dossier, session) !== undefined).map((session) => session.horloge.tour),
		).toEqual([4])
		expect(bloc(dossier, pas[3])).toEqual([attendue])
		// Deux constats dans tout le journal, chacun UNE fois : Corvin au pas 2 (`duree: 2`, au marché, sans
		// le héros), Sélène au pas 4 — aucun pas suivant, aucun pas précédent.
		expect(lignesDuJournal(pas[5], 'etape_bloquee :')).toEqual([
			`2 etape_bloquee : ${CORVIN} 1`,
			`4 etape_bloquee : ${SELENE} 1`,
		])
		// Sélène n'a JAMAIS avancé : sans origine écrite, son décompte part de l'ouverture (origine 0).
		expect(pas[3].monde.pnj[SELENE]).toBeUndefined()
	})

	it('pnj-bloque-absent-silence : bloque mais ailleurs, rien en R3 — le journal, lui, le dit ; au marche, le meme pas le fait parler', () => {
		const dossier = avecLieuDecrit(
			referenceAvecPlans({ [CORVIN]: planBloquable(2, PROSE_CORVIN_BLOQUE) }),
			MARCHE_DES_CENDRES,
			DESCRIPTION_MARCHE,
		)
		const depart = ouvertureNarrateur(dossier)

		// LE HÉROS RESTE AU FOYER : Corvin est bloqué au pas 2 (le journal l'écrit), mais il est au
		// marché — il ne se raconte pas.
		const auFoyer = jouerNarrateur(dossier, depart, ['AGIR', 'AGIR'])
		expect(lignesDuJournal(auFoyer, `etape_bloquee : ${CORVIN}`)).toEqual([`2 etape_bloquee : ${CORVIN} 1`])
		expect(personnagesPresents(dossier, auFoyer)).not.toContain(CORVIN)
		const texteFoyer = texteNarrateur(dossier, cibleNarrateur(auFoyer))
		expect(texteFoyer).not.toContain(EN_TETE_PENDANT)
		expect(texteFoyer).not.toContain(PROSE_CORVIN_BLOQUE)

		// LE HÉROS VA AU MARCHÉ, MÊME PLAN, MÊME PAS : Corvin est ici, il parle — dans le MÊME test,
		// pour qu'un blocage global ne passe pas pour un filtre de présence (KR-197/202).
		const auMarche = jouerNarrateur(dossier, depart, [`ALLER ${MARCHE_DES_CENDRES}`, 'AGIR'])
		expect(auMarche.horloge.tour).toBe(2)
		expect(lignesDuJournal(auMarche, `etape_bloquee : ${CORVIN}`)).toEqual([`2 etape_bloquee : ${CORVIN} 1`])
		expect(personnagesPresents(dossier, auMarche)).toContain(CORVIN)
		expect(bloc(dossier, auMarche)).toEqual([PROSE_CORVIN_BLOQUE])
	})

	it('si-bloque-sans-etape-plan : un si_bloque POSE ne suffit jamais — aucune ligne sans constat, etape_plan absent, sans duree, ou session 0.7.21', () => {
		// (a) `etape_plan` ABSENT, `duree` posée (origine 0, § J2 cas b) : la ligne n'existe qu'au pas 3.
		const avecDuree = referenceAvecPlans({ [HAREK]: planBloquable(3, PROSE_HAREK_BLOQUE) })
		const pas = pasJoues(avecDuree, 6)
		expect(pas.every((session) => session.monde.pnj[HAREK] === undefined)).toBe(true)
		expect(
			pas.filter((session) => bloc(avecDuree, session) !== undefined).map((session) => session.horloge.tour),
		).toEqual([3])

		// (b) `si_bloque` posé SANS `duree` : jamais, à aucun pas — le moteur ne le constate pas, donc
		// personne ne le raconte (le validateur en avertit l'auteur, `condition-sans-expr`).
		const sansDuree = referenceAvecPlans({
			[HAREK]: [etapeDePlan(0, PROSE_DE_DEPART, undefined, { si_bloque: PROSE_HAREK_BLOQUE })],
		})
		const sansDureeJoues = pasJoues(sansDuree, 8)
		expect(sansDureeJoues.filter((session) => bloc(sansDuree, session) !== undefined)).toEqual([])
		expect(sansDureeJoues.flatMap((session) => lignesDuJournal(session, `etape_bloquee : ${HAREK}`))).toEqual([])

		// (c) UNE SESSION DE 0.7.21 — `{ rang: 1 }` SANS `depuis` (forgée : le produit écrit les deux
		// clés ensemble, depuis l'it2) : AUCUNE origine, donc jamais en échéance, à aucun pas. Le moteur
		// n'invente ni 0 ni le pas courant (KR-251).
		const deuxEtapes = referenceAvecPlans({
			[HAREK]: [
				etapeDePlan(0, PROSE_DE_DEPART),
				etapeDePlan(1, PROSE_HAREK, undefined, { duree: 2, si_bloque: PROSE_HAREK_BLOQUE }),
			],
		})
		const ouverture = ouvertureNarrateur(deuxEtapes)
		const aLaSession0721 = (tour: number): EtatSession => ({
			...avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang: 1 } }),
			horloge: { tour },
		})
		for (let tour = 0; tour <= 8; tour += 1) {
			expect(`pas ${tour} → ${JSON.stringify(lignesPendantCeTemps(deuxEtapes, aLaSession0721(tour)))}`).toBe(
				`pas ${tour} → []`,
			)
		}
		// DISCRIMINANT, DANS LE MÊME TEST : le MÊME rang, `depuis` écrit, parle à `depuis + duree`.
		const aLaSessionDatee = (tour: number): EtatSession => ({
			...avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang: 1, depuis: 3 } }),
			horloge: { tour },
		})
		expect(lignesPendantCeTemps(deuxEtapes, aLaSessionDatee(5))).toEqual([PROSE_HAREK_BLOQUE])
		expect(lignesPendantCeTemps(deuxEtapes, aLaSessionDatee(4))).toEqual([])
		expect(lignesPendantCeTemps(deuxEtapes, aLaSessionDatee(6))).toEqual([])
	})

	it('un rang hors du plan ne leve jamais et ne dit rien, meme a l echeance — negatif, fractionnaire, au-dela, cles heritees', () => {
		const dossier = referenceAvecPlans({
			[HAREK]: [etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree: 1, si_bloque: PROSE_HAREK_BLOQUE })],
		})
		const ouverture = ouvertureNarrateur(dossier)
		const rangs: ReadonlyArray<readonly [string, number]> = [
			['negatif', -1],
			['fractionnaire', 0.5],
			['au bout du plan (longueur)', 1],
			['au-dela', 99],
			['NaN', Number.NaN],
			['infini', Number.POSITIVE_INFINITY],
			['constructor', 'constructor' as unknown as number],
			['__proto__', '__proto__' as unknown as number],
			['length', 'length' as unknown as number],
			['la chaine "0"', '0' as unknown as number],
		]
		// `depuis: 4`, `tour: 5` : à `duree: 1`, c'est l'état « tout juste échu » pour un rang valide.
		for (const [nom, rang] of rangs) {
			const forgee: EtatSession = {
				...avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang, depuis: 4 } }),
				horloge: { tour: 5 },
			}
			expect(`${nom} → ${JSON.stringify(lignesPendantCeTemps(dossier, forgee))}`).toBe(`${nom} → []`)
		}
		// DISCRIMINANT : le rang 0, valide, à la même échéance, parle.
		const valide: EtatSession = {
			...avecEntreePnj(ouverture, HAREK, { a_dit: [], etape_plan: { rang: 0, depuis: 4 } }),
			horloge: { tour: 5 },
		}
		expect(lignesPendantCeTemps(dossier, valide)).toEqual([PROSE_HAREK_BLOQUE])
	})

	it('avancement puis blocage : au pas 1 l action, au pas 2 le si_bloque, au pas 3 rien — JAMAIS les deux au meme pas', () => {
		// Harek avance à l'étape 1 au pas 1 (condition vraie dès l'ouverture) ; cette étape-là porte une
		// `duree: 1` : elle échoit au pas 2 (`depuis` 1 + 1). Les deux sélections se SUIVENT, elles ne se
		// recouvrent jamais — l'avancement du pas 1 n'est pas un blocage (`tour − depuis` vaut 0), et le
		// blocage du pas 2 n'est plus un avancement (`depuis` ≠ `tour`).
		const dossier = referenceAvecPlans({
			[HAREK]: [
				etapeDePlan(0, PROSE_DE_DEPART),
				etapeDePlan(1, PROSE_HAREK, FOYER_VISITE, { duree: 1, si_bloque: PROSE_HAREK_BLOQUE }),
			],
		})
		const [pas1, pas2, pas3] = pasJoues(dossier, 3)
		// Le produit : un avancement au pas 1, un constat au pas 2, aucun des deux au pas 3.
		expect(lignesDuJournal(pas3, `etape_plan : ${HAREK}`)).toEqual([`1 etape_plan : ${HAREK} 2`])
		expect(lignesDuJournal(pas3, `etape_bloquee : ${HAREK}`)).toEqual([`2 etape_bloquee : ${HAREK} 2`])
		expect(pas3.monde.pnj[HAREK]?.etape_plan).toEqual({ rang: 1, depuis: 1 })

		expect(lignesPendantCeTemps(dossier, pas1)).toEqual([PROSE_HAREK])
		expect(lignesPendantCeTemps(dossier, pas2)).toEqual([PROSE_HAREK_BLOQUE])
		expect(lignesPendantCeTemps(dossier, pas3)).toEqual([])
		// Et le texte assemblé le dit : une ligne par pas, jamais l'autre prose à côté.
		const texte1 = texteNarrateur(dossier, cibleNarrateur(pas1))
		expect(texte1).not.toContain(PROSE_HAREK_BLOQUE)
		const texte2 = texteNarrateur(dossier, cibleNarrateur(pas2))
		expect(texte2).not.toContain(PROSE_HAREK)
	})

	it('si_bloque ne remplace JAMAIS une action absente : un avancement dont l action est muette se tait, le blocage du pas suivant parle', () => {
		// Harek avance au pas 1 vers une étape qui porte un `si_bloque` mais pas d'`action` rédigée :
		// R3 ne retombe PAS sur `si_bloque` (le blocage n'existe pas encore à ce pas) — silence. Au pas 2,
		// l'étape est bloquée : c'est alors, et alors seulement, que `si_bloque` parle.
		const variantes: ReadonlyArray<readonly [string, string]> = [
			['vide', ''],
			['blancs', '  \n\t '],
			['marqueur', MARQUEUR_A_ECRIRE],
		]
		for (const [nom, action] of variantes) {
			const dossier = referenceAvecPlans({
				[HAREK]: [
					etapeDePlan(0, PROSE_DE_DEPART),
					etapeDePlan(1, action, FOYER_VISITE, { duree: 1, si_bloque: PROSE_HAREK_BLOQUE }),
				],
			})
			const [pas1, pas2] = pasJoues(dossier, 2)
			expect(`${nom} → ${pas1.monde.pnj[HAREK]?.etape_plan?.depuis}`).toBe(`${nom} → 1`)
			expect(`${nom} pas 1 → ${JSON.stringify(lignesPendantCeTemps(dossier, pas1))}`).toBe(`${nom} pas 1 → []`)
			expect(`${nom} pas 2 → ${JSON.stringify(lignesPendantCeTemps(dossier, pas2))}`).toBe(
				`${nom} pas 2 → ${JSON.stringify([PROSE_HAREK_BLOQUE])}`,
			)
		}
	})

	it('si_bloque non redige → silence : ni repli sur l action, ni sur le nom, ni bloc vide — le journal, lui, ecrit quand meme le constat', () => {
		const variantes: ReadonlyArray<readonly [string, PlanAction]> = [
			['vide', etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree: 2, si_bloque: '' })],
			['blancs', etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree: 2, si_bloque: '  \n\t ' })],
			['marqueur seul', etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree: 2, si_bloque: MARQUEUR_A_ECRIRE })],
			[
				'marqueur dans la prose',
				etapeDePlan(0, PROSE_DE_DEPART, undefined, {
					duree: 2,
					si_bloque: `${PROSE_HAREK_BLOQUE} ${MARQUEUR_A_ECRIRE}`,
				}),
			],
			['cle absente', etapeDePlan(0, PROSE_DE_DEPART, undefined, { duree: 2 })],
		]

		for (const [nom, etape] of variantes) {
			const dossier = referenceAvecPlans({ [HAREK]: [etape] })
			const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR', 'AGIR'])
			// Le silence est celui de la PROSE, pas du constat : Harek est bloqué, et il est ici.
			expect(`${nom} → ${JSON.stringify(lignesDuJournal(session, `etape_bloquee : ${HAREK}`))}`).toBe(
				`${nom} → ${JSON.stringify([`2 etape_bloquee : ${HAREK} 1`])}`,
			)
			expect(personnagesPresents(dossier, session)).toContain(HAREK)

			const texte = texteNarrateur(dossier, cibleNarrateur(session))
			expect(`${nom} → ${texte.includes(EN_TETE_PENDANT)}`).toBe(`${nom} → false`)
			expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
			// Jamais un repli sur `nom` (KR-262), sur l'`action` de l'étape, ni sur la prose bloquée du marqueur.
			expect(texte).not.toContain(String(dossier.monde.personnages.find((p) => p.id === HAREK)?.nom))
			expect(texte).not.toContain(PROSE_DE_DEPART)
			expect(texte).not.toContain(PROSE_HAREK_BLOQUE)
		}
		// DISCRIMINANT : la MÊME composition, `si_bloque` rédigé, donne le bloc.
		const redigee = referenceAvecPlans({ [HAREK]: planBloquable(2, PROSE_HAREK_BLOQUE) })
		expect(bloc(redigee, jouerNarrateur(redigee, ouvertureNarrateur(redigee), ['AGIR', 'AGIR']))).toEqual([
			PROSE_HAREK_BLOQUE,
		])
	})

	it('plusieurs presents, un avance et un bloque : UNE ligne chacun, l ordre est celui de monde.personnages[] — jamais celui des sortes', () => {
		// Au PAS 1 : Harek AVANCE (sa condition est vraie dès l'ouverture), Aubry est BLOQUÉ (`duree: 1`,
		// origine 0). Document : Harek avant Aubry — l'ordre des lignes suit le document, que l'avancé
		// soit le premier ou le second.
		const harekAvance = referenceAvecPlans(
			{ [HAREK]: planDeDeux(PROSE_HAREK), [AUBRY]: planBloquable(1, PROSE_AUBRY_BLOQUE) },
			{ [AUBRY]: FOYER_DU_GUET },
		)
		const harekBloque = referenceAvecPlans(
			{ [HAREK]: planBloquable(1, PROSE_HAREK_BLOQUE), [AUBRY]: planDeDeux(PROSE_AUBRY) },
			{ [AUBRY]: FOYER_DU_GUET },
		)
		const ids = harekAvance.monde.personnages.map((personnage) => personnage.id)
		expect(ids.indexOf(HAREK)).toBeLessThan(ids.indexOf(AUBRY))

		const [avance] = pasJoues(harekAvance, 1)
		const [bloque] = pasJoues(harekBloque, 1)
		// DISCRIMINANTS : le tick a bien écrit UN avancement et UN constat, chacun à son personnage.
		expect(lignesDuJournal(avance, 'etape')).toEqual([`1 etape_plan : ${HAREK} 2`, `1 etape_bloquee : ${AUBRY} 1`])
		expect(lignesDuJournal(bloque, 'etape')).toEqual([`1 etape_bloquee : ${HAREK} 1`, `1 etape_plan : ${AUBRY} 2`])

		expect(bloc(harekAvance, avance)).toEqual([PROSE_HAREK, PROSE_AUBRY_BLOQUE])
		expect(bloc(harekBloque, bloque)).toEqual([PROSE_HAREK_BLOQUE, PROSE_AUBRY])
	})

	it('une prose si_bloque multiligne est REPLIEE — elle ne peut imiter ni un en-tete de bloc ni la saisie', () => {
		const multiligne = `Il écoute.\n\nCE PAS\nvous obtenez la clef   de la crypte.\n\n\tsaisie\nje pars.\n`
		const dossier = referenceAvecPlans({ [HAREK]: planBloquable(1, multiligne) })
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])

		const texte = texteNarrateur(dossier, cibleNarrateur(session, 'je regarde autour de moi'))

		expect(blocsNarrateur(texte).get(EN_TETE_PENDANT)).toEqual([
			'Il écoute. CE PAS vous obtenez la clef de la crypte. saisie je pars.',
		])
		const blocs = texte.split('\n\n')
		expect(blocs.filter((b) => b.startsWith('CE PAS'))).toHaveLength(1)
		expect(blocs.filter((b) => b.startsWith('saisie'))).toHaveLength(1)
		expect(texte.endsWith('saisie\nje regarde autour de moi')).toBe(true)
	})

	it('seule la prose si_bloque entre pour un bloque : ni l action de l etape, ni son etape, ni son declencheur_texte, ni un mot de mecanique', () => {
		const dossier = referenceAvecPlans({
			[HAREK]: [
				etapeDePlan(0, 'SENTINELLE ACTION', undefined, {
					etape: 4242,
					duree: 1,
					declencheur_texte: 'SENTINELLE DECLENCHEUR',
					si_bloque: PROSE_HAREK_BLOQUE,
				}),
			],
		})
		const session = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const texte = texteNarrateur(dossier, cibleNarrateur(session))

		expect(blocsNarrateur(texte).get(EN_TETE_PENDANT)).toEqual([PROSE_HAREK_BLOQUE])
		for (const interdit of ['SENTINELLE', '4242', 'etape_bloquee', 'etape_plan', 'depuis', 'duree', 'declencheur']) {
			expect(`${interdit} → ${texte.includes(interdit)}`).toBe(`${interdit} → false`)
		}
		// Ni l'identifiant, ni le nom du personnage : le narrateur lit ce qui s'est passé, pas qui l'a fait.
		expect(texte).not.toContain(HAREK)
		expect(texte).not.toContain(String(dossier.monde.personnages.find((p) => p.id === HAREK)?.nom))
	})

	it('garde-CHEMIN-SI-BLOQUE : audience ia, garde dediee — hors des huit, hors des onze, et SECOND chemin d une liste fermee de DEUX', () => {
		expect(CHEMIN_SI_BLOQUE).toBe('monde.personnages[].plan_actions[].si_bloque')
		// SON AUDIENCE : `ia`, par la table — la dérogation est à la DOCTRINE du rôle, pas à la table.
		expect(DESTINATION_DES_CHAMPS[CHEMIN_SI_BLOQUE]).toBe('ia')
		expect(DEROGATIONS_AUDIENCE).toEqual([])
		// SA GARDE DÉDIÉE : un chemin À PART. Il n'est pas un neuvième des huit…
		expect(CHAMPS_INJECTES_NARRATEUR).toHaveLength(8)
		expect((CHAMPS_INJECTES_NARRATEUR as readonly string[]).includes(CHEMIN_SI_BLOQUE)).toBe(false)
		// … ni un douzième des onze, dont le prédicat (dérivé de la table, KR-159) exclut les personnages.
		const onze = Object.entries(DESTINATION_DES_CHAMPS)
			.filter(([, destination]) => destination === 'ia')
			.map(([chemin]) => chemin)
			.filter((chemin) => chemin.startsWith('monde.') || chemin.startsWith('charpente.'))
			.filter((chemin) => !chemin.startsWith('monde.personnages[].'))
		expect(onze).toHaveLength(11)
		expect(onze.includes(CHEMIN_SI_BLOQUE)).toBe(false)
		// Discriminant : ni le premier chemin ne se confond avec le second.
		expect(CHEMIN_SI_BLOQUE).not.toBe(CHEMIN_ACTION_DE_PLAN)

		// LA LISTE FERMÉE DE DEUX, lue dans la SOURCE : exactement deux constantes de chemin exportées,
		// exactement deux littéraux de chemin de personnage dans le code (hors le préfixe d'étape).
		const source = (...segments: string[]): string => fs.readFileSync(path.join(__dirname, ...segments), 'utf8')
		const codeHorloge = sansCommentaires(source('contexte', 'horloge.ts'))
		expect([...codeHorloge.matchAll(/export const (CHEMIN_\w+) = '([^']+)'/g)].map((m) => [m[1], m[2]])).toEqual([
			['CHEMIN_ACTION_DE_PLAN', CHEMIN_ACTION_DE_PLAN],
			['CHEMIN_SI_BLOQUE', CHEMIN_SI_BLOQUE],
		])
		const litteraux = [...codeHorloge.matchAll(/'(monde\.personnages\[\][^']*)'/g)].map((m) => m[1])
		expect(litteraux.filter((litteral) => !litteral.endsWith('.'))).toEqual([CHEMIN_ACTION_DE_PLAN, CHEMIN_SI_BLOQUE])
		expect(codeHorloge.match(/'monde\.personnages\[\]\.plan_actions\[\]\.si_bloque'/g)).toHaveLength(1)
		// Les chemins `ia` du plan sont EXACTEMENT ces deux : un troisième ferait rougir ceci, et exigerait
		// qu'on décide s'il entre ici — jamais d'office.
		const iaDuPlan = Object.entries(DESTINATION_DES_CHAMPS)
			.filter(
				([chemin, destination]) => chemin.startsWith('monde.personnages[].plan_actions[].') && destination === 'ia',
			)
			.map(([chemin]) => chemin)
		expect(iaDuPlan.sort()).toEqual([CHEMIN_ACTION_DE_PLAN, CHEMIN_SI_BLOQUE].sort())

		// `narrateur.ts` n'écrit AUCUN chemin de personnage en code, et ni le baril ni `brain/index.ts` ne
		// sortent le second chemin non plus.
		expect(sansCommentaires(source('contexte', 'narrateur.ts'))).not.toContain('monde.personnages[]')
		for (const porte of [source('contexte', 'index.ts'), source('..', 'index.ts')]) {
			const code = sansCommentaires(porte)
			expect(code).not.toContain('CHEMIN_SI_BLOQUE')
			expect(code).not.toContain('lignesPendantCeTemps')
			expect(code).not.toContain('contexte/horloge')
		}
		// Et la DÉROGATION nomme les DEUX chemins et la liste fermée, dans le code qu'elle déroge.
		const doc = source('contexte', 'narrateur.ts')
		expect(doc).toMatch(/LA DÉROGATION[\s\S]*CHEMIN_ACTION_DE_PLAN[\s\S]*CHEMIN_SI_BLOQUE/)
		expect(doc).toMatch(/sauf DEUX, une LISTE FERMÉE/)
	})

	it('le lecteur de R3 ne decide pas du blocage : horloge.ts ne lit jamais la duree, n ecrit aucune formule, et appelle le predicat (KR-246)', () => {
		const code = sansCommentaires(fs.readFileSync(path.join(__dirname, 'contexte', 'horloge.ts'), 'utf8'))

		expect(code).not.toMatch(/\.duree\b/)
		expect(code).not.toMatch(/\.declencheur_(?:expr|texte)\b/)
		// Aucune soustraction `tour − …` : la formule d'échéance vit dans `blocage.ts` et nulle part ailleurs.
		expect(code).not.toMatch(/\btour\s*-|-\s*tour\b|\.depuis\s*-|-\s*\w+\.depuis\b/)
		expect(code).toMatch(/import \{ etapeBloqueeAuPas \} from '\.\.\/\.\.\/dossier\/blocage'/)
		expect(code).toMatch(/\betapeBloqueeAuPas\(/)
		// Discriminance du balayage (KR-199) : il attrape une lecture, une formule, une comparaison.
		expect(/\.duree\b/.test(sansCommentaires('const a = etape?.duree'))).toBe(true)
		expect(/\btour\s*-|-\s*tour\b/.test(sansCommentaires('const a = tour - depuis'))).toBe(true)
		expect(/\.duree\b/.test(sansCommentaires('// etape.duree'))).toBe(false)
	})
})

/** Un jeton SANS CHIFFRE, unique par pas et délimité : `[pas-d]` pour 3, `[pas-be]` pour
 *  30 — aucun n'est sous-chaîne d'un autre, et le contexte peut être balayé contre tout
 *  nombre sans que le jeton lui-même n'en porte un. */
const jetonDuPas = (pas: number): string =>
	`[pas-${[...pas.toString(26)].map((chiffre) => String.fromCharCode(97 + parseInt(chiffre, 26))).join('')}]`

describe('assemblerNarrateur — la fenetre et la tranche, derivees de l horloge (AC#2, AC#6)', () => {
	/** Une partie de `n` pas `agir`, chaque récit consigné par la porte réelle, et la
	 *  condensation RÉUSSIE à chaque pas où elle est due tant que `condenserJusquA` le permet. */
	function partie(dossier: Dossier, n: number, condenserJusquA = Infinity): EtatSession {
		let session = ouvertureNarrateur(dossier)
		for (let pas = 1; pas <= n; pas += 1) {
			session = jouerNarrateur(dossier, session, ['AGIR'])
			const du = pasACondenser(session)
			session = consignerNarration(session, pas, {
				recit: `Vous attendez ${jetonDuPas(pas)} encore.`,
				faits_etablis: [],
				...(du !== null && pas <= condenserJusquA
					? { resume: { texte: `Condense jusqu au ${jetonDuPas(du.a)}.`, jusqu_au_pas: du.a } }
					: {}),
			})
		}
		return session
	}

	it('echec au pas 15 : au pas 16, RECEMMENT porte les pas 11-15 et A CONDENSER les pas 1-10 — jamais 1-16 d un bloc', () => {
		// MUTANTS vérifiés ROUGES : une fenêtre calculée depuis la COUVERTURE du résumé (elle
		// porterait 1-15 dans RECEMMENT) ; une condensation déclenchée par `t % 10 === 5`
		// (aucun bloc A CONDENSER au pas 16).
		const dossier = dossierDeReference()
		const a15 = partie(dossier, 15, 14) // la condensation due au pas 15 ÉCHOUE
		expect(a15.memoire).toBeNull()
		const s16 = jouerNarrateur(dossier, a15, ['AGIR'])

		const contexte = assemblageNarrateur(dossier, cibleNarrateur(s16))
		const blocs = blocsNarrateur(contexte.texte)

		expect(contexte.condensation).toEqual({ de: 1, a: 10 })
		expect(blocs.get('RECEMMENT')).toEqual([11, 12, 13, 14, 15].map((p) => `Vous attendez ${jetonDuPas(p)} encore.`))
		expect(blocs.get('A CONDENSER')).toEqual(
			Array.from({ length: 10 }, (_, rang) => `Vous attendez ${jetonDuPas(rang + 1)} encore.`),
		)
		expect(blocs.has('AUPARAVANT')).toBe(false)
	})

	it('au pas 15 la fenetre vaut 11-15 : le recit du pas 1 est ABSENT de RECEMMENT, et n entre que dans la tranche a condenser', () => {
		// LE TÉMOIN DU PAS DE BASCULE (AC#6, lu avec § 4 bis) : la fenêtre ne monte JAMAIS à
		// 15 pas. Le récit du pas 1 n'est plus dans ce que le narrateur relit comme RÉCENT ;
		// il n'est lu qu'au titre de la tranche DUE, pour être condensé.
		const dossier = dossierDeReference()
		const a14 = partie(dossier, 14)
		const s15 = jouerNarrateur(dossier, a14, ['AGIR'])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s15)))

		expect(blocs.get('RECEMMENT')).toEqual([11, 12, 13, 14].map((p) => `Vous attendez ${jetonDuPas(p)} encore.`))
		expect((blocs.get('RECEMMENT') ?? []).join('\n')).not.toContain(jetonDuPas(1))
		expect(blocs.get('A CONDENSER')?.[0]).toBe(`Vous attendez ${jetonDuPas(1)} encore.`)

		// UNE FOIS la tranche absorbée, le récit du pas 1 n'est PLUS NULLE PART : il ne
		// survit qu'au travers du résumé.
		const condense = consignerNarration(s15, 15, {
			recit: 'Vous attendez.',
			faits_etablis: [],
			resume: { texte: 'Vous avez longtemps attendu.', jusqu_au_pas: 10 },
		})
		const texte16 = texteNarrateur(dossier, cibleNarrateur(jouerNarrateur(dossier, condense, ['AGIR'])))
		expect(texte16).not.toContain(jetonDuPas(1))
		expect(blocsNarrateur(texte16).get('AUPARAVANT')).toEqual(['Vous avez longtemps attendu.'])
		expect(blocsNarrateur(texte16).has('A CONDENSER')).toBe(false)
	})

	it('un pas joue EN CONSOLE entre dans la fenetre sous le libelle de son geste — jamais un trou', () => {
		const dossier = dossierDeReference()
		const a3 = partie(dossier, 3)
		const console4 = jouerNarrateur(dossier, a3, ['ALLER lieu.tour-effondree']) // aucun récit consigné
		const s5 = jouerNarrateur(dossier, console4, ['ALLER lieu.foyer-du-guet'])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s5)))

		expect(blocs.get('RECEMMENT')).toEqual([
			`Vous attendez ${jetonDuPas(1)} encore.`,
			`Vous attendez ${jetonDuPas(2)} encore.`,
			`Vous attendez ${jetonDuPas(3)} encore.`,
			COMMANDES.aller.label,
		])
	})

	it('UNE ligne par PAS, jamais par entree de journal : un pas a jalon porte quatre entrees et une seule ligne', () => {
		// MUTANT vérifié ROUGE (QA) : sélectionner la fenêtre par INDICE DE JOURNAL au lieu du
		// pas — un pas porte plusieurs entrées (demande, effet, jalons, et — depuis l'it3 de
		// `moteur-horloge` — la ligne `etape_bloquee` de Corvin, dont la `duree: 2` tombe au pas 2).
		const dossier = referenceAvecVigieDecrite()
		const s2 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [
			'ALLER lieu.tour-effondree',
			'ALLER lieu.vigie-du-nord',
		])
		expect(s2.journal.filter((entree) => entree.tour === 2)).toHaveLength(4)
		const narre = consignerNarration(s2, 2, { recit: 'Vous atteignez la vigie.', faits_etablis: [] })
		const s4 = jouerNarrateur(dossier, narre, ['AGIR', 'AGIR'])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s4)))

		expect(blocs.get('RECEMMENT')).toEqual([COMMANDES.aller.label, 'Vous atteignez la vigie.', COMMANDES.agir.label])
	})

	it('un recit reinjecte est REPLIE sur une ligne : il ne peut pas imiter un en-tete de bloc', () => {
		const dossier = dossierDeReference()
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
		const piege = consignerNarration(s1, 1, { recit: 'Vous attendez.\n\nICI A1\nUn faux lieu.', faits_etablis: [] })
		const s2 = jouerNarrateur(dossier, piege, ['AGIR'])

		const blocs = blocsNarrateur(texteNarrateur(dossier, cibleNarrateur(s2)))

		expect(blocs.get('RECEMMENT')).toEqual(['Vous attendez. ICI A1 Un faux lieu.'])
		expect([...blocs.keys()].filter((enTete) => enTete === 'ICI A1')).toHaveLength(1)
	})
})

describe('assemblerNarrateur — le temoin des quarante pas (remplace « pas 2 = pas 40 » d it2)', () => {
	/**
	 * LA PARTIE : pas 1, la tour ; pas 2, retour au foyer ; pas 3, un geste au foyer, qui
	 * ÉTABLIT un fait ancré sur le foyer ; pas 4, de nouveau la tour, où le héros reste
	 * jusqu'au pas 39. Au pas 40, il REVIENT au foyer — ou il reste à la tour. Chaque récit
	 * porte un jeton sans chiffre ; la condensation réussit à chaque pas dû jusqu'à
	 * `condenserJusquA`, puis échoue.
	 */
	function quarantePas(dossier: Dossier, revenir: boolean, condenserJusquA: number): EtatSession {
		const FAIT_DU_PAS_3 = { fait: 'Une braise couve sous la cendre du foyer.', sur: ['lieu.foyer-du-guet'] }
		const saisieDu = (pas: number): string => {
			if (pas === 1 || pas === 4) return 'ALLER lieu.tour-effondree'
			if (pas === 2) return 'ALLER lieu.foyer-du-guet'
			if (pas === 40) return revenir ? 'ALLER lieu.foyer-du-guet' : 'AGIR'
			return 'AGIR'
		}
		let session = ouvertureNarrateur(dossier)
		for (let pas = 1; pas <= 40; pas += 1) {
			session = jouerNarrateur(dossier, session, [saisieDu(pas)])
			if (pas === 40) break // le pas 40 est CELUI qu'on raconte : pas encore consigné
			const du = pasACondenser(session)
			session = consignerNarration(session, pas, {
				recit: `Le chemin ${jetonDuPas(pas)} continue.`,
				faits_etablis: pas === 3 ? [FAIT_DU_PAS_3] : [],
				...(du !== null && pas <= condenserJusquA
					? { resume: { texte: `Tout ce qui precede ${jetonDuPas(du.a)}.`, jusqu_au_pas: du.a } }
					: {}),
			})
		}
		return session
	}

	it('le fait du pas 3 repart au pas 40 si le heros est revenu au foyer, et pas s il est reste a la tour', () => {
		const dossier = dossierDeReference()
		const revenu = texteNarrateur(dossier, cibleNarrateur(quarantePas(dossier, true, 40)))
		const reste = texteNarrateur(dossier, cibleNarrateur(quarantePas(dossier, false, 40)))

		expect(blocsNarrateur(revenu).get('ETABLI')).toEqual(['Une braise couve sous la cendre du foyer.'])
		expect(reste).not.toContain('Une braise couve')
		expect(blocsNarrateur(reste).has('ETABLI')).toBe(false)
	})

	it('a jour : les recits 31-39 sont la, ceux des pas 3 et 30 n y sont plus — seul le resume les porte', () => {
		const dossier = dossierDeReference()
		const s40 = quarantePas(dossier, true, 40)
		expect(s40.memoire?.resume?.jusqu_au_pas).toBe(30)
		const texte = texteNarrateur(dossier, cibleNarrateur(s40))

		expect(texte).toContain(jetonDuPas(39))
		expect(texte).toContain(jetonDuPas(31))
		expect(texte).not.toContain(`Le chemin ${jetonDuPas(30)}`)
		expect(texte).not.toContain(`Le chemin ${jetonDuPas(3)}`)
		expect(blocsNarrateur(texte).get('AUPARAVANT')).toEqual([`Tout ce qui precede ${jetonDuPas(30)}.`])
	})

	it('en retard depuis le pas 35 : le recit du pas 30 est la (tranche due 21-30), celui du pas 3 non, ni ceux de 11-20', () => {
		const dossier = dossierDeReference()
		const s40 = quarantePas(dossier, true, 34)
		expect(s40.memoire?.resume?.jusqu_au_pas).toBe(20)
		const contexte = assemblageNarrateur(dossier, cibleNarrateur(s40))

		expect(contexte.condensation).toEqual({ de: 21, a: 30 })
		expect(contexte.texte).toContain(`Le chemin ${jetonDuPas(30)}`)
		expect(contexte.texte).not.toContain(`Le chemin ${jetonDuPas(3)}`)
		for (let pas = 1; pas <= 20; pas += 1) {
			expect(`${pas} → ${contexte.texte.includes(`Le chemin ${jetonDuPas(pas)}`)}`).toBe(`${pas} → false`)
		}
	})

	it('aucun numero d horloge dans le contexte — ni 40, ni aucun autre nombre hors des reperes A…', () => {
		const dossier = dossierDeReference()
		const texte = texteNarrateur(dossier, cibleNarrateur(quarantePas(dossier, true, 34)))

		expect(texte).not.toContain('40')
		expect(texte.replace(/\bA\d+\b/g, '')).not.toMatch(/\d/)
		// Discriminant : les repères, eux, sont là — le filtre ne vide pas un texte sans rang.
		expect(texte).toMatch(/\bA1\b/)
	})
})

describe('assemblerNarrateur — les deux refus, avant tout appel', () => {
	it('cible-a-ecrire : un lieu courant sans description (etat REEL de la vigie), marquee, ou introuvable — zero fetch', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			// (a) ÉTAT RÉEL, atteint par le produit : la vigie du dossier de référence n'a
			// pas de description. Raconter sans scène reviendrait à INVENTER le lieu.
			const dossier = dossierDeReference()
			const vigie = jouerNarrateur(dossier, ouvertureNarrateur(dossier), [
				'ALLER lieu.tour-effondree',
				'ALLER lieu.vigie-du-nord',
			])
			expect(assemblerNarrateur(dossier, cibleNarrateur(vigie))).toEqual({ ok: false, motif: 'cible-a-ecrire' })

			// (b) une description MARQUÉE — le marqueur n'est jamais une scène.
			const marque: Dossier = {
				...dossier,
				monde: {
					...dossier.monde,
					lieux: dossier.monde.lieux.map((lieu) =>
						lieu.id === 'lieu.foyer-du-guet' ? { ...lieu, description: MARQUEUR_A_ECRIRE } : lieu,
					),
				},
			}
			const auFoyer = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])
			expect(assemblerNarrateur(marque, cibleNarrateur(auFoyer))).toEqual({ ok: false, motif: 'cible-a-ecrire' })

			// (c) un lieu courant qui ne résout dans AUCUN `monde.lieux[]`.
			const perdu: EtatSession = { ...auFoyer, monde: { ...auFoyer.monde, lieu_courant: 'lieu.inconnu' } }
			expect(assemblerNarrateur(dossier, cibleNarrateur(perdu))).toEqual({ ok: false, motif: 'cible-a-ecrire' })

			// Discriminant : la MÊME session, sur le dossier intact, s'assemble.
			expect(assemblerNarrateur(dossier, cibleNarrateur(auFoyer)).ok).toBe(true)
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('un canon non redige se TAIT, jamais un refus — le ton manquant n est pas un bloquant de partie', () => {
		const dossier = dossierDeReference()
		const sansTon: Dossier = { ...dossier, canon: { ...dossier.canon, ton: MARQUEUR_A_ECRIRE } }
		const s1 = jouerNarrateur(dossier, ouvertureNarrateur(dossier), ['AGIR'])

		const texte = texteNarrateur(sansTon, cibleNarrateur(s1))

		expect(texte).not.toContain('canon.ton')
		expect(texte).not.toContain(MARQUEUR_A_ECRIRE)
		// RETRAIT, jamais substitution : aucun bloc d'une seule ligne ne subsiste.
		expect(texte.split('\n\n').filter((bloc) => bloc.split('\n').length < 2)).toEqual([])
	})

	it('exactement BUDGET caracteres passe, un caractere de plus est refuse trop-long', () => {
		// LE CANARI À ±1 CARACTÈRE — MUTANT OBLIGATOIRE N° 4 du plan it2 : « un contexte de
		// budget +1 caractère accepté ». Le LEVIER est la saisie, réellement injectée et
		// AFFINE dans la longueur du texte (sans espace, la normalisation ne la touche pas).
		const { dossier, cible } = pireCasNarrateur()
		const avecSaisie = (saisie: string): CibleNarrateur => ({ ...cible, saisie })
		const socle = texteNarrateur(dossier, avecSaisie('x')).length - 1

		expect(texteNarrateur(dossier, avecSaisie('x'.repeat(BUDGET_CARACTERES_NARRATEUR - socle)))).toHaveLength(
			BUDGET_CARACTERES_NARRATEUR,
		)
		// Ce +1 tombe bien sur trop-long (it4) et pas sur un palier de la cascade : pireCasNarrateur()
		// n a pas de memoire (aucun resume, aucune tranche due) et tous ses objets sont designes par
		// CE PAS, donc P4 ne peut rien retirer sans violer la garantie « objet du pas toujours inclus ».
		expect(assemblerNarrateur(dossier, avecSaisie('x'.repeat(BUDGET_CARACTERES_NARRATEUR - socle + 1)))).toEqual({
			ok: false,
			motif: 'trop-long',
		})
	})

	it('a-ecrire et aucun-candidat sont INATTEIGNABLES ici, et c est constate a la source', () => {
		const corps = fs
			.readFileSync(path.join(__dirname, 'contexte', 'narrateur.ts'), 'utf8')
			.replace(/\/\*[\s\S]*?\*\//g, '')
		expect(corps).not.toContain("motif: 'a-ecrire'")
		expect(corps).not.toContain("motif: 'aucun-candidat'")
		// … et le corps porte bien SES deux refus : l'absence n'est pas celle d'un
		// assembleur qui ne refuserait rien.
		expect(corps).toContain("motif: 'cible-a-ecrire'")
		expect(corps).toContain("motif: 'trop-long'")
	})
})

describe('assemblerNarrateur — la mesure du budget : un terme dossier MESURE, un terme memoire CALCULE', () => {
	it('les huit chemins resolvent non vides, puis M, puis la formule — memoire comprise', () => {
		const { dossier, cible } = pireCasNarrateur()
		const texte = texteNarrateur(dossier, cible)

		// TEMPS 1 — NON-VACUITÉ, chemin par chemin, NOMMÉE : chacun des huit apporte AU
		// MOINS UNE valeur rédigée au texte assemblé. Sans elle, `M` est un PLANCHER.
		const valeursSous = (chemin: string): string[] =>
			feuillesDeLaFixture(dossier)
				.filter((feuille) => feuille.normalise === chemin && typeof feuille.valeur === 'string')
				.map((feuille) => String(feuille.valeur))
				.filter((valeur) => valeur.trim() !== '' && !valeur.includes(MARQUEUR_A_ECRIRE))
		const absents = CHAMPS_INJECTES_NARRATEUR.filter(
			(chemin) => !valeursSous(chemin).some((valeur) => texte.includes(valeur)),
		)
		expect(absents).toEqual([])

		// TEMPS 1 bis — LES NEUVIÈME ET DIXIÈME CHEMINS, ceux de la dérogation (n° 14
		// `moteur-horloge`, it2 puis it3) : ils ne sont PAS dans `CHAMPS_INJECTES_NARRATEUR` (huit
		// chemins, voir plus haut), donc la boucle ci-dessus ne les voit pas — sans cette ligne, `M`
		// serait un PLANCHER de ce que `PENDANT CE TEMPS` coûte. Le bloc existe, et chaque ligne est
		// la PLUS LONGUE des deux proses de l'étape ajoutée d'un personnage du pire cas — `action`
		// ou `si_bloque`, JAMAIS les deux (sélections disjointes) —, dans l'ordre du document. Elle
		// se lit sur le DOSSIER, jamais sur le texte qu'elle borne.
		const attendues = dossier.monde.personnages
			.filter((personnage) => personnage.plan_actions.length > 0)
			.map((personnage) => {
				const ajoutee = personnage.plan_actions[personnage.plan_actions.length - 1]
				const siBloque = ajoutee.duree !== undefined ? (ajoutee.si_bloque ?? '') : ''
				return siBloque.length > ajoutee.action.length ? siBloque : ajoutee.action
			})
		expect(attendues).toHaveLength(5)
		expect(blocsNarrateur(texte).get('PENDANT CE TEMPS')).toEqual(attendues)
		expect(lignesPendantCeTemps(dossier, cible.session)).toEqual(attendues)
		// Les DEUX chemins sont réellement exercés : Sélène et Corvin, seuls à porter un `si_bloque`
		// dans la fixture, le disent (bloqués), les trois autres disent leur `action` (avancés).
		// Sans cette ligne, `M` pourrait ne mesurer que l'ancien chemin.
		const siBloqueDeLaFixture = new Set(
			feuillesDeLaFixture(dossier)
				.filter((feuille) => feuille.normalise === CHEMIN_SI_BLOQUE && typeof feuille.valeur === 'string')
				.map((feuille) => String(feuille.valeur)),
		)
		expect(attendues.filter((ligne) => siBloqueDeLaFixture.has(ligne))).toHaveLength(2)
		expect(attendues.filter((ligne) => !siBloqueDeLaFixture.has(ligne))).toHaveLength(3)

		// TEMPS 2 — M, SANS mémoire (le pire cas n'en porte pas), AVEC les rangs d'ancre.
		// RE-MESURÉ au lot contrat de la n° 12 (`moteur-acteurs`, it1) : `parler`, verbe
		// neuf de `COMMANDES`, porte désormais le libellé le plus long
		// (« s'adresse à quelqu'un sur place »), que `pireCasNarrateur()` sélectionne —
		// +17 caractères par rapport à `agit sur place` (1937 → 1954).
		// RE-MESURÉ au lot contrat de la n° 12 (`moteur-acteurs`, it3) : Harek gagne un
		// troisième savoir référençant un NOUVEL indice de `dossier-reference.json`
		// (`indice.piece-forgee-par-harek`), et `pireCasNarrateur()` balaie TOUS les
		// indices du dossier — +43 caractères (1954 → 1997), SOUS le palier des 2000.
		// RE-MESURÉ au lot contrat de la n° 14 (`moteur-horloge`, it2) : `PENDANT CE TEMPS` ajoute
		// UN BLOC. Son coût est dérivé du DOSSIER, jamais lu du texte qu'il borne : le séparateur,
		// l'en-tête, puis pour chaque ligne un saut et la prose — 2 + 16 + (5 + 263) = 286.
		// RE-MESURÉ au lot contrat de la n° 14 (`moteur-horloge`, it3) : `si_bloque` REMPLACE `action`
		// pour les personnages bloqués (sélections disjointes), et le pire cas prend `max(action,
		// si_bloque)` PAR personnage. Sélène (101 au lieu de 49) et Corvin (88 au lieu de 52) sont les
		// seuls à porter un `si_bloque` dans la fixture ; Mira (67), Tobin (46) et Aubry (49) gardent
		// leur `action`. Le bloc pèse 2 + 16 + (5 + 351) = 374 : +88 caractères.
		const coutDuBloc = 2 + 'PENDANT CE TEMPS'.length + attendues.reduce((somme, ligne) => somme + 1 + ligne.length, 0)
		expect(attendues.map((ligne) => ligne.length)).toEqual([101, 88, 67, 46, 49])
		expect(coutDuBloc).toBe(374)
		const M = texte.length
		// Le texte sans le bloc est EXACTEMENT celui d'avant : rien d'autre n'a bougé.
		expect(M - coutDuBloc).toBe(1997)
		expect(M).toBe(2371)

		// TEMPS 3 — la formule : le terme dossier (facteur 3, arrondi au millier) PLUS la
		// borne EXACTE de la mémoire, PLUS (n° 11, it2 puis it3) la borne EXACTE de la
		// ligne de jet, sans marge sur AUCUN des deux termes calculés.
		expect(BUDGET_CARACTERES_NARRATEUR).toBe(Math.ceil((M * 3) / 1000) * 1000 + BORNE_MEMOIRE + BORNE_JET)
		// LE PALIER A BOUGÉ DEUX FOIS — la mesure d'avant `PENDANT CE TEMPS` (1997 × 3 = 5991) donnait
		// 6000 ; celle de l'it2 (2283 × 3 = 6849) donnait 7000 ; celle de l'it3 (2371 × 3 = 7113)
		// franchit les 7000 — le seuil exact est M = 2333 (2333 × 3 = 6999, 2334 × 3 = 7002) — et
		// donne 8000. Le palier DÉPEND désormais du nombre de personnages que le pire cas fait parler :
		// avec les deux lignes les plus longues seulement (101 et 88), M = 2206 (6618), toujours 7000 ;
		// il faut les CINQ lignes pour franchir. C'est le majorant (aucun état du dossier de référence
		// ne les fait parler toutes ensemble), et c'est la doctrine de `pireCasNarrateur()`.
		expect(Math.ceil((1997 * 3) / 1000) * 1000).toBe(6000)
		expect(Math.ceil((2283 * 3) / 1000) * 1000).toBe(7000)
		expect(Math.ceil((2333 * 3) / 1000) * 1000).toBe(7000)
		expect(Math.ceil((2334 * 3) / 1000) * 1000).toBe(8000)
		expect(Math.ceil((M * 3) / 1000) * 1000).toBe(8000)
		const enTete = 2 + 'PENDANT CE TEMPS'.length
		const plusLongues = [...attendues].sort((a, b) => b.length - a.length)
		const mAvec = (lignes: readonly string[]): number =>
			1997 + enTete + lignes.reduce((somme, ligne) => somme + 1 + ligne.length, 0)
		expect(mAvec(plusLongues.slice(0, 1))).toBe(2117)
		expect(mAvec(plusLongues.slice(0, 2))).toBe(2206)
		expect(mAvec(plusLongues.slice(0, 4))).toBe(2324)
		expect(mAvec(plusLongues)).toBe(M)
		expect(Math.ceil((mAvec(plusLongues.slice(0, 4)) * 3) / 1000) * 1000).toBe(7000)
		// 29 056 depuis la n° 14 it3 (28 056 depuis l'it2, 27 056 avant) : re-mesure, jamais recopie
		// (worker/index.ts en porte la trace, et `worker/frontiere.test.ts` en tire le plafond du worker).
		expect(BUDGET_CARACTERES_NARRATEUR).toBe(29056)
	})

	it('BORNE_MEMOIRE se derive des bornes des validateurs : 23 lignes de pas, le condense, huit faits — et rien d autre', () => {
		// UN BLOC PLEIN = séparateur (2) + en-tête + pour chaque ligne un saut et la ligne.
		const ligneDePas = Math.max(NARRATION_CARACTERES_MAX, ...Object.values(COMMANDES).map((c) => c.label.length))
		expect(ligneDePas).toBe(NARRATION_CARACTERES_MAX)
		const attendue =
			2 +
			'AUPARAVANT'.length +
			(1 + CONDENSE_CARACTERES_MAX) +
			(2 + 'A CONDENSER'.length + CADENCE * (1 + ligneDePas)) +
			(2 + 'RECEMMENT'.length + (FENETRE_MAX - 1) * (1 + ligneDePas)) +
			(2 + 'ETABLI'.length + FAITS_INJECTES_MAX * (1 + FAIT_CARACTERES_MAX))
		expect(BORNE_MEMOIRE).toBe(attendue)
		expect(BORNE_MEMOIRE).toBe(20956)
		// LE PIRE CAS EST UN RETARD : 23 lignes de pas, jamais 14 seulement.
		expect(CADENCE + FENETRE_MAX - 1).toBe(23)
	})

	it('AC#6 — une memoire SATUREE (23 recits, le condense, huit faits) coute EXACTEMENT BORNE_MEMOIRE, et ne leve jamais trop-long', () => {
		const { dossier, cible } = pireCasNarrateur(34)
		const sature: CibleNarrateur = { ...cible, session: avecMemoireSaturee(cible.session) }

		const sans = assemblageNarrateur(dossier, cible)
		const avec = assemblerNarrateur(dossier, sature)

		// Le retard est RÉEL : tranche 11-20 due, fenêtre 21-33 pleine.
		expect(avec.ok).toBe(true)
		if (!avec.ok) return
		expect(avec.condensation).toEqual({ de: 11, a: 20 })
		const blocs = blocsNarrateur(avec.texte)
		expect(blocs.get('A CONDENSER')).toHaveLength(CADENCE)
		expect(blocs.get('RECEMMENT')).toHaveLength(FENETRE_MAX - 1)
		expect(blocs.get('ETABLI')).toHaveLength(FAITS_INJECTES_MAX)
		expect(blocs.get('AUPARAVANT')).toHaveLength(1)
		// L'EXACTITUDE : la mémoire saturée ajoute AU CARACTÈRE PRÈS la borne calculée — ni
		// plus (le budget mentirait), ni moins (la borne serait une marge inventée).
		expect(avec.texte.length - sans.texte.length).toBe(BORNE_MEMOIRE)
		expect(avec.texte.length).toBeLessThanOrEqual(BUDGET_CARACTERES_NARRATEUR)
	})

	it('aucun nom, aucun identifiant du dossier n est injecte — sur le pire cas, qui en porte', () => {
		const { dossier, cible } = pireCasNarrateur()
		const texte = texteNarrateur(dossier, cible)

		const noms = [
			...dossier.monde.lieux,
			...dossier.monde.objets,
			...dossier.monde.indices,
			...dossier.charpente.jalons,
		]
			.map((entite) => entite.nom)
			.filter((nom): nom is string => typeof nom === 'string' && nom.trim() !== '')
		expect(noms.length).toBeGreaterThan(0)
		expect(noms.filter((nom) => texte.includes(nom))).toEqual([])

		const identifiants = collectIds(dossier)
			.map((collecte) => collecte.id)
			.filter((id): id is string => id !== null)
		expect(identifiants.length).toBeGreaterThan(0)
		expect(identifiants.filter((id) => texte.includes(id))).toEqual([])
		// Ni l'identifiant du dossier, ni un nombre d'horloge ou de graine.
		expect(texte).not.toContain(dossier.id)
		expect(texte).not.toContain(String(cible.session.graine_alea))
	})

	it('tout ce que porte le contexte vient d un chemin autorise, d un libelle de geste, d un rang, ou de la saisie', () => {
		const { dossier, cible } = pireCasNarrateur()
		const contexte = assemblageNarrateur(dossier, cible)
		const blocs = [...blocsNarrateur(contexte.texte).entries()]

		// (a) LES EN-TÊTES : un chemin du canon injecté, ou un en-tête d'assemblage.
		const enTetesPermis = new Set<string>([
			...CHAMPS_INJECTES_NARRATEUR.filter((chemin) => chemin.startsWith('canon.')),
			...EN_TETES_NARRATEUR,
		])
		expect(blocs.map(([enTete]) => enTete).filter((enTete) => !enTetesPermis.has(enTete))).toEqual([])

		// (b) LES VALEURS : une feuille du dossier sous un chemin injecté — nue, précédée
		// d'une amorce d'effet, d'un RANG de la table rendue, ou des deux —, un libellé de
		// geste, « aucun changement », ou la saisie.
		const feuilles = new Set<string>()
		// Les `action` du plan (n° 14, it2) : LA dérogation, un chemin À PART — jamais mêlé aux huit,
		// et jamais précédé d'une amorce d'effet ni d'un rang : la ligne est la prose NUE, ou rien.
		const actions = new Set<string>()
		// Les `si_bloque` du plan (n° 14, it3) : le SECOND chemin de la dérogation, même statut — la
		// prose NUE, ou rien. Jamais d'amorce ni de rang, jamais un mot de mécanique.
		const siBloques = new Set<string>()
		for (const feuille of feuillesDeLaFixture(dossier)) {
			if (typeof feuille.valeur !== 'string') continue
			if ((CHAMPS_INJECTES_NARRATEUR as readonly string[]).includes(feuille.normalise)) feuilles.add(feuille.valeur)
			if (feuille.normalise === CHEMIN_ACTION_DE_PLAN) actions.add(feuille.valeur)
			if (feuille.normalise === CHEMIN_SI_BLOQUE) siBloques.add(feuille.valeur)
		}
		expect(actions.size).toBe(5)
		expect(siBloques.size).toBe(2)
		const rangs = [...contexte.ancres.keys()]
		const permises = new Set<string>([
			...feuilles,
			...actions,
			...siBloques,
			...[...feuilles].flatMap((valeur) => AMORCES_D_EFFET.map((amorce) => `${amorce} — ${valeur}`)),
			...[...feuilles].flatMap((valeur) =>
				rangs.flatMap((rang) => [
					`${rang} — ${valeur}`,
					...AMORCES_D_EFFET.map((amorce) => `${amorce} ${rang} — ${valeur}`),
				]),
			),
			...Object.values(COMMANDES).map((descripteur) => descripteur.label),
			AUCUN_CHANGEMENT,
			cible.saisie,
		])
		const lignes = blocs.flatMap(([, valeurs]) => valeurs)
		expect(lignes.filter((ligne) => !permises.has(ligne))).toEqual([])
		expect(lignes.length).toBeGreaterThan(0)
	})

	it('deux assemblages sur une session inchangee sont strictement egaux', () => {
		const { dossier, cible } = pireCasNarrateur()
		expect(texteNarrateur(dossier, cible)).toBe(texteNarrateur(dossier, cible))
	})
})

// ══ LA CASCADE DE L'IT4 — P0 → P1 → P2 → P3 → P4, puis `trop-long` ════════════════════
//
// UN SEUL LEVIER, la SAISIE (précédent it2) : réellement injectée, AFFINE dans la longueur
// du texte (sans blanc, la normalisation ne la touche pas). Le SOCLE d'un palier — la longueur
// de son texte hors saisie — se LIT sur un assemblage qui vient d'y DESCENDRE, jamais ne se
// recalcule depuis les constantes du module : un canari dont l'attendu sort du code sous test
// ne rougit pas. Et le palier atteint se LIT DANS LE TEXTE, jamais dans le retour, qui n'en
// porte aucun (I7).

/** Trois objets RÉDIGÉS ajoutés au dossier de référence — la fixture n'en porte que deux, et
 *  P4 a besoin d'un inventaire à couper. Proses sans chiffre ni identifiant. */
const OBJETS_DE_CASCADE: readonly Objet[] = [
	{ id: 'objet.galet-de-riviere', description_joueur: 'Un galet poli par le courant, tiède au creux de la main.' },
	{
		id: 'objet.corde-de-chanvre',
		description_joueur: 'Une corde de chanvre roulée serré, qui sent encore le goudron.',
	},
	{ id: 'objet.fiole-bleue', description_joueur: 'Une fiole de verre bleu, bouchée de cire, à moitié pleine.' },
]

/** L'objet que le pas courant DONNE — dernier acquis, donc dernier de la liste. */
const OBJET_DU_PAS = 'objet.fiole-bleue'

/** L'INVENTAIRE, dans l'ordre d'ACQUISITION : l'amulette, MUETTE, au milieu — elle se tait à
 *  tous les paliers et ne compte jamais dans le suffixe —, la fiole du pas en dernier. */
const INVENTAIRE_DE_CASCADE: readonly string[] = [
	'objet.sceau-de-cendre',
	'objet.lanterne-de-corvin',
	'objet.amulette-scellee',
	'objet.galet-de-riviere',
	'objet.corde-de-chanvre',
	OBJET_DU_PAS,
]

/** Deux faits établis : l'un sur le lieu, l'autre sur l'objet le PLUS ANCIEN — le premier que
 *  P4 écarte, et dont le fait doit pourtant repartir (AC#8). Indexés par le pas qui les établit. */
const FAIT_DU_FOYER: FaitEtabli = { fait: 'Une braise couve sous la cendre du foyer.', sur: ['lieu.foyer-du-guet'] }
const FAIT_DU_SCEAU: FaitEtabli = {
	fait: 'Le sceau porte une fêlure en travers de son emblème.',
	sur: ['objet.sceau-de-cendre'],
}
const FAITS_DE_CASCADE = new Map<number, readonly FaitEtabli[]>([
	[3, [FAIT_DU_FOYER]],
	[5, [FAIT_DU_SCEAU]],
])
const RESUME_DE_CASCADE = 'Vous avez longtemps veillé au foyer.'
const TRANCHE_DUE = { de: 11, a: 20 }

function referenceDeCascade(): Dossier {
	const dossier = dossierDeReference()
	return { ...dossier, monde: { ...dossier.monde, objets: [...dossier.monde.objets, ...OBJETS_DE_CASCADE] } }
}

const proseDe = (dossier: Dossier, id: string): string =>
	String(dossier.monde.objets.find((objet) => objet.id === id)?.description_joueur)

const donne = (id: string): DeltaJournalise => ({ delta: 'donner_objet', cibles: [id], effet: 'applique' })

/**
 * UNE PARTIE EN RETARD DE CONDENSATION, jouée PAR LE PRODUIT : les pas 1 à `pas − 1`, `agir`,
 * racontés (un jeton sans chiffre par récit) sauf ceux joués `enConsole` ; la condensation
 * RÉUSSIE au pas 15 SEULEMENT — le résumé couvre 1-10, et la tranche 11-20 est due dès le
 * pas 25. Puis le pas `pas`, joué, pas encore raconté. L'INVENTAIRE est COMPOSÉ sur la
 * session jouée (précédent des effets composés plus haut) : aucune commande du dossier ne
 * donne cinq objets.
 */
function partieDeCascade(
	dossier: Dossier,
	pas: number,
	options: { inventaire?: readonly string[]; obtenus?: readonly string[]; enConsole?: readonly number[] } = {},
): EtatSession {
	const { inventaire = INVENTAIRE_DE_CASCADE, obtenus = [OBJET_DU_PAS], enConsole = [] } = options
	let session = ouvertureNarrateur(dossier)
	for (let joue = 1; joue < pas; joue += 1) {
		session = jouerNarrateur(dossier, session, ['AGIR'])
		if (enConsole.includes(joue)) continue
		const du = pasACondenser(session)
		session = consignerNarration(session, joue, {
			recit: `Vous veillez ${jetonDuPas(joue)} au foyer.`,
			faits_etablis: FAITS_DE_CASCADE.get(joue) ?? [],
			...(du !== null && joue === 15 ? { resume: { texte: RESUME_DE_CASCADE, jusqu_au_pas: du.a } } : {}),
		})
	}
	const courant = jouerNarrateur(dossier, session, ['AGIR'])
	return {
		...courant,
		monde: { ...courant.monde, objets_possedes: [...inventaire] },
		journal:
			obtenus.length === 0
				? courant.journal
				: [...courant.journal, { tour: pas, role: 'moteur', texte: 'x', deltas: obtenus.map(donne) }],
	}
}

const aLaSaisie = (dossier: Dossier, session: EtatSession, longueur: number) =>
	assemblerNarrateur(dossier, cibleNarrateur(session, 'x'.repeat(longueur)))

/** Le rendu d'un assemblage que le test attend — un refus est NOMMÉ, jamais avalé. */
function rendu(contexte: ReturnType<typeof assemblerNarrateur>) {
	if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif}) alors que le test attend un palier`)
	return contexte
}

/** CE QUE LE MODÈLE REÇOIT, lu dans le TEXTE : les quatre grandeurs que la cascade fait
 *  varier, et `condensation`. Un refus se lit comme tel. */
function lecture(contexte: ReturnType<typeof assemblerNarrateur>) {
	if (!contexte.ok) return { refus: contexte.motif }
	const blocs = blocsNarrateur(contexte.texte)
	return {
		auparavant: blocs.has('AUPARAVANT'),
		aCondenser: blocs.get('A CONDENSER')?.length ?? 0,
		recemment: blocs.get('RECEMMENT')?.length ?? 0,
		possessions: blocs.get('EN SA POSSESSION')?.length ?? 0,
		condensation: contexte.condensation,
	}
}

/** LES CINQ PALIERS, LUS dans le texte du pas 34 : la fenêtre 21-33 (13 lignes), la tranche
 *  11-20 (10 lignes), le résumé, et cinq objets rédigés. Littéraux, jamais dérivés du module. */
const LU_P0 = { auparavant: true, aCondenser: 10, recemment: 13, possessions: 5, condensation: TRANCHE_DUE }
const LU_P1 = { ...LU_P0, recemment: 4 }
const LU_P2 = { ...LU_P1, aCondenser: 0, condensation: null }
const LU_P3 = { ...LU_P2, auparavant: false }
const luP4 = (possessions: number) => ({ ...LU_P3, possessions })

/**
 * LA CHAÎNE DES CANARIS — pour P0, P1, P2 puis P3, la longueur de saisie qui fait tenir SON
 * texte à `BUDGET_CARACTERES_NARRATEUR` caractères EXACTEMENT. On part d'une saisie courte (P0
 * tient) ; le socle du palier suivant se lit à la saisie `exacte + 1` du précédent, qui vient
 * d'y descendre. Ce que chaque saisie ATTEINT n'est pas supposé ici : chaque test l'asserte.
 */
function saisiesExactes(dossier: Dossier, session: EtatSession): readonly [number, number, number, number] {
	const exacte = (saisie: number): number =>
		BUDGET_CARACTERES_NARRATEUR - (rendu(aLaSaisie(dossier, session, saisie)).texte.length - saisie)
	const p0 = exacte(1)
	const p1 = exacte(p0 + 1)
	const p2 = exacte(p1 + 1)
	return [p0, p1, p2, exacte(p2 + 1)]
}

/** La saisie qui fait tenir P4 à `gardes` objets, à `BUDGET` EXACTEMENT : celle de P3, plus ce
 *  que coûtent les lignes d'inventaire écartées — chacune avec son saut de ligne, LUES dans le
 *  texte de P3. (Les rangs restent à un chiffre : une ligne gardée ne change pas de longueur ;
 *  chaque test qui s'en sert asserte la longueur obtenue.) */
function saisieExacteP4(dossier: Dossier, session: EtatSession, exacteP3: number, gardes: number): number {
	const lignes = blocsNarrateur(rendu(aLaSaisie(dossier, session, exacteP3)).texte).get('EN SA POSSESSION') ?? []
	return exacteP3 + lignes.slice(0, lignes.length - gardes).reduce((cout, ligne) => cout + ligne.length + 1, 0)
}

describe('assemblerNarrateur — la cascade de l it4 : P0 a P4, puis trop-long (AC#1 a AC#8)', () => {
	it('P0 inchange : sous budget, la fenetre entiere, la tranche due, le resume et tout l inventaire partent', () => {
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)

		const contexte = rendu(aLaSaisie(dossier, session, 1))

		expect(lecture(contexte)).toEqual(LU_P0)
		expect(contexte.texte.length).toBeLessThan(BUDGET_CARACTERES_NARRATEUR)
	})

	it('I6 — canari a un caractere pres a chaque frontiere de memoire : P0/P1, P1/P2, P2/P3', () => {
		// MUTANT « `<` au lieu de `<=` » — un texte de BUDGET caractères refusé — vérifié ROUGE.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const exactes = saisiesExactes(dossier, session)
		const paliers = [LU_P0, LU_P1, LU_P2, LU_P3]

		for (let rang = 0; rang < 3; rang += 1) {
			const juste = rendu(aLaSaisie(dossier, session, exactes[rang]))
			expect(`P${rang} → ${juste.texte.length}`).toBe(`P${rang} → ${BUDGET_CARACTERES_NARRATEUR}`)
			expect(lecture(juste)).toEqual(paliers[rang])
			expect(lecture(aLaSaisie(dossier, session, exactes[rang] + 1))).toEqual(paliers[rang + 1])
		}
	})

	it('I11 / AC#2 — canari a un caractere pres aux frontieres P3/P4, dans P4, et P4/trop-long — refus sans aucun appel', () => {
		// MUTANT « suffixe minimal jamais essayé » (`>` au lieu de `>=` sur la borne) — vérifié ROUGE.
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			const dossier = referenceDeCascade()
			const session = partieDeCascade(dossier, 34)
			const [, , , exacteP3] = saisiesExactes(dossier, session)

			// P3/P4 — l'inventaire ENTIER tient au caractère près ; un de plus, et le plus ancien part.
			const p3 = rendu(aLaSaisie(dossier, session, exacteP3))
			expect(p3.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
			expect(lecture(p3)).toEqual(LU_P3)
			expect(lecture(aLaSaisie(dossier, session, exacteP3 + 1))).toEqual(luP4(4))

			// DANS P4 — le PLUS LONG suffixe qui tient : quatre objets au caractère près, un de plus et trois.
			const quatre = rendu(aLaSaisie(dossier, session, saisieExacteP4(dossier, session, exacteP3, 4)))
			expect(quatre.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
			expect(lecture(quatre)).toEqual(luP4(4))
			expect(lecture(aLaSaisie(dossier, session, saisieExacteP4(dossier, session, exacteP3, 4) + 1))).toEqual(luP4(3))

			// P4/trop-long — le suffixe MINIMAL (l'objet du pas, seul) au caractère près ; un de plus, refus.
			const exacteMinimale = saisieExacteP4(dossier, session, exacteP3, 1)
			const minimal = rendu(aLaSaisie(dossier, session, exacteMinimale))
			expect(minimal.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
			expect(lecture(minimal)).toEqual(luP4(1))
			expect(aLaSaisie(dossier, session, exacteMinimale + 1)).toEqual({ ok: false, motif: 'trop-long' })
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})

	it('I1 / AC#3 — condensation rendue = tranche ENVOYEE : nulle des P2, alors que pasACondenser la dit due', () => {
		// MUTANT « rendre `pasACondenser(session)` à tout palier » — vérifié ROUGE : un `condense`
		// écrit sans la tranche serait accepté, et le pointeur avancerait sur dix pas jamais lus.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		expect(pasACondenser(session)).toEqual(TRANCHE_DUE)
		const [exacteP0, exacteP1, exacteP2, exacteP3] = saisiesExactes(dossier, session)

		// P1 : la tranche PART, et c'est ELLE — les dix pas 11-20, dans l'ordre.
		const p1 = rendu(aLaSaisie(dossier, session, exacteP0 + 1))
		expect(p1.condensation).toEqual(TRANCHE_DUE)
		expect(blocsNarrateur(p1.texte).get('A CONDENSER')).toEqual(
			Array.from({ length: 10 }, (_, rang) => `Vous veillez ${jetonDuPas(rang + 11)} au foyer.`),
		)
		// P2, P3, P4 : le bloc est retiré, et `condensation` le SUIT.
		for (const saisie of [exacteP1 + 1, exacteP2 + 1, exacteP3 + 1]) {
			const degrade = rendu(aLaSaisie(dossier, session, saisie))
			expect(blocsNarrateur(degrade.texte).has('A CONDENSER')).toBe(false)
			expect(degrade.condensation).toBeNull()
		}
	})

	it('I2 — pas 25 : la tranche ne part JAMAIS sans le resume qu elle prolonge, P2 la retire avant que P3 touche AUPARAVANT', () => {
		// MUTANT « P3 avant P2 » (le deuxième palier retire le résumé et garde la tranche) —
		// vérifié ROUGE : la tranche serait condensée en ÉCRASANT tout ce qui précède.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 25)
		const p0 = rendu(aLaSaisie(dossier, session, 1))
		// SCÉNARIO SÉPARATEUR, constaté : la fenêtre (21-24) est DÉJÀ au plancher, donc P1 ne
		// libère rien ; la tranche 11-20 est due ; le résumé existe.
		expect(lecture(p0)).toEqual({ ...LU_P0, recemment: 4 })
		const exacteP0 = BUDGET_CARACTERES_NARRATEUR - (p0.texte.length - 1)

		// UN caractère de trop — moins que ce que coûte `AUPARAVANT` : le mutant tiendrait en le retirant.
		const degrade = rendu(aLaSaisie(dossier, session, exacteP0 + 1))

		expect(lecture(degrade)).toEqual(LU_P2)
		expect(blocsNarrateur(degrade.texte).get('AUPARAVANT')).toEqual([RESUME_DE_CASCADE])
	})

	it('I3 — pas 34 : P1 passe AVANT P2, la fenetre se reduit et la tranche part encore', () => {
		// MUTANT « P2 d'abord » (le premier palier retire la tranche et garde la fenêtre) —
		// vérifié ROUGE : `condensation` tomberait à `null` pour un débordement d'un caractère.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const [exacteP0] = saisiesExactes(dossier, session)

		const p1 = rendu(aLaSaisie(dossier, session, exacteP0 + 1))

		expect(lecture(p1)).toEqual(LU_P1)
		expect(p1.condensation).toEqual(TRANCHE_DUE)
	})

	it('I4 — P1 garde les FENETRE_MIN - 1 lignes les PLUS RECENTES, pas en console compris ; une fenetre plus courte reste entiere', () => {
		// MUTANT « garder les plus anciennes » (`slice(0, 4)`) — vérifié ROUGE.
		expect(FENETRE_MIN - 1).toBe(4)
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34, { enConsole: [32] })
		const [exacteP0] = saisiesExactes(dossier, session)

		const p1 = rendu(aLaSaisie(dossier, session, exacteP0 + 1))

		// Le pas 32, joué en console, garde sa place sous le libellé de son geste — jamais un trou.
		expect(blocsNarrateur(p1.texte).get('RECEMMENT')).toEqual([
			`Vous veillez ${jetonDuPas(30)} au foyer.`,
			`Vous veillez ${jetonDuPas(31)} au foyer.`,
			COMMANDES.agir.label,
			`Vous veillez ${jetonDuPas(33)} au foyer.`,
		])

		// Au pas 4, la fenêtre n'a que TROIS lignes : aucun palier n'y touche, même quand la
		// cascade descend jusqu'à P4.
		const debut = partieDeCascade(dossier, 4)
		const socle = rendu(aLaSaisie(dossier, debut, 1)).texte.length - 1
		const p4 = rendu(aLaSaisie(dossier, debut, BUDGET_CARACTERES_NARRATEUR - socle + 1))
		expect(lecture(p4)).toEqual({ auparavant: false, aCondenser: 0, recemment: 3, possessions: 4, condensation: null })
		expect(blocsNarrateur(p4.texte).get('RECEMMENT')).toEqual(
			[1, 2, 3].map((pas) => `Vous veillez ${jetonDuPas(pas)} au foyer.`),
		)
	})

	it('I5 / AC#4 — de ICI A1 a la saisie, l etat et la table d ancres sont IDENTIQUES de P0 a P3, inventaire ENTIER', () => {
		// MUTANT « plafond appliqué dès P0 » (l'état composé sur un inventaire amputé) — vérifié
		// ROUGE. L'égalité entre paliers resterait verte sous ce mutant : c'est l'inventaire
		// ENTIER, asserté ligne à ligne, qui le voit.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const [exacteP0, exacteP1, exacteP2] = saisiesExactes(dossier, session)
		const paliers = [1, exacteP0 + 1, exacteP1 + 1, exacteP2 + 1].map((saisie) =>
			rendu(aLaSaisie(dossier, session, saisie)),
		)
		expect(paliers.map(lecture)).toEqual([LU_P0, LU_P1, LU_P2, LU_P3])

		const etat = (texte: string): string =>
			texte.slice(texte.indexOf('\n\nICI A1\n'), texte.lastIndexOf('\n\nsaisie\n'))
		const [p0, ...degrades] = paliers
		expect(etat(p0.texte).startsWith('\n\nICI A1\n')).toBe(true)
		for (const degrade of degrades) {
			expect(etat(degrade.texte)).toBe(etat(p0.texte))
			expect([...degrade.ancres.entries()]).toEqual([...p0.ancres.entries()])
		}
		// L'INVENTAIRE ENTIER : les cinq objets rédigés, l'amulette muette tue, la fiole au rang de CE PAS.
		expect(blocsNarrateur(p0.texte).get('EN SA POSSESSION')).toEqual([
			`A3 — ${proseDe(dossier, 'objet.sceau-de-cendre')}`,
			`A4 — ${proseDe(dossier, 'objet.lanterne-de-corvin')}`,
			`A5 — ${proseDe(dossier, 'objet.galet-de-riviere')}`,
			`A6 — ${proseDe(dossier, 'objet.corde-de-chanvre')}`,
			`A2 — ${proseDe(dossier, OBJET_DU_PAS)}`,
		])
	})

	it('I7 / I12 / AC#6 — rien n est ecrit ni rendu du palier : session intacte, cles fermees, a chaque palier et au refus', () => {
		// MUTANTS « un champ `palier` au retour » et « la session annotée en place » — vérifiés ROUGES.
		// L'EMPREINTE EST PRISE AVANT LE PREMIER ASSEMBLAGE, chaîne des canaris comprise : prise
		// après, elle contiendrait déjà l'annotation, et l'égalité resterait verte (mesuré).
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const avant = JSON.stringify(session)
		const [exacteP0, exacteP1, exacteP2, exacteP3] = saisiesExactes(dossier, session)

		const rendus = [1, exacteP0 + 1, exacteP1 + 1, exacteP2 + 1, exacteP3 + 1, BUDGET_CARACTERES_NARRATEUR].map(
			(saisie) => aLaSaisie(dossier, session, saisie),
		)

		expect(rendus.map(lecture)).toEqual([LU_P0, LU_P1, LU_P2, LU_P3, luP4(4), { refus: 'trop-long' }])
		expect(JSON.stringify(session)).toBe(avant)
		// AUCUN champ de palier, ni rien d'autre : les clés du retour sont celles de l'it3.
		expect(rendus.map((contexte) => Object.keys(contexte).sort())).toEqual([
			...Array.from({ length: 5 }, () => ['ancres', 'condensation', 'ok', 'texte']),
			['motif', 'ok'],
		])
		// RECALCULÉE À CHAQUE APPEL : après un P4 et un refus, la même session à saisie courte
		// rend P0 — aucun palier n'a survécu d'un appel à l'autre.
		expect(lecture(aLaSaisie(dossier, session, 1))).toEqual(LU_P0)
		expect(JSON.stringify(session)).toBe(avant)
	})

	it('I8 — P4 ecarte les objets les PLUS ANCIENS : l objet du pas, dernier acquis, reste toujours', () => {
		// MUTANT `slice(0, n)` (garder les plus anciens) — vérifié ROUGE : la fiole disparaîtrait.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const [, , , exacteP3] = saisiesExactes(dossier, session)
		const montres = (saisie: number): string[] =>
			(blocsNarrateur(rendu(aLaSaisie(dossier, session, saisie)).texte).get('EN SA POSSESSION') ?? []).map((ligne) =>
				ligne.replace(/^A\d+ — /, ''),
			)
		const proses = (ids: readonly string[]): string[] => ids.map((id) => proseDe(dossier, id))

		expect(montres(exacteP3 + 1)).toEqual(
			proses(['objet.lanterne-de-corvin', 'objet.galet-de-riviere', 'objet.corde-de-chanvre', OBJET_DU_PAS]),
		)
		expect(montres(saisieExacteP4(dossier, session, exacteP3, 4) + 1)).toEqual(
			proses(['objet.galet-de-riviere', 'objet.corde-de-chanvre', OBJET_DU_PAS]),
		)
		expect(montres(saisieExacteP4(dossier, session, exacteP3, 1))).toEqual(proses([OBJET_DU_PAS]))
	})

	it('I9 / AC#5 — jamais un bloc EN SA POSSESSION absent quand un objet redige est possede : trop-long a la place', () => {
		// MUTANT « accepter un suffixe vide » (plancher du suffixe à 0) — vérifié ROUGE : le
		// modèle lirait un héros les mains vides, que le moteur dément.
		// SCÉNARIO SÉPARATEUR : AUCUN objet donné à ce pas — seule la règle « jamais vide »
		// impose un objet gardé.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34, {
			inventaire: ['objet.sceau-de-cendre', 'objet.lanterne-de-corvin'],
			obtenus: [],
		})
		const [, , , exacteP3] = saisiesExactes(dossier, session)
		const exacteUn = saisieExacteP4(dossier, session, exacteP3, 1)

		const un = rendu(aLaSaisie(dossier, session, exacteUn))

		expect(un.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
		expect(blocsNarrateur(un.texte).get('EN SA POSSESSION')).toEqual([
			`A2 — ${proseDe(dossier, 'objet.lanterne-de-corvin')}`,
		])
		expect(aLaSaisie(dossier, session, exacteUn + 1)).toEqual({ ok: false, motif: 'trop-long' })
	})

	it('P4 degenere : un seul objet possede, celui du pas, ou aucun — rien a couper, trop-long juste apres P3', () => {
		const dossier = referenceDeCascade()
		for (const inventaire of [[OBJET_DU_PAS], []]) {
			const session = partieDeCascade(dossier, 34, { inventaire, obtenus: inventaire })
			const [, , , exacteP3] = saisiesExactes(dossier, session)

			const p3 = rendu(aLaSaisie(dossier, session, exacteP3))

			expect(p3.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
			// Un bloc ABSENT est légitime quand rien n'est possédé : zéro objet ne force aucun refus.
			expect(lecture(p3)).toEqual(luP4(inventaire.length))
			expect(aLaSaisie(dossier, session, exacteP3 + 1)).toEqual({ ok: false, motif: 'trop-long' })
		}
	})

	it('I10 — a P4, l objet du pas garde le MEME rang dans CE PAS et EN SA POSSESSION, et un objet ecarte n a AUCUN rang', () => {
		// Extension de « UN rang par identifiant » (plus haut) au palier P4. MUTANT « ancrer tout
		// l'inventaire avant de le couper » — vérifié ROUGE : on n'ancre pas ce qu'on ne montre pas.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const [, , , exacteP3] = saisiesExactes(dossier, session)
		const fiole = proseDe(dossier, OBJET_DU_PAS)
		const cas = [
			{
				gardes: 4,
				possessions: [
					`A3 — ${proseDe(dossier, 'objet.lanterne-de-corvin')}`,
					`A4 — ${proseDe(dossier, 'objet.galet-de-riviere')}`,
					`A5 — ${proseDe(dossier, 'objet.corde-de-chanvre')}`,
					`A2 — ${fiole}`,
				],
				ancres: [
					['A1', 'lieu.foyer-du-guet'],
					['A2', OBJET_DU_PAS],
					['A3', 'objet.lanterne-de-corvin'],
					['A4', 'objet.galet-de-riviere'],
					['A5', 'objet.corde-de-chanvre'],
				],
			},
			{
				gardes: 1,
				possessions: [`A2 — ${fiole}`],
				ancres: [
					['A1', 'lieu.foyer-du-guet'],
					['A2', OBJET_DU_PAS],
				],
			},
		]

		for (const { gardes, possessions, ancres } of cas) {
			const p4 = rendu(aLaSaisie(dossier, session, saisieExacteP4(dossier, session, exacteP3, gardes)))
			const blocs = blocsNarrateur(p4.texte)
			expect(blocs.get('CE PAS')).toEqual([COMMANDES.agir.label, `obtient A2 — ${fiole}`])
			expect(blocs.get('EN SA POSSESSION')).toEqual(possessions)
			expect([...p4.ancres.entries()]).toEqual(ancres)
		}
	})

	it('I10 / AC#5 — DEUX objets obtenus au meme pas : le suffixe minimal les garde TOUS LES DEUX, jamais un seul', () => {
		// MUTANT « suffixe minimal à un objet, quoi que CE PAS désigne » — vérifié ROUGE. Avec un
		// seul objet obtenu, il est à la fois le dernier et le seul désigné : ce mutant resterait
		// vert, c'est pourquoi le scénario en donne DEUX.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34, { obtenus: ['objet.corde-de-chanvre', OBJET_DU_PAS] })
		const [, , , exacteP3] = saisiesExactes(dossier, session)
		const corde = proseDe(dossier, 'objet.corde-de-chanvre')
		const fiole = proseDe(dossier, OBJET_DU_PAS)
		const exacteDeux = saisieExacteP4(dossier, session, exacteP3, 2)

		const deux = rendu(aLaSaisie(dossier, session, exacteDeux))

		expect(deux.texte).toHaveLength(BUDGET_CARACTERES_NARRATEUR)
		expect(blocsNarrateur(deux.texte).get('CE PAS')).toEqual([
			COMMANDES.agir.label,
			`obtient A2 — ${corde}`,
			`obtient A3 — ${fiole}`,
		])
		expect(blocsNarrateur(deux.texte).get('EN SA POSSESSION')).toEqual([`A2 — ${corde}`, `A3 — ${fiole}`])
		// Un caractère de plus : garder la fiole SEULE tiendrait, mais la corde que CE PAS vient
		// de raconter manquerait à ce qu'il a sur lui — une absence que le moteur dément. Refus.
		expect(aLaSaisie(dossier, session, exacteDeux + 1)).toEqual({ ok: false, motif: 'trop-long' })
	})

	it('AC#8 — ETABLI reste faitsPertinents ENTIER a tous les paliers, meme le fait d un objet que P4 ecarte ; aucun en-tete neuf', () => {
		// MUTANT « ETABLI retiré au dernier palier » — vérifié ROUGE.
		const dossier = referenceDeCascade()
		const session = partieDeCascade(dossier, 34)
		const [exacteP0, exacteP1, exacteP2, exacteP3] = saisiesExactes(dossier, session)
		// Discriminant : le fait du SCEAU est pertinent, et le sceau est le premier que P4 écarte.
		expect(faitsPertinents(session)).toEqual([FAIT_DU_FOYER, FAIT_DU_SCEAU])
		const enTetesPermis = new Set<string>([
			...CHAMPS_INJECTES_NARRATEUR.filter((chemin) => chemin.startsWith('canon.')),
			...EN_TETES_NARRATEUR,
		])

		const saisies = [
			1,
			exacteP0 + 1,
			exacteP1 + 1,
			exacteP2 + 1,
			exacteP3 + 1,
			saisieExacteP4(dossier, session, exacteP3, 1),
		]
		for (const saisie of saisies) {
			const blocs = blocsNarrateur(rendu(aLaSaisie(dossier, session, saisie)).texte)
			expect(blocs.get('ETABLI')).toEqual([FAIT_DU_FOYER.fait, FAIT_DU_SCEAU.fait])
			// KR-273 : aucun indicateur de palier n'est envoyé — pas un en-tête de plus.
			expect([...blocs.keys()].filter((enTete) => !enTetesPermis.has(enTete))).toEqual([])
		}
		const minimal = rendu(aLaSaisie(dossier, session, saisieExacteP4(dossier, session, exacteP3, 1))).texte
		expect(minimal).not.toContain(proseDe(dossier, 'objet.sceau-de-cendre'))
		expect(minimal).toContain(FAIT_DU_SCEAU.fait)
	})

	it('la place que libere chaque palier, MESUREE sur la memoire saturee du pire cas : P1, P2, P3, puis le plancher', () => {
		// REMESURÉ, jamais recopié du comité : l'écart de deux saisies exactes EST la place que
		// libère le palier, et chaque terme se dérive des bornes des validateurs.
		const { dossier, cible } = pireCasNarrateur(34)
		const sature = avecMemoireSaturee(cible.session)
		const [exacteP0, exacteP1, exacteP2, exacteP3] = saisiesExactes(dossier, sature)
		const ligneDePas = 1 + NARRATION_CARACTERES_MAX

		expect(exacteP1 - exacteP0).toBe((13 - 4) * ligneDePas)
		expect(exacteP2 - exacteP1).toBe(2 + 'A CONDENSER'.length + CADENCE * ligneDePas)
		expect(exacteP3 - exacteP2).toBe(2 + 'AUPARAVANT'.length + 1 + CONDENSE_CARACTERES_MAX)
		expect([exacteP1 - exacteP0, exacteP2 - exacteP1, exacteP3 - exacteP2]).toEqual([7209, 8023, 1213])

		// LE PLANCHER : ce qui reste de la mémoire à P3 — la fenêtre au plancher et les huit faits
		// —, contre le MÊME pire cas SANS mémoire.
		const socleSansMemoire = rendu(aLaSaisie(dossier, cible.session, 1)).texte.length - 1
		const plancher = BUDGET_CARACTERES_NARRATEUR - exacteP3 - socleSansMemoire
		expect(plancher).toBe(
			2 + 'RECEMMENT'.length + 4 * ligneDePas + (2 + 'ETABLI'.length + FAITS_INJECTES_MAX * (1 + FAIT_CARACTERES_MAX)),
		)
		expect(plancher).toBe(4511)
	})
})

// ══ PENDANT CE TEMPS, HORS CASCADE (n° 14 `moteur-horloge`, it2) ═════════════════════════════════
//
// Le bloc n'est NI un levier NI un invariant : aucun palier ne le retire, et il pèse dans le
// socle de chacun — le terme dossier de `BUDGET_CARACTERES_DOSSIER` le porte (ci-dessus).
describe('assemblerNarrateur — PENDANT CE TEMPS est HORS CASCADE : P0 à P4 le gardent, et trop-long ne le coupe pas', () => {
	it('chaque palier envoie la MEME ligne, avance (action) comme bloque (si_bloque), et le refus ne vient qu au-dela du suffixe minimal — sans aucun fetch', () => {
		const espionFetch = jest.fn()
		const avant = globalThis.fetch
		globalThis.fetch = espionFetch as unknown as typeof fetch
		try {
			// DEUX ÉTATS d'un même Harek au PAS COURANT (34), COMPOSÉS sur la partie jouée comme l'inventaire :
			// AVANCÉ (sa prose `action`, it2) puis BLOQUÉ (sa prose `si_bloque`, it3 — `depuis` 29 + `duree` 5).
			const cas: ReadonlyArray<readonly [string, Dossier, { rang: number; depuis: number }, string]> = [
				[
					'avance',
					referenceAvecPlans({ [HAREK]: planDeDeux(PROSE_HAREK) }, {}, referenceDeCascade()),
					{ rang: 1, depuis: 34 },
					PROSE_HAREK,
				],
				[
					'bloque',
					referenceAvecPlans(
						{
							[HAREK]: [
								etapeDePlan(0, PROSE_DE_DEPART),
								etapeDePlan(1, PROSE_HAREK, undefined, { duree: 5, si_bloque: PROSE_HAREK_BLOQUE }),
							],
						},
						{},
						referenceDeCascade(),
					),
					{ rang: 1, depuis: 29 },
					PROSE_HAREK_BLOQUE,
				],
			]
			for (const [nom, dossier, etape, ligne] of cas) {
				const session = avecEntreePnj(partieDeCascade(dossier, 34), HAREK, { a_dit: [], etape_plan: etape })
				const [exacteP0, exacteP1, exacteP2, exacteP3] = saisiesExactes(dossier, session)
				const exacteMinimale = saisieExacteP4(dossier, session, exacteP3, 1)
				// Chaque saisie ATTEINT son palier (lu dans le texte, jamais supposé) — sans quoi « le bloc
				// survit à P4 » serait vert sur un P0.
				const paliers: ReadonlyArray<readonly [number, ReturnType<typeof lecture>]> = [
					[1, LU_P0],
					[exacteP0 + 1, LU_P1],
					[exacteP1 + 1, LU_P2],
					[exacteP2 + 1, LU_P3],
					[exacteP3 + 1, luP4(4)],
					[exacteMinimale, luP4(1)],
				]

				for (const [saisie, attendu] of paliers) {
					const contexte = rendu(aLaSaisie(dossier, session, saisie))
					expect(`${nom} → ${JSON.stringify(lecture(contexte))}`).toBe(`${nom} → ${JSON.stringify(attendu)}`)
					expect(blocsNarrateur(contexte.texte).get(EN_TETE_PENDANT)).toEqual([ligne])
				}
				// Et il n'est PAS un invariant au sens de `trop-long` : un caractère de plus, le refus est le
				// MÊME qu'avant ce bloc — le bloc ne part pas pour faire tenir le reste.
				expect(aLaSaisie(dossier, session, exacteMinimale + 1)).toEqual({ ok: false, motif: 'trop-long' })
			}
			expect(espionFetch).not.toHaveBeenCalled()
		} finally {
			globalThis.fetch = avant
		}
	})
})

// ══ INVARIANCE R1/R3 A `heros` (n° 11 `moteur-arbitre`, it1) — KR-262 étendu ═══
//
// R2 (ARBITRE) N'EXISTE PAS ENCORE EN IT1 : ce que ce lot garantit ici, c'est que
// POSER `EtatSession.heros` NE FAIT RIEN BOUGER dans les deux assembleurs DÉJÀ
// existants (`interprete`, `narrateur`) — aucune caractéristique, aucune jauge,
// aucun XP n'entre JAMAIS dans un contexte de modèle (CLAUDE.md, « Audience avant
// injection »). Sans ce test, la seule garde serait la table d'audience
// (`sessionDestinations.ts`), qui garantit une INTENTION, jamais un COMPORTEMENT —
// même remarque que la tête de `sessionCouverture.test.ts`.
/** SENTINELLE délibérément NON DÉFAUT (raffinage it1, § 8 #7) : `name` n'est pas
 *  vide, aucune `caracs` n'est à 4 (la valeur de départ de `charCreation.ts`), et
 *  `pv`/`pe` diffèrent de leur plafond — un héros frais serait indistinguable d'un
 *  champ jamais lu. */
const HEROS_SENTINELLE: HeroState = {
	name: 'Aldric le Temeraire',
	caracs: { FO: 7, AG: 6, DX: 5, EN: 8, IN: 9, IG: 4, SE: 10, CA: 3 },
	pvMax: 21,
	pv: 14,
	peMax: 8,
	pe: 3,
	mcBonus: 0,
	xp: 12,
}

describe('heros — invariance de assemblerInterprete et assemblerNarrateur (n 11, it1)', () => {
	it('assemblerInterprete rend un contexte IDENTIQUE, session.heros present ou absent', () => {
		const dossier = dossierDeReference()
		const sansHeros = ouvertureNarrateur(dossier)
		const avecHeros = fixerHeros(sansHeros, HEROS_SENTINELLE)
		const saisie = 'je regarde autour de moi'

		const contexteSans = assemblerInterprete(dossier, { saisie, session: sansHeros })
		const contexteAvec = assemblerInterprete(dossier, { saisie, session: avecHeros })

		expect(contexteSans.ok).toBe(true)
		expect(contexteAvec).toEqual(contexteSans)
	})

	it('assemblerNarrateur rend un contexte IDENTIQUE, session.heros present ou absent', () => {
		const dossier = dossierDeReference()
		const sansHeros = ouvertureNarrateur(dossier)
		const avecHeros = fixerHeros(sansHeros, HEROS_SENTINELLE)

		const contexteSans = assemblerNarrateur(dossier, cibleNarrateur(sansHeros))
		const contexteAvec = assemblerNarrateur(dossier, cibleNarrateur(avecHeros))

		expect(contexteSans.ok).toBe(true)
		expect(contexteAvec).toEqual(contexteSans)
	})
})

/**
 * LE NEUVIÈME RÔLE — `arbitre` (n° 11 `moteur-arbitre`, lot `contrat`, it2, § 7 du
 * plan : « invariance héros + catalogue stable »).
 *
 * `CibleArbitre` N'A STRUCTURELLEMENT PAS de `session` (inatteignable par
 * compilation) : l'invariance héros n'a donc PAS BESOIN d'un test comportemental
 * comme pour `interprete`/`narrateur` — il n'existe tout simplement AUCUNE
 * variable `heros` à faire varier. Ce que ce bloc prouve à la place : le CATALOGUE
 * est STABLE (dérivé des deux registres fermés, jamais du dossier), et l'EXTENSION
 * du narrateur (la ligne de jet) ne fuite JAMAIS le héros ni les chiffres.
 */
describe('arbitre — catalogue stable, et son extension au narrateur (n 11, it2)', () => {
	function cibleArbitre(saisie: string, lieuId: string): CibleArbitre {
		return { role: 'arbitre', saisie, lieuId }
	}

	it('le bloc CATALOGUE est IDENTIQUE, quel que soit le lieu ou la saisie — CALCULE, jamais mesure du dossier', () => {
		const dossier = dossierDeReference()

		const contexteFoyer = assemblerArbitre(dossier, cibleArbitre('je force la porte', 'lieu.foyer-du-guet'))
		const contexteTour = assemblerArbitre(dossier, cibleArbitre('je fouille les gravats', 'lieu.tour-effondree'))
		if (!contexteFoyer.ok || !contexteTour.ok) throw new Error('contexte refusé, alors que le test en attend deux')

		const blocCatalogue = (texte: string): string => String(texte.match(/CATALOGUE\n[\s\S]*?(?=\n\n|$)/)?.[0])
		expect(blocCatalogue(contexteFoyer.texte)).not.toBe('undefined')
		expect(blocCatalogue(contexteTour.texte)).toBe(blocCatalogue(contexteFoyer.texte))
	})

	it('BUDGET_CARACTERES_ARBITRE existe et est strictement positif (parite avec BUDGET_CARACTERES_NARRATEUR)', () => {
		expect(BUDGET_CARACTERES_ARBITRE).toBeGreaterThan(0)
	})

	describe('assemblerNarrateur — la ligne de jet (n 11, it2 puis it3 : classe reussit_nettement)', () => {
		function heroAvec(nom: string, caracs: Partial<HeroState['caracs']>): HeroState {
			return { ...HEROS_SENTINELLE, name: nom, caracs: { ...HEROS_SENTINELLE.caracs, ...caracs } }
		}

		/** `FO` au PLAFOND (12) contre `TC1` (1D6, max 6) : succès GARANTI quel que
		 *  soit le tirage réel — aucune hypothèse sur la graine. */
		function sessionEnReussiteGarantie(dossier: Dossier, heros: HeroState): EtatSession {
			const depart = ouvertureNarrateur(dossier)
			const apresAgir = jouerNarrateur(dossier, depart, ['AGIR'])
			return consignerJet(fixerHeros(apresAgir, heros), apresAgir.horloge.tour, { carac: 'FO', tc: 'TC1' })
		}

		/** `SE` AU PLANCHER (1) contre `TC4` (4D4, min 4) : échec GARANTI, même motif. */
		function sessionEnEchecGaranti(dossier: Dossier, heros: HeroState): EtatSession {
			const depart = ouvertureNarrateur(dossier)
			const apresAgir = jouerNarrateur(dossier, depart, ['AGIR'])
			return consignerJet(fixerHeros(apresAgir, heros), apresAgir.horloge.tour, { carac: 'SE', tc: 'TC4' })
		}

		const EPREUVE = { enjeu_reussite: 'forcer la porte sans bruit', enjeu_echec: 'alerter ce qui veille derriere' }

		it('deux heros de MEME issue (reussit nettement, FO 12 contre TC1) donnent un texte R3 IDENTIQUE', () => {
			const dossier = dossierDeReference()
			const heroA = heroAvec('Aldric', { FO: 12 })
			const heroB = heroAvec('Brune la Rapide', { FO: 12, AG: 1, DX: 1 })

			const sessionA = sessionEnReussiteGarantie(dossier, heroA)
			const sessionB = sessionEnReussiteGarantie(dossier, heroB)

			const contexteA = assemblerNarrateur(dossier, { ...cibleNarrateur(sessionA), epreuve: EPREUVE })
			const contexteB = assemblerNarrateur(dossier, { ...cibleNarrateur(sessionB), epreuve: EPREUVE })
			if (!contexteA.ok || !contexteB.ok) throw new Error('contexte refusé, alors que le test en attend deux')

			// FO=12 contre TC1 (1D6) : marge >= 6, toujours >= MARGE_FRANCHE (3) ->
			// classe QUALITATIVE 'reussit_nettement' depuis it3 (jamais 'reussit' nu).
			expect(contexteA.texte).toContain(`réussit nettement — ${EPREUVE.enjeu_reussite}`)
			expect(contexteB).toEqual(contexteA)
			// Discriminant : les deux héros sont RÉELLEMENT distincts — sans lui,
			// l'égalité ci-dessus serait vraie par construction.
			expect(heroA).not.toEqual(heroB)
		})

		it('deux issues DIFFERENTES ne changent QUE la ligne d amorce — le reste du texte est identique', () => {
			const dossier = dossierDeReference()
			const heroReussite = heroAvec('Aldric', { FO: 12 })
			const heroEchec = heroAvec('Aldric', { SE: 1 })

			const sessionReussite = sessionEnReussiteGarantie(dossier, heroReussite)
			const sessionEchec = sessionEnEchecGaranti(dossier, heroEchec)

			const contexteReussite = assemblerNarrateur(dossier, { ...cibleNarrateur(sessionReussite), epreuve: EPREUVE })
			const contexteEchec = assemblerNarrateur(dossier, { ...cibleNarrateur(sessionEchec), epreuve: EPREUVE })
			if (!contexteReussite.ok || !contexteEchec.ok)
				throw new Error('contexte refusé, alors que le test en attend deux')

			// FO=12 contre TC1 : marge garantie >= MARGE_FRANCHE -> 'reussit_nettement'.
			const ligneReussite = `réussit nettement — ${EPREUVE.enjeu_reussite}`
			const ligneEchec = `échoue — ${EPREUVE.enjeu_echec}`
			expect(contexteReussite.texte).toContain(ligneReussite)
			expect(contexteEchec.texte).toContain(ligneEchec)

			// Remplacer la ligne de jet par le MÊME jeton rend les deux textes égaux :
			// c'est la preuve que RIEN D'AUTRE n'a changé entre les deux issues.
			const sansLigneReussite = contexteReussite.texte.replace(ligneReussite, 'LIGNE-DE-JET')
			const sansLigneEchec = contexteEchec.texte.replace(ligneEchec, 'LIGNE-DE-JET')
			expect(sansLigneEchec).toBe(sansLigneReussite)
		})

		it('ligneDeJet : reussit_nettement choisit enjeu_reussite, JAMAIS enjeu_echec (regression ligne 517)', () => {
			// CONTRE-EPREUVE DU BUG DE RAFFINAGE it3 (§ 8 desaccord 5 du plan) : un
			// aiguillage fautif sur `issue === 'reussit'` ferait tomber la classe
			// 'reussit_nettement' dans la branche ECHEC, puisque 'reussit_nettement' !==
			// 'reussit'. FO=12 contre TC1 garantit 'reussit_nettement' (marge >= 6 >=
			// MARGE_FRANCHE) — ce test rougirait sous la version fautive (verifie en
			// relisant narrateur.ts AVANT la correction de ce lot, pas seulement apres).
			const dossier = dossierDeReference()
			const hero = heroAvec('Aldric', { FO: 12 })
			const session = sessionEnReussiteGarantie(dossier, hero)

			const contexte = assemblerNarrateur(dossier, { ...cibleNarrateur(session), epreuve: EPREUVE })
			if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif})`)

			expect(contexte.texte).toContain(`réussit nettement — ${EPREUVE.enjeu_reussite}`)
			expect(contexte.texte).not.toContain(`réussit nettement — ${EPREUVE.enjeu_echec}`)
			expect(contexte.texte).not.toContain(EPREUVE.enjeu_echec)
		})

		it('AMORCE_ISSUE : aucune des trois valeurs ne porte de chiffre ni de 2e personne (KR-262/269)', () => {
			// `Record<IssueEpreuve, string>` est EXHAUSTIF PAR COMPILATION : un
			// quatrieme membre ajoute demain a IssueEpreuve sans entree ici ne
			// compilerait plus narrateur.ts — cette liste ne peut pas se perimer.
			expect(Object.keys(AMORCE_ISSUE).sort()).toEqual(['echoue', 'reussit', 'reussit_nettement'])
			for (const amorce of Object.values(AMORCE_ISSUE)) {
				expect(amorce).not.toMatch(/\d/)
				expect(amorce.toLowerCase()).not.toContain('vous')
			}
			// Aucun qualificatif « de justesse » sur la classe mediane (§ 3 du plan it3).
			expect(AMORCE_ISSUE.reussit).toBe('réussit')
		})

		it('un heros nomme SENTINELLE-HEROS ne fuite JAMAIS, meme avec une epreuve resolue', () => {
			const dossier = dossierDeReference()
			const sentinelle = heroAvec('SENTINELLE-HEROS', { FO: 12 })

			const session = sessionEnReussiteGarantie(dossier, sentinelle)
			const contexte = assemblerNarrateur(dossier, { ...cibleNarrateur(session), epreuve: EPREUVE })
			if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif})`)

			expect(contexte.texte).not.toContain('SENTINELLE-HEROS')
			// Ni le TIER ni la CARACTÉRISTIQUE choisis par R2 ne sont écrits : R3 ne
			// reçoit jamais les chiffres du jet, ni `carac`, ni `tc` (§ 1 du plan it2).
			expect(contexte.texte).not.toContain('TC1')
		})

		it('sans epreuve (cible.epreuve absent), aucune ligne de jet — comportement INCHANGE depuis it1', () => {
			const dossier = dossierDeReference()
			const depart = ouvertureNarrateur(dossier)
			const apresAgir = jouerNarrateur(dossier, depart, ['AGIR'])

			const contexte = assemblerNarrateur(dossier, cibleNarrateur(apresAgir))
			if (!contexte.ok) throw new Error(`contexte refusé (${contexte.motif})`)

			expect(contexte.texte).toContain('aucun changement')
			expect(contexte.texte).not.toContain('réussit —')
			expect(contexte.texte).not.toContain('échoue —')
		})
	})
})
