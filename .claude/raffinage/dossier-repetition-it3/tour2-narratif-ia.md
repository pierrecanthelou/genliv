# Narratif & IA — dossier-repetition it3, tour 2

RÉPONSES AUX AUTRES
- [QA] Veto « PNJ atteint » non défini → résolu. Définition : PNJ atteint ssi `(p.presence ?? []).some(pr => Set(rapport.parcours).has(pr.lieu_id))`. Déterministe, sans IA, testable.
- [TL] `parcours` remplace `lieux_visites` → d'accord. `lieux_visites` se dériverait de `parcours` (KR-013). Un seul champ.
- [UX] Libellé « EN {n} PAS · PARCOURS N°{graine} » → le nombre de pas effectifs est une donnée narrative honnête. Accord.

STATUT DE MES OBJECTIONS
1. trace + lieux_visites → retirée en partie. `parcours` (TL) remplace `lieux_visites`. `trace` reportée si dépliable différé à it4.
2. PNJ atteints dérivés par co-présence → maintenue. Définition formalisée, lève le veto QA.
3. Ni parler ni agir → maintenue (unanime).
4. Identifiants stables → maintenue.

VERDICT FINAL — recevable sous réserve (`parcours` au lieu de `lieux_visites`, co-présence définie, PNJ sans presence exclus)
