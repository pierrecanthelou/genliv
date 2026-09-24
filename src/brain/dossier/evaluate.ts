import { DELTAS, DELTA_DU_JALON_ATTEINT, type Delta, type DeltaId } from './deltas'
import type { ExprNode } from './expr'
import type { FaitsDeSession } from './faits'
import { PREDICATES } from './predicates'
import type { Dossier } from './types'

/**
 * L'ÉVALUATEUR BIVALENT — ce qu'une condition VAUT contre un état RÉEL, et ce que
 * le moteur ÉCRIT quand elle devient vraie.
 *
 * TROIS LECTEURS D'ARBRE, ET CELUI-CI EST LE QUATRIÈME FICHIER (KR-237) :
 * `expr.ts` décide ce QU'EST un nœud sur de l'`unknown` ; `atteignabilite.ts`
 * décide « ce fait peut-il un JOUR être établi ? » ; `tourzero.ts` décide « l'est-il
 * DÉJÀ, avant la première action ? », TRIVALENT et sur un DOCUMENT sans état.
 * Celui-ci décide « l'est-il MAINTENANT ? », BIVALENT et sur un état réel. La
 * duplication apparente est la bonne réponse : fusionner les deux sémantiques
 * supprimerait l'indécidable, dont dépend la direction d'erreur du linter.
 *
 * ⚠ IL LÈVE SUR UNE ENTRÉE NON RECONNUE, IL NE REND JAMAIS `false` (KR-238). Sous
 * un `non`, un repli en `false` produit `true` — un FAUX POSITIF sur une condition
 * de FIN, c'est-à-dire la seule direction d'erreur que cette couche s'interdise.
 * AUCUN `catch` ne l'entoure, nulle part : il rouvrirait exactement le faux positif
 * que ce choix ferme. La parade est EN AMONT — la porte `jouable` des contrôles,
 * vérifiée au montage du shell (KR-239) —, et les docstrings des appelants
 * qualifient leur totalité en conséquence.
 *
 * AUCUN IDENTIFIANT DE REGISTRE EN CHAÎNE dans ce fichier : la résolution passe
 * par `PREDICATES[p].lit` et `DELTAS[d].ecrit`, jamais par un aiguillage au site
 * d'appel (KR-117). La seule clé d'effet dont ce module a besoin —
 * `atteindre_jalon` — voyage par `DELTA_DU_JALON_ATTEINT`, depuis son domicile.
 *
 * IL N'IMPORTE NI `session.ts` NI `commandes.ts` : ce sont EUX qui l'appellent.
 *
 * MODULE PUR, sans dépendance de service : il part avec `src/player/` le jour de
 * l'extraction (`docs/EXIGENCE-APERCU-DU-JEU.md` § 6).
 */

/**
 * UN EFFET DEMANDÉ ET CE QU'IL A OBSERVÉ (KR-247). Sans `effet`, « pas demandé »
 * et « demandé sans effet » seraient indistinguables dans le journal, et la
 * seconde lecture d'un rapport de partie mentirait sans que rien ne rougisse.
 *
 * SANS `origine` : la cause vit sur l'ENTRÉE de journal (`EntreeJournal.origine`,
 * itération 2), et la redire ici en ferait un dérivé stocké (KR-013).
 */
export interface DeltaJournalise {
	readonly delta: DeltaId
	readonly cibles: readonly string[]
	/** `'sans_effet'` est DÉRIVÉ PAR `===` sur la référence rendue par `ecrit`, jamais déclaré. */
	readonly effet: 'applique' | 'sans_effet'
}

/**
 * UN JALON ATTEINT PAR LA PASSE, et les effets que sa résolution a produits — la
 * pastille `atteindre_jalon` D'ABORD, celles de son `effet[]` ensuite, parce que
 * c'est l'ordre causal.
 *
 * INTERNE AU MODULE au sens du baril : `brain/index.ts` n'en sort rien. Ce que la
 * feature reçoit est une `EntreeJournal` déjà composée.
 */
export interface JalonResolu {
	readonly jalon_id: string
	readonly deltas: readonly DeltaJournalise[]
}

/**
 * CE QUE LA PASSE REND. `atteints` porte SES PROPRES deltas : une seconde liste
 * plate, à côté, serait la même donnée écrite deux fois (KR-013), et un appelant
 * qui lirait la plate perdrait le seul regroupement qui permette UNE ligne de
 * journal PAR JALON.
 *
 * `atteints` VIDE ⇒ `faits` est la MÊME RÉFÉRENCE que l'entrée. C'est ce qui autorise
 * `commandes.ts` à rendre sa session telle quelle sans rien perdre — un appelant ne
 * doit pas avoir à le déduire du corps de la passe (encapsulation, KR-169).
 */
export interface ResolutionJalons {
	readonly faits: FaitsDeSession
	readonly atteints: readonly JalonResolu[]
}

/**
 * LA PROJECTION D'UN JALON ATTEINT — SON ÉNONCÉ, ET RIEN D'AUTRE (KR-246).
 *
 * TYPE NOMINAL, jamais un `Jalon` filtré, un `Pick<Jalon, …>` ni un
 * `Partial<Jalon>` : ces trois formes se ré-élargissent d'un mot en revue, et le
 * mot en question ferait entrer `declencheur_texte` (audience `auteur`) ou
 * `declencheur_expr` (la règle elle-même) dans un contexte de modèle.
 *
 * AUDIENCE HÉRITÉE, ÉCRITE ICI PARCE QU'AUCUNE TABLE NE LA PORTE : `jalon_id` est
 * un HANDLE (`'moteur'`), `enonce` est la prose `'ia'` de
 * `charpente.jalons[].enonce_texte`, ouverte PAR l'appartenance à
 * `monde.jalons_atteints[]` et par rien d'autre. Aucune ligne dans
 * `sessionDestinations.ts` : c'est une valeur de RETOUR, pas un champ persisté.
 */
export interface JalonAtteint {
	readonly jalon_id: string
	readonly enonce: string
}

/**
 * LE BRAS QUI NE DOIT JAMAIS ÊTRE PRIS, FERMÉ PAR LE COMPILATEUR — un cinquième
 * opérateur ajouté à `ExprNode` casse `tsc` à CET appel, et nulle part ailleurs.
 *
 * ELLE REND `boolean` EN POSITION DE RETOUR, ET SURTOUT PAS `never` : la garde de
 * couture d'`expr.test.ts` compte les fermetures en appariant le deux-points suivi
 * du mot, si bien qu'un retour ainsi typé produirait DEUX appariements pour UNE
 * seule fermeture et fausserait le compte qu'elle tient. Même raison, même geste
 * que `tourzero.ts`.
 *
 * ELLE LÈVE, et c'est le contrat (KR-238) : le seul repli disponible ici serait
 * `false`, qui devient `true` sous un `non`.
 */
function jamaisEvalue(operateur: never): boolean {
	throw new Error(`condition non reconnue par le moteur : ${JSON.stringify(operateur)}`)
}

/**
 * CE QU'UNE CONDITION VAUT CONTRE DES FAITS — PURE, BIVALENTE, et TOTALE sur un
 * `ExprNode` issu d'un dossier accepté par `validateDossier`. Hors de cette
 * précondition, elle LÈVE (KR-238/239), et c'est délibéré.
 *
 * AUCUNE BORNE DE RÉCURSION PROPRE : c'est `PROFONDEUR_MAX_EXPR` chez le
 * validateur qui la lui garantit — l'absolu est qualifié à dessein (KR-169).
 *
 * AUCUNE MÉMOÏSATION, AUCUN CACHE (KR-013/113) : elle se recalcule à chaque appel.
 */
export function evaluerExpr(faits: FaitsDeSession, noeud: ExprNode): boolean {
	switch (noeud.op) {
		case 'predicat':
			return PREDICATES[noeud.predicat].lit(faits, noeud.cibles)
		case 'non':
			return !evaluerExpr(faits, noeud.enfant)
		case 'et':
			return noeud.enfants.every((enfant) => evaluerExpr(faits, enfant))
		case 'ou':
			return noeud.enfants.some((enfant) => evaluerExpr(faits, enfant))
		// L'UNION EST CLOSE, et c'est le compilateur qui le dit.
		default:
			return jamaisEvalue(noeud)
	}
}

/**
 * APPLIQUER UN EFFET — PURE, et TOTALE **sur un `Delta` accepté par `validateDelta`** :
 * hors de cette précondition elle LÈVE, même régime que `evaluerExpr` (KR-238/239) —
 * `DELTAS[delta.delta]` sur une clé inconnue, et une arité fautive pousserait
 * `undefined` dans une liste de faits. Elle rend les faits NEUFS avec le constat de
 * ce qui s'est passé.
 *
 * `effet` EST DÉRIVÉ PAR `===`, jamais déclaré : le descripteur rend la MÊME
 * RÉFÉRENCE quand rien ne change, donc « sans effet » est une MESURE et non une
 * promesse. Un descripteur qui rendrait toujours un objet neuf ferait de ce champ
 * un mensonge sans qu'aucune signature ne bouge.
 *
 * `cibles` est COPIÉE : le journal est un CONSTAT (KR-248), et il ne doit pas
 * partager de tableau avec le dossier dont il vient.
 */
export function appliquerDelta(
	faits: FaitsDeSession,
	delta: Delta,
): { readonly faits: FaitsDeSession; readonly journalise: DeltaJournalise } {
	const apres = DELTAS[delta.delta].ecrit(faits, delta.cibles)
	return {
		faits: apres,
		journalise: {
			delta: delta.delta,
			cibles: [...delta.cibles],
			effet: apres === faits ? 'sans_effet' : 'applique',
		},
	}
}

/**
 * LA PASSE DES JALONS — UN CORPS, DEUX APPELANTS : `ouvrirSession` (avant la
 * première action) et `executerCommande` (après CHAQUE commande ACCEPTÉE ; un
 * refus n'appelle rien, il n'a rien changé au monde).
 *
 * POINT FIXE BORNÉ, PAS UNE BOUCLE QUI ESPÈRE CONVERGER : un jalon atteint n'est
 * jamais réévalué, donc chaque passe qui sert ajoute au moins un identifiant à
 * `jalons_atteints`, qui ne perd jamais rien. Le nombre de jalons du dossier est
 * donc une BORNE, pas une estimation — et la terminaison est un compteur, pas une
 * promesse. La reboucle est nécessaire : un jalon peut n'être déclenchable que par
 * l'effet d'un autre, et l'ordre du document ne dit rien de l'ordre causal.
 *
 * UN JALON SANS `declencheur_expr` N'EST JAMAIS ATTEINT AUTOMATIQUEMENT : son
 * absence est un état calme (`types.ts`), un moteur d'événement le cochera.
 *
 * `jalons_atteints` N'A QU'UN ÉCRIVAIN — `DELTAS.atteindre_jalon.ecrit`. Cette
 * fonction ne l'étend JAMAIS en direct : elle DEMANDE l'effet comme n'importe quel
 * autre, et c'est ce qui rend son idempotence observable (KR-013, KR-117).
 *
 * AUCUNE MÉMOÏSATION (KR-013/113).
 *
 * PORTÉE EXACTE DE L'UNICITÉ, mesurée — la version large de cette phrase était
 * FAUSSE DANS SES DEUX MOITIÉS, et `evaluate.test.ts` le disait déjà : DANS
 * `src/brain/dossier/`, ce module est le seul à lire `.enonce_texte` et
 * `.declencheur_expr` — c'est CELA que la garde épingle, et c'est ce que KR-246
 * protège (la prose `'ia'` d'un jalon n'a qu'un chemin de sortie).
 * Ce n'est PAS « seul lecteur du dépôt » : `atteignabilite.ts:217` lit aussi
 * `.effet[]` (comme producteurs), et `dossier-registres/hooks/useEcritureJalons.ts`
 * lit `.enonce_texte` (surface d'écriture de l'auteur, légitime). Une docstring
 * qui sur-affirme ne rougit jamais — elle est la seule chose qu'un relecteur lira.
 */
export function resoudreJalons(dossier: Dossier, faits: FaitsDeSession): ResolutionJalons {
	const jalons = dossier.charpente.jalons
	const atteints: JalonResolu[] = []
	let courants = faits

	for (let passe = 0; passe < jalons.length; passe += 1) {
		let aProgresse = false

		for (const jalon of jalons) {
			if (jalon.declencheur_expr === undefined) continue
			if (courants.jalons_atteints.includes(jalon.id)) continue
			if (!evaluerExpr(courants, jalon.declencheur_expr)) continue

			// LA MARQUE D'ABORD, LES EFFETS ENSUITE — l'ordre CAUSAL, et c'est lui que
			// les pastilles du journal rendent.
			const demandes: Delta[] = [{ delta: DELTA_DU_JALON_ATTEINT, cibles: [jalon.id] }, ...jalon.effet]
			const deltas: DeltaJournalise[] = []
			for (const demande of demandes) {
				const applique = appliquerDelta(courants, demande)
				courants = applique.faits
				deltas.push(applique.journalise)
			}

			atteints.push({ jalon_id: jalon.id, deltas })
			aProgresse = true
		}

		if (!aProgresse) break
	}

	return { faits: courants, atteints }
}

/**
 * CE QU'UN MODÈLE POURRA VOIR DES JALONS ATTEINTS — leur handle et leur énoncé.
 *
 * ELLE BALAIE `jalons_atteints`, JAMAIS `charpente.jalons` FILTRÉ, et la
 * différence n'est pas cosmétique : le filtre rendrait l'ordre du DOCUMENT au lieu
 * de l'ordre où la partie les a atteints, et ferait DISPARAÎTRE en silence un
 * handle que le dossier ne porte plus.
 *
 * UN HANDLE PENDANT EST EXPOSÉ, JAMAIS FILTRÉ (KR-021) : un jalon atteint dont le
 * dossier a perdu l'entité rend un `enonce` VIDE — la ligne existe, et le trou se
 * voit. Ce que l'assembleur en fera est la décision de la n° 10 ; le taire ici la
 * lui retirerait.
 *
 * AUCUN CONSOMMATEUR EN ITÉRATION 3, ET ELLE NE SORT PAS DU BARIL : exporter une
 * valeur qui porte une prose `'ia'` à toutes les features ouvrirait le verbatim
 * sans qu'aucun test ne rougisse.
 */
export function projeterJalonsAtteints(dossier: Dossier, faits: FaitsDeSession): readonly JalonAtteint[] {
	return faits.jalons_atteints.map((jalon_id) => ({
		jalon_id,
		enonce: dossier.charpente.jalons.find((jalon) => jalon.id === jalon_id)?.enonce_texte ?? '',
	}))
}
