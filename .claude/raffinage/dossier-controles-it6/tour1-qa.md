# Tour 1 — qa — dossier-controles it6

RISQUE — Le "point fixe" annoncé ne sera jamais mis à l'épreuve d'une vraie itération. Les deux seuls changements de comportement nommés (cycle A↔B, auto-boucle A→A) convergent tous deux en zéro propagation dès la première passe : un simple filtre "producteur externe uniquement" les fait déjà basculer en bloquant, sans qu'aucune boucle `while (change)` ne soit nécessaire. Un algorithme à une seule passe (non-fixed-point) passerait donc les deux tests annoncés sans être un point fixe — exactement le mode de panne "instrument qui ne sait pas échouer" que la skill signale.

OBJECTION — La définition ne cite aucun cas de propagation POSITIVE à >= 2 sauts (producteur externe → A → B → C, C sans autre source). Sans lui, KR-197/202 (une entité qui déclenche, une qui ne déclenche pas, dans le MÊME test) n'est pas tenu pour l'algorithme lui-même, seulement pour le seuil de la règle.

PROPOSITION — Exiger dans `atteignabilite.test.ts` un test chaîne à 3 arêtes (externe→A→B→C) prouvant que C compte comme produit, pairé au cas négatif (chaîne rompue, B sans arête vers C) où C reste sans producteur. Exiger aussi que `controles.test.ts:744` (`toEqual(['controles.ts'])`) soit nommément listé dans le plan comme assertion à réécrire en `['atteignabilite.ts']` — le test le sait déjà (son propre commentaire l'anticipe) mais rien ne garantit que ce soit fait sans qu'un lot le nomme.

VERDICT — recevable sous réserve.

---

## Note de l'orchestrateur sur cette note

**L'ANNEXE MANDATÉE N'A PAS ÉTÉ RENDUE.** Le cadrage demandait trois relevés MESURÉS, dont aucun n'est livré :

1. le décompte exact des assertions qui basculent, et les suites voisines touchées (`suffisance`, `couverture`, `validate`, `roundtrip`, `amorce`, `pastilles`, tests de la feature) ;
2. **le rapport de `dossier-reference.json` sous saturation** — le risque de régression silencieuse n° 1 de l'itération, qualifié tel quel dans le cadrage ;
3. le devenir des balayages de source de `controles.test.ts` quand leur cible déménage (une garde qui balaie un fichier dont le code est parti devient **verte et vide**).

Le tech-lead a prédit « inchangé » sur les points 1 et 2 en écrivant lui-même « prédiction à MESURER, pas à croire ». **Personne n'a mesuré.** C'est la charge explicite du tour 2 pour ce rôle — la skill est catégorique : une affirmation sur la couleur d'un test se mesure, elle ne se déduit pas.
