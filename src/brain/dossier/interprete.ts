/**
 * LA RÉ-RÉSOLUTION ET LA TRANSITION DU RÔLE `interprete` — n° 10
 * (`moteur-interprete`), lot `contrat`.
 *
 * DEUX FONCTIONS PURES, DEUX RESPONSABILITÉS DISJOINTES :
 *  · `resoudreInterpretation` traduit un `InterpretationRendue` DÉJÀ VALIDÉ
 *    (par `validerInterprete`, `copilote/schemaSortie.ts`) en `SortieInterprete`
 *    — de purs `Map.get`, AUCUNE conversion numérique, AUCUNE revérification
 *    d'arité (KR-013 : `validerInterprete` est le SEUL décideur de ce chemin,
 *    la revérifier ici créerait un second décideur qui pourrait diverger) ;
 *  · `apresInterpretation` décide ce que la partie devient après une réponse
 *    du copilote — SEULE décideuse de l'anti-boucle (KR-264) et de la clôture
 *    d'`attente` (`EtatSession.attente`, `session.ts`). Elle appelle
 *    `executerCommande` (`./commandes`) sur `lecture:'commande'` — MÊME
 *    entonnoir que la console, jamais réimplémenté.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour
 * de l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6), même doctrine que
 * `session.ts` et `commandes.ts`.
 *
 * ⚠ CE FICHIER N'ÉCRIT JAMAIS LE NOM DU SERVICE QUI PARLE AU MODÈLE
 * (`brain/`, à sa racine) — MÊME EN COMMENTAIRE, PAS MÊME DANS UN IMPORT DE
 * TYPE : `moteurSansIA.test.ts` (feature `play-mode`, lot 2) balaie
 * `brain/dossier/` par une regex sur le texte SOURCE, aveugle à la sémantique
 * de l'import — écrire ce nom ici ferait rougir un garde qui ne devrait
 * jamais avoir d'avis sur ce fichier.
 */
import { MARQUEUR_A_ECRIRE } from './amorce'
import { executerCommande } from './commandes'
import type { EtatSession } from './session'
import type { Dossier } from './types'
import type { AvisInterprete, InterpretationRendue, SortieInterprete, TablesInterprete } from '../copilote/types'

/**
 * REFUS DE RÉ-RÉSOLUTION — THÉORIQUEMENT INATTEIGNABLE, et c'est écrit plutôt
 * que tu. `validerInterprete` a déjà constaté l'appartenance de `geste` à
 * `tables.gestes` et de chaque élément de `designe` à `tables.lieux`, sur LA
 * MÊME PAIRE DE TABLES que celle reçue ici (KR-013 : un seul calcul, deux
 * consultations). `Map.get` reste PARTIEL pour le compilateur (KR-175) :
 * l'alternative serait un `!` ou un `as`, exactement l'endroit où il cesse de
 * protéger. AUCUNE CHARGE : ce n'est pas un état que l'écran doit un jour
 * distinguer, seulement un `throw` évité.
 */
export interface RefusInterprete {
	readonly type: 'refus_resolution'
}

/**
 * LA RÉ-RÉSOLUTION — PURE, totale sur un `InterpretationRendue` VALIDE (déjà
 * passé par `validerInterprete`). Discriminée par PRÉSENCE DE CLÉ : les trois
 * membres d'`InterpretationRendue` ont des ensembles de clés disjoints, donc
 * `'sans_commande' in rendu` / `'precision' in rendu` narrows `tsc` sans `as`.
 */
export function resoudreInterpretation(
	tables: TablesInterprete,
	rendu: InterpretationRendue,
): SortieInterprete | RefusInterprete {
	if ('sans_commande' in rendu) {
		// LES SEULS gestes ANNONCÉS sont ceux que `tables.gestes` portait à CET
		// appel — jamais le registre complet (précédent `GABARIT_NON_RECONNU`,
		// `play-mode`, it2) : un geste sans cible atteignable n'est jamais dit
		// possible.
		return { lecture: 'sans_commande', gestes_possibles: [...tables.gestes.values()] }
	}

	if ('precision' in rendu) {
		return { lecture: 'clarification', question: rendu.precision }
	}

	// `rendu` est ici `{geste, designe}` — DERNIER MEMBRE DE L'UNION, jamais
	// revérifié en arité (voir docstring de tête).
	const commandeId = tables.gestes.get(rendu.geste)
	if (commandeId === undefined) return { type: 'refus_resolution' }

	const cibles: string[] = []
	for (const rang of rendu.designe) {
		const identifiant = tables.lieux.get(rang)
		if (identifiant === undefined) return { type: 'refus_resolution' }
		cibles.push(identifiant)
	}

	return { lecture: 'commande', commande: { commande: commandeId, cibles } }
}

/** VRAI quand `canon.ton` est écrit — même filtre que `estRedige`
 *  (`copilote/contexte/noyau.ts`), réécrit ici plutôt qu'importé : ce module vit
 *  dans `brain/dossier/`, `noyau.ts` dans `brain/copilote/contexte/`, et les deux
 *  ne partagent aujourd'hui qu'UN SEUL prédicat — l'importer coûterait une
 *  dépendance transverse pour trois lignes (KR-109 à l'envers : abstraction
 *  prématurée pour un seul appelant de chaque côté). */
function tonEcrit(dossier: Dossier): boolean {
	const ton = dossier.canon.ton
	return ton.trim() !== '' && !ton.includes(MARQUEUR_A_ECRIRE)
}

/** LA SESSION SANS `attente` — MÊME RÉFÉRENCE si elle n'en portait déjà
 *  aucune, sans quoi chaque tour normal (aucune attente à retirer) allouerait
 *  un objet pour rien. `delete` sur une COPIE, jamais sur `session` : la
 *  session d'entrée reste intacte (précédent `executerCommande`, dont un
 *  refus rend l'argument lui-même). `delete` compile ici PARCE QUE `attente`
 *  est optionnelle (KR-251) — ts(2790) le refuserait sur un champ requis. */
function retirerAttente(session: EtatSession): EtatSession {
	if (session.attente === undefined) return session
	const reste = { ...session }
	delete reste.attente
	return reste
}

/**
 * LA TRANSITION — PURE, appelée par la feature (`useTourDeJeu`, n° 10 lot 2)
 * quand le copilote a rendu une PROPOSITION (`reponse.statut === 'propose'`).
 *
 * DEUX ÉCARTS ASSUMÉS au canevas initial de l'itération, TOUS DEUX ÉCRITS DANS
 * LE COMPTE RENDU DE LOT (« Décisions prises en autonomie ») :
 *  1. `saisie` EST UN QUATRIÈME PARAMÈTRE : `AttenteClarification.saisie`
 *     (session.ts) ne peut être posée sans connaître la saisie qui a
 *     déclenché la question, et rien d'autre dans cette signature ne la
 *     porte.
 *  2. LE TROISIÈME PARAMÈTRE EST `proposition: SortieInterprete`, PAS
 *     `reponse: ReponseInterprete` (qui inclut `EchecCopilote`) : ce
 *     fichier vit dans `brain/dossier/`, périmètre gardé PAR NOM DE MOT par
 *     `moteurSansIA.test.ts` (KR-260, voir l'avertissement de tête) — les deux
 *     types cités à l'instant vivent dans le module dont ce fichier ne doit
 *     jamais écrire le nom, y compris en commentaire, y compris dans un
 *     import de type : le garde est une regex sur le texte source, pas sur
 *     la sémantique de l'import. La carte (`useTourDeJeu`, lot 2,
 *     EXPLICITEMENT exemptée par nom de fichier) lit `reponse.statut`
 *     elle-même et n'appelle cette fonction QUE sur `statut === 'propose'` —
 *     exactement la ligne de Table C (plan d'itération) où `EchecCopilote`
 *     s'affiche par son propre statut, JAMAIS via `AvisInterprete`.
 *
 * ORDRE DES DÉCISIONS, ET IL COMPTE (Table C amendée, plan d'itération) :
 *  1. `lecture === 'clarification'` — POSE une attente SEULEMENT si aucune
 *     n'était déjà pendante ET que `canon.ton` est écrit ; sinon DÉGRADE en
 *     `reformuler` (KR-264 anti-boucle, § 8 désaccord 22 du plan — dégradation
 *     silencieuse retenue si le ton manque).
 *  2. Tout le reste CLÔTURE l'attente pendante, s'il y en avait une :
 *     `executerCommande` (`./commandes`) ignore ce champ, c'est donc ICI qu'il
 *     est retiré, et nulle part ailleurs.
 *  3. `lecture === 'sans_commande'` — avis dérivé, session inchangée (hormis
 *     l'attente retirée).
 *  4. `lecture === 'commande'` — MÊME ENTONNOIR que la console
 *     (`executerCommande`). Un refus d'exécution est inatteignable par
 *     construction (`validerInterprete` a déjà garanti la cible), gardé par
 *     défense (KR-175) : session inchangée, `avis:{type:'refus_moteur'}`.
 */
export function apresInterpretation(
	dossier: Dossier,
	session: EtatSession,
	proposition: SortieInterprete,
	saisie: string,
): { session: EtatSession; avis: AvisInterprete } {
	const sortie = proposition

	if (sortie.lecture === 'clarification') {
		const attentePendante = session.attente !== undefined
		if (!attentePendante && tonEcrit(dossier)) {
			return {
				session: { ...session, attente: { type: 'clarification', question: sortie.question, saisie } },
				avis: { type: 'clarification', question: sortie.question },
			}
		}
		// Attente déjà pendante (KR-264) OU `canon.ton` non écrit : même
		// dégradation, même texte fixe côté écran.
		return { session: retirerAttente(session), avis: { type: 'reformuler' } }
	}

	const sansAttente = retirerAttente(session)

	if (sortie.lecture === 'sans_commande') {
		return { session: sansAttente, avis: { type: 'non_reconnu', gestes_possibles: sortie.gestes_possibles } }
	}

	// `sortie.lecture === 'commande'` — dernier membre de l'union.
	const resultat = executerCommande(dossier, sansAttente, sortie.commande)
	if (!resultat.ok) return { session: sansAttente, avis: { type: 'refus_moteur' } }
	return { session: resultat.session, avis: { type: 'aucun' } }
}
