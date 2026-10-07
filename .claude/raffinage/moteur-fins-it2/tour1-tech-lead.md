# Tech Lead — tour 1 · moteur-fins it2

RISQUE — La reprise valide une frontière qu'elle ne tient qu'à moitié. Le magasin n'a pas le dossier qu'exige `validerSession`. `PersistenceService.get` avale les erreurs `JSON.parse` et rend `null`, donc un JSON tronqué se lit « absente » et sera écrasé en silence. Un validateur qui reconstruit la session perdrait tout champ optionnel qu'on lui oublie (KR-251).

OBJECTION —
1. `lire(dossierId)` ne peut pas appeler `validerSession(brut, dossier)`. Contradiction interne de la spec.
2. Le site de lecture ne peut pas être `EcranPartie` : deux `return` anticipés (l.43, l.55) précèdent. Un `useState` placé après viole les règles des hooks. Il faut un composant enfant.
3. `refus` dans `illisible` n'a aucun lecteur (KR-249). L'ajouter plus tard est gratuit.
4. Exporter `validerSession` par le baril n'a aucun appelant feature (KR-109).
5. Trois reports d'it1 (mort, texte de mort, bandeau) atterrissent ici mais pas dans la phrase de démo.

PROPOSITION —
- `lire(dossier: Dossier): LectureSession`, et `illisible` sans `refus`.
- `validerSession` rend `brut` tel quel, jamais une copie reconstruite. Table exhaustive à la compilation.
- Test d'aller-retour JSON sur une session jouée par les vraies portes d'écriture.
- JSON non parsable ≡ absente. Deux lots (contrat 6 fichiers, feature 6 fichiers). Mort dans une itération à part.

VERDICT — recevable sous réserve (1 et 2 corrigées ; mort tranchée par le comité).

## ANNEXE — Lots

### Lot 1 — `contrat` (seul, en premier)
| N/R | Fichier |
|---|---|
| N | `src/brain/dossier/reprise.ts` — `validerSession`, `LectureSession` |
| N | `src/brain/dossier/reprise.test.ts` — discriminants, aller-retour JSON |
| R | `src/brain/dossier/session.ts` — port `lire`, docstrings |
| R | `src/brain/MagasinDeSession.ts` — implémenter `lire` |
| R | `src/brain/MagasinDeSession.test.ts` — 4 verdicts |
| R | `src/brain/index.ts` — exporter `type LectureSession` |

Signatures :
```ts
export type LectureSession =
  | { readonly statut: 'absente' }
  | { readonly statut: 'reprenable'; readonly session: EtatSession }
  | { readonly statut: 'perimee' }
  | { readonly statut: 'illisible' }
export function validerSession(brut: unknown, dossier: Dossier): LectureSession
// MagasinDeSession
lire(dossier: Dossier): LectureSession
```

### Lot 2 — `feature`
| N/R | Fichier |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` — `<AiguillagePartie>` |
| N | `src/features/play-mode/components/AiguillagePartie.tsx` |
| N | `src/features/play-mode/components/EcranReprise.tsx` |
| N | `src/features/play-mode/components/EcranReprise.test.tsx` |
| N | `src/features/play-mode/tests/reprise.test.tsx` |
| R | `src/features/play-mode/hooks/useSessionPersistee.ts` — docstring |

### Risques d'architecture
1. Parité écrivain/lecteur : test d'aller-retour via les vraies portes d'écriture.
2. KR-305 : sur `perimee`, `sessions.ecrire` jamais appelé avant la décision.
3. Tour en vol (carteJet, R3 en vol) = état React non persisté, perdu à la reprise.
4. Cycles : `reprise.ts` importe en VALEUR, `session.ts` en type seul.
5. Budget de contexte : `code-knowledge.json` à 4 o de marge — compaction obligatoire.
