# Plan d'itération — `bascule-editeur` · itération `1`

> Statut : `validé` (2026-08-08)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-08
> Composition : `4 rôles` — motif : l'itération repointe une bibliothèque de fichiers sur un nouveau service `brain/` ; elle ne touche ni le dossier d'aventure narratif, ni le moteur, ni les prompts, ni la mémoire de session, ni le mode jeu.
> Exécution : `séquentielle` (2 lots, lot 1 `contrat` figé avant l'ouverture du lot 2)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur gère depuis sa bibliothèque les dossiers d'aventure déjà importés — les retrouver, les télécharger, les supprimer. » |
| **Tranche** | `LibraryScreen` (écran) → `DossierService.list/remove/exportDossier` (service `brain/`) → `PersistenceService`/`CloudSyncService` (persistance, décorateur déjà dossier-aware depuis dossier-format) |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | renommer/dupliquer un dossier · navigation carte → éditeur (aucune route avant it2) · puce de synchro par carte · création de dossier (it2) · badge de complétion (n° 7) |
| **Reporté** | la garde `book:deleted`→accueil (`src/App.tsx`) devient un code mort non détecté par le grep d'it3 → nettoyage en it2 · la ligne d'avis « anciens livres invisibles » meurt avec la démolition de `BookService` en n° 9 |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur retrouve, télécharge et supprime, depuis sa bibliothèque, tout dossier d'aventure déjà importé — y compris un dossier devenu illisible, qu'il peut supprimer pour libérer son identifiant.

## 2 — Hors périmètre

- Renommer ou dupliquer un dossier (`DossierService.rename`/`duplicate` n'existent pas ici — précédent : `book-library` les avait aussi ajoutés après son propre walking skeleton, pas dedans).
- Créer un nouveau dossier — `book-creation` n'est repointée qu'à l'itération 2 ; « + Nouveau livre » est retiré de la composition pour cette itération plutôt que de créer un `Book` invisible.
- Cliquer une carte pour l'ouvrir dans un éditeur — la route `{ name: 'dossier'; dossierId }` est un contrat d'itération 2 ; `src/brain/Router.ts` n'est touché par aucun lot ici. La carte est un `<article>` porteur de deux actions, jamais une surface cliquable.
- Puce de statut cloud-sync par carte de dossier — `useBookPending` construit sa clé en interne, non réutilisable ; un `useDossierPending` à un seul appelant serait une abstraction sans second consommateur. Le `SyncIndicator` global couvre l'itération.
- Corriger la non-propagation de suppression au KV distant de `CloudSyncService.remove()` — dette héritée de `deleteBook`, épinglée par un test (critère 8), pas corrigée.
- Badge de complétion par section — hors périmètre de toute la feature `bascule-editeur` (dépend du linter n° 7), sans objet ici de toute façon (aucune nav de sections avant it3).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Composants réutilisés tels quels** : `Card` (surface `cardSurface` verbatim : `var(--surface-card)`, `1px solid var(--border-card)`, `var(--r-2xl)`, `var(--shadow-card)`), `Modal` (dialogue de suppression), `Field` (recherche), `SegmentedControl` (tri), `Badge` (tone `bad`/`muted`), `IconButton` (tone `danger`, taille `--hit-target`).

**En-tête `LibraryScreen`** :
- `<h1>` : « Mes dossiers d'aventure » (remplace « Mes livres-jeux »).
- Intro : « Retrouvez un dossier déjà importé, téléchargez-le ou supprimez-le. »
- `Field` recherche : `placeholder="Rechercher un dossier…"`.
- `SegmentedControl` tri : `{ value: 'recent', label: 'Récent' }` / `{ value: 'alpha', label: 'A→Z' }`, opère sur `titre`/`updatedAt` (dossiers lisibles uniquement — un illisible n'a pas de `titre`, il reste épinglé en tête par le tri du service).
- Aucune correspondance : « Aucun dossier ne correspond à « {query} ». »

**États vides** (style `emptyState` verbatim : bordure `1.5px dashed var(--border-field)`, fond `var(--paper-1)`, rayon `var(--r-xl)`, glyphe ❏) :
- Ni `Book` ni `Dossier` : « Votre bibliothèque est vide. Importez un dossier d'aventure pour commencer. »
- Des `Book` existent (`BookService.listBooks().length > 0`), zéro `Dossier` : « Aucun dossier d'aventure ici pour l'instant : vos anciens livres restent stockés, mais ne s'affichent plus pendant la bascule. Importez un dossier pour commencer. » — jamais de bouton ou de lien qu'elle ne peut honorer (pas de « restaurer »).

**Grille** : dernière cellule = `<ImportDossierButton/>` seul (`buttonStyle` dashed-accent, inchangé). Aucune cellule « + Nouveau livre » cette itération.

**`DossierCard`** (`<article>`, padding `var(--space-5)`, pas un `<button>` — rien à ouvrir) :
- Lit le discriminant `lisible` en premier ; `dossier.titre` n'est jamais accédé sur la branche `lisible: false` (le type ne le porte pas).
- `lisible: true` : titre (`cardTitle` : `fs-title`, `fw-semibold`, `text-strong`) + « Modifié le {formatDate(updatedAt)} » (`cardDate` : mono, `fs-meta`, `text-faint`). Aucune ligne de compte (écrans/liens/fins) — `DossierResume` n'en porte pas.
- `lisible: false` : `<Badge tone="bad">⚠ Dossier illisible</Badge>` + « Ce fichier ne respecte plus le format attendu. » (mono, `fs-meta`, `text-muted`) + « id : {dossier.id} » (mono, `fs-meta`, `text-faint`).
- Action téléchargement (persistante, hors du coin hover-reveal, texte exact **« Télécharger le fichier »**), const de style **locale** à `DossierCard.tsx` (aucun import inter-fichier) :
  ```ts
  const telechargerButtonStyle: CSSProperties = {
  	alignSelf: 'flex-start',
  	minHeight: 'var(--hit-target)',
  	padding: '0 var(--space-2)',
  	border: 'none',
  	background: 'none',
  	color: 'var(--text-muted)',
  	fontFamily: 'var(--font-ui)',
  	fontSize: 'var(--fs-body)',
  	cursor: 'pointer',
  }
  ```
  **Absente** (pas grisée) quand `lisible === false` — l'export re-validerait et échouerait ; un bouton désactivé sans explication est l'affordance qui ment.
- Coin hover-reveal (`actionsCorner` verbatim, classes CSS `.dossier-card__actions` / `.dossier-card:hover .dossier-card__actions` / `.dossier-card:focus-within .dossier-card__actions` — renommées depuis `.book-card*` dans `src/style.css`) : **un seul** `IconButton` (`tone="danger"`, `label="Supprimer « {titre ou id} »"`, glyphe ✕). Aucune icône rename/duplicate, même inerte.

**`DeleteDossierDialog`** (remplace `DeleteBookDialog`, `Modal` verbatim) : `title="Supprimer le dossier"`, `cancelLabel="Annuler"`, `confirmLabel="Supprimer"`, `confirmTone="error"`. Corps : « Le dossier « **{titre}** » sera supprimé définitivement. Cette action est irréversible. » (dossier illisible : « Le dossier **{id}** sera supprimé définitivement. Cette action est irréversible. »).

**Clavier** : Field → SegmentedControl → par carte, « Télécharger le fichier » puis ✕ → « Importer un dossier ». Entrée déclenche l'action focus. Échap ferme la modale de suppression, le focus revient au ✕ qui l'a ouverte (comportement déjà porté par `Modal`).

**Registre de langue** : toute la surface est AUTEUR — aucun texte lu par le joueur.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DossierResume` | type | expose | `{ id: string; lisible: true; titre: string; updatedAt: string } \| { id: string; lisible: false }` — union discriminée, AUCUN champ dérivé du contenu (compter exigerait une re-validation complète par carte) |
| `DossierService.list()` | service | expose | `(): DossierResume[]` — énumère par CLÉ (`persistence.keys`), ignore toute clé portant un `:` après le préfixe (réservé à `dossierContentKey`/`dossierImageKey`, n° 3/4) ; trie illisibles d'abord, puis `updatedAt` décroissant, égalité départagée par `id` |
| `DossierService.remove(id)` | service | expose | `(id: string): boolean` — constate par la CLÉ BRUTE, jamais par `get()` (un dossier illisible reste supprimable) ; retire la clé PUIS émet `dossier:deleted` (KR-004) |
| `DossierService.importDossier` | service | modifie (comportement) | inchangée en signature ; la présence d'un id occupé se constate désormais par la CLÉ, pas par `get()` re-validant (KR-179/BUG-048) — message dédié si l'occupant est illisible |
| `dossier-deja-importe` | registre (`issues.ts`) | modifie | UN code, DEUX messages selon la lisibilité de l'occupant (cause = « identifiant occupé », pas la lisibilité) |
| `dossier:deleted` | événement | émet | `{ dossierId: string }` |
| `useDossiers()` | hook | expose | `(): DossierResume[]` — `useSyncExternalStore`, snapshot caché en clôture, re-lu sur `dossier:created`/`dossier:updated`/`dossier:deleted` (calque de `useBooks`) |
| `useBooks()` | hook | consomme | inchangé — reste le seul moyen légal de lire `BookService.listBooks().length` pour le critère 6, sans re-render par frame |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-dossier-liste` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `DossierService` gagne `list()`/`remove()` ; `importDossier` constate la présence par clé ; le message `dossier-deja-importe` distingue lisible/illisible ; `dossier:deleted` + `useDossiers()` ; `downloadJson`/`slugifyFilename` prêts pour leur premier appelant réel.
- **Fichiers** : `src/brain/DossierService.ts` (R) · `src/brain/DossierService.test.ts` (R) · `src/brain/EventBus.ts` (R) · `src/brain/hooks.ts` (R) · `src/brain/index.ts` (R) · `src/brain/dossier/issues.ts` (R) · `src/brain/utils/download.ts` (R) · `src/brain/utils/download.test.ts` (R)
- **Expose / consomme** : signatures du § 4 — `DossierResume`, `list`, `remove`, `dossier:deleted`, `useDossiers`
- **Critères couverts** : #1, #3, #5, #8

### Lot 2 — `bibliotheque-dossiers`
- **Ouvrier** : `dev-lot`
- **But** : `LibraryScreen` liste des `DossierResume` au lieu de `Book` ; carte, téléchargement, suppression, tri/recherche ; « + Nouveau livre » retiré de la composition ; avis nommé si des `Book` restent invisibles.
- **Fichiers** :
  `src/features/book-library/components/LibraryScreen.tsx` (R) ·
  `src/features/book-library/components/DossierCard.tsx` (N) ·
  `src/features/book-library/components/DeleteDossierDialog.tsx` (N) ·
  `src/features/book-library/hooks/useDossierLibrary.ts` (N) ·
  `src/features/book-library/utils/selectVisibleDossiers.ts` (N) ·
  `src/features/book-library/tests/dossierLibrary.test.tsx` (N) ·
  `src/features/book-library/tests/selectVisibleDossiers.test.ts` (N) ·
  `src/features/book-library/components/BookCard.tsx` (R — supprimé) ·
  `src/features/book-library/components/DeleteBookDialog.tsx` (R — supprimé) ·
  `src/features/book-library/hooks/useLibrary.ts` (R — supprimé) ·
  `src/features/book-library/utils/selectVisibleBooks.ts` (R — supprimé) ·
  `src/features/book-library/tests/library.test.tsx` (R — supprimé) ·
  `src/features/book-library/tests/selectVisibleBooks.test.ts` (R — supprimé) ·
  `src/App.tsx` (R) ·
  `src/style.css` (R — `.book-card*` → `.dossier-card*`) ·
  `src/features/book-creation/tests/createFlow.test.tsx` (R — un seul `describe` réécrit : monte `<CreateBookEntry/>` seul sous `BrainProvider`, plus via `<App/>` ; aucun fichier de *production* de `book-creation` touché, ce n'est pas un import inter-features)
- **Expose / consomme** : `LibraryScreenProps.createEntry` devient optionnel (`createEntry?: ReactNode`) ; `useDossierLibrary()` expose en plus `livresHerites: number` (dérivé inline de `useBooks().length`, KR-013)
- **Critères couverts** : #1, #2, #4, #5, #6, #7

*(2 lots. Aucun troisième : scinder « téléchargement » ferait partager `LibraryScreen.tsx`/`DossierCard.tsx` par deux lots — interdit.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier lisible déjà importé, **quand** l'auteur ouvre l'accueil, **alors** `DossierService.list()` le retourne (trié : illisibles d'abord, puis `updatedAt` décroissant) et `LibraryScreen` l'affiche via `DossierCard` (titre, date) — *niveau : composant* — *lot 2*
2. **Étant donné** un dossier stocké devenu illisible, **quand** l'auteur ouvre l'accueil, **alors** sa carte affiche `Badge tone="bad"` « ⚠ Dossier illisible », l'explication, et son id — sans jamais accéder à un `titre` — *niveau : composant* — *lot 2*
3. **Étant donné** un dossier illisible occupant un identifiant, **quand** l'auteur importe un fichier valide portant le même id, **alors** l'import est refusé (`dossier-deja-importe`, message « illisible »), le document en place n'est PAS écrasé — *niveau : contrat* — *lot 1*
4. **Étant donné** un dossier lisible, **quand** l'auteur déclenche « Télécharger le fichier », **alors** `exportDossier()` produit le document re-validé et le téléchargement se déclenche ; cette action est ABSENTE (pas grisée) sur un dossier illisible — *niveau : composant* — *lot 2*
5. **Étant donné** un dossier listé (lisible ou non), **quand** l'auteur confirme sa suppression, **alors** `remove()` retire la clé PUIS émet `dossier:deleted` (ordre observé) et la carte disparaît de la liste vivante ; « Annuler » laisse le dossier intact — *niveau : contrat + composant* — *lots 1 et 2*
6. **Étant donné** zéro dossier importé mais des `Book` existants en stockage, **quand** l'auteur ouvre l'accueil, **alors** l'état vide nomme explicitement que ses anciens livres restent stockés mais ne s'affichent plus pendant la bascule ; **étant donné** ni `Book` ni `Dossier`, l'état vide invite simplement à importer — *niveau : composant* — *lot 2*
7. **Étant donné** l'accueil, **quand** il se rend, **alors** « + Nouveau livre » n'est plus monté (`App.tsx`), seul « Importer un dossier » reste comme entrée — *niveau : composant* (monte `<App/>`) — *lot 2*
8. **Étant donné** `DossierService.remove()` sur un dossier dont un push cloud est en file, **quand** la suppression s'exécute, **alors** le comportement ACTUEL (la clé distante n'est pas effacée, un push en file republierait le document) est épinglé par un test — dette connue, pas corrigée ici — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `DossierService.test.ts` — « liste par clé, illisibles en tête » | `list()` trie et n'omet aucune clé, ignore les clés `dossierContentKey`/`dossierImageKey` | contrat | — | 1 |
| `DossierService.test.ts` — « import refusé sur clé occupée par un invalide » | seme un brut invalide sous `dossierKey('x')`, importe un fichier valide même id → `statut:'invalid'`, code `dossier-deja-importe`, message illisible, brut inchangé | contrat | KR-179 | 1 |
| `DossierService.test.ts` — « remove() retire la clé avant d'émettre dossier:deleted » | abonné lit `persistence.get(dossierKey(id))` dans le handler, déjà `null` | contrat | KR-004 | 1 |
| `DossierService.test.ts` — « remove() fonctionne sur un dossier illisible » | brut invalide sous une clé → `remove()` retourne `true`, clé absente ensuite | contrat | KR-179 | 1 |
| `DossierService.test.ts` — « remove() n'efface pas la clé distante (épinglage) » | pin le comportement actuel de `CloudSyncService.remove()` — commentaire renvoyant à KR-182 | contrat | KR-182 | 1 |
| `download.test.ts` — « repli du nom de fichier devient 'dossier' » | `slugifyFilename` sans titre → `...dossier...json`, pas `...livre...json` | unitaire | — | 1 |
| `dossierLibrary.test.tsx` — « liste, télécharge, supprime » | rendu carte lisible + illisible, clic téléchargement déclenche `exportDossier`, clic ✕ → modale → confirme → carte disparaît | composant | KR-011/013 | 2 |
| `dossierLibrary.test.tsx` — « + Nouveau livre absent » | `queryByRole('button', {name:/nouveau livre/i})` → `null` | composant | — | 2 |
| `dossierLibrary.test.tsx` — « avis Book invisibles » | `BookService` a des livres, `DossierService.list()` vide → texte d'avis nommé rendu ; aucun livre ET aucun dossier → texte générique | composant | — | 2 |
| `selectVisibleDossiers.test.ts` — recherche + tri | filtre par titre (dossiers illisibles jamais filtrés hors résultat par le texte), tri recent/alpha stable | unitaire | KR-013 | 2 |
| `createFlow.test.tsx` — describe 1 réécrit | `<CreateBookEntry/>` seul sous `BrainProvider` toujours fonctionnel (création de Book intacte au niveau composant, hors accueil) | composant | — | 2 |

Cas limites à couvrir : dossier illisible (dupliqué dans plusieurs tests ci-dessus) · liste vide · égalité de `updatedAt` (départagée par `id`) · double confirmation de suppression (double clic) · recherche sans résultat.

**Non vérifiable en l'état** — aucun : les 8 critères sont couverts par jest/RTL, aucun n'attend un instrument absent (le canevas navigateur, différé, n'est pas concerné par cette itération).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Le silence fait aux `Book` existants (invisibles sans un mot dès que `LibraryScreen` bascule) | `RETENU` | critère #6, lot 2 — conditions tech-lead : propriétaire d'extinction nommé (→ `open_questions`, n° 9), aucune action fantôme offerte, `useBooks()` reste légalement vivant un tour |
| 2 | Tech Lead | Lister `Book` et `Dossier` ensemble (option b de la question 6) | `REJETÉ` | deux sources de vérité dans une vue, rapproche par la forme deux modèles que KR-167 interdit de convertir |
| 3 | Tech Lead | Le critère de téléchargement dit « suit le contrat § 3 tel quel » | `RETENU corrigé` | `retryButtonStyle` est une const privée d'un autre fichier — recréée localement (`telechargerButtonStyle`, § 3 du plan), jamais importée |
| 4 | UX | `titre` accessible même sur la branche `lisible:false` (formulation initiale « titre vide ») | `RETENU corrigé` | `DossierResume` est une union stricte ; `titre` n'existe pas sur cette branche, corrigé au tour 2 |
| 5 | QA | Le critère « BUG-048 fermé » confondait la visibilité dans `list()` et le vrai correctif de `importDossier` | `RETENU` | scindé en deux tests distincts, tous deux dans `DossierService.test.ts` (critères #2 et #3) |
| 6 | QA | Dette `CloudSyncService.remove()` (pas de propagation au KV distant) | `RETENU` | un test d'épinglage (critère #8, KR-182), pas une correction — hors périmètre de cette itération |
| 7 | Tech Lead (tour 2) | `createFlow.test.tsx` casserait avec l'option (a) sans être nommé dans un lot | `RETENU` | ajouté au lot 2, un seul `describe` réécrit, aucun fichier de production de `book-creation` touché |
| 8 | Tech Lead (tour 2) | La garde `book:deleted`→accueil (`src/App.tsx`, KR-071) devient un code mort que le grep d'it3 ne détecte pas | `REPORTÉ` | itération 2, à écrire dans `open_questions` de `bascule-editeur/specification.json` |
| 9 | QA | Compte AVANT/APRÈS des suites supprimées (`library.test.tsx` 16 tests, `selectVisibleBooks.test.ts`) | `RETENU` | consigné dans la revue d'itération (`.claude/raffinage/bascule-editeur-it1.revue.md`), § 10 |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de `book-library` NON classés au § 8/annexe B du tour 2 (`.claude/raffinage/bascule-editeur-it1/tour2-tech-lead.md`) — chaque cas est `SUPPRIMÉ`/`TRANSPOSÉ`/`RÉÉCRIT`/`INTACT`, jamais silencieusement absent
- [ ] Compte de tests avant/après consigné dans la revue (désaccord #9) : `library.test.tsx` et `selectVisibleBooks.test.ts`
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/bascule-editeur-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | critère #6 intégré au lot 2 (désaccord #1) |
| Tech Lead | recevable sous réserve | `createFlow.test.tsx` ajouté au lot 2 (désaccord #7) ; KR-071 reporté (désaccord #8) |
| UX | recevable | corrections tour 2 intégrées (désaccords #3, #4) |
| QA | recevable sous réserve | 2 tests BUG-048 + test d'épinglage KR-182 + compte avant/après (désaccords #5, #6, #9) |
