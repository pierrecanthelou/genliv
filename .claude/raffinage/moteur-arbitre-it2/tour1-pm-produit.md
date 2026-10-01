RISQUE — Le « et » de la phrase est assumé (KR-263/266, convergence actée au cadrage, précédent exact dans moteur-interprete) : ce n'est pas une coupe à refaire. Le vrai risque PM est la fuite de périmètre vers it3 : CarteJet et R3 narrant sont exactement les fichiers qu'it3 va nuancer (amorce à 4 états, crédit XP). Un ouvrier qui « tant qu'il y est » anticipe la classification fine ou l'XP casse la propriété exclusive d'it3 sur les 4 fichiers de règles (seule itération censée déclencher `test:mutation`, KR-261).

OBJECTION — `plan.acceptance_criteria` (niveau feature) cite une amorce à QUATRE valeurs (« réussit / réussit de justesse / réussit nettement / échoue »), alors que le goal d'it2 restreint explicitement à une « amorce binaire qualitative (réussit/échoue) ». Un ouvrier qui ne lit que acceptance_criteria vise un critère hors d'atteinte sans `MARGE_FRANCHE` (xp.ts), réservée à it3. C'est une ambiguïté de définition écrite, à lever avant découpage en lots.

PROPOSITION — Écrire dans le plan d'it2 : (1) amorce binaire SEULEMENT (2 valeurs) pour it2, les 4 valeurs sont it3 ; (2) un « hors périmètre » explicite et chiffré — XP, boutique, combat, reprise de session, « Laisser/Passer », marge/TC/chiffres exposés — aucun de ces fichiers n'entre dans les lots d'it2 ; (3) la question héritée du cadrage (prédicat anti-tutoiement sur enjeu_reussite/enjeu_echec) reçoit un VERDICT nommé en tour 3 — RETENU/REJETÉ/REPORTÉ avec propriétaire — pas un second report muet.

VERDICT — recevable sous réserve : binaire-only écrit noir sur blanc dans les critères d'it2, hors-périmètre listé, question héritée statuée en tour 3.

---

DÉCISIONS PRISES EN AUTONOMIE PAR L'AGENT (faute de spécification explicite) :

- Arité de l'amorce qualitative pour it2 (binaire vs 4 valeurs) → tranché pour le binaire strict (réussit/échoue) en lisant le goal d'it2 comme prioritaire sur la liste `acceptance_criteria` de niveau feature (qui couvre les 3 itérations cumulées, pas it2 seule) → si c'est l'inverse (4 valeurs dès it2), ça force l'extraction de `MARGE_FRANCHE` et un run `test:mutation` dans it2, retire à it3 sa propriété exclusive du seul fichier de règles touché, et risque un seuil dupliqué/renommé entre it2 et it3 (le risque KR-261 nommé explicitement dans le goal d'it3).
- Statut à donner à la question héritée (prédicat anti-tutoiement) dans ce tour → l'agent a choisi de ne pas la trancher lui-même (hors de son domaine de veto — registre de langue est UX/narratif-ia) mais d'exiger qu'elle reçoive un verdict explicite en tour 3 plutôt que d'être reportée une seconde fois sans propriétaire.

Fichiers lus : `.claude/skills/raffinage-iteration/SKILL.md`, `src/features/moteur-arbitre/specification.json`, `docs/ROADMAP-BASCULE-IA.md` (lignes 1-40 et 150-190).
