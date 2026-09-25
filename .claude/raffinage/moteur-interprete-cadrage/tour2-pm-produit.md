# Tour 2 — PM produit — contre-lecture `moteur-interprete` (n°10)

**T1 (`agir`)** — Vérifié dans `src/brain/dossier/commandes.ts` : `COMMANDES` n'a qu'`aller` ; le commentaire « UN SEUL VERBE en itération 2, et c'est une décision » scope l'itération 2 de **n°9**, pas une clôture permanente — pas de réouverture d'une décision actée. J'accepte `agir` en it1 : sans lui, toute action hors déplacement boucle en clarification perpétuelle, et it1 ne démontrerait rien que la Console de n°9 ne fait déjà. Phrase de démo révisée, toujours sans « et » : « le joueur écrit une action libre ; R1 la classe en déplacement (`aller`), en action libre acceptée (`agir`, no-op mécanique : un pas consommé, `EtatMonde` intact), ou en demande de précision — jamais de prose. » En échange je retire : zéro delta, zéro PNJ, zéro objet, aucune distinction narrative aller/agir en it1 (R3 n'existe qu'en it2) — nommé explicitement hors-périmètre.

**T2** — Confirmé compatible : `journal[].recit` est un champ neuf sur `EntreeJournal`, `journal[].texte` reste `moteur`. Exactement ce que j'avais posé en it2. Aucune réouverture de la décision n°9.

**T3 (KR QA)** — KR-260 : couvert par le lot contrat du tech-lead, je l'exige en critère d'acceptation d'it1 (moteurSansIA.test.ts réécrit et vert). KR-261 : QA le dit lui-même non-bloquant n°10 — it4 ne porte QUE les 3 chemins que n°10 ouvre (R1/R3/résumé), pas les onze du roadmap. KR-262 : j'objecte à sa portée 8-collections — narratif-ia l'a déjà résolu pour le seul point que n°10 touche réellement (label des lieux pour R1, via `description`, sans bascule d'audience). L'élargir à 8 collections dans n°10 recrée exactement le lot transverse que narratif-ia refuse lui-même dans sa propre décision. Narrowing, pas de KR séparé dans mon découpage.

**T4** — Composition du lot contrat (5 ou 7 fichiers) : hors mon domaine, je ne tranche pas l'architecture. Mais l'ordre m'appartient : `commandes.ts` (`agir`) et `docs/REGLES-PLAY.md` § J1 doivent livrer dans le MÊME lot, avant tout code d'écran — KR-130, doc avant code.

**Mon objection tour1** (collision `intention`/`validerIntention`) — **retirée** : tech-lead et narratif-ia proposent indépendamment des noms disjoints (`SortieInterprete`/`Commande` vs `CLES_SORTIE_PLAN`/`validerIntention`). Satisfaite.

**Décision prise en autonomie** — Portée d'`agir` non tranchée par le brief → je la borne à un no-op mécanique en it1, aucun delta, aucune narration différenciée → si c'est l'inverse (agir porte un effet dès it1), le coût est une it1 qui n'est plus un squelette mais une seconde feature (moteur de conséquences) empilée sur l'interprète — contradiction directe avec la règle squelette-d'abord.

**VERDICT** — 4 itérations tiennent, it1 amendée (agir inclus, borné no-op). Pas de veto.

---

Résumé de mes vérifications de code pour cette note (chemins absolus) :
- `src/brain/dossier/commandes.ts` — confirme un seul verbe `aller`, confirme que le commentaire "un seul verbe" est scopé à l'itération 2 de n°9 (pas une clôture permanente pour n°10).
- `docs/REGLES-PLAY.md` (grep § J1, ligne 190) — confirme l'existence de la règle sur l'unité du pas d'horloge à amender pour `agir`.
- Les 4 notes tour1 lues en entier : `tour1-tech-lead.md`, `tour1-ux-designer.md`, `tour1-qa.md`, `tour1-narratif-ia.md`.

Points clés du verdict pour l'orchestrateur :
1. J'accepte `agir` dans l'itération 1, mais le borne strictement à un no-op (consomme un pas, ne touche pas `EtatMonde`, aucune narration différenciée tant que R3 n'existe pas) — sinon ce n'est plus un squelette.
2. `journal[].recit` (nouveau champ, jamais `journal[].texte`) est confirmé compatible avec ma décision n°9 déjà actée.
3. Je rétrécis le KR-262 de QA : n°10 ne touche que le label des lieux pour R1 (déjà résolu par narratif-ia via `description`), pas les 8 collections — élargir recréerait le lot transverse que narratif-ia refuse lui-même.
4. Composition du lot contrat (5 vs 7 fichiers) hors de mon mandat — mais j'exige, comme contrainte d'ordre, que `commandes.ts` (ajout `agir`) et `docs/REGLES-PLAY.md` § J1 livrent ensemble, avant tout code d'écran (KR-130).
5. Je retire mon objection tour1 sur la collision de nom `intention`/`validerIntention` : satisfaite par les propositions convergentes et indépendantes du tech-lead et de narratif-ia.
