/**
 * L'ASSEMBLEUR DU SEPTIÈME RÔLE — `interprete` (n° 10, `moteur-interprete`).
 *
 * ⚠ CE RÔLE NE PASSE PAS PAR `./registres.ts` (`CHAMPS_INJECTES`,
 * `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`) : ces trois registres sont
 * `Record<RoleCopilote, …>`, et `RoleCopilote` (`copilote/types.ts`) N'EST PAS
 * ÉTENDU à `'interprete'` — l'étendre romprait la totalité des TROIS registres
 * (une clé de `RoleCopilote` de plus exige une entrée dans chacun) ET la
 * totalité `ROLES = Object.keys(INVITES)` de `worker/frontiere.test.ts`, deux
 * surfaces HORS du lot `contrat` de cette itération. Voir le compte rendu de
 * lot pour ce choix et son coût si on le renverse.
 *
 * Ce module a donc SA PROPRE borne de saisie (`SAISIE_CARACTERES_MAX`) et SA
 * PROPRE sélection de candidats, déterministe, sans registre partagé — mais LA
 * MÊME DOCTRINE que ses cinq voisins : refus AVANT tout `fetch`, jamais de
 * troncature, silence sur un champ non rédigé plutôt qu'une affirmation.
 */
import { COMMANDES, destinationsPossibles, personnagesPresents, type CommandeId } from '../../dossier/commandes'
import type { EtatSession } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import type { RangInjecte, TablesInterprete } from '../types'
import { PREFIXE_PERSONNAGE, textesRediges, type MotifRefusContexte } from './noyau'

/** LA BORNE DE SAISIE, EN CARACTÈRES — VALEUR DE DÉCISION (comité, tour 1),
 *  pas une mesure : au-delà, refus `trop-long` avant tout `fetch`, jamais de
 *  troncature. Même borne que `maxLength` de `PlayerInputBar` (lot 2) —
 *  DEUX GARDES, PAS UN DOUBLON : celle-ci tient même si la saisie contourne
 *  l'interface (appel direct au service). */
export const SAISIE_CARACTERES_MAX = 300

/** LE CHEMIN, EN TOUTES LETTRES, SANS RANG — le lieu où se tient le héros ne se
 *  désigne jamais : `monde.lieu_courant` SÉLECTIONNE (même statut que
 *  `portee`, `contexte/detenteurs.ts`) et n'est JAMAIS injecté ; SA
 *  `description`, elle, l'est, SANS RANG. */
const CHEMIN_DESCRIPTION_LIEU = 'monde.lieux[].description'

/** LES DEUX CHEMINS D'IDENTITÉ D'UN PNJ (n° 12 `moteur-acteurs`, it1) —
 *  `fonction` PUIS `apparence`, jamais `nom` (KR-262/284 : `Personnage.nom` reste
 *  `auteur`, et n° 12 ne rouvre pas `destinations.ts`). Même doctrine que
 *  `CHEMIN_DESCRIPTION_LIEU` : un candidat sans AUCUNE des deux ne reçoit aucun
 *  rang — silence, précédent KR-267. */
const CHEMIN_FONCTION_PERSONNAGE = 'monde.personnages[].fonction'
const CHEMIN_APPARENCE_PERSONNAGE = 'monde.personnages[].apparence'

/**
 * Le geste `id` est-il SATISFIABLE au tour courant — c'est-à-dire chacun de
 * ses `refKinds` a-t-il au moins un candidat rangé ? DEUX espaces de noms sont
 * résolus par ce rôle depuis la n° 12 (it1) : `'lieu'` (depuis la n° 9) et
 * `'pnj'` (depuis `parler`, n° 12). Un `refKind` d'un autre espace de noms n'a
 * AUCUNE table de candidats ici, donc rend le geste NON satisfiable — ce n'est
 * pas une approximation, c'est l'état réel de ce que cette itération sait
 * désigner.
 */
function gesteSatisfiable(id: CommandeId, nombreDeLieux: number, nombreDePersonnages: number): boolean {
	return COMMANDES[id].refKinds.every((espace) => {
		if (espace === 'lieu') return nombreDeLieux > 0
		if (espace === 'pnj') return nombreDePersonnages > 0
		return false
	})
}

export type ContexteInterprete =
	| { readonly ok: true; readonly texte: string; readonly tables: TablesInterprete }
	| ({ readonly ok: false } & MotifRefusContexte)

/**
 * L'ASSEMBLEUR — SÉLECTION DES CANDIDATS-LIEUX, déterministe, sans modèle :
 *  1. `destinationsPossibles(dossier, session)` — LA MÊME FONCTION que
 *     `TRANSITIONS.aller` (`../../dossier/commandes.ts`) : la règle d'accès
 *     n'existe qu'à un seul endroit ;
 *  2. DÉDOUBLONNÉE PAR ID, ordre du document conservé — le dédoublonnage
 *     revient à CETTE itération (docstring `dossier/types.ts`, `Lieu.acces`,
 *     « le dédoublonnage se fera à l'injection, charge de la n° 10 ») ;
 *  3. un accès dont la cible ne résout dans AUCUN `monde.lieux[]`, ou dont la
 *     `description` est absente ou marquée, NE REÇOIT AUCUN RANG — silence,
 *     jamais un repli sur `nom` (KR-262) ni sur l'identifiant (KR-231). C'EST
 *     LE TROU NOMMÉ KR-267 (`open_questions`, propriétaire `dossier-controles`) :
 *     un lieu accessible sans description devient inatteignable en saisie
 *     libre, atteignable en console ;
 *  4. numérotés `P1`, `P2`, … dans cet ordre.
 *
 * SÉLECTION DES CANDIDATS-PNJ (n° 12 `moteur-acteurs`, it1), MÊME DOCTRINE,
 * TABLE ET COMPTEUR SÉPARÉS (préfixe `I`, désaccord #4 du raffinage, Tech Lead
 * concède à Narratif-IA) :
 *  1. `personnagesPresents(dossier, session)` — LA MÊME FONCTION que
 *     `TRANSITIONS.parler` (`../../dossier/commandes.ts`) ;
 *  2. jamais de doublon possible par construction (`monde.personnages[]` ne
 *     porte pas deux fois le même `id`) ;
 *  3. un PNJ dont ni `fonction` ni `apparence` n'est rédigée (ou marquée) NE
 *     REÇOIT AUCUN RANG — silence, jamais un repli sur `nom` (KR-262/284) ;
 *  4. numérotés `I1`, `I2`, … — PROJETÉS par `fonction` PUIS `apparence` (les
 *     deux concaténées sous le même rang, comme `TOI` de `contexte/acteur.ts`).
 *
 * LES GESTES sont dérivés de `COMMANDES` À CHAQUE APPEL, jamais un littéral :
 * l'invite ne connaît aucun verbe/clé/libellé de ce registre, et c'est le
 * CONTEXTE — recomposé à chaque appel — qui les lui apprend. Seuls les gestes
 * SATISFIABLES (`gesteSatisfiable`) reçoivent un rang `G1…Gk`.
 *
 * COURT-CIRCUIT : si AUCUN geste n'est satisfiable, `tables.gestes` est VIDE
 * et l'appelant (`CopiloteService.demanderInterprete`) rend `sans_commande`
 * SANS APPELER LE MODÈLE — ce module se contente de rendre des tables vides,
 * il ne décide pas d'appeler ou non (KR-013, une seule décideuse : le service).
 *
 * REFUS, AVANT tout `fetch` :
 *   `trop-long` — `cible.saisie.length > SAISIE_CARACTERES_MAX`.
 *
 * ⚠ `'a-ecrire'`, `'cible-a-ecrire'` et `'aucun-candidat'` SONT INATTEIGNABLES
 * ICI, ET C'EST DÉLIBÉRÉ (§ 8 désaccord 22 du plan d'itération) : `canon.ton`
 * n'est PAS requis — sans lui, la clarification ne peut simplement jamais
 * atteindre le joueur (`apresInterpretation` dégrade en silence), et ce rôle
 * n'a NI cible unique NI ensemble de candidats à épuiser au sens de ces deux
 * motifs. Les écrire ici serait du code mort présenté comme de la couverture
 * (famille BUG-084, KR-235).
 */
export function assemblerInterprete(
	dossier: Dossier,
	cible: { readonly saisie: string; readonly session: EtatSession },
): ContexteInterprete {
	if (cible.saisie.length > SAISIE_CARACTERES_MAX) return { ok: false, motif: 'trop-long' }

	const blocs: string[] = []

	// ── LE CANON, global, optionnel ────────────────────────────────────────
	const ton = textesRediges(dossier, 'canon.ton', '')
	if (ton.length > 0) blocs.push(`canon.ton\n${ton.join('\n')}`)
	const interditsTon = textesRediges(dossier, 'canon.interdits_ton[]', '')
	if (interditsTon.length > 0) blocs.push(`canon.interdits_ton[]\n${interditsTon.join('\n')}`)

	// ── LES CANDIDATS-LIEUX, P1…Pn ─────────────────────────────────────────
	const lieux = new Map<RangInjecte, string>()
	const vus = new Set<string>()
	for (const accesId of destinationsPossibles(dossier, cible.session)) {
		if (vus.has(accesId)) continue
		vus.add(accesId)

		const lieu = dossier.monde.lieux.find((candidat) => candidat.id === accesId)
		if (lieu === undefined) continue // référence pendante — silence, KR-267

		const description = textesRediges(lieu, CHEMIN_DESCRIPTION_LIEU, 'monde.lieux[].')
		if (description.length === 0) continue // pas de description — silence, KR-267

		const rang = `P${lieux.size + 1}`
		lieux.set(rang, lieu.id)
		blocs.push(`${rang}\n${description.join('\n')}`)
	}

	// ── LES CANDIDATS-PNJ, I1…In — table et compteur SÉPARÉS des lieux ─────
	const personnages = new Map<RangInjecte, string>()
	for (const personnageId of personnagesPresents(dossier, cible.session)) {
		const personnage = dossier.monde.personnages.find((candidat) => candidat.id === personnageId)
		if (personnage === undefined) continue // référence pendante — silence, précédent KR-267

		const identite = [
			...textesRediges(personnage, CHEMIN_FONCTION_PERSONNAGE, PREFIXE_PERSONNAGE),
			...textesRediges(personnage, CHEMIN_APPARENCE_PERSONNAGE, PREFIXE_PERSONNAGE),
		]
		if (identite.length === 0) continue // sans identité — silence, KR-262/284/267

		const rang = `I${personnages.size + 1}`
		personnages.set(rang, personnage.id)
		blocs.push(`${rang}\n${identite.join('\n')}`)
	}

	// ── LES GESTES, G1…Gk, dérivés de COMMANDES À CHAQUE APPEL ─────────────
	const gestes = new Map<RangInjecte, CommandeId>()
	for (const id of Object.keys(COMMANDES) as CommandeId[]) {
		if (!gesteSatisfiable(id, lieux.size, personnages.size)) continue
		const rang = `G${gestes.size + 1}`
		gestes.set(rang, id)
		blocs.push(`${rang} — ${COMMANDES[id].label} — ${COMMANDES[id].refKinds.length} repère(s)`)
	}

	// ── ICI : la description du lieu courant, SANS RANG ────────────────────
	const lieuCourant = dossier.monde.lieux.find((candidat) => candidat.id === cible.session.monde.lieu_courant)
	const descriptionIci =
		lieuCourant === undefined ? [] : textesRediges(lieuCourant, CHEMIN_DESCRIPTION_LIEU, 'monde.lieux[].')
	if (descriptionIci.length > 0) blocs.push(`ICI\n${descriptionIci.join('\n')}`)

	// ── L'ATTENTE EN COURS, si présente ─────────────────────────────────────
	if (cible.session.attente !== undefined) {
		blocs.push(`attente.question\n${cible.session.attente.question}`)
		blocs.push(`attente.saisie\n${cible.session.attente.saisie}`)
	}

	// ── LA SAISIE, EN DERNIER, normalisée ────────────────────────────────────
	// `trim` puis les espaces multiples collapsés en une seule : elle ne peut
	// donc pas imiter un bloc `P9`/`G2` sur sa propre ligne (précédent
	// narratif-ia, tour 1, annexe A.8).
	const saisie = cible.saisie.trim().replace(/\s+/g, ' ')
	blocs.push(`saisie\n${saisie}`)

	return { ok: true, texte: blocs.join('\n\n'), tables: { lieux, personnages, gestes } }
}
