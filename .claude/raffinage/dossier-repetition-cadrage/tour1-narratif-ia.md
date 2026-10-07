# Cadrage n°16 `dossier-repetition` — Tour 1 — Narratif & IA

RISQUE — le joueur synthétique devient un troisième orchestrateur. La chaîne d'un pas vit à deux endroits (`useTourDeJeu.ts` et `PartieEnCours.tsx`). Si la répétition recopie cette chaîne, elle teste un second moteur, qui divergera du vrai au premier changement.

OBJECTION — un « PNJ au maximum coopératif » n'est une borne haute que s'il passe par les mêmes écrivains que R4 : `consignerReponseActeur`, qui revérifie par `evaluerSavoir`, et `crediterConfiance(+1)`. Le couple carac/tc d'un jet se lit dans `savoirSousEpreuve`, il n'est jamais choisi par le joueur synthétique. Sans règle d'abandon, un PNJ fermé par construction (`consomme:true`) absorbe les 20 pas. Deux mots sont déjà pris : « inatteignable » appartient à `atteignabilite.ts`, et « tour » est réservé au combat (J1).

PROPOSITION —
1. Extraire la chaîne en fonctions pures dans `src/player/engine/`. `useTourDeJeu`, `PartieEnCours` et la répétition les appellent toutes.
2. `repeter(dossier, graine): RapportRepetition` fonction pure, `PAS_REPETITION = 20`. Session éphémère, jamais persistée.
3. Politique de jeu : en combat posture `normale` ; sinon `parler` au PNJ présent tant que le pas précédent a changé `monde`, avec au plus 3 jets par `(pnj, carac, tc)` ; sinon `aller` au premier lieu non visité ; sinon `agir`.
4. Rapport = identifiants seuls. S'intitule « non obtenu en 20 pas ». Jamais stocké (KR-013).
5. Étendre `moteurSansIA.test.ts` à la nouvelle racine.
6. « Difficulté non calibrée » : REGLES-DU-JEU.md → table dorée → code.

VERDICT — recevable sous réserve des points 1, 3, 4 et 5.

## ANNEXE A — Contrat de sortie IA : aucun

Zéro appel modèle, zéro jeton. Budget de contexte nul par construction. La 4e racine de `moteurSansIA.test.ts` le prouve par balayage du disque.

Contrat interne de code à code : `{ recit: RECIT_SYNTHETIQUE, personnageId, indicesReveles: savoirsRevelables(...), deltaConfiance: 1 }`, passé à `consignerReponseActeur`.

## ANNEXE B — Variante (A) : point d'extension nommé, pas codé

Deux fonctions nommées `choisirCommande` et `acteurCooperatif`. Ni interface ni type asynchrone (abstraction à un seul appelant). Si (A) arrive un jour, le modèle ne remplace que `choisirCommande`.

## ANNEXE C — Refus motivés

1. **Variante (A) comme répétition** : rapport non reproductible, ~100 appels/clic, 6e rôle IA.
2. **Politique tirée au sort** : nouveau `DomaineAlea`, lot `contrat`, bruit sans info.
3. **Passer la sortie dans `validerActeur`** : ce validateur contrôle des rangs bruts face à un contexte injecté.
4. **Stocker le rapport** : viole KR-013.
5. **« Difficulté non calibrée » dans CONTROLES** : verdict variable avec la graine.
6. **Mesurer PNJ par co-présence** : un PNJ sans prose compterait comme rencontré alors qu'il est muet.

## Décisions prises en autonomie
- Héros : `rollCreationPool(creerRng(graine,'heros',0))` + affectation déterministe (bonus à la plus faible, plafond CREATION_CAP).
- Graine : constante par défaut, modifiable sans stockage dans le dossier.
- Abandon PNJ : quitter au premier pas qui ne change pas `monde`.
- 3 tentatives max par (pnj, carac, tc).
- Posture combat : `normale`, jamais de fuite.
- « 20 tours » → « 20 pas » (un combat = un seul pas).
- Recalcul à la demande (bouton), mémorisé sur `(dossier, graine)`.

## Fichiers consultés
- src/brain/dossier/revelation.ts, arbitre.ts, recit.ts, alea.ts, commandes.ts, atteignabilite.ts, sessionDestinations.ts
- src/features/play-mode/hooks/useTourDeJeu.ts, components/PartieEnCours.tsx
- src/features/play-mode/tests/moteurSansIA.test.ts
- src/features/moteur-acteurs/specification.json
- docs/REGLES-DU-JEU.md, docs/REGLES-PLAY.md
- docs/ROADMAP-BASCULE-IA.md, docs/PLAN-BASCULE-IA.dc.html
