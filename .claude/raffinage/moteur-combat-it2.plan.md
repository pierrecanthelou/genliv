# Plan d'itération — `moteur-combat` · itération `2`

> Statut : `porte 1 verte, en attente de validation`
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-10-04
> Composition : `4 rôles` — motif : itération purement mécanique (fuite = entrée joueur + rejeu + UI), aucun prompt IA, aucune mémoire de session, aucune prose narrative émise
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit son héros fuir un combat : bouton Fuir séparé, assaut gratuit du monstre, issue `hero-fled`. » |
| **Tranche** | Bouton Fuir (EcranCombat) → `fuirRencontre` (session.ts) → rejeu fuite (rencontre.ts + combatEngine.ts) → badge FUITE + clôture (EcranCombat + EcranPartie) |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1) |
| **Hors périmètre** | État désactivé du bouton · navigation vers `fleeTarget` · nettoyage des vestiges d'arbre (`MonsterInstance.fleeTarget`, `victoryTarget`, `loot`) · extraction `sessionCombat.ts` (dette à déclencheur) · dialogue de confirmation avant fuite · phrase fictionnelle aide de coût · `npm run test:mutation` (aucun des 4 fichiers mutés n'est touché) |
| **Reporté** | Dette : `session.ts` > 800 l. → le prochain lot qui le rouvre sort les portes combat dans `sessionCombat.ts` (à ajouter au roadmap § dette à déclencheur) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur voit son héros fuir un combat. Bouton « Fuir » séparé (pas une posture), issue `hero-fled`. »

## 2 — Hors périmètre

- État désactivé du bouton Fuir (plus aucun déclencheur depuis D5 amendé : `fleeTarget` est un vestige, toujours null)
- Navigation vers `fleeTarget` — supprimée par D5 amendé : le héros reste au lieu courant
- Nettoyage des vestiges d'arbre (`MonsterInstance.fleeTarget`, `victoryTarget`, `loot`) — démolition n° 9 (KR-181)
- Extraction `sessionCombat.ts` — dette à déclencheur, hors de cette itération
- Dialogue de confirmation avant fuite — fuir n'est pas une action dangereuse (même classe que « Jouer le round », bac à sable de l'aperçu)
- Phrase fictionnelle aide de coût sous le bouton Fuir (UX proposition tour 2, reportée)
- `npm run test:mutation` — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché par cette itération

## 3 — Contrat de design

### Bouton Fuir
- **Placement** : ligne d'actions frère de POSTURE. `display: flex`, `gap: var(--space-5)`. Jouer le round en `flex: 1`, Fuir en `flexShrink: 0`.
- **Libellé** : `Fuir ↪`
- **`aria-label`** : `"Fuir le combat"`
- **Style** : fond `var(--surface-card)`, couleur `var(--text-strong)`, bordure `1px solid var(--border-card)`, `border-radius: var(--r-xl)`, police `var(--font-ui)`, taille `var(--fs-body)`, graisse `var(--fw-semibold)`, hauteur minimale `HIT_TARGET_MIN` (44px). Pas d'accent, pas de `var(--bad)`.
- **États** : actif (combat `ongoing`), absent (issue terminale). Pas de disabled.
- **Clavier** : Tab → SegmentedControl → Jouer → Fuir. Pas de raccourci global.

### Badge issue `hero-fled`
- **Libellé** : `FUITE`
- **Tone** : `neutral` (ni success, ni error)
- **Bouton Continuer** : présent, reçoit le focus

### Table d'issues
- Table constante `Record<Exclude<CombatOutcome, 'ongoing'>, string>` pour les libellés de badges. Exhaustive par compilation — un oubli est une erreur `tsc`.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatCombat.fuite` | type | étendu | `readonly fuite?: true` — optionnel à vie (KR-251), jamais `false`, absent sinon |
| `IssueCombat` | type | étendu | `'hero-fled'` ajouté au 5e membre de l'union |
| `fuirRencontre` | service | exposé | `(session: EtatSession) => EtatSession` — no-op même référence si pas de combat ou fuite déjà posée |
| `jouerPosture` | service | modifié | no-op même référence si `combat.fuite === true` |
| `CLOTURES['hero-fled']` | registre | étendu | `sansCombat`, PV/PE écrêtés, ni XP ni delta de plafonds |
| `sessionDestinations` | registre | étendu | `'combat.fuite'` ∈ `CheminDeFeuilleDeSession`, ligne `'moteur'` |
| `brain/index.ts` | barrel | étendu | re-export `fuirRencontre` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-fuite` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : Amender D5, élargir `IssueCombat`, ajouter `fuite?: true` à `EtatCombat`, écrire `fuirRencontre`, garde no-op sur `jouerPosture`, entrée `CLOTURES['hero-fled']`, destination et fixture saturée.
- **Fichiers** :
  - `docs/REGLES-PLAY.md` (R) — D5 seul
  - `src/brain/dossier/session.ts` (R) — `EtatCombat`, `IssueCombat`, `fuirRencontre`, `jouerPosture`, `CLOTURES`
  - `src/brain/dossier/session.test.ts` (R) — tests `fuirRencontre`, `jouerPosture` no-op, `cloreCombat hero-fled`
  - `src/brain/dossier/sessionDestinations.ts` (R) — `'combat.fuite'` ligne `'moteur'`
  - `src/brain/dossier/sessionCouverture.test.ts` (R) — couverture de la nouvelle feuille
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — `combat.fuite = true`
  - `src/brain/index.ts` (R) — re-export `fuirRencontre`
- **Expose** :
  ```ts
  export interface EtatCombat {
    readonly monstre_ref: string
    readonly postures: readonly Posture[]
    readonly fuite?: true  // optionnel à vie (KR-251), ABSENT sinon, jamais false
  }
  export type IssueCombat =
    | 'hero-victory' | 'monster-fled' | 'hero-survived-unconscious' | 'hero-mort' | 'hero-fled'
  export function fuirRencontre(session: EtatSession): EtatSession
  // no-op, MÊME référence : sans combat, ou fuite déjà posée
  // sinon { ...session, combat: { ...session.combat, fuite: true } } — rien d'autre ne bouge
  ```
- **Critères couverts** : #1 (partiellement), #2, #4, #5, #6, #7

### Lot 2 — `feature-fuite`
- **Ouvrier** : `dev-lot`
- **But** : Rejeu de la fuite dans `rencontre.ts`, correction `round + 1` dans `combatEngine.ts`, bouton Fuir + badge FUITE dans `EcranCombat.tsx`, câblage dans `EcranPartie.tsx`.
- **Fichiers** :
  - `src/player/engine/combatEngine.ts` (R) — `tryHeroFlee` : `round: state.round + 1` sur les 3 lignes de journal
  - `src/player/engine/combatEngine.test.ts` (R) — tests `round+1`, frontière inconscient, remplacement `Math.random` par `seqRng`
  - `src/player/engine/rencontre.ts` (R) — `rejouerCombat` : après la boucle, `if (state.outcome === 'ongoing' && combat.fuite === true)` → `tryHeroFlee` ; `bilanDe` : seul `'ongoing'` rend `undefined`
  - `src/player/engine/rencontre.test.ts` (R) — tests de rejeu pur, aller-retour JSON, fuite sur issue terminale, `bilanDe hero-fled`
  - `src/player/engine/combatTypes.ts` (R) — commentaire L14 seul (corrige le vestige qui contredit D5 amendé)
  - `src/features/play-mode/components/EcranCombat.tsx` (R) — `onFuir` requis, bouton Fuir, badge FUITE, table `Record<Exclude<CombatOutcome,'ongoing'>, string>`
  - `src/features/play-mode/components/EcranCombat.test.tsx` (R) — tests bouton, badge, issue
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — `handleFuir`, passage `onFuir` à `EcranCombat`
  - `src/features/play-mode/tests/combatParConsole.test.tsx` (R) — parcours console complet avec fuite
- **Consomme** : `fuirRencontre`, `EtatCombat.fuite`, `IssueCombat` via `brain/index.ts`
- **Critères couverts** : #1 (complètement), #3, #4 (frontière), #5 (rejeu), #8

## 6 — Critères d'acceptation

1. **Étant donné** un combat en cours **quand** l'auteur clique « Fuir ↪ » **alors** le héros subit un assaut gratuit (Normale du monstre vs Défensive du héros) et le combat se termine avec l'issue `hero-fled` — *niveau : bout-en-bout* — *lots 1 + 2*
2. **Étant donné** un combat en cours **quand** l'auteur clique « Fuir ↪ » **alors** le héros reste au lieu courant, sans XP, sans butin, sans variation de plafonds — *niveau : unitaire* — *lot 1*
3. **Étant donné** un combat dont l'issue est terminale **quand** l'écran de combat est affiché **alors** le bouton « Fuir » est absent — *niveau : composant* — *lot 2*
4. **Étant donné** une fuite dont l'assaut gratuit réduit les PV à 0 **quand** le combat se résout **alors** l'issue est `hero-mort`, pas `hero-fled` — *niveau : unitaire* — *lots 1 + 2*
5. **Étant donné** un combat avec `fuite: true` persisté **quand** `rejouerCombat` est appelé deux fois **alors** les résultats sont identiques (rejeu pur, KR-292) — *niveau : unitaire* — *lot 2*
6. **Étant donné** un `fuirRencontre` appliqué **quand** on tente `jouerPosture` ensuite **alors** la session est retournée inchangée (même référence) — *niveau : unitaire* — *lot 1*
7. **Étant donné** un `fuirRencontre` appliqué **quand** la clôture `hero-fled` s'exécute **alors** `monde`, `horloge`, `journal` et `lieu_courant` sont identiques à avant la clôture — *niveau : unitaire* — *lot 1*
8. **Étant donné** un combat terminé par fuite **quand** l'écran d'issue s'affiche **alors** le badge `FUITE` (tone neutral) est visible et le bouton Continuer a le focus — *niveau : composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `fuirRencontre pose fuite et ne touche ni postures ni monde ni horloge ni journal ni heros` | `combat.fuite === true`, reste identique | jest | KR-297 | 1 |
| `fuirRencontre sans combat rend la meme reference` | `===` référence | jest | — | 1 |
| `fuirRencontre deux fois rend la meme reference` | `===` référence | jest | — | 1 |
| `jouerPosture apres fuite rend la meme reference` | `===` référence | jest | KR-297 | 1 |
| `cloreCombat hero-fled retire combat, ecrete pv et pe, aucune xp, plafonds intacts` | `combat` absent, `pv ≤ pvMax`, `pe ≤ peMax`, `xp` inchangé | jest | — | 1 |
| `cloreCombat hero-fled laisse monde horloge journal identiques` | `monde`, `horloge`, `journal` `===` avant | jest | — | 1 |
| `tryHeroFlee numerote round+1` | `state.round` 0 → `round: 1` sur 3 lignes | jest | — | 2 |
| `tryHeroFlee frontiere inconscient` | PV 0 → `hero-mort`, PV 1 → `hero-fled` | jest | — | 2 |
| `rejouerCombat applique la fuite apres les postures` | issue `hero-fled` après postures + fuite | jest | KR-292 | 2 |
| `rejouerCombat est pur : deux appels identiques` | deepEqual des deux résultats | jest | KR-292 | 2 |
| `rejouerCombat identique apres aller-retour JSON de la session` | JSON.parse(JSON.stringify(session)) → même rejeu | jest | KR-292 | 2 |
| `rejouerCombat ignore une fuite sur issue deja terminale` | issue terminale inchangée | jest | — | 2 |
| `bilanDe hero-fled rend un bilan` | `!== undefined` | jest | — | 2 |
| `Fuir present et actif en cours de combat` | bouton visible | RTL | — | 2 |
| `Fuir hors du groupe POSTURE` | pas dans le même conteneur que SegmentedControl | RTL | KR-297 | 2 |
| `clic Fuir appelle onFuir une fois` | `onFuir` appelé 1× | RTL | — | 2 |
| `Fuir absent en issue terminale` | bouton absent | RTL | — | 2 |
| `issue hero-fled : badge FUITE et Continuer focus` | badge texte + focus | RTL | — | 2 |
| `chaque issue terminale a un badge` | boucle sur 5 issues | RTL | — | 2 |
| Parcours console : combat → Fuir → FUITE → Continuer | `combat` retiré, `lieu_courant` et `xp` inchangés, `combat.fuite === true` avant Continuer | RTL | KR-292 | 2 |

Cas limites couverts : fuite sans combat (no-op) · fuite double (idempotent) · posture après fuite (no-op) · PV 0 frontière (mort) · PV 1 frontière (fled) · fuite sur issue déjà terminale (ignorée) · aller-retour JSON (rejeu pur).

**Non vérifiable en l'état** : le style visuel du bouton Fuir (tokens CSS) — jsdom ne résout pas les custom properties. Vérifié à la revue visuelle.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM, TL | `fleeTarget` toujours null, D5 inapplicable | RETENU | D5 amendé dans lot 1 : héros reste au lieu courant, pas de navigation, pas de `fleeTarget` |
| 2 | PM | Signal de fuite persisté (`fuite?: true`) | RETENU | `fuite` est une entrée du joueur comme `postures`, lot 1 |
| 3 | TL | `fuite` terminale : `jouerPosture` no-op après | RETENU | Lot 1, test nommé |
| 4 | TL | Inconscient après assaut gratuit = mort (E1) | RETENU | Épinglé à la frontière PV 0 / PV 1, lots 1 + 2 |
| 5 | TL | Journal `tryHeroFlee` : `round: state.round + 1` | RETENU | Lot 2, test nommé |
| 6 | QA | Tests nommés de rejeu pur (KR-292) | RETENU | 4 tests nommés dans lot 2 (condition QA) |
| 7 | UX | Fuir ≠ accent, style secondaire | RETENU | Contrat de design § 3 |
| 8 | UX | Fuir hors du groupe POSTURE | RETENU | Ligne d'actions séparée, contrat § 3 |
| 9 | UX | Badge FUITE obligatoire | RETENU | Table exhaustive par compilation, lot 2 |
| 10 | UX | État désactivé du bouton Fuir | REJETÉ | `fleeTarget` est toujours null — aucun déclencheur de disabled dans le monde actuel. `onFuir` est requis (pas optionnel). |
| 11 | UX | Aide de coût (phrase fictionnelle sous le bouton) | REPORTÉ | Proposition UX tour 2 — reportée au polish, valeur à confirmer par l'auteur |
| 12 | UX | Bouton maison = 3e copie d'un bouton inline | REPORTÉ | Dette non bloquante, à traiter au design system pass |
| 13 | TL | `session.ts` > 800 lignes (KR-112) | REPORTÉ | KR-112 vise composants et hooks, pas les services. Dette à déclencheur : le prochain lot qui rouvre `session.ts` sort les portes combat dans `sessionCombat.ts` |
| 14 | TL | `onFuir` requis (pas optionnel) | RETENU | Optionnel serait une branche morte en production, lot 2 |
| 15 | TL | Table `Record<Exclude<CombatOutcome,'ongoing'>, …>` pour les badges | RETENU | Rend l'oubli d'un membre une erreur `tsc`, lot 2 |
| 16 | TL | Correction KR-297 : `jouerRound` → `jouerPosture` | RETENU | Erreur de nom dans le KR, corrigée à l'étape 4 (docs) |

## 9 — Innovation

*(aucune)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-combat-it2.revue.md`
- [ ] `npm run test:mutation` **non requis** — aucun des 4 fichiers mutés n'est touché

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | Approuvé | Veto levé : D5 amendé rend la démo vérifiable |
| Tech Lead | Approuvé sous condition | D5 amendé avant tout code |
| UX | Réserves, approuvé | Badge FUITE obligatoire (retenu) |
| QA | Approuvé sous conditions | 4 tests nommés de rejeu pur (retenu) |
