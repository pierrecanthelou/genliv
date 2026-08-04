# Revue d'itération — `dossier-format` · itération `1`

> Exécutée le 2026-08-04 · plan `.claude/raffinage/dossier-format-it1.plan.md` (marqué `validé`, porte 2 franchie le 2026-08-04)
> Exécution : **séquentielle, 2 lots, sans worktree** · lot 1 `contrat` (`dev-contrat`) puis lot 2 (`dev-lot`) · intégration + QA mode B
> Verdict QA : **RECEVABLE**

## En une ligne

**L'auteur peut importer un dossier d'aventure dans sa bibliothèque** — déposer un fichier `.json`, voir en français ce qui l'empêche d'être jouable, et confirmer.

## Critères d'acceptation

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Fixture minimale → `ok:true`, `errors:[]`, dossier typé, sans exception | `VÉRIFIÉ` | `dossier/validate.test.ts:31` |
| 2 | `schema` ≠ 1 → `schema-inconnu`, jamais coercé | `VÉRIFIÉ` | `validate.test.ts:42` — **7** valeurs balayées (`undefined`, `'1'`, `0`, `2`, `1.5`, `true`, `null`). QA a cassé la comparaison stricte en `String(…) !== String(…)` : le test rougit, puis restauré (md5 identique) |
| 3 | Racine/champ obligatoire vide bloquant ; optionnel absent silencieux | `VÉRIFIÉ` | `validate.test.ts:65,88,116` |
| 4 | Code dans l'union fermée, `path` stable, `location` par nom, `message` sans fuite technique | `VÉRIFIÉ` | `validate.test.ts:129` balaie 7 codes ; le 8e (`dossier-deja-importe`, produit par le magasin et non par le validateur) est désormais couvert par `DossierService.test.ts` — **c'était le défaut mineur remonté par la QA, corrigé** |
| 5 | Identifiant mal formé / dupliqué / `depart.lieu_id` pendant → bloquant, entité nommée | `VÉRIFIÉ` | `identifiers.test.ts` + `validate.test.ts:206`. QA a forcé `resout = true` : le test rougit, puis restauré |
| 6 | Canon > `BUDGET_MOTS_CANON` → `warnings`, `errors` vide, `ok:true` | `VÉRIFIÉ` | `validate.test.ts:219` (600 → rien) et `:229` (601 → un avertissement). QA a doublé la borne : le test rougit, puis restauré |
| 7 | Round-trip depuis un **fichier réel du disque**, deep-equal, re-validable, gelé quel que soit le chemin | `VÉRIFIÉ` | `roundtrip.test.ts` (`fs.readFileSync`, KR-156) — 3 chemins (`importDossier`, `get`, `exportDossier`) + le chemin d'adoption cloud dans `CloudSyncService.test.ts` |
| 8 | Fichier valide + confirmation → modale fermée, confirmation nommant le dossier | `VÉRIFIÉ` | `importDossier.test.tsx:42` — RTL sur `App` complet, `userEvent.upload` réel, vérifie le texte **et** la persistance (`dossiers.get(…)?.titre`) |

**8 / 8 vérifiés.** Trois critères ont été éprouvés par casse-restaure de l'implémentation : ils rougissent quand le code est faux, ce ne sont pas des assertions décoratives (KR-162).

## Diff par lot

| Lot | Fichiers | Lignes | Conforme au § 5 |
|---|---|---|---|
| 1 `contrat-dossier` | 44 (14 créés, 30 remplacés) | +2 104 / −110 | ✅ exactement la liste, rien de plus |
| 2 `import-dossier` | 10 (8 créés, 2 remplacés) | +635 / −2 | ✅ exactement la liste, rien de plus |
| **Total** | **55** | **+2 740 / −113** | aucun fichier partagé entre les deux lots |

Sept suites de test neuves, **+74 tests** : 485 → **559**, 39 → **46 suites**. (55 livrés par les deux lots, 19 ajoutés en réponse à la revue de PR.)

### Le rayon de la scission `types.ts` → `tree.ts` — remesuré trois fois

**26 fichiers** voient leur ligne d'import changer : **21 dans `src/brain/`**, **5 dans `src/player/`** (`Edge` seul), **0 dans `src/features/`** — le baril `brain/index.ts` ré-exporte les six types sous les mêmes noms, donc aucune feature ne bouge. Mesuré par l'ouvrier, par l'orchestrateur, puis par la QA : identique.

**Nuance relevée par l'intégrateur, et elle est juste** : « 26 fichiers, une ligne d'import chacun » est exact pour 23 d'entre eux ; les 3 autres (`index.ts`, `CloudSyncService.ts`, `CloudSyncService.test.ts`) portent **en plus** du contenu contractuel neuf, parce qu'ils appartiennent aussi à la liste « contrat ». Le lot 1 touche **30** fichiers en remplacement, dont 26 au titre de la scission. Les deux nombres mesurent deux choses différentes ; KR-159 a été reformulé pour ne plus les confondre.

## Ce qui a été refusé (les `REJETÉ` du registre — invisibles dans le diff)

- **`parseExpr(src: string)`** — `…_expr` est un **arbre** (`ExprNode`), jamais une chaîne, et il n'existe aucun parseur. Supprime la grammaire à spécifier/versionner/tester, toute la classe des erreurs de syntaxe, et la question de la syntaxe montrée à l'auteur — que `PREDICATES` résout en pilotant le rendu par widgets (KR-168). *Hors périmètre d'it1 ; la décision est posée pour it3.*
- **`migrateDossier`** — sans schéma 2, elle n'aurait ni test ni appelant (KR-160). Seul le **rejet** de tout `schema` ≠ 1 est livré.
- **`evaluate(state, expr)`** — part en n° 9, comme **champ** du descripteur de prédicat, jamais un `switch` sur `PredicateId`.
- **`construireContexte(dossier, etat, role)`** et le test « aucune clé de charpente dans un payload » — aucun assembleur n'existe avant la n° 10, donc aucun instrument. Ce qu'it1 lui doit, c'est que `Pick<Dossier, 'canon' | 'monde'>` soit **possible** : les trois racines le garantissent.
- **`list` / `remove` / `create` / `rename` / `duplicate` / `update` / `useDossiers` / `useOpenDossier`** — zéro appelant avant la n° 2. `DossierService` s'arrête à **quatre** méthodes : un service dont la moitié n'est exercée par personne est de la dette, pas un contrat.
- **`meta.voix`** — la deuxième personne au présent est une constante du runtime, pas un réglage d'aventure.
- **`depart.personnage_joueur.contraintes`** — supprimé du schéma (tranché le 2026-08-04) : le typer créait un second endroit où vit une règle que `charCreation.ts` applique déjà ; le garder en prose laissait du texte inapplicable.
- **« aucun composant React n'existe » comme critère** — une absence n'est pas observable. Remplacé par la propriété positive : aucun critère n'est prouvé par un écran.

## Ce qui a été reporté

| Reporté | Destination | Motif |
|---|---|---|
| `jalons[].effet: Delta[]` typé | **it2** | `DELTAS` arrive en it4 ; une forme sans producteur ni validateur n'est pas testable. L'échéance réelle est la fermeture de la feature, garantie par it2 |
| Forme complète des treize racines | **it2** | it1 déclare les trois racines avec un sous-ensemble **minimal** |
| `ExprNode` + `PREDICATES` | **it3** | — |
| `DELTAS` + `Delta` | **it4** | — |
| Dossier de référence 6 PNJ / 5 lieux + checklist de suffisance | **it5** | it1 livre une fixture **minimale et distincte** |
| Écriture non validée par le chemin d'adoption cloud | **n° 9** | Le veto du tech-lead ferme la **lecture** (`get()` re-valide) ; l'écriture reste ouverte, seconde porte au démarrage de session |
| Détection de conflit cloud sur un dossier | **n° 2** | `conflictMap` est indexée par clé de livre ; un dossier gelé n'a aucun éditeur local avant la n° 2 |
| Correctif `--surface-raised` dans `ImageUpload.tsx:185` | journalisé | Défaut préexistant hors des deux lots → **BUG-035** |

## Écarts assumés

Six, tous nommés par leurs auteurs, aucun n'affecte un critère.

1. **`tree.ts` importe 4 configurations, pas les 7 du § 4** — seules 4 sont référencées par `BookNode` ; importer les 3 autres casserait `tsc` (`noUnusedLocals`). Le **sens** de la dépendance — la propriété que le plan achète — est intact.
2. **`Entite.nom` est optionnel** (`nom?`), là où le § 4 écrivait `{ id; nom }`. Sans ça le repli « {Type} n°{index} (sans nom) » du § 3.3 est **inatteignable** et le test « un optionnel absent est calme » n'aurait aucun champ optionnel à exercer — il serait une constante, pas une assertion.
3. **`Monde.evenements: unknown[]` et `Monde.conditions: Record<string, unknown>`** — ces deux clés n'ont aucun espace de noms dans `ESPACES_DE_NOMS` (registre figé à 9) ; les typer `Entite[]` aurait inventé une contrainte non arbitrée. Le contenu traverse import et export **intact** (prouvé par le round-trip). it2 leur donne leur forme.
4. **`DOSSIER_ISSUE_LABELS` porte la colonne QUOI FAIRE du § 3.3, verbatim**, et `dossierIssueRemediation(issue)` résout les marqueurs — le lot 2 ne fait **aucune** substitution à la main. Inventer un troisième jeu de libellés aurait été inventer du texte.
5. **Le bouton de reprise réouvre directement le sélecteur** plutôt que de revenir à l'état `empty` — un clic de moins, cohérent avec « ↪ Choisir un autre fichier ».
6. **`featureDirs.test.ts` lit `.eslintrc.cjs` comme texte** (regex sur le littéral) plutôt que par `require()` : exporter `FEATURE_DIRS` depuis le `module.exports` fait échouer ESLint 8 (« Unexpected top-level property »), vérifié empiriquement puis annulé. Le test lit donc la source qu'ESLint exécute réellement, sans risquer la porte de lint → **BUG-036**.

## Défauts traités pendant la revue

| Sévérité | Origine | Traitement |
|---|---|---|
| mineur | QA — `DossierService.test.ts` ne portait aucune assertion négative sur le message `dossier-deja-importe`, alors que `validate.test.ts:134` lui déléguait explicitement ce 8e code | **Corrigé** : balayage `FUITES_TECHNIQUES` + `location`/`path` non vides. Porte re-passée verte → **BUG-037** |

## Porte qualité

| Étape | Résultat |
|---|---|
| `npm run format` | propre |
| `npm run typecheck` | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning préexistant (`CharacterCreationScreen.tsx:35`, non touché) |
| `npm test` | **46 suites / 559 tests, 100 % verts** (39 / 485 avant l'itération) |
| `npm run test:mutation` | **sans objet** (KR-161) — `git status` confirme que `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts` ne sont pas touchés ; `stryker.config.json` intact |

**Invariants** : `Object.freeze` seulement dans `freeze.ts` **à l'échelle du module dossier** — le dépôt en porte deux autres, sans rapport (`BrainContext`, `UIPreferencesService`) ; c'est le périmètre qu'épingle le test, et c'est celui qui compte ✅ · aucune conversion `Book` ↔ `Dossier` ✅ · zéro ligne dans les cinq features survivantes ✅ · aucun fichier hors périmètre de lot ✅ · un seul `useEffect` dans le lot 2, et c'est un déplacement de focus DOM, pas un miroir d'état (KR-013) ✅ · les 26 tokens `var(--*)` utilisés existent tous, `--surface-raised` absent ✅.

**KR-163 constaté rouge avant correctif**, et re-vérifié **deux fois indépendamment** — par l'intégrateur (restauration de l'ancien `CloudSyncService.ts`) et par la QA (neutralisation de l'abonnement `dossier:opened`) : 3 tests rougissent, dont exactement celui que le plan nomme.

## Revue de PR — ce que le tech-lead a bloqué

Verdict initial : **`REQUEST_CHANGES`**, quatre majeurs. Tous fermés avant que la tranche atteigne la revue humaine — c'est la fonction du pré-filtre.

| # | Constat | Traitement |
|---|---|---|
| M1 | `validateDossier` s'annonce **pure** et gelait **l'argument de l'appelant**, en place et seulement quand `ok`. En n° 2/n° 3, valider un brouillon pour l'afficher l'aurait rendu immuable, et la mutation suivante aurait **jeté** (module ESM = mode strict). Aucun test ne disait dans quel sens ça devait marcher. | Gèle désormais une **copie** (par JSON — c'est la sémantique de la persistance, donc ce qui est rendu est exactement ce qui sera écrit). Test `gele une copie et rend l argument INTACT`, qui vérifie aussi que l'argument reste réellement mutable, pas seulement non marqué → **BUG-038** |
| M2 | L'`id` racine vient du **fichier importé**, n'était contraint que par « chaîne non vide », et devient tel quel une **clé de stockage** — alors que `:` est le séparateur réservé du découpage de clés (`dossierContentKey` / `dossierImageKey`, n° 3 / n° 4). Un `id` valant `x:content` entrait en collision **par construction** avec la future clé de contenu de `x`. Chaque `id` d'**entité** du même document passait, lui, par une forme. | `FORME_ID_DOSSIER` (`^[a-z0-9][a-z0-9-]*$`), code `identifiant-invalide`, message écrit pour l'`id` de dossier. 9 tests (7 formes refusées, les légitimes acceptées, et « un `id` vide reste `champ-requis-vide` » — une cause, une anomalie). `:` déclaré réservé dans `persistenceKeys.ts` → **BUG-039** |
| M3 | `dossierIssueRemediation` est exporté du baril et **n'avait aucune assertion** ; **tout l'état `invalid`** de la modale — l'anatomie à trois lignes, le badge pluralisé — n'était monté nulle part. C'est la moitié de la démo, et le contrat que n° 7 réutilisera. | 3 tests unitaires sur la remédiation (marqueur résolu par `path` et non par `location`, libellé sans marqueur intact, les **huit** codes préfixés `↪` sans marqueur résiduel) + 2 tests RTL montant l'état `invalid` : OÙ par nom, identifiant entre parenthèses, QUOI, QUOI FAIRE résolu, le chemin JSON **jamais** affiché seul, et l'accord singulier/pluriel du badge → **BUG-040** |
| M4 | **`charpente` est déclarée « ce que l'IA ne voit jamais »** — c'est la justification entière du groupement en trois racines. Or D1 place `fins[].condition_texte` et `jalons[].declencheur_texte` **sous `charpente`**, et un `…_texte` est par définition destiné au contexte du modèle. Deux des six familles atterrissent dans la racine confinée. | Aucun code : it1 ne livre pas les `…_texte`. Porté en **`open_questions`, marqué BLOQUANT POUR it2**, avec les deux issues nommées et départagées : (a) remonter les `…_texte` de fin et de jalon sous `canon`, la charpente ne gardant que les `…_expr` ; (b) remplacer le `Pick` par une projection explicite — plus souple, mais elle rend la fuite vérifiable par un test d'exécution au lieu d'une erreur de compilation, ce que la décision de groupement refusait justement |

Les **six mineurs exigés** sont fermés aussi : trois affirmations documentaires fausses ou périmées (« `Object.freeze` en un seul endroit **du dépôt** » — il y en a trois, le test dit correctement « du module dossier » ; `Delta[]` « en itération 1 » ; `meta.ton` alors que `meta` n'existe pas), KR-159 qui n'était reformulé que dans `code-knowledge.json` et divergeait de la spec, le test d'exhaustivité des tables du validateur, le test-grep de l'asymétrie `types.ts` / `tree.ts`, et la remédiation de `dossier-deja-importe` qui conseillait une suppression **qui n'existe pas** (« ↪ Supprimez-le avant de le réimporter » → « ↪ Changez le champ « id » du fichier pour en importer une copie distincte »).

**Deux avis non bloquants portés en `open_questions`** plutôt que corrigés : `downloadJson`, gardé au tri **au motif nommé** que la n° 1 livrerait l'export, n'a toujours aucun appelant et aucune itération ne le lui donne ; et `open`/`exportDossier` n'ont d'appelant que des tests — deux méthodes sur quatre, exactement le critère qui avait fait sortir `list`/`remove` (à vérifier à la clôture de la n° 2).

## `RETOUR-COMITÉ`

0. **Trois des quatre majeurs sont des propriétés que le plan ÉNONÇAIT et que rien ne tenait.** « Pur », « le seul site de gel », « `path` stable consommé par n° 7 » : écrits au § 4, vrais dans l'intention, non épinglés. Le § 10 d'un plan devrait exiger un test **par propriété nommée dans le § 4**, pas seulement par critère d'acceptation — un contrat sans instrument est une intention.
1. **Un décompte cité dans un plan doit dire ce qu'il compte.** « 26 fichiers, une ligne d'import chacun » a été mesuré exact et pourtant reste ambigu : 3 des 26 portent aussi du contenu neuf. Le prochain plan écrit le décompte **et** son prédicat (« fichiers dont la ligne d'import change »), pas seulement le nombre. C'est la deuxième fois que ce chiffre coûte du temps — il valait « neuf » au cadrage.
2. **Le veto « `get()` re-valide » a payé immédiatement.** Il a produit un test (`un document corrompu en magasin rend null`) qui n'existerait pas sans lui, et il ferme la moitié lecture d'un trou dont la moitié écriture est explicitement reportée en n° 9. Un veto de domaine qui nomme sa contrepartie reportée est un bon patron : à reconduire.
3. **Deux écarts sur trois viennent du § 4 trop précis, pas trop vague.** Le plan figeait `Entite { id; nom }` et « `tree.ts` importe 7 configurations » ; le code a dû dévier des deux pour rester cohérent. Figer une **signature** est utile, figer une **liste d'imports** ne l'est pas : le compilateur la déduit. Le prochain § 4 fige les types exposés et le **sens** des dépendances, pas leur énumération.
4. **Le trou d'outillage `var(--nom)` inexistant est confirmé** : rien ne détecte un token qui ne résout vers rien, et `ImageUpload.tsx:185` en porte un depuis avant cette itération. Trois relectures manuelles l'ont contourné ici ; ça ne tiendra pas sur seize features. Candidat pour `outillage-2` (BUG-035).
5. **La QA mode B en contexte neuf a trouvé ce que l'intégrateur n'a pas vu** — un commentaire de délégation dont la promesse n'était pas tenue à l'autre bout. Aucun grep ne trouve ça : il faut lire les deux fichiers en se demandant si la phrase est vraie. À garder comme consigne explicite de la QA.
