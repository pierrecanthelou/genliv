# Revue d'itération — `dossier-controles` · itération `6`

**2026-09-16** · plan : `.claude/raffinage/dossier-controles-it6.plan.md` · notes de comité : `.claude/raffinage/dossier-controles-it6/`

---

## En une ligne

**L'auteur voit désormais qu'un indice que rien ne racine n'est produit par personne** — la boucle de renvois de la phrase de démo n'en est qu'un cas, et le plus rare : le courant est la chaîne qu'on a oublié d'ancrer. Là où l'outil affichait une simple alerte et laissait publier une aventure injouable.

---

## Les 8 critères

| # | Verdict | Preuve |
|---|---|---|
| 1 — déplacement iso-comportement | **VÉRIFIÉ** | La QA en mode B a **reconstruit T1 elle-même** (aucun commit ni stash n'existait) et rejoué la commande de baseline : **8 suites / 324 tests**, `tsc` propre, `controles.test.ts` à **1 insertion / 1 suppression** — la seule assertion admise. Fichiers restaurés octet à octet. |
| 2 — c'est un point fixe, pas une passe | **VÉRIFIÉ après correction** — voir « Le défaut trouvé » | Témoin final : chaîne **4 nœuds / 3 arêtes** en ordre adverse `[D,C,B,A]`, pairage négatif et ordre renversé dans le même test. Mutant « borne gelée » → **rouge** (`indice.D → 0` reçu au lieu de `1`). |
| 3 — le cycle bascule et se discrimine | **VÉRIFIÉ** | 2 bloquants + `jouable: false` ; savoir sur A dans le même test → A silence (2), B alerte (1). Mutant « branche `enBoucle` supprimée » → rouge. |
| 4 — l'auto-boucle bascule et se discrimine | **VÉRIFIÉ** | Bloquant nue ; savoir sur A → silence (2), même test. |
| 5 — le calme des fixtures ne bouge pas | **VÉRIFIÉ deux fois, indépendamment** | (a) l'ouvrier a lancé la suite **après le code de saturation et avant de toucher un test** : **exactement 2 rouges**, les deux annoncés, sur 432 exécutés ; (b) la QA a écrit un test jetable appelant la fonction directement sur les deux fixtures du disque — référence : 4 indices à 2 ; minimal : `cendres-tiedes` 1, `sceau-brise` 3. |
| 6 — les deux messages se distinguent, celui du cas nu est intact | **VÉRIFIÉ** | Cycle + orphelin dans **un seul** dossier ; `aucun enchaînement` absent du premier, présent du second ; une seule remédiation. `panneauControles.test.tsx` **vert à 0 ligne modifiée**. |
| 7 — le porteur du littéral a déménagé | **VÉRIFIÉ** | `controles.ts` : **0** occurrence de `'reveler_indice'` ; `atteignabilite.ts` : la seule. Grep indépendant de la QA. |
| 8 — le recensement des racines reste borné | **VÉRIFIÉ** | G1 mutation-tué (site `climat` supprimé → rouge exact). G2/G3 sont des assertions statiques **dérivées des registres** (`DELTAS`, `REFERENCES_SIMPLES`), lues et confirmées non littérales. |

---

## Le défaut trouvé — et il l'a été par le seul geste qui pouvait le trouver

**Le témoin du critère 2 ne prouvait pas ce qu'il annonçait prouver.** La QA en mode B a posé deux mutants sur le code livré ; **les 7 tests sont restés verts sur les deux** :

1. **mono-passe** (borne de relaxation gelée à une itération) ;
2. **sur-propagation par composante connexe** (arêtes traitées comme non orientées).

Deux affirmations écrites au plan (§ 8 · C4) et signées par deux rôles étaient donc **fausses**. Les causes, mesurées :

- une chaîne à **2 arêtes** se sature en une passe — le maillon intermédiaire entre dans le `Set` dès la première itération sans jamais être dépilé, et l'étape (d) ne teste que l'appartenance **finale**, sans savoir combien d'itérations l'y ont mis. **Le quatrième maillon est le premier qu'une seconde itération est seule à atteindre** ;
- dans la chaîne rompue, le maillon orphelin est **totalement isolé** — une propagation non orientée n'a rien à lui propager. Il fallait un nœud **relié**.

**Corrigé dans le même lot**, pas reporté : le critère 2 dit littéralement « c'est un point fixe, pas une passe », et un instrument qui ne rougit pas sur une implémentation mono-passe ne vérifie pas ce critère. Chaîne portée à 4 maillons ; témoin d'arête arrière ajouté (`W → X → A`, `A` seul raciné, `X` et `W` à 0, avec le discriminant de l'arête retournée dans le même test). Les deux mutants font maintenant rouge, ligne à ligne.

**Le code livré ne portait aucun des deux défauts** — c'est l'instrument qui était aveugle, pas l'implémentation. Journalisé **BUG-087**.

---

## Le second défaut — trouvé en revue de PR, et il est de la même famille, un cran plus haut

**Le message mandaté par le comité affirmait plus que sa propre démonstration.** `MESSAGE_INDICE_EN_BOUCLE` disait à l'auteur que ses enchaînements **bouclent**. Or la condition d'émission — « des sources brutes existent, toutes sont des arêtes, aucune ne survit » — n'établit pas un cycle : en remontant les amonts d'un indice non produit dans un graphe fini, on tombe sur un cycle **ou** sur une chaîne simplement **non racinée**.

Témoin légal minimal : `monde.indices = [{ id: 'a', mene_a: ['b'] }, { id: 'b' }]`, sans savoir ni delta — `b` recevait le message de boucle alors qu'aucune boucle n'existe. Et ce n'est pas un cas exotique : **c'est le cas le plus probable en pratique**, l'auteur qui chaîne `A → B → C` et oublie de raciner `A`. Le témoin d'arête arrière écrit pour BUG-087 en contenait déjà un exemplaire (`W → X → A`, `X` clé-présente-vide sans boucler) que personne n'avait lu.

**C'est le standard que le comité s'était appliqué à lui-même** en refusant la variante 22 — « il affirme "aucun enchaînement" en présence d'un enchaînement réel : diagnostic auto-contradictoire ». La phrase retenue commettait la même faute sur une autre configuration. Preuve que la dérive est accidentelle : la docstring de production écrivait déjà la **bonne** équivalence ; seul le littéral avait glissé.

Corrigé : le littéral dit désormais ce que l'équivalence démontre (« … des enchaînements qui ne remontent eux-mêmes à aucun personnage ni à aucun effet … »), la constante devient `MESSAGE_INDICE_SANS_RACINE`, et **cinq** commentaires portant la même conflation sont déconflatés — les trois relevés en revue plus deux trouvés au balayage. Surtout, **la distinction est rendue mécanique** : le témoin des trois états porte une chaîne non racinée dont **l'absence de cycle est lue sur la donnée** (l'ensemble des arêtes est épinglé à une arête unique non réflexive, qui ne peut pas former de cycle), et le témoin de la règle assère que le message d'un cycle et celui d'une chaîne **sans** cycle sont identiques. Journalisé **BUG-088**.

---

## Diff, comparé à la liste du plan

| fichier | plan | livré |
|---|---|---|
| `src/brain/dossier/atteignabilite.ts` | **N** | 271 lignes |
| `src/brain/dossier/atteignabilite.test.ts` | **N** | 383 lignes |
| `src/brain/dossier/controles.ts` | **R** | +84 / −107 |
| `src/brain/dossier/controles.test.ts` | **R** | +127 / −30 |
| `src/features/dossier-controles/tests/panneauControles.test.tsx` | **R, attendu inchangé** | **0 ligne** — absent de `git status` |

`src/brain/index.ts` : **0 ligne**, aucun export neuf. Fixtures partagées : **intactes**. Aucun fichier hors liste.

---

## Ce qui a été refusé — ce qu'un diff ne dit pas

Les **24 `REJETÉ`** du registre (§ 8 du plan) ont été vérifiés un par un par la QA contre le code : **aucun n'a été rouvert**. Les plus structurants :

- **un champ discriminant sur `ConstatControle`** — l'interface est exportée et re-sortie par le baril ; le champ serait posable sur les constats des cinq autres règles, donc un état illégal représentable (famille BUG-082) ;
- **un second `ControleId` `indice-en-boucle`** — même cause (« zéro producteur après saturation ») ; un code par cause, jamais par configuration (KR-164) ;
- **un booléen `atteignable` à la place du compteur** — supprimerait le seuil `1 → alerte` livré en it3 : une régression de règle sous couvert de refactor, invisible au diff ;
- **retirer le climat des racines** — ce serait le premier faux positif réel de la règle, et il naîtrait dans l'itération même qui sature ;
- **exporter le point fixe par `brain/index.ts`** — deux motifs distincts, tous deux gardés : zéro appelant, et le graphe de session de la n° 9 n'est pas la clôture statique du dossier ;
- **conserver le fragment `/aucun enchaînement/` en contraignant la prose** — proposition du tech-lead, **retirée par lui-même** : un test de feature ne dicte pas le français d'un module `brain/` ;
- **réécrire l'invariant KR-226** — charge de l'itération 7 ; il est resté **non touché et vert**.

---

## Ce qui a été reporté, et où

- **→ itération 8** : `savoirs[].revele_si.apres_indice_id`, seconde arête `indice → indice` du schéma, **non saturée** ici (porte de racine, pas arête de production). Léguée nommément par **H2** et rendue mécanique par la garde **G3**.
- **→ itération 8** : « porte morte, producteur fantôme » (report d'it5, repointé) — un savoir sans porte compte comme producteur.
- **→ n° 9 `moteur-dossier`** : le seuil `≥ 2 → silence` sous la seconde lecture de `mene_a`. Le point fixe reste valide sous les deux lectures ; seul le **compte** devient trop généreux, et se corrige dans `atteignabilite.ts` en un endroit.

---

## Écarts assumés

1. **L'interprétation de `brut` — le seul arbitrage que le comité n'avait pas rendu.** Le § 11 demandait de discriminer par le compte avant/après saturation « sans champ neuf », ce qui est **incompatible** avec « signature et forme de retour inchangées » : une fonction unique ne rend pas deux index. Résolution de l'ouvrier : la discrimination passe par **l'ensemble de clés** — clé absente = `brut 0`, clé présente à **tableau vide** = des sources existent mais aucune ne survit. **Validé par la QA** : l'équivalence est *structurellement* garantie (les deux cartes partagent exactement le même ensemble de clés, ce n'est pas une coïncidence), le consommateur est unique (grep), l'état est épinglé par un test qui sait échouer. **Réserve retenue** : aucune garde automatique n'empêche un futur second consommateur d'écrire `?? 0` et de perdre la distinction — vigilance humaine assumée, même famille que KR-013/113.
2. **Deux docstrings corrigées en plus des deux mandatées** (`FamilleDeSource`, `SourceIndice`) : elles portaient des affirmations que le plan déclare fausses après saturation (« trois familles offertes », « la saturation aura besoin du PORTEUR »). Les laisser aurait fait voyager l'affirmation démentie dans le module neuf.
3. **Un 4ᵉ `it` de `controles.test.ts` touché** (1 ligne, 0 assertion) : le témoin de la boucle entre dans le balayage de langue. Le plan constatait l'absence des termes interdits **à la main** ; un texte neuf tenu par une relecture humaine n'est tenu par rien (KR-199).
4. **Un test de couture ajouté** — le § 11 qualifie la frontière de non négociable, et une propriété qui ne vit qu'en docstring n'est tenue par personne.
5. **La docstring du point fixe corrigée après la QA** (orchestrateur) : elle illustrait encore par une chaîne à trois maillons, forme dont la mesure venait d'établir qu'elle ne tient pas la borne.

**Blocages non résolus : aucun.**

---

## Porte qualité

| | |
|---|---|
| Prettier | conforme |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur** (1 avertissement **préexistant**, `CharacterCreationScreen.tsx`, jamais touché) |
| `npx jest` | **86 suites / 1237 tests verts** |
| Score de mutation | **non requis, et confirmé plutôt que lancé** — aucun des quatre fichiers mutés (`challenge`, `combat`, `xp`, `characteristics`) n'est au diff |

---

## `RETOUR-COMITÉ`

1. **Le comité a affirmé le pouvoir discriminant d'un test sans l'exécuter — deux fois, et les deux ont traversé.** La skill a déjà une règle pour ça (« une affirmation sur la couleur d'un test se MESURE »), et le comité l'a appliquée aux **valeurs attendues** (mesurées, justes, confirmées à l'unité) mais **pas au pouvoir séparateur du témoin lui-même**. Ce n'est pas la même vérification : « ce test rend 1/1/1 » s'exécute sur le code *bon*, « ce test rougirait sur une mono-passe » ne s'exécute que sur le code *fauté*. **Règle à ajouter : tout témoin dont le plan dit qu'il attrape une implémentation fautive nommée se prouve en écrivant cette implémentation fautive, au raffinage ou au plus tard à l'essaim.** C'est ce que la QA en mode B a fait, et c'est la seule passe qui l'a vu.
2. **Le découpage en trois a tenu.** Le critère de coupe — le **sens d'erreur**, pas le volume — a été confirmé par les faits : la tranche « arêtes » est monotone, ses deux bascules étaient prévisibles et mesurées d'avance, et aucune n'a demandé d'arbitrage en cours de route.
3. **Les deux TEMPS dans un lot unique sont un bon instrument, et bon marché.** T1 constaté vert avec une seule assertion touchée a rendu le déplacement relisible en diff. À reprendre pour tout lot qui déplace du code.
4. **Un plan peut être internement contradictoire sans qu'aucune porte ne le voie** (écart 1) : « sans champ neuf » + « signature inchangée » + « lire deux index » ne peut pas être satisfait ensemble, et ni les deux tours ni la porte mécanique ne l'ont attrapé. Une contradiction de ce type ne se voit qu'en écrivant le code — d'où l'intérêt qu'un ouvrier ait le droit de la signaler plutôt que de la contourner en silence. Celui-ci l'a fait ; c'est le bon comportement.
5. **Je n'ai pas transmis le compte rendu de l'ouvrier à la QA en mode B**, qui n'a donc pas pu juger les quatre écarts déclarés. Défaut d'orchestration, à corriger au prochain essaim : la QA en mode B reçoit le plan, le diff **et** le compte rendu du lot.
