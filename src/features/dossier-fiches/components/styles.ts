import type { CSSProperties } from 'react'

/**
 * Le bouton pointillé « + Ajouter… » / « + Régler… » — l'affordance d'état vide
 * du dépôt (§ 3 du plan d'itération 3 de `dossier-fiches`, « Pas un composant
 * neuf »). Sentence case, pas mono, pas majuscules : c'est une ACTION, pas un
 * libellé de champ.
 *
 * Pourquoi un module et pas une copie de plus : `PanneauPersonnages.tsx`
 * importe des VALEURS de `FichePersonnage.tsx` (`LIBELLES_CAMP`,
 * `LIBELLES_PORTEE`), donc un import de valeur en sens inverse créerait un
 * cycle d'exécution réel. Un module tiers que ni l'un ni l'autre n'importe en
 * retour n'en crée aucun — deux appelants réels, pas une abstraction
 * spéculative (précédent : `dossier-canon/utils/refusMessages.ts`, it2).
 * Ce style n'est PAS promu à `brain/components/` : un seul feature le consomme
 * (KR-109), et c'est un objet de style, pas un composant.
 */
export const boutonPointilleStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'center',
	width: '100%',
	boxSizing: 'border-box',
	minHeight: 'var(--hit-target)',
	padding: '7px 10px',
	border: '1.5px dashed var(--accent)',
	borderRadius: 'var(--r-md)',
	background: 'var(--accent-bg)',
	color: 'var(--accent)',
	fontFamily: 'var(--font-ui)',
	fontSize: 'var(--fs-body)',
	cursor: 'pointer',
}
