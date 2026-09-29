import { MARQUEUR_A_ECRIRE } from './amorce'
import { resoudreJalons, type DeltaJournalise } from './evaluate'
import type { FaitsDeSession } from './faits'
// CYCLE DE TYPE SEUL, ET IL DOIT LE RESTER : `commandes.ts` type-importe
// `EtatSession` d'ici, et ce module-ci type-importe `CommandeId` de lui.
// `import type` est EFFACÉ à l'émission, donc il n'existe AUCUN cycle au
// runtime — mais transformer cette ligne en import de VALEUR (une constante, une
// fonction) en créerait un vrai, avec son module à moitié initialisé. Précédent
// mesuré au dépôt, dont la docstring porte le même avertissement :
// `src/brain/copilote/contexte/prose.ts:11-19`. Ne jamais transformer cette ligne.
import type { CommandeId } from './commandes'
import type { Dossier } from './types'

/**
 * L'ÉTAT DE SESSION — ce que la partie SAIT, et rien de ce que le dossier DIT.
 *
 * Ce module est l'adresse que `tourzero.ts` cite sans la connaître : « H6 NE
 * SPÉCIFIE AUCUN ÉTAT DE SESSION » y renvoie désormais ICI. Le document décrit
 * une aventure possible ; cette structure décrit UNE partie en cours. Les deux ne
 * se recopient jamais l'une l'autre — aucune copie gelée du dossier n'entre dans
 * la session, le lien est `dossier_id` et rien d'autre (seconde source de vérité,
 * KR-013).
 *
 * RÈGLE D'ADMISSION (KR-249) : un champ n'entre que si un chemin de code de la
 * feature l'ÉCRIT et un autre le LIT. Sinon, seule la CLÉ RACINE est réservée, à
 * `null`, avec son propriétaire nommé — et une clé non racine ne se réserve pas
 * du tout : un commentaire de propriétaire suffit, puisque KR-251 rend son ajout
 * futur optionnel à vie.
 *
 * TOUT CHAMP AJOUTÉ APRÈS CE LOT EST OPTIONNEL À VIE (KR-251) : `schema: 1` n'a
 * aucun chemin de migration, et la session est PERSISTÉE dès l'itération 1 — une
 * session écrite aujourd'hui doit rester lisible demain sans convertisseur.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * La version de la FORME DE SESSION, distincte de `DOSSIER_SCHEMA` : deux
 * documents, deux durées de vie. Elle ne monte pas en schéma 1 — KR-251 fait que
 * rien n'a jamais besoin de la faire monter.
 */
export const SCHEMA_SESSION = 1

/**
 * QUI PARLE dans le journal. Registre CLOS : `'ia'` n'y entre pas, la n° 9
 * n'émettant aucune ligne de modèle. La source est la DONNÉE — un troisième champ
 * (`est_verbatim`, `style`) qui redirait ce que `role` dit déjà serait KR-013.
 */
export type RoleJournal = 'joueur' | 'moteur'

/** Une ligne du journal de partie — un CONSTAT, jamais une entrée du rejeu (KR-248). */
export interface EntreeJournal {
	readonly tour: number
	readonly role: RoleJournal
	readonly texte: string
	/**
	 * LA CAUSE, clé du registre CLOS des commandes — jamais de la prose, jamais une
	 * chaîne libre (KR-247/248). Optionnel À VIE (KR-251).
	 *
	 * PRÉSENT SUR L'ENTRÉE QUI PORTE L'EFFET (`role: 'moteur'`), ABSENT SUR CELLE
	 * QUI PORTE LA DEMANDE (`role: 'joueur'`), dont le `texte` contient déjà le
	 * verbe en clair — l'y stocker serait un dérivable stocké (KR-013).
	 * Invariant : `journal.every(e => e.origine === undefined || e.role === 'moteur')`.
	 *
	 * ÉCRIT par `commandes.ts`, LU par `JournalRow` — les deux chemins de code
	 * existent dans CETTE itération, ce qui est la condition d'admission elle-même
	 * (KR-249) et non une commodité.
	 */
	readonly origine?: CommandeId
	/**
	 * LES EFFETS DE RÈGLE QUE CETTE ENTRÉE PORTE — le demandé ET l'observé
	 * (KR-247). Optionnel À VIE (KR-251), et `undefined` JAMAIS `[]` : une entrée
	 * qui n'en porte pas n'en a pas demandé, ce qui n'est pas la même chose qu'en
	 * avoir demandé zéro. Une session écrite par l'itération 2, relue telle quelle,
	 * reste légale.
	 *
	 * ÉCRIT par `commandes.ts` (une entrée par jalon atteint), LU par `JournalRow`
	 * qui en rend une pastille par élément, DANS L'ORDRE et sans filtrage — les deux
	 * chemins de code existent dans CETTE itération, ce qui est la condition
	 * d'admission elle-même (KR-249).
	 */
	readonly deltas?: readonly DeltaJournalise[]
	/**
	 * LE RÉCIT DU PAS — la prose que le narrateur (n° 10 `moteur-interprete`, it2) a
	 * rendue pour la commande de CE pas, validée, posée APRÈS que l'état a été écrit
	 * et persisté. Registre JOUEUR, affiché tel quel : ce n'est PAS une troisième
	 * prose d'AUTEUR émise verbatim, c'est une sortie de modèle déjà passée par son
	 * validateur.
	 *
	 * OPTIONNEL À VIE (KR-160/191/251), et JAMAIS `string | null` : une entrée écrite
	 * avant ce lot ne le porte pas, et un récit indisponible n'en pose AUCUN —
	 * `undefined` est un état LÉGAL, jamais un trou à combler par un texte neutre
	 * écrit comme de la fiction.
	 *
	 * PORTÉ PAR L'ENTRÉE QUI PORTE `origine` pour ce pas — au plus UN récit par pas,
	 * jamais une entrée neuve (`RoleJournal` reste clos, et une ligne sans `texte`
	 * propre n'a pas de sens). Invariant :
	 * `journal.every(e => e.recit === undefined || e.origine !== undefined)`.
	 *
	 * ÉCRIT par `consignerRecit` (`recit.ts`), SEULE porte ; LU par l'écran de partie
	 * (lot `feature` de la même itération), qui l'affiche DÉRIVÉ du journal et jamais
	 * d'un état miroir — les deux chemins existent dans CETTE itération (KR-249).
	 *
	 * AUDIENCE `'moteur'` en it2 (`sessionDestinations.ts`) : il n'entre dans AUCUN
	 * contexte de modèle, le narrateur étant sans état. La bascule vers `'ia'` est une
	 * politique de rétention, propriétaire it3 (la mémoire).
	 *
	 * HORS DU REJEU (KR-248) : une sortie de modèle n'est jamais une entrée du moteur,
	 * et rejouer les commandes d'une partie ne le reproduit pas.
	 */
	readonly recit?: string
}

/**
 * `EtatMonde` ET `EtatPnj` VIVENT DANS `faits.ts` DEPUIS L'ITÉRATION 3, et ce
 * module les RÉ-EXPORTE sous leurs noms historiques : ce sont le MÊME type, jamais
 * deux qui se ressemblent. Le corps a été DÉPLACÉ, pas recopié — motif écrit là-bas
 * (deux registres frères doivent pouvoir le nommer sans dépendre de ce module-ci,
 * qui type-importe déjà `commandes.ts`).
 */
export type { FaitsDeSession as EtatMonde, EtatPnj } from './faits'

/**
 * LA SESSION ENTIÈRE — huit clés racines, exhaustives par compilation pour la
 * table d'audience de `sessionDestinations.ts`.
 *
 * CE CONTRAT GÈLE L'ÉCRITURE, ET LA LECTURE N'APPARTIENT NI À L'ITÉRATION 1 NI À
 * L'ITÉRATION 2 : celle-ci livre le PORT (`MagasinDeSession`, `ecrire` seule) et
 * REPORTE la reprise — `lire`, `effacer` et `validerSession` entrent avec elle.
 * Trois points, écrits ici pour l'itération de la reprise, qui les tranchera :
 *  1. `useSessionPersistee` écrit AU MONTAGE, donc ouvrir un aperçu ÉCRASE la
 *     session persistée du dossier avant toute question. La reprise doit décider
 *     AVANT d'écrire, pas après ;
 *  2. `dossier_maj` existe pour que cette décision soit possible — voir son champ ;
 *  3. AUCUN `validerSession` n'existe encore. Le magasin est une frontière de
 *     confiance (KR-116, précédent `DossierService.get` qui revalide à chaque
 *     lecture), et l'évaluateur bivalent de la n° 9 it3 LÈVE sur une entrée non
 *     reconnue (KR-238) : la première itération qui RELIT une session doit la
 *     faire passer par un validateur, jamais par un `as EtatSession`.
 *
 * Deux clés que l'on ne trouvera PAS ici, et leur propriétaire :
 *  · `heros`, `combat` — n° 11, composés dans `src/player/types.ts` ;
 *  · une copie du dossier — jamais : le gel est PAR RÉFÉRENCE (`dossier_id`).
 *
 * `attente` N'EST PLUS DANS CETTE LISTE depuis le lot `contrat` de la n° 10
 * (`moteur-interprete`) : c'est la clé RÉELLE, ci-dessous, qui la remplace —
 * corrigé EN COMMENTAIRE, jamais en silence (KR-195/196), pour que personne ne
 * la cherche encore ici en la croyant réservée.
 */
export interface EtatSession {
	readonly schema: typeof SCHEMA_SESSION
	/** La RÉFÉRENCE au dossier joué — jamais une copie de son contenu (KR-013). */
	readonly dossier_id: string
	/**
	 * L'ESTAMPILLE DU DOSSIER AU MOMENT OÙ LA PARTIE S'EST OUVERTE — `dossier.updatedAt`,
	 * recopié tel quel. SECONDE exemption nommée à la règle d'admission (KR-249),
	 * et exactement le même argument que `graine_alea` ci-dessous : elle ne se
	 * RÉTRO-AJOUTE pas. Le dossier est gelé PAR RÉFÉRENCE à l'ouverture, et l'auteur
	 * l'édite entre deux aperçus ; une session écrite sans estampille ne saurait
	 * JAMAIS que le dossier a bougé sous elle, et KR-251 rendrait le champ ajouté
	 * plus tard `optionnel à vie` — donc « session sans estampille » resterait un
	 * état légal pour toujours. Aucun code ne la lit avant l'itération de la reprise, qui
	 * refusera de reprendre une session dont l'estampille ne correspond plus.
	 * Ce n'est PAS un champ dérivable (KR-013) : `dossier.updatedAt` est la valeur
	 * D'AUJOURD'HUI, celle-ci est celle de L'OUVERTURE — deux instants, deux faits.
	 *
	 * TROIS CLAUSES POUR L'ITÉRATION DE LA REPRISE, écrites ici parce qu'elles coûtent trois lignes
	 * aujourd'hui et sont irréversibles plus tard :
	 *  1. On compare à `DossierService.get(dossier_id)?.updatedAt`, et « dossier
	 *     introuvable » est une issue DISTINCTE de « estampille périmée » — deux
	 *     causes, deux chemins, comme le refus `dossier_introuvable` déjà à l'écran.
	 *  2. ON NE RÉ-ESTAMPILLE JAMAIS EN PLACE. Le mode de panne le plus probable
	 *     de cette itération-là est de « réparer » la reprise en rafraîchissant ce champ sur une
	 *     session existante : ce serait blanchir une session périmée. **Seul
	 *     `ouvrirSession` écrit ce champ.**
	 *  3. La réconciliation cloud est un écrivain LÉGITIME d'`updatedAt` (adoption
	 *     d'une copie distante plus récente) : une session ouverte avant l'adoption
	 *     DOIT être vue périmée. Ce n'est pas un faux positif, c'est le cas d'usage.
	 *
	 * La source est comparable, et c'est mesuré : `DossierService.update` frappe
	 * `updatedAt` lui-même, aucun appelant ne peut l'antidater.
	 */
	readonly dossier_maj: string
	/**
	 * L'entropie de la partie, REQUISE et INJECTÉE. Écrite dès l'itération 1 bien
	 * qu'aucun code ne la lise avant la n° 11, et c'est l'unique exemption nommée à
	 * la règle d'admission (KR-249) : une graine ne se RÉTRO-AJOUTE pas — une
	 * session née ici et reprise sous la n° 11 devrait en inventer une en cours de
	 * partie, et la promesse de rejeu ne tiendrait jamais pour elle.
	 */
	readonly graine_alea: number
	/**
	 * `climat_actif` : propriétaire n° 14 (KR-207), NON DÉCLARÉ — clé non racine,
	 * hors de la réserve de KR-249, optionnelle à vie le jour venu (KR-251).
	 */
	readonly horloge: { readonly tour: number }
	/** `FaitsDeSession` EST `EtatMonde` — même type, deux noms, un seul corps (`faits.ts`). */
	readonly monde: FaitsDeSession
	readonly journal: readonly EntreeJournal[]
	/**
	 * CLÉ RACINE RÉSERVÉE, propriétaire n° 10 — typée `null` : la politique de
	 * mémoire à trois niveaux lui appartient, et aucun champ `memoire.*` n'est
	 * représentable avant elle.
	 */
	readonly memoire: null
	/**
	 * LA CLARIFICATION EN COURS — posée par `apresInterpretation`
	 * (`brain/dossier/interprete.ts`, n° 10) quand R1 ne peut pas trancher seul,
	 * retirée par elle dès la réponse suivante, quelle qu'elle soit.
	 *
	 * OPTIONNELLE À VIE (KR-251), **JAMAIS** `AttenteClarification | null` : une
	 * racine `attente: null` rendrait indistinguables « aucune attente » et
	 * « variante non supportée » — c'est l'argument que CE module tenait déjà
	 * avant que cette clé n'existe (voir l'historique ci-dessus), et une session
	 * écrite avant ce lot n'a simplement pas la clé, ce qui est un état LÉGAL.
	 *
	 * UN SEUL MEMBRE aujourd'hui, ET C'EST DÉLIBÉRÉ : ouvrir une union avant
	 * qu'un second producteur de variante n'existe (KR-263/266) coûterait un nom
	 * générique sur un type qui n'aurait qu'un habitant — le jour où une seconde
	 * variante d'attente entre, ELLE nommera l'union.
	 */
	readonly attente?: AttenteClarification
}

/**
 * LA CLARIFICATION QUE R1 A POSÉE — jamais franchie par le réseau telle quelle
 * (c'est `SortieInterprete.clarification.question` qui la produit, côté
 * `brain/dossier/interprete.ts`).
 *
 * `question` et `saisie` sont d'audience `'ia'` dans `sessionDestinations.ts` :
 * sans elles injectées au tour suivant, le modèle répondrait « à l'aveugle » à
 * une saisie qui répond à une question qu'il ne peut plus lire (KR-232 sous
 * condition d'état, précédent exact `monde.indices[].verite`).
 */
export interface AttenteClarification {
	readonly type: 'clarification'
	/** La question VERBATIM que R1 a posée — prose validée, ≤ 120 caractères. */
	readonly question: string
	/** La saisie NORMALISÉE qui a déclenché cette question — celle qui a été
	 *  injectée dans le contexte, pas celle que le joueur a tapée au clavier
	 *  (`trim` + espaces multiples collapsés, précédent `assemblerInterprete`). */
	readonly saisie: string
}

/**
 * LE PORT DE STOCKAGE DE SESSION — TYPE PUR, donc extractible avec `src/player/`.
 *
 * SON MOTIF A CHANGÉ, ET C'EST ÉCRIT POUR QUE PERSONNE N'HÉRITE DU PÉRIMÉ : il ne
 * se justifie PAS par l'extractibilité (dont la prémisse n'est pas armée —
 * `src/player/` ne reçoit aucun fichier en it2 non plus), mais par la FRONTIÈRE
 * magasin BRUT / décorateur de synchronisation, qu'aucune feature ne peut
 * franchir autrement : `useBrain().persistence` EST le décorateur, et toute clé
 * non-livre qui y passe part dans la file de synchronisation. La session d'une
 * partie est un état PAR APPAREIL, au même titre que les préférences d'interface
 * (KR-022), la librairie de monstres et les réglages du worker.
 *
 * SA SUBSTITUABILITÉ EST VÉRIFIABLE AUJOURD'HUI, et c'est ce qui le distingue
 * d'une abstraction spéculative : `MagasinDeSession.test.ts` construit un `Brain`
 * dont le transport ne résout jamais, écrit une session, et constate que la file
 * reste à zéro — PUIS qu'une écriture de dossier la fait monter à un, sans quoi
 * l'assertion serait vraie par construction (BUG-084).
 */
export interface MagasinDeSession {
	/** Range la session sous la clé du dossier joué. Synchrone : l'écriture est résolue au retour (KR-004). */
	ecrire(dossierId: string, session: EtatSession): void
	// `lire` / `effacer` : PAS ENCORE. Ajouter une méthode à une interface est
	// ADDITIF ; contrairement à un champ persisté (KR-251), elle ne se paie pas
	// d'être ajoutée plus tard. Elles entrent avec la REPRISE et son
	// `validerSession` (KR-116) — deux méthodes sans appelant seraient KR-109.
}

/**
 * Registre CLOS des refus d'ouverture. Tout second membre nomme LA DONNÉE qu'il
 * lit ; un refus qui n'en nomme aucune est un refus qu'on ne saura pas lever.
 */
export type RefusOuverture = 'ouverture_a_ecrire'

/** Union DISCRIMINÉE — un appelant qui la rétrécit totalement n'a aucun bras muet. */
export type ResultatOuverture =
	| { readonly ok: true; readonly session: EtatSession }
	| { readonly ok: false; readonly refus: RefusOuverture }

/**
 * OUVRIR UNE PARTIE — PURE, synchrone, et TOTALE **sur un dossier accepté par
 * `validateDossier`**. Aucune persistance, aucune horloge système, aucun tirage :
 * `graine_alea` est REQUISE et INJECTÉE, jamais un `Math.random()` ici
 * (rejouabilité, KR-242).
 *
 * ⚠ LA TOTALITÉ EST DÉSORMAIS CONDITIONNELLE, et c'est écrit plutôt que découvert :
 * depuis l'itération 3, cette fonction résout les `declencheur_expr` des jalons, et
 * `evaluerExpr` LÈVE sur une entrée non reconnue (KR-238). Aucun `catch` ne
 * l'entoure — il rouvrirait le faux positif que ce choix ferme. La parade est la
 * porte `jouable` des contrôles, vérifiée AU MONTAGE du shell (KR-239).
 *
 * LE REFUS SUR LE MARQUEUR EST PLUS GROSSIER QUE `controles.ts`, JAMAIS PLUS FIN :
 * il teste UN champ — `charpente.depart.texte_ouverture_joueur` — et ne
 * réimplémente ni les quatre proses d'amorce, ni la classification
 * bloquant/alerte. Une règle, DEUX gardiens, et le second n'est pas un doublon :
 * `src/player/` est extrait SANS l'éditeur, donc sans `controlerDossier` ni CTA ;
 * sans ce refus, la surface extraite émettrait le marqueur VERBATIM à un vrai
 * joueur, sur l'un des deux seuls champs émis mot pour mot. La porte de l'éditeur
 * est ergonomique, ce refus-ci est une correction.
 *
 * `charpente.fins[].texte` encore marqué NE bloque PAS l'ouverture : il ne bloque
 * que l'atteinte de SA fin (KR-244).
 *
 * VALEURS À L'OUVERTURE, et l'une d'elles est une décision : `lieux_visites` vaut
 * `[charpente.depart.lieu_id]` et non `[]`. Un héros dans un lieu qu'il n'a jamais
 * visité est un état INCOHÉRENT, que l'évaluateur bivalent d'it3 rapporterait
 * fidèlement ; et l'ouverture DÉCRIT ce lieu verbatim, que `[]` ferait re-décrire
 * comme une découverte au passage suivant.
 *
 * LES JALONS SONT RÉSOLUS AVANT LA PREMIÈRE ACTION — décision (i) de H6
 * (`tourzero.ts`), tranchée à l'itération 1 et LIVRÉE ici : un jalon dont la
 * condition est déjà vraie du seul fait du lieu de départ est atteint à
 * l'ouverture, avec ses effets. C'est le MÊME corps que celui d'après chaque
 * commande (`resoudreJalons`), et la conséquence est mesurable au dépôt —
 * `dossier-minimal.json` ouvre avec `indice.sceau-brise` connu.
 *
 * ⚠ AUCUNE ENTRÉE DE JOURNAL N'EST ÉCRITE À L'OUVERTURE : le journal démarre vide
 * (retenu à l'itération 1, inchangé). La passe rend ses `atteints`, et cet
 * appelant-ci ne les journalise pas — il n'y a pas de tour zéro à raconter.
 */
export function ouvrirSession(dossier: Dossier, options: { graine_alea: number }): ResultatOuverture {
	if (dossier.charpente.depart.texte_ouverture_joueur.includes(MARQUEUR_A_ECRIRE)) {
		return { ok: false, refus: 'ouverture_a_ecrire' }
	}

	const depart = dossier.charpente.depart.lieu_id

	const ouverture = resoudreJalons(dossier, {
		lieu_courant: depart,
		lieux_visites: [depart],
		objets_possedes: [],
		indices_connus: [],
		jalons_atteints: [],
		evenements_consommes: [],
		pnj: {},
	})

	return {
		ok: true,
		session: {
			schema: SCHEMA_SESSION,
			dossier_id: dossier.id,
			dossier_maj: dossier.updatedAt,
			graine_alea: options.graine_alea,
			horloge: { tour: 0 },
			monde: ouverture.faits,
			journal: [],
			memoire: null,
		},
	}
}
