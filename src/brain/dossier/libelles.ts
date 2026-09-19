/**
 * LE LIBELLÉ D'ÉCRAN D'UN CHAMP — pour les écrans qui doivent NOMMER un champ
 * dont ils ne sont pas la fiche d'origine.
 *
 * PARTIELLE PAR CONSTRUCTION — n'entre ici qu'un champ (a) nommé par un écran qui
 * n'est PAS sa fiche d'origine, ET (b) réellement atteignable par une branche de
 * code de l'itération qui le réclame. AUCUNE garde d'exhaustivité : ce n'est pas
 * `destinations.ts`. Une ligne sans second consommateur est une dette (KR-109),
 * et une ligne sans producteur est la même faute appliquée à un registre (KR-235).
 *
 * ⚠ LA CONDITION (b) EST ÉCHUE POUR DEUX CHAMPS DE PLUS À L'ITÉRATION 4 DE LA N° 8,
 * et c'est ce qui fait passer ce registre de QUATRE à SIX entrées.
 * `canon.mj.synopsis_mj` en était exclu tant qu'aucune branche ne pouvait le
 * nommer ; le rôle `monde-distribution` est LE PREMIER À DEUX REQUIS et le porte en
 * tête de `PARTIES_REQUISES`, donc son refus `'a-ecrire'` le nomme désormais à
 * l'écran. `monde.personnages[].but.libelle` entre par l'autre porte : la 6ᵉ carte
 * rend DEUX proses par fiche proposée et doit les distinguer, ce qu'aucune ligne
 * anonyme ne ferait.
 * ⚠ `ACCROCHE JOUEUR` N'ENTRE TOUJOURS PAS, et ne doit pas être promue « puisqu'on
 * y est » (§ 8, n° 25) : elle est INJECTÉE mais JAMAIS REQUISE, donc aucune branche
 * ne peut la nommer — ce serait une ligne de registre SANS PRODUCTEUR.
 *
 * Chaînes reprises VERBATIM de leur fiche d'origine, aucune modifiée — c'est une
 * EXTRACTION, jamais une réécriture : `BlocIdentite.tsx` (`dossier-fiches`) pour
 * les trois proses d'identité, `PanneauCanon.tsx` (`dossier-canon`) pour le ton et
 * le synopsis, `BlocPlanActions.tsx` (`dossier-fiches`) pour le but.
 * `ACCROCHE JOUEUR` reste inline dans `PanneauCanon.tsx`, `POURQUOI` et `ÉCHÉANCE`
 * dans `BlocPlanActions.tsx`, et les `PLACEHOLDER_*` restent privés à leur fiche :
 * ils n'ont pas de second lecteur.
 *
 * ⚠ LA CO-PROPRIÉTÉ DES FICHES D'ORIGINE EST FORCÉE, PAS CHOISIE : poser une entrée
 * ici SANS repointer la fiche qui la cède laisse `libelles.test.ts` ROUGE (veto
 * d'encapsulation). Il n'existe AUCUN ÉTAT VERT INTERMÉDIAIRE entre les deux, ce
 * qui interdit d'en faire deux lots. L'isolation n'est pas entamée pour autant :
 * les fiches importent de `brain/`, jamais l'une l'autre.
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
	/** CÉDÉ PAR `PanneauCanon.tsx` à l'itération 4 de la n° 8. Le rôle
	 *  `monde-distribution` en fait son PREMIER requis, donc son refus `'a-ecrire'`
	 *  le nomme à l'écran — la condition d'entrée est échue, elle n'est pas forcée. */
	'canon.mj.synopsis_mj': {
		libelle: 'SYNOPSIS MJ',
		hint: 'interne — la vérité complète',
	},
	/** CÉDÉ PAR `BlocPlanActions.tsx` à l'itération 4 de la n° 8. La 6ᵉ carte rend
	 *  DEUX proses par fiche proposée et doit les distinguer : elle lit ce libellé
	 *  et celui de `fonction`, sans en retaper aucun. */
	'monde.personnages[].but.libelle': {
		libelle: "CE QU'IL VEUT",
		hint: "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur",
	},
} as const satisfies Record<string, LibelleDeChamp>

export type CheminLibelle = keyof typeof LIBELLE_DES_CHAMPS
