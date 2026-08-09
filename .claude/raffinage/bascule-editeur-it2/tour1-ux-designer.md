# Tour 1 — UX Designer — bascule-editeur it2

RISQUE — `EditorTopBar` (`src/brain/components/EditorTopBar.tsx`) est du chrome **partagé** entre l'écran Book orphelin (encore monté, testé, jamais supprimé — KR-181) et le nouvel écran Dossier. Si on retexte en dur (« ← Mes livres » → « ← Mes dossiers », le tooltip désactivé générique → le texte « feature n° 9 »), soit on casse l'écran Book mort-mais-vivant, soit le mauvais texte fuite sur l'un des deux écrans sans qu'aucun test ne le voie — un mélange de registre invisible à la revue de code parce que la valeur par défaut compile et passe les tests.

OBJECTION — Le cadrage dit « remplacer » le tooltip générique par le texte exigé, mais le code aujourd'hui n'a qu'**un seul** texte désactivé possible, câblé sur `!onPreview` (`title={onPreview ? 'Aperçu du jeu' : 'Aperçu du jeu — mode lecture (hors éditeur)'}`). Un remplacement en place changerait aussi le texte que verrait l'écran Book s'il redevenait atteignable. « Aperçu du jeu — feature n° 9 » ne peut pas être la seule valeur possible : il faut un texte par appelant, pas un texte unique.

PROPOSITION — Trois props optionnelles à défaut rétro-compatible sur `EditorTopBar` : `nodeCount`/`onAddNode` deviennent optionnels (absents → badge et « + Nœud » simplement absents, jamais un fantôme désactivé) ; `backLabel = 'Mes livres'` (l'écran dossier passe « Mes dossiers ») ; `previewDisabledReason` (l'écran dossier passe le texte exact « feature n° 9 », défaut = texte actuel inchangé pour ne rien casser côté Book). Zéro valeur en dur nouvelle, zéro composant maison — Modal/Field/Badge inchangés. Textes exacts, contrat de l'écran minimal, et réponse à la question ouverte en annexe.

VERDICT — **recevable sous réserve** : sous réserve que le tech-lead retienne le paramétrage par props plutôt qu'un retexte en dur d'`EditorTopBar` (sinon veto pour fuite de registre entre les deux écrans qu'il sert désormais).

---

## Annexe — contrat de design (hors quota)

### A. « + Nouveau dossier » (aujourd'hui `NewBookButton.tsx`)
- Visuel inchangé : bordure `1.5px dashed var(--accent)`, fond `var(--accent-bg)`, texte `var(--accent)`, rayon `var(--r-md)`, `min-height: var(--hit-target)`.
- Texte exact : `+ Nouveau dossier` (glyphe `+` dans un `span` séparé comme aujourd'hui, puis « Nouveau dossier »).
- États : défaut ci-dessus ; pas de survol spécifié (hors périmètre visuel de cette itération) ; clavier natif `<button>` — Entrée/Espace déclenchent, déjà conforme.

### B. Dialogue de création (aujourd'hui `NewBookDialog.tsx`, via `Modal`)
- `Modal title` : `Nouveau dossier`
- `Field` : `label="TITRE"`, `placeholder="La Caverne d'Aldûr"`, `id="new-dossier-title"`, `autoFocus`
- Boutons `Modal` : `cancelLabel="Annuler"`, `confirmLabel="Créer"`, `confirmDisabled` tant que le titre trimé est vide (déjà implémenté — inchangé)
- Indice cloud-first (déjà agnostique du mot « livre », **aucun changement de texte**) :
  - `idle`/`syncing`/`synced` : « Enregistré sur cet appareil, puis synchronisé dans le cloud. »
  - `offline`/`error` : « Enregistré sur cet appareil, synchronisé au retour en ligne. »
- États : vide → placeholder ci-dessus ; erreur → aucune cette itération (seul contrôle : `confirmDisabled`) ; chargement → aucun (création locale synchrone).
- Clavier : Entrée dans le champ soumet (déjà câblé) ; Échap ferme (`Modal`, déjà câblé) ; Tab traverse Champ → Annuler → Créer (ordre DOM déjà correct) ; le focus revient à « + Nouveau dossier » à la fermeture — déjà géré par `Modal` (capture/restore de `document.activeElement`), **aucun changement requis**.

### C. `EditorTopBar` — chrome partagé, contrat de props (pas de composant maison)
- `nodeCount?: number`, `onAddNode?: () => void` optionnels. Le Badge de compte ET le bouton « + Nœud » ne se rendent **que si les deux** sont fournis. Écran dossier : aucun des deux passé → ni badge ni bouton — ce ne sont pas des listes vides à placeholder, ce sont des affordances sans sens dans ce contexte, donc simplement absentes.
- `backLabel?: string = 'Mes livres'` (défaut = comportement actuel, préserve l'écran Book orphelin). Écran dossier passe `backLabel="Mes dossiers"`. Rendu : `← {backLabel}`.
- `previewDisabledReason?: string` — texte affiché en `title` (tooltip natif) quand `onPreview` est absent. Défaut si omis : texte actuel inchangé (« Aperçu du jeu — mode lecture (hors éditeur) »). Écran dossier passe explicitement le texte exact :
  `Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)`
- Style du bouton désactivé inchangé (déjà en tokens) : `color: var(--text-muted)`, `border: 1px solid var(--border-card)`, `cursor: not-allowed`. Libellé du bouton lui-même inchangé : `Aperçu du jeu ▷` (glyphe Unicode existant).

### D. Écran d'édition minimal du dossier (nouveau fichier, nom au choix du tech-lead)
- `<EditorTopBar title={dossier.titre} backLabel="Mes dossiers" onBack={...} previewDisabledReason="Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)" />` — `nodeCount`, `onAddNode`, `onPreview` omis.
- Corps sous la barre : reprend le patron dashed déjà utilisé par `LibraryScreen.emptyState` — bordure `1.5px dashed var(--border-field)`, fond `var(--paper-1)`, rayon `var(--r-xl)`, padding `var(--space-10) var(--space-8)`, centré.
  - Glyphe (`aria-hidden`) : `❏`, couleur `var(--text-faint)`, taille `var(--fs-h1)` (cohérent avec `emptyGlyph` de `LibraryScreen`)
  - Texte exact : « Aucune section pour l'instant. La navigation de ce dossier arrive avec une prochaine mise à jour de l'éditeur. » — couleur `var(--text-muted)`, `line-height: var(--lh-body)`
  - Pas de bouton « + Ajouter » désactivé : rien n'est ajoutable ici, une affordance désactivée mentirait (même doctrine que `etat_vide_section` du design_contract d'it3).
- Fallback « dossier introuvable » (`dossier === null`, même cas que `book === null` dans `EditorScreen.tsx` aujourd'hui) : texte exact `Dossier introuvable.` (`color: var(--text-muted)`) + bouton texte `← Mes dossiers` vers l'accueil — même patron que le bloc existant, pas de nouveau composant.
- Clavier : Tab atteint `← Mes dossiers` puis le bouton « Aperçu du jeu » désactivé (un `<button disabled>` est sauté par Tab nativement — pas de piège de focus) ; aucune autre interaction à câbler dans cet écran minimal.

### E. Réponse à la question ouverte — carte de dossier cliquable

**Position : ne pas l'inclure dans it2.** Le goal tel qu'écrit tient en une phrase sans « et » (« crée… et atterrit… » décrit un seul geste de création, pas une réouverture) ; l'it1 a déjà nommément reporté « la navigation carte→éditeur » hors périmètre. La réintroduire ici sans nouvel arbitrage reviendrait sur une décision déjà écrite dans `resolved_decisions`.

**Si le comité l'inclut malgré tout**, contrat prêt à l'emploi : ne pas transformer `<article>` en conteneur `role="button"` (NodeCard le fait, mais NodeCard n'a **aucun** `<button>` natif imbriqué — `DossierCard` en a deux : « Télécharger le fichier » et l'`IconButton` ✕ ; empiler un `role="button"` par-dessus exigerait un `stopPropagation()` sur les deux). À la place : seul le bloc titre+date devient l'affordance d'ouverture, enveloppé dans un `<button type="button">` stylé en texte (fond none, bordure none, padding 0, `text-align: left`, `cursor: pointer`). Survol : `text-decoration: underline` sur `cardTitle` uniquement — pas de fond, pas d'ombre, cohérent avec la hiérarchie par filet/teinte du système. Focus clavier : outline natif du bouton. Carte **jamais** cliquable sur la branche `lisible: false` (rien à ouvrir) — le titre y reste un `<span>` simple, comme aujourd'hui. `actionsCorner` (téléchargement/suppression) inchangé, ce sont des `<button>` frères du bouton titre, pas des enfants.

---

Fichiers lus pour cette note : `src/features/bascule-editeur/specification.json`, `src/brain/components/EditorTopBar.tsx`, `src/brain/components/Modal.tsx`, `src/brain/components/Field.tsx`, `src/brain/components/IconButton.tsx`, `src/features/book-creation/components/NewBookButton.tsx`, `NewBookDialog.tsx`, `CreateBookEntry.tsx`, `hooks/useCreateBook.ts`, `src/features/book-library/components/DossierCard.tsx`, `LibraryScreen.tsx`, `hooks/useDossierLibrary.ts`, `src/features/tree-canvas/components/NodeCard.tsx`, `src/brain/DossierService.ts`, `src/brain/Router.ts`, `src/EditorScreen.tsx`, `src/App.tsx`, `design_handoff_gamebook_editor/tokens/colors.css`, `spacing.css`, `typography.css`, `design_handoff_gamebook_editor/components/surfaces/Card.jsx`, `ListRow.jsx`.
