# dossier-repetition it1 — Narratif & IA — Tour 1

**RISQUE** — Héros synthétique non spécifié. `buildHeroFromCreation` exige un `CreationAssignment`. La stratégie d'affectation détermine le profil du héros, donc les arrêts `combat_ouvert` (it1) puis `mort`/`combat_sans_issue` (it2). Un héros silencieusement déséquilibré rendrait le rapport trompeur.

**OBJECTION** — L'affectation n'est décidée nulle part. La spec dit « héros seedé en it1, héros étalon en it2 » et liste `rollCreationPool / buildHeroFromCreation` dans les contrats, mais ne dit pas COMMENT les 8 jets sont répartis entre FO..CA ni comment le bonus 1D4 est distribué. C'est une décision de conception narrative qui conditionne la reproductibilité ET la représentativité. Elle doit être arbitrée ici, pas laissée au codeur.

**PROPOSITION** — Fonction `creerHerosSynthetique(rng): HeroState` dans `repeter.ts`. Stratégie : `rollCreationPool(rng)`, affectation séquentielle (`rolls[i]` → `CHARACTERISTIC_VALUES[i]`), bonus réparti un par un sur la carac la plus basse (première en cas d'égalité). Déterministe, seedable, équilibré. Nom : `'Héros synthétique'`. Le type `MotifArret` est un union littéral exporté, avec `// it2 : 'mort' | 'combat_sans_issue'` en commentaire — le point d'extension est documenté sans être livré.

**VERDICT** — Recevable sous réserve : l'affectation du héros synthétique est spécifiée avant le code.

---

## ANNEXE — Frontières et point d'extension

**Contrat de sortie IA** : néant. Aucun appel modèle. La boucle `repeter` est code pur.

**Point d'extension nommé (it2/it3)** : `choisirCommande` et `acteurCooperatif` nommés au cadrage. En it1 : `choisirDestination(accessibles, rng)` isolé dans la boucle — un site d'appel unique, pas d'interface, pas d'abstraction.

**Frontières** :
- repeter.ts n'importe RIEN de `play-mode/` ni de `useTourDeJeu` (KR-309).
- Aucun CopiloteService, aucun rôle IA, aucun fetch.
- Le rapport n'est JAMAIS stocké (KR-310/013).
- Les motifs d'arrêt sont des identifiants mécaniques, jamais des jugements narratifs. « Arrêté sur un combat » (KR-312), jamais « Dossier cassé ».
