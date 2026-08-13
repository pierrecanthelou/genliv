# TOUR 2 — PM Produit · `dossier-fiches` it2

## RÉPONSES AUX OBJECTIONS

Je réponds à l'objection de `narratif-ia` (discriminant `apparence`/`description_joueur` absent du goal — deux vérités concurrentes, un champ payé deux fois) : recevable, et c'est du ressort de la valeur auteur (la phrase de démo doit rester non ambiguë). **Retenue, mais gratuite** : docstring de contenu + clarification de régime sont du texte dans `types.ts`/`destinations.ts`, aucune nouvelle surface d'écran, déjà pré-satisfaites par les hints distincts que l'UX a posés (« interne, jamais lu » vs « lue par le joueur »). J'ajoute la précision de contenu (fonction = ce qu'il est / apparence = ce que le narrateur décrit à l'entrée / description_joueur = réputation publique) au lot contrat, sans toucher à la taille de l'itération.

## STATUT DE MES OBJECTIONS

Une seule objection au tour 1 : (b) `RefusEnCours{issues}` réduit au cas `'absent'`, volet `issues` (contenu) reporté. **RETIRÉE** — motif : le lot 2 de `tech-lead` livre exactement cette réduction (`'absent'` seul atteignable, `'refuse'` non simulé, retrait reporté, test à deux personnages livré nommément). Pas de désaccord résiduel.

## POSITION SUR LE BUDGET DE MOTS

**Hors périmètre d'it2.** Le goal — « l'auteur écrit fonction/apparence/description_joueur » — est atteint sans borne : un budget n'est pas nécessaire à la démo, c'est de la validation fine (squelette d'abord). Il regrossit une itération qu'on vient de couper pour taille, et ouvre une seconde surface de rendu (`warnings` dérivés) + `validate.test.ts` — un « et » de plus derrière un goal à une phrase.

Le risque de contexte est réel mais **transverse** : `Lieu` porte déjà trois proses `ia` sans budget, et `narratif-ia` classe lui-même le rattrapage rétroactif hors périmètre, propriétaire n° 10 — incohérent d'exiger l'inverse ici pour une entité neuve. La règle « toute prose `ia` entrant au schéma entre avec sa ligne de budget » est une politique durable et générale : elle appartient à la n° 7 `dossier-controles`, pas à un lot d'identité PNJ. Si le comité veut l'accélérer, it3 est le plus tôt acceptable — jamais it2.

## VERDICT

Pas de veto sur le goal ni sur le lot 2 de `tech-lead`. **Veto sur l'ajout du budget de mots à it2** : à retirer du lot contrat, reporté à la n° 7 (ou it3 au plus tôt).
