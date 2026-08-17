RÉPONSE AUX OBJECTIONS

RISQUE — confirmé à la lecture du contrat Tech Lead (`Indice extends Entite { verite?, formulation_joueur?, mene_a?: string[] }`, tout scalaire) : mon ordre « Quêtes en tête » n'apporte rien à Indices, qui ne touchera jamais l'éditeur Delta[]. Le risque de départ (trois écrans Delta[] divergents) survit intact, juste décalé d'un cran.

OBJECTION — je me rallie donc à l'ordre Tech Lead (KR-190, coût croissant) : Indices→Quêtes→Événements→Climat. Ça ne coûte rien côté design : l'éditeur Delta[] partagé s'établit quand même en itération 2 (Quêtes), avant ses deux réutilisateurs (Événements it3, Climat it4). Sur jalons/fins (roadmap §5 l.234, vérifié) : le registre DELTAS y est aussi engagé — je recommande une 5e itération, en dernier, après Climat : c'est le plus complexe côté langue (déclencheur-auteur vs enonce_texte-joueur déjà atteint, mon terrain).

PROPOSITION — je retire ma proposition d'ordre tour 1 ; j'adopte Indices→Quêtes→Événements→Climat→Jalons/fins. Je maintiens le rejet du canevas « Graphe des indices » (PM) : aucune vue §06 du wireframe ne montre de canvas, `mene_a` se lit très bien en ListRow+localiserEntite (motif déjà posé en annexe tour 1) — un canevas est un composant maison sans instrument de test (QA) et sans repointage viable (Tech Lead). Je durcis ce point : de l'objection forte à la recommandation ferme de clôture.

VERDICT — recevable sous réserve, alignée sur Tech Lead + QA.

Annexe — libellés `lie_au_canon` vs `lie_a_histoire` :
- Quête : chip accent « ◆ CANON » sur la ListRow + dans la fiche un Toggle « QUÊTE LIÉE AU CANON », aide « Cette quête engage la trame immuable — sa résolution modifie le canon. » Le mot « canon » reste réservé à ce champ.
- Événement : jamais le mot « canon ». SegmentedControl en tête de liste, deux onglets « LIÉS À LA TRAME » / « LIBRES », pilotant `lie_a_histoire` — un filtre de liste, pas un chip par ligne.

Disposition de mes items tour 1 :
- RISQUE (divergence Delta[]) : MAINTENUE, renforcée (jalons/fins devient un 4e consommateur).
- OBJECTION scope (jalons/fins absent) : confirmée, absorbée dans la proposition d'ordre ci-dessus ; ambiguïté lie_au_canon/lie_a_histoire : résolue par les libellés ci-dessus.
- PROPOSITION ordre « Quêtes en tête » : RETIRÉE (motif : Indices n'a aucun Delta[], donc ne coûte rien à établir en premier).
- Rejet du graphe : MAINTENUE, DURCIE.
- Annexe design tour 1 (ListRow+Card, Select+avecOrpheline+localiserEntite jamais TargetPicker, éditeur Delta[] composé dans la feature KR-109, placeholders par section) : MAINTENUE, inchangée par le changement d'ordre.

NOTE ORCHESTRATEUR : position finale d'ordre (Jalons/fins en 5e, dernier) diverge de tech-lead tour 2 (Jalons/fins en 2e, juste après Indices). Voir arbitrage.