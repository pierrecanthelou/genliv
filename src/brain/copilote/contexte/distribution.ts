/**
 * L'ASSEMBLEUR DU SIXIÈME RÔLE — qui cette histoire-là suppose, à partir du synopsis.
 *
 * SIXIÈME FONCTION NOMMÉE, ZÉRO BRANCHE DE RÔLE : ce dossier ne contient toujours aucun
 * `if (role === …)`. Ce qui varie entre les assembleurs est le CORPS, pas une donnée.
 *
 * ⚠ LE SEUL ASSEMBLEUR SANS ENTITÉ CIBLE. Les cinq précédents résolvent un porteur dans
 * le document et en tirent une fiche ; celui-ci part du CANON et ne désigne rien. C'est
 * pourquoi sa cible est à CHARGE VIDE, et pourquoi ni `'cible-a-ecrire'` ni
 * `'aucun-candidat'` n'y ont de sujet.
 *
 * `ContexteProse` est RÉUTILISÉ SANS ALIAS, comme aux rôles répliques et plan : un
 * `type ContexteDistribution = ContexteProse` serait une abstraction à un seul appelant
 * (KR-109), et `ContexteProse` est déjà réutilisé sans alias par trois rôles.
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL — voir `./prose`. `import type` est effacé à l'émission.
import type { CibleDistribution } from '../../CopiloteService'
import { PREFIXE_PERSONNAGE, textesRediges, type ContexteProse } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CHAMPS_INJECTES, DEJA_ECRITS_MAX, PARTIES_REQUISES } from './registres'

const ROLE_DISTRIBUTION = 'monde-distribution'

/**
 * L'EN-TÊTE DU BLOC DES DÉJÀ ÉCRITS.
 *
 * ⚠ `DEJA ECRIT`, ET JAMAIS `P…` NI `FICHE`. `P…` entrerait en collision avec
 * l'alphabet des rangs des deux rôles à jetons, et surtout il INVITERAIT À DÉSIGNER :
 * or ce bloc est une LISTE NÉGATIVE — ce que le modèle ne doit PAS reproposer —, et
 * rien, dans ce rôle, ne se désigne. `FICHE` est l'en-tête du PORTEUR au rôle
 * relations, et il n'y a pas de porteur ici.
 */
const EN_TETE_DEJA_ECRIT = 'DEJA ECRIT'

/** LE SEUL chemin de fiche de ce rôle, et il n'est pas re-listé : un test asserte son
 *  appartenance à `CHAMPS_INJECTES`. Nommé plutôt qu'écrit au site de la boucle, même
 *  motif que `CHEMIN_VERITE_CIBLE` et `CHEMIN_BUT_CIBLE`. */
const CHEMIN_DEJA_ECRIT = 'monde.personnages[].fonction'

/**
 * LE CONTEXTE DU RÔLE DISTRIBUTION, assemblé pour un dossier — et rien d'autre : la
 * cible est à CHARGE VIDE.
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire('canon.mj.synopsis_mj')` — LA SOURCE manque, est vide ou marquée ;
 *   2. `a-ecrire('canon.ton')` — le filtre générique des six rôles ;
 *   3. `trop-long` — REFUS, jamais de coupe (KR-230).
 * ⚠ L'ORDRE EST CELUI DE `PARTIES_REQUISES`, ET IL DÉCIDE CE QUE L'ÉCRAN NOMME : le
 * manque le plus SPÉCIFIQUE à cette carte avant le manque GÉNÉRIQUE. Un dossier à qui
 * manquent les deux s'entend nommer LE SYNOPSIS.
 *
 * ⚠ `'cible-a-ecrire'` ET `'aucun-candidat'` SONT SANS OBJET ICI, et le dire vaut mieux
 * que de les recopier par symétrie (famille BUG-084, KR-235). `'cible-a-ecrire'`
 * signifie « l'entité CIBLE n'a rien d'écrit » : la cible est `monde.personnages[]`,
 * VIDE PAR DÉFINITION avant que ce rôle serve. `'aucun-candidat'` demanderait un
 * ensemble à épuiser, et IL N'Y EN A PAS. UN MONDE VIDE EST LE CAS NOMINAL — c'est le
 * premier geste après l'écriture du synopsis —, donc l'un ou l'autre refuserait
 * l'usage principal du rôle au moment précis où il doit servir.
 *
 * LE BLOC DES DÉJÀ ÉCRITS — liste NÉGATIVE, déterministe, sans modèle :
 *  1. ne retenir que les personnages dont la `fonction` est RÉDIGÉE — un personnage
 *     sans fonction n'exclut rien, et un bloc vide enseignerait « celui-là n'a rien »,
 *     ce qui est une AFFIRMATION ; le repli est le SILENCE ;
 *  2. ordre : `portee === 'premier'` d'abord, puis l'ordre du document. `portee` est
 *     d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS injectée — mécanisme de
 *     3c réutilisé tel quel ;
 *  3. tronquer à `DEJA_ECRITS_MAX`.
 * ⚠ LE FILTRE PRÉCÈDE LA TRONCATURE, à l'inverse des deux rôles à rangs, ET C'EST LE
 * SENS MÊME DE LA BORNE : `CANDIDATS_MAX` borne les candidats EXAMINÉS, si bien qu'un
 * candidat muet y consomme une place de la fenêtre. Celle-ci borne les EXCLUS — douze
 * exclusions, pas douze fiches regardées. L'ordre inverse laisserait des personnages
 * sans fonction manger le budget d'exclusion sans rien exclure.
 *
 * ⚠ PAS UNE LIGNE, PAS DE BLOC : zéro `fonction` rédigée ⇒ le bloc est ABSENT, jamais
 * vide. Et le bloc ne porte AUCUN RANG — rien ne désigne personne (§ 8, n° 40).
 *
 * ⚠ LIMITE DÉCLARÉE : une borne de CONTEXTE n'est pas une garantie d'unicité. Au-delà
 * de `DEJA_ECRITS_MAX`, deux figures qui sont la même personne dite deux fois
 * redeviennent possibles, et SANS `nom` NI IDENTIFIANT RIEN NE PEUT LE CONSTATER
 * (KR-229). L'écran ne promet donc rien de tel.
 */
export function assemblerDistribution(dossier: Dossier, _cible: CibleDistribution): ContexteProse {
	const chemins = CHAMPS_INJECTES[ROLE_DISTRIBUTION]
	const blocs: string[] = []
	const retenus = new Set<string>()

	// ── LE CANON, global — et c'est ici que vit LA SOURCE ─────────────────────
	for (const chemin of chemins) {
		if (chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 1 et 2 — un champ requis vidé par le filtre refuse AVANT tout appel, et
	// l'ORDRE de la table décide lequel des deux l'écran nomme.
	for (const requis of PARTIES_REQUISES[ROLE_DISTRIBUTION]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── LES DÉJÀ ÉCRITS, liste NÉGATIVE ───────────────────────────────────────
	// UNE traversée, DEUX projections — la ligne injectée et l'identifiant audité
	// sortent de la MÊME itération ; ce ne sont pas deux listes à tenir en phase.
	const ecrits = dossier.monde.personnages
		.map((personnage) => ({ personnage, textes: textesRediges(personnage, CHEMIN_DEJA_ECRIT, PREFIXE_PERSONNAGE) }))
		.filter((candidat) => candidat.textes.length > 0)
	const ordonnes = [
		...ecrits.filter((candidat) => candidat.personnage.portee === 'premier'),
		...ecrits.filter((candidat) => candidat.personnage.portee !== 'premier'),
	].slice(0, DEJA_ECRITS_MAX)

	const entitesInjectees: string[] = []
	const lignes: string[] = []
	for (const candidat of ordonnes) {
		entitesInjectees.push(candidat.personnage.id)
		lignes.push(...candidat.textes)
	}
	// Pas une ligne, pas de bloc — jamais un bloc vide.
	if (lignes.length > 0) blocs.push(`${EN_TETE_DEJA_ECRIT}\n${lignes.join('\n')}`)

	const texte = blocs.join('\n\n')
	// Refus 3 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_DISTRIBUTION]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees }
}
