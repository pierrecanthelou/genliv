# Revue d'itération — `dossier-controles` · itération `10` · **dernière de la n° 7**

> Plan : `.claude/raffinage/dossier-controles-it10.plan.md` (validé le 2026-09-17)
> Notes de comité : `.claude/raffinage/dossier-controles-it10/`
> Exécution : 1 lot `contrat`, séquentiel, deux temps — `dev-contrat`, puis QA en mode B, puis arbitrage de mesure par l'orchestrateur

## En une ligne

**L'auteur voit désormais qu'un objectif est échoué avant que le joueur ait joué un seul tour** — et sur le dossier de référence du dépôt, il en voit un vrai : `objectif.proteger-le-sceau`, dont la condition d'échec `non(possede_objet('objet.sceau-de-cendre'))` est vraie à l'ouverture parce que le héros ne part avec rien.

## Critères — 8/8 `VÉRIFIÉ`

| # | Statut | Preuve |
|---|---|---|
| 1 | **VÉRIFIÉ** | `controles.test.ts` › « un objectif perdu a l ouverture alerte, et son voisin sain se tait dans le meme test » — sur `cloneReference()` **non muté**, un seul constat : `objectif.proteger-le-sceau → alerte · canon · canon.objectifs[].echoue_si_expr`, `location` = `Objectif « Empêcher l'ouverture du sceau de cendre »` |
| 2 | **VÉRIFIÉ** | Même test, même assertion : `objectifs[0]` (`evenement_consomme`) ne produit rien. **KR-197/202 servis sans aucune mutation de fixture** |
| 3 | **VÉRIFIÉ** | `tourzero.test.ts` › « le lieu de depart rend la feuille non niee certaine, et la niee certaine fausse » — `non(lieu_courant_est(<départ>))` seul → silence |
| 4 | **VÉRIFIÉ** | `tourzero.test.ts` › « un depart vide ou pendant rend la cellule indecidable, sous les deux polarites » — 4 combinaisons (vide/pendant × nu/nié) + discriminant sur départ posé |
| 5 | **VÉRIFIÉ** | `tourzero.test.ts` › « chaque predicat indecidable de la table se tait, nu » — balayage depuis le registre, jamais N littéraux (KR-199) |
| 6 | **VÉRIFIÉ** | `tourzero.test.ts` › « chaque predicat indecidable de la table se tait, nie » |
| 7 | **VÉRIFIÉ** | `controles.test.ts` › « les deux polarites produisent deux messages distincts » — « déjà vrai » contre « encore faux », exclusivité ligne à ligne |
| 8 | **VÉRIFIÉ** | `controles.test.ts` › « le calme des deux fixtures et du dossier neuf ne bouge pas » — référence **11 → 12**, neuf reste **4**, minimal reste **1**, les trois `jouable` inchangés |

## Diff par lot — conforme à la liste du plan, pas un fichier de plus

| fichier | état | volume |
|---|---|---|
| `src/brain/dossier/tourzero.ts` | **N** | module neuf, H6 en en-tête |
| `src/brain/dossier/tourzero.test.ts` | **N** | 8 tests de contrat |
| `src/brain/dossier/controles.ts` | R | +137 |
| `src/brain/dossier/controles.test.ts` | R | +184/−13 — 4 tests ajoutés, 6 gardes amendées |
| `src/brain/dossier/expr.test.ts` | R | +26/−6 — recensement durci |
| `src/brain/dossier/atteignabilite.ts` | R | +22/−12 — **commentaires seuls**, vérifié par un diff filtré qui rend vide |

**Zéro fichier d'UI**, comme annoncé : la 9ᵉ règle arrive par les surfaces déjà livrées, `panneauControles.test.tsx` reste vert sans être touché. `destinations.ts` intouché — le `path` y était déjà.

## Le mensonge que cette itération a failli figer, et comment il a été attrapé

**Le § 7 du plan attribuait au témoin *nu* le fait de tuer la faute « cellules indécidables rendues fausses ». C'est FAUX, et la phrase avait franchi deux tours de comité, la porte mécanique et la validation humaine.**

Elle venait d'une mesure réelle — mais faite sur un **prototype qui assertait sur le `Verdict` trivalué interne**, où `'indecidable'` et `'faux'` sont discernables. Le contrat livré ne rend qu'un **tir ou un silence**, et les deux valeurs s'y taisent : dans un contexte sans négation, un témoin nu est aveugle à cette faute **par construction**.

Trouvé par l'ouvrier, confirmé par la QA en mode B — **puis tranché par l'orchestrateur, parce que les deux mesures divergeaient** : l'ouvrier comptait 1 test rouge sous M3, la QA en comptait 2. Mutation appliquée, suite lancée, mutation retirée, retour au vert vérifié (478 tests) :

| témoin | **M1** `lieu_courant_est` → `'faux'` | **M2** `non('?')` → `'vrai'` | **M3** cellules `'indecidable'` → `'faux'` |
|---|:--:|:--:|:--:|
| « le lieu de depart… » | ROUGE | vert | vert |
| « un depart vide ou pendant… » | ROUGE | **ROUGE** | **vert** |
| « …se tait, **nu** » | ROUGE | vert | vert |
| « …se tait, **nie** » | ROUGE | ROUGE | **ROUGE** |

**Ce que la mesure établit** : le témoin nié attrape M2 *et* M3 sans les distinguer ; c'est « **un depart vide ou pendant** » qui les **sépare**. Les critères 5 et 6 restent nécessaires et non substituables — mais pour une raison autre que celle écrite au raffinage. **Aucun trou de couverture** : les trois fautes sont tuées. Le défaut était dans le motif, pas dans l'instrument.

**Et il y avait mieux qu'un motif faux.** La première implémentation de l'ouvrier faisait **survivre M2, verte** : `Verdict.temoin` valait `null` exactement quand `valeur === 'indecidable'` — deux écritures du même fait, et la redondance **masquait** la faute au lieu de la révéler. Corrigé dans le même lot ; le motif est écrit dans la docstring de `Verdict`, là où un relecteur le trouvera. **La mesure a produit une correction de code, pas seulement un constat.**

## Ce qui a été refusé — ce qu'un diff ne dit pas

| Refus | Motif |
|---|---|
| **Le niveau `bloquant`** | Un bloquant exige un geste qui **restaure** la capacité (doctrine it8). Mesuré inapplicable, et la seule remédiation honnête autorise à **garder** l'objectif : un dossier déclaré injouable dont la consigne dit « c'est peut-être voulu » est incohérent. Un camp déjà défait à l'ouverture est une forme narrative légitime. |
| **Loger la valuation dans `atteignabilite.ts`** | Le recensement d'`expr.test.ts` porte sur des **fichiers**, pas des sémantiques : une seconde traversée y serait entrée **sans qu'aucune assertion ne porte sur elle**. Éviter de faire rougir un test en lui cachant son sujet n'est pas un argument d'architecture. |
| **Un verdict bivalué** | La direction d'erreur permise **ne survit pas à `non`** : une valeur supposée y devient assertée. La trivalence **retire** deux hypothèses à dater au lieu d'en ajouter, à coût nul sur le matériau. |
| **Écrire `evenement_consomme → 'faux'`** | Veto narratif retenu : son contre-exemple est **écrit dans `dossier-minimal.json`** (événement déclenché sur le lieu de départ), et le sous-arbre nié existe déjà dans le champ voisin du même objectif. Une cellule dont le contre-exemple est au dépôt n'est pas une hypothèse, c'est une erreur. Coût mesuré : **nul**. |
| **Nommer un écran producteur dans la remédiation** | À t=0 aucun delta n'a couru **par construction** : donner l'objet plus tard ne change pas le verdict. Ce ne serait pas une consigne *circulaire* (BUG-090) mais une consigne **fausse** — actionnable, suivie, sans effet. La contrepartie a été **retirée par son auteur** après mesure. |
| **La rédaction de remédiation de l'UX** | Écrite en parallèle du tech-lead, donc sans sa mesure : `PanneauDepart.tsx` commite bien le lieu de départ, ce qui la rendait fausse sur la polarité `nie = false`. **Direction conservée** (dire l'absence de geste plutôt que la maquiller), mots remplacés. |
| **Nommer le geste `Départ`** | Il répare réellement une polarité — mais une remédiation **unique** ne peut nommer un geste valable sur une seule sans induire en erreur sur l'autre, et la polarité dominante est celle où il ne s'applique pas. |
| **Exporter `Trivalent`** · **un témoin sans `nie`** · **re-dériver la polarité depuis le `message`** | Un type exporté à un seul appelant est une dette · sans `nie`, le message affirmerait « possède l'objet » là où le fait est l'absence · lire à distance un texte qu'un autre site décide est le veto d'encapsulation. |
| **Annoncer que le joueur « perd » l'objectif** | `types.ts` ne déclare ni l'instant d'évaluation ni un verrou de l'échec. L'annoncer ferait écrire au linter du Temps 1 la sémantique du Temps 2. |
| **La tranche `chore`** (scission de `controles.ts`) | Sa prémisse « avant it10 » tombe : it10 est la dernière itération, le bénéfice y est nul. Et c'est un refactor à **vert trompeur** — le mettre dans le même diff que le seul témoin réel du dépôt rendrait toute casse inattribuable. |

## Ce qui a été reporté, et où

- **« Une fin déjà atteinte à l'ouverture »** → `code-knowledge.json`. Cause distincte (KR-164), aucun témoin positif réel, donc pouvoir séparateur invérifiable.
- **La scission de `controles.ts`** → `code-knowledge.json`, re-datée « le premier lot qui rouvrira `controles.ts` après n° 7 », avec ses rattachements.
- **Le geste `Départ`** → consigné comme mesure, pas comme remède.
- **Le durcissement de la garde de couture** — un fichier à un seul aiguillage *plafonne* le jeu de l'appariement, il ne le supprime pas. Aucun durcissement demandé sur la dernière itération ; écrit pour que la réécriture ne prétende pas plus qu'elle ne fait.

- **Le dépassement de `code-knowledge.json` (+656 o sur 76 800)** → **arbitré par l'humain à la revue : livrer maintenant, compacter avant la n° 8.** La compaction de cette tranche a ramené `specification.json` de 71 971 à **63 062 o** (sous son plafond, 3 498 o de marge) ; le résidu de `code-knowledge.json` exigerait de tailler dans des invariants transverses **vivants**, ce que le tech-lead et l'orchestrateur ont tous deux refusé. L'archivage des 29 KR de features supprimées (≈ 10 027 o) a été **examiné et écarté** : `bug_history` et `features_history` se *scindent* parce que ce sont des journaux, où la valeur d'une entrée décroît ; `code-knowledge.json` se *compacte* parce que c'est un **jeu de règles lu en entier avant chaque ligne de code**, où la valeur d'un invariant ne décroît pas parce que la feature qui l'a découvert a disparu — vérifié : les KR de `choice-linking`, `node-editor` et `book-export` sont vivants aujourd'hui dans `dossier-format`. **Propriétaire recommandé : une tranche `outillage` avant la n° 8** — triage entrée par entrée sur « invariant vivant ? », axe d'archivage écrit des deux côtés, deux lignes de doctrine dans `CLAUDE.md` et `docs/WORKFLOW.md`, puis re-dérivation du plafond vers le bas. Le fichier ne reçoit plus rien d'ici là.

## Un manque assumé de l'orchestrateur

La revue de PR d'it9 portait **« (c) est à trancher au cadrage d'it10 »** — au seuil `alerte`, `savoirSousPorteMorte` n'est pas lu, si bien qu'`indice.trace-du-guet`, seul cas réel du dépôt, reçoit une consigne qui pointe à côté de la cause. **Mon cadrage ne l'a pas porté au comité.** Le prendre aurait ajouté une seconde démo à la tranche, ce que la règle de taille interdit. Reporté vers `code-knowledge.json` avec la règle « cet objet, personne ne le donne » (report it9), qui touche la même prose. Écrit ici parce qu'un manque consigné vaut mieux qu'un manque enterré.

## Écarts assumés

- **`NON_DE_KLEENE`**, symbole privé non prévu au plan : la correction du défaut de redondance témoin/valeur, écrite une fois en `Record<Trivalent, Trivalent>` plutôt qu'en cascade de ternaires.
- **Deux tests non nommés au § 7** : « les connecteurs suivent Kleene… » (le § 4 nommait `et`/`ou` comme un contrat sans qu'aucun test ne l'exerce) et « les deux lecteurs sémantiques ne s'importent jamais » (la propriété qui a tranché D-2 n'avait pas d'instrument).
- **Un 9ᵉ `libelle` sans lecteur** — dette reconduite en connaissance de cause, rattachée à la tranche `chore`.

## Porte qualité

| | |
|---|---|
| `prettier --check` | vert |
| `tsc --noEmit` | vert, silencieux |
| `eslint` | **0 erreur**, 1 warning **préexistant** dans `src/player/components/CharacterCreationScreen.tsx:35`, hors périmètre (confirmé antérieur par mesure sur l'arbre `stash`é) |
| `jest` | **87 suites / 1280 tests**, tous verts |
| Non-régression | `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts` — **diff vide**, aucune assertion modifiée |
| `test:mutation` | **sans objet** — `src/brain/dossier/**` n'entre ni dans les 4 fichiers mutés ni dans la table dorée ; vérifié par diff vide sur `challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`, `rules.golden.test.ts` |

## Ce que personne n'a pu vérifier

- **La justesse de H6.** Ses deux canaux de mise en défaut — un `effet[]` de jalon déclenché à l'ouverture, une résolution d'événement appliquée avant le premier tour — ne seront décidables que lorsque la n° 9 existera.
- **KR-227 amendé** (« trois lignes, deux fichiers, un invariant ») est un invariant **documentaire** : aucun instrument ne vérifie qu'une liste fermée dans un commentaire reste vraie. La mesure D a prouvé qu'une phrase fausse y survit trois itérations.
- **La prémisse du bloquant « lieu de départ désert »** reste invérifiable — aucun graphe de lieux à interroger (KR-224), report hérité d'it3.

## `RETOUR-COMITÉ`

1. **Une mesure faite sur un prototype ne vaut pas pour le contrat livré, et la différence est un niveau d'observation.** Le prototype de la QA assertait sur le verdict trivalué ; le contrat ne rend qu'un tir ou un silence. La conclusion (« deux témoins non substituables ») était juste, le motif faux — famille BUG-080, à un endroit que ni les deux tours, ni la porte mécanique, ni la validation humaine n'exécutent. **Règle à retenir : un pouvoir séparateur se mesure au NIVEAU OÙ LE CONTRAT SERA CONSOMMÉ, jamais un cran en dessous.**
2. **Deux mesures qui divergent se retranchent par une troisième, pas par la plus autorisée.** L'ouvrier disait 1 test rouge sous M3, la QA en mode B 2. Le réflexe de croire la QA — le rôle dont c'est le métier — aurait figé l'erreur. Cinq minutes de mutation ont tranché.
3. **Une redondance de représentation peut MASQUER un mutant.** `Verdict.temoin === null` ⟺ `valeur === 'indecidable'` : deux écritures du même fait, et le mutant passait vert. C'est un mode de panne neuf pour ce dépôt, distinct du témoin faible — **l'instrument était bon, c'est le code qui rendait la faute inobservable.** À surveiller partout où un objet porte un champ dérivable d'un autre.
4. **Un rôle qui retire publiquement son propre motif fait avancer le comité plus vite qu'un rôle qui a raison.** Le tech-lead a retiré son motif n° 3 après l'avoir re-mesuré faux, et sa position a tenu sur une jambe plus solide ; le narratif a retiré sa contrepartie « écrans producteurs » et son affirmation sur `objetsDonnesDe`, dont la chute a **confirmé** l'arbitrage adverse. Deux tours ont suffi là où l'entêtement aurait demandé une escalade.
5. **Pour la n° 9** : les trois cellules `indecidable` de `VALEUR_AU_TOUR_ZERO` sont le refus explicite d'écrire la mémoire de session à sa place. Qu'elle les décide autrement n'est **pas** une dette — la dette serait qu'elle décide autrement une cellule que le linter, lui, a décidée.
