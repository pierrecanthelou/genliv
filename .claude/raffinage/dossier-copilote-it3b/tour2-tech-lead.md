# Tour 2 — `tech-lead` · `dossier-copilote` it3b

⚠ **Ce poste n'a AUCUN outil d'exécution** (Read/Grep/Glob). Tout est **mesuré par lecture de source**, avec numéro de ligne, ou par **arithmétique sur une fonction pure lue**. Aucune couleur de test affirmée sur une exécution.

**À `narratif-ia` (objection n° 1, REJETÉ n° 9) — la clé réseau est `intentions`, et TON PROPRE § F le tranche.** Ton § F interdit à l'invite de réciter « le nom du champ `action` » ; ton gabarit `{"actions": […]}` est **dans** l'invite. Les trois rôles livrés ne nomment **jamais** leur champ de destination : `valeur`/`detenteurs`/`repliques` contre `fonction`/`savoirs[]`/`parler[]`. Sur la **cible** nous sommes d'accord ; ta `PropositionPlan { personnageId, … }` tombe avec elle, car le dépôt écrit `proposition = cible + contenu` (`CopiloteService.ts:358`). Donc : réseau `{ intentions }`, cible `{ acteurId }`, re-résolu `{ acteurId, actions }`.

**À la QA — tu as raison, j'avais tort.** `frontiere.test.ts:319` porte `toHaveLength(3)` en dur. **Il ENTRE au lot 1.** Le témoin « zéro diff » est remplacé par une **liste nommée de 6 sites**.

**À l'UX — une étape par lancer : ACCEPTÉ.** Ton `LigneEtape` : retiré des deux côtés — `LigneRepliqueProps` est déjà `{ texte, … }`, réemploi verbatim, **zéro diff**.

**À `narratif-ia` — montée de `etape = rang+1` dans `brain/` + repointage `useEcriturePlan.ts` : VETO.**

**Mes objections** : « plusieurs champs » **MAINTENUE** · « voir le déjà-écrit contredit 3a » **RETIRÉE** · n° 6 **DURCIE EN VETO** · n° 5/9/10/16 **MAINTENUES** · n° 11 **RETIRÉE** · « frontiere hors lot » **RETIRÉE**.

**VERDICT — recevable sous réserve** (contrat figé ci-dessous avant la première ligne de lot 2).

---

# ANNEXE (hors quota)

## A. Le conflit frontal, tranché sur le fond

### A.1 — Ce qui ne décide rien
**KR-231 ne départage pas** : les deux jeux ont zéro clé commune. Il fallait trancher ailleurs.

### A.2 — La clé réseau : `intentions`. Pourquoi `actions` est faux
1. **Mesuré, `destinations.ts:205`** : le champ du document est `…plan_actions[].action`. `{"actions": …}` est **ce nom, au pluriel, dans l'invite**.
2. **Mesuré, `worker/index.ts:127-130`** : aucun des trois gabarits livrés ne nomme son champ de destination. **La règle du dépôt est : la clé réseau nomme la FORME, jamais le CHAMP.** `actions` serait la **première exception, non motivée**.
3. **Son § F l'interdit lui-même** : « le nom du champ `action` ou de tout autre champ » figure dans sa liste de ce que l'invite n'a pas le droit de réciter. **Son gabarit le récite.**
4. **Trois homographes voisins** : `plan_actions` (liste), `action` (champ), `actions` (clé réseau).
5. `intention` **n'est la clé d'aucun champ** du dossier — vérifié : `types.ts` ne le porte qu'en prose de docstring.

### A.3 — La cible et la proposition : `acteurId`, les deux
**Mesuré, `CopiloteService.ts:398-407`** : le dispatch rétrécit sur la FORME. `CiblePlan { personnageId }` est **le même type** que `CibleRepliques` ⇒ tombe dans la branche répliques, **`tsc` vert**. Point non débattu (son n° 8 = mon n° 5).

**Ce qui l'est** : la proposition. **Mesuré, `CopiloteService.ts:358`** : `proposition: { personnageId: cible.personnageId, ajouts: … }`. Même invariant chez les deux autres rôles. **La proposition est la cible, plus le contenu.** Une proposition qui **renomme la clé d'identité de sa cible** oblige le service à traduire en recopiant — un endroit de plus où se tromper, **sans contrepartie**. Donc `{ acteurId, actions }`.

`actions` **en re-résolu ne rouvre rien** : cette forme ne traverse jamais le réseau, elle est le nom de sa **destination d'écriture** côté client, et elle est doublement disjointe de `PropositionRepliques { personnageId, ajouts }`.

**Le synonyme `acteurId` est assumé et borné** : `types.ts:362` « ce que le **rôle acteur** joue », `types.ts:781` « Un **acteur** du monde ». **Condition de bascule inchangée** : un **troisième** synonyme (3c) est le signal ⇒ bascule des cinq cibles sur une **union étiquetée**, dans le lot contrat de 3c — pas 3b.

## B. Le conflit de fait — `worker/frontiere.test.ts` ENTRE AU LOT 1

**Ma prédiction de tour 1 était fausse. La QA a raison.**

- l. 147-149 `paires(roles)` = C(n,2). n=3 → 3 ; **n=4 → 6**. Arithmétique sur une fonction pure lue.
- l. 319 `expect(toutes).toHaveLength(3)` — **littéral en dur**, rougirait **pour la mauvaise raison**.

**Vérifié en plus, et que personne n'a relevé** : l. 68 ✔ dérivé · l. 620 ✔ · l. 643 ✔ · l. 596-617 `rolesAuMaximum` ✔ (le max reste `indice-detenteurs`, 17 000) · l. 625 ✔ · l. 172-178 et l. 158-164 ✔.

⚠ **Piège conditionnel, non relevé au tour 1 par personne** : ll. 638-640 fabriquent « deux rôles étroits égaux ». **Si la mesure du 4ᵉ budget tombe sur 4 000 (= répliques) ou 6 000 (= prose), la fabrication devient INERTE** — l'assertion serait déjà vraie avant elle. **Le test reste VERT en cessant de mesurer.** À traiter **dans le lot**, une fois la mesure connue.

**Le témoin de remplacement.** « Un diff ici = frontière franchie » est mort. Il devient : **le diff de `frontiere.test.ts` est EXACTEMENT cette liste, et rien d'autre.**

| Site | Ce qui change | Pourquoi admissible |
|---|---|---|
| l. 313 (titre) | retirer « trois » | le titre mentait sur la cardinalité |
| ll. 315-316 (commentaire) | idem | idem |
| **l. 319** | `toHaveLength((ROLES.length * (ROLES.length - 1)) / 2)` **+** une assertion d'unicité des paires | **forme fermée INDÉPENDANTE de l'algorithme de `paires`** (pas un témoin fabriqué depuis son sujet), générique à N, jamais à ré-éditer ; la 2ᵉ ligne **rend** ce que le littéral `3` donnait en silence |
| l. 54 | entrée `1: 'une seule'` dans `BORNE_EN_TOUTES_LETTRES` | extension du garde |
| ll. 347-367 | le couple (invite plan, `INTENTIONS_PROPOSEES_MAX`) **avec son cas négatif** | KR-236 |
| l. 618 (commentaire « TROIS entrées ») | « une par rôle » | commentaire périmé |
| ll. 638-640 | **UNIQUEMENT si** la mesure crée une égalité naturelle | voir ci-dessus |

**ZÉRO diff exigé** sur : `gabaritsSousChaines`, `invitesQuiNommentUnAutreGabarit`, `croiser`, `rolesAuMaximum`, `memesGabarits`, `extraire`, `ENTREE_GABARIT`, le `describe.each` des plafonds, le balayage du 3ᵉ porteur. **Un diff sur l'un de ces neuf = l'instrument a été plié pour entrer dans le lot qui le mesure.** C'est vérifiable à la lecture du diff, **et c'est plus fort que « zéro diff sur le fichier », qui ne disait rien de QUOI avait changé.**

**Contrainte de sous-chaîne vérifiée d'avance** : `'{"intentions": ["…"]}'` n'est sous-chaîne d'aucun des trois gabarits existants ni réciproquement ; satisfait `ENTREE_GABARIT`.

## C. Les quatre autres points

### C.1 — UNE SEULE étape par lancer : ACCEPTÉ
**Ce que ça simplifie :**
- ⚠ **Le prédicat (8) de `validerRepliques` (« éléments distincts après trim ») devient INATTEIGNABLE** à MAX=1 (un ensemble de ≤ 1 élément a toujours `size === length`). Il doit être **SUPPRIMÉ, pas laissé mort** : un prédicat inatteignable est la famille `'rang-inconnu'` / BUG-084 / KR-235. **Le validateur a NEUF prédicats, pas dix**, et sa docstring doit écrire *pourquoi* (8) est absent et à quelle condition il revient (MAX > 1) — sinon un relecteur le « restaure ».
- `max_tokens` **re-dérivé** : pire élément 68 car., enveloppe `{"intentions": [""]}` = 20 o, `L = 88`, `r=2` (pire) ⇒ 132 ⇒ **200. Pas 400.**
- Aucun « accepter puis chercher la ligne suivante » : **la famille BUG-097/101/106/109 reste à zéro occurrence.**

**Ce que ça coûte** : un **contexte complet par étape** — trois étapes = trois appels. C'est une latence et un coût, **pas une correction**.

**Et l'argument de l'UX est juste là où le mien ne suffisait pas** : écrire `etape` à l'instant de l'écriture règle la **numérotation**, pas la **cohérence**. Trois étapes en chaîne dont l'auteur n'accepte que la deuxième laissent une étape qui **présuppose une étape jamais écrite**. À une étape par lancer, avec l'injection du déjà-écrit, **la chaîne est cohérente par construction**.

**Mais on garde la FORME LISTE** : `{"intentions": ["…"]}` avec **un seul** emplacement. Raison : `length > MAX` reste un **refus réel** (KR-230 — jamais prendre le premier et jeter le reste), et relever MAX plus tard ne change aucun contrat.

### C.2 — `LigneEtape` : je RETIRE mon n° 11, et je refuse le sien
**Mesuré, `LigneReplique.tsx:12-24`** : `LigneRepliqueProps` n'a **aucun membre propre aux répliques** — la prop s'appelle déjà `texte`, l'eyebrow est rendu par la CARTE, et les deux props de plafond sont **optionnelles**.
- **Le réemployer coûte ZÉRO diff** sur le composant, sur `CarteFaireParler.tsx` et sur `tests/repliques.test.tsx`.
- **Mon renommage → `LigneDecision` est RETIRÉ** : il ouvrirait trois surfaces vertes pour ne changer qu'un nom. **Je m'applique ma propre règle.** **Reporté** : troisième consommateur, ou props cessant d'être neutres.
- **Son `LigneEtape` est refusé** : `si_bloque` sortant, il ne porterait plus qu'**un** bloc de prose — `LigneReplique` à l'identique, 110 lignes dupliquées.

### C.3 — `si_bloque` : MAINTENU DEHORS
Motif décisif, **structurel** : `si_bloque` non vide **sans `duree`** allume le constat de `validate.ts` § 8 bis ; `duree` est `moteur` et le code ne peut pas la semer (KR-221). **Le copilote fabriquerait l'alerte qu'il prétend éviter, à chaque acceptation.** Corollaire : la clause « SOUS-ENTITÉS STRUCTURÉES … plusieurs champs » du `goal` est **fausse** (objection MAINTENUE ; PM et QA convergent).

### C.4 — Le 11ᵉ prédicat : REFUSÉ POUR 3b, avec sa condition d'ouverture
Recevable **en principe** (prédicat de FORME). Refusé **tel qu'écrit**, trois raisons mesurées :
1. **Le motif `'schema'` est un mensonge.** Une sortie en double **est** conforme au schéma. C'est « LE BON TEXTE, POUR LA MAUVAISE RAISON », la panne que `frontiere.test.ts:10-12` existe pour nommer. Il faudrait `'doublon'`, donc `MotifIllisible` +1 (que sa note déclare « INCHANGÉE ») **et** un texte d'écran de plus.
2. **Il exige d'élargir la signature du validateur** : `validerRepliques(brut, dossier)` ne reçoit pas la cible — asymétrie avec les trois validateurs livrés.
3. ⚠ **L'asymétrie du regret joue CONTRE lui, et d'autant plus à MAX=1.** Le refus est **par lot** : un seul élément recopié fait tomber la réponse entière ⇒ rejeu ⇒ **échec terminal**, sur lequel l'auteur ne peut rien. Le défaut qu'il prévient — un doublon **visible**, juste sous la liste DÉJÀ ÉCRIT gelée — coûte **un clic**. **On échangerait un clic contre une impasse.**

**La contrepartie que l'injection exige réellement est celle de l'UX** — le bloc DÉJÀ ÉCRIT gelé — et elle est **dans le lot 2**, livrée avec le risque qu'elle paie.
**Condition d'ouverture, décidable** : le jour où une **mesure comptée** montre une recopie verbatim ; alors `validerIntentions(brut, dossier, dejaEcrites: readonly string[])` — les **chaînes**, jamais la cible — et motif `'doublon'`.

### C.5 — La montée de `etape = rang + 1` dans `brain/` : VETO
1. **Casse la frontière de lots** : `useEcriturePlan.ts` est dans `dossier-fiches`, donc ni lot 1 ni lot 2. Il faudrait un **troisième lot** dont l'unique fichier est un refactor sans comportement — **un lot qui ne peut rien prouver seul**.
2. **La promotion n'achète aucune couverture.** Mesuré : `useEcriturePlan.ts:197` pose `estNouvelle = index >= plan_actions.length`, donc à l. 201 `index + 1` **vaut déjà** `length + 1`. **Les deux écrivains appliquent déjà la même règle.**
3. **Et elle ne corrige pas le défaut visé.** Mesuré, l. 261-280 : `handleRetirerEtape` **filtre sans renuméroter** ⇒ sur `[1,2,3]` moins l'indice 0, `length + 1` vaut 3 ⇒ **doublon**. Un `prochaineEtape()` partagé serait **vert par-dessus ce trou**. La seule parade réelle est une règle d'unicité au document — que `tables.ts:398` dit n'avoir jamais été arbitrée, et que `narratif-ia` refuse lui-même d'inventer en passant (son REJETÉ n° 10). **La même discipline vaut ici.**
4. **Sa sonde de fin de lot est inécrivable** : `etape:` est la **clé d'objet**, présente par nécessité chez les deux écrivains — elle rougirait toujours.

**Où va le défaut** : `bug_history.json`, `minor`, feature `dossier-fiches`, `discovered_at: "iteration-3b"`, **non corrigé par 3b**.

## D. LE DÉCOUPAGE DÉFINITIF — 2 lots, séquentiels, aucun worktree

### LOT 1 — `plan-contrat` · **contrat** · seul, en premier · **18 fichiers**
`contexte.ts` (**D**) · `contexte/{index,noyau,registres,prose,detenteurs,repliques,plan}.ts` (N ×7) · `contexte.test.ts` (R) · `copilote/types.ts` (R) · `copilote/schemaSortie.ts` (R) · `copilote/schemaSortie.test.ts` (R) · `CopiloteService.ts` (R) · `CopiloteService.test.ts` (R) · `brain/index.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · **`worker/frontiere.test.ts` (R — les 6 sites du § B, et rien d'autre)**

**`jest.config.cjs` SORT du lot** — mesuré : `coveragePathIgnorePatterns: ['/node_modules/', 'index.ts$']` couvre **déjà** `contexte/index.ts`. Aucun diff.

**Ordre interne imposé :**
1. **Étape A — le DÉPLACEMENT SEUL.** Les **cinq** sites d'import sont `.../contexte` sans extension (mesurés : `worker/frontiere.test.ts:37`, `contexte.test.ts:19`, `CopiloteService.ts:19`, `CopiloteService.test.ts:6`, `brain/index.ts:175`) et `tsconfig.json:8` porte `moduleResolution: "bundler"` : **aucune instruction d'import ne change**. Ces cinq fichiers restent **octet pour octet identiques**. L'ouvrier rejoue `tsc` + `jest` **ICI** et reporte.
2. **Étape B — le 4ᵉ rôle.**

**Où passe la couture** : on scinde ce qui varie par rôle, on garde **entier** ce qui doit rester TOTAL. Les registres sont des `Record<RoleCopilote, …>` : **leur totalité EST le garde**, support de KR-232. Tailles visées : `noyau` ~120 · `registres` ~250 · `prose` ~60 · `detenteurs` ~105 · `repliques` ~80 · `plan` ~80 · barrel ~15. Sans scission : 674 à 3b, ~784 à 3c — **16 lignes de marge**.

**Deux mesures obligatoires, dans le lot, jamais recopiées** : le budget (neuf chemins assertés non vides d'abord) ; et **si la mesure tombe sur 4 000 ou 6 000**, traiter `frontiere.test.ts:638-640`.

### LOT 2 — `carte-plan` · feature · **7 fichiers**
`components/CarteCompleterPlan.tsx` (N — **la 5ᵉ carte + la recette d'acceptation**) · `components/LigneReplique.tsx` (R — **docstring seule**, nomme ses DEUX consommateurs, zéro ligne de code) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R **seulement si** un jeton manque) · `textes.ts` (R) · `tests/planActions.test.tsx` (N) · `tests/panneauCopilote.test.tsx` (R — une ligne)

**HORS de tout lot, et mesuré** : `hooks/useDemandeCopilote.ts` (générique `<C, P>`, **le rôle littéral est lié par la carte** — le hook ne connaît ni rôle ni dossier), `CarteFaireParler.tsx`, `tests/repliques.test.tsx`, `LigneProposition.tsx`, `LigneDetenteur.tsx`, les autres cartes, `BarreLancer.tsx`, `index.ts`, `tests/{cablage,acceptation,detenteurs,useDemandeCopilote}`, tout `src/brain/dossier/**`, `Select.tsx`, `lintIsolation.test.ts`, **tout `src/features/dossier-fiches/**`**.

**`destinations.ts` : aucun diff** — les six lignes de `plan_actions[]` y sont déjà arbitrées.

**Où vit l'écriture** — mesuré, `CarteFaireParler.tsx:215-221` : la recette est la fonction passée à `dossiers.update`, **depuis la carte**. Elle vit donc dans `CarteCompleterPlan.tsx`, lot 2, **et ne fuit dans aucun autre lot**.

**Pourquoi deux lots et pas trois** : lot 2 a rétréci de 10 à 7 fichiers. Un 3ᵉ lot n'aurait aucun fichier propre. **Pas d'essaim : deux lots séquentiels, sans worktree ni fusion.**

## E. LES SIGNATURES FIGÉES

```ts
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques' | 'personnage-plan'
export interface IntentionsRendues { intentions: readonly string[] }   // RÉSEAU — non ré-exportée
export interface PropositionPlan { acteurId: string; actions: readonly string[] }   // RE-RÉSOLU
export interface CiblePlan { acteurId: string }
export type ReponsePlan = { statut: 'propose'; proposition: PropositionPlan } | EchecCopilote
export const CLES_SORTIE_PLAN = ['intentions'] as const
export const INTENTIONS_PROPOSEES_MAX = 1
// GABARIT_SORTIE['personnage-plan'] = '{"intentions": ["…"]}'   (worker ET schemaSortie, à l'identique)
export function validerIntentions(brut: unknown, dossier: Dossier):
	({ ok: true } & IntentionsRendues) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
export function assemblerPlan(dossier: Dossier, cible: CiblePlan): ContexteProse
demander(role: 'personnage-plan', dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>
```

**Le dispatch — QUATRE branches, aucun repli :**
```ts
if ('champ' in cible)    return demanderProse(dossier, cible, signal)
if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
if ('acteurId' in cible) return demanderPlan(dossier, cible, signal)
return demanderRepliques(dossier, cible, signal)   // rétréci PAR LE COMPILATEUR
```

**La recette d'acceptation, mot pour mot (lot 2) :**
```ts
? { ...p, plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }] }
```
`p` vient du `d` **de la recette** — jamais le bloc gelé, jamais la proposition. `plan_actions` ∈ `LISTES_REQUISES` : **aucun `?? []`**. **Deux clés, rien d'autre** (KR-221).

**Motifs atteignables** : `'schema' | 'vide' | 'marqueur' | 'identifiant'`. **`'rang-inconnu'` sans objet.** **`MotifIllisible` INCHANGÉE.**
**Trois refus, ordre figé, tous AVANT le moindre `fetch`** : `a-ecrire` → `cible-a-ecrire` (**prédicat nommé sur UN chemin**, `CHEMIN_BUT_CIBLE`) → `trop-long` (KR-230).

## F. LES REJETÉ — à recopier au registre (BUG-082)

| # | REJETÉ / statut | Motif |
|---|---|---|
| 1 | **Clé réseau `actions`** — VETO | Elle nomme le champ du document, ce qu'aucun des trois gabarits livrés ne fait et ce que le § F de l'invite **interdit explicitement**. |
| 2 | **Clé réseau `etapes`** | À une lettre de `etape`, entier `moteur` que le modèle ne rend jamais. |
| 3 | **`CiblePlan { personnageId }`** — VETO | Type identique à `CibleRepliques` : tombe dans la branche répliques, `tsc` vert. |
| 4 | **`PropositionPlan { personnageId, … }`** | La proposition est la cible plus le contenu ; renommer la clé d'identité oblige le service à traduire en recopiant, sans contrepartie. |
| 5 | **`PropositionPlan { personnageId, ajouts }`** | Structurellement identique à `PropositionRepliques`. |
| 6 | **`etape` porté par la proposition** | Entre la demande et l'acceptation le plan bouge : le numéro est périmé, **en silence**. |
| 7 | **`etape = max(etape) + 1`** | Divergerait de l'éditeur manuel et déciderait en passant une règle que `tables.ts:398` dit n'avoir jamais été arbitrée. |
| 8 | **Renuméroter les étapes existantes** | Réécrirait des champs non ratifiés (KR-221). |
| 9 | **Monter `etape = rang+1` dans `brain/` + repointer `useEcriturePlan.ts`** — VETO | Met un fichier de `dossier-fiches` dans le lot contrat, alors que **les deux écrivains appliquent déjà la même formule** et que la promotion laisserait intact le vrai défaut. |
| 10 | **La sonde « aucun `etape:` littéral »** | `etape:` est la clé d'objet, nécessaire chez les deux écrivains : la sonde rougirait toujours. |
| 11 | **`si_bloque` dans la sortie de 3b** | Inatteignable sans `duree` : chaque acceptation allumerait le constat de `validate.ts` § 8 bis. |
| 12 | **Le 11ᵉ prédicat en 3b** | Motif `'schema'` mensonger, signature à élargir, et refus **par lot** ⇒ un doublon rejetable d'un clic deviendrait un **échec terminal**. Condition d'ouverture : une recopie **comptée**, puis `validerIntentions(brut, dossier, dejaEcrites)` + motif `'doublon'`. |
| 13 | **Un prédicat de SIMILARITÉ** | La frontière testable est la FORME (KR-229). |
| 14 | **Un 4ᵉ composant `LigneEtape.tsx`** | `LigneRepliqueProps` est déjà `{ texte, … }` sans membre propre aux répliques ; `si_bloque` sortant, ce serait `LigneReplique` à l'identique. |
| 15 | **Renommer `LigneReplique` → `LigneDecision` en 3b** — *retiré par moi* | Le réemploi coûte **zéro diff** ; le renommage ouvrirait trois surfaces vertes pour un nom. **Reporté.** |
| 16 | **`action`/`si_bloque` dans `LIBELLE_DES_CHAMPS`** | Veto de 3a non renégociable. |
| 17 | **Scinder les registres par rôle** | Leur totalité EST le garde et le support de KR-232. |
| 18 | **Déplacer `INVITES`/`GABARIT_SORTIE` hors de `worker/index.ts`** | Déplacer la chose mesurée dans le lot qui la mesure rend le garde **inerte en le laissant vert**. |
| 19 | **Scinder `CopiloteService.ts` en 3b** | Condition d'ouverture = la CINQUIÈME branche. |
| 20 | **Un plafond de document sur `plan_actions[]`** | Aucune règle arbitrée ; l'inventer la déciderait en passant. |
| 21 | **Garder le prédicat (8) à MAX=1** | **Inatteignable ⇒ supprimé, non neutralisé** — famille `'rang-inconnu'`/BUG-084/KR-235. |
| 22 | **Rendre `PropositionPlan.actions` scalaire à MAX=1** | La forme liste permet de **REFUSER** une réponse à deux éléments au lieu d'en jeter un (KR-230). |
| 23 | **Recopier `max_tokens: 400` de 3a** | Mesure différente ⇒ **200** ; recopier en ferait une valeur non mesurée. |
| 24 | **Recopier le budget de `personnage-repliques`** | Il se **MESURE** dans le lot, neuf chemins assertés non vides d'abord. |
| 25 | **Un `Record<RoleCopilote, …>` générique pour schémas et bornes** | TL3a-6 tient. |
| 26 | **Renommer `CibleCopilote`** / **union étiquetée en 3b** | Condition non échue : c'est le **troisième** synonyme (3c) qui déclenche la bascule. |
| 27 | **Un lot de scission séparé** | Propriété non exclusive ; la séparation s'obtient **dans le temps** (A / B). |
| 28 | **Trois lots ou plus** | Lot 2 a rétréci à 7 fichiers ; un 3ᵉ lot n'aurait aucun fichier propre. |

## G. Deux points de cycle, hors lots

1. **Le `goal` doit être réécrit AVANT la première ligne de code.** Ce qui est neuf, et ce dont 3c a besoin : **l'unité acceptée est une sous-entité que le CODE construit** — `{ etape, action }`.
2. **Le budget de contexte est la contrainte la plus dure et n'est dans aucun lot.** `code-knowledge.json` à ~72 o : 3b **ne peut pas ajouter un seul KR** sans compacter d'abord — or elle en produira au moins un. **Les deux compactions sont dues dans l'étape 4 de CE cycle.**
