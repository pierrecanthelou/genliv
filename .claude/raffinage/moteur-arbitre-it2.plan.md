# Plan d'itération — `moteur-arbitre` · itération 2

> Statut : `validé` (2026-10-01)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-01
> Composition : `5 rôles` — motif : l'itération touche le moteur IA (nouveau rôle R2 « arbitre »), le dossier d'aventure (audience des contextes injectés) et le mode jeu (orchestration R1→R2→résolution→R3).
> Exécution : `séquentielle` (2 lots — lot `contrat` seul et en premier, puis lot `feature`)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut voir le moteur trancher et raconter le jet qu'il vient de demander à l'IA, sans jamais que R2 connaisse la fiche du héros ni que le joueur connaisse l'issue avant d'avoir cliqué sur Lancer. » *(un seul geste démontrable — « routage + résolution + récit » est UNE tranche, KR-263/266, décision actée au cadrage et confirmée à l'unanimité du comité ; cf. § 8 #1)* |
| **Tranche** | geste `agir` (console ou saisie libre) → `useTourDeJeu` → R2 (`CopiloteService`) → `CarteJet` (clic « Lancer ») → `issueDuJet`/`resolveChallenge` (pur) → `consignerJet` (persistance) → R3 (narration) |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | amorce à 4 valeurs et XP (it3), boutique/XP, combat, reprise de session, « Laisser/Passer », marge affichée, dés affichés un par un, REGLES §1 (piège −1 PE), prédicat anti-tutoiement |
| **Reporté** | aucun — tous les désaccords ouverts au tour 2 sont tranchés ci-dessous (§ 8) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut voir le moteur lancer le dé que l'IA a demandé et en raconter le résultat : un geste `agir` avec un héros existant déclenche R2 (arbitre, 9ᵉ rôle de `CopiloteService`) — jamais `aller`, jamais gaté par le contenu de `dangers` — qui ne voit jamais la fiche du héros ni la saisie ne lui préjuge l'issue ; le joueur voit la carte, clique « Lancer », `issueDuJet` (seul appelant de `resolveChallenge` dans tout le dépôt) résout avec un rng dérivé de `graine_alea`, et R3 narre l'issue en amorce qualitative binaire (réussit/échoue) — jamais les chiffres. `{carac, tc}` entre au rejeu ; marge, issue et `lieu_id` restent dérivés, jamais stockés.

*(Reformulation actée § 8 #2 : la phrase du cadrage — « sans jamais connaître par avance le seuil ni la marge » — était factuellement fausse pour le joueur, qui connaît déjà ses propres caractéristiques depuis l'écran de création. L'invariant réel protégé est double : R2 ne connaît jamais les caractéristiques du héros ; le joueur ne connaît jamais l'ISSUE avant d'avoir cliqué.)*

## 2 — Hors périmètre

- Amorce à 4 valeurs (réussit nettement / de justesse / échoue nettement / de justesse) — it3, nécessite `MARGE_FRANCHE` (extraction depuis `xp.ts`), structurellement impossible en it2.
- XP, `challengeXp`/`deltaBand` — it3.
- Boutique de progression (dépense XP) — question d'accès non tranchée, hors périmètre de toute la feature (cadrage).
- `combat.ts`/`combatEngine.ts` — n° 13, pas n° 11 (incohérence du roadmap relevée, hors périmètre de correction ici).
- Reprise de session (`useSessionPersistee` ne fait qu'écrire) — un rechargement de page pendant une carte affichée contourne la relance unique ; propriétaire futur.
- « Laisser/Passer » un jet (REGLES-PLAY §B1-bis) — repose sur un indicateur `optional` que le dossier n'a pas aujourd'hui.
- Marge affichée sur la carte ou dans l'amorce — réservée it3 (même seuil que `challengeXp`).
- Dés affichés un par un (`d1 + d2 vs …`) — `ChallengeResult` n'expose que le total ; les décomposer romprait sur TC3/TC4 (3-4 dés) et appartient à `challenge.ts` (propriété it3).
- REGLES-DU-JEU §1 (« subir un piège = −1 PE ») — aucun jet de piège mécanique dans les 3 itérations planifiées de cette feature ; hors périmètre de toute la feature, pas seulement d'it2.
- Prédicat anti-tutoiement sur la sortie R2 — retiré (§ 8 #9) : aucun rôle frère n'a de garde de registre validée, et le `\b` ASCII de JS produit des faux positifs (« tête », « vêtu ») qui feraient tomber des jets valides en échec.
- `AGIR` tapé dans la console — n'est jamais arbitré (la console reste le canal sans IA, KR-260).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Composants.** `Card` (`brain/components/Card.tsx`), étendu d'un prop `shadow?: boolean` (défaut `true`, zéro régression) — `<Card shadow={false}>` pour `CarteJet`, padding au défaut du composant. `CardHead` n'existe pas dans ce dépôt → recomposé localement (eyebrow + title, précédent `dossier-copilote`). `Badge` (`brain/components/Badge.tsx`) tel quel, `tone="good"`/`"bad"` uniquement. Bouton « Lancer le dé → » : patron `boutonTenter` accent plein de `PlayerInputBar.tsx` (min-height `--hit-target`). Aucun `OutcomeBlock` propre à cette carte — le récit de R3 reste sur le canal RÉCIT déjà câblé (`PlayerInputBar`/journal, n°10).

**États (6, textes exacts) :**

| État | Déclencheur | Rendu | Texte |
|---|---|---|---|
| 1. Attente de R2 | `agir` soumis, héros présent, avant réponse | Aucune `CarteJet` ne monte. Verrou de tour (KR-265) désactive `PlayerInputBar`, bouton `« … »` opacity 0.5, aucun nouvel indicateur. | réutilise le libellé de verrou existant |
| 2. R2 rend `{sans_epreuve:true}`, OU schéma non conforme (dégradé après rejeu unique), OU R2 indisponible | n'importe laquelle des trois causes | **Identique dans les trois cas** (§ 8 #8) : aucune `CarteJet` ne monte, aucune bannière dédiée, le flux continue directement vers R3 via le canal RÉCIT existant — zéro différence visuelle avec le comportement d'avant cette itération. Si R3 échoue ENSUITE, sa bannière `EchecCopilote` existante (déjà câblée, n°10) s'affiche normalement — pas une nouveauté de cette itération. | — |
| 3. Avant lancer | `{epreuve:{carac,tc,enjeu_reussite,enjeu_echec}}` reçu | `Card shadow={false}` + eyebrow mono majuscules = `CHARACTERISTICS[carac].label` (ex. « FORCE ») + title mono = `` `${CHALLENGE_TIERS[tc].notation} — ${CHALLENGE_TIERS[tc].difficulty}` `` (ex. « 2D5 — Dur », **jamais** la valeur de caractéristique, **jamais** « Seuil {tc} » — le TC n'est pas le seuil sous REGLES §2) + deux lignes mono `SI RÉUSSITE`/`SI ÉCHEC` + `enjeu_reussite`/`enjeu_echec` verbatim (prose joueur, `white-space: pre-wrap`, registre infinitif — § 8 #10) + bouton accent « Lancer le dé → » | `SI RÉUSSITE` / `SI ÉCHEC` |
| 4. Pendant résolution | clic sur « Lancer » | bouton désactivé, `opacity: 0.5`, `cursor: not-allowed`, label `…` (patron `boutonVerrou`) | `…` |
| 5. Après résolution | `issueDuJet` a rendu `{roll, success, margin}` | le `title` de l'état 3 reste affiché, inchangé ; ligne mono `` `${roll} vs ${characteristicValue}` `` (ex. « 7 vs 9 » — **jamais** `d1+d2`, **jamais** `tc` comme comparant) + `Badge tone={success?'good':'bad'}` texte `RÉUSSITE`/`ÉCHEC`. Pas de marge affichée en it2. | `RÉUSSITE` / `ÉCHEC` |

**Clavier.** Au montage de l'état 3, focus programmatique sur `Card` (`tabIndex={0}`, précédent `EcranCreationHeros.tsx`). `Enter` sur la carte focusée = clic « Lancer » (états 3→4 uniquement). États 4-5 : focus reste sur la carte. À la fin de l'état 5, quand le récit de R3 est posté dans `session.journal`, le focus revient au champ de `PlayerInputBar` (nécessite un `ref` exposé par `PlayerInputBar`, appelé explicitement à la transition `issueNarrateur.statut === 'raconte'` — ni `autoFocus` ni le verrou ne le font automatiquement).

**Registre de langue.** Eyebrow/title/`SI RÉUSSITE`/`SI ÉCHEC`/ligne de résultat/Badge : INTERFACE, mono, majuscules pour les libellés fixes. `enjeu_reussite`/`enjeu_echec` : FICTION, **à l'infinitif** (§ 8 #10 — pas de « vous », l'enjeu advenu est spliced dans `CE PAS` écrit à la 3ᵉ personne, KR-269 ; un fragment au vouvoiement y casserait le bloc).

**Règle ESLint proposée** (hors lot, note pour une itération d'outillage) : interdire tout `boxShadow` littéral dans `src/features/**` — seul `brain/components/` a le droit d'écrire une ombre.

*(Écrit par l'UX, amendé narratif-ia/tech-lead sur le seuil REGLES §2.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander` (9ᵉ branche) | service | émet (réseau) | `demander(dossier: Dossier, cible: CibleArbitre, signal?: AbortSignal): Promise<ReponseArbitre>` |
| `CibleArbitre` | type | provides | `{ role: 'arbitre'; saisie: string; lieuId: string }` — **jamais** `session` (héros/mémoire inatteignables par compilation) |
| `ReponseArbitre`/`PropositionEpreuve` | type | provides | `{statut:'propose', proposition: {epreuve:{carac:Characteristic, tc:ChallengeTier, enjeu_reussite:string, enjeu_echec:string}} \| {sans_epreuve:true}} \| EchecCopilote` |
| `DomaineAlea` | registre | provides | élargi `'heros'` → `'heros' \| 'jet'` |
| `EntreeJournal.jet?` | type | provides | `{ readonly carac: Characteristic; readonly tc: ChallengeTier }` — **sans** `lieu_id` (§ 8 #4) |
| `consignerJet` | fonction | provides | `consignerJet(session: EtatSession, tour: number, jet: {carac: Characteristic; tc: ChallengeTier}): EtatSession` — seule porte d'écriture de `EntreeJournal.jet` |
| `doitArbitrer` | fonction pure | provides | `doitArbitrer(commande: Commande, session: EtatSession): boolean` — vrai ssi `commande.commande === 'agir' && session.heros !== undefined`, jamais sur `dangers` |
| `issueDuJet` | fonction pure | provides | `issueDuJet(session: EtatSession, tour: number): ChallengeResult \| undefined` — **seul appelant de `resolveChallenge`** dans tout le dépôt (§ 8 #5) ; lu par `CarteJet`, l'assembleur R3, et (it3) le calcul d'XP |
| `Card.shadow` | prop composant | provides | `interface CardProps { …existant…; shadow?: boolean }` défaut `true` |
| `worker INVITES['arbitre']`/`GABARIT_SORTIE['arbitre']` | registre | provides | 9ᵉ entrée, checklist KR-233 inchangée |
| `CopiloteService.demander('narrateur', …)` | service | consomme | amendé pour recevoir la classification qualitative du jet en contexte |
| `resolveChallenge`/`CHALLENGE_TIERS` (`challenge.ts`) | service | consomme | Temps 1, pur, inchangé |
| `CHARACTERISTICS`/`HeroStats`/`maxPV` (`characteristics.ts`) | service | consomme | Temps 1, pur, inchangé |

## 4 bis — Contrat de sortie IA (R2, rôle `arbitre`)

| | |
|---|---|
| Contexte injecté | `canon.ton`/`interdits_ton` (si écrits) ; `monde.lieux[].description` (requis) + `dangers` (optionnel, aucune ligne si absent) ; `CATALOGUE` dérivé de `CHARACTERISTICS` (8 lignes `FO — Force : …`) et `CHALLENGE_TIERS` (4 lignes `TC2 — Dur`), **jamais les notations de dés ni `baseXp`** ; la saisie du joueur, normalisée, en dernier. **Jamais** `heros.*`, **jamais** la mémoire, **jamais** un identifiant d'entité. |
| Schéma de sortie | `{epreuve:{carac,tc,enjeu_reussite,enjeu_echec}} \| {sans_epreuve:true}` — `carac`/`tc` constatés par appartenance aux registres fermés (jamais recopiés verbatim) ; enjeux non vides après `trim`, sans `\n`, bornés (`ENJEU_CARACTERES_MAX`, à caler avec l'UX), `enjeu_reussite ≠ enjeu_echec` ; aucun `MARQUEUR_A_ECRIRE` ; aucun identifiant, aucun chiffre `[0-9]` dans la prose |
| Échec de validation | refus de contexte (`cible-a-ecrire`, `trop-long`) → zéro `fetch`, `sans_epreuve`. `non-configure`/`indisponible` → `sans_epreuve`, sans rejeu. Sortie `illisible` → rejeu **exactement une fois** (`jusquAuRejeuUnique`, générique, inchangé), puis `sans_epreuve`. Dans tous les cas : aucune `CarteJet`, aucune entrée de jet écrite, aucun tirage consommé, aucun jet inventé par le code. |
| Ce que l'IA **ne** fait **pas** | ne lance jamais les dés (`issueDuJet` seul appelle `resolveChallenge`) ; ne voit jamais la fiche du héros (le code lit `heros.caracs[carac]` APRÈS que R2 a choisi `{carac,tc}` à l'aveugle) ; ne calcule jamais l'XP ; ne reçoit jamais les chiffres du jet résolu (R3 reçoit une amorce qualitative déjà classée) |

L'invite `INVITES['arbitre']` (worker) écrit les enjeux à l'infinitif (constante `TENTATIONS` partagée avec `INVITES['narrateur']`, § 8 #10) et ne récite jamais les clés/labels des deux registres (liste balayée par `worker/index.test.ts`, dérivée de `CHARACTERISTICS`/`CHALLENGE_TIERS`, précédent KR-270).

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-arbitre` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser le 9ᵉ rôle `arbitre` de bout en bout côté `brain/`+`worker/` — contrat réseau, validation, aléa keyé `'jet'`, journal, gate pur, résolution unique, route worker.
- **Fichiers** :
  - R `src/brain/CopiloteService.ts` — 9ᵉ branche `CibleArbitre`/`ReponseArbitre`, garde `never` étendue
  - R `src/brain/copilote/contexte/arbitre.ts` — `assemblerArbitre(dossier, cible)` (N si absent)
  - R `src/brain/copilote/contexte/narrateur.ts` — classification qualitative du jet via `issueDuJet`, jamais un second appel à `resolveChallenge`
  - R `src/brain/copilote/contexte/index.ts` — barrel
  - R `src/brain/copilote/schemaSortie.ts` — `validerArbitre`
  - R `src/brain/copilote/types.ts` — `CibleArbitre`/`ReponseArbitre`/`PropositionEpreuve`
  - R `src/brain/dossier/alea.ts` — `DomaineAlea` élargi à `'jet'`
  - R `src/brain/dossier/session.ts` — `EntreeJournal.jet?: {carac, tc}` (sans `lieu_id`) + `consignerJet`
  - N `src/brain/dossier/arbitre.ts` — `doitArbitrer`, `issueDuJet`, classification `reussit`/`echoue`
  - N `src/brain/dossier/arbitre.test.ts` — `aller` jamais R2 ; `agir` sans héros jamais R2 ; `agir`+héros+`dangers` absent appelle quand même R2 ; `issueDuJet` déterministe ; aucune occurrence de `resolveChallenge` sous `src/features/**`
  - R `src/brain/components/Card.tsx` — prop `shadow?: boolean`
  - R `src/brain/index.ts` — barrel
  - R `worker/index.ts` — `INVITES['arbitre']`/`GABARIT_SORTIE['arbitre']` (9ᵉ entrée) + `INVITES['narrateur']` amendé + constante `TENTATIONS`
  - R `worker/index.test.ts`, `worker/frontiere.test.ts` — parité de route, scanner de mots interdits (rangs C/D disjoints des scanners A/P/G existants)
  - R `src/brain/copilote/schemaSortie.test.ts`, `src/brain/dossier/alea.test.ts`, `src/brain/dossier/session.test.ts`
  - N `src/brain/copilote/contexte/arbitre.test.ts`
  - R `src/brain/copilote/contexte.test.ts` — invariance héros + catalogue stable
  - R `src/brain/CopiloteService.test.ts` — `toEqual` strict sur `CorpsDemande.contexte`
- **Expose / consomme** : signatures figées § 4
- **Critères couverts** : #1, #2, #3, #5, #6

### Lot 2 — `jet-joue` `feature`
- **Ouvrier** : `dev-lot`, démarre une fois le lot 1 figé (séquentiel, pas de parallélisme — un seul consommateur réel de `carteJet`/`lancerLeDe`)
- **But** : orchestrer R1→exécution→R2→attente du clic→résolution→R3 dans `useTourDeJeu`, et afficher la carte.
- **Fichiers** :
  - R `src/features/play-mode/hooks/useTourDeJeu.ts` — appelle R2 après persistance de R1 si `doitArbitrer`, range la proposition dans un `useState` local `carteJet` (**jamais** `session.attente`) ; `lancerLeDe()` : `consignerJet` → persiste → `issueDuJet` (résultat posé sur `carteJet.resultat`) → R3 → vide `carteJet`. Verrou de tour étendu à toute la chaîne (KR-265).
  - N `src/features/play-mode/components/CarteJet.tsx` — composant pur, `carteJet` + `onLancer` en props, `<Card shadow={false}>`, aucun import `CopiloteService`
  - R `src/features/play-mode/components/EcranPartie.tsx` — montage conditionnel inline (KR-013)
  - R `src/features/play-mode/hooks/useTourDeJeu.test.ts` — + cas `{sans_epreuve:true}` : aucune `CarteJet`, R3 immédiat, session avance sans `EntreeJournal.jet`
  - N `src/features/play-mode/components/CarteJet.test.tsx`
  - R `src/features/play-mode/components/EcranPartie.test.tsx` — régression
- **Expose / consomme** :
  ```ts
  interface UseTourDeJeuResult {
    // …champs existants (executeAction, getGestelabel, avis, isLocked, issueNarrateur, pasEnCours)
    readonly carteJet: {
      carac: Characteristic
      tc: ChallengeTier
      enjeuReussite: string
      enjeuEchec: string
      resultat?: { roll: number; success: boolean; characteristicValue: number }
    } | null
    readonly lancerLeDe: () => Promise<void>
  }
  ```
- **Critères couverts** : #1, #4, #6

*(2 lots.)*

## 6 — Critères d'acceptation

1. **Étant donné** une commande `agir` acceptée avec un héros présent sur un lieu, **quand** elle est exécutée, **alors** le code appelle R2 (`{role:'arbitre', saisie, lieuId}`, jamais `session`) — jamais sur `aller`, jamais sans héros, et même si `dangers` est absent. *niveau : unitaire (`arbitre.test.ts`) + composant (`useTourDeJeu.test.ts`)* — *lot 1 + lot 2*
2. **Étant donné** un contexte assemblé pour R2, **quand** `CopiloteService.demander` est invoqué, **alors** le corps réseau contient uniquement description + `dangers` optionnel + `canon.ton`/`interdits_ton` optionnels + catalogue dérivé des registres + saisie normalisée — jamais `heros.*`, jamais la mémoire, jamais un identifiant. *niveau : contrat (`CopiloteService.test.ts` : `toEqual` strict) + invariance (`copilote/contexte.test.ts`)* — *lot 1*
3. **Étant donné** une réponse R2 `{epreuve:{carac,tc,enjeu_reussite,enjeu_echec}}`, **quand** le joueur clique « Lancer », **alors** `issueDuJet` (seul appelant de `resolveChallenge` dans tout le dépôt) résout avec `creerRng(graine_alea,'jet',horloge.tour)` — le même tirage rejoue à l'identique depuis la même graine. *niveau : unitaire (déterminisme) + balayage de fichiers (précédent `moteurSansIA.test.ts`)* — *lot 1 + lot 2*
4. **Étant donné** un jet résolu, **quand** R3 narre le pas, **alors** il reçoit une amorce qualitative binaire (réussit/échoue) classée par `issueDuJet`, enjeux à l'infinitif — jamais les chiffres, jamais `carac`/`tc`/marge — ajoutée en une seule ligne au bloc `CE PAS` existant. *niveau : contrat (`copilote/contexte.test.ts` : deux héros de même issue → texte identique ; deux issues différentes → seule la ligne d'amorce change) + composant* — *lot 1 + lot 2*
5. **Étant donné** un jet résolu, **quand** le journal est écrit, **alors** `{carac, tc}` entre comme entrée du REJEU via `consignerJet` — jamais `lieu_id` (dérivable de `session.monde.lieu_courant`, KR-013), jamais la prose, jamais marge/issue. *niveau : unitaire (`session.test.ts`)* — *lot 1*
6. **Étant donné** une sortie R2 non conforme, **quand** elle est reçue, **alors** elle est rejouée exactement une fois puis dégradée en `{sans_epreuve:true}` ; **étant donné** `{sans_epreuve:true}` nominal ou R2 indisponible, **alors** aucune `CarteJet` ne monte, aucune bannière dédiée, R3 est appelé immédiatement. *niveau : contrat (`schemaSortie.test.ts` : cas nominal accepté + rejeu sur malformation) + composant (`useTourDeJeu.test.ts`)* — *lot 1 + lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `arbitre.test.ts` : routage | `aller` jamais R2 ; `agir` sans héros jamais R2 ; `agir`+héros+dangers absent appelle R2 | unitaire | KR-262/244 | 1 |
| `arbitre.test.ts` : `issueDuJet` déterminisme + unicité | même graine → même issue ; `grep resolveChallenge src/features` vide | unitaire + balayage | KR-013 | 1 |
| `CopiloteService.test.ts` : corps strict | `toEqual` strict sur `CorpsDemande.contexte`, zéro `heros.*` | contrat | KR-232/262/231 | 1 |
| `copilote/contexte.test.ts` : invariance | héros jamais injecté, catalogue stable, deux héros même issue → texte R3 identique | contrat | KR-262/249 | 1 |
| `schemaSortie.test.ts` : nominal + rejeu | `{sans_epreuve:true}` accepté sans rejeu ; sortie malformée rejouée une fois puis dégradée | contrat | KR-230 | 1 |
| `session.test.ts` : `consignerJet` | écrit `{carac,tc}`, jamais `lieu_id`/prose/marge | unitaire | KR-248/013 | 1 |
| `alea.test.ts` : domaine `'jet'` | `creerRng(g,'jet',t)` pur, rejouable | unitaire | — | 1 |
| `worker/index.test.ts`, `frontiere.test.ts` | 9ᵉ route, rangs C/D disjoints des scanners existants | contrat | KR-233/270 | 1 |
| `useTourDeJeu.test.ts` : routage + attente | R2 appelé ssi `agir`+héros ; `carteJet` peuplé, jamais `session.attente` | composant | KR-265 | 2 |
| `useTourDeJeu.test.ts` : `{sans_epreuve:true}` | aucune `CarteJet`, R3 immédiat, session avance sans `EntreeJournal.jet` | composant | — | 2 |
| `CarteJet.test.tsx` : 6 états + clavier | rendu par état, `Enter` = clic, focus retour au champ après récit | composant | — | 2 |
| `EcranPartie.test.tsx` : régression | montage conditionnel inline, aucune régression des tests existants | composant | KR-013 | 2 |

Cas limites couverts : vide (`{sans_epreuve:true}`) · très long (`trop-long` avant tout `fetch`) · hors ligne/indisponible (503, dégradation silencieuse) · malformation (rejeu unique) · double soumission (verrou de tour).

**Non vérifiable en l'état** — à recopier dans la revue : la pertinence narrative des propositions de R2 (carac/tc cohérents avec le contexte du lieu, sans voir la fiche du héros) n'est vérifiable qu'en playtest réel (précédent `moteur-interprete` it2, désaccord #16) ; aucun instrument jest ne la couvre.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Le goal contient un « et » — faut-il re-découper l'itération ? | `REJETÉ` | Décision déjà actée au cadrage (KR-263/266, convergence PM/tech-lead/QA/narratif-ia) : un routage de R2 sans sa résolution produirait un bouton « Lancer » qui ne résout rien, un no-op invisible. |
| 2 | PM, narratif-ia | La phrase « sans jamais connaître par avance le seuil » est fausse pour le joueur (il connaît déjà ses caractéristiques) | `RETENU` | Goal reformulé § 1 : l'invariant réel est que R2 ne connaît jamais les caractéristiques, et le joueur ne connaît jamais l'ISSUE avant le clic. |
| 3 | Tech Lead vs narratif-ia | Nom du schéma de sortie R2 : garder `jet`/`sans_jet` (texte littéral du cadrage) ou renommer | `RETENU` (renommage partiel) | Le wrapper devient `epreuve`/`sans_epreuve` — homonyme évité avec `EntreeJournal.jet` (précédent `narration`≠`recit`, KR-231). `carac`/`tc` restent inchangés (rangs re-résolus par appartenance, aucun homonyme réel). Narratif-ia a explicitement remis l'arbitrage au tech-lead (« ce n'est pas mon veto »). Réouvre une ligne de `plan.brain_contracts` fixée au cadrage — motivé ci-dessus. |
| 4 | Tech Lead vs narratif-ia | `EntreeJournal.jet` porte-t-il `lieu_id` ? | `RETENU` (retrait de `lieu_id`) | KR-013 est non négociable (CLAUDE.md). `lieu_id` est dérivable de `session.monde.lieu_courant` au moment du pas (`agir` est un no-op mécanique strict qui ne touche jamais `monde`, `commandes.ts`) — contrairement à `{carac,tc}`, ce n'est PAS une décision du modèle que la graine seule ne reproduit pas (le motif même du critère d'origine, KR-248). Désaccord croisé jamais arbitré depuis le cadrage (deux tours de suite) ; tranché ici en faveur de narratif-ia sur un KR non-négociable plutôt que sur un texte de cadrage non vérifié à l'origine. |
| 5 | Narratif-ia | Risque : `resolveChallenge` appelé à deux endroits distincts (hook + assembleur R3), indice jamais explicité → divergence possible entre la carte et le récit | `RETENU` | `issueDuJet(session, tour)` devient l'unique appelant de `resolveChallenge` dans tout le dépôt (lot 1), lu par la carte, l'assembleur R3 et (it3) l'XP. Témoin : balayage de fichiers, aucune occurrence de `resolveChallenge` sous `src/features/**`. |
| 6 | `pourquoi` dans le schéma de sortie R2 | garder, afficher sur la carte, ou retirer | `RETENU` (retrait) | UX confirme (tour 2) : zéro lecteur dans les 6 états de la carte. Narratif-ia l'avait conditionné à un affichage réel côté UX ; la condition n'est pas remplie. KR-249 (un champ n'entre qu'avec un lecteur réel) s'applique à un champ de sortie de modèle comme à un champ de session. |
| 7 | Tech Lead vs narratif-ia | `CibleArbitre` porte-t-elle `saisie` ? | `RETENU` | Sans elle, R2 ne sait pas ce que le joueur tente et choisirait `{carac,tc}` à l'aveugle de l'action réelle — le tech-lead s'est corrigé lui-même au tour 2, convergence avec narratif-ia. |
| 8 | UX vs narratif-ia | R2 indisponible (503/réseau) a-t-il une bannière propre (état 4 de l'annexe UX tour 1) ? | `REJETÉ` (pas de bannière propre) | Le pas continue normalement vers R3 (comme `sans_epreuve`) ; une bannière « indisponible » coifferait à tort un pas qui va être raconté sans accroc. L'état 4 fusionne avec l'état 2 du contrat de design final (§ 3). La bannière `EchecCopilote` existante ne s'affiche que si R3 échoue AUSSI, comportement déjà établi (n°10), pas une nouveauté. |
| 9 | Tech Lead, narratif-ia | Prédicat anti-tutoiement sur `enjeu_reussite`/`enjeu_echec` (hérité du cadrage, laissé « à trancher par le tech-lead ») | `REJETÉ` | Convergence à deux motifs indépendants : (tech-lead) aucun des 8 rôles frères n'a de garde de registre validée, incohérence famille KR-079 ; (narratif-ia) le `\b` ASCII de JS matche « tête »/« vêtu »/« bêtes », produisant des faux positifs qui feraient tomber des jets valides en `sans_epreuve`. Ferme l'`open_question` du cadrage. |
| 10 | Narratif-ia vs UX (tour 1) | Voix des enjeux : infinitif ou deuxième personne (vouvoiement) | `RETENU` (infinitif) | L'enjeu advenu est spliced dans `CE PAS`, écrit à la 3ᵉ personne (KR-269) — un fragment au vouvoiement y casserait le bloc. L'infinitif fonctionne à la fois comme libellé de carte et comme fragment narratif. L'UX n'a pas maintenu sa position de tour 1 au tour 2. |
| 11 | UX | `Card.tsx` pose toujours une ombre, contredisant « sans box-shadow » du contrat de design, invisible au lint existant | `RETENU` | Prop `shadow?: boolean` (défaut `true`) ajouté à `Card`, lot 1 (fichier `brain/components/`, jamais le lot feature). Zéro régression sur les appelants existants. |
| 12 | QA | Critères d'acceptation sans scénario divergent/test nommé/cas limite — veto initial | `RETENU` | Les 6 critères du § 6 portent chacun un niveau de test et un lot. QA a levé son veto au tour 2 après la mise à jour du découpage tech-lead/narratif-ia. |
| 13 | PM | Aucun test unitaire nommé pour la porte pure `doitArbitrer`, seulement en intégration | `RETENU` | `src/brain/dossier/arbitre.test.ts` (nouveau, lot 1) couvre les trois scénarios au niveau de la fonction pure, en plus du test d'intégration `useTourDeJeu.test.ts`. |
| 14 | Narratif-ia (cadrage, reconduit) | Rangs `C<n>`/`D<n>` opaques au lieu des clés moteur (`FO`, `TC2`) en clair sur le fil | `REJETÉ` | `CHARACTERISTICS`/`CHALLENGE_TIERS` sont des registres fermés, aucune dérive possible entre l'appel et l'acceptation (contrairement au rang de geste `G1…` de R1, qui référence une liste mouvante) — l'argument KR-231 qui justifie les rangs ailleurs ne s'applique pas ici. |
| 15 | Narratif-ia (cadrage, reconduit) | Attente du jet persistée dans `session.attente` avant l'affichage de la carte | `REJETÉ` | Aucune reprise de session n'existe (`useSessionPersistee` écrit seulement) ; un champ persisté sans lecteur réel viole KR-249. L'état reste un `useState` éphémère du hook (§ 4). |
| 16 | Narratif-ia (cadrage, reconduit) | Deux lignes de récit R3 (« tente » puis « issue ») | `REJETÉ` | Le critère 4 exige une seule ligne ajoutée au bloc `CE PAS` existant. |

*(Aucun désaccord ne disparaît sans statut.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **non dû** : cette itération ne touche aucun des 4 fichiers de règles (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`), ils sont seulement appelés
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (en particulier les 5 fichiers réparés en it1)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `moteurSansIA.test.ts` : exclusion nommée inchangée hors de `useTourDeJeu.ts` (seul fichier `play-mode/` à importer `CopiloteService`) — `CarteJet.tsx`/`EcranPartie.tsx` n'en importent jamais
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-arbitre-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — goal reformulé, arité tranchée |
| Tech Lead | recevable sous réserve | oui — interface figée, `session.attente` non ouverte |
| UX | recevable sous réserve | oui — 6 états + `Card.shadow` + seuil REGLES §2 corrigés |
| QA | recevable sous réserve (veto initial levé) | oui — scénarios/tests/cas limites au § 6-7 |
| Narratif & IA | recevable sous réserve | oui — catalogue + saisie dans le contexte, `issueDuJet` unique |
