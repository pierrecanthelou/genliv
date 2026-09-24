# Tour 1 — pm-produit — moteur-dossier it2

RISQUE — Le port de stockage `{ lire, écrire, effacer }` risque d'être livré comme interface sans second appelant réel : son domicile naturel, `src/player/utils/persist.ts` / `usePlaySession`, a été explicitement refusé en it1 (D-19, revue it1) car orphelin dès it4. S'il ne gagne pas en it2 un appelant concret et non condamné, c'est exactement la faute KR-109 qu'on prétend réparer, déguisée en dette payée.

OBJECTION — Le `goal` mêle une capacité démontrable (« aller ») à trois moyens techniques (`JournalRow`, port, replay). `JournalRow` est un vrai MOYEN : sans narration générée (propriété définissante de la feature), le journal est l'unique preuve visible que le déplacement a eu lieu — pas parasite. Le port l'est aussi À CONDITION de trancher la reprise (open_question b) : `open_questions` dit noir sur blanc que « le port de stockage d'it2… doit trancher AVANT d'envelopper `useSessionPersistee` », mais le texte du `goal` lui-même ne le nomme pas — seule la lecture croisée de la spec le révèle. Le replay déterministe (D-8, déjà tranché à it1) ne figure dans aucune phrase que l'auteur observe : c'est une garantie interne (KR-242), légitime à livrer maintenant, mais à ne jamais confondre avec la démo.

PROPOSITION — Faire nommer par le tech-lead, AVANT découpage en lots : (1) le second appelant concret et non condamné du port ; (2) la décision reprise-vs-écrase au remontage (résout ouvertement l'open_question b). La revue d'itération doit dire explicitement que le replay déterministe est une garantie de correction et non une capacité auteur, pour que la phrase de démo reste à une seule capacité.

VERDICT — recevable sous réserve (le port doit nommer son second appelant réel et trancher la reprise avant l'ouverture des lots ; sinon veto au tour 2).

Fichiers lus : `docs/ROADMAP-BASCULE-IA.md` · `src/features/moteur-dossier/specification.json` · `.claude/raffinage/moteur-dossier-cadrage.plan.md` · `.claude/raffinage/moteur-dossier-it1.revue.md` · `src/brain/dossier/session.ts` · `src/features/play-mode/components/EcranPartie.tsx`
