## Tour 2 de raffinage — Feature `moteur-interprete`, itération 3

**RÉPONSE AUX OBJECTIONS — nommément**

1. **RISQUE (AC#7 sans lecteur)** → Levé. Le Tech Lead énumère dans ANNEXE A les prédicates 18–19 pour valider `FaitEtabli`, posés dans `validerNarrateur`. Le Narratif-IA ajoute le prédicat 22 (scanner `porteUneAncre` sur la prose complète). AC#7 a désormais deux lecteurs explicites (validation de la mémoire lors de l'écriture) et repose sur une validation de schéma précise.

2. **OBJECTION (AC#8 sans mutants)** → Levée. Le Tech Lead énumère cas limite (4 pas → fenetre.length=4, pas forçage à 5) avec mutant "Math.max(length, 5)". Le Narratif-IA pose une table de valeurs exhaustive (pas 3→3, 14→14, 15→5, 24→14, 25→5) et énumère mutants obligatoires (FENETRE_MAX en dur, Math.max retiré, < au lieu de <=). L'asymétrie disparaît.

3. **PROPOSITION (amender AC#7/AC#8)** → Appliquée par les deux rôles sans réserve.

---

**STATUT DE TES PROPRES OBJECTIONS (tour 1)**

- **RISQUE** → RETIRÉE. AC#7 a deux lecteurs explicites maintenant (Tech Lead : `validerNarrateur` prédicates 18–19 ; Narratif-IA : même + prédicat 22).

- **OBJECTION** → RETIRÉE. AC#8 énumère les cas limites (4, 14, 15, 24, 25 pas) et les mutants séparateurs (fenêtre fixe, résumé 5-pas, trou, forçage à 5).

- **PROPOSITION** → APPLIQUÉE intégralement par les deux rôles.

---

**VERDICT**

**Recevable.** AC#7 et AC#8 sont observables par jest (validation unitaire + état d'horloge après N pas). Les trois ambiguïtés mécaniques de tour 1 sont closes par convergence :

- Fenêtre se calcule purement de `horloge.tour` via `borneDeFenetre(tour)` — jamais stockée.
- Résumé avec seuil d'absorption stocké (`jusqu_au_tour` ou `absorbe_jusqua` selon arch).
- Pas en console entrent dans la fenêtre sans trou.
- Compaction réitérée à chaque pas si due, jamais deux fois par cadence.

**Deux débats transverses restent ouverts, mais n'impactent pas la recevabilité :**

1. **Périmètre d'it3** (Chip cliquable + refus-console) — arbitrage PM/Tech Lead. Impact : découpage en lots, pas critères.
2. **Archi du résumé** (appel R3 unique vs 9e rôle `chroniqueur`) — Tech Lead vs Narratif-IA. Impact : nombre d'appels, pas critères. AC#7/AC#8 restent valides dans les deux cas.

Ces deux débats doivent être tranchés AVANT code, pas après.

---

**ANNEXE — Critères finaux (AC#7 et AC#8 amendés, neutre arch)**

**AC#7 — Refus d'un fait sans ancre valide**

- **Critères observables** :
  - Fait avec `sur:[]` (ou `ancres:[]`) → refusé (motif `schema`).
  - Fait avec `sur:['A99']` où A99 ∉ table → refusé (motif `rang-inconnu`).
  - Prose contenant `\bA\d+\b` non injecté → refusé (motif `identifiant`).
- **Mutants ROUGES** : accepter `sur:[]`, accepter rang hors table, accepter ancre non injectée en prose.

**AC#8 — Fenêtre glissante 5-14 pas, résumé tous les 10**

- **Critères observables** (arch-neutre) :
  - Fenêtre calculée de l'horloge seul, jamais stockée.
  - Entre 5 et 14 pas moteur inclus (4 avant forçage).
  - Seuil d'absorption stocké → résumé ne boucle pas en cas d'échec.
  - Aucun pas sauté (console incluse).
  - Récits antérieurs à l'absorption hors fenêtre.
- **Table de valeurs** :
  | pas | début | fin | taille |
  |---|---|---|---|
  | 4 | 0 | 4 | 4 |
  | 14 | 0 | 14 | 14 |
  | 15 | 10 | 15 | 5 |
  | 24 | 10 | 24 | 14 |
  | 25 | 20 | 25 | 5 |
- **Mutants ROUGES** : fenêtre fixe, résumé 5-pas, trou, forçage à 5.

Je retire mes trois objections de tour 1. Les critères sont **recevables**. Le comité doit maintenant trancher Périmètre d'it3 et Archi du résumé avant code.
