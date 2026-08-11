# Tour 1 — UX Designer

## Note d'ouverture

**RISQUE** — `SegmentedControl<T>` exige aujourd'hui `value: T`, pas `T | undefined`. Or KR-191 est explicite : `camp` est optionnel, sans défaut forcé. Si personne n'élargit la signature, l'agent codeur va soit forcer un `CAMP_INITIAL` (viole KR-191, badge « Protagoniste » mensonger sur tout personnage neuf), soit bricoler un composant maison. C'est une extension de composant existant, pas un composant neuf — je la spécifie en annexe.

**OBJECTION** — Les deux précédents directs (`PanneauLieux`, `ObjectifsCanon`) livrent création **et** retrait dans la même itération ; le cadrage n'en dit rien pour les personnages en it1. Je ne bloque pas le périmètre, mais je signale l'asymétrie pour que ce soit un choix assumé, pas un oubli. Deuxième objection, plus dure : la tentation narrative de teinter le badge « Antagoniste » en `tone="bad"` — antagoniste n'est pas un échec de jet, c'est une donnée de camp. Je la ferme explicitement dans le contrat : les deux badges (camp, plan) sont `tone="neutral"`, sans exception.

**PROPOSITION** — Étendre `SegmentedControl.value` à `T | undefined` (aucune fill = état neutre, zéro CSS nouveau). Réutiliser `localiserEntite('pnj', …)` tel quel pour le repli — il produit déjà exactement « Personnage n°N (sans nom) ». Aucun `IssueList` en it1 : `camp`/`plan` sont des choix fermés, `objectif_id` résout toujours une vraie référence ou rien — `statut: 'refuse'` est structurellement inatteignable, même raisonnement qu'`ObjectifsCanon.tsx`. L'accordéon se réinitialise au bloc 1 par `key={personnage.id}` (remontage React), jamais par un `useEffect`.

**VERDICT** — Pas de veto. Un composant à étendre (`SegmentedControl`, additif). Une question de périmètre pour le PM (retrait). Contrat complet en annexe.

---

## ANNEXE — Contrat de design, itération 1 `dossier-fiches`

### 0. Composant à étendre (pas neuf)

`brain/components/SegmentedControl.tsx` : élargir `SegmentedControlProps<T>.value` à `T | undefined`. Comportement inchangé quand `value` est défini (`active = option.value === value`) ; quand `value === undefined`, aucune option ne matche → les deux segments rendent déjà, sans autre changement, l'état inactif existant (`background: transparent`, `color: var(--text-muted)`). Aucun nouveau glyphe, aucune nouvelle couleur.

### 1. Layout général — `PanneauPersonnages.tsx`

Deux colonnes, motif `PanneauLieux` :
- **Colonne liste** (largeur `320px`, `gap: var(--space-3)`), eyebrow `PERSONNAGES` (`font-mono`, `fs-eyebrow`, `text-label`, `track-eyebrow`).
- **Colonne fiche** (`flex: 1`) : soit l'état vide, soit `FichePersonnage`.

Bouton d'ajout, texte exact, **toujours visible** sous la liste (même si liste vide) : `+ Ajouter un personnage…`
Style identique à `boutonAjouterStyle` de `PanneauLieux.tsx` (bordure `1.5px dashed var(--accent)`, fond `var(--accent-bg)`, texte `var(--accent)`, `r-md`, `hit-target`).

**Liste vide** (état réel et atteignable — `monde.personnages` démarre à `[]`) : la colonne fiche affiche le gabarit centré pointillé, glyphe `❏`, texte exact :
`Aucun personnage — cliquez « + Ajouter un personnage… » pour commencer.`
Tokens : `border: 1.5px dashed var(--border-field)`, `border-radius: var(--r-xl)`, `background: var(--surface-inset)`, `padding: var(--space-10) var(--space-8)`, `max-width: 480px`, glyphe `fs-h1`/`text-faint`, texte `text-muted`/`lh-body`.

**Repli sans nom** (liste et titre) : `localiserEntite('pnj', personnage, index)` — aucune chaîne à écrire, la fonction produit déjà `Personnage « X »` / `Personnage n°N (sans nom)`.

**`ListRow`** par personnage : `title` = repli ci-dessus, `subtitle` = `personnage.id`, `trailing` = Badge(s) :
- `Badge(tone="neutral")` — libellé du plan, toujours présent : `Premier plan` / `Second plan`.
- `Badge(tone="neutral")` — libellé du camp, **seulement si `camp` est défini** : `Protagoniste` / `Antagoniste`. Absent = rien (KR-191). **Jamais `tone="bad"`/`tone="good"`**.

### 2. Accordéon — anatomie des 8 emplacements

Composant neuf, local : `features/dossier-fiches/components/Accordion.tsx`.

```
interface AccordionSection { id: string; title: string; trailing?: ReactNode; content: ReactNode }
interface AccordionProps { sections: AccordionSection[]; defaultOpenId: string }
```

**Un seul bloc ouvert à la fois.** État interne `useState<string>(defaultOpenId)`. Le parent force la réinitialisation au bloc 1 en posant `key={personnage.id}` sur `<Accordion>` — remontage React, **jamais un `useEffect`** (KR-013/113).

Racine : `overflow: 'hidden', borderRadius: 'var(--r-3xl)'`. Chaque en-tête de bloc (sauf le premier) : `borderTop: '1px solid var(--border-divider)'`.

En-tête = `<button type="button">`, `minHeight: var(--hit-target)`, `padding: var(--space-4) var(--space-5)`, `display:flex; justify-content:space-between; align-items:center`. Titre : `fs-body`, `fw-semibold`, `text-strong`. Chevron : glyphe `▾` — `transform: rotate(-90deg)` replié, `rotate(0deg)` déplié, couleur `text-muted`, `fs-meta`.

Contenu déplié : `padding: var(--space-5)`, `gap: var(--space-6)` en colonne.

**Ordre et titres exacts des 8 blocs** :

| # | Titre exact | Contenu it1 | `trailing` | Placeholder si vide |
|---|---|---|---|---|
| 1 | `Camp, plan & rattachement` | camp + plan + objectif_id | Badge(plan) + Badge(camp si défini) | — (rempli dès cette itération) |
| 2 | `Identité` | — | `Pas encore renseigné` | `Pas encore renseigné — ce bloc arrive à l'itération 2 de dossier-fiches.` |
| 3 | `Caractéristiques` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 2 de dossier-fiches.` |
| 4 | `Objectif & plan d'actions` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 3 de dossier-fiches.` |
| 5 | `Savoirs` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 6 | `Relations` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 7 | `Présence` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 4 de dossier-fiches.` |
| 8 | `Caractère exploitable` | — | idem | `Pas encore renseigné — ce bloc arrive à l'itération 5 de dossier-fiches.` |

Contenu déplié des blocs 2–8 : un unique `<p>`, `font-family: var(--font-ui)`, `fs-body`, `color: var(--text-muted)`. Le `trailing` court reste visible replié.

**Bloc 1 ouvert par défaut** — à la création d'un personnage et à chaque sélection dans la liste, tant qu'aucune autre itération n'introduit de mémoire de bloc ouvert (hors périmètre it1).

### 3. Contenu du bloc 1

**CAMP** — eyebrow `CAMP` au-dessus d'un `SegmentedControl<CampPersonnage>` :
- Options exactes : `{ value: 'protagoniste', label: 'Protagoniste' }`, `{ value: 'antagoniste', label: 'Antagoniste' }`.
- `ariaLabel="Camp du personnage"`.
- **Aucune valeur forcée à la création** : `personnage.camp` reste `undefined` tant que l'auteur n'a pas cliqué.

**PLAN** — eyebrow `PLAN`, même idiome, `SegmentedControl<Portee>` :
- Options exactes : `{ value: 'premier', label: 'Premier plan' }`, `{ value: 'second', label: 'Second plan' }`.
- `ariaLabel="Plan du personnage"`.
- **Valeur forcée à la création** (`portee` déjà requis) : constante nommée `PORTEE_INITIALE: Portee = 'premier'`.

**OBJECTIF RATTACHÉ** — eyebrow `OBJECTIF RATTACHÉ` au-dessus de :
- Si `canon.objectifs.length === 0` : pas de `Select`, paragraphe texte exact :
  `Aucun objectif défini dans le canon — ce personnage restera sans objectif tant qu'aucun n'existe.`
  Style : idiome `legendeStyle` de `PanneauDepart.tsx`.
- Sinon : `Select<string>` avec en première option `{ value: '', label: 'Aucun objectif rattaché' }`, puis une option par `canon.objectifs` dans l'ordre du tableau, `value = objectif.id`, `label = localiserEntite('objectif', objectif, index)`. `value` du `Select` = `personnage.objectif_id ?? ''`. Aucun filtrage par camp.

### 4. Refus / bandeau

**Aucun `IssueList` en it1** dans cette fiche : `camp`/`plan` sont des choix fermés, `objectif_id` ne référence que des `canon.objectifs[].id` réels ou `undefined` — `statut: 'refuse'` structurellement inatteignable depuis ce bloc.

### 5. Clavier

Pas de modale cette itération. `ListRow` et boutons d'en-tête d'accordéon sont des `<button>` natifs (Tab : liste → « + Ajouter… » → blocs 1→8 ; dans le bloc 1 déplié : SegmentedControl camp → SegmentedControl plan → Select objectif) ; Entrée/Espace activent nativement ; aucun `onKeyDown` maison.
