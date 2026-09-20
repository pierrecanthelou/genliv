# TOUR 1 — narratif-ia — cadrage n°9 moteur-dossier

RISQUE — L'etat de SESSION n'a AUCUNE table d'audience. destinations.ts couvre le
dossier seul. Or journal[].texte, memoire.* et attente.payload iront au modele.
La n°9 rouvre cote session la cachette fermee cote dossier : un champ de prose
sans ligne d'audience, injecte sans qu'un test rougisse.

OBJECTION 1 — memoire (3 champs) et attente (4 variantes) figes sans AUCUN
consommateur. Pas KR-013 (rien n'est derive), mais aussi cher : la n°9 decide a
la place de la n°10 la politique de memoire que le roadmap lui attribue
nommement, et pose trois etats illegaux representables.
OBJECTION 2 — « Aucune generation de texte » est la propriete definissante et
n'est verifiable par RIEN. Dans six iterations personne ne la relira.

PROPOSITION — (1) sessionDestinations.ts + son balayage, lot contrat, en premier.
(2) journal[].deltas = { delta, cibles, origine, effet } avec le scenario
separateur « delta demande deux fois ». (3) Projection des jalons en TYPE NOMINAL,
prouvee PAR VALEUR. (4) Test-grep : zero fetch, zero CopiloteService.

VERDICT — recevable sous reserve. Reserves 1 et 2 deviennent VETO au tour 2 si
elles ne sont pas au plan.

## Regle d'admission retournee vers la session
« Un champ de session n'entre en n°9 que si un chemin de code de la n°9 l'ECRIT
et un autre le LIT. Sinon, seule la CLE RACINE est reservee, a null, avec son
proprietaire nomme. »

FIGER : schema, dossier_id, graine_alea, horloge.tour, heros, monde.lieu_courant,
  lieux_visites, jalons_atteints, evenements_consommes, indices_connus,
  pnj.<id>.a_dit, journal (forme cadree), combat, attente VARIANTE PAR VARIANTE.
RESERVER : horloge.climat_actif (n°14, KR-207) · pnj.<id>.confiance (la CLE, pas
  l'echelle — n°12) · memoire = null (n°10).
A INSTRUIRE (tech-lead) : monde.pnj.<id>.sait — aucun lecteur en n°9 ET
  possiblement derivable de personnages[].savoirs + revelations -> 6e KR-013.
REFUSER DE FIGER : memoire.*, l'echelle de confiance, l'union complete
  d'attente.type, toute borne d'injection (n°10), PorteeContreMesure (n°12), DT (n°11).
=> La CLE RACINE est le point d'extension nomme ; la FORME INTERNE ne l'est pas.

## journal[].deltas — les DEUX
Le journal est un CONSTAT, jamais une ENTREE du rejeu. Le rejeu reconstruit
depuis (dossier + graine_alea + entrees joueur) ; relire journal[].deltas n'est
pas un rejeu mais une relecture, et un bug d'application devient invisible.
Forme : { delta: DeltaId, cibles: string[], origine: string (identifiant stable :
'jalon.x' | 'evenement.y' | 'commande.<id>'), effet: 'applique'|'sans_effet' }.
SCENARIO SEPARATEUR OBLIGATOIRE : demande et applique COINCIDENT toujours au
nominal. Le seul etat separateur est UN DELTA DEMANDE DEUX FOIS (2e -> sans_effet).

## Projection des jalons — trois gardes, deux mecaniques
1. TYPE NOMINAL { jalon_id, enonce }[], jamais un Pick (un Pick se re-elargit
   d'un mot en revue).
2. GARDE PAR VALEUR : serialiser la projection sur la fixture reelle et chercher
   la SOUS-CHAINE du declencheur_texte. Mutant a ecrire et verifier ROUGE :
   jalons.filter(atteint) rendu tel quel. Un test de FORME reste vert dessus.
3. LECTEUR UNIQUE : test-grep, aucun autre fichier du perimetre ne lit
   charpente.jalons.

## L'indecidable — le lieu precis du risque est tourzero.ts
Decision (i) = OUI (declencheur_expr resolus avant la 1re action) MET H6 EN
DEFAUT DANS SA SEULE DIRECTION INTERDITE : H6 nomme elle-meme le canal (« un
effet[] de JALON part au declenchement, sans scene jouee »). Un jalon declenche
sur lieu_courant_est(<depart>) applique son effet[] au tour zero ; si c'est
reveler_indice, indice_connu n'est plus certain-FAUX et la table asserte faux la
ou la verite est vrai — FAUX POSITIF.
=> EXIGENCE : la n°9 touche tourzero.ts DANS LE MEME LOT ou elle prend ces
   decisions. Lot contrat, seul et premier.
LE MOTEUR EST BIVALENT, et sa bivalence n'est saine QUE parce qu'une porte la
precede : un evaluateur bivalent qui rend false sur entree malformee produit TRUE
sous un non. Le moteur y echappe UNIQUEMENT si aucune partie ne s'ouvre sur un
dossier portant une anomalie bloquante d'expr. DONC le branchement de
RapportControles.jouable N'EST PAS UNE COMMODITE D'ERGONOMIE : C'EST LA
PRECONDITION DE CORRECTION DE L'EVALUATEUR. Mutant : evaluateur rendant false sur
noeud inconnu -> une FIN se declenche au tour 1.
DEUX EVALUATEURS, JAMAIS UN : tourzero repond « deja etabli AVANT toute action,
sur un document SANS etat » ; le moteur repond « vrai MAINTENANT, avec un etat ».

## Gardes exigees au plan
C1 sessionDestinations.ts dans brain/ + balayage de fixture de session (echec par
   NOM de champ sans destination), modele couverture.test.ts.
C2 journal[].role = registre ferme. En n°9 : 'joueur' | 'moteur'. Aucune variante
   'narrateur'/'ia' avant que la n°10 en soit proprietaire.
C3 journal[].texte recoit sa ligne d'audience explicite (avis : moteur en n°9).
C4 l'entree de journal portant une prose EMISE VERBATIM est distinguable d'une
   prose narree (par role, pas par un champ de plus) — sinon la n°10 resume au
   tour 40 le texte d'ouverture ecrit pour ne jamais bouger.
C5 BORNE DE PERSISTANCE du journal, MESUREE (distincte de la borne d'injection,
   qui est n°10). Minimum acceptable : « on garde tout, mesure a X ko / 100 tours ».
C6 tourzero.ts bouge dans le lot contrat, avec ses deux decisions ecrites.
C7 moteur-dossier.sansIA.test.ts, prouve par son mutant (ajouter l'import,
   verifier ROUGE, retirer). Precedent maison : lintIsolation.test.ts.

## REJETES (a recopier au registre des desaccords — BUG-082)
R1 figer memoire.{resume_long,resume_recent,faits_etablis} en n°9.
R2 figer l'union complete attente.type (3 etats illegaux representables).
R3 journal[].deltas portant SEULEMENT l'applique, ou SEULEMENT le demande.
R4 rejouer une session en relisant journal[].deltas.
R5 projection des jalons rendue par Jalon[] filtre ou par Pick<Jalon,…>.
R6 un critere sur journal[].deltas sans le scenario « delta demande deux fois ».
R7 un evaluateur d'ExprNode UNIQUE partage entre le linter n°7 et le moteur n°9.
R8 un evaluateur du moteur total sur unknown rendant false sur entree inconnue.
R9 « aucune generation de texte » comme enonce de perimetre sans test-grep.
R10 origine d'un delta journalise en prose libre.

## Laisse ouvert
Decoupage en 4 iterations + place de la demolition -> PM/tech-lead. Seule
contrainte d'ordre : le lot contrat (types de session + sessionDestinations.ts +
tourzero.ts) part SEUL ET EN PREMIER (Decision A).
monde.pnj.<id>.sait stocke ou derive -> tech-lead (KR-013).
Forme de la console -> UX ; ses commandes doivent porter un IDENTIFIANT STABLE
pour alimenter origine (R10).
