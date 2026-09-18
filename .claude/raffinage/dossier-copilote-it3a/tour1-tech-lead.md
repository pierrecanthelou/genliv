# Tour 1 — `tech-lead` · `dossier-copilote` it3a

> Convention de preuve : **LU** = constaté à la lecture. **Aucun outil d'exécution dans cette session — aucune affirmation n'est marquée MESURÉ.**

**RISQUE** — Le point de rupture n'est pas la sortie, c'est le **DISPATCH**. `CopiloteService.ts:321` aiguille sur `'champ' in cible`. Une troisième cible qui porte `champ` — ou seulement `entiteId` — part dans `demanderProse` et se fait valider par `validerSortie` : rôle annoncé A, validateur exécuté B, `tsc` vert, `jest` vert. **Les surcharges ferment l'APPEL, jamais le CORPS.** C'est le seul endroit de l'it2 qui ne tient pas à trois.

**OBJECTION** — Les trois champs candidats ne sont pas une tranche. `parler[]` est une **LISTE** (accepter k ⇒ écrire k, par AJOUT) ; `jamais` et `cede_si` sont des **SCALAIRES** (accepter deux fois ⇒ la 2ᵉ ÉCRASE la 1ʳᵉ). Une même proposition porterait deux sémantiques d'écriture — état illégal représentable. Les loger dans `CHAMPS_PROPOSABLES` est impossible : sa valeur est une clé de propriété de **premier niveau** de `Personnage`, or `jamais` vit sous `caractere`. Et leur libellé exigerait une 5ᵉ entrée de `LIBELLE_DES_CHAMPS` alors que `BlocCaractere.tsx:169` porte `label="RÉPLIQUE"`, fichier interdit : **troisième occurrence de TL-8, je pose le veto**.

**PROPOSITION** — 3a ne prend **que** `parler[]`. Rôle `'personnage-voix'`, cible `CibleVoix { personnageId }` — structurellement disjointe des deux autres, dispatch à trois branches sans un `as`. Troisième validateur `validerVoix` ; non-vacuité **à deux niveaux** ; scanner **par élément**, refus **par lot**. **Deux lots**, frontière = préfixe de chemin.

**VERDICT** — **recevable sous réserve** : (1) veto TL3a-3 tenu ; (2) `frontiere.test.ts:384` généralisé **avant** toute mesure de budget ; (3) canari croisé étendu aux trois paires.

---

# ANNEXE

## A.1 Un troisième validateur nommé

| | `validerSortie` | `validerDetenteurs` | `validerVoix` (neuf) |
|---|---|---|---|
| forme rendue | scalaire | collection | collection |
| prédicats de prose (vide/marqueur/identifiant) | 3, sur **une** chaîne | **0** (jetons) | 3, sur **chacun** des N |
| prédicats de liste (tableau/distincts/borne) | 0 | 3 | 3 |
| appartenance à un ensemble fermé | non | oui | **non** — prose libre |

**Le critère décidable qui empêche la troisième duplication de devenir le registre générique rejeté deux fois** :
> Un `Record<RoleCopilote, …>` n'est légitime que si **chaque** rôle a une entrée **qui veut dire quelque chose**. Vrai pour `CHAMPS_INJECTES`, `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`, `GABARIT_SORTIE`. **Faux** pour `CLES_SORTIE*` et toute borne de liste : le rôle prose n'a pas de liste, son entrée serait un mensonge.

Ce qui est partagé se sort en **primitive** (précédent `textesDuChemin`/`estRedige`). Au **troisième** appelant, les prédicats (1)+(2) méritent `enveloppeConforme(brut, cles)`. **Sous réserve** : les témoins de `validerSortie` rejoués **verts sans retouche** ; s'ils bougent, on renonce — six lignes ne valent pas une régression sur la fonction la plus gardée.

## A.2 Scanner **par ÉLÉMENT**, refus **par LOT**

Le témoin doit placer l'élément fautif à l'index **≥ 1** (tue le mutant « ne scanner que `[0]` »). **La non-vacuité REVIENT, à deux niveaux.** L'axe n'est pas *scalaire vs liste* — c'est **DÉSIGNATION vs RÉDACTION** : it2, « personne » est une réponse honnête ; it3a, on demande d'**écrire**, « je n'écris rien » est une **non-réponse**, exactement le cas de l'it1.

## A.3 La surcharge tient ; le dispatch ne tient pas

**Ce qui tient (LU)** : une 3ᵉ surcharge **n'ajoute aucun membre**. **Correction d'un chiffre de l'it2** : les bouchons sont **QUATRE**, pas trois — `panneauCopilote.test.tsx:60`, `acceptation.test.tsx:60`, `detenteurs.test.tsx:67`, `useDemandeCopilote.test.tsx:25`. TL-15 en sort renforcé.

**Ce qui ne tient pas (LU, `CopiloteService.ts:315-323`)** : le rétrécissement n'est total que si les trois cibles sont **disjointes deux à deux** :
```
{ entiteId, champ } → CibleCopilote · { indiceId } → CibleIndice · { personnageId } → CibleVoix
```
`CibleVoix { entiteId }` **ne suffit pas** : une *variable* `CibleCopilote` s'y assigne sans erreur (le contrôle d'excédent ne vaut que sur un littéral). **À MESURER au lot 1** (`tsc` + un `@ts-expect-error` par couple illégal).

Conséquence : `hooks/useDemandeCopilote.ts` est **générique sur `<C, P>`** et ne connaît ni rôle ni `useBrain` (LU) — **rouvert par personne**. Un diff y est le signal d'une frontière franchie.

## A.4 Le canari croisé à trois entrées

`croiser` (`frontiere.test.ts:107-110`) est une **rotation de 1**, dérangement pour tout n ≥ 2 : à trois rôles le test **reste vert**. Il ne ment pas — il ne prouve plus ce qu'il prétend : à deux rôles « tout est décalé » ET « deux sont intervertis » sont le **même** événement ; à trois ils divergent, et le défaut réaliste (deux lignes interverties en éditant) n'est **plus l'objet du canari**.

```ts
const PAIRES = ROLES.flatMap((a, i) => ROLES.slice(i + 1).map((b) => [a, b] as const))
function transposer(g: Map<string,string>, a: string, b: string) {
	return new Map(g).set(a, String(g.get(b))).set(b, String(g.get(a)))
}
it('la cardinalite des paires est DANS le predicat', () => {
	expect(PAIRES).toHaveLength((ROLES.length * (ROLES.length - 1)) / 2)
})
it.each(PAIRES)('canari croise sur la paire %s / %s', (a, b) => {
	const transpose = transposer(extraire(PORTEUR_BRAIN), a, b)
	expect(memesGabarits(extraire(PORTEUR_WORKER), transpose, ROLES)).toBe(false)
	// Les DEUX transposés tombent, les AUTRES restent debout : sans cette moitié,
	// un prédicat inerte serait pris pour un prédicat séparateur.
	expect(ROLES.filter((r) => inviteNommeSonGabarit(r, transpose)))
		.toEqual(ROLES.filter((r) => r !== a && r !== b))
})
```
**À MESURER** : chacune des trois transpositions **vue rouge**.

**Piège supplémentaire, LU, sur l'expression d'extraction** : `ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm` balaie **le fichier entier**. Ce qui l'empêche d'avaler `BASE_CORS` (`worker/index.ts:76`, même forme) est **uniquement** la classe `[a-z-]+`. Donc : (1) le nom du 3ᵉ rôle doit être **en minuscules-tirets** ; (2) **aucune** ligne `'clé-minuscule': 'valeur',` à une tabulation ne doit apparaître ailleurs dans `schemaSortie.ts` ni `worker/index.ts`.

## A.5 Le budget — et **la mine à désamorcer avant la mesure**

Lot 1, protocole it1/it2 : composer l'entité, **asserter d'abord** que les onze chemins résolvent non vides, puis `budget = ceil(M × 3/1000) × 1000`. `K` sans objet. Puis `E` ⇒ `TAILLE_MAX_CORPS_IA` **re-dérivé**.

**⚠ `frontiere.test.ts:384`** :
```ts
expect(new Set(ROLES.map((role) => BUDGETS[role])).size).toBe(ROLES.length)  // LU
```
Écrit pour DEUX rôles, il force **tous** les budgets distincts deux à deux. `personnage-voix` injecte **onze des douze** chemins du rôle prose : son budget vaudra selon toute vraisemblance **6000 — exactement celui du rôle prose** — et la ligne passera au rouge. **La seule façon de la reverdir serait de truquer une mesure**, c'est-à-dire le mode de panne que tout le dispositif existe pour empêcher. Sur-contrainte : l'intention est « le plus large *désigne* quelqu'un ».
```ts
// APRÈS — le vrai discriminant
expect(ROLES.filter((r) => BUDGETS[r] === BUDGETS[ROLE_LE_PLUS_LARGE])).toEqual([ROLE_LE_PLUS_LARGE])
```
Cas négatif obligatoire : fabriquer une égalité au sommet, **voir rouge**.

## A.6 Les curseurs — avis d'architecte : **il n'existe pas de version « petite »**

`CHAMPS_PROPOSABLES` **ne peut pas les héberger**. LU : `as const satisfies Record<string, ChampProseCle>` où les valeurs sont des clés de propriété **de premier niveau**, site d'écriture `{...p, [cle]: texte}`. Six entiers sous `caractere.curseurs` ne sont ni une chaîne, ni une clé de premier niveau. **Lecture honnête : `CHAMPS_PROPOSABLES` est une allow-list de feuilles de prose de premier niveau ; elle est à son plafond naturel à trois entrées.**

Si *oui* : troisième forme de proposition (`Record<CurseurId, number>`), quatrième validateur avec prédicat de **TOTALITÉ**, anatomie d'acceptation **EN BLOC** — jamais « une par une », donc famille de risque différente. **C'est une itération entière.** Si *non*, 3d disparaît. **Le comité tranche avec ce prix sur la table.**

## A.7 `cede_si` — le contexte n'a rien à faire

LU, `contexte.ts:35-48` : `CHAMPS_INJECTES['personnage-prose']` porte `parler[]` et `jamais`, **pas** `cede_si`. Un champ peut être une **CIBLE** sans jamais entrer dans un **contexte** ; le prédicat n'a **pas besoin d'être étendu**. Garde à poser : un test assertant `cede_si` **absent de chaque entrée** de `CHAMPS_INJECTES`.

## B — Signatures littérales

> Le nom de rôle et la clé de fil sont ma **proposition**, l'arbitrage revenant à `narratif-ia`. Deux contraintes non négociables : le rôle satisfait `[a-z-]+`, et **la clé de fil ne doit pas être à une lettre de `valeur`** — `valeurs`/`valeur` se lisent l'un pour l'autre en revue.

```ts
// types.ts
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-voix'
export interface VoixRendue { voix: readonly string[] }                    // FRANCHIT
export interface PropositionVoix { personnageId: string; repliques: readonly string[] }  // JAMAIS

// schemaSortie.ts
export const CLES_SORTIE_VOIX = ['voix'] as const
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
	'personnage-voix': '{"voix": ["…", "…"]}',
}
export function validerVoix(brut: unknown, dossier: Dossier):
	({ ok: true } & VoixRendue) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
```
Prédicats : (1) objet simple · (2) clés = exactement `CLES_SORTIE_VOIX` · (3) tableau · (4) chaque élément une chaîne · (5) longueur ≤ **`PARLER_REPLIQUES` importée** — refus jamais troncature · (6) distincts · (7) **liste non vide** → `vide` · (8) chaque élément non vide après trim → `vide` · (9) `MARQUEUR_A_ECRIRE` → `marqueur` · (10) identifiant → `identifiant`. **`'rang-inconnu'` SANS OBJET** — l'écrire serait du code mort présenté comme de la couverture (BUG-084).

```ts
// CopiloteService.ts
export interface CibleVoix { personnageId: string }   // JAMAIS entiteId — voir TL3a-5
export type ReponseVoix = { statut: 'propose'; proposition: PropositionVoix } | EchecCopilote
demander(role: 'personnage-voix', dossier: Dossier, cible: CibleVoix, signal?: AbortSignal): Promise<ReponseVoix>
```
`EchecCopilote`, `MotifRefusContexte`, `MotifIllisible`, `jusquAuRejeuUnique`, `unAller` : **INCHANGÉS**. `ContexteProse` **réutilisé tel quel** — alias de type, le renommer rouvrirait la signature de l'it1 (dette nommée, rang de `CibleCopilote`).

`assemblerVoix` — **troisième fonction nommée**, zéro branche de rôle, primitives partagées. Refus dans l'ordre figé : `a-ecrire` (`canon.ton`) → **`cible-a-ecrire`** (motif RÉUTILISÉ, sans charge — le personnage n'a **pas une seule** ligne d'identité rédigée ; **c'est ici que la garde « identité du personnage » des `open_questions` trouve sa condition d'ouverture**, le prédicat de vacuité existant désormais via `estRedige`) → `trop-long`.

## C — Découpage : **DEUX lots**, frontière = préfixe de chemin

**Lot 1 `troisieme-role` · `contrat` · `dev-contrat`, seul et en premier** — 11 fichiers : `copilote/{types,schemaSortie,schemaSortie.test,contexte,contexte.test}.ts` · `CopiloteService{,.test}.ts` · `brain/index.ts` · `worker/{index,index.test,frontiere.test}.ts`. Ordre interne imposé, `frontiere.test.ts` **la mine l. 384 d'abord, le canari des paires ensuite**, `brain/index.ts` en dernier. **`PARLER_REPLIQUES` est DÉJÀ exporté** (`brain/index.ts:272`) — zéro ligne pour lui.

**Lot 2 `carte-voix` · feature · `dev-lot`, contrat figé** — 7 fichiers : `components/CarteVoixPersonnage.tsx` (N) · `components/LigneValeurProposee.tsx` (N) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R) · `textes.ts` (R) · `tests/voix.test.tsx` (N) · `tests/panneauCopilote.test.tsx` (R, **pour le 3ᵉ bouton Lancer seulement** — si son diff finit vide tant mieux, mais il doit appartenir à **un** lot).

**HORS de tout lot** : `useDemandeCopilote.ts` · `LigneProposition.tsx` · `LigneDetenteur.tsx` · `CarteCompleterFiche.tsx` · `CarteTisserIndices.tsx` · `CarteAssistant.tsx` · `BarreLancer.tsx` · `tests/{acceptation,detenteurs,useDemandeCopilote,cablage}` · `index.ts` · `App.tsx` · `libelles{,.test}.ts` · `curseurs.ts` · `controles.ts` · `Select.tsx` · `dossier-reference.json` · `lintIsolation.test.ts` · **tout `dossier-canon`/`dossier-fiches`/`dossier-registres`** · `specification.json`.

**Pas de 3ᵉ lot** : `frontiere.test.ts` importe des **deux** côtés (TL-12) ; un lot « extraction » nommerait `PanneauCopilote.tsx` deux fois (TL-11).

## D — Ce que le lot 1 doit MESURER

1. `M` après assertion que les 11 chemins résolvent non vides ⇒ budget. **Jamais livrer le `0`.**
2. `E` ⇒ `TAILLE_MAX_CORPS_IA` re-dérivé sur **trois** rôles.
3. `max_tokens` **dérivé**, jamais recopié de 200 ni 100.
4. Le pouvoir séparateur du canari croisé **sur chacune des trois paires** — vu rouge.
5. Le pouvoir séparateur de « le maximum est atteint par exactement un rôle » — égalité fabriquée, vue rouge.
6. Que la 3ᵉ surcharge **ne casse aucun des quatre bouchons** : `tsc` sur le lot 1 **seul**.
7. `@ts-expect-error` rouge sur **chaque** couple (rôle, cible) illégal.
8. Le prédicat par élément attrape un fautif à l'index **≥ 1** (mutant « ne scanner que `[0]` » vu rouge).
9. `libelles`, `couverture`, `controles`, `curseurs`, `validate` : **verts sans une retouche**.

**Au lot 2** : le **remontage du panneau à la navigation** — dette ouverte depuis l'it2, jamais mesurée. **`BUG-106` exhibé une 3ᵉ fois** : la nouvelle carte a un `Select` **et** une désactivation qui peut s'allumer au milieu d'une séance. Correction dans `Select.tsx`, **primitive partagée** — hors périmètre, nommé, non corrigé.

## E — `REJETÉ` — à recopier tels quels au § 8

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| **TL3a-1** | Une seule tranche pour `parler[]`, `jamais`, `cede_si` | **REJETÉ** | `parler[]` est une LISTE (accepter k écrit k, par AJOUT) ; les deux autres sont des SCALAIRES (la 2ᵉ acceptation ÉCRASE la 1ʳᵉ). Une même proposition porterait DEUX sémantiques d'écriture — état illégal représentable — et « accepter une par une » n'aurait pas le même sens des deux côtés. |
| **TL3a-2** | Loger `jamais` ou les curseurs dans `CHAMPS_PROPOSABLES` | **REJETÉ** | LU : la VALEUR du registre est une clé de propriété de PREMIER NIVEAU, site d'écriture `{...p, [cle]: texte}`. `jamais` vit sous `caractere`, les curseurs sous `caractere.curseurs` et ne sont pas des chaînes. Les y mettre ferait mentir le registre sur son propre site d'écriture. Le registre est à son **plafond naturel à trois entrées**. |
| **TL3a-3** | Une 5ᵉ entrée dans `LIBELLE_DES_CHAMPS` | **VETO** | LU : `libelles.test.ts:131-140` asserte qu'aucun fichier de `src/` ne retape un libellé en `label="…"`, et `BlocCaractere.tsx:169` porte `label="RÉPLIQUE"` — **fichier interdit**. Troisième occurrence. **COROLLAIRE DE MÊME RANG, QUE LE TÉMOIN NE VOIT PAS** : le composant neuf ne porte pas non plus `label="RÉPLIQUE"` — second domicile d'un libellé que `BlocCaractere.tsx` possède, et `libelles.test.ts` ne le verrait pas, le mot n'étant pas dans le registre. **Seul le plan garde ce cas-là.** |
| **TL3a-4** | Réutiliser `CibleCopilote` en élargissant `ChampProseChemin` | **REJETÉ** | Le dispatch est un rétrécissement STRUCTUREL sur `'champ' in cible` : une 3ᵉ cible portant `champ` partirait dans la branche PROSE et serait validée par `validerSortie`. Rôle annoncé A, validateur exécuté B, `tsc` vert. |
| **TL3a-5** | `CibleVoix { entiteId }` | **REJETÉ** | `entiteId` est commun à `CibleCopilote` : une VARIABLE de ce type s'y assigne sans erreur (contrôle d'excédent limité aux littéraux) — le mauvais aiguillage revient par une autre porte. Les trois cibles disjointes deux à deux. |
| **TL3a-6** | Un registre générique de schémas/bornes par rôle | **REJETÉ, 3ᵉ fois** | Critère décidable : un `Record<RoleCopilote, …>` n'est légitime que si CHAQUE rôle a une entrée QUI VEUT DIRE QUELQUE CHOSE. FAUX pour les clés de sortie et toute borne de liste — le rôle prose n'a pas de liste, son entrée serait un mensonge. |
| **TL3a-7** | Un 4ᵉ littéral `VOIX_MAX = 2` | **REJETÉ** | `PARLER_REPLIQUES` (DÉJÀ ré-exportée, `brain/index.ts:272`) est l'unique autorité, et c'est elle que l'éditeur manuel lit pour retirer son bouton « + ». Un second littéral serait le registre à deux domiciles dénoncé à l'it2. |
| **TL3a-8** | Réutiliser `validerSortie` ou `validerDetenteurs` | **REJETÉ** | L'un rend un SCALAIRE et applique 3 prédicats de prose à UNE chaîne ; l'autre n'en porte AUCUN (jetons — le scanner y serait vert par construction, BUG-084). Le rôle 3 applique les 3 prédicats à CHACUN des N, plus 3 de liste. Ce qui est partagé se sort en PRIMITIVE, jamais en corps paramétré. |
| **TL3a-9** | Transporter « la liste vide est un SUCCÈS » | **REJETÉ** | L'axe est DÉSIGNATION vs RÉDACTION. À l'it2 « personne » est honnête. Ici on demande d'ÉCRIRE : « je n'écris rien » est une NON-RÉPONSE — le cas de l'it1. La non-vacuité revient à DEUX niveaux. |
| **TL3a-10** | Écarter les éléments fautifs, garder les autres | **REJETÉ** | Réparation silencieuse, identique à TL-6 : l'auteur ratifierait une liste amputée sans le savoir. Prédicats PAR ÉLÉMENT, refus PAR LOT. |
| **TL3a-11** | Un 3ᵉ lot `worker/` seul | **REJETÉ** | `frontiere.test.ts` importe des DEUX côtés : c'est sa raison d'être. |
| **TL3a-12** | Extraire dès 3a une `BarreDecision` partagée | **REJETÉ pour 3a** | Rouvrirait DEUX fichiers livrés et intacts — le n° 22 de l'it2 refusait d'en rouvrir UN pour deux objets de style. CONDITION D'OUVERTURE : la première itération qui rouvre déjà l'un d'eux, ou une 4ᵉ occurrence. COMPENSATION OBLIGATOIRE : le contrat de design NOMME les jetons exacts. |
| **TL3a-13** | Un segment « RÉPLIQUES » au `SegmentedControl` de la carte 1 | **REJETÉ** | La carte 1 porterait DEUX rôles, DEUX formes de proposition, DEUX recettes d'écriture. Et c'est mécaniquement fermé : `OPTIONS_CHAMP` est dérivé de `CHAMPS_PROPOSABLES` (TL3a-2) et son libellé lu de `LIBELLE_DES_CHAMPS` (TL3a-3). |
| **TL3a-14** | Mettre `cede_si` dans `CHAMPS_INJECTES` « puisqu'il est `ia` » | **REJETÉ** | Prédicat conditionné par RÔLE, écrit à ses deux sites : acteur DU PORTEUR, jamais narrateur, autre personnage ou arbitre — un rôle de RÉDACTION n'est aucun des trois. PROPOSER n'est pas INJECTER. GARDE À ÉCRIRE : test assertant `cede_si` absent de CHAQUE entrée. |
| **TL3a-15** | Plafonner l'acceptation à `PARLER_REPLIQUES − déjà écrites` | **REJETÉ** | LU : `validate.test.ts:941` prouve que le SSOT n'a AUCUNE règle de cardinalité, et `dossier-fiches/tests/caractere.test.tsx:221` qu'un document à `PARLER_REPLIQUES + 1` se rend INTÉGRALEMENT. Le dépassement n'est pas un état illégal : c'est un état que le produit rend déjà. Un plafond à l'acceptation inventerait un TROISIÈME état de ligne pour rien. RETENU : « Lancer » désactivé quand `parler.length >= PARLER_REPLIQUES`, `title` nommé. |
| **TL3a-16** | Faire entrer les curseurs dans `CHAMPS_PROPOSABLES` si le comité dit oui | **REJETÉ À LA FORME, quelle que soit la réponse de fond** | Voir TL3a-2. Un bloc TOTAL de six entiers est une 3ᵉ forme de proposition, un 4ᵉ validateur avec prédicat de TOTALITÉ, une anatomie d'acceptation EN BLOC — famille de risque distincte. **Il n'existe pas de version « petite »** : oui ⇒ l'itération 3d entière ; non ⇒ 3d disparaît. |
| **TL3a-17** | Laisser `frontiere.test.ts:384` en l'état | **REJETÉ** | LU : la ligne force TOUS les budgets distincts deux à deux. `personnage-voix` injecte onze des douze chemins du rôle prose ; son budget retombera probablement sur 6000 et la ligne passera au ROUGE — et **la seule façon de la reverdir serait de TRUQUER UNE MESURE**, le mode de panne que tout le dispositif existe pour empêcher. Sur-contrainte : l'intention est « le plus large DÉSIGNE quelqu'un ». Remplacement : le maximum atteint par EXACTEMENT UN rôle, avec son cas négatif. |
| **TL3a-18** | Le canari croisé de l'it2 suffit à trois rôles | **REJETÉ** | LU : `croiser` est une ROTATION de 1, dérangement pour tout n ≥ 2 — le test reste VERT à trois rôles mais ne prouve plus ce qu'il prétend. À deux rôles « tout est décalé » et « deux sont intervertis » sont le MÊME événement ; à trois ils divergent. À écrire : les `n(n−1)/2` TRANSPOSITIONS, dérivées, cardinalité DANS le prédicat, chacune vue rouge. La rotation est conservée comme canari de dérangement total. |

## F — Innovation

**Aucune de mon poste.** Les quatre décisions structurantes s'appuient toutes sur un précédent déjà livré.
