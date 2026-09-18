/**
 * LE NOYAU DE L'ASSEMBLAGE — ce qui NE VARIE PAS d'un rôle à l'autre.
 *
 * Deux choses vivent ici, et rien d'autre : les PRIMITIVES de lecture d'un
 * dossier venu du disque (totales, KR-116) et les FORMES RENDUES par les
 * assembleurs. C'est la moitié STABLE de la couture de scission : ce qui varie
 * par rôle est un CORPS (`./prose`, `./detenteurs`, `./repliques`, `./plan`), ce
 * qui doit rester TOTAL est un registre (`./registres`), et ce qui est partagé
 * par tous est ici.
 *
 * AUCUNE branche `if (role === …)` dans ce fichier, ni dans aucun de ses
 * voisins : ce qui diffère est le corps, jamais une donnée.
 */
import { MARQUEUR_A_ECRIRE } from '../../dossier/amorce'
import type { CheminLibelle } from '../../dossier/libelles'
import type { RangInjecte } from '../types'

/**
 * Les PRÉFIXES des chemins RESTREINTS à une entité désignée. Écrits UNE fois : les
 * chemins de `./registres` se lisent alors en familles — ce qui vient du canon
 * (global), ce qui vient de l'indice CIBLE, ce qui vient d'un CANDIDAT — sans
 * qu'aucune chirurgie de chaîne ne soit répartie dans le corps des assembleurs.
 */
export const PREFIXE_PERSONNAGE = 'monde.personnages[].'
export const PREFIXE_INDICE = 'monde.indices[].'

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » ne pointe pas un champ, il pointe la
	 *  fiche. Le champ injecté le plus long peut être `but.libelle` ou
	 *  `plan_actions[].action`, dont les libellés vivent dans des blocs que le
	 *  registre à quatre entrées ne porte pas — et n'a aucune raison de porter. */
	| { motif: 'trop-long' }
	/** NEUF — l'entité CIBLE n'a pas le contenu sans lequel la demande n'a pas de
	 *  sens (la `verite` de l'indice). AUCUNE charge, et c'est délibéré : le champ
	 *  n'a pas d'entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8) — le
	 *  texte d'écran le nomme EN PROSE, côté feature. */
	| { motif: 'cible-a-ecrire' }
	/** NEUF — aucun candidat numérotable : tous les personnages détiennent déjà cet
	 *  indice, ou aucun n'a la moindre ligne injectable. Refus AVANT tout `fetch` :
	 *  il n'y a rien à demander. Aucune charge, comme `trop-long`. */
	| { motif: 'aucun-candidat' }

export type ContexteProse =
	/** `texte` est DÉTERMINISTE : ni date, ni identifiant, ni aléa — c'est ce qui
	 *  rend « deux lancers ⇒ deux corps identiques » vrai par égalité stricte.
	 *  `entitesInjectees` vaut exactement une entrée quand la cible résout ; c'est
	 *  ce que le test de confinement compare. */
	{ ok: true; texte: string; entitesInjectees: readonly string[] } | ({ ok: false } & MotifRefusContexte)

/** La branche de SUCCÈS, NOMMÉE — un objet anonyme de cinq lignes dans une union
 *  se rend par Prettier avec une indentation mixte qu'ESLint refuse, et le rendre
 *  lisible ne vaut pas un `eslint-disable`. Non ré-exportée : `ContexteDetenteurs`
 *  lui-même ne franchit jamais `brain/copilote/`. */
interface ContexteDetenteursRendu {
	ok: true
	texte: string
	/** TOUTES les entités injectées — l'audit de confinement. Contient l'indice
	 *  CIBLE, qui n'a PAS de rang. UNE traversée, DEUX projections : chaque candidat
	 *  retenu pousse son identifiant ici ET son rang dans `rangs` dans la MÊME
	 *  itération de boucle — ce ne sont pas deux listes à tenir en phase, c'est un
	 *  sous-produit (KR-117).
	 *  INVARIANT ASSERTÉ PAR ÉGALITÉ, jamais par inclusion :
	 *  `entitesInjectees === [cible.indiceId, ...rangs.values()]`, ordre compris.
	 *  Un `⊆` resterait vert sur une entité injectée qu'on aurait oublié d'auditer —
	 *  c'est précisément le trou que cet audit existe pour fermer. */
	entitesInjectees: readonly string[]
	/** LES SEULES entités DÉSIGNABLES, jeton → identifiant. Le numéro écrit dans
	 *  `texte` et la clé de cette table sortent de la MÊME variable.
	 *  NE SORT JAMAIS de `brain/copilote/` — KR-231 tenu par la PORTÉE, pas par une
	 *  convention. */
	rangs: ReadonlyMap<RangInjecte, string>
}

export type ContexteDetenteurs = ContexteDetenteursRendu | ({ ok: false } & MotifRefusContexte)

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * Les TEXTES d'un chemin de feuille, indices compris — un chemin peut en rendre
 * zéro (champ optionnel absent), un (`canon.ton`) ou plusieurs
 * (`caractere.parler[]`, `plan_actions[].action`). Total : aucune forme n'est
 * supposée, rien ne lève (KR-116 — le dossier vient du disque).
 *
 * `hasOwnProperty.call` et non un simple index : tout objet littéral hérite
 * d'`Object.prototype`, et `…['toString']` rendrait une FONCTION (KR-175).
 */
export function textesDuChemin(racine: unknown, segments: readonly string[]): string[] {
	if (segments.length === 0) return typeof racine === 'string' ? [racine] : []
	const [tete, ...reste] = segments
	const estListe = tete.endsWith('[]')
	const cle = estListe ? tete.slice(0, -2) : tete
	if (!estObjet(racine) || !Object.prototype.hasOwnProperty.call(racine, cle)) return []
	const valeur = racine[cle]
	if (!estListe) return textesDuChemin(valeur, reste)
	if (!Array.isArray(valeur)) return []
	return valeur.flatMap((element) => textesDuChemin(element, reste))
}

/**
 * Le filtre du MARQUEUR : un texte qui CONTIENT `MARQUEUR_A_ECRIRE` est RETIRÉ —
 * jamais remplacé par `''`. Un `canon.ton` injecté vide enseignerait au modèle
 * « ce livre n'a pas de ton », ce qui est une AFFIRMATION ; le repli est le
 * SILENCE. `includes` et non `startsWith` : l'auteur peut éditer autour du
 * marqueur, et les chevrons `⟨ ⟩` ne se tapent pas au clavier (KR-223).
 */
function estRedige(texte: string): boolean {
	return texte.trim() !== '' && !texte.includes(MARQUEUR_A_ECRIRE)
}

/**
 * LES TEXTES RÉDIGÉS d'un chemin, résolus depuis la racine qui le porte. LA
 * PRIMITIVE PARTAGÉE par tous les assembleurs : elle fait la chirurgie de chaîne
 * UNE fois (retirer le préfixe de la famille, découper en segments) et applique le
 * filtre du marqueur. `prefixe` vaut `''` pour les chemins globaux — `''` est
 * préfixe de tout, donc la ligne n'a pas de branche.
 */
export function textesRediges(racine: unknown, chemin: string, prefixe: string): string[] {
	const relatif = chemin.startsWith(prefixe) ? chemin.slice(prefixe.length) : chemin
	return textesDuChemin(racine, relatif.split('.')).filter(estRedige)
}
