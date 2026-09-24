# Tour 1 — tech-lead — moteur-dossier it3

```
RISQUE — Le déclenchement des jalons a DEUX sites d'appel : `ouvrirSession` (décision (i))
et `executerCommande` après chaque commande acceptée. Écrit deux fois, c'est une règle du
jeu à deux décideurs (KR-013) — la panne exacte que `commandes.ts` s'est écrit pour éviter
(« la console ne valide rien »). Le contrat doit nommer UNE fonction, et un test-grep doit
prouver DEUX appelants et UN SEUL lecteur de `charpente.jalons` (KR-246).

OBJECTION (trois, toutes mesurées par lecture)
1. `ouvrirSession` cesse d'être triviale : elle héberge un point fixe. `effet:[{delta:
   'atteindre_jalon'}]` est représentable AUJOURD'HUI, donc une passe unique en ordre de
   document est ordre-dépendante — elle rate une chaîne écrite à l'envers, verte (BUG-087).
2. Le scénario séparateur de KR-247 (« un delta demandé DEUX FOIS ») est INATTEIGNABLE par
   les jalons : un jalon atteint n'est pas rejoué. Sans un second porteur écrit
   (deux jalons `reveler_indice` sur le même indice), le critère épingle une coïncidence.
3. Trois tests rougiront, aucun n'est au cadrage : `expr.test.ts:420/433` (4e lecteur
   d'arbre), `tourzeroOracle.test.ts:148` (plancher 6 → 5 après correction des cellules),
   `sessionCouverture.test.ts:43` (« ses quatre feuilles » → sept).

PROPOSITION
· DEUX lots, lot `contrat` NON scindé — chiffrage des deux frontières en annexe.
· `DELTAS[x].ecrit(faits, cibles)` rend LA MÊME RÉFÉRENCE quand rien ne change ;
  `appliquerDelta` en dérive `effet` par `===`. `'sans_effet'` devient mécanique, pas
  déclaratif — précédent au dépôt : `commandes.ts:207`.
· Point fixe BORNÉ par `charpente.jalons.length`, témoin en ordre INVERSE du document.
· Cellules prudentes (KR-252 le dit déjà) : `indice_connu → 'indecidable'`,
  `lieu_visite → 'vrai'` sur le départ, `'indecidable'` ailleurs.

VERDICT — recevable sous réserve (les trois objections tranchées au tour 2).
```

## A — Découpage : DEUX lots, séquentiels, L1 ∩ L2 = ∅

### Lot 1 — `faits-evaluateur-jalons` · **`contrat`** · seul et en premier

(N) `brain/dossier/faits.ts` · `evaluate.ts` · `evaluate.test.ts`
(R) `predicates.ts` (champ `lit`) · `deltas.ts` (champ `ecrit`) · `deltas.test.ts` · `expr.test.ts` (4ᵉ lecteur, `:420`, `:433`) · `session.ts` (`EntreeJournal.deltas?`, appel à l'ouverture) · `session.test.ts` · `commandes.ts` (appel après commande acceptée) · `commandes.test.ts` · `sessionDestinations.ts` (3 lignes) · `__fixtures__/session-saturee.ts` · `sessionCouverture.test.ts` · `tourzero.ts` (cellules + bloc H6) · `tourzero.test.ts` · `tourzeroOracle.test.ts` · `brain/index.ts` · `docs/EXIGENCE-APERCU-DU-JEU.md` § 6

**Nom RÉSERVÉ à L1** : `brain/dossier/jalons.ts` — si `evaluate.ts` franchit 400 lignes (KR-112), la passe y part **au-dessus de `types.ts`**.
**INTERDITS, verts sans modification** : `types.ts`, `destinations.ts`, `validate.ts`, `couverture.test.ts`, `atteignabilite.ts`, `controles.ts`, `controles.test.ts`, `feuilles.ts`, `src/player/**`, **tout `src/features/**`**. *(Mesuré : `Jalon.declencheur_expr?` et `Jalon.effet` existent déjà, `types.ts:1495-1512` — le schéma du DOSSIER ne bouge pas.)*

### Lot 2 — `jalon-a-l-ecran` · feature

(N) `play-mode/components/JalonsAtteints.tsx` · `play-mode/tests/jalons.test.tsx`
(R) `EcranPartie.tsx` (montage, projection EN LIGNE) · `JournalRow.tsx` (rendu de `entree.deltas`) · `tests/deplacement.test.tsx` (si le journal change de forme)
`moteurSansIA.test.ts` **n'est pas au diff** (liste dérivée du disque). **INTERDIT** : tout `src/brain/**`.

### La question du § 4 — faut-il scinder le lot `contrat` ? **NON.**

| Frontière | Verdict | Coût |
|---|---|---|
| **A — lecture/écriture** | **Illégale** | Les deux lots nomment `evaluate.ts`. La rendre légale exigerait de scinder `evaluate.ts` **pour faire tenir le découpage** — l'outil qui commande l'architecture |
| **B — registres+évaluateur / session+tourzero** | **Légale mais perdante** | L1a livrerait `faits.ts` **et** `evaluate.ts` **sans un seul lecteur de production** — l'objection que le comité a close en it1 (« `faits.ts` part en it3 **avec son premier lecteur** »). Coût : +1 ouvrier, +1 porte, +1 relecture de contrat, réouverture d'un arbitrage signé. Achat : **rien**, l'exécution est séquentielle dans les deux cas |

**Le vrai levier de taille n'est pas la scission, c'est le périmètre** : 19 fichiers dont **9 sont des tests ou fixtures** et 3 de la prose. **Le corps neuf tient en deux fichiers.**

## B — Signatures exactes

```ts
// faits.ts (N) — AUCUN import. Seul domicile possible d'un type que DEUX registres
// frères doivent nommer sans se dépendre (`deltas.ts:41-42` : « deux registres frères
// ne se dépendent pas »). Ce n'est pas spéculatif, c'est une contrainte du dépôt.
export interface FaitsDeSession {
	readonly lieu_courant: string
	readonly lieux_visites: readonly string[]
	readonly objets_possedes: readonly string[]
	readonly indices_connus: readonly string[]
	readonly jalons_atteints: readonly string[]
	readonly evenements_consommes: readonly string[]
	readonly pnj: Readonly<Record<string, { readonly a_dit: readonly string[] }>>
}
// session.ts (R) — le NOM public ne bouge pas, zéro appelant déplacé
// (mesuré : `EtatMonde` n'a que 5 porteurs en `src/`) :
export type { FaitsDeSession as EtatMonde } from './faits'
```

```ts
// predicates.ts (R) — CHAMP DU DESCRIPTEUR, jamais un `switch` (KR-117).
lit: (faits: FaitsDeSession, cibles: readonly string[]) => boolean
// totale sur (faits bien formés, arité `refKinds.length`) ; ne LÈVE jamais —
// c'est l'aiguillage d'`evaluate.ts` qui lève (KR-238).

// deltas.ts (R) — le jumeau ÉCRIVAIN, annoncé par la docstring du module.
ecrit: (faits: FaitsDeSession, cibles: readonly string[]) => FaitsDeSession
// ⚠ REND LA MÊME RÉFÉRENCE quand rien ne change — c'est ce qui rend `'sans_effet'`
// MÉCANIQUE et non déclaratif. Précédent : `commandes.ts:207`.
```

```ts
// evaluate.ts (N) — importe faits, expr, predicates, deltas, types.
// N'importe NI session.ts NI commandes.ts : ce sont EUX qui l'appellent.
export interface DeltaJournalise { readonly delta: DeltaId; readonly cibles: readonly string[]
	readonly effet: 'applique' | 'sans_effet' }          // `origine` n'y est PAS (it2)
export interface JalonAtteint { readonly jalon_id: string; readonly enonce: string }

export function evaluerExpr(faits: FaitsDeSession, noeud: ExprNode): boolean
// BIVALENTE, ET ELLE LÈVE (KR-238). `switch (noeud.op)` + `default` sur `never`.

export function appliquerDelta(faits: FaitsDeSession, delta: Delta):
	{ readonly faits: FaitsDeSession; readonly journalise: DeltaJournalise }
// `effet` dérivé par `===` sur la référence rendue par `ecrit` — jamais déclaré.

export function resoudreJalons(dossier: Dossier, faits: FaitsDeSession):
	{ readonly faits: FaitsDeSession; readonly atteints: readonly JalonAtteint[]
	  readonly deltas: readonly DeltaJournalise[] }
// UN corps, DEUX appelants. SEUL LECTEUR de `charpente.jalons` (test-grep, KR-246).
// POINT FIXE BORNÉ par `charpente.jalons.length` : `jalons_atteints` croît de façon
// monotone, la terminaison est un compteur, pas une promesse. Un jalon SANS
// `declencheur_expr` n'est jamais atteint automatiquement. Un jalon DÉJÀ atteint
// n'est pas réévalué. AUCUNE mémoïsation (KR-013).

export function projeterJalonsAtteints(dossier: Dossier, faits: FaitsDeSession): readonly JalonAtteint[]
```

```ts
// session.ts (R)
readonly deltas?: readonly DeltaJournalise[]
// OPTIONNEL À VIE (KR-251) ; sur l'entrée `moteur` SEULE, comme `origine`.
// Un tableau VIDE ne s'écrit JAMAIS : « aucun delta » s'écrit `undefined`
// (sinon deux représentations du même fait).

// sessionDestinations.ts (R) — TROIS lignes de feuille, toutes 'moteur' :
'journal[].deltas[].delta' · 'journal[].deltas[].cibles[]' · 'journal[].deltas[].effet'
// et la dispense de `journal` passe de « ses quatre feuilles » à « ses SEPT feuilles ».

// brain/index.ts (R) — CE QUI SORT : `projeterJalonsAtteints` + `JalonAtteint` + `DeltaJournalise`.
// NE SORTENT PAS : `FaitsDeSession`, `evaluerExpr`, `appliquerDelta`, `resoudreJalons`.
// Une feature REND une projection ; elle n'évalue jamais une condition.
```

## C — Ordre acyclique

```
identifiers → issues → faits → predicates → expr → deltas → types → evaluate → tables → validate
                                                                        ↑
                                              session ─┘  commandes ─┘   (VALEUR)
                                              session ↔ commandes : import TYPE seul (it2)
```

- **« `faits.ts` AVANT `predicates` » tient, et c'est OBLIGÉ** : les deux registres frères doivent nommer la même forme et s'interdisent de se dépendre. Seul domicile légal = un module **en amont des deux**. `faits.ts` n'importe rien.
- **« `evaluate.ts` APRÈS `deltas` » tient, précisé : après `types.ts`** (il a besoin de `Dossier`/`Jalon`). `types.ts` n'importe **jamais** `evaluate.ts` : `evaluate` est une **feuille** greffée après `types`.
- **Aucun cycle de VALEUR** : `DeltaJournalise` et `JalonAtteint` sont déclarés **dans `evaluate.ts`** ; les déclarer dans `session.ts` créerait `evaluate --type--> session --valeur--> evaluate`, la forme exacte contre laquelle `session.ts:2-8` met en garde.
- **`commandes.ts --valeur--> session.ts` n'est PAS requis** : les deux appellent `evaluate.ts` directement. **Ne pas transformer l'arête type-seule.**

## D — Le déclenchement : deux appelants, un seul corps

1. **`ouvrirSession`** — OUI, décision (i) l'exige (`tourzero.ts:46-51`). Construit le `monde` initial, puis appelle `resoudreJalons` **une fois**.
2. **`executerCommande`** — après chaque commande **ACCEPTÉE**, sur le monde déjà muté, **avant** la composition des entrées. Un REFUS n'appelle rien.

**Ce que coûte la perte de trivialité d'`ouvrirSession`, dit franchement** : elle reste PURE, totale, synchrone, sans horloge ni tirage — **la propriété qui compte ne bouge pas**. Ce qui bouge : elle n'est plus lisible d'un coup d'œil, et un futur chemin d'ouverture qui l'éviterait hériterait d'un état **incohérent avec sa propre table de tour zéro** (famille KR-239).
**La contrepartie est déjà livrée** : `tourzeroOracle.test.ts` confronte la table à l'état qu'`ouvrirSession` **produit réellement**. Placer la passe **chez l'appelant** rendrait l'oracle vert **par impuissance** — il examinerait un instant qui n'est plus celui du début de partie, et tout l'argument de KR-252 tomberait sans qu'une porte rougisse.
**Point fixe, pas passe unique** : `atteindre_jalon` est dans `DELTAS`, donc `effet: [{ delta: 'atteindre_jalon' }]` est représentable **aujourd'hui** ; une passe unique en ordre de document rate la chaîne écrite à l'envers, **verte**. Témoin obligatoire : deux jalons chaînés en **ordre INVERSE du document**, plus le mutant « une seule passe » vu ROUGE (BUG-087 à la lettre).
**Décision autonome** : à l'ouverture, **aucune entrée de journal n'est écrite** (le journal démarre vide, RETENU it1) ; l'auteur voit les jalons d'ouverture par la **projection**.

## E — Les huit pièges d'instrument *(relevés par LECTURE ; aucun exécuté)*

| # | Instrument | Ce qui se passe | Traitement |
|---|---|---|---|
| 1 | `expr.test.ts:411-420` | `evaluate.ts` portera `switch (noeud.op)` → entre dans la liste dérivée du disque → l'égalité triée **rougit** | **L'amender est LÉGITIME, et c'est le lot `contrat` qui le fait** — celui qui crée `evaluate.ts`. L'invariant **durcit** : il exige déjà d'un lecteur sémantique d'être exhaustif au compilateur. **Trois éditions** : `:420`, `:433` (`semantiques` → trois), la boucle `FERMETURE` |
| 2 | Mêmes regex, **commentaires compris** | `source(nom)` est un `readFileSync` **brut** (`:370-372`), sans `enPositionDeCode`. Une docstring de `faits.ts` écrivant `op === 'et'` **enrôlerait `faits.ts` comme lecteur** | **Contrainte normative** : dans `faits.ts`, `predicates.ts`, `deltas.ts`, aucune prose ne contient `op === '` ni `switch (…op)`. Écrire « l'opérateur `et` » |
| 3 | `tourzeroOracle.test.ts:148` | Plancher `>= 6`. Après correction : `indice_connu` −2, `lieu_visite` +1 → **5 < 6 → ROUGE** | **Dérivé par lecture, NON EXÉCUTÉ — à mesurer par le lot.** Le plancher se **re-dérive sur la mesure neuve** ; le § « ASYMÉTRIE MESURÉE » (`:35-42`) devient faux et se réécrit |
| 4 | `tourzero.test.ts:106` | `VALEUR_ATTENDUE` recopiée ; deux cellules changent. `:271` reste satisfait (les trois valeurs restent représentées) | Édition payée **une fois** (D-2 bis). **À ajouter** : un second bras `lieu_visite` sur un lieu ≠ départ, calqué sur `LIEU_AILLEURS` — sans lui le bras `'indecidable'` n'est exercé nulle part |
| 5 | `controles.test.ts` (dossier de référence) | **Mesuré** : le départ de `dossier-reference.json` est `lieu.foyer-du-guet` ; **aucun** `lieu_visite` n'y vise le départ, et `:409-411` porte `non(lieu_visite(lieu.vigie-du-nord))`. Sous une cellule `'faux'` hors départ, ce sous-arbre deviendrait **certain-VRAI** et le linter tirerait | **C'est l'argument qui tranche la forme de la cellule** : `'indecidable'` hors départ (sur-prudence, faux négatif seul — ce que KR-252 promet déjà). `controles.test.ts` reste **hors du lot** et vert |
| 6 | `sessionCouverture.test.ts:43`, `:85-101` | Dispense « quatre feuilles » → **sept** ; une ligne d'audience sans instance est **morte** → `:92` rouge | Les deux fichiers dans le lot `contrat`, **indissociables** |
| 7 | `codeKnowledge.test.ts:133` *(instrument neuf, `B3`)* | Un KR neuf écrit dans la spec fait rougir la **porte de commit** tant qu'il n'est pas mirroré | Miroir **à l'étape 4 des Build Steps, dans le même lot que la doc** |
| 8 | KR-243 | Hors score de mutation | La revue l'**écrit noir sur blanc** ; aucun run `test:mutation` |

## F — Décisions prises en autonomie

- **Domicile de la forme à 7 champs** → **corps DÉPLACÉ dans `faits.ts`**, `EtatMonde` devient un alias ré-exporté → si recopié : deux déclarations que rien ne resynchronise (KR-013 **au contrat**), et le jour où la n° 11 ajoute un champ, un seul le reçoit.
- **Nombre de passes** → **point fixe borné** → si passe unique : ~15 lignes de moins, mais un jalon chaîné en ordre inverse **ne se déclenche jamais**, sans qu'aucun test rougisse.
- **Domicile de `resoudreJalons`** → **`evaluate.ts`** → si dans `session.ts` : 303 → ~385 lignes (KR-112 à 15 lignes du signal) et `commandes.ts` devrait importer une VALEUR de `session.ts`.
- **Journal à l'ouverture** → **aucune entrée** → sinon des entrées `tour: 0` avant toute action, l'état vide meurt sans décision, l'écran s'ouvre déjà rempli.
- **`ecrit` rend la même référence** → `effet` par `===` → si structurel : un comparateur profond maison non couvert ; si déclaré par l'appelant : la coïncidence que KR-247 interdit.
- **`deltas?` absent plutôt que `[]`** → sinon deux représentations du même fait (précédent `climat[].effets_regles`).
- **Ce qui sort du baril** → **la projection + 2 types** → si `evaluerExpr` sortait, une feature pourrait décider une règle du jeu hors du moteur.

## G — REJETÉ *(à reporter au § 8 du plan — BUG-082)*

1. **Scinder le lot `contrat`** : frontière A illégale (partage `evaluate.ts`), frontière B livre `faits.ts`/`evaluate.ts` **sans lecteur de production** et rouvre un arbitrage clos en it1. Coût net : +1 ouvrier, +1 porte, zéro parallélisme.
2. **`evaluate.ts`/`faits.ts` dans `src/player/` ou un `brain/session/`** : tranché au cadrage ; **veto réarmé** si reproposé.
3. **Un `switch` au site d'appel pour `lit`/`ecrit`** : KR-117.
4. **`lieu_visite: 'faux'` hors départ** : déplace le sens d'erreur vers le **faux positif** et fait tirer le linter sur `dossier-reference.json:409-411` (mesuré) — donc traîne `controles.test.ts` dans le lot.
5. **`Jalon[]` filtré, `Pick<Jalon, …>`, `Partial<Jalon>`** pour la projection : KR-246, les deux se ré-élargissent d'un mot.
6. **Exporter `FaitsDeSession`, `evaluerExpr`, `appliquerDelta`, `resoudreJalons`** : KR-109, et un évaluateur exposé fabrique un second décideur.
7. **Mémoïser l'évaluation, ou cacher la projection dans un `useState`/`useEffect`** : KR-013/113.
8. **`origine` dans `journal[].deltas`** : pré-emption d'it2, la forme est `{ delta, cibles, effet }`.
9. **Élargir `CommandeId` d'un membre `'jalon'` ou `origine` en `string`** : décision d'it2.
10. **Prouver KR-247 par un jalon déclenché deux fois** : **mécaniquement impossible**, un jalon atteint n'est pas réévalué. Le séparateur doit être **deux jalons portant le même `reveler_indice`**, ou un `effet[]` listant deux fois le même delta.
11. **Toucher `types.ts`, `destinations.ts`, `validate.ts`** : mesuré, le schéma du dossier ne bouge pas — si un lot croit devoir l'ouvrir, **c'est le signal qu'il a dérivé**.
