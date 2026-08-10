# Dossier de revue — `dossier-canon` · itération 1

> Plan : `.claude/raffinage/dossier-canon-it1.plan.md` (validé 2026-08-10)
> Exécuté : séquentiel, 2 lots, aucun worktree — `dev-contrat` puis `dev-lot`, `integrateur`, `qa` mode B
> Rien commité à ce stade — working tree en revue

## En une ligne

L'auteur peut maintenant réécrire le canon de son histoire — synopsis MJ, accroche joueur, ton, interdits de ton — dans un vrai formulaire, alors qu'hier la section Canon n'affichait qu'un état vide générique (« l'écran d'édition arrive avec la feature n°3 »). C'est aussi le premier chemin d'écriture réel du dossier (`DossierService.update()`) : jusqu'ici, le dossier ne pouvait être que créé ou importé, jamais modifié après coup.

## Critères (plan §6)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Blur sur un champ persiste, survit à une relecture | **VÉRIFIÉ** | `panneauCanon.test.tsx` (« sauvegarde d'un champ au blur ») + `DossierService.test.ts` |
| 2 | Ajout/retrait d'un interdit de ton persiste immédiatement | **VÉRIFIÉ** | `panneauCanon.test.tsx` |
| 3 | Refus sans écriture, aucun revert, bandeau `role="status"` + `IssueList` | **VÉRIFIÉ** | `panneauCanon.test.tsx` (« synopsis vidé puis blur ») + `DossierService.test.ts` |
| 4 | Franchissement de `BUDGET_MOTS_CANON` jamais bloquant, testé à 600/601 | **VÉRIFIÉ** | `panneauCanon.test.tsx` + `DossierService.test.ts` — seuil exact (`mots > BUDGET_MOTS_CANON`), pas de `*0.9` (voir écart §ci-dessous) |
| 5 | Dossier neuf : amorce affichée comme valeur réelle | **VÉRIFIÉ** (preuve indirecte) | comparaison à `dossier.canon.mj.synopsis_mj` réel plutôt qu'à la constante `MARQUEUR_A_ECRIRE` importée — `amorce.ts` interdit toute seconde occurrence littérale du glyphe hors `brain/`, respecté |
| 6 | Enveloppe non réinscriptible par la recette | **VÉRIFIÉ** | `DossierService.test.ts` (« ignore titre, id, schema et createdAt ») |
| 7 | Slot d'injection : Canon affiche `PanneauCanon`, Départ/Lieux inchangés | **VÉRIFIÉ pour le mécanisme** ; **NON VÉRIFIÉ par un test automatisé** pour le câblage réel `App.tsx`→`PanneauCanon` | `dossierEditorScreen.test.tsx` (sonde locale, isolation KR-184 respectée) ; `App.tsx` n'a jamais eu de suite de tests dans ce dépôt — limite préexistante, pas une régression de ce lot |
| 8 | `tsc`/`lint` propres, isolation, `FEATURE_DIRS` | **VÉRIFIÉ** | mesuré indépendamment par l'intégrateur et la QA |

## Diff par lot

**Lot 1 — `contrat-update-dossier`** (11 fichiers, exactement la liste du plan §5) : `DossierService.ts`/`.test.ts`, `EventBus.ts`/`hooks.ts` (docstrings), `dossier/validate.ts` (export `compterMots`), `brain/components/IssueList.tsx`+test (N, déplacés), `dossier-format/components/IssueList.tsx` (D), `ImportDossierDialog.tsx` (import repointé), `brain/components/index.ts`, `brain/index.ts`.

**Lot 2 — `formulaire-canon`** (7 fichiers, exactement la liste du plan §5) : `dossier-canon/index.ts`+`components/PanneauCanon.tsx`+`tests/panneauCanon.test.tsx` (N), `App.tsx`, `DossierEditorScreen.tsx`, `dossierEditorScreen.test.tsx`, `.eslintrc.cjs`.

Aucun débordement d'un lot sur l'autre (confirmé par l'intégrateur). Deux fichiers hors-lot, tous deux antérieurs au raffinage (artefacts de `/cadrer`, pas du code d'itération) : `docs/ROADMAP-BASCULE-IA.md` (3→4 itérations) et `src/features/dossier-canon/specification.json`.

## Ce qui a été refusé

Aucun `REJETÉ` au registre des désaccords de cette itération (plan §8) — tous les points ouverts au tour 1/tour 2 ont convergé en `RETENU` par les rôles eux-mêmes, sans arbitrage forcé de l'orchestrateur. Rappel des choix qui auraient pu aller autrement :
- **Pas de revert** du champ après un refus (le tech-lead l'a proposé puis retiré) — l'auteur garde ce qu'il a tapé.
- **Pas d'extension de `Field`** (`maxLength`/`showCounter`) pour un seul appelant — le compteur reste local à `PanneauCanon`. `Field.tsx` n'a pas été touché.
- **Pas de `TargetPicker` générique** dans cette itération — sans objet, aucun champ de Canon n'est une référence.

## Ce qui a été reporté

- `Field.maxLength`/`showCounter` (promotion générique) — tant qu'un 2e appelant réel n'apparaît pas ailleurs dans le dépôt (`specification.json` → `open_questions`).
- Départ, Objectifs des camps, Lieux — it2, it3, it4, chacun avec son propre lot contrat si besoin (`camp` sur `Objectif` en it3, type `Lieu` en it4).
- Un éventuel éditeur structuré (`…_expr`) pour `canon.objectifs[]` — écarté au cadrage de la feature, pas de cette itération.

## Écarts assumés

1. **Seuil du compteur (`data-etat`)** — le plan §3 portait un extrait illustratif à 90 % (`* 0.9`, soit 540 mots) qui contredisait directement ses propres critères §6/§7 (bornes exactes 600/601). Le lot 2 a tranché en faveur des critères contractuels : `data-etat="avertissement"` seulement au-delà de `BUDGET_MOTS_CANON` (600) pile, jamais à 90 %. Vérifié cohérent en code, en tests et dans la spec par l'intégrateur et la QA indépendamment. **Incohérence du plan, pas du code** — à noter pour la relecture de plans futurs (RETOUR-COMITÉ ci-dessous).
2. **Test de l'amorce** — comparaison à la valeur réelle du dossier plutôt qu'à la constante importée, pour respecter la frontière déjà posée par `amorce.test.ts` (aucun consommateur du glyphe hors `brain/` avant n° 7/9).
3. **Sonde locale dans `dossierEditorScreen.test.tsx`** — `bascule-editeur` ne peut pas importer `dossier-canon`, y compris dans ses tests ; une sonde construite uniquement à partir de `brain/` prouve le mécanisme du slot sans violer l'isolation.
4. **`onBlur` sur l'édition du texte d'un interdit existant** — non nommé explicitement au plan, ajouté par cohérence avec le patron déjà appliqué aux 3 champs de prose (sans lui, éditer un interdit existant ne persisterait jamais).

## Blocages non résolus

Aucun.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier | Vert |
| `tsc --noEmit` | 0 erreur |
| `npm run lint` | 0 erreur (1 warning préexistant, hors périmètre, `CharacterCreationScreen.tsx`) |
| `npm test` | **60 suites / 823 tests, tous verts** (58/804 avant l'itération) |
| `npm run test:mutation` | Sans objet — confirmé par `git diff --stat`, aucun des 4 fichiers mutés touché (KR-161) |

## Revue de PR (tech-lead, avant l'utilisateur)

**Tour 1 : REQUEST_CHANGES** — 2 majeurs, 3 mineurs acceptés, tous corrigés dans ce même lot (pas de nouveau lot, pas de nouvel ouvrier) :

- **MAJEUR 1 (BUG-055)** — `PanneauCanon.commit()` committait le brouillon COMPLET à chaque blur, pas seulement le champ édité. Si une réconciliation cloud adoptait un canon plus récent après le montage du panneau (le pull est asynchrone, armé par `dossier:opened`), le premier blur suivant — même sur un champ non touché — écrasait silencieusement les champs adoptés avec les copies périmées du brouillon. Le plan justifiait l'absence de resynchronisation par une garde de `useOpenDossier` qui n'existe pas (vérifié faux par le tech-lead). **Corrigé** : `commit()` prend un patch étroit (`Partial<Brouillon>`), les champs non touchés viennent du canon persisté au moment de l'écriture, jamais du brouillon local. La décision déjà arbitrée (aucun revert du champ édité après un refus) n'a pas été rouverte. Nouveau test de non-régression ajouté. Journalisé `BUG-055`.
- **MAJEUR 2** — la compaction de `code-knowledge.json` avait été reportée à it2, contre la règle explicite de `docs/WORKFLOW.md` (« se compacte dans ce lot-ci, pas au suivant »). **Corrigé** : `KR-011`/`KR-111` (redondants avec `KR-152`, déjà la version compactée du même invariant ESLint-enforced) réduits à un renvoi ; fichier ramené à 76 798 o, sous le plafond de 76 800 o.
- **m1** — le critère #7 (câblage `App.tsx` → `PanneauCanon`) n'avait aucun test automatisé. **Corrigé** : test-grep ajouté dans `dossierEditorScreen.test.tsx` (`describe('racine de composition')`).
- **m2** — le test « rendu initial » promettait « les 4 champs » mais n'en asserte que 3 (la liste d'interdits est vide sur un dossier neuf). **Corrigé** : libellé renommé.
- **m3** — `specification.json` § design_contract affirmait encore un seuil visuel à 90 %, contredit par le code livré. **Corrigé** : ligne réécrite sur la borne réellement livrée.

Porte qualité re-mesurée après correctifs : Prettier vert, `tsc --noEmit` 0 erreur, `npm run lint` 0 erreur (même warning préexistant hors périmètre), 60 suites / 825 tests, tous verts (+2 tests : la régression BUG-055 et le test-grep `App.tsx`).

**Tour 2 : REQUEST_CHANGES** — un seul point, un défaut NEUF introduit par le correctif de `BUG-055` lui-même, pas une réserve du tour 1 restée ouverte :

- **`BUG-056`** — le patch étroit change la granularité d'une écriture, mais la règle « un commit réussi efface le bandeau de refus précédent » datait du commit-brouillon-complet (où réussir voulait dire les quatre champs acceptés) et n'avait pas été revue avec elle. Concrètement : vider le synopsis (refus, bandeau affiché), puis simplement traverser le formulaire au Tab (blur sur `ton`, qui réussit puisqu'il ne porte que sur `ton`) faisait disparaître le bandeau — le synopsis restait vide et non enregistré, sans plus aucun signal. **Corrigé** : le refus est désormais indexé sur les champs du patch qui l'a produit (`Refus = {champs, issues}`) ; un commit réussi n'efface le bandeau que s'il touche au moins un des champs déjà en cause. Nouveau test : refus sur `synopsis_mj`, commit réussi sur `ton` (bandeau doit rester), puis commit réussi sur `synopsis_mj` (bandeau doit disparaître). Journalisé `BUG-056`.

Porte qualité re-mesurée après ce second correctif : Prettier vert, `tsc --noEmit` 0 erreur, `npm run lint` 0 erreur, **60 suites / 826 tests, tous verts**.

**Tour 3 : APPROVE.** Le tech-lead a vérifié la table de vérité du correctif (aucun sous-cas dégradé par rapport à l'ancien comportement), confirmé que le nouveau test couvre les deux sens (bandeau qui survit à un succès sur un autre champ, bandeau qui se lève sur un succès sur le même champ), et relu l'ensemble du diff sans trouver de nouveau défaut. Trois observations non bloquantes notées pour it2+ (branche `absent` de `commit()` jamais atteinte en pratique ; `PanneauCanon.tsx` à 381 lignes, 19 sous le signal KR-112 ; refus sur deux champs différents à des moments différents ne garde que le dernier — limite préexistante à BUG-056, pas aggravée par son correctif).

## RETOUR-COMITÉ

Le plan lui-même portait une incohérence interne entre un extrait de design illustratif (§3, seuil `*0.9` hérité tel quel de la note d'ouverture de l'UX au tour 1) et les critères contractuels qui l'ont remplacé plus tard dans le même document (§6/§7, borne exacte). L'orchestrateur qui arbitre doit relire le §3 après avoir figé le §6, pas seulement l'inverse — un chiffre cité une fois en prose descriptive survit facilement à une révision qui ne corrige que les tableaux. Aucune conséquence ici (le lot a correctement priorisé le contrat testé), mais la prochaine fois qu'un raffinage porte un seuil à deux endroits, l'un descriptif et l'autre contractuel, les deux doivent être vérifiés d'un même geste avant signature.

**Dette de budget de contexte signalée, pas traitée dans ce lot** : `code-knowledge.json` dépasse son plafond de 75 KiB de ~250 o après l'ajout de KR-183/186/187 (KR-184 et KR-185 délibérément non mirroités : redondants avec KR-151 déjà en place et le précédent de promotion de `ListRow`/`IssueList`). Les trois entrées ajoutées sont déjà réduites au minimum utile ; aucun candidat de compaction sûr n'a été identifié parmi les entrées existantes dans le temps imparti à ce lot. À traiter à l'étape doc de la prochaine itération (it2) — ne pas reporter deux fois.
