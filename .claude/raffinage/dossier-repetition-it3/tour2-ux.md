# UX Designer — dossier-repetition it3, tour 2

RÉPONSES AUX AUTRES
- [QA] Critère #8, états limites → couvert : trois états vides écrits mot pour mot, avec « placés ».
- [TL] PNJ sans `presence` EXCLUS → accepté. Doublon avec Contrôles. L'état vide dit « placés ».
- [PM/TL] Dépliable + Badge reportés it4 → accepté. `parcours` suffit pour it3.
- [Tous] Libellé → eyebrow « NON ATTEINT SUR CE PARCOURS », badges « EN {n} PAS · PARCOURS N°{graine} ».
- [TL] ListeConstats → accepté si composition pure ListRow + `<ul>`, sans CSS/token propres.

STATUT DE MES OBJECTIONS
1. Libellé « EN 20 PAS » → retirée (consensus)
2. ListeConstats composant maison → maintenue (condition : pas de CSS propre)
3. États vides → maintenue (trois textes avec « placés »)
4. Repli `nom ?? lieu_id` → maintenue (`localiserEntite` obligatoire)
5. Pas de trace → retirée (dépliable reporté)
6. Chip/Badge → retirée (Badge confirmé)

VERDICT FINAL — recevable sous réserve (« placés », `localiserEntite`, ListeConstats sans CSS propre)
