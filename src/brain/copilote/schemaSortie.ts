/**
 * LA FRONTIÈRE D'ENTRÉE d'une sortie de modèle — la FORME, jamais la PROSE
 * (KR-229). Aucun instrument du dépôt ne constate une cohérence narrative ; ce
 * qui se prouve ici est un schéma fermé, une non-vacuité, l'absence du marqueur
 * d'amorce et l'absence d'identifiant du dossier.
 *
 * Elle vit DANS LE CLIENT et non dans le worker : KR-116 place la validation
 * LÀ OÙ LA DONNÉE ENTRE DANS LE DOSSIER, et du point de vue du client le worker
 * est une entrée non fiable au même titre que le fournisseur qu'il relaie.
 */
import { MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import { ESPACES_DE_NOMS, collectIds } from '../dossier/identifiers'
import type { Dossier } from '../dossier/types'
import type { DetenteursRendus, PropositionRendue, RangInjecte, RoleCopilote } from './types'

/** Les clés du schéma de sortie, EN VALEUR : le garde KR-236 les énumère à
 *  l'exécution (une `interface` n'existe plus au runtime), et le validateur est
 *  PILOTÉ par cette liste — une seule source, aucune dérive possible. */
export const CLES_SORTIE = ['valeur'] as const

/** L'équivalent pour le rôle `indice-detenteurs`. DEUX registres LITTÉRAUX et non
 *  un registre paramétré : une déclaration unique à deux formes — une prose
 *  SCALAIRE et une COLLECTION — n'a aucune raison d'évoluer ensemble (§ 8, TL-3). */
export const CLES_SORTIE_DETENTEURS = ['detenteurs'] as const

/** LA BORNE DE SORTIE — combien de détenteurs le modèle a le droit de désigner.
 *  Elle borne la SORTIE et dérive `max_tokens` (worker) ; `CANDIDATS_MAX` borne
 *  l'ENTRÉE et dérive du budget de contexte. Dimensionner `max_tokens` sur le
 *  nombre de CANDIDATS financerait une liste que ce contrat refuse. */
export const PROPOSITIONS_MAX = 3

/**
 * LE GABARIT, APPARIÉ AU RÔLE — et c'est la moitié de la garde KR-236. Avec deux
 * constantes séparées, l'appariement rôle → gabarit n'existerait QUE dans le test,
 * qui en deviendrait un TROISIÈME porteur ; un `Record<RoleCopilote, string>` le
 * rend TOTAL À LA COMPILATION — un rôle ajouté sans gabarit ne compile pas.
 *
 * NE JAMAIS garder sur la clé nue : `valeur` est un mot français courant, et une
 * invite disant « la valeur du personnage » satisferait `includes('valeur')` sans
 * rien demander au modèle. C'est le GABARIT que l'invite incruste, et la SEULE
 * chose sur laquelle le garde a le droit de porter.
 *
 * DUPLIQUÉ dans `worker/index.ts` — aucun import `worker/` → `src/brain/`, qui
 * traînerait du code client dans le paquet wrangler : la liaison est un BALAYAGE
 * DE SOURCE (`worker/frontiere.test.ts`), jamais un import de production.
 * ⚠ FORME D'ÉCRITURE IMPOSÉE, identique des DEUX côtés : une entrée par ligne, une
 * tabulation d'indentation, guillemets simples, virgule finale — c'est ce que
 * l'expression ancrée du test extrait.
 */
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

/** CINQ motifs, un par prédicat qui peut échouer — l'écran ne rend qu'UN texte
 *  pour toute la famille, mais le motif existe pour que chaque prédicat se prouve
 *  seul. PAS de `'trop-long'` ici : la longueur de la prose n'est pas validée
 *  (doctrine de famille, `dossier/types.ts` — trois proses délibérément non
 *  bornées, KR-203). `'rang-inconnu'` est propre au rôle détenteurs : il localise
 *  un mutant qui casserait spécifiquement l'APPARTENANCE, là où `'schema'` couvre
 *  la forme. */
export type MotifIllisible = 'schema' | 'vide' | 'marqueur' | 'identifiant' | 'rang-inconnu'

/**
 * LE SCANNER ANTI-IDENTIFIANT — forme LÂCHE ∩ APPARTENANCE.
 *
 * `FORME_IDENTIFIANT` (`identifiers.ts`) n'est PAS réutilisable ici : elle est
 * ANCRÉE `^…$`, donc inerte sur de la prose — un balayage écrit avec elle serait
 * toujours vert (KR-235, mesuré). Le motif ci-dessous est DÉRIVÉ du même registre
 * `ESPACES_DE_NOMS` (KR-117, jamais re-listé) mais sans ancre.
 *
 * Seule, la forme fait des FAUX POSITIFS mesurés sur de la prose française saine
 * (`objet.favori`) : `fin`, `lieu`, `objet`, `indice`, `climat`, `jalon`,
 * `objectif` sont des mots courants. Seule, l'appartenance ne suffit pas non plus
 * — il faut bien découper des candidats dans la phrase. C'est le CROISEMENT qui
 * discrimine.
 *
 * Le resserrage « exiger un chiffre ou un tiret dans le suffixe » est REFUSÉ :
 * il laisse échapper `lieu.amorce`, semé par `construireAmorce` dans TOUT dossier
 * créé, qui ne porte ni chiffre ni tiret.
 *
 * LIMITE CONNUE, non comblée : la casse. `'Objet.favori-2'` en début de phrase ne
 * matche pas, l'alternation étant en minuscules. Risque jugé faible (un modèle
 * recopie un chemin en minuscules), mais c'est une limite, pas un trou comblé.
 */
const FORME_LACHE_IDENTIFIANT = new RegExp(`\\b(${Object.keys(ESPACES_DE_NOMS).join('|')})\\.[a-z0-9-]+`, 'g')

/** Les identifiants réellement portés par ce dossier. `collectIds` est total et
 *  pur, et `dossier` est déjà un paramètre de `demander` : le coût est un `Set`. */
function identifiantsDuDossier(dossier: Dossier): Set<string> {
	const connus = new Set<string>()
	for (const collecte of collectIds(dossier)) {
		if (collecte.id !== null) connus.add(collecte.id)
	}
	return connus
}

/** VRAI quand la prose porte une sous-chaîne de forme identifiant QUI EST un
 *  identifiant de ce dossier. Exporté pour que les canaris et les trois mutants
 *  du plan (§ 4 ter) puissent l'éprouver seule, sans passer par les cinq autres
 *  prédicats. */
export function porteUnIdentifiant(texte: string, dossier: Dossier): boolean {
	const connus = identifiantsDuDossier(dossier)
	for (const trouve of texte.matchAll(FORME_LACHE_IDENTIFIANT)) {
		if (connus.has(trouve[0])) return true
	}
	return false
}

function estObjetSimple(valeur: unknown): valeur is Record<string, unknown> {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * Les SIX prédicats de forme, dans l'ordre. Valide la FORME, jamais la PROSE
 * (KR-229). `dossier` sert au scanner d'appartenance.
 *
 * Une clé EN TROP est un REFUS, jamais un champ ignoré : c'est le signal KR-236
 * lui-même — le jour où l'invite du worker demande autre chose que
 * `GABARIT_SORTIE`, c'est ici que ça se voit.
 *
 * La branche de SUCCÈS est typée `{ ok: true } & PropositionRendue` et non
 * `{ ok: true; valeur: string }` : structurellement le même type, mais il passe
 * par le SEUL endroit qui décrit la forme réseau. C'est ce qui donne un
 * consommateur à `PropositionRendue` — sans quoi elle serait une déclaration sans
 * appelant (KR-109) que rien n'obligerait à suivre le schéma le jour où il gagne
 * une clé. Sortir d'ici une forme de succès plus large que la forme réseau
 * deviendrait alors une erreur de compilation, pas une divergence silencieuse.
 */
export function validerSortie(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & PropositionRendue) | { ok: false; motif: MotifIllisible } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE.length || !CLES_SORTIE.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) chaque clé du schéma porte une CHAÎNE — piloté par `CLES_SORTIE`.
	if (!CLES_SORTIE.every((cle) => typeof brut[cle] === 'string')) return { ok: false, motif: 'schema' }

	const valeur = brut[CLES_SORTIE[0]] as string

	// (4) non vide une fois les blancs retirés.
	if (valeur.trim().length === 0) return { ok: false, motif: 'vide' }

	// (5) pas le marqueur d'amorce — constante IMPORTÉE, jamais recopiée (KR-223).
	//     `includes` et non `startsWith` : l'auteur peut éditer autour, et les
	//     chevrons `⟨ ⟩` ne se tapent pas au clavier, donc pas de faux positif.
	if (valeur.includes(MARQUEUR_A_ECRIRE)) return { ok: false, motif: 'marqueur' }

	// (6) aucun identifiant du dossier.
	if (porteUnIdentifiant(valeur, dossier)) return { ok: false, motif: 'identifiant' }

	return { ok: true, valeur }
}

/**
 * LES PRÉDICATS DE FORME de la sortie `indice-detenteurs`. `rangsConnus` vient de
 * `ContexteDetenteurs.rangs` : le validateur ne CALCULE aucun rang, il constate une
 * APPARTENANCE.
 *
 * Le type de retour dit littéralement ce qui est atteignable. `'vide'`, `'marqueur'`
 * et `'identifiant'` sont SANS OBJET ici et ne sont PAS « rejoués par symétrie » :
 * aucune prose n'est rendue par ce rôle, et un jeton qui passe l'appartenance est
 * l'une de NOS PROPRES chaînes — `porteUnIdentifiant` n'a aucune cible et n'entre
 * pas dans cette fonction. Les écrire serait du code mort présenté comme de la
 * couverture (famille BUG-084, KR-235). Le scanner reste INTACT sur `validerSortie`.
 *
 * Les prédicats, dans l'ordre, chacun prouvé seul :
 *   (1) objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2) clés = EXACTEMENT `CLES_SORTIE_DETENTEURS` ............. 'schema'
 *   (3) `Array.isArray(brut.detenteurs)` ....................... 'schema'
 *   (4) chaque élément est une CHAÎNE .......................... 'schema'
 *   (5) longueur ≤ `PROPOSITIONS_MAX` — une liste de 6 est un
 *       REFUS, jamais une troncature ........................... 'schema'
 *   (6) éléments DISTINCTS (deux savoirs identiques sinon) ..... 'schema'
 *   (7) chaque élément ∈ `rangsConnus` .................. 'rang-inconnu'
 *
 * LA LISTE VIDE EST UN SUCCÈS. Le prédicat de non-vacuité de l'it1 NE SE TRANSPORTE
 * PAS : il portait sur une prose SCALAIRE, où le vide est une non-réponse ; sur une
 * LISTE, le vide EST une réponse. Punir la réponse honnête est une machine à
 * complaisance — un modèle qui ne peut pas dire « personne » nommera quelqu'un.
 *
 * Hors bornes, malformé, doublon, `2.5`, `-1`, `"toto"` : le LOT ENTIER est refusé,
 * donc rejeu une fois puis état terminal. Accepter les rangs valides et jeter les
 * autres serait une réparation silencieuse — l'auteur ratifierait une liste tronquée
 * sans savoir qu'elle l'est (§ 8, TL-6).
 *
 * AUCUNE CONVERSION NUMÉRIQUE : ni `Number`, ni `parseInt`, ni indexation
 * arithmétique. L'appartenance est un `Set.has` sur la chaîne telle quelle, et c'est
 * ce qui supprime la classe entière des décalages base-0 / base-1.
 */
export function validerDetenteurs(
	brut: unknown,
	rangsConnus: ReadonlySet<RangInjecte>,
): ({ ok: true } & DetenteursRendus) | { ok: false; motif: 'schema' | 'rang-inconnu' } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE_DETENTEURS`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE_DETENTEURS.length || !CLES_SORTIE_DETENTEURS.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la clé du schéma porte un TABLEAU — piloté par `CLES_SORTIE_DETENTEURS`.
	const rendus: unknown = brut[CLES_SORTIE_DETENTEURS[0]]
	if (!Array.isArray(rendus)) return { ok: false, motif: 'schema' }

	// (4) chaque élément est une CHAÎNE. Un NOMBRE `1` est ici — et c'est le motif du
	//     préfixe `P` : le jeton ne ressemble à aucun entier, donc le modèle n'est
	//     jamais invité à en émettre un.
	if (!rendus.every((element): element is string => typeof element === 'string')) {
		return { ok: false, motif: 'schema' }
	}

	// (5) la BORNE DE SORTIE — un REFUS, jamais une troncature (KR-230).
	if (rendus.length > PROPOSITIONS_MAX) return { ok: false, motif: 'schema' }

	// (6) éléments DISTINCTS — deux fois le même rang écrirait deux savoirs
	//     identiques sur le même personnage.
	if (new Set(rendus).size !== rendus.length) return { ok: false, motif: 'schema' }

	// (7) APPARTENANCE — le LOT ENTIER est refusé sur un seul élément fautif.
	if (!rendus.every((rang) => rangsConnus.has(rang))) return { ok: false, motif: 'rang-inconnu' }

	return { ok: true, detenteurs: rendus }
}
