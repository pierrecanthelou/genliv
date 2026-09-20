# TOUR 2 — narratif-ia

RISQUE — La n°9 PERSISTE une session dès it1. Or schema:1 n'a aucun chemin de
migration (KR-160/191) — règle jamais transposée à la SESSION. Une session
écrite par it2 doit être relue par it3 sans convertisseur.

OBJECTION (nommément QA, critère 3 / KR-237) — « un ExprNode dont un prédicat est
indécidable reste indécidable DANS LE MOTEUR » est INTESTABLE sur la cible. Les 7
prédicats nomment chacun leur champ de session : six APPARTENANCES + une ÉGALITÉ.
Un état bien formé décide les sept. Une 3e valeur y serait un état MALFORMÉ AVALÉ
EN VALEUR DE VÉRITÉ. La QA a raison sur le DANGER (KR-228), elle l'a logé dans le
mauvais module : c'est tourzero.ts qui est trivalent, parce qu'il interroge un
DOCUMENT, qui ne porte pas d'état.

PROPOSITION — KR-237 réécrit : « l'évaluateur du moteur est BIVALENT et TOTAL sur
un état BIEN FORMÉ ; sur une entrée non reconnue il LÈVE, jamais false ». Le
critère 3 de la QA devient son témoin, DÉPLACÉ : non(<entrée non reconnue>)
asserte une LEVÉE. Mutant : `default: return false` -> sous non, une FIN se
déclenche au tour 1. Second témoin : aucune session ne s'ouvre si jouable est
faux. KR-240 nomme AUSSI tourzero.ts. DEUX lots contrat (it1, it3), chacun seul
et premier DANS SON ITÉRATION ; tout champ de session postérieur à it1 est
OPTIONNEL À VIE.

VERDICT — recevable sous réserve. LES DEUX VETOS ANNONCÉS SONT RETIRÉS.

## Q2 — sessionDestinations : change la FORME, pas la substance
Une table d'audience de session n'a AUCUN consommateur runtime en n°9 : son
unique consommateur est un balayage de TEST. Un module brain/ à appelant unique
de test violerait ma propre règle d'admission et gonflerait le bundle extractible.
FORME RETENUE : AUDIENCE_DE_SESSION, Record<keyof SessionDossier, Destination>
TOTAL (donc EXHAUSTIF PAR COMPILATION, KR-117) — PLUS FORT que destinations.ts,
dont la docstring dit « les clés sont des CHAÎNES ». COLOCALISÉE avec
SessionDossier dans src/player/. Plus les rares chemins de feuille textuelle
(journal[].texte, et rien d'autre en n°9), même balayage de fixture, échec PAR
NOM DE CHAMP. Destination RÉUTILISÉ depuis brain/dossier/destinations.ts.
=> rien de neuf n'entre dans brain/, la liste du tech-lead ne change pas, et son
R6 reste INTACT.
CE QUE JE NE LÂCHE PAS : KR-232 vaut pour la session comme pour le dossier.

## Q3 — tourzero.ts : chemin exact, VÉRIFIÉ PAR L'ORCHESTRATEUR
Le raisonnement du tech-lead sur controles.ts NE TRANSPOSE PAS : la scission est
une dette de TAILLE (déclencheur = ouvrir le fichier) ; tourzero porte une dette
de CORRECTION (déclencheur = prendre la décision (i) ou (ii)), et H6 NOMME ces
deux décisions et leur propriétaire.
CHAÎNE COMPLÈTE dans __fixtures__/dossier-minimal.json — les 4 maillons vérifiés :
 1. charpente.depart.lieu_id = "lieu.val-cendre"
 2. jalon.premiere-nuit, declencheur_expr = lieu_visite("lieu.val-cendre")
 3. effet = [{ delta: "reveler_indice", cibles: ["indice.sceau-brise"] }]
 4. consommateur : plan_actions[].declencheur_expr = indice_connu("indice.sceau-brise")
Décision (ii) -> lieu_visite(départ) VRAI au tour zéro. Décision (i) -> le jalon
part au tour zéro, SANS SCÈNE JOUÉE — le canal que H6 nomme elle-même. Effet :
indices_connus contient indice.sceau-brise avant la 1re action. Cellule fausse :
indice_connu: () => 'faux' (tourzero.ts:132), dont le commentaire affirme
« Aucun contre-exemple au dépôt » — phrase qui devient FAUSSE.
DIRECTION : sous non(indice_connu(...)), le linter passe de certain-faux à
certain-vrai -> FAUX POSITIF, la seule direction que le fichier s'interdit.
CE QUI ROUGIT SI ON NE TOUCHE PAS LE FICHIER : RIEN. Mesure confirmée —
tourzero.test.ts:106 RECOPIE la table dans le test (il compare la table à un
double d'elle-même) ; tourzero.test.ts:260 ne tire que sur un HUITIÈME prédicat,
jamais sur une cellule dont la VÉRITÉ a changé ; tsc ne voit rien ; aucun test ne
confronte l'état de session au tour zéro à VALEUR_AU_TOUR_ZERO.
EXIGENCE C6 MAINTENUE, NON ESCALADÉE EN VETO (hors de mon domaine) : à reprendre
par tech-lead ou QA.

## Q4 — Deux lots contrat
it1 (SessionDossier + faits.ts + AUDIENCE_DE_SESSION) et it3 (evaluate.ts +
journal[].deltas), chacun SEUL ET PREMIER DANS SON ITÉRATION. Plus la règle qui
les rend compatibles : TOUT CHAMP DE SESSION AJOUTÉ APRÈS LE PREMIER LOT CONTRAT
EST OPTIONNEL À VIE. it1 fige journal[] = { tour, role, texte } ; it3 ajoute
deltas? ; une entrée ancienne rend undefined — état LÉGAL, pas un trou.
Sur la démolition : PM et tech-lead tranchent sans moi. UNE SEULE CONTRAINTE :
la démolition ne doit pas être le lot qui DÉCOUVRE qu'un champ de session était
encore lu par sessionEngine — les racines figées AVANT qu'elle parte.

## Q5 — C4 et OutcomeBlock : DEUX COUCHES, UNE SOURCE
journal[].role est la SOURCE dans la donnée ; OutcomeBlock est le RENDU DÉRIVÉ.
INTERDIT : un 3e champ (est_verbatim, style, bloc) — KR-013, 6e précédent. Et
symétriquement, une distinction UNIQUEMENT visuelle : si OutcomeBlock est choisi
par une condition locale sans que role porte le fait, la n°10 n'a rien à lire.
Vocabulaire des commandes : REGISTRE FERMÉ, propriété du MOTEUR, jamais de la
console — miroir de DELTAS, commande.<id>. La console est une surface de SAISIE
TYPÉE qui résout vers ce registre ; AUCUN PARSEUR, refus nommé sinon.

## Q6 — monde.pnj.<id>.sait : REFUSÉ DE FIGER (changement depuis le tour 1)
Preuve MÉCANIQUE dans deltas.ts : le registre est fermé à 4 entrées et la
docstring de reveler_indice dit « il n'écrit JAMAIS le carnet d'un personnage, et
c'est mécanique : son arité est 1, aucun opérande pnj ». AUCUN delta ne peut
écrire le savoir d'un PNJ -> aucun écrivain en n°9. La raison narrative (un PNJ
qui apprend en cours de partie) est RÉELLE mais exige un delta à opérande pnj,
propriété de la n°12. Le stocker = 2e source de vérité -> 6e précédent KR-013.
NI CLÉ RÉSERVÉE : une clé réservée se justifie par une extension nommée, et
l'extension ici est un DELTA à créer, pas un champ à remplir.

## Verdict clé par clé — FINAL
schema FIGER · dossier_id FIGER · graine_alea FIGER + DÉFAUT NOMMÉ ET TESTÉ ·
horloge FIGER { tour } SEUL, climat_actif = clé réservée à null (n°14) ·
heros FIGER (forme existante, aucun champ neuf) ·
monde FIGER les 7 champs = les 7 prédicats (FaitsDeSession) ·
  pnj.<id>.confiance CLÉ réservée, échelle NON figée (n°12) ·
  pnj.<id>.sait REFUSÉ ·
journal FIGER { tour, role, texte } en it1 ; deltas? OPTIONNEL, ajouté en it3 ·
combat FIGER (repointé sur un LIEU) ·
attente FIGER VARIANTE PAR VARIANTE ·
memoire CLÉ réservée à null, forme interne REFUSÉE (n°10).

## Gardes C1-C7 FINALES
C1 MAINTENUE, DOMICILE CHANGÉ -> AUDIENCE_DE_SESSION dans src/player/.
C2 MAINTENUE (journal[].role fermé, 'joueur'|'moteur').
C3 DURCIE : journal[].texte = MOTEUR, pas ia. Un champ déclaré ia sans injecteur
   est une AUTORISATION DORMANTE que la n°10 trouverait déjà signée.
C4 MAINTENUE et précisée (role = source, OutcomeBlock = rendu dérivé).
C5 MAINTENUE (borne de persistance mesurée).
C6 MAINTENUE avec la preuve de Q3, NON ESCALADÉE EN VETO.
C7 MAINTENUE — c'est elle qui fait retirer la réserve 2.

## REJETÉS R1-R12 FINAUX
R1 memoire.* figé en n°9 — MAINTENU, veto RETIRÉ.
R2 union complète d'attente.type — MAINTENU.
R3 journal[].deltas partiel — MAINTENU.
R4 rejouer en relisant journal[].deltas — MAINTENU (compatible avec le critère 4
   de la QA, qui rejoue DEPUIS L'ÉTAT INITIAL).
R5 projection par Jalon[] filtré ou Pick — MAINTENU.
R6 critère sans le scénario « demandé deux fois » — MAINTENU.
R7 évaluateur UNIQUE partagé linter/moteur — MAINTENU ET RENFORCÉ (trois
   questions, trois modules : atteignabilite / tourzero / evaluate).
R8 évaluateur rendant false sur entrée non reconnue — DURCI : IL LÈVE.
R9 « aucune génération de texte » sans test-grep — MAINTENU, veto RETIRÉ (C7).
R10 origine en prose libre — MAINTENU.
R11 (NOUVEAU) un champ de session ajouté après le 1er lot contrat déclaré REQUIS.
R12 (NOUVEAU) une console qui INTERPRÈTE DU TEXTE LIBRE.

## Contresignatures
UX rejet n°1 (fiction générée à la volée) · UX « la console ne descend jamais
dans src/player/ » · tech-lead R2 (évaluateur dans brain/dossier/, motif narratif
ajouté : expr.test.ts:420 ne regarde que brain/dossier/) · QA critère 5
(projection enonce_texte seul, ext. KR-232) · PM (depart.inventaire_initial non
ajouté — ce serait un lot contrat DOSSIER).
