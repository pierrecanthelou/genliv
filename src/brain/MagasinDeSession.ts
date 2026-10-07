import { validerSession } from './dossier/reprise'
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
 * `ecrire` ET `lire`. `lire` ne rend JAMAIS ce que le stockage lui donne : tout passe par
 * `validerSession` (`brain/dossier/reprise.ts`), parce que le magasin est une frontière de
 * confiance (KR-116) et qu'un `as EtatSession` à cet endroit serait un `as` déguisé.
 *
 * ⚠ UN JSON NON PARSABLE SE LIT `absente`, PAS `illisible`. `PersistenceService.get` AVALE
 * l'erreur de `JSON.parse` et rend `null` — exactement ce qu'il rend pour une clé qui n'existe
 * pas — et `lire` n'a aucun autre moyen de les distinguer sans interroger `keys()` en plus.
 * La conséquence est assumée, pas ignorée : une sauvegarde tronquée n'ouvre PAS l'écran
 * « cette partie ne peut pas être lue », une nouvelle partie démarre, et la première
 * écriture de `useSessionPersistee` écrase le contenu corrompu. C'est la décision n° 21 du
 * plan d'itération (`.claude/raffinage/moteur-fins-it2.plan.md`), épinglée par un test de
 * `MagasinDeSession.test.ts` pour qu'elle ne puisse changer qu'à la lecture d'un diff.
 *
 * `effacer` n'existe pas : aucun appelant (« Nouvelle partie » écrase par `ecrire`), et une
 * méthode sans appelant serait KR-109. Ajouter une méthode à une interface est ADDITIF —
 * contrairement à un champ persisté (KR-251), elle ne se paie pas d'être ajoutée plus tard.
 */
export function createMagasinDeSession(brut: PersistenceService): MagasinDeSession {
	return {
		ecrire(dossierId, session) {
			brut.set(dossierSessionKey(dossierId), session)
		},
		lire(dossier) {
			return validerSession(brut.get<unknown>(dossierSessionKey(dossier.id)), dossier)
		},
	}
}
