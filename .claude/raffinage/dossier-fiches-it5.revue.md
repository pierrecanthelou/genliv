# Revue d'itération — `dossier-fiches` · itération 5/8

Plan : `.claude/raffinage/dossier-fiches-it5.plan.md` (validé) — comité : pm-produit, tech-lead, ux-designer, qa, narratif-ia, le 2026-08-13.

## En une ligne

L'auteur peut désormais situer un personnage dans le monde : ses relations à d'autres personnages (cible, ce qui les lie, intensité signée, secret) et sa présence (lieu, moment) — avant cette itération, ces deux blocs de l'accordéon étaient en placeholder muet.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Ajout/édition d'une relation, persistée | **VÉRIFIÉ** | `relationsPresence.test.tsx` — « ajout d'une relation pose la cible sans écrire, édition et intensité bornée, retrait sans confirmation » |
| 2 | Retrait d'une relation sans confirmation | **VÉRIFIÉ** | même test ; aucun `window.confirm` dans `BlocRelations.tsx`/`useEcritureRelationsPresence.ts` |
| 3 | `intensite` bornée -3..3, refusée hors bornes au SSOT | **VÉRIFIÉ** | composant : clamp testé aux deux bornes ; contrat : `validate.test.ts` — bornes/neutre acceptés, hors bornes/non entier/absente refusés |
| 4 | Auto-référence tolérée sans refus (KR-194) | **VÉRIFIÉ** | contrat + composant, `cible_id === personnage.id` accepté, aucun bandeau |
| 5 | Ajout/édition/retrait d'une présence, persistée | **VÉRIFIÉ** | `relationsPresence.test.tsx` — « ajout d'une présence committe immédiatement… » |
| 6 | Lecture au montage sans interaction, deux personnages distincts, relations et présence | **VÉRIFIÉ** | `relationsPresence.test.tsx` — « lecture au montage… » — valeurs non fabricables par défaut (`intensite ≠ 0`, `secret: true`, `quand` non vide) |
| 7 | Prédicat de gating de `secret` présent mot pour mot aux deux sites (JSDoc + `destinations.ts`) | **VÉRIFIÉ** | comparaison caractère par caractère faite par QA — identique ; en plus, un test-grep (`couverture.test.ts`) l'automatise désormais (ajout hors § 7 du plan, jugé légitime — voir Écarts) |
| 8 | Dossier de référence intact + élément malformé de `relations`/`presence` refusé, même document | **VÉRIFIÉ** | `validate.test.ts` — deux corruptions distinctes sur deux personnages, deux `element-non-objet` exacts, `warnings: []` |

## Diff par lot

**Lot 1 (`contrat`, `dev-contrat`, seul et en premier)** — conforme à la liste déclarée : `src/brain/dossier/types.ts`, `tables.ts`, `destinations.ts`, `validate.test.ts`, `couverture.test.ts`, `__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json`, `src/brain/index.ts`, `src/brain/components/Stepper.tsx` (correctif de signe, bug réel trouvé en raffinage), `src/brain/components/Stepper.test.tsx` (nouveau). `validate.ts` mesuré et non touché (boucles génériques suffisent).

**Lot 2 (`feature`, `dev-lot`, séquentiel après le lot 1)** — conforme, avec deux écarts documentés (voir ci-dessous) : `hooks/useSocleEcriturePersonnages.ts` (N, 138 l.), `useEcritureIdentite.ts` (N, 171 l.), `useEcriturePlan.ts` (N, 415 l.), `useEcritureRelationsPresence.ts` (N, 389 l.), `components/BlocRelations.tsx` (N, 164 l.), `components/BlocPresence.tsx` (N, 117 l.), `tests/relationsPresence.test.tsx` (N, 8 tests), `hooks/useEcriturePersonnages.ts` (R, devient l'assembleur, 91 l.), `components/FichePersonnage.tsx` (R, 417 l.), `components/BlocPlanActions.tsx` (R, 1 ligne — import repointé), `tests/panneauPersonnages.test.tsx` (R, 1 hunk — compte de placeholders 4→2).

**Hors lots, traité par l'orchestrateur** (blocage mécanique, conséquence directe du contrat) : `src/features/dossier-format/tests/importDossier.test.tsx` — la relation auto-référentielle ajoutée à `dossier-minimal.json` par le lot 1 fait passer le compte d'anomalies de 3 à 4 dans un test pré-existant de `dossier-format` qui corrompt l'identifiant du personnage. Corrigé (compte + `getByText`→`getAllByText`, RTL Query Safety), vérifié vert avant que le lot 2 ne démarre.

**Écart accepté, hors liste déclarée mais nécessaire** : `src/features/dossier-fiches/components/PanneauPersonnages.tsx` (+3 lignes, purement additives : `personnages`, `lieux`, `relationsPresence`). Le plan classait ce fichier « hors lot » deux fois sans anticiper qu'ajouter des props consommées par `FichePersonnage.tsx` exige de câbler son unique site d'appel. Vérifié par `git diff` : exactement 3 lignes, aucune existante modifiée.

**Documentation de fin d'itération** : `docs/ROADMAP-BASCULE-IA.md` (statut `4/6` → `5/8`), `README.md` (mise à jour dossier-fiches), `CHANGELOG.md` (entrée 0.6.22), `src/features/dossier-fiches/specification.json` (iterations_log, statut it5 → done).

## Ce qui a été refusé

Rien de nouveau refusé au niveau exécution — tous les `REJETÉ` du plan (§ 8) datent du raffinage (proposition PM d'un découpage alternatif savoirs+relations/présence seule) et n'ont pas resurgi pendant l'essaim.

## Ce qui a été reporté

- **Contrat de sortie IA « R4 · acteur »** — consigné en `open_questions`, pointeur vers `tour1-narratif-ia.md § F`, propriété de n°12. Non écrit dans ce lot.
- **`useEcriturePlan.ts` (415 l.) et `FichePersonnage.tsx` (417 l.)** franchissent le signal KR-112 (400) sans atteindre le bloqueur (800) — 3ᵉ itération consécutive où un fichier de cette feature franchit 400 sans être totalement résorbé (précédent : `useEcriturePersonnages.ts` à 690 l. avant cette itération). Dette datée pour it6/it7/it8 : voir RETOUR-COMITÉ.

## Écarts assumés

- **Libellé du plan (§ 3) imprécis, pas le code** : le plan disait « choisir une vraie option committe la ligne immédiatement » pour l'ajout d'une relation/présence. Le comportement réel et testé pose la ligne **localement** et ne committe qu'au premier blur non vide de `lien` (cohérent avec `lien` requis et avec le cas limite du plan lui-même, « aucune ligne vide possible »). Comportement correct, texte du plan à resserrer pour la prochaine relecture — noté, pas corrigé rétroactivement (un plan validé ne se réécrit pas après coup).
- **Test dédié « ajout sans ligne à moitié écrite » absent** : le comportement est couvert par des assertions dispersées dans les deux tests d'ajout (`updateSpy` non appelé, Select revient au placeholder), mais aucun test isolé ne porte ce nom précis du § 7. Comportement prouvé, nommage du plan non honoré à la lettre.
- **`tests/fichePersonnage.test.tsx` listé `(R)` au plan, non touché en pratique** : rien dans ce fichier ne référence `BLOCS_VIDES` ni les nouvelles props — il n'y avait rien à y corriger. Pas un oubli, un fichier listé par prudence qui s'est avéré ne pas être concerné.
- **Occurrence KR-199 pré-existante, non introduite par ce lot, repérée en passant** : `panneauPersonnages.test.tsx`, le test « titres exacts dans l'ordre » ne vérifie en réalité aucun ordre (boucle `forEach` sur la présence, pas la séquence DOM). Antérieur à it5 (seul le compte 4→2 a changé dans ce diff) — signalé pour un futur lot, pas corrigé ici (hors périmètre de cette itération).

**Aucun blocage non résolu.**

## Revue de PR (tech-lead)

Un tour, `REQUEST CHANGES` → tout corrigé → re-gate vert.

**Must-fix (5, 1 code + 4 documentation)** :
- **M1 (majeur, code)** — l'état vide « aucun autre personnage » de `BlocRelations.tsx` (`personnages.length < 2`) masquait des relations **déjà écrites** : un dossier à un seul personnage portant une relation auto-référentielle (KR-194, légale depuis ce lot, instanciée dans `dossier-minimal.json` par le lot 1 lui-même) rendait `lien`/`intensite`/`secret` invisibles et inéditables — violation directe du critère racine #11. Corrigé (`personnages.length < 2 && relations.length === 0`), nouveau test qui rougit sans le correctif.
- **M2/M4** — `docs/ROADMAP-BASCULE-IA.md` et `README.md` se contredisaient dans leur propre section : le tableau/l'en-tête mis à jour (8 itérations, 5/8), la prose narrative en dessous encore à l'ancienne numérotation. Corrigés au même endroit (précédent BUG-069 : « annoter la ligne renversée LÀ OÙ ELLE EST LUE »).
- **M3** — `specification.json` portait 4 résidus de numérotation (`walking_skeleton`, deux critères racine, KR-190 : « it1 à it6 »/« 6 itérations ») et 2 affirmations périmées (`but.echeance`/`presence[].quand` encore « OUVERTS » ; la tautologie de `secret` recopiée au lieu de pointer vers les deux sites qui font foi). Tous corrigés.
- **M5** — relevé du budget de contexte non journalisé. Mesuré : `specification.json` compacté sous 66 560 o à chaque ajout de ce tour (voir § Porte qualité).

**Minor (7, tous corrigés — `docs/WORKFLOW.md` étape 6 : « fix every accepted minor »)** :
- **m1** — `listeLignesStyle`/`ligneStyle`/`enTeteLigneStyle` dupliqués **3 fois** octet pour octet (`BlocRelations.tsx`, `BlocPresence.tsx`, `BlocPlanActions.tsx`), avec un commentaire citant la mauvaise règle (KR-109 parle de features distinctes, ici 3 consommateurs de la MÊME feature — précédent `boutonPointilleStyle`, 2 consommateurs). Déplacés dans `components/styles.ts`.
- **m2** — docstring de `panneauPersonnages.test.tsx` encore « 2 remplis, 6 placeholders » (l'inverse du réel après it5). Corrigée.
- **m3** — aucune entrée `bug_history` pour le bug réel de `Stepper.tsx` (contrairement au blocage mécanique, jugé défendable sans entrée). Ajouté : BUG-073.
- **m4** — `KR-211` cité au plan (§ 7) n'existe nulle part dans `code-knowledge.json` — référence fantôme héritée du plan d'it4. Retirée.
- **m5** — `code-knowledge.json` : KR-190 disait encore « 5 itérations », KR-196 disait encore « à matérialiser » (fait à it4). Corrigés.
- **m6** — JSDoc de la prop `relationsPresence` sur `FichePersonnage.tsx` disait « résultat BRUT du sous-hook » alors que `PanneauPersonnages.tsx` passe le résultat de l'**assembleur**. Reformulée.
- **m7** — `useEcriturePlan.ts` (415 l.)/`FichePersonnage.tsx` (417 l.) au-dessus du signal KR-112, acceptable (loin du bloqueur) mais **it6 ajoutera un bloc à la fiche** sans extraction prévue : une phrase ajoutée au `goal` d'it6 (« extraire `BlocSavoirs.tsx` AVANT d'écrire son contenu »).

## Porte qualité

- Prettier, `tsc --noEmit`, ESLint : verts (tour dev, intégration, QA, tech-lead — quatre passages indépendants).
- Jest : **69 suites / 993 tests**, tout vert (984 après le lot 1 [dont le correctif hors-lot] → 992 après le lot 2 → 993 après M1).
- Score de mutation `src/brain/` : **non applicable**, confirmé indépendamment par QA et par tech-lead (`git diff --stat` vide sur les 4 fichiers mutés).
- Budget de contexte, mesuré (`wc -c`) après compaction finale (post-revue tech-lead) : `specification.json` **66 354 o** (plafond 66 560, marge 206 o) ; `code-knowledge.json` **76 525 o** (plafond 76 800, marge 275 o) ; `bug_history.json` **10 214 o** (plafond 10 240, marge 26 o, inchangé — BUG-073 archivé directement, mitigation déjà promue le jour même). Marge la plus étroite : `bug_history.json`, à surveiller dès it6.

## RETOUR-COMITÉ

- **Un lot qui étend la signature d'un composant/hook consommé par un enfant doit lister explicitement le site d'appel qui câble ces props, même si ce fichier est nominalement « hors lot ».** `PanneauPersonnages.tsx` aurait dû figurer dans le lot 2 dès que `FichePersonnage.tsx` recevait des props obligatoires nouvelles — le plan l'a classé hors lot deux fois sans anticiper ce couplage. À vérifier systématiquement à la prochaine planification : « ce composant/hook a-t-il un seul site d'appel, et ce site reçoit-il de nouvelles props ? »
- **La dette KR-112 continue de se déplacer plutôt que de se résorber, pour la 3ᵉ itération consécutive** (it3→it4 : `FichePersonnage.tsx` ; it4→it5 : `useEcriturePersonnages.ts` scindé mais `useEcriturePlan.ts`/`FichePersonnage.tsx` repassent au-dessus de 400). Une extraction qui vise à faire descendre deux fichiers sous 400 devrait vérifier, dans sa propre définition de fini, la taille de TOUS les fichiers qui héritent du code déplacé — pas seulement les deux ciblés à l'origine.
- **Un critère jugé « non jest » au raffinage peut légitimement être automatisé par le lot contrat sans violer l'esprit du plan**, à condition que le test ajouté prouve exactement ce que le comité avait exclu de prouver autrement (ici : la PRÉSENCE textuelle d'un prédicat, jamais son EFFET comportemental) — mais un tel ajout doit être signalé explicitement dans le compte-rendu du lot pour que la revue le valide a posteriori, pas seulement découvert par QA.
