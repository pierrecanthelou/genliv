# Revue d'itération — `bascule-editeur` · itération `3`

Plan : `.claude/raffinage/bascule-editeur-it3.plan.md` (validé le 2026-08-09) · Exécution et revue : 2026-08-10.

## En une ligne

L'auteur ouvre un dossier et navigue par une liste de dix sections (Canon, Départ, Personnages, Lieux, Objets, Indices, Quêtes, Événements, Conditions, Jalons & fins), chacune affichant un compteur exact et honnête, sans jamais passer par le canevas d'arbre — qu'il ne pouvait pas faire avant cette itération (l'écran d'édition dossier n'affichait qu'un état vide générique unique depuis it2).

## Critères d'acceptation (§6 du plan)

1. **VÉRIFIÉ** — Nav des 10 `ListRow` dans l'ordre exact de `SECTIONS`, `trailing` non recalculé localement. Preuve : `dossierEditorScreen.test.tsx` (« rend les 10 ListRow dans l'ordre exact de SECTIONS » + « KR-013 : SectionNav ne recalcule aucun compteur localement », grep source) ; confirmé par lecture directe de `SectionNav.tsx` (QA mode B, zéro `.length`/`.filter`/`.reduce`).
2. **VÉRIFIÉ** — `compte()` : Canon/Départ → `« — »`, sections-listes → `« {n} fiche(s) »`, Jalons & fins → `« {n} jalon(s) · {n} fin(s) »`. Preuve : `sections.test.ts`, valeurs épinglées sur dossier neuf et peuplé, accord singulier/pluriel, assertion discriminante que Canon/Départ ne rendent ni chiffre ni « configuré ».
3. **VÉRIFIÉ** — État vide du panneau droit, au mot près, pour les 10 sections, sur un dossier issu de `DossierService.create()` (pas un mock — confirmé par QA). Preuve : `dossierEditorScreen.test.tsx`, 10 assertions littérales avec glyphe.
4. **VÉRIFIÉ** — Clavier Tab/Shift+Tab + Entrée/Espace. Preuve : 2 tests dédiés ; comportement natif de `<button type="button">`, rien de fait maison à contourner.
5. **VÉRIFIÉ** — Aucun badge de complétion coloré. Preuve : grep-test + lecture directe (QA) : `SectionNav.tsx` n'a que `tone="muted"`, `PanneauSection.tsx` n'utilise pas `Badge`.
6. **VÉRIFIÉ** (fermé après réserve QA) — `useOpenDossier` répercute `dossier:updated` sans remontage, aux deux niveaux exigés par le plan (« contrat + composant »). Le hook isolé était couvert dès le lot 1 (`hooks.dossier.test.tsx`) ; la QA mode B a relevé, à raison, qu'aucun test ne le prouvait au niveau composant (`DossierEditorScreen` monté, événement émis, compteur affiché vérifié sans `rerender()`). Fermé par un test ajouté après revue : `dossierEditorScreen.test.tsx` — « dossier:updated apres montage: le trailing de Personnages se met a jour sans remontage ».
7. **VÉRIFIÉ** — Verrou anti-régression (`demontageArbre.test.ts`, marcheur récursif, zéro contrevenant), fichiers gelés inchangés, 40 tests tree-canvas/cloud-sync verts, annotation « en sommeil depuis n°2, repointage hérité par n°6 » posée dans `tree-canvas/specification.json`.

**7/7 vérifiés.** Aucun critère non observable.

## Diff par lot (comparé au §5 du plan)

**Lot 1 `contrat-sections-listrow`** (dev-contrat) — exactement les 8 fichiers du plan, aucun de plus :
`src/brain/dossier/sections.ts` (N) · `sections.test.ts` (N) · `src/brain/components/ListRow.tsx` (N) · `ListRow.test.tsx` (N) · `src/brain/hooks.ts` (R) · `hooks.dossier.test.tsx` (N) · `src/brain/components/index.ts` (R) · `src/brain/index.ts` (R).

**Lot 2 `nav-sections-dossier`** (dev-lot) — exactement les 5 fichiers du plan, aucun de plus (le test ajouté après réserve QA vit dans un fichier déjà listé, `dossierEditorScreen.test.tsx`) :
`src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R) · `SectionNav.tsx` (N) · `PanneauSection.tsx` (N) · `tests/dossierEditorScreen.test.tsx` (R) · `tests/demontageArbre.test.ts` (N).

**Hors-lot, prévu par le plan (§10)** : `src/features/bascule-editeur/specification.json` (sortie du raffinage, étape 7, antérieure aux lots) · `src/features/tree-canvas/specification.json` (annotation « en sommeil », posée par l'intégrateur, étape 4 — voir RETOUR-COMITÉ).

Aucun fichier touché hors de ces listes. Fichiers gelés confirmés intouchés (`git diff --stat` vide, mesuré trois fois indépendamment — dev-lot, intégrateur, QA) : `src/App.tsx`, `src/EditorScreen.tsx`, `src/brain/Router.ts`.

## Ce qui a été refusé

- **Désaccord #2 du plan (`REJETÉ`)** — retirer la variante `{name:'editor', bookId}` du type `Route`. Motif : casse `tsc` en production dans `tree-canvas/TreeCanvas.tsx:51` et `cloud-sync/ConflictDialog.tsx:14`, deux features hors périmètre. Jamais recommandé activement par son propre auteur (Tech Lead) — écarté dès le tour 1.

## Ce qui a été reporté

Aucun `REPORTÉ` nouveau dans le registre des désaccords (§8 du plan) — les 9 désaccords ont tous été tranchés `RETENU`/`REJETÉ`, aucun n'a glissé vers une itération future. Les reports déjà connus, non affectés par cette itération, restent ouverts dans `specification.json → open_questions` : démolition physique n°9 (KR-181) ; repointage réel de `tree-canvas` n°6 (KR-180) ; badge de complétion dynamique + linter `dossier-controles` n°7 ; drag/réordonnancement + poignée `ListRow` n°5 ; détection d'amorce non rédigée n°7/n°9 ; nom d'entité non textuel n°3-6 ; renommer/dupliquer un dossier.

## Écarts assumés

Cinq, tous documentés en commentaire **dans le code lui-même** (pas seulement dans un compte rendu d'agent — vérifié par QA mode B) :

1. **`ListRow` (lot 1)** — bloc de texte en `flex: 1; min-width: 0` plutôt que `flex: none` + cale de la source design. Motif mesuré : dans la colonne de 280px, la ligne « Jalons & fins » (sous-titre mono + badge) déborderait de ~110px avec l'anatomie source telle quelle. Un sous-titre trop long passe à la ligne plutôt que d'être tronqué.
2. **`ListRow.test.tsx` (lot 1)** — pas d'assertion de couleur de bordure/fond en jsdom, `aria-current` seul pour l'état sélectionné. Motif mesuré : `cssstyle` (CSSOM de jsdom) élague toute valeur de propriété colorée contenant `var(...)`.
3. **Glyphe de famille (lot 2)** — utilisé uniquement dans `PanneauSection.tsx`, jamais en `leading` de `ListRow` dans la nav. Cohérent avec le plan lui-même (§3 titre la colonne « Glyphe (**panneau**) »).
4. **Table `Record<SectionId, {glyphe, featureNum}>` (lot 2)** — confinée à `PanneauSection.tsx`, seul consommateur ; `SectionNav.tsx` n'en a pas besoin.
5. **Reformulation d'un commentaire (lot 2)** — `SectionNav.tsx` évite de citer littéralement `.length`/`.filter`/`.reduce` entre backticks dans son propre commentaire, pour ne pas déclencher un faux positif de son propre grep-test KR-013.

**Blocages non résolus** : aucun. La seule réserve remontée (QA mode B, critère #6 moitié composant) a été fermée par un test ajouté après revue, re-gaté vert.

**Observation mineure consignée, non bloquante** (intégrateur + QA) : le marcheur de `demontageArbre.test.ts` exclut les dossiers `tests/` mais pas les fichiers `*.test.ts(x)` vivant hors d'un tel dossier — périmètre balayé plus large que le libellé littéral du critère #7, vérifié inoffensif (aucun des fichiers concernés ne référence `navigate({name:'editor'`).

## Porte qualité

- `npm run format` : conforme, 0 diff.
- `npx tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 erreur, 1 warning pré-existant hors périmètre (`CharacterCreationScreen.tsx`, `play-mode`, non touché par cette itération).
- `npm test` : **58 suites / 804 tests, tous verts** (803 avant la fermeture de la réserve QA, +1 après).
- Suites gelées, comptées avant/après, inchangées : `TreeCanvas.test.tsx`=10, `geometry.test.ts`=25, `nodeView.test.ts`=2, `ConflictDialog.test.tsx`=3 → **40/40 verts**, zéro fichier modifié sous `tree-canvas/`/`cloud-sync/`.
- `npm run test:mutation` (`brain/` : `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) : **sans objet**, confirmé par `git diff --stat` vide sur les 4 fichiers — aucun n'apparaît dans `git status --porcelain`.

## Budget de contexte (relevé, Build Steps étape 4)

Mesuré après les mises à jour de doc de cette itération (`wc -c`, 2026-08-10) :

| Fichier | Mesuré | Plafond | Action |
|---|---|---|---|
| `code-knowledge.json` | 77 348 o (après ajout KR-181) | 75 kio (76 800) | **Dépassé** — compacté dans ce lot : KR-151/KR-152 (déjà entièrement câblées en ESLint) réduites à un pointeur vers la règle, doctrine « le moins cher ». Re-mesuré : **76 245 o**, sous le plafond. |
| `bug_history.json` | 58 359 o (après BUG-060) | 55 kio (56 320) | **Dépassé.** Remède prescrit pour ce fichier (append-only) : scission par ère, pas compaction de contenu — mais aucune frontière d'ère n'existe encore à l'intérieur du Temps 1 (0.6.x), le seul précédent de scission ayant eu lieu à la frontière ère-arbre / bascule-IA. **Non résolu dans ce lot** : signalé à l'utilisateur plutôt qu'une frontière inventée unilatéralement. |
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 070 o (inchangé) | 45 kio (46 080) | Sous le plafond, marge de 10 o — non touché par cette itération. |
| `features_history.json` | 12 462 o (après l'entrée bascule-editeur) | 15 kio (15 360) | Sous le plafond. |
| `src/features/bascule-editeur/specification.json` | ~53 kio | 65 kio (66 560) | Sous le plafond. |
| `docs/ROADMAP-BASCULE-IA.md` | 34 735 o (après statut 3/3) | 35 kio (35 840) | Sous le plafond. |

## RETOUR-COMITÉ

1. **La leçon structurante de cette itération** : le critère d'acceptation hérité de `specification.json` (« grep zéro occurrence de `TreeCanvas`/`books.`/`BookService` dans le CONTENU de `src/EditorScreen.tsx` ») était infaisable sans casser 10 tests d'intégration de `tree-canvas` — une feature hors périmètre. Personne ne l'avait détecté avant que le Tech Lead lise réellement `TreeCanvas.test.tsx` au tour 1 du raffinage (pas seulement grepé ses imports). **Pour la suite** : quand un critère hérité affirme qu'un fichier « mort côté UI » peut être vidé/modifié sans risque, vérifier d'abord s'il est le sujet direct d'assertions dans la suite de tests d'une AUTRE feature avant de figer le critère — « inatteignable depuis l'UI » ne veut pas dire « inatteignable depuis les tests ».
2. **Note de l'intégrateur** : l'annotation-doc « en sommeil depuis n°2… » sur `tree-canvas/specification.json`, assignée « hors-lot, intégrateur, étape 4 » par le plan, aurait pu être incluse dans la liste de fichiers du lot 1 (zéro risque de collision, `tree-canvas/specification.json` n'étant touché par aucun lot) plutôt que différée — cela aurait évité qu'un critère d'acceptation (#7) reste techniquement incomplet à la sortie des deux lots verts, avant l'étape d'intégration.
3. **Ce qui a bien fonctionné** : le découpage contrat/feature en 2 lots séquentiels (pas de worktree, pas de fusion) a évité toute collision de contenu — la frontière `brain/` (lot 1) vs `features/bascule-editeur/` (lot 2) a été respectée à la lettre par les deux ouvriers, chacun consommant les signatures de l'autre sans les réinventer.
4. **Sur les écarts assumés** : les 5 écarts pris par les deux lots étaient tous mesurés (pas supposés) et documentés en commentaire dans le code — aucun bricolage caché relevé par la QA mode B, dont c'est explicitement le rôle de vérifier.
