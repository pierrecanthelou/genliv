# Tour 1 — `pm-produit`

RISQUE — Vu de mon poste (garder la demande et empêcher le gonflement) : cette tranche est purement outillage, sans auteur à servir, ce qui la rend justement la plus exposée à mon biais — « puisqu'on est dedans, autant viser le plafond 90 » (trou n°3), ou « autant documenter proprement toute la table d'écart » (trou n°1 étendu au-delà des 9 mutants concernés). Le risque n'est pas l'absence de valeur, c'est la sur-livraison sur une dette dont le seul mandat est de débloquer la n°11 (break ≥ 85).

OBJECTION — Le goal écrit nomme « `combat.ts` » alors que le travail spécifié (21 tests, table de correspondance it1 §2) touche aussi `challenge.ts`, `characteristics.ts`, `xp.ts` — cohérent avec le calcul (le score global doit franchir 85, pas seulement `combat.ts`), mais la phrase devrait le dire. Plus grave : le cadrage laisse ouverte l'hypothèse « si les 48 tombent, `break` 90 » — ça n'est pas ce qui est demandé. La demande réelle, écrite au roadmap §3 n°11, est `break ≥ 85`. Viser 90 sans qu'un besoin le réclame est exactement le lot que je dois refuser d'endosser.

PROPOSITION — Fixer par écrit dans le plan : `break = floor(S mesuré / 5) × 5`, sans chasse au-delà de 85 une fois ce seuil franchi honnêtement ; tout mutant restant après 85 documenté, jamais chassé pour lui-même. Sur le trou n°1 : autoriser l'ajout des deux clauses manquantes à `docs/REGLES-DU-JEU.md` §3 (écart ≤ 0, égalité des AT) et rien d'autre — pas de refonte de la table.

VERDICT — recevable sous réserve.

---

## ANNEXE

**Phrase de démo proposée** (côté équipe, sans « et ») : *« À la fin de cette tranche, l'équipe peut committer une itération touchant `combat.ts`, `challenge.ts`, `xp.ts` ou `characteristics.ts` en faisant confiance au score de mutation affiché — plus de survivant qui cache une arithmétique fausse dans le lot déjà spécifié, plus de variation aléatoire d'un run à l'autre. »*

**Hors périmètre exigé** :
- Aucun changement de logique dans les 4 fichiers — uniquement commentaires `// Stryker disable`/`restore`, annotations d'équivalence, et le fix du `rng` non seedé l.107 (portée exacte : rendre le tirage déterministe pour les tests concernés, pas une refonte de `combat.ts`).
- Aucune évaluation du bien-fondé des règles elles-mêmes — seule la mise en cohérence doc/code des règles DÉJÀ codées est dans le lot.
- `docs/REGLES-DU-JEU.md` ne reçoit que les deux clauses manquantes du trou n°1 ; aucune autre section réécrite.
- BUG-035, scission d'un fichier, toute autre ligne de la dette à déclencheur : hors périmètre.
- Break au-delà de 85 : pas un objectif, seulement une conséquence acceptée si elle tombe naturellement.

**Refus motivés** :
1. **Refusé : viser `break = 90`** comme cible du plan. Motif : la seule valeur demandée par la feature dépendante (n°11) est `break ≥ 85` ; le cliquet remonte de toute façon à chaque futur lot. Aucune urgence à pré-charger la marge maximale sur une tranche hors-cycle dont le mandat est de débloquer, pas d'optimiser.
2. **Refusé : traiter le trou n°1 comme une occasion de compléter plus largement `docs/REGLES-DU-JEU.md` §3.** Motif : KR-130 exige le sens d'écriture pour *verrouiller une valeur déjà codée*, pas pour concevoir de nouvelles règles ; toute extension au-delà des deux clauses strictement nécessaires aux 9 mutants visés est un lot de design de règles, pas de l'outillage.
3. **Refusé : élargir la phrase de démo à « toutes les features bénéficient d'un score fiable »** — la portée reste les 4 fichiers déjà mutés ; `kinds.ts`, `equipment.ts` restent en dette à déclencheur.

**Trous n°2, n°4, n°5** : hors domaine de veto PM. Note seulement que le découpage en lots ne doit pas transformer la tranche en « une itération par fichier de règles » : la phrase de démo reste unique, les lots sont une subdivision d'exécution.
