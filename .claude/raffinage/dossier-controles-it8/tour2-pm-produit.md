# Tour 2 — `pm-produit` · `dossier-controles` it8

**RISQUE** — Le risque n'est plus la contradiction AC1/AC2/AC10 (résolue par réécriture dans le lot, actée par tous) mais un risque de **PROCÉDURE** que mes pairs n'ont pas nommé sous cet angle : sous `bloquant`, l'itération touche **deux features** (`dossier-controles` + `bascule-editeur`, 3 tests). Ma règle dit : au-delà d'une feature, je ne négocie pas, je scinde. Sous `alerte`, ce risque disparaît — la QA l'a mesuré, `bascule-editeur` reste entièrement vert.

**OBJECTION** — Je réponds nommément à l'**exception nommée de l'`ux-designer`** : son motif (« `objectifs` est l'unique porteur de victoire/défaite ») est **mesuré faux** par le `narratif-ia` (`charpente.fins[]` conclut sans objectif). Je m'aligne sur le narratif : le seul motif licite du message est « rend muette la règle bloquante existante », **jamais** « l'aventure ne peut pas être jouée ». Je veto toute prose reprenant le motif ux tel quel.

## Statut de mes objections du tour 1

| Objection du tour 1 | Statut |
|---|---|
| « Reproduit le bandeau rouge tautologique refusé à it1 » | **RETIRÉE** sous `alerte` (pas de bandeau bloquant, aucune revendication d'injouabilité) · **DURCIE EN VETO** si `bloquant` |
| « Rouvre sans le dire la doctrine absent ≠ vide » | **RETIRÉE** sous `alerte` + critère narratif (exception étroite, écrite, distincte de l'exception ux qui reposait sur un motif faux) · **DURCIE EN VETO** si `bloquant` |
| « Valeur nulle à t=0 » | **RETIRÉE** — et c'est ma réponse à la question de l'orchestrateur |

**Sur la valeur, en détail.** Oui, la variante `alerte` + capacité change mon verdict. La valeur n'est pas à t=0 — j'avais raison sur ce point précis, et rien ne l'a démenti — mais au **jalon « dossier calme » que la QA a isolé** : proses réécrites, objectifs vides **ou creux**. La variante capacité y ferme le trou que la version compte laissait ouvert (un clic sur « + Ajouter » n'éteint plus rien sans condition structurée). C'est un signal d'auteur réel, pas un doublon du bloquant d'ouverture, et **il ne revendique jamais l'injouabilité**.

**PROPOSITION** — Signer : niveau `alerte`, variante capacité du `tech-lead` (`path: 'canon.objectifs[].reussi_si_expr'`), message et remédiation **littéralement ceux du narratif** (jamais ceux de l'ux), AC1/AC2 réécrites dans le même lot, **lot unique dans `dossier-controles`**, `bascule-editeur` non touché et non rouvert.

**Sur le report à it9** — je ne signe **pas** « arbitrage documentaire à zéro lot ». Sous `alerte` + capacité, l'itération redevient une tranche verticale propre, démontrable en une phrase, qui ne touche qu'une feature et ne rouvre aucune décision actée. **C'est le report qui serait ici une sur-prudence non motivée.**

**VERDICT** — **Recevable sous réserve** : `alerte` (jamais `bloquant`), message/remédiation narratif verbatim, capacité (jamais compte), AC1/AC2 réécrites dans le lot, `bascule-editeur` intact.

**VETO ferme et maintenu si le comité retient `bloquant`** — motif cumulé : reproduit le bandeau rouge refusé à it1, rouvre la doctrine `etat_vide` sans l'assumer, revendique une injouabilité mesurée fausse, et enfreint la règle de coupe (> 1 feature touchée).

---

## Note de l'orchestrateur

**Recevabilité du veto : ADMISE.** Le terrain de veto du PM est « hors périmètre, ne répond pas à la demande, casse l'ordre du walking skeleton, valeur utilisateur nulle ». Deux des quatre motifs cumulés y sont directement (valeur utilisateur du bandeau tautologique ; dépassement à deux features, qui est un signal de coupe). Le motif « injouabilité mesurée fausse » appartient au `narratif-ia` — le PM le cite en appui, pas comme fondement propre, ce qui est licite.

**Retournement notable** : le PM abandonne la position la plus tranchée du tour 1 (retrait pur de la règle) après avoir lu la mesure de la QA et la variante du tech-lead. Troisième précédent de cette feature après it6 et it7.
