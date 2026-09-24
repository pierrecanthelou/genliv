# Tour 2 — narratif-ia — moteur-dossier it3

*Relevé par lecture et grep sur l'arbre de travail, propre pour `src/` — donc identique à `HEAD`. **Aucun test exécuté** ; chaque chiffre est étiqueté « dérivé par lecture, le lot mesure ».*

```
RÉPONSE — Tech-lead, X-1 : ta mesure porte sur `fins[].condition_expr`. Or la règle n'a
qu'UN site d'appel — `controles.ts:1222`, sur `canon.objectifs[].echoue_si_expr` SEUL. Aucun
`echoue_si_expr` des deux fixtures ne porte `lieu_visite` ; le mot est absent de
`controles.test.ts`. Ton coût est nul : `'faux'` ne traîne pas ce fichier. Il entre pourtant
au lot, par `possede_objet` : `non(possede_objet(sceau))` y est « l'unique témoin réel du
dépôt » (`:277`) et l'`indecidable` éteint son alerte — ton INTERDIT est faux.
Prémisse commune : « sous-tirer seulement » gouverne une cellule qui PEUT se tromper. Une
cellule DÉTERMINÉE n'a pas de direction d'erreur — sinon `lieu_courant_est: 'faux'` serait
illégale, elle qui interdit le faux positif.

MES OBJECTIONS
1 · KR-238 faux — MAINTENUE (M-1 confirme). Phrase de remplacement en annexe A.
2 · Projection sans lecteur — RETIRÉE sur le code ; DURCIE sur son EXPORT AU BARIL.
3 · « PURE, totale » — DURCIE, mesurée : `commandes.ts:175` écrit déjà « il NE LÈVE PAS …
    lever sur un chemin utilisateur donne un écran blanc », et it3 y greffe l'appel qui lève.

POSITION
X-1 · maintenue — sur `dossier-minimal` (UN seul lieu) les deux formes sont indiscernables ;
      l'écart naît au second lieu, que `dossier-reference` porte.
X-2 · retirée sur le code, durcie sur le baril.
X-4 · tranché : UNE entrée, `jalons_atteints : jalon.<id>` ; `PredicatId` REFUSÉ.
M-3 · quatrième cellule = `jalon_atteint` : valeur juste, MOTIF faux après it3.

VERDICT — recevable sous réserve (réserve n° 1 : AUCUNE fixture ne peut atteindre un jalon
APRÈS une commande — annexe E, c'est la phrase de démo qui est en cause).
```

## A. KR-238 — le texte de remplacement, mot pour mot

> **KR-238** — l'évaluateur bivalent **LÈVE** sur une entrée non reconnue ; il ne rend **jamais** `false`. Motif : un repli `false` n'est pas neutre sous une négation — `non(<nœud non reconnu>)` rend alors `true`, et le moteur tient pour **acquis** un fait qu'il n'a pas su lire, dans la seule direction que ce dispositif s'interdit : le **faux positif** sur une condition d'objectif ou de fin. **Mutant obligatoire** : `default: return false`. **Il ne se démontre sur aucune fixture du dépôt** — les trois `fins[].condition_expr` écrites sont des `et` dont un conjoint est faux par l'état d'ouverture, si bien que le mutant y survit **vert**. Le témoin se construit donc sur un **nœud fabriqué** (un `op` hors registre, casté), placé **sous un `non` au sommet**, et jamais sur une fixture.

Conclusion et mutant **inchangés** ; la promesse fausse est remplacée par le **fait mesuré** et par la consigne de construction. **Le KR ne promet plus rien que le dépôt ne porte.**

## B. Le crible des SEPT cellules

**La règle, écrite une fois** : *une cellule ne vaut `'vrai'`/`'faux'` que si le champ qu'elle value est écrit par le DOCUMENT, ou par AUCUN `DeltaId`.*

| cellule | champ | `DeltaId` écrivain | atteignable par un `Jalon.effet[]` au tour zéro | verdict it3 |
|---|---|---|---|---|
| `possede_objet` | `objets_possedes` | `donner_objet`, `retirer_objet` | **OUI** | → `indecidable` |
| `indice_connu` | `indices_connus` | `reveler_indice` | **OUI** | → `indecidable` |
| **`jalon_atteint`** | `jalons_atteints` | **`atteindre_jalon`** | **OUI** | **valeur inchangée — MOTIF à réécrire** |
| `pnj_a_revele` | `pnj.<id>.a_dit` | aucun (arité 1, sans opérande `pnj`) | non | `'faux'` **survit par mesure** |
| `evenement_consomme` | `evenements_consommes` | aucun (`consommer_evenement` **écarté**) | non | `indecidable` inchangé |
| `lieu_courant_est` | `lieu_courant` | aucun (`deplacer_vers` **écarté**) | non | trivalent inchangé |
| `lieu_visite` | `lieux_visites` | aucun (pas de `visiter_lieu`) | non | **X-1** |

**La quatrième cellule que personne n'avait nommée est `jalon_atteint`, et c'est un défaut de MOTIF, pas de valeur** — même famille que KR-238. Sa JSDoc dit aujourd'hui « *un `declencheur_expr` que la n° 9 RÉSOUDRA avant le premier tour (décision (i), livrée à l'itération 3)* » : après it3 la décision **est** livrée, la phrase promet un futur qui a eu lieu, et un relecteur conclura que la cellule peut décider. **Motif de remplacement** :

> `jalon_atteint` — `indecidable`, et **non plus faute de champ** : la n° 9 résout les `declencheur_expr` à l'ouverture, mais par un **point fixe** dont ce module ne tient aucune copie. Décider ici exigerait de rejouer l'évaluateur, c'est-à-dire d'en fabriquer un second (KR-237). L'indécidable ne tire pas : le coût est nul.

**Deux réouvertures nommées feraient tomber deux cellules de plus** — `deplacer_vers` et `consommer_evenement`, dans les ÉCARTÉS de `deltas.ts`. À écrire dans H6 **en une ligne, pas en test** : un test sur une liste d'écartés est un test sur une intention.

**Comptes de prose devenus faux** *(dérivés par lecture)* : `tourzero.ts:126` « trois `indecidable` » → **quatre** · `tourzero.test.ts:187` → quatre/trois · `tourzeroOracle.test.ts:35-42` « ASYMÉTRIE MESURÉE » **intégralement faux** · plancher `>= 6` → **4** (« le tech-lead annonce 5 ; c'est 4 — il n'avait pas compté `possede_objet` »).

## C. X-4 — la forme finale du journal

**UNE entrée `role: 'moteur'` par jalon atteint**, au même `tour` que sa cause :
```
texte  : `jalons_atteints : jalon.premiere-vigie`
origine: ABSENT
deltas : [ { delta:'reveler_indice', cibles:['indice.pas-dans-la-cendre'], effet:'applique' } ]
```

**Pourquoi UNE et non deux — l'argument n'est pas la place, c'est la DOUBLE REPRÉSENTATION.** L'UX refuse elle-même de rendre `journal[].deltas` (son REJETÉ 5 du tour 1) et propose d'en recopier le contenu dans le `texte` d'une seconde entrée. L'effet vivrait **deux fois** : en donnée et en prose. C'est le défaut exact que le tech-lead ferme en refusant `deltas: []` au profit d'`undefined`. **Une entrée, les effets en `deltas[]`.**

**Ce que l'auteur perd : rien que le `goal` promette.** La phrase dit « l'auteur voit **un jalon** s'atteindre », sans « et ses effets ». **Les pastilles sont un bonus optionnel.**

**`PredicatId` ne franchit pas ma ligne — et je le refuse quand même.** Le registre est clos, bas-de-casse, dérivé par `keyof` : aucun nom libre n'entre. Mais **(1)** un prédicat est une **QUESTION**, pas un fait : y écrire l'identifiant de la question met un vocabulaire interrogatif dans une case déclarative ; **(2)** `jalons_atteints` (champ) et `jalon_atteint` (prédicat) se ressemblent trop pour qu'un lecteur sache lequel il lit. **Un seul espace : les noms de champs d'`EtatMonde`.** Le « repli sûr » que l'UX range elle-même en second est donc ce que je retiens — **ce n'est pas un désaveu de sa note**.

## D. X-2 — ce que je retire, ce que je durcis

**RETIRÉ** : mon rejet de `projeterJalonsAtteints` **en tant que code**. Le tech-lead a raison sur le domicile, et le critère C de la QA lui donne un témoin **réel** — la sérialisation, qui sépare du mutant `jalons.filter(atteint)` là où un test de forme resterait vert. **Je ne bloque pas un code qui a un mutant nommé et un test qui le tue.**

**DURCI** : son **export au baril**. En it3 elle a **zéro consommateur**. Exporter une valeur qui porte `enonce_texte` (audience `'ia'`) à toutes les features, sans appelant et sans garde, c'est ouvrir la porte du verbatim et n'avoir **rien** qui rougisse le jour où quelqu'un la franchit. **`projeterJalonsAtteints` et `JalonAtteint` ne sortent pas de `brain/dossier/` en it3** ; `evaluate.test.ts` les importe directement. L'export part **avec son premier consommateur**, n° 10.

## E. RÉSERVE n° 1 — mesurée, et elle vise la phrase de démo

**Aucune des deux fixtures ne peut produire un jalon qui s'atteint APRÈS une commande.**

| fixture | jalon | déclencheur | atteignable en jouant ? |
|---|---|---|---|
| `dossier-minimal` | `jalon.premiere-nuit` | `lieu_visite(<départ>)` | se déclenche **à l'ouverture** — et aucune entrée de journal n'y est écrite. **Un seul lieu** : aucun `ALLER` possible |
| `dossier-reference` | `jalon.premiere-vigie` | `lieu_visite(lieu.vigie-du-nord)` | **`vigie-du-nord` n'a pas d'`acces` et n'est dans l'`acces` d'aucun lieu** — **inatteignable par `ALLER`, jamais** |
| `dossier-reference` | `jalon.second-guet` | **sans `declencheur_expr`** | jamais atteint automatiquement |

**L'objection 2 du PM n'est pas un raffinement, c'est un trou structurel.** Soit l'auteur ne voit rien (ouverture, sans journal), soit le scénario n'existe pas (post-commande, inatteignable). **Le critère de rendu est insatisfiable sans toucher une fixture.**

**Réparation la moins chère, recommandée** : **une ligne** dans `dossier-reference.json` — `lieu.tour-effondree`.`acces` = `["lieu.foyer-du-guet", "lieu.vigie-du-nord"]`. Le départ atteint la tour, la tour atteint la vigie : **deux `ALLER` et le jalon bascule en session**. Elle donne d'un coup le scénario post-commande du PM, la ligne visible de l'UX, et le second lieu qui rend X-1 observable — **sans toucher `dossier-minimal`**, dont l'oracle dépend cellule par cellule. Coût : `controles.test.ts` se re-baseline.

**Variante REFUSÉE** : ajouter un **jalon neuf**. Un `effet[]` de plus modifie les producteurs lus par `atteignabilite.ts` et peut éteindre un `objectif-sans-chemin` existant — bien plus de surface qu'une arête de graphe.

## F. `controles.test.ts` entre au lot — ce que ça coûte

Mesuré par lecture, il rougit dès que `possede_objet` passe à `indecidable` : `:1672` (la ligne de base, dont le commentaire appelle l'alerte « un **VRAI POSITIF** du dossier de référence »), `:2341`, `:2369-2371` (les **deux** messages tombent à un ; le commentaire « son témoin porte DEUX constats, un par polarité » devient faux).

**Ce qu'on perd est une alerte JUSTE** : « *Cette condition d'échec tient à « possède l'objet » …, encore faux avant la première action du joueur.* » C'est le prix de la sur-prudence, **dans la direction permise** (silence).

**Et c'est ici que X-1 se paie vraiment.** Sous `'faux'`, `non(lieu_visite(<ailleurs>))` fait encore tirer la règle — et c'est **littéralement la forme que l'auteur de `dossier-reference` a écrite**. Sous `'indecidable'`, le témoin de la règle ne peut plus être qu'un clone muté. **Une règle livrée dont le seul témoin est synthétique n'est pas fausse — elle est invérifiable.**

## G. Contrat de sortie IA — inchangé

**Aucune sortie de modèle.** Le seul artefact IA-facing reste la projection, dont le contrat s'exécute en **n° 10** : entrée = `jalons_atteints[]` × `charpente.jalons[]` du dossier gelé, **jamais** `declencheur_texte`/`declencheur_expr`/`effet[]` · sortie `{ jalon_id, enonce }[]` nominale · borne d'**agrégat** propriété de la n° 10 · handle pendant **exposé, jamais filtré** (KR-021) · `MARQUEUR_A_ECRIRE` non injecté · **zéro ligne** dans `sessionDestinations.ts`, audience héritée en docstring. **Les trois lignes ajoutées par it3 sont toutes `'moteur'` : conforme.**

## H. TOUS les REJETÉS (BUG-082)

1. **La projection en it3, code compris** — **RETIRÉ** au tour 2.
2. **L'export de `projeterJalonsAtteints`/`JalonAtteint` au baril** — **REJETÉ, DURCI**.
3. **Toute ligne `'ia'` dans `sessionDestinations.ts`** — REJETÉ, maintenu.
4. **`enonce_texte` ou `jalons[].nom` dans le `texte`** — REJETÉ, maintenu.
5. **Un `catch` autour de l'évaluateur, ou tout repli `false`** — **REJETÉ, DURCI** : je sais maintenant **où** quelqu'un voudra le poser (`commandes.ts:175` écrit « lever sur un chemin utilisateur donne un écran blanc », et it3 y met l'appel qui lève). La parade est la porte `jouable` **nommée au plan** + les deux docstrings qualifiées (« totale **sur un dossier accepté par `validateDossier`** »).
6. **Un balayage de `charpente.jalons[].effet[]` depuis `tourzero.ts`** pour garder `possede_objet` exact — **REJETÉ**, alors qu'il rachèterait l'alerte perdue : il casse le test-grep du **lecteur unique** de `charpente.jalons` (KR-246), met la sémantique des jalons dans **deux** modules, et demande une correspondance `delta → champ écrit` qui n'existe dans aucun descripteur.
7. **`PredicatId` au vocabulaire du journal** — REJETÉ (§ C).
8. **Deux lignes de journal** — REJETÉ : double représentation.
9. **Ajouter un jalon neuf à `dossier-reference.json`** — REJETÉ au profit d'une **arête d'`acces`**.

## I. Décisions en autonomie

- **Remplacement de KR-238** → la phrase du § A → sinon le KR **cède au premier contradicteur**, comme BUG-080.
- **`jalon_atteint`** → valeur inchangée, **motif réécrit** → sinon un relecteur d'it4 conclut que la cellule peut décider et **fabrique le second évaluateur**.
- **Forme du journal** → **une** entrée → sinon double représentation et borne d'it2 caduque.
- **`PredicatId`** → refusé, repli retenu → sinon deux espaces de noms indiscernables.
- **Projection** → code retenu, **export refusé** → sinon une feature peut réciter `enonce_texte` sans qu'aucun test rougisse.
- **Réparation du trou de démo** → **une arête d'`acces`**, pas un jalon neuf.
- **L'alerte perdue** → **acceptée** (direction permise) ; rachat refusé → sinon `tourzero.ts` devient un second lecteur de `charpente.jalons` et **KR-246 tombe au moment même où il est posé**.
