# Plan d'itération — `bascule-editeur` · itération `2`

> Statut : `validé` (2026-08-09)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-09
> Composition : `5 rôles` — motif : l'itération sème le contenu d'un dossier d'aventure (`DossierService.create`) — canon, identifiant d'entité, textes destinés au modèle et au joueur (`destinations.ts`) — donc touche directement le format que l'IA lira au Temps 2.
> Exécution : `essaim` (3 lots — lot 1 `contrat` seul et en premier, puis lots 2 et 3 en parallèle)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur atteint l'écran d'édition d'un dossier d'aventure — en le créant depuis sa bibliothèque, ou en rouvrant un dossier déjà présent dans celle-ci. » |
| **Tranche** | `LibraryScreen`/`DossierCard` (écran) → `DossierService.create/open` (service `brain/`) → `PersistenceService`/`CloudSyncService` (persistance, déjà dossier-aware) → `Router` (route `dossier`) → `DossierEditorScreen` (écran minimal, nouveau) |
| **Lots** | 3 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | renommer/dupliquer un dossier · nav de sections/`ListRow`/layout 2 colonnes/compteurs (it3) · badge de complétion (n° 7) · démolition physique de `BookService`/`kinds.ts`/`tree.ts` (n° 9) · détection d'amorce non rédigée (n° 7) · refus d'ouverture de partie sur amorce non rédigée (n° 9) · conversion Book↔Dossier (jamais, KR-167) · contrôle d'occupation de clé dans `create()` · puce de synchro par carte (déjà reportée it1) · survol « Ouvrir »/double-clic/Entrée sur la carte entière |
| **Reporté** | rafraîchissement live du titre affiché si `dossier:updated` survient pendant que l'écran est ouvert → propriétaire it3 · KR-178 à reformuler dans la spec avant l'ouverture du lot 1 (le repli « Lieu n°1 (sans nom) » est une sortie de rapport, jamais une valeur semée) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur sème un dossier d'aventure valide depuis sa bibliothèque (un titre suffit) et atterrit sur l'écran d'édition minimal qui s'ouvre dessus ; il peut y revenir à tout moment en rouvrant ce même dossier — ou tout autre dossier déjà présent — depuis la bibliothèque. « Aperçu du jeu » y reste visible mais désactivé, avec l'explication nommée renvoyant à la feature n° 9.

## 2 — Hors périmètre

- Renommer ou dupliquer un dossier (`DossierService.rename`/`duplicate` n'existent pas ici — sans propriétaire d'itération dans `open_questions`, comme avant cette itération).
- Toute nav de sections, tout `ListRow`, tout layout à deux colonnes, tout compteur — itération 3, décision actée à la feature.
- Badge de complétion — dépend du linter n° 7 `dossier-controles`, non livré.
- Démolition physique de `BookService.ts`/`kinds.ts`/`tree.ts` — n° 9 (KR-181). `src/EditorScreen.tsx` (chemin Book) n'est touché par **aucun** lot de cette itération.
- Détection d'une amorce (`MARQUEUR_A_ECRIRE`) non rédigée — n° 7 (alerte) et refus d'ouverture de partie sur une amorce encore marquée dans `charpente.depart.texte_ouverture_joueur` — n° 9 (blocage). Cette itération pose la constante et la discipline de rédaction, rien de plus.
- Conversion `Book` ↔ `Dossier`, dans aucun sens (KR-167).
- Contrôle d'occupation de clé (`cleOccupee`) dans `create()` — un id issu de `crypto.randomUUID()`/repli n'entre pas en collision ; branche qu'aucun test n'atteindrait.
- Puce de statut cloud-sync par carte de dossier — déjà reportée en it1.
- Survol qui révèle « Ouvrir », double-clic, `Entrée` sur la carte entière — seul le titre devient l'affordance (§ 3).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Composants réutilisés tels quels** : `Modal`, `Field`, `Badge`, `EditorTopBar` (étendu, § 4). Aucun composant maison.

**« + Nouveau dossier »** (remplace `NewBookButton.tsx`) : visuel inchangé (bordure `1.5px dashed var(--accent)`, fond `var(--accent-bg)`, texte `var(--accent)`, rayon `var(--r-md)`, `min-height: var(--hit-target)`). Texte exact : `+ Nouveau dossier`.

**Dialogue de création** (remplace `NewBookDialog.tsx`, via `Modal`) :
- `Modal title` : `Nouveau dossier`
- `Field` : `label="TITRE"`, `placeholder="La Caverne d'Aldûr"`, `id="new-dossier-title"`, `autoFocus`
- `cancelLabel="Annuler"`, `confirmLabel="Créer"`, `confirmDisabled` tant que le titre trimé est vide
- Indice cloud-first (texte déjà agnostique du mot « livre », inchangé) : idle/syncing/synced → « Enregistré sur cet appareil, puis synchronisé dans le cloud. » ; offline/error → « Enregistré sur cet appareil, synchronisé au retour en ligne. »
- Clavier : Entrée soumet, Échap/scrim ferment (déjà porté par `Modal`), focus revient au déclencheur à la fermeture.

**`EditorTopBar`** (brain/components, chrome partagé Book/Dossier — § 4 pour les signatures) :
- Écran dossier : `backLabel="Mes dossiers"`, `nodeCount`/`onAddNode`/`onPreview` omis, `previewDisabledReason="Aperçu du jeu — disponible quand le mode jeu sera repointé sur le dossier (feature n° 9)"`.
- Écran Book (inchangé, chemin mort) : tous les défauts actuels préservés à l'identique — `backLabel` par défaut `'Mes livres'`, tooltip désactivé par défaut inchangé.
- Rendu : le Badge de compte ET le bouton « + Nœud » ne se rendent que si `nodeCount`/`onAddNode` sont TOUS LES DEUX fournis — jamais un fantôme désactivé.

**`DossierEditorScreen`** (nouveau, `src/features/bascule-editeur/components/`) :
- Corps sous la barre (dossier trouvé) : patron dashed de `LibraryScreen.emptyState` — bordure `1.5px dashed var(--border-field)`, fond `var(--paper-1)`, rayon `var(--r-xl)`, padding `var(--space-10) var(--space-8)`, centré. Glyphe `❏` (`aria-hidden`, `color: var(--text-faint)`, `font-size: var(--fs-h1)`). Texte exact : « Aucune section pour l'instant. La navigation de ce dossier arrive avec une prochaine mise à jour de l'éditeur. » (`color: var(--text-muted)`, `line-height: var(--lh-body)`). Aucun bouton « + Ajouter » désactivé.
- Repli (dossier introuvable, `dossiers.get(dossierId) === null`) : texte exact `Dossier introuvable.` (`color: var(--text-muted)`) + bouton texte `← Mes dossiers` vers l'accueil — même patron que le repli actuel de `EditorScreen.tsx` (« Livre introuvable. »), sans le dupliquer en composant.
- Clavier : Tab atteint `← Mes dossiers` (ou le corps, selon le cas) puis le bouton « Aperçu du jeu » désactivé — un `<button disabled>` est sauté nativement, pas de piège de focus.

**`DossierCard`** (carte lisible seulement — la carte illisible n'est PAS concernée) :
- Seul le **titre** devient l'affordance d'ouverture — pas le bloc titre+date. Remplace le `<span style={cardTitle}>` par un `<button type="button">`, style = const **locale** `cardTitleButtonStyle` (même discipline que `telechargerButtonStyle` — jamais importée d'ailleurs) : reprend `cardTitle` (`fs-title`, `fw-semibold`, `text-strong`) + reset de bouton (`border: none`, `background: none`, `padding: 0`, `font: inherit`, `text-align: left`) + `cursor: pointer`.
- Survol : `text-decoration: underline` sur ce texte uniquement — **pas** de changement de couleur vers l'accent (réservé sélection/action primaire/option active).
- Focus clavier : outline natif du bouton ; révèle en prime `.dossier-card__actions` via `:focus-within` (règle CSS déjà en place, aucun ajout).
- **Jamais** sur la branche `lisible: false` : le titre y reste un `<span>` — interdit par le TYPE de l'union discriminée, pas une convention de rendu.
- Aucun nouveau texte : l'interaction ne consomme que `dossier.titre`, déjà affiché.

**Registres de langue** : la clause « aucun champ ici n'est lu ou entendu par le joueur » du design_contract de la feature couvre la copie d'**interface** que cette feature fabrique (labels, sous-titres, états vides) — **pas** le contenu de dossier que `create()` sème (`canon.partage.accroche_joueur`, `charpente.depart.texte_ouverture_joueur`), qui est un objet de données, non une chaîne rendue par un composant de `bascule-editeur`. C'est pour ce contenu-là, non couvert par la clause, que le dispositif d'amorce marquée ci-dessous existe.

**Amorce du seed** (`src/brain/dossier/amorce.ts`, rédaction narratif-ia/UX, adressée à l'AUTEUR, jamais au joueur) — chaque texte commence par `MARQUEUR_A_ECRIRE = '⟨à écrire⟩'` :
- `synopsis_mj` : `⟨à écrire⟩ La vérité de cette aventure, y compris ce que le joueur ignore.`
- `accroche_joueur` : `⟨à écrire⟩ Ce que le joueur sait en ouvrant le livre.`
- `ton` : `⟨à écrire⟩ Le registre de langue de cette aventure — par exemple : sombre et feutré.`
- `texte_ouverture_joueur` : `⟨à écrire⟩ La première scène, telle que le moteur la lira au joueur, mot pour mot.`

*(Écrit par l'UX + narratif-ia. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DossierService.create` | service | expose | `(titre: string): Dossier` — sème un dossier VALIDE (KR-178) via `construireAmorce`, persiste, PUIS émet `dossier:created` (KR-004). Titre `trim()`é ; vide → `TITRE_PAR_DEFAUT`. N'ouvre pas, ne navigue pas. |
| `createDossierId` | fonction privée | interne à `DossierService.ts` | **non exportée** — un seul appelant. L'id est `randomToken()` (§ ci-dessous), jamais `createId()` générique (KR-177 : le `_` séparateur est refusé par `FORME_ID_DOSSIER`). |
| `randomToken` / `createId` | fonction | `src/brain/utils/id.ts` | `randomToken(): string` (l'entropie seule — minuscules, chiffres, tirets, jamais de séparateur) extraite ; `createId(prefix='id') { return \`${prefix}_${randomToken()}\` }` inchangé en sortie. Deux appelants réels (`createId`, `createDossierId`) : déduplication, pas une abstraction à un seul consommateur. |
| `MARQUEUR_A_ECRIRE`, `AMORCE`, `construireAmorce` | constante + fonction | `src/brain/dossier/amorce.ts` (N) | `MARQUEUR_A_ECRIRE = '⟨à écrire⟩'` ; `construireAmorce(id: string, titre: string, now: string): Dossier` — la forme complète du seed (§ 5). **Non ré-exportées** depuis `brain/index.ts` (aucun consommateur de feature en it2 ; même traitement que `DELTAS`). |
| `Route` | type | expose | `{ name: 'home' } \| { name: 'editor'; bookId: string } \| { name: 'dossier'; dossierId: string }` — ADDITIF, `editor`/`bookId` reste (chemin mort, démolition n° 9). |
| `dossier:created` / `dossier:opened` | événement | émet/consomme | inchangés — `create()` émet `dossier:created` seule ; `open()` (déjà livré) émet `dossier:opened`. L'appelant (hook de création) enchaîne les deux, dans l'ordre, après persistance (KR-004). |
| `EditorTopBar` | composant | brain/components, étendu | `nodeCount?: number`, `onAddNode?: () => void` (ÉTAIENT requis → optionnels, rendu groupé), `backLabel?: string = 'Mes livres'`, `previewDisabledReason?: string` (texte du tooltip natif quand `onPreview` est absent ; défaut = texte actuel inchangé). Zéro prop requise modifiée — `EditorScreen.tsx` (Book) reste intact. |
| `DossierEditorScreen` | composant | `src/features/bascule-editeur/` (N), exposé via `index.ts` | `({ dossierId: string }): JSX.Element` — lit `dossiers.get(dossierId)` (pas de hook dédié, un seul appelant). |
| `useDossierLibrary().open` | hook (méthode ajoutée) | `src/features/book-library/hooks/useDossierLibrary.ts` | `(id: string) => void` — `dossierService.open(id)` PUIS `router.navigate({name:'dossier', dossierId:id})`, dans cet ordre (KR-004). |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-dossier-create` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `DossierService` gagne `create()` (id privé conforme `FORME_ID_DOSSIER`, seed valide via `construireAmorce`, KR-004) ; `randomToken()` extrait et partagé avec `createId()` ; `amorce.ts` porte le marqueur + les quatre textes ; `EditorTopBar` devient réutilisable pour l'écran dossier sans casser l'écran Book.
- **Seed exact** (dérivé de `RACINES`/`CHAMPS_REQUIS`/`LISTES_REQUISES`/`REFERENCES_SIMPLES`, jamais de `dossier-minimal.json` qui peuple tout) :
  ```ts
  const LIEU_INITIAL = 'lieu.amorce'   // conforme à FORME_IDENTIFIANT ; décrit l'ORIGINE du lieu, jamais son rang ni son rôle
  {
    schema: DOSSIER_SCHEMA, id, titre, createdAt: now, updatedAt: now,
    canon: {
      mj: { synopsis_mj: AMORCE.synopsis_mj },
      partage: { accroche_joueur: AMORCE.accroche_joueur },
      ton: AMORCE.ton,
      interdits_ton: [], objectifs: [],
    },
    monde: {
      personnages: [], lieux: [{ id: LIEU_INITIAL }],   // PAS de `nom` — voir § 6, désaccord 4
      objets: [], indices: [], quetes: [], evenements: [],
      conditions: { climat: [] },
    },
    charpente: {
      depart: { lieu_id: LIEU_INITIAL, texte_ouverture_joueur: AMORCE.texte_ouverture_joueur },
      jalons: [], fins: [],
    },
  }
  ```
- **Règle transverse posée ici, valable pour toute entité semée des n° 3 à n° 6** : un identifiant ne décrit jamais un rang, un rôle, ni un nom — seulement son origine. `lieu.amorce` la respecte ; ni `lieu.premier-lieu` (rang, faux dès réordonnancement) ni `lieu.point-de-depart` (rôle, faux dès que l'auteur déplace son départ) ne la respectaient.
- **Fichiers** : `src/brain/Router.ts` (R) · `src/brain/DossierService.ts` (R) · `src/brain/DossierService.test.ts` (R) · `src/brain/components/EditorTopBar.tsx` (R) · `src/brain/components/EditorTopBar.test.tsx` (N) · `src/brain/utils/id.ts` (R) · `src/brain/utils/id.test.ts` (N) · `src/brain/dossier/amorce.ts` (N) · `src/brain/dossier/amorce.test.ts` (N)
- **Expose / consomme** : signatures du § 4
- **Critères couverts** : #1, #2, #5, #8

### Lot 2 — `creation-et-ecran-dossier` *(contrat figé)*
- **Ouvrier** : `dev-lot`
- **But** : `book-creation` repointée sur `Dossier` (création → ouverture → navigation, dans l'ordre) ; `DossierEditorScreen` minimal monté sur la route `dossier` ; « + Nouveau dossier » réinjecté dans `LibraryScreen` ; garde morte KR-071 retirée d'`App.tsx`.
- **Fichiers** :
  `src/features/book-creation/hooks/useCreateDossier.ts` (N) ·
  `src/features/book-creation/components/CreateDossierEntry.tsx` (N) ·
  `src/features/book-creation/components/NewDossierButton.tsx` (N) ·
  `src/features/book-creation/components/NewDossierDialog.tsx` (N) ·
  `src/features/book-creation/tests/createDossierFlow.test.tsx` (N) ·
  `src/features/book-creation/tests/NewDossierDialog.test.tsx` (N) ·
  `src/features/book-creation/index.ts` (R) ·
  `src/features/book-creation/hooks/useCreateBook.ts` (D) ·
  `src/features/book-creation/components/CreateBookEntry.tsx` (D) ·
  `src/features/book-creation/components/NewBookButton.tsx` (D) ·
  `src/features/book-creation/components/NewBookDialog.tsx` (D) ·
  `src/features/book-creation/tests/createFlow.test.tsx` (D) ·
  `src/features/book-creation/tests/NewBookDialog.test.tsx` (D) ·
  `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (N) ·
  `src/features/bascule-editeur/index.ts` (N) ·
  `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (N) ·
  `src/App.tsx` (R)
- **Expose / consomme** : `LibraryScreenProps.createEntry` redevient monté (déjà optionnel depuis it1) ; consomme `dossiers.create/open`, `Route.dossier`, `DossierEditorScreen`
- **Critères couverts** : #2, #3, #4, #5, #7, #8

### Lot 3 — `ouvrir-un-dossier-depuis-la-bibliotheque` *(contrat figé ; PARALLÈLE au lot 2, DÉTACHABLE)*
- **Ouvrier** : `dev-lot`
- **But** : une carte de dossier lisible s'ouvre au clic sur son titre (navigue sur la route `dossier`) ; une carte illisible n'offre aucune affordance de clic.
- **Fichiers** : `src/features/book-library/components/DossierCard.tsx` (R) · `src/features/book-library/components/LibraryScreen.tsx` (R) · `src/features/book-library/hooks/useDossierLibrary.ts` (R) · `src/features/book-library/tests/dossierLibrary.test.tsx` (R)
- **Expose / consomme** : consomme `Route.dossier` (lot 1) et `dossiers.open` (déjà livré) ; ne consomme rien du lot 2 (navigue, ne rend pas l'écran)
- **Critères couverts** : #6

*(3 lots. Le lot 3 est réversible à coût nul : s'il est retiré, les lots 1 et 2 restent inchangés octet pour octet — voir § 8, désaccord 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** un titre non vide, **quand** l'auteur déclenche `DossierService.create(titre)`, **alors** le document rendu est valide au sens de `validateDossier` (`ok: true`, `errors: []`, **`warnings: []`**) et son `id` respecte `FORME_ID_DOSSIER` — testé à la création uniquement (correction du critère hérité : la duplication n'est câblée par aucune itération) — *niveau : contrat* — *lot 1*
2. **Étant donné** l'affordance « + Nouveau dossier », **quand** l'auteur confirme un titre, **alors** `dossier:created` puis `dossier:opened` partent dans cet ordre, APRÈS résolution de la persistance (KR-004), et l'auteur atterrit sur `DossierEditorScreen` ouvert sur ce dossier — *niveau : composant* — *lot 2*
3. **Étant donné** l'accueil, **quand** il se rend, **alors** « + Nouveau dossier » est de nouveau monté dans `LibraryScreen`, à côté de « Importer un dossier » — *niveau : composant* — *lot 2*
4. **Étant donné** `DossierEditorScreen` ouvert sur un dossier existant, **quand** il se rend, **alors** `EditorTopBar` affiche le titre du dossier, `← Mes dossiers`, ni compteur de nœuds ni « + Nœud » ; **étant donné** un `dossierId` inconnu, **alors** l'écran affiche « Dossier introuvable. » et un retour à l'accueil — *niveau : composant* — *lot 2*
5. **Étant donné** `DossierEditorScreen`, **quand** il se rend, **alors** « Aperçu du jeu » est visible mais désactivé, avec le `title` exact citant la feature n° 9 — pinné par DEUX tests distincts : le texte par défaut inchangé de l'écran Book, et le texte injecté de l'écran dossier — *niveau : composant* — *lots 1 et 2*
6. **Étant donné** une carte de dossier **lisible** dans la bibliothèque, **quand** l'auteur clique son titre, **alors** `dossier:opened` part avant la navigation et `router.current()` vaut `{name:'dossier', dossierId}` ; **étant donné** une carte **illisible**, **alors** son titre ne porte aucune affordance de clic (pas de rôle bouton, `Entrée` sans effet) — *niveau : composant* — *lot 3*
7. **Étant donné** `src/App.tsx`, **quand** on lit son code source, **alors** il ne contient plus ni la chaîne `'book:deleted'` ni l'identifiant `isEditingBook` (garde KR-071, devenue inarmable, retirée) — *niveau : contrat (grep de source)* — *lot 2*
8. **Étant donné** le dossier semé par `create()`, **quand** on lit `canon.mj.synopsis_mj`, `canon.partage.accroche_joueur`, `canon.ton` et `charpente.depart.texte_ouverture_joueur`, **alors** chacun commence par `MARQUEUR_A_ECRIRE`, cette chaîne n'apparaît nulle part ailleurs dans `src/`, et `monde.lieux[0]` ne porte pas de `nom` — *niveau : contrat (unitaire + grep)* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `DossierService.test.ts` — « create() sème un id conforme et un seed sans erreur ni avertissement » | `d = dossiers.create(titre)` ; `validateDossier(d)` → `ok:true`, `errors:[]`, `warnings:[]` ; `get(d.id)` non nul | contrat | KR-177/178 | 1 |
| `DossierService.test.ts` — « create() n'émet que dossier:created » | journal d'événements après `create()` seul ne contient pas `dossier:opened` | contrat | KR-004 | 1 |
| `DossierService.test.ts` — « create() titre vide retombe sur TITRE_PAR_DEFAUT » | `create('   ')` → titre non vide | contrat | — | 1 |
| `DossierService.test.ts` — « 50 create() : ids tous distincts et conformes » | échantillon, aucune collision, `errors:[]` chacun | contrat | KR-177 | 1 |
| `id.test.ts` — « randomToken() sans crypto.randomUUID reste conforme » | `crypto.randomUUID` neutralisé, 50 tirages distincts, forme `[a-z0-9-]+` | unitaire | KR-177 | 1 |
| `id.test.ts` — « createId() inchangé » | régression : `prefix_uuid`, séparateur `_` toujours présent | unitaire | — | 1 |
| `amorce.test.ts` — « chaque texte d'AMORCE porte le marqueur » | 4 assertions `startsWith(MARQUEUR_A_ECRIRE)` | unitaire | — | 1 |
| `amorce.test.ts` — « le marqueur n'est recopié nulle part ailleurs » | grep source : `'⟨à écrire⟩'` absent de `src/` hors `amorce.ts`/`amorce.test.ts` | contrat | — | 1 |
| `EditorTopBar.test.tsx` — « sans nodeCount/onAddNode, ni badge ni + Nœud » | `queryByRole('button',{name:/nœud/i})` → null, pas de badge de compte | composant | — | 1 |
| `EditorTopBar.test.tsx` — « tooltip désactivé par défaut inchangé (écran Book) » | pas de `previewDisabledReason` → texte actuel | composant | — | 1 |
| `EditorTopBar.test.tsx` — « tooltip désactivé injecté (écran dossier) » | `previewDisabledReason` fourni → `title` exact contient « feature n° 9 » | composant | — | 1 |
| `createDossierFlow.test.tsx` — « créer un dossier, dans l'ordre, jusqu'à l'écran » | `['dossier:created','dossier:opened']`, magasin déjà écrit au premier, écran rend le titre | composant | KR-004 | 2 |
| `createDossierFlow.test.tsx` — « double soumission ne crée qu'un dossier » | `dblClick('Créer')` → `dossiers.list()` longueur 1 | composant | — | 2 |
| `NewDossierDialog.test.tsx` — validation/clavier | Créer désactivé tant que titre trim vide ; Entrée soumet ; Annuler/Esc ferment | composant | KR-013 | 2 |
| `dossierEditorScreen.test.tsx` — « rendu au mot près » | titre, `← Mes dossiers`, état vide nommé, « Aperçu du jeu » désactivé + title exact | composant | — | 2 |
| `dossierEditorScreen.test.tsx` — « dossierId inconnu » | « Dossier introuvable. » + retour accueil | composant | — | 2 |
| `dossierEditorScreen.test.tsx` (describe « racine de composition ») — « garde KR-071 retirée » | `readFileSync('src/App.tsx','utf8')` ne contient ni `'book:deleted'` ni `isEditingBook` | contrat (grep) | KR-071 | 2 |
| `dossierLibrary.test.tsx` — « clic sur le titre d'une carte lisible ouvre le dossier » | `dossier:opened` avant navigation, route = `{name:'dossier', dossierId}` | composant | KR-004 | 3 |
| `dossierLibrary.test.tsx` — « carte illisible : aucune affordance » | pas de rôle bouton sur le titre, `{Enter}` sans effet, route inchangée | composant | — | 3 |
| `dossierLibrary.test.tsx` — « non-régression : compte de "Télécharger le fichier" stable » | le nouveau bouton-titre n'élargit pas la requête par nom existante | composant | — | 3 |

Cas limites couverts ci-dessus : titre vide/espaces · double soumission · annulation (Esc/scrim) · carte illisible (jamais cliquable). Hors ligne : déjà couvert par l'indice cloud-first d'it1/book-creation-it3, non redémontré ici. Référence orpheline : sans objet, le seed résout par construction.

**Limite connue de l'instrument, à ne jamais lire comme une preuve plus forte qu'elle ne l'est** (narratif-ia, tour 2) : `errors:[] + warnings:[]` prouve la conformité au *schéma*, jamais que l'amorce a été *rédigée* — aucun code d'anomalie ne connaît la notion de texte-modèle. La détection (n° 7) et le refus d'ouverture sur amorce non rédigée (n° 9) sont des features futures, nommées, pas construites ici.

**Non vérifiable en l'état** — aucune : les 8 critères sont couverts par jest/RTL, aucun n'attend un instrument absent.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | UX (tour 1) vs PM/Tech Lead | Le clic « rouvrir une carte de dossier existant » appartient-il à it2 ? | `RETENU` | Lot 3, détachable à coût nul. L'UX a retiré son objection en tour 2 : it2 change la promesse implicite de la bibliothèque (elle sait désormais créer un document éditable), la laisser sans clic de retour est un vide fonctionnel. Le report d'it1 était conditionné à l'inexistence de la route — it2 la crée, ce n'est pas rouvrir la décision, c'est honorer sa condition. |
| 2 | QA (tour 1) vs Tech Lead | Exporter `FORME_ID_DOSSIER` pour tester `createDossierId()` sans dupliquer la regex ? | `REJETÉ` | La QA a retiré sa demande en tour 2 : `expect(v.errors).toEqual([])` sur le round-trip `validateDossier()` est une égalité stricte au tableau vide — strictement plus forte qu'un test de regex ciblé, sans exporter ni dupliquer. |
| 3 | Narratif & IA (tour 1) vs Tech Lead | Exporter `estTexteDeSeed()` (prédicat) en plus de `MARQUEUR_A_ECRIRE` ? | `REJETÉ` | Zéro appelant aujourd'hui ; ses deux futurs lecteurs (n° 7 : balayage, n° 9 : porte booléenne) ont des besoins différents — l'écrire ici choisirait une signature à l'aveugle. Narratif & IA a retiré cette partie de sa proposition en tour 2. `MARQUEUR_A_ECRIRE` (constante) reste exporté : deux appelants dans ce lot (seed + test). |
| 4 | Narratif & IA vs Tech Lead (exemple de tour 1) | Le lieu semé porte-t-il un `nom` ? | `RETENU` | OMIS. `nom` est de destination `auteur` — le seul champ du seed qui ne peut PAS porter le marqueur sans polluer les listes d'entités des n° 3-6 ; le repli d'affichage existe déjà et se calcule, il ne se stocke pas. |
| 5 | Tech Lead vs Narratif & IA (tour 1) | Identifiant du lieu semé : `lieu.premier-lieu` vs `lieu.point-de-depart` ? | `RETENU corrigé` | Ni l'un ni l'autre : `lieu.amorce`. Un rang (« premier ») et un rôle (« point de départ ») sont tous deux mobiles ; seule l'origine (« semé avec le dossier ») ne change jamais. Règle générale écrite au § 5, lot 1, pour les n° 3 à n° 6. |
| 6 | Tech Lead vs UX | Nom de la prop `EditorTopBar` pour le tooltip désactivé : `previewDisabledHint` vs `previewDisabledReason` ? | `RETENU` | `previewDisabledReason` (UX) — le tech-lead a cédé son propre nom en tour 2. |
| 7 | QA vs Tech Lead | KR-071 : test fonctionnel (supprimer pendant que l'écran est ouvert → retour accueil) ou test-grep sur `App.tsx` ? | `RETENU corrigé` | Test-grep. Le chemin fonctionnel est inatteignable depuis la route `dossier` (`remove()` n'a d'affordance que sur l'accueil) — un test qui l'exercerait appellerait le service à la main. La QA a convergé en tour 2, avec un ajout : l'absence doit aussi couvrir l'identifiant `isEditingBook`, pas seulement la chaîne `'book:deleted'`. |
| 8 | PM/Tech Lead | Critère hérité « id testé à la création ET à la duplication » | `RETENU corrigé` | Réécrit « testé à la création uniquement » — `duplicate()` n'a de propriétaire dans aucune itération planifiée. |
| 9 | Tech Lead | `design_contract.registres_de_langue` de la feature est-il contredit par le seed ? | `RETENU clarifié` | Non contredit, mais insuffisant : la clause couvre la copie d'interface de la feature, pas le contenu que `create()` sème. D'où le dispositif d'amorce marquée (§ 3), qui comble précisément ce point aveugle. |
| 10 | Narratif & IA / Tech Lead | KR-178 de la spec (« repli "Lieu n°1 (sans nom)" ») | `REPORTÉ` | Vers la mise à jour de `specification.json` (étape 7 du raffinage) : c'est une sortie de `localiserEntite()` au moment du rapport, jamais une valeur à semer — à reformuler avant l'ouverture du lot 1. |
| 11 | Tech Lead | Emplacement de l'écran minimal : nouveau fichier vs branche dans `EditorScreen.tsx` | `RETENU` | Nouveau fichier `DossierEditorScreen.tsx`. Zéro touche à `EditorScreen.tsx` (Book, condamné à la démolition n° 9) — plus strict que « strict nécessaire », jamais en contradiction avec lui. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto n'a tenu au tour 2 — pas de bloc `ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés touché ; à confirmer par grep en fin d'itération, pas à supposer)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de `book-creation`/`book-library`/`tree-canvas`/`cloud-sync` (les 5 suites de `tree-canvas`/`cloud-sync` qui montent encore la route `editor` restent vertes sans modification)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `specification.json` de `bascule-editeur` : KR-178 reformulé (désaccord #10) avant l'ouverture du lot 1
- [ ] Dossier de revue écrit : `.claude/raffinage/bascule-editeur-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | lot 3 retenu (désaccord #1), critère #6 hérité corrigé (désaccord #8) |
| Tech Lead | recevable sous réserve | export `createDossierId` refusé/`randomToken` extrait (désaccord #2), `estTexteDeSeed` rejeté (désaccord #3), `nom`/id du lieu tranchés (désaccords #4, #5), nommage de prop cédé (désaccord #6), test KR-071 remplacé (désaccord #7) |
| UX | recevable | objection de tour 1 retirée (désaccord #1), nommage de prop confirmé (désaccord #6) |
| QA | recevable sous réserve | export `FORME_ID_DOSSIER` retiré (désaccord #2), test KR-071 nommé explicitement (désaccord #7) |
| Narratif & IA | recevable sous réserve | `estTexteDeSeed` retiré (désaccord #3), `nom`/id du lieu tranchés (désaccords #4, #5), KR-178 à corriger (désaccord #10) |
