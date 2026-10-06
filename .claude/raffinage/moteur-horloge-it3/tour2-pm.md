# PM Produit — tour 2 — moteur-horloge it3

**Réponses nommées** :
- NIA O2 et TL O3 (étape 0) : adopte NIA P2, absent ⇒ origine 0. Preuve : `dossier-reference.json` Sélène (duree 4) et Corvin (duree 2) inatteignables sinon. `session.ts:598` pose `horloge: { tour: 0 }`.
- UX O2, TL O1, NIA O1 (`===`) : adopté. J2 lignes 4 et 7 à réécrire.
- TL O4 (garde source) : appuyé.
- QA O2 (exclusion) : appuyée, avec précision — l'avancement l'emporte est une règle, pas une conséquence de DUREE_MIN.

**Statut des objections** :
1. Goal liste de champs : **retirée** — phrase de démo adoptée.
2. Deux sites KR-246 : **retirée** — prédicat unique, unanimité.
3. Étape 0 : **durcie en veto** sur « absent ⇒ jamais ».
4. J2 règle 8 : **maintenue** — réécrite avant le code.
5. CHEMIN_SI_BLOQUE : **maintenue** — constante et garde propres.

**VERDICT** : recevable sous trois conditions — origine 0 écrite dans J2, `===` écrit dans J2, règle 8 réécrite, avant le code de L1.
