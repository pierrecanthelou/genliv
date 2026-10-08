# dossier-repetition it2 — Tour 2 — Tech Lead

RÉPONSE À PM — objection 1 (étalon hors it2)
Je cède, sans coût d'architecture: `etalon` et `boucle-combat` ne partagent aucun fichier et la boucle ne lit pas l'étalon, la coupe est propre. Le périmètre n'est pas mon veto. L'étalon passe en it4, KR-130 intact (doc, golden, code); il REMPLACERA `creerHerosSynthetique`, jamais ne coexistera. Reste un seul lot: retirer `combat_ouvert` casse la compilation du panneau, deux lots ne passeraient pas la porte isolément.

Aussi: NIA 2 est acquis, `cloreCombat` (sessionCombat.ts:201) porte l'usure, `repeter` ne la réimplémente pas. UX 2 accepté: `combats_traverses`, jamais « gagnés » (l'inconscient sort à 1 PV sans XP, sessionCombat.ts:143). UX 3 accepté: `switch` exhaustif, garde `never`.
ROUNDS_MAX = 50. Je pose les 50 postures puis un seul `rejouerCombat`, qui s'arrête au premier terminal (rencontre.ts:93): coût O(N), la valeur ne coûte plus rien, seul reste le risque de faux `combat_sans_issue`.

STATUT DE MES OBJECTIONS
1. Second moteur: **maintenue** (veto conditionnel, vérifié à la revue: aucun `combatEngine` ni `SessionState` dans `repeter.ts`).
2. Motifs `pas_max` / `combat_ouvert`: **retirée**. PM, UX et QA convergent sur 5 motifs sans `combat_ouvert`.
3. Étalon remplace ou coexiste: **retirée pour it2** (hors périmètre), **maintenue pour it4**.
4. « Borné » et chaîne de `&&`: **retirée** pour le chiffre (50, exporté); **maintenue** pour le `switch` exhaustif.

VERDICT TOUR 2 — **recevable sous réserve** (spec réécrite: critère 12, `plan.n` = 4, étalon en it4).

---
## ANNEXE — Lots révisés (hors quota)

Zéro lot `contrat`: rien dans `brain/`. Un seul lot, exécution séquentielle, ni worktree ni fusion.

| Lot | Type | Fichiers (N = créé, R = remplace) | Expose | Consomme |
|---|---|---|---|---|
| L1 `boucle-combat` | feature | R `utils/repeter.ts`; R `components/PanneauRepetition.tsx`; R `tests/repeter.test.ts`; R `tests/panneauRepetition.test.tsx`; N `tests/repeterCombat.integration.test.ts` | ci-dessous | `jouerPosture`, `cloreCombat`, `fixerHeros` (`brain`); `rejouerCombat`, `bilanDe`, `ouvrirRencontreSiDue` (`player/engine/rencontre`); `finAtteinte`; `BESTIARY_BY_TEMPLATE`, `PREFIXE_BESTIAIRE` (`brain`, pour le nom du monstre) |

Retiré d'it2 et reporté, fichiers inchangés: L1 `etalon` devient le premier lot d'it4 (R `docs/REGLES-DU-JEU.md` d'abord, N `utils/etalon.ts`, N `tests/etalon.golden.test.ts`).

```ts
export const PAS_MAX = 20
export const ROUNDS_MAX = 50
export type MotifArret = 'fin' | 'impasse' | 'pas_max' | 'mort' | 'combat_sans_issue'
export type RapportRepetition = {
  readonly graine: number; readonly pas: number; readonly lieu_id: string
  readonly combats_traverses: number
} & (
  | { readonly arret: 'fin'; readonly fin_id: string }
  | { readonly arret: 'mort'; readonly monstre_ref: string }
  | { readonly arret: 'combat_sans_issue'; readonly monstre_ref: string }
  | { readonly arret: 'impasse' }
  | { readonly arret: 'pas_max' }
)
export function repeter(dossier: Dossier, graine: number): ResultatRepetition // signature inchangée
// SUPPRIMÉ: 'combat_ouvert'. INCHANGÉS: creerHerosSynthetique (export pour test), creerRng(graine,'heros',0).
```

Boucle après `ouvrirRencontreSiDue`, si `session.combat`:
- Poser `ROUNDS_MAX` fois `jouerPosture(s, 'normale')` sur une copie locale, puis un seul `rejouerCombat`. S'il rend `ok:false`: throw d'invariant. Ensuite `bilanDe`.
- Pas de bilan: `combat_sans_issue`.
- Issue `hero-mort`: `mort`, `cloreCombat` non appelé.
- Sinon `cloreCombat` reçoit la session NON gonflée, `combats_traverses` +1, puis `finAtteinte` au même pas.
- Les postures gonflées ne sortent jamais de la boucle.

Témoins (L1):
- `rejeu_en_un_coup_equivaut_au_pas_a_pas` (moteur réel, une graine). Deux façons d'appeler le même moteur, pas un second moteur. Même bilan attendu.
- `integration_deterministe` (moteur réel, graines 0 à 9): jamais `combat_ouvert`, même graine donne même rapport.
- `mort_ne_clot_pas` (mocké): `cloreCombat` et `executerCommande` non rappelés.
- `combat_sans_issue` (`rejouerCombat` mocké en `ongoing`): l'appel reçoit exactement `ROUNDS_MAX` postures, ce qui tue les mutants +/-1.
- `rejeu_refuse` (mocké `ok:false`): throw.
- `combat_puis_fin_meme_pas`, et `combats_traverses` compté.
- Panneau: un `switch` exhaustif avec `default: never`. Nom du monstre via `BESTIARY_BY_TEMPLATE[ref.slice(PREFIXE_BESTIAIRE.length)]?.name`, repli « un monstre du bestiaire », jamais l'identifiant.

Docs (étape 4, hors lot):
- Critère 12 réécrit (`fin, impasse, pas_max, mort, combat_sans_issue`), `plan.n` 3 → 4, it2 recentrée, it4 `etalon` (SACRIFIABLE).
- `brain_contracts`: « héros étalon en it2 » → it4. Roadmap `1/3` → `1/4`.
- `code-knowledge.json` est à 4 o de marge. Tout KR neuf (`ROUNDS_MAX`, paramètre de simulation hors règles) force la compaction dans ce lot docs.
- Les tests `combat_ouvert_*` d'it1 (`repeter.test.ts` x3, `panneauRepetition.test.tsx` x2) sont réécrits, pas supprimés.

## Décisions prises en autonomie faute de spécification
- Étalon en it2 ou it4 → it4 (concession au PM) → si it2: plus de 8 critères et veto PM, mais le témoin `mort` du moteur réel serait dicté par l'arithmétique du doc. En it4 il ne l'est pas: `mort` et `combat_sans_issue` sont épinglés par mock, et le moteur réel ne porte que des témoins d'intégration.
- Valeur de `ROUNDS_MAX` (20 / 30 / 50) → 50 → si 20: faux `combat_sans_issue` sur un combat long légitime, c'est-à-dire le faux signal que le PM redoute. Le coût de rejeu ne plaide plus pour une valeur basse.
- Rejeu pas à pas ou en un coup → en un coup → si pas à pas: O(N²) rounds rejoués (1 275 par combat à N = 50). Risque du choix: la session locale porte des postures non jouées, jamais persistée ni exposée. Le témoin d'équivalence rougit si le rejeu diverge.
- `combats_traverses` dans le rapport → oui, sur la base du type → si non: le but d'it2 (voir le héros traverser) reste invisible, et l'ajouter après coup oblige à réécrire les `toEqual` stricts de `repeter.test.ts`. Si le PM le refuse: un critère de moins, aucun autre changement.
- `hero-survived-unconscious` compte comme traversé → oui (le héros repart à 1 PV, `executerCommande` l'accepte) → si non: un survivant serait rapporté comme mort.
- Nom du monstre: helper brain ou deux exports existants → deux exports (second appelant de la décomposition, après `FicheEvenement.tsx:157`) → si helper `nomDuMonstre`: un lot `contrat` de plus et une retouche de `dossier-registres` pour un one-liner à deux appelants. À extraire au troisième.
- `creerHerosSynthetique` conservé, export « pour test » inchangé → si retiré: retouche de tests d'it1 hors périmètre.
