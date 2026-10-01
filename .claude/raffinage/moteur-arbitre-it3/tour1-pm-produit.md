RISQUE — `heroTier` n'est pas tranché (point 5 du cadrage) et le précédent le plus proche dans cette feature est « STOCKER » (pvMax/peMax, it1 §8#2). Si un ouvrier applique ce précédent par réflexe, `heroTier` se fige alors qu'il DOIT être recalculé à chaque jet (KR-013) — `caracs` évoluera via la boutique XP (n°13+) et une valeur stockée divergerait silencieusement. Second risque : la constante extraite de `xp.ts` (KR-261) a deux lecteurs (narration + XP) ; si le but ne le dit pas explicitement, un ouvrier peut en dupliquer une pour la narration.

OBJECTION — le but tel qu'écrit juxtapose deux comportements observables (amorce à 3 niveaux pour la réussite, crédit XP) sans dire qu'ils partagent la MÊME source. Sans cette clause écrite, ce n'est plus une tranche mais potentiellement deux lots qui dérivent chacun son seuil.

PROPOSITION — 1) Écrire noir sur blanc : une seule constante nommée, deux lecteurs, même lot, aucun seuil dupliqué. 2) Trancher `heroTier = tierOf(heros.caracs[carac testée])`, calculé inline au crédit XP, jamais stocké (le précédent pvMax/peMax est un contre-exemple ici, pas un modèle). 3) Nommer explicitement hors périmètre : nuance sur l'échec (reste un seul mot « échoue », cohérent avec `challengeXp` qui ne bonifie jamais l'échec), `combatXp`, la boutique XP, toute modification de `caracs` dans ce lot.

VERDICT : recevable sous réserve — tranche verticale unique (l'auteur voit son héros gagner de l'XP selon la marge réelle), à condition d'écrire les deux clarifications ci-dessus avant le lot.

---
Fichiers lus pour cette note : src/features/moteur-arbitre/specification.json, docs/ROADMAP-BASCULE-IA.md, docs/REGLES-DU-JEU.md (§1/§2/§4/§5), src/brain/xp.ts.
