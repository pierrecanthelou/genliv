## NOTE D'OUVERTURE — UX Designer — moteur-combat it3 (R5 commentateur)

**RISQUE** — Le récit est de la fiction (2e personne, présent) posée juste sous un log mécanique en `--font-mono`. Si on réutilise `texteLivre` (mono), l'auteur ne distingue plus l'interface de la fiction. Deuxième risque : le « silence » après échec contredit la règle « jamais de vide ». Troisième : l'indicateur d'attente invente un spinner et des keyframes qu'aucun token ne porte.

**OBJECTION**
1. Veto si le récit sort en `--font-mono`, en italique décoratif, ou avec `--accent` : l'accent marque la sélection, pas la fiction.
2. Veto si la zone d'échec rend un conteneur vide (hauteur, filet, bordure) : le silence est une *absence d'élément*, pas un vide. Sinon c'est un état vide non invitant.
3. Objection forte : une narration tardive ne doit jamais voler le focus (le focus va sur « Continuer » en fin de combat) ni bloquer « Jouer le round → ».
4. Objection : les 3 boutons de l'écran (`Jouer`, `Fuir`, `Continuer`) sont des `<button>` maison car `components/` n'a pas de primitive Button. Dette connue, non bloquante ici : on n'en ajoute pas un 4e.

**PROPOSITION**
- Récit = `<p>` en `--font-ui`, `--fs-body`, `--lh-loose`, `--text-body`, filet gauche `--bw-strong solid var(--border-rule)`. Pas d'éditeur, pas de `tabIndex`.
- Chargement = `Badge tone="muted"` « Le narrateur écrit… », sans animation (précédent : `SyncIndicator`). Il couvre le rejeu d'un seul tenant.
- Échec après rejeu : le Badge disparaît, rien ne le remplace.
- Appariement du récit par numéro de round, jamais par index.
- Aucune nouvelle variable CSS.

**VERDICT** — recevable sous réserve (réserves 1 à 3, détaillées dans le contrat ci-dessous).

---

## ANNEXE — CONTRAT DE DESIGN (hors quota)

Fichiers lus : `EcranCombat.tsx`, `tokens/{typography,colors,spacing}.css`, `brain/components/Badge.tsx`. Aucun § du wireframe n'a été consulté : le wireframe ne dessine pas d'écran de combat, donc je m'appuie sur les tokens et les primitives.

### Fragment touché : `JournalLigneRound` (dans `EcranCombat.tsx`)
Structure d'une ligne (ordre visuel = ordre de Tab, aucun élément focalisable ajouté) :
1. `ROUND {n}` — inchangé (mono, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-strong`).
2. Texte mécanique — inchangé (`--font-mono`, `--fs-body`, `--text-body`).
3. **Zone récit** (nouveau), selon l'état :

| État | Rendu | Tokens |
|---|---|---|
| Pas de récit demandé / échec après rejeu | **Rien dans le DOM.** | — |
| En cours (appel + rejeu) | `<Badge tone="muted">Le narrateur écrit…</Badge>`, dans un wrapper `role="status"` | primitive `Badge` seule, pas de CSS ajouté |
| Reçu | `<p>` avec le texte `narration` | voir ci-dessous |

Style du `<p>` récit :
- `margin: 0`
- `fontFamily: var(--font-ui)`
- `fontSize: var(--fs-body)`
- `lineHeight: var(--lh-loose)`
- `color: var(--text-body)`
- `borderLeft: var(--bw-strong) solid var(--border-rule)`
- `paddingLeft: var(--space-4)`
- `overflowWrap: anywhere`

Interdits sur le `<p>` récit :
- `--font-mono`
- `font-style: italic`
- toute variable `--accent*`
- toute ombre
- `<textarea>`, `<input>`, `contentEditable`, `IconButton`

États :
- **Défaut / reçu** : texte statique, non sélectionnable en édition.
- **Survol** : aucun changement.
- **Sélectionné** : sans objet.
- **Vide** : voir la décision 1 ci-dessous.
- **Erreur** : silence, pas de message, pas de bouton « Réessayer ».
- **Chargement** : le Badge reste affiché pendant le rejeu, sans clignoter entre les deux tentatives.

### Textes exacts
- Chargement : `Le narrateur écrit…`
- Aucun autre libellé d'interface n'est ajouté. L'en-tête `JOURNAL DE COMBAT` est inchangé. Pas d'eyebrow « RÉCIT » : le changement de police et le filet suffisent.
- Placeholder du log vide : inchangé. Il invite déjà à l'action suivante.
- Registre fiction (consigne pour le prompt R5, à reprendre mot pour mot dans le plan) :
  - 2e personne du pluriel (« vous »), présent, immersif.
  - Aucun chiffre (KR-296), aucun terme mécanique (PV, jet, round).
  - 400 caractères maximum.
  - Exemple valide : « Votre lame glisse sur le cuir tendu du gobelin ; il riposte d'un coup de gourdin que vous esquivez de justesse. »
- Le registre interface reste terse, en mono, majuscules. Aucune phrase de fiction ne passe en mono et aucun libellé d'interface ne passe en `--font-ui`.

### Clavier
- Aucun nouvel arrêt de Tab : la zone récit n'est pas focalisable.
- L'arrivée d'un récit ne déplace jamais le focus.
- `Jouer le round →` et `Fuir ↪` restent actifs pendant l'attente d'un récit.
- Le `role="log"` existant annonce poliment les ajouts. Ne pas ajouter `aria-live` redondant sur le `<p>`.

### Prérequis de données (à trancher par l'architecte)
- Chaque entrée de log doit porter un identifiant de round (le champ `round` existe).
- L'état du récit se déduit de cet identifiant (`en-cours` / `reçu` / absent).
- Un récit qui arrive après la clôture de l'écran est jeté.
- Un récit qui arrive pendant l'état terminal s'affiche normalement.

### Propositions de règles ESLint
1. `no-undefined-css-token` : toute chaîne `var(--x)` dans `src/**/*.{ts,tsx}` doit exister dans `tokens/*.css`.
2. `no-restricted-syntax` sur `**/EcranCombat*.tsx` et `**/Recit*.tsx` : rejeter `fontFamily` valant `var(--font-mono)` dans le style du récit.
3. `no-restricted-syntax` : rejeter `<textarea>`, `<input>`, `contentEditable` dans le composant récit.
4. Rejet des `<button>` bruts en `warn` (3 existants dans `EcranCombat`).
5. Test RTL de contrat : après échec du rejeu, `queryByText('Le narrateur écrit…')` est nul et la ligne ne contient aucun nœud récit vide.

---

## Décisions prises en autonomie faute de spécification

- Règle « jamais de vide » vs silence après échec → silence = absence de nœud, la ligne reste complète grâce au texte mécanique.
- Indicateur de chargement → `Badge tone="muted"` texte seul, sans animation.
- Marquage visuel du récit → filet gauche `--border-rule` plus `--font-ui`, pas d'eyebrow.
- Couleur du filet → neutre (`--border-rule`), jamais `--accent`.
- Disponibilité des boutons pendant l'attente → `Jouer le round` et `Fuir` restent actifs.
- Dette des boutons maison de `EcranCombat` → signalée, non bloquante.
- Wireframe → aucun § de combat n'existe, je m'appuie sur les tokens et les primitives.
