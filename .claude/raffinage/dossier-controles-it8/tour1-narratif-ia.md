# Tour 1 — `narratif-ia` · `dossier-controles` it8 (`canon-sans-objectif`)

**RISQUE** — `canon-sans-objectif` serait la **première règle du registre à porter sur un CARDINAL** et non sur une capacité. Elle s'éteint en créant une carte d'objectif vide munie d'un `camp` — un geste qui ne rend l'aventure ni plus jouable ni plus finissable. Un BLOQUANT qui compte des entités mesure les frappes de l'auteur, pas ce que le joueur vivra, et il dilue le mot sur les cinq règles qui s'éteignent en posant une **référence réelle**.

**OBJECTION** — AC10 pose « BLOQUANT », donc « cette aventure ne peut pas être JOUÉE ». Mesuré, c'est faux deux fois. (a) `objectif_atteint` est **écarté** de `PREDICATES` comme circulaire : aucune `Fin.condition_expr` ne peut dépendre d'un objectif — le moteur ouvre, joue et **conclut** un dossier à zéro objectif, par `charpente.fins`. (b) Les **sept** champs d'`Objectif` sont `moteur` ou `auteur` — **zéro `ia`** : le contexte du narrateur est identique, octet pour octet, avec 0 ou 12 objectifs. **Ingagnable, pas injouable** — et aucun mot de `NiveauControle` ne dit ça.

**PROPOSITION** — (1) la règle entre au niveau **`alerte`**. Message : « Aucun objectif n'est posé : la partie se jouera et pourra se terminer, mais rien ne dira à quel camp l'issue appartient. » Remédiation : « Posez au moins un objectif et son camp (Canon → Objectifs). » Sous `alerte` seul, `BADGES_DOSSIER_NEUF[0] = 'ALERTE'` n'a pas à être réécrit — la seconde feature n'est pas rouverte. (2) Le BLOQUANT juste de cette zone est **« aucune fin atteignable »** (`charpente.fins`). (3) Aucun BLOQUANT fondé sur un objectif tant qu'aucune feature du Temps 2 ne déclare **lire** `reussi_si_expr` en session.

**VERDICT** — **recevable sous réserve.** Pas de veto : le NIVEAU n'est pas mon terrain. Le **MESSAGE** l'est, et je refuse par avance toute prose affirmant que le narrateur a besoin des objectifs.

---

## ANNEXE

### A1 — Injouable, ou ingagnable ? → **ingagnable**, et aucun mot ne le dit

`charpente.fins[].condition_expr` est le **seul** chemin par lequel une partie se conclut. `PREDICATES` compte sept prédicats et **`objectif_atteint` en est écarté nommément, motif « circulaire »**. Un dossier à zéro objectif s'ouvre, se joue et se termine ; ce qui manque est l'**attribution** — `Objectif.camp` est « à qui appartient cette victoire ».

| mot | ce qu'il affirme | vrai ici ? |
|---|---|---|
| `bloquant` | l'aventure ne peut pas être jouée | **non** |
| `alerte` | elle se joue, avec un défaut qui coûtera en partie | **oui**, le plus proche |
| `info` | elle se joue, le modèle comblera | non — le modèle ne voit pas les objectifs |

Pas de quatrième mot : la nuance s'écrit dans le MESSAGE (précédent `MESSAGE_INDICE_SANS_RACINE`, it6).

### A2 — Ce que le modèle fait d'un canon sans objectif → **strictement rien**

Les sept lignes `canon.objectifs[].*` de `destinations.ts` sont `moteur` ou `auteur`, pas une n'est `ia`. Le bloc toujours chargé se réduit, côté canon, à quatre champs `ia` : `synopsis_mj`, `accroche_joueur`, `ton`, `interdits_ton[]`. **Budget de contexte : inchangé, nul par construction.**

### A3 — La doctrine des collections vides : **même espèce**, et voici le critère

La doctrine actuelle est écrite comme une habitude, sans critère. Le critère qui la rend décidable, tiré du schéma :

> **Une collection vide se signale si et seulement si le MOTEUR en dépend sur un chemin sans contournement. Le niveau est celui de la capacité perdue, jamais celui de l'effort restant.**

| bloc | moteur en dépend sans contournement ? | verdict |
|---|---|---|
| `charpente.depart` | **oui** — tour zéro | déjà `depart-desert`, bloquant |
| `charpente.fins[]` | **oui** — seul chemin de terminaison | **espèce différente** : c'est LE bloquant de collection |
| `canon.objectifs[]` | **non** — aucun prédicat ne la référence, aucun champ injecté | **même espèce** que `personnages`, `indices`, `objets`… |

Argument le plus sérieux **pour parler quand même**, et il ne vaut pas un bloquant : la collection vide rend **muette** la seule règle bloquante du canon (`objectif-sans-chemin` tire par objectif). L'auteur lit « rien à signaler » alors que **rien n'a pu être vérifié**. « Le linter ne peut rien contrôler ici » est par définition une **alerte**.

Deux corrections de doctrine :

- **« s'allume à t=0 » n'a jamais été le discriminant** — `amorce-non-redigee` s'allume sur 100 % des dossiers neufs, en BLOQUANT, et elle est livrée. Ce qui la sauve est écrit ailleurs : le champ est lu au joueur **mot pour mot, marqueur compris**.
- **Le discriminant écrit tient** : un voyant qu'on éteint en **rédigeant de la prose** n'est jamais bloquant ; un voyant qu'on éteint en **posant une référence** peut l'être. `canon-sans-objectif` n'est ni l'un ni l'autre : il s'éteint en **créant une entité**, et une entité vide suffit. **Troisième famille — la seule des trois satisfaisable sans qu'aucune aventure ne gagne en jouabilité.**

Observation versée au débat : le « dossier calme » d'aujourd'hui est déjà une aventure qui s'ouvre sur un lieu désert, sans personnage, sans indice et **sans fin** — et le rapport la déclare calme. Le mensonge de l'état calme existe déjà ; une exigence de cardinal sur `objectifs` le **déplace d'un champ**, elle ne le corrige pas.

### B — Rayon d'erreur

Le prédicat (`length === 0`) est **exact** : aucun faux négatif possible. Toute erreur est dans la conclusion tirée du fait.

- **sous `bloquant`** — le rapport affirme une injouabilité que le moteur dément ; le mot BLOQUANT cesse d'être un diagnostic, et il **invite la mauvaise réparation** (injecter les objectifs au canon à la n° 10). **Non tolérable.**
- **sous `alerte`** — le rapport dit « il manque quelque chose à ton canon », vrai, et n'affirme rien sur le moteur. **Tolérable.**

### C — Contrat de sortie IA

Aucune entrée injectée, aucun schéma de sortie consommé, `controlerDossier` reste pure et synchrone. Budget de contexte inchangé. Contrainte aval à écrire une fois : la n° 10 n'injecte jamais `reussi_si_expr` / `reussi_si_texte` / `echoue_si_*` / `camp` ; l'évaluation d'un objectif en session n'a **aucun propriétaire déclaré** dans les huit features du Temps 2.

### D — Divergence documentaire

`docs/PLAN-BASCULE-IA.dc.html` décrit le bloc A · CANON comme contenant « objectifs des camps », « seul bloc toujours présent dans le contexte de l'IA ». `destinations.ts` dit l'inverse depuis la n° 1. Le plan de cible est **périmé** sur ce point ; `destinations.ts` fait foi. À consigner, pas à corriger dans le `.dc.html`. Même remarque pour l'arbitrage n° 5 du plan de cible (« le minimum jouable est un canon **avec un objectif** ») : **c'est la source doctrinale de AC10**, et elle est antérieure aux deux décisions qui la vident.

### E — REJETÉ (à recopier au § 8 du plan)

1. **REJETÉ** — toute prose affirmant que le MODÈLE a besoin des objectifs. Zéro champ `ia` ; la phrase serait fausse et inviterait la n° 10 à injecter `reussi_si_texte`.
2. **REJETÉ** — toute prose affirmant « l'aventure ne peut pas être jouée » / « la partie ne pourra pas se conclure ».
3. **REJETÉ** — ajouter `objectif_atteint` aux `PREDICATES`. Circulaire ; réparer la doctrine en abîmant le schéma.
4. **REJETÉ** — un quatrième mot de `NiveauControle`.
5. **REJETÉ** — semer un objectif dans `construireAmorce` pour garder AC1 à quatre lignes. `camp` est requis sans défaut implicite ; la règle serait éteinte par le seed, pas par l'auteur.
6. **REJETÉ** — exiger « un objectif par camp ». `types.ts` écrit que c'est **DESCRIPTIF**.
7. **REJETÉ** — étendre la règle à `echoue_si_expr` ou en faire une variante d'`objectif-sans-chemin`.
8. **REJETÉ** — fonder le niveau sur « la règle s'allume à t=0 », dans un sens comme dans l'autre.
9. **REJETÉ** — router ce constat vers une section autre que `canon`.
10. **REJETÉ** — affirmer au plan la couleur d'un test sans l'avoir exécuté. Cette note n'affirme que des **lectures de source**.

### F — Point pour l'orchestrateur (hors domaine, signalé non tranché)

AC1 **et** AC2 tombent sous **les deux** niveaux. La contradiction ne se résout pas en choisissant `alerte` : elle se résout en **réécrivant AC1 et AC2 dans le même lot que le code**. Ce que le niveau change, et c'est tout : sous `alerte`, `BADGES_DOSSIER_NEUF[0]` reste `'ALERTE'` et `bascule-editeur` n'est pas rouverte ; sous `bloquant`, elle l'est.

---

## Notes de l'orchestrateur — quatre affirmations passées à la mesure

| Affirmation | Mesure |
|---|---|
| `objectif_atteint` écarté de `PREDICATES`, motif « circulaire » | **VRAIE**, verbatim dans `predicates.ts`. |
| Zéro champ d'`Objectif` d'audience `ia` (7 lignes) | **VRAIE** — `id/camp/reussi_si_expr/echoue_si_expr` = `moteur`, `nom/reussi_si_texte/echoue_si_texte` = `auteur`. |
| `BADGES_DOSSIER_NEUF[0] === 'ALERTE'` (Canon) | **VRAIE** (`dossierEditorScreen.test.tsx` l. 136). **Pivot du rayon inter-features.** |
| `PLAN-BASCULE-IA.dc.html` place « objectifs des camps » dans le bloc toujours injecté | **VRAIE** (l. 108) — et `destinations.ts` la dément. Divergence réelle, à consigner. |

**Conséquence pour l'arbitrage : le motif central de l'`ux-designer` est FAUX.** Son exception nommée repose sur « `objectifs` est l'UNIQUE porteur de victoire/défaite, sans lui aucune section ne peut jamais rendre l'aventure jouable ». La terminaison passe par `charpente.fins[].condition_expr`, qu'aucun objectif ne conditionne. À porter nommément au tour 2 de l'UX.
