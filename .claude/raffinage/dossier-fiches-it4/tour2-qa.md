## Note tour 2 — QA, `dossier-fiches` it4

**Réponse nommée à tech-lead (trou de liste optionnelle, BUG-050 résiduel).** Objection retenue — c'est exactement la classe de trou que jest ne peut pas voir tout seul (un tableau de chaînes passe `Array.isArray`, ok:true). Deux artefacts à livrer dans le lot contrat :

- `resolved_decisions` (spec) : « it4 ferme le trou résiduel de BUG-050 : `LISTES_A_ELEMENTS_STRUCTURES` est désormais `[...LISTES_REQUISES, ...LISTES_OPTIONNELLES_STRUCTUREES]`, pas `LISTES_REQUISES` seule — `contre_mesures[]` (et toute liste optionnelle future) est validée structurellement. »
- `bug_history.json`, nouveau `BUG-0XX` (root_cause pointant `BUG-050`, `discovered_at: "iteration-4"`, `severity: "major"`), `regression_test` : `validate.test.ts` — « `contre_mesures` avec une chaîne au lieu d'un `ContreMesure` → `ok:false`, issue sur `monde.personnages[].contre_mesures[0]` ». Contrepartie : `couverture.test.ts` doit épingler le compte à **4** chemins (pas 3) — un retour silencieux à 3 masquerait la régression.

**Portee (point 2)** — confirmé, aucun de mes cas limites tour 1 ne cite le nom exact `portee` ; renommage sans impact de mon côté.

**Statut de mes objections tour 1** :
- Scission du critère #7 en (a)/(b) : **maintenue**, tech-lead confirme mot pour mot le même diagnostic sans formulation alternative pour la scission elle-même — rien à ajuster.
- Cas limite « duree/si_bloque forme non tranchée » : **retirée telle quelle**, reformulée en annexe (décision narratif-ia intégrée).
- Reste de l'annexe tour 1 : maintenue inchangée.

VERDICT — recevable sous réserve (trou BUG-050 fermé + test nommé livrés dans le lot contrat).

---

**ANNEXE — cas limites reformulés (remplace l'entrée tour 1 « duree/si_bloque de forme non tranchée »)**

- `duree` absent ET `si_bloque` absent sur une étape → calme, aucun avertissement D1 (fixture : étape sans les deux champs).
- `duree = 0` ou `duree < DUREE_MIN` (1) → refusé au SSOT, issue nommée (test `validate.test.ts`, borne `DUREE_MIN`).
- `duree ≥ 1` présent, `si_bloque` absent → calme (le moteur n'a encore rien déclaré bloqué).
- `si_bloque` présent sans `duree` → avertissement D1 non bloquant, testé à deux personnages (repris de la proposition narratif-ia #3).
- `contre_mesures: ["une chaîne"]` → refusé (nouveau cas limite, cf. correctif BUG-050 ci-dessus).
