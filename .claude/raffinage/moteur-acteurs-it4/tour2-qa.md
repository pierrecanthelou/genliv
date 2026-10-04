# QA — moteur-acteurs it4, tour 2

RÉPONSE À Tech Lead obj 1 — Tri-état `sous_epreuve` découpe AC#7 en 3 cas testables disjoints. Accepté : chaque état → test unitaire sur `portesOuvertes`.

RÉPONSE À Narratif obj 1 — Cas limite omis : R4 reçoit `resiste`, rien n'oblige à citer le savoir fermé. Test manquant : « moteur refuse indice si R4 silence ». Cas complétés.

MES OBJECTIONS :
1. AC#7 mélange trois états — durcie en veto : 3 AC disjoints + test unitaire par état nommé (`sous_epreuve`).
2. Test `jet` dans `portesOuvertes` — maintenue.
3. AC#8 bannière non nommée — maintenue.
4. KR-285 lecteur `resiste` — durcie en veto (Narratif confirme : sans désignation unique, moteur choisit par « une fonction »).
5. Cas limites énumérés — durcie : ajouter « R4 silence → refus moteur ».

VERDICT — Recevable sous réserve de trois durcissements : disjoindre AC#7, tester refus moteur, nommer lecteur `resiste`.
