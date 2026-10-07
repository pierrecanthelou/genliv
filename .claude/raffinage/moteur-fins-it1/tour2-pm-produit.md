## Tour 2 — PM — moteur-fins it1

RÉPONSES CROISÉES
- [Narratif-IA] objection R5 : sa prémisse est fausse, je l'ai vérifié. `combatProjection.ts:19-35` ne rend `null` que si `dernierAssaut` est absent. Il ne teste aucune `phase === 'ended'`. Au round mortel il projette `issue: 'hero-mort'`, et `useCommentaireCombat.ts:33` appelle R5. `commentateur.ts:136` écrit ce mot exprès (n°13, livré). Couper R5 est donc un renversement, pas une garde déjà posée. L'arbitrage va en it2 (mort), pas en it1.
- [UX] objection 1 (en-têtes distincts fin/mort) : valide, mais le corps de mort « Vos forces vous abandonnent… » et l'en-tête MORT sortent d'it1. Je garde pour it1 le titre `FIN · Fin.nom`, l'en-tête `FIN — lue au joueur, mot pour mot` et le repli invitant. Le texte de mort devient un critère d'it2, littéral et constant nommé (Narratif-IA et QA l'exigent). Rien n'est perdu.
- [QA] objection 1 (deux chemins) : retenue dans le périmètre fin. Le refus `partie_terminee` s'épingle sur la console ET la saisie libre. La fixture de KR-302 sépare [0] de [1].
- [Tech Lead] 3 et 5 : acceptés. La coupe est dans `CombatEnCours.handleJouer`, avec R3 avant R2 puis R2/R3/R4. Le rougissement de `commandes.test.ts:1067-1074` est un coût d'it1.

STATUT DE MES OBJECTIONS
- 1 (phrase non verticale) : maintenue, levée si it1 = fin seule. Personne ne défend « fin ou mort » comme une seule tranche.
- 2 (critère 4) : retirée. Avec la fin seule, il ne contredit plus `combat_en_cours`. Tech Lead et QA convergent.
- 3 (R5 contre n°13) : maintenue pour it2, durcie en exigence : arbitrage nommé, pas de coupe silencieuse.
- 4 (« Rejouer ») : maintenue. Il reste en it4, et le focus auto avec lui. L'écran de fin d'it1 est une impasse assumée.
- 5 (R2/R3/R4 contre R3) : retirée. Le Tech Lead a tranché les trois.

VERDICT FINAL — recevable sous réserve (it1 = fin seule : 4 lots, 7 critères)

DÉCISIONS EN AUTONOMIE
- Écran de fin sans issue de sortie → impasse acceptée en it1 → si l'inverse : Rejouer entre en it1 et préempte la reprise et la graine d'it3/it4.
- Nouveau refus `partie_terminee` limité à la fin → la mort garde `combat_en_cours` → si l'inverse : on réécrit un test livré (`commandes.test.ts:1064`).
- Numérotation en 4 itérations (fin, mort, reprise, graine + Rejouer) → je l'ai choisie sans cadrage écrit → si l'inverse : trois itérations, mais it3 dépasse 8 critères.
