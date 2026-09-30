/**
 * L'ASSEMBLEUR DU HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2 puis it3 puis it4).
 *
 * Il compose ce que le narrateur VOIT pour raconter UN pas DÉJÀ JOUÉ : la session
 * reçue est celle d'APRÈS l'exécution, déjà persistée. Rien ici n'écrit l'état.
 *
 * ⚠ COMME L'INTERPRÈTE, CE RÔLE NE PASSE PAS PAR `./registres.ts` : ces registres sont
 * `Record<RoleCopilote, …>`, et `RoleCopilote` n'est pas étendu aux rôles de JEU. Ce
 * module porte donc SA liste de chemins (`CHAMPS_INJECTES_NARRATEUR`) et SA borne
 * (`BUDGET_CARACTERES_NARRATEUR`), hors de la parité auteur de
 * `worker/frontiere.test.ts` — LA MÊME DOCTRINE pour autant : jamais une prose coupée,
 * silence sur un champ non rédigé plutôt qu'une affirmation, et le refus AVANT tout
 * `fetch` — mais en DERNIER recours, après la cascade de l'it4 (plus bas), qui ne retire
 * que des blocs et des lignes ENTIERS.
 *
 * ── LA CASCADE (it4) — CE QUE LE NARRATEUR PERD QUAND LE BUDGET NE TIENT PAS ──────
 * Le premier palier dont le texte tient sous `BUDGET_CARACTERES_NARRATEUR` est envoyé.
 * CALCULÉE EN LIGNE à chaque appel : le palier retenu n'est ni stocké ni rendu (KR-013,
 * KR-268), et le modèle n'en sait rien — aucun en-tête neuf, aucun mot de mécanique
 * (KR-273). Chaque palier retire ce que le précédent retirait, plus :
 *  · P1 — `RECEMMENT` réduit à ses `FENETRE_MIN − 1` lignes les plus récentes ;
 *  · P2 — `A CONDENSER` retiré, et `condensation` rendue `null` : ce qui est rendu est ce
 *    qui est ENVOYÉ, jamais la tranche que `pasACondenser` aurait due ;
 *  · P3 — `AUPARAVANT` retiré ;
 *  · P4, DERNIER RECOURS — `EN SA POSSESSION` réduit au plus long SUFFIXE (ordre
 *    d'acquisition) qui tient, JAMAIS vide quand un objet rédigé est possédé, et qui porte
 *    TOUT objet que `CE PAS` désigne.
 * JAMAIS UN LEVIER, À AUCUN PALIER : le canon, `ETABLI` (toujours `faitsPertinents`
 * entier), `ICI A1`, `CE PAS`, `DEJA ACCOMPLI`, la saisie. Au-delà de P4 : `trop-long`.
 *
 * ── LA MÉMOIRE (it3) — CE QUE LE NARRATEUR RELIT, ET RIEN D'AUTRE ─────────────────
 * Le narrateur n'est plus sans état, et c'est la POLITIQUE DE RÉTENTION de
 * `dossier/memoire.ts` qui dit ce qui repart au modèle — cet assembleur ne décide RIEN de
 * ce qui est retenu, il PROJETTE :
 *  · `AUPARAVANT` — le résumé glissant, s'il existe ;
 *  · `A CONDENSER` — la tranche `pasACondenser(session)`, SEULEMENT si elle est due ;
 *  · `RECEMMENT` — les pas `(borneDeFenetre(t), t−1]` : la fenêtre, pas courant exclu (il
 *    est dans `CE PAS`) ;
 *  · `ETABLI` — `faitsPertinents(session)`.
 * UNE LIGNE PAR PAS : son récit, ou À DÉFAUT le libellé de son geste (un pas joué en
 * console, ou dont le récit n'a pas pu être généré) — jamais un trou. Toute sortie de
 * modèle réinjectée est REPLIÉE sur une ligne (blancs collapsés) : un récit ne peut pas
 * imiter un en-tête de bloc.
 * JAMAIS : un numéro de pas ou d'horloge, `journal[].texte`, les deltas d'un pas passé
 * (l'état les reflète déjà), les tentatives (jamais persistées), `attente`.
 *
 * ── LES ANCRES (it3) — CE QUE LE NARRATEUR PEUT DÉSIGNER ──────────────────────────
 * Le lieu courant (`A1`, toujours) et les objets dont la prose est injectée — ceux de
 * `CE PAS`, puis ceux `EN SA POSSESSION` —, UN rang par identifiant. JAMAIS un indice ni un
 * jalon (KR-272 : ces ensembles ne font que croître, une ancre y resterait sélectionnable
 * pour toujours). La table `ancres` est RENDUE avec le texte et ne sort jamais de
 * `brain/` (précédent `TablesInterprete`) : c'est ELLE que le validateur consulte et que
 * le service re-résout, jamais une re-dérivation (KR-231).
 *
 * ── CE QUI N'ENTRE JAMAIS ───────────────────────────────────────────────────────
 * Un identifiant (rien, dans ce rôle, ne désigne autrement que par un rang `A…`) ·
 * `Entite.nom` (KR-262 — un lieu se dit par sa `description`) · toute donnée de
 * personnage (n° 12) · `canon.mj.synopsis_mj` (le narrateur conduirait vers l'intrigue à
 * venir) · `monde.lieux[].dangers` (un danger raconté appelle un jet que personne ne
 * résout avant la n° 11) · `monde.indices[].verite` (la solution) · `lieux[].acces` (la
 * carte) · les deux proses émises verbatim (`texte_ouverture_joueur`, `fins[].texte`).
 *
 * ── LES ONZE CHEMINS DE PROSE `ia` DU MONDE ET DE LA CHARPENTE (KR-261) ─────────
 * LA LISTE FERMÉE, ÉCRITE ICI ET NULLE PART AILLEURS. PRÉDICAT (KR-159) : les chemins de
 * `DESTINATION_DES_CHAMPS` (`dossier/destinations.ts`) d'audience `'ia'`, préfixés
 * `monde.` ou `charpente.`, HORS `monde.personnages[]`. Le canon (toujours chargé) et
 * les fiches de personnage (n° 12) ne sont pas comptés. `contexte.test.ts` DÉRIVE cet
 * ensemble de la table et le compare à la liste ci-dessous, ligne à ligne : un chemin
 * `ia` ajouté au schéma sans ligne ici fait rougir le test.
 *
 *   · `monde.lieux[].description` — OUVERT n° 10 : R1 (it1, candidats et ICI) et R3 (it2, ICI, requise)
 *   · `monde.lieux[].ambiance` — OUVERT n° 10 : R3 (it2, ICI)
 *   · `monde.lieux[].dangers` — FERMÉ : n° 11, un danger appelle un jet
 *   · `monde.objets[].description_joueur` — OUVERT n° 10 : R3 (it2, CE PAS et EN SA POSSESSION)
 *   · `monde.indices[].verite` — FERMÉ : n° 12, carnet d'indices, sous condition d'état
 *   · `monde.indices[].formulation_joueur` — OUVERT n° 10 : R3 (it2, CE PAS)
 *   · `monde.quetes[].consigne` — FERMÉ : aucune itération nommée
 *   · `monde.quetes[].etapes[].libelle` — FERMÉ : renvoyé à la n° 10 par la n° 9, non ouvert par l'it2
 *   · `monde.evenements[].resolutions[].resultat` — FERMÉ : aucune itération nommée
 *   · `monde.conditions.climat[].manifestation` — FERMÉ : n° 14, climat actif
 *   · `charpente.jalons[].enonce_texte` — OUVERT n° 10 : R3 (it2, CE PAS et DEJA ACCOMPLI)
 *
 * COMPTE CONFIRMÉ : la n° 10 en ouvre CINQ sur onze — UN par l'interprète
 * (`lieux.description`), QUATRE par le narrateur (`lieux.ambiance`,
 * `objets.description_joueur`, `indices.formulation_joueur`, `jalons.enonce_texte`) ;
 * le narrateur relit aussi `lieux.description`, déjà ouvert. Le « trois » de
 * `design_reference` (spec de la feature) était un décompte sans liste écrite. L'it3 n'en
 * ouvre AUCUN de plus : la mémoire est de la SESSION (`journal[].recit`,
 * `memoire.resume.texte`, `memoire.faits_etablis[].fait`, toutes `'ia'` dans
 * `dossier/sessionDestinations.ts`), jamais du dossier.
 */
import { COMMANDES } from '../../dossier/commandes'
import type { DeltaId } from '../../dossier/deltas'
import { projeterJalonsAtteints, type JalonAtteint } from '../../dossier/evaluate'
import {
	borneDeFenetre,
	CADENCE,
	FAITS_INJECTES_MAX,
	FENETRE_MAX,
	FENETRE_MIN,
	faitsPertinents,
	pasACondenser,
} from '../../dossier/memoire'
import type { EtatSession } from '../../dossier/session'
import type { Dossier } from '../../dossier/types'
import { CONDENSE_CARACTERES_MAX, FAIT_CARACTERES_MAX, NARRATION_CARACTERES_MAX } from '../schemaSortie'
import type { CibleNarrateur, RangInjecte } from '../types'
import { textesRediges, type MotifRefusContexte } from './noyau'

/**
 * LES EN-TÊTES DES BLOCS — des mots d'ASSEMBLAGE, sans accent (précédent `DEJA ECRIT`),
 * jamais un nom de champ du document ni un rang. `ICI` et `saisie` sont ceux de
 * l'interprète : le même lieu et la même saisie se nomment de la même façon aux deux
 * rôles. `ICI` porte l'ancre du lieu courant, `A1`, toujours la même.
 * Les quatre en-têtes de la MÉMOIRE (it3) ne sont JAMAIS cités par l'invite du worker
 * (`worker/index.test.ts` les balaie) : le modèle les lit, il n'en apprend pas les noms.
 */
const EN_TETE_ICI = 'ICI'
const EN_TETE_CE_PAS = 'CE PAS'
const EN_TETE_POSSESSIONS = 'EN SA POSSESSION'
const EN_TETE_ACCOMPLI = 'DEJA ACCOMPLI'
const EN_TETE_SAISIE = 'saisie'
const EN_TETE_AUPARAVANT = 'AUPARAVANT'
const EN_TETE_A_CONDENSER = 'A CONDENSER'
const EN_TETE_RECEMMENT = 'RECEMMENT'
const EN_TETE_ETABLI = 'ETABLI'

/** Le séparateur entre deux blocs — écrit une fois : le texte l'emploie, et la borne de la
 *  mémoire le compte. */
const SEPARATEUR_DE_BLOCS = '\n\n'

/**
 * LA BORNE EXACTE DE LA MÉMOIRE, EN CARACTÈRES — CALCULÉE, jamais mesurée ni majorée : chacun
 * de ses termes est borné par un VALIDATEUR, donc la somme est EXACTE, et la marge ×3 du
 * terme dossier (dont la prose d'auteur n'est pas bornée, KR-203) n'a RIEN à faire ici
 * (§ 8 désaccord 5 du raffinage it3). Un bloc plein coûte : son séparateur, son en-tête,
 * puis pour chaque ligne un saut de ligne et la ligne elle-même.
 *
 *   `AUPARAVANT`  — 1 ligne de `CONDENSE_CARACTERES_MAX` ;
 *   `A CONDENSER` — `CADENCE` lignes de pas ;
 *   `RECEMMENT`   — `FENETRE_MAX − 1` lignes de pas (la fenêtre, pas courant exclu) ;
 *   `ETABLI`      — `FAITS_INJECTES_MAX` lignes de `FAIT_CARACTERES_MAX`.
 *
 * LE PIRE CAS EST UN RETARD DE CONDENSATION : `FENETRE_MAX − 1 + CADENCE` = 23 lignes de pas
 * en même temps (au pas 34, résumé à 10 : tranche 11–20 et fenêtre 21–33). Un budget calé
 * sur la seule fenêtre lèverait `trop-long` dès le premier échec de condensation, et le
 * narrateur se tairait justement quand il doit rattraper.
 *
 * UNE LIGNE DE PAS est un RÉCIT (`NARRATION_CARACTERES_MAX`, borne de `validerNarrateur`) ou,
 * à défaut, un LIBELLÉ DE GESTE : sa largeur est le plus grand des deux, DÉRIVÉ de
 * `COMMANDES` — jamais supposé.
 */
const LIGNE_DE_PAS_MAX = Math.max(
	NARRATION_CARACTERES_MAX,
	...Object.values(COMMANDES).map((descripteur) => descripteur.label.length),
)
const coutDUnBlocPlein = (enTete: string, lignes: number, largeur: number): number =>
	SEPARATEUR_DE_BLOCS.length + enTete.length + lignes * (1 + largeur)
export const BORNE_MEMOIRE =
	coutDUnBlocPlein(EN_TETE_AUPARAVANT, 1, CONDENSE_CARACTERES_MAX) +
	coutDUnBlocPlein(EN_TETE_A_CONDENSER, CADENCE, LIGNE_DE_PAS_MAX) +
	coutDUnBlocPlein(EN_TETE_RECEMMENT, FENETRE_MAX - 1, LIGNE_DE_PAS_MAX) +
	coutDUnBlocPlein(EN_TETE_ETABLI, FAITS_INJECTES_MAX, FAIT_CARACTERES_MAX)

/**
 * LA BORNE DU TERME DOSSIER — formule du registre auteur, `ceil(M × 3 / 1000) × 1000`, le
 * facteur 3 et l'arrondi au millier étant LA marge de la prose d'auteur non bornée.
 *
 * RE-MESURÉ le 2026-09-30 (it3) par `contexte.test.ts`, au PIRE CAS sur
 * `dossier-reference.json`, AVEC LES RANGS D'ANCRE que l'it3 ajoute (`ICI A1`, `obtient A2 —
 * …`, `A2 — …`) et SANS mémoire — la mémoire est l'autre terme, calculé : le lieu décrit dont
 * `description` + `ambiance` est le plus long, le geste au libellé le plus long, TOUS les
 * objets donnés, TOUS les indices révélés et TOUS les jalons atteints AU PAS COURANT, TOUS les
 * objets possédés et TOUS les jalons déjà atteints, une saisie de `SAISIE_CARACTERES_MAX`
 * (300) caractères. Protocole de l'it1 : on asserte d'abord que les HUIT chemins injectés
 * résolvent non vides, sans quoi `M` serait un PLANCHER et non une mesure.
 * M = 1937 (1918 en it2, + 19 caractères de rangs) ⇒ ceil(1937 × 3 / 1000) × 1000 = 6000.
 */
const BUDGET_CARACTERES_DOSSIER = 6000

/**
 * LA BORNE DU CONTEXTE, EN CARACTÈRES (`String.length`) — au-delà, la CASCADE (it4) retire
 * de la mémoire, puis de l'inventaire ; le refus `'trop-long'`, AVANT tout `fetch`, ne vient
 * qu'après son dernier palier, et jamais une coupe dans une prose. DEUX TERMES, et ils ne se
 * traitent pas pareil : le terme DOSSIER, MESURÉ puis majoré (×3), et le terme MÉMOIRE,
 * CALCULÉ exactement (`BORNE_MEMOIRE`). `contexte.test.ts` prouve qu'une mémoire SATURÉE
 * (23 lignes de pas, le résumé et huit faits au maximum) sur le pire cas du dossier tient
 * DÈS P0 : seul le terme dossier peut faire descendre la cascade.
 *
 * HORS DE `BUDGET_CARACTERES_CONTEXTE` (`./registres.ts`), et c'est délibéré : ce
 * registre est `Record<RoleCopilote, number>`, et y entrer ferait entrer le narrateur
 * dans la parité AUTEUR. La fusion avec un budget de l'interprète en UNE formule (KR-261 ;
 * KR-235 : une formule dérivée par rôle, jamais une valeur brute partagée) attend la
 * première itération qui donnera un budget à R1 — l'it4 ne l'a PAS faite, R1 n'y ayant
 * aucun consommateur (raffinage it4, § 8 désaccord 4).
 *
 * RÉSOLU À L'IT4 — le refus MONOTONE que l'it3 portait ici (une fois l'inventaire trop
 * long, plus aucun pas n'était raconté) : la cascade atteint désormais `EN SA POSSESSION`,
 * en dernier recours, et l'ordre qui manquait existe — c'est l'ordre d'ACQUISITION
 * (`avecAjout`, `dossier/deltas.ts`, ajoute en fin). Le refus ne reste que si l'état
 * MINIMAL ne tient pas : la prose d'auteur, elle, n'est pas bornée (KR-203).
 *
 * Exportée par `./index.ts` pour `worker/frontiere.test.ts` SEULEMENT — jamais par
 * `brain/index.ts` : aucune feature n'assemble un contexte elle-même.
 */
export const BUDGET_CARACTERES_NARRATEUR = BUDGET_CARACTERES_DOSSIER + BORNE_MEMOIRE

/** LES HUIT CHEMINS INJECTÉS, tous d'audience `'ia'` (garde de confinement dans
 *  `contexte.test.ts`, KR-232). Trois du canon, cinq du monde et de la charpente — dont
 *  quatre OUVERTS par ce rôle (voir la liste des onze en tête de fichier). ÉCRITE À LA
 *  MAIN, jamais dérivée de la table d'audience : la table est une GARDE, jamais un
 *  PILOTE — sinon tout champ `ia` ajouté au schéma entrerait ici sans décision. */
export const CHAMPS_INJECTES_NARRATEUR = [
	'canon.ton',
	'canon.interdits_ton[]',
	'canon.partage.accroche_joueur',
	'monde.lieux[].description',
	'monde.lieux[].ambiance',
	'monde.objets[].description_joueur',
	'monde.indices[].formulation_joueur',
	'charpente.jalons[].enonce_texte',
] as const

/** Les trois chemins du canon — injectés QUAND ÉCRITS, aucun n'est requis : un ton non
 *  rédigé se tait, exactement comme chez l'interprète (en faire un refus ferait d'une
 *  alerte d'auteur un bloquant de partie). */
const CHEMINS_DU_CANON = CHAMPS_INJECTES_NARRATEUR.filter((chemin) => chemin.startsWith('canon.'))

const PREFIXE_LIEU = 'monde.lieux[].'
const CHEMIN_DESCRIPTION_LIEU: (typeof CHAMPS_INJECTES_NARRATEUR)[number] = 'monde.lieux[].description'
const CHEMIN_AMBIANCE_LIEU: (typeof CHAMPS_INJECTES_NARRATEUR)[number] = 'monde.lieux[].ambiance'
const PREFIXE_OBJET = 'monde.objets[].'
const CHEMIN_OBJET: (typeof CHAMPS_INJECTES_NARRATEUR)[number] = 'monde.objets[].description_joueur'
const PREFIXE_INDICE = 'monde.indices[].'
const CHEMIN_INDICE: (typeof CHAMPS_INJECTES_NARRATEUR)[number] = 'monde.indices[].formulation_joueur'

/**
 * LA LIGNE DU PAS SANS EFFET APPLIQUÉ — ÉCRITE, jamais omise : un bloc « ce pas » vide
 * laisserait le modèle deviner, et deviner ce qui a changé est précisément ce que ce
 * rôle n'a pas le droit de faire. Elle ne s'écrit QUE si AUCUN effet n'a été appliqué :
 * un effet appliqué mais NON RÉDIGÉ (un objet sans `description_joueur`) se TAIT — la
 * phrase « aucun changement » serait alors une affirmation fausse.
 */
const AUCUN_CHANGEMENT = 'aucun changement'

/** Toute prose de modèle réinjectée tient sur UNE ligne — elle ne peut pas imiter un
 *  en-tête de bloc (KR candidat du raffinage it3, narratif-ia). */
function replier(texte: string): string {
	return texte.replace(/\s+/g, ' ').trim()
}

/** Ce que le narrateur lit d'un effet de règle appliqué au pas courant : le SENS du
 *  changement pour le héros (`amorce`, un verbe à la troisième personne du présent,
 *  même forme que les libellés de geste — KR-269), les proses rédigées de sa cible,
 *  zéro, une ou plusieurs, et si cette cible REÇOIT UNE ANCRE (it3). */
interface LectureDEffet {
	readonly amorce: string
	/**
	 * VRAI pour les seuls effets dont la cible est un OBJET : un objet peut quitter le
	 * contexte puis y revenir, donc un fait ancré sur lui est RE-SÉLECTIONNABLE. FAUX pour un
	 * indice révélé (sélectionnable une fois, puis mort) et pour un jalon atteint (présent
	 * pour toujours, donc sélectionné pour toujours) — KR-272.
	 */
	readonly ancrable: boolean
	readonly lire: (dossier: Dossier, jalons: readonly JalonAtteint[], cible: string) => string[]
}

/** La `description_joueur` d'un objet — silence si l'objet a disparu du dossier ou si
 *  la prose n'est pas rédigée (jamais un repli sur `nom`, KR-262). */
function proseDObjet(dossier: Dossier, id: string): string[] {
	const objet = dossier.monde.objets.find((candidat) => candidat.id === id)
	return objet === undefined ? [] : textesRediges(objet, CHEMIN_OBJET, PREFIXE_OBJET)
}

/**
 * CE QUE CHAQUE EFFET DONNE À LIRE — `Record<DeltaId, …>`, donc TOTAL PAR COMPILATION
 * (KR-117) : un cinquième effet admis au registre des effets ne compile pas tant que
 * personne n'a décidé ce que le narrateur en lit, NI S'IL S'ANCRE. Jamais un `switch` sur
 * l'identifiant.
 *
 * ⚠ L'AMORCE N'EST PAS LE LIBELLÉ DU REGISTRE DES EFFETS, ET C'EST UNE DÉCISION : ce
 * libellé-là (« donne l'objet », « marque le jalon atteint ») est un texte d'ÉCRAN
 * D'AUTEUR, confiné par l'allow-list nommée de `dossier/deltas.test.ts` (KR-215) ; le
 * lire ici ferait de chaque retouche d'écran une retouche SILENCIEUSE du contexte d'un
 * modèle. Ce qui est dit au narrateur est le SENS POUR LE HÉROS — un gain, une perte,
 * une découverte, un accomplissement —, c'est-à-dire exactement les mots que son invite
 * lui interdit d'inventer quand la liste ne les porte pas. Les deux effets d'objet
 * lisent la MÊME prose et ne diffèrent QUE par l'amorce : sans elle, un objet perdu se
 * raconterait comme un objet trouvé.
 *
 * L'ÉNONCÉ D'UN JALON PASSE PAR `projeterJalonsAtteints` (`dossier/evaluate.ts`), SEULE
 * sortie de `enonce_texte` (KR-246) : un jalon atteint au pas courant est, par
 * construction, dans `jalons_atteints` — jamais une lecture directe de la charpente.
 */
const LECTURE_DES_EFFETS: Record<DeltaId, LectureDEffet> = {
	donner_objet: { amorce: 'obtient', ancrable: true, lire: (dossier, _jalons, cible) => proseDObjet(dossier, cible) },
	retirer_objet: { amorce: "n'a plus", ancrable: true, lire: (dossier, _jalons, cible) => proseDObjet(dossier, cible) },
	reveler_indice: {
		amorce: 'remarque',
		ancrable: false,
		lire: (dossier, _jalons, cible) => {
			const indice = dossier.monde.indices.find((candidat) => candidat.id === cible)
			// `formulation_joueur` SEULE, jamais `verite` : ce que le joueur perçoit, pas la
			// solution (condition d'état, n° 12).
			return indice === undefined ? [] : textesRediges(indice, CHEMIN_INDICE, PREFIXE_INDICE)
		},
	},
	atteindre_jalon: {
		amorce: 'accomplit',
		ancrable: false,
		lire: (_dossier, jalons, cible) =>
			jalons.filter((jalon) => jalon.jalon_id === cible).flatMap((jalon) => textesRediges(jalon, 'enonce', '')),
	},
}

/** La branche de SUCCÈS, NOMMÉE (précédent `ContexteDetenteursRendu`). */
interface ContexteNarrateurRendu {
	readonly ok: true
	readonly texte: string
	/**
	 * LES SEULES entités DÉSIGNABLES par un constat, rang → identifiant — le lieu courant et
	 * les objets dont la prose est injectée, JAMAIS un indice ni un jalon (KR-272). Le rang
	 * écrit dans `texte` et la clé de cette table sortent de la MÊME variable. NE SORT
	 * JAMAIS de `brain/` (KR-231).
	 */
	readonly ancres: ReadonlyMap<RangInjecte, string>
	/**
	 * LA TRANCHE À CONDENSER RÉELLEMENT ENVOYÉE — `pasACondenser(cible.session)`, CALCULÉE UNE
	 * FOIS, aux paliers P0 et P1 ; `null` quand rien n'est dû, ET à partir de P2, où le bloc
	 * `A CONDENSER` est retiré. Trois consommateurs : le bloc de `texte`, `condenseDemande` du
	 * validateur, et le `jusqu_au_pas` que le service posera (`a`) — rendre ici la tranche
	 * DUE plutôt que l'ENVOYÉE ferait accepter un condensé écrit sans elle, et avancer le
	 * pointeur sur dix pas que le modèle n'a jamais lus (KR-271).
	 */
	readonly condensation: { readonly de: number; readonly a: number } | null
}

export type ContexteNarrateur = ContexteNarrateurRendu | ({ readonly ok: false } & MotifRefusContexte)

/** LA LIGNE D'UN PAS PASSÉ — son récit, ou À DÉFAUT le libellé de son geste ; `null` s'il
 *  n'a aucune entrée à `origine`. Le pas est SÉLECTIONNÉ PAR `tour`, jamais par la position
 *  dans le journal : un pas porte plusieurs entrées (demande, effet, jalons). */
function ligneDuPas(session: EtatSession, pas: number): string | null {
	const porteuse = session.journal.find((entree) => entree.tour === pas && entree.origine !== undefined)
	if (porteuse?.origine === undefined) return null
	return replier(porteuse.recit ?? COMMANDES[porteuse.origine].label)
}

/** Les lignes des pas `de` à `a`, bornes incluses, dans l'ordre chronologique. */
function lignesDesPas(session: EtatSession, de: number, a: number): string[] {
	const lignes: string[] = []
	for (let pas = de; pas <= a; pas += 1) {
		const ligne = ligneDuPas(session, pas)
		if (ligne !== null) lignes.push(ligne)
	}
	return lignes
}

/** Pousse un bloc SEULEMENT s'il a au moins une ligne — jamais un bloc vide. */
function pousser(blocs: string[], enTete: string, lignes: readonly string[]): void {
	if (lignes.length > 0) blocs.push(`${enTete}\n${lignes.join('\n')}`)
}

/**
 * CE QUE LA MÉMOIRE ENVOIE À UN PALIER DE LA CASCADE (it4) — trois drapeaux, et rien d'autre
 * n'est un levier : ni `ETABLI`, ni aucun bloc de l'état. Les paliers sont CUMULATIFS.
 */
interface PalierDeMemoire {
	/** `RECEMMENT` réduit à ses `LIGNES_RECENTES_AU_PLANCHER` lignes les plus récentes. */
	readonly recemmentAuPlancher: boolean
	/** `A CONDENSER` envoyé si la tranche est due — et `condensation` rendue AVEC lui. */
	readonly aCondenser: boolean
	/** `AUPARAVANT` envoyé si un résumé existe. */
	readonly auparavant: boolean
}

/**
 * LA FENÊTRE AU PLANCHER, pas courant exclu (il est dans `CE PAS`) — DÉRIVÉE de
 * `FENETRE_MIN`, jamais écrite : à P1, le narrateur relit encore autant de pas qu'au pas de
 * bascule. Les pas écartés restent au journal, et seront condensés à leur tour.
 */
const LIGNES_RECENTES_AU_PLANCHER = FENETRE_MIN - 1

/** P3 — LE PLANCHER DE LA MÉMOIRE : la fenêtre au plancher et les faits, plus rien d'autre.
 *  C'est aussi la mémoire de P4, qui n'y retire plus rien. */
const PLANCHER_DE_MEMOIRE: PalierDeMemoire = { recemmentAuPlancher: true, aCondenser: false, auparavant: false }

/**
 * LES PALIERS P0 À P3, DANS L'ORDRE DE LA CASCADE — le premier dont le texte tient est
 * retenu. L'ORDRE EST UN CONTRAT, pas une préférence (raffinage it4, § 7) :
 *  · P1 AVANT P2 (I3) — réduire la fenêtre ne coûte que des pas qui seront condensés plus
 *    tard ; retirer la tranche fait MANQUER une condensation, et le résumé se fige ;
 *  · P2 AVANT P3 (I2) — une tranche envoyée SANS le résumé qu'elle prolonge serait
 *    condensée en ÉCRASANT tout ce qui précède : une perte définitive et silencieuse.
 */
const PALIERS_DE_MEMOIRE: readonly PalierDeMemoire[] = [
	{ recemmentAuPlancher: false, aCondenser: true, auparavant: true }, // P0 — le contexte plein
	{ recemmentAuPlancher: true, aCondenser: true, auparavant: true }, // P1
	{ recemmentAuPlancher: true, aCondenser: false, auparavant: true }, // P2
	PLANCHER_DE_MEMOIRE, // P3
]

/** UN OBJET POSSÉDÉ DONT LA PROSE EST RÉDIGÉE — seuls ceux-là s'écrivent dans `EN SA
 *  POSSESSION`, donc seuls ceux-là se comptent dans le suffixe de P4. Un objet muet se tait
 *  à TOUS les paliers (jamais un repli sur `nom`, KR-262). */
interface Possession {
	readonly id: string
	readonly proses: readonly string[]
}

/** L'ÉTAT ET SA TABLE D'ANCRES, composés ENSEMBLE : le rang écrit dans un bloc et la clé de
 *  la table sortent de la MÊME variable. */
interface EtatCompose {
	readonly blocs: readonly string[]
	readonly ancres: ReadonlyMap<RangInjecte, string>
}

/**
 * L'ASSEMBLEUR — ONZE SORTES DE BLOCS, DANS CET ORDRE, séparés par une ligne vide :
 *  1. le CANON — `canon.ton`, `canon.interdits_ton[]`, `canon.partage.accroche_joueur`,
 *     chacun QUAND ÉCRIT, sous son chemin (précédent des sept rôles) ;
 *  2. `AUPARAVANT` — le résumé, s'il existe ;
 *  3. `A CONDENSER` — une ligne par pas de la tranche due, SEULEMENT si elle est due ;
 *  4. `RECEMMENT` — une ligne par pas de `(borneDeFenetre(t), t−1]` ;
 *  5. `ETABLI` — une ligne par fait de `faitsPertinents` ;
 *  6. `ICI A1` — la `description` du lieu courant (REQUISE), puis son `ambiance` ;
 *  7. `CE PAS` — le libellé du geste joué (`COMMANDES[origine].label`, le contrat narratif
 *     de KR-269), puis UNE ligne par effet APPLIQUÉ au pas courant, `<amorce> — <prose>`,
 *     ou `<amorce> A<n> — <prose>` pour un objet ; `aucun changement` si aucun effet ne
 *     s'est appliqué. Un effet `'sans_effet'` n'est JAMAIS raconté (KR-247) ;
 *  8-9. `EN SA POSSESSION` (`A<n> — <prose>`) puis `DEJA ACCOMPLI` — la `description_joueur`
 *     des objets possédés, l'énoncé des jalons atteints (via `projeterJalonsAtteints`,
 *     KR-246). Pas une ligne, pas de bloc — jamais un bloc vide ;
 *  10. `saisie` — la saisie du joueur, EN DERNIER, normalisée (`trim` puis espaces
 *     collapsés) : elle ne peut pas imiter un bloc sur sa propre ligne.
 * L'ÉTAT VIENT APRÈS LA MÉMOIRE : ce que la demande dit d'ici et de maintenant prime sur
 * ce qu'elle rappelle d'avant, et l'invite le dit.
 *
 * AU-DELÀ DU BUDGET, LA CASCADE (it4, voir la tête de fichier) : P0 → P1 → P2 → P3 sur la
 * mémoire, puis P4 sur l'inventaire. P0 compose les mêmes blocs, dans le même ordre, avec
 * les mêmes rangs qu'à l'it3 : les témoins de l'it3, tous au palier P0, passent inchangés.
 *
 * REFUS, AVANT tout `fetch`, dans cet ORDRE :
 *   `cible-a-ecrire` — le lieu courant ne résout pas, ou sa `description` est absente ou
 *     marquée : raconter sans scène reviendrait à INVENTER le lieu ;
 *   `trop-long` — MÊME le dernier palier, P4 à son suffixe minimal, dépasse
 *     `BUDGET_CARACTERES_NARRATEUR`.
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES ici, et c'est délibéré : aucun
 * champ du canon n'est requis, et ce rôle n'a aucun ensemble à épuiser. Les écrire serait
 * du code mort présenté comme de la couverture (KR-235).
 */
export function assemblerNarrateur(dossier: Dossier, cible: CibleNarrateur): ContexteNarrateur {
	const { session } = cible

	// ── LE LIEU COURANT EST REQUIS, et il porte TOUJOURS l'ancre `A1` ────────────
	const lieu = dossier.monde.lieux.find((candidat) => candidat.id === session.monde.lieu_courant)
	const description = lieu === undefined ? [] : textesRediges(lieu, CHEMIN_DESCRIPTION_LIEU, PREFIXE_LIEU)
	if (lieu === undefined || description.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	const ambiance = textesRediges(lieu, CHEMIN_AMBIANCE_LIEU, PREFIXE_LIEU)

	// ── CE PAS — DÉRIVÉ du journal, jamais stocké (KR-013) ───────────────────────
	// Seules les entrées du pas COURANT sont lues ici : l'horloge SÉLECTIONNE, elle n'est
	// jamais injectée.
	const jalonsAtteints = projeterJalonsAtteints(dossier, session.monde)
	const duPas = session.journal.filter((entree) => entree.tour === session.horloge.tour)
	const gestes = duPas.flatMap((entree) => (entree.origine === undefined ? [] : [COMMANDES[entree.origine].label]))
	const appliques = duPas.flatMap((entree) => (entree.deltas ?? []).filter((delta) => delta.effet === 'applique'))

	// ── CE QU'IL A SUR LUI — les seuls objets RÉDIGÉS, dans l'ordre d'ACQUISITION ─────
	const possessions: Possession[] = session.monde.objets_possedes.flatMap((id) => {
		const proses = proseDObjet(dossier, id)
		return proses.length === 0 ? [] : [{ id, proses }]
	})

	/**
	 * L'ÉTAT, pour un inventaire GARDÉ — la liste entière de P0 à P3, un suffixe à P4 seul.
	 * `ICI` et `CE PAS` sont ancrés AVANT les possessions : leurs rangs ne dépendent jamais du
	 * suffixe, donc `CE PAS` est identique à TOUS les paliers, et un objet obtenu à ce pas —
	 * possédé aussi — garde le MÊME rang dans les deux blocs. Un objet écarté par P4 n'a
	 * AUCUN rang : on n'ancre pas ce qu'on ne montre pas.
	 */
	const composerEtat = (gardees: readonly Possession[]): EtatCompose => {
		const ancres = new Map<RangInjecte, string>()
		const rangs = new Map<string, RangInjecte>()
		const ancrer = (id: string): RangInjecte => {
			const deja = rangs.get(id)
			if (deja !== undefined) return deja
			const rang = `A${ancres.size + 1}`
			ancres.set(rang, id)
			rangs.set(id, rang)
			return rang
		}
		const blocs: string[] = []
		pousser(blocs, `${EN_TETE_ICI} ${ancrer(lieu.id)}`, [...description, ...ambiance])
		const changements = appliques.flatMap((delta) => {
			const lecture = LECTURE_DES_EFFETS[delta.delta]
			const cibleDuDelta = delta.cibles[0]
			return lecture.lire(dossier, jalonsAtteints, cibleDuDelta).map((prose) => {
				const reperee = lecture.ancrable ? `${lecture.amorce} ${ancrer(cibleDuDelta)}` : lecture.amorce
				return `${reperee} — ${prose}`
			})
		})
		pousser(blocs, EN_TETE_CE_PAS, [...gestes, ...(appliques.length === 0 ? [AUCUN_CHANGEMENT] : changements)])
		pousser(
			blocs,
			EN_TETE_POSSESSIONS,
			gardees.flatMap(({ id, proses }) => proses.map((prose) => `${ancrer(id)} — ${prose}`)),
		)
		pousser(
			blocs,
			EN_TETE_ACCOMPLI,
			jalonsAtteints.flatMap((jalon) => textesRediges(jalon, 'enonce', '')),
		)
		return { blocs, ancres }
	}

	// ── LA MÉMOIRE — projetée depuis `dossier/memoire.ts`, jamais décidée ici ────
	// Tout est lu UNE fois ; les paliers ne font que CHOISIR parmi ces lignes.
	const resume = replier(session.memoire?.resume?.texte ?? '')
	const due = pasACondenser(session)
	const aCondenser = due === null ? [] : lignesDesPas(session, due.de, due.a)
	const recentes = lignesDesPas(session, borneDeFenetre(session.horloge.tour) + 1, session.horloge.tour - 1)
	const etabli = faitsPertinents(session).map((fait) => replier(fait.fait))

	// ── LE CANON, global, optionnel — en tête ─────────────────────────────────
	const canon: string[] = []
	for (const chemin of CHEMINS_DU_CANON) pousser(canon, chemin, textesRediges(dossier, chemin, ''))

	// ── LA SAISIE, EN DERNIER, normalisée ──────────────────────────────────────
	const saisie = `${EN_TETE_SAISIE}\n${cible.saisie.trim().replace(/\s+/g, ' ')}`

	/** LE TEXTE D'UN PALIER — la mémoire que le palier envoie, sur l'état qu'on lui donne.
	 *  `condensation` suit le bloc : non nulle si et seulement si la tranche PART. */
	const composer = (palier: PalierDeMemoire, etat: EtatCompose): ContexteNarrateurRendu => {
		const condensation = palier.aCondenser ? due : null
		const memoire: string[] = []
		pousser(memoire, EN_TETE_AUPARAVANT, palier.auparavant && resume !== '' ? [resume] : [])
		if (condensation !== null) pousser(memoire, EN_TETE_A_CONDENSER, aCondenser)
		pousser(
			memoire,
			EN_TETE_RECEMMENT,
			palier.recemmentAuPlancher
				? recentes.slice(Math.max(0, recentes.length - LIGNES_RECENTES_AU_PLANCHER))
				: recentes,
		)
		pousser(memoire, EN_TETE_ETABLI, etabli)
		const texte = [...canon, ...memoire, ...etat.blocs, saisie].join(SEPARATEUR_DE_BLOCS)
		return { ok: true, texte, ancres: etat.ancres, condensation }
	}
	const tient = (essai: ContexteNarrateurRendu): boolean => essai.texte.length <= BUDGET_CARACTERES_NARRATEUR

	// ── P0 À P3 — la mémoire seule se réduit ; l'état est le MÊME, inventaire entier ─
	const etatEntier = composerEtat(possessions)
	for (const palier of PALIERS_DE_MEMOIRE) {
		const essai = composer(palier, etatEntier)
		if (tient(essai)) return essai
	}

	// ── P4, DERNIER RECOURS — le plus long SUFFIXE de l'inventaire qui tient ───────
	// JAMAIS VIDE : un bloc absent dirait « il n'a rien », ce que le moteur dément. Et il
	// porte TOUT objet que `CE PAS` désigne, lu du registre des effets (`ancrable`) et jamais
	// d'un identifiant d'effet : ce que le pas vient de donner reste dans ce qu'il a sur lui,
	// au même rang. Moins que ce suffixe-là ne tient pas : `trop-long`.
	const designes = new Set(
		appliques.filter((delta) => LECTURE_DES_EFFETS[delta.delta].ancrable).map((delta) => delta.cibles[0]),
	)
	const premierDesigne = possessions.findIndex((possession) => designes.has(possession.id))
	const suffixeMinimal = Math.max(1, premierDesigne === -1 ? 0 : possessions.length - premierDesigne)
	for (let gardees = possessions.length - 1; gardees >= suffixeMinimal; gardees -= 1) {
		const essai = composer(PLANCHER_DE_MEMOIRE, composerEtat(possessions.slice(possessions.length - gardees)))
		if (tient(essai)) return essai
	}

	// On refuse, on ne coupe pas (KR-230).
	return { ok: false, motif: 'trop-long' }
}
