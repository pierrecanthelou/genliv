# Tour 1 — PM Produit

RISQUE — L'itération 1 n'a aucune prose (R3 absent) : le goal et les 12 acceptance_criteria sont écrits au niveau FEATURE, pas au niveau itération. Rien n'affirme noir sur blanc que it1 n'en couvre qu'un sous-ensemble ; un ouvrier lisant `plan.acceptance_criteria` en vrac pourrait se sentir autorisé à toucher `agir`/R3/mémoire/budget (items 5,6,7,8,9), rouvrant KR-263/266 déjà tranchés au cadrage.

OBJECTION — la définition telle qu'écrite mélange 4 itérations dans un seul tableau de critères sans balise d'itération. `iterations[].goal` restitue bien le périmètre d'it1 en une phrase, mais ce n'est pas la porte de commit citée par la spec — le tableau `acceptance_criteria` l'est, et lui ne distingue rien.

PROPOSITION — geler par écrit, avant essaim, le sous-ensemble d'it1 : critères 1 (aller reconnu), 2 (clarification), 3 (sans_commande), 4-volet R1 (rejeu unique puis dégradation), 10 (moteurSansIA réécrit), 11 (verrou de tour). Les critères 5,6,7,9 rejoignent une section "hors périmètre it1" explicite (report it2/it3/it4), le critère 12 se limite à l'invariant de forme (journal stocke des `Commande`, jamais la saisie brute) sans implémenter de rejeu. Contrepartie : je ne rajoute rien, je découpe ce qui est déjà écrit en vrac — aucun nouveau lot.

VERDICT — recevable sous réserve. Le découpage en 4 itérations est correct, la tranche d'it1 est verticale et démontrable en une phrase (« l'auteur tape une action libre dans l'Aperçu du jeu ; R1 la traduit en déplacement reconnu, demande de précision, ou refus poli — même entonnoir que la console, aucun récit encore »), l'ordre (dépend de n9, terminée 4/4) est respecté, aucune décision actée (agir en it2, sans_commande forme fermée, Chip feature-local, memoire gelée en it3) n'est rouverte ici.

## DÉCISIONS PRISES EN AUTONOMIE (PM)

- Le sous-ensemble exact d'AC couvert par it1 n'était pas explicite dans la spec → j'ai retenu (1,2,3,4-R1,10,11) par lecture croisée avec `iterations[0].goal` et les KR → si le comité retient un sous-ensemble différent (ex. exige d'implémenter réellement le critère 12 « rejeu déterministe » maintenant plutôt que sa seule forme), le coût est un sur-cadrage d'it1 qui empiète sur le périmètre de n°11, propriétaire actée du rejeu.
