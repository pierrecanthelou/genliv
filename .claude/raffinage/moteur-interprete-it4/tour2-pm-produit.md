# Tour 2 — PM Produit — moteur-interprete it4

## RISQUE
Le désaccord tech-lead/narratif-ia sur `EN SA POSSESSION` n'est pas un arbitrage d'implémentation : tronquer l'inventaire injecté (`slice(-K)`) fait raconter au narrateur l'absence d'un objet que le moteur dit possédé — l'auteur voit son canon contredit, sans le savoir, silencieusement. C'est une perte de valeur pour l'auteur, pas une élégance de code économisée.

## OBJECTION
Réponse nommée à la proposition tech-lead (note 2, point 2, `objets_possedes.slice(-K)`) : refusée. L'argument KR-013 invoqué (l'ordre existe déjà, pas de champ neuf) est vrai mais hors sujet — la dette n'est pas la source de l'ordre, c'est la troncature d'un fait affirmé. Narratif-ia a raison (note 5, I5, invariant d'état figé) : l'état n'est jamais un levier de budget, sous peine de canon halluciné.

## PROPOSITION
Adopter P1/P2/P3 de narratif-ia tel quel : ÉTAT (dont `EN SA POSSESSION`) et ETABLI figés à tous les paliers ; seuls RECEMMENT / A CONDENSER / AUPARAVANT dégradent. Si `EN SA POSSESSION` seul dépasse le budget → palier « trop-long » (KR-274, QA), jamais une troncature silencieuse.

### Statut des 3 objections tour 1
1. **Mode auteur hors périmètre** → **MAINTENUE**, renforcée par la ligne de traçabilité UX (note 3, `open_questions`) : les deux coexistent, le hors-périmètre reste écrit noir sur blanc dans la spec.
2. **Sens de « suggestions retirées »** → **DURCIE**, rejoint le refus QA (note 4) : « suggestions » est une sortie de R3 (KR-230), pas un palier d'entrée — AC#9 se réécrit en P1/P2/P3, ne se patche pas.
3. **Tri `EN SA POSSESSION`** → **DURCIE EN VETO** : aucune troncature de l'inventaire injecté, jamais.

## VERDICT
Un seul veto ferme (point 3). Tour 3 tranche AC#9 réécrit + KR-274 nommé, sinon refus maintenu.

---

## Décisions prises en autonomie

- **Traitement de `EN SA POSSESSION` quand il dépasse seul le budget** → routé vers le palier résiduel « trop-long » (KR-274) plutôt qu'une troncature → sinon : le narrateur affirme l'absence d'un objet que le dossier dit possédé — canon halluciné, silencieux.
- **Portée de la réécriture d'AC#9** → réécriture complète en vocabulaire P1/P2/P3 → sinon le critère continue de nommer un levier (« suggestions ») qui ne correspond à aucun palier réel du code.
- **Forme du hors-périmètre « mode auteur »** → les deux (ligne `open_questions` ET section hors-périmètre explicite), non l'une à la place de l'autre → sinon un rôle qui lit le §2.8 sans lire `open_questions` peut livrer un indicateur visible comme seconde tranche.
