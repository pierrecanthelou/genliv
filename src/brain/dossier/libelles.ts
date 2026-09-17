/**
 * LE LIBELLÉ D'ÉCRAN D'UN CHAMP — pour les écrans qui doivent NOMMER un champ
 * dont ils ne sont pas la fiche d'origine.
 *
 * PARTIELLE PAR CONSTRUCTION — n'entre ici qu'un champ (a) nommé par un écran qui
 * n'est PAS sa fiche d'origine, ET (b) réellement atteignable par une branche de
 * code de l'itération qui le réclame. AUCUNE garde d'exhaustivité : ce n'est pas
 * `destinations.ts`. Une ligne sans second consommateur est une dette (KR-109),
 * et une ligne sans producteur est la même faute appliquée à un registre
 * (KR-235) : `canon.mj.synopsis_mj` n'y entre PAS malgré son voisinage avec
 * `canon.ton` — il n'est jamais requis, donc aucune branche ne peut le nommer.
 *
 * Chaînes reprises VERBATIM de leur fiche d'origine, aucune modifiée — c'est une
 * EXTRACTION, jamais une réécriture : `BlocIdentite.tsx` (`dossier-fiches`) pour
 * les trois proses d'identité, `PanneauCanon.tsx` (`dossier-canon`) pour le ton.
 * `SYNOPSIS MJ` et `ACCROCHE JOUEUR` restent inline dans `PanneauCanon.tsx`, et
 * les `PLACEHOLDER_*` restent privés à leur fiche : ils n'ont pas de second
 * lecteur.
 *
 * Ré-exporté par `brain/index.ts` — DEUX features le lisent (`dossier-fiches` /
 * `dossier-canon` d'un côté, `dossier-copilote` de l'autre), ce qui est KR-109 à
 * la lettre. C'est la différence avec `amorce.ts`, que rien n'exporte parce
 * qu'aucune feature ne le lit.
 */

export interface LibelleDeChamp {
	/** Le libellé MONO MAJUSCULE rendu au-dessus du champ (prop `label` de `Field`). */
	libelle: string
	/** Le qualificatif discret accolé au libellé (prop `hint` de `Field`). */
	hint: string
}

export const LIBELLE_DES_CHAMPS = {
	'monde.personnages[].fonction': {
		libelle: 'FONCTION',
		hint: 'interne — jamais lu par le joueur',
	},
	'monde.personnages[].apparence': {
		libelle: 'APPARENCE',
		hint: 'interne — jamais lu par le joueur — décrit, ne chiffre pas : la force se règle aux caractéristiques',
	},
	'monde.personnages[].description_joueur': {
		libelle: 'DESCRIPTION JOUEUR',
		hint: 'lue par le joueur',
	},
	'canon.ton': {
		libelle: 'TON',
		hint: 'interne — consigne injectée au modèle',
	},
} as const satisfies Record<string, LibelleDeChamp>

export type CheminLibelle = keyof typeof LIBELLE_DES_CHAMPS
