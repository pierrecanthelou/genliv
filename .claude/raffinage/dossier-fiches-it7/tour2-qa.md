## Note QA — tour 2 (contre-lecture), dossier-fiches it7

**RISQUE** — Je n'ai pas retrouvé dans `tour1-tech-lead.md` la liste de 11 tests ni le « test #10 » tels que décrits dans le cadrage de ce tour : son annexe D (tour 1) liste 3 critères (dernier personnage, bandeau nomme le référençant, sonde focus), pas une liste de tests nommés. L'arithmétique tient (mes 9 tests + 2 tests narratif-ia non redondants = 11), donc j'évalue le fond sur cette base reconstituée — mais je n'ai pas pu constater ce document tel quel au tour 1, je le signale.

**OBJECTION** — nommément à narratif-ia (obj. 1, `issues.ts`) : réécrire les 2 assertions + un anti-retour ne suffit pas. KR-171/BUG-042 est un précédent de RÉCIDIVE : la chaîne périmée peut être dupliquée ailleurs. La DoD doit inclure `grep -rn "réimportez" src/` en revue, zéro résidu hors les 2 lignes corrigées — sinon la table verte fige un doublon oublié.

**Gap** : les 3 critères propres au tech-lead (§D tour 1) n'avaient aucun test nommé formellement associé dans ce que j'ai lu — KR-199 (sonde discriminance focus) cité sans test nommé = veto par ma propre règle, à lever si le tour 3 fusionne effectivement critère et test. Test de refus-avec-modale : observable mais doit isoler le mécanisme (restauration native de `Modal` sur le bouton encore présent au refus) et prouver qu'`intentionFocus` n'est PAS posé au refus, sinon un bug qui le poserait passerait inaperçu par coïncidence de cible.

**PROPOSITION** — nommer explicitement au plan les tests couvrant chacun des 3 critères du tech-lead ; le test de refus-avec-modale reformulé en Étant-donné/Quand/Alors avec l'assertion de mécanisme ; ajouter le grep anti-résidu à la DoD d'`issues.ts`.

**VERDICT** — recevable sous réserve des 3 points ci-dessus ; sinon veto limité à eux seuls.

---

**Mes objections tour 1**
- GWT du goal / tension modale : modale tranchée par consensus → retirée pour la partie modale ; GWT des `acceptance_criteria` propres à it7 dans `specification.json` non vérifié ce tour → maintenue sur ce point précis, à vérifier au plan final.
- Risque KR-197 (double indexation, retrait) → retirée, couverte par les tests affichage + invalidation deux entités.
- Risque KR-194 (auto-référence, écriture) → retirée, couverte par le test dédié.
