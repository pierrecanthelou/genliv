# dossier-repetition it1 — QA — Tour 1

**RISQUE** — L'itération couvre 13 critères, mais cinq manquent de test nommé. Sans noms, ils seront marqués « non vérifiés » en mode B.

**OBJECTION**
1. Critère 3 liste « 5 motifs d'arrêt » mais n'en couvre que 3 en it1 (fin, impasse, combat_ouvert). Scinder.
2. Critère 10 « moteurSansIA.test.ts étendu » ne dit pas comment. L'instrument balaie TROIS racines. Ajouter la 4e exige de re-mesurer les planchers.
3. KR-312 est connu mais AUCUN critère ne le couvre : combat_ouvert est un « arrêt », jamais un « blocage ». À ajouter.

**PROPOSITION** — 5 assertions nommées :
1. Reproductibilité graine : `repeter.test.ts::reproductibilite_graine` avec `expect(repeter(d, 42)).toEqual(repeter(d, 42))`.
2. Scinder critère 3 : it1 = 3 motifs (fin, impasse, combat_ouvert), it2 = 2 (mort, combat_sans_issue).
3. Lieux/PNJ non atteints : reporter à it3 avec noms d'assertions.
4. moteurSansIA : préciser « dossier-repetition/utils/ ajouté à RACINES_DU_PERIMETRE, planchers re-mesurés ».
5. KR-312 : « Un rapport avec motif='combat_ouvert' n'est pas compté comme défaut ».

**VERDICT** — Recevable sous réserve : scinder critère 3 et ajouter les 5 noms de tests.
