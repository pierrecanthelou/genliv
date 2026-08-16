# Tour 1 — Tech Lead — `dossier-objets` it1

```
RISQUE      — `ListRow` est une primitive brain/ à TROIS consommateurs vivants (SectionNav,
              PanneauLieux, PanneauPersonnages) dont la racine EST un `<button type="button">`
              (ListRow.tsx l.31-46). Y greffer une poignée ou un contrôle de réordonnancement —
              y compris via le slot `trailing`, rendu à l'intérieur de ce bouton — produit un
              bouton dans un bouton : HTML invalide, et les noms accessibles / `textContent`
              sur lesquels reposent les tests des trois consommateurs deviennent ambigus
              (`ListRow.test.tsx` l.48 : `textContent).toBe('Canon')`). Restructurer la racine,
              c'est modifier un contrat brain/ pour UN appelant et faire porter le risque à
              deux features closes.

OBJECTION   — 1) Critère #3 tel qu'écrit (« réordonne par la poignée de ListRow ») n'est
              observable par AUCUN instrument existant : jsdom n'a pas de `DataTransfer`, le
              glisser HTML5 ne se prouve pas ici, et il ne livre aucun clavier — exigence non
              négociable du dépôt (ergonomie de rédaction).
              2) `ListRow.onReorder` aurait exactement UN appelant. C'est une dette, pas un
              contrat (KR-109). Le docstring qui la réserve n'est pas un second appelant.
              3) Critère #7 (KR-187) : la non-régression des 9 sections vit dans
              `bascule-editeur/tests/dossierEditorScreen.test.tsx`, fichier d'une AUTRE
              feature. Le précédent dossier-fiches it1 y a écrit ; ne le rejouons pas.

PROPOSITION — Réordonner par deux `IconButton` « Monter »/« Descendre » rendus PAR
              `PanneauObjets`, FRÈRES de la `ListRow` dans un `<li>` : zéro fichier brain/ de
              code modifié, ~45 lignes de panneau + ~35 de test, clavier gratuit (vrais
              boutons), critère prouvé par `getByRole('button', {name:/^Monter/})` → clic →
              ordre de `monde.objets` persisté. `ListRow.tsx` ne change que son docstring
              (l.15-18), pour inscrire l'arbitrage au lieu de laisser une promesse morte.

VERDICT     — recevable sous réserve.
```

*(veto réservé, sur mon terrain uniquement : tout contrôle interactif rendu à l'intérieur de la racine `<button>` de `ListRow`, et tout lot nommant un fichier de `bascule-editeur` ou de `dossier-canon`.)*

---

# Annexe — découpage en lots, signatures, chiffrage

## A. Pourquoi 2 lots, et pas 1, 3 ou 4

- **Pas 1** : l'itération touche `brain/` (un champ de schéma, sa destination, ses deux fixtures, sa table de couverture, le baril d'export). Règle dure de la skill : tout lot qui touche `brain/` est `contrat` et s'exécute **seul, en premier**.
- **Pas 3-4** : `PanneauObjets` et `FicheObjet` sont **une seule tranche verticale**, avec un seul propriétaire de `dossierId`, du brouillon et de `commit()`. Les scinder inventerait entre deux agents qui ne se parlent pas le contrat de props `FicheObjetProps` — exactement le point où un essaim casse à la fusion. `App.tsx` est trois lignes : un lot « wiring » serait un agent pour un import.
- **Aucun parallélisme à révéler** : le lot 2 consomme le type `Objet` produit par le lot 1. Exécution **séquentielle**, pas de worktree, pas de fusion. Le découpage sert ici la *vérifiabilité isolée*, pas la vitesse.

## B. Lot 1 — `contrat` (brain/ seul, en premier)

**Fichiers (R = remplace) — propriété exclusive :**

| | Fichier | Geste |
|---|---|---|
| R | `src/brain/dossier/types.ts` | `export interface Objet extends Entite` + `Monde.objets: Objet[]` (l.1016) |
| R | `src/brain/dossier/destinations.ts` | 1 ligne après l.398 |
| R | `src/brain/dossier/__fixtures__/dossier-minimal.json` | l.150, `description_joueur` sur `objet.clef-de-basalte` |
| R | `src/brain/dossier/__fixtures__/dossier-reference.json` | l.271-275, `description_joueur` sur ≥1 des 3 objets |
| R | `src/brain/dossier/couverture.test.ts` | dispense `LIBRES` (bloc l.362-372) + 1 test nommé |
| R | `src/brain/index.ts` | `Objet` dans le bloc `export type {…} from './dossier/types'` (l.237-288) |
| R | `src/brain/components/ListRow.tsx` | **docstring seul** (l.15-18) — zéro changement de `ListRowProps` ni du DOM rendu |

**Signature exacte exposée :**

```ts
// src/brain/dossier/types.ts
/** Un OBJET du monde — ce que le héros ramasse, porte, échange. */
export interface Objet extends Entite {
	/** IA — ce que le joueur apprend de l'objet. Injecté, jamais émis verbatim.
	 *  OPTIONNEL et LIBRE : son absence est calme, aucune borne de longueur (KR-203). */
	description_joueur?: string
}

export interface Monde {
	personnages: Personnage[]
	lieux: Lieu[]
	objets: Objet[]   // ÉTAIT: Entite[]
	// … inchangé
}
```

```ts
// src/brain/dossier/destinations.ts — après la ligne 398
'monde.objets[].description_joueur': 'ia',
```

**Les deux fixtures sont OBLIGATOIRES dans ce lot, ce n'est pas du confort** — mesuré, pas supposé :
- `couverture.test.ts` l.450-456, « aucune ligne morte dans DESTINATION_DES_CHAMPS » : une ligne de destination sans instance dans la fixture **minimale** fait rougir la suite. La ligne et la fixture voyagent ensemble ou le lot est rouge.
- l.481-492, « 4e assertion : tout chemin de table a une instance dans la fixture ».
- La convention des trois tests nommés (Lieu l.559-582, situation l.584-605, proses d'identité l.607-638) épingle **valeur d'audience + instance**, et les deux derniers exigent les **DEUX** fixtures. Le test neuf du lot suit ce gabarit :

```ts
it('la prose d un objet est ia et instanciee dans les DEUX fixtures', () => {
	const chemin = 'monde.objets[].description_joueur'
	expect(`${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}`).toBe(`${chemin} → ia`)
	expect(cheminsDeLaFixture()).toContain(chemin)
	expect(feuillesDeLaFixture(documentDeReference()).map((f) => f.normalise)).toContain(chemin)
})
```
Il porte aussi le critère #5 (absence de borne) : un `description_joueur` **long** dans la référence, plus `expect(validateDossier(documentDeReference()).warnings).toEqual([])` — déjà tenu par le test l.407-430, qu'il suffit de ne pas casser. C'est le « cas positif » que le critère réclame.

**Ce que le lot 1 ne touche PAS, vérifié :**
- `validate.ts` — aucune règle ne porte sur une prose libre d'entité ; la preuve d'absence est la dispense `LIBRES` (`PROSE_D_ENTITE_LIBRE`), même traitement que les trois proses de `Lieu`.
- `tables.ts` — `{ path: 'monde.objets', genre: 'liste', location: 'Objets' }` existe déjà (l.66).
- `identifiers.ts` — `{ path: 'monde.objets', espace: 'objet' }` (l.129) et `ESPACES_DE_NOMS.objet = { label: 'Objet' }` (l.44) existent : `localiserEntite('objet', o, i)` rend déjà « Objet n°N (sans nom) », critère #1 satisfait sans une ligne neuve.
- `amorce.ts` (`objets: []`, l.112) reste valide : `Objet[]` accepte `[]`.

**Porte qualité du lot 1, seul** : `npx tsc --noEmit` + `npx jest src/brain` (dont `couverture.test.ts`, `identifiers.test.ts`, `validate.test.ts`, `sections.test.ts`, `ListRow.test.tsx`). Aucun rendu de feature requis. Le lot est vérifiable isolément — condition n° 3 du découpage.

## C. Lot 2 — `feature` dossier-objets (démarre contrat figé)

**Fichiers (N = crée, R = remplace) :**

| | Fichier |
|---|---|
| N | `src/features/dossier-objets/index.ts` |
| N | `src/features/dossier-objets/components/PanneauObjets.tsx` |
| N | `src/features/dossier-objets/components/FicheObjet.tsx` |
| N | `src/features/dossier-objets/tests/panneauObjets.test.tsx` |
| R | `src/App.tsx` |

**Signatures exactes :**

```ts
// features/dossier-objets/components/FicheObjet.tsx — composant PUREMENT de rendu
export interface BrouillonObjet {
	nom: string
	description_joueur: string
}
export interface FicheObjetProps {
	objet: Objet
	/** Rang dans `monde.objets` — repli du libellé quand `nom` est absent. */
	index: number
	brouillon: BrouillonObjet
	refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonObjet, valeur: string) => void
	// PAS de `onRetirer` : it2. Une prop posée d'avance est une branche non exercée.
}
export function FicheObjet(props: FicheObjetProps): JSX.Element
```

```ts
// features/dossier-objets/components/PanneauObjets.tsx
export interface PanneauObjetsProps { dossierId: string }
export function PanneauObjets({ dossierId }: PanneauObjetsProps): JSX.Element | null
// interne, non exporté :
//   function commit(objets: Objet[], objetId: string, { resout }?: { resout: boolean }): EcritureDossier
//   function deplacer(id: string, sens: -1 | 1): void
```

```tsx
// src/App.tsx
import { PanneauObjets } from './features/dossier-objets'
…
panneaux={{
	canon: <PanneauCanon dossierId={route.dossierId} />,
	depart: <PanneauDepart dossierId={route.dossierId} />,
	personnages: <PanneauPersonnages dossierId={route.dossierId} />,
	lieux: <PanneauLieux dossierId={route.dossierId} />,
	objets: <PanneauObjets dossierId={route.dossierId} />,
}}
```
La clé `objets` est déjà un `SectionId` (`sections.ts` l.34) et `panneaux` est `Partial<Record<SectionId, ReactNode>>` (`DossierEditorScreen.tsx` l.14) : **zéro ligne à changer chez `bascule-editeur`**.

**Consommé, figé par le lot 1 :** `Objet`, `Entite`, `EcritureDossier`, `DossierIssue`, `frapperIdentifiant('objet')`, `localiserEntite('objet', o, i)`, `useBrain().dossiers.update`, `useOpenDossier`, `ListRow`, `Card`, `Field`, `IconButton`, `IssueList`, `HIT_TARGET_MIN` — tous depuis `'../../../brain'`, aucun import de feature.

**Le geste d'écriture** (idiome prescrit, trois racines nommées, jamais un spread) :
```ts
dossiers.update(dossierId, (d) => ({ canon: d.canon, monde: { ...d.monde, objets }, charpente: d.charpente }))
```

**Critère #7 (KR-187) — traité SANS toucher au voisin, et c'est mesuré :** `dossierEditorScreen.test.tsx` (l.300-333) rend `DossierEditorScreen` avec ses **sondes locales**, pas avec le câblage de `App.tsx`. Sa table de sondes ne contient pas `objets` ; l'index 4 retombe donc sur la branche `else` (état vide) et **reste vert sans une seule modification**. Le lot 2 le vérifie en lançant la suite `bascule-editeur` qu'il ne modifie pas. Une 5e sonde n'apporterait aucune information — le mécanisme du slot est prouvé quatre fois. Le câblage réel se prouve par un test-grep **dans le fichier de dossier-objets** :
```ts
expect(source).toMatch(/panneaux=\{\{[\s\S]*?objets:\s*<PanneauObjets/)
```

## D. La question ouverte du réordonnancement — position chiffrée

| Option | brain/ touché | Feature | Clavier | Prouvable par jest+RTL aujourd'hui | Verdict |
|---|---|---|---|---|---|
| **A — deux `IconButton` ↑/↓, frères de la `ListRow` dans un `<li>`, rendus par `PanneauObjets`** | 0 fichier de code (docstring seul) | ~45 l. panneau + ~35 l. test | **gratuit** (vrais `<button>`, Tab/Entrée, aucun `onKeyDown` maison) | **oui** — `getByRole('button', {name:/^Monter/})` → clic → assertion sur l'ordre rendu **et** sur `dossiers.update` | **retenu** |
| B — poignée glisser HTML5 dans `ListRow` | `ListRow.tsx` (racine `<button>` → conteneur + bouton frère, ~40 l. réécrites) + `ListRow.test.tsx` (~30 l.) + **re-vérification de 3 consommateurs, dont 2 dans des features closes** → le lot devrait nommer `dossierEditorScreen.test.tsx`, `panneauLieux.test.tsx`, `panneauPersonnages.test.tsx` : **propriété de fichiers non disjointe** | idem A pour l'écriture | **zéro** — il faudrait livrer A **en plus** | **non** — jsdom n'a pas de `DataTransfer` ; le critère serait « vérifié par personne » | rejeté |
| C — les deux | B + A | B + A | via A | via A seulement | ≈ 2,5× A pour la même capacité vérifiable |

**Détail d'exécution de A**, pour que le lot 2 n'ait rien à inventer :
- `deplacer(id, sens)` calcule le tableau permuté et appelle `commit(objets, id)`. Une permutation ne change aucune référence (tout est par identifiant stable) ; un refus reste possible (`statut: 'absent'`) et s'indexe par `objetId`, même patron que `PanneauLieux` (`RefusEnCours`).
- Le brouillon est indexé par `id` : le réordonnancement ne le perturbe pas. Aucune resynchronisation par effet (KR-013/113) — l'ordre affiché est `dossier.monde.objets`, lu en ligne, jamais miroité.
- Bornes : « Monter » `disabled` sur l'index 0, « Descendre » sur le dernier. Pas de rotation silencieuse.
- Le focus suit l'objet déplacé — `useRef` sur **le bouton que `PanneauObjets` rend lui-même**, jamais un `querySelector` visant `FicheObjet`. C'est le point que la § Encapsulation surveille et le précédent fautif non corrigé de `PanneauLieux.tsx` (l.99, BUG-078) : **on ne le rejoue pas**.
- Le glisser à la souris, si le comité y tient, est une **itération de polish à part** (la feature est à n=2), jamais la même tranche : « faire marcher » et « rendre beau » ne se mélangent pas.

**Promotion différée (KR-109, et c'est mon biais à moi que je borne ici)** : la paire ↑/↓ reste **dans la feature**. Elle ne monte dans `brain/components/` que si un **deuxième appelant réel et nommé** apparaît — candidat plausible, non acquis : n° 6 `dossier-registres` (quêtes / indices / événements). Une primitive `ReorderControls` livrée aujourd'hui aurait un seul appelant : ce serait la même dette que celle que je reproche à `onReorder`.

## E. Ce que le lot 2 doit corriger dans le contrat de design de la spec

`plan.design_contract.reordonnancement` et `acceptance_criteria[2]` sont écrits sur l'option B. S'ils survivent au tour 3 tels quels, ils commandent un lot à propriété non disjointe. Réécriture proposée du critère :

> Étant donné au moins deux objets dans le registre, quand l'auteur active « Monter » (ou « Descendre ») sur une ligne — au clic **ou au clavier** —, alors l'ordre de `monde.objets` est persisté par `DossierService.update()` et reflété par la liste au rendu suivant ; les bornes de la liste sont désactivées.

Et `brain_contracts[1]` (« `ListRow.tsx` — `onReorder` câblé ») devient : « `ListRow.tsx` — **inchangé** ; son docstring inscrit que le réordonnancement se compose **autour** de la ligne, la racine `<button>` ne pouvant héberger de contrôle imbriqué ».

## F. Contrôles de porte que j'exigerai à la revue

1. `npm run lint` vert — la règle d'isolation couvre feature→feature dans les trois sens (`lintIsolation.test.ts`).
2. Aucun fichier de `bascule-editeur` ni de `dossier-canon` dans la liste de fichiers d'un lot (critère #8 de la spec, KR-200).
3. Aucun `querySelector` / `getElementBy*` dans `PanneauObjets.tsx` visant `FicheObjet.tsx`.
4. `PanneauObjets.tsx` < 400 lignes (KR-112) — estimé ~230-260 ; `FicheObjet.tsx` ~120.
5. Fixtures lues depuis le **fichier réel**, jamais recopiées dans un test (KR-156).
6. Aucun `useEffect` dont le corps est un `setX(...)` dérivable au rendu (KR-013/113) ; le seul effet légitime attendu est le déplacement de focus, sur du DOM que le composant possède.
