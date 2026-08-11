# Revue — `dossier-canon` itération 4 (« Lieux ») — dernière itération de la feature

**En une ligne** : l'auteur consigne les lieux de son aventure — nom, description, ambiance, dangers — dans une liste de fiches, en ajoute, en retire (sauf le lieu de départ, protégé automatiquement), là où il n'y avait qu'un état vide générique. `dossier-canon` passe **4/4, terminée**.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Ajout d'un lieu : ligne créée, sélectionnée, focus sur Nom, persisté, relu à la réouverture | **VÉRIFIÉ** | `panneauLieux.test.tsx` — « ajouter un lieu... » |
| 2 | Édition des 4 champs au blur, relecture après réouverture | **VÉRIFIÉ** | `panneauLieux.test.tsx` — « editer les 4 champs... » |
| 3 | Retrait d'un lieu non référencé : immédiat, sans dialogue, N→N-1, sélection retombe, focus suit | **VÉRIFIÉ** | `panneauLieux.test.tsx` — « retirer un lieu non reference... » |
| 4 | Retrait du lieu de `charpente.depart` : refusé, liste inchangée, bandeau visible, aucun retrait optimiste | **VÉRIFIÉ** | `panneauLieux.test.tsx` — « retirer le lieu de charpente.depart... » |
| 5 | Les 3 nouveaux champs de `Lieu` ont une destination déclarée, aucune ligne morte | **VÉRIFIÉ** | `couverture.test.ts` — « les trois proses de Lieu portent la destination ia... » |
| 6 | Non-régression des sections 0,1,2,4-9 de `dossierEditorScreen.test.tsx` | **VÉRIFIÉ** | suite rejouée en entier, verte ; diff purement additif sur la branche `index===3` |
| 7 | Le compteur de nav se met à jour sur ajout/retrait, sans recalcul local | **VÉRIFIÉ** *(fermé après la 1ʳᵉ passe QA)* | `dossierEditorScreen.test.tsx` — sonde d'écriture bâtie sur `brain/` (jamais un import direct de `PanneauLieux`, KR-184), clic réel → compteur 1→2 fiches |
| 8 | `lint`/`tsc` propres, zéro import croisé, zéro couleur en dur, sentinelles intactes | **VÉRIFIÉ** | `tsc --noEmit` propre, `eslint` 0 erreur, `panneauDepart.test.tsx` et `amorce.test.ts` verts **sans modification** |

## Diff par lot (vs § 5 du plan)

**Lot 1 — `contrat-lieu`** (6 fichiers déclarés = 6 réels) : `brain/dossier/types.ts`, `brain/index.ts`, `brain/dossier/destinations.ts`, `dossier-minimal.json`, `dossier-reference.json`, `couverture.test.ts`. Conforme, zéro débordement.

**Lot 2 — `panneau-lieux`** (5+1 conditionnel déclarés = 6 réels) : `PanneauLieux.tsx` (N), `FicheLieu.tsx` (N, clause conditionnelle KR-112 activée — premier jet à 429 lignes), `panneauLieux.test.tsx` (N), `dossier-canon/index.ts` (R), `App.tsx` (R), `dossierEditorScreen.test.tsx` (R). Conforme.

**Hors des deux lots, attendu** : `specification.json` (raffinage + docs), `bug_history.json`/`bug_history.features-terminees.json` (BUG-061/062 + migration), `features_history.json` (entrée de clôture de feature), `CHANGELOG.md`, `docs/ROADMAP-BASCULE-IA.md`, `docs/WORKFLOW.md` (étape Docs, hors lots).

## Ce qui a été refusé (registre des désaccords, § 8 du plan)

- **REJETÉ** — Modal de confirmation au retrait d'un lieu (proposé par PM et tech-lead au tour 1 du raffinage). Motif : le seul cas dangereux (lieu de départ) est déjà bloqué par le validateur (`reference-pendante`) et rendu par le bandeau Refus existant, sans code neuf ; le précédent déjà livré (`ObjectifsCanon`, it3) supprime un volume de prose comparable sans confirmation — un Modal aurait introduit une incohérence d'interaction entre les 3 panneaux de la même feature.

## Ce qui a été reporté

- **REPORTÉ → `open_questions`** — extraction du couple Refus/commit vers `features/dossier-canon/hooks/` : `PanneauLieux` en est le 3ᵉ appelant réel (après `PanneauCanon`, `PanneauDepart`), mais l'extraction est différée au 4ᵉ appelant réel, hors de cette feature qui se termine ici.
- **REPORTÉ n° 5/6** — `lieux[].acces` et les références croisées de `Lieu` (personnages/objets/indices/événements), déjà arbitré au raffinage.

## Écarts assumés

- `RefusLieu` porte un seul jeu d'`issues` à la fois (pas de multiplexage par champ) : sans conséquence ici, `PanneauLieux` n'a qu'une seule écriture structurellement refusable (le retrait du lieu de départ).
- État vide défensif (0 lieu) non testé : structurellement inatteignable (`DossierService.get()` re-valide et rendrait `null` avant), même doctrine que la dette assumée de BUG-058.
- Focus post-action piloté par un `useEffect` + `querySelector` sur un `aria-label`, couplage par chaîne relevé comme nit par le tech-lead — un seul appelant, pas abstrait.

## Défauts trouvés et corrigés dans ce lot (aucun n'atteint `main`)

- **BUG-061** (majeur, deux tours) — le bandeau de refus n'était pas indexé par lieu : (a) affichage — restait visible sous la fiche d'un autre lieu après un changement de sélection ; (b) invalidation — un succès sur un *autre* lieu effaçait encore un refus non résolu. Les deux angles corrigés, testés, et une 3ᵉ assertion ajoutée au tour 3 pour couvrir la branche symétrique (succès sur le *même* lieu lève bien le bandeau), vérifiée discriminante par mutation manuelle du code avant/après correctif.
- **BUG-062** (mineur, process) — collision d'identifiants BUG-055 à BUG-058 entre `bug_history.json` et l'archive, découverte en tentant de journaliser BUG-059 (déjà pris). Non corrigé (renuméroter casserait des citations déjà livrées) ; règle de numérotation durcie dans les deux `_about` (« max des trois fichiers »).

## Porte qualité

- `tsc --noEmit` : propre.
- `eslint src` : 0 erreur (1 warning préexistant, hors lot, `player/CharacterCreationScreen.tsx`).
- `jest` : **63 suites / 861 tests verts**.
- `npm run test:mutation` : sans objet — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est dans le diff, confirmé par `git diff --stat`.
- Table dorée : sans objet — aucun registre couvert (`BESTIARY`/`CHALLENGE_TIERS`/`CHARACTERISTICS`/`POSTURES`) touché.

## RETOUR-COMITÉ

- Le découpage à 2 lots (contrat 6 fichiers / feature 6 fichiers) a tenu sans collision, exécution séquentielle sans worktree — conforme au format déjà validé par it1/it3.
- La mesure préalable du lot contrat (KR-159 : 6 fichiers, pas les 9 d'it3) était juste : la différence de forme du champ ajouté (type entier optionnel vs enum requis) a bien fait varier le poids du simple au double, comme prédit au raffinage.
- Leçon la plus chère de cette itération : un correctif d'affichage (filtrage par id) et son symétrique d'invalidation (garde à l'écriture) sont deux angles morts distincts sur le même état — corriger l'un sans l'autre est une forme d'erreur qui **s'est reproduite deux fois dans la même feature** (BUG-056 puis BUG-061) malgré la leçon déjà écrite après la première occurrence. Écrit noir sur blanc dans `features_history.json` (`dossier-canon`) pour la prochaine feature qui combine liste sélectionnable + état de refus.
- Deuxième leçon : une numérotation globale à travers des fichiers scindés n'est vérifiée par aucun instrument — elle a dérivé en silence pendant l'itération 1 (2026-08-10, date de la scission par feature) sans que personne ne le remarque avant qu'une nouvelle entrée tente de réutiliser un id déjà pris. La règle est maintenant explicite (« max des trois fichiers ») mais reste non outillée — candidat `outillage-2`.
