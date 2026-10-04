# Tech Lead — moteur-acteurs it4, tour 2

RÉPONSE À Narratif obj 3 (fait persistant `EtatPnj`) — veto maintenu sur le STOCKAGE. L'issue est stable (ni `crediterXp` ni `aller` ne modifient les caracs). `session.ts:159` interdit le stockage (KR-013). Coût du stockage : +5 fichiers au lot contrat. Alternative : `evaluerSavoir` gagne un paramètre optionnel `epreuves` (défaut `[]` = fermé, KR-280).

RÉPONSE À Narratif obj 1 — levée par le moteur. Appel 2 exige le rang dû. `resiste` légal ⟺ bloc présent.

RÉPONSE À UX obj 1 — ligne de contexte = rendu dérivé côté feature, pas dans `recit` (`consignerReponseActeur` est premier-écrit-gagne).

MES OBJECTIONS :
1. Tri-état, jet évalué en dernier — maintenue.
2. Moteur choisit le savoir — maintenue.
3. Opt-in — durcie en veto : discriminant `peutResister` sur les DEUX cibles.
4. Doc § 6 d'abord — maintenue, étendue : re-tentative, XP, réussite par `(carac, tc)`.

Lots révisés : 2 lots séquentiels, listes disjointes.
- A `brain-acteur-jet` (contrat, ~17 fichiers) : doc § 6, revelation, arbitre, recit, types, schemaSortie, acteur, CopiloteService, worker.
- B `cablage-jet-dialogue` (feature) : useTourDeJeu + test.

Réussite dérivée du journal par `epreuvesReussies`, rien de stocké. Identité de l'épreuve par `(carac, tc)` pour un PNJ donné.

VERDICT — Recevable sous réserve. Veto 3 actif jusqu'à acceptation de la dérivation.
