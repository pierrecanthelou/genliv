## Note d'ouverture — Tech Lead, `dossier-canon` it3

**RISQUE** — `camp` en `requis: true` invalide RÉTROACTIVEMENT tout dossier stocké ou importé portant un objectif : `DOSSIER_SCHEMA` reste 1, il n'existe aucune migration, et `DossierService.get()` re-valide à chaque lecture — la carte devient « illisible » en bibliothèque. C'est acceptable (aucune UI n'a jamais créé d'objectif ; l'anomalie est nommée, jamais silencieuse), mais ça doit être une décision écrite avec son critère, pas un effet de bord du lot contrat.

**OBJECTION** — trois, sur la définition telle qu'écrite.
1. « **un objectif par camp** » : règle de cardinalité ou description ? Si c'est une règle, elle exige une règle de validation + un code d'anomalie neuf (`issues.ts`, registre fermé par cause) + le bouton d'ajout qui s'éteint à 3 — soit un second lot contrat, donc **coupe de l'itération**. Je la lis comme descriptive ; le PM doit le dire.
2. Le critère d'acceptation #7 de la feature (« un objectif ajouté ⇒ `SECTIONS.compte()` se met à jour ») est **insatisfiable** : `SECTIONS[0].compte` vaut `'—'`, épinglé par `sections.test.ts` **et** par `dossierEditorScreen.test.tsx:59-70` (bascule-editeur). Le faire compter toucherait `brain/` + le test d'une **seconde feature** — contre KR-187 et contre le signal de coupe. À restreindre à Lieux (it4).
3. `commit()` **jette `resultat.warnings`**. it3 est la première itération dont le champ propre produit un avertissement permanent (`condition-sans-expr`, `alerteSansExpr: true` sur les deux familles d'objectif, et aucun `…_expr` saisissable avant n° 7/14). KR-183 exige qu'il soit rendu.

**PROPOSITION** — (a) `CAMPS` en `as const` dans `types.ts`, à côté de `PORTEES`/`CERTITUDES`, consommé tel quel par `ENUMERES_FERMES` ; **libellés français côté feature** en `Record<Camp, string>` exhaustif (précédent explicite de `sections.ts` : glyphe et n° de feature restent côté feature). Un seul consommateur — pas de registre à descripteurs dans `brain/`. (b) `frapperIdentifiant(espace)` **promu** à `identifiers.ts` : le 2e appelant est nommé dans la même spec (`iterations[3]`, Lieux), la forme (`FORME_IDENTIFIANT`) appartient à `brain/`, et la propriété « tout espace frappé est bien formé » ne se teste que là. (c) `requis: true` ; défaut à la création = **constante nommée de l'union**, jamais `CAMPS[0]` par position. (d) **2 lots, séquentiels — pas d'essaim.**

**VERDICT** — **recevable sous réserve** : (1) le PM tranche « un objectif par camp » ; (2) le critère #7 est restreint à it4 ; (3) le rendu de `condition-sans-expr` est spécifié dans le lot feature.

---

## Annexe — découpage en lots (propriété de fichiers disjointe)

### Lot 1 — `contrat` (seul, premier)

| # | Fichier | N/R | Contenu exact |
|---|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R | `export const CAMPS = ['protagonistes', 'antagonistes', 'joueur'] as const` · `export type Camp = (typeof CAMPS)[number]` · `Objectif` gagne `camp: Camp` (**non optionnel**) |
| 2 | `src/brain/dossier/tables.ts` | R | `ENUMERES_FERMES` += `{ path: 'canon.objectifs[].camp', location: 'Objectifs', valeurs: CAMPS, requis: true }` |
| 3 | `src/brain/dossier/destinations.ts` | R | `'canon.objectifs[].camp': 'moteur'` (analogue à `portee` ; jamais `ia`) |
| 4 | `src/brain/dossier/identifiers.ts` | R | `export function frapperIdentifiant(espace: EspaceDeNoms): string` → `` `${espace}.${randomToken()}` `` (import `../utils/id`, acyclique) |
| 5 | `src/brain/index.ts` | R | `export { CAMPS, ... } from './dossier/types'` (ligne 141) · `export type { Camp }` · `frapperIdentifiant` ajouté à la ligne 177 |
| 6 | `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | `camp` sur **chaque** objectif |
| 7 | `src/brain/dossier/__fixtures__/dossier-reference.json` | R | idem — **piège** : `suffisance.test.ts` « aucune cle en trop face a dossier-minimal » rougit si un seul des deux fichiers reçoit la clé |
| 8 | `src/brain/dossier/identifiers.test.ts` | R | propriété : `for (const espace of Object.keys(ESPACES_DE_NOMS)) expect(estIdentifiantBienForme(frapperIdentifiant(espace), espace)).toBe(true)` + non-collision sur 2 frappes |
| 9 | `src/brain/dossier/validate.test.ts` | R | un cas `camp` absent et un cas hors énumération ⇒ `valeur-hors-enumeration`, bloquant, message nommant `camp` |

**Mesure KR-186/KR-159 (remesurée, non recopiée) : 9 fichiers, pas ~6.** Et surtout **`couverture.test.ts` n'est PAS touché** — mesuré, pas supposé : `corrompre` remplace la chaîne par `42`, `ENUMERES_FERMES` la refuse ⇒ le chemin est *couvert*, donc ni entrée `LIBRES` ni `SANS_DESTINATION` ; la 4e assertion est satisfaite par les fixtures ; l'assertion `…_expr → moteur` compte `FAMILLES_DE_CONDITIONS`, inchangée. Ne sont pas touchés non plus, et c'est une décision : `amorce.ts` (`objectifs: []`, aucun objectif semé, donc **aucun défaut de camp au niveau brain**), `sections.ts`, `suffisance.test.ts`, `DossierService.ts`.

### Lot 2 — `feature` (démarre contrat figé, le lit comme donnée immuable)

| # | Fichier | N/R | Contenu exact |
|---|---|---|---|
| 1 | `src/features/dossier-canon/components/ObjectifsCanon.tsx` | **N** | `export function ObjectifsCanon({ dossierId }: { dossierId: string }): JSX.Element \| null` |
| 2 | `src/features/dossier-canon/components/PanneauCanon.tsx` | R | **≤ 6 lignes** : import + `<ObjectifsCanon dossierId={dossierId} />` après le bloc Interdits |
| 3 | `src/features/dossier-canon/tests/objectifsCanon.test.tsx` | **N** | tests du bloc |
| 4 | `src/features/dossier-canon/tests/panneauCanon.test.tsx` | R | une assertion de présence du bloc, rien de plus |

`index.ts` de la feature et `App.tsx` **intouchés** : `ObjectifsCanon` est interne au panneau, aucun nouveau slot, KR-184 hors sujet cette itération.

**Pourquoi un composant neuf et non un bloc de plus dans `PanneauCanon.tsx`** : le fichier fait **381 lignes** — le signal de découpe KR-112 est à 400. Un bloc liste + carte + `Select` + 2 `Field` + styles le pousse au-delà de 550. `ObjectifsCanon` écrit **lui-même** par `dossiers.update` (patch étroit `canon: { ...d.canon, objectifs: … }`, idiome d'it1) : aucun `commit` remonté en prop, donc zéro couplage entre les deux fichiers hormis le rendu.

### Prescriptions d'état pour le lot 2 (le plan doit les écrire, l'agent ne doit pas les inventer)

- **Brouillon local** semé une fois (`useState(() => …)`, KR-013/113) pour `nom`, `reussi_si_texte`, `echoue_si_texte`, **indexé par `objectif.id`** (jamais par rang) ; clé React = `objectif.id`, contrairement à `interdits_ton` qui n'a pas d'identité.
- **`camp` sans brouillon** : lu en ligne depuis `useOpenDossier`, commit immédiat au `change` — arbitrage d'it2 sur `lieu_id`, même motif (un `<select>` n'a pas de `blur`).
- **Ajout/retrait** : commit immédiat, comme `interdits_ton`. L'ajout frappe `frapperIdentifiant('objectif')` — **jamais un id dérivé du nom** (KR-003) — et pose `camp: CAMP_INITIAL`, constante nommée de type `Camp` (valeur à confirmer par PM/UX ; l'exigence d'architecture est qu'elle soit nommée et typée, pas positionnelle).
- **Options du `Select`** : `CAMPS.map((camp) => ({ value: camp, label: LIBELLES_CAMPS[camp] }))` — l'ordre vient du registre, jamais re-listé ; `LIBELLES_CAMPS: Record<Camp, string>` échoue à la **compilation** si un 4e camp arrive.
- **Aucun bandeau de refus** dans ce bloc : mesuré, `statut: 'refuse'` y est **inatteignable** (id bien formé par construction, `camp` fermé, `nom` et les deux `…_texte` libres, aucun prédicat ne cible l'espace `objectif` — `objectif_atteint` est explicitement écarté de `predicates.ts`). Même situation que `lieu_id` en it2 : ne pas construire un état d'erreur qui ne peut pas s'allumer.
- **Avertissements, eux, atteignables** : rendre `resultat.warnings` filtrés sur `issue.path.startsWith('canon.objectifs')` via `IssueList` (`brain/components`), région `role="status"` distincte. **Filtrer sur le `path` de l'anomalie, jamais re-dériver la règle D1 côté feature** — deux sources pour une même règle divergent en silence. Résidu à écrire noir sur blanc dans la revue : un objectif importé et jamais touché de la session n'affiche rien (le balayage systématique est le linter n° 7).

### Veto potentiel (non déclenché aujourd'hui)

Je bloque si le lot feature : importe `bascule-editeur` ou `dossier-format` ; recopie la liste des camps ou la règle D1 au lieu de lire `CAMPS` / le `path` de l'anomalie ; frappe un id par `createId()` (séparateur `_` refusé par `FORME_IDENTIFIANT`) ou depuis le `nom` ; tient une copie privée de `canon.objectifs` resynchronisée par `useEffect`.
