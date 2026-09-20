# TOUR 1 — tech-lead — cadrage n°9 moteur-dossier

RISQUE — La demolition (KR-181, § 0 bis) est IMPOSSIBLE telle qu'ecrite, et c'est
MESURE : tree-canvas, conserve par la decision n°5, consomme BookNode, Edge,
NODE_KINDS, EDGE_KINDS, nodeTitle, textLines, effectiveKind, endLabel, NodeBadge,
useOpenBook, useSelectedNode, useBookNodePositions, useBookLayoutSpacing,
deriveAutomaticEdges/deriveMonsterEdges — et brain/hooks.ts:19-26 s'abonne aux
book:*/node:*/edge:*. Deux lignes du roadmap se contredisent (decision n°5 vs KR-181).

OBJECTION — Une demolition n'est demontrable par aucune phrase joueur : c'est un
LOT DE QUEUE, pas une iteration. Et le perimetre ecrit porte 5 tranches :
quetes[].etapes exige un delta et un predicat qui n'existent pas (quete_achevee
explicitement ecarte) — donc un second lot contrat, donc une iteration a elle seule.

PROPOSITION — L'evaluateur vit dans brain/dossier/, en DEUX fichiers neufs pour
tenir l'ordre acyclique : faits.ts (FaitsDeSession, AVANT predicates) et
evaluate.ts (evaluerExpr/appliquerDelta, APRES deltas). Motif mesurable :
expr.test.ts:420 epingle la liste close des lecteurs d'ExprNode et ne surveille
que brain/dossier/ — un evaluateur dans src/player/ serait le seul lecteur hors
instrument. src/player/ garde la session complete et PROJETTE.

VERDICT — recevable sous reserve. VETO sur la demolition telle qu'ecrite.

## Signatures proposees (lot contrat)
faits.ts (aucune dependance) : FaitsDeSession { lieu_courant, lieux_visites,
  indices_connus, jalons_atteints, evenements_consommes, objets_possedes,
  pnj_a_dit } — 7 champs readonly, un par predicat.
predicates.ts : champ AJOUTE  lit: (faits, cibles) => boolean
deltas.ts     : champ AJOUTE  ecrit: (faits, cibles) => FaitsDeSession
evaluate.ts   : evaluerExpr(condition, faits): boolean ; appliquerDelta(faits, effet)
Ordre acyclique : identifiers -> issues -> FAITS -> predicates -> expr -> deltas
  -> EVALUATE -> types -> tables -> validate.
evaluerExpr est BIVALENTE (pas de Kleene) : elle tourne sur un etat REEL.
  Ne fusionne jamais avec tourzero.ts ni atteignabilite.ts — trois questions.
src/player/types.ts : SessionDossier A COTE de SessionState (nom deja pris) ;
  mort du premier DANS LA MEME FEATURE, declaree. faitsDe(session) vit chez le
  player, JAMAIS dans brain/.

## Frontiere de demolition (lue au disque)
DEMOLISSABLE en n°9 : features/play-mode/** · brain/utils/playExport.ts ·
  brain/utils/buildAdventureDocument.ts · les fichiers src/player/ types arbre
  (NodeScreen, ChoiceList, DecorScreen, PnjScreen, TrapScreen) et les parties
  arbre de sessionEngine/actionEngine/usePlaySession.
NON DEMOLISSABLE tant que tree-canvas vit : brain/tree.ts · brain/kinds.ts · la
  moitie arbre de brain/types.ts · BookService · les 4 hooks de brain/hooks.ts ·
  brain/utils/automaticEdges.ts · brain/components/NodeBadge · les 11 book:*/
  node:*/edge:* d'AppEvents · Router.ts {name:'editor'}.
CONCLUSION : KR-181 est a AMENDER — la n°9 est proprietaire d'extinction des
  CONSOMMATEURS, pas du MODELE. Recommandation : laisser src/EditorScreen.tsx
  debout (unique point de montage de tree-canvas).
CONSEQUENCE PRODUIT a trancher par le PM : la ligne « vos anciens livres restent
  stockes » reste VRAIE puisque la donnee source survit — son retrait redevient
  un choix produit.

## Ordre impose
it1 ouvrir son dossier en partie depuis l'editeur et lire le texte d'ouverture
    (lot contrat faits.ts, CTA sur jouable, refus MARQUEUR, lieu_courant =
    depart.lieu_id, port de stockage). NI evaluateur NI delta.
it2 se deplacer de lieu en lieu par lieux[].acces (B1 paye pour ca). Tranche la
    question (ii) de tourzero.ts : le depart compte-t-il comme VISITE ?
it3 voir un jalon s'atteindre parce que sa condition est devenue vraie
    (evaluerExpr + appliquerDelta, journal[].deltas, projection enonce_texte
    SEUL). Tranche la question (i) : declencheur_expr avant la 1re action ?
it4 rejouer un tour a la main depuis une console de commandes typees + LOT DE
    QUEUE de demolition (les 4 cibles demolissables).
SORT de la n°9 : quetes[].etapes (sa propre tranche ou n°12/14) et
  memoire.faits_etablis (n°10, son unique consommateur).

## Ce qui casse
expr.test.ts:420 ROUGIT des le 4e lecteur (attendu a mettre a jour dans le lot
contrat, en LISANT le nom neuf) · tests de forme des descripteurs (un champ
fonction entre dans un registre declaratif) · sessionEngine : 6 des 8 exports
types Edge/PlayNode ; survivent PE_PER_TRANSITION et defaultSessionFields ·
usePlaySession : takeObject/finishDecor/finishPnj/finishTrap/navigateToMort/
navigateTo partent ; confirmHero/resume/restart/spendXp* survivent ; finishCombat
a repointer sur un LIEU · DossierEditorScreen.tsx:158 (RAISON_APERCU_DESACTIVE
meurt avec son unique usage) · persist.ts localStorage direct -> port injecte ·
EXIGENCE-APERCU-DU-JEU.md : la liste des 6 modules purs doit inclure brain/dossier/.

## Dette a declencheur — etat reel
Scission de controles.ts : NON ARMEE (lire le type exporte n'ouvre pas le fichier).
BUG-090 : ARME A IT3 (reussi_si_expr acquiert son 1er consommateur reel).
« manque » en double emploi : arme seulement si l'affichage de combatEngine rouvre.

## REJETES (a recopier au registre des desaccords — BUG-082)
R1 « la n°9 demolit le modele d'arbre » — impossible tant que tree-canvas vit.
R2 « l'evaluateur et applyDelta vivent dans src/player/ » — sortirait le 4e
   lecteur d'ExprNode du seul instrument qui le surveille ; contredit « champ du
   descripteur, jamais un switch » (KR-117).
R3 « muter SessionState en place » — big-bang sur 14 fichiers, aucune tranche.
R4 « la n°9 absorbe la scission de controles.ts » — declencheur non arme.
R5 « src/player/ continue d'ecrire localStorage en direct dans l'editeur » —
   port injecte { lire, ecrire, effacer }, DEUX appelants nommes.
R6 « la session complete (10 cles) comme contrat brain/dossier » — brain/dossier
   ne connait que la projection lue par ses registres.
R7 « une famille d'evenements partie:* sur l'EventBus » — zero abonne externe.
R8 « quetes[].etapes et memoire.faits_etablis tiennent dans la n°9 ».
