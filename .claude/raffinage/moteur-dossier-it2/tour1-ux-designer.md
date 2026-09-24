# Tour 1 — ux-designer — moteur-dossier it2

RISQUE — « Console » évoque un terminal à texte libre ; le cadrage (n°33) interdit tout interpréteur de texte libre, même discipline que les conditions de l'auteur. Sans contrat écrit séparant « saisie tapée » de « grammaire parsée », l'essaim recrée un mini-parseur verbe+argument.

OBJECTION — Le `goal` d'it2 ne dit rien du texte de journal pour une entrée `role:'moteur'` après un déplacement, ni du sort d'une commande refusée (journalisée ou pas ?). Sans trancher, deux lots livrent deux journaux différents.

PROPOSITION — Le champ réutilise `Field` (déjà nommé au contrat feature : « Field, saisie de commande, mono »), étendu de deux props additives non cassantes : `mono?: boolean` (boîte en `--font-mono`) et `list?: string` (relaie `<input list>`) pour un `<datalist>` natif énumérant, dérivées de `lieux[].acces`, les commandes valides à l'instant T — zéro composant maison. Validation = appartenance à un ensemble FINI, jamais un split grammatical. Une commande refusée n'est JAMAIS journalisée (`RoleJournal` n'a pas de variante « erreur ») : message inline sous le champ.

REJETÉ — teinter ce message en `--bad` : réservé au jet, jamais à une saisie invalide (règle 4, discipline de l'accent). REJETÉ — un `<select>` de destinations en plus du champ : le `<datalist>` natif suffit, un second widget serait décoratif.

VERDICT — recevable sous réserve : contrat complet en annexe (textes, tokens, impasse calme, refus) ; le tech-lead confirme l'algorithme exact de validation (lookup pur vs split verbe/argument) avant lot.

---

## ANNEXE — Contrat de design it2 (hors quota)

### 1. Anatomie de la console

**Emplacement** — dans `EcranPartie` → `PartieEnCours`, à l'intérieur de `colonneLecture`, comme **second enfant** après `<section aria-label="Journal">` : `OutcomeBlock` → Journal (transcript) → Console (saisie). Ordre lecture = ordre Tab.

**Fichier neuf** : `src/features/play-mode/components/ConsoleCommandes.tsx`.

**Élément natif** : un `<form>` + un **unique champ texte** (composant `Field` réutilisé, pas de composant maison) + un `<datalist>` natif pour la découverte des destinations. **Aucun `<select>` séparé**.

```tsx
<section aria-label="Console">
  <form onSubmit={handleSubmit}>
    <Field
      id="console-commande"
      label="CONSOLE"
      mono                       // EXTENSION proposée à Field
      list={destinationsId}      // EXTENSION proposée à Field — undefined si impasse
      placeholder="Tapez une commande…"
      value={saisie}
      onChange={...}
    />
    {destinationsId && (
      <datalist id={destinationsId}>
        {commandesValides.map((cmd) => <option key={cmd} value={cmd} />)}
      </datalist>
    )}
    <button type="submit" style={boutonExecuter}>EXÉCUTER</button>
  </form>
  {refus !== null && (
    <p style={texteRefusConsole}>
      <span aria-hidden="true">⊘ </span>{refus}
    </p>
  )}
</section>
```

**Choix de la destination** — `lieu.acces` (`types.ts:1017`, `acces?: string[]`, absent ET `[]` se traitent IDENTIQUEMENT comme l'impasse) est une liste FINIE et connue à l'instant T. Elle alimente un `<datalist>` natif dont les options sont les commandes complètes déjà composées (`ALLER {id}`, une par accès) — zéro second widget, la découverte se fait par autocomplétion en tapant, sans deviner un identifiant. La validation à la soumission se fait par **appartenance de la chaîne saisie à un ensemble fini** recalculé à chaque rendu (verbe du registre × accès courants) — jamais un `.split()` suivi d'un `switch`, qui recréerait la grammaire rejetée en n°33. *(Si le dev-lot doit séparer verbe/argument pour composer les deux messages de refus distincts, c'est un split trivial à arité fixe — pas une grammaire à opérateurs — mais je demande au tech-lead de le confirmer avant lot : borne de mon domaine.)*

**Opérabilité clavier** :
- Ordre `Tab` : `✕ Quitter le test` (header) → *(les lignes de journal ne sont PAS focusables)* → champ `CONSOLE` → bouton `EXÉCUTER`.
- `Entrée` dans le champ **soumet nativement le formulaire** (un seul `<input>` dans un `<form>`) — aucun `onKeyDown` maison requis.
- `Échap` **hérite du comportement d'it1, inchangé** : quitte vers l'éditeur, même si le focus est dans le champ. Je ne lui donne pas un second sens (« vider le champ ») : ce serait contradictoire avec § 3.F d'it1 (Échap fait *exactement* ce que fait le bouton visible). **Risque assumé, non corrigé** : un testeur qui presse Échap pour corriger une faute de frappe quitte l'écran — à surveiller, la cohérence avec it1 prime pour it2.
- Après une commande **acceptée** : le champ se vide et reprend le focus (sync impérative légitime — le testeur enchaîne plusieurs commandes sans reprendre la souris).
- Après un **refus** : le focus reste dans le champ, la saisie fautive n'est **pas** effacée — l'auteur corrige sans retaper.

**Extension proposée à `Field.tsx`** (`src/brain/components/Field.tsx`) — additive, non cassante pour les ~20 appelants actuels :
```ts
mono?: boolean   // bascule `shared.fontFamily` de `var(--font-ui)` à `var(--font-mono)`
list?: string    // relayé tel quel sur <input list={list}>
```
Lecture littérale de la clause déjà actée au contrat de la feature (« Field, saisie de commande, mono ») : `Field` box est aujourd'hui en `--font-ui` (vérifié, `Field.tsx:32`), une commande porte des identifiants (`lieu.foret-noire`) qui doivent être en `--font-mono` par convention du système.

### 2. Tous les textes visibles, mot pour mot

| Élément | Texte exact | Registre |
|---|---|---|
| Libellé du champ (`Field.label`) | `CONSOLE` | auteur (symétrique de `JOURNAL`) |
| `aria-label` de la section | `Console` | auteur |
| Placeholder | `Tapez une commande…` | auteur |
| Bouton de soumission | `EXÉCUTER` | auteur |
| Refus — verbe hors registre | `Commande inconnue : « {saisie} ». Commandes disponibles : {VERBES}.` — en it2 : `Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER.` (`{VERBES}` = clés du registre, `.toUpperCase()`, jointes `, `) | développeur-débogueur |
| Refus — destination hors accès | `Destination inconnue depuis ce lieu : « {argument} ». Accès disponibles : {ACCES}.` (`{ACCES}` = `lieu_courant.acces`, identifiants tels quels, joints `, `) | développeur-débogueur |
| Impasse jouable — `lieu_courant.acces` absent ou `[]` (remplace le `<form>` en entier, ÉTAT CALME) | `Aucun accès depuis ce lieu — la console n'a aucune commande à proposer.` | auteur |
| `TEXTE_JOURNAL_VIDE` | **inchangé** — `Aucun évènement pour l'instant — vos actions y apparaîtront.` | auteur |

Aucun texte n'utilise `--bad` : un refus de commande n'est pas un échec de jet.

### 3. Anatomie de `JournalRow` — `src/features/play-mode/components/JournalRow.tsx`

```ts
export interface JournalRowProps {
  tour: number
  role: RoleJournal   // 'joueur' | 'moteur'
  texte: string
}
```

Rendu, dans un `<ul style={{listStyle:'none', margin:0, padding:0}}>` qui remplace le `null` de la branche it1 :

```tsx
<li style={ligneJournal}>
  <span style={tourJournal} aria-hidden="true">#{tour}</span>
  <Badge tone="neutral">{role === 'joueur' ? '↪ JOUEUR' : '→ MOTEUR'}</Badge>
  <span style={role === 'joueur' ? texteJoueur : texteMoteur}>{texte}</span>
</li>
```

- **`Badge` réutilisé tel quel** (`brain/components/Badge.tsx`) — `tone="neutral"`, jamais `good`/`bad` : le rôle n'est pas un résultat de jet.
- **Différenciation joueur/moteur PAR LE TON, jamais par une couleur sémantique** : `texteJoueur` en `--text-muted` ; `texteMoteur` en `--text-body`.
- Tokens exacts, tous lus dans `tokens/*.css` :

```ts
const ligneJournal: CSSProperties = {
  display: 'flex', alignItems: 'baseline', gap: 'var(--space-3)',
  padding: 'var(--space-3) var(--space-4)',
  borderBottom: 'var(--bw-hair) solid var(--border-subtle)',
  fontFamily: 'var(--font-mono)',
}
const tourJournal: CSSProperties = { fontSize: 'var(--fs-meta)', color: 'var(--text-faint)', flexShrink: 0 }
const texteJoueur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-muted)' }
const texteMoteur: CSSProperties = { fontSize: 'var(--fs-body)', color: 'var(--text-body)' }
```

- **Pas de `ListRow`** (rappel n°29) : `onSelect` requis (`ListRow.tsx:48`) romprait le contrat — `JournalRow` est un `<li>`, jamais un `<button>`, donc **non focusable**.
- Boutons de la console :

```ts
const boutonExecuter: CSSProperties = {
  fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
  padding: 'var(--space-3) var(--space-5)', borderRadius: 'var(--r-md)',
  border: 'var(--bw-hair) solid var(--accent)', background: 'var(--accent)',
  color: 'var(--text-on-accent)', fontWeight: 'var(--fw-semibold)',
  cursor: 'pointer', minHeight: 'var(--hit-target)',
}   // accent légitime : seule action interactive primaire de l'écran
const texteRefusConsole: CSSProperties = {
  margin: 0, marginTop: 'var(--space-2)',
  fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
  color: 'var(--text-muted)', lineHeight: 'var(--lh-body)',
}
const texteImpasse: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)',
  color: 'var(--text-muted)', lineHeight: 'var(--lh-body)',
}
```

### 4. Registres de langue — récapitulatif

| Registre | Où |
|---|---|
| Auteur | `CONSOLE`, `Tapez une commande…`, `EXÉCUTER`, `aria-label="Console"`, l'impasse calme |
| Développeur-débogueur | les deux messages de refus, `#{tour}`, les badges `JOUEUR`/`MOTEUR`, `texte` de chaque `JournalRow` |
| Joueur | inchangé, uniquement les enfants d'`OutcomeBlock` (aucun ajout it2) |

### 5. Infobulle du CTA désactivé — décision

**Reste REPORTÉE, n'entre pas en it2.** J'en suis propriétaire (D-6), mais le déclencheur écrit exige « un relevé navigateur consigné (Chrome + Firefox, dossier non jouable, survol du CTA) » — aucun outil de ce tour ne peut produire cette mesure. Fabriquer le correctif `<span title>` sur une prémisse non mesurée serait exactement la faute que « mesure d'abord » interdit. `EditorTopBar.tsx` reste hors de tout lot d'it2.

### Fichiers relevés (lecture seule)
`EcranPartie.tsx` · `OutcomeBlock.tsx` · `brain/components/Field.tsx` · `ListRow.tsx` · `Badge.tsx` · `brain/dossier/types.ts` (l. 1017) · `design_handoff_gamebook_editor/tokens/{colors,spacing,typography}.css` · `src/styles/tokens/spacing.css` (`--hit-target: 44px`) · `specification.json` · `moteur-dossier-cadrage.plan.md` · `moteur-dossier-it1.plan.md`
