# Tour 2 — QA — dossier-canon it4

RISQUE — maintenue, portée réduite. Le blocage SSOT existe déjà (`tables.ts:222`, `validate.test.ts:270-281`, « depart.lieu_id pendant est bloquant ») : plus rien à prouver au niveau contrat. Le risque résiduel est composant : rien ne montre que `PanneauLieux` appelle bien `DossierService.update()` sur suppression et rend le bandeau Refus au lieu de retirer optimistiquement la ligne.

OBJECTION — maintenue, non affectée par le fait nouveau (brouillon/garde, KR-187, repli liste, compteur).

PROPOSITION — (1)(3)(4)(5) maintenues. (2) révisée : retirer l'assertion « contrat », la remplacer par une assertion composant unique dans `panneauLieux.test.tsx` — « suppression du lieu de `charpente.depart` : liste inchangée (N lignes), bandeau `role="status"` `EYEBROW_REFUS` visible, aucun retrait optimiste ».

VERDICT — recevable sous réserve : réserve inchangée sur (1)(3)(4)(5), portée réduite sur (2).

## RÉPONSES TOUR 2

1. **Test dédié depart.lieu_id** : plus nécessaire côté `validate.test.ts` (déjà là). Nécessaire côté `panneauLieux.test.tsx`, niveau composant — sans lui l'intégration UI→brain n'est vérifiée par personne.
2. **destinations.ts, 3 lignes** : couvertes par l'existant `couverture.test.ts` (L293 « toute feuille a une destination », L301 « aucune ligne morte ») **à condition** que `dossier-minimal.json` porte les 3 champs sur `lieu.val-cendre` dans le même lot (tech-lead, RISQUE). Critère à écrire : nommer ces deux assertions + citer la dépendance fixture.
3. **Confirmation suppression** — deux tests nommés selon arbitrage : si Modal (UX) → « clic retirer n'appelle pas `update` avant confirmation ; confirmer supprime ; Échap/Annuler laisse N lignes intactes, focus revient au bouton ». Si pas de Modal (PM) → « clic retirer sur lieu non référencé par depart supprime immédiatement, liste N→N-1, aucun dialogue rendu ».
