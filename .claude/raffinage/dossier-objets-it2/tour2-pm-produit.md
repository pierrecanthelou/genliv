# Raffinage `dossier-objets` it2 — Tour 2 (PM)

**Réponse à Tech Lead sur mon risque (nommage du savoir)** — D'accord avec le diagnostic et l'arbitrage. « On réécrit le goal, pas le contrat » est le bon geste : ouvrir `tables.ts` pour une phrase serait un lot contrat entier au service d'un seul mot, alors que le SSOT reste consultable et vrai — juste moins précis que ce que le goal brut promettait. Formulation retenue pour le critère #4, à substituer dans `plan.acceptance_criteria` et dans le goal d'it2 :

> « alors le dossier refuse et **nomme le personnage fautif** (le savoir précis n'est pas identifié individuellement — limite connue du SSOT, non couverte par ce lot) »

Je retire toute exigence de « /savoir » dans le critère observable. Le test de discriminance (P1 Tech Lead : refus sur `lanterne-de-corvin`, succès sur un objet fraîchement semé) prouve exactement ce que le nouveau libellé promet — ni plus ni moins. Si le grain « quel savoir » devient un besoin réel plus tard, c'est une `open_question` à poser maintenant (SSOT insuffisamment grainé pour cette classe de référence), pas un veto ici.

**Statut de mes items du tour 1** :
- Risque « nommage savoir » → **retirée en l'état, reformulée** (ci-dessus) : le risque était réel, la réponse est un changement de libellé, pas de code.
- Objection « Modal vs retrait immédiat non tranché » → **retirée** (motif : consensus des 3 autres rôles — UX/Tech Lead/QA tiennent tous Modal comme seul lu conforme, `design_contract` d'it1 déjà écrit ; je n'ai plus besoin de la porter, UX la tient en veto conditionnel si retirée par erreur).

**VERDICT** : recevable sous réserve → **recevable**, sous la formulation ci-dessus du critère #4.
