RISQUE — **`DELTAS` ne sort pas du baril, et un test nommé l'interdit.** `brain/index.ts` (l. 134-139) n'exporte que les types `Delta`/`DeltaId` ; `deltas.test.ts:160-181` vérifie qu'aucun fichier hors `brain/dossier/` ne porte `\bDELTAS\b` et annonce que le prochain demandeur « devra SUPPRIMER ce test ». Or `EditeurEffets` ne peut ni re-lister les quatre libellés (KR-117) ni deviner `refKinds`. Le vrai travail du lot contrat est là, et il est absent du goal. Piège à refuser nommément : une projection `EFFETS` dérivée passerait le grep sans rien décider — contournement d'un contrat `brain/`, **veto**.

OBJECTION — (i) `EtapeQuete.etape` recopie un défaut mesurable de son précédent : `useEcriturePlan.ts:201` écrit `index+1`, `:270` retire sans renuméroter → `1,3,4`, qu'aucune table ne contrôle (`CHAMPS_ENTIERS` exclut délibérément `plan_actions[].etape`, `tables.ts:364-369`). Un ordinal sans consommateur ni garde est la classe `tier`/`lie_au_canon`/`Indice.portee`, rejetée trois fois ici. (ii) `Quete.objectif` : l'exception KR-198 n'est pas motivée — le mal qu'elle nomme est un piège de compréhension à l'échelle du schéma, et le successeur du `lie_au_canon` rejeté s'appellerait `objectif_id`. `but` non plus : homonyme de `Personnage.but` avec une autre FORME, c'est `plan`/`plan_actions` rejoué.

PROPOSITION — (a) `etapes[].libelle` en `CHAMPS_REQUIS` + `etapes` en `LISTES_OPTIONNELLES_STRUCTUREES` (BUG-050) : motif exact `contre_mesures[].action`, brouillon différé au seul niveau de l'étape — `Quete` n'a aucun champ requis, la quête se crée en commit immédiat (KR-214 vérifié). (b) `etape` renumérotée à chaque écriture + un test nommé, sinon pas de champ. (c) clé `enonce`. (d) `EditeurEffets` boucle sur `refKinds` : lire le contrat n'est pas abstraire. (e) allow-list dans `deltas.test.ts`, écrite en lot 1, verte dans les deux lots.

VERDICT — **recevable sous réserve** : (a), (c) et (e) entrent au plan, sinon le lot écran ne compile pas ou le lot contrat rougit seul.

---

### Annexe — découpage en lots (propriété disjointe, vérifiée fichier par fichier)

**Lot 1 — `contrat` — seul, en premier (KR-210).** Aucun fichier partagé avec le lot 2.

- R `src/brain/dossier/types.ts`
- R `src/brain/dossier/tables.ts`
- R `src/brain/dossier/destinations.ts`
- R `src/brain/dossier/couverture.test.ts`
- R `src/brain/dossier/validate.test.ts`
- R `src/brain/dossier/deltas.test.ts`
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`
- R `src/brain/dossier/__fixtures__/dossier-reference.json`
- R `src/brain/index.ts`

**Ni `validate.ts`, ni `identifiers.ts`, ni `amorce.ts`, ni `sections.ts`** : aucune branche neuve (trois lignes de table suffisent), espaces `quete`/`pnj` déjà enregistrés (`identifiers.ts:46`, `:127`, `:131`), `monde.quetes: []` déjà semé (`amorce.ts:114`), `SECTIONS[7].id === 'quetes'` déjà là (`sections.ts:109-112`).

```ts
// types.ts
export interface EtapeQuete {
	/** L'ordre de l'étape. RENUMÉROTÉE À CHAQUE ÉCRITURE (index+1) par l'écran —
	 *  sans quoi elle diverge en silence, comme `plan_actions[].etape` après un retrait. */
	etape: number
	/** REQUIS DANS SON ÉLÉMENT (la liste reste optionnelle) — motif `contre_mesures[].action`. */
	libelle: string
}

export interface Quete extends Entite {
	recompense: Delta[]     // INCHANGÉ
	donneur_id?: string     // référence espace `pnj`
	enonce?: string         // JAMAIS `objectif` (KR-198), JAMAIS `but` (homonyme d'une autre forme)
	etapes?: EtapeQuete[]
	echeance?: string
}

// tables.ts — TROIS lignes, aucune table neuve
CHAMPS_REQUIS                    += { path: 'monde.quetes[].etapes[].libelle', location: 'Quêtes' }
LISTES_OPTIONNELLES_STRUCTUREES  += { path: 'monde.quetes[].etapes', location: 'Quêtes' }
REFERENCES_SIMPLES               += { path: 'monde.quetes[].donneur_id', espace: 'pnj', location: 'Quêtes' }
// AUCUNE ligne CHAMPS_ENTIERS pour `etapes[].etape` — symétrie EXPLICITE avec
// l'arbitrage écrit en `tables.ts:364-369`, à recopier en commentaire, pas en table.

// destinations.ts — CINQ lignes
'monde.quetes[].donneur_id': 'moteur',          // un identifiant est un HANDLE (précédent relations[].cible_id)
'monde.quetes[].echeance': 'auteur',            // précédent EXACT `but.echeance` (destinations.ts:~200)
'monde.quetes[].etapes[].etape': 'moteur',
'monde.quetes[].enonce': /* ⚠ voir ci-dessous */,
'monde.quetes[].etapes[].libelle': /* ⚠ voir ci-dessous */,

// brain/index.ts — LE point de contrat de l'itération
export { DELTAS } from './dossier/deltas'
```

⚠ **Deux lignes d'audience que personne n'a mandat d'arbitrer** (`narratif-ia` non convoqué, L10) : `enonce` et `etapes[].libelle`. Précédent de traitement dans ce dépôt : `PORTEES_CONTRE_MESURE` (« valeurs posées par le lot contrat, pas par un rôle du comité — angle mort assumé, tracé en `open_questions` »). Recommandation par défaut : **`auteur`**, qui se desserre vers `ia` en UNE ligne sans coût le jour où la n° 10 existe (mot pour mot l'argument de `but.echeance`), l'inverse coûtant une fuite. Si le PM veut `ia` (le PNJ donneur doit savoir ce qu'il demande), c'est défendable — mais alors la décision est écrite au plan, pas laissée au dev-contrat.

**La réécriture de `deltas.test.ts:160-181` — la seule forme qui garde le lot 1 vert SEUL** :

```ts
// Le registre sort du baril pour UN consommateur NOMMÉ, pas pour tout le monde.
const AUTORISES = ['index.ts', path.join('features', 'dossier-registres', 'components', 'EditeurEffets.tsx')]
expect(porteurs.filter((f) => !AUTORISES.includes(f))).toEqual([])
// VERT DANS LES DEUX LOTS : après le lot 1, `porteurs` = ['index.ts'] ; après le lot 2,
// les deux. Un TROISIÈME fichier rougit — le cliquet tient, la clause d'escalade aussi.
expect(registre.test('import { CHEMINS_DE_DELTAS } from ./tables')).toBe(false)   // discriminant CONSERVÉ
```

Un `toEqual([...les deux fichiers])` écrit en lot 1 rendrait **le lot 1 rouge isolément** : c'est le découpage qui révèle la forme, pas l'inverse.

Contreparties **obligatoires dans ce lot**, sinon il n'est pas vert seul :
1. `couverture.test.ts` — dispenses `TEXTE_OPTIONNEL_LIBRE`/prose d'entité pour `enonce` et `echeance` (jamais une 16ᵉ constante au texte voisin) ; `libelle` est couvert par la corruption puisqu'il est REQUIS ; le compte des proses d'entité est **remesuré**, jamais recopié (KR-159).
2. Les **deux** fixtures instancient les cinq chemins (une quête avec `donneur_id` vers un `pnj` existant, `enonce`, `echeance`, deux `etapes`) — sans quoi « aucune ligne morte dans `DESTINATION_DES_CHAMPS` » et « une instance par chemin de table » rougissent. **Vérifier que la minimale reste sans avertissement** (`couverture.test.ts:~420`).
3. `validate.test.ts` — un poseur par ligne de table neuve (3), dont l'orpheline de `donneur_id` et l'`etapes: ["du texte"]` de BUG-050.

**Lot 2 — `feature` — démarre contrat figé, le lit comme donnée immuable.**

- N `src/features/dossier-registres/components/PanneauQuetes.tsx`
- N `src/features/dossier-registres/components/FicheQuete.tsx`
- N `src/features/dossier-registres/components/EditeurEffets.tsx`
- N `src/features/dossier-registres/hooks/useEcritureEtapes.ts` — **pré-autorisé** (KR-112) : `PanneauJalonsFins` a franchi 400 l. à l'it2 et l'extraction a été improvisée ; ici elle est **dans la liste de fichiers dès le départ**, un lot ne découvre pas un fichier en cours de route.
- N `src/features/dossier-registres/tests/panneauQuetes.test.tsx`
- R `src/features/dossier-registres/components/styles.ts`
- R `src/features/dossier-registres/index.ts`
- R `src/App.tsx` (une clé : `quetes: <PanneauQuetes dossierId={route.dossierId} />`)

Consomme uniquement : `DELTAS`, `type Delta`, `type DeltaId`, `type Quete`, `type EtapeQuete`, `type EspaceDeNoms`, `type SelectOption`, `avecOrpheline`, `localiserEntite`, `frapperIdentifiant('quete')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, Select, ListRow, IconButton, IssueList}`.

```tsx
// EditeurEffets.tsx — PUREMENT DE RENDU (précédent FicheIndice) : il ne lit JAMAIS le
// dossier. `objet`/`indice` vivent sous `monde`, `jalon` sous `charpente` — la forme du
// document appartient au parent, ce composant n'a aucune raison de la connaître.
export interface EditeurEffetsProps {
	effets: Delta[]
	optionsParEspace: Partial<Record<EspaceDeNoms, SelectOption<string>[]>>
	/** Commis SEULEMENT quand l'effet ET toutes ses cibles sont choisis (voir règle 2). */
	onAjouter: (delta: DeltaId, cibles: string[]) => void
	onChangerCible: (rang: number, position: number, cibleId: string) => void
	onRetirer: (rang: number) => void
	legende?: string
}
```

Trois règles de rendu, à écrire au plan (elles évitent trois refus du validateur) :

1. **Une cible par entrée de `refKinds`, jamais une en dur** :
   `DELTAS[effet.delta].refKinds.map((espace, position) => <Select label="CIBLE" options={avecOrpheline(optionsParEspace[espace] ?? [], effet.cibles[position] ?? '', espace)} … />)`. Ce n'est pas une généralisation spéculative : `deltas.ts` déclare l'arité **dérivée et jamais stockée** et `Delta.cibles` est un tableau « même à l'arité 1 ». Coût nul face au codage en dur. **Aucun test ne peut la discriminer aujourd'hui** (4 entrées d'arité 1) — la revue l'écrit comme non vérifiée plutôt que de la compter vérifiée.
2. **Ligne d'ajout à deux temps, rien au document avant d'être bien formé.** `cibles: ['']` est **refusé** (`identifiant-invalide`, bloquant) : l'EFFET choisi vit en `useState` local d'`EditeurEffets` (aucune copie de la SSOT — rien n'est encore persisté), et le commit part au choix de la dernière cible non vide. Précédent exact : `handleAjouterLien` de `PanneauIndices.tsx:212` (`if (cibleId === '') return`), et le brouillon différé d'it2.
3. **On ne change pas l'EFFET d'une ligne écrite** — on la retire et on en ajoute une. Changer `donner_objet` → `reveler_indice` laisserait un `objet.x` sous un espace `indice` : refus bloquant sur un document qui était valide. Une prop de moins, une classe de refus en moins ; `onChangerCible` (même espace) reste, précédent `onChangerLien`.

```ts
// useEcritureEtapes.ts — le brouillon différé, RÉIMPLÉMENTÉ, jamais importé de
// dossier-fiches (`useEcriturePlan.ts` appartient à une autre feature : un import
// croisé est un veto, et l'ESLint d'isolation le refuse de toute façon).
handleBlurEtape(index, valeur): // `libelle` vide n'entre jamais au document
handleRetirerEtape(index):      // RENUMÉROTE : etapes.filter(…).map((e, i) => ({ ...e, etape: i + 1 }))
```

**Pourquoi 2 lots et pas 3.** Un lot « EditeurEffets » séparé et un lot « écran Quêtes » devraient nommer `styles.ts`, `index.ts` et `App.tsx` en commun, et le second importerait un composant qu'il ne possède pas pour compiler — donc invérifiable seul. Le gain de parallélisme serait nul (le second attend le premier). **Deux lots ⇒ exécution séquentielle, ni worktree ni fusion.**

**Étanchéité vérifiée par lecture** : zéro fichier de `bascule-editeur` (l'entrée `quetes` de `PANNEAU_PAR_SECTION`, `PanneauSection.tsx:24`, reste en place et sert de repli — exactement comme `indices` après it1 et `jalons-fins` après it2, KR-184 tenu), zéro fichier de `dossier-canon`, `dossier-fiches` ou `tree-canvas` (KR-204/205 tenus par construction), zéro fichier partagé entre les deux lots.
