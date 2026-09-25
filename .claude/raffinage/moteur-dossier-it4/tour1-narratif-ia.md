# TOUR 1 — `narratif-ia` — `moteur-dossier` it4

```
RISQUE      — it4 supprime, dans le même commit, la seule implémentation de DEUX RÈGLES QUI NE SONT
              PAS DES RÈGLES D'ARBRE, et rend faux le document que le comité de la n° 10 lira comme
              oracle de ce que le runtime charge et importe. Les deux pannes sont MUETTES : tsc vert,
              aucune suite rouge. Une règle sans implémentation et une doc qui sur-affirme ne
              rougissent jamais (KR-258).
OBJECTION   — « les parties arbre de sessionEngine/actionEngine/usePlaySession » mélange deux
              familles. MESURÉ : `sessionEngine.ts:7  PE_PER_TRANSITION = 5` EST `REGLES-DU-JEU.md:43`
              (« changer d'écran/zone = +5 PE ») ; ses trois sites (sessionEngine:74,
              usePlaySession:138 et :221) partent tous → ZÉRO occurrence dans `src/` après it4, et
              `commande.aller` ne l'applique pas (`EtatSession` n'a pas de `heros` avant la n° 11,
              session.ts:117). Idem `defaultSessionFields` (REGLES-PLAY B3), consommée en
              sessionEngine:69 et persist.ts:25, les deux mourants. Le goal doit NOMMER les règles
              qu'il emporte et leur successeur.
              SECONDE OBJECTION : le critère 11 prend `EXIGENCE-APERCU-DU-JEU.md` pour oracle alors
              que sa l. 9 est déjà fausse — 6 fichiers non-test SURVIVANTS importent `brain/types.ts`
              (le cadrage en annonce 4), 1 importe `creatureTypes.ts`.
PROPOSITION — (1) les trois phrases de l'annexe entrent dans LE LOT QUI SUPPRIME `playExport.ts`,
              jamais dans un lot doc suivant ; (2) un bandeau § A de `REGLES-PLAY.md` nommant le
              propriétaire (n° 11) et le successeur (`commande.aller` — du CODE, jamais une phrase
              de narrateur) ; (3) plancher de `moteurSansIA.test.ts` re-dérivé PAR RACINE ;
              (4) consignation mesurée : 39 littéraux de prose joueur en code survivant, 10 défauts
              `rng = Math.random`, `graine_alea` sans lecteur.
VERDICT     — recevable sous réserve : (1) et (2) dans le périmètre d'it4. AUCUN VETO — it4
              n'appelle aucun modèle, ne produit aucune sortie IA, ne touche ni dés, ni stats, ni
              inventaire, ni XP.
```

## A. Contrat de sortie IA

**Néant, et c'est vérifiable.** it4 n'injecte rien, n'appelle aucun modèle, ne consomme aucune sortie.
L'instrument qui le prouve est `moteurSansIA.test.ts` (KR-250), dont le diff d'it4 doit rester **vert
sans être modifié pour compenser une suppression**, au même titre que la suite `tree-canvas`.

À consigner pour la n° 10 : **it4 est la dernière itération où « aucune génération de texte » vaut
pour TOUTE la surface de jeu.** La n° 10 ajoutera un appel modèle, probablement dans une quatrième
racine que le balayage ne couvre pas. Le fichier l'a déjà armé (l. 12-13).

## B. Le plancher de non-vacuité (20) suffit-il ?

**Non comme détecteur de RÉTRÉCISSEMENT, oui comme détecteur de VACUITÉ.** Mesure 2026-09-24 :
`src/player` 23 · `play-mode` 9 · `brain/dossier` 26 = **58**. La docstring l. 39 (« 47 ») est
**périmée de 11 fichiers AVANT la démolition**. Un plancher global de 20 sur une base de 58 tolère
une perte silencieuse de **65 %**.

Exigé — une constante, trois nombres, **zéro instrument neuf** : `PLANCHER_PAR_RACINE`, mesuré
post-it4, arrondi `floor(mesure / 5) × 5`, l'assertion par racine devenant `≥ plancher` au lieu de `> 0`.

## C. `docs/EXIGENCE-APERCU-DU-JEU.md` — amendement, et par quel lot

**Dans cette itération, et dans le LOT QUI SUPPRIME `playExport.ts`.** Précédent maison : it3 a mis
`docs/` dans son lot `contrat`. La phrase devient fausse à la seconde où le fichier part.

**Mesure qui précise le cadrage** (qui disait 4 fichiers) : `brain/types.ts` est importé par **6
fichiers non-test survivants** (`useCombat`, `actionEngine`, `combatEngine`, `combatTypes`,
`ReinforcementPicker`, `CombatScreen`) ; `creatureTypes` par 1 ; `monsterCapacities` par 3 —
**présent en l. 49, absent de la l. 9 : les deux listes du même document se contredisent déjà.**

**Phrase exacte imposée — remplacement intégral de la l. 9 :**

> **Isolation :** `src/player/` n'importe **aucune feature et aucun service** (`BookService`,
> `PersistenceService`, `DossierService`, `CopiloteService`). Il importe les fonctions pures `brain/`
> (`characteristics.ts`, `combat.ts`, `xp.ts`, `challenge.ts`, `equipment.ts`, `monsterCapacities.ts`,
> `creatureTypes.ts`) **et `brain/types.ts`**, dont il ne lit que les formes de créature et d'objet
> (`MonsterConfig`, `GameObject`, `CreatureType`) — mesuré à l'itération 4 de la n° 9 : six fichiers
> non-test l'importent. `brain/types.ts` est **à moitié le modèle d'arbre condamné** ; sa scission
> appartient au repointage de `tree-canvas`, différé après le Temps 2, et **pas** au runtime. Ces
> modules font partie du bundle extractible ; aucun n'importe de service, de persistance ni de
> composant. Depuis l'itération 4 de la n° 9, `src/player/` n'importe plus **`brain/tree.ts`**.

## D. « `AdventureDocument` est l'unique point d'entrée » (l. 49)

**Phrase exacte imposée — remplacement de la dernière phrase de la l. 49 :**

> **Le point d'entrée est le couple `Dossier` + `EtatSession`.** Le dossier est chargé **en lecture
> seule et gelé à l'ouverture** (décision n° 7) ; l'état de session est le seul objet qui bouge, et
> `ouvrirSession(dossier, { graine_alea })` en est la fabrique. `AdventureDocument` et
> `buildAdventureDocument` sont **supprimés** par l'itération 4 de la n° 9 : le runtime ne charge plus
> jamais un arbre de nœuds ni d'arêtes. **Entre cette itération et la n° 10, `src/player/` n'a aucun
> point de montage** — ses écrans de combat, de création de héros et de progression restent sur
> disque, sans consommateur, en attente d'être rebranchés sur `EtatSession`.

**Plus un bandeau en tête du document** (sept autres lignes deviennent fausses : l. 7, 11, 23, 26,
48, 50, 62 — toutes nomment `AdventureDocument`, `buildAdventureDocument`, `book-export` ou un nœud
`sommaire`), renvoyant leur réécriture à la **n° 15**. Une réécriture complète des § 2/3/6 dans it4
serait une seconde itération déguisée : **non demandée**.

## E. Ce qui meurt porte-t-il une règle du jeu ? (mesuré, fichier par fichier)

| Fichier supprimé | Règle en dur ? | Mesure |
|---|---|---|
| `NodeScreen.tsx` | **Non** | aucun nombre, aucun seuil |
| `ChoiceList.tsx` | **Non** | `1000` ms/tick et `remaining <= 5` = alerte visuelle. La règle A3 est écrite **deux fois ailleurs, survivantes** : `REGLES-PLAY.md:15` et `brain/tree.ts:68-76` |
| `DecorScreen.tsx` | **Non** | tout délégué à `actionEngine` (survivant) et `brain/` |
| `PnjScreen.tsx` | **Non** | `applyPnjGift` (`actionEngine:198`, survivant) porte la règle E4 |
| `TrapScreen.tsx` | **Non** | `resolveTrap` + `computeInventoryLoss` survivants |
| **`sessionEngine.ts`** | **OUI — DEUX** | `PE_PER_TRANSITION = 5` (l. 7) = `REGLES-DU-JEU.md:43` § Endurance / `REGLES-PLAY` A4+E3 ; `defaultSessionFields()` (l. 9) = `REGLES-PLAY` B3. Consommateurs : PE → `sessionEngine:74`, `usePlaySession:138`, `:221` ; défauts → `sessionEngine:69`, `persist.ts:25`. **Tous supprimés → zéro occurrence restante dans `src/`.** |

Les trois autres exports (`filterChoicesByPrereq`, `determinePhase`, `findSommaire`) sont des règles
**de forme arbre** : elles meurent légitimement. `PE_PER_TRANSITION` et `defaultSessionFields`, non —
elles s'appliquent à **tout** runtime, dossier compris.

**Phrase exacte imposée — bandeau en tête du § A de `docs/REGLES-PLAY.md` :**

> ⚠ **§ A — sans implémentation depuis l'itération 4 de la n° 9.** A1 à A5 décrivent la traversée du
> **modèle d'arbre** : ses consommateurs sont éteints, le modèle survit sur disque, et l'orchestration
> en vigueur est le **§ J**. **Deux règles citées ici ne sont PAS des règles d'arbre et restent dues** :
> **A4 / E3 — « changement d'écran ou de zone = +5 PE »** (`REGLES-DU-JEU.md` § 1, Endurance), et
> **B3 — équipement de départ**. Mesuré à l'itération 4 : elles n'ont plus **aucune** implémentation
> dans `src/`. **Propriétaire : la n° 11**, première à faire entrer `heros` dans `EtatSession`. **Le
> successeur de « changer d'écran ou de zone » est la commande `aller`** — un pas d'horloge accepté
> (§ J1). La récupération de PE est **du code déterministe appliqué par le moteur, jamais une phrase
> du narrateur ni une consigne de prompt.**

## F. Les orphelins — trois consignations (aucune ligne de code demandée)

1. **39 littéraux de prose joueur en français dans le code moteur survivant** — `capacityEffects.ts`
   (26 `text:`) et `combatEngine.ts` (13). C'est une **troisième source de prose**, celle que le comité
   d'it1/it2 a refusée. La n° 13 devra trancher : lignes **affichées** ou **ENTRÉE** du narrateur —
   jamais les deux.
2. **10 signatures survivantes à défaut `rng = Math.random`** (`actionEngine` 69/146/175,
   `combatEngine` 120/182/198/468, `heroGen` 21/37, `charCreation` 18) pendant que `graine_alea` n'a
   **aucun lecteur**. C'est le couple qui rend KR-242 non testable. it4 supprime les **deux seuls
   sites qui passent `Math.random` explicitement** (`TrapScreen:38`, `DecorScreen:75`) : après it4
   l'entropie n'est plus qu'un défaut de paramètre, dix fois.
3. **`REGLES-PLAY.md` § H (23 capacités) reste marqué « proposition, pas une règle officielle »**
   alors que `capacityEffects.ts` en implémente déjà une partie. Inversion du sens d'écriture de
   KR-130. Hors périmètre, à régler **avant** que la n° 13 écrive son premier prompt.

## G. Refus motivés — à recopier tels quels au § 8

> **REJETÉ (narratif-ia) — « l'amendement de `docs/EXIGENCE-APERCU-DU-JEU.md` part dans un lot documentaire distinct, ou après it4 ».** La phrase « `AdventureDocument` est l'unique point d'entrée » et la liste d'isolation de la l. 9 deviennent fausses **à la seconde** où `playExport.ts` est supprimé, et ce document est l'oracle que le critère 11 cite nommément **et** que le cadrage de la n° 10 lira pour concevoir son assembleur de contexte. Le lot qui rend une phrase fausse est celui qui la corrige — précédent it3 (`docs/` dans le lot `contrat`).

> **REJETÉ (narratif-ia) — « réécrire les § 2, § 3 et § 6 de `docs/EXIGENCE-APERCU-DU-JEU.md` sur le dossier d'aventure dans it4 ».** Sept lignes sont fausses au-delà de la l. 9 et de la l. 49 ; les réécrire est une itération à part entière et empiète sur la **n° 15**. Un bandeau de statut qui **nomme le propriétaire** coûte trois lignes et interdit la citation fautive.

> **REJETÉ (narratif-ia) — « `PE_PER_TRANSITION` et `defaultSessionFields` sont des parties arbre et partent sans mention ».** Mesuré : `PE_PER_TRANSITION = 5` est `REGLES-DU-JEU.md:43`, `defaultSessionFields` est `REGLES-PLAY` B3 ; ni l'une ni l'autre ne mentionne un nœud ou une arête, et toutes deux s'appliquent au moteur de dossier. Après it4 elles ont **zéro** implémentation dans `src/`. Une règle qui survit dans la doc sans implémentation **ni propriétaire nommé** revient toujours par le canal le moins cher — un prompt à la n° 13 — et c'est l'invariant « une règle vit à un seul endroit : le code » qui saute.

> **REJETÉ (narratif-ia) — « réimplémenter les +5 PE sur `commande.aller` dans it4 ».** `EtatSession` n'a pas de `heros` avant la n° 11 : l'implémenter ici obligerait à ouvrir la clé `heros` hors de son itération propriétaire, contre KR-249. On **nomme** le propriétaire, on ne code pas.

> **REJETÉ (narratif-ia) — « le plancher 20 de `moteurSansIA.test.ts` suffit après la démolition ».** Base mesurée : 58 fichiers non-test (23/9/26). Un plancher global de 20 tolère une perte silencieuse de 65 % et ne verrait pas disparaître une racine entière ; la docstring annonce encore 47, périmée de 11 **avant** la démolition. Re-dérivation **par racine**, `floor(mesure / 5) × 5`. Un instrument dont la base rétrécit en silence est une panne d'instrument, pas un résultat.

> **REJETÉ (narratif-ia) — « nettoyer dans it4 les 39 littéraux de prose des moteurs de combat survivants ».** Ils sont tenus par deux suites riches, n'ont aucun consommateur d'ici la n° 13, et le nettoyage rouvrirait `combatEngine.ts`/`capacityEffects.ts` hors périmètre. **Consignation mesurée, pas de travail** — la décision « affiché ou injecté » appartient à la n° 13.

## H. Décisions prises en autonomie faute de spécification

- **Qui amende `EXIGENCE-APERCU-DU-JEU.md`** → le lot qui supprime `playExport.ts`, même commit → si l'inverse, le document ment pendant au moins un commit et c'est celui-là que lit le cadrage de la n° 10 : un assembleur de contexte conçu contre `AdventureDocument`, à refaire.
- **Ampleur de l'amendement** → deux phrases exactes + un bandeau, **pas** de réécriture des § 2/3/6 → si l'inverse, it4 gagne un lot documentaire de la taille d'une itération et empiète sur la n° 15.
- **Sort de A4/E3 (+5 PE) et de B3** → la règle reste dans `REGLES-DU-JEU.md` (intouchée), l'implémentation est déclarée **due**, propriétaire n° 11, successeur `commande.aller` → si rien n'est écrit, la règle réapparaît en consigne de prompt à la n° 13 ou sous une seconde constante : deux sources de vérité pour une arithmétique de jauge.
- **Forme du durcissement de `moteurSansIA.test.ts`** → planchers par racine, aucun instrument neuf → si on garde 20, la suppression d'une racine entière passe verte.
- **Prose en dur et `rng` par défaut** → consignation mesurée, zéro ligne de code → si on traite maintenant, it4 rouvre deux fichiers de règles hors de sa cible.
- **Statut du § A de `REGLES-PLAY.md`** → bandeau, section **conservée** → si on supprime le § A, on perd la spécification écrite du modèle que la décision n° 5 conserve.
