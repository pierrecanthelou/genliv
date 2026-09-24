# Revue — tranche hors cycle `eol-lf` (roadmap § 2 bis, B4) — `0.7.4`

> Comité : **tech-lead seul** (précédents `B2 outillage-2`, `B3 budget-de-contexte`). Pas de
> `/cadrer`, pas de `/raffiner` : le périmètre est écrit ici.
> Livrée le **2026-09-24**. **Un fichier créé, zéro ligne de production ou de test modifiée.**

## 1 — Ce qui a été fait, et pourquoi c'était bloquant

`.gitattributes` à la racine, portant `* text=auto eol=lf`.

La tranche est née **du raffinage de `moteur-dossier` it4**, qui ne pouvait pas démarrer. Mesuré
pendant l'étude du découpage : la porte qualité était **verte dans la copie de travail principale**
et **rouge dans tout worktree neuf**. Or `dev-lot` / `dev-contrat` travaillent **chacun dans leur
propre worktree**, et leur porte locale est `tsc + ESLint + jest`. **Aucun lot ne pouvait rendre**,
pour une raison entièrement étrangère au lot.

## 2 — La mesure, avant

```
Copie de travail principale :  npx jest  →  121 suites / 1870 tests  VERTS
Worktree NEUF et pristine de HEAD :       →  1 suite ROUGE / 121, 4 tests / 1870
                                             (src/brain/copilote/contexte.test.ts)
  npx tsc --noEmit  → exit 0        eslint → exit 0 (1 warning préexistant)
```

Cause, à l'octet :

```
src/brain/copilote/contexte/relations.ts
  index git (LF)   : 10 648 o      copie principale : 10 648 o   → / * * \n
  worktree neuf    : 10 842 o                                    → / * * \r \n
  (10 842 − 10 648 = 194 = exactement le nombre de lignes)
```

Cause, à la ligne — `contexte.test.ts:1745` :

```ts
return source.slice(debut, source.indexOf('\n\n', debut))
```

Un séparateur de paragraphe CRLF s'écrit `\r\n\r\n` et **ne contient aucun `\n\n`**. `indexOf` rend
`-1`, `slice(debut, -1)` avale tout le reste du fichier, et le balayage cesse de mesurer une
déclaration pour mesurer le fichier entier — `Expected length: 4 / Received length: 40`. Les quatre
`it` qui consomment ce découpage (l. 1768, 1782, 1799, 2138) sont **exactement** les quatre échecs.

**L'ampleur est petite ; la nature ne l'est pas.** 4 tests sur 1 870, une suite sur 121 — mais c'est
un **instrument dont le périmètre dépend du checkout**, et la moitié de ses assertions sont des
`toContain` **positifs**, qui auraient **verdi** sur une base étendue au lieu de rougir. Le même
défaut, une ligne plus loin, aurait été **invisible**.

## 3 — Pourquoi `.gitattributes` et pas une rustine

Six `.replace(/\r\n/g, '\n')` étaient **déjà** semés dans cinq fichiers de test :

```
src/brain/dossier/atteignabilite.test.ts:38
src/brain/dossier/controles.test.ts:45 · :1121 · :2298
src/brain/dossier/evaluate.test.ts:44
src/brain/dossier/tourzero.test.ts:36
```

La classe avait donc été **rencontrée cinq fois et jamais fermée**. Réparer le seul site fautif
aurait laissé la classe ouverte au prochain balayage de source écrit — et fait croire la porte
réparée, ce qui est le mode de panne le plus cher.

`text=auto` et non `text` : git détecte lui-même le binaire (polices, images), que `text`
corromprait au checkout sans que rien ne rougisse avant le `build`. Vérifié par la revue de PR :
le dépôt ne suit **aucun** fichier binaire aujourd'hui, donc le risque est nul et le choix ne coûte
rien — il couvre le premier binaire ajouté.

**Un « bénéfice non prévu » offert par la revue de PR, RETIRÉ après mesure.** Elle avançait que
`.claude/hooks/pre-commit-gate.sh` — seul script shell suivi — échouerait « dès sa première ligne »
en CRLF, donc que la porte de commit était en panne latente dans tout checkout neuf. **Mesuré, c'est
faux** : le hook est invoqué par `bash "<fichier>"` (`.claude/settings.json:17`), donc le shebang
n'est jamais exécuté ; `bash -n` accepte le fichier tel quel, CR compris ; et sa copie de travail est
CRLF **aujourd'hui** (47 CR) alors que les commits passent. *Un argument qui va dans mon sens ne se
garde pas plus qu'un autre s'il ne se mesure pas* — c'est la règle que cette tranche a appliquée deux
fois contre le comité, elle vaut aussi quand elle me coûte un bénéfice.

## 4 — Condition d'arrêt, posée avant de livrer et vérifiée

> « L'index est déjà en LF et la copie principale aussi : `git add --renormalize .` ne doit produire
> **aucun** changement de contenu. **S'il en produit, la mesure était fausse — on s'arrête.** »

```
git add --renormalize .
git diff --cached --numstat | (hors .gitattributes et .claude/) → 0 fichier
```

**Zéro changement de blob.** L'index a été vidé ensuite (`git reset`) : les huit `.claude/agents/*.md`
modifiés avant cette session — travail de l'auteur, étranger à la tranche — ont été **désindexés et
laissés intacts**.

## 5 — La preuve, après

Faite sur un **checkout réellement neuf**, pas sur la copie principale : un commit sonde portant
`.gitattributes` a été créé dans un worktree détaché (`main` n'a jamais été touché), puis un **second**
worktree a été créé depuis ce commit.

```
head -c 40 wtB/src/brain/copilote/contexte/relations.ts | od -c   →  / * * \n      (LF)
node ./node_modules/typescript/bin/tsc --noEmit                   →  exit 0
node ./node_modules/jest/bin/jest.js --silent
   →  Test Suites: 121 passed, 121 total
      Tests:       1870 passed, 1870 total
```

**Avant : 1 suite / 4 tests rouges. Après : 121 suites / 1 870 tests verts.**

## 6 — Ce qui a été refusé, et pourquoi

- **Normaliser la lecture dans `contexte.test.ts`** (option B présentée à l'humain) — ferme le
  **site**, pas la **classe**. Les six rustines préexistantes sont la preuve que cette stratégie a
  déjà échoué cinq fois. *L'humain a tranché pour l'option A.*
- **Absorber la réparation dans le lot d'it4** — elle ferait entrer un fichier de `brain/copilote/`
  dans un lot de démolition d'arbre, casserait la propriété exclusive des fichiers, et rendrait
  **illisible** le delta de tests exact qui est le critère cardinal d'it4. *Une réparation
  d'outillage se livre seule, sinon on ne sait jamais lequel des deux gestes a produit le vert.*
- **Toucher aux six rustines existantes** — hors périmètre. Elles deviennent **redondantes**, pas
  fausses. **Et leur retrait n'est PAS armé — arbitrage de la revue de PR, retenu contre la première
  rédaction de ce dossier.** Une rustine redondante est **indistinguable** d'une rustine utile par
  n'importe quel test : sa suppression ne fait rougir personne. Armer un déclencheur de retrait, ce
  serait mandater un futur lot pour supprimer six défenses **sans instrument pour vérifier qu'il a
  raison**. L'asymétrie est nette — les garder coûte six lignes mortes, les retirer par mandat coûte
  une défense en profondeur perdue en silence. Ce qui les documente est déjà livré : le commentaire
  d'en-tête de `.gitattributes` **les nomme**.

## 7 — Deux affirmations du comité réfutées par la mesure (conclusions gardées)

Consignées ici parce qu'un diff ne les montre pas, et que les deux ont failli entrer dans un plan.

1. **« La fermeture d'it4 est connexe, donc TOUTE partition en ≥ 2 lots laisse un lot rouge »**
   (tech-lead, tour 1). **Faux** : la coupe proposée par le PM a été **exécutée** en worktree —
   `tsc --noEmit` **exit 0**. La condition réelle n'est pas la connexité mais la **clôture vers le
   haut**. *Conclusion `N=1` gardée, sur un motif de substitution : les deux lots sont strictement
   séquentiels, la coupe n'achète aucun parallélisme et ferait passer le lot `contrat` en second.*
2. **« `worker/frontiere.test.ts:105` est atteint par le même défaut CRLF »** (tech-lead, tour 2,
   qui déclarait n'avoir exécuté aucune commande). **Faux** : en ECMAScript, `LineTerminator` inclut
   `CR`, donc `$` en mode `m` matche **aussi devant `\r`** ; mesuré, la regex rend 2 correspondances
   en LF comme en CRLF, et la suite **passe** en worktree neuf. *Le veto de démarrage tient sur
   `contexte.test.ts` seul ; le périmètre d'une réparation se **mesure**, jamais ne se dérive d'un
   relevé statique.*

## 8 — Budget de contexte (étape 4), relevé

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `bug_history.json` | 14 268 o | **15 kio** (15 360) — **relevé de 10 → 15** | ~1,07 kio |
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 051 o | 45 kio (46 080) | **29 o** |
| `docs/ROADMAP-BASCULE-IA.md` | 30 453 o | 30 kio (30 720) | 267 o — **compacté dans ce lot** |

Le plafond de `bug_history.json` est relevé **par le plancher append-only** (`5 × la plus grosse
entrée` ; BUG-127 pèse 2 427 o → `ceil(5 × 2 427 / 5 kio) × 5 kio = 15 kio`), **jamais par la
mesure** : le cliquet inversé tient. C'est exactement le cas que `B3` avait armé en posant ce
plancher — un plafond de trois entrées sur un fichier qui ne fait que croître est un décor.

**Réserve à écrire, faute de quoi ce lot ferait un mauvais précédent** : ici les **deux termes
rendent le même nombre** (`ceil(12 131/5 kio)×5 kio = 15 360` et `ceil(5×2 427/5 kio)×5 kio = 15 360`).
La phrase « relevé par le plancher, jamais par la mesure » est donc **vraie mais non falsifiable
depuis le résultat** : elle ne se vérifie qu'en constatant que le terme *plancher* **suffit seul**.
Un relecteur pressé pourrait lire ce lot comme validant une montée par la mesure — ce que la
doctrine interdit. *Tension de la doctrine elle-même, à remonter au comité, hors périmètre ici* : la
formule `max(mesure, plancher)` autorise littéralement le terme mesure à relever le plafond, pendant
que la prose l'interdit. Tant que les deux coïncident, personne ne s'en aperçoit.

`docs/ROADMAP-BASCULE-IA.md` a franchi son plafond dans ce lot (30 990 > 30 720) et a donc été
**compacté dans le même geste**, jamais reporté : les quatre paragraphes `B1`–`B4` passent de
**1 844 o à 1 303 o** (−541) en gardant ce qui engage — ce qui a été livré, la version, le renvoi au
dossier — et en laissant partir les **motifs d'une décision livrée**, qui vivent déjà dans les
`.revue.md` et le `CHANGELOG`. Mesure après : **30 448 o**, marge 272 o. Ni les colonnes `Statut`
ni le § 4 « Ce qui est CLOS » n'ont été touchés.

## 8 bis — Ce que la revue de PR a trouvé, et les deux constats qu'elle a manqués ou surestimés

Le tech-lead a rendu `REQUEST_CHANGES` — **4 must-fix, 8 mineurs** — sur une tranche dont il a signé
le geste central sans réserve. Les corrections sont appliquées. Deux choses méritent d'être écrites.

**Ce qu'il a trouvé et qui était grave — BUG-122 a RÉCIDIVÉ dans ce lot même.** Les séquences
d'échappement de la prose ont été détruites par des **fins de ligne réelles** : une couche
d'encodage de plus mange un niveau de backslash, et `\` + `n` tapé arrive comme un saut de ligne.
Quatre spans de code vides dans le `CHANGELOG`, trois puces fracturées, **et un CR nu** — dans
l'entrée qui documente une tranche sur les fins de ligne. **Aggravation que la revue a vue et que
j'avais manquée** : le `.gitattributes` livré **normalise les paires CRLF de sa propre
démonstration**, rendant les deux illustrations identiques, tandis que le CR **nu**, lui, survit à
la conversion — le seul artefact que ce correctif ne peut pas nettoyer est celui que ce lot
introduisait. **Constat que la revue a manqué, trouvé en vérifiant son constat** : `bug_history.json`
portait **le même défaut**, avec un CR réel dans la valeur JSON. Corrigé aux deux endroits.
**Correctif de fond, pas de forme** : la prose de cette tranche ne contient plus **aucun**
backslash — elle nomme les octets (`CR`, `LF`, « la paire LF LF »). *On ne ré-échappe pas, on retire
le construit* : c'est la seule parade qui ne dépend pas du nombre de couches traversées.

**Les deux constats que la mesure a réfutés.** La revue n'avait **aucun outil shell** et l'a déclaré.

- **`0.6.51` serait un numéro fantôme** (m4) — **faux** : `CHANGELOG.md:107` porte bien
  `## 0.6.51 — la dette cesse d'etre un calendrier`. L'en-tête `0.6.51 → 0.7.4` est juste, non modifié.
- **Des enregistrements de worktree ou un commit sonde pendants** (m7) — **aucun** :
  `git worktree list` rend une seule entrée, `git worktree prune -v` ne rend rien, `.git/worktrees`
  est vide. La procédure de démontage (jonction retirée **avant** toute suppression) a tenu.
- **« 12 insertions, 0 suppression serait arithmétiquement impossible »** — **c'est pourtant la
  mesure** : git aligne l'insertion sur un `},` déjà présent et n'a aucune ligne à supprimer.

## 8 ter — L'écart 1869 / 1870, mesuré

La revue a classé must-fix un écart réel : `CHANGELOG.md` `0.7.3` annonce **1869** tests, cette
tranche en mesure **1870**, alors qu'aucune ligne de test n'a bougé. **Mesuré, et la réponse est
que 1870 est le bon chiffre** :

```
worktree PRISTINE de HEAD (f194a8f, avant tout geste de ce lot)
   →  Tests: 4 failed, 1866 passed, 1870 total
dépôt principal, avant tout geste  →  121 suites / 1870 passed
```

`4 + 1866 = 1870` **sur HEAD lui-même**. Le compte ne dépend donc **pas** du checkout — seul le
nombre d'échecs en dépendait —, et **la classe que B4 ferme est bien fermée** : le veto R7 est levé
pour la bonne raison. C'est l'entrée `0.7.3` qui porte une **transcription fausse d'une unité**.
**Non corrigée ici, délibérément** : réécrire le chiffre d'une entrée livrée sort du périmètre d'une
tranche d'outillage, et l'erreur est désormais nommée. À reprendre par le premier lot qui rouvre
cette entrée.

## 9 — Ce que personne n'a vérifié

- **LA PORTÉE RÉELLE : le correctif agit au CHECKOUT, jamais rétroactivement.** Mesuré après coup —
  **118 des 1 109 fichiers suivis** portent encore des CR dans la copie de travail principale
  (dont les huit `.claude/agents/*.md`, `pre-commit-gate.sh`, `CLAUDE.md`, plusieurs
  `specification.json`, `package-lock.json`). **Aucune exposition vive** : aucun test ne les lit en
  texte (`codeKnowledge.test.ts` passe par `JSON.parse`, insensible au CR). La classe n'est donc
  fermée, pour ces copies-là, **qu'à leur prochain checkout**. C'est l'image miroir exacte de
  BUG-127, et il vaut mieux l'écrire que la laisser découvrir : personne ne doit conclure que tout
  le dépôt est passé en LF le 2026-09-24.
- **`.prettierrc` ne porte aucune clé `endOfLine`**, donc l'invariant repose côté copie principale
  sur un **défaut non écrit** de Prettier (`lf` depuis la v2). Un `"crlf"`/`"auto"` ajouté par
  inadvertance rouvrirait la classe **du côté où elle n'a jamais été vue**. La revue de PR l'a
  signalé **sans le mandater** ; non fait ici, nommé ici. Déclencheur : le premier lot qui ouvre
  `.prettierrc`.

- **Aucun test de non-régression n'est dû, et c'est motivé** : l'invariant est **câblé** dans
  `.gitattributes`. La recette qui le prouve est la **porte complète en worktree neuf**, à rejouer à
  chaque tranche hors cycle — pas une assertion, qui pourrait elle-même dépendre des fins de ligne.
- **La dérive `package-lock.json`** (champ `version` figé à `0.6.19` contre `0.7.3` dans
  `package.json`), relevée en passant : **préexistante, non corrigée ici**, hors périmètre. Elle
  salit chaque `npm install`.
- **Incident d'environnement, imputé à l'orchestrateur** : un `git worktree remove --force` lancé
  alors que la jonction NTFS `node_modules` était encore en place a suivi la jonction et détruit une
  partie du `node_modules` du dépôt. Réparé (`npm install`, lockfile restauré), porte re-mesurée
  verte. **Procédure à retenir, et appliquée depuis : retirer la jonction AVANT toute suppression du
  répertoire, et vérifier `node_modules` avant de supprimer quoi que ce soit.**
