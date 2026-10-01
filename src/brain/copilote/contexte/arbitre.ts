/**
 * L'ASSEMBLEUR DU NEUVIÈME RÔLE — `arbitre` (n° 11 `moteur-arbitre`, it2).
 *
 * Il compose ce que R2 VOIT pour choisir `{carac, tc, enjeu_reussite,
 * enjeu_echec}` À L'AVEUGLE de la fiche du héros : jamais `heros.*`, jamais la
 * mémoire, jamais un identifiant du dossier (`CibleArbitre` n'a d'ailleurs AUCUN
 * accès à `EtatSession` — inatteignable par compilation).
 *
 * ⚠ COMME `interprete` ET `narrateur`, CE RÔLE NE PASSE PAS PAR `./registres.ts` :
 * ces registres sont `Record<RoleCopilote, …>`, et `RoleCopilote` n'est pas étendu
 * aux rôles de JEU. Ce module porte donc SA liste de chemins et SA borne
 * (`BUDGET_CARACTERES_ARBITRE`), hors de la parité auteur de
 * `worker/frontiere.test.ts` — la MÊME DOCTRINE pour autant : jamais une prose
 * coupée, silence sur un champ non rédigé plutôt qu'une affirmation, refus AVANT
 * tout `fetch`.
 *
 * CE QU'IL INJECTE, dans cet ordre, séparé par une ligne vide :
 *  1. le CANON — `canon.ton`, `canon.interdits_ton[]`, chacun QUAND ÉCRIT,
 *     préfixé par son chemin (précédent narrateur/interprète) ;
 *  2. `ICI` — la `description` du lieu courant (REQUISE : sans elle, R2 choisirait
 *     à l'aveugle d'un lieu, refus `cible-a-ecrire`), puis `dangers` (OPTIONNEL :
 *     absent veut dire AUCUNE ligne, ni refus ni texte de remplacement — **ouvert**
 *     à ce rôle, § 4 bis du plan it2 ; reste **fermé** pour R3/narrateur) ;
 *  3. `CATALOGUE` — DÉRIVÉ des deux registres fermés `CHARACTERISTICS`/
 *     `CHALLENGE_TIERS`, JAMAIS écrit dans l'invite (`worker/index.ts` n'importe
 *     rien de `brain/`) : 8 lignes `<code> — <label> : <describe>`, puis 4 lignes
 *     `<code> — <difficulty>`. **Jamais** la notation des dés, **jamais**
 *     `baseXp` : la difficulté se choisit par la fiction, jamais par la
 *     probabilité (§ 8 #14 du plan it2) ;
 *  4. `saisie` — EN DERNIER, normalisée (`trim` puis espaces collapsés), bornée
 *     par `SAISIE_CARACTERES_MAX` — RÉUTILISÉE de `./interprete`, sans seconde
 *     constante : c'est la MÊME saisie du joueur, déjà passée par la garde de R1
 *     au même pas.
 *
 * CE QUI N'ENTRE JAMAIS : `heros.*` (inatteignable par le TYPE de la cible),
 * `AUPARAVANT`/`RECEMMENT`/`ETABLI` (aucune mémoire pour ce rôle), `attente`,
 * `Entite.nom` (KR-262), tout identifiant, les autres lieux, `synopsis_mj`.
 *
 * REFUS, AVANT tout `fetch`, dans cet ordre :
 *   `cible-a-ecrire` — le lieu ne résout pas, ou sa `description` est absente ou
 *     marquée : proposer un jet sans scène reviendrait à inventer le lieu ;
 *   `trop-long` — le texte assemblé dépasse `BUDGET_CARACTERES_ARBITRE`.
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES ici, et c'est délibéré :
 * aucun champ du canon n'est requis, et ce rôle n'a aucun ensemble à épuiser —
 * les écrire serait du code mort présenté comme de la couverture (KR-235).
 */
import { CHALLENGE_TIERS, CHALLENGE_TIER_VALUES } from '../../challenge'
import { CHARACTERISTICS, CHARACTERISTIC_VALUES } from '../../characteristics'
import type { Dossier } from '../../dossier/types'
import type { CibleArbitre } from '../types'
import { SAISIE_CARACTERES_MAX } from './interprete'
import { textesRediges, type MotifRefusContexte } from './noyau'

const EN_TETE_ICI = 'ICI'
const EN_TETE_CATALOGUE = 'CATALOGUE'
const EN_TETE_SAISIE = 'saisie'
const SEPARATEUR_DE_BLOCS = '\n\n'

const PREFIXE_LIEU = 'monde.lieux[].'
const CHEMIN_DESCRIPTION_LIEU = 'monde.lieux[].description'
const CHEMIN_DANGERS_LIEU = 'monde.lieux[].dangers'
const CHEMINS_DU_CANON = ['canon.ton', 'canon.interdits_ton[]'] as const

/** Pousse un bloc SEULEMENT s'il a au moins une ligne — jamais un bloc vide
 *  (précédent `narrateur.ts`/`interprete.ts`). */
function pousser(blocs: string[], enTete: string, lignes: readonly string[]): void {
	if (lignes.length > 0) blocs.push(`${enTete}\n${lignes.join('\n')}`)
}

/**
 * LE CATALOGUE — CALCULÉ UNE FOIS, au chargement du module : il ne dépend ni du
 * dossier ni de la session, seulement des deux registres fermés. 8 lignes de
 * `CHARACTERISTICS`, puis 4 de `CHALLENGE_TIERS`, dans l'ORDRE du registre
 * (`CHARACTERISTIC_VALUES`/`CHALLENGE_TIER_VALUES`, jamais `Object.keys` refait
 * sur place). **Jamais** `notation` ni `baseXp` (§ 8 #14 du plan it2).
 */
const LIGNES_CATALOGUE: readonly string[] = [
	...CHARACTERISTIC_VALUES.map(
		(code) => `${code} — ${CHARACTERISTICS[code].label} : ${CHARACTERISTICS[code].describe}`,
	),
	...CHALLENGE_TIER_VALUES.map((code) => `${code} — ${CHALLENGE_TIERS[code].difficulty}`),
]
const CATALOGUE_BLOC = `${EN_TETE_CATALOGUE}\n${LIGNES_CATALOGUE.join('\n')}`

/**
 * LA BORNE DU TERME DOSSIER (canon + `ICI`), EN CARACTÈRES — MESURÉE sur les deux
 * fixtures (`dossier-reference.json`, `dossier-minimal.json`), puis MAJORÉE ×3
 * (même marge que `BUDGET_CARACTERES_DOSSIER` de `narrateur.ts` — la prose
 * d'auteur n'est pas bornée, KR-203).
 *
 * MESURE DU 2026-10-01 (it2), pire cas des DEUX fixtures :
 *   `canon.ton` le plus long = « sombre et feutré » (16, `dossier-minimal.json`) ;
 *   `canon.interdits_ton[]` identique aux deux = 2 lignes (19 + 17 caractères) ;
 *   `description` + `dangers` les plus longs = `lieu.foyer-du-guet`
 *   (`dossier-reference.json`), 153 + 93 caractères.
 * Blocs composés (en-têtes + séparateurs internes compris) : M = 338.
 * `ceil(338 × 3 / 1000) × 1000` = 2000.
 */
const BUDGET_CARACTERES_DOSSIER_ARBITRE = 2000

/**
 * LA BORNE DU TERME SAISIE, EN CARACTÈRES — CALCULÉE EXACTEMENT : l'en-tête
 * `saisie`, un saut de ligne, puis `SAISIE_CARACTERES_MAX` caractères au pire.
 */
const BORNE_SAISIE_BLOC = EN_TETE_SAISIE.length + 1 + SAISIE_CARACTERES_MAX

/**
 * LA BORNE DU CONTEXTE, EN CARACTÈRES (`String.length`) — AU-DELÀ, `'trop-long'`
 * AVANT tout `fetch`, jamais une coupe dans une prose. TROIS TERMES qui ne se
 * traitent pas pareil : le terme DOSSIER, MESURÉ puis majoré (×3,
 * `BUDGET_CARACTERES_DOSSIER_ARBITRE`) ; le terme CATALOGUE, CALCULÉ EXACTEMENT
 * (`CATALOGUE_BLOC.length`, dérivé des deux registres fermés, jamais mesuré) ; le
 * terme SAISIE, CALCULÉ EXACTEMENT (`BORNE_SAISIE_BLOC`). Les DEUX séparateurs
 * restants (entre le bloc dossier et le catalogue, puis entre le catalogue et la
 * saisie) s'ajoutent EXACTEMENT : le terme dossier porte déjà SES séparateurs
 * internes (mesurés dans M).
 *
 * HORS DE `BUDGET_CARACTERES_CONTEXTE` (`./registres.ts`) — même motif que
 * `BUDGET_CARACTERES_NARRATEUR` : ce registre est `Record<RoleCopilote, number>`,
 * et y entrer ferait entrer l'arbitre dans la parité AUTEUR.
 *
 * Exportée par `./index.ts` pour `worker/frontiere.test.ts` SEULEMENT — jamais
 * par `brain/index.ts` : aucune feature n'assemble un contexte elle-même.
 */
export const BUDGET_CARACTERES_ARBITRE =
	BUDGET_CARACTERES_DOSSIER_ARBITRE + SEPARATEUR_DE_BLOCS.length * 2 + CATALOGUE_BLOC.length + BORNE_SAISIE_BLOC

export type ContexteArbitre =
	| { readonly ok: true; readonly texte: string }
	| ({ readonly ok: false } & MotifRefusContexte)

/**
 * L'ASSEMBLEUR — voir la docstring de tête pour l'ordre des blocs et des refus.
 */
export function assemblerArbitre(dossier: Dossier, cible: CibleArbitre): ContexteArbitre {
	const lieu = dossier.monde.lieux.find((candidat) => candidat.id === cible.lieuId)
	const description = lieu === undefined ? [] : textesRediges(lieu, CHEMIN_DESCRIPTION_LIEU, PREFIXE_LIEU)
	if (lieu === undefined || description.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	const dangers = textesRediges(lieu, CHEMIN_DANGERS_LIEU, PREFIXE_LIEU)

	// ── LE CANON, global, optionnel ─────────────────────────────────────────
	const canon: string[] = []
	for (const chemin of CHEMINS_DU_CANON) pousser(canon, chemin, textesRediges(dossier, chemin, ''))

	// ── ICI — description requise, dangers optionnel ────────────────────────
	const ici: string[] = []
	pousser(ici, EN_TETE_ICI, [...description, ...dangers])

	// ── LA SAISIE, EN DERNIER, normalisée ────────────────────────────────────
	const saisie = `${EN_TETE_SAISIE}\n${cible.saisie.trim().replace(/\s+/g, ' ')}`

	const texte = [...canon, ...ici, CATALOGUE_BLOC, saisie].join(SEPARATEUR_DE_BLOCS)
	if (texte.length > BUDGET_CARACTERES_ARBITRE) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte }
}
