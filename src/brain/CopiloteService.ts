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
	assemblerDistribution,
	assemblerPlan,
	assemblerProse,
	assemblerRelations,
	assemblerRepliques,
	type MotifRefusContexte,
} from './copilote/contexte'
import {
	validerDetenteurs,
	validerDistribution,
	validerIntention,
	validerRelations,
	validerRepliques,
	validerSortie,
	type MotifIllisible,
} from './copilote/schemaSortie'
import type {
	ChampProseChemin,
	FicheBrouillon,
	PropositionDetenteurs,
	PropositionDistribution,
	PropositionPlan,
	PropositionRelations,
	PropositionRepliques,
	PropositionResolue,
	LienResolu,
} from './copilote/types'
import type { Dossier } from './dossier/types'

/**
 * L'UNION ÉTIQUETÉE DES CINQ CIBLES — le contrat le plus chargé de l'itération 3c, et
 * il REMPLACE le paramètre `role` de `demander`.
 *
 * MOTIF, MESURÉ ET NON SUPPOSÉ : jusqu'à 3b le dispatch rétrécissait sur la FORME de
 * la cible et le dernier `return` recevait `CibleRepliques` par élimination. Une
 * cinquième cible `{ personnageId }` — celle du rôle RELATIONS — aurait été LE MÊME
 * TYPE que `CibleRepliques` : la surcharge déclarée l'aurait acceptée, l'implémentation
 * l'aurait fait tomber dans `demanderRepliques`, et on aurait eu RÔLE ANNONCÉ A,
 * VALIDATEUR EXÉCUTÉ B, avec `tsc` VERT. C'est le signal, écrit d'avance par 3b, que le
 * dispatch structurel avait daté.
 *
 * CE QUE L'ÉTIQUETTE ACHÈTE, et rien de plus :
 *  1. `(rôle, cible)` CESSE D'ÊTRE DEUX PORTEURS, donc cesse de POUVOIR diverger par
 *     construction — il n'y a plus deux valeurs à tenir en phase ;
 *  2. le `switch (cible.role)` de l'implémentation porte une garde `never`, si bien
 *     qu'un SIXIÈME rôle sans branche NE COMPILE PAS, là où les gardes `'x' in cible`
 *     étaient explicites PAR CONVENTION, sans preuve d'exhaustivité ;
 *  3. le paramètre `_role` inutilisé disparaît.
 *
 * ⚠ LE RISQUE NEUF QU'ELLE CRÉE, ET SA PARADE : `cible.role` porte LE MÊME NOM que
 * `CorpsDemande.role`. Un `{ ...cible, contexte }` mettrait donc `personnageId`,
 * `indiceId` ou `champ` SUR LE FIL (KR-231). PARADE : chaque branche privée ÉCRIT SON
 * LITTÉRAL de corps, et un témoin asserte le corps par `toEqual`, JAMAIS par inclusion.
 *
 * ⚠ `acteurId` N'EST PAS RENOMMÉ (§ 8, n° 23) : l'étiquette rend le synonyme
 * INOFFENSIF — `CiblePlan` et `CibleRelations` ne peuvent plus se confondre même si
 * elles partageaient leur charge —, et le renommage tirerait `planActions.test.tsx`
 * dans le lot contrat. Une dette fermée par conception n'est plus une dette.
 */

/** INCHANGÉE dans sa CHARGE, et délibérément NON RENOMMÉE : c'est la cible du rôle
 *  PROSE. Le renommage en `CibleProse` est une dette NOMMÉE (§ 8, n° 44), dont la
 *  condition d'ouverture — un SECOND rôle de prose pure — n'est pas échue. */
export interface CibleCopilote {
	role: 'personnage-prose'
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	entiteId: string
	champ: ChampProseChemin
}

/** Pas de `champ` ici, et ce n'est pas un oubli : on ne demande pas un champ, on
 *  demande QUI. Un `champ?` optionnel sur une cible commune rendrait représentable
 *  « une demande de prose sans champ » (§ 8, TL-1). */
export interface CibleIndice {
	role: 'indice-detenteurs'
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	indiceId: string
}

/** LA CIBLE DU TROISIÈME RÔLE. `personnageId`, et PAS `entiteId` — le motif d'origine
 *  (§ 8, TL3a-5) était la DISJONCTION STRUCTURELLE des charges ; depuis 3c c'est
 *  l'étiquette qui la porte, et le nom reste parce qu'il est le bon. */
export interface CibleRepliques {
	role: 'personnage-repliques'
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	personnageId: string
}

/**
 * LA CIBLE DU QUATRIÈME RÔLE.
 *
 * `acteurId` vient du dépôt : `dossier/types.ts` glose déjà `plan_actions[].action`
 * par « ce que le rôle ACTEUR joue ». Ce n'était PAS un choix de style à 3b mais la
 * seule façon de rendre la charge disjointe de `CibleRepliques` ; depuis 3c
 * l'étiquette suffirait, et c'est précisément pour cela qu'on NE LE RENOMME PAS —
 * `planActions.test.tsx` entrerait dans le lot contrat pour du churn pur (§ 8, n° 23).
 */
export interface CiblePlan {
	role: 'personnage-plan'
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	acteurId: string
}

/**
 * LA CIBLE DU CINQUIÈME RÔLE — et sa CHARGE est celle de `CibleRepliques`, MOT POUR
 * MOT. C'est délibéré, et c'est la démonstration de l'union étiquetée : deux rôles
 * visent LA MÊME ENTITÉ pour en écrire DEUX CHAMPS DIFFÉRENTS, donc leur charge ne
 * peut pas les distinguer — seule l'étiquette le peut.
 *
 * ⚠ `porteurId` EST REJETÉ (§ 8, n° 22) : ce serait un TROISIÈME synonyme de
 * `personnageId` pour désigner un personnage, c'est-à-dire exactement le travers que
 * l'étiquette vient de rendre inutile. Le mot `porteur` reste dans la PROSE des
 * docstrings, où il dit « celui dont on complète les relations » face aux
 * « candidats » — il ne devient jamais une clé.
 */
export interface CibleRelations {
	role: 'personnage-relations'
	/** Reste côté client. Ne franchit JAMAIS le réseau (KR-231). */
	personnageId: string
}

/**
 * LA CIBLE DU SIXIÈME RÔLE — ⚠ LA PREMIÈRE À CHARGE VIDE, et ce n'est pas un oubli :
 * CE RÔLE NE CIBLE AUCUNE ENTITÉ EXISTANTE. Sa source est le canon, et ce qu'il produit
 * n'existe pas encore. L'étiquette porte donc, à elle seule, tout ce que la cible a à
 * dire.
 *
 * ⚠ NE PAS LUI AJOUTER DE `dossierId` « PAR SYMÉTRIE » avec les cinq autres charges :
 * le dossier est déjà le premier paramètre de `demander`, il n'aurait aucun lecteur, et
 * une clé sans lecteur sur une cible est exactement la ligne que KR-109 refuse.
 *
 * ⚠ L'INVARIANT DES CINQ RÔLES LIVRÉS — « la proposition est LA CIBLE PLUS LE CONTENU »
 * — NE S'APPLIQUE PAS ICI : la cible EST le dossier. `PropositionDistribution` ne porte
 * donc aucun identifiant de cible, et ce n'est pas une omission à réparer.
 *
 * ⚠ ELLE RESTE UNE INTERFACE, et non un alias `{ role: 'monde-distribution' }` écrit au
 * site d'appel : c'est l'étiquette qui sépare les six branches du dispatch, et un type
 * nommé est ce qui rend la 6ᵉ surcharge lisible aux DEUX sites.
 */
export interface CibleDistribution {
	role: 'monde-distribution'
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
export type ReponseRelations = { statut: 'propose'; proposition: PropositionRelations } | EchecCopilote
export type ReponseDistribution = { statut: 'propose'; proposition: PropositionDistribution } | EchecCopilote

/**
 * SURCHARGE SUR LA CIBLE ÉTIQUETÉE — le point de contrat le plus chargé de
 * l'itération, et LE PARAMÈTRE `role` A DISPARU. Trois raisons, dans l'ordre :
 *
 *  1. `demander(d, { role: 'indice-detenteurs', entiteId, champ })` est une ERREUR DE
 *     COMPILATION : le couple (rôle, charge) cesse d'être un état représentable — et
 *     il cesse même d'être DEUX VALEURS, donc de pouvoir diverger.
 *  2. Le type de retour reste EXACT par branche : une carte ne rétrécit jamais au
 *     runtime une proposition dont elle connaît la forme à la compilation.
 *  3. Elle N'AJOUTE AUCUN MEMBRE à l'interface. MESURÉ à 3a et RE-MESURÉ à 3c : les
 *     suites de la feature bouchonnent par `brain.copilote = { estDisponible,
 *     demander }` avec `demander` annoté `jest.Mock` NU. Un MEMBRE de plus rend ces
 *     littéraux incomplets et le lot contrat ne passe plus `tsc` SEUL ; une SURCHARGE
 *     passe.
 *
 * ⚠ Un appelant qui détient une cible élargie à l'union des cinq ne satisfait AUCUNE
 * surcharge. C'est voulu : chaque carte connaît son rôle statiquement.
 */
export interface CopiloteService {
	/** VRAI si l'URL du worker ET la clé de synchronisation sont réglées.
	 *  AUCUN appel réseau : une disponibilité qui sonde le réseau ferait
	 *  clignoter un bouton au rendu. */
	estDisponible(): boolean
	demander(dossier: Dossier, cible: CibleCopilote, signal?: AbortSignal): Promise<ReponseCopilote>
	demander(dossier: Dossier, cible: CibleIndice, signal?: AbortSignal): Promise<ReponseDetenteurs>
	demander(dossier: Dossier, cible: CibleRepliques, signal?: AbortSignal): Promise<ReponseRepliques>
	demander(dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>
	demander(dossier: Dossier, cible: CibleRelations, signal?: AbortSignal): Promise<ReponseRelations>
	/** ⚠ LA 6ᵉ SURCHARGE SE POSE AUX DEUX SITES — ici (l'interface publique) ET sur
	 *  l'implémentation plus bas. En oublier un rend l'appel impossible côté feature
	 *  alors que `tsc` reste vert sur `brain/`. */
	demander(dossier: Dossier, cible: CibleDistribution, signal?: AbortSignal): Promise<ReponseDistribution>
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
 *  rendrait représentable « une demande de prose sans champ ».
 *
 *  ⚠ SON `role` PORTE LE MÊME NOM QUE `Cible*.role` DEPUIS 3c, ET CE N'EST PAS UNE
 *  INVITATION À L'ÉTALER. `{ ...cible, contexte }` compilerait, produirait le bon
 *  `role`, ET METTRAIT `personnageId`/`indiceId`/`champ` SUR LE FIL (KR-231). Chaque
 *  branche privée ÉCRIT DONC SON LITTÉRAL, et un témoin asserte le corps par `toEqual`,
 *  jamais par inclusion — une inclusion resterait verte sur la clé en trop. */
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
	/** SANS `champ` non plus, MÊME motif — et sans la moindre INTENSITÉ : le modèle ne
	 *  voit jamais le nombre, que le code pose à l'acceptation (`INTENSITE_INITIALE`). */
	| { role: 'personnage-relations'; contexte: string }
	/** SANS `champ`, et SANS RIEN D'AUTRE : la cible de ce rôle est VIDE, donc le corps
	 *  se réduit à l'étiquette et au contexte.
	 *  ⚠ `{ ...cible, contexte }` RESTE INTERDIT ICI, ET C'EST EXACTEMENT PARCE QU'IL
	 *  SERAIT INOFFENSIF : la charge étant vide, il ne fuiterait rien — et c'est
	 *  précisément ce qui le ferait généraliser aux cinq autres, où il met
	 *  `personnageId`, `indiceId` ou `champ` SUR LE FIL (KR-231). Littéral ÉCRIT, et un
	 *  témoin qui asserte le corps par `toEqual`, jamais par inclusion. */
	| { role: 'monde-distribution'; contexte: string }

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

	async function demanderRelations(
		dossier: Dossier,
		cible: CibleRelations,
		signal: AbortSignal | undefined,
	): Promise<ReponseRelations> {
		// LES QUATRE REFUS DE CONTEXTE PASSENT AVANT TOUT — `a-ecrire`,
		// `cible-a-ecrire`, `aucun-candidat`, `trop-long` : PREMIER RÔLE À LES UTILISER
		// TOUS LES QUATRE, et aucun motif neuf n'est créé pour autant.
		const contexte = assemblerRelations(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('personnage-relations')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		// La table des rangs ne sort JAMAIS de `brain/` : le validateur n'en reçoit que
		// les CLÉS, et la re-résolution se fait ici, sur la table RENDUE PAR
		// L'ASSEMBLEUR — jamais re-dérivée (KR-231).
		const rangsConnus: ReadonlySet<string> = new Set(contexte.rangs.keys())
		// LITTÉRAL ÉCRIT, JAMAIS `{ ...cible, contexte }` : la cible porte désormais un
		// `role` du même nom, et l'étalement mettrait `personnageId` sur le fil (KR-231).
		const corps: CorpsDemande = { role: 'personnage-relations', contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique(
			vers.url,
			vers.entetes,
			corps,
			(brut) => validerRelations(brut, rangsConnus, dossier),
			signal,
		)
		if (!issue.ok) return issue.echec

		// RE-RÉSOLUE CÔTÉ CLIENT, ÉLÉMENT PAR ÉLÉMENT : `personnageId` vient de l'ÉTAT
		// D'ÉCRAN et chaque `cibleId` d'un `Map.get` sur la table de CET assemblage-ci
		// (KR-231). `Map.get` est PARTIEL, et la branche `undefined` est INATTEIGNABLE —
		// `validerRelations` vient de constater l'appartenance de CHAQUE jeton à CETTE
		// table —, mais l'alternative est un `!` ou un `as`, c'est-à-dire l'endroit exact
		// où le compilateur cesse de protéger (KR-175). AUCUNE conversion numérique.
		const ajouts: LienResolu[] = []
		for (const rapport of issue.sortie.rapports) {
			const identifiant = contexte.rangs.get(rapport.envers)
			if (identifiant !== undefined) ajouts.push({ cibleId: identifiant, lien: rapport.nature })
		}
		// `ajouts` porte la SÉMANTIQUE D'ÉCRITURE — la feature les AJOUTE à `relations[]`,
		// elle ne les y substitue pas. `intensite` n'est PAS ici : le code la pose au site
		// d'écriture (`INTENSITE_INITIALE`), et `secret` est OMIS (KR-221).
		return { statut: 'propose', proposition: { personnageId: cible.personnageId, ajouts } }
	}

	async function demanderDistribution(
		dossier: Dossier,
		cible: CibleDistribution,
		signal: AbortSignal | undefined,
	): Promise<ReponseDistribution> {
		// LES DEUX REFUS DE CONTEXTE PASSENT AVANT TOUT — `a-ecrire` (SYNOPSIS d'abord,
		// TON ensuite : l'ordre décide ce que l'écran nomme) puis `trop-long`. ⚠ SEULEMENT
		// DEUX : `'cible-a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES pour ce
		// rôle — il n'a pas d'entité cible, et UN MONDE VIDE EST SON CAS NOMINAL.
		const contexte = assemblerDistribution(dossier, cible)
		if (!contexte.ok) return refuser(contexte)

		const vers = acheminement('monde-distribution')
		if (vers === null) return { statut: 'indisponible', raison: 'non-configure' }

		// LITTÉRAL ÉCRIT, JAMAIS `{ ...cible, contexte }` : inoffensif ici (la charge est
		// vide), et c'est justement pourquoi il serait généralisé aux cinq autres (KR-231).
		const corps: CorpsDemande = { role: 'monde-distribution', contexte: contexte.texte }
		const issue = await jusquAuRejeuUnique(
			vers.url,
			vers.entetes,
			corps,
			(brut) => validerDistribution(brut, dossier),
			signal,
		)
		if (!issue.ok) return issue.echec

		// RE-RÉSOLUE CÔTÉ CLIENT, ÉLÉMENT PAR ÉLÉMENT — et ⚠ IL N'Y A RIEN À RE-RÉSOUDRE
		// DEPUIS L'ÉTAT D'ÉCRAN : ce rôle ne porte aucun identifiant de cible, puisque LA
		// CIBLE EST LE DOSSIER. Ce que le code fait ici est un RENOMMAGE DE DESTINATION —
		// `place` → `fonction`, `poursuite` → `but.libelle` —, exactement le précédent
		// `intention` → `action` et `nature` → `lien`.
		// ⚠ AUCUN IDENTIFIANT N'EST FRAPPÉ ICI, ET C'EST LE TRAIT DE LA TRANCHE : le
		// brouillon est SANS IDENTITÉ jusqu'au clic d'acceptation, où l'écran appelle
		// `frapperIdentifiant('pnj')`. Un précalcul à cet endroit-ci compilerait
		// parfaitement — `tsc` tient la FORME, jamais le MOMENT — et c'est pourquoi le
		// site d'appel est tenu par un espion, côté feature.
		const ajouts: FicheBrouillon[] = issue.sortie.distribution.map((fiche) => ({
			fonction: fiche.place,
			but: { libelle: fiche.poursuite },
		}))
		// `ajouts` porte la SÉMANTIQUE D'ÉCRITURE — la feature les AJOUTE à
		// `monde.personnages[]`, une acceptation à la fois, jamais en bloc.
		return { statut: 'propose', proposition: { ajouts } }
	}

	/**
	 * L'IMPLÉMENTATION À SURCHARGES — six signatures publiques, un corps élargi,
	 * AUCUN `as`, ET PLUS AUCUN PARAMÈTRE `role`.
	 *
	 * LE DISPATCH SE FAIT SUR L'ÉTIQUETTE, jamais plus sur la forme. Ce que cela change,
	 * et c'est la raison d'être du lot : jusqu'à 3b le dernier `return` recevait
	 * `CibleRepliques` PAR ÉLIMINATION, donc une cinquième cible `{ personnageId }` y
	 * serait tombée PAR DÉFAUT — rôle annoncé A, validateur exécuté B, `tsc` vert. Avec
	 * l'étiquette, `CibleRelations` et `CibleRepliques` portent LA MÊME CHARGE et restent
	 * pourtant DISJOINTES.
	 *
	 * ⚠ LA GARDE `never` EST LA PREUVE D'EXHAUSTIVITÉ, et elle remplace une convention :
	 * un SEPTIÈME rôle ajouté à `RoleCopilote` sans branche ici NE COMPILE PAS. Les gardes
	 * `'x' in cible` de 3b étaient explicites, mais rien ne disait au compilateur qu'elles
	 * étaient complètes. ⚠ ELLE A SERVI : le SIXIÈME rôle l'a fait rougir aux deux sites
	 * de l'itération 4 — la promesse écrite à 3c était donc exécutable, et elle a été
	 * exécutée plutôt que crue.
	 *
	 * Chaque branche privée nomme SON rôle en littéral — segment de route et corps de
	 * demande sont donc exacts à la compilation, jamais recopiés d'un paramètre élargi.
	 */
	function demander(dossier: Dossier, cible: CibleCopilote, signal?: AbortSignal): Promise<ReponseCopilote>
	function demander(dossier: Dossier, cible: CibleIndice, signal?: AbortSignal): Promise<ReponseDetenteurs>
	function demander(dossier: Dossier, cible: CibleRepliques, signal?: AbortSignal): Promise<ReponseRepliques>
	function demander(dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>
	function demander(dossier: Dossier, cible: CibleRelations, signal?: AbortSignal): Promise<ReponseRelations>
	/** ⚠ LE SECOND DES DEUX SITES de la 6ᵉ surcharge — l'autre est sur l'interface
	 *  `CopiloteService` ci-dessus. */
	function demander(dossier: Dossier, cible: CibleDistribution, signal?: AbortSignal): Promise<ReponseDistribution>
	function demander(
		dossier: Dossier,
		cible: CibleCopilote | CibleIndice | CibleRepliques | CiblePlan | CibleRelations | CibleDistribution,
		signal?: AbortSignal,
	): Promise<
		ReponseCopilote | ReponseDetenteurs | ReponseRepliques | ReponsePlan | ReponseRelations | ReponseDistribution
	> {
		switch (cible.role) {
			case 'personnage-prose':
				return demanderProse(dossier, cible, signal)
			case 'indice-detenteurs':
				return demanderDetenteurs(dossier, cible, signal)
			case 'personnage-repliques':
				return demanderRepliques(dossier, cible, signal)
			case 'personnage-plan':
				return demanderPlan(dossier, cible, signal)
			case 'personnage-relations':
				return demanderRelations(dossier, cible, signal)
			case 'monde-distribution':
				return demanderDistribution(dossier, cible, signal)
			default: {
				// LA GARDE D'EXHAUSTIVITÉ : si l'union gagne un membre sans branche, cette
				// affectation ne compile plus. C'est une erreur de COMPILATION, jamais un
				// repli d'exécution — il n'y a rien à faire d'un rôle qu'on ne connaît pas.
				const _exhaustif: never = cible
				return _exhaustif
			}
		}
	}

	return {
		// Délégué plutôt que réécrit : `isConfigured()` EST déjà le prédicat « URL du
		// worker ET clé de synchronisation réglées », et deux écritures du même
		// prédicat divergeraient au premier réglage ajouté.
		estDisponible: () => settings.isConfigured(),
		demander,
	}
}
