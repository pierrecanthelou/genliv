# Revue d'itération — `moteur-combat` · itération `3`

> Date : 2026-10-05
> Version : 0.7.19 → 0.7.20

## En une ligne

L'auteur lit, sous chaque round de combat (clôture comprise), un court commentaire sans chiffre produit par le narrateur de combat R5 — nouvel essai puis silence.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Appel R5 + affichage narration en `--font-ui` avec filet `--border-rule` | VÉRIFIÉ ✓ | `EcranCombat.test.tsx` > affiche la narration quand commentaire recu |
| 2 | Validateur refuse chiffre, trop long, vide, `?` final (5 canaris) | VÉRIFIÉ ✓ | `schemaSortie.test.ts` > commentateur > 5 tests canaris |
| 3 | Fuite n'appelle pas R5 | VÉRIFIÉ ✓ | `combatParConsole.test.tsx` > fuite ne déclenche jamais un appel R5 |
| 4 | `dernierAssaut` posé avec `{round, vainqueur, qualite}` | VÉRIFIÉ ✓ | `combatEngine.test.ts` > dernierAssaut posé 3 issues + survie capacités |
| 5 | Nouvel essai une fois puis silence (2 appels, jamais 3) | VÉRIFIÉ ✓ | `CopiloteService.test.ts` > 12ᵉ surcharge nouvel essai |
| 6 | Projection sans `.log` ni `.text` | VÉRIFIÉ ✓ | `combatProjection.test.ts` + `moteurSansIA.test.ts` > balayage source |
| 7 | Session identique avec/sans R5 | VÉRIFIÉ ✓ | `combatParConsole.test.tsx` > session persistée identique |
| 8 | `moteurSansIA.test.ts` vert + mutant exclusion | VÉRIFIÉ ✓ | `moteurSansIA.test.ts` > exclusion useCommentaireCombat + mutant |

## Diff par lot

### Lot 1 — `contrat-commentateur` (11 fichiers, plan : 11)

| Fichier | Plan | Livré |
|---|---|---|
| `src/brain/copilote/types.ts` | R | ✓ |
| `src/brain/copilote/schemaSortie.ts` | R | ✓ |
| `src/brain/copilote/schemaSortie.test.ts` | R | ✓ |
| `src/brain/copilote/contexte/commentateur.ts` | N | ✓ |
| `src/brain/copilote/contexte/commentateur.test.ts` | N | ✓ |
| `src/brain/copilote/contexte/index.ts` | R | ✓ |
| `src/brain/CopiloteService.ts` | R | ✓ |
| `src/brain/CopiloteService.test.ts` | R | ✓ |
| `worker/index.ts` | R | ✓ |
| `worker/index.test.ts` | R | ✓ |
| `worker/frontiere.test.ts` | R | ✓ |

### Lot 2 — `feature-commentaire-combat` (14 fichiers, plan : 14)

| Fichier | Plan | Livré |
|---|---|---|
| `src/player/engine/combatTypes.ts` | R | ✓ |
| `src/player/engine/combatEngine.ts` | R | ✓ |
| `src/player/engine/combatEngine.test.ts` | R | ✓ |
| `src/features/play-mode/utils/combatProjection.ts` | N | ✓ |
| `src/features/play-mode/utils/combatProjection.test.ts` | N | ✓ |
| `src/features/play-mode/hooks/useCommentaireCombat.ts` | N | ✓ |
| `src/features/play-mode/hooks/useCommentaireCombat.test.ts` | N | ✓ |
| `src/features/play-mode/components/CombatEnCours.tsx` | N | ✓ |
| `src/features/play-mode/components/CombatEnCours.test.tsx` | N | ✓ |
| `src/features/play-mode/components/EcranCombat.tsx` | R | ✓ |
| `src/features/play-mode/components/EcranCombat.test.tsx` | R | ✓ |
| `src/features/play-mode/components/EcranPartie.tsx` | R | ✓ |
| `src/features/play-mode/tests/moteurSansIA.test.ts` | R | ✓ |
| `src/features/play-mode/tests/combatParConsole.test.tsx` | R | ✓ |

**Total : 25 fichiers modifiés, 0 hors périmètre.**

## Ce qui a été refusé

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| 4 | `capacite?` optionnelle dans la projection (NIA) | REJETÉ | Pas de producteur (KR-285). Additif ultérieurement. |
| 5 | Borne 400 → 600 si > 30 % de rejet (NIA) | REJETÉ | Constante à un site, ajustable sans comité. |

## Ce qui a été reporté

| Sujet | Destination |
|---|---|
| `<button>` primitif dans EcranCombat | Dette design system (préexistante, 3 boutons) |
| Seuil 30 % rejet → 600 car. | Engagement produit, pas gatekeep auto |
| Règles ESLint UX | Dette à déclencheur |
| Extraction `sessionCombat.ts` | Déclencheur non armé (session.ts > 800 lignes) |
| Sous-composant `RecitRound.tsx` | Reporté (récit = `<p>` conditionnel) |

## Écarts assumés

- **`ProjectionAssaut.monstre` = référence `bestiaire.<templateId>`** (pas un nom affiché). L'assembleur la résout par `monstreDeLaReference`. Décision du lot contrat, cohérente avec KR-232 (identifiant stable, jamais nom libre).
- **`projeterAssaut` prend 3 paramètres** (`etat`, `heroPvMax`, `monstreRef`) au lieu de 2 au plan (`etat`, `heroPvMax`). Nécessaire car `CombatState` ne porte pas la référence monstre.
- **`dernierAssaut` posé à 7 sites** dans `combatEngine.ts` (lot 2 rapporte 7) contre 3 au plan. Couvre les branches capacités.
- **Paliers de santé : 50 % inclus dans « blessé »** (plein > 50 %, blessé 25–50 %, critique < 25 %, à terre ≤ 0). Comparaison par multiplication entière.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier | ✓ |
| tsc --noEmit | ✓ |
| ESLint | ✓ (0 erreur nouvelle) |
| jest | ✓ 145 suites / 2694 tests |
| Mutation `brain/` | Non due (aucun des 4 fichiers mutés touché) |

## RETOUR-COMITÉ

- Le découpage 2 lots séquentiels (contrat seul en premier) fonctionne bien pour cette taille d'itération. Aucun blocage croisé.
- Le compte rendu du lot contrat vers le lot feature (§ « Pour lot 2 ») a correctement transmis l'écart `monstre = référence` et le 3ᵉ paramètre de `projeterAssaut`.
- Le lot contrat a pris des décisions autonomes sur le vocabulaire du contexte et les seuils des paliers, toutes documentées avec « si c'est l'inverse ». Bonne pratique à conserver.
- `dernierAssaut` à 7 sites vs 3 au plan : le plan sous-estimait les branches capacités. Pas un écart de scope, mais le plan devrait les dénombrer.
