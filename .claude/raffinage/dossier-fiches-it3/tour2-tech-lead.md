# Tour 2 — `tech-lead` · `dossier-fiches` it3 (contre-lecture)

## Réponses nominales

**À `ux-designer` — je me range, et je retire mon propre risque.** J'ai mesuré ma thèse dans le fichier au lieu de la supposer, et elle est fausse. `couverture.test.ts:328` et `:337` appellent tous deux `fixture()`, qui lit **uniquement** `__fixtures__/dossier-minimal.json`. Le walker ne voit **jamais** un dossier d'auteur. Le « dossier où l'auteur n'a réglé que FO » que j'opposais au Partial n'entre dans aucune des deux gardes : elles ne se contredisent pas. Deuxième mesure : la corruption (`:219`) remplace un nombre par `'du texte a la place'`, que `ENUMERES_FERMES` rejette **quel que soit `requis`** — donc **zéro dispense `LIBRES`, zéro point d'arrêt, dans les deux conceptions**. La « fuite » que j'annonçais n'avait pas de cause.

**Correction en retour sur l'extrait UX** : `const { FO, AG, EN } = personnage.stats ?? {}` **ne compile pas** (`{}` ne porte pas `FO`). Forme qui compile, sans `?? 0` :
```ts
const s = personnage.stats
const pv = s?.FO !== undefined && s.AG !== undefined && s.EN !== undefined ? maxPV({ FO: s.FO, AG: s.AG, EN: s.EN }) : null
```

**À `pm-produit`, D8.** Ma dérivation est l'**inverse** du mécanisme craint : 8 lignes explicites, chacune avec un chemin réel et une instance réelle, sans toucher `validate.ts`, le walker, ni les tables de dispense. Le mécanisme générique, ce serait une ligne porteuse `monde.personnages[].stats` ou un joker. **Je la veto** : `feuillesDeLaFixture` ne rend jamais un objet non vide comme feuille — cette ligne serait **morte le jour où elle est écrite**. it6 reste entier.

**À `qa`, D10.** Convergent, je prends la mesure : `wc -l` avant/après au rapport, coût nul. Aucune extraction ici, déclencheur daté à it4.

## Statut de mes objections du tour 1

| # | Tour 1 | Statut |
|---|---|---|
| RISQUE | les deux gardes se contredisent sur un Partial | **RETIRÉ** — mesuré faux |
| OBJ. 1 | `Partial` + `maxPV` ne compilent pas | **RETIRÉE sur la forme** (le narrowing compile), **maintenue comme risque d'exécution** → test nommé + grep D7 |
| OBJ. 2 | le plancher `1` n'est dans aucune section de `REGLES-DU-JEU.md` | **MAINTENUE**, je me range à D5 : la doc se corrige d'abord, dans le lot contrat |
| PROP. `requis: true` | | **RETIRÉE** → `requis: false` |
| PROP. `STATS_INITIALES` | | **RETIRÉE** |
| PROP. `CARACTERISTIQUE_MIN` dans `dossier/types.ts` | | **MAINTENUE** (D6) |
| Aucune extraction (KR-112) | | **MAINTENUE** + mesure QA |
| 2 lots séquentiels | | **MAINTENU** |

**Veto** : un seul, neuf — la ligne de destination **porteuse / joker** sur `stats`. Aucun autre.

## D1 — ma position finale : `Partial`, `requis: false`

Les deux motifs qui portaient le Record total sont tombés à la mesure, et un troisième, sur **mon** domaine, tranche dans l'autre sens : un `Record` total oblige le **premier clic** à écrire 8 clés, donc à **fabriquer 7 valeurs que l'auteur n'a jamais posées** — et ces 7 valeurs sont d'audience `moteur`, c'est-à-dire des **seuils de jet** que le Temps 2 lira comme des décisions d'auteur. Un PNJ à qui on donne FO=9 hériterait d'AG=1/EN=1 et d'un PV=11 « vrai ». C'est de la donnée de règle inventée dans la source de vérité.

**Le précédent que j'invoquais me contredit une fois lu en entier.** `types.ts:117-130` : `PORTEE_INITIALE` existe **uniquement parce que `portee` est structurellement requise**, et sa docstring avertit qu'une portée au plancher « est un champ que **personne n'a tranché** ». `stats` étant optionnel, rien ne nous force — donc on n'écrit rien.

- `requis: false` sur les 8 lignes (`validate.ts:433`). Bornes et rejet de `0`/`13`/`2.5`/`"3"` restent gratuits sur toute clé **présente**.
- `stats` absent → 0 site (`sitesDe`, `validate.ts:161`).
- L'écran n'écrit jamais `stats: {}` : `{ ...p, stats: { ...p.stats, [carac]: valeur } }` — `...undefined` s'étale à rien.
- **Contrepartie nommée** : rien au schéma n'exige plus qu'un personnage qui se bat ait ses 3 caracs de PV. Question de **suffisance**, propriété de la n° 9. À écrire comme limite.

**D6 confirmé** : `CARACTERISTIQUE_MIN` dans `src/brain/dossier/types.ts`. **Limite écrite** : l'échelle vit alors à deux endroits (MAX dans `characteristics.ts`, MIN dans `dossier/types.ts`). Déclencheur daté : au prochain travail qui touche `characteristics.ts` (n° 9), le MIN y monte et le run de mutation se paie là. QA critère 8 → « non déclenché ».

**D5 retenu** — `docs/REGLES-DU-JEU.md` § 1 entre au lot contrat, **en premier dans le lot**.
**D2 retenu, chiffré** — `Stepper` passe `value: number | undefined`, au lot 1, avec `Stepper.test.tsx` (N).
**D7 retenu, au lot 2** — le test d'affichage de QA ne peut pas attraper une somme réécrite (elle rendrait `22` aussi). Seul le grep le peut, et il doit porter son discriminant.

## Lots finaux proposés

**Lot 1 `contrat`** : `docs/REGLES-DU-JEU.md` (R, en premier) · `dossier/types.ts` (R) · `tables.ts` (R) · `destinations.ts` (R) · `__fixtures__/dossier-minimal.json` (R) · `__fixtures__/dossier-reference.json` (R) · `couverture.test.ts` (R) · `validate.test.ts` (R) · `components/Stepper.tsx` (R) · `components/Stepper.test.tsx` (N) · `brain/index.ts` (R).

**Non touchés, mesuré** : `validate.ts` (0 ligne), `characteristics.ts` (**interdit**), `suffisance.ts`, `sections.ts`, `amorce.ts`, `read.ts`, `roundtrip.test.ts`, `LIBRES`, `SANS_DESTINATION`, `rules.golden.test.ts`.

**Lot 2 `feature`** : `FichePersonnage.tsx` (R) · `PanneauPersonnages.tsx` (R) · `panneauPersonnages.test.tsx` (R) · `fichePersonnage.test.tsx` (N).

**Hors lots** (étape 4 des Build Steps, orchestrateur) : `specification.json`, `code-knowledge.json`, `CHANGELOG.md`, `features_history.json`, `README.md`, `ROADMAP-BASCULE-IA.md`, `package.json`.
