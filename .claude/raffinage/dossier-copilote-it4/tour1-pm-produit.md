# Tour 1 — `pm-produit` · `dossier-copilote` it4

**RISQUE** — un lot de fiches SANS NOM peut devenir une corvée de nommage déguisée en assistance : si une fiche proposée ne porte aucun contenu distinctif, accepter/refuser « Personnage n°3 (sans nom) » est un geste aveugle, pas une décision d'auteur. ⚠ **Le risque n'est pas l'absence de nom, c'est l'absence de TOUT le reste.**

**OBJECTION** — le `goal` tel qu'écrit **ne garantit rien sur le contenu de chaque fiche**. `fonction` est optionnel dans le contrat général `CHAMPS_PROPOSABLES` (pensé pour un champ d'une entité **existante**) ; rien n'oblige ce rôle-ci à le rendre obligatoire. Un brouillon `{ id, portee, plan_actions: [], savoirs: [] }` sans `fonction` ni rien d'autre est **indiscernable d'une création manuelle vide** — le copilote n'aurait alors produit aucune valeur, seulement N clics.

**PROPOSITION** — deux mesures, aucune n'élargit la tranche :
1. Dans le **schéma de sortie propre à ce rôle** (pas le contrat général), **`fonction` devient un champ REQUIS de la fiche** — *c'est le rôle dans la distribution, pas le nom, qui porte la valeur de « distribution de personnages »*.
2. L'affichage **réutilise tel quel le précédent déjà livré et testé** `panneauPersonnages.test.tsx:138` — « **Personnage n°N (sans nom)** » — comme ancre de chaque fiche en attente : aucune UI de nommage neuve, aucun état vide à inventer, **le nommage reste différé à l'auteur exactement comme en création manuelle aujourd'hui**.

**Ce que je retire en échange** : `apparence` et `description_joueur` restent **optionnels** en v1, aucune garantie de les voir remplis.

**VERDICT** — **recevable sous réserve** : `fonction` obligatoire dans le schéma de sortie de ce rôle, précédent « sans nom » réemployé sans réinvention. Le reste du cadrage (ordre, sans-rattachement-objectifs, brouillon-sans-identité) est correctement hérité et **non rouvert**.
