RISQUE — OBJECTION — PROPOSITION — VERDICT (tour 1, UX Designer, moteur-interprete it2)

RISQUE — Le seul `Chip` déjà présent dans le dépôt (`design_handoff_gamebook_editor/components/primitives/Chip.jsx`) est un jeton d'inventaire *retirable* : un `<span>` non focalisable dont seul le bouton `✕` interne reçoit le focus. Le porter tel quel pour les suggestions casserait l'opérabilité clavier promise par le cadrage (Tab ne l'atteindrait pas comme un tout, Entrée ne le déclencherait pas) — objection forte, pas un veto, mais à trancher avant l'essaim pour ne pas laisser un agent copier la référence par réflexe.

OBJECTION — Le texte de dégradation R3 (« Le récit n'a pas pu être généré ce tour-ci. ») est bien registre interface, cohérent avec `TEXTE_INDISPONIBLE`/`TEXTE_REFORMULER` déjà livrés en it1 — mais seulement s'il reprend leur MÊME patron de rendu (bannière `<p role="status">`, glyphe `⊘`, `--fs-meta`/`--text-muted`), jamais `OutcomeBlock`, dont le docstring dit explicitement « LE BLOC DE PROSE JOUEUR ». Le loger dans `OutcomeBlock` brouillerait la frontière que la feature elle-même défend (« AUCUN mélange dans un même composant »).

PROPOSITION — Voir annexe : `OutcomeBlock` réutilisé sans modification pour le récit (`entete="RÉCIT"`) ; `Chip` neuf rendu en `<button>` entier cliquable, feature-local, disjoint du `Chip.jsx` de référence (qui reste pertinent ailleurs, pour l'inventaire, pas ici) ; état vide de `suggestions[]` = rien affiché, pas de placeholder — ce n'est pas un champ d'auteur à amorcer, c'est une sortie IA optionnelle.

VERDICT — recevable sous réserve (Chip = `<button>` entier, dégradation R3 en bannière jamais en OutcomeBlock, focus visible via `--focus-ring`).

---

## ANNEXE — contrat de design exploitable

### 1. Bloc de récit — réutilise `OutcomeBlock` SANS modification

Le composant `src/features/play-mode/components/OutcomeBlock.tsx` (it1) est déjà exactement la bonne forme : `entete` (mono, majuscules) + `children` (prose verbatim, `pre-wrap`). Aucune prop `variant` à ajouter — son docstring l'interdit explicitement pour it1/it2 (l'axe réussite/échec de jet n'entre qu'en n°11). Ne PAS toucher ce fichier.

- **Entête** : `RÉCIT` (mono, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-label`) — même famille que `PRÉCISEZ`/`NON RECONNU` déjà livrés, un seul mot, jamais de ponctuation finale.
- **Contenu** : `avis.recit` rendu verbatim, 2e personne, présent (prose R3). Zéro transformation côté composant.
- **Condition de rendu** : seulement quand `avis !== null && avis.type === 'recit'` (nommage à trancher par le lot contrat — j'utilise `recit` par cohérence avec `clarification`/`non_reconnu`/`reformuler`/`refus_moteur` déjà en place dans `PlayerInputBar.tsx`). Jamais affiché avant la fin du tour (AC#6) — même précédent que les autres blocs conditionnels de ce fichier, pas de nouvel état à inventer.
- **Alternative rejetée** : bloc de récit sans entête (prose nue). Rejeté — `entete` est REQUIS par le composant existant (raison déjà actée : sans lui, la seule prose joueur de l'écran ne serait désignée par rien) et une prose non étiquetée à côté d'une console développeur et d'un champ interface romprait la lisibilité du registre dès le premier tour narré.

### 2. Suggestions — nouveau `Chip`, feature-local, PAS le `Chip.jsx` de référence

Fichier : `src/features/play-mode/components/Chip.tsx`. Anatomie distincte de la référence handoff (celle-ci reste un jeton d'inventaire retirable, hors périmètre) :

```
interface ChipProps {
  children: ReactNode      // libellé de la suggestion, verbatim R3, registre joueur
  onSelect: () => void     // remplit le champ ET soumet — jamais d'exécution directe
  disabled?: boolean       // reflète isLocked du tour en cours
}
```

- **Élément racine** : `<button type="button">`, jamais `<span>` — le chip ENTIER est la cible de clic/Tab/Entrée, pas un `onClick` posé sur un conteneur non interactif.
- **États et tokens** :
  - Repos : `border: var(--bw-hair) solid var(--border-card)`, `background: var(--surface-chip)`, `color: var(--text-strong)`, `borderRadius: var(--r-pill)`, `padding: var(--space-2) var(--space-4)`, `font-family: var(--font-ui)`, `font-size: var(--fs-sm)`. Pas d'accent au repos : l'accent ne décore pas une rangée entière de chips simultanés (règle 4).
  - Survol/focus-visible : `border-color: var(--accent-line)`, `background: var(--accent-bg)` — l'accent entre SEULEMENT comme affordance d'interaction, jamais en teinte de repos. Focus clavier rendu via `outline: 1.5px solid var(--focus-ring); outline-offset: 2px` (ergonomie clavier, pas a11y — exigée quand même : sans elle un auteur au clavier ne voit pas quel chip il va activer).
  - Désactivé (`disabled`, miroir de `isLocked`) : `opacity: 0.5`, `cursor: not-allowed` — même patron que `boutonVerrou` dans `PlayerInputBar.tsx`.
  - Cible : `minHeight: var(--hit-target)` non applicable tel quel à un chip en ligne (le patron `ListRow`/bouton utilise 44px pour des rangées pleine largeur) — ergonomie de rédaction ici = clavier, pas taille tactile (hors cadre) ; ne pas forcer 44px sur un chip en ligne, ce serait une extrapolation du wireframe, pas une exigence du cadrage.
- **Comportement** : `onSelect` doit recevoir le TEXTE de la suggestion directement (pas relire un `useState` juste posé), pour éviter la course d'état déjà annotée dans `PlayerInputBar.tsx` (`// on le vide manuellement...`) — remarque technique, à confirmer par le tech-lead, mais conditionne le libellé exact affiché après clic (le champ doit visuellement contenir le texte cliqué avant de se vider au succès).
- **Disposition** : ligne de chips en `display:flex; gap: var(--space-2); flex-wrap: wrap; margin-top: var(--space-3)`, SOUS le bloc `OutcomeBlock` du récit, jamais À L'INTÉRIEUR de son `children` (garde le contrat « prose seule » d'`OutcomeBlock` intact).
- **État vide** : `avis.suggestions.length === 0` → **ne rien rendre**, pas de conteneur vide, pas de chip pointillé « + … ». La règle projet des placeholders invitants vise les champs et listes D'AUTEUR ; ici c'est une sortie IA optionnelle et en lecture seule — un chip factice cliquable enverrait une action bidon au moteur. Alternative rejetée : chip pointillé « Continuez votre chemin… » — rejeté, ce serait un texte fictif inventé par le code, interdit par le garde-fou §2.8 n°1 (jamais de fiction improvisée par le code).

### 3. Dégradation R3 — bannière, jamais `OutcomeBlock`

Réutiliser EXACTEMENT le patron `bannierInterface` déjà dans `PlayerInputBar.tsx` (lignes ~108-130) : `<p role="status" style={bannierInterface}><span aria-hidden="true">⊘ </span>{TEXTE}</p>`.

- Texte : `Le récit n'a pas pu être généré ce tour-ci.` (déjà fixé au design_contract, ne pas le reformuler).
- NE PAS wrapper dans `OutcomeBlock` : ce texte est registre interface, pas prose joueur — `OutcomeBlock` est documenté comme réservé à la prose.
- NE PAS réutiliser `TEXTE_INDISPONIBLE` (« Le service est momentanément indisponible. ») : ce texte-là couvre un échec de R1 (rien ne s'est passé), alors que l'échec de R3 arrive APRÈS que la commande a déjà été exécutée et l'état déjà écrit (AC#6) — les deux situations ne sont pas interchangeables pour le joueur, même si les deux sont de registre interface. Deux constantes distinctes, toutes deux dans `PlayerInputBar.tsx` ou son successeur.

### 4. Registres — vérification

- `avis.recit` : joueur, 2e personne, présent. `avis.suggestions[]` : idem, ce sont des amorces d'action à la 2e personne (« Fouiller le coffre », pas « Le joueur fouille »).
- Aucune fuite d'identifiant technique (rang, id de lieu) dans le texte du chip — seul le libellé de surface que R3 a produit.

### 5. Décisions prises en autonomie faute de spécification

- **Nom du discriminant `avis.type` pour le récit** → j'ai supposé `'recit'` par cohérence avec `'clarification'`/`'non_reconnu'`/`'reformuler'`/`'refus_moteur'` déjà en place → si le lot contrat choisit un autre nom (ex. `'issue'`), seul un renommage mécanique dans `PlayerInputBar.tsx`, aucun impact sur le contrat visuel ci-dessus.
- **Chip sans `minHeight: var(--hit-target)`** → j'ai choisi de ne pas forcer 44px sur un élément en ligne, l'ergonomie retenue par le cadrage étant le clavier, pas la cible tactile → si l'inverse est souhaité (44px imposé), les chips multiples se espacent davantage et la ligne de suggestions devient plus haute ; pas de veto dans un sens ou l'autre, décision réversible sans casser le contrat.
- **Position de la ligne de suggestions (sous `OutcomeBlock`, hors de son `children`)** → choisi pour ne pas rouvrir le composant `OutcomeBlock` (garde KR-109/scope it1) → si l'inverse (chips dans `children`) est fait, `OutcomeBlock` devient un composant à deux responsabilités (prose + actions), ce qui est le genre de dérive que son propre docstring anticipe et refuse pour la variante réussite/échec.
- **Absence de tout rendu quand `suggestions[]` est vide** → choisi contre la règle générale des placeholders invitants, parce que celle-ci vise les surfaces d'auteur, pas une sortie IA en lecture seule → si l'inverse (chip factice) est fait, on viole le garde-fou §2.8 n°1 (fiction improvisée par le code) dès qu'un joueur clique dessus.

### 6. Règles ESLint proposées (comparaison code livré / contrat)

- Interdire l'import de `design_handoff_gamebook_editor/**` depuis `src/**` (déjà probablement couvert ailleurs, mais à vérifier nommément pour `Chip.jsx` — le risque identifié ci-dessus est justement qu'un agent copie-colle ce fichier).
- Règle ciblée sur `src/features/play-mode/components/Chip.tsx` : interdire tout élément racine autre que `button` dans le JSX retourné (via `no-restricted-syntax` sur l'AST, motif déjà utilisé dans ce projet pour les couleurs en dur) — empêche la régression vers un `<span>` non focalisable.
- Étendre la règle existante anti-couleurs-en-dur (déjà câblée projet) : elle couvre déjà `#hex`/`rgb()`/`hsl()` ; s'assurer qu'elle s'applique aussi aux nouveaux fichiers `Chip.tsx` et au bloc récit sans exemption.

Fichiers lus : `src/features/moteur-interprete/specification.json`, `src/features/play-mode/components/OutcomeBlock.tsx`, `src/features/play-mode/components/PlayerInputBar.tsx`, `design_handoff_gamebook_editor/components/primitives/Chip.{jsx,d.ts,prompt.md}`, `src/styles/tokens/{colors,spacing,typography}.css`, `src/brain/components/{Badge,ListRow,TargetPicker}.tsx`.
