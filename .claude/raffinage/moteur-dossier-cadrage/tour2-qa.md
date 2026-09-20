# TOUR 2 — qa

RISQUE — Je ne trouve AUCUN etat de FaitsDeSession reel ou un predicat serait
indecidable : les 7 champs sont toujours peuples (ensemble vide compris), toute
reference est garantie au SSOT. Ma trivalence n'a pas de temoin. Le vrai risque,
mieux isole par narratif (R8) : un evaluateur bivalent qui retombe sur false pour
une entree NON RECONNUE (predicat hors registre, ExprNode malforme) fait mentir un
non — FAUX POSITIF DE FIN — et mon ancien critere 3 ne le distinguait pas d'un
false legitime (objet non possede).

OBJECTION — JE RETIRE l'objection « trivalence » de mon critere 3 et de KR-237.
Tech-lead et narratif la refutent INDEPENDAMMENT sur l'architecture reelle.
Aucun contre-exemple ne tient — je ne durcis pas en veto, je retire.

PROPOSITION — Deux criteres separes a la place :
 (a) entree non reconnue -> refus nomme, jamais false silencieux, AVEC MUTANT
     ECRIT (false sur inconnu -> sous non, une FIN se declenche au tour 1).
 (b) jouable bloque tout dossier portant cette anomalie AVANT ouverture —
     precondition, pas commodite, prouvee par LE MEME MUTANT.

VERDICT — objection trivalence RETIREE ; critere durci sur le refus explicite +
jouable comme precondition testee par mutant.

## Points
1. Demolition : mon temoin reste VALIDE TEL QUEL (scope-agnostique). Ce qui
   change est la CIBLE : KR doit citer la FRONTIERE EXACTE (4 cibles) au lieu
   d'un « KR-181 » generique, sinon le test-grep n'a pas de liste fermee. Et le
   critere doit dire EXPLICITEMENT que brain/tree.ts, kinds.ts, BookService et
   les 11 evenements SURVIVENT — ce n'est pas une regression.
2. Les trois instruments du narratif : VALIDES, les trois passent le test de
   pouvoir separateur. Aucun trou de preuve. Adoptes tels quels.
3. journal[].deltas : le narratif applique MA PROPRE DOCTRINE du tour 1. Je
   reprends le scenario « delta demande deux fois » tel quel — c'est le geste
   que j'aurais du ecrire moi-meme.
4. C5 borne de persistance : CE N'EST PAS UN CRITERE OBSERVABLE, c'est une
   MESURE A FAIRE. Mesurer octets/100 tours sur fixture realiste, ECRIRE LE
   NOMBRE DANS LA REVUE D'ITERATION, jamais dans acceptance_criteria en
   pass/fail. Je l'ecris non verifiable par construction, pas absent.

## Criteres FINAUX
1  MARQUEUR_A_ECRIRE marque -> refus nomme ; reecrit -> accepte. MEME TEST.
2  jouable false->true -> previewDisabledReason par lecture derivee pure.
3a predicat hors registre / ExprNode malforme -> refus nomme, JAMAIS false
   silencieux. MUTANT ECRIT ET VERIFIE ROUGE.
3b dossier portant cette anomalie -> jouable=false, controle bloquant nomme,
   aucune session ne s'ouvre — MEME MUTANT que 3a.
4  graine_alea fixee + journal de N actions rejoue MEME PROCESS -> etat final
   identique champ a champ. Cross-process explicitement hors critere.
5  projection des jalons : type NOMINAL { jalon_id, enonce }[], garde PAR VALEUR
   (sous-chaine du declencheur_texte retrouvee), mutant jalons.filter(atteint)
   verifie ROUGE, lecteur unique prouve par test-grep.
6  RETIRE — quetes[].etapes sort de la n°9.
7  suite tree-canvas inchangee et verte + test-grep sur les 4 cibles nommees ;
   brain/tree.ts / kinds.ts / BookService / les 11 evenements SURVIVENT
   EXPLICITEMENT. Jamais une couverture globale qui monte comme preuve.
8  moteur-dossier.sansIA.test.ts : zero fetch, zero CopiloteService, zero import
   src/features/** ni service brain/ non pur — prouve par SON PROPRE MUTANT.
9  commande invalide -> refus nomme, jamais ignoree silencieusement.
10 sessionDestinations.ts + balayage de fixture -> echec par NOM de champ sans
   destination, modele couverture.test.ts. Lot contrat, seul et premier.
11 journal[].deltas = { delta, cibles, origine, effet } — SCENARIO SEPARATEUR :
   meme delta demande deux fois -> 2e entree effet:'sans_effet', etat inchange
   entre les deux applications (idempotence assertee champ a champ).
12 origine dans { 'jalon.<id>', 'evenement.<id>', 'commande.<id>' } — registre
   ferme, toute origine hors format refusee, jamais de prose libre.
13 memoire = null reserve : AUCUN champ memoire.* representable dans
   SessionDossier/FaitsDeSession, seule la cle racine existe.

## KR-237 a KR-251 FINAUX
237 evaluerExpr BIVALENTE, jamais fusionnee avec tourzero/atteignabilite (trois
    tables). Ancien « trivalent » RETIRE faute de contre-exemple.
238 entree non reconnue -> refus nomme, jamais false silencieux ; MUTANT
    OBLIGATOIRE (false sur inconnu -> non rend vrai -> FIN au tour 1).
239 jouable est PRECONDITION DE CORRECTION de l'evaluateur bivalent, pas une
    commodite d'ergonomie — teste par un dossier portant l'anomalie KR-238.
240 demolition prouvee sur la frontiere nommee (4 cibles), jamais par hausse de
    couverture ; KR-181 AMENDE : n°9 proprietaire d'extinction des CONSOMMATEURS.
241 sessionDestinations.ts + balayage, echec par nom de champ, lot contrat.
242 « rejouable bug pour bug » observable seulement en replay intra-process.
243 sessionEngine/actionEngine/evaluateur hors score de mutation : jest+RTL seul
    instrument, ecrit noir sur blanc dans la revue.
244 refus MARQUEUR teste par opposition marque/reecrit dans le meme test.
245 jouable -> previewDisabledReason = lecture derivee pure.
246 projection des jalons : type nominal + garde par valeur + mutant verifie
    rouge + lecteur unique.
247 journal[].deltas forme + scenario separateur (demande deux fois).
248 origine = identifiant du registre ferme, jamais prose libre.
249 memoire=null reserve, aucun champ memoire.* representable en n°9.
250 moteur-dossier.sansIA.test.ts prouve par son propre mutant.
251 quetes[].etapes et memoire.faits_etablis SORTIS de la n°9.

## Cas limites — nouveautes
+ delta demande deux fois -> 2e sans_effet (KR-247).
+ ExprNode non reconnu atteignant l'evaluateur MALGRE la porte jouable (defense
  en profondeur) -> refus nomme.
+ A TRANCHER PM/TECH-LEAD : ouverture de session HORS CTA normal (acces direct)
  sur un dossier jouable=false — mon instrument ne couvre que le CTA.
+ Borne de persistance (C5) : PAS un cas limite teste, mesure a consigner dans
  la revue.

## REJETES — statut
1 MAINTENU (« bug pour bug » sans reformulation).
2 MAINTENU ET RENFORCE (hausse de couverture comme preuve de demolition).
3 MAINTENU (test navigateur hors cadre).
4 MAINTENU (accessibilite hors cadre ; operabilite clavier de la console reste
  exigee, deja couverte par le critere 9).
RETIRE ce tour : l'objection « trivalence » (ancien critere 3 / KR-237).
DURCI : l'ancien critere 2 se scinde en 3b/KR-239 — preuve PAR MUTANT exigee.
