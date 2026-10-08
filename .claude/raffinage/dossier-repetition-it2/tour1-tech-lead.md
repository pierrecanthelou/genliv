# dossier-repetition it2 — Tour 1 — Tech Lead

**RISQUE** — Un second moteur de combat. Si `repeter` bâtit un SessionState et appelle `startCombat`/`resolveCombatRound`/`pickMonsterPosture`, ses issues divergent silencieusement de celles du joueur réel (KR-292), et la table dorée fige le défaut au lieu de le verrouiller (KR-130).

**OBJECTION**
1. Le « problème structurel » du cadrage n'existe pas : `rejouerCombat(s: EtatSession)` construit déjà son SessionState (`rencontre.ts:70-83`). Veto si `repeter` en fabrique un ou appelle les trois fonctions de `combatEngine`. Les retirer des contrats consommés de la spec.
2. Critère 12 : « 5 motifs » omet `pas_max` et garde `combat_ouvert`, que KR-312 déclare résolu. C'est une variante sans producteur, donc du code mort.
3. « Étalon » ne dit pas s'il remplace `creerHerosSynthetique`. Deux héros donnent un rapport qui ne dit pas de qui il parle.
4. « Borné » n'a pas de chiffre. Le panneau rend par chaîne de `&&` : un motif oublié donne un vide silencieux.

**PROPOSITION**
- Boucle : `jouerPosture('normale')` → `rejouerCombat` → `bilanDe` → `cloreCombat`. `mort` ne clôt pas. `ROUNDS_MAX = 30`, exporté, hors `PAS_MAX` (KR-295). Pire cas : 465 rounds rejoués par combat.
- Union finale : `fin | impasse | pas_max | mort | combat_sans_issue`.
- L'étalon REMPLACE le héros seedé : valeurs du doc → `buildHeroFromCreation` (aucun pv littéral, KR-013). Le domaine `'heros'` part sans décaler `'repetition'` (alea keyé par domaine).
- `rejouerCombat` `ok:false` → throw d'invariant (`validate.ts:459-474` refuse déjà la référence au SSOT).
- Panneau : `switch` exhaustif avec garde `never`.
- Testabilité : un fichier NON mocké (moteur réel, issue dictée par l'arithmétique du doc, pas par un `received`). `combat_sans_issue` via `rejouerCombat` mocké.

**VERDICT** — recevable sous réserve (objections 1 à 3 levées dans le plan).

---
## ANNEXE — Découpage en lots (hors quota)

Zéro lot `contrat` : rien dans `brain/` (pas de type, de domaine d'aléa, d'événement ni de clé de persistance). `fixerHeros`, `jouerPosture` et `cloreCombat` sont déjà exportés par `brain/index.ts` (l.583-591). `rejouerCombat`, `bilanDe` et `ouvrirRencontreSiDue` viennent de `player/engine/rencontre`, import légal. Aucun import inter-feature. L'exécution est séquentielle : pas de worktree, pas de fusion.

| Lot | Type | Fichiers (N = créé, R = remplace) | Expose | Consomme |
|---|---|---|---|---|
| L1 `etalon` | feature | R `docs/REGLES-DU-JEU.md` (section « Héros étalon », écrite d'abord) ; N `src/features/dossier-repetition/utils/etalon.ts` ; N `src/features/dossier-repetition/tests/etalon.golden.test.ts` | `export function creerHerosEtalon(): HeroState` (objet frais à chaque appel, jamais une constante partagée) | `buildHeroFromCreation`, `CreationPool`, `CreationAssignment` (`player/engine/charCreation`) |
| L2 `boucle-combat` | feature | R `utils/repeter.ts` ; R `components/PanneauRepetition.tsx` ; R `tests/repeter.test.ts` ; R `tests/panneauRepetition.test.tsx` ; N `tests/repeterCombat.integration.test.ts` | voir ci-dessous | `creerHerosEtalon` (L1, figé), `jouerPosture`, `cloreCombat`, `fixerHeros` (`brain`), `rejouerCombat`, `bilanDe`, `ouvrirRencontreSiDue`, `finAtteinte` |

Aucun fichier n'est nommé par deux lots. L1 passe seul la porte (tsc + jest), car l'étalon n'a besoin d'aucun appelant pour être épinglé. L2 lit L1 comme une donnée immuable.

Signatures exposées par L2 :
```ts
export const PAS_MAX = 20
export const ROUNDS_MAX = 30
export type MotifArret = 'fin' | 'impasse' | 'pas_max' | 'mort' | 'combat_sans_issue'
export type RapportRepetition = {
  readonly graine: number; readonly pas: number; readonly lieu_id: string
} & (
  | { readonly arret: 'fin'; readonly fin_id: string }
  | { readonly arret: 'mort'; readonly monstre_ref: string }
  | { readonly arret: 'combat_sans_issue'; readonly monstre_ref: string }
  | { readonly arret: 'impasse' }
  | { readonly arret: 'pas_max' }
)
export function repeter(dossier: Dossier, graine: number): ResultatRepetition // signature inchangée
// SUPPRIMÉS : creerHerosSynthetique (export « pour test »), 'combat_ouvert', creerRng(graine,'heros',0)
```

Pourquoi 2 lots et pas 1 : le seul mode de panne que l'instrument ne voit pas, c'est la valeur dorée recopiée depuis le code (WORKFLOW, « sens d'écriture »). Un lot L1 relu avant que `repeter` ne soit touché permet de vérifier doc → golden sans que le code existe encore. Les deux lots ne partagent aucun fichier.

Pas d'extraction d'un `résoudreCombat` : `repeter.ts` fait 230 l., moins ~25 (héros seedé) plus ~50 (boucle) = environ 255, sous le seuil de 400 (KR-112). Une fonction à un seul appelant serait une dette.

Témoins nommés (L2) :
- `mort_au_combat` (moteur réel) : monstre que l'étalon ne peut pas battre selon le doc ; le rapport dit `mort` + `monstre_ref`.
- `survie_et_suite` (moteur réel) : monstre trivial ; le run continue, `pas` > pas du combat, arrêt != `mort`.
- `mort_ne_clot_pas` (mocké) : `cloreCombat` n'est PAS appelé sur `hero-mort`, et `executerCommande` n'est plus appelé ensuite.
- `combat_sans_issue` (`rejouerCombat` mocké en `ongoing` perpétuel) : exactement `ROUNDS_MAX` appels de `jouerPosture`, ce qui tue les mutants +/-1 (KR-315).
- `rejeu_refuse` (mocké `ok:false`) : throw.
- `combat_puis_fin_meme_pas` : remplace `combat_et_fin_meme_pas`. Combat résolu, puis `finAtteinte` évalué au même pas. `finAtteinte` n'est jamais évalué pendant que `combat` est ouvert (KR-303).
- `determinisme` (moteur réel) : même graine, même rapport.

Budgets à anticiper (étape 4 du WORKFLOW, pas dans un lot) : `code-knowledge.json` à 4 o de marge (71 676 / 71 680). Tout KR neuf (étalon, `ROUNDS_MAX`) force la compaction dans le même lot docs. Le couple `CLAUDE.md` + WORKFLOW à 6 o de marge : ne pas y toucher. Le roadmap à 1 206 o de marge.

Fichiers que le cadrage n'a pas listés et qui sont touchés : `utils/etalon.ts`, `tests/etalon.golden.test.ts`, `tests/repeterCombat.integration.test.ts`. Les tests `combat_ouvert_*` d'it1 (`repeter.test.ts:135,154` ; `panneauRepetition.test.tsx:111`) sont réécrits, pas supprimés. Les mocks de `repeter.test.ts` (`brain`, `charCreation`, `rencontre`) doivent recevoir `jouerPosture`, `cloreCombat`, `rejouerCombat` et `bilanDe`.

## Décisions prises en autonomie faute de spécification
- `combat_ouvert` gardé ou retiré → retiré de l'union (plus aucun producteur après it2) → si gardé : variante morte et branche de panneau jamais exercée. Si it2 est sacrifiée à mi-course, le repli « combat_ouvert reste un arrêt reconnu » est le code d'it1 déjà livré : revert d'it2.
- Étalon remplace ou coexiste avec le héros seedé → remplace (PM tour 2 d'it1 : « l'étalon le remplacera ») → si coexistence : deux sources de héros, un rapport ambigu. Si remplacement à tort : on perd la variance « héros chanceux », ce qui est acceptable pour un étalon.
- `rejouerCombat` `ok:false` → throw d'invariant, comme `ouvrirSession` en it1 → si motif de rapport : +1 membre d'union et +1 branche de panneau pour un état que `validate.ts:459` rend inatteignable. Si throw à tort : un dossier non validé plante le rendu du panneau.
- Valeur de `ROUNDS_MAX` → 30 (placeholder ; le nombre relève de QA/Narratif, je n'exige que le nom, l'export et le témoin) → trop bas : faux `combat_sans_issue` sur un combat long légitime. Trop haut : coût O(n²) de rejeu, négligeable.
- Rounds comptés dans `PAS_MAX` ou non → non (KR-295 : un combat est un seul pas d'horloge) → si comptés : un combat de 10 rounds mange la moitié du budget de 20 pas et contredit KR-295.
- 1 ou 2 lots → 2, séquentiels → en 1 seul lot : la revue voit doc + golden + code ensemble et ne peut plus vérifier l'ordre KR-130. Les deux lots sont fusionnables sans conflit, car aucun fichier n'est partagé.
- Trace des combats survécus dans le rapport → non (type minimal ; la traversée se lit par `pas` plus grand et un autre `arret`) → si le PM veut « survivre » lisible : ajouter `combats: readonly {pas, monstre_ref, issue}[]` au type. C'est un contrat entre L2 et le panneau, à trancher avant le code : ajouter après coup oblige à réécrire les `toEqual` stricts de `repeter.test.ts` (l.113, 144, 180…).
- Posture 'normale' en dur → reprise telle quelle du goal ; aucune abstraction de stratégie (un seul appelant).
