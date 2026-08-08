# Tour 1 — QA

```
RISQUE      — Le repointage « EN PLACE » de LibraryScreen sur DossierService.list() rend orphelines, sans que le cadrage le dise, les ~150 lignes de tests search/tri/sync-chip (it2/it3 de book-library) : contrairement à rename/duplicate, explicitement reportés, rien ne classe ces trois-là. Une couverture instrumentée qui disparaît sans ligne dans le diff est exactement le risque KR-162 nomme.

OBJECTION   — AC1 confond deux réparations sous « BUG-048 fermé » : la visibilité d'un dossier invalide dans list() (nouveau) et le garde-fou réel de KR-179 — `existant = get(id)` dans importDossier, qui doit devenir un test de CLÉ. Aucun critère ne nomme le test de ce second fix ; sans lui, BUG-048 reste ouvert malgré la porte verte.

PROPOSITION —
1. Test nommé pour le vrai fix : `DossierService.importDossier.test.ts` — « une clé occupée par un document devenu invalide refuse l'import (message dédié), jamais écrasée » (persistance corrompue manuellement).
2. Test nommé pour l'ordre KR-004 : `DossierService.remove.test.ts` — « retire la clé avant d'émettre dossier:deleted », espion d'appels ordonné.
3. Classer explicitement search/tri/sync-chip dans `iterations_log` : SUPPRIMÉS (aucun équivalent Dossier avant une itération dédiée) ou LAISSÉS si Book reste listé — mais alors une AC doit le dire.
4. Sur la q5 : oui, démonter l'affordance ; test composition-root `App.test.tsx` — « + Nouveau livre absent tant que book-creation n'est pas repointée ».

VERDICT     — recevable sous réserve (le test du vrai fix BUG-048 + la classification explicite des 3 suites de tests silencieuses).
```
