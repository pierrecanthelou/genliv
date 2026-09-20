/**
 * play-mode — API publique. Seul le shell de partie est exposé : la racine de
 * composition (`App.tsx`) le monte sur la route `partie`, qui est le SEUL
 * rendez-vous entre `bascule-editeur` et cette feature — aucune des deux
 * n'importe l'autre.
 *
 * `PlayerModal` n'entre PAS dans ce baril : c'est le chemin du livre-arbre,
 * encore importé en profondeur par `src/EditorScreen.tsx` (chemin mort, démoli
 * par l'itération 4 de la n° 9).
 */
export { EcranPartie } from './components/EcranPartie'
