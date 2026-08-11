/**
 * dossier-canon — public API. Only the section panels are exposed; injected by
 * the composition root (App.tsx) into bascule-editeur's DossierEditorScreen
 * slots, never imported directly by another feature.
 */
export { PanneauCanon } from './components/PanneauCanon'
export { PanneauDepart } from './components/PanneauDepart'
export { PanneauLieux } from './components/PanneauLieux'
