# NOTE DE CLÔTURE — tech-lead — `dossier-fiches` it5, tour 2

**RÉPONSE NOMMÉE À L'UX — `Stepper.tsx` rejoint le LOT 1.** Oui, tranché, et pour trois motifs mesurés, pas par réflexe de règle. (1) **Propriété exclusive** : si le lot 2 nomme `brain/components/Stepper.tsx`, il devient un lot qui touche `brain/` — il faudrait le marquer `contrat` et l'ordonner premier. Deux lots contrat, contradiction. Un seul lot porte brain : le 1. (2) Vérifié à la lecture, pas supposé : `prefix` n'a **aucun appelant** dans `src/features/**`. `intensite` sera le premier. On ne répare donc pas une régression, on **spécifie une prop encore vierge avant son premier usage** — c'est un acte de contrat, pas un correctif de feature. (3) Il n'existe pas de `Stepper.test.tsx` : la preuve naît au primitif, dans le lot 1, jamais au consommateur.

Je prends la ligne d'UX telle quelle et rien de plus : pas de `signe?: boolean`, pas de `value: number | undefined` (rejeté à it3 ; un appelant unique est une dette). **`StepperProps` ne change pas** — le rendez-vous du lot 2 est intact. Le JSDoc gagne une phrase : `prefix` note un *signe*, jamais une unité. Vérifié aussi, mon point de vigilance du tour 1 : `clamp` accepte `min` négatif tel quel.

**CONFIRMATIONS** — `presence[].quand` → **`auteur`** (convergent narratif-ia § A). `intensite` → `moteur`, `INTENSITE_MIN/MAX` + registre `INTENSITES` **distincts** de `CONFIANCE*`. `secret?: boolean` : le § C est un prédicat d'assemblage n° 10, zéro branche de code en it5 — signature inchangée.

**MES OBJECTIONS DU TOUR 1** — coupe : accordée, close. `CONFIANCES` non réutilisé : tenu. `quand` : tranché. Veto ≥3 lots partageant `FichePersonnage.tsx` : maintenu, sans objet à 2 lots.

**VERDICT — recevable. Découpage confirmé : 2 lots séquentiels, aucun essaim, aucun worktree.**

---

## ANNEXE — découpage révisé (2 lots, exécution séquentielle)

### LOT 1 — `contrat` (seul, en premier)

| Fichier | N/R | Changé au tour 2 |
|---|---|---|
| `src/brain/dossier/types.ts` | R | |
| `src/brain/dossier/tables.ts` | R | |
| `src/brain/dossier/destinations.ts` | R | |
| `src/brain/dossier/__fixtures__/dossier-minimal.json` | R | |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R | |
| `src/brain/dossier/couverture.test.ts` | R | |
| `src/brain/dossier/validate.test.ts` | R | |
| `src/brain/index.ts` | R | |
| `src/brain/components/Stepper.tsx` | R | **AJOUTÉ** |
| `src/brain/components/Stepper.test.tsx` | **N** | **AJOUTÉ** |

`brain/components/index.ts` reste **hors lot** : `Stepper` y est déjà exporté, aucune ligne ne bouge. `validate.ts` : zéro ligne attendue (boucles génériques) — à mesurer, jamais à remplir pour honorer une liste.

**Diff exact autorisé sur `Stepper.tsx`** (une ligne de corps + JSDoc ; toute autre modification est hors lot) :

```tsx
<span style={display} aria-live="polite">
	{value >= 0 ? prefix : ''}
	{value}
</span>
```

et sur la prop, la doc qui borne la sémantique :

```ts
/** Signe optionnel affiché devant une valeur POSITIVE (« + » pour un bonus).
 *  C'est un SIGNE, jamais une unité : sous zéro il s'efface, le « − » du nombre
 *  suffit (sans quoi une intensité de -2 s'affiche « +-2 »). */
prefix?: string
```

**Test du lot 1** (`Stepper.test.tsx`, neuf) : `prefix="+"`, `min={-3} max={3}` → rend `+2` à 2, `0` à 0 (prefix effacé au pivot, borne exacte), `-2` à -2 ; et `clamp` plancher à -3 après 6 clics « Diminuer ». Aucun de ces quatre points n'est atteignable depuis un test de bloc.

**Signature exposée au lot 2 (donnée immuable)** — inchangée par rapport au tour 1 :

```ts
export const INTENSITE_MIN = -3
export const INTENSITE_MAX = 3
export interface Relation { cible_id: string; lien: string; intensite: number; secret?: boolean }
export interface Presence { lieu_id: string; quand?: string }
// sur Personnage :  relations?: Relation[]   presence?: Presence[]
// Stepper : StepperProps INCHANGÉE ; `prefix` est sign-aware — passer prefix="+"
```

Tables (10 lignes) et 6 chemins terminaux neufs : inchangés (annexe tour 1 § B). Destinations : `moteur`, `ia`, `moteur`, `moteur`, `moteur`, **`auteur`**.

### LOT 2 — `feature` (seul, après contrat figé)

| Fichier | N/R |
|---|---|
| `src/features/dossier-fiches/hooks/useSocleEcriturePersonnages.ts` | **N** |
| `src/features/dossier-fiches/hooks/useEcritureIdentite.ts` | **N** |
| `src/features/dossier-fiches/hooks/useEcriturePlan.ts` | **N** |
| `src/features/dossier-fiches/hooks/useEcritureRelationsPresence.ts` | **N** |
| `src/features/dossier-fiches/components/BlocRelations.tsx` | **N** |
| `src/features/dossier-fiches/components/BlocPresence.tsx` | **N** |
| `src/features/dossier-fiches/tests/relationsPresence.test.tsx` | **N** |
| `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` | R (assembleur, ~110 l.) |
| `src/features/dossier-fiches/components/FichePersonnage.tsx` | R |
| `src/features/dossier-fiches/components/BlocPlanActions.tsx` | R (imports de types repointés) |
| `src/features/dossier-fiches/tests/fichePersonnage.test.tsx` | R |
| `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R |

Aucun fichier n'est nommé par les deux lots. `PanneauPersonnages.tsx` reste hors lot.

**Conséquence du re-cadrage à répercuter dans `FichePersonnage.tsx` — à ne pas oublier** : `BLOCS_VIDES` passe de 4 à 2 entrées, **et les deux survivantes changent d'`iteration`** puisque le placeholder nomme le numéro : `{ id: 'savoirs', titre: 'Savoirs', iteration: 6 }` et `{ id: 'caractere-exploitable', titre: 'Caractère exploitable', iteration: 8 }`. Laisser `savoirs` à `5` livrerait un écran qui annonce une itération déjà passée. L'invariant « accordéon à 8 emplacements » (UX) tient : 8 sections, 6 pleines, 2 placeholders.

**Réponse à la QA (gel des tests KR-197)** — accordée et opposable en revue : dans `panneauPersonnages.test.tsx`, les deux blocs existants (`ecriture sur DEUX personnages, aucune fuite d indexation` et `lecture au montage sur DEUX personnages, sans interaction`) doivent présenter **0 ligne d'assertion modifiée** au `git diff` malgré la scission du hook. C'est précisément ce que garantit le fait que `commit` et ses deux indexations restent dans `useSocleEcriturePersonnages.ts`, un seul fichier, jamais recopiées par famille.

Rendez-vous interne du lot 2 (inchangé) :

```ts
export interface SocleEcriture {
	dossierActuel: Dossier
	personnageAffiche: Personnage | undefined
	commit: (personnages: Personnage[], personnageId: string, opts?: { resout: boolean }) => EcritureDossier
}
```

Tailles visées : socle ~150, identité ~140, plan ~340, relations+présence ~330, assembleur ~110 — tous sous 400 (KR-112).
