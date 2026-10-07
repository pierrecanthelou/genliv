# Cadrage n°16 `dossier-repetition` — Tour 1 — QA

RISQUE — Frontière code/IA non tranchée. La fourche centrale (A) joueur synthétique via IA vs (B) code déterministe seedé pivote sur une décision d'architecture, pas une implémentation. Or moteurSansIA.test.ts (KR-250) est un invariant : `player/` et `brain/dossier/` interdits d'IA. Si (A) retenue, il faut un contrat d'échec du rôle IA qui ne touche jamais executerCommande. Si (B) retenue, simulator = fonction pure (dossier, graine) → Rapport, jamais une itération IA. La spec n'existe pas ; les critères d'observabilité sont absents.

OBJECTION — Plan écrit « 2 itérations », /cadrage demande « 3 à 6 ». Aucun découpage vertical. Pas de tranche démontrable en une phrase sans « et ». Critère « rapport de blocages » n'est pas observable — `Étant donné ?, Quand ?, Alors un rapport ?` n'existe pas. Plus grave : tout détecteur de blocage cité doit prouver qu'il détecte vraiment (pouvoir séparateur SKILL.md), via un scénario divergent. Aucun dossier-témoin nommé n'existe.

PROPOSITION — 3 itérations. It1 : simulator(dossier, graine, commandes[]) → {etat, rapports}, test d'identité graine-reproduisibilité, moteurSansIA.test.ts reste vert. It2 : 20 tours sur 3 dossiers-témoins nommés (amorce-injouable, pnj-orphelin, indice-inaccessible), blocages vérifiés en diff. It3 : UI rapport.

VERDICT — recevable sous réserve
- Trancher fourche A/B AVANT /raffiner. Écrire la décision au plan.
- Énumérer 3 dossiers-témoins nommés. Écrire le schéma divergent pour chacun.
- Découpe verticale : it1 démontre quoi, en une phrase sans « et ».

## Fichiers consultés
- src/brain/dossier/tourzeroOracle.test.ts
- src/brain/dossier/atteignabilite.test.ts (en-tête)
- src/features/moteur-fins/specification.json
- code-knowledge.json (KR-242/304, KR-248/306, KR-250)
- .claude/skills/raffinage-iteration/SKILL.md
- docs/ROADMAP-BASCULE-IA.md
