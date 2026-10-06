# UX Designer — tour 1 — moteur-horloge it3

**RISQUE** : le registre de langue du journal doit rester cohérent avec `etape_plan :` (snake_case ASCII, base 1, sans prose).

**OBJECTIONS** :
1. Le label « ÉTAPE BLOQUÉE » casserait le registre du journal — les MAJUSCULES sont réservées au bandeau (it4).
2. `>=` produit du spam de journal et d'injection ; seul `===` (one-shot) est acceptable.

**PROPOSITIONS** :
- Libellé journal : `etape_bloquee : <id> <k+1>` (snake_case ASCII, base 1, sans prose, même registre que `etape_plan :`).
- One-shot à `tour − depuis === duree` (pas `>=`).
- `si_bloque` entre dans le bloc PENDANT CE TEMPS existant, pas de nouvel en-tête.
- Constante `CHEMIN_SI_BLOQUE` avec garde dédiée, parallèle à `CHEMIN_ACTION_DE_PLAN`.
- Contrat de design annexé avec tokens, format, registre, états.

**VERDICT** : recevable sous réserve.
