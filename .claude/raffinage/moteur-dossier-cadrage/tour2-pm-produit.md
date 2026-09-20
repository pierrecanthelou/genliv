# TOUR 2 — pm-produit

RISQUE — L'it4 du tech-lead fusionne un lot feature (console) et un lot de
nettoyage (demolition). Pas un melange « faire marcher / durcir » interdit — la
demolition s'arme precisement parce que la console remplace les ecrans de noeud.
Mais le compte de lots (console UI + execution + demolition + tests) doit rester
<= 4 : a verifier au tour 3, pas encore un veto.

OBJECTION — Je RETIRE mon it4 « extinction du modele d'arbre » face au VETO
tech-lead (mesure : tree-canvas consomme 9+ symboles du baril, hooks.ts abonne
aux 8 evenements). Une iteration sans phrase de demo autoportante est exactement
le veto que je porte moi-meme. Je CONFIRME R8 du tech-lead : quetes[].etapes SORT
de la feature. => LA QA DOIT RETIRER SON CRITERE 6, il n'a plus de code a observer.

PROPOSITION — J'ADOPTE le decoupage a 4 tranches du tech-lead comme plan final.
memoire.faits_etablis : la regle d'admission du narratif clot ma question —
racine reservee a null, proprietaire n°10 ; ce n'est pas une 5e tranche, c'est
une ligne de type. La ligne « vos anciens livres restent stockes » reste VRAIE et
inchangee — hors perimetre n°9, aucune decision produit a prendre ici.

VERDICT — RECEVABLE (reserve du tour 1 levee), sous reserve du compte de lots d'it4.

## Decoupage final (N=4) — adopte du tech-lead
it1 Ouvrir son dossier en partie et lire le texte d'ouverture. Lot contrat
    premier : faits.ts, sessionDestinations.ts, port de stockage. Ni evaluateur
    ni delta.
it2 Se deplacer de lieu en lieu (lieux[].acces, lieu_courant, lieux_visites).
    Paye B1. Tranche tourzero (ii).
it3 Voir un jalon s'atteindre (projection typee, jamais declencheur_expr). Lot
    contrat : evaluerExpr/appliquerDelta + tourzero.ts (decision i) DANS LE MEME LOT.
it4 Rejouer un tour a la main depuis la console + LOT DE QUEUE : demolition des
    4 cibles consommatrices mortes. JAMAIS le modele d'arbre lui-meme.

## Hors perimetre revise
n°10-16 comme au tour 1 · quetes[].etapes -> n°12/14 (RETIRE du perimetre) ·
memoire.faits_etablis : racine reservee a null seulement, forme interne -> n°10 ·
demolition complete du modele d'arbre -> repointage tree-canvas apres le Temps 2 ·
ligne book-library inchangee, hors n°9 · aucune ecriture dans types.ts/
destinations.ts/validate.ts du DOSSIER (lecture seule pendant la partie).

## REJETES (PM)
1. « it4 = extinction integrale, iteration autonome » — RETIREE (ma propre
   proposition du tour 1), mesuree impossible, sans phrase de demo autoportante.
2. « l'enumeration roadmap tient en 4 iterations plates sans frontieres » —
   RETIREE, resolue par le decoupage fin (it1 lecture / it2 deplacement separes).
3. « quetes[].etapes et memoire.faits_etablis tiennent dans la n°9 » — CONFIRME
   REJETE cote PM.
