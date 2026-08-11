## Tour 2 — Tech Lead

**Veto QA (nommément) — satisfait, et je durcis ma propre prescription.** Mon lot 2 prescrivait déjà le rendu des `warnings` ; il portait un trou que je nommais « résidu assumé » : un objectif importé et jamais touché n'affichait rien. QA a raison qu'un test doit pouvoir voir le warning **sans écriture préalable**. J'abandonne donc le filtrage du résultat de `commit()` au profit d'un **état dérivé en ligne** : `useMemo(() => validateDossier(dossier).warnings.filter((w) => w.path.startsWith('canon.objectifs')), [dossier])`, rendu par `IssueList` dans une région distincte du refus. Une seule source de la règle D1 (le validateur lui-même, jamais réimplémentée côté feature), zéro état local d'avertissement, KR-013 respecté, et le critère devient observable sur un dossier importé comme après une frappe. Coût mesuré et assumé : une validation supplémentaire par changement de dossier.

**Où vit `Refus`/`commit()` (question QA)** : `ObjectifsCanon.tsx`, `commit` propre, patch étroit `canon: { ...d.canon, objectifs }`. **Aucun état `Refus`** — `statut: 'refuse'` est inatteignable ici (id frappé bien formé, `camp` fermé, `nom` et les deux `…_texte` libres, aucun prédicat ne cible l'espace `objectif`). Construire un bandeau qui ne peut pas s'allumer serait du code non testable.

**PM** — accord acté sur (a), lecture descriptive, comme en tour 1. Je co-signe le veto sur (b) : c'est un second lot contrat, donc une coupe d'itération.

**UX** — l'eyebrow ne peut pas dire « injectée au modèle » : `camp` est `moteur`, les deux `…_texte` sont `auteur`. Formule exacte en annexe. Défaut `'protagonistes'` accepté, **écrit en constante nommée**.

**Mes trois objections : #1 retirée** (tranchée par le PM), **#2 maintenue** (non négociable : `brain/` + test d'une seconde feature), **#3 retirée** (absorbée par le veto QA, que je porte désormais avec lui).

**Mesure 9 fichiers et découpage 2 lots : inchangés.**

---

## Annexe

### 1. Ce qui change dans le lot 2 (aucun fichier nouveau, aucune frontière déplacée)

Remplacer la prescription « warnings du dernier `commit()`, filtrés » par :

```ts
const avertissements = useMemo(
  () => validateDossier(dossier).warnings.filter((w) => w.path.startsWith('canon.objectifs')),
  [dossier],
)
```

- `validateDossier` est déjà exporté par `brain/index.ts` (l.183) — aucun contrat neuf, le lot 1 ne bouge pas.
- `dossier` vient de `useOpenDossier` : nouvelle identité à chaque `dossier:updated`, donc le mémo se recalcule après chaque écriture **et** à l'ouverture d'un dossier importé.
- Rendu par `IssueList` (`brain/components`) dans une région `role="status"` **distincte** de tout bandeau de refus — le refus n'existe pas dans ce bloc.
- Deux tests dans `objectifsCanon.test.tsx` : (i) dossier importé porteur d'un objectif à `reussi_si_texte` sans `…_expr` ⇒ le message `condition-sans-expr` est à l'écran **au premier rendu** ; (ii) l'auteur tape un `echoue_si_texte` puis quitte le champ ⇒ le message apparaît sans rechargement. Le second est celui qu'exigeait KR-183 ; le premier est celui que QA a raison de réclamer en plus.

### 2. Registre de langue de la carte (réponse à UX)

`destinations.ts` du lot 1 fixe : `canon.objectifs[].camp` → **`moteur`**, `reussi_si_texte`/`echoue_si_texte` → **`auteur`** (déjà en place, épinglés par `couverture.test.ts` : « tout jumeau prose d'une condition a une destination valant auteur »). Aucun champ de cette carte n'est `ia`.

Donc **jamais** « injectée au modèle » — cette formule appartient à `ton` et `interdits_ton`, qui sont `ia`. Formule proposée, à valider par UX :

- eyebrow du bloc : `OBJECTIFS — interne, jamais lu par le joueur ni par le modèle`
- hint des deux `Field` : `phrase factuelle pour le moteur, jamais de fiction` (texte déjà figé par `design_contract.objectifs_texte_seul`, non rouvert)

### 3. Collision `Personnage.camp` (réponse à UX)

Aucune collision dans le code d'aujourd'hui : `Personnage` (`types.ts` l.170-174) ne porte que `portee`, `plan_actions`, `savoirs`. Le contrat pose `CAMPS`/`Camp` comme **le** vocabulaire des camps du dossier. Une ligne de docstring dans `types.ts` ferme le risque futur : si la n° 4 donne un camp à un personnage avec un sous-ensemble de valeurs, elle **dérive** de `CAMPS` (`ENUMERES_FERMES` accepte n'importe quel `readonly unknown[]`) — jamais une seconde liste littérale (KR-117). C'est une ligne de commentaire, pas une abstraction : je n'anticipe rien d'autre.

### 4. Constante de défaut

`const CAMP_INITIAL: Camp = 'protagonistes'` dans `ObjectifsCanon.tsx`. Valeur d'UX acceptée ; l'exigence d'architecture tient : **jamais `CAMPS[0]`** — un réordonnancement du registre changerait alors en silence le sens d'un objectif neuf.

### 5. Lots — inchangés

| Lot | Type | Fichiers | Exécution |
|---|---|---|---|
| 1 | `contrat` | les 9 mesurés au tour 1 (`types.ts`, `tables.ts`, `destinations.ts`, `identifiers.ts`, `index.ts`, les 2 fixtures, `identifiers.test.ts`, `validate.test.ts`) | seul, premier |
| 2 | `feature` | `ObjectifsCanon.tsx` (N), `PanneauCanon.tsx` (R, ≤6 lignes), `objectifsCanon.test.tsx` (N), `panneauCanon.test.tsx` (R) | après gel du contrat |

Propriété disjointe vérifiée, aucun fichier partagé. **Deux lots séquentiels : pas de worktree, pas de fusion, pas d'essaim.** `couverture.test.ts` reste hors des deux lots — QA le confirme de son poste, je le confirme du mien par la mécanique : `camp` est couvert génériquement par la corruption (`42` hors `CAMPS` ⇒ `valeur-hors-enumeration`), donc ni dispense `LIBRES` ni `SANS_DESTINATION` à écrire.

Fichiers de référence : `src/brain/dossier/types.ts`, `src/brain/dossier/tables.ts`, `src/brain/dossier/destinations.ts`, `src/brain/dossier/identifiers.ts`, `src/brain/dossier/validate.ts` (l.596-618, la règle D1), `src/brain/index.ts`, `src/features/dossier-canon/components/PanneauCanon.tsx`.
