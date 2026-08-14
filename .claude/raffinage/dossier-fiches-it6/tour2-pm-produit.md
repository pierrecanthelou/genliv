RISQUE / OBJECTION / PROPOSITION / VERDICT — PM-PRODUIT, tour 2

**RISQUE** — La décharge blocs 1-2 (12 fichiers) est à comportement nul : elle n'ajoute rien à la phrase de démo (« l'auteur peut éditer un savoir à 4 portes »), donc elle ne viole ni le périmètre ni la verticalité. Mon risque : qu'elle mange le budget du lot si l'itération presse, au détriment de Savoirs — c'est Savoirs qui prime, jamais l'inverse.

**OBJECTION 1 (répond au tech-lead, point 1)** — J'accepte le bundling en un seul lot (ce n'est pas mon domaine : architecture). Réserve : la décharge doit être journalisée comme `architecture_choices` distinct à l'étape 4, pas absorbée en silence dans le diff Savoirs — traçabilité, précédent `ObjectifsCanon`. Pas de veto, objection mineure.

**OBJECTION 2 (répond au QA, point 2)** — Je tranche pour QA : le critère racine #6 se reformule « chacune des 4 portes s'ajoute et se retire indépendamment, prouvé séparément » (pas 4 critères séparés — reste sous mon plafond de 8). C'est un correctif de formulation du plan, zéro scope neuf.

**PROPOSITION** — Adopter les deux corrections ci-dessus au plan avant écriture ; rien à retirer, rien à ajouter au périmètre.

**Statut de mon objection tour 1** (indice_id/objet_id sans producteur) — retirée. Motif : converge avec l'état vide déjà écrit par l'UX (`TEXTE_AUCUN_INDICE_CANON`/`TEXTE_AUCUN_OBJET_CANON`) — même solution, pas concurrente. Ma formulation « arrive en n°6 » était inférieure (fuite de numérotation roadmap vers l'auteur) ; je m'aligne sur le texte UX, sous réserve de la correction du tech-lead (gate sur `savoirs.length`, pas `monde.indices.length`, pour ne pas masquer des savoirs déjà écrits — précédent M1 it5).

**VERDICT** — recevable sous réserve (critère #6 reformulé + décharge journalisée distinctement, sans jamais passer avant Savoirs).
