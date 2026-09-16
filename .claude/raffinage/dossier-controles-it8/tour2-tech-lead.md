# Tour 2 — `tech-lead` · `dossier-controles` it8

**RISQUE** — Sous la variante capacité, le `path` retenu est DÉJÀ émis par `objectif-sans-chemin` (`controles.ts:891`). C'est légal — `NEUVES` est indexée par RÈGLE, pas par path — mais deux causes partageront une destination de clic : à écrire dans la docstring, pas à corriger. Risque mesuré : la scène `dossierCalme` (`panneauControles.test.tsx:61`) naît de l'amorce (`objectifs: []`) ; sous capacité, la rendre calme exige un objectif dont le `reussi_si_expr` est ACCOMPLISSABLE — candidat `lieu_visite` sur le `LIEU_INITIAL` semé, accomplissable par KR-224. **À MESURER dans le lot, jamais à supposer.**

**OBJECTION** — À la QA, nommément : **je ne signe PAS « la garde KR-197/202 doit être réécrite ».** Elle n'a pas à l'être. L'invariant est la DISCRIMINANCE dans le même test ; « deux entités » en est l'INSTANCE pour les règles par entité. La forme pour une règle de collection est livrée depuis it3, dans le même fichier (`controles.test.ts:349-378`) : (a) intact, (b) muté, (c) **RESTAURÉ**. La mutation du même dossier EST cette forme. Donc deux exigences plutôt qu'un amendement de KR : garder l'étape (c), aller ET revenir ; et sous capacité passer **TROIS** états dans le même test (`[]` → creux → pourvu), sinon le test prouve le cardinal et pas la capacité.

**PROPOSITION** — Prédicat exact : « aucun objectif ne porte ni `reussi_si_expr`, ni `reussi_si_texte` non vide ». `ControleId` renommé **`canon-sans-reussite`**. Frontière à ZÉRO recouvrement, mesurée en A1.

**VERDICT** — recevable sous réserve, inchangé : (a) niveau arbitré avant l'essaim ; (b) `path` mesuré par le lot ; (c) sous `bloquant` seulement, décision actée d'it3 rouverte PAR ÉCRIT. **Aucun veto : ni le niveau ni le périmètre ne sont mon terrain.**

---

## ANNEXE

### A1 — La frontière des trois règles, sur des états concrets

Prédicat : `dossier.canon.objectifs.every(o => o.reussi_si_expr === undefined && (o.reussi_si_texte ?? '').trim() === '')` — **vrai par vacuité sur la collection vide**, d'où la couverture du vide ET du creux par UN seul prédicat.

| état du dossier | `objectif-sans-chemin` | `condition-sans-expr` (pont) | `canon-sans-reussite` |
|---|---|---|---|
| **A** `objectifs: []` (le semis) | muet — boucle vide | muet | **TIRE** |
| **B** 1 objectif `{nom:'', camp, reussi_si_texte:'', echoue_si_texte:''}` — produit exact de `handleAjouter` | muet — pas d'`expr` | muet — `validate.ts:763` saute si la prose est vide | **TIRE** |
| **C** 1 objectif, `reussi_si_texte` NON vide, pas d'`expr` | muet | **TIRE** (alerte, par objectif) | muet |
| **D** 1 objectif, `reussi_si_expr` à feuille inaccomplissable | **TIRE** (bloquant, nomme la feuille) | muet | muet |
| **E** 1 objectif, `reussi_si_expr` accomplissable | muet | muet | muet |
| **F** 2 objectifs : un en **B**, un en **E** | muet | muet | muet — le trou PAR OBJECTIF subsiste, **et c'est voulu** |

**Aucune ligne ne porte deux voyants.** Trois causes disjointes : *rien n'est dit* (collection) / *dit en prose seulement* (entité) / *dit en structure, mais rien ne peut l'accomplir* (entité). **KR-164 tenu par construction, pas par convention.**

**Rejet n° 7 du `narratif-ia` respecté ligne par ligne** : la variante ne lit **jamais** `echoue_si_expr` ni `echoue_si_texte`, et elle n'est **pas** une branche d'`objectif-sans-chemin` — elle est muette sur **tout** état où celle-ci parle (D et E), entrée distincte, remédiation distincte, arité 0-ou-1 contre 0-ou-n.

**Ligne F, assumée et à écrire au § 8** : un objectif creux à côté d'un objectif pourvu reste silencieux. C'est le prix d'une règle de COLLECTION et la contrepartie de R3. La discrimination par entité de ce cas n'a aucun propriétaire déclaré ; elle ne s'invente pas ici.

### A2 — Le nom

Sous la variante capacité, **`canon-sans-objectif` devient mensonger** : sur l'état B il y a un objectif, et le voyant est allumé. Un identifiant qui ment sur son déclencheur est exactement ce que KR-164 interdit.

- `ControleId` : **`'canon-sans-reussite'`** — respecte le gabarit maison `<sujet>-sans-<manque>` des sept entrées existantes.
- `libelle` : **`'Canon sans condition de réussite'`** — la prose reste le terrain du `narratif-ia` / `ux-designer` ; l'identifiant est du contrat.
- **Coût du renommage : zéro appelant de production.** `Controle.id` n'est commuté nulle part hors `controles.ts`. En revanche **AC10 se réécrit**, et l'ordre de déclaration reste **après `objectif-sans-chemin`** (placement mesuré par la QA).

### A3 — KR-222 : ce n'est pas un vol, c'est la livraison

Mesuré verbatim dans `specification.json` : « *…il sépare donc « pas d'_expr MAIS une prose » de « _expr présent », et PAS « ni _expr ni prose » de « _expr présent » — ce troisième cas reste un silence total, et c'est justement celui d'un objectif à peine posé. **La troisième discrimination est la charge de l'itération 6, qui tient la collection (canon sans objectif)**.* »

1. **KR-222 n'attribue PAS la troisième discrimination à une autre itération.** Il l'attribue à « celle qui tient la collection (canon sans objectif) » — **cette charge-ci**, sous son ancien numéro. La variante capacité ne prend rien à personne : elle **livre ce que KR-222 avait planifié**.
2. **La variante CARDINAL, elle, NE livre PAS KR-222.** L'état B — « un objectif à peine posé », décrit mot pour mot par le KR — reste silencieux sous `length === 0`. Choisir le cardinal, c'est laisser ouvert un trou que la spec assigne nommément à cette itération.
3. **Dérive documentaire à corriger à l'étape 4** : « itération 6 » est un numéro périmé (it6 a livré « indice que rien ne racine »). La parenthèse lève l'ambiguïté, le chiffre est faux — à reporter dans `specification.json` et `code-knowledge.json`.

### A4 — Statut de CHACUNE de mes objections du tour 1

| # | Objection | Statut | Motif |
|---|---|---|---|
| O1 | Le rayon d'explosion est le NIVEAU, pas le nombre de fichiers | **MAINTENUE, confirmée par mesure** | QA (exécution) et `narratif-ia` (`BADGES_DOSSIER_NEUF[0]`) : 3 tests sous `bloquant`, **0** sous `alerte`. |
| O2 | Un prédicat qui COMPTE s'éteint sur un objectif CREUX | **MAINTENUE et DURCIE — mais PAS en veto** | Durcie : A3 en fait une non-conformité à KR-222. Pas un veto : « le voyant s'éteint trop tôt » n'est pas sur ma liste. **Je chiffre, je ne bloque pas.** |
| O3 | `'canon.objectifs'` est illégal | **MAINTENUE, établie** | Tranchée pour les trois branches : `path: 'canon.objectifs[].reussi_si_expr'`, clé existante, **zéro amendement de garde**. Mon option 3 du tour 1 est **RETIRÉE par son auteur**. |
| O4 | Convertir les comptes TOTAUX de `seme()` en `pourLaRegle` | **MAINTENUE** | Sinon it9 et it10 rouvrent les cinq mêmes sites. Cas l. 925-932 : convertir **préserve** la discriminance, laisser en total la détruit. |
| O5 | Les `PROSE_*` neuves se posent **au-dessus** de `SITES_AVERTISSEMENT` | **MAINTENUE** | Contrainte mécanique de `BLOC_DES_SITES`, sans débat. |
| O6 | Interdiction d'importer `PREDICATES` / `ExprNode` / `premiereFeuilleInaccomplissable` | **MAINTENUE, plus forte sous capacité** | Lire `o.reussi_si_expr === undefined` est une **présence de clé**, pas une traversée d'arbre. |
| R8 | « jamais l'assertion » n'est pas une échappatoire | **MAINTENUE, SANS OBJET sous `alerte`** | Voir ci-dessous. |

**Sur R8.** Je la **maintiens** telle qu'écrite ; la mesure de la QA ne l'affaiblit pas, elle **en réduit la portée à la seule branche `bloquant`**. `BADGES_DOSSIER_NEUF` est une table de valeurs ATTENDUES ; la requalifier en « littéral injecté » reste une requalification, pas une exemption. Sous `alerte`, aucun fichier de `bascule-editeur` n'est ouvert : la question ne se pose pas. **C'est un argument de plus pour `alerte` — la sortie qui ne rouvre pas une décision actée est celle qui n'a pas à la contourner.**

### B — Le découpage sous chacune des trois branches

**Correction explicite de ma table du tour 1** : j'y gardais deux lots en notant « sous `alerte` L2 n'a qu'un fichier ». Incohérent avec ma propre règle. Je corrige.

**Branche `bloquant`** — 17 tests / 3 fichiers / **2 features** → **2 lots**. L1 `contrat` (`controles.ts` + `controles.test.ts`), seul et en premier ; L2 feature (`panneauControles.test.tsx` + `dossierEditorScreen.test.tsx`). **Préalable non négociable** : la décision actée d'it3 est rouverte **par écrit** avant que L2 existe.

**Branche `alerte`** — 13 tests / 2 fichiers / **1 feature** → **UN SEUL LOT**, marqué `contrat` : `controles.ts` + `controles.test.ts` + `panneauControles.test.tsx`. Porte : `tsc --noEmit` + `jest src/brain/dossier src/features/dossier-controles`. *Motif : un second lot n'aurait ni second agent, ni worktree, ni fusion — et l'unique bénéficiaire du « contrat figé » serait l'agent qui vient de l'écrire. Le découpage révèle le parallélisme, il ne le fabrique pas.*

**Branche « pas de règle »** — **ZÉRO lot**. Arbitrage documentaire ; aucun `.ts` touché → la revue tech-lead et la revue utilisateur sautent (règle de portée par type de fichier). Sortie légitime.

**Invariant commun** — aucun lot n'ouvre : `PanneauControles.tsx`, `ListeControles.tsx`, `SectionNav.tsx`, `DossierEditorScreen.tsx`, `sectionNav.test.tsx`, `destinations.ts`, `sections.ts`, `amorce.ts`, `validate.ts`, `atteignabilite.ts`, `predicates.ts`, `pastilles.ts`, `brain/index.ts`, `__fixtures__/*.json`.

### C — Signature exacte, sous la variante capacité

```ts
// src/brain/dossier/controles.ts — APRÈS 'objectif-sans-chemin', AVANT 'avertissement-de-validation'
'canon-sans-reussite': {
	libelle: 'Canon sans condition de réussite',
	niveaux: ['alerte'],                              // ← LE MOT ARBITRÉ PAR LE COMITÉ
	controler(dossier: Dossier): ConstatControle[],   // 0 ou 1 constat — JAMAIS un par objectif
	remediation(constat: ConstatControle): string,    // constante, ignore le constat
}
```

Le constat : `niveau` · `section: 'canon'` **DÉCLARÉE** (KR-219) · `path: 'canon.objectifs[].reussi_si_expr'` · `location` en CAPITALES · `message` écrit dans le lot · **`entityId` ABSENT**.

Le lot livre en plus, sans quoi `tsc` ou la discriminance cassent : `TEMOINS['canon-sans-reussite']` (total par compilation) et `NEUVES['canon-sans-reussite']` avec son `sections`. **Aucun rapport supplémentaire n'est nécessaire** dans la liste l. 540-555 : `controlerDossier(seme())` y figure déjà et `seme()` porte `objectifs: []`. **Le lot le MESURE, il ne le suppose pas.**

### D — REJETÉ (à recopier au § 8)

R1 à R8 du tour 1 **tous maintenus**, R8 avec la portée précisée. S'y ajoutent :

- **R9 — REJETÉ : amender `estCheminDeChamp`.** Sans objet : la clé existe. **Option retirée par son auteur.**
- **R10 — REJETÉ : réécrire KR-197/202 pour ce cas.** L'invariant est la discriminance dans le même test, pas le cardinal des entités ; la forme collection est livrée depuis it3. On lit la garde au bon niveau, on ne la réécrit pas.
- **R11 — REJETÉ : un test de discriminance qui mute sans RESTAURER.** « Aller » sans « revenir » ne distingue pas une règle d'un blocage global.
- **R12 — REJETÉ : garder le `ControleId` `canon-sans-objectif` sous la variante capacité.** Un identifiant qui ment sur son déclencheur (état B) est KR-164 en sens inverse.
- **R13 — REJETÉ : émettre un constat par objectif creux pour boucher la ligne F.** Arité stable exigée par l'égalité d'ensembles de `NEUVES` ; la ligne F s'écrit au § 8 comme une limite assumée.
- **R14 — REJETÉ : un second lot sous la branche `alerte`.** Cérémonie de contrat pour un seul agent.

### E — Hors de mon vote

Le NIVEAU. Ma seule contribution mécanique, valable pour les trois branches : **la variante capacité est neutre en coût de fichiers**, elle coûte **une mesure de plus** (la fixture calme a besoin d'un `reussi_si_expr` accomplissable) et elle **rend à KR-222 la discrimination que la spec assigne nommément à cette itération**. Le cardinal, lui, la laisse ouverte.

---

## Note de l'orchestrateur

**Citation de KR-222 vérifiée verbatim dans `specification.json`.** Le fait est établi : la spec assigne la troisième discrimination à cette charge. C'est l'argument le plus fort produit par le comité en faveur de la variante capacité, et il ne repose ni sur un goût ni sur une estimation.

**Deux retraits volontaires** dans cette note : l'option « amender `estCheminDeChamp` » (R9) et le découpage en deux lots sous `alerte`. Le tech-lead corrige sa propre table en nommant l'incohérence.
