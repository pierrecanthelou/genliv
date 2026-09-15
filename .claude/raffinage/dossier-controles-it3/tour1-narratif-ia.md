# Tour 1 — `narratif-ia`

RISQUE — **Un faux positif BLOQUANT sur un dossier correct**, le défaut le plus cher qu'un linter puisse porter. Il est MESURÉ : dans `dossier-minimal.json`, `indice.cendres-tiedes` n'est détenu par AUCUN savoir ; son unique producteur est le `reveler_indice` de `monde.evenements[].resolutions[].consequence` (l. 194). Une règle « indice orphelin » lue depuis `savoirs[].indice_id` déclarerait injouable, à son tout premier run, **la fixture même qui sert de base à toutes les preuves de l'itération**.

OBJECTION — (1) La définition écrit « un indice que personne ne DÉTIENT ». Détenir est UNE des trois familles de production ; il y a **SIX chemins producteurs** (§ 2). Une règle bloquante qui en ignore cinq ne mesure pas la jouabilité, elle mesure une habitude de rédaction. (2) La spec réserve l'index des producteurs à it4 (`atteignabilite.ts`, `brain_contracts` : « UNIQUE … deux parcours seraient deux vérités »), alors qu'« indice orphelin » part en it3.

PROPOSITION — (1) it3 écrit `atteignabilite.ts` : index PLAT des six chemins, une seule passe, +1 test falsifiant par chemin. it4 n'y ajoute que la saturation par `mene_a`. (2) Fusionner orphelin (0 → bloquant) et goulot (1 → alerte) en UNE entrée `niveaux: ['bloquant','alerte']` : même cause, un seul compte, précédent exact `amorce-non-redigee`. **5 règles → 4 entrées.**

VERDICT — **recevable sous réserve.** Le faux positif est une OBJECTION, pas un veto — le niveau appartient au PM et à la QA. Ce qui est de mon terrain : **la règle d'audience est FAUSSE telle qu'écrite et doit être RÉÉCRITE, jamais exceptée.**

## ANNEXE

### 1. Tension n° 2 — tranchée, mesurée

**MESURE.** `destinations.ts` l. 261 : `'monde.personnages[].savoirs[].indice_id': 'ia'`. Confirmé. La `resolved_decision` d'it1 est **fausse sur ce chemin** et doit être **amendée dans la spec**, pas conservée. *Un motif faux qui traverse deux comités est la famille exacte de BUG-080 : un refus juste pour un motif faux cède devant le premier contradicteur sérieux.*

**Fait de contexte qui qualifie ce `ia`** : c'est la **seule ligne `ia` de toute la table qui porte un `…_id`**. Les neuf autres identifiants sont `moteur` sans exception. Et le commentaire qui la porte (l. 244-260) dit pourquoi : « le savoir est RECOMPOSÉ PAR LE CODE avant injection … la sortie du modèle renvoie ces RANGS, que le code re-résout en identifiants ». C'est une audience de **protocole**, pas de **contenu**.

**Issue retenue : la règle d'audience est RÉÉCRITE, pas exceptée.** Une exception par chemin cesse d'être une règle au troisième cas. Formulation de remplacement, toujours mécanique :

> **Le critère n'est pas l'audience de la clé lue, c'est la NATURE DU GESTE qui éteint le voyant.**
> Un voyant qu'on éteint en **RÉDIGEANT de la prose d'audience `ia`** n'est **jamais** bloquant.
> Un voyant qu'on éteint en **POSANT UNE RÉFÉRENCE** entre deux entités qui existent déjà **peut** l'être, quelle que soit l'audience de la clé qui la porte.

Discriminant constatable en revue : la règle lit-elle la valeur **comme de la prose** (`includes`, `trim`, longueur) ou seulement **comme une identité/présence d'identifiant** (`===`, appartenance) ?

Ce que la réécriture **préserve sans modification** : l'arbitrage d'it1 (les trois proses `ia` du canon restent `alerte`) et le niveau `info` de « sans voix propre ». Ce qu'elle **débloque** : « indice orphelin » bloquante — on l'éteint en posant `indice_id`, en ajoutant une cible à un `reveler_indice`, ou en écrivant un `mene_a` : trois gestes de **structure**, aucun de rédaction. *Exiger de l'auteur qu'il RELIE deux entités n'inverse aucune audience ; exiger qu'il NOURRISSE le modèle l'inverserait.*

### 2. Inventaire exhaustif des sources d'un indice — six chemins, trois familles

| # | Chemin exact | Audience | Nature |
|---|---|---|---|
| 1 | `monde.personnages[].savoirs[].indice_id` | **`ia`** | un PNJ le détient (sous portes `revele_si`) |
| 2 | `monde.quetes[].recompense` → `{delta:'reveler_indice'}` | `moteur` | delta |
| 3 | `monde.evenements[].resolutions[].consequence` → idem | `moteur` | delta |
| 4 | `charpente.jalons[].effet` → idem | `moteur` | delta |
| 5 | `monde.conditions.climat[].effets_regles` → idem | `moteur` | delta |
| 6 | `monde.indices[].mene_a[]` | `moteur` | enchaînement |

**CONSOMMATEURS — jamais des sources** (l'erreur symétrique, faux négatif) : `savoirs[].revele_si.apres_indice_id` (`tables.ts` l. 576) et les prédicats `indice_connu` / `pnj_a_revele` (`predicates.ts` l. 52, 66).

**Sens d'erreur d'une règle BLOQUANTE : toujours permissif.** L'ensemble des producteurs est **maximal** — le chemin 5 y entre bien qu'aucun moteur ne puisse l'appliquer (`destinations.ts` l. 551-562 : un climat n'a « AUCUN INSTANT d'application »). Le compter produit au pire un faux **négatif** ; l'exclure produit un faux **positif bloquant**. Réserve → `open_questions`, propriétaire n° 14.

**it3 ne fait pas la saturation, et c'est correct** : le chemin 6 se lit **à plat** — tout indice cité dans un `mene_a[]` a un producteur. Sûr dans le sens bloquant (le seul cas manqué, un porteur lui-même inatteignable, est un faux négatif). La clôture transitive est ce que la spec réserve à it4.

### 3. « Sans voix propre » et « départ désert »

**`caractere.parler` — contrôle légitime, sous trois conditions.** Légitime parce que (1) elle constate une présence/absence de clé, jamais une valeur (KR-221) ; (2) elle ne juge pas la qualité — compter les mots ou détecter une réplique creuse n'a d'autre juge qu'un modèle, **refusé d'avance** ; (3) son message énonce un **fait de moteur** : `parler` est le seul champ qui **épingle** la voix d'un personnage ; absent, le modèle l'improvise et **rien ne la reconduit d'un tour à l'autre** — dérive de voix constatable, pas défaut de style.

Conditions : (a) **`info`, jamais plus**, et hors de `jouable` ; (b) le message dit le fait + la conséquence runtime, jamais l'intention ; (c) **bornée à `portee === 'premier'`** — sur `dossier-reference.json`, **5 personnages sur 6** n'ont pas de `parler` ; bornée, **3 sur 4**. *Un `info` qui tire sur 83 % des personnages du dossier de démonstration n'est plus un contrôle, c'est un bruit de fond, et un panneau bruyant cesse d'être lu — ce qui coûte les bloquants qu'il contient.*

Mesure jumelle, **sans** proposition de borne : « sans présence » tire sur **4 sur 6** de la même fixture. Je ne la borne pas — être rencontrable n'est pas fonction de la profondeur de simulation. Mais le comité doit savoir que la section Personnages de `dossier-reference.json` portera **ALERTE en permanence** dès la livraison. Ma lecture : **la fixture est incomplète, la règle a raison.**

**« Départ désert » — le fait exact.** `charpente.depart.lieu_id` n'est la valeur d'aucun `presence[].lieu_id`. Deux lectures `moteur` pures (l. 566 et l. 337).

*Ce que ça n'empêche pas* : le moteur fait son travail entier ; le narrateur aussi (`description`, `ambiance`, `dangers` sont `ia`). *Ce que ça empêche* : aucun appel **acteur** au premier tour, et comme tout savoir est porté par un personnage, aucun indice n'est accessible au point d'entrée. **La partie s'ouvre sur un monologue dont rien ne sort.**

**Réserve sur le NIVEAU** (terrain PM, signalée, non bloquante) : « bloquant » repose sur une prémisse **non écrite** — que le joueur ne peut pas simplement partir. Or la feature a adopté l'hypothèse inverse, **KR-224 monde ouvert**, pour amputer « sans présence ». Deux issues honnêtes : soit bloquant **avec la prémisse écrite** (« le premier tour est le seul que l'auteur ne puisse pas rattraper »), soit **alerte**. Recommandation : bloquant avec la prémisse écrite. Non négociable : le message **dit le fait**, il ne dit pas « votre aventure est injouable ».

### 4. La voix des cinq messages

Registre établi par it1 : le **constat** à l'indicatif présent, impersonnel, sujet = le document ; la **remédiation** à l'impératif, 2ᵉ personne du pluriel. *Le linter n'est pas le narrateur* : pas de deuxième personne immersive, pas de présent narratif.

| Règle | `path` | Message | Remédiation |
|---|---|---|---|
| orphelin (**bloquant**, `indices`) | `monde.indices[].id` | « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. » | « Confiez-le à un personnage, mettez-le en récompense ou en effet, ou faites-y mener un autre indice. » |
| goulot (**alerte**, `indices`) | `monde.indices[].id` | « Un seul chemin mène à cet indice : si le joueur le manque, il ne l'obtiendra jamais. » | « Prévoyez une seconde source : un autre personnage, une récompense, ou un indice qui y mène. » |
| départ désert (**bloquant**, `depart`) | `charpente.depart.lieu_id` | « Aucun personnage n'est présent au lieu de départ : le premier tour n'aura aucun interlocuteur. » | « Donnez une présence dans ce lieu à au moins un personnage, ou déplacez le point de départ. » |
| sans présence (**alerte**, `personnages`) | `monde.personnages[].presence[].lieu_id` | « Ce personnage n'est présent dans aucun lieu : le joueur ne peut le rencontrer nulle part. » | « Indiquez au moins un lieu où on le trouve. » |
| sans voix (**info**, `personnages`) | `monde.personnages[].caractere.parler[]` | « Ce personnage n'a aucune réplique type : le modèle inventera sa façon de parler, et elle changera d'un tour à l'autre. » | « Écrivez une ou deux phrases telles qu'il les dirait. » |

**Contribution à la tension n° 1** (terrain tech-lead, règle de forme que mon poste commande) : **le `path` d'une règle d'absence pointe l'ENTITÉ QUI SUBIT l'absence, pas le champ manquant.** D'où `monde.indices[].id` pour les deux règles d'indice — clé existante, `moteur`, et seul repère de retour utile puisque le champ absent n'a pas d'instance.

### 5. REJETS nommés (→ § 8 du plan)

1. **REJETÉ — « indice orphelin » calculée depuis `savoirs[].indice_id` seul.** Faux positif bloquant **mesuré** sur `dossier-minimal.json`.
2. **REJETÉ — le maintien tel quel de la phrase d'it1 « les cinq règles bloquantes ne lisent que du moteur, dont `savoirs[].indice_id` ».** Mesurée fausse ; elle s'amende, elle ne se conserve pas.
3. **REJETÉ — une exception d'audience accordée au seul chemin `savoirs[].indice_id`.** C'est la formulation qui est fausse, pas le cas qui est spécial.
4. **REJETÉ d'avance — toute règle jugeant la QUALITÉ d'une prose** (longueur de `parler`, « voix distinctive », réplique creuse). Le seul juge possible est un modèle ; refus déjà prononcé en it1.
5. **REJETÉ — « sans voix propre » à un niveau autre qu'`info`, et son entrée dans `jouable`.** On éteint ce voyant en rédigeant de la prose `ia`.
6. **REJETÉ — deux parcours des producteurs d'indices** (un en it3, un autre dans `atteignabilite.ts` en it4). La spec l'interdit dans ses propres `brain_contracts`.
7. **REJETÉ — l'exclusion de `climat[].effets_regles` de l'ensemble des producteurs.** Sur une règle bloquante, l'erreur permise est le faux négatif, jamais le faux positif.

### 6. Hors de cause

Aucune sortie de modèle consommée, aucun prompt écrit, aucun contexte assemblé, aucune mémoire de session, aucun dé lancé. **Aucun contrat de sortie IA n'est dû par cette itération.** Ce qu'elle engage de mon poste : la **frontière d'audience** (§ 1) et le **budget d'attention de l'auteur** (§ 3).
