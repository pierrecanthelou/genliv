# TOUR 1 — `ux-designer` — `moteur-dossier` it4 (démolition)

```
RISQUE      — Le cadrage me fait arbitrer un texte d'infobulle sur un écran QU'AUCUN AUTEUR
              NE PEUT ATTEINDRE. Mesuré : `LibraryScreen.tsx:78-80` dit que les anciens livres
              « ne s'affichent plus », AUCUN `navigate({name:'editor'})` en production (6 sites,
              tous des tests), `BrainContext.tsx:86` = `createRouter(options.initialRoute)`, aucune
              persistance de route — `App.tsx:24` l'écrit déjà « chemin mort ». Le vrai risque UX
              d'it4 est ailleurs : le SEUL rendu tokenisé d'une issue de jet du dépôt
              (`TrapScreen.tsx:111-126`) part à la benne alors qu'`OutcomeBlock` n'a
              délibérément pas de `variant` (docstring l.13-19, en attente de la n° 11), et que
              le wireframe ne porte ce motif QU'EN HEXADÉCIMAL (l. 511). Après it4, la n° 11
              n'a plus qu'une source : des hex interdits de recopie. C'est mon veto de demain.
OBJECTION   — La question 3 du cadrage (« la référence vit-elle ailleurs ? ») a une réponse
              mesurée et NÉGATIVE pour la sortie de jet : les wireframes ne montrent que la
              surface AUTEUR. La suppression n'est donc pas sans perte, et la perte n'est pas
              un écran — c'est une TABLE DE CORRESPONDANCE de six lignes.
PROPOSITION — P1 : 6 lignes dans `.claude/raffinage/moteur-dossier-it4.revue.md` (table
              issue→jeton, annexe C). Coût : 0 ligne de code, 0 fichier créé ; ne touche pas
              `OutcomeBlock.tsx`, donc le balayage de source d'`outcomeBlock.test.tsx` garde
              tout son pouvoir. P2 : UNE chaîne dans `EditorScreen.tsx` (déjà dans la liste
              it4), texte exact en annexe A. D-6 N'EST PAS ROUVERT : la prop existe
              (`EditorTopBar.tsx:48`), zéro octet d'`EditorTopBar.tsx` modifié.
VERDICT     — recevable sous réserve (P1 et P2 au plan, P1 dans le lot qui supprime les écrans).
```

## A. `EditorScreen` perd `handlePreview`

Le défaut `'Aperçu du jeu — mode lecture (hors éditeur)'` n'a jamais été une RAISON (c'est un
descripteur de mode) et après it4 il décrit un mode qui n'existe plus. Il devient aussi **sans
lecteur** : les deux appelants passent la prop explicitement.

**Texte exact imposé, dans `src/EditorScreen.tsx`** (registre INTERFACE, phrase complète, même forme
que les `Controle.message` côté dossier) :

```ts
const RAISON_APERCU_LIVRE =
	"Aperçu indisponible — un livre ne se joue plus ; l'aperçu se lance depuis un dossier d'aventure."
```

Passé tel quel : `previewDisabledReason={RAISON_APERCU_LIVRE}`, sans `onPreview`. Aucun jeton
nouveau, aucun composant nouveau, aucune valeur en dur.

**Le bouton ne disparaît pas** : le rendre conditionnel exige de modifier `EditorTopBar.tsx`, gelé
par D-6. L'analogie avec `nodeCount`/`onAddNode` (« affordance sans objet ») **ne tient pas** : là le
nœud n'existe pas dans le contexte dossier ; ici l'aperçu existe, il est ailleurs. *Une affordance
dont l'objet a déménagé se désactive en disant où, elle ne s'efface pas.*

**Dette constatée, propriété de lot à statuer par le tech-lead** — `EditorTopBar.test.tsx:73-82`
épingle le défaut mot pour mot en le justifiant par « la moitié "écran Book" du critère #5 ». Le test
rend `EditorTopBar` DIRECTEMENT (l.74), donc it4 ne change aucune de ses entrées — **affirmation de
couleur à MESURER, l'UX est en lecture seule**. Ce qui devient faux est son COMMENTAIRE (l.79-80).

## B. Ce qui meurt avec `PlayerModal`

| Ce qui meurt | Sort | Preuve |
|---|---|---|
| Sortie par `Échap` | **REPRIS**, à l'identique | `CadrePartie.tsx:36-42`, docstring : « recopié de `PlayerModal.tsx:18-27` » |
| « ✕ Quitter le test » | **REPRIS** mot pour mot | `CadrePartie.tsx:22, 57` |
| En-tête « Aperçu du jeu » | **REPRIS**, enrichi du titre du dossier | `CadrePartie.tsx:21, 45-55` |
| `role="dialog"` / `aria-modal` | **ABANDONNÉ À RAISON** — une route est une page | `EcranPartie.tsx:22-29` |
| Compteur « ⚠ N avertissements » | **PERDU, SCIEMMENT — gain net** | ci-dessous |

`PlayerModal.tsx:64` teinte le compteur en `var(--bad)` — jeton **réservé à l'échec d'un JET**, l'une
des deux seules couleurs sémantiques du projet. Un compte d'avertissements structurels n'est pas un
échec de jet : usage décoratif d'une couleur sémantique. Sa `title` (l.65) écrit `avertissement(s)`
alors que `plural()` est importé deux lignes plus haut. **Sa mort est un gain net.**

Non couvert après it4 : les contrôles `alerte`/`info` **non bloquants** ne sont visibles nulle part
pendant une partie. → REPORTÉ n° 10 (voir § F).

## C. P1 — la table issue→jeton, seul exemplaire tokenisé du dépôt

Source `TrapScreen.tsx:111-126` et `DecorScreen.tsx:129-134`, à recopier dans la revue d'it4 :

```
Issue d'un jet — rendu de référence (source : TrapScreen.tsx:111-126, supprimé en it4)
  réussite : bordure --good      · fond --good-bg   · libellé « Réussite »
  échec    : bordure --bad       · fond --bad-bg    · libellé « Échec »
  épaisseur de filet : --bw-hair   rayon : --r-md
  Destinataire : la prop `variant` d'OutcomeBlock, n° 11 (OutcomeBlock.tsx:13-19).
  NE PAS re-dériver depuis « Wireframes.dc.html » l. 511 : les valeurs y sont en hexadécimal.
```

Jetons **vérifiés présents** : `tokens/colors.css:44-54`, `spacing.css:31`. Écrire cette table dans
un `.md` **ne touche pas** `OutcomeBlock.tsx` : le balayage de source d'`outcomeBlock.test.tsx`, qui
vérifie l'ABSENCE de ces jetons dans le composant, conserve son pouvoir séparateur.

**À NE PAS consigner, motivé** : `ChoiceList` — son état vide est déjà remplacé *par mieux*
(`ConsoleCommandes.tsx:43` « Aucun accès depuis ce lieu… », cause + conséquence, contre
`ChoiceList.tsx:100` « Pas de sortie depuis cet écran. » — vocabulaire d'arbre) ; son survol
(l.56-63, 130-137) mute `e.currentTarget.style`, **violation frontale** du motif *Hover-reveal row
actions*, plus `1px` au lieu de `--bw-hair` ; `DecorScreen` — la n° 10 ne rejoue pas une
« interaction de décor », le dossier a `nom` + `description_joueur`, motif non transposable.

## D. États vides et clavier — **rien ne régresse, mesuré**

`EditorScreen.tsx:25-33` garde « Livre introuvable. » ; les orphelins de `src/player/` ne rendent
plus rien (zéro surface, zéro état vide dû) ; `EcranPartie.tsx:171-177` (journal vide, `⬚`,
`--border-field` pointillé) et `ConsoleCommandes.tsx:43` couvrent tout ce que la démolition
découvre. Clavier : `Échap` repris, `Entrée` soumet nativement la console
(`ConsoleCommandes.tsx:19-20`), focus repris par remontage sur `key={session.horloge.tour}`
(`EcranPartie.tsx:197-198`). La règle « le focus revient au déclencheur » disparaît **légitimement**
avec la modale — une route démonte son déclencheur. **Pas d'objection clavier.**

## E. Règles ESLint

- **R1 — `no-restricted-syntax` sur `onMouseEnter|Leave|Over|Out`**, message FR renvoyant à
  `docs/WORKFLOW.md` § Hover-reveal row actions. **Mesure : 6 occurrences, 2 fichiers** —
  `ChoiceList.tsx` (4, supprimé par it4) et `CombatScreen.tsx` (2, **survivant orphelin**). Donc
  **pas à coût nul en it4** → **à poser en n° 10**, dans le lot qui rend un consommateur à
  `CombatScreen`. Poser en it4 une règle qui exige un `overrides` d'un fichier est du bruit.
- **R2 — aucune règle neuve sur les jetons** : la règle hex/rgb existante couvre le seul risque
  (recopier les hex du wireframe l. 511). Le garde-fou qui manque n'est pas un linter, c'est P1.

## F. Refus motivés — à recopier tels quels au § 8

> **REJETÉ (UX)** — faire DISPARAÎTRE le bouton « Aperçu du jeu ▷ » de la barre du livre-arbre en it4. Le rendre conditionnel exige de modifier `EditorTopBar.tsx`, gelé par D-6 tant que le relevé navigateur de l'infobulle n'existe pas, et ce pour un écran sans aucun point d'entrée d'interface (mesuré : `LibraryScreen.tsx:78-80`, zéro `navigate({name:'editor'})` en production, pas de persistance de route). L'analogie avec `nodeCount`/`onAddNode` ne tient pas : une affordance dont l'objet a déménagé se désactive en disant où, elle ne s'efface pas.

> **REJETÉ (UX)** — corriger le défaut `previewDisabledReason` de `EditorTopBar.tsx:71` en it4. D-6 tient : it4 n'apporte pas la prémisse mesurée qui le lèverait. Le défaut devient menteur MAIS sans appelant (les deux écrans passent la prop) ; sa correction voyage avec le lot D-6.

> **REJETÉ (UX)** — consigner le code des 5 écrans supprimés comme référence visuelle. `ChoiceList.tsx:56-63,130-137` mute `e.currentTarget.style` au survol (interdit par le motif établi de `WORKFLOW.md`) et écrit `1px` au lieu de `--bw-hair` : le conserver comme modèle propagerait l'anti-patron. Seule la table issue→jeton de `TrapScreen.tsx:111-126` est consignée (P1).

> **REPORTÉ à la n° 10 (UX)** — le compte d'alertes non bloquantes pendant une partie. Le compteur « ⚠ N avertissements » de `PlayerModal.tsx:62-69` meurt sans remplaçant en session (le panneau « Contrôles » de l'éditeur le couvre hors session). Contrainte posée dès maintenant si la n° 10 le reprend : jamais `--bad` ni `--good`, réservés à la réussite et à l'échec d'un jet — `--text-muted`, mono `--fs-meta`, glyphe `⚠`.

> **REPORTÉ à la n° 10 (UX)** — la règle ESLint R1 interdisant `onMouseEnter`/`onMouseLeave` (survol en CSS seul). Mesure : 6 occurrences, 2 fichiers, dont `CombatScreen.tsx` (2) qui SURVIT à it4 en orphelin. Poser la règle en it4 exigerait un `overrides` d'un seul fichier dans une démolition.

## G. Décisions prises en autonomie faute de spécification

- **Le texte de remplacement de l'infobulle du livre-arbre n'était écrit nulle part** → écrit `"Aperçu indisponible — un livre ne se joue plus ; l'aperçu se lance depuis un dossier d'aventure."`, passé depuis `EditorScreen.tsx` → si on laisse le défaut menteur, le coût est un texte faux dans le dépôt, invisible jusqu'au jour où quelqu'un rouvre la route et le cite comme vrai.
- **Le cadrage ne disait pas OÙ consigner un motif avant suppression** → choisi la revue d'itération plutôt que la spec → mettre la table dans la spec coûte ~400 o sur un fichier dont le plafond est à 65 kio, pour une donnée que seule la n° 11 relira.
- **Personne n'avait tranché si la mort du compteur d'avertissements était une perte ou un gain** → déclarée **gain net** (usage décoratif de `--bad`), besoin réel reporté n° 10 → si c'était une perte, un auteur joue une aventure portant des alertes non bloquantes sans en être averti pendant la session ; il les voit toujours dans « Contrôles » côté éditeur.
- **La propriété du commentaire périmé d'`EditorTopBar.test.tsx:79-80`** → attribuée à aucun lot, remontée au tech-lead → si personne ne la prend, une justification fausse reste dans un test vert, exactement le mode de panne que la skill décrit.
