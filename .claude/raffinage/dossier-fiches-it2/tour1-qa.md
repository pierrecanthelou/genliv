# TOUR 1 — QA · `dossier-fiches` it2

## RISQUE

Sondé sur `validate.ts` + `tables.ts` : `fonction`/`apparence`/`description_joueur` (optionnels, hors `CHAMPS_REQUIS`) ne peuvent produire qu'un `warning` `texte-trop-long` (budget de mots) — jamais un `errors.length > 0`. Donc `statut:'refuse'` reste **structurellement inatteignable** depuis ces 3 champs, exactement comme en it1. Seul `statut:'absent'` (dossier supprimé pendant l'édition) est un chemin de refus réel et testable pour it2.

## OBJECTION

Je bloque toute formulation de `RefusEnCours{personnageId, issues}` qui prétendrait couvrir la branche `refuse` pour les champs de prose : aucun instrument existant ne peut l'allumer, un test qui la simulerait par `jest.spyOn(dossiers,'update').mockReturnValue({statut:'refuse',...})` prouverait le rendu du bandeau mais pas qu'un auteur peut l'atteindre — à écrire dans « non vérifiable » de la revue, pas coché comme critère.

## PROPOSITION

Tests nommés :

- (a)/`absent` → `panneauPersonnages.test.tsx` « dossier supprimé pendant l'édition : bandeau, pas de silence » (mock `statut:'absent'`, assert `role="status"`).
- (c) → « identité : écrire sur DEUX personnages, aucune fuite d'indexation » — la mutation `personnageAffiche.id → personnages[0].id` doit faire échouer ce test précis.
- BUG-064 → réécrire le test « 7 placeholders » en « 6 placeholders » : Identité rempli (retiré de `BLOCS_VIDES`), Caractéristiques→it3, Objectif & plan d'actions→it4, Savoirs/Relations/Présence→it5, Caractère exploitable→it6 — même correctif dans `FichePersonnage.tsx` (table `BLOCS_VIDES`). Étendre le motif BUG-064 (montage + clic, 2 personnages, valeurs non fabricables) aux 3 champs de prose.

## VERDICT

7 critères tiennent (création/persistance identité, lecture 2-entités, écriture 2-entités KR-197, `absent` géré, 6 placeholders renumérotés, non-régression 6 personnages, lint/tsc). **Favorable sous réserve** : retirer toute prétention à tester `refuse` sur la prose libre.
