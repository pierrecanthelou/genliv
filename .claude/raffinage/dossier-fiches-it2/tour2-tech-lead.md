# TOUR 2 — Tech Lead · `dossier-fiches` it2

*(Chaque affirmation du tour 1 revérifiée contre le code : `validate.ts`, `tables.ts`, `couverture.test.ts`, `suffisance.test.ts`, `DossierService.ts`, `ObjectifsCanon.tsx`, `FicheLieu.tsx`, `FichePersonnage.tsx`, `PanneauPersonnages.tsx`.)*

## RÉPONSES AUX OBJECTIONS

**À `ux-designer`** (bandeau dernier enfant de la `Card`, sous l'`Accordion`) : compatible — c'est la position exacte de `FicheLieu.tsx`. Une correction **load-bearing** : `{ statut: 'absent' }` ne porte **aucun** `issues` (`DossierService.ts:57`). `<IssueList issues={[]} />` rendrait un bandeau vide sous un eyebrow rouge. La prop reste `{statut, issues}`, mais la fiche branche sur `statut` : `absent` → phrase fixe, `refuse` → `IssueList`.

**À `qa`** (pas de critère sur `refuse` simulé) : je me range et je durcis. Le lot 2 construit la branche — elle vient de l'union du service, la retirer coûterait un `as` — mais elle n'a **ni critère ni mock** : `jest.spyOn(dossiers,'update').mockReturnValue({statut:'refuse'})` est interdit dans ce lot. `absent` s'atteint **sans mock** : second `createBrain()` sur le même `localStorage`, `remove()`, puis blur. Si ce montage ne tient pas, la revue l'écrit « non vérifié » — on ne coche pas.

## STATUT DE MES OBJECTIONS

1. « rien du tout dans `tables.ts` » — **RETIRÉE** (argument de fréquence d'injection).
2. « KR-190 n'est pas automatique » — **MAINTENUE** : le plan nomme ses fichiers un par un. `validate.ts` reste hors du lot — sa boucle 9 est générique : trois lignes de table, zéro ligne de validateur.
3. Repli **par champ**, jamais par objet (BUG-058 en lecture) — **MAINTENUE**.
4. Retrait de personnage reporté à l'itération relations (**it5** après recoupe) — **MAINTENUE**.
5. `RefusEnCours` dans le panneau ; la fiche ne reçoit jamais d'identifiant — **MAINTENUE**.
6. Deux lots séquentiels, aucun worktree — **MAINTENUE**.
7. **Auto-correction** : je retire `BlocIdentite.tsx`. Projection ~265 l., seuil KR-112 = 400. Une extraction à un seul appelant est exactement ma dette habituelle.

## POSITION SUR LE BUDGET DE MOTS — je me range, sauf sur (iv)

- **(i) décisif.** Mon seul argument était un précédent ; la fréquence d'injection le fait tomber.
- **(ii) concédé sous condition** : la borne resterait partielle (`lieux[]`, `savoirs[].revele_comment` libres). Cette dette part en `open_questions` datée, propriétaire n° 10 — sinon « borné » se lira faux.
- **(iii) exact**, précédent `ObjectifsCanon.tsx`, ~8 lignes, aucun état semé.
- **(iv) REJETÉ — erreur d'ingénierie.** La lecture dérivée ne consomme **pas** le retour de `commit()`, et KR-189 interdit précisément de semer depuis `resultat.warnings`. Le budget ne donne donc aucun consommateur à `EcritureDossier` ; le seul reste `absent`. Écrit tel quel, ce paragraphe fait taper `setAvertissements(resultat.warnings)` au dev — le bug exact que KR-189 nomme. À rayer du plan.
- **(v) retenu**, mais comme KR neuf dans `code-knowledge.json`, pas comme phrase de revue.

**Coût mesuré** : lot 1 +2 fichiers ; lot 2 +~20 lignes, 0 fichier ; `brain/index.ts` **intouché** (`validateDossier` déjà exporté). Contrainte livrée avec : `couverture.test.ts:311` **et** `suffisance.test.ts:177` assertent `warnings === []` — chaque prose semée dans les fixtures concernées reste sous 60 mots. Critères : 7 (QA) + budget = 8, plafond atteint pile.

## VERDICT

`recevable sous réserve` : (iv) rayé du plan, branche `refuse` sans critère ni mock, 2 lots séquentiels, ≤ 8 critères. *(Le budget lui-même est ensuite retiré par son auteur — voir `tour2-narratif-ia.md` ; le découpage ci-dessous est celui qui s'applique, moins `tables.ts` et `validate.test.ts`.)*

---

## ANNEXE — DÉCOUPAGE FINAL (propriété disjointe)

**2 lots. Aucun fichier partagé. Exécution strictement séquentielle : lot 1 seul et figé, puis lot 2. Aucun worktree, aucune fusion.**

### Lot 1 — `contrat-identite-personnage` · `contrat` · `dev-contrat` · seul, en premier

| Fichier | N/R | Geste exact |
|---|---|---|
| `src/brain/dossier/types.ts` | R | 3 champs optionnels sur `Personnage` après `objectif_id`, avec docstrings de discriminant |
| `src/brain/dossier/destinations.ts` | R | 3 lignes `'ia'` + le bloc de commentaire « audience ≠ régime » |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | les 3 champs sur `pnj.aldur-le-sage` |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R | 3 sur `pnj.corvin-le-marchand`, `fonction` seule sur `pnj.harek-le-forgeron`, aucun sur `pnj.tobin-le-gamin` |
| `src/brain/dossier/couverture.test.ts` | R | 3 entrées `LIBRES` + test « destination `ia` + instance dans les DEUX fixtures », assertion sur la **valeur** (KR-174) |

**Explicitement NON touchés** : `tables.ts`, `validate.ts`, `validate.test.ts`, `suffisance.test.ts`, `issues.ts`, `brain/index.ts`, `read.ts`, `sections.ts`.

**Pièges nommés, l'agent ne pourra pas les demander plus tard :**

- Le motif `PROSE_D_ENTITE_LIBRE` affirme textuellement « aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]` ». Recopié sur les personnages, il devient étroit ou faux.
- Les 3 chemins entrent dans `cheminsDesTables()` : sans instance en fixture, l'assertion « aucune ligne morte » rougit.

**Signature figée, consommée par le lot 2 :**

```ts
export interface Personnage extends Entite {
	portee: Portee
	plan_actions: PlanAction[]
	savoirs: Savoir[]
	camp?: CampPersonnage
	objectif_id?: string
	fonction?: string            // ia
	apparence?: string           // ia
	description_joueur?: string  // ia — l'audience, jamais le régime : INJECTÉ
}
```

### Lot 2 — `bloc-identite-et-issue-d-ecriture` · `feature` · `dev-lot`

| Fichier | N/R | Geste exact |
|---|---|---|
| `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | brouillon à 4 champs, `commit(): EcritureDossier`, `RefusEnCours` |
| `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | bloc « Identité » (3 `Field` multiline), bandeau de refus, `BLOCS_VIDES` à 6 |
| `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R | lecture 2 entités, écriture 2 entités, `absent`, 6 placeholders |

`BlocIdentite.tsx` : **non créé** (retiré du tour 1). Projection ~265 l. contre un seuil KR-112 à 400.

**Signatures — internes au lot, aucune sortie vers `brain/` :**

```ts
interface BrouillonPersonnage { nom: string; fonction: string; apparence: string; description_joueur: string }
type ChampTexte = keyof BrouillonPersonnage

interface RefusEnCours { personnageId: string; statut: 'absent' | 'refuse'; issues: DossierIssue[] }

function commit(personnages: Personnage[], personnageId: string): EcritureDossier
// refuse  → { personnageId, statut:'refuse', issues: resultat.errors }
// absent  → { personnageId, statut:'absent', issues: [] }   // le service n'en fournit AUCUN
// ecrit   → n'efface que sur le MÊME personnageId (BUG-056/061)
// JAMAIS setX(resultat.warnings) — KR-189.

// FichePersonnage — props (delta d'it1)
- onChangeNom / onBlurNom
+ brouillon: BrouillonPersonnage
+ refus: { statut: 'absent' | 'refuse'; issues: DossierIssue[] } | null   // déjà filtré par le parent
+ onChangeChamp: (champ: ChampTexte, valeur: string) => void
+ onBlurChamp: (champ: ChampTexte, valeur: string) => void
```

**Recalage chiffré** (sinon il sera fait au jugé) : `BLOCS_VIDES` passe de 7 à **6** — Caractéristiques → 3, Objectif & plan d'actions → 4, Savoirs/Relations/Présence → 5, Caractère exploitable → 6. Test : `toHaveLength(6)`, comptes `1/1/3/1`.

**Repli par champ** : `brouillons[id]?.fonction ?? personnage.fonction ?? ''` — jamais un repli par objet.
