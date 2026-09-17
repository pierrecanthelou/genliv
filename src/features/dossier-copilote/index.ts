/**
 * dossier-copilote — public API. Only the panel is exposed; injected by the
 * composition root (App.tsx) into bascule-editeur's DossierEditorScreen
 * `panneauCopilote` slot, never imported directly by another feature.
 */
export { PanneauCopilote, type PanneauCopiloteProps } from './components/PanneauCopilote'
