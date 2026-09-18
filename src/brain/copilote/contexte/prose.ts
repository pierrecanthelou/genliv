/**
 * L'ASSEMBLEUR DU PREMIER RÔLE — la prose d'UN champ d'UNE fiche.
 *
 * UNE FONCTION NOMMÉE PAR RÔLE, jamais un corps commun paramétré par le rôle : les
 * assembleurs diffèrent sur CINQ points (racine des chemins, blocs numérotés,
 * troncature à K, champ cible exclu côté prose, champ cible REQUIS côté
 * détenteurs), et une table de portées n'en couvrirait que deux (§ 8, TL-4). Il
 * n'y a AUCUNE branche `if (role === …)` dans ce dossier — ce qui varie est le
 * CORPS, pas une donnée.
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL, et il doit le rester : `../../CopiloteService` importe
// `assemblerProse` de ce dossier-ci, et ce module-ci importe sa CIBLE de lui.
// `import type` est EFFACÉ à l'émission, donc il n'existe aucun cycle au
// runtime — mais transformer cette ligne en import de VALEUR (une constante, une
// fonction) en créerait un vrai, avec son module à moitié initialisé. Si un jour
// une valeur doit circuler dans ce sens, elle descend dans `../types` — qui, lui,
// n'importe rien.
import type { CibleCopilote } from '../../CopiloteService'
import { PREFIXE_PERSONNAGE, textesRediges, type ContexteProse } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CHAMPS_INJECTES, PARTIES_REQUISES } from './registres'

const ROLE_PROSE = 'personnage-prose'

/**
 * LE CONTEXTE DU RÔLE PROSE, assemblé pour un dossier et une cible.
 *
 * SIX règles, toutes portées par un test :
 *  1. un champ marqué est RETIRÉ, jamais vidé ;
 *  2. le retrait est un retrait — aucune substitution ;
 *  3. une `PARTIES_REQUISES` vidée par le filtre ⇒ `{ok:false, motif:'a-ecrire'}`,
 *     AUCUN `fetch` ne part ;
 *  4. `texte.length > BUDGET_CARACTERES_CONTEXTE` ⇒ `{ok:false, motif:'trop-long'}`,
 *     AUCUN `fetch` non plus. À l'it1 on ne coupe rien, ON REFUSE : en rédaction,
 *     rien n'avance tout seul, donc le dégradé EST le refus (KR-230) ;
 *  5. le champ CIBLE n'est JAMAIS injecté dans sa propre demande — le montrer
 *     invite la paraphrase ;
 *  6. `canon.interdits_ton[]` VIDE est un état calme et légitime, jamais un
 *     manque : on ne refuse pas sur une liste vide.
 *
 * FORME DU TEXTE ASSEMBLÉ — décision de l'ouvrier, écrite ici plutôt
 * qu'inventée en silence : chaque bloc est le CHEMIN DE FEUILLE lui-même, suivi
 * d'une ligne par valeur, les blocs séparés par une ligne vide. Le chemin plutôt
 * qu'un libellé français parce qu'un libellé pour les huit chemins restants
 * exigerait huit entrées de plus dans `LIBELLE_DES_CHAMPS`, dont aucune n'aurait
 * de second lecteur (KR-109/KR-235) — et parce que le corps de requête porte DÉJÀ
 * le chemin de la cible : le vocabulaire est le même des deux côtés du fil.
 */
export function assemblerProse(dossier: Dossier, cible: CibleCopilote): ContexteProse {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === cible.entiteId)
	const blocs: string[] = []
	const retenus = new Set<string>()

	for (const chemin of CHAMPS_INJECTES[ROLE_PROSE]) {
		// Règle 5 — la cible n'est jamais injectée dans sa propre demande.
		if (chemin === cible.champ) continue
		const surLePersonnage = chemin.startsWith(PREFIXE_PERSONNAGE)
		if (surLePersonnage && personnage === undefined) continue
		// Règles 1 et 2 — RETRAIT, jamais substitution.
		const textes = surLePersonnage
			? textesRediges(personnage, chemin, PREFIXE_PERSONNAGE)
			: textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Règle 3 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_PROSE]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	const texte = blocs.join('\n\n')
	// Règle 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_PROSE]) return { ok: false, motif: 'trop-long' }

	return {
		ok: true,
		texte,
		// La cible ne résout pas (le dossier a changé sous l'écran) : aucune fiche
		// n'est injectée, et `entitesInjectees` le DIT plutôt que de le taire.
		entitesInjectees: personnage === undefined ? [] : [personnage.id],
	}
}
