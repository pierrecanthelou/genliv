# Plan d'itération — `dossier-controles` · itération `8`

> **Statut : VALIDÉ par l'humain le 2026-09-16 (porte 2 franchie).**
> Comité à **5 rôles** (PM, Tech Lead, UX, QA, **Narratif & IA**), 2 tours, **aucun veto tenu**, **aucun bloc `ESCALADE`**.
> **Motif du 5e rôle** : l'itération décide ce que le **canon** doit contenir pour qu'une aventure soit gagnable, et la question doctrinale reportée d'it7 porte sur la frontière entre ce que le code affirme et ce que l'auteur est en train d'écrire.
> Notes de tour : `.claude/raffinage/dossier-controles-it8/tour{1,2}-<rôle>.md`.
> **Incident** : la note de tour 2 de la `qa` n'existe pas — l'agent a échoué sur une limite de débit. Arbre de travail vérifié propre par l'orchestrateur ; les mesures manquantes ont été **refaites par l'orchestrateur** (§ 9).

---

## Fiche de validation *(deux minutes — le reste du plan est pour l'ouvrier)*

**Phrase de démo** — à la fin de cette itération, **l'auteur voit que les objectifs qu'il a posés ne disent pas ce qu'il faut accomplir pour l'emporter.**

**⚠ L'itération 8 écrite en spec portait QUATRE charges. Elle a été découpée AVANT d'être raffinée**, et ce plan ne couvre que la première. Les trois autres : la scission de `controles.ts` (tranche `chore` séparée), le second point fixe sur les racines (it9), la condition d'échec vraie au tour zéro (it10).

**⚠ AC10 n'est pas amendée : elle est REMPLACÉE.** Le comité a mesuré que la règle telle qu'AC10 l'écrit — « `canon.objectifs` vide → BLOQUANT » — est fausse sur trois plans à la fois. Ce qu'on livre à la place tire sur **l'objectif creux**, pas sur la collection vide.

**La tranche, de l'écran à la persistance** — aucune écriture : `controlerDossier` est pure et se rappelle à chaque rendu. Elle traverse la **règle** (`controles.ts`), le **rendu déjà livré** (it1/it2/it4) et **rien d'autre** : aucune fixture, aucun composant, aucune seconde feature.

**Les lots**

| id | titre | fichiers | `contrat` |
|---|---|---|---|
| **L1** | `canon-sans-victoire` | **2** (0 N, 2 R) | **oui** — seul, **pas d'essaim** |

**Hors périmètre** — § 2.

**Désaccords `REPORTÉ`** — trois, § 8.

**Proposition `INNOVATION`** — **aucune**.

### Ce que l'humain doit savoir, et qui ne se devine pas d'un diff

**1. La règle qu'AC10 décrit ne pouvait pas être livrée.** Trois mesures indépendantes, chacune suffisante :

- elle contredit `design_contract.etat_vide` de **sa propre feature** (« Le linter SE TAIT sur les collections vides »), plus AC1 et AC2 — trois sources signées au cadrage contre une ;
- elle **s'éteint sur un objectif creux** : `handleAjouter` pose `{nom:'', reussi_si_texte:'', echoue_si_texte:''}`, et un clic ferait passer `jouable` à vrai sur un dossier tout aussi injouable ;
- elle n'a **aucun `path` légal** — `'canon.objectifs'` n'est pas une clé de `DESTINATION_DES_CHAMPS` (établi deux fois, par lecture et par exécution).

**2. « BLOQUANT » y aurait affirmé quelque chose de faux.** `objectif_atteint` est **écarté de `PREDICATES`** au motif « circulaire », donc **aucune `Fin.condition_expr` ne peut dépendre d'un objectif**. Une aventure sans objectif **s'ouvre, se joue et se termine** — par `charpente.fins`, et par elle seule. Ce qui manque n'est pas la partie, c'est l'**attribution de l'issue à un camp**. *Ingagnable, pas injouable* — et aucun mot de `NiveauControle` ne dit ça, ce qui est pourquoi la nuance vit dans le **message**.

**3. La variante de repli a été tuée par une mesure, elle aussi.** Le comité a convergé au tour 2 sur une règle tirant sur `reussi_si_expr` — jusqu'à ce qu'on mesure que **aucune surface de l'éditeur n'écrit ce champ** (0 occurrence dans les fichiers de production de `src/features/`). `dossier-canon` l'a explicitement écarté et le reporte **sans propriétaire assigné**. La règle aurait allumé, sur tout dossier écrit à la souris, un voyant **qu'aucun geste d'auteur ne peut éteindre**.

**4. Un défaut RÉEL a été trouvé dans le code livré à it5, et il n'est pas d'it8 de le corriger.** `condition-sans-expr` porte la consigne « Posez la condition structurée de réussite **(Objectifs → Condition de réussite)** » — or le champ ainsi étiqueté sur cet écran écrit `reussi_si_texte`, **la prose même qui a déclenché l'avertissement**. La consigne est **circulaire** : la suivre ne change rien. it7 avait mesuré et épinglé l'inverse dans le même fichier, deux itérations plus tard, sans que personne ne rapproche les deux. → `bug_history.json`, § 8.

**5. Le comité contredit délibérément une ligne du plan de cible.** L'arbitrage n° 5 (« le minimum jouable est un canon **avec un objectif** ») est la source doctrinale d'AC10. Le narratif établit qu'il se contredit sur sa propre ligne — « pas de quota arbitraire de fiches » est le principe, l'énumération qui suit est une liste de quotas, écrite avant le schéma. **Le principe est tenu ; c'est l'énumération qui est périmée**, sur son deuxième item (le premier, « deux détenteurs par indice principal », a déjà été remplacé à it6 sans drame). § 8.

**6. Trois rôles ont retiré une position qu'ils avaient défendue.** Le PM abandonne le retrait pur de la règle ; l'UX retire son motif ET sa position `bloquant`, verbatim ; le tech-lead retire son propre amendement de garde et son propre découpage en deux lots. Le narratif, lui, a répondu **oui** à une question qui contredisait sa proposition du tour 1 — avant de montrer pourquoi elle échoue quand même.

---

## 1 — But raffiné

Livrer **`canon-sans-victoire`** : une règle d'**alerte** qui signale un canon où des objectifs **sont posés** mais où **aucun** ne dit ce qu'il faut accomplir pour l'emporter.

Le prédicat porte **trois gardes cumulatives**, et la première n'est pas une commodité — c'est elle qui décide de quelle doctrine relève la règle :

```
objectifs.length > 0
  ET aucun objectif ne porte reussi_si_expr
  ET aucun objectif ne porte un reussi_si_texte non vide
```

Sans la garde `length > 0`, `every(...)` est **vrai à vide** : la règle rallumerait sur la collection vide, redeviendrait le cardinal d'AC10 et rouvrirait `design_contract.etat_vide`.

---

## 2 — Hors périmètre

- **La scission de `controles.ts`** (999 lignes, six gardes de source dont deux à ancres) → tranche `chore` **séparée**, arbitrée hors de ce raffinage.
- **Le second point fixe sur les RACINES** (porte morte, producteur fantôme) → **it9**. Hérite la liste H2 d'`atteignabilite.ts` en entier.
- **La condition d'ÉCHEC vraie au tour zéro** → **it10**. Cause distincte (KR-164), sens d'erreur inverse.
- **`echoue_si_expr` / `echoue_si_texte`** — la règle ne les lit **jamais**. Sens d'erreur inverse, matière d'it10.
- **La ligne F** : un objectif creux **à côté** d'un objectif pourvu reste silencieux. Prix assumé d'une règle de COLLECTION ; la discrimination par entité n'a aucun propriétaire déclaré.
- **Corriger `condition-sans-expr`** (défaut préexistant, § 8) — journalisé, non corrigé ici. **Mais non répliqué.**
- **Corriger `docs/PLAN-BASCULE-IA.dc.html`** — référence de design, jamais une source vivante.
- **Un éditeur structuré de `reussi_si_expr`** — sans propriétaire, hors de cette feature.
- **Aucun lot contrat sur `types.ts`, `destinations.ts`, `validate.ts`, `predicates.ts`, `atteignabilite.ts`** — décision de cadrage, reconduite.

---

## 3 — Contrat de design

**Textes visibles par l'auteur, MOT POUR MOT.** Prose du `narratif-ia`, retenue contre le Set B de l'`ux-designer`, qui est indélivrable (il nomme une surface inexistante — § 8, désaccord D3).

- **OÙ** (`location`, forme CHAMP en capitales, `entityId` **absent**) :
  `"CANON · OBJECTIFS — condition de réussite"`
- **QUOI** (`message`) :
  `"Des objectifs sont posés, mais aucun ne dit ce qu'il faut accomplir pour l'emporter."`
- **QUOI FAIRE** (`remediation`, constante, ignore le constat) :
  `"Dites ce qui fait réussir au moins un objectif (Canon → Objectifs des camps)."`

**Quatre contraintes que la prose ne peut pas franchir** — aucune reformulation ne les lève :

1. **rien sur le modèle** — zéro champ d'`Objectif` n'est d'audience `ia` ; une phrase suggérant l'inverse inviterait la n° 10 à injecter `reussi_si_texte` ;
2. **rien sur l'injouabilité** ni sur une partie qui ne pourrait pas se conclure — `charpente.fins` conclut seule ;
3. **aucun effet moteur promis par un geste de prose** — le voyant s'éteint en écrivant `reussi_si_texte`, que le moteur ne lit jamais. La phrase sur le moteur appartient à `condition-sans-expr`, qui prend le relais au barreau suivant ;
4. **l'écran nommé écrit réellement le champ nommé** — vérifié : `ObjectifsCanon.tsx` porte l'eyebrow `OBJECTIFS DES CAMPS — interne, jamais injecté au modèle` et son champ `CONDITION DE RÉUSSITE` écrit `reussi_si_texte`.

**Valeurs visuelles — aucun token neuf, aucun fichier CSS, aucun composant touché.** `niveau: 'alerte'` → `tone: 'neutral'` (`pastilles.ts`) → `Badge` → `--ink-2` / `--line-1` / `--paper-0`. La ligne de section `canon` porte déjà `SANS_COMPTE` et `badgeSection()` gère cette branche depuis it7 : **le mot seul remplace le tiret, jamais un second nœud** (KR-218). Aucune ligne de `pastilles.ts`, `SectionNav.tsx`, `ListeControles.tsx` ou `PanneauControles.tsx` n'est ouverte.

**État vide** — inchangé et **délibérément non touché** : la collection vide reste muette, `design_contract.etat_vide` reste vrai **mot pour mot**. Le bouton pointillé `+ Ajouter un objectif…` d'`ObjectifsCanon.tsx` reste le porteur du geste ; le voyant dit seulement « tu le sauras sans ouvrir la fiche ».

---

## 4 — Contrats `brain/` touchés

Une **entrée de plus** au registre fermé `CONTROLES` (Open/Closed, KR-117). **Aucun type modifié, aucun export neuf, aucune signature élargie.** `ControleId` s'étend par dérivation de ses clés.

---

## 5 — Lot

**UN SEUL LOT, marqué `contrat`, exécuté seul. Pas d'essaim** — deux fichiers, aucune logique de feature, aucun parallélisme à révéler. Un second lot n'aurait ni second agent, ni worktree, ni fusion, et l'unique bénéficiaire du « contrat figé » serait l'agent qui vient de l'écrire.

| fichier | N/R |
|---|---|
| `src/brain/dossier/controles.ts` | **R** |
| `src/brain/dossier/controles.test.ts` | **R** |

**Mesure d'ouverture, premier geste du lot, avant toute écriture.** L'orchestrateur a mesuré le **prédicat** (§ 9) ; l'**intégration** au registre ne l'a été par personne. Le lot exécute `jest src/brain/dossier src/features/dossier-controles src/features/bascule-editeur` une fois l'entrée posée, et **relève ce qui bouge réellement**. Prédiction écrite, à confirmer ou infirmer, jamais à supposer : aucun fichier de feature ne bouge. **Si un fichier de test de feature bouge, il rejoint CE lot** — il n'y en a pas d'autre, donc aucune question de disjonction ne se pose ; et la revue d'itération écrit que la prédiction était fausse.

**Certain par compilation, à livrer dans le même lot** : l'entrée `TEMOINS['canon-sans-victoire']` (`Record<ControleId, Dossier>` **total par compilation** — `tsc` casse sans elle ; le témoin est un dossier à **objectif creux**), l'entrée `NEUVES['canon-sans-victoire']` avec son `sections`, et **un rapport déclencheur dans la liste de discriminance** — `controlerDossier(seme())` **ne suffit pas** ici, contrairement au cardinal : `seme()` ne déclenche pas la règle neuve.

**Contraintes de placement, mécaniques :**

- l'entrée se pose **APRÈS `objectif-sans-chemin`**, **AVANT `avertissement-de-validation`** (placement mesuré par la QA au tour 1 : le seul qui épargne deux gardes d'ordre) ;
- les constantes `PROSE_*` neuves se posent **AU-DESSUS** de `const SITES_AVERTISSEMENT` — les deux gardes `BLOC_DES_SITES` tranchent la source entre cette constante et `function cheminDeTable`, et toute prose insérée dans l'intervalle fausserait leur comptage ;
- **interdit** d'importer `PREDICATES`, `ExprNode`, ou d'appeler `premiereFeuilleInaccomplissable` : lire `reussi_si_expr === undefined` est une **présence de clé**, pas une traversée d'arbre. La couture d'it6 reste fermée ;
- **interdit** d'appeler `validateDossier` dans un sens ou dans l'autre depuis la règle neuve ;
- la docstring d'`objectif-sans-chemin` (l. 841-846) devient **partiellement fausse** dans ce lot et se réécrit avec lui : son second silence reste vrai, son premier devient « ni `expr` ni prose → la règle neuve ; prose sans `expr` → `condition-sans-expr` ».

**Aucun lot n'ouvre** : `PanneauControles.tsx`, `ListeControles.tsx`, `SectionNav.tsx`, `DossierEditorScreen.tsx`, `sectionNav.test.tsx`, `destinations.ts`, `sections.ts`, `amorce.ts`, `validate.ts`, `atteignabilite.ts`, `predicates.ts`, `pastilles.ts`, `brain/index.ts`, `__fixtures__/*.json`.

**Hors lot, étape 4 des Build Steps, écrite par l'orchestrateur** : `specification.json`, `code-knowledge.json`, `bug_history.json`, `CHANGELOG.md`, `features_history.json`, `docs/ROADMAP-BASCULE-IA.md`.

---

## 6 — Critères d'acceptation

| # | Critère | Niveau de test |
|---|---|---|
| **1** | **Étant donné** un dossier fraîchement créé par `DossierService.create` (`canon.objectifs: []`), **quand** le rapport est calculé, **alors** `canon-sans-victoire` ne produit **aucun** constat — et le rapport porte exactement les **quatre** lignes d'AC1, inchangées. | unitaire (`controles.test.ts`) |
| **2** | **Étant donné** un dossier portant **un seul objectif créé comme l'écran le crée** (`{id, camp, nom:'', reussi_si_texte:'', echoue_si_texte:''}`), **quand** le rapport est calculé, **alors** `canon-sans-victoire` produit **exactement un** constat de niveau `alerte`, section `canon`. | unitaire |
| **3** | **Étant donné** un seul dossier muté à travers les **quatre barreaux** — `[]`, puis creux, puis `reussi_si_texte` renseigné, puis `reussi_si_expr` sans producteur — **quand** le rapport est calculé à chaque barreau, **alors** le compte de voyants vaut `0, 1, 1, 1` et le voyant allumé est respectivement *aucun*, `canon-sans-victoire`, `condition-sans-expr`, `objectif-sans-chemin` — **et le dossier est RESTAURÉ à son état initial en fin de test**, qui re-vérifie le barreau 1. | unitaire |
| **4** | **Étant donné** le `path` déclaré par la règle, **quand** la garde des chemins s'exécute, **alors** `'canon.objectifs[].reussi_si_texte'` est reconnu comme clé littérale de `DESTINATION_DES_CHAMPS`, et la table `NEUVES` reste **totale par balayage** du registre (KR-199) — aucun `N` littéral. | unitaire |
| **5** | **Étant donné** le message et la remédiation de la règle, **quand** la garde de prose s'exécute, **alors** aucun des deux ne contient de terme affirmant un besoin du **modèle**, une **injouabilité**, ou une partie qui ne pourrait pas **se conclure** — les trois familles de mots étant balayées depuis une liste déclarée, jamais cherchées une par une. | unitaire |
| **6** | **Étant donné** la remédiation de la règle, **quand** elle est comparée à la source d'`ObjectifsCanon.tsx`, **alors** l'écran qu'elle nomme écrit réellement `reussi_si_texte` — et la chaîne `'Condition de réussite)'` est **absente** de la remédiation neuve (non-réplication du défaut d'it5). | unitaire (garde de source) |
| **7** | **Étant donné** les suites voisines du dépôt, **quand** l'itération est livrée, **alors** `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts`, `panneauControles.test.tsx`, `dossierEditorScreen.test.tsx` et `sectionNav.test.tsx` restent verts **sans modification d'aucune assertion**, et les deux fixtures partagées ne sont pas touchées. | suites existantes |
| **8** | **Étant donné** le registre après ajout, **quand** `tsc --noEmit` s'exécute, **alors** il passe — ce qui n'est possible que si `TEMOINS` porte son entrée `canon-sans-victoire` (total par compilation) — **et** le balayage de discriminance exhibe pour elle un rapport déclencheur distinct de `controlerDossier(seme())`. | `tsc` + unitaire |

---

## 7 — Tests nommés (KR cités → test qui les tient)

| KR | Ce qu'il exige | Test |
|---|---|---|
| **KR-164** | un code par CAUSE | critère **3** — les quatre barreaux, zéro recouvrement |
| **KR-199** | balayer depuis le registre, jamais N littéraux | critère **4** — `NEUVES` totale par balayage |
| **KR-217** | jamais le canal `errors`/`warnings` pour produire | critère **7** (les cinq suites) + garde `.errors` interdite, inchangée |
| **KR-218** | un seul Badge par `ListRow`, fusionné | critère **7** (`dossierEditorScreen.test.tsx` + `sectionNav.test.tsx` verts, zéro modification) |
| **KR-219 / KR-226** | section **DÉCLARÉE**, aucun découpage de chemin | critère **4** + garde `not.toContain("split('.')")`, inchangée |
| **KR-197 / KR-202** | deux états dans le MÊME test, une qui déclenche, une qui ne déclenche pas | critère **3** — **la garde n'est PAS réécrite** : sa forme « collection » existe depuis it3 (muter, puis **RESTAURER**) |
| **KR-222** | la **troisième** discrimination — « ni `_expr` ni prose » | critère **2** — c'est précisément l'état B |
| **KR-117** | registre **FERMÉ**, Open/Closed — une règle de plus ne touche aucun consommateur | critère **7** — si le registre ne l'était pas, l'ajout d'une entrée forcerait un changement d'UI et la suite de feature rougirait |
| **KR-013** | `jouable` dérivé ici et nulle part ailleurs | aucun fichier de vue ouvert ; critère **7** |

---

## 8 — Registre des désaccords

**Aucun désaccord sans statut.** Les `REJETÉ` d'annexe sont recopiés ici — un refus qui reste en annexe n'existe pas pour l'ouvrier (BUG-082).

### Les trois arbitrages structurants

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| **D1** | **Le NIVEAU** : `bloquant` (UX, tour 1) contre `alerte` (narratif) contre pas de règle (PM, tour 1) | **RETENU : `alerte`** | `bloquant` n'est **plus défendu par personne** au tour 2 — l'UX l'a rejeté explicitement, le PM a posé un veto **dans son domaine** (valeur utilisateur du voyant tautologique + dépassement à deux features), le narratif a objecté. Mesuré : `bloquant` = 17 tests / 3 fichiers / 2 features ; `alerte` = 0 fichier hors `dossier-controles`. Et il affirmerait une injouabilité que `charpente.fins` dément. |
| **D2** | **La FORME** : cardinal (AC10) contre capacité sur `reussi_si_expr` (tech-lead, signé par PM et UX) contre **trois gardes** sur `reussi_si_texte` (narratif) | **RETENU : trois gardes** | Le cardinal ne livre pas KR-222 et s'éteint sur un objectif creux. La capacité vise un champ qu'**aucune surface n'écrit** : voyant inextinguible. Les trois gardes laissent la collection vide muette (AC1, AC2 et `etat_vide` intacts, **mesuré** § 9) et tirent exactement sur l'état que KR-222 assigne à cette itération. |
| **D3** | **Le TEXTE** : Set B de l'`ux-designer` contre la prose du `narratif-ia` | **RETENU : narratif** | Le Set B nomme « Objectifs → Condition de réussite », surface **mesurée inexistante** — et contredit le propre REJETÉ 3 de l'UX, qu'elle maintient. L'UX n'a pas vu la forme à trois gardes ; sa convention de capitales pour le OÙ est **conservée**. |

### `REJETÉ` — recopiés depuis les annexes

**Du `narratif-ia`** (15) — prose affirmant que le modèle a besoin des objectifs · prose affirmant l'injouabilité ou la non-conclusion · ajouter `objectif_atteint` aux `PREDICATES` · un quatrième mot de `NiveauControle` · semer un objectif dans `construireAmorce` · exiger « un objectif par camp » (`types.ts` dit que c'est DESCRIPTIF) · étendre à `echoue_si_expr` ou en faire une branche d'`objectif-sans-chemin` · fonder le niveau sur « ça s'allume à t=0 » (`amorce-non-redigee` s'allume sur 100 % des dossiers neufs, en bloquant, et elle est livrée) · router le constat vers une autre section que `canon` · affirmer la couleur d'un test sans l'exécuter · **prose promettant un effet moteur à un geste que le moteur ne lit pas** · **la variante capacité NON GARDÉE** (`every` vrai à vide = cardinal déguisé) · **toute remédiation nommant « Objectifs → Condition de réussite »** · conserver l'identifiant `canon-sans-objectif` · **livrer sans le test de disjonction à quatre barreaux**.

**Du `tech-lead`** (14) — ajouter une clé `canon.objectifs` à `DESTINATION_DES_CHAMPS` · un second `ControleId` ou un discriminant sur `ConstatControle` (état illégal représentable) · un constat PAR OBJECTIF creux · extraire une abstraction « règle de collection » partagée avec `depart-desert` · un troisième lot « composants » · que le lot de surface recopie le message ou la remédiation · scinder pour paralléliser · « on complète le littéral injecté, jamais l'assertion » comme échappatoire (**sans objet sous `alerte`**) · amender `estCheminDeChamp` (**retiré par son auteur**) · réécrire KR-197/202 · un test de discriminance qui mute **sans restaurer** · garder l'identifiant menteur · un constat par objectif creux pour boucher la ligne F · un second lot sous `alerte` (**retiré par son auteur**).

**De l'`ux-designer`** (9) — fondre la règle dans `objectif-sans-chemin` · un second badge sur la ligne `canon` · remédiation vers un écran qui ne pose pas le champ · généraliser l'exception aux autres collections · laisser AC2 inchangée *(devenu sans objet : AC2 reste vraie)* · **son propre motif « unique porteur de victoire/défaite »** · **son propre Set A** · **sa propre navigation du tour 1** · **tout niveau `bloquant`, sous quelque motif que ce soit**.

**Du `pm-produit`** (2) — conserver le texte actuel d'AC10 · toute prose reprenant le motif de l'UX.

### `REPORTÉ`

| Vers où | Quoi |
|---|---|
| **`bug_history.json`, dans ce lot** | **Le défaut d'it5** : `condition-sans-expr` renvoie à « Objectifs → Condition de réussite », surface dont it7 a mesuré l'inexistence dans le même fichier. Consigne **circulaire**. Non corrigé ici (hors périmètre), **non répliqué** (critère 6). |
| **it9** | La conversion des comptes TOTAUX de `seme()` en comptes `pourLaRegle` (tech-lead, O4). **Son urgence tombe** : t=0 ne bouge pas sous la forme retenue. Elle redeviendra due dès qu'une règle touchera la ligne de base. |
| **`open_questions`** | **La ligne F** — un objectif creux à côté d'un objectif pourvu reste silencieux. Limite assumée d'une règle de collection ; la discrimination par entité n'a aucun propriétaire. |

### Divergence documentaire — consignée, à recopier telle quelle

> **Divergence consignée — 2026-09-16.** `docs/PLAN-BASCULE-IA.dc.html` place « objectifs des camps » dans le bloc A · CANON, « le seul bloc toujours présent dans le contexte de l'IA » (l. 108), et écrit que les conditions de réussite et d'échec sont « ce qui permettra au moteur de conclure une partie » (l. 546). **Les deux sont périmées, et le code fait foi** : `destinations.ts` donne aux sept champs d'`Objectif` les audiences `moteur` ou `auteur` — **aucune n'est `ia`** ; `predicates.ts` **écarte `objectif_atteint` pour circularité**, si bien qu'aucune `charpente.fins[].condition_expr` ne peut dépendre d'un objectif. La terminaison passe par `charpente.fins`, et par elle seule.
>
> **Sur l'arbitrage n° 5 du plan de cible** : **le principe est tenu et n'est pas rouvert.** « Pas de quota arbitraire de fiches » est le principe ; l'énumération qui suit est une liste de quotas, écrite avant le schéma. C'est l'**énumération** qui est périmée, sur deux items — « deux détenteurs par indice principal » a déjà été remplacée à it6 par `indice-sans-source`, « un canon avec un objectif » l'est ici.
>
> **Le `.dc.html` n'est pas corrigé** : référence de design, pas source vivante. Sens de lecture : roadmap + code du schéma → plan de cible, jamais l'inverse.

**Nuance à consigner** pour que personne ne « répare » `destinations.ts` un jour : le plan prévoit un assistant d'ÉCRITURE partant « du synopsis + les objectifs ». Ce consommateur est au **temps de l'auteur**, pas de la session ; `destinations.ts` décrit le contexte **de narration**. Deux consommateurs, deux régimes.

### Extension doctrinale achetée par cette itération

> **Une capacité absente se signale au niveau de ce qu'elle EMPÊCHE — jamais de l'effort restant — et elle ne peut atteindre le BLOQUANT que si l'éditeur offre AUJOURD'HUI le geste qui la restaure.**

La seconde moitié est neuve. Elle généralise ce qu'it7 avait trouvé empiriquement (une remédiation ne nomme que des écrans producteurs) et le fait remonter du **texte** vers le **niveau**. Corollaire signé par le narratif : *un linter bloque un mensonge, il n'a jamais bloqué un inachèvement.*

---

## 9 — Mesures de l'orchestrateur *(la QA du tour 2 a échoué ; ces mesures la remplacent)*

**Exécutées**, par une sonde jetable évaluant le prédicat seul, sans toucher `controles.ts` — sonde supprimée, `git status` vérifié propre avant et après :

| dossier | cardinal (AC10) | **trois gardes** | n objectifs |
|---|---|---|---|
| `seme()` — dossier neuf | tire | **muet** | 0 |
| scène « dossier calme » de `panneauControles.test.tsx` | tire | **muet** | 0 |
| objectif creux, tel que `handleAjouter` le crée | muet | **TIRE** | 1 |
| `dossier-minimal.json` | muet | **muet** | 1 |
| `dossier-reference.json` | muet | **muet** | 2 |

**Également mesuré** : `'canon.objectifs[].reussi_si_texte'` est une clé littérale de `DESTINATION_DES_CHAMPS` (audience `auteur`) · `'canon.objectifs'` n'en est pas une (0 occurrence) · `reussi_si_expr` a **0 occurrence** dans les fichiers de production de `src/features/` · `ObjectifsCanon.tsx` lie son champ `CONDITION DE RÉUSSITE` à `reussi_si_texte`.

**Reprises du tour 1, exécutées par la QA** : `bloquant` = 17 tests / 3 fichiers ; `alerte` (cardinal) = 13 / 2. **Caduques pour la forme retenue** — elles portent sur le cardinal.

**NON mesuré, et le lot doit le mesurer** : l'intégration au registre (§ 5, mesure d'ouverture). Aucune phrase de ce plan n'affirme la couleur d'un test qui n'a pas été exécuté.

---

## 10 — Définition de fini

- Prettier → `tsc --noEmit` → ESLint → `jest` : **verts**.
- Les 8 critères du § 6 vérifiés, chacun par le test nommé au § 7.
- La mesure d'ouverture du § 5 **relevée dans la revue**, que la prédiction soit confirmée ou non.
- `bug_history.json` porte l'entrée du défaut d'it5.
- `specification.json` : AC10 **remplacée**, KR-222 corrigé de son numéro d'itération périmé, les arbitrages D1/D2/D3 en `resolved_decisions`, les trois `REPORTÉ` en `open_questions`.
- **Score de mutation : non lancé.** L'itération ne touche aucun des quatre fichiers mutés.

---

## 11 — Signature exacte

```ts
// src/brain/dossier/controles.ts — APRÈS 'objectif-sans-chemin', AVANT 'avertissement-de-validation'
'canon-sans-victoire': {
	libelle: 'Canon sans victoire énoncée',
	niveaux: ['alerte'],
	controler(dossier: Dossier): ConstatControle[],   // 0 ou 1 constat — JAMAIS un par objectif
	remediation(constat: ConstatControle): string,    // constante, ignore le constat
}
```

Le constat produit : `niveau: 'alerte'` · `section: 'canon'` **DÉCLARÉE** (KR-219, jamais dérivée du path) · `path: 'canon.objectifs[].reussi_si_texte'` · `location` en CAPITALES (forme « champ ») · `message` écrit dans le lot · **`entityId` ABSENT**.
