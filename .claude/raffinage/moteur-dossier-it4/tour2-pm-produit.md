# TOUR 2 — `pm-produit` — `moteur-dossier` it4

```
RÉPONSE À   — QA, « VETO CIBLÉ sur le critère n° 11 », et C.5 qui sortirait en `NON VÉRIFIÉ`.
              Fond retenu, conclusion corrigée : C.5 ne sort ainsi que si le document n'est PAS
              amendé dans l'itération. Or le `narratif-ia` le met dans le lot qui supprime
              `playExport.ts`, phrase exacte écrite. C.5 devient un constat de revue ; le veto
              tombe par ce geste, pas par un test.

MES OBJECTIONS —
  O1 goal sous-mesuré (10 fichiers nommés, ~22 réels) : MAINTENUE, renforcée par R1 — « les
     parties arbre d'`actionEngine` » est un ensemble mesuré VIDE.
  O2 orphelins et `persist.ts` sans statut écrit : MAINTENUE, FORME RÉDUITE. Le tech-lead a
     mesuré que ce n'est pas ~1 380 l. mais TOUT `src/player/` (~4 400 l.) : ma table § 0 bis à
     quatre lignes devient fausse par omission, et le roadmap n'a que 536 o de marge. UNE ligne
     la remplace.
  Coupe 4a/4b : RETIRÉE.

PROPOSITION —
  C1 — je retire 4a/4b, `N` reste 4. La LETTRE de mon engagement n'est pas déclenchée (il n'a
       pas livré deux lots) ; son OBJET l'est : N=1 fait disparaître la seconde dérogation au
       lieu de la déroger. Et M-4 tranche contre moi — ma coupe mettait le lot `contrat` en
       SECOND, soit la dérogation que je fuyais. Motif substitué accepté.
  C6 — pas de veto : côté dossier la règle n'a AUCUN porteur aujourd'hui (`EtatSession` n'a pas
       `heros`), l'auteur ne perd rien. Mais le bandeau `REGLES-PLAY.md` entre AU LOT (23ᵉ
       fichier), et la fiche de validation porte la ligne. EN ÉCHANGE je retire le témoin
       `extinctionArbre.test.ts` (22ᵉ) : vert par construction.
  C8 — tranche HORS CYCLE AVANT it4, jamais absorbée.

VERDICT     — recevable sous réserve
```

## A. C1 — retrait, et pourquoi il est honnête

L'engagement portait sur « deux lots séquentiels dans une seule itération sans seconde dérogation ».
Le tech-lead a fait N=1. **La lettre n'est pas déclenchée. Retrait quand même**, pour deux motifs
meilleurs que la lettre : (1) **l'objet de la coupe est atteint** — à N=1 la règle est vraie par
vacuité, or c'était le seul motif de la coupe ; (2) **M-4 réfute la proposition sur son propre
terrain** — l'intuition de partitionnabilité était juste (`tsc` exit 0), et c'est justement parce
qu'elle est juste que la mesure va au bout : la coupe achète **zéro parallélisme** et met le lot
`contrat` en **second**, produisant la dérogation qu'elle prétendait éviter.

**Note de forme pour le § 8** : le plan doit porter la **substitution de motif**, pas seulement la
conclusion. Un `N=1` justifié par « la fermeture est connexe donc indivisible » est un refus juste
sur une prémisse fausse, et il cède au premier contradicteur (BUG-080). Motif retenu : *« les deux
lots sont strictement séquentiels — la coupe n'achète aucun parallélisme et fait passer le lot
`contrat` en second »*. `N` reste **4** (le `N=5` du tour 1 est annulé).

## B. C6 — pas de veto, mais pas gratuit

**Pas de veto** : mesuré, `EtatSession` n'a pas de `heros` avant la n° 11 (`session.ts:117`), donc
`PE_PER_TRANSITION` **n'est appliqué à aucun dossier aujourd'hui** — il ne vit que sur le chemin
arbre, dont le tour 1 a mesuré qu'il n'a **aucun point d'entrée en production**. it4 ne retire pas
une règle à l'auteur : elle retire la dernière implémentation d'une règle sur un chemin déjà mort
pour lui. Un veto ici serait un veto de vocabulaire.

**Deux exigences quand même** : (1) `docs/REGLES-PLAY.md` **entre au lot** (bandeau § A du
`narratif-ia`, tel qu'écrit) — le lot qui rend une phrase fausse est celui qui la corrige ; (2) **la
fiche de validation porte la ligne** : *« deux règles du jeu (`REGLES-DU-JEU.md` § Endurance A4/E3,
`REGLES-PLAY` B3) n'ont plus d'implémentation dans `src/` ; propriétaire : n° 11 »*. Un bandeau au
milieu d'un document de règles n'est pas lu par la porte 2 humaine ; la fiche, si.

**Contrepartie retirée** : le témoin `extinctionArbre.test.ts` (fichier 22). **Le lot reste à 22
fichiers.** Le trou n'existe pas : C.2 et C.4 couvrent ce que le grep prétendait couvrir. Position
produit : **it4 ne crée aucun fichier de test neuf.**

## C. C8 — it4 attend. Tranche hors cycle `outillage-3`, bornée.

**(b), avant it4.** Trois motifs : (1) **le coût d'attendre est nul pour l'auteur** (jalon
d'ingénierie sans démo), alors que le coût de *mélanger* est réel — la seule preuve d'it4 à la porte
2 **est une lecture de diff** (22 fichiers, aucune capture), et un diff qui mêle démolition et
réparation d'outillage n'est plus lisible en deux minutes ; (2) **le défaut n'appartient pas à la
n° 9** — il bloque tout ouvrier de toute tranche à venir, et si it4 est revert la porte repart en
panne ; (3) **le précédent est nommé** (`B1`, `B2`, `B3`).

Phrase : **« tout worktree neuf rend la porte verte »**. Bornes : la cause mesurée **et** le
recensement des autres tests atteints, **mesurés, jamais supposés** ; rien d'autre, pas de CI.
**Réserve produit** : un réglage local par ouvrier (`core.autocrlf=false` dans son worktree) **n'est
pas un correctif** — c'est reporter le défaut sur le prochain, et ce n'est écrit nulle part.
**Coût : it4 glisse de `0.7.4` à `0.7.5`.**

## D. C7 — le désaccord est plus petit qu'il n'en a l'air

`tech-lead` R4 dit « pas dans le **lot** » ; QA C.6 dit « dans **it4** ». **Compatibles** : l'étape 4
des Build Steps est *dans* it4 et *hors* des lots. Il y a deux gestes, pas trois.

- **Docstring `moteurSansIA.test.ts:39` → geste de doc de l'étape 4**, mesure **datée et ventilée par
  racine**. Commentaire seul, zéro assertion, R4 tient. Motif : le total redevient **47** après
  démolition sur une composition différente (13/8/26 vs 23/9/26) — une fausseté qui redevient juste
  **par coïncidence** n'est plus corrigible par lecture.
- **`PLANCHER_PAR_RACINE` → REPORTÉ n° 10.** Durcir un instrument dans une démolition est le mélange
  « faire marcher / rendre robuste » que la skill signale ; et le rétrécissement d'it4 est mesuré,
  ventilé, relu — **ici le garde est la revue, pas le plancher**. La n° 10 ajoute une 4ᵉ racine et
  devra re-dériver de toute façon.

## E. C5 — **trois** modules hors liste : `types`, `creatureTypes`, `monsterCapacities`

QA (A.5) et `narratif-ia` (§ C) concordent par deux mesures indépendantes ; le cadrage à 2 est faux.
Les phrases de remplacement du `narratif-ia` (l. 9 et fin de l. 49) sont **validées telles quelles**.

## F. Refus motivés — statut au tour 2, à recopier au § 8

> **REJETÉ (PM) — MAINTENU ET RENFORCÉ** — « le goal d'it4 tel qu'il est écrit peut entrer au plan » : il nomme 10 fichiers là où la fermeture en exige ~22, **et** sa formule « les parties arbre de `sessionEngine` / `actionEngine` / `usePlaySession` » désigne pour `actionEngine.ts` un ensemble **mesuré vide** (M3 : 0 occurrence sur 346 lignes). Phrase de portée non mesurée entrant dans un plan — ce que KR-258 interdit depuis BUG-124. Le goal se réécrit sur la fermeture mesurée **et** cesse de nommer `actionEngine`, faute de quoi l'ouvrier arbitrera seul les 12 fichiers non nommés et ouvrira 346 lignes pour rien.

> **REJETÉ (PM) — MAINTENU** — « la fermeture à ~22 fichiers est un élargissement de périmètre » : conséquence mécanique de la demande. Un périmètre borné aux 10 fichiers nommés laisse `tsc` rouge, donc ne livre rien.

> **REJETÉ (PM) — MAINTENU, FORME RÉDUITE** — « les modules laissés sans consommateur restent décrits au § 0 bis comme "conservés, BRANCHÉS SUR L'ÉTAT DE SESSION" » : faux dans le commit même d'it4. Le tech-lead a mesuré **tout `src/player/`, ~4 400 lignes**. **Ma table à quatre lignes du tour 1 est fausse par omission, je la retire** au profit d'**une seule ligne** : *« depuis l'itération 4 de la n° 9, `src/player/` n'a plus aucun consommateur de production : ses modules restent sur disque sans producteur d'interface, leur couverture ne vaut plus garantie d'usage ; repreneur des écrans et du runtime : n° 10 ; de `combatEngine` et de ce qui en dépend : n° 13 »*. Motif de la réduction : le roadmap est à **536 o de son plafond** (M-3).

> **REJETÉ (PM) — MAINTENU, non contesté** — « `persist.ts` se range parmi les orphelins conservés » (§ 0 bis:58) : consommateur unique mort, `PLAY_SESSION_KEY_PREFIX` dupliqué sous un « must stay in sync (KR-134) » que plus personne n'exécutera, remplaçant livré depuis it2. Il se **supprime**. Ce n'est pas un orphelin en attente de repreneur, c'est un **second chemin de persistance** face à un port déjà livré.

> **REJETÉ PAR AVANCE (PM) — MAINTENU** — « découper it4 pour lui fabriquer deux phrases de démo » : tranché au cadrage ; le retrait de 4a/4b ne le rouvre pas.

> **RETIRÉ PAR SON AUTEUR (PM) au tour 2 — la coupe 4a / 4b.** L'engagement n'est pas déclenché à la lettre (le tech-lead a proposé un lot unique, pas deux lots) mais l'est dans son objet : à N=1 la règle « lot `contrat` seul et en premier » est vraie **par vacuité**, et c'était le seul motif de la coupe. M-4 l'achève : la partition **compile** (donc le motif de connexité est faux et ne doit pas entrer au plan), mais les deux lots sont **strictement séquentiels** — zéro parallélisme, et le lot `contrat` passerait **second**. `N` reste **4**.

> **REJETÉ (PM) — NOUVEAU** — « it4 absorbe la réparation de la porte rouge en worktree neuf (M-5) ». Défaut **antérieur** à it4, bloquant **tout** ouvrier de **toute** tranche, n'appartenant pas à la n° 9. L'absorber mêle démolition et outillage dans un diff dont la lecture **est** la seule preuve d'it4 à la porte 2, et fait partir la réparation avec un éventuel revert. Retenu : tranche hors cycle **`outillage-3`** — *« tout worktree neuf rend la porte verte »* — **avant** it4, précédents `B1`/`B2`/`B3`, portant la cause mesurée **et** le recensement des autres tests lisant leurs propres sources, **mesurés jamais supposés**. it4 glisse à `0.7.5`.

> **REJETÉ (PM) — NOUVEAU** — « le témoin `play-mode/tests/extinctionArbre.test.ts` entre au lot ». Mesuré par la QA : zéro occurrence **avant toute démolition** — vert par construction, pouvoir séparateur nul, strictement plus faible que `tsc --noEmit` et que la résolution de modules de jest (mesurée **rouge** sur 4 suppressions simulées). Retenus à la place, à coût zéro en fichiers : C.2 et C.4. **it4 ne crée aucun fichier de test neuf.** Ce retrait est la contrepartie de l'entrée de `docs/REGLES-PLAY.md` : le lot reste à 22 fichiers.

> **REPORTÉ à la n° 10 (PM)** — le durcissement `PLANCHER_PAR_RACINE`. Diagnostic juste (plancher global de 20 sur base 58 = 65 % de perte tolérée) mais geste au mauvais moment : durcir un instrument dans une démolition mélange « faire marcher » et « rendre robuste », et le rétrécissement d'it4 est **mesuré, ventilé et relu** — ici le garde est la revue. **La correction de la docstring l. 39 n'est PAS reportée** (geste de doc, étape 4).

## G. Décisions prises en autonomie faute de spécification

- **Placement de la réparation M-5** → tranche hors cycle **avant** it4 → si l'inverse, la porte 2 lit un diff mêlant 22 fichiers de démolition et une réparation d'outillage, et un revert d'it4 remet la porte en panne pour toutes les tranches suivantes.
- **Version** → it4 glisse à `0.7.5` → si on refuse, deux tranches sous un même PATCH.
- **Forme de l'amendement § 0 bis** → **une ligne** au lieu d'une table → si l'inverse, le roadmap franchit son plafond (536 o) et déclenche une compaction **dans** un lot de démolition.
- **Contenu de la fiche de validation** → ligne de fermeture mesurée **et** ligne « deux règles du jeu sans implémentation, propriétaire n° 11 » → si l'inverse, l'humain valide la disparition d'une règle du jeu sans la lire.
- **Couple ajout/retrait** → `REGLES-PLAY.md` entre, `extinctionArbre.test.ts` sort, 22 fichiers constants → si on garde les deux, le lot passe à 23 dont un instrument sans pouvoir séparateur.
- **`N`** → revient à **4**.
