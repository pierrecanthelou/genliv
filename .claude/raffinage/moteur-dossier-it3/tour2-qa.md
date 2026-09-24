# Tour 2 — qa — moteur-dossier it3

```
RÉPONSE
(a) B — déjà convergé : B se prouve sur DEUX jalons de dossier-reference.json partageant
    reveler_indice, jamais un rejoué. J'adopte.
(b) effet par === — testable, mutant INCHANGÉ : le spread inconditionnel produit toujours
    une référence NEUVE et un doublon ; rouge sous les deux mécanismes.
(c) narratif REJETTE la projection — critère C TOMBE : `projeterJalonsAtteints` sérialisée
    n'a aucun lecteur non-test en it3 (KR-249). REMPLACÉ par un critère sur `session.journal`
    (lecteur réel : `JournalRow`) — répond à PM objection 1 sans rouvrir KR-246.

MES OBJECTIONS
1 (expr.test.ts absent du lot) — RETIRÉE : intégré au Lot 1 tech-lead.
2 (VETO KR-252) — DURCIE : correction à TROIS cellules (M-3) ; `controles.test.ts` N'EST PAS
  vert sans modification (4 rouges mesurés) — contredit l'INTERDIT tech-lead.
3 (surface de rendu absente) — RETIRÉE : UX + PM convergent sur une ligne de journal.

MESURES
- 3 cellules corrigées : plancher RÉEL `tourzeroOracle.test.ts:148` = 4 (pas 5, le tech-lead
  sous-compte `indice_connu`).
- `possede_objet` seul → indecidable : `tourzero.test.ts` 2 rouges (témoin Kleene)
  + `controles.test.ts` 4 rouges (snapshot référence + 3 tests `objectif-perdu`).
- `lieu_visite` seul → 'faux' hors départ : `controles.test.ts` 55/55 VERT — piège #5 du
  tech-lead FAUX : `fins[].condition_expr` n'est JAMAIS lu par `controles.ts`.

VERDICT — recevable sous réserve.
```

*(Toutes les mesures rejouées par `Bash`, restaurées par `git checkout --` après chacune ; `git status --short -- src/brain/dossier/` vide en fin de tour.)*

## Les trois mesures, brutes

**1. Plancher de `tourzeroOracle.test.ts:148`, trois cellules corrigées ensemble** → `Expected: >= 6 / Received: 4`. Le calcul du tech-lead (« 6 → 5 ») ne comptait **qu'UNE** perte sur `indice_connu` ; `dossier-minimal.json` en porte **DEUX** (2 indices). Perte réelle : 6 − 2 − 1 + 1 = **4**.

**2. `possede_objet` seul → `'indecidable'`** :
- `tourzero.test.ts` : **2 rouges** — `:217` et surtout `:239` (« les connecteurs suivent Kleene… »), parce que ce test réutilise **`feuilleNue('possede_objet')` comme constante `FAUX`** pour prouver la propagation `et`/`ou`. **Personne au tour 1 n'avait vu cette dépendance cachée.**
- `controles.test.ts` : **4 rouges** — le snapshot exact du rapport sur `dossier-reference.json` (`:1650`), qui **perd un vrai positif réel** (`objectif-perdu-a-l-ouverture` sur `objectif.proteger-le-sceau` : « le héros ne possède pas encore le sceau » devient indécidable et **le linter se tait**), plus 3 tests du describe `objectif-perdu-a-l-ouverture` (`:2339`, `:2369`, `:2422`) qui prennent tous `possede_objet` comme prédicat d'exemple.

**3. X-1, `lieu_visite` seul → `'faux'` hors départ** : `controles.test.ts` **55/55 VERT**. Vérifié par lecture de `controles.ts` en entier : `charpente.fins[].condition_expr` n'est **jamais** évalué par le linter — seule sa **présence** est vérifiée (règle `condition-sans-expr`), jamais son contenu. Le seul lecteur de `tourzero.ts` dans `controles.ts` est `objectif.echoue_si_expr`, et le seul objectif concerné de `dossier-reference.json` porte `evenement_consomme`. **Le piège #5 était une conclusion juste sur le sens d'erreur, mais un motif d'observation faux** — même famille BUG-080/087 que M-1, cette fois côté tech-lead.

## ANNEXE — liste finale : 7 critères (≤ 8)

**A — `evaluerExpr` LÈVE (KR-238), réécrit sur nœud FABRIQUÉ** *(jamais une fixture — M-1)*. ÉD un `ExprNode` casté `{ op: 'xor', … } as ExprNode`, **nu ET sous un `non` au sommet** · Q `evaluerExpr` le résout · A il **LÈVE** dans les deux positions, jamais il ne rend `true`. Unitaire.
Séparateur : « lève » et « rend false » ne coïncident **que sous le `non`**. Mutant : `default: return false`.
*Pouvoir séparateur inchangé vs tour 1 — seule la fausse promesse (« une fin se déclenche ») disparaît.*

**B — `journal[].deltas` idempotence (KR-247/248), sur DEUX jalons.** ÉD `dossier-reference.json`, deux jalons distincts dont l'`effet[]` demande le **même** `reveler_indice`, résolus dans la même passe · Q les deux se déclenchent · A première entrée `'applique'`, seconde `'sans_effet'`, `indices_connus` **sans doublon**. Unitaire.
Séparateur : sans deux jalons, demandé/observé coïncident toujours. Mutant : spread inconditionnel — **rouge sous les deux mécanismes** (déclaratif et `===`).

**C — jalon atteint RENDU au journal** *(remplace la projection sérialisée ; KR-246 reportée n° 10)*. ÉD `dossier-minimal.json`, une commande `ALLER` qui fait basculer la condition **EN COURS** de session · Q commande acceptée · A `session.journal` gagne, **au même `tour`**, l'entrée du jalon puis ses pastilles de delta, **sans sous-chaîne** d'`enonce_texte`/`declencheur_texte`. Unitaire + composant.
Séparateur : sans commande post-ouverture, la démo ne prouve que la décision (i). Mutant : composer `texte` en injectant `jalon.nom` au lieu de le reconstruire.

**D — Correction JOINTE des TROIS cellules + oracle + non-régression `controles` (KR-252), DURCI.** ÉD `dossier-minimal.json` · Q `ouvrirSession` résout avant la première action · A `indices_connus`/`jalons_atteints` peuplés dès l'ouverture ; `tourzeroOracle.test.ts:148` ≥ **4** *(plancher RE-MESURÉ)* ; `tourzero.test.ts` 8/8 avec `VALEUR_ATTENDUE` amendée **en une édition** pour les trois cellules et **le témoin Kleene `FAUX` RÉASSIGNÉ** ; **ET** la perte du vrai positif `objectif.proteger-le-sceau` **assertée en négatif**, jamais laissée passer en silence. Unitaire + contrat.
Séparateur (l'oubli, mesuré) : cellule non corrigée → oracle **rouge nommément**.

**E — Quatrième lecteur d'`ExprNode` admis.** Inchangé, déjà mesuré ROUGE avant amendement.

**F — Table d'audience de session étendue (KR-241).** Inchangé (4 → 7 feuilles).

**G — Point fixe BORNÉ, témoin en ordre INVERSE du document** *(tech-lead, famille BUG-087 — la QA l'exige nommé et testé)*. ÉD deux jalons chaînés où le second **dans l'ordre du document** doit se déclencher AVANT que le premier ne devienne atteignable · Q `resoudreJalons` en point fixe borné · A les deux finissent atteints, **quel que soit l'ordre**. Unitaire.
Séparateur : une passe unique en ordre de document **rate la chaîne inversée — verte** sur ce même dossier. Mutant : `for` unique sans reboucle.

## Vérifié par personne

Les **trois cellules `indecidable`** ne sont **assertées par aucun instrument** — l'oracle les tait par construction (solidité seule). **Leur correction se prouve par l'ABSENCE d'assertion, jamais par un test vert.** Et personne ne mesure que la table dorée n'est pas concernée (KR-243) — **la revue doit l'écrire noir sur blanc, pas la déduire**.

## Décisions en autonomie

- **Le témoin Kleene `FAUX` de `tourzero.test.ts:227`** (`feuilleNue('possede_objet')`) n'était nommé par personne → je propose **`pnj_a_revele`** comme remplaçant (seul prédicat restant certain-`'faux'`) → si un autre porteur est choisi, **il doit rester déterministe-`'faux'` sous les trois cellules corrigées**, sinon le test Kleene devient lui-même indécidable et perd sa capacité à séparer `et`/`ou`.
- **Le critère C n'est pas simplement reporté** : je le **remplace** par un critère de journal dans le même lot → sinon l'objection PM 1 reste sans réponse testée, et l'itération retombe **dans la forme exacte de BUG-090** que le cadrage nomme déjà.

## REJETÉ (BUG-082)

- **Piège #5 du tech-lead** (`lieu_visite: 'faux'` traîne `controles.test.ts`) — **mesuré FAUX** : `controles.ts` ne lit jamais `fins[].condition_expr`.
- **Plancher « 6 → 5 »** dérivé par lecture — **mesuré FAUX** : la valeur réelle est **4**.
- **L'hypothèse que `controles.test.ts` reste hors du lot 1** — **REJETÉE sous la cellule AVEUGLE** : `possede_objet → indecidable` seul y fait rougir 4 tests.
