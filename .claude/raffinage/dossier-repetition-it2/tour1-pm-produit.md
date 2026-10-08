# dossier-repetition it2 — PM — Tour 1

**RISQUE** — Faux signal. Un joueur qui ne joue que la posture normale et ne fuit jamais meurt ou s'enlise. L'auteur lit « combat injuste » et corrige un dossier sain.

**OBJECTION**
1. **Pas une tranche verticale.** Le goal assemble une règle de jeu (section `REGLES-DU-JEU.md`, table dorée, `etalon.ts`) et un comportement visible (boucle de combat). L'étalon seul ne traverse pas l'écran. Plus de 8 critères.
2. **Critère des motifs faux.** `pas_max` manque dans la liste. Et `combat_ouvert` devient inatteignable une fois la boucle écrite (KR-312). Branche morte à retirer (type, copie `PanneauRepetition.tsx:198-205`, témoin).
3. **« Borné » sans chiffre.** `combat_sans_issue` n'a aucun témoin nommé (même défaut que KR-315 avant `PAS_MAX`).
4. **SACRIFIABLE mal posé.** Sans boucle de combat, it3 (« NON ATTEINT EN 20 PAS ») ment dès qu'un combat est sur le chemin. Ce qui est sacrifiable, c'est l'étalon, pas la boucle.

**PROPOSITION**
- **it2 recentrée** : « l'auteur peut voir son joueur synthétique affronter les combats de son aventure au lieu de s'y arrêter ».
  - Dedans : héros d'it1 conservé, posture normale, `ROUNDS_MAX` nommé (20, mutant-testé), motifs `mort` et `combat_sans_issue`, `combat_ouvert` retiré. Cela fait 5 motifs : fin, impasse, pas_max, mort, combat_sans_issue. Environ 7 critères, 2 lots.
  - Hors : étalon, doc des règles, table dorée, fuite, autres postures, butin, repos.
  - Copie : des « arrêts » du joueur synthétique, jamais « à corriger ».
- **Étalon → it4**, seule itération sacrifiable. Ordre 2 → 3 → 4. Je retire d'it2, je n'y ajoute rien.

**VERDICT** — **veto** sur la définition écrite. Il est levé si it2 est recentrée comme ci-dessus.

## Décisions prises en autonomie faute de spécification

- `ROUNDS_MAX` non chiffré → 20, constante nommée, alignée sur `PAS_MAX` → si c'est l'inverse : une valeur plus basse coupe des combats longs mais légitimes en `combat_sans_issue` ; une valeur plus haute alourdit le rejeu, car `rejouerCombat` recalcule tout à chaque posture. Le Tech Lead doit chiffrer.
- L'étalon est placé « dans la feature (it2) » par `resolved_decisions` et le cadrage → j'ai gardé son domicile (la feature) et déplacé son numéro à it4. `plan.n` passe de 3 à 4 → si l'étalon reste en it2 : plus de 8 critères et 4 lots, donc un nouveau veto de ma part. Si l'étalon est abandonné : le déclencheur « étalon livré » de la dette « Difficulté non calibrée » ne part jamais. **À confirmer par le comité** : je m'écarte de la parenthèse « (it2) » et du « RETENU : 3 itérations ».
- Héros seedé d'it1 conservé en it2 → si c'est l'inverse (étalon dès it2) : lecture des morts plus stable d'un parcours à l'autre, mais l'itération redevient horizontale. Avec le héros seedé, la lecture est plus bruitée, et c'est le prix accepté.
- `combat_ouvert` retiré (pas gardé en repli) → si c'est l'inverse : branche morte et mutant survivant. Si it2 est quand même sacrifiée, `combat_ouvert` reste l'arrêt reconnu, comme prévu au point 12 du cadrage.
- Le marquage SACRIFIABLE est contesté dans sa portée (il vise l'étalon, pas la boucle), pas dans son existence → si c'est l'inverse : it3 livre une liste de lieux « non atteints » faussée par des parcours coupés au premier combat.
- Verdict « veto » plutôt que « recevable sous réserve » → si c'est l'inverse : le risque est que la spec reste à environ 10 critères.
