# Tour 2 — Narratif & IA (contre-lecture)

**Je me rallie sur les deux points les plus lourds (C2 et C1), et je vais plus loin que le Tech Lead sur C2.**

## C2 — **RALLIÉ, et DURCI. Mon « NON » du tour 1 est RETIRÉ.**
### La mesure qui casse d'abord MA position
| Champ | Ligne | Audience |
|---|---:|---|
| `titre` | 109 | `auteur` |
| `monde.personnages[].nom` | 146 | `auteur` |
| `monde.indices[].nom` | 411 | `auteur` |
| `monde.personnages[].camp` | 155 | `moteur` |

**Mon propre « toujours chargé » du tour 1 commençait par `titre`, qui est `auteur`.** Ma garde d'existence l'aurait laissé passer en silence ; la garde d'audience du Tech Lead le fait rougir. **Sa garde attrape une faute que la mienne ne voit pas, dans ma propre note, au premier champ. Je n'ai pas d'argument après ça.**

### Les trois champs « nécessaires », instruits un par un
- **`camp` — CONCÉDÉ, zéro dérogation.** Perte : rien de nommable. Pour Compléter, `fonction`/`apparence`/`but.*` (tous `ia`) portent déjà l'antagonisme — le fichier l'écrit l. 153-154. Pour Éclater, `camp` est une **sortie**, pas une entrée.
- **`personnages[].nom` / `indices[].nom` — CONCÉDÉ.** Perte nommée : **le modèle n'écrit jamais un nom propre** — une réplique dira « votre frère », pas « Aldur ». Réel et petit : le **rang** remplace le nom pour *désigner*, `fonction`/`verite` pour *caractériser*. Décisif : **KR-195 déclare la question des appellations transverse et non rouverte** ; une dérogation ici en ferait le précédent que la n° 10 hériterait.
- **`canon.objectifs[].nom` + `reussi_si_texte` — le seul cas qui résiste, et je ne demande quand même pas de dérogation.** Fait mesuré : **l'entité `canon.objectifs[]` a sept clés et ZÉRO `ia`** (l. 123, 127, 131, 139-142). Sous garde stricte, « Éclater — *depuis le synopsis + les objectifs* » reçoit une liste d'objectifs **entièrement vide**.
  **Ma réponse n'est pas d'ouvrir la table, c'est de RÉTRÉCIR L'ASSISTANT** (décision n° 3) : **« Éclater le synopsis » v1 lit `synopsis_mj`, `accroche_joueur`, `ton`, `interdits_ton[]` — quatre champs `ia` — et propose neuf personnages SANS `objectif_rang`.** L'auteur rattache à la main. Le rattachement automatique devient un **point d'extension nommé** dont la condition d'ouverture est écrite : « la n° 10 livre une projection d'objectif dérivée par le code, avec sa propre ligne d'audience ».

**Résultat : ZÉRO dérogation sur les trois assistants.** La garde `destination === 'ia'` tient **sans exception**, et c'est un meilleur héritage pour la n° 10 qu'une liste de dérogations, même énumérée : **une liste à trois entrées est une liste à quatre entrées dans six mois.**

### Sur l'asymétrie du regret — **elle change ma position, et c'est elle qui la change**
« Le Tech Lead se trompe peut-être sur la valeur produit ; moi je me trompais sur **l'invisibilité**. Perdre une phrase de caractère se voit à l'écran le jour même. Un champ `moteur` entré dans un contexte de rédaction ne se voit **jamais** — il devient un précédent cité, pas un bogue observé. **Quand un seul des deux risques est observable, on paie celui qui l'est.** »

### La troisième forme : **soupape écrite, non utilisée**
Valide, gardée comme telle. Aujourd'hui la liste est vide et **le test doit asserter qu'elle est vide**. « Une soupape fermée dont on peut lire le compteur vaut mieux qu'une soupape absente. »

### Sa seconde garde (balayage de fixture, seuil 12) — **NON, pas un instrument valide**
1. **Aveugle là où ça compte** : il cherche des valeurs **textuelles** ≥ 12 caractères. Toutes les fuites que je véto sont des **nombres ou des étiquettes courtes** (`jet.tc`, `confiance_min`, `intensite`, les six curseurs, les huit `stats`, `duree`, `delai`, `secret`). **La garde est aveugle à 100 % de mon périmètre de veto.**
2. **Faux positif structurel** : apparier des chaînes de fixture fait rougir un code correct dès que deux champs d'audiences différentes portent la même phrase — et **la correction naturelle est d'éditer la fixture. Une garde qui apprend à modifier le témoin est pire que pas de garde.**
3. Seuil **non mesuré**, il le dit lui-même.

**Contre-proposition sans seuil** : `couverture.test.ts` **exporte déjà** `feuillesDeLaFixture` (l. 154). La seconde assertion devient : *l'ensemble des chemins normalisés de l'objet assemblé est **inclus dans** `CHAMPS_INJECTES[role]`*. Rien à deviner, aucun couplage aux valeurs, et elle attrape le vrai mode de panne — un spread qui embarque des clés voisines. **Non mesuré** : ce test n'existe pas.

### La distinction que ni lui ni moi n'avions écrite proprement
`destinations.ts` est une **GARDE** (assertion de test), **jamais un PILOTE** (dispatch d'exécution qui choisit quoi injecter selon l'audience). Mon REJETÉ n° 8 visait le pilote. **Trois projections littérales, gardées par la table, pilotées par personne.**

## C3 — D'accord, et **il faut deux types**
Mon REJETÉ n° 0 vise **exclusivement la sortie du modèle**. Après re-résolution, un identifiant est **obligatoire**, et sa raison (KR-021) est juste. **Un seul type pour les deux est précisément le chemin par lequel un rang devient un identifiant sans que personne l'ait décidé.**
**Deux instants à nommer séparément** : la re-résolution rang → identifiant **à la réponse**, contre l'instantané ayant servi au contexte ; la vérification d'existence **à l'acceptation**, dans la recette d'`update`. Son RISQUE tour 1 n'est couvert que si les deux sont écrits.
*Hors veto* : `ChampPropose { valeur: string }` porte l'it « prose » et **casse** dès les curseurs (entiers) et `plan_actions[]` (liste ordonnée) — à traiter dans le lot contrat concerné.

## C-archi — `porte_suggeree` : **RETIRÉE**, il a raison
1. **`porte_suggeree` sort du schéma, entièrement.** Le modèle rend `{pnj_rang, certitude, revele_comment}`.
2. **Aucun `revele_si` écrit, même vide** — et `validateDossier` avertit déjà `revelation-sans-porte` sans bloquer : **l'avertissement du linter n° 7 EST le rappel, il est livré, il n'a pas besoin d'un second.**
3. **Un renvoi de navigation, et c'est tout** — « Ouvrir la section Personnages ». **Coût honnête à écrire dans la spec : c'est un renvoi de SECTION, pas un lien profond vers la fiche d'Aldur.** Je ne demande **pas** d'élargir la signature.
Bénéfice collatéral : c'était le dernier endroit où le modèle faisait un geste vers une porte.

## C4 — L'invite vit dans le **WORKER**. Tranché.
Le discriminant n'est pas la lisibilité mais la **modifiabilité** : un prompt côté client est **rejouable** par quiconque ouvre les devtools, or c'est le worker qui détient `AI_API_KEY` et qui paie. Invite côté client + clé côté worker = **un proxy de modèle généraliste sur notre budget, sans trace de ce qui a été demandé**. Sa formule est ratifiée mot pour mot : **« le client décide QUELLES DONNÉES sortent, le worker CE QU'ON DEMANDE. »** C'est une propriété d'audit, et c'est de mon domaine : la seule façon de garantir qu'**aucun prompt ne récite une règle du jeu** est que le texte soit dans un fichier que personne ne remplace à chaud. Pas de contradiction avec mon tour 1 : « local à la n° 8 » veut dire **pas dans `brain/`** ; `worker/ia.ts` n'est pas `brain/`.
**Condition de ma ratification** : le schéma est décrit **dans le worker** (l'invite) et validé **dans le client** — changer l'invite sans le validateur produit un `illisible` **permanent et silencieux**, le pire mode de panne, « parce qu'il ressemble à *le modèle est mauvais* ». Exigé : **un test qui asserte que l'invite de chaque rôle contient littéralement chaque clé du schéma de sortie de ce rôle.** **Non mesuré** — ce test n'existe pas.

## C5 — Dégradation + correction de nommage
> **En rédaction, « dégradé » = abandon explicite. Rien n'avance tout seul : ni tour à faire avancer, ni repli canonique — le dégradé EST le refus, jamais une réparation partielle.** — ratifié.

**`{statut:'illisible'}` ÉCRASE mon `MotifEchec`, il ne le couvre pas.** `illisible` est un **état terminal**, `MotifEchec` une **raison** (elle pilote le rejeu, la revue, et la discriminance exigée par QA). **Quatre branches** :

| Branche | Quand | Écran |
|---|---|---|
| `propose` | sortie conforme | le diff |
| `refuse{champ}` | **avant tout appel** : le retrait `MARQUEUR_A_ECRIRE` vide une partie requise | « Le synopsis est encore au marqueur ⟨à écrire⟩ — écrivez-le d'abord » |
| `indisponible{raison}` | worker injoignable (D2) | « Réessayer » |
| `illisible{motif}` | deux sorties non conformes | message calme unique |

La branche `refuse` — qui **n'appelle jamais le modèle** — cesse d'être confondue avec une panne.

## C1 — **Je me rallie aux 4 itérations du Tech Lead, dans son ordre.** Oui, son it1 est plus fine.
| | TL it1 « prose seule » | Mon it1 « Tisser » |
|---|---|---|
| Sortie | `{fonction?, apparence?, description_joueur?}` | `{detenteurs:[{pnj_rang, certitude, revele_comment}]}` |
| Rangs | **aucun** | oui → **tout le va-et-vient rang ↔ identifiant** |
| Listes | aucune | une, à borner |
| Énumérations | aucune | `certitude` |
| Entité désignée par | **l'auteur** (un `Select`) | **le modèle** |

« Trois chaînes libres sur une entité que l'auteur a lui-même choisie : **il n'y a pas plus petit.** Mon it1 mettait dans la même tranche le premier appel HTTP, le premier schéma, le premier rejeu, le premier panneau de diff **et** le mécanisme de rang — que j'appelle moi-même la pierre angulaire. Ma propre réserve du tour 1 (« it1 est chargée, NON MESURÉ ») disait déjà qu'elle était trop grosse ; je n'avais simplement pas vu qu'une tranche plus fine existait. »

**Ce que je demande que l'it1 porte quand même** — de la forme, pas du volume, et dix fois plus cher à rétrofiter : (a) l'**enveloppe à quatre branches** avec rejeu **exactement une fois** ; (b) le **filtre `MARQUEUR_A_ECRIRE`** et la branche `refuse{champ}` — un personnage dont `fonction` porte le marqueur est **à la fois** la cible du remplissage **et** un champ retiré du contexte, « et c'est trivialement facile de l'écrire à l'envers » ; (c) la **garde d'audience stricte**. Aucun rang, aucun nombre, aucune sous-entité en it1 : **la frontière se prouve vide avant d'être chargée.**

**Maintenu : « Éclater le synopsis » EN DERNIER.**

## Réponses nommées
**À l'UX — « Éclater le synopsis en premier ». NON.** Vrai du **rendu**, faux du **contrat** : seul assistant produisant des entités sans identité (frappe × 9, rollback partiel à penser) **et** seul dont l'entrée canonique est intégralement non injectable. **« Le plus simple à dessiner est le plus dur à valider. Ton anatomie est juste, c'est son rang qui ne l'est pas. »** *Ratifié sans réserve* : REMPLISSAGE déclenchée par `MARQUEUR_A_ECRIRE` importé (KR-223), `Badge` jamais `good`/`bad`, région `role="status"`. Sur l'édition du « APRÈS » différée : si ça revient, **écrire que le champ éditable ne peut jamais être un champ `moteur`**, sinon le panneau devient un second éditeur de fiche.

**Au PM — ta condition d'entrée sur Éclater : ACCEPTÉE, et je fournis le texte** (la formulation paramétrée de ma Q4). **Mais je conteste ta place (it2)** : ta condition est satisfaite par du **texte**, le risque par du **code prouvé**. En it2, la création arriverait avant que le mécanisme de rang ait tourné une seule fois.

**À QA — deux corrections dans mon périmètre.**
- **KR-233 : « le copilote peut créer des entités » est à réécrire.** Le copilote ne crée **jamais** : le modèle rend un brouillon sans identité, **le code crée après un geste de l'auteur**. « KR-233 sera lu par la n° 10, et *le copilote peut créer* est exactement la phrase qui se généralise en *l'assistant peut créer*. »
- **AC8 est trop lâche et laisse passer trois de mes vetos** : il énumère des **familles**, or `relations[]` contient `intensite` (`moteur`, l. 322, **un seuil**) et `secret`, et `plan_actions[]` contient `etape`, `declencheur_expr` et `duree`. **AC8 doit énumérer des chemins de FEUILLE, jamais des familles** (KR-215, qu'elle cite elle-même). *Sous la forme actuelle, un test vert autoriserait le modèle à poser un seuil.*
- *Ratifié* : AC2, AC6, AC7, AC10, et la ligne de partage FORME / PROSE.
- **Un AC qui manque, et c'est le mien** : *relancer deux fois le même assistant sur un dossier inchangé produit exactement 2 appels dont les corps de requête sont **identiques*** — la preuve testable de l'absence de mémoire.

**Au Tech Lead — sur les curseurs, je te suis**, avec une condition maintenue : **les six ou aucun, jamais complété par `CURSEURS_INITIAUX`.** Vérifié : `CURSEURS_INITIAUX` vaut `CURSEUR_MIN` sur les six (`curseurs.test.ts` l. 161) — une proposition partielle **plancherait en silence** les curseurs non rendus, et l'auteur ratifierait des valeurs qu'il n'a jamais vues.

## Statut de mes objections du tour 1
| Objection | Statut |
|---|---|
| Deux contrats distincts | **RETIRÉE** — la garde d'audience attrape une faute que la mienne laissait passer (`titre`) |
| `camp` / `nom` / `reussi_si_texte` nécessaires | **RETIRÉE** pour `camp` et les `nom` ; **résolue autrement** pour les objectifs (rétrécir l'assistant) |
| Le modèle n'écrit aucun nombre qui soit un seuil | **MAINTENUE et DURCIE EN VETO** sur AC8 tant qu'elle énumère des familles |
| Zéro identifiant dans la sortie ; rangs seulement | **MAINTENUE**, clarifiée : vise la sortie brute. Deux types |
| Filtre `MARQUEUR_A_ECRIRE` + refus nommant le champ | **MAINTENUE** — exigée dans l'it1 |
| `porte_suggeree` ouvre l'éditeur n° 4 | **RETIRÉE** — inexécutable |
| Borne de contexte mesurée puis plafonnée | **MAINTENUE, amendée** : le `PLAFOND_CORPS_IA` du worker est une **garde 413** (refuse après l'aller-retour), pas un **budget** (refuse avant, en nommant ce qu'il faut couper) — deux constantes qui doivent s'accorder sont une duplication. **Non mesuré** |
| Aucune règle du jeu dans un prompt | **MAINTENUE**, mieux servie par l'invite côté worker |

## Veto « mémoire non spécifiée » — **levé SOUS CONDITION ÉCRITE**
« Un veto ne se lève pas parce que je l'ai traité dans ma note : il se lève quand la **spec** le porte. » Deux lignes suffisent : (1) le paragraphe de non-mémoire dans la spec ; (2) l'AC « deux appels, corps identiques ». **Présentes → levé. Absentes du tour 3 → maintenu.**

## REJETÉS (mis à jour)
0-14 **MAINTENUS** (tour 1), avec `plan_actions[].etape` **ajouté** au n° 6 (« il manquait ») et le n° 8 **reformulé** : un assembleur générique **PILOTÉ** par la table (la table est une garde, jamais un pilote).
15. **NOUVEAU — `porte_suggeree` dans le schéma de sortie** — l'éditeur appartient à `dossier-fiches` ; ni import ni `revele_si` vide ; l'avertissement `revelation-sans-porte` fait déjà le rappel.
16. **NOUVEAU — le balayage de fixture à seuil de 12 caractères** — aveugle à 100 % de mon périmètre de veto, faux positif structurel, seuil non mesuré. Remplacé par une inclusion de chemins via `feuillesDeLaFixture`.
17. **NOUVEAU — toute dérogation à `destination === 'ia'` en v1** — la liste doit être vide et le test doit l'asserter. Quand un assistant manque d'entrée, on **rétrécit l'assistant**, on n'ouvre pas la table.
18. **NOUVEAU — un seul type pour la sortie brute et la proposition interne** — le chemin exact par lequel un rang devient un identifiant sans que personne l'ait décidé.
19. **NOUVEAU — une proposition partielle de curseurs complétée par `CURSEURS_INITIAUX`** — planche en silence et fait ratifier des valeurs non vues. **Les six ou aucun.**

## Les trois choses demandées au tour 3
1. **Garde d'audience stricte, zéro dérogation, test qui asserte la liste vide** — et « Éclater » v1 rétréci (sans `objectif_rang`).
2. **L'enveloppe à quatre branches** et le rejeu exactement une fois, **dans l'it1**.
3. **Les deux lignes de non-mémoire** + l'AC « deux appels, corps identiques ». **Sans elles, veto maintenu.**
