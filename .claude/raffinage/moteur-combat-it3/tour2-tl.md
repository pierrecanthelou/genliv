# Tech Lead · moteur-combat it3 · Tour 2

RÉPONSE À UX — récit apparié par round : le journal porte plusieurs entrées par round. Le récit s'ancre sous la DERNIÈRE entrée de chaque round. La fuite pose `round+1` : sa clé n'existe jamais, donc silence garanti. Map `attente | recu` adoptée. Règles ESLint UX : hors itération.

RÉPONSE À NIA — nom du monstre gardé (bestiaire, registre de code). Paliers classés par l'assembleur brain/, indépendants de `isLowHp`. Capacité, postures, round sur le fil : refusés, additifs plus tard. Types dans `types.ts`, pas `contexte/`.

RÉPONSE À QA — rejeu dans `jusquAuRejeuUnique` (CopiloteService), pas en feature. Bornes dans schemaSortie.test.ts. Grep player/ tenu par moteurSansIA.

MES OBJECTIONS :
1. Veto `.text`/`.log` — maintenue, satisfaite ; durcie : `AssautRound` porte `round`.
2. Paliers en `brain/` — maintenue.
3. Projection hors `player/` — maintenue.
4. `session.ts` fermé — maintenue.

VERDICT FINAL — recevable sous réserve : ancrage par round et map `attente | recu` inscrits aux critères lot 2.

## ANNEXE — Lots et signatures révisés

2 lots séquentiels, propriété disjointe. Lot 1 = brain/ + worker/ (11 fichiers). Lot 2 = player/ + play-mode/ (14 fichiers).

AssautRound gagne `round: number`. CommentaireRound = `{ etat: 'attente' } | { etat: 'recu'; narration: string }`. Map commentaires: `ReadonlyMap<number, CommentaireRound>`.

Déclenchement R5 dans le handler (pas useEffect), second `rejouerCombat(next)` pur. Abort au démontage CombatEnCours.

Paliers de santé : plein > 50%, blessé 25–50%, critique < 25%, inconscient/vaincu ≤ 0. Classés dans l'assembleur brain/, indépendants de isLowHp.

NARRATION_COMBAT_CARACTERES_MAX = 400 (site unique, soupape NIA notée).
