# Tour 1 — `pm-produit` · `dossier-controles` it8 (`canon-sans-objectif`)

**RISQUE** — La charge porte une contradiction interne aux AC : AC1 dit « quatre lignes … aucune sur une collection vide » (dossier neuf), AC2 dit « texte d'état calme » une fois les quatre proses réécrites, AC10 exige un BLOQUANT dès que `canon.objectifs` est vide. `objectifs: []` étant le semis de `amorce.ts:107`, AC10 s'allume sur 100 % des dossiers dès leur création ET reste allumé après les quatre proses réécrites (rien n'oblige à poser un objectif en même temps) : AC1, AC2 et AC10 ne peuvent pas être vraies ensemble. Livrer AC10 telle qu'écrite oblige en plus à modifier l'ASSERTION de `panneauControles.test.tsx` (4→5) et `dossierEditorScreen.test.tsx` (ALERTE→BLOQUANT, l.~383) d'une autre feature — la décision actée à it3 n'autorise que compléter le littéral injecté, « jamais l'assertion ».

**OBJECTION** — AC10 rouvre sans le dire la doctrine « absent ≠ vide » déjà posée par `etat_vide` du `design_contract`, et reproduit le motif déjà refusé à it1 (bandeau rouge tautologique à 100 % des dossiers, miroir de `SANS_COMPTE`). Un auteur qui vient de créer son dossier n'apprend rien à « vous n'avez aucun objectif » — il n'a encore rien écrit, et `jouable` est déjà faux via le bloquant existant sur `texte_ouverture_joueur`. Valeur pour l'auteur à t=0 : nulle.

**PROPOSITION** — Trancher à froid dans le sens de la cohérence : le linter reste silencieux sur `canon.objectifs` vide, comme sur toute autre collection. Retirer AC10 et la charge de l'it8 (rejet pur, sortie recevable) : −1 AC, −1 entrée de registre, 0 assertion de test d'une autre feature touchée. Si le comité veut malgré tout garder un garde-fou « dossier riche mais sans objectif », le reporter en itération dédiée avec un signal d'engagement distinct de « collection vide » — jamais glissé ici en réponse à une doctrine encore ouverte.

**VERDICT** — recevable sous réserve (retrait d'AC10 / de la charge telle qu'écrite ; sinon veto).

---

## Notes de l'orchestrateur

1. **Citation vérifiée, et elle est PLUS FORTE que le cadrage ne le disait.** J'avais cité AC1 + AC2 contre AC10. `plan.design_contract.etat_vide` de cette feature dit littéralement : « Le linter SE TAIT sur les collections vides — un dossier neuf n'a ni personnage ni indice, et c'est un état calme, pas un manque (doctrine « absent ≠ vide », posée par `amorce.ts` sur `Entite.nom` …) ». La contradiction est donc **AC1 + AC2 + `design_contract.etat_vide` contre AC10** — trois sources signées au cadrage contre une.
2. **Dérive de périmètre mineure** : la note statue en passant sur les charges « scission » et « racines », que le cadrage plaçait hors sujet. Sans effet sur ses conclusions ; non retenu comme position.
