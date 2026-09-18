# Tour 1 — `pm-produit` · `dossier-copilote` it2

**RISQUE** — Le goal dit « accepte ou refuse CHAQUE détenteur proposé » (pluriel) : ça laisse ouvert si le copilote rend UN candidat par appel ou une LISTE de N candidats en une réponse. La seconde lecture est une anatomie neuve (liste de lignes à décider indépendamment) que rien n'a prouvée — `LigneProposition` ne connaît que REMPLISSAGE/REMPLACEMENT (it1), pas une liste de candidats. Si ce n'est pas tranché au plan, deux ouvriers l'inventeront différemment, et `PanneauCopilote.tsx` (421 lignes, signal KR-112 déjà levé à l'it1) est le fichier qui paiera le débordement.

**OBJECTION** — La définition écrite ne dit pas SI un ou plusieurs candidats sortent d'un même appel. Ce n'est pas un désaccord d'opinion, c'est une lacune : sans trancher, la tranche n'est pas exécutable par un ouvrier isolé sans qu'il invente une anatomie.

**PROPOSITION** —
1. Point de DÉPART = liste d'indices filtrée STRICTEMENT par les `Controle` `indice-sans-source` (bloquant + alerte) que rend `controlerDossier` sur ce dossier — jamais tous les indices. C'est la valeur même de « confier un indice mal servi » ; balayer tous les indices duplique `dossier-controles` (déjà REJETÉ nommément à l'it1, « rebalayage des indices »).
2. Trancher l'anatomie en faveur d'UN candidat par appel, ré-actionnable par « Lancer » comme it1 — réutilise l'anatomie déjà prouvée, aucun composant neuf.
3. Hors périmètre explicite, à écrire noir sur blanc : `revele_comment`, portes `revele_si`, `mene_a`, création d'indice, création de personnage candidat (désignation parmi l'EXISTANT seulement — aucun brouillon d'entité, cohérent avec l'ordre rangs→nombres→entités du roadmap).
4. Sur `estDisponible()` : hors mon domaine de veto (Tech Lead/KR-109) — si retenu, une ligne d'état réutilisant le pattern `titreLancer`/`aucunPersonnage` déjà existant, pas un écran neuf, pour ne pas aggraver KR-112.

**VERDICT** — recevable sous réserve : l'anatomie « un candidat à la fois » et la liste hors-périmètre ci-dessus doivent être écrites explicitement au plan avant l'essaim.

---
Fichiers lus : cadrage, SKILL.md, `docs/ROADMAP-BASCULE-IA.md` (n° 8 `dossier-copilote`, l. 152 et 173), `specification.json`, `dossier-copilote-it1.revue.md`, `PanneauCopilote.tsx`, `textes.ts`. (`dossier-copilote-it1.plan.md` non relu séparément.)
