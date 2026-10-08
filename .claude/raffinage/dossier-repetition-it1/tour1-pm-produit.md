# dossier-repetition it1 — PM — Tour 1

**RISQUE** — Valeur : un seul parcours aléatoire qui ne sait qu'`aller` est anecdotique. L'auteur lira « impasse » comme « mon dossier est cassé ». Or une porte qui exige un objet venu d'`agir` ou de `parler` est une fausse impasse pour ce joueur. Gonflement : les 13 critères sont écrits pour la feature entière, sans affectation par itération.

**OBJECTION**
1. Périmètre : il y a plus de 8 critères. mort/combat_sans_issue = it2, lieux/PNJ non visités et « NON ATTEINT EN 20 PAS » = it3, « Rejouer à l'identique » = it3 ou rien.
2. Valeur : l'état « aucun blocage (message positif) » affirme une absence qu'un tirage ne prouve pas.
3. Définition : `ouverture_a_ecrire` n'a aucun état d'écran propre. « Échap ferme » n'a rien à fermer.

**PROPOSITION** — it1 tient en 8 critères :
- (a) `repeter` pure, jamais stocké, zéro IA (critères 1+5).
- (b) Au plus PAS_MAX=20 pas, par `aller` seul (KR-315).
- (c) Quatre motifs d'arrêt avec un témoin nommé chacun.
- (d) Même graine, même parcours.
- (e) Les deux refus → UN seul état « à corriger », lien vers la section du premier bloquant.
- (f) Panneau en trois états (invite / résultat / à corriger), un bouton « Lancer », Entrée.
- (g) 4e racine de `moteurSansIA` et gardes d'imports.
- (h) Copie factuelle : « Impasse pour un joueur qui ne fait qu'aller ». Jamais « dossier cassé », jamais « tout va bien ».

Reports : « aucun blocage », « Rejouer à l'identique », « Échap ».

**VERDICT** — Recevable sous réserve. Levée si les 8 critères ventilés sont écrits dans la spec avant tout code.
