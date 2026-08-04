import type { EventBus } from './EventBus'
import type { PersistenceService } from './PersistenceService'
import { dossierKey } from './persistenceKeys'
import type { Dossier } from './dossier/types'
import type { DossierIssue } from './dossier/issues'
import { inspectDossierFile, type DossierInspection } from './dossier/read'
import { validateDossier } from './dossier/validate'

/**
 * DossierService — le seul point d'entrée du dossier d'aventure dans
 * l'application. QUATRE méthodes, pas une de plus : `list`, `remove`, `create`,
 * `rename`, `duplicate` et `update` n'ont aucun appelant avant la n° 2, qui
 * repointera la bibliothèque. Un service dont la moitié des méthodes n'est
 * exercée par personne est de la dette, pas un contrat.
 *
 * Il est ADDITIF : il vit sous ses propres clés (`genliv:dossier:`), ne lit ni
 * n'écrit aucun `Book`, et AUCUNE de ses fonctions ne convertit un `Book` en
 * `Dossier` ni l'inverse (KR-167).
 *
 * Deux invariants portent le reste :
 *  · `get` RE-VALIDE toujours et ne rend JAMAIS le brut du magasin. L'adoption
 *    cloud écrit derrière le service ; sans re-validation à la lecture, un
 *    document ni gelé ni validé entrerait dans l'application sans qu'un seul
 *    test rougisse.
 *  · Les événements partent APRÈS résolution de la persistance, dans l'ordre
 *    (KR-004) : un abonné à `dossier:created` trouve toujours le dossier déjà
 *    dans le magasin.
 */
export interface DossierService {
	/** Le dossier persisté, RE-VALIDÉ et gelé — `null` si absent ou non conforme. */
	get(id: string): Dossier | null
	/** Signale l'ouverture d'un dossier : arme la réconciliation cloud (KR-163). */
	open(id: string): void
	/** Lit un fichier, le valide, et l'importe s'il est conforme et pas déjà présent. */
	importDossier(fileText: string): DossierInspection
	/** Le document à écrire dans un fichier — re-validé, jamais le brut du magasin. */
	exportDossier(id: string): Dossier | null
}

/**
 * L'anomalie de MAGASIN — la seule que le validateur ne peut pas produire, parce
 * qu'il est pur et ignorant de la bibliothèque. Elle vit donc ici, au seul
 * endroit qui voit à la fois le fichier et ce qui est déjà importé.
 */
function anomalieDejaImporte(existant: Dossier): DossierIssue {
	return {
		code: 'dossier-deja-importe',
		severity: 'error',
		message: `Un dossier portant cet identifiant est déjà dans votre bibliothèque : « ${existant.titre} ».`,
		location: `Dossier « ${existant.titre} »`,
		entityId: existant.id,
		path: 'id',
	}
}

export function createDossierService(persistence: PersistenceService, events: EventBus): DossierService {
	function get(id: string): Dossier | null {
		const brut = persistence.get<unknown>(dossierKey(id))
		if (brut === null) return null
		// Le magasin est une frontière de confiance (KR-116) : un document corrompu,
		// ou écrit derrière le service par l'adoption cloud, ne ressort jamais tel quel.
		return validateDossier(brut).dossier
	}

	return {
		get,

		open(id: string): void {
			// Rien à ouvrir, rien à annoncer : un événement émis sur un dossier absent
			// enverrait la réconciliation cloud chercher une clé qui n'existe pas.
			if (get(id) === null) return
			events.emit('dossier:opened', { dossierId: id })
		},

		importDossier(fileText: string): DossierInspection {
			const inspection = inspectDossierFile(fileText)
			if (inspection.statut !== 'valid') return inspection

			const existant = get(inspection.dossier.id)
			if (existant !== null) {
				// Un import ne se substitue jamais à un dossier déjà présent : le
				// remplacement silencieux perdrait le travail de l'auteur sans un mot.
				return { statut: 'invalid', errors: [anomalieDejaImporte(existant)], warnings: inspection.warnings }
			}

			// La persistance d'abord, l'événement ensuite (KR-004).
			persistence.set(dossierKey(inspection.dossier.id), inspection.dossier)
			events.emit('dossier:created', { dossierId: inspection.dossier.id })
			return inspection
		},

		exportDossier(id: string): Dossier | null {
			// Même lecture re-validée que `get` : on n'écrit jamais dans un fichier un
			// document qu'on refuserait de relire.
			return get(id)
		},
	}
}
