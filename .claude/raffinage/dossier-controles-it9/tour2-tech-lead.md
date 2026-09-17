# Tour 2 — `tech-lead` · `dossier-controles` it9

**RISQUE** — La tranche devient **invisible sur les deux fixtures partagées**. Le seul flip mesuré venait de `contrepartie` ; celle-ci sortie, rien ne garantit qu'une ligne de base bouge — et la QA n'a mesuré **ni `apres_indice_id` seul**, **ni** le resserrement de `pnj_a_revele`. Les deux se remesurent **avant** écriture. **Une tranche qu'aucune assertion existante ne surveille n'est pas un soulagement.**

**OBJECTION (nommément, `ux-designer`)** — la « remédiation **distincte** » est un **veto de contrat**. `remediation(constat)` se résout depuis `constat.niveau` **seul** ; une troisième consigne exige un discriminant sur `ConstatControle` — interface **exportée**, posable sur les constats des cinq autres règles : **état illégal représentable**, mot pour mot l'arbitrage d'it6. L'intention est juste, l'implémentation non.

**PROPOSITION** — Une remédiation **unique, réécrite d'une troisième clause**. L'isomorphisme remèdes ↔ producteurs, déjà écrit dans le fichier, l'**exige** : it9 ajoute une façon de perdre un producteur `savoir`, donc le geste inverse entre dans l'énumération. Message : celui du `narratif-ia`, **devenu affordable** puisqu'une seule porte ferme.

**VERDICT** — **recevable**, `contrepartie` **hors tranche**, **un lot, un temps**, sous les deux mesures ci-dessus.

---

## ANNEXE

### B1 — Réponse à H4, nommément

H4 ne conteste pas mon algorithme, elle **restreint le périmètre des portes qu'il évalue**, et elle a raison sur les deux moitiés.

- **`apres_indice_id` satisfait H4.** Ma formulation « it9 inverse le sens d'erreur » était **trop large** : la monotonie **confine** le sens d'erreur au lieu de l'inverser. Je reprends la formulation du `narratif-ia`.
- **`contrepartie` ne la satisfait pas**, et j'ajoute l'argument qui manque à sa note — un argument de **routage**, de mon domaine : la porte retire un producteur et **rapporte le défaut sur l'INDICE** quand le fait fautif est sur l'**OBJET**. Sous une règle **bloquante**, un diagnostic qui nomme la **mauvaise entité** est pire qu'un diagnostic absent. **C'est ce qui tranche, plus encore que le sous-comptage.**

**Contre-argument pesé et écarté** : « refuser `contrepartie` pendant qu'`ETABLISSEMENT.possede_objet` lit déjà le même ensemble sous-compté laisse deux vérités sur le même ensemble dans un seul fichier » — **c'est mon propre critère**, celui par lequel j'ai exigé que `pnj_a_revele` passe par `porteOuverte`. Il ne s'applique pas : les deux sites ne sont **pas symétriques en conséquence**. `possede_objet` évalue une condition que l'auteur a **écrite explicitement** et le constat **nomme l'objet** ; la porte `contrepartie` retirerait un producteur **en silence** et nommerait l'indice. **Une incohérence qui se voit vaut mieux qu'une cohérence qui ment sur l'emplacement.**

### B2 — Statut de mes positions du tour 1

| Tour 1 | Statut | Motif |
|---|---|---|
| lfp/gfp, « point fixe PUIS soustraction » interdite | **MAINTENU, DURCI EN VETO** | Confirmé par exécution (QA). Toute forme à deux passes est un refus de revue. |
| Équivalence cassée → troisième message | **MAINTENUE** | Trois rôles indépendamment ; le « zéro texte neuf » est isolé et rejeté. |
| Le calcul vit **dans** `producteursParIndice` | **MAINTENU** | Une couche au-dessus est techniquement fausse. |
| Retour élargi | **MAINTENU, forme CORRIGÉE** | `Set<MotifEcart>` → **un booléen**. **C'est mon biais déclaré que je corrige, pas une concession.** |
| Priorité `porte-fermee` > `amont-inatteignable` | **MAINTENUE** | Épinglée par le témoin mixte. |
| « Option E » (texte disjonctif) | **RETIRÉE** | Tuée par les rejets de l'`ux-designer` (classe BUG-088/090). **Ne se rouvre pas.** |
| Extraire `objetsDonnesDe` | **RETIRÉE** | `contrepartie` sortie, **un seul appelant**. Une abstraction à un seul appelant est une dette — **mon biais, appliqué contre moi**. |
| `pnj_a_revele` par la **même** `porteOuverte` | **MAINTENU, sous porte de mesure** | L'effet sur les fixtures **n'a jamais été mesuré**. |
| Réécrire ensemble docstring et `MESSAGE_INDICE_SANS_RACINE` | **MAINTENU** | Un seul geste (KR-199). |
| H2 fausse sur le jalon | **MAINTENU** | Mesuré, corroboré par deux rôles. |
| **Un seul lot** | **MAINTENU, renforcé** | |
| **Deux temps** | **RETIRÉ** | Voir B3. |
| M1–M5 | **MAINTENUS**, M1 amputé de son volet `contrepartie` | |
| M6 (`objetsDonnesDe`) | **RETIRÉ** avec l'extraction | Le témoin `retirer_objet` d'it7 reste et continue de tenir `possede_objet`. |
| Les neuf `REJETÉ` | **TOUS MAINTENUS** | |

### B3 — `contrepartie` sort : le découpage devient un **temps unique**

**Le découpage en deux temps tombe, et il DOIT tomber.** Sans `contrepartie`, **la seule porte évaluée est récursive** : T1 se réduirait au changement de type + zéro comportement — **un contrat élargi sans consommateur, porte verte sur une tranche qui ne prouve rien.** C'est exactement la dette que je m'interdis.

**`objetsDonnesDe` : on n'extrait pas.** Son second appelant n'existe plus, et le plan n'en annonce **aucun autre nommément**.

### B4 — `ecartees` : ni le type élargi que je proposais, ni l'Option E

**« Le découpage est identique sous les deux » : je CONFIRME** — la question ne rouvre pas le plan.

- **Option E — RETIRÉE.** Le troisième message ship.
- **`Set<MotifEcart>` — RETIRÉ.** Avec une seule porte, `'amont-inatteignable'` **n'est jamais interrogée** : c'est la branche `else`. **Une valeur d'union qu'aucun lecteur n'interroge est de l'information non lue — mon biais, exactement.** Et l'extensibilité ne tient pas : `contrepartie` est reportée vers une règle **sur l'objet**, qui n'ajouterait aucun motif d'écart sur l'index des indices.
- **Retenu : un BOOLÉEN nommé**, la classification restant **possédée par `atteignabilite.ts`**.

### B5 — H3 faux depuis it7 : ça **renforce** la sortie de `contrepartie`

- **Renforcement, pas neutralité.** Le projet porte **déjà** une dette dans le sens interdit. En ajouter une seconde, **avec un routage pire**, n'est pas de la cohérence, **c'est du compoundage**.
- **La correction de H3 entre dans le lot — mais c'est une correction de COMMENTAIRE, pas de comportement.** Le fichier est déjà possédé, le bloc déjà réécrit autour, et laisser au milieu une phrase mesurée fausse est KR-199.
- **N'entre PAS** : le comportement de `possede_objet`. **On écrit le défaut, on ne le répare pas.** À porter comme **KR neuf** dans la spec et `code-knowledge.json`.

### B6 — Le **ET** du `pm-produit` : porté par construction

**Réponse franche : le test demandé — deux portes ÉVALUÉES, une fermée, une ouverte — n'est pas constructible dans cette tranche**, puisqu'une seule porte est évaluée. Ce qui reste, et qui est le vrai risque nommé, **est testable et doit l'être** : qu'une porte **présente mais non évaluée** n'**ouvre** pas une porte fermée.

`porteOuverte` porte le ET **par construction** — suite de gardes à sortie `false`, **jamais un `some`**. Une porte évaluée de plus = une garde de plus.

**Deux témoins**, dans `atteignabilite.test.ts` : (1) porte d'indice fermée **+ porte de confiance posée** → compte **0** (tue la forme disjonctive) ; (2) porte d'indice **ouverte** + `jet` posé → compte **1** (tue M4).

**Forme de la porte : `undefined`, jamais `null` — MESURÉ**, ce qui tranche la question de l'`ux-designer`. `retirerPorte` **supprime la clé** et supprime `revele_si` avec la dernière ; le `null` appartient à `BrouillonSavoir`, projeté par `?? null` — **modèle de vue, jamais le dossier persisté**. **Aucune garde double.**

### B7 — Découpage FINAL

| id | titre | contrat ? | fichiers |
|---|---|---|---|
| **L1** | La porte d'un savoir est infranchissable | **oui**, seul | R `atteignabilite.ts` · R `atteignabilite.test.ts` · R `controles.ts` · R `controles.test.ts` |

**Aucun fichier créé. Aucune fixture partagée touchée (KR-156)** — tous les témoins sont des clones locaux. Les fichiers de l'étape 4 appartiennent au **même** lot : ils ne se sous-traitent pas.

### B8 — Signatures FINALES

```ts
export interface ProducteursIndice {
	readonly retenues: readonly SourceIndice[]     // LE COMPTE des trois seuils
	readonly savoirSousPorteMorte: boolean          // classé ICI, jamais reconstruit par l'appelant
}
export function producteursParIndice(dossier: Dossier): Map<string, ProducteursIndice>
function porteOuverte(revele_si: Revelation | undefined, indicesProduits: ReadonlySet<string>): boolean
```

Consommation : `compte = entree?.retenues.length ?? 0` ; priorité `savoirSousPorteMorte` → `MESSAGE_INDICE_SOUS_PORTE_MORTE`, puis `entree !== undefined` → `SANS_RACINE`, sinon le zéro nu. **Le nouveau message se déclare avec les `PROSES_*`, bien AVANT `SITES_AVERTISSEMENT`.**

### B9 — La forme du point fixe (elle ne change pas ; elle se simplifie)

Un seul point fixe **croissant depuis ∅**, une seule liste de travail : index brut inchangé (six chemins, il **définit le domaine des clés**) · noyau = deltas + savoirs sans `apres_indice_id` · savoirs en attente indexés par `apres_indice_id`, débloqués **au plus une fois** · arêtes `mene_a` sur le même curseur · reconstruction avec `porteOuverte` **ré-évaluée contre l'ensemble FINAL**.

**Point porteur** : *aucune comptabilité de « qui a été libéré » n'est nécessaire* — l'ensemble ne fait que croître, donc « libéré pendant la relaxation » ⟺ « porte ouverte au final ».

### B10 — Mutants dus (N gardes ⇒ N mutants)

M1 `porteOuverte` toujours `true` · **M2 point fixe PUIS soustraction** (les variantes « avant » et « après, une seule fois » sont **deux** mutants distincts) · M3 cycle mutuel sans racine (**déjà exécuté par la QA : le filtre naïf rend 1/1**) · M4 portes non évaluées lues comme fermées · **M5 `porteOuverte` écrite en disjonction (`some`)** — c'est le ET du PM · M6 `savoirSousPorteMorte` toujours faux **ou priorité inversée**, avec le cas **mixte** · M7 `pnj_a_revele` laissé non filtré · M8 domaine des clés rétréci.

### B11 — Ce que je demande à la QA AVANT que l'ouvrier écrive

1. **Rayon d'explosion de `apres_indice_id` SEUL.** S'il n'en reste aucun, **c'est le risque n° 1 de cette note**.
2. **Rayon du resserrement de `pnj_a_revele`**, mesuré **séparément** — **jamais mesuré**. S'il bouge une fixture partagée : **retour au comité**, jamais de mutation (KR-156).
3. **`apres_indice_id` en auto-référence** (`savoir.apres_indice_id === savoir.indice_id`) : légal au schéma, se ferme sous le lfp. **Le cas limite le moins cher à oublier.**

### B12 — REJETÉ (à recopier au § 8)

1. **REJETÉ — une remédiation TROISIÈME et distincte.** Motif de **contrat** : exigerait un discriminant sur `ConstatControle`, interface exportée — état illégal représentable (arbitrage it6). **Remplacé par** la remédiation unique réécrite d'une clause nommant le geste réel.
2. **REJETÉ — `contrepartie.objet_id` dans cette tranche.** Ensemble sous-compté (H4) **et** défaut rapporté sur la mauvaise entité.
3. **REJETÉ — « zéro texte neuf ».** Le message existant nie trois familles dont une est **présente** : classe BUG-088.
4. **REJETÉ — Option E**, ma propre proposition de repli : formulation à exceptions sur un bloquant.
5. **REJETÉ — `MotifEcart` en union.** Information non lue.
6. **REJETÉ — extraire `objetsDonnesDe`.** Un seul appelant.
7. **REJETÉ — deux temps.** Un contrat élargi sans consommateur.
8. **REJETÉ — deux lots parallèles.** Le lot `controles` ne compile pas seul.
9. **REJETÉ — corriger le COMPORTEMENT de `possede_objet` ici.** On écrit le défaut, on ne le répare pas.
10. **REJETÉ — une garde double `=== null || === undefined`.** Mesuré : le document ne porte que `undefined`.
11. **REJETÉ (rappel, tous maintenus)** — couche au-dessus ; gfp ; champ `porte` sur `SourceIndice` ; `causeDuZero` exportée ; évaluer `confiance_min`/`jet` ; exporter `indicesProduits` ; le jalon comme porte fermée ; mémoïser ; muter les fixtures partagées.

### B13 — REPORTÉ

- **`contrepartie` → une règle sur l'OBJET**, qui porte la cause et renvoie au bon écran. **C'est là que `objetsDonnesDe` gagnera son second appelant — et seulement là.**
- **`possede_objet`** : second site du sens interdit, écrit à H3 dans ce lot, corrigé avec la règle ci-dessus.
- **`confiance_min` / `jet`** : à déclarer **définitivement non évaluables**, sur le motif du `narratif-ia` (verdict **constant**, seconde source de vérité), pas « un dé n'est pas une certitude ».
- **L'atteignabilité du PORTEUR** — dernière famille de H2 encore ouverte.

---

## Notes de l'orchestrateur

**L'argument de routage est ce qui clôt le débat sur `contrepartie`**, et il est de ce domaine : nommer la mauvaise entité sous une règle bloquante envoie l'auteur réparer un écran où il n'y a rien à réparer. Aucun autre rôle ne l'avait posé.

**Le rôle pèse et écarte le contre-argument qui l'aurait contredit** — son propre critère « deux vérités dans un fichier » — au lieu de l'ignorer. C'est la forme qu'on attend d'un tour 2.

**Quatre retraits volontaires** : Option E, l'extraction d'`objetsDonnesDe`, les deux temps, et le `MotifEcart` en union — ce dernier étant explicitement nommé comme son propre biais d'abstraction prématurée, deux fois.

**Le veto sur la remédiation distincte est dans son domaine** (contrat `brain/`, état illégal représentable) **mais il est sans objet** : l'`ux-designer` avait déjà retiré cette position dans sa propre note de tour 2. Les deux ont convergé sans se voir.

**Le piège `null`/`undefined` que j'avais relevé est tranché par la mesure** : `retirerPorte` supprime la clé ; le `null` est un modèle de vue. Aucune garde double.
