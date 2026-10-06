# QA — tour 2 — moteur-horloge it3

**Réponses nommées** :
- TL O4 (garde source) : veto maintenu. La sonde jest doit grep explicitement : pas de `.duree` ni `.depuis` lus en dehors de `blocage.ts`.
- PM O3 et NIA O2 (étape 0 / origine) : testabilité équivalente, neutre.

**Statut des objections** :
1. Test depuis+duree absent : **retirée** — couverte par TL « depuis absent rien » + NIA « {rang:1} sans depuis rien ».
2. Avancement/blocage exclusifs : **maintenue**, absorbée dans test nommé `blocage.test.ts:avancement-emporte-blocage`.
3. Frontière si_bloque : **durcie en veto** — test manquant `si_bloque` posé + `etape_plan` absent → pas d'injection. Ni TL ni NIA ne l'ont nommé. Requis dans L2.

**Sonde it3a/it3b** : suffisante si elle ajoute un grep garantissant que `si_bloque` n'entre jamais sans `etape_plan` en contexte.

**Tests nommés exigés** :
- `blocage.test.ts:avancement-emporte-blocage`
- L2 : `si-bloque-sans-etape-plan-pas-injecte`
