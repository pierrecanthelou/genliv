/**
 * L'ASSEMBLEUR DU HUITIÈME RÔLE — `narrateur` (n° 10 `moteur-interprete`, it2).
 *
 * Il compose ce que le narrateur VOIT pour raconter UN pas DÉJÀ JOUÉ : la session
 * reçue est celle d'APRÈS l'exécution, déjà persistée. Rien ici n'écrit l'état.
 *
 * ⚠ COMME L'INTERPRÈTE, CE RÔLE NE PASSE PAS PAR `./registres.ts` : ces registres sont
 * `Record<RoleCopilote, …>`, et `RoleCopilote` n'est pas étendu aux rôles de JEU. Ce
 * module porte donc SA liste de chemins (`CHAMPS_INJECTES_NARRATEUR`) et SA borne
 * (`BUDGET_CARACTERES_NARRATEUR`), hors de la parité auteur de
 * `worker/frontiere.test.ts` — LA MÊME DOCTRINE pour autant : refus AVANT tout
 * `fetch`, jamais de troncature, silence sur un champ non rédigé plutôt qu'une
 * affirmation.
 *
 * ── SANS ÉTAT (it2), ET C'EST LE CONTRAT LE PLUS LOURD DE CE FICHIER ──────────────
 * AUCUNE MÉMOIRE, AUCUN RÉCIT PASSÉ, AUCUNE `attente`, AUCUNE ENTRÉE DE JOURNAL HORS DU
 * PAS COURANT, AUCUN NOMBRE (ni l'horloge, ni la graine). Le pas courant est DÉRIVÉ des
 * entrées de `session.journal` dont `tour` vaut `horloge.tour` — jamais stocké, jamais
 * passé à côté (KR-013). Conséquence testée : même monde et même pas au pas 2 et au
 * pas 40 ⇒ contexte IDENTIQUE. Le contexte croît avec le DOSSIER, jamais avec la durée
 * de la partie.
 *
 * ── CE QUI N'ENTRE JAMAIS ───────────────────────────────────────────────────────
 * Un identifiant ou un rang (rien, dans ce rôle, ne désigne rien) · `Entite.nom`
 * (KR-262 — un lieu se dit par sa `description`) · toute donnée de personnage (n° 12) ·
 * `canon.mj.synopsis_mj` (le narrateur conduirait vers l'intrigue à venir) ·
 * `monde.lieux[].dangers` (un danger raconté appelle un jet que personne ne résout
 * avant la n° 11) · `monde.indices[].verite` (la solution) · `lieux[].acces` (la carte) ·
 * les deux proses émises verbatim (`texte_ouverture_joueur`, `fins[].texte`).
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
 * `design_reference` (spec de la feature) était un décompte sans liste écrite.
 */
import { COMMANDES } from '../../dossier/commandes'
import type { DeltaId } from '../../dossier/deltas'
import { projeterJalonsAtteints, type JalonAtteint } from '../../dossier/evaluate'
import type { Dossier } from '../../dossier/types'
import type { CibleNarrateur } from '../types'
import { textesRediges, type MotifRefusContexte } from './noyau'

/**
 * LA BORNE DE REFUS DU CONTEXTE, EN CARACTÈRES (`String.length`) — refus `'trop-long'`
 * AVANT tout `fetch`, jamais une coupe. Formule du registre auteur :
 * `ceil(M × 3 / 1000) × 1000`, le facteur 3 et l'arrondi au millier étant LA marge.
 *
 * MESURÉ le 2026-09-29 (it2) par `contexte.test.ts`, au PIRE CAS sur
 * `dossier-reference.json` : le lieu décrit dont `description` + `ambiance` est le plus
 * long (`lieu.foyer-du-guet`), le geste au libellé le plus long, TOUS les objets donnés,
 * TOUS les indices révélés et TOUS les jalons atteints AU PAS COURANT, TOUS les objets
 * possédés et TOUS les jalons déjà atteints, une saisie de `SAISIE_CARACTERES_MAX` (300)
 * caractères. Protocole de l'it1 : on asserte d'abord que les HUIT chemins injectés
 * résolvent non vides, sans quoi `M` serait un PLANCHER et non une mesure.
 * M = 1918 ⇒ ceil(1918 × 3 / 1000) × 1000 = 6000.
 *
 * ⚠ LA VALEUR COÏNCIDE AVEC CELLE DE `personnage-prose` (6000, `./registres.ts`), ET ELLE
 * N'EN EST PAS RECOPIÉE : `M` vaut 1783 là-bas et 1918 ici, deux mesures indépendantes
 * qui tombent dans le même millier après arrondi. C'est écrit parce que la coïncidence
 * invite précisément à la recopie (KR-235) ; `contexte.test.ts` constate que les deux
 * `M` diffèrent.
 *
 * HORS DE `BUDGET_CARACTERES_CONTEXTE` (`./registres.ts`), et c'est délibéré : ce
 * registre est `Record<RoleCopilote, number>`, et y entrer ferait entrer le narrateur
 * dans la parité AUTEUR. L'it4 absorbera cette borne dans LA constante unique de
 * KR-261 — jamais une seconde constante à côté.
 *
 * ⚠ RISQUE PORTÉ À L'IT4, écrit plutôt que découvert : dans une partie, le refus est
 * MONOTONE — une fois franchi par l'inventaire, il ne se lève plus, et la dégradation en
 * cascade (suggestions, fenêtre, faits) n'atteint pas le bloc des possessions. Borner
 * maintenant exigerait un ordre des possessions que rien ne spécifie.
 *
 * Exportée par `./index.ts` pour `worker/frontiere.test.ts` SEULEMENT — jamais par
 * `brain/index.ts` : aucune feature n'assemble un contexte elle-même.
 */
export const BUDGET_CARACTERES_NARRATEUR = 6000

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
 * LES EN-TÊTES DES BLOCS — des mots d'ASSEMBLAGE, sans accent (précédent `DEJA ECRIT`),
 * jamais un nom de champ du document ni un rang. `ICI` et `saisie` sont ceux de
 * l'interprète : le même lieu et la même saisie se nomment de la même façon aux deux
 * rôles.
 */
const EN_TETE_ICI = 'ICI'
const EN_TETE_CE_PAS = 'CE PAS'
const EN_TETE_POSSESSIONS = 'EN SA POSSESSION'
const EN_TETE_ACCOMPLI = 'DEJA ACCOMPLI'
const EN_TETE_SAISIE = 'saisie'

/**
 * LA LIGNE DU PAS SANS EFFET APPLIQUÉ — ÉCRITE, jamais omise : un bloc « ce pas » vide
 * laisserait le modèle deviner, et deviner ce qui a changé est précisément ce que ce
 * rôle n'a pas le droit de faire. Elle ne s'écrit QUE si AUCUN effet n'a été appliqué :
 * un effet appliqué mais NON RÉDIGÉ (un objet sans `description_joueur`) se TAIT — la
 * phrase « aucun changement » serait alors une affirmation fausse.
 */
const AUCUN_CHANGEMENT = 'aucun changement'

/** Ce que le narrateur lit d'un effet de règle appliqué au pas courant : le SENS du
 *  changement pour le héros (`amorce`, un verbe à la troisième personne du présent,
 *  même forme que les libellés de geste — KR-269), et les proses rédigées de sa cible,
 *  zéro, une ou plusieurs. */
interface LectureDEffet {
	readonly amorce: string
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
 * personne n'a décidé ce que le narrateur en lit. Jamais un `switch` sur l'identifiant.
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
	donner_objet: { amorce: 'obtient', lire: (dossier, _jalons, cible) => proseDObjet(dossier, cible) },
	retirer_objet: { amorce: "n'a plus", lire: (dossier, _jalons, cible) => proseDObjet(dossier, cible) },
	reveler_indice: {
		amorce: 'remarque',
		lire: (dossier, _jalons, cible) => {
			const indice = dossier.monde.indices.find((candidat) => candidat.id === cible)
			// `formulation_joueur` SEULE, jamais `verite` : ce que le joueur perçoit, pas la
			// solution (condition d'état, n° 12).
			return indice === undefined ? [] : textesRediges(indice, CHEMIN_INDICE, PREFIXE_INDICE)
		},
	},
	atteindre_jalon: {
		amorce: 'accomplit',
		lire: (_dossier, jalons, cible) =>
			jalons.filter((jalon) => jalon.jalon_id === cible).flatMap((jalon) => textesRediges(jalon, 'enonce', '')),
	},
}

export type ContexteNarrateur =
	| { readonly ok: true; readonly texte: string }
	| ({ readonly ok: false } & MotifRefusContexte)

/**
 * L'ASSEMBLEUR — CINQ SORTES DE BLOCS, DANS CET ORDRE, séparés par une ligne vide :
 *  1. le CANON — `canon.ton`, `canon.interdits_ton[]`, `canon.partage.accroche_joueur`,
 *     chacun QUAND ÉCRIT, sous son chemin (précédent des sept rôles) ;
 *  2. `ICI` — la `description` du lieu courant (REQUISE), puis son `ambiance` ;
 *  3. `CE PAS` — le libellé du geste joué (`COMMANDES[origine].label`, le contrat
 *     narratif de KR-269), puis UNE ligne par effet APPLIQUÉ au pas courant, sous la
 *     forme `<amorce> — <prose de sa cible>` (`LECTURE_DES_EFFETS`) ; `aucun changement`
 *     si aucun effet ne s'est appliqué. Un effet `'sans_effet'` n'est JAMAIS raconté
 *     (KR-247) ;
 *  4. `EN SA POSSESSION` puis `DEJA ACCOMPLI` — la `description_joueur` des objets
 *     possédés, l'énoncé des jalons atteints (via `projeterJalonsAtteints`, KR-246).
 *     Pas une ligne, pas de bloc — jamais un bloc vide ;
 *  5. `saisie` — la saisie du joueur, EN DERNIER, normalisée (`trim` puis espaces
 *     collapsés) : elle ne peut pas imiter un bloc sur sa propre ligne. Même
 *     normalisation que l'interprète, réécrite plutôt qu'importée (elle y est privée, et
 *     ce module-là n'appartient pas à ce lot).
 *
 * REFUS, AVANT tout `fetch`, dans cet ORDRE :
 *   `cible-a-ecrire` — le lieu courant ne résout pas, ou sa `description` est absente ou
 *     marquée : raconter sans scène reviendrait à INVENTER le lieu ;
 *   `trop-long` — le texte assemblé dépasse `BUDGET_CARACTERES_NARRATEUR`.
 * ⚠ `'a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES ici, et c'est délibéré :
 * aucun champ du canon n'est requis, et ce rôle n'a aucun ensemble à épuiser. Les
 * écrire serait du code mort présenté comme de la couverture (KR-235).
 */
export function assemblerNarrateur(dossier: Dossier, cible: CibleNarrateur): ContexteNarrateur {
	const { session } = cible
	const blocs: string[] = []

	// ── 1. LE CANON, global, optionnel ────────────────────────────────────────
	for (const chemin of CHEMINS_DU_CANON) {
		const textes = textesRediges(dossier, chemin, '')
		if (textes.length > 0) blocs.push(`${chemin}\n${textes.join('\n')}`)
	}

	// ── 2. ICI — la description du lieu courant est REQUISE ─────────────────────
	const lieu = dossier.monde.lieux.find((candidat) => candidat.id === session.monde.lieu_courant)
	const description = lieu === undefined ? [] : textesRediges(lieu, CHEMIN_DESCRIPTION_LIEU, PREFIXE_LIEU)
	if (lieu === undefined || description.length === 0) return { ok: false, motif: 'cible-a-ecrire' }
	const ambiance = textesRediges(lieu, CHEMIN_AMBIANCE_LIEU, PREFIXE_LIEU)
	blocs.push(`${EN_TETE_ICI}\n${[...description, ...ambiance].join('\n')}`)

	// ── 3. CE PAS — DÉRIVÉ du journal, jamais stocké (KR-013) ───────────────────
	// Seules les entrées du pas COURANT sont lues : l'horloge SÉLECTIONNE, elle n'est
	// jamais injectée, et aucune entrée d'un pas antérieur — ni son récit — n'entre.
	const jalonsAtteints = projeterJalonsAtteints(dossier, session.monde)
	const duPas = session.journal.filter((entree) => entree.tour === session.horloge.tour)
	const gestes = duPas.flatMap((entree) => (entree.origine === undefined ? [] : [COMMANDES[entree.origine].label]))
	const appliques = duPas.flatMap((entree) => (entree.deltas ?? []).filter((delta) => delta.effet === 'applique'))
	const changements = appliques.flatMap((delta) => {
		const lecture = LECTURE_DES_EFFETS[delta.delta]
		return lecture.lire(dossier, jalonsAtteints, delta.cibles[0]).map((prose) => `${lecture.amorce} — ${prose}`)
	})
	const lignesDuPas = [...gestes, ...(appliques.length === 0 ? [AUCUN_CHANGEMENT] : changements)]
	blocs.push(`${EN_TETE_CE_PAS}\n${lignesDuPas.join('\n')}`)

	// ── 4. OÙ EN EST LE HÉROS — ce qu'il a sur lui, ce qu'il a déjà accompli ────
	const possessions = session.monde.objets_possedes.flatMap((id) => proseDObjet(dossier, id))
	if (possessions.length > 0) blocs.push(`${EN_TETE_POSSESSIONS}\n${possessions.join('\n')}`)
	const accomplis = jalonsAtteints.flatMap((jalon) => textesRediges(jalon, 'enonce', ''))
	if (accomplis.length > 0) blocs.push(`${EN_TETE_ACCOMPLI}\n${accomplis.join('\n')}`)

	// ── 5. LA SAISIE, EN DERNIER, normalisée ──────────────────────────────────
	blocs.push(`${EN_TETE_SAISIE}\n${cible.saisie.trim().replace(/\s+/g, ' ')}`)

	const texte = blocs.join('\n\n')
	// On refuse, on ne coupe pas (KR-230).
	if (texte.length > BUDGET_CARACTERES_NARRATEUR) return { ok: false, motif: 'trop-long' }

	return { ok: true, texte }
}
