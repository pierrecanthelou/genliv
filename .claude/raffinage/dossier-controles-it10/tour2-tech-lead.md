# Tour 2 — Tech Lead (contre-lecture)

## 1. Réponse nommée — **narratif-ia, Q2** : « dans `atteignabilite.ts` »

Tu écris : *« Un troisième lecteur d'arbre fait rougir la garde de couture, et le faire admettre coûterait le durcissement complet pour un gain nul. »*

**« Le durcissement complet »** n'est pas un coût, c'est le livrable. Ce que la garde exige d'un lecteur sémantique — `switch` unique, `default: jamaisEvalue(noeud)` à paramètre `never`, `noeud: ExprNode` lu en source — est exactement ce qu'on veut que la nouvelle sémantique porte.

**« Pour un gain nul »** — c'est là que je te contredis mécaniquement. Sous cohabitation, `expr.test.ts:404` et `:416` **restent verts** — et c'est précisément le problème. `lecteurs` est un **recensement de FICHIERS**, pas de sémantiques. Deux sémantiques logées dans un fichier déjà recensé entrent sans que rien n'en prenne acte : la nouvelle traversée hérite gratuitement des marques de sa voisine (`noeud: ExprNode` l. 436, le `: never` d'`aucunVerdict`), **sans qu'aucune assertion ne porte sur ELLE**. Le recensement devient faux en silence — le mode de panne exact que cette garde a été écrite pour empêcher.

Ton argument revient donc à : *évitons de rougir, en rendant le census faux*. Un test qu'on garde vert en lui cachant son sujet ne mesure plus rien — famille BUG-084, appliquée non au matcher mais au périmètre.

**Sur le reste, nous convergeons sans réserve** : trivalence Kleene, tir sur le certain-vrai seul, H6 (je reprends ta rédaction telle quelle, seule la domiciliation change), portée `echoue_si_expr` seul, correction de la mesure D « on corrige, on n'efface pas », KR-227 porté à trois lignes, et ta § E que je signe intégralement.

**Je ne durcis PAS Q2 en veto** : mon terrain est isolation / contrat brain contourné / duplication de SSOT / dépendance croisée / détail d'implémentation à distance. La cohabitation n'en déclenche aucun. Q2 est une question de **placement** : elle s'arbitre au tour 3.

## 2. (a) Un module qui doit annoncer ses DEUX questions : POUR ou CONTRE ?

**CONTRE. Sans esquive — c'est le diagnostic, pas le remède.**

Un nom de module est un contrat de prédiction : il dit au lecteur suivant ce qu'il trouvera **sans ouvrir le fichier**. Le jour où l'en-tête doit énumérer les questions, le nom a cessé de prédire. Le narratif propose la phrase d'en-tête *parce que* le nom ne suffit plus — la nécessité du remède mesure la gravité du mal.

La contre-objection légitime serait la **cohésion**. Le test n'est pas le sujet, c'est le **partagé privé** : la valuation t=0 n'appelle ni `producteursParIndice`, ni `objetsDonnesDe`, ni `porteOuverte`, ni le point fixe. Les deux fonctions ne partagent que `ExprNode` et `PREDICATES` — **deux contrats publics**. Deux fonctions qui ne partagent que du public ne sont pas un module : ce sont deux modules dans un fichier.

Effet de second ordre que le narratif a nommé sans le rattacher : sa § E liste comme dérive n° 3 « un paramètre de mode sur une traversée unique ». C'est exactement le refactor qu'un lecteur futur applique à **deux traversées quasi jumelles et adjacentes dans le même fichier**. Deux fichiers rendent ce refactor visiblement faux. La séparation est ce qui **rend la dérive que le narratif redoute coûteuse au lieu de naturelle.**

## 3. (b) Mon motif n° 3 — je le fais tomber moi-même

**Mon motif n° 3 est FAUX tel qu'écrit, et je le retire.** J'avais écrit : « la garde compte par fichier ; deux `switch` dans un même fichier passent avec un `: never` mal placé. » J'ai relu `expr.test.ts:418-428`. Le test dit **le contraire** — son commentaire est « **UNE FERMETURE PAR AIGUILLAGE, et non une par FICHIER** », et l'assertion est `fermetures >= aiguillages`. J'ai attribué à la garde le défaut qu'elle a explicitement corrigé (BUG-080, y compris quand le contradicteur est moi).

**Ce qui survit, exactement.** La garde **compte**, elle n'**apparie** pas : les deux comptes sont globaux au fichier. À **n = 1 aiguillage**, compter et apparier **coïncident**. À **n ≥ 2**, la relation est strictement plus faible — deux `: never` **n'importe où** la satisfont, y compris deux issus d'**une seule** fermeture : une signature `function jamaisEvalue(_operateur: never): never` produit **deux** appariements de `/:\s*never\b/g`. Un fichier à deux `switch` dont un seul est fermé serait alors **vert**. Le trou n'est pas ouvert aujourd'hui (`atteignabilite.ts:634` écrit `: null`) ; il s'ouvre à la seconde traversée. *NON MESURÉ : lecture de regex.*

**Ma position tient-elle sans lui ? Oui — sur quoi, rangé par force :**
1. **Le recensement rendu faux en silence** (§ 1). Jambe mécanique qui **remplace** le motif n° 3 et est plus solide : elle porte sur la **véracité de ce que la garde atteste**.
2. **L'absence de machinerie partagée**, mesurée ligne à ligne — SRP instrumenté par une mesure, pas par un goût.
3. **Le bloc d'en-tête** : sa ligne 7 s'intitule « HYPOTHÈSES DATÉES D'**ATTEIGNABILITÉ** ». H6 n'en est pas une. L'y insérer rend le **titre** faux — même forme que KR-227, et la mesure D est la **preuve debout** qu'une phrase fausse survit trois itérations dans **ce bloc précis**. Récidive mesurée, pas crainte.
4. **Mon ancien motif n° 1** (« le fichier refuse cette question en toutes lettres ») — **RETIRÉ comme argument de poids** : une docstring se réécrit.

**Ce que je ne retiendrai PAS** : la taille. KR-112 vise « component/hook », et `controles.ts` vit à 1211 lignes sans violation. Signal, pas mécanisme.

## 4. Réponses nommées — QA et UX

**QA** — ton objection sur le pouvoir séparateur de la mesure C est **exacte et je l'adopte**. Elle invalide un **appui du cadrage**, pas une conclusion — la distinction de BUG-087. Une correction sur ta proposition (1) : `non(lieu_courant_est(départ))` SEUL porte une assertion **négative** (code juste → silence). Un instrument à assertion négative est le plus faible (BUG-084). Il faut **le couple** — § 8.

**UX** — ta remédiation dit « Aucun écran ne permet aujourd'hui de donner un point de départ à l'inventaire du héros ni de modifier cette condition d'échec ». **J'ai mesuré qu'elle est fausse sur une des deux polarités** : `src/features/dossier-canon/components/PanneauDepart.tsx:146` porte `label="LIEU DE DÉPART"`, un `Select` qui **commite `charpente.depart.lieu_id`** ; la section existe au registre (`sections.ts:89`, `{ num: 2, id: 'depart', titre: 'Départ' }`). Quand la feuille certain-vraie est `lieu_courant_est(départ)`, **il y a un geste réel, et il résout**. Je ne touche pas tes mots — je te rends la **contrainte**, § 7.

## 5. Statut de chacune de mes objections du tour 1

| # | objection | statut |
|---|---|---|
| O1 | La règle est l'**inverse** d'`objectif-sans-chemin` ; le témoin porte une **POLARITÉ** (`nie`) | **MAINTENUE**, **étendue** : la polarité commande aussi le *choix* de remédiation (§ 7) |
| O2 | Q2 présuppose une machinerie partagée ; il n'y en a aucune | **MAINTENUE** — mesure contredite par personne |
| R1 | REJETÉ — loger l'évaluation t=0 dans `atteignabilite.ts` | **MAINTENUE, motif RÉVISÉ** : motif n° 3 retiré, motif n° 1 dégradé, remplacés par « le recensement devient faux en silence » + « le titre du bloc H devient faux ». **Pas de veto.** |
| R2 | REJETÉ — verdict bivalué + hypothèse datée sur `lieu_visite` | **MAINTENUE** — quatre rôles convergent |
| R3 | REJETÉ — exporter `Trivalent` | **MAINTENUE** |
| R4 | REJETÉ — un témoin sans champ `nie` | **MAINTENUE, DURCIE** : sans `nie`, `controles.ts` ne peut ni composer une phrase juste ni **refuser** la remédiation « écrans producteurs » avec un motif |
| R5 | REJETÉ (hors terrain) — élargir aux `fins` | **MAINTENUE** ; PM et narratif concluent pareil par trois chemins |
| — | Ne pas prendre la tranche `chore` ici | **MAINTENUE**, incontestée |
| — | Mon motif n° 3 | **RETIRÉE — par moi**, motif faux (§ 3) |

## 6. (c) Le nom — tranché

**`src/brain/dossier/tourzero.ts`** (et `tourzero.test.ts`). Minuscules, un seul mot : convention des 19 fichiers voisins, aucune collision.

1. **`ouverture` abandonné** : collision avec `charpente.depart.texte_ouverture_joueur` et avec l'amorce.
2. **`valuation.ts` / `evaluation.ts` refusés** : trop larges — un nom qui promet d'évaluer *en général* est l'invitation au `mode:` que le narratif classe en dérive n° 3.
3. **`tourzero` nomme un MOMENT, pas une capacité** : un module nommé d'après un instant n'absorbe pas gracieusement une seconde question. Le nom fait le travail que l'en-tête ferait sinon.
4. C'est déjà le vocabulaire du dossier (cadrage, H6, QA, ma signature `premiereFeuilleVraieAuTourZero`).

**Réserve tenue, et elle est d'UX** : « tour zéro » **n'apparaît dans aucune chaîne adressée à l'auteur**. Nom de fichier et de symbole, jamais une phrase de constat.

## 7. (d) Le champ `nie` : ce qu'il suffit à composer, et ce qu'il ne suffit pas

**La contradiction est réelle, et `nie` la rend lisible — mais elle ne se résout pas du côté du témoin. Elle se résout en refusant la contrepartie n° 3 du narratif.**

Sous la table trivaluée, les deux polarités **ne sont pas symétriques** :

- **`nie = false`** — feuille certain-**VRAIE** à t=0. Par construction, la **seule** feuille de cette espèce est `lieu_courant_est(cible)` avec `cible === charpente.depart.lieu_id`. **Un geste réel existe et résout** : `PanneauDepart.tsx:146`, section `Départ`.
- **`nie = true`** — feuille certain-**FAUSSE**, rendue vraie par un nombre impair de `non`. **Aucun écran producteur ne peut jamais la réparer, par construction** : tous les producteurs agissent **pendant** la partie, la condition est lue **avant le premier tour**.

**Réponse directe à la contrepartie n° 3 du narratif** : **elle est irréalisable sur `nie = true`, et il ne faut pas essayer.** Ce ne serait pas une consigne *circulaire* (BUG-090) — ce serait une consigne **fausse**, donc pire : actionnable, suivie, et sans effet. `nie` permet de le **refuser avec un motif**.

**Faut-il davantage — « le fait manque » vs « le fait est déjà là » ?** Non : **cette distinction EST `nie`, dite en français.**

**Ce que `nie` ne suffit PAS à composer** : la **remédiation** ne le reçoit pas. La signature est `remediation: (constat) => string`, et `ConstatControle` porte `{ niveau, section, message, location, path, entityId }` — **pas la polarité**. Trois issues, une seule tient :

- re-dériver la polarité **depuis la chaîne `message`** → **VETO**, § Encapsulation (famille `querySelector`/`designationDe`) ;
- ajouter un champ à `ConstatControle` pour **un seul** appelant → dette ;
- **deux entrées de registre** → doublerait l'empreinte, ferait passer la garde `:1647` de « huit » à « **dix** », et la seconde entrée **n'aurait aucun témoin réel**.

**Donc : UNE entrée, UN `remediation` constant, vrai sous les DEUX polarités ; le `message` paramétré porte la polarité.** Contrainte rendue à UX : sa chaîne ne peut affirmer « aucun écran ne permet aujourd'hui… » (faux sur `nie = false`), ni nommer « l'inventaire du héros » (la feuille peut être un indice, un événement, un savoir de PNJ). Elle doit nommer un **lieu de relecture** valable dans les deux cas. Les mots restent à UX ; la contrainte est mécanique.

Le `message`, lui, **doit nommer la feuille** — pour une raison mécanique : c'est la seule chose qui justifie la **garde de silence sur les cibles non résolues** (`objectif-sans-chemin`, l. 1015-1020). Un message générique rendrait `FeuilleVraieAuTourZero` **entièrement non consommé** — un booléen déguisé en interface.

## 8. (e) Pour la QA — les deux implémentations fautives, ligne remplacée par ligne

*Couleurs ci-dessous **NON MESURÉES** — c'est le mandat de la QA.*

**FAUTE 1 — « tous les prédicats sont faux au tour zéro ».** Dans `VALEUR_AU_TOUR_ZERO` :
`lieu_courant_est: (dossier, cibles) => (cibles[0] === dossier.charpente.depart.lieu_id ? 'vrai' : 'faux'),`
→ `lieu_courant_est: () => 'faux',`

**FAUTE 2 — le `non` de Kleene effondré en négation bivaluée.** Dans `verdictAuTourZero`, `case 'non'` :
`const valeur: Trivalent = enfant.valeur === 'vrai' ? 'faux' : enfant.valeur === 'faux' ? 'vrai' : 'indecidable'`
→ `const valeur: Trivalent = enfant.valeur === 'vrai' ? 'faux' : 'vrai'`

| témoin (`echoue_si_expr`, SEUL) | code juste | FAUTE 1 | FAUTE 2 | assertion |
|---|---|---|---|---|
| **T1** `lieu_courant_est(<départ>)` | **TIRE**, `nie = false` | silence | TIRE | **positive** |
| **T2** `non(lieu_courant_est(<départ>))` | silence | **TIRE** (faux positif) | silence | négative |
| **T3** `non(lieu_visite(<un lieu>))` | silence | silence | **TIRE** (faux positif) | négative |
| **T4** `non(possede_objet(X))` — mesure A, **existe déjà** | **TIRE**, `nie = true` | TIRE | TIRE | positive — ne sépare **rien** |

Croisement à vérifier (leçon BUG-087) : **T1 laisse FAUTE 2 verte**, **T3 laisse FAUTE 1 verte**, et **T4 — le seul témoin réel du dépôt — ne sépare rien**. T4 prouve la **valeur attendue** ; T1/T2/T3 prouvent le **pouvoir séparateur**.

**Où vivent ces témoins** : T1, T2, T3 dans **`tourzero.test.ts`**, sur des `Dossier` fabriqués — **jamais** dans les deux fixtures partagées.

---

# ANNEXE — DÉCOUPAGE DÉFINITIF

## Un seul lot

Tous les fichiers de code vivent dans `src/brain/dossier/`. Un lot qui touche `brain/` est `contrat` et s'exécute **seul et en premier** ; **deux lots `contrat` ne peuvent pas être tous deux premiers.** Zéro fichier d'UI. **Exécution séquentielle, sans worktree ni fusion.**

*Pourquoi pas L1a « module » / L1b « règle » : L1b ne **compile pas** sans `tourzero.ts`, donc ne franchit pas la porte isolément ; et il touche `controles.ts`, donc serait `contrat` lui aussi.*

| id | titre | contrat | fichiers |
|---|---|:---:|---|
| **`L1`** | **L'échec au tour zéro** | **OUI** | **N** `src/brain/dossier/tourzero.ts`<br>**N** `src/brain/dossier/tourzero.test.ts`<br>**R** `src/brain/dossier/expr.test.ts`<br>**R** `src/brain/dossier/controles.ts`<br>**R** `src/brain/dossier/controles.test.ts`<br>**R** `src/brain/dossier/atteignabilite.ts` — **commentaires SEULS, zéro ligne de code**<br>*(hors code, même lot)* **R** `src/features/dossier-controles/specification.json` · **R** `code-knowledge.json` · **R** `CHANGELOG.md` · **R** `docs/ROADMAP-BASCULE-IA.md` |

**Deux temps, la porte passée AUX DEUX** (précédent it6) :
- **Temps 1 — le module et sa garde.** `tourzero.ts` + `tourzero.test.ts` ; **rejouer `expr.test.ts` ROUGE d'abord** ; puis réécrire le recensement ; puis les corrections de commentaire d'`atteignabilite.ts`.
- **Temps 2 — la règle.** 9ᵉ entrée de `CONTROLES`, prose, témoin, ligne de base.

## Signatures exactes

```ts
// ── src/brain/dossier/tourzero.ts — CE QU'IL EXPOSE ───────────────────────────
export interface FeuilleVraieAuTourZero {
	/** Libellé FRANÇAIS du prédicat — `PREDICATES[id].label`, résolu ICI. Jamais la clé. */
	readonly predicat: string
	/** Les identifiants visés, DANS L'ORDRE de `refKinds`. Arité 1 ou 2. */
	readonly cibles: readonly string[]
	/** La feuille est sous un nombre IMPAIR de `non` : le fait établi est son ABSENCE. */
	readonly nie: boolean
}

/**
 * La feuille qui rend la condition VRAIE au tour zéro — `null` quand elle est
 * fausse OU indécidable. Pure, totale, sans mémoïsation (KR-013/113).
 */
export function premiereFeuilleVraieAuTourZero(
	dossier: Dossier,
	condition: ExprNode,
): FeuilleVraieAuTourZero | null
```

```ts
// ── PRIVÉ au module, jamais exporté ───────────────────────────────────────────
type Trivalent = 'vrai' | 'faux' | 'indecidable'

/** UN SEUL aiguillage, donc UNE SEULE fermeture. Retour `Verdict`, PAS `never` :
 *  `: never` en position de retour produirait un SECOND appariement de la garde
 *  `/:\s*never\b/g` et fausserait son compte (§ 3 du tour 2). */
interface Verdict { readonly valeur: Trivalent; readonly temoin: FeuilleVraieAuTourZero | null }
function verdictAuTourZero(dossier: Dossier, noeud: ExprNode, nie: boolean): Verdict
function jamaisEvalue(_operateur: never): Verdict

/** TOTAL par compilation (KR-117) : un huitième prédicat ne compile pas. */
const VALEUR_AU_TOUR_ZERO: Record<PredicatId, (dossier: Dossier, cibles: readonly string[]) => Trivalent>
```

**CONSOMMÉ** : `PREDICATES` / `PredicatId` · `ExprNode` (arbre **déjà accepté** par `validateExpr`) · `Dossier` (**un seul champ lu** : `charpente.depart.lieu_id`).
**NON consommé, et c'est la mesure qui tranche Q2** : aucun symbole d'`atteignabilite.ts`. Zéro import entre les deux modules, dans les deux sens.

### La table, ligne par ligne

| ligne | valeur à t=0 | champ du document qui la détermine (discipline H6) |
|---|---|---|
| `possede_objet` | `'faux'` | inventaire vide à l'ouverture — `Depart` n'en porte aucun (**H5 ; 3ᵉ ligne de KR-227**) |
| `indice_connu` | `'faux'` | `indices_connus` part vide |
| `pnj_a_revele` | `'faux'` | `pnj.<id>.a_dit[]` part vide |
| `evenement_consomme` | `'faux'` | `evenements_consommes` part vide |
| `jalon_atteint` | `'indecidable'` | **aucun** — deux écrivains, dont un `declencheur_expr` que la n° 9 pourrait résoudre à t=0 |
| `lieu_visite` | `'indecidable'` | **aucun** — statut du lieu de départ tranché nulle part |
| `lieu_courant_est` | `'vrai'` ssi `cibles[0] === dossier.charpente.depart.lieu_id`, `'faux'` sinon | `charpente.depart.lieu_id` — **la ligne qui interdit le faux positif** |

**Kleene** : `non` V↔F, `?`→`?` · `et` F si une F, V si toutes V, `?` sinon · `ou` V si une V, F si toutes F, `?` sinon. La règle ne tire que sur racine `= 'vrai'`. `nie` bascule à chaque `non` et est **posé à la feuille**.

### Réécriture de `expr.test.ts` — durcissement, jamais desserrage

`const TOUR_ZERO = 'tourzero.ts'`, puis :
- l. 404 → `expect(lecteurs).toEqual([ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE, TOUR_ZERO])` — **le lot trie explicitement les deux côtés** ;
- l. 416 → `expect(semantiques).toEqual([ATTEIGNABILITE, TOUR_ZERO])` ;
- boucle d'appariement (l. 423-428) **inchangée**, sur **deux** sujets à **un** aiguillage chacun ;
- **ajout** `expect(source(TOUR_ZERO)).toContain('noeud: ExprNode')` ;
- **intouchés** : l'unicité du lecteur d'`unknown` (l. 435) et la dérivation de l'exemption depuis la frontière de typage (l. 412).

### Ce que `controles.ts` reçoit

9ᵉ entrée, `path: 'canon.objectifs[].echoue_si_expr'` (**déjà clé de `DESTINATION_DES_CHAMPS`**, `destinations.ts:141` — `destinations.ts` **n'est pas touché**), `section: 'canon'`, garde de silence sur les cibles non résolues via `collectIds`.

Couture `controles.test.ts:1936` : un `from './tourzero'` ne l'enfreint **ni en lettre ni en esprit**. **Consigne** : écrire `const condition = objectif.echoue_si_expr` — **inféré**, jamais annoté. À ajouter : `expect(SOURCE_CONTROLES).toContain('premiereFeuilleVraieAuTourZero')`.

**Gardes qui bougent** : `controles.test.ts:522` · `~:593` · `:1590` (**seul mouvement : référence 11 → 12**) · `:1647` (« huit » → « **neuf** ») · `expr.test.ts:404/416`.

**Placement de la prose, vérifié** : la 9ᵉ prose se pose auprès de `PROSE_CANON_SANS_VICTOIRE` (l. 526), **avant** `SITES_AVERTISSEMENT` (l. 597) — **hors** de la fenêtre `indexOf` des deux gardes de la tranche `chore`.

### KR-227 — liste fermée devenue fausse

KR-227 énonce « **CES DEUX LIGNES, et elles seules** ». La cellule `possede_objet → 'faux'` en est une **troisième**. À livrer ici : KR-227 amendé (« trois lignes ») dans `specification.json` **et** `code-knowledge.json`, et l'hypothèse **domiciliée dans `tourzero.ts`** (rédaction H6 du narratif, reprise telle quelle).

**Mesure D** corrigée dans le même geste — **commentaires uniquement**. Y ajouter une ligne de renvoi croisé vers `tourzero.ts` : seul lien entre les deux modules, en prose, pas en import.

## Vérification de mon propre veto — aucun déclencheur

Isolation : **zéro fichier de feature touché**. Contrat `brain/` contourné : non. SSOT dupliquée : non. Dépendance croisée : n'existe **dans aucun sens**. Détail d'implémentation à distance : **un seul risque, fermé** — re-dériver la polarité depuis la chaîne `message`, interdit nommément au plan.

## Affirmations NON MESURÉES de cette note

1. `expr.test.ts:404` et `:416` rougissent à l'arrivée d'un troisième lecteur — **lecture d'assertion**, à rejouer **rouge avant** réécriture.
2. La signature `(_op: never): never` produit **deux** appariements de `/:\s*never\b/g` — **lecture de regex**.
3. Le tableau T1–T4 — **déduction**, mandat de la QA.
4. La ligne de base ne bouge que sur la référence (11 → 12) et `jouable` ne change sur aucun des trois — **déduction**. Si confirmé, **Q1 n'a aucune conséquence sur le découpage** : je n'y ai pas de terrain.

**VERDICT tour 2 — recevable sous réserve.** Réserves : trivalence Kleene ; champ `nie` ; message paramétré nommant la feuille ; remédiation **unique** et vraie sous les deux polarités ; KR-227 à trois lignes ; mesure D corrigée dans ce lot. **Aucun veto.** Q2 reste ouvert : je maintiens `tourzero.ts` sur le motif « le recensement des lecteurs d'arbre devient faux en silence », après avoir retiré mon motif n° 3.
