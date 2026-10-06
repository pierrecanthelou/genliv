# Tech Lead — moteur-horloge it2 — TOUR 2

## Réponses croisées
- **PM coupe** : acceptée, MAIS veto durci : `depuis = horloge.tour` écrit à l'avancement RESTE en it2. Son lecteur est la sélection du bloc. KR-249 respecté.
- **NIA O1 (12e chemin)** : le compte est faux. Les 8 sont hors monde.personnages[]. Le chemin vit dans contexte/horloge.ts avec garde propre. Garde contexte.test.ts:3094 intacte.
- **NIA O2** : concédé pour sessions 0.7.21 (rang sans depuis) = jamais en échéance.

## Statut objections
- O1 (tri-état) : **retirée**. Servait la minuterie, abolie. Le booléen suffit.
- O2 (duree sur k) : **maintenue**, correction doc J2.
- O3 (bloqué sans lecteur) : sort d'it2. Reposée it3.
- O4 (budget) : **maintenue**. Prose non bornée, M franchit 2000, max worker bouge.

## Proposition révisée
`changementsDuPas` abandonnée (un seul appelant). Sélection inline dans contexte/horloge.ts. Bandeau sort d'it2. Deux lots contrat séquentiels, zéro lot feature.

## ANNEXE — lots révisée
| id | titre | type | ouvrier |
|---|---|---|---|
| L1 | Moteur : depuis écrit, J2 réécrite | contrat | dev-contrat |
| L2 | Narrateur : bloc PENDANT CE TEMPS, budget, max worker | contrat | dev-contrat |

### L1 (8 fichiers)
docs/REGLES-PLAY.md (R), faits.ts (R), sessionDestinations.ts (R), horloge.ts (R), horloge.test.ts (R), commandes.test.ts (R), sessionCouverture.test.ts (R), session-saturee.ts (R).

### L2 (6 fichiers)
contexte/horloge.ts (N), narrateur.ts (R), contexte.test.ts (R), worker/index.ts (R), worker/index.test.ts (R), worker/frontiere.test.ts (R).

## n°14 en 4 itérations
- it2 : depuis + R3 (2 lots contrat)
- it3 : durée + bloqué + si_bloque
- it4 : climat + bandeau PAS #n + CLIMAT

## Décisions en autonomie
- depuis absent (sessions 0.7.21) ≡ jamais en échéance (distinct de etape_plan absent ≡ rang 0)
- changementsDuPas inline (un seul appelant)
- Chemin action dans constante propre, garde dédiée
- Bloc hors cascade
- PAS #n en it4 avec climat (rouvrir BandeauHeros une seule fois)
