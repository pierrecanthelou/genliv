# Tour 1 — `narratif-ia` · `dossier-fiches` it3

```
RISQUE      — Le chiffre d'une caractéristique EST le seuil d'un jet (`docs/REGLES-DU-JEU.md`
              § 2 : réussite = dés ≤ carac). Déclaré `ia` « pour que le narrateur sache que le
              PNJ est fort », il met dans le contexte du modèle la probabilité exacte d'un jet
              qu'il ne doit jamais résoudre — et lui permet de raconter l'issue avant que le
              moteur n'ait lancé. C'est la décision projet n° 4, à la ligne près.

OBJECTION   — (1) « bornes `1..CHARACTERISTIC_MAX` » : LE PLANCHER 1 N'EXISTE NULLE PART dans
              `docs/REGLES-DU-JEU.md`. Le § 1 ne donne que `2D4` (minimum 2) et « plafond 10
              par caractéristique à la création » ; et un PNJ n'y est ni le héros (§ 1, 8
              caracs) ni un monstre (§ 4, 5 caracs). Écrire `1..12` dans le code fait du code
              la source d'une borne de jeu — KR-130 à l'envers. (2) La définition ne dit pas
              la destination des 8 clés, seule décision de cette itération qui se paie au
              tour 40. (3) Elle ne dit pas ce qui s'affiche quand une des trois caracs du PV
              manque.

PROPOSITION — (a) 8 lignes `moteur`, DÉRIVÉES de `CHARACTERISTIC_VALUES` (KR-117), les 8 clés
              instanciées dans les DEUX fixtures, un test nommé calqué sur « le camp et le
              rattachement … sont moteur ». (b) Corriger D'ABORD LA DOC (une phrase au § 1),
              puis poser `CARACTERISTIQUE_MIN` dans `src/brain/dossier/types.ts` (précédent
              `CONFIANCE_MIN/MAX`) — JAMAIS dans `characteristics.ts` : y toucher déclenche
              le run de mutation et le cliquet +5 (80→85) qu'un score mesuré à 81,40 % ne
              paie pas. (c) PV : `—` si l'une des trois manque, jamais `?? 0`.

VERDICT     — recevable sous réserve : (a), (b) et (c) écrits au plan avant l'essaim.
```

---

## ANNEXE

### 1. Destination de `stats` : **`moteur`**, une ligne par carac, dérivées

**Motif.** Le nombre est un **seuil**, pas une description. § 2 : « réussite = résultat des dés ≤ caractéristique testée ». Un modèle qui lit `FO: 9` connaît la marge d'un `1D6` avant que `challenge.ts` ne l'ait résolu ; il narrera « tu forces la porte sans effort » pendant que le moteur tire un échec. Trois précédents déjà écrits, tous dans le même sens :
- `destinations.ts` (l. 138-142) : `revele_si.jet.carac` et `.tc` sont `moteur`, commentaire « **le modèle ne voit ni `carac`, ni `tc`, ni le seuil — au mieux un libellé dérivé** » ;
- `specification.json` → `design_contract.registres_de_langue` : `caractere.curseurs.*` et `relations[].intensite` sont **déjà** arbitrés `moteur`, « le modèle ne voit jamais le nombre brut ». Basculer `stats` en `ia` casserait la cohérence de toute la famille numérique **à l'intérieur de la même feature** ;
- `monde.quetes[].recompense[]` / les 4 emplacements de deltas : `moteur`, « injecté, il apprendrait au modèle à distribuer lui-même les récompenses ».

**La clause « au moins un rôle » de `destinations.ts` ne bascule pas.** Le plan de cible donne à R2 · arbitre la sortie `{ type, carac, tc, enjeux, deltas_proposes }` : l'arbitre **nomme** la caractéristique, le moteur en **lit la valeur** et lance. Aucun rôle n'a besoin du nombre. Le bloc `carac` du schéma de session est l'état du **héros en session**, propriété de la n° 9 — pas ce champ de dossier.

**Ce qui remplace le chiffre côté prose, et qui le produit.**
- *Aujourd'hui, l'auteur* — par `apparence` et `fonction`, livrées en it2, toutes deux `ia`. Le JSDoc d'`apparence` dit déjà exactement cela : « Elle DÉCRIT, elle ne chiffre pas — la force ou l'agilité d'un personnage se règlent aux caractéristiques, jamais dans cette prose. » Le colosse est décrit parce que l'auteur l'a décrit, pas parce que le modèle a lu 11.
- *Plus tard, le code* — un libellé dérivé du nombre **à l'assemblage** (n° 10), jamais une seconde clé au schéma. Une `open_questions` porte déjà ce problème pour les curseurs. **Demande à l'orchestrateur : élargir cette entrée existante aux 8 caracs plutôt qu'en ouvrir une neuve** — même propriétaire, même instrument, une ligne éditée.

**Une clé par carac, pas une destination unique sur le porteur — mécanique, pas esthétique.** Le walker de `couverture.test.ts` produit des feuilles `monde.personnages[].stats.FO` ; les deux assertions font une **égalité de clé exacte**. Une ligne porteuse `monde.personnages[].stats` serait **morte le jour où elle est écrite**. Donc : **8 chemins**, produits par **une seule dérivation** de `CHARACTERISTIC_VALUES` étalée dans la table (KR-117), et **8 instances dans `dossier-minimal.json` + au moins un personnage complet dans `dossier-reference.json`**.

Même dérivation recommandée pour `ENUMERES_FERMES` : `valeurs: VALEURS_CARACTERISTIQUE` (construite comme `CONFIANCES` l'est depuis `CONFIANCE_MIN/MAX`), **`requis: false`**. C'est le précédent exact d'un numérique borné dans ce schéma.

### 2. Le PV dérivé : lecture légitime, sous deux conditions écrites

**Section source.** `docs/REGLES-DU-JEU.md` **§ 1 « Création & état de santé »** : « **Points de Vie (PV)** : `PV = FO + AG + EN` ». Le code correspondant est `maxPV()` (`src/brain/characteristics.ts`, l. 62-65), dont le JSDoc cite déjà « § 1 ». **Signature réelle : `maxPV(s: Pick<HeroStats, 'FO'|'AG'|'EN'>)` — un objet.** Le `maxPV(FO,AG,EN)` de la spec est un raccourci de rédaction ; il doit être corrigé au plan, sinon le dev-contrat écrira un appel à trois arguments.

**Légitime — mais la frontière est l'appel, pas l'affichage.** Afficher un PV dérivé n'est pas une fuite ; **réécrire la somme** dans le TSX en est une, et c'est la seule forme que je bloquerais. Un `stats.FO + stats.AG + stats.EN` dans `FichePersonnage.tsx` met `PV = FO+AG+EN` à **deux endroits** : le jour où le § 1 change, l'éditeur ment et rien ne rougit. Preuve demandée, deux tests, tous deux avec un instrument qui existe :
1. **test-grep** — la somme des trois caracs n'apparaît que dans `src/brain/` (précédent : « le walker de couverture n est ecrit qu une fois dans le module dossier ») ; l'écran **importe** `maxPV` ;
2. **test d'affichage** sur un triplet qu'aucun défaut ne fabrique (`FO 7 · AG 3 · EN 5 → 15`), au **montage sans interaction** — 11e critère d'acceptation, leçon de BUG-064.

**Une seule des trois caracs manque : la doc ne dit rien**, et c'est normal — le § 1 ne connaît que des héros complets. C'est donc une décision **d'écran**, acceptable seulement parce qu'elle affiche une **absence** : `—`, si et seulement si `FO`, `AG` et `EN` sont **toutes les trois** présentes, sinon rien. **`?? 0` est interdit et doit être un test nommé** : `0` a un sens dans les règles (§ 1 : `PV ≤ 0` → inconscient ; `PV ≤ -CA` → mort — et `healthState(0, 0)` rend `'mort'`). Un défaut à zéro ferait affirmer à l'éditeur qu'un PNJ à moitié rédigé est inconscient.

**Le PV n'est pas un champ du document** : rien à déclarer dans `destinations.ts`, et surtout **aucune ligne `pv` « par symétrie »** — KR-192. À noter pour le lot contrat : `docs/PLAN-BASCULE-IA.dc.html` (l. 201) écrit `"stats": { …, "pv", "tier" }` et son § 1.3 « les 8 caracs + PV et Tier » — **la référence de design est périmée sur ce point**, et un dev-contrat qui l'ouvrira y lira le contraire de la décision. À écrire noir sur blanc dans le plan.

### 3. La borne basse : la doc et la spec divergent — c'est la **doc** qui se corrige

| Source | Ce qui est écrit |
|---|---|
| `REGLES-DU-JEU.md` § 1, en-tête | « 8 caractéristiques principales, **plafonnées à 12** » |
| `REGLES-DU-JEU.md` § 1, Génération | « **2D4** pour chaque caractéristique » (min 2), « **plafond 10** à la création » |
| `REGLES-DU-JEU.md` § 5 | « caractéristiques **≤ 12** » |
| `REGLES-DU-JEU.md` § 4 | des créatures réelles à **1** (Rat géant `FO 1`, Zombie `AG 1`, Liche `FO 1`) |
| spec it3 | « bornes **1**..`CHARACTERISTIC_MAX` » |

**Aucun plancher n'est écrit nulle part.** Le seul minimum dérivable (`2`) est celui d'une **procédure de génération du héros**, pas une borne d'échelle. KR-130 : **valeur absente de la doc → on corrige la doc, jamais l'inverse**.

**Recommandation : plancher `1`**, et une phrase à ajouter au § 1 (2 lignes, dans le lot contrat) :

> L'échelle d'une caractéristique va de **1 à 12**, pour le héros comme pour tout personnage non joueur du dossier. La génération du héros (`2D4` + `1D4`, plafond 10 à la création) en est un cas particulier, pas la borne de l'échelle.

Motifs, tous tirés des règles : `1` est une valeur que le système **manipule déjà** (§ 4) ; `0` est exclu parce que `PV = FO+AG+EN` rendrait `0` (donc « inconscient » à la création) et parce qu'un `CA = 0` fait s'effondrer les deux seuils du § 1 (`PV ≤ 0` et `PV ≤ -CA` deviennent le même) ; la table de progression du § 5 ne dit rien de 0.

**Le plafond ne se retape jamais** : `CHARACTERISTIC_MAX` est **importé** de `characteristics.ts`, jamais redéclaré côté dossier (KR-165/117). Seul le plancher est une constante neuve, et je la veux dans `src/brain/dossier/types.ts` à côté de `CONFIANCE_MIN`/`CONFIANCE_MAX`.

### 4. Table dorée et score de mutation

`CHARACTERISTICS`, `CHARACTERISTIC_VALUES`, `CHARACTERISTIC_MAX`, `DEFAULT_CHARACTERISTIC`, `MONSTER_CHARACTERISTICS` sont **couverts** par `src/brain/rules.golden.test.ts` et neutralisés dans le score de mutation. **Section source : `docs/REGLES-DU-JEU.md` § 1 « Le Personnage (variables d'état) »**, confirmée par le § 5.

Cette itération **lit** ce registre, elle ne l'étend pas : **aucune ligne dorée neuve, aucun `npm run test:mutation` obligatoire** — à la condition stricte que `src/brain/characteristics.ts` ne soit **pas** modifié. S'il l'est (par exemple pour y loger `CARACTERISTIQUE_MIN`), trois obligations se déclenchent d'un coup : run de mutation, relevé des 4 scores par fichier dans la revue, et **cliquet `break` +5 (80 → 85)** — que la mesure du 2026-08-02 (81,40 %) ne paie pas.

### 5. Contrat de sortie IA concerné

**Il n'existe aucun appel modèle dans le Temps 1.** Le contrat ci-dessous est **prospectif** — ce que cette itération engage pour le jour où le contexte s'assemble.

**Entrée injectée (après it3).** Pour un personnage résolu par identifiant : `fonction`, `apparence`, `description_joueur` (`ia`, it2), `plan_actions[].action`, `savoirs[].*` sous porte ouverte. **`stats.*` : absent du contexte, pour tous les rôles.** Aucun nombre de caractéristique, aucun PV dérivé, aucune paraphrase du nombre (« FO élevée ») ne franchit la frontière tant que la n° 10 n'a pas livré un **libellé dérivé par le code** et sa ligne d'audience.

**Schéma de sortie.** Aucune sortie de modèle ne porte, ne propose ni ne modifie une caractéristique. La liste blanche de mutations d'état du schéma 1 est `DELTAS` (`deltas.ts`) et vaut **quatre** opérations : `donner_objet`, `retirer_objet`, `reveler_indice`, `atteindre_jalon` — **aucune ne touche une carac, un PV ou l'XP**. Les 8 clés sont des données **de temps d'écriture, en lecture seule au runtime**. Si un besoin de modification apparaît (n° 13), il arrive comme **une entrée `DELTAS` de plus appliquée par le moteur**, jamais comme un champ de sortie de modèle.

**Échec de validation.** À l'import, une carac hors bornes ou non entière est une **anomalie bloquante** portée par `ENUMERES_FERMES`. À l'écran, le Stepper borne à la saisie — il n'écrit jamais une valeur hors borne, donc le bandeau de refus n'est **pas** atteignable depuis ce bloc : même situation qu'it1, et **on ne construit pas un bandeau qui ne peut jamais s'allumer**. Le chemin de refus existe pour l'**import**, il se prouve par `validate.test.ts`, pas par un mock d'écran.

**Ce que personne ne pourra vérifier à cette itération, et qui doit figurer comme tel dans la revue :** que `stats` n'atteint aucun contexte de modèle. `destinations.ts` le déclare, il ne le démontre pas — l'en-tête du fichier le dit lui-même. La preuve arrive avec l'assembleur n° 10 ; d'ici là, la déclaration + le test nommé sont tout ce qu'on a, et c'est à écrire comme une **limite**, pas comme une garantie.

---

**Fichiers lus** : `docs/REGLES-DU-JEU.md`, `src/brain/characteristics.ts`, `rules.golden.test.ts`, `src/brain/dossier/{types,destinations,tables,couverture.test,deltas}.ts`, `__fixtures__/dossier-minimal.json`, `specification.json`, `docs/ROADMAP-BASCULE-IA.md`, `docs/PLAN-BASCULE-IA.dc.html`, `code-knowledge.json`, la skill `raffinage-iteration`. Aucun fichier écrit.
