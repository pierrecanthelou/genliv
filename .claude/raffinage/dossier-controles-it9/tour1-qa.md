# Tour 1 — `qa` · `dossier-controles` it9

**RISQUE** — Le vrai risque n'est pas le rayon d'explosion (mesuré négligeable) mais la **FORME du point fixe** : un filtre naïf (une passe, portes lues contre le résultat non itéré) laisse survivre les DEUX membres d'un cycle `apres_indice_id` ↔ `apres_indice_id`. Rien dans le module actuel ne l'empêche : **aucun code n'existe encore** pour `apres_indice_id`/`contrepartie`.

**OBJECTION** — Le cadrage affirme « treize suites » affectées : **FAUX, mesuré.** 20 suites CHARGENT une des deux fixtures, mais sous une implémentation naïve plausible, **un seul test dans un seul fichier bouge** (86 suites/1256 tests → 1 échec). Le chiffre du cadrage est une lecture non vérifiée qui a traversé sans être exécutée ; je le corrige.

**PROPOSITION** — Le plan DOIT nommer un **point fixe UNIFIÉ** sur les deux arêtes indice→indice (`mene_a` **et** `apres_indice_id`), jamais une passe séparée porte-après-saturation. Deux tests obligatoires nommés : (1) « cycle `apres_indice_id` A↔B, aucun autre producteur → les deux comptent **0** producteur (BLOQUANT), jamais 1 » ; (2) `indice.trace-du-guet` de `dossier-reference.json` doit passer de silence à ALERTE — **le seul flip réel mesuré sur les fixtures partagées**.

**VERDICT** — recevable sous réserve : (a) point fixe unifié spécifié avant tout code, (b) les deux tests nommés avec leur assertion exacte, (c) le chiffre « treize suites » corrigé en amont.

---

## ANNEXE

### 1. Rayon d'explosion — **EXÉCUTÉ**

Patch naïf local (filtre post-hoc, une passe), `tsc` vert, puis `jest` complet : **86 suites → 85/1 ; 1256 tests → 1255/1**. Seul échec : `controles.test.ts` › « le calme des deux fixtures et du dossier neuf ne bouge pas » — une ligne `indice-sans-source · alerte` apparaît sur `dossier-reference.json` (`indice.trace-du-guet`, silence → alerte). Fichier restauré, hash identique avant/après, `git status` propre.

Le « treize suites » est **REJETÉ** comme mesure de tests-qui-bougent : c'est au mieux un compte de suites qui LISENT la fixture (mesuré : **20**, pas 13).

### 2. Cas cyclique — **EXÉCUTÉ deux fois**

Dossier : `indice.cycle-a` / `indice.cycle-b`, aucun autre producteur, deux personnages se gardant mutuellement.

- **Code ACTUEL** : `[{famille:'savoir'}]` pour les deux — 1/1, chacun ALERTE. Conforme à H2.
- **Patch NAÏF** : rend **ENCORE** `[{famille:'savoir'}]` — **le cycle survit intact**, 1/1, aucun BLOQUANT. Chaque membre lit l'autre comme « produit » parce que le filtre ne retire personne avant de tester personne.
- **« Correct »** (LU, aucun code it9 n'existe) : un point fixe où le noyau démarre SANS aucun des deux et où `apres_indice_id` entre dans la MÊME relaxation que `mene_a` → ni A ni B n'entrent → 0/0 → BLOQUANT sur les deux, **seule réponse qui ne dépend pas de l'ordre d'évaluation**.

### 3. `contrepartie` dans les fixtures — **EXÉCUTÉ**

**PAS un KR-220** : matériau réel et abondant — `dossier-minimal.json:104` (`objet.clef-de-basalte`, `consomme:false`), `dossier-reference.json:209` (`objet.lanterne-de-corvin`, `consomme:true`), plus une surface d'édition vivante (`BlocSavoirs.tsx`, `useEcritureSavoirs.ts`) et des fixtures locales. `apres_indice_id` : 19 fichiers. **L'objection de périmètre façon KR-220 est REJETÉE, mesurée fausse.**

### 4. Complément mesuré

`objet.lanterne-de-corvin` n'est **jamais** `donner_objet` dans `dossier-reference.json` (seule occurrence : un `retirer_objet`, l. 341) — cause directe du flip sur `indice.trace-du-guet`.

### 5. Lecture annexe (LU, non mesuré)

Le point du cadrage sur H2 et le jalon est cohérent avec `types.ts:1418-1423` et `deltas.ts:74` : `atteindre_jalon` s'écrit depuis **n'importe quel** site de `Delta[]`, indépendamment du `declencheur_expr` propre du jalon.

---

## Notes de l'orchestrateur

1. **L'objection sur « treize suites » est FONDÉE, et l'erreur est de moi.** J'ai écrit ce chiffre au cadrage sans l'exécuter — exactement la faute que la skill existe pour empêcher. Le chiffre juste : **20 suites chargent une fixture, 1 seul test bouge**. Corrigé au plan.
2. **Le sens d'erreur est MAL ÉTIQUETÉ dans cette note.** La QA écrit que le cycle survivant est un « faux positif » ; c'est un **faux négatif** — le cycle compté comme produit rend le linter **silencieux** sur un verrou réel. Le `tech-lead` a la direction juste (gfp → « faux négatif »). La **conclusion** (le filtre naïf est faux) reste vraie ; le **motif** ne l'est pas, et un refus juste sur un motif faux cède au premier contradicteur.
3. **Le flip `indice.trace-du-guet` est mesuré par DEUX rôles** — la QA le lit comme un **défaut trouvé** à épingler ; le `narratif-ia` le lit comme un **faux positif sur un dossier sain**. C'est le désaccord central du tour 2.
