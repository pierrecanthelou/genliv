# Tour 1 — UX Designer

```
RISQUE — le risque majeur : repointer `BookCard` mécaniquement sur `Dossier` en conservant sa ligne de stats (« N écrans · N liens · N fins ») ou le vocabulaire arbre de `LibraryScreen` (« bâtir son arbre d'écrans »). `DossierResume` ne porte que `{ id, titre, updatedAt, lisible }` — zéro compteur. Une reprise naïve invente des chiffres ou laisse fuiter un registre de langue périmé par la bascule.

OBJECTION — le design_contract cité (téléchargement, it5 § 3) ne couvre que le bouton. Trois points restent non tranchés par le cadrage et seront inventés ad hoc si je ne les fixe pas : (1) ce qui remplace la ligne de stats absente ; (2) si le corps de carte reste une surface cliquable « ouvrir » — aucune route éditeur Dossier n'existe en it1, un clic ferait un no-op ou pire ; (3) le sort de « + Nouveau livre » dans la grille (Q6), qui créerait aujourd'hui un `Book` invisible dans une liste de `Dossier`.

PROPOSITION — carte = titre statique (pas un `<button>`, rien à ouvrir cette itération) + date, sans stat fabriquée ; dossier `lisible:false` remplace la ligne de date par `Badge tone="bad"` « ⚠ Dossier illisible » + une ligne d'explication, et **masque** le téléchargement (l'export re-valide, il échouerait) en gardant la suppression — jamais un bouton désactivé qui ment. Téléchargement = texte verbatim it5 § 3, toujours visible, hors du coin hover-reveal qui ne garde que ✕ (aucune icône inerte rename/duplicate). Grille : seule « Importer un dossier » reste en cellule finale, `createEntry` retiré de la composition pour cette itération. Titre d'écran « Mes dossiers d'aventure », vide = « Importez un dossier d'aventure pour commencer. » Détail en annexe.

VERDICT — recevable sous réserve : confirmation tech-lead que `DossierResume` n'a bien aucun compteur caché, et accord sur le retrait temporaire de « + Nouveau livre ».
```

---

## Annexe — Contrat de design

### 1. Composition (`App.tsx`, racine)

- `LibraryScreen` reçoit **uniquement** `importEntry={<ImportDossierButton />}`. `createEntry` devient optionnel dans `LibraryScreenProps` (`createEntry?: ReactNode`) ; App.tsx cesse de monter `<CreateBookEntry />` pour cette itération (book-creation n'est repointée qu'en it2). Grille : la cellule finale n'affiche que le bouton import — motif dashed-accent existant, **inchangé** (`ImportDossierButton.tsx`, `buttonStyle`).

### 2. En-tête `LibraryScreen`

- `<h1>` : **« Mes dossiers d'aventure »** (remplace « Mes livres-jeux »).
- Intro (`<p>`, style `intro` inchangé) : **« Retrouvez un dossier déjà importé, téléchargez-le ou supprimez-le. »** — les trois verbes exacts du goal d'it1, aucune mention d'« arbre d'écrans ».
- `Field` (recherche) : `placeholder="Rechercher un dossier…"` (était « livre »).
- `SegmentedControl` (tri) : options inchangées, `{ value: 'recent', label: 'Récent' }` / `{ value: 'alpha', label: 'A→Z' }`, opère sur `titre`/`updatedAt`.
- Ligne « aucune correspondance » : **« Aucun dossier ne correspond à « {query} ». »**

### 3. État vide de la bibliothèque (`books.length === 0` → `dossiers.length === 0`)

- Style `emptyState` réutilisé verbatim (bordure `1.5px dashed var(--border-field)`, fond `var(--paper-1)`, rayon `var(--r-xl)`).
- Glyphe ❏ inchangé (`emptyGlyph`).
- Texte : **« Votre bibliothèque est vide. Importez un dossier d'aventure pour commencer. »** — plus d'invitation à « créer » (aucune affordance de création cette itération).

### 4. `DossierCard` (remplace `BookCard` sur cette surface)

Surface `<article className="dossier-card" style={cardSurface}>` — `cardSurface` réutilisé **verbatim** (`var(--surface-card)`, `1px solid var(--border-card)`, `var(--r-2xl)`, `var(--shadow-card)`).

**Corps (padding `var(--space-5)`, pas un `<button>` — rien à ouvrir en it1) :**

- Titre : `<span style={cardTitle}>` (styles `cardTitle` inchangés : `fs-title`, `fw-semibold`, `text-strong`). Si `titre` vide/imprononçable côté service → placeholder **« Dossier sans titre lisible ({id}) »** en mono, `text-faint` — jamais un blanc.
- Si `dossier.lisible === true` :
  - `<span style={cardDate}>` (mono, `fs-meta`, `text-faint`, inchangé) : **« Modifié le {formatDate(updatedAt)} »**. Pas de deuxième ligne de stats — rien à afficher tant que `DossierResume` n'en porte pas.
  - Chip sync (si transport actif) : même vocabulaire/tons que `BookCard` — « ✓ à jour » (muted) / « ⏳ en attente » (accent) / « ⚠ non synchronisé » (bad), via l'équivalent dossier de `useBookPending`.
- Si `dossier.lisible === false` :
  - `<Badge tone="bad">⚠ Dossier illisible</Badge>` sous le titre.
  - Ligne d'explication (mono, `fs-meta`, `text-muted`) : **« Ce fichier ne respecte plus le format attendu. »**
  - `cardDate` (« Modifié le … ») reste affichée en dessous — dernière modification connue, information toujours vraie.

**Action téléchargement (persistante, PAS hover-gated, sibling du corps) :**

- Texte exact **« Télécharger le fichier »**, style `retryButtonStyle` verbatim (`ImportDossierDialog.tsx:197` : `minHeight: var(--hit-target)`, `padding: 0 var(--space-2)`, `border: none`, `background: none`, `color: var(--text-muted)`, `font-family: var(--font-ui)`, `font-size: var(--fs-body)`).
- **Absente** (pas grisée) quand `lisible === false` — l'export re-valide et échouerait, et un bouton désactivé qui ne dit pas pourquoi est la « affordance qui ment » que le design_contract de la feature interdit déjà.

**Coin hover-reveal (top-right, `actionsCorner` réutilisé verbatim) :**

- **Un seul `IconButton`** : `tone="danger"`, `label="Supprimer « {titre} »"`, `size={HIT_TARGET_MIN}`, glyphe ✕.
- **Aucune icône rename (✎) ni duplicate (⧉)** — même inerte : hors périmètre nommé, une icône présente-mais-morte est le même mensonge qu'un bouton désactivé.

### 5. `DeleteDossierDialog` (remplace `DeleteBookDialog`)

`Modal` réutilisé verbatim : `title="Supprimer le dossier"`, `cancelLabel="Annuler"`, `confirmLabel="Supprimer"`, `confirmTone="error"`. Corps :

> « Le dossier « **{titre}** » sera supprimé définitivement. Cette action est irréversible. »

(Pas de mention d'« arbre » — un dossier n'en a pas.)

### 6. Clavier

Ordre de tabulation : Field recherche → SegmentedControl → pour chaque carte, « Télécharger le fichier » puis ✕ (dans cet ordre, gauche-à-droite/haut-en-bas visuel) → bouton « Importer un dossier ». Entrée déclenche l'action focus. Échap ferme `DeleteDossierDialog` ; le focus revient au ✕ qui l'a ouverte (comportement déjà porté par `Modal`, réutilisé sans modification).

### 7. Registre de langue

Toute la surface est AUTEUR : « Mes dossiers d'aventure », « Télécharger le fichier », « Dossier illisible » — aucun texte lu par le joueur ici.

---

Fichiers de référence utilisés : `src/features/book-library/components/BookCard.tsx`, `...LibraryScreen.tsx`, `...DeleteBookDialog.tsx`, `src/features/dossier-format/components/ImportDossierButton.tsx`, `...ImportDossierDialog.tsx` (patron `retryButtonStyle`), `src/App.tsx`, `.claude/raffinage/dossier-format-it5.plan.md` § 3, `src/features/bascule-editeur/specification.json`.

**Note tour 2 à traiter** : le tech-lead objecte que `retryButtonStyle` est une const PRIVÉE d'`ImportDossierDialog.tsx` — « verbatim » ci-dessus veut dire re-créer les mêmes valeurs de tokens dans `DossierCard.tsx`, jamais importer la const.
