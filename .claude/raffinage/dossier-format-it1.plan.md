# Plan d'itération — `dossier-format` · itération `1`

> Statut : `porte 1 verte, en attente de validation`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-03
> Composition : `5 rôles` — motif : l'itération fixe le document que l'IA lira au Temps 2 ; la frontière code/IA, le budget de contexte et les identifiants stables s'y décident une fois pour toutes.
> Exécution : `séquentielle` (2 lots, sans worktree)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut importer un dossier d'aventure dans sa bibliothèque. » |
| **Tranche** | carte « Importer un dossier » (slot `LibraryScreen.importEntry`) → modale à cinq états → `inspectDossierFile` → `validateDossier` → `DossierService.importDossier` → `PersistenceService` → `CloudSyncService` |
| **Lots** | 2 lots · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | tout écran de dossier · `…_expr` et `DELTAS` · l'intégrité référentielle au-delà de `depart.lieu_id` · le dossier de référence à 6 PNJ/5 lieux · la suppression de quoi que ce soit de l'arbre |
| **Reporté** | 5 points — dont le token `--surface-raised` inexistant et la seconde porte de validation au démarrage de session |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut **importer un dossier d'aventure dans sa bibliothèque**.

## 2 — Hors périmètre

- **Tout écran de dossier** : la bibliothèque continue de ne lister que des `Book`. La navigation par sections est la n° 2 `bascule-editeur`.
- **La forme complète des treize racines** — it2. L'itération 1 déclare les treize clés mais ne valide qu'un contenu minimal.
- **`…_expr` et `ExprNode`** — it3. **`DELTAS` et le type `Delta`** — it4. Aucun des deux n'apparaît dans le schéma de cette itération.
- **L'intégrité référentielle** au-delà de l'unique référence `charpente.depart.lieu_id` → `monde.lieux[].id` — it3 puis it4.
- **Le dossier de référence** à 6 PNJ / 5 lieux et sa checklist de suffisance — it5. L'itération 1 livre une fixture **minimale et distincte**.
- **`list`, `remove`, `create`, `rename`, `duplicate`, `update`, `useDossiers`, `useOpenDossier`** : aucun appelant avant la n° 2, qui repointe la bibliothèque.
- **L'événement `dossier:deleted`** : aucun émetteur en it1 — c'est exactement ce que le tri du 2026-08-03 vient de retirer d'`EventBus`.
- **La suppression de `BookService`, `kinds.ts`, `playExport.ts` ou d'une feature survivante** : la n° 1 crée, elle ne détruit pas (KR-159).
- **Le correctif du token `--surface-raised`** dans `ImageUpload.tsx` : hors sujet de l'itération, journalisé.
- **La détection de conflit cloud sur un dossier** : `conflictMap` est indexée par clé de livre et `useSyncConflict(bookId)` rapporterait un id de dossier comme un conflit de livre. Un dossier gelé n'a aucun éditeur local avant la n° 2 : pas de divergence possible.

## 3 — Contrat de design

**Composants réutilisés** : `Modal`, `Badge` (`src/brain/components/`). Aucune primitive nouvelle dans `brain/components/` — un seul consommateur. `Field`, `Select`, `TargetPicker` **ne sont pas utilisés** (aucune saisie libre, aucun `…_expr`).

### 3.1 — `ImportDossierButton`, injecté dans `LibraryScreen.importEntry`

Depuis la **racine de composition** (`App.tsx`), jamais depuis `book-library` — son isolation tient jusqu'à son repointage en n° 2.

- `display:inline-flex; align-items:center; gap:var(--space-3); min-height:var(--hit-target)`
- `padding: var(--space-6) var(--space-9)` · `border: 1.5px dashed var(--accent); border-radius: var(--r-md); background: var(--accent-bg); color: var(--accent)`
- `font-family: var(--font-ui); font-size: var(--fs-body); font-weight: var(--fw-semibold)`
- Glyphe **⬚** — *pas* ⇪ (hors du jeu de glyphes du système), *pas* + (déjà pris par « + Nouveau livre »).
- Libellé exact : **« Importer un dossier »**
- `<button>` natif : Entrée/Espace natifs ; le focus revient ici à la fermeture (géré par `Modal`).

### 3.2 — `ImportDossierDialog`

`Modal` : `title="Importer un dossier"`, `cancelLabel="Annuler"`, `confirmLabel="Importer"`, `confirmTone="accent"` (non destructif), `confirmDisabled={step !== 'valid'}`.

État local dérivé du discriminant de `DossierInspection` — **pas un miroir `useEffect`** (KR-013) :
`type ImportStep = 'empty' | 'reading' | 'file-error' | 'invalid' | 'valid' | 'done'`

| État | Rendu | Textes exacts |
|---|---|---|
| `empty` | Dropzone pointillée : `min-height:var(--hit-target); padding:var(--space-5); border:1.5px dashed var(--border-card); border-radius:var(--r-md); background:var(--surface-sunken); color:var(--text-faint); font-family:var(--font-mono); font-size:var(--fs-meta)`. `<input type="file" accept=".json">` masqué, déclenché par un `<button>`. Rien en dessous. | **« ⬚ Cliquer pour choisir un fichier .json »** |
| `reading` | Ligne fichier (nom en `var(--font-mono)`/`var(--fs-sm)`, tronqué par `text-overflow:ellipsis`) + `<Badge tone="accent">`. Aucune icône, aucun spinner (précédent `SyncIndicator`). Focus sur « Annuler ». | **« Validation… »** |
| `file-error` | Ligne fichier + `<Badge tone="bad">` ; message ; bouton de reprise. Pas d'anatomie OÙ/QUOI/QUOI FAIRE — un parse en échec ne produit aucune entité à résoudre. Focus sur le bouton de reprise. | Badge **« Fichier illisible »** · `fichier-vide` → **« Ce fichier est vide. »** · `json-invalide` → **« Ce fichier n'est pas un JSON valide — il a peut-être été tronqué ou modifié à la main. »** · `racine-non-objet` → **« Ce fichier ne contient pas un dossier d'aventure. »** · reprise → **« ↪ Choisir un autre fichier »** |
| `invalid` | Ligne fichier + `<Badge tone="bad">{n} {plural(n,'anomalie')}</Badge>` ; liste `max-height:240px; overflow-y:auto`, séparateur `1px solid var(--border-divider)` ; anatomie à trois lignes par anomalie (§ 3.3) ; bouton de reprise. Focus sur le bouton de reprise. | Badge **« {n} anomalie(s) »** |
| `valid` | Ligne fichier + `<Badge tone="good">Dossier valide</Badge>` ; ligne de réassurance ; bloc avertissements si `warnings` non vide ; « Importer » **activé**, focus dessus. Un avertissement ne dégrade jamais le badge ni ne désactive la confirmation. | Badge **« Dossier valide »** · réassurance **« Prêt à être importé. La bibliothèque n'affiche pas encore les dossiers importés. »** · eyebrow **« AVERTISSEMENTS (N'EMPÊCHENT PAS L'IMPORT) »** |
| `done` | Après confirmation : la modale se ferme et une ligne de confirmation nomme le dossier importé. C'est la seule trace de l'action jusqu'à la n° 2. | **« Dossier « {titre} » importé. »** |

**Discipline** : `--accent` sur la carte d'entrée et le badge « Validation… » seulement. `--good`/`--bad` portés **uniquement** par le `Badge`, jamais par le texte ni par une bordure de ligne. Échap ferme, focus-trap et retour de focus gérés par `Modal` ; focus programmatique à chaque transition d'état pour qu'Entrée agisse sans reprise de souris.

**Interdit** : `var(--surface-raised)` — ce token n'existe dans aucun fichier de `src/styles/tokens/`. Utiliser `var(--surface-sunken)` (`colors.css:69`).

### 3.3 — Anatomie d'une anomalie

**OÙ** — `font-family:var(--font-mono); font-size:var(--fs-eyebrow); color:var(--text-label); letter-spacing:var(--track-eyebrow)`. Entité résolue **par son nom** ; repli `{Type} n°{index} (sans nom)` ; identifiant stable entre parenthèses en `var(--font-mono)`/`var(--text-faint)` quand l'entité en porte un. Le `path` JSON n'est **jamais** affiché seul.
**QUOI** — `font-family:var(--font-ui); font-size:var(--fs-body); color:var(--text-body)`, phrase française rédigée.
**QUOI FAIRE** — préfixé `↪`, `font-family:var(--font-ui); font-size:var(--fs-meta); color:var(--text-muted)`.

| code | canal | QUOI | QUOI FAIRE |
|---|---|---|---|
| `schema-inconnu` | `errors` | « Le champ « schema » doit valoir 1 ; ce fichier ne peut pas être importé. » | « ↪ Ouvrez le fichier et réglez « schema » sur 1, puis réimportez-le. » |
| `racine-manquante` | `errors` | « La racine « {racine} » est absente du dossier. » | « ↪ Ajoutez la racine « {racine} » dans le fichier, puis réimportez-le. » |
| `champ-requis-vide` | `errors` | « Le champ « {champ} » est vide alors qu'il est obligatoire. » | « ↪ Renseignez ce champ dans le fichier, puis réimportez-le. » |
| `identifiant-invalide` | `errors` | « L'identifiant « {id} » ne respecte pas le format attendu (préfixe connu, puis lettres, chiffres et tirets). » | « ↪ Corrigez cet identifiant dans le fichier, puis réimportez-le. » |
| `identifiant-duplique` | `errors` | « L'identifiant « {id} » est déjà utilisé par un autre élément du dossier. » | « ↪ Attribuez un identifiant unique à cet élément, puis réimportez-le. » |
| `reference-pendante` | `errors` | « Le point de départ pointe un lieu qui n'existe pas dans ce dossier. » | « ↪ Corrigez « depart.lieu_id » ou ajoutez le lieu correspondant. » |
| `dossier-deja-importe` | `errors` | « Un dossier portant cet identifiant est déjà dans votre bibliothèque : « {titre} ». » | « ↪ Supprimez-le avant de le réimporter. » |
| `canon-trop-long` | `warnings` | « Le canon compte {n} mots ; le budget conseillé est de 600. » *(jamais le nom de la constante dans le texte)* | « ↪ Resserrez le texte si possible ; l'import n'est pas bloqué. » |

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/tree.ts` | type | crée | `Book`, `BookNode`, `Edge`, `ChoicePrereq`, `ChoiceCountdown`, `NodeActionType` — extraits de `types.ts`. **`tree.ts` importe `DecorConfig`/`PnjConfig`/`TakeableObject`/`DecorReveal`/`PnjGift`/`MonsterConfig`/`TrapConfig` depuis `./types` ; jamais l'inverse.** |
| `brain/dossier/types.ts` | type | crée | `DOSSIER_SCHEMA = 1` · `Dossier { schema; id; titre; createdAt; updatedAt; canon; monde; charpente }` · `Canon { mj:{synopsis_mj}; partage:{accroche_joueur}; ton; interdits_ton:string[]; objectifs:Entite[] }` · `Monde { personnages; lieux; objets; indices; quetes; evenements; conditions }` · `Charpente { depart:{lieu_id; texte_ouverture_joueur}; jalons; fins }` · `Entite { id; nom }` |
| `brain/dossier/issues.ts` | registre | crée | `DossierIssueCode` (union fermée de 8 codes) · `DossierIssue { code; severity; message; location; entityId?; path }` · `DOSSIER_ISSUE_LABELS: Record<DossierIssueCode, string>` (KR-117) |
| `brain/dossier/identifiers.ts` | registre | crée | `ESPACES_DE_NOMS` (Record fermé : `pnj`, `lieu`, `objet`, `indice`, `quete`, `objectif`, `jalon`, `fin`, `bestiaire`) · forme `^(…)\.[a-z0-9-]+$` · `collectIds(d)` · unicité |
| `brain/dossier/freeze.ts` | util | crée | `deepFreeze<T>(v: T): Readonly<T>` — **seul fichier du dépôt où `Object.freeze` apparaît**, appelé une seule fois, en sortie de `validateDossier` |
| `brain/dossier/validate.ts` | service | crée | `DossierValidation { ok; dossier; errors; warnings }` · `validateDossier(input: unknown): DossierValidation` — **pur**, ignorant du magasin, gèle en sortie quand `ok` |
| `brain/dossier/read.ts` | service | crée | `FileReadErrorCode = 'fichier-vide' \| 'json-invalide' \| 'racine-non-objet'` · `DossierInspection` (union discriminée) · `inspectDossierFile(text: string): DossierInspection` — **pur** |
| `brain/DossierService.ts` | service | crée | `get(id): Dossier \| null` *(re-valide, ne lit jamais brut)* · `open(id): void` · `importDossier(fileText: string): DossierInspection` · `exportDossier(id): Dossier \| null` — **quatre méthodes** |
| `brain/persistenceKeys.ts` | clé | modifie | `DOSSIER_KEY_PREFIX` · `dossierKey(id)`. Aucun découpage de clés : invariant — **aucun champ du dossier ne porte de data URL** en it1 |
| `brain/EventBus.ts` | événement | émet | `dossier:created`, `dossier:opened`, `dossier:updated` — `{ dossierId: string }`, émis **après** résolution de la persistance (KR-004) |
| `brain/CloudSyncService.ts` | service | modifie | `isDossier(v) = v.schema === 1` · `reconcileDossier(id)` en LWW sur `updatedAt` · armé sur `dossier:opened` (KR-163) |
| `brain/BrainContext.tsx` | service | modifie | `Brain` gagne `dossiers: DossierService` ; `books: BookService` **reste** jusqu'à la n° 2 |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-dossier` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : la scission `types.ts` → `tree.ts`, le schéma minimal, le validateur, le service et la reconnaissance du dossier par la synchronisation.
- **Fichiers créés (N)** — `src/brain/tree.ts` · `src/brain/dossier/types.ts` · `issues.ts` · `identifiers.ts` · `freeze.ts` · `read.ts` · `validate.ts` · `src/brain/DossierService.ts` · `src/brain/dossier/__fixtures__/dossier-minimal.json` · `src/brain/dossier/validate.test.ts` · `read.test.ts` · `identifiers.test.ts` · `roundtrip.test.ts` · `src/brain/DossierService.test.ts`
- **Fichiers remplacés (R)** — contrat : `src/brain/types.ts` · `index.ts` · `EventBus.ts` · `persistenceKeys.ts` · `CloudSyncService.ts` · `CloudSyncService.test.ts` · `BrainContext.tsx`
- **Fichiers remplacés (R)** — scission, une ligne d'import chacun : `src/brain/hooks.ts` · `BookService.ts` · `BookService.test.ts` · `bookHealth.test.ts` · `utils/book.ts` · `utils/book.test.ts` · `utils/bookHealth.ts` · `utils/objects.ts` · `utils/objects.test.ts` · `utils/playExport.ts` · `utils/playExport.test.ts` · `utils/automaticEdges.ts` · `utils/automaticEdges.test.ts` · `utils/nodeView.ts` · `utils/nodeKind.ts` · `utils/buildAdventureDocument.ts` · `components/TargetPicker.tsx` · `components/TargetPicker.test.tsx` · `src/player/components/ChoiceList.tsx` · `src/player/components/NodeScreen.tsx` · `src/player/hooks/usePlaySession.ts` · `src/player/engine/sessionEngine.ts` · `src/player/engine/sessionEngine.test.ts`
- **Expose** : les douze contrats du § 4.
- **Critères couverts** : #1 à #7

### Lot 2 — `import-dossier`

- **Ouvrier** : `dev-lot` (démarre contrat figé, le lit comme une donnée immuable)
- **But** : l'affordance d'import, la modale à cinq états et la confirmation.
- **Fichiers créés (N)** — `src/features/dossier-format/index.ts` · `components/ImportDossierButton.tsx` · `components/ImportDossierDialog.tsx` · `components/IssueList.tsx` · `hooks/useImportDossier.ts` · `messages.ts` · `tests/importDossier.test.tsx` · `tests/featureDirs.test.ts`
- **Fichiers remplacés (R)** — `src/App.tsx` · `.eslintrc.cjs`
- **Consomme** : `import { useBrain, Modal, Badge, plural, type DossierInspection, type DossierIssue } from '../../brain'`. **Zéro fichier de `brain/`.**
- **Critères couverts** : #8

## 6 — Critères d'acceptation

1. **Étant donné** la fixture minimale conforme, **quand** on appelle `validateDossier`, **alors** elle retourne `ok:true`, `errors:[]` et le dossier typé, sans exception — *unitaire* — *lot 1*
2. **Étant donné** un document dont `schema` vaut autre chose que le nombre 1 (absent, `'1'`, `0`, `2`), **quand** on le valide, **alors** il est refusé par `schema-inconnu`, distinct d'une erreur de contenu, et jamais coercé — *unitaire* — *lot 1*
3. **Étant donné** une racine ou un champ obligatoire vide, **quand** on valide, **alors** une erreur bloquante le nomme ; **étant donné** un champ optionnel absent, **alors** aucune entrée n'apparaît dans `errors` ni dans `warnings` — *unitaire* — *lot 1*
4. **Étant donné** n'importe quelle anomalie produite par la matrice de rejet, **quand** on l'inspecte, **alors** `code` appartient à l'union fermée, `path` est stable, `location` résout l'entité par son nom, et `message` ne contient ni `expected`, ni `undefined`, ni `is not a function` — *unitaire* — *lot 1*
5. **Étant donné** un identifiant mal formé, un identifiant en double, ou un `charpente.depart.lieu_id` qui ne résout vers aucun `monde.lieux[].id`, **quand** on valide, **alors** chacun produit une erreur bloquante nommant l'entité et l'identifiant fautif — *unitaire* — *lot 1*
6. **Étant donné** un bloc `canon.mj` ou `canon.partage` dépassant `BUDGET_MOTS_CANON`, **quand** on valide, **alors** `warnings` contient `canon-trop-long`, `errors` reste vide et `ok` reste `true` — *unitaire* — *lot 1*
7. **Étant donné** la fixture minimale lue depuis un fichier réel du disque, **quand** on l'importe puis on l'exporte, **alors** le document est deep-equal, re-validable, et gelé en profondeur quel que soit le chemin d'obtention (`importDossier`, `get`, adoption cloud) — *contrat* — *lot 1*
8. **Étant donné** un fichier de dossier valide déposé dans la modale, **quand** l'auteur confirme, **alors** la modale se ferme et une confirmation nomme le dossier importé — *composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validateDossier › la fixture minimale passe sans erreur` | `ok:true`, `errors:[]` | jest | KR-156 | 1 |
| `validateDossier › schema absent / '1' / 0 / 2 est refuse` | 4 cas → `schema-inconnu` | jest | KR-160 | 1 |
| `validateDossier › une racine manquante est bloquante` | `path` nomme la racine | jest | KR-164 | 1 |
| `validateDossier › un champ obligatoire vide est bloquant` | `location` résout par nom | jest | KR-164 | 1 |
| `validateDossier › un optionnel absent est calme` | `errors` et `warnings` vides | jest | — | 1 |
| `validateDossier › chaque anomalie a un code ferme et un message redige` | union fermée ; aucune sous-chaîne technique | jest | KR-164 | 1 |
| `validateDossier › une entree non-objet est refusee sans exception` | pas de `throw` | jest | KR-164 | 1 |
| `identifiers › un identifiant hors espace de noms est bloquant` | `identifiant-invalide` | jest | KR-117 | 1 |
| `identifiers › deux entites partageant un identifiant sont refusees` | `identifiant-duplique`, les deux nommées | jest | KR-117 | 1 |
| `validateDossier › depart.lieu_id pendant est bloquant` | `reference-pendante` | jest | KR-021 | 1 |
| `validateDossier › canon a 600 mots ne declenche rien` | `warnings:[]` | jest | KR-165 | 1 |
| `validateDossier › canon a 601 mots produit un avertissement non bloquant` | `canon-trop-long`, `ok:true` | jest | KR-165, KR-162 | 1 |
| `read › un fichier vide est refuse` | `fichier-vide` | jest | KR-156 | 1 |
| `read › un JSON malforme est refuse` | `json-invalide` | jest | KR-156 | 1 |
| `roundtrip › la fixture lue du disque survit a import puis export` | deep-equal + re-validable | jest (contrat) | KR-156 | 1 |
| `freeze › le dossier rendu est gele a tous les niveaux` | `Object.isFrozen` racine, sous-objets, tableaux | jest | KR-166 | 1 |
| `freeze › Object.freeze n'apparait que dans freeze.ts` | grep sur `src/brain/dossier` | jest | KR-166 | 1 |
| `DossierService › get re-valide et ne rend jamais le brut` | un document corrompu en magasin rend `null` | jest | KR-166 | 1 |
| `DossierService › deux imports du meme contenu : le second est refuse` | `dossier-deja-importe`, aucun écrasement | jest | KR-021 | 1 |
| `DossierService › dossier:created est emis APRES la resolution de la persistance` | le magasin contient déjà le dossier quand l'abonné est appelé | jest | KR-004 | 1 |
| `DossierService › open emet dossier:opened une seule fois, dans l'ordre` | ordre et unicité | jest | KR-004 | 1 |
| `CloudSyncService › un dossier est reconnu et reconcile s'arme sur dossier:opened` | **rouge avant correctif** | jest (contrat) | KR-163 | 1 |
| `CloudSyncService › un dossier adopte par reconcile est gele avant d'etre expose` | `Object.isFrozen` | jest | KR-166 | 1 |
| `importDossier › la confirmation nomme le dossier importe` | RTL, texte visible | jest (composant) | — | 2 |
| `importDossier › un fichier illisible affiche le registre fichier` | badge « Fichier illisible » | jest (composant) | — | 2 |
| `featureDirs › tout dossier de src/features est declare dans FEATURE_DIRS` | `readdirSync ⊆ FEATURE_DIRS` | jest | KR-159 | 2 |

Cas limites couverts : vide · très long (600/601 mots) · doublon (identifiant, import) · référence orpheline (`depart.lieu_id`) · fichier non-JSON · fichier vide · racine non-objet · double soumission.

**Non vérifiable en l'état** — à recopier dans la revue :
- Aucun instrument ne détecte un `var(--nom)` qui ne résout vers aucun token. La règle ESLint des couleurs attrape un `#hex` littéral, pas une variable inexistante. Le respect de l'interdiction d'utiliser `--surface-raised` repose sur la relecture.
- La non-régression « zéro ligne modifiée dans les cinq features survivantes » se constate par relecture du diff, pas par un test.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | narratif-ia | `Pick<Dossier,'canon'\|'monde'>` ne prouve pas l'absence de fuite de charpente : TypeScript est structurel, `JSON.stringify` sérialise ce qui est présent | `RETENU` | **Erreur de l'orchestrateur au cadrage, corrigée dans `resolved_decisions`.** Ce qui reste vrai des trois racines : elles achètent la non-dérive de l'assembleur, pas le confinement de la charge utile — lequel se prouve par `Object.keys(payload)` en n° 10 |
| 2 | qa | « sans autre changement que les neuf lignes d'import » est faux avant qu'on écrive une ligne, et non observable | `RETENU` | Décompte réel : **26 fichiers**, dont 0 dans `src/features/`. KR-159 et la roadmap à corriger. Le critère part en § 10 (définition de fini), sa place |
| 3 | tech-lead | Frontière de la scission : les configurations d'action (`DecorConfig`, `PnjConfig`, `TakeableObject`, `DecorReveal`, `PnjGift`) partent-elles dans `tree.ts` ? | `RETENU` | **Non** — elles portent des types de règles que `src/player/` consomme jusqu'à la n° 9. `tree.ts` ne prend que la structure du graphe et les importe depuis `./types`, jamais l'inverse. C'est cette asymétrie qui rend KR-167 vérifiable |
| 4 | pm-produit | `jalons[].effet: Delta[]` doit être typé dès it1 (« la forme arrive en itération 1 », décision de cadrage) | `REPORTÉ → it2` | La phrase citée date du plan à quatre itérations ; le re-découpage la remplace explicitement. Typer `Delta[]` quand `DELTAS` arrive en it4, c'est une forme sans producteur ni validateur. **Amendement assumé d'une décision de cadrage, pas un oubli** — l'échéance réelle est la fermeture de la feature, garantie par it2 |
| 5 | pm-produit | Confirmation de succès nommant le dossier importé, sinon « importer » n'est démontrable à personne | `RETENU` | Porté par le § 3.2 (état `done`), le critère #8 et un test nommé — pas par une note de couloir. Le plafond de huit critères tient parce que le critère de porte est parti en § 10 |
| 6 | tech-lead | `DossierService.get()` ne doit jamais rendre `persistence.get()` directement | `RETENU` (veto, dans son domaine) | L'adoption cloud écrit derrière le service ; sans re-validation à la lecture, un document ni gelé ni validé entre dans l'application sans qu'un test rougisse |
| 7 | narratif-ia | Le budget du canon comme clause, sinon `warnings` sort de `DossierValidation` | `RETENU` (la clause) | Sans producteur, `warnings.toEqual([])` n'est pas une assertion discriminante mais une constante — quatre features consommeraient un canal jamais rendu rouge |
| 8 | narratif-ia | `canon.mj` / `canon.partage` et `ton` remonté sous `canon` | `RETENU` | Deux accolades et une clé déplacée. La scission d'audience est la seule non migrable du schéma ; `interdits_ton` étant déjà sous `canon`, la consigne de registre ne peut pas être coupée entre deux racines |
| 9 | tech-lead | `DossierService` réduit à quatre méthodes ; `list`, `remove`, `useDossiers`, `useOpenDossier` sortent | `RETENU` | Zéro appelant avant la n° 2. Un service dont la moitié des méthodes n'est exercée par personne est de la dette, pas un contrat |
| 10 | ux-designer | Rien n'est visible après un import réussi | `RETENU en partie` | La confirmation (désaccord 5) couvre la trace. Le rendu dans la bibliothèque reste la n° 2. Avis de l'UX au registre : ne pas reconduire en n° 2 sans affichage rapproché |
| 11 | ux-designer | Le `JSON.parse` doit vivre dans `brain/`, pas dans le composant | `RETENU` | Rend « fichier vide » et « JSON malformé » observables sous la porte au lieu de les laisser hors instrument. Fusionné avec `inspectDossierFile` du tech-lead — même fonction, union discriminée qui pilote les cinq états |
| 12 | ux-designer | `--surface-raised` n'existe dans aucun fichier de `tokens/` et `ImageUpload.tsx:185` l'utilise | `REPORTÉ` | Vérifié par l'orchestrateur. Défaut préexistant, hors des fichiers de ces deux lots. À journaliser dans `bug_history.json` avec le trou d'outillage qu'il révèle : aucune règle ne détecte un `var(--nom)` inexistant |
| 13 | narratif-ia | Le chemin d'adoption cloud écrit un document **non validé** dans le stockage | `REPORTÉ → n° 9` | Le désaccord 6 ferme la lecture ; l'écriture reste ouverte. Seconde porte au démarrage de session, cohérent avec ce que la roadmap dit déjà de `monstre_ref` |
| 14 | pm-produit / narratif-ia | `depart.personnage_joueur.contraintes` | `RETENU — supprimé du schéma` | De la prose que le code ne peut pas appliquer alors que `charCreation.ts` applique déjà la règle. Le typer créerait un second endroit où la règle vit ; la suppression n'en crée aucun |
| 15 | qa | Le neuvième critère (budget) refusé en critère autonome | `RETENU` | Fondu dans le critère #6 ; plafond de huit tenu |

## 9 — Innovation

Aucune.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] **Non-régression de la scission** : `tsc --noEmit` et la suite `jest` **complète** verts ; le seul changement hors `brain/dossier/` et `features/dossier-format/` est le déplacement de `Book`/`BookNode`/`Edge`/`ChoicePrereq`/`ChoiceCountdown`/`NodeActionType` vers `brain/tree.ts` — **26 fichiers, liste nommée au § 5**, aucun changement de comportement, **zéro ligne** dans `src/features/{book-creation,book-library,cloud-sync,play-mode,tree-canvas}` (KR-159)
- [ ] `npm run test:mutation` : **sans objet** — aucun des quatre fichiers mutés n'est touché (KR-161)
- [ ] Tests du § 7 écrits et passants ; le test `CloudSyncService › un dossier est reconnu…` a été constaté **rouge avant correctif**
- [ ] Critères du § 6 cochés un par un
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `grep -rn 'Object.freeze' src/brain/dossier` ne renvoie que `freeze.ts`
- [ ] `git grep` sans occurrence de conversion `Book` ↔ `Dossier` dans les deux sens (KR-167)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-format-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | Sous-ensemble nommé · fixture propre à it1 · confirmation d'import au périmètre. **Réserve maintenue sur `Delta[]`**, arbitrée en `REPORTÉ` au désaccord 4 |
| Tech Lead | approuvé sous réserve | Deux lots à propriété disjointe · décompte à 26 · veto sur `get()` retenu |
| UX | feu vert sous réserve | Glyphes corrigés · parse déplacé dans `brain/` · `--surface-raised` interdit |
| QA | conditionnel → levé | AC-13 reformulé et déplacé en § 10 · matrice de rejet écrite avant le code · plafond de huit tenu |
| Narratif & IA | recevable sous réserve | Objection 1 retenue et corrigée · `canon.mj`/`partage` et `ton` retenus · budget retenu comme clause. **Aucun veto** |
