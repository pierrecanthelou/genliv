# TOUR 1 — ux-designer — cadrage n°9 moteur-dossier

RISQUE — PlayerModal/PlayerRuntime partagent chrome et contenu ; si la console et
le journal mecanique entrent dans src/player/, un outil de developpeur voyage
jusqu'au runtime extractible (EXIGENCE-APERCU § 6).

OBJECTION — « console de commandes typees » n'est cadree nulle part sur SA surface.
« Aucune generation de texte » n'est pas « aucun ecran » : il faut UN ecran entre
n°9 et n°10, et rien ne dit ou il vit.

PROPOSITION —
 1. TROIS registres. La console = 3e registre (mono, syntaxe litterale), rendue
    dans un panneau du SHELL EDITEUR (heritier de PlayerModal), JAMAIS dans
    PlayerRuntime / src/player/.
 2. Ecran transitoire honnete : liste mecanique (lieu, jalons enonce_texte,
    quetes[].etapes, deltas) en registre auteur/mono. Etat vide tour 0 :
    « Aucun evenement pour l'instant — vos actions y apparaitront. »
    Les 2 proses verbatim marquees par OutcomeBlock.
 3. CTA desactive : previewDisabledReason = message du PREMIER Controle bloquant
    de RapportControles, suffixe « (et {n} de plus) » si >1. title natif conserve.

VERDICT — recevable sous reserve : OU VIT LA CONSOLE doit etre tranche avant it1.

## Surfaces
EditorTopBar (prop deja la, inutilisee) ; DossierEditorScreen.tsx:158 (RAISON_APERCU
_DESACTIVE en dur) ; shell de test successeur de PlayerModal (header mono + « ✕
Quitter le test ») ; ECRAN DE SESSION TRANSITOIRE (nouveau) ; conserves sans
changement de registre : CharacterCreationScreen, CombatScreen, XpShopScreen,
EndScreen, HeroStatusBar ; demolition de features/play-mode/ (suppression, rien a
concevoir).

## Composants
Reutilises : chrome du header PlayerModal, Badge (nature d'evenement de journal),
Field (saisie de commande, mono, jamais un input maison). Anatomie 3 lignes
d'IssueList comme REFERENCE de style, pas le composant.
MANQUANTS : OutcomeBlock (liste au DS, JAMAIS implemente — verifie par grep ; a
construire ici, premier consommateur produit) ; JournalRow en lecture seule.

## Textes imposes
- Vide journal : « Aucun evenement pour l'instant — vos actions y apparaitront. »
- CTA desactive : message du 1er Controle bloquant + « (et {n} de plus) ».
- Titre du panneau console : « CONSOLE » (mono, un mot) — jamais « Console de jeu ».
- Placeholder : « Tapez une commande… » — VOCABULAIRE DES COMMANDES HORS SON
  AUTORITE, a fournir par tech-lead/narratif-ia.

## REJETES (a recopier au registre des desaccords)
1. Habiller l'ecran transitoire d'une fiction generee a la volee par le code —
   REJETE : 3e source de verite de prose, hors du contrat « deux proses verbatim ».
2. Reutiliser ListRow pour les lignes de journal — REJETE : son contrat exige
   onSelect (docstring : « aucune variante non interactive n'a d'appelant ») ;
   un onSelect no-op romprait le contrat pour un premier appelant qui ne l'utilise pas.
3. Rendre le CTA desactive actionnable au clic (saut au champ fautif) — REJETE,
   hors perimetre explicite § 5.
