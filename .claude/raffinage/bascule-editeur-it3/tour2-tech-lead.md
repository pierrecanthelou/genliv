Contre-lecture Tech Lead — bascule-editeur it3, tour 2.

## 1. À la QA — le chiffre, corrigé et désambiguïsé

**Ton 3 suites / 37 tests est juste ; mon « ~15 » était faux.** Comptage mesuré à l'instant (`^\s*(it|test)\(` sur `C:\Users\pierr\Desktop\genliv\src\features\tree-canvas\tests\`) : `TreeCanvas.test.tsx` **10**, `geometry.test.ts` **25**, `nodeView.test.ts` **2** = 37. Le nombre à retenir pour le rayon de souffle est **10**, tous dans le seul `TreeCanvas.test.tsx`.

En revanche une de tes prémisses est fausse, et elle inverse ta conclusion : **`TreeCanvas.test.tsx` rend bien `<App/>`** — `import { App } from '../../../App'` (ligne 4), `render(<BrainProvider><App /></BrainProvider>)` lignes 12-16, 127-131, 150-154, après `navigate({ name: 'editor' })` lignes 9 et 126 et `createBrain({ initialRoute: { name: 'editor', … } })` ligne 149. Ces 10 tests traversent donc `App.tsx:21-24` → `C:\Users\pierr\Desktop\genliv\src\EditorScreen.tsx`, et assertent sa composition : `2 nœuds` (:28), `Ajouter un nœud` (:66), `Compacter` (:108, :156 — `SpacingToggle` passé par `EditorScreen` dans `actions`). Vider le fichier les met au rouge **exactement comme** le supprimer.

Deux anneaux distincts, deux déclencheurs différents — c'est la distinction qui manquait à nos deux notes :

| Anneau | Déclencheur | Dégât mesuré |
| --- | --- | --- |
| A | toucher `src/EditorScreen.tsx` (vidage **ou** suppression) | 10 tests rouges (`TreeCanvas.test.tsx`). `geometry` (25), `nodeView` (2), `ConflictDialog` (2) : intacts |
| B | retirer la variante `Route.editor` | échec `tsc` en **production** : `tree-canvas/components/TreeCanvas.tsx:51`, `cloud-sync/components/ConflictDialog.tsx:14`, + les 4 suites |

Tu as raison sur `ConflictDialog.test.tsx` : il rend `<ConflictDialog/>` seul (lignes 32-36, 52-56), jamais `<App/>` — il ne dépend **que** du type `Route`, donc de l'anneau B, pas de l'anneau A. Il entre dans la liste surveillée, motif corrigé.

Correction d'honnêteté sur ma propre note : je disais ces tests « seule couverture de Dagre ». Faux — `geometry.test.ts` (25) couvre les fonctions pures. Ce que les 10 couvrent seuls, c'est l'**intégration** : viewport persisté au remontage, drag-vs-select, anneau KR-145 sélectif, aller-retour du mode d'espacement. Ça ne change pas le verdict : les ré-héberger, c'est réécrire 10 tests d'intégration dans une feature que l'auteur du lot ne repointera pas.

J'adopte ta proposition 2 telle quelle (baseline 3/37 + `git diff --stat` vide sur les 3 chemins + `ConflictDialog.test.tsx`) et ta proposition 3 (le grep `.length`/`.filter`/`.reduce` hors `sections.ts`) — ce dernier devient exécutable justement parce que `compte()` rend une `string` : un recalcul local produirait un nombre, pas le texte.

## 2. Au PM — ton « vidé, pas supprimé » : intention retenue, moyen refusé

Ta lecture de KR-181 est la bonne et je m'y range : **aucun critère de cette itération n'exige la démolition**, et trancher « supprimé » en cours de lot serait gonfler le goal après raffinage. Mais « vidé » ne réalise pas ton intention : les 10 tests ci-dessus n'assertent pas le *contenu* de `EditorScreen.tsx`, ils assertent ce qu'il *compose*. Le vider coûte le même prix que le supprimer (10 tests d'intégration à réécrire dans `features/tree-canvas/`, hors périmètre), sans le bénéfice de la démolition. Ton quatrième élément de facto de KR-181 tient — je le durcis d'un cran : `EditorScreen.tsx`, la variante `Route.editor` **et** `src/App.tsx` restent **intouchés à l'octet près**, tous trois rendez-vous de la n° 9.

Et oui, le critère reformulé répond à ta préoccupation : **« aucun code de production ne navigue vers `{ name: 'editor' }` »** est une preuve de *cessation d'appel*, pas une démolition — donc zéro fichier de production modifié, zéro valeur d'auteur dépensée en chantier d'architecture. Mesuré à l'instant : les seuls sites de navigation vers `'editor'` dans `src/` sont `TreeCanvas.test.tsx:9,126,149` et `ConflictDialog.test.tsx:31,51` — **tous des tests**. Le critère est déjà vrai, il est posé comme **cliquet anti-réintroduction**, et la vraie clause active de l'itération est sa jumelle positive : aucune occurrence de `TreeCanvas` / `books.` / `BookService` dans `src/features/bascule-editeur/**` — un fichier que le lot 2 possède.

## 3. À l'UX — `draggable?: boolean` : je maintiens l'omission, et pour ton motif

Nous voulons **le même rendu** : pas de poignée. Ton argument (« une affordance qui ne glisse pas ment ») est le mien, mot pour mot — le désaccord ne porte que sur l'existence de l'**interrupteur**. Trois raisons de ne pas l'écrire aujourd'hui :

1. `draggable` n'aurait, dans cette itération, qu'une seule valeur passée : `false`. La branche `true` est soit non testée (trou dans un composant `brain/`), soit testée par un test qui est son propre unique appelant — l'abstraction à un seul appelant que je suis censé surveiller chez moi.
2. **Ce n'est pas la forme dont la n° 5 aura besoin.** Réordonner des fiches demande la poignée *et* le câblage (`onReorder`, pointeur, réordonnancement clavier). `draggable` deviendrait alors soit redondant avec la présence de `onReorder`, soit une seconde source de vérité sur « cette ligne glisse-t-elle ». Mieux vaut une prop juste écrite par la n° 5 qu'une prop héritée à réconcilier.
3. **La friction que tu crains est déjà nulle** : le slot `leading` accepte n'importe quel `ReactNode` — un futur consommateur peut y poser sa poignée sans toucher `brain/`. Il n'y a rien à débloquer.

Concession à coût zéro, pour que ta position soit tracée dans le code et pas seulement dans la revue : le lot 1 écrit dans `ListRow.tsx` un commentaire nommant la n° 5 propriétaire de la poignée `⠿` et de son câblage. Contrat inchangé, aucune branche morte.

## 4. Compteurs Canon/Départ — position tranchée : « — » constant, pour les deux

**Position finale : « — », et je rouvre le `resolved_decision` explicitement, pas silencieusement.** Le motif est une mesure postérieure à la décision, pas une re-litigation de goût.

`DossierService.get()` **re-valide** (`C:\Users\pierr\Desktop\genliv\src\brain\DossierService.ts:175-180` → `return validateDossier(brut).dossier`) et un `charpente.depart.lieu_id` pendant est **bloquant** (`src/brain/dossier/validate.test.ts:269` — « depart.lieu_id pendant est bloquant »). Conséquence : **tout `Dossier` que l'écran peut tenir en main a un départ qui résout**. La jambe « — » du couple « configuré »/« — » est inatteignable, et « configuré » affiché systématiquement est un voyant soudé au vert — pire que muet, car quand le linter n° 7 remplira le même slot d'un vrai état de complétion, cette cellule-là sera la seule dont le vert est une tautologie. L'orphelin, lui, est déjà exposé en amont et à un endroit réellement atteignable : `lisible:false` dans `DossierService.list()`.

**L'intention de la décision est conservée verbatim** (« jamais un pluriel de fiches qui mentirait sur sa nature ») ; seul le jeton change. Règle uniforme qui rend l'arbitrage non arbitraire : `compte()` rend une **quantité de fiches** ; une section qui n'est pas une collection (Canon, prose ; Départ, objet unique) n'a pas de quantité et occupe le slot réservé avec « — ». Zéro branche morte, zéro irrégulier.

Si le comité passe outre : « configuré » doit alors être **calculé** (`charpente.depart.lieu_id` résout dans `monde.lieux`), jamais constant, et son test doit fabriquer à la main un `Dossier` au départ pendant — **aucun test ne peut en obtenir un par `get()`**. C'est le prix, il est réel, je ne le recommande pas.

Clarification de contrat qui découle (mon domaine, un fait à écrire dans le plan) : **`compte()` alimente le Badge `trailing`, pour les dix, et rien d'autre.** Le `subtitle` reste la clé technique mono pour les dix. Ça réconcilie les deux affectations concurrentes du `design_contract` — le compteur de Jalons & fins (« 1 jalon · 1 fin ») part dans le trailing avec les autres, pas dans le sous-titre, et le slot « réservé au futur badge de complétion » est **le même** Badge, dont la n° 7 fera varier le `tone` : ni second badge, ni ligne redimensionnée.

## Statut de mes objections de tour 1

| Objection | Statut |
| --- | --- |
| Veto : ne pas toucher `src/EditorScreen.tsx` | **Maintenue**, motif corrigé (10 tests d'intégration, pas ~15 ; `geometry`/`nodeView` hors anneau) |
| Veto : ne pas retirer la variante `Route.editor` | **Durcie** — anneau B mesuré en production dans deux features hors périmètre, `ConflictDialog` confirmé par la QA |
| Critère n° 12 infaisable → réécriture en 3 clauses | **Maintenue, bloquante** |
| Compteur Départ « configuré » = branche morte | **Maintenue** et désormais tranchée (« — »), avec réouverture écrite du `resolved_decision` |
| Canon sans compteur arbitré | **Maintenue** — « — », même règle |
| `useOpenDossier` dans le lot contrat | **Maintenue, bloquante** — inchangée, personne ne l'a contestée |

## VERDICT

**Recevable sous réserve.** Bloquantes : (1) réécriture du critère n° 12 en trois clauses prouvables ; (2) `useOpenDossier` livré par le lot contrat. Tranchées par moi comme demandé : « — » pour Canon et Départ, `compte()` → trailing seul, `ListRow` sans prop `draggable`. **Veto maintenu** sur toute modification de `src/EditorScreen.tsx`, `src/App.tsx` et du type `Route`.

---

### Annexe B — découpage : **inchangé, 2 lots, exécution séquentielle**

Aucune des quatre réponses ne déplace un fichier. Pas de troisième lot (il aurait fallu la démolition d'`EditorScreen`, refusée). Rappel de la propriété exclusive :

| Lot | Type | Fichiers |
| --- | --- | --- |
| 1 `contrat-sections-listrow` | **contrat**, seul et en premier | N `src/brain/dossier/sections.ts` · N `src/brain/dossier/sections.test.ts` · N `src/brain/components/ListRow.tsx` · N `src/brain/components/ListRow.test.tsx` · N `src/brain/hooks.dossier.test.tsx` · R `src/brain/hooks.ts` · R `src/brain/components/index.ts` · R `src/brain/index.ts` |
| 2 `nav-sections-dossier` | feature, contrat figé | R `src/features/bascule-editeur/components/DossierEditorScreen.tsx` · N `.../components/SectionNav.tsx` · N `.../components/PanneauSection.tsx` · R `.../tests/dossierEditorScreen.test.tsx` · N `.../tests/demontageArbre.test.ts` |

Deux corrections par rapport à l'annexe B du tour 1 : `src/brain/Router.ts` **sort** du lot 1 (même pas un commentaire — le fichier est gelé) ; `demontageArbre.test.ts` porte les trois clauses du critère réécrit **et** le grep KR-013 de la QA.

**Fichiers gelés, propriété de personne, `git diff --stat` vide attendu** : `src/App.tsx`, `src/EditorScreen.tsx`, `src/brain/Router.ts`, `src/features/tree-canvas/**`, `src/features/cloud-sync/**`. C'est la baseline de non-régression de la QA, adoptée telle quelle.
