# Tour 2 QA — dossier-repetition it2

**Date** : 2026-10-08  
**Lecteur** : QA (skill `raffinage-iteration`, mode A — avant code)

---

## RÉPONSE À UX — Objection 3

UX critique le manque de garde de complétude sur le switch des motifs : copier-coller, aucun compile-time check. C'est mon domaine — un motif oublié rend du vide silencieux au panneau, jamais détecté par test. TL propose la solution (`switch exhaustif avec garde never`) — **c'est recevable et exigible**. TypeScript refuse la compilation si une variante de l'union manque au `case`. Les 5 discriminants de `RapportRepetition` doivent chacun matcher un `case` + `default: never` obligatoire.

---

## STATUT DE MES OBJECTIONS TOUR 1

**1. Type `MotifArret` incomplet**
- **Retirée** (TL et PM d'accord). Union finale : `fin | impasse | pas_max | mort | combat_sans_issue` (5 motifs) avec discriminants dans `RapportRepetition`. Le type est spécifié, observable, testable.

**2. `combat_sans_issue` non défini**
- **Durcie en exigence**. TL précise : « `ROUNDS_MAX` rounds de `jouerPosture` orchestrés en `ongoing` perpétuel ». C'est exploitable — comptage direct dans le test. Mais la **valeur** de `ROUNDS_MAX` (PM 20, TL 30, NIA 50) reste ouverte. Elle doit être **explicitement chiffrée** (une seule valeur) et **mutée** (KR-315) : si `ROUNDS_MAX=29` rougit le témoin et `ROUNDS_MAX=31` le passe, c'est 30 qui était juste. Sans mutation, on ne voit pas le mutant `±1` qui invalide la borne.

---

## VERDICT TOUR 2 — **Recevable sous réserve**

À condition que :
1. Type amendé avant it2 (TL spécifié).
2. `ROUNDS_MAX` chiffré par PM/NIA et muté (cf. objection 2 ci-dessus).
3. Panneau : `switch` exhaustif + `default: never` (TL + UX).
4. Mutations inter-combats vérifiées (NIA objection 2) : `cloreCombat` appliquée après chaque combat pour refléter l'usure cumulative. Un test (« mort_au_combat_2 ») montre qu'un héros blessé au combat 1 meurt au combat 2 — ce qui invalide « héros reparti à PV max ».

