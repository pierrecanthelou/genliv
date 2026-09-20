# Tour 1 — qa — `dossier-canon` it5 (tranche B1, `lieux[].acces`)

**RISQUE** — La forme de `acces` n'est pas fixée dans le cadrage (liste `string[]` façon `mene_a[]`, ou arête structurée). Toute la testabilité (REFERENCES_SIMPLES vs machinerie neuve, contrat vs composant, self-référence KR-194) en dépend. Sans cette forme, aucun critère n'est observable par un instrument nommé.

**OBJECTION** — Le goal « l'auteur peut relier ses lieux les uns aux autres » n'est ni Étant-donné/Quand/Alors ni univoque sur le sens : rien n'exclut qu'un ouvrier lise « relier » comme une bascule symétrique automatique, ce qui romprait KR-013 (aucun inverse stocké/recalculé). Deuxième objection : le rider `validate.ts` (entityId absent sur les 4 sites d'avertissement) est soumis sans qu'aucun critère ne couvre ses deux issues possibles (dedans/différé) — la définition de fini reste floue tant que ce n'est pas tranché et écrit.

**PROPOSITION**
1. Fixer `acces?: string[]` (précédent exact `mene_a[]` : `REFERENCES_SIMPLES` à double `[]`, `LISTES_OPTIONNELLES_TEXTUELLES`, self-référence tolérée sauf arbitrage contraire) et écrire : « Étant donné lieux A et B existants, quand l'auteur ajoute B aux accès de A, alors A.acces contient B ET B.acces reste inchangé » — test contrat, discriminance sur 2 lieux distincts, nommant KR-013.
2. S'appuyer sur `couverture.test.ts` existant, qui rougit seul dès que `acces` manque dans `tables.ts`/`destinations.ts` OU dans l'une des 2 fixtures — pas de test de couverture ad hoc à écrire.
3. Critère « `atteignabilite.ts` non modifié » (KR-224 hors périmètre), vérifiable sur le diff/lot.
4. Rider : trancher dedans/différé avant l'essaim ; si différé, l'écrire en known_risk nommé, jamais en silence.

**VERDICT** — recevable sous réserve.
