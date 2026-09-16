# Tour 2 — tech-lead — dossier-controles it7

**Réponse nommée à l'UX** (« aucune fonction du dépôt ne rend une phrase française d'un `ExprNode` »). Exacte pour le **prédicat**, **fausse pour la cible** : `collectIds(dossier)` (exporté par `identifiers.ts`, **déjà importé par `controles.ts`**) rend `location` = « Indice « … » », pré-rédigé. Manque le seul libellé du prédicat, que `PREDICATES[p].label` porte. Et l'arité 2 ne casse pas un gabarit unique si la liste est **en apposition** plutôt qu'en complément d'objet.

**C4 — je retire la moitié refusante de ma note.** Mon motif (« les faits bloquants sont en nombre quelconque ») est **importé à tort** de `MESSAGE_INDICE_SANS_RACINE` : là-bas les amonts sont de cardinal libre, ici le verdict bottom-up produit **exactement une** feuille témoin. **Un refus juste sur un motif faux ne tient pas deux tours.** Mécaniquement : nommer la feuille n'exige **aucun champ neuf** sur `ConstatControle` (`message: string` est déjà libre). Le coût réel est ailleurs : la signature L1 doit rendre **la feuille**, pas un booléen. Je change donc **ma propre** proposition (REJETÉ n° 18).

**C3 — pas de collision.** Mon REJETÉ d'it6 n° 8 interdit de **fabriquer un témoin** dans la fixture ; la QA demande de **réparer un défaut d'auteur réel**. Objets différents, les deux tiennent. Coût mesuré : **13 suites** la lisent, aucune n'épingle un compte que le site retenu déplace.

**Objection tour 1 (7 lignes, 4 tautologiques) : MAINTENUE, non durcie.**

**C1/C5 — je recommande (b), 1 lot.**

---

## ANNEXE A — Découpage FINAL, deux hypothèses

### (a) AVEC `canon-sans-objectif` — 2 lots séquentiels

L1 `productibilite` (`atteignabilite.ts` + test) ; L2 `regles-objectif` (`controles.ts` + test + `__fixtures__/dossier-reference.json` + `panneauControles.test.tsx` + `dossierEditorScreen.test.tsx`). **Mais** L2 nomme des fichiers de **deux features** — signal de coupe, et c'est mon seul argument d'architecture contre (a).

### (b) SANS `canon-sans-objectif` — **1 lot**

| # | Lot | Marque | Fichiers |
|---|---|---|---|
| **L1** | `objectif-sans-chemin` | **contrat**, seul | R `atteignabilite.ts` · R `atteignabilite.test.ts` · R `controles.ts` · R `controles.test.ts` · R `__fixtures__/dossier-reference.json` |

**Ce qui SORT sous (b)** : les deux fichiers de test de features (**0 feature touchée**), et côté `controles.test.ts` les lignes **504 / 520-522 / 567 / 1222-1228** (toutes attachées à `seme()`), plus l'AC1 du plan — **l'objection PM disparaît entièrement, aucune réécriture d'AC**. `:488` passe 6→**7** au lieu de 6→8 ; `NEUVES` / `TEMOINS` gagnent **1** témoin au lieu de 2.

**KR-226 tient-elle sous (b) ? OUI, mesuré.** `objectif-sans-chemin` déclare seule `section: 'canon'` + `path: 'canon.objectifs[].reussi_si_expr'` ⇒ `path.split('.')[0] === section` ⇒ le prédicat de `controles.test.ts:421` devient **insatisfiable** sur elle. La réécriture en table épinglée reste **forcée et exercée** par cette seule règle. **Perdre `canon-sans-objectif` ne coûte rien à KR-226.**

**Pourquoi 1 lot et non 2 sous (b)** : 5 fichiers, `brain/` seul, deux lots seraient `contrat` donc séquentiels — le découpage ne révélerait aucun parallélisme, seulement une frontière de diff.

## ANNEXE B — Signature EXACTE exposée par L1

`atteignabilite.ts`, **ne sort PAS du baril** :

    export interface FeuilleInaccomplissable {
    	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
    	readonly predicat: string
    	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
    	readonly cibles: readonly string[]
    }

    export function premiereFeuilleInaccomplissable(
    	dossier: Dossier,
    	condition: ExprNode,
    ): FeuilleInaccomplissable | null

`null` **=** accomplissable. Docstring imposée : « Satisfiabilité, pas évaluation — aucun état de session lu ; l'évaluation en session appartient à la n° 9. SENS D'ERREUR : le FAUX NÉGATIF — dans le doute on rend `null`, seule direction permise sous une règle bloquante. Totale sur un arbre accepté par `validateExpr` ; AUCUNE borne de récursion propre — c'est `PROFONDEUR_MAX_EXPR` chez le validateur qui la lui garantit. »

Traversée **bottom-up**, déterministe par ordre du document : `predicat` → table ; `et` → la feuille du **premier** enfant non `null` ; `ou` → `null` dès qu'**un** enfant rend `null`, sinon la feuille du **premier** ; `non` → **`null` sans descendre**.

**Privé à L1** : `EtatDuDossier { dossier, indicesProduits, objetsDonnes }` et `ETABLISSEMENT: Record<PredicatId, (etat, cibles) => boolean>`.

**Consommé par L2** : `premiereFeuilleInaccomplissable` **seule**. `controles.ts` n'importe ni `PREDICATES`, ni `ExprNode`, ni `producteursParIndice` pour cette règle — il reçoit du **français** et des **identifiants**, résout l'entité par `collectIds` / `localiserEntite` (déjà à sa portée) et écrit la prose.

**Gabarit de message, arité 1 ET 2, un seul patron** (apposition, pas complément d'objet — c'est ce qui règle l'objection UX sans article à accorder) :

> « Cette condition de réussite exige « {predicat} » — {cibles → location, jointes par ', '} —, et rien dans ce dossier ne peut le produire. »

- arité 1 → « … exige « possède l'objet » — Objet « Le sceau de cendre » —, et … »
- arité 2 → « … exige « le personnage a déjà révélé l'indice » — Personnage « Corvin le marchand », Indice « La lettre de la vigie » —, et … »

Mesuré contre `TERMES_INTERDITS` : **aucun n'y entre**. Le mot « prédicat » du gabarit UX passerait aussi ; je propose de l'éviter (terme de schéma), **sans veto** — le registre de langue appartient à l'UX.

## ANNEXE C — C3, la fixture : mesure complète

**Le fait de la QA est confirmé** : l'unique `donner_objet` du fichier (l.319) vise `objet.amulette-scellee`. C'est un **défaut d'auteur réel** que la règle expose — un **succès** de l'instrument, pas un faux positif.

**Lecteurs réels : 13 suites, pas 8** — brain (`validate`, `suffisance`, `couverture`, `controles`) et features (`dossier-fiches` ×2, `dossier-registres` ×5, `dossier-objets` ×2).

| site candidat | coût **mesuré** | it8-proof ? |
|---|---|---|
| **`charpente.jalons[0].effet`** | **zéro** : `validate.test.ts:105` épingle `jalons[0].effet` mais sur la **minimale** ; `couverture` ne fait que des `toContain` ; `suffisance:247-267` dérive de `CHEMINS_DE_DELTAS` (booléen déjà vrai) ; `panneauJalonsFins.test.tsx:420-459` **entièrement relatif** | **OUI** — ce jalon porte un `declencheur_expr` (l.372) |
| `charpente.jalons[1].effet` | zéro à it7 | **NON** — pas de `declencheur_expr` : it8 le rallumera. Planter un défaut daté |
| `monde.evenements[0].resolutions[0].consequence` | **non mesuré** — `panneauEvenements.test.tsx:305-354` peuple un `Select` dont la population bouge. Meilleur ajustement narratif | sans objet |
| `monde.quetes[0].recompense` | **ROUGE, 2 assertions** | — |
| `monde.conditions.climat[].effets_regles` | contredit `CIBLE_CLIMAT_EXCLUE` | — |

**Recommandation** : `charpente.jalons[0].effet`, seul site à zéro épingle mesurée **et** immunisé à it8. Tout autre site exige un run **avant** d'être écrit au plan.

**Ce qui ne bouge pas, quel que soit le site** : `producteursParIndice` ne lit que `reveler_indice` + savoirs + `mene_a` — un `donner_objet` n'ajoute aucune source d'indice.

## ANNEXE D — Statut de mon objection de tour 1

**MAINTENUE, non durcie.** Le narratif l'a mesurée indépendamment. Deux rôles convergents, donc pas de veto, mais une **exigence de forme** — « 7 identifiants représentés » ne dit rien de ce que la règle **décide** :

> L'épingle n'est pas `Record<PredicatId, Temoin>` seul, mais **`Record<PredicatId, 'mord' | 'constante-vraie'>` épinglé valeur par valeur**, dans le test. Totale par compilation (8ᵉ prédicat ⇒ `tsc` rouge) **et** totale par valeur (it8 faisant passer `jalon_atteint` / `evenement_consomme` de `'constante-vraie'` à `'mord'` **rougit** au lieu de glisser en silence).

Sans cette seconde moitié, le nom de la règle promet toujours plus que ses assertions — la définition même de KR-199.

## ANNEXE E — REJETÉ NEUFS (les 12 du tour 1 restent, n° 7 amendé)

13. **REJETÉ — réparer la fixture via `monde.quetes[0].recompense`.** Mesuré : `panneauQuetes.test.tsx:301` porte en dur « 2 récompenses » et `:323` épingle `recompense` à **3** — la réparation ferait 4 et rougirait dans une **seconde feature** qu'aucun lot ne possède.
14. **REJETÉ — donner un `declencheur_expr` à `jalon.second-guet`.** `panneauJalonsFins.test.tsx:285-290` s'appuie **nommément** sur son absence.
15. **REJETÉ — réaligner `controles.test.ts:1235-1246` sur un `objectif-sans-chemin` de la référence.** Ce serait épingler un défaut d'auteur comme état normal du dossier de référence.
16. **REJETÉ (n° 7 AMENDÉ) — un champ STRUCTURÉ neuf sur `ConstatControle`** (état illégal représentable, arbitrage d'it6 reconduit). **N'est PAS refusée** : la composition du `message` existant à l'émission — `message: string` est déjà libre.
17. **REJETÉ — que `controles.ts` importe `PREDICATES` ou `ExprNode`.** Le libellé est résolu par L1, qui possède le registre. Sinon la couture d'it6 (« conclut et raconte, ne compte pas ») cède au premier message.
18. **REJETÉ (ma propre proposition de tour 1) — `conditionAccomplissable(…): boolean`.** Un booléen rend l'exigence UX inatteignable sans une **seconde traversée** — deux traversées, deux vérités, exactement le risque du narratif.
19. **REJETÉ — un lot dédié à la fixture.** Elle est nommée par le seul lot qui allume la règle qui s'y voit.
20. **REJETÉ — 2 lots sous l'hypothèse (b).** Le découpage ne révélerait aucun parallélisme.

## VERDICT

**recevable sous réserve.** Aucun veto. Trois réserves, toutes tenables dans le lot : **(1) périmètre** — je recommande **(b)** pour un motif d'architecture, pas de produit ; **(2) signature** — `premiereFeuilleInaccomplissable(…) : FeuilleInaccomplissable | null` ; **(3) fixture** — réparation dans le lot, site `charpente.jalons[0].effet`.

**Rien de ce que j'écris sur une couleur de test n'est déduit** : chaque ligne de l'annexe C nomme le fichier et la ligne mesurés, et les deux cases non mesurées y sont marquées « non mesuré ».
