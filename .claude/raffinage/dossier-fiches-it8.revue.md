# Revue d'itération — `dossier-fiches` · itération 8

**Ce que l'auteur peut faire maintenant** : donner un caractère jouable à son personnage — régler 6 curseurs de comportement (méfiance, franchise, courage, cupidité, loyauté, verve), écrire jusqu'à deux répliques types, une limite qu'il ne franchira jamais, une condition qui le fait céder. C'est le 8e et dernier bloc de l'accordéon : la fiche personnage de `dossier-fiches` est désormais complète, plus aucun bloc n'affiche « Pas encore renseigné ».

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | CTA « + Régler le caractère… » écrit SEULEMENT les 6 curseurs, en un commit | **VÉRIFIÉ** | `caractere.test.tsx` — le clic sème `CURSEURS_INITIAUX` seul, `not.toHaveProperty` sur `parler`/`jamais`/`cede_si` |
| 2 | Chaque curseur se règle 0-10, sans `prefix` signé, balayé depuis `CURSEUR_VALUES` | **VÉRIFIÉ** | `caractere.test.tsx` (composant) + `validate.test.ts` (contrat, balayage `CURSEUR_VALUES × VALEURS_DE_CURSEUR`) |
| 3 | Répliques : ajout sous la limite avec focus, bouton absent (jamais `disabled`) au plafond, import surnuméraire rendu intact | **VÉRIFIÉ** | `caractere.test.tsx` + `validate.test.ts` — « parler à la limite ET à limite+1 passe » |
| 4 | `jamais`/`cede_si` : commit au blur, clé retirée si vidé | **VÉRIFIÉ** | `caractere.test.tsx` |
| 5 | Lecture au montage sur deux personnages distincts, sans interaction, aucune fuite de valeur (BUG-064/KR-199) | **VÉRIFIÉ** | `caractere.test.tsx` — valeurs non fabricables, assertions d'absence croisée |
| 6 | Non-régression du dossier de référence (6 personnages) | **VÉRIFIÉ** | `validate.test.ts` + `couverture.test.ts` |
| 7 | Après it8, plus aucun bloc « Pas encore renseigné » sur les 6 personnages du dossier de référence | **VÉRIFIÉ** | `panneauPersonnages.test.tsx` — dossier de référence **réel** (`importDossier`), les 6 lignes cliquées |
| 8 | Lint vert : zéro import `curseurs.ts`→règles, zéro croisement `dossier-fiches`↔`bascule-editeur`, zéro couleur en dur | **VÉRIFIÉ** | `tsc`/`eslint` verts, `lintIsolation.test.ts` vert, grep couleur en dur négatif |

Points de vigilance spécifiques du raffinage, tous confirmés par lecture directe (QA mode B, pas seulement par confiance dans le compte rendu de l'ouvrier) :
- `curseurs.ts` : zéro ligne `import` — `affinite` est bien une union locale (KR-193).
- `PARLER_REPLIQUES` : zéro ligne dans `tables.ts`/`validate.ts` — borne d'interface, jamais une règle SSOT.
- Prédicat `cede_si` : identique caractère près (482 caractères) aux deux sites (`types.ts` JSDoc / `destinations.ts` commentaire) — **et en réalité testable automatiquement** (voir Écarts, ci-dessous : le plan le classait à tort « non vérifiable »).
- Sonde discriminante de `couverture.test.ts` : rebasée en négatif de forme de chemin, jamais supprimée — vérifiée rouge-avant/verte-après.

## Diff par lot

**Lot A `contrat-caractere`** (dev-contrat, seul, en premier) — conforme à la liste du plan, rien de plus :
`src/brain/dossier/curseurs.ts` (N) · `curseurs.test.ts` (N) · `types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `couverture.test.ts` (R) · `validate.test.ts` (R) · `brain/index.ts` (R).

**Lot B `bloc-caractere`** (dev-lot) — conforme à la liste du plan, rien de plus :
`src/features/dossier-fiches/components/BlocCaractere.tsx` (N) · `hooks/useEcritureCaractere.ts` (N) · `tests/caractere.test.tsx` (N) · `components/FichePersonnage.tsx` (R) · `hooks/useEcriturePersonnages.ts` (R) · `components/PanneauPersonnages.tsx` (R) · `tests/panneauPersonnages.test.tsx` (R).

Hors lot, documentaire : `src/features/dossier-fiches/specification.json` (goal d'it8 raffiné + `resolved_decisions`, étape « Docs » des Build Steps, pas du code).

Intégrateur : aucune collision, aucun fichier hors périmètre de lot — les deux lots ont des racines de chemin disjointes (`src/brain/dossier/**` vs `src/features/dossier-fiches/**`).

## Ce qui a été refusé

- **Regroupement visuel des 6 curseurs par affinité** (CA/CA/IN/IN/IG/IG), proposé par l'UX au tour 1 — retiré par sa propre autrice au tour 2 : l'ordre du registre (`CURSEUR_VALUES`) évite un piège de tabulation (ordre DOM ≠ ordre visuel) et aucune règle du design system n'exige un regroupement.

## Ce qui a été reporté

Rien de nouveau. L'`open_question` « libellés dérivés » (curseurs/caractéristiques/intensité de relation), déjà élargie deux fois (it3, it5), reste ouverte, propriété n° 10 `moteur-interprete`, non réélargie une 3e fois (discipline de budget de contexte tenue).

## Écarts assumés

1. **Hint des champs « Lignes rouges »** (`jamais`/`cede_si`) — le plan disait « hint identique » sans en fixer le texte exact. Le lot B a repris mot pour mot `HINT_FONCTION` de `BlocIdentite.tsx` (« interne — jamais lu par le joueur »), motivé en commentaire : même famille `ia`. Assumé, non contesté en QA mode B.
2. **Ordre DOM de la ligne « réplique »** — le § 3 « Clavier » du plan exigeait explicitement « champ puis son retrait », ce qui contredit littéralement le motif `enTeteLigneStyle` (icône avant le champ) suivi par tous les blocs à lignes répétées précédents. Le lot B a tranché pour l'exigence Clavier écrite, au prix d'un écart au motif partagé — décision documentée dans le JSDoc du composant, non couverte par un test nommé. **À trancher explicitement si un futur bloc à lignes répétées rouvre la question** : soit `enTeteLigneStyle` se généralise avec une variante « icône en fin de ligne », soit le § Clavier des futurs plans s'aligne sur le motif existant.
3. **`FichePersonnage.tsx` à 418 lignes**, au-dessus de la cible « ≤ 412 » que le plan s'était lui-même fixée — non bloquant (signal KR-112 à 400, bloqueur à 800 ; le plan notait déjà qu'aucune extraction n'était exigée dans ce lot, dernière itération de la feature). Dette KR-112 non résorbée, sans « itération suivante » de `dossier-fiches` pour la reprendre — à noter pour toute feature future qui rouvrirait ce fichier.
4. **Le § 7 du plan classait le prédicat `cede_si` comme « non vérifiable en l'état »** (identité mot-pour-mot de deux commentaires, jugée hors de portée de jest). Le lot A a constaté que ce n'est plus vrai depuis it5 : `couverture.test.ts` porte déjà exactement cet instrument pour `Relation.secret`. Un test a donc été écrit. **Correction positive, pas un défaut** — mais elle révèle que le raffinage n'a pas systématiquement vérifié si un « non vérifiable » du plan avait déjà un précédent instrumenté ailleurs dans le dépôt (voir RETOUR-COMITÉ).
5. **`revele_comment` (bloc Savoirs, it6)** reste sans test d'identité mot-pour-mot avec sa ligne de `destinations.ts`, alors que `secret` (it5) et `cede_si` (it8) l'ont désormais — signalé par le lot A, hors de son propre lot, à traiter en micro-commit indépendant si jugé utile.

## Blocages non résolus

Aucun.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier | vert |
| `tsc --noEmit` | vert, 0 erreur |
| ESLint | vert, 0 erreur (1 warning pré-existant hors-diff, `CharacterCreationScreen.tsx`, non touché) |
| `jest` (suite complète, mesuré par QA mode B indépendamment) | **73 suites / 1051 tests, tous verts**, 14,4 s — puis **1052** après la revue de PR tech-lead (BUG-077, un test nommé de plus) |
| `lintIsolation.test.ts` (KR-184) | vert, 22/22 |
| `npm run test:mutation` | **sans objet** — aucun des 4 fichiers mutés (`challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`) n'est touché par cette itération (KR-193/KR-161) |

## RETOUR-COMITÉ

- **« Non vérifiable en l'état » mérite une vérification de précédent avant d'entrer dans un plan.** Le § 7 avait raisonnablement classé l'identité mot-pour-mot de `cede_si` hors instrument — c'était vrai la première fois (`Relation.secret`, it5), mais l'instrument existait déjà. Pour toute future feature posant un champ à gating par rôle écrit à deux sites : grep d'abord `destinations.ts`/`couverture.test.ts` pour un test-grep de la même forme avant de conclure « hors instrument ».
- **Un § « Clavier » écrit en prose peut contredire silencieusement un motif de style partagé** (`styles.ts`) sans qu'aucune porte mécanique ne le voie — la contradiction n'a été tranchée qu'au moment où le dev-lot l'a rencontrée, en autonomie. Pour un futur bloc à lignes répétées, le contrat de design devrait citer explicitement le motif réutilisé (`enTeteLigneStyle` ou sa variante) plutôt que de décrire l'ordre en prose libre.
- **Le mode séquentiel à 2 lots (sans worktree) reste le bon défaut sur ce dépôt** : zéro collision, intégration en un contrôle de propriété plutôt qu'une fusion, porte qualité stable d'un lot à l'autre (1041 → 1052 tests, croissance strictement additive). Rien à changer pour la prochaine feature qui suivra ce patron à 2 lots.
- **Une garde posée DANS un `.map()` n'empêche pas l'écriture si `commit()` est encore appelé juste après, sans condition.** `commit()` (`useSocleEcriturePersonnages.ts`) appelle `dossiers.update()` sans aucun court-circuit sur no-op — le premier correctif de BUG-077 (§ Revue de PR ci-dessous) l'a appris à ses dépens : la garde doit se poser AVANT l'appel à `commit`, pas dans la fonction de transformation qu'il reçoit. Le tech-lead a relevé au second tour que ce patron (« commit inconditionnel sur no-op ») existe ailleurs dans la feature depuis it3/it4/it5 (`handleChangeCaracteristique`, les Steppers `duree`/`intensite`) — dette non ouverte par it8, non reprise ici (dernière itération de la feature), propriétaire suggéré : le raffinage de la prochaine feature dossier qui touche `useSocleEcriturePersonnages.ts` ou son patron.

### Revue de PR (tech-lead)

**Tour 1 : REQUEST CHANGES**, 4 findings (2 majors, 2 minors) :
1. Major — ordinal erroné : « `cede_si` est le 3ᵉ champ à injection conditionnelle au rôle » dans `CHANGELOG.md`/`README.md`, alors que le SSOT (`types.ts`/`destinations.ts`) dit SECOND (`si_bloque` est conditionné à un fait de SESSION, pas au rôle, et ne compte donc pas dans cette série).
2. Major — aucun relevé d'octets consigné malgré la compaction de 3 fichiers budgétés (`specification.json`, `docs/ROADMAP-BASCULE-IA.md`, scission de `features_history.json`) ; le plafond de `features_history.json` dans `docs/WORKFLOW.md` non re-dérivé après sa scission.
3. Minor — `handleBlurJamais`/`handleBlurCedeSi` pouvaient écrire `caractere: {}` (bloc VIDE au lieu d'ABSENT, KR-191/192) sur un blur à vide sans saisie préalable.
4. Minor — « 4ᵉ scission de fichier append-only du dépôt » alors que `bug_history.json` en compte déjà 4 avant celle-ci (donc 5ᵉ).

Corrections : ordinal réécrit aux 2 sites ; les 6 mesures d'octets ajoutées à `iterations_log[8]`, plafond de `features_history.json` re-dérivé 15→10 kio dans `docs/WORKFLOW.md` ; ordinal de scission corrigé 4ᵉ→5ᵉ. Pour le finding 3, **BUG-077** : un premier correctif (garde dans le `.map()`) s'est révélé insuffisant — le test nommé ajouté l'a lui-même fait échouer (`commit()` était encore appelé, donc `updateSpy` l'était aussi) — corrigé en second par une garde avant l'appel à `commit`.

**Tour 2 : APPROVE**, sous réserve d'un chiffre périmé (73 suites / 1051→1052 tests, le test de BUG-077 ayant été ajouté après le premier relevé) — corrigé dans le même lot, pas de 3ᵉ tour. Balayage demandé sur les fonctions voisines : 3 instances réelles du même patron « commit inconditionnel sur no-op » trouvées (`handleChangeCurseur` au plafond du Stepper, `handleRetirerReplique` laissant `{parler: []}`, les blurs sans changement) — toutes précédentées par it3/it4/it5, non introduites par it8, non bloquantes.
- **Cette itération clôt `dossier-fiches` (n° 4)** : les 8 blocs de la fiche personnage sont tous livrés. Prochaine étape hors de ce plan : `features_history.json`, `CHANGELOG.md`, `docs/ROADMAP-BASCULE-IA.md` (statut de la feature), et la revue tech-lead avant présentation à l'utilisateur (Build Steps § 4, § 6-8).
