/**
 * L'HORLOGE DES PNJ — après chaque commande ACCEPTÉE, les personnages qui ont un
 * `plan_actions[]` avancent d'UNE étape quand la condition de l'étape suivante est
 * vraie (n° 14 `moteur-horloge`, it1, `docs/REGLES-PLAY.md` § J2, écrit AVANT ce code).
 *
 * UNE SEULE FONCTION, `tickHorloge`, PURE et TOTALE : elle rend la MÊME RÉFÉRENCE de
 * session quand rien ne change, sans lever, sans appel de modèle, sans dé. Elle est la
 * SEULE PORTE D'ÉCRITURE de `EtatPnj.etape_plan` (`faits.ts`).
 *
 * CE QU'ELLE ÉCRIT, ET RIEN D'AUTRE : `monde.pnj[id].etape_plan` — `{ rang: n }`, en
 * conservant le reste de l'entrée du personnage (`a_dit`, `confiance`), ou
 * `{ a_dit: [] }` quand le personnage n'en avait aucune — et UNE ligne de journal par
 * avancement. Aucune horloge, aucun fait du monde, aucun effet : aucun prédicat ne lit
 * `etape_plan`, donc un avancement ne peut rendre vrai aucun jalon ni aucune condition.
 *
 * CE QU'ELLE LIT : `plan_actions[]`, et c'est tout — la condition de l'étape visée par
 * l'appel de `etapeDeclenchee` (`evaluate.ts`), jamais en lisant l'arbre elle-même
 * (garde de `evaluate.test.ts`, KR-246 : une condition n'a qu'un site de décision).
 * Ni `duree`, ni `si_bloque`, ni `action`, ni `depuis` : l'itération 1 est le
 * déclencheur SEUL, et la durée, le blocage et la minuterie arrivent en bloc à
 * l'itération 2, avec leur lecteur.
 *
 * LE RANG EST UN INDEX, JAMAIS LE CHAMP `etape` (KR-198) ; ABSENT ≡ RANG 0 (KR-013) :
 * `n = (rang ?? 0) + 1` est l'étape visée, et le déclencheur de l'étape 0 n'est donc
 * jamais lu. Un rang NÉGATIF ou NON ENTIER ne s'écrit jamais — il ne peut venir que
 * d'une session forgée ou corrompue — et il est un NO-OP, comme un rang au-delà du plan :
 * `plan_actions[n] === undefined` seul ne le couvrirait pas (le rang `-1` vise
 * l'étape 0, qui existe), d'où la garde explicite.
 *
 * UN CRAN AU PLUS PAR PERSONNAGE ET PAR APPEL, dans l'ordre de `monde.personnages[]`
 * (le document, jamais l'ordre d'insertion dans `monde.pnj`). Les faits que chaque
 * personnage consulte sont ceux de la session COURANTE du tick — après les jalons,
 * et après les avancements des personnages précédents du même appel.
 *
 * LA LIGNE DE JOURNAL : `role: 'moteur'`, au `tour` du pas COURANT (jamais `+1` : le
 * tick n'ajoute pas de pas, J1). Texte en BASE 1, relevé d'état et jamais de prose :
 * `etape_plan : <id> <n+1>` au premier écrit de l'entrée (sans flèche, précédent
 * `lieu_courant`), `etape_plan : <id> <ancien+1> → <n+1>` ensuite. SANS `origine`
 * (registre clos des commandes : un avancement n'est la demande de personne, et un
 * `recit` exige une `origine`), sans `deltas`, `recit`, `jet` ni `interlocuteur` — donc
 * jamais « porteuse » pour les écrivains de `recit`/`jet` ni pour les lignes de pas du
 * narrateur, qui sélectionnent l'entrée du pas par la présence d'`origine`.
 *
 * AUDIENCE (`sessionDestinations.ts`) : `monde.pnj.<id>.etape_plan.rang` est `moteur`.
 * Aucun contexte de modèle ne reçoit ni le rang ni cette ligne : ce module n'en émet
 * aucun, et n'appelle aucun modèle (`moteurSansIA.test.ts` en balaie la source).
 *
 * `import type` SEULEMENT vers `session.ts` : `commandes.ts` appelle ce module, et
 * `session.ts` type-importe `commandes.ts` — une arête de VALEUR vers `session.ts` ou
 * `commandes.ts` nouerait un cycle. Le module n'est PAS exporté par `brain/index.ts` :
 * la seule porte vers une feature est `executerCommande`.
 *
 * AUCUNE MÉMOÏSATION (KR-013/113). MODULE PUR : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import { etapeDeclenchee } from './evaluate'
import type { EtatPnj } from './faits'
import { estCleDe } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

/**
 * FAIRE AVANCER UN PERSONNAGE AU RANG `rang` — la session neuve, JAMAIS une mutation.
 * `existant` est l'entrée du personnage AVANT l'appel, `undefined` s'il n'en avait pas.
 */
function avancer(session: EtatSession, id: string, existant: EtatPnj | undefined, rang: number): EtatSession {
	const ancienne = existant?.etape_plan
	// PREMIER ÉCRIT (clé absente) : sans flèche. Ensuite : « ancien → nouveau », base 1.
	const texte =
		ancienne === undefined ? `etape_plan : ${id} ${rang + 1}` : `etape_plan : ${id} ${ancienne.rang + 1} → ${rang + 1}`

	return {
		...session,
		monde: {
			...session.monde,
			pnj: { ...session.monde.pnj, [id]: { ...(existant ?? { a_dit: [] }), etape_plan: { rang } } },
		},
		journal: [...session.journal, { tour: session.horloge.tour, role: 'moteur', texte }],
	}
}

/**
 * LE TICK — voir la docstring de tête. `session` est celle d'APRÈS la commande ET
 * d'après la passe des jalons ; la session rendue est la même référence si aucun
 * personnage n'avance.
 */
export function tickHorloge(dossier: Dossier, session: EtatSession): EtatSession {
	let courante = session

	for (const personnage of dossier.monde.personnages) {
		// `estCleDe`, jamais une indexation nue : `monde.pnj` est indexé par un identifiant
		// de dossier, valeur non fiable au sens de KR-175.
		const existant = estCleDe(courante.monde.pnj, personnage.id) ? courante.monde.pnj[personnage.id] : undefined
		const rang = existant?.etape_plan?.rang ?? 0
		// RANG HORS BORNES : négatif ou non entier — no-op (§ J2, ligne 8). Le rang au-delà
		// du plan est couvert, lui, par l'absence de l'étape visée juste en dessous.
		if (!Number.isInteger(rang) || rang < 0) continue

		const visee = rang + 1
		const etape = personnage.plan_actions?.[visee]
		if (etape === undefined) continue
		if (!etapeDeclenchee(courante.monde, etape)) continue

		courante = avancer(courante, personnage.id, existant, visee)
	}

	return courante
}
