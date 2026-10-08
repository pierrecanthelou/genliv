# UX Designer — dossier-repetition it3, tour 1

**RISQUE** — Un seul parcours seedé lu comme un verdict. « NON ATTEINT EN 20 PAS » après un arrêt au pas 7 est faux.

**OBJECTION**
1. (veto, langue) « EN 20 PAS » ment dès l'arrêt avant 20. Libellé : « EN {n} PAS · PARCOURS N°{graine} ».
2. (veto, composant) ListeConstats n'existe pas. ListRow + `<ul>` suffit.
3. (veto, état vide) « tout est atteint » et « aucun PNJ » non spécifiés.
4. (veto, registre) Le repli `nom ?? lieu_id` affiche un identifiant brut. → `localiserEntite`.
5. (mineur) Rapport sans trace = pas de dépliable possible.
6. (mineur) Spec dit « Chip », code dit Badge. Badge est correct.

**PROPOSITION**
- `trace: readonly {pas, lieu_id, combat?: {monstre_ref}}[]` dans le rapport.
- `<details>` natif, ListRow lecture seule, Badge combats_traverses tone="muted" (toujours rendu, y compris à 0).
- parler/agir exclus. Co-présence suffit.
- PNJ sans presence : listé comme non atteint, subtitle « Aucun lieu de présence renseigné ».
- Aucun token neuf.

**VERDICT** — recevable sous réserve : objections 1 à 4 intégrées au plan.

## ANNEXE — Contrat de design (état Résultat enrichi)

Ordre vertical : eyebrow ARRÊT, rangée badges (graine + combats), motif + ListRow lieu, bloc NON ATTEINT (eyebrow + groupes LIEUX/PERSONNAGES en ListRow lecture seule), `<details>` des pas (fermé par défaut), bouton Relancer.

États vides : « Tous les lieux ont été visités par ce parcours. » / « Tous les personnages ont été croisés par ce parcours. » / « Aucun personnage dans le dossier. Écrivez-en un dans Personnages. » (lien vers section).

Clavier : Tab traverse summary → lien cas vide → Relancer. ListRow lecture seule hors tabulation. Entrée/Espace sur summary = ouvre/ferme.
