# Tour 1 — QA — moteur-interprete it4

## RISQUE
**AC #9 confond l'effet observable (moins de suggestions) avec la cause programmable (contexte réduit).** Les trois paliers nommés (suggestions, fenêtre, faits) sont des **sorties du modèle** ou des **dérivés** (fenêtre glissante), jamais des variables d'entrée du budget. Le critère dit « suggestions retirées » mais c'est l'IA qui les génère en réaction à un contexte court, pas le code qui les retire avant l'appel.

## OBJECTION
1. **Non-observable par jest seul :** « la narration se raccourcit plutôt que d'attendre indéfiniment » (plan de cible §2.8 n°4) mesure une latence réseau, pas une logique de code. Jest prouve que `BUDGET_CARACTERES_NARRATEUR` refuse `trop-long` ; il ne peut pas prouver que « les suggestions réduites » ou « la fenêtre réduite » apparaissent réellement. Test playtest manuel, oui. Test jest, non.

2. **Cas limite du bloc `EN SA POSSESSION` non borné :** le comité note en `narrateur.ts` (lignes 177-180) que ce bloc « croît sans borne » et rend le refus **monotone** une fois franchi. La dégradation en cascade ne peut pas l'éviter — une partie de l'entrée échappe au budget. Le critère ne nomme pas une stratégie pour ce bloc.

3. **Ambiguïté structurelle sur la réduction :**
   - « fenêtre au-delà de 5 pas » — réduire `FENETRE_MAX` de 14 à 5 ? Modifier `borneDeFenetre()` ?
   - « faits au-delà d'un plafond K » — réduire `FAITS_INJECTES_MAX` de 8 à combien ? À 0 (ne jamais injecter `ETABLI`) ?

## PROPOSITION
1. **Redéfinir AC #9 en deux tranches :**
   - *Testable* : « une constante unique KR-261 borne le contexte injecté ; `BUDGET_CARACTERES_NARRATEUR` refusant `trop-long` est remplacé par une **cascade discrète** (bloquer `RECEMMENT`, puis `ETABLI`, jamais les deux à la fois) **avant fetch**. »
   - *Non-testable* : « le modèle reçoit le contexte dégradé et produit un récit plus court (observable en playtest réel, hors jest). »

2. **Expliciter la dégradation en cascade :** nombrer les paliers (ex. si contextSize > seuil₁, couper RECEMMENT à 5 pas ; si > seuil₂, injecter 0 faits), pas l'ordre vague « suggestions-puis-fenêtre-puis-faits ».

3. **Accepter le bloc `EN SA POSSESSION` comme risque résiduel** (open_questions it4) : noté et sans test jest, puisqu'aucun ordre des possessions n'existe. Ou borner dès cette itération (ajout de ceinture au schéma de session — le coût augmente, décision design).

4. **Nommer KR-274 (nouveau)** : limite de dégradation : au-delà du dernier palier, affichage de message fixe (§2.8 garde-fou 1, jamais fiction improvisée).

## VERDICT
**REFUS SANS RÉVISION.** AC #9 mélange trois niveaux (budgétisation du code, réaction du modèle, latence réseau) et son ordre « suggestions-fenêtre-faits » présume une logique de sortie IA qu'aucun test jest ne peut observer. Redéfinir AC #9 en séparant *testable-avant-fetch* et *vérifiable-au-playtest*, nommer la stratégie du bloc `EN SA POSSESSION`, et écrire les paliers discrets de la dégradation avant de réécrire les critères.
