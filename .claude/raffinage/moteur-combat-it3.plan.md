# Plan d'itération — `moteur-combat` · itération `3`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-05
> Composition : `5 rôles` — motif : itération touche le moteur de combat + rôle IA R5
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut lire, sous chaque round de posture qu'il joue (clôture comprise), un court commentaire sans chiffre produit par le commentateur de combat (R5). » |
| **Tranche** | `EcranCombat` → `CombatEnCours` → `useCommentaireCombat` → `CopiloteService.demander` → `assemblerCommentateur` → worker `/ia/commentateur` → `validerCommentateur` |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1 seul en premier) |
| **Hors périmètre** | Capacité dans projection · commentaire fuite · persistance · mémoire entre rounds · nom du héros · repli déterministe · round/postures dans le contexte · butin · écran de mort (n° 15) · sous-composant `RecitRound.tsx` |
| **Reporté** | `<button>` primitif (dette design) · seuil 30 % rejet → 600 car. (engagement produit) · règles ESLint UX (dette à déclencheur) · extraction `sessionCombat.ts` (déclencheur non armé) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut lire, sous chaque round de posture qu'il joue (clôture comprise), un court commentaire sans chiffre produit par le commentateur de combat (R5). Projection structurée en entrée, nouvel essai puis silence.

## 2 — Hors périmètre

- **Capacité du monstre** dans la projection — pas de producteur (KR-285), les 37 hooks de `capacityEffects.ts` ne disent pas ce qu'ils ont fait. Additif ultérieurement.
- **Commentaire de la fuite** — seuls les rounds de posture et le round de clôture sont commentés. La fuite reste mécanique (KR-297).
- **Persistance des narrations** — le récit est éphémère, perdu au rechargement. Aucune feuille de session, `session.ts` reste fermé.
- **Mémoire inter-rounds** — un round par appel, zéro mémoire de combat. Chaque appel R5 est sans état.
- **Nom du héros** dans le contexte — `heros.name` = `moteur`, interdit par KR-232.
- **Repli déterministe** après double échec — silence = nœud absent (KR-230/283). Aucun texte généré par le code.
- **`round` numérique** dans le contexte IA — `/\d/` tuerait le récit. `round` est une clé de map côté feature uniquement (AssautRound).
- **Postures** dans le contexte IA — faussées par séisme/désarmement. Exclues du fil.
- **`session.ts`** — aucune modification (pas de feuille de narration). La dette « extraire `sessionCombat.ts` » n'est pas armée.
- **Écran de mort / fin de partie** — n° 15.
- **Butin, victoryTarget** — hors planifié.
- **Sous-composant `RecitRound.tsx`** — le récit est un `<p>` conditionnel dans `JournalLigneRound`, pas un composant extrait.
- **Seuil 30 % rejet automatisé** — la constante 400 est réversible sur un seul site, sans comité.
- **Ton propre au combat** — `canon.ton` et `canon.interdits_ton[]` sont injectés, pas de champ `ton_combat` dédié.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Fragment touché : `JournalLigneRound` (dans `EcranCombat.tsx`)

Structure d'une ligne (ordre visuel, aucun élément focalisable ajouté) :
1. `ROUND {n}` — inchangé (mono, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-strong`).
2. Texte mécanique — inchangé (`--font-mono`, `--fs-body`, `--text-body`).
3. **Zone récit** (nouveau), selon l'état :

| État | Rendu | Tokens |
|---|---|---|
| Pas de récit demandé / échec après nouvel essai | **Rien dans le DOM.** Nœud absent, pas conteneur vide. | — |
| En cours (appel + nouvel essai) | `<Badge tone="muted">Commentaire en cours…</Badge>` dans un wrapper `role="status"` | primitive `Badge` seule |
| Reçu | `<p>` avec le texte `narration` | voir ci-dessous |

Style du `<p>` récit :
- `margin: 0`
- `fontFamily: var(--font-ui)` — **veto UX : jamais `--font-mono`**
- `fontSize: var(--fs-body)`
- `lineHeight: var(--lh-loose)`
- `color: var(--text-muted)`
- `borderLeft: var(--bw-strong) solid var(--border-rule)`
- `paddingLeft: var(--space-4)`
- `overflowWrap: anywhere`

**Interdits** sur le `<p>` récit : `--font-mono`, `font-style: italic`, toute variable `--accent*`, toute ombre, `<textarea>`, `<input>`, `contentEditable`, `IconButton`.

### Textes exacts
- Chargement : `Commentaire en cours…`
- Aucun autre libellé d'interface ajouté. L'en-tête « JOURNAL DE COMBAT » est inchangé.

### Registre fiction (consigne pour l'invite R5)
- 2ᵉ personne du singulier, présent, immersif. Le pronom (tu/vous) est délégué à `canon.ton`.
- Aucun chiffre (KR-296), aucun terme mécanique (PV, jet, round).
- 400 caractères maximum.
- Exemple : « Ta lame glisse sur le cuir tendu du gobelin ; il riposte d'un coup de gourdin que tu esquives de justesse. »

### Clavier
- Aucun nouvel arrêt de Tab. Ordre inchangé : posture, Jouer le round →, Fuir ↪.
- L'arrivée d'un récit ne déplace jamais le focus. Le `useEffect` de focus sur `Continuer` / `partieTerminee` reste seul propriétaire.
- `Jouer le round →` et `Fuir ↪` restent actifs pendant l'attente d'un récit.
- Le `role="log"` existant annonce poliment les ajouts. Pas de `aria-live` redondant.

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `ProjectionAssaut` | type | émis par lot 1, consommé par lot 2 | `{ vainqueur, qualite, monstre, heroPv, heroPvMax, monstrePv, monstrePvMax, issue? }` |
| `CibleCommentateur` | type | émis par lot 2, consommé par lot 1 | `{ role: 'commentateur'; projection: ProjectionAssaut }` |
| `ReponseCommentateur` | type | émis par lot 1 | `{ narration: string } \| EchecCopilote` |
| `CopiloteService.demander` | service (12ᵉ surcharge) | consomme | `(dossier, cible: CibleCommentateur, signal?) => Promise<ReponseCommentateur>` |
| `validerCommentateur` | validateur | interne lot 1 | `(brut: unknown, dossier: Dossier) => ok+narration \| ko+motif` |
| `assemblerCommentateur` | assembleur | interne lot 1 | `(dossier, cible) => ContexteCommentateur` |
| `BUDGET_CARACTERES_COMMENTATEUR` | constante | lot 1 expose | calculé, refus `trop-long` avant tout `fetch` |
| `NARRATION_COMBAT_CARACTERES_MAX` | constante | lot 1 expose | `400` |
| Route `/ia/commentateur` | worker | lot 1 | POST, checklist KR-233 (413/405/404/503) |

## 4 bis — Contrat de sortie IA (R5 commentateur)

| | |
|---|---|
| **Contexte injecté** | `canon.ton` (quand écrit), `canon.interdits_ton[]` (quand écrit), un round : vainqueur (`heros`/`monstre`/`nul`), qualité (`rate`/`erafle`/`franc`/`magistral`/`critique`), palier héros (`plein`/`blesse`/`critique`/`inconscient`), palier monstre (`plein`/`blesse`/`critique`/`vaincu`), nom du monstre (résolu depuis `BESTIARY`, registre de code — jamais un champ libre), issue si terminal. **Aucun chiffre en clair** — PV classés en paliers par l'assembleur `brain/`, seuils narratifs 50 %/25 %/≤ 0. |
| **Schéma de sortie** | `{"narration": "…"}` — non vide après trim, ≤ 400 caractères, `/\d/` refusé, pas de `?` final. |
| **Échec de validation** | Nouvel essai une fois (KR-230/283) — second appel même contexte. Après second échec : silence. Le round s'affiche avec le log mécanique seul, sans narration. Aucun repli déterministe. |
| **Ce que l'IA ne fait pas** | Ne lance aucun dé. Ne modifie aucune statistique. Ne connaît ni les PV, ni les AT, ni la marge, ni le numéro de round. Ne reçoit aucun historique des rounds précédents. Ne propose aucune action. N'invente aucune capacité ni effet. |

**Budget R5** : un seul round par appel, zéro mémoire de combat. `BUDGET_CARACTERES_COMMENTATEUR` = terme dossier (canon, majoré ×3) + terme projection (tables de mots fermées, coût fixe). Refus `trop-long` AVANT tout `fetch`.

**Paliers de santé** : fonction interne à l'assembleur (`brain/`), 4 niveaux : plein (> 50 %) / blessé (25–50 %) / critique (< 25 %) / inconscient|vaincu (≤ 0). Seuils de **présentation narrative** (pas une règle du jeu) → `REGLES-DU-JEU.md` et la table dorée ne sont **pas** touchés. Testés aux deux bornes de chaque seuil, et cross-check : `palier(pv) === 'inconscient'` ssi `healthState(pv, CA) !== 'ok'`.

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-commentateur` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : types R5, validateur, assembleur (PV bruts → paliers en mots, aucun chiffre sur le fil), 12ᵉ surcharge `CopiloteService`, route worker `/ia/commentateur`
- **Fichiers** (11) :
  - `src/brain/copilote/types.ts` (R) — `ProjectionAssaut`, `CibleCommentateur`, `ReponseCommentateur`
  - `src/brain/copilote/schemaSortie.ts` (R) — `CLES_SORTIE_COMMENTATEUR`, `NARRATION_COMBAT_CARACTERES_MAX`, `validerCommentateur`
  - `src/brain/copilote/schemaSortie.test.ts` (R) — tests validateur (5 canaris : 400→ok, 401→ko, vide→ko, /\d/→ko, ?→ko)
  - `src/brain/copilote/contexte/commentateur.ts` (N) — `assemblerCommentateur`, `BUDGET_CARACTERES_COMMENTATEUR`, `palierDeSante` interne
  - `src/brain/copilote/contexte/commentateur.test.ts` (N) — tests assembleur, budget, paliers (bornes des deux côtés + cross-check `healthState`), aucun `\d` dans le contexte
  - `src/brain/copilote/contexte/index.ts` (R) — ré-export
  - `src/brain/CopiloteService.ts` (R) — 12ᵉ surcharge aux DEUX sites (interface + implémentation)
  - `src/brain/CopiloteService.test.ts` (R) — tests nouvel essai (2 branches : succès après 1 échec / silence après 2 échecs, exactement 2 appels)
  - `worker/index.ts` (R) — `INVITES.commentateur`, `GABARIT_SORTIE.commentateur`, route, checklist KR-233
  - `worker/index.test.ts` (R) — suite route commentateur
  - `worker/frontiere.test.ts` (R) — canari croisé rôle-gabarit, `ROLES_PLAFONNES`
- **Expose** :
  ```ts
  export interface ProjectionAssaut {
    readonly vainqueur: 'heros' | 'monstre' | 'nul'
    readonly qualite: HitQuality | null
    readonly monstre: string
    readonly heroPv: number;    readonly heroPvMax: number
    readonly monstrePv: number; readonly monstrePvMax: number
    readonly issue?: Exclude<IssueCombat, 'hero-fled'>
  }
  export interface CibleCommentateur {
    role: 'commentateur'
    readonly projection: ProjectionAssaut
  }
  export type ReponseCommentateur = { readonly narration: string } | EchecCopilote
  export const CLES_SORTIE_COMMENTATEUR = ['narration'] as const
  export const NARRATION_COMBAT_CARACTERES_MAX = 400
  export function validerCommentateur(brut: unknown, dossier: Dossier): /* ok | ko */
  export function assemblerCommentateur(dossier: Dossier, cible: CibleCommentateur): ContexteCommentateur
  export const BUDGET_CARACTERES_COMMENTATEUR: number
  ```
- **Critères couverts** : #2, #5, #6

### Lot 2 — `feature-commentaire-combat`
- **Ouvrier** : `dev-lot`
- **But** : enregistrement moteur `AssautRound`, projection en liste blanche, hook `useCommentaireCombat`, composant `CombatEnCours`, intégration dans `EcranCombat`
- **Fichiers** (14) :
  - `src/player/engine/combatTypes.ts` (R) — `AssautRound`, `CombatState.dernierAssaut?`
  - `src/player/engine/combatEngine.ts` (R) — `dernierAssaut` posé aux 3 sites
  - `src/player/engine/combatEngine.test.ts` (R) — tests `dernierAssaut` (3 issues + survie capacités + effacement fuite)
  - `src/features/play-mode/utils/combatProjection.ts` (N) — `projeterAssaut(etat, heroPvMax): ProjectionAssaut | null`
  - `src/features/play-mode/utils/combatProjection.test.ts` (N) — tests projection, balayage source (jamais `.log`/`.text`)
  - `src/features/play-mode/hooks/useCommentaireCombat.ts` (N) — `useCommentaireCombat(dossier)` → `{commentaires, commenter}`
  - `src/features/play-mode/hooks/useCommentaireCombat.test.ts` (N) — tests hook (idempotence, abort, échec muet)
  - `src/features/play-mode/components/CombatEnCours.tsx` (N) — câblage dossier+session+état, appel `commenter` dans handleJouer
  - `src/features/play-mode/components/CombatEnCours.test.tsx` (N) — tests intégration
  - `src/features/play-mode/components/EcranCombat.tsx` (R) — prop `commentaires: ReadonlyMap<number, CommentaireRound>`, zone récit dans `JournalLigneRound`
  - `src/features/play-mode/components/EcranCombat.test.tsx` (R) — tests rendu récit, Badge, silence, style tokens
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — remplacement par `CombatEnCours`
  - `src/features/play-mode/tests/moteurSansIA.test.ts` (R) — nouvelle ligne d'exclusion `useCommentaireCombat.ts` + mutant obligatoire + balayage `combatProjection.ts`
  - `src/features/play-mode/tests/combatParConsole.test.tsx` (R) — session identique avec/sans R5, fuite ne déclenche pas R5
- **Consomme** : `ProjectionAssaut`, `CibleCommentateur`, `ReponseCommentateur` (import direct de `brain/copilote/types`)
- **Types internes** :
  ```ts
  export interface AssautRound {
    readonly round: number
    readonly vainqueur: 'heros' | 'monstre' | 'nul'
    readonly qualite: HitQuality | null
  }
  // CombatState gagne : readonly dernierAssaut?: AssautRound (optionnel)

  export type CommentaireRound =
    | { readonly etat: 'attente' }
    | { readonly etat: 'recu'; readonly narration: string }
  ```
- **Points d'exécution** :
  - L'appel part dans `handleJouer`, après `onSession(next)`, jamais dans un `useEffect`.
  - Gardé par `next !== session` et un `Set` de rounds déjà demandés.
  - Échec : la clé est supprimée de la map. Aucun nœud DOM.
  - Abort au démontage de `CombatEnCours` (`AbortController`).
  - `tryHeroFlee` ne pose pas de `dernierAssaut` → aucun appel R5 lors d'une fuite.
- **Critères couverts** : #1, #3, #4, #7, #8
- **Invariant** : `EcranPartie.test.tsx` reste vert sans édition (s'il rougit, c'est un bug d'extraction)

*(2 lots. Propriété disjointe : lot 1 = `src/brain/**` + `worker/**` ; lot 2 = `src/player/**` + `src/features/play-mode/**`. Aucun fichier n'est nommé deux fois.)*

## 6 — Critères d'acceptation

1. **Étant donné** un combat en cours avec au moins un round joué **quand** l'auteur clique « Jouer le round → » **alors** un appel `CopiloteService.demander(CibleCommentateur)` est émis et le texte `narration` retourné s'affiche dans la ligne du round, en `--font-ui` avec filet gauche `--border-rule` et couleur `--text-muted` — *niveau : composant* — *lot 2*
2. **Étant donné** une réponse R5 avec un chiffre (« 5 ») ou de plus de 400 caractères **quand** `validerCommentateur` la reçoit **alors** la réponse est refusée. 5 canaris : 400→ok, 401→ko, vide→ko, `/\d/`→ko, `?` final→ko — *niveau : unitaire* — *lot 1*
3. **Étant donné** une fuite (`onFuir`) **quand** le combat se clôt par hero-fled **alors** aucun appel R5 n'est émis et la ligne de fuite reste mécanique — *niveau : composant* — *lot 2*
4. **Étant donné** un round résolu par `resolveCombatRound` **quand** l'issue est calculée **alors** `CombatState.dernierAssaut` porte `{ round, vainqueur, qualite }` structurés — *niveau : unitaire* — *lot 2*
5. **Étant donné** un premier appel R5 qui échoue (validation ou réseau) **quand** le nouvel essai réussit **alors** le texte s'affiche, exactement 2 appels émis ; **quand** les deux échouent **alors** silence total, aucun 3ᵉ appel, aucun nœud récit — *niveau : contrat* — *lot 1*
6. **Étant donné** `combatProjection.ts` **quand** on balaye son code source **alors** il ne contient ni `.text` ni `.log` — *niveau : unitaire* — *lot 2*
7. **Étant donné** un combat joué avec R5 **quand** on compare la session persistée à un combat identique sans R5 **alors** les deux sessions sont strictement égales (égalité profonde) — *niveau : bout-en-bout* — *lot 2*
8. **Étant donné** l'ajout du hook `useCommentaireCombat` **quand** `moteurSansIA.test.ts` tourne **alors** le balayage reste vert, la nouvelle ligne d'exclusion est présente et son mutant fait rougir le test — *niveau : unitaire* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `schemaSortie.test.ts` > commentateur > accepte 400 car sans chiffre | 400 car → ok | jest | KR-296 | 1 |
| `schemaSortie.test.ts` > commentateur > refuse 401 car | 401 car → ko | jest | KR-296 | 1 |
| `schemaSortie.test.ts` > commentateur > refuse vide | '' → ko | jest | KR-296 | 1 |
| `schemaSortie.test.ts` > commentateur > refuse chiffre | `/\d/` → ko | jest | KR-296 | 1 |
| `schemaSortie.test.ts` > commentateur > refuse question finale | '…?' → ko | jest | KR-296 | 1 |
| `commentateur.test.ts` > palier plein au-dessus de 50 % | pv 51, pvMax 100 → 'plein' | jest | — | 1 |
| `commentateur.test.ts` > palier blesse a 50 % | pv 50, pvMax 100 → 'blesse' | jest | — | 1 |
| `commentateur.test.ts` > palier critique sous 25 % | pv 24, pvMax 100 → 'critique' | jest | — | 1 |
| `commentateur.test.ts` > palier inconscient a 0 | pv 0 → 'inconscient' | jest | — | 1 |
| `commentateur.test.ts` > cross-check palier/healthState | `palier(0) === 'inconscient'` ssi `healthState(0, CA) !== 'ok'` | jest | — | 1 |
| `commentateur.test.ts` > aucun chiffre dans le contexte | `!/\d/.test(contexte.texte)` | jest | KR-294 | 1 |
| `commentateur.test.ts` > refus trop-long | canon surdimensionné → `trop-long` avant fetch | jest | KR-296 | 1 |
| `CopiloteService.test.ts` > commentateur > nouvel essai → succès | 1 invalide + 1 valide → `{narration}`, 2 appels | contrat | KR-230/283 | 1 |
| `CopiloteService.test.ts` > commentateur > 2 échecs → silence | 2 invalides → `EchecCopilote`, 2 appels, jamais 3 | contrat | KR-230/283 | 1 |
| `frontiere.test.ts` > canari commentateur | rôle + gabarit + plafond appariés | contrat | KR-233 | 1 |
| `frontiere.test.ts` > commentateur 413/405/404/503 | checklist KR-233 complète | contrat | KR-233 | 1 |
| `combatEngine.test.ts` > dernierAssaut posé 3 issues | égalité, victoire héros, victoire monstre | jest | KR-293 | 2 |
| `combatEngine.test.ts` > dernierAssaut survit aux capacités | `describe.each(MONSTER_CAPACITIES)` | jest | KR-293 | 2 |
| `combatEngine.test.ts` > tryHeroFlee efface dernierAssaut | après fuite, `dernierAssaut` absent | jest | KR-297 | 2 |
| `combatProjection.test.ts` > projeterAssaut liste blanche | balayage source : ni `.log` ni `.text` | jest | KR-294 | 2 |
| `combatProjection.test.ts` > null si pas de dernierAssaut | `etat.dernierAssaut === undefined` → `null` | jest | KR-293 | 2 |
| `useCommentaireCombat.test.ts` > idempotent par round | double appel même round → 1 seul fetch | jest | — | 2 |
| `useCommentaireCombat.test.ts` > nouvel essai puis succès | 1er échec → 2e ok → narration affichée | composant | KR-230 | 2 |
| `useCommentaireCombat.test.ts` > double échec silence | 2 échecs → nœud absent | composant | KR-283 | 2 |
| `EcranCombat.test.tsx` > récit en --font-ui avec filet | vérifier `fontFamily`, `borderLeft`, `color: --text-muted` | composant | — | 2 |
| `EcranCombat.test.tsx` > Badge Commentaire en cours… | état `attente` → Badge affiché | composant | — | 2 |
| `EcranCombat.test.tsx` > silence = nœud absent | échec → `queryByText` nul, aucune ligne vide | composant | KR-230/283 | 2 |
| `moteurSansIA.test.ts` > exclusion useCommentaireCombat + mutant | ligne présente, mutant (suppression) rougit | jest | KR-250/260 | 2 |
| `moteurSansIA.test.ts` > combatProjection.ts sans .text/.log | balayage source du fichier de projection | jest | KR-294 | 2 |
| `combatParConsole.test.tsx` > session identique avec et sans R5 | égalité profonde | bout-en-bout | KR-292 | 2 |
| `combatParConsole.test.tsx` > fuite ne déclenche pas R5 | aucun appel commentateur après fuite | bout-en-bout | KR-297 | 2 |

**Non vérifiable en l'état** : qualité de la prose produite par le modèle — consigne d'invite, testée manuellement à la démo.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | NIA | PV bruts dans `ProjectionAssaut` (TL) vs paliers qualitatifs dans le type | `RETENU` (TL) | PV dans le type cible, assembleur seul classeur de paliers (précédent `CibleNarrateur.epreuve`). NIA concède au T2. |
| 2 | NIA | Aucun nom dans le contexte (ni monstre ni héros) | `RETENU` (TL, monstre seul) | `monstre` = registre de code `BESTIARY`, pas champ libre. NIA concède au T2. Nom du héros exclu (KR-232). |
| 3 | PM | 3 lots vs 2 lots (TL) | `RETENU` (TL, 2 lots) | PM cède au T2. Déclencheur de scission : lot 2 > 16 fichiers. |
| 4 | NIA | `capacite?` optionnelle dans la projection | `REJETÉ` | Pas de producteur (KR-285). Les hooks ne disent pas ce qu'ils ont fait. Additif ultérieurement. |
| 5 | NIA | Borne 400 → 600 si > 30 % de rejet | `REJETÉ` | NIA retire au T2. Constante à un site, ajustable sans comité. |
| 6 | PM | Vocabulaire : « nouvel essai » pour le retry, « commentateur » dans le code | `RETENU` | « Commentaire de round » côté auteur. « Rejeu » réservé à KR-292. |
| 7 | UX | Registre fiction : 2ᵉ pers. singulier (UX T2) vs pluriel (NIA T1) | `RETENU` (UX) | Cohérent avec `texte_ouverture_joueur`. Pronom tu/vous délégué à `canon.ton`. |
| 8 | TL+NIA | `round` et postures hors du fil réseau | `RETENU` | `round` est un chiffre (tuerait `/\d/`), postures faussées par capacités. Exclus du contexte. |
| 9 | TL | `ProjectionAssaut` dans `copilote/types.ts`, pas `contexte/commentateur.ts` | `RETENU` | Évite cycle d'import (`types.ts` ↔ `contexte/`). |
| 10 | TL | `tryHeroFlee` ne pose pas `dernierAssaut` | `RETENU` | Évite de projeter l'assaut précédent. Test dédié lot 2. |
| 11 | TL | `validerCommentateur` reçoit `dossier` | `RETENU` | Parité avec les 10 autres validateurs (`porteUnIdentifiant`, marqueur). |
| 12 | UX | Badge `Commentaire en cours…` (pas « Le narrateur écrit… ») | `RETENU` | « Narrateur » fait doublon avec R3. Vocabulaire aligné sur le PM. |
| 13 | UX | `--text-muted` pour la couleur du récit | `RETENU` | Hiérarchise sous le log mécanique sans accent. Ajouté au T2. |
| 14 | UX | `<button>` maison dans EcranCombat | `REPORTÉ` | Dette préexistante (3 boutons). Pas de 4ᵉ ajouté. Hors it3. |
| 15 | QA | 5 canaris validateur (400, 401, vide, /\d/, ?) | `RETENU` | Ajouté au T2. Dans `schemaSortie.test.ts`. |
| 16 | TL | Session égalité avec/sans R5 | `RETENU` | Narration éphémère → session identique. Dans `combatParConsole.test.tsx`. |
| 17 | QA | Balayage source `combatProjection.ts` | `RETENU` | Dans `moteurSansIA.test.ts`. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto tenu → pas d'escalade.)*

## 9 — Innovation

*(Aucune proposition INNOVATION retenue.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `EcranPartie.test.tsx` reste vert sans édition (s'il rougit, c'est un bug d'extraction)
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-combat-it3.revue.md`
- [ ] `npm run test:mutation` **non dû** : cette itération ne touche aucun des 4 fichiers mutés (`combat.ts`, `challenge.ts`, `xp.ts`, `characteristics.ts`)
- [ ] **Non vérifiable** : qualité prose du commentaire (vérifiée manuellement à la démo)

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **APPROVE** | AC écrits (§ 6 #1–8, AC-3.1/3.2/3.3 couverts), hors périmètre écrit (§ 2), vocabulaire retenu (#6) |
| Tech Lead | recevable sous réserve → **APPROVE** | `AssautRound` émis par le moteur (§ 5 lot 2), paliers dans `brain/` (§ 4 bis), `ProjectionAssaut` sans postures, session.ts fermé |
| UX | recevable sous réserve → **APPROVE** | récit en `--font-ui` + `--text-muted` (veto tenu), silence = nœud absent (veto tenu), singulier délégué à `canon.ton`, pas de vol de focus |
| QA | recevable sous réserve → **APPROVE** | 5 canaris validateur (§ 7), balayage combatProjection (§ 7), AC observables et testables |
| Narratif & IA | recevable sous réserve → **APPROVE** | paliers dans `brain/` (§ 4 bis), aucun chiffre sur le fil, silence = nœud absent, capacité reportée |
