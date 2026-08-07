# Tour 2 — QA · `dossier-format` it3

## Réponse nommée

**UX Designer** propose `jet_reussi` (arité 0) dans `PREDICATES`. Objection : une arité 0 **casse le patron de test aux bornes** `arity-1 / arity / arity+1` que j'exige moi-même (KR-165) — `arity-1 = -1` n'existe pas, le test générique ne se généralise pas. Motif propre à mon domaine, indépendant du veto sémantique du narratif. **Je soutiens l'exclusion de `jet_reussi` du schéma 1** : un prédicat qui casse son propre patron de test n'a pas sa place dans une première itération de registre.

## Mes objections du tour 1

- **RISQUE** (`contre_mesures` sans forme, ligne « INDÉTERMINÉ » de ma matrice) → **RETIRÉE**. Tech-lead et narratif convergent sur 5 familles + report nommé. KR-158 est honoré par un report écrit, pas par une forme — ce que j'exigeais.
- **OBJECTION** (balayage de couverture, feuilles seules) → **RETIRÉE SOUS CONDITION**. `expr.test.ts` couvre la structure en ciblé (arité, profondeur, `non` à 0/2 enfants) ; la règle du narratif cadre légitimement `couverture.test.ts` sur le remplacement de type au niveau du champ. **Conditions** : (a) le docstring de `couverture.test.ts` énonce cette frontière **par écrit** ; (b) le défaut C12 est **journalisé**, pas seulement mentionné en revue.

## Conflits — arbitrage dans mon domaine

- **C1** : tranché, 5 familles ; le report nommé ferme ma matrice.
- **C2/C3** : hors mon domaine. Contrainte instrumentale : le champ porteur des références doit rester un **tableau**, quel que soit son nom — sans quoi le test aux bornes ne s'écrit pas pour les prédicats d'arité ≥ 2.
- **C4** : cardinalité hors mon domaine. Invariant non négociable : **chaque entrée retenue a ≥ 1 instance en fixture**, sans exception. `jet_reussi` exclu.
- **C5** : **j'accepte la dérivation.** Le test asserte `PREDICATES[predicat].refKinds.length` — pouvoir de test identique. Mon objection tombe.
- **C7** : je tranche pour **4 codes distincts** — `expr-malformee` (opérateur), `predicat-inconnu`, `arite-invalide`, `condition-sans-expr`. **Motif** : le test doit pouvoir asserter `issue.code`, jamais une sous-chaîne française — grouper arité et opérateur sous un seul code oblige ce test précis au *string-matching*, fragile à toute reformulation.
- **C8** : j'accepte **seulement si un test nommé existe** ; sinon veto — chemin de code neuf sans régression nommée. *(Devenu sans objet : son auteur l'a retirée.)*
- **C9** : fermé, voir ci-dessus.
- **C10 / C11 / C13** : hors mon domaine — aucun instrument jest/tsc/eslint concerné.
- **C12** : **MAINTENUE** — report à it4 accepté **seulement si journalisé maintenant** (`bug_history.json` + KR dans `specification.json`), pas seulement dit en revue.
- **C14** : convergence actée.

## VERDICT

**Recevable sous réserve** : (1) les **4 codes** de C7 adoptés — assertion sur `issue.code`, jamais sur le texte ; (2) le défaut C12 **journalisé** avant d'écrire une ligne de code ; (3) docstring de frontière sur `couverture.test.ts` ; (4) `jet_reussi` hors schéma 1 ; (5) la symétrie C8 n'entre que si accompagnée de son test nommé. Sous ces cinq conditions, aucun veto QA ne subsiste.

---

## ANNEXE — matrice de rejet définitive

| Entrée fautive | Code | Canal | `location` nomme |
|---|---|---|---|
| `objectifs[].reussi_si_expr` référence une entité absente | `reference-pendante` | error | « Objectif « {nom} » » (repli indexé) |
| `objectifs[].echoue_si_expr` référence une entité absente | `reference-pendante` | error | idem, `path` distinct |
| `fins[].condition_expr` référence une entité absente | `reference-pendante` | error | « Fin « {nom} » » |
| `fins[]` porte `condition_texte` sans `condition_expr` | `condition-sans-expr` | warning | « Fin « {nom} » » |
| `jalons[].declencheur_expr` référence une entité absente | `reference-pendante` | error | « Jalon « {nom} » » |
| `evenements[].declencheur_expr` référence une entité absente | `reference-pendante` | error | « Événement « {nom} » » |
| `personnages[].plan_actions[].declencheur_expr` référence une entité absente | `reference-pendante` | error | « Personnage « {nom} » » (**pas l'étape**) |
| `objectifs[]` porte `reussi_si_texte` sans `reussi_si_expr` | `condition-sans-expr` | warning | « Objectif « {nom} » » |
| `ExprNode.op` hors `{et, ou, non, predicat}` | `expr-malformee` | error | le champ porteur |
| `predicat` absent de `PREDICATES` | `predicat-inconnu` | error | idem |
| arité ≠ `refKinds.length` | `arite-invalide` | error | idem |
| `et`/`ou` avec < 2 enfants | `arite-invalide` | error | idem |
| `non` avec ≠ 1 enfant | `arite-invalide` | error | idem |
| profondeur > `PROFONDEUR_MAX_EXPR` | `expr-malformee` | error | idem |
| clé inconnue sur un nœud | `expr-malformee` | error | idem |
| une cible qui ne résout pas dans l'espace attendu | `reference-pendante` | error | idem |
| `contre_mesures[].declencheur` | — | — | **HORS PÉRIMÈTRE it3** — retiré de la matrice |

## ANNEXE — tests nommés définitifs

| Test | Niveau | KR |
|---|---|---|
| `expr › refuse un op hors et/ou/non/predicat` → `expr-malformee` | unitaire | KR-117/164 |
| `expr › refuse une cle inconnue sur un noeud` → `expr-malformee` | unitaire | KR-117 |
| `expr › refuse un predicat absent du registre` → `predicat-inconnu` | unitaire | KR-117 |
| `expr › refuse une arite differente aux bornes arite-1 / arite / arite+1` → `arite-invalide` | unitaire | KR-165 |
| `expr › refuse et/ou a 0 ou 1 enfant` | unitaire | KR-165 |
| `expr › refuse non a 0 ou 2 enfants` | unitaire | KR-165 |
| `expr › accepte a la profondeur 8, refuse a 9` | unitaire | KR-165 |
| `expr › collectRefs collecte sur au moins 3 niveaux imbriques` | unitaire | KR-169 |
| `validate › un test PAR FAMILLE : reference absente bloquante, nomme le champ et l identifiant` | contrat | KR-021/164 |
| `validate › un …_texte sans …_expr avertit, pilote par alerteSansExpr` (+ discriminant : jalon/evenement/plan_actions restent calmes) | contrat | D1 / KR-162 |
| `couverture › 4e assertion : tout path de table a une instance dans la fixture, par prefixe normalise` | contrat | condition d'entrée it2-a |
| `couverture › docstring nommant ce qui n est PAS couvert` | contrat | KR-173 |
| test-grep — `op` / `predicat` interprétés au **seul** site `validateExpr` | statique | KR-117/169 |
| `roundtrip › un arbre a 3 niveaux traverse import puis export intact` | contrat (fichier réel) | KR-156 |
| `couverture › tout chemin finissant par _expr a une destination valant moteur` | contrat | narratif obj. 1 |
| fixture — chaque entrée de `PREDICATES` a ≥ 1 instance | contrat | C4 |
| `bug_history.json` — entrée journalisée pour C12 | traçabilité | KR-173 étendu |

## Non vérifiable en l'état

- La cohérence de `docs/ROADMAP-BASCULE-IA.md` § D1 (C11) : **aucun instrument** jest/tsc/eslint ne vérifie une prose `.md` — revue humaine seule.
- `lieux[].acces` (C10) : aucun code touché en it3, aucun instrument concerné.
- Toute assertion sur `contre_mesures[]` : hors périmètre, aucun instrument tant que la racine n'existe pas.
- L'exhaustivité des voies d'élargissement de la forme d'un nœud : `validateExpr` prouve que les formes **nommées** sont rejetées, pas l'absence de toute autre.
