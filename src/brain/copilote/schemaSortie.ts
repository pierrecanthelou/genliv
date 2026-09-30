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
import { COMMANDES } from '../dossier/commandes'
import { ESPACES_DE_NOMS, collectIds } from '../dossier/identifiers'
import type { Dossier } from '../dossier/types'
import type {
	ConstatRendu,
	DetenteursRendus,
	DistributionRendue,
	FicheReseau,
	InterpretationRendue,
	IntentionRendue,
	NarrationRendue,
	PropositionRendue,
	RangInjecte,
	RapportRendu,
	RapportsRendus,
	RepliquesRendues,
	RoleCopilote,
	TablesInterprete,
} from './types'

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

/** L'équivalent pour le rôle `personnage-repliques`. TROIS registres LITTÉRAUX, et
 *  toujours pas un registre paramétré : `Record<RoleCopilote, …>` n'est légitime que
 *  si CHAQUE rôle a une entrée qui VEUT DIRE quelque chose — faux ici, le rôle prose
 *  n'a pas de liste et son entrée serait un mensonge (§ 8, TL3a-6). */
export const CLES_SORTIE_REPLIQUES = ['repliques'] as const

/** LA FORME DE LA RÉPONSE ATTENDUE — combien de répliques le modèle a le droit de
 *  proposer. Même statut que `max_tokens` : ce n'est ni une règle du jeu ni une règle
 *  du dossier, et elle dérive `max_tokens` (worker).
 *
 *  ⚠ CE N'EST PAS `PARLER_REPLIQUES` (= 2, `dossier/curseurs.ts`) et elle ne s'y
 *  aligne JAMAIS. Le nombre de propositions ACCEPTABLES vaut
 *  `PARLER_REPLIQUES − parler.length` et VARIE d'un personnage à l'autre :
 *  `PARLER_REPLIQUES` n'est même pas une constante du point de vue de l'invite.
 *  Borner le validateur à 2 refuserait `schema` une réponse CONFORME à une invite qui
 *  en demande trois — rejeu, terminal, et RIEN NE ROUGIT.
 *  CE FICHIER N'IMPORTE JAMAIS `PARLER_REPLIQUES`.
 *
 *  ⚠ CE N'EST PAS `PROPOSITIONS_MAX` non plus : celle-ci borne le rôle détenteurs et
 *  dérive SON `max_tokens`. Même valeur aujourd'hui, aucune raison commune d'évoluer
 *  — les partager coupleraient deux formes de réponse sans motif. */
export const REPLIQUES_PROPOSEES_MAX = 3

/** L'équivalent pour le rôle `personnage-plan`. QUATRE registres LITTÉRAUX, et
 *  toujours pas un registre paramétré (§ 8, TL3a-6) : le rôle prose n'a pas de
 *  liste et son entrée serait un mensonge. */
export const CLES_SORTIE_PLAN = ['intention'] as const

/** L'équivalent pour le rôle `personnage-relations`. CINQ registres LITTÉRAUX, et
 *  toujours pas un registre paramétré (§ 8, n° 25, 5ᵉ refus) : le rôle prose n'a pas
 *  de liste et son entrée serait un mensonge.
 *
 *  ⚠ `rapports`, et JAMAIS `liens` : `liens` est le PLURIEL EXACT du champ `lien`,
 *  donc nommer le champ — veto de l'itération 3b — plus la confusion À UNE LETTRE que
 *  KR-231 ferme. Les quatre clés livrées avant celle-ci diffèrent toutes de leur champ
 *  de destination ; un quasi-synonyme est légitime, le mot du champ non.
 *
 *  ⚠ SON GABARIT MONTRE `P1` PUIS `P3`, et ce n'est pas une coquille : les rangs sont
 *  des ADRESSES, jamais un ordre à parcourir. Un gabarit `P1`,`P2` inviterait le
 *  modèle à répondre « les premiers de la liste » plutôt que « ceux-là ». */
export const CLES_SORTIE_RELATIONS = ['rapports'] as const

/** Les DEUX clés d'un ÉLÉMENT de `rapports` — le SECOND niveau de schéma, que les
 *  quatre rôles précédents n'avaient pas : leurs listes portaient des scalaires.
 *  Le validateur est PILOTÉ par cette liste, exactement comme il l'est par
 *  `CLES_SORTIE_RELATIONS` au premier niveau : une seule source, aucune dérive.
 *  NON exportée — son seul consommateur est le validateur ci-dessous. */
const CLES_RAPPORT = ['envers', 'nature'] as const

/** LA BORNE DE SORTIE du rôle `personnage-relations` — combien de relations le
 *  modèle a le droit de proposer d'un seul jet. Même statut que `max_tokens` : ni
 *  règle du jeu, ni règle du dossier, c'est la FORME DE LA RÉPONSE ATTENDUE.
 *
 *  ⚠ ELLE N'EST PAS PARTAGÉE avec `PROPOSITIONS_MAX` ni `REPLIQUES_PROPOSEES_MAX`
 *  (§ 8, n° 26) : même valeur aujourd'hui, AUCUNE raison commune d'évoluer — les
 *  partager coupleraient trois formes de réponse sans motif.
 *  ⚠ ELLE NE BORNE PAS LE DOCUMENT : `relations[]` n'a AUCUN plafond de schéma, et
 *  la borne contraint la PROPOSITION, jamais ce que l'auteur peut écrire à la main. */
export const RELATIONS_PROPOSEES_MAX = 3

/** L'équivalent pour le rôle `monde-distribution`. SIX registres LITTÉRAUX, et toujours
 *  pas un registre paramétré (§ 8, n° 25, 6ᵉ refus) : le rôle prose n'a pas de liste.
 *  ⚠ `distribution`, et JAMAIS `personnages` — NOM DE LA COLLECTION, donc nommer le
 *  champ (veto 3b) — ni `fiches`, mot d'écran. C'est LE MOT DE LA DÉMO. */
export const CLES_SORTIE_DISTRIBUTION = ['distribution'] as const

/** Les DEUX clés d'un ÉLÉMENT de `distribution` — SECOND niveau de schéma, le deuxième
 *  du dépôt après `CLES_RAPPORT`. Le validateur en est PILOTÉ : une seule source.
 *  NON exportée — son seul consommateur est le validateur ci-dessous. */
const CLES_FICHE = ['place', 'poursuite'] as const

/** LA BORNE DE SORTIE du rôle `monde-distribution`. Même statut que `max_tokens` : ni
 *  règle du jeu ni règle du dossier, c'est la FORME DE LA RÉPONSE ATTENDUE.
 *  ⚠ NON PARTAGÉE avec les trois autres bornes (§ 8, n° 42, 7ᵉ refus) : même valeur
 *  aujourd'hui, aucune raison commune d'évoluer. ⚠ ELLE NE BORNE PAS LE DOCUMENT —
 *  `monde.personnages[]` n'a aucun plafond de schéma. */
export const FICHES_PROPOSEES_MAX = 3

/** ⚠ AUCUNE CONSTANTE DE BORNE POUR LE RÔLE PLAN, et c'est délibéré — ne pas en ajouter
 *  une « par symétrie » avec `PROPOSITIONS_MAX` / `REPLIQUES_PROPOSEES_MAX`.
 *  La sortie est SCALAIRE : « deux » est NON REPRÉSENTABLE. Une liste bornée à un
 *  l'aurait rendu représentable et ne l'aurait interdit que par une constante —
 *  LA MEILLEURE GARDE EST CELLE QUI N'EXISTE PAS. Ni `ETAPES_PROPOSEES_MAX`, ni
 *  `INTENTIONS_PROPOSEES_MAX` : il n'y a rien à borner.
 *  Conséquence à ne pas « réparer » non plus : le garde « la borne de l'invite est
 *  celle du validateur » (`worker/frontiere.test.ts`) ne s'applique pas à ce rôle —
 *  son symétrique y est écrit à la place : son invite n'annonce AUCUNE borne. */

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
	'personnage-repliques': '{"repliques": ["…", "…"]}',
	'personnage-plan': '{"intention": "…"}',
	'personnage-relations': '{"rapports": [{"envers": "P1", "nature": "…"}, {"envers": "P3", "nature": "…"}]}',
	'monde-distribution': '{"distribution": [{"place": "…", "poursuite": "…"}, {"place": "…", "poursuite": "…"}]}',
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

/** LE SECOND NIVEAU DE SCHÉMA — un ÉLÉMENT de `rapports` est un objet simple dont
 *  l'ensemble des clés vaut EXACTEMENT `CLES_RAPPORT`. PRIMITIVE PARTAGÉE avec le
 *  premier niveau (`estObjetSimple`), jamais un corps paramétré par le rôle : une
 *  clé en trop y est un REFUS au même titre qu'au premier niveau, parce que c'est le
 *  signal KR-236 — le jour où l'invite du worker demande autre chose que
 *  `GABARIT_SORTIE`, c'est ici que ça se voit. */
function estRapportBrut(element: unknown): element is Record<string, unknown> {
	if (!estObjetSimple(element)) return false
	const cles = Object.keys(element)
	return cles.length === CLES_RAPPORT.length && CLES_RAPPORT.every((cle) => cles.includes(cle))
}

/** Un ÉLÉMENT de `distribution` : objet simple dont les clés valent EXACTEMENT
 *  `CLES_FICHE`. PRIMITIVE PARTAGÉE avec le premier niveau (`estObjetSimple`), jamais
 *  un corps paramétré par le rôle. Elle porte les prédicats (4) ET (12) : `cles.length`
 *  refuse la clé EN TROP — signal KR-236 au second niveau — et `every(includes)` la clé
 *  MANQUANTE ; les deux moitiés se prouvent séparément. */
function estFicheBrute(element: unknown): element is Record<string, unknown> {
	if (!estObjetSimple(element)) return false
	const cles = Object.keys(element)
	return cles.length === CLES_FICHE.length && CLES_FICHE.every((cle) => cles.includes(cle))
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

/**
 * LES PRÉDICATS DE FORME de la sortie `personnage-repliques` — une LISTE DE PROSE
 * LIBRE, ce qu'aucun des deux rôles précédents ne rendait : l'un rend un scalaire
 * (trois prédicats sur UNE chaîne), l'autre une liste de JETONS (aucun prédicat de
 * prose). Ce rôle-ci applique les prédicats de prose à CHACUN des N, plus quatre
 * prédicats de liste. Ce qui est partagé est une PRIMITIVE (`porteUnIdentifiant`,
 * `estObjetSimple`), jamais un corps paramétré par le rôle (§ 8, TL3a-8).
 *
 * `MotifIllisible` est INCHANGÉE — aucun membre neuf. Le type de retour ne nomme que
 * les motifs ATTEIGNABLES : `'rang-inconnu'` est SANS OBJET ici (aucun jeton, aucune
 * table d'appartenance), et l'écrire serait du code mort présenté comme de la
 * couverture (famille BUG-084, KR-235).
 *
 * LA LISTE VIDE EST UN REFUS, et « la liste vide est un succès » de l'it2 NE SE
 * TRANSPORTE PAS. Le discriminant est DÉSIGNATION vs RÉDACTION : un rôle de
 * DÉSIGNATION choisit dans un ensemble fermé QUE LE CONTEXTE A FOURNI — la question
 * porte sur un fait du monde, « personne » en est une réponse VRAIE. Un rôle de
 * RÉDACTION écrit un texte QUE RIEN NE FOURNIT — « comment parle-t-il ? » a toujours
 * une réponse dès qu'il existe quelqu'un pour parler, donc « je n'écris rien » est
 * une NON-RÉPONSE, motif `'vide'`. Le cas « il n'y a personne pour parler » est
 * traité AVANT l'appel, par le refus `'cible-a-ecrire'` de `contexte.ts`.
 * Test de rattachement, décidable sans rouvrir le débat : le rôle rend-il des JETONS
 * QUE LE CONTEXTE A FOURNIS (désignation) ou de la PROSE QUE RIEN NE FOURNIT
 * (rédaction) ?
 *
 * Les DIX prédicats, dans l'ordre, chacun prouvable seul :
 *   (1)  objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2)  clés = EXACTEMENT `CLES_SORTIE_REPLIQUES` — une clé EN
 *        TROP est un REFUS, jamais un champ ignoré ............. 'schema'
 *   (3)  `Array.isArray(brut.repliques)` ....................... 'schema'
 *   (4)  chaque élément est une CHAÎNE — un `{texte:"…"}` emballé
 *        meurt ici, et JAMAIS `String(élément)` ................ 'schema'
 *   (5)  longueur ≤ `REPLIQUES_PROPOSEES_MAX` — un REFUS, jamais
 *        une troncature (KR-230) .............................. 'schema'
 *   (6)  longueur ≥ 1 ........................................... 'vide'
 *   (7)  chaque élément non vide après `trim()` ................. 'vide'
 *   (8)  éléments DISTINCTS après `trim()` .................... 'schema'
 *   (9)  aucun `MARQUEUR_A_ECRIRE` (constante IMPORTÉE, KR-223) 'marqueur'
 *   (10) aucun identifiant du dossier ................... 'identifiant'
 *
 * MOTIF DU (8) — deux répliques identiques sont un REMPLISSAGE : un menu de 2
 * présenté comme un menu de 3, produit par un modèle qui « complète » pour atteindre
 * la borne. Et `PARLER_REPLIQUES` est un plafond serré : un doublon accepté consomme
 * l'un des deux seuls emplacements pour rien — c'est bien une conséquence d'écriture.
 *
 * SCANNER PAR ÉLÉMENT (`.some`), REFUS PAR LOT. JAMAIS de `join` avant de scanner :
 * deux fragments logés dans deux cases DISTINCTES ne forment pas un identifiant —
 * aucun lecteur ne les lira collés, ils deviennent deux entrées séparées de
 * `parler[]` — et joindre DÉTRUIT LA LOCALISATION de l'élément fautif tout en
 * fabriquant un faux positif à la frontière des deux éléments (§ 8, n° 22).
 *
 * Et REFUS DU LOT ENTIER sur un seul élément fautif : écarter les fautifs en gardant
 * les autres serait une réparation silencieuse — l'auteur ratifierait une liste
 * amputée sans le savoir (§ 8, TL3a-10). Réparer, c'est interpréter (KR-230).
 */
export function validerRepliques(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & RepliquesRendues) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE_REPLIQUES`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE_REPLIQUES.length || !CLES_SORTIE_REPLIQUES.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la clé du schéma porte un TABLEAU — piloté par `CLES_SORTIE_REPLIQUES`.
	const rendues: unknown = brut[CLES_SORTIE_REPLIQUES[0]]
	if (!Array.isArray(rendues)) return { ok: false, motif: 'schema' }

	// (4) chaque élément est une CHAÎNE. Un `{texte: "…"}` emballé meurt ici — et
	//     JAMAIS `String(élément)`, qui fabriquerait `'[object Object]'` et le
	//     présenterait ensuite à l'auteur comme une réplique.
	if (!rendues.every((element): element is string => typeof element === 'string')) {
		return { ok: false, motif: 'schema' }
	}

	// (5) la BORNE DE SORTIE — un REFUS, jamais une troncature (KR-230).
	if (rendues.length > REPLIQUES_PROPOSEES_MAX) return { ok: false, motif: 'schema' }

	// (6) la liste vide est une NON-RÉPONSE de rédaction.
	if (rendues.length === 0) return { ok: false, motif: 'vide' }

	// (7) aucun élément vide une fois les blancs retirés. PAR ÉLÉMENT : un blanc en
	//     position 2 est aussi fautif qu'en position 0.
	if (rendues.some((replique) => replique.trim().length === 0)) return { ok: false, motif: 'vide' }

	// (8) éléments DISTINCTS après `trim()` — le remplissage, refusé.
	const normalisees = rendues.map((replique) => replique.trim())
	if (new Set(normalisees).size !== normalisees.length) return { ok: false, motif: 'schema' }

	// (9) aucun marqueur d'amorce — constante IMPORTÉE, jamais recopiée (KR-223).
	//     `includes` et non `startsWith` : les chevrons `⟨ ⟩` ne se tapent pas au
	//     clavier, donc pas de faux positif.
	if (rendues.some((replique) => replique.includes(MARQUEUR_A_ECRIRE))) return { ok: false, motif: 'marqueur' }

	// (10) aucun identifiant du dossier. PAR ÉLÉMENT, JAMAIS sur un `join` : voir la
	//      docstring. Le LOT ENTIER tombe sur un seul élément fautif, où qu'il soit.
	if (rendues.some((replique) => porteUnIdentifiant(replique, dossier))) return { ok: false, motif: 'identifiant' }

	return { ok: true, repliques: rendues }
}

/**
 * LES PRÉDICATS DE FORME de la sortie `personnage-plan` — un SCALAIRE, et son
 * ancêtre est donc `validerSortie` (rôle PROSE, SIX prédicats), JAMAIS
 * `validerRepliques` (liste, DIX). La sortie n'étant pas une liste, les quatre
 * prédicats de liste — `Array.isArray`, la borne, la non-vacuité de liste, les
 * éléments distincts — n'ont AUCUN sujet ici : les écrire serait recopier le
 * mauvais ancêtre, c'est-à-dire du code mort présenté comme de la couverture
 * (famille BUG-084, KR-235).
 *
 * `MotifIllisible` est INCHANGÉE — aucun membre neuf. Le type de retour ne nomme que
 * les motifs ATTEIGNABLES : `'rang-inconnu'` est SANS OBJET ici (aucun jeton, aucune
 * table d'appartenance).
 *
 * Les SIX prédicats, dans l'ordre, chacun prouvable SEUL :
 *   (1) objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2) clés = EXACTEMENT `CLES_SORTIE_PLAN` — une clé EN TROP
 *       est un REFUS, jamais un champ ignoré .................. 'schema'
 *   (3) la clé porte une CHAÎNE ................................ 'schema'
 *   (4) non vide après `trim()` .................................. 'vide'
 *   (5) aucun `MARQUEUR_A_ECRIRE` (constante IMPORTÉE, KR-223) 'marqueur'
 *   (6) aucun identifiant du dossier .................... 'identifiant'
 *
 * ⚠ LE PRÉDICAT (3) EST LA GARDE DE KR-230, ET IL SE PROUVE PAR UN MUTANT.
 * `{"intention": ["a","b"]}` est REFUSÉ `'schema'` — jamais coercé, JAMAIS `[0]`.
 * Repêcher le premier élément d'un tableau serait une réparation silencieuse :
 * l'auteur ratifierait d'un clic une intention dont il ne saurait pas qu'elle a été
 * choisie par le code. Et JAMAIS `String(brut.intention)` non plus, qui fabriquerait
 * `'a,b'` ou `'[object Object]'` et le présenterait comme une étape. Réparer, c'est
 * interpréter (KR-230).
 *
 * LA CHAÎNE VIDE EST UN REFUS `'vide'`, et le test de rattachement de l'it3a
 * s'applique : ce rôle rend DE LA PROSE QUE RIEN NE FOURNIT ⇒ RÉDACTION ⇒ la
 * non-réponse est un refus. Le cas « il n'y a rien à prolonger » est traité AVANT
 * l'appel, par le refus `'cible-a-ecrire'` de `contexte/plan.ts`.
 */
export function validerIntention(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & IntentionRendue) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE_PLAN`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE_PLAN.length || !CLES_SORTIE_PLAN.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la clé du schéma porte une CHAÎNE — piloté par `CLES_SORTIE_PLAN`. Un
	//     TABLEAU meurt ici, et JAMAIS `[0]`, JAMAIS `String(…)`.
	if (!CLES_SORTIE_PLAN.every((cle) => typeof brut[cle] === 'string')) return { ok: false, motif: 'schema' }

	const intention = brut[CLES_SORTIE_PLAN[0]] as string

	// (4) non vide une fois les blancs retirés.
	if (intention.trim().length === 0) return { ok: false, motif: 'vide' }

	// (5) pas le marqueur d'amorce — constante IMPORTÉE, jamais recopiée (KR-223).
	//     `includes` et non `startsWith` : les chevrons `⟨ ⟩` ne se tapent pas au
	//     clavier, donc pas de faux positif.
	if (intention.includes(MARQUEUR_A_ECRIRE)) return { ok: false, motif: 'marqueur' }

	// (6) aucun identifiant du dossier — `porteUnIdentifiant` réutilisée TELLE QUELLE
	//     (KR-117), jamais une seconde écriture du scanner.
	if (porteUnIdentifiant(intention, dossier)) return { ok: false, motif: 'identifiant' }

	return { ok: true, intention }
}

/**
 * LES PRÉDICATS DE FORME de la sortie `personnage-relations` — LE PREMIER RÔLE MIXTE :
 * chaque élément porte un JETON de désignation (`envers`, mécanisme de l'it2) ET de la
 * PROSE (`nature`, mécanisme de 3a/3b). Aucun des quatre rôles précédents ne rendait
 * les deux, et c'est ce qui donne à ce validateur DEUX niveaux de schéma là où les
 * autres n'en ont qu'un.
 *
 * ⚠ PREMIER VALIDATEUR DONT LE TYPE DE RETOUR NOMME `MotifIllisible` EN ENTIER, et les
 * CINQ motifs y sont ATTEIGNABLES — `'rang-inconnu'` par le prédicat (12), les quatre
 * autres par les prédicats de forme et de prose. C'est la PREUVE qu'aucun prédicat
 * n'est mort, pas une affirmation : le type ne nomme que ce qui peut sortir.
 *
 * RÈGLE DE TRANCHAGE DU CAS MIXTE, écrite pour qu'on ne la re-dérive pas — un rôle qui
 * rend à la fois un jeton et de la prose se range selon CE QUE L'ACCEPTATION D'UN
 * ÉLÉMENT ÉCRIT AU DOSSIER : une prose RÉDIGÉE PAR LE MODÈLE ⇒ RÉDACTION ⇒ liste vide
 * = REFUS ; des handles re-résolus et des valeurs posées par le code ⇒ DÉSIGNATION ⇒
 * liste vide = SUCCÈS. `Relation.lien` est écrit par le modèle, donc RÉDACTION, donc
 * LA LISTE VIDE EST UN REFUS `'vide'` (prédicat 7).
 * ⚠ LE CRITÈRE PORTE SUR « RÉDIGÉE PAR LE MODÈLE », JAMAIS SUR L'AUDIENCE `'ia'` :
 * `savoirs[].certitude` EST `'ia'` alors que le rôle détenteurs, qui l'écrit, est une
 * DÉSIGNATION — le code la pose. Un critère écrit « champ `ia` » classerait détenteurs
 * en rédaction et CONTREDIRAIT UN RÔLE LIVRÉ.
 *
 * LES DOUZE PRÉDICATS, dans l'ordre, chacun prouvable SEUL :
 *   (1)  objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2)  clés = EXACTEMENT `CLES_SORTIE_RELATIONS` .............. 'schema'
 *   (3)  `Array.isArray(brut.rapports)` ........................ 'schema'
 *   (4)  chaque élément est un objet simple dont les clés valent
 *        EXACTEMENT `CLES_RAPPORT` — une clé en trop est un REFUS,
 *        jamais un champ ignoré ................................ 'schema'
 *   (5)  les DEUX valeurs sont des CHAÎNES — un tableau meurt
 *        ici, et JAMAIS `[0]`, JAMAIS `String(…)` .............. 'schema'
 *   (6)  longueur ≤ `RELATIONS_PROPOSEES_MAX` — un REFUS,
 *        jamais une troncature (KR-230) ........................ 'schema'
 *   (7)  longueur ≥ 1 ........................................... 'vide'
 *   (8)  chaque `nature` non vide après `trim()` ................ 'vide'
 *   (9)  `envers` DISTINCTS .................................... 'schema'
 *   (10) aucun `MARQUEUR_A_ECRIRE` (constante IMPORTÉE, KR-223) 'marqueur'
 *   (11) aucun identifiant du dossier, PAR ÉLÉMENT ....... 'identifiant'
 *   (12) chaque `envers` ∈ `rangsConnus` ................ 'rang-inconnu'
 *
 * ⚠ LE PRÉDICAT (9) PORTE SUR `envers`, JAMAIS SUR `nature` (§ 8, n° 45) : DEUX FRÈRES
 * PORTENT LÉGITIMEMENT LE MÊME LIEN, et un prédicat « natures distinctes » refuserait
 * une réponse juste. Écrit ici pour que personne ne « symétrise » avec les prédicats de
 * doublon des rôles détenteurs et répliques, qui, eux, portent sur la seule valeur
 * qu'un élément ait.
 *
 * ⚠ `envers` N'EST JAMAIS PASSÉ À `porteUnIdentifiant` (§ 8, n° 21, veto des deux
 * postes à effort élevé) : le jeton est L'UNE DE NOS PROPRES CHAÎNES, et son
 * appartenance est constatée par le prédicat (12). L'y passer serait du code mort
 * présenté comme de la couverture (famille BUG-084, KR-235). De même pour (10) : le
 * marqueur d'amorce est un marqueur de PROSE, il n'a pas de sujet sur un jeton.
 *
 * ⚠ SCANNER PAR ÉLÉMENT, REFUS PAR LOT. JAMAIS de `join` avant de scanner : deux
 * fragments logés dans deux `nature` DISTINCTES ne forment pas un identifiant — ils
 * deviennent deux relations séparées —, et joindre DÉTRUIT LA LOCALISATION tout en
 * fabriquant un faux positif à la frontière des deux éléments.
 *
 * REFUS DU LOT ENTIER sur un seul élément fautif : accepter `envers` en jetant
 * `nature` ferait RATIFIER UNE RELATION À MOITIÉ INVENTÉE PAR LE CODE, et écarter les
 * fautifs en gardant les autres serait une réparation silencieuse — l'auteur
 * ratifierait une liste amputée sans le savoir. Réparer, c'est interpréter (KR-230).
 *
 * `rangsConnus` vient de `ContexteDetenteurs.rangs` (rendue par `assemblerRelations`) :
 * le validateur ne CALCULE aucun rang, il constate une APPARTENANCE — et AUCUNE
 * conversion numérique nulle part, l'appartenance est un `Set.has` sur la chaîne telle
 * quelle.
 */
export function validerRelations(
	brut: unknown,
	rangsConnus: ReadonlySet<RangInjecte>,
	dossier: Dossier,
): { ok: true; sortie: RapportsRendus } | { ok: false; motif: MotifIllisible } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE_RELATIONS`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE_RELATIONS.length || !CLES_SORTIE_RELATIONS.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la clé du schéma porte un TABLEAU — piloté par `CLES_SORTIE_RELATIONS`.
	const rendus: unknown = brut[CLES_SORTIE_RELATIONS[0]]
	if (!Array.isArray(rendus)) return { ok: false, motif: 'schema' }
	const elements: unknown[] = rendus

	// (4) chaque élément est un objet simple dont les clés valent EXACTEMENT
	//     `CLES_RAPPORT`. Une chaîne nue, un `null`, un tableau ou une clé en trop
	//     meurent ici : c'est le SECOND niveau du signal KR-236.
	if (!elements.every(estRapportBrut)) return { ok: false, motif: 'schema' }

	// (5) les DEUX valeurs sont des CHAÎNES — piloté par `CLES_RAPPORT`. Un TABLEAU
	//     meurt ici, et JAMAIS `[0]`, JAMAIS `String(…)` : repêcher ou coercer ferait
	//     ratifier à l'auteur une valeur que LE CODE aurait choisie.
	if (!elements.every((element) => CLES_RAPPORT.every((cle) => typeof element[cle] === 'string'))) {
		return { ok: false, motif: 'schema' }
	}
	const rapports: RapportRendu[] = elements.map((element) => ({
		envers: element[CLES_RAPPORT[0]] as string,
		nature: element[CLES_RAPPORT[1]] as string,
	}))

	// (6) la BORNE DE SORTIE — un REFUS, jamais une troncature (KR-230).
	if (rapports.length > RELATIONS_PROPOSEES_MAX) return { ok: false, motif: 'schema' }

	// (7) la liste vide est une NON-RÉPONSE de rédaction — voir la règle de tranchage
	//     du cas mixte, en tête de fonction.
	if (rapports.length === 0) return { ok: false, motif: 'vide' }

	// (8) aucune `nature` vide une fois les blancs retirés. PAR ÉLÉMENT : un blanc en
	//     position 2 est aussi fautif qu'en position 0.
	if (rapports.some((rapport) => rapport.nature.trim().length === 0)) return { ok: false, motif: 'vide' }

	// (9) `envers` DISTINCTS — deux fois le même rang écrirait deux relations vers le
	//     même personnage. JAMAIS sur `nature` : deux frères portent légitimement le
	//     même lien.
	const designes = rapports.map((rapport) => rapport.envers)
	if (new Set(designes).size !== designes.length) return { ok: false, motif: 'schema' }

	// (10) aucun marqueur d'amorce dans la prose — constante IMPORTÉE, jamais
	//      recopiée (KR-223). `includes` et non `startsWith` : les chevrons `⟨ ⟩` ne se
	//      tapent pas au clavier, donc pas de faux positif.
	if (rapports.some((rapport) => rapport.nature.includes(MARQUEUR_A_ECRIRE))) return { ok: false, motif: 'marqueur' }

	// (11) aucun identifiant du dossier dans la prose. PAR ÉLÉMENT, JAMAIS sur un
	//      `join` — et JAMAIS sur `envers`, qui est l'une de nos propres chaînes.
	if (rapports.some((rapport) => porteUnIdentifiant(rapport.nature, dossier))) {
		return { ok: false, motif: 'identifiant' }
	}

	// (12) APPARTENANCE — le LOT ENTIER est refusé sur un seul jeton fautif.
	if (!designes.every((envers) => rangsConnus.has(envers))) return { ok: false, motif: 'rang-inconnu' }

	return { ok: true, sortie: { rapports } }
}

/**
 * LES PRÉDICATS DE FORME de la sortie `monde-distribution` — LE PREMIER RÔLE DE
 * CRÉATION : chaque élément est une FICHE ENTIÈRE, deux proses libres dans le même
 * objet, dont l'acceptation fera NAÎTRE une entité. Deux niveaux de schéma comme au
 * rôle relations, mais AUCUN jeton : rien ne désigne rien.
 *
 * ⚠ QUATRE MOTIFS ATTEIGNABLES, PAS CINQ — le type de retour ne nomme que ce qui peut
 * sortir. `'rang-inconnu'` est SANS OBJET (aucun jeton, aucune table d'appartenance) et
 * l'écrire « par symétrie » avec le rôle relations serait du code mort présenté comme
 * de la couverture (famille BUG-084, KR-235). `MotifIllisible` reste INCHANGÉE, et ce
 * sixième validateur NE LA NOMME PAS EN ENTIER : le cinquième reste le seul à le faire.
 *
 * ⚠ LA RÈGLE DE TRANCHAGE DU VIDE, ET IL N'Y A PAS DE TROISIÈME CAS. Critère unique :
 * LA LISTE VIDE PORTE-T-ELLE UNE INFORMATION QUE LE CODE N'A PAS ? DÉSIGNATION — le
 * code a fourni l'ensemble, « aucun ne convient » est UNE RÉPONSE ⇒ SUCCÈS. RÉDACTION —
 * « je n'ai rien écrit » est une NON-EXÉCUTION, le code savait déjà qu'il n'y avait
 * rien ⇒ REFUS. CRÉATION (ici) — ⚠ IL N'EXISTE AUCUN ENSEMBLE DE CANDIDATS À ÉPUISER,
 * motif même pour lequel `'aucun-candidat'` est écarté de ce rôle : SANS ENSEMBLE, LA
 * VACUITÉ NE PEUT RIEN SIGNIFIER ⇒ REFUS `'vide'`. Le troisième cas ne se referme pas
 * par convention, IL N'A PAS D'INSTANCE. Sa moitié SYMÉTRIQUE est la ligne d'invite
 * « trois au plus, et au moins une » : qui renverserait ce prédicat devrait la faire
 * tomber dans le même lot.
 *
 * LES DOUZE PRÉDICATS, dans l'ordre, chacun prouvable SEUL :
 *   (1) objet simple (ni tableau, ni null) ...................... 'schema'
 *   (2) clés = EXACTEMENT `CLES_SORTIE_DISTRIBUTION` ............ 'schema'
 *   (3) `Array.isArray(brut.distribution)` ..................... 'schema'
 *   (4) chaque élément est un objet simple à deux clés .......... 'schema'
 *   (5) les DEUX valeurs sont des CHAÎNES — un tableau meurt
 *       ici, et JAMAIS `[0]`, JAMAIS `String(…)` ............... 'schema'
 *   (6) longueur ≤ `FICHES_PROPOSEES_MAX` — REFUS, jamais une
 *       troncature (KR-230) .................................... 'schema'
 *   (7) longueur ≥ 1 ............................................. 'vide'
 *   (8) les DEUX proses non vides après `trim()` ................. 'vide'
 *   (9) éléments DISTINCTS SUR LE COUPLE ....................... 'schema'
 *  (10) aucun `MARQUEUR_A_ECRIRE` sur les DEUX (KR-223) ....... 'marqueur'
 *  (11) aucun identifiant, par élément ET par champ ....... 'identifiant'
 *  (12) aucune clé EN TROP au SECOND niveau — KR-236 .......... 'schema'
 * (4) et (12) sont les deux moitiés de `estFicheBrute`, prouvées séparément.
 *
 * ⚠ LE PRÉDICAT (9) EST NEUF ET NE SE SYMÉTRISE PAS : il porte sur LE COUPLE, jamais
 * sur une seule clé. DEUX GARDES PARTAGENT LÉGITIMEMENT UNE `place`, deux prétendants
 * une `poursuite` — seul le COUPLE identique est du REMPLISSAGE, et un prédicat sur une
 * seule clé REFUSERAIT UNE RÉPONSE JUSTE. D'où ses TROIS témoins : couple identique ⇒
 * rejet ; même `place`, `poursuite` différente ⇒ accepté ; l'inverse ⇒ accepté. Le
 * `trim()` suit le prédicat de doublon du rôle répliques — deux proses ne diffèrent pas
 * par un blanc de bord.
 *
 * ⚠ SCANNER PAR ÉLÉMENT ET PAR CHAMP, REFUS PAR LOT, JAMAIS de `join` avant le scan :
 * deux fragments logés dans deux champs DISTINCTS ne forment pas un identifiant, et
 * joindre DÉTRUIT LA LOCALISATION en fabriquant un faux positif à la frontière. REFUS
 * DU LOT ENTIER sur un seul élément fautif : repêcher les fiches valides ferait RATIFIER
 * UNE DISTRIBUTION AMPUTÉE SANS QUE L'AUTEUR LE SACHE (KR-230), et accepter `place` en
 * jetant `poursuite` ferait naître une entité à moitié inventée PAR LE CODE — LA FICHE
 * EST INDIVISIBLE, du validateur jusqu'à l'écran. ⚠ ET CE QU'AUCUN PRÉDICAT NE
 * CONSTATE, écrit plutôt que tu : qu'une `poursuite` renvoie à une AUTRE proposition du
 * même lot, et qu'une fiche redise un personnage déjà écrit au-delà de la borne de
 * contexte — hors frontière testable (KR-229), l'écran ne promet rien de tel. */
export function validerDistribution(
	brut: unknown,
	dossier: Dossier,
): { ok: true; sortie: DistributionRendue } | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) l'ensemble des clés vaut EXACTEMENT `CLES_SORTIE_DISTRIBUTION`.
	const cles = Object.keys(brut)
	if (cles.length !== CLES_SORTIE_DISTRIBUTION.length || !CLES_SORTIE_DISTRIBUTION.every((cle) => cles.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la clé du schéma porte un TABLEAU — piloté par `CLES_SORTIE_DISTRIBUTION`.
	const rendues: unknown = brut[CLES_SORTIE_DISTRIBUTION[0]]
	if (!Array.isArray(rendues)) return { ok: false, motif: 'schema' }
	const elements: unknown[] = rendues

	// (4) et (12) — chaque élément est un objet simple dont les clés valent EXACTEMENT
	//     `CLES_FICHE`. Une chaîne nue, un `null`, un tableau meurent par (4) ; une clé
	//     EN TROP meurt par (12), qui est le SECOND niveau du signal KR-236.
	if (!elements.every(estFicheBrute)) return { ok: false, motif: 'schema' }

	// (5) les DEUX valeurs sont des CHAÎNES — piloté par `CLES_FICHE`. Un TABLEAU meurt
	//     ici, et JAMAIS `[0]`, JAMAIS `String(…)`.
	if (!elements.every((element) => CLES_FICHE.every((cle) => typeof element[cle] === 'string'))) {
		return { ok: false, motif: 'schema' }
	}
	const fiches: FicheReseau[] = elements.map((element) => ({
		place: element[CLES_FICHE[0]] as string,
		poursuite: element[CLES_FICHE[1]] as string,
	}))

	// (6) la BORNE DE SORTIE — un REFUS, jamais une troncature (KR-230).
	if (fiches.length > FICHES_PROPOSEES_MAX) return { ok: false, motif: 'schema' }

	// (7) la liste vide est une NON-RÉPONSE — voir la règle de tranchage en tête de
	//     fonction : en CRÉATION il n'existe aucun ensemble de candidats à épuiser.
	if (fiches.length === 0) return { ok: false, motif: 'vide' }

	// (8) les DEUX proses de CHAQUE élément sont non vides après `trim()`. PAR ÉLÉMENT
	//     ET PAR CHAMP : un blanc en `poursuite` de l'élément 2 est aussi fautif qu'un
	//     blanc en `place` de l'élément 0.
	if (fiches.some((fiche) => fiche.place.trim().length === 0 || fiche.poursuite.trim().length === 0)) {
		return { ok: false, motif: 'vide' }
	}

	// (9) éléments DISTINCTS SUR LE COUPLE, jamais sur une seule clé : deux gardes
	//     partagent légitimement une `place`, deux prétendants une `poursuite` — seul le
	//     COUPLE identique est du remplissage.
	const couples = fiches.map((fiche) => JSON.stringify([fiche.place.trim(), fiche.poursuite.trim()]))
	if (new Set(couples).size !== couples.length) return { ok: false, motif: 'schema' }

	// (10) aucun marqueur d'amorce, SUR LES DEUX PROSES — constante IMPORTÉE, jamais
	//      recopiée (KR-223).
	if (fiches.some((fiche) => fiche.place.includes(MARQUEUR_A_ECRIRE) || fiche.poursuite.includes(MARQUEUR_A_ECRIRE))) {
		return { ok: false, motif: 'marqueur' }
	}

	// (11) aucun identifiant du dossier, PAR ÉLÉMENT ET PAR CHAMP — JAMAIS sur un
	//      `join`, qui détruirait la localisation et fabriquerait un faux positif à la
	//      frontière de deux textes.
	if (
		fiches.some((fiche) => porteUnIdentifiant(fiche.place, dossier) || porteUnIdentifiant(fiche.poursuite, dossier))
	) {
		return { ok: false, motif: 'identifiant' }
	}

	return { ok: true, sortie: { distribution: fiches } }
}

/**
 * LA BORNE DE SORTIE du rôle `interprete` — combien de caractères une question
 * de clarification peut porter. VALEUR DE DÉCISION du comité (2026-09-25), pas
 * une mesure : narratif-ia, tour 1. Contrainte assumée : une question tenant à
 * l'écran d'un `OutcomeBlock` sans défiler.
 */
export const PRECISION_CARACTERES_MAX = 120

/**
 * LE SCANNER ANTI-RANG — forme LÂCHE `\b[PG]\d+\b` ∩ APPARTENANCE À L'UNE OU
 * L'AUTRE TABLE, exactement le même CROISEMENT forme-lâche/appartenance que
 * `porteUnIdentifiant` ci-dessus, mais sur les JETONS de ce rôle plutôt que sur
 * les identifiants du dossier : une précision qui recopie « P2 » ou « G1 »
 * ferait dire au moteur, une fois exécuté, une désignation que l'auteur n'a
 * jamais relue — personne ne relit une clarification en JEU, contrairement à
 * une proposition de rédaction (§ 8 du plan d'itération, désaccord 9/annexe E).
 *
 * DEUX TABLES, UNE SEULE FONCTION : `tables.gestes` et `tables.lieux` sont deux
 * `Map` distinctes, et un jeton qui appartient à L'UNE OU L'AUTRE est un
 * rang — l'appartenance croisée n'a pas de sens ici, contrairement à
 * `porteUnIdentifiant` où un seul ensemble (`ESPACES_DE_NOMS`) suffit.
 *
 * Exportée pour les trois mutants obligatoires du plan (§ 4 ter), comme
 * `porteUnIdentifiant`.
 */
export function porteUnRang(texte: string, tables: TablesInterprete): boolean {
	for (const trouve of texte.matchAll(/\b[PG]\d+\b/g)) {
		if (tables.lieux.has(trouve[0]) || tables.gestes.has(trouve[0])) return true
	}
	return false
}

/**
 * LES PRÉDICATS DE FORME de la sortie `interprete` — LE SEPTIÈME RÔLE, ET LE
 * PREMIER À TROIS FORMES DISJOINTES AU PREMIER NIVEAU (`geste`, `precision`,
 * `sans_commande`) plutôt qu'un schéma unique : la sortie EST une union, pas un
 * objet à clés optionnelles — une clé d'une forme mêlée à une clé d'une autre
 * est un REFUS `schema`, jamais une forme « qui gagne ».
 *
 * `tables` VIENT DE L'ASSEMBLEUR (`assemblerInterprete`), CALCULÉE UNE SEULE
 * FOIS AVANT LA BOUCLE DE REJEU — jamais re-dérivée : c'est elle qui dit ce que
 * `G1`/`P1` désignent, à CET appel-ci.
 *
 * LES PRÉDICATS, dans l'ordre, chacun prouvable SEUL :
 *  BRANCHE `{geste, designe}` :
 *   (1) objet simple, clés EXACTEMENT `{geste, designe}` ......... 'schema'
 *   (2) `geste` est une CHAÎNE appartenant à `tables.gestes` — PAS
 *       de normalisation de casse : `g1` est refusé ............. 'schema'
 *   (3) `designe` est un TABLEAU de chaînes DISTINCTES ........... 'schema'
 *   (4) `designe.length === COMMANDES[id].refKinds.length` — SEUL
 *       DÉCIDEUR de l'arité sur ce chemin (KR-013) ............... 'schema'
 *   (5) chaque élément de `designe` ∈ `tables.lieux` ....... 'rang-inconnu'
 *  BRANCHE `{precision}` :
 *   (6) objet simple, clé UNIQUE `precision`, une CHAÎNE ......... 'schema'
 *   (7) non vide une fois les blancs retirés ........................ 'vide'
 *   (8) ≤ `PRECISION_CARACTERES_MAX`, ET `trimEnd()` finit par
 *       `'?'` .......................................................... 'schema'
 *   (9) aucun `MARQUEUR_A_ECRIRE` ................................. 'marqueur'
 *  (10) aucun identifiant du dossier (`porteUnIdentifiant`) ... 'identifiant'
 *  (11) aucun rang de CET appel (`porteUnRang`) ............... 'identifiant'
 *  (12) `tables.lieux.size >= 2` — une clarification n'a de sens
 *       QUE si elle départage au moins deux lieux réels ............ 'schema'
 *  BRANCHE `{sans_commande}` :
 *  (13) objet simple, clé UNIQUE `sans_commande`, valeur
 *       `=== true` ..................................................... 'schema'
 *
 * ⚠ LE PRÉDICAT (11) EST LA GARDE DE KR-231 : IL NE PASSE JAMAIS
 * `porteUnIdentifiant` sur les rangs eux-mêmes (§ 8, n° 21, précédent) — les
 * rangs sont L'UNE DE NOS PROPRES CHAÎNES, leur appartenance se constate par
 * `Map.has`, jamais par le scanner d'identifiants du dossier.
 *
 * ⚠ (4) NE REVÉRIFIE RIEN QUE (2) N'AIT DÉJÀ ÉTABLI : `tables.gestes.get`
 * N'EST APPELÉ QU'ICI, et `interprete.ts` (re-résolution) ne revérifie PAS
 * l'arité — un second décideur divergerait du premier (KR-013, précédent
 * `analyserSaisie`/`TRANSITIONS.aller`, `commandes.ts`).
 */
export function validerInterprete(
	brut: unknown,
	tables: TablesInterprete,
	dossier: Dossier,
): { ok: true; sortie: InterpretationRendue } | { ok: false; motif: MotifIllisible } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	const cles = Object.keys(brut)

	// ── BRANCHE `sans_commande` ────────────────────────────────────────────
	if (cles.length === 1 && cles[0] === 'sans_commande') {
		// (13) la valeur est EXACTEMENT `true`, sinon `schema` — un `false` ou
		// une chaîne ne se « repêche » pas.
		if (brut.sans_commande !== true) return { ok: false, motif: 'schema' }
		return { ok: true, sortie: { sans_commande: true } }
	}

	// ── BRANCHE `precision` ────────────────────────────────────────────────
	if (cles.length === 1 && cles[0] === 'precision') {
		// (6) la clé unique porte une CHAÎNE.
		if (typeof brut.precision !== 'string') return { ok: false, motif: 'schema' }
		const precision = brut.precision

		// (7) non vide une fois les blancs retirés.
		if (precision.trim().length === 0) return { ok: false, motif: 'vide' }

		// (8) ≤ 120 caractères, ET finit par « ? » une fois la fin nettoyée —
		// une seule question, pas un paragraphe.
		if (precision.length > PRECISION_CARACTERES_MAX || !precision.trimEnd().endsWith('?')) {
			return { ok: false, motif: 'schema' }
		}

		// (9) pas le marqueur d'amorce — constante IMPORTÉE, jamais recopiée (KR-223).
		if (precision.includes(MARQUEUR_A_ECRIRE)) return { ok: false, motif: 'marqueur' }

		// (10) aucun identifiant du dossier.
		if (porteUnIdentifiant(precision, dossier)) return { ok: false, motif: 'identifiant' }

		// (11) aucun rang de CET appel — scanner PROPRE à ce rôle.
		if (porteUnRang(precision, tables)) return { ok: false, motif: 'identifiant' }

		// (12) une clarification n'a de sens que si elle départage AU MOINS
		// deux lieux réels — sinon la question ne ferait que reformuler le
		// seul choix déjà connu (§ 8, désaccord 11 du plan d'itération).
		if (tables.lieux.size < 2) return { ok: false, motif: 'schema' }

		return { ok: true, sortie: { precision } }
	}

	// ── BRANCHE `{geste, designe}` ─────────────────────────────────────────
	// (1 bis) clés EXACTEMENT `{geste, designe}` — clés mêlées ou en trop :
	// `schema`, jamais un champ ignoré (signal KR-236 de ce rôle-ci aussi).
	if (cles.length !== 2 || !cles.includes('geste') || !cles.includes('designe')) {
		return { ok: false, motif: 'schema' }
	}

	// (2) `geste` est une CHAÎNE appartenant à `tables.gestes` — PAS de
	// normalisation de casse : `Map.get` est sensible à la casse par
	// construction, et c'est la garde elle-même.
	if (typeof brut.geste !== 'string') return { ok: false, motif: 'schema' }
	const commandeId = tables.gestes.get(brut.geste)
	if (commandeId === undefined) return { ok: false, motif: 'schema' }

	// (3) `designe` est un TABLEAU de chaînes DISTINCTES.
	const designe: unknown = brut.designe
	if (!Array.isArray(designe) || !designe.every((element): element is string => typeof element === 'string')) {
		return { ok: false, motif: 'schema' }
	}
	if (new Set(designe).size !== designe.length) return { ok: false, motif: 'schema' }

	// (4) L'ARITÉ — SEUL DÉCIDEUR de ce chemin (KR-013). `interprete.ts` ne la
	// revérifie PAS : le faire créerait un second décideur qui pourrait diverger
	// du premier.
	if (designe.length !== COMMANDES[commandeId].refKinds.length) return { ok: false, motif: 'schema' }

	// (5) chaque élément appartient à `tables.lieux` — le LOT ENTIER est
	// refusé sur un seul jeton fautif (KR-230, précédent tous rôles à rangs).
	if (!designe.every((rang) => tables.lieux.has(rang))) return { ok: false, motif: 'rang-inconnu' }

	return { ok: true, sortie: { geste: brut.geste, designe } }
}

// ══ LE HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2 puis it3) ═════

/** Les clés TOUJOURS DUES du schéma de sortie du rôle `narrateur`, EN VALEUR — le
 *  validateur en est PILOTÉ, exactement comme par `CLES_SORTIE_PLAN`. HUIT registres
 *  LITTÉRAUX, et toujours pas un registre paramétré (§ 8, n° 25) : ce rôle n'est pas dans
 *  `RoleCopilote`, et son gabarit ne vit que dans le worker, comme celui de
 *  l'interprète. `narration`, JAMAIS `recit` — le nom du champ de destination
 *  (`EntreeJournal.recit`) ; `tentatives`, JAMAIS `suggestions` — le nom de la forme
 *  résolue ; `constats` (it3), JAMAIS `faits`/`etablis` — sous-chaînes de la clé résolue
 *  `faits_etablis` (KR-231). CES TROIS CLÉS FORMENT LE BLOC ATOMIQUE de KR-230. */
export const CLES_SORTIE_NARRATEUR = ['narration', 'tentatives', 'constats'] as const

/** LA QUATRIÈME CLÉ, CONDITIONNELLE (it3) — DEMANDÉE quand la demande porte une tranche à
 *  condenser, INTERDITE sinon. Hors de `CLES_SORTIE_NARRATEUR` parce qu'elle est HORS du
 *  bloc atomique : son refus ne coûte jamais le récit (KR-271, `validerNarrateur`).
 *  `condense`, JAMAIS `resume` — le nom de la destination (`MemoireSession.resume`). */
export const CLE_CONDENSE = 'condense'

/** Les DEUX clés d'un ÉLÉMENT de `constats` — SECOND niveau de schéma, le troisième du
 *  dépôt après `CLES_RAPPORT` et `CLES_FICHE`. Le validateur en est PILOTÉ : une seule
 *  source. NON exportée — son seul consommateur est le validateur ci-dessous. */
const CLES_CONSTAT = ['phrase', 'ancres'] as const

/** LA BORNE DE SORTIE des constats — combien de faits durables UN pas peut établir.
 *  VALEUR DE DÉCISION du comité (raffinage it3, narratif-ia), pas une mesure. Elle dérive
 *  `max_tokens` (worker). LA LISTE VIDE EST UN SUCCÈS : « rien de durable n'a changé » est
 *  une information que le code n'a pas, et refuser le vide forcerait un fait inventé à
 *  chaque `agir` — une machine à complaisance.
 *  ⚠ NON PARTAGÉE avec les bornes de liste des autres rôles (§ 8, n° 42) : aucune raison
 *  commune d'évoluer. */
export const FAITS_PAR_PAS_MAX = 2

/** LA BORNE D'UNE PHRASE DE CONSTAT, EN CARACTÈRES — VALEUR DE DÉCISION. Elle borne la
 *  sortie, dérive `max_tokens`, ET borne le terme des faits dans le budget de contexte
 *  (`FAITS_INJECTES_MAX × FAIT_CARACTERES_MAX`) : c'est ce qui rend `BORNE_MEMOIRE` exacte. */
export const FAIT_CARACTERES_MAX = 160

/** LE NOMBRE D'ANCRES D'UN CONSTAT — de UN (un fait sans ancre est une création d'entité
 *  déguisée, §2.8 garde-fou 2) à `ANCRES_PAR_FAIT_MAX`. VALEUR DE DÉCISION. */
export const ANCRES_PAR_FAIT_MAX = 2

/** LA BORNE DU CONDENSÉ, EN CARACTÈRES — VALEUR DE DÉCISION. Nommée d'après la CLÉ RÉSEAU
 *  qu'elle borne (précédent `NARRATION_CARACTERES_MAX`), jamais d'après la destination.
 *  Elle borne AUSSI le terme `AUPARAVANT` du budget de contexte. */
export const CONDENSE_CARACTERES_MAX = 1200

/**
 * LA BORNE DE LA NARRATION, EN CARACTÈRES — VALEUR DE DÉCISION du comité (plan
 * d'itération it2, § 4 bis ; narratif-ia : environ six phrases), pas une mesure. Elle
 * borne la SORTIE et dérive `max_tokens` (worker). Au-delà : REFUS `'schema'`, jamais
 * une coupe (KR-230) — une prose tronquée au milieu d'une phrase serait une réparation
 * silencieuse, lue par le joueur comme de la fiction.
 */
export const NARRATION_CARACTERES_MAX = 800

/** LA BORNE D'UNE TENTATIVE, EN CARACTÈRES — VALEUR DE DÉCISION du comité (§ 4 bis),
 *  pas une mesure : une piste d'action tient en quelques mots. Même statut que
 *  `NARRATION_CARACTERES_MAX`, et elle dérive elle aussi `max_tokens`. */
export const TENTATIVE_CARACTERES_MAX = 60

/**
 * LA BORNE DE SORTIE du rôle `narrateur` — combien de tentatives le modèle a le droit de
 * proposer. Même statut que `max_tokens` : ni règle du jeu ni règle du dossier, c'est
 * la FORME DE LA RÉPONSE ATTENDUE, et l'invite l'annonce en toutes lettres (« trois au
 * plus »), garde apparié dans `worker/frontiere.test.ts`.
 * ⚠ NON PARTAGÉE avec les quatre autres bornes de liste (§ 8, n° 42) : même valeur
 * aujourd'hui, aucune raison commune d'évoluer.
 */
export const TENTATIVES_MAX = 3

/**
 * LE SCANNER ANTI-ANCRE — forme LÂCHE `\bA\d+\b` ∩ APPARTENANCE à la table de CET appel,
 * le même croisement forme-lâche/appartenance que `porteUnIdentifiant` et `porteUnRang`.
 * Une prose qui recopie « A2 » ferait lire au joueur un repère que seul le modèle devait
 * voir (KR-231). Préfixe `A`, jamais `P`/`G` : deux espaces de rangs, deux scanners, et
 * aucun ne se croise avec l'autre.
 *
 * L'APPARTENANCE DÉCIDE, pas la silhouette : « A4 » dans une prose, quand la table n'a que
 * `A1`–`A3`, n'est le repère de RIEN — le refuser ferait rougir une prose saine.
 *
 * Exportée pour que les mutants du plan (§ 7) l'éprouvent seule.
 */
export function porteUneAncre(texte: string, ancres: ReadonlyMap<RangInjecte, string>): boolean {
	for (const trouve of texte.matchAll(/\bA\d+\b/g)) {
		if (ancres.has(trouve[0])) return true
	}
	return false
}

/**
 * L'ISSUE DE LA GARDE DU CONDENSÉ — SÉPARÉE de celle du lot, et c'est tout l'objet de la
 * garde à deux niveaux (KR-271). `ok: false` n'est PAS un échec du narrateur : c'est « le
 * résumé ne sera pas mis à jour ce pas-ci ». Le motif existe pour que chaque prédicat se
 * prouve seul ; il ne sort pas du service (personne ne le lirait, KR-249/268).
 */
export type IssueCondense =
	| { readonly ok: true; readonly texte: string }
	| { readonly ok: false; readonly motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }

/**
 * LA GARDE DU CONDENSÉ — appelée SEULE, par `validerNarrateur`, et SEULEMENT APRÈS que le
 * bloc atomique a passé toutes les siennes.
 *
 * ⚠ LE CRITÈRE D'EXCEPTION, écrit ici pour qu'il ne s'étende pas en silence aux artefacts
 * des n° 11 et 12 (KR-271). Un artefact de sortie n'est DÉCOUPLÉ du refus de lot que s'il
 * remplit TROIS conditions CUMULATIVES :
 *  1. il porte sur une fiction DÉJÀ PERSISTÉE (des pas passés, jamais le pas courant) ;
 *  2. le joueur ne le lit JAMAIS ;
 *  3. le code sait le REDEMANDER DE FAÇON DÉTERMINISTE (`pasACondenser` reste non nul tant
 *     que `jusqu_au_pas` n'avance pas).
 * `condense` les remplit toutes ; `constats` n'en remplit AUCUNE — ils parlent du récit de
 * CE pas, et rien ne les ré-extrait ensuite — et restent donc dans le bloc atomique.
 *
 * LES SEPT PRÉDICATS, dans l'ordre, chacun prouvable SEUL :
 *   (C1) une CHAÎNE — l'ABSENCE de la clé meurt ici aussi ..... 'schema'
 *   (C2) non vide après `trim()` ................................ 'vide'
 *   (C3) ≤ `CONDENSE_CARACTERES_MAX` — un refus, jamais une coupe  'schema'
 *   (C4) ne finit pas par « ? » (`trimEnd`) ..................... 'schema'
 *   (C5) aucun `MARQUEUR_A_ECRIRE` ............................ 'marqueur'
 *   (C6) aucun identifiant du dossier (`porteUnIdentifiant`) . 'identifiant'
 *   (C7) aucune ancre de CET appel (`porteUneAncre`) ........ 'identifiant'
 *
 * AUCUNE RÉPARATION, ici non plus : le texte accepté est rendu tel quel.
 */
export function validerCondense(
	brut: unknown,
	dossier: Dossier,
	ancres: ReadonlyMap<RangInjecte, string>,
): IssueCondense {
	// (C1) une CHAÎNE — `undefined` (clé absente) comme n'importe quelle autre forme.
	if (typeof brut !== 'string') return { ok: false, motif: 'schema' }

	// (C2) non vide une fois les blancs retirés.
	if (brut.trim().length === 0) return { ok: false, motif: 'vide' }

	// (C3) la BORNE — un refus, jamais une coupe (KR-230).
	if (brut.length > CONDENSE_CARACTERES_MAX) return { ok: false, motif: 'schema' }

	// (C4) jamais une question finale : le résumé est lu par le narrateur, qui la
	//      reprendrait comme une question ouverte adressée au joueur.
	if (brut.trimEnd().endsWith('?')) return { ok: false, motif: 'schema' }

	// (C5) pas le marqueur d'amorce — constante IMPORTÉE, jamais recopiée (KR-223).
	if (brut.includes(MARQUEUR_A_ECRIRE)) return { ok: false, motif: 'marqueur' }

	// (C6) aucun identifiant du dossier.
	if (porteUnIdentifiant(brut, dossier)) return { ok: false, motif: 'identifiant' }

	// (C7) aucun repère de cet appel.
	if (porteUneAncre(brut, ancres)) return { ok: false, motif: 'identifiant' }

	return { ok: true, texte: brut }
}

/** Un ÉLÉMENT de `constats` : objet simple dont les clés valent EXACTEMENT `CLES_CONSTAT`.
 *  PRIMITIVE PARTAGÉE avec le premier niveau (`estObjetSimple`) : la clé en TROP (signal
 *  KR-236 au second niveau) et la clé MANQUANTE meurent toutes deux ici. */
function estConstatBrut(element: unknown): element is Record<string, unknown> {
	if (!estObjetSimple(element)) return false
	const cles = Object.keys(element)
	return cles.length === CLES_CONSTAT.length && CLES_CONSTAT.every((cle) => cles.includes(cle))
}

/**
 * LES PRÉDICATS DE FORME de la sortie `narrateur` — le HUITIÈME rôle, ET LE PREMIER DONT
 * LA PROSE EST LUE PAR LE JOUEUR SANS RELECTURE : aucun auteur ne ratifie ce récit d'un
 * clic, il s'affiche. C'est pourquoi chaque prédicat du BLOC ATOMIQUE est un REFUS DU LOT
 * ENTIER — rejeu une fois, puis dégradé —, jamais une réparation.
 *
 * ── LA GARDE À DEUX NIVEAUX (it3, KR-271) ─────────────────────────────────────
 * `{narration, tentatives, constats}` est ATOMIQUE sous KR-230 : un fait sans ancre
 * valide, un rang hors table, un identifiant ou un repère qui fuite dans la prose refusent
 * TOUT le lot, récit compris. `condense` SEUL en est découplé : il n'est évalué
 * (`validerCondense`) QUE SI le bloc atomique a tout passé ET que la condensation est
 * demandée, et son échec NE REMONTE JAMAIS en refus du lot — l'issue est portée DANS la
 * branche de succès (`sortie.condense`), donc la boucle de rejeu (qui ne rejoue que sur
 * `ok: false`) ne la voit pas. Construire ici une garde qui refuserait le lot à cause de
 * `condense` seul effacerait un récit valide pour un artefact que le joueur ne lit jamais.
 *
 * `attendu` VIENT DE L'ASSEMBLEUR, calculé UNE fois avant la boucle de rejeu :
 *  · `ancres` — la table rang → identifiant de CET appel (appartenance, `Map.has`) ;
 *  · `condenseDemande` — `condensation !== null`, la tranche à condenser que le contexte
 *    porte. C'est ce qui décide si `condense` est DÛ ou INTERDIT.
 *
 * DEUX CLÉS DE NATURE DIFFÉRENTE dans le bloc atomique, et leur règle du vide diffère :
 *  · `narration` est la RÉDACTION requise — une narration vide est une NON-RÉPONSE,
 *    motif `'vide'` (règle de tranchage de `validerRepliques`) ;
 *  · `tentatives` et `constats` sont des listes bornées — LA LISTE VIDE EST UN SUCCÈS ; un
 *    ÉLÉMENT vide, en revanche, est un remplissage : motif `'vide'`.
 *
 * L'ORDRE STRICT, chacun prouvable SEUL :
 *  ENVELOPPE
 *   (1)  objet simple (ni tableau, ni null) ..................... 'schema'
 *   (2)  clés : EXACTEMENT `CLES_SORTIE_NARRATEUR` si `condense` n'est pas demandé — un
 *        `condense` présent est alors un REFUS DU LOT (dérive KR-236) ; si demandé, ces
 *        trois clés PLUS `condense` FACULTATIF — toute autre clé refuse le lot .. 'schema'
 *  NARRATION ET TENTATIVES (inchangés depuis l'it2)
 *   (3)  `narration` est une CHAÎNE — jamais `String(…)` ........ 'schema'
 *   (4)  `narration` non vide après `trim()` ...................... 'vide'
 *   (5)  `narration` ≤ `NARRATION_CARACTERES_MAX` .............. 'schema'
 *   (6)  `narration` NE FINIT PAS par « ? » (`trimEnd`) ......... 'schema'
 *   (7)  `tentatives` est un TABLEAU de CHAÎNES ................. 'schema'
 *   (8)  longueur ≤ `TENTATIVES_MAX` — REFUS, jamais une coupe .. 'schema'
 *   (9)  chaque tentative non vide après `trim()` ................. 'vide'
 *   (10) chaque tentative ≤ `TENTATIVE_CARACTERES_MAX` ......... 'schema'
 *   (11) tentatives DISTINCTES après `trim()` .................. 'schema'
 *   (12) aucun `MARQUEUR_A_ECRIRE`, narration ET tentatives ... 'marqueur'
 *   (13) aucun identifiant du dossier, ÉLÉMENT PAR ÉLÉMENT .. 'identifiant'
 *  CONSTATS (it3)
 *   (14) `constats` est un TABLEAU ............................... 'schema'
 *   (15) longueur ≤ `FAITS_PAR_PAS_MAX` — la liste vide passe .. 'schema'
 *   (16) chaque élément : clés EXACTEMENT `{phrase, ancres}` ..... 'schema'
 *   (17) chaque `phrase` est une CHAÎNE (sinon 'schema'), non vide
 *        après `trim()` ............................................ 'vide'
 *   (18) chaque `phrase` ≤ `FAIT_CARACTERES_MAX`, sans « ? » final  'schema'
 *   (19) chaque `ancres` : TABLEAU de CHAÎNES DISTINCTES, de 1 à
 *        `ANCRES_PAR_FAIT_MAX` — `ancres: []` est un REFUS ...... 'schema'
 *   (20) chaque ancre ∈ `attendu.ancres` — un rang hors table refuse
 *        TOUT le lot ...................................... 'rang-inconnu'
 *   (21) phrases DISTINCTES après `trim()` ...................... 'schema'
 *   (22) aucun marqueur, puis aucun identifiant, PHRASE PAR PHRASE
 *        .............................................. 'marqueur' / 'identifiant'
 *   (23) aucune ancre (`porteUneAncre`) dans la narration, dans CHAQUE
 *        tentative, dans CHAQUE phrase ........................ 'identifiant'
 *  CONDENSÉ (hors bloc atomique)
 *   (24) SEULEMENT SI (1)–(23) passent ET `condenseDemande` : `validerCondense`, dont
 *        l'issue est RENDUE dans `sortie.condense` — jamais un refus du lot. `null` quand
 *        le condensé n'était pas demandé.
 *
 * ⚠ LE PRÉDICAT (6) EST LA GARDE DE L'ANTI-BOUCLE CÔTÉ NARRATEUR : un récit qui finit
 * par une question inviterait le joueur à RÉPONDRE, alors qu'AUCUNE `attente` n'est
 * posée par ce rôle — l'interprète lirait la réponse à l'aveugle. La question est le
 * monopole de la clarification (KR-264).
 *
 * ⚠ SCANNERS ÉLÉMENT PAR ÉLÉMENT, JAMAIS SUR UN `join` (précédent `validerRepliques`) :
 * deux fragments logés dans deux cases distinctes ne forment pas un identifiant, et
 * joindre DÉTRUIT la localisation en fabriquant un faux positif à la frontière. Les
 * ANCRES elles-mêmes ne passent JAMAIS au scanner d'identifiants : ce sont nos propres
 * jetons, constatés par appartenance (précédent `envers`, KR-235).
 */
export function validerNarrateur(
	brut: unknown,
	dossier: Dossier,
	attendu: { readonly ancres: ReadonlyMap<RangInjecte, string>; readonly condenseDemande: boolean },
):
	| { ok: true; sortie: Omit<NarrationRendue, 'condense'> & { readonly condense: IssueCondense | null } }
	| { ok: false; motif: MotifIllisible } {
	// (1) un objet JSON — ni tableau, ni `null`.
	if (!estObjetSimple(brut)) return { ok: false, motif: 'schema' }

	// (2) L'ENVELOPPE — les trois clés du bloc atomique sont TOUJOURS dues ; `condense` est
	//     TOLÉRÉE seulement si elle est demandée, et toute autre clé refuse le lot.
	const cles = Object.keys(brut)
	const admises: readonly string[] = attendu.condenseDemande
		? [...CLES_SORTIE_NARRATEUR, CLE_CONDENSE]
		: CLES_SORTIE_NARRATEUR
	if (!CLES_SORTIE_NARRATEUR.every((cle) => cles.includes(cle)) || !cles.every((cle) => admises.includes(cle))) {
		return { ok: false, motif: 'schema' }
	}

	// (3) la narration est une CHAÎNE — un tableau ou un objet meurt ici, JAMAIS `[0]`,
	//     JAMAIS `String(…)`.
	const narration: unknown = brut[CLES_SORTIE_NARRATEUR[0]]
	if (typeof narration !== 'string') return { ok: false, motif: 'schema' }

	// (4) non vide une fois les blancs retirés — la non-réponse de rédaction.
	if (narration.trim().length === 0) return { ok: false, motif: 'vide' }

	// (5) la BORNE — un REFUS, jamais une coupe (KR-230).
	if (narration.length > NARRATION_CARACTERES_MAX) return { ok: false, motif: 'schema' }

	// (6) jamais une question finale — voir la docstring : la question est le monopole
	//     de la clarification.
	if (narration.trimEnd().endsWith('?')) return { ok: false, motif: 'schema' }

	// (7) les tentatives sont un TABLEAU de CHAÎNES — un `{texte:"…"}` emballé meurt ici.
	const rendues: unknown = brut[CLES_SORTIE_NARRATEUR[1]]
	if (!Array.isArray(rendues) || !rendues.every((element): element is string => typeof element === 'string')) {
		return { ok: false, motif: 'schema' }
	}

	// (8) la BORNE DE SORTIE — une quatrième tentative est un REFUS, jamais une coupe.
	if (rendues.length > TENTATIVES_MAX) return { ok: false, motif: 'schema' }

	// (9) aucun élément vide — PAR ÉLÉMENT. La liste VIDE, elle, est un succès.
	if (rendues.some((tentative) => tentative.trim().length === 0)) return { ok: false, motif: 'vide' }

	// (10) chaque tentative tient dans sa borne.
	if (rendues.some((tentative) => tentative.length > TENTATIVE_CARACTERES_MAX)) return { ok: false, motif: 'schema' }

	// (11) DISTINCTES après `trim()` — deux fois la même piste est un remplissage.
	const normalisees = rendues.map((tentative) => tentative.trim())
	if (new Set(normalisees).size !== normalisees.length) return { ok: false, motif: 'schema' }

	// (12) aucun marqueur d'amorce, SUR LA NARRATION ET SUR CHAQUE TENTATIVE — constante
	//      IMPORTÉE, jamais recopiée (KR-223).
	if (narration.includes(MARQUEUR_A_ECRIRE) || rendues.some((tentative) => tentative.includes(MARQUEUR_A_ECRIRE))) {
		return { ok: false, motif: 'marqueur' }
	}

	// (13) aucun identifiant du dossier — la narration, PUIS CHAQUE tentative, SÉPARÉMENT.
	//      Jamais sur un `join` : voir la docstring.
	if (porteUnIdentifiant(narration, dossier) || rendues.some((tentative) => porteUnIdentifiant(tentative, dossier))) {
		return { ok: false, motif: 'identifiant' }
	}

	// (14) les constats sont un TABLEAU.
	const elements: unknown = brut[CLES_SORTIE_NARRATEUR[2]]
	if (!Array.isArray(elements)) return { ok: false, motif: 'schema' }

	// (15) la BORNE DE SORTIE — un troisième constat est un REFUS, jamais une coupe. La
	//      liste VIDE passe : c'est la réponse honnête d'un pas sans fait durable.
	if (elements.length > FAITS_PAR_PAS_MAX) return { ok: false, motif: 'schema' }

	// (16) chaque élément porte EXACTEMENT `{phrase, ancres}`.
	if (!elements.every(estConstatBrut)) return { ok: false, motif: 'schema' }

	const constats: ConstatRendu[] = []
	for (const element of elements) {
		const phrase: unknown = element[CLES_CONSTAT[0]]
		const ancres: unknown = element[CLES_CONSTAT[1]]

		// (17) la phrase est une CHAÎNE, non vide.
		if (typeof phrase !== 'string') return { ok: false, motif: 'schema' }
		if (phrase.trim().length === 0) return { ok: false, motif: 'vide' }

		// (18) sa BORNE, et jamais une question finale.
		if (phrase.length > FAIT_CARACTERES_MAX || phrase.trimEnd().endsWith('?')) return { ok: false, motif: 'schema' }

		// (19) les ancres : un TABLEAU de CHAÎNES DISTINCTES, d'UNE à `ANCRES_PAR_FAIT_MAX`.
		//      `ancres: []` meurt ICI — un fait qui ne porte sur rien est une création
		//      d'entité déguisée (§2.8 garde-fou 2, AC#7).
		if (!Array.isArray(ancres) || !ancres.every((ancre): ancre is string => typeof ancre === 'string')) {
			return { ok: false, motif: 'schema' }
		}
		if (ancres.length === 0 || ancres.length > ANCRES_PAR_FAIT_MAX || new Set(ancres).size !== ancres.length) {
			return { ok: false, motif: 'schema' }
		}

		// (20) chaque ancre APPARTIENT à la table de cet appel — sans normalisation de casse.
		if (!ancres.every((ancre) => attendu.ancres.has(ancre))) return { ok: false, motif: 'rang-inconnu' }

		constats.push({ phrase, ancres })
	}

	// (21) phrases DISTINCTES après `trim()` — deux fois le même fait est un remplissage.
	const phrases = constats.map((constat) => constat.phrase.trim())
	if (new Set(phrases).size !== phrases.length) return { ok: false, motif: 'schema' }

	// (22) aucun marqueur, puis aucun identifiant — PHRASE PAR PHRASE.
	if (constats.some((constat) => constat.phrase.includes(MARQUEUR_A_ECRIRE))) return { ok: false, motif: 'marqueur' }
	if (constats.some((constat) => porteUnIdentifiant(constat.phrase, dossier))) {
		return { ok: false, motif: 'identifiant' }
	}

	// (23) aucun REPÈRE de cet appel dans la prose que le joueur lira — la narration,
	//      CHAQUE tentative — ni dans ce que la mémoire réinjectera — CHAQUE phrase.
	const proses = [narration, ...rendues, ...constats.map((constat) => constat.phrase)]
	if (proses.some((prose) => porteUneAncre(prose, attendu.ancres))) return { ok: false, motif: 'identifiant' }

	// (24) LE CONDENSÉ — hors bloc atomique, évalué SEUL et SEULEMENT maintenant. Son
	//      échec est une ISSUE rendue, jamais un refus : le récit ci-dessus est acquis.
	const condense = attendu.condenseDemande ? validerCondense(brut[CLE_CONDENSE], dossier, attendu.ancres) : null

	return { ok: true, sortie: { narration, tentatives: rendues, constats, condense } }
}
