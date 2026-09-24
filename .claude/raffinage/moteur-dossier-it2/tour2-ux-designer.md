# Tour 2 — ux-designer — moteur-dossier it2

RÉPONSE — **narratif** : forme lisible, un correctif de glyphe s'impose. Le badge « → MOTEUR » collisionnait avec le « → » de transition (`lieu.val-cendre → lieu.caverne-basse`) : deux flèches, deux sens, même ligne. MOTEUR bascule sur `↻`, JOUEUR garde `↪` — le `>` de la commande est une donnée du narratif, pas mon chrome. Confirmé : `tour`/`role` ne sont jamais redits dans `texte`.
**tech-lead** : mes deux refus survivent verbatim, déplacés dans `commandes.ts`. Propriété scindée — je possède le GABARIT français, `commandes.ts` l'interpolation et l'assemblage ; `ConsoleCommandes.tsx` se contente de rendre `refus`.

MES OBJECTIONS
— « refus jamais journalisé » : **MAINTENUE**, convergence des trois rôles — je passe.
— REJETÉ `--bad` : **MAINTENUE**.
— REJETÉ `<select>` : **MAINTENUE, DURCIE** — étendue au `<datalist>` que je retire moi-même.
— Mon OBJECTION tour 1 (texte de journal / sort du refus) : **RETIRÉE** — le narratif a tranché § A.
— Ma PROPOSITION `list`/`<datalist>` : **RETIRÉE** — jsdom ne témoigne d'aucune autocomplétion, seulement d'options présentes ; remplacée par une ligne ambiante « Accès disponibles : {ids} », testable en texte simple. **`Field` n'a plus besoin QUE de `mono`.**

POSITION — **X-1** : je défends **(a)**, `Field.tsx` entre en L1 — coût réduit à **1 prop**, contre (b) un input maison (mon veto) ou (c) une boîte `--font-ui` non-mono pour des identifiants. **M-13** : l'écran n'affiche jamais « tour » — `#{n}` nu, sans libellé, quelle que soit la doctrine interne du narratif.

VERDICT — **recevable sous réserve** : L1 liste `Field.tsx` + `Field.test.tsx`.

---

## ANNEXE — Contrat de design FINAL, it2

### 0. Ce qui change par rapport au tour 1

1. **`Field.tsx` entre dans le lot `contrat` L1**, pas dans L2. Motif : fichier de `brain/`, règle du dépôt.
   | | Chemin |
   |---|---|
   | R | `src/brain/components/Field.tsx` (+1 prop `mono`, additive) |
   | R | `src/brain/components/Field.test.tsx` (cas `mono`) |
2. **`list?: string` et `<datalist>` sont RETIRÉS.** Motif : jsdom rend l'élément mais ne témoigne d'aucune autocomplétion — un test ne peut jamais séparer un `<input list>` qui filtre d'un qui ne filtre pas, seulement constater des `<option>` présentes. Remplacé par une ligne de texte ambiante, toujours visible, testable par simple assertion de texte.
3. **Badge `MOTEUR`** : glyphe `→` remplacé par `↻` (collision avec le `→` de transition dans `texte`).
4. **`JournalRowProps`** aligné sur la signature du tech-lead : `{ entree: EntreeJournal }`, déstructuré en interne.
5. **`journal[].origine?` (X-2)** : hors de mon anatomie tant que narratif/tech-lead n'ont pas convergé — `JournalRow` ne le rend pas en it2, zéro couplage.

### 1. Anatomie de la console (mise à jour)

Emplacement, fichier, éléments natifs inchangés du tour 1 — `EcranPartie` → `PartieEnCours` → `colonneLecture`, second enfant après `<section aria-label="Journal">`. Fichier `src/features/play-mode/components/ConsoleCommandes.tsx`. Un `<form>` + un unique champ `Field` + un bouton. **Zéro second widget — ni `<select>`, ni `<datalist>`.**

```tsx
<section aria-label="Console">
  {accesDisponibles.length === 0 ? (
    <p style={texteImpasse}>
      Aucun accès depuis ce lieu — la console n'a aucune commande à proposer.
    </p>
  ) : (
    <>
      <form onSubmit={handleSubmit}>
        <Field
          id="console-commande"
          label="CONSOLE"
          mono                      // EXTENSION Field — seule prop ajoutée
          placeholder="Tapez une commande…"
          value={saisie}
          onChange={...}
        />
        <button type="submit" style={boutonExecuter}>EXÉCUTER</button>
      </form>
      <p style={texteAccesDisponibles}>
        Accès disponibles : {accesDisponibles.join(', ')}.
      </p>
    </>
  )}
  {refus !== null && (
    <p style={texteRefusConsole}>
      <span aria-hidden="true">⊘ </span>{refus}
    </p>
  )}
</section>
```

`accesDisponibles` = `destinationsPossibles(...)`, identifiants tels quels (jamais `lieux[].nom`) — même source que le message de refus « destination inconnue », donc jamais deux vérités.

**Extension retenue pour `Field.tsx`** — UNE prop additive, non cassante pour les 25 appelants mesurés :
```ts
mono?: boolean   // bascule shared.fontFamily de var(--font-ui) à var(--font-mono)
```
Coût des deux issues écartées :
- **(b) input maison dans `play-mode`** — viole mon propre veto de domaine, duplique la CSS de `Field` sans bénéfice pour ses autres appelants.
- **(c) `Field` sans `mono`** — boîte `--font-ui` pour un identifiant (`lieu.foret-noire`), faute de registre typographique déjà actée au contrat de la feature.

**Opérabilité clavier** — inchangée du tour 1 : `Tab` : `✕ Quitter le test` → *(lignes de journal non focusables)* → `CONSOLE` → `EXÉCUTER`. `Entrée` soumet nativement. `Échap` hérite du comportement it1 (quitte vers l'éditeur), aucun second sens. Accepté → champ vidé, focus repris. Refusé → focus reste, saisie fautive conservée.

### 2. Tous les textes visibles, mot pour mot (mis à jour)

| Élément | Texte exact | Registre |
|---|---|---|
| Libellé du champ | `CONSOLE` | auteur |
| `aria-label` section | `Console` | auteur |
| Placeholder | `Tapez une commande…` | auteur |
| Bouton | `EXÉCUTER` | auteur |
| **Accès disponibles (ambiant, sous le champ, visible tant que ≥ 1 accès)** | `Accès disponibles : {ACCES}.` — identifiants joints `, ` | développeur-débogueur |
| Refus — verbe hors registre | `Commande inconnue : « {saisie} ». Commandes disponibles : {VERBES}.` — composé par `commandes.ts` depuis `Object.values(COMMANDES).map(c => c.verbe)` ; en it2 : `Commande inconnue : « ALER lieu.foret-noire ». Commandes disponibles : ALLER.` | développeur-débogueur |
| Refus — destination hors accès | `Destination inconnue depuis ce lieu : « {argument} ». Accès disponibles : {ACCES}.` | développeur-débogueur |
| Impasse jouable | `Aucun accès depuis ce lieu — la console n'a aucune commande à proposer.` | auteur |
| `TEXTE_JOURNAL_VIDE` | inchangé — `Aucun évènement pour l'instant — vos actions y apparaîtront.` | auteur |

**Qui possède la phrase** : je possède le gabarit français (mots, ponctuation, guillemets « ») des deux refus ; `commandes.ts` possède l'interpolation (`{VERBES}`/`{ACCES}`) et l'assemblage final — les littéraux vivent dans `commandes.ts`, pas dans `ConsoleCommandes.tsx`, qui ne fait que rendre `refus: string | null`. Aucun texte n'utilise `--bad`.

### 3. Anatomie de `JournalRow` — mise à jour

```ts
export interface JournalRowProps {
  entree: EntreeJournal   // { tour, role, texte } — brain/dossier/session.ts
}
```

```tsx
function JournalRow({ entree }: JournalRowProps) {
  const { tour, role, texte } = entree
  return (
    <li style={ligneJournal}>
      <span style={tourJournal}>#{tour}</span>
      <Badge tone="neutral">{role === 'joueur' ? '↪ JOUEUR' : '↻ MOTEUR'}</Badge>
      <span style={role === 'joueur' ? texteJoueur : texteMoteur}>{texte}</span>
    </li>
  )
}
```

- **`Badge tone="neutral"`, jamais `good`/`bad`** : le rôle n'est pas un résultat de jet.
- Différenciation joueur/moteur par le **ton** (`--text-muted` / `--text-body`), jamais par couleur sémantique.
- `#{tour}` : **nu, sans le mot « tour »** — résout M-13 côté écran quelle que soit la doctrine interne (§ J1).
- Pas de `ListRow` : `onSelect` requis romprait le contrat ; `JournalRow` est un `<li>` non focusable.

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
const texteAccesDisponibles: CSSProperties = {
  margin: 0, marginTop: 'var(--space-2)',
  fontFamily: 'var(--font-mono)', fontSize: 'var(--fs-meta)',
  color: 'var(--text-faint)', lineHeight: 'var(--lh-body)',
}
const texteImpasse: CSSProperties = {
  margin: 0, fontFamily: 'var(--font-ui)', fontSize: 'var(--fs-body)',
  color: 'var(--text-muted)', lineHeight: 'var(--lh-body)',
}
```

Aucun token neuf : tous déjà vérifiés au tour 1.

### 4. Registres de langue

| Registre | Où |
|---|---|
| Auteur | `CONSOLE`, `Tapez une commande…`, `EXÉCUTER`, `aria-label="Console"`, l'impasse calme |
| Développeur-débogueur | les deux refus, l'accès ambiant, `#{tour}`, les badges `JOUEUR`/`MOTEUR`, `texte` de chaque `JournalRow` |
| Joueur | inchangé, `OutcomeBlock` seul (aucun ajout it2) |

### 5. REJETÉS (BUG-082)

| # | Rejeté | Statut |
|---|---|---|
| 1 | Teinter un message de refus en `--bad` | MAINTENU |
| 2 | `<select>` de destinations en plus du champ | MAINTENU, DURCI — étendu au `<datalist>` |
| 3 | `Field.list` / `<datalist>` natif (ma propre proposition tour 1) | **RETIRÉ** — jsdom aveugle à l'autocomplétion, remplacé par la ligne ambiante « Accès disponibles » |
| 4 | Journaliser une commande refusée | MAINTENU — convergence tri-rôle |

### 6. Infobulle du CTA désactivé (D-6)

Inchangé : reste reportée, `EditorTopBar.tsx` hors de tout lot d'it2 (confirmé T-10).
