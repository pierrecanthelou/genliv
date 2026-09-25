# TOUR 1 — `pm-produit` — `moteur-dossier` it4

```
RISQUE — Une démolition n'a pas de démo, donc personne ne relit ce qu'elle rend faux. Ici elle
falsifie une ligne du roadmap DANS LE COMMIT QUI LA FALSIFIE : § 0 bis écrit « XpShopScreen,
EndScreen, HeroStatusBar, persist.ts — conservés, BRANCHÉS SUR L'ÉTAT DE SESSION ». Après it4 ils
n'ont plus aucun consommateur. On fabrique une seconde zone de ~1 380 lignes de la forme exacte que
CLAUDE.md reproche au modèle d'arbre — sans producteur d'interface, couverture qui ne vaut plus
garantie d'usage — cette fois non écrite.

OBJECTION 1 — Le goal nomme 10 fichiers ; la fermeture en exige ~22. Ce n'est PAS un élargissement à
refuser : `player/types.ts:1` fait `AdventureDocument = PlayExport`, donc `PlayerRuntime` /
`PlayerModal` / `EditorScreen:43` tombent mécaniquement. C'est un goal SOUS-MESURÉ, et KR-258
s'applique mot pour mot. Il se réécrit sur la fermeture mesurée, ou l'ouvrier arbitrera seul ce que
le comité n'a pas nommé.

OBJECTION 2 — Le plan ne dit rien du sort des orphelins ni de `persist.ts`, dont le consommateur
unique (`usePlaySession`) meurt alors qu'il duplique `PLAY_SESSION_KEY_PREFIX` sous un « must stay
in sync (KR-134) » que plus personne ne synchronisera.

PROPOSITION — DEUX itérations, coupées sur l'arc de dépendance, pas pour fabriquer des phrases :
 4a « Plus rien ne monte le lecteur d'arbre » — EditorScreen (CTA), PlayerModal, PlayerRuntime,
     les 5 écrans. ZÉRO fichier brain/.
 4b « brain/ ne publie plus playExport/buildAdventureDocument et src/player/ n'importe plus le
     modèle d'arbre » — lot `contrat` SEUL ET PREMIER dans son itération, règle restaurée au lieu
     de dérogée.
Et j'amende § 0 bis dans le même lot : propriétaire nommé par module.

VERDICT — recevable sous réserve
```

*(corps : 248 mots)*

## ANNEXE

### 1. La coupe 4a / 4b

Aucun **signal de coupe littéral** de la skill ne se déclenche : 2 critères (< 8), une seule feature
hors `brain/` (`play-mode`), nombre de lots ouvert. Ce qui déclenche la proposition est le point dur
du cadrage § 8 : **dans it4 monolithique, le lot `contrat` ne peut pas être premier** — il laisserait
`tsc` rouge — donc l'itération arrive à la porte mécanique en demandant une **seconde dérogation**,
sur la règle que la Décision A protège d'un veto tech-lead.

| | Phrase | `brain/` ? | Fichiers | Critère |
|---|---|---|---|---|
| **4a** | Plus rien ne monte le lecteur d'arbre : le CTA d'`EditorScreen`, `PlayerModal`, `PlayerRuntime` et les 5 écrans de nœud partent. | **aucun** | `EditorScreen.tsx`, `play-mode/PlayerModal.tsx` (+`index.ts`), `player/components/{PlayerRuntime,NodeScreen,ChoiceList,DecorScreen,PnjScreen,TrapScreen}` ≈ 1 180 l. | n° 10 (moitié) |
| **4b** | `brain/` ne publie plus `playExport` ni `buildAdventureDocument`, et `src/player/` n'importe plus le modèle d'arbre. | **lot `contrat` seul et premier** | `playExport.ts`(+test), `buildAdventureDocument.ts`, `brain/index.ts`, `brain/tree.ts`, `player/types.ts`, `sessionEngine`(+test), `actionEngine`(+test), `usePlaySession`, `persist.ts`(+test), `docs/EXIGENCE-APERCU-DU-JEU.md` | n° 10 (moitié) + **n° 11** |

Trois propriétés que le monolithe n'a pas : (1) la règle `contrat` seul-et-premier est **respectée**,
pas dérogée — 4b n'a plus un consommateur vivant quand il part, `tsc` vert à chaque instant ; (2) le
critère n° 11 atterrit **où il est satisfiable** (avec l'amendement doc, dans le même lot) ; (3) 4a
est intégralement `git revert`-ible sans toucher un contrat `brain/`.

**Coût nommé** : un PATCH de plus (`0.7.4` + `0.7.5`), un tour de raffinage de plus, `N` = 5.
**Contrepartie** : rien d'ajouté — la somme des deux EST la fermeture mesurée.
**Engagement de retrait** : « si le tech-lead démontre que 4a et 4b sont exécutables en deux lots
séquentiels DANS UNE SEULE itération sans seconde dérogation à la règle `contrat`, je retire cette
proposition au tour 2 : elle n'aura plus d'objet. »

### 2. Les ~22 fichiers — conséquence mécanique, pas élargissement. Pas de veto.

### 3. Ce que l'auteur perd — **mesuré : rien**

`Route {name:'editor'}` n'est atteinte QUE par des fichiers de test :
`tree-canvas/tests/TreeCanvas.test.tsx` ×3, `cloud-sync/tests/ConflictDialog.test.tsx` ×2,
+ la déclaration `brain/Router.ts:30`. **Zéro navigateur en production.** Deux clauses à joindre :
la ligne d'avis « vos anciens livres restent stockés » **reste vraie** (donnée source intacte) ;
`EditorScreen.tsx` **survit** — it4 lui retire `handlePreview`, `PlayerModal` et l'import
`buildAdventureDocument`, elle ne supprime pas le fichier.

### 4. Les orphelins — tolérés, pas en silence

Table § 0 bis à amender, un propriétaire de re-branchement PAR module :

| Module | Lignes | Consommateur après it4 | Propriétaire |
|---|---|---|---|
| `CombatScreen` + `useCombat` + `ReinforcementPicker` | ~580 | **aucun** | n° 13 |
| `CharacterCreationScreen` | 378 | **aucun** | n° 10 / n° 11 |
| `XpShopScreen` | 252 | **aucun** | n° 11 |
| `EndScreen` + `HeroStatusBar` | 167 | **aucun** | n° 15 |

Phrase imposée : *« entre la n° 9 it4 et leur re-branchement, ces modules n'ont aucun producteur
d'interface — leur couverture ne vaut plus garantie d'usage »* (formule déjà employée par CLAUDE.md
pour l'arbre, réemployée plutôt qu'un troisième vocabulaire d'état).

### REJETÉS — à recopier tels quels au § 8

> **REJETÉ (PM)** — « le goal d'it4 tel qu'il est écrit peut entrer au plan » : il nomme 10 fichiers là où la fermeture transitive en exige ~22 (`player/types.ts:1` fait `AdventureDocument = PlayExport`, d'où `PlayerRuntime`, `PlayerModal`, `EditorScreen:43`). C'est une phrase de portée non mesurée entrant dans un plan — précisément ce que KR-258 interdit depuis BUG-124. Le goal se réécrit sur la fermeture mesurée, faute de quoi l'ouvrier arbitrera seul les 12 fichiers que le comité n'a pas nommés.

> **REJETÉ (PM)** — « la fermeture à ~22 fichiers est un élargissement de périmètre » : elle est la conséquence mécanique de la demande. Un périmètre borné aux 10 fichiers nommés laisse `tsc` rouge, donc ne livre rien. Ce n'est pas le périmètre qui a grossi, c'est le goal qui était sous-mesuré.

> **REJETÉ (PM)** — « les modules laissés sans consommateur par it4 (~1 380 lignes) restent décrits comme "conservés, branchés sur l'état de session" au roadmap § 0 bis » : cette ligne devient FAUSSE dans le commit même d'it4. La table s'amende dans le lot (étape 4 des Build Steps), avec un propriétaire de re-branchement PAR module et la phrase que CLAUDE.md emploie déjà pour l'arbre. Tolérer les orphelins est légitime ; les tolérer en silence fabrique une seconde zone morte non documentée.

> **REJETÉ (PM)** — « `src/player/utils/persist.ts` se range parmi les orphelins conservés » : son consommateur unique (`usePlaySession`) meurt dans cette itération, il duplique `PLAY_SESSION_KEY_PREFIX` sous un « must stay in sync … (KR-134) » que plus personne n'exécutera, et son remplaçant est livré depuis it2 (port `{ ecrire }` sur `Brain.sessions`). Il se SUPPRIME. Il est déjà dans la fermeture mesurée.

> **REJETÉ PAR AVANCE (PM)** — « découper it4 pour lui fabriquer deux phrases "à la fin, l'auteur peut…" » : déjà tranché au cadrage, et la dérogation est actée dans `resolved_decisions`. La coupe 4a/4b est d'une AUTRE nature — elle suit l'arc de dépendance mesuré et sert à rendre le lot `contrat` seul-et-premier exécutable sans seconde dérogation. Ne pas la refuser par le motif qui valait contre celle-là.

### Décisions prises en autonomie faute de spécification

- **Sort du CTA d'`EditorScreen`** non écrit → tranché : s'éteint sans compensation, perte mesurée à zéro (seuls des tests naviguent vers `{name:'editor'}`) → si l'inverse, un auteur perd sans préavis sa seule façon d'essayer un ancien livre-arbre : it4 devient une régression produit à compenser ou à annoncer.
- **Rien ne dit ce qui remplace la phrase de démo** → posé : la fiche de validation porte la **ligne de fermeture mesurée** (fichiers supprimés + orphelins avec propriétaire) → si l'inverse, la porte 2 humaine n'a rien à lire sur 22 fichiers, et la seule preuve disponible sera « les tests sont verts », que le critère n° 10 interdit de citer.
- **Pas de convention § 0 bis pour « conservé sans consommateur »** → réemploi de la formule CLAUDE.md → si l'inverse, on ajoute un 3ᵉ vocabulaire d'état à un index à 536 o de son plafond.
- **Rien ne dit si `N` reste à 4** → proposé `N=5`, avec engagement de retrait au tour 2 → si l'inverse, il faut assumer explicitement la dérogation à « tout lot `brain/` seul et premier » et l'inscrire au registre plutôt que la laisser se produire par le fait.
