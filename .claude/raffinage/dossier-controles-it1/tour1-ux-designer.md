# Tour 1 — `ux-designer`

**VERDICT** : recevable sous réserve (réconciliation avec `amorce.ts` avant verrouillage des lignes QUOI FAIRE).

**RISQUE** — un dossier importé dont les quatre proses n'ont jamais porté le marqueur déclenche l'état CALME : la règle ne voit que le marqueur littéral, jamais un champ vide. L'auteur peut lire « rien à signaler » sur une ouverture jamais écrite. Ce n'est pas un défaut d'it1 — le contrat le dit — mais la copie doit l'annoncer, pas le cacher.

**OBJECTION** — `amorce.ts` n'était pas dans la borne de six fichiers, donc non ouvert : les quatre lignes QUOI FAIRE ci-dessous sont **provisoires**, à confronter au texte réel avant verrouillage, sous peine de doublon ou de contradiction.

**PROPOSITIONS** — (1) pas de sous-titre sur « Contrôles » : absence honnête plutôt qu'une clé de chemin inventée. (2) Séparateur `border-top: 1px solid var(--border-rule)` + `padding-top: var(--space-3)` sur un conteneur après la map. (3) `ListeControles` reprend l'anatomie-ligne d'`IssueList` à l'identique ; seul le **conteneur** change — `max-height`/`overflow-y` migrent vers le wrapper de page, jamais sur le `<ul>`. (4) Seul ajout : la pastille, en tête d'un `<li>` devenu `flex-direction: row`. (5) Le mapping de tons couvre les trois `NiveauControle` dès it1 (exhaustivité compilée), INFO inclus bien que sans producteur avant it3 — sinon it3 rouvre `ListeControles.tsx`, ce que la promesse d'extension du registre interdit. (6) Aucun chip « jouable » séparé : le signal est la présence ou l'absence d'une ligne BLOQUANT.

## Textes

**Entrée de nav** — libellé `Contrôles`, casse phrase. **Aucun sous-titre** (les dix autres portent `section.cle`, un chemin réel ; « Contrôles » n'en a pas, en inventer un mentirait). Conteneur séparé après le `.map(SECTIONS)`, filet du haut. État sélectionné : mécanisme `selected` de `ListRow`, aucun jeton neuf.

**Panneau** — `PanneauControles.tsx` neuf, n'étend pas `PanneauSection.tsx`. Wrapper de page copié de `PanneauSection.page` (`flex:1`, `min-height:0`, `box-sizing:border-box`, `overflow-y:auto`, `padding: var(--space-12)`) : c'est lui qui défile, pas la liste. `ListeControles` reprend du `<ul>` d'`IssueList` : `list-style:none`, `margin:0`, `padding:0`, `border:1px solid var(--border-divider)`, `border-radius: var(--r-md)` — et **retire** `max-height:240` et `overflow-y:auto`, gabarit de modale. Chaque `<li>` passe en `flex-direction:row` (`gap: var(--space-3)`, `align-items:flex-start`, `padding: var(--space-4)`, filet `--border-divider` sauf la dernière) pour loger la pastille en premier enfant, puis un second enfant en colonne portant les trois `<p>` OÙ / QUOI / QUOI FAIRE, jetons identiques à `IssueList`.

**Les quatre lignes** *(⚠ telles que rendues par l'UX, elles RECOPIENT le glyphe — à interpoler depuis `MARQUEUR_A_ECRIRE`, KR-223 ; arbitrage au tour 3)* :

1. `charpente.depart.texte_ouverture_joueur` — **BLOQUANT** · OÙ : `DÉPART · TEXTE D'OUVERTURE — lu par le joueur, mot pour mot` · QUOI : « Le texte d'ouverture porte encore le marqueur … : le joueur le lirait tel quel au premier écran. » · QUOI FAIRE : « Rédigez le texte que le joueur doit lire en arrivant. »
2. `canon.mj.synopsis_mj` — **ALERTE** · OÙ : `CANON · SYNOPSIS — matériau du modèle, jamais lu tel quel` · QUOI : « Le synopsis à l'attention du meneur de jeu porte encore le marqueur … » · QUOI FAIRE : « Rédigez le synopsis qui orientera le modèle sur l'intrigue. »
3. `canon.partage.accroche_joueur` — **ALERTE** · OÙ : `CANON · ACCROCHE — matériau du modèle, jamais lu tel quel` · QUOI : « L'accroche destinée au modèle porte encore le marqueur … » · QUOI FAIRE : « Rédigez l'accroche qui donnera envie de commencer. »
4. `canon.ton` — **ALERTE** · OÙ : `CANON · TON — matériau du modèle, jamais lu tel quel` · QUOI : « Le ton de l'aventure porte encore le marqueur … » · QUOI FAIRE : « Rédigez le ton qui doit guider le modèle — ambiance, registre, limites. »

Ordre de rendu : le bloquant, puis les trois alertes dans l'ordre `synopsis_mj`, `accroche_joueur`, `ton`.

**Pastille** — `BLOQUANT` et `ALERTE` seuls utiles à it1 ; `INFO` dans le mapping quand même. Toujours au singulier (un mot par ligne, jamais d'agrégat). Aucun glyphe, le mot seul, mono, capitales.

**États** — dossier neuf : les quatre lignes. Dossier rédigé : gabarit `emptyState` de `PanneauSection` (dashed `--border-field`, `--r-xl`, `--paper-1`, `--space-10`/`--space-8`, `max-width:480`), glyphe `⬚` et **pas** `✓` (la coche verte est vétoée, `--good` reste réservé au jet), texte « Aucun contrôle à signaler — le dossier passe tous les contrôles connus. » — jamais « les quatre proses », qui deviendrait faux dès it3. Dossier importé sans marqueur : exactement le même état calme. Pas de chip `jouable`.

**Clavier** — entrée « Contrôles » atteinte par Tab en 11ᵉ position **dans le même `<nav>`** *(⚠ contredit la QA et le tech-lead)*. Lignes de `ListeControles` : chacune un `<button>` natif appelant `onSelect(controle.section)`, le focus suivant sur la ligne de nav devenue sélectionnée *(⚠ déclaré inlivrable par le tech-lead)*. Rompt délibérément le contrat clavier de `PanneauSection`, qui décrit un panneau vide sans contenu actionnable.

## Jetons

Séparateur `--border-rule` / `--space-3` · page `--space-12` · liste `--border-divider`, `--r-md` · ligne `--space-3`, `--space-4`, `--border-divider` · OÙ `--font-mono`, `--fs-eyebrow`, `--text-label`, `--track-eyebrow` · QUOI `--font-ui`, `--fs-body`, `--text-body` · QUOI FAIRE `--font-ui`, `--fs-meta`, `--text-muted` · BLOQUANT `tone="bad"` (`--bad`, `--bad-line`, `--bad-bg-2`) · ALERTE `tone="neutral"` (`--ink-2`, `--line-1`, `--paper-0`) · INFO `tone="muted"` (`--ink-4`, `--line-2`, `--paper-0`) · état calme `--border-field`, `--r-xl`, `--paper-1`, `--space-10`, `--space-8`, `--fs-h1`, `--text-faint`, `--text-muted`, `--lh-body`.

*(Tous vérifiés présents dans `src/styles/tokens/colors.css` par l'orchestrateur.)*

**Non lus, borne tenue** : `src/brain/dossier/amorce.ts` (objection ci-dessus) et `src/brain/components/ListRow.tsx`.
