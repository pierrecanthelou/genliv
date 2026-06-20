/**
 * book-export — public API. Exports the authored book to a play-ready file. The
 * editor shell mounts ExportGameButton into the shared top bar's `actions` slot;
 * neither imports the other (composition-root wiring).
 */
export { ExportGameButton } from './components/ExportGameButton'
export { useExportBook, type ExportResult } from './hooks/useExportBook'
