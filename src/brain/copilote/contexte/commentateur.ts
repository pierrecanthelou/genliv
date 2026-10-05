/**
 * L'ASSEMBLEUR DU ONZIÈME RÔLE — `commentateur` (R5, n° 13 `moteur-combat`, it3, lot
 * `contrat`).
 *
 * Il compose ce que R5 VOIT pour commenter UN assaut que le moteur a déjà résolu : un round,
 * zéro mémoire de combat, jamais un historique (chaque appel est sans état). Le modèle ne
 * décide de rien — ni de qui a touché, ni de combien, ni de la fin du combat : il met en mots
 * ce que la demande lui donne, et ce que le moteur a écrit fait foi.
 *
 * ⚠ AUCUN CHIFFRE NE PART SUR LE FIL, ET C'EST L'INVARIANT DU RÔLE (KR-294/296) : la cible
 * porte des PV BRUTS (`ProjectionAssaut`, `copilote/types.ts`), et c'est ICI, dans `brain/`,
 * qu'ils sont CLASSÉS EN MOTS (`palierDeSante`). Le validateur de sortie
 * (`validerCommentateur`) refuse tout chiffre : un chiffre en entrée serait un chiffre à
 * recopier. Un test balaie TOUT l'espace des entrées (vainqueur × qualité × paliers × issue ×
 * chaque monstre du bestiaire) et exige `!/\d/` sur le texte rendu.
 *
 * ⚠ COMME `interprete`, `narrateur`, `arbitre` ET `acteur`, CE RÔLE NE PASSE PAS PAR
 * `./registres.ts` : ces registres sont `Record<RoleCopilote, …>`, et `RoleCopilote` n'est pas
 * étendu aux rôles de JEU. Ce module porte donc SA liste de chemins et SA borne
 * (`BUDGET_CARACTERES_COMMENTATEUR`), hors de la parité auteur de `worker/frontiere.test.ts` —
 * la MÊME DOCTRINE pour autant : jamais une prose coupée, silence sur un champ non rédigé plutôt
 * qu'une affirmation, refus AVANT tout `fetch`.
 *
 * CE QU'IL INJECTE, dans cet ordre, séparé par une ligne vide :
 *  1. le CANON — `canon.ton`, `canon.interdits_ton[]`, chacun QUAND ÉCRIT, préfixé par son
 *     chemin (précédent `arbitre`/`narrateur`). Le tutoiement ou le vouvoiement du commentaire
 *     est DÉLÉGUÉ au ton : l'invite ne le fige pas ;
 *  2. `ASSAUT` — des MOTS d'une table FERMÉE, un par ligne : l'adversaire (le NOM, résolu
 *     depuis le bestiaire), le vainqueur, la nature du coup (absente à l'égalité), l'état du
 *     héros, l'état de l'adversaire, et l'issue du combat quand ce round le clôt.
 *
 * CE QUI N'ENTRE JAMAIS : un chiffre de quelque sorte (PV, AT, marge, numéro de round), les
 * postures (faussées par séisme et désarmement), le nom du héros (`heros.name` est d'audience
 * `moteur`, KR-232), la capacité du monstre (aucun producteur, KR-285), `CombatLogEntry.text`
 * (KR-294), la fuite (`'hero-fled'`, KR-297 — exclue par le TYPE de la projection), tout
 * identifiant (la référence du monstre est RÉSOLUE, jamais envoyée), les autres rounds.
 *
 * LES PALIERS DE SANTÉ sont des seuils de PRÉSENTATION NARRATIVE, pas une règle du jeu :
 * `docs/REGLES-DU-JEU.md` n'en dit rien et la table dorée ne les couvre pas (si ces seuils
 * disparaissaient, un jet ne changerait d'aucun résultat, seule une prose changerait — même
 * test décisif que `CURSEURS`, KR-193). Ils sont néanmoins éprouvés aux deux bornes de chaque
 * seuil, et recoupés avec `healthState` (`characteristics.ts`) : « à terre » pour ce module vaut
 * « pas `ok` » pour le moteur.
 *
 * REFUS, AVANT tout `fetch`, dans cet ordre :
 *   `cible-a-ecrire` — la RÉFÉRENCE du monstre ne résout pas contre le bestiaire : commenter un
 *     adversaire sans nom reviendrait à l'inventer, et une référence pendante est REFUSÉE,
 *     jamais silencieusement rompue ;
 *   `trop-long` — le texte assemblé dépasse `BUDGET_CARACTERES_COMMENTATEUR` (le canon d'un
 *     auteur qui déborde son terme ; la projection, elle, ne le peut pas).
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES ici, et c'est délibéré : aucun champ
 * du canon n'est requis, et ce rôle n'a aucun ensemble à épuiser — les écrire serait du code
 * mort présenté comme de la couverture (KR-235).
 */
import { BESTIARY } from '../../bestiary'
import type { HitQuality } from '../../combat'
import { monstreDeLaReference } from '../../dossier/monstre'
import type { IssueCombat } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import type { CibleCommentateur, ProjectionAssaut } from '../types'
import { textesRediges, type MotifRefusContexte } from './noyau'

const EN_TETE_ASSAUT = 'ASSAUT'
const SEPARATEUR_DE_BLOCS = '\n\n'
const CHEMINS_DU_CANON = ['canon.ton', 'canon.interdits_ton[]'] as const

/**
 * LES TROIS PALIERS COMMUNS AUX DEUX CAMPS, plus le quatrième propre à chacun (`'inconscient'`
 * pour le héros, `'vaincu'` pour l'adversaire) — jamais un cinquième : à terre, le moteur ne
 * distingue pas davantage (`healthState` dit `inconscient` ou `mort` selon `CA`, mais l'`issue`
 * du round porte déjà cette nuance pour le héros).
 */
export type PalierSante = 'plein' | 'blesse' | 'critique'

/**
 * LE PALIER DE SANTÉ — `pv` rapporté à `pvMax`, sans jamais diviser (pas de flottant, pas de
 * `NaN` sur un `pvMax` nul) :
 *   · `pv ≤ 0`                  → `ecroule` (`'inconscient'` pour le héros, `'vaincu'` sinon) ;
 *   · `pv > 50 % de pvMax`      → `'plein'`     (`pv × 2 > pvMax`) ;
 *   · `pv ≥ 25 % de pvMax`      → `'blesse'`    (`pv × 4 ≥ pvMax`) — 50 % ET 25 % pile en font partie ;
 *   · sinon                     → `'critique'`  (`0 < pv < 25 %`).
 *
 * `ecroule` est UN PARAMÈTRE et non deux fonctions : les deux camps ont les trois mêmes seuils,
 * seul le mot de la dernière marche change — deux corps rendraient deux seuils qui dérivent.
 *
 * Exportée pour son test de bornes SEULEMENT — jamais par `./index.ts` ni par `brain/index.ts` :
 * aucune feature ne classe une santé elle-même (précédent `CibleNarrateur.epreuve`).
 */
export function palierDeSante<E extends string>(pv: number, pvMax: number, ecroule: E): PalierSante | E {
	if (pv <= 0) return ecroule
	if (pv * 2 > pvMax) return 'plein'
	if (pv * 4 >= pvMax) return 'blesse'
	return 'critique'
}

/**
 * LES TABLES DE MOTS — des `Record` EXHAUSTIFS par compilation (KR-117) : une variante ajoutée à
 * `HitQuality`, à `IssueCombat` ou à l'un des deux camps sans entrée ici NE COMPILE PAS. Un mot
 * est du français pour le MODÈLE, jamais du texte d'écran ; aucun ne porte de chiffre (balayé
 * par le test), et AUCUN n'est un terme mécanique (point de vie, jet, round).
 */
const MOT_VAINQUEUR: Record<ProjectionAssaut['vainqueur'], string> = {
	heros: 'le héros',
	monstre: "l'adversaire",
	nul: 'aucun des deux',
}

const MOT_COUP: Record<HitQuality, string> = {
	rate: 'manqué',
	erafle: 'une éraflure',
	franc: 'un coup franc',
	magistral: 'un coup magistral',
	critique: 'un coup critique',
}

const MOT_PALIER_HEROS: Record<PalierSante | 'inconscient', string> = {
	plein: 'en pleine forme',
	blesse: 'blessé',
	critique: 'à bout de forces',
	inconscient: 'inconscient',
}

const MOT_PALIER_MONSTRE: Record<PalierSante | 'vaincu', string> = {
	plein: 'en pleine forme',
	blesse: 'blessé',
	critique: 'à bout de forces',
	vaincu: 'vaincu',
}

/** La fuite du HÉROS (`'hero-fled'`) n'a pas de mot : elle n'est pas commentée (KR-297), et le
 *  TYPE de `ProjectionAssaut.issue` l'exclut — c'est ce qui rend cette table exhaustive. */
const MOT_ISSUE: Record<Exclude<IssueCombat, 'hero-fled'>, string> = {
	'hero-victory': "l'adversaire est terrassé",
	'monster-fled': "l'adversaire prend la fuite",
	'hero-survived-unconscious': "le héros sombre dans l'inconscience mais survit",
	'hero-mort': 'le héros est mort',
}

/** Le mot le plus long d'une table — le pire cas d'une ligne, pour la borne de la projection. */
function plusLong(mots: readonly string[]): string {
	return mots.reduce((long, mot) => (mot.length > long.length ? mot : long), '')
}

/** Les valeurs d'une ligne chacune, déjà en MOTS. `null` = la ligne est absente. */
interface MotsAssaut {
	readonly adversaire: string
	readonly vainqueur: string
	readonly coup: string | null
	readonly heros: string
	readonly ennemi: string
	readonly issue: string | null
}

/**
 * LE BLOC `ASSAUT` — UN SEUL CORPS pour l'assemblage ET pour la borne : la borne de la
 * projection est le bloc écrit avec le mot le plus long de chaque table, jamais une
 * recomposition à part qui dériverait. `coup` et `issue` s'écrivent QUAND ils sont posés.
 */
function blocAssaut(mots: MotsAssaut): string {
	const lignes = [
		`adversaire : ${mots.adversaire}`,
		`vainqueur : ${mots.vainqueur}`,
		...(mots.coup === null ? [] : [`coup : ${mots.coup}`]),
		`état du héros : ${mots.heros}`,
		`état de l'adversaire : ${mots.ennemi}`,
		...(mots.issue === null ? [] : [`issue : ${mots.issue}`]),
	]
	return `${EN_TETE_ASSAUT}\n${lignes.join('\n')}`
}

/**
 * LA BORNE DU TERME DOSSIER (canon), EN CARACTÈRES — MESURÉE sur les deux fixtures
 * (`dossier-reference.json`, `dossier-minimal.json`), puis MAJORÉE ×3 et arrondie au millier
 * supérieur (même doctrine que `BUDGET_CARACTERES_DOSSIER_ARBITRE` — la prose d'auteur n'est pas
 * bornée, KR-203).
 *
 * MESURE DU 2026-10-05 (it3), pire cas des DEUX fixtures :
 *   `canon.ton` le plus long = « sombre et feutré » (16, `dossier-minimal.json`) ; « sec et
 *   méfiant » (14) dans `dossier-reference.json` ;
 *   `canon.interdits_ton[]` identique aux deux = 2 lignes (18 + 16 caractères).
 * Blocs composés (en-têtes + séparateur interne compris) : M = 85 (83 sur la référence).
 * `ceil(85 × 3 / 1000) × 1000` = 1000. Un test RE-MESURE M depuis les fixtures et l'exige.
 */
const BUDGET_CARACTERES_DOSSIER_COMMENTATEUR = 1000

/**
 * LA BORNE DU TERME PROJECTION, EN CARACTÈRES — CALCULÉE EXACTEMENT, jamais mesurée : le bloc
 * `ASSAUT` écrit avec le mot le plus long de CHAQUE table fermée — dont le nom le plus long du
 * bestiaire (`BESTIARY`, registre de code, jamais un champ libre) — et AVEC les deux lignes
 * facultatives (`coup`, `issue`). Coût FIXE par appel : aucun terme mémoire, un seul round.
 * ⚠ C'EST UN MAJORANT ATTEINT : par convention du moteur (non typée), `qualite` est `null` ssi
 * égalité, donc la combinaison la plus longue de l'espace des entrées EST réalisable par
 * l'assembleur, et le test balaie cet espace pour le constater.
 */
const BORNE_PROJECTION = blocAssaut({
	adversaire: plusLong(BESTIARY.map((monstre) => monstre.name)),
	vainqueur: plusLong(Object.values(MOT_VAINQUEUR)),
	coup: plusLong(Object.values(MOT_COUP)),
	heros: plusLong(Object.values(MOT_PALIER_HEROS)),
	ennemi: plusLong(Object.values(MOT_PALIER_MONSTRE)),
	issue: plusLong(Object.values(MOT_ISSUE)),
}).length

/**
 * LA BORNE DU CONTEXTE, EN CARACTÈRES (`String.length`) — AU-DELÀ, `'trop-long'` AVANT tout
 * `fetch`, jamais une coupe dans une prose. DEUX TERMES qui ne se traitent pas pareil : le terme
 * DOSSIER, MESURÉ puis majoré (×3, `BUDGET_CARACTERES_DOSSIER_COMMENTATEUR`) ; le terme
 * PROJECTION, CALCULÉ EXACTEMENT (`BORNE_PROJECTION`). L'UNIQUE séparateur entre le canon et le
 * bloc `ASSAUT` s'ajoute EXACTEMENT : le terme dossier porte déjà SES séparateurs internes
 * (mesurés dans M).
 *
 * HORS DE `BUDGET_CARACTERES_CONTEXTE` (`./registres.ts`) — même motif que
 * `BUDGET_CARACTERES_NARRATEUR` : ce registre est `Record<RoleCopilote, number>`, et y entrer
 * ferait entrer le commentateur dans la parité AUTEUR.
 *
 * Exportée par `./index.ts` pour `worker/frontiere.test.ts` SEULEMENT — jamais par
 * `brain/index.ts` : aucune feature n'assemble un contexte elle-même.
 */
export const BUDGET_CARACTERES_COMMENTATEUR =
	BUDGET_CARACTERES_DOSSIER_COMMENTATEUR + SEPARATEUR_DE_BLOCS.length + BORNE_PROJECTION

export type ContexteCommentateur =
	| { readonly ok: true; readonly texte: string }
	| ({ readonly ok: false } & MotifRefusContexte)

/**
 * L'ASSEMBLEUR — voir la docstring de tête pour l'ordre des blocs et des refus. `texte` est
 * DÉTERMINISTE : ni date, ni identifiant, ni aléa — « deux lancers ⇒ deux corps identiques ».
 */
export function assemblerCommentateur(dossier: Dossier, cible: CibleCommentateur): ContexteCommentateur {
	const { projection } = cible

	// LA RÉFÉRENCE DU MONSTRE SE RÉSOUT D'ABORD : sans nom du registre, rien ne part.
	const monstre = monstreDeLaReference(projection.monstre)
	if (monstre === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	// ── LE CANON, global, optionnel — un bloc par chemin, QUAND ÉCRIT ─────────
	const canon: string[] = []
	for (const chemin of CHEMINS_DU_CANON) {
		const lignes = textesRediges(dossier, chemin, '')
		if (lignes.length > 0) canon.push(`${chemin}\n${lignes.join('\n')}`)
	}

	// ── L'ASSAUT — des mots, jamais un nombre ─────────────────────────────────
	const assaut = blocAssaut({
		adversaire: monstre.name,
		vainqueur: MOT_VAINQUEUR[projection.vainqueur],
		coup: projection.qualite === null ? null : MOT_COUP[projection.qualite],
		heros: MOT_PALIER_HEROS[palierDeSante(projection.heroPv, projection.heroPvMax, 'inconscient')],
		ennemi: MOT_PALIER_MONSTRE[palierDeSante(projection.monstrePv, projection.monstrePvMax, 'vaincu')],
		issue: projection.issue === undefined ? null : MOT_ISSUE[projection.issue],
	})

	const texte = [...canon, assaut].join(SEPARATEUR_DE_BLOCS)
	if (texte.length > BUDGET_CARACTERES_COMMENTATEUR) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte }
}
