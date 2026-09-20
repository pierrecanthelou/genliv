# Tour 1 — narratif-ia — `dossier-canon` it5 (tranche B1, `lieux[].acces`)

**RISQUE** — B1 livre une topologie que le narrateur ne peut ni lire ni nommer. Si `acces` est une liste d'identifiants `moteur`, les accès deviennent la collection du schéma à **zéro champ injectable** — et la seule dont le joueur se sert à **chaque tour**. Au tour 40, le narrateur décrit une salle sans savoir par où l'on sort : il invente une porte (aucun état ne le contredit, la fiction dérive sans rattrapage) ou n'en cite aucune (l'aventure devient un couloir). La n° 10 hérite du trou avec trois portes déjà fermées : `nom` = `auteur` (KR-195), la `description` de la cible = spoiler d'une pièce non entrée, l'`id` = handle.

**OBJECTION** — la question m'est posée sur `monde.lieux[].acces[]` **comme si c'était une feuille**. Elle ne peut pas l'être : `feuillesDeLaFixture` ne rend jamais un objet non vide, et l'arête orientée déjà tranchée impose un objet (`vers_lieu_id` au minimum). Une ligne `'monde.lieux[].acces[]'` serait donc **morte le jour où elle est écrite** et `couverture.test.ts` la ferait rougir. L'audience ne se tranche pas avant la **forme de l'entrée** : le cadrage inverse l'ordre.

> **MESURE DE L'ORCHESTRATEUR (2026-09-19) — la prémisse de cette objection est FAUSSE.** `monde.indices[].mene_a[]` est une **arête orientée** (l'indice A mène à B, jamais l'inverse) et c'est un `string[]` (`types.ts:1142`), avec une ligne de destination **vivante** (`destinations.ts:448`) et **aucune dispense** au balayage (`couverture.test.ts:348` : « `mene_a[]` n'a PAS de dispense, et c'est le point de contrat qui se voit le mieux »). **L'orientation n'impose donc aucun objet**, et une ligne sur un chemin d'élément `string[]` n'est pas morte. Ce qui SURVIT de la note : la question de fond — un accès a-t-il besoin d'une prose injectable ? — qui est le vrai sujet et relève bien de ce poste.

**PROPOSITION** — deux feuilles, deux audiences (coût : un champ optionnel + une zone de saisie par arête) : `vers_lieu_id` → `moteur` ; `description` → `ia` sans condition, précédent exact `Climat.manifestation`. Fixture : **3 entrées** sur les 5 lieux existants (un aller simple + une paire réciproque), sinon les lignes sont mortes.

**VERDICT** — **recevable sous réserve** : la ligne `ia` entre dans le **même lot contrat** que `vers_lieu_id`. Un lot qui ne poserait que l'identifiant est un **veto**.

---

## ANNEXE

### A. Les deux lignes de `destinations.ts`

```
// LA CIBLE — `moteur`. Un identifiant est un HANDLE : le code résout, le modèle
// reçoit le CONTENU sous l'audience de ce qu'il désigne, jamais la clé (même
// règle que `charpente.depart.lieu_id`, `presence[].lieu_id`, `mene_a[]`).
// Injectée, la liste des cibles donnerait au narrateur la CARTE : il narrerait
// un raccourci vers un lieu à deux sauts, ou nommerait une destination que le
// joueur n'a aucun moyen de connaître. C'est aussi la seule AUTORITÉ sur le
// déplacement : le moteur refuse toute destination absente de cette liste — la
// règle vit ICI, jamais en consigne de prompt.
'monde.lieux[].acces[].vers_lieu_id': 'moteur',
// CE QUE LE PASSAGE DONNE À VOIR DEPUIS CE LIEU-CI — `ia` sans condition, et la
// question s'est posée contre `auteur` : sans elle, `acces[]` serait la seule
// collection du schéma à ZÉRO champ injectable alors qu'elle sert à CHAQUE tour
// (précédent mot pour mot : `climat[].manifestation`). Les trois portes de
// rechange sont fermées — `nom` est `auteur` (KR-195), la `description` de la
// CIBLE est le spoiler d'une pièce non entrée, `vers_lieu_id` est un handle.
// Ce n'est PAS la description de la cible : c'est l'issue vue d'ici — « un
// escalier étroit derrière la tapisserie », « la route du nord qui monte ».
// Injectée, jamais émise verbatim.
'monde.lieux[].acces[].description': 'ia',
```

### B. Contrat d'INJECTION — aux **deux** sites (`destinations.ts` + JSDoc), nulle part ailleurs

- **Entrée injectée** : les accès du **lieu courant SEUL**, jamais le graphe, jamais les arêtes **entrantes** (« qui mène ici » est la forme de la carte, donc du spoiler). Borne = **O(degré du lieu courant)**, jamais O(|lieux|) — c'est un chemin de prose de plus au balayage de budget de la n° 10, et **le seul dont la longueur est multipliée par un degré**.
- **Champ injecté** : `description` **seule**. `vers_lieu_id` n'entre **jamais**.
- **Arête réflexive** : tolérée au SSOT sans garde neuve (KR-194) — mais **écartée à l'injection**, sinon le narrateur propose d'aller là où l'on est.
- **Repli** : un accès sans `description` est **omis** de la liste — jamais remplacé par le `nom` de la cible, jamais paraphrasé. Le repli est le **silence**. Conséquence à nommer comme dette à déclencheur : un accès sans description n'est **pas empruntable en langage libre** ; la règle qui l'avertira part avec la levée de KR-224. Le champ ne peut pas être requis (tout champ de `schema: 1` est optionnel à vie).

### C. Contrat de SORTIE hérité — rien n'en est construit ici (aucun appel modèle)

| | |
|---|---|
| **Rôle** | R1 interprète (n° 10), puis R3 narrateur |
| **Entrée** | la liste **numérotée** des accès du lieu courant, une ligne = une `description`, ordre du document |
| **Sortie** | `{ action: 'deplacement', sortie_rang: number }` — un **RANG**, jamais un identifiant (KR-231) |
| **Table rang → `vers_lieu_id`** | **rendue par l'assembleur** et conservée avec le tour, jamais re-dérivée |
| **Échec** | rejeu une fois, puis **repli déterministe** : aucun déplacement, refus émis par le code. Jamais de repêchage heuristique |
| **Invariant** | le moteur n'accepte **aucune** destination absente d'`acces[]` du lieu courant, **même si la prose l'a racontée** |
| **Non-duplication** | le prompt ne contient jamais « le joueur ne peut aller que dans un lieu adjacent ». Il reçoit une **liste fermée** : la règle en donnée, pas en consigne |

### D. À garder hors de la tranche

`acces[].condition_expr` (**ce serait** une 7e famille D1), `acces[].cache`, un delta `deplacer_vers`, et toute injection des arêtes entrantes.

### Note de lecture

Le plan de cible écrit `"acces": [lieu_ids]` (l. 224 du `.dc.html`) — liste de chaînes nues. Il est **antérieur** à la décision d'arête orientée et ne peut pas servir d'argument de forme.
