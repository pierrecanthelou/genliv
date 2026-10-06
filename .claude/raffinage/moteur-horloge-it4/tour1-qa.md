## QA — moteur-horloge it4 — tour 1

**RISQUE** — Route climatique ouverte + contrat d'état incomplet. L'itération ajoute trois fonctionnalités (climat + bandeau + extraction session), mais deux décisions majeures ne sont pas tranchées : (a) l'activation du climat, (b) l'idempotence. En parallèle, le champ `climat_actif` n'existe pas dans `EtatSession.horloge`.

**OBJECTION**
1. **Champ manquant = critères non observables.** Le bandeau affiche CLIMAT · {nom}. D'où vient le nom ? De `horloge.climat_actif` — un identifiant qu'il faut lire dans `Climat` pour afficher son nom. Le champ n'existe pas, donc le test ne peut pas se boucler.
2. **Trois routes d'activation, aucune nommée.** Le raffinage doit trancher.
3. **Idempotence admise/documentée, pas implémentée.** Un climat qui se réactive doublerait les objets via `donner_objet`.
4. **Tests du bandeau incomplets.** Aucune prop `climat_actif` à passer, aucun test du texte « CLIMAT ».

**PROPOSITION**
1. Ajouter `climat_actif?: string` (ou `{ id, depuis }`) à `EtatSession.horloge`.
2. Trancher la route d'activation en raffinage.
3. Trancher l'idempotence.
4. Préciser les lots : l'extraction `sessionCombat.ts` rentre-t-elle dans les 4 lots ou précède ?
5. Ajouter une assertion bandeau : `climat_actif='tempete'` + `nom='Tempête de sable'` → affiche `CLIMAT · Tempête de sable`.

**VERDICT** — recevable sous réserve : les trois questions ouvertes doivent être tranchées ET le champ ajouté.
