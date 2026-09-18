import fs from 'node:fs'
import path from 'node:path'
import { MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import { DESTINATION_DES_CHAMPS } from '../dossier/destinations'
import { feuillesDeLaFixture } from '../dossier/feuilles'
import { LIBELLE_DES_CHAMPS } from '../dossier/libelles'
import { CERTITUDE_INITIALE, type Dossier, type Personnage, type Portee } from '../dossier/types'
import { controlerDossier } from '../dossier/controles'
import type { CibleCopilote, CibleIndice, CiblePlan, CibleRepliques } from '../CopiloteService'
import {
	assemblerDetenteurs,
	assemblerPlan,
	assemblerProse,
	assemblerRepliques,
	BUDGET_CARACTERES_CONTEXTE,
	CANDIDATS_MAX,
	CHAMPS_INJECTES,
	DEROGATIONS_AUDIENCE,
	PARTIES_REQUISES,
} from './contexte'
import { CHAMPS_PROPOSABLES, type ChampProseChemin } from './types'

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
	return { entiteId, champ }
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
		cible: { indiceId: indiceCible.id },
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
			expect(assemblerDetenteurs(reference, { indiceId: String(nu?.id) })).toEqual({
				ok: false,
				motif: 'cible-a-ecrire',
			})
			// Une cible qui ne résout plus du tout emprunte le MÊME refus : « pas de
			// vérité écrite » et « plus d'indice du tout » demandent le même geste.
			expect(assemblerDetenteurs(dossier, { indiceId: 'indice.jamais-existe' })).toEqual({
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
				assemblerDetenteurs(reference, { indiceId: String(nu?.id) }),
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
		expect(assemblerDetenteurs(reference, { indiceId: cibleId })).toEqual({ ok: false, motif: 'cible-a-ecrire' })
		expect(assemblerDetenteurs(clone, { indiceId: cibleId }).ok).toBe(true)
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
	return { personnageId }
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
		// Discriminant : le balayage voit bien les QUATRE entrées — sans lui, un registre
		// vide le rendrait vert (KR-199).
		expect(Object.keys(CHAMPS_INJECTES)).toHaveLength(4)
	})

	it('aucun chemin caractere.curseurs.* nulle part', () => {
		// GARDE DU VETO : les six curseurs ne sont ni injectés, ni proposables. Balayage
		// sur TOUTES les entrées, même motif que ci-dessus.
		const fautifs = Object.entries(CHAMPS_INJECTES).flatMap(([role, chemins]) =>
			chemins.filter((chemin) => chemin.includes('curseurs')).map((chemin) => `${role} → ${chemin}`),
		)

		expect(fautifs).toEqual([])
		expect(Object.keys(CHAMPS_INJECTES)).toHaveLength(4)
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
	return { acteurId }
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
