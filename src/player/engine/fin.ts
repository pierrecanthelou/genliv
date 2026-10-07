/**
 * PONT `player/engine/fin` — seul réexport de `finAtteinte` et `FinAtteinte` depuis `brain/dossier/evaluate`.
 *
 * Aucun fichier feature n'importe `brain/dossier/evaluate` directement : ce module
 * est la seule porte (KR-110).
 */

export { finAtteinte, type FinAtteinte } from '../../brain/dossier/evaluate'
