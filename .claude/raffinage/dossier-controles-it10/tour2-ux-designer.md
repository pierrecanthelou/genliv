# Tour 2 — UX Designer (contre-lecture)

> **Note de l'orchestrateur (tour 3)** — cette note a été écrite **en parallèle** de celle du tech-lead, donc **sans** sa mesure de tour 2 : `PanneauDepart.tsx:146` commite `charpente.depart.lieu_id`, si bien qu'un geste réel EXISTE sur la polarité `nie = false`. La `remediation` proposée ici est en conséquence **fausse sur cette polarité**. Voir le registre des désaccords du plan, ligne D-3.

## Le désaccord frontal — réponse nommée à **narratif-ia** (§ C Q1, § F)

Narratif-ia écrit : la remédiation « doit nommer des écrans **producteurs**, jamais l'éditeur de condition ».

**Je ne peux pas suivre cette consigne : elle serait fausse.** `objectif-sans-chemin` contrôle la **satisfiabilité** — et là, nommer un producteur est un vrai remède. Notre règle contrôle une **valeur à t=0**. Sur l'unique témoin réel (mesure A), l'inventaire est vide à t=0 par construction (H5) : qu'on pose un producteur au tour 3, au tour 10 ou nulle part ne change **rien** à la valeur évaluée au tour 0. Une remédiation « donnez cet objet par une récompense de quête » affirmerait qu'un geste répare le défaut, alors qu'aucun geste situé après l'ouverture ne le peut. C'est BUG-090 sous une forme **inversée** : pas une surface fictive, mais une surface réelle dont l'effet, ici, est fictif.

Sur narratif : son § A/H6 et son § D **confirment** ma position plutôt qu'ils ne la contredisent — c'est justement parce que rien avant le premier tour n'est déterminé par un producteur en aval que la remédiation « producteur » est catégoriquement inapplicable ici.

## Réponse nommée — **tech-lead**, point (a) : la polarité du témoin

Tech-lead a raison : sur mesure A la phrase doit dire l'absence. Mais je refuse d'insérer mécaniquement « ne … pas » dans le libellé du prédicat — **vérifié en source** (`predicates.ts`) : les sept libellés n'ont pas la même charpente grammaticale. « possède l'objet », « se trouve dans le lieu » sont des verbes nus (négation triviale) ; mais « le jalon est atteint », « le lieu a été visité », « l'événement a déjà eu lieu », « le personnage a déjà révélé l'indice » portent déjà sujet et auxiliaire — y insérer « ne … pas » par position casserait la syntaxe (« ne le jalon est atteint pas »). Aucune règle de position n'est sûre pour les sept, et `controles.ts` reçoit une **chaîne opaque**, pas un arbre.

**Ma solution, sûre pour les sept** : ne jamais toucher la grammaire interne du libellé. Le nommer entre guillemets, toujours positif, et affirmer sa valeur de vérité **à côté** :

> `Cette condition d'échec porte sur le fait « ${predicat} » — ${localisations.join(', ')} — qui est ${nie ? 'déjà faux' : 'déjà vrai'} avant que le joueur ait agi.`

Sur mesure A : *« Cette condition d'échec porte sur le fait « possède l'objet » — Objet « Le sceau de cendre » — qui est déjà faux avant que le joueur ait agi. »* — dit exactement l'absence, sans jamais fléchir un verbe que je ne maîtrise pas. Ce gabarit consomme `predicat`, `cibles`, `nie` tels que tech-lead les a posés.

## (b) Ma formule échappe-t-elle à la clause `PROSE_CANON_SANS_VICTOIRE` ?

Vérifié en source (`controles.ts` l. 519-525) : la clause interdit de nommer « Objectifs → Condition de réussite », un libellé de **CHAMP** qui prétend qu'un endroit édite la condition structurée alors qu'il n'édite que de la prose.

**Ma formule y échappe, pour trois raisons vérifiées :**
1. Je ne nomme qu'un niveau de **section** — « Canon → Objectifs des camps » — exactement la référence que `PROSE_CANON_SANS_VICTOIRE.remediation` emploie elle-même, jamais un libellé de champ.
2. Le verbe est « revoyez » (reconsidérer), jamais « corrigez »/« donnez »/« dites ». `ObjectifsCanon.tsx` l. 71-86 ne porte que `nom`, `camp`, `reussi_si_texte`, `echoue_si_texte`, jamais `echoue_si_expr` — ma phrase dit d'abord et explicitement qu'**aucune** écriture n'y est possible.
3. La phrase nomme cet écran comme un lieu où **RETROUVER** l'objectif (par `nom`/`camp`, visibles), jamais comme un lieu qui répare `echoue_si_expr`.

## (c) Le libellé de la neuvième règle

**`libelle: "Objectif perdu à l'ouverture"`** — même charpente que ses huit voisines (entité + qualificatif d'état). Dette de « zéro lecteur » reconduite, pas créée par moi.

---

## Statut de mes objections de tour 1

- **OBJECTION (niveau `alerte`, jamais `bloquant`)** — **MAINTENUE**, renforcée : tech-lead et narratif-ia arrivent à la même conclusion par un raisonnement indépendant du mien. PM conditionne `bloquant` à une preuve de remédiation existante — son propre critère retombe sur `alerte`. Convergence des quatre rôles : pas matière à veto.
- **RISQUE (remédiation circulaire / fuite de « tour zéro »)** — **MAINTENUE comme vigilance**, satisfaite par le texte définitif : zéro mot de `TERMES_INTERDITS`, zéro « tour zéro » littéral.
- **Proposition « message »** — **amendée, pas retirée** : le fond tient, la forme change pour porter la polarité `nie`.
- **Proposition « remediation »** — **maintenue et durcie** contre la lecture « ajoutez un producteur ».
- **Point non tranché de tour 1 (Q3 → silence si indécidable)** — confirmé sans changement par tech-lead et narratif.

---

## ANNEXE — contrat de design

Aucun fichier d'UI touché. Ce contrat porte les DEUX chaînes littérales de `controles.ts`, consommées par les primitives existantes (`ListeControles.tsx` → `Badge` / `pastilleNiveau` / `controleRemediation`, déjà tokenisées, déjà clavier-natives).

**`libelle`** : `"Objectif perdu à l'ouverture"`
**`niveaux`** : `['alerte']`

**Fonction de message** (dans `controles.ts`, aucun import de `predicates.ts`/`expr.ts` — couture d'it6 intacte) :

```ts
function messageObjectifPerduAOuverture(
	predicat: string,
	nie: boolean,
	localisations: readonly string[],
): string {
	const etat = nie ? 'déjà faux' : 'déjà vrai'
	return `Cette condition d'échec porte sur le fait « ${predicat} » — ${localisations.join(', ')} — qui est ${etat} avant que le joueur ait agi.`
}
```

Rendu sur mesure A : « Cette condition d'échec porte sur le fait « possède l'objet » — Objet « Le sceau de cendre » — qui est déjà faux avant que le joueur ait agi. »

Les rendus restent grammaticaux pour les sept prédicats sans qu'aucune règle de position n'ait dû être écrite par prédicat.

**`remediation`** *(proposée ; **arbitrée et remplacée** au tour 3 — voir la note d'orchestrateur en tête)* :

```ts
const REMEDIATION_ECHEC_A_L_OUVERTURE =
	"Aucun écran ne permet aujourd'hui de donner un point de départ à l'inventaire du héros ni de modifier cette condition d'échec — et un moyen de l'obtenir plus tard dans l'aventure n'y changerait rien, puisque cette condition est déjà vraie avant que le joueur ait agi. Revoyez si cet objectif doit vraiment être perdu dès la première scène (Canon → Objectifs des camps)."
```

**`location`** : `localiserEntite('objectif', objectif, index)`
**`path`** : `'canon.objectifs[].echoue_si_expr'`

**Registre de langue** — vérifié contre `controles.test.ts:1647` : zéro occurrence de `↪`, `_texte`, `_expr`, `si_bloque`, `revele_si`, `réimport`, `bloquant`, `warning`, `error` ; zéro « tour zéro » littéral ; `message` = indicatif présent, sujet = le document ; `remediation` = impératif 2ᵉ personne du pluriel, sujet = l'auteur.

**État vide** : sans objet. **Clavier** : aucun changement de surface interactive.

**Hors de mon terrain, non repris** : le découpage en un seul lot, la trivalence, le nom du module, le témoin dédié de mesure C.
