# Tour 1 — `qa`

RISQUE — **Les prédicats « aucun X ne satisfait Y » sur une collection sont un piège de VIDE VACANT.** Mesuré par script sur `seme()` : « lieu de départ désert » naïve (aucun personnage présent au départ) **déclenche BLOQUANT sur TOUT dossier neuf** (0 personnage → 0 présent), cassant le test existant « produit les quatre controles… » (4 → 5) et violant `design_contract.etat_vide` déjà écrit au plan. Même classe que KR-164, non anticipée par le cadrage.

OBJECTION — Le cadrage nomme deux tensions (path, audience) mais **aucune garde de vide** pour « lieu de départ désert » : définition de fini floue. Seconde objection : `dossier-reference.json`, telle quelle, déclenche déjà **1 bloquant + 6 alertes + 5 infos** sous les cinq règles proposées ; rien n'interdit de s'en servir par erreur comme dossier calme.

PROPOSITION — (1) Garder « lieu de départ désert » derrière `personnages.length > 0`, épinglé par un test nommé prouvant que `seme()` reste à 4 contrôles. (2) Étendre KR-217 aux trois occurrences mesurées sur `dossier-reference.json` et interdire noir sur blanc son usage comme calme. (3) Pointer « indice orphelin » sur `monde.indices[].id` (`moteur`, vérifié existant) plutôt que `savoirs[].indice_id` (`ia`) — résout la tension 2 sans exception.

VERDICT — **recevable sous réserve** : la garde de vide et le choix du path doivent être tranchés et **écrits au plan** avant l'essaim, pas laissés « à trancher ».

## ANNEXE

### 1. Critères d'acceptation proposés (8 pour toute l'itération)

1. Indice sans détenteur ni delta, clone muté d'un champ → **BLOQUANT** section `indices` ; clone intact → rien. Même test. *(contrat, `controles.test.ts`)*
2. Indice détenu par exactement un personnage et aucune autre source → **ALERTE**, `jouable` reste vrai ; clone où le même indice est aussi révélé par un delta → rien. Même test. *(contrat)*
3. Clone où l'unique personnage n'est plus présent au `charpente.depart.lieu_id` → **BLOQUANT** section `depart` ; **et** `construireAmorce(...)` (zéro personnage) → aucun contrôle « départ désert », `controlerDossier(seme()).controles` garde une longueur de **4**. *(contrat, étend le test existant)*
4. Un personnage sans `presence` et un avec → ALERTE pour le premier, rien pour le second. *(contrat)*
5. Un personnage sans `caractere` (ou `parler` vide) et un avec `parler` non vide **et curseurs tous à `CURSEUR_MIN`** → INFO sur le premier, rien sur le second ; aucun contrôle fondé sur une valeur de curseur (KR-221). *(contrat)*
6. Dossier déclenchant chacune des six règles au moins une fois → chaque constat rend un niveau ∈ `niveaux` de sa règle **et** un `path` clé de `DESTINATION_DES_CHAMPS` (`estCleDe`, jamais `in`), balayé depuis `Object.keys(CONTROLES)` (KR-199). *(contrat)*
7. Dossier où une nouvelle règle **et** l'amorce se déclenchent → `jouable` faux, `controles.ts` n'importe jamais `validateDossier` (grep source), aucun `Controle` ne porte `severity`. *(contrat)*
8. Les cinq suites existantes restent vertes **sans modification de leurs assertions**, et aucun test n'utilise `dossier-reference.json` comme dossier « calme ». *(porte de commit + revue de source)*

**Aucun critère de niveau composant** : le cadrage constate « aucune surface neuve » et rien ne le contredit — `PanneauControles` / `ListeControles` rendent déjà `Controle[]` générique (vérifié, 3 tests existants).

### 2. La mesure demandée

**Non exécutée via jest** — les cinq règles n'existent pas encore, donc aucune couleur de test n'est mesurable pour elles. Script Node jetable (scratchpad, non committé) rejouant les cinq prédicats contre les deux fixtures — **mesure de FAIT SUR LES DONNÉES**, pas prédiction de couleur :

```
=== dossier-minimal.json ===
indice orphelin (bloquant)        : 0
goulot d'etranglement (alerte)    : 0
lieu de depart desert (bloquant)  : 0   (depart=lieu.val-cendre, present: pnj.aldur-le-sage)
personnage sans presence (alerte) : 0
personnage sans voix propre (info): 0

=== dossier-reference.json ===
indice orphelin (bloquant)        : 0
goulot d'etranglement (alerte)    : 2   (sceau-brise-a-nouveau <- mira ; lettre-de-la-vigie <- selene)
lieu de depart desert (bloquant)  : 1   (depart=lieu.foyer-du-guet, present: AUCUN)
personnage sans presence (alerte) : 4   (mira, tobin, harek, aubry)
personnage sans voix propre (info): 5   (tous sauf corvin)
```

> **⚠ RÉCONCILIATION DE L'ORCHESTRATEUR** — ces deux lignes de goulot divergent de ma propre mesure, et la cause est identifiée : **ce script EXCLUT `monde.indices[].mene_a[]` de l'ensemble des producteurs.** Voir `mesure-fixtures.md` § 5. Les trois autres chiffres (1 bloquant départ, 4 sans-présence, 5 sans-voix) sont **confirmés à l'identique** par ma mesure indépendante.

Avec `construireAmorce()` (zéro personnage, zéro indice), les cinq règles sont silencieuses **sauf « lieu de départ désert » en implémentation naïve**, qui se déclenche **par vacuité**.

### 3. Couverture des KR

| KR | Test qui le garde |
|---|---|
| KR-217 | `'le rapport ne passe jamais par le canal errors ou warnings du validateur'` (grep source, déjà vert) |
| KR-219 | `'la section de chaque controle est declaree, jamais derivee du path'` — mais il ne discrimine QUE sur l'amorce ; **aucun des cinq nouveaux cas n'a de path dont le premier segment diffère de sa section**. Compté « gardé mais pas testé pour ces cinq règles » — réserve de revue, pas un veto |
| KR-221 | **Aucun test aujourd'hui** — proposé au critère 5 |
| KR-224 | **Aucun test possible** : il n'y a pas de graphe de lieux à interroger. Cohérent avec le renoncement acté, mais **personne ne vérifie qu'un futur ajout ne réintroduit pas cette moitié par erreur** |
| KR-164 | Pas de test dédié — critère de conception, indirectement protégé par le balayage `Object.keys(CONTROLES)` |
| KR-199 | `'tout constat rend un niveau declare par sa regle'`, déjà générique, s'étend **sans modification** |
| KR-197/202 | Garanti par construction aux critères 1, 2, 4, 5 |
| KR-175 | `'les quatre path sont des cles de DESTINATION_DES_CHAMPS'`, à généraliser au rapport complet |

### 4. KR-197/202 sur cinq règles

Minimum **6 corps de test nommés**, pas 5 : un par cause (5) **plus un** pour le vide vacant de « départ désert », qui est un **TROISIÈME état** — ni « déclenche » ni « ne déclenche pas sur une entité présente » — que le couple trigger/non-trigger ne couvre pas. **Sans ce sixième test, rien ne prouve que la garde de vide existe.**

Les tests génériques déjà en place s'étendent sans corps neuf : c'est ce qui garde le compte de **critères** à 8 malgré 5 causes — chaque critère porte DEUX assertions dans le MÊME test, patron déjà utilisé par it1. Le neuvième critère qui aurait nommé le vide séparément est **fondu dans le critère 3**.

### 5. REJETS nommés (→ § 8 du plan)

- **REJETÉ — utiliser `dossier-reference.json` comme dossier « calme » pour l'une des cinq règles.** Mesuré : il déclenche déjà 1 bloquant + 6 alertes + 5 infos. S'en servir romprait sans le dire la discipline actée et **produirait un test qui prouve le contraire de ce qu'il prétend prouver**.
- **REJETÉ — livrer « lieu de départ désert » sans garde explicite `monde.personnages.length > 0`.** Mesuré sur `construireAmorce()` : la version naïve se déclenche **par vacuité** sur tout dossier neuf, cassant le test à 4 contrôles et contredisant `design_contract.etat_vide`.
- **REJETÉ (conditionnel) — pointer le `path` d'« indice orphelin » sur `savoirs[].indice_id` sans exception motivée écrite.** Ce chemin est `ia` (mesuré, l. 261) ; `monde.indices[].id` (`moteur`, vérifié existant) résout la même règle **sans exception**.
