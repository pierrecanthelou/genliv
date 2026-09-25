# Ce que le tour 2 doit trancher — `moteur-dossier` it4

Lire d'abord, dans ce répertoire : `CADRAGE.md`, les cinq `tour1-<rôle>.md`, et
**`MESURES-ORCHESTRATEUR.md`** (M-1 à M-5, faites par l'orchestrateur, dont deux qui changent la
donne).

Le tour 1 a produit **beaucoup de mesures concordantes** et **huit désaccords réels**. Chacun doit
sortir du tour 2 avec un statut. Les rôles ne se répondent pas en général : chacun répond **nommément**
à au moins une objection qui empiète sur son domaine, puis statue sur **chacune de ses propres
objections** — retirée (motif) / maintenue / durcie en veto.

---

## C1 — Le découpage : 4a/4b (PM) contre un lot unique (tech-lead)

- Le **PM** propose deux itérations, motif : dans it4 monolithique le lot `contrat` ne peut pas être
  premier, donc l'itération demande une **seconde dérogation**. Il s'est **engagé à retirer** sa
  proposition « si le tech-lead démontre que 4a et 4b sont exécutables en deux lots séquentiels dans
  une seule itération sans seconde dérogation ».
- Le **tech-lead** répond : **un lot unique**, marqué `contrat`. À N=1 la règle « seul et en premier »
  est vraie **par vacuité**, aucune dérogation. Son motif : « la fermeture est connexe, donc TOUTE
  partition ≥ 2 lots produit un lot rouge ».
- **L'orchestrateur a mesuré (M-4) : ce motif est FAUX.** La coupe 4a compile — `tsc --noEmit` exit 0,
  expérience exécutée en worktree. La condition réelle n'est pas la connexité mais la **clôture vers
  le haut**. **La conclusion N=1 tient sur un AUTRE motif** : les deux lots sont strictement
  séquentiels, donc la coupe n'achète **aucun parallélisme** — elle achète seulement le passage du
  lot `contrat` en second, c'est-à-dire la dérogation même qu'on voulait éviter.
- **À statuer** : PM, votre engagement de retrait est-il déclenché ? Tech-lead, acceptez-vous la
  substitution de motif ? Un plan qui garde le motif réfuté est un refus juste sur une prémisse
  fausse — il cède au premier contradicteur (BUG-080).

## C2 — `actionEngine.ts` : la QA a chiffré son delta sur une prémisse que le tech-lead a réfutée

- **tech-lead M3** : `rg` de 9 motifs d'arbre sur `actionEngine.ts` → **0 match sur 346 lignes**. Le
  fichier **n'entre dans aucun lot**, il survit intact et perd ses 5 consommateurs.
- **QA A.1** : delta chiffré `214 → 125`, en comptant `actionEngine.test.ts` (**57 tests**) parmi les
  suites qui meurent.
- Les deux ne peuvent pas être vrais. Si `actionEngine.ts` survit, `actionEngine.test.ts` survit.
- **À statuer (QA, en priorité)** : recalculer le delta **exact**. L'orchestrateur avance
  `src/player` 177 → **145** (suites 7 → 5, mortes : `sessionEngine.test.ts` 24 + `persist.test.ts` 8),
  total `tree-canvas`+`player` **214 → 182**, suites **10 → 8** — **à confirmer ou corriger par
  mesure**, c'est la valeur qui servira de critère pass/fail.

## C3 — Le témoin neuf du critère 10 : le livrer, le repointer, ou l'abandonner

- **tech-lead** : le livre en fichier 22 (`play-mode/tests/extinctionArbre.test.ts`), avec mutant
  obligatoire dans le lot.
- **QA** : **vert par construction, mesuré** (0 occurrence aujourd'hui, avant toute démolition),
  strictement plus faible que `tsc` et que la résolution de modules de jest. Recommande l'abandon,
  ou le repointage en **garde de frontière** (C.3 de sa note).
- **À statuer** : un seul sort. Si on le garde, sous quelle forme exacte et avec quel mutant écrit.

## C4 — « La suite `tree-canvas` reste verte » : par lot ou à la fusion ?

- **QA** : mesuré **rouge sur 4 suppressions simulées** — `TreeCanvas.test.tsx:4` importe `App`, qui
  charge `EditorScreen` → `PlayerModal` → `PlayerRuntime` → les 5 écrans ; `nodeView.ts` charge le
  baril qui ré-exporte `playExport`. Donc critère **de fusion**, jamais de lot isolé.
- **Observation de l'orchestrateur** : si C1 se règle en **N=1**, cette objection **se dissout** — le
  lot unique EST la fusion. À confirmer par la QA, et à écrire, sinon la revue croira à une
  contradiction.
- Conséquence produit relevée par la QA : la suite ne repasse au vert **que si `EditorScreen.tsx`
  cesse de rendre `PlayerModal`**. C'est ce que mesure le vert.

## C5 — Combien de modules hors liste dans `docs/EXIGENCE-APERCU-DU-JEU.md` ? (trois chiffres différents)

- **Cadrage (orchestrateur)** : 2 modules (`types`, `creatureTypes`) — **reconnu incomplet**.
- **QA** : **3** modules — ajoute `monsterCapacities` (absent de la l. 9, **mais présent en l. 49 :
  les deux listes du même document se contredisent déjà**).
- **narratif-ia** : 3 modules aussi, et précise **6 fichiers non-test survivants** important
  `brain/types.ts` (le cadrage en annonçait 4).
- **À statuer** : un seul jeu de chiffres, et la phrase exacte qui entre dans le document. Le
  `narratif-ia` a écrit un remplacement intégral de la l. 9 et de la fin de la l. 49 — les valider,
  les corriger, ou les rejeter.

## C6 — `PE_PER_TRANSITION` et `defaultSessionFields` : deux règles du jeu qui perdent leur implémentation

- **narratif-ia, mesuré** : `PE_PER_TRANSITION = 5` **EST** `REGLES-DU-JEU.md:43` ; `defaultSessionFields`
  **EST** `REGLES-PLAY.md` B3. Après it4 : **zéro implémentation dans `src/`**. Panne **muette** —
  `tsc` vert, aucune suite rouge. Demande un **bandeau au § A de `REGLES-PLAY.md`** nommant le
  propriétaire (n° 11) et le successeur (`commande.aller`, du code).
- **tech-lead** : sa liste de 22 fichiers **ne contient pas `docs/REGLES-PLAY.md`**, et il décrit
  `defaultSessionFields` comme mourant « par domicile », sans mentionner qu'il porte une règle.
- **À statuer** : `docs/REGLES-PLAY.md` entre-t-il au lot ? C'est la seule question du tour 2 où
  l'enjeu est une **règle du jeu perdue en silence** (KR-130), pas une question de découpage.

## C7 — `moteurSansIA.test.ts` : trois rôles, trois gestes incompatibles

- **tech-lead R4** : **ne pas y toucher** (hors périmètre du lot, « petit refactor à côté » interdit) ;
  consigner pour le geste de doc.
- **QA C.6** : corriger la docstring **dans it4** (elle est **déjà fausse aujourd'hui** : 58 mesurés
  contre 47 annoncés), et exiger une mesure **datée et ventilée par racine** — sinon elle redeviendra
  « 47 » **par coïncidence** après démolition, sur une composition entièrement différente.
- **narratif-ia** : aller plus loin — `PLANCHER_PAR_RACINE` au lieu du plancher global de 20, qui
  tolère une perte silencieuse de 65 %.
- **À statuer** : un seul geste. Noter que « ne pas toucher » a un coût mesuré ici (le piège de la
  coïncidence à 47), et que « durcir le plancher » fait entrer un fichier de test de plus au lot.

## C8 — NOUVEAU, découvert par l'orchestrateur : la porte est ROUGE dans tout worktree neuf (M-5)

Mesuré : `src/brain/copilote/contexte.test.ts` rend **84 passed** dans la copie de travail principale
et **4 FAILED / 84** dans un worktree **neuf et pristine** de HEAD. Cause à l'octet : `core.autocrlf=true`
rend du **CRLF** à tout checkout neuf, la copie principale est en **LF**, et ce test **lit ses propres
sources sur disque** (`readFileSync` sur `contexte/relations.ts` et cinq autres) pour y chercher des
sous-chaînes. Quatre assertions ne survivent pas au `\r`.

**Conséquence** : `dev-lot` / `dev-contrat` travaillent **dans leur propre worktree** et leur porte
locale est `tsc + ESLint + jest`. **L'ouvrier d'it4 ne peut pas passer sa porte**, pour une raison
sans aucun rapport avec la démolition. Ce n'est **pas** it4 qui l'introduit.

**À statuer (tech-lead et QA en priorité)** : it4 peut-elle démarrer ? Est-ce (a) un prérequis
bloquant à traiter avant tout lot, (b) une tranche hors cycle comme `outillage-2`, (c) quelque chose
qu'it4 absorbe ? Et : y a-t-il **d'autres** tests du dépôt qui lisent leurs sources sur disque et
seraient atteints par le même défaut ? (`lintIsolation.test.ts`, `moteurSansIA.test.ts`,
`codeKnowledge.test.ts`, `outcomeBlock.test.tsx` en sont candidats — **à mesurer, pas à supposer**.)

---

## Rappels de forme

- Le plan final ne peut porter que **1 à 4 lots** et **8 critères au plus**.
- Tout `REJETÉ` écrit en annexe au tour 1 sera recopié au § 8 du plan : si vous en retirez un,
  **dites-le explicitement**, sinon il y entrera tel quel.
- Au plus **une** proposition `INNOVATION` pour toute l'itération. Aucun rôle n'en a déposé au tour 1 :
  si vous en voulez une, c'est maintenant, et elle doit nommer la règle qu'elle infléchit, son coût,
  et ce qu'on perd sans elle.
- Une affirmation sur la couleur d'un test **se mesure**. Le tour 1 a produit trois affirmations
  fausses ou incomplètes sur ce registre (le motif de connexité, le delta de tests, le compte des
  modules hors liste) : ne pas en ajouter une quatrième.
