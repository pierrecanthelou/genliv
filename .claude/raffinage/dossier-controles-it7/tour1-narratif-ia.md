# Tour 1 — narratif-ia — dossier-controles it7

**RISQUE** — it7 écrit la **première traversée d'`ExprNode` porteuse d'un sens**, avant que l'évaluateur du moteur (n° 9) existe. Deux traversées du même arbre, deux sémantiques : la règle vit à deux endroits. Au premier prédicat ajouté, le linter déclarera inaccomplissable ce que le moteur accomplit, et rien ne rougira. C'est mon motif de veto le plus proche ; il se désamorce par le nommage et une ligne de renvoi, pas par un test.

**OBJECTION** — (a) le goal dit « une feuille que rien ne peut établir » : pris à la lettre, c'est une lecture **par feuille**. Sous `ou` il suffit d'UNE branche ; sous `non`, la productibilité de la feuille ne dit **rien**. La lecture par feuille produit donc des **faux positifs bloquants**, que la doctrine de la feature interdit. (b) Sur les 7 lignes de la table, **4 sont constantes vraies à it7** (les deux `lieu_*` par KR-224 ; `evenement_consomme` et `jalon_atteint` par H2, charge d'it8). Non écrit, le nom de la règle promet plus que ses assertions (KR-199).

**PROPOSITION**

1. `accomplissable(dossier, noeud)` : `et` = ∀, `ou` = ∃, `non` = **VRAI sans descente**, `predicat` = table. Dans `atteignabilite.ts`, **jamais** nommée `evaluateExpr` ; docstring : « satisfiabilité, pas évaluation — aucun état de session lu ; l'évaluation est n° 9 », en UNE ligne de renvoi.
2. Table `Record<PredicatId, …>` **totale** (8ᵉ prédicat = `tsc` rouge), 7 lignes épinglées une par une ; `pnj_a_revele` évalué **jointement**.
3. **≤ 1 constat par objectif**, nommant la première feuille en défaut via `PREDICATES[p].label` + `localiserEntite` ; le message n'affirme pas que le remède suffit.
4. Feuille dont la cible ne résout aucune entité → **zéro constat** (KR-225 / KR-217).
5. Les deux mutants (« toutes les feuilles », « `non` descend ») sont **écrits** à l'essaim, couleur **mesurée** — je n'en affirme aucune ici.

**VERDICT** — **recevable sous réserve** des cinq propositions. Aucun veto : cette tranche n'appelle aucun modèle, ne pose aucun prompt, n'ouvre aucune mémoire de session.

---

# ANNEXE (hors quota)

## 1. Le `non` et le `ou` — ce qui doit être retenu

`ExprNode` a quatre opérateurs et **aucun parseur** (`expr.ts:51-54`, KR-168). La fonction à écrire n'est pas un évaluateur : elle répond « **existe-t-il une partie où cette expression est vraie ?** » (satisfiabilité), jamais « est-elle vraie maintenant ? ».

| nœud | règle retenue | motif |
|---|---|---|
| `predicat` | table de productibilité (§ 2) | le fait est-il établissable par un producteur du dossier |
| `et` | **tous** les enfants accomplissables | classique |
| `ou` | **au moins un** enfant accomplissable | une branche suffit ; exiger toutes les branches est le faux positif le plus probable, un `ou` étant écrit exactement pour offrir un second chemin |
| `non` | **VRAI, sans descendre** | voir ci-dessous |

**Pourquoi `non` = vrai sans descente, et pas « vrai parce qu'on n'en sait rien ».** Les sept prédicats lisent tous un champ de session **qui part vide** — `predicates.ts:49-66` : inventaire, `monde.indices_connus[]`, `monde.jalons_atteints[]`, `monde.lieux_visites[]`, `monde.evenements_consommes[]`, `monde.pnj.<id>.a_dit[]`. La négation de chacun est donc vraie **au tour zéro**. Seule exception nommée : `lieu_courant_est`, qui part à `charpente.depart.lieu_id` (`types.ts:1401-1404`) ; `non(lieu_courant_est(depart))` devient vraie dès le premier déplacement, et KR-224 fait qu'aucun lieu déclaré n'est hors d'atteinte. Le seul contre-exemple théorique est un dossier à **un seul lieu** — un cas que la prudence doit laisser passer en silence, pas bloquer.

Conséquence opératoire : **ne jamais collecter les feuilles à plat**. `collectRefs` (`expr.ts:258-277`) descend dans `non` et aplatit `ou` — correct pour la résolution de références, **faux** pour cet usage. Le plan doit interdire nommément sa réutilisation ici.

**Ce que je n'affirme pas** : la couleur des tests. Les deux implémentations fautives — (i) « toutes les feuilles doivent être productibles », (ii) `non` qui descend — s'**écrivent** à l'essaim et leur couleur se **mesure** (précédents BUG-087, BUG-088). Témoin minimal correspondant : un objectif `ou(A_improductible, B_productible)` et un objectif `non(A_improductible)` — le premier sépare (i), le second sépare (ii), et les deux doivent être **dans le même test** qu'un objectif qui, lui, tire (KR-197/202).

## 2. La table de productibilité, ligne par ligne

Balayée depuis `PREDICATES` (`predicates.ts:48-67`), `Record<PredicatId, (dossier, cibles) => boolean>` **total par compilation** — un 8ᵉ prédicat ne compile pas sans sa ligne (KR-117, KR-199).

Rappel de schéma qui commande la moitié du tableau : `DELTAS` n'a que **4 verbes** (`deltas.ts:61-70`) et écarte nommément `deplacer_vers` et `consommer_evenement` (`deltas.ts:29-38`). Il y a donc des prédicats qu'**aucun delta ne peut satisfaire** — fait de schéma, pas oubli.

| prédicat | producteur réel dans le dossier | ligne it7 | mord ? |
|---|---|---|---|
| `possede_objet(o)` | un `Delta{delta:'donner_objet', cibles:[o]}` à l'un des **4** sites de `CHEMINS_DE_DELTAS` (`tables.ts:636-641`). Rien d'autre : pas d'inventaire de départ (`types.ts:1401-1405`), pas d'objets posés dans un lieu (`types.ts:926-941`) | productible **ssi** un tel delta existe | **oui** |
| `indice_connu(i)` | `producteursParIndice(dossier).get(i)` **saturé** (it6, `atteignabilite.ts:182`) | productible **ssi** `sources.length > 0`. **Réutilisation, jamais un second parcours** — deux parcours seraient deux vérités | **oui** |
| `pnj_a_revele(p, i)` | un `savoirs[]` de **p** dont `indice_id === i`. `reveler_indice` écrit `indices_connus`, **pas** `pnj.<id>.a_dit` (`deltas.ts:66-67` vs `predicates.ts:61-66`) : aucun delta ne peut satisfaire ce prédicat | productible **ssi** la **paire** existe. Arité 2 → évaluée **jointement** | **oui** |
| `jalon_atteint(j)` | (a) `Delta{delta:'atteindre_jalon', cibles:[j]}` ; (b) le jalon porte `declencheur_expr` (`types.ts:1418-1423`) | **constante vraie** si `j` existe : la porte (b) est nommément dans H2 (`atteignabilite.ts:44-45`) et dans le goal d'it8 | non (it8) |
| `lieu_visite(l)` | **aucun mécanisme** : `deplacer_vers` écarté, `lieux[].acces` n'existe pas (KR-200/205) | **constante vraie** — KR-224, monde ouvert | non |
| `lieu_courant_est(l)` | idem | **constante vraie** — KR-224 | non |
| `evenement_consomme(e)` | **aucun delta** (`consommer_evenement` écarté) ; le marquage appartient au moteur n° 9/14 | **constante vraie** si `e` existe — même prudence que le climat compté par it6 | non (it8) |

**Trois lignes mordent, quatre se taisent.** À écrire dans la docstring de la règle et dans le plan : c'est la portée réelle d'it7, et la taire ferait exactement le défaut KR-199 (un nom plus large que ses assertions).

Note de cohérence : les quatre lignes constantes se **resserrent** à it8 sans toucher le squelette — la table est le seul point de changement, et c'est ce qui justifie de la poser totale dès maintenant.

**H3, hypothèse datée à écrire au fichier (forme KR-224 / H1-H2)** : « le seul producteur de `monde.pnj.<id>.a_dit[]` est un `savoirs[]` du personnage porteur ». Rien ne l'établit hors de `predicates.ts` ; c'est la **seule** ligne du tableau où une décision de la n° 11 pourrait transformer un vrai positif en faux positif. Elle se corrige à un endroit.

## 3. Le sens d'erreur — où la règle se tromperait en rouge

Par ordre de probabilité :

1. **`ou` traité comme `et`** — l'auteur a écrit un second chemin, le linter exige les deux.
2. **`non` dont on descend le sous-arbre** — « ne pas posséder l'objet X » exigerait un producteur de X, alors que la condition est satisfaite d'emblée.
3. **`lieu_visite` / `lieu_courant_est` traités comme exigeant un mécanisme** — « atteindre le sanctuaire » remonterait bloquant à tort, cas nommé par KR-224.
4. **`jalon_atteint` / `evenement_consomme` exigeant une porte** — importe dans it7 le sens d'erreur d'it8.
5. **Cible qui ne résout aucune entité** — `reference-pendante` de sévérité `error`, structurellement absente d'un dossier persisté (KR-225) ; la traiter doublerait le canal (KR-217). **Garde explicite : zéro constat**, même geste que la garde 2 de `depart-desert`.
6. **Extension à `echoue_si_expr`** — une condition d'**échec** inaccomplissable n'est pas un défaut ; faux positif par construction.

À compter productible **par prudence**, exactement comme it6 compte le climat : les **quatre** lignes constantes, et toute feuille dont la cible ne résout pas.

Un point qui joue **en faveur** du linter et qu'il faut écrire : la ligne `possede_objet` n'est décidable **que** parce que l'IA ne touche jamais à l'inventaire. Si un narrateur pouvait accorder un objet en le racontant, « aucun `donner_objet` » ne prouverait rien. La frontière code/IA n'est pas ici une contrainte subie : c'est **la prémisse qui rend la règle vraie**.

## 4. Ce que cette règle FIGE pour le moteur (n° 9)

Le linter **présuppose** trois choses, et une seule ligne doit les renvoyer plutôt que les recopier :

- un objectif est accompli quand le moteur **évalue** `reussi_si_expr` contre l'état de session, `et`/`ou`/`non` en sémantique booléenne classique, chaque prédicat lisant le champ nommé dans `predicates.ts` — raison exacte pour laquelle `objectif_atteint` est écarté comme **circulaire** (`predicates.ts:16-17`) ;
- le moteur est le **seul** écrivain de ces champs ; le modèle n'en écrit aucun ;
- `reussi_si_expr` est destination `moteur` et `reussi_si_texte` destination `auteur` (`destinations.ts:139-140`). **Ni l'un ni l'autre n'entre dans un contexte de modèle.** Le rapport les rend à l'**auteur**, ce qui est licite et sans rapport.

Ligne de renvoi à écrire, et rien de plus : *« L'évaluation en session appartient à la n° 9 `moteur-dossier` ; ce module ne l'implémente pas et ne la paraphrase pas. »*

## Contrat de sortie IA concerné

- **Entrée injectée au modèle** : **aucune**. `controlerDossier` est pure, totale, synchrone, sans appel de modèle.
- **Schéma de sortie du modèle consommé** : **aucun**.
- **Comportement en cas d'échec** : sans objet. Les deux comportements d'échec de la tranche sont internes et déjà normés : feuille non résolue → zéro constat ; `remediation` sur un constat fabriqué → **chaîne vide**.
- **Contrat CONTRAINT en aval** : la n° 10 ne doit jamais injecter `canon.objectifs[].reussi_si_expr` / `reussi_si_texte` / `camp` ; la n° 9 tient l'évaluation.
- **Budget de contexte / mémoire de session** : hors périmètre, et je le dis plutôt que d'inventer une borne.

## REJETÉ — à recopier au § 8 du plan

1. **REJETÉ — « toutes les feuilles de `reussi_si_expr` doivent être productibles ».** Faux positif bloquant sous `ou` et sous `non`.
2. **REJETÉ — descendre dans le sous-arbre d'un `non`.** Les six champs de session lus partent vides, `non(P)` est vrai au tour zéro.
3. **REJETÉ — réutiliser `collectRefs` (`expr.ts:258`).** Elle aplatit `ou` et descend dans `non` : correcte pour les références, fausse pour la satisfiabilité.
4. **REJETÉ — exiger un mécanisme pour `lieu_visite` / `lieu_courant_est`.** KR-224, monde ouvert.
5. **REJETÉ — exiger `declencheur_expr` sur le jalon ou l'événement dans it7.** Charge d'it8, sens d'erreur inverse.
6. **REJETÉ — évaluer `pnj_a_revele` comme deux feuilles indépendantes.** Seule la paire produit ce fait.
7. **REJETÉ — un second parcours des producteurs d'indices.** `producteursParIndice` est réutilisé tel quel.
8. **REJETÉ — étendre à `echoue_si_expr` ou `charpente.fins[].condition_expr`.** Une condition d'échec inaccomplissable n'est pas un défaut ; « aucune fin atteignable » est une cause distincte (KR-164).
9. **REJETÉ — une ligne de rapport par feuille en défaut.** N lignes pour une cause ; le groupement est déjà REPORTÉ. **≤ 1 constat par objectif.**
10. **REJETÉ — nommer la fonction `evaluateExpr`.** Deux traversées, deux sémantiques = règle dupliquée.
11. **REJETÉ (veto préventif) — injecter `reussi_si_expr` ou `reussi_si_texte` dans un contexte de modèle.** Un narrateur qui connaît la condition de réussite y conduit.
12. **REJETÉ — affirmer au plan la couleur d'un test sans l'avoir exécuté.** Les deux mutants se mesurent à l'essaim.
