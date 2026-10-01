**RISQUE**
Divergence mécanique silencieuse entre calcul d'XP et classification d'amorce. L'itération doit extraire une constante nommée (ex. MARGE_FRANCHE=3) de xp.ts et la réutiliser dans arbitre.ts pour passer `classifierIssue` de 2 catégories (reussit/echoue) à 3 (reussit_nettement/reussit_justesse/echoue). Si deux seuils sont codés en dur (l'un pour le bonus XP, l'autre pour l'amorce), un bug futur qui change l'un sans l'autre restera invisible — aucun test ne crie faux. C'est exactement le trou que le score de mutation voit mais que jest ne voit pas.

**OBJECTION**
1. **Absence de scénarios de test nommés pour les trois branches critiques.** Le critère 7 énonce « un jet réussi » mais n'énumère pas (a) marge ≥ 3 → bonus XP, (b) 0 ≤ marge < 3 → XP de base seul, (c) marge < 0 → pas d'XP du tout. Sans ces trois cas limites explicitement testés, le score de mutation verra survivre un mutant qui tue le bonus ou inverse la condition, et jest restera vert. Veto sur l'absence de test « Étant donné un jet réussi avec marge < 3 (justesse), quand challengeXp crédite, alors heros.xp += baseXp SANS bonus » et « Étant donné un jet échoué (marge < 0), alors heros.xp inchangé ».

2. **Nom de la constante non fixé.** Le plan dit « une constante nommée extraite de xp.ts ». Aucun nom de symbole n'est imposé (MARGE_FRANCHE ? SEUIL_BONUS ? MARGE_NETTE ?). C'est une décision en autonomie faute de spécification, acceptée si documentée dans le dossier de revue d'it3.

3. **Absence de critère d'acceptation explicite pour le score de mutation.** La spécification ordonne « npm run test:mutation est dû » mais ne fixe pas la cible de break attendue ni les conditions de passage. Le WORKFLOW.md dit break=90 (plafond atteint en B2), mais la spec d'it3 reste silencieuse. À compléter : « Définition de fini : score de mutation ≥ 90 sur xp.ts, mesuré et rapporté dans la revue d'it3 (4 fichiers Brain, ce score seul pour xp.ts). » Sans ce critère nommé, il n'est pas observable avant commit.

4. **API de `classifierIssue` non reformulée.** Elle prend aujourd'hui `ChallengeResult` (contient `success`). Pour accéder à la marge, elle a besoin de `margin: number` en paramètre supplémentaire — le plan d'it2 dit « issue = CODE classe », mais comment elle reçoit la marge n'est pas spécifié. Est-ce via `issueDuJet` qui la calcule avant ? Est-ce un paramètre du calculateur d'XP ? À clarifier.

**PROPOSITION**
1. Trois scénarios de test nommés dans le critère 7 (XP) :
   - « Scénario A : jet réussi avec marge=4 (nettement, dépassement band), heroTier=2, challengeTier=3 — alors challengeXp retourne baseXp + 1 (bonus appliqué) »
   - « Scénario B : jet réussi avec marge=1 (justesse, seuil critique), mêmes tiers — challengeXp retourne baseXp SEUL »
   - « Scénario C : jet échoué (marge < 0) — challengeXp retourne 0, heros.xp inchangé »
   Ces trois doivent passer ET tuer chacun un mutant distinct du score de mutation (ex. `margin >= 3` muté en `margin > 3` tue A, `margin >= 3` muté en `margin > 2` tue B).

2. Clarifier le changement d'API de `classifierIssue(resultat, margin)` qui passe de 1 à 2 paramètres, et son impact sur les deux appelants (CarteJet via issueDuJet, assembleur narrateur it2).

3. Ajouter à la définition de fini (section `resolved_decisions` du plan d'it3) : « Constante nommée MARGE_FRANCHE (ou identifiant retenu) = 3, sourcée docs/REGLES-DU-JEU.md §5, réutilisée par challengeXp (bonus) et classifierIssue (classification) — vérification par grep/test que deux sites distincts consultent la MÊME adresse de symbole. »

4. Nommer le test de non-régression pour KR-261 : `src/brain/xp.test.ts — 'KR-261 : seuil unique marge, pas dupliqué'` — assertion que challengeXp et classifierIssue appellent la même constante (pas un mock séparé).

**VERDICT**
**Recevable sous réserve**

Réserves non-levables sans réécriture du plan d'it3 :
- Trois scénarios de test nommés couvrant les trois branches de marge (proposition 1).
- Clarification de l'API de `classifierIssue` et de ses deux points d'usage (proposition 2).
- Critère de fini explicite pour le score de mutation (proposition 3).
- Test de non-régression nommé pour KR-261 (proposition 4).

Pas de veto sur le périmètre produit ni sur l'esthétique. Le contrat de design reste stable (it1 § 8 #3 : tons neutres en it1, couleurs sémantiques it2 seul). Le risque clé est mesurable et connu de l'instrumentation (mutation score) — un bon signe que la limite est juste atteinte et qu'une itération bien écrite la traverse.
