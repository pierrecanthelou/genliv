# Tour 1 — PM Produit · `dossier-format` it3

**RISQUE** — vu de mon poste, le risque n'est pas la taille (it2 a déjà posé le motif : 1 lot `contrat`, jamais deux) mais la **pollution du goal écrit** : il cite « le type Revelation à portes » comme livrable d'it3 alors que c'est fait depuis it2 (`types.ts:135`, cf. cadrage §1). Un ouvrier qui lit le goal brut peut soit dupliquer ce travail, soit gonfler des critères sur du déjà-livré — exactement le biais que je dois surveiller.

**OBJECTION** — le goal tel qu'écrit ne se reformule pas proprement en une phrase de démo tant que cette scorie y reste. La phrase propre est : « l'auteur peut voir refusée une condition (`…_expr`) qui référence un identifiant absent, sur les six familles posées par D1 » — sans « et », alignée sur le critère d'acceptation n°5 de la spec. Le reste (ExprNode, PREDICATES, validateExpr, collectRefs) est l'**outillage** qui rend cette phrase vraie, pas un second livrable.

Deuxième objection, sur le §9(a) du cadrage : « trancher l'orientation de `lieux[].acces` » est injecté dans ce raffinage alors qu'**aucun code d'it3 ne touche `lieux`** (créé en n° 5) — ça consomme du temps de comité sur une décision sans conséquence codée aujourd'hui.

**PROPOSITION** — (1) purger le goal de la mention « Revelation à portes » avant écriture du plan, le limiter à ExprNode / PREDICATES / validateExpr / collectRefs / intégrité référentielle des six familles ; (2) reporter la décision `lieux[].acces` telle quelle vers le raffinage de n° 5 (propriétaire naturel), en gardant seulement l'échéance « avant n° 7 » en `open_questions`.

**VERDICT** — recevable sous réserve (correction du goal + déport de la question `lieux`).
