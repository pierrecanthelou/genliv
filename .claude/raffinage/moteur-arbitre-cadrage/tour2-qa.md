# Cadrage n°11 `moteur-arbitre` — Tour 2 — QA

## RISQUE
Deux implémentations concurrentes pour les caracs du héros produisent des arbres de tests incompatibles : si le code tire 2D4×8 via `alea(graine,'heros')`, c'est une fonction pure testable unitairement ; si on réutilise `CharacterCreationScreen.tsx` existante, c'est une dépendance à l'IHM créative qui n'existe pas en moteur autonome. Divergence non tranchée = risque d'impasse architectural.

## OBJECTION TOUR 1
« R3 doit être branché dès l'it1 pour éviter le no-op invisible » — **SATISFAITE** par le découpage narratif-ia. IT1 = jet binaire COMPLET (routage+R2+résolution+R3) est strictement plus fort que PM/tech-lead (qui séparent héros et dé en 2 itérations distinctes). Le contrat détaillé (schéma R2, 6 prédicats, attente persistée) clarifie aussi mes questions ouvertes : R1/R2 articulation (code vérifie `dangers` non-vide AVANT R2 — contredit ma proposition « dangers hors it1 », accepté) ; UNE seule itération pour le jet complet.

Score de mutation : **j'accepte le raisonnement de tech-lead**. RNG isolé dans `brain/dossier/alea.ts` (hors des 4 fichiers mutés) = aucun déclic. Cela liquide mon incertitude tour 1.

## PROPOSITION
Avant de lancer l'implémentation, arbitrer par écrit :
- Approche A (narratif-ia) : le CODE tire les caracs via `alea(graine,'heros')` — testable, déterministe, bon pour un squelette.
- Approche B (PM/tech-lead implicite) : réutiliser `heroGen.ts` + passer le héros créé par le joueur — couple l'IHM créative au moteur.

Pour un squelette, A est plus simple. Choisir A ou B explicitement **avant l'essaim**.

## VERDICT
Objection tour 1 **RETIRÉE** (satisfaite). Score de mutation **ACCEPTÉ** (RNG isolé, pas de déclic). Défaut résiduel **BLOQUANT** : confirmer la source des caracs du héros — elle détermine l'arbre de tests du contrat.
