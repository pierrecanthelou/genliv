## NIA — moteur-horloge it4 — tour 1

**RISQUE** — Le mécanisme d'activation risque de déposer dans le contexte un identifiant non validé, ou de laisser une `manifestation` persistante après extinction. Si la route est mal bornée, le narrateur décrirait un temps clair pendant la tempête, ou une tempête après sa fin.

**OBJECTION** — `nom` dans le bandeau crée un précédent : aucune autre entité du registre n'a son `nom` affiché en jeu. Pas un veto (c'est du code UI, pas du prompt), mais la spec doit le dire explicitement : le `nom` est lisible par le composant bandeau, jamais par un assembleur de contexte.

**PROPOSITION**
1. Bloc CLIMAT dans R3 SÉPARÉ de PENDANT CE TEMPS. Position : après ICI A1, avant CE PAS. Contenu : `manifestation` seule, repliée sur une ligne. En-tête : CLIMAT (6 caractères). Hors cascade.
2. Activation : Evenement écrit `horloge.climat_actif` + `tour_activation` ensemble (comme rang + depuis en it2).
3. Extinction par égalité `tour − tour_activation === duree` (même doctrine que blocage).
4. Budget : +149 caractères, palier 8000 ne bouge pas.

**VERDICT** — Recevable sous réserve : (a) bloc climat séparé de PENDANT CE TEMPS, (b) `nom` bandeau explicitement UI-seul, (c) activation écrit id + tour_activation ensemble, (d) extinction par égalité.

---

## ANNEXE

- Bloc CLIMAT : séparé, après ICI A1, avant CE PAS. manifestation seule. Pas d'id, nom, durée, effets_regles. Repli = silence.
- Budget : M+149 = 2520, palier reste 8000.
- Identifiants stables : climat_actif est un id stable, jamais le nom. Le narrateur ne reçoit que manifestation.
- Frontière code/IA : l'IA ne demande jamais l'activation. Le code éteint. Pas de prose d'extinction injectée.
- Idempotence : effets appliqués UNE FOIS à l'activation. Si événement consommé (un seul usage), pas de flag nécessaire.
