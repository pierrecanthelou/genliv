# Revue d'itération — `dossier-canon` · itération 3

> Plan : `.claude/raffinage/dossier-canon-it3.plan.md` (validé le 2026-08-10)
> Construit le 2026-08-10, séquentiel (2 lots, pas de worktree — précédent it1/it2), sans essaim parallèle.

## En une ligne

L'auteur rédige désormais les objectifs de victoire de son histoire dans la section Canon — nom, camp (protagonistes/antagonistes/joueur), condition de réussite, condition d'échec — là où il n'existait aucune UI avant cette itération.

## Critères d'acceptation (§6 du plan) — vérifiés indépendamment par QA mode B, réserves fermées

1. **VÉRIFIÉ** — ajout ⇒ carte `camp='protagonistes'`, persistance immédiate, réouverture relit. Preuve : `objectifsCanon.test.tsx` (« ajouter un objectif cree une carte camp protagonistes… »).
2. **VÉRIFIÉ** — camp committé au `onChange`, sans blur, aucun brouillon. Preuve : « changer le camp committe immediatement… ».
3. **VÉRIFIÉ** — nom/réussite/échec committent au blur, brouillon isolé par `objectif.id`, réouverture relit **dans le DOM** (preuve initialement partielle — QA a signalé que seule une lecture service existait ; fermé en fin de lot par `unmount()`+remontage, même idiome que #1/#2).
4. **VÉRIFIÉ** — retrait immédiat, sans dialogue de confirmation.
5. **VÉRIFIÉ** — bandeau d'avertissement D1 (`condition-sans-expr`) visible au montage (dossier déjà non conforme, sans édition), après édition, et absent dans le cas négatif (aucun `…_texte`) — trois tests distincts, lecture dérivée `useMemo(validateDossier(dossier))`, jamais un état semé une fois.
6. **VÉRIFIÉ** — `camp` hors énumération refusé au contrat (`valeur-hors-enumeration`), `camp` absent refusé — lot 1, `validate.test.ts`.
7. **VÉRIFIÉ** — `monde`/`charpente` intacts sur commit (initialement prouvé seulement pour l'ajout ; QA a demandé l'extension au retrait et à l'édition d'un champ — fermé en fin de lot par deux tests jumeaux).
8. **VÉRIFIÉ** — `npm run lint`/`tsc --noEmit` zéro erreur, isolation de features confirmée par lecture directe des imports, aucune couleur en dur (grep), `camp` frappé exclusivement par `frapperIdentifiant('objectif')`.

## Diff par lot

**Lot 1 — `contrat-camp-objectif`** (`dev-contrat`, seul, premier) : `src/brain/dossier/types.ts`, `tables.ts`, `destinations.ts`, `identifiers.ts` (R), `src/brain/index.ts` (R), `__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json` (R), `identifiers.test.ts`, `validate.test.ts` (R) — 9 fichiers, exactement la liste du plan. `couverture.test.ts` et `suffisance.test.ts` intacts et verts, comme prévu (corruption de `camp` déjà couverte par le mécanisme `ENUMERES_FERMES` générique).

**Lot 2 — `objectifs-canon`** (`dev-lot`, séquentiel après le lot 1) : `src/features/dossier-canon/components/ObjectifsCanon.tsx` (N, 327 lignes), `PanneauCanon.tsx` (R, +3 lignes), `tests/objectifsCanon.test.tsx` (N, 11 tests après fermeture des réserves QA), `tests/panneauCanon.test.tsx` (R, +1 assertion) — 4 fichiers, exactement la liste du plan.

Aucun débordement de fichier, aucune collision (contrôlé par l'intégrateur puis re-contrôlé par QA indépendamment).

## Ce qui a été refusé (registre §8 du plan)

- Lecture « un objectif par camp » comme règle de cardinalité 1:1 (validation d'unicité/complétude) — **REJETÉE** : aurait ouvert un second lot contrat hors du périmètre annoncé. Retenu : liste libre, patron `interdits_ton`.
- Card imbriquée pour le bloc objectif — **rejetée par l'UX elle-même** au tour 1 : viole la règle « ombres réservées menus/modales ». Retenu : `div` bordé/teinté (`--border-subtle`/`--r-xl`/`--surface-inset`).
- Eyebrow « injectée au modèle » (proposition initiale UX, tour 1) — **auto-corrigée** au tour 2 : `camp` est `moteur`, les deux `…_texte` sont `auteur`, aucun n'est `ia`.

## Ce qui a été reporté

- Critère feature « compteur de nav sur ajout/retrait d'un lieu OU d'un objectif » — **reporté à it4 (Lieux)** : `SECTIONS[0]` (canon) a un compte codé en dur `'—'` (`sections.ts:83`), structurellement insatisfiable pour objectif.
- Éditeur structuré `reussi_si_expr`/`echoue_si_expr` — reste ouvert depuis it1 (`open_questions`, propriétaire non assigné).
- `Field.maxLength`/`showCounter` — reste ouvert depuis it1 (aucun 2e appelant réel).

## Écarts assumés et blocages

Aucun blocage. Deux écarts mineurs signalés par les ouvriers, sans conséquence :
- `camp` placé après `nom` (pas en toute fin de l'interface `Objectif`) — l'ordre des membres TS n'a aucune portée de typage, suit le patron `Personnage.portee`.
- Deux tests de contrat ajoutés au-delà de la liste littérale du lot 1 (garde de discriminance « chacun des trois camps est accepté », propriété dérivée du registre `CAMPS`) — renforcent la couverture, ne changent aucune signature.

Deux réserves QA (mode B), toutes deux fermées avant la revue :
- Critère #3 : preuve DOM manquante pour la réouverture du nom/réussite/échec → ajoutée.
- Critère #7 : deep-equal `monde`/`charpente` ne couvrait que l'ajout → étendu au retrait et à l'édition.

## Porte qualité

- Prettier : conforme.
- `tsc --noEmit` : 0 erreur.
- `npm run lint` : 0 erreur, 1 warning préexistant hors périmètre (`player/CharacterCreationScreen.tsx`).
- `npm test` (suite complète) : **62 suites / 852 tests, tous verts** (mesuré après fermeture des réserves QA — la QA elle-même avait rejoué 62/850 avant la fermeture).
- `npm run test:mutation` : **sans objet** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché, confirmé par `git diff --stat` vide sur ces 4 chemins (intégrateur et QA, indépendamment).

## `RETOUR-COMITÉ`

Le découpage en 2 lots séquentiels (contrat puis feature, sans essaim) a de nouveau tenu sans friction — troisième itération de suite sur cette feature avec ce même patron. Le point qui a le mieux payé au raffinage : le tech-lead a mesuré (pas supposé) que le critère « compteur de nav » hérité de la spec feature était insatisfiable pour Canon avant même d'écrire le code — évite une itération de retour en arrière. Le point à généraliser pour n°4/n°6 : la lecture DÉRIVÉE (`useMemo` sur `validateDossier`) pour tout champ porteur d'un avertissement D1, plutôt qu'un filtrage du seul résultat de `commit()` — mirroité dans `code-knowledge.json` (KR-189) pour que `dossier-fiches` et `dossier-registres` n'aient pas à le redécouvrir.
