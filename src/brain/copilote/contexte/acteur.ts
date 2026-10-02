/**
 * L'ASSEMBLEUR DU DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1, lot
 * `contrat`).
 *
 * Il compose ce qu'UN PNJ interpellé voit pour répondre dans sa propre voix —
 * strictement scopé à CE personnage : jamais la fiche d'un autre, jamais un
 * chiffre de jeu, jamais aucun savoir en it1 (`savoirs[]`, `revele_si` —
 * mécanisme inexistant avant it2), AUCUNE relation (`relations[]`, même du
 * porteur) ni `cede_si` — ces deux derniers champs n'ont pas de mécanisme
 * consommateur avant une itération ultérieure (KR-268/285, résolu décisions
 * du raffinage it1, § 8 #7).
 *
 * CE QU'IL INJECTE, dans cet ordre, séparé par une ligne vide :
 *  1. le CANON — `canon.ton`, `canon.interdits_ton[]`, chacun QUAND ÉCRIT
 *     (précédent des neuf rôles) ;
 *  2. `TOI` — l'identité du PNJ, `fonction` PUIS `apparence` (`identiteDe`),
 *     REQUISE : sans au moins une ligne, refus `cible-a-ecrire` AVANT tout
 *     `fetch` ;
 *  3. `TA VOIX` — `caractere.parler[]`, au plus `PARLER_REPLIQUES` rédigées
 *     (même borne d'INTERFACE que l'éditeur, `dossier/curseurs.ts` — un bloc
 *     qui en porte davantage se tronque à l'INJECTION, il n'échoue jamais,
 *     précédent `Caractere.parler`) ;
 *  4. `ETABLI` — les faits ancrés sur le LIEU COURANT SEULEMENT (jamais les
 *     objets possédés, à la différence de `faitsPertinents` du narrateur : un
 *     PNJ ne sait pas ce que le héros porte sur lui), au plus
 *     `FAITS_INJECTES_MAX` ;
 *  5. `TU AS DIT` — le `recit` des `MEMOIRE_PARLER_MAX` dernières entrées
 *     `{origine:'parler', interlocuteur: CE PNJ, tour < tour courant, recit
 *     défini}`, chronologique — JAMAIS celles d'un autre PNJ (KR-282 étendu) ;
 *  6. `ICI` — `description` puis `ambiance` du lieu courant, silence si
 *     absentes (contrairement au narrateur, cette ligne n'est jamais requise) ;
 *  7. `JAMAIS` — `caractere.jamais`, silence si absent ;
 *  8. `saisie` — EN DERNIER, normalisée, bornée par `SAISIE_CARACTERES_MAX`
 *     (réutilisée de `./interprete`, MÊME saisie du joueur déjà passée par la
 *     garde de R1).
 *
 * CE QUI N'ENTRE JAMAIS EN IT1 : `nom`/tout identifiant brut, `stats`/
 * `curseurs`/`camp`/`portee`/`objectif_id`, `description_joueur`/`but.*`,
 * `plan_actions[]`/`contre_mesures[]`, `savoirs[]`, **toutes** les
 * `relations[]` (y compris du porteur) et `cede_si`, les autres PNJ,
 * l'inventaire, `heros.*`, `indices_connus`, le résumé `AUPARAVANT`, les
 * récits de R3, `journal[].texte`, les saisies passées, `synopsis_mj`.
 *
 * REFUS, AVANT tout `fetch`, dans cet ORDRE (§ 4 bis du plan) :
 *   `cible-a-ecrire` — le PNJ ne résout pas, ou ni `fonction` ni `apparence`
 *     n'est rédigée (ou marquée) ;
 *   `trop-long` — la saisie dépasse `SAISIE_CARACTERES_MAX`, ou le texte
 *     assemblé dépasse `BUDGET_CARACTERES_ACTEUR`. REFUS, JAMAIS DE
 *     TRONCATURE, JAMAIS DE CASCADE en it1 (contrairement au narrateur, it4) —
 *     le squelette le plus fin n'a pas à porter une seconde capacité de
 *     dégradation.
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` SONT INATTEIGNABLES ICI, ET C'EST
 * DÉLIBÉRÉ : aucun champ du canon n'est requis, et ce rôle n'a aucun ensemble
 * de candidats à épuiser — les écrire serait du code mort présenté comme de la
 * couverture (KR-235).
 */
import { PARLER_REPLIQUES } from '../../dossier/curseurs'
import { FAITS_INJECTES_MAX } from '../../dossier/memoire'
import type { EtatSession } from '../../dossier/session'
import type { Dossier, Personnage } from '../../dossier/types'
import { FAIT_CARACTERES_MAX, REPLIQUE_CARACTERES_MAX } from '../schemaSortie'
import { PREFIXE_PERSONNAGE, textesRediges, type MotifRefusContexte } from './noyau'
import { SAISIE_CARACTERES_MAX } from './interprete'

const EN_TETE_TOI = 'TOI'
const EN_TETE_VOIX = 'TA VOIX'
const EN_TETE_ETABLI = 'ETABLI'
const EN_TETE_DIT = 'TU AS DIT'
const EN_TETE_ICI = 'ICI'
const EN_TETE_JAMAIS = 'JAMAIS'
const EN_TETE_SAISIE = 'saisie'
const SEPARATEUR_DE_BLOCS = '\n\n'

const CHEMIN_FONCTION = 'monde.personnages[].fonction'
const CHEMIN_APPARENCE = 'monde.personnages[].apparence'
const CHEMIN_PARLER = 'monde.personnages[].caractere.parler[]'
const CHEMIN_JAMAIS = 'monde.personnages[].caractere.jamais'
const PREFIXE_LIEU = 'monde.lieux[].'
const CHEMIN_DESCRIPTION_LIEU = 'monde.lieux[].description'
const CHEMIN_AMBIANCE_LIEU = 'monde.lieux[].ambiance'
const CHEMINS_DU_CANON = ['canon.ton', 'canon.interdits_ton[]'] as const

/**
 * LA FENÊTRE DE MÉMOIRE PROPRE À L'ACTEUR — K=4, VALEUR DE DÉCISION du
 * raffinage (§ 4 bis du plan it1), DISTINCTE de `PARLER_REPLIQUES` (borne
 * d'ÉCRITURE du document, `dossier/curseurs.ts`) et de `FENETRE_MIN`/
 * `FAITS_INJECTES_MAX` (mémoire du NARRATEUR, `dossier/memoire.ts`) : un PNJ
 * ne relit que SES PROPRES dernières répliques, jamais le journal entier.
 */
export const MEMOIRE_PARLER_MAX = 4

/** Pousse un bloc SEULEMENT s'il a au moins une ligne — jamais un bloc vide
 *  (précédent `narrateur.ts`/`arbitre.ts`/`interprete.ts`). */
function pousser(blocs: string[], enTete: string, lignes: readonly string[]): void {
	if (lignes.length > 0) blocs.push(`${enTete}\n${lignes.join('\n')}`)
}

/**
 * `identiteDe` — `fonction` PUIS `apparence`, les deux prêtes à s'assembler
 * SOUS un en-tête UNIQUE `TOI` : les deux proses se discriminent par leur
 * CONTENU (ce que le personnage EST, ce qu'on en VOIT), jamais par une ligne
 * séparée — R4 n'a besoin que de SAVOIR qui il est, pas de distinguer leur
 * provenance.
 */
function identiteDe(personnage: Personnage): string[] {
	return [
		...textesRediges(personnage, CHEMIN_FONCTION, PREFIXE_PERSONNAGE),
		...textesRediges(personnage, CHEMIN_APPARENCE, PREFIXE_PERSONNAGE),
	]
}

/**
 * Les `MEMOIRE_PARLER_MAX` DERNIÈRES répliques DE CE PNJ, chronologique —
 * jamais celles d'un autre (KR-282 étendu, prouvé par `contexte/acteur.test.ts`).
 * `tour < session.horloge.tour` exclut explicitement l'entrée du pas COURANT
 * (déjà exclue en pratique par `recit !== undefined`, puisque `parler` n'a pas
 * encore reçu de réponse à l'instant de l'assemblage — les deux conditions sont
 * écrites, aucune n'est laissée implicite).
 */
function repliquesPassees(session: EtatSession, personnageId: string): string[] {
	const passees = session.journal.filter(
		(entree) =>
			entree.origine === 'parler' &&
			entree.interlocuteur === personnageId &&
			entree.tour < session.horloge.tour &&
			entree.recit !== undefined,
	)
	return passees.slice(-MEMOIRE_PARLER_MAX).map((entree) => entree.recit as string)
}

/**
 * Les faits ancrés sur le LIEU COURANT SEULEMENT — jamais les objets possédés :
 * un PNJ ne sait pas ce que le héros porte sur lui (distinct de
 * `faitsPertinents` du narrateur, `dossier/memoire.ts`, qui inclut aussi
 * l'inventaire — § 4 bis du plan : « ETABLI : faits ancrés sur le lieu courant
 * SEULEMENT »).
 */
function faitsDuLieu(session: EtatSession): string[] {
	const faits = session.memoire?.faits_etablis ?? []
	return faits
		.filter((fait) => fait.sur.includes(session.monde.lieu_courant))
		.slice(-FAITS_INJECTES_MAX)
		.map((fait) => fait.fait)
}

function coutDUnBlocPlein(enTete: string, lignes: number, largeur: number): number {
	return SEPARATEUR_DE_BLOCS.length + enTete.length + lignes * (1 + largeur)
}

/**
 * LA BORNE DU TERME MÉMOIRE, EN CARACTÈRES — CALCULÉE, jamais mesurée : `ETABLI`
 * (`FAITS_INJECTES_MAX` lignes de `FAIT_CARACTERES_MAX`) et `TU AS DIT`
 * (`MEMOIRE_PARLER_MAX` lignes de `REPLIQUE_CARACTERES_MAX`), chacun borné par
 * un VALIDATEUR ou une constante de registre, jamais par une mesure de fixture
 * (même doctrine que `BORNE_MEMOIRE`, `contexte/narrateur.ts`).
 */
export const BORNE_MEMOIRE_ACTEUR =
	coutDUnBlocPlein(EN_TETE_ETABLI, FAITS_INJECTES_MAX, FAIT_CARACTERES_MAX) +
	coutDUnBlocPlein(EN_TETE_DIT, MEMOIRE_PARLER_MAX, REPLIQUE_CARACTERES_MAX)

/** LA BORNE DU TERME SAISIE, EN CARACTÈRES — CALCULÉE EXACTEMENT, même formule
 *  que les deux blocs de mémoire : le séparateur qui précède, l'en-tête, puis
 *  la saisie à son maximum. */
export const BORNE_SAISIE_ACTEUR = coutDUnBlocPlein(EN_TETE_SAISIE, 1, SAISIE_CARACTERES_MAX)

/**
 * LA BORNE DU TERME DOSSIER (canon + `TOI` + `TA VOIX` + `ICI` + `JAMAIS`), EN
 * CARACTÈRES — MESURÉE sur `dossier-reference.json` (Harek, pire cas), puis
 * MAJORÉE ×3 (même marge que `BUDGET_CARACTERES_DOSSIER_ARBITRE` — la prose
 * d'auteur n'est pas bornée, KR-203).
 *
 * MESURE DU 2026-10-02 (it1), PIRE CAS SUR LA COMBINATOIRE RÉELLE (chaque lieu
 * croisé avec chaque personnage de `dossier-reference.json`, assemblé via
 * `assemblerActeur` lui-même, saisie vide) : le pire cas est `lieu.foyer-du-guet`
 * / `pnj.corvin-le-marchand` — `canon.ton` (14 car.), `canon.interdits_ton[]`
 * (2 lignes, 35 car.), `TOI` de Corvin (`fonction` 140 + `apparence` 146 car.),
 * `TA VOIX` de Corvin (seule fiche à porter `caractere.parler`, 1 réplique sous
 * `PARLER_REPLIQUES`, 64 car.), `ICI` du Foyer du Guet (`description` 153 +
 * `ambiance` 79 car.), `JAMAIS` de Corvin (83 car.). Texte assemblé, en-têtes et
 * séparateurs internes compris, SAISIE EXCLUE (comptée à part, `BORNE_SAISIE_ACTEUR`) :
 * M = 781. `ceil(781 × 3 / 1000) × 1000` = 3000.
 */
const BUDGET_CARACTERES_DOSSIER_ACTEUR = 3000

/**
 * LA BORNE DU CONTEXTE, EN CARACTÈRES (`String.length`) — AU-DELÀ, `'trop-long'`
 * AVANT tout `fetch`, jamais une coupe dans une prose, jamais de cascade en it1
 * (contrairement au narrateur, it4). TROIS TERMES, et ils ne se traitent pas
 * pareil : le terme DOSSIER, MESURÉ puis majoré (×3,
 * `BUDGET_CARACTERES_DOSSIER_ACTEUR`) ; le terme MÉMOIRE, CALCULÉ exactement
 * (`BORNE_MEMOIRE_ACTEUR`) ; le terme SAISIE, CALCULÉ exactement
 * (`BORNE_SAISIE_ACTEUR`).
 *
 * Exportée par `./index.ts` pour `worker/frontiere.test.ts` SEULEMENT — jamais
 * par `brain/index.ts` : aucune feature n'assemble un contexte elle-même.
 */
export const BUDGET_CARACTERES_ACTEUR = BUDGET_CARACTERES_DOSSIER_ACTEUR + BORNE_MEMOIRE_ACTEUR + BORNE_SAISIE_ACTEUR

export type ContexteActeur =
	| { readonly ok: true; readonly texte: string }
	| ({ readonly ok: false } & MotifRefusContexte)

/**
 * L'ASSEMBLEUR — voir la docstring de tête pour l'ordre des blocs et des refus.
 * SIGNATURE FIGÉE au § 4 du plan d'itération : quatre paramètres positionnels,
 * jamais une `CibleActeur` passée telle quelle — c'est `CopiloteService.ts` qui
 * destructure `cible` à l'appel.
 */
export function assemblerActeur(
	dossier: Dossier,
	session: EtatSession,
	personnageId: string,
	saisie: string,
): ContexteActeur {
	if (saisie.length > SAISIE_CARACTERES_MAX) return { ok: false, motif: 'trop-long' }

	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === personnageId)
	if (personnage === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	const identite = identiteDe(personnage)
	if (identite.length === 0) return { ok: false, motif: 'cible-a-ecrire' }

	const blocs: string[] = []

	// ── LE CANON, global, optionnel ──────────────────────────────────────────
	for (const chemin of CHEMINS_DU_CANON) pousser(blocs, chemin, textesRediges(dossier, chemin, ''))

	// ── TOI — l'identité du PNJ, REQUISE (déjà vérifiée ci-dessus) ───────────
	pousser(blocs, EN_TETE_TOI, identite)

	// ── TA VOIX — au plus PARLER_REPLIQUES rédigées ──────────────────────────
	const voix = textesRediges(personnage, CHEMIN_PARLER, PREFIXE_PERSONNAGE).slice(0, PARLER_REPLIQUES)
	pousser(blocs, EN_TETE_VOIX, voix)

	// ── ETABLI — faits ancrés sur le lieu courant SEULEMENT ──────────────────
	pousser(blocs, EN_TETE_ETABLI, faitsDuLieu(session))

	// ── TU AS DIT — mémoire PROPRE à ce PNJ, K=4 ─────────────────────────────
	pousser(blocs, EN_TETE_DIT, repliquesPassees(session, personnageId))

	// ── ICI — description puis ambiance du lieu courant, silence si absentes ─
	const lieu = dossier.monde.lieux.find((candidat) => candidat.id === session.monde.lieu_courant)
	const ici =
		lieu === undefined
			? []
			: [
					...textesRediges(lieu, CHEMIN_DESCRIPTION_LIEU, PREFIXE_LIEU),
					...textesRediges(lieu, CHEMIN_AMBIANCE_LIEU, PREFIXE_LIEU),
				]
	pousser(blocs, EN_TETE_ICI, ici)

	// ── JAMAIS — silence si absent ────────────────────────────────────────────
	pousser(blocs, EN_TETE_JAMAIS, textesRediges(personnage, CHEMIN_JAMAIS, PREFIXE_PERSONNAGE))

	// ── LA SAISIE, EN DERNIER, normalisée ────────────────────────────────────
	const saisieNormalisee = saisie.trim().replace(/\s+/g, ' ')
	blocs.push(`${EN_TETE_SAISIE}\n${saisieNormalisee}`)

	const texte = blocs.join(SEPARATEUR_DE_BLOCS)
	// On refuse, on ne coupe pas (KR-230).
	if (texte.length > BUDGET_CARACTERES_ACTEUR) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte }
}
