RÉPONSE AUX OBJECTIONS

RISQUE — un champ approuvé au cadrage (`portee`) mais non rendu risque d'être lu, à tort, comme mort au même titre que `lie_au_canon` si le motif du report n'est pas écrit noir sur blanc.

OBJECTION — je retire le rendu de `portee` dans FicheIndice.tsx. Contrairement à `lie_au_canon` (dérivable, rejeté au type) et `tier` (sans producteur), `portee` reste un champ de type valide, approuvé au cadrage. Tech Lead a raison sur le symptôme : un Select sans lecteur avant le lint n°7 fait remplir à l'auteur une donnée que rien ne relit — le critère même que j'ai co-signé pour rejeter `lie_au_canon`.

Sur `mene_a`, je retire aussi l'auto-exclusion UI. KR-194 est net : BlocRelations.tsx ne filtre pas l'auto-référence au sélecteur. Mon exclusion forkait ce motif sans le documenter, et ne garantissait rien pour un dossier importé.

PROPOSITION — Fiche Indice d'it1 : 3 champs rendus (verite, formulation_joueur, mene_a[]) ; `portee` reste au type, sans Select. `mene_a` réutilise Select/avecOrpheline/localiserEntite tel quel, sans filtrer l'indice édité.

VERDICT — Alignée avec PM + Tech Lead sur `portee`, avec QA sur `mene_a`. Mes deux objections du tour 1 : RETIRÉES, aucune durcie en veto.

ANNEXE — Contrat de design, FicheIndice.tsx (mise à jour tour 2) :
1. VÉRITÉ — lue par le MJ seul (Field, textarea) — placeholder « Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt. »
2. FORMULATION JOUEUR — lue par le joueur (Field, textarea) — placeholder « Une odeur de cendre froide, là où elle ne devrait pas être. »
3. MÈNE À — liste ListRow d'identifiants + Select (avecOrpheline() + localiserEntite()) — aucun filtre sur l'indice en cours d'édition ; auto-référence tolérée sans garde ; état vide : « Aucun enchaînement — cliquez « + Ajouter... » pour lier cet indice à un autre. »

`portee` : posé au type, zéro rendu dans FicheIndice.tsx cette itération.

NOTE ORCHESTRATEUR : Tech Lead a depuis (tour 2, écrit en parallèle) trouvé un bug réel dans la proposition « aucun filtre » d'UX pour la ligne d'ajout — un faux orphelin si on filtre sans corriger avecOrpheline. Voir arbitrage : la ligne d'AJOUT exclut l'indice courant, les lignes EXISTANTES affichent la liste complète.