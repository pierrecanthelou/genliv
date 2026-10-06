# Narratif & IA — moteur-horloge it2 — TOUR 1

**RISQUE** — La projection `changementsDe(avant, après)` risque de devenir un second site d'interprétation de l'état du monde. Si le code duplique la sémantique de `LECTURE_DES_EFFETS`, on aura deux endroits qui décident ce qu'un changement signifie. La projection doit se limiter aux avancements/blocages de PNJ, jamais aux deltas que le narrateur sait déjà lire.

**OBJECTION**
1. `plan_actions[].action` est audience `ia`, mais AUCUN assembleur ne l'injecte aujourd'hui. L'injecter ouvre un 12e chemin dans `CHAMPS_INJECTES_NARRATEUR`. C'est un acte délibéré : liste fermée modifiée, garde étendue.
2. `depuis` absent pour un PNJ déjà avancé avant it2 : quelle valeur ? Si absent ≡ 0, la formule déclenche l'échéance au tour `duree`. Si absent ≡ jamais, le PNJ ancien n'est jamais bloqué. Question ouverte non tranchée.
3. Label « ÉTAPE BLOQUÉE » et registre de langue : question ouverte non tranchée.

**PROPOSITION**
1. `changementsDe` ne produit que avancements et blocages PNJ. Type compilé `{ type: 'avancement' | 'bloque', pnj_id, rang, action? }`.
2. Déclarer `plan_actions[].action` comme 13e chemin si l'horloge l'injecte, avec garde.
3. `depuis` absent = jamais en échéance. `depuis` s'écrit à chaque avancement (`= tour`).

**VERDICT** — recevable sous réserve (a, b, c tranchés avant code).

## ANNEXE — contrat de sortie IA

### Bloc PENDANT CE TEMPS
- Après CE PAS, avant EN SA POSSESSION. Ne s'écrit que si ≥ 1 changement perceptible au lieu courant.
- 1 ligne par PNJ avancé : prose `plan_actions[rang].action`. Si absente : silence.
- 1 ligne par PNJ bloqué : prose `si_bloque` si rédigée, sinon silence.
- Climat : FERMÉ it2.

### Ce que l'IA ne fait pas
- Ne décide pas qu'un PNJ avance ou est bloqué (moteur).
- Ne lit jamais `etape_plan.rang`, `depuis`, `duree`, `declencheur_expr`.
- Ne lit `plan_actions[].action` que dans PENDANT CE TEMPS.

### Budget
- Bloc = prose d'auteur non bornée → marge ×3 sur le terme dossier.
- `BUDGET_CARACTERES_DOSSIER` à re-mesurer.
- Cascade : levier retirable entre P1 et P2.

### Audience
| Champ | Audience | Injecté R3 |
|---|---|---|
| `plan_actions[].action` | `ia` | OUI, PENDANT CE TEMPS seul |
| `plan_actions[].si_bloque` | `ia` | OUI, PENDANT CE TEMPS seul |
| `etape_plan.rang` | `moteur` | NON |
| `etape_plan.depuis` | `moteur` | NON |

### Identifiants stables
- PNJ sélectionné par `id` dans le code, jamais visible dans le texte de contexte.
- La prose `action` suffit, pas d'ancre ni de rang.

## Décisions prises en autonomie
- `plan_actions[].action` non borné → marge ×3
- Filtre perceptibilité = `presence[].lieu_id === lieu_courant`
- Cascade P1.5 retrait PENDANT CE TEMPS : levier entre P1 et P2
