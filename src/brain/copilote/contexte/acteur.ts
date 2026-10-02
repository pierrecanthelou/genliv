/**
 * L'ASSEMBLEUR DU DIXIÈME RÔLE — `acteur` (n° 12 `moteur-acteurs`, it1 puis it2,
 * lot `contrat`).
 *
 * Il compose ce qu'UN PNJ interpellé voit pour répondre dans sa propre voix —
 * strictement scopé à CE personnage : jamais la fiche d'un autre, jamais un
 * chiffre de jeu, AUCUNE relation (`relations[]`, même du porteur) ni
 * `cede_si` — ces deux derniers champs n'ont pas de mécanisme consommateur
 * avant une itération ultérieure (KR-268/285, résolu décisions du raffinage
 * it1, § 8 #7).
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
 *  6. `CE QUE TU LUI AS DÉJÀ CONFIÉ` (it2) — un SAVOIR PAR LIGNE, SANS RANG,
 *     pour chaque `indice_id` de `savoirsDejaConfies` (`dossier/revelation.ts`) :
 *     certitude (`LIBELLE_CERTITUDE`) puis `formulation_joueur` de l'indice visé.
 *     Silence si ce PNJ n'a encore rien confié ;
 *  7. `CE QUE TU PEUX CONFIER` (it2) — UN SAVOIR PAR LIGNE, RANG `S<n>`
 *     RECALCULÉ À CHAQUE APPEL (jamais persisté), pour chaque `indice_id` de
 *     `savoirsRevelables` — catalogue déjà FERMÉ par le moteur (KR-287) :
 *     certitude, `formulation_joueur`, PUIS `revele_comment` SI rédigé. Silence
 *     si l'ensemble est vide — aucun drapeau visible d'un savoir fermé ;
 *  8. `ICI` — `description` puis `ambiance` du lieu courant, silence si
 *     absentes (contrairement au narrateur, cette ligne n'est jamais requise) ;
 *  9. `JAMAIS` — `caractere.jamais`, silence si absent ;
 *  10. `saisie` — EN DERNIER, normalisée, bornée par `SAISIE_CARACTERES_MAX`
 *     (réutilisée de `./interprete`, MÊME saisie du joueur déjà passée par la
 *     garde de R1).
 *
 * CE QUI N'ENTRE JAMAIS : `nom`/tout identifiant brut (`indice_id` COMPRIS —
 * SEULS `formulation_joueur` et `revele_comment` sortent d'un savoir, JAMAIS
 * `Indice.nom` ni `Indice.verite` ni `revele_si` et ses champs ni l'objet de la
 * `contrepartie`), `stats`/`curseurs`/`camp`/`portee`/`objectif_id`,
 * `description_joueur`/`but.*`, `plan_actions[]`/`contre_mesures[]`, **toutes**
 * les `relations[]` (y compris du porteur) et `cede_si`, les autres PNJ (NI
 * LEURS SAVOIRS — isolation stricte, KR-282 étendu), l'inventaire, `heros.*`,
 * `monde.indices_connus` brut, `a_dit` brut, le résumé `AUPARAVANT`, les récits
 * de R3, `journal[].texte`, les saisies passées, `synopsis_mj`.
 *
 * REFUS, AVANT tout `fetch`, dans cet ORDRE (§ 4 bis du plan) :
 *   `cible-a-ecrire` — le PNJ ne résout pas, ou ni `fonction` ni `apparence`
 *     n'est rédigée (ou marquée) ;
 *   `trop-long` — la saisie dépasse `SAISIE_CARACTERES_MAX`, ou le texte
 *     assemblé dépasse `BUDGET_CARACTERES_ACTEUR`. REFUS, JAMAIS DE
 *     TRONCATURE, JAMAIS DE CASCADE (contrairement au narrateur, it4) — ce rôle
 *     n'a pas de capacité de dégradation.
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` SONT INATTEIGNABLES ICI, ET C'EST
 * DÉLIBÉRÉ : aucun champ du canon n'est requis, et ce rôle n'a aucun ensemble
 * de candidats à épuiser — les écrire serait du code mort présenté comme de la
 * couverture (KR-235).
 */
import { PARLER_REPLIQUES } from '../../dossier/curseurs'
import { FAITS_INJECTES_MAX } from '../../dossier/memoire'
import { savoirsDejaConfies, savoirsRevelables } from '../../dossier/revelation'
import type { EtatSession } from '../../dossier/session'
import type { Certitude, Dossier, Personnage } from '../../dossier/types'
import { FAIT_CARACTERES_MAX, REPLIQUE_CARACTERES_MAX } from '../schemaSortie'
import type { RangInjecte } from '../types'
import { PREFIXE_INDICE, PREFIXE_PERSONNAGE, textesRediges, type MotifRefusContexte } from './noyau'
import { SAISIE_CARACTERES_MAX } from './interprete'

const EN_TETE_TOI = 'TOI'
const EN_TETE_VOIX = 'TA VOIX'
const EN_TETE_ETABLI = 'ETABLI'
const EN_TETE_DIT = 'TU AS DIT'
const EN_TETE_DEJA_CONFIE = 'CE QUE TU LUI AS DÉJÀ CONFIÉ'
const EN_TETE_PEUT_CONFIER = 'CE QUE TU PEUX CONFIER'
const EN_TETE_ICI = 'ICI'
const EN_TETE_JAMAIS = 'JAMAIS'
const EN_TETE_SAISIE = 'saisie'
const SEPARATEUR_DE_BLOCS = '\n\n'
const SEPARATEUR_DE_CHAMP = ' · '
const PREFIXE_RANG_SAVOIR = 'S'

const CHEMIN_FONCTION = 'monde.personnages[].fonction'
const CHEMIN_APPARENCE = 'monde.personnages[].apparence'
const CHEMIN_PARLER = 'monde.personnages[].caractere.parler[]'
const CHEMIN_JAMAIS = 'monde.personnages[].caractere.jamais'
const PREFIXE_SAVOIR = 'monde.personnages[].savoirs[].'
const CHEMIN_REVELE_COMMENT = `${PREFIXE_SAVOIR}revele_comment`
const CHEMIN_FORMULATION_INDICE = `${PREFIXE_INDICE}formulation_joueur`
const PREFIXE_LIEU = 'monde.lieux[].'
const CHEMIN_DESCRIPTION_LIEU = 'monde.lieux[].description'
const CHEMIN_AMBIANCE_LIEU = 'monde.lieux[].ambiance'
const CHEMINS_DU_CANON = ['canon.ton', 'canon.interdits_ton[]'] as const

/**
 * LE LIBELLÉ DE CERTITUDE INJECTÉ — `Record<Certitude, string>` EXHAUSTIF
 * (KR-117, § 4 bis du plan) : une quatrième certitude ne compile pas sans sa
 * ligne. DISTINCT de `LIBELLES_CERTITUDE` (`dossier-fiches/components/BlocSavoirs.tsx`,
 * registre de PRÉSENTATION D'ÉCRAN, sentence case, « Sait »/« Croit »/« Soupçonne ») :
 * ce registre-ci est une PHRASE DE SECONDE PERSONNE à l'adresse DU PERSONNAGE
 * lui-même (« tu le sais »), jamais un mot d'écran — les deux registres ne
 * fusionnent pas, même doctrine que `CAMPS`/`CAMPS_PERSONNAGE`.
 */
const LIBELLE_CERTITUDE: Record<Certitude, string> = {
	sait: 'tu le sais',
	croit: 'tu le crois',
	soupconne: 'tu le soupçonnes',
}

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

/** `Indice.formulation_joueur`, rédigée — `undefined` sinon (absente, vide, ou
 *  encore marquée). RÉUTILISE `textesRediges`, qui filtre déjà le marqueur et le
 *  blanc : même garde que `evaluerSavoir` (`dossier/revelation.ts`), jamais une
 *  seconde écriture du filtre. */
function formulationDe(indice: unknown): string | undefined {
	return textesRediges(indice, CHEMIN_FORMULATION_INDICE, PREFIXE_INDICE)[0]
}

/**
 * `CE QUE TU LUI AS DÉJÀ CONFIÉ` — une ligne SANS RANG par savoir `deja_confie`
 * (`savoirsDejaConfies`, `dossier/revelation.ts`), DANS L'ORDRE qu'elle rend.
 *
 * DÉFENSIF, et c'est voulu : `evaluerSavoir` teste `a_dit` AVANT le contenu, donc
 * un indice révélé puis dépouillé de sa `formulation_joueur` par une édition
 * ultérieure du dossier resterait `'deja_confie'` SANS prose à offrir — la ligne
 * est alors tue (silence, même doctrine que le filtre `MARQUEUR_A_ECRIRE`),
 * jamais une ligne à moitié vide.
 */
function lignesDejaConfie(
	dossier: Dossier,
	personnage: Personnage,
	session: EtatSession,
	personnageId: string,
): string[] {
	const lignes: string[] = []
	for (const indiceId of savoirsDejaConfies(dossier, session.monde, personnageId)) {
		const savoir = personnage.savoirs.find((candidat) => candidat.indice_id === indiceId)
		const indice = dossier.monde.indices.find((candidat) => candidat.id === indiceId)
		const formulation = formulationDe(indice)
		if (savoir === undefined || formulation === undefined) continue
		lignes.push(`·${SEPARATEUR_DE_CHAMP}${LIBELLE_CERTITUDE[savoir.certitude]}${SEPARATEUR_DE_CHAMP}${formulation}`)
	}
	return lignes
}

/**
 * `CE QUE TU PEUX CONFIER` — LE CATALOGUE BORNÉ (KR-287) : une ligne RANG `S<n>`
 * par savoir `revelable` (`savoirsRevelables`), DANS L'ORDRE qu'elle rend, les
 * rangs RECALCULÉS À CHAQUE APPEL — jamais persistés. Rend AUSSI la table
 * `rangs` (`S<n>` → `indice_id`) : SEULE SOURCE de `validerActeur`
 * (`rangsOuverts`) et de la re-résolution côté `CopiloteService` — jamais
 * re-dérivée (KR-231, précédent `assemblerDetenteurs`).
 *
 * DÉFENSIF comme `lignesDejaConfie` : un savoir `revelable` sans prose
 * injectable (ne devrait pas survenir, `evaluerSavoir` filtre déjà le contenu)
 * ne pousse ni ligne ni rang — plutôt que d'offrir un rang vide.
 */
function blocPeutConfier(
	dossier: Dossier,
	personnage: Personnage,
	session: EtatSession,
	personnageId: string,
): { readonly lignes: string[]; readonly rangs: Map<RangInjecte, string> } {
	const lignes: string[] = []
	const rangs = new Map<RangInjecte, string>()
	for (const indiceId of savoirsRevelables(dossier, session.monde, personnageId)) {
		const savoir = personnage.savoirs.find((candidat) => candidat.indice_id === indiceId)
		const indice = dossier.monde.indices.find((candidat) => candidat.id === indiceId)
		const formulation = formulationDe(indice)
		if (savoir === undefined || formulation === undefined) continue

		const commentaire = textesRediges(savoir, CHEMIN_REVELE_COMMENT, PREFIXE_SAVOIR)[0]
		const champs = [
			LIBELLE_CERTITUDE[savoir.certitude],
			formulation,
			...(commentaire === undefined ? [] : [commentaire]),
		]
		const rang = `${PREFIXE_RANG_SAVOIR}${rangs.size + 1}`
		rangs.set(rang, indiceId)
		lignes.push(`${rang}${SEPARATEUR_DE_CHAMP}${champs.join(SEPARATEUR_DE_CHAMP)}`)
	}
	return { lignes, rangs }
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
 * LA BORNE DU TERME DOSSIER (canon + `TOI` + `TA VOIX` + `CE QUE TU LUI AS DÉJÀ
 * CONFIÉ` + `CE QUE TU PEUX CONFIER` + `ICI` + `JAMAIS`), EN CARACTÈRES —
 * MESURÉE sur `dossier-reference.json` (pire cas RÉEL, toute la combinatoire),
 * puis MAJORÉE ×3 (même marge que `BUDGET_CARACTERES_DOSSIER_ARBITRE` — la
 * prose d'auteur n'est pas bornée, KR-203, et `personnage.savoirs[]` n'a AUCUN
 * plafond de cardinalité non plus : les deux blocs neufs de l'it2 appartiennent
 * à CE terme, jamais au terme MÉMOIRE calculé, pour la même raison).
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
 *
 * RE-MESURE DU 2026-10-02 (it2), MÊME MÉTHODE ÉTENDUE À TROIS SCÉNARIOS DE
 * SESSION PAR COMBINAISON (fraîche · portes du nouveau savoir de Harek ouvertes
 * · savoir déjà confié) — ⚠ M RESTE 781, ET C'EST UNE MESURE, PAS UNE SUPPOSITION
 * : Corvin (`savoirs: []`) reste le pire cas, aucun des deux blocs neufs ne le
 * dépassant jamais — le pire cas PORTANT un bloc neuf, `lieu.foyer-du-guet` /
 * `pnj.harek-le-forgeron` / portes ouvertes (`S1` · `tu le crois` ·
 * `formulation_joueur` 57 car. · `revele_comment` 69 car.), mesure 729 avec la
 * saisie vide incluse (720 sans elle) — SOUS 781. `ceil(781 × 3 / 1000) × 1000`
 * reste 3000, inchangé.
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

/**
 * LA BRANCHE DE SUCCÈS, NOMMÉE — précédent `EpreuveProposee`/`FicheReseau` : un
 * objet anonyme imbriqué directement dans une union se rend par Prettier avec une
 * indentation mixte qu'ESLint (`no-mixed-spaces-and-tabs`) refuse, et le rendre
 * lisible ne vaut pas un `eslint-disable`.
 */
export interface ContexteActeurRendu {
	readonly ok: true
	readonly texte: string
	/** `S<n>` → `indice_id` DES SAVOIRS `revelable` DE CET APPEL — SEULE SOURCE
	 *  de `validerActeur` (`rangsOuverts`) et de la re-résolution côté
	 *  `CopiloteService.demanderActeur`, jamais re-dérivée (KR-231). NE SORT
	 *  JAMAIS de `brain/copilote/`, précédent `ContexteDetenteursRendu.rangs`. */
	readonly rangs: ReadonlyMap<RangInjecte, string>
}

export type ContexteActeur = ContexteActeurRendu | ({ readonly ok: false } & MotifRefusContexte)

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

	// ── CE QUE TU LUI AS DÉJÀ CONFIÉ — sans rang, silence si rien de confié ──
	pousser(blocs, EN_TETE_DEJA_CONFIE, lignesDejaConfie(dossier, personnage, session, personnageId))

	// ── CE QUE TU PEUX CONFIER — catalogue borné (KR-287), rangs RECALCULÉS ──
	const peutConfier = blocPeutConfier(dossier, personnage, session, personnageId)
	pousser(blocs, EN_TETE_PEUT_CONFIER, peutConfier.lignes)

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

	return { ok: true, texte, rangs: peutConfier.rangs }
}
