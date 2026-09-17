# Tour 1 — `tech-lead` · `dossier-controles` it9

**RISQUE** — **Le « point fixe décroissant » n'existe pas ici.** Les deux portes retenues ne portent **aucune négation** : la fonction d'étape est **monotone**, donc Tarski donne un plus petit ET un plus grand point fixe. Le bon est le **plus petit**, calculé **en croissant depuis le vide** — même moteur qu'it6, `step` enrichie. Sur le cycle (`A ← savoir gardé par B`, `B ← savoir gardé par A`) : lfp = ∅, les deux remontent **bloquant**, ce qui est **vrai** (le carnet part vide, le verrou est réel) ; gfp = {A,B} auto-justifiés → **silence**, faux négatif. **La forme fautive à interdire nommément est « point fixe d'it6 PUIS soustraction »** : deux passes décroissantes, fausses sur une chaîne autant que sur un cycle.

**OBJECTION** — L'itération **casse une équivalence** que `controles.ts` cite comme vraie *par construction* : « tableau vide ⟺ que des `mene_a`, aucune racine » ne tient que parce qu'une source `savoir` est reconduite **telle quelle**. Écarter des savoirs envoie l'indice **détenu par un personnage derrière une porte morte** vers `MESSAGE_INDICE_SANS_RACINE` : texte **faux**, et remédiation qui conseille le geste que l'auteur vient de faire. **Aucun test ne rougit.**

**PROPOSITION** — Le calcul vit **DANS** `producteursParIndice` (index unique, it6) ; retour élargi `Map<string, ProducteursIndice>` (`retenues` + `ecartees`) — **le compteur survit littéralement** (`retenues.length`, trois seuils intacts). Une `porteOuverte` **privée**, deux appelants dans le même fichier — dont `pnj_a_revele`, sinon deux vérités sur le même savoir. **Un seul lot `contrat`**, deux temps, porte verte aux deux.

**VERDICT** — **recevable sous réserve** — du troisième message et de sa remédiation, et de la correction de la ligne H2 sur `declencheur_expr`.

---

## ANNEXE

### A1 — La circularité, tranchée

`F(X) = {A : un savoir d'indice_id A dont la porte est ouverte sous X} ∪ {A : un delta reveler_indice → A} ∪ {A : une arête x→A avec x ∈ X}`

`F` est **monotone** : aucune porte n'est une négation. lfp et gfp existent, et **ils diffèrent exactement sur les cycles**.

| Graphe | lfp (retenu) | gfp (rejeté) | Vérité de session |
|---|---|---|---|
| cycle mutuel, aucune racine | ∅ → deux bloquants | {A,B} → silence | le carnet part **vide** : **lfp a raison** |
| chaîne `racine → s(C) → s(B) → s(A)` | {racine,C,B,A} | idem | identiques — **le cycle est le seul discriminant** |

**Conséquence d'implémentation** : l'étape (b) d'it6 (le noyau `P` calculé une fois) **disparaît en tant qu'étape séparée**. Un savoir est une racine **conditionnelle**. Forme prescrite, qui garde la borne d'it6 :
- noyau inconditionnel : deltas `reveler_indice` + savoirs dont `porteOuverte` est vraie sous ∅ ;
- **savoirs en attente indexés par leur `apres_indice_id`** (`Map<string, Savoir[]>`) : chacun débloqué **au plus une fois** ;
- arêtes `mene_a` relâchées comme aujourd'hui ;
- `ecartees` calculé **après** le point fixe, contre l'ensemble **FINAL**.

`contrepartie.objet_id` n'introduit **aucune** récursion — porte à livrer en T1.

### A2 — Où vit le calcul

**Dans `producteursParIndice`.** Les deux règles consommatrices changent d'un coup, et c'est voulu. Une couche au-dessus est **techniquement fausse**, pas seulement redondante (REJET 1).

### A3 — Le compteur survit-il ? OUI, sous une condition

`retenues.length` alimente les trois seuils inchangés. Ce qui **ne tient plus** : le couplage clé-présente/longueur qui portait les DEUX messages du bloquant. Après it9 il y a **trois** causes de zéro :

| état | cause | message |
|---|---|---|
| clé absente | rien ne cite l'indice | `PROSES_INDICE_SANS_SOURCE.bloquant` |
| clé présente, `retenues` vide, `ecartees ∋ 'porte-fermee'` | **NOUVEAU** : détenu, derrière une porte morte | **troisième message, à écrire** |
| clé présente, `retenues` vide, `ecartees = {'amont-inatteignable'}` | enchaînements sans racine | `MESSAGE_INDICE_SANS_RACINE` |

**Priorité à figer et épingler** : `porte-fermee` l'emporte sur `amont-inatteignable` (diagnostic le plus précis). **La remédiation reste UNIQUE** (arbitrage it6) et doit devenir vraie des trois cas.

**Variante moins chère, costée (« Option E »)** : ne pas élargir le type, fondre les deux textes bloquants en un texte **disjonctif**. Coût : zéro changement de contrat. Prix : une formulation **à exceptions** sur un bloquant — la forme que `controles.ts` nomme déjà comme défaut — et l'auteur diagnostique lui-même. **Je recommande l'élargissement ; le découpage en lots est IDENTIQUE sous les deux**, donc l'arbitrage peut se prendre au tour 2 sans rouvrir le plan.

*Auto-critique déclarée : `ecartees` n'a qu'un lecteur aujourd'hui — c'est mon biais (abstraire trop tôt). Ce qui la sauve : l'information existe gratuitement au point fixe, et la masquer produit un texte faux lu par l'auteur.*

### A4 — Encapsulation

- `MESSAGE_INDICE_SANS_RACINE` affirme une équivalence démontrée dans la docstring de `producteursParIndice` : **les deux se réécrivent dans le même geste** (KR-199).
- `controles.ts` reçoit un `MotifEcart` (classification **possédée** par `atteignabilite.ts`), jamais un booléen reconstruit depuis `has(id)` + `length`.
- **`objetsDonnes`** vit dans `premiereFeuilleInaccomplissable` : à extraire en `objetsDonnesDe(dossier)` privée — **une** définition, **deux** invocations, **aucune mémoïsation**.
- **`pnj_a_revele`** doit passer par la **même** `porteOuverte`, sinon deux vérités dans un seul fichier.

### A5 — H2 est FAUSSE sur une famille — mesuré

`types.ts:1418-1423` (« coché à la main par le moteur d'un événement … c'est calme ») + `deltas.ts:74` (`atteindre_jalon`). L'appliquer serait un **faux positif sous une règle bloquante**. La ligne se **corrige dans ce lot**.

### A6 — Découpage : UN SEUL LOT

| id | titre | contrat ? | fichiers |
|---|---|---|---|
| **L1** | La porte d'un savoir est infranchissable | **oui**, seul | R `atteignabilite.ts` · R `atteignabilite.test.ts` · R `controles.ts` · R `controles.test.ts` |

**Pourquoi pas deux lots** : le lot `controles` **ne passe pas la porte seul** — son témoin exige le comportement du premier, et sous le type élargi il ne **compile** même pas.

**Deux TEMPS, porte verte aux deux** : **T1** le contrat + la porte NON récursive (`contrepartie`, `objetsDonnesDe`, troisième message) ; **T2** la récursion (`apres_indice_id`, liste de travail, témoins du cycle).

### A7 — Signatures exactes

```ts
export type MotifEcart = 'porte-fermee' | 'amont-inatteignable'
export interface ProducteursIndice {
	readonly retenues: readonly SourceIndice[]   // LE compte des trois seuils
	readonly ecartees: ReadonlySet<MotifEcart>   // contre l'ensemble FINAL
}
export function producteursParIndice(dossier: Dossier): Map<string, ProducteursIndice>
// SEULE signature modifiée. Domaine des clés INCHANGÉ. SourceIndice INCHANGÉ.
```

Privées : `porteOuverte(revele_si, indicesProduits, objetsDonnes): boolean` (absente → `true` ; `confiance_min`/`jet` **non évaluées → true**) et `objetsDonnesDe(dossier): Set<string>` (**le verbe est nommé** — `donner_objet` seul, `retirer_objet` partage `refKinds`).

### A8 — Contraintes d'instrument

1. **Contrainte de bloc** — le nouveau message se déclare avec les `PROSES_*`, **bien AVANT `SITES_AVERTISSEMENT`**, jamais entre les deux ancres.
2. `atteignabilite.test.ts` — « `producteursParIndice` n'a que **deux** porteurs » reste vrai.
3. La couture d'it6 (`controles.ts` ne connaît ni `./predicates`, ni `./expr`, ni `ExprNode`) — importer `MotifEcart` ne l'enfreint pas.
4. `not.toContain("split('.')")` — aucun découpage de chemin.
5. `atteignabilite.ts` ne connaît ni `SectionId`, ni `NiveauControle` — `MotifEcart` n'est **pas** un niveau.
6. **G3 doit être amendée** : `apres_indice_id` cesse d'être annotée « PORTE non saturée ici ».
7. KR-217/225 — vérifier qu'aucun avertissement de `validateDossier` ne parle déjà d'un savoir à porte **fermée**. *Je n'ai pas relu `code-knowledge.json` pour KR-197/202 — à recouper par la QA, je ne l'affirme pas.*

### A9 — Mutants dus (it8 : N gardes ⇒ N mutants)

| # | implémentation fautive | témoin qui doit rougir |
|---|---|---|
| M1 | `porteOuverte` rend toujours `true` | témoins `contrepartie` **et** `apres_indice_id`, séparément |
| M2 | **point fixe d'it6 PUIS soustraction** | **chaîne** `racine → s(C) → s(B) → s(A)` — **la profondeur se MESURE** (précédent : 3 → 4 maillons à it6) |
| M3 | porte fermée comptée ouverte sur un cycle / gfp | cycle mutuel **sans racine extérieure** |
| M4 | `confiance_min` / `jet` traités comme **fermées** | un savoir portant `confiance_min: 3` seul reste producteur |
| M5 | `ecartees` toujours vide, ou priorité inversée | le témoin des **trois** messages |
| M6 | `objetsDonnesDe` dérivée de `refKinds.includes('objet')` | le témoin `retirer_objet` d'it7, rejoué contre la porte |

### A10 — REJETÉ (à recopier au § 8)

1. **REJETÉ — une couche AU-DESSUS de `producteursParIndice`.** Le point fixe est **entrelacé** ; un filtre en aval est une soustraction mono-passe, fausse sur toute chaîne comme sur tout cycle, et crée le second parcours qu'it6 interdit.
2. **REJETÉ — le point fixe DÉCROISSANT (gfp).** Sur un cycle mutuel il rend `{A,B}` auto-justifiés — **faux négatif sous une règle bloquante** — et ne correspond à aucune sémantique de session.
3. **REJETÉ — un champ `porte` sur `SourceIndice`.** `controles.ts` lit `length` comme LE compte ; un drapeau sur-compterait — état illégal représentable.
4. **REJETÉ — une seconde fonction exportée `causeDuZero(dossier, indiceId)`.** O(n²) et **second parcours**, interdit par l'arbitrage d'it6.
5. **REJETÉ — évaluer `confiance_min` avec un repli.** `types.ts` l'interdit explicitement ; hors périmètre, elle reste **ouverte**.
6. **REJETÉ — exporter `indicesProduits`.** Arbitrage it7 : ce n'est qu'une projection de l'index.
7. **REJETÉ — deux lots parallèles.** Le lot `controles` ne passe pas la porte seul. **On n'invente pas du parallélisme pour remplir un essaim.**
8. **REJETÉ — traiter `jalons[].declencheur_expr` ABSENT comme une porte fermée.** Motif MESURÉ : faux positif sous une règle bloquante.
9. **REJETÉ — mémoïser `objetsDonnesDe` ou le point fixe.** RJ-6 / KR-013/113.

### A11 — REPORTÉ

- `confiance_min` et `jet` : à déclarer **définitivement non évaluables** plutôt que « pas encore », sinon H2 rétrécira de zéro à chaque itération.
- L'atteignabilité du **PORTEUR** d'un effet — dernière famille de H2 encore ouverte après it9.
- Le texte du troisième message : **signature narratif + UX due au tour 2**.

---

## Notes de l'orchestrateur

**L'objection est vérifiée et elle est sérieuse.** `controles.ts` porte bien, en toutes lettres, les « DEUX CONTRAINTES PROPOSITIONNELLES, mesurées et non décoratives » dont la première dit que le texte « n'est affirmable QUE parce que `producteursParIndice` balaie les SIX chemins » et que « le texte se relit donc avec l'index, jamais seul ». Écarter des savoirs de l'index rend ce texte faux — exactement ce que la docstring prédit. **Et le tech-lead a trouvé cette conséquence seul**, là où mon cadrage ne l'avait pas vue.

**Convergence indépendante avec l'`ux-designer`** : les deux arrivent, par des chemins différents (l'un par le texte, l'autre par l'index), à la même conclusion — un **troisième message est dû**. Cela contredit la proposition (b) du `pm-produit` (« zéro texte neuf »). À trancher au tour 2.
