# Tour 1 — UX Designer

**RISQUE** — livrer une remédiation circulaire (classe BUG-090) : nommer, pour `echoue_si_expr`, une surface d'édition dont l'inexistence est mesurée dans le même fichier (mesure E, H5 : aucun éditeur de `_expr`, aucun champ d'inventaire de départ). Risque secondaire : faire fuiter « tour zéro », notion de session, dans une phrase adressée à un auteur qui n'a jamais joué.

**OBJECTION** — sur la définition telle qu'écrite : le cadrage laisse ouverte l'hypothèse `bloquant` (Q1) par « symétrie » avec `objectif-sans-chemin`. Cette symétrie est fausse au niveau du GESTE : `objectif-sans-chemin` a un remède réel et mesuré (poser un producteur — Quêtes, Événements, Jalons, Personnages → Savoirs) ; la présente règle n'en a aucun — ni pour l'expr, ni pour l'inventaire de départ. Appliquer le même niveau sans le même geste viole la doctrine d'it8 citée par le cadrage lui-même (« une capacité absente n'atteint le BLOQUANT que si l'éditeur offre AUJOURD'HUI le geste qui la restaure »).

**PROPOSITION** — (1) niveau `alerte`, jamais `bloquant`, faute de geste aujourd'hui ; (2) message et remédiation littéraux en annexe, qui n'inventent ni ne nomment aucune surface fictive — la remédiation dit honnêtement l'absence de geste plutôt que de la maquiller ; (3) traduire « tour zéro » en français d'auteur non technique : « avant que le joueur ait agi », jamais un mot de session.

**VERDICT** — recevable sous réserve : sous réserve que le niveau reste `alerte` et que le texte soit exactement celui de l'annexe (aucune reformulation qui réintroduirait un écran nommé sans exister).

---

## ANNEXE — contrat de design

Aucun fichier d'UI touché (confirmé par le cadrage §10) — donc aucun composant, aucun token neuf. Ce contrat porte uniquement les DEUX chaînes de `controles.ts` que je défends, consommées telles quelles par les primitives existantes (`ListeControles.tsx` → `Badge`/`pastilleNiveau`/`controleRemediation`, déjà tokenisées, déjà clavier-natives — `<button type="button">`, Tab/Entrée/Espace natifs, aucun `onKeyDown` maison).

**Niveau** : `alerte` (jamais `bloquant` — voir OBJECTION).

**`message`** (indicatif présent, sujet = le document, comme les huit règles existantes) :
> « Cette condition d'échec est vraie dès l'ouverture de la partie : le joueur perd cet objectif avant d'avoir agi. »

— zéro mot de `TERMES_INTERDITS` (`↪`, `_texte`, `_expr`, `si_bloque`, `revele_si`, `réimport`, `bloquant`, `warning`, `error`) ; zéro « tour zéro » ; ne promet aucun effet moteur à un geste de prose.

**`remediation`** (impératif, deuxième personne du pluriel, sujet = l'auteur — mais honnête sur l'absence de geste plutôt que circulaire) :
> « Aucun écran ne permet aujourd'hui de donner un point de départ à l'inventaire du héros ni de modifier cette condition d'échec : revoyez si cet objectif doit vraiment être perdu dès la première scène (Canon → Objectifs des camps). »

— nomme le SEUL écran réel où l'objectif est visible (`ObjectifsCanon.tsx`, eyebrow mesurée « OBJECTIFS DES CAMPS »), sans prétendre que cet écran répare la cause (il ne le peut pas — mesuré). Différence assumée avec `REMEDIATION_OBJECTIF_SANS_CHEMIN` : celle-ci nomme des producteurs qui EXISTENT et RÉSOLVENT ; la mienne nomme un lieu de RELECTURE, pas un remède.

**`location`** : `localiserEntite('objectif', objectif, index)` — primitive existante, aucun texte nouveau.

**Registre de langue** : les deux chaînes respectent la garde `controles.test.ts:1647` — indicatif document / impératif auteur, aucun terme interne, aucune deuxième personne immersive.

**État vide** : sans objet — cette règle ne touche aucune liste ni aucun champ d'édition ; le placeholder de `ObjectifsCanon.tsx` (`PLACEHOLDER_ECHEC`) reste inchangé.

**Clavier** : aucun changement de surface interactive.

**Point non tranché hors de mon terrain** : Q2, Q3, Q4 sont des questions d'architecture / logique de jeu. Je note seulement que si Q3 retient un verdict `indécidable`, aucun constat ne doit être émis dans ce cas (silence, jamais un troisième message qui devinerait) — mais l'arbitrage appartient au tech-lead / narratif-ia.
