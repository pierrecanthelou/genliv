# Tour 1 — UX — `dossier-canon` it1

RISQUE — L'anatomie OÙ/QUOI/QUOI-FAIRE des erreurs (`IssueList`, déjà conforme au contrat `rapport_erreurs` de `dossier-format`) vit dans `src/features/dossier-format/components/`, pas `brain/components/`. `dossier-canon` en devient le second consommateur réel (refus d'`update()`) : un import direct casserait l'isolation de feature (KR-109, ESLint). Ni la spec de `dossier-canon` ni ce raffinage ne l'anticipent.

OBJECTION — Le `design_contract` hérité dit « Field (avec hint, maxLength/showCounter) réutilisé tel quel » : faux à la lecture, `Field.tsx` (127 lignes, vérifiées) n'a NI `maxLength` NI `showCounter` aujourd'hui. Ce n'est pas une réutilisation, c'est une extension à écrire dans CE lot — et le comptage doit reprendre la règle EXACTE de `compterMots` (`validate.ts:204`, non exportée) : deux définitions divergentes de « mot » afficheraient un compteur UI vert quand le service avertit déjà (ou l'inverse).

PROPOSITION — (1) Promouvoir `IssueList` dans `brain/components/` avant que `dossier-canon` en ait besoin (même geste que `ListRow` pour `bascule-editeur`). (2) Étendre `Field` de `maxLength?: number` (en MOTS) + `showCounter?: boolean`, en exportant `compterMots` depuis `validate.ts` pour que compteur d'écran et avertissement du service comptent identiquement. Détail des 5 points en annexe.

VERDICT — recevable sous réserve : les deux extensions (`IssueList`→`brain/`, `Field.maxLength`/`showCounter`+`compterMots` exportée) sont un préalable de lot, pas un détail à improviser en cours de code.

---

## Annexe — contrat de design figé, itération 1 « Canon »

### 0 · Fichiers/contrats préalables (à porter par le lot contrat de cette itération, avant le lot feature)
- `src/brain/components/IssueList.tsx` — déplacé depuis `dossier-format` (composant + test, réexporté par `brain/components/index.ts` et `brain/index.ts`). `dossier-format` le réimporte depuis `brain/` (zéro changement de comportement, un seul déplacement).
- `src/brain/dossier/validate.ts` — `compterMots` exporté (nommé, pas renommé) ; c'est la SEULE définition de « mot » du projet.
- `src/brain/components/Field.tsx` — deux props optionnelles ajoutées : `maxLength?: number` (budget en MOTS, jamais en caractères) et `showCounter?: boolean` (défaut `false`, rétrocompatible avec tous les appelants existants qui ne les passent pas).

### 1 · La Card Canon — quatre champs, dans cet ordre

| # | Composant | `label` | `hint` | `placeholder` | Autres props |
|---|---|---|---|---|---|
| 1 | `Field` | `SYNOPSIS MJ` | `interne — la vérité complète` | « Rédigez ici la vérité complète de l'histoire, y compris ce que le joueur ignore encore : qui est le Gardien du Gouffre, et pourquoi il a scellé la Clé d'Aldûr. » | `multiline rows={6} maxLength={BUDGET_MOTS_CANON} showCounter` |
| 2 | `Field` | `ACCROCHE JOUEUR` | `lue par le joueur` | « Une brume froide s'accroche aux ruines de Val-Cendre. On raconte qu'un sceau y retient quelque chose que personne n'a jamais vu revenir. » | `multiline rows={4} maxLength={BUDGET_MOTS_CANON} showCounter` |
| 3 | `Field` | `TON` | `interne — consigne injectée au modèle` | « Grave, laconique, sans ironie. » | `multiline rows={2}` — **aucun compteur** (`BUDGET_MOTS_CANON` ne couvre que `canon.mj`/`canon.partage`, `tables.ts:256-257`) |
| 4 | liste `INTERDITS DE TON` | — (titre autoportant, pas un `Field`) | `interne — consignes injectées au modèle` | par ligne : « Pas d'anachronismes modernes. » | voir ci-dessous |

Titre de la liste 4 : `<span>` avec le style interne du `label` de `Field` (`font-family: var(--font-mono); font-size: var(--fs-eyebrow); color: var(--text-label); letter-spacing: var(--track-eyebrow)`), texte exact `INTERDITS DE TON`, suivi de `<span style={{ color: 'var(--ink-6)' }}> — interne, consignes injectées au modèle</span>`.

Chaque interdit existant : `Field` sans `label` visible, `ariaLabel="Interdit de ton n°{index+1}"`, `value={interdit}`, `placeholder="Pas d'anachronismes modernes."`, sur une ligne avec `IconButton` (`label="Retirer l'interdit n°{index+1}"`, `tone="danger"`, contenu `✕`), `gap: var(--space-3)`.

Ligne finale, **toujours présente** (même si la liste a des éléments) : bouton pleine largeur, texte exact `+ Ajouter un interdit…`, style repris de `NewDossierButton`/`ImportDossierButton` (seul précédent « + Ajouter » du dépôt) mais à l'échelle d'une ligne de liste : `border: 1.5px dashed var(--accent)`, `border-radius: var(--r-md)`, `color: var(--accent)`, `background: var(--accent-bg)`, `min-height: var(--hit-target)`, `padding: 7px 10px`, `font-family: var(--font-ui)`, `font-size: var(--fs-body)`. Aucune ligne « aucun interdit » séparée : liste vide = seule cette ligne s'affiche (état calme, `canon.interdits_ton` n'exige pas d'être non-vide — `tables.ts:46`, confirmé par l'amorce qui sème `[]` sans avertissement).

### 2 · Comportement des deux compteurs (`synopsis_mj`, `accroche_joueur`)

- Rendu **par `Field` lui-même** (nouveau bloc sous le `textarea`, actif seulement si `showCounter`), pas par le composant appelant — sinon deux features dupliqueraient la mise en page.
- Formule d'affichage exacte : `` `${compterMots(value)}/${maxLength} mots` `` → ex. `« 214/600 mots »`.
- Style : `text-align: right`, `font-family: var(--font-mono)`, `font-size: var(--fs-meta)`, `margin-top: var(--space-2)`.
- Couleur, DEUX zones seulement (règle héritée de `dossier-format`, non réinterprétée) : `n < maxLength * 0.9` → `var(--text-faint)` ; `n >= maxLength * 0.9` → `var(--bad)`. Seuil pour 600 = **540 mots**. Jamais de bordure/fond sur le `textarea` — le rouge/vert restent réservés réussite/échec de jet.
- Comptage identique à celui du service : `compterMots` importé depuis `brain/dossier/validate.ts` (exporté par le lot contrat), jamais réimplémenté dans `Field`.

### 3 · `MARQUEUR_A_ECRIRE` à l'ouverture

**Tranché : aucun traitement visuel spécial.** Les quatre champs de prose affichent `AMORCE.synopsis_mj` / `AMORCE.accroche_joueur` / `AMORCE.ton` comme **valeur** normale du `Field` (couleur `--text-body` par défaut, identique à du texte rédigé) — pas de teinte, pas d'icône, pas de bordure distincte. Justification : les chevrons mathématiques (`⟨à écrire⟩`) sont déjà le signal, improbables en prose rédigée (`amorce.ts`) ; ajouter une couleur créerait une troisième signification chromatique dans un système qui n'en réserve que deux (réussite/échec de jet) — un veto sur la discipline de l'accent, appliqué par extension au reste de la palette sémantique. Aucun comportement de sélection automatique au focus n'est ajouté (hors périmètre, `Field` reste un contrôle contrôlé standard).

### 4 · Tokens confirmés (existants dans `src/styles/tokens/`, aucun ajout)
`--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-meta`, `--fs-body`, `--fw-semibold`, `--track-eyebrow`, `--text-label`, `--text-body`, `--text-faint`, `--text-muted`, `--text-strong`, `--bad`, `--accent`, `--accent-bg`, `--border-field`, `--border-card`, `--border-subtle`, `--border-divider`, `--surface-card`, `--paper-1`, `--r-md`, `--r-xl`, `--r-3xl`, `--space-1/2/3/4/5/6/8`, `--hit-target`, `--lh-body`, `--shadow-card`, `--ink-6` (le `hint` de `Field` l'utilise déjà). Aucune valeur en dur.

### 5 · Refus vs avertissement — distinction visuelle dans la Card

**Refus** (`statut: 'refuse'`, ex. synopsis vidé) : **rien n'est réinitialisé** — le `Field` garde exactement ce que l'auteur a tapé, jamais un revert vers la dernière version persistée. Un bandeau apparaît **sous les 4 champs**, au-dessus d'`IssueList` (promu `brain/`) : eyebrow mono `« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »` en `--bad` — seul endroit de cet écran où `--bad` colore un texte hors compteur de mots, parce que c'est un blocage réel, pas une rédaction en cours. `IssueList` rend chaque `errors[]` avec son anatomie standard (OÙ/QUOI/QUOI-FAIRE). Le focus **reste sur le champ modifié** (jamais renvoyé vers la liste — ergonomie clavier : l'auteur continue de corriger sans reprendre la souris). Pour Canon, la seule anomalie bloquante atteignable est `champ-vide` sur `synopsis_mj`/`accroche_joueur`/`ton` (les 3 `CHAMPS_REQUIS` de cette racine, `tables.ts:85-87`) — message exact déjà fixé par le validateur : `« Le champ « {synopsis_mj|accroche_joueur|ton} » est vide alors qu'il est obligatoire. »`.

**Avertissement seul** (`statut: 'ecrit'`, `warnings` non vide — seul cas possible en it1 : `texte-trop-long` sur `synopsis_mj` ou `accroche_joueur`) : le patch **est** persisté, aucun bandeau, aucune `IssueList`. Le signal est **exclusivement** porté par le compteur du champ concerné, déjà `--bad` dès 540 mots (§2) — il n'existe aucun autre code d'avertissement atteignable sur Canon en it1 (`texte-sans-condition` ne s'applique qu'à `objectifs`/`fins`, hors périmètre it1/it3). Pas de duplication du message de warning : le compteur EST le rendu à l'écran exigé par le critère d'acceptation. À rouvrir si un futur type de warning sur Canon apparaît sans affordance dédiée.
