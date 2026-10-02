# Raffinage `moteur-acteurs` it2 — Tour 1 — UX Designer

## RISQUE
Même classe de défaut que BUG-142 (it1) : une surface d'affichage neuve montée « quelque part » sans fichier assigné à un lot, ou montée dans un primitive dont l'anatomie imposée ne correspond pas à l'usage réel.

## OBJECTION
`Modal` (`brain/components/Modal.tsx`) rend INCONDITIONNELLEMENT un footer à deux boutons (« Annuler » / « Enregistrer ») — absurde sur un tiroir de pure consultation, rien à valider. Le contrat de design dit « tiroir/Modal » sans trancher. Et `ListRow.onSelect` est REQUIS par son propre docstring (« aucune variante non interactive n'a d'appelant », précédent `onReorder` rejeté) — le carnet est justement une liste non interactive : lui donner un `onSelect={() => {}}` reproduirait le smell que ce composant a explicitement condamné.

## PROPOSITION (détail complet en annexe)
1. `IconButton` 🗝 monté dans `CadrePartie.tsx` (nouvelle prop optionnelle `actionsEntete?: ReactNode`, groupée avec le bouton « Quitter le test ») — passé uniquement par `PartieEnCours` dans `EcranPartie.tsx`, jamais par `EcranRefus` ni par l'écran de création de héros.
2. Étendre `Modal` d'un `hideFooter?: boolean` — second appelant réel (le carnet), pas une dette à un seul appelant.
3. Étendre `ListRow.onSelect` en optionnel (rendu `<div>` non focusable si absent, mêmes tokens visuels) — même raisonnement : second appelant réel.
4. `CarnetIndices.tsx` neuf dans `play-mode/components/`.

## VERDICT
Recevable sous réserve — les deux extensions de primitives (`Modal.hideFooter`, `ListRow.onSelect?`) doivent être actées par le Tech Lead avant tout lot ; sans elles, un composant maison de repli devient nécessaire, ce qui serait un veto.

---

# ANNEXE — Contrat de design, itération 2 `moteur-acteurs` (carnet d'indices)

## 1. Point de montage exact

**Fichier modifié : `src/features/play-mode/components/CadrePartie.tsx`**

Nouvelle prop optionnelle sur `CadrePartieProps` :
```ts
readonly actionsEntete?: ReactNode
```

JSX du header (remplace les lignes 57-59) :
```tsx
<header style={entete}>
  <span style={titreEntete}>...</span>
  <div style={groupeActions}>
    {actionsEntete}
    <button type="button" onClick={sortir} aria-label={LIBELLE_SORTIE} style={boutonSortie}>
      ✕ {LIBELLE_SORTIE}
    </button>
  </div>
</header>
```
```ts
const groupeActions: CSSProperties = { display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }
```
`justifyContent: 'space-between'` du header reste à **deux** enfants (titre / groupe d'actions) — aucun changement de layout pour `EcranRefus.tsx`, qui n'appelle pas `actionsEntete` et obtient un rendu strictement identique à l'existant.

**Fichier modifié : `src/features/play-mode/components/EcranPartie.tsx`**, fonction `PartieEnCours` :
- Nouvel état `const [carnetOuvert, setCarnetOuvert] = useState(false)`.
- `<CadrePartie ... actionsEntete={<ActionsCarnet count={session.monde.indices_connus.length} onOuvrir={() => setCarnetOuvert(true)} />}>`.
- En fin de l'arbre de `PartieEnCours` :
```tsx
return (
  <>
    <CadrePartie ...>...</CadrePartie>
    {carnetOuvert && (
      <CarnetIndices dossier={dossier} session={session} onFermer={() => setCarnetOuvert(false)} />
    )}
  </>
)
```
**Jamais monté** sur l'écran de création de héros (`session.heros === undefined`) — ce `return` précoce n'appelle pas `actionsEntete`. Intentionnel : aucun indice n'est révélable avant que le héros existe.

`ActionsCarnet` est un petit composant interne à `EcranPartie.tsx` (pas un fichier neuf, sous le seuil KR-112), groupant l'`IconButton` et son `Badge` compteur.

## 2. `CarnetIndices.tsx` — composant neuf

**Fichier créé : `src/features/play-mode/components/CarnetIndices.tsx`**

```ts
export interface CarnetIndicesProps {
  readonly dossier: Dossier
  readonly session: EtatSession
  readonly onFermer: () => void
}
```

Corps :
```tsx
<Modal title={TITRE_CARNET} onClose={onFermer} hideFooter>
  {indices.length === 0 ? (
    <div style={etatVideCarnet}>
      <span aria-hidden="true" style={glypheVideCarnet}>🗝</span>
      <p style={texteVideCarnet}>{TEXTE_VIDE_CARNET}</p>
    </div>
  ) : (
    <ul style={listeCarnet}>
      {indices.map(({ id, recit, tour, verbe }) => (
        <li key={id}>
          <ListRow title={recit} subtitle={`#${tour} — ${verbe}`} />
        </li>
      ))}
    </ul>
  )}
</Modal>
```

**Dérivation (zéro état stocké, KR-013/KR-286)** — pour chaque `id` de `session.monde.indices_connus` (ordre déjà chronologique, append-only) :
```ts
const entree = session.journal.find((e) =>
  e.deltas?.some((d) => d.delta === 'reveler_indice' && d.effet === 'applique' && d.cibles.includes(id)),
)
```
- `recit` = `entree.recit` (**à vérifier par le Tech Lead** si le champ existe sur `EntreeJournal`, sinon `entree.texte` — même champ que `JournalRow`/`OutcomeBlock` affichent déjà).
- `tour` = `entree.tour`.
- `verbe` = `COMMANDES[entree.origine]?.verbe ?? '—'` — fallback défensif nommé, aucun test ne garantit l'invariant aujourd'hui, à QA de trancher.

**Registres** : `title` (recit) = fiction, police `--font-ui` (déjà celle de `ListRow.title`). `subtitle` (`#tour — VERBE`) = interface, mono (déjà celle de `ListRow.subtitle`) — zéro token neuf.

## 3. Textes exacts

| Élément | Texte |
|---|---|
| `aria-label`/`title` de l'`IconButton` | `Carnet d'indices` |
| Glyphe du bouton | `🗝` |
| Titre de la `Modal` | `Carnet d'indices` (sentence case, aligné sur les 5 `Modal` existantes du dépôt) |
| État vide | `Aucun indice découvert pour l'instant — explorez, parlez, fouillez.` |
| Libellé de ligne (subtitle) | `#{tour} — {VERBE}`, ex. `#4 — PARLER` |

## 4. Tokens (zéro valeur en dur)
`--space-3`, `--space-8`, `--space-10`, `--bw-strong`, `--border-field`, `--r-xl`, `--paper-1`, `--fs-h1`, `--text-faint`, `--text-muted`, `--lh-body`, `--font-mono`, `--fs-meta`, `--font-ui`, `--fs-body` — tous déjà existants, utilisés ailleurs dans `play-mode/`. État vide du carnet copie littéralement les constantes `etatVide`/`glypheVide`/`texteVide` déjà définies dans `EcranPartie.tsx` — question pour le Tech Lead : exporter ou dupliquer, jamais réinventer une troisième variante.

## 5. Compteur — tranché
**Compteur total** (pas « non lus ») : `session.monde.indices_connus.length`, `Badge tone="neutral"`, **masqué si 0**. Zéro état neuf, dérivé à la volée. Pas de compteur « non lus » en it2 : « lu » n'existe dans aucun champ du domaine, en créer un serait un état neuf non dérivable hors scope.

## 6. Comportement clavier
- `IconButton` 🗝 : `<button>` natif, Tab l'atteint juste avant « Quitter le test », Entrée/Espace l'actionnent.
- Ouverture : `Modal` capture `document.activeElement` et le restaure au démontage — déjà câblé, rien à ajouter.
- Dans la modale : piège de focus déjà écrit dans `Modal.tsx` ; `ListRow` non focusable (carnet lecture seule), seul `✕ Fermer` reste focusable.
- `Échap` : `dismiss` → `onFermer` → focus revient sur 🗝.

## 7. Extension proposée — `ListRow.onSelect` optionnel
```ts
export interface ListRowProps {
  title: string
  subtitle?: ReactNode
  leading?: ReactNode
  trailing?: ReactNode
  selected?: boolean
  /** Optionnel : absent → élément non interactif (carnet d'indices, lecture seule). */
  onSelect?: () => void
}
```
`onSelect !== undefined` → `<button>` (inchangé pour tous les appelants existants) ; `onSelect === undefined` → `<div>` mêmes styles moins `cursor: pointer`. Deux appelants réels justifient l'extension.

## 8. Extension proposée — `Modal.hideFooter`
```ts
export interface ModalProps {
  ...
  /** true → aucun footer rendu. Pour les tiroirs de pure consultation. */
  hideFooter?: boolean
}
```
`{!hideFooter && <div style={footer}>...</div>}`. Défaut `false`, zéro régression sur les 5 appelants existants.

## 9. ESLint proposé
Les règles existantes couvrent déjà `CarnetIndices.tsx`. Proposition ciblée (QA/Tech Lead) : un test greppable verrouillant KR-286 — « `play-mode/components/**` ne lit jamais `.indices[` suivi de `.nom` ».

## 10. Décisions prises en autonomie faute de spécification
- Point de montage du bouton 🗝 (header `CadrePartie` vs `BandeauHeros` vs `PlayerInputBar`) → choisi `CadrePartie`/`actionsEntete` → `BandeauHeros` se promet « stats lecture seule », y ajouter une action casserait cette promesse et referait le travail clavier/focus que `CadrePartie`+`Modal` offrent déjà.
- Casse du titre de la `Modal` (mono-majuscules vs sentence case) → sentence case, aligné sur les 5 `Modal` existantes → mono-majuscules serait l'unique titre de ce type dans tout le dépôt, sans raison de registre.
- Compteur « non lus » vs total vs rien → total, dérivé, masqué à 0 → « non lus » exigerait un état neuf non dérivable ; « rien » laisserait le joueur sans signal.
- Répartition `recit`/libellé entre `title`/`subtitle` → `title`=recit (fiction, `--font-ui`), `subtitle`=`#tour — VERBE` (interface, `--font-mono`) → l'inverse mettrait de la fiction en police mono/meta, faute de registre.
- `ListRow` sans `onSelect` → étendre le composant (optionnel) plutôt qu'un `onSelect={() => {}}` → reproduirait le smell déjà condamné par le docstring du composant (précédent `onReorder`).
- `Modal` sans footer utile → étendre `Modal` (`hideFooter`) plutôt qu'un tiroir maison → évite soit des boutons absurdes, soit un second composant de dialogue maison.
