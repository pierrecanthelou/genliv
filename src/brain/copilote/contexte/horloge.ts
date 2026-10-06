/**
 * LE BLOC `PENDANT CE TEMPS` DU NARRATEUR — ce que les personnages PRÉSENTS ont fait pendant
 * le pas que R3 raconte (n° 14 `moteur-horloge`, it2, lot `contrat`, `docs/REGLES-PLAY.md`
 * § J2). Le tick (`dossier/horloge.ts`) écrit `etape_plan.depuis` ; ce module est son LECTEUR
 * (KR-249 : un champ de session n'entre que si un chemin l'écrit et un autre le lit).
 *
 * UNE SEULE FONCTION, `lignesPendantCeTemps`, PURE et TOTALE : ni modèle, ni dé, ni écriture,
 * ni levée — la session vient du disque (KR-116). Elle rend les LIGNES du bloc, jamais le bloc :
 * l'en-tête, l'ordre des blocs et l'absence de bloc vide sont à l'assembleur (`./narrateur.ts`).
 *
 * LA SÉLECTION, TROIS CONDITIONS CUMULATIVES, dans l'ordre de `monde.personnages[]` (le
 * DOCUMENT — jamais l'ordre d'insertion de `monde.pnj`, jamais l'ordre alphabétique) :
 *  1. PERCEPTIBLE — `id ∈ personnagesPresents(dossier, session)` (`dossier/commandes.ts`), LA
 *     MÊME fonction que `assemblerInterprete` (`./interprete.ts`) : ce module n'écrit aucun
 *     second filtre de présence. C'est le LIEU COURANT, rien d'autre — un personnage avancé
 *     ailleurs, même voisin, ne se raconte pas.
 *  2. AVANCÉ À CE PAS — `session.monde.pnj[id].etape_plan.depuis === session.horloge.tour`
 *     (`faits.ts`). `depuis` ABSENT n'est PAS « avancé » : une session de 0.7.21 porte `{ rang }`
 *     sans `depuis`, et le moteur n'invente jamais un pas d'origine. L'entrée est lue par
 *     `estCleDe`, jamais par une indexation nue (KR-175 : `monde.pnj` est indexé par un
 *     identifiant de dossier).
 *  3. ÉTAPE RÉDIGÉE — `plan_actions[rang].action`, `rang` étant un INDEX (KR-198, jamais le champ
 *     `etape`). Absente, vide ou portant `MARQUEUR_A_ECRIRE` : SILENCE, jamais un repli sur
 *     `Entite.nom` ni sur une phrase construite par le code. Un `rang` négatif, non entier ou
 *     au-delà du plan vise une étape qui n'existe pas : même silence.
 *
 * CE QUE LA LIGNE EST : la prose d'auteur de `plan_actions[rang].action`, REPLIÉE sur une
 * ligne (une prose multiligne ne peut pas imiter un en-tête de bloc), et RIEN d'autre — ni
 * `rang`, ni `depuis`, ni identifiant, ni `nom`, ni amorce. Le narrateur ne sait donc ni QUEL
 * personnage ni QUELLE étape : il lit ce qui s'est passé, pas qui l'a décidé (aucun repère
 * `A…` n'est posé, et un identifiant n'entre jamais dans ce rôle).
 *
 * ⚠ LA DÉROGATION — c'est ICI qu'elle vit, et `./narrateur.ts` l'écrit en toutes lettres : ce
 * rôle n'injectait AUCUNE donnée de personnage (n° 12), et `plan_actions[].action` en est une.
 * Le chemin est `CHEMIN_ACTION_DE_PLAN`, d'audience `ia` (`dossier/destinations.ts` — la
 * dérogation est à la DOCTRINE du rôle, jamais à la table d'audience : `DEROGATIONS_AUDIENCE`
 * reste vide). Il n'entre NI dans `CHAMPS_INJECTES_NARRATEUR` (huit chemins, tous hors
 * `monde.personnages[]`), NI dans la liste fermée des onze chemins de `narrateur.ts`, dont le
 * prédicat exclut `monde.personnages[]` : une constante PROPRE et une garde DÉDIÉE
 * (`contexte.test.ts`), pour qu'un seul chemin de personnage ouvert ne devienne pas le
 * précédent d'un second. Aucun autre champ du plan (`declencheur_*`, `duree`, `si_bloque`,
 * `etape`) n'est lu : `si_bloque` arrive à l'itération 3, avec son propre lecteur.
 *
 * `import type` SEULEMENT vers `session.ts` : ce module ne lit AUCUNE valeur de la couche session
 * (`faits.ts` n'est pas importé non plus — `EtatPnj` se lit par `session.monde.pnj`), et une
 * arête de VALEUR vers elle n'aurait aucune raison d'être. Le module n'est PAS exporté par
 * `brain/index.ts` ni par le baril de `./index.ts` : seul `./narrateur.ts` l'appelle, et son
 * test l'importe en profondeur (`contexte.test.ts` le garde).
 */
import { personnagesPresents } from '../../dossier/commandes'
import { estCleDe } from '../../dossier/identifiers'
import type { EtatSession } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import { textesRediges } from './noyau'

/** LE SEUL CHEMIN DE PERSONNAGE QUE LE NARRATEUR LIT — voir la dérogation en tête de fichier.
 *  Garde dédiée dans `contexte.test.ts` : audience `ia`, absent de `CHAMPS_INJECTES_NARRATEUR`. */
export const CHEMIN_ACTION_DE_PLAN = 'monde.personnages[].plan_actions[].action'

/** Le préfixe d'une ÉTAPE de plan : `textesRediges` en retire le préfixe du chemin, et `action`
 *  se lit sur l'étape désignée par son rang, jamais sur toutes celles du plan à la fois. */
const PREFIXE_ETAPE = 'monde.personnages[].plan_actions[].'

/** Toute prose d'auteur réinjectée tient sur UNE ligne — elle ne peut pas imiter un en-tête de
 *  bloc. Même repli que `replier` de `./narrateur.ts` (qui importe CE module : l'y importer
 *  nouerait un cycle). */
function replier(texte: string): string {
	return texte.replace(/\s+/g, ' ').trim()
}

/**
 * LES LIGNES DE `PENDANT CE TEMPS` — une par personnage perceptible, avancé à ce pas, dont
 * l'étape est rédigée ; `[]` quand aucune (le bloc ne s'écrit alors pas).
 */
export function lignesPendantCeTemps(dossier: Dossier, session: EtatSession): readonly string[] {
	const presents = new Set(personnagesPresents(dossier, session))
	return dossier.monde.personnages.flatMap((personnage) => {
		if (!presents.has(personnage.id)) return []
		const etape = estCleDe(session.monde.pnj, personnage.id) ? session.monde.pnj[personnage.id].etape_plan : undefined
		if (etape?.depuis !== session.horloge.tour) return []
		// `rang` vient d'une session persistée, donc d'un fichier : un index négatif, non entier ou
		// hors du plan ne désigne AUCUNE étape (`undefined`), et `textesRediges` est total — le
		// silence tombe de lui-même, sans garde propre à ce site.
		const visee = personnage.plan_actions?.[etape.rang]
		return textesRediges(visee, CHEMIN_ACTION_DE_PLAN, PREFIXE_ETAPE).map(replier)
	})
}
