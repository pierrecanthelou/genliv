/**
 * L'ASSEMBLEUR DU CINQUIÈME RÔLE — qui, parmi les autres personnages, celui-ci
 * connaît-il, et par quoi.
 *
 * CINQUIÈME FONCTION NOMMÉE, ZÉRO BRANCHE DE RÔLE : ce dossier ne contient toujours
 * aucun `if (role === …)`. Ce qui varie entre les assembleurs est le CORPS, pas une
 * donnée.
 *
 * ⚠ LE SEUL ASSEMBLEUR À DEUX ENSEMBLES — un PORTEUR et des CANDIDATS, tous deux tirés
 * de `monde.personnages[]`, chacun avec SA LISTE DE CHEMINS. C'est le veto ratifié du
 * § 4.3, et il tient à une MESURE : chez le rôle détenteurs, la cible et les candidats
 * se séparent GRATUITEMENT PAR LE PRÉFIXE (`monde.indices[].` contre
 * `monde.personnages[].`), si bien qu'une seule liste plate parcourue deux fois y est
 * correcte. ICI LES DEUX SONT DES PERSONNAGES : la même liste plate donnerait aux HUIT
 * candidats EXACTEMENT les lignes du porteur — dont le `but.pourquoi` de huit inconnus
 * —, ET AUCUN TEST EXISTANT NE ROUGIRAIT.
 *
 * `ContexteDetenteurs` est RÉUTILISÉ SANS ALIAS (§ 8, n° 24) : un
 * `type ContexteRelations = ContexteDetenteurs` serait une abstraction à un seul
 * appelant (KR-109), précédent `ContexteProse` réutilisé par trois rôles.
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL — voir `./prose`. `import type` est effacé à l'émission.
import type { CibleRelations } from '../../CopiloteService'
import type { RangInjecte } from '../types'
import { PREFIXE_PERSONNAGE, textesDuChemin, textesRediges, type ContexteDetenteurs } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CANDIDATS_MAX, CHAMPS_INJECTES, PARTIES_REQUISES } from './registres'

const ROLE_RELATIONS = 'personnage-relations'

/**
 * L'EN-TÊTE DU BLOC DU PORTEUR.
 *
 * ⚠ `FICHE`, ET JAMAIS `PERSONNAGE` (§ 8, n° 36) : un en-tête commençant par `P`
 * ENTRE EN COLLISION AVEC L'ALPHABET DES RANGS. Le modèle rendrait
 * `{"envers": "PERSONNAGE"}` en croyant désigner le porteur, le validateur le
 * classerait `rang-inconnu`, et le lot entier partirait en rejeu puis en état
 * terminal — un rôle qui échoue sur une réponse de bonne foi.
 */
const EN_TETE_PORTEUR = 'FICHE'

/**
 * LES QUATRE CHEMINS D'UN CANDIDAT — LISTE POSITIVE LITTÉRALE, et c'est une décision
 * de forme autant que de contenu.
 *
 * ⚠ JAMAIS UNE SOUSTRACTION. Un `chemins.filter((c) => c !== 'monde.personnages[].but.pourquoi')`
 * rendrait EXACTEMENT la même liste aujourd'hui, resterait VERT, et RÉ-ÉLARGIRAIT TOUT
 * SEUL au NEUVIÈME chemin que l'union gagnerait un jour — la famille de panne que
 * KR-235 nomme : un instrument qui cesse de mesurer sans jamais rougir.
 *
 * ELLE EST INCLUSE DANS L'UNION (`CHAMPS_INJECTES[ROLE_RELATIONS]`), et DEUX tests le
 * gardent, pas un : l'INCLUSION (rouge si l'union rétrécit) ET le CANARI D'ABSENCE de
 * `but.pourquoi` (rouge si quelqu'un « harmonise » les deux ensembles). Le second ne se
 * déduit pas du premier.
 *
 * `but.pourquoi` EST RETIRÉ DES CANDIDATS, et c'est cette ligne-là qui justifie la
 * scission : le POURQUOI PRIVÉ de huit inconnus, pour une valeur discriminante que
 * `but.libelle` donne déjà. Le porteur, lui, le garde — c'est de LUI qu'on demande ce
 * qu'il éprouve.
 */
const CHEMINS_CANDIDAT: readonly string[] = [
	'monde.personnages[].fonction',
	'monde.personnages[].description_joueur',
	'monde.personnages[].but.libelle',
	'monde.personnages[].plan_actions[].action',
]

/** LE SEUL chemin de liste TRONQUÉ, et à son PREMIER élément, CHEZ LES CANDIDATS
 *  SEULEMENT — un plan d'actions entier par candidat, à `CANDIDATS_MAX` saturé, ferait
 *  exploser le contexte pour une valeur discriminante qui décroît à chaque étape. Chez
 *  le PORTEUR il n'est PAS tronqué : il n'y a qu'une fiche, et ce qu'il entreprend est
 *  ce qui le lie aux autres. AUCUNE CHAÎNE N'EST JAMAIS COUPÉE : on tronque une LISTE. */
const CHEMIN_TRONQUE = 'monde.personnages[].plan_actions[].action'

/**
 * LE CONTEXTE DU RÔLE RELATIONS, assemblé pour un dossier et un porteur.
 *
 * SÉLECTION DES CANDIDATS — déterministe, sans modèle :
 *  1. ⚠ EXCLURE LE PORTEUR (veto § 8, n° 6). Le motif technique — « il paraîtrait deux
 *     fois » — est VRAI MAIS INSUFFISANT : MESURÉ, l'invariant
 *     `entitesInjectees === [cible, ...rangs.values()]` reste SATISFAIT avec le
 *     doublon, et aucun instrument ne rougirait. CE QUI DÉCIDE est autre chose :
 *     `nom` n'est JAMAIS injecté (KR-195), donc RIEN NE DIT AU MODÈLE que le bloc
 *     `FICHE` et le bloc `P3` sont la même personne — il écrirait « il se méfie de
 *     lui » EN CROYANT QU'ILS SONT DEUX. Ce n'est pas un doublon, c'est une FICTION
 *     FAUSSE, invisible au validateur (`P3 ∈ rangs` ⇒ vert) comme à l'écran.
 *  2. exclure toute cible DÉJÀ LIÉE — un doublon cesse d'être REPRÉSENTABLE, il n'est
 *     pas « découragé » ;
 *  3. ordre : `portee === 'premier'` d'abord, puis l'ordre du document. `portee` est
 *     d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS injectée ;
 *  4. tronquer à `CANDIDATS_MAX` — RÉUTILISÉE TELLE QUELLE, jamais dupliquée ; ⚠ sa
 *     mesure vaut désormais pour DEUX rôles ;
 *  5. PAS UNE LIGNE, PAS DE RANG — un bloc de rang vide ENSEIGNERAIT « celui-là n'a
 *     rien », ce qui est une AFFIRMATION ; le repli est le SILENCE ;
 *  6. numéroter `P1`, `P2`, … AUCUNE conversion numérique nulle part : la
 *     re-résolution est un `Map.get` sur la chaîne telle quelle.
 *
 * SYMÉTRIE À N'ÉCRIRE QU'UNE FOIS : « pas une ligne, pas de jeu » sert DEUX fois — chez
 * un CANDIDAT elle lui coûte son rang (règle 5), chez le PORTEUR elle est le refus
 * `cible-a-ecrire`.
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` — ⚠ PREMIER RÔLE À
 * UTILISER LES QUATRE MOTIFS, et aucun motif neuf, aucune charge neuve :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — le porteur ne résout plus, OU aucun de SES chemins de fiche
 *      ne résout non vide. DISJONCTION, patron du rôle répliques et non prédicat nommé :
 *      un lien peut naître d'une FONCTION, d'une RÉPUTATION **ou** d'un BUT. SANS charge.
 *   3. `aucun-candidat` — table des rangs vide : tous déjà liés, ou il est seul, ou
 *      aucun n'a la moindre ligne injectable. Il n'y a RIEN à demander.
 *   4. `trop-long`      — REFUS, jamais de coupe (KR-230).
 */
export function assemblerRelations(dossier: Dossier, cible: CibleRelations): ContexteDetenteurs {
	const chemins = CHAMPS_INJECTES[ROLE_RELATIONS]
	const blocs: string[] = []
	const retenus = new Set<string>()

	// ── LE CANON, global ──────────────────────────────────────────────────────
	for (const chemin of chemins) {
		if (chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 1 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_RELATIONS]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── LE PORTEUR, premier ensemble ──────────────────────────────────────────
	// Refus 2, première moitié — il ne résout plus du tout (le dossier a changé sous
	// l'écran). MÊME motif que la seconde : « plus de fiche » et « une fiche sans une
	// ligne » demandent le même geste à l'auteur.
	const porteur = dossier.monde.personnages.find((candidat) => candidat.id === cible.personnageId)
	if (porteur === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	// LES CHEMINS DU PORTEUR SONT CEUX DE L'UNION, non ceux d'un candidat : c'est ici,
	// et nulle part ailleurs, que `but.pourquoi` entre dans le contexte.
	const lignesDuPorteur: string[] = []
	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(porteur, chemin, PREFIXE_PERSONNAGE)
		if (textes.length === 0) continue
		lignesDuPorteur.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 2, seconde moitié — LA DISJONCTION : pas UNE ligne de fiche écrite.
	if (lignesDuPorteur.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	blocs.push(`${EN_TETE_PORTEUR}\n${lignesDuPorteur.join('\n')}`)

	// ── LES CANDIDATS, second ensemble ────────────────────────────────────────
	// `textesDuChemin` et non un `some` maison : la lecture d'un dossier venu du disque
	// reste TOTALE (KR-116), et c'est la MÊME primitive que l'injection — sauf que
	// celle-ci SÉLECTIONNE et n'injecte rien. Mécanisme recopié de `./detenteurs`, sujet
	// inversé : là-bas on lit les SAVOIRS du candidat, ici les RELATIONS du porteur.
	const dejaLiees = new Set(textesDuChemin(porteur, ['relations[]', 'cible_id']))
	const libres = dossier.monde.personnages.filter(
		(candidat) => candidat.id !== porteur.id && !dejaLiees.has(candidat.id),
	)
	const ordonnes = [
		...libres.filter((candidat) => candidat.portee === 'premier'),
		...libres.filter((candidat) => candidat.portee !== 'premier'),
	]

	const rangs = new Map<RangInjecte, string>()
	// UNE traversée, DEUX projections — jamais deux listes à tenir en phase.
	const entitesInjectees: string[] = [porteur.id]

	for (const candidat of ordonnes.slice(0, CANDIDATS_MAX)) {
		const lignes: string[] = []
		for (const chemin of CHEMINS_CANDIDAT) {
			const textes = textesRediges(candidat, chemin, PREFIXE_PERSONNAGE)
			const retenues = chemin === CHEMIN_TRONQUE ? textes.slice(0, 1) : textes
			if (retenues.length === 0) continue
			lignes.push(`${chemin}\n${retenues.join('\n')}`)
		}
		// Règle 5 de la sélection — pas une ligne, pas de rang.
		if (lignes.length === 0) continue
		const rang = `P${rangs.size + 1}`
		rangs.set(rang, candidat.id)
		entitesInjectees.push(candidat.id)
		blocs.push(`${rang}\n${lignes.join('\n')}`)
	}

	// Refus 3 — personne à lui lier : il n'y a RIEN à demander.
	if (rangs.size === 0) return { ok: false, motif: 'aucun-candidat' }

	const texte = blocs.join('\n\n')
	// Refus 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_RELATIONS]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees, rangs }
}
