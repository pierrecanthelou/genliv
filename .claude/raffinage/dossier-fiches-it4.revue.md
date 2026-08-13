# Revue d'itération — `dossier-fiches` · itération 4/6

Plan : `.claude/raffinage/dossier-fiches-it4.plan.md` (validé) — comité : pm-produit, tech-lead, ux-designer, qa, narratif-ia, le 2026-08-13.

## En une ligne

L'auteur peut désormais donner un but à un personnage, lui bâtir un plan d'actions par étapes (avec durée et porte de sortie), et — s'il en fait un antagoniste — lui adjoindre des contre-mesures ; avant cette itération, le bloc « Objectif & plan d'actions » de l'accordéon était en placeholder muet.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | `but.libelle` persiste au blur, sans re-render fantôme | **VÉRIFIÉ** | `fichePersonnage.test.tsx` — « but.libelle persiste au blur sur un personnage sans but, sans re-render fantome » |
| 2 | Ajout d'étape : `action` vide reste locale, refusée au SSOT | **VÉRIFIÉ** | `fichePersonnage.test.tsx` — « ajouter une etape refuse une action vide au SSOT, puis persiste au blur non vide » (+ focus déplacé vérifié) |
| 3 | Retrait d'étape sans confirmation | **VÉRIFIÉ** | `fichePersonnage.test.tsx` — « retirer une etape supprime la ligne de plan_actions sans confirmation » |
| 4 | Section Contre-mesures dérivée du camp, absence totale du DOM pour un protagoniste | **VÉRIFIÉ** | `fichePersonnage.test.tsx` — « la section Contre-mesures apparait pour un antagoniste et est absente du DOM pour un protagoniste » ; lecture de code confirmée sans `useEffect` (`BlocPlanActions.tsx`) |
| 5 | Un antagoniste ajoute et édite une contre-mesure, persistée | **VÉRIFIÉ** | `fichePersonnage.test.tsx` — « un antagoniste ajoute et edite une contre-mesure, persistee » |
| 6 | `contre_mesures` avertit sans `_expr`, `plan_actions` reste calme, contrasté dans le même test | **VÉRIFIÉ** | contrat : `validate.test.ts` — extension du test discriminant existant (« …la CONTRE-MESURE avertit ») ; composant : `fichePersonnage.test.tsx` — « avertissement D1 visible pour contre_mesures sans expr, absent pour plan_actions sans expr » |
| 7 | `si_bloque` sans `duree` avertit sans bloquer, sur deux personnages | **VÉRIFIÉ** | contrat + composant, deux tests nommés dédiés |
| 8 | Dossier de référence (6 personnages) + `contre_mesures` malformée : accepté sans régression, liste refusée | **VÉRIFIÉ** (après un tour QA) | initialement prouvé en deux moitiés sur deux documents distincts — QA mode B l'a signalé NO-GO ; fermé par un test combiné dans `validate.test.ts` qui corrompt `monde.personnages[1].contre_mesures[0]` (Corvin le Marchand) DANS `dossier-reference.json` et vérifie dans le même résultat que SEULE cette anomalie remonte |

## Diff par lot

**Lot 1 (`contrat`, `dev-contrat`, seul et en premier)** — conforme à la liste déclarée, rien de plus : `src/brain/dossier/types.ts`, `tables.ts`, `destinations.ts`, `validate.ts`, `validate.test.ts` (+ 1 test ajouté hors lot, voir ci-dessous), `couverture.test.ts`, `__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json`, `src/brain/index.ts`, `docs/REGLES-PLAY.md`. Exception mandatée par le plan : correction du critère racine #7 dans `src/features/dossier-fiches/specification.json`.

**Lot 2 (`feature`, `dev-lot`, séquentiel après le lot 1)** — conforme, rien de plus : `hooks/useEcriturePersonnages.ts` (N, 690 l.), `components/BlocPlanActions.tsx` (N, 360 l.), `components/BlocCaracteristiques.tsx` (N, 113 l.), `components/PanneauPersonnages.tsx` (R, 466→184 l.), `components/FichePersonnage.tsx` (R, 442→397 l.), `components/styles.ts` (R), `tests/panneauPersonnages.test.tsx` (R), `tests/fichePersonnage.test.tsx` (R, +11 tests).

**Hors lots, traité par l'orchestrateur** (deux blocages mécaniques, chacun conséquence directe d'un mandat du plan lui-même) : `src/features/dossier-fiches/tests/pvDerive.test.ts` (retarget du discriminant KR-169 après l'extraction de `BlocCaracteristiques.tsx`) et `src/brain/dossier/validate.test.ts` (test combiné fermant le critère #8, ajouté après le tour QA).

**Documentation de fin d'itération** : `bug_history.json` (BUG-070, BUG-071, BUG-072 journalisés ; BUG-070 et BUG-072 **archivés le jour même** vers `bug_history.dossier-fiches.json` — leur mitigation est promue dans un instrument durable, `LISTES_OPTIONNELLES_STRUCTUREES`+test pour BUG-070, KR-199 préexistant pour BUG-072, même précédent que BUG-068 à it3 ; BUG-071 reste en root, sa mitigation n'étant qu'une note de vigilance. Un archivage initial ERRONÉ de BUG-066/BUG-069 — revue de PR tech-lead — a été reverti : le critère du 5ᵉ axe est « la mitigation est-elle promue ailleurs ? », pas « le défaut appartient-il à la feature en cours ? », et ni l'un ni l'autre n'était promu par ce qu'it4 a réellement fait. Voir « Écarts assumés ».), `docs/ROADMAP-BASCULE-IA.md` (statut `3/6` → `4/6`), `README.md` (trois emplacements), `CHANGELOG.md` (entrée 0.6.21), `src/features/dossier-fiches/specification.json` (goal raffiné, `resolved_decisions`, `open_questions`, `iterations_log`).

## Ce qui a été refusé

- **Lot fallout `ObjectifsCanon.tsx`** (dossier-canon) : le bug (bandeau non effaçable sur carte fantôme) est réel et localisé, mais pas causé par it4 et absent de sa phrase de démo — veto PM, dans son domaine (plan § 8, désaccord #1).
- **`CHAMPS_ENTIERS` incluant `etape`** (proposition tech-lead au tour 1) : rejeté par l'orchestrateur — scope creep sur un champ déjà existant hors mandat de cette itération.
- **Découpage en 3-4 lots** (options tour 1 de PM/tech-lead avec un lot fallout) : rejeté au profit de 2 lots séquentiels — les trois candidats à un 3e lot nommaient les deux mêmes fichiers.

## Ce qui a été reporté

- **Correctif `ObjectifsCanon.tsx`** → micro-commit indépendant, hors PATCH d'une itération dossier-fiches, propriétaire non assigné (`open_questions`).
- **Valeurs exactes de `PorteeContreMesure`** → posées par dev-contrat (`'personnage' | 'groupe' | 'lieu'`) sans appui documentaire réel dans `docs/REGLES-PLAY.md` (honnêtement admis en docstring) ; champ `moteur`, non rendu à l'auteur, révisable sans coût avant tout consommateur du Temps 2.
- **Destination de `but.echeance`** : tranchée `auteur` par l'orchestrateur après un désaccord SWAP entre tech-lead et narratif-ia au tour 2 (chacun sans voir la position finale de l'autre) — voir `resolved_decisions`.

## Écarts assumés

- `DUREE_MIN` posé dans `dossier/types.ts` plutôt que `dossier/tables.ts` : motif — c'est là que vivent déjà toutes les bornes nommées du schéma (`CARACTERISTIQUE_MIN`, `BUDGET_MOTS_*`), et toucher `characteristics.ts` (sous mutation) pour une constante d'une ligne n'était pas justifié. Signature consommée par le lot 2 identique.
- `useEcriturePersonnages.ts` fait 690 lignes — au-dessus du signal de scission KR-112 (400), sous le seuil bloquant (800). La dette KR-112 s'est **déplacée plutôt que résorbée** : à surveiller pour un futur lot d'extraction (ex. scinder par sous-domaine identité/but+plan/contre-mesures).
- Citation « désaccord n°17 » dans `FichePersonnage.tsx`/`BlocCaracteristiques.tsx` renvoie en réalité au plan d'**it3**, pas d'it4 (dont le registre ne va que jusqu'à #13) — imprécision de citation relevée par QA, fait sous-jacent correct, non corrigée (commentaire de code, pas un critère).
- Suppression d'une étape/contre-mesure purge les brouillons en cours du personnage plutôt que de les réindexer — comportement sûr (jamais de perte silencieuse côté document), cas limite non testé nommément.

- Archivage initial de BUG-066/BUG-069 vers `bug_history.dossier-fiches.json` : **erroné**, reverti en revue de PR (M4). Leur critère de séjour en root (mitigation promue ailleurs) n'était pas rempli par ce qu'it4 avait réellement fait ; BUG-070/072 archivés à leur place. Voir RETOUR-COMITÉ.

**Aucun blocage non résolu.**

## Revue de PR (tech-lead)

Un tour, `REQUEST CHANGES` → tout corrigé → re-gate vert.

**Must-fix (4)** :
- **M1** — `BlocPlanActions.tsx` affichait `etape.duree ?? DUREE_MIN` : un repli de LECTURE sur un champ `moteur`, fabriquant et **committant** silencieusement une valeur que l'auteur n'a jamais posée (même classe que `?? STATS_INITIALES` en lecture, interdit depuis it3 — et le bandeau D1 d'it4 contredisait à l'écran ce que le Stepper affichait). Corrigé par l'affordance « + Poser une durée… » ; nouveau test (sonde posée avant le rendu, KR-199).
- **M2** — `CHANGELOG.md` sans entrée pour it4 : ajoutée.
- **M3** — `README.md` à trois endroits encore sur it3 (3/6, table des features, note de bas de section) : mis à jour à 4/6, résumé it4 ajouté au même paragraphe narratif que it1-it3.
- **M4** — `bug_history.json` et `bug_history.dossier-fiches.json` : leurs `_about` affirmaient encore que BUG-066/BUG-069 vivaient là où ils venaient d'être archivés. **En creusant ce point, l'archivage lui-même s'est révélé substantiellement erroné** — leur critère de séjour (« mitigation déjà promue dans un instrument durable ») n'était PAS rempli par ce que l'itération avait réellement fait : la question de BUG-066 avait été EXAMINÉE puis REPORTÉE par it4, pas tranchée, et la règle de BUG-069 ne vit toujours dans aucun KR. Revert : BUG-066/069 ramenés en root ; BUG-070/072 (mitigations réellement promues cette itération) archivés à leur place. Les deux `_about` réécrits pour refléter l'état réel.

**Minor (5, tous corrigés — `docs/WORKFLOW.md` étape 6 : « fix every accepted minor »)** :
- **m1** — dette `hooks/useEcriturePersonnages.ts` (690 l.) sans propriétaire nommé dans un fichier relu à l'ouverture d'itération : nouvel `open_questions`, propriétaire = raffinage it5.
- **m2** — un second clic sur « + Ajouter une étape… »/« + Ajouter une contre-mesure… » **sans blur intercalaire** écrasait silencieusement un brouillon non commité. Guardé (`if (brouillon existe) return prev`) ; test écrit avec `fireEvent.click` (pas `userEvent.click`, qui déclenche un blur réaliste et masque le bug en committant le brouillon avant le second clic) ; **vérifié qu'il rougit sans le correctif**.
- **m3** — `open_questions` de `PorteeContreMesure` réassignée (propriétaire = n° 12, plus « dev-contrat d'it4 » qui n'existe plus), valeurs posées inscrites.
- **m4** — deux commentaires de test pointaient encore `PanneauPersonnages.handleReglerCaracteristiques`/« gestionnaires câblés par `PanneauPersonnages` » après l'extraction du hook : mis à jour.
- **m5** — `design_contract`/KR-196 disaient encore « à matérialiser » pour les destinations de `contre_mesures[]` : passé au passé, la matérialisation est faite.

## Porte qualité

- Prettier, `tsc --noEmit`, ESLint : verts (tour dev + tour tech-lead).
- Jest : **67 suites / 964 tests**, tout vert (940 avant it4 → 953 après le lot contrat → 961 après le lot feature → 962 après le test fermant le critère #8 → 963 après M1 → 964 après m2).
- Score de mutation `src/brain/` : **non applicable** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché par cette itération (confirmé par QA elle-même, `git diff --stat` vide sur ces 4 chemins).
- Budget de contexte, mesuré (`wc -c`) à la fin de ce lot : `bug_history.json` **10 214 o** (plafond 10 240 — 26 o de marge) ; `src/features/dossier-fiches/specification.json` **66 486 o** (plafond 66 560 — 74 o de marge). Les deux franchissements survenus en cours de lot ont été compactés dans le même geste (§ Écarts assumés).

## RETOUR-COMITÉ

- **Le critère du 5ᵉ axe de scission de `bug_history.json` est « la mitigation est-elle promue ailleurs (KR, critère d'acceptation, test permanent) ? », jamais « le défaut appartient-il à la feature en cours de construction ? ».** La confusion des deux a produit l'archivage initial erroné de BUG-066/BUG-069 (M4, revue de PR) : ils appartiennent tous deux à `dossier-fiches`, EN COURS, ce qui les rendait de faux candidats évidents — mais leur PROPRE `_about` disait déjà pourquoi ils restaient (question examinée-pas-tranchée pour l'un, règle non promue pour l'autre), et ce n'est qu'en LISANT cette justification, pas en appliquant l'axe par réflexe, que l'erreur s'est vue. it5 franchira le même plafond ; relire le `_about` avant de choisir quoi déplacer, pas seulement le nom des entrées.
- Un critère combinant « document complexe non régressé » + « cas malformé refusé » doit dire explicitement **sur le même document** s'il l'exige — sinon deux tests séparément vrais satisfont la lettre sans satisfaire l'esprit (critère #8 réécrit après coup ; à formuler ainsi dès le raffinage la prochaine fois qu'un critère combine ces deux moitiés, ex. it5 sur `relations[]`/`presence[]`).
- Un lot d'extraction KR-112 qui vise à faire descendre deux fichiers sous 400 lignes devrait aussi vérifier, dans sa propre définition de fini, la taille du fichier NOUVELLEMENT CRÉÉ qui absorbe le code déplacé — sinon la dette se déplace sans se résorber (`useEcriturePersonnages.ts`, 690 l., non suivi au § 10 du plan d'it4).
- Un test-grep discriminant (KR-169, chemin de fichier en dur) devrait être repéré par le plan **avant** l'essaim quand une itération mandate une extraction KR-112 — un `grep` d'une ligne sur le nom du fichier vidé aurait trouvé `pvDerive.test.ts` sans attendre un blocage en cours de lot.
