/**
 * L'ASSEMBLEUR DU QUATRIÈME RÔLE — la PROCHAINE ÉTAPE du plan d'actions d'UN
 * personnage.
 *
 * QUATRIÈME FONCTION NOMMÉE, ZÉRO BRANCHE DE RÔLE : ce dossier ne contient toujours
 * aucun `if (role === …)`. Ce qui varie entre les assembleurs est le CORPS, pas une
 * donnée — les primitives partagées (`textesRediges`, `estRedige`) font la
 * chirurgie de chaîne une seule fois.
 *
 * `ContexteProse` est RÉUTILISÉ SANS ALIAS, comme au rôle répliques : un
 * `type ContextePlan = ContexteProse` serait une abstraction à un seul appelant
 * (KR-109). La forme rendue est exactement celle du rôle prose — une fiche, un
 * texte — parce que c'est exactement ce qu'elle est.
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL — voir `./prose`. `import type` est effacé à l'émission.
import type { CiblePlan } from '../../CopiloteService'
import { PREFIXE_PERSONNAGE, textesRediges, type ContexteProse } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CHAMPS_INJECTES, PARTIES_REQUISES } from './registres'

const ROLE_PLAN = 'personnage-plan'

/** LE CHEMIN SANS LEQUEL LA DEMANDE DE PLAN N'A PAS DE SENS — un PRÉDICAT NOMMÉ SUR
 *  UN SEUL CHEMIN, mécanisme exact de `CHEMIN_VERITE_CIBLE` du rôle détenteurs, et
 *  NON la disjonction à sept chemins du rôle répliques.
 *
 *  MOTIF, et il est propre à ce rôle : ON N'INVENTE PAS UN PLAN À PARTIR DE RIEN.
 *  Un plan est la SUITE D'ÉTAPES VERS UN BUT ; sans but écrit, toute suite se vaut
 *  et le modèle inventerait le but en même temps que l'étape — c'est-à-dire qu'il
 *  écrirait, sans le dire, un champ que l'auteur n'a pas demandé.
 *  Ce n'est PAS la garde du rôle répliques (« pas UNE ligne d'identité ») : une
 *  fiche entièrement rédigée MAIS SANS BUT est un état parfaitement atteignable, et
 *  c'est précisément celui que ce refus doit attraper.
 *
 *  Il n'est pas re-listé : un test asserte son appartenance à `CHAMPS_INJECTES`. */
const CHEMIN_BUT_CIBLE = 'monde.personnages[].but.libelle'

/**
 * LE CONTEXTE DU RÔLE PLAN, assemblé pour un dossier et une cible.
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — le personnage ne résout plus, OU `but.libelle` est absent,
 *      vide ou marqué. Prédicat NOMMÉ sur UN chemin (`CHEMIN_BUT_CIBLE`). SANS
 *      charge, comme aux deux rôles précédents.
 *   3. `trop-long`      — REFUS, jamais de coupe (KR-230).
 *
 * `'aucun-candidat'` EST SANS OBJET ici — une seule entité, aucun rang à numéroter.
 * Ne pas l'écrire : ce serait du code mort présenté comme de la couverture (famille
 * BUG-084, KR-235).
 *
 * LE CHAMP CIBLE EST INJECTÉ, et c'est la seule pièce de doctrine neuve de la
 * tranche : `plan_actions[].action` figure dans la liste blanche de ce rôle, DANS
 * L'ORDRE DU DOCUMENT et NON TRONQUÉ. Il n'y a donc AUCUN saut d'exécution sur la
 * cible ici — au contraire des trois autres rôles, où la cible est exclue par
 * ABSENCE de la liste blanche. Le motif complet est au registre (`./registres`).
 *
 * ASYMÉTRIE DU REGRET, écrite pour qu'on ne la retourne pas par symétrie : injecter
 * risque un DOUBLON — visible à l'écran sous le bloc gelé, rejeté d'un clic ; ne pas
 * injecter risque une INCOHÉRENCE DE SUITE — invisible à l'écran, invisible au
 * validateur (KR-229), et jouée telle quelle par le rôle acteur au Temps 2. On prend
 * le risque qu'un instrument constate.
 * ⚠ AUCUN prédicat ne refuse la recopie d'une étape existante (§ 8, n° 12) : la
 * parade est le bloc GELÉ que l'auteur lit, plus une ligne d'invite PERSUASIVE.
 * L'écran ne doit donc rien promettre de tel.
 */
export function assemblerPlan(dossier: Dossier, cible: CiblePlan): ContexteProse {
	const chemins = CHAMPS_INJECTES[ROLE_PLAN]
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
	for (const requis of PARTIES_REQUISES[ROLE_PLAN]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── LA FICHE CIBLE ────────────────────────────────────────────────────────
	// Refus 2, première moitié — la cible ne résout plus du tout (le dossier a
	// changé sous l'écran). MÊME motif que la seconde : « plus de fiche » et « une
	// fiche sans but » demandent le même geste à l'auteur.
	const acteur = dossier.monde.personnages.find((candidat) => candidat.id === cible.acteurId)
	if (acteur === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	// Refus 2, seconde moitié — LE PRÉDICAT NOMMÉ, sur UN chemin.
	if (textesRediges(acteur, CHEMIN_BUT_CIBLE, PREFIXE_PERSONNAGE).length === 0) {
		return { ok: false, motif: 'cible-a-ecrire' }
	}

	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(acteur, chemin, PREFIXE_PERSONNAGE)
		if (textes.length === 0) continue
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	const texte = blocs.join('\n\n')
	// Refus 3 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_PLAN]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees: [acteur.id] }
}
