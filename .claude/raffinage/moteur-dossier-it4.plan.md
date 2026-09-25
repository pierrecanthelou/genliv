# Plan d'itération — `moteur-dossier` · itération `4`

> Statut : `validé par l'humain le 2026-09-25 — prérequis § 0 bis déjà résolu, prêt pour /essaim`
> Produit par : pm-produit · tech-lead · ux-designer · qa · **narratif-ia** — le 2026-09-24
> Composition : **5 rôles** — motif : l'itération touche le **mode jeu** et le **runtime joueur** ; KR-250 (« aucune génération de texte ») et la contrainte de runtime extractible sont dans le domaine de `narratif-ia`, qui y a trouvé le point le plus lourd du raffinage (deux règles du jeu perdant leur implémentation).
> Exécution : **séquentielle** — 1 lot, pas d'essaim, pas de worktree, pas d'`integrateur`.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | **Aucune — dérogation nommée, déjà actée au cadrage** (`resolved_decisions`). Jalon d'ingénierie, précédent `B2 outillage-2`. À la place, la **ligne de fermeture mesurée** : *le modèle d'arbre n'a plus aucun consommateur de jeu ; **22 fichiers supprimés ou modifiés**, `src/player/` perd **la totalité** de ses consommateurs de production.* |
| **Tranche** | `brain/` (baril, clés, modèle) → `src/EditorScreen.tsx` (le CTA du livre-arbre s'éteint) → `play-mode` (la modale meurt) → `src/player/` (runtime, écrans, moteur de session, persistance) → `docs/` (les deux documents que le code rend faux). |
| **Lots** | **1 lot**, type **`contrat`**, agent `dev-contrat`. **24 fichiers : 15 supprimés · 9 modifiés · 0 créé.** |
| **Hors périmètre** | `actionEngine.ts` (**0 partie arbre, mesuré**) · `EditorTopBar.tsx` (D-6) · `brain/tree.ts`, `kinds.ts`, `BookService`, les 11 événements (KR-240) · les ~4 400 l. orphelines de `src/player/` · la scission de `controles.ts` · la réparation CRLF. |
| **Reporté** | `PLANCHER_PAR_RACINE` → **non, retenu ici** (voir A-7) · l'infobulle D-6 → n° 10 · le compteur d'alertes en session → n° 10 · la règle ESLint `onMouse*` → n° 10 · le narrowing de `SessionState` → n° 10 · les 39 littéraux de prose et les 10 `rng` par défaut → n° 13 / n° 11. |
| **✅ Prérequis (résolu avant démarrage)** | **Résolu** — Option A déjà livrée : `.gitattributes` (`* text=auto eol=lf`), commit `c48a8c7` (« chore(eol-lf B4) »), 2026-09-24 22:08, inclus dans `0.7.4`. Preuve du commit : 121 suites / 1870 tests verts sur checkout neuf. Reconfirmé en local le 2026-09-25 (`contexte.test.ts` : 84/84). `BUG-127` déjà journalisé. Voir § 0 bis. |

---

## 0 — Escalade

**Aucune.** Deux vetos ont été posés au tour 2, **les deux dans leur domaine, les deux levés par une
contrepartie écrite** :

| Veto | Rôle | Levée |
|---|---|---|
| Deux règles du jeu perdent leur implémentation sans propriétaire nommé | `narratif-ia` | `docs/REGLES-PLAY.md` entre au lot (fichier 22) + une `open_questions` nommant la n° 11. **Accepté par le tech-lead au tour 2.** |
| La porte des ouvriers est rouge en worktree neuf | `tech-lead` (R7) | Une tranche **hors cycle**, **avant** it4. **PM, QA et narratif-ia convergent.** |

## 0 bis — Le prérequis bloquant (à trancher par l'humain avant tout lot)

> **Résolu avant l'ouverture de ce tour de validation.** La tranche hors cycle décrite plus bas
> (Option A) a été livrée le 2026-09-24 22:08, commit `c48a8c7` (« chore(eol-lf B4) »), **incluse
> dans `0.7.4`** — donc avant que ce plan soit soumis à l'humain. L'analyse ci-dessous, écrite au
> moment où le rouge était encore mesuré, est conservée telle quelle pour la trace ; elle ne
> commande plus aucune action. Validation humaine du 2026-09-25 : Option A confirmée comme le bon
> choix, déjà en place.

**Mesuré à l'époque, et sans rapport avec it4.** Dans un worktree **neuf et pristine** de `HEAD` :

```
npx jest   →  1 suite ROUGE / 121,  4 tests / 1870   (src/brain/copilote/contexte.test.ts)
npx tsc --noEmit  →  exit 0          eslint  →  exit 0 (1 warning préexistant)
```

**Cause épinglée à la ligne** — `contexte.test.ts:1745` : `source.indexOf('\n\n', debut)`. En CRLF une
ligne blanche s'écrit `\r\n\r\n`, `indexOf` rend `-1`, `slice(debut, -1)` avale tout le reste du
fichier (`Expected length: 4 / Received length: 40`). `core.autocrlf=true` rend du **CRLF à tout
checkout neuf** ; la copie de travail principale, elle, est en **LF**.

**Pourquoi ça bloque** : `dev-lot`/`dev-contrat` travaillent **dans leur propre worktree** et leur
porte locale est `tsc + ESLint + jest`. **L'ouvrier d'it4 ne peut pas rendre.**

**Ampleur mesurée — petite, mais la nature est grave** : **1 suite sur 121**. Les 47 autres suites à
`readFileSync` sont vertes (`lintIsolation`, `moteurSansIA`, `codeKnowledge`, `outcomeBlock`
compris). La gravité n'est pas le nombre : c'est un **instrument dont la base change avec le
checkout**, et la moitié de ses assertions sont des `toContain` **positifs**, qui **verdiraient** sur
une base étendue. Le même défaut, une ligne plus loin, serait **invisible**.

**Deux options, à trancher par l'humain :**

| | **A — `.gitattributes`** *(recommandée)* | **B — normaliser la lecture** |
|---|---|---|
| Geste | `* text=auto eol=lf` à la racine (aucun `.gitattributes` n'existe) | `.replace(/\r\n/g, '\n')` dans `contexte.test.ts` |
| Portée | ferme **la classe** | ferme **le site** |
| Appui | **6 rustines ad hoc déjà en place** (`atteignabilite.test.ts:38`, `controles.test.ts:45/1121/2298`, `evaluate.test.ts:44`, `tourzero.test.ts:36`) : la classe a été rencontrée et rustinée **cinq fois** sans être fermée | le défaut est mesuré sur **un** seul fichier aujourd'hui |
| Risque | `git add --renormalize .` doit produire **zéro** changement de contenu (l'index est déjà en LF) — sinon on s'arrête | laisse la classe ouverte au prochain balayage écrit |
| Coût | une tranche hors cycle, 1 PATCH ; it4 glisse à `0.7.5` | un commit de correction de bug, ne bumpe pas |

**Dans les deux cas** : entrée `bug_history.json`, `severity: major`, `discovered_at: regression`.
**Si l'humain choisit de démarrer it4 sans réparer**, le plan doit porter l'**empreinte E₀ nommée**
(les 4 titres d'assertions), et la définition de fini devient `E₁ ⊆ E₀` — jamais « on sait que ce
rouge-là est étranger ».

---

## 1 — But raffiné

**Le modèle d'arbre n'a plus aucun consommateur de jeu.** `brain/utils/playExport.ts`,
`buildAdventureDocument.ts`, la modale d'aperçu, le runtime joueur, les cinq écrans de nœud, le
moteur de session et sa persistance disparaissent ; `src/EditorScreen.tsx` cesse de monter un
lecteur d'arbre ; **`actionEngine.ts` n'est pas touché** ; la suite de `tree-canvas` reste verte sans
avoir été modifiée.

> **Correction du goal, exigée par trois rôles (KR-258).** Le goal écrit dans la spec nomme **10
> fichiers** là où la fermeture transitive en exige **22**, et parle des « parties arbre de
> `sessionEngine` / **`actionEngine`** / `usePlaySession` » — or pour `actionEngine.ts` cet ensemble
> est **mesuré vide** : `rg` de 9 motifs d'arbre → **0 match sur 346 lignes**. Le goal se réécrit sur
> la fermeture mesurée et **cesse de nommer `actionEngine`**.

## 2 — Hors périmètre

- **`src/player/engine/actionEngine.ts` et son test** — 0 occurrence d'arbre sur 346 l. Il **survit
  intact** et perd ses cinq consommateurs. *N'ouvrir ce fichier sous aucun prétexte.*
- **`src/brain/components/EditorTopBar.tsx`** — **zéro octet** (D-6 : la prémisse navigateur de
  l'infobulle n'est toujours pas mesurée). Seul son `.test.tsx` entre, pour un commentaire.
- **Le MODÈLE d'arbre** — `brain/tree.ts`, `kinds.ts`, la moitié arbre de `brain/types.ts`,
  `BookService`, les 4 hooks, `automaticEdges.ts`, `NodeBadge`, les 11 événements
  `book:*`/`node:*`/`edge:*`, `Router {name:'editor'}`, `src/EditorScreen.tsx` (le **fichier**
  survit). KR-240 : la n° 9 est propriétaire des **consommateurs**, jamais du **modèle**.
- **Les ~4 400 lignes orphelines de `src/player/`** — `CombatScreen`, `CharacterCreationScreen`,
  `XpShopScreen`, `EndScreen`, `HeroStatusBar`, `ReinforcementPicker`, `useCombat`, `combatEngine`,
  `capacityEffects`, `charCreation`, `heroGen`, `combatTypes`. **Conservées**, repreneurs n° 10 / n° 13.
- **La réparation CRLF** (§ 0 bis), **la scission de `controles.ts`**, **`quetes[].etapes`**.
- **Aucun fichier créé.** it4 ne livre **aucun test neuf** (voir A-3).
- Les huit renvois périmés vers `PlayerModal.tsx` (`EcranPartie.tsx:22,23,41`,
  `CadrePartie.tsx:18,72,91`, `PanneauEvenements.tsx:80`, `play-mode/index.ts:7`,
  `ouvertureVerbatim.test.tsx:74`) — **périmés, pas menteurs** ; geste de doc de l'étape 4.

## 3 — Contrat de design

**Aucun écran neuf.** Deux textes exacts, et rien d'autre.

**T1 — `src/EditorScreen.tsx`**, constante de module :

```ts
const RAISON_APERCU_LIVRE =
	"Aperçu indisponible — un livre ne se joue plus ; l'aperçu se lance depuis un dossier d'aventure."
```

À la l. 59, `onPreview={handlePreview}` **devient** `previewDisabledReason={RAISON_APERCU_LIVRE}` —
une substitution, ligne pour ligne.

| État | Rendu | Source |
|---|---|---|
| défaut | bouton « Aperçu du jeu ▷ » **présent et désactivé** | `EditorTopBar.tsx:126` `disabled={!onPreview}` |
| survol | infobulle native = `RAISON_APERCU_LIVRE` | attribut `title` |
| sélectionné / erreur / vide | **sans objet** | — |

**Clavier** : `<button disabled>` sort de l'ordre de tabulation ; aucun piège de focus. **Aucun jeton
nouveau, aucun composant maison, aucune valeur en dur.**

**T2 — `src/brain/components/EditorTopBar.test.tsx`**, remplacement des lignes 79-80 (tabulations) :

```tsx
		// Le DÉFAUT du composant, épinglé en ISOLATION : depuis la n° 9 it4, plus aucun
		// écran ne s'en remet à lui — l'écran livre-arbre passe `RAISON_APERCU_LIVRE`,
		// l'écran dossier sa propre raison. Ce cas garde sous témoin le défaut de
		// `EditorTopBar.tsx:71` tant que D-6 ne l'a pas corrigé.
```

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/utils/playExport` | registre | **retiré du baril** | `exportBookForPlay`, `PLAY_EXPORT_FORMAT`, `PLAY_EXPORT_VERSION`, `PlayExport`, `PlayNode`, `PlayWarning` — `brain/index.ts` l. 597-604 |
| `buildAdventureDocument` | service | **retiré du baril** | `brain/index.ts` l. 606 |
| `PLAY_SESSION_KEY_PREFIX` | clé | **retirée** | `persistenceKeys.ts` l. 145-151. **`DOSSIER_SESSION_KEY_PREFIX:101` SURVIT** |
| `AdventureDocument` / `PlayNode` | type | **retirés** | `player/types.ts` l. 1, 5, 6 |
| `HeroState`, `SessionEquipmentState`, `PlayPhase`, `SessionState` | type | **CONSERVÉS** | `combatEngine.ts` les consomme sur **7 sites** (R3). Narrowing → n° 10 |
| `BookNode`, `Edge`, `effectiveKind`, `endLabel`, `EDGE_KINDS`, `NODE_KINDS`, `nodeTitle`, `textLines`, `NodeBadge`, `useBrain`, `createBrain` | — | **INTOUCHÉS** | les 11 symboles que `tree-canvas` consomme |

## 4 bis — Contrat de sortie IA

**Néant, et c'est vérifiable.** Contexte injecté : aucun. Schéma de sortie : aucun. Comportement
d'échec : sans objet. it4 n'appelle aucun modèle, ne consomme aucune sortie, ne touche ni dés, ni
stats, ni inventaire, ni XP. L'instrument qui le prouve est `moteurSansIA.test.ts` (KR-250), qui doit
rester **vert sans avoir été modifié pour compenser une suppression** — le durcissement du critère 8
**resserre** le plancher, il ne le rend pas atteignable.

**À consigner pour la n° 10** : *it4 est la dernière itération où « aucune génération de texte » vaut
pour **toute** la surface de jeu.*

## 5 — Lots

### Lot 1 — `extinction-arbre` · `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier — **à N=1 la règle est vraie par
  vacuité, aucune dérogation n'est demandée**)
- **But** : éteindre tous les consommateurs de jeu du modèle d'arbre, sans toucher au modèle.
- **Fichiers — 24 : 15 (S) · 9 (M) · 0 (N)**
  *Légende des marqueurs : **(S)** supprimé · **(M)** modifié · **(N)** créé. Un lot de démolition ne
  crée rien, d'où **0 (N)**. Lot unique → listes disjointes par construction.*

| # | Fichier | Mk | Geste |
|---|---|:--:|---|
| 1 | `src/brain/utils/playExport.ts` | **S** | 207 l. |
| 2 | `src/brain/utils/playExport.test.ts` | **S** | 9 tests |
| 3 | `src/brain/utils/buildAdventureDocument.ts` | **S** | 13 l. |
| 4 | `src/brain/index.ts` | **M** | retirer l. 597-604 et l. 606 |
| 5 | `src/brain/tree.ts` | **M** | commentaire l. 11 ; **fichier survit** |
| 6 | `src/brain/persistenceKeys.ts` | **M** | retirer `PLAY_SESSION_KEY_PREFIX` l. 145-151 |
| 7 | `src/EditorScreen.tsx` | **M** | § 3 T1 ; retirer l. 19, 41-44, 61 ; imports l. 2/4/5 ; **fichier survit** |
| 8 | `src/features/play-mode/components/PlayerModal.tsx` | **S** | 95 l. |
| 9 | `src/player/components/PlayerRuntime.tsx` | **S** | 369 l. |
| 10 | `src/player/components/NodeScreen.tsx` | **S** | 62 l. |
| 11 | `src/player/components/ChoiceList.tsx` | **S** | 146 l. |
| 12 | `src/player/components/DecorScreen.tsx` | **S** | 277 l. |
| 13 | `src/player/components/PnjScreen.tsx` | **S** | 150 l. |
| 14 | `src/player/components/TrapScreen.tsx` | **S** | 181 l. |
| 15 | `src/player/engine/sessionEngine.ts` | **S** | 80 l., **intégralement** partie arbre |
| 16 | `src/player/engine/sessionEngine.test.ts` | **S** | 24 tests |
| 17 | `src/player/hooks/usePlaySession.ts` | **S** | 318 l. |
| 18 | `src/player/utils/persist.ts` | **S** | 41 l. |
| 19 | `src/player/utils/persist.test.ts` | **S** | 8 tests |
| 20 | `src/player/types.ts` | **M** | retirer l. 1, 5, 6 ; **corriger la docstring l. 21** (elle nomme `defaultSessionFields()`, supprimé) ; conserver les 4 types |
| 21 | `docs/EXIGENCE-APERCU-DU-JEU.md` | **M** | l. 9 + fin de l. 49 **verbatim** (A-5) + bandeau ; lignes concernées : **7, 9, 11, 49, 62** |
| 22 | `docs/REGLES-PLAY.md` | **M** | bandeau § A **verbatim** (A-6), après la l. 9 |
| 23 | `src/features/play-mode/tests/moteurSansIA.test.ts` | **M** | docstring l. 39 **datée et ventilée** + `PLANCHER_PAR_RACINE` (A-7). **Les 3 motifs interdits et leurs assertions : inchangés** |
| 24 | `src/brain/components/EditorTopBar.test.tsx` | **M** | § 3 T2, **commentaire seul, zéro assertion** |

- **Expose / consomme** : un lot de démolition n'expose rien ; son contrat est la liste **exacte** de
  ce qui disparaît du baril — § 4.
- **Critères couverts** : tous (#1 à #8).

## 6 — Critères d'acceptation

1. **Étant donné** le baril `brain/`, **quand** on liste ses exports après le lot, **alors** aucun ne
   vient de `utils/playExport` ni de `buildAdventureDocument`, et les **11** symboles consommés par
   `tree-canvas` sont **tous** encore exportés. — *niveau : contrat (`tsc`)* — *lot 1*
2. **Étant donné** `src/player/**` après le lot, **quand** on balaie ses spécificateurs d'import,
   **alors** aucun ne vise `brain/tree` ni `brain/utils/playExport` — **4 et 1 occurrences de
   production aujourd'hui, 0 après** — ni `src/features/**`, ni un service `brain/` à état.
   **Ce critère est ROUGE aujourd'hui : son pouvoir séparateur est constatable sans écrire un seul
   mutant.** — *niveau : contrat (greppable + `tsc`)* — *lot 1*
3. **Étant donné** le lot livré en totalité, **quand** on exécute `npx jest src/features/tree-canvas
   src/player --silent` puis `npx jest --silent`, **alors** le premier rend **exactement 8 suites /
   182 tests** (dont `tree-canvas` **3 suites / 37 tests**) et le second **exactement 118 suites /
   1829 tests**. **Toute autre valeur est un rejet, y compris supérieure** — un total plus haut
   signifie qu'une suite a été ajoutée pour compenser. — *niveau : exécution de suite* — *lot 1*
4. **Étant donné** le diff complet d'it4, **quand** on exécute
   `git diff --name-only HEAD -- src/features/tree-canvas/`, **alors** la sortie est **vide**, et
   elle est recopiée dans la revue. **`git status --porcelain` est INTERDIT ici** — mesuré, il rend
   **14 faux positifs** en worktree neuf après l'étape Prettier. — *niveau : constat de revue* — *lot 1*
5. **Étant donné** la barre de l'éditeur de livre-arbre après le lot, **quand** on lit
   `src/EditorScreen.tsx`, **alors** le bouton « Aperçu du jeu ▷ » est **rendu et désactivé** et
   reçoit `previewDisabledReason={RAISON_APERCU_LIVRE}` (texte § 3 T1), `EditorTopBar.tsx` étant
   inchangé à l'octet. — *niveau : constat de revue — **aucun test du dépôt ne rend `EditorScreen`**,
   mesuré : le texte est livré **non épinglé**, et la revue l'écrit comme tel* — *lot 1*
6. **Étant donné** `docs/EXIGENCE-APERCU-DU-JEU.md` après le lot, **quand** on compare sa l. 9 aux
   imports mesurés, **alors** elle porte **exactement** les modules réellement importés — `types`,
   `creatureTypes`, `monsterCapacities` **compris** — et **ni `tree` ni `utils/playExport`** ; la fin
   de la l. 49 ne dit plus qu'`AdventureDocument` est le point d'entrée ; le bandeau nomme la n° 15.
   **Non amendé → le critère sort en `NON VÉRIFIÉ`**, jamais « vérifié parce que jest est vert ».
   — *niveau : documentaire* — *lot 1*
7. **Étant donné** `docs/REGLES-PLAY.md` après le lot, **quand** on lit son § A, **alors** un bandeau
   nomme **A4/E3 (+5 PE par changement de lieu)** et **B3 (équipement de départ)** comme **sans
   aucune implémentation dans `src/`**, désigne la **n° 11** comme propriétaire et la commande
   `aller` comme successeur, `docs/REGLES-DU-JEU.md` étant **inchangé**. — *niveau : documentaire* — *lot 1*
8. **Étant donné** `moteurSansIA.test.ts` après le lot, **quand** on le lit et qu'on l'exécute,
   **alors** sa docstring porte une mesure **datée et ventilée par racine** (`player 14 ·
   play-mode 8 · brain/dossier 26 = 48`) et ses planchers sont **par racine** (`10 / 5 / 25`,
   `floor(mesure/5)×5`), **ses trois motifs interdits et leurs assertions étant inchangés**.
   — *niveau : unitaire, dans la porte* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `npx jest src/features/tree-canvas` | 3 suites / **37** tests, **inchangé** | jest | KR-240 | 1 |
| `npx jest src/player` | 5 suites / **145** tests | jest | KR-240 | 1 |
| `npx jest` (complet) | **118** suites / **1829** tests | jest | — | 1 |
| `npx tsc --noEmit` | exit 0 — **instrument principal** : il voit les `import type` que jest efface | contrat | KR-240 | 1 |
| `git diff --name-only HEAD -- src/features/tree-canvas/` | sortie **vide** | constat | KR-240 | 1 |
| balayage des imports de `src/player/**` | `brain/tree` 4→0, `brain/utils/playExport` 1→0 | contrat | KR-232 / crit. 11 | 1 |
| `moteurSansIA.test.ts` | vert **sans modification de ses 3 motifs**, planchers par racine | jest | **KR-250** | 1 |
| `EditorTopBar.test.tsx` | **8 tests, reste vert** — mesuré (M-2), seul son commentaire change | jest | KR-258 | 1 |

Cas limites couverts : symbole supprimé encore ré-exporté (`tsc` rouge) · référence `import type`
pendante (`tsc` rouge, **jest vert** — d'où le rang de `tsc`) · suite dont le sujet meurt mais qui
reste sur disque (critère 3) · test de `tree-canvas` « ajusté un peu » (critère 3, valeur exacte) ·
racine `src/player` vidée par mégarde (critère 8, plancher par racine).

**Non vérifiable en l'état — à recopier dans la revue :**
- **critère 6** — documentaire, **aucun instrument du dépôt ne le garde**
  (`grep -rln "EXIGENCE-APERCU\|extractable"` sur les `*.test.ts*` → aucun fichier) ;
- **critère 7** — documentaire, idem ;
- **critère 5** — `RAISON_APERCU_LIVRE` entre **non épinglée** : aucun test ne rend `EditorScreen` ;
- **KR-243** — l'évaluateur, les deltas et le moteur de session restent **hors du score de mutation** ;
  `npm run test:mutation` **n'est pas requis** (aucun des 4 fichiers mutés n'est touché) et **ne
  prouverait rien** sur ce lot ;
- **KR-242** — le replay déterministe reste **non testable**, et it4 l'éloigne : elle supprime les
  **deux seuls sites** qui passaient `Math.random` explicitement (`TrapScreen:38`, `DecorScreen:75`),
  après quoi l'entropie n'est plus qu'un **défaut de paramètre, dix fois**, pendant que `graine_alea`
  n'a **aucun consommateur d'aléa**. Aucun test ne le couvre ici ; propriétaire n° 11 ;
- **tant que le prérequis § 0 bis n'est pas réparé**, personne ne cite `contexte.test.ts` vert comme
  preuve qu'une borne de contexte tient.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| A-1 | PM | Le goal nomme 10 fichiers ; la fermeture en exige 22, et « les parties arbre d'`actionEngine` » est un ensemble **mesuré vide** (0/346) | `RETENU` | Goal réécrit au § 1. KR-258 appliqué au goal lui-même |
| A-2 | PM | La fermeture à 22 fichiers serait un élargissement de périmètre | `REJETÉ` | Conséquence mécanique : un périmètre à 10 fichiers laisse `tsc` rouge, donc ne livre rien |
| A-3 | PM / tech-lead / QA | La coupe en deux lots ou deux itérations (4a/4b) | `REJETÉ`, **motif substitué** | Le motif initial du tech-lead (« fermeture connexe donc indivisible ») est **FAUX** — réfuté par contre-exemple **exécuté** (M-4 : 4a compile, `tsc` exit 0). La condition réelle est la **clôture vers le haut**. **Refus maintenu sur le motif de substitution** : les deux lots sont strictement séquentiels, la coupe n'achète **aucun parallélisme** et fait passer le lot `contrat` en **second** — la dérogation même qu'elle voulait éviter. **À N=1 la règle est vraie par vacuité.** PM a **retiré** sa proposition ; `N` reste 4 |
| A-4 | tech-lead | `extinctionArbre.test.ts`, témoin neuf du critère 10 | `REJETÉ` — **retiré par son auteur** | **Vert par construction, mesuré** : 0 occurrence des 14 symboles **avant** toute démolition, exit 1. Pouvoir séparateur **nul** (BUG-084), et strictement dominé par `tsc` + la résolution de modules de jest (**rouge sur 4 suppressions simulées**). **La QA retire aussi sa propre variante « garde de frontière »** : instrument neuf à un seul appelant, sur une feature en sommeil, dont le pouvoir séparateur doit être **fabriqué** par un mutant. **it4 ne crée aucun fichier** |
| A-5 | narratif-ia | Le critère 11 s'adosse à `EXIGENCE-APERCU-DU-JEU.md:9`, **déjà fausse** : 3 modules survivants absents (`types` 12 occ., `monsterCapacities` 4, `creatureTypes` 1), et `monsterCapacities` est **en l. 49 et absent de la l. 9** — les deux listes du même document se contredisent avant it4 | `RETENU` | Phrases **verbatim** au fichier 21, lignes **7, 9, 11, 49, 62** nommées. Le cadrage disait 2 modules : **faux**, il en manquait un |
| A-6 | narratif-ia | **VETO** — `PE_PER_TRANSITION = 5` **EST** `REGLES-DU-JEU.md:43` et `defaultSessionFields` **EST** `REGLES-PLAY` B3 ; 11 sites, tous au lot → **zéro implémentation** après it4, `tsc` vert, aucune suite rouge. Panne **muette** | `RETENU` — **veto levé** | `docs/REGLES-PLAY.md` entre au lot (fichier 22, bandeau § A verbatim) + une `open_questions` nommant la n° 11. **Aucune ligne de code**, `REGLES-DU-JEU.md` **intouché** (KR-130 : sens `doc → code`). Le tech-lead a accepté au tour 2 : refuser ce fichier en acceptant le fichier 21 aurait été incohérent |
| A-7 | QA + narratif-ia **contre** tech-lead + PM | `PLANCHER_PAR_RACINE` dans it4, ou reporté à la n° 10 | `RETENU` **dans it4** — *arbitrage de l'orchestrateur contre le tech-lead et le PM* | Le tech-lead refusait au motif qu'« un seuil re-dérivé sur la mesure produite par le lot que l'instrument garde épingle ce que la démolition a fait, y compris une suppression de trop ». **Mesuré, c'est faux** : `floor(n/5)×5 = 10` pour **toute** valeur de `n` de 10 à 14 — le plancher est **aveugle à 4 fichiers supprimés en trop**, il ne certifie donc **rien** sur it4 et ne peut pas figer son défaut. Et sans lui, le seul garde restant sur `src/player` est l'assertion `> 0` : **`brain/dossier` seul (26) satisfait déjà le plancher global de 20**, donc `player` pourrait tomber de 14 à 1 en silence. Le geste **resserre** (global 20 sur base 48 → 10/5/25 par racine), direction du cliquet. Une **seule édition**, fichier déjà au lot |
| A-8 | QA | `git status --porcelain` comme instrument du « non modifié » | `REJETÉ` | **14 faux positifs mesurés** en worktree neuf après Prettier ; `git diff --ignore-cr-at-eol` → 0 ligne de contenu. Écrit ainsi, le critère **rejette un lot correct**. L'instrument est `git diff --name-only` |
| A-9 | tech-lead | Second fichier atteint par le CRLF : `worker/frontiere.test.ts:105` | `REJETÉ` | **Réfuté par mesure (M-8)** : en ECMAScript `LineTerminator` inclut `CR`, donc `$` en mode `m` matche aussi devant `\r` ; la suite **passe** en worktree CRLF (run complet : 1 seule suite rouge). **R7 tient sur `contexte.test.ts` seul** ; le périmètre de la réparation se **mesure**, jamais ne se dérive d'un relevé statique |
| A-10 | tech-lead (R7) + QA | **VETO DE DÉMARRAGE** — la porte est rouge en worktree neuf | `RETENU` | § 0 bis. Tranche **hors cycle avant it4**, ou empreinte E₀ nommée au plan. **Jamais absorbée par le lot** : un fichier de `brain/copilote/` dans un lot de démolition casse la propriété de fichiers et rend le delta du critère 3 illisible |
| A-11 | tech-lead (R2) + PM | Les orphelins de `src/player/` | `RETENU` | **Conservés** — propriétaire daté à une itération de distance (n° 10, n° 13) et suites de logique survivantes : double différence avec le modèle d'arbre. **Contrepartie** : la revue écrit le **nombre mesuré** de fichiers de production sans consommateur, et **une seule ligne** au roadmap § 0 bis (le roadmap n'a que **536 o** de marge — la table à 4 lignes du PM est **retirée par son auteur**) |
| A-12 | tech-lead (R3) | `SessionState` conservé malgré `bookId`/`currentNodeId`/`visitedNodes` | `RETENU` | `combatEngine.ts` le consomme sur **7 sites**. Le narrowing correct ferait entrer +6 fichiers et un moteur de règles dans une démolition. **Ce qui reste n'est pas du modèle d'arbre** : trois `string`/`string[]`. Propriétaire : **n° 10** |
| A-13 | PM | `persist.ts` rangé en « conservé » au roadmap § 0 bis:58 | `REJETÉ` | Il se **supprime** : appelant unique mort, `localStorage` brut, `PLAY_SESSION_KEY_PREFIX` dupliqué sous un « must stay in sync (KR-134) » que plus personne n'exécutera, remplaçant livré en it2. **Second chemin de persistance**, pas un orphelin en attente |
| A-14 | tech-lead (R4) | Les huit renvois périmés vers `PlayerModal.tsx` | `REJETÉ`, consigné | Hors lot (« petit refactor à côté » interdit) ; **périmés, pas menteurs**. Geste de doc de l'étape 4. **Exception unique** : `moteurSansIA.test.ts`, dont le lot **change la valeur mesurée** |
| A-15 | UX | Faire **disparaître** le bouton « Aperçu du jeu ▷ » | `REJETÉ` | Le rendre conditionnel exige de modifier `EditorTopBar.tsx`, gelé par D-6, pour un écran sans point d'entrée en production. *Une affordance dont l'objet a déménagé se désactive **en disant où**, elle ne s'efface pas* |
| A-16 | UX | Corriger le défaut `previewDisabledReason` de `EditorTopBar.tsx:71` | `REJETÉ` | D-6 tient, et **M-2 mesure que ce défaut reste VRAI** : `EditorTopBar.test.tsx` le rend en isolation et reste vert (8/8). Seul son **appelant** disparaît |
| A-17 | UX | Consigner le code des 5 écrans comme référence visuelle | `REJETÉ` | `ChoiceList.tsx:56-63,130-137` mute `e.currentTarget.style` au survol (interdit) et écrit `1px` au lieu de `--bw-hair` : le conserver propagerait l'anti-patron. **Seule la table issue→jeton de `TrapScreen.tsx:105-129` est consignée** (annexe C de la revue, **inscrite à la définition de fini**) |
| A-18 | UX | Le compte d'alertes non bloquantes pendant une partie | `REPORTÉ` → n° 10 | Le compteur de `PlayerModal.tsx:62-69` meurt sans remplaçant en session ; sa mort est un **gain net** (`--bad` employé décorativement, jeton réservé à l'échec d'un **jet**). **Contrainte posée** : jamais `--bad` ni `--good` — `--text-muted`, mono `--fs-meta` |
| A-19 | UX | Règle ESLint interdisant `onMouseEnter`/`onMouseLeave` | `REPORTÉ` → n° 10 | **Re-mesuré** : 6 occurrences / 2 fichiers avant it4 → **2 / 1 fichier après** (`CombatScreen.tsx:264,268`, orphelin **hors de tout lot**). La poser ici exigerait un `overrides` d'un unique fichier qu'on n'a pas le droit d'ouvrir |
| A-20 | UX | `HeroStatusBar.tsx:11,37` teinte les jauges PV/PE en `--good`/`--bad` | `CONSIGNÉ` | Même faute que le compteur, sur un module **survivant**. it4 ne l'ouvre pas. Le repreneur ne recopie pas la jauge. Même famille : `CombatScreen.tsx:81,122,300`, `CharacterCreationScreen.tsx:311`, `EndScreen.tsx:11,13` |
| A-21 | narratif-ia | Réécrire les § 2/3/6 de `EXIGENCE-APERCU-DU-JEU.md` | `REJETÉ` | Sept lignes fausses au-delà des l. 9 et 49 ; une itération à part, empiétant sur la **n° 15**. Un bandeau qui **nomme le propriétaire** coûte trois lignes |
| A-22 | narratif-ia | Réimplémenter les +5 PE sur `commande.aller` dans it4 | `REJETÉ` | `EtatSession` n'a pas de `heros` avant la n° 11 : l'ouvrir violerait KR-249. **On nomme le propriétaire, on ne code pas** |
| A-23 | narratif-ia | Nettoyer les 39 littéraux de prose des moteurs survivants (26 `capacityEffects` + 13 `combatEngine`) | `REJETÉ`, consigné | Tenus par deux suites riches, sans consommateur d'ici la n° 13. La décision « lignes **affichées** ou **ENTRÉE** du narrateur, jamais les deux » appartient à la n° 13 |
| A-24 | narratif-ia | « `graine_alea` sans lecteur » (sa propre affirmation de tour 1) | `REJETÉ` — **retiré par son auteur** | **Faux** : écrite (`session.ts:280`), typée `'moteur'`, persistée, lue par des tests. Formulation juste : **aucun CONSOMMATEUR D'ALÉA, aucun `rng` n'en est dérivé** — c'est ce couple (10 `Math.random` par défaut + une graine que rien ne branche) qui rend **KR-242** non testable |
| A-25 | narratif-ia | § H de `REGLES-PLAY.md` (23 capacités) marqué « proposition » alors que `capacityEffects.ts` en implémente une partie | `REPORTÉ` → avant la n° 13 | Inversion du sens d'écriture KR-130. Hors périmètre d'it4 |
| A-26 | QA | Toute citation d'une couverture globale comme preuve, **y compris à la hausse** | `REJETÉ` | Supprimer ~1 500 l. dont une part non couverte fait monter le ratio sans qu'aucun test n'ait été écrit : le chiffre mesure le **dénominateur** |
| A-27 | orchestrateur | Dérive préexistante : `package-lock.json` porte `version: 0.6.19` contre `0.7.3` dans `package.json` | `REPORTÉ` | Relevée par la QA en réparant `node_modules`. Salit chaque `npm install`. Hors périmètre d'it4 |

## 9 — Innovation

**Aucune.** Budget non consommé — aucun rôle n'en a déposé aux deux tours, et l'orchestrateur n'en
introduit pas : une démolition n'est pas le lieu d'infléchir une règle.

## 10 — Définition de fini

- [ ] **Prérequis § 0 bis traité** — soit la porte est verte en worktree neuf, soit l'**empreinte E₀**
      est écrite nommément au plan (les 4 titres d'assertions de `contexte.test.ts`)
- [ ] **Empreinte différentielle**, prise dans le **même worktree** : `jest --json` sur HEAD pristine
      (E₀) puis après le lot (E₁). **Fini ⇔ E₁ ⊆ E₀** — jamais « on sait que ce rouge-là est étranger »
- [ ] Porte qualité verte, **`tsc --noEmit` en tête** : Prettier → `tsc` → ESLint → `jest`
- [ ] **Delta exact** du critère 3 : `tree-canvas` **3/37** · `player` **5/145** · complet **118/1829**
- [ ] `git diff --name-only HEAD -- src/features/tree-canvas/` **vide**, sortie recopiée
- [ ] Balayage des imports de `src/player/**` recopié : avant **4 + 1**, après **0 + 0**
- [ ] **`npm run test:mutation` NON requis** — aucun des 4 fichiers mutés n'est touché
- [ ] **Aucun test réécrit pour compenser une suppression** ; seules éditions de test admises : les 3
      suppressions, le commentaire de `EditorTopBar.test.tsx`, l'édition unique de `moteurSansIA.test.ts`
- [ ] Critères du § 6 cochés un par un ; les **quatre** items « non vérifiable en l'état » du § 7
      recopiés dans la revue
- [ ] **Annexe C de la revue écrite** — table issue→jeton de `TrapScreen.tsx:105-129`, avec la
      distinction *mesuré dans la source* / *prescrit au repreneur* (la source écrit `1px`, pas `--bw-hair`)
- [ ] Aucun fichier touché hors des 24 du lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-dossier-it4.revue.md`
- [ ] **Budget de contexte relevé** (étape 4) : `moteur-dossier/specification.json` est à **1 297 o**
      de son plafond et le roadmap à **536 o** — la compaction se fait **dans le même geste**

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | 4a/4b **retiré par son auteur** ; `REGLES-PLAY.md` au lot ; tranche hors cycle avant it4 |
| Tech Lead | recevable sous réserve · **veto de démarrage R7** | R5 réécrite (motif substitué) ; témoin retiré ; **veto levé par le § 0 bis** |
| UX | recevable sous réserve | P1 à la définition de fini ; P2 au fichier 7 ; M-2 réduit sa dette à un commentaire |
| QA | recevable sous réserve · veto sur le critère 11 et le test-grep | **levés** par les critères 2, 4, 6 ; delta refait ; `git status` proscrit |
| Narratif & IA | **veto ciblé** | **levé** par le fichier 22 + l'`open_questions` de l'étape 7 |
