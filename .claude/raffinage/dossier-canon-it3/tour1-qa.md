**RISQUE**

D1 pose `alerteSansExpr: true` sur les deux familles d'objectif (`tables.ts`, `FAMILLES_DE_CONDITIONS`) : `validate.ts:596-618` émet `condition-sans-expr` (warning) dès qu'un `…_texte` est renseigné sans son `…_expr`. Or it3 exclut explicitement tout éditeur d'expression — donc **chaque objectif créé déclenchera systématiquement ce warning dès la première saisie**, pas dans un cas limite mais dans le chemin nominal. La résolution `RAFFINAGE it2` de la spec affirme noir sur blanc « KR-183 ne s'applique qu'à Canon parmi les itérations livrées à ce jour » — cette phrase devient fausse à it3 et personne ne l'a corrigée.

**OBJECTION** (veto)

Le critère d'acceptation objectif (« il choisit un camp… et rédige reussi_si_texte/echoue_si_texte ») ne mentionne aucun rendu de warning. KR-183 exige pourtant que tout `warnings` non vide sur écriture réussie soit rendu à l'écran, pas seulement retourné — c'est précisément le trou que KR-183 a été écrit pour fermer, et c'est le chemin normal ici, pas un cas limite. Sans un critère explicite + un test composant (« créer un objectif avec `reussi_si_texte` seul commit et affiche `condition-sans-expr` à l'écran »), ce comportement peut régresser silencieusement en it4+.

**PROPOSITION**

1. Ajouter le critère manquant, niveau composant (RTL), avec l'assertion exacte du texte de warning.
2. Confirmer par la spec où vivent le `Refus`/`commit()` des cartes objectif — l'`open_question` déjà notée (slot unique de refus) est directement aggravée si les objectifs partagent le même `Refus{champs,issues}` que Canon ; sinon nommer le 3ᵉ `commit()` comme prévu.
3. `couverture.test.ts` couvre `camp` génériquement (corruption + 4ᵉ assertion) dès qu'il entre dans `ENUMERES_FERMES`+`destinations.ts`+fixture — aucun test dédié requis, à écrire dans la définition de fini.

**VERDICT**

Rejet en l'état — critère KR-183 manquant sur le chemin nominal des objectifs. Reste correct par ailleurs (camp bien couvert par l'instrument existant, D1 respecté, pas de score de mutation applicable).
