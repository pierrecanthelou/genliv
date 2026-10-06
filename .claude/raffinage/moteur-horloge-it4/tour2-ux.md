## UX Designer — moteur-horloge it4 — tour 2

### Réponses nommées

1. **TL Route C : ACCORD.** L'activation par `Evenement.climat_id?` ne touche pas l'UI ; le bandeau consomme `climatNom`, pas le mécanisme.
2. **TL journal `climat_actif`/`climat_eteint` : ACCORD.** Convention « champ : id ». Ma proposition `climat_active` était un anglicisme grammatical (climat est masculin) — retirée.
3. **QA champ manquant : ACCORD.** `{id, depuis}` rend les critères observables.
4. **NIA bloc CLIMAT séparé : ACCORD.** R3 est hors périmètre it4, donc le bloc narrateur ne nous concerne pas ici.

### Mes objections

- **O1 (docstring « registre joueur ») : MAINTENUE.** La docstring doit dire « registre interface ».
- **O2 (prop `pas`, jamais `tour`) : MAINTENUE.** `tour` est réservé au combat (types.ts:1404).
- **O3 (absence de placeholder sans climat = assumé) : MAINTENUE.** État calme, pas un vide.
- **O4 (dette `1px`/`bold`/`height: '1.5em'`) : MAINTENUE.** Les trois corrections sont dans le contrat de design du tour 1.

### Prop name

`climatNom?: string` — résolution en ligne par `EcranPartie`. TL adopte aussi ce nom.

**VERDICT** : recevable sous réserve (O1-O4 intégrées au code livré).
