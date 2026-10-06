# QA — moteur-horloge it2 — TOUR 1

**RISQUE** — Le contrat du champ `depuis` (KR-298, KR-249) n'a pas de réponse à : « quelle est l'origine du décompte quand une EtatPnj est créée pour la première fois par le tick ? » Initier `depuis = tour` ou `depuis = tour−1` change si une étape sans déclencheur se déclenche à `tour+duree` ou `tour+duree+1`. Impossible de concevoir `tickHorloge` v2 avant cette réponse.

**OBJECTION**
1. « L'auteur lit sous le récit du narrateur ce qui a changé » — mélange construction (contexte R3) et narratif (prose IA). Séparer le contrat du critère d'usage.
2. « Perceptible au lieu courant du joueur » — aucune spécification : tous les PNJ ou ceux au même lieu ? Filtre inexistant.
3. Absence de description de `changementsDe(avant, après)` — où lit-on l'état avant ? Architecture manquante.

**PROPOSITION**
1. Trancher maintenant : `depuis = tour` à l'avancement.
2. Scinder le critère en contrat (champ `changements` dans R3) et test (chaque delta porte id, type, cible).
3. Écrire la géométrie du flux.

**VERDICT** — recevable sous réserve. Trois points bloquent : initialisation de `depuis`, filtre spatial, architecture de la projection.
