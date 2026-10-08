/**
 * dossier-repetition — public API. Only the panel is exposed; injected by the
 * composition root (App.tsx) into bascule-editeur's DossierEditorScreen
 * `panneauRepetition` slot, never imported directly by another feature.
 */
export { PanneauRepetition, type PanneauRepetitionProps } from './components/PanneauRepetition'
