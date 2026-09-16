# Tour 1 — qa — dossier-controles it7

RISQUE — la table de productibilité a une **asymétrie non tranchée par le cadrage** : `jalon_atteint` / `evenement_consomme` portent leur PROPRE `declencheur_expr` (racine « réputée amorçable », doctrine H2, vérification différée à it8) alors que `possede_objet` / `indice_connu` / `pnj_a_revele` n'existent QUE par une arête explicite. **Mesuré sur `dossier-reference.json`** : `objet.sceau-de-cendre` (visé par `objectif.proteger-le-sceau`) n'a **AUCUN `donner_objet`** nulle part. Si la règle exige une arête pour `possede_objet` (cohérent avec le traitement des indices), `objectif-sans-chemin` allume BLOQUANT sur une fixture lue par 8 suites et épinglée exactement par « le calme des deux fixtures et du dossier neuf ne bouge pas ».

OBJECTION — `canon-sans-objectif` allumera sur TOUT dossier neuf (`amorce.ts` sème `objectifs: []`, `DossierService.create()` en dépend directement). Ceci contredit l'AC encore actif du plan (« quatre lignes … aucune ligne portant sur une collection vide ») — non repéré comme superseded dans `resolved_decisions`.

PROPOSITION — avant le lot contrat : exécuter la table de productibilité contre les DEUX fixtures réelles (pas contre une fixture jetable) et consigner le verdict par prédicat référencé ; si `sceau-de-cendre` reste sans producteur, **corriger la fixture** (un `donner_objet` de plus) dans CE lot, **jamais laisser le test rougir puis l'assertion s'ajuster dessus**. Réécrire l'AC « quatre lignes / aucune collection vide » dans le même lot que le code, pas après.

VERDICT — recevable sous réserve : les deux points ci-dessus doivent être tranchés et mesurés AVANT le lot contrat, pas découverts à l'essaim.

---

# ANNEXE

## Relevé n° 1 — les deux fixtures partagées

Résultat brut :

- `dossier-minimal.json` → **1 objectif** (`objectif.refermer-le-sceau`), `reussi_si_expr` = `ET(jalon_atteint(jalon.premiere-nuit), NON(evenement_consomme(evenement.embuscade-du-fanal)))`.
- `dossier-reference.json` → **2 objectifs** : `objectif.reveler-la-vigie` = `ET(lieu_visite(lieu.vigie-du-nord), jalon_atteint(jalon.premiere-vigie))` ; `objectif.proteger-le-sceau` = `possede_objet(objet.sceau-de-cendre)`.

Recherche des producteurs (parcours JSON des champs `delta`) :

- `dossier-minimal.json` : `atteindre_jalon` cible EXACTEMENT `jalon.premiere-nuit` (productible) ; `evenement.embuscade-du-fanal` EXISTE dans `monde.evenements`.
- `dossier-reference.json` : le SEUL `atteindre_jalon` cible `jalon.second-guet`, **PAS** `jalon.premiere-vigie` (qui existe toutefois dans `charpente.jalons`). Le SEUL `donner_objet` cible `objet.amulette-scellee`, **PAS `objet.sceau-de-cendre`** — celui-ci existe dans `monde.objets` mais n'est ciblé par **AUCUN `donner_objet` ni aucune autre arête**. Aucun champ d'inventaire initial dans `Objet` / `Personnage`.

**Conclusion mesurée** : `canon-sans-objectif` reste silencieux sur les deux fixtures. `objectif-sans-chemin` dépend ENTIÈREMENT de la définition de « producteur » retenue pour `possede_objet` : si elle exige une arête, `dossier-reference.json` bascule d'un rapport calme à un `objectif-sans-chemin` BLOQUANT neuf — **régression n° 1 confirmée comme risque réel, pas hypothétique**.

## Relevé n° 2 — le dossier neuf

`DossierService.create()` appelle `construireAmorce` ; `amorce.ts:107` : `objectifs: []`. Donc **`canon-sans-objectif` allume BLOQUANT sur 100 % des dossiers neufs**.

Impact mesuré sur les tests existants :

- `controles.test.ts:551-568` (« parSection porte les dix sections ») : `expect(rapport.parSection.canon).toBe('alerte')` (l.567) devient FAUX — `canon` bascule à `'bloquant'`, `amorce-non-redigee` y émettant déjà 3 alertes.
- `controles.test.ts:1207-1256` (« le calme des deux fixtures et du dossier neuf ne bouge pas ») : le tableau exact `neuf.controles` (l.1222-1227, 4 lignes) devra gagner une **5ᵉ** ligne. `neuf.jouable` reste `false` (déjà faux via l'amorce), donc cette assertion-là ne bouge pas.
- Tension avec `plan.acceptance_criteria[0]`, toujours actif : « … alors il y lit quatre lignes … et aucune ligne portant sur une collection vide » — directement contredit par le goal. **Doit être réécrit dans ce lot.**

## Relevé n° 3 — l'invariant KR-226

`controles.test.ts:398` : `NEUVES: Record<Exclude<ControleId,'amorce-non-redigee'>, Dossier>` — actuellement **5 témoins**. Ajout de 2 IDs → `tsc` EXIGE 2 entrées de plus **avant compilation** (garde par compilation, confirmée). La boucle l.420-424 applique alors, pour chaque constat des 2 règles neuves, `expect(path.split('.')[0] !== section).toBe(true)` — avec `section: 'canon'` et `path` en `canon.objectifs[]…`, `split('.')[0]` vaut `'canon'` === `section` → attend `true`, obtient `false` → **ROUGE, EN ÉTANT JUSTE**.

Balayage de source : `controles.ts` ne contient AUCUN `split('.')` (l.1204 du test). **Cette garde-là n'est PAS affectée par it7** et continue de couvrir `canon` sans modification — c'est le test l.421, dans le fichier de TEST, qui doit être réécrit, jamais la garde de source.

`TEMOINS: Record<ControleId, Dossier>` (l.438) — également total par compilation, exige 2 témoins de plus, mais **sans** le prédicat `split('.')` : pas de conflit KR-226 sur celui-ci.

## Relevé n° 4 — instruments qui balaient `CONTROLES` totalement

1. `controles.test.ts:398-426` — `NEUVES` total par compilation. **DOIT être réécrit** (KR-226).
2. `controles.test.ts:428-466` — `TEMOINS` total par compilation. 2 témoins de plus, aucune réécriture structurelle.
3. `controles.test.ts:468-498` — discriminance par comptage (`new Set(...).size === Object.keys(CONTROLES).length`, l.488) sur un tableau `rapports` assemblé À LA MAIN : les 2 règles neuves doivent y être ajoutées ou le test rougit **par sous-représentation**.
4. `controles.test.ts:551-568` — `calmes.toHaveLength(8)` et `parSection.canon === 'alerte'` : la seconde casse presque certainement.
5. `controles.test.ts:1207-1256` — pin exact par dossier. Impactée à coup sûr sur `neuf`, potentiellement sur `reference`.
6. `controles.test.ts:1258-1312` (« les six regles ecrivent le meme registre de langue » → « les huit ») — même discriminance par comptage sur un tableau assemblé à la main ; plus vérifier `TERMES_INTERDITS` contre le vocabulaire des messages neufs.

## Critères d'acceptation exigés (8 max)

1. Étant donné un clone de `dossier-minimal.json` avec `canon.objectifs = []`, quand `controlerDossier` est appelé, alors un BLOQUANT `canon-sans-objectif` est produit en section `canon` et `jouable` est faux. — *unitaire.*
2. Étant donné `DossierService.create()` (dossier neuf réel), quand le rapport est calculé, alors `canon-sans-objectif` est présent et `parSection.canon` vaut `'bloquant'` — et l'AC « quatre lignes / aucune collection vide » est réécrit **dans ce même lot**. Non-régression NOMMÉE : `controles.test.ts:1207` et `:551`, toutes deux mises à jour, jamais laissées rouges.
3. Étant donné deux objectifs dans un même clone — l'un référençant `possede_objet(X)` où X n'est ciblé par aucun `donner_objet`, l'autre `possede_objet(Y)` où Y l'est — quand le rapport est calculé, alors seul le premier produit `objectif-sans-chemin` BLOQUANT. — *unitaire, KR-197/202.*
4. Étant donné un objectif référençant `lieu_visite` / `lieu_courant_est` sur un lieu non cité ailleurs, quand le rapport est calculé, alors aucun contrôle n'est produit sur ce prédicat (KR-224). — *unitaire.*
5. Étant donné la table de productibilité, quand un test la compare à `PREDICATES`, alors les 7 identifiants y sont tous représentés (KR-199) — *unitaire, même geste que le balayage existant de `SITES_AVERTISSEMENT`.*
6. Étant donné `NEUVES` après ajout des 2 règles (section `canon`, path `canon.*`), quand le test « section jamais dérivée du path » tourne, alors son prédicat est réécrit pour ne plus être insatisfiable sur `canon` (KR-226) et reste vert. — *unitaire.*
7. Étant donné `validate`, `couverture`, `suffisance`, `amorce`, `roundtrip`, quand l'itération est livrée, alors ils restent verts SANS modification de leurs assertions (KR-217). — *porte de commit.*
8. Étant donné `dossier-reference.json`, quand le rapport est calculé après l'ajout des 2 règles, alors le résultat mesuré est explicitement tranché et, si un constat neuf apparaît, **la fixture est corrigée dans LE MÊME lot** plutôt que le test ré-aligné dessus. — *unitaire.*

Mon veto ne porte que sur : l'AC n° 1 du plan encore actif et non réconcilié avec le goal, et l'absence d'un mesurage exécuté de la productibilité contre les fixtures réelles avant l'écriture du code — ce que ce tour 1 vient de fournir.
