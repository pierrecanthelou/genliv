# Tour 1 Narratif & IA — dossier-repetition it2

**Date** : 2026-10-08
**Lecteur** : Narratif & IA (skill `raffinage-iteration`, mode A — avant code)

---

## RISQUE

L'étalon n'existe nulle part. Le goal dit « section REGLES-DU-JEU.md étalon (KR-130) » ; la section n'existe pas. KR-130 impose doc puis test puis code. Sans la section, le sens d'écriture est inversé et la table dorée (KR-314) figerait du code inventé, pas une règle écrite par l'auteur.

---

## OBJECTION 1 : Stats de l'étalon non écrites dans la doc des règles

REGLES-DU-JEU.md ne contient aucune section « héros étalon ». La génération (§ 1) est une PROCEDURE randomisée (2D4 + 1D4 réparti), pas un profil fixe. L'it1 utilise `rollCreationPool(rng)` — le héros change avec la graine. L'it2 veut un profil FIXE canonique. Quelles stats ? L'espérance de 2D4 est 5 ; 5 partout donne PV = 15, MC = 5, PE = 5. C'est le choix le plus neutre, mais c'est un choix de conception, pas une évidence — un auteur pourrait vouloir que l'étalon teste un héros « moyen-fort » (6 partout) pour révéler les aventures trop faciles. Cette décision doit être ECRITE dans REGLES-DU-JEU.md (§ 1 bis ou note en fin de § 1) AVANT le code.

**Pourquoi c'est mon poste** : le profil de l'étalon détermine ce que le rapport montre à l'auteur. Un étalon trop faible meurt à chaque Tier 2 — l'auteur croira son aventure cassée. Trop fort, il traverse tout et l'auteur ne verra jamais les combats dangereux.

---

## OBJECTION 2 : Mutation de session entre combats non spécifiée

Après un combat gagné, `cloreCombat(session, bilanDe(etat))` mute les PV/PE du héros. La spec ne dit pas si repeter applique cette mutation. Si le héros repart à PV max après chaque combat, le rapport ment : un héros à 3 PV qui rencontre un second monstre mourrait dans une vraie partie, pas dans la simulation. L'usure cumulative est la réalité du jeu — la simulation doit la refléter.

---

## PROPOSITION

1. Écrire dans REGLES-DU-JEU.md (§ 1, note « Héros étalon ») : « Pour la simulation déterministe, le héros étalon porte 5 à chaque caractéristique (espérance de la génération). PV = 15. MC = 5. Aucun équipement (§ B3). » Puis table dorée, puis code.
2. `combat_sans_issue` est un paramètre de SIMULATION (comme PAS_MAX), pas une règle du jeu. Constante ROUNDS_MAX_COMBAT dans repeter.ts (proposition : 50). Ne pas l'écrire dans REGLES-DU-JEU.md.
3. Après chaque combat, appliquer `cloreCombat` pour muter PV/PE/XP dans la session. Le héros synthétique s'use comme un vrai.
4. Le héros synthétique joue toujours posture `'normale'` et ne fuit jamais : c'est un test de la topologie, pas une IA tactique.

---

## VERDICT

**Recevable sous réserve** — la section étalon de REGLES-DU-JEU.md est écrite et relue par le comité avant le code (KR-130). La mutation de session entre combats est spécifiée.

---

## ANNEXE — Frontière code/IA et identifiants

**Contrat de sortie IA** : néant. Zéro appel modèle. Zéro prompt. Zéro prose générée. La boucle combat est 100 % code pur (`startCombat` + `resolveCombatRound` + `bilanDe` + `cloreCombat`).

**Frontière vérifiée** : l'IA ne lance pas les dés, ne modifie pas les stats. Le combat est résolu par `combatEngine.ts` (brain/combat.ts pour l'arithmétique, player/engine/combatEngine.ts pour l'orchestration). Le RNG est seedé (`creerRng(graine, 'combat', tour)`, KR-295). Le rapport est un struct typé, jamais du texte libre.

**Identifiants** : `monstre_ref` est un identifiant stable (`bestiaire.<templateId>`). Les motifs d'arrêt sont des littéraux TypeScript (`'mort'`, `'combat_sans_issue'`), jamais des noms libres.

**Voix** : le panneau reste en 3e personne du joueur synthétique (décision it1). Nouveaux messages : « Le joueur synthétique meurt au combat contre {monstre.name} » / « Combat sans issue contre {monstre.name} après {n} rounds ». Noms internes, aucune prose IA.

**Budget de contexte** : néant, pas de contexte IA. La section étalon dans REGLES-DU-JEU.md coûte environ 40 mots — marginal.

## Décisions prises en autonomie faute de spécification

- Le profil étalon n'était pas tranché → j'ai choisi 5 partout (espérance 2D4) → si c'est 6 partout, les combats Tier 1 deviennent triviaux et le rapport est moins utile pour détecter les aventures sous-dimensionnées.
- La mutation inter-combats n'était pas tranchée → j'ai choisi de l'appliquer (usure cumulative) → si c'est sans usure, le rapport est optimiste et ne reflète pas la courbe de difficulté réelle d'une aventure.
- `combat_sans_issue` n'était pas défini → j'ai choisi « paramètre de simulation (ROUNDS_MAX_COMBAT), pas une règle de jeu » → si c'est une règle de jeu dans REGLES-DU-JEU.md, il faut la soumettre à la table dorée et au score de mutation — surcoût pour une borne qui n'affecte que le synthétique.
