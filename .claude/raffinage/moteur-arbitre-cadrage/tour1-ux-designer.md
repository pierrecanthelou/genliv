# Cadrage n°11 `moteur-arbitre` — Tour 1 — UX

## RISQUE
Deux surfaces composites neuves (fiche de héros, carte de jet) sans nom dans l'inventaire de composants. Sans cadrage serré, l'essaim va soit inventer un composant maison, soit copier `HeroStatusBar.tsx` / `CharacterCreationScreen.tsx` verbatim depuis `src/player/` — ce qui importerait leur type `HeroState` (défini dans `src/player/types.ts`) comme si c'était le contrat canonique, alors que c'est CETTE feature qui doit introduire le champ héros dans `EtatSession` (`brain/`). Deux sources de vérité candidates pour la même forme de données.

## OBJECTION (registre de langue — véto si reproduit tel quel)
`CharacterCreationScreen.tsx` (`src/player/`, orphelin) TUTOIE — « Sélectionne un lancer, puis clique une caractéristique pour l'assigner. » — alors que le registre joueur déjà établi par `moteur-interprete` (n°10) VOUVOIE partout : `PlayerInputBar.tsx` → « Décrivez ce que vous tentez… », prose d'ouverture testée → « Vous n'avez pas fait dix pas que la pluie vous rattrape. ». Copier ce composant sans réécrire son texte romprait le registre au premier écran que le joueur voit après l'ouverture.

## PROPOSITION
Réutiliser `heroGen.ts` + `charCreation.ts` (logique pure, seul import `brain/characteristics`, zéro dépendance tree-model) tels quels par import direct — précédent d'infrastructure sain, chiffres 2D4+1D4/cap 10 conformes à `docs/REGLES-PLAY.md` §B1. Ne PAS importer les deux composants TSX : les reconstruire dans `play-mode/components/`, vouvoiement, sur les primitives Card/CardHead/Badge/Chip/OutcomeBlock déjà en usage. `OutcomeBlock.tsx` réserve déjà explicitement son axe de variante réussite/échec pour « le premier appelant de jet (n°11) » — c'est ce composant-ci.

## VERDICT
Pas de veto sur l'existence des deux écrans ; objection ferme sur la réutilisation verbatim des composants `src/player/` (registre) et sur toute forme de héros dupliquée hors `brain/`. Contrat de design en annexe.

---

## ANNEXE — CONTRAT DE DESIGN

### 1. Fiche de héros (bandeau permanent, registre joueur)
Nouveau composant `play-mode/components/BandeauHeros.tsx`. Précédent de LOGIQUE (pas de composant) : `HeroStatusBar.tsx` en donne l'anatomie de référence (nom, PV, PE, XP en ligne, séparateurs verticaux) — à reconstruire, pas à importer, car son prop `hero: HeroState` pointe le mauvais type.

Anatomie (tokens réels vérifiés) :
- Conteneur : `border-bottom: var(--bw-hair) solid var(--border-subtle)`, `background: var(--surface-card)`, `font-family: var(--font-mono)`, `font-size: var(--fs-meta)`, padding `var(--space-3) var(--space-5)`.
- Nom du héros : `color: var(--text-strong)`, `font-weight: var(--fw-semibold)`.
- `PV x/y` : chiffre courant en `var(--good)` si > 50 %, `var(--bad)` sinon (seules deux couleurs sémantiques).
- `PE x/y`, `XP n` : `var(--text-body)` / `var(--text-strong)` pour le chiffre.
- Séparateurs : trait 1px `var(--border-subtle)`.
- États : pas d'état vide possible (le bandeau n'existe qu'une fois le héros créé) ; pas d'état survol (lecture seule) ; pas de focus (aucun élément interactif dans ce lot).

### 2. Écran de création de personnage (registre joueur, VOUVOIEMENT)
Nouveau composant `play-mode/components/EcranCreationHeros.tsx` (nom au choix de l'essaim, hors `player/`). Réutilise `heroGen.ts`/`charCreation.ts` tels quels par import.

Libellés exacts (réécrits en registre vouvoiement pour cohérence avec n°10) :
- Titre (Hanken, `--fs-title`, sentence case) : « Créez votre héros »
- Label champ nom (mono, `--fs-meta`, `--text-label`) : `NOM` — placeholder : « Aldric le Téméraire »
- Instruction (mono, `--text-label`) : « Choisissez un lancer, puis cliquez une caractéristique pour l'assigner. »
- Compteur bonus : « Bonus 1D4 : {n} point(s) restant(s) » / épuisé : « ✓ tout distribué » (`var(--good)`)
- Bouton relance : « ⟳ Relancer » / désactivé : « ⟳ Relancer (utilisée) », `title` : « Relance déjà utilisée »
- Bouton validation (accent, seul usage légitime ici) : « Valider → », désactivé tant que `!complete`
- Dés du pool : boutons 44×44 (`--hit-target`), sélectionné = `2px solid var(--accent)` + `background: var(--accent-bg)`, assigné = `var(--surface-sunken)` + `var(--text-disabled)`.
- Clavier : Tab traverse dés → caractéristiques → boutons ; Entrée sur un dé sélectionné = équivalent clic ; Entrée sur le formulaire ne doit PAS soumettre avant `complete` ; le focus, à l'ouverture, atterrit sur le champ NOM.

### 3. Carte de jet — « panneau de dés » (registre mixte : cadre interface, enjeux en prose joueur)
Nouveau composant, ex. `play-mode/components/CarteJet.tsx`. Composants à étendre : `Card` (conteneur, **sans** `box-shadow` — la fiche-jet n'est ni menu ni modale, hiérarchie par filet : `border: var(--bw-hair) solid var(--border-card)`, écart assumé au fichier de référence) + `CardHead` (eyebrow mono = nom de la caractéristique en MAJUSCULES, ex. `FORCE`, title = le TC, ex. « Seuil 14 ») + `Badge` (tone `good`/`bad` réutilisé tel quel) pour l'issue une fois résolue + `OutcomeBlock` pour le texte d'enjeu et le récit renvoyé par R3, activant enfin l'axe de variante qu'il réservait.

États et libellés :
- Avant lancer : `CardHead` eyebrow = nom carac, title = « Seuil {tc} ». Corps = deux lignes étiquetées mono : `SI RÉUSSITE` / `SI ÉCHEC`, contenu = `enjeu_reussite`/`enjeu_echec` VERBATIM (prose joueur, jamais reformulée). Bouton primaire (accent) : « Lancer le dé ». Si `enjeu_reussite`/`enjeu_echec` absent du payload R2, afficher quand même la ligne avec un tiret cadratin « — » plutôt que rien (jamais de vide muet).
- Pendant résolution : bouton devient « … » désactivé, même patron que `boutonVerrou` de `PlayerInputBar.tsx` (`opacity: 0.5`, `cursor: not-allowed`).
- Après résolution (déterministe, `resolveChallenge`) : afficher les dés bruts + le seuil (ex. « 9 + 14 vs 14 »), `Badge` tone `good` « RÉUSSITE » ou tone `bad` « ÉCHEC » avec la marge (« marge +3 »/« marge −2 »). Puis le récit de R3 dans un `OutcomeBlock entete="RÉCIT"` identique au patron déjà en place dans `PlayerInputBar.tsx`.
- Icônes : ⚔ ou 🎲-équivalent n'existe pas dans le jeu de glyphes autorisé (✎ ✕ ⠿ ▾ → ↪ ↻ ⏱ ⊘ ⚔ 🗝 ⬚ +) — utiliser `→` ou `↻` pour le bouton de lancer, jamais un emoji dé.
- Clavier : Entrée sur la carte quand elle a le focus = équivalent clic « Lancer » ; à la résolution le focus reste sur la carte (pas de saut vers le champ de saisie libre, qui reprend la main seulement après le récit).

### 4. Statut de `HeroStatusBar.tsx` / `CharacterCreationScreen.tsx`
Précédent de LOGIQUE et d'ANATOMIE seulement, jamais de composant à réutiliser tel quel : (a) type `HeroState` concurrent du champ à introduire dans `EtatSession` — l'import romprait la source unique de vérité ; (b) registre tutoiement incompatible avec le vouvoiement établi n°10 ; (c) `onProgressionClick`/XP shop hors périmètre n°11 (repreneur n°13). `heroGen.ts`/`charCreation.ts` en revanche sont sûrs à importer tels quels.

### 5. Découpage suggéré (avis UX, pas un arbitrage d'architecture)
La création de héros doit précéder toute apparition du bandeau et de la carte de jet — un joueur sans héros ne peut ni voir ses stats ni lancer de dé. Recommandation : l'itération qui introduit le champ héros dans `EtatSession` porte AUSSI l'écran de création (elles ne peuvent pas se séparer sans écran orphelin), une itération suivante porte le bandeau permanent, la dernière porte la carte de jet + le branchement R2→`resolveChallenge`→R3.

### 6. Règles ESLint proposées (à valider par le tech-lead)
- Règle ciblée : interdire `import ... from '.../player/components/HeroStatusBar'` et `.../CharacterCreationScreen` depuis `src/features/**` — matérialise l'objection sans bloquer l'import de `heroGen`/`charCreation` (pure logique).
- Aucune règle ESLint ne peut vérifier le registre de langue (tutoiement/vouvoiement) ni le verbatim des enjeux — reste une heuristique de revue humaine, comme KR-013.

## Fichiers consultés
`src/player/components/HeroStatusBar.tsx`, `src/player/components/CharacterCreationScreen.tsx`, `src/player/engine/heroGen.ts`, `src/player/engine/charCreation.ts`, `src/player/types.ts`, `src/features/play-mode/components/OutcomeBlock.tsx`, `src/features/play-mode/components/PlayerInputBar.tsx`, `src/styles/tokens/{colors,spacing,typography}.css`, `design_handoff_gamebook_editor/components/surfaces/{Card,CardHead}.jsx`, `design_handoff_gamebook_editor/components/primitives/{Badge,Chip}.jsx`, `design_handoff_gamebook_editor/components/forms/DifficultyPicker.jsx`, `docs/PLAN-BASCULE-IA.dc.html` (l.468, 607, 631), `docs/REGLES-PLAY.md` (§B1), `docs/EXIGENCE-APERCU-DU-JEU.md`.
