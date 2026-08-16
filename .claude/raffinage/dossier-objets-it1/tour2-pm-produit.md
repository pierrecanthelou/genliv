# Tour 2 — PM — `dossier-objets` it1

## Réponses nommées

**QA (veto critère #3)** — Je le rejoins et je le renforce : un critère qui ne nomme ni mécanisme ni niveau de test est un critère qui laisse un ouvrier inventer le périmètre en cours de route — exactement ce que ma note de tour 1 visait déjà. Reformulation demandée : « boutons Monter/Descendre, test composant/user-event, ≥44px » — j'y souscris, ça ferme l'ouverture que j'avais signalée sans la formaliser.

**Tech Lead (KR-109, onReorder à un seul appelant)** — Ça confirme mon objection de tour 1 par un autre chemin : si le mécanisme est un contrat `brain/` neuf pour un seul consommateur réel, c'est un poids d'architecture disproportionné pour une tranche de squelette. Convergence utile.

**UX (« poignée de glisser » présupposée, pas tranchée)** — D'accord : le `design_contract` du cadrage nomme un mécanisme non actée en `resolved_decisions`. Rien ne m'empêchait de le corriger moi-même en tour 1 ; je ne l'avais pas vu écrit noir sur blanc, votre lecture est la bonne.

## Statut de mon objection (tour 1 : « et » liste/reorder)

**Retirée.** Motif : les 3 autres rôles convergent indépendamment sur le même mécanisme léger (boutons ▲/▼) que ma proposition — le risque que je nommais (« chantier UI neuve non câblable au clavier ») disparaît avec le choix du mécanisme, pas avec un fractionnement d'itération. La valeur reste une seule tranche cohérente ; inutile de la couper.

## Question structurante (ListRow : zéro code vs deux props)

De mon siège : **ça ne change rien au périmètre ni à la valeur livrée à l'auteur** — dans les deux cas il obtient les mêmes boutons, au même endroit, avec la même opérabilité clavier. C'est une question d'encapsulation/promotion (KR-109, KR-112), pas d'acceptance criteria. Je n'ai pas d'objection PM sur l'un ou l'autre choix — Tech Lead et UX tranchent entre eux ; je demande seulement que le critère #3 reformulé (accord QA ci-dessus) reste vrai quel que soit le choix retenu.
