# Tech Lead — tour 2 — moteur-horloge it3

**Réponses nommées** :
1. NIA O2/P2 et PM O3 (étape 0) : tranche par rang. `etape_plan` absent ou `{rang:0}` sans `depuis` → origine 0. `{rang≥1}` sans `depuis` → jamais en échéance. KR-251 tient. `faits.ts:53-60` réécrit en L1.
2. Nom du prédicat : `etapeBloqueeAuPas` gardé. Rend `{rang, courante}`, pas un booléen.
3. PM O4 (règle 8) : reformulée. Le tick ne lit pas `depuis`, c'est `blocage.ts` qui le lit. Gardes `horloge.test.ts:788` et `:802` restent vertes.
4. NIA `destinations.ts` : hors lot. Les l.217-223 ne mentent pas. Les docstrings à amender sont dans L2.

**Statut des objections** :
1. `===` : **maintenue**.
2. `continue` : **maintenue** — fusion en un seul if avancer+continue, constat ensuite.
3. Étape 0 : **tranchée** (point 1).
4. Garde source : **retirée** — `blocage.ts` résout.
- Veto durci : si R3 lit la ligne de journal pour décider.

**Amendements au tour 1** :
- `ConstatDeBlocage.etape` → `courante` (homonyme KR-198).
- `worker/index.test.ts` sort de L2 (pas de pin statique).

**VERDICT** : recevable. L1/L2 confirmés.
