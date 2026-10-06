## QA — moteur-horloge it4 — tour 2

### Réponses nommées

1. **TL Route C : ACCORD.** `Evenement.climat_id?` est observable et testable.
2. **TL `climat_actif: {id, depuis}` : ACCORD.** Le critère est maintenant observable : on peut asserter `horloge.climat_actif` égal à `{id, depuis}`.
3. **PM idempotence : ACCORD.** `evenements_consommes` empêche la double activation. `avecAjout` est set-based. Pas de flag nécessaire.
4. **Extinction `>=` vs `===` : DÉSACCORD, je maintiens `===`.** Cohérence avec `blocage.ts`. Un climat ne devrait s'éteindre qu'au pas exact, comme le blocage ne se constate qu'au tour exact.

### Mes objections

- **O1 (champ manquant) : RETIRÉE.** `{id, depuis}` résout le problème.
- **O2 (trois routes d'activation) : RETIRÉE.** Route C tranchée.
- **O3 (idempotence) : RETIRÉE.** Non-problème confirmé par PM et TL.
- **O4 (tests bandeau) : DURCI EN VETO.** Les assertions TDD du bandeau doivent exister AVANT le code :
  - `pas={3}` → affiche `PAS #3`
  - `climatNom="Tempête de sable"` → affiche `CLIMAT · Tempête de sable`
  - `climatNom={undefined}` → bloc CLIMAT absent
  - Ces tests sont la définition de fini, pas un ajout post-hoc.

**VERDICT** : recevable. Veto O4 : les tests du bandeau sont écrits avant le composant.
