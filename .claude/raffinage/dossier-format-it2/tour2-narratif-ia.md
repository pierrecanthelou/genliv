# Tour 2 — `narratif-ia` · `dossier-format` it2

## Réponses nommées

**Tech Lead — « par construction » est faux.** Tu as raison, et ton instrument est nécessaire. Il ne suffit pas : une `projeterCharpente` bâtie champ par champ depuis une table fermée livrerait **fidèlement** `declencheur_texte` et `condition_texte` au modèle. Ton objection dit *le type ne confine pas* ; la mienne dit *ces deux champs ne doivent pas être dans la table*. Elles s'additionnent. J'adopte ta fonction avec **un second argument** — `projeterCharpente(charpente, jalonsAtteints)` — ce qui la rend pure et lève ma réserve « pas sa place en it2 ».

**PM — `Revelation` n'est pas irréversible : tu as raison, je cède la place.** Vérifié : le but écrit d'it3 livre déjà « le type `Revelation` à portes ». Un champ optionnel ajouté en it3 n'est pas une migration. **Une condition** : la décision « les portes se ferment à l'ASSEMBLAGE du contexte, jamais par filtrage de la sortie » entre en `resolved_decisions` **maintenant**. Non écrite, la n° 11 implémentera le filtrage a posteriori — et le joueur aura déjà lu le secret.

**UX — `contrepartie` : structurée, pas suffixée.** `{ objet_id, consomme }` ; le prix dit au joueur se dérive du `nom` de l'objet à l'assemblage. Ton doute était fondé sur un vrai trou : le registre D1 n'a que trois suffixes, et « non suffixé » recouvre *prose auteur* **et** *donnée moteur*.

**QA — oui, ma table aurait le même angle mort.** Chemins **normalisés**, balayage de **tous** les éléments, couvert seulement si **chaque** instance rougit.

## Statut de mes objections

| # | Statut |
|---|---|
| O1 — injecter `declencheur_texte` / `condition_texte` | **DURCIE EN VETO** — règle dupliquée code/prompt, mon domaine |
| P1 — `enonce_texte` | **MAINTENUE** — correctif de forme, pas l'innovation |
| P2 — `DESTINATION_DES_CHAMPS` | **VETO RETIRÉ**, dégradée en décision écrite |
| P3 — `contrepartie` structurée | **MAINTENUE**, câblage it3 |
| P4 — `BUDGET_CONTEXTE`, bornes | **RETIRÉE** (table sans lecteur) ; les constantes suivent leur champ |
| P5 — golden des `templateId` | **MAINTENUE** |
| F3 (`evenement`/`climat`) · G (`meta`) | **CONVERGÉES** avec le Tech Lead |

## Le veto, exactement

**Ce que je bloque** : qu'une sortie de la n° 10 injecte `jalons[].declencheur_texte` ou `fins[].condition_texte` dans le contexte du modèle.

`declencheur_expr` est la règle ; `declencheur_texte` est *la même règle en français*. Injectée, elle existe à deux endroits — le code et le prompt — et dérive au premier changement de l'expr. Effet narratif aggravant : un narrateur qui lit « quand le joueur brise le sceau » **conduit** le joueur au sceau.

**Le fait qui rend l'aller-retour inévitable** : `docs/ROADMAP-BASCULE-IA.md` § 5 écrit que `charpente` est « lue par le moteur et **jamais** injectée à l'IA », et `types.ts:114` répète « ce que le MOTEUR lit et que l'IA ne voit JAMAIS ». **La décision B contredit deux documents contraignants.** Soit on amende la décision, soit on amende les deux documents.

Le plan de cible § 1.5 promet « le moteur les coche ; l'IA reçoit *voici où on en est* ». Ses exemples de jalons sont des **énoncés de fait** — « le sceau est brisé » — jamais des déclencheurs. **La décision B injecte la colonne d'à côté.**

**Deux sorties acceptables** : (1) `enonce_texte` + `projeterCharpente(charpente, jalonsAtteints)` en it2 ; (2) aucune projection en it2, `charpente` reste close, la projection part en n° 9 — alors `declencheur_texte`/`condition_texte` restent au schéma, destination **auteur + linter n° 7**. **Une seule sortie est inacceptable : livrer la projection telle que la décision B l'écrit.**

## Pourquoi `nom` ne peut pas tenir lieu d'énoncé

1. `nom` est **optionnel** — un contexte alimenté par un champ optionnel se vide en silence.
2. `nom` est **interne** (`CLAUDE.md` : « name (internal) + player-facing description »). L'injecter poserait le précédent que le `nom` de toute entité est injectable.
3. `nom` est le **OÙ du rapport d'anomalie**. Le charger d'une seconde audience abandonne le registre D1 le jour où on l'écrit.

## Ce qui remplace `DESTINATION_DES_CHAMPS` (veto retiré)

Motif du retrait, assumé : aucun assembleur n'existe avant la n° 10, donc aucun instrument — l'argument même qui a tué `construireContexte` en it1. À la place, en `resolved_decisions` :

> `Pick<Dossier, 'canon' | 'monde'>` est **abandonné** comme signature de contexte. La n° 10 bâtit son contexte par projection explicite champ par champ et prouve le confinement par `Object.keys(payload)`. Motif : it2 fait entrer dans `monde` des données strictement moteur — `evenements[].proba`, `resolutions[].consequence`, `plan_actions[].declencheur_expr`, `contre_mesures[]`, `climat[].effets_regles`, et `monstre_ref` qui résout vers `pv`/`armour`/`capacity`. **Le `Pick` les enverrait toutes.**

C'est la **troisième** issue de la question ouverte M4, qui n'en avait nommé que deux.

## Correctif de l'angle mort des tableaux

`cheminsDuDocument` n'entre pas dans les tableaux et ne manie que deux segments. Trois changements : (1) descendre dans les tableaux en émettant le chemin réel et en le **normalisant** ; (2) balayer **tous** les éléments (union des clés, pas intersection) ; (3) chemin normalisé couvert **seulement si CHAQUE instance rougit** — sinon une règle qui ne contrôle que `[0]` passerait pour exhaustive. **Sans le point 3, l'instrument ment plus qu'il n'informe.**
