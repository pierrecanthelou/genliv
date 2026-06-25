/**
 * cloud-sync — public API. The app shell mounts SyncIndicator once; the
 * local-first CloudSyncService itself lives in brain (it wraps the
 * PersistenceService and is wired in createBrain).
 */
export { SyncIndicator } from './components/SyncIndicator'
export { ConflictDialog } from './components/ConflictDialog'
export { CloudSyncSettings } from './components/CloudSyncSettings'
