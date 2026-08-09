# Tour 2 — Tech Lead

## Contre-lecture — `bascule-editeur` it2/3

Notes lues en entier : `tour1-pm-produit.md`, `tour1-ux-designer.md`, `tour1-qa.md`, `tour1-narratif-ia.md`.

---

### 1 · À la QA, nommément — exporter `FORME_ID_DOSSIER` (proposition 1, annexe l. 14)

**Je refuse l'export, et le déplacement dans `identifiers.ts`. Mais tu as raison sur un trou que ma note de tour 1 ne couvrait pas — ce n'est simplement pas celui que tu nommes.**

**Le masquage que tu redoutes n'existe pas, et je peux le démontrer par le code.** `validate.ts:293` : `if (typeof idDossier === 'string' && idDossier.trim() !== '' && !FORME_ID_DOSSIER.test(idDossier))`. Les trois façons dont un `id` peut être fautif sont **exhaustivement couvertes, sans recouvrement** :

| `id` produit | code levé | table source |
|---|---|---|
| absent, non textuel, vide ou blanc | `champ-requis-vide` | `CHAMPS_REQUIS` l. 81 `{path:'id'}` |
| chaîne non vide hors forme (dont tout `_` de `createId()`) | `identifiant-invalide` | `FORME_ID_DOSSIER` |
| conforme | aucun | — |

Il n'existe donc **aucun id fautif qui laisse `errors` vide**. Le round-trip est strictement plus fort qu'un test de regex : il attrape aussi les modes que la regex ne voit pas.

**Corollaire impératif, et c'est une correction à ta ligne 14 comme au cadrage du tour 2 : l'assertion ne peut pas être « aucune erreur `identifiant-invalide` ».** Formulée ainsi elle passe au vert sur un id **vide** (qui lève `champ-requis-vide`), c'est-à-dire sur le pire cas. L'assertion est `expect(v.errors).toEqual([])`, jamais l'absence d'un code. Une assertion négative sur un code est un test qui se croit ciblé et qui est aveugle à côté.

**Ce que tu as raison de ne pas compter comme vérifié — et ce n'est pas la duplication de regex.** Un round-trip sur `create()` teste **un tirage** d'un générateur **aléatoire**. Deux branches y vivent (`utils/id.ts:7-11`) et jsdom n'en exerce qu'une : `crypto.randomUUID` existe en Node 18+, donc la branche de repli `` `${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}` `` **n'est jamais parcourue par aucun test de ce dépôt, aujourd'hui**. C'est là qu'est le risque KR-177 résiduel, pas dans la regex.

**Ma concession, en trois gestes, aucun n'exportant la forme :**

1. **Extraction, avec deux appelants immédiats** — `src/brain/utils/id.ts` :
   ```ts
   /** L'ENTROPIE seule : minuscules, chiffres et tirets — jamais de séparateur. */
   export function randomToken(): string
   export function createId(prefix = 'id'): string { return `${prefix}_${randomToken()}` }
   ```
   `createDossierId()` **est** `randomToken()`. Sortie de `createId` inchangée octet pour octet (aucun risque sur `BookService`/nœuds/arêtes). KR-177 cesse d'être une divergence à surveiller : le `_` devient **la seule différence, visible dans un seul fichier**. Ce n'est pas une abstraction à un appelant — c'est une déduplication à deux appelants qui supprime une expression recopiée.
2. **La branche de repli devient atteignable et testée** — `src/brain/utils/id.test.ts` (N) : `Object.defineProperty(globalThis.crypto, 'randomUUID', { value: undefined, configurable: true })`, puis 50 tirages, tous distincts, tous conformes — **via `validateDossier`**, pas via une regex recopiée.
3. **Échantillonnage** — `DossierService.test.ts` : 50 `create()`, `errors` vide pour chacun, `id` tous distincts.

**Pourquoi je refuse quand même l'export.** (i) `FORME_ID_DOSSIER` n'est pas une forme d'identifiant d'entité : elle n'a pas d'espace de noms, et sa docstring (l. 95-105) dit qu'elle est plus stricte **parce que cette valeur devient une clé de stockage**. La déplacer dans `identifiers.ts` mettrait une contrainte de persistance dans le module des références intra-document — deux sujets, un fichier. (ii) Exportée, elle invite un jour une feature à pré-valider un id côté écran : une seconde porte, en amont du validateur, qui divergera. La règle a un seul lieu d'application et c'est `validateDossier`.

**Ta correction de type, au passage** (annexe l. 13) : `exportDossier()` rend `Dossier | null`, pas une chaîne — `JSON.parse(...)` ne compile pas. Le round-trip qui prouve le plus est celui du magasin :

```ts
const d = dossiers.create('Le sceau')
const relu = createBrain().dossiers.get(d.id)      // « rechargement » : re-lecture + re-validation
expect(relu).not.toBeNull()
const v = validateDossier(dossiers.exportDossier(d.id))
expect(v.errors).toEqual([])
expect(v.warnings).toEqual([])
```

---

### 2 · À Narratif & IA — `MARQUEUR_A_ECRIRE` oui, `estTexteDeSeed()` non

**Position : j'exporte la CONSTANTE, je rejette le PRÉDICAT.** C'est exactement la position que le cadrage propose, et elle est cohérente avec ma doctrine sur `createDossierId`, pas en tension avec elle. La règle que j'applique, dite une fois pour toutes :

> **On extrait pour supprimer une duplication, ou pour donner un domicile à quelque chose. Jamais pour donner un second nom à une ligne.**

- `MARQUEUR_A_ECRIRE` : **deux consommateurs dès ce lot** (le seed en production, son test qui vérifie que chaque texte le porte) et le seul autre chemin est de taper `'⟨à écrire⟩'` deux fois. Duplication supprimée → export.
- `createDossierId` publique : **un consommateur**, et rien de dupliqué — un second nom sur une ligne d'entropie. → reste privée. (`randomToken`, lui, en a deux et supprime une duplication : même règle, résultat inverse, et c'est le signe que la règle discrimine.)
- `estTexteDeSeed()` : **zéro consommateur**, et tu l'écris toi-même (« Ce que je ne demande pas à cette itération : ni détecteur, ni alerte, ni garde »).

**Et j'ajoute un motif qui n'est pas du YAGNI paresseux : ses deux futurs lecteurs ne veulent pas la même fonction.** La n° 7 a besoin d'un **balayage** — « quels champs portent encore le marqueur, avec leur `path` et leur `location` », c'est-à-dire un producteur de `DossierIssue[]` sur `DESTINATION_DES_CHAMPS`. La n° 9 a besoin d'une **porte booléenne** sur un champ unique (`texte_ouverture_joueur`). L'écrire aujourd'hui, c'est en choisir un des deux à l'aveugle, et le premier arrivé héritera d'une signature choisie par quelqu'un qui n'avait pas son problème. Précédent explicite du dépôt : `brain/index.ts` l. 128-139 retient `PREDICATES`, `validateExpr`, `DELTAS`, `collectDeltaRefs` **hors du baril** tant qu'aucun consommateur réel n'existe, et `deltas.test.ts` tient la propriété par un test-grep — « un registre exporté trop tôt se fait lire par des branches `if` avant d'avoir son `Select` ».

**Ce que je te donne à la place du prédicat, et qui est plus fort que lui pour la propriété que tu cherches** (« une seule chaîne, un seul endroit ») :

- **Domicile** : `src/brain/dossier/amorce.ts` (N, lot contrat) porte `MARQUEUR_A_ECRIRE`, les quatre textes (`AMORCE`), et `construireAmorce(id, titre, now): Dossier`. Il vit dans `brain/dossier/`, à côté de `tables.ts` / `destinations.ts` qui les contraignent — là où la n° 3 (qui les réécrit), la n° 7 (qui les détecte) et la n° 9 (qui les refuse) iront chercher. `DossierService.create()` l'appelle ; le service ne grossit pas d'un littéral de quarante lignes.
- **Non ré-exporté depuis `brain/index.ts`** : aucun consommateur de feature en it2. Même traitement que `DELTAS`.
- **La garantie, tenue par un test et non par une convention** — `amorce.test.ts` (N) : (a) chacun des quatre textes commence par `MARQUEUR_A_ECRIRE` ; (b) **test-grep : le littéral `'⟨à écrire⟩'` n'apparaît nulle part ailleurs dans `src/`.** Le jour où la n° 7 voudra retaper la chaîne chez elle, elle devra **supprimer un test** — donc prendre la décision au lieu de la subir. C'est la formule exacte de `deltas.test.ts`, et elle garde ta propriété mieux qu'un prédicat que personne n'appelle.

**Tes textes exacts sont retenus tels quels** (annexe, l. 36-39). Contrôle de compatibilité fait : ≤ 20 mots chacun, donc `texte-trop-long` (budget 600 sur `canon.mj` / `canon.partage`) ne tire pas — mon assertion `expect(v.warnings).toEqual([])` du § 1 survit, et c'est elle qui garantit qu'un seed n'avertit jamais à sa naissance.

---

### 3 · Le `nom` du lieu, et son identifiant

**(a) `nom` OMIS — objection (b) acceptée intégralement, et je la durcis d'un cran depuis mon poste.**

Mon exemple de tour 1 (`nom: AMORCE.nom_lieu`) est **corrigé**. Ton motif suffit (`types.ts:88` « absent n'est pas vide » ; le repli « Lieu n°1 (sans nom) » est une sortie de `localiserEntite()` **au moment du rapport**, jamais une valeur à écrire — la poser donnerait « Lieu « Lieu n°1 (sans nom) » »). J'en ajoute un qui relève de mon domaine et qui rend l'omission **obligatoire, pas préférable** : `nom` est de destination `auteur`, donc c'est le **seul champ du seed qui ne peut pas porter `MARQUEUR_A_ECRIRE`** — un nom d'affichage préfixé de `⟨à écrire⟩` polluerait toutes les listes de la n° 5. Un `nom` semé serait donc la seule chaîne du seed **indétectable** par l'instrument unique que la n° 7 construira. Le peupler, c'est percer d'un trou la garantie du § 2 dans le même geste où on la pose.

Forme retenue : `lieux: [{ id: LIEU_INITIAL }]`.

**(b) L'identifiant : ni `lieu.premier-lieu`, ni `lieu.point-de-depart` — je propose `lieu.amorce`.**

Ton objection tue la mienne : `lieu.premier-lieu` décrit un **rang**, faux dès que l'auteur insère ou réordonne. Mais ton propre principe (« l'identifiant ne se dérive jamais d'une propriété qui bouge, sinon `depart.lieu_id` devient pendant ») condamne aussi `lieu.point-de-depart` : il décrit un **rôle**, et le rôle bouge — le jour où l'auteur pointe `charpente.depart.lieu_id` sur un autre lieu, `lieu.point-de-depart` est un lieu qui n'est pas le point de départ. Un identifiant ne se réécrit jamais ; il ne doit donc décrire **que ce qui ne peut pas changer**, c'est-à-dire son **origine**.

`lieu.amorce` : ce lieu **a été** semé avec le dossier, définitivement, quel que soit son rang, son rôle ou son nom. Il parle en outre le même mot que `AMORCE` / `construireAmorce` / `MARQUEUR_A_ECRIRE` — le seed a un vocabulaire, pas trois. Conforme à `FORME_IDENTIFIANT` (`^(pnj|lieu|…)\.[a-z0-9-]+$`), statique, jamais dérivé d'un nom.

**Ce n'est pas un veto** : `lieu.point-de-depart` ne casse aucun invariant, et si le comité le préfère je m'y range sans réserve. Je demande seulement que la **règle** soit écrite dans le plan, parce qu'elle resservira à chaque feature qui sème une entité (n° 3 à n° 6) : *un identifiant ne décrit jamais un rang, un rôle ni un nom — seulement son origine.*

---

### 4 · La carte cliquable — je maintiens le lot 3, et je réponds à l'UX nommément

**UX, annexe E** : « la réintroduire ici sans nouvel arbitrage reviendrait sur une décision déjà écrite dans `resolved_decisions` ».

**Le fait est exact, la conclusion ne suit pas — et je suis bien placé pour le dire : c'est moi qui ai écrit ce report.** `bascule-editeur-it1/tour1-tech-lead.md`, annexe D, première ligne : *« Aucune navigation depuis la carte. La route `{name:'dossier'; dossierId}` est un contrat d'**it2** : `src/brain/Router.ts` n'est dans aucun lot d'it1. »* Le report était **motivé par l'inexistence de la route**, et nommait it2 comme le moment où elle naîtrait. It2 est l'itération qui crée la route. **Rouvrir un report dans l'itération qui supprime sa cause, c'est le report qui fonctionne — pas un retour sur décision.** Un `REPORTÉ` n'est pas un `REJETÉ` ; la skill les distingue précisément pour que celui-ci ne se fige pas en celui-là par prescription.

Sur ton second motif (le goal brut ne le demande pas, une phrase sans « et ») : c'est du domaine PM, le PM a tranché en le rattachant, et je ne le conteste pas depuis mon poste.

**Ce que j'apporte à l'arbitrage, et c'est le seul poids que j'ai le droit d'y mettre : le lot 3 est détachable à coût nul.** Ses quatre fichiers sont tous dans `book-library`, aucun n'est nommé par un autre lot, et il ne consomme rien du lot 2 (il navigue, il ne rend pas l'écran). Si le tour 3 tranche pour l'UX, les lots 1 et 2 sont inchangés **octet pour octet** et le lot 3 part en it3 tel quel. **J'ai rendu la décision réversible pour qu'elle puisse être prise tard** — c'est ma contribution, pas une pression.

**J'adopte ton contrat de design en entier** (annexe E, second paragraphe), et il est meilleur que mon esquisse de tour 1 : pas de `role="button"` sur l'`<article>` — ton relevé est juste, `NodeCard` peut se le permettre parce qu'il n'imbrique **aucun** `<button>` natif, alors que `DossierCard` en porte deux ; seul le bloc titre+date devient un `<button type="button">` stylé en texte, frère et non parent des deux autres, `<span>` inchangé sur la branche `lisible: false`. **Et j'ajoute l'argument d'architecture qui le rend sûr : l'affordance vit dans la branche `lisible: true` de l'union discriminée, donc c'est le TYPE qui interdit d'ouvrir un illisible, pas un `if` de rendu.** Le test que la QA demande (annexe l. 21 : carte illisible sans `role=button`, `{Enter}` sans effet, `router.current()` inchangé) devient une non-régression sur ce typage, pas une garde de runtime.

---

### 5 · Réponse à la QA sur KR-071 — proposition 3, qui empiète frontalement sur mon domaine

Ta proposition 3 et ton test associé (annexe l. 18) demandent : *monter `<App/>`, naviguer sur la route dossier, `dossiers.remove(id)`, `expect(router.current()).toEqual({name:'home'})`*. **Ce test assert un comportement que j'ai explicitement refusé de construire en tour 1** (annexe D : aucune garde `dossier:deleted` dans `App.tsx`). Je ne peux pas le laisser passer sans trancher.

**Je maintiens le refus de la garde, et je remplace le critère par un plus fort.** Une garde d'événement couvre **un** chemin : une suppression qui survient pendant qu'on regarde. Or `remove()` est le seul émetteur de `dossier:deleted`, et sa seule affordance vit sur l'accueil — depuis la route `dossier`, elle est **inatteignable**. Ton test ne pourrait donc être vert qu'en appelant le service à la main, c'est-à-dire en testant un chemin qu'aucun auteur ne peut emprunter.

Le repli `dossier === null` de l'écran (UX § D : « Dossier introuvable. » + `← Mes dossiers`) couvre **tous** les chemins, y compris celui qu'aucun événement ne signale jamais : un dossier devenu **illisible** par resserrement de schéma — `get()` rend `null`, aucun événement ne part, et c'est précisément la famille de pannes de BUG-048/KR-179 que cette feature a déjà rencontrée deux fois. Le garde-fou vit dans l'écran, où il est testable en montant la route sur un id inconnu.

**Ce que je retiens de ta proposition 3, et qui est indispensable :** un **retrait** de code n'a aucun critère observable, et le grep d'it3 (`books.` / `BookService` / `TreeCanvas`) ne le verra jamais. J'adopte donc ta seconde assertion **verbatim**, et c'est elle qui devient le critère KR-071 :

```ts
expect(fs.readFileSync('src/App.tsx', 'utf8')).not.toContain("'book:deleted'")
```

Précédent d'instrument déjà en place dans ce dépôt : `dossier-format/tests/featureDirs.test.ts` lit `src/features` sur disque. Hébergement : `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx`, sous un `describe('racine de composition')` — lot 2, qui possède `App.tsx`. Pas de fichier dédié pour un seul grep.

**Tes deux autres cas limites sont retenus** : titre vide/espaces (revalidation du patron existant, pas un test neuf) et double soumission (`dblClick` → `dossiers.list()` de longueur 1) — lot 2.

**Ton objection principale** (« aucun marqueur observable pour l'écran minimal », et ton « ce que je n'ai pas pu vérifier ») **est close par l'annexe D de l'UX**, qui fixe le contenu au mot près. Le plan de lot doit la citer verbatim, pas la paraphraser.

---

### 6 · Statut de mes trois objections de tour 1

| # | Objection | Statut |
|---|---|---|
| 1 | Critère 6 (« à la création **ET à la duplication** ») intestable ; `createDossierId()` publique = dette | **MAINTENUE, et satisfaite.** Le PM retire la clause de duplication (sa contrepartie nommée). La privauté de `createDossierId` est maintenue et **renforcée** par l'extraction de `randomToken` (§ 1), qui répond à la QA sans exporter quoi que ce soit. |
| 2 | Le seed écrit dans deux champs de registre joueur | **DURCIE**, par la note de Narratif & IA. `destinations.ts:157-160` classe `charpente.depart.texte_ouverture_joueur` en **`moteur`** — « émise VERBATIM par le moteur », sans passer par le modèle. Ce n'est donc pas « un texte qu'un joueur pourrait entendre », c'est **littéralement la première phrase de toute partie lancée sur un dossier non édité**. Mon tour 1 sous-estimait la portée. `MARQUEUR_A_ECRIRE` cesse d'être une préférence de rédaction et devient **une exigence du lot contrat**. |
| 3 | « feature n° 9 » ne peut pas être en dur dans `brain/components/EditorTopBar.tsx` | **MAINTENUE**, et l'UX y converge indépendamment (son annexe C). **Je retire mon nom au profit du sien** : la prop s'appelle **`previewDisabledReason`**, pas `previewDisabledHint`. Un nom doit gagner avant le figement du contrat, c'est sa surface, et deux notes qui nomment différemment la même prop est exactement ce qu'un essaim ne peut pas rattraper. |

---

### 7 · Lots révisés

Le **nombre de lots ne change pas (3)**, la propriété reste disjointe. Seul le lot 1 grossit de quatre fichiers, tous conséquences des § 1 et § 2.

| Lot | Type | Fichiers (N créé · R remplacé · D supprimé) | Vérifiable seul |
|---|---|---|---|
| **1 — `contrat-dossier-create`** *(seul, EN PREMIER)* | `contrat` | **R** `src/brain/Router.ts` · **R** `src/brain/DossierService.ts` · **R** `src/brain/DossierService.test.ts` · **R** `src/brain/components/EditorTopBar.tsx` · **N** `src/brain/components/EditorTopBar.test.tsx` · **R** `src/brain/utils/id.ts` *(§1 — `randomToken`)* · **N** `src/brain/utils/id.test.ts` *(§1 — branche de repli)* · **N** `src/brain/dossier/amorce.ts` *(§2)* · **N** `src/brain/dossier/amorce.test.ts` *(§2 — marqueur + test-grep)* | 50 `create()` : `errors` **et** `warnings` vides, ids distincts ; branche de repli de `randomToken` forcée ; `get(create(t).id)` non nul ; ordre persistance → `dossier:created` ; titre vide → `TITRE_PAR_DEFAUT` ; `'⟨à écrire⟩'` absent de tout `src/` hors `amorce.ts` ; `MARQUEUR_A_ECRIRE` absent de `brain/index.ts` ; barre sans `nodeCount`/`onAddNode` ; `title` du bouton désactivé |
| **2 — `creation-et-ecran-dossier`** *(contrat figé)* | feature | **N** `src/features/book-creation/hooks/useCreateDossier.ts` · **N** `.../components/CreateDossierEntry.tsx` · **N** `.../components/NewDossierButton.tsx` · **N** `.../components/NewDossierDialog.tsx` · **N** `.../tests/createDossierFlow.test.tsx` · **N** `.../tests/NewDossierDialog.test.tsx` · **R** `.../index.ts` · **D** `.../hooks/useCreateBook.ts`, `.../components/CreateBookEntry.tsx`, `.../components/NewBookButton.tsx`, `.../components/NewBookDialog.tsx`, `.../tests/createFlow.test.tsx`, `.../tests/NewBookDialog.test.tsx` · **N** `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · **N** `src/features/bascule-editeur/index.ts` · **N** `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` · **R** `src/App.tsx` | `['dossier:created','dossier:opened']` dans l'ordre, magasin déjà écrit au premier ; écran rendu au mot près selon **UX § D** ; « Aperçu du jeu » désactivé + `title` exact ; route `dossier` inconnue → « Dossier introuvable. » + retour ; **grep KR-071** `App.tsx` sans `'book:deleted'` ; double soumission → 1 dossier |
| **3 — `ouvrir-un-dossier-depuis-la-bibliotheque`** *(contrat figé ; PARALLÈLE au lot 2 ; DÉTACHABLE)* | feature | **R** `src/features/book-library/components/DossierCard.tsx` · **R** `.../components/LibraryScreen.tsx` · **R** `.../hooks/useDossierLibrary.ts` · **R** `.../tests/dossierLibrary.test.tsx` | `<LibraryScreen/>` monté **directement** (pas `<App/>` — cf. tour 1 § B.3) : clic titre → `router.current()` = `{name:'dossier', dossierId}` ; `dossier:opened` **avant** la navigation ; carte `lisible:false` sans `role=button`/`tabIndex`, `{Enter}` sans effet, route inchangée |

**Deux points à ne pas laisser un ouvrier « corriger » de lui-même** :

- **`create()` rend le seed non gelé**, quand `get()` rend un document gelé. Asymétrie **connue et acceptée** : la faire disparaître demanderait de passer le seed par `validateDossier` dans le service, ce qui crée une branche `null` qu'aucun test ne peut atteindre. La validité est tenue par le test du § 1, pas par une garde de runtime. L'unique appelant de production ne lit que `.id`.
- **`create()` ne contrôle pas l'occupation de la clé** (`cleOccupee`) : branche inatteignable avec un uuid.

**Inchangés, et c'est la preuve du respect de la décision A du 2026-08-04** (corollaire non négociable, roadmap l. 156) : `src/brain/dossier/types.ts`, `destinations.ts` et `validate.ts` ne sont dans **aucun** lot. Aucun champ n'est ajouté au schéma par cette itération — `amorce.ts` **consomme** les tables, il n'en écrit pas.

Restent également hors lots : `src/EditorScreen.tsx`, `src/brain/index.ts` (aucun export neuf), `tree-canvas/**`, `play-mode/**`, `dossier-format/**`, `src/player/**`, `.eslintrc.cjs`. Les fichiers de documentation (`specification.json` ×3, `CHANGELOG.md`, `README.md`, `features_history.json`, `code-knowledge.json`, `bug_history.json`, `docs/ROADMAP-BASCULE-IA.md`, `package.json`) restent à l'orchestrateur, étape 4 — aucun lot ne les nomme, aucune fusion ne s'y joue.

**À porter en `known_risks` / correction de spec** (relevé par Narratif & IA, que je contresigne) : **KR-178 est faux tel qu'il est écrit** — « repli "Lieu n°1 (sans nom)" » y est présenté comme une valeur à semer, alors que c'est une sortie de `localiserEntite()` au moment du rapport. À corriger dans la spec avant l'ouverture du lot 1, sinon le dev-contrat sèmera littéralement la chaîne.

**VERDICT — recevable sous réserve.** Réserves à lever avant l'ouverture du lot 1, toutes fermées ci-dessus sauf deux qui appartiennent à l'orchestrateur : (i) le nom d'identifiant du lieu semé (`lieu.amorce` proposé, `lieu.point-de-depart` acceptable — la **règle** doit être écrite dans les deux cas) ; (ii) l'arbitrage PM/UX sur le lot 3, que j'ai rendu réversible à coût nul.
