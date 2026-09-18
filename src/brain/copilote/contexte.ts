/**
 * L'ASSEMBLEUR DE CONTEXTE — ce que le modèle VOIT, et rien d'autre.
 *
 * NON ré-exporté par `brain/index.ts` : aucun consommateur hors de `brain/`. Une
 * feature n'a aucune raison de composer un contexte elle-même — elle demande,
 * `CopiloteService` assemble.
 *
 * `DESTINATION_DES_CHAMPS` (`../dossier/destinations`) est importé en chemin
 * profond par le TEST de confinement, jamais ici : la table est une GARDE, jamais
 * un PILOTE (KR-232). `CHAMPS_INJECTES` est écrit à la main, champ par champ, et
 * c'est le test qui prouve que chacun de ses chemins a bien la destination `ia`.
 * L'inverse — dériver la liste de la table — injecterait automatiquement tout
 * champ `ia` ajouté plus tard au schéma, ce qui est exactement la panne que
 * l'asymétrie du regret interdit.
 */
import { MARQUEUR_A_ECRIRE } from '../dossier/amorce'
import type { CheminLibelle } from '../dossier/libelles'
import type { Dossier } from '../dossier/types'
// CYCLE DE TYPE SEUL, et il doit le rester : `../CopiloteService` importe
// `assemblerProse` et `assemblerDetenteurs` de ce module-ci, et ce module-ci
// importe leurs CIBLES de lui. `import type` est EFFACÉ à l'émission, donc il
// n'existe aucun cycle au
// runtime — mais transformer cette ligne en import de VALEUR (une constante, une
// fonction) en créerait un vrai, avec son module à moitié initialisé. Si un jour
// une valeur doit circuler dans ce sens, elle descend dans `./types` — qui, lui,
// n'importe rien.
import type { CibleCopilote, CibleIndice, CibleRepliques } from '../CopiloteService'
import type { RangInjecte, RoleCopilote } from './types'

/** Les chemins de feuille injectés PAR RÔLE, tous d'audience `'ia'`, chemins à
 *  indices effacés — MÊME vocabulaire que `DESTINATION_DES_CHAMPS`. Les entrées
 *  de personnage sont RESTREINTES aux entités désignées ; celles d'indice, à
 *  l'indice CIBLE. Listes FIXES : un ouvrier n'en ajoute pas une. */
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.parler[]',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
	/** NEUF chemins. `monde.indices[].verite` y entre par la CONDITION D'ÉTAT
	 *  ré-écrite à ses deux sites (`dossier/types.ts` + `dossier/destinations.ts`) :
	 *  un rôle le nomme explicitement ICI, et le schéma de sortie de ce rôle ne peut
	 *  porter aucune prose. Ce n'est PAS une dérogation d'audience — le champ est
	 *  DÉJÀ `ia`. Ne pas confondre les deux : le confondre ferait croire que la
	 *  soupape assertée vide ci-dessous a bougé.
	 *  AUCUN `nom` (KR-195) et aucune `certitude` : le modèle voit des jetons. */
	'indice-detenteurs': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'monde.indices[].verite',
		'monde.indices[].formulation_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].plan_actions[].action',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
	],
	/**
	 * DIX chemins, et le rôle est STRICTEMENT PLUS ÉTROIT que `personnage-prose`.
	 * TROIS retraits, tous délibérés :
	 *
	 *  • `canon.mj.synopsis_mj` — présent chez `personnage-prose`, ABSENT ici. Ce
	 *    qu'il apporte à l'écriture d'une voix : presque rien. Ce qu'il risque : une
	 *    réplique qui le PARAPHRASE met du savoir MJ dans une phrase que le Temps 2
	 *    donnera au rôle ACTEUR et fera PRONONCER — alors qu'une note de fiche est
	 *    LUE par un narrateur. ASYMÉTRIE DU REGRET (KR-232).
	 *  • `caractere.cede_si` — prédicat conditionné par RÔLE ; un rôle de rédaction
	 *    n'est ni narrateur, ni acteur du porteur, ni arbitre : le prédicat n'a pas
	 *    de sujet, il est INAPPLICABLE, et l'inapplicable ne s'injecte pas.
	 *    PROPOSER n'est pas INJECTER (§ 8, TL3a-14).
	 *  • `caractere.curseurs.*` — jamais, veto non contesté.
	 *
	 * ET LA CIBLE ELLE-MÊME, `caractere.parler[]`, EST EXCLUE **PAR ABSENCE** de
	 * cette liste blanche — jamais par un saut à l'exécution. Un chemin listé puis
	 * systématiquement sauté serait une LIGNE MORTE (KR-235) qu'un bogue de cible
	 * pourrait ré-ouvrir ; une absence, elle, ne se ré-ouvre pas.
	 *
	 * `caractere.jamais` est LA LIMITE : elle borne ce que le personnage peut dire,
	 * donc elle a sa place dans une demande de répliques.
	 * `plan_actions[].action` n'est PAS tronqué ici — il n'y a qu'UNE fiche, là où le
	 * rôle détenteurs en numérote jusqu'à `CANDIDATS_MAX`.
	 */
	'personnage-repliques': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.partage.accroche_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].apparence',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
		'monde.personnages[].but.pourquoi',
		'monde.personnages[].caractere.jamais',
		'monde.personnages[].plan_actions[].action',
	],
}

/** La soupape. VIDE, et un test l'asserte vide (KR-232). Zéro dérogation. */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

/**
 * Les champs SANS lesquels la demande n'a pas de sens — refus AVANT tout appel.
 * UNE entrée. Typé `CheminLibelle` et non `string` : c'est ce qui rend « tout
 * champ requis a un libellé d'écran » vrai À LA COMPILATION, donc le texte de
 * refus n'a aucune branche de repli.
 * PAS de disjonction « parmi » : une union `{requis|parmi}` sans instance `parmi`
 * est une abstraction à un seul appelant (KR-109).
 */
export const PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]> = {
	'personnage-prose': ['canon.ton'],
	/** Le rôle détenteurs a le MÊME unique requis. Ce qu'il exige EN PLUS — la
	 *  `verite` de l'indice cible — ne passe PAS par cette table : le champ n'a
	 *  aucune entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8), et
	 *  élargir cette table à `readonly string[]` détruirait la garantie de
	 *  compilation « tout champ requis a un libellé d'écran ». Son refus est donc un
	 *  motif NEUF ET SANS CHARGE, `'cible-a-ecrire'`, dont le texte d'écran nomme le
	 *  champ EN PROSE, côté feature. */
	'indice-detenteurs': ['canon.ton'],
	/** Le rôle répliques a le MÊME unique requis. Ce qu'il exige EN PLUS — une
	 *  IDENTITÉ écrite pour le personnage cible — ne passe pas non plus par cette
	 *  table : ce n'est pas UN champ mais une DISJONCTION sur les sept chemins de
	 *  fiche, donc rien qu'un `CheminLibelle` puisse nommer. Son refus est le même
	 *  motif SANS CHARGE, `'cible-a-ecrire'`. */
	'personnage-repliques': ['canon.ton'],
}

/**
 * Les PRÉFIXES des chemins RESTREINTS à une entité désignée. Écrits UNE fois : les
 * chemins ci-dessus se lisent alors en familles — ce qui vient du canon (global),
 * ce qui vient de l'indice CIBLE, ce qui vient d'un CANDIDAT — sans qu'aucune
 * chirurgie de chaîne ne soit répartie dans le corps des assembleurs.
 */
const PREFIXE_PERSONNAGE = 'monde.personnages[].'
const PREFIXE_INDICE = 'monde.indices[].'

/** LE CHEMIN SANS LEQUEL LA DEMANDE DE DÉTENTEURS N'A PAS DE SENS. Il n'est pas
 *  re-listé : un test asserte son appartenance à `CHAMPS_INJECTES`. Nommé plutôt
 *  qu'écrit au site du refus, parce qu'un chemin en dur au milieu d'un corps de
 *  fonction est exactement ce que `CHAMPS_INJECTES` existe pour éviter. */
const CHEMIN_VERITE_CIBLE = 'monde.indices[].verite'

/** LE SEUL chemin de liste TRONQUÉ, et à son PREMIER élément. Un plan d'actions
 *  entier par candidat, à K saturé, ferait exploser le contexte pour une valeur
 *  discriminante qui décroît à chaque étape : ce qui dit « qui pourrait savoir
 *  cela » est la PREMIÈRE intention du personnage, pas la cinquième. */
const CHEMIN_TRONQUE = 'monde.personnages[].plan_actions[].action'

/** LA VARIABLE LIBRE de la borne de contexte — combien de candidats au plus sont
 *  numérotés et injectés. Le budget ci-dessous en est la DÉRIVÉE. La règle qui
 *  empêche la dérive est écrite : SI LA MESURE DE `M` DÉPLAÎT, ON BAISSE K — ON NE
 *  MONTE JAMAIS LE BUDGET. Elle borne l'ENTRÉE, là où `PROPOSITIONS_MAX`
 *  (`schemaSortie.ts`) borne la SORTIE. */
export const CANDIDATS_MAX = 8

/**
 * LA BORNE DE REFUS DU CONTEXTE, EN CARACTÈRES (`String.length`, UTF-16), mesurée
 * sur le contexte RÉELLEMENT assemblé, APRÈS filtrage d'audience et APRÈS retrait
 * des champs marqués : `budget = ceil(M × 3 / 1000) × 1000`.
 *
 * PAR RÔLE, et c'est le point dur de l'itération 2 : un scalaire partagé ferait
 * desserrer la garde du rôle ÉTROIT par la mesure du rôle LARGE, sans un seul test
 * rouge (KR-235). Chaque entrée est RE-DÉRIVÉE par la même formule sur une mesure
 * de CE rôle-là.
 *
 * Le facteur 3 est une DÉCISION DATÉE du comité (2026-09-17) — la fixture est une
 * épreuve de validateur, pas le dossier d'un auteur ; l'arrondi au millier EST la
 * marge, on n'en ajoute pas une seconde.
 *
 * CE N'EST PAS UN CLIQUET : c'est une borne de refus, RE-DÉRIVÉE par la même
 * formule sur une NOUVELLE mesure à chaque itération qui élargit `CHAMPS_INJECTES`.
 * On ne la desserre jamais « parce que ça a coincé une fois » — et si la mesure
 * déplaît, c'est `CANDIDATS_MAX` qui baisse.
 */
export const BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number> = {
	// MESURÉ le 2026-09-17 à l'itération 1, sur l'entité de mesure composée par
	// `contexte.test.ts` (le personnage le mieux rempli de `dossier-reference.json`,
	// greffé du `but` du seul porteur du dossier) : `fonction` 1763 · `apparence`
	// 1756 · `description_joueur` 1783 caractères, le champ cible étant retiré de sa
	// propre demande. M = 1783 ⇒ ceil(1783 × 3 / 1000) × 1000 = 6000.
	// INCHANGÉ à l'itération 2, NON re-mesuré : les douze chemins n'ont pas bougé.
	'personnage-prose': 6000,
	// MESURÉ le 2026-09-17 à l'itération 2, `CANDIDATS_MAX` SATURÉ, sur un dossier
	// COMPOSÉ PAR `contexte.test.ts` depuis les valeurs réelles de
	// `dossier-reference.json` — la fixture n'appartient à aucun lot, et aucun de ses
	// indices ne porte à la fois une `verite` et huit candidats complets. Le protocole
	// est celui de l'it1 : on asserte d'abord que LES NEUF chemins résolvent non
	// vides, sans quoi le nombre relevé est un PLANCHER et non une mesure.
	// M = 5361 ⇒ ceil(5361 × 3 / 1000) × 1000 = 17000.
	'indice-detenteurs': 17_000,
	// MESURÉ le 2026-09-18 à l'itération 3a, sur l'entité de mesure RE-DÉRIVÉE par
	// `contexte.test.ts` pour CE rôle-ci (le personnage le mieux rempli sur les SEPT
	// chemins de fiche de ce rôle, greffé du `but` du seul porteur du dossier — la
	// fixture n'appartient à aucun lot). Protocole de l'it1 : on asserte d'abord que
	// LES DIX chemins résolvent non vides, sans quoi le nombre relevé est un PLANCHER
	// et non une mesure.
	// M = 1200 ⇒ ceil(1200 × 3 / 1000) × 1000 = 4000.
	// C'est le rôle le plus ÉTROIT des trois, et c'est attendu : dix chemins, UNE
	// fiche, aucun bloc numéroté, `synopsis_mj` retiré.
	'personnage-repliques': 4000,
}

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » ne pointe pas un champ, il pointe la
	 *  fiche. Le champ injecté le plus long peut être `but.libelle` ou
	 *  `plan_actions[].action`, dont les libellés vivent dans des blocs que le
	 *  registre à quatre entrées ne porte pas — et n'a aucune raison de porter. */
	| { motif: 'trop-long' }
	/** NEUF — l'entité CIBLE n'a pas le contenu sans lequel la demande n'a pas de
	 *  sens (la `verite` de l'indice). AUCUNE charge, et c'est délibéré : le champ
	 *  n'a pas d'entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8) — le
	 *  texte d'écran le nomme EN PROSE, côté feature. */
	| { motif: 'cible-a-ecrire' }
	/** NEUF — aucun candidat numérotable : tous les personnages détiennent déjà cet
	 *  indice, ou aucun n'a la moindre ligne injectable. Refus AVANT tout `fetch` :
	 *  il n'y a rien à demander. Aucune charge, comme `trop-long`. */
	| { motif: 'aucun-candidat' }

export type ContexteProse =
	/** `texte` est DÉTERMINISTE : ni date, ni identifiant, ni aléa — c'est ce qui
	 *  rend « deux lancers ⇒ deux corps identiques » vrai par égalité stricte.
	 *  `entitesInjectees` vaut exactement une entrée quand la cible résout ; c'est
	 *  ce que le test de confinement compare. */
	{ ok: true; texte: string; entitesInjectees: readonly string[] } | ({ ok: false } & MotifRefusContexte)

/** La branche de SUCCÈS, NOMMÉE — un objet anonyme de cinq lignes dans une union
 *  se rend par Prettier avec une indentation mixte qu'ESLint refuse, et le rendre
 *  lisible ne vaut pas un `eslint-disable`. Non ré-exportée : `ContexteDetenteurs`
 *  lui-même ne franchit jamais `brain/copilote/`. */
interface ContexteDetenteursRendu {
	ok: true
	texte: string
	/** TOUTES les entités injectées — l'audit de confinement. Contient l'indice
	 *  CIBLE, qui n'a PAS de rang. UNE traversée, DEUX projections : chaque candidat
	 *  retenu pousse son identifiant ici ET son rang dans `rangs` dans la MÊME
	 *  itération de boucle — ce ne sont pas deux listes à tenir en phase, c'est un
	 *  sous-produit (KR-117).
	 *  INVARIANT ASSERTÉ PAR ÉGALITÉ, jamais par inclusion :
	 *  `entitesInjectees === [cible.indiceId, ...rangs.values()]`, ordre compris.
	 *  Un `⊆` resterait vert sur une entité injectée qu'on aurait oublié d'auditer —
	 *  c'est précisément le trou que cet audit existe pour fermer. */
	entitesInjectees: readonly string[]
	/** LES SEULES entités DÉSIGNABLES, jeton → identifiant. Le numéro écrit dans
	 *  `texte` et la clé de cette table sortent de la MÊME variable.
	 *  NE SORT JAMAIS de `brain/copilote/` — KR-231 tenu par la PORTÉE, pas par une
	 *  convention. */
	rangs: ReadonlyMap<RangInjecte, string>
}

export type ContexteDetenteurs = ContexteDetenteursRendu | ({ ok: false } & MotifRefusContexte)

function estObjet(valeur: unknown): valeur is Record<string, unknown> {
	return typeof valeur === 'object' && valeur !== null && !Array.isArray(valeur)
}

/**
 * Les TEXTES d'un chemin de feuille, indices compris — un chemin peut en rendre
 * zéro (champ optionnel absent), un (`canon.ton`) ou plusieurs
 * (`caractere.parler[]`, `plan_actions[].action`). Total : aucune forme n'est
 * supposée, rien ne lève (KR-116 — le dossier vient du disque).
 *
 * `hasOwnProperty.call` et non un simple index : tout objet littéral hérite
 * d'`Object.prototype`, et `…['toString']` rendrait une FONCTION (KR-175).
 */
function textesDuChemin(racine: unknown, segments: readonly string[]): string[] {
	if (segments.length === 0) return typeof racine === 'string' ? [racine] : []
	const [tete, ...reste] = segments
	const estListe = tete.endsWith('[]')
	const cle = estListe ? tete.slice(0, -2) : tete
	if (!estObjet(racine) || !Object.prototype.hasOwnProperty.call(racine, cle)) return []
	const valeur = racine[cle]
	if (!estListe) return textesDuChemin(valeur, reste)
	if (!Array.isArray(valeur)) return []
	return valeur.flatMap((element) => textesDuChemin(element, reste))
}

/**
 * Le filtre du MARQUEUR : un texte qui CONTIENT `MARQUEUR_A_ECRIRE` est RETIRÉ —
 * jamais remplacé par `''`. Un `canon.ton` injecté vide enseignerait au modèle
 * « ce livre n'a pas de ton », ce qui est une AFFIRMATION ; le repli est le
 * SILENCE. `includes` et non `startsWith` : l'auteur peut éditer autour du
 * marqueur, et les chevrons `⟨ ⟩` ne se tapent pas au clavier (KR-223).
 */
function estRedige(texte: string): boolean {
	return texte.trim() !== '' && !texte.includes(MARQUEUR_A_ECRIRE)
}

/**
 * LES TEXTES RÉDIGÉS d'un chemin, résolus depuis la racine qui le porte. LA
 * PRIMITIVE PARTAGÉE par les deux assembleurs : elle fait la chirurgie de chaîne
 * UNE fois (retirer le préfixe de la famille, découper en segments) et applique le
 * filtre du marqueur. `prefixe` vaut `''` pour les chemins globaux — `''` est
 * préfixe de tout, donc la ligne n'a pas de branche.
 */
function textesRediges(racine: unknown, chemin: string, prefixe: string): string[] {
	const relatif = chemin.startsWith(prefixe) ? chemin.slice(prefixe.length) : chemin
	return textesDuChemin(racine, relatif.split('.')).filter(estRedige)
}

/** LE RÔLE de `assemblerProse`, écrit UNE fois. Deux fonctions NOMMÉES, jamais un
 *  corps commun paramétré par le rôle : les deux assembleurs diffèrent sur CINQ
 *  points (racine des chemins, blocs numérotés, troncature à K, champ cible exclu
 *  côté prose, champ cible REQUIS côté détenteurs), et une table de portées n'en
 *  couvrirait que deux (§ 8, TL-4). Il n'y a AUCUNE branche `if (role === …)` dans
 *  ce fichier — ce qui varie est le CORPS, pas une donnée. */
const ROLE_PROSE = 'personnage-prose'
const ROLE_DETENTEURS = 'indice-detenteurs'
const ROLE_REPLIQUES = 'personnage-repliques'

/**
 * LE CONTEXTE DU RÔLE PROSE, assemblé pour un dossier et une cible.
 *
 * SIX règles, toutes portées par un test :
 *  1. un champ marqué est RETIRÉ, jamais vidé ;
 *  2. le retrait est un retrait — aucune substitution ;
 *  3. une `PARTIES_REQUISES` vidée par le filtre ⇒ `{ok:false, motif:'a-ecrire'}`,
 *     AUCUN `fetch` ne part ;
 *  4. `texte.length > BUDGET_CARACTERES_CONTEXTE` ⇒ `{ok:false, motif:'trop-long'}`,
 *     AUCUN `fetch` non plus. À l'it1 on ne coupe rien, ON REFUSE : en rédaction,
 *     rien n'avance tout seul, donc le dégradé EST le refus (KR-230) ;
 *  5. le champ CIBLE n'est JAMAIS injecté dans sa propre demande — le montrer
 *     invite la paraphrase ;
 *  6. `canon.interdits_ton[]` VIDE est un état calme et légitime, jamais un
 *     manque : on ne refuse pas sur une liste vide.
 *
 * FORME DU TEXTE ASSEMBLÉ — décision de l'ouvrier, écrite ici plutôt
 * qu'inventée en silence : chaque bloc est le CHEMIN DE FEUILLE lui-même, suivi
 * d'une ligne par valeur, les blocs séparés par une ligne vide. Le chemin plutôt
 * qu'un libellé français parce qu'un libellé pour les huit chemins restants
 * exigerait huit entrées de plus dans `LIBELLE_DES_CHAMPS`, dont aucune n'aurait
 * de second lecteur (KR-109/KR-235) — et parce que le corps de requête porte DÉJÀ
 * le chemin de la cible : le vocabulaire est le même des deux côtés du fil.
 */
export function assemblerProse(dossier: Dossier, cible: CibleCopilote): ContexteProse {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === cible.entiteId)
	const blocs: string[] = []
	const retenus = new Set<string>()

	for (const chemin of CHAMPS_INJECTES[ROLE_PROSE]) {
		// Règle 5 — la cible n'est jamais injectée dans sa propre demande.
		if (chemin === cible.champ) continue
		const surLePersonnage = chemin.startsWith(PREFIXE_PERSONNAGE)
		if (surLePersonnage && personnage === undefined) continue
		// Règles 1 et 2 — RETRAIT, jamais substitution.
		const textes = surLePersonnage
			? textesRediges(personnage, chemin, PREFIXE_PERSONNAGE)
			: textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Règle 3 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_PROSE]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	const texte = blocs.join('\n\n')
	// Règle 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_PROSE]) return { ok: false, motif: 'trop-long' }

	return {
		ok: true,
		texte,
		// La cible ne résout pas (le dossier a changé sous l'écran) : aucune fiche
		// n'est injectée, et `entitesInjectees` le DIT plutôt que de le taire.
		entitesInjectees: personnage === undefined ? [] : [personnage.id],
	}
}

/**
 * L'ASSEMBLEUR DU SECOND RÔLE.
 *
 * SÉLECTION DES CANDIDATS — déterministe, sans modèle :
 *  1. exclure tout personnage dont un `savoirs[].indice_id` vaut `cible.indiceId` ;
 *  2. ordre : `portee === 'premier'` d'abord, puis l'ordre du document. `portee` est
 *     d'audience `moteur` : elle SÉLECTIONNE, elle n'est JAMAIS injectée ;
 *  3. tronquer à `CANDIDATS_MAX` ;
 *  4. un candidat dont les QUATRE chemins de personnage sont vides ou marqués n'est
 *     PAS injecté et ne consomme PAS de rang — un bloc de rang sans une seule ligne
 *     enseignerait « ce personnage n'a rien », ce qui est une AFFIRMATION ; le repli
 *     est le SILENCE (même doctrine que le filtre `MARQUEUR_A_ECRIRE` de l'it1) ;
 *  5. numéroter les survivants `P1`, `P2`, … dans cet ordre.
 *
 * TRONCATURE DE LISTE, JAMAIS DE CHAÎNE : `plan_actions[].action` est réduit à son
 * PREMIER élément RÉDIGÉ ; aucune chaîne n'est jamais coupée. Dépassement de budget
 * ⇒ REFUS, jamais coupure (KR-230 : en rédaction, le dégradé EST le refus).
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — la `verite` de l'indice cible manque, est vide ou marquée
 *   3. `aucun-candidat` — table des rangs vide
 *   4. `trop-long`      — `texte.length > BUDGET_CARACTERES_CONTEXTE[rôle]`
 *
 * CE QUI N'EST PAS ICI, et c'est une décision : `controlerDossier`. Le constat
 * `indice-sans-source` gouverne QUEL indice l'auteur peut confier — côté client,
 * dans le `Select` ; il n'entre ni dans le contexte, ni dans la légalité d'une
 * demande. L'injecter apprendrait au modèle à faire disparaître l'alerte plutôt
 * qu'à répondre à la question.
 */
export function assemblerDetenteurs(dossier: Dossier, cible: CibleIndice): ContexteDetenteurs {
	const chemins = CHAMPS_INJECTES[ROLE_DETENTEURS]
	const blocs: string[] = []
	const retenus = new Set<string>()

	// ── LE CANON, global ──────────────────────────────────────────────────────
	for (const chemin of chemins) {
		if (chemin.startsWith(PREFIXE_INDICE) || chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 1 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_DETENTEURS]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── L'INDICE CIBLE ────────────────────────────────────────────────────────
	// La cible ne résout pas (le dossier a changé sous l'écran) : sa `verite` est
	// alors vide, et le refus 2 la couvre — il n'y a pas deux états à distinguer,
	// « pas de vérité écrite » et « plus d'indice du tout » demandent le même geste.
	const indice = dossier.monde.indices.find((candidat) => candidat.id === cible.indiceId)
	const blocsDeLIndice: string[] = []
	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_INDICE)) continue
		const textes = textesRediges(indice, chemin, PREFIXE_INDICE)
		if (chemin === CHEMIN_VERITE_CIBLE && textes.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
		if (textes.length === 0) continue
		blocsDeLIndice.push(`${chemin}\n${textes.join('\n')}`)
	}
	blocs.push(...blocsDeLIndice)

	// ── LES CANDIDATS ─────────────────────────────────────────────────────────
	// `textesDuChemin` et non `savoirs.some(…)` : la lecture d'un dossier venu du
	// disque reste TOTALE (KR-116), et c'est la même primitive que l'injection —
	// sauf que celle-ci SÉLECTIONNE et n'injecte rien.
	const detientDeja = (candidat: unknown): boolean =>
		textesDuChemin(candidat, ['savoirs[]', 'indice_id']).includes(cible.indiceId)
	const libres = dossier.monde.personnages.filter((candidat) => !detientDeja(candidat))
	const ordonnes = [
		...libres.filter((candidat) => candidat.portee === 'premier'),
		...libres.filter((candidat) => candidat.portee !== 'premier'),
	]

	const rangs = new Map<RangInjecte, string>()
	// UNE traversée, DEUX projections — jamais deux listes à tenir en phase.
	const entitesInjectees: string[] = [cible.indiceId]

	for (const candidat of ordonnes.slice(0, CANDIDATS_MAX)) {
		const lignes: string[] = []
		for (const chemin of chemins) {
			if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
			const textes = textesRediges(candidat, chemin, PREFIXE_PERSONNAGE)
			const retenues = chemin === CHEMIN_TRONQUE ? textes.slice(0, 1) : textes
			if (retenues.length === 0) continue
			lignes.push(`${chemin}\n${retenues.join('\n')}`)
		}
		// Règle 4 de la sélection — pas une ligne, pas de rang.
		if (lignes.length === 0) continue
		const rang = `P${rangs.size + 1}`
		rangs.set(rang, candidat.id)
		entitesInjectees.push(candidat.id)
		blocs.push(`${rang}\n${lignes.join('\n')}`)
	}

	// Refus 3 — personne à désigner : il n'y a RIEN à demander.
	if (rangs.size === 0) return { ok: false, motif: 'aucun-candidat' }

	const texte = blocs.join('\n\n')
	// Refus 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_DETENTEURS]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees, rangs }
}

/**
 * L'ASSEMBLEUR DU TROISIÈME RÔLE — la voix d'UN personnage.
 *
 * TROISIÈME FONCTION NOMMÉE, ZÉRO BRANCHE DE RÔLE : ce fichier ne contient toujours
 * aucun `if (role === …)`. Ce qui varie entre les trois assembleurs est le CORPS,
 * pas une donnée — les primitives partagées (`textesRediges`, `estRedige`) font la
 * chirurgie de chaîne une seule fois.
 *
 * `ContexteProse` est RÉUTILISÉ SANS ALIAS : un `type ContexteRepliques =
 * ContexteProse` serait une abstraction à un seul appelant (KR-109), et le renommer
 * rouvrirait la signature de l'it1 (dette nommée, même rang que `CibleCopilote`).
 * La forme rendue est exactement celle du rôle prose — une fiche, un texte — parce
 * que c'est exactement ce qu'elle est.
 *
 * REFUS, dans cet ORDRE FIGÉ, tous AVANT le moindre `fetch` :
 *   1. `a-ecrire`       — `canon.ton` absent ou marqué (charge : `'canon.ton'`)
 *   2. `cible-a-ecrire` — AUCUN des SEPT chemins de préfixe `monde.personnages[].`
 *      ne résout non vide (ou la cible ne résout plus du tout). SANS charge.
 *   3. `trop-long`      — REFUS, jamais de coupe (KR-230).
 *
 * `'aucun-candidat'` EST SANS OBJET ici — une seule entité, aucun rang à numéroter.
 * Ne pas l'écrire : ce serait du code mort présenté comme de la couverture.
 *
 * LE REFUS 2, ET C'EST LA SEULE PIÈCE DE MÉCANISME NEUVE DE CETTE TRANCHE. Le
 * PRÉDICAT de vacuité est réutilisé tel quel — `estRedige` ci-dessus, module-local et
 * non exportée, appelée par `textesRediges` : rien à exporter, rien à déplacer. Ce
 * qui est neuf est le QUANTIFICATEUR : l'it2 teste UN chemin nommé
 * (`CHEMIN_VERITE_CIBLE`), ici c'est une DISJONCTION sur sept chemins. Aucun seuil
 * numérique n'y entre.
 *
 * DISCRIMINANT, écrit pour qu'on ne l'étende pas par symétrie : ON PEUT INVENTER UNE
 * FONCTION À PARTIR DE RIEN — c'est la page blanche que le but de la feature nomme ;
 * ON NE PEUT PAS INVENTER UNE VOIX À PARTIR DE RIEN. Le garde vaut pour CE rôle, et
 * pour lui seul (§ 8, n° 36).
 */
export function assemblerRepliques(dossier: Dossier, cible: CibleRepliques): ContexteProse {
	const chemins = CHAMPS_INJECTES[ROLE_REPLIQUES]
	const blocs: string[] = []
	const retenus = new Set<string>()

	// ── LE CANON, global ──────────────────────────────────────────────────────
	for (const chemin of chemins) {
		if (chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 1 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[ROLE_REPLIQUES]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	// ── LA FICHE CIBLE ────────────────────────────────────────────────────────
	// Refus 2, première moitié — la cible ne résout plus du tout (le dossier a
	// changé sous l'écran). MÊME motif que la seconde : « plus de fiche » et « une
	// fiche sans une ligne » demandent le même geste à l'auteur.
	const fiche = dossier.monde.personnages.find((candidat) => candidat.id === cible.personnageId)
	if (fiche === undefined) return { ok: false, motif: 'cible-a-ecrire' }

	const blocsDeLaFiche: string[] = []
	for (const chemin of chemins) {
		if (!chemin.startsWith(PREFIXE_PERSONNAGE)) continue
		const textes = textesRediges(fiche, chemin, PREFIXE_PERSONNAGE)
		if (textes.length === 0) continue
		blocsDeLaFiche.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Refus 2, seconde moitié — LA DISJONCTION : pas UNE ligne d'identité écrite.
	if (blocsDeLaFiche.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	blocs.push(...blocsDeLaFiche)

	const texte = blocs.join('\n\n')
	// Refus 3 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE[ROLE_REPLIQUES]) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte, entitesInjectees: [fiche.id] }
}
