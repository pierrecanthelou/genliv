---
name: raffinage-iteration
description: Rituel de raffinage d'une itération genliv par le comité PM / Tech Lead / UX / QA (+ Narratif & IA si l'itération touche le moteur) — tours de parole, droit de veto par domaine, registre des désaccords, contrat de sortie (plan découpé en lots), allocation d'effort. À charger par tout agent participant à /raffiner ou /essaim.
---

# Rituel de raffinage d'itération — genliv

## Ce qu'on raffine

Une **itération** au sens du projet : une entrée de `features/<feature>/specification.json` → `plan.iterations[]`. Elle arrive avec un `goal` d'une ou deux phrases. Elle doit ressortir **exécutable par des agents qui ne se parlent pas**.

## Sources de vérité (à lire avant de parler, dans cet ordre)

1. `CLAUDE.md` — les règles toujours actives
2. `docs/ROADMAP-BASCULE-IA.md` — décisions tranchées, ordre des features, ce qui a été supprimé et ce qui attend son remplaçant
3. `src/features/<feature>/specification.json` — le plan, les critères, les `known_risks` (KR-xxx), l'`implementation.resolved_decisions`
4. Les **3 à 6 fichiers de code** que l'itération touche réellement — pas plus. Le comité travaille sur les specs, pas sur le repo entier.
5. `DESIGN-SYSTEM.md` + `tokens/*.css` + `components/` (rôle UX en priorité)
6. `docs/ROADMAP-BASCULE-IA.md` + `docs/PLAN-BASCULE-IA.dc.html` + `docs/REGLES-DU-JEU.md` + les règles de `src/brain/` (rôle Narratif & IA uniquement)

Le comité est **en lecture seule**. Un seul acteur écrit : l'orchestrateur de `/raffiner`.

## Composition variable

Le socle est de **quatre rôles** : `pm-produit`, `tech-lead`, `ux-designer`, `qa`.

Un **cinquième**, `narratif-ia`, est convoqué **si et seulement si** l'itération touche le dossier d'aventure, le moteur, les prompts, la mémoire de session ou le mode jeu. L'orchestrateur décide à l'étape de cadrage et écrit sa décision dans le plan. Sur une itération purement éditeur d'arbre, le convoquer coûte deux tours pour rien ; sur une itération moteur, l'omettre laisse la frontière code/IA sans gardien.

## Le cadre — ce qui rend une proposition recevable

Une proposition n'est retenue que si les **quatre** conditions tiennent :

1. elle **répond à la demande** de l'itération telle qu'écrite ;
2. elle **respecte l'existant** — CLAUDE.md, contrats brain, design system, décisions déjà actées dans `resolved_decisions` ;
3. elle **respecte l'ensemble** — elle ne dégrade aucune autre feature ni l'ordre de construction ;
4. **les quatre rôles la signent**.

L'innovation est autorisée à l'intérieur de ce cadre, avec un budget : **au plus une proposition hors-cadre par itération**, marquée `INNOVATION`, accompagnée de (a) la règle existante qu'elle infléchit, (b) ce qu'elle coûte, (c) ce qu'on perd si on ne la fait pas. Au-delà de une : ça devient une itération à part, pas un raffinage.

## Les trois tours

**Tour 1 — note d'ouverture (chaque rôle, en parallèle, sans voir les autres).** 250 mots maximum. Format imposé :

```
RISQUE      — le risque majeur de cette itération vu de mon poste
OBJECTION   — au moins une, sur la définition telle qu'elle est écrite
PROPOSITION — au moins une, concrète, chiffrable
VERDICT     — recevable | recevable sous réserve | veto
```

Chaque rôle **doit** produire au moins une objection. Une note sans objection est renvoyée : elle signifie que le rôle n'a pas lu.

**Tour 2 — contre-lecture.** Chaque rôle lit les trois autres notes et répond nommément à **au moins une objection qui empiète sur son domaine**. Il peut retirer une de ses propres objections (en disant pourquoi), la maintenir, ou la durcir en veto.

**Tour 3 — arbitrage (orchestrateur).** Chaque désaccord ouvert est tranché et **inscrit** :

| statut | signification |
|---|---|
| `RETENU` | intégré au plan, avec le lot qui le porte |
| `REJETÉ` | motif obligatoire, en une phrase |
| `REPORTÉ` | vers `iterations[n+1]` ou `open_questions` de la spec |

**Aucun désaccord ne disparaît sans statut.** C'est la seule protection contre le faux consensus.

**Et un `REJETÉ` qui vit dans l'ANNEXE d'un rôle n'existe pas pour l'essaim.** Les notes de tour sont condensées par l'orchestrateur avant d'atteindre les ouvriers ; une condensation garde les conclusions et perd les refus motivés qui les accompagnaient. Tout `REJETÉ` d'annexe se recopie donc dans le **registre des désaccords** du plan (§ 8), où il est lu. Contrôle constatable à la porte 2, et c'est ce qui distingue cette règle d'une bonne intention : les notes de tour sont des fichiers voisins du plan (`.claude/raffinage/<feature>-it<N>/tour1-*.md`) — avant d'écrire le § 8, relire leurs annexes et vérifier qu'aucun `REJETÉ` n'en reste sorti. Précédent, et il a coûté un défaut majeur : au raffinage de `dossier-controles` it1, le tech-lead avait rejeté nommément la variante « deux états pour ce qui est affiché — état illégal représentable » dans l'annexe de sa note de tour 1 ; la note condensée l'a perdue, l'ouvrier a livré exactement cette forme (deux lignes de navigation courantes à l'écran), et la QA en mode B n'a pas pu retrouver la prémisse qu'on lui citait (BUG-082).

## Droit de veto — cadré par domaine

Le veto n'est pas un vote général ; chacun ne peut bloquer que sur **son** terrain.

- **PM** — hors périmètre, ne répond pas à la demande, casse l'ordre du walking skeleton, valeur utilisateur nulle.
- **Tech Lead** — viole l'isolation des features, contourne un contrat `brain/`, duplique la source de vérité, crée une dépendance croisée, expose/manipule à distance un détail d'implémentation d'un composant, hook ou fonction voisin (§ Encapsulation ci-dessous).
- **UX** — s'écarte du design system (valeur en dur au lieu d'un token, composant maison au lieu de `components/`), oublie la règle des états vides, casse l'accessibilité (≥44px, clavier), fautes de registre de langue.
- **QA** — critère non observable, absence de test de non-régression sur un KR cité, définition de fini floue.
- **Narratif & IA** *(si convoqué)* — l'IA touche aux dés, aux stats, à l'inventaire ou à l'XP ; sortie modèle sans schéma ni comportement d'échec ; règle dupliquée entre code et prompt ; référence narrative par nom libre ; contexte sans borne ; mémoire de session non spécifiée.

Un veto **hors domaine** est irrecevable : l'orchestrateur le requalifie en objection.

## Encapsulation — jamais un détail d'implémentation à distance

**Un composant, un hook ou une fonction ne manipule jamais un détail d'implémentation (DOM, structure interne, algorithme, texte dérivé) d'un autre composant, hook ou fonction — il s'appuie sur une abstraction que l'autre expose délibérément.** Loi de Déméter appliquée au code du dépôt. Généralisée depuis un cas trouvé en revue humaine, après l'approbation tech-lead (`dossier-fiches` it8) : `PanneauPersonnages.tsx` cherchait le bouton de retrait de `FichePersonnage.tsx` par `querySelector('button[aria-label^="Retirer le personnage"]')` — un texte de label et un ordre DOM que seule `FichePersonnage.tsx` décide, lus à distance par un composant qui n'a aucune raison de les connaître. Rien ne rougissait si le label changeait ; seul un test de focus dédié l'aurait vu. Une seconde occurrence, non corrigée (dette datée, hors périmètre de la feature qui l'a trouvée), vit dans `dossier-canon/PanneauLieux.tsx` — `bug_history.dossier-canon.json` BUG-078.

**Le symptôme à reconnaître** : un composant/hook A lit ou reconstruit une donnée, un texte, une structure DOM ou un calcul qui appartient RÉELLEMENT à B — souvent via `querySelector`/`getElementBy*`, un texte recopié en dur, une supposition sur l'ordre ou la forme d'une structure interne, ou un accès à un champ que B pourrait renommer sans casser sa propre suite de tests. Le risque n'est jamais immédiat : le code compile, les tests de B restent verts, et c'est A qui casse en silence — la question à se poser en revue : « si B renommait son label ou réorganisait son DOM demain, quel autre fichier casserait sans qu'aucun test ne le voie venir ? ».

**Le correctif : B EXPOSE la capacité, A l'APPELLE, jamais l'inverse.**
- Une **donnée dérivée** (un libellé, une désignation) → une fonction EXPORTÉE par le module qui la définit, jamais recalculée par l'appelant (précédent `designationDe`, exporté nommément par `FichePersonnage.tsx` pour que `PanneauPersonnages.tsx` ne reconstruise pas la même chaîne).
- Un **geste impératif** sur le DOM d'un composant qu'on ne possède pas (focus, scroll, sélection) → `forwardRef` + `useImperativeHandle`, une interface `<Composant>Handle` dont les méthodes sont NOMMÉES par leur INTENTION (`focusRetirer()`, jamais `getButton()`/`getRef()`) — précédent : `FichePersonnageHandle`, même correction.
- Un **service ou un contrat cross-feature** → `brain/` (déjà couvert par le veto Tech Lead « contourne un contrat `brain/` », ci-dessus — cette section couvre le cas plus fin d'un composant DANS la même feature).

**Ce qui n'est PAS une violation** : lire une constante, un type ou une fonction PUBLIQUEMENT EXPORTÉE d'un module (c'est l'abstraction elle-même, pas un détail) ; un composant qui lit son PROPRE DOM (ex. `PanneauPersonnages.tsx` garde un `ref` direct sur son propre bouton « + Ajouter… », qu'il rend lui-même — aucune indirection n'est due sur ce qu'on possède déjà, un `forwardRef` y serait une abstraction à un seul appelant, donc une dette).

**Au raffinage** : le Tech Lead vérifie ce veto dès qu'un contrat de design ou un lot mentionne une recherche DOM inter-composants, un texte recopié entre deux fichiers, ou un accès à un champ interne d'un état géré ailleurs — pas seulement au moment où un `useEffect` en fait la démonstration la plus visible (le cas trouvé ici). **À l'essaim** : `dev-lot`/`dev-contrat` le portent en autocontrôle avant de committer une recherche DOM ou un texte dupliqué visant un composant qu'ils ne possèdent pas.

## Blocage

Deux tours maximum. Si un veto tient encore après le tour 2, on **n'itère pas une troisième fois** : l'orchestrateur écrit un bloc `ESCALADE` en tête du plan avec les deux options, leur coût, et la recommandation de chaque rôle — puis s'arrête. C'est un humain qui tranche.

## Le contrat de sortie

Le plan suit `templates/plan-iteration.md` à la lettre. Deux exigences non négociables :

- **Critères d'acceptation observables** — formulés `Étant donné / Quand / Alors`, vérifiables par un test ou une capture, jamais par une opinion.
- **Lots à propriété disjointe** — chaque lot déclare la liste exacte des fichiers qu'il crée ou modifie. **Deux lots ne peuvent pas nommer le même fichier.** Un lot qui touche `brain/` est marqué `contrat` et s'exécute **seul, en premier** ; les lots features ne partent qu'une fois le contrat figé.

## Allocation d'effort

> **L'effort suit la portée de l'erreur, pas la durée du travail.**

Une erreur qui reste dans un fichier se corrige en dix minutes. Une erreur dans une signature `brain/` se propage dans quatre lots, puis dans la fusion, puis dans les tests — et personne ne peut plus se parler pour la rattraper.

| Poste | Effort | Pourquoi |
|---|---|---|
| `tech-lead` | **élevé** | il produit le découpage en lots : un mauvais découpage rend tout l'essaim faux, et ça ne se voit qu'à la fusion |
| `narratif-ia` | **élevé** | la frontière code/IA et les contrats de sortie du modèle se paient au runtime, sur des sessions entières |
| `dev-contrat` | **élevé** | il écrit ce que 2 à 4 agents consommeront sans pouvoir le questionner |
| `pm-produit`, `ux-designer`, `qa` | standard | leurs erreurs sont rattrapées par la contre-lecture du tour 2 |
| `dev-lot` | standard | il exécute un plan qui contient déjà signatures, tokens, textes et tests |
| `integrateur` | standard | il constate et renvoie ; il ne répare pas |
| `qa` mode B | standard | il compare un diff à une liste, avec un contexte neuf |

Deux corollaires sur l'essaim : **2 à 4 ouvriers**, et **deux vagues valent mieux que six ouvriers** — au-delà, le coût de fusion et de blocages croisés dépasse le gain de parallélisme sur un codebase de cette taille. L'effort qu'on n'a pas mis dans le découpage se paie en double à l'intégration.

## Taille d'itération : la tranche verticale

C'est la règle la plus importante de cette skill. Une itération qui gonfle coûte plus cher que tous les défauts que le comité sait corriger.

**Une itération est une tranche verticale** : elle traverse l'interface, le service `brain/` et la persistance pour livrer **un comportement démontrable en une phrase** — « à la fin, l'auteur peut ___ », sans « et » dans la phrase. Jamais une couche horizontale (« tous les services », « toute l'UI du panneau ») : une couche seule ne se démontre pas et ne se vérifie pas.

**Squelette d'abord.** La première itération d'une feature est la tranche la **plus fine** qui traverse tout de bout en bout, câblée à travers `brain/` : pas de validation fine, pas d'animation, pas de hors-ligne, pas de cas limites. Le durcissement, la persistance robuste et le polish sont les itérations suivantes, dans cet ordre. L'ordre des features de `docs/ROADMAP-BASCULE-IA.md` fait foi.

**Signaux de coupe.** Un seul suffit — l'itération doit être découpée avant d'être raffinée :

- on ne peut pas la démontrer en une phrase sans « et » ;
- elle produit **plus de 4 lots** ;
- elle porte **plus de 8 critères** d'acceptation ;
- elle touche **plus d'une feature** (le lot `contrat` mis à part) ;
- elle mélange « faire marcher » et « rendre robuste ou beau ».

**Que faire alors.** Le PM propose **N itérations numérotées**, chacune démontrable en une phrase, dans l'ordre où elles se construisent — et le comité ne raffine que **la première**. Les autres partent dans `plan.iterations[]` avec leur `goal` d'une ligne, à raffiner à leur tour. Découper n'est pas reporter : c'est la seule façon de garder chaque plan relisible en deux minutes.

## Deux portes : la machine, puis l'humain

**Porte 1 — mécanique.** L'orchestrateur applique à son propre plan la liste de contrôles de `/raffiner`, étape 5 : tranche verticale, ≤ 4 lots, listes de fichiers disjointes, critères observables, KR testés, textes et tokens écrits, hors-périmètre non vide. Rouge = le plan est réécrit, on ne dérange personne.

**Porte 2 — humaine.** Porte 1 verte, le plan s'arrête et **attend une validation explicite**. C'est le seul endroit où le jugement humain vaut plus que le comité : personne d'autre ne sait si le plan répond à l'*intention*, ni si la tranche est la bonne. La porte mécanique existe pour que cette lecture coûte deux minutes, pas vingt — d'où la **fiche de validation** en tête du plan : la phrase de démo, la tranche, les lots, le hors-périmètre, les reports. Le reste du plan est pour les agents.

**`ESCALADE`** court-circuite les deux : désaccord irréductible, le plan remonte tel quel avec les deux options et leur coût.

En fin d'exécution, la revue reste un **dossier**, pas un compte rendu de commit — ce que l'auteur peut faire maintenant, chaque critère avec sa preuve, **ce qui a été refusé et pourquoi**, ce qui a été reporté, et ce que personne n'a pu vérifier. Les motifs de rejet sont la seule chose qu'un diff ne dit pas.

## Instruments de test — le bon outil pour le bon risque

Le dépôt tourne sur **jest + jsdom + Testing Library**.

| Zone | Instrument | Statut |
|---|---|---|
| Logique, contrats, composants | jest + Testing Library | en place — la porte à chaque commit |
| Invariants greppables (`localStorage` en feature, import inter-features, hex en dur) | règles de lint | **en place** — dans `npm run lint`, messages en français |
| `useEffect` d'état dérivé (KR-013/113) | *aucun* — heuristique de revue | **arbitré : pas de règle.** L'AST voit une forme, pas une sémantique ; procédure dans `docs/WORKFLOW.md` (Build Steps, étape 5) |
| Règles de jeu (`src/brain/` : challenge, combat, xp, characteristics) | **score de mutation**, jamais la couverture de lignes | **en place** — `npm run test:mutation`, hors porte de commit, en fin d'itération si l'itération y a touché. Cliquet `break: 80`, plafond 90 |
| Registres de données (`BESTIARY`, `CHALLENGE_TIERS`, `CHARACTERISTICS`, libellés de `POSTURES`) | **table dorée** `src/brain/rules.golden.test.ts` | **en place** — dans la porte de commit. Contrepartie obligatoire de leur neutralisation dans le score. **Sens d'écriture permanent : `docs/REGLES-DU-JEU.md` → table dorée → code** — une valeur recopiée depuis le code fige le défaut au lieu de le verrouiller ; tout critère touchant un registre nomme sa section source. Conception et sonde : skill **`table-doree`** |
| Canevas (pan/zoom/glisser, disposition dagre), boucle de session du mode jeu | specs navigateur | **différé** — à ouvrir quand `tree-canvas` ou le mode jeu arrive |

Le score de mutation est le seul instrument qui voit un test vert sur une arithmétique fausse. Comme tout le dispositif repose sur « l'IA ne lance jamais les dés, le code les lance », un mutant survivant dans `combat.ts` ou `xp.ts` est le défaut le plus cher du projet.

Règle pour le QA : un critère n'est observable que par un **instrument qui existe déjà**. Sinon, la revue écrit qu'il n'a été vérifié par personne — elle ne le compte jamais comme vérifié parce que jest est vert.

> **Décision projet : l'accessibilité n'est pas un critère.** Cibles ≥ 44px, focus visible, contraste : retirés du cadre, aucun rôle ne bloque dessus. L'opérabilité au clavier reste exigée — non comme accessibilité, mais comme **ergonomie de rédaction** : un auteur qui écrit un livre vit sur son clavier.

## Boucle de mémoire

L'orchestrateur reporte, dès que la porte de plan est verte, dans `features/<feature>/specification.json` :
- le `goal` raffiné dans `plan.iterations[n]` ;
- les arbitrages `RETENU`/`REJETÉ` structurants dans `implementation.resolved_decisions` ;
- les `REPORTÉ` dans `implementation.open_questions`.

Le comité de l'itération suivante lit ce fichier : il ne rejoue pas les débats déjà tranchés.

**Ce report est un ajout à chaque itération — donc le fichier ne fait que grossir, et c'est ce qui rend cette boucle lisible par le comité suivant qui la rend coûteuse.** Le `specification.json` d'une feature a un plafond (`docs/WORKFLOW.md`, § Budget de contexte). Quand le report le franchit, l'orchestrateur **compacte dans le même geste**, il ne reporte pas :

- une `resolved_decisions` dont le code est livré **et** dont la revue d'itération porte le raisonnement se réduit à sa phrase d'arbitrage + le renvoi `<feature>-it<N>.revue.md` — la revue est le dossier, la spec n'en est que l'index ;
- une entrée `iterations_log` d'itération close garde ses `architecture_choices` et ses `deviations_from_plan`, pas le récit ;
- une `open_questions` tranchée **part** : elle est devenue une décision ou un KR, la garder ouverte est un mensonge d'état.

Ce qui ne se compacte jamais : un arbitrage encore structurant pour une itération non livrée, et un `REPORTÉ` dont personne n'a encore repris la charge.
