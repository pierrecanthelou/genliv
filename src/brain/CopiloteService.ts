/**
 * LE COPILOTE — le seul chemin par lequel une proposition de modèle entre dans
 * l'application.
 *
 * Ce qu'il fait : assembler le contexte sous garde d'audience, appeler la route
 * `POST /ia/:role` du worker, valider la FORME de ce qui revient, REJOUER une
 * seule fois, puis s'arrêter.
 *
 * Ce qu'il ne fait PAS : écrire. Rien n'entre dans le dossier sans un geste de
 * l'auteur — `DossierService.update` est appelé par l'écran, à l'acceptation,
 * jamais ici.
 *
 * L'INVITE N'EST PAS ICI : le client décide QUELLES DONNÉES SORTENT, le worker
 * décide CE QU'ON DEMANDE (KR-236). Une invite côté client serait rejouable par
 * quiconque ouvre les devtools, alors que c'est le worker qui détient la clé
 * d'API et qui paie.
 */
import type { CloudSettingsService } from './CloudSettingsService'
import { assemblerContexte, type MotifRefusContexte } from './copilote/contexte'
import { validerSortie, type MotifIllisible } from './copilote/schemaSortie'
import type { ChampProseChemin, PropositionResolue, RoleCopilote } from './copilote/types'
import type { Dossier } from './dossier/types'

export interface CibleCopilote {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProseChemin
}

export type RaisonIndisponible = 'non-configure' | 'injoignable' | 'annule'

/** UNION DISCRIMINÉE — QUATRE `statut`, l'enveloppe du goal. Même doctrine
 *  qu'`EcritureDossier` : aucun appelant ne peut lire une proposition sur un
 *  échec, c'est le TYPAGE qui l'interdit, pas une convention de rendu. */
export type ReponseCopilote =
	| { statut: 'propose'; proposition: PropositionResolue }
	/** AVANT tout appel réseau. L'écran rend le champ par son LIBELLÉ FRANÇAIS
	 *  via `LIBELLE_DES_CHAMPS`, jamais par sa clé technique. */
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	/** APRÈS le rejeu unique. État TERMINAL : rien n'est persisté, rien n'est réparé. */
	| { statut: 'illisible'; motif: MotifIllisible }

export interface CopiloteService {
	/** VRAI si l'URL du worker ET la clé de synchronisation sont réglées.
	 *  AUCUN appel réseau : une disponibilité qui sonde le réseau ferait
	 *  clignoter un bouton au rendu. */
	estDisponible(): boolean
	demander(role: RoleCopilote, dossier: Dossier, cible: CibleCopilote, signal?: AbortSignal): Promise<ReponseCopilote>
}

/**
 * Le délai au bout duquel l'appel est abandonné. MÊME valeur que le jumeau de
 * `CloudflareKVTransport.ts` (l. 3-13) — et le jumeau N'EST PAS touché.
 *
 * CONDITION DE PROMOTION, écrite pour qu'elle soit décidable et non débattue : le
 * jour où un TROISIÈME appelant a besoin de ce motif, `withTimeout` monte dans
 * `brain/utils/`. À deux, on ne rouvre pas le chemin de synchronisation des
 * données de l'auteur pour huit lignes de flot de contrôle.
 */
const DELAI_MS = 45_000

/** CE QUI PART SUR LE FIL — ni date, ni identifiant, ni nonce. C'est ce qui rend
 *  « deux lancers ⇒ deux corps identiques » démontrable par égalité stricte. */
interface CorpsDemande {
	role: RoleCopilote
	champ: ChampProseChemin
	contexte: string
}

/** Le résultat d'UN aller-retour, avant validation de forme : soit une valeur
 *  brute à valider, soit une indisponibilité qui ne se rejoue JAMAIS. */
type Aller = { joint: true; brut: unknown } | { joint: false; raison: RaisonIndisponible }

async function unAller(
	url: string,
	entetes: Record<string, string>,
	corps: CorpsDemande,
	appelant?: AbortSignal,
): Promise<Aller> {
	if (appelant?.aborted === true) return { joint: false, raison: 'annule' }

	// Le service compose SON PROPRE contrôleur : il doit pouvoir abandonner sur
	// DEUX causes — le signal de l'appelant (bouton « Annuler », touche Échap) et
	// son propre délai. Écouteur retiré et minuteur annulé dans le `finally`
	// (`docs/WORKFLOW.md` § Timer Safety) : un minuteur qui survit à l'appel
	// abandonnerait le suivant.
	const controleur = new AbortController()
	let expire = false
	const surAbandon = (): void => controleur.abort()
	const minuteur = setTimeout(() => {
		expire = true
		controleur.abort()
	}, DELAI_MS)
	appelant?.addEventListener('abort', surAbandon)

	try {
		const res = await fetch(url, {
			method: 'POST',
			headers: { ...entetes, 'Content-Type': 'application/json' },
			body: JSON.stringify(corps),
			signal: controleur.signal,
		})
		// 503 est la SEULE réponse qui distingue « rien n'est réglé côté serveur »
		// de « ça n'a pas répondu » : le worker la rend quand sa clé d'API manque.
		if (!res.ok) return { joint: false, raison: res.status === 503 ? 'non-configure' : 'injoignable' }
		// Un corps 200 illisible est une violation de FORME, pas une panne de
		// réseau : il repart dans le validateur, qui le classera `schema`.
		const brut: unknown = await res.json().catch(() => undefined)
		return { joint: true, brut }
	} catch {
		// Un abandon ne se distingue d'une panne que par SA CAUSE : le délai est une
		// indisponibilité, le geste de l'auteur est une annulation.
		if (controleur.signal.aborted && !expire) return { joint: false, raison: 'annule' }
		return { joint: false, raison: 'injoignable' }
	} finally {
		clearTimeout(minuteur)
		appelant?.removeEventListener('abort', surAbandon)
	}
}

export function createCopiloteService(settings: CloudSettingsService): CopiloteService {
	return {
		// Délégué plutôt que réécrit : `isConfigured()` EST déjà le prédicat « URL du
		// worker ET clé de synchronisation réglées », et deux écritures du même
		// prédicat divergeraient au premier réglage ajouté.
		estDisponible: () => settings.isConfigured(),

		async demander(role, dossier, cible, signal) {
			// LE REFUS DE CONTEXTE PASSE AVANT TOUT : il ne coûte rien, il nomme ce
			// qui manque, et il garantit « zéro `fetch` » quelle que soit la
			// configuration. L'ordre inverse ferait dire « indisponible » à un dossier
			// dont il manque seulement le ton.
			const contexte = assemblerContexte(role, dossier, cible)
			if (!contexte.ok) {
				// La traduction est ÉCRITE branche par branche plutôt que déduite d'un
				// `...contexte` privé de son `ok` : « trop long » ne porte AUCUNE charge,
				// et un étalement laisserait un jour passer un `chemin` sur la branche qui
				// n'en a pas — précisément l'étalement d'enveloppe que `DossierService`
				// s'interdit pour la même raison.
				const refus: MotifRefusContexte =
					contexte.motif === 'a-ecrire' ? { motif: contexte.motif, chemin: contexte.chemin } : { motif: contexte.motif }
				return { statut: 'refuse', ...refus }
			}

			const workerUrl = settings.getWorkerUrl()
			const syncKey = settings.getSyncKey()
			if (workerUrl === null || syncKey === null) return { statut: 'indisponible', raison: 'non-configure' }

			const url = `${workerUrl.replace(/\/$/, '')}/ia/${role}`
			const entetes = { 'X-Sync-Key': syncKey }
			const corps: CorpsDemande = { role, champ: cible.champ, contexte: contexte.texte }

			// REJEU EXACTEMENT UNE FOIS, et seulement sur une violation de FORME.
			// Réseau, 5xx, 413, délai, abandon : UN SEUL appel — sans mémoire, le
			// second corps serait identique, donc la garde rendrait identiquement la
			// même erreur. Rejouer un déterminisme est une perte sèche.
			let dernierMotif: MotifIllisible = 'schema'
			for (let essai = 0; essai < 2; essai += 1) {
				const aller = await unAller(url, entetes, corps, signal)
				if (!aller.joint) return { statut: 'indisponible', raison: aller.raison }
				const sortie = validerSortie(aller.brut, dossier)
				if (sortie.ok) {
					return {
						statut: 'propose',
						proposition: { entiteId: cible.entiteId, champ: cible.champ, texte: sortie.valeur },
					}
				}
				// AUCUNE RÉTENTION de la sortie fautive : la montrer serait afficher ce
				// que le validateur vient de refuser. Seul le motif survit.
				dernierMotif = sortie.motif
			}
			// État TERMINAL : rien n'est persisté, rien n'est réparé, rien n'est émis.
			return { statut: 'illisible', motif: dernierMotif }
		},
	}
}
