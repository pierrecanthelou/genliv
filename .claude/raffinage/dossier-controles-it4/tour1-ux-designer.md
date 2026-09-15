# Tour 1 — `ux-designer`

> Deux invocations (session interrompue puis relancée). **Elles convergent** sur l'essentiel ; les divergences sont listées au § F et restent à trancher au tour 2. La seconde est la mieux mesurée (elle a lu `src/style.css` et vérifié que `Chip` n'est jamais implémenté) et fait foi là où elles diffèrent.

RISQUE — Un `<li onClick>` romprait l'opérabilité clavier et serait un **composant maison**, alors que `ListRow` a déjà résolu exactement ce problème (bouton natif, Tab/Entrée gratuits, zéro `onKeyDown`). Second risque : le clic route vers `Controle.section` — la section qui SUBIT — et **un libellé d'affordance verbal** (« Corriger », « Résoudre ») **mentirait sur ce que fait réellement le clic**.

OBJECTION — Le PM propose de régler la tension n° 2 **uniquement dans le plan**. **Insuffisant sur mon terrain** : une phrase de plan n'atteint jamais l'auteur au clavier, et it3 a déjà écrit la bonne section dans QUOI FAIRE (« Personnages → Savoirs ») — un clic qui l'emmène ailleurs **sans le dire avant le clic** contredit sa propre prose et casse la confiance dans l'affordance. Ce n'est pas un veto : l'affordance déjà due suffit à le résoudre **à coût nul**, si son texte nomme la section EXACTE où le clic mène.

PROPOSITION — Garder l'anatomie CALQUE d'it1/it3, déplacer **tout** le contenu dans un `<button type="button">` pleine largeur, le `<li>` ne gardant que le filet de séparation. Ajouter un trailing **honnête** : `→ {Titre de la section}`, **jamais un verbe**.

VERDICT — **recevable sous réserve.** Réserve non négociable : le trailing `→ {section.titre}` entre au plan **mot pour mot**, pas comme une intention. Tension n° 3 confirmée **fausse alerte, sans réserve**.

## A. Composant touché

`ListeControles.tsx` seul. **Aucun composant nouveau**, aucune primitive `brain/components/` à créer — un seul appelant, KR-109 s'y oppose toujours. `SectionNav.tsx` et `ListRow.tsx` : **zéro changement de design**. `ListRow` a résolu ce problème pour la nav ; `ListeControles` applique la **même stratégie** (bouton natif), pas le même composant — son anatomie à trois étages ne rentre pas dans `title`/`subtitle`/`trailing`, décision déjà actée à it1.

> Mesuré : `Chip` existe au wireframe mais **n'a jamais été implémenté** (0 fichier, 0 appelant). L'introduire ici pour UN appelant contredirait la discipline KR-109 que cette feature a déjà appliquée trois fois (`pastilles.ts`, `ListRow`, `IssueList`).

## B. Anatomie exacte

**Ce qui porte l'action** : un `<button type="button">` neuf, **pleine largeur**, enveloppant la **totalité** du contenu (pastille + colonne OÙ/QUOI/QUOI FAIRE + trailing). Tout le rectangle de la ligne devient cible — c'est déjà l'affordance visuelle actuelle, le bouton ne fait que **la rendre vraie au clavier**.

**Ce qui reste hors du bouton** : le `<li>` seul, réduit à son rôle de séparateur — il ne porte plus `padding`/`gap`/`alignItems` (transférés au bouton), **seulement** la `borderBottom` conditionnelle existante. La `key` reste sur le `<li>`.

Reset du bouton : `border: none`, `background: transparent`, `width: 100%`, `textAlign: left`, `cursor: pointer`. **Motif** : `ListRow` dessine une carte bordée parce que c'est SA hiérarchie ; ici la hiérarchie reste celle d'`IssueList` — un filet de conteneur sur le `<ul>` et des filets internes, **jamais une carte par ligne**.

`whereStyle` / `whatStyle` / `whatToDoStyle` / `colonneStyle` : **inchangés**, jetons déjà validés it1/it3.

| État | Traitement | Jeton |
|---|---|---|
| Défaut | fond transparent, filet entre lignes | `--border-divider`, `--r-md` (sur `<ul>`) |
| Survol | **aucun changement** — `cursor: pointer` seul *(doctrine `ListRow` reconduite ; voir § F)* | — |
| Focus clavier | **hérité gratuitement** de `src/style.css` l. 36-39 : `:focus-visible { outline: 2px solid var(--focus-ring); outline-offset: 2px }` — **aucun code à ajouter** | `--focus-ring` |
| Actif | natif du navigateur | — |
| Sélectionné | **sans objet** — une ligne ne devient jamais courante : cliquer en sort | — |

**Aucun `--accent`** dans ce composant : la discipline de l'accent est respectée.

## C. Le texte de l'affordance — mot pour mot

```
→ {section.titre}
```

- `→` : glyphe Unicode déjà au catalogue (« flow »), jamais un SVG.
- `{section.titre}` : **dérivé**, jamais recopié — `SECTIONS.find(s => s.id === controle.section)?.titre`, `SECTIONS` étant déjà exportée du baril et déjà consommée par `SectionNav`. **Une table de libellés locale serait une seconde vérité divergente de `sections.ts`.**
- Jetons : `fontFamily: var(--font-mono)`, `fontSize: var(--fs-eyebrow)`, `letterSpacing: var(--track-eyebrow)`, `color: var(--text-faint)`. Position trailing (`marginLeft: auto`, la colonne gagnant `flex: 1; minWidth: 0` — même mécanique que `texts` dans `ListRow`).
- **Registre : aucun verbe.** Ni « Corriger », ni « Résoudre », ni « Aller régler » — **seulement la destination nommée**. C'est le dispositif qui neutralise la tension n° 2 : il ne promet jamais « voici le remède », il dit « voici où c'est classé » — cohérent avec ce que le badge dit déjà depuis it2.
- **Pas d'`aria-label` distinct** : le bouton porte déjà tout le texte visible comme contenu.

> Ce même `<span>` répond **aux deux exigences** — « la ligne mène quelque part » **et** « le rendu dit où, avant le clic ». Un seul ajout, pas deux.

**Callback attendu** (forme au tech-lead) : `onSelectSection: (section: SectionId) => void`, **REQUISE** — `Controle.section` est non-optionnel au contrat `brain/`, donc toute ligne peut naviguer ; un chemin conditionnel serait un chemin non testé (doctrine `niveauxParSection`, it2).

## D. Clavier

**Tab** : chaque ligne est un `<button>`, arrêt de tabulation natif, ordre DOM = ordre visuel. **Entrée / Espace** : natifs, **pas de `onKeyDown` maison** — même stratégie que `ListRow`. **Échap** : sans objet, ce n'est pas une modale.

**Point signalé, non mandaté** : au clic, le panneau se démonte, donc le `<button>` focalisé disparaît et le focus retombe sur `<body>`. Le déplacer vers la ligne de nav atteinte serait un ajout de portée — signalé pour ne pas être découvert en revue comme un oubli. *(Rejoint R8 du tech-lead.)*

## E. Tensions 3 et 2

**Tension n° 3 — fausse alerte confirmée, sans réserve.** Le rendu exclusif n'est pas une régression : c'est **déjà le paradigme des dix autres sections** — cliquer « Personnages » cache déjà « Indices ». Deux éléments l'atténuent sans rien ajouter : l'entrée « Contrôles » est un second `<nav>` **permanent** livré à it1, et les **pastilles de `SectionNav` restent visibles** pendant que l'auteur travaille ailleurs — il perd le détail ligne à ligne, jamais la vue d'ensemble.

**Tension n° 2 — navigation utile, à condition que le texte reste honnête.** Le risque réel n'est pas la destination, c'est **le mot qui l'annonce**. Si un futur lot écrivait « Corriger → » ou réutilisait un fragment de QUOI FAIRE comme libellé, la contradiction deviendrait une vraie faute de registre.

## F. Divergences entre les deux invocations — à trancher au tour 2

| Point | Invocation 1 | Invocation 2 *(mieux mesurée)* |
|---|---|---|
| Survol | `background: var(--surface-sunken)`, **en CSS seul** (module CSS, jamais un `isHovered`) | **aucun survol** — `ListRow` n'en a pas, « un survol inventé ici divergerait du reste des surfaces de listes » |
| Casse du trailing | sentence case, **pas** de `textTransform` | `textTransform: 'uppercase'` → « → INDICES » |
| Couleur du trailing | `--text-label` (paire d'eyebrow, comme `whereStyle`) | `--text-faint` — « l'affordance ne doit pas concurrencer le constat » |
| Focus | ne pas poser `outline: none` ; `:focus-visible` optionnel | **mesuré** : la règle globale de `src/style.css` le donne déjà, **zéro ligne à écrire** |

*L'invocation 1 exige un module CSS pour le survol (les pseudo-classes n'existent pas en `CSSProperties`) ; l'invocation 2 le rend inutile en supprimant le survol. Le choix décide donc si ce lot introduit un fichier CSS ou non.*
