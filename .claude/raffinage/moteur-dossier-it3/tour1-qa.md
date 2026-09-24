# Tour 1 — qa — moteur-dossier it3

```
RISQUE      — Le lot « contrat » couple deux gestes MESURÉS comme solidaires : (a) la correction
              jointe des deux cellules de tourzero.ts, qui force UNE réécriture de VALEUR_ATTENDUE
              (tourzero.test.ts:200/217/242, rejoué et confirmé) ; (b) l'entrée d'evaluate.ts comme
              QUATRIÈME lecteur d'ExprNode dans expr.test.ts. Si l'un des deux est oublié dans le
              lot, l'instrument voisin ne le voit pas.

OBJECTION 1 — expr.test.ts est ABSENT de la liste « fichiers probablement concernés » (§ 8) alors
              que MESURÉ : un evaluate.ts jetable avec switch(noeud.op) fait rougir expr.test.ts:420
              (3→4 lecteurs). Il doit entrer dans le lot contrat, pas être découvert en cours de lot.
OBJECTION 2 — Aucun critère n'asserte la correction KR-252 elle-même (les deux cellules + l'oracle).
              Sans lui, « prévu et non subi » reste une phrase. VETO tant qu'il n'est pas écrit et testé.
OBJECTION 3 — La phrase de démo « l'auteur VOIT un jalon s'atteindre » ne nomme AUCUNE surface de
              rendu dans les critères actuels. Soit la démo est interne, soit une entrée de journal
              manque au périmètre.

PROPOSITION — (1) Ajouter expr.test.ts au lot contrat. (2) Ajouter le critère D, qui REJOUE la mesure
              « oubli ». (3) Trancher en toutes lettres la surface de « voit » avant d'écrire le
              critère jalons.

VERDICT     — recevable sous réserve : les 3 objections tranchées avant lot.
```

## Mesures effectuées (`Bash`, restauration `git checkout --` après chacune, `git status` propre)

**1. `evaluate.ts` quatrième lecteur — ROUGE, mesuré.** Un `evaluate.ts` jetable avec `switch (noeud.op)` exhaustif + `default: throw` fait rougir **1 test**, « *un lecteur d'arbre est soit le SEUL site de la grammaire, soit exhaustif au compilateur* », à la ligne **420** : `lecteurs` passe de `[atteignabilite.ts, expr.ts, tourzero.ts]` à `[atteignabilite.ts, evaluate.ts, expr.ts, tourzero.ts]`. **L'amendement est LÉGITIME** : la docstring dit « un lecteur est admis à UNE condition : être exhaustif au compilateur », et elle a **déjà été réécrite une fois** pour admettre un 3ᵉ lecteur (`tourzero.ts`, it10 de la n° 7). C'est un garde conçu pour s'étendre, pas un plafond.

**2. Fixtures — aucune fixture DOSSIER neuve nécessaire.** `dossier-minimal.json` et `dossier-reference.json` portent déjà `charpente.jalons[]` avec `declencheur_expr` **ET** `effet[]` (`jalon.premiere-nuit` : `lieu_visite(val-cendre)` → `reveler_indice(sceau-brise)`). `dossier-reference.json` a même un jalon **sans** `declencheur_expr` (`jalon.second-guet`), utile pour le cas « coché à la main ». En revanche `__fixtures__/session-saturee.ts` (fixture SESSION) **ne porte aucune instance de `deltas`** : si `EntreeJournal.deltas?` entre au type avec sa ligne d'audience **sans** instance, `sessionCouverture.test.ts` rougira (« aucune ligne morte »). `couverture.test.ts` et `controles.test.ts` ne sont concernés par **aucune** des deux fixtures dossier, it3 ne touchant ni `types.ts` ni `destinations.ts`.

**3. `tourzero.test.ts` — coût REJOUÉ, toujours vrai après it2.** `indice_connu: () => 'faux'` → `'vrai'` et `lieu_visite: () => 'indecidable'` → `'vrai'` : **3 tests rouges**, lignes **200**, **217**, **242**. Le `:242` cité par it1 est bien le témoin `INDECIS` du test Kleene — confirmé : `INDECIS = feuilleNue('lieu_visite')` cible **par coïncidence** la même chaîne que `LIEU_DU_DEPART`, donc amender la cellule `lieu_visite` fait taire précisément le témoin que ce test utilise pour prouver « une branche indécidable fait taire un `et` ».

**4. `tourzeroOracle.test.ts` rougit-il sur l'OUBLI ? OUI — mesuré.** `ouvrirSession` patchée pour simuler la décision (i) (les effets d'un jalon à `lieu_visite(depart)` appliqués à l'ouverture), **sans toucher `tourzero.ts`** : l'oracle est **ROUGE**, « *aucune cellule vrai ou faux ne contredit la session d'ouverture* », divergence nommée **`indice_connu(indice.sceau-brise) · table faux → état true`**. Et `tourzero.test.ts` reste **VERT 8/8** dans le même run — exactement la répartition annoncée par it1 : l'un régresse en silence (la table se compare à elle-même), l'autre le rattrape par confrontation à un ÉTAT réel. **L'oracle rend bien l'oubli impossible**, à condition que la correction du moteur et celle de la table entrent dans le **MÊME lot**.

**5. Score de mutation — KR-243 confirmé.** Aucun des 4 fichiers mutés n'est au périmètre d'it3.

## ANNEXE — critères candidats

**A — L'évaluateur bivalent LÈVE (KR-238).** ÉD un `ExprNode` portant un `op`, un `predicat` ou une cible qu'`evaluerExpr` ne reconnaît pas · Q il le résout · A il **lève**. Niveau : unitaire.
**Séparateur** : au nominal, « lève » et « rend false » coïncident partout **SAUF sous un `non`** — le test appelle `evaluerExpr({ op: 'non', enfant: <nœud inconnu> }, faits)` et vérifie qu'il **lève aussi**, jamais qu'il rend `true`.
**Mutant** : `default: return false` sur la branche de repli. Sous lui, ce même appel rend `true` — la `fins[].condition_expr` du KR se déclenche au tour 1.

**B — `journal[].deltas` demandé/observé, idempotence (KR-247/248).** ÉD le même delta (`reveler_indice`, `indice.sceau-brise`) demandé **deux fois** · Q la seconde est journalisée · A elle porte `effet: 'sans_effet'` et `monde.indices_connus` est **inchangé entre les deux** (égalité de tableau, pas de longueur). Niveau : unitaire.
**Séparateur (BUG-113)** : sans la double demande, demandé et observé **coïncident toujours**.
**Mutant** : `reveler_indice: (faits, cibles) => ({ ...faits, indices_connus: [...faits.indices_connus, cibles[0]] })` — toujours `applique`, jamais de test de présence. Rouge : la seconde entrée vaut `'applique'` et `indices_connus` porte un doublon.

**C — Projection des jalons, type nominal (KR-246).** ÉD `dossier-minimal.json` et une session où `jalon.premiere-nuit` est atteint · Q la projection est sérialisée · A la sous-chaîne de `declencheur_texte` est **absente**. Niveau : unitaire.
**Séparateur** : un test de FORME reste vert sur un `Pick<Jalon, …>` élargi d'un mot en revue ; seule la **sérialisation sur fixture réelle** sépare.
**Mutant** : `dossier.charpente.jalons.filter((j) => monde.jalons_atteints.includes(j.id))` rendu tel quel (`Jalon[]` complet). Rouge : la sous-chaîne apparaît. Plus test-grep du lecteur unique de `charpente.jalons`.

**D — Correction JOINTE des deux cellules + oracle (KR-252) — ABSENT du plan, à ajouter, sinon VETO.** ÉD `dossier-minimal.json` · Q `ouvrirSession` résout les `declencheur_expr` avant la première action · A `monde.indices_connus` contient `'indice.sceau-brise'` et `monde.jalons_atteints` contient `'jalon.premiere-nuit'` **dès l'ouverture**, ET `tourzeroOracle.test.ts` reste vert, ET `tourzero.test.ts` reste vert avec sa `VALEUR_ATTENDUE` amendée **en une seule édition pour les deux cellules**. Niveau : unitaire + contrat.
**Séparateur (l'oubli, MESURÉ, reproductible)** : cellule `indice_connu` **non** corrigée alors que le moteur applique l'effet → l'oracle rougit **nommément**.

**E — Quatrième lecteur d'`ExprNode` admis (contrat, MESURÉ nécessaire, absent du § 8).** ÉD `evaluate.ts` créé avec un aiguillage exhaustif (fermeture `: never`, motif `jamaisEvalue` identique à `tourzero.ts`/`atteignabilite.ts`) · Q `expr.test.ts` s'exécute · A la liste des lecteurs passe à quatre et compte une fermeture par aiguillage. Niveau : contrat, test-grep **à amender dans le lot**.

**F — Table d'audience de session étendue (KR-241).** ÉD `EntreeJournal.deltas?` ajouté, la table étendue, `session-saturee.ts` amendée d'une instance · Q `sessionCouverture.test.ts` s'exécute · A aucune ligne morte, aucune feuille sans ligne. Niveau : contrat.

**REJETÉ — « les descripteurs portent `lit`/`ecrit` » comme critère autonome.** Non observable seul : un champ ajouté sans test de comportement qui l'exerce est une note d'implémentation, pas un critère. **Fusionné dans A et B**, qui l'exercent par leur usage d'`evaluerExpr`/`appliquerDelta`.
