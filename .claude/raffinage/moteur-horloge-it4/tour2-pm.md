## PM — moteur-horloge it4 — tour 2

### Réponses nommées

1. **Route C (TL) : ACCORD.** `Evenement.climat_id?` sous 4 contraintes : surface d'édition existante (Evenement), déjà consommée par le moteur (evaluate.ts), déclenchée une seule fois (evenements_consommes), zéro prédicat neuf. L'événement est la couture naturelle.
2. **L3 FicheEvenement : DÉSACCORD, hors it4.** Touche une seconde feature (dossier-registres). `climat_id` n'a pas d'éditeur en it4, comme `effets_regles`. Démo par fixture JSON.
3. **Extinction `>=` (TL) : ACCORD.** `===` laisse un climat éternel sur session forgée. `>=` efface l'état, donc pas de répétition.
4. **R3 manifestation : MAINTENU hors it4.** Proposes it5 de n° 14 comme héritier. Rouvre décision 167 (« 4 itérations, pas 5 »). Fallback : ligne roadmap « reporté hors n° 14 » + `narrateur.ts:129` amendé.

### Mes objections

- **O1 : RETIRÉE.** Route C tranche la question.
- **O2 (idempotence) : RETIRÉE.** `avecAjout` est set-based, `evenements_consommes` empêche la double activation.
- **O3 (effets_regles sans éditeur) : MAINTENUE.** Ligne roadmap obligatoire pour le futur éditeur de `climat_id` + `effets_regles`.
- **O4 : RETIRÉE.** `{id, depuis}` résout la dérivation de l'origine.
- **O5 : DURCI EN VETO.** Pas de sortie manifestation sans ligne roadmap. L'absence de roadmap line signifie que personne ne sait quand le travail sera fait.

### Phrase de démo reformulée

« L'auteur lit au bandeau PAS #n en permanence et CLIMAT · {nom} quand un climat s'active ; après sa durée, le bandeau revient au calme. » Fixture JSON pour la démo.

**VERDICT** : recevable. Périmètre = L1 contrat + L2 bandeau. L3 hors it4. R3 reporté.
