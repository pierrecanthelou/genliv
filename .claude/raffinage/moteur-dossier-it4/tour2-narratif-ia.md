# TOUR 2 — `narratif-ia` — `moteur-dossier` it4

```
RÉPONSE À   — tech-lead, § « Frontière sessionEngine / actionEngine » et sa liste de 22 fichiers.
              « defaultSessionFields() meurt PAR DOMICILE » est exact et incomplet : mesuré, cette
              fonction EST le défaut B3 (REGLES-PLAY.md:31), et PE_PER_TRANSITION = 5 EST
              REGLES-DU-JEU.md:43 (= A4 l. 17, E3 l. 92). Onze sites, tous au lot → ZÉRO occurrence
              dans src/ après it4. Même angle mort sur EXIGENCE-APERCU-DU-JEU.md : il l'amende aux
              l. 7/11/62, jamais la l. 9 — la seule que le critère 11 cite. Cause commune : un
              fichier n'entre au lot que s'il casse `tsc`. Une règle, elle, ne casse rien.
              Et son R4/M6 : le post-it4 réel est 48 (14/8/26), pas 47 — docstring fausse d'UNE
              unité, la moins détectable. La coïncidence à 47 que la QA redoutait n'a même pas
              lieu ; son 13 et le 15 du tech-lead sont faux.

MES OBJECTIONS
  1. A4/E3 + B3 sans successeur → DURCIE EN VETO. Levée par UNE ligne : docs/REGLES-PLAY.md entre
     au lot (bandeau § A) + une open_questions nommant la n° 11. Aucune ligne de code.
  2. Doc amendée PAR le lot qui supprime playExport.ts → maintenue, durcie sur la forme : phrases
     verbatim + l. 7/9/11/49/62 nommées au plan (le « même commit » ne suffit plus : R4 ouvre un
     geste de doc d'étape 4 où une paraphrase passerait).
  3. Pas de réécriture des § 2/3/6 → maintenue.
  4. Pas de +5 PE recodés ici → maintenue : mon veto réclame des mots, pas du code.
  5. Plancher PAR RACINE → maintenue, chiffres corrigés : 10 / 5 / 25.
  6. Prose, rng, § H → maintenues, avec une correction de ma main.

PROPOSITION — docs/REGLES-PLAY.md en fichier 23 (ou 22 si le grep tombe), geste (M), 4 lignes.

VERDICT     — veto, ciblé, dont la levée est écrite noir sur blanc.
```

## A. C6 — pourquoi c'est un veto, et ce qui le lève

**Pas un veto sur la démolition** : it4 n'appelle aucun modèle, ne touche ni dés, ni PV, ni
inventaire, ni XP. Le veto porte sur **le plan tel qu'il est**, qui laisse deux règles du jeu sans
implémentation **et sans propriétaire nommé**.

**Pourquoi c'est mon domaine** : l'invariant est « une règle vit à **un seul** endroit : le code ».
Le mode de panne gardé n'est pas la suppression, c'est le **retour** — une règle qui survit en doc
sans implémentation revient par le canal le moins cher, et à la n° 13 c'est **une ligne de prompt**.
`REGLES-PLAY.md § A` porte aujourd'hui « A4. Changement d'écran = +5 PE ✍️ *Défaut : OK, appliqué à
chaque transition de nœud* » — une phrase **au présent, fausse dès le commit d'it4**.

**Onze sites, tous au lot** :

| Symbole | Sites | Sort |
|---|---|---|
| `PE_PER_TRANSITION` | `sessionEngine.ts:7` (déf.), `:74` ; `usePlaySession.ts:13, :138, :221` | supprimés |
| `defaultSessionFields` | `sessionEngine.ts:9` (déf.), `:69` ; `persist.ts:2, :25` | supprimés |
| | `types.ts:21` (docstring) | **survit — renvoi pendant** |
| `createSession` (`rng = Math.random`) | `sessionEngine.ts:57` | supprimé |

→ **zéro occurrence restante**, `tsc` vert, aucune suite rouge. **Panne muette** (KR-258).

**Sources vérifiées dans le sens imposé (`REGLES-DU-JEU.md` → code, KR-130)** :
`REGLES-DU-JEU.md:43` « Récupération : changer d'écran/zone = **+5 PE** » (relais A4 l. 17, E3 l. 92) ;
`REGLES-PLAY.md:31` B3 « mains nues (×0.3), aucune protection, 0 objet » — mot pour mot ce que rend
`defaultSessionFields()`.

**LEVÉE DU VETO — deux gestes, rien de plus** : (1) `docs/REGLES-PLAY.md` entre au lot, geste **(M)**,
bandeau § A **verbatim** ; (2) l'orchestrateur écrit **une** `open_questions` (étape 7, coût nul) :

> « **A4/E3 (+5 PE par changement de lieu) et B3 (équipement de départ) n'ont plus aucune
> implémentation depuis it4.** Propriétaire : **n° 11**, première itération à faire entrer `heros`
> dans `EtatSession`. Successeur de la transition : la commande `aller` (§ J1). »

**Ce qui N'EST PAS exigé** : aucune réimplémentation dans it4 (`EtatSession` n'a pas de `heros` avant
la n° 11 — `session.ts:127/161` ; l'ouvrir violerait KR-249), aucune modification de
`REGLES-DU-JEU.md`, aucun test neuf.

**Geste gratuit, fichier déjà au lot** : `src/player/types.ts:21` porte « *initialised by
`defaultSessionFields()`* » sur `SessionEquipmentState`, **qui survit**. Après it4 ce renvoi pend.
`types.ts` est le fichier 20 : aucun « petit refactor à côté » à invoquer.

## B. C5 — **3 modules**, et la réconciliation des trois comptes

Les « trois chiffres » venaient de **trois unités différentes**, pas de mesures contradictoires.

| Module `brain/` | Occurrences | Fichiers non-test **survivants** | l. 9 ? | l. 49 ? |
|---|---:|---:|---|---|
| `types.ts` | 12 | **6** (`actionEngine`, `useCombat`, `combatEngine`, `combatTypes`, `CombatScreen`, `ReinforcementPicker`) | **non** | non |
| `monsterCapacities.ts` | 4 | **3** (`capacityEffects`, `combatEngine`, `combatTypes`) | **non** | **oui** |
| `creatureTypes.ts` | 1 | **1** (`combatEngine`) | **non** | non |
| `tree.ts` | 5 | **0 après it4** | non | non |
| `utils/playExport.ts` | 1 | **0 après it4** | non | non |

Confirme C.4 de la QA : `tree` 5 → 0 et `playExport` 1 → 0, **rouge aujourd'hui**, donc séparateur
sans mutant. **Les deux listes du même document se contredisent déjà** (`monsterCapacities` en l. 49,
absent de la l. 9) : l'amendement touche **les deux**.

### Remplacement intégral de la **l. 9** (VALIDÉ, une correction vs tour 1)

> **Isolation :** `src/player/` n'importe **aucune feature et aucun service** (`BookService`,
> `PersistenceService`, `DossierService`, `CopiloteService`). Il importe les fonctions pures `brain/`
> (`characteristics.ts`, `combat.ts`, `xp.ts`, `challenge.ts`, `equipment.ts`, `monsterCapacities.ts`,
> `creatureTypes.ts`) **et `brain/types.ts`**, dont il ne lit que les formes de créature et d'objet
> (`MonsterConfig`, `GameObject`, `CreatureType`) — mesuré à l'itération 4 de la n° 9 : **six**
> fichiers non-test l'importent. `brain/types.ts` est **à moitié le modèle d'arbre condamné** ; sa
> scission appartient au repointage de `tree-canvas`, différé après le Temps 2, et **pas** au runtime.
> Ces modules font partie du bundle extractible ; aucun n'importe de service, de persistance ni de
> composant. Depuis l'itération 4 de la n° 9, `src/player/` n'importe plus **`brain/tree.ts` ni
> `brain/utils/playExport.ts`** — mesurés à 5 et 1 occurrences avant, **0 après**.

*(correction vs tour 1 : `brain/utils/playExport.ts` ajouté — il tombait aussi à 0 et n'était pas nommé.)*

### Remplacement de la dernière phrase de la **l. 49** (VALIDÉ, inchangé)

> **Le point d'entrée est le couple `Dossier` + `EtatSession`.** Le dossier est chargé **en lecture
> seule et gelé à l'ouverture** (décision n° 7) ; l'état de session est le seul objet qui bouge, et
> `ouvrirSession(dossier, { graine_alea })` en est la fabrique. `AdventureDocument` et
> `buildAdventureDocument` sont **supprimés** par l'itération 4 de la n° 9 : le runtime ne charge plus
> jamais un arbre de nœuds ni d'arêtes. **Entre cette itération et la n° 10, `src/player/` n'a aucun
> point de montage** — ses écrans de combat, de création de héros et de progression restent sur
> disque, sans consommateur, en attente d'être rebranchés sur `EtatSession`.

**Vérifié avant signature** : les 23 occurrences de `AdventureDocument`/`buildAdventureDocument` dans
`src/` sont toutes dans des fichiers du lot. Aucune ne survit. *(Deux `specification.json` la
mentionnent — historiques d'itérations closes, hors périmètre.)*

### Bandeau en tête de `docs/EXIGENCE-APERCU-DU-JEU.md` (VALIDÉ)

> ⚠ **Document partiellement périmé depuis l'itération 4 de la n° 9 (2026-09-24).** Les l. 7, 11, 23,
> 26, 48, 50 et 62 décrivent le chargement d'un **arbre de nœuds** (`AdventureDocument`,
> `buildAdventureDocument`, `book-export`, nœud `sommaire`) : ce chemin n'existe plus. Les l. 9 et 49
> sont à jour. La réécriture des § 2, 3 et 6 sur le **dossier d'aventure** appartient à la **n° 15**.

**Lignes à écrire au plan : 7, 9, 11, 49, 62 + bandeau.** La liste du tech-lead ne portait que
7/11/62 ; **sans la l. 9, le critère 11 reste non satisfiable** — c'est la ligne que le critère cite.

## C. Bandeau § A de `docs/REGLES-PLAY.md` — texte exact, après la l. 9

> ⚠ **§ A — sans implémentation depuis l'itération 4 de la n° 9 (2026-09-24).** A1 à A5 décrivent la
> traversée du **modèle d'arbre** : ses consommateurs sont éteints, le modèle survit sur disque, et
> l'orchestration en vigueur est le **§ J**. **Deux règles citées ici ne sont PAS des règles d'arbre
> et restent dues** : **A4 / E3 — « changement d'écran ou de zone = +5 PE »** (`REGLES-DU-JEU.md` § 1,
> Endurance, l. 43), et **B3 — équipement de départ**. Mesuré à l'itération 4 : elles n'ont plus
> **aucune** implémentation dans `src/`. **Propriétaire : la n° 11**, première itération à faire
> entrer `heros` dans `EtatSession`. **Le successeur de « changer d'écran ou de zone » est la commande
> `aller`** — un pas d'horloge accepté (§ J1). La récupération de PE est **du code déterministe
> appliqué par le moteur, jamais une phrase du narrateur ni une consigne de prompt.**

Les mentions ✍️ des l. 17 et 31 **restent telles quelles** : elles décrivent la règle, pas son état
d'implémentation, et c'est le bandeau qui porte l'état. Aucune autre ligne touchée.

## D. C8 — oui, panne d'instrument ; non, ça ne change rien à C7

**Mécanisme exact** : `contexte.test.ts:1745`, `source.slice(debut, source.indexOf('\n\n', debut))` —
en CRLF le séparateur est `\r\n\r\n`, `indexOf` rend `-1`, `slice(debut, -1)` rend tout le reste du
fichier. Le balayage ne scanne plus une déclaration mais ~l'intégralité de `relations.ts`. **« La base
s'étend en silence »** : qu'il rougisse ici est une **chance, pas une propriété** — la moitié de ces
assertions sont des `toContain` **positifs**, qui **verdissent** quand la base grossit.

**Ce que ça pèse dans mon domaine** : `contexte.test.ts` garde `BUDGET_CARACTERES_CONTEXTE`, la borne
de contexte des rôles IA. Mesuré : les **valeurs** (`BUDGET_PROSE 6000`, `BUDGET_DETENTEURS 17 000`,
`BUDGET_REPLIQUES 4000`, `BUDGET_PLAN 4000`) sont dérivées de la **fixture JSON**, pas des fins de
ligne — **elles ne bougent pas**. Ce qui devient illisible, ce sont les gardes structurels autour.

**Consigne demandée au plan, une phrase** : *tant que M-5 n'est pas réparé, personne ne cite
`contexte.test.ts` vert comme preuve qu'une borne de contexte tient.*

**Effet sur C7 : AUCUN, mesuré.** `moteurSansIA.test.ts` est **immunisé** (motifs intra-ligne ;
périmètre par `readdirSync`, pas par `slice` ; le durcissement n'ajoute **que des nombres**).

## E. C7 — plancher par racine, **chiffres corrigés : les trois rôles avaient un chiffre faux**

| Racine | Aujourd'hui | Après it4 | Plancher `floor(m/5)×5` |
|---|---:|---:|---:|
| `src/player` | 23 | **14** | **10** |
| `src/features/play-mode` | 9 | **8** | **5** |
| `src/brain/dossier` | 26 | **26** | **25** |
| **Total** | **58** | **48** | (docstring : **47**) |

- **tech-lead M6** annonce `brain/dossier` à 15 → **faux, 26** : aucun fichier de sa liste n'est sous
  `brain/dossier/`.
- **QA A.4** annonce `src/player` à 13 → **14** (survivants énumérés : `heroGen`, `EndScreen`,
  `combatTypes`, `types`, `XpShopScreen`, `CombatScreen`, `HeroStatusBar`, `ReinforcementPicker`,
  `actionEngine`, `capacityEffects`, `charCreation`, `useCombat`, `CharacterCreationScreen`,
  `combatEngine`).
- **Conséquence** : total post-it4 = **48**, pas 47. **La coïncidence redoutée n'a pas lieu** — mais
  le défaut est **pire** : une docstring fausse **d'une unité** est celle qu'une relecture ne
  rattrape jamais. *L'argument de la QA survit à la correction de son propre chiffre ; celui du
  tech-lead perd son seul appui.*

**Réponse à « on modifie le témoin dans le commit qui rétrécit sa base » (KR-235)** : la direction
sauve le geste — on **resserre**, et le plancher est re-dérivé **après** démolition par
`floor(mesure / 5) × 5`, exactement le cliquet du score de mutation transposé. Passer de 20 à
10/5/25 **durcit sur les trois racines à la fois**.

**Coût nommé** : `brain/dossier` à 26 avec plancher 25 n'a qu'**un** fichier de marge — une fusion de
deux fichiers y rougira, **et c'est voulu** : le rouge dit « re-dérive et justifie », pas « échec ».

**Le 14 est une PRÉDICTION** calculée sur la liste de lot. Si le lot change, **le plancher se
re-dérive sur la mesure post-lot**. Le plan écrit la **formule**, et 10/5/25 en contrôle croisé.

## F. C1 / C3 — effet sur mes consignations : aucun, plus une correction de ma main

- **C1 (lot unique)** : mes demandes n'ont aucun contenu de découpage. **Je ne m'oppose pas à N=1** ;
  le motif de substitution de M-4 (séquentialité, pas connexité) me paraît le seul défendable.
- **C3** : indifférent. **Une réserve dans mon domaine** : si la variante « garde de frontière » est
  retenue, elle ne doit **jamais** être citée comme l'instrument de la frontière IA. **Cet
  instrument-là est `moteurSansIA.test.ts`, et lui seul** (KR-250).
- **39 littéraux de prose** : re-mesurés — 26 `text:` dans `capacityEffects.ts` + 13 dans
  `combatEngine.ts`. Inchangé.
- **`rng = Math.random`** : re-mesurés — **11 aujourd'hui**, dont `sessionEngine:57` meurt → **10
  survivants**. Les deux seuls sites passant `Math.random` **explicitement** (`TrapScreen:38`,
  `DecorScreen:75`) meurent : après it4 l'entropie n'est plus qu'un **défaut de paramètre**, dix fois.
- **CORRECTION DE MA MAIN (KR-258 vaut pour moi aussi)** : j'ai écrit au tour 1 « `graine_alea` sans
  lecteur ». **Faux** — elle est écrite (`session.ts:280`), typée `'moteur'`
  (`sessionDestinations.ts:84`), persistée, lue par des tests. La formulation juste, qui doit entrer
  au plan : **`graine_alea` n'a aucun CONSOMMATEUR D'ALÉA — aucun `rng` n'en est dérivé.** C'est ce
  couple (10 défauts `Math.random` + une graine que rien ne branche) qui rend **KR-242** non testable.
- **§ H de `REGLES-PLAY.md`** : inversion du sens d'écriture KR-130, hors périmètre, à régler **avant**
  que la n° 13 écrive son premier prompt.

## G. Contrat de sortie IA concerné par it4 — **néant, vérifiable**

Entrée injectée : aucune. Schéma de sortie : aucun. Échec de validation : sans objet. L'instrument
qui le prouve est `moteurSansIA.test.ts`, qui doit rester **vert sans avoir été modifié pour
compenser une suppression** — le durcissement du § E n'est pas une compensation : il **resserre**.

À consigner : **it4 est la dernière itération où « aucune génération de texte » vaut pour TOUTE la
surface de jeu.**

## H. Refus motivés — à recopier tels quels au § 8

> **REJETÉ (narratif-ia) — « l'amendement de `docs/EXIGENCE-APERCU-DU-JEU.md` part dans un lot documentaire distinct, ou après it4 ».** La phrase « `AdventureDocument` est l'unique point d'entrée » (l. 49) et la liste d'isolation de la l. 9 deviennent fausses **à la seconde** où `playExport.ts` est supprimé, et ce document est l'oracle que le critère 11 cite **et** que le cadrage de la n° 10 lira. Le lot qui rend une phrase fausse est celui qui la corrige — précédent it3. **AMENDÉ AU TOUR 2** : le « même commit » ne suffit plus, le geste de doc de l'étape 4 y étant aussi. Exigé : les phrases entrent au plan **VERBATIM** et les lignes **7, 9, 11, 49, 62** sont nommées dans le geste du lot — une paraphrase écrite par quelqu'un qui n'a pas lu ce comité est le mode de panne réel.

> **REJETÉ (narratif-ia) — « réécrire les § 2, § 3 et § 6 dans it4 ».** Sept lignes sont fausses au-delà des l. 9 et 49 ; les réécrire est une itération à part et empiète sur la **n° 15**. Un bandeau qui **nomme le propriétaire** coûte trois lignes et interdit la citation fautive.

> **REJETÉ (narratif-ia) — « `PE_PER_TRANSITION` et `defaultSessionFields` sont des parties arbre et partent sans mention ». DURCI EN VETO AU TOUR 2.** Mesuré : `PE_PER_TRANSITION = 5` est `REGLES-DU-JEU.md:43` (relais A4 l. 17, E3 l. 92), `defaultSessionFields` est le défaut B3 de `REGLES-PLAY.md:31` ; ni l'une ni l'autre ne mentionne un nœud ou une arête. Onze sites, tous au lot → **zéro** implémentation après it4, `tsc` vert, aucune suite rouge. La formule « meurt **par domicile** » est exacte et incomplète : elle décrit la cause de la mort, pas ce qui meurt avec. Une règle qui survit en doc sans implémentation **ni propriétaire nommé** revient par le canal le moins cher — une consigne de prompt à la n° 13 — et c'est l'invariant « une règle vit à un seul endroit : le code » qui saute. **Levée exhaustive** : `docs/REGLES-PLAY.md` au lot avec le bandeau § A verbatim, **plus** une `open_questions` nommant la n° 11. Aucune ligne de code, aucun test neuf, aucune modification de `REGLES-DU-JEU.md`.

> **REJETÉ (narratif-ia) — « réimplémenter les +5 PE sur `commande.aller` dans it4 ».** `EtatSession` n'a pas de `heros` avant la n° 11 (`session.ts:127/161`) : l'ouvrir ici violerait KR-249. On **nomme** le propriétaire, on ne code pas. *(Contrepoids du veto ci-dessus : il réclame des mots, jamais du code.)*

> **REJETÉ (narratif-ia) — « le plancher 20 de `moteurSansIA.test.ts` suffit ».** Base mesurée : **58** (23/9/26). Un plancher global de 20 tolère 65 % de perte et ne verrait pas disparaître une racine — `brain/dossier` **seul** (26) le dépasse déjà, donc le pouvoir séparateur sur `src/player` est **nul**. **CHIFFRES CORRIGÉS AU TOUR 2** : après it4 les racines valent **14 / 8 / 26 = 48**, et non 13/8/26 = 47 (QA) ni 14/8/15 = 37 (tech-lead, qui décompte `brain/dossier` alors qu'it4 n'y touche aucun fichier). Le total ne retombe **pas** sur 47 : la docstring devient fausse **d'une unité**, le seul écart qu'une relecture ne rattrape jamais. Re-dérivation par racine, `floor(mesure / 5) × 5` → **10 / 5 / 25**, mesure post-lot faisant foi.

> **REJETÉ (narratif-ia) — « nettoyer dans it4 les 39 littéraux de prose des moteurs survivants ».** 26 dans `capacityEffects.ts` + 13 dans `combatEngine.ts`, tenus par deux suites riches, sans consommateur d'ici la n° 13. **Consignation mesurée, pas de travail** — la décision « lignes **affichées** ou **ENTRÉE** du narrateur, jamais les deux » appartient à la n° 13.

## I. Décisions prises en autonomie faute de spécification

- **C6 : objection ou veto ?** → **veto**, le mode de panne gardé étant le **retour** de la règle en consigne de prompt → si simple objection, elle peut sortir en `REPORTÉ`, et un `REPORTÉ` sans déclencheur sur une règle du jeu ne se reprend jamais.
- **Domicile du bandeau** → **les deux, rôles distincts** : le `.md` pour le rédacteur de prompt de la n° 13, l'`open_questions` pour le comité de la n° 11 → si on n'en garde qu'un, celui qui manque est précisément le lecteur qui aurait réintroduit la règle par le mauvais canal.
- **Ne pas toucher `REGLES-DU-JEU.md`** → la règle n'a pas changé, seule son implémentation a disparu ; KR-130 impose `doc → code` → si on l'annotait, on ferait entrer un état d'implémentation dans la source de vérité des règles.
- **Plancher prédit ou re-mesuré ?** → **la formule au plan, 10/5/25 en contrôle croisé** → si on grave 10/5/25, tout changement de périmètre rend le plancher faux le jour même, et un plancher faux se « corrige » toujours vers le bas.
- **C8 : bloquer it4 dessus ?** → **non**, ce n'est ni mon domaine ni mon défaut ; je demande une phrase d'interdiction de citation → si je bloquais, je transformerais un défaut d'outillage en veto narratif hors domaine, et je perdrais le seul veto qui compte ici.
