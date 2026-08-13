# TOUR 2 — QA · `dossier-fiches` it2

## RÉPONSES AUX OBJECTIONS

À **`tech-lead`** (« rien du tout dans `tables.ts` », domaine testabilité) : sondé — sans budget, `warnings` reste `[]` sur toute prose libre, donc `statut:'ecrit'` **avec** `warnings` n'a **aucun** chemin d'activation. `tech-lead` a raison que le budget ouvre une seconde surface de rendu — mais tranche à tort que ça referme le sujet : sans lui, mon veto de tour 1 sur `refuse` se généralise de fait à *tout le bloc identité* — aucun état hors `'ecrit' sans warning` / `'absent'` n'est jamais démontrable, tour après tour, jusqu'à un futur champ contraint.

## STATUT DE MES OBJECTIONS

**RETIRÉE** — mon objection du tour 1 (`RefusEnCours` prétendant couvrir `refuse` depuis la prose) : le lot `tech-lead` réduit déjà le statut atteignable à `'absent'` seul, `refuse` explicitement sans critère ni mock. Rien à bloquer, motif satisfait.

## SONDES ET RÉSULTATS

- `texte-trop-long` existe (`validate.ts:653`, `issues.ts:40/103`), émis par `BUDGETS_DE_MOTS` ; `Site.path` / `Site.location` portent l'indice concret et le nom (`localiserEntite`) — **confirmé**, filtrage par personnage possible.
- `couverture.test.ts:315` exige bien `warnings === []` — **confirmé, mais seulement sur `dossier-minimal.json`** (`fixture()` l. 87-89 ne lit que la minimale) ; `dossier-reference.json` n'est jamais soumis à ce garde. Précision à `narratif-ia` : « les fixtures » (pluriel) est inexact.
- Motif `PROSE_D_ENTITE_LIBRE` (`couverture.test.ts:236-237`) dit textuellement « … ni longueur (aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]`), ni vocabulaire » — **confirmé exactement** comme cité par `tech-lead`.
- `panneauPersonnages.test.tsx:202-228` : **1 seul test** casse par le recalage (« 7 placeholders: … »), avec 4 assertions internes à réécrire (`toHaveLength(7)→6`, puis les décomptes par `TEXTE_ITERATION`).

## POSITION SUR LE BUDGET

Favorable **en tant qu'instrument**. Sans budget, `'ecrit' avec warnings` est structurellement mort — le patron qu'it1 s'est interdit pour `refuse`, reproduit côté avertissement. Avec le budget : 2 critères de plus deviennent observables. Sans lui, ces deux lignes ne vont pas dans « non vérifiable » : elles **n'existent simplement pas** — l'itération tient à 7 tests nommés, tous observables.

## TESTS NOMMÉS

**Sans budget (7, sous 8) :**

1. `couverture.test.ts` — 3 entrées `LIBRES` + « les trois proses d identite portent la destination ia et une instance dans les DEUX fixtures »
2. `panneauPersonnages.test.tsx` — « dossier supprimé pendant l'édition : bandeau, pas de silence » (`'absent'`)
3. `panneauPersonnages.test.tsx` — écriture à deux personnages, aucune fuite d'indexation (KR-197)
4. `panneauPersonnages.test.tsx` — lecture au montage sur deux personnages, 7 champs (BUG-064)
5. `panneauPersonnages.test.tsx` — recalage des 6 placeholders (réécriture du test 7→6)
6. Non-régression suite existante (création, nom, camp/plan, Select objectif — it1)
7. lint / tsc / jest verts (porte qualité)

**Avec budget (9, au-dessus de 8)** : les 7 ci-dessus + `validate.test.ts` (dépassement → `warning`, `ok` reste `true`) + rendu de l'avertissement filtré par personnage.

## VERDICT

Favorable. Le budget rendrait l'itération plus démontrable mais porterait le compte à 9 critères — au comité de trancher ; sans lui, les 7 tests nommés couvrent l'intégralité du goal et rien ne part en « non vérifiable » sauf la branche `refuse`, qui y était déjà.
