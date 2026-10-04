# Tour 2 — PM · moteur-combat it2

## Note

**RÉPONSES NOMMÉES**
- **TL O1** (second écrivain de `lieu_courant`) : convergence. D5 amendé l'éteint — pas de navigation, pas de second écrivain.
- **TL O3** (inconscient = mort) : convergence. Le héros qui fuit sort du combat ; E1 s'applique.
- **QA O1** (critères non observables) : recevable. Je fournis 5 critères ci-dessous.

**MES OBJECTIONS**
1. Démo invérifiable (`fleeTarget` toujours null) : **retirée**. D5 amendé rend la démo vérifiable — le héros fuit et reste au lieu courant.
2. Second écrivain de `lieu_courant` : **retirée**. D5 amendé supprime la navigation.
3. Signal de fuite persisté (`fuite?: true`) : **maintenue**. Sans ce signal, le rejeu d'une fuite suivie de mort montre un héros vivant. `fuite` est une entrée du joueur (comme `postures`), pas un snapshot — KR-292 intact.

**VERDICT** — Veto **levé**. D5 amendé avant tout code.

## 5 critères d'acceptation

1. Étant donné un combat en cours / Quand l'auteur clique « Fuir » / Alors le héros subit un assaut gratuit et le combat se termine avec l'issue `hero-fled`.
2. Étant donné un combat en cours / Quand l'auteur clique « Fuir » / Alors le héros reste au lieu courant, sans XP, sans butin, sans variation de plafonds.
3. Étant donné un combat dont l'issue est terminale / Quand l'écran de combat est affiché / Alors le bouton « Fuir » est absent.
4. Étant donné une fuite dont l'assaut gratuit réduit les PV à 0 / Quand le combat se résout / Alors l'issue est `hero-mort`, pas `hero-fled`.
5. Étant donné un combat avec `fuite: true` persisté / Quand le rejeu se produit / Alors le résultat est identique au premier calcul (rejeu pur).
