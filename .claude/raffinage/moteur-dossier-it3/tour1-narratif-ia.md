# Tour 1 — narratif-ia — moteur-dossier it3

**RISQUE** — Le **re-déclenchement**, et la fixture l'arme déjà. `jalon.premiere-nuit` se déclenche sur `lieu_visite(lieu.val-cendre)` — le lieu de **départ**, donc vrai dès l'ouverture et vrai à jamais. Sans garde de transition, le moteur ré-atteint le jalon et ré-applique `reveler_indice` **à chaque pas** : une entrée de journal par pas sans qu'aucun fait ne change, et `monde.jalons_atteints[]` est la **porte déclarée** d'`enonce_texte` pour la n° 10 — contexte sans borne. La garde est l'**appartenance** à `jalons_atteints`, jamais un drapeau « déjà appliqué » (KR-013).

**OBJECTION 1** — **KR-238 est faux au dépôt tel qu'il est écrit**, mesuré sur les **deux** fixtures : les trois `condition_expr` sont des `et` dont le premier conjoint (`possede_objet`, `evenement_consomme`) est faux **par le réel**. Sous `default: return false`, **aucune fin ne se déclenche au tour 1** — le mutant survit **VERT**.
**OBJECTION 2** — la projection des jalons (KR-246) n'a **aucun lecteur non-test** en it3, et son seul lecteur possible réciterait `enonce_texte`, audience `'ia'`.
**OBJECTION 3** — `executerCommande` est documentée « PURE, **totale** » ; it3 y greffe un évaluateur qui **LÈVE**, sans confinement nommé.

**PROPOSITION** — (1) témoin KR-238 sur un nœud **fabriqué** (`{op:'xor'}` casté) sous un `non` au sommet : 2 assertions. (2) `evaluate.ts` entre en **quatrième lecteur** dans `expr.test.ts:420`, vu rouge d'abord, + 4 assertions zéro-import calquées sur `tourzero.test.ts:300-301`. (3) **TROIS cellules, pas une** : `possede_objet` tombe aussi à `indecidable` (`Jalon.effet` admet `donner_objet`) ; `lieu_visite` devient trivalente comme `lieu_courant_est` ; `pnj_a_revele` reste `'faux'`. (4) l'oracle pointe l'état **post-résolution**.

**REJETÉ** — la projection en it3 (reportée n° 10) · toute ligne `'ia'` dans `sessionDestinations.ts` · `enonce_texte` / `jalons[].nom` dans le journal · un `catch` autour de l'évaluateur.

**VERDICT — recevable sous réserve** (les quatre points de PROPOSITION au plan).

---

## A. Contrat de sortie IA

**Il n'y en a aucun dans cette itération, et c'est la propriété à protéger.** Le seul artefact IA-facing est la **projection des jalons**. Son contrat, à **exécuter par la n° 10**, pas par it3 :

- **Entrée injectée** : `monde.jalons_atteints[]` (handles) × `charpente.jalons[]` du dossier gelé. **Jamais** `declencheur_texte` (`auteur`), `declencheur_expr` ni `effet[]` (`moteur`) — les injecter mettrait la règle dans le code **et** dans le prompt.
- **Sortie** : `{ jalon_id, enonce }[]`, type **nominal**, `enonce` = `enonce_texte` **seul**. Ordre = celui de `jalons_atteints` (l'ordre d'atteinte est un fait de session).
- **Borne** : `BUDGET_MOTS_JALON = 20` **par énoncé** ; la borne d'**agrégat** n'existe pas et appartient à la n° 10 — à **nommer là-bas**.
- **Échec** : un `jalon_id` qui ne résout aucun `charpente.jalons[].id` (dossier édité entre deux aperçus — ce que `dossier_maj` existe pour voir) est **exposé, jamais filtré** (KR-021), refus **nommé**. Un `enonce_texte` portant `MARQUEUR_A_ECRIRE` n'est **pas** injecté (famille KR-244).
- **Audience** : la projection est une **valeur de retour**, pas un champ persisté — **aucune ligne** dans `sessionDestinations.ts` (indexée par `keyof EtatSession` ; la stocker serait KR-013). Audience **héritée** d'`enonce_texte` = `'ia'`, à écrire en **docstring**. **Zéro ligne `'ia'` ajoutée par it3.**

## B. Ce qu'un jalon atteint met dans le journal — forme tranchée

**Une seule entrée `role: 'moteur'` par jalon atteint**, au **même `tour`** que la commande qui l'a causée.

```
texte  : `jalons_atteints : jalon.premiere-nuit`
origine: ABSENT
deltas : [ { delta:'atteindre_jalon', cibles:['jalon.premiere-nuit'], effet:'applique' },
           { delta:'reveler_indice',  cibles:['indice.sceau-brise'],  effet:'applique' } ]
```

- `texte` = **nom de champ d'`EtatMonde`** + `:` + **identifiant**. Vocabulaire clos d'it2, zéro mot neuf. Le `→` reste réservé à une transition **scalaire** ; une appartenance d'ensemble n'en porte pas.
- **Jamais `enonce_texte`** (troisième prose verbatim, récitation d'un champ `'ia'`). **Jamais `jalons[].nom`** (audience `'auteur'` — un mot que l'auteur a tapé).
- **Aucune ligne de `texte` par delta** : les effets vivent dans `deltas[]`, rendus en **pastilles** comme `[aller]` rend `origine`. Sinon le journal croît avec le nombre de deltas écrits par l'auteur, et la n° 10 résume du bruit.
- **`origine` absent** : décision d'it2. « Absent » signifie déjà « non causé par une commande ».
- **La n° 10 ne lit rien du journal** : elle lit `monde.jalons_atteints[]`, résout par la projection, injecte `enonce`.

## C. KR-246 — `enonce` désigne bien `enonce_texte`, et c'est pourquoi la projection est REPORTÉE

Elle **porte de la prose `'ia'`**, écrite pour l'assembleur de la n° 10 et pour personne d'autre. En it3 son unique lecteur possible serait un écran — qui la **réciterait**. Un lecteur qui est un **test** ne compte pas (arbitrage d'it2 : « un test est un instrument, pas un chemin de code », KR-249). **REJETÉE en it3, REPORTÉE n° 10** ; KR-246 reste tel quel comme contrainte écrite qui la gouvernera.
*Si le comité la maintient* : elle doit livrer **dans le même lot** sa borne d'agrégat et son comportement sur handle pendant — sinon c'est une autorisation signée d'avance, et je maintiens l'objection.

## D. KR-247 amendé — confirmé, et ce que vaut `effet` sur un delta de jalon

`{ delta, cibles, effet }` sans `origine` : **confirmé**. `effet: 'applique' | 'sans_effet'` n'est pas un ornement : c'est **l'observable du garde de ré-entrée**. `atteindre_jalon` sur un jalon déjà atteint vaut `'sans_effet'` — ce qui rend l'écriture **idempotente par construction**, un seul écrivain par champ, plutôt qu'un `if` dispersé.

**Piège du scénario séparateur** : le garde de transition (on n'évalue que les jalons **non atteints**) **masque** le cas `'sans_effet'` sur `atteindre_jalon` — les deux sûretés se couvrent et le témoin épingle une coïncidence (BUG-113). Le seul état qui sépare **sans** rejouer un jalon : **deux jalons atteints dans la même résolution dont les `effet[]` demandent le même `reveler_indice`** → la seconde entrée vaut `'sans_effet'`. À poser sur `dossier-reference.json`, **pas** sur `dossier-minimal.json`, dont `tourzeroOracle.test.ts` dépend cellule par cellule.

## E. Décision (i) — sens d'erreur, et ce qui peut encore se tromper

- **Sens d'erreur** : `indecidable` **ne tire pas**. La correction ne peut que **sous-tirer** — faux négatif, la direction permise.
- **La table peut encore se tromper, à un endroit que le cadrage ne nomme pas.** `Jalon.effet` admet les **quatre** deltas, `donner_objet` compris. Un jalon vrai à l'ouverture dont l'`effet[]` contient `donner_objet` rend `possede_objet` **vrai au tour zéro** : la cellule `possede_objet: () => 'faux'` devient fausse **par le même canal** que `indice_connu`, dans la **même direction interdite**. **Corriger `indice_connu` seul laisserait la table fausse**, et aucune fixture n'exerce ce cas.
- **`pnj_a_revele: () => 'faux'` SURVIT, par mesure** : `reveler_indice` est d'arité 1 sans opérande `pnj`, donc **aucun** `effet[]` de jalon ne peut écrire `monde.pnj.<id>.a_dit`. Conservée **par mesure**, pas par omission.
- **Décision (ii)** : `lieu_visite` devient **trivalente sur le modèle exact de `lieu_courant_est`** — départ non posé ⇒ `indecidable` ; cible = départ ⇒ `'vrai'` ; cible ≠ départ ⇒ `'faux'`. Le `'faux'` est **déterminé** : aucun delta n'écrit `lieux_visites` (pas de `visiter_lieu` dans `DELTAS`).
- **L'oracle change d'instant, et personne ne le verra si on l'oublie.** S'il résout **après** `ouvrirSession` sans amendement, il certifie un instant que **plus aucun joueur ne voit**, et reste **vert**.
- **À écrire dans la revue** : les cellules passées à `indecidable` **ne sont pas assertées** par l'oracle (solidité seule) — la disparition du faux positif se prouve par l'**absence** de la cellule, jamais par un test vert. En revanche it3 fait **gagner** deux assertions réelles sur `lieu_visite`.

## F. KR-237 — ce qui empêche mécaniquement la fusion, et le trou qui reste

- **Ce qui tient** : `expr.test.ts:411-420` recense les lecteurs **par balayage du disque** et compare à une **liste exacte triée**. `evaluate.ts` la fera **rougir** — le plan doit l'exiger **vue rouge avant amendement**. Un lot qui **supprimerait** `tourzero.ts` ferait rougir la même égalité. C'est le cliquet.
- **Ce qui ne tient pas, et le test le dit (`:364`)** : « `lecteurs` recense des **fichiers**, pas des sémantiques ». Une fusion **à l'intérieur** d'un fichier recensé passe **vert**.
- **4 assertions à ajouter** : le couple zéro-import existe pour `tourzero` ↔ `atteignabilite` (`tourzero.test.ts:300-301`) ; it3 le **triple**. Plus la garde acquise : `Trivalent` reste **privé**, et `evaluate.ts` ne rend **jamais** trois valeurs.
- **Trois questions, trois modules** : « peut-il un jour ? » · « l'est-il déjà avant la première action ? » · « l'est-il **maintenant** ? ». La troisième seule a un état ; c'est elle qui peut être bivalente, et c'est pour cela qu'elle **lève**.

## G. Confinement du `throw` — à trancher au plan

1. **Aucun `catch`, aucun repli.** Un `catch` rendant `false` rouvrirait le faux positif que KR-238 ferme. **REJETÉ.**
2. **Le gardien est en amont** : la porte `jouable` re-vérifiée au montage (KR-239). Un nœud non reconnu n'est pas atteignable depuis un dossier jouable — le `throw` signale « cet état ne devrait pas exister ».
3. **Le contrat de `executerCommande` change** : soit les conséquences vivent dans une fonction **distincte** dont la docstring ne promet pas la totalité, soit la docstring d'`executerCommande` nomme la classe d'entrée qui lève. **Laisser « PURE, totale » sur une fonction qui peut lever est une promesse que le prochain appelant croira** (KR-169).

## H. Décisions prises en autonomie

- **Forme de l'entrée de journal d'un jalon** → une entrée `moteur`, effets dans `deltas[]` en pastilles → sinon le journal croît avec les deltas de l'auteur, la borne d'it2 (~187 o/pas) cesse d'être vraie.
- **Ce que le journal montre** → l'**identifiant seul** → sinon prose verbatim (`enonce_texte`) ou mot d'auteur (`nom`).
- **`origine` sur l'entrée de jalon** → **absent** → sinon élargir `CommandeId` (interdit par it2) ou passer `origine` en `string`.
- **Portée de la correction** → **trois cellules** → sinon la table reste fausse en **faux positif** pour tout dossier dont un jalon d'ouverture donne un objet, et **aucun instrument ne le verrait**.
- **Projection** → **reportée n° 10** → sinon prose `'ia'` sans borne d'agrégat, sans comportement sur handle pendant, avec un test pour seul lecteur.
- **Confinement du `throw`** → aucun `catch`, porte `jouable` gardienne, totalité renégociée → sinon KR-238 est vidé le jour où quelqu'un « répare » un écran blanc.

**Note de méthode** : les deux affirmations porteuses ont été **rejouées au dépôt, pas déduites** — (a) les trois `condition_expr` des deux fixtures sont des `et` à premier conjoint faux au tour 1, donc `default: return false` y survit **vert** ; (b) `expr.test.ts:420` compare une liste **exacte de fichiers**, ce qui attrape la disparition d'un lecteur mais **pas** une fusion interne, comme son commentaire `:364` l'écrit.
