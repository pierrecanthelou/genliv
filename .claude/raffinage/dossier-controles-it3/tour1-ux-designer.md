# Tour 1 — `ux-designer`

RISQUE — **Le volume.** « Goulot d'étranglement » et « personnage sans voix propre » sont statistiquement les plus fréquentes (tout indice à détenteur unique ; tout personnage sans réplique encore écrite), et `dossier-reference.json` porte déjà deux indices à détenteur unique (KR-217). Une liste plate, non triée, non groupée (« aucune vue ne trie ») risque de **noyer les BLOQUANTS sous des ALERTES/INFO nombreuses** sur un dossier réel — contraire au but « dit en continu ce qui empêche d'être jouable ».

OBJECTION — Le cadrage ne fixe **aucune borne ni aucune mesure de ce volume avant livraison**. « Aucune vue ne trie » est un acquis que je ne conteste pas, mais rien n'oblige à en mesurer la conséquence avant merge.

PROPOSITION — (1) Ajouter aux tests un **relevé** (pas une assertion de borne) du nombre de contrôles produits sur `dossier-reference.json`, recopié dans la revue, pour objectiver avant de trancher plus tard. (2) **Trancher enfin la tension n° 3** (clic de ligne → sélection de section, chiffrée à it1 : 0 fichier neuf, ~7 lignes, +2 tests) : c'est le seul levier de navigabilité déjà câblé qui compense l'absence de tri/groupement ; un troisième report sans contrepartie aggrave le risque ci-dessus.

VERDICT — **recevable sous réserve** : textes exacts en annexe ; mesure de volume à ajouter au lot ; position PM attendue sur la tension n° 3. Aucune surface neuve n'étant touchée, aucun risque de token ni de composant maison ici.

## ANNEXE

### 1. Textes français exacts des cinq règles

Convention : le `location` (OÙ) est produit par `localiserEntite(espace, entite, index)` — **jamais** une refonte ALL-CAPS façon `amorce-non-redigee` (celle-ci est structurelle, sans entité ; les cinq règles ici portent toutes sur une **entité réelle**). C'est la convention déjà en production dans `validate.ts` / `IssueList` (« Personnage « Aldûr le Sage » »), pas une invention. Repli sans nom : `{Type} n°{index} (sans nom)`.

**Règle 1 — indice orphelin · BLOQUANT · section `indices`**
- OÙ : `localiserEntite('indice', indice, index)` — ex. `Indice « Lettre de la vigie »`
- QUOI : « Cet indice n'est détenu par aucun personnage et n'est révélé par aucun effet du dossier : rien ne peut jamais le faire parvenir au joueur. »
- QUOI FAIRE : « Faites-le détenir par un personnage (Personnages → Savoirs) ou révéler par un effet « révèle l'indice ». »

**Règle 2 — goulot d'étranglement · ALERTE · section `indices`**
- OÙ : `localiserEntite('indice', indice, index)`
- QUOI : « Cet indice n'est détenu que par un seul personnage, et par aucun autre moyen : si cette piste manque le joueur, l'indice devient inaccessible. »
- QUOI FAIRE : « Donnez-lui un second moyen d'être obtenu — un autre personnage (Personnages → Savoirs) ou un effet « révèle l'indice ». »

**Règle 3 — lieu de départ désert · BLOQUANT · section `lieux`**
- OÙ : `localiserEntite('lieu', lieuDepart, index)`
- QUOI : « Aucun personnage n'est présent à cet endroit, qui est pourtant le point de départ : le joueur y arrive seul, sans personne à qui parler. »
- QUOI FAIRE : « Placez au moins un personnage à cet endroit (Personnages → Présence). »

**Règle 4 — personnage sans présence · ALERTE · section `personnages`**
- OÙ : `localiserEntite('pnj', personnage, index)`
- QUOI : « Ce personnage n'a aucune présence dans le monde : le joueur ne pourra jamais le rencontrer. »
- QUOI FAIRE : « Ajoutez au moins une présence à ce personnage — le lieu, et si besoin le moment, où il se trouve (bloc Présence). »

**Règle 5 — personnage sans voix propre · INFO · section `personnages`**
- OÙ : `localiserEntite('pnj', personnage, index)`
- QUOI : « Ce personnage n'a aucune réplique de caractère : le modèle lui prêtera un ton générique, faute de voix propre. »
- QUOI FAIRE : « Ajoutez quelques répliques dans Caractère exploitable → Manière de parler. »

Vérifications de registre faites : aucune remédiation ne dit « réimportez » ; les cinq QUOI sont des phrases françaises rédigées ; les libellés de blocs cités (« Savoirs », « Présence », « Caractère exploitable », « Manière de parler ») sont **recopiés verbatim des composants réels** (`BlocSavoirs.tsx`, `BlocPresence.tsx`, `BlocCaractere.tsx`) et du libellé de `DELTAS.reveler_indice` (« révèle l'indice ») — **aucun terme interne** (Delta, refKinds, `Savoir.indice_id`) n'atteint la prose.

### 2. Volume

Je ne demande **ni tri ni groupement** à cette itération (désaccord frontal avec l'acquis « aucune vue ne trie », non chiffré). Je demande une **mesure** — relevé du nombre de contrôles sur `dossier-reference.json`, sans borne imposée — pour que le comité voie le chiffre avant de décider s'il faut agir plus tard.

### 3. État calme

Le texte actuel — « Aucun contrôle à signaler — le dossier passe tous les contrôles connus. » — **reste vrai** avec cinq règles de plus : il ne nomme aucun nombre de règles et le mot « connus » porte déjà la réserve. **Aucune modification requise.**

Point de vigilance (pas un veto, vérification de conception due au tech-lead) : chacune des cinq règles doit se taire **par construction** sur une collection vide — un `filter`/`map` sur `monde.indices` / `monde.personnages` rend `[]` sur un tableau vide sans code spécial. « Absent ≠ vide » doit continuer de tenir **mécaniquement, pas par une garde ajoutée à la main**.

### 4. REJETS nommés (→ § 8 du plan)

- **REJETÉ — grouper ou trier les lignes du panneau par section à cette itération.** Cela exigerait un tri, en contradiction frontale avec l'acquis « aucune vue ne trie », et aucun mécanisme de groupement n'est chiffré.
- **REJETÉ — plafonner le nombre de lignes affichées (« voir plus » / pagination).** Aucune borne n'est mesurée, et **masquer un contrôle BLOQUANT derrière un plafond contredirait le but même du linter**. Refusé avant même d'être chiffré.
- **REJETÉ — toute différenciation visuelle des cinq nouvelles règles au-delà du couple mot+teinte de `pastilles.ts`** (icône par cause, teinte supplémentaire). Le produit n'a que deux couleurs sémantiques et l'accent n'est jamais décoratif ; le mot seul distingue déjà les trois niveaux.
