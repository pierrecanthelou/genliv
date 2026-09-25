# Mesures de l'orchestrateur — `moteur-dossier` it4

> Toute affirmation sur la couleur d'un test SE MESURE (skill `raffinage-iteration`, BUG-084/087/113).
> Ce fichier porte les mesures faites par l'orchestrateur lui-même, hors notes de rôle.

## M-1 — Baseline `tree-canvas` + `src/player` (2026-09-24, avant it4)

```
npx jest src/features/tree-canvas src/player --silent
→ Test Suites: 10 passed, 10 total · Tests: 214 passed, 214 total
```

## M-2 — `EditorTopBar.test.tsx` survit-il à la perte de `handlePreview` ?

**Demandé par l'UX, qui l'a explicitement laissé non mesuré (lecture seule).**

```
npx jest src/brain/components/EditorTopBar.test.tsx
→ Test Suites: 1 passed · Tests: 8 passed
```

Lecture du cas litigieux (`EditorTopBar.test.tsx:72-82`) :

```tsx
render(<EditorTopBar title="La Caverne" nodeCount={0} onBack={jest.fn()} onAddNode={jest.fn()} />)
const apercu = screen.getByRole('button', { name: 'Aperçu du jeu' })
expect(apercu).toBeDisabled()
// Mot pour mot le texte d'avant l'élargissement : c'est la moitié « écran Book »
// du critère #5, l'autre vivant dans le test de l'écran dossier.
expect(apercu).toHaveAttribute('title', 'Aperçu du jeu — mode lecture (hors éditeur)')
```

**RÉSULTAT MESURÉ** — le test rend `EditorTopBar` **directement**, sans `previewDisabledReason` et
sans `onPreview`. it4 ne modifie **aucune** de ses entrées : il **RESTE VERT**, et son assertion
reste JUSTE (le défaut de `EditorTopBar.tsx:71` existe toujours, seul son *appelant* disparaît).

**Ce qui devient faux est le COMMENTAIRE l.79-80**, et lui seul : après it4, l'« écran Book » ne
s'appuie plus sur le défaut — il passe `RAISON_APERCU_LIVRE` explicitement. Une justification fausse
dans un test vert ne rougit jamais (même famille que KR-258 / BUG-124).

**Conséquence de découpage** : `src/brain/components/EditorTopBar.test.tsx` doit appartenir à un lot
— celui qui écrit `EditorScreen.tsx` — pour une correction de **commentaire seul**, zéro assertion
touchée. `EditorTopBar.tsx` reste hors de tout lot (D-6 tient).

## M-3 — Budget de contexte (octets en LF, `git show :fichier | wc -c`)

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `src/features/moteur-dossier/specification.json` | 65 263 | 66 560 (65 kio) | **1 297 o** |
| `docs/ROADMAP-BASCULE-IA.md` | 30 184 | 30 720 (30 kio) | 536 o |
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 063 | 46 080 (45 kio) | 17 o |

**Conséquence** : le report d'étape 7 (goal raffiné + `resolved_decisions` + `open_questions`)
franchira presque certainement les 1 297 o restants — 57 `resolved_decisions` déjà présentes. La
**compaction de `moteur-dossier/specification.json` se fait dans le même geste**, jamais au lot
suivant. Idem pour le roadmap si l'amendement du § 0 bis (demandé par le PM) dépasse 536 o.

## M-4 — LA COUPE EN DEUX LOTS EST-ELLE POSSIBLE ? (arbitre PM vs tech-lead)

Le `tech-lead` (tour 1, R5) affirme : « la fermeture est **connexe**, à racine unique
`src/EditorScreen.tsx`, donc **TOUTE** partition en >= 2 lots produit au moins un lot rouge ».
Le `pm-produit` propose exactement une telle partition (4a / 4b). **Les deux ne peuvent pas avoir
raison.** Mesure par experience, pas par raisonnement.

### Protocole

`git worktree add --detach /tmp/wt4a HEAD`, jonction NTFS vers `node_modules`, puis application de
la SEULE coupe 4a : suppression de `PlayerModal.tsx`, `PlayerRuntime.tsx`, `NodeScreen.tsx`,
`ChoiceList.tsx`, `DecorScreen.tsx`, `PnjScreen.tsx`, `TrapScreen.tsx`, et retrait dans
`EditorScreen.tsx` de `buildAdventureDocument`, de l'import `PlayerModal`, du type
`AdventureDocument`, de l'etat `adventure`, de `handlePreview`, de `onPreview` et de `<PlayerModal/>`.
`playExport.ts`, `buildAdventureDocument.ts`, `brain/index.ts`, `sessionEngine`, `usePlaySession`,
`persist`, `types.ts` : **NON TOUCHES** (ils sont le lot 4b).

### Resultat

```
npx tsc --noEmit    ->  exit 0, AUCUNE erreur
```

**LA COUPE 4a COMPILE.** L'affirmation « toute partition >= 2 lots produit un lot rouge » est
**REFUTEE PAR CONTRE-EXEMPLE EXECUTE**.

### Pourquoi le tech-lead se trompe, et ce qu'il fallait dire

Son contre-exemple (« lot F supprime les 5 ecrans -> `PlayerRuntime` casse ») ne vaut que pour LA
PARTITION QU'IL A CHOISIE. La condition reelle n'est pas la connexite, c'est la **cloture vers le
haut** : un lot peut supprimer `B` si tout ce qui importe `B` est supprime dans le MEME lot ou dans
un lot DEJA passe. 4a est clos vers le haut (`PlayerRuntime` <- `PlayerModal` <- `EditorScreen`, les
trois dans 4a ; les 5 ecrans <- `PlayerRuntime`, dans 4a). 4b l'est aussi. La fermeture est
connexe ET partitionnable : **la connexite n'implique pas l'indivisibilite.**

### Ce que la mesure NE dit PAS

Elle ne dit pas que la coupe est souhaitable. Elle dit que le motif « c'est impossible » est faux.
Le vrai argument pour N=1 subsiste, et il est d'un autre ordre : **les deux lots sont strictement
sequentiels** (4b n'a aucun interet a partir avant 4a), donc la coupe **n'achete aucun
parallelisme** — elle achete seulement le fait que le lot `contrat` passe en SECOND, ce qui EST la
derogation qu'on cherchait a eviter. **Conclusion retenue = celle du tech-lead ; motif = le sien
refute, remplace par celui-ci.** (Skill : un refus juste sur un motif faux cede au premier
contradicteur serieux.)

## M-5 — DEFAUT BLOQUANT PREEXISTANT : LA PORTE EST ROUGE DANS TOUT WORKTREE NEUF

Decouvert incidemment pendant M-4, **sans rapport avec it4**, et il bloque l'essaim.

```
Depot principal :  npx jest src/brain/copilote/contexte.test.ts  ->  84 passed
Worktree NEUF de HEAD, PRISTINE (git reset --hard, status vide) :
                   npx jest src/brain/copilote/contexte.test.ts  ->  4 FAILED / 84
```

**Cause mesuree, a l'octet :**

```
src/brain/copilote/contexte/relations.ts
  index git (LF)      : 10 648 o
  copie principale    : 10 648 o   -> premiere ligne : / * * \n        = LF
  worktree neuf       : 10 842 o   -> premiere ligne : / * * \r \n     = CRLF
  (10 842 - 10 648 = 194 = exactement le nombre de lignes)
```

`core.autocrlf=true` : **tout checkout neuf rend du CRLF**. La copie de travail principale, elle,
est en **LF** (ecrite par les outils de session). Or `contexte.test.ts` **lit ses propres sources sur
disque** (`readFileSync` sur `contexte/relations.ts`, `noyau.ts`, `distribution.ts`, `plan.ts`,
`repliques.ts`, `registres.ts`) et y cherche des sous-chaines. Quatre de ces assertions ne
survivent pas au `\r`.

**Consequence directe pour it4** : `dev-lot` / `dev-contrat` travaillent **dans leur propre
worktree** (`.claude/agents/dev-lot.md`), et leur porte locale est `tsc + ESLint + jest`. **L'ouvrier
d'it4 ne peut pas passer sa porte**, quoi qu'il fasse, pour une raison qui n'a rien a voir avec la
demolition. Le meme defaut atteindrait une CI.

**Ce n'est pas it4 qui l'introduit et ce n'est pas it4 qui doit le reparer** — mais it4 ne peut pas
demarrer sans qu'il soit traite. A remonter a l'humain a la porte 2 (voir le plan).

## M-6 — LE DECOMPTE DE `moteurSansIA.test.ts` : TROIS ROLES, TROIS CHIFFRES, UN SEUL JUSTE

Verifie par l'orchestrateur le 2026-09-24 avec la regle exacte du test (`.ts`/`.tsx`, hors `.test.*`,
recursif) :

```
cd src && for r in player features/play-mode brain/dossier; do
  find "$r" -type f \( -name "*.ts" -o -name "*.tsx" \) ! -name "*.test.ts" ! -name "*.test.tsx" | wc -l
done
  -> player 23 · features/play-mode 9 · brain/dossier 26   = 58
```

| Source | `player` | `play-mode` | `brain/dossier` | Total post-it4 | Verdict |
|---|---:|---:|---:|---:|---|
| docstring du fichier (l. 39) | — | — | — | 47 | **deja fausse AUJOURD'HUI** (58 mesures) |
| `tech-lead` M6 | 14 | 8 | **15** | 37 | **FAUX** — il decompte `brain/dossier`, or **aucun** fichier de sa propre liste de 22 n'est sous `brain/dossier/` |
| `qa` A.4 | **13** | 8 | 26 | 47 | **FAUX** — 14 survivants, enumerables |
| `narratif-ia` tour 2 | **14** | **8** | **26** | **48** | **JUSTE** |

`src/player` : 23 − 9 supprimes (`PlayerRuntime`, les 5 ecrans, `sessionEngine.ts`,
`usePlaySession.ts`, `persist.ts`) = **14**. `play-mode` : 9 − 1 (`PlayerModal.tsx`) = **8**.
`brain/dossier` : **26, inchange**.

**Consequence, et elle renverse un argument** : le total post-it4 est **48**, pas 47. **La
coincidence que la QA redoutait n'a pas lieu** — mais le defaut est PIRE : la docstring devient
fausse **d'une seule unite**, l'ecart qu'une relecture humaine ne rattrape jamais. L'argument de la
QA (corriger dans it4) **survit a la correction de son propre chiffre** ; l'argument du tech-lead
(« ne pas toucher ») **perd son seul appui**, qui etait que le retrecissement se verrait.

## M-7 — MECANISME EXACT DE M-5, trouve par le `narratif-ia`

`src/brain/copilote/contexte.test.ts:1745` :

```ts
return source.slice(debut, source.indexOf('\n\n', debut))
```

Sous CRLF le separateur de paragraphe sur disque est `\r\n\r\n` : **`indexOf('\n\n')` rend `-1`**, et
`slice(debut, -1)` rend **tout le reste du fichier moins un caractere**. Le balayage ne scanne alors
plus une declaration mais la quasi-totalite de `relations.ts`.

**Ce que ca ajoute a M-5** : le defaut n'est pas « 4 tests rouges », c'est **un instrument dont la
BASE change selon le checkout**. Qu'il rougisse ici est une chance, pas une propriete — la moitie de
ces assertions sont des `toContain` POSITIFS, qui **VERDISSENT** quand la base s'etend. Le meme
defaut, sur une assertion positive, serait **invisible**.

**Immunite mesuree par les roles, a confirmer par le run de C8** : `moteurSansIA.test.ts` est
immunise (motifs intra-ligne `/\bfetch\s*\(/`, `/CopiloteService/`, `/\/ia\//` ; perimetre par
`readdirSync`, pas par `slice`). `outcomeBlock.test.tsx` parait immunise (lecture UX : 4 aiguilles,
toutes mono-ligne). **La regle de forme qui se degage : un balayage de source a aiguilles MONO-LIGNE
survit au CRLF ; un decoupage par `indexOf('\n\n')` ou toute aiguille MULTI-LIGNE n'y survit pas.**

## M-8 — LE « SECOND FICHIER ATTEINT » DU TECH-LEAD N'EXISTE PAS

Le `tech-lead` (tour 2, R7) annonce un second fichier atteint par le defaut CRLF, « releve au tour 2
et non nomme par le comite » : `worker/frontiere.test.ts:105`, motif
`/^\t'([a-z-]+)': '(.+)',$/gm` — « `,$` ne matche pas devant un `\r`, `extraire()` rend une Map vide ».
Il declare lui-meme n'avoir **execute aucune commande** (aucun outil shell dans sa session) et ne pas
signer la phrase « apres correctif, la porte est verte ». Bien lui en a pris.

**MESURE 1 — la suite tourne bien dans la porte.** `jest.config` l. 14 :
`testMatch: ['<rootDir>/src/**/*.test.{ts,tsx}', '<rootDir>/worker/**/*.test.ts']`, et
`npx jest --listTests` rend `worker/frontiere.test.ts`. Elle n'est donc pas hors perimetre.

**MESURE 2 — elle PASSE en worktree CRLF.** Le run complet de M-4, fait dans le worktree neuf, rend
`Test Suites: 1 failed, 120 passed` — l'unique suite rouge est `contexte.test.ts`.
`frontiere.test.ts` est parmi les 120 vertes.

**MESURE 3 — pourquoi, a la semantique :**

```
node -e "const re=/^\t'([a-z-]+)': '(.+)',$/gm; ..."
  LF   -> 2 correspondances
  CRLF -> 2 correspondances
```

**En ECMAScript, `LineTerminator` = <LF>, <CR>, <LS>, <PS>.** En mode `m`, `$` matche donc AUSSI
devant un `\r`, pas seulement devant un `\n`. `,$` est satisfait : la virgule est suivie de la
position d'avant-`\r`, qui est une fin de ligne valide. Le raisonnement du tech-lead transposait la
semantique POSIX de `$` a JavaScript.

**Ce que ca change, et ce que ca ne change pas.** La **conclusion** R7 (veto de demarrage) **TIENT** :
`contexte.test.ts` seul suffit a rendre la porte rouge dans tout worktree neuf, et un ouvrier ne peut
pas rendre. Ce qui tombe, c'est **l'argument de generalite** : la classe n'est pas demontree ouverte
sur deux fichiers, elle est mesuree sur **UN**. Le perimetre de la tranche `eol-lf` doit donc etre
**mesure par un run complet en worktree neuf**, jamais derive d'un releve statique — c'est d'ailleurs
la recette que le tech-lead ecrit lui-meme au § 1.5, et elle reste la bonne.

**Ce qui survit de son releve, et qui est utile** : les **6 rustines ad hoc** deja presentes
(`atteignabilite.test.ts:38`, `controles.test.ts:45/1121/2298`, `evaluate.test.ts:44`,
`tourzero.test.ts:36` — toutes `.replace(/\r\n/g, '\n')`) montrent que la classe a ete rencontree et
rustinee **cinq fois localement** sans etre fermee. Cet argument-la ne depend d'aucune semantique de
regex, et il suffit a motiver `.gitattributes`.

**Regle de forme corrigee** (M-7 disait « toute aiguille multi-ligne n'y survit pas ») : ce qui ne
survit pas au CRLF est un **`indexOf`/`split` sur un litteral `\n\n` ou `\n` compte a l'octet**. Un
`$` ancre en mode `m`, lui, **survit** — contrairement a ce que M-7 et le tech-lead ecrivaient.
