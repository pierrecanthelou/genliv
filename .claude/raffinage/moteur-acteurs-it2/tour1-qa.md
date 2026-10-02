# Raffinage `moteur-acteurs` it2 — Tour 1 — QA

## RISQUE

KR-280 : fail-closed sur les deux portes (`contrepartie` + `apres_indice_id`) — conjonction ET stricte seule. KR-285 : `indices_reveles` au schéma IFF son lecteur (carnet) existe en it2. KR-286 : carnet = vue DÉRIVÉE du journal. KR-282 : relations secrètes isolées par assembleur.

## OBJECTION

1. **ET vs OU** — scénario séparateur obligatoire (un seul critère vrai ne révèle PAS).
2. **Idempotence** — savoir re-proposé → zéro doublon journal/carnet.
3. **Doublon d'indice** — R4 retourne `['I1', 'I1']` → UNE ligne affichée.
4. **Consommation** — `contrepartie.consomme:true` → objet absent journal.
5. **Format rang** — `indices_reveles` en rangs, jamais ids.

## PROPOSITION

Sept critères observables :

1. Deux portes vraies → révèle + delta. Une vraie → ne révèle PAS (séparateur).
2. Idempotence observée.
3. Validation doublon ou fusion.
4. Consommation vérifiée.
5. Rang dans sortie R4.
6. Carnet vide → invite + zéro ListRow.
7. Carnet N révélations → N lignes, libellé dérivé journal, jamais `monde.indices[].nom`.

**Instruments** : CONTRAT `evaluate.test.ts`, `schemaSortie.test.ts`, RTL `CarnetIndices.test.tsx`, mutation `&&`.

## VERDICT

**RECEVABLE SOUS RÉSERVE STRICTE.**
- Scénario séparateur #1 nommé (deux cas tuant OU).
- Consommation #4 testée CONTRAT.
- Prérequis : trois indices fixture, au moins un révélable (absent it1).

## Décisions prises en autonomie

Rangs cohérents R1/R3 ; validation stricte doublon ; libellé journal (évite `auteur`).

---

## Annexe — Scénario séparateur (critère #1)

**Cas A** : `contrepartie.consomme=true`, `apres_indice_id=null` → ne révèle PAS.
**Cas B** : `contrepartie.consomme=false`, `apres_indice_id='idx-absent'` (indice n'existe pas) → ne révèle PAS.
**Cas C** : les deux vrais → révèle.

Un test qui tue une implémentation OU : B ou C doivent rendre des résultats différents en journal.

