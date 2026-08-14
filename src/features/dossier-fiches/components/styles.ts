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

/**
 * L'eyebrow mono majuscules — label de sous-section (« CAMP », « PV »,
 * « ÉTAPE {n} », « OBJECTIF PERSONNEL »…). Partagé depuis l'itération 4 par
 * `BlocCaracteristiques.tsx` et `BlocPlanActions.tsx` (deux appelants réels en
 * plus de `FichePersonnage.tsx` lui-même) — auparavant local à ce dernier.
 */
export const eyebrowStyle: CSSProperties = {
	display: 'block',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-eyebrow)',
	color: 'var(--text-label)',
	letterSpacing: 'var(--track-eyebrow)',
	marginBottom: 5,
}

/** La légende mono discrète sous un groupe de champs (« Caractéristiques —
 *  jamais lues par le narrateur. », le hint d'un `Stepper` qui n'a pas de prop
 *  `hint`…). Même raison de partage que `eyebrowStyle`. */
export const legendeStyle: CSSProperties = {
	margin: 0,
	marginTop: 'var(--space-2)',
	fontFamily: 'var(--font-mono)',
	fontSize: 'var(--fs-meta)',
	color: 'var(--text-faint)',
}

/** Le séparateur horizontal au-dessus d'une sous-section qui prolonge un bloc
 *  (la ligne PV du bloc 3, la section Contre-mesures du bloc 4 — « Séparateur
 *  identique à la ligne PV du bloc 3 », §3.C du plan d'itération 4). */
export const separateurStyle: CSSProperties = {
	marginTop: 'var(--space-2)',
	paddingTop: 'var(--space-5)',
	borderTop: '1px solid var(--border-divider)',
}

/**
 * La liste verticale de lignes répétées (étapes de plan d'actions, relations,
 * présences…), et la ligne elle-même — `<div>` bordée, jamais `ListRow` (sa
 * racine `<button>` ne peut pas porter de champs interactifs, précédent
 * `BlocPlanActions.tsx` it4). Déplacé ici en revue de PR d'it5 : la 3ᵉ copie
 * octet pour octet (`BlocRelations.tsx`, `BlocPresence.tsx`, en plus de
 * `BlocPlanActions.tsx`) dépassait le seuil que ce fichier existe pour éviter
 * — trois consommateurs réels de la MÊME feature, pas une abstraction
 * spéculative (précédent `boutonPointilleStyle`, deux consommateurs, ci-dessus).
 */
export const listeLignesStyle: CSSProperties = {
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-3)',
	marginTop: 'var(--space-3)',
}

export const ligneStyle: CSSProperties = {
	border: '1px solid var(--border-divider)',
	background: 'var(--surface-sunken)',
	borderRadius: 'var(--r-md)',
	padding: 'var(--space-4)',
	display: 'flex',
	flexDirection: 'column',
	gap: 'var(--space-4)',
}

/** L'en-tête d'une ligne répétée (eyebrow « ÉTAPE {n} »/« RELATION {n} »/
 *  « PRÉSENCE {n} » + `IconButton` de retrait). */
export const enTeteLigneStyle: CSSProperties = {
	display: 'flex',
	alignItems: 'center',
	justifyContent: 'space-between',
}
