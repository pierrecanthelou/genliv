# Tour 1 — `pm-produit` · `dossier-fiches` it3

```
RISQUE      — Le vrai danger de cette itération n'est pas dans son périmètre produit
              (correct) mais dans sa résolution technique : `stats?: Partial<Record<
              Characteristic, number>>` est une forme NEUVE (Record à clés fixes) que le
              walker de `couverture.test.ts` descend feuille par feuille — 8 lignes
              `DESTINATION_DES_CHAMPS`, pas une. Le risque pour l'auteur : que le comité,
              en butant là-dessus, se mette à concevoir un mécanisme générique de
              « dispense Record » réutilisable — ce qui pré-résoudrait silencieusement it6
              (curseurs, même forme) dans une itération qui ne le demande pas. C'est
              exactement le biais que je dois surveiller, déplacé sur l'architecture
              plutôt que sur le produit.

OBJECTION   — Le texte du goal écrit « bornes 1..CHARACTERISTIC_MAX » en nommant une
              seule des deux bornes : `CHARACTERISTIC_MAX = 12` existe, aucun
              `CHARACTERISTIC_MIN` n'existe. KR-165 (bornes nommées) est listé comme
              applicable au cadrage ; la définition ne s'applique pas à elle-même sur sa
              propre phrase.

PROPOSITION — (1) Écrire dans le lot contrat, noir sur blanc, que les 8 lignes de
              destination sont saisies à la main (`'moteur'` × 8, une par
              `CHARACTERISTIC_VALUES`), et qu'aucun mécanisme générique de wildcard n'est
              ouvert pour it6 — décision fermée ici, pas un chantier transverse.
              (2) Nommer `CHARACTERISTIC_MIN = 1` dans `characteristics.ts`, ou documenter
              explicitement pourquoi 1 reste littéral. Rien à retirer côté périmètre
              produit — l'itération reste une seule tranche.

VERDICT     — recevable sous réserve (les deux points ci-dessus, avant lot contrat).
```
