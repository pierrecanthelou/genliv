# PM produit — dossier-repetition it3, tour 2

RÉPONSES AUX AUTRES
- [UX + NIA] Dépliable, trace, Badge combats → veto durci, reporté en it4. Relire le parcours est un second comportement. `lieux_visites` + `trace` stockerait deux fois la même donnée (KR-013).
- [TL] `parcours: readonly string[]` → adopté, retire `lieux_visites`. Un seul champ, l'ordre conservé, it4 l'enrichira.
- [TL] PNJ sans `presence` EXCLUS → refus. Exclure rendrait « Tous les personnages ont été croisés » faux. Les lister ne coûte rien (`some()` sur `[]` → false).
- [UX] ListeConstats → pas créé en it3, inline ListRow + `<ul>`.
- [QA] Veto critère #8 → levé par la définition co-présence. Trois cas limites deviennent critères.

STATUT DE MES OBJECTIONS
1. parler/agir → retirée (unanime)
2. Dépliable + Badge → durcie en veto (reporté it4)
3. Libellé « EN 20 PAS » → retirée (consensus « SUR CE PARCOURS »)
4. Étalon → retirée (dette à déclencheur)

VERDICT FINAL — recevable sous réserve (veto si trace/dépliable restent dans it3)
