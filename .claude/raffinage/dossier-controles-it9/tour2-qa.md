# Tour 2 — `qa` · `dossier-controles` it9

**RISQUE** — Résiduel : sur les deux fixtures partagées, `contrepartie` ne fait jamais basculer un ALERTE en BLOQUANT — le seul flip mesuré reste silence→alerte. **Le scénario le plus coûteux** (une porte `contrepartie` seule ramenant un producteur unique à zéro sous une règle bloquante) **n'est couvert par AUCUNE fixture réelle** : il faut un témoin LOCAL dédié, sans quoi le risque nommé par le `pm-produit` reste **non testé**.

**OBJECTION — le flip `trace-du-guet` est un DÉFAUT TROUVÉ, pas une fausse alerte.** Le `narratif-ia` a raison sur le fait mesuré mais tirait la mauvaise conclusion : `Depart` n'a aucun champ d'inventaire, donc `donner_objet` n'est pas un canal qui **sous-compte** une vérité plus riche — **c'est le SEUL canal que le schéma reconnaît**. Fermer la porte n'est pas un pari sous incertitude (la posture H2 pour `jet`/`confiance_min`), c'est **appliquer fidèlement ce que le document établit**. La « supposition d'inventaire de départ » n'est **écrite nulle part** — même retenue que le module s'impose déjà sur `pnj_a_revele` (H3).

**PROPOSITION** — `contrepartie` **RESTE**. Mitigation : troisième message + **un témoin BLOQUANT local dédié** (producteur unique fermé par `contrepartie` seule), pour couvrir ce que les fixtures ne couvrent pas.

**VERDICT — recevable sous réserve** : (a) troisième message écrit et testé, (b) témoin BLOQUANT local sur `contrepartie` seule, (c) **profondeur du mutant (b) fixée à 2**, pas « à mesurer ».

---

## Statut de mes objections du tour 1

1. **« Treize suites »** — corrigé en amont. Rien à rouvrir.
2. **Point fixe unifié + tests obligatoires** — **maintenu et ÉTENDU** : j'ajoute un **troisième témoin**, le **cycle MIXTE**, que rien dans les notes de tour 1 ne nommait.
3. **`contrepartie` matériau réel (pas KR-220)** — maintenu.

## Auto-correction

**Faite.** Le cycle survivant sous filtre naïf est un **FAUX NÉGATIF**, pas un faux positif : compter les deux membres comme produits l'un par l'autre rend le linter **SILENCIEUX** sur un verrou réel. Le `tech-lead` a la direction juste. **Ma conclusion tenait, mon motif non.**

## REJETÉ

1. **REJETÉ — la réserve n° 1 du `narratif-ia`** (sortir `contrepartie`). Motif mesuré : **le canal est unique et décidable, pas incertain**.
2. **REJETÉ — mon propre étiquetage du tour 1** (« faux positif »).
3. **REJETÉ — traiter le flip `trace-du-guet` comme LE témoin suffisant du risque `pm-produit`.** Il ne prouve que le cas ALERTE.

---

## ANNEXE — chaque mesure marquée

*Implémentation LOCALE du point fixe entrelacé, dans un fichier temporaire, **jamais branchée à la production, jamais commitée**. Arbre vérifié propre avant et après, HEAD inchangé.*

### 1. Témoin d'entrelacement — **EXÉCUTÉ**

`racine` (delta) → `relais` (`mene_a`) → `tardif` (savoir gardé sur `relais`).

| implémentation | `tardif` | verdict |
|---|---|---|
| **correcte** (entrelacée) | **1** | — |
| mutant (a) « portes évaluées AVANT la relaxation » | **0** | **ROUGIT** |
| mutant (b) « point fixe puis soustraction non ré-itérée » | **1** | **RESTE VERT** |

**Les deux mutants sont dus, mais par des témoins DIFFÉRENTS.** Un seul témoin d'entrelacement **ne capture pas** (b). Pairage négatif (racine retirée) : `tardif=0`, `relais=0`. Témoin du sens de la porte (savoir gardé par un indice produit) : **1**.

### 2. Profondeur du mutant (b) — **EXÉCUTÉ. Chiffre mesuré : 2.**

Chaîne de **PORTES** (pas d'arêtes) : `sC` gardé par une cible jamais produite, `sB` gardé par C, `sA` gardé par B.

| maillons gardés | correcte | mutant (b) | verdict |
|---|---|---|---|
| 1 | 0 | 0 | **indiscernable** |
| **2** | **0** | **1** | **DISCRIMINANT — minimum mesuré** |
| 3 | 0 | 1 | même signature |

**Contrairement au précédent d'it6 (4 maillons de `mene_a`), le témoin est ici une chaîne de GARDES, pas de relaxations.** Le nombre à écrire au plan est **2**, mesuré et non supposé.

### 3. Cycle mutuel `apres_indice_id`, sans racine — **EXÉCUTÉ** : A=0, B=0 (lfp confirmé).

### 4. Cycle MIXTE `mene_a` + `apres_indice_id` — **EXÉCUTÉ, nouveau** : X=0, Y=0.

### 5. Ligne de base sous `apres_indice_id` SEUL — **EXÉCUTÉ contre le code de production**

Les deux cibles visées par un `apres_indice_id` sont **déjà produites indépendamment** de toute porte (`cendres-tiedes` = 1 producteur delta ; `pas-dans-la-cendre` = 2). **Aucune ligne de base ne bouge sous la porte seule.** **C'est un risque de couverture, pas un soulagement** : aucun test existant ne surveillerait cette tranche.

### 6. `trace-du-guet` — **EXÉCUTÉ au tour 1**, relu ici. ### 7. `Depart` sans inventaire — **LU**, recoupé indépendamment.

---

## Notes de l'orchestrateur

**La mesure n° 1 est la plus importante du raffinage.** Elle établit que les deux mutants exigent **deux témoins distincts** — un seul aurait laissé passer exactement ce que le plan prétend interdire. **C'est BUG-087 rejoué, attrapé au raffinage cette fois** au lieu d'après l'essaim.

**La profondeur est MESURÉE (2), pas choisie**, et le motif de l'écart avec it6 est juste : chaîne de **portes** contre chaîne de **relaxations**.

**Le désaccord central est CLOS par convergence** : la QA et le `narratif-ia` concluent tous deux, indépendamment, que `trace-du-guet` est un **vrai positif** — la QA par la mesure, le narratif par la lecture qui l'a fait se rétracter. Et les deux motifs se recoupent : `objetsDonnes` n'est pas sous-compté, **le canal est unique**.
