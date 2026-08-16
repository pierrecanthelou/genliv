RISQUE — QA (dossier-fiches it8, tour 1)

Deux angles concrets. (1) L'énumération « les 6 curseurs » risque d'être échantillonnée sur 2-3 valeurs dans le test comme dans le composant — c'est exactement BUG-068b (3e occurrence de la classe KR-199 dans cette feature) : un test vert qui nomme « les 6 » mais n'en prouve que 3 laisse les 3 autres sans garde. (2) `PARLER_REPLIQUES=2` n'a, dans le cadrage, ni mécanisme de refus nommé ni ligne de table listée dans `brain_contracts` — impossible d'écrire un critère « testé à limite+1 » sans savoir par quel instrument la 3e réplique se manifeste (bandeau D1 vs UI qui empêche l'ajout).

OBJECTION — Le point (b) du cadrage est explicitement laissé ouvert (« à clarifier avec UX/tech-lead »). Ce n'est pas un détail d'implémentation : c'est un vide de définition de fini. Je ne peux pas juger un critère « borne testée à limite et limite+1 » recevable tant que le mécanisme de refus n'est pas tranché — le nom du test en dépend entièrement.

PROPOSITION —
1. Compléter le critère #5 existant : les 6 clés se balayent via `Object.keys(CURSEURS)`/`Object.entries`, jamais 6 littéraux — dans le composant ET dans le test.
2. Trancher `PARLER_REPLIQUES` en UI-only (bouton d'ajout absent/désactivé au-delà de 2, pas de refus SSOT) : test nommé « 2 répliques rendues, bouton d'ajout absent du DOM à la 2e ».
3. Ajouter un critère de clôture : après it8, aucun bloc de l'accordéon (6 personnages du dossier de référence) n'affiche plus « Pas encore renseigné » (test-grep, précédent KR-187).
4. Reconduire nommément le critère #8 (non-régression 6 personnages) pour it8 dans le lot livré.

VERDICT — recevable sous réserve : (b) doit être tranché au tour 2 avec un mécanisme nommé, sinon veto sur définition de fini floue.

---

ANNEXE — tests-clés attendus

- `fichePersonnage.test.tsx` : « le bloc Caractère exploitable affiche curseurs/parler/jamais/cede_si au montage, sans interaction, sur deux personnages distincts » (BUG-064/KR-199 — patron déjà établi lignes 160-234 pour le bloc but/plan_actions ; valeurs non fabricables, ex. `mefiance: 7` chez Aldur, `mefiance: 3` chez Sélène).
- test neuf (`couverture.test.ts` ou dédié `curseurs.test.ts`) : « les 6 clés de CURSEURS sont exhaustivement rendues » dérivé de `Object.keys(CURSEURS)`, jamais 6 littéraux (précédent BUG-068b).
- `fichePersonnage.test.tsx` : « PARLER_REPLIQUES=2 accepte 2 répliques persistées, refuse/masque l'ajout d'une 3e » (KR-165, limite + limite+1, mécanisme à nommer au tour 2).
- test de clôture : « après it8, aucun des 6 personnages du dossier de référence n'affiche 'Pas encore renseigné' dans son accordéon ».
- `couverture.test.ts`/`validate.test.ts` : non-régression du dossier de référence à 6 personnages (critère #8, reconduit nommément pour it8).
- `lintIsolation.test.ts` : vert sans modification (aucun import croisé neuf attendu sur ce lot).

Fichiers lus : `C:\Users\pierr\Desktop\genliv\src\features\dossier-fiches\specification.json`, `C:\Users\pierr\Desktop\genliv\.claude\skills\raffinage-iteration\SKILL.md`, `C:\Users\pierr\Desktop\genliv\src\features\dossier-fiches\tests\fichePersonnage.test.tsx`, `C:\Users\pierr\Desktop\genliv\code-knowledge.json`.
