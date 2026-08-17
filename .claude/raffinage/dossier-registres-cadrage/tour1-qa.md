RISQUE — L'intention roadmap tient en une phrase avec deux « et » cachés (quêtes / indices+graphe / événements / climat) — exactement le signal de coupe que la skill nomme. Plus grave : « indices + son graphe » risque de faire entrer un critère de canevas (pan/zoom, disposition dagre) qu'AUCUN instrument du dépôt ne peut observer — jest+jsdom est structurellement aveugle sur ce point, et la skill le classe explicitement DIFFÉRÉ. Si ce cadrage laisse passer un critère « le graphe s'affiche » sans repli textuel, il est inobservable par construction.

OBJECTION — La phrase de démo écrite dans le roadmap (« …tenir les quêtes, les indices, les événements de son aventure ») ne passe pas le test de dimensionnement de la skill (une phrase, sans « et ») : elle porte quatre entités (quêtes, indices, événements, climat) qui ouvrent chacune une TRANCHE DE SCHÉMA distincte, précédent direct KR-190 (dossier-fiches, 8 itérations, une tranche par itération). Les mélanger dans une même itération produirait plus de 8 critères et plus de 4 lots.

PROPOSITION — (1) Découper en au moins 4 itérations, une par entité/tranche de schéma (Quêtes → Indices+chaînage → Événements+bascule « lié à l'histoire » → Climat&conditions), chaque `goal` sans « et », ≤8 critères, ≤4 lots. (2) Tout critère « graphe » se reformule en liste textuelle testable (source→cible par id, via `apres_indice_id` déjà résolu par `REFERENCES_SIMPLES`) ; le repointage visuel de `tree-canvas` sort explicitement des critères d'acceptation de cette feature. (3) Chaque itération nomme son test de non-régression sur `__fixtures__/dossier-reference.json`. (4) Nouveaux KR à partir de KR-204.

VERDICT — recevable sous réserve : l'ambiguïté graphe/canevas doit être tranchée AU CADRAGE, pas laissée à la première itération qui la découvrirait en raffinage.

---
ANNEXE — critères d'acceptation candidats (feature entière)

1. Étant donné le dossier de référence, quand chaque itération de `dossier-registres` est livrée, alors les entités déjà persistées (quêtes/indices/événements/climat, si présentes) restent acceptées par `validateDossier` sans modification de leurs champs hors du lot en cours — non-régression nommée, niveau contrat (`couverture.test.ts` / `validate.test.ts` sur `__fixtures__/dossier-reference.json`), même patron que `dossier-objets` (6e critère de sa spec).

2. Étant donné un événement `lie_a_histoire: true` et un second `false`, quand le panneau Événements se rend, alors le premier apparaît dans la liste « lié à l'histoire » et jamais dans l'autre, et réciproquement — discriminance à deux entités dans le même test (KR-197/199), niveau composant (RTL).

3. Étant donné un indice référencé par `savoirs[].apres_indice_id` d'un personnage, quand l'auteur consulte sa fiche, alors la relation source→cible s'affiche en texte (identifiants + libellés), jamais via un rendu canevas — niveau composant, instrument jest/RTL exclusivement (specs navigateur différées, skill `raffinage-iteration`).