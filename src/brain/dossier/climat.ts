import { appliquerDelta, evenementDeClimat, type ActivationDeClimat, type DeltaJournalise } from './evaluate'
import type { FaitsDeSession } from './faits'
import type { EntreeJournal, EtatSession } from './session'
import type { Climat, Dossier } from './types'

/**
 * LE CLIMAT DE SESSION — un climat s'ALLUME quand l'événement qui le désigne devient vrai,
 * applique ses effets, puis s'ÉTEINT quand sa durée est écoulée (n° 14 `moteur-horloge`, it4,
 * `docs/REGLES-PLAY.md` § J3, écrit AVANT ce code).
 *
 * UNE SEULE FONCTION, `tickClimat`, PURE et TOTALE **sur un dossier accepté par
 * `validateDossier`** : elle rend la MÊME RÉFÉRENCE de session quand rien ne change, sans
 * appel de modèle, sans dé. Elle est la SEULE PORTE D'ÉCRITURE de `horloge.climat_actif`
 * (`session.ts`). `tickHorloge` (`horloge.ts`) l'appelle EN TÊTE, donc APRÈS la passe des jalons :
 * un jalon que l'effet d'un climat rend vrai n'est résolu qu'à la commande SUIVANTE — latence
 * d'un pas, documentée en § J3, jamais corrigée par une seconde passe.
 *
 * DEUX ÉTAPES, DANS CET ORDRE, et l'ordre est le contrat :
 *  1. L'EXTINCTION — si un climat est actif ET que (a) son `duree` est définie ET
 *     `tour − depuis >= duree`, OU (b) l'identifiant n'est plus un climat du dossier : la clé
 *     `climat_actif` est RETIRÉE (jamais posée à `undefined`, KR-251), et UNE ligne
 *     `climat_eteint : <id>` s'écrit, sans `deltas`. Elle ne lit que l'état d'ENTRÉE : un climat
 *     qui s'allume dans CE tick n'est jamais éteint dans ce tick ;
 *  2. L'ACTIVATION — si aucun climat n'est actif APRÈS l'étape 1 et que `evenementDeClimat`
 *     (`evaluate.ts`) rend une activation : l'événement est AJOUTÉ à `monde.evenements_consommes`,
 *     chaque `effets_regles` du climat est appliqué DANS L'ORDRE par `appliquerDelta`, puis
 *     `climat_actif = { id, depuis: tour }`, et UNE ligne `climat_actif : <id>` s'écrit, AVEC
 *     `deltas`. Un seul climat à la fois : tant qu'un climat est actif, l'événement suivant
 *     ATTEND, non consommé — y compris jusqu'au pas où le précédent s'éteint, qui l'allume.
 *
 * `>=` ET NON `===`, et c'est la différence nommée avec le blocage (J2 règle 1) : le blocage
 * CONSTATE — il n'écrit que le journal, donc avec `>=` il se répéterait à chaque pas ; l'extinction
 * EFFACE l'état, donc elle ne peut pas se répéter, et `>=` couvre une session forgée ou persistée
 * dont le pas a dépassé l'échéance, là où `===` laisserait un climat éternel. Deux mécanismes,
 * deux gardes. Un climat SANS `duree` est PERMANENT (état calme, `Climat.duree` est optionnel).
 *
 * UN `climat_id` QUI NE RÉSOUT PAS — impossible sur un dossier accepté, `validateDossier` le
 * refuse — s'active SANS effet (aucun climat à lire) et s'éteint au tick suivant par (b) : la
 * partie ne lève pas, et l'anomalie se LIT au journal, jamais en silence (KR-021).
 *
 * `Climat.duree` A ICI SON UNIQUE LECTEUR DE DÉCISION dans `src/brain/` et `src/player/`
 * (garde de `blocage.test.ts`, qui mesure les lecteurs du MOT `.duree`) : ni `tickHorloge`, ni
 * l'assembleur du narrateur, ni `src/player/` ne le lisent, et le validateur ne lit que
 * `plan_actions[].duree`. Les panneaux d'édition de `src/features/` le lisent pour le saisir.
 *
 * LES LIGNES DE JOURNAL : `role: 'moteur'`, au `tour` du pas COURANT (jamais `+1`, le tick
 * n'ajoute pas de pas, J1), SANS `origine`, `recit`, `jet` ni `interlocuteur` — l'activation et
 * l'extinction ne sont la demande de personne. Texte en relevé d'état, jamais de prose : ni
 * `nom` (audience `auteur`) ni `manifestation` (audience `ia`). `deltas` est ABSENT, jamais `[]`,
 * quand le climat n'a aucun effet de règle : « n'en a pas demandé » n'est pas « en a demandé
 * zéro » (KR-247).
 *
 * L'IA N'A AUCUNE PART DANS LE CYCLE DE VIE : elle ne demande jamais l'activation, ne l'éteint
 * pas, et aucune prose d'extinction n'est écrite ici. AUDIENCE (`sessionDestinations.ts`) :
 * `horloge.climat_actif.id` et `.depuis` sont `moteur`.
 *
 * `import type` SEULEMENT vers `session.ts` : `commandes.ts` appelle `tickHorloge`, qui appelle ce
 * module, et `session.ts` type-importe `commandes.ts` — une arête de VALEUR vers `session.ts` ou
 * `commandes.ts` nouerait un cycle. Le module n'est PAS exporté par `brain/index.ts` : la seule
 * porte vers une feature est `executerCommande`.
 *
 * AUCUNE MÉMOÏSATION (KR-013/113). MODULE PUR : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/** Le climat que `id` désigne dans le dossier, ou `undefined` — jamais une indexation nue. */
function climatDu(dossier: Dossier, id: string): Climat | undefined {
	return dossier.monde.conditions.climat.find((candidat) => candidat.id === id)
}

/**
 * ÉTEINDRE LE CLIMAT `id` — la session neuve, JAMAIS une mutation. La CLÉ est retirée, jamais
 * posée à `undefined` (KR-251) : `delete` sur une COPIE de l'horloge, précédent exact
 * `sansCombat` (`sessionCombat.ts`). `tour` n'est pas touché.
 */
function eteindre(session: EtatSession, id: string): EtatSession {
	const horloge = { ...session.horloge }
	delete horloge.climat_actif
	const ligne: EntreeJournal = { tour: session.horloge.tour, role: 'moteur', texte: `climat_eteint : ${id}` }
	return { ...session, horloge, journal: [...session.journal, ligne] }
}

/**
 * ALLUMER LE CLIMAT que désigne `activation` — la session neuve, JAMAIS une mutation. Dans cet
 * ordre : l'événement consommé, puis chaque effet appliqué sur les faits que la consommation vient
 * d'écrire, puis `climat_actif`. `evenementDeClimat` ne rend jamais un événement déjà consommé :
 * l'ajout n'a donc aucun doublon à éviter.
 */
function allumer(dossier: Dossier, session: EtatSession, activation: ActivationDeClimat): EtatSession {
	let faits: FaitsDeSession = {
		...session.monde,
		evenements_consommes: [...session.monde.evenements_consommes, activation.evenement_id],
	}
	const deltas: DeltaJournalise[] = []
	for (const delta of climatDu(dossier, activation.climat_id)?.effets_regles ?? []) {
		const applique = appliquerDelta(faits, delta)
		faits = applique.faits
		deltas.push(applique.journalise)
	}

	const tour = session.horloge.tour
	const ligne: EntreeJournal = {
		tour,
		role: 'moteur',
		texte: `climat_actif : ${activation.climat_id}`,
		...(deltas.length > 0 ? { deltas } : {}),
	}
	return {
		...session,
		monde: faits,
		horloge: { ...session.horloge, climat_actif: { id: activation.climat_id, depuis: tour } },
		journal: [...session.journal, ligne],
	}
}

/**
 * LE TICK DU CLIMAT — voir la docstring de tête. `session` est celle d'APRÈS la commande ET
 * d'après la passe des jalons ; la session rendue est la même référence si aucun climat ne
 * s'éteint ni ne s'allume à ce pas.
 */
export function tickClimat(dossier: Dossier, session: EtatSession): EtatSession {
	let courante = session

	// 1. L'EXTINCTION D'ABORD, sur l'état d'ENTRÉE : la durée est lue du climat du dossier — jamais
	//    d'un champ de la session —, et un climat introuvable s'éteint comme un climat échu.
	const actif = session.horloge.climat_actif
	if (actif !== undefined) {
		const climat = climatDu(dossier, actif.id)
		const duree = climat?.duree
		if (climat === undefined || (duree !== undefined && session.horloge.tour - actif.depuis >= duree)) {
			courante = eteindre(courante, actif.id)
		}
	}

	// 2. PUIS L'ACTIVATION, seulement si la place est libre après l'étape 1 — un seul climat à la fois.
	if (courante.horloge.climat_actif === undefined) {
		const activation = evenementDeClimat(dossier, courante)
		if (activation !== undefined) courante = allumer(dossier, courante, activation)
	}

	return courante
}
