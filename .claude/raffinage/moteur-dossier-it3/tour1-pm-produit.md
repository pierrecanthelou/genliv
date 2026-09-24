# Tour 1 — pm-produit — moteur-dossier it3

RISQUE — La démo « l'auteur voit un jalon s'atteindre » ne s'exerce que sur `dossier-minimal.json` (fixture). **Aucune surface de `dossier-registres` n'écrit `declencheur_expr` sur un Jalon** : décision RETENUE et SILENCIEUSE actée en it2 de cette feature (« `alerteSansExpr: false` sur Jalon », `dossier-registres/specification.json` resolved_decisions l. 260 ; `FicheJalon.tsx` / `useEcritureJalons.ts` ne committent que `nom` / `declencheur_texte` / `enonce_texte`, jamais `expr` ni `effet`). C'est le défaut exact de BUG-090 (`reussi_si_expr` : 0 occurrence en production) **transposé au Jalon** — d'où « arme BUG-090 » au cadrage. **Aucun auteur ne peut aujourd'hui produire le dossier que ce critère démontre.**

OBJECTION 1 — Aucun des 12 `acceptance_criteria` n'exige qu'un jalon atteint **se RENDE à l'écran**. Le critère 6 teste une projection SÉRIALISÉE EN TEST, jamais `JournalRow`. « Voir » est le verbe du goal ; rien ne prouve le visuel. Sans critère de rendu, l'itération livre un **contrat de données**, pas ce que l'auteur voit.

OBJECTION 2 — Le seul scénario nommé (KR-252, chaîne val-cendre) déclenche à l'**OUVERTURE**, avant toute commande : « devenue vraie » y est **déjà vraie à l'instant zéro**, sans geste du joueur. Ça teste la décision (i), pas « je joue et je vois un jalon s'atteindre ». Il manque un scénario où un `ALLER` (it2) fait **basculer** la condition en session.

PROPOSITION — Ajouter : un **critère de rendu** (`JournalRow` distingue une entrée causée par un jalon d'une entrée de commande) + un **scénario de déclenchement POST-commande**. Les deux cellules de `tourzero.ts` : **dette technique légitime**, correctement nommée par le cadrage — je confirme, ce n'est pas de la valeur déguisée.

VERDICT — **recevable sous réserve** (rendu visible + scénario post-commande).

---

## Note complémentaire

**Confirmations, pas objections nouvelles** :
- Le contrôle de taille § 4 du cadrage (couplage « voir » / « appliquer ses effets ») : **je ne le conteste pas**. `Jalon.effet` est requis par `types.ts`, et séparer casserait la cohérence du lot `contrat`. Je ne demande **aucune découpe supplémentaire** — seulement les deux ajouts ci-dessus, qui n'ajoutent **aucun lot**, seulement des critères dans les lots déjà prévus.
- Les `resolved_decisions` de `moteur-dossier` : rien n'y est rouvert par mes objections.

**Décision prise en autonomie, signalée et non tranchée** :
- Le cadrage ne précise pas si un jalon s'évalue **après CHAQUE commande acceptée** ou **seulement à l'ouverture** → j'ai supposé « après chaque commande acceptée, **en plus** de l'ouverture » (cohérent avec `REGLES-PLAY.md` § J1, et la décision (i) ne couvre QUE l'ouverture) → **si c'est l'inverse**, l'itération ne peut démontrer AUCUN jalon qui « devient » vrai en cours de partie, ce qui viderait le goal de son sens et **durcirait mon objection 2 en veto**.

Fichiers lus : le cadrage · `specification.json` (n° 9) · `moteur-dossier-it2.revue.md` · `docs/ROADMAP-BASCULE-IA.md` (§ 3 l. 9, § 2 bis) · `types.ts:1495-1512` (`Jalon`) · `dossier-registres/specification.json` · `FicheJalon.tsx` · `useEcritureJalons.ts` · `bug_history.dossier-controles.json` (BUG-090).
