# Tour 2 — `narratif-ia` · `dossier-controles` it8

**RISQUE** — La variante « capacité » vise un champ que **l'éditeur n'écrit nulle part**. `ObjectifsCanon.tsx` n'édite que `nom`, `camp`, `reussi_si_texte`, `echoue_si_texte` ; it7 l'a mesuré puis **épinglé verbatim** (`controles.ts` l. 403-405 : « cet écran n'écrit pas la condition structurée — la phrase nommerait une surface qui n'existe pas », test `controles.test.ts` l. 1415). Une règle sur `reussi_si_expr` allume donc, sur tout dossier écrit à la souris, un voyant qu'**aucun geste d'auteur ne peut éteindre**. Défaut préexistant au passage : `condition-sans-expr` (l. 504) porte déjà cette consigne fantôme.

**OBJECTION** — **`ux-designer`** : ton exception nommée devient **inutile**, pas seulement mal motivée — sous la forme ci-dessous la doctrine `etat_vide` n'est **pas touchée du tout**. **`pm-produit`** : ton retrait tient à la contradiction AC1/AC2/`etat_vide` — elle **disparaît** si la règle se tait sur la collection vide ; et ton « signal d'engagement distinct de collection vide » existe déjà, c'est `length > 0`.

**PROPOSITION** — **Trois gardes cumulatives** : `objectifs.length > 0` **et** aucun `reussi_si_expr` **et** aucun `reussi_si_texte` non vide. Tire exactement sur la **carte creuse** de `handleAjouter`, aujourd'hui muette partout. Niveau `alerte`, `path: 'canon.objectifs[].reussi_si_texte'`. Échelle sans recouvrement : creux → cette règle ; prose seule → `condition-sans-expr` ; `expr` sans producteur → `objectif-sans-chemin`.

**VERDICT** — **veto sur `bloquant`, quelle que soit la variante** : il rouvre D1. `alerte` sous les trois gardes : recevable.

---

## ANNEXE

### 2 — Statut de chacune de mes positions du tour 1

| Position | Statut |
|---|---|
| OBJECTION : `bloquant` affirme une injouabilité mesurée fausse | **DURCIE EN VETO.** Motifs neufs : D1 déclare `…_expr` **facultative** (« absente, la condition n'est jamais déclenchée automatiquement — elle reste une intention narrative ») et le roadmap fixe déjà le niveau de cette matière : **alerte**, « l'aventure reste jouable ». |
| PROP. 1 : la règle entre en `alerte` | **MAINTENUE**, la forme change : trois gardes au lieu d'un cardinal. |
| PROP. 1 (message/remédiation signés) | **RETIRÉE et remplacée** — ma propre prose décrivait le cardinal, que je n'épouse plus. |
| PROP. 2 : le vrai bloquant de la zone est « aucune fin atteignable » | **MAINTENUE**, intacte. |
| PROP. 3 : aucun bloquant fondé sur un objectif tant qu'aucune feature du Temps 2 ne déclare lire `reussi_si_expr` | **MAINTENUE et renforcée** — les seuls lecteurs sont `controles.ts`, `atteignabilite.ts`, `validate.ts`, tous **au temps du linter**. |
| A3 : critère des collections vides | **MAINTENU**, et **étendu** (§ 3b). |
| A3 : discriminant du geste | **MAINTENU** — et il **ne suffit plus seul** : il lui manquait une porte. |
| REJETÉ 1-6, 8-10 | **TOUS MAINTENUS.** |
| REJETÉ 7 | **MAINTENU, frontière tracée** (§ 3d). |
| Annexe D (divergence documentaire) | **MAINTENUE**, formulation exacte au § 5. |
| Annexe F (AC1/AC2 non tranchés) | **CADUQUE sous la forme à trois gardes** : le dossier neuf n'est plus touché, **AC1 et AC2 redeviennent vraies telles qu'écrites**. Seule AC10 est à réécrire. |

### 3a — « Ingagnable, pas injouable » sous la variante capacité

**Elle tient, et elle se durcit.** Un dossier dont aucun objectif ne porte de `reussi_si_expr` est, pour le moteur, dans le **même état** qu'un dossier à zéro objectif. Ce qui bouge va dans le sens **inverse** de ce que la variante espérait : D1 **déclare l'absence de `…_expr` légitime** et le roadmap lui **assigne déjà `alerte`**. **Sur le niveau, la variante capacité est donc plus FAIBLE que le cardinal, pas plus forte.**

### 3b — Mon critère, étendu

Mon critère porte sur une **collection vide** ; la variante à trois gardes n'y touche pas, donc **le critère n'est pas engagé** — et c'est le point décisif : la doctrine `etat_vide` n'est ni rouverte, ni exceptée, ni effleurée.

**Piège mécanique** : `every(...)` est **vrai à vide**. Une variante capacité **non gardée** rallume sur la collection vide, redevient un cardinal déguisé et retombe sous mon critère, qu'elle échoue. **La garde `length > 0` n'est pas une commodité, c'est ce qui décide de quelle doctrine relève la règle.**

Extension doctrinale achetée par cette itération :

> **Une capacité absente se signale au niveau de ce qu'elle EMPÊCHE — jamais de l'effort restant — et elle ne peut atteindre le BLOQUANT que si l'éditeur offre AUJOURD'HUI le geste qui la restaure.**

### 3c — La variante capacité redevient-elle éligible au bloquant ? **OUI, éligible. Et elle échoue quand même.**

| Porte | `objectif-sans-chemin` (livré, bloquant) | variante capacité |
|---|---|---|
| 1. Le geste qui éteint est une RÉFÉRENCE, pas de la prose | oui | **oui** |
| 2. Le mot est VRAI (« ne peut pas être jouée ») | défaut prouvé d'une chose qui existe | **non** — rien n'est encore affirmé |
| 3. Le geste EXISTE dans l'éditeur | oui — Quêtes, Événements, Jalons, Savoirs | **non** — aucune surface n'écrit `reussi_si_expr` |

Discriminant signé : **`objectif-sans-chemin` sanctionne une affirmation FAUSSE déjà portée au dossier ; la variante capacité sanctionne une affirmation PAS ENCORE portée. Un linter bloque un mensonge, il n'a jamais bloqué un inachèvement** — sinon il bloque 100 % du travail en cours.

### 3d — Frontière avec mon REJETÉ 7, et condition d'entrée

**Partager un `path` est LICITE ; partager une ENTRÉE ne l'est pas.** Mon REJETÉ 7 visait la matière (`echoue_si_expr` — exclue, sens d'erreur inverse) et la structure (une branche sous le **même `ControleId`**) : la variante n'est ni l'une ni l'autre.

**Ma condition d'entrée, sur mon terrain (« une règle ne vit qu'à un seul endroit ») :** un test unique, par mutation d'**un seul dossier**, parcourant les quatre barreaux avec le compte exact de voyants :

| état | voyant attendu | compte |
|---|---|---|
| `objectifs: []` | **aucun** (doctrine `etat_vide` intacte) | 0 |
| un objectif creux, comme `handleAjouter` le crée | la règle neuve, `alerte` | 1 |
| `reussi_si_texte` renseigné, pas d'`expr` | `condition-sans-expr`, `alerte` | 1 |
| `reussi_si_expr` sans producteur | `objectif-sans-chemin`, `bloquant` | 1 |

Sans ce test, la règle ne passe pas. La docstring d'`objectif-sans-chemin` (l. 841-846) devient **partiellement fausse dans ce lot** et se réécrit avec lui.

### 4 — Message et remédiation signés

**REJETÉ 11, NOUVEAU** — aucune prose promettant un effet MOTEUR à un geste que le moteur ne lit pas. Le voyant s'éteint en écrivant `reussi_si_texte`, et D1 pose que **le moteur ne lit jamais `…_texte`**. Le message parle de ce que **l'auteur** a dit ; la phrase sur le moteur appartient à `condition-sans-expr`, qui prend le relais au barreau suivant.

- **OÙ** : `"CANON · OBJECTIFS — condition de réussite"`
- **QUOI** : `"Des objectifs sont posés, mais aucun ne dit ce qu'il faut accomplir pour l'emporter."`
- **QUOI FAIRE** : `"Dites ce qui fait réussir au moins un objectif (Canon → Objectifs des camps)."`

Contraintes que la reformulation ne peut pas franchir : (i) rien sur le modèle ; (ii) rien sur l'injouabilité ou la non-conclusion ; (iii) aucun effet moteur promis par un geste de prose ; (iv) **l'écran nommé écrit réellement le champ nommé**.

**Nom** : `canon-sans-objectif` devient un **identifiant menteur**. Candidat : `canon-sans-victoire`, libellé « Canon sans victoire énoncée ».

**Deux conséquences hors périmètre** : `condition-sans-expr` renvoie à une surface mesurée inexistante — **défaut préexistant, à journaliser** ; it8 ne doit pas le répliquer. Et AC10 n'est pas amendée, elle est **remplacée**.

### 5 — Divergence documentaire : **je l'assume**

Le comité ne contredit pas l'arbitrage n° 5 du plan de cible, **il applique sa première phrase contre sa propre énumération**. « Pas de quota arbitraire de fiches » est le principe ; « un canon avec un objectif, deux détenteurs par indice principal… » est **une liste de quotas**, écrite avant le schéma. Précédent déjà livré sans drame : « deux détenteurs par indice principal » n'a jamais été livré — it6 a livré `indice-sans-source`, qui tire sur un **producteur**. Le comité en est au **deuxième** item de la même énumération, par la même méthode.

Formulation à inscrire telle quelle :

> **Divergence consignée — 2026-09-16.** `docs/PLAN-BASCULE-IA.dc.html` place « objectifs des camps » dans le bloc A · CANON, « le seul bloc toujours présent dans le contexte de l'IA » (l. 108), et écrit que les conditions de réussite et d'échec sont « ce qui permettra au moteur de conclure une partie » (l. 546). **Les deux sont périmées, et le code fait foi** : `destinations.ts` donne aux sept champs d'`Objectif` les audiences `moteur` ou `auteur` — **aucune n'est `ia`** ; `predicates.ts` **écarte `objectif_atteint` pour circularité**, si bien qu'aucune `charpente.fins[].condition_expr` ne peut dépendre d'un objectif. La terminaison passe par `charpente.fins`, et par elle seule.
>
> **Sur l'arbitrage n° 5** : **le principe est tenu et n'est pas rouvert.** C'est l'**énumération** qui est périmée, sur deux items. « Un canon avec un objectif » est vidée par les deux décisions ci-dessus **et** par D1, qui déclare `…_expr` facultative et fixe le niveau de son absence à **alerte**, « l'aventure reste jouable ».
>
> **Le `.dc.html` n'est pas corrigé** : référence de design, pas source vivante. Sens de lecture : roadmap + code du schéma → plan de cible, jamais l'inverse.

**Nuance à consigner** : le plan prévoit un assistant d'ÉCRITURE partant « du synopsis + les objectifs ». Ce consommateur est au **temps de l'auteur**, pas de la session ; `destinations.ts` décrit le contexte **de narration**. Deux consommateurs, deux régimes.

### 6 — Contrat de sortie IA

Entrée injectée : **aucune**. Schéma de sortie consommé : **aucun**. `controlerDossier` reste pure et synchrone. **Budget de contexte : rigoureusement inchangé, nul par construction.** La règle ne doit importer ni `PREDICATES` ni `ExprNode` : lire `reussi_si_expr === undefined` est une **présence de clé**.

### 7 — Ce que je n'ai PAS mesuré

- **Les chiffres de la QA (17/3 en bloquant, 13/2 en alerte) portent sur la variante CARDINALE et sont CADUQUES sous la forme à trois gardes.** Le dossier neuf n'étant plus touché, les lignes de base t=0 ne devraient pas bouger — **prédiction de lecture de source, à re-mesurer, je n'affirme la couleur d'aucun test.**
- Corollaire : la proposition du `tech-lead` de convertir les comptes totaux en `pourLaRegle` perd son urgence si t=0 ne bouge pas. Son terrain, je ne tranche pas.
- `path: 'canon.objectifs[].reussi_si_texte'` est une **clé existante** — **lecture de source**, à confirmer par jest ciblé.

### 8 — REJETÉ

Les dix du tour 1 **reconduits sans modification**. S'y ajoutent :

11. **REJETÉ** — toute prose promettant un effet MOTEUR à un geste que le moteur ne lit pas (`…_texte`).
12. **REJETÉ** — la variante capacité **non gardée** (`every` vrai à vide) : cardinal déguisé, rallume sur le dossier neuf, rouvre `etat_vide`.
13. **REJETÉ** — toute règle dont la remédiation nomme « Objectifs → Condition de réussite » : surface mesurée inexistante, déjà nommée à tort par `condition-sans-expr`. **Ne pas répliquer un défaut en le citant.**
14. **REJETÉ** — conserver l'identifiant `canon-sans-objectif` si la règle cesse de compter des objectifs.
15. **REJETÉ** — livrer la règle sans le test de disjonction à quatre barreaux. **La non-duplication se prouve, elle ne se plaide pas.**

---

## Notes de l'orchestrateur

**Le défaut sur `reussi_si_expr` a été trouvé DEUX FOIS indépendamment** — par ce rôle, et par moi au moment de vérifier la correction de navigation de l'`ux-designer`. Mes mesures confirment : `reussi_si_expr` a **0 occurrence** dans les fichiers de production de `src/features/` ; `ObjectifsCanon.tsx` lie son champ `"CONDITION DE RÉUSSITE"` à `reussi_si_texte` ; `dossier-canon` a explicitement écarté l'éditeur structuré (`design_contract.objectifs_texte_seul`) et le reporte **sans propriétaire assigné**.

**Recevabilité du veto sur `bloquant` : REQUALIFIÉ EN OBJECTION.** Le terrain de veto du `narratif-ia` est l'IA touchant aux dés/stats/inventaire/XP, une sortie modèle sans schéma, une règle dupliquée entre code et prompt, une référence par nom libre, un contexte sans borne. « Bloquer rouvre D1 » est un argument de doctrine de schéma, solide mais **hors de cette liste**. **Sans conséquence sur l'issue** : le veto du `pm-produit` sur `bloquant` est, lui, dans son domaine, et l'`ux-designer` a explicitement rejeté `bloquant` — **plus aucun rôle ne le défend.** Aucune ESCALADE n'est donc nécessaire.
