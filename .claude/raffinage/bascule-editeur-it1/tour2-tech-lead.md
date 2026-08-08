# Tour 2 — Tech Lead

## Tour 2 — Tech Lead — `bascule-editeur` it1/3

**RISQUE (révisé)** — L'option (a) a un rayon que ma note de tour 1 sous-estimait : `src/features/book-creation/tests/createFlow.test.tsx` monte `<App/>` puis clique « + Nouveau livre » (l. 28, l. 46) et asserte l'accueil (l. 51). Débrancher `CreateBookEntry` rend cette suite **rouge**. Un lot qui ne nomme pas ce fichier part avec une porte cassée et laisse l'ouvrier improviser — remonter l'affordance, ou supprimer la suite.

**OBJECTION** — À **QA**, nommément : ton objection est fondée et je la fais mienne — « visible dans `list()` » et « constaté par clé dans `importDossier` » sont deux correctifs, un seul est BUG-048. Les deux tests que tu demandes vont dans **un** fichier, `src/brain/DossierService.test.ts`, déjà marqué R au lot 1 (annexe A.4). Mais ta liste d'orphelines s'arrête à `book-library` : la casse déborde la feature (annexe B). Vérifié en revanche, contre ma propre inquiétude : `TreeCanvas.test.tsx` entre par `brain.router.navigate` (l. 9), jamais par l'affordance — les suites tree-canvas restent vertes **sans modification** (KR-180 tient) ; et `importDossier.test.tsx` asserte la phrase entière « Dossier « … » importé. » (l. 55), distincte du titre rendu par la carte — aucun `getMultipleElementsFound`.

**PROPOSITION** — Mes deux objections de tour 1 : **maintenues et tranchées** (A.2, A.3). Les cinq points du comité : tranchés en annexe A. Lots : **toujours 2**, le lot 2 gagne **un** fichier.

**VERDICT** — **recevable sous réserve** : lot 2 ouvert seulement avec `createFlow.test.tsx` dans sa liste, et le propriétaire d'extinction du 5ᵉ critère écrit (n° 9).

---

### Annexe A — les cinq points tranchés

**A.1 — 5ᵉ critère du PM : OUI, il tient dans le lot 2.** Zéro 3ᵉ lot, zéro méthode `brain/` neuve : `useBooks()` est déjà exporté (`src/brain/index.ts:204`) et son snapshot est caché dans la clôture (`hooks.ts:73-93`) — un `books.listBooks()` appelé au rendu re-désérialiserait tous les livres à chaque frame, `useBooks()` non. `useDossierLibrary()` expose `livresHerites: number`, `LibraryScreen` dérive la copie **en ligne** (KR-013), rendue seulement si `livresHerites > 0 && dossiers.length === 0`. Trois conditions que je pose :
- **propriétaire d'extinction obligatoire.** La condition ne redevient jamais fausse toute seule : plus aucune UI ne supprime un `Book`. Sans propriétaire, ce n'est pas un avis de bascule, c'est une cicatrice permanente. → `open_questions` : « REPORTÉ n° 9 — la ligne d'avis meurt avec la démolition de `BookService` (KR-181) ».
- le message **n'offre aucune action** qu'il ne peut honorer (pas de bouton « restaurer »).
- il maintient `useBooks` vivant dans `book-library` une itération : légal (contrat `brain/`), et le test-grep d'it3 ne vise que `src/App.tsx` + `src/EditorScreen.tsx` — donc aucun conflit, mais c'est écrit ici pour qu'it3 ne le découvre pas.

**A.2 — Réserve UX levée, explicitement.** `DossierResume` porte exactement `{ id, lisible: true, titre, updatedAt } | { id, lisible: false }`. **Aucun compteur, aucun champ dérivé du contenu**, et aucun ne peut être ajouté après l'ouverture du lot 2 : la signature du lot `contrat` est figée. Motif de fond : compter les entités imposerait un `get()` par carte, c'est-à-dire une **re-validation complète de chaque dossier à chaque rendu de l'accueil**. Les compteurs sont ceux d'it3, lus depuis `SECTIONS`.

**A.3 — « verbatim » : je corrige ma propre formule.** La const est privée (`src/features/dossier-format/components/ImportDossierDialog.tsx:197-207`) : l'importer est un veto. « Verbatim » désigne **les valeurs, jamais l'identifiant ni l'import**. Le lot 2 déclare dans `DossierCard.tsx` une const locale nommée `telechargerButtonStyle` (pas `retry…` : ce n'est pas une reprise), avec ces neuf déclarations exactes :

```ts
alignSelf: 'flex-start'   minHeight: 'var(--hit-target)'   padding: '0 var(--space-2)'
border: 'none'            background: 'none'               color: 'var(--text-muted)'
fontFamily: 'var(--font-ui)'   fontSize: 'var(--fs-body)'  cursor: 'pointer'
```

Zéro hex, zéro `rgb()` → passe la règle ESLint couleurs. **Pas de promotion dans `brain/components`** : neuf déclarations CSS ne sont pas un comportement, et le seul second consommateur annoncé est cette copie. Si it3 en fait naître un troisième, c'est it3 qui promeut.

**A.4 — Les deux tests QA : lot 1, fichier existant, liste inchangée.** Dans `src/brain/DossierService.test.ts` :
- « un import sur un identifiant occupé par un document **illisible** est refusé, et le document en place n'est pas écrasé » — semer un brut invalide sous `dossierKey('x')`, importer un fichier valide de même `id`, attendre `statut: 'invalid'` + code `dossier-deja-importe` + **message illisible** + le brut toujours présent.
- « `remove` retire la clé AVANT d'émettre `dossier:deleted` » — l'abonné lit `persistence.get(dossierKey(id))` **dans le handler** et l'observe déjà `null` (motif exact de `BookService.test.ts` pour `book:created`).

Le 3ᵉ test QA (racine de composition) **ne crée pas** `src/App.test.tsx` : il vit dans `book-library/tests/dossierLibrary.test.tsx`, qui monte déjà `<App/>` — `expect(screen.queryByRole('button', { name: /nouveau livre/i })).not.toBeInTheDocument()`. Un fichier de moins.

**A.5 — Oui : SUPPRIMÉ est une classification, pas un oubli.** Écrite noir sur blanc, ligne par ligne, en annexe B. Rien n'est « laissé mourir » : chaque cas des deux suites reçoit un verdict `SUPPRIMÉ` / `TRANSPOSÉ` / `RÉÉCRIT` / `INTACT`.

### Annexe B — sort de chaque suite touchée

| Suite / cas | Sort | Motif |
|---|---|---|
| `library.test.tsx` — liste, méta, ouverture au clic (l. 23, 50, 37) | **SUPPRIMÉ**, remplacé par `dossierLibrary.test.tsx` | le modèle listé change ; aucune ouverture avant it2 (pas de route `dossier`) |
| — recherche + tri (l. 138, 155) | **TRANSPOSÉ** → `selectVisibleDossiers.test.ts` (+ 1 cas RTL) | la règle survit, sa donnée change |
| — renommer / dupliquer (l. 61, 76, 91) | **SUPPRIMÉ sans remplacement** | hors périmètre acté (`open_questions`) — aucune méthode au service |
| — suppression + annulation (l. 103, 119) | **TRANSPOSÉ** sur `dossier:deleted` | |
| — KR-071 « navigue home sur `book:deleted` » (l. 188) | **SUPPRIMÉ** (son déclencheur disparaît) | ⚠ la garde reste dans `src/App.tsx` : plus rien ne peut l'armer, et le grep d'it3 (`books.`/`BookService`/`TreeCanvas`) **ne l'attrapera pas**. Dette nommée, propriétaire **it2**, à écrire dans `open_questions` |
| — puce de synchro par carte (describe l. 207, 3 cas) | **SUPPRIMÉ sans remplacement** | `useBookPending` construit `bookKey(id)` en interne (`BrainContext.tsx:150`) ; `useDossierPending` serait une abstraction à un seul appelant |
| `selectVisibleBooks.test.ts` | **SUPPRIMÉ**, transposé | + 2 cas neufs : illisible en tête, égalité départagée par `id` |
| `createFlow.test.tsx` — describe 1 (2 cas, l. 24-52) | **RÉÉCRIT dans le lot 2** | monte `<CreateBookEntry/>` seul sous `BrainProvider` ; les assertions « atterrit dans l'éditeur » et « Mes livres-jeux » tombent — elles renaissent en it2 sur le chemin dossier |
| `createFlow.test.tsx` — describe 2 (cloud-first, l. 58-88) | **INTACT** | niveau service, ne monte pas `<App/>` |
| `TreeCanvas.test.tsx` | **INTACT — vérifié** | entre par `brain.router.navigate` (l. 9) |
| `importDossier.test.tsx` | **INTACT — vérifié** | assertion sur la phrase entière (l. 55), pas sur le titre nu |

### Annexe C — lots révisés (delta du tour 1 uniquement)

- **Lot 1 `contrat-dossier-liste`** — liste de fichiers **inchangée** (les deux tests QA entrent dans `src/brain/DossierService.test.ts`, déjà R). Toujours seul, en premier.
- **Lot 2 `bibliotheque-dossiers`** — **+ R `src/features/book-creation/tests/createFlow.test.tsx`** (un seul `describe` réécrit). Aucun fichier de **production** de `book-creation` n'est touché : `CreateBookEntry.tsx` reste intact, et un test qui monte le composant de sa propre feature n'est pas un import inter-features. `useDossierLibrary.ts` expose en plus `livresHerites: number`.
- **Toujours 2 lots, exécution séquentielle, sans worktree ni fusion.** Le périmètre a bougé d'un fichier de test, pas d'une frontière.
