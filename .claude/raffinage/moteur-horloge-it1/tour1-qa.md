# Tour 1 — QA

```
RISQUE      — Trois critères ne sont pas observables tel qu'écrits (AC2, AC3, AC8).
              AC3 dépend du narrateur R3 qui n'existe qu'en n° 10 — test impossible en it1.
              La sonde evaluate.test.ts:706 qui fige declencheur_expr à ['evaluate.ts'] survit
              parce que horloge.ts appelle evaluate(), ne consomme pas le champ directement.

OBJECTION   — AC2 « Un PNJ est bloqué » : mot-clé sans observable. Quelle assertion le prouve ?
              AC3 « Le narrateur R3 reçoit » : R3 n'existe que n° 10, pas testable ici.
              AC8 « moteurSansIA.test.ts reste vert » : garde-fou sans critère observable nommé.
              Cas limites cruciaux absents : borne duree inclusive/exclusive, rang max, plan vide.
              Ambiguïté sur `depuis` (KR-298) : tour du tick ? tour précédent ? non re-dérivable
              du journal, mais calcul exact jamais spécifié → bloquerait le test de non-régression.

PROPOSITION —
1. AC2 rewritten observably : « Quand tour − depuis ≥ duree ET declencheur_expr absent/faux,
   le rang ne progresse pas. Test : horloge.test.ts pnj_duree_echue_sans_declencheur_bloc. »
2. AC3 : soit dépendance explicite acceptée (it2 seulement), soit réécrite observable-it1 :
   « Le tick retourne changementsDe(avant, après) : {pnj_id, rang_avant, rang_apres}[]. »
3. AC8 rewritten : « Le test moteurSansIA.test.ts:tick_zero_effet_narratif valide qu'une
   commande + tick ne dérive qu'etape_plan, jamais un autre état de PNJ. »
4. Ajouter 4 cas limites obligatoires :
   - Plan vide : etape_plan undefined.
   - Declencheur + duree absents : rang ne change jamais.
   - Rang final atteint (rang === plan.length − 1) : plus d'étape.
   - Borne INCLUSIVE : tour === depuis+duree PROGRESSE (nommé : borne_inclusive_duree).
5. Spécifier `depuis` dans brain_contracts : « depuis := le tour EXACT auquel ce rang s'atteint.
   Immuable. Non re-dérivable. Calculé à l'assignment. »

VERDICT     — recevable sous réserve (3 critères réécrits, 4 cas limites ajoutés, `depuis` documenté).
```
