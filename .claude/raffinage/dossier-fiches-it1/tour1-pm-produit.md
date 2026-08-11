# Tour 1 — PM Produit

```
RISQUE      — L'accordéon « s'ouvre sur le bloc Identité » (critère #1) mais le seul contenu que cette itération écrit est camp/plan/objectif_id — aucun de ces trois n'est un champ d'identité. Si le mapping bloc→champ n'est pas fixé avant le build, on risque soit un bloc Identité ouvert et vide au premier essai (mauvais squelette : la première chose que voit l'auteur est du placeholder), soit un placement de camp/plan qui devra bouger quand it2 arrivera avec fonction/apparence/description_joueur — retouche du même fichier deux itérations de suite.

OBJECTION  — Le sort de « nom » n'est écrit nulle part. Le design_contract dit « nom reste Entite.nom, inchangé » (= cette feature n'y touche pas) ; l'acceptance criterion #1 acte explicitement « Personnage n°N (sans nom) » pour it1 ; et le goal d'it2 (« fonction, apparence, description_joueur ») ne mentionne pas nom non plus. Contrairement à Lieu (nom édité dans FicheLieu dès la première fiche), rien ne garantit qu'un Field « NOM DU PERSONNAGE » existe avant la fin des 5 itérations de « l'écran le plus important du produit ». Ce n'est pas une réouverture de la découpe en tranches de schéma (close) — c'est une case vide qu'aucune itération ne revendique.

PROPOSITION — Avant de coder : (1) fixer par une ligne au design_contract quel des 8 emplacements porte camp/plan/objectif_id en it1 (candidat naturel : le bloc « Identité » devient « Identité & Position », ou camp/plan sortent de l'accordéon en header de fiche persistant) ; (2) faire écrire noir sur blanc, dans le goal d'it2, que le Field nom rejoint fonction/apparence/description_joueur dans le bloc Identité — sinon l'ouvrir en open_question avec propriétaire nommé.

VERDICT     — recevable sous réserve
```
