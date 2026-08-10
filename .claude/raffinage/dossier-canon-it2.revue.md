# Revue d'itération — `dossier-canon` · itération 2

**En une ligne** — L'auteur choisit maintenant le lieu de départ de son aventure dans une liste déroulante et rédige le texte lu au joueur à l'ouverture ; les deux survivent à une réouverture du dossier.

## Critères d'acceptation (§6 du plan)

1. **VÉRIFIÉ** — `panneauDepart.test.tsx` : changer de lieu commit immédiatement (sans blur), un `updateSpy` prouve un seul appel par changement, la valeur survit à un démontage/remontage.
2. **VÉRIFIÉ** — le libellé d'un lieu sans nom est confronté à `localiserEntite('lieu', lieu, index)` réel, avec assertions négatives (`not.toBe('')`, `not.toMatch(/undefined/)`).
3. **VÉRIFIÉ** — le texte d'ouverture est persisté au blur et relu après réouverture (test non listé au §7 mais couvert, ajouté par l'ouvrier).
4. **VÉRIFIÉ** — un `texte_ouverture_joueur` vidé refuse sans écrire, bandeau affiché, message confronté au message réel du validateur (pas recopié en dur), `lieu_id` jamais concerné par ce refus.
5. **VÉRIFIÉ** — aucun compteur ni avertissement ne s'affiche sur Départ, testé jusqu'à un texte deux fois plus long que `BUDGET_MOTS_CANON`, et confirmé structurellement : `BUDGETS_DE_MOTS` ne porte aucune entrée `charpente.depart.*`.
6. **VÉRIFIÉ** — Select à une option + légende affichée (texte confirmé par le tech-lead comme lecture correcte du plan — voir « Écarts assumés »).
7. **VÉRIFIÉ** — `monde`, `canon`, `charpente.jalons`/`fins` traversent intacts après un commit sur `charpente.depart` (deep-equal avant/après, deux commits distincts).
8. **VÉRIFIÉ** — `dossierEditorScreen.test.tsx`, cas `index === 1` (Départ) : sonde `SondePanneauDepart` rendue à la place de l'état vide générique, câblage `App.tsx` confirmé par test-grep.

Les 8 critères sont vérifiés. Aucun non vérifié.

## Diff par lot

Un seul lot (`panneau-depart`, `contrat`, `dev-contrat`) — comparé au §5 du plan :

| Fichier | Prévu | Livré |
|---|---|---|
| `src/brain/index.ts` | R — export `localiserEntite` | conforme, corps de la fonction inchangé |
| `src/features/dossier-canon/components/PanneauDepart.tsx` | N | conforme, 212 lignes |
| `src/features/dossier-canon/tests/panneauDepart.test.tsx` | N | conforme, 299 lignes, 9 tests (8 nommés + 1 bonus) |
| `src/features/dossier-canon/index.ts` | R — export `PanneauDepart` | conforme |
| `src/App.tsx` | R — slot `depart` | conforme |
| `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R — sonde + cas `index===1` uniquement | conforme, aucune autre branche touchée |

Intouchés à l'octet près (vérifié deux fois, par `integrateur` et par `qa`) : `Select.tsx`, `identifiers.ts`, `tables.ts`, `DossierService.ts`, `DossierEditorScreen.tsx`, `PanneauSection.tsx`. Aucun fichier hors liste, hors `specification.json` (boucle de mémoire, attendue) et les docs mises à jour après la revue tech-lead (`CHANGELOG.md`, `docs/ROADMAP-BASCULE-IA.md`, `README.md`).

## Ce qui a été refusé

Aucun `REJETÉ` nouveau lors de la construction. Le registre des désaccords du plan (§8) porte un seul `REJETÉ` — hérité du raffinage, confirmé pendant la construction : un test dédié (`identifiers.test.ts`) à la seule joignabilité de l'export du baril. Motif (inchangé) : le repli de `localiserEntite()` est déjà épinglé par `validate.test.ts:146` ; sa résolution de module est garantie par `tsc` au moment où `PanneauDepart` l'importe. Non créé, comme prévu — confirmé par `integrateur` et `qa`.

## Ce qui a été reporté

Rien de nouveau. `Field.maxLength`/`showCounter` reste `OUVERT` depuis it1 (aucun 2ᵉ appelant réel). Un nouveau point part en `open_questions` plutôt qu'en report : le couple `Refus`/`commit` est désormais dupliqué à l'identique entre `PanneauCanon` (it1) et `PanneauDepart` (it2) — extraction différée jusqu'à un **troisième** appelant réel (it3), propriétaire assigné.

## Écarts assumés

1. **Légende à une seule option — guillemets déposés.** Le plan (§3) citait le texte entre guillemets français `« … »` à l'intérieur du span de code. L'ouvrier a rendu le texte **sans** ces guillemets, jugeant — après relecture — qu'ils marquaient une citation en prose du plan (comme au §1, qui écrit « le repli « Lieu n°N (sans nom) » » alors que le littéral réel de `localiserEntite()` n'a pas de guillemets), pas un contenu littéral. La QA a soulevé la même ambiguïté indépendamment sans pouvoir la trancher avec certitude, faute d'accès à l'intention du tour 2 exact du raffinage. Le tech-lead (revue de PR) a confirmé cette lecture avec la même preuve textuelle. **Tranché par l'orchestrateur en clôture de revue** : la lecture « notation », déjà implémentée, est retenue — aucun code changé. Documenté en précédent (`resolved_decisions`/`deviations_from_plan`) pour que le §3 d'un futur plan écrive `"texte exact"` avec des guillemets droits quand le contenu doit être rendu tel quel, jamais des guillemets français.
2. **Deux tests ajoutés au-delà des 8 nommés au §7** (commit réussi du texte d'ouverture, rendu de la légende à une option) — le §7 déclarait ces critères couverts par le lot sans leur nommer de test dédié ; l'ouvrier a comblé l'écart plutôt que de laisser un critère sans preuve.

Aucun blocage non résolu.

## Porte qualité

- `prettier --check` : conforme.
- `tsc --noEmit` : 0 erreur.
- `eslint` : 0 erreur, 1 avertissement préexistant hors diff (`CharacterCreationScreen.tsx`, sans rapport).
- `jest` (suite complète, mesuré trois fois indépendamment — ouvrier, intégrateur, QA) : **61 suites / 835 tests, 0 échec**, aucune régression (net +1 suite / +9 tests face à la valeur mesurée post-revue-de-PR d'it1, 60/826 — cf. `dossier-canon-it1.revue.md:82` ; le 823 du tableau de la revue d'it1 et du `CHANGELOG` 0.6.13 était figé en cours de revue, avant les 3 tests des correctifs BUG-055/BUG-056). `dossierEditorScreen.test.tsx` est étendu (sonde + branche `index===1` + grep `App.tsx`) sans nouveau cas de test — la seule suite neuve est `panneauDepart.test.tsx` (+9 tests).
- `npm run test:mutation` : sans objet — confirmé par `git diff --name-only`, aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché.

## Budget de contexte

`wc -c CLAUDE.md docs/WORKFLOW.md code-knowledge.json bug_history.json features_history.json src/features/dossier-canon/specification.json docs/ROADMAP-BASCULE-IA.md`, mesuré après ce lot :

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 054 o | 45 kio (46 080) | < 0,1 kio — inchangé par ce lot |
| `code-knowledge.json` | 76 798 o | 75 kio (76 800) | **2 o** — voir RETOUR-COMITÉ, inchangé par ce lot mais déjà au bord |
| `bug_history.json` | 12 982 o | 15 kio (15 360) | ~2,3 kio — inchangé, aucun bug de code trouvé ce lot (voir « Ce qui a été refusé ») |
| `features_history.json` | 12 075 o | 15 kio (15 360) | ~3,2 kio — inchangé, `dossier-canon` non terminée |
| `src/features/dossier-canon/specification.json` | 39 005 o | 65 kio (66 560) | ~26,9 kio |
| `docs/ROADMAP-BASCULE-IA.md` | 35 038 o | 35 kio (35 840) | ~0,8 kio — `1/4`→`2/4`, neutre en octets |

Aucun fichier au-dessus de son plafond. Aucune compaction requise dans ce lot.

## RETOUR-COMITÉ

- **Mesurer le poids réel d'un lot contrat avant de le séparer paie.** Le découpage initial du tech-lead au tour 1 (2 lots) s'est réduit à 1 lot unique au tour 2, une fois mesuré que le contrat ne pesait qu'une ligne d'export sans test dédié — un worktree/fusion séparé n'aurait rien parallélisé. À reproduire : toujours chiffrer le lot contrat avant de décider s'il mérite son propre lot.
- **La distinction « Select de référence sans brouillon » vs « Field de prose avec brouillon » est un précédent réutilisable.** it4 (Lieux) combinera probablement les deux à nouveau — cette itération a posé la règle (jamais de brouillon local sur un champ qui référence une entité par identifiant ; brouillon+blur réservé à la prose) plutôt que de la redécouvrir.
- **Le §3 d'un plan doit distinguer nettement guillemets-notation et guillemets-contenu.** L'ambiguïté a coûté un aller-retour de revue (dev-contrat → QA → tech-lead → orchestrateur, tous convergents mais aucun définitivement certain avant l'arbitrage final). Convention à adopter pour les prochains plans : un texte destiné à être rendu tel quel s'écrit toujours entre guillemets droits `"…"` dans le §3, jamais entre guillemets français, qui restent réservés à la prose du plan lui-même.
- **L'étape Docs des Build Steps doit être explicitement dans le lot, pas après.** Le tech-lead a bloqué au tour 1 sur son absence (majeur) — `iterations_log`, `CHANGELOG.md`, roadmap et README n'étaient pas mis à jour avant la revue de PR. Corrigé dans ce lot ; à intégrer d'emblée dans le brief du prochain `dev-contrat`/`dev-lot` plutôt que de le découvrir en revue.
- **Un chiffre de couverture de test doit citer sa source, jamais recopier un tableau figé.** Le tour 2 du tech-lead a trouvé une base fausse (823 au lieu de 826, un instantané de mi-revue d'it1 gelé dans son propre tableau) qui rendait une contribution imaginaire arithmétiquement plausible. Corrigé en citant `dossier-canon-it1.revue.md:82` comme source. À reproduire : toute mention de `N suites / M tests` dans une revue ou un `iterations_log` doit pointer vers la mesure qui fait foi, pas vers une autre revue.
- **`code-knowledge.json` est à 2 octets de son plafond (76 798 / 76 800), sans qu'aucun lot de cette itération n'y ait touché.** La prochaine itération qui y ajoute un KR (it3 en ajoutera nécessairement, `camp` sur `Objectif` étant un nouveau champ de schéma, KR-186) franchira le plafond au premier mot écrit. Anticiper une compaction AVANT ou DANS le lot contrat d'it3, plutôt que de la découvrir en cours d'écriture — le fichier n'a aucune marge résiduelle.
