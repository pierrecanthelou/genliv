# Revue — `dossier-registres` · itération 1 (Indices)

**En une ligne** : l'auteur tient désormais le registre des indices de son aventure — nom, vérité (MJ), formulation lue par le joueur, et un chaînage vers d'autres indices affiché en liste — là où la section Indices n'était qu'un état vide générique.

## Critères d'acceptation (§6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Création depuis la section vide | **VÉRIFIÉ** | `panneauIndices.test.tsx` « ajouter un indice: apparait dans la liste, focus sur Nom » |
| 2 | Lecture au montage sans interaction | **VÉRIFIÉ** | `panneauIndices.test.tsx` « lecture au montage, deux indices distincts, sans interaction (BUG-064) » + « editer nom, verite et formulation joueur au blur… » |
| 3 | Réordonnancement, bouton omis aux bornes | **VÉRIFIÉ** | « Monter au clic », « Monter au clavier », « bornes: Monter absent… jamais disabled » |
| 4 | `mene_a` en liste textuelle + self-exclusion à l'ajout | **VÉRIFIÉ** | « self-exclusion a la ligne d ajout… » |
| 5 | Discriminance B résolu / C orphelin, même test | **VÉRIFIÉ** | `FicheIndice - section MENE A (rendu pur)` › discriminance ; écho contrat : `validate.test.ts` « mene_a orphelin isole au bon rang » |
| 6 | Auto-référence déjà persistée résolue | **VÉRIFIÉ** | « auto-reference deja persistee (import) se resout, meme absente des options d ajout » ; écho contrat : `validate.test.ts` « mene_a auto-reference resout, jamais orpheline » |
| 7 | `mene_a` non-tableau → anomalie typée, jamais un throw | **VÉRIFIÉ** | `validate.test.ts` boucle `LISTES_OPTIONNELLES_TEXTUELLES` : `mene_a` non-tableau → `liste-non-textuelle`, `ok:false` |
| 8 | Non-régression du dossier de référence | **VÉRIFIÉ** | `couverture.test.ts` « le dossier de reference ne produit ni erreur ni avertissement » + `validate.test.ts` « … reste accepte SANS REGRESSION quand un seul mene_a y est corrompu, et SEULE cette anomalie remonte » |

Les 8 critères sont **VÉRIFIÉS**, vérification faite en QA mode B avec un contexte neuf (pas de reprise des affirmations des ouvriers).

## Diff par lot

**Lot 1 — `indices-contrat`** (conforme à la liste du plan §5, aucun écart de propriété) :
`src/brain/dossier/{types,tables,validate,identifiers,destinations,issues}.ts` (R) · `src/brain/dossier/__fixtures__/{dossier-minimal,dossier-reference}.json` (R) · `src/brain/dossier/{couverture,validate,identifiers}.test.ts` (R) · `src/brain/utils/references.ts` (N) · `src/brain/utils/references.test.ts` (N) · `src/brain/index.ts` (R) · `src/features/dossier-fiches/components/BlocSavoirs.tsx` (R, extraction seule).

**Lot 2 — `indices-ecran`** (conforme à la liste du plan §5, aucun écart de propriété) :
`src/features/dossier-registres/index.ts` (N) · `src/features/dossier-registres/components/{PanneauIndices.tsx,FicheIndice.tsx,styles.ts}` (N) · `src/features/dossier-registres/tests/panneauIndices.test.tsx` (N) · `src/App.tsx` (R, une entrée `indices` dans `panneaux`).

Contrôle de propriété (`integrateur`) : aucun fichier hors liste, aucun chevauchement entre les deux lots. `dossier-canon`, `tree-canvas`, `bascule-editeur` : zéro fichier touché (KR-204/205 tenus).

## Ce qui a été refusé (registre des désaccords, §8 du plan)

- **`Indice.portee` rendu dans `FicheIndice.tsx` dès it1** — REJETÉ. Veto PM (valeur nulle sans lecteur observable), confirmé par la convergence UX+QA au tour 2 du raffinage contre la proposition tech-lead (`destination: 'auteur'` suffirait, précédent `titre`/`but.echeance`) — écartée par l'orchestrateur : ces précédents sont de la prose librement lisible, `portee` est une énumération fermée à usage purement instrumental, plus proche de `tier` (KR-192) que de `but.echeance`. Reste posé sur le type (aucune régression), sans champ de formulaire.
- **Retrait (suppression) d'un indice dans it1** — REJETÉ (Tech Lead). Engagerait Dangerous Actions (modale) et un lot de plus ; aucune itération planifiée de la feature ne le porte aujourd'hui.
- **`conditions.contraintes` / extension `DELTAS` à opérande entier** — hors sujet de cette itération (Indice n'en porte aucun), déjà tranchés au cadrage (KR-207/208).

## Ce qui a été reporté

- **`Indice.portee`** → revient en bloc (type + registre + destination + écran) le jour où un consommateur réel existe — candidat naturel n° 7 `dossier-controles` (règle de lint « Intrigue en second plan »). Tracé en `open_questions` de `specification.json`.
- **Retrait d'un indice** → aucune itération porteuse dans le plan actuel à 5 itérations de la feature (contrairement à `dossier-objets`, qui y a consacré une itération entière). Tracé en `open_questions`.
- **`Evenement.nature === 'monstre'` dérivable ou stocké** → tranché au raffinage de l'itération 4, pas ici.

## Écarts assumés

- Libellé de l'`IconButton` « Retirer le lien… » : le plan écrivait `« Retirer le lien vers « X » »` sans fixer la forme exacte de X. Le lot 2 a composé X à partir de `localiserEntite()` (déjà mandatée pour cette section), produisant `« Retirer le lien vers Indice « Beta » »` (ou la forme orpheline `« … Indice introuvable — indice.c »`) plutôt qu'un nom nu. Aucun critère n'en dépendait ; assumé, documenté dans le code, confirmé par QA mode B comme une composition cohérente des fonctions de contrat déjà mandatées — pas un rejet.
- Le lot 1 a retiré deux dispenses `LIBRES` devenues mortes dans `couverture.test.ts` (`objectif_id`, `revele_si.apres_indice_id`) : effet collatéral **mesuré** du correctif du trou de validation n°1 (une valeur non-string sur ces deux champs, jusqu'ici silencieusement ignorée, est désormais signalée) — le test d'auto-nettoyage (précédent BUG-044) les aurait fait rougir sinon.

## Blocages non résolus

Aucun.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier `--check` | vert sur tous les fichiers touchés |
| `tsc --noEmit` | vert, 0 erreur |
| `npm run lint` | vert, 0 erreur (1 warning préexistant hors périmètre, `player/CharacterCreationScreen.tsx:35`) |
| `npm test` (suite complète) | **77 suites / 77, 1113 tests / 1113**, tous verts — confirmé indépendamment par le lot 2, l'intégrateur et QA mode B (mêmes chiffres aux trois étapes) |
| `savoirs.test.tsx` (régression extraction `avecOrpheline`) | 16/16 verts, inchangés |
| `npm run test:mutation` | **sans objet** — aucun des 4 fichiers de règles (`challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`) n'est touché |

## RETOUR-COMITÉ

- **Le découpage contrat/écran a tenu sans collision** — 2 lots séquentiels, aucun worktree, aucun message à relayer entre ouvriers. Précédent confirmé pour la 3ᵉ fois consécutive dans ce type de feature (registre simple), après `dossier-objets` it1 et `dossier-fiches` it6.
- **Lire le code avant de raffiner a payé** : le Tech Lead a trouvé, en lisant `validate.ts`/`identifiers.ts` au tour 1 du raffinage, trois trous de validation préexistants sur les listes de références — jamais surfacés avant parce que `mene_a[]` est la première liste de références du schéma (tous les champs `REFERENCES_SIMPLES` précédents sont des scalaires). Fermés dans le même lot que le champ qui les a révélés, avec sonde rouge-puis-vert sur chacun. Les 4 prochaines itérations de la feature n'introduiront plus ce risque en surprise (KR-212 documente la classe).
- **Le comité a corrigé sa propre position en tour 2** : `Indice.portee` a été porté au rendu (UX, tour 1) puis retiré (tour 2, alignement PM+UX+orchestrateur), et l'auto-référence dans `mene_a` a évité un piège concret (« faux orphelin ») grâce à la lecture précise du Tech Lead de la fonction `avecOrpheline()` — un désaccord tranché sur une intuition (« exclure = plus sûr ») aurait produit un bug silencieux. À retenir pour les itérations suivantes : toute exclusion d'option côté écran doit être vérifiée contre le mécanisme de résolution qui la consomme, pas supposée neutre.
- **Aucun `BLOCAGE` remonté** — les deux lots ont pu s'enchaîner sans retour au comité.

Plan : `.claude/raffinage/dossier-registres-it1.plan.md`. Notes de raffinage : `.claude/raffinage/dossier-registres-it1/tour{1,2}-*.md`.
