# Tech Lead — tour 2 · moteur-fins it2

## Réponses nommées

- **UX O3 (focus Modal)** : accepté → `focusCancel?: boolean` dans `Modal.tsx`, lot `contrat`. La variante `'confirm'` retirée (aucun appelant).
- **UX « étendre EcranRefus »** : refusé. Son registre vise une `Route`, titre « ne peut pas s'ouvrir ». La partie s'ouvre. → `EcranReprise`.
- **QA O1** : mauvais site. EcranPartie gèle déjà le dossier. Observable : `sessions.lire` ×1, `ecrire` jamais appelé tant que le choix est affiché.
- **NIA** : `validerSession` vérifie la forme de `memoire` (types jusqu'aux primitifs), pas I1-I5.
- **PM O1** : d'accord, mort sortie. Mais `hero-mort` laisse `combat` en place. Le ↻ d'en-tête devient requis.

## Mes objections

- O1 (`lire(dossier)`) : **maintenue**.
- O2 (AiguillagePartie) : **maintenue**.
- O3 (`illisible` sans `refus`) : **maintenue**.
- O4 (`validerSession` hors baril) : **maintenue**.
- O5 : **retirée** (mort sortie).

VERDICT — recevable. Veto conditionnel : `Modal.tsx` dans lot `contrat`.

## ANNEXE — Lots mis à jour (2 lots, 9+9 fichiers)

### Lot 1 — `contrat`
| N/R | Fichier |
|---|---|
| N | `src/brain/dossier/reprise.ts` |
| N | `src/brain/dossier/reprise.test.ts` |
| R | `src/brain/dossier/session.ts` — port `lire` |
| R | `src/brain/MagasinDeSession.ts` — `lire` |
| R | `src/brain/MagasinDeSession.test.ts` |
| R | `src/brain/index.ts` — `export type { LectureSession }` |
| R | `src/brain/components/Modal.tsx` — `focusCancel` |
| R | `src/brain/components/Modal.test.tsx` |

### Lot 2 — `feature`
| N/R | Fichier |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/AiguillagePartie.tsx` |
| N | `src/features/play-mode/components/EcranReprise.tsx` |
| N | `src/features/play-mode/components/EcranReprise.test.tsx` |
| N | `src/features/play-mode/components/boutonPrimaire.ts` |
| R | `src/features/play-mode/components/EcranRefus.tsx` |
| R | `src/features/play-mode/components/PartieEnCours.tsx` |
| N | `src/features/play-mode/tests/reprise.test.tsx` |
| R | `src/features/play-mode/hooks/useSessionPersistee.ts` |

Signatures identiques au tour 1 sauf : `focusCancel?: boolean` (pas union), `EcranReprise` (pas EcranRefus étendu).
