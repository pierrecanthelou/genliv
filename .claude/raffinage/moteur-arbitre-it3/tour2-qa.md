RISQUE — Identique à tour 1. Divergence silencieuse si `MARGE_FRANCHE` n'est pas une constante nommée, réutilisée par `challengeXp` ET `classifierIssue`. Le score de mutation doit distinguer les trois branches XP (marge ≥ 3, 0 ≤ marge < 3, marge < 0).

OBJECTION — Reconsidération des 4 points de tour 1 :

1. **Absence de scénarios de test nommés** → RETIRÉE. Tech-lead (lot A, ligne 21-22) + narratif-ia (ligne 11-12, 40) proposent trois tests concrets : frontière `margin = MARGE_FRANCHE - 1` vs `MARGE_FRANCHE`, `jest.mock('../xp', () => ({MARGE_FRANCHE: 5}))` ⇒ marge=4 rend `reussit`, pas `reussit_nettement`, invariance R3 sur FO 12 vs FO 9 TC1. Exécutabilité : RNG fixture existante + `characteristicValue = roll + offset`.

2. **Nom de la constante non fixé** → RETIRÉE. Tech-lead : `MARGE_FRANCHE = 3`, sourced §5 ligne 204 REGLES-DU-JEU.md.

3. **Critère fini mutation absent** → RETIRÉE. Tech-lead : « En fin de lot A : `npm run test:mutation`, 4 scores clear-text, `xp.ts` ne recule pas. »

4. **API `classifierIssue` ambiguë** → RETIRÉE. Deux signatures DISTINCTES : `classifierIssue(resultat: ChallengeResult)` (contient `margin`) + `xpDuJet(session, tour)` (prend session + tour, rend `number | undefined`). Pas de paramètre supplémentaire.

PROPOSITION — Scénario test concret, réconcilié :

**Lot A** : `arbitre.test.ts — 'KR-261 : seuil unique MARGE_FRANCHE'`
- Variant A : roll=9, carac=12 ⇒ marge=3 ⇒ `'reussit_nettement'`, `baseXp + 1`
- Variant B : roll=11, carac=12 ⇒ marge=1 ⇒ `'reussit_de_justesse'`, `baseXp` seul
- Variant C : roll=13, carac=12 ⇒ échec ⇒ `'echoue'`, `xp=0`
- Témoin mutant : `jest.mock('../xp', () => ({MARGE_FRANCHE: 5}))` ⇒ marge=4 ⇒ `'reussit'`, pas `'reussit_nettement'` (mutant `margin >= 3` → `margin >= 5` meurt)

VERDICT — recevable (note originale : « CONFORME »)

Quatre objections levées. Tech-lead + narratif-ia concilient chacune : scénarios exécutables (RNG fixture), source unique gelée, critère mutation nommé, deux API distinctes.

NOTE ORCHESTRATEUR : QA utilise ici le naming à 3 états « reussit_nettement/reussit_de_justesse/echoue » (version tech-lead) dans ses scénarios de test, alors que la tension sur le nommage exact (tech-lead vs narratif-ia) n'était pas encore tranchée au moment de cette note — à vérifier à l'arbitrage contre la décision finale de tech-lead/narratif-ia.
