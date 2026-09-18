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
import {
	assemblerDetenteurs,
	assemblerPlan,
	assemblerProse,
	assemblerRepliques,
	type MotifRefusContexte,
} from './copilote/contexte'
import {
	validerDetenteurs,
	validerIntention,
	validerRepliques,
	validerSortie,
	type MotifIllisible,
} from './copilote/schemaSortie'
import type {
	ChampProseChemin,
	PropositionDetenteurs,
	PropositionPlan,
	PropositionRepliques,
	PropositionResolue,
} from './copilote/types'
import type { Dossier } from './dossier/types'

/** INCHANGÉE, et délibérément NON RENOMMÉE : c'est la cible du rôle PROSE. Le
 *  renommage en `CibleProse` est une dette NOMMÉE, à payer par la première
 *  itération qui touche à la fois le hook et ce fichier. */
export interface CibleCopilote {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProseChemin
}

/** Pas de `champ` ici, et ce n'est pas un oubli : on ne demande pas un champ, on
 *  demande QUI. Un `champ?` optionnel sur une cible commune rendrait représentable
 *  « une demande de prose sans champ » (§ 8, TL-1). */
export interface CibleIndice {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	indiceId: string
}

/**
 * LA CIBLE DU TROISIÈME RÔLE. `personnageId`, et PAS `entiteId` — ce n'est PAS une
 * préférence de nommage (§ 8, TL3a-5, veto non contesté).
 *
 * Le dispatch de `demander` est un RÉTRÉCISSEMENT STRUCTUREL sur la FORME de la
 * cible, donc les TROIS cibles doivent être DISJOINTES DEUX À DEUX. Avec `entiteId`,
 * une cible de répliques partagerait sa seule clé avec `CibleCopilote` : une
 * VARIABLE de type `CibleCopilote` s'assignerait ici SANS ERREUR — le contrôle
 * d'excédent de TypeScript ne vaut que sur un LITTÉRAL —, elle retomberait dans la
 * branche `'champ' in cible`, et on obtiendrait rôle annoncé A, validateur exécuté B,
 * avec `tsc` vert.
 *
 * FAIT AGGRAVANT, LU DANS LE CODE DE L'IT2 : le dernier `return` du dispatch était un
 * REPLI vers `demanderDetenteurs`, où une troisième cible serait tombée PAR DÉFAUT.
 * Il est devenu une BRANCHE dans le même lot.
 */
export interface CibleRepliques {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	personnageId: string
}

/**
 * LA CIBLE DU QUATRIÈME RÔLE.
 *
 * ⚠ `acteurId` et JAMAIS `personnageId` : le dispatch rétrécit sur la FORME de la
 * cible, et `CibleRepliques` est `{ personnageId }` NUE. Une quatrième cible
 * `{ personnageId }` serait LE MÊME TYPE — la surcharge déclarée l'accepterait,
 * l'implémentation la ferait tomber dans `demanderRepliques` : rôle annoncé A,
 * validateur exécuté B, `tsc` VERT. C'est le veto TL3a-5 au mot près, retrouvé
 * INDÉPENDAMMENT par les deux postes à effort élevé au raffinage de 3b.
 *
 * Le mot vient du dépôt : `dossier/types.ts:362` glose déjà `plan_actions[].action`
 * par « ce que le rôle ACTEUR joue ».
 *
 * ⚠ DETTE DATÉE, avec sa condition d'ouverture écrite : `acteurId` ne nomme aucune
 * entité du dossier — c'est un SYNONYME assumé et borné. L'itération 3c cible AUSSI
 * un personnage ; un TROISIÈME synonyme est le signal, et 3c ne fabriquera pas
 * `protagonisteId` : elle basculera les cinq cibles sur une UNION ÉTIQUETÉE, dans
 * SON lot contrat. Jamais 3b — le faire ici ferait saigner ce lot dans
 * `src/features/**`.
 */
export interface CiblePlan {
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	acteurId: string
}

export type RaisonIndisponible = 'non-configure' | 'injoignable' | 'annule'

/** LES TROIS BRANCHES D'ÉCHEC, extraites : rigoureusement les mêmes pour tous les
 *  rôles, et elles doivent le rester. Ré-exportée — l'état d'écran des deux cartes
 *  la porte. */
export type EchecCopilote =
	/** AVANT tout appel réseau. L'écran rend le champ par son LIBELLÉ FRANÇAIS
	 *  via `LIBELLE_DES_CHAMPS` quand le motif porte un `chemin`, jamais par sa clé
	 *  technique ; les motifs SANS charge sont nommés en prose côté feature. */
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	/** APRÈS le rejeu unique. État TERMINAL : rien n'est persisté, rien n'est réparé. */
	| { statut: 'illisible'; motif: MotifIllisible }

/** DEUX unions NOMMÉES, jamais un générique à défaut : `ReponseCopilote` garde son
 *  nom ET son sens (rôle prose), et aucun appelant existant ne bouge (§ 8, TL-16).
 *  Même doctrine qu'`EcritureDossier` : aucun appelant ne peut lire une proposition
 *  sur un échec, c'est le TYPAGE qui l'interdit, pas une convention de rendu. */
export type ReponseCopilote = { statut: 'propose'; proposition: PropositionResolue } | EchecCopilote
export type ReponseDetenteurs = { statut: 'propose'; proposition: PropositionDetenteurs } | EchecCopilote
export type ReponseRepliques = { statut: 'propose'; proposition: PropositionRepliques } | EchecCopilote
export type ReponsePlan = { statut: 'propose'; proposition: PropositionPlan } | EchecCopilote

/**
 * SURCHARGE SUR LE LITTÉRAL DE RÔLE — le point de contrat le plus chargé de
 * l'itération. Trois raisons, dans l'ordre :
 *
 *  1. `demander('indice-detenteurs', d, { entiteId, champ })` est une ERREUR DE
 *     COMPILATION : le couple (rôle, cible) cesse d'être un état représentable.
 *  2. Le type de retour reste EXACT par branche : la carte 1 ne rétrécit jamais au
 *     runtime une proposition dont elle connaît la forme à la compilation.
 *  3. Elle N'AJOUTE AUCUN MEMBRE à l'interface. MESURÉ : les trois suites de la
 *     feature bouchonnent par `brain.copilote = { estDisponible, demander }` avec
 *     `demander` annoté `jest.Mock` NU. Un MEMBRE de plus rend ces trois littéraux
 *     incomplets et le lot contrat ne passe plus `tsc` SEUL ; une SURCHARGE passe.
 *
 * ⚠ Un appelant qui détient `role: RoleCopilote` (union, non littéral) ne satisfait
 * AUCUNE surcharge. C'est voulu : chaque carte connaît son rôle statiquement.
 */
export interface CopiloteService {
	/** VRAI si l'URL du worker ET la clé de synchronisation sont réglées.
	 *  AUCUN appel réseau : une disponibilité qui sonde le réseau ferait
	 *  clignoter un bouton au rendu. */
	estDisponible(): boolean
	demander(
		role: 'personnage-prose',
		dossier: Dossier,
		cible: CibleCopilote,
		signal?: AbortSignal,
	): Promise<ReponseCopilote>
	demander(
		role: 'indice-detenteurs',
		dossier: Dossier,
		cible: CibleIndice,
		signal?: AbortSignal,
	): Promise<ReponseDetenteurs>
	demander(
		role: 'personnage-repliques',
		dossier: Dossier,
		cible: CibleRepliques,
		signal?: AbortSignal,
	): Promise<ReponseRepliques>
	demander(role: 'personnage-plan', dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>
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

/** PRIVÉ. CE QUI PART SUR LE FIL — ni date, ni identifiant, ni nonce. C'est ce qui
 *  rend « deux lancers ⇒ deux corps identiques » démontrable par égalité stricte.
 *  UNION et non `champ?` : le rôle détenteurs n'a pas de champ, et un optionnel
 *  rendrait représentable « une demande de prose sans champ ». */
type CorpsDemande =
	| { role: 'personnage-prose'; champ: ChampProseChemin; contexte: string }
	| { role: 'indice-detenteurs'; contexte: string }
	/** SANS `champ`, et ce n'est pas un oubli : LE RÔLE EST LE CHAMP. Il n'y a qu'un
	 *  seul champ que ce rôle puisse remplir, donc le nommer sur le fil serait un écho
	 *  que rien n'arbitrerait s'il devenait faux. */
	| { role: 'personnage-repliques'; contexte: string }
	/** SANS `champ` non plus, MÊME motif — et sans le moindre entier : le modèle ne
	 *  voit JAMAIS le numéro d'étape, que le code posera sur la liste VIVE à
	 *  l'acceptation. */
	| { role: 'personnage-plan'; contexte: string }

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

/**
 * LA BOUCLE D'APPEL, paramétrée par `(corps, valider)` — DEUX appelants, même
 * fichier, invisible au contrat.
 *
 * REJEU EXACTEMENT UNE FOIS, et seulement sur une violation de FORME. Réseau, 5xx,
 * 413, délai, abandon : UN SEUL appel — sans mémoire, le second corps serait
 * identique, donc la garde rendrait identiquement la même erreur. Rejouer un
 * déterminisme est une perte sèche.
 *
 * AUCUNE RÉTENTION de la sortie fautive : la montrer serait afficher ce que le
 * validateur vient de refuser. Seul le MOTIF survit — celui du SECOND échec.
 */
async function jusquAuRejeuUnique<S>(
	url: string,
	entetes: Record<string, string>,
	corps: CorpsDemande,
	valider: (brut: unknown) => { ok: true; sortie: S } | { ok: false; motif: MotifIllisible },
	signal: AbortSignal | undefined,
): Promise<{ ok: true; sortie: S } | { ok: false; echec: EchecCopilote }> {
	let dernierMotif: MotifIllisible = 'schema'
	for (let essai = 0; essai < 2; essai += 1) {
		const aller = await unAller(url, entetes, corps, signal)
		if (!aller.joint) return { ok: false, echec: { statut: 'indisponible', raison: aller.raison } }
		const sortie = valider(aller.brut)
		if (sortie.ok) return { ok: true, sortie: sortie.sortie }
		dernierMotif = sortie.motif
	}
	// État TERMINAL : rien n'est persisté, rien n'est réparé, rien n'est émis.
	return { ok: false, echec: { statut: 'illisible', motif: dernierMotif } }
}

/** La traduction d'un refus de contexte, ÉCRITE branche par branche plutôt que
 *  déduite d'un `...contexte` privé de son `ok` : trois des quatre motifs ne
 *  portent AUCUNE charge, et un étalement laisserait un jour passer un `chemin` sur
 *  une branche qui n'en a pas — précisément l'étalement d'enveloppe que
 *  `DossierService` s'interdit pour la même raison. */
function refuser(refus: MotifRefusContexte): EchecCopilote {
	const motif: MotifRefusContexte =
		refus.motif === 'a-ecrire' ? { motif: refus.motif, chemin: refus.chemin } : { motif: refus.motif }
	return { statut: 'refuse', ...motif }
}

export function createCopiloteService(settings: CloudSettingsService): CopiloteService {
	/** L'adresse et l'en-tête, ou `null` quand la configuration est incomplète —
	 *  SECOND temps de l'ordre des effets, jamais le premier. */
	function acheminement(role: string): { url: string; entetes: Record<string, string> } | null {
		const workerUrl = settings.getWorkerUrl()
		const syncKey = settings.getSyncKey()
		if (workerUrl === null || syncKey === null) return null
		return { url: `${workerUrl.replace(/\/$/, '')}/ia/${role}`, entetes: { 'X-Sync-Key': syncKey } }
	}

	async function demanderProse(
		dossier: Dossier,
		cible: CibleCopilote,
		signal: AbortSignal | undefined,
	): Promise<ReponseCopilote> {
		// LE REFUS DE CONTEXTE PASSE AVANT TOUT : il ne coûte rien, il nomme ce qui
		// manque, et il garantit « zéro `fetch` » quelle que soit la configuration.
		// L'ordre inverse ferait dire « indisponible » à un dossier dont il manque
		// seulement le ton.
		const contexte = assemblerProse(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('personnage-prose')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		const corps: CorpsDemande = { role: 'personnage-prose', champ: cible.champ, contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique<string>(
			vers.url,
			vers.entetes,
			corps,
			(brut) => {
				const sortie = validerSortie(brut, dossier)
				return sortie.ok ? { ok: true, sortie: sortie.valeur } : { ok: false, motif: sortie.motif }
			},
			signal,
		)
		if (!issue.ok) return issue.echec
		// RE-RÉSOLUE CÔTÉ CLIENT : `entiteId` et `champ` viennent de l'ÉTAT D'ÉCRAN,
		// jamais de la réponse (KR-231).
		return { statut: 'propose', proposition: { entiteId: cible.entiteId, champ: cible.champ, texte: issue.sortie } }
	}

	async function demanderDetenteurs(
		dossier: Dossier,
		cible: CibleIndice,
		signal: AbortSignal | undefined,
	): Promise<ReponseDetenteurs> {
		const contexte = assemblerDetenteurs(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('indice-detenteurs')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		// La table des rangs ne sort JAMAIS de `brain/` : le validateur n'en reçoit que
		// les CLÉS, et la re-résolution se fait ici, sur la table RENDUE PAR
		// L'ASSEMBLEUR — jamais re-dérivée (KR-231).
		const rangsConnus: ReadonlySet<string> = new Set(contexte.rangs.keys())
		const corps: CorpsDemande = { role: 'indice-detenteurs', contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique<readonly string[]>(
			vers.url,
			vers.entetes,
			corps,
			(brut) => {
				const sortie = validerDetenteurs(brut, rangsConnus)
				return sortie.ok ? { ok: true, sortie: sortie.detenteurs } : { ok: false, motif: sortie.motif }
			},
			signal,
		)
		if (!issue.ok) return issue.echec

		// `Map.get` est PARTIEL, et c'est le seul endroit où ça se voit. La branche
		// `undefined` est INATTEIGNABLE — `validerDetenteurs` vient de constater
		// l'appartenance de CHAQUE jeton à CETTE table —, mais l'alternative est un `!`
		// ou un `as`, c'est-à-dire l'endroit exact où le compilateur cesse de protéger
		// (KR-175). AUCUNE conversion numérique : la re-résolution est un `Map.get`.
		const personnageIds: string[] = []
		for (const rang of issue.sortie) {
			const identifiant = contexte.rangs.get(rang)
			if (identifiant !== undefined) personnageIds.push(identifiant)
		}
		return { statut: 'propose', proposition: { indiceId: cible.indiceId, personnageIds } }
	}

	async function demanderRepliques(
		dossier: Dossier,
		cible: CibleRepliques,
		signal: AbortSignal | undefined,
	): Promise<ReponseRepliques> {
		// LES TROIS REFUS DE CONTEXTE PASSENT AVANT TOUT : `a-ecrire`,
		// `cible-a-ecrire`, `trop-long` — aucun `fetch` ne part sur aucun des trois.
		const contexte = assemblerRepliques(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('personnage-repliques')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		const corps: CorpsDemande = { role: 'personnage-repliques', contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique<readonly string[]>(
			vers.url,
			vers.entetes,
			corps,
			(brut) => {
				const sortie = validerRepliques(brut, dossier)
				return sortie.ok ? { ok: true, sortie: sortie.repliques } : { ok: false, motif: sortie.motif }
			},
			signal,
		)
		if (!issue.ok) return issue.echec

		// RE-RÉSOLUE CÔTÉ CLIENT : `personnageId` vient de l'ÉTAT D'ÉCRAN, jamais de la
		// réponse (KR-231). `ajouts` porte la SÉMANTIQUE D'ÉCRITURE — la feature les
		// AJOUTE à `caractere.parler[]`, elle ne les y substitue pas.
		return { statut: 'propose', proposition: { personnageId: cible.personnageId, ajouts: issue.sortie } }
	}

	async function demanderPlan(
		dossier: Dossier,
		cible: CiblePlan,
		signal: AbortSignal | undefined,
	): Promise<ReponsePlan> {
		// LES TROIS REFUS DE CONTEXTE PASSENT AVANT TOUT : `a-ecrire`,
		// `cible-a-ecrire`, `trop-long` — aucun `fetch` ne part sur aucun des trois.
		const contexte = assemblerPlan(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('personnage-plan')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		const corps: CorpsDemande = { role: 'personnage-plan', contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique<string>(
			vers.url,
			vers.entetes,
			corps,
			(brut) => {
				const sortie = validerIntention(brut, dossier)
				return sortie.ok ? { ok: true, sortie: sortie.intention } : { ok: false, motif: sortie.motif }
			},
			signal,
		)
		if (!issue.ok) return issue.echec

		// RE-RÉSOLUE CÔTÉ CLIENT : `acteurId` vient de l'ÉTAT D'ÉCRAN, jamais de la
		// réponse (KR-231). DEUX MOTS POUR LA MÊME CHAÎNE, et c'est voulu : le modèle
		// rend une `intention` (ce qu'on lui enseigne), le code re-résout une `action`
		// (la destination dans le document). Ne pas « harmoniser » — voir
		// `copilote/types.ts`.
		return { statut: 'propose', proposition: { acteurId: cible.acteurId, action: issue.sortie } }
	}

	/**
	 * L'IMPLÉMENTATION À SURCHARGES — trois signatures publiques, un corps élargi,
	 * AUCUN `as`. Le dispatch se fait sur la FORME DE LA CIBLE (`'champ' in cible`),
	 * qui est un rétrécissement réel pour TypeScript, et non sur le rôle : rétrécir
	 * un paramètre par la valeur d'un AUTRE paramètre exigerait un cast. C'est ce
	 * rétrécissement structurel qui EXIGE que les trois cibles soient DISJOINTES DEUX
	 * À DEUX — d'où `personnageId` et non `entiteId` (§ 8, TL3a-5).
	 *
	 * ⚠ LE DERNIER `return` EST UNE BRANCHE, PLUS UN REPLI. À l'itération 2 il valait
	 * `return demanderDetenteurs(…)` sans garde : une troisième cible y serait tombée
	 * PAR DÉFAUT, rôle annoncé A et validateur exécuté B. Les gardes `'indiceId' in
	 * cible` et `'acteurId' in cible` sont désormais explicites, si bien que le dernier
	 * `return` reçoit une cible RÉTRÉCIE À `CibleRepliques` PAR LE COMPILATEUR — et non
	 * par la lecture. QUATRE BRANCHES, AUCUN REPLI.
	 *
	 * `_role` est donc INUTILISÉ, et c'est la conséquence assumée : chaque branche
	 * privée nomme SON rôle en littéral, ce qui rend le segment de route exact à la
	 * compilation plutôt que recopié d'un paramètre élargi à l'union. Le couple
	 * (rôle, cible) ne peut pas diverger — les surcharges l'ont déjà fermé.
	 */
	function demander(
		role: 'personnage-prose',
		dossier: Dossier,
		cible: CibleCopilote,
		signal?: AbortSignal,
	): Promise<ReponseCopilote>
	function demander(
		role: 'indice-detenteurs',
		dossier: Dossier,
		cible: CibleIndice,
		signal?: AbortSignal,
	): Promise<ReponseDetenteurs>
	function demander(
		role: 'personnage-repliques',
		dossier: Dossier,
		cible: CibleRepliques,
		signal?: AbortSignal,
	): Promise<ReponseRepliques>
	function demander(
		role: 'personnage-plan',
		dossier: Dossier,
		cible: CiblePlan,
		signal?: AbortSignal,
	): Promise<ReponsePlan>
	function demander(
		_role: 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques' | 'personnage-plan',
		dossier: Dossier,
		cible: CibleCopilote | CibleIndice | CibleRepliques | CiblePlan,
		signal?: AbortSignal,
	): Promise<ReponseCopilote | ReponseDetenteurs | ReponseRepliques | ReponsePlan> {
		if ('champ' in cible) return demanderProse(dossier, cible, signal)
		if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
		if ('acteurId' in cible) return demanderPlan(dossier, cible, signal)
		return demanderRepliques(dossier, cible, signal)
	}

	return {
		// Délégué plutôt que réécrit : `isConfigured()` EST déjà le prédicat « URL du
		// worker ET clé de synchronisation réglées », et deux écritures du même
		// prédicat divergeraient au premier réglage ajouté.
		estDisponible: () => settings.isConfigured(),
		demander,
	}
}
