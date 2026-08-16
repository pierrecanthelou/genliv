RÉPONSES NOMMÉES — QA, tour 2

(1) RETIRÉE — pas convergence d'opinion, mécanisme nommé : UI-only, `handleAjouterReplique` masqué à `length >= PARLER_REPLIQUES` (lot B tech-lead), CTA disparaît sans jamais `disabled` (UX §2), zéro ligne `validate.ts`. Testable : « length 1 : CTA visible, focus nouveau Field » ; « length 2 : CTA absente » ; « length 3 forcée : 3 rendues, aucun refus » (BUG-074). Ce triplet remplace mon « limite/limite+1 » — adopté, il couvre mieux « le document porte 3 ».

(2) Critère propre, pas un détail d'implémentation : une sonde qui risque de rougir constant si mal reciblée est KR-199 appliqué à l'instrument même. J'ajoute : « la sonde `couverture.test.ts` (ex-l.486) retargetée vers un chemin nommé n°5/n°6 au lot A, rouge avant, verte après ». Sans ce nom, NON VÉRIFIÉ au tour B.

(3) Scindé. La moitié DONNÉE (champ persisté/relu, ligne `ia` de `destinations.ts`, discrimine `couverture.test.ts`) testable aujourd'hui. La moitié RÔLE (injection au seul acteur-porteur) n'a aucun instrument avant l'assembleur n°10 — hors-cadre, comme le JSDoc `Relation.secret` en it5. Un critère prétendant vérifier ce gating aujourd'hui est irrecevable, veto. Seule l'identité mot-pour-mot des deux sites peut être critère, en revue humaine — pas jest.

STATUT TOUR 1 — RETIRÉE (mécanisme nommé, voir (1)). Mon risque point 1 (échantillonnage des 6 curseurs) reste actif comme discipline de rédaction — repris par `CURSEUR_VALUES` — à vérifier au tour B, plus une objection.

VERDICT — recevable, sous réserve des critères en (2) et de la limite en (3).

---

TESTS-CLÉS (mise à jour tour 2, remplace l'annexe tour 1)

- `caractere.test.tsx` : « length 1 : CTA visible, focus nouveau Field » ; « length 2 : CTA absente, légende de remplacement affichée » ; « length 3 via fixture forcée : 3 répliques rendues, aucun refus » (KR-165, BUG-074).
- `curseurs.test.ts` : « les 6 clés de CURSEURS/CURSEUR_VALUES exhaustivement rendues », dérivé de `Object.keys`, jamais 6 littéraux (BUG-068b) ; 3 littéraux `affinite` épinglés contre `CHARACTERISTICS` (KR-117/193).
- `caractere.test.tsx` : « le bloc Caractère exploitable affiche curseurs/parler/jamais/cede_si au montage, sans interaction, sur deux personnages distincts » (KR-199).
- `couverture.test.ts` : sonde ex-ligne 486 retargetée vers un chemin n°5/n°6 nommé au compte rendu du lot A — rouge-avant/vert-après documenté, sinon NON VÉRIFIÉ.
- Revue humaine (hors jest) : identité mot-pour-mot du JSDoc `Caractere.cede_si` et du commentaire de sa ligne dans `destinations.ts`.
- test de clôture : « après it8, aucun des 6 personnages du dossier de référence n'affiche 'Pas encore renseigné' dans son accordéon ».
- `couverture.test.ts`/`validate.test.ts` : non-régression du dossier de référence à 6 personnages (critère #8, reconduit).
- `lintIsolation.test.ts` : vert sans modification.
