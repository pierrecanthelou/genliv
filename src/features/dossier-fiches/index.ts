/**
 * dossier-fiches — public API. Seul le panneau de section est exposé ; injecté
 * par la racine de composition (App.tsx) dans le slot `personnages` de
 * `DossierEditorScreen` (bascule-editeur), jamais importé directement par une
 * autre feature (KR-184).
 */
export { PanneauPersonnages } from './components/PanneauPersonnages'
