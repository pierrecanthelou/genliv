/**
 * LA POLITIQUE DE RÉTENTION DU NARRATEUR — n° 10 `moteur-interprete`, it3, lot `contrat`.
 *
 * TROIS QUESTIONS, TROIS FONCTIONS, et aucune ne lit autre chose que la session :
 *  · QUELS PAS le narrateur relit en entier ? ceux de la fenêtre glissante
 *    `(borneDeFenetre(t), t]`, DÉRIVÉE DE L'HORLOGE SEULE ;
 *  · QUELS PAS sont à condenser maintenant ? `pasACondenser` — la tranche de `CADENCE`
 *    pas qui suit ce que le résumé couvre déjà, tant qu'elle est sortie de la fenêtre ;
 *  · QUELS FAITS sont réinjectés ? `faitsPertinents` — ceux dont une ancre est ICI, au
 *    plus `FAITS_INJECTES_MAX`, les plus récents.
 *
 * LA CADENCE NE VIT QU'ICI (KR-273) : l'invite qui demande la condensation au modèle en
 * décide d'après le CONTENU de la demande (la présence de la tranche à condenser), jamais
 * d'après un compte de pas. Une seconde écriture de la cadence dériverait de celle-ci.
 *
 * ⚠ LA FENÊTRE N'EST JAMAIS STOCKÉE (KR-013) : elle se calcule de `horloge.tour`, donc un
 * pas joué en console y entre comme les autres — sans récit, sous le libellé de son
 * geste —, et un échec de condensation ne l'élargit jamais. La calculer depuis ce que le
 * résumé couvre la ferait dépendre du succès d'un modèle, et dépasser `FENETRE_MAX`
 * après un seul échec (R2 du raffinage).
 *
 * MODULE PUR, sans dépendance de service ni de réseau : il part avec `src/player/` le jour
 * de l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6), même doctrine que `session.ts`
 * et `recit.ts`. Il ne nomme jamais le service qui parle au modèle, même en commentaire :
 * `brain/dossier/` est sous interdiction TOTALE (KR-260), un balayage de texte.
 */
import type { EtatSession, FaitEtabli } from './session'

/** LE PLANCHER DE LA FENÊTRE, en pas — VALEUR DE DÉCISION du comité, pas une mesure. Au
 *  pas de bascule, le narrateur relit au moins ces pas-là en entier. En début de partie,
 *  la fenêtre vaut `t` et n'est JAMAIS forcée à ce plancher : on ne relit pas des pas qui
 *  n'existent pas. */
export const FENETRE_MIN = 5

/** LA CADENCE DE CONDENSATION, en pas — VALEUR DE DÉCISION. C'est aussi la largeur d'une
 *  tranche à condenser : le résumé avance d'une cadence à chaque condensation réussie. */
export const CADENCE = 10

/** LE PLAFOND DE LA FENÊTRE — DÉRIVÉ, jamais écrit ni stocké : la fenêtre glisse de
 *  `FENETRE_MIN` à `FENETRE_MIN + CADENCE − 1` pas, puis retombe d'une cadence. */
export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1

/** LE PLAFOND D'INJECTION DES FAITS — VALEUR DE DÉCISION. Il borne ce qui REPART au
 *  modèle, jamais ce qui est STOCKÉ (ajout seul, sans plafond : évincer ramènerait les
 *  contradictions). C'est ce terme-ci, et lui seul, que le budget de contexte lit. */
export const FAITS_INJECTES_MAX = 8

/**
 * LA BORNE BASSE DE LA FENÊTRE AU PAS `pas` — la fenêtre est `(borneDeFenetre(pas), pas]`.
 *
 * `CADENCE × max(0, ⌊(pas − FENETRE_MIN) / CADENCE⌋)` — toujours un multiple de `CADENCE`,
 * jamais négative, jamais au-delà de `pas`. Table épinglée par `memoire.test.ts` :
 * 4 → 0 (fenêtre de 4), 14 → 0 (14), 15 → 10 (5), 24 → 10 (14), 25 → 20 (5).
 *
 * Le paramètre se nomme `pas`, jamais `tour` (`docs/REGLES-PLAY.md` § J1).
 */
export function borneDeFenetre(pas: number): number {
	return CADENCE * Math.max(0, Math.floor((pas - FENETRE_MIN) / CADENCE))
}

/**
 * LA TRANCHE À CONDENSER, ou `null` — `{ de, a }`, bornes INCLUSES.
 *
 * Elle suit IMMÉDIATEMENT ce que le résumé couvre déjà (`resume.jusqu_au_pas`, 0 s'il
 * n'existe pas) et n'est due que si ce point est EN RETARD sur la borne de fenêtre : un pas
 * sorti de la fenêtre et que rien ne résume encore. `a` ne dépasse JAMAIS la borne — la
 * tranche et la fenêtre ne se recouvrent pas —, puisque les deux sont des multiples de
 * `CADENCE` (I2, `session.ts`).
 *
 * APRÈS UN ÉCHEC — condensation refusée, ou pas de bascule joué en console —, la tranche
 * RESTE DUE au pas suivant, parce que `jusqu_au_pas` n'a pas bougé : c'est ce qui rend la
 * reprise DÉTERMINISTE (KR-271), sans aucun drapeau de « condensation en attente ».
 * Pendant un retard de plus d'une cadence, les pas entre `a` et la borne ne sont lus
 * nulle part : trou BORNÉ et nommé, rattrapé d'une cadence à chaque succès — leurs faits,
 * eux, restent injectés.
 */
export function pasACondenser(session: EtatSession): { readonly de: number; readonly a: number } | null {
	const couvert = session.memoire?.resume?.jusqu_au_pas ?? 0
	return couvert < borneDeFenetre(session.horloge.tour) ? { de: couvert + 1, a: couvert + CADENCE } : null
}

/**
 * LES FAITS QUI REPARTENT AU MODÈLE — ceux dont UNE ancre au moins désigne le lieu où se
 * tient le héros ou un objet qu'il possède ; les `FAITS_INJECTES_MAX` plus récents, dans
 * l'ORDRE CHRONOLOGIQUE du stockage.
 *
 * ⚠ LA PERTINENCE EST UNE PRÉSENCE QUI PEUT DISPARAÎTRE PUIS REVENIR (KR-272) : un lieu
 * qu'on quitte et où l'on revient, un objet qu'on perd et qu'on retrouve. C'est pourquoi
 * une ancre n'est jamais un indice ni un jalon — ces ensembles ne font que croître, et un
 * fait ancré sur eux serait sélectionné pour toujours : le filtre dégénérerait en « tous
 * les faits ».
 *
 * Un fait EXCLU d'ici reste STOCKÉ : ce n'est pas un oubli, c'est un choix de ce pas-ci.
 */
export function faitsPertinents(session: EtatSession): readonly FaitEtabli[] {
	const faits = session.memoire?.faits_etablis ?? []
	const presents = new Set<string>([session.monde.lieu_courant, ...session.monde.objets_possedes])
	return faits.filter((fait) => fait.sur.some((ancre) => presents.has(ancre))).slice(-FAITS_INJECTES_MAX)
}
