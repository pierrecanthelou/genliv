# QA — moteur-horloge it2 — TOUR 2

## Réponse au TL
O1-O3 (tri-état, duree, si_bloque) : valides et nécessaires. Tests requis.
O4 (budget) : valide et séparable.

## Statut objections
- O1 (critère mélange construction/narratif) : **retirée**. Observable = ligne journal + contrat R3 séparés.
- O2 (filtre spatial) : **retirée**. UX nomme le filtre : presence[].lieu_id === lieu_courant.
- O3 (architecture changementsDe) : **MAINTENUE EN VETO**. Le plan doit expliciter changementsDuPas dans brain_contracts avec signature et type. Sans explicitation, la testabilité dépend d'une déduction.

## Verdict
Recevable si :
- Architecture changementsDuPas explicite dans brain_contracts avant code
- TL O1-O3 intégrées
- Trois lots figés

Points validés : depuis absent ≡ 0, perceptibilité = présence lieu courant, session.ts pas rouvert.
