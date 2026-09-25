# Revue d'itération — `moteur-dossier` · itération `4`

> Statut : livrée, porte qualité verte, en attente de commit (approbation utilisateur en cours)
> Plan : `.claude/raffinage/moteur-dossier-it4.plan.md` — validé par l'humain le 2026-09-25 (Option A retenue pour le § 0 bis, déjà livrée avant l'ouverture du tour de validation)
> Exécution : lot unique `contrat` (`extinction-arbre`), agent `dev-contrat`, séquentielle, sans worktree ni intégrateur — conforme au plan
> Vérification : `qa` en mode B, contexte neuf — verdict **CONFORME**

## En une ligne

**Le modèle d'arbre n'a plus aucun consommateur de jeu.** `tree-canvas` reste sur disque, intact, en sommeil (décision n° 5) ; ce que l'auteur pouvait déjà faire (jouer une session pilotée par le dossier, sans IA, depuis it1-it3) n'a besoin d'aucun runtime d'arbre pour continuer de fonctionner — c'est un jalon d'ingénierie sans phrase de démo, dérogation nommée dès le cadrage et assumée par le PM et le tech-lead indépendamment.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Baril : `playExport`/`buildAdventureDocument` retirés, 11 symboles `tree-canvas` survivent | **VÉRIFIÉ** | `grep` sur `brain/index.ts` → 0 match des deux premiers ; les 11 symboles (`BookNode`, `Edge`, `effectiveKind`, `endLabel`, `EDGE_KINDS`, `NODE_KINDS`, `nodeTitle`, `textLines`, `NodeBadge`, `useBrain`, `createBrain`) tous exportés |
| 2 | Imports `src/player/**` → `brain/tree`/`brain/utils/playExport` : 4+1 → 0 | **VÉRIFIÉ** | Balayage avant (`git show HEAD`) = 4+1 ; après = 0 spécificateur d'import réel (2 mentions résiduelles, en commentaire de `types.ts` seulement) |
| 3 | `tree-canvas`+`player` : 8 suites/182 tests exact (tree-canvas 3/37 inchangé) ; complet : 118/1829 exact | **VÉRIFIÉ** | Rejoué par `dev-contrat` puis re-rejoué indépendamment par la QA et par moi-même : `npx jest src/features/tree-canvas src/player --silent` → 8 suites/182 tests ; `npx jest --silent` → 118 suites/1829 tests |
| 4 | `git diff --name-only HEAD -- src/features/tree-canvas/` vide | **VÉRIFIÉ** | Sortie vide, rejouée trois fois (ouvrier, QA, orchestrateur) |
| 5 | Bouton « Aperçu du jeu ▷ » rendu/désactivé, `previewDisabledReason={RAISON_APERCU_LIVRE}` | **NON VÉRIFIABLE EN L'ÉTAT** | Texte confirmé verbatim caractère pour caractère (`src/EditorScreen.tsx:54`) ; **aucun test du dépôt ne rend `EditorScreen`** — recopié tel quel du § 7 du plan |
| 6 | `EXIGENCE-APERCU-DU-JEU.md` l. 9/49 exactes, bandeau nomme n° 15 | **NON VÉRIFIABLE EN L'ÉTAT** (documentaire) | Bandeau confirmé l. 5-14, nomme la n° 15 (`moteur-fins`) ; aucun instrument du dépôt ne garde ce critère (`grep -rln "EXIGENCE-APERCU\|extractable"` sur `*.test.ts*` → aucun fichier) |
| 7 | `REGLES-PLAY.md` § A nomme A4/E3 et B3 sans implémentation, n° 11 propriétaire | **NON VÉRIFIABLE EN L'ÉTAT** (documentaire) | Bandeau confirmé l. 11-21, nomme la n° 11 (`moteur-arbitre`) et `commande.aller` comme successeur ; `REGLES-DU-JEU.md` inchangé (KR-130) |
| 8 | `moteurSansIA.test.ts` : docstring datée/ventilée, planchers par racine (10/5/25), 3 motifs inchangés | **VÉRIFIÉ** | Ventilation recalculée indépendamment (player 14 · play-mode 8 · brain/dossier 26 = 48), identique au chiffre du plan ; `PLANCHER_PAR_RACINE` ajouté ; les 3 motifs interdits et leurs assertions inchangés (diff confirmé) |

## Diff par lot

**Lot unique `extinction-arbre` (`contrat`, `dev-contrat`) — 24 fichiers exacts, conformes au § 5 du plan :**

- **15 supprimés** : `brain/utils/playExport.ts` (+`.test.ts`) · `brain/utils/buildAdventureDocument.ts` · `features/play-mode/components/PlayerModal.tsx` · `player/components/{PlayerRuntime,NodeScreen,ChoiceList,DecorScreen,PnjScreen,TrapScreen}.tsx` · `player/engine/sessionEngine.ts` (+`.test.ts`) · `player/hooks/usePlaySession.ts` · `player/utils/persist.ts` (+`.test.ts`)
- **9 modifiés** : `brain/index.ts` · `brain/persistenceKeys.ts` · `brain/tree.ts` · `src/EditorScreen.tsx` · `src/player/types.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` · `docs/REGLES-PLAY.md` · `src/features/play-mode/tests/moteurSansIA.test.ts` · `src/brain/components/EditorTopBar.test.tsx`
- **0 créé**

Aucun fichier hors des 24 n'a été touché par le lot. Propriété de fichiers vérifiée par la QA en mode B, séparément de l'ouvrier.

**Hors lot, geste de bookkeeping de l'orchestrateur (Build Steps § 4, pas du lot `contrat`)** : `src/features/moteur-dossier/specification.json`, `bug_history.moteur-dossier.json`, `features_history.json`, `docs/ROADMAP-BASCULE-IA.md`, `README.md`, `CHANGELOG.md`, `package.json`.

## Ce qui a été refusé (registre du plan, § 8)

Rappel des refus qui façonnent ce qu'on ne voit **pas** dans le diff — un relecteur ne peut pas les deviner :

- **A-2/A-3** (PM) — élargir explicitement le périmètre à 22 fichiers plutôt que les 10 du goal initial, et couper le lot en deux (4a/4b) : les deux rejetés, le premier parce que 10 fichiers laissent `tsc` rouge, le second parce que la coupe n'achète aucun parallélisme et déplace le lot `contrat` en second.
- **A-4** (tech-lead puis QA) — un témoin neuf `extinctionArbre.test.ts`/« garde de frontière » : retiré par ses auteurs, pouvoir séparateur nul mesuré (vert par construction avant toute démolition).
- **A-8** (QA) — `git status --porcelain` comme instrument du « non modifié » : 14 faux positifs mesurés en worktree neuf après Prettier ; l'instrument retenu est `git diff --name-only`.
- **A-14** (tech-lead) — corriger les huit renvois périmés vers `PlayerModal.tsx` disséminés dans les commentaires : hors lot, « petit refactor à côté » interdit — périmés, pas menteurs.
- **A-15/A-16** (UX) — faire disparaître le bouton « Aperçu du jeu ▷ », ou corriger le défaut `previewDisabledReason` de `EditorTopBar.tsx:71` : les deux rejetés, `EditorTopBar.tsx` restant gelé par D-6 (infobulle native non mesurée en navigateur).
- **A-17** (UX) — conserver le code des 5 écrans de nœud comme référence visuelle : `ChoiceList.tsx` mutait `e.currentTarget.style` au survol, anti-patron qu'on ne veut pas propager. Seule la table issue→jeton de `TrapScreen.tsx` est conservée (Annexe C ci-dessous).
- **A-21/A-22/A-23** (narratif-ia) — réécrire les § 2/3/6 d'`EXIGENCE-APERCU-DU-JEU.md`, réimplémenter les +5 PE sur `commande.aller`, nettoyer les 39 littéraux de prose des moteurs survivants : les trois hors périmètre d'it4, nommés pour la n° 11/n° 13/n° 15.
- **A-26** (QA) — toute citation d'une couverture globale montante comme preuve : supprimer ~1 500 lignes fait monter le ratio sans qu'aucun test n'ait été écrit.

## Ce qui a été reporté

- **A-18/A-19** (UX) → n° 10 : le compteur d'alertes en session (`PlayerModal.tsx:62-69`, mort sans remplaçant, gain net) et la règle ESLint interdisant `onMouseEnter`/`onMouseLeave` (re-mesurée : 6/2 → 2/1 fichier, orphelin hors lot).
- **A-25** (narratif-ia) → avant la n° 13 : le § H de `REGLES-PLAY.md` (23 capacités), marqué « proposition » alors que `capacityEffects.ts` en implémente une partie.
- **A-27** (orchestrateur, tour de cadrage) → hors périmètre : dérive `package-lock.json` (`0.6.19`) vs `package.json` (`0.7.3` à l'époque, `0.7.5` maintenant).
- **A-6 levée avec contrepartie** → n° 11 : `REGLES-PLAY.md` § A (A4/E3 : +5 PE par changement de lieu, B3 : équipement de départ) porte un bandeau nommant explicitement la n° 11 comme propriétaire et `commande.aller` comme successeur, plus une entrée `open_questions` dans `specification.json`.
- **KR-242** (replay déterministe) → n° 11 : ce lot l'éloigne encore, en supprimant les deux seuls sites qui passaient `Math.random` explicitement (`TrapScreen.tsx:38`, `DecorScreen.tsx:75`).

## Écart assumé (BUG-129)

Le § 4 bis du plan annonçait le retrait **total** de `PlayNode` de `src/player/types.ts`. Un appelant réel non mesuré par le comité — `EndScreen.tsx`, orphelin hors-lot des ~4 400 lignes conservées de `src/player/` — l'importe encore ; son seul appelant (`PlayerRuntime.tsx`) est justement celui que ce lot démolit, donc l'écart n'était visible qu'après coup. `tsc --noEmit` rougissait (TS2305) au retrait complet.

**Résolution, dans le périmètre des 24 fichiers** : `PlayNode` redéfini localement et minimalement dans `types.ts` (`interface PlayNode { text: string }`, le seul champ lu par `EndScreen.tsx`), **sans réimport de `brain/tree`** — un réimport aurait fait remonter le critère 2 (imports `src/player/**` → `brain/tree`, mesuré à zéro) de 0 à 1, cassant un critère d'acceptation chiffré.

**Vérifié indépendamment par la QA en mode B** : `EndScreen.tsx` confirmé appelant réel hors-lot, `tsc` vert avec cette redéfinition, critère 2 toujours à zéro import. Verdict : **accepté comme réparation d'une signature de plan incomplète**, pas comme une improvisation — aucun fichier hors des 24 n'a été ouvert. Journalisé `BUG-129` (mineur) dans `bug_history.moteur-dossier.json`.

Aucun autre `BLOCAGE`, formel ou non, n'a été levé par l'ouvrier ni par la QA.

## Annexe C — table issue→jeton, `TrapScreen.tsx:105-129` (consignée, A-17)

Récupérée depuis `git show HEAD` avant suppression, pour mémoire de style au repreneur (aucun consommateur avant la n° 10/13) :

| Élément | Issue | Jeton **mesuré dans la source** | Jeton **prescrit au repreneur** |
|---|---|---|---|
| Bordure du panneau d'issue (l. 111) | réussite | `var(--good)` | inchangé |
| Bordure du panneau d'issue (l. 111) | échec | `var(--bad)` | inchangé |
| Épaisseur de cette bordure (l. 111) | — | `1px` **littéral en dur** | `var(--bw-hair)` — anti-patron « valeur en dur », CLAUDE.md § Design fidelity |
| Fond du panneau (l. 112) | réussite | `var(--good-bg)` | inchangé |
| Fond du panneau (l. 112) | échec | `var(--bad-bg)` | inchangé |
| Libellé Réussite/Échec (l. 121-124) | réussite/échec | `var(--good)`/`var(--bad)` (texte) | inchangé |

## Porte qualité

- **Prettier** : conforme, aucun fichier réécrit (`npx prettier --check` sur `src/**` et `worker/**`)
- **`tsc --noEmit`** : exit 0
- **ESLint** : 0 erreur, 1 warning préexistant (`CharacterCreationScreen.tsx:35`, hors lot, connu avant it4)
- **`jest`** : 118 suites / 1829 tests verts — delta exact vs l'E₀ mesuré au plan (121 suites / 1870 tests, 2026-09-25) : **-3 suites / -41 tests**, exactement les trois suites supprimées par ce lot (`playExport.test.ts` 9 tests, `sessionEngine.test.ts` 24 tests, `persist.test.ts` 8 tests = 41). E₁ ⊆ E₀ tient par construction arithmétique, pas seulement par « aucun rouge observé »
- **`npm run test:mutation`** : **non requis et non lancé** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est au diff (KR-243)

## Prérequis § 0 bis

Résolu **avant** l'ouverture du tour de validation humaine : la tranche hors cycle `eol-lf` (B4, `.gitattributes`, commit `c48a8c7`) était déjà committée et incluse dans `0.7.4` la veille au soir. La mesure écrite au plan (« aucun `.gitattributes` n'existe ») était caduque le jour même de sa rédaction — reconfirmé en local (`contexte.test.ts` : 84/84) avant de lancer l'essaim.

## RETOUR-COMITÉ

- **Une fermeture de consommateurs mesurée sur le modèle peut manquer un appelant réel dans du code orphelin conservé hors de tout lot.** Le comité a mesuré les appelants de `PlayNode` sur `brain/tree.ts` mais pas sur les ~4 400 lignes orphelines de `src/player/` ; `EndScreen.tsx` n'y est cité, dans les 9 transcripts de raffinage, que comme ligne de LOC — jamais comme consommateur de type. Le grep systématique de `dev-contrat` avant écriture (règle 2 de son cadrage) l'a trouvé là où la mesure de comité, prise avant que le lot n'existe, ne pouvait pas le voir. Pour une prochaine fermeture similaire : le raffinage devrait griffonner un balayage des orphelins conservés, pas seulement du modèle nommé.
- **Vérifier l'état du dépôt avant d'exécuter une remédiation déjà écrite en évite une redondante.** Le § 0 bis du plan a bien fait son travail (un veto de démarrage réel, correctement bloquant au moment où il a été posé), mais entre la rédaction du plan et son passage en validation humaine, la remédiation avait déjà été livrée par une tranche hors cycle. Un contrôle d'un coup de `git log`/`test -f .gitattributes` avant de solliciter l'arbitrage humain aurait évité de reposer une question déjà tranchée.
- **Un lot de démolition sans phrase de démo se prouve par une ligne de fermeture chiffrée, pas par un scénario utilisateur.** La dérogation nommée au cadrage (pas de « à la fin, l'auteur peut… ») a tenu tout du long ; le § 6/§ 10 du plan, entièrement composé de critères mesurables (comptes exacts de suites/tests, diffs vides, balayages d'imports), a rendu la vérification aussi robuste qu'une itération à démo — c'est un patron réutilisable pour B2/`outillage-2` et toute future tranche de démolition pure.
