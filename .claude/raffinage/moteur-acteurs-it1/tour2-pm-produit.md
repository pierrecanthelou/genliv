# Raffinage `moteur-acteurs` it1 — Tour 2 — PM Produit

## RÉPONSE AUX OBJECTIONS — nommée (le conflit PRESENTS/narrateur.ts)

J'ai lu `src/brain/copilote/contexte/narrateur.ts` en entier. Les deux notes ne parlent PAS du même site : ce n'est pas une contradiction à arbitrer entre deux lectures du même changement, ce sont deux changements différents, avec un statut différent.

1. **La table de candidats PNJ que je redoutais en tour 1 n'existe nulle part dans `narrateur.ts`.** R3 n'est JAMAIS appelé sur un pas `parler` (consensus Tech Lead + Narratif-IA, annexe A de Narratif-IA) — il n'a donc structurellement aucun rôle à jouer dans « qui est adressable ». Cette table vit entièrement dans `contexte/interprete.ts` (R1). Mon inquiétude de tour 1 portait sur le mauvais fichier ; Tech Lead a raison sur ce point précis : zéro édition requise pour ça.
2. **Le bloc `PRESENTS` de Narratif-IA (§B) EST le second comportement que mon veto visait** — pas parce qu'il est ambitieux, mais parce qu'il est indépendant du `goal` d'it1. Puisque R3 n'est jamais appelé sur `parler`, `PRESENTS` ne sert JAMAIS à démontrer « le joueur parle, le PNJ répond » : il démontre autre chose — « la narration d'un pas `agir`/`aller` mentionne les PNJ présents ». Deux phrases de démo, zéro dépendance de l'une vers l'autre : la définition même d'une seconde tranche, pas d'un prérequis de cohérence. Un pas `agir` qui ne mentionne pas un PNJ présent est SILENCIEUX sur lui, pas CONTRADICTOIRE — même doctrine que le fichier applique déjà partout ailleurs (« silence sur un champ non rédigé plutôt qu'une affirmation »).

Coût réel mesuré si `PRESENTS` entrait quand même en it1 : la liste fermée des onze chemins `ia` (KR-261) passe à douze, `contexte.test.ts` doit suivre la dérivation ligne à ligne, `BUDGET_CARACTERES_DOSSIER` (M=1937 aujourd'hui) doit être re-mesuré avec un PNJ présent dans la fixture. Ce n'est pas un ajout « juste une apparence, coût nul » — c'est le même type de remesure qui a déjà pris un tour entier de raffinage à l'it3 de `moteur-arbitre`. Payer ce coût sans bénéfice observable pour le `goal` d'it1, c'est gonfler l'itération.

**Point technique distinct, à ne pas confondre avec `PRESENTS`.** Narratif-IA note, en passant, que `LIGNE_DE_PAS_MAX` devrait peut-être intégrer `REPLIQUE_CARACTERES_MAX` (400) en plus de `NARRATION_CARACTERES_MAX` — parce que `consignerNarration`, réutilisée telle quelle pour `parler`, écrit la réplique dans `recit`, et `ligneDuPas` rejoue ce `recit` sans distinguer son origine dès qu'un pas `parler` tombe dans la fenêtre `RECEMMENT`/`A CONDENSER` d'un appel R3 ultérieur. Si `REPLIQUE_CARACTERES_MAX` dépasse `NARRATION_CARACTERES_MAX`, `BORNE_MEMOIRE` sous-évalue silencieusement son pire cas — un bug de budget, pas un contenu neuf. Zéro texte nouveau, zéro capacité observable de plus : une correction défensive d'une constante déjà en place. **Ce point n'est pas couvert par mon veto** — à Tech Lead/QA de vérifier les deux constantes ; si l'écart est réel, c'est une ligne de plus dans le lot contrat, jamais un fichier de périmètre en plus.

## MA POSITION MISE À JOUR

Mon objection de tour 1 (« la touche à `narrateur.ts` ne doit pas dépasser la table de candidats ») : **retirée dans sa forme initiale** — ce site n'existe pas dans `narrateur.ts`, Tech Lead a raison. **Durcie en veto, reformulée et nommée** : le bloc `PRESENTS` (§B, Narratif-IA) est hors périmètre d'it1. Il ajoute une capacité de narration indépendante de `parler`, sans lecteur ni bénéfice pour le `goal` d'it1, au coût mesuré d'un douzième chemin `ia`, d'une remesure de `BUDGET_CARACTERES_DOSSIER` et d'une réouverture de `contexte.test.ts`.

Report proposé : `PRESENTS` devient sa propre ligne candidate pour une itération future — démontrable seule en une phrase (« l'auteur voit son décor mentionner les PNJ présents sans leur parler »), le jour où ce bénéfice se mesure utile en pratique. Ça ne s'ajoute PAS aux itérations 2/3/4 déjà numérotées — c'est une 5e ligne hors séquence actuelle, à caler plus tard dans le plan.

Mon autre point de tour 1 (quels critères d'acceptation parmi les 9 globaux relèvent d'it1) : non contesté par personne — **maintenu tel quel**.

## VERDICT — recevable sous réserve
- `narrateur.ts` sort du lot contrat d'it1 pour la table de candidats (confirmé, aucune édition requise) ;
- le bloc `PRESENTS` est explicitement retiré du périmètre d'it1 et noté en report, hors numérotation 2/3/4 actuelle ;
- si et seulement si Tech Lead/QA mesurent un écart réel entre `REPLIQUE_CARACTERES_MAX` et `NARRATION_CARACTERES_MAX`, la correction de `LIGNE_DE_PAS_MAX` entre dans le lot contrat comme ligne défensive — zéro bloc de contexte neuf, zéro chemin `ia` de plus.

---

## Décisions prises en autonomie faute de spécification (Tour 2)
- Le bloc `PRESENTS` est-il un prérequis de cohérence ou une capacité distincte → tranché capacité distincte, parce que R3 n'est jamais appelé sur `parler` (son absence n'est donc jamais visible dans la démo du `goal` d'it1) → si c'était l'inverse, il faudrait l'inclure malgré le coût mesuré, et la phrase de démo d'it1 porterait un « et » qu'elle n'a pas aujourd'hui.
- Le sort de la remarque de Narratif-IA sur `LIGNE_DE_PAS_MAX`/`REPLIQUE_CARACTERES_MAX` → classé hors de mon veto (correction défensive, zéro contenu neuf) → si c'était l'inverse, le budget de mémoire d'it1 resterait silencieusement sous-évalué dès qu'une réplique de PNJ entre dans la fenêtre `RECEMMENT` d'un pas suivant.

## Fichiers lus (Tour 2)
`src/brain/copilote/contexte/narrateur.ts` (entier, 678 lignes) ; `.claude/raffinage/moteur-acteurs-it1/tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md` ; `src/features/moteur-acteurs/specification.json`.
