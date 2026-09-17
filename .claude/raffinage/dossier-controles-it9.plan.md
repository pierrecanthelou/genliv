# Plan d'itération — `dossier-controles` · itération `9`

> **Statut : VALIDÉ par l humain le 2026-09-17 (porte 2 franchie).**
> Comité à **5 rôles**, 2 tours, **aucun veto tenu**, **aucun bloc `ESCALADE`**.
> **Motif du 5e rôle** : l'itération réécrit le bloc d'hypothèses datées H1/H2/H3 d'`atteignabilite.ts`, dont `narratif-ia` est l'auteur, et décide ce qu'« obtenir un indice » veut dire sur un document statique.
> Notes de tour : `.claude/raffinage/dossier-controles-it9/`.

---

## Fiche de validation *(deux minutes — le reste est pour l'ouvrier)*

**Phrase de démo** — à la fin de cette itération, **l'auteur voit qu'un indice dont les seuls détenteurs sont derrière une porte qui ne s'ouvrira jamais ne sera jamais obtenu.**

**⚠ Le périmètre a basculé DEUX FOIS pendant le raffinage, et il revient à deux portes.** Le `narratif-ia` a demandé au tour 1 que `contrepartie` sorte ; le `pm-produit` et le `tech-lead` l'ont suivi au tour 2. Puis **le `narratif-ia` a retiré sa propre réserve** en trouvant dans la fixture le fait qui le contredisait. Les deux rôles qui l'avaient suivi ne le savaient pas en écrivant. **J'arbitre : les deux portes restent.** § 8, désaccord **D-A**.

**La tranche** — aucune écriture : `controlerDossier` est pure. Elle traverse le **calcul** (`atteignabilite.ts`), la **règle et sa prose** (`controles.ts`), et le **rendu déjà livré**. Aucun composant, aucune fixture, aucune seconde feature.

**Les lots**

| id | titre | fichiers | `contrat` |
|---|---|---|---|
| **L1** | La porte d'un savoir est infranchissable | **4** (0 N, 4 R) | **oui** — seul, **pas d'essaim** |

**Hors périmètre** — § 2. **Désaccords `REPORTÉ`** — cinq, § 8. **Proposition `INNOVATION`** — **aucune**.

### Ce que l'humain doit savoir, et qui ne se devine pas d'un diff

**1. Le comité a trouvé un cinquième défaut réel dans l'aventure de référence du dépôt.** `objet.lanterne-de-corvin` est exigé comme prix d'un savoir et n'est **jamais** donné — seulement retiré. Le dossier écrit **qui la porte** (Corvin, « une lanterne toujours allumée à la ceinture ») et **qui la veut** (Tobin), et **ne joue jamais la scène du milieu**. Ce n'est pas un inventaire de départ implicite : c'est une **scène manquante**.

**2. Le `narratif-ia` s'est trouvé tort lui-même, dans la source, et l'a écrit sans l'atténuer.** Sa position du tour 1 (« faux positif sur un dossier sain ») reposait sur une phrase qu'il reconnaît comme **son invention, pas une lecture**. Il a aussi établi que le précédent d'it7 joue **contre lui** : « à it7 c'est moi qui ai écrit que la seule lecture restante confiait l'inventaire au narrateur ».

**3. Deux défauts trouvés dans le bloc d'hypothèses lui-même.** H2 affirme qu'un jalon sans `declencheur_expr` est un producteur fantôme — **faux**, `types.ts` déclare l'absence légitime et `deltas.ts` porte `atteindre_jalon`. Et H3 affirme être « la SEULE hypothèse dont l'erreur irait dans le sens interdit » — **faux depuis it7**. Les deux se corrigent ici.

**4. La mesure la plus importante du raffinage : les deux implémentations fautives exigent DEUX témoins distincts.** Le mutant « portes évaluées avant la relaxation » rougit sur la chaîne d'entrelacement ; le mutant « point fixe puis soustraction » y **reste vert**. Un seul témoin aurait laissé passer exactement ce que ce plan interdit. **C'est BUG-087 rejoué — attrapé au raffinage cette fois, pas après l'essaim.**

**5. Et la profondeur de chaîne est MESURÉE, pas choisie : 2.** Un maillon est indiscernable, deux discriminent. L'écart avec it6 (4 maillons) s'explique : ici le témoin est une chaîne de **portes**, pas de relaxations. À it6 ce chiffre avait été choisi, et il était faux.

**6. Une erreur de mon cadrage, corrigée par la QA** : j'avais écrit « treize suites » sans l'exécuter. Mesuré : **20 suites chargent une fixture, et sous une implémentation naïve un seul test bouge**.

---

## 1 — But raffiné

Livrer l'évaluation des **portes d'un savoir** : un savoir dont `revele_si` ne peut **jamais** être franchie cesse de compter comme producteur de son indice.

**Deux portes ÉVALUÉES, deux laissées OUVERTES**, et la partition est **dérivée**, pas arbitrée porte par porte :

> **H4 — un fait dont le schéma nomme un ÉCRIVAIN UNIQUE, et dont aucune instance de cet écrivain n'existe au dossier, est INACCOMPLISSABLE. Un fait dont le schéma ne nomme AUCUN écrivain n'est pas décidable, et le linter s'y tait.**

| porte | écrivain au schéma | verdict |
|---|---|---|
| `apres_indice_id` | savoirs + `reveler_indice` + `mene_a`, **sur-comptés** | **évaluée** |
| `contrepartie.objet_id` | **`donner_objet` SEUL** (`Depart` n'a aucun inventaire ; `retirer_objet` écrit en négatif) | **évaluée** |
| `confiance_min` | **aucun** — `modifier_confiance` écarté du registre | **ouverte** |
| `jet` | le **dé** — aucun document ne l'écrit | **ouverte** |

Le calcul est un **point fixe unique, entrelacé, croissant depuis ∅** (plus petit point fixe). `contrepartie` n'introduit aucune récursion ; `apres_indice_id` est la **seconde arête indice→indice** et entre dans la **même** relaxation que `mene_a`.

---

## 2 — Hors périmètre

- **Réparer `dossier-reference.json`** — le site narrativement juste est une récompense de quête, dont le compte est épinglé **dans une seconde feature** (`panneauQuetes.test.tsx`). Le défaut est **épinglé, pas réparé**.
- **La règle « cet objet, personne ne le donne »** — cause distincte, section distincte, portée strictement plus large, et **elle n'a pas besoin du point fixe**.
- **Corriger le COMPORTEMENT de `possede_objet`** — on **écrit** le défaut (H5), on ne le répare pas.
- **Évaluer `confiance_min` ou `jet`** — indécidables sous H4.
- **`jalons[].declencheur_expr`, le climat, l'atteignabilité du PORTEUR** — les trois dernières familles de H2.
- Aucun composant, aucun token, aucune pastille, aucun `NiveauControle`.

*Note de périmètre* : `objetsDonnesDe` **est** extraite (§ 5). Le `tech-lead` l'avait retirée au tour 2 en supposant `contrepartie` hors tranche ; celle-ci restant, le second appelant existe et l'extraction retrouve son motif — **une** définition, **deux** invocations.

---

## 3 — Contrat de design

**Message (troisième sous `indice-sans-source`, niveau bloquant), MOT POUR MOT** — c'est le **texte de repli** de l'`ux-designer`, celui qui vaut sous **deux** portes évaluées :

> `« Cet indice n'est confié qu'à des savoirs dont une porte ne s'ouvrira jamais : le joueur ne pourra jamais l'obtenir. »`

*Motif du choix : le texte resserré (« attend un autre indice ») n'est honnête que si `apres_indice_id` est la seule porte évaluée. Elle ne l'est pas. « Une porte » (indéfini) reste vrai des deux portes et de tout savoir en portant plusieurs.*

**Remédiation — UNIQUE, réécrite, vraie des TROIS causes, à l'impératif** :

> `« Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas ; et si un savoir le garde déjà derrière une porte, retirez cette porte ou changez sa cible (Personnages → Savoirs), ou donnez ce qu'elle réclame par un effet « donne l'objet » (Quêtes, Événements, Jalons). »`

**Trois gestes sur la porte, et le troisième n'est pas décoratif** : sans lui, la règle **enseigne à l'auteur de supprimer le prix que le personnage demande** — le linter appauvrirait la fiction qu'il protège. C'est le geste qu'it7 a réellement employé pour la même classe de défaut.

**Vérifié en code, pas supposé** (doctrine BUG-090) : `BlocSavoirs.tsx` porte `LIBELLES_RETRAIT_PORTE` (« Retirer la porte de contrepartie », « Retirer la porte d'indice préalable ») et un `Select` de cible réassignable par porte. `donner_objet` porte le libellé « donne l'objet » (`deltas.ts`), et « (Quêtes, Événements, Jalons) » est la convention déjà employée par `REMEDIATION_OBJECTIF_SANS_CHEMIN`.

**Registre** : indicatif présent, sujet « Cet indice » — **parallèle aux deux messages voisins du même seuil**. Aucun terme interne, aucun nom de champ. Le message **ne nomme pas** l'indice attendu : l'« autre membre » n'est calculable que pour un cycle à deux.

**Valeurs visuelles** : aucun token neuf. Le bloquant rend `tone: 'bad'` → `--bad` / `--bad-line` / `--bad-bg-2`, déjà câblés. **Changement de texte pur** sous l'anatomie `IssueList` existante.

---

## 4 — Contrats `brain/` touchés

`producteursParIndice` change de **type de retour** — seule signature modifiée. Domaine des clés **inchangé**. `SourceIndice` **inchangé**. Aucun export neuf.

---

## 5 — Lot

**UN SEUL LOT, `contrat`, seul. Pas d'essaim, pas de worktree, pas de fusion.**

| fichier | N/R |
|---|---|
| `src/brain/dossier/atteignabilite.ts` | **R** |
| `src/brain/dossier/atteignabilite.test.ts` | **R** |
| `src/brain/dossier/controles.ts` | **R** |
| `src/brain/dossier/controles.test.ts` | **R** |

**Pourquoi pas deux lots** : le lot `controles` **ne compile pas seul** sous le retour élargi, et son témoin exige le comportement de l'autre. **On n'invente pas du parallélisme pour remplir un essaim.**

**Un seul TEMPS.** Le découpage T1/T2 du tour 1 est retiré par son auteur : sans porte non récursive isolable, T1 serait un contrat élargi **sans consommateur** — une porte verte qui ne prouve rien.

**Signatures**

```ts
export interface ProducteursIndice {
	readonly retenues: readonly SourceIndice[]   // LE COMPTE des trois seuils, inchangés (0/1/≥2)
	readonly savoirSousPorteMorte: boolean        // classé ICI, jamais reconstruit par l'appelant
}
export function producteursParIndice(dossier: Dossier): Map<string, ProducteursIndice>

// PRIVÉES
function porteOuverte(revele_si: Revelation | undefined, indicesProduits: ReadonlySet<string>, objetsDonnes: ReadonlySet<string>): boolean
function objetsDonnesDe(dossier: Dossier): Set<string>   // UNE définition, DEUX appelants, AUCUNE mémoïsation
```

**`porteOuverte` s'écrit en SUITE DE GARDES à sortie `false`, jamais en `some`** — c'est ce qui porte le ET par construction. Les portes **présentes mais non évaluées** (`confiance_min`, `jet`) ne sont **pas** des gardes.

**Consommation dans `controles.ts`** : `compte = entree?.retenues.length ?? 0` ; priorité **figée** — `savoirSousPorteMorte` d'abord, puis `entree !== undefined` → `SANS_RACINE`, sinon le zéro nu.

**Contraintes mécaniques** — le nouveau message se déclare **avec les `PROSES_*`, bien AVANT `const SITES_AVERTISSEMENT`**, jamais entre les deux ancres · **la porte vaut `undefined`, jamais `null`** (mesuré : `retirerPorte` supprime la clé ; le `null` est un modèle de vue) — **aucune garde double** · `pnj_a_revele` passe par la **même** `porteOuverte`, avec l'ensemble **final** · la docstring de `producteursParIndice` et `MESSAGE_INDICE_SANS_RACINE` se réécrivent **dans le même geste** (KR-199) · `atteignabilite.ts` ne connaît ni `SectionId` ni `NiveauControle`.

**Le bloc d'hypothèses se réécrit** : H2 perd sa puce fausse sur le jalon (**avec sa correction écrite**, pour que l'erreur ne se refasse pas sur `Evenement.declencheur_expr`, optionnel pour le même motif) et sa dernière phrase (« les faux positifs vivent là-bas ») ; **H4** et **H5** entrent ; H3 passe de « la seule hypothèse » à « **l'une des DEUX** ».

**Aucun lot n'ouvre** : les fixtures partagées (KR-156 — témoins **locaux**), `types.ts`, `deltas.ts`, `predicates.ts`, `destinations.ts`, `validate.ts`, `brain/index.ts`, tout `src/features/**`.

---

## 6 — Critères d'acceptation

| # | Critère | Niveau |
|---|---|---|
| **1** | **Étant donné** un savoir dont `contrepartie.objet_id` désigne un objet qu'aucun `donner_objet` ne donne, **quand** l'index est calculé, **alors** ce savoir n'est pas retenu comme producteur — **et** un savoir dont la contrepartie est donnée l'est (discriminant dans le même test). | unitaire |
| **2** | **Étant donné** la chaîne `racine` (delta) → `relais` (`mene_a`) → `tardif` (savoir gardé sur `relais`), **quand** l'index est calculé, **alors** `tardif` compte **1** — **et** l'implémentation fautive « portes évaluées AVANT la relaxation » fait rougir ce témoin. | unitaire + mutant |
| **3** | **Étant donné** une chaîne de **DEUX** savoirs gardés en cascade sur une cible jamais produite, **quand** l'index est calculé, **alors** le second compte **0** — **et** l'implémentation fautive « point fixe PUIS soustraction, non ré-itérée » fait rougir **ce témoin-ci**, que le témoin du critère 2 laisse vert. *(Profondeur 2 : mesurée, pas choisie.)* | unitaire + mutant |
| **4** | **Étant donné** un cycle mutuel `apres_indice_id` sans racine extérieure, **et** un cycle **mixte** `mene_a` + `apres_indice_id`, **quand** l'index est calculé, **alors** les deux membres comptent **0** dans les deux cas — jamais 1. | unitaire |
| **5** | **Étant donné** un savoir dont la porte d'indice est fermée **et** qui porte en plus une `confiance_min`, **quand** l'index est calculé, **alors** il compte **0** ; **et** étant donné un savoir dont la porte d'indice est ouverte et qui porte un `jet`, **alors** il compte **1**. *(Le ET par construction, et les portes non évaluées ne ferment pas.)* | unitaire |
| **6** | **Étant donné** trois dossiers produisant chacun une cause distincte de compte nul — rien ne cite l'indice / un savoir le détient derrière une porte morte / des enchaînements sans racine — **quand** le rapport est calculé, **alors** les trois messages diffèrent, **et** le cas **mixte** (porte morte **et** enchaînement sans racine) rend le message de **porte morte**. | unitaire |
| **7** | **Étant donné** la remédiation de `indice-sans-source`, **quand** elle est comparée aux sources d'écran, **alors** chacun des écrans qu'elle nomme écrit réellement le champ correspondant, **et** elle contient les **trois** gestes sur la porte — retirer, changer la cible, **donner l'objet** ; **et** étant donné la source d'`atteignabilite.ts`, **alors** elle ne contient ni `'../challenge'`, ni `CHALLENGE_TIERS`, ni `challengeTierValue` — l'interdit d'évaluer `jet` est **constatable**, pas promis. | unitaire (gardes de source) |
| **8** | **Étant donné** les suites voisines, **quand** l'itération est livrée, **alors** `indice.trace-du-guet` de `dossier-reference.json` passe de silence à **ALERTE** — seul mouvement de ligne de base, épinglé nommément comme **défaut réel non réparé** — et aucune autre assertion ne bouge, les deux fixtures restant **non modifiées**. | suites existantes |

---

## 7 — Tests nommés (KR cités → test)

| KR | Exigence | Test |
|---|---|---|
| **KR-164** | un code par CAUSE | critère **6** — trois messages, un `ControleId` |
| **KR-199** | balayer, jamais N littéraux ; doc et code réécrits ensemble | critère **7** + la docstring réécrite avec `MESSAGE_INDICE_SANS_RACINE` |
| **KR-156** | jamais muter une fixture partagée | critère **8** — les deux fixtures non modifiées ; témoins locaux |
| **KR-197 / KR-202** | deux entités dans le même test, une qui déclenche, une qui ne déclenche pas | critères **1** et **5** |
| **KR-224** | hypothèses datées, domicile `atteignabilite.ts` | H4 et H5 écrites ; H2 et H3 corrigées |
| **KR-013/113** | aucune mémoïsation | `objetsDonnesDe` et le point fixe recalculés à chaque appel |
| **KR-217** | jamais le canal `errors`/`warnings` | critère **8** |
| **KR-193 / KR-130** | une règle de jeu vit à UN seul endroit ; le linter du dossier n'importe pas la couche des règles | critère **7**, seconde moitié — garde de source sur `atteignabilite.ts`. *Mesuré : le module n'importe aujourd'hui que `./deltas`, `./expr`, `./predicates`, `./types` — la garde naît verte et le restera.* |

---

## 8 — Registre des désaccords

### Les arbitrages structurants

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| **D-A** | **`contrepartie` dans ou hors de la tranche** — dedans (tour 1 : PM, tech-lead ; tour 2 : QA, narratif) contre dehors (tour 2 : PM, tech-lead, recommandation UX) | **RETENU : elle RESTE** | Trois motifs convergents. (1) **Le `narratif-ia` a retiré sa réserve**, et le PM comme le tech-lead l'avaient explicitement suivie — leur prémisse est retirée par son auteur. (2) **Mesuré** : `donner_objet` est le **seul canal** que le schéma reconnaît, donc fermer n'est pas un pari sous incertitude, c'est appliquer ce que le document établit. (3) **Sans elle, la tranche ne bouge AUCUNE ligne de base** (mesuré contre la production) : elle serait invisible et **surveillée par aucun test existant**. |
| **D-B** | **L'objection de routage du `tech-lead`** — le constat se pose sur l'indice quand le fait fautif est sur l'objet | **RETENU comme contrainte, pas comme exclusion** | L'objection est juste et indépendante, mais elle a été écrite **sans connaître la remédiation à trois gestes**. Elle est **traitée** par le troisième geste (« donnez ce qu'elle réclame »), qui route l'auteur vers l'écran producteur. Le diagnostic reste sur l'indice ; le **remède** nomme l'objet. |
| **D-C** | **Un troisième message, ou zéro texte neuf** | **RETENU : troisième message** | Quatre rôles, quatre chemins ; le `pm-produit` a **retiré** sa position. Réutiliser un message existant serait **faux** (classe BUG-088) : un savoir cite bel et bien l'indice. |
| **D-D** | **Remédiation distincte (UX tour 1) ou unique étendue** | **RETENU : unique, étendue** | Une troisième consigne exigerait un discriminant sur `ConstatControle`, interface exportée — **état illégal représentable** (arbitrage it6). **L'`ux-designer` avait déjà retiré cette position**, et le veto de contrat du `tech-lead` est donc sans objet. |
| **D-E** | **Le texte du message** — resserré (narratif) ou générique (UX) | **RETENU : le générique**, qui était le **repli** de l'UX | Le resserré n'est honnête que sous une seule porte évaluée. Deux le sont. |
| **D-F** | **H4 : « ensemble sur-compté » ou « écrivain unique »** | **RETENU : écrivain unique** | La première condamnerait rétroactivement `possede_objet` d'it7 et produirait une partition que personne ne voulait. **Retirée par son auteur.** |

### `REJETÉ` — recopiés depuis les annexes (BUG-082)

**Contrat et algorithme** (`tech-lead`) — une couche AU-DESSUS de `producteursParIndice` (le point fixe est **entrelacé**) · le point fixe **décroissant** (gfp : sur un cycle il rend les membres auto-justifiés, **faux négatif** sous une règle bloquante) · un champ `porte` sur `SourceIndice` (sur-compterait) · une seconde fonction exportée `causeDuZero` (O(n²) et second parcours) · exporter `indicesProduits` · **deux passes** · **deux temps** · **deux lots parallèles** · `MotifEcart` en union à deux valeurs (**information non lue** — biais d'abstraction prématurée, déclaré deux fois par son auteur) · **une garde double `null`/`undefined`** (mesuré : le document ne porte que `undefined`) · mémoïser quoi que ce soit.

**Prose** (`ux-designer`) — réutiliser le message bloquant existant (**faux au sens strict**) · réutiliser `MESSAGE_INDICE_SANS_RACINE` (nomme des enchaînements, pas des portes) · résoudre depuis la remédiation existante (**circulaire**) · laisser le compte redescendre silencieusement · une pastille ou un niveau de plus (KR-217) · un texte par type de porte · **la phrase du narratif telle quelle** (descriptive, non actionnable — toutes les remédiations du fichier sont impératives) · le sujet « Les personnages… » (casse le parallélisme des trois messages) · un texte différent selon le nombre de portes.

**Domaine et schéma** (`narratif-ia`) — évaluer `jet` (**verdict constant** : minimum des dés 1/2/3/4 contre une caractéristique de 2 à 10 — il existe pour chaque tier un héros qui réussit ; et l'évaluer importerait la couche des règles, KR-193/KR-130) · évaluer `confiance_min` (aucun écrivain) · dériver « obtenable » de l'espace de noms ou de `retirer_objet` (**compterait une soustraction comme un don**) · un second `ControleId` · **muter une fixture partagée** · traiter « le schéma ne sait pas exprimer un inventaire de départ » comme un angle mort qui excuse l'auteur (**c'est l'inverse** : il écrit un fait que le moteur ne pourra pas honorer, et la seule chose qui pourrait l'honorer — le narrateur — **est interdite de le faire**) · une remédiation à deux gestes seulement · fusionner « l'objet que personne ne donne » dans it9 · **considérer le flip `trace-du-guet` comme couvrant le troisième message** (il est ALERTE ; le bloquant reste à témoin fabriqué).

**Périmètre** (`pm-produit`, `qa`) — « zéro texte neuf » (**retiré par son auteur**) · le T1/T2 rangeant `contrepartie` en premier temps · traiter le flip comme LE témoin suffisant du risque bloquant · l'objection de périmètre façon KR-220 (**mesurée fausse** : matériau abondant dans les deux fixtures).

**Auto-rejets** — le `narratif-ia` rejette **sa propre réserve** et **sa propre H4 du tour 1** ; la `qa` rejette **son propre étiquetage** (« faux positif » → faux négatif) ; le `tech-lead` rejette **sa propre Option E** et **sa propre extraction** ; le `pm-produit` rejette **sa propre conclusion** « pas d'angle mort ».

### `REPORTÉ`

| Vers où | Quoi |
|---|---|
| **`open_questions`** | **La règle « cet objet, personne ne le donne »** — **complément**, pas substitut : cause distincte, section `objets`, portée strictement plus large (elle couvre aussi les feuilles `possede_objet` d'it7), et **pas besoin du point fixe**. Matériau déjà mesuré et légué : `sceau-de-cendre` donné, `amulette-scellee` donnée, `lanterne-de-corvin` jamais donnée — **un positif, deux contrôles négatifs dans la fixture partagée**. |
| **`open_questions`** | **La réparation de `dossier-reference.json`** (la scène manquante de la lanterne). Contraintes déjà mesurées : **jamais `objet.sceau-de-cendre`** (une fin l'exige, `consomme: true` la détruirait) ; le site juste est une récompense de quête, **dont le compte est épinglé dans une seconde feature**. |
| **`open_questions`** | **`possede_objet`**, second site du sens interdit — **écrit** à H5 dans ce lot, corrigé avec la règle ci-dessus. |
| **`open_questions`** | **`confiance_min` / `jet`** : à déclarer **définitivement non évaluables** plutôt que « pas encore », **sinon H2 rétrécira de zéro à chaque itération**. |
| **`open_questions`** | **L'atteignabilité du PORTEUR d'un effet**, le climat (n° 14), le jalon — les trois dernières familles de H2. |

### Nouveau `known_risk` à créer

> **Deux lignes lisent `objetsDonnes` sous une règle bloquante** (`ETABLISSEMENT.possede_objet` et `porteOuverte`). L'ensemble est **exact au schéma** — `donner_objet` est le seul écrivain, `Depart` ne porte aucun inventaire, et **le narrateur ne touche jamais l'inventaire**. Le jour où une feature accorde un inventaire de départ ou une acquisition en scène, **ces deux lignes-là, et elles seules, sont à reprendre.**

---

## 9 — Mesures de l'orchestrateur

**Exécutées par la `qa`, protocole vérifié (arbre propre avant/après, HEAD inchangé, harnais temporaires supprimés)** : les deux mutants exigent **deux témoins distincts** · profondeur du second mutant = **2** · cycle mutuel et cycle mixte → 0/0 · sous `apres_indice_id` **seul**, **aucune ligne de base ne bouge** · le flip `trace-du-guet` = silence → alerte.

**Vérifiées par moi, en source** : `Depart` sans inventaire · `lanterne-de-corvin` jamais `donner_objet` · `atteindre_jalon` au registre · `BlocSavoirs.tsx` écrit les deux portes et porte les libellés de retrait · « (Quêtes, Événements, Jalons) » est la convention d'it7 · `donner_objet` porte le libellé « donne l'objet ».

**Corrigé** : mon cadrage disait « treize suites » — **lecture non exécutée**. Mesuré : 20 chargent, 1 bouge.

**NON mesuré, et le lot doit le mesurer en premier geste** : **le rayon du resserrement de `pnj_a_revele`**, jamais mesuré par personne. S'il bouge une assertion de fixture partagée → **retour au comité**, jamais de mutation de fixture.

---

## 10 — Définition de fini

Prettier → `tsc --noEmit` → ESLint → `jest` verts · les 8 critères vérifiés par les tests du § 7 · **les mutants des critères 2, 3 et 5 posés et leur couleur constatée** · la mesure d'ouverture sur `pnj_a_revele` relevée dans la revue · le `known_risk` neuf dans la spec **et** `code-knowledge.json` · **score de mutation non lancé** (aucun des quatre fichiers mutés n'est touché).

---

## 11 — Garde-fous du `narratif-ia`, reconduits

1. **Aucun constat de contrôle n'entre jamais dans un contexte de modèle.** Un narrateur à qui l'on apprendrait qu'une porte est morte jouerait autour — **c'est-à-dire donnerait la lanterne**.
2. **Le libellé de porte reste côté auteur** — les six lignes de portes sont `moteur` dans `destinations.ts`.

**Contrat de sortie IA** : entrée injectée **aucune**, schéma consommé **aucun**, budget de contexte **inchangé**. La frontière code/IA est **renforcée** : it9 déplace du jugement **vers le code** — une porte qui ne s'ouvrira jamais est constatée par une fonction pure, là où sans elle c'est une partie jouée qui le découvrirait au tour 40.
