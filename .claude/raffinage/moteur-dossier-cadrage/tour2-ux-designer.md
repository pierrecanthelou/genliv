# TOUR 2 — ux-designer

RISQUE — Le veto tech-lead retire mon domicile du tour 1 (heritier de PlayerModal)
sans qu'aucun role en propose un autre. Si rien ne tranche avant it4, la console
atterrit par defaut la ou c'est le plus simple a coder : src/player/.

OBJECTION — Reponse nommee a tech-lead : « features/play-mode/** demolissable »
n'est PAS « la feature disparait » — CLAUDE.md la liste toujours parmi les 13,
« suit le runtime, n° 9 ». Le CONTENU taille pour l'arbre meurt, le BUCKET
architectural SURVIT, n°9 le repeuple.
Sur l'extractibilite : je ne plaide pas l'architecture, je plaide LE REGISTRE.
Console dans src/player/ = un futur build mobile embarquant syntaxe mono et
identifiants techniques (jalon.x, commande.aller) au milieu de la prose
immersive — la meme faute que confondre nom interne et description joueur, a
l'echelle de l'ecran entier.

PROPOSITION — Console, journal et OutcomeBlock vivent dans un features/play-mode/
RECONSTRUIT (fichiers neufs, meme domicile nomme). src/player/ garde ses ecrans
neutres et la SessionDossier projetee, rien de plus.

VERDICT — recevable sous reserve, DURCIT EN VETO si it4 ne nomme pas
explicitement ce domicile reconstruit.

## OutcomeBlock vs JournalRow vs C4 — resolu, aucun sacrifice
Deux surfaces DISJOINTES. journal[].texte a pour audience 'moteur' en n°9 (C3) :
constat interne, mono, jamais de la prose joueur. Le role est binaire
('joueur'|'moteur', C2) — aucune entree de journal n'est de la prose narree.
Donc JournalRow rend TOUTES les entrees en registre mecanique uniforme ; quand
n°10 ajoute 'ia', il bascule son rendu sur CE MEME champ role, zero champ neuf :
C4 satisfaite PAR CONSTRUCTION, pas par surveillance.
OutcomeBlock n'entre JAMAIS dans le journal : son unique consommateur en n°9 est
texte_ouverture_joueur, rendu en BANNIERE D'OUVERTURE, hors liste.

## previewDisabledReason vs critere QA 2 — COMPATIBLES
Expression PURE (useMemo ou calcul en ligne) sur RapportControles.controles :
find(bloquant) + comptage. Jamais un etat pose par useEffect. KR-013 respecte.
RESERVE RESIDUELLE : le texte exact de Controle.message appartient a
dossier-controles ; s'il est ecrit comme FRAGMENT de panneau (« LIEU DE DEPART —
manquant ») plutot que phrase complete, le title natif le rendra mal. A CONFIRMER
par tech-lead/QA — ce n'est pas un texte que n°9 invente.

## Vocabulaire des commandes — la FORME, pas la liste
Mot-cle en MAJUSCULES mono + argument en identifiant bas-de-casse :
ALLER <lieu_id> · EXAMINER <objet_id> · PARLER <pnj_id>.
Identifiant stable pour origine : commande.<mot-cle en bas de casse>
(commande.aller), conforme au format 'commande.<id>' du narratif.
Refus nomme : « Commande inconnue : « {saisie} ». Commandes disponibles :
ALLER, EXAMINER, PARLER, ATTENDRE. » — liste reelle fixee par tech-lead/narratif
selon les deltas livres en it2/it3, jamais par moi seul.

## Iteration de demolition — regression visible ? NON
Dans l'ordre tech-lead, la demolition est un lot de queue d'it4, coincident avec
la console qui porte la phrase de demo. Le CTA reste present et ameliore depuis
it1. SEULE CONDITION : que le lot de demolition ne retire aucun point d'entree
deja visible a l'auteur — aucun cas identifie au disque.

## Surfaces finales
EditorTopBar (CTA) · DossierEditorScreen.tsx:158 (texte de refus, plus en dur) ·
features/play-mode/ RECONSTRUIT (shell mono + « ✕ Quitter le test », panneau
console, panneau journal, banniere d'ouverture) · conserves sans changement de
registre dans src/player/ : CharacterCreationScreen, CombatScreen, XpShopScreen,
EndScreen, HeroStatusBar · demolis : NodeScreen, ChoiceList, DecorScreen,
PnjScreen, TrapScreen, ancien PlayerModal.tsx.

## Composants — domicile
Reutilises : Badge (nature d'entree), Field (saisie mono).
NEUFS, tous deux dans features/play-mode/components/ :
  OutcomeBlock — un seul consommateur en n°9 (banniere d'ouverture). KR-109 :
    n°15 lui donne un 2e consommateur (fins[].texte) -> migration vers
    brain/components/ A CE MOMENT-LA, pas avant.
  JournalRow — lecture seule, rendu pilote par role, reutilise Badge.

## Textes imposes finaux
Vide journal : « Aucun evenement pour l'instant — vos actions y apparaitront. »
Titre panneau console : « CONSOLE » (mono, un mot)
Placeholder : « Tapez une commande… »
Commande inconnue : « Commande inconnue : « {saisie} ». Commandes disponibles :
  ALLER, EXAMINER, PARLER, ATTENDRE. »
Header shell : mono + « ✕ Quitter le test » (seule continuite visuelle voulue)
Banniere d'ouverture (OutcomeBlock) : texte_ouverture_joueur VERBATIM.

## REJETES — statut
1. Fiction generee a la volee pour habiller l'ecran transitoire — MAINTENU.
2. ListRow reutilise pour les lignes de journal — MAINTENU, RENFORCE.
3. CTA desactive actionnable au clic — MAINTENU hors perimetre n°9.
