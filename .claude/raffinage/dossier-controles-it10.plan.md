# Plan d'itération — `dossier-controles` · itération `10`

> Statut : **`validé`** — porte 2 franchie, validation humaine du 2026-09-17
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-17
> Composition : **5 rôles** — motif : l'itération fait entrer une notion de **tour zéro**, c'est-à-dire un état de *session*, dans un linter de *document*. Sans gardien de la frontière code/IA, rien n'empêche le linter du Temps 1 d'écrire la mémoire de session du Temps 2.
> Exécution : **séquentielle** (1 lot, en deux temps)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | À la fin, l'auteur voit qu'un objectif est échoué avant que le joueur ait joué un seul tour. |
| **Tranche** | `canon.objectifs[].echoue_si_expr` → nouveau module `brain/dossier/tourzero.ts` (valuation à l'ouverture) → 9ᵉ entrée du registre `CONTROLES` → `RapportControles` → panneau Contrôles et badge de section, **par les surfaces déjà livrées** (zéro fichier d'UI touché). |
| **Lots** | **1 lot** · `contrat` : **oui** (tout est sous `src/brain/dossier/`) |
| **Hors périmètre** | `charpente.fins[].condition_expr` · toute surface d'édition de `echoue_si_expr` · la scission de `controles.ts` · la réparation du défaut de `dossier-reference.json` · le niveau `bloquant` |
| **Reporté** | la règle « une fin déjà atteinte à l'ouverture » · la scission de `controles.ts` · le durcissement de la garde de couture · le geste `Départ` comme remède d'une seule polarité |

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur voit qu'un objectif est échoué avant que le joueur ait joué un seul tour.**

La règle lit `canon.objectifs[].echoue_si_expr` et l'évalue contre **l'état d'ouverture** — ce que le document détermine de la partie avant la première action du joueur. Elle ne tire que lorsque la condition est **certainement vraie** ; l'indécidable se tait.

## 2 — Hors périmètre

- **`charpente.fins[].condition_expr`** — « une fin déjà atteinte à l'ouverture » est une **cause distincte** (KR-164) : l'aventure *se termine*, elle n'est pas *perdue*. Mesuré : aucune fin des deux fixtures n'est vraie à t=0, donc aucun témoin positif réel ; son pouvoir séparateur serait invérifiable.
- **Toute surface d'édition de `echoue_si_expr`.** Mesuré : `ObjectifsCanon.tsx` n'écrit que `nom`, `camp`, `reussi_si_texte`, `echoue_si_texte`. Cette itération **constate**, elle n'ouvre aucun éditeur de condition.
- **La scission de `controles.ts`** (tranche `chore` d'it8) — voir § 8, D-10.
- **La réparation du défaut de `dossier-reference.json`.** `canon.objectifs[1]` est un **vrai positif** : il est épinglé nommément, jamais corrigé (précédent it7/it9).
- **Le niveau `bloquant`** — tranché `alerte`, § 8 D-1.
- **Tout fichier d'UI, tout token, toute valeur visuelle.** Aucun composant n'est créé ni modifié : une règle de plus est une entrée de registre de plus.
- **Le score de mutation et la table dorée.** `src/brain/dossier/**` n'entre dans aucun des deux périmètres (les quatre fichiers mutés sont `challenge`, `combat`, `xp`, `characteristics` ; les registres dorés sont `BESTIARY`, `CHALLENGE_TIERS`, `CHARACTERISTICS`, `POSTURES`). Aucun des deux instruments n'est convoqué.

## 3 — Contrat de design

**Aucun fichier d'UI n'est touché**, donc aucun composant, aucun token, aucune valeur visuelle, aucun état de survol ou de sélection, aucun comportement clavier neuf. Les deux chaînes ci-dessous sont consommées telles quelles par les surfaces déjà livrées (`ListeControles.tsx` → `Badge` / `pastilleNiveau` / `controleRemediation`, déjà tokenisées et clavier-natives). **Ce paragraphe est la réponse à la case « chaque valeur visuelle est un token `--*` existant » : il n'y a aucune valeur visuelle dans ce lot.**

**Identifiant de règle** : `'objectif-perdu-a-l-ouverture'`
**`libelle`** : `"Objectif perdu à l'ouverture"`
**`niveaux`** : `['alerte']`

> **Le mot « perdu » vit dans l'identifiant et le `libelle`, jamais dans le message.** Ce n'est pas une inadvertance au regard de D-18 : `libelle` n'a **aucun lecteur** dans `src/` (dette reconduite, pas créée ici) et l'identifiant est interne. La réserve du narratif porte sur ce que **l'auteur lit** — et la phrase qu'il lit ne présuppose aucun verrou de l'échec.

**Le message** — un gabarit, un seul segment variable, en apposition (aucun article à accorder) :

```ts
function messageObjectifPerduALOuverture(
	predicat: string,
	localisations: readonly string[],
	nie: boolean,
): string {
	return `Cette condition d'échec tient à « ${predicat} » — ${localisations.join(', ')} —, ${nie ? 'encore faux' : 'déjà vrai'} avant la première action du joueur.`
}
```

**Rendu exact sur le témoin réel du dépôt** (`predicat = "possède l'objet"`, `localisations = ["Objet « Le sceau de cendre »"]` tel que `collectIds` le rend, `nie = true`) :

> Cette condition d'échec tient à « possède l'objet » — Objet « Le sceau de cendre » —, encore faux avant la première action du joueur.

**Rendu sur la seule forme non niée atteignable** (`lieu_courant_est(<lieu de départ>)`, `nie = false`) :

> Cette condition d'échec tient à « se trouve dans le lieu » — Lieu « Le Foyer du Guet » —, déjà vrai avant la première action du joueur.

**Pourquoi ce gabarit et pas une négation fléchie** — mesuré par l'UX sur `predicates.ts` : les sept libellés n'ont pas la même charpente grammaticale. « possède l'objet » et « se trouve dans le lieu » sont des verbes nus ; « le jalon est atteint », « le lieu a été visité », « l'événement a déjà eu lieu », « le personnage a déjà révélé l'indice » portent déjà sujet et auxiliaire. Aucune insertion de « ne … pas » par position n'est sûre pour les sept, et `controles.ts` reçoit une **chaîne opaque**. Le libellé reste donc **toujours positif, entre guillemets**, et la valeur de vérité est affirmée **à côté**.

**Ce que le message ne dit pas, et c'est mesuré** : il **n'annonce pas que le joueur perd l'objectif**. `types.ts` déclare `echoue_si_expr` MOTEUR et jamais injecté — et **rien d'autre** : ni quand le moteur l'évalue, ni si un échec se **verrouille**. Sur `non(possede_objet(X))`, si le joueur obtient X au tour 5 la condition redevient fausse ; « perdu » présupposerait un verrou que personne n'a décidé. Le linter du Temps 1 n'écrit pas la sémantique du Temps 2.

**La remédiation** — une seule consigne, constante, **vraie sous les deux polarités** :

```ts
const REMEDIATION_OBJECTIF_PERDU_A_L_OUVERTURE =
	"Retirez cet objectif, ou gardez-le si cet échec est voulu dès la première scène (Canon → Objectifs des camps) : aucun écran ne permet aujourd'hui de changer sa condition d'échec."
```

Ce qu'elle contient pour ne pas mentir : **un geste prouvé** (`ObjectifsCanon.tsx:342`, `Retirer l'objectif n°N`, vérifié par l'orchestrateur) · **aucun écran producteur** (mesuré inapplicable : à t=0 aucun delta n'a couru, un producteur ajouté ne change pas le verdict) · **l'absence de geste, dite** et non maquillée · **aucune promesse d'effet moteur** · **l'intention de l'auteur respectée** — « si cet échec est voulu », un camp déjà défait à l'ouverture étant une forme narrative légitime.

**`location`** : `localiserEntite('objectif', objectif, index)` — primitive existante, aucun texte nouveau.
**`path`** : `'canon.objectifs[].echoue_si_expr'` — **déjà** clé de `DESTINATION_DES_CHAMPS` (`destinations.ts:141`, valeur `'moteur'`). `destinations.ts` **n'est pas touché**.

**Registre de langue** — les deux chaînes sont vérifiées contre la garde `controles.test.ts` (« les huit règles… » → « les **neuf** règles… ») : aucun terme de `TERMES_INTERDITS` (`↪`, `_texte`, `_expr`, `si_bloque`, `revele_si`, `réimport`, `bloquant`, `warning`, `error`), aucun mot de session (`lieu_courant`, `inventaire`, `état`, `session`), **aucun « tour zéro »** — qui reste un mot de **code**, jamais de prose d'auteur. `message` : indicatif présent, sujet = le document. `remediation` : impératif, 2ᵉ personne du pluriel, sujet = l'auteur.

**État vide** : sans objet — aucune liste ni champ d'édition touché. La règle **se tait** sur `canon.objectifs` vide, puisqu'elle boucle sur la collection.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/dossier/tourzero.ts` | module **NEUF** | fournit | `export function premiereFeuilleVraieAuTourZero(dossier: Dossier, condition: ExprNode): FeuilleVraieAuTourZero \| null` |
| `FeuilleVraieAuTourZero` | type | fournit | `{ readonly predicat: string; readonly cibles: readonly string[]; readonly nie: boolean }` |
| `Trivalent`, `Verdict`, `VALEUR_AU_TOUR_ZERO`, `verdictAuTourZero`, `jamaisEvalue` | types / fonctions | **PRIVÉS au module** | jamais exportés — zéro lecteur externe ; un type exporté à un seul appelant est une dette |
| `CONTROLES` (`controles.ts`) | registre **FERMÉ** | fournit | 9ᵉ entrée `'objectif-perdu-a-l-ouverture'` ; `ControleId` reste **dérivé** des clés (KR-117) |
| `ConstatControle` | type | **inchangé** | **ne gagne aucun champ** — la polarité vit dans le `message`, jamais sur le constat |
| `PREDICATES` / `PredicatId` | registre | consomme | sans modification |
| `ExprNode` | type | consomme | arbre **déjà accepté** par `validateExpr` — aucune borne de récursion propre, `PROFONDEUR_MAX_EXPR` la garantit |
| `Dossier` | type | consomme | **un seul champ lu** : `charpente.depart.lieu_id` |
| `atteignabilite.ts` | module | **aucun lien** | **zéro import entre `tourzero.ts` et `atteignabilite.ts`, dans les deux sens** — c'est la mesure qui tranche D-2 |

**La table `VALEUR_AU_TOUR_ZERO`, ligne par ligne — le plan l'écrit, l'ouvrier ne l'invente pas.** `Record<PredicatId, (dossier, cibles) => Trivalent>`, **total par compilation** (KR-117).

| ligne | valeur à t=0 | ce qu'elle NOMME (discipline H6) |
|---|---|---|
| `lieu_courant_est` | `'vrai'` ssi `cibles[0] === charpente.depart.lieu_id` · `'faux'` si le départ est posé **et** résout un `monde.lieux[].id` · **`'indecidable'` si `depart.lieu_id` est vide ou ne résout aucun lieu** | **le champ `charpente.depart.lieu_id`.** La ligne qui interdit le faux positif. Le 3ᵉ bras est neuf : sans lui, `non(lieu_courant_est(X))` deviendrait certain-vrai sur un dossier sans départ, où l'on ne sait **rien** du lieu courant. |
| `possede_objet` | `'faux'` | la clause H6 « aucun delta avant la première action » + **H5 citée, jamais recopiée**. **Seul canal de faux positif de la règle.** |
| `indice_connu` | `'faux'` | la même clause H6. |
| `pnj_a_revele` | `'faux'` | **H3 citée** : l'unique producteur de `a_dit[]` est un savoir livré en dialogue — une scène jouée. |
| `evenement_consomme` | **`'indecidable'`** | **aucun champ, et un contre-exemple ÉCRIT au dépôt** — voir D-5. |
| `jalon_atteint` | `'indecidable'` | aucun champ — deux écrivains, dont un `declencheur_expr` que la n° 9 pourrait résoudre au tour zéro. |
| `lieu_visite` | `'indecidable'` | aucun champ — le statut du lieu de départ n'est tranché nulle part. |

**Kleene, écrit une fois** : `non` V↔F, `?`→`?` · `et` F si une F, V si toutes V, `?` sinon · `ou` V si une V, F si toutes F, `?` sinon. **La règle ne tire que sur racine `= 'vrai'`.** `nie` bascule à chaque `non` traversé et est **posé à la feuille**.

**La discipline qui gouverne cette table, et qu'un relecteur futur doit pouvoir appliquer seul :** *toute cellule `vrai`/`faux` nomme soit le champ du document qui la détermine, soit la clause de H6 qui la suppose ; sans l'un des deux, la cellule vaut `indecidable`.*

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **aucun**. `echoue_si_expr` est MOTEUR, `echoue_si_texte` est AUTEUR ; `destinations.ts` les tient **tous deux** hors du contexte injecté. La règle lit un champ que le modèle ne voit jamais. |
| Schéma de sortie | sans objet — la sortie est un `ConstatControle` produit par du code **pur**. |
| Échec de validation | sans objet, et c'est la seule bonne réponse : la valuation à t=0 est **déterministe et totale par compilation** sur un arbre déjà accepté par `validateExpr`. Sans dé, sans aléa, sans modèle. |
| Budget de contexte | **inchangé — zéro mot ajouté au canon**, zéro injection par identifiant. |
| Mémoire de session | **non spécifiée, et H6 s'interdit de la spécifier.** Les trois cellules `indecidable` sont le refus explicite d'écrire à la place de la n° 9. |
| Ce que l'IA **ne** fait **pas** | dés, stats, inventaire, XP. `jet` et `confiance_min` restent **définitivement** non évalués ; aucun prédicat ne peut désigner un monstre ; `possede_objet` à t=0 **ne lit rien** — il constate un inventaire vide sous H5/H6. |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `L1` · **L'échec au tour zéro** · `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier — il n'y a pas de second lot)
- **But** : produire un constat `alerte` sur tout objectif dont la condition d'échec est **certainement vraie** avant la première action du joueur.
- **Pourquoi un seul lot** : tous les fichiers de code vivent sous `src/brain/dossier/`. Un lot qui touche `brain/` est `contrat` et s'exécute seul et en premier ; **deux lots `contrat` ne peuvent pas être tous deux premiers**. Zéro fichier d'UI. Le découpage **révèle** l'absence de parallélisme, il ne l'invente pas. Un découpage « module / règle » a été examiné et rejeté : la moitié « règle » **ne compile pas** sans `tourzero.ts`, donc ne franchit pas la porte isolément — deux lots invérifiables seuls sont un lot en deux temps mal nommé. **Exécution séquentielle, sans worktree ni fusion.**

**Fichiers de code** :
- `src/brain/dossier/tourzero.ts` **(N)**
- `src/brain/dossier/tourzero.test.ts` **(N)**
- `src/brain/dossier/expr.test.ts` **(R)**
- `src/brain/dossier/controles.ts` **(R)**
- `src/brain/dossier/controles.test.ts` **(R)**
- `src/brain/dossier/atteignabilite.ts` **(R)** — **commentaires SEULS, zéro ligne de code**

**Fichiers hors code, même livraison (étape 4 des Build Steps)** :
- `src/features/dossier-controles/specification.json` **(R)** · `code-knowledge.json` **(R)** · `features_history.json` **(R)** · `CHANGELOG.md` **(R)** · `docs/ROADMAP-BASCULE-IA.md` **(R)** · `README.md` **(R)** · `package.json` **(R)**

**Expose / consomme** : la signature figée du § 4, mot pour mot.

**Les deux temps, la porte (`prettier → tsc → eslint → jest`) passée AUX DEUX** *(précédent it6 : un lot contrat qui ouvre du code s'exécute en deux temps)* :

1. **Temps 1 — le module et sa garde.** Écrire `tourzero.ts` + `tourzero.test.ts`. **Rejouer `expr.test.ts` ROUGE d'abord** et coller le message d'échec dans la revue — le lot doit *observer* la rougeur avant d'écrire la réécriture. Puis réécrire le recensement (§ 7). Puis les corrections de commentaire d'`atteignabilite.ts`. Porte verte.
2. **Temps 2 — la règle.** 9ᵉ entrée de `CONTROLES`, prose, témoins, ligne de base. Porte verte.

**Consignes d'ouvrier, non négociables** :
- **Forme imposée par la garde de couture** : `switch (noeud.op)` avec `default: jamaisEvalue(noeud)` sur un paramètre `never`. Une cascade `if (noeud.op === …)` fait rougir la garde — c'est voulu.
- **`jamaisEvalue` rend `Verdict`, jamais `never` en position de retour** : `: never` en retour produirait un **second** appariement de `/:\s*never\b/g` et fausserait le compte de la garde.
- Dans `controles.ts`, écrire `const condition = objectif.echoue_si_expr` — **inféré, jamais annoté** : la couture d'it6 interdit le mot `ExprNode` dans ce fichier.
- **Garde de silence sur les cibles non résolues**, même geste qu'`objectif-sans-chemin` : si une seule cible ne résout aucune entité de `collectIds`, la règle **se tait** (KR-225 — une référence pendante est l'affaire du validateur).
- **Placement de la prose** : auprès de `PROSE_CANON_SANS_VICTOIRE`, **avant** `SITES_AVERTISSEMENT` — donc **hors** de la fenêtre `indexOf` des deux gardes fragiles de la tranche `chore`. *À vérifier, c'est une contrainte de placement, pas une conséquence automatique.*
- **Aucune mémoïsation, aucun cache** (KR-013/113) : la valuation se recalcule à chaque appel, comme le rapport qui la consomme.
- **H6 est recopiée telle quelle** depuis `.claude/raffinage/dossier-controles-it10/tour2-narratif-ia.md`, annexe A, en en-tête de `tourzero.ts`. Les quatre écritures corrélées (titre du bloc H, phrase ajoutée à H5, KR-227, correction du cas `non`) sont dans la même annexe, mot pour mot.

**Critères couverts** : #1 à #8.

## 6 — Critères d'acceptation

1. **Étant donné** `dossier-reference.json`, dont `canon.objectifs[1].echoue_si_expr` vaut `non(possede_objet('objet.sceau-de-cendre'))`, **quand** le rapport est calculé, **alors** exactement un constat `objectif-perdu-a-l-ouverture` de niveau `alerte` est produit sur la section `canon`, son `path` vaut `canon.objectifs[].echoue_si_expr` et son `location` nomme cet objectif. — *niveau : contrat* — *lot 1*
2. **Étant donné** le **même** dossier, dont `canon.objectifs[0].echoue_si_expr` vaut `evenement_consomme('evenement.embuscade-a-la-tour')`, **quand** le rapport est calculé **dans le même test**, **alors** aucun constat n'est produit pour cet objectif-là — un objectif perdu et un objectif sain se distinguent dans la même collection, **sans aucune mutation de fixture** (KR-197/202). — *niveau : contrat* — *lot 1*
3. **Étant donné** un objectif dont `echoue_si_expr` vaut `non(lieu_courant_est(<la valeur de charpente.depart.lieu_id>))`, seul et sans connecteur qui le masque, **quand** la condition est valuée à l'ouverture, **alors** aucun constat n'est produit — le faux positif du modèle naïf est interdit. — *niveau : contrat* — *lot 1*
4. **Étant donné** un dossier dont `charpente.depart.lieu_id` est vide ou ne résout aucun `monde.lieux[].id`, **quand** une condition portant `lieu_courant_est`, niée ou non, est valuée, **alors** aucun constat n'est produit — un départ non posé ne détermine pas davantage où le héros n'est pas. — *niveau : contrat* — *lot 1*
5. **Étant donné**, pour **chaque** prédicat dont la table rend `'indecidable'` — ensemble **balayé depuis `VALEUR_AU_TOUR_ZERO`, jamais énuméré en littéraux** (KR-199) —, un objectif dont `echoue_si_expr` porte ce prédicat **NU**, **quand** la condition est valuée, **alors** aucun constat n'est produit. — *niveau : contrat* — *lot 1*
6. **Étant donné** les mêmes prédicats sous une **négation simple**, **quand** la condition est valuée, **alors** aucun constat n'est produit ; ce critère est **distinct du n° 5 et aucun des deux ne remplace l'autre** — mesuré : le témoin nié tue deux implémentations fautives opposées, le témoin nu une seule, et c'est leur **lecture conjointe** qui les sépare. — *niveau : contrat* — *lot 1*
7. **Étant donné** deux objectifs dans un même dossier, l'un dont la feuille certain-vraie est niée et l'autre non, **quand** le rapport est calculé, **alors** les deux messages nomment la feuille et se distinguent par leur polarité — « encore faux » contre « déjà vrai ». — *niveau : contrat* — *lot 1*
8. **Étant donné** les trois dossiers du dépôt, **quand** la 9ᵉ règle entre au registre, **alors** seule la ligne de base de `dossier-reference.json` gagne un constat (**11 → 12**, sur `objectif.proteger-le-sceau`), le dossier neuf reste à 4 et `dossier-minimal.json` à 1, et `jouable` ne change sur aucun des trois. — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `controles.test.ts` › « un objectif perdu a l ouverture alerte, et son voisin sain se tait dans le meme test » | critères 1 + 2, sur `dossier-reference.json` non muté | contrat | KR-197 / KR-202 · KR-164 | L1 |
| `tourzero.test.ts` › « le lieu de depart rend la feuille non niee certaine, et la niee certaine fausse » | critère 3 — **tue la faute « `lieu_courant_est` toujours faux »** | contrat | — | L1 |
| `tourzero.test.ts` › « un depart vide ou pendant rend la cellule indecidable, sous les deux polarites » | critère 4 | contrat | KR-225 | L1 |
| `tourzero.test.ts` › « chaque predicat indecidable de la table se tait, nu » | critère 5 — **balaye `VALEUR_AU_TOUR_ZERO`**, jamais N littéraux. ~~tue la faute « cellules indécidables rendues fausses »~~ — **FAUX, corrigé après mesure, voir l'encadré sous ce tableau** | contrat | KR-199 | L1 |
| `tourzero.test.ts` › « chaque predicat indecidable de la table se tait, nie » | critère 6 — **tue la faute « `non` certain-vrai dès que l'enfant n'est pas certain-vrai »**, *en lecture conjointe avec le test précédent resté vert* | contrat | KR-199 | L1 |
| `tourzero.test.ts` › « la table couvre les sept predicats, totale par compilation » | un huitième prédicat au registre ne compile pas | contrat (typage) | KR-117 | L1 |
| `tourzero.test.ts` › « aucun cache ni memoisation dans le module » | garde de source | contrat | KR-013 / KR-113 | L1 |
| `controles.test.ts` › « les deux polarites produisent deux messages distincts » | critère 7 | contrat | — | L1 |
| `controles.test.ts` › « le calme des deux fixtures et du dossier neuf ne bouge pas » *(existant, amendé)* | critère 8 — **une seule ligne ajoutée, sur la référence** | contrat | KR-219 / KR-226 | L1 |
| `controles.test.ts` › « chaque regle du registre exhibe un temoin qui la declenche » *(existant)* | `TEMOINS` total par compilation — la 9ᵉ règle exige son témoin | contrat | KR-117 · KR-199 | L1 |
| `controles.test.ts` › « la section de chaque controle est celle declaree, jamais derivee du path » *(existant)* | `NEUVES` total ; la garde `not.toContain("split('.')")` reste verte | contrat | KR-219 / KR-226 | L1 |
| `controles.test.ts` › « le rapport lit les avertissements du validateur, jamais ses anomalies » *(existant)* | reste vert sans modification | contrat | KR-217 | L1 |
| `controles.test.ts` › « controles.ts ne connait ni le registre des conditions ni leur type » *(existant, amendé)* | les trois interdits tiennent ; **ajout** de `toContain('premiereFeuilleVraieAuTourZero')` | contrat | KR-169 | L1 |
| `controles.test.ts` › « les neuf regles ecrivent le meme registre de langue, sur les deux colonnes » *(existant, renommé)* | « huit » → « neuf » ; les deux chaînes du § 3 passent | contrat | — | L1 |
| `expr.test.ts` › « un lecteur d arbre est soit le SEUL site de la grammaire, soit exhaustif au compilateur » *(existant, réécrit)* | recensement porté à trois fichiers, `semantiques` à deux, **`toContain('noeud: ExprNode')` ajouté pour le module neuf** | contrat | — | L1 |

> ### CORRECTION APRÈS MESURE — le pouvoir séparateur attribué au témoin **nu** était FAUX
>
> **On corrige, on n'efface pas** : la ligne barrée ci-dessus a été écrite au raffinage sur une mesure faite par la QA sur un **prototype** qui assertait sur le `Verdict` **trivalué interne**, où `'indecidable'` et `'faux'` sont directement discernables. Le contrat livré, lui, ne rend qu'un **tir ou un silence** — et `'indecidable'` comme `'faux'` s'y taisent. **Dans un contexte sans négation, un témoin nu est donc aveugle à cette faute PAR CONSTRUCTION** : remplacer `'indecidable'` par `'faux'` ne peut que baisser la valeur, jamais la porter à `'vrai'`.
>
> Trouvé par l'ouvrier, confirmé par la QA en mode B, puis **tranché par l'orchestrateur** — les deux mesures divergeaient sur M3 (1 test rouge contre 2), et une affirmation sur la couleur d'un test se mesure. Mutation appliquée, suite lancée, mutation retirée, retour au vert vérifié (478 tests) :
>
> | témoin | **M1** `lieu_courant_est` → `'faux'` | **M2** `non('?')` → `'vrai'` | **M3** cellules `'indecidable'` → `'faux'` |
> |---|:--:|:--:|:--:|
> | « le lieu de depart… » | ROUGE | vert | vert |
> | « un depart vide ou pendant… » | ROUGE | **ROUGE** | **vert** |
> | « …se tait, **nu** » | ROUGE | vert | vert |
> | « …se tait, **nie** » | ROUGE | ROUGE | **ROUGE** |
>
> **Ce que la mesure établit** : le témoin **nié** attrape M2 *et* M3 sans les distinguer ; c'est « **un depart vide ou pendant** » qui les **sépare** (rouge sous M2, vert sous M3). Les critères 5 et 6 restent donc **nécessaires et non substituables**, mais pour une raison autre que celle écrite au raffinage. Aucun trou de couverture : les trois fautes sont tuées. Le défaut était dans le **motif**, pas dans l'instrument — et un motif faux non corrigé cède au premier contradicteur (BUG-080).
>
> **Et l'ouvrier a trouvé mieux qu'un motif faux** : sa première implémentation faisait **survivre M2, verte**, parce que `Verdict.temoin` valait `null` exactement quand `valeur === 'indecidable'` — deux écritures du même fait, la redondance masquant la faute. Corrigé dans le même lot, motif écrit dans la docstring de `Verdict`. **La mesure a produit une correction de code, pas seulement un constat.**

**Réécriture de `expr.test.ts` — durcissement, jamais desserrage.** L'invariant que ce test porte est écrit dans son propre commentaire : « aucun module ne RE-DÉRIVE la grammaire d'un arbre NON TYPÉ » et « un lecteur d'un arbre DÉJÀ ACCEPTÉ est admis à UNE CONDITION : être EXHAUSTIF AU COMPILATEUR ». La liste `['atteignabilite.ts','expr.ts']` est le **recensement**, jamais l'invariant. Concrètement : `const TOUR_ZERO = 'tourzero.ts'` ; `lecteurs` → `[ATTEIGNABILITE, SITE_DE_LA_GRAMMAIRE, TOUR_ZERO]` avec **tri explicite des deux côtés** plutôt qu'une dépendance à l'ordre de `readdirSync` ; `semantiques` → `[ATTEIGNABILITE, TOUR_ZERO]`, la discriminance restant **nommée** (KR-199) ; boucle d'appariement **inchangée** ; ajout de `expect(source(TOUR_ZERO)).toContain('noeud: ExprNode')` ; **intouchés** : l'unicité du lecteur d'`unknown` et la dérivation de l'exemption depuis la frontière de typage.

**La rougeur a été mesurée, pas déduite.** Un fichier jetable portant un `switch (noeud.op)` a été posé, `expr.test.ts` a rougi à la ligne du recensement (`Array ["atteignabilite.ts", "expr.ts", + "…"]`), le fichier a été supprimé et la suite est repassée à **21 passed, 21 total**. Le cas négatif compte autant que le positif.

**Valeur attendue et pouvoir séparateur sont DEUX mesures, et les deux ont été faites.** Un prototype de la table Kleene a été écrit, exécuté contre les vraies fixtures, puis supprimé. Valeurs confirmées : le témoin réel tire, les deux témoins négatifs se taisent. **Pouvoir séparateur : trois implémentations fautives ont été écrites et mesurées.** Résultat qui a corrigé le plan : **aucun des quatre témoins issus des fixtures ne sépare deux des trois fautes** — il a fallu fabriquer les témoins des critères 3, 5 et 6. Et un témoin trouvé suspect à la mesure : le témoin **nié** tue *deux* fautes opposées ; seul le témoin **nu** en isole une. C'est pourquoi les critères 5 et 6 sont **distincts et non substituables**.

Cas limites couverts : collection `canon.objectifs` **vide** (la règle boucle, donc se tait) · `echoue_si_expr` **absent** (sauté) · cible **non résolue** (silence, KR-225) · départ **vide ou pendant** (critère 4) · condition **profonde** (bornée en amont par `PROFONDEUR_MAX_EXPR`).

**Non vérifiable en l'état — à recopier dans la revue :**
- **KR-227 amendé** (« trois lignes, deux fichiers, un invariant ») est un invariant **documentaire** : aucun instrument du dépôt ne vérifie qu'une liste fermée dans un commentaire reste vraie. Il se tient par la relecture, comme la mesure D a prouvé qu'une phrase fausse peut y survivre trois itérations.
- **La justesse de H6 elle-même.** Ses deux canaux de mise en défaut (un `effet[]` de jalon déclenché à l'ouverture, une résolution d'événement appliquée avant le premier tour) ne seront décidables que lorsque la n° 9 existera.
- **La nuance du narratif sur la garde de couture** : un fichier à un seul aiguillage **plafonne** le jeu de l'appariement, il ne le supprime pas — un `: never` parasite masquerait encore un aiguillage non fermé. Aucun durcissement n'est demandé ici ; c'est écrit pour que la réécriture ne prétende pas plus que ce qu'elle fait.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| **D-1** | PM · UX · Narratif | Q1 — le niveau : `bloquant` par symétrie avec `objectif-sans-chemin`, ou `alerte` ? | **RETENU : `alerte`** | Unanime au tour 2. La doctrine d'it8 exige, pour un `bloquant`, un geste qui **restaure** la capacité ; mesuré inapplicable ici. Et la seule remédiation honnête autorise à **garder** l'objectif — une consigne qui dit « c'est peut-être voulu » est incompatible avec « injouable ». Porté par L1. |
| **D-2** | Tech Lead vs Narratif | Q2 — où vit l'état d'ouverture : module neuf, ou dans `atteignabilite.ts` ? | **RETENU : module neuf `tourzero.ts`** | Le narratif s'est **rangé au tour 2** après avoir relu la garde : `lecteurs` recense des **fichiers**, pas des sémantiques ; une seconde traversée logée dans un fichier déjà recensé entre **sans qu'aucune assertion ne porte sur elle**. Aucune machinerie n'est partagée (mesuré ligne à ligne). Porté par L1. |
| **D-3** | Tech Lead · Narratif · QA | Q3 — verdict bivalué ou trivalué ? | **RETENU : trivalué (Kleene), tir sur le certain-vrai seul** | La direction d'erreur permise **ne survit pas à `non`** : sous bivalence, une valeur « supposée » devient « assertée » sous négation — le faux positif interdit. La trivalence **retire** deux hypothèses à dater au lieu d'en ajouter, à coût nul sur le matériau. Porté par L1. |
| **D-4** | PM · Narratif · Tech Lead | Q4 — élargir la portée à `charpente.fins[].condition_expr` ? | **REPORTÉ** | Hors de cette tranche : cause distincte (KR-164) et **aucun témoin positif réel**, donc un pouvoir séparateur invérifiable. **Destination : `code-knowledge.json`** et non les `open_questions` de n° 7, qui n'a plus de lecteur après it10 — candidat pour la feature qui tranchera les deux décisions moteur que H6 nomme. |
| **D-5** | Narratif *(**VETO**, terrain « mémoire de session non spécifiée »)* | La cellule `evenement_consomme` doit valoir `'indecidable'`, jamais `'faux'` | **RETENU — veto fondé, vérifié par l'orchestrateur** | Relevé direct : `dossier-minimal.json` porte `depart.lieu_id = 'lieu.val-cendre'` et `evenement.embuscade-du-fanal.declencheur_expr = lieu_courant_est(['lieu.val-cendre'])` ; et `non(evenement_consomme('evenement.embuscade-du-fanal'))` **est déjà écrit** dans le champ voisin du même objectif (`reussi_si_expr`). Déplacé d'un champ, il ferait tirer la règle sur un dossier que la ligne de base appelle `jouable: true`. **Une cellule dont le contre-exemple est écrit dans `__fixtures__` n'est pas une hypothèse, c'est une erreur.** Coût mesuré : **nul** — `ou('indecidable','faux')` se tait exactement comme `ou('faux','faux')`. |
| **D-6** | QA *(**VETO**, terrain « absence de test de non-régression »)* | Aucun témoin du comité n'exerce les cellules `'indecidable'` : rien ne prouve qu'elles ne dérivent pas vers `'faux'` | **RETENU — veto fondé, mesuré par son émetteur** | Les trois implémentations fautives ont été exécutées : les quatre témoins issus des fixtures restent **verts** sur deux d'entre elles. Critères 5 et 6, distincts et non substituables. |
| **D-7** | UX vs Narratif | La remédiation : dire l'absence de geste, ou nommer les écrans producteurs ? | **RETENU : le texte du § 3** ; la contrepartie « écrans producteurs » est **RETIRÉE par son auteur** | Mesuré : à t=0 aucun delta n'a couru **par construction**, donc un producteur ajouté ne change pas le verdict. Nommer un écran producteur ne serait pas une consigne *circulaire* (BUG-090) mais une consigne **fausse** — actionnable, suivie, et sans effet. |
| **D-8** | Orchestrateur *(contre la rédaction de l'UX)* | La remédiation de l'UX affirme qu'« aucun écran ne permet de modifier cette condition » **et** parle d'inventaire de départ — fausse ou hors sujet sur la polarité `nie = false` | **RETENU : la rédaction de l'UX est REMPLACÉE** | L'UX a rédigé **en parallèle** du tech-lead, donc sans sa mesure : `PanneauDepart.tsx:146` commite bien `charpente.depart.lieu_id`. La remédiation retenue nomme un geste **prouvé et valable sous les deux polarités** (« Retirez cet objectif »). La **direction** de l'UX — dire l'absence de geste plutôt que la maquiller — est retenue intégralement ; seuls les mots changent. |
| **D-9** | Tech Lead | Le geste `Départ` (`PanneauDepart.tsx`) répare réellement la polarité `nie = false` : faut-il le nommer ? | **REJETÉ** | Une remédiation **unique** ne peut nommer un geste valable sur une seule polarité sans induire en erreur sur l'autre — et la polarité dominante (le seul témoin réel du dépôt) est justement celle où il ne s'applique pas. La mesure est conservée ici pour qui rouvrira le sujet. |
| **D-10** | Tech Lead · PM | La tranche `chore` (scission de `controles.ts`), datée par it8 avec le déclencheur « AVANT it10 » | **REPORTÉ** | Sa prémisse tombe : it10 est la **dernière** itération de n° 7, le bénéfice pour cette feature est nul. Et c'est un refactor à **vert trompeur** (deux gardes bornées par `indexOf` qui voyagent avec le bloc ou mentent à vide) : le mettre dans le même diff que le seul témoin réel du dépôt rendrait toute casse inattribuable. **Destination : `code-knowledge.json`**, re-daté « le premier lot qui rouvrira `controles.ts` après n° 7 », avec ses trois rattachements inchangés. |
| **D-11** | PM | Les reports doivent aller dans `code-knowledge.json` plutôt que dans les `open_questions` d'une feature qui se clôt | **RETENU sous obligation** | L'adresse est juste : après it10, `dossier-controles/specification.json` n'a plus de lecteur. **Mais l'orchestrateur a mesuré ce que le PM n'a pas mesuré** : `code-knowledge.json` pèse 76 785 o pour un plafond de 76 800 o (**15 octets de marge**) et `specification.json` 66 548 o pour 66 560 (**12 octets**). Le report les franchit **tous les deux**. `docs/WORKFLOW.md` est formel : la compaction se fait **dans ce lot-ci**. Obligation écrite au § 10. |
| **D-12** | Tech Lead | Son motif n° 3 de tour 1 (« la garde compte par fichier, donc cohabiter l'affaiblit ») | **RETIRÉ par son auteur** | Il a relu l'assertion : le commentaire dit « UNE FERMETURE PAR AIGUILLAGE » et l'assertion est `fermetures >= aiguillages`. Il s'était attribué le défaut que la garde avait corrigé. Sa position tient sur une jambe plus solide (D-2). Consigné parce qu'un motif faux retiré publiquement vaut mieux qu'un motif faux qui survit. |
| **D-13** | Narratif | Son § B de tour 1, « `possede_objet` à t=0 se lit par `objetsDonnesDe` » | **RETIRÉ par son auteur** | Faux : à t=0 la cellule ne lit **rien**, elle constate un inventaire vide. Sa chute retire le dernier lien de machinerie apparent entre les deux modules, et **confirme D-2**. |
| **D-14** | QA | Son objection 1 de tour 1 (« le témoin de la mesure C ne sépare rien ») | **RETIRÉE par son auteur**, après mesure | Exacte sur le site qu'elle visait, et l'orchestrateur l'a reprise à son compte : la mesure C du cadrage **prouvait l'existence du motif chez un auteur réel, jamais un pouvoir séparateur** — son `et` court-circuite sur une branche déjà fausse. Le témoin dédié qu'elle réclamait est devenu le critère 3. |
| **D-15** | Tech Lead | `Trivalent` exporté depuis le module | **REJETÉ** | Zéro lecteur hors du module ; un type exporté à un seul appelant est une dette, pas un contrat. |
| **D-16** | Tech Lead | Un témoin sans champ `nie` | **REJETÉ** | Sur l'unique témoin réel du dépôt, le message affirmerait « possède l'objet » là où le fait est l'absence — l'inverse de sa propre cause. |
| **D-17** | Tech Lead | Re-dériver la polarité depuis la chaîne `message` dans `remediation` | **REJETÉ — terrain de veto tech-lead (§ Encapsulation)** | Lire à distance un texte dérivé qu'un autre site décide, famille `querySelector` / `designationDe`. D'où : **une** entrée, **une** remédiation constante, la polarité portée par le `message` seul. |
| **D-18** | Narratif | Le message ne doit pas annoncer que « le joueur perd cet objectif » | **RETENU** | `types.ts` ne déclare ni le moment d'évaluation, ni un verrou de l'échec. L'annoncer ferait écrire au linter du Temps 1 la sémantique du Temps 2. Si le comité veut un jour cette conséquence, le chemin est doc → test → code, hors périmètre d'it10. |
| **D-19** | Narratif · Tech Lead | Le nom du module : `ouverture.ts` ou `tourzero.ts` ? | **RETENU : `tourzero.ts`** | `ouverture` entre en collision avec `charpente.depart.texte_ouverture_joueur` et avec `amorce.ts`, son voisin de dossier. Un nom qui désigne un **moment** n'absorbe pas gracieusement une seconde question — il fait le travail que l'en-tête ferait sinon. |
| **D-20** | Narratif | Le domicile de H6 : dans le bloc H1–H5, ou dans le module neuf ? | **RETENU : dans `tourzero.ts`** | La décision d'it6 est **respectée, pas contournée** : elle dit que l'hypothèse vit « dans le fichier qui l'utilise ». Le bloc voisin s'intitule « hypothèses datées **d'atteignabilité** » ; H6 n'en est pas une. H5 **ne se recopie pas** — elle est **citée**, une hypothèse restatée dans deux fichiers étant une règle dupliquée. |

## 9 — Innovation

*(Aucune. Toutes les propositions retenues tiennent dans le cadre existant : contrats `brain/`, registre fermé, hypothèses datées domiciliées dans le fichier qui les utilise, gardes de source durcies et jamais desserrées.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test` — **passée aux DEUX temps du lot**
- [ ] `npm run test:mutation` : **sans objet** — l'itération ne touche aucun des quatre fichiers mutés
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] **La rougeur d'`expr.test.ts` observée et son message collé dans la revue, AVANT la réécriture du recensement**
- [ ] **Les trois implémentations fautives du § 7 rejouées sur le code livré** — la valeur attendue et le pouvoir séparateur sont deux mesures, sur deux codes différents
- [ ] Aucune régression sur les tests existants de la feature ; `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts` restent verts **sans modification de leurs assertions**
- [ ] Aucun fichier touché hors de la liste du § 5
- [ ] **KR-227 amendé dans `specification.json` ET `code-knowledge.json`** — « trois lignes, deux fichiers, un invariant », le **verbe** changé autant que le chiffre
- [ ] **Budget de contexte — DEUX compactions dues dans ce lot-ci, et l'une a DÉJÀ COMMENCÉ.** Mesures en octets LF, plafonds entre parenthèses.
   · `src/features/dossier-controles/specification.json` : **68 283 o (66 560)** — le report de raffinage a été écrit **et** une première compaction faite dans le même geste (une `open_questions` tranchée retirée, deux paires de doublons fusionnées, huit entrées verbeuses réduites à leur substance + renvoi de revue, ~2 300 caractères rendus). Le fichier reste **1 723 o au-dessus** : la campagne se termine ici. **Piste mesurée et sûre** : la feature se clôt, donc les `open_questions` qui désignent nommément une AUTRE feature (n° 9, n° 14, n° 16, `dossier-canon`, « le premier lot qui rouvrira `validate.ts` ») n'ont plus de lecteur dans n° 7 — elles **migrent** vers `code-knowledge.json` (arbitrage D-11) au lieu d'être dupliquées.
   · `code-knowledge.json` : **76 785 o (76 800)**, 15 o de marge — il reçoit KR-228, l'amendement de KR-227 et les migrations ci-dessus ; il franchira donc aussi, et se compacte dans le même lot.
   · **Ce qu'il ne faut PAS compacter, et c'est mesuré** : les `known_risks` de la spec sont **plus longs** que leurs jumeaux de `code-knowledge.json` (KR-219 : 1 168 contre 627 · KR-222 : 943 contre 383 · KR-226 : 992 contre 703). Les réduire à un renvoi **perdrait** du détail qui n'existe nulle part ailleurs — ce serait de la suppression déguisée en compaction. Si la place doit venir de là, le détail **monte d'abord** dans `code-knowledge.json`.
   · **Reporter au lot suivant, c'est ne jamais le faire** — et il n'y a pas de lot suivant dans cette feature.
   · Après compaction, **re-dériver les deux plafonds vers le bas** sur la nouvelle mesure (`plafond = ceil(mesure ÷ 5 kio) × 5 kio`) dans `docs/WORKFLOW.md` § Budget de contexte. Le plafond ne remonte jamais.
- [ ] `docs/ROADMAP-BASCULE-IA.md` § 2 : colonne `Statut` de la n° 7 portée à **10/10 — terminée**
- [ ] `features_history.json` : entrée de clôture de la feature n° 7
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-controles-it10.revue.md` — ce que l'auteur peut faire maintenant, chaque critère avec sa preuve, **ce qui a été refusé et pourquoi**, ce qui a été reporté, et ce que personne n'a pu vérifier

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | `alerte` tranché définitivement ; Q4 confirmé ; tranche `chore` non prise |
| Tech Lead | recevable sous réserve | trivalence · champ `nie` · message nommant la feuille · remédiation unique vraie sous les deux polarités · KR-227 à trois lignes · mesure D corrigée. **Aucun veto.** |
| UX | recevable sous réserve | niveau `alerte` tenu ; gabarit de message retenu ; **rédaction de la remédiation remplacée** (D-8), direction conservée |
| QA | **veto, levé par les critères 5 et 6** | les cellules `'indecidable'` ont désormais leurs deux témoins distincts |
| Narratif & IA | **veto ponctuel, levé par D-5** | `evenement_consomme` s'écrit `'indecidable'` ; module neuf accepté ; H6 domiciliée dans `tourzero.ts` |
