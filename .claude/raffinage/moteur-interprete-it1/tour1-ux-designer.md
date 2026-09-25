# Tour 1 — UX Designer

RISQUE — Le composant `Field` (`src/brain/components/Field.tsx`) n'expose aucune prop `disabled`. Sans elle, l'équipe qui code le verrou de tour (KR-265) va soit poser un attribut HTML brut en contournant l'API du composant, soit — pire — recréer un champ « désactivé » maison en CSS local dans `PlayerInputBar` : exactement le composant maison que ma charte me demande de vetoter. C'est le risque n°1 de cette itération vu de mon poste.

OBJECTION — Le design_contract écrit « clarification rendue... variante d'OutcomeBlock ». Or `OutcomeBlock.tsx` interdit EXPLICITEMENT toute prop `variant` en it1 (réservée réussite/échec de jet, n°11) — si « variante » est codé comme une nouvelle prop, ça viole un garde-fou déjà posé dans le fichier. Trois autres trous de texte, tous dans mon domaine : (a) le libellé de REPOS du bouton n'est écrit nulle part — seul l'état verrouillé (`…`) l'est ; (b) le rendu et l'eyebrow du message `sans_commande` ne sont pas spécifiés (composant ? entete ?) ; (c) le devenir du texte saisi après une commande ACCEPTÉE — vidé + refocus comme `ConsoleCommandes`, ou conservé ? — n'est pas tranché, alors que c'est une ergonomie de rédaction.

PROPOSITION — 1) Étendre `Field` d'un `disabled?: boolean` natif (attribut HTML réel sur input/textarea, pas d'overlay), dimming via `--text-faint`/`--surface-sunken` déjà en usage ; bouton désactivé sur les MÊMES tokens neutres, jamais un `--accent` inerte (discipline de l'accent : un bouton visuellement accent doit rester actionnable). 2) « Variante » = réutiliser `entete` tel quel, zéro nouvelle prop sur `OutcomeBlock` — je le grave dans le contrat final. 3) Libellé de repos du bouton : `TENTER`. 4) `sans_commande` rendu dans `OutcomeBlock` avec `entete="SANS EFFET"`. 5) `PlayerInputBar` se remonte sur `session.horloge.tour` exactement comme `ConsoleCommandes` (vide + focus sur ACCEPTÉ seulement, conservé sur refus/clarification/sans_commande).

VERDICT — recevable sous réserve (les 4 points ci-dessus doivent entrer dans le contrat de design final avant le lot feature ; aucun n'est un veto, ce sont des trous de spécification, pas des fautes commises).

---

## ANNEXE — Contrat de design, itération 1

### Composants
- `PlayerInputBar` (NEUF, `src/features/play-mode/components/PlayerInputBar.tsx`) : `<form>` natif + `Field` (brain/components) NON mono + bouton `<button type="submit">` inline-stylé au patron exact de `ConsoleCommandes.boutonExecuter` (tokens identiques, couleur neutre en `disabled`).
- `OutcomeBlock` (existant, `src/features/play-mode/components/OutcomeBlock.tsx`) réutilisé tel quel, `entete` variable, **zéro nouvelle prop**.
- `ConsoleCommandes` : inchangé, aucun couplage avec `PlayerInputBar`.
- Extension requise : `Field` (`src/brain/components/Field.tsx`) gagne `disabled?: boolean` — propagé sur `<input>`/`<textarea>`, et sur le style calculé (`color: disabled ? 'var(--text-faint)' : ...`, `background` inchangé `--surface-sunken`, `cursor: disabled ? 'not-allowed' : 'text'`).

### Textes exacts (mot pour mot)
- Libellé du champ (`Field.label`) : `QUE FAITES-VOUS ?`
- Placeholder (`Field.placeholder`) : `Décrivez ce que vous tentez…`
- Libellé du bouton, état repos : `TENTER`
- Libellé du bouton, état verrouillé (pendant l'appel modèle) : `…`
- `OutcomeBlock.entete`, état clarification : `PRÉCISEZ`
- Corps de la clarification : prose de `attente.question` (générée par R1, contrainte ton/interdits_ton), verbatim, 2e personne, présent — jamais réécrite par le composant.
- Message fixe anti-boucle (2e clarification consécutive OU R1 illisible après rejeu), même `entete="PRÉCISEZ"` : `Reformulez votre action.`
- `OutcomeBlock.entete`, état `sans_commande` (proposé, à valider par narratif-ia) : `SANS EFFET`
- Corps `sans_commande` (gabarit proposé — le squelette de phrase est en dur, la LISTE seule est dérivée de `COMMANDES[].label`, jamais l'inverse) : `Vous ne savez pas encore faire cela. Pour l'instant, vous pouvez : {labels dérivés joints par ", "}.` — avec le seul verbe actuel, ça rend : `Vous ne savez pas encore faire cela. Pour l'instant, vous pouvez : va au lieu.`

### Tokens à citer dans le contrat final
`--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-row`, `--fs-meta`, `--track-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--text-body`, `--text-strong`, `--text-faint`, `--text-muted`, `--text-on-accent`, `--border-field`, `--border-card`, `--r-md`, `--r-lg`, `--surface-sunken`, `--surface-card`, `--accent`, `--space-2`, `--space-3`, `--space-5`, `--space-7`, `--hit-target`, `--bw-hair`, `--lh-body`, `--lh-loose`. Aucune valeur hex, aucun `rgb()`/`hsl()` : tout ce qui précède existe déjà et est utilisé par `OutcomeBlock.tsx` / `ConsoleCommandes.tsx` / `Field.tsx` — aucun nouveau token requis pour it1.

### États (PlayerInputBar)
- Défaut : champ vide, placeholder visible, bouton `TENTER` actif (accent).
- Saisie : texte tapé, bouton reste actif.
- Verrouillé (appel modèle en cours) : champ ET bouton `disabled`, texte CONSERVÉ, bouton affiche `…`, aucune couleur accent sur le bouton désactivé.
- Clarification pendante : champ redevient actif (nouvelle saisie attendue), `OutcomeBlock entete="PRÉCISEZ"` affiché au-dessus ou à côté (position exacte = décision de layout, hors mon domaine si aucun token n'est en jeu).
- Sans_commande : champ redevient actif, `OutcomeBlock entete="SANS EFFET"` affiché.
- Vide : couvert par le placeholder ci-dessus — suffisant, aucun état vide supplémentaire à traiter puisqu'il n'y a ni liste ni collection ici.

### Clavier
- `Entrée` soumet nativement (un seul `<input>` dans un `<form>`, comme `ConsoleCommandes`) — AUCUN `onKeyDown` maison sur `PlayerInputBar`.
- Pendant le verrou, `Tab` doit sauter le champ ET le bouton `disabled` (comportement natif du navigateur sur l'attribut HTML `disabled` — gratuit, à condition que `Field` le propage réellement, d'où l'extension demandée).
- Focus : `autoFocus` sur remontage (pattern `key={session.horloge.tour}` déjà validé par `ConsoleCommandes`), pas de gestion manuelle de focus ailleurs.
- Pas de `Modal` dans ce flux → pas de règle de retour de focus déclencheur à appliquer ici.

### Registres de langue — vigilance particulière sur ce composant
- `PlayerInputBar` (label + placeholder + bouton) : registre INTERFACE mono-majuscule pour les libellés de contrôle (`QUE FAITES-VOUS ?`, `TENTER`), mais le PLACEHOLDER est déjà une invite en 2e personne informelle — c'est la frontière normale Field (labels toujours interface, contenu variable au registre du champ).
- Prose de clarification et de `sans_commande` : PLEINEMENT registre joueur (2e personne, présent) — le gabarit `sans_commande` proposé ci-dessus respecte ça, mais la LISTE dérivée de `COMMANDES[].label` (ex. `va au lieu`) a été écrite pour un contexte développeur (`ConsoleCommandes` : « Accès disponibles : va au lieu »). Recopiée verbatim dans une phrase joueur, elle passe l'épreuve grammaticale de justesse — à confirmer par narratif-ia au tour 2, sinon ces `label` gagnent un second champ d'affichage joueur distinct du `label` développeur (ne pas faire porter deux registres au même champ de données).
- `ConsoleCommandes` : ZÉRO modification de texte ou de composant dans cette itération — la démotion visuelle mentionnée au cadrage n'est pas un objet de cette itération (aucun critère d'acceptation ne la couvre) ; je ne bloque pas dessus mais signale l'écart entre cadrage et critères d'acceptation.

### Proposition ESLint (comparaison automatique contrat/code)
1. Règle `no-restricted-syntax` étendue (déjà câblée pour `#hex`/`rgb()`/`hsl()`) : ajouter un cas ciblant les chaînes littérales dans `PlayerInputBar.tsx` correspondant aux 6 textes ci-dessus — en pratique, extraire ces textes en constantes nommées en tête de fichier (patron déjà appliqué par `ConsoleCommandes.LIBELLE_*`/`PLACEHOLDER_*`/`TEXTE_*`) et faire vérifier par une règle `no-magic-strings`-like (ou revue tech-lead ciblée) qu'aucune chaîne visible n'est inline dans le JSX de ce fichier.
2. Étendre le test `lintIsolation.test.ts` (ou un test dédié `playerInputBar.test.tsx`) avec une assertion « pas d'import de `ConsoleCommandes` dans `PlayerInputBar` et réciproquement » — matérialise la séparation stricte des registres en garde automatisée, pas seulement en revue.
3. Un test `field.disabled.test.tsx` qui vérifie que `disabled` posé sur `Field` produit bien un `<input disabled>`/`<textarea disabled>` réel (pas un simple style visuel) — garde contre une extension qui « désactiverait » seulement l'apparence.

Fichiers lus : `src/features/play-mode/components/OutcomeBlock.tsx`, `src/features/play-mode/components/ConsoleCommandes.tsx`, `src/brain/components/Field.tsx`, `design_handoff_gamebook_editor/components/primitives/Chip.jsx`, `design_handoff_gamebook_editor/tokens/typography.css`, `design_handoff_gamebook_editor/tokens/colors.css`, `src/brain/dossier/commandes.ts`, `src/features/moteur-interprete/specification.json`.
