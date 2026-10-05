# Tour 2 — UX — moteur-horloge it1

**Tranche : base 1.** Format `etape_plan : pnj.garde 1 → 2`.

- Les fiches numérotent déjà en base 1. `BlocPlanActions.tsx:222` écrit `ÉTAPE ${index + 1}` et `FicheQuete.tsx:223` fait de même. L'auteur lit le journal avec la fiche en regard. Un `0` n'existe nulle part à l'écran. Il le lirait comme un défaut de numérotation.
- La proposition NIA est cohérente avec `rang`, mais `rang` est un nom interne. Le journal est de l'interface, il est lu par l'auteur.
- Le rang reste en base 0 dans l'état (KR-298). Seul le texte ajoute 1, dans un unique helper pur (`rang + 1`) qui sert aux deux membres de la flèche.
- Premier passage, sans état précédent : `etape_plan : pnj.garde 1`, sans flèche. C'est le précédent de `commandes.ts:400`, `lieu_courant : ${session.monde.lieu_courant}`. Je n'invente ni glyphe ni libellé « initial ».
- Coût si c'est l'inverse : un décalage de 1 entre journal et fiche, que l'auteur remarque dès la première partie. Un test épingle `rang 0 → rang 1` donne `1 → 2`.

**Réponse nommée à NIA (R-3 et R-4).** D'accord pour rejeter l'action et l'origine dans le texte. Cela recoupe mon veto de registre (a), qui est maintenu : identifiants et ordinaux seulement, pas de prose, pas de verbe, pas de nom d'action, pas de `si_bloque`.

**Réponse au Tech Lead.** La ligne « bloqué » à `tour − depuis === duree` est refusée pour it1. Elle suppose `duree`, et le PM reporte durée, depuis et bloqué en bloc. Elle ajouterait un état dans un texte qui ne porte que des identifiants.

**Statut de mes objections**
- (a) Registre : maintenue, veto.
- (b) `ÉTAPE BLOQUÉE` reporté à it2 : retirée. Le veto PM sur le goal la rend sans objet. Elle reste inscrite pour it2.
- (c) Numéro en base 1 : maintenue, tranchée ci-dessus.

**Contrat design.** Inchangé. `JournalRow` est réutilisé sans composant nouveau, aucun token ni état vide nouveau, et le clavier ne change pas.
