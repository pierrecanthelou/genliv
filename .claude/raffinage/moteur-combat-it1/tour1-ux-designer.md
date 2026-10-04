# UX Designer — moteur-combat it1 — Tour 1

## RISQUE
1. Un SegmentedControl sélectionne, il ne déclenche pas. Sans bouton, le clic ne produit rien.
2. PV du héros à deux lecteurs : BandeauHeros et EcranCombat. Le bandeau est périmé en cours de combat si la session n'est écrite qu'à la clôture.
3. L'ancien écran colorait les jauges en --good/--bad et le PE en --accent. Usage décoratif des couleurs sémantiques.

## OBJECTION
1. Pas de composant « bouton plein à libellé ». CarteJet bricole un : color 'white', fontWeight 600, et --text-primary non défini.
2. L'ancien écran masquait le log vide. L'état vide est absent, viole la règle projet.
3. Il tutoie (« Choisis ta posture ») alors que le projet vouvoie.
4. Le « Prochain round → » intermédiaire coûte une touche par round pour aucune valeur.
5. SegmentedControl sans flèches ni tabindex itinérant.

## PROPOSITION
- Pas de jauges : texte mono uniquement. EcranCombat n'affiche que le monstre. BandeauHeros reçoit les PV et PE vivants du rejeu.
- SegmentedControl pré-sélectionné sur Normale + bouton « Jouer le round → ».
- Étendre IconButton avec wide?: boolean, en tone="accent".
- Étendre SegmentedControl avec flèches et tabindex itinérant.
- Un seul Badge neutral pour l'issue.

## VERDICT
RÉSERVE. Aucun veto. Elle se lève si les objections 1 et 2 sont reprises au plan.

## ANNEXE — Contrat de design EcranCombat

Composants : Card, SegmentedControl (extension additive), Badge, IconButton (extension additive wide).
Tokens : --space-3/4/9, --bw-hair, --r-xl, --font-ui, --font-mono, --fs-eyebrow, --fs-meta, --fs-body, --fs-title, --fw-semibold, --track-eyebrow-wide, --lh-body, --text-strong|body|muted|faint|label, --surface-sunken, --border-subtle, --border-field.
Interdits : --good, --bad, --accent* (hors primitives), --text-primary, toute valeur littérale.
Textes exacts : vouvoiement. COMBAT · JOURNAL DE COMBAT · POSTURE — ROUND {n} · ISSUE DU COMBAT. Segments lus de POSTURES[k].label. Aide de posture visible (pas en title). Badge VICTOIRE/DÉFAITE/INCONSCIENT. Bouton « Jouer le round → ». Journal vide dashed. Après DÉFAITE : « PARTIE TERMINÉE ».
