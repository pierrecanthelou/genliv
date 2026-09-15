# Tour 2 — `tech-lead` (contre-lecture)

## 0. Déclaration préalable — toujours aucun exécuteur

Le brief annonçait un Bash et un run `npx jest`. **Le jeu d'outils réel de ce poste est `Read`/`Grep`/`Glob` — aucun exécuteur, aux DEUX tours.** Conséquence appliquée sans exception : chaque affirmation de couleur est étiquetée `[DÉDUIT DE LA FORME]` — assertion lue ligne à ligne + donnée de fixture déjà mesurée. *C'est le poste à effort élevé qui produit le découpage, et c'est celui qui mesure le moins.*

## 1. Contre-lecture

**1.a — à l'UX** (« les cinq règles doivent se taire *par construction* sur une collection vide, pas par une garde ajoutée à la main ») : **recevable sur quatre règles, infondée sur la cinquième, et il faut le dire, pas l'arrondir.** « Départ désert » porte sur **la collection**, pas sur ses éléments — et *un prédicat universel sur l'ensemble vide est VRAI*. C'est de la logique, aucune reformulation ne la contourne. La garde est **obligatoire et assumée** ; ce que l'UX demande se paie autrement, par le **motif écrit** et par le **test du troisième état**. Prétendre cette garde « mécanique » serait le genre de motif faux que BUG-080 a coûté.

**1.b — à la QA**, sur son critère 8 (« les cinq suites restent vertes sans modification ») et son § 4 (« le balayage générique s'étend sans modification ») : **les deux sont faux, et le second est le trou le plus cher du tour 1 — personne ne l'avait vu, moi compris.** `controles.test.ts` l. 179 assert `constats.length > 0` pour **CHAQUE** entrée du registre **sur un dossier fraîchement semé**. Or `construireAmorce` sème `personnages: []`, `indices: []` : les quatre règles neuves y sont muettes **par conception**, et « départ désert » l'est **par la garde que tout le comité réclame**. **Le test échoue quatre fois** — et il échouerait même sans la garde.

Ce n'est pas une réparation, c'est un **gain à prendre** : un `Record<ControleId, Dossier>` **TOTAL par compilation** (même geste que `PROSES_AMORCE`). Effet permanent : toute règle future **ne compile pas** tant que son auteur n'a pas exhibé un dossier qui la déclenche. Le balayage cesse de dépendre du hasard qui voulait que l'unique règle d'it1 tire sur le dossier semé.

**1.c — à la QA encore, et il casse ma propre annexe de tour 1** : « l'itération ne touche AUCUNE autre feature » est **FAUX**. `dossierEditorScreen.test.tsx` l. 337 injecte `{ id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [] }` — **ni `presence`, ni `caractere`**. `personnage-sans-presence` tire donc une ALERTE, `badgeSection` rend `'1 fiche · ALERTE'` en **UN SEUL nœud**, et `getByText('1 fiche')` (correspondance exacte) ne trouve plus rien. **La borne `portee === 'premier'` n'y changerait rien** : ce personnage EST `'premier'`.

Les **huit autres** tests du fichier survivent — lus un par un, tous partent de `dossiers.create()`. **Correctif prescrit : compléter le LITTÉRAL, pas l'assertion.** L'inverse accrocherait un test de `bascule-editeur` au **jeu de règles de `dossier-controles`** — couplage inter-features par assertion, qui rougirait à chaque règle future. Refusé.

**1.d — au narratif** (« la fixture est incomplète, la règle a raison ») : je le suis, **et j'ajoute la conséquence mécanique qu'il n'a pas eu à voir** — cette même incomplétude vient de faire tomber le test ci-dessus. Le dépôt a **deux** dossiers de personnages sans présence : la fixture de référence *et* le littéral d'un test voisin. Les deux disent la même chose, et c'est précisément la valeur de la règle.

## 2. Statut de mes huit rejets

| # | Objet | Statut |
|---|---|---|
| R-1 | Deux entrées pour orphelin + goulot | **MAINTENU**, renforcé par la mesure du trou de la formulation concurrente |
| R-2 | La fixture d'exercice locale (N) | **MAINTENU**, et moins cher : le `Record` fabrique les témoins **dans le test** |
| R-3 | `atteignabilite.ts` à it3 | **MAINTENU**, désaccord **INFIRMÉ** (§ 3.C) |
| R-4 | Ajouter des clés à `DESTINATION_DES_CHAMPS` | **MAINTENU — vérifié de ma main ce tour** : `couverture.test.ts` l. 540-546, un chemin s'arrêtant sur un tableau n'est pas une feuille de fixture → ligne morte → rouge |
| R-5 | Dériver la `section` du `path` | **MAINTENU** ; B-4 en est la deuxième démonstration |
| R-6 | Abaisser « indice orphelin » | **MAINTENU**, et je **RETIRE mon amendement** au profit de celui du narratif : le sien est plus général et porte un discriminant constatable. *Deux formulations pour un arbitrage, c'est une de trop.* |
| R-7 | Garde de vacuité | **MAINTENU** — accord des cinq rôles, plus rien à débattre, **tout à écrire**. J'ajoute une **troisième garde** que personne n'a nommée (§ 4.C) |
| R-8 | Ne pas intégrer le clic de ligne | **MAINTENU, durci sur sa moitié droite** |

**Aucun veto** : aucun de mes rejets ne porte sur un import inter-features, un contournement de contrat `brain/`, une duplication de la source de vérité ni une propriété de fichiers partagée.

## 3. Les points appelant ma position

**3.A — B-1, la forme exacte du compteur.** Un seul parcours, un seul compteur, deux seuils, **aucun trou** :

```ts
const nombre = producteurs.get(indice.id)?.length ?? 0   // absent de la Map = ZÉRO
if (nombre >= 2) continue
const niveau = nombre === 0 ? 'bloquant' : 'alerte'
```

Trois points non devinables : le **`?? 0`** (sans lui `undefined.length` ferait **lever** une fonction pure et totale) · le **`message`** dispatche sur le **niveau** lui aussi, pas seulement la `remediation` (table `Record<'bloquant'|'alerte', …>`, **jamais** `Record<NiveauControle, …>`) · repli **chaîne vide**, un appelant pouvant tenir un `Controle` **forgé**.

**Et il faut dire le prix, parce qu'il est réel** : c'est CE choix, et lui seul, qui fait basculer la ligne de base. Sous la formulation à deux branches, le clone intact resterait calme. **Le compteur unifié coûte la réécriture de six assertions et achète la fermeture du trou.** À ce prix-là il faut le payer — mais on ne le présente pas comme gratuit.

**3.B — B-4 : `depart`, et l'UX garde son `localiserEntite`.** `lieux` est refusée **sur le terrain propre de l'UX, la navigabilité** : les deux remèdes sont ailleurs (Personnages → Présence, ou `charpente.depart.lieu_id`), donc router le BLOQUANT vers `lieux` allume un rouge sur une section qui n'offre **aucun geste** — un cul-de-sac. Et c'est la règle de mes deux autres entrées appliquée une troisième fois : la `section` nomme **l'entité qui subit l'absence** ; ici c'est le **départ**, pas le lieu, qui se porte très bien. **Ce que l'UX conserve intégralement : son `location`.** `section` et `location` sont **deux champs différents** de `ConstatControle` ; la note UX les traite comme un seul.

**3.C — B-6 : le désaccord N'EXISTE PAS.** Le rejet n° 6 du narratif refuse *deux parcours* ; **je refuse la même chose** — R-3 dit littéralement « it5 EXTRAIT l'index privé, elle ne le ré-implémente pas ». Ni sa position ni la mienne ne produit jamais plus d'un parcours. Ce qui reste est **une charge et sa garde**, pas un désaccord : le nom `producteursParIndice` **figé dès maintenant** (un déplacement se relit en diff, une réécriture sous un autre nom passe inaperçue), et une **garde de source** mécanique (un seul site filtrant `delta === 'reveler_indice'` dans `brain/dossier/`) — relevé fait : **verte avant d'être écrite**, donc elle mesure bien la propriété neuve.

**3.D — B-7 : je RETIRE la saturation. Par ma propre règle.** J'ai construit le clone qui la falsifie, et c'est lui qui m'a fait changer d'avis : le seul cas séparateur est un cycle sans autre source, et le fabriquer depuis `dossier-minimal.json` exige **quatre champs mutés** (ajouter l'arête retour, retirer le savoir d'Aldûr, vider les deux deltas). *Un test à quatre mutations n'est plus un clone muté, c'est une fixture inline déguisée — c'est-à-dire mon propre R-2, réintroduit par la porte de derrière pour défendre huit lignes de point fixe.* Et sans lui, les deux implémentations passent exactement les mêmes tests. **Position retenue : `mene_a` à plat**, sens d'erreur correct (sur un cycle, alerte au lieu de bloquant — **sous-gradué, jamais éteint**). Contrepartie non négociable : le cas est **écrit** en docstring, et la charge d'it6 avec lui.

**3.E — B-9 : oui au relevé, mais dans la REVUE, jamais en assertion committée.** `controles.test.ts` ne lit aujourd'hui **que** `dossier-minimal.json`. Y committer un compte sur `dossier-reference.json` accrocherait la suite de cette feature à une fixture **partagée par huit suites et possédée par personne** : une entrée ajoutée par `dossier-registres` ferait rougir `dossier-controles`, pour un défaut qui n'est pas le sien.

**3.F** — B-3 : aucune conséquence technique, **mais la garde de vacuité est nécessaire dans les deux cas** — une ALERTE par vacuité casserait le test des quatre contrôles exactement comme un BLOQUANT. B-5 : coût négligeable, **mais elle ne sauve pas le test de `bascule-editeur`**.

## 4. Découpage DÉFINITIF — un seul lot, liste corrigée de trois à QUATRE fichiers

| Fichier | N/R | Contenu |
|---|---|---|
| `src/brain/dossier/controles.ts` | R | +4 entrées (**après** `amorce-non-redigee`), +`producteursParIndice`, +proses FR |
| `src/brain/dossier/controles.test.ts` | R | **6** assertions de ligne de base + **refonte du balayage l. 172-186** + ~10 corps |
| `src/features/dossier-controles/tests/panneauControles.test.tsx` | R | **+1 test** ; les 3 existants **inchangés** (vérifié ligne à ligne) |
| `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R | **+2 champs dans UN littéral**. Aucune assertion modifiée |

**Correction formelle de mon tour 1** : « l'itération ne touche aucune autre feature » — **FAUX, je le retire**. Formulation juste : *aucun fichier de **production** d'une autre feature ; un littéral dans un test, rendu nécessaire par le changement de contrat `brain/` lui-même.* Le signal de coupe ne se déclenche pas : la skill l'excepte pour le lot `contrat`, et c'en est un.

**4.A — la ligne de base : SIX assertions, pas quatre.** `[DÉDUIT DE LA FORME]` Le dossier en nommait quatre (115, 143, 257, 265) ; il en manque **deux**, l. **121** et **129**, toutes deux dans le test l. 109-131, toutes deux des comptes globaux. Remède unique : **filtrer par `controle.id`** + une **sonde neuve** épinglant la nouvelle ligne de base. Restent vertes : l. 116/130 (`jouable`) — *sous la définition étroite elles tomberaient aussi, argument technique de plus pour les six chemins*.

**4.B — piège d'ordre** : l. 122-124 et 144 lisent `controles[0]` ; elles ne restent vertes que si les quatre entrées sont déclarées **APRÈS** `amorce-non-redigee`. Un ouvrier qui les insère par ordre alphabétique fait tomber deux assertions pour une raison que personne ne soupçonnerait.

**4.C — les quatre sites de deltas, et le piège que le plan DOIT désamorcer.** `sitesDe` est **privée à `validate.ts`** et son import déjà interdit par un test existant. Trois issues, une seule recevable : ❌ l'importer → rouge immédiat · ❌ **réécrire un marcheur générique** → second moteur de traversée, non typé, dérivant de la grammaire figée — **je vetote cette forme si elle est proposée** · ✅ **quatre accès TYPÉS**, garde KR-199 portée par la **mesure** et non par l'énumération.

**Troisième garde de « départ désert », que personne n'a nommée** : si `charpente.depart.lieu_id` ne résout aucun lieu, la règle **se tait** — c'est une anomalie `error` que le canal des contrôles ne doit pas doubler (KR-217/225), et sans elle `localiserEntite('lieu', undefined, -1)` rendrait « **Lieu n°0 (sans nom)** » en production.

**4.D — encapsulation** : le test vertical matche un **FRAGMENT** distinctif, jamais une phrase entière recopiée à travers la frontière feature ↔ `brain/`.

**VERDICT — recevable sous réserve.** Aucun veto.
