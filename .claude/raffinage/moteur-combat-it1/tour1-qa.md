# QA — moteur-combat it1 — Tour 1

## RISQUE

1. **L'égalité d'AT n'interagit pas avec la Garde aiguisée.** combatEngine.ts:238-244 retourne sans toucher consecutiveDefWins. Rend le compteur soit trop généreux (persiste à tort), soit mal documenté.
2. **Deux cas limites critiques non énumérés** : mort au 3e parade consécutive (bonus sans round suivant), assaut nul dans la chaîne de parades.
3. **Critère 1 manque de précision sur le mappeur de monstre.** Aucune vérification que le code lit le bestiaire par identifiant exact.

## OBJECTION

1. **moteurSansIA.test.ts cité en critère 9 n'est pas vérifiable sans le lire.** KR-250/260 l'exigent. Faut-il l'écrire/étendre en it1 ?
2. **La sonde D2-bis est imprécise.** « Correction » signifie retirer du code faux, ou valider du code existant ? Sans clarification, elle devient un écran de fumée.
3. **Définition de fini incomplète.** Cite moteurSansIA.test.ts vert sans que son périmètre it1 soit établi.

## PROPOSITION

1. Ajouter deux critères explicites pour AT égales × compteur de parades.
2. Spécifier la sonde D2-bis nommément : valider le compteur des deux côtés + AT égales ne progresse pas le compteur.
3. Clarifier : moteurSansIA.test.ts fait partie du cadrage it1 ou reste à moteur-interprete ?

## VERDICT

**À revoir.** Deux blocages techniques + une clarification UX. Le reste du cadrage est correct et observable.
