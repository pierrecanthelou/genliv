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
// `assemblerContexte` de ce module-ci, et ce module-ci importe `CibleCopilote` de
// lui. `import type` est EFFACÉ à l'émission, donc il n'existe aucun cycle au
// runtime — mais transformer cette ligne en import de VALEUR (une constante, une
// fonction) en créerait un vrai, avec son module à moitié initialisé. Si un jour
// une valeur doit circuler dans ce sens, elle descend dans `./types` — qui, lui,
// n'importe rien.
import type { CibleCopilote } from '../CopiloteService'
import type { RoleCopilote } from './types'

/** Les 12 chemins de feuille injectés PAR RÔLE, tous d'audience `'ia'`, chemins à
 *  indices effacés — MÊME vocabulaire que `DESTINATION_DES_CHAMPS`. Les entrées
 *  de personnage sont RESTREINTES à l'entité désignée par l'auteur. Liste FIXE de
 *  l'it1 : un ouvrier n'en ajoute pas une. */
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
}

/**
 * Le PRÉFIXE des chemins RESTREINTS à l'entité désignée. Écrit UNE fois : les
 * douze chemins ci-dessus se lisent alors en deux familles — ce qui vient du
 * canon (global) et ce qui vient de la fiche DÉSIGNÉE — sans qu'aucune chirurgie
 * de chaîne ne soit répartie dans le corps de l'assembleur.
 */
const PREFIXE_PERSONNAGE = 'monde.personnages[].'

/**
 * Mesuré au lot contrat de l'itération 1, protocole § 4 quater du plan :
 * `BUDGET_CARACTERES_CONTEXTE = ceil(M × 3 / 1000) × 1000`, où `M` est la
 * longueur en CARACTÈRES (`String.length`, UTF-16) du contexte réellement
 * assemblé sur l'entité de mesure du dossier de référence, APRÈS filtrage
 * d'audience et APRÈS retrait des champs marqués.
 *
 * MESURE DU 2026-09-17, sur l'entité de mesure composée par `contexte.test.ts`
 * (le personnage le mieux rempli de `dossier-reference.json`, greffé du `but` du
 * seul porteur du dossier — aucun personnage de la fixture ne remplit à lui seul
 * les douze chemins, et la fixture n'appartient pas à ce lot) :
 * `fonction` 1763 · `apparence` 1756 · `description_joueur` 1783 caractères, le
 * champ cible étant retiré de sa propre demande. `M = 1783` ⇒
 * `ceil(1783 × 3 / 1000) × 1000 = 6000`.
 *
 * Le facteur 3 est une DÉCISION DATÉE du comité (2026-09-17) — la fixture est une
 * épreuve de validateur, pas le dossier d'un auteur ; l'arrondi au millier EST la
 * marge, on n'en ajoute pas une seconde.
 *
 * CE N'EST PAS UN CLIQUET : c'est une borne de refus, RE-DÉRIVÉE par la même
 * formule sur une NOUVELLE mesure à chaque itération qui élargit
 * `CHAMPS_INJECTES`. On ne la desserre jamais « parce que ça a coincé une fois ».
 */
export const BUDGET_CARACTERES_CONTEXTE = 6000

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » ne pointe pas un champ, il pointe la
	 *  fiche. Le champ injecté le plus long peut être `but.libelle` ou
	 *  `plan_actions[].action`, dont les libellés vivent dans des blocs que le
	 *  registre à quatre entrées ne porte pas — et n'a aucune raison de porter. */
	| { motif: 'trop-long' }

export type Contexte =
	/** `texte` est DÉTERMINISTE : ni date, ni identifiant, ni aléa — c'est ce qui
	 *  rend « deux lancers ⇒ deux corps identiques » vrai par égalité stricte.
	 *  `entitesInjectees` vaut exactement une entrée quand la cible résout ; c'est
	 *  ce que le test de confinement compare. */
	{ ok: true; texte: string; entitesInjectees: readonly string[] } | ({ ok: false } & MotifRefusContexte)

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
 * LE CONTEXTE, assemblé pour un rôle, un dossier et une cible.
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
export function assemblerContexte(role: RoleCopilote, dossier: Dossier, cible: CibleCopilote): Contexte {
	const personnage = dossier.monde.personnages.find((candidat) => candidat.id === cible.entiteId)
	const blocs: string[] = []
	const retenus = new Set<string>()

	for (const chemin of CHAMPS_INJECTES[role]) {
		// Règle 5 — la cible n'est jamais injectée dans sa propre demande.
		if (chemin === cible.champ) continue
		const surLePersonnage = chemin.startsWith(PREFIXE_PERSONNAGE)
		const racine = surLePersonnage ? personnage : dossier
		if (racine === undefined) continue
		const segments = (surLePersonnage ? chemin.slice(PREFIXE_PERSONNAGE.length) : chemin).split('.')
		// Règles 1 et 2 — RETRAIT, jamais substitution.
		const textes = textesDuChemin(racine, segments).filter(estRedige)
		if (textes.length === 0) continue
		retenus.add(chemin)
		blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// Règle 3 — un champ requis vidé par le filtre refuse AVANT tout appel.
	for (const requis of PARTIES_REQUISES[role]) {
		if (!retenus.has(requis)) return { ok: false, motif: 'a-ecrire', chemin: requis }
	}

	const texte = blocs.join('\n\n')
	// Règle 4 — on refuse, on ne coupe pas.
	if (texte.length > BUDGET_CARACTERES_CONTEXTE) return { ok: false, motif: 'trop-long' }

	return {
		ok: true,
		texte,
		// La cible ne résout pas (le dossier a changé sous l'écran) : aucune fiche
		// n'est injectée, et `entitesInjectees` le DIT plutôt que de le taire.
		entitesInjectees: personnage === undefined ? [] : [personnage.id],
	}
}
