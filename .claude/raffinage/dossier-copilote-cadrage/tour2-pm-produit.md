# Tour 2 — PM produit (contre-lecture)

## C1 — Découpage : je passe de 3 à 4, et je retiens l'ordre par contestation croissante

**Sur mon motif de tour 1** — confirmé : « Tisser en dernier » était un jugement de **volume**, pas de dépendance. **Je le retire** — pas parce que le volume était faux, mais parce que ce n'est pas le bon axe. L'axe qui compte est celui que j'ai moi-même posé en tour 1 pour rejeter « Éclater le synopsis en it1 » : **ne jamais ouvrir un lot sur le cas le plus contesté**. Appliqué avec rigueur, cet axe classe TOUT le découpage.

**Sur le nombre** — j'adopte **4**, la proposition du Tech Lead. Ce n'est pas un gonflement : les 3 assistants du roadmap sont tous livrés, la coupe passe à l'INTÉRIEUR de « Compléter une fiche ». C'est une coupe, exactement ce que mon poste doit produire.

**« Même anti-patron que le panneau de diff rejeté » — NON.** Le panneau de diff seul n'avait RIEN à afficher : infrastructure sans contenu, indémontrable. L'it1 du Tech Lead a un contenu réel et un accept qui écrit via `DossierService.update` — elle traverse écran + `brain/` + persistance. **Le test qui distingue les deux n'est pas « est-ce petit » mais « est-ce qu'un stub tient lieu de l'autre moitié »** : oui pour le panneau seul, non pour l'it1 Tech Lead.

**Réordonnancement proposé, sous réserve tech-lead sur l'ordre technique 2/3** : Compléter (prose) → **Tisser les indices** → Compléter (curseurs/relations/plan d'actions) → Éclater le synopsis. Motif : Tisser ne porte ni nombre-règle ni création d'entité, alors que la moitié « curseurs » de Compléter est — de l'aveu du Tech Lead (« porte l'arbitrage curseurs ») — le lot où se litige la décision n° 4. **Ordre de contestation strictement croissant : sûr → sûr → contesté → le plus contesté.** Si le Tech Lead a une dépendance technique dure (le `cible_rang` de `relations[]` a besoin d'un mécanisme construit avant Tisser), **je cède** — l'ordre technique n'est pas mon veto, l'ordre de contestation l'est.

## C6 — `CopiloteService` sans écran : REJETÉ, même famille que le panneau seul
Le panneau seul manquait de CONTENU ; un service testé en Jest sans écran manque d'ÉCRAN — dans les deux cas rien n'est démontrable à l'auteur. **Le précédent `exportDossier` ne s'applique pas** : un export est un geste ponctuel dont le bouton déclencheur est trivial et préexistant ; ici **le copilote EST l'écran** (diff, chargement, échec) — retirer l'écran retire la feature. Si it1 s'avère trop grosse au raffinage, la coupe est celle du Tech Lead (**moins de champs, pas moins d'écran**) — `narratif-ia` l'avait d'ailleurs concédé.

## C-valeur — « Éclater le synopsis » vaut fort, pas la moitié
C'est la valeur la plus **spectaculaire** (la page blanche, un seul usage par dossier) mais pas la plus **utilisée** — « Compléter » et « Tisser » se répètent à chaque fiche et à chaque indice, pendant toute la vie du dossier. J'estime « Éclater » à **de l'ordre du quart** de la valeur totale, pas la moitié. **J'assume le coût** : un auteur qui ouvre un dossier neuf n'a pas d'assistant de casting avant it4 — ce n'est pas une régression, rien ne change par rapport à aujourd'hui. La mise en garde du Tech Lead pèse plus lourd : rater « Éclater » en premier, c'est **corrompre neuf identités d'un coup sur un mécanisme non prouvé**, alors qu'une prose ratée sur un champ se corrige en un clic.

Sur la proposition UX (Synopsis en premier, « rien à diffuser contre une valeur existante ») : l'argument est **vrai mais borné au rendu de cette itération**, pas à l'ordonnancement. Je ne le retiens pas pour la séquence ; je le garde pour la conception d'écran d'it4 (grille 3×3 sans AVANT/APRÈS).

## C7 — Je RETIRE (a), j'adopte (b)
Je retire « tranche `outillage` avant `/raffiner` » — **c'était moi qui gonflais** : un cycle complet de comité pour un déplacement d'octets, quand `WORKFLOW.md` prévoit déjà le mécanisme plus léger. J'adopte (b) avec la garantie que demande la QA contre le silence : dans le lot **1-A**, la compaction de `code-knowledge.json` est une étape **nommée et exécutée AVANT** l'ajout des KR-229+, jamais en mélange ; la revue d'itération montre le compte en octets avant/après. L'arbitrage humain (« le fichier ne reçoit plus rien d'ici là ») devient « rien avant la compaction du lot 1-A », pas « rien avant une tranche séparée ».

## C-périmètre — « régénérer » : pas de bouton dédié
Non, pas de capacité dédiée. Mais l'absence de bouton chez UX n'est pas un trou : **le « Lancer » de l'état par défaut, ré-actionnable après un refus, EST déjà le mécanisme de relance** — aucun composant neuf. Ce que je verse au périmètre est une **contrainte de copie** : suivant l'avertissement de `narratif-ia` sur l'absence de mémoire, le texte autour de cette relance ne doit jamais suggérer une amélioration ou une continuité (« affiner », « améliorer ») — seulement « nouvelle proposition ». Ce n'est pas un écran neuf, c'est **une phrase à ne pas écrire**.

## Bilan des objections du tour 1
- OBJECTION (panneau de diff = couche horizontale) — **maintenue**, étendue au service-sans-écran.
- REJET 1 (panneau de diff en itération indépendante) — **maintenu**.
- REJET 2 (écran de réglage clé API) — **maintenu**, non contesté.
- REJET 3 (Tisser étendu) — **maintenu**, non contesté.
- REJET 4 (Synopsis en tête) — **maintenu**, motif renforcé : c'est désormais le lot le plus contesté de tous.
- REJET 5 (Répétition à blanc) — **maintenu**.
- Avis « tranche outillage avant » — **RETIRÉ** (gonflement de mon propre fait).
- Proposition « 3 itérations » — **RETIRÉE**, remplacée par 4 réordonnées.

## Découpage final (4 itérations)
**It1 — Compléter une fiche, prose seule.** Goal : faire exister, sur le chemin le plus étroit possible (un personnage déjà créé, trois champs de prose déjà au schéma `ia`), toute l'infrastructure neuve : route worker, `CopiloteService`, contrat de sortie typé et validé, rejeu-une-fois-puis-refus, panneau de diff, écriture via `DossierService.update`.
*Démo* : « L'auteur ouvre une fiche personnage existante, demande au copilote un texte pour un champ de prose, puis l'accepte ou le refuse. »

**It2 — Tisser les indices.** Goal : fermer la moitié PROPOSITION du diagnostic déjà livré par `dossier-controles` — sur un indice signalé sous-documenté, le copilote propose qui pourrait aussi le connaître, sans créer ni référencer une entité autrement que par son rang.
*Démo* : « Sur un indice que les contrôles signalent comme ayant moins de deux détenteurs, l'auteur demande au copilote qui d'autre pourrait le connaître, puis accepte ou refuse chaque détenteur proposé. »

**It3 — Compléter une fiche, en entier.** Goal : étendre l'assistant aux champs structurés (curseurs, répliques, plan d'actions, relations) sur le chemin d'acceptation déjà prouvé, en tranchant le débat curseurs/décision n° 4 dans un lot où l'infrastructure n'est plus en jeu.
*Démo* : « L'auteur demande au copilote de compléter les curseurs, les répliques types, le plan d'actions ou les relations d'une fiche, puis accepte ou refuse chaque proposition champ par champ. »

**It4 — Éclater le synopsis.** Goal : livrer le seul assistant qui crée des entités — depuis le synopsis et les objectifs, une distribution de personnages nommés (brouillons sans identifiant), acceptée fiche par fiche ; le code frappe l'identifiant à l'acceptation, jamais avant.
*Démo* : « Depuis le synopsis et les objectifs, l'auteur demande au copilote une distribution de personnages, puis accepte ou refuse chaque fiche proposée. »

**Formulation § 2.8 à figer dans `resolved_decisions`** — adoptée telle qu'écrite par `narratif-ia`.

Roadmap § 2 ligne n° 8, colonne « Itér. » : `3` → `4`, **approuvé**.

## REJETÉS (mis à jour)
1. **Panneau de diff en itération indépendante** — non démontrable seul.
2. **`CopiloteService` testé sans écran** — même anti-patron en miroir : sans écran, rien n'est démontrable à l'auteur.
3. **Écran de réglage clé API/modèle/effort** — décision n° 2.
4. **« Tisser » étendu au-delà de « moins de deux producteurs »** — duplique « Compléter ».
5. **Éclater le synopsis en premier** (roadmap ou UX) — lot le plus contesté, ne peut pas ouvrir la feature.
6. **« Répétition à blanc » réintégrée** — n° 16.
7. **Tranche `outillage` séparée avant `/raffiner`** — gonflement évité ; compaction dans le lot 1-A, nommée et avant les KR-229+.
8. **Bouton « régénérer » dédié** — le « Lancer » ré-actionnable couvre le besoin ; seule une contrainte de copie s'ajoute.
