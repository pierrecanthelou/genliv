# Editeur

## Objectif : 

Créer un éditeur facilitant la rédaction de « livre dont vous êtes le héro »

## Principe :

L’utilisateur créé un nouveau livre.

Le livre est composé d’un sommaire, le sommaire mène au premier écran.

Les différents écrans ont une description, éventuellement une illustration, éventuellement une liste d’objets à prendre, et une liste de choix menant à d’autres écrans.

Certaines pages sont des fins.

La mort d’un personnage le mène à une fin obligatoire du livre « Personnage décédé »

Les pages sont :

- une description menant à N-choix
- une interraction avec un PNJ
- une interaction avec le décors :
  - prendre un ou plusieurs objets
  - écouter
    - description si test réussi, et avantage
    - description si test raté, et rien ou désavantage
  - fouiller
    - description si test réussi, ajout d’un choix
    - description si test raté
- une interaction avec un piège
- une interaction avec un monstre

Contrairement aux jeux papier, il est possible d’utiliser des objets pour accomplir ou renforcer certaines interactions.

Contrairement aux jeux papier, un objet dans l’inventaire peut être un pré-requis caché à une proposition de choix.

Contrairement aux jeux papier, certaines actions peuvent ne pas constituer un nouveau choix et faire changer d’écran.

Les choix peuvent être soumis à un compte à rebours.

## Walking skeleton

Avoir toutes les étapes de la création ainsi que le modèle d’options de page, les interactions, les combats, la mort…

L’utilisateur est sur l’écran de départ de l’application

L’utilisateur créé un livre

	- un bouton simple de création
	- demande le nom du livre
	- va à l’édition de l'arbre

L’utilisateur peut visualiser la structure du livre sous forme d’arbre

L’arbre contient déjà les feuilles suivantes

- Le sommaire : simple zone de texte
- L’écran « mort du personnage  » (indépendant, feuille de rien)
- Une feuille c’est : 
  - description (zone de texte)
  - libellé de choix (input simple) NB : un libellé de choix est le texte qui servira de bouton dans un écran parent pour atteindre cet écran
  - une action qui doit être réalisée pour poursuivre
    - rencontre avec un monstre (toggle)
      - sélectionner un monstre
        - un seul monstre au début
      - texte si victoire
      - texte si fuite
  - toggle « fin victoire »
  - toggle « fin échec »

Chaque feuille/noeud est éditable

A chaque noeud on peut ajouter un nouveau branchem ent

Chaque noeud peut être relié à un noeud existant

La structure physique de données est cet arbre, c’est ce qui doit persister pour « un livre »



Une spécialité est un objet du code qui doit pouvoir interroger le livre, la feuille, le personnage :

- via l’API « noeud » ajouter ou effacer des noeuds de l’arbre
- via l’API « personnage » modifier les stats du personnage ou son inventaire