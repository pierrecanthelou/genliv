# Tour 1 — `tech-lead` · `dossier-controles` it8 (`canon-sans-objectif`)

**RISQUE** — Le rayon d'explosion n'est pas un nombre de fichiers, c'est le NIVEAU. `GRAVITE`/`plusGrave` (`controles.ts:957-963`) : Canon porte DÉJÀ `alerte` sur un dossier neuf, donc un constat `alerte` ou `info` laisse `parSection.canon` INCHANGÉ et ne touche AUCUN fichier de `bascule-editeur`. Seul `bloquant` renverse trois assertions (`dossierEditorScreen.test.tsx` l. 137, 392, 412) plus la prose l. 130-134 — exactement la modification que la décision actée interdit. **Le prix du mot se mesure avant de le choisir.**

**OBJECTION** — Une règle qui COMPTE les objectifs s'éteint sur un objectif CREUX : `handleAjouter` (`ObjectifsCanon.tsx:223`) pose `{nom:'', reussi_si_texte:'', echoue_si_texte:''}` ; `objectif-sans-chemin` reste muette (pas d'`expr`) et `condition-sans-expr` aussi (proses vides). **Un clic fait passer `jouable` à vrai sur un dossier tout aussi injouable** — le BLOQUANT devient une formalité. Second point, mécanique : AC10 n'a aujourd'hui AUCUN `path` légal. `estCheminDeChamp` (`controles.test.ts:293-296`) exige `cle.startsWith(chemin + '.')` ; toutes les clés sont `canon.objectifs[]…`, donc `'canon.objectifs'` rend `false`.

**PROPOSITION** — (1) Tirer sur la CAPACITÉ, jamais sur le compte : « aucun objectif ne porte de condition de réussite structurée », `path: 'canon.objectifs[].reussi_si_expr'` (clé existante, zéro garde amendée), arité 0-ou-1, `entityId` absent, `location` en capitales. **Couvre le vide ET le creux.** (2) Dans L1, remplacer les comptes TOTAUX sur `seme()` (l. 302, 575, 591, 932, 1013) par `pourLaRegle` : sinon it9 et it10 rouvriront ces cinq sites. (3) Deux lots, pas plus.

**VERDICT** — recevable sous réserve : (a) AC1/AC2 contre AC10 arbitré AVANT l'essaim ; (b) le `path` mesuré par un jest ciblé, jamais déduit ; (c) `dossierEditorScreen.test.tsx` possédé par un lot UNIQUE — ou niveau non bloquant, et il n'est pas touché du tout.

---

## ANNEXE

### A1 — Par COLLECTION ou par ENTITÉ ? Le contrat le supporte, sans état illégal représentable

`ControleDescripteur.controler(dossier): ConstatControle[]` porte déjà une règle de collection : `depart-desert` (`controles.ts:704`). Le matériau ABSENCE est prévu : `ConstatControle.location` a **deux formes documentées** (l. 86-91 : champ en CAPITALES, ou entité résolue par `localiserEntite`) et `entityId` est **optionnel** (l. 103). Donc **arité 0-ou-1**, `location` en capitales, `entityId` absent, `section: 'canon'` DÉCLARÉE (KR-219). Aucun champ neuf, aucun type modifié — le lot `contrat` n'ouvre aucune signature exportée.

La table `NEUVES` (`controles.test.ts:437-466`) est indexée **par règle** puis par path : deux règles peuvent épingler le même path. Mais l'égalité d'ensembles l. 481-483 impose une **arité de paths stable** — un seul path produit, jamais un path conditionnel.

### A2 — Quel `path` pour un constat qui ne désigne aucune entité

`'canon.objectifs'` est **illégal aujourd'hui** : les sept clés sont `canon.objectifs[].id|nom|camp|reussi_si_expr|reussi_si_texte|echoue_si_expr|echoue_si_texte`, aucune ne commence par `canon.objectifs.`. Le test `les path sont des cles de DESTINATION_DES_CHAMPS` (l. 535-569) rougirait. **Dérivé de la source, à MESURER par le lot avant d'écrire.**

Trois sorties, par ordre de préférence :

1. **`'canon.objectifs[].reussi_si_expr'`** — clé EXISTANTE, zéro amendement, et **exacte** sous la variante « capacité ». Recommandée.
2. `'canon.objectifs[].id'` — clé existante, zéro amendement, mais le OÙ ment un peu.
3. Amender `estCheminDeChamp` pour accepter `cle.startsWith(chemin + '[]')`. À ne prendre que si le comité refuse 1 et 2, et avec **deux** témoins négatifs conservés.

### A3 — Les gardes de source qui lisent `SOURCE_CONTROLES`

| Garde | l. | Touchée ? |
|---|---|---|
| `not.toContain("split('.')")` | 491, 1275 | **Non** — la règle ne lit aucun segment de chemin. |
| `not.toContain(MARQUEUR_A_ECRIRE)` + `toContain('MARQUEUR_A_ECRIRE')` | 588-589 | **Non** — mais **la boucle du même test (591-593) rougit** : elle exige que TOUT contrôle du dossier semé porte la marque. → restreindre à `pourLaRegle(..., 'amorce-non-redigee')`. |
| `not.toContain('.errors')` + `toContain('.warnings')` | 607-608 | **Non** — et la règle neuve ne doit appeler `validateDossier` ni dans un sens ni dans l'autre. |
| `BLOC_DES_SITES` (10 clés ; `code` par site) | 1170-1178, 1199-1207 | **Non**, à une condition mécanique : les gardes **tranchent la source** entre `const SITES_AVERTISSEMENT` et `function cheminDeTable`. **Les constantes `PROSE_*` de la règle neuve se posent AU-DESSUS de `SITES_AVERTISSEMENT`.** |
| couture it6 (`./predicates`, `./expr`, `ExprNode`) | 1616-1622 | **Non**, et c'est une contrainte de conception : lire `objectif.reussi_si_expr === undefined` est une **présence de clé**, pas une traversée d'arbre. Interdit d'importer `PREDICATES`/`ExprNode` ou d'appeler `premiereFeuilleInaccomplissable`. |

Hors gardes de source, les lignes de base t=0 du même fichier rougiront (l. 302, 575, 591-593, 932, 1013). Elles appartiennent à L1, mais doivent être **converties en comptes PAR RÈGLE** (`pourLaRegle`), sinon it9 et it10 rouvriront les mêmes sites. Cas notable : l. 925-932, où le compte total sert de **discriminant** à la garde de vacuité de `depart-desert` — le convertir **préserve** la discriminance, le laisser en total la détruit. Enfin le commentaire l. 1603-1607 devient **faux** dès que la doctrine bouge : il se réécrit **dans L1**.

### A4 — Encapsulation

- La **prose** appartient à `controles.ts`. `panneauControles.test.tsx` matche un **fragment distinctif**, **jamais** la phrase recopiée.
- La remédiation **nomme une surface possédée par `dossier-canon`**. C'est de la prose, licite, mais le libellé se **relit dans le fichier réel**. **Aucun import** depuis `dossier-canon` : veto immédiat.
- L2 ne recalcule **jamais** `jouable` (KR-013).
- Fixture calme d'AC2 : un objectif créé **comme l'UI le crée** éteint `canon-sans-objectif` **sans rien allumer d'autre** — `condition-sans-expr` ne parle que si le jumeau en prose est non vide. Sous la variante « capacité », il faut en plus un `reussi_si_expr` ; `jalon_atteint` est `() => true` donc silencieux, **mais c'est une valeur datée « non évaluée à it7 »** — à mesurer dans L2, pas à supposer.

### B — Découpage en lots

**Deux lots. Listes strictement disjointes. L1 est `contrat` et part seul, en premier.**

| Id | Titre | Type | Fichiers | Ordre |
|---|---|---|---|---|
| **L1** | La règle au registre + la ligne de base t=0 du contrat | **`contrat`** | R `src/brain/dossier/controles.ts`<br>R `src/brain/dossier/controles.test.ts` | **seul, en premier** |
| **L2** | La ligne de base des surfaces | feature | R `src/features/dossier-controles/tests/panneauControles.test.tsx`<br>R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` *(UNIQUEMENT si le niveau retenu est `bloquant` ; sous `alerte`/`info` L2 n'a qu'un fichier)* | après L1 figé |

**Porte isolée** — L1 : `tsc --noEmit` + `jest src/brain/dossier`. L2 : `jest src/features/dossier-controles src/features/bascule-editeur`.

**Pas de parallélisme à révéler** : deux lots, quatre fichiers, aucune logique en L2 — **un seul ouvrier en deux temps**, pas de worktree. Ouvrir un essaim ici coûterait plus que le travail.

**Hors lots (étape 4, écrite par l'orchestrateur)** : `specification.json` (dont `design_contract.etat_vide`, qui devient faux), `code-knowledge.json`, `CHANGELOG.md`, `features_history.json`, `docs/ROADMAP-BASCULE-IA.md`.

**Fichiers qu'aucun lot ne doit ouvrir** : `PanneauControles.tsx`, `ListeControles.tsx`, `SectionNav.tsx`, `DossierEditorScreen.tsx`, `sectionNav.test.tsx`, `destinations.ts`, `sections.ts`, `amorce.ts`, `validate.ts`, `atteignabilite.ts`, `pastilles.ts`, `brain/index.ts`, `__fixtures__/*.json`.

**Signal de coupe, traité** : sous `bloquant`, l'itération touche deux features. La décision actée prévoit ce cas (zéro logique métier, lot unique en exclusivité) — mais la moitié « **jamais l'assertion** » est **enfreinte** : il faut un arbitrage écrit, pas un glissement.

**Si le comité choisit de NE PAS livrer la règle** : L1 et L2 disparaissent, it8 devient un **arbitrage documentaire à zéro lot** et la tranche passe à it9. **Sortie légitime, pas un échec.**

### C — Signatures exactes

```ts
// src/brain/dossier/controles.ts — après 'objectif-sans-chemin', avant 'avertissement-de-validation'
'canon-sans-objectif': {
	libelle: 'Canon sans objectif',
	niveaux: ['bloquant'],            // ← LE MOT ARBITRÉ PAR LE COMITÉ
	controler(dossier: Dossier): ConstatControle[],   // 0 ou 1 constat — JAMAIS un par objectif
	remediation(constat: ConstatControle): string,    // constante, ignore le constat
}
```

Le constat, épinglé par L1, consommé en littéral par L2 : `niveau`, `section: 'canon'` (DÉCLARÉE), `path: 'canon.objectifs[].reussi_si_expr'`, `location` en capitales, `message` écrit dans L1, `entityId` **absent**.

L1 doit aussi livrer : l'entrée `TEMOINS['canon-sans-objectif']` (l. 504, `Record<ControleId, Dossier>` total par compilation — `tsc` casse sans elle), l'entrée `NEUVES['canon-sans-objectif']` avec son `sections`, et un rapport déclencheur dans la liste l. 540-555 (sinon la discriminance l. 559 rougit).

L2 CONSOMME `controlerDossier(dossier).controles` et `.parSection` — et n'écrit aucun littéral du contrat autre que le **mot de niveau** et un **fragment distinctif** du message.

### D — REJETÉ (à recopier au § 8 du plan)

- **R1 — REJETÉ : ajouter une clé `canon.objectifs` à `DESTINATION_DES_CHAMPS`** pour légaliser le `path`. Cette table dit une AUDIENCE par CHAMP, pas un inventaire de conteneurs ; sa garde l'écrit (l. 290-291). On n'élargit pas une table de contrat pour satisfaire un test.
- **R2 — REJETÉ : un second `ControleId`, ou un discriminant sur `ConstatControle`,** pour séparer « collection vide » de « objectif creux ». Une seule cause ; un discriminant sur `ConstatControle` est exporté par le baril — état illégal représentable, déjà refusé à it6 et it7.
- **R3 — REJETÉ : émettre un constat PAR OBJECTIF creux.** Deux voyants pour une cause, doublon avec `condition-sans-expr` (KR-217 en sens inverse), et l'égalité d'ensembles de `NEUVES` exige une arité stable.
- **R4 — REJETÉ : extraire une abstraction « règle de collection » partagée avec `depart-desert`.** Deux appelants, aucun troisième annoncé — abstraction à un seul usage réel = dette. (Biais tech-lead assumé et surveillé.)
- **R5 — REJETÉ : un troisième lot « composants ».** Le registre est Open/Closed, aucune surface n'est touchée. Un lot sans fichier de production est un lot faux.
- **R6 — REJETÉ : que L2 recopie le `message` ou la `remediation`.** Encapsulation — un fragment distinctif suffit, un texte recopié dérive en silence.
- **R7 — REJETÉ : scinder L2 en deux lots pour paralléliser.** Aucun parallélisme réel ; et la décision actée exige **un lot unique** qui possède le fichier de l'autre feature.
- **R8 — REJETÉ : « on complète le littéral injecté, jamais l'assertion » comme échappatoire ici.** `BADGES_DOSSIER_NEUF` est une **table de valeurs attendues**, pas un littéral injecté — la modifier, c'est modifier l'assertion. Sous `bloquant`, la décision actée doit être **rouverte et réécrite**, pas contournée par une requalification.

### E — Ce qui reste ouvert (candidat `ESCALADE`)

AC1 + AC2 contre AC10 : trois critères, deux vrais au plus. **Arbitrage produit, pas technique** — je ne vote pas, je chiffre :

| option | prix |
|---|---|
| `bloquant` | 1 décision actée rouverte + 3 assertions + 1 docstring dans `bascule-editeur` + ~5 lignes de base t=0 |
| `alerte` | 0 fichier hors `brain/` + `dossier-controles`, mais `jouable` reste vrai sur un dossier sans objectif |
| pas de règle | 0 lot, report à it9 |
