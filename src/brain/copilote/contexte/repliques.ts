/**
 * L'ASSEMBLEUR DU TROISIÈME RÔLE — la voix d'UN personnage.
 *
 * TROISIÈME FONCTION NOMMÉE, ZÉRO BRANCHE DE RÔLE : ce dossier ne contient toujours
 * aucun `if (role === …)`. Ce qui varie entre les assembleurs est le CORPS, pas une
 * donnée — les primitives partagées (`textesRediges`, `estRedige`) font la
 * chirurgie de chaîne une seule fois.
 */
import type { Dossier } from '../../dossier/types'
// CYCLE DE TYPE SEUL — voir `./prose`. `import type` est effacé à l'émission.
import type { CibleRepliques } from '../../CopiloteService'
import { PREFIXE_PERSONNAGE, textesRediges, type ContexteProse } from './noyau'
import { BUDGET_CARACTERES_CONTEXTE, CHAMPS_INJECTES, PARTIES_REQUISES } from './registres'

const ROLE_REPLIQUES = 'personnage-repliques'

/**
 * L'ASSEMBLEUR DU TROISIÈME RÔLE — la voix d'UN personnage.
 *
 * `ContexteProse` est RÉUTILISÉ SANS ALIAS : un `type ContexteRepliques =
 * ContexteProse` serait une abstraction à un seul appelant (KR-109), et le renommer
 * rouvrirait la signature de l'it1 (dette nommée, même rang que `CibleCopilote`).
 * La forme rendue est exactement celle du rôle prose — une fiche, un texte — parce
 * que c'est exactement ce qu'elle est.
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — AUCUN des SEPT chemins de préfixe `monde.personnages[].`
 *      ne résout non vide (ou la cible ne résout plus du tout). SANS charge.
 *   3. `trop-long`      — REFUS, jamais de coupe (KR-230).
 *
 * `'aucun-candidat'` EST SANS OBJET ici — une seule entité, aucun rang à numéroter.
 * Ne pas l'écrire : ce serait du code mort présenté comme de la couverture.
 *
 * LE REFUS 2, ET C'EST LA SEULE PIÈCE DE MÉCANISME NEUVE DE CETTE TRANCHE. Le
 * PRÉDICAT de vacuité est réutilisé tel quel — `estRedige` (`./noyau`), module-local
 * et non exportée, appelée par `textesRediges` : rien à exporter, rien à déplacer. Ce
 * qui est neuf est le QUANTIFICATEUR : l'it2 teste UN chemin nommé
 * (`CHEMIN_VERITE_CIBLE`), ici c'est une DISJONCTION sur sept chemins. Aucun seuil
 * numérique n'y entre.
 *
 * DISCRIMINANT, écrit pour qu'on ne l'étende pas par symétrie : ON PEUT INVENTER UNE
 * FONCTION À PARTIR DE RIEN — c'est la page blanche que le but de la feature nomme ;
 * ON NE PEUT PAS INVENTER UNE VOIX À PARTIR DE RIEN. Le garde vaut pour CE rôle, et
 * pour lui seul (§ 8, n° 36).
 */
export function assemblerRepliques(dossier: Dossier, cible: CibleRepliques): ContexteProse {
	const chemins = CHAMPS_INJECTES[ROLE_REPLIQUES]
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
	for (const requis of PARTIES_REQUISES[ROLE_REPLIQUES]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── LA FICHE CIBLE ────────────────────────────────────────────────────────
	// Refus 2, première moitié — la cible ne résout plus du tout (le dossier a
	// changé sous l'écran). MÊME motif que la seconde : « plus de fiche » et « une
	// fiche sans une ligne » demandent le même geste à l'auteur.
	const fiche = dossier.monde.personnages.find((candidat) => candidat.id === cible.personnageId)
	if (fiche === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	const blocsDeLaFiche: string[] = []
	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(fiche, chemin, PREFIXE_PERSONNAGE)
		if (textes.length === 0) continue
		blocsDeLaFiche.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 2, seconde moitié — LA DISJONCTION : pas UNE ligne d'identité écrite.
	if (blocsDeLaFiche.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	blocs.push(...blocsDeLaFiche)

	const texte = blocs.join('\n\n')
	// Refus 3 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_REPLIQUES]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees: [fiche.id] }
}
