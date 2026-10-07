# Plan d'itération — `moteur-fins` · itération `3`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-07
> Composition : `5 rôles` — motif : itération moteur (combat, mort du héros, garde R5)
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur dont le héros tombe à zéro PV arrive sur un écran de mort, au texte du moteur, d'où il repart en nouvelle partie. » |
| **Tranche** | `PartieEnCours` (branche hero-mort inline) → `EcranMort` (écran neuf) + `JournalLigneRound` (extrait) → persistance inchangée |
| **Lots** | 1 lot · dont `contrat` : non (brain/ intact) |
| **Hors périmètre** | `mort_confirmee` (KR-013), refus dans illisible, ligne de journal en session, Rejouer/graine (it4), section REGLES-DU-JEU.md, carnet d'indices sur écrans terminaux, composant partagé SortiePartie |
| **Reporté** | Refus dans illisible → dette à déclencheur « reprise.ts rouvert ». Ligne de journal → REJETÉ (cloreCombat identité). Bouton EcranFin → inclus dans le lot (prop optionnelle). |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur dont le héros tombe à zéro PV arrive sur un écran de mort — texte constant du moteur, journal des rounds, bandeau — d'où il repart en nouvelle partie. »

## 2 — Hors périmètre

- `mort_confirmee` ou tout champ dérivé stocké en session (KR-013, veto PM+TL)
- Toute modification de `cloreCombat(hero-mort)` — décision close, rend la session à l'identique
- Toute modification de `brain/` — un seul lot, feature, pas de lot contrat
- « Refus dans illisible » (lot contrat seul, aucun lecteur auteur, REPORTÉ → dette à déclencheur « reprise.ts rouvert »)
- « Ligne de journal de mort » (écriture en session = modification du contrat, REJETÉ)
- Section dédiée dans `docs/REGLES-DU-JEU.md` (copy UI, pas une mécanique ; KR-130 déjà satisfait l.38 « Game Over → écran mort »)
- Composant partagé `SortiePartie` (abstraction prématurée, un bouton suffit)
- Carnet d'indices sur les écrans terminaux (absent, comme EcranFin)
- Rejouer/graine (it4)
- Score de mutation (aucun des 4 fichiers de règles touché)

## 3 — Contrat de design

**Composant : `EcranMort.tsx`** (~60 lignes). Props : `{ nom: string; log: ReadonlyArray<CombatLogEntry>; onNouvellePartie: () => void }`.

Structure (dans `CadrePartie`, bandeau = `BandeauHeros` avec pvLive du rejeu, sans actionsEntete) :

1. `<section aria-label="Mort du héros">` — flex column, gap `--space-9`, maxWidth `480px` (comme EcranRefus/EcranReprise), centré.
2. `<h2>` « MORT · {nom} ». Fallback si nom vide : « Héros sans nom ». Tokens : `--font-ui`, `--fs-h2`, `--fw-semibold`, `--track-tight`, `--text-strong` (KR-308, jamais `--bad`).
3. `<Badge tone="muted">` « PARTIE TERMINÉE ».
4. Glyphe ⚔ (`aria-hidden`), `--fs-h1`, `--text-faint`.
5. `<OutcomeBlock>` portant l'en-tête « MORT DU HÉROS — texte du moteur » et le corps `TEXTE_MORT_HEROS`. Tokens : `--text-strong`, `--fs-row`, `--lh-loose`.
6. Journal des rounds (`JournalLigneRound` × `log.length`), `role="log"` — en lecture seule, même rendu qu'EcranCombat.
7. Bouton `boutonPrimaire` « ↻ Nouvelle partie ». Tokens : `--accent`, `--text-on-accent`, `--hit-target`, `--r-md`. Focus automatique (`autoFocus`).
8. Aide sous le bouton : « La partie est terminée. Le dossier n'est pas modifié. » — `--text-muted`, `--lh-body`.

**Texte exact de `TEXTE_MORT_HEROS`** : « Vos forces vous quittent. Le combat est perdu : votre aventure s'arrête ici. » (2e personne, présent, factuel, sans chiffre — validé NIA).

**Composant extrait : `JournalLigneRound.tsx`** (extrait d'EcranCombat, deux appelants). Props : `{ round: number; texte: string; commentaire?: CommentaireRound }`. Même rendu qu'aujourd'hui dans EcranCombat.

**Modification : `EcranFin.tsx`** — prop optionnelle `onNouvellePartie?: () => void`. Si définie, bouton `boutonPrimaire` « ↻ Nouvelle partie » sous OutcomeBlock, même style qu'EcranMort.

**États** : défaut (bouton focalisé). Survol (bouton standard). Vide : impossible (texte constant).

**Clavier** : Entrée active le bouton. Tab suit l'ordre visuel.

**Aucune occurrence** de `--bad` ou `--good` sur cet écran (KR-308).

## 4 — Contrats `brain/` touchés

Aucun. `src/brain/` n'est pas modifié.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | Aucun — la mort est 100 % moteur, 0 % modèle |
| Schéma de sortie | Sans objet |
| Échec de validation | Sans objet |
| Ce que l'IA **ne** fait **pas** | R5 (commentateur) est gardé par `handleJouer` : `if (rejeu.etat.outcome === 'hero-mort') return` avant l'appel à `commenter`. Coupe volontaire : le moteur seul parle de la mort. R3/R4 déjà gardés (it1, via useTourDeJeu). R1 non concerné (aucune commande acceptée après hero-mort). `MOT_ISSUE['hero-mort']` dans commentateur.ts existe pour les rounds non létaux — design, pas dette. |

## 5 — Lots

### Lot 1 — `mort-ecran` (feature)
- **Ouvrier** : `dev-lot`
- **But** : écran de mort du héros, garde R5, routage complet
- **Fichiers** :
  - `src/features/play-mode/components/EcranMort.tsx` (N)
  - `src/features/play-mode/components/EcranMort.test.tsx` (N)
  - `src/features/play-mode/components/JournalLigneRound.tsx` (N — extrait d'EcranCombat)
  - `src/features/play-mode/tests/mortDuHeros.test.tsx` (N)
  - `src/features/play-mode/components/PartieEnCours.tsx` (R)
  - `src/features/play-mode/components/AiguillagePartie.tsx` (R)
  - `src/features/play-mode/components/CombatEnCours.tsx` (R)
  - `src/features/play-mode/components/CombatEnCours.test.tsx` (R)
  - `src/features/play-mode/components/EcranCombat.tsx` (R)
  - `src/features/play-mode/components/EcranCombat.test.tsx` (R)
  - `src/features/play-mode/components/EcranFin.tsx` (R)
  - `src/features/play-mode/components/EcranFin.test.tsx` (R)
  - `src/features/play-mode/tests/reprise.test.tsx` (R)
- **Expose** :
  ```ts
  // EcranMort.tsx
  export const TEXTE_MORT_HEROS: string
  export interface EcranMortProps {
    readonly nom: string
    readonly log: ReadonlyArray<CombatLogEntry>
    readonly onNouvellePartie: () => void
  }
  export function EcranMort(props: EcranMortProps): JSX.Element

  // JournalLigneRound.tsx
  export interface JournalLigneRoundProps {
    readonly round: number
    readonly texte: string
    readonly commentaire?: CommentaireRound
  }
  export function JournalLigneRound(props: JournalLigneRoundProps): JSX.Element

  // EcranFin.tsx (ajout)
  EcranFinProps += readonly onNouvellePartie?: () => void
  ```
- **Consomme** : `rejouerCombat` (player/engine), `CombatLogEntry` (player/engine/combatTypes), `boutonPrimaire` (brain/components)
- **Critères couverts** : #1–#7

## 6 — Critères d'acceptation

1. **Étant donné** une session avec un combat dont `rejouerCombat` rend `outcome === 'hero-mort'` **quand** PartieEnCours calcule la branche de rendu **alors** EcranMort s'affiche à la place de CombatEnCours. La détection est inline (`combatRejeu?.outcome === 'hero-mort'`), aucun champ stocké. — *niveau : composant* — *lot 1*

2. **Étant donné** EcranMort affiché **quand** l'auteur le lit **alors** il voit : h2 « MORT · {nom} » en `--text-strong`, Badge muted « PARTIE TERMINÉE », glyphe ⚔, OutcomeBlock avec `TEXTE_MORT_HEROS`, journal des rounds (JournalLigneRound), bouton « ↻ Nouvelle partie » focalisé, aide sous le bouton. maxWidth 480. Aucune occurrence de `--bad` ni `--good`. — *niveau : composant* — *lot 1*

3. **Étant donné** EcranMort affiché **quand** l'auteur clique « ↻ Nouvelle partie » **alors** une nouvelle session démarre, sans dialogue de confirmation (la partie est terminée, non reprenable). — *niveau : bout-en-bout* — *lot 1*

4. **Étant donné** EcranFin affiché avec `onNouvellePartie` défini **quand** l'auteur clique « ↻ Nouvelle partie » **alors** même comportement qu'EcranMort (nouvelle session, sans dialogue). Si `onNouvellePartie` n'est pas défini, le bouton n'est pas rendu (rétrocompatibilité). — *niveau : composant* — *lot 1*

5. **Étant donné** un combat en cours dans CombatEnCours **quand** le rejeu rend `outcome === 'hero-mort'` **alors** `commenter` (R5) n'est PAS appelé. La garde est dans `handleJouer`, avant l'appel à `commenter`. Le test existant « demande un commentaire R5 » reste vert (la garde n'est pas aveugle). — *niveau : unitaire* — *lot 1*

6. **Étant donné** EcranCombat **quand** l'itération est livrée **alors** la branche `isDead` (focus conditionnel, handleClose conditionnel, bloc « PARTIE TERMINÉE ») est supprimée, ainsi que ses deux tests. `OUTCOME_LABELS['hero-mort']` reste (Record exhaustif). — *niveau : unitaire* — *lot 1*

7. **Étant donné** une session sauvegardée avec `reprenable` et un combat `hero-mort` **quand** l'auteur recharge la page **alors** AiguillagePartie route vers une ouverture directe (nouvelle partie), comme le fait déjà la fin. Pas de retour à l'écran de mort. — *niveau : bout-en-bout* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `EcranMort.test.tsx` — « affiche TEXTE_MORT_HEROS en text-strong » | TEXTE_MORT_HEROS visible, pas de `--bad` | composant | KR-308 | 1 |
| `EcranMort.test.tsx` — « affiche h2 MORT · nom du héros » | h2 avec nom | composant | — | 1 |
| `EcranMort.test.tsx` — « affiche le journal des rounds » | JournalLigneRound rendu × N | composant | — | 1 |
| `EcranMort.test.tsx` — « bouton Nouvelle partie focalisé » | bouton autoFocus | composant | — | 1 |
| `EcranMort.test.tsx` — « bandeau avec pvLive du rejeu » | BandeauHeros rendu | composant | — | 1 |
| `CombatEnCours.test.tsx` — « R5 non appelé quand hero-mort » | `mockDemander` non appelé quand `outcome === 'hero-mort'` | unitaire | KR-303 | 1 |
| `CombatEnCours.test.tsx` — « R5 appelé quand combat non létal » | test existant reste vert | unitaire | KR-303 | 1 |
| `mortDuHeros.test.tsx` — « session hero-mort → EcranMort → Nouvelle partie » | parcours bout-en-bout | intégration | KR-013 | 1 |
| `mortDuHeros.test.tsx` — « pas de champ mort_confirmee en session » | session inchangée par cloreCombat | intégration | KR-013 | 1 |
| `reprise.test.tsx` — « reprise reprenable + hero-mort → ouverture directe » | AiguillagePartie route vers nouvelle partie | intégration | — | 1 |
| `EcranFin.test.tsx` — « bouton Nouvelle partie si onNouvellePartie défini » | bouton rendu | composant | — | 1 |
| `EcranFin.test.tsx` — « pas de bouton si onNouvellePartie absent » | bouton absent | composant | — | 1 |

**Non vérifiable en l'état** : le bandeau BandeauHeros avec pvLive négatif (comportement hérité d'it2, couvert par BandeauHeros.test.tsx, pas re-testé ici).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM+TL | `mort_confirmee` est un champ dérivé stocké (KR-013) | `RETENU` | Veto unanime. Détection inline par `rejouerCombat`. |
| 2 | PM+TL | Refus dans illisible hors it3 | `REPORTÉ` | Lot contrat seul, aucun lecteur. Déclencheur : « reprise.ts rouvert ». |
| 3 | TL | Ligne de journal de mort | `REJETÉ` | Écriture en session = modification contrat. cloreCombat(hero-mort) = identité, décision close. |
| 4 | NIA+TL+PM+QA | CA R5 « garde dans useTourDeJeu » faux | `RETENU` | Corrigé : « garde dans CombatEnCours.handleJouer ». R5 part de CombatEnCours via useCommentaireCombat, pas de useTourDeJeu. |
| 5 | TL vs NIA | TEXTE_MORT_HEROS : feature/ vs brain/ | `RETENU feature/` | NIA cède après lecture d'EXIGENCE. Un seul lecteur, aucune fonction brain/ n'émet. Migration vers player/ = un import. |
| 6 | PM vs UX+TL | Bouton « Nouvelle partie » sur EcranFin | `RETENU` | Prop optionnelle, coût minimal. Consistance des écrans terminaux. |
| 7 | QA | Veto REGLES-DU-JEU.md pour le texte de mort | `REJETÉ` | Veto requalifié en objection (hors domaine QA : KR-130 = mécaniques ; PV ≤ 0 = mort est l.38 de REGLES-DU-JEU.md). TEXTE_MORT_HEROS est du copy UI, pas une mécanique. Pointeur dans REGLES-PLAY.md § A5. |
| 8 | PM vs TL | AiguillagePartie ouverture directe en it3 | `RETENU` | ~4 lignes inline, consistance avec le comportement fin. Deux chemins pour « partie terminée » sinon. |
| 9 | UX | SortiePartie composant partagé | `REJETÉ` | Abstraction prématurée. Un boutonPrimaire avec une prop suffit. |
| 10 | UX+PM | Carnet d'indices sur EcranMort | `REJETÉ` | Absent, comme EcranFin. Retour anticipé, pas d'actionsEntete. |
| 11 | UX | Log de combat reporté hors it3 | `REJETÉ` | PM+TL convergent : le round létal lisible est une valeur produit. JournalLigneRound extrait. |
| 12 | PM | R5 est une coupe volontaire, pas un oubli | `RETENU` | Nommé dans le contrat IA : le moteur seul parle de la mort. MOT_ISSUE['hero-mort'] = design pour rounds non létaux. |
| 13 | TL | Refus code mort = combat_en_cours, pas partie_terminee | `RETENU` | CA spec corrigé (commandes.ts:136-138). |
| 14 | TL (annexe tour 1) | EcranMortProps reçoit `nom: string`, pas `HeroState` | `RETENU` | Ségrégation d'interface, miroir d'EcranFin. |

## 9 — Innovation

*(Aucune proposition INNOVATION retenue.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-fins-it3.revue.md`
- [ ] Pointeur ajouté dans `docs/REGLES-PLAY.md` § A5 nommant la constante

*(Score de mutation non requis — aucun des 4 fichiers de règles touché.)*

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | Recevable | Bouton EcranFin retirée → RETENU par l'arbitrage ; log combat maintenu |
| Tech Lead | Recevable | mort_confirmee durcie en veto → RETENU ; AiguillagePartie maintenu |
| UX | Recevable sous réserve | En-tête h2 obligatoire → CA #2 ; isDead retiré → CA #6 |
| QA | Recevable sous réserve | Veto REGLES-DU-JEU.md → requalifié, REJETÉ ; pointeur REGLES-PLAY.md ajouté |
| Narratif & IA | Recevable | TEXTE_MORT_HEROS cédé feature/ ; CA R5 corrigé |
