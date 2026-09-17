# Tour 1 — Tech Lead

**RISQUE** — La direction d'erreur interdite ne se conserve PAS sous `non`. Une évaluation **bivaluée** à t=0 la retourne mécaniquement : un prédicat « supposé faux » devient, sous une négation, un fait **ASSERTÉ vrai** — donc un faux positif sous la règle. Mesure C n'est pas un cas isolé, c'est le régime général de la négation ; et l'unique témoin positif réel du dépôt (Mesure A) **EST** un `non`.

**OBJECTION** — Le cadrage traite la règle comme la jumelle d'`objectif-sans-chemin`. C'est son **inverse** : là-bas `non` rend `null` sans descendre ; ici descendre est obligatoire. Conséquence non écrite au cadrage : le témoin rendu porte une **POLARITÉ**. Sans elle, Mesure A produit « possède l'objet « Le sceau de cendre » » quand le fait est « ne le possède PAS » — la phrase dit le contraire de la cause, sur le seul défaut réel du dépôt. Seconde objection : Q2 présuppose une mécanique partagée avec `atteignabilite.ts`. Il n'y en a **aucune** — les sept prédicats à t=0 ne lisent que `charpente.depart.lieu_id` : ni point fixe, ni `objetsDonnes`, ni `porteOuverte`.

**PROPOSITION** — Q2 : module **neuf** `ouverture.ts`. Q3 : **TRIVALUÉ** (Kleene), la règle ne tirant que sur VRAI-CERTAIN, `non(?) = ?` — zéro hypothèse à dater sur `lieu_visite`/`jalon_atteint`. Oui, `expr.test.ts:404/416` **rougit** : **réécrite**, jamais desserrée, au nom de l'invariant qu'elle porte déjà — un seul lecteur d'`unknown`, tout lecteur typé exhaustif au compilateur. Elle y **gagne** : l'appariement aiguillage/fermeture s'exerce sur deux fichiers à un `switch` chacun. **UN SEUL LOT**, contrat, six fichiers, deux temps.

**VERDICT** — **recevable sous réserve** : trivalence, polarité du témoin, KR-227 porté à trois lignes.

---

# ANNEXE

## 1. Découpage en lots — **UN SEUL**, et l'argument est mécanique

Tous les fichiers de l'itération vivent dans `src/brain/dossier/`. Un lot qui touche `brain/` est `contrat` et s'exécute **seul et en premier** ; deux lots contrat ne peuvent pas être tous deux premiers. Mesure E confirme **zéro fichier d'UI**. Il n'y a donc rien à paralléliser — le découpage le **révèle**, il ne l'invente pas. Exécution séquentielle, **sans worktree ni fusion**. Précédent : « RETENU (raffinage it4, tech-lead) — UN SEUL LOT, et l'argument est TEXTUEL ».

| id | titre | contrat | fichiers |
|---|---|---|---|
| `L1` | L'échec au tour zéro | **oui** | **N** `src/brain/dossier/ouverture.ts`<br>**N** `src/brain/dossier/ouverture.test.ts`<br>**R** `src/brain/dossier/expr.test.ts`<br>**R** `src/brain/dossier/controles.ts`<br>**R** `src/brain/dossier/controles.test.ts`<br>**R** `src/brain/dossier/atteignabilite.ts` *(commentaires SEULS — aucune ligne de code)* |

**Deux temps, la porte (`prettier → tsc → eslint → jest`) passée AUX DEUX** (précédent it6) :

- **Temps 1 — le module et sa garde.** `ouverture.ts` + `ouverture.test.ts` ; **rejouer `expr.test.ts` ROUGE d'abord** (le lot doit *observer* la rougeur avant d'écrire la réécriture), puis réécrire le recensement ; les deux corrections de commentaire d'`atteignabilite.ts`. `tsc` + `jest` verts.
- **Temps 2 — la règle.** 9ᵉ entrée de `CONTROLES`, prose, témoins, ligne de base. `tsc` + `jest` verts.

**Pourquoi PAS deux lots** (L1a module / L1b règle) : listes disjointes, oui — mais L1b **ne compile pas sans** `ouverture.ts`, donc ne passe pas la porte isolément. Deux lots qui ne peuvent pas être vérifiés seuls sont un lot en deux temps mal nommé.

## 2. Q2 — où vit l'état d'ouverture : **module neuf `ouverture.ts`**

**Le fait qui tranche, lu ligne à ligne** : l'évaluateur t=0 n'a **aucune** dépendance vers la machinerie d'`atteignabilite.ts`.

| prédicat | ce que t=0 exige | dépendance |
|---|---|---|
| `possede_objet` | inventaire vide à l'ouverture (`Depart` n'en porte aucun) | — |
| `indice_connu`, `pnj_a_revele`, `evenement_consomme` | champs de session vides | — |
| `lieu_courant_est` | `dossier.charpente.depart.lieu_id` | le **document**, pas l'index |
| `lieu_visite`, `jalon_atteint` | rien (indécidables) | — |

Aucun appel à `producteursParIndice`, `objetsDonnesDe`, `porteOuverte`, ni au point fixe. Le seul partage est `ExprNode` + `PREDICATES`, deux contrats publics. **L'argument « même machinerie » n'existe pas** ; reste l'argument « même fichier », qui est une dette.

Trois motifs de plus :
1. `atteignabilite.ts` **refuse cette question en toutes lettres** (« SATISFIABILITÉ, PAS ÉVALUATION — aucun état de session lu »). L'y loger oblige à réécrire la docstring **contre** sa propre décision it6.
2. Le bloc H1–H5 est le **domicile des hypothèses d'atteignabilité** (décision it6). « Le héros part sans rien » est une hypothèse d'**état de session** — deux familles dans un bloc, et Mesure D montre ce que coûte une prose approximative dans ce bloc précis.
3. La garde d'`expr.test.ts` compte `aiguillages` et `fermetures` **par fichier** — elle **compte**, elle n'**apparie** pas. Deux `switch` dans un même fichier passent avec un `: never` mal placé. Un `switch` par fichier rend l'appariement exact. *Le module neuf rend la garde plus forte ; la cohabitation la rend plus faible.*

**Le module ne s'appelle pas « atteignabilité » et `atteignabilite.ts` n'est pas renommé.** Nom proposé : `ouverture.ts`. **Réserve de nommage** signalée au comité : `ouverture` entre en collision de vocabulaire avec `charpente.depart.texte_ouverture_joueur` et l'amorce ; repli proposé `tourzero.ts`. À trancher au tour 2 — ce n'est pas un veto.

## 3. La garde de couture (contrainte 8a) — **rougit, et se RÉÉCRIT**

**Ce qui rougit** (`expr.test.ts`) : l. 404 `expect(lecteurs).toEqual([ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE])` · l. 416 `expect(semantiques).toEqual([ATTEIGNABILITE])`.

> **NON MESURÉ** — pas de `Bash`. C'est une **lecture d'assertion**, pas une exécution. Le lot **doit** rejouer le test rouge avant d'écrire la réécriture.

**Au nom de quel invariant elle est réécrite plutôt que desserrée** — de son invariant **déjà écrit** : *« aucun module ne RE-DÉRIVE la grammaire d'un arbre NON TYPÉ »* + *« un lecteur d'un arbre DÉJÀ ACCEPTÉ est admis à UNE CONDITION : être EXHAUSTIF AU COMPILATEUR »*. La liste `['atteignabilite.ts','expr.ts']` est le **recensement**, jamais l'invariant. La réécriture :

- `lecteurs` → `[ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE, OUVERTURE]` (le lot **trie explicitement** plutôt que de dépendre de l'ordre de `readdirSync`) ;
- `semantiques` → `[ATTEIGNABILITE, OUVERTURE]` — la discriminance KR-199 reste **nommée** ;
- la boucle d'appariement aiguillage/fermeture s'exerce sur **deux** sujets, inchangée ;
- ajout de `expect(source(OUVERTURE)).toContain('noeud: ExprNode')` ;
- **intouchés** : l'unicité du lecteur d'`unknown` et la dérivation de l'exemption depuis la **frontière de typage**.

**Ce que la garde continue d'interdire** : une cascade `if (noeud.op === …)` → `CASCADE` la relève, `aiguillages = 0`, l'appariement rend `false` → **rouge**. La garde **impose** la forme `switch` + `default: jamaisEvalue(noeud)` à paramètre `never`.

## 4. Q3 — **trivalué**, et ce n'est pas un raffinement de confort

**Le faux positif entre par `non`, pas par la feuille.** Sous bivalence, `lieu_visite(départ)` « supposé faux » rend `non(lieu_visite(départ))` **ASSERTÉ vrai** → la règle tire → faux positif. L'hypothèse datée qui sauverait la bivalence **ne va dans le sens permis que sur les feuilles positives** ; elle s'inverse sur les feuilles niées. Seule la **troisième valeur** est stable par négation.

Contrepartie mesurée : la trivalence **n'a aucun coût en matériau** — `possede_objet` reste FAUX-CERTAIN, donc Mesure A tire ; Mesure B rend `faux ou faux = faux`, silence ; le piège de Mesure C rend `non(vrai) = faux`, silence. Et elle **supprime** deux hypothèses à dater plutôt que d'en ajouter.

**Le `Trivalent` reste PRIVÉ au module.** Zéro lecteur externe : `controles.ts` reçoit un témoin, jamais une valeur logique.

## 5. Signatures exactes — le seul point de rendez-vous

```ts
// ── src/brain/dossier/ouverture.ts — CE QU'IL EXPOSE ──────────────────────────
export interface FeuilleVraieAuTourZero {
	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
	readonly predicat: string
	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
	readonly cibles: readonly string[]
	/** La feuille est sous un nombre IMPAIR de `non` : le fait établi est son ABSENCE. */
	readonly nie: boolean
}

/**
 * La feuille qui rend la condition VRAIE au tour zéro — `null` quand elle est
 * fausse OU indécidable. Pure, totale, sans mémoïsation (KR-013/113).
 */
export function premiereFeuilleVraieAuTourZero(
	dossier: Dossier,
	condition: ExprNode,
): FeuilleVraieAuTourZero | null
```

```ts
// ── PRIVÉ au module, jamais exporté ──────────────────────────────────────────
type Trivalent = 'vrai' | 'faux' | 'indecidable'

/** Un SEUL aiguillage, donc une SEULE fermeture `: never`. */
interface Verdict { readonly valeur: Trivalent; readonly temoin: FeuilleVraieAuTourZero | null }
function verdictAuTourZero(dossier: Dossier, noeud: ExprNode, nie: boolean): Verdict
function jamaisEvalue(_operateur: never): Verdict   // la fermeture exigée par expr.test.ts

/** TOTAL par compilation (KR-117) : un huitième prédicat ne compile pas. */
const VALEUR_AU_TOUR_ZERO: Record<PredicatId, (dossier: Dossier, cibles: readonly string[]) => Trivalent>
```

**Ce que le module CONSOMME** : `PREDICATES` / `PredicatId` (`./predicates`) · `ExprNode` (`./expr`, arbre **déjà accepté** par `validateExpr`) · `Dossier` (`./types`, **un seul champ lu** : `charpente.depart.lieu_id`).

**La table, ligne par ligne — le plan l'écrit, l'ouvrier ne l'invente pas :**

| ligne | valeur à t=0 | motif |
|---|---|---|
| `possede_objet` | `'faux'` | l'inventaire est vide à l'ouverture — `Depart` ne porte aucun inventaire |
| `indice_connu` | `'faux'` | `indices_connus` part vide |
| `pnj_a_revele` | `'faux'` | `pnj.<id>.a_dit[]` part vide |
| `evenement_consomme` | `'faux'` | `evenements_consommes` part vide |
| `jalon_atteint` | `'indecidable'` | deux écrivains, dont un `declencheur_expr` optionnel que le moteur pourrait évaluer au tour zéro |
| `lieu_visite` | `'indecidable'` | le statut du lieu de départ à t=0 n'est **tranché nulle part** (Mesure C) |
| `lieu_courant_est` | `'vrai'` ssi `cibles[0] === dossier.charpente.depart.lieu_id`, `'faux'` sinon | **la ligne qui interdit le faux positif** (Mesure C) |

**Kleene, écrit une fois :** `non` : V↔F, `?`→`?` · `et` : F si une F, V si toutes V, `?` sinon · `ou` : V si une V, F si toutes F, `?` sinon. La règle ne tire que sur racine `= 'vrai'`.

**Polarité du témoin** : `nie` bascule à chaque `non` traversé et est **posé à la feuille**. Sur Mesure A, `nie = true` → la phrase doit dire l'**absence** de l'objet.

## 6. Ce que le lot doit à `controles.ts` — et la couture d'it6 tient

9ᵉ entrée, `path: 'canon.objectifs[].echoue_si_expr'`, `section: 'canon'`, garde de silence sur les cibles non résolues (`collectIds`, même geste qu'it7).

**Vérifié en source** :
- `'canon.objectifs[].echoue_si_expr'` **est** une clé de `DESTINATION_DES_CHAMPS` (`destinations.ts:141`, valeur `'moteur'`) → la décision it1 est satisfaite **sans toucher `destinations.ts`** ;
- la couture d'it6 (`controles.test.ts:1936`) interdit `from './predicates'`, `from './expr'` et le mot `ExprNode` dans `controles.ts`. Un import `from './ouverture'` ne l'enfreint **ni en lettre ni en esprit** : `controles.ts` reçoit du **français**, des **identifiants** et un **booléen** ;
- **à ajouter dans le même lot** : `expect(SOURCE_CONTROLES).toContain('premiereFeuilleVraieAuTourZero')`.

**Obligations portées par le COMPILATEUR** : `controles.test.ts:522` — `NEUVES: Record<Exclude<ControleId, 'amorce-non-redigee'>, …>` est **total**. `tsc` refuse de compiler tant que la 9ᵉ règle n'a pas son dossier témoin **et** sa section épinglée valeur par valeur.

**Gardes qui bougent** : `controles.test.ts:1590` · `controles.test.ts:1647` (« huit » → « neuf ») · `expr.test.ts:404/416`.

**Déduction NON MESURÉE** : la ligne de base ne bouge que sur la référence (11 → 12), et `jouable` ne change sur **aucun** des trois dossiers quel que soit l'arbitrage de Q1. Si cela se confirme, **Q1 n'a aucune conséquence sur le découpage** : je n'y ai pas de terrain, et je ne le prends pas.

## 7. KR-227 — une liste fermée qui devient fausse

KR-227 énumère **« CES DEUX LIGNES, et elles seules »**. La ligne `possede_objet → 'faux'` est un **troisième lecteur** du même invariant. Une liste fermée devenue fausse est **pire** qu'une liste absente.

**À livrer dans le même lot** : le paragraphe H5 gagne une phrase nommant le troisième lecteur ; KR-227 amendé dans `specification.json` **et** `code-knowledge.json` (« trois lignes »). L'hypothèse est **domiciliée dans `ouverture.ts`**.

Et dans le même geste : **Mesure D**. La corriger **ici** est obligatoire, parce que l'itération publie à côté un module qui **contredit** cette phrase. *Correction de commentaire uniquement — zéro ligne de code.*

## 8. Charge des deux gros fichiers, et la tranche `chore` reportée par it8

- **`atteignabilite.ts` (729 l.)** — après ce lot : **+~8 lignes de commentaire**, zéro ligne de code. C'est le principal bénéfice collatéral du module neuf : sans lui, ce fichier partait à ~900 lignes en portant **deux questions** dont il déclare lui-même qu'elles sont distinctes.
- **`controles.ts` (1211 l.)** — après ce lot : **~1320**.

**Verdict sur la tranche `chore` — NE PAS la prendre ici** :
1. Elle est **déclarée risquée par sa propre fiche** : deux gardes bornées par `indexOf(…)` qui **voyagent avec le bloc ou mentent en silence (vertes à vide)**. Refactor à **vert trompeur**.
2. La faire **dans le même lot** met un refactor à vert trompeur et le seul témoin positif réel du dépôt dans le même diff.
3. **Dans un lot voisin** : interdit par la propriété exclusive.
4. Son bénéfice pour n° 7 est **nul** : it10 est la dernière itération. « Avant it10 » avait pour prémisse qu'il resterait des itérations sur ce fichier ; cette prémisse tombe.
5. **Vérifié** : la prose de la 9ᵉ règle se place auprès de `PROSE_CANON_SANS_VICTOIRE` (l. 526), **avant** `SITES_AVERTISSEMENT` (l. 597) — donc **hors** de la fenêtre `indexOf`. *À vérifier par l'ouvrier : contrainte de placement.*

**Re-datation proposée** : *« le premier lot qui rouvrira `controles.ts` après n° 7 »* — candidat nommé : la règle « cet objet, personne ne le donne » (REPORTÉ it9). Ses trois rattachements le suivent inchangés.

**Conséquence assumée** : it10 ajoute un 9ᵉ `libelle` sans lecteur. **Dette reconduite en connaissance de cause.**

## 9. Ce que je REJETTE nommément — **à recopier au § 8, registre des désaccords**

> Rappel : un `REJETÉ` qui reste dans l'annexe d'un rôle **n'existe pas pour l'essaim** (BUG-082).

- **REJETÉ — loger l'évaluation à t=0 dans `atteignabilite.ts`** pour éviter de toucher `expr.test.ts`. Motif : aucune machinerie partagée, le fichier refuse cette question en toutes lettres, et cohabiter **affaiblit** la garde. Éviter une réécriture de test n'est pas un argument d'architecture.
- **REJETÉ — un verdict bivalué avec hypothèse datée sur `lieu_visite(départ)`.** Motif : la direction d'erreur permise ne survit pas à `non`.
- **REJETÉ — exporter `Trivalent` depuis `ouverture.ts`.** Motif : zéro lecteur hors du module ; un type exporté à un seul appelant est une dette.
- **REJETÉ — un témoin sans champ `nie`.** Motif : sur l'unique témoin positif réel du dépôt, le message affirmerait l'inverse du fait.
- **REJETÉ (hors mon terrain, sans veto) — élargir la portée aux `fins` (Q4).** Motif de découpage : cause distincte (KR-164) donc entrée de registre distincte, sans témoin positif réel. Cela ferait du lot deux règles au lieu d'une.

## 10. Vérification de mon propre veto — aucun déclencheur

Isolation des features : zéro fichier de feature touché. Contrat `brain/` contourné : non. Source de vérité dupliquée : non — la table t=0 et `ETABLISSEMENT` répondent à **deux questions différentes** (c'en serait une si `possede_objet` à t=0 relisait `objetsDonnes`, et c'est précisément ce qu'il ne fait pas). Dépendance croisée : `ouverture.ts` → `atteignabilite.ts` n'existe pas. Détail d'implémentation à distance : non.

**Mon biais, surveillé** : aucune abstraction posée pour un deuxième appelant hypothétique. Aucune interface commune n'est extraite entre `FeuilleInaccomplissable` et `FeuilleVraieAuTourZero`.

## 11. Affirmations NON MESURÉES de cette note

1. `expr.test.ts:404` et `:416` rougissent à l'arrivée d'un troisième lecteur — **lecture d'assertion**, à rejouer **avant** réécriture.
2. La ligne de base ne bouge que sur `dossier-reference.json` (11 → 12) et `jouable` ne change sur aucun des trois — **déduction**.
3. Le comportement attendu sur les trois mesures (A tire, B silence, C silence) — **déduction**, à prouver par trois témoins distincts, **et** le témoin de Mesure C doit être écrit **en `echoue_si_expr`**, pas seulement constaté sur la fin de `dossier-minimal.json`.
