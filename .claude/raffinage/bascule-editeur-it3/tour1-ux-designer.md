## RISQUE

Le contrat écrit une seule phrase-gabarit pour les 10 états vides : « Aucun·e {section}. La fiche d'édition arrive avec la feature n°{X}. » Or après `DossierService.create()` (`amorce.ts`, KR-178), Canon, Départ et Lieux ne sont **pas** vides à l'ouverture d'un dossier flambant neuf : Canon porte déjà synopsis/accroche/ton (marqués `⟨à écrire⟩`), Départ est « configuré » (lieu.amorce + texte d'ouverture), Lieux compte déjà 1 fiche (`lieu.amorce`). Le gabarit ment dans 3 cas sur 10 — exactement le défaut que le même design_contract interdit déjà pour un bouton « + Ajouter » désactivé.

## OBJECTION

La poignée `⠿` de `ListRow` (commentaire source : « a draggable object/butin/choice row ») n'a aucun sens pour 10 lignes fixes, jamais réordonnées cette itération. La rendre telle quelle promet un glisser qui n'existe pas. C'est le premier consommateur réel du composant porté en `brain/components/` — rien n'oblige à en hériter l'anatomie complète telle quelle.

## PROPOSITION

1) Remplacer le gabarit par un texte qui ne prétend rien sur le contenu : « {Section} — l'écran d'édition arrive avec la feature n°{X}. » — vrai que la section compte 0 ou N fiches, sans accord de genre à gérer sur 10 noms hétérogènes (masc./fém./composé).
2) `ListRow` gagne une prop `draggable?: boolean` (défaut `false`) : la poignée ne se rend que si un futur consommateur (n°4 à n°6, réordonnancement de fiches) la demande explicitement.

## VERDICT

**Recevable sous réserve** des deux points de la proposition.

---

## ANNEXE

### Mapping section → glyphe → feature → texte d'état vide

Familles proposées (glyphes CSS/Unicode existants, aucun SVG maison) :
- **✎ blocs de prose** — contenu = texte auteur continu, pas une collection dénombrable.
- **❏ listes d'entités** — contenu = collection de fiches individuelles.
- **⊘ Conditions** — contenu = déclencheurs / conditions, ni prose ni fiche libre.

| # | Section | Clé (wireframe) | Famille/glyphe | Feature réelle | Texte gabarit (litéral, tel que demandé) | Vrai à la création ? | Texte recommandé (ma proposition) |
|---|---|---|---|---|---|---|---|
| 1 | Canon | `canon` | ✎ | n°3 `dossier-canon` | « Aucun canon. La fiche d'édition arrive avec la feature n°3. » | **FAUX** — synopsis/accroche/ton déjà semés | « Canon — l'écran d'édition arrive avec la feature n°3. » |
| 2 | Départ | `depart` | ✎ | n°3 `dossier-canon` | « Aucun départ. La fiche d'édition arrive avec la feature n°3. » | **FAUX** — « configuré » dès la création | « Départ — l'écran d'édition arrive avec la feature n°3. » |
| 3 | Personnages | `personnages` | ❏ | n°4 `dossier-fiches` | « Aucun personnage. La fiche d'édition arrive avec la feature n°4. » | vrai (0 semé) | « Personnages — l'écran d'édition arrive avec la feature n°4. » |
| 4 | Lieux | `lieux` | ❏ | n°3 `dossier-canon` | « Aucun lieu. La fiche d'édition arrive avec la feature n°3. » | **FAUX** — `lieu.amorce` déjà semé (compte = 1) | « Lieux — l'écran d'édition arrive avec la feature n°3. » |
| 5 | Objets | `objets` | ❏ | n°5 `dossier-objets` | « Aucun objet. La fiche d'édition arrive avec la feature n°5. » | vrai | « Objets — l'écran d'édition arrive avec la feature n°5. » |
| 6 | Indices | `indices` | ❏ | n°6 `dossier-registres` | « Aucun indice. La fiche d'édition arrive avec la feature n°6. » | vrai | « Indices — l'écran d'édition arrive avec la feature n°6. » |
| 7 | Quêtes | `quetes` | ❏ | n°6 `dossier-registres` | « Aucune quête. La fiche d'édition arrive avec la feature n°6. » | vrai | « Quêtes — l'écran d'édition arrive avec la feature n°6. » |
| 8 | Événements | `evenements` | ❏ | n°6 `dossier-registres` | « Aucun événement. La fiche d'édition arrive avec la feature n°6. » | vrai | « Événements — l'écran d'édition arrive avec la feature n°6. » |
| 9 | Conditions | `conditions` | ⊘ | n°6 `dossier-registres` | « Aucune condition. La fiche d'édition arrive avec la feature n°6. » | vrai | « Conditions — l'écran d'édition arrive avec la feature n°6. » |
| 10 | Jalons & fins | `charpente` (jalons/fins) | ⊘ | n°6 `dossier-registres` | « Aucun jalon, aucune fin. La fiche d'édition arrive avec la feature n°6. » | vrai | « Jalons & fins — l'écran d'édition arrive avec la feature n°6. » |

Numéros de feature vérifiés dans `docs/ROADMAP-BASCULE-IA.md` § 2 : n°3 `dossier-canon` couvre explicitement « 01 synopsis & canon, 02 objectifs des camps, 07 lieux, 10 point de départ » — donc Canon, Départ **et Lieux** pointent tous vers n°3, pas trois features distinctes. Jalons & fins pointent vers n°6 (`resolved_decisions` : « leur écran d'édition dépend du registre DELTAS, réservé à n°6 »), jamais n°2 (qui ne fait que compter).

### Position sur la poignée `⠿`

**Composant réduit, pas masqué au niveau consommateur.** `ListRow` (brain/components) gagne `draggable?: boolean` (défaut `false`) : le glyphe `⠿` ne se rend que si la prop est `true`. La nav de sections (10 lignes fixes) ne la passe pas → glyphe absent, `leading`/`title`/`subtitle` glissent d'un cran à gauche. Motif : masquer via CSS (`display:none` conditionnel côté consommateur) laisserait le nœud dans le DOM et l'ordre de tabulation ; réduire au niveau du composant porté évite qu'un futur consommateur oublie de le masquer et hérite d'un glisser fantôme.

### Contrat de design — complément (composants, tokens, clavier)

- **Composants** : `brain/components/ListRow` (à porter, API ci-dessus) — 10 instances, une par section, dans un `<nav>` (pas une `<ul>` sémantiquement neutre, mais l'aspect HTML est hors de mon domaine). Panneau droit : pas de composant `Card` du design system porté (le patron dashed existant dans `LibraryScreen.tsx`/`DossierEditorScreen.tsx` est déjà en styles inline `CSSProperties`, pas le composant `Card`) — cohérent avec l'existant, je ne demande pas un import `Card` ici.
- **Tokens vérifiés dans `design_handoff_gamebook_editor/tokens/`** : `--border-subtle` (nav, séparateur droit), `--accent` / `--accent-bg-2` (ligne sélectionnée), `--surface-card`, `--r-xl`, `--fs-body`, `--fw-semibold`, `--text-strong`, `--fs-meta`, `--text-faint`, `--lh-snug`, `--ink-6` (poignée, si activée), `--paper-1`, `--border-field`, `--text-muted`, `--fs-h1` (glyphe d'état vide), `--lh-body`, `--space-3/8/10/12` — tous confirmés présents dans `colors.css`/`spacing.css`/`typography.css`. Note : `--space-11` n'existe pas (l'échelle saute de `--space-10` à `--space-12`) — si un lot a besoin d'un espacement intermédiaire, ne pas inventer `--space-11`.
- **Registre de langue** : nav + sous-titres + états vides = registre AUTEUR partout, aucun `_joueur`. Les libellés `title` des `ListRow` restent en casse phrase (« Canon », « Jalons & fins »), jamais MAJUSCULES — cohérent avec le design_contract déjà écrit, qui distingue `title` (casse phrase) du `subtitle` (clé technique mono).
- **Clavier** : Tab/Shift+Tab parcourt les 10 `ListRow` dans l'ordre du tableau ci-dessus ; Entrée/Espace sélectionne (même ligne que `selected`) et affiche l'état vide correspondant à droite ; le focus reste sur la `ListRow` cliquée/activée (pas de vol de focus vers le panneau droit, qui ne contient aucun élément focusable dans cette itération — l'état vide est un `<p>`, pas un bouton).
- **États** : défaut (bordure `--border-subtle`), sélectionné (bordure `--accent` + fond `--accent-bg-2`), pas de survol distinct spécifié par le design_contract existant (à confirmer avec le rôle dev — je ne vois pas de règle `:hover` dédiée dans `ListRow.jsx` source, donc pas de valeur à inventer ici).
