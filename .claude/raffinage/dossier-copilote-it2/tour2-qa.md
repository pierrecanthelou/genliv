# Tour 2 — `qa` · `dossier-copilote` it2

```
RISQUE      — Le cas de recette PASSANT n'est instanciable NULLE PART sans un
              geste explicite. MESURÉ (rejeu jest + sonde jetable, supprimée) :
              controles.test.ts l.1143-1147 est vert, un seul constat
              `indice.trace-du-guet → alerte`, et ce même indice a `verite`
              ET `formulation_joueur` VIDES. Or narratif-ia §6 exige `verite`
              REQUIS (refus `a-ecrire`, aucun fetch). Donc l'UNIQUE cible que
              l'écran peut proposer déclenche un refus AVANT tout appel — ni
              le lot contrat (mesure de M dans contexte.test.ts) ni le lot
              feature (recette bout-en-bout) ne peuvent démontrer le chemin
              `propose` sur la fixture telle quelle. C'est un trou de
              testabilité, pas une hypothèse.

OBJECTION   — La proposition PM « un candidat par appel » (tour1 §2) est
              incompatible avec le contrat déjà écrit par TROIS rôles (TL :
              `DetenteurRendu[]` ; narratif-ia : `PROPOSITIONS_MAX=3` ; UX : N
              `LigneDetenteur`) et avec MES témoins de pouvoir séparateur
              (liste à ≥2 items, item[1] seul cassé) qui n'ont plus d'objet
              sur un singleton.

PROPOSITION — (1) Chaque lot écrit SA PROPRE fonction locale
              `cloneReferenceAvecTraceDuGuetRedigee()` (5 lignes,
              `fs.readFileSync` du même JSON que `cloneReference()`,
              n'ajoute QUE `verite`+`formulation_joueur`) — MESURÉ : ça ne
              change PAS le constat `indice-sans-source`. (2) Motif à DEUX
              valeurs (`schema`/`rang-inconnu`), pas une — testable et déjà
              latent dans mes témoins tour1. (3) Liste vide = succès
              testable et PLUS discriminable qu'un `illisible` générique.

VERDICT     — recevable sous réserve : la fixture de recette et les deux
              motifs doivent être écrits nommément au plan (§7 ci-dessous).
```

---

## ANNEXE

### 1. Réponse nommée à une objection hors domaine

**PM (tour 1, PROPOSITION 2, « un candidat par appel »)** — REJETÉE de mon poste. Trois rôles ont convergé indépendamment sur une anatomie **liste**. Basculer sur un singleton casserait ce travail et rendrait vides deux de mes quatre témoins de pouvoir séparateur du tour 1 (déduplication de rang, item[1] seul cassé — aucun sens sur une liste à 1). Testabilité et convergence à 3 voix contre 1 : je vote pour l'anatomie liste, contre PM.

### 2. Statut du veto et des 4 propositions du tour 1

**Veto** (« aucun critère ne nomme le RANG ni son refus ; lot non défini pour un tableau ») — **LEVÉE**. Les trois conditions posées :
- RANG = jeton-chaîne fermé, validé par appartenance : **acquis** (TL A.2 + narratif-ia R2, convergence totale) ;
- « lot » redéfini pour un tableau, refus entier jamais filtré ligne à ligne : **acquis en principe** (TL-6 + narratif-ia § 6/§ 7) — le témoin ≥2-items reste à ÉCRIRE, nommé au § 7, donc plus une réserve ouverte mais une ligne de plan ;
- sort du scanner anti-identifiant tranché : **acquis** — la forme gagnante (tableau de chaînes nues) n'a AUCUN champ de prose, donc `porteUnIdentifiant`/`FORME_LACHE_IDENTIFIANT` **n'entre pas** dans `validerDetenteurs` ; à écrire noir sur blanc au plan (précédent « CE QUE LE BALAYAGE NE COUVRE PAS » de `couverture.test.ts`), pas un test, une note.

Le veto se convertit en **exigence de plan nommée**, pas en blocage persistant.

**Les 4 propositions du tour 1** :
1. RANG = énumération fermée de chaînes — **MAINTENUE**, consensus à 2 rôles.
2. Témoin ≥2 items, seul item[1] cassé — **MAINTENUE**, reformulée pour la forme bare-string-array (§ 4, test #6).
3. Refus RÉEL de `validateDossier` sur un `Savoir` orphelin par course — **MAINTENUE**, nommée § 4 test #15, toujours atteignable (`tables.ts:282`, `REFERENCES_SIMPLES`).
4. `frontiere.test.ts` en `describe.each(Object.keys(INVITES))` — **MAINTENUE mais CONDITIONNÉE** : ne fonctionne que si (a) `RoleCopilote` et les clés de `INVITES`/`GABARIT_SORTIE` utilisent LE MÊME littéral pour le second rôle — **MESURÉ : TL écrit `'indice-detenteurs'`, narratif-ia écrit `'personnage-detenteurs'` — divergence non résolue, à trancher avant l'essaim, sinon `Object.keys(INVITES)` et le type `RoleCopilote` ne s'accordent pas et mon canari ne compile pas** ; (b) `GABARIT_SORTIE` prend la forme **deux constantes nommées** (TL, option a) et non le `Record` que le brouillon § 5 de narratif-ia esquisse — un `Record` casse le regex ancré `^(?:export )?const GABARIT_SORTIE = '(.+)'$` actuel (aucune correspondance, `toHaveLength(1)` rouge **par vacuité**, pas par le bon motif) et rend le canari croisé demandé par narratif-ia § 5.3 impossible à écrire tel quel. Je recommande la forme TL pour cette seule raison de testabilité — **narratif-ia devrait trancher entre son texte et son schéma, qui se contredisent.**

### 3. Réponses aux points assignés

- **C2 (liste vide)** — je tranche pour **narratif-ia : succès légal**, jamais un motif `'vide'`. Discriminabilité supérieure : `propose`/`{detenteurs:[]}` est une branche STRUCTURELLEMENT différente d'`EchecCopilote`, donc un test sur `statut` suffit à distinguer les deux SANS ambiguïté ; ranger un tableau vide dans `illisible` forcerait le MÊME texte générique pour « le modèle a menti sur la forme » et « le modèle a honnêtement dit personne » — recul net sur le critère 3.
- **Granularité du motif** — DEUX motifs (`schema`, `rang-inconnu`), jamais un seul `'rang'` fourre-tout. Vérifié : mes cinq cas fautifs du tour 1 se répartissent SANS RESTE sur cette partition — les quatre premiers sous `schema` (forme), le cinquième sous `rang-inconnu` (les détenteurs actuels sont exclus de la table PAR CONSTRUCTION). Testabilité : deux fixtures DISJOINTES et triviales (`["P1","P1"]` vs `["P9"]` avec `rangsConnus={P1,P2,P3}`) — le collapse en un seul motif (TL) perd la capacité de LOCALISER un mutant qui casserait spécifiquement l'appartenance.
- **C1 (certitude)** — je penche pour **narratif-ia : le modèle ne rend PAS la certitude**, `{"detenteurs":["P1","P2"]}` nu. Raison de mon domaine : `atteignabilite.ts` l. 328 prouve que `certitude` NE DÉCIDE DE RIEN dans `indice-sans-source` — donc AUCUN test downstream ne peut jamais distinguer un choix correct d'un choix halluciné. Un critère qui promettrait « le modèle choisit la bonne certitude » serait **non observable par construction, veto de mon poste** si le comité le maintenait.
  - **Témoins fautifs à ÉCRIRE pour la forme gagnante** : (a) validateur `.some()` au lieu de `.every()` — témoin `["P1","P9"]`, `rangsConnus={P1,P2,P3}` ; (b) appartenance testée par FORME (regex `/^P[1-8]$/`) au lieu de la table RÉELLE de ce lancer — témoin `rangsConnus={P1,P2,P3}` + sortie `["P5"]`, forme légale mais hors table de CE lancer ; (c) déduplication adjacents-seulement — témoin `["P1","P2","P1"]` ; (d) liste vide non branchée explicitement — `{"detenteurs":[]}` doit rendre `ok:true` explicitement ; (e) conversion numérique résiduelle — témoin `"P1"` (NaN en nombre) qui DOIT passer par `Set.has`, jamais par une comparaison numérique.
  - Si le comité maintenait `{rang,certitude}` : mes 4 témoins du tour 1 restent valides **sans changement**.
- **C11 (source du cas de recette)** — **PAS un fichier de fixture nouveau, un clone en mémoire local à chaque lot** : `cloneReferenceAvecTraceDuGuetRedigee()`, 5 lignes, dans `src/brain/copilote/contexte.test.ts` (lot 1) ET dans `src/features/dossier-copilote/tests/detenteurs.test.ts` (lot 2), chacune sa propre copie (propriété de fichiers disjointe). **MESURÉ aujourd'hui** (sonde jetable, supprimée) : ajouter SEULEMENT `verite`+`formulation_joueur` à `indice.trace-du-guet` ne change PAS le constat `indice-sans-source` (`['indice.trace-du-guet → alerte']`, identique, `jouable` inchangé) — la mutation est chirurgicale, sans effet de bord.
- **C5 (non-régression `destinations.ts`/`types.ts`)** — MESURÉ : un seul test existant verrouille une propriété liée, `couverture.test.ts › « les TROIS champs d un indice portent leur destination exacte, dans les DEUX fixtures »` (rejoué : **1 passed**). Il épingle `DESTINATION_DES_CHAMPS['monde.indices[].verite'] === 'ia'` (la VALEUR, inchangée par R1) — **il ne lit AUCUN texte de commentaire/JSDoc**. Aucun instrument du dépôt ne teste le contenu de la condition d'état réécrite : à écrire dans « Non vérifiable en l'état ».
- **C9 (les 4 bornes liées)** — MESURÉ : `frontiere.test.ts › describe('les deux plafonds sont compatibles')` est le témoin de LIAISON existant (3 tests) — aujourd'hui câblé sur `ROLE='personnage-prose'` et un budget scalaire (confirmé en lisant `enveloppe()` l. 256-258 : corps figé avec un `champ` de prose). Il doit devenir `describe.each(Object.keys(INVITES))`, chaque itération construisant SA propre enveloppe. `max_tokens`/`CANDIDATS_MAX`/`PROPOSITIONS_MAX`/budget n'ont **PAS** de témoin de liaison croisée aujourd'hui — à écrire au lot contrat.
- **Canari croisé KR-236** — constructible **seulement** si `GABARIT_SORTIE` prend la forme deux-constantes-nommées ; non mesurable tant que ce choix n'est pas fait.
- **C3 (nom du rôle)** — touche mon domaine : la divergence empêche d'écrire noir sur blanc le test #1 (`describe.each`). À trancher avant l'essaim, sinon un ouvrier choisit seul et mon canari nommé devient faux dès l'écriture.

### 4. Tests nommés — § 7 du plan

| # | Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|---|
| 1 | `frontiere.test.ts › deux constantes nommées, un par rôle` | pour chaque rôle de `Object.keys(INVITES)`, un littéral identique côté worker et brain | contrat | KR-236 | contrat |
| 2 | `frontiere.test.ts › canari croisé` | intervertir les deux gabarits entre rôles fait rougir | contrat | KR-236 | contrat |
| 3 | `frontiere.test.ts › les deux plafonds (describe.each)` | pire cas d'octets ≤ `TAILLE_MAX_CORPS_IA` par rôle ; canaris −1Ko/+400 séparateurs sur le rôle le plus large | contrat | garde d'octets | contrat |
| 4 | `contexte.test.ts › BUDGET par rôle` | `['indice-detenteurs'] = ceil(M×3/1000)×1000`, M mesuré sur le clone enrichi ; `['personnage-prose']` inchangé (6000) | unitaire | non-régression | contrat |
| 5 | `schemaSortie.test.ts › liste vide = succès` | `validerDetenteurs({detenteurs:[]}, rangsConnus)` → `{ok:true, detenteurs:[]}` | unitaire | **vide** | contrat |
| 6 | `schemaSortie.test.ts › item[1] seul cassé rejette le lot entier` | `["P1","P9"]`, rangsConnus={P1,P2,P3} → `{ok:false, motif:'rang-inconnu'}`, jamais `['P1']` | unitaire (pouvoir séparateur, BUG-087) | KR-235 | contrat |
| 7 | `schemaSortie.test.ts › doublon non adjacent` | `["P1","P2","P1"]` → `{ok:false, motif:'schema'}` | unitaire | **doublon** | contrat |
| 8 | `schemaSortie.test.ts › rang de forme légale hors table réelle` | `rangsConnus={P1,P2,P3}`, `["P5"]` → `{ok:false, motif:'rang-inconnu'}` | unitaire | **hors bornes** | contrat |
| 9 | `CopiloteService.test.ts › cible incompatible ne compile pas` | `@ts-expect-error` | contrat (type) | TL-1/TL-2 | contrat |
| 10 | `contexte.test.ts › le clone enrichi ne change pas le constat` | `controlerDossier(clone)` filtré = `['indice.trace-du-guet → alerte']`, identique à la baseline | unitaire/fixture | C11 | contrat + feature (copies locales) |
| 11 | `couverture.test.ts › les TROIS champs d un indice…` (REJOUÉ, non modifié) | `DESTINATION_DES_CHAMPS['monde.indices[].verite']==='ia'` inchangé | garde externe | C5, R1 | aucun |
| 12 | `contexte.test.ts › DEROGATIONS_AUDIENCE est vide` (REJOUÉ) | reste `[]` | garde externe | résolue n° 2 | aucun |
| 13 | `detenteurs.test.ts › vide-mais-réussi affiche le bon texte` | `TEXTE_AUCUN_DETENTEUR_TROUVE`, discriminé des 4 textes it1 + des nouveaux | composant | critère 3 | feature |
| 14 | `detenteurs.test.ts › acceptation pose CERTITUDE_INITIALE` | `Savoir.certitude === CERTITUDE_INITIALE`, importé | composant/contrat | R3, résolue n° 9 | feature |
| 15 | `detenteurs.test.ts › référence orpheline par course` | indice supprimé entre proposition et acceptation → `validateDossier(...).ok===false`, `reference-pendante` | bout-en-bout | **référence orpheline** ; critère 4/5 | feature |
| 16 | `detenteurs.test.ts › Annuler pendant l appel` | ferme sans écrire de décision | composant | **annulation** | feature |
| 17 | `detenteurs.test.ts › double clic Lancer` | `demanderDetenteurs` appelé 1 seule fois | composant | **double soumission** | feature |
| 18 | `detenteurs.test.ts › gel de la proposition` | la carte ne change pas de cible si l'indice quitte les constats en cours de flux | composant | TL § C | feature |
| 19 | `detenteurs.test.ts › texte trop-long spécifique au rôle` | motif `'trop-long'` affiche un texte DISTINCT de `TEXTE_REFUS_TROP_LONG` | composant | **très long** ; TL G.7 | feature |
| 20 | `controles.test.ts` (REJOUÉ, non modifié) | suite intégrale verte, `git diff --stat` vide sur ce fichier | non-régression | fichiers hors-lot | revue mode B |

### 5. Non vérifiable en l'état

- Le TEXTE de la condition d'état réécrite à `destinations.ts`/`types.ts` (R1) — seule la VALEUR d'audience est gardée par un test, jamais la prose. Revue humaine seule.
- Le taux de complaisance / qualité réelle de désignation du modèle (KR-229) — aucun instrument.
- La qualité sémantique d'un choix de `certitude` si le modèle le rendait malgré le REJETÉ — `atteignabilite.ts` prouve qu'aucun test downstream ne peut l'observer.
- Le remontage du panneau à la navigation (validité de la consommation d'`estDisponible`) — non mesuré par personne, y compris moi.
- `max_tokens=100` et `CANDIDATS_MAX=8` : dérivés par formule, non mesurés sur le dossier réel avant le lot contrat.
- L'effet du linter secondaire `revelation-sans-porte` sur un `Savoir` accepté sans `revele_si` — aucun instrument ne dira si c'est voulu.

Aucun fichier du dépôt modifié ; sondes jetables écrites et supprimées avant cette note.
