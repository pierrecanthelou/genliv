# Revue d'itération — `bascule-editeur` · itération 1

> Plan : `.claude/raffinage/bascule-editeur-it1.plan.md` (validé le 2026-08-08)
> Lots : 2 (`contrat-dossier-liste` livré par `dev-contrat`, `bibliotheque-dossiers` livré par `dev-lot`), exécution séquentielle, aucun worktree
> Intégration : `CONFORME` (0 correctif requis sur le code) · QA mode B : `RECEVABLE SOUS RÉSERVE` (3 réserves, toutes fermées avant cette revue — voir § Écarts assumés)

## En une ligne

L'auteur retrouve dans sa bibliothèque tout dossier d'aventure déjà importé — le consulter, le télécharger, le supprimer, y compris un dossier devenu illisible qu'il peut désormais purger pour libérer son identifiant — ce qu'il ne pouvait pas faire hier (la bibliothèque ne listait que des `Book`, et un dossier illisible bloquait silencieusement tout réimport sur le même id, BUG-048).

## Critères (§ 6 du plan) — tous VÉRIFIÉS

| # | Critère | Preuve |
|---|---|---|
| 1 | Dossier lisible listé, trié, titre + date affichés | `DossierService.test.ts:199-222` (tri contrat) · `selectVisibleDossiers.test.ts` (tri unitaire) · `dossierLibrary.test.tsx:67` (titre) · `dossierLibrary.test.tsx:68` (date, `/Modifié le/` — ajouté en clôture de revue, absent du premier passage de QA mode B) |
| 2 | Dossier illisible : badge + explication + id, jamais `.titre` | `dossierLibrary.test.tsx:69-70` · union discriminée `DossierService.ts:20-22` refuse l'accès à `titre` sur la branche `false` À LA COMPILATION |
| 3 | Import refusé sur clé occupée par un illisible (BUG-048) | `DossierService.test.ts:241-268` |
| 4 | Téléchargement re-validé, absent (pas grisé) sur illisible | `dossierLibrary.test.tsx:72-77` |
| 5 | `remove()` : clé puis événement ; carte disparaît ; « Annuler » préserve | `DossierService.test.ts:270-288` (ordre) · `dossierLibrary.test.tsx:79-94, 97-108` (flux + annulation) |
| 6 | Avis nommé si des `Book` restent invisibles ; vide générique sinon | `dossierLibrary.test.tsx:116-127` |
| 7 | « + Nouveau livre » absent, seul « Importer un dossier » | `dossierLibrary.test.tsx:110-114` · `App.tsx` (plus de `createEntry` composé) |
| 8 | Non-propagation de `remove()` au KV distant épinglée | `DossierService.test.ts:337-370` |

## Diff par lot (vs § 5 du plan)

**Lot 1 — `contrat-dossier-liste`** (8/8 fichiers déclarés, tous `R`) : `src/brain/DossierService.ts`, `DossierService.test.ts`, `EventBus.ts`, `hooks.ts`, `index.ts`, `dossier/issues.ts`, `utils/download.ts`, `utils/download.test.ts`. Conforme, aucun écart.

**Lot 2 — `bibliotheque-dossiers`** (16/16 fichiers déclarés) : 7 nouveaux (`DossierCard.tsx`, `DeleteDossierDialog.tsx`, `useDossierLibrary.ts`, `selectVisibleDossiers.ts`, `dossierLibrary.test.tsx`, `selectVisibleDossiers.test.ts`), 6 supprimés (`BookCard.tsx`, `DeleteBookDialog.tsx`, `useLibrary.ts`, `selectVisibleBooks.ts`, `library.test.tsx`, `selectVisibleBooks.test.ts`), 3 réécrits (`LibraryScreen.tsx`, `App.tsx`, `style.css`) + `book-creation/tests/createFlow.test.tsx` (un seul `describe` réécrit, l'autre intact). Conforme, aucun écart.

**Hors-lot, documenté** : `.eslintrc.cjs` (`FEATURE_DIRS` += `'bascule-editeur'`, gap du cadrage antérieur aux deux lots, corrigé par l'orchestrateur entre le lot 1 et le lot 2) ; `docs/ROADMAP-BASCULE-IA.md` (corrections actées à la validation du cadrage de la feature — repointage de `tree-canvas` n°2→n°6, lecture-seule jalons/fins — appliquées avant le raffinage de cette itération, non redéclarées dans son plan).

## Ce qui a été refusé

- **Lister `Book` et `Dossier` ensemble dans `LibraryScreen`** (option b de la question ouverte au raffinage). Motif : deux sources de vérité dans une vue, et rapproche par la forme deux modèles que KR-167 interdit de convertir dans quelque sens que ce soit.
- **Réutiliser (importer) `retryButtonStyle`** pour le bouton de téléchargement. Motif : const privée d'un autre fichier de feature (`dossier-format/components/ImportDossierDialog.tsx`) — recréée localement (`telechargerButtonStyle`, valeurs identiques) plutôt qu'importée.
- **Fusionner la visibilité `list()` et le correctif `importDossier` de BUG-048 sous un seul test.** Motif (QA) : ce sont deux réparations distinctes ; un seul test aurait laissé le second non prouvé malgré une porte verte.
- **Créer `DossierResume` avec un compteur d'entités.** Motif : compter imposerait un `get()` (re-validation complète) par carte à chaque rendu de l'accueil — coût architectural refusé pour une simple liste.
- **Créer un 3ᵉ lot pour `book-creation/tests/createFlow.test.tsx`.** Motif : le test casse à cause du changement de composition d'`App.tsx`, propriété du lot 2 — un lot séparé aurait recréé une dépendance de coordination entre deux lots sur la même refonte, sans bénéfice d'isolation réel (zéro fichier de production de `book-creation` touché).

## Ce qui a été reporté

- **REPORTÉ itération 2** — la garde `book:deleted → accueil` dans `src/App.tsx` (KR-071) perd son déclencheur (la suppression passe désormais par `dossier:deleted`) mais son code reste en place, désormais inarmable ; le test-grep de l'itération 3 (`books.`/`BookService`/`TreeCanvas`) ne la détectera pas. Nettoyage assigné à l'itération 2, qui touche déjà `App.tsx`.
- **REPORTÉ n° 9** — la ligne d'avis « vos anciens livres restent stockés… » n'a pas de condition d'extinction automatique ; elle doit disparaître avec la démolition physique de `BookService` (KR-181).
- **Renommer/dupliquer un dossier, navigation carte→éditeur, puce de synchro par carte** — hors périmètre de cette itération, inchangé depuis le plan.

## Écarts assumés

- **Trouvé par QA mode B, fermé avant cette revue** : le critère #1 (date affichée) n'avait aucune assertion dédiée dans `dossierLibrary.test.tsx` au moment du contrôle d'intégration — une ligne (`expect(screen.getByText(/Modifié le/)).toBeInTheDocument()`) a été ajoutée après coup ; suite entière re-passée (730/730 verts, aucune régression).
- **`docs/ROADMAP-BASCULE-IA.md` touché hors déclaration de lot** : signalé par l'intégrateur et la QA comme non listé au § 5 — contenu vérifié légitime et déjà tracé dans `resolved_decisions` de `src/features/bascule-editeur/specification.json` ; documenté ici comme l'exception assumée que la QA demandait, au même titre que `.eslintrc.cjs`.
- **Compte de tests avant/après** (désaccord #9 du plan) : `library.test.tsx` (16) + `selectVisibleBooks.test.ts` (4) = 20 avant → `dossierLibrary.test.tsx` (6) + `selectVisibleDossiers.test.ts` (6) = 12 après. Net −8, entièrement attribuable au hors-périmètre déjà nommé (renommer/dupliquer, ouverture au clic, puce de synchro par carte) — classification complète dans `.claude/raffinage/bascule-editeur-it1/tour2-tech-lead.md`, annexe B.

Aucun blocage non résolu.

## Porte qualité

- Prettier `--check`, `tsc --noEmit`, `npm run lint` : verts (1 warning préexistant hors périmètre, `src/player/components/CharacterCreationScreen.tsx`).
- `npm test` : **50 suites / 50, 730 tests / 730**, aucune régression.
- `npm run test:mutation` : sans objet — confirmé par grep, aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) ni aucun registre de la table dorée n'est touché par cette itération.

## Budget de contexte (Build Steps § 4)

Relevé après les écritures de cette itération (`wc -c`, 1 kio = 1024 o) :

| Fichier | Mesuré | Plafond | Statut |
| --- | ---: | ---: | --- |
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 070 o | 46 080 o | inchangé, sous plafond |
| `code-knowledge.json` | 76 627 o | 76 800 o | +6 KR (177-182), corrigés puis compactés au vol (2 passes de revue de PR) pour rester sous plafond |
| `bug_history.json` | 56 314 o | 56 320 o | BUG-059 étendu (findings de la revue de PR, sévérité relevée à `major`) + BUG-048 fermé en place, compacté au vol à chaque passe |
| `features_history.json` | 6 220 o | 15 360 o | inchangé |
| `src/features/bascule-editeur/specification.json` | 31 336 o | 66 560 o | neuf, large marge (2 passes de corrections de la revue de PR) |
| `src/features/book-library/specification.json` | 15 193 o | 66 560 o | + bloc de supersession (revue de PR tech-lead), large marge |
| `docs/ROADMAP-BASCULE-IA.md` | 34 468 o | 35 840 o | +2 lignes (statut 1/3, corrections de cadrage déjà actées) |

`code-knowledge.json` et `bug_history.json` ont chacun été réécrits (contenu corrigé, pas retiré) puis leur formulation resserrée pour rester sous leur plafond, à chaque passe de revue de PR qui les a fait grossir à nouveau — jamais desserré, conformément à la doctrine. Les autres fichiers du tableau ne portent aucune compaction. Aucun fichier n'a franchi son plafond dans la version livrée.

## RETOUR-COMITÉ

- Le découpage en 2 lots stricts (contrat seul puis feature) a tenu sans réajustement une fois le tour 2 clos — mais le tour 2 a lui-même déplacé un fichier (`createFlow.test.tsx`) dans le lot 2 après la clôture du tour 1 : **un raffinage qui touche une composition-root (`App.tsx`) doit chercher ses effets de bord dans les tests des AUTRES features dès le tour 1**, pas seulement au tour 2. Le tech-lead l'a trouvé lui-même en relisant son propre risque — la relecture défensive du tour 2 a fonctionné, mais elle aurait dû être inutile.
- Le gap `FEATURE_DIRS` (feature créée au cadrage, jamais déclarée) est un défaut d'outillage récurrent nommé par le roadmap lui-même (« la première feature créée sans être ajoutée à cette liste sera silencieusement exemptée ») : **`/cadrer` devrait déclarer la feature dans `FEATURE_DIRS` au moment où il crée le dossier `src/features/<feature>/`**, pas laisser ce soin au premier lot qui s'en aperçoit. À porter à la prochaine évolution de la commande.
- `cleOccupee()` (partagée par `importDossier`/`remove`) plutôt que trois vérifications séparées a évité exactement le défaut que le plan redoutait implicitement (un dossier non supprimable) — **correction de la revue de PR tech-lead** : `list()` ne l'appelle PAS, elle a son propre filtre `:` (clés de contenu/image, n° 3-4) ; l'invariant réel tient parce qu'un id de dossier ne contient jamais `:` (forme validée), pas parce qu'un prédicat unique couvre les trois méthodes. Un bon signe malgré tout que le contrat de l'itération 2 devra vérifier symétriquement pour `create()`/`createDossierId()` : la forme d'id, pas le partage littéral d'une fonction.
