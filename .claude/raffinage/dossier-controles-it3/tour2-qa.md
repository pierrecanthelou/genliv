# Tour 2 — `qa` (contre-lecture)

## 1. Contre-lecture — réponse nommée au `tech-lead` (son RISQUE de tour 1)

Il écrit : « La DONNÉE est lue ; la COULEUR des tests n'est PAS mesurée — aucun exécuteur à ce poste. »

**J'ai un exécuteur, je l'ai fait tourner.** `npx jest src/brain/dossier/controles.test.ts` → **15/15 verts** (état actuel, avant tout code d'it3). `npx jest .../panneauControles.test.tsx` → **3/3 verts**, confirmant sa position « 3 existants inchangés ».

**Mais la mesure ne confirme pas la ligne de base, elle en corrige le COMPTE.** Le tech-lead et l'orchestrateur écrivaient tous deux « QUATRE assertions » (l. 115, 143, 257, 265). Le test l. 109-131 en porte **trois** à lui seul :

- l. 115 `toEqual([])` — clone intact
- l. 121 `toHaveLength(1)` — après mutation d'UN champ ; `rouge.controles` est le rapport **ENTIER**, non filtré
- l. 129 `toEqual([])` — après restauration, MÊME dossier que l. 115

`indice.cendres-tiedes` produit une **alerte structurelle indépendante du champ muté**, présente aux **trois** instants. **Total réel : SIX assertions sur QUATRE tests** — 115, 121, 129, 143, 257, 265.

Les lignes 116, 125, 130 (`jouable`) **restent vraies**, parce que le compteur unifié rend `cendres-tiedes` **alerte** (1 producteur), jamais bloquant. **Argument de plus pour le compteur unifié** : sous lecture étroite, `cendres-tiedes` serait bloquante et 116/130 tomberaient aussi — **8 assertions, pas 6**.

l. 122-124 (`rouge.controles[0]`) : valide **à condition** que le registre place `amorce-non-redigee` **avant** les 4 entrées neuves (append, pas prepend). Dépendance d'implémentation **à écrire noir sur blanc**, pas une garantie structurelle.

**Conséquence pour la définition de fini** : le lot nomme ces 6 lignes et les réécrit en **comptes filtrés par règle** (`controle.id === 'amorce-non-redigee'`), jamais en compte global — sinon la prochaine règle qui parlera sur `dossier-minimal.json` recassera la même ligne de base une troisième fois.

**Le défaut de forme signalé par l'orchestrateur — CONFIRMÉ, sans réserve.** Ma formulation de tour 1 est fausse **par trou** : `cendres-tiedes` (0 savoir, 1 delta) n'est ni l'un ni l'autre au sens littéral de mes deux branches. Le compteur unifié ferme ce trou parce qu'il compte une **UNION de sources sur un total ordonné**, jamais deux prédicats disjoints sur des sous-ensembles différents. **Je retire ma formulation.**

## 2. Statut de mes objections et rejets du tour 1

- **OBJECTION (garde de vide manquante)** — **RETIRÉE (satisfaite).** B-2 converge sans opposition ; absorbée dans le critère 3.
- **OBJECTION (`dossier-reference.json` pris pour calme)** — **MAINTENUE, durcie en chiffre** : 1 bloquant + 4 alertes + 5 infos, **sans goulot**. Le chiffre change, l'interdiction reste entière.
- **REJET 1 (`dossier-reference.json` comme dossier calme)** — **MAINTENU.** Confirmé par deux mesures indépendantes ; aucune lecture ne le rend calme.
- **REJET 2 (« départ désert » sans garde)** — **MAINTENU**, désormais consensuel. Reste à écrire.
- **REJET 3 (path sur `savoirs[].indice_id`)** — **MAINTENU mais satisfait** : `monde.indices[].id` est le choix retenu par convergence à trois. Le principe reste vrai, il n'a plus d'alternative à rejeter.

## 3. B-7 — un clone muté DISCRIMINE, et il tient en UN SEUL champ

```ts
dossier.monde.indices = [
  { id: 'indice.A', mene_a: ['indice.B'] },   // aucun savoir, aucun delta
  { id: 'indice.B', mene_a: ['indice.A'] },   // aucun savoir, aucun delta
]
```

**À plat** : A est cité dans `B.mene_a` → 1 producteur → `alerte` ; idem B. → **2 alertes.**
**Saturation par point fixe** : ni A ni B n'a d'ancre réelle ; la clôture transitive ne confirme jamais aucun des deux → 0 producteur → **2 bloquants.**

> **Vérifié par l'orchestrateur** : la mutation porte bien sur **UN SEUL champ** (`monde.indices`), donc elle est **admissible** sous la discipline d'it1 — contrairement à ce que le tech-lead et l'orchestrateur avaient conclu, tous deux ayant supposé qu'il fallait *ajouter* une arête aux indices existants (4 mutations).

Le plan ne doit **PAS** écrire « ce choix est prouvé » sans le test : il doit écrire **quel niveau** le test attend, nommer l'implémentation retenue, et — si c'est la lecture à plat — consigner en `known_risk` que ce cycle reste **sous-détecté** jusqu'à la saturation d'it5.

## 4. Les 8 critères finaux

1. **Compteur unifié** — indice à 0 producteur → `bloquant` ; à exactement 1 → `alerte` ; à ≥2 → silence. Section `indices`, path `monde.indices[].id`. *(contrat)*
2. **Discrimination `mene_a`** — cycle `A↔B` sans autre source → le niveau de l'implémentation NOMMÉE, écrit en clair dans le test + `known_risk` si lecture à plat. *(contrat, corps neuf)*
3. **Départ désert + garde de vide** — lieu de départ sans présence ET au moins un personnage → `bloquant`, section `depart`, path `charpente.depart.lieu_id` ; zéro personnage (`construireAmorce()`) → aucun constat et `controlerDossier(seme()).controles` garde une longueur de **4**. *(contrat, étend le test existant)*
4. **Personnage sans présence** — un sans `presence[]`, un avec → `alerte` pour le premier seul. *(contrat)*
5. **Personnage sans voix** — un sans `caractere.parler`, un avec, curseurs tous à `CURSEUR_MIN` → `info` pour le premier seul ; aucun constat fondé sur une valeur de curseur (KR-221). *(contrat)*
6. **Couverture croisée + KR-219 ÉTENDU** — chaque constat rend un niveau ∈ `descripteur.niveaux`, un `path` clé de `DESTINATION_DES_CHAMPS` (`estCleDe`, balayé depuis `Object.keys(CONTROLES)`), **et** pour chacune des 4 entrées neuves `path.split('.')[0] !== section`. *(contrat)*
7. **`jouable` et étanchéité** — un bloquant → `jouable` faux ; `controles.ts` n'importe jamais `validateDossier` (grep source) ; aucun `Controle` ne porte `severity`. *(contrat + revue de source)*
8. **Ligne de base réécrite nommément** — les SIX assertions (l. 115, 121, 129, 143, 257, 265) réécrites en comptes **FILTRÉS par règle**, jamais globaux ; `controles.test.ts` + `panneauControles.test.tsx` verts après réécriture. `pastilles.test.ts` lu et **confirmé indépendant** (il balaie par niveau émis, pas par compte). *(porte de commit + revue de source)*

**Aucun critère de niveau composant** — confirmé, aucune surface neuve.

## 5. KR-219 et KR-224

**KR-219 — je RETIRE ma position de tour 1.** Elle reposait sur une affirmation **fausse** : j'avais écrit qu'« aucun des cinq nouveaux cas n'a de path dont le premier segment diffère de sa section ». Vérifié sur les 4 chemins tranchés : `monde.indices[].id`/`indices`, `charpente.depart.lieu_id`/`depart`, `monde.personnages[].presence[].lieu_id`/`personnages`, `monde.personnages[].caractere.parler[]`/`personnages` — **dans les 4 cas le premier segment diffère**. Un test est donc possible et **je l'exige** (critère 6). Sans lui, KR-219 resterait gardé par le seul cas historique de l'amorce.

**KR-224 — MAINTENUE telle quelle** : toujours aucun test possible, aucun graphe de lieux à interroger. Ce n'est pas un défaut de l'itération, c'est le renoncement acté. Ce qui doit être écrit pour que personne ne le croie couvert : un `known_risk` explicite, **et** — si B-3 retient « bloquant avec prémisse » — cette prémisse doit apparaître **mot pour mot dans le message français**, pas seulement dans une note de commit : c'est le seul endroit où un futur lecteur du code la retrouvera.

## Commandes exécutées

`npx jest src/brain/dossier/controles.test.ts` → **15/15 vert** · `npx jest src/features/dossier-controles/tests/panneauControles.test.tsx` → **3/3 vert**.
