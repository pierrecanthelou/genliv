# QA — tour 2 · moteur-fins it2

## Réponses nommées

- **TL O3** (`illisible` sans `refus`) : acceptable, `refus` en it3.
- **UX O3** (focus modal) : hors cadre — CLAUDE.md décision projet.
- **NIA O1** (texte de mort) : hors it2.
- **TL O1** (`lire(dossier)`) : acceptée si critère observable.

## Mes objections

- **O1 (timing périmé)** : **maintenue**. Observable : `validerSession` compare `session.dossier_maj` vs `dossier.maj` en initialiseur `useState` (KR-305). 4 tests nommés (KR-199).
- **O2 (4 discriminants)** : **maintenue**.

## Nouveau veto — cas limites non énumérés

**TL Risque arch #3** (tour en vol) : état React non persisté à la reprise. Cas limites absents : retour arrière navigateur, rechargement mi-tour, crash.
- Contrat DOIT énoncer : `ecrire` jamais appelé tant que le choix périmé/illisible est affiché.
- **VETO si absent** : une action invalide ne doit pas corrompre la session.

## Bilan

TL O1 + QA O1 + veto risque arch #3 doivent entrer dans la spec avant l'essaim.
