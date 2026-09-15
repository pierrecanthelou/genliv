# Tour 1 — `pm-produit`

**VERDICT** : recevable sous réserve (mot-seul tranché explicitement + silence de l'entrée « Contrôles » nommé au hors-périmètre).

**RISQUE** — que « 6 fiches · 2 bloquants » s'installe par réflexe alors que `parSection` ne porte qu'un NIVEAU. Ouvrir un lot contrat sur une feature à 19 décisions actées coûte un tour et retarde la substance qu'it3/it4 apportent réellement.

**OBJECTION** — la phrase de démo tient à peine : seules **2 sections sur 10** peuvent s'allumer, les quatre contrôles d'it1 n'en couvrant pas d'autres. « Quelle section porte une anomalie » est vrai mais monotone. Ce n'est pas nul pour autant — **un badge ambiant, visible hors du panneau Contrôles** (en éditant Personnages, voir que Canon cloche) a une valeur que le panneau seul n'offre pas. Mais le cadrage ne tranche pas si l'entrée « Contrôles » elle-même porte un résumé global : silence qui laisse un angle mort à l'ouvrier.

**PROPOSITION** — trancher par écrit maintenant : (a) le badge dit le **MOT** du niveau, jamais un compte — zéro lot `brain/`, cohérent avec la forme livrée ; (b) l'entrée « Contrôles » ne porte **aucun** badge à it2, nommé au hors-périmètre plutôt que laissé à l'arbitrage ; (c) `n` reste 4 et it2 passe **avant** it3 — verrouiller KR-218 sur un petit périmètre (deux lignes) avant qu'it3 ne le multiplie est la bonne tranche squelette ; inverser livrerait cinq règles de registre sans aucun signal dans la nav pendant tout un cycle.

## Hors périmètre

- **Le compte par niveau** (« 2 bloquants ») — aucun lot contrat sur `RapportControles` à it2.
- **Section saine** : badge inchangé en texte et en teinte (`tone="muted"`, compte existant) — jamais de coche verte.
- **Dossier entièrement rédigé** : tous les badges redeviennent muets automatiquement (`parSection` revient à `null` partout) — comportement dérivé attendu, à couvrir par un test dédié plutôt que supposé.
- **L'entrée « Contrôles »** (second landmark) ne porte aucun badge.
- **Le clic d'une ligne vers sa section et le focus qui suit** — déjà actés vers it3, aucune réouverture.
- **Aucune interaction propre au badge** (infobulle, popover listant les constats) au-delà du `onSelect` de ligne existant.
- **Aucune modification de `sections.ts`** (registre `SECTIONS` / `compte()` intact) ni d'`IssueList.tsx` / `ListRow.tsx`, sauf si la fusion l'exige — à instruire par le tech-lead.
