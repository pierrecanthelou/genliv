# Tour 2 — UX — Contre-lecture — moteur-interprete it4

## RISQUE
Si KR-274 réutilise « Le récit n'a pas pu être généré. » pour le cas « au-delà du dernier palier », il y a confusion de registre : ce message dit une non-génération technique (échec d'appel/parsing), alors que le plancher de dégradation décrit par narratif-ia (P1/P2/P3) produit un récit réel, appuyé sur une mémoire tronquée — pas un échec. Réutiliser ce texte mentirait sur ce qui s'est passé.

## OBJECTION
À QA (note 4) : la demande de « message fixe » est juste, mais elle mélange deux cas distincts. Si le plancher dépassé casse réellement l'appel (rien à raconter) → le message existant `TEXTE_RECIT_INDISPONIBLE` suffit tel quel, aucune copie nouvelle, aucun écran touché. Si au contraire le plancher dépassé signifie « récit généré mais mémoire tronquée sous P3 » → c'est du silencieux par construction (narratif-ia, note 5), donc zéro texte joueur, et AC#9 doit se lire côté `brain/` (log interne / valeur de retour), jamais côté UI. Ces deux lectures d'AC#9 doivent être départagées avant tout `jest`.

Confirmation au tech-lead (note 2) : la troncature `objets_possedes.slice(-K)` côté CONTEXTE MODÈLE seul, inventaire affiché intact, est bien sans conséquence UI — aucun composant `play-mode` à toucher si narratif-ia lève son veto.

## PROPOSITION
Deux lignes `open_questions` distinctes, pas une fusion : (1) la mienne (traçabilité plan-cible vs livré, indicateur « mode auteur » absent) reste une dette de spec ; (2) celle de narratif-ia (dossier riche → résumé gelé) est un risque fonctionnel de qualité narrative. Même propriétaire `dossier-controles`, déclencheurs différents — fusionner masquerait lequel des deux motive la réouverture. Aucune indication visible nouvelle proposée : le veto durci de PM n'est pas déclenché.

## VERDICT
Objection tour 1 **maintenue** (pas durcie en veto) : ajout des deux lignes `open_questions` distinctes, propriétaire `dossier-controles`, déclencheur = prochain lot qui rouvre ce fichier.
