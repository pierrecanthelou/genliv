# TOUR 2 — `ux-designer` — `moteur-dossier` it4

```
RÉPONSE À   — `tech-lead`, M8 : « EditorScreen cesse simplement de passer la prop, D-6 tenue sans
              effort ». Juste sur `EditorTopBar.tsx` (hors lot, zéro octet), INCOMPLET sur
              `EditorScreen.tsx`. Mesuré : `EditorTopBar.tsx:71` porte le défaut
              'Aperçu du jeu — mode lecture (hors éditeur)'. Retirer `onPreview` SANS passer de
              raison laisse la barre du livre-arbre décrire en infobulle un mode qui n'existe plus
              après it4 — faute de registre livrée par omission. M8 ne coûte aucun fichier de plus :
              `EditorScreen.tsx` est déjà en (M) au lot ; il manque UNE ligne.

MES OBJECTIONS
  • Dette `EditorTopBar.test.tsx` — RÉDUITE par M-2 : correction de COMMENTAIRE SEUL (l.79-80),
    zéro assertion touchée, `EditorTopBar.tsx` intouché.
  • REJETÉ 1 (le bouton ne disparaît pas) — MAINTENU, renforcé par M8.
  • REJETÉ 2 (ne pas corriger l.71 en it4) — MAINTENU : M-2 mesure que le défaut reste VRAI en
    isolation ; seul son appelant disparaît.
  • REJETÉ 3 (les 5 écrans non consignés comme référence) — MAINTENU.
  • REPORTÉ n° 10, compteur d'alertes — MAINTENU.
  • REPORTÉ n° 10, règle ESLint R1 — MAINTENU, MOTIF RE-MESURÉ : après it4, 6 → 2 occurrences,
    1 fichier (`CombatScreen.tsx:264,268`), hors de tout lot.

PROPOSITION — P2 confirmée : `RAISON_APERCU_LIVRE` dans `src/EditorScreen.tsx`, lot unique.
              `EditorTopBar.test.tsx` au même lot, commentaire seul. P1 INCHANGÉE par C3/C4 :
              annexe C de la revue, due au geste de doc de l'étape 4, et INSCRITE À LA DÉFINITION
              DE FINI — sinon rien ne la rend constatable.
              C6 : AUCUNE exigence UX. Mesuré : `HeroStatusBar.tsx:33-44` affiche bien les PE, mais
              son unique consommateur est `PlayerRuntime.tsx` (7 sites), supprimé — après it4,
              ZÉRO surface n'affiche les PE. Rien d'affiché ne cesse d'être vrai.

VERDICT     — recevable sous réserve
```

## A. P2 — texte exact, place exacte, lot

**Fichier** : `src/EditorScreen.tsx`, déjà **(M)** au lot. **Place** : constante de module.

```ts
const RAISON_APERCU_LIVRE =
	"Aperçu indisponible — un livre ne se joue plus ; l'aperçu se lance depuis un dossier d'aventure."
```

À `EditorScreen.tsx:59`, `onPreview={handlePreview}` est **remplacé** par
`previewDisabledReason={RAISON_APERCU_LIVRE}`. **Une substitution, ligne pour ligne.**

| État | Rendu | Source |
|---|---|---|
| défaut | bouton « Aperçu du jeu ▷ » **présent et désactivé** | `EditorTopBar.tsx:126` |
| survol | infobulle native = `RAISON_APERCU_LIVRE` | attribut `title` |
| sélectionné / erreur / vide | **sans objet** | — |

**Clavier** : `<button disabled>` sort de l'ordre de tabulation, aucun piège de focus. Zéro octet de
`EditorTopBar.tsx` (D-6 tient), zéro jeton nouveau.

### A bis — la chaîne entre SANS TÉMOIN (fait mesuré, porté au comité)

`src/EditorScreen.test.tsx` **n'existe pas** ; `rg 'Aperçu' tree-canvas/tests/TreeCanvas.test.tsx` →
aucune occurrence. **Aucun test ne rend `EditorScreen`.** `RAISON_APERCU_LIVRE` atterrit donc **non
épinglée**. L'UX **n'en fait pas une exigence** mais nomme l'option : C3 libère un emplacement de
fichier, et un témoin assertant « le bouton est désactivé et porte `RAISON_APERCU_LIVRE` » serait
**rouge aujourd'hui** — pouvoir séparateur sans mutant, la propriété même que la QA revendique pour
C.4. **Réserve honnête : le coût du harnais n'est PAS mesuré** (`EditorScreen` exige un brain + un
livre ouvert). Arbitrage `qa`/`tech-lead`. **Si écarté, la revue écrit que le texte est livré non
épinglé — jamais qu'il est vérifié.**

## B. `EditorTopBar.test.tsx` — correction de COMMENTAIRE SEUL

M-2 mesure ce que l'UX refusait de déduire : le cas l.72-82 rend `EditorTopBar` **directement**, it4
ne change **aucune** de ses entrées, il **reste vert**, son assertion reste **juste**. Seul le
commentaire l.79-80 devient faux.

**Remplacement exact des lignes 79-80** (indentation par tabulation) :

```tsx
		// Le DÉFAUT du composant, épinglé en ISOLATION : depuis la n° 9 it4, plus aucun
		// écran ne s'en remet à lui — l'écran livre-arbre passe `RAISON_APERCU_LIVRE`,
		// l'écran dossier sa propre raison. Ce cas garde sous témoin le défaut de
		// `EditorTopBar.tsx:71` tant que D-6 ne l'a pas corrigé.
```

**Propriété** : `src/brain/components/EditorTopBar.test.tsx` entre au lot unique, **(M), commentaire
seul**. C'est le lot qui écrit `EditorScreen.tsx`, donc celui qui rend la phrase fausse.

## C. P1 — la table issue→jeton, **corrigée d'une imprécision du tour 1**

**Place** : `.claude/raffinage/moteur-dossier-it4.revue.md`, annexe C. **Lot** : **aucun lot de
code** — due par le **geste de doc de l'étape 4**, même commit. **Demande formelle** : l'ajouter en
**point 6 de la définition de fini** — sans cela rien ne la rend constatable, et une table qu'on
oublie n'a jamais existé.

L'abandon du test-grep et le lot unique ne la touchent pas : elle ne crée aucun fichier et **ne
touche pas `OutcomeBlock.tsx`** — `outcomeBlock.test.tsx:44-54` lit `OutcomeBlock.tsx` et asserte
`not.toContain('--good')`, `not.toContain('--bad')`, `not.toContain('8.5px')` : pouvoir séparateur
**intégralement conservé**.

**CORRECTION QUE L'UX DOIT À SON PROPRE TOUR 1** — elle écrivait « épaisseur de filet : `--bw-hair` »
comme si la source le portait. **Faux** : `TrapScreen.tsx:111` écrit **`1px` en dur**. Le jeton
existe (`spacing.css:31`) mais la source ne l'emploie pas.

```
Issue d'un jet — rendu de référence (source : TrapScreen.tsx:105-129, supprimé par la n° 9 it4)

MESURÉ DANS LA SOURCE SUPPRIMÉE
  bloc         : padding --space-6 --space-8 · rayon --r-md
  bordure      : 1px EN DUR + couleur --good (réussite) / --bad (échec)   ← NE PAS RECOPIER
  fond         : --good-bg (réussite) / --bad-bg (échec)
  libellé      : --font-mono · --fs-meta · --fw-semibold · --track-eyebrow · uppercase
                 couleur --good / --bad · marge basse --space-2
  textes       : « Réussite » / « Échec »  (registre INTERFACE)
  prose        : --fs-body · --text-body
  appendice XP : « +N XP », marge gauche --space-4

PRESCRIT AU REPRENEUR (n° 11)
  l'épaisseur de filet s'écrit --bw-hair (tokens/spacing.css:31), JAMAIS 1px.
  Destinataire : la prop `variant` d'OutcomeBlock (docstring l.13-19) — elle n'existe
  délibérément pas avant son premier appelant de jet.
  NE PAS re-dériver depuis « Wireframes.dc.html » l. 511 : hexadécimaux.
  Jetons vérifiés : colors.css:44 (--good), :45 (--good-bg), :51 (--bad), :52 (--bad-bg) ;
  spacing.css:31 (--bw-hair).
```

## D. C6 — mesuré, et **sans objet côté UX**

| Question | Mesure |
|---|---|
| `HeroStatusBar` affiche-t-il les PE ? | **OUI** — `HeroStatusBar.tsx:33-44`, `PE {hero.pe}/{hero.peMax}` |
| Qui le monte ? | **`PlayerRuntime.tsx` seul** — 7 sites ; `rg HeroStatusBar src/` → aucun autre |
| Une surface dossier affiche-t-elle les PE ? | **NON** |

`PlayerRuntime.tsx` étant supprimé par it4, `HeroStatusBar` perd son unique consommateur **dans le
même commit**. Après it4, **aucune surface n'affiche les PE** : il n'existe pas d'écran où « +5 PE
par transition » cesserait d'être vrai sous les yeux d'un joueur. **La perte est entièrement une
perte d'implémentation de règle** — terrain du `narratif-ia` (KR-130). L'UX **soutient son bandeau
sans le doubler d'une exigence d'interface** : une jauge de PE affichée sans moteur qui la fasse
bouger serait un décor.

## E. Contribution à C8 — **une lecture, PAS une mesure**

Lecture intégrale d'`outcomeBlock.test.tsx` (59 l.) : trois assertions négatives de balayage
(`not.toContain('--good')`, `'--bad'`, `'8.5px'`) et une positive (l.57,
`toContain('{ entete, children }: OutcomeBlockProps')`) ; **aucune aiguille ne contient de saut de
ligne**, donc un `\r` en fin de ligne ne peut ni créer ni détruire ces sous-chaînes. **Paraît
immunisé au défaut CRLF** — écrit comme **lecture structurelle**, qui **ne remplace pas le run**.
Différence de forme instructive : `contexte.test.ts` échoue parce qu'il cherche des sous-chaînes
**multi-lignes** ; un balayage à aiguilles **mono-ligne** y survit.

## F. Refus et reports — à recopier tels quels au § 8

> **REJETÉ (UX)** — faire **disparaître** le bouton « Aperçu du jeu ▷ » de la barre du livre-arbre en it4. Le rendre conditionnel exige de modifier `EditorTopBar.tsx`, gelé par D-6, pour un écran sans aucun point d'entrée d'interface (mesuré : `LibraryScreen.tsx:78-80`, zéro `navigate({name:'editor'})` en production). L'analogie avec `nodeCount`/`onAddNode` ne tient pas : là le nœud n'existe pas dans le contexte dossier ; ici l'aperçu existe, il a déménagé. **Une affordance dont l'objet a déménagé se désactive en disant où, elle ne s'efface pas.**

> **REJETÉ (UX)** — corriger le défaut `previewDisabledReason` de `EditorTopBar.tsx:71` en it4. D-6 tient, et **M-2 mesure que ce défaut reste VRAI** — `EditorTopBar.test.tsx:72-82` le rend en isolation et reste vert. Après it4 il n'a plus d'appelant : les deux écrans passent leur propre raison. Sa correction voyage avec le lot D-6.

> **REJETÉ (UX) — NOUVEAU au tour 2** — « `EditorScreen` cesse simplement de passer `onPreview`, sans passer de raison » (tech-lead, M8). Mesuré : `EditorTopBar.tsx:71` porte le défaut `'Aperçu du jeu — mode lecture (hors éditeur)'`, qui décrit **un mode que la même itération supprime**. Omettre la raison livre, en infobulle et sans qu'aucun test ne rougisse, une phrase fausse sur la surface la plus visible de l'écran. M8 est juste sur `EditorTopBar.tsx` (hors lot) et incomplet sur `EditorScreen.tsx` : il manque `previewDisabledReason={RAISON_APERCU_LIVRE}`, **une ligne, dans un fichier déjà au lot**.

> **REJETÉ (UX)** — consigner le code des 5 écrans supprimés comme référence visuelle. `ChoiceList.tsx:56-63,130-137` mute `e.currentTarget.style` au survol (interdit par § *Hover-reveal row actions*) et écrit `1px` au lieu de `--bw-hair` : le conserver comme modèle propagerait l'anti-patron. Seule la table issue→jeton de `TrapScreen.tsx:105-129` est consignée (P1).

> **REPORTÉ à la n° 10 (UX)** — le compte d'alertes non bloquantes pendant une partie. Le compteur « ⚠ N avertissements » de `PlayerModal.tsx:62-69` meurt sans remplaçant en session. Sa mort est un **gain net** : `PlayerModal.tsx:64` le teinte en `var(--bad)`, jeton réservé à l'**échec d'un jet**, et sa `title` écrit `avertissement(s)` alors que `plural()` est importé deux lignes plus haut. **Contrainte si la n° 10 le reprend** : jamais `--bad` ni `--good` — `--text-muted`, mono `--fs-meta`, glyphe `⚠`.

> **REPORTÉ à la n° 10 (UX) — motif RE-MESURÉ** — la règle ESLint R1 (`onMouseEnter`/`onMouseLeave`). Avant it4 : **6 occurrences, 2 fichiers**. **Après** it4 : `ChoiceList.tsx` part avec ses 4, il reste **2 occurrences dans 1 seul fichier** — `CombatScreen.tsx:264,268`, orphelin survivant **hors de tout lot d'it4**. Poser la règle ici exigerait toujours un `overrides` visant **un unique fichier qu'on n'a pas le droit d'ouvrir**. Elle se pose **à coût nul** en n° 10.

> **CONSIGNÉ (UX)** — `HeroStatusBar.tsx:11` et `:37` teintent les jauges PV/PE en `--good`/`--bad`, **mêmes couleurs sémantiques que l'issue d'un jet**, sur un module qui **survit** en orphelin. it4 ne l'ouvre pas. Le repreneur (n° 10/11) ne recopie pas cette jauge : un seuil bas n'est pas un échec de jet. Même famille : `CombatScreen.tsx:81,122,300`, `CharacterCreationScreen.tsx:311`, `EndScreen.tsx:11,13`.

## G. Décisions prises en autonomie faute de spécification

- **Commentaire de remplacement d'`EditorTopBar.test.tsx:79-80`** → écrit mot pour mot → si on se contente de supprimer les deux lignes, l'assertion l.81 reste sans justification et le prochain lecteur la prendra pour un doublon du cas l.84 : elle sera supprimée à la première revue qui compacte.
- **`RAISON_APERCU_LIVRE` épinglée ou non** → option nommée, arbitrage laissé à la QA faute d'avoir mesuré le harnais → si personne ne tranche, le texte entre non épinglé et la revue doit l'écrire comme tel, jamais le compter vérifié.
- **De quel côté tombe C6** → « sans objet » côté UX, sur la mesure que `HeroStatusBar` perd son unique consommateur dans le même commit → si l'inverse, it4 livrerait une jauge que plus aucun code ne fait bouger.
- **Sort de P1 après l'abandon du test-grep** → inchangée mais **promue à la définition de fini** → sinon elle se perd comme le refus de `dossier-controles` it1 que la skill cite (BUG-082) : une conclusion survit à la condensation, la pièce jointe non.
- **L'imprécision `--bw-hair` du tour 1** → corrigée, en séparant *mesuré dans la source* de *prescrit au repreneur* → laissée telle quelle, la n° 11 aurait recopié une table affirmant qu'un jeton était employé là où la source écrivait `1px`.
