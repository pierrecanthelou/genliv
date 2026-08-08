## Consensus téléchargement — je rejoins

Je rejoins PM + Tech Lead : report à **n° 2**. Il n'y a aucune ligne de l'éditeur où accrocher un bouton Export sans inventer un écran — `LibraryScreen.tsx` ne liste que `books`, jamais les dossiers, et son propre `REASSURANCE_TEXT` le dit. Inventer la surface serait KR-156. Rien à livrer sur ce point en it5.

## Réponse nommément à NARRATIF (scène figée / `texte_ouverture_joueur`)

Je rejoins la reformulation mécanique : `charpente.depart.texte_ouverture_joueur` non vide **et** destination `moteur`. Sur la question posée — pas de `BUDGET_MOTS_*` nommé pour ce champ, et je ne le propose pas.

Les deux budgets existants (`BUDGET_MOTS_CANON`, `BUDGET_MOTS_JALON`) bornent un **coût d'injection** : ce sont des blocs lus par le modèle, dont le contexte grossit. NARRATIF le confirme lui-même en annexe tour 1, ligne 24 : `texte_ouverture_joueur` est « scène **émise verbatim par le moteur**, pas du contexte » — jamais injecté. Poser une borne de longueur ici serait un chiffre sans lecteur, exactement le défaut qui a fait retirer `BUDGET_CONTEXTE` en it2. Ce n'est pas mon terrain aujourd'hui.

Ce qui *est* mon terrain : le registre. L'exemple actuel de la fixture — « Vous poussez la porte de l'auberge du Fanal ; la salle se tait. » (`dossier-minimal.json:121`) — respecte déjà la fiction (deuxième personne, présent, immersif, zéro fuite de vocabulaire d'interface) et fait un bon gabarit. Je le retiens comme valeur canonique, à ne pas retoucher pour cette itération. Je note pour mémoire (aucune action ce tour) : ce champ n'a **aucune surface d'édition** aujourd'hui — pas de zone « Point de départ » dans le wireframe listé. Le jour où une itération ouvre cet écran, le placeholder à réutiliser est cette même phrase-gabarit (amorce fiction, pas un champ vide) — je l'écrirai alors dans un contrat de design, pas ici : it5 est données + test seul, aucune UI touchée.

## Statut de mes objections tour 1

- **RISQUE** (surface inventée / KR-156) → **maintenue comme condition pour n° 2**, sans objet pour it5 (reporté, rien à valider ce tour).
- **OBJECTION** (aucune ligne dans `LibraryScreen`, aucun glyphe « télécharger » dans le jeu canonique) → **maintenue pour n° 2**, non durcie : rien de nouveau ne la contredit ni ne l'aggrave ce tour.
- **PROPOSITION** (étendre `ImportDossierButton.tsx`, patron `retryButtonStyle`, texte « Télécharger le fichier ») → **conservée telle quelle**, sans objet ce tour, à reprendre mot pour mot en n° 2.
- **VERDICT** tour 1 (« recevable sous réserve ») → **devenu sans objet** : plus de surface à juger en it5.

## Annexe révisée

Aucun contrat de design nouveau pour it5 — confirmé données + test seul, zéro composant, zéro token, zéro placeholder à écrire ce tour. Deux éléments à garder en mémoire pour l'itération qui les rouvrira :

1. **n° 2 (export)** : bouton = extension d'`ImportDossierButton.tsx`, texte exact « Télécharger le fichier », patron `retryButtonStyle` ; pas de glyphe (aucun symbole « télécharger » dans le jeu Unicode canonique) — lien texte seul.
2. **Écran « Point de départ » (itération non désignée)** : quand ce champ gagnera une zone de saisie, placeholder = amorce fiction sur le modèle de « Vous poussez la porte de l'auberge du Fanal ; la salle se tait. », jamais un champ vide ; libellé d'interface en mono capitales, ex. `TEXTE D'OUVERTURE — lu par le joueur`, pour marquer la frontière avec le registre fiction du contenu lui-même.
