# Revue de clôture — `moteur-interprete` · itération 2

> Plan : `.claude/raffinage/moteur-interprete-it2.plan.md` (validé 2026-09-29)
> Exécution : séquentielle, 2 lots (`dev-contrat` puis `dev-lot`), aucun worktree
> Vérification : QA mode B (essaim) + revue tech-lead (PR, WORKFLOW.md étape 6) — **3 passages** : `REQUEST CHANGES` (M1-M7) → correctifs → `REQUEST CHANGES` (N1 régression, N2 test non discriminant) → correctifs
> Porte qualité finale : `npx tsc --noEmit` vert · `npm run lint` vert (1 avertissement préexistant sans lien) · `npx jest` 123 suites / 2003 tests, tous verts

## En une ligne

Le joueur peut désormais écrire une action libre qui ne vise aucun déplacement (« il agit sur place ») et lire, après coup, un court récit de ce que son geste (déplacement ou action) a produit — le tout sans qu'aucune donnée ne soit inventée, retenue d'un tour à l'autre, ou attribuée à une entité non ancrée dans l'état déjà écrit.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | `agir` atteignable, invite `interprete` amendée | **VÉRIFIÉ** | `commandes.test.ts` (label figé, arité 0) |
| 2 | `agir` n'altère pas `session.monde` (même référence), horloge +1, 2 entrées journal | **VÉRIFIÉ** | `commandes.test.ts` — `toBe` sur `monde` |
| 3 | R3 appelé après persistance, dans le même verrou, sans état | **VÉRIFIÉ** | `useTourDeJeu.test.ts` (session `toBe`, ordre des appels) + `contexte.test.ts` (contexte identique pas 2/pas 40) |
| 4 | Sortie invalide / contexte trop long → pas acquis, `recit` absent, bannière fixe | **VÉRIFIÉ** | `contexte.test.ts` (refus `trop-long` avant `fetch`), `schemaSortie.test.ts`, `useTourDeJeu.test.ts` (R3 `indisponible`/`refuse`) |
| 5 | Récit dans `OutcomeBlock entete="RÉCIT"`, suggestions texte simple non interactif | **VÉRIFIÉ** | `PlayerInputBar.test.tsx`, assertion stricte sur le nombre d'éléments et l'absence de `role="button"` |
| 6 | Console refusée pendant le vol, `soumettre()` corrige la fermeture périmée | **VÉRIFIÉ (composant réel, discriminant)** | `verrouDeTour.test.tsx` — `EcranPartie` monté via `BrainProvider`, destination console RÉELLE (`lieu.tour-effondree`, réussirait sans verrou), refus visible pendant R1 ET R3 avec re-query après remontage (`key={horloge.tour}`), journal inchangé, récit affiché après résolution ; TROIS mutants vérifiés rouges à la main (garde retirée, verrou relâché avant R3, régression N1 sur un refus de syntaxe hors verrou) |
| 7 | Motif `.demander(` dans la garde KR-260, preuve de discriminance | **VÉRIFIÉ** | `moteurSansIA.test.ts`, paire de témoins (vrai sur appel réel, faux sur simple déclaration) |
| 8 | `interdits` dérivée de `COMMANDES`, jamais recopiée | **VÉRIFIÉ** | `worker/index.test.ts` |

**8/8 critères vérifiés — le critère 6 ne l'était PAS complètement au premier passage (voir § Revue tech-lead ci-dessous).**

## Diff par lot (conforme au § 5 du plan)

- **Lot 1** `narrateur-contrat` — 20 fichiers (16 modifiés + 4 nouveaux : `recit.ts`, `recit.test.ts`, `contexte/narrateur.ts`). Correspond exactement à la liste du plan.
- **Lot 2** `narrateur-feature` — 7 fichiers (6 modifiés + `verrouDeTour.test.tsx` nouveau, réécrit au second passage). Correspond exactement à la liste du plan.
- Artefacts légitimes hors lots : `src/features/moteur-interprete/specification.json`, `code-knowledge.json`, `bug_history.json`, `bug_history.features-terminees.json`, `docs/ROADMAP-BASCULE-IA.md`, `docs/WORKFLOW.md`, `CHANGELOG.md`, `.claude/raffinage/moteur-interprete-it2.plan.md` + les 10 notes de tour 1/2.
- **Aucun fichier touché hors de ces listes.**

## Ce qui a été refusé (REJETÉ du registre)

- **`PropositionNarrateur.etablis` posé dès it2**, validé mais jamais lu (tech-lead, tour 1) — retiré par son auteur lui-même au tour 2 : l'argument « stabilité tsc future » était faux (mesuré : le mock narrateur n'est pas typé). Généralisé en **KR-268 nouveau**.
- **Récit affiché via `avis.type === 'recit'`** dans l'état du hook (UX, tour 1) — rejeté par tech-lead + narratif-ia : un miroir d'état est exactement la classe de défaut de BUG-131 (KR-013, it1). Le récit reste dérivé de `session.journal`.
- **Nouveaux fichiers de test dédiés** (`moteurSansIA.extension.test.ts`, `validerNarrateur.test.ts`) proposés par QA — rejetés par tech-lead : une garde/un validateur vit dans un seul fichier déjà existant.
- **Projection d'`EtatMonde` passée en paramètre explicite à R3** — rejetée par son propre auteur (tech-lead) : seconde source de vérité (KR-013).

## Ce qui a été reporté

- **`faits_etablis`/`etablis`** et le critère #7 de la spec (« fait sans rang refusé ») → **it3**, avec la forme définitive de `memoire`.
- **`Chip` cliquable** (clic-remplit-et-soumet) → **it3** ; `suggestions[]` reste affiché en it2, en lecture seule. Le contrat visuel complet est déjà écrit (plan § 3 annexe B) pour ne pas être rejoué. `soumettre(texte)` (le point d'entrée unique promis) EST livré en it2 — c'est bien lui que `Chip.onSelect` réutilisera.
- **Dette hors périmètre des deux lots** (désaccords #19/#20, trouvés par `dev-contrat`, non corrigés car hors liste de fichiers de cette itération) :
  - `ConsoleCommandes.tsx` — `TEXTE_IMPASSE` potentiellement inexact maintenant qu'`agir` est toujours satisfiable ; la revue tech-lead (m9) précise que le formulaire console entier se masque en impasse, rendant `agir` injouable au clavier dans ce cas — dette plus large que le seul texte ;
  - `src/brain/copilote/contexte/interprete.ts` — docstrings périmées ;
  - `charpente.fins[].texte` du dossier de référence tutoie, alors que R1/R3 vouvoient.

## Revue tech-lead (PR) — trois passages, `APPROVE` final

**Passage 3, observations non bloquantes acceptées telles quelles (à ne PAS rouvrir pour ça)** :
- Le refus de verrou (`TEXTE_REFUS_CONSOLE_EN_COURS`) reste en mémoire dans `refus` après démasquage — il peut réapparaître visuellement au pas libre SUIVANT si celui-ci reverrouille avant que la console n'ait été retouchée. Pas une régression (avant m1, le message restait affiché en permanence) : reporté en dette pour it3, qui rouvre `EcranPartie`/`PlayerInputBar` pour `Chip` de toute façon.
- La preuve que le refus reste visible PENDANT R3 (et non seulement qu'il l'était déjà depuis R1) repose sur une seule garde qui couvre les deux phases — aucun mutant réaliste ne les sépare, la formulation « visible pendant R1 ET R3 » en dit un peu plus que ce que le test isole seul. Le journal inchangé (preuve indépendante) reste la discrimination réelle de la phase R3.

## Revue tech-lead (PR) — deux premiers passages (détail)

**Passage 1 : `REQUEST CHANGES`**, 7 majeurs (M1–M7) + 9 mineurs. Le plus substantiel : **M1**, le verrou console n'était prouvé qu'au niveau du hook (`useTourDeJeu`) — `EcranPartie.tsx` (le câblage réel `handleSoumettreConsole` → `pasEnCours()`) n'était exercé par aucun test, donc supprimable sans rien faire rougir. Un premier correctif (dev-lot) a remplacé le test par une version « plus propre » du MÊME test de hook, sans toucher `EcranPartie` — l'orchestrateur l'a rejoué, constaté que le défaut original n'était pas fermé, et réécrit lui-même `verrouDeTour.test.tsx` en test de composant réel (`createBrain()` + `BrainProvider` + `EcranPartie`, précédent `jalonAuJournal.test.tsx`, service `copilote` substitué après coup plutôt que `fetch` mocké), avec le mutant vérifié à la main (garde retirée de `EcranPartie.tsx`, test rougi, garde restaurée).

Les six autres majeurs, tous corrigés au second passage :
- **M2** — `soumettre(texte)` (point d'entrée unique promis au plan) livré, avec tests du vidage de champ selon `executeAction`.
- **M3** — orchestration R3 étendue aux chemins d'échec (`indisponible`, `refuse`), assertion d'identité de session en `toBe`, ordre des appels vérifié.
- **M4** — commentaires de code (`useTourDeJeu.ts`, `PlayerInputBar.tsx`) corrigés de BUG-131 vers BUG-132.
- **M5** — fidélité de `specification.json` restaurée : `design_reference` (5 chemins ouverts, pas 3), `goal` d'it2 (BUG-132 rattaché au bon composant), `design_contract.degradation` (texte « ce tour-ci » encore présent, corrigé), `open_questions` (liste des 11 chemins retirée — résolue, documentée dans `narrateur.ts` — playtest KR-262 ajouté explicitement).
- **M6** — entrée CHANGELOG `0.7.7` ajoutée.
- **M7** — budget de contexte compacté dans ce lot (détail ci-dessous), pas reporté.

Mineurs corrigés au second passage : refus console qui ne s'effaçait pas au déverrouillage (m1), fixtures de forme fautive dans `useTourDeJeu.test.ts` (m2), suggestions sans condition de tour (m3), docstrings périmées (m5), preuve de discriminance du motif `.demander(` (m6), assertion trop lâche sur le nombre de suggestions (m7).

**Passage 3 : `REQUEST CHANGES`**, 2 majeurs restants (N1, N2) — le correctif de m1 avait lui-même introduit une régression, et le test réécrit pour M1 ne discriminait pas réellement la phase R3.

- **N1 (régression)** — le correctif de m1 (`useEffect(() => { if (!isLocked && refus !== null) setRefus(null) }, [isLocked, refus])`) effaçait **tout** refus console dès que le verrou se relâchait, y compris une erreur de syntaxe ou de destination posée hors verrou — plus aucune erreur console n'aurait jamais été visible en production. C'est aussi, à la lettre, l'anti-patron KR-013/113 (état dérivé via `useEffect`) que le projet interdit. Corrigé par un calcul EN LIGNE : `refusAffiche = refus === TEXTE_REFUS_CONSOLE_EN_COURS && !isLocked ? null : refus` — seul le texte de verrou s'efface au déverrouillage. Journalisé **BUG-133**.
- **N2 (test non discriminant)** — le scénario R3 de `verrouDeTour.test.tsx` utilisait une destination console INVENTÉE (`quelque_part`), refusée par le moteur QUEL QUE SOIT L'ÉTAT DU VERROU : « journal inchangé » ne prouvait donc rien. Remplacé par une destination RÉELLE (`lieu.tour-effondree`, accessible depuis le départ, jamais déplacée par `agir`) qui RÉUSSIRAIT sans le verrou — et re-interrogation du DOM après le remontage de `ConsoleCommandes` (`key={session.horloge.tour}` change quand `agir` avance l'horloge).
- **Trois mutants vérifiés à la main** après ces corrections : (1) retirer la garde de `EcranPartie.tsx` → rouge sur R1 ; (2) relâcher le verrou juste après R1 (avant l'appel R3) → rouge SPÉCIFIQUEMENT sur la phase R3, prouvant que le test discrimine désormais l'extension du verrou à R3 ; (3) réintroduire l'ancien `useEffect` (N1) → rouge sur le nouveau test dédié « un refus de syntaxe hors verrou reste visible ».

Mineurs supplémentaires corrigés au troisième passage : preuve de discriminance de `moteurSansIA.test.ts` qui recopiait le motif au lieu de le lire depuis `MOTIFS_INTERDITS` (m-a) ; incohérence « 3 chemins » persistante dans `specification.json` § KR-261 (m-b) ; `regression_test` de BUG-132 repointé vers les tests réels de `PlayerInputBar.test.tsx` (m-c) ; docstring `@returns` de `useTourDeJeu.ts` complétée ; référence obsolète « QUATRE fichiers » corrigée dans le `_about` de `bug_history.features-terminees.json` ; date de re-mesure du budget mise à jour dans `WORKFLOW.md`.

## Écarts assumés et corrections faites en cours d'itération

1. **`TEXTE_RECIT_INDISPONIBLE` corrigé avant le Lot 2** — violait `docs/REGLES-PLAY.md` § J1 (mot « tour » interdit). Trouvé par `dev-contrat` en auto-relecture. Corrigé en `'Le récit n'a pas pu être généré.'`.
2. **Régression trouvée après la livraison du Lot 2, avant la première revue tech-lead** — fixtures `Lieu.acces` de forme fautive (`[{geste,cible,description_acces}]` au lieu de `string[]`), 4 tests en échec silencieux malgré un rapport `dev-lot` affirmant à tort « jest OK ». Corrigée en rejouant réellement `jest`.
3. **`BUG-132` journalisé dans `bug_history.json`**, distinct de BUG-131 (confondus une fois pendant le raffinage, corrigé partout).
4. **Aucun test automatisé** ne vérifie qu'un récit d'`agir` réel « ne lit pas comme un texte générique » (KR-262 restreint à R1) — vérification manuelle, **NON EXÉCUTÉE dans cette session** (nécessiterait un appel réel au worker/modèle). Ajouté explicitement à `implementation.open_questions` de la spec.

## Porte qualité (mesurée au troisième passage)

- `npm run format` / `npx tsc --noEmit` / `npm run lint` : verts
- `npx jest` (suite complète) : **123 suites / 2003 tests, tous verts** — rejoué à quatre reprises (après M1-M7, après compaction du budget, après N1/N2, avant remise à l'utilisateur)
- `npm run test:mutation` : **non déclenché** — aucun des 4 fichiers de règles de jeu n'est touché

Note annexe : `panneauPersonnages.test.tsx` (dossier-fiches) reste flaky sous charge (BUG-128, connu, non corrigé, hors périmètre) — n'est jamais réapparu sur les runs de ce second passage.

## Budget de contexte — compacté dans ce lot (M7)

- **`bug_history.json`** : 18 548 o (au-dessus de 15 360) → **12 773 o** après scission. Axe appliqué : le `_about` du fichier exige qu'une entrée dont la leçon est déjà promue dans un instrument en lecture obligatoire parte à l'archive. **BUG-122** (discriminance de motif, promue dans `commandes.test.ts`), **BUG-123** (numérotation globale, promue dans `codeKnowledge.test.ts` assertion 5) et **BUG-127** (fins de ligne, promue dans `.gitattributes`) déplacées vers `bug_history.features-terminees.json` (leurs tranches d'origine — outillage, budget-de-contexte, eol-lf — sont closes, aucun travail en cours ne les relit). **BUG-124/BUG-125 NE SONT PAS déplacées** : le `_about` de `bug_history.moteur-dossier.json` précise explicitement qu'une scission antérieure (2026-09-24) les a délibérément gardées dans le fichier vivant — pas la place de cette itération pour rouvrir ce jugement. Nouveau plancher : BUG-128 (2 080 o), plafond inchangé (15 kio, la formule re-dérivée retombe exactement sur le même palier).
- **`code-knowledge.json`** : 73 244 o (au-dessus de 71 680) → **70 622 o**. Six KR de `dossier-format` (feature TERMINÉE, § `_about` : « une entrée qui recopie une règle déjà promue se réduit à son invariant portable ») compactés — KR-170/171/173/174/175/176, narrative réduite, invariant portable gardé, renvoi `Corps : spec dossier-format` ajouté (vérifié par `codeKnowledge.test.ts`). **KR-231/232/235/236 (`dossier-copilote`) délibérément NON touchés** : ce sont les contrats que `moteur-interprete` (travail en cours) vient de consommer pour construire R3 — les compacter aurait retiré exactement la doctrine que ce lot applique. Plafond re-dérivé : inchangé (70 kio).
- `src/features/moteur-interprete/specification.json` : 38 317 o — sous son plafond (65 kio).
- `docs/ROADMAP-BASCULE-IA.md` : 30 134 o — sous son plafond (30 kio), marge 586 o.
- Couple `CLAUDE.md` + `docs/WORKFLOW.md` : 46 051 o, inchangé malgré les deux lignes de table éditées (nombres de longueur équivalente) — marge 29 o, toujours à saturation.

## RETOUR-COMITÉ

- **Le découpage en 2 lots séquentiels (sans worktree) a bien fonctionné**, y compris pour absorber un second passage de correctifs sans worktree ni fusion. À reconduire pour it3/it4 tant que le nombre de lots reste ≤ 2.
- **Un rapport d'agent affirmant une couleur de test doit toujours être rejoué, jamais cru — y compris le rapport d'un agent chargé de CORRIGER un défaut déjà signalé.** Le premier correctif de M1 a changé le test sans fermer le défaut que la revue tech-lead décrivait, et son propre rapport affirmait « même couverture, plus robuste » — affirmation fausse, qu'un rejeu (pas une lecture du rapport) a suffi à réfuter. La skill `raffinage-iteration` porte déjà cette règle pour le raffinage ; elle s'applique identiquement à la correction d'une revue de PR.
- **Un correctif écrit pour fermer un défaut de revue peut lui-même introduire une régression — et une revue de PR sans outils d'exécution (Read/Grep/Glob seuls) peut quand même l'attraper par lecture pure.** N1 a été trouvé sans qu'aucun test ne soit lancé, par la seule sémantique de React (`useEffect` sur un state partagé efface tout ce qui y passe). Le second correctif de test (N2) a lui-même dû être vérifié par TROIS mutants distincts avant d'être accepté comme réellement discriminant — un test qui « passe » après une correction n'est une preuve que si on a d'abord vu la version fautive le faire échouer.
- **Une revue tech-lead qui exige un test de composant réel (pas seulement un test de hook) doit être vérifiée sur le FICHIER RENDU, pas sur la description du correctif** — le hook seul ne peut jamais prouver qu'un composant CONSOMME correctement ce qu'il expose.
- **Le budget de contexte peut demander un vrai travail d'archéologie** (relire des `_about` de fichiers frères, découvrir une décision antérieure délibérée) plutôt qu'un simple déplacement mécanique — la validation utilisateur préalable sur « faire la compaction maintenant » a été la bonne décision : la version rapide (« dérogation ») aurait laissé le franchissement s'accumuler sans qu'aucune session n'ait plus le contexte pour le traiter proprement.
- **Un numéro de bug cité par analogie pendant le raffinage (« même famille que BUG-131 ») peut se figer à tort en référence littérale** dans le plan puis dans le code livré, jusque dans un commentaire de PRODUCTION. À vérifier systématiquement : tout `BUG-xxx` cité pour un défaut NOUVEAU se confronte à `bug_history.json` avant l'essaim.
