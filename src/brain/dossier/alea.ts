/**
 * `brain/dossier/alea.ts` — L'ALÉA KEYÉ DU MOTEUR (n° 11 `moteur-arbitre`, lot
 * `contrat`, it1).
 *
 * PREMIER CONSOMMATEUR RÉEL de `EtatSession.graine_alea` — posée, requise et
 * injectée, depuis le lot `contrat` de la n° 9 (`moteur-dossier`), SANS LECTEUR
 * jusqu'à ce lot (KR-249, exemption nommée alors). Ce module la lit enfin.
 *
 * DEUX FONCTIONS, ET LEUR SIGNATURE EST FIGÉE AU § 4 DU PLAN D'ITÉRATION,
 * ARBITRÉE AU RAFFINAGE (§ 8 #4) :
 *  · `alea(graine, domaine, indice): number` — PURE, SANS ÉTAT : la même clé
 *    rend TOUJOURS la même valeur, quel que soit l'ordre d'appel. C'est le texte
 *    littéral du `brain_contract` acté au cadrage, préservé sans amendement.
 *    `REJETÉ` au raffinage : `fluxAlea(graine,domaine,indice): () => number`
 *    (une fonction UNIQUE) — aucune base dans les dix notes de cadrage, aurait
 *    réécrit les `brain_contracts` sans bénéfice net.
 *  · `creerRng(graine, domaine, indice): () => number` — l'ADAPTATEUR pour les
 *    consommateurs `rng: () => number` (`rollCreationPool` ici,
 *    `resolveChallenge` en it2). `indice` y est une clé d'USAGE — 0 = le premier
 *    tirage, 1 = la relance —, JAMAIS une position consommée séquentiellement
 *    entre deux usages : un flux séquentiel (`REJETÉ`, proposition QA au
 *    cadrage, tour 1) casserait le rejeu de toute session déjà jouée dès qu'un
 *    tirage est inséré ailleurs par une itération future (n° 13, combat).
 *
 * `creerRng` est un ADAPTATEUR AU-DESSUS D'`alea`, jamais un second générateur :
 * il ferme sur un compteur LOCAL `position`, qui avance d'UN cran par appel de la
 * fermeture rendue, et combine `indice` (la clé d'usage) et `position` (le rang
 * du tirage DANS cet usage) en une clé UNIQUE passée à `alea`. `DECALAGE_USAGE`
 * (1 000 000) sépare les ZONES de deux usages : aucune session de ce jeu ne tire
 * jamais plus de quelques dizaines de valeurs pour un seul usage (`heros`
 * consomme exactement 17 tirages, § 7 du plan), donc la marge est large SANS
 * jamais faire de `position` une position GLOBALE — chaque `indice` garde sa
 * PROPRE zone, jamais partagée, ce qui est précisément ce qui rend deux usages
 * INDÉPENDANTS : tirer de l'un n'affecte JAMAIS la suite de l'autre, quel que
 * soit l'ordre d'appel entre les deux (`alea.test.ts`, « indépendance des clés »).
 *
 * `DomaineAlea` EST UNE UNION FERMÉE À UN SEUL MEMBRE AUJOURD'HUI, ET C'EST
 * DÉLIBÉRÉ (même doctrine que `AttenteClarification` dans `session.ts`) :
 * `'jet'` entre en it2 AVEC son consommateur (`resolveChallenge`, KR-249) —
 * l'ajouter par anticipation ouvrirait un domaine sans tirage réel.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6). Aucun `Math.random`, aucune
 * horloge système, aucun état de module partagé entre deux appels.
 */

/** Le domaine d'un tirage — union FERMÉE, voir la docstring de tête. */
export type DomaineAlea = 'heros'

/**
 * SÉPARE LES ZONES DE DEUX USAGES À L'INTÉRIEUR D'UN MÊME `creerRng` — voir la
 * docstring de tête. Une marge, jamais une borne mesurée : aucune session ne
 * tire assez de valeurs pour un seul usage pour l'atteindre.
 */
const DECALAGE_USAGE = 1_000_000

/**
 * Un hachage FNV-1a (32 bits) du nom de domaine — une CHAÎNE COURTE, fixe par
 * domaine, jamais une valeur qui varie à l'intérieur d'un même appel. Dérivé du
 * texte plutôt que d'un code en dur : un second domaine (`'jet'`, it2) n'exige
 * aucune table de correspondance à tenir à jour.
 */
function hacherDomaine(domaine: DomaineAlea): number {
	let hash = 0x811c9dc5 // base FNV-1a (32 bits)
	for (let i = 0; i < domaine.length; i += 1) {
		hash ^= domaine.charCodeAt(i)
		hash = Math.imul(hash, 0x01000193) // premier FNV (32 bits)
	}
	return hash >>> 0
}

/**
 * Le MÉLANGE final (finaliseur de type Murmur3, 32 bits) — c'est lui qui donne à
 * `alea` sa propriété d'avalanche : deux clés voisines (`indice` et `indice+1`,
 * par exemple) rendent des valeurs sans relation visible entre elles.
 */
function melanger(valeur: number): number {
	let x = valeur >>> 0
	x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
	x = Math.imul(x ^ (x >>> 16), 0x45d9f3b)
	x ^= x >>> 16
	return x >>> 0
}

/**
 * LE TIRAGE PUR — la même clé `(graine, domaine, indice)` rend TOUJOURS la même
 * valeur dans `[0, 1)`, et l'ordre des appels n'a AUCUNE influence : rien n'est
 * lu ni écrit entre deux appels, il n'existe pas d'« appel précédent ».
 *
 * Les trois entrées sont combinées par XOR après multiplication par deux
 * constantes impaires sans rapport (`0x9e3779b9`, `0x85ebca6b` — les mêmes
 * constantes qu'emploient plusieurs générateurs 32 bits publiés, choisies pour
 * leur distribution de bits, pas inventées ici), puis passées au mélangeur. Le
 * résultat, un entier non signé 32 bits, est divisé par `2**32` : le maximum
 * (`2**32 − 1`) reste strictement sous `1`.
 */
export function alea(graine: number, domaine: DomaineAlea, indice: number): number {
	const combinaison =
		(graine >>> 0) ^ Math.imul(hacherDomaine(domaine), 0x9e3779b9) ^ Math.imul(indice >>> 0, 0x85ebca6b)
	return melanger(combinaison) / 4294967296
}

/**
 * L'ADAPTATEUR `() => number` — voir la docstring de tête pour le choix de
 * `DECALAGE_USAGE`. Chaque appel de `creerRng` rend une fermeture NEUVE, avec son
 * propre compteur `position` reparti à zéro : deux appels à `creerRng` avec la
 * MÊME clé rendent donc deux générateurs qui tirent la MÊME suite, et deux appels
 * à des `indice` DIFFÉRENTS ne se voient jamais l'un l'autre.
 */
export function creerRng(graine: number, domaine: DomaineAlea, indice: number): () => number {
	let position = 0
	return () => {
		const valeur = alea(graine, domaine, indice * DECALAGE_USAGE + position)
		position += 1
		return valeur
	}
}
