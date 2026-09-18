# Tour 2 — `tech-lead` · `dossier-copilote` it3a

> **LU** = constaté à la lecture. Aucun outil d'exécution dans cette session : **rien n'est marqué MESURÉ**, et les treize points du § E restent à mesurer au lot 1.

**RISQUE** — La ligne qui casse n'est pas la sortie, c'est le **dernier `return` du dispatch**. `CopiloteService.ts:322` est un **repli**, pas une branche : `return demanderDetenteurs(dossier, cible, signal)`. Une troisième cible y tombe **par défaut**. `tsc` ne l'attrape que si les trois cibles sont **disjointes deux à deux** — toute la charge de TL3a-5, et c'est pourquoi il passe veto.

**OBJECTION — à `narratif-ia`, nommément, sur C4.** Oui : on **peut** borner le validateur par `PARLER_REPLIQUES` sans que l'invite la nomme. On ne **doit** pas, et **mon motif de tour 1 était faux dans sa prémisse** : « registre à deux domiciles » exige que les deux littéraux désignent la **même grandeur**. Ils n'en désignent pas la même — 2 borne le **document**, 3 borne la **réponse**. Borner à 2 pendant que l'invite demande trois, c'est refuser `schema` une réponse **conforme**, rejouer une fois, finir `illisible` — **et rien ne rougit**. **TL3a-7 RETIRÉ**, ton arbitrage est le bon.

**PROPOSITION** — `REPLIQUES_PROPOSEES_MAX = 3` adopté, avec la **règle des deux domiciles écrite aux deux sites** et **deux témoins de comportement** : 4 éléments refusés / 3 acceptés au contrat ; accepter désactivé à `PARLER_REPLIQUES` **importée** à l'écran. **Aucun test n'asserte que les deux constantes diffèrent** — il rougirait sur un changement légitime de l'une.

**VERDICT** — **recevable sous réserve**. Deux vetos tenus (**TL3a-3**, **TL3a-5**), **deux lots**, frontière par préfixe de chemin.

---

# ANNEXE

## A.1 — C4 : je concède, avec un motif que ni l'un ni l'autre n'avions posé

La question « peut-on borner le validateur à 2 sans que l'invite dise 2 ? » a une réponse mécanique : **oui techniquement, et c'est précisément le piège**. Un validateur à 2 + une invite à 3 produit un refus `schema` **systématique sur les réponses conformes**, donc `illisible` après rejeu. **Aucun test du plan ne demanderait 3 éléments à un validateur borné à 2** : le défaut part vert dans l'essaim. La seule réparation serait d'écrire « deux au plus » dans l'invite — ton veto.

**Contrepartie que je pose** (mon domaine — un ouvrier « harmonisera » deux nombres voisins) :

| | `PARLER_REPLIQUES = 2` | `REPLIQUES_PROPOSEES_MAX = 3` |
|---|---|---|
| borne | ce que le **document** porte | la cardinalité de la **réponse** |
| domicile | `brain/dossier/curseurs.ts:151` (déjà exporté) | `brain/copilote/schemaSortie.ts` (neuf) |
| site | **acceptation**, côté feature | **validateur** + dérivation de `max_tokens` |
| interdit | `schemaSortie.ts` ne l'importe **jamais** | le code d'acceptation ne l'importe **jamais** |

Les deux nombres sont épinglés **par comportement**. Pas de `expect(X).toBe(3)` isolé, pas de test d'inégalité entre les deux constantes.

## A.2 — C3 : nom et clé confirmés, forme résolue contestée

- **`'personnage-repliques'`** : **confirmé**, ton arbitrage. Satisfait `[a-z-]+`, seule contrainte que je tiens (LU : le balayage porte sur le **fichier entier**, et c'est cette classe seule qui l'empêche d'avaler `BASE_CORS`).
- **Clé `repliques`** : **confirmée**, pas à une lettre de `valeur`.
- **`PropositionRepliques { entiteId, textes }` → je conteste, et c'est mon domaine.** TL3a-5 porte sur la **cible**, pas sur la proposition — sur elle, `entiteId` ne casse rien **structurellement**. Ce qui tranche est un motif de cohérence à **deux précédents livrés** : le champ de la proposition **reflète** celui de la cible (`CibleCopilote.entiteId` → `PropositionResolue.entiteId` ; `CibleIndice.indiceId` → `PropositionDetenteurs.indiceId`). Avec `entiteId`, la re-résolution s'écrirait `{ entiteId: cible.personnageId, … }` — **un renommage en vol**, à l'endroit exact où l'it1 a écrit que ces champs viennent de l'état d'écran et de nulle part ailleurs. **Retenu : `PropositionRepliques { personnageId, textes }`.** Zéro clé commune avec `RepliquesRendues` — ta doctrine KR-231 préservée, ta signature reprise mot pour mot.

## A.3 — C5 : je concède, et **mon budget attendu change**

Ton motif (asymétrie du regret ; une réplique qui paraphrase le synopsis MJ finit dans la bouche du rôle acteur au Temps 2) est plus fort que ma symétrie. **10 chemins.**

**Et mon attente change dans le sens qui rend TL3a-17 plus urgent, pas moins.** À 11 chemins j'attendais 6000, donc collision certaine et ligne 384 **rouge**. À 10 chemins : l'it1 a mesuré M = 1783 ; pour passer sous 6000 il suffit de **117 caractères de moins**, et un synopsis MJ en pèse davantage. **Attente révisée : 5000 voire moins ; collision improbable.**

*(Corollaire LU : `TAILLE_MAX_CORPS_IA` n'a selon toute vraisemblance pas à bouger — `ROLE_LE_PLUS_LARGE` reste `indice-detenteurs`. À **constater** au lot 1 : « inchangé » est une mesure comme une autre.)*

## A.4 — C1 : à `ux-designer`, nommément

Je ne conteste ni ton texte ni ton absence de `⊘` : je constate que **l'état n'a plus de producteur**. Si le validateur refuse la liste vide, le service rejoue une fois puis rend `illisible` — l'écran est dans la branche `echec`. **La ligne « succès, liste vide » est inatteignable**, et `TEXTE_AUCUNE_REPLIQUE_PROPOSEE` serait une constante à **zéro appelant** (KR-109), du code mort présenté comme de la couverture. Ce n'est pas une objection esthétique et pas un veto : c'est une **incohérence entre ton lot et le lot contrat**, et les deux ouvriers de l'essaim ne peuvent pas se parler pour la trouver.

## A.5 — C6 : mon motif mécanique tombe, j'en pose un mesuré

**Non, mon motif ne tient pas** : rien n'oblige une 4ᵉ option à dériver de `CHAMPS_PROPOSABLES`, et un littéral local ne touche aucun des deux registres. **TL3a-13 perd sa moitié mécanique.** Ce qui reste, LU, et qui n'est **pas** un veto :
1. `CarteCompleterFiche` appelle `useDemandeCopilote<…>` **une fois par appel** (l. 79). Servir deux rôles depuis une carte exige **deux instances**, donc deux machines à états, `enCours`/`Annuler` sur laquelle, et une correspondance `champChoisi ↔ machine affichée` tenue **à la main**. Le couple (`champChoisi = 'fonction'`, proposition de répliques affichée) devient représentable.
2. Coût **mesuré** de la 4ᵉ carte, à l'inverse : **une ligne** (`panneauCopilote.test.tsx:100`, `toHaveLength(2)` → `3`). C'est tout ce que j'ai trouvé.

**TL3a-13 MAINTENU comme OBJECTION, motif réécrit ; l'arbitrage appartient à l'UX et au PM. Le découpage est invariant au résultat.**

## A.6 — C7 : rien ne change à mon découpage

LU : `CarteTisserIndices.tsx:7` importe déjà `controlerDossier` depuis `brain/` ; `brain/copilote/` ne l'importe nulle part. Le ciblage vit à l'écran, **lot 2**, zéro ligne au lot contrat.

**Une garde à écrire, et c'est mon terrain** : `PROSE_PERSONNAGE_SANS_VOIX` est un `const` **de module, non exporté** (LU, `controles.ts:450`). Le lot 2 ne peut l'atteindre que par le constat rendu. **Recopier sa prose dans `textes.ts` serait un second domicile d'un texte que `brain/dossier/controles.ts` possède**, et aucun instrument ne le verrait. Donc : ou l'écran rend la prose du constat telle quelle, ou il écrit **sa propre** phrase — jamais la même chaîne aux deux endroits.

## A.7 — Au `qa`, nommément : le motif de l'élément vide

Tu demandes un motif **distinct** ; `narratif-ia` met les deux sur `'vide'`. Je tranche dans mon domaine et je vous donne raison à tous les deux **sans créer de membre** : **liste vide → `'vide'`** (non-réponse), **élément vide ou blancs → `'schema'`** (artefact de forme, au même rang qu'un élément non-chaîne). Les deux cas deviennent **séparables par un test**, `MotifIllisible` ne gagne **aucun** membre. C'est **le seul amendement** que j'apporte à la liste de prédicats de `narratif-ia` (son (7)).

Sur le canari : **ton balayage exhaustif est meilleur que mon `transposer`** — direct, générique à N, et il teste la propriété plutôt que le pouvoir séparateur d'un comparateur. **J'abandonne `transposer` et les `n(n−1)/2` paires** ; on garde la rotation comme canari de dérangement total. **Précondition que ta formule exige et que personne n'a écrite** : qu'aucun gabarit ne soit **sous-chaîne** d'un autre, sinon le filtre rougit sans défaut.

## B — Statut final des 18 `REJETÉ` — à recopier tels quels au § 8

| # | Désaccord | Statut | Motif / ce qui a bougé |
|---|---|---|---|
| **TL3a-1** | Une seule tranche pour les trois champs | **MAINTENU** | LISTE (accepter k écrit k) vs SCALAIRES (la 2ᵉ écrase la 1ʳᵉ) : deux sémantiques d'écriture. PM, UX, `narratif-ia` convergent. |
| **TL3a-2** | Loger `jamais`/curseurs dans `CHAMPS_PROPOSABLES` | **MAINTENU** | Valeurs = clés de propriété de **premier niveau**, site d'écriture `{...p, [cle]: texte}`. **Plafond naturel à trois entrées.** |
| **TL3a-3** | Une 5ᵉ entrée dans `LIBELLE_DES_CHAMPS` | **VETO — MAINTENU** | `libelles.test.ts:131-140` balaie tout `label="…"` de `src/` ; `BlocCaractere.tsx:169` porte `label="RÉPLIQUE"` — fichier **interdit**, 3ᵉ occurrence. **COROLLAIRE, CŒUR DU VETO, QUE LE TÉMOIN NE VOIT PAS** : le composant neuf ne porte pas non plus `label="RÉPLIQUE"` — second domicile invisible à `libelles.test.ts`, le mot n'étant pas dans le registre. **Seul le plan garde ce cas-là.** |
| **TL3a-4** | Réutiliser `CibleCopilote` élargie | **MAINTENU, renforcé** | **Fait neuf LU** : `CopiloteService.ts:322` n'est pas une branche mais un **repli** — la 3ᵉ cible y tombe par défaut si le dispatch n'est pas réécrit à trois tests explicites. |
| **TL3a-5** | `CibleRepliques { entiteId }` | **DURCI EN VETO** | `entiteId` est commun à `CibleCopilote` : une **variable** s'y assigne sans erreur (contrôle d'excédent limité aux littéraux), le rétrécissement redevient faux, rôle A / validateur B, `tsc` vert. **Trois cibles disjointes deux à deux.** Le veto porte sur la **cible seule**. |
| **TL3a-6** | Registre générique de schémas/bornes | **MAINTENU (3ᵉ fois)** | Un `Record<RoleCopilote, …>` n'est légitime que si **chaque** rôle a une entrée qui **veut dire quelque chose**. Faux pour les clés de sortie et toute borne de liste. |
| **TL3a-7** | Un 4ᵉ littéral de borne de sortie | **RETIRÉ** | Mon motif exigeait la **même grandeur**. Faux : 2 borne le document, 3 borne la réponse. Borner le validateur à 2 refuserait une réponse conforme **sans qu'aucun test ne rougisse**. |
| **TL3a-8** | Réutiliser un validateur existant | **MAINTENU** | L'un rend un scalaire (3 prédicats sur UNE chaîne), l'autre n'en porte aucun (jetons — vert par construction, BUG-084). Le rôle 3 applique 3 prédicats à CHACUN des N + 4 de liste. Partagé → **primitive**, jamais corps paramétré. |
| **TL3a-9** | « La liste vide est un SUCCÈS » | **MAINTENU** | DÉSIGNATION vs RÉDACTION. **Conséquence pour le lot 2** : l'état « succès, liste vide » devient **inatteignable** — la ligne et sa constante partent. |
| **TL3a-10** | Écarter les fautifs, garder les autres | **MAINTENU** | Réparation silencieuse (TL-6). Trouvé indépendamment par la QA — deux postes. |
| **TL3a-11** | Un 3ᵉ lot `worker/` seul | **MAINTENU** | `frontiere.test.ts` importe des **deux** côtés : c'est sa raison d'être. |
| **TL3a-12** | Extraire une `BarreDecision` partagée | **MAINTENU pour 3a** | Rouvrirait deux fichiers livrés et intacts. **Vérifié après C6** : même en branche « extension », aucun des deux n'est rouvert. Compensation : le contrat de design **nomme les jetons exacts** (fait). |
| **TL3a-13** | Un segment au `SegmentedControl` de la carte 1 | **MAINTENU comme OBJECTION, motif RÉÉCRIT — pas un veto** | La moitié mécanique **tombe**. Reste : `useDemandeCopilote` est instancié **une fois par appel**, donc deux rôles = deux machines à états et une correspondance tenue à la main. En face, la 4ᵉ carte coûte **une ligne**. **Arbitrage à l'UX et au PM.** |
| **TL3a-14** | `cede_si` dans `CHAMPS_INJECTES` | **MAINTENU** | Prédicat conditionné par RÔLE ; un rôle de RÉDACTION n'est aucun des trois. **PROPOSER n'est pas INJECTER.** Garde à écrire + amendement du prédicat **aux deux sites**. |
| **TL3a-15** | Plafonner l'acceptation | **RETIRÉ** | Mon refus visait un plafond **inventé**. Deux postes ont produit le **producteur réel** : accepter la ligne qui atteint le plafond **en cours de séance**. L'invariant retenu est celui de `narratif-ia` C5-1. **Ce que je maintiens** : le SSOT ne gagne **aucune** règle ; le plafond s'applique **au site d'écriture de la feature**, jamais dans `brain/dossier/`. |
| **TL3a-16** | Curseurs dans `CHAMPS_PROPOSABLES` | **RETIRÉ (sans objet)** | Le veto supprime 3d. **La forme reste vraie et se recopie comme condition d'ouverture** : 3ᵉ forme de proposition, 4ᵉ validateur avec prédicat de TOTALITÉ, acceptation EN BLOC — **pas de version « petite »**. Emporte : la variante `GROUPE` **non construite** (KR-109). |
| **TL3a-17** | Laisser `frontiere.test.ts:384` | **MAINTENU, motif CORRIGÉ** | **Mon motif de tour 1 (« elle passera au rouge ») devient probablement faux** après le retrait de `synopsis_mj`. **Le nouveau motif est pire** : la ligne sera verte **par accident de longueur de fixture**, donc personne ne la corrigera, et c'est **3b** qui paiera le 4ᵉ rôle sans marge. Sur-contrainte : l'intention est « le plus large **désigne** quelqu'un ». Remplacement + **cas négatif vu rouge**. |
| **TL3a-18** | Le canari de l'it2 suffit à trois | **MAINTENU ; instrument CONVERGÉ sur celui de la QA** | Rotation de 1 = dérangement pour tout n ≥ 2 : vert à trois rôles sans plus rien prouver. **J'abandonne mon `transposer`** au profit du balayage exhaustif ; la rotation reste comme canari de dérangement total. |

## C — Signatures littérales FINALES

```ts
// types.ts
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques'
export interface RepliquesRendues { repliques: readonly string[] }          // FRANCHIT
export interface PropositionRepliques { personnageId: string; textes: readonly string[] }  // JAMAIS
// CHAMPS_PROPOSABLES et ChampProseCle : INCHANGÉS, aucune entrée (TL3a-2).

// schemaSortie.ts
export const CLES_SORTIE_REPLIQUES = ['repliques'] as const
/** ⚠ CE N'EST PAS `PARLER_REPLIQUES` (= 2) et elle ne s'y aligne JAMAIS : celle-là
 *  borne ce que le DOCUMENT porte et s'applique à l'ACCEPTATION, côté feature.
 *  Deux grandeurs, deux sites. Les confondre forcerait l'invite à recopier une borne
 *  du document (règle dupliquée) OU ferait refuser `schema` une réponse conforme.
 *  CE FICHIER N'IMPORTE JAMAIS `PARLER_REPLIQUES`. */
export const REPLIQUES_PROPOSEES_MAX = 3
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
	'personnage-repliques': '{"repliques": ["…", "…"]}',
}
export function validerRepliques(brut: unknown, dossier: Dossier):
	({ ok: true } & RepliquesRendues) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
```

**Dix prédicats** : (1) objet simple → `schema` · (2) clés exactes → `schema` · (3) tableau → `schema` · (4) chaque élément une chaîne → `schema` · (5) longueur ≤ `REPLIQUES_PROPOSEES_MAX`, refus jamais troncature → `schema` · (6) longueur **≥ 1** → **`vide`** · (7) chaque élément non vide après `trim()` → **`schema`** *(seul amendement à `narratif-ia`)* · (8) distincts après `trim()` → `schema` · (9) `MARQUEUR_A_ECRIRE` importé → `marqueur` · (10) `porteUnIdentifiant` **réutilisée telle quelle** → `identifiant`.

Scanner **par élément**, **jamais** sur un `.join()` : un identifiant à cheval sur deux éléments joints serait un faux positif fabriqué par le scanner lui-même. Refus **du lot entier**, rejeu une fois, terminal.

```ts
// contexte.ts — DIX chemins
// canon.ton · canon.interdits_ton[] · canon.partage.accroche_joueur
// …fonction · …apparence · …description_joueur · …but.libelle · …but.pourquoi
// …caractere.jamais · …plan_actions[].action
// ⚠ PAS synopsis_mj (C5) · PAS caractere.parler[] (cible, par ABSENCE) · PAS cede_si · PAS curseurs
PARTIES_REQUISES['personnage-repliques'] = ['canon.ton']
BUDGET_CARACTERES_CONTEXTE['personnage-repliques'] = /* MESURÉ au lot 1 */
export function assemblerRepliques(dossier: Dossier, cible: CibleRepliques): ContexteProse
```
`ContexteProse` **réutilisé sans alias** — un `type ContexteRepliques = ContexteProse` serait une abstraction à un seul appelant ; le renommer rouvrirait la signature de l'it1 (dette nommée).

```ts
// CopiloteService.ts
export interface CibleRepliques { personnageId: string }   // JAMAIS entiteId — TL3a-5
export type ReponseRepliques = { statut: 'propose'; proposition: PropositionRepliques } | EchecCopilote

// LE DISPATCH — l'ancien dernier `return` était un REPLI, il devient une BRANCHE.
if ('champ' in cible) return demanderProse(dossier, cible, signal)
if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
return demanderRepliques(dossier, cible, signal)

// re-résolution, ligne exacte :
return { statut: 'propose', proposition: { personnageId: cible.personnageId, textes: issue.sortie } }
```
Route `/ia/personnage-repliques`. `EchecCopilote`, `MotifRefusContexte`, `jusquAuRejeuUnique`, `unAller` : **INCHANGÉS**.

`brain/index.ts` : ré-exporte `CibleRepliques`, `ReponseRepliques`, `PropositionRepliques`. **`REPLIQUES_PROPOSEES_MAX` non ré-exportée** — le lot 2 n'en a pas besoin. `RepliquesRendues` : **jamais**. `PARLER_REPLIQUES` : **déjà exportée**, zéro ligne.

## D — Découpage final : **deux lots**

**Lot 1 `troisieme-role` · `contrat` · seul et en premier — 11 fichiers** : `copilote/{types,schemaSortie,schemaSortie.test,contexte,contexte.test}.ts` · `CopiloteService{,.test}.ts` · `brain/index.ts` · `worker/{index,index.test,frontiere.test}.ts`. Ordre : `types` → `schemaSortie` → `contexte` → `CopiloteService` → `worker/index` → tests (**la mine l. 384 d'abord, le balayage exhaustif ensuite**) → `brain/index.ts` **en dernier**.

**Lot 2 `carte-repliques` · feature · contrat figé — 7 fichiers** : `components/CarteFaireParler.tsx` (N) · `components/LigneReplique.tsx` (N) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R) · `textes.ts` (R) · `tests/repliques.test.tsx` (N) · `tests/panneauCopilote.test.tsx` (R — **l. 100**, `toHaveLength(2)` → `3`).

*Nom de la carte* : `CarteFaireParler`, sur le motif des deux précédents — `CarteCompleterFiche`, `CarteTisserIndices` nomment le **geste de l'auteur**, jamais l'entité. Le **titre affiché** reste à l'UX.

**Le découpage est INVARIANT à C6** : en branche « extension », le delta reste **entièrement dans le lot 2** (ligne 1 devient `CarteCompleterFiche.tsx` (R), ligne 7 sort). LU : `acceptation.test.tsx` ne compte **aucune** option, donc a priori aucun diff. **Aucun 3ᵉ lot dans aucun des deux cas.**

**HORS de tout lot** : `useDemandeCopilote.ts` *(générique — un diff y est le signal d'une frontière franchie)* · `LigneProposition.tsx` · `LigneDetenteur.tsx` · `CarteCompleterFiche.tsx` *(sauf branche C6)* · `CarteTisserIndices.tsx` · `CarteAssistant.tsx` · `BarreLancer.tsx` · `tests/{acceptation,detenteurs,useDemandeCopilote,cablage}` · `index.ts` · `App.tsx` · `brain/dossier/{libelles,libelles.test,curseurs,controles,validate,tables}.ts` · `Select.tsx` · `dossier-reference.json` *(le refus `cible-a-ecrire` a **zéro instance** : il se compose en mémoire)* · `lintIsolation.test.ts` · **tout `dossier-canon`/`fiches`/`registres`** · `specification.json`.

## E — Ce que le lot 1 doit MESURER

1. `M`, **après assertion que les DIX chemins résolvent non vides** — sinon c'est un **plancher**. `budget = ceil(M×3/1000)×1000`. **Jamais livrer le `0`.** Si la mesure déplaît : **on retire un chemin, on ne monte jamais le budget.**
2. `TAILLE_MAX_CORPS_IA` **constaté** — attendu inchangé, et « inchangé » est une mesure.
3. `max_tokens` **dérivé**, jamais recopié de 400, 200 ni 100.
4. **Canari croisé, version QA** : pour chaque rôle `r`, `ROLES.filter(a => a !== r && INVITES[r].systeme.includes(gabarit(a)))` vaut `[]`. **Précondition à écrire d'abord** : aucun gabarit n'est sous-chaîne d'un autre. **Pouvoir séparateur vu rouge** — et **si la même fabrication fait rougir la précondition ET le filtre, le pouvoir séparateur de l'un n'est pas établi** : en fabriquer deux jeux distincts.
5. `frontiere.test.ts:384` remplacé, **cas négatif obligatoire** vu rouge.
6. La 3ᵉ surcharge ne casse **aucun des QUATRE bouchons** : `tsc` sur le lot 1 **seul**.
7. `@ts-expect-error` **rouge sur chaque couple illégal** — six couples.
8. Prédicat par élément : mutants « ne scanner que `[0]` » et « `.join()` avant de scanner » **vus rouges**. Les deux canaris de l'it1 rejoués sur un élément **non-0**.
9. **Repêchage partiel** écrit comme mutant et **vu rouge**.
10. Témoin de `REPLIQUES_PROPOSEES_MAX` : 4 refusés, **3 acceptés**.
11. Témoin de `PARLER_REPLIQUES` (lot 2) : accepter désactivé, `title` nommé.
12. `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `destinations` : **verts sans une retouche**.
13. Gardes : `cede_si` absent de **chaque** entrée de `CHAMPS_INJECTES` ; aucun chemin `caractere.curseurs.*` nulle part.

**Au lot 2** : le **remontage du panneau à la navigation**, jamais mesuré. **`BUG-106` exhibé une 3ᵉ fois** — correction dans `Select.tsx`, **primitive partagée : hors périmètre, nommé, non corrigé**. Parade inchangée : dernière décision = **rejet** dans le témoin.

## F — Innovation

**Aucune de mon poste.** Les quatre décisions structurantes s'appuient toutes sur un précédent livré.
