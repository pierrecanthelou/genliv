import type { MagasinDeSession } from './dossier/session'
import type { PersistenceService } from './PersistenceService'
import { dossierSessionKey } from './persistenceKeys'

/**
 * LE MAGASIN DE SESSION — l'implémentation du port `MagasinDeSession`
 * (`brain/dossier/session.ts`) sur le magasin BRUT.
 *
 * QUATRIÈME SERVICE ÉTROIT SUR LE MAGASIN BRUT, et c'est la forme que le dépôt
 * pratique déjà : `createUIPreferencesService(local)`, `createMonsterLibraryService(local)`,
 * `createCloudSettings(local)`. Jamais une porte brute exposée sur `Brain` — un
 * `local` public serait une porte non synchronisée ouverte à toutes les features,
 * que ni ESLint ni la revue ne rattraperaient.
 *
 * POURQUOI LE MAGASIN BRUT ET PAS LE DÉCORATEUR : `useBrain().persistence` est le
 * `CloudSyncService`, dont `set()` écrit en local PUIS met toute clé non-livre
 * dans la file de synchronisation. Une session de partie est un état PAR
 * APPAREIL — même doctrine que les préférences d'interface (KR-022), la librairie
 * de monstres et les réglages du worker. La pousser au nuage ferait passer
 * `sync:status` à `syncing` à chaque montage d'aperçu, et `CloudSyncService.remove()`
 * n'étant pas propagé (KR-182), tout effacement futur laisserait une entrée
 * distante orpheline.
 *
 * LA CLÉ VIENT DE `dossierSessionKey` (`persistenceKeys.ts`) : un seul endroit
 * auditable pour toutes les clés de stockage (KR-011/111).
 *
 * `ecrire` SEULE. `lire` et `effacer` entrent avec la REPRISE, qui les DÉMONTRE et
 * apporte son `validerSession` (KR-116) : le magasin est une frontière de
 * confiance, et une méthode de lecture sans validateur inviterait le premier
 * appelant à faire un `as EtatSession`. Ajouter une méthode à une interface est
 * ADDITIF — contrairement à un champ persisté (KR-251), elle ne se paie pas
 * d'être ajoutée plus tard.
 */
export function createMagasinDeSession(brut: PersistenceService): MagasinDeSession {
	return {
		ecrire(dossierId, session) {
			brut.set(dossierSessionKey(dossierId), session)
		},
	}
}
