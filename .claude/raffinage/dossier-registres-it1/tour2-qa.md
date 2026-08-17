RÉPONSE AUX OBJECTIONS

Auto-référence mene_a — pas incompatible, à nuancer. Précédent direct trouvé : BlocSavoirs.tsx:435-450 exclut déjà apres_indice_id === indice_id des options, mais résout contre la liste COMPLÈTE (jamais « introuvable ») si la donnée porte déjà l'égalité. Même patron ici : exclusion UI côté création (Select mene_a n'offre pas l'indice édité) + tolérance SSOT côté import (un mene_a important déjà son propre id n'est pas rejeté ET se rend résolu, pas orphelin). Deux tests, pas un : composant (self-exclusion à l'ouverture) + contrat (résolution non-orpheline d'une auto-référence déjà persistée).

`portee` — le critère annexe #1 doit être réécrit MAINTENANT. Si report, le test de lecture-au-montage ne porte QUE verite/formulation_joueur/mene_a[] ; `portee` en sort, ligne known_risks « forme sans consommateur ».

3 corrections tech-lead — aucune couverte par couverture.test.ts seul. 3 tests NOMMÉS obligatoires dans validate.test.ts, quelle que soit A/B : discriminance (mene_a[1] orphelin seul signalé), message (feuilleDe nomme « mene_a », pas « mene_a[1] »), robustesse (non-tableau → anomalie typée, jamais un throw).

RISQUE — maintenu, DURCI EN VETO : trou confirmé par le tech-lead (validate.ts:386), faux vert sans les 3 tests ci-dessus dans le lot d'it1.
OBJECTION — maintenue à l'identique.
PROPOSITION — maintenue (scission critère #2 + discriminance) ; auto-référence NUANCÉE : exclusion UI en complément, pas en substitution, de la tolérance SSOT.
VERDICT — recevable sous réserve : les 3 tests nommés + réécriture immédiate du critère #1 annexe sont bloquants pour ce lot.

Annexe — tests à nommer dans le lot contrat d'it1 : validate.test.ts « mene_a orphelin isolé au bon rang », « mene_a message nomme le champ pas l'indice », « mene_a non-tableau ne plante pas » ; test composant « Select mene_a exclut l'indice édité » + « mene_a auto-référencé déjà persisté se résout ».

NOTE ORCHESTRATEUR : QA a trouvé le précédent exact (BlocSavoirs.tsx:435-450) que Tech Lead a redécouvert indépendamment côté mécanisme (faux orphelin). Convergence totale entre les deux tours 2 sur ce point.