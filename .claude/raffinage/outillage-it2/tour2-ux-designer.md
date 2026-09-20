# Tour 2 — `ux-designer`

**M1 — corrigé** : `docs/REGLES-PLAY.md:61` (D2) tranche déjà l'égalité d'AT (« assaut nul, on rejoue un round, Défaut : OK »). Mon ajout b) du tour 1 ne créait pas une règle, il la **relocalisait sans le dire** — erreur de motif, pas de conclusion. KR-130 nomme `REGLES-DU-JEU.md`, **non son complément**, comme source de vérité de l'arithmétique de combat (§ 3 possède AT/PF/Écart) ; « on rejoue un round » est une décision de **boucle** que `resolveAssault` n'implémente pas — elle reste seule dans `REGLES-PLAY.md`, référencée **par pointeur**, jamais recopiée.

**M2 — tranché : aucune ligne de table.** `ecartBand(ecart <= 0)` est un **plancher défensif inatteignable** (cinq sites gardés), pas une valeur de jeu — une note sous la table suffit, plus un commentaire de test citant l'inatteignabilité.

**Au tech-lead** — `combat.rules.test.ts` : **conforme**, un module. `progression.rules.test.ts` : **NON conforme** — « progression » est déjà le mot du titre § 5 (XP) ; l'employer aussi pour § 1/§ 2 (`characteristics`/`challenge`) est un abus de vocabulaire établi. Renommer `hors-combat.rules.test.ts`, emprunté au titre § 2 (« Les Challenges — hors combat ») ; précédent de regroupement multi-module déjà posé par `rules.golden.test.ts`.

**(b) MAINTENUE, motif révisé** : l'amendement § 3 reste requis avant a13 — la clause « AT égales » relève de l'**arithmétique**, donc de `REGLES-DU-JEU.md`, pas seulement de son complément. **a11 est reclassé hors-doc** : plancher défensif, un commentaire de code/test suffit, pas de sourcing KR-130.

---

## ANNEXE

### 1. Texte verbatim définitif — `docs/REGLES-DU-JEU.md` § 3

**Ajout A** (blockquote, après la ligne 84 « *Garde aiguisée … Décourage la tortue défensive.* », avant `### Calcul des dégâts`) :

```
>
> **AT égales** : si `AT_attaquant = AT_défenseur`, l'assaut est nul — aucun vainqueur n'est désigné, l'Écart ne s'applique pas, la qualité est **Manqué** et aucun dégât n'est infligé. L'orchestration de la suite (le round est rejoué) est définie par `docs/REGLES-PLAY.md` (D2) ; ce document-ci ne fixe que la conséquence arithmétique de l'assaut.
```

**Ajout B** (note, juste après la table Écart — après la ligne `| ≥6 | Coup critique | ×2 | …`, avant « Dégâts finaux subis = … ») :

```
> Un Écart ne se calcule qu'entre un vainqueur et un perdant déjà désignés : il est donc toujours strictement positif (`≥ 1`). En cas d'**AT égales**, aucun vainqueur n'est désigné — voir « AT égales » ci-dessus ; cette table ne s'applique pas.
```

**Aucune ligne de table pour `ecart ≤ 0`.** Le lot A documente l'invariant dans le code/test :

```
// Plancher defensif : ecart <= 0 n'est jamais atteint en production (5 sites d'appel
// gardent ecart > 0) ; valeur de securite, non sourcee dans REGLES-DU-JEU.md.
```

ASCII strict, même convention que `combat.ts:112`.

### 2. Statut de mon objection du tour 1

**MAINTENUE, motif révisé.** Tour 1 disait « le § 3 ne décrit ni `ecart ≤ 0` ni l'égalité des AT » — **faux pour l'égalité** (M1) : elle est décrite, mais dans `REGLES-PLAY.md`, pas dans le fichier que KR-130 nomme source de vérité de l'arithmétique. **Nouveau motif** : a13 (mutants sur `combat.ts:110`, branche `tie`) épingle une valeur d'arithmétique de combat (`ecart=0`, `damage=0`, qualité `Manqué`) — cette valeur doit tracer à `REGLES-DU-JEU.md` lui-même, donc l'Ajout A doit être écrit **avant** l'assertion a13. **a11 sort du champ** : requalifié plancher défensif inatteignable (M2), il ne relève plus de KR-130.

### 3. Convention `it()` / `describe()` — confirmée inchangée

Aucun des fichiers neufs ne rejoint `gameSystem.test.ts` → **convention ASCII dominante et la plus récente** (zéro accent, zéro apostrophe), comme `rules.golden.test.ts` et les commentaires `// Stryker disable`.

### 4. Noms de fichiers

- `src/brain/combat.rules.test.ts` — inchangé, conforme.
- `src/brain/hors-combat.rules.test.ts` — **renommé** depuis `progression.rules.test.ts`. Même contenu, mêmes 11 blocs, même lot B.

### 5. Refus motivés

1. **Refusé** : le verbatim « Ajout 1 » du tech-lead — `| ≤ 0 | Manqué | ×0 | aucun dégât |` en tête de la table Écart. Motif : documente comme **valeur de jeu** une borne que les cinq sites d'appel ne produisent jamais (M2) ; une ligne de table dans un document de référence implique la reproductibilité en jeu. Remplacée par la note « Ajout B ».
2. **Refusé** : le nom `progression.rules.test.ts`. Motif : « progression » est déjà le mot du titre § 5 ; l'utiliser pour un fichier qui teste aussi § 1 et § 2 désigne mal son propre contenu.
3. **Refusé** : recopier « on rejoue un round » dans `docs/REGLES-DU-JEU.md`. Motif : décision de **boucle de jeu**, pas une valeur d'arithmétique ; `resolveAssault` ne l'implémente pas ; la dupliquer crée **deux sources pour le même fait**. `REGLES-PLAY.md` (D2) en reste l'unique porteur, référencé par pointeur.

### 6. Observation non bloquante

`capacityEffects.ts:104` écrit déjà `'manqué'` (minuscule) dans un journal lu par le joueur, pour un cas **différent**. L'Ajout A introduit **Manqué** (majuscule, code de qualité d'assaut) pour l'égalité d'AT. Deux usages distincts d'un mot courant, pas un conflit aujourd'hui — mais un futur écran de combat qui afficherait les deux journaux côte à côte devra les distinguer. Hors périmètre de B2 ; à noter pour le lot qui rouvrira l'affichage de `combatEngine.ts` / `capacityEffects.ts` (n° 9+).
