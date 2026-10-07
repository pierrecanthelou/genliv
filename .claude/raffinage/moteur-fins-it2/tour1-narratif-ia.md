# Narratif & IA — tour 1 · moteur-fins it2

RISQUE — La mémoire du narrateur (`faits_etablis`, `resume`) est rechargée telle quelle à la reprise. C'est correct au plan du moteur, mais si `validerSession` ne vérifie pas la FORME de `memoire` (invariants I1-I5 de `session.ts`), un blob corrompu réintroduit des ancres pendantes ou un `jusqu_au_pas` incohérent — et le prochain appel modèle reçoit un contexte empoisonné. Le risque est faible (l'auteur est le seul écrivain) mais KR-116 dit : valider au point de lecture.

OBJECTION — Le texte de mort du héros est annoncé comme « texte constant du moteur, `role: 'moteur'` », mais son contenu et sa voix ne sont pas spécifiés :
(a) Le texte est-il factuel ou immersif ? Les seules proses immersives du moteur sont les verbatim d'auteur et R3/R5, tous deux coupés au pas de mort. Une prose immersive dans le CODE serait un troisième producteur de fiction non signé.
(b) La constante est-elle nommée et exportée (testable), ou littérale dans le composant ?
(c) Le texte entre-t-il dans le journal (`EntreeJournal role: 'moteur'`) ou seulement à l'écran ?

PROPOSITION —
1. Nommer la constante (`TEXTE_MORT_HEROS`) dans un module `brain/` ou `player/engine/`, docstring « voix factuelle, audience joueur ».
2. Voix factuelle, courte : « Votre héros est mort. » — ni mécaniques, ni prose narrative.
3. Écrire UNE ligne de journal `{ role: 'moteur', texte, tour }` au pas de la mort.

VERDICT — recevable sous réserve : (a) `validerSession` vérifie la forme de `memoire` ; (b) le texte de mort et sa voix sont tranchés AVANT le code.

## ANNEXE — Frontière code/IA

**Contrat de sortie IA : AUCUN.** Cette itération est 100 % code, 0 % IA. Aucun appel modèle, aucune sortie à valider. La mémoire, le journal et le combat sont rechargés tels quels. La frontière tient.
