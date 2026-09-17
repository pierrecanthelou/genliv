# Tour 1 — Narratif & IA

**RISQUE** — Le linter devient le premier auteur de la **mémoire de session du Temps 2**. Une table bivaluée DOIT assigner une valeur à `lieu_visite(départ)`, `jalon_atteint`, `evenement_consomme` à t=0 ; aucun champ du document ne les détermine. La n° 9 devrait ensuite se conformer à un linter de document, ou diverger en silence.

**OBJECTION 1** — La **mesure B est un témoin négatif sous hypothèse NON ÉCRITE**. Lu en source : `dossier-minimal.json` porte `evenement.embuscade-du-fanal.declencheur_expr = lieu_courant_est('lieu.val-cendre')` et `charpente.depart.lieu_id = 'lieu.val-cendre'`. Si la n° 9 résout les déclencheurs avant le premier tour, l'événement est consommé à l'ouverture et la branche de `ou` rend `echoue_si_expr` **vraie** à t=0. « Fausse à t=0 » n'est juste que sous une décision moteur non prise — famille BUG-080 — et la ligne de base épinglée basculerait avec elle. Même piège sur `jalon.premiere-nuit` (`declencheur_expr = lieu_visite('lieu.val-cendre')`).

> **VÉRIFIÉ PAR L'ORCHESTRATEUR (2026-09-17)** — relevé direct sur `dossier-minimal.json` : `depart.lieu_id = lieu.val-cendre` ; `evenement.embuscade-du-fanal.declencheur_expr = lieu_courant_est(['lieu.val-cendre'])` ; `jalon.premiere-nuit.declencheur_expr = lieu_visite(['lieu.val-cendre'])`. **L'objection est exacte.** La mesure B du cadrage est amendée en conséquence.

**OBJECTION 2** — Q1 `bloquant` : l'unique témoin du dépôt (mesure A) tire par `non(possede_objet)`, donc **entièrement par H5**, dont l'erreur va dans le sens INTERDIT (KR-227). Bloquer sur le seul canal capable d'un faux positif est le mauvais couple. `alerte`.

**PROPOSITION** — **Trivalué**. `Record<PredicatId, 'vrai'|'faux'|'indecidable'>`, total par compilation (KR-117) ; **deux** cellules décidées, chacune nommant son champ (`lieu_courant_est` → `charpente.depart.lieu_id` ; `possede_objet` → H5), cinq `indecidable`. Kleene ; la règle ne tire que sur le **certain-vrai**. Effets déduits des fixtures, **non mesuré** : A tire, C se tait, B se tait *quelle que soit* la décision de la n° 9. Pas de duplication : la n° 9 **mesure** l'ouverture, ce module dit ce que le document en **détermine** ; la dérive se reconnaît à une cellule `vrai`/`faux` sans champ nommable. Dans `atteignabilite.ts` (contrainte 8a) ; portée `echoue_si_expr` seul (Q4) ; mesure D corrigée **en place**.

**VERDICT** — **recevable sous réserve.** Veto si la table est bivaluée.

---

# ANNEXE

## A. L'hypothèse datée que cette itération ajoute — H6

À insérer dans le bloc d'en-tête d'`atteignabilite.ts`, à la suite de H5. La ligne de titre passe de « itérations 6, 7 et 9 » à « itérations 6, 7, 9 et 10 ».

> **H6 — L'ÉTAT D'OUVERTURE EST CE QUE LE DOCUMENT DÉTERMINE, ET RIEN DE PLUS.** Ce module décide depuis it10 une SECONDE question : non plus « ce fait peut-il un jour être établi ? » (satisfiabilité) mais « ce fait est-il DÉJÀ vrai avant le premier tour ? ». La seconde a besoin d'un ÉTAT ; un document n'en porte pas. H6 dit lequel, et surtout ce qu'elle refuse d'en dire.
>
> CE QU'ELLE SUPPOSE — au tour zéro, **DEUX faits et deux seulement** sont écrits par le document :
>  · `monde.lieu_courant` vaut `charpente.depart.lieu_id`. C'est le seul champ de session qu'un champ du document détermine, et `predicates.ts` le nomme : « **une valeur, pas une liste** ». Conséquence directe : `lieu_courant_est(depart.lieu_id)` est **VRAI** à t=0, donc `non(lieu_courant_est(départ))` est **FAUX** — l'inverse exact de ce qu'un évaluateur naïf dirait, et `dossier-minimal.json` porte déjà ce motif à `charpente.fins[0].condition_expr` ;
>  · l'inventaire est **VIDE**. C'est H5, relue une troisième fois : `donner_objet` est le seul écrivain d'inventaire du registre, `Depart` n'en porte aucun, et LE NARRATEUR NE TOUCHE JAMAIS L'INVENTAIRE. **KR-227 passe de DEUX lignes à TROIS** — `ETABLISSEMENT.possede_objet` (it7), `porteOuverte` (it9), et la cellule `possede_objet` de la table d'ouverture (it10).
>
> CE QUE RIEN N'ÉTABLIT — **les cinq autres champs** (`lieux_visites`, `jalons_atteints`, `evenements_consommes`, `indices_connus`, `pnj.<id>.a_dit[]`) n'ont AUCUN écrivain au document, et leur valeur au tour zéro dépend de deux décisions que la n° 9 n'a pas prises : (i) le moteur résout-il les `declencheur_expr` AVANT le premier tour ? (ii) le lieu de départ compte-t-il comme VISITÉ ? Les deux fixtures exhibent l'ambiguïté : `dossier-minimal.json` déclenche son unique événement sur `lieu_courant_est(<lieu de départ>)` et son unique jalon sur `lieu_visite(<lieu de départ>)`. Sous (i), l'événement est consommé à l'ouverture, et `canon.objectifs[0].echoue_si_expr` — dont il est une branche de `ou` — devient VRAIE à t=0 : le témoin négatif de la mesure B change de couleur sans qu'une seule ligne du dossier bouge.
>
> DANS QUEL SENS ELLE SE TROMPE SI ELLE EST FAUSSE — H6 ne rend `vrai` ou `faux` que sur les deux faits déterminés et `indecidable` partout ailleurs ; la règle ne tire que sur le certain-vrai. Elle ne peut donc que **SOUS-TIRER — faux négatif —, SAUF par le canal de H5**, dont l'erreur va dans le sens INTERDIT. Le jour où une feature accorde un inventaire de départ ou une acquisition jouée en scène, `non(possede_objet(X))` cesse d'être certain-vrai au tour zéro et cette règle **allume un constat sur un objectif qui n'est pas perdu**. C'est le seul canal de faux positif de la règle, il se corrige en UN endroit — la cellule `possede_objet` de la table d'ouverture — et c'est pourquoi le niveau du constat se choisit contre CE canal-là.
>
> CE QU'ELLE N'EST PAS : **H6 ne spécifie AUCUN état de session.** Une cellule qui rendrait `vrai` ou `faux` sur un prédicat que le document ne détermine pas écrirait la mémoire de session du Temps 2 depuis un linter du Temps 1. La discipline tient en une phrase : **toute cellule `vrai`/`faux` NOMME le champ du document qui la détermine ; sans champ nommable, la cellule vaut `indecidable`.**

Sous la forme **bivaluée**, il faudrait au moins **trois** hypothèses de plus — une par champ indéterminé engagé (`lieu_visite(départ)`, résolution des déclencheurs de jalons, résolution des déclencheurs d'événements) —, chacune tranchant à la place de la n° 9 et chacune pouvant se tromper dans le sens interdit. C'est le motif du veto conditionnel.

## B. Contrat de sortie IA concerné

**Aucune sortie de modèle n'est produite, consommée ni validée par cette itération** — relevé, pas formule d'exemption :

| | |
|---|---|
| **Entrée injectée au modèle** | **aucune**. `echoue_si_expr` et `echoue_si_texte` sont l'un MOTEUR, l'autre AUTEUR : D1 + décision B les tiennent tous deux hors du contexte injecté (`destinations.ts`). |
| **Schéma de sortie** | sans objet — la sortie est un `ConstatControle` produit par du code pur. |
| **Comportement en cas d'échec** | sans objet : la valuation à t=0 est déterministe, totale sur un arbre accepté par `validateExpr`, sans dé, sans aléa, sans modèle. |
| **Budget de contexte** | **inchangé — zéro mot ajouté au canon**, zéro injection par identifiant. |
| **Mémoire de session** | **non spécifiée, et c'est l'objet du risque.** Première itération à en avoir besoin ; elle doit s'arrêter à ce que le document détermine. |
| **Frontière dés / stats / inventaire / XP** | **intacte** : `jet` reste NON évalué (H2/H4, KR-193/KR-130) ; `possede_objet` à t=0 se lit par `objetsDonnesDe`, jamais par une supposition d'inventaire de départ. |

## C. Réponses aux quatre questions ouvertes

- **Q1 — `alerte`.** Motif propre à mon poste : l'unique témoin du dépôt passe **intégralement** par H5, la seule hypothèse du module dont l'erreur va dans le sens interdit. On ne pose pas un `bloquant` sur le seul canal capable d'un faux positif. Si le comité tranche `bloquant`, pas de veto (le niveau est terrain PM), mais trois contreparties exigées : tir sur le certain-vrai seul, KR-227 étendu à trois lignes **dans le même lot**, et une remédiation qui nomme les écrans **producteurs**, jamais un éditeur de condition inexistant (BUG-090).
- **Q2 — dans `atteignabilite.ts`.** Un troisième lecteur d'arbre fait rougir la garde de couture, et le faire admettre coûterait le durcissement complet pour un gain nul. **Pas de renommage de fichier.** En revanche l'en-tête du module **doit nommer ses DEUX questions** dès sa première ligne.
- **Q3 — trivalué.** Sous une règle qui pourrait être bloquante, le verdict rendu quand on ne sait pas est **`indecidable`, qui ne tire pas**. Kleene : `non` certain-vrai **ssi** l'enfant est certain-faux ; `et` **ssi** tous certain-vrais ; `ou` **ssi** au moins un. **Deux témoins distincts sont dus et ne se partagent pas** (leçon it9) : (a) un mutant qui rend `'faux'` là où la table dit `'indecidable'` — attrapé par `ou(evenement_consomme(E), …)`, forme de la mesure B ; (b) un mutant qui rend `non` certain-vrai dès que l'enfant n'est pas certain-vrai — attrapé par `non(lieu_courant_est(départ))`, forme de la mesure C. Le premier témoin laisse le second mutant **vert** et réciproquement ; **non mesuré**, à exécuter au plan ou au plus tard à l'essaim.
- **Q4 — `canon.objectifs[].echoue_si_expr` seul.** Une fin vraie à l'ouverture est une **cause distincte** (l'aventure *se termine*, elle n'est pas *perdue*), KR-164 impose un code par cause ; l'élargissement n'a **aucun témoin positif réel** ; et le seul matériau côté fins est précisément le piège de la mesure C, c'est-à-dire un dossier où le bon verdict est le silence.

## D. Mesure D — corriger la prose fausse sans l'effacer

**Oui, dans ce lot** : le `non` est exactement l'endroit où les deux questions du module **divergent**, et l'unique témoin de la mesure A est un nœud `non`. Forme imposée par le précédent `declencheur_expr` (H2, it9) : **on corrige, on n'efface pas**.

> `non` → `null` SANS DESCENDRE, **et le motif de cette ligne a été FAUX** : elle a porté « les sept prédicats lisent des champs de session qui partent VIDES, si bien que `non(P)` est vrai au tour zéro ». C'est faux, et `predicates.ts` le disait déjà : `lieu_courant_est` répond `monde.lieu_courant` — **une valeur, pas une liste** —, qui vaut `charpente.depart.lieu_id` dès l'ouverture. LA CONCLUSION NE BOUGE PAS, et son VRAI motif est plus simple : **la satisfiabilité d'une feuille ne se renverse pas.** Descendre et inverser transformerait une improductibilité (constat solide) en une VÉRITÉ (constat que le document ne porte pas), c'est-à-dire un faux positif sous une règle bloquante. LA VALUATION AU TOUR ZÉRO, ELLE, DESCEND DANS LE `non` (H6) : c'est la seule différence de forme entre les deux traversées, et c'est pourquoi elles restent **deux fonctions**, jamais un paramètre de mode.

Deux effets de bord de rédaction à tenir dans le même lot :
- la docstring de `premiereFeuilleInaccomplissable` dit « SATISFIABILITÉ, PAS ÉVALUATION — aucun état de session lu ». Elle reste vraie **pour cette fonction-là** et devient fausse **pour le module** : la porter au niveau de la fonction, et l'en-tête du module doit dire que la seconde fonction lit un état d'ouverture **hypothétique** (H6), jamais un état de session.
- le commentaire d'`ETABLISSEMENT` annonce « TROIS LIGNES MORDENT, QUATRE SONT NON ÉVALUÉES À IT9 » : la table d'ouverture est une **seconde** table, à ne pas confondre ni fusionner — `lieu_courant_est` y est `true` dans `ETABLISSEMENT` par **ignorance**, `'vrai'` dans la table d'ouverture par **détermination**.

## E. Le précédent de duplication — tranché

**Ce n'est pas la même règle dans deux endroits.** La règle vit à un seul endroit : l'arbre `echoue_si_expr` du document. Ni le linter ni le moteur ne la restatent — les deux la **lisent**. Ce qui diffère est l'**état** contre lequel l'arbre est lu.

À quoi on reconnaîtra la dérive :
1. **Une cellule `vrai`/`faux` sans champ de document nommable en commentaire.**
2. **Un `switch (….op)` dans un troisième module** — la garde de couture l'attrape déjà.
3. **Un paramètre de mode** (`mode: 'satisfiabilite' | 'ouverture'`) sur une traversée unique.
4. Le jour où la n° 9 livre son évaluateur : des cellules `'indecidable'` que le moteur décide **ne sont pas une dette** — la dette serait une cellule que le linter décide et que le moteur décide **autrement**.

## F. Registre de langue (la garde passe de HUIT à NEUF règles)

- **message** : « Cet objectif est perdu dès l'ouverture : sa condition d'échec est déjà vraie avant le premier tour. »
- **remediation** : doit nommer des écrans **producteurs**, jamais l'éditeur de condition (BUG-090). **Je ne l'écris pas** : l'existence des surfaces à nommer est **non mesurée par moi**, et la consigne d'it8 est que la surface se mesure avant d'être nommée.
