# Tour 1 — `ux-designer`

**VERDICT** : recevable sous réserve — la règle d'élision du tiret et la fonction `brain/` unique doivent entrer au plan, sinon **veto sur la lisibilité de « — · BLOQUANT »**.

**RISQUE** — le point dur n° 1 est déjà tranché par le `goal` lui-même : « porter le NIVEAU », pas un compte. Le vrai risque est ailleurs : une fusion mécanique « compte · MOT » produit **« — · BLOQUANT »** sur exactement les deux sections qui portent le seul contrôle vivant aujourd'hui — pas un cas limite théorique, **le premier rendu de production**.

**OBJECTION** — le contrat de design d'it1 ne prévoit aucune règle pour `compte() === '—'`. Concaténer littéralement le tiret et le mot juxtapose deux signaux contradictoires — « rien à compter » et « quelque chose ne va pas » — dans une seule pastille. Le gabarit `${compte} · ${MOT}` sans ce cas particulier est une faute de lisibilité, pas un détail cosmétique.

**PROPOSITION** — **le mot REMPLACE le tiret, il ne s'y ajoute jamais** : `compte === SANS_COMPTE ? MOT : \`${compte} · ${MOT}\``. Cette règle **et** la table mot/ton vivent en une fonction `brain/` pure, jamais une constante `SANS_COMPTE` exportée et relue par la vue — c'est une décision de produit, pas une donnée d'affichage. Sur `muted` partagé entre INFO et section saine : **je le retiens tel quel** — le mot est le seul discriminant voulu par le contrat de couleurs d'it1 ; inventer une sixième teinte pour INFO serait la vraie faute. Aucun badge sur l'entrée « Contrôles ».

## Textes — les neuf états

| # | Cas | Texte | Ton |
|---|---|---|---|
| 1 | Section saine, compte réel | `6 fiches` | `muted` — **inchangé** |
| 2 | Section saine, SANS compte | `—` | `muted` — **inchangé** |
| 3 | **Bloquant, SANS compte** (Départ aujourd'hui) | `BLOQUANT` | `bad` — le tiret **disparaît** |
| 4 | Bloquant, avec compte (it3) | `3 fiches · BLOQUANT` | `bad` |
| 5 | **Alerte seule, SANS compte** (Canon aujourd'hui) | `ALERTE` | `neutral` |
| 6 | Alerte seule, avec compte (it3) | `12 fiches · ALERTE` | `neutral` |
| 7 | Info seule (it3) | `4 fiches · INFO` | `muted` — **identique en ton** à une section saine, distinct par le mot ; aucune section saine ne porte jamais le mot `INFO` |
| 8 | Plusieurs niveaux mêlés | seulement le pire (`BLOQUANT`) — jamais une liste de mots | du pire |
| 9 | Entrée « Contrôles » | **aucun badge** | — |

**Cohérence des deux surfaces** : même mot, même casse, même ton que `ListeControles` — garantie **mécaniquement** par la table partagée, pas par discipline de revue.

**Clavier / lecteur d'écran** : `ListRow` est déjà un `<button>` natif, rien n'est dû. Le mot est un **texte** dans le `Badge`, jamais porté par la seule couleur — aucun `aria-label` supplémentaire.

## Jetons — zéro token nouveau

`bad` → `--bad` / `--bad-line` / `--bad-bg-2` · `neutral` → `--ink-2` / `--line-1` / `--paper-0` · `muted` → `--ink-4` / `--line-2` / `--paper-0`. Le séparateur `·` est une ponctuation dans la chaîne composée, pas un jeton — même convention que `SECTIONS['jalons-fins'].compte()`.

## Point ouvert pour le tech-lead

`libelleBadgeSection` / `tonBadgeSection` doivent vivre en **un seul endroit** consommé par les deux surfaces, sinon la table se duplique et divergera. Je ne tranche ni où ce module vit, ni si c'est un lot `contrat` — je pose seulement que **la duplication de la table est une faute de système** si elle survient.
