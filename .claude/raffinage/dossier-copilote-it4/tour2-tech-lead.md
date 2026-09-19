# Tour 2 — `tech-lead` · `dossier-copilote` it4

**R1 — JE CÈDE, ET SUR MA PROPRE DOCTRINE.** Des trois proses du registre, `description_joueur` est la seule dont le *hint* dit « lue par le joueur » — **et rien dans `destinations.ts` ne code ce lectorat** : les trois valent `'ia'`. **Aucun prédicat ne peut donc voir la fuite.** KR-229 dit que ce qui n'est pas testable se ferme **par la FORME**, jamais par une ligne d'invite : **le champ sort de la sortie. `narratif-ia` a raison contre moi.**

**Mon précédent `personnage-prose` : MAINTENU COMME FAIT, RETIRÉ COMME DÉFENSE.** `registres.ts:27-40` injecte bien `synopsis_mj` en écrivant `description_joueur` — **c'est ce qui rend sûr le renversement de la mesure 5, et je le maintiens à ce titre**. Ce que la différence change de décidable : là-bas **huit chemins de fiche** bornent la prose, **ici ZÉRO**. ⚠ **0 contre 8 est un discriminant, pas une pente.**

**Ce que coûte `but.libelle`, mesuré** : imbrication **~0** (3b a livré « une sous-entité que le code construit », et `{ libelle: string }` est assignable à `But`) · registre **4 → 6** · ⚠ **`BlocPlanActions.tsx` entre au lot 1** : `libelles.test.ts:131` **rougit** sur `label="CE QU'IL VEUT"` dès l'entrée posée — **frontière tenue par un test, pas par une convention**. **Gain net** : `texteRefusAEcrire` générique suffit, le littéral dédié d'`ux` disparaît.

**R2 — « cuttable » RETIRÉ.** Les acceptés vivent dans un **AUTRE panneau** : le doublon n'est pas *vu*, il est *rappelé*.

**VERDICT — RECEVABLE.** Deux lots, **18 + 9**.

---

## A — Réponses nominatives

**A1 · `qa` — l'espion : elle a raison, ma forme ne l'en dispense pas.** `FicheBrouillon` n'a **aucune fente `id`**, donc `tsc` interdit de ranger un identifiant *dans* le brouillon — **mais un `useMemo(() => fiches.map(() => frapperIdentifiant('pnj')), …)` À CÔTÉ compile parfaitement. Le mutant séparateur de `qa` SURVIT À LA FORME.**
**Fait mesuré qui rend l'espion NEUF** : aucun test de feature ne moque le baril aujourd'hui.
```ts
jest.mock('../../../brain', () => {
	const reel = jest.requireActual('../../../brain')
	return { ...reel, frapperIdentifiant: jest.fn(reel.frapperIdentifiant) }
})
```
⚠ **Le `jest.fn` DÉLÈGUE au vrai** — un `jest.fn(() => 'pnj.x')` rendrait « deux acceptations, deux identifiants distincts » **verte et vide**.
**Scénario séparateur** : (1) 3 fiches rendues ⇒ **`expect(spy).not.toHaveBeenCalled()` AVANT tout clic** — *la ligne que le précalcul fait rougir* · (2) refuser la 2 ⇒ **toujours 0** · (3) accepter la 1 ⇒ exactement 1 appel, argument `'pnj'` · (4) accepter la 3 ⇒ 2 appels, **2 identifiants distincts**. **Vit au lot 2, entièrement.**

**A2 · `narratif-ia` — 14 contre 11, c'est le même ensemble compté deux fois, sauf un.** Mappage complet établi. ⚠ **Le seul écart réel est son (9) « distincts sur le COUPLE » — JE L'ACCEPTE**, et il **amende mon rejet n° 8 sans le contredire**. ⇒ **15 à ma manière, 12 à la sienne.** ⚠ **Le nombre écrit au plan doit dire LEQUEL des deux comptes il donne**, sinon la revue comparera **deux grandeurs différentes**.

**A3 · mesure 5 — JE TRANCHE POUR CINQ CHEMINS, et je retire mon « sans dommage ».** Deux faits, aucun de courtoisie : (1) ⚠ **le doublon n'est pas VISIBLE** — les acceptés s'affichent dans `PanneauPersonnages`, pas dans la carte ; sans `nom`, l'auteur devrait comparer **deux proses de mémoire, entre deux panneaux**. *Ce n'est pas un coût visible, c'est un coût rappelé.* (2) **`DEJA_ECRITS_MAX` n'est pas une décoration** : sans borne nommée, le budget serait un **plancher**, pas une mesure. **Effet sur le découpage : aucun.**

**A4 · Propriété croisée — `PanneauCanon.tsx` ET `BlocPlanActions.tsx`.** ⚠ **La co-propriété est FORCÉE, pas choisie** : poser l'entrée sans repointer laisse `libelles.test.ts:131` **rouge** — **il n'existe aucun état vert intermédiaire entre les deux, ce qui INTERDIT d'en faire deux lots. C'est la définition même d'un lot contrat.** Isolation intacte. **Le lot 2 ne nomme aucun fichier de `brain/`, `dossier-canon` ni `dossier-fiches` — vérifié ligne à ligne.**

**A5 · `schemaSortie.ts` — MESURÉE, plus serrée que ma phrase du tour 1.** **638 lignes.** Blocs mesurés : `validerSortie` 68 · `validerDetenteurs` 92 · `validerRepliques` 85 · `validerIntention` 102 · `validerRelations` 68. **Projection : 638 + [90 ; 157] = [728 ; 795].**
⚠ **LE SEUIL DE 800 N'EST PAS DÉGAGÉ : 5 lignes de marge dans le pire cas.** Donc **mesure APRÈS LE CORPS, AVANT LES DOCSTRINGS** (*c'est la docstring qui fait basculer ce fichier-là*), et si > 800 la scission se fait **DANS LE LOT 1**, sous forme **pré-nommée** : `copilote/validateurs.ts` (les six validateurs), les registres restant dans `schemaSortie.ts`. ⚠ **Conséquence dite d'avance** : `validateurs.ts` atterrirait **~490 l. — signal KR-112 (400), pas bloqueur (800) : on s'arrête là.**

**A6 · Mesure NEUVE — `CopiloteService.ts` fait 574 lignes.** Le 6ᵉ rôle coûte **DEUX sites de surcharge** (`:185-189` interface, `:536-540` implémentation — *en oublier un rend l'appel impossible côté feature*), +2 `case`, + ~50 l. **Projection ~630.**
⇒ ⚠ **La condition auto-imposée « 6ᵉ rôle OU 600 lignes » est ÉCHUE DES DEUX CÔTÉS.** **Ma recommandation, au comité de la ratifier : DIFFÉRER.** *600 est un déclencheur maison, le bloqueur KR-112 est 800 ; mêler un refactor de service à la DERNIÈRE livraison d'une feature achète un risque contre zéro gain, et gonflerait un lot contrat déjà à 18 fichiers.* → `open_questions`, n° 10.

## B — Statut de chacune de mes positions

| Position | Statut |
|---|---|
| « Brouillon sans identité » tenu par `tsc` | **MAINTENU, DURCI** — *et je reconnais ce que `tsc` NE tient PAS* : le précalcul **à côté** compile (A1). |
| Clé React = LA POSITION | **MAINTENU.** |
| Le synopsis devient REQUIS, docstrings fausses le même jour | **MAINTENUE, CORRIGÉE EN CHIFFRE** — j'avais écrit « trois docstrings ». ⚠ **C'est FAUX : il y a SIX sites** (§ D). |
| Ne pas élargir `CHAMPS_PROPOSABLES` | **MAINTENUE** — non contestée. |
| **Champ 2 = `description_joueur`** | ⚠ **RETIRÉE — c'est R1.** |
| Clé `figures`, champ 1 `charge` | **RETIRÉES au profit de `distribution`/`place`** — *sans enthousiasme et sans coût : un seul mot doit rester debout. **Pas un argument, un arbitrage de convergence.*** |
| `role` en champ réseau = VETO | **MAINTENU** — collision mesurée à `CopiloteService.ts:66`. |
| 14 prédicats | **RÉVISÉE → 15** (mon compte) / 12 (le sien). |
| Pas d'unicité (rejet n° 8) | **AMENDÉE** — unicité sur **une** clé rejetée, sur le **couple** acceptée. |
| Personne ne nomme le brouillon | **MAINTENUE** — `pm` obtient sa garantie autrement. |
| `fonction` injecté « cuttable » | ⚠ **RETIRÉE en tant que cuttable — PROMUE À REQUISE** (A3). |
| Ne pas scinder `schemaSortie.ts` | **MAINTENU, marge mince** [728 ; 795]. |
| Re-mesurer `CopiloteService.ts` | **FAIT : 574 → ~630.** Différer (A6). |
| « la `reputation` — à traiter par `narratif-ia` » | ⚠ **RÉSOLU, PAS DÉLÉGUÉ** : le canal n'existe plus, les deux champs de sortie sont internes. |

## C — Découpage — **2 lots séquentiels**

**Lot 1 · `distribution-contrat` · `contrat` · 18 fichiers (+1 conditionnel)** :
`copilote/types.ts` · `copilote/schemaSortie.ts` · **`copilote/validateurs.ts` (N — CONDITIONNEL, A5)** · **`copilote/contexte/distribution.ts` (N)** · `contexte/registres.ts` · `contexte/index.ts` · `CopiloteService.ts` · `dossier/libelles.ts` · **`dossier/libelles.test.ts`** ⚠ *absent de ma liste du tour 1* · `brain/index.ts` · `schemaSortie.test.ts` · `contexte.test.ts` · `CopiloteService.test.ts` · `worker/index.ts` · `worker/index.test.ts` · `worker/frontiere.test.ts` · **`dossier-canon/components/PanneauCanon.tsx`** · **`dossier-fiches/components/BlocPlanActions.tsx`** ⚠ *NEUF au tour 2, coût de R1*

**Onze mesures** : `M` avec `DEJA_ECRITS_MAX` saturé et **les CINQ chemins** assertés non vides · `TAILLE_MAX_CORPS_IA` **sur les six rôles** · `max_tokens` dérivé, pire ratio **dit**, coïncidence **dite** · gabarit vs `ENTREE_GABARIT` avant l'invite · **`tsc` lot 1 SEUL** (surcharge **aux deux sites**, `CheminLibelle` élargi ne bouge aucune carte — *si c'est faux, le découpage est faux*) · `@ts-expect-error` vus rouges · **lignes de `schemaSortie.ts` avant docstrings** · `BORNE_EN_TOUTES_LETTRES` **avec son cas négatif** · mutants vus rouges **dont celui du couple** · `git diff --numstat` **pas un grep** · ⚠ **lignes de `CopiloteService.ts`**.

**Lot 2 · `carte-distribution` · 9 fichiers** : `CarteEclaterSynopsis.tsx` (N) · `LigneFichePersonnage.tsx` (N, nom d'`ux` adopté) · `CarteAssistant.tsx` · `PanneauCopilote.tsx` · `styles.ts` · `textes.ts` · **`tests/distribution.test.tsx` (N — porte l'espion)** · `tests/panneauCopilote.test.tsx` · `tests/cablage.test.ts`

**Témoins « zéro diff » MESURÉS** : ⚠ **`useDemandeCopilote` est déjà `useDemandeCopilote<C, P>` — générique, prouvé sur cinq instanciations, la sixième coûte ZÉRO** · les cinq lignes livrées et `BarreLancer` intouchées.

## D — Signature exposée (**baril relu ligne à ligne** — leçon BUG-116)

```ts
export interface CibleDistribution { role: 'synopsis-distribution' }   // charge VIDE
export interface FicheBrouillon { fonction: string; but: { libelle: string } }
export interface PropositionDistribution { ajouts: readonly FicheBrouillon[] }
export type ReponseDistribution = { statut: 'propose'; proposition: PropositionDistribution } | EchecCopilote
demander(dossier, cible: CibleDistribution, signal?): Promise<ReponseDistribution>  // AUX DEUX SITES
```
**`FicheBrouillon` conservé contre `FicheResolue`, et c'est un argument** : `LienResolu` (3c) nomme la **ré-résolution d'un jeton en identifiant** — ici **ni jeton ni identifiant**, la famille ne s'applique pas ; **« brouillon » est le mot qui décourage l'assignation à `Personnage`**.
**Forme réseau NON ré-exportée** : `{ place, poursuite }` / `{ distribution }`. **`{place,poursuite} ∩ {fonction,but} = ∅`.**
**`LIBELLE_DES_CHAMPS` : 4 → 6**, extraction **verbatim**. `CheminLibelle` est `keyof typeof` : **elle s'élargit seule, aucune ligne au baril**.

⚠ **CORRECTION D'UN CHIFFRE DE MON TOUR 1 — j'avais écrit « trois docstrings ». C'est FAUX : SIX sites**, tous au lot 1 :
1. `libelles.ts:10-11` · 2. `PanneauCanon.tsx:27-30` · 3. `brain/index.ts:185-187` (« **reste à quatre entrées** ») · 4. `specification.json:302` · 5. `libelles.test.ts:39` — **le TITRE du test** « quatre entrees, pas une de plus » · 6. `libelles.test.ts:44-51` + `:59-75` + `:104-110` + `:145`.
⚠ **Reste VRAI, à ne pas « harmoniser »** : `brain/index.ts:176-180` — le 5ᵉ rôle est le premier à nommer `MotifIllisible` **en entier**. **Le 6ᵉ ne la nomme PAS en entier** (`'rang-inconnu'` sans objet) — **à écrire dans son commentaire, pas à taire.**

**Le site d'acceptation — SIX clés, aucun spread** :
```ts
const nouveau: Personnage = {
	id: frapperIdentifiant('pnj'),           // DANS le gestionnaire, jamais au rendu
	portee: PORTEE_INITIALE, plan_actions: [], savoirs: [],
	fonction: brouillon.fonction,
	but: { libelle: brouillon.but.libelle }, // sous-entité construite par le CODE (3b)
}
```
⚠ `{ ...brouillon }` **reste interdit, et l'imbrication AGGRAVE le motif** : un spread superficiel porterait `but` **PAR RÉFÉRENCE**, partagé entre l'état d'écran et le document.

## REJETÉ — mise à jour (les 20 du tour 1 reconduits, sauf amendements)

| # | Rejeté | Motif |
|---|---|---|
| **8 (AMENDÉ)** | Unicité sur **une** clé | Toujours rejetée ; **l'unicité du COUPLE est acceptée**. |
| **A** | **`description_joueur` dans la sortie** | ⚠ **Ma propre proposition du tour 1, RETIRÉE** : lectorat joueur **non codé dans `destinations.ts`** ⇒ hors frontière testable ⇒ **KR-229 impose la parade par la FORME**. |
| **B** | **`TEXTE_REFUS_SYNOPSIS_A_ECRIRE`** | Inutile dès l'entrée au registre ; le garder serait une **seconde source** d'un libellé d'écran. |
| **C** | **Scinder `CopiloteService.ts` dans ce lot** | 600 est un **déclencheur maison**, le bloqueur est **800** (~630). Refactor dans la **dernière** livraison, lot contrat déjà à 18 : **risque acheté contre zéro gain**. |
| **D** | **`FicheBrouillon` dérivée de `Personnage`** (`Pick`/`Partial`/`Omit`) | ⚠ Toute dérivation **SUIT le schéma** : le jour où `Personnage` gagne une prose, **le modèle gagne un champ sans qu'une ligne change**. Forme **écrite à la main et fermée**. |
| **E** | **Réutiliser `But`** comme type du champ imbriqué | `But` autorise `pourquoi` et `echeance` : **rouvrirait deux champs que personne ne valide**. `{ libelle: string }` est **assignable à `But` sans lui être égale**. |
| **F** | **Un espion tenu par un test-grep de source** | Un `useMemo` de précalcul **est une occurrence de plus au même fichier** : **le grep compte, il ne sépare pas**. |

### `open_questions`
Rattachement aux objectifs (n° 10) · `nom` re-projeté (n° 10) · `but.pourquoi` (n° 12 / Temps 2) · ⚠ **la scission `copilote/demandes/**`, condition ÉCHUE et délibérément DIFFÉRÉE, motif écrit (A6)** · l'unicité au-delà de `DEJA_ECRITS_MAX`.
