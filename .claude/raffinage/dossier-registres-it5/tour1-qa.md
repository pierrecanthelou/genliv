# Tour 1 — `qa` · `dossier-registres` it5

```
RISQUE      — Critère d'acceptation n°6/7 (« effets_regles... éditable via les opérations
              existantes ») contredit le design_contract (« Climat n'a pas besoin
              d'EditeurEffets, KR-208 ») : aucun instrument ne peut prouver « éditable » si rien
              ne se rend. Risque secondaire : Climat.duree?: string, s'il copie le nom `duree` de
              PlanAction.duree (entier, moteur), rejoue une collision de sens masquée
              (précédent KR-198) sans qu'aucun test ne la nomme.

OBJECTION   — Le critère est irrecevable tel qu'écrit : il faut choisir un sens observable et
              l'écrire. Soit « effets_regles reste affiché en lecture seule (aucun EditeurEffets
              sur FicheClimat, KR-208) » — prouvable par l'ABSENCE d'un composant EditeurEffets
              dans le rendu ; soit un éditeur existe réellement et le critère nomme le test qui
              le prouve. La formulation actuelle ne nomme aucun des deux.

PROPOSITION — 1) `panneauConditions.test.tsx` — « aucun EditeurEffets ne se rend sur FicheClimat »
              (niveau composant, RTL, `queryBy…` absence) OU son inverse selon l'arbitrage.
              2) `couverture.test.ts` — étendre la fixture climat à `duree` non vide + ligne
              `destinations.ts`, assertion de corruption.
              3) `validate.test.ts` — « un climat créé sans nom ni durée reste accepté (commit
              immédiat, précédent it1) » : aucune ligne CHAMPS_REQUIS ne contraint `climat.nom`/
              `duree`, donc PAS de brouillon différé (KR-214) — confirmer ce choix par un test,
              pas une supposition.
              4) Non-régression : « isolation des 9 autres sections » étendue au panneau
              Conditions.

VERDICT     — recevable sous réserve : corriger le critère (choix explicite + instrument) et
              nommer le test tranchant nom vs duree avant l'essaim.
```
