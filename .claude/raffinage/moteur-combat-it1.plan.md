# Plan d'itération — `moteur-combat` · itération `1`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-04
> Composition : `5 rôles` — motif : l'itération touche le moteur de jeu et la session de play-mode
> Exécution : `séquentielle` (2 lots)

## Fiche de validation

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit un événement à monstre ouvrir un combat qu'il résout round par round, sans IA. » |
| **Tranche** | EcranCombat (play-mode) → rencontre.ts (player/engine) → session.ts / evaluate.ts / commandes.ts (brain/) → persistance (rejeu pur) |
| **Lots** | 2 lots · dont `contrat` : oui |
| **Hors périmètre** | fuite (it2), R5 commentateur (it3), pending* (maladie, vol, magie, rayon), butin, équipement, écran de mort (n° 15), correction « manqué », flèches SegmentedControl, extensions primitives brain/components/, pickMonsterPosture enrichi |
| **Reporté** | « sonde D2-bis » retirée du goal (critère de caractérisation #7 conservé) · correction « manqué » (à l'itération qui rouvre capacityEffects.ts) · flèches SegmentedControl (non additif, 23 appelants) · IconButton.tsx:49 fontSize '11px' (dette, hors lot) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur voit un événement à monstre ouvrir un combat qu'il résout round par round, sans IA. »

## 2 — Hors périmètre

- Fuite du héros (it2, bouton séparé + issue hero-fled)
- R5 commentateur (it3, route /ia/commentateur, projection structurée)
- Application des pending* (maladie → pvMax, vol → inventaire, magie, rayon → peMax) — les fixtures de test utilisent un monstre SANS ces capacités
- Butin, victoryTarget, resolutions[].consequence
- Équipement du héros (mains nues en dur)
- Écran de mort / fin de partie (n° 15)
- Correction « manqué » dans capacityEffects.ts (déclencheur non armé, KR-294)
- Extensions des primitives brain/components/ (IconButton wide, SegmentedControl flèches)
- Enrichir pickMonsterPosture selon IG (pas de règle écrite, KR-130)
- ouvrir_combat (deltas.ts) et combattre (commandes.ts) restent clos

## 3 — Contrat de design

**Composants** : `Card`, `SegmentedControl`, `Badge`, bouton local `<button>` stylé sur tokens (pas d'extension d'IconButton).

**Tokens** : `--space-3`, `--space-4`, `--space-9`, `--bw-hair`, `--r-xl`, `--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-meta`, `--fs-body`, `--fs-title`, `--fw-semibold`, `--track-eyebrow-wide`, `--lh-body`, `--text-strong`, `--text-body`, `--text-muted`, `--text-faint`, `--text-label`, `--surface-sunken`, `--border-subtle`, `--border-field`, `--accent` (bouton uniquement).

**Interdits** : `--good`, `--bad`, `--accent*` hors bouton d'action, `--text-primary`, toute valeur littérale (px, hex, rgb, hsl).

**Textes exacts** (vouvoiement, 2e personne du pluriel, présent) :

| Emplacement | Texte |
|---|---|
| Titre | `COMBAT` |
| Sous-section journal | `JOURNAL DE COMBAT` |
| Sous-section posture | `POSTURE` |
| En-tête de round | `ROUND {n}` |
| En-tête issue | `ISSUE DU COMBAT` |
| Segments | lus de `POSTURES[k].label` (Normale, Précise, Défensive) |
| Aide de posture | visible sous le SegmentedControl (pas en `title`) |
| Bouton round | `Jouer le round →` |
| Bouton clôture (non fatale) | `Continuer` |
| Journal vide (empty state dashed) | `Le combat commence. Choisissez une posture, puis lancez le round.` |
| Badge victoire | `VICTOIRE` (ton neutre `Badge`) |
| Badge défaite | `DÉFAITE` (ton neutre `Badge`) |
| Badge inconscient | `INCONSCIENT` (ton neutre `Badge`) |
| Après DÉFAITE | `PARTIE TERMINÉE — Échap ou « Quitter le test »` |

**États** :

| État | Rendu |
|---|---|
| Défaut | SegmentedControl pré-sélectionné sur Normale, journal vide dashed |
| Round en cours | journal rempli (chronologique), résultat du dernier round visible |
| Victoire / Fuite monstre | Badge VICTOIRE, bouton « Continuer », SegmentedControl masqué |
| Inconscient | Badge INCONSCIENT, bouton « Continuer » |
| Défaite | Badge DÉFAITE, « PARTIE TERMINÉE », aucun bouton d'action, focus sur « Quitter le test », Échap ferme |

**Comportement clavier** : Tab entre les groupes (posture, bouton). SegmentedControl navigable (sélection suit le focus). ≥ 44 px hit targets.

**Layout** : EcranCombat monté dans EcranPartie en remplacement de la console tant que `session.combat` existe. BandeauHeros reçoit PV/PE vivants du rejeu. Texte mono, pas de jauges.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatSession.combat` | service | consomme | `combat?: EtatCombat` (optionnel à vie, KR-160/191) |
| `EtatCombat` | service | émet | `{ readonly monstre_ref: string; readonly postures: readonly Posture[] }` |
| `IssueCombat` | service | émet | `'hero-victory' \| 'monster-fled' \| 'hero-survived-unconscious' \| 'hero-mort'` |
| `BilanCombat` | service | émet | `{ issue: IssueCombat; pv: number; pe: number; xp: number; pv_max_delta: number; pe_max_delta: number }` (tous `readonly`) |
| `resoudreRencontre` | service | émet | `(s: EtatSession, r: {evenement_id: string; monstre_ref: string}) => EtatSession` |
| `jouerPosture` | service | émet | `(s: EtatSession, p: Posture) => EtatSession` |
| `cloreCombat` | service | émet | `(s: EtatSession, b: BilanCombat) => EtatSession` |
| `evenementARencontrer` | service | émet | `(d: Dossier, s: EtatSession) => {evenement_id: string; monstre_ref: string} \| undefined` |
| `monstreDeLaReference` | service | émet | `(reference: string) => MonsterConfig \| undefined` |
| `RefusCommande` | registre | émet | `+= 'combat_en_cours'` |
| `DomaineAlea` | registre | émet | `+= 'combat'` |
| `sessionDestinations` | service | émet | `combat`, `combat.monstre_ref`, `combat.postures[]` = `'moteur'` |

**Sémantique `cloreCombat`** :
- `hero-victory` / `monster-fled` : pv, pe, pvMax/peMax (+delta, plancher 1, pv/pe écrêtés), XP via `crediterXp`, retire `combat`
- `hero-survived-unconscious` : pv = 1, pas d'XP, retire `combat`
- `hero-mort` : renvoie `s` inchangée (`combat` reste, mort bouchonnée n° 15)

## 4 bis — Contrat de sortie IA

Pas de sortie IA en it1. Aucun appel modèle, aucune projection structurée. Le R5 commentateur est convoqué en it3.

## 5 — Lots

### Lot 1 — `contrat-combat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser les types, les fonctions de session et l'évaluateur d'événements combat dans brain/
- **Fichiers** :
  - `src/brain/dossier/session.ts` (R) — `EtatCombat`, `IssueCombat`, `BilanCombat`, `resoudreRencontre`, `jouerPosture`, `cloreCombat`
  - `src/brain/dossier/evaluate.ts` (R) — `evenementARencontrer`
  - `src/brain/dossier/commandes.ts` (R) — `RefusCommande += 'combat_en_cours'`
  - `src/brain/dossier/alea.ts` (R) — `DomaineAlea += 'combat'`
  - `src/brain/dossier/sessionDestinations.ts` (R) — destinations combat
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — instancie `combat`
  - `src/brain/index.ts` (R) — re-export
  - `src/brain/dossier/monstre.ts` (N) — `monstreDeLaReference`
  - `src/brain/dossier/monstre.test.ts` (N)
  - `src/brain/dossier/session.test.ts` (R)
  - `src/brain/dossier/evaluate.test.ts` (R)
  - `src/brain/dossier/commandes.test.ts` (R)
  - `src/brain/dossier/alea.test.ts` (R)
  - `src/brain/dossier/sessionCouverture.test.ts` (R, si rougi)
- **Expose** : voir § 4
- **Critères couverts** : #1, #4 (commandes), #6 (types du rejeu)
- **Porte isolée** : `tsc --noEmit` + `jest brain/` + `moteurSansIA` + `lintIsolation`

### Lot 2 — `feature-combat`
- **Ouvrier** : `dev-lot`
- **But** : le rejeu déterministe, l'écran de combat et le câblage dans play-mode
- **Fichiers** :
  - `src/player/engine/rencontre.ts` (N) — `rejouerCombat`, `bilanDe`, `ouvrirRencontreSiDue`
  - `src/player/engine/rencontre.test.ts` (N)
  - `src/features/play-mode/components/EcranCombat.tsx` (N)
  - `src/features/play-mode/components/EcranCombat.test.tsx` (N)
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — monte EcranCombat
  - `src/features/play-mode/components/EcranPartie.test.tsx` (R)
  - `src/features/play-mode/components/BandeauHeros.tsx` (R) — PV/PE du rejeu
  - `src/features/play-mode/components/BandeauHeros.test.tsx` (R)
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — appelle `ouvrirRencontreSiDue`
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R)
  - `src/features/play-mode/tests/jalonAuJournal.test.tsx` (R) — fixture avec événement-monstre
  - `src/features/play-mode/tests/verrouDeTour.test.tsx` (R) — idem
  - `src/player/engine/combatEngine.test.ts` (R) — sonde D2-bis
  - `docs/REGLES-PLAY.md` (R) — phrase D2-bis (KR-130 : doc avant sonde)
  - `src/player/hooks/useCombat.ts` (D) — orphelin
  - `src/player/components/CombatScreen.tsx` (D) — orphelin
- **Consomme** : lot 1 (`EtatCombat`, `resoudreRencontre`, `jouerPosture`, `cloreCombat`, `evenementARencontrer`, `monstreDeLaReference`, `RefusCommande`, `DomaineAlea`)
- **Expose** :
  ```ts
  // rencontre.ts
  type RejeuCombat = { ok: true; etat: CombatState } | { ok: false; refus: 'monstre_inconnu' | 'heros_absent' }
  function rejouerCombat(s: EtatSession): RejeuCombat
  function bilanDe(e: CombatState): BilanCombat | undefined
  function ouvrirRencontreSiDue(d: Dossier, s: EtatSession): EtatSession
  // EcranCombat.tsx
  function EcranCombat(p: { etat: CombatState; onJouer: (p: Posture) => void; onClore?: () => void }): JSX.Element
  ```
- **Critères couverts** : #2, #3, #4, #5, #6, #7, #8
- **Non touchés** : `combatEngine.ts`, `capacityEffects.ts`, `moteurSansIA.test.ts`, `brain/components/*`

## 6 — Critères d'acceptation

1. **Étant donné** un dossier avec un événement portant `monstre_ref` et `declencheur_expr` vrai au lieu courant, un bestiaire contenant le monstre, et un héros sans combat en cours, **quand** le moteur évalue les événements après une commande acceptée, **alors** `session.combat = {monstre_ref, postures:[]}` et l'événement est ajouté à `evenements_consommes`. — *unitaire* — *lot 1*

2. **Étant donné** un combat en cours, **quand** le joueur choisit la posture Normale et joue le round, **alors** le journal affiche le résultat mécanique en texte mono (attaquant, défenseur, qualité, dégâts) et un en-tête `ROUND {n}`. — *composant* — *lot 2*

3. **Étant donné** un combat dont l'issue est `hero-victory`, **quand** le joueur clique « Continuer », **alors** le combat est retiré de la session, l'XP est crédité via `crediterXp`, les PV/PE sont mis à jour, et un Badge VICTOIRE s'affiche. — *composant + contrat* — *lot 1 + lot 2*

4. **Étant donné** un combat dont l'issue est `hero-mort`, **quand** le dernier round se résout, **alors** `session.combat` reste, aucune commande (aller/agir/parler) n'est acceptée (`combat_en_cours`), un Badge DÉFAITE et « PARTIE TERMINÉE » s'affichent, aucun bouton d'action. — *composant + contrat* — *lot 1 + lot 2*

5. **Étant donné** un combat de N rounds, **quand** le combat se clôt, **alors** `horloge.tour` n'a pas avancé pendant les rounds (un combat = un pas d'horloge, KR-295). — *unitaire* — *lot 2*

6. **Étant donné** un combat clôturé puis la session relue après persistance, **quand** le rejeu depuis `{monstre_ref, postures[]}` est recalculé, **alors** le `CombatState` produit est identique (issue, PV finaux, journal) — *unitaire* — *lot 2*

7. **Étant donné** 2 parades consécutives (héros en Défensive), suivies d'un round où AT héros = AT monstre (assaut nul), puis d'une 3e Défensive, **quand** le compteur de Garde aiguisée est consulté après l'assaut nul, **alors** `consecutiveDefWins` est inchangé (l'assaut nul est transparent pour le compteur). — *unitaire* — *lot 2*

8. **Étant donné** le lot entier livré, **quand** `npm test` exécute `moteurSansIA.test.ts`, **alors** il passe sans modification ni exclusion (KR-250/260). — *bout-en-bout* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `evaluate.test.ts` — evenementARencontrer : 1er événement à monstre_ref, lieu courant, non consommé | `{evenement_id, monstre_ref}` | jest | — | 1 |
| `evaluate.test.ts` — evenementARencontrer : undefined si combat existe | `undefined` | jest | KR-295 | 1 |
| `evaluate.test.ts` — evenementARencontrer : undefined si pas de monstre_ref | `undefined` | jest | — | 1 |
| `evaluate.test.ts` — evenementARencontrer : undefined si événement sans declencheur_expr | `undefined` | jest | — | 1 |
| `session.test.ts` — resoudreRencontre pose combat et consomme l'événement | `session.combat` + `evenements_consommes` | jest | KR-292 | 1 |
| `session.test.ts` — resoudreRencontre no-op si combat existe | même référence | jest | — | 1 |
| `session.test.ts` — jouerPosture ajoute la posture | `postures.length + 1` | jest | KR-292 | 1 |
| `session.test.ts` — cloreCombat victoire : retire combat, crédite XP, PV/PE | session sans `combat` | jest | — | 1 |
| `session.test.ts` — cloreCombat hero-mort : session inchangée | même référence | jest | — | 1 |
| `commandes.test.ts` — combat_en_cours refuse aller/agir/parler | `RefusCommande` | jest | — | 1 |
| `monstre.test.ts` — monstreDeLaReference résout par préfixe + estCleDe | `MonsterConfig` | jest | BUG-053 | 1 |
| `rencontre.test.ts` — rejouerCombat déterministe (2 appels, même résultat) | `CombatState` identique | jest | KR-292 | 2 |
| `rencontre.test.ts` — bilanDe : BilanCombat sur issue terminale, undefined sinon | `BilanCombat \| undefined` | jest | — | 2 |
| `rencontre.test.ts` — ouvrirRencontreSiDue : détection + no-op si rien | `EtatSession` | jest | — | 2 |
| `combatEngine.test.ts` — D2-bis : D·D·nul·D déclenche gardeBonus | `consecutiveDefWins = 3`, bonus = +2 | jest | — | 2 |
| `combatEngine.test.ts` — D2-bis : assaut nul ne progresse pas consecutiveDefWins | compteur inchangé | jest | — | 2 |
| `combatEngine.test.ts` — D2-bis : non-Défensive remet consecutiveDefWins à zéro | compteur = 0 | jest | — | 2 |
| `EcranCombat.test.tsx` — affiche postures, journal, badge | éléments présents | composant | — | 2 |
| `EcranCombat.test.tsx` — état vide du journal : placeholder dashed | texte placeholder visible | composant | — | 2 |
| `EcranCombat.test.tsx` — DÉFAITE : pas de bouton, PARTIE TERMINÉE | texte visible, aucun bouton | composant | — | 2 |
| `moteurSansIA.test.ts` — passe sans modification | vert | bout-en-bout | KR-250/260 | 2 |

**Cas limites couverts** : événement sans declencheur_expr · monstre_ref inconnu · combat déjà en cours · héros absent · journal vide · mort du héros · assaut nul × compteur Garde aiguisée.

**Non vérifiable en l'état** : apparence visuelle exacte des tokens CSS (jsdom ne les résout pas). Capturé à la revue manuelle.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | « Sonde D2-bis » dans le goal | `REJETÉ` | PM veto en domaine : rider, pas la démo. Retirée du goal ; sonde de caractérisation conservée (critère #7). |
| 2 | PM | Correction « manqué » dans it1 | `REPORTÉ` | capacityEffects.ts hors du lot. Déclencheur non armé (KR-294). → itération qui rouvre ce fichier. |
| 3 | PM vs TL | 4 lots vs 2 lots | `RETENU` (2) | PM cède : lot D2-bis (rider) et lot moteur (pas de parallélisme avec l'écran). |
| 4 | UX | Extension IconButton (wide) | `REJETÉ` | TL : `wide` fait d'IconButton un autre composant (aria-label = title). Bouton local dans EcranCombat sur tokens. |
| 5 | UX | Extension SegmentedControl (flèches) | `REPORTÉ` | TL : tabindex itinérant change 23 appelants (non additif). → lot qui rouvre le primitif. |
| 6 | UX | IconButton.tsx:49 fontSize '11px' en dur | `REPORTÉ` | Fichier hors des deux lots. Dette préexistante. |
| 7 | QA | pending* log mensonger | `RETENU` | Résolu par PM : fixtures sans capacités pending*. Nommé au hors-périmètre. |
| 8 | QA | Sonde D2-bis imprécise | `RETENU` | Deux critères AT écrits (critère #7). Doc dans REGLES-PLAY d'abord (KR-130), lot 2. |

## 9 — Innovation

Aucune.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Orphelins (`useCombat.ts`, `CombatScreen.tsx`) supprimés, aucune référence pendante
- [ ] Phrase D2-bis écrite dans `docs/REGLES-PLAY.md` AVANT la sonde (KR-130)
- [ ] `moteurSansIA.test.ts` vert sans modification ni exclusion
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-combat-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | Approuvé | « Sonde D2-bis » retirée du goal, « manqué » reporté |
| Tech Lead | Approuvé | — |
| UX | Approuvé | Vouvoiement + état vide retenus ; bouton local accepté |
| QA | Approuvé | Deux critères D2-bis écrits (#7) ; fixtures sans pending* |
| Narratif & IA | Approuvé | Lot contrat posé ; consommation à l'ouverture retenue |
