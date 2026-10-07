## TECH LEAD — moteur-fins, itération 1 — note d'ouverture

**RISQUE** Quatre points du contrat contredisent le code existant. Et le lot `contrat` ne passe pas la porte seul si on ne le dit pas.

**OBJECTION**
1. `finAtteinte(dossier, session: EtatSession)` rougit `evaluate.test.ts:1090` (aucun import de `./session`, même en type). Le second paramètre doit être structurel, `{ monde; combat?: unknown }`, comme `evenementARencontrer`. Le retour doit être une projection nominale `FinAtteinte {fin_id, texte?}`, pas `Fin` (précédents `Rencontre`, `JalonAtteint`). `condition_texte` (audience auteur) ne doit pas atteindre `useTourDeJeu`, seul fichier relié au modèle.
2. Le critère 4 est faux pour la mort : `commandes.test.ts:1064` épingle `combat_en_cours`, puisque le combat reste. `partie_terminee` ne vaut que pour la fin.
3. Critère 6 : R5 ne vit pas dans `useTourDeJeu` mais dans `CombatEnCours.handleJouer`. La garde R3 tient en une ligne après l'ÉTAPE 5, avant R2. Le squelette dit R2/R3/R4 et le critère R3 seul ; je tranche : les trois.
4. KR-112 : extraire `PartieDemarree` + `ActionsCarnet` retire environ 28 lignes (≈379), et l'aiguillage les rend. Pire, `PartieDemarree` → `PartieEnCours` crée un cycle d'import. La vraie coupe est `PartieEnCours.tsx`.
5. Risque oublié : sur la référence, `fin.vigie-abandonnee` est vraie après toute clôture de combat. `commandes.test.ts:1067-1074` rougit donc côté brain, pas seulement `combatParConsole.test.tsx:115`.

**PROPOSITION** Deux lots séquentiels (annexe). Pas de baril : import profond `brain/dossier/evaluate`, précédents `commandes` / `recit` / `amorce`.

**VERDICT** Aucun veto. Approuvé sous ces cinq corrections.

---

## ANNEXE — LOTS
Racine = `C:\Users\pierr\Desktop\genliv`, chemins relatifs. Exécution séquentielle, sans worktree : un seul `EcranPartie.tsx` partagé interdirait de toute façon un troisième lot.

### Lot 1 — `contrat` (seul, en premier)
| N/R | Fichier |
|---|---|
| R | `src/brain/dossier/evaluate.ts` |
| R | `src/brain/dossier/commandes.ts` (garde, message constant, docstring de totalité d'`executerCommande`) |
| R | `src/brain/dossier/interprete.ts` (commentaire seul, l.150-152 « inatteignable » devient faux) |
| R | `src/brain/dossier/evaluate.test.ts` |
| R | `src/brain/dossier/commandes.test.ts` (nouveau balayage de `COMMANDES` + reprise des l.1067-1074) |
| R | `src/brain/dossier/session.test.ts` (seulement si rouge : 7 usages de l'embuscade) |

Expose :
```ts
export interface FinAtteinte { readonly fin_id: string; readonly texte?: string }
export function finAtteinte(
  dossier: Dossier,
  session: { readonly monde: FaitsDeSession; readonly combat?: unknown },
): FinAtteinte | undefined
export type RefusCommande = /* …existants */ | 'combat_en_cours' | 'partie_terminee'
```

### Lot 2 — `feature` (démarre contrat figé, le lit comme donnée immuable)
| N/R | Fichier |
|---|---|
| R | `src/features/play-mode/components/EcranPartie.tsx` |
| N | `src/features/play-mode/components/PartieEnCours.tsx` |
| N | `src/features/play-mode/components/ActionsCarnet.tsx` |
| N | `src/features/play-mode/components/EcranFin.tsx` |
| R | `src/features/play-mode/components/CombatEnCours.tsx` |
| R | `src/features/play-mode/hooks/useTourDeJeu.ts` |
| N | `src/features/play-mode/components/EcranFin.test.tsx` |
| N | `src/features/play-mode/tests/finDePartie.test.tsx` |
| R | `src/features/play-mode/hooks/useTourDeJeu.test.ts` |
| R | `src/features/play-mode/components/CombatEnCours.test.tsx` |
| R | `src/features/play-mode/tests/combatParConsole.test.tsx` |

---

## Décisions prises en autonomie faute de spécification

- `finAtteinte` sort-il du baril ? → Non : import profond `brain/dossier/evaluate` par la feature (précédents `commandes`, `recit`, `amorce` ; `evenementARencontrer` reste hors baril).
- Retour `Fin` complet ou projection ? → Projection nominale `FinAtteinte {fin_id, texte?}`, par doctrine `Rencontre` / `JalonAtteint`.
- `partie_terminee` pour la mort ? → Non, la mort reste `combat_en_cours`.
- Combien de lots ? → Deux (contrat + feature).
- Quelle coupe pour KR-112 ? → `PartieEnCours.tsx` plutôt que `PartieDemarree.tsx`, qui forcerait un cycle.
- Fin vraie dès le tour zéro ? → Aucun cas particulier.
- Bouton « Rejouer » : il est au squelette mais sans critère → je le garde, avec `onRejouer` et une `key` de remontage.
