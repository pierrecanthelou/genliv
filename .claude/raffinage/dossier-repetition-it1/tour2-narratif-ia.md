# dossier-repetition it1 — Narratif & IA — Tour 2

RÉPONSE À UX (objections 2+4) et PM (proposition h). UX a raison. Le panneau est un outil auteur, pas une surface joueur. Montrer `nom` (identifiant interne) est correct : l'auteur cherche quel lieu dans son éditeur. `description_joueur` et `texte_ouverture_joueur` n'ont rien à faire ici — sorties joueur, pas diagnostics. Vocabulaire « arrêt » partout, « impasse » pour le seul motif impasse. PM converge avec (h) « Impasse pour un joueur qui ne fait qu'aller » — bon registre, factuel.

Conséquence : le panneau ne parle jamais en 2e personne. Il parle à l'auteur en 3e personne du joueur synthétique. Seule surface où cette règle s'applique.

MES OBJECTIONS
1. Affectation du héros non spécifiée : **MAINTENUE**. TL converge (séquentielle, bonus sur la plus faible). PM dit « bouchon ». Convergence suffisante pour spécifier : `rolls[i]` → `CHARACTERISTIC_VALUES[i]`, bonus 1D4 réparti un par un sur la plus basse, première en cas d'égalité. It2 remplace par l'étalon, mais it1 reproductible avec règle écrite.
2. Point d'extension `choisirDestination` : **MAINTENUE**. Non contredit. TL « rotation seedée » = une implémentation de `choisirDestination`. Site d'appel unique, sans interface ni abstraction.

Décisions en autonomie :
- Voix du panneau → 3e personne du joueur synthétique, jamais 2e personne.
- Affichage des entités → nom interne uniquement.
