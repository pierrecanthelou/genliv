RISQUE — La matrice d'états de `CarteJet` écrite dans `design_contract.carte_jet` couvre « avant lancer / pendant résolution / après résolution », mais **oublie trois états réels de cet écran** : l'attente de R2 lui-même (avant même que la carte n'existe), la branche `{sans_jet:true}` (R2 juge qu'aucun jet n'est requis), et la dégradation silencieuse (schéma non conforme, rejoué puis dégradé) vs la panne de service (bannière existante). Sans ces états écrits, chaque agent de l'essaim invente son propre spinner, et le clavier casse précisément là où le projet dit que ça compte (retour de focus carte → champ de saisie après le récit).

OBJECTION — `brain/components/Card.tsx` pose **toujours** `boxShadow: 'var(--shadow-card)'` hors sélection (ligne 17) — en contradiction frontale avec « Card SANS box-shadow » écrit dans le contrat, et avec la règle projet « ombres uniquement sur menus/modales ». C'est un token (`--shadow-card`), donc **invisible** à la règle ESLint anti-hex-en-dur : un dev qui importe `Card` tel quel livre une carte à ombre sans qu'aucun outil ne l'attrape.

PROPOSITION — Étendre `Card` d'un prop `shadow?: boolean` (défaut `true`, zéro régression sur les appelants existants), `<Card shadow={false}>` pour `CarteJet`. `CardHead` n'existe pas dans ce dépôt (confirmé, même constat déjà posé par `dossier-copilote`) — le recomposer localement (eyebrow mono + title mono), précédent déjà établi. Compléter le contrat avec les 7 états détaillés en annexe, textes exacts inclus.

VERDICT — recevable sous réserve : (a) `Card` gagne le prop `shadow`, (b) les états manquants entrent au plan avant l'essaim.

---

## ANNEXE — Contrat de design complet `CarteJet.tsx`

### Composants

- `Card` (`brain/components/Card.tsx`), **étendu** d'un prop `shadow?: boolean` (défaut `true`) : `<Card shadow={false} padding={...}>`. Ne touche aucun appelant existant (tous gardent l'ombre par défaut).
- `CardHead` **n'existe pas** → recomposé localement dans `CarteJet.tsx`, précédent déjà posé par `dossier-copilote` (voir `specification.implementation.json:24`) :
  - eyebrow : `<span>` — `font-family: var(--font-mono)`, `font-size: var(--fs-eyebrow)`, `letter-spacing: var(--track-eyebrow-wide)`, `color: var(--text-label)`, texte = `CHARACTERISTICS[carac].label` en MAJUSCULES (le registre expose déjà le libellé, ne pas le reconstruire à la main — import direct, comme dans `EcranCreationHeros.tsx`).
  - title : `<span>` ou `<h3>` — `font-family: var(--font-mono)`, `font-size: var(--fs-title)`, `color: var(--text-strong)`, `letter-spacing: var(--track-tight)`, texte littéral `` `Seuil ${tc}` `` (confirmé non contradictoire avec « sans jamais connaître par avance le seuil » : le wireframe §2.9 dit explicitement « seuil montré » — ce qui reste caché, c'est la MARGE et l'ISSUE, jamais le TC qui est la cible connue dès que la carte existe).
- `Badge` (`brain/components/Badge.tsx`), tel quel — `tone="good"` / `tone="bad"`, jamais `"neutral"`/`"muted"` sur cette carte (les deux seules couleurs sémantiques du projet).
- Bouton « Lancer le dé → » : recompose le patron `boutonTenter`/`boutonVerrou` de `PlayerInputBar.tsx` (accent plein, `--text-on-accent`, `min-height: var(--hit-target)`), **pas** le patron neutre `boutonAction` d'`EcranCreationHeros` (celui-ci est pour des actions secondaires, « Lancer » est l'action primaire de la carte).
- AUCUN `OutcomeBlock` propre à cette carte (décision déjà actée, non rouverte) — le récit de R3 reste sur le canal RÉCIT de `PlayerInputBar.tsx`.

### États (7, textes exacts)

| État | Déclencheur | Rendu | Texte |
|---|---|---|---|
| 1. Attente de R2 | commande 'agir' soumise, héros présent, avant réponse R2 | **Aucune `CarteJet` ne monte.** Le verrou de tour (KR-265) désactive `PlayerInputBar` exactement comme pour R1/R3 — même bouton `« … »` opacity 0.5, aucun nouvel indicateur. | réutilise `LIBELLE_BOUTON_VERROU = '…'` |
| 2. R2 renvoie `{sans_jet:true}` | schéma conforme, pas de jet requis | **Aucune `CarteJet` ne monte jamais.** Le flux continue directement vers R3 narrant via le canal RÉCIT existant — zéro différence visuelle avec le comportement d'avant cette itération. | — |
| 3. R2 schéma non conforme → dégradation silencieuse | rejoué une fois (§2.8 garde-fou 1), toujours non conforme | Identique à l'état 2 : dégradé en interne vers `{sans_jet:true}`, **aucune bannière, aucune erreur visible** — c'est une récupération, pas une panne. | — |
| 4. R2 indisponible (503/réseau) | amont non configuré ou injoignable | Bannière `role="status"` identique au patron `EchecCopilote` de `PlayerInputBar.tsx` : `⊘ Le service est momentanément indisponible.` (réutilise `TEXTE_INDISPONIBLE` verbatim, même style `bannierInterface`) | `Le service est momentanément indisponible.` |
| 5. Avant lancer | `{jet:{carac,tc,pourquoi,enjeu_reussite,enjeu_echec}}` reçu | `Card shadow={false}` + eyebrow/title ci-dessus + deux lignes mono `SI RÉUSSITE` / `SI ÉCHEC` (`font-family: var(--font-mono)`, `font-size: var(--fs-meta)`, `color: var(--text-label)`) suivies du texte verbatim `enjeu_reussite`/`enjeu_echec` en registre PROSE JOUEUR (`font-family: var(--font-ui)`, `color: var(--text-strong)`, `white-space: pre-wrap` — même traitement que `OutcomeBlock.prose`) + bouton accent `Lancer le dé →` | `SI RÉUSSITE` / `SI ÉCHEC` |
| 6. Pendant résolution | clic sur « Lancer » | bouton désactivé, `opacity: 0.5`, `cursor: not-allowed`, label `…` (patron exact `boutonVerrou`) | `…` |
| 7. Après résolution | `resolveChallenge` a rendu | ligne mono `` `${d1} + ${d2} vs ${tc}` `` (`font-family: var(--font-mono)`, `font-size: var(--fs-meta)`, `color: var(--text-body)`) + `Badge tone={reussite ? 'good' : 'bad'}` texte `RÉUSSITE`/`ÉCHEC`. **Pas d'affichage séparé de la marge en it2** — l'afficher nommément suggérerait une nuance que R3 ne porte pas encore (réservé it3, même seuil que `challengeXp`) ; les deux dés + le seuil suffisent à la transparence numérique promise par le wireframe. | `RÉUSSITE` / `ÉCHEC` |

### Clavier (ergonomie, objection forte si absente — pas un veto)

- Au montage de l'état 5, focus programmatique sur le wrapper `Card` (`tabIndex={0}` + `ref.current?.focus()` en `useEffect`, précédent exact `nomRef` d'`EcranCreationHeros.tsx`).
- `onKeyDown` sur la carte : `Enter` déclenche le même handler que le clic sur « Lancer » (états 5→6), ignoré si état ≠ 5.
- États 6 et 7 : focus **reste** sur la carte (ne pas re-focus, ne rien voler).
- **Gap à combler explicitement (absent du contrat actuel)** : au moment où le récit de R3 est posté dans `session.journal` (fin de l'état 7), le focus doit être rendu au `Field` de `PlayerInputBar` — ni `autoFocus` (ne refire pas au re-render) ni le verrou `isLocked→false` ne le font automatiquement. Nécessite un `ref` exposé par `PlayerInputBar` et un appel explicite au moment où `issueNarrateur.statut === 'raconte'` transitionne — sinon le clavier reste bloqué sur une carte qui n'a plus rien d'actionnable, cassant exactement la cadence que la règle « ergonomie de rédaction » protège.

### Registre de langue

- Eyebrow/title/`SI RÉUSSITE`/`SI ÉCHEC`/Badge : INTERFACE — mono, majuscules, terse.
- `enjeu_reussite`/`enjeu_echec` : FICTION — deuxième personne, présent, verbatim, jamais reformulés par le composant.
- Aucune confusion possible ici (pas de nom interne d'objet en jeu), donc pas de veto sur ce point précis — juste à vérifier que R2 ne renvoie jamais une prose au présent de narration omnisciente (hors du périmètre UX, relève de narratif-ia).

### Règle ESLint proposée

Étendre `no-restricted-syntax` (déjà en place pour hex/`rgb()`/`hsl()`) : interdire tout `boxShadow` littéral dans `src/features/**` — seul `Card`/`Modal`/menus en `brain/components/` ont le droit d'écrire une ombre, tout composant feature doit passer par leur prop, jamais une valeur `shadow-*` recopiée en `style`.
