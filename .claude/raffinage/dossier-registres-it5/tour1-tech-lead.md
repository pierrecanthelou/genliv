# Tour 1 — `tech-lead` · `dossier-registres` it5

**RISQUE** — L'itération n'ajoute qu'UN champ ; tout le risque est dans sa FORME. `duree?: string` créerait un homonyme de `plan_actions[].duree` (entier, `DUREE_MIN`, audience `moteur`) dans un schéma que quinze features lisent, et coûterait une **dispense neuve** dans `LIBRES` (`couverture.test.ts`) — une feuille dont rien ne refuse la corruption. En entier, `CHAMPS_ENTIERS` la refuse gratuitement. Même collision que `enonce`, que j'ai fait retirer en it3 (KR-198).

**OBJECTION 1** — le critère 7 (« `effets_regles` … éditable via les opérations existantes ») contredit `destinations.ts:512-518` **et** le `design_contract` de sa propre spec (« Climat n'en a pas besoin »). Deux textes, deux plans possibles : à trancher ici, jamais à l'essaim. Je tranche NON : les quatre deltas admis sont ponctuels et événementiels ; un climat qui « donne l'objet clef-de-basalte » est une absurdité que le schéma accepte et que le domaine refuse — 4ᵉ occurrence de l'anti-patron déjà rejeté trois fois (`tier`, `lie_au_canon`, `nature`, `portee`). `roundtrip.test.ts:115` épingle d'ailleurs `effets_regles` à `[]`.

**OBJECTION 2** — `PanneauClimats.tsx` (cadrage) rompt la convention : les neuf panneaux livrés portent le nom de la **section**, pas de la collection. Clé `App.tsx` = `conditions`, titre auteur « Conditions » → `PanneauConditions.tsx` + `FicheClimat.tsx`.

**PROPOSITION** — `Climat.duree?: number` ; 3ᵉ ligne de `CHAMPS_ENTIERS` (`min: DUREE_MIN`, `location: 'Climat'`) ; destination `moteur`. Écran : `Stepper` + affordance pointillée « + Poser une durée… », motif de `BlocPlanActions.tsx:240-253` **réimplémenté, jamais importé**. Chiffré : 1 ligne de type, 1 de table, 1 de destination, 2 fixtures, 0 dispense, 0 ligne dans `validate.ts` / `identifiers.ts` / `sections.ts` / `amorce.ts` / `deltas.ts` / `brain/index.ts`.

**VERDICT** — **recevable sous réserve** : critère 7 réécrit, `duree` typée entier (ou, si le PM veut de la prose, renommée sans homonyme).

---

# ANNEXE

## 1. Découpage en lots — 2 lots séquentiels, listes disjointes

### Lot 1 — `contrat` (seul, en premier ; KR-210)

| Fichier | N/R | Ce qu'il porte |
|---|---|---|
| `src/brain/dossier/types.ts` | R | `Climat.duree?: number` + JSDoc (unité = pas d'horloge, consommateur nommé n° 14 `moteur-horloge`) |
| `src/brain/dossier/tables.ts` | R | 3ᵉ ligne de `CHAMPS_ENTIERS` + retaille du paragraphe « DEUX CHEMINS, ET DEUX SEULEMENT » (l.390-395), devenu faux |
| `src/brain/dossier/destinations.ts` | R | `'monde.conditions.climat[].duree': 'moteur'` |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | `duree` sur le climat (garde d'exhaustivité) |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R | `duree` sur le climat |
| `src/brain/dossier/validate.test.ts` | R | borne basse (`DUREE_MIN - 1` refusé), non-entier refusé, absence calme |
| `src/brain/dossier/couverture.test.ts` | R | non-régression du balayage ; **aucune entrée ajoutée à `LIBRES`** |

### Lot 2 — écran (zéro fichier `brain/`)

| Fichier | N/R | Ce qu'il porte |
|---|---|---|
| `src/features/dossier-registres/components/PanneauConditions.tsx` | N | liste + réordonnancement + ajout, anatomie `PanneauQuetes.tsx` |
| `src/features/dossier-registres/components/FicheClimat.tsx` | N | `Field` NOM + `Stepper`/affordance DURÉE + `IssueList` de refus |
| `src/features/dossier-registres/components/styles.ts` | R **si besoin** | it4 l'avait listé et n'y a rien touché ; le lot en est propriétaire exclusif |
| `src/features/dossier-registres/index.ts` | R | `export { PanneauConditions }` |
| `src/features/dossier-registres/tests/panneauConditions.test.tsx` | N | critères + isolation des 9 autres sections |
| `src/App.tsx` | R | `conditions: <PanneauConditions dossierId={…} />` |

**Pas de 3ᵉ lot.** Une tranche verticale à un champ : deux lots séquentiels, aucun worktree, aucune fusion.

## 2. Signatures figées

| Contrat | Type | Sens | Signature **exacte** |
|---|---|---|---|
| `Climat` | type | lot 1 fournit / lot 2 consomme | `interface Climat extends Entite { effets_regles: Delta[]; duree?: number }` — **optionnel** (additif, KR-191) |
| `CHAMPS_ENTIERS` | table | lot 1 fournit | `{ path: 'monde.conditions.climat[].duree', location: 'Climat', min: DUREE_MIN }` |
| `DESTINATION_DES_CHAMPS` | table | lot 1 fournit | `'monde.conditions.climat[].duree': 'moteur'` |
| `DUREE_MIN` | constante | lot 2 consomme | `export const DUREE_MIN = 1` — déjà sortie de `brain/index.ts:213` |
| `Stepper` | composant | lot 2 consomme | `Stepper({ label, value, onChange, min?, max?, prefix? })` — passer **`min={DUREE_MIN}` seul**, jamais `max` |
| `frapperIdentifiant` | fonction | lot 2 consomme | `frapperIdentifiant('climat')` — espace déjà enregistré (`identifiers.ts:56`) |
| `DossierService.update` | service | lot 2 consomme | **trois racines nommées, jamais un spread de `dossier`** (patron `PanneauEvenements.tsx:162`) |
| `PanneauConditions` | composant | lot 2 fournit | `({ dossierId }: { dossierId: string }): JSX.Element \| null` |

## 3. Bornes pour l'ouvrier — vérifiées par lecture directe

### (a) Le geste d'ajout doit-il écrire `effets_regles: []` explicitement ? — **OUI**

Mais **pas** via `LISTES_REQUISES` : `tables.ts:366-371` ne porte que `monde.conditions.climat` (la liste **des climats**). C'est `CHEMINS_DE_DELTAS` (`tables.ts:624`) qui l'exige, via la boucle §7 de `validate.ts:623-636` — `site.valeur === undefined` → `champ-requis-vide`, **bloquant**. Un climat créé sans la clé serait **refusé** par `DossierService.update`.

Corollaire : la création est un **commit immédiat** (patron it1/it3/it4), **jamais** le brouillon différé d'it2 — `Entite.nom` est optionnel et `duree` aussi, aucun `CHAMPS_REQUIS` au niveau du climat. Littéral exact :

```ts
const nouveau: Climat = { id: frapperIdentifiant('climat'), effets_regles: [] }
```

### (b) Ricochets — **aucun attendu, un piège nommé**

- `importDossier.test.tsx:114` (`'5 anomalies'` en dur) : **zéro ricochet**. Les trois précédents venaient tous d'une **référence vers l'espace `pnj`**. `duree` est un entier : aucune référence, aucune collection. Même conclusion qu'it4.
- `roundtrip.test.ts:115` épingle `climat[0].effets_regles` à `[]`. Toute tentative de semer un `Delta` sous un climat le fait rougir — **et** inverse l'assertion discriminante de `dossier-format` it5. Deux instruments qui pointent la même décision.

### (c) `identifiers.ts` / `sections.ts` / `amorce.ts` / `deltas.ts` — **zéro ligne, les quatre**

| Fichier | Lignes neuves | Preuve lue |
|---|---|---|
| `identifiers.ts` | **0** | `climat` déjà dans `ESPACES_DE_NOMS` (l.56) et `COLLECTIONS_IDENTIFIEES` (l.133) |
| `sections.ts` | **0** | `{ num: 9, id: 'conditions', … }` (l.121-130) compte déjà. La note l.122-124 ne se déclenche pas : KR-207 a rejeté `contraintes` |
| `amorce.ts` | **0** | `conditions: { climat: [] }` déjà semé (l.116) |
| `deltas.ts` + `deltas.test.ts` | **0** | Corollaire de l'absence d'`EditeurEffets`. **Et même si le comité renversait cette décision**, l'allow-list KR-215 ne gagnerait toujours aucun porteur : le seul consommateur resterait `EditeurEffets.tsx`, déjà autorisé |
| `validate.ts` | **0** | La boucle §6 bis (l.515-529) est générique sur `CHAMPS_ENTIERS` |
| `brain/index.ts` | **0** | `Climat`/`Conditions` (l.319-320), `DUREE_MIN` (l.213), `Stepper` (l.427) sortent déjà |

### Bornes supplémentaires

1. **`location: 'Climat'`, pas `'Conditions'`** — `'Conditions'` est le OÙ de la liste, `'Climat'` celui d'un champ d'un climat (`CHEMINS_DE_DELTAS`, `tables.ts:624`).
2. **Aucun repli de lecture `?? DUREE_MIN`** — `duree === undefined` rend l'affordance pointillée ; rien n'est écrit au montage. Précédent : `BlocPlanActions.tsx:85-88` + `fichePersonnage.test.tsx:473-502`. Garde KR-013.
3. **Le motif de `BlocPlanActions.tsx` se réimplémente, ne s'importe pas** — `dossier-fiches` → `dossier-registres` serait un import inter-features : veto immédiat, `npm run lint` le refuse déjà.
4. **Encapsulation** — `PanneauConditions.tsx` ne cherche jamais un élément de `FicheClimat.tsx` par `querySelector` ni par libellé recopié (dette BUG-078). Le focus après ajout passe par une `ref` que le panneau **possède** (`PanneauEvenements.tsx:141`).
5. **`EditeurEffets.tsx` n'est dans aucun lot** — le prouver par un test qui édite `nom` puis `duree` sur un climat portant un `effets_regles` **non vide en mémoire** et vérifie qu'il ressort intact.
6. **Retrait d'un climat : hors périmètre**, statut inchangé depuis it1/it2.
7. **KR-159/186** : le test d'isolation compte **9 autres sections** — recompter dans le fichier, jamais recopier.
