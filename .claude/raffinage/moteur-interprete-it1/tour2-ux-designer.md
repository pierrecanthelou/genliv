# Tour 2 — UX Designer

### Réponse nommée aux 3 points de narratif-ia

**1) La ligne « commande refusée par `executerCommande` (inatteignable par construction) »**

Je ne la mets PAS dans `OutcomeBlock`. En relisant `ConsoleCommandes.tsx`, il existe déjà un idiome établi pour un message d'échec **non fictionnel** : `<p role="status">` + glyphe `⊘` + `--font-mono`/`--fs-meta`/`--text-muted` (le commentaire du fichier le dit : « 33 usages au dépôt »). C'est l'anatomie exacte qu'il faut ici — pas `OutcomeBlock`, qui est réservé à de la PROSE (fiction R1 ou corps instructif dérivé), jamais à un aveu technique déguisé. Réutiliser `entete="SANS EFFET"` pour ce cas m'a semblé une solution un temps, je la retire : ça ferait porter à `OutcomeBlock` un texte qui n'est ni fiction ni instruction dérivée, en diluant ce que `entete` est censé désigner.

Décision : **bannière interface**, même pattern que `ConsoleCommandes` (répliqué localement dans `PlayerInputBar`, ZÉRO import croisé — cohérent avec l'isolation actée par tech-lead), texte fixe :
`⊘ Cette action n'a pas pu s'exécuter.`
Même bannière, même pattern, pour la ligne « indisponible, annulé, refus de contexte » — texte proposé à titre provisoire, **sous réserve d'un texte déjà utilisé ailleurs par les 6 branches existantes de `CopiloteService`** (à auditer par l'agent qui code ; s'il existe, il est réutilisé verbatim, jamais un troisième texte pour la même situation) :
`⊘ Le service est momentanément indisponible.`

**2) `maxLength` — natif, pas de validation logique.**

`<input type="text" maxLength={300}>`. Le navigateur cape la saisie ET le collage : la borne de 300 caractères « refusée avant l'appel réseau » devient **structurellement vraie**, sans état d'erreur, sans message, sans compteur. J'étends `FieldProps` d'un `maxLength?: number` transmis à l'`<input>`/au `<textarea>` — même geste d'extension que `disabled`, même lot. Zéro texte à écrire pour cet état : c'est le point où « pas de composant » bat « composant » — un message d'erreur inventé pour un plafond que 300 caractères rendent quasi inatteignable en usage normal serait de la décoration.

**3) Mon objection sur le devenir du texte saisi après acceptation → RETIRÉE.**

Le tableau de narratif-ia confirme ligne à ligne : seule la ligne « commande acceptée » change la référence de session ; toutes les autres (`refus`, `sans_commande`, `clarification`, `anti-boucle`, `indisponible`) la laissent inchangée ou à la même référence. C'est exactement le mécanisme de remontage sur `session.horloge.tour` que j'avais proposé par analogie avec `ConsoleCommandes` (le tour n'avance QUE sur acceptation, `docs/REGLES-PLAY.md` § J1) — plus une hypothèse, une confirmation croisée. Close.

---

### Mes 5 objections de tour 1, une par une

1. **`Field` sans prop `disabled`** → **MAINTENUE**, et complétée : `Field` gagne aussi `maxLength` (point 2 ci-dessus). Tech-lead confirme que le verrou LOGIQUE (KR-265) vit dans le hook, pas dans `disabled` — ce qui ne retire rien à mon objection : l'UI a quand même besoin d'un `disabled` réel pour le rendu visuel et pour que `Tab` saute le champ/bouton nativement. Les deux (invariant logique dans le hook + `disabled` réel dans `Field`) coexistent, l'un ne remplace pas l'autre.
2. **`OutcomeBlock` « variante » = `entete`, zéro nouvelle prop** → **RETIRÉE (résolue, confirmée)**. Tech-lead l'écrit noir sur blanc dans le LOT 2 : « Rend la variante clarification via `OutcomeBlock` (eyebrow `PRÉCISEZ`, réutilisé sans modification — props déjà génériques, vérifié) ». Plus une proposition, un fait acté par un autre rôle du comité.
3. **Libellé de repos du bouton `TENTER`** → **MAINTENUE**, non contestée par aucun des 4 autres tours, gravée telle quelle dans le contrat final.
4. **Rendu de `sans_commande`** → **MAINTENUE avec un ajustement de périmètre** : `entete="SANS EFFET"` reste vrai pour `sans_commande` seul. Le cas voisin que j'avais un temps envisagé d'y rattacher (`commande refusée par executerCommande`) en sort — voir point 1 ci-dessus, bannière interface, pas `OutcomeBlock`.
5. **Devenir du texte saisi après acceptation** → **RETIRÉE**, voir point 3 de la section précédente.

Aucune de mes objections ne durcit en veto — la seule qui aurait pu (l'absence de `disabled` réel sur `Field`) reste une extension additive attendue, pas un blocage.

---

## CONTRAT DE DESIGN FINAL — `moteur-interprete` it1

### Composants
- **`PlayerInputBar`** (NEUF, `src/features/play-mode/components/PlayerInputBar.tsx`) : `<form>` natif + `Field` (`brain/components`, NON mono) + `<button type="submit">` au patron exact de `ConsoleCommandes.boutonExecuter` (mêmes tokens, couleur neutre en `disabled`). Zéro import de `ConsoleCommandes`, zéro import réciproque (garde de test dédiée).
- **`Field`** (`src/brain/components/Field.tsx`), EXTENSION additive :
  - `disabled?: boolean` → attribut HTML réel sur `<input>`/`<textarea>` ; style : `color: disabled ? 'var(--text-faint)' : 'var(--text-body)'`, `background` inchangé `--surface-sunken`, `cursor: disabled ? 'not-allowed' : 'text'`.
  - `maxLength?: number` → transmis tel quel à `<input maxLength>`/`<textarea maxLength>`.
  - Aucune autre prop neuve.
- **`OutcomeBlock`** (existant), réutilisé sans modification, `entete` variable, deux valeurs pour it1 : `PRÉCISEZ`, `SANS EFFET`. Réservé à la PROSE (fiction R1 ou corps instructif dérivé) — jamais à un message technique.
- **Bannière interface** (idiome répliqué, PAS un nouveau composant partagé) : `<p role="status">` + `<span aria-hidden="true">⊘ </span>` + texte, styles `--font-mono`/`--fs-meta`/`--text-muted`/`--lh-body` — copie exacte de `texteRefusConsole` dans `ConsoleCommandes.tsx`, définie localement dans `PlayerInputBar.tsx` (pas d'import croisé).
- `ConsoleCommandes` : inchangé.

### Textes exacts (constantes, patron `LIBELLE_*`/`PLACEHOLDER_*`/`TEXTE_*`/`ENTETE_*` comme `ConsoleCommandes`)
```
LIBELLE_CHAMP        = 'QUE FAITES-VOUS ?'
PLACEHOLDER_CHAMP    = 'Décrivez ce que vous tentez…'
LIBELLE_BOUTON_REPOS = 'TENTER'
LIBELLE_BOUTON_VERROU = '…'
MAXLONGUEUR_SAISIE   = 300   // maxLength natif, aucun message associé

ENTETE_PRECISION     = 'PRÉCISEZ'
// corps clarification : verbatim attente.question (R1), jamais réécrit

TEXTE_ANTI_BOUCLE    = 'Reformulez votre action.'   // entete = ENTETE_PRECISION

ENTETE_SANS_EFFET    = 'SANS EFFET'
// corps sans_commande, gabarit fixe + liste dérivée de COMMANDES[].label, jamais l'inverse :
GABARIT_SANS_COMMANDE = (labels) => `Vous ne savez pas encore faire cela. Pour l'instant, vous pouvez : ${labels.join(', ')}.`
// rendu actuel (1 seul geste) : "Vous ne savez pas encore faire cela. Pour l'instant, vous pouvez : va au lieu."

TEXTE_REFUS_MOTEUR   = "Cette action n'a pas pu s'exécuter."   // bannière interface, PAS OutcomeBlock
TEXTE_INDISPONIBLE   = 'Le service est momentanément indisponible.'  // bannière interface — SOUS RÉSERVE, voir décision autonome plus bas
```

### Tokens (aucun nouveau, tous déjà en usage dans `OutcomeBlock.tsx`/`ConsoleCommandes.tsx`/`Field.tsx`)
`--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-row`, `--fs-meta`, `--track-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--text-body`, `--text-strong`, `--text-faint`, `--text-muted`, `--text-on-accent`, `--border-field`, `--border-card`, `--r-md`, `--r-lg`, `--surface-sunken`, `--surface-card`, `--accent`, `--space-2`, `--space-3`, `--space-5`, `--space-7`, `--hit-target`, `--bw-hair`, `--lh-body`, `--lh-loose`.

### États (table complète, croisée avec le tableau « Issue » de narratif-ia)
| Issue | Champ | Texte saisi | Bouton | Affiché |
|---|---|---|---|---|
| Défaut (avant 1re saisie) | actif | vide, placeholder visible | `TENTER` actif (accent) | rien |
| Verrouillé (appel modèle en cours) | `disabled` | conservé | `disabled`, `…` | rien |
| Commande acceptée | remonté (`key=session.horloge.tour`), vidé + `autoFocus` | vidé | `TENTER` actif | rien (it1) |
| Commande refusée par `executerCommande` | actif | conservé | `TENTER` actif | bannière `⊘ Cette action n'a pas pu s'exécuter.` |
| `sans_commande` | actif | conservé | `TENTER` actif | `OutcomeBlock entete="SANS EFFET"` + gabarit dérivé |
| Clarification posée (1re, ton écrit) | actif | conservé | `TENTER` actif | `OutcomeBlock entete="PRÉCISEZ"` + prose R1 verbatim |
| Clarification anti-boucle (2e consécutive ou illisible après rejeu) | actif | conservé | `TENTER` actif | `OutcomeBlock entete="PRÉCISEZ"` + `Reformulez votre action.` |
| Indisponible / annulé / réseau | actif | conservé (même référence de session) | `TENTER` actif | bannière `⊘ Le service est momentanément indisponible.` |

`OutcomeBlock` et la bannière interface sont mutuellement exclusifs sur un même tour ; les deux occupent le même emplacement visuel, sous le `<form>` (comme `refus`/`texteAccesDisponibles` dans `ConsoleCommandes`).

### Clavier
- `Entrée` soumet nativement (un seul `<input>` dans un `<form>`) — aucun `onKeyDown` maison.
- `disabled` réel (via l'extension `Field`) → `Tab` saute champ et bouton pendant le verrou, gratuitement.
- `autoFocus` sur remontage (`key={session.horloge.tour}`), jamais de gestion manuelle de focus ailleurs.
- Pas de `Modal` dans ce flux → pas de règle de retour de focus déclencheur.

### Registres de langue
- `PlayerInputBar` (label, placeholder, bouton) : interface, mono-majuscule (`QUE FAITES-VOUS ?`, `TENTER`) ; le placeholder reste une invite 2e personne (frontière normale du composant `Field`).
- Prose de clarification (verbatim R1) et corps de `sans_commande` : registre joueur, 2e personne, présent.
- `Reformulez votre action.`, `Cette action n'a pas pu s'exécuter.`, `Le service est momentanément indisponible.` : registre **interface plat**, non fictionnel, jamais 2e-personne-immersif — c'est ce qui justifie de les sortir d'`OutcomeBlock`.

### ESLint proposé (inchangé depuis tour 1, complété)
1. `no-restricted-syntax`/revue ciblée : aucune chaîne visible inline dans le JSX de `PlayerInputBar.tsx` — tout en constantes nommées en tête de fichier.
2. Test dédié : aucun import de `ConsoleCommandes` dans `PlayerInputBar` et réciproquement.
3. `field.disabled.test.tsx` + `field.maxLength.test.tsx` : vérifient que `disabled`/`maxLength` posés sur `Field` produisent l'attribut HTML réel, pas un habillage visuel seul.

---

## Décisions prises en autonomie (tour 2)

- Rendu des cas « refus défensif d'`executerCommande` » et « indisponible réseau » → **bannière interface répliquée de `ConsoleCommandes` (`role="status"`, glyphe `⊘`, mono, `--text-muted`), jamais `OutcomeBlock`** → si `OutcomeBlock` est retenu à la place, il faut soit un `entete` supplémentaire qui dérogerait à la règle « `entete` désigne une prose », soit un texte plat forcé dans un bloc conçu pour la fiction — coût : dilution du contrat existant, et un balayage de source à réécrire.
- Texte fixe `Cette action n'a pas pu s'exécuter.` → si un autre texte est retenu en revue, un seul remplacement de constante, zéro renvoi ailleurs.
- `maxLength` natif à 300, aucune validation logique ni message d'erreur dans `PlayerInputBar` → si une validation logique avec compteur/message est préférée, il faut ajouter un état dérivé et un texte que le plafond HTML natif rend inutile en usage normal.
- Texte `Le service est momentanément indisponible.` proposé à titre provisoire → si un texte existe déjà ailleurs pour les 6 branches actuelles de `CopiloteService`, il doit être réutilisé verbatim et ma proposition retirée sans coût — elle n'a jamais été codée.

## Fichiers lus (tour 2)
`.claude/raffinage/moteur-interprete-it1/tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md`, `src/brain/components/Field.tsx`, `src/features/play-mode/components/OutcomeBlock.tsx`, `src/features/play-mode/components/ConsoleCommandes.tsx`.
