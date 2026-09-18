# Tour 1 — `tech-lead` · `dossier-copilote` it3b

⚠ **Aucun test exécuté** (poste en lecture seule). Toute couleur annoncée est une **prédiction étiquetée comme telle**, jamais une mesure.

**RISQUE** — **Le numéro d'étape calculé au mauvais instant.** `etape` est REQUIS, entier, `moteur` : le code seul l'écrit. Si un ouvrier le pose au moment de la **PROPOSITION** (dans le service, ou depuis le bloc gelé), trois acceptations successives écrivent 1,2,3 sur un plan qui en portait déjà deux — **doublons silencieux**, aucune règle d'unicité n'ayant jamais été arbitrée (`tables.ts:398` le dit en toutes lettres). `validateDossier` ne rougirait pas, et l'auteur ratifierait le défaut d'un clic.

**OBJECTION** — « SOUS-ENTITÉS STRUCTURÉES, chacune portant plusieurs champs » **n'est pas tenable** : des six champs, le modèle n'en atteint **qu'un**. `si_bloque` est `ia` mais INATTEIGNABLE sans `duree` (`moteur`, non proposable) — l'accepter allume le constat `info` de `controles.ts:727` sur une étape neuve, **à chaque fois**. Le copilote fabriquerait l'alerte. Seconde objection : « COMPLÉTER » exige de voir les étapes déjà écrites, ce que la doctrine 3a (cible exclue PAR ABSENCE) interdit. **Deux clauses du `goal` à trancher au tour 2.**

**PROPOSITION** — Sortie `{ "intentions": ["…"] }` — UNE clé, prose libre, zéro entier, rôle de RÉDACTION donc liste vide = refus `'vide'`. Re-résolue `{ acteurId, actions }` : zéro clé commune (KR-231). `etape` écrit **À L'INSTANT DE L'ÉCRITURE**, `p.plan_actions.length + 1` DANS la recette `dossiers.update`, formule recopiée de `useEcriturePlan.ts:201` — **deux écrivains, une seule règle**. Cible `CiblePlan { acteurId }` et jamais `{ personnageId }` : identique à `CibleRepliques`, elle tomberait dans `demanderRepliques`, `tsc` vert (TL3a-5). **2 lots, 18 + 10 fichiers.**

**VERDICT** — **recevable sous réserve**

---

# ANNEXE — découpage en lots, signatures figées, arbitrages

## A. LE DÉCOUPAGE — 2 lots, séquentiels, aucun worktree

**La frontière des lots EST la frontière de feature** : lot 1 ∌ `src/features/**`, lot 2 ⊂ `src/features/dossier-copilote/**`. Aucun fichier nommé deux fois.

### LOT 1 — `plan-contrat` · **contrat** · seul, en premier

| Fichier | | Contenu |
|---|---|---|
| `src/brain/copilote/contexte.ts` | **D** | supprimé au profit du dossier homonyme |
| `src/brain/copilote/contexte/index.ts` | N | barrel : re-exporte EXACTEMENT les exports actuels |
| `…/contexte/noyau.ts` | N | `estObjet`, `textesDuChemin`, `estRedige`, `textesRediges`, `PREFIXE_*`, `MotifRefusContexte`, `ContexteProse`, `ContexteDetenteurs` |
| `…/contexte/registres.ts` | N | les 4 registres, **entiers, non scindés** |
| `…/contexte/prose.ts` | N | `assemblerProse` (déplacé tel quel) |
| `…/contexte/detenteurs.ts` | N | `assemblerDetenteurs` (déplacé tel quel) |
| `…/contexte/repliques.ts` | N | `assemblerRepliques` (déplacé tel quel) |
| `…/contexte/plan.ts` | N | `assemblerPlan` — **le 4ᵉ rôle** |
| `src/brain/copilote/contexte.test.ts` | R | confinement du 4ᵉ rôle + **mesure de M** ; **reste à sa place** |
| `src/brain/copilote/types.ts` | R | `RoleCopilote` +1, `IntentionsRendues`, `PropositionPlan` |
| `src/brain/copilote/schemaSortie.ts` | R | `CLES_SORTIE_PLAN`, `INTENTIONS_PROPOSEES_MAX`, `GABARIT_SORTIE` +1, `validerIntentions` |
| `src/brain/copilote/schemaSortie.test.ts` | R | les prédicats du 4ᵉ validateur |
| `src/brain/CopiloteService.ts` | R | `CiblePlan`, `ReponsePlan`, 4ᵉ surcharge, `demanderPlan`, **branche de dispatch** |
| `src/brain/CopiloteService.test.ts` | R | refus discriminés, rejeu, zéro `fetch` |
| `src/brain/index.ts` | R | ré-exporte `CiblePlan`, `PropositionPlan`, `ReponsePlan` — **jamais `IntentionsRendues`** |
| `worker/index.ts` | R | `GABARIT_SORTIE` +1, `INVITES` +1, `TAILLE_MAX_CORPS_IA` **re-mesuré** |
| `worker/index.test.ts` | R | 405/404/413/503 du rôle neuf |
| `jest.config.cjs` | R **si nécessaire** | vérifier que `coveragePathIgnorePatterns` couvre le barrel neuf |

**HORS de tout lot, et c'est le témoin le plus fort de l'itération** : `worker/frontiere.test.ts`. Ses `ROLES` sont **dérivés** (`Object.keys(INVITES)`, l. 68) : le 4ᵉ rôle **étend le garde KR-236 tout seul**. Un diff sur ce fichier signale qu'on a touché l'instrument dans le lot qui le mesure. *(Prédiction, NON mesurée.)*

⚠ **Contrainte d'écriture du gabarit** : `ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm`, ancrée sur l'entrée, des deux côtés. **Aucun accent ni chiffre dans le rôle.**

**Ordre interne imposé — la scission D'ABORD, et elle se prouve :**
1. **Étape A — le DÉPLACEMENT SEUL.** Aucune ligne du 4ᵉ rôle. `contexte.test.ts`, `CopiloteService.ts`, `brain/index.ts`, `worker/frontiere.test.ts` **restent octet pour octet identiques** (les cinq sites d'import résolvent `./contexte` → `contexte/index.ts` sans changer une lettre). L'ouvrier **rejoue `tsc` + `jest` ICI** et reporte : c'est la preuve que le déplacement est sans comportement.
2. **Étape B — le 4ᵉ rôle**, dans les fichiers que A a créés.

Ils partagent le lot, **pas la porte**. Les scinder en deux LOTS est impossible — les deux nommeraient `contexte/registres.ts` et `contexte/index.ts` (REJETÉ n° 12).

#### Où passe la couture

**On scinde ce qui varie par rôle ; on garde entier ce qui doit rester TOTAL.** Les registres sont des `Record<RoleCopilote, …>` : **leur totalité EST le garde** (« un rôle ajouté sans entrée ne compile pas »), support du confinement KR-232. Les éclater détruirait cette totalité.

Tailles visées après 3b : `noyau` ~120 · `registres` ~250 · `prose` ~60 · `detenteurs` ~105 · `repliques` ~80 · `plan` ~80 · barrel ~15. **Sans scission : 674 à 3b, ~784 à 3c (16 lignes de marge), franchissement à l'it4.**

**Le dossier plutôt qu'un plat `contexte-noyau.ts`** : le barrel s'appelle `index.ts`, donc il tombe sous `coveragePathIgnorePatterns`, et **aucune instruction d'import ne change nulle part**.

### LOT 2 — `carte-plan` · feature · démarre contrat figé

| Fichier | | Contenu |
|---|---|---|
| `components/CartePlanActions.tsx` | N | la 5ᵉ carte |
| `components/LigneDecision.tsx` | N | ex-`LigneReplique`, **renommée**, deux appelants |
| `components/LigneReplique.tsx` | **D** | |
| `components/CarteFaireParler.tsx` | R | import + noms de type **seulement** |
| `components/PanneauCopilote.tsx` | R | la carte de plus |
| `components/styles.ts` | R | jetons réutilisés |
| `textes.ts` | R | textes du 4ᵉ rôle |
| `tests/planActions.test.tsx` | N | |
| `tests/repliques.test.tsx` | R | **renommage d'import seulement** |
| `tests/panneauCopilote.test.tsx` | R | compte de cartes, **+1, une ligne** |

**HORS de tout lot** : `hooks/useDemandeCopilote.ts`, `LigneProposition.tsx`, `LigneDetenteur.tsx`, `CarteCompleterFiche.tsx`, `CarteTisserIndices.tsx`, `BarreLancer.tsx`, `CarteAssistant.tsx`, `index.ts`, `tests/{cablage,acceptation,detenteurs,useDemandeCopilote}`, tout `src/brain/dossier/**`, `Select.tsx`, `lintIsolation.test.ts`.

**Aucune ligne neuve dans `destinations.ts`** : les six lignes de `plan_actions[]` y sont déjà arbitrées.

## B. LES SIGNATURES

```ts
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques' | 'personnage-plan'
export interface IntentionsRendues { intentions: readonly string[] }   // réseau, NON ré-exportée
export interface PropositionPlan { acteurId: string; actions: readonly string[] }   // re-résolu
export const CLES_SORTIE_PLAN = ['intentions'] as const
export const INTENTIONS_PROPOSEES_MAX = 3
export function validerIntentions(brut: unknown, dossier: Dossier): ({ ok: true } & IntentionsRendues) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
export function assemblerPlan(dossier: Dossier, cible: CiblePlan): ContexteProse
export interface CiblePlan { acteurId: string }
export type ReponsePlan = { statut: 'propose'; proposition: PropositionPlan } | EchecCopilote
demander(role: 'personnage-plan', dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>

// dispatch — QUATRE branches, aucun repli :
if ('champ' in cible)    return demanderProse(dossier, cible, signal)
if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
if ('acteurId' in cible) return demanderPlan(dossier, cible, signal)
return demanderRepliques(dossier, cible, signal)   // rétréci par le COMPILATEUR
```

**L'écriture d'acceptation, mot pour mot** :
```ts
? { ...p, plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }] }
```
`p` vient de `d`, le document **courant dans la recette** — jamais du bloc gelé, jamais de la proposition. `plan_actions` est dans `LISTES_REQUISES` : toujours un tableau, **aucun `?? []`**.

## C. LES CINQ ARBITRAGES

### C.1 — Ce que rend le modèle, qui écrit `etape`
**Le modèle rend une LISTE DE PROSE NUE, une clé, zéro entier.** `etape` est écrit par le code **au moment de l'ÉCRITURE**, par la formule de l'éditeur manuel (`useEcriturePlan.ts:201`) — **deux écrivains, une seule règle**.

**Pourquoi pas dans `CopiloteService`** : entre la demande et l'acceptation, le dossier bouge. Un numéro calculé à la proposition est périmé, **et périmé en silence**.

**Le pire cas est connu et nommé** : `handleRetirerEtape` (`useEcriturePlan.ts:261-280`) **filtre sans renuméroter**. Sur `[1,2,3]` dont on retire le premier, il reste `{etape:2},{etape:3}` et `length + 1` vaut 3 — **doublon**. Ce défaut **PRÉEXISTE dans l'éditeur manuel**, il n'est **pas** créé par 3b. À porter à `bug_history.json` en `minor` contre `dossier-fiches`, **hors périmètre**.

**`etape` ne viole pas KR-221, et le discriminant est décidable** : KR-221 interdit de semer des **OPTIONNELS**. `etape` est **requis par le type** — une sous-entité sans lui n'est pas représentable. **Écrire le minimum structurel n'est pas semer.**

### C.2 — La scission
**Oui, dans le lot contrat, étape A, avant la première ligne du 4ᵉ rôle**, avec la preuve « quatre fichiers intouchés + porte verte » entre A et B.

### C.3 — La disjonction du dispatch (TL3a-5 reconduit)
`CiblePlan { acteurId }` rend les **quatre** cibles disjointes : `{entiteId,champ}` · `{indiceId}` · `{acteurId}` · `{personnageId}`. Vocabulaire du dépôt : `plan_actions[].action` est « ce que le rôle **acteur** joue ».

**Condition de bascule, écrite maintenant** : 3c cible aussi un personnage. **Un TROISIÈME synonyme est le signal** — 3c ne fabrique pas `protagonisteId`, elle **bascule les cinq cibles sur une union étiquetée** dans son propre lot contrat.

### C.4 — `CopiloteService.ts` et `worker/index.ts`
**`CopiloteService.ts` → ~490 l. : on ne touche pas.** Les quatre corps privés ne sont pas quatre copies ; les paramétrer recréerait le « corps commun paramétré par le rôle » que `contexte.ts` refuse. **Condition d'ouverture : la CINQUIÈME branche.**

**`worker/index.ts` → ~530 l. : refus plus dur.** `frontiere.test.ts` **balaie la SOURCE** par une expression ancrée, déjà réparée à 3a. **Déplacer la chose mesurée et ré-ancrer la mesure dans le lot qui ajoute un rôle est la manière exacte dont un garde devient inerte en restant vert.**

### C.5 — Le contexte
1. **La cible EST injectée, et l'amendement doit être écrit.** Compléter un plan est une **continuation** ; un modèle qui ne voit pas les étapes 1 et 2 propose une étape 3 incohérente — panne qu'**aucun instrument ne constate**. **Asymétrie du regret** : un doublon se voit et se rejette d'un clic ; une incohérence ne se voit pas.
2. **`BUDGET_CARACTERES_CONTEXTE['personnage-plan']` MESURÉ**, jamais recopié de 4000 (désaccord n° 35 de 3a).

## D. REJETÉ — à recopier au registre (BUG-082)

| # | REJETÉ | Motif |
|---|---|---|
| 1 | **`etape` porté par la proposition** | Entre la demande et l'acceptation le plan bouge : le numéro est périmé, **et en silence**. |
| 2 | **`etape = max(etape) + 1`** | Divergerait de l'éditeur manuel (`length + 1`) : deux écrivains, deux règles, et déciderait une règle d'ordonnancement que `tables.ts:398` interdit de décider ici. |
| 3 | **Renuméroter les étapes existantes** | Réécrirait des champs non ratifiés dans ce geste (KR-221). |
| 4 | **`si_bloque` dans la sortie de 3b** | Inatteignable sans `duree` : chaque acceptation allumerait le constat `info` de `controles.ts:727` — le copilote fabriquerait le travail qu'il prétend épargner. |
| 5 | **`CiblePlan { personnageId }`** | Identique à `CibleRepliques` : tomberait dans `demanderRepliques`, `tsc` vert. TL3a-5 au mot près. |
| 6 | **Clé réseau `etapes` ou `actions`** | `etapes` est à une lettre de `etape` (entier `moteur`) ; `actions` **échoue au champ du document**. Les deux rouvrent la confusion que KR-231 ferme. |
| 7 | **`PropositionPlan { personnageId, ajouts }`** | Structurellement identique à `PropositionRepliques` : deux recettes d'écriture différentes, `tsc` muet. |
| 8 | **Scinder les registres par rôle** | Leur totalité EST le garde et le support de KR-232 ; la scinder la remplacerait par une convention. |
| 9 | **Déplacer `INVITES`/`GABARIT_SORTIE` hors de `worker/index.ts`** | `frontiere.test.ts` balaie cette source par une expression ancrée : déplacer la chose mesurée dans le lot qui la mesure rend le garde inerte en le laissant vert. |
| 10 | **Scinder `CopiloteService.ts` à 3b** | Les corps privés ne sont pas des copies ; condition d'ouverture = la 5ᵉ branche. |
| 11 | **Extraire `BarreDecision`, ou écrire un 4ᵉ `LigneEtape.tsx`** | La condition de 3a (« 4ᵉ occurrence ») **ne se déclenche pas** : renommer `LigneReplique` → `LigneDecision` laisse le dépôt à **trois** composants de ligne, sans dupliquer 110 lignes ni rouvrir deux surfaces vertes. |
| 12 | **Un lot de scission séparé** | Les deux nommeraient `contexte/registres.ts` : propriété non exclusive. La séparation est obtenue **dans le temps**, pas par un lot de plus. |
| 13 | **Renommer `CibleCopilote` → `CibleProse`** | Condition d'ouverture non échue (3b ne touche pas le hook). |
| 14 | **Un prédicat de similarité** | La frontière testable est la FORME (KR-229) — désaccord n° 33 de 3a. |
| 15 | **Un `Record<RoleCopilote, …>` générique pour schémas et bornes** | TL3a-6 tient : le rôle prose n'a pas de liste, son entrée serait un mensonge. |
| 16 | **Trois lots ou plus** | Un 3ᵉ lot n'aurait aucun fichier propre ; 3a a mesuré que deux lots séquentiels suffisent. |

## E. Deux points pour le tour 2

1. **DEUX clauses du `goal` sont périmées, pas une.** « des SOUS-ENTITÉS STRUCTURÉES, chacune portant plusieurs champs » est **fausse** dès lors que `si_bloque` sort : le modèle n'atteint qu'un champ sur six. Ce qui est réellement neuf — et **exactement ce dont 3c a besoin** — c'est que **l'unité acceptée est une sous-entité que le CODE CONSTRUIT** : `{ etape, action }`. Rédiger le `goal` ainsi, sinon un ouvrier livrera les six champs « parce que c'est écrit ».
2. **Le budget est la contrainte la plus dure, et elle n'est dans aucun lot.** `code-knowledge.json` à **72 o** : 3b **ne peut pas ajouter un seul KR** sans compacter d'abord — or elle en produira au moins un. `specification.json` à **392 o** pour une entrée de ~4 900. **Les deux compactions sont dues dans l'étape 4 de CE cycle.**
