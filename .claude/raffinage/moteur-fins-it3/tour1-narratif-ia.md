# Narratif & IA — moteur-fins it3 — tour 1

RISQUE
Le critère d'acceptation dit "R5 n'est pas appelé au round dont l'issue est hero-mort. Garde dans useTourDeJeu." — mais R5 ne vit pas dans useTourDeJeu. R5 est appelé par `CombatEnCours.tsx` via `useCommentaireCombat`, un chemin entièrement distinct de la chaîne R1-R3-R4 que useTourDeJeu orchestre. Un développeur qui lirait seulement le CA ajouterait une garde au mauvais site, et R5 commenterait la mort du héros dans son ton désinvolte de combat au lieu du silence que le moteur doit imposer avant sa constante factuelle.

OBJECTION
Le brief corrige déjà la localisation (CombatEnCours.tsx), mais le CA du specification.json reste faux. La frontière code/IA est nette ici — la mort est 100 % moteur, zéro modèle — à condition que la garde soit effectivement posée. Dans `CombatEnCours.tsx:handleJouer`, après `rejouerCombat(nextSession)`, la condition `rejeu.ok && rejeu.etat.dernierAssaut` laisse passer `hero-mort` : `projeterAssaut` projette cette issue, et `MOT_ISSUE` dans `commentateur.ts` porte l'entrée `'hero-mort': 'le héros est mort'`. Si la garde n'est pas posée, R5 reçoit une projection complète avec `issue: 'le héros est mort'` et produit un commentaire narratif sur la mort — un récit IA là où le moteur doit émettre une constante factuelle.

PROPOSITION
Garde à un seul site, dans `handleJouer` de `CombatEnCours.tsx`, après le rejeu :
```
if (rejeu.etat.outcome === 'hero-mort') return  // avant l'appel à commenter
```
Pas de garde dans projeterAssaut ni commentateur.ts — le code de projection reste général, c'est l'appelant qui décide quand ne pas commenter. Le CA du specification.json doit être corrigé : "Garde dans CombatEnCours (handleJouer), pas dans useTourDeJeu."

`TEXTE_MORT_HEROS` : constante nommée dans brain/ (audience moteur), texte factuel à la deuxième personne, sans chiffre, sans terme mécanique. Jamais injectée dans aucun contexte de modèle. C'est la troisième prose émise verbatim (après `texte_ouverture_joueur` et `fins[].texte`), mais la seule écrite par le moteur et non par l'auteur.

VERDICT
Recevable sous réserve — le CA "Garde dans useTourDeJeu" est faux et doit être corrigé.

ANNEXE — frontière code/IA

Ce que le modèle voit au round de mort : RIEN.
- R5 (commentateur) : garde dans handleJouer, pas d'appel à commenter quand outcome === 'hero-mort'.
- R3 (narrateur) : déjà gardé par it1 (useTourDeJeu, finAtteinte coupe R2/R3/R4 après fin). Non concerné ici : la mort emprunte le chemin combat, pas le chemin fin.
- R4 (acteur) : même garde que R3 (it1).
- R1 (interprète) : non concerné, aucune commande acceptée après hero-mort.

Ce qui ne change pas dans le contrat de sortie :
- `assemblerCommentateur` reste intact.
- `projeterAssaut` reste général.
- `validerCommentateur` n'est pas concerné.

Ce qui change :
- `CombatEnCours.tsx` : handleJouer court-circuite avant commenter quand outcome === 'hero-mort'.
- Nouvel écran de mort (dans play-mode) affichant TEXTE_MORT_HEROS.
- `EcranCombat.tsx` : le bloc "PARTIE TERMINÉE" existant (lignes 134-137) est remplacé par le routage vers le nouvel écran.
