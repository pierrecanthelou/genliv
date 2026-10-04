# QA — moteur-acteurs it4, tour 1

**RISQUE** — L'AC#7 (flux R4→CarteJet→résolution→R4) est non observable en l'état : qui, quand, avec quel contexte appelle R4 la seconde fois ?

**OBJECTION**
1. AC#7 mélange trois comportements distincts dans un seul critère (le flux complet). Non dissociable en cas d'échec de test.
2. Aucun test unitaire sur la porte `jet` elle-même dans `portesOuvertes` — seuls les tests d'intégration la couvrent indirectement.
3. AC#8 (bannière sur échec de validation) ne nomme pas la bannière.
4. KR-285 : le champ `resiste` dans `ReponseActeur` n'a pas de lecteur nommé dans cette itération.
5. Les cas limites ne sont pas énumérés : jet seul, jet + contrepartie encore fermée, second R4 invalide aussi, risque de cycle, double soumission du dé.

**PROPOSITION**
- Dissocier AC#7 en trois critères : (a) R4 rend `resiste` → la carte s'affiche ; (b) le joueur lance le dé → le jet est résolu ; (c) un second R4 est appelé avec l'issue → le savoir est confié.
- Nommer le lecteur de `resiste` : `useTourDeJeu` (lot feature).
- Dissocier AC#8 en deux cas de test : échec de validation de l'appel 1 (resiste invalide), échec de validation de l'appel 2 (indices manquants).

**VERDICT** — Recevable sous réserve : dissociation d'AC#7 (1), lecteur de `resiste` nommé (4), cas limites énumérés (5).
