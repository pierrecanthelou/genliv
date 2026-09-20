# TOUR 2 — tech-lead

RISQUE — Le mien, manqué au tour 1, trouvé par le narratif : décider (i) met H6
en défaut par son UNIQUE canal de faux positif, dans un linter n°7 DÉJÀ LIVRÉ.

OBJECTION (nommément QA, critère 3 / KR-237) — « indécidable reste indécidable »
est la propriété DÉJÀ LIVRÉE de tourzero.ts (NON_DE_KLEENE l.184), dont
`Trivalent` (l.89) est PRIVÉ au module avec son motif écrit. Le critère est JUSTE
et MAL ADRESSÉ ; l'exporter fabriquerait l'évaluateur unique que le narratif rejette.

PROPOSITION — Scinder. 3a (tourzero.ts, it1) : NON-RÉGRESSION — tourzero.test.ts
reste vert SANS avoir été modifié après l'amendement. 3b (moteur, it3) :
evaluerExpr bivalente, TOTALE PAR COMPILATION, aiguillage par défaut qui LÈVE.
Mutant ROUGE : défaut rendant false -> une fin se déclenche au tour 1.

VERDICT — recevable sous réserve. VETO R1 MAINTENU. 3 lots pour it1.

## 1. Bivalent ou trivalent — TRANCHÉ : les deux, deux fichiers, jamais un
tourzero.ts trivalent (document sans état) / moteur bivalent (état réel).
KR-237 RÉÉCRIT : « Deux évaluateurs d'ExprNode, jamais un. Trivalent privé au
module, ne s'exporte pas. Le bivalent est total par compilation, son aiguillage
par défaut LÈVE. »
KR-244 (neuf, du narratif, contresigné) : la bivalence est CONDITIONNÉE PAR UNE
PORTE. Aucune partie ne s'ouvre si jouable === false. Tout chemin futur qui ouvre
une session sans passer la porte ROUVRE le faux positif.

## 2. sessionDestinations.ts — PRIS, dans brain/dossier/
Module PUR, part avec l'extraction (EXIGENCE § 6 l.9/49 autorisent src/player/ à
importer les modules brain/ purs) — liste du § 6 à amender.
JAMAIS fusionné dans destinations.ts : c'est un fichier contrat du SCHÉMA DU
DOSSIER, et sa garde couverture.test.ts balaie une fixture de DOSSIER. Une clé de
session y serait une LIGNE MORTE que l'assertion « aucune ligne morte » ferait
rougir. DEUX tables, DEUX gardes, DEUX fixtures.
Garde livrée dans le même lot : sessionCouverture.test.ts +
__fixtures__/session-tour-zero.json, modèle couverture.test.ts.
Portée it1 : la fixture est la session AU TOUR ZÉRO. journal[].texte et attente.*
entrent avec leur premier écrivain.
heros.* obtient ses lignes en it1, caractéristiques en MOTEUR (destinations.ts
l.48-55 : un modèle qui lit FO:9 connaît la marge avant challenge.ts).

## 3. tourzero.ts dans le lot contrat — PRIS, les DEUX décisions écrites
(ii) LE DÉPART COMPTE COMME VISITÉ : OUI. lieu_visite quitte indecidable pour la
forme à trois bras DÉJÀ ÉCRITE pour lieu_courant_est : départ non posé ->
indecidable ; cibles[0] === depart -> 'vrai' ; sinon -> 'faux'. Exercée par it2.
(i) LES declencheur_expr SONT RÉSOLUS AVANT LA 1re ACTION : OUI. Correctif UNE
SEULE PASSE, AUCUN POINT FIXE : les trois cellules adossées à la clause « aucun
delta avant la première action » (possede_objet, indice_connu, pnj_a_revele)
rendent indecidable SSI au moins un declencheur_expr de jalon ou d'événement est
certain-vrai au tour zéro SOUS LA TABLE RESTREINTE et porte un effet[] non vide.
 - Terminaison PAR CONSTRUCTION : la table restreinte ne se ré-entre pas.
 - Sens d'erreur : sur-prudence -> FAUX NÉGATIF SEUL.
 - Coût borné : dossier sans déclencheur vrai au tour zéro -> table INCHANGÉE.
 - jalon_atteint et evenement_consomme RESTENT indecidable.

## 4. Où vit la console — features/play-mode/, QUI SURVIT. Je RETIRE ma ligne.
1. CLAUDE.md range play-mode parmi les CINQ SURVIVANTS (« suit le runtime, n°9 »).
   Ma frontière contredisait une ligne déjà tranchée.
2. MESURÉ : le répertoire contient EXACTEMENT UN fichier, PlayerModal.tsx.
3. Le veto de fait de l'UX est correct : src/player/ est copié EN ENTIER à
   l'extraction. Une console et un journal mécanique n'y entrent pas.
PROPRIÉTÉ : features/play-mode/ = shell, console, vue du journal, écran de
session transitoire, montage du runtime. src/player/ = état de session, moteurs,
écrans de JEU. Frontière = UNE SEULE PROP.
MONTAGE SANS IMPORT INTER-FEATURES : bascule-editeur ne peut pas importer
play-mode. Le rendez-vous est une VARIANTE DE Route :
  | { name: 'partie'; dossierId: string }   <- AJOUTÉ à src/brain/Router.ts
Le CTA NAVIGUE, App.tsx REND. Aucun import croisé, AUCUN événement partie:*.

## 5. monde.pnj.<id>.sait — REFUSÉ, 6e KR-013 évité
Aucun prédicat ne lit un `sait`. Le savoir est dans le document, en lecture seule
pendant la partie. NI CHAMP NI CLÉ RÉSERVÉE. Le seul cas qui le rendrait non
dérivable (transfert d'indice, n°14) s'écrit en DELTA (savoirs_acquis[]), pas en
miroir — la dérivation devient savoirs[] ∪ savoirs_acquis[].

## 6. OutcomeBlock / JournalRow — features/play-mode/components/
VÉRIFIÉ : brain/components/index.ts exporte 18 primitives, OutcomeBlock ABSENT.
Pas brain/components/ (KR-109, un seul consommateur). Pas src/player/.
RÈGLE DE DÉMÉNAGEMENT FUTUR, DEUX BRANCHES :
 - 2e consommateur = écran DU RUNTIME (n°10) -> src/player/components/. SURTOUT
   PAS brain/components/ : ces primitives portent des modules CSS et ne sont pas
   dans la liste des purs du § 6 — les y faire entrer casserait l'extractibilité.
 - 2e consommateur = autre feature de l'éditeur -> brain/components/ (KR-109).
PORTÉE : OutcomeBlock en it1 (1er consommateur réel) ; JournalRow en it2 (en it1
le journal n'a aucune ligne à rendre).
QUESTION RENDUE À L'UX : je recommande que les deux proses verbatim NE SOIENT PAS
des entrées de journal — l'ouverture se rend dans OutcomeBlock AU-DESSUS du
journal, qui démarre VIDE. (a) garde vivant l'état vide qu'elle a rédigé, (b)
répond à C4 PLUS FORT que par le role : la n°10 ne peut pas résumer au tour 40 un
texte qui n'a jamais été dans le journal.

## 7. Borne de persistance (C5) — RÉALISABLE, pas dans le lot contrat
OÙ : it2 (1er journal garni), pas it1 (journal vide).
FORME : session de 100 tours depuis la fixture réelle, sérialisée PAR LE PORT,
JSON.stringify(session).length sous une CONSTANTE NOMMÉE écrite DEPUIS LA MESURE
(plafond = ceil(mesure ÷ 5 kio) × 5 kio).
CE QU'ELLE PROTÈGE : localStorage ~5 Mio par origine, PARTAGÉS avec les dossiers.
CE QU'ELLE N'EST PAS : la borne d'injection (n°10). Aucune troncature en n°9.
PRÉREQUIS MÊME LOT : persist.ts l.4-5 duplique PLAY_SESSION_KEY_PREFIX sous un
commentaire « must stay in sync … (KR-134) » — PREUVE de R5, pas intention.

## Contrats brain/ — FINAL
CRÉÉS it1 (lot contrat) : brain/dossier/session.ts (RoleJournal, EntreeJournal,
EtatMonde 7 champs = 7 prédicats, EtatSession avec memoire: null TYPÉ null) ·
sessionDestinations.ts · sessionCouverture.test.ts ·
__fixtures__/session-tour-zero.json · moteurSansIA.test.ts (périmètre DÉRIVÉ DU
DISQUE, modèle lintIsolation.test.ts, SON MUTANT LIVRÉ DANS LE LOT).
MODIFIÉS it1 : tourzero.ts + tourzero.test.ts · Router.ts (variante partie) ·
persistenceKeys.ts (DOSSIER_SESSION_KEY_PREFIX) · EXIGENCE-APERCU-DU-JEU.md.
CRÉÉS it3 (2e lot contrat) : faits.ts · evaluate.ts · champs lit/ecrit aux
descripteurs · expr.test.ts (4e lecteur, attendu mis à jour EN LISANT LE NOM
NEUF) · EntreeJournal.deltas? (forme du narratif adoptée telle quelle).
CORRECTION DE MON TOUR 1 : j'avais mis faits.ts en it1. C'est mon propre biais —
une abstraction sans lecteur dans son itération. Elle part en it3.
POURQUOI PAS UN brain/session/ NEUF : expr.test.ts:420 épingle la liste close
bornée à brain/dossier/. Je préfère payer un nom qu'un instrument.

## Frontière de démolition FINALE
DÉMOLI (it4, lot de queue) : brain/utils/playExport.ts ·
brain/utils/buildAdventureDocument.ts · NodeScreen, ChoiceList, DecorScreen,
PnjScreen, TrapScreen · les parties arbre de sessionEngine/actionEngine/usePlaySession.
RETIRÉ du démolissable : src/features/play-mode/** (REPOINTÉ).
SURVIT : brain/tree.ts · kinds.ts · moitié arbre de brain/types.ts · BookService ·
les 4 hooks · automaticEdges.ts · NodeBadge · les 11 événements · Router
{name:'editor'} · src/EditorScreen.tsx.
KR-181 AMENDÉ : n°9 propriétaire d'extinction des CONSOMMATEURS, jamais du MODÈLE.

## Ordre FINAL (convergé avec le PM)
it1 L'auteur ouvre son dossier en partie depuis l'éditeur et lit le texte
    d'ouverture. (lot contrat · CTA sur jouable · refus MARQUEUR ·
    lieu_courant = depart.lieu_id. NI évaluateur NI delta.)
it2 L'auteur déplace son héros d'un lieu à un autre. (la console est le MOYEN,
    pas un second livrable — c'est ce qui réconcilie mon it2 et celui du PM.
    lieux[].acces. Décision (ii). JournalRow. Borne de persistance mesurée.)
it3 L'auteur voit un jalon s'atteindre parce que sa condition est devenue vraie.
    (2e lot contrat. Projection en TYPE NOMINAL. Décision (i). ARME BUG-090.)
it4 Le modèle d'arbre n'a plus aucun consommateur de jeu. (lot de queue.)
COMMANDES : commande.<verbe>, registre CLOS. it2 en pose UN SEUL : aller.
SORT DE LA n°9 : quetes[].etapes · memoire.faits_etablis.

## Lots d'it1 — 3 lots, propriété exclusive
1 CONTRAT (seul, premier) : les 5 créés + les 5 modifiés ci-dessus.
2 feature play-mode : EcranSession.tsx · OutcomeBlock.tsx · ConsolePanel.tsx
  (COQUILLE ET ÉTAT VIDE en it1, aucun verbe) · PlayerModal.tsx repointé ·
  index.ts · tests · src/App.tsx.
3 feature bascule-editeur : DossierEditorScreen.tsx + son test.
Aucun fichier nommé deux fois. Rendez-vous = une variante de Route.

## REJETÉS — statut final
R1 « la n°9 démolit le modèle d'arbre » — DURCI EN VETO.
R2 évaluateur dans src/player/ — MAINTENU.
R3 muter SessionState en place — MAINTENU.
R4 absorber la scission de controles.ts — MAINTENU.
R5 localStorage direct — MAINTENU ET DURCI (preuve mesurée persist.ts:4-5).
R6 la session complète comme contrat brain/dossier — MAINTENU, PRÉCISÉ : le TYPE
   brain ne couvre que la projection ; la TABLE D'AUDIENCE couvre la session
   ENTIÈRE, parce que son garde balaie une FIXTURE, pas un type.
R7 événements partie:* — MAINTENU (remplacé par une variante de Route).
R8 quetes[].etapes / memoire.faits_etablis en n°9 — MAINTENU.
R9 (neuf) créer un dossier brain/session/ — REJETÉ.
R10 (neuf) promouvoir OutcomeBlock dans brain/components/ en n°9 — REJETÉ.
R11 (neuf) stocker monde.pnj.<id>.sait — REJETÉ.
RETIRÉ : « features/play-mode/** est démolissable » (ma note du tour 1).

## Non mesuré, à écrire tel quel dans la revue
expr.ts, evaluate.ts, sessionEngine, actionEngine HORS score de mutation.
Le POUVOIR SÉPARATEUR des deux mutants doit être écrit et vérifié ROUGE DANS LE
LOT QUI LES LIVRE, jamais « plus tard » (BUG-087).
La mesure de la borne de persistance n'existe pas encore.
