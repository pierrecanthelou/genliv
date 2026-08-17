RISQUE — **Semer le marqueur dans `condition_texte` allume l'alerte D1 sur une fin que personne n'a écrite.** `validate.ts:751` avertit dès que le `…_texte` est non vide et que le `…_expr` manque : une fin semée `⟨à écrire⟩ …` s'ouvre en alerte. C'est précisément ce qu'interdit `amorce.test.ts:89-93` (« un avertissement serait un dossier neuf qui s'ouvre déjà avec une alerte »). Le marqueur convient aux quatre textes de l'amorce — aucun n'appartient à `FAMILLES_DE_CONDITIONS` ; `condition_texte` en est la moitié prose. Je tranche : **brouillon différé**. Le baril reste fermé, `amorce.test.ts` intact, décision prise et non subie.

OBJECTION — **Mon veto du tour 1 est RETIRÉ**, nommément sur `useEcriturePlan.ts:199-212` : un brouillon d'entité pas encore au document ne mirroite rien, donc n'est pas une copie de la source de vérité — `PanneauIndices.tsx:106` mirroite déjà des champs persistés, et c'est livré. Le « `commit()` à deux régimes » n'existe pas : le précédent place la garde dans le blur, en amont ; `commit()` garde un seul régime et le bandeau reste aux vrais refus. **UX, SegmentedControl : pas un problème architectural.** « Filtre » et « bascule » sont des sémantiques d'appelant ; le composant n'en porte aucune. Le risque réel serait qu'it2 lui ajoute une prop — it2 et it4 se disputeraient alors un fichier partagé. D'où la contrainte dure : **lot 2 ne possède aucun fichier sous `src/brain/`**.

PROPOSITION — Deux lots (annexe). Les **deux** fiches reçoivent la même prop `avertissements` : le silence côté jalon devient celui du validateur, pas celui du composant — sans quoi le test QA (b) est vide.

VERDICT — **recevable sous réserve** : brouillon différé acté, KR-211(a) toujours à remplacer.

---

## Annexe — découpage en lots (révisé tour 2)

### La décision tranchée, et les deux options écartées

| Option | Coût réel | Verdict |
| --- | --- | --- |
| **Semis par `MARQUEUR_A_ECRIRE`** | Ouvre le baril, **et** allume D1 sur toute fin neuve (`validate.ts:751`), **et** pose une *valeur* dans un input là où le dépôt met un *placeholder* (`FicheIndice.tsx:40-42`) — l'auteur doit effacer avant d'écrire | **Écartée** |
| Desserrer `CHAMPS_REQUIS` (retirer les 3 chemins, `tables.ts:128-130`) | Renverse une correction posée comme **irréversible** par `dossier-format` it2 (`types.ts:29-31`) ; un jalon sans énoncé est ce que n°9 injecte au modèle | **Écartée** |
| Semis d'un texte neutre **local à la feature** (« À écrire ») | Produit de la fausse prose que le balayage n°7 **ne verra pas** — le pire des trois | **Écartée** |
| **Brouillon différé** (précédent `useEcriturePlan.ts:199-212`) | Une entrée `ListRow` locale ; perte d'un ajout abandonné à la navigation (perte déjà acceptée et livrée pour les étapes de plan) | **RETENUE** |

### Lot 1 — `contrat` — seul, en premier (KR-210)

- R `src/brain/dossier/types.ts`
- R `src/brain/dossier/destinations.ts`
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`
- R `src/brain/dossier/__fixtures__/dossier-reference.json`
- R `src/brain/dossier/couverture.test.ts`

**Retirés du lot par rapport au tour 1** : `brain/index.ts` et `amorce.test.ts`. Le marqueur ne sort pas du baril. Ni `tables.ts`, ni `validate.ts`, ni `identifiers.ts` : aucune table neuve, aucune garde neuve, espaces `jalon`/`fin` déjà enregistrés.

```ts
// types.ts — l'UNIQUE ajout de schéma, optionnel (KR-191)
export interface Fin extends Entite {
	condition_texte: string
	condition_expr?: ExprNode
	/** MOTEUR — prose ÉMISE VERBATIM au joueur à l'arrivée sur cette fin (n° 15).
	 *  Même régime que `charpente.depart.texte_ouverture_joueur`. AUCUNE ligne
	 *  dans BUDGETS_DE_MOTS (précédent KR-203). */
	texte?: string
}

// destinations.ts — UNE ligne
'charpente.fins[].texte': 'moteur',
```

Contreparties obligatoires : `couverture.test.ts` dispense `'charpente.fins[].texte'` + test nommé de destination sur les deux fixtures ; les deux fixtures instancient `texte` sur une fin ; la fin de `dossier-minimal.json` garde son `condition_expr` (reste sans avertissement).

### Lot 2 — `feature` — contrat figé, lu comme donnée immuable

- N `src/features/dossier-registres/components/PanneauJalonsFins.tsx`
- N `src/features/dossier-registres/components/FicheJalon.tsx`
- N `src/features/dossier-registres/components/FicheFin.tsx`
- N `src/features/dossier-registres/hooks/useEcritureJalons.ts` — *si et seulement si* le panneau franchit 400 lignes (KR-112)
- N `src/features/dossier-registres/hooks/useEcritureFins.ts` — *idem*
- N `src/features/dossier-registres/tests/panneauJalonsFins.test.tsx`
- R `src/features/dossier-registres/components/styles.ts`
- R `src/features/dossier-registres/index.ts`
- R `src/App.tsx`

Consomme uniquement (zéro fichier `brain/` possédé) : `type Jalon`, `type Fin`, `type DossierIssue`, `validateDossier`, `frapperIdentifiant`, `localiserEntite`, `useOpenDossier`, `dossiers.update`, `{Card, Field, ListRow, IconButton, SegmentedControl, IssueList, HIT_TARGET_MIN}`.

**Les trois pièges nommés** :
1. Deux champs requis sur Jalon (`enonce_texte`+`declencheur_texte`), un seul sur Fin (`condition_texte` — `texte` n'est PAS requis, jamais gatant). Garde d'ajout dans le blur, en amont de `commit()` : `if (fusion.enonce_texte.trim() === '' || fusion.declencheur_texte.trim() === '') return`. Un second clic sur « + Ajouter… » ne doit pas écraser l'ajout en cours.
2. Le chemin d'une anomalie porte l'INDEX (`charpente.fins[2].condition_texte`), la sélection porte l'ID — l'index se dérive de l'id au rendu, jamais stocké.
3. Câblage symétrique : `FicheJalon` reçoit la même prop `avertissements` que `FicheFin` (toujours vide côté jalon, par le validateur — `alerteSansExpr:false` — pas par omission du composant), sinon le test QA « jalon non conforme → aucune région status » est vrai par absence de code, pas par preuve.

### Pourquoi 2 lots, pas 3 ni 4

Un lot « jalons » et un lot « fins » nommeraient quatre fichiers communs (panneau, styles.ts, index.ts, App.tsx) — propriété exclusive impossible. Un lot « bandeau D1 » serait une abstraction à un seul appelant. **Deux lots ⇒ exécution séquentielle, ni worktree ni fusion.**

### Étanchéité vérifiée par lecture

`DossierEditorScreen.tsx:14` et `sections.ts:135` (`SECTIONS[9].id === 'jalons-fins'`) existent déjà — zéro fichier de `bascule-editeur`, `dossier-canon` ou `tree-canvas` dans aucun lot (KR-184/204/205 tenus). Zéro `EditeurEffets` : `Jalon.effet` s'écrit `[]` et reste hors rendu. Zéro fichier de `src/brain/` dans le lot 2 — y compris `SegmentedControl.tsx`, laissé intact pour it4.
