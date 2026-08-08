RISQUE — Le seul artefact d'it5 est une **donnée + un test**. Le risque n'est donc pas le code mais l'ancrage : faute de champ, un ouvrier ajoutera un champ à `types.ts` pour rendre une branche testable — lot feature touchant un fichier sous veto d'it1, et forme volée à la n° 4 (décision A).

OBJECTION — Lecture de `src/brain/dossier/types.ts` + grep de `src/brain/` : `antagoniste`, `relation`, « scène figée » = **zéro occurrence**. Trois des neuf branches du critère 9 ne sont pas testables contre le schéma livré, pas deux. Seconde objection : la phrase de démo (« l'auteur peut **charger** ») est fausse si le fichier vit sous `__fixtures__`, invisible depuis l'application. Elle décide du nombre de lots — elle se tranche avant le découpage, pas après.

PROPOSITION — (1) Table des branches `{ nom, predicat(dossier) }` écrite au plan, chaque prédicat en champs existant **aujourd'hui**, la branche « delta » **dérivée de `DELTAS`**, jamais re-listée ; elle vit **dans le fichier de test** (un seul appelant) — it5 ne touche alors aucun fichier de production de `brain/`. (2) « antagoniste » requalifié structurellement (personnage cible d'un `echoue_si_expr` d'objectif) ; « relation secrète » → n° 4, « scène figée » → n° 10 (déjà en `open_questions`). Aucun champ neuf. (3) Téléchargement : **REPORTÉ n° 2, nommément**. `exportDossier(id)` exige un id et aucune surface ne liste les dossiers ; le seul hôte est `LibraryScreen`, propriété de `book-library` — l'y greffer serait une dépendance croisée. Corriger la ligne 131 du roadmap, que sa propre colonne démo (ligne 145, « importer ») contredit.

VERDICT — **recevable sous réserve** : critère 9 corrigé avant écriture des lots.

---

### Annexe — découpage en lots

Le découpage dépend d'un arbitrage de périmètre qui n'est pas le mien (PM) : **le fichier de référence est-il chargeable par l'auteur, ou seulement un document réel prouvé par la porte ?** Les deux variantes tiennent le plafond ; je recommande **A**.

**Variante A — démo « le dossier de référence existe et sa suffisance est prouvée par branche » (recommandée) : 1 lot, exécution séquentielle, ni worktree ni fusion.**

| Lot | Type | Fichiers (N = crée, R = remplace) | Interface exposée / consommée |
|---|---|---|---|
| 1 · `reference-suffisance` | donnée + test (aucune signature `brain/` modifiée) | N `src/brain/dossier/__fixtures__/dossier-reference.json` · N `src/brain/dossier/suffisance.test.ts` · R `src/brain/dossier/roundtrip.test.ts` | **Consomme, en lecture seule** : `validateDossier(input: unknown): DossierValidation`, `createDossierService(persistence, events)` → `.importDossier(fileText: string): DossierInspection` / `.exportDossier(id: string): Dossier \| null`, `DELTAS`, `PREDICATES`, `COLLECTIONS_IDENTIFIEES`, `collectRefs`. **N'expose rien.** Table de branches locale au test : `const BRANCHES: { nom: string; predicat: (d: Dossier) => boolean }[]` |

Contraintes de ce lot, à écrire au plan : `id` du fichier ≠ `'dossier-minimal'` (clé de persistance distincte) ; assertion discriminante `errors: []` **et** `warnings: []` (KR-162) ; échec par `nom` de branche (KR-157). Vérifié : aucun autre test n'est impacté — `couverture.test.ts:73` et `identifiers.test.ts:16` épinglent `dossier-minimal.json` par chemin, et les balayages de `roundtrip.test.ts` n'énumèrent que des `.ts`.

**Variante B — démo « l'auteur peut charger le dossier de référence » : 2 lots, `contrat` seul et en premier.**

| Lot | Type | Fichiers (N/R) | Interface — **seul point de rendez-vous** |
|---|---|---|---|
| 1 · `dossier-reference` | **contrat** (seul, en premier) | N `src/brain/dossier/reference.ts` · N `src/brain/dossier/reference/dossier-reference.json` · N `src/brain/dossier/suffisance.test.ts` · R `src/brain/dossier/roundtrip.test.ts` · R `src/brain/index.ts` | **Expose** : `export function texteDossierReference(): string` (le JSON sérialisé, prêt pour `importDossier`), ré-exporté par `brain/index.ts`. `resolveJsonModule` est déjà à `true` (`tsconfig.json:11`) |
| 2 · `charger-reference` | feature | R `src/features/dossier-format/components/ImportDossierDialog.tsx` · R `src/features/dossier-format/messages.ts` · N `src/features/dossier-format/tests/chargerReference.test.tsx` | **Consomme** `texteDossierReference()` depuis `'../../../brain'` puis `dossiers.importDossier(...)` — patron d'`useImportDossier.ts`. Aucun changement d'`App.tsx` : le slot `LibraryScreen.importEntry` est déjà câblé |

En B, le fichier **ne peut pas** rester sous `__fixtures__` : un test de `brain/` lisant un fichier de `src/features/` inverserait le sens de dépendance, et une donnée de production rangée en fixture est un piège pour la n° 2. Deux lots sont le maximum ici — un troisième (téléchargement) n'a pas d'hôte avant la n° 2.
