RISQUE — Le point 5 (heroTier) n'est pas une question de lecture de doc isolée : c'est un fragment du CONTRAT que le lot `contrat` fige et que le lot `feature` consomme sans jamais le revoir. Laissé "à trancher" sans réponse écrite dans la signature, `xpDuJet` pourrait être implémentée avec une lecture différente selon l'agent qui l'écrit (caractéristique testée vs MC vs niveau global), sans qu'aucun test ne distingue les deux avant que n13 (combat) n'en ait besoin. Risque secondaire : `xp.ts` est l'un des 4 fichiers mutés — le lot qui le touche doit relancer `npm run test:mutation` et vérifier que SON score (déjà au plafond 90) ne recule pas, précisément sur ce fichier.

OBJECTION — La spec it3 affirme "ΔT déjà défini §5" comme si c'était clos ; c'est faux tant que personne n'a écrit laquelle des deux lectures de §5 ("Tiers de personnage calculés sur une caractéristique OU la MC") s'applique hors combat. La ligne 194 de REGLES-DU-JEU.md ne distingue pas combat/hors-combat : c'est une lecture à faire, pas une citation déjà faite.

PROPOSITION — Lecture retenue et à geler dans le lot contrat : hors combat, `Tier_personnage = tierOf(heros.caracs[carac_testée])`, jamais la MC (réservée aux jets de fuite / n13 combat). Aucun paramètre caché dans `xpDuJet(session, tour)` : la lecture de la caractéristique vient de la même entrée de journal que `issueDuJet`. Découpage en 2 lots (annexe) : lot A `contrat` seul et premier ; lot B `feature` (un seul fichier de production), consommateur figé de la signature.

VERDICT — recevable sous réserve : la réserve porte sur (a) l'écriture explicite de la lecture heroTier dans la docstring/signature de `xpDuJet` avant tout code de lot B, et (b) le lancement de `npm run test:mutation` en fin de lot A, seul lot touchant un fichier de règles (`xp.ts`).

---

## ANNEXE — Découpage en lots

### Lot A — `contrat` (seul, en premier)

Touche uniquement des fichiers `brain/`. Aucun autre lot ne peut démarrer avant que celui-ci soit figé.

| Fichier | N/R | Contenu |
|---|---|---|
| `src/brain/xp.ts` | R | Extrait `MARGE_FRANCHE = 3` (littéral `margin >= 3` actuel) depuis `docs/REGLES-DU-JEU.md` §5 ligne 204 (« +1 si marge ≥ 3 »), exportée. `challengeXp` l'utilise à la place du littéral inline. |
| `src/brain/xp.test.ts` | R | Test de frontière `margin = MARGE_FRANCHE - 1` vs `MARGE_FRANCHE` (garde le mutant `>=`→`>` et `3`→`2`/`4`). |
| `src/brain/dossier/arbitre.ts` | R | `IssueEpreuve` passe de 2 à 3 membres : `'reussit_nettement' \| 'reussit_de_justesse' \| 'echoue'`. `classifierIssue(resultat: ChallengeResult): IssueEpreuve` lit `resultat.success` et `resultat.margin >= MARGE_FRANCHE` (importée de `../xp`, JAMAIS un second seuil). Ajoute `xpDuJet(session: EtatSession, tour: number): number \| undefined` — même sélection d'entrée de journal qu'`issueDuJet` (précédent exact, même garde `undefined`) ; calcule `challengeTier = challengeTierValue(entree.jet.tc)` (`../challenge`), `heroTier = tierOf(session.heros.caracs[entree.jet.carac])` (`../xp`, lecture sur la caractéristique TESTÉE — décision ci-dessus, jamais la MC), `baseXp = CHALLENGE_TIERS[entree.jet.tc].baseXp`, et appelle `challengeXp({challengeTier, heroTier, success: resultat.success, baseXp, margin: resultat.margin})`. Rend `0` (valeur légale) si la bande est insignifiant/facile-échec, `undefined` SEULEMENT dans les deux cas où `issueDuJet` rend déjà `undefined` (pas d'entrée jet pour ce tour, pas de héros). |
| `src/brain/dossier/arbitre.test.ts` | R | Tests `classifierIssue` à 3 états (seuil exact) + `xpDuJet` (déterministe, même précédent rng que `issueDuJet`, distinction `0` vs `undefined`). |
| `src/brain/dossier/session.ts` | R | Ajoute `crediterXp(session: EtatSession, xp: number): EtatSession` juste après `consignerJet` — même motif que `fixerHeros`/`consignerJet` : SEULE porte d'écriture de `heros.xp`. N'écrit QUE cette feuille (spread à un niveau, précédent `TRANSITIONS.aller` sur `pe`). No-op (session inchangée) si `session.heros === undefined` ou `xp <= 0`. |
| `src/brain/dossier/session.test.ts` | R | Teste que `crediterXp` n'écrit QUE `heros.xp`, no-op sans héros, no-op sur `xp<=0`. |
| `src/brain/copilote/contexte/narrateur.ts` | R | `AMORCE_ISSUE: Record<IssueEpreuve, string>` passe de 2 à 3 entrées : `reussit_nettement: 'réussit nettement'`, `reussit_de_justesse: 'réussit de justesse'`, `echoue: 'échoue'` (3e personne infinitif, KR-269, cohérent avec les 2 verbes déjà retenus). `BORNE_JET`/`BUDGET_CARACTERES_NARRATEUR` se recalculent automatiquement (formule inchangée, pas de remesure manuelle). |
| `src/brain/copilote/contexte.test.ts` | R | Met à jour les assertions qui citaient les 2 anciennes valeurs d'`AMORCE_ISSUE`/`BORNE_JET`, ajoute un cas « réussite franche » et « réussite de justesse » distincts dans `ligneDeJet`. |
| `src/brain/index.ts` | R | Barrel : ajoute `xpDuJet`, `crediterXp` aux ré-exports de `./dossier/arbitre` et `./dossier/session` (nécessaire : `useTourDeJeu.ts` importe exclusivement depuis `'../../../brain'`, jamais un chemin profond). `MARGE_FRANCHE` reste interne (aucun second appelant hors `brain/`, KR appliqué : une abstraction à un seul appelant ne sort pas du module). |

**Signature gelée exposée par le lot A** (point de rendez-vous du lot B) :
```ts
// brain (barrel)
export type IssueEpreuve = 'reussit_nettement' | 'reussit_de_justesse' | 'echoue'
export function classifierIssue(resultat: ChallengeResult): IssueEpreuve
export function xpDuJet(session: EtatSession, tour: number): number | undefined
export function crediterXp(session: EtatSession, xp: number): EtatSession
```
En fin de lot A : `npm run test:mutation`, relever les 4 scores clear-text, vérifier `xp.ts` ne recule pas (seul fichier de règles touché).

### Lot B — `feature` (seul lot feature, après le lot A figé)

| Fichier | N/R | Contenu |
|---|---|---|
| `src/features/play-mode/hooks/useTourDeJeu.ts` | R | Dans `lancerLeDe`, après résolution de `issue` (`issueDuJet`) : appelle `xpDuJet(sessionAvecJet, tour)` puis, si défini et `> 0`, `crediterXp(sessionAvecJet, xp)` — AVANT l'appel à R3 et avant tout `onSessionChange`/navigation (ordre des effets : persistance d'abord). `classifierIssue` n'est PAS importée ici : la classification pour R3 reste interne à `narrateur.ts` (l'assembleur), `useTourDeJeu` ne fait que créditer un nombre déjà calculé — aucune règle de jeu dans la feature. |
| `src/features/play-mode/hooks/useTourDeJeu.test.ts` | R | Scénario déterministe (fixture rng existante) : héros crédité du montant exact attendu selon la bande ΔT, aucun crédit si `xpDuJet` rend `0`/`undefined`, `heros.xp` seule feuille modifiée (témoin négatif sur `heros.pv`/`pe` inchangés). |

Aucun autre fichier ne bouge : `BandeauHeros.tsx` affiche déjà `XP n` dérivé de `session.heros.xp` (it1) — lecteur déjà présent (KR-249 satisfait sans aucune modification de vue). `CarteJet.tsx` reste binaire (Badge tone good/bad sur `resultat.success`) : seule l'amorce envoyée à R3 devient ternaire, jamais l'affichage des dés.

---

## Décisions prises en autonomie (faute de spécification écrite)

- Noms des deux nouveaux littéraux de `IssueEpreuve` (`'reussit_nettement'`/`'reussit_de_justesse'`) non fournis par le cadrage → j'ai choisi ces deux clés (cohérentes avec `'reussit'`/`'echoue'` existants, 3e personne infinitif KR-269) → si le comité préfère d'autres libellés, le coût est une renomination confinée au lot A (`arbitre.ts` + `narrateur.ts`), zéro effet sur le lot B qui ne lit jamais ces littéraux (il ne consomme que le nombre rendu par `xpDuJet`).
- Emplacement de `xpDuJet` (dans `xp.ts`, pur, vs `arbitre.ts`, orchestrateur lisant `EtatSession`) non spécifié → je l'ai placé dans `arbitre.ts`, suivant le précédent exact `issueDuJet` (même sélection de journal, même garde `undefined`), en laissant `xp.ts` strictement pur (aucune dépendance à `EtatSession`) → si c'est l'inverse, `xp.ts` cesse d'être un module de règles sans dépendance de session, ce qui romprait la séparation RÈGLES/ORCHESTRATION que `challenge.ts`/`arbitre.ts` établissent déjà et compliquerait sa lecture sous le score de mutation (le fichier resterait dans le périmètre, mais son rôle deviendrait ambigu pour la prochaine itération qui le relira).
- Distinction entre « XP=0 légitime » et « rien à créditer » non tranchée par le cadrage → j'ai choisi : `xpDuJet` rend `0` (valeur légale) pour les bandes insignifiant/facile-échec, et réserve `undefined` aux deux cas où `issueDuJet` lui-même rend déjà `undefined` (pas d'entrée jet pour ce tour, pas de héros) → si l'inverse (0 et « rien » confondus en `undefined`), `crediterXp` ne pourrait plus prouver qu'un jet a réellement été résolu sans XP, ce qui romprait la garantie d'écrivain réel exigée par KR-249.

## Fichiers lus (chemins absolus)

- `src/features/moteur-arbitre/specification.json`
- `code-knowledge.json`
- `src/brain/xp.ts`
- `src/brain/challenge.ts`
- `src/brain/dossier/arbitre.ts`
- `src/brain/dossier/session.ts`
- `src/brain/copilote/contexte/narrateur.ts`
- `src/features/play-mode/hooks/useTourDeJeu.ts`
- `src/brain/dossier/sessionDestinations.ts` (confirme `heros.xp` déjà audience `'moteur'`, aucune ligne à ajouter)
- `docs/REGLES-DU-JEU.md` (§5, lignes 192-209)
