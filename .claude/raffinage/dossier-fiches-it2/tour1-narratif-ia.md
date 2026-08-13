# TOUR 1 — Narratif & IA · `dossier-fiches` it2

**RISQUE** — it2 fait entrer les trois premières proses `ia` de la fiche PNJ, l'entité la plus souvent injectée du dossier : un lieu entre une fois par déplacement, un PNJ présent entre à *chaque* tour (n° 12 = un appel par PNJ qui parle). Six fiches × trois proses libres, et personne ne sait ce que pèse le contexte au tour 40. Le canon est tenu sous 600 mots ; la couche « à la demande » n'a, elle, aucune borne. C'est mon critère de veto « contexte sans borne » — non franchi seulement parce que le cadrage me demande de le trancher.

**OBJECTION** — Le goal n'écrit nulle part ce qui distingue `apparence` de `description_joueur`. Deux proses `ia` sans discriminant sont un champ payé deux fois, puis deux vérités concurrentes (« grand et sec » / « trapu ») que le narrateur lira dans le même contexte.

**PROPOSITION** — (1) Discriminant écrit, docstring + placeholder épinglé par test : `fonction` = ce qu'il est dans le monde ; `apparence` = ce que le narrateur décrit à son entrée en scène ; `description_joueur` = ce que le joueur peut en savoir sans enquête, par analogie avec `accroche_joueur`. (2) Régime : **injecté, jamais émis verbatim**, aucun renommage — `_joueur` désigne l'audience, pas le régime, et les deux coexistent déjà (`accroche_joueur` ia / `texte_ouverture_joueur` moteur). (3) Borne : `BUDGET_MOTS_PROSE_PERSONNAGE = 60`, trois lignes de `BUDGETS_DE_MOTS`, avertissement jamais bloquant ; dérivation 3 PNJ × 3 proses × 60 = 540 < 600. Rendu par lecture dérivée indexée sur le personnage — même semis à deux personnages que le durcissement d'écriture, et `commit() → EcritureDossier` y gagne un consommateur réel (`ecrit` porte des warnings). (4) « Il est très fort » vs `stats.FO` : de personne ici — le modèle ne voit jamais `FO`, c'est une dérivation de libellé, propriété n° 10.

**VERDICT** — recevable sous réserve : (1), (2) et (3) dans le lot contrat de cette itération.

---

## ANNEXE — contrat de sortie des champs entrants

### Les trois champs terminaux, destination et motif

| Chemin normalisé | Destination | Motif (une ligne) |
|---|---|---|
| `monde.personnages[].fonction` | **`ia`** | Ce que le personnage *est* dans le monde (métier, rang, charge) — le narrateur ne peut pas l'incarner sans le lire ; même famille que `monde.lieux[].description`. |
| `monde.personnages[].apparence` | **`ia`** | Ce que le narrateur décrit quand le personnage entre en scène (physique, voix, signes) — donnée de jeu, pas note de rédaction. |
| `monde.personnages[].description_joueur` | **`ia`** | Ce que le joueur peut savoir ou entendre dire de lui sans enquête (réputation publique) — **injecté**, jamais émis verbatim. |

Aucun de ces trois n'entre dans `CHAMPS_REQUIS`, `ENUMERES_FERMES`, `REFERENCES_SIMPLES`, `LISTES_REQUISES` ni `FAMILLES_DE_CONDITIONS` : prose libre optionnelle, absence = état calme (doctrine « absent ≠ vide »).

### Ce qu'il faut écrire dans `destinations.ts`

Bloc de commentaire + trois lignes, à poser dans la section `── monde.personnages ──`, avant `plan_actions` :

```ts
// LES TROIS PROSES D'IDENTITÉ — `ia` et non `auteur`, même arbitrage que les trois
// proses de `monde.lieux[]` : le narrateur du Temps 2 doit les LIRE pour incarner
// le personnage, ce n'est pas une note de rédaction. Le suffixe `_joueur` de la
// troisième désigne l'AUDIENCE (ce que le joueur peut savoir du personnage), JAMAIS
// le régime d'émission : elle est INJECTÉE comme les deux autres. Les deux régimes
// coexistent déjà sous ce suffixe — `canon.partage.accroche_joueur` est `ia`,
// `charpente.depart.texte_ouverture_joueur` est `moteur` et reste la SEULE prose
// émise mot pour mot. Une fiche affichée verbatim au joueur serait un champ neuf et
// une décision de la n° 12, jamais une relecture de celui-ci.
'monde.personnages[].fonction': 'ia',
'monde.personnages[].apparence': 'ia',
'monde.personnages[].description_joueur': 'ia',
```

### Comportement en cas d'échec de validation (le « contrat de sortie » côté écriture)

Il n'y a pas de sortie de modèle à ce stade — le contrat concerné est celui de l'**écriture d'auteur** :

- `statut: 'refuse'` → `RefusEnCours{personnageId, issues}` ; le bandeau porte l'identifiant du personnage **en cause**, pas celui affiché (KR-197). Depuis ce bloc, `refuse` reste structurellement peu atteignable : construire l'état se justifie par `absent` + par le chemin de refus qu'ouvriront les itérations suivantes, pas par les trois proses.
- `statut: 'absent'` → message, et surtout **pas de silence** : c'est le no-op muet qu'it1 avalait.
- `statut: 'ecrit'` avec `warnings` → **rendus**, sinon la borne du point (3) n'existe pas. Rendu par **lecture dérivée** (`useMemo` sur `validateDossier(dossier).warnings`), filtrée sur le chemin concret `monde.personnages[<index>].` du personnage affiché — jamais un état semé depuis le retour de `commit()` (KR-189). `Site.path` porte l'indice concret et `Site.location` nomme déjà « Personnage « X » ».

### Table et constante

`types.ts` — constante nommée (KR-165), jamais un nombre en dur au site de validation :

```ts
/** Le budget de mots CONSEILLÉ pour une prose d'identité de personnage. Dérivé du
 *  budget du canon, pas choisi : le canon (600 mots) est le SEUL bloc toujours
 *  chargé, la fiche est injectée à la demande mais à CHAQUE tour où le personnage
 *  est en scène. Trois PNJ présents × trois proses × 60 = 540 mots — la couche à la
 *  demande reste sous la couche toujours chargée. Dépassement = AVERTISSEMENT. */
export const BUDGET_MOTS_PROSE_PERSONNAGE = 60
```

`tables.ts` — trois lignes de `BUDGETS_DE_MOTS`, `location: 'Personnages'`, sujets : `'La fonction de ce personnage'`, `"L'apparence de ce personnage"`, `'La description joueur de ce personnage'`.

### Fixtures — où instancier, et sur qui

`__fixtures__/dossier-minimal.json` — **obligatoire, les trois**, sur le seul personnage. C'est la fixture que balaie `couverture.test.ts` : sans instance ici, les trois lignes de `destinations.ts` sont **mortes** (assertion « aucune ligne morte ») et les trois lignes de `BUDGETS_DE_MOTS` échouent la 4e assertion. Prose courte obligatoire : `couverture` exige `warnings === []`.

`__fixtures__/dossier-reference.json` — au moins une instance des trois, **pas toutes sur le même personnage** :

- les **trois** sur `pnj.corvin-le-marchand` (premier plan, **sans camp**) — prouve que l'identité ne dépend pas du camp ;
- `fonction` **seule** sur `pnj.harek-le-forgeron` ;
- **aucun des trois** sur `pnj.tobin-le-gamin` (second plan) — « absent ≠ vide ».

Contrainte respectée : `suffisance.test.ts` exige clés(référence) ⊆ clés(minimale) — satisfait puisque la minimale porte les trois.

### Tests que le lot contrat doit livrer

`couverture.test.ts` :

- trois entrées `LIBRES` avec un motif **distinct** de `PROSE_D_ENTITE_LIBRE` — celui-ci affirme « aucun `BUDGETS_DE_MOTS` sur `monde.lieux[]` » et deviendrait **faux** recopié ici.
- un test nommé : « les trois proses d'identite portent la destination ia et une instance dans les DEUX fixtures » — assertion sur la **valeur**, pas sur l'existence (KR-174, leçon de BUG-051).

`validate.test.ts` : budget dépassé sur `fonction` → `warning`, `ok` reste `true`, le message nomme le personnage porteur par `location` (miroir du test de budget du canon).

`panneauPersonnages.test.tsx` : le semis à **deux personnages** sert deux preuves d'un coup — l'écriture indexée et l'affichage indexé de l'avertissement de budget (un personnage sous budget, l'autre au-dessus ; le bandeau ne suit pas la sélection).

### Reports posés

- **Budget rétroactif des proses `ia` déjà livrées** (`monde.lieux[].description|ambiance|dangers`, `plan_actions[].action`, `savoirs[].revele_comment`) : hors périmètre d'une itération personnages, propriétaire n° 10 (« budget par tour »). Règle durable proposée : **toute prose `ia` entrant au schéma entre avec sa ligne de budget**, comme un `…_texte` entre avec sa famille.
- **Contradiction prose / caractéristique** (`apparence` « très fort » vs `stats.FO`) : propriétaire n° 10, même arbitrage que les libellés de curseurs. it2 ne doit que le placeholder (« l'apparence décrit, elle ne chiffre pas — la force se règle aux caractéristiques »).
