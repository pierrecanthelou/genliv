/**
 * LE RÉCIT D'UN PAS — la transition PURE qui l'écrit sur la session (n° 10
 * `moteur-interprete`, it2, lot `contrat`).
 *
 * UNE SEULE RESPONSABILITÉ : poser la prose déjà VALIDÉE du narrateur sur l'entrée
 * de journal qui porte la commande du pas, ou ne rien faire. Elle ne valide rien — le
 * validateur de sortie est l'unique décideur de ce qui est un récit recevable, et un
 * second décideur ici divergerait de lui (KR-013). Elle n'appelle rien, ne persiste
 * rien, n'émet rien : l'orchestrateur la compose APRÈS la réponse du modèle, puis
 * persiste ce qu'elle rend.
 *
 * ⚠ CE FICHIER N'ÉCRIT JAMAIS LE NOM DU SERVICE QUI PARLE AU MODÈLE, NI AUCUNE ROUTE
 * RÉSEAU — même en commentaire : `brain/dossier/` est sous interdiction TOTALE par
 * `moteurSansIA.test.ts` (KR-260), un balayage de TEXTE aveugle à la sémantique. Ce
 * module reçoit une chaîne ; d'où elle vient ne le regarde pas.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6), même doctrine que `session.ts`
 * et `commandes.ts`.
 */
import type { EtatSession } from './session'

/**
 * CONSIGNER LE RÉCIT DU PAS `tour` — PURE, synchrone, totale.
 *
 * ELLE ÉCRIT SUR L'ENTRÉE QUI PORTE `origine` POUR CE PAS, ET SUR ELLE SEULE — jamais
 * sur « la dernière entrée » : un `aller` qui franchit un jalon place les entrées de
 * jalon APRÈS l'entrée d'`origine`, au MÊME `tour`, et une implémentation « dernière
 * ligne » y poserait le récit sur une conséquence de règle au lieu de la commande
 * (scénario séparateur de `recit.test.ts`). Invariant tenu par construction :
 * `journal.every(e => e.recit === undefined || e.origine !== undefined)`.
 *
 * ELLE REND LA MÊME RÉFÉRENCE — `toBe`, jamais une copie égale — dans TROIS cas, et
 * aucun n'est une erreur à signaler : il n'y a simplement rien à écrire.
 *  1. `tour !== session.horloge.tour` — le récit d'un pas PÉRIMÉ. Inatteignable
 *     aujourd'hui par le verrou de tour de l'orchestrateur (KR-265), et gardé QUAND
 *     MÊME : c'est une fonction exportée de `brain/`, dont l'invariant se vérifie
 *     indépendamment de l'écran qui l'appelle aujourd'hui (§ 8 désaccord 15) ;
 *  2. aucune entrée à `origine` n'existe pour ce pas — le tour zéro, ou un journal
 *     qui n'a rien joué : il n'y a pas de commande à raconter ;
 *  3. l'entrée à `origine` de ce pas porte DÉJÀ un récit — au plus UN récit par pas,
 *     et le premier gagne : un second appel n'écrase jamais ce que le joueur a lu.
 *
 * CE QU'ELLE NE TOUCHE PAS, ET C'EST MESURÉ PAR RÉFÉRENCE : `monde`, `horloge`,
 * `attente`, et CHAQUE AUTRE entrée du journal gardent leur identité. Seules la
 * session, la liste du journal et l'entrée porteuse sont neuves.
 */
export function consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession {
	if (tour !== session.horloge.tour) return session

	const rang = session.journal.findIndex((entree) => entree.tour === tour && entree.origine !== undefined)
	if (rang === -1) return session
	if (session.journal[rang].recit !== undefined) return session

	return {
		...session,
		journal: session.journal.map((entree, indice) => (indice === rang ? { ...entree, recit } : entree)),
	}
}
