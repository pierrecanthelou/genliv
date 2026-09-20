/**
 * Single auditable location for every storage key (KR-011/111). Feature
 * code must never touch raw localStorage — it goes through
 * PersistenceService and these key builders only.
 *
 * Sensitive credentials (PAT, OAuth tokens, API keys) must be registered
 * here with a `// SENSITIVE` line comment (KR-114). See CLOUDSYNC_KEY_KEY.
 */
export const PERSISTENCE_PREFIX = 'genliv'

/** Prefix shared by every persisted book, for listing via keys(prefix). */
export const BOOK_KEY_PREFIX = `${PERSISTENCE_PREFIX}:book:`

/** Storage key for a single book, keyed by its stable id (never its title). */
export function bookKey(bookId: string): string {
	return `${BOOK_KEY_PREFIX}${bookId}`
}

/**
 * Cloud-split keys — book content WITHOUT image data URLs, individual image
 * data URLs, and the manifest (list of image keys for this book).
 * These keys only exist in the cloud transport (Cloudflare KV); local storage
 * always holds the full book at bookKey(). The split avoids re-pushing megabytes
 * of unchanged images on every text edit (see cloud-sync iter 5, KR-splitting).
 *
 * Key shapes:
 *   genliv:book:{id}:content            — Book JSON, illustration/portrait stripped
 *   genliv:book:{id}:img:{nodeId}:{field} — one data URL (field = illustration | portrait)
 *   genliv:book:{id}:images             — string[] manifest of image keys for this book
 */
export function bookContentKey(bookId: string): string {
	return `${BOOK_KEY_PREFIX}${bookId}:content`
}
export function bookImageKey(bookId: string, nodeId: string, field: string): string {
	return `${BOOK_KEY_PREFIX}${bookId}:img:${nodeId}:${field}`
}
export function bookImagesManifestKey(bookId: string): string {
	return `${BOOK_KEY_PREFIX}${bookId}:images`
}

/**
 * Le DOSSIER D'AVENTURE (feature n° 1 `dossier-format`) — le format que l'IA lira
 * au Temps 2. Son espace de clés est DISTINCT de celui du livre : `genliv:dossier:`
 * ne croise jamais `keys(BOOK_KEY_PREFIX)`, donc `listBooks` ne voit aucun dossier
 * et la persistance du dossier est purement ADDITIVE (KR-159 : la n° 1 crée, elle
 * ne détruit pas).
 *
 * AUCUN DÉCOUPAGE DE CLÉS ici, et c'est un invariant du schéma 1, pas un oubli :
 * aucun champ du dossier ne porte de data URL en itération 1. `dossierContentKey` /
 * `dossierImageKey` arriveront avec le premier porteur d'image (illustration en
 * n° 3, portraits en n° 4).
 */
export const DOSSIER_KEY_PREFIX = `${PERSISTENCE_PREFIX}:dossier:`

/**
 * Storage key for a single dossier, keyed by its stable id (never its titre).
 *
 * `:` EST RÉSERVÉ dans cet espace de clés — c'est le séparateur du découpage à
 * venir (`dossierContentKey` / `dossierImageKey`, n° 3 / n° 4). Le `dossierId`
 * passé ici ne doit donc jamais en contenir. Ce n'est pas une convention
 * d'usage : `validateDossier` refuse par `identifiant-invalide` tout `id` racine
 * hors de `^[a-z0-9][a-z0-9-]*$`, précisément parce que cette valeur vient d'un
 * fichier écrit à la main et finit ici sans intermédiaire.
 */
export function dossierKey(dossierId: string): string {
	return `${DOSSIER_KEY_PREFIX}${dossierId}`
}

/**
 * La SESSION d'une partie jouée sur un dossier (n° 9 `moteur-dossier`) —
 * l'`EtatSession` de `brain/dossier/session.ts`, une clé par dossier.
 *
 * NAMESPACE PROPRE, ET SURTOUT PAS SOUS `genliv:dossier:` : ce préfixe-là réserve
 * `:` au découpage du DOCUMENT (`dossierContentKey` / `dossierImageKey`) et sert
 * de balayage de liste (`DossierService.ts`, `keys(DOSSIER_KEY_PREFIX)`). Une
 * session n'est pas une tranche du document, et une clé de session rangée là
 * entrerait dans ce balayage. `DossierService` filtre déjà les clés porteuses
 * d'un `:` — mais on ne s'appuie pas sur une garde incidente écrite pour un
 * autre besoin.
 *
 * Écrite par la feature `play-mode` via `PersistenceService` (KR-011/111) — pas
 * par `src/player/`, qui reste extractible et ne connaît aucun service.
 *
 * ⚠ CETTE CLÉ ENTRE DANS LA FILE DE SYNCHRONISATION CLOUD, et personne ne l'a
 * décidé : `useBrain().persistence` est le décorateur (`CloudSyncService`), qui
 * pousse toute clé non-livre. Les trois autres familles d'état PAR APPAREIL —
 * `UI_PREFS_KEY_PREFIX` (KR-022), `MONSTER_LIBRARY_KEY`, `CLOUDSYNC_WORKER_URL_KEY`
 * — passent, elles, par le magasin BRUT. La question appartient au port de
 * stockage de la n° 9 it2 (`open_questions` de sa spec), qui doit aussi traiter
 * la suppression distante : `CloudSyncService.remove()` n'est pas propagé.
 */
export const DOSSIER_SESSION_KEY_PREFIX = `${PERSISTENCE_PREFIX}:session:dossier:`

/** Storage key for one dossier's play session, keyed by the dossier's stable id. */
export function dossierSessionKey(dossierId: string): string {
	return `${DOSSIER_SESSION_KEY_PREFIX}${dossierId}`
}

/**
 * The cloud-sync OFFLINE QUEUE: writes pushed-but-not-yet-confirmed, persisted
 * LOCALLY (in the genliv namespace, not the transport's fake-remote namespace)
 * so pending changes survive a reload and flush on reconnect (cloud-sync iter 2).
 * Not a book key, so it never pollutes listBooks (keys(BOOK_KEY_PREFIX)).
 */
export const CLOUDSYNC_QUEUE_KEY = `${PERSISTENCE_PREFIX}:cloudsync:queue`

/**
 * Per-book UI PREFERENCES — pan/zoom, canvas spacing, and dragged node
 * positions (tree-canvas iter 3). These are PER-DEVICE view state, NOT part
 * of the synced book document (KR-022): UIPreferencesService writes them through
 * the RAW local store, so they never enter the cloud queue. The `ui:` namespace
 * keeps them out of listBooks (keys(BOOK_KEY_PREFIX) never matches `genliv:ui:`).
 */
export const UI_PREFS_KEY_PREFIX = `${PERSISTENCE_PREFIX}:ui:book:`

/** Storage key for one book's UI preferences, keyed by its stable id. */
export function uiPrefsKey(bookId: string): string {
	return `${UI_PREFS_KEY_PREFIX}${bookId}`
}

/**
 * The reusable MONSTER LIBRARY (action-monster iter 3) — saved monsters reusable
 * ACROSS books (« la librairie du générateur »). Persisted in the genliv
 * namespace via the raw local store (cross-device sync is out of scope); not a
 * book key, so listBooks never matches it.
 */
export const MONSTER_LIBRARY_KEY = `${PERSISTENCE_PREFIX}:monster-library`

/**
 * One-time SEED marker for the bestiary (§ 4, game system). The 23 canonical
 * monsters are seeded into the library on first run; this flag records that the
 * seed ran, so a user who later DELETES bestiary entries does not get them
 * re-injected on the next launch. Not a book key.
 */
export const MONSTER_LIBRARY_SEEDED_KEY = `${PERSISTENCE_PREFIX}:monster-library:seeded`

/**
 * Per-book PLAY SESSION key prefix used by `src/player/utils/persist.ts` directly
 * (the play runtime cannot depend on PersistenceService — it must be extractible).
 * Documented here for auditability (KR-011/134). Full key = `${prefix}{bookId}`.
 */
export const PLAY_SESSION_KEY_PREFIX = `${PERSISTENCE_PREFIX}:play:session:`

/**
 * Cloudflare Worker URL entered by the user in the cloud-sync settings form.
 * Stored in the RAW local store (not cloud-synced) — it is the endpoint for
 * the sync itself, so syncing it would be circular (KR-022).
 */
export const CLOUDSYNC_WORKER_URL_KEY = `${PERSISTENCE_PREFIX}:cloudsync:worker-url`

/**
 * The user's sync key (personal shared secret) that namespaces their data in
 * the Cloudflare KV store.  SENSITIVE — registered here per KR-114.
 * Stored in the RAW local store (never cloud-synced).
 */
// SENSITIVE — do not cloud-sync (KR-114)
export const CLOUDSYNC_KEY_KEY = `${PERSISTENCE_PREFIX}:cloudsync:key`
