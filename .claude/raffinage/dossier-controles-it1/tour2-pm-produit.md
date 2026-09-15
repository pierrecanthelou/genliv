# Tour 2 — `pm-produit`

**VERDICT** : recevable, sans réserve de périmètre, sous deux conditions — que le plan (a) fixe les huit critères de la QA comme critères d'it1, et non les douze de `plan.acceptance_criteria`, et (b) inscrive le clic de ligne en REPORTÉ avec son motif technique.

**RETRAIT** — deux. (1) Mon objection du tour 1 sur la portée des critères : retirée, la QA livre huit critères propres à it1, étiquetés par lot, qui remplacent toute lecture directe des douze critères de feature ; le plan écrit cette substitution en clair. (2) **Le clic d'une ligne qui sélectionne sa section : retiré du périmètre et reporté.** La sortie technique (render-prop) change la **forme du contrat de prop** de `bascule-editeur` — ce n'est plus le « diff sans logique métier » que j'avais moi-même validé au tour 1 pour justifier qu'une autre feature soit touchée. Pas de commodité de navigation payée par un changement de contrat cross-feature dans le squelette.

**MAINTIEN** — deux. (1) **Dossier importé sans marqueur : hors périmètre.** KR-225 ferme structurellement la faille du champ vide, et le texte calme de l'UX (« contrôles **connus** », pas « dossier prêt ») garde déjà contre la sur-promesse ; aucune heuristique de « vraie prose » à construire. (2) **La fusion à deux lots ne change pas la taille de l'itération** : une phrase de démo, deux lots, huit critères — sous les trois plafonds ; le retrait du clic allège encore le lot d'adoption vers le diff annoncé. La séquentialité d'un seul ouvrier sur L1 puis L2 est un choix d'exécution, hors de mon mandat.

## Hors périmètre définitif (§ 2 du plan)

- **Verdict global « jouable »** — non affiché ; calculé, exporté, testé seulement. Un voyant rouge sur 100 % des dossiers à t=0 est le miroir du voyant vert tautologique déjà refusé.
- **Détection qualitative sur dossier importé** sans marqueur jamais posé — hors périmètre : `validate.ts` rend un champ requis vide structurellement impossible ; le silence est le comportement attendu, pas une lacune.
- **Clic sur une ligne du panneau pour sélectionner sa section** — REPORTÉ (motif : render-prop changeant la forme du contrat de prop de `bascule-editeur`). Lignes non cliquables en it1.
- **Rafraîchissement ou synchro entre deux panneaux ouverts simultanément** — le calcul dérivé au rendu suffit (KR-013).
- **Pastille INFO exercée par une vraie règle** — non ; seul le mapping des trois tons est requis.
- **Tri, groupement par niveau, compteur d'en-tête, persistance du rapport, masquage d'une ligne** — aucun requis.
- **Sous-titre inventé sur l'entrée de nav** — aucun.
- **Badges de nav** (it2) · **les cinq règles de registre** (it3) · **atteignabilité et canon sans objectif** (it4) · **agrégation des avertissements du validateur** (question ouverte) · **tout lot contrat sur `validate.ts` / `types.ts` / `destinations.ts`** · **focus dans le champ fautif d'une autre feature**.
