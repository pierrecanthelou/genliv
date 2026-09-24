# Revue — tranche hors cycle `B3 budget-de-contexte`

> Livrée le 2026-09-24 · 2 lots séquentiels · plan : `.claude/raffinage/budget-it1.plan.md`

## En une ligne

**`code-knowledge.json` retrouve 3,94 kio de marge et porte enfin les 19 KR qui lui manquaient** — dont deux que personne n'avait comptés — et le cliquet de budget reçoit le plancher qui l'empêchait d'être un décor.

## Les mesures, toutes relevées et aucune recopiée

| Fichier | Avant | Après | Plafond | Marge |
|---|---:|---:|---|---:|
| `code-knowledge.json` | 76 690 | **67 649** | **70 kio** *(re-dérivé)* | **4 031 o** |
| `code-knowledge.arbre-condamne.json` | — | **9 438** (28 entrées) | — | — |
| couple `CLAUDE.md` + `WORKFLOW.md` | 45 880 | **46 066** | 45 kio | **14 o** |
| `bug_history.json` | 8 082 | **9 712** | **10 kio** *(plancher)* | 528 o |
| `features_history.json` | 11 934 | 11 934 | **25 kio** *(plancher)* | 13,35 kio |
| `docs/ROADMAP-BASCULE-IA.md` | 30 546 | **30 660** | 30 kio | **60 o** |
| `moteur-dossier/specification.json` | 65 377 | **64 556** | 65 kio | 2 004 o |

Décomposition de `code-knowledge.json`, arithmétique **fermée** (vérifiée par script, pas déduite) : −8 654 (30 entrées compactées) −7 587 (28 archivées) +6 735 (22 neuves) +465 (`_about` réécrit) = **67 649**, égal à la mesure réelle.

**La zone d'atterrissage a été tenue** : `[66 561 ; 68 000]`. Atterrir plus bas aurait re-dérivé le plafond à 65 kio pour 507 o de marge — **l'optimum de la formule n'est pas le minimum du fichier**. Relief délibérément laissé sur la table, chiffré : ~605 o (les trois `game-system`, sans spec cible, restent auto-suffisantes) + 365 o (`KR-147`, voir ci-dessous).

## Les huit critères

| # | | Preuve |
|---|---|---|
| 1 | ✅ | Mutant posé sur `KR-095` : test **ROUGE** nommant `« KR-095 (cite par cloud-sync) »`, remis → **VERT**. L'échec nomme l'id **et** la spec qui le cite |
| 2 | ✅ | `KR-237`…`KR-253` mirrorés ; assertion 1 verte |
| 3 | ✅ | Sonde supplémentaire : la même entrée déplacée **vers l'archive seule** → vert. L'union est bien bâtie sur le **glob**, pas sur une liste écrite à la main |
| 4 | ✅ | `BUG-074` présent ; collisions d'ids épinglées en égalité exacte (voir ci-dessous) |
| 5 | ✅ | Le **seul** `.ts` du diff est `src/brain/codeKnowledge.test.ts` ; porte verte |
| 6 | ✅ | 159 ids avant (`sha256` de la liste triée relevé **avant** de commencer) ; 153 vivants + 28 archivés = 181, **0 doublon**, `disparus: []`, `modifiés: []` |
| 7 | ✅ | `grep "L'arrondi EST la marche"` → **zéro** dans la doctrine ; couple remesuré **46 066 < 46 080** |
| 8 | ✅ | Les six rangées de la table réécrites **sur mesure** |

## Ce que le cadrage avait faux, et que le lot a trouvé

Le cadrage avait été produit par **un seul rôle, sans contre-lecture** — c'est la forme d'une tranche hors cycle. Trois de ses prémisses étaient fausses, et les trois ont été trouvées par l'ouvrier **en mesurant**, jamais en lisant :

- **Il manquait 19 ids au mirroring, pas 17.** `KR-184` (cité par `dossier-canon` **et** `dossier-controles`) et `KR-185` n'avaient jamais été mirrorés non plus. Le critère 2 était **inatteignable** avec les seuls 17 : l'assertion 1 partait rouge sur 19.
- **`KR-113` n'était pas réductible.** Le plan le rangeait parmi les KR « câblés dans ESLint ». Vérifié au fichier : `exhaustive-deps` est bien à `'error'`, mais **l'état dérivé n'a volontairement aucune règle** (`CLAUDE.md`, `KR-153`). L'entrée nomme désormais la moitié câblée **et** celle qui ne l'est pas. Gain nul, assumé — la consigne « ne le réduis pas sur la foi du plan » a servi exactement une fois, et c'était la bonne.
- **Le gain de scission était optimiste de ~990 o**, et `game-system` n'a **aucune spec cible** (feature supprimée) : ses trois entrées ne pouvaient pas « descendre dans leur spec ». La zone d'atterrissage n'était atteignable qu'en resserrant les textes sous le budget du plan et en posant une **convention de renvoi écrite une fois** dans `_about`.

## Ce qui a été refusé, et pourquoi

- **Archiver `KR-147`** (la lettre du plan le comptait parmi les 29) : c'est un motif générique **cité par deux features VIVANTES** — `dossier-registres/components/styles.ts:181` et `play-mode/components/CadrePartie.tsx:106`, code livré l'avant-veille — et son texte dit lui-même « survit à `node-editor` supprimé ». L'envoyer dans un fichier dont le déclencheur de relecture est la démolition de la n° 9 aurait rejoué le défaut que `bug_history.dossier-canon.json` raconte : 28 KR réduits à « sans objet », faux pour 16. **Reste vivant, compacté à 365 o.**
- **Supprimer les 29 entrées** des features mortes : elles **déménagent**. « Compacter n'est pas supprimer : c'est déplacer là où c'est lu au bon moment. »
- **Scinder `code-knowledge.json` par feature ou par temps** : refusé au cadrage (BUG-086), et les 71 entrées `dossier-*` sont ce que le Temps 2 lit le plus.
- **Promouvoir les leçons de process** de `dossier-copilote` et `dossier-canon` en KR : elles n'entraient que pour débloquer une scission annulée par le plancher. `code-knowledge.json` est un registre de risques de **code** ; ces leçons vivent dans la skill `raffinage-iteration`, en lecture obligatoire pour qui les applique. **Trois KR neufs au lieu de six.**
- **Instrumenter le plafond en pass/fail** : une sonde qui échoue bloquerait la livraison, ce que la doctrine interdit explicitement.

## La découverte que la tranche n'avait pas prévue

**`BUG-055`, `BUG-056`, `BUG-057`, `BUG-058` portent chacun DEUX défauts différents** — quatre de `dossier-format` (2026-08-08), quatre de `dossier-canon` (2026-08-10). **Récidive exacte de BUG-062, deux jours après, dans les deux sens.**

L'assertion 5 du test neuf est partie **rouge sur l'état réel du dépôt**. La renumérotation étant hors périmètre de la tranche, elle est livrée avec une constante `COLLISIONS_CONNUES` **datée, nommée, en égalité EXACTE** : une cinquième collision rougit, **et une collision réparée aussi** — la liste ne peut pas pourrir en silence. Journalisé **BUG-123**.

**Correction apportée par l'orchestrateur après le lot 2** : L2 avait **retiré** du roadmap la ligne de dette « Unicité des `BUG-xxx` », à juste titre — elle réclamait *un instrument*, et l'instrument existe. Mais l'instrument a révélé une dette **différente** : quatre ids ambigus que personne ne répare. La retirer sans la remplacer aurait fait disparaître la dette de la seule table où les dettes armées sont listées. **Une ligne de remplacement a été ajoutée**, qui distingue ce qui est payé (l'instrument) de ce qui ne l'est pas (la renumérotation), avec son déclencheur : le premier lot qui rouvre une entrée citant l'un des quatre.

## Le plancher, et ce qu'il a changé au périmètre

Décision de l'utilisateur, D-2 : `plafond = max( ceil(mesure ÷ 5 kio) × 5 kio , ceil(5 × la plus grosse entrée ÷ 5 kio) × 5 kio )`, le second terme **ne valant que pour les fichiers append-only**. La phrase « L'arrondi EST la marche — il n'y en a pas d'autre », devenue fausse, est **remplacée** et non doublée.

**La tranche a été réduite de 3 lots à 2 par cette décision, et c'est une mesure qui l'a montré** : le cadrage n'avait chiffré le plancher que sur `bug_history.json`, où il conclut justement « il ne desserre rien » (5 → 10 kio). Appliqué à `features_history.json`, il porte le plafond de **10 à 25 kio** — les deux dépassements qui motivaient les lots 2 et 3 disparaissaient. **Un amendement de doctrine se calcule sur TOUS les fichiers qu'il gouverne, pas sur celui qui l'a motivé.**

## Ce que personne n'a vérifié

- **La pertinence des 28 entrées archivées** : on a vérifié qu'aucune n'est citée depuis une feature vivante (`KR-147` était la seule, elle est restée), pas qu'aucune ne redeviendra utile. Le déclencheur de relecture est écrit dans les deux `_about` ; rien ne le tient mécaniquement.
- **Les plafonds** : aucun instrument du dépôt n'en garde un, et la tranche n'en crée pas. La table est le **seul** registre écrit du cliquet — c'est précisément pour cela qu'elle mentait sur deux lignes avant ce lot.
- **`KR-133` renvoyait à `REGLES-PLAY-A-COMPLETER.md` § H, fichier qui n'existe pas.** Signalé, **non corrigé** : l'ouvrier n'a pas inventé de substitut. À reprendre par qui possède la doctrine de jeu.

## Porte qualité

`format` propre · `tsc --noEmit` **0 erreur** · `lint` **0 erreur** (1 warning préexistant hors diff) · `npx jest` **119 suites / 1837 tests** · `test:mutation` non lancé (aucun fichier muté au diff).

## Ce que la revue de PR a corrigé

Verdict initial `REQUEST CHANGES` — 2 majeurs, 4 mineurs, tous fondés.

- **Majeur — l'`open_question` du rattrapage disait désormais le FAUX** : « les 17 KR n'ont **jamais** été mirrorés », « plafond de 75 kio, ~113 o de marge ». C'est la spec que la n° 9 it3 ouvre **en premier**. Fermée, convertie en `resolved_decisions` qui dit les **19**.
- **Majeur — la table mentait à nouveau, et de mon fait** : ma ligne de dette ajoutée après le lot 2 a porté le roadmap de 30 219 à 30 660 o sans que la rangée bouge. 441 o d'écart, **sur la ligne du seul fichier dont la croissance est déclarée un défaut**, dans la tranche qui existe pour que cette table cesse de mentir. Rangée réécrite sur mesure.
- **Mineur — deux phrases se contredisaient dans le même paragraphe** : « Le plafond ne monte jamais » face à un plancher qui vient de le faire monter deux fois (5 → 10 kio, 10 → 25 kio). Devient « ne monte jamais **par la mesure** … seul le **plancher** append-only le relève ». Le remplacement a d'abord franchi le couple de 5 o — payé en resserrant l'ajout, remesuré à **46 066 / 46 080**.
- **Mineur — la dette « Tenue des specs » avait son déclencheur DÉCLENCHÉ.** Il disait « la prochaine étape 4 des Build Steps » ; c'était celle-ci, et le lot avait ouvert exactement `book-library` et `cloud-sync`, toutes deux `in-progress` avec toutes leurs itérations `done`. **Absorbée** : deux `status` passés à `done`, la rangée retaillée sur ce qui reste réellement dû. *Une dette armée qui part et que personne n'absorbe est le mode de panne que le § 2 bis nomme lui-même.*
- **Mineur — les 42 renvois « Corps : spec `<feature>` » n'étaient tenus par rien.** Ce sont les **seules références par nom** du dépôt, et aucun autre instrument ne voit un répertoire renommé ou retiré. *(Le premier jet de cette clause disait que la n° 9 « démolit `play-mode` et `tree-canvas` » — prémisse **formellement rejetée** au cadrage de la n° 9, veto tech-lead : elle éteint les CONSOMMATEURS du modèle d'arbre, jamais le modèle, et `tree-canvas` est CONSERVÉ. Corrigée en revue de PR ; le déclencheur réel est le **repointage** de `tree-canvas`, cinq tranches après le Temps 2.)* **Assertion 6 ajoutée**, avec son plancher de non-vacuité. **Pouvoir séparateur mesuré** : la spec de `play-mode` retirée, le test rougit en **nommant chaque entrée orpheline** (`KR-133 -> play-mode`, …) ; remise, vert. La revue écrivait « rien ne le tient mécaniquement » — désormais si.
- **Mineur — la compaction de `KR-133` avait effacé le seul constat** du pointeur cassé `REGLES-PLAY-A-COMPLETER.md § H`, que `combatEngine.ts:3` cite encore. Clause de constat rendue à la spec de `play-mode`.

**Vérifié avec le shell qui manquait au relecteur** : aucune chaîne préexistante de `plan.known_risks` n'a été *remplacée* — les 5 lignes supprimées au diff sont le côté `-` de modifications, et `KR-094` est intact et étendu.

## `RETOUR-COMITÉ`

1. **Un cadrage hors cycle n'a pas de contre-lecture, et ça se voit.** Trois prémisses fausses (le compte des KR manquants, la réductibilité de `KR-113`, le gain de scission), toutes trouvées par l'ouvrier **en mesurant**. La consigne « si un KR que le plan dit réductible ne l'est pas, dis-le, ne le réduis pas sur la foi du plan » a payé une fois sur trois candidats — elle doit rester dans tout brief de tranche hors cycle.
2. **Un amendement de doctrine se calcule sur tous les fichiers qu'il gouverne.** Le plancher a été recommandé sur la foi d'un seul fichier, où il « ne desserrait rien ». Sur l'autre, il multipliait le plafond par 2,5 et annulait deux lots. Personne ne l'avait calculé avant que l'orchestrateur ne le mesure, entre la décision et l'exécution.
3. **Retirer une dette discharge est juste ; ne pas la remplacer quand l'instrument en révèle une autre est une perte silencieuse.** L'ancienne ligne réclamait un instrument, l'instrument existe — mais il a trouvé quatre ids ambigus. Sans ligne de remplacement, cette dette-là n'aurait vécu que dans `bug_history.json`, qui n'est pas la table des dettes armées.
4. **Le couple toujours-chargé est à 14 o de marge.** Toute règle qui veut y entrer doit désormais **en remplacer une** en le disant, et le remplacement se **remesure**. Ce n'est plus une consigne de prudence, c'est arithmétique.

5. **Les chiffres d'un dossier périment dans le lot qui l'écrit.** Six valeurs de cette revue ont dû être corrigées en revue de PR — le couple, le roadmap, la spec, le compte de tests — toutes périmées par **mes propres correctifs**, dans une tranche dont le sujet est l'exactitude des mesures. La règle qui en sort : **un dossier se remesure APRÈS le dernier geste**, jamais pendant. C'est la même famille que la table qui mentait, et elle s'est reproduite deux fois dans la même journée.
