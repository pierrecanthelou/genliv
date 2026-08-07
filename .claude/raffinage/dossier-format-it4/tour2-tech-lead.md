# Tour 2 — Tech Lead · `dossier-format` it4

**RÉPONSE À L'UX (objection 2, `cible`/`grandeur`)** — la collision est réelle, je la tranche **par suppression, pas par renommage** : le descripteur n'a ni `cible` ni `grandeur`. La grandeur mutée vit en **JSDoc par entrée, en prose**, comme le « Y répond : … » de `PREDICATES`. Un champ `grandeur` n'a aucun lecteur avant la n° 9 ; le renommer ne fait que déplacer la dette sous un nom moins ambigu.

**RÉPONSE AU NARRATIF (annexes A et B)** — l'annexe A répond à mon RISQUE (C12) : `reveler_indice` écrit ce que lit `indice_connu`, `atteindre_jalon` ce que lit `jalon_atteint`. **Mon RISQUE est levé** — par le relevé, pas par une règle de mon cru. **J'abandonne « fermeture lecture/écriture prouvée par test »** : non mesurable, le champ écrit étant de la prose. Remplacé par deux assertions mécaniques (annexe).

**MES OBJECTIONS** — objection 1 (arrêt du balayage) : **maintenue et tranchée**. Objection 2 (`cible` au contrat) : **maintenue**, la spec est fautive. **Aucun veto.**

---

## C5 — ma dérivation, mesurée : elle est **fausse deux fois**, je la retire

1. **La soustraction est vide.** `COLLECTIONS_IDENTIFIEES ∪ LISTES_REQUISES` = 13 chemins ; `CHEMINS_DE_DELTAS` = 4 ; intersection **∅**. Le filtre ne retire rien : c'est du **code mort**.
2. **L'union sur-couvre.** Les 10 collections sont **déjà gardées** : un élément non-objet y donne `id === null` dans `collectIds` → `champ-requis-vide`, bloquant **depuis it1**. Le trou réel est exactement **3 chemins** : `plan_actions`, `savoirs`, `resolutions`. Et `monde.conditions.climat` est dans **les deux** tables : l'union non dédupliquée produisait **deux anomalies identiques**.

**Dérivation retenue : `LISTES_REQUISES` moins `COLLECTIONS_IDENTIFIEES`** — une ligne, deux tables existantes, et la soustraction **fait réellement quelque chose** (elle retire `climat`). Je refuse aussi la table dédiée (UX/QA) : elle re-listerait trois chemins déjà écrits, et une liste ajoutée en n° 4/5/6 n'hériterait pas du garde.

**Correction à journaliser** : le symptôme de BUG-050 **sur-déclare** (« toute entité d'une collection identifiée » sort `ok:true` — **faux**), et le test QA n° 6 (`jalons[].effet: ['du texte']`) doit attendre **`delta-en-prose`**, fermé depuis it2.

## C7 — migration de `depart.lieu_id` : **confirmée**

Les trois tests d'it1 restent verts (`path`, `entityId`, `location`, `{champ}` → `lieu_id`) **à condition** que la ligne porte un `sujet` gardant la phrase verbatim. **Un changement de comportement, nommé** : le § 5a supprime aujourd'hui la pendante quand `monde.lieux` est une racine absente ; la boucle générique ne le fera pas. Aucun test ne l'assert, et le § des conditions **ne supprime déjà pas** — la migration rend le module **cohérent**. À classer **PORTÉ** (KR-162).

## C4 — clé `delta`, pas `op` : **je me déjuge**

Je suis le narratif contre l'UX **et contre ma propre note**. Motif : dans ce module `op` désigne les quatre **opérateurs structurels** d'`ExprNode` ; la clé de registre d'un prédicat est `predicat`. Par la même règle, celle d'un delta est `delta`. `op` serait le seul endroit du module où `op` nomme une clé de registre.

## C6 — je retire `element-non-objet`

`objet` est un **espace de noms du domaine** (`ESPACES_DE_NOMS.objet`) : la n° 7 lirait « pas une entité Objet ». Retenu : **`element-non-structure`**, aligné sur « liste d'effets structurés » de `delta-en-prose`. L'UX garde la main sur le **texte**, pas sur le code.

## C3 — registre à slots de référence, 4 entrées

Les quatre entrées à opérande entier tombent sur KR-130. J'ajoute un motif d'architecture sur `bonus_defense` : sa seule provenance est `action-pnj`, **feature supprimée** — ressusciter une sémantique effacée par un contrat que quinze features consomment est exactement ce que la décision A interdit.

## C13 — une seule itération, **mesuré**

`validate.test.ts` épingle à lui seul la **cardinalité d'`issues.ts`** (`toHaveLength(16)`), le **comportement à la compilation de `types.ts`** et le comportement du validateur. Tout découpage en deux lots le nomme **deux fois** — c'est structurel, pas conjoncturel. Et il n'y a **aucun parallélisme à gagner**.

Si le comité veut malgré tout scinder l'**itération** : la coupe passe entre **(b)+(c)** [intégrité référentielle simple + garde d'éléments — ils ne touchent **ni la fixture ni `destinations.ts`**] et **(a)** [le registre], **dans cet ordre** ; coût 5 fichiers rouverts, zéro reprise. Couper dans l'autre sens fait payer **deux fois** la fixture et les destinations. **Je recommande une seule itération.**

## C14 — mon estimation, **retirée**

Base mesurée **607 l., pas 602** : j'ai affirmé au lieu de mesurer. Et **le plafond de 650 était mon invention** — il n'existe nulle part dans le dépôt ; la règle réelle est KR-112 (400 = signal, 800 = bloqueur), écrite pour un composant ou un hook. Recompte : −19 (§ 5a) −7 (`decrireValeur` monte) +30 (références) +25 (deltas) +22 (éléments) ≈ **658**.

**Décision ferme, non conditionnelle : pas d'extraction de `references.ts`** — une boucle, un appelant, c'est ma propre dette. Si la porte mesure **> 700**, l'ouvrier **s'arrête et rapporte**, il n'improvise pas de coupe.

**VERDICT — recevable**, un lot, sans veto. Réserves fermes : arrêt dérivé + refus de toute clé inconnue ; dérivation BUG-050 corrigée ; clé `delta` ; 4 entrées de référence.

---

## ANNEXE — signatures définitives

### Ordre des modules (acyclique)

`identifiers` → `issues` → `predicates` → `expr` → **`deltas`** → `types` → `tables` → `validate`

`deltas.ts` **n'importe ni `expr.ts` ni `predicates.ts`** : deux registres frères ne se dépendent pas. `SiteDelta` est **recopié** (4 lignes).

### `deltas.ts` (N)

```ts
export interface DeltaDescripteur {
	label: string
	/** L'ARITÉ est `refKinds.length`, DÉRIVÉE, jamais stockée (KR-165). */
	refKinds: readonly EspaceDeNoms[]
}

export const DELTAS = defineRegistre<DeltaDescripteur>()({
	donner_objet:    { label: "donne l'objet",           refKinds: ['objet'] },
	retirer_objet:   { label: "retire l'objet",          refKinds: ['objet'] },
	reveler_indice:  { label: "révèle l'indice",         refKinds: ['indice'] },
	atteindre_jalon: { label: 'marque le jalon atteint', refKinds: ['jalon'] },
})
export type DeltaId = keyof typeof DELTAS

export interface Delta { delta: DeltaId; cibles: string[] }
export interface SiteDelta { path: string; location: string }

/** TOTALE sur `unknown`, ne lève JAMAIS. `estCleDe(DELTAS, …)` — jamais `in`, jamais un `as` (KR-175).
 *  Refuse TOUTE clé inconnue : contrepartie indissociable de l'arrêt du balayage. */
export function validateDelta(valeur: unknown, site: SiteDelta): DossierIssue[]

export interface RefDeltaCollectee { id: string; espace: EspaceDeNoms; delta: DeltaId }

/** Totale SUR UN DELTA DÉJÀ ACCEPTÉ. Appelée UNIQUEMENT si `validateDelta` s'est tue. */
export function collectDeltaRefs(valeur: unknown): RefDeltaCollectee[]
```

### `identifiers.ts` (R) — deux extractions **au troisième appelant**, mandatées par le code lui-même

```ts
/** Factory d'identité — 3ᵉ appelant (ESPACES_DE_NOMS, PREDICATES, DELTAS) :
 *  `predicates.ts` avait écrit « Extraction au troisième ». */
export const defineRegistre = <V>() => <K extends string>(map: Record<K, V>): Record<K, V> => map

/** 3ᵉ appelant (validate.ts, expr.ts, deltas.ts) — même seuil. */
export function decrireValeur(valeur: unknown): string
```

`predicates.ts` (R) et `expr.ts` (R) entrent au lot **pour ces deux renommages seuls**. Ce n'est pas de l'élargissement : c'est une dette que le code avait **datée**.

### `tables.ts` (R) — une table neuve, une dérivée

```ts
export const REFERENCES_SIMPLES: readonly ReferenceSimple[] = [
	{ path: 'charpente.depart.lieu_id',                                      espace: 'lieu',   location: 'Point de départ', sujet: 'Le point de départ' },
	{ path: 'monde.personnages[].savoirs[].indice_id',                       espace: 'indice', location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.contrepartie.objet_id', espace: 'objet',  location: 'Personnages' },
	{ path: 'monde.personnages[].savoirs[].revele_si.apres_indice_id',       espace: 'indice', location: 'Personnages' },
]

/** BUG-050 — DÉRIVÉE, jamais une 5ᵉ table. Les collections identifiées sont déjà
 *  gardées par `collectIds` : les inclure produirait deux anomalies pour une cause.
 *  Vaut 3 chemins aujourd'hui. */
export const LISTES_A_ELEMENTS_STRUCTURES: readonly ChampRequis[] = LISTES_REQUISES.filter(
	(liste) => !COLLECTIONS_IDENTIFIEES.some((collection) => collection.path === liste.path),
)
```

### `validate.ts` (R) — trois sections

- **§ 5a réécrit** : boucle sur `REFERENCES_SIMPLES`. `undefined` → passe ; chaîne vide → passe (`CHAMPS_REQUIS` en est propriétaire) ; non-chaîne ou mauvais préfixe → `identifiant-invalide` ; sinon appartenance à `idsPortes` → `reference-pendante`.
- **§ 6 ter neuf** : boucle sur `LISTES_A_ELEMENTS_STRUCTURES`, `path` = `${site.path}[${rang}]`.
- **§ 7 étendu** : `delta-en-prose` conservé sur la liste, puis par élément `validateDelta` → `collectDeltaRefs` → `reference-pendante` nommant `DELTAS[ref.delta].label`.

### `couverture.test.ts` (R)

```ts
const CHEMINS_D_ARRET = new Set([
	...FAMILLES_DE_CONDITIONS.map((famille) => famille.expr),
	...CHEMINS_DE_DELTAS.map((chemin) => chemin.path),
])
```

+ assertion **de valeur** (KR-174) : tout chemin de `CHEMINS_DE_DELTAS` a une destination valant `moteur`, **dérivée de la table**.
+ assertion : *aucune feuille ne descend dans un delta*.
+ en-tête : « LES ÉLÉMENTS DE LISTE NON-OBJET » **retiré**, l'assertion `toContain` rougira si on l'oublie.
+ le littéral `'…consequence[]'` **part** (ce serait une seconde liste de chemins de delta).

### Fixture (R)

`recompense: [{ delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }]` · `consequence: [{ delta: 'reveler_indice', … }, { delta: 'retirer_objet', … }]` (deux éléments : éprouve le balayage sur un tableau peuplé) · `effet: [{ delta: 'atteindre_jalon', … }]` · **`effets_regles: []`**.

### Le lot

| Lot | Type | Ouvrier | Worktree |
|---|---|---|---|
| `contrat-dossier-it4` | **contrat** | `dev-contrat` | **non** |

**N** : `deltas.ts` · `deltas.test.ts`
**R** : `identifiers.ts` · `predicates.ts` · `expr.ts` · `types.ts` · `tables.ts` · `issues.ts` · `validate.ts` · `destinations.ts` · `__fixtures__/dossier-minimal.json` · `couverture.test.ts` · `validate.test.ts` · `src/brain/index.ts`

**Ouvrables sous KR-162** : `roundtrip.test.ts`, `read.test.ts`, `identifiers.test.ts`, `expr.test.ts` (renommage), `importDossier.test.tsx` (il lit **la même fixture**). Deux tests **portés** : « un objet aux quatre chemins de delta passe » s'**inverse**, et le test de compilation devient « `Delta` refuse une chaîne ». `toHaveLength(16)` → `19`.

**Dans `deltas.test.ts`** : `DELTAS compte quatre entrées` · tout `refKinds` a une ligne dans `COLLECTIONS_IDENTIFIEES`, `bestiaire` jamais · tout espace d'un `refKinds` de `DELTAS` est aussi nommé par un `refKinds` de `PREDICATES` (**proxy mesurable de la fermeture**) · `DELTAS['toString']` / `['constructor']` (KR-175, régression BUG-053) · `validateDelta` totale sur du bruit · label français sans syntaxe · test-grep de non-export.
