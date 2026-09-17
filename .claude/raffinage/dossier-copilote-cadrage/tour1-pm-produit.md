# Tour 1 — PM produit (`/cadrer dossier-copilote`)

RISQUE — Que l'itération 1 (squelette) soit bâtie sur « Éclater le synopsis » : c'est l'assistant le plus riche (création en lot de 9 fiches), il touche un garde-fou §2.8 (« aucune création d'entité ») écrit pour le jeu et jamais réécrit pour la rédaction, et il ouvre un doute sur les curseurs (destination `moteur`) face à la décision n°4. Un squelette qui commence par le cas le plus contesté n'est pas un squelette, il importe le débat non tranché dans le lot le plus visible.

OBJECTION — L'intention roadmap tient en une phrase sans « et » et se démonte en 3 assistants = 3 itérations. Mais un « panneau de diff » livré comme itération à part serait une couche horizontale déguisée : rien à accepter sans un assistant qui produit un texte. Le panneau n'est pas une itération, c'est un mécanisme que chaque assistant porte avec lui.

PROPOSITION — 3 itérations, une par assistant, chacune livrant SON propre diff/accepté-par-champ. Réordonnancement : it1 = « Compléter une fiche » (squelette : aucune création d'entité, réutilise une fiche existante, prouve la boucle IA→diff→`DossierService.update`) ; it2 = « Éclater le synopsis » (création en lot, n'entre en `/raffiner` qu'une fois la frontière rédaction/jeu écrite) ; it3 = « Tisser les indices », bornée strictement à la règle déjà détectée par `controlerDossier`.

VERDICT — **recevable sous réserve** (réordonnancement it1/it2 + clarification écrite de la frontière rédaction/jeu avant de figer it2 en raffinage).

## Phrase de démo de la feature
« À la fin de `dossier-copilote`, l'auteur peut accepter ou refuser, champ par champ, un texte proposé par l'IA. »

## Découpage proposé — 3 itérations

**It1 — « Compléter une fiche » (SQUELETTE)** — l'auteur ouvre une fiche personnage déjà commencée, demande à l'IA de proposer des curseurs, répliques types, plan d'actions ou relations avec les fiches déjà écrites, et accepte/refuse champ par champ ; l'acceptation passe par `DossierService.update`. C'est la tranche qui fait exister TOUT ce qui manque : route worker, service `brain/` d'appel modèle, contrat de sortie typé, comportement d'échec, mécanisme de diff. Bouchon assumé : une route worker à un seul rôle, un seul modèle, aucun réglage auteur — le routeur de modèle/effort reste un point d'extension nommé (décisions n°2 et n°3).

**It2 — « Éclater le synopsis »** — depuis synopsis + objectifs, l'IA propose une distribution de personnages avec objectif et phrase de caractère chacun, acceptée fiche par fiche via le chemin d'écriture existant. **Condition d'entrée en `/raffiner`** : la frontière rédaction/jeu du garde-fou « aucune création d'entité » écrite noir sur blanc AVANT le lot.

**It3 — « Tisser les indices » (bornée)** — sur un indice déjà signalé par `controlerDossier` (moins de deux producteurs), l'IA propose qui d'autre pourrait le connaître et à quelle condition ; accepté, cela s'écrit dans les `savoirs[]` du personnage désigné. Valeur restante = la PROPOSITION seule (un candidat nommé + une condition rédigée) ; réel mais étroit — gardé en itération pleine parce que c'est un troisième chemin d'écriture distinct, pas par volume.

## Hors périmètre de la feature entière
- Réglage auteur de la clé API / du modèle / de l'effort (décision n°2).
- Routeur multi-modèle/multi-effort livré — point d'extension nommé seulement.
- Panneau de diff comme surface indépendante.
- Toute proposition par le modèle d'un `…_expr`, d'un déclencheur ou d'un identifiant frappé (D1).
- Jets de dés, PV/XP/inventaire (décision n°4 ; hors sujet en Temps 1).
- « Répétition à blanc » (n°16).
- Repointage visuel de `tree-canvas`.
- Toute racine de schéma neuve — aucun lot contrat anticipé ; si un raffinage en découvre le besoin, lot contrat séparé et premier (Décision A).
- Hors-ligne / modèle local (D2).

## REJETÉS
1. **Panneau de diff en itération indépendante** — non démontrable seul, couche horizontale déguisée.
2. **Écran de réglage clé API/modèle/effort** — décision n°2 fixe un seul modèle et un seul effort ; aucun réglage n'a de valeur auteur.
3. **« Tisser les indices » étendu au-delà de « moins de deux producteurs »** — duplique « Compléter une fiche » sans valeur neuve.
4. **Ordre roadmap tel quel (Éclater le synopsis en it1)** — importe un garde-fou non résolu et le doute curseurs/décision n°4 dans le lot le plus visible.
5. **« Répétition à blanc » réintégrée ici** — déjà tranchée (n°16), exige le moteur.

## Avis d'ordonnancement (hors domaine de veto)
Oui, une tranche `outillage` devrait passer avant `/raffiner dossier-copilote 1` : `CLAUDE.md` mandate le miroir des `known_risks` dans `code-knowledge.json`, qui est au-dessus de son plafond et « ne reçoit plus rien d'ici là ». Contradiction opérationnelle à résoudre avant le raffinage, pas pendant.
