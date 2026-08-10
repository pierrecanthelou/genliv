## 1. Le critère reformulé est-il observable ? Forme du test, et correction du chiffre

**Recevable, observable — mais ce n'est pas le même instrument que mon patron grep original**, et il faut le dire dans le plan.

Le patron `dossierEditorScreen.test.tsx:60-66` fait un `fs.readFileSync` sur **un fichier nommé** + `toContain`/`not.toContain` sur une **sous-chaîne littérale**. Le critère reformulé (« aucun code de production ne navigue vers `{name:'editor'}` ») porte sur **tout le dépôt**, pas un fichier nommé, et doit distinguer un *appel* (`router.navigate({ name: 'editor', … })`) d'une simple *lecture* (`route.name === 'editor'`, légitime dans `TreeCanvas.tsx:51`, `ConflictDialog.tsx:14`, `App.tsx:21`, et le type dans `Router.ts:19`). Une simple recherche de la sous-chaîne `'editor'` produirait donc des faux positifs sur ces quatre sites légitimes. Le test que j'écrirais :

```ts
// parcours récursif de src/, hors **/tests/** et **/*.test.ts(x), .ts/.tsx uniquement
// regex tolérante aux sauts de ligne, ancrée sur l'appel :
/\.navigate\(\s*\{\s*name:\s*['"]editor['"]/s
expect(contrevenants).toEqual([]) // liste des chemins de fichiers en violation
```

C'est toujours jest + `node:fs`, aucun nouvel outil — mais ça ajoute un petit marcheur de répertoire (récursif, exclusion de `tests/`) que le patron actuel n'a pas besoin d'écrire puisqu'il vise un seul fichier. **À écrire dans le plan, pas laissé à l'ouvrier** — même discipline que ma proposition de tour 1.

J'ai vérifié `grep -rn "\.navigate(" src/ | grep -v /tests/` : **aujourd'hui, zéro appel de production ne navigue vers `'editor'`** — ce test est donc un verrou anti-régression, pas une preuve de travail neuf de cette itération. C'est cohérent avec le veto du Tech Lead (ne rien toucher) : le critère ne demande aucun changement de code, seulement de figer l'invariant.

**Correction du chiffre du Tech Lead** : ~15 est une surestimation. Comptage précis par `it(` :
- `TreeCanvas.test.tsx` : **10 tests**, et les 10 rendent `<App/>` via `setup()` ou directement, tous naviguent vers `{name:'editor'}` et assertent la composition d'`EditorScreen` (« 2 nœuds »/« 3 nœuds », bouton « Compacter » `aria-pressed`) — les 10 seraient rouges si `EditorScreen.tsx` était vidé ou supprimé.
- `geometry.test.ts` : **25 tests**, `nodeView.test.ts` : **2 tests** — vérifié : ni l'un ni l'autre n'importe React Testing Library, ne rend `<App/>` ni ne navigue. Pures fonctions de layout. **Aucun des 27 n'est affecté** par une modification d'`EditorScreen.tsx`.
- `ConflictDialog.test.tsx` : **3 tests** (pas 2, correction de mon propre chiffre de tour 1 — vérifié à la lecture complète du fichier), mais aucun ne rend `<App/>` ni `EditorScreen` — il rend `<ConflictDialog/>` directement. Il dépend uniquement de la variante `Route.editor` (déjà vetoée séparément par le Tech Lead), **pas** du contenu d'`EditorScreen.tsx`.

Donc : **exactement 10 tests** vont rouge sur toute modification d'`EditorScreen.tsx`, pas ~15, et le total « 37 tests tree-canvas » de mon tour 1 se décompose maintenant en 10 affectés / 27 non affectés — la conclusion du Tech Lead (veto) tient à plus forte raison puisque même ce sous-ensemble réduit reste un rouge inacceptable au regard du critère original « reste vert sans modification ».

## 2. `git diff --stat` vide est-il suffisant comme définition de fini ?

**Non, pas seul.** `git diff --stat` vide sur les 3 chemins tree-canvas + `ConflictDialog.test.tsx` prouve la **propriété de fichiers** (personne n'a édité ces chemins) — c'est nécessaire mais ça ne prouve pas que les tests **passent encore**. Le lot 1 touche `brain/hooks.ts`, `brain/components/index.ts`, `brain/index.ts`, `brain/Router.ts` (commentaire) — tous dans le graphe d'import de `TreeCanvas.tsx`. Une régression introduite là ferait rougir `TreeCanvas.test.tsx` sans toucher un octet des 4 chemins surveillés, et `git diff --stat` ne le verrait pas.

Je maintiens ma proposition de tour 1 : en plus du `diff --stat` vide, un **compte de tests figé** dans la revue, avant/après, nommé — `TreeCanvas.test.tsx` = 10, `geometry.test.ts` = 25, `nodeView.test.ts` = 2, `ConflictDialog.test.tsx` = 3 (corrigé), soit **40 tests verts**, mesurés avant le lot 1 et reconfirmés après le lot 2. Les deux preuves ensemble (fichiers inchangés + compte de tests identique et vert) sont la définition de fini ; l'une sans l'autre laisse un trou.

## 3. Le texte d'état vide qui ment (Canon/Départ/Lieux) — critère testable ?

**Oui, testable au niveau composant, sans cas hypothétique à inventer.** Il n'existe aucun chemin de production produisant un « dossier vide théorique » — tout dossier passe par `DossierService.create()` (amorce KR-178), qui sème systématiquement Canon/Départ/Lieux. Le test correct n'oppose donc pas « dossier neuf » à « dossier vide » : il assert, **pour un dossier fraîchement créé via `create()`**, le texte exact affiché pour les 10 sections, section par section — même doctrine que `dossierEditorScreen.test.tsx:21` (« rendu au mot près »). Le tableau de l'UX (texte corrigé « {Section} — l'écran d'édition arrive avec la feature n°{X}. ») donne déjà les 10 littéraux attendus ; `screen.getByText(...)` un par un après sélection de chaque `ListRow`. Recevable comme critère, à condition que le plan cite le texte exact des 10 sections (pas une paraphrase) — sinon même vice que « l'expérience est fluide ».

## Statut de mon objection de tour 1

**Retirée.** Mon objection portait sur l'inobservabilité du critère #30 tant que le point #7 (vidé/supprimé) restait ouvert, et ma proposition penchait pour « vidé » sur la foi du seul patron grep, sans avoir mesuré le rayon sur `TreeCanvas.test.tsx`. Le Tech Lead a mesuré ce que je n'avais pas mesuré (rendu réel, assertions de composition, pas seulement présence) et tranché par un troisième chemin — ne pas toucher le fichier, reformuler le critère — que je n'avais pas envisagé. Mon comptage indépendant (10 tests exactement, pas ~15) renforce ce veto au lieu de le contredire : même le sous-ensemble réellement affecté est un rouge net et injustifiable au regard du critère original. Le critère reformulé est observable (§1) avec un test que je peux nommer précisément. Rien ne reste à trancher côté testabilité — objection levée, sous réserve que le test recursif-grep et les 10 littéraux de §3 soient écrits noir sur blanc dans le plan avant lots.

## VERDICT

**Recevable sous réserve** :
1. Le critère reformulé (§1) remplace le critère #12/#30 tel quel dans le plan, avec la forme de test exacte (marcheur récursif hors `tests/`, regex ancrée sur `.navigate(`) écrite en toutes lettres — pas laissée à l'ouvrier.
2. Le baseline de non-régression de la revue porte les comptes corrigés : 10 (TreeCanvas) + 25 (geometry) + 2 (nodeView) + 3 (ConflictDialog, corrigé de 2 à 3) = 40 tests verts avant/après, **en plus** du `git diff --stat` vide sur les 4 chemins.
3. Le critère sur les 10 textes d'état vide (§3) entre au plan avec les 10 littéraux exacts de la table UX, testé « au mot près » sur un dossier issu de `create()` — pas de cas « dossier vide théorique » à fabriquer.

Aucun veto restant de ma part.
