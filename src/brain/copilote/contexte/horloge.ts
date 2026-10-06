/**
 * LE BLOC `PENDANT CE TEMPS` DU NARRATEUR — ce que les personnages PRÉSENTS ont fait, ou changé
 * d'approche, pendant le pas que R3 raconte (n° 14 `moteur-horloge`, it2 puis it3, lots
 * `contrat`, `docs/REGLES-PLAY.md` § J2). Le tick (`dossier/horloge.ts`) écrit
 * `etape_plan.depuis` ; ce module est son LECTEUR (KR-249 : un champ de session n'entre que si un
 * chemin l'écrit et un autre le lit) — et, depuis l'it3, le lecteur du prédicat de blocage
 * (`dossier/blocage.ts`, KR-246).
 *
 * UNE SEULE FONCTION, `lignesPendantCeTemps`, PURE et TOTALE : ni modèle, ni dé, ni écriture,
 * ni levée — la session vient du disque (KR-116). Elle rend les LIGNES du bloc, jamais le bloc :
 * l'en-tête, l'ordre des blocs et l'absence de bloc vide sont à l'assembleur (`./narrateur.ts`).
 *
 * LA SÉLECTION, dans l'ordre de `monde.personnages[]` (le DOCUMENT — jamais l'ordre d'insertion
 * de `monde.pnj`, jamais l'ordre alphabétique). UNE ligne au plus par personnage, et la prose
 * qu'elle porte dépend de ce que le personnage a fait À CE PAS :
 *  1. PERCEPTIBLE — `id ∈ personnagesPresents(dossier, session)` (`dossier/commandes.ts`), LA
 *     MÊME fonction que `assemblerInterprete` (`./interprete.ts`) : ce module n'écrit aucun
 *     second filtre de présence. C'est le LIEU COURANT, rien d'autre — un personnage avancé ou
 *     bloqué ailleurs, même voisin, ne se raconte pas.
 *  2. ENSUITE, UN SEUL DES DEUX CAS, tranchés dans cet ordre — et le second n'est atteint que si
 *     le premier ne l'est pas :
 *     a. AVANCÉ À CE PAS — `session.monde.pnj[id].etape_plan.depuis === session.horloge.tour`
 *        (`faits.ts`) : la ligne est la prose de `plan_actions[rang].action` (it2, inchangé).
 *        `depuis` ABSENT n'est PAS « avancé » : une session de 0.7.21 porte `{ rang }` sans
 *        `depuis`, et le moteur n'invente jamais un pas d'origine. L'entrée est lue par
 *        `estCleDe`, jamais par une indexation nue (KR-175 : `monde.pnj` est indexé par un
 *        identifiant de dossier).
 *     b. SINON, BLOQUÉ À CE PAS — `etapeBloqueeAuPas(personnage, entree, tour)` rend un constat
 *        (it3) : la ligne est la prose de `si_bloque` de l'étape COURANTE que le constat porte.
 *        La DÉCISION n'est pas ici : le prédicat est le SEUL site de décision du blocage
 *        (KR-246 — le tick l'appelle pour écrire `etape_bloquee` au journal, ce module pour
 *        choisir la prose ; deux formules se désynchroniseraient en silence), et ce module ne lit
 *        NI la durée, NI `declencheur_*`, NI `etape_plan.rang` (dans cette branche). Le « sinon » est STRUCTUREL, pas
 *        un arbitrage : un avancement et un blocage s'EXCLUENT (au pas d'un avancement,
 *        `tour − depuis` vaut 0 et n'égale jamais une durée ≥ 1, `DUREE_MIN`), donc jamais les
 *        deux lignes pour un même personnage au même pas — et un avancement sans `action`
 *        rédigée se TAIT, il ne retombe jamais sur `si_bloque`.
 *  3. ÉTAPE RÉDIGÉE — la prose existe : `action` pour (a), `si_bloque` pour (b). Absente, vide ou
 *     portant `MARQUEUR_A_ECRIRE` : SILENCE, jamais un repli sur `Entite.nom`, sur l'autre prose
 *     de l'étape, ni sur une phrase construite par le code (le constat existe au journal même
 *     sans `si_bloque` : c'est l'AUTEUR qui le lit là, pas le narrateur). Un `rang` négatif, non
 *     entier ou au-delà du plan vise une étape qui n'existe pas : même silence.
 *
 * CE QUE LA LIGNE EST : la prose d'auteur de l'étape (`action` ou `si_bloque`), REPLIÉE sur une
 * ligne (une prose multiligne ne peut pas imiter un en-tête de bloc), et RIEN d'autre — ni
 * `rang`, ni `depuis`, ni identifiant, ni `nom`, ni amorce, ni le mot « bloqué » : le narrateur
 * ne sait donc ni QUEL personnage, ni QUELLE étape, ni QUE c'en est un blocage — il lit ce qui
 * s'est passé, pas pourquoi (aucun repère `A…` n'est posé, et un identifiant n'entre jamais dans
 * ce rôle). `si_bloque` est une DIDASCALIE, jamais un delta : elle ne change rien au monde.
 *
 * ⚠ LA DÉROGATION — c'est ICI qu'elle vit, et `./narrateur.ts` l'écrit en toutes lettres : ce
 * rôle n'injectait AUCUNE donnée de personnage (n° 12), et `plan_actions[]` en porte DEUX. Deux
 * chemins, et ils forment une LISTE FERMÉE : `CHEMIN_ACTION_DE_PLAN` (it2) et `CHEMIN_SI_BLOQUE`
 * (it3), tous deux d'audience `ia` (`dossier/destinations.ts` — la dérogation est à la DOCTRINE
 * du rôle, jamais à la table d'audience : `DEROGATIONS_AUDIENCE` reste vide). Ni l'un ni l'autre
 * n'entre dans `CHAMPS_INJECTES_NARRATEUR` (huit chemins, tous hors `monde.personnages[]`), ni
 * dans la liste fermée des onze chemins de `narrateur.ts`, dont le prédicat exclut
 * `monde.personnages[]` : une constante PROPRE par chemin et une garde DÉDIÉE
 * (`contexte.test.ts`), pour qu'un seul chemin de personnage ouvert ne devienne pas le précédent
 * d'un second — et celui-ci est le second. Aucun autre champ du plan (`declencheur_*`, `duree`,
 * `etape`) n'est lu ici.
 *
 * Les imports sont des VALEURS vers la couche dossier (`personnagesPresents`, `estCleDe`,
 * `etapeBloqueeAuPas`) et un `import type` vers `session.ts` : ce module ne lit AUCUNE valeur de
 * la couche session (`faits.ts` n'est pas importé non plus — `EtatPnj` se lit par
 * `session.monde.pnj`). Le module n'est PAS exporté par `brain/index.ts` ni par le baril de
 * `./index.ts` : seul `./narrateur.ts` l'appelle, et son test l'importe en profondeur
 * (`contexte.test.ts` le garde).
 */
import { etapeBloqueeAuPas } from '../../dossier/blocage'
import { personnagesPresents } from '../../dossier/commandes'
import { estCleDe } from '../../dossier/identifiers'
import type { EtatSession } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import { textesRediges } from './noyau'

/** LE PREMIER DES DEUX CHEMINS DE PERSONNAGE QUE LE NARRATEUR LIT — voir la dérogation en tête de
 *  fichier. Garde dédiée dans `contexte.test.ts` : audience `ia`, absent de
 *  `CHAMPS_INJECTES_NARRATEUR`. */
export const CHEMIN_ACTION_DE_PLAN = 'monde.personnages[].plan_actions[].action'

/** LE SECOND (n° 14, it3) — la didascalie d'une étape que le prédicat de blocage constate au pas
 *  courant. Même garde dédiée, même confinement : audience `ia`, absent de
 *  `CHAMPS_INJECTES_NARRATEUR` et de la liste fermée des onze. */
export const CHEMIN_SI_BLOQUE = 'monde.personnages[].plan_actions[].si_bloque'

/** Le préfixe d'une ÉTAPE de plan : `textesRediges` en retire le préfixe du chemin, et la prose
 *  se lit sur l'étape désignée (par son rang, ou par le constat), jamais sur toutes celles du plan
 *  à la fois. */
const PREFIXE_ETAPE = 'monde.personnages[].plan_actions[].'

/** Toute prose d'auteur réinjectée tient sur UNE ligne — elle ne peut pas imiter un en-tête de
 *  bloc. Même repli que `replier` de `./narrateur.ts` (qui importe CE module : l'y importer
 *  nouerait un cycle). */
function replier(texte: string): string {
	return texte.replace(/\s+/g, ' ').trim()
}

/**
 * LES LIGNES DE `PENDANT CE TEMPS` — une par personnage perceptible qui, À CE PAS, a avancé
 * d'étape (sa prose `action`) ou dont l'étape courante est bloquée (sa prose `si_bloque`), quand
 * cette prose est rédigée ; `[]` quand aucune (le bloc ne s'écrit alors pas).
 */
export function lignesPendantCeTemps(dossier: Dossier, session: EtatSession): readonly string[] {
	const presents = new Set(personnagesPresents(dossier, session))
	const tour = session.horloge.tour
	return dossier.monde.personnages.flatMap((personnage) => {
		if (!presents.has(personnage.id)) return []
		const entree = estCleDe(session.monde.pnj, personnage.id) ? session.monde.pnj[personnage.id] : undefined
		const etape = entree?.etape_plan
		if (etape?.depuis === tour) {
			// `rang` vient d'une session persistée, donc d'un fichier : un index négatif, non entier ou
			// hors du plan ne désigne AUCUNE étape (`undefined`), et `textesRediges` est total — le
			// silence tombe de lui-même, sans garde propre à ce site.
			const visee = personnage.plan_actions?.[etape.rang]
			return textesRediges(visee, CHEMIN_ACTION_DE_PLAN, PREFIXE_ETAPE).map(replier)
		}
		// AUCUN AVANCEMENT À CE PAS : le blocage, décidé par le prédicat et par lui seul (KR-246).
		const constat = etapeBloqueeAuPas(personnage, entree, tour)
		if (constat === undefined) return []
		return textesRediges(constat.courante, CHEMIN_SI_BLOQUE, PREFIXE_ETAPE).map(replier)
	})
}
