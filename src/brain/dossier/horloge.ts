/**
 * L'HORLOGE DES PNJ — après chaque commande ACCEPTÉE, les personnages qui ont un
 * `plan_actions[]` avancent d'UNE étape quand la condition de l'étape suivante est
 * vraie (n° 14 `moteur-horloge`, it1, `docs/REGLES-PLAY.md` § J2, écrit AVANT ce code) ;
 * et, quand ils n'avancent pas, le tick CONSTATE au journal que la durée de leur étape
 * courante tombe à ce pas (it3).
 *
 * UNE SEULE FONCTION, `tickHorloge`, PURE et TOTALE : elle rend la MÊME RÉFÉRENCE de
 * session quand rien ne change, sans lever, sans appel de modèle, sans dé. Elle est la
 * SEULE PORTE D'ÉCRITURE de `EtatPnj.etape_plan` (`faits.ts`).
 *
 * CE QU'ELLE ÉCRIT, ET RIEN D'AUTRE : `monde.pnj[id].etape_plan` — `{ rang: n, depuis:
 * <pas> }` (it2 ; `{ rang: n }` seul à l'it1), en conservant le reste de l'entrée du
 * personnage (`a_dit`, `confiance`), ou `{ a_dit: [] }` quand le personnage n'en avait
 * aucune — et UNE ligne de journal par avancement, ou UNE ligne de journal par blocage
 * constaté (it3, voir plus bas) — JAMAIS LES DEUX pour un même personnage et un même pas.
 * Pour les PERSONNAGES, aucune horloge, aucun fait du monde, aucun effet : aucun prédicat ne
 * lit `etape_plan`, donc un avancement ne peut rendre vrai aucun jalon ni aucune condition.
 *
 * LE CLIMAT EST L'AUTRE MOITIÉ DU TICK, ET ELLE N'EST PAS ÉCRITE ICI (it4, `docs/REGLES-PLAY.md`
 * § J3) : `tickHorloge` COMMENCE par `tickClimat` (`climat.ts`), qui seul allume et éteint un
 * climat — il écrit `horloge.climat_actif`, `monde.evenements_consommes`, les effets de règle
 * du climat et sa ligne de journal. Ce module ne lit NI `climat_actif`, NI `Climat.duree`, NI
 * aucun événement : il passe la session que `tickClimat` rend aux personnages, qui consultent
 * donc les faits d'APRÈS le climat (et après les jalons). La session rendue est la même
 * référence que celle reçue quand ni le climat ni aucun personnage ne change.
 *
 * LE CONSTAT DE BLOCAGE (it3) : si l'étape visée n'existe pas ou n'a pas sa condition vraie,
 * le tick demande à `etapeBloqueeAuPas` (`blocage.ts`) si l'étape COURANTE est bloquée à ce
 * pas, et écrit sa ligne si oui. La DÉCISION n'est pas ici — ce module ne lit NI `duree`, NI
 * `depuis`, NI `si_bloque` : le prédicat est le seul site de décision (KR-246), et la garde
 * source de `horloge.test.ts` le tient. L'AVANCEMENT EMPORTE LE BLOCAGE par le flot de contrôle
 * (l'avancement fait `continue`, le constat n'est atteint qu'APRÈS) : on ne constate pas le
 * blocage d'une étape que l'on quitte à ce pas. Le constat n'écrit QUE le journal : `monde`
 * garde la même référence, `etape_plan` aussi — une durée échue ne fait jamais avancer.
 *
 * `depuis` (it2) EST `session.horloge.tour`, le pas COURANT — jamais `+1` : le tick
 * n'ajoute pas de pas (J1). Il s'écrit AVEC `rang`, dans le même objet, À CHAQUE
 * avancement et JAMAIS AUTREMENT : un personnage qui n'avance pas garde son entrée
 * `etape_plan` telle quelle, avec ou sans `depuis` (une session de 0.7.21 porte `{ rang }`
 * sans `depuis`, et n'en reçoit un qu'à son prochain avancement — jamais un `depuis`
 * inventé). C'est ce qui fait de `depuis === horloge.tour` la définition de « a avancé à
 * ce pas », que lit la sélection du bloc `PENDANT CE TEMPS` de l'assembleur R3.
 *
 * CE QU'ELLE LIT : `plan_actions[]`, et c'est tout — la condition de l'étape visée par
 * l'appel de `etapeDeclenchee` (`evaluate.ts`), jamais en lisant l'arbre elle-même
 * (garde de `evaluate.test.ts`, KR-246 : une condition n'a qu'un site de décision), et le
 * constat de blocage par l'appel de `etapeBloqueeAuPas` (`blocage.ts`), même doctrine.
 * Ni `duree`, ni `si_bloque`, ni `action`, ni `depuis` : le tick est le déclencheur SEUL
 * — la minuterie est ABOLIE (une durée échue constate un blocage, elle ne fait jamais
 * avancer, § J2). `depuis` est ÉCRIT ici et JAMAIS LU : le lire pour décider d'un
 * avancement rétablirait la minuterie ; le seul prédicat qui le lise pour décider est
 * celui du blocage, qui n'en tire qu'un constat.
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
 * `lieu_courant`), `etape_plan : <id> <ancien+1> → <n+1>` ensuite ; `etape_bloquee : <id>
 * <k+1>` pour un blocage constaté (it3 — même registre, snake_case minuscule, base 1, écrite
 * MÊME quand l'auteur n'a rédigé aucun `si_bloque`). SANS `origine` (registre clos des
 * commandes : un avancement ou un blocage n'est la demande de personne, et un `recit`
 * exige une `origine`), sans `deltas`, `recit`, `jet` ni `interlocuteur` — donc jamais
 * « porteuse » pour les écrivains de `recit`/`jet` ni pour les lignes de pas du narrateur,
 * qui sélectionnent l'entrée du pas par la présence d'`origine`.
 *
 * AUDIENCE (`sessionDestinations.ts`) : `monde.pnj.<id>.etape_plan.rang` ET
 * `monde.pnj.<id>.etape_plan.depuis` sont `moteur`. Aucun contexte de modèle ne reçoit ni
 * le rang, ni le pas, ni cette ligne : ce module n'en émet aucun, et n'appelle aucun
 * modèle (`moteurSansIA.test.ts` en balaie la source).
 *
 * `import type` SEULEMENT vers `session.ts` : `commandes.ts` appelle ce module, et
 * `session.ts` type-importe `commandes.ts` — une arête de VALEUR vers `session.ts` ou
 * `commandes.ts` nouerait un cycle. Le module n'est PAS exporté par `brain/index.ts` :
 * la seule porte vers une feature est `executerCommande`.
 *
 * AUCUNE MÉMOÏSATION (KR-013/113). MODULE PUR : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */
import { etapeBloqueeAuPas } from './blocage'
import { tickClimat } from './climat'
import { etapeDeclenchee } from './evaluate'
import type { EtatPnj } from './faits'
import { estCleDe } from './identifiers'
import type { EtatSession } from './session'
import type { Dossier } from './types'

/**
 * FAIRE AVANCER UN PERSONNAGE AU RANG `rang` — la session neuve, JAMAIS une mutation.
 * `existant` est l'entrée du personnage AVANT l'appel, `undefined` s'il n'en avait pas.
 * `depuis` est le pas COURANT de `session` (`horloge.tour`) : l'avancement et son pas
 * s'écrivent ENSEMBLE, dans le même objet, ou pas du tout.
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
			pnj: {
				...session.monde.pnj,
				[id]: { ...(existant ?? { a_dit: [] }), etape_plan: { rang, depuis: session.horloge.tour } },
			},
		},
		journal: [...session.journal, { tour: session.horloge.tour, role: 'moteur', texte }],
	}
}

/**
 * CONSTATER LE BLOCAGE de l'étape `rang` (base 0) du personnage `id` — la session neuve, JAMAIS une
 * mutation, et QUE le journal : `monde` garde sa référence, donc `etape_plan` aussi. Une durée
 * échue constate, elle ne fait jamais avancer (§ J2, règle 1).
 */
function constater(session: EtatSession, id: string, rang: number): EtatSession {
	return {
		...session,
		journal: [
			...session.journal,
			{ tour: session.horloge.tour, role: 'moteur', texte: `etape_bloquee : ${id} ${rang + 1}` },
		],
	}
}

/**
 * LE TICK — voir la docstring de tête. `session` est celle d'APRÈS la commande ET
 * d'après la passe des jalons ; la session rendue est la même référence si aucun
 * climat ne s'allume ni ne s'éteint, qu'aucun personnage n'avance et qu'aucune étape
 * n'est bloquée à ce pas.
 */
export function tickHorloge(dossier: Dossier, session: EtatSession): EtatSession {
	// LE CLIMAT D'ABORD (it4, § J3) : un climat s'allume et s'éteint avant les personnages, qui
	// lisent les faits d'après lui. `session` ne sert plus qu'à cet appel.
	let courante = tickClimat(dossier, session)

	for (const personnage of dossier.monde.personnages) {
		// `estCleDe`, jamais une indexation nue : `monde.pnj` est indexé par un identifiant
		// de dossier, valeur non fiable au sens de KR-175.
		const existant = estCleDe(courante.monde.pnj, personnage.id) ? courante.monde.pnj[personnage.id] : undefined
		const rang = existant?.etape_plan?.rang ?? 0
		// RANG HORS BORNES : négatif ou non entier — no-op TOTAL, aucun avancement et aucun constat
		// (§ J2, ligne 8). Le rang au-delà du plan est couvert, lui, par l'absence de l'étape visée
		// ET de l'étape courante dans les deux appels plus bas.
		if (!Number.isInteger(rang) || rang < 0) continue

		const visee = rang + 1
		const etape = personnage.plan_actions?.[visee]
		// 1. L'AVANCEMENT D'ABORD, et `continue` : l'avancement et le constat s'excluent par le flot
		//    de contrôle — on ne constate pas le blocage d'une étape que l'on quitte à ce pas.
		if (etape !== undefined && etapeDeclenchee(courante.monde, etape)) {
			courante = avancer(courante, personnage.id, existant, visee)
			continue
		}

		// 2. SINON, LE CONSTAT : la décision est celle du prédicat, jamais d'ici. `existant` est
		//    l'entrée d'AVANT le tick — aucun avancement n'a eu lieu pour ce personnage à ce pas.
		const constat = etapeBloqueeAuPas(personnage, existant, courante.horloge.tour)
		if (constat !== undefined) courante = constater(courante, personnage.id, constat.rang)
	}

	return courante
}
