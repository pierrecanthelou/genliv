# Revue d'itération — `dossier-copilote` · `3c`

> Plan signé : `.claude/raffinage/dossier-copilote-it3c.plan.md` · comité à 5 rôles, 2 tours, **51 désaccords statués**
> Exécution : **2 lots séquentiels**, un seul arbre de travail — aucun worktree, aucune fusion, aucun essaim.
> État : **non committé**, en attente de la revue tech-lead puis de la validation humaine.

## En une ligne

**L'auteur peut faire compléter les relations d'un personnage** — le copilote propose jusqu'à trois relations, chacune désignant un autre personnage **par rang** et écrivant **en prose** ce qui les lie ; l'auteur les accepte une par une, et chaque acceptation ajoute `{ cible_id, lien, intensite }` à `monde.personnages[].relations[]`.

**C'est le premier rôle mixte du dépôt** : un jeton (mécanisme de l'it2) **et** de la prose (mécanisme de 3a/3b) dans le même élément. Aucun des quatre rôles livrés ne fait les deux, et c'est ce qui a obligé le comité à écrire une **règle de tranchage** (§ « Ce qui a été décidé »).

## Porte qualité

| Instrument | Résultat |
|---|---|
| `tsc --noEmit` | **0 erreur** |
| ESLint | **0 erreur** · 1 warning **préexistant** (`src/player/components/CharacterCreationScreen.tsx:35`), fichier à **zéro diff** |
| `jest` | **101 suites / 1658 tests verts** (départ : 100 / 1641) |
| `npm run test:mutation` | **non déclenché, à bon droit** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché, vérifié par `git status` |
| Table dorée | **sans objet** — aucun registre couvert n'est touché. `INTENSITE_INITIALE` porte elle-même la mention « aucune section de `docs/REGLES-DU-JEU.md` ne la porte » : **il n'y avait aucune section à citer, et c'est une mesure, pas un oubli** |

Porte re-mesurée **trois fois indépendamment** : par chaque ouvrier, par l'orchestrateur à l'intégration, et par la QA en mode B avec un contexte neuf.

## Critères d'acceptation

| # | Verdict | Preuve |
|---|---|---|
| **1** — confinement, texte assemblé | **VÉRIFIÉ** | `contexte.test.ts` : les 8 chemins de l'union sont `'ia'` (assertion de **valeur**, qui nomme le chemin fautif et sa destination réelle), `DEROGATIONS_AUDIENCE` **vide et assertée vide**, et le témoin porte sur le **TEXTE ASSEMBLÉ** — un candidat au `but.pourquoi` non vide et distinct ne le voit jamais apparaître. **Deux tests séparés**, inclusion **et** canari d'absence, comme le plan l'exigeait. |
| **2** — sélection | **VÉRIFIÉ** | `rangs.size === N−2`, aucun rang ne résout le porteur **ni** la cible déjà liée, `entitesInjectees[0] === porteur.id`, `"P2"` résout le **DEUXIÈME** identifiant par `Map.get`. |
| **3** — refus | **VÉRIFIÉ** | `CopiloteService.test.ts` : les **quatre** motifs discriminés **dans le même test**, deux à deux distincts ; worker **non configuré** ET `canon.ton` marqué ⇒ `a-ecrire` (jamais `indisponible`), **zéro `fetch`**. |
| **4** — validateur | **VÉRIFIÉ** | `{"rapports":[]}` ⇒ **`vide`** (non `schema`) · `{"envers":"FICHE"}` ⇒ **`rang-inconnu`** (non `schema`) · doublon intra-lot ⇒ **refus du lot entier**. Test dédié : **les CINQ motifs sont atteignables et discriminés** — première fois dans ce dépôt. |
| **5** — union étiquetée | **VÉRIFIÉ** | Corps asserté par `toEqual({ role, contexte })`, **jamais par inclusion** — et le test **construit le corps fautif** (`{ ...cible, contexte }`) pour montrer que `toMatchObject` serait resté vert. Garde `never` sur le `switch` à cinq branches. |
| **6** — budget | **VÉRIFIÉ** | Budget **mesuré** 17 000 (`M = 5357`, `CANDIDATS_MAX` saturé, 8 chemins assertés non vides) · `TAILLE_MAX_CORPS_IA` **re-dérivé en octets UTF-8 sur les cinq rôles** : **52 224 → 53 248** · `max_tokens: 700`, **ne coïncidant avec aucune des quatre valeurs existantes** (200/100/400/200, vérifié) · `P = 109` **re-compté sur deux fixtures indépendantes**. |
| **7** — acceptation | **VÉRIFIÉ** | `expect(Object.keys(relation)).toEqual(['cible_id','lien','intensite'])` — ce qui verrouille **aussi** contre un `{ ...ajout }` étalé · `toBe(0)` **et** `toBe(INTENSITE_INITIALE)` importée, **jamais `toBeFalsy`** · `'secret' in relation === false` · garde porteur disparu : **aucun `update`, aucun `set`, aucun `emit`**, texte dédié, ligne **jamais** marquée acceptée. |
| **8** — bout-en-bout | **VÉRIFIÉ** | Deux acceptations, `relations[]` porte les deux entrées exactes, `validateDossier(...).errors` **vide** · et une **auto-relation écrite à la main reste strictement intacte** (KR-194) après acceptation d'une autre. |

**8 / 8.**

## Ce qui a été mesuré plutôt que déduit

Le plan exigeait onze mesures. Les onze ont été faites, et **trois ont contredit ce que le comité attendait** :

1. ⚠ **`TAILLE_MAX_CORPS_IA` a bougé pour la première fois du dépôt — et il change de porteur.** Le plan pariait que le rôle relations serait le **second** plus large. Mesuré, il est le **premier** : même budget que détenteurs, mais l'invite la plus longue des cinq (1859 o contre 808). Le plafond passe à **53 248**.
2. ⚠ **Conséquence que personne n'avait vue** : deux budgets devenant **ex æquo**, le garde « le maximum est atteint par exactement un rôle » serait devenu **ROUGE SANS DÉFAUT**. `ROLE_LE_PLUS_LARGE` se dérive désormais du **pire cas en octets**, et le test conserve une assertion qui **dit** que les budgets, eux, sont bien ex æquo. Un « plus large » choisi sur le budget aurait rendu `indice-detenteurs`, dont le pire cas est **1054 octets sous** celui du rôle neuf : les deux canaris de séparation auraient alors mesuré **un rôle qui ne sature plus rien, en restant verts**.
3. **`P = 109`, et non 110** comme le tour 1 l'écrivait — deux fixtures indépendantes.

**Ce que personne n'a re-mesuré** : les valeurs brutes en octets ne sont pas recalculées à la main, mais `frontiere.test.ts` les calcule **dynamiquement** par `TextEncoder` — aucun littéral recopié dans une assertion. `M = 5357` n'est pas re-mesuré indépendamment : seule sa cohérence interne est garantie (le test rougirait si 17 000 ne suivait pas la formule).

## Les instruments, vus rouges

**Le mutant cardinal.** La QA en mode B a **fabriqué et exécuté** le mutant qui lit la recette depuis le **bloc gelé** au lieu du document **vif** : l'`intensite` d'une relation préexistante retombe à `0` au lieu de `1`. Le témoin sépare donc réellement VIF de GELÉ. **C'est la leçon de BUG-113 appliquée** : une assertion de résultat ne remplace une formule que si le scénario **fait diverger les sources**.

**Dix mutants déclarés vus rouges par les ouvriers** — cinq au contrat (`[0]` sur un élément, `String(…)`, une clé en trop, un `join` avant le scan, le filtre négatif), cinq à la feature (garde préalable retirée, clé en trop dans la recette, recette qui écrase au lieu d'ajouter, filtrage des références rompues, focus réduit à toujours viser `Lancer`).

⚠ **Le mutant n° 5 du contrat a trouvé un défaut dans le garde lui-même, et c'est la raison d'être de la règle.** La première version de `declarationDesCheminsCandidat()` découpait de `= [` à `\n]` — **un découpage qui SUPPOSE la forme littérale**. Sur la forme filtrée, il tombait sur un `= [` plus loin dans le fichier et **le balayage anti-soustraction restait VERT sur le défaut qu'il nomme**. Seule l'inclusion rougissait. Corrigé par un découpage qui ne suppose rien de la forme éprouvée.

⚠ **Et ce garde-là, l'orchestrateur l'a re-mesuré lui-même**, parce que la QA avait déclaré honnêtement ne l'avoir qu'**inspecté**. Filtre négatif re-posé ⇒ **trois tests rouges, dont nommément « `CHEMINS_CANDIDAT` est une LISTE POSITIVE, jamais une soustraction »**. Restauration, 69/69 verts. **Un instrument avec un antécédent de vert silencieux ne se croit pas sur inspection.**

## Diff par lot

### Lot 1 — `relations-contrat` · **21 fichiers** · **+2 796 / −333**
Conforme à la lettre à la liste du plan. `src/brain/copilote/contexte/relations.ts` **neuf (194 l.)**. Les quatre cartes livrées : **2 lignes chacune, mesuré**. `useDemandeCopilote.ts` et son test : **docstring seule, zéro ligne de code, vérifié par diff**. `useEcritureRelationsPresence.ts` : **les deux sites** (l. 44 et l. 137).

### Lot 2 — `carte-relations` · **7 fichiers** · **+53 / −7** sur les suivis, **1 031 l.** de neuf
`CarteCompleterRelations.tsx` **347 l.** · `LigneRelation.tsx` **110 l.** · `relations.test.tsx` **574 l., 17 tests**. ⚠ **`styles.ts` : ZÉRO DIFF confirmé** — les onze jetons et tous les styles nécessaires étaient déjà exportés. Le plan l'avait anticipé et lui a gardé la propriété du fichier quand même.

### Contrôle de propriété
**27 fichiers de code modifiés** (21 + 7 − `styles.ts`), **aucun hors plan**, vérifié par comparaison programmatique des deux listes du plan à `git status`. Les 21 fichiers déclarés « zéro diff » sont **effectivement à zéro**, relevés par **`git diff --numstat` et jamais par un grep** — c'est la leçon n° 3 du `RETOUR-COMITÉ` de 3b, où un grep d'imports n'avait pas pu voir un `readFileSync`.

## Ce qui a été refusé — et qu'un diff ne dit pas

Le registre du plan porte **51 désaccords statués**. Les refus qu'un relecteur ne peut pas deviner :

- **Le scanner de noms propres** — rejeté parce que **l'instrument est INVERSÉ** : `nom` n'étant injecté nulle part, un scanner sur les noms du dossier **rougirait sur une prose juste** (le modèle a deviné le bon nom) et **resterait vert sur le nom inventé**, qui est le vrai risque. Le livrer aurait été **pire que rien** — l'illusion d'une couverture. Substitut : un garde de source sur l'invite **dont la limite est déclarée dans le test**.
- **La sortie scalaire** — rejetée au profit de la liste bornée à trois, **contre le verdict de tour 2 du PM**, sur l'argument que le narratif avait lui-même qualifié `relations[]` d'**interchangeable** (⇒ 3a gouverne, et 3a est une liste). **Le veto du PM n'a pas été contourné mais SATISFAIT** : le prédicat `longueur ≥ 1` fait d'une liste vide un **refus nommé**, jamais un succès.
- **Le prédicat « `nature` distinctes »** — rejeté : **deux frères portent légitimement le même lien**. Le seul prédicat d'unicité recevable porte sur `envers`.
- **`porteUnIdentifiant` sur le jeton `envers`** — veto des deux postes à effort élevé : le jeton est **l'une de nos propres chaînes**, l'y passer serait du **code mort présenté comme de la couverture** (KR-235).
- **Le prédicat de doublon au validateur** — le validateur ne connaît pas le document ; le doublon **contre le document** se ferme à la **sélection**, où il cesse d'être **représentable**.
- **Le glyphe `✕`** proposé en correction — **vérifié faux** : les trois composants de ligne livrés utilisent `×`, et `✕` sert ailleurs à **fermer un conteneur**, geste différent.
- **`caractere.jamais` au contexte** — motif neuf : `jamais` borne un **comportement**, or un lien est **éprouvé, pas agi**.
- **L'en-tête `PERSONNAGE`** — collision avec l'alphabet des rangs ⇒ `rang-inconnu` ⇒ rejeu ⇒ terminal, sur une réponse de bonne foi.
- **Recopier l'invite de `indice-detenteurs`** — sa ligne « ni nom, ni phrase, ni justification » **tuerait le seul champ `ia`** et ferait un rôle qui **ne peut jamais réussir**, sans que rien ne rougisse au dépôt.
- **La scission `demandes/**`**, **le renommage d'`acteurId`**, **l'alias `ContexteRelations`**, **le registre paramétré des `CLES_SORTIE_*`** (5ᵉ refus), **le 3ᵉ lot worker**, **les deux lots contrat**.

## Ce qui a été reporté

| Report | Vers où | Condition d'ouverture |
|---|---|---|
| Scission `copilote/demandes/**` | `open_questions` | **le 6ᵉ rôle, OU 600 lignes** — mesuré à **574 l.** après l'itération, donc **non échue** |
| `secret` exercé · appellation re-projetée | feature n° 10 | l'existence d'un rôle de **lecture** (acteur/narrateur/arbitre) |
| Auto-référence **proposable** | `open_questions` | que le nom soit re-projetable |
| `CibleCopilote` → `CibleProse` | `open_questions` | un 2ᵉ rôle de prose pure |
| Suffixe « (envers lui-même) » | `open_questions` | qu'il trouve un producteur côté fiche |
| Trou « porteur disparu » des cartes 3 et 5 | `open_questions` | préexistant, **journalisé, non corrigé** — 3c le ferme pour **sa** carte |

## Écarts assumés

**A. `cible-a-ecrire` porte sur CINQ chemins du porteur, pas quatre.** Le § 4.3 du plan écrivait « 4 » — **c'était la cardinalité de `CHEMINS_CANDIDAT`**, pas celle du porteur, qui reçoit les cinq chemins de préfixe `monde.personnages[].` de l'union. L'ouvrier a implémenté le **patron répliques que le plan nomme lui-même** : disjonction sur les blocs **réellement construits** (`lignesDuPorteur.length === 0`), sans seconde liste à tenir en phase. **Conséquence assumée** : un porteur dont la seule ligne écrite est une étape de plan est accepté. Vérifié indépendamment par l'orchestrateur et par la QA.

**B. `secret` : le « deuxième site » N'EXISTE PAS.** Le plan (§ 8 n° 19) et la spec demandaient la réécriture « **aux deux sites** ». **Mesuré** : la phrase factuellement fausse n'est qu'à `dossier/types.ts:684` ; `destinations.ts:333` ne porte **aucune affirmation de ce genre**, et il est dans la liste « zéro diff ». La justification est corrigée **au site unique qui la portait**, le **prédicat n'est pas amendé d'une virgule**.

**C. La signature exposée a été CORRIGÉE entre les deux lots, et c'est une erreur d'orchestrateur.** Le § 5 du plan listait `RapportRendu`, `RapportsRendus`, `CLES_SORTIE_RELATIONS`, `RELATIONS_PROPOSEES_MAX` au baril. **C'était faux** : `brain/index.ts` documente que les formes **réseau** et les bornes de **sortie** ne sortent pas, et les **quatre rôles livrés** le respectent sans exception. L'ouvrier a suivi le plan à la lettre — c'était son devoir — et a écrit une exception motivée ; mais cette exception portait sa propre clause de sortie (« à rouvrir dès qu'une itération constate zéro appelant côté feature ») **satisfaite à l'instant où il l'écrivait**, par sa propre mesure. Les quatre symboles ont été **retirés avant que le lot 2 ne démarre** — le seul moment où amender un contrat est gratuit. Zéro appelant côté feature, vérifié trois fois.

**D. Position de `MENTION_RELATION_CREEE`** : le § 3.2 la nommait à deux endroits apparemment contradictoires. Tranché pour la position **la plus littérale** (sous la dernière ligne, rendue une fois par carte).

**E. Clé de décision par `cibleId`** plutôt que par index — le plan ne tranchait pas ; `cibleId` est stable et distinct par construction (prédicat 9), donc plus robuste qu'un index positionnel pour la table des refs de focus.

**F. `corpsDe` dans `schemaSortie.test.ts` — un KR-226 arrivé à échéance.** Deux balayages de 3b découpaient jusqu'à la **fin du fichier**, ce qui ne valait que parce que `validerIntention` était la dernière fonction. Le 5ᵉ validateur, écrit après elle, les a fait **rougir sans aucun défaut**. Remplacés par un découpage **borné à la fonction**.

**Aucun blocage non résolu.**

## `RETOUR-COMITÉ` — ce que ce découpage apprend pour l'it4

1. ⚠ **La signature qu'un plan fige doit être confrontée à la doctrine du fichier qui va la porter, pas recopiée d'un gabarit.** J'ai écrit quatre exports qui contredisaient une doctrine que `brain/index.ts` documente explicitement, avec quatre précédents livrés. Rien au raffinage ne l'a vu : ni les deux tours, ni la porte mécanique, ni la fiche de validation — **parce qu'aucune de ces portes ne lit le fichier cible**. Le contrôle qui l'aurait attrapé tient en une ligne : *avant d'écrire un § « Signature exposée », lire le baril et vérifier que chaque symbole y a un précédent, ou nommer pourquoi il n'en a pas.*
2. ⚠ **Corriger un contrat entre les deux lots coûte zéro ; après, ça coûte un lot.** L'ouvrier a refusé de trancher au motif que « le lot 2 ne peut plus demander » — **faux, il n'avait pas démarré**. L'orchestrateur qui garde le lot consommateur en attente le temps de lire le compte rendu du contrat s'offre une fenêtre gratuite. **À faire systématiquement.**
3. **Un plan qui cite un nombre doit dire de QUOI c'est le cardinal.** Le « 4 chemins du porteur » était le cardinal de la liste des **candidats**. L'écart était inoffensif ici ; il ne l'aurait pas été sur une borne.
4. ⚠ **Un « aux deux sites » se compte avant d'être écrit.** Le second site n'existait pas. Un ouvrier consciencieux aurait pu « trouver » un second site approchant et corriger un commentaire **vrai** pour satisfaire le plan.
5. **Un balayage de source qui découpe jusqu'à la fin du fichier est une dette datée** (écart F) : il vaut jusqu'à ce que quelqu'un écrive une fonction après. Deux de 3b sont arrivés à échéance en une itération.
6. ⚠ **Ce qu'un vérificateur déclare n'avoir qu'INSPECTÉ, l'orchestrateur l'exécute.** La QA a été honnête sur le garde anti-soustraction ; c'était précisément l'instrument qui avait un antécédent de vert silencieux dans cette même itération. Le re-poser a coûté trois commandes.
7. **Le budget de contexte de la spec est à 90 o de son plafond** après compaction. Les gisements faciles sont épuisés : les décisions de it1/it2/it3a/it3b étaient **déjà** en forme d'index. L'it4 devra scinder ce fichier, ou décider que la spec cesse de porter les questions ouvertes closes.
8. **`WORKFLOW.md` dit « les sept fichiers » de journal ; il y en a huit.** Suivie à la lettre, la consigne reproduit la collision d'identifiant qu'elle existe pour empêcher (précédent BUG-062).
