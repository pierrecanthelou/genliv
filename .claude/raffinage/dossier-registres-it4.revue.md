# Revue d'itération — `dossier-registres` · itération `4` (Événements)

> Plan : `.claude/raffinage/dossier-registres-it4.plan.md` (validé le 2026-08-19)
> Essaim : `dev-contrat` (lot 1) → `dev-lot` (lot 2) → `integrateur` → `qa` (mode B) — exécution séquentielle, un seul working tree, aucun worktree git

## En une ligne

L'auteur tient désormais le registre de ses événements — filtrés entre « liés à la trame » et « libres », optionnellement adossés à un monstre du bestiaire, chacun porteur de résolutions dont les conséquences s'éditent via l'éditeur de récompense hérité des Quêtes.

## Critères d'acceptation (§6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Non-régression `validateDossier` sur les événements déjà persistés | **VÉRIFIÉ** | `couverture.test.ts`, `validate.test.ts`, `roundtrip.test.ts`, `dossier-format/tests/importDossier.test.tsx` — tous verts, aucune ligne d'anomalie modifiée |
| 2 | Libellé « Monstre : {nom} » dérivé de `monstre_ref`, aucune clé `nature` persistée | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « libelle monstre derive » — `expect('nature' in ...).toBe(false)` |
| 3 | Discriminance à deux entités du filtre `lie_a_histoire` | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « discriminance des deux onglets » — deux événements distincts, absence croisée assertée dans les deux sens |
| 4 | Création immédiate, `lie_a_histoire` toujours explicite | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « ajout immediat » — `PanneauEvenements.tsx:188`, jamais `undefined` |
| 5 | Brouillon différé de résolution (`resultat` CHAMPS_REQUIS) | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « brouillon differe de resolution » — contraste dans le MÊME test avec la création immédiate de l'événement |
| 6 | Jeton de remontage (aucun brouillon d'effet ne migre après retrait d'une résolution voisine) | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « jeton de remontage » — preuve d'ABSENCE de migration, pas seulement que le retrait fonctionne |
| 7 | Retrait du monstre → `monstre_ref` `undefined` (jamais `null`) | **VÉRIFIÉ** | `panneauEvenements.test.tsx` « retrait du monstre » |
| 8 | `lint`/`tsc` propres, isolation tenue, aucune ligne `NatureEvenement` | **VÉRIFIÉ** | porte qualité ci-dessous, `lintIsolation.test.ts` 22/22, `git diff \| grep -i nature` → une seule occurrence, un commentaire explicatif |

**8/8 VÉRIFIÉS**, chacun avec preuve directe (fichier/test), confirmé indépendamment par l'intégrateur et par la QA en mode B (contexte neuf, sceptique par mandat).

## Diff par lot, vs. plan (§5)

**Lot 1 — `evenements-contrat`** (dev-contrat, seul et en premier) : 9 fichiers déclarés, 9 touchés, tous R, correspondance exacte — `src/brain/dossier/{types.ts, tables.ts, destinations.ts, validate.ts, couverture.test.ts, validate.test.ts, __fixtures__/dossier-minimal.json, __fixtures__/dossier-reference.json}` + `src/brain/index.ts`. Signature livrée identique à celle figée au raffinage (`lie_a_histoire?: boolean` en `ENUMERES_FERMES`, `PREFIXE_BESTIAIRE` exporté depuis `ESPACE_BESTIAIRE`). **Zéro écart.**

**Lot 2 — `evenements-ecran`** (dev-lot) : 4 N conformes (`PanneauEvenements.tsx` 373 l., `FicheEvenement.tsx` 297 l., `useEcritureResolutions.ts` 281 l., `panneauEvenements.test.tsx` 352 l.) + 2 R conformes (`index.ts`, `App.tsx`). **1 écart** : `components/styles.ts` (R déclaré au plan) non touché — tous les tokens nécessaires existaient déjà depuis it1-3, vérifié token par token par l'intégrateur et la QA. `EditeurEffets.tsx` : absent du diff, conforme (réutilisé sans une ligne modifiée).

Aucun fichier hors des deux listes de lots, hors artefacts de comité attendus (`specification.json`, `.claude/raffinage/dossier-registres-it4*`).

## Ce qui a été refusé (§8 du plan)

Aucun `REJETÉ` au registre des désaccords de cette itération — les 6 désaccords ouverts au tour 1 ont tous convergé en `RETENU` au tour 2. Le seul rejet est un contenu de schéma, pas un désaccord de comité : **`Evenement.nature`/`NatureEvenement`/`NATURES_EVENEMENT` REJETÉ au complet** — convergence unanime des 4 rôles (PM, tech-lead, UX, QA), aucun consommateur nommé pour `scene`/`obstacle`, troisième occurrence du même anti-patron que `tier`/`lie_au_canon`/`Indice.portee` dans cette feature. Documenté en KR-216... non — en mise à jour de **KR-206** (`code-knowledge.json` + `specification.json`).

## Ce qui a été reporté

Rien de nouveau : aucune entrée `REPORTÉ` au §8 du plan. Deux `open_questions` préexistantes, explicitement posées comme « à relire au raffinage d'it4 », ont été refermées par ce raffinage (résolues, retirées de `open_questions`, résumées en `resolved_decisions`) : la dérivabilité de `nature` (KR-206) et la double sémantique du `SegmentedControl` (bascule de collection en it2 vs filtre en it4, confirmée sans collision).

## Écarts assumés

- `components/styles.ts` non touché par le lot 2 (voir diff par lot) — sans conséquence, vérifié.
- Libellé dérivé « Monstre : {nom} » placé à côté du champ NOM plutôt que d'un « titre de fiche » que le plan supposait — aucune fiche de la feature n'a jamais eu de titre distinct du champ NOM (même `FicheQuete.tsx`). Interprétation la plus cohérente avec l'existant.
- Retour de focus à l'élément déclencheur après un retrait de ligne (contrat clavier du plan) : non implémenté, mais c'est une dette **pré-existante** (aucun précédent it1/it3 ne l'implémente réellement) — pas introduite par ce lot. Remontée en `open_questions`.
- Cas limite « deux résolutions dont une avec conséquences et une sans » : exercé par le test d'isolation mais sans assertion dédiée contrastant les deux rendus — gap de test mineur signalé par la QA mode B, remonté en `open_questions`, non bloquant.

**Aucun blocage** à aucune étape de l'essaim.

## Porte qualité

Relancée intégralement par trois acteurs indépendants (dev-lot, intégrateur, QA mode B), chiffres identiques à chaque fois :

- Prettier : conforme
- `tsc --noEmit` : 0 erreur
- `npm run lint` : 0 erreur (1 warning pré-existant hors périmètre, `CharacterCreationScreen.tsx`)
- `npx jest` : **80 suites / 1156 tests, tous verts** (it3 : 79/1145 → delta exact +1 suite / +11 tests, correspondant aux tests ajoutés)
- `roundtrip.test.ts` + `dossier-format/tests/importDossier.test.tsx` : exécutés isolément, verts — **aucun ricochet**, contrairement à it1/it2/it3 (`lie_a_histoire` ne référence ni collection ni l'espace `pnj`)
- Score de mutation : **non applicable** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) dans le diff, confirmé par grep dédié

## RETOUR-COMITÉ

Le découpage à 2 lots (contrat solo puis écran) a de nouveau fonctionné sans collision ni blocage — 4e itération consécutive de cette feature sur ce même patron. Deux enseignements pour la suite :

1. **Le raffinage a correctement anticipé une inversion de position en tour 2** (retrait de résolution : hors périmètre au tour 1, remis dans le périmètre après objection UX) — le comité a produit un mécanisme concret (jeton de remontage) plutôt qu'un simple revirement verbal, et ce mécanisme est vérifié par un test qui prouve une ABSENCE (pas juste un succès). C'est le genre de désaccord tour1→tour2 que le rituel est fait pour attraper — aucune perte de temps à l'essaim.
2. **Le ricochet `importDossier.test.tsx`/`roundtrip.test.ts`**, qui s'était déclenché 3 fois de suite sur les itérations précédentes (toute référence neuve vers l'espace `pnj`), ne s'est PAS déclenché ici — confirmation que la cause identifiée (référence `pnj` sur la fixture minimale à un seul personnage) est la bonne, et que `lie_a_histoire`, un booléen fermé sans espace de noms, en est structurellement exempt. Rien à corriger dans le process de raffinage : la vigilance posée dans `open_questions` a fait son travail (le lot 1 a exécuté les deux suites au lieu de les présumer vertes).

Aucun changement de process recommandé pour it5 (Climat, dernière itération de la feature).

## Report vers `specification.json`

`implementation.iterations_log[3]` (id 4), `plan.iterations[3].status: "done"`, `resolved_decisions` (+7), `open_questions` (−3, +1), `known_risks` (KR-206 mis à jour, KR-216 ajouté) — tous déjà écrits. `code-knowledge.json` KR-206/KR-216 synchronisés et le fichier recompacté sous son plafond (76 795 o ≤ 76 800 o). `docs/ROADMAP-BASCULE-IA.md` § statut dossier-registres : 3/5 → 4/5.
