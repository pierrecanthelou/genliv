# Tour 1 — Tech Lead

## Note d'ouverture — Tech Lead — `bascule-editeur` it1/3

**RISQUE** — L'it1 débranche le seul listing de `Book` alors que `book-creation` en crée encore. Toute couverture « on liste les deux » installe une union `Book | Dossier` dans `LibraryScreen` : deux sources de vérité dans une vue, à défaire en it2. Second risque, silencieux : fermer BUG-048 rend faux le libellé `dossier-deja-importe` de `issues.ts` (« ↪ Changez le champ « id »… », motivé en commentaire par « la suppression d'un dossier n'existe pas ») — aucun test ne l'épingle verbatim, il survivra si personne ne le nomme.

**OBJECTION** — (1) Le critère 2 dit « suit le contrat § 3 **tel quel** ». Impossible : `retryButtonStyle` est une const **privée** de `dossier-format/components/ImportDossierDialog.tsx` (l'importer = veto immédiat), et § 3 pose le bouton dans la ligne de confirmation d'`ImportDossierButton.tsx` sur une prémisse — « aucune surface de l'éditeur ne liste les dossiers » (§ 8, désaccord 6) — que cette itération périme. Tel qu'écrit, le critère autorise **deux** appelants d'`exportDossier`. Ce qui survit de § 3 : le texte exact et le patron visuel, **re-créés depuis les tokens** dans `book-library`. (2) `DossierResume { id, titre, updatedAt, lisible: boolean }` oblige la carte à inventer un titre pour un dossier illisible.

**PROPOSITION** — Union discriminée (annexe A) ; téléchargement sur la carte, **un seul** site d'appel ; question 6 : **option (a)** (annexe C) ; **2 lots strictement séquentiels**, pas d'essaim.

**VERDICT** — **recevable sous réserve** : les deux objections tranchées avant l'ouverture du lot 2.

---

### Annexe A — signatures exactes exposées par le lot `contrat`

`C:\Users\pierr\Desktop\genliv\src\brain\DossierService.ts`

```ts
export type DossierResume =
	| { id: string; lisible: true; titre: string; updatedAt: string }
	| { id: string; lisible: false }

export interface DossierService {
	get(id: string): Dossier | null            // inchangé
	open(id: string): void                      // inchangé
	importDossier(fileText: string): DossierInspection  // présence par CLÉ (KR-179)
	exportDossier(id: string): Dossier | null   // inchangé — 1er appelant réel
	/** Énumère par CLÉ : persistence.keys(DOSSIER_KEY_PREFIX), jamais par validité. */
	list(): DossierResume[]
	/** Retire la clé si elle existe, LISIBLE OU NON, PUIS émet dossier:deleted (KR-004). */
	remove(id: string): boolean
}
```

- `list()` : `id = key.slice(DOSSIER_KEY_PREFIX.length)` et **ignore toute clé contenant `:` après le préfixe** — `dossierContentKey`/`dossierImageKey` arrivent en n° 3/n° 4 (`persistenceKeys.ts:56-64`) et doubleraient la liste. Garde d'une ligne, posée maintenant.
- Tri rendu par le service : `lisible: false` d'abord (ils réclament une action), puis `updatedAt` décroissant, égalité départagée par `id`.
- `remove()` constate par la clé brute, **jamais** par `get()` — même leçon que BUG-048, et miroir de `BookService.deleteBook` (« a corrupt book must still be deletable »). Un dossier illisible non supprimable enfermerait l'auteur : son id reste occupé et l'import du fichier corrigé serait refusé.
- `dossier-deja-importe` : **UN code, DEUX messages** (lisible → nomme le titre ; illisible → « un dossier illisible occupe déjà cet identifiant »). Doctrine `issues.ts:29` : un code par **CAUSE** — la cause est « identifiant occupé », la lisibilité est une propriété de l'occupant, et la remédiation est désormais la même pour les deux (« supprimez-le depuis la bibliothèque, ou changez le champ id »). Un code neuf coûterait l'union + le registre + les décomptes de `validate.test.ts` pour un gain nul.

`src/brain/EventBus.ts` → `'dossier:deleted': { dossierId: string }`
`src/brain/hooks.ts` → `export function useDossiers(): DossierResume[]` — `useSyncExternalStore`, snapshot **caché** dans la clôture, re-lu sur `['dossier:created','dossier:updated','dossier:deleted']` (calque exact de `useBooks`, `hooks.ts:73-93` : référence stable entre deux événements, sinon boucle de rendu).

**Consommé par le lot 2, rien d'autre** : `useDossiers()`, `useBrain().dossiers.remove/exportDossier`, `downloadJson`, `slugifyFilename`. Jamais `persistence`, jamais `dossierKey` (KR-011).

### Annexe B — découpage en lots (propriété exclusive, aucun fichier partagé)

| Lot | Type | Fichiers | Vérifiable seul |
|---|---|---|---|
| **1 — `contrat-dossier-liste`** (seul, en premier) | `contrat` | **R** `src/brain/DossierService.ts` · **R** `src/brain/DossierService.test.ts` · **R** `src/brain/EventBus.ts` · **R** `src/brain/hooks.ts` · **R** `src/brain/index.ts` · **R** `src/brain/dossier/issues.ts` (libellé `dossier-deja-importe` réécrit) · **R** `src/brain/utils/download.ts` + **R** `src/brain/utils/download.test.ts` (repli `'livre'` → `'dossier'`) | `tsc` + `jest` : liste par clé (dont dossier illisible), `remove` d'un illisible, ordre persistance→événement, import sur identifiant occupé illisible |
| **2 — `bibliotheque-dossiers`** (après figement du lot 1) | feature | **R** `src/features/book-library/components/LibraryScreen.tsx` · **N** `.../components/DossierCard.tsx` · **N** `.../components/DeleteDossierDialog.tsx` · **N** `.../hooks/useDossierLibrary.ts` · **N** `.../utils/selectVisibleDossiers.ts` · **N** `.../tests/dossierLibrary.test.tsx` · **N** `.../tests/selectVisibleDossiers.test.ts` · **D** `.../components/BookCard.tsx`, `.../components/DeleteBookDialog.tsx`, `.../hooks/useLibrary.ts`, `.../utils/selectVisibleBooks.ts`, `.../tests/library.test.tsx`, `.../tests/selectVisibleBooks.test.ts` · **R** `src/App.tsx` · **R** `src/style.css` (`.book-card*` → `.dossier-card*`) · **R** `src/features/book-library/specification.json` · **R** `src/features/bascule-editeur/specification.json` (+ `CHANGELOG.md`, `README.md`, `features_history.json`, `code-knowledge.json`) | RTL : carte listée, illisible signalée, téléchargement, suppression confirmée → carte disparue de la liste vivante |

Inchangés et hors lots : `src/features/book-library/utils/formatDate.ts`, `.../index.ts`, **tout** `src/features/dossier-format/**`, **tout** `src/features/book-creation/**`, `src/brain/Router.ts`, `src/features/tree-canvas/**`.

**Pourquoi pas 3 lots** : scinder « liste + suppression » et « téléchargement » ferait posséder `LibraryScreen.tsx` **et** `DossierCard.tsx` aux deux — interdit. Donc 2 lots, exécution **séquentielle**, sans worktree ni fusion (le découpage révèle qu'il n'y a pas de parallélisme ici, il n'en invente pas).

### Annexe C — question 6 : ma tranche

**Option (a)** — `src/App.tsx` cesse de rendre `<CreateBookEntry/>`, aucun fichier de `book-creation` touché.

- **(b) est un veto** : une union `Book | Dossier` dans `LibraryScreen` duplique la source de vérité dans une vue et rapproche par la forme deux modèles que KR-167 interdit de convertir, dans quelque sens que ce soit.
- **(a) coûte une ligne** dans la racine de composition, dont c'est exactement le rôle ; isolation intacte, réversible par la même ligne en it2.
- **Trois conséquences à écrire, pas à découvrir** : (i) `createEntry` devient **optionnel** (`createEntry?: ReactNode`) plutôt que supprimé — it2 réinjecte `CreateDossierEntry` sans churner deux fois l'API publique ; (ii) l'état vide ne peut plus dire « Créez votre premier livre-jeu » — il doit nommer l'import, seule affordance restante pendant une itération (rédaction UX) ; (iii) les `Book` existants deviennent **injoignables depuis l'UI** — non supprimés, KR-181 diffère la démolition : ligne de `CHANGELOG`, pas de code.

### Annexe D — hors périmètre nommé (pour que l'essaim ne l'invente pas)

- **Aucune navigation depuis la carte.** La route `{ name: 'dossier'; dossierId }` est un contrat d'**it2** : `src/brain/Router.ts` n'est dans aucun lot d'it1. La carte est donc un `<article>` porteur de deux actions, **pas** une surface cliquable — sinon elle ment.
- **Aucune puce de synchro par carte.** `useBookPending` construit `bookKey(id)` en interne (`BrainContext.tsx:150`) : non réutilisable, et `useDossierPending` serait une abstraction à un seul appelant. Le `SyncIndicator` global couvre l'itération.
- **Nom de fichier téléchargé** : `` `${slugifyFilename(dossier.titre)}.dossier.json` `` — le repli `'livre'` de `slugifyFilename` est un reliquat de l'ère arbre ; **zéro appelant de production aujourd'hui** (relevé : seuls `brain/index.ts` et `download.test.ts` le citent), donc le corriger coûte 1 ligne + 2 assertions, contre un paramètre `fallback` qui serait une abstraction à un appelant.
- **Dette héritée, à consigner et non à traiter** : `CloudSyncService.remove()` (`CloudSyncService.ts:425`) ne fait que `local.remove(key)` — un push déjà en file republie le document supprimé, et rien n'efface la clé côté KV. Comportement identique à `deleteBook` depuis toujours ; une suppression cloud est un contrat neuf, hors périmètre. À écrire dans la revue pour que l'it2 ne le redécouvre pas.
