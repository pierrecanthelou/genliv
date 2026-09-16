# Revue d'itération — `dossier-controles` · itération `8`

**2026-09-16** · plan : `.claude/raffinage/dossier-controles-it8.plan.md` · notes de comité : `.claude/raffinage/dossier-controles-it8/`

---

## En une ligne

**L'auteur voit désormais que les objectifs qu'il a posés ne disent pas ce qu'il faut accomplir pour l'emporter** — et le linter reste muet sur la collection vide, comme sur toute autre collection.

---

## Les 8 critères

| # | Critère | Preuve |
|---|---|---|
| 1 | La collection vide reste muette | `seme().canon.objectifs` = `[]` → 0 constat ; les 4 lignes d'AC1 épinglées **par ce qu'elles décident** (`id · niveau · section`), jamais par un compte |
| 2 | La carte creuse allume l'alerte | Témoin = le littéral exact de `handleAjouter` ; `validateDossier(témoin).errors` = `[]` (KR-225) ; 1 constat `alerte · canon`, trois textes mot pour mot, `entityId` absent ; deux creux → **1** ligne ; ligne F épinglée |
| 3 | Les quatre barreaux se séparent | Un seul dossier, 4 mutations, **restauration** et re-vérification du barreau 1. Mesuré `0 · 1 · 1 · 1`, règles nommées, zéro recouvrement (KR-164) |
| 4 | Le `path` est une clé littérale | `estCleDe(DESTINATION_DES_CHAMPS, 'canon.objectifs[].reussi_si_texte')` = true ; `'canon.objectifs'` = false **des deux façons** ; totalité de `NEUVES` comparée à `CONTROLES` **à l'exécution**. Mutant : entrée retirée → **rouge** |
| 5 | La prose ne promet rien de faux | Trois familles déclarées, balayées sur les deux colonnes. Mutant QA : famille remplacée par un mot introuvable → **rouge** sur la ligne anti-BUG-084 |
| 6 | La remédiation nomme un écran producteur | Tranche de source entre les deux `label=` : contient `reussi_si_texte`, **pas** `echoue_si_texte` ; `'Condition de réussite)'` absent de la remédiation neuve **et** prouvé présent ailleurs dans `controles.ts` — un interdit sur un fantôme n'interdirait rien. Mutants QA sur les deux ancres → rouge |
| 7 | Les suites voisines ne bougent pas | **8 suites / 314 tests verts**, zéro assertion modifiée, aucun de ces fichiers ouvert ; les deux fixtures intactes |
| 8 | Le registre reste total par compilation | `tsc` exit 0 — impossible sans `TEMOINS['canon-sans-victoire']` ; rapport déclencheur `controlerDossier(cloneObjectifCreux())`, **distinct de `seme()`** qui ne déclenche pas cette règle |

---

## Le défaut trouvé — dans un INSTRUMENT, pour la QUATRIÈME itération d'affilée

**La QA en mode B a trouvé que la deuxième garde n'était pas éprouvée.** En la neutralisant entièrement, **les 47 tests restaient verts**, et le dépôt entier aussi.

La cause est structurelle, pas accidentelle : dans toute la suite, chaque dossier portant un `reussi_si_expr` portait **aussi** un `reussi_si_texte` non vide — soit hérité de `dossier-minimal.json`, soit parce que le barreau 4 du test des quatre barreaux **ajoute** `reussi_si_expr` sans jamais effacer la prose posée au barreau 3. La garde 3 masquait donc systématiquement l'absence de la garde 2, jamais l'inverse. La règle revendiquait « trois gardes cumulatives » ; **deux seulement étaient étayées.**

C'est la classe BUG-084 / BUG-087 / BUG-089 dans sa forme pure : la **valeur attendue** était mesurée et juste, le **pouvoir séparateur** ne l'était pas — et ce sont deux vérifications qui ne s'exécutent pas sur le même code. L'ouvrier les avait faites toutes les deux pour la garde 1 et pour la remédiation, pas pour la garde 2.

**Corrigé dans le même lot, par un test dédié** — et le choix de forme est motivé : un cinquième barreau aurait exercé la garde 2 **en même temps qu'`objectif-sans-chemin`** (l'expression du barreau 4 est inaccomplissable), donc rouge sur un état à deux règles. Le test dédié isole la garde **seule**, sur zéro voyant, dans l'état d'un vrai geste d'auteur : poser la condition structurée et laisser à vide la prose que `handleAjouter` a semée.

**Les trois gardes ont désormais chacune leur mutant mesuré** : garde 1 → 9 rouges + 4 en feature · garde 2 → 1 rouge, ligne 1842, l'assertion écrite pour ça · garde 3 → barreau 3 (`canon-sans-victoire` s'éteint, `condition-sans-expr` prend le relais).

---

## Le défaut qu'on a trouvé et qu'on ne corrige PAS — BUG-090

`condition-sans-expr`, livrée à it5, dit à l'auteur « Posez la condition structurée de réussite **(Objectifs → Condition de réussite)** ». Or le champ ainsi étiqueté sur cet écran écrit `reussi_si_texte` — **la prose même qui a déclenché l'avertissement**. La consigne est **circulaire** : la suivre ne change rien.

Aggravant, et c'est ce qui rend le cas instructif : **it7 a mesuré et épinglé l'inverse dans le même fichier**, deux itérations plus tard (`controles.ts` : « cet écran n'écrit pas la condition structurée — la phrase nommerait une surface qui n'existe pas »). Deux énoncés contradictoires cohabitaient dans un même module sans que personne ne les rapproche.

**Hors périmètre, donc non corrigé** — mais sa **non-réplication est mécanisée** par le critère 6, dont la seconde moitié prouve que la formule interdite existe bel et bien ailleurs dans le fichier.

---

## Diff, comparé à la liste du plan

| fichier | plan | livré |
|---|---|---|
| `src/brain/dossier/controles.ts` | **R** | +129 / −5 (1123 l.) |
| `src/brain/dossier/controles.test.ts` | **R** | +367 / −8 (48 tests, 41 → +7) |

**Les 5 lignes retirées en production** sont uniquement le premier silence de la docstring d'`objectif-sans-chemin`, réécrit comme le plan l'exige ; son second silence est conservé mot pour mot. **Les 8 lignes retirées du test** sont 1 `import` élargi, 6 commentaires d'ordinaux, 1 libellé d'`it` — **aucune assertion retirée ni affaiblie**, vérifié ligne à ligne par la QA.

**La prédiction du plan est CONFIRMÉE** : aucun fichier de feature n'a bougé. Et l'ouvrier a mesuré ce que le plan n'avait pas demandé — **sous la variante sans la garde `length > 0`, `panneauControles.test.tsx` rougit à 4 tests**. « Aucun fichier de feature ne bouge » n'est donc pas une propriété de l'itération : c'est une propriété de **la première garde**. C'est elle qui a gardé ce lot seul.

**Hors lot (étape 4, orchestrateur)** : `specification.json`, `bug_history.dossier-controles.json`, `CHANGELOG.md`, `README.md`, `docs/ROADMAP-BASCULE-IA.md`.

---

## Ce qui a été refusé — ce qu'un diff ne dit pas

Le registre du plan porte **40 `REJETÉ`**. Les plus structurants :

- **le cardinal d'AC10 lui-même** — il s'éteint sur un objectif creux et ne livre pas KR-222 ;
- **la variante sur `reussi_si_expr`**, sur laquelle le comité avait pourtant convergé au tour 2 — aucune surface de l'éditeur n'écrit ce champ, le voyant aurait été **inextinguible** ;
- **la variante capacité NON GARDÉE** — `every` est vrai à vide, donc cardinal déguisé ;
- **`bloquant`, sous tout motif** — une aventure sans objectif s'ouvre, se joue et **se termine** ;
- **toute prose affirmant que le modèle a besoin des objectifs** — zéro champ `ia` ; la phrase inviterait la n° 10 à injecter `reussi_si_texte` ;
- **toute remédiation nommant « Objectifs → Condition de réussite »** — ne pas répliquer un défaut en le citant ;
- **un quatrième mot de `NiveauControle`**, **semer un objectif dans `construireAmorce`**, **exiger un objectif par camp** (`types.ts` dit que c'est DESCRIPTIF) ;
- **réécrire KR-197/202** — sa forme « collection » existe depuis it3 : muter, puis **restaurer** ;
- **un constat par objectif creux** — arité stable exigée par l'égalité d'ensembles de `NEUVES`.

---

## Ce qui a été reporté, et où

- **→ it9** : la conversion des comptes totaux en `pourLaRegle` (son urgence tombe : t=0 ne bouge pas) ; le point fixe sur les **racines**.
- **→ it10** : la condition d'**échec vraie au tour zéro**.
- **→ tranche `chore`** : la scission de `controles.ts`, qui passe de 999 à **1123 lignes**.
- **→ `open_questions`** : la **ligne F** (un objectif creux à côté d'un objectif pourvu reste silencieux), et **BUG-090**.

---

## Écarts assumés

1. **Le témoin de l'objectif creux emprunte `objectif.refermer-le-sceau`** à la fixture plutôt qu'un identifiant frappé. Motif mécanique vérifié par la QA : un id neuf laisserait `pnj.aldur-le-sage.objectif_id` pendant, donc une anomalie `error`, donc un document que `DossierService.update` refuserait (KR-225). **Couplage réel test↔fixture**, documenté et justifié, pas caché.
2. **Une assertion ajoutée non demandée** : la totalité de `NEUVES` est désormais comparée à `CONTROLES` **à l'exécution**, plus seulement par compilation.
3. **L'`integrateur` n'a pas tourné** — lot unique travaillant dans l'arbre principal, rien à fusionner, aucune propriété de fichiers à arbitrer. Le contrôle qu'il aurait fait a été confié à la QA en mode B, qui l'a exécuté.
4. **La doctrine achetée cette itération n'est PAS entrée en KR** — « une capacité absente ne peut atteindre le BLOQUANT que si l'éditeur offre aujourd'hui le geste qui la restaure ». **Le budget de contexte l'a refusée** (37 o de marge dans la spec, 601 dans `code-knowledge.json`). Elle vit dans `resolved_decisions`, le plan et le CHANGELOG. **Dette assumée, à reprendre dès qu'une compaction libère de la place.**
5. **La note de tour 2 de la `qa` n'existe pas** — agent tombé sur une limite de débit. Ses mesures ont été **refaites par l'orchestrateur** (§ 9 du plan), arbre vérifié propre avant et après.

**Blocages non résolus : aucun.**

---

## Ce que personne n'a vérifié

- **Le rendu visuel de la ligne neuve** dans le panneau : jsdom ne calcule aucun layout. Le ton `alerte` est épinglé **au contrat** (`pastilles.ts`), jamais au rendu — décision d'it2, reconduite.
- **Le comportement sur un dossier IMPORTÉ** portant un `reussi_si_expr` : atteignable par import, jamais par l'éditeur. La règle le traite correctement (garde 2, désormais éprouvée), mais aucun test de bout en bout ne le parcourt.

---

## Porte qualité

| | |
|---|---|
| Prettier | conforme |
| `tsc --noEmit` | **exit 0** |
| ESLint | **0 erreur** (1 `warning` pré-existant hors lot, `CharacterCreationScreen.tsx:35`) |
| `jest` | **86 suites / 1256 tests verts** — rejoué par l'orchestrateur |
| Score de mutation | **non lancé** — aucun des 4 fichiers mutés n'est touché |

---

## `RETOUR-COMITÉ`

1. **Le découpage était juste, et c'est la première coupe de cette feature sur le VOLUME.** Les trois précédentes portaient sur le sens d'erreur. Quatre charges dans une itération, dont un refactoring sans phrase de démo : le contrôle de taille de l'étape 0 a fait exactement son travail.
2. **Le comité a convergé au tour 2 sur une variante indélivrable**, et seule une mesure l'a arrêtée. Quatre rôles sur cinq avaient signé une règle visant `reussi_si_expr` sans que personne ne vérifie **qu'un écran l'écrive**. La leçon à porter au prochain raffinage : *toute règle dont la remédiation demande un geste doit nommer la surface qui le permet, et cette surface se LIT, elle ne se suppose pas.*
3. **La règle « une affirmation sur la couleur d'un test se mesure » a encore été appliquée à moitié** — quatrième fois. Elle l'a été sur deux gardes sur trois. Le correctif de méthode est mécanique et tient en une phrase : **une règle à N gardes exige N mutants, un par garde**, pas un mutant sur la règle.
4. **Deux agents ont écrit sur le même arbre non commité** — l'ouvrier posait des mutants pendant que j'écrivais la documentation. Fichiers disjoints, aucun dégât, et c'est l'ouvrier qui l'a signalé. Mais c'est la configuration de KR-172 / BUG-045 : **séquencer l'étape 4 après la dernière mesure du lot**, plutôt que de la mener en parallèle.
5. **Le `specification.json` de cette feature est à saturation structurelle.** Il a fallu compacter **sept décisions livrées** pour loger cinq arbitrages et trois reports, puis trois de plus pour l'étape 4. La doctrine de compaction du WORKFLOW est désormais épuisée sur ce fichier : les entrées restantes sont déjà réduites à leur phrase d'arbitrage. **Le prochain report y sera impossible sans un geste structurel**, à trancher par l'humain.
