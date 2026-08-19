/**
 * dossier-registres — public API. Only the section panels are exposed;
 * injected by the composition root (App.tsx) into bascule-editeur's
 * DossierEditorScreen slot, never imported directly by another feature.
 */
export { PanneauIndices } from './components/PanneauIndices'
export { PanneauJalonsFins } from './components/PanneauJalonsFins'
export { PanneauQuetes } from './components/PanneauQuetes'
export { PanneauEvenements } from './components/PanneauEvenements'
