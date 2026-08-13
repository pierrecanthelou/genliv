# TOUR 1 — PM Produit · `dossier-fiches` it2

## RISQUE

`panneauPersonnages.test.tsx` épingle déjà les 7 placeholders avec leurs N exacts (bloc 2→7). Ce redécoupage change *tous* ces N (2→3, 3→4, 4→5×3, 5→6) **et** retire un placeholder (bloc Identité devient réel) : si la recalibration n'est pas dans le même lot que `BlocIdentite`, ce test casse silencieusement à la merge, pas avant.

## OBJECTION

Le cadrage grafte sur « l'auteur écrit 3 champs de prose » un durcissement d'écriture complet (EcritureDossier propagée, `RefusEnCours{personnageId,issues}`, `IssueList`). Or `fonction`/`apparence`/`description_joueur` ne portent **aucune borne, aucune référence** (`bornes_de_longueur` ne les cite pas) — donc aucun `statut:'refuse'` n'est atteignable depuis ce bloc, exactement le diagnostic que la QA elle-même a fait tomber en it1 (« ne pas construire un bandeau qui ne peut jamais s'allumer »). Construire `issues` maintenant reproduit l'anti-patron déjà rejeté une fois. Seul `statut:'absent'` (suppression concurrente) est génériquement atteignable, indépendamment des 3 champs.

## PROPOSITION

- (a) Propager `EcritureDossier` et gérer `'absent'` : retenu, coût faible, général — pas un critère « identité ».
- (b) `RefusEnCours{issues}` + `IssueList` : **réduit** au cas `'absent'` seul cette itération ; le volet `issues` (validation de contenu) attend le premier champ d'it2+ qui porte réellement une borne/référence.
- (c) Test d'écriture à deux personnages sur `camp`/`plan`/`objectif_id` (bug it1) : retenu, mais nommé séparément — régression, pas critère d'identité.
- Retrait de personnage : tranché **non livré ici**, reporté.

## VERDICT

Pas de veto sur le goal (tranche verticale, une phrase, valide). Réserve forte sur (b) tel que cadré — à réduire avant validation, sinon durcie en veto au tour 2 (double-slice caché derrière un « et » non écrit).
