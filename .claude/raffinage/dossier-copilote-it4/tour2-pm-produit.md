# Tour 2 — `pm-produit` · `dossier-copilote` it4

**ARBITRAGE DEMANDÉ (champ 2) — JE TRANCHE POUR `but.libelle`** (narratif), contre `description_joueur` (tech-lead), **sur la VALEUR, pas sur le risque.**

> **La démo dit « distribution de personnages », pas « portraits ».** Distribuer, c'est **répartir des rôles dramatiques dans une histoire**, pas décrire des réputations.

L'auteur qui lit une fiche décide sur ce qui est **actionnable pour son intrigue** : « ce que ce personnage **veut** » dit s'il **crée du conflit**, s'il **mérite d'être gardé**, ou s'il **double un objectif déjà posé** — **c'est une décision d'auteur**. « Ce qui se dit de lui » est de la **couleur passive**, **déjà servie ailleurs** (`personnage-prose`, sur fiche existante) : la reproduire ici **n'ajoute rien**.

⚠ **Techniquement les deux options coûtent pareil** — type bespoke `FicheBrouillon`, pas une extension de `CHAMPS_PROPOSABLES` (le rejet tech-lead n° 2 vaut pour les deux). **Donc seule la valeur tranche. `but.libelle` gagne.**

**BORNE DE SORTIE — je confirme 3.** Coût nul (`BORNE_EN_TOUTES_LETTRES[3]` existe déjà), et **ça sert la boucle voulue** : petit lot, l'auteur presse à nouveau **plutôt que de digérer un déversement**.

**CITATION CORRIGÉE, ACCEPTÉE** — `localiserEntite` (`identifiers.ts:242`), et **surtout le second précédent trouvé par l'UX** (`PanneauJalonsFins.tsx`, **littéral** pour un brouillon **non persisté**, **plus proche de mon cas** que le repli indexé) remplacent ma citation erronée de `panneauPersonnages.test.tsx:138`. **Conclusion MAINTENUE** : aucune UI de nommage neuve, nommage différé exactement comme en création manuelle.

## Statut de mes objections du tour 1
| Objection | Statut | Motif |
|---|---|---|
| `fonction` REQUIS dans le schéma de sortie de ce rôle | **MAINTENUE — et ACTÉE par les deux postes à effort élevé** | close, non rouverte |
| Le `goal` ne garantit rien sur le contenu de chaque fiche | **RETIRÉE** | comblée par le requis ci-dessus plus le second champ |

**VERDICT — RECEVABLE, aucun veto de ma part.** Les deux arbitrages ci-dessus (champ 2 = `but.libelle`, borne = 3) sont ma contribution décisive ; le reste (registre `libelles.ts`, découpage, prédicats) est du terrain tech-lead/narratif/UX, **bien tenu et non rouvert par moi**.
