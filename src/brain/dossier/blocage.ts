/**
 * LE BLOCAGE D'UNE ÉTAPE DE PLAN — le prédicat pur qui dit si la durée de l'étape COURANTE d'un
 * personnage tombe à ce pas (n° 14 `moteur-horloge`, it3, `docs/REGLES-PLAY.md` § J2, écrit AVANT
 * ce code).
 *
 * UNE SEULE FONCTION, `etapeBloqueeAuPas`, PURE et TOTALE : elle ne lit que ses trois arguments,
 * n'écrit rien, ne lève jamais, n'appelle ni modèle ni dé. Elle est le SEUL SITE DE DÉCISION du
 * blocage (KR-246) : `tickHorloge` l'appelle pour écrire le constat au journal, et l'assembleur du
 * narrateur l'appelle pour choisir la didascalie `si_bloque` — aucun des deux n'écrit la
 * formule. Deux sites de décision se désynchroniseraient en silence : le journal dirait « bloqué »
 * à un pas où le narrateur ne jouerait rien, ou l'inverse.
 *
 * LA FORMULE — UNE ÉGALITÉ, JAMAIS UNE INÉGALITÉ :
 *
 *     constat  ⟺  courante.duree est posée  ET  origine existe  ET  tour − origine === duree
 *
 * `===` et non `>=`, et c'est une décision de J2 (it3), pas un détail : un blocage est un
 * ÉVÉNEMENT du pas où l'échéance tombe, pas un niveau. Avec `>=`, le même constat serait rendu à
 * CHAQUE pas suivant — une ligne de journal identique par commande, et un narrateur qui raconterait
 * le même geste en boucle. À `durée − 1` comme à `durée + 1`, il n'y a PAS de constat. La conséquence
 * assumée : le blocage ne se « rattrape » pas — un tick sauté à ce pas ne le rend jamais, ce que J1
 * interdit de toute façon (un pas = une commande acceptée, le tick tourne à chacune).
 *
 * LE RANG ET L'ÉTAPE COURANTE : `rang = entree?.etape_plan?.rang ?? 0` — ABSENT ≡ RANG 0 (KR-013),
 * `rang` est un INDEX dans `plan_actions[]`, jamais le champ `etape` (KR-198) — et la courante est
 * `personnage.plan_actions?.[rang]`. Le DERNIER rang est une étape comme une autre : il peut être
 * bloqué (le tick, lui, n'avance plus au-delà). Un rang négatif, non entier, non nombre, ou au-delà
 * du plan ne désigne aucune étape : `undefined`, sans lever (une session persistée contre un
 * dossier édité, une session forgée).
 *
 * L'ORIGINE DU DÉCOMPTE — le pas où le personnage est entré dans son étape courante. Elle se LIT, elle
 * ne se stocke pas (KR-013), selon trois cas exclusifs (`docs/REGLES-PLAY.md` § J2) :
 *  (a) `etape_plan.depuis` écrit → `depuis`, quel que soit le rang ;
 *  (b) `depuis` non écrit ET rang `0` (ou `etape_plan` ABSENT) → `0` : l'étape de départ est occupée
 *      depuis l'ouverture de la partie. C'est le même fait que « absent ≡ rang 0 », pas une
 *      devinette — et c'est ce qui rend atteignable la durée de l'étape que presque tout plan porte
 *      seule ;
 *  (c) `depuis` non écrit ET rang ≥ 1 (une session de 0.7.21, `{ rang }` sans `depuis`) → PAS
 *      D'ORIGINE, donc JAMAIS de constat : le moteur n'invente ni `0` ni le pas courant pour une
 *      entrée qu'il n'a pas datée (KR-251 : `depuis` est optionnel à vie).
 * Le cas (b) ne contredit pas (c) : `0` y est un fait de l'ouverture, pas une origine inventée.
 *
 * CE QU'ELLE NE LIT PAS : ni `declencheur_*` (un avancement est le tick, et L'AVANCEMENT EMPORTE LE
 * BLOCAGE — l'exclusion est le flot de contrôle du tick, pas ce prédicat), ni `si_bloque` (le
 * constat existe même quand l'auteur n'a rien rédigé), ni `action`, ni `etape`.
 *
 * LA PORTÉE RÉELLEMENT TENUE (KR-258) : dans `src/brain/dossier/`, hors tests, ce module et
 * `validate.ts` lisent `.duree` — ce dernier pour l'avertissement sur un `si_bloque` orphelin, qui
 * n'est pas une décision de jeu ; ni `src/brain/copilote/` ni `src/player/` ne la lisent. `blocage.test.ts`
 * en balaie la source. Ce n'est pas « le seul lecteur du dépôt » : les panneaux d'édition de
 * `src/features/` la lisent pour la saisir.
 *
 * `import type` SEULEMENT, vers `./faits` et `./types` : feuille du graphe, aucune arête de valeur —
 * `tickHorloge` (`horloge.ts`) et l'assembleur du narrateur (`copilote/contexte/horloge.ts`) la
 * consomment, jamais l'inverse. Le module n'est PAS exporté par `brain/index.ts` (garde dans
 * `evaluate.test.ts`) : la seule porte vers une feature est `executerCommande`.
 *
 * AUCUNE MÉMOÏSATION (KR-013/113). MODULE PUR : il part avec `src/player/` le jour de l'extraction
 * (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import type { EtatPnj } from './faits'
import type { Personnage, PlanAction } from './types'

/**
 * Le constat d'un blocage : `rang` est l'INDEX de l'étape bloquée dans `plan_actions[]` (base 0 —
 * le journal l'écrit en base 1), `courante` cette étape elle-même, pour que le lecteur d'une prose
 * (`si_bloque`) ne relise pas le plan.
 */
export interface ConstatDeBlocage {
	readonly rang: number
	readonly courante: PlanAction
}

/**
 * L'ÉTAPE COURANTE DE `personnage` EST-ELLE BLOQUÉE AU PAS `tour` ? — le constat si oui, `undefined`
 * sinon. `entree` est `monde.pnj[personnage.id]`, `undefined` quand le personnage n'en a pas ;
 * `tour` est `EtatSession.horloge.tour` AU PAS COURANT. Voir la docstring de tête.
 */
export function etapeBloqueeAuPas(
	personnage: Personnage,
	entree: EtatPnj | undefined,
	tour: number,
): ConstatDeBlocage | undefined {
	const rang = entree?.etape_plan?.rang ?? 0
	// RANG HORS BORNES : négatif ou non entier — aucune étape. `plan_actions[-1]` serait `undefined`
	// de toute façon, mais une garde explicite ne dépend pas de la façon dont un moteur indexe.
	if (!Number.isInteger(rang) || rang < 0) return undefined

	const courante = personnage.plan_actions?.[rang]
	const duree = courante?.duree
	if (courante === undefined || duree === undefined) return undefined

	// L'ORIGINE : `depuis` quand il est écrit ; sinon `0` pour l'étape de départ ; sinon AUCUNE.
	const origine = entree?.etape_plan?.depuis ?? (rang === 0 ? 0 : undefined)
	if (origine === undefined) return undefined

	return tour - origine === duree ? { rang, courante } : undefined
}
