# Tour 2 — tech-lead, `dossier-fiches` it4

**À UX, nommément (objection 1, `ListRow`).** Fondée, je la reprends à mon compte : racine `<button type="button">` (`brain/components/ListRow.tsx:33`) — un `Field` imbriqué est du HTML invalide et un piège clavier. Ta parade (`div` bordé stylé dans `styles.ts`) ne change **rien** au découpage : les deux fichiers touchés sont déjà au lot 2. C'est le point qui compte : un `brain/components/LigneEditable.tsx` aurait basculé en **lot 1** et retardé l'essaim pour un composant à un seul appelant. Lot 2 inchangé.

**À narratif-ia (`but.echeance`).** Mon asymétrie du regret ne tient plus. Elle protégeait le desserrement `auteur → ia` ; ton `echeance_expr` additif sous la grammaire jumelle offre la même sortie sans migration — le regret est borné des deux côtés. Et l'argument décisif est le tien : `libelle`/`pourquoi` sont `ia`, un tiroir `auteur` au milieu d'un objet dont les deux sœurs partent au modèle est une surprise d'auteur, pas une prudence. **`ia`, prose, jamais un compte.**

**`duree` : `moteur`, entier, `DUREE_MIN = 1` — confirmé**, ça ferme mon lot contrat (annexe). **`docs/REGLES-PLAY.md` est le bon fichier**, pas `REGLES-DU-JEU.md` : orchestration, hors des quatre fichiers mutés — it4 ne déclenche **ni table dorée ni `test:mutation`**.

**Statut de mes points du tour 1**

1. Trou listes optionnelles (`contre_mesures: ["x"]` → `ok:true`) — **durci en veto**.
2. Critère #7 — **maintenue**, sous la forme QA (7a/7b) ; « scinder » l'emporte sur « retirer ».
3. `portee` → `PorteeContreMesure` — **maintenue**.
4. Brouillon à l'ajout d'étape — **maintenue**.
5. `echeance = auteur` — **retirée**.
6. `duree` en prose — **retirée**.
7. `wc -l < 400` sur les deux fichiers — **maintenue**.

---

## ANNEXE

### 1. À QA — convergence sur #7, et la nuance que je retiens

« Réécrire » et « scinder » ne divergent que sur une branche : je laissais ouverte l'option **retirer** le critère. Elle tombe — `contre_mesures` a un besoin réel d'avertissement, donc le critère ne disparaît pas, il se dédouble. Forme retenue, celle de QA :

- **#7a** — `contre_mesures[].declencheur_texte` sans `_expr` → avertissement, prouvé par **balayage** de `FAMILLES_DE_CONDITIONS` (jamais un littéral) ; la 7e ligne porte `alerteSansExpr: **true**` (correction de ma signature du tour 1, qui écrivait `false` par symétrie avec `plan_actions` — l'audience arbitrée par narratif-ia et le besoin QA imposent `true`).
- **#7b** — `plan_actions[]` reste calme, en **étendant** le test discriminant `validate.test.ts:1709-1740`, **sans nouveau fichier de test**. Ce n'est pas un renversement (règle post-BUG-069) : l'arbitrage d'it1 tient, #7 le décrivait mal.

Conséquence sur le balayage : `validate.test.ts:1721` compte `alerteSansExpr ? 1 : 0` par famille — la 7e ligne à `true` fait passer les familles alertantes de 3 à 4 et les calmes restent 3. **Compte à remesurer, jamais à recopier** (KR-159).

### 2. `si_bloque` sans `duree` (proposition 3 de narratif-ia) — accepté **sous condition de forme**

Recevable sur le fond : prose que le moteur ne pourra jamais injecter = référence orpheline, doctrine du dépôt. Mais **jamais une ligne de `FAMILLES_DE_CONDITIONS`** — la table a la forme `{ expr, texte, location, alerteSansExpr }`, `si_bloque` n'a pas de jumeau `_expr` (précédent `cede_si`), l'y forcer corrompt le balayage discriminant. Donc : **contrôle nommé et isolé dans `validate.ts`** (~6 lignes), code d'anomalie propre, un test à deux personnages. C'est le choix **non abstrait** — assumé comme tel.

Clause à écrire dans les ~8 lignes de `REGLES-PLAY.md` : ce que fait le moteur quand l'étape suivante n'a **pas** de `declencheur_expr` (elle est `alerteSansExpr: false`, donc légitimement absente) — sinon « bloquée » n'a pas de sortie définie. Doc-only en it4, aucune validation.

### 3. Lots — inchangés, plafond PM tenu

| Lot | Nature | Fichiers (N = créé, R = remplacé) | Exécution |
|---|---|---|---|
| **1** | **contrat** | `src/brain/dossier/types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `validate.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `couverture.test.ts` (R) · `validate.test.ts` (R) · `src/brain/index.ts` (R) · **`docs/REGLES-PLAY.md` (R — écrit EN PREMIER dans le lot)** | Seul, en premier |
| **2** | feature | `hooks/useEcriturePersonnages.ts` (N) · `components/BlocPlanActions.tsx` (N) · `components/BlocCaracteristiques.tsx` (N) · `components/PanneauPersonnages.tsx` (R) · `components/FichePersonnage.tsx` (R) · `components/styles.ts` (R) · `tests/panneauPersonnages.test.tsx` (R) · `tests/fichePersonnage.test.tsx` (R) | Séquentiel, après 1 |
| **3** *(optionnel)* | fallout | `src/features/dossier-canon/components/ObjectifsCanon.tsx` (R) · `tests/objectifsCanon.test.tsx` (R) | Parallélisable avec 2 |

Zéro fichier nommé deux fois. Sans le lot 3 : **2 lots séquentiels, pas d'essaim**.

### 4. Delta de signatures figé par ce tour (lot 1, lu comme donnée immuable par le lot 2)

```ts
// types.ts
echeance?: string          // ia — prose, jamais un compte
duree?: number             // moteur — entier >= DUREE_MIN
si_bloque?: string         // ia — injecté seulement si le moteur a déclaré l'étape bloquée
delai?: number             // moteur — entier, aligné sur duree (même type, même destination)

// tables.ts
export const DUREE_MIN = 1
export const CHAMPS_ENTIERS: readonly ChampRequis[] = [
	{ path: 'monde.personnages[].plan_actions[].etape', location: 'Personnages' },
	{ path: 'monde.personnages[].plan_actions[].duree', location: 'Personnages' },
	{ path: 'monde.personnages[].contre_mesures[].delai', location: 'Personnages' },
]
export const LISTES_OPTIONNELLES_STRUCTUREES: readonly ChampRequis[] = [
	{ path: 'monde.personnages[].contre_mesures', location: 'Personnages' },
]

// destinations.ts
'monde.personnages[].but.echeance': 'ia',
'monde.personnages[].plan_actions[].duree': 'moteur',
```

Coût réel du lot contrat, chiffré : `CHAMPS_ENTIERS` (~8 l. `validate.ts` + 2 tests) · contrôle `si_bloque`/`duree` (~6 l. + 1 test) · 7e famille `alerteSansExpr: true` · fermeture BUG-050 (**+ un 4e `POSEURS_DE_LISTE` dans `validate.test.ts:1025`, sinon `validate.test.ts:1038` rougit**, et `couverture.test.ts:742` passe de `toHaveLength(3)` à 4 — **remesuré**). Un seul agent, une porte qualité franchissable seule.
