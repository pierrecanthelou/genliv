# Tour 1 QA — dossier-repetition it2

**Date** : 2026-10-08  
**Lecteur** : QA (skill `raffinage-iteration`, mode A — avant code)

---

## RISQUE

L'itération it2 doit orchestrer la boucle de combat et reconnaître ses terminaisons (mort du héros, victoire, combat_sans_issue). Cette orchestration touche quatre services consommés (`jouerPosture`, `cloreCombat`, `rejouerCombat`, `bilanDe`) qui n'ont jamais été appelés par `repeter()` en it1. L'absence de plan détaillé sur comment la boucle s'articule avec les 20 pas risque une implémentation non déterministe (deux runs même graine → combats différents), cassant KR-304.

---

## OBJECTION 1 : Type `MotifArret` incomplet

**Le type spec vs code divergent**

La spec it2 dit : « MotifArret enrichi mort/combat_sans_issue ». Or le code (repeter.ts:38) définit :
```ts
export type MotifArret = 'fin' | 'impasse' | 'combat_ouvert' | 'pas_max'
```

Les deux nouveaux motifs `'mort'` et `'combat_sans_issue'` manquent. Le type `RapportRepetition` doit être étendu en conséquence, avec des champs discriminants (ex : `PV_final`, `motif_arret`). Cela n'est pas observable tant que le type ne porte pas ces valeurs — aucun test ne peut vérifier qu'un combat aboutit à `mort` ou `combat_sans_issue` si elles n'existent pas en tant que variantes du type.

**Verdict** : Irrecevable tant que le type n'est pas amendé en spec.

---

## OBJECTION 2 : "combat_sans_issue" non défini

Critère d'acceptation : « L'arrêt reconnaît 5 motifs : fin, impasse, combat_ouvert (it1), mort, combat_sans_issue (it2) ». Or la spec ne définit jamais ce qu'est un combat_sans_issue. Est-ce :
- La fuite du monstre (REGLES-DU-JEU.md § 4) ?
- Un nombre de rounds atteint sans décision ?
- Une victoire du monstre qui n'est pas la mort du héros ?

Sans cette définition, le test nommé du critère ne peut pas être écrit. Une machine ne peut pas vérifier « l'arrêt reconnaît combat_sans_issue » sans savoir quelles conditions le déclenchent.

**Verdict** : Recevable sous réserve — REGLES-DU-JEU.md ou la spec doit clarifier ce motif avant raffinage.

---

## PROPOSITION 1 : Trier les critères par itération

Les 13 critères du plan mélangent it1, it2 et it3 (ex : § « parler/agir reportés à it3 »). Créer trois listes distinctes (`acceptance_criteria_it1`, `_it2`, `_it3`) rend la spec consultable et le périmètre observable pour chaque itération seule.

Coût : ~20 lignes de restructuration JSON.

---

## PROPOSITION 2 : Écrire le contrat de boucle de combat

Ajouter à `brain_contracts` une entrée explicitant l'orchestration :
- Combien de pas consomme la boucle de combat (1 pas ? 1 par round ?) ?
- Quel service trace les 5 postures du monstre (déterministe, RNG seedé) ?
- Quand sort-on : mort héros, mort monstre, fuite, ou impasse ?

Avec exemples concrets : « dossier X, graine 42, héros étalon vs gobelin → tours 1–3 normales + mort au tour 4 → consomme 1 pas (le pas qui ouvert le combat) ».

Coût : ~10 lignes spec + 1 test fixture.

---

## VERDICT

**Recevable sous réserve** — deux réserves à lever en raffinage :
1. Amender le type `MotifArret` et le commentaire d'it2 pour nommer la déf de combat_sans_issue.
2. Clarifier si la boucle de combat consomme 1 ou N pas du budget de 20, et comment.

Tout le reste du cadrage (héros synthétique, table dorée, moteurSansIA 4e racine) est clair et testable.
