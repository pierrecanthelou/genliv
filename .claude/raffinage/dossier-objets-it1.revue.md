# Revue — `dossier-objets` itération 1

**En une ligne** : l'auteur ouvre la section Objets de son dossier, y crée des objets avec un nom et une description lue par le joueur, et réordonne son registre par des boutons Monter/Descendre opérables au clic comme au clavier — l'état vide générique de la section Objets a disparu.

## Critères d'acceptation (§6 du plan)

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Ajout d'un objet → apparaît en liste, repli « Objet n°N (sans nom) », focus sur Nom | **VÉRIFIÉ** | `panneauObjets.test.tsx` — « ajouter un objet: apparait dans la liste, focus sur Nom » |
| 2 | Lecture au montage, deux objets distincts, sans interaction (BUG-064/KR-199) | **VÉRIFIÉ** | `panneauObjets.test.tsx` — « lecture au montage, deux objets distincts, sans interaction » — assertion sur les deux objets |
| 3 | Édition nom/description au blur → persistée | **VÉRIFIÉ** | `panneauObjets.test.tsx` — « editer nom et description au blur, persistee, et relue apres remontage » |
| 4 | Reorder à deux objets, clic ET clavier, fiche affichée reste le même objet (id), boutons omis aux bornes | **VÉRIFIÉ** | `panneauObjets.test.tsx` — « Monter au clic », « Monter au clavier », « bornes: … jamais disabled » (3 tests distincts) |
| 5 | `description_joueur` sans borne de longueur (KR-203) | **VÉRIFIÉ** | `couverture.test.ts` — « description_joueur d un objet, texte long, aucun avertissement » (avec sonde de discriminance contrastée) |
| 6 | Dossier de référence (3 objets) non régressé | **VÉRIFIÉ** | Diff de `dossier-reference.json` : `id`/`nom` des 3 objets intacts, seul `description_joueur` ajouté ; `validate.test.ts` (existant) reste vert |
| 7 | Les 9 autres sections gardent leur état vide (KR-187) | **VÉRIFIÉ** | `dossierEditorScreen.test.tsx` non touché par le diff, 4/4 suites vertes |
| 8 | `tsc --noEmit` + `npm run lint` zéro erreur, isolation KR-184/KR-200 | **VÉRIFIÉ** | 0 erreur tsc/lint ; aucun fichier `dossier-canon`/`bascule-editeur` dans le diff |

Les 8 critères sont vérifiés — aucun `NON VÉRIFIÉ`.

## Diff par lot

**Lot 1 — `contrat-objet`** (7 fichiers, tous (R)) :
`src/brain/dossier/types.ts` · `src/brain/dossier/destinations.ts` · `src/brain/dossier/__fixtures__/dossier-minimal.json` · `src/brain/dossier/__fixtures__/dossier-reference.json` · `src/brain/dossier/couverture.test.ts` · `src/brain/index.ts` · `src/brain/components/ListRow.tsx` (docstring seul, `ListRowProps` et JSX inchangés — vérifié caractère pour caractère par QA mode B).

**Lot 2 — `panneau-objets`** (5 fichiers du plan + 1 hors-liste autorisé) :
`src/features/dossier-objets/index.ts` (N) · `src/features/dossier-objets/components/PanneauObjets.tsx` (N) · `src/features/dossier-objets/components/FicheObjet.tsx` (N) · `src/features/dossier-objets/tests/panneauObjets.test.tsx` (N) · `src/App.tsx` (R, +1 slot `objets`, les 4 slots existants inchangés) · `src/brain/components/ListRow.test.tsx` (R, 1 ligne de commentaire, hors liste du plan).

Comparé à la liste du plan §5 : exact, à une ligne près (le commentaire de `ListRow.test.tsx`, ci-dessous).

## Ce qui a été refusé

Aucun `REJETÉ` formel cette itération : chaque désaccord du raffinage a convergé vers un retrait (`RETIRÉ`) ou a été tranché en faveur d'une position (`RETENU`) — voir `.claude/raffinage/dossier-objets-it1.plan.md` §8. Le plus structurant : le mécanisme de réordonnancement présupposé au cadrage (poignée de glisser câblée sur `ListRow.onReorder`) a été écarté par les 4 rôles au raffinage — sans équivalent clavier, non prouvable en jsdom, anti-patron KR-109 (une prop `brain/` à un seul appelant réel) — au profit de deux boutons Monter/Descendre composés entièrement par la feature, `ListRow.tsx` restant inchangé en code.

## Ce qui a été reporté

- **Promotion des boutons Monter/Descendre en primitive `brain/components/ReorderControls`** — différée faute de 2e appelant réel et nommé. Partie dans `specification.json` → `open_questions`, avec le déclencheur exact et la signature à date de promotion (§8 désaccord 10 du plan).
- **Retrait d'un objet** — it2 de cette feature, hors périmètre de cette itération par construction.
- **Dette documentaire trouvée par le tech-lead en re-revue, explicitement laissée hors de ce lot** (portée) : KR-184/KR-185 sont absents de `code-knowledge.json` alors qu'ils sont cités par plusieurs `specification.json` de features et par le critère #8 de celle-ci — dette héritée de `dossier-canon`, pas introduite ici. À traiter à l'étape 4 d'it2. *(Le tech-lead avait aussi signalé, dans le même passage, que KR-053 décrirait à tort comme « sans objet » un patron encore vivant — vérifié en relisant l'entrée directement : KR-053/KR-066/KR-146 sont bien de simples pointeurs vers une feature supprimée, sans rapport avec le patron cité ; probable confusion d'identifiant côté relecture sans accès shell. Aucune action requise.)*

## Écarts assumés

- **État « 0 objet »** : le plan esquissait un layout générique ; le lot 2 a suivi le précédent `PanneauPersonnages.tsx` (deux colonnes, bandeau vide à droite) plutôt que `PanneauLieux.tsx` (état plein-page, cas défensif inatteignable chez Lieux) — parce que `monde.objets` démarre réellement vide à la création d'un dossier (contrairement à `monde.lieux`, toujours semé). Motif documenté par l'agent, cohérent avec le critère #1 qui exige un état vide observable au montage.
- **`ListRow.test.tsx` — 1 ligne de commentaire hors liste du plan**, explicitement autorisée en cours de lot 2 : le commentaire affirmait encore que « la feature n°5 ajoutera la poignée avec son vrai câblage », rendu faux par l'arbitrage du raffinage. Correction d'une ligne, zéro changement d'assertion.

Aucun blocage non résolu.

## Porte qualité

- **Prettier** : vert sur tous les fichiers touchés.
- **`tsc --noEmit`** : 0 erreur.
- **`npm run lint`** : 0 erreur (1 warning préexistant et sans rapport, `src/player/components/CharacterCreationScreen.tsx`, non touché).
- **Jest, périmètre de l'itération** : `dossier-objets` + `bascule-editeur` + `ListRow.test.tsx` → 4 suites / 38 tests verts. `brain/dossier` complet → 12 suites / 353 tests verts.
- **Jest, suite complète** : 1063 tests, 1062 verts. 1 échec par timeout sur `src/features/dossier-fiches/tests/caractere.test.tsx` (fichier non touché par cette itération) — flake de charge préexistant à `HEAD`, confirmé en le relançant seul (10/10 verts, y compris le test litigieux à 4,2s/5s). Non imputable à cette itération.
- **`npm run test:mutation`** : sans objet — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est dans le diff.

## Budget de contexte

`code-knowledge.json` a franchi son plafond (75 kio / 76 800 o) à l'ajout de KR-200..KR-203 (76 525 → 77 925 o). Compacté dans le même lot (règle non négociable, `docs/WORKFLOW.md` § Budget de contexte) : KR-091 (`action-monster`, supprimée) raccourci en gardant le fait survivant (`ROLL_OUTCOMES` vit toujours, cité par `src/brain/types.ts:105/152`) ; 11 entrées de features supprimées partageant exactement le même gabarit de texte (« Feature X supprimee le 2026-08-03… code inexistant… ») resserrées au même gabarit plus court, sans perte — vérifié par le tech-lead en re-revue : aucune n'était plus longue que ses jumelles avant compaction, aucune citée ailleurs pour son texte long (toujours par identifiant).

Relevé final (`wc -c`, 2026-08-16) :

| Fichier | Mesuré | Plafond | Marge |
| --- | ---: | ---: | ---: |
| `code-knowledge.json` | 76 710 o | 76 800 o (75 kio) | 90 o |
| `src/features/dossier-objets/specification.json` | 21 332 o | 66 560 o (65 kio) | large |
| `bug_history.json` | 9 931 o | 10 240 o (10 kio) | inchangé, aucun bug cette itération |
| `features_history.json` | 5 966 o | 10 240 o (10 kio) | inchangé, feature pas encore terminée (1/2) |
| `docs/ROADMAP-BASCULE-IA.md` | 35 161 o | 35 840 o (35 kio) | sous plafond |

## `RETOUR-COMITÉ`

Le découpage à 2 lots séquentiels (contrat seul puis feature) a tenu sans collision ni renégociation de contrat en cours de route — la signature figée par le lot 1 (`Objet`, la ligne de destination, le docstring de `ListRow.tsx`) a suffi au lot 2 sans aller-retour. Le point le plus utile du raffinage à rejouer : quand un docstring `brain/` présuppose un mécanisme d'implémentation non encore décidé (ici, « la poignée de glisser »), le traiter comme une hypothèse à vérifier au tour 1, pas comme un contrat acquis — c'est exactement ce qui a évité d'ouvrir `ListRow.tsx` au code pour un seul appelant réel. Petit accroc de process, sans conséquence : la liste de fichiers remise à l'intégrateur pour le contrôle de propriété omettait `specification.json` (artefact standard de tout cadrage) — à inclure explicitement la prochaine fois pour éviter un faux écart en revue.
