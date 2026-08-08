import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import { dossierKey, DOSSIER_KEY_PREFIX } from './persistenceKeys'
import type { Dossier } from './dossier/types'
import type { DossierIssue } from './dossier/issues'
import { inspectDossierFile, type DossierInspection } from './dossier/read'
import { validateDossier } from './dossier/validate'

/**
 * Le RÉSUMÉ de bibliothèque d'un dossier — ce que l'accueil affiche par carte,
 * et RIEN de plus. Union DISCRIMINÉE sur `lisible` : la branche illisible ne
 * porte PAS de `titre`, de sorte qu'une carte ne puisse pas en lire un qui
 * n'existe pas — c'est le typage qui l'interdit, pas une convention de rendu.
 *
 * AUCUN champ dérivé du CONTENU (nombre de personnages, de lieux, d'objectifs) :
 * compter imposerait un `get` par carte, donc une re-validation complète de
 * chaque dossier à chaque rendu de l'accueil. Les compteurs sont ceux des
 * SECTIONS, lus dans l'écran d'édition (n° 2, itération 3).
 */
export type DossierResume =
	| { id: string; lisible: true; titre: string; updatedAt: string }
	| { id: string; lisible: false }

/**
 * DossierService — le seul point d'entrée du dossier d'aventure dans
 * l'application. SIX méthodes : les quatre de la n° 1, plus `list` et `remove`
 * que la bibliothèque repointée câble ici (n° 2, itération 1). `create`,
 * `rename`, `duplicate` et `update` restent dehors tant que personne ne les
 * appelle — un service dont la moitié des méthodes n'est exercée par personne
 * est de la dette, pas un contrat.
 *
 * Il est ADDITIF : il vit sous ses propres clés (`genliv:dossier:`), ne lit ni
 * n'écrit aucun `Book`, et AUCUNE de ses fonctions ne convertit un `Book` en
 * `Dossier` ni l'inverse (KR-167).
 *
 * Trois invariants portent le reste :
 *  · `get` RE-VALIDE toujours et ne rend JAMAIS le brut du magasin. L'adoption
 *    cloud écrit derrière le service ; sans re-validation à la lecture, un
 *    document ni gelé ni validé entrerait dans l'application sans qu'un seul
 *    test rougisse.
 *  · La PRÉSENCE d'un dossier se constate par la CLÉ, jamais par `get` (BUG-048 /
 *    KR-179) — « présent » et « lisible » sont deux questions disjointes, et les
 *    confondre laisse un import écraser un document qu'un resserrement de schéma
 *    vient de rendre illisible.
 *  · Les événements partent APRÈS résolution de la persistance, dans l'ordre
 *    (KR-004) : un abonné à `dossier:created` trouve toujours le dossier déjà
 *    dans le magasin, un abonné à `dossier:deleted` ne l'y trouve déjà plus.
 */
export interface DossierService {
	/** Le dossier persisté, RE-VALIDÉ et gelé — `null` si absent ou non conforme. */
	get(id: string): Dossier | null
	/**
	 * Tous les dossiers persistés, énumérés par CLÉ et jamais par validité : un
	 * document devenu illisible reste LISTÉ (`lisible: false`), pour que l'auteur
	 * le voie et puisse le supprimer, plutôt que de disparaître en silence.
	 * Trié illisibles d'abord, puis `updatedAt` décroissant (égalité par `id`).
	 */
	list(): DossierResume[]
	/** Signale l'ouverture d'un dossier : arme la réconciliation cloud (KR-163). */
	open(id: string): void
	/** Lit un fichier, le valide, et l'importe s'il est conforme et pas déjà présent. */
	importDossier(fileText: string): DossierInspection
	/** Le document à écrire dans un fichier — re-validé, jamais le brut du magasin. */
	exportDossier(id: string): Dossier | null
	/**
	 * Supprime définitivement un dossier — y compris un dossier ILLISIBLE, dont
	 * l'identifiant resterait sinon occupé pour toujours. Retire la clé PUIS émet
	 * `dossier:deleted` (KR-004). Rend `true` si une clé a été retirée.
	 *
	 * ⚠ DETTE ÉPINGLÉE, PAS CORRIGÉE (KR-182) : la suppression ne va pas plus loin
	 * que le magasin LOCAL. `CloudSyncService.remove()` n'efface aucune clé
	 * distante et ne retire rien de la file de poussée — une écriture déjà en file
	 * REPUBLIE le document supprimé. Dette héritée, identique pour
	 * `BookService.deleteBook` depuis toujours ; un test de `DossierService.test.ts`
	 * en épingle le comportement actuel, pour qu'une suppression cloud soit un jour
	 * une décision et non une découverte.
	 */
	remove(id: string): boolean
}

/**
 * L'anomalie de MAGASIN — la seule que le validateur ne peut pas produire, parce
 * qu'il est pur et ignorant de la bibliothèque. Elle vit donc ici, au seul
 * endroit qui voit à la fois le fichier et ce qui est déjà importé.
 *
 * UN code, DEUX messages. La CAUSE est « cet identifiant est déjà occupé » ; la
 * lisibilité de l'occupant est une propriété de l'occupant, pas une seconde
 * cause — et la doctrine du registre est un code par CAUSE (`issues.ts`). Un
 * neuvième code coûterait l'union, le libellé, les décomptes de `validate.test.ts`,
 * pour un gain nul : la remédiation, elle, est désormais la MÊME dans les deux
 * cas (supprimer l'occupant depuis la bibliothèque, ou changer le champ `id`).
 */
function anomalieDejaImporte(id: string, occupant: Dossier | null): DossierIssue {
	return {
		code: 'dossier-deja-importe',
		severity: 'error',
		message:
			occupant === null
				? 'Un dossier illisible occupe déjà cet identifiant.'
				: `Un dossier portant cet identifiant est déjà dans votre bibliothèque : « ${occupant.titre} ».`,
		// OÙ : l'occupant résolu par son nom quand il en a un ; sinon par le seul
		// repère qu'il porte encore, son identifiant — celui-là même que la carte
		// « Dossier illisible » affiche à l'auteur.
		location: occupant === null ? `Dossier « ${id} »` : `Dossier « ${occupant.titre} »`,
		entityId: id,
		path: 'id',
	}
}

/**
 * L'ordre de la bibliothèque. Les ILLISIBLES D'ABORD : ce sont les seules cartes
 * qui demandent un geste, et une anomalie enterrée en bas de liste est une
 * anomalie qu'on n'a pas signalée. Puis `updatedAt` DÉCROISSANT — le dernier
 * travail de l'auteur en tête. Égalité départagée par `id`, ce qui donne aussi
 * son ordre à la tête de liste : deux illisibles n'ont pas de date à comparer,
 * et deux rendus successifs doivent montrer la même liste.
 */
function comparerResumes(a: DossierResume, b: DossierResume): number {
	if (a.lisible !== b.lisible) return a.lisible ? 1 : -1
	if (a.lisible && b.lisible) {
		const parDate = b.updatedAt.localeCompare(a.updatedAt)
		if (parDate !== 0) return parDate
	}
	return a.id.localeCompare(b.id)
}

export function createDossierService(persistence: PersistenceService, events: EventBus): DossierService {
	function get(id: string): Dossier | null {
		const brut = persistence.get<unknown>(dossierKey(id))
		if (brut === null) return null
		// Le magasin est une frontière de confiance (KR-116) : un document corrompu,
		// ou écrit derrière le service par l'adoption cloud, ne ressort jamais tel quel.
		return validateDossier(brut).dossier
	}

	/**
	 * L'identifiant est-il OCCUPÉ ? Question de PRÉSENCE, jamais de lisibilité
	 * (BUG-048 / KR-179). Elle se pose à la CLÉ elle-même — pas à `get`, qui
	 * re-valide, ni à `persistence.get`, qui rend déjà `null` sur un contenu que
	 * `JSON.parse` refuse. Les trois divergent exactement là où ça compte : sur un
	 * document rangé sous cette clé et devenu illisible. Une clé occupée par un
	 * illisible reste occupée — l'import ne l'écrase pas, `remove` la libère.
	 *
	 * `list` NE L'APPELLE PAS — elle ré-énumère `persistence.keys` avec son propre
	 * filtre `:` (les clés de contenu/image, n° 3-4, ne sont pas des dossiers).
	 * L'invariant qui compte reste vrai sans prédicat partagé : un `id` de dossier
	 * ne contient jamais `:` (forme validée), donc tout ce que `list` rend est
	 * supprimable par `remove`, qui lui passe bien par `cleOccupee`.
	 */
	function cleOccupee(id: string): boolean {
		return persistence.keys(DOSSIER_KEY_PREFIX).includes(dossierKey(id))
	}

	/** Le résumé d'une clé : la PRÉSENCE vient de la clé, la LISIBILITÉ de `get`. */
	function resume(id: string): DossierResume {
		const dossier = get(id)
		if (dossier === null) return { id, lisible: false }
		return { id, lisible: true, titre: dossier.titre, updatedAt: dossier.updatedAt }
	}

	return {
		get,

		list(): DossierResume[] {
			return (
				persistence
					.keys(DOSSIER_KEY_PREFIX)
					// `:` est RÉSERVÉ dans cet espace de clés (`persistenceKeys.ts`) au
					// découpage à venir — `dossierContentKey` / `dossierImageKey`, n° 3 et
					// n° 4. Une clé de contenu ou d'image n'est pas un dossier de plus dans
					// la bibliothèque : sans ce filtre, le premier porteur d'illustration
					// ferait apparaître des cartes fantômes « illisibles ».
					.filter((cle) => !cle.slice(DOSSIER_KEY_PREFIX.length).includes(':'))
					.map((cle) => resume(cle.slice(DOSSIER_KEY_PREFIX.length)))
					// `keys` rend un tableau neuf : ce tri ne mute aucun instantané partagé.
					.sort(comparerResumes)
			)
		},

		open(id: string): void {
			// Rien à ouvrir, rien à annoncer : un événement émis sur un dossier absent
			// enverrait la réconciliation cloud chercher une clé qui n'existe pas.
			if (get(id) === null) return
			events.emit('dossier:opened', { dossierId: id })
		},

		importDossier(fileText: string): DossierInspection {
			const inspection = inspectDossierFile(fileText)
			if (inspection.statut !== 'valid') return inspection

			const id = inspection.dossier.id
			if (cleOccupee(id)) {
				// Un import ne se substitue JAMAIS à un dossier déjà présent — lisible ou
				// non. C'est la correction de BUG-048 (KR-179) : la présence était
				// constatée par `get()`, qui RE-VALIDE, si bien qu'un document rangé sous
				// cette clé mais devenu illisible (it2 a durci le schéma 1 sans changer son
				// numéro, et chaque resserrement des n° 3 à n° 6 réarme le même piège)
				// rendait `null` et se faisait écraser en silence, avec le travail de
				// l'auteur. La lisibilité de l'occupant ne décide plus que du MESSAGE.
				return {
					statut: 'invalid',
					errors: [anomalieDejaImporte(id, get(id))],
					warnings: inspection.warnings,
				}
			}

			// La persistance d'abord, l'événement ensuite (KR-004).
			persistence.set(dossierKey(id), inspection.dossier)
			events.emit('dossier:created', { dossierId: id })
			return inspection
		},

		exportDossier(id: string): Dossier | null {
			// Même lecture re-validée que `get` : on n'écrit jamais dans un fichier un
			// document qu'on refuserait de relire.
			return get(id)
		},

		remove(id: string): boolean {
			// Constat par la CLÉ, jamais par `get` : un dossier devenu illisible doit
			// rester supprimable, sinon son identifiant reste occupé pour toujours et
			// l'auteur ne peut même plus réimporter le fichier corrigé. Même leçon que
			// « a corrupt book must still be deletable » côté `BookService.deleteBook`.
			if (!cleOccupee(id)) return false
			// La persistance d'abord, l'événement ensuite (KR-004) : un abonné à
			// `dossier:deleted` lit un magasin d'où la clé est DÉJÀ partie.
			persistence.remove(dossierKey(id))
			events.emit('dossier:deleted', { dossierId: id })
			return true
		},
	}
}
