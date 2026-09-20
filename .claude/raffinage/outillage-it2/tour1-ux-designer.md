# Tour 1 — `ux-designer`

RISQUE — Les 21 nouveaux labels de test et leur voisinage documentaire (annotations Stryker, CHANGELOG, bug_history) se rédigent en inventant un registre sur place au lieu de lire les deux conventions déjà en vigueur dans le dépôt — résultat : un troisième dialecte non écrit nulle part, illisible pour les dix sessions suivantes. Second risque, plus grave : le § 3 de `docs/REGLES-DU-JEU.md` ne décrit ni `ecart ≤ 0` ni l'égalité des AT (trou n°1) ; si a11/a13 sont écrits avant l'amendement, la valeur est nécessairement recopiée depuis `combat.ts`, violant KR-130.

OBJECTION — Le cadrage liste `docs/REGLES-DU-JEU.md` en « (R ?) », au conditionnel, alors que 9 des 49 mutants (a11, a13) portent précisément sur les deux branches absentes de la doc. Traiter cet amendement comme optionnel inverse l'ordre que le dépôt impose comme non négociable.

PROPOSITION — (1) Amender § 3 AVANT d'écrire a11/a13, texte exact en annexe. (2) Convention par type d'artefact, mesurée pas inventée : commentaires `// Stryker disable`, `CHANGELOG.md`, `bug_history.json` → français SANS accent, sans apostrophe (confirmé : `combat.ts:21/112`, CHANGELOG 0.6.51/0.6.52) ; les `it()` qui prolongent `gameSystem.test.ts` → gardent SA convention locale (accents conservés), sans apostrophe. (3) Si un fichier est scindé, nommage par module (`combat.test.ts`…) — le dépôt a déjà 14 fichiers `<Module>.test.ts` colocalisés ; jamais un nom dérivé du process.

VERDICT — recevable sous réserve : le § 3 de `docs/REGLES-DU-JEU.md` doit être amendé dans ce lot, avant l'écriture des tests a11/a13.

---

## ANNEXE

### 1. Amendement `docs/REGLES-DU-JEU.md` § 3 — texte exact proposé

**a) Table « Écart »** — ajouter une ligne avant `1` :

```
| Écart | Qualité | Multiplicateur | Effet bonus |
|-------|---------|----------------|-------------|
| ≤ 0 | Manqué | ×0 | — |
| 1 | Coup éraflé | ×0.5 | — |
```

Note sous la table, même style que la note `Rand(a,b)` déjà présente :

> Un écart ≤ 0 ne survient jamais entre un vainqueur et un perdant désignés (l'écart n'existe qu'entre eux, donc toujours strictement positif) ; la borne couvre l'égalité ci-dessous et tout appel direct de la fonction hors résolution d'assaut.

**b) « Résolution d'un assaut »** — ligne de blockquote après celle sur `Rand(a,b)`/bouclier, avant « Garde aiguisée » :

> **Égalité** : si `AT_attaquant = AT_défenseur`, l'assaut est nul — aucun vainqueur, aucun dégât, bande **Manqué**.

### 2. Convention de nommage des labels — table de décision

| Artefact | Convention observée | Preuve |
|---|---|---|
| `it()`/`describe()` dans `gameSystem.test.ts` | Accents conservés, zéro apostrophe | « écart bands », « challenge XP: equilibré base… » |
| `it()`/`describe()` dans `rules.golden.test.ts` | ASCII strict, zéro accent, zéro apostrophe | « CHALLENGE_TIERS est fige… » |
| `// Stryker disable next-line …: <motif>` | ASCII strict | `combat.ts:112` « egalite deja traitee » |
| `CHANGELOG.md`, `bug_history.json` | ASCII strict | 0.6.52, 0.6.51 |

Règle : les 21 labels **s'ils rejoignent `gameSystem.test.ts`** suivent SA convention locale. Tout fichier neuf suit la convention ASCII dominante et la plus récente. Aucune des deux n'admet l'apostrophe.

### 3. Refus motivé

Refus de tout nom de fichier de test encodant le PROCESS plutôt que le PROPOS — `combat.mutation.test.ts`, `killMutants.test.ts`. Motif : un fichier de test décrit ce qu'il vérifie (le module), jamais comment on a trouvé le besoin de l'écrire. Si le Tech Lead tranche pour un split, l'axe doit être le module, à la manière des 14 fichiers déjà colocalisés.

Ne se prononce pas sur le nombre de lots ni sur l'équivalence `!!x → x` — hors domaine.
