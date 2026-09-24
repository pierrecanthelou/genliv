# Tour 2 — narratif-ia — moteur-dossier it2

**Lu** : `tour1-mesures-orchestrateur.md`, sa note de tour 1, `tour2-tech-lead.md`, `tour2-qa.md`, `tour2-ux-designer.md`, `tour2-pm-produit.md`. **Remesuré** : `docs/REGLES-PLAY.md § J1` verbatim, `types.ts:257-275` (docstring `DUREE_MIN`), `sessionDestinations.ts` (bloc journal), et les **5 sites** consommateurs de `SESSION_SATUREE` (un seul fichier).

```
RÉPONSE
QA (X-3) — raison sur l'entropie : je retire mon `rejouer()`. Mais le pliage ne sépare pas du
hasard, il sépare de l'ÉTAT CACHÉ. Deux fautives NOMMÉES qu'aucun instrument d'it2 ne voit :
(1) `horloge.tour` pris sur un compteur de module au lieu de `session.horloge.tour + 1` — `tsc`
et ESLint muets, et C3 ne rougirait que par ordre de tests (la coïncidence de BUG-113) ;
(2) le contournement runtime que tu as redescendu en grep : un `push` derrière `as EtatMonde`,
que `rg "as any"` manque. Une seule assertion, déjà listée dans `commandes.test.ts`, zéro C7 ;
BUG-087 : le lot ÉCRIT les deux mutants, sinon elle tombe.
Tech-lead — X-2 accepté, `import type` seul.

MES OBJECTIONS
1 (« journal rejoué ») — maintenue, RÉDUITE : on plie des `Commande`, jamais `session.journal`.
2 (unité du pas tranchée en silence) — maintenue, LEVÉE par § J1 dans L1.
Prop. 1 `rejouer()` — RETIRÉE (T-4). Prop. 2 — maintenue, en assertions de C1/C2. Prop. 3 et 4
— retenues. REJETÉ 1 (rendre `description`/`ambiance`/`dangers` à l'arrivée) — DURCI EN VETO :
l'écran est plus nu qu'au tour 1, c'est la tentation de l'ouvrier. REJETÉS 2 à 5 — maintenus.

POSITION
M-13 : (a)+(b) ; la phrase est en § A. 1 pas = 1 commande acceptée ; le champ garde son nom en
       DETTE DATÉE, jamais en levée de réserve.
MO-3 : (a) — L1 amende la fixture ; son seul consommateur ne lit que des chemins.
X-2  : `origine` sur l'entrée `moteur` SEULE ; sur `joueur` le verbe est déjà dans `texte` (KR-013).
X-5  : ne franchit pas ma ligne, sous trois bornes (§ E), dont l'arité `===` et jamais `>=`.
{saisie} en console : confirmé — transitoire, hors `EtatSession`, jamais injecté.
UX   : `↻`, `#{n}` nu, ligne ambiante : les trois me vont ; une conséquence non écrite en § B.

VERDICT — recevable sous réserve (§ J1 amendé dans L1 ; fixture amendée ; `origine` sur `moteur` seule).
```

**Aucun critère neuf. Le plafond de 6 tient** : toutes les bornes tiennent dans un `Alors` existant (C1, C2) ou dans une docstring.

---

# ANNEXE

## A. M-13 — la phrase exacte que `docs/REGLES-PLAY.md § J1` porte après it2

La **première** phrase de `§ J1` est conservée telle quelle. C'est la phrase `✍️` qui est remplacée, mot pour mot, par :

> **Tranché par la feature n° 9 `moteur-dossier`, itération 2 (2026-09-20) : un (1) pas d'horloge de session = une (1) commande de joueur ACCEPTÉE par le moteur.** Une commande refusée ne consomme aucun pas. Une commande acceptée dont l'état du monde ne bouge pas — déplacement auto-référent — en consomme un : c'est la DEMANDE qui compte, jamais l'effet. Une conséquence enchaînée par le moteur dans la même résolution (jalon franchi, événement consommé) n'ajoute **jamais** de pas, sans quoi `plan_actions[].duree` cesserait d'être prévisible pour l'auteur qui l'écrit. Le pas n'a **aucune durée de fiction** : il ne se convertit ni en heures ni en journées, et aucune date n'en est dérivée.
>
> **Le mot « tour » reste réservé au round de combat par `REGLES-DU-JEU.md` ; le pas de session se dit « pas ».** Les champs `EtatSession.horloge.tour` et `journal[].tour` portent ce mot par **dette de nommage gelée à l'itération 1** — `schema: 1` n'ayant aucun chemin de migration (KR-160/191), ils ne seront pas renommés. Ce n'est **pas** une levée de la réserve : aucun champ neuf, aucun libellé d'écran, aucune prose ne reprennent le mot — l'écran de partie affiche le numéro nu (`#7`).

Trois conséquences que le lot doit connaître :

1. **`types.ts:262-266` (docstring `DUREE_MIN`) reste VRAI verbatim et n'est PAS à modifier.** Il dit que le mot « tour » « ne doit pas servir à nommer ce pas » — le pas s'appelle « pas », le champ porte une dette. `types.ts` reste donc hors de L1, et la **Décision A n'est pas déclenchée**.
2. `§ J1` renvoyait « n° 14 pour son avancement » : l'avancement reste à la n° 14, **l'unité est close ici**.
3. `docs/REGLES-PLAY.md` est **déjà dans la liste L1** du tech-lead (1 fichier `.md`, zéro code).

## B. Forme finale d'une entrée de journal

| `tour` | `role` | `texte` | `origine` |
|---|---|---|---|
| N+1 | `joueur` | `> ALLER lieu.caverne-basse` | *absent* |
| N+1 | `moteur` | `lieu_courant : lieu.val-cendre → lieu.caverne-basse` | `'aller'` |

**Le test de discrimination (à recopier au plan)** : *la ligne contient-elle un seul mot que l'AUTEUR a tapé dans son dossier, ou un seul caractère que le JOUEUR a tapé au clavier ?* Oui → prose détournée, refus. Non → relevé d'état.

**Ce qui rend ce test MÉCANIQUE et non déclaratif — la règle de reconstruction, neuve :**

> **La ligne `joueur` est RECONSTRUITE, jamais un écho.** Le verbe vient de `COMMANDES[id].verbe`, la cible vient de l'identifiant **RÉSOLU** dans `monde.lieux`. **Pas un caractère de la saisie n'entre dans `texte`** — casse comprise. Un joueur qui tape `aller lieu.x` produit `> ALLER lieu.x`.

Corollaire : la tolérance de casse à la saisie est une question d'ergonomie, pas la mienne — quelle qu'elle soit, `texte` n'en dépend pas.

**Autres règles de forme :**

- **Les deux entrées portent le MÊME `tour`, et c'est la valeur NOUVELLE (N+1)** — un pas, une demande, un effet.
- **Conséquence à l'écran que personne n'a écrite** : `JournalRow` affichera **deux lignes `#7`**. C'est voulu — le numéro numérote **le PAS, pas la ligne**. Ni masquage, ni dédoublonnage, ni « #7a/#7b ». Le lot L2 va trouver ça surprenant : c'est écrit ici pour qu'il ne le « corrige » pas.
- **`journal[].tour >= 1` toujours** : la session d'ouverture est `{ tour: 0 }` avec un journal **vide** (arbitrage n° 27).
- `tour` et `role` ne sont **jamais** redits dans `texte` (KR-013).
- Le `>` **n'est pas le `role` déguisé** : c'est le séparateur (iv) du vocabulaire clos, et la ligne persistée doit rester lisible **sans** `JournalRow`. Invariant à écrire dans la docstring : `>` n'apparaît que sur `role: 'joueur'`.
- Auto-référence : `lieu_courant : lieu.val-cendre → lieu.val-cendre`, aucune parenthèse explicative.
- **Vocabulaire admis, liste fermée** : (i) verbes du registre clos, MAJUSCULES ; (ii) noms de champs d'`EtatMonde` en bas-de-casse ; (iii) identifiants `espace.slug` **provenant du dossier** ; (iv) séparateurs `>`, `:`, `→`. **Rien d'autre.** Jamais `lieux[].nom`.
- Espacement exact : `lieu_courant : x → y` (espace avant le `:`).

## C. X-2 — ce que vaut `origine`, entrée par entrée

> **`origine` marque l'entrée qui porte l'EFFET, jamais celle qui porte la DEMANDE.**

| Entrée | `origine` | Motif |
|---|---|---|
| `role: 'joueur'` (`> ALLER lieu.x`) | **ABSENT** | Son `texte` contient **déjà** le verbe du registre, en clair et en majuscules. Le stocker en plus est un champ dérivable stocké — **KR-013**. L'argument de non-dérivabilité du tech-lead ne vaut, par construction, **que pour la ligne `moteur`** |
| `role: 'moteur'` (`lieu_courant : x → y`) | **`'aller'`** | Aucun verbe dans le `texte` ; `origine` y est la **seule cause auditable** |
| **entrée d'ouverture** | **il n'y en a aucune** | Le journal démarre **vide**. **REJETÉ, neuf** : `charpente.depart.texte_ouverture_joueur` n'est **jamais** journalisé |
| **entrée de jalon (it3)** | **ABSENT** | Une conséquence enchaînée n'est pas une commande de joueur. `origine?: CommandeId` étant un registre **clos**, « absent » signifie exactement « non causé par une commande ». **it3 n'élargit ni `CommandeId` d'un membre `'jalon'`** (le registre est ce qu'un joueur peut **TAPER**) **ni `origine` en `string`** (T-16) |

**Invariant, une ligne, testable :** `journal.every(e => e.origine === undefined || e.role === 'moteur')`. Il s'assertionne DANS le `Alors` de C1 — **pas de C7**.

**Pré-emption it3** : si `origine` vit au niveau de l'ENTRÉE, il **sort** de la forme de KR-247 (`{ delta, cibles, origine, effet }` → `{ delta, cibles, effet }`).

## D. `sessionDestinations.ts` — la ligne neuve ET le commentaire amendé

```ts
	/**
	 * La CAUSE, clé du registre CLOS des commandes — jamais de la prose, jamais une
	 * chaîne libre (KR-247/248). `'moteur'` : c'est une clé de registre, pas de la
	 * fiction. La n° 10 n'en a pas besoin — elle raconte ce que le moteur lui
	 * DEMANDE de raconter, pas ce qu'il a fait.
	 */
	'journal[].origine': 'moteur',
```

**Commentaire de `journal[].texte` amendé — EN COMMENTAIRE, JAMAIS EN VALEUR (KR-195/196)** :

```ts
	/**
	 * `'moteur'`, ET IL LE RESTE. Prévision d'it1 AMENDÉE par it2 : ce champ ne
	 * basculera PAS à `'ia'`. Deux motifs mesurés :
	 * 1. il ne porte que des HANDLES (`> ALLER lieu.x`, `lieu_courant : x → y`), et
	 *    `destinations.ts:398-406` dit qu'un identifiant EST un handle — le code
	 *    résout, le modèle reçoit le CONTENU du lieu, jamais la clé ;
	 * 2. une table indexée par CHEMIN ne peut pas discriminer par VALEUR de `role` :
	 *    mélanger sous un même chemin les constats du moteur et la prose du modèle
	 *    rendrait la garde d'audience inapplicable POUR TOUJOURS.
	 * La n° 10 donnera à sa prose SON PROPRE CHEMIN (p. ex. `journal[].prose?`,
	 * optionnel à vie KR-251, avec sa propre ligne `'ia'`).
	 */
	'journal[].texte': 'moteur',
```

`sessionCouverture.test.ts` : la dispense « ses **trois** feuilles » → « **quatre** » (MO-4).

## E. X-5 — le `split` franchit-il ma ligne ? NON, sous trois bornes

Ma ligne n'a jamais été « aucun `split` » : c'est **aucune grammaire, aucun état, aucun canal de texte libre vers un état persisté ou vers le contexte d'un modèle**. `analyserSaisie` n'a ni grammaire, ni état, ni récursion, ni précédence, et sa sortie `ok: true` est une **clé de registre + des handles**. **Je confirme le loger dans `commandes.ts`, et je durcis sur trois points :**

1. **Arité `===`, jamais `>=`.** Exactement `1 + refKinds.length` jetons après `trim` + découpe sur l'espace ; au-delà → `arite_invalide`. **Avaler silencieusement une queue de jetons est précisément la façon dont un canal de texte libre s'ouvre.**
2. **`cibles` sur `ok: true` n'est PAS validé** (`analyserSaisie` ne consulte pas le dossier) : `ALLER <ordure>` rend `{ ok: true, cibles: ['<ordure>'] }`. Invariant à écrire dans la docstring, **parce qu'il cesse de tenir le jour où un refus serait journalisé** : *seule une cible RÉSOLUE contre `monde.lieux` entre au journal.* En it2 il tient automatiquement — c'est une garantie **de périmètre**, pas de nature.
3. **Règle de reconstruction** (§ B) : le `texte` ne recopie **aucun** caractère de la saisie.

**Observable, sans C7** : `ALLER <ordure>` laisse **`journal` ET `horloge.tour` inchangés** — une ligne de plus dans le `Alors` de **C2**.

**Je confirme le retournement du tech-lead contre l'UX** (T-14) : la console **soumet la chaîne brute et ne valide rien**. Depuis mon poste le motif est plus fort que KR-013 — deux décideurs, c'est deux **règles du jeu**, et une règle de jeu ne vit **qu'à un seul endroit**.

## F. MO-3 — la fixture : issue **(a)**

**Motif.** (b) est plaidable — la fixture sature des **chemins** — mais elle est **écrite à la main**, elle est le **seul exemplaire de ligne de journal du dépôt**, et **L1 la rouvre de toute façon**. Un ouvrier copie **la forme qu'il voit**, pas l'intention qu'il lit dans une docstring sur les chemins. (c) est refusé.

**Trois défauts dans la fixture actuelle, pas un seul :**
1. `role: 'moteur'` porte de la **prose** — MO-3 ;
2. `role: 'joueur'` porte `aller lieu.le-fanal`, **bas de casse, sans `>`** ;
3. **et celui que personne n'a vu** : les deux entrées sont à des `tour` **différents** (6 et 7) — la fixture modélise **une entrée par pas, rôles alternés**, l'inverse du modèle **demande + effet**. Laissée telle quelle, elle enseigne la mauvaise **arité**.

**Valeur exacte après amendement :**

```ts
	journal: [
		{ tour: 7, role: 'joueur', texte: '> ALLER lieu.val-cendre' },
		{ tour: 7, role: 'moteur', texte: 'lieu_courant : lieu.le-fanal → lieu.val-cendre', origine: 'aller' },
	],
```

**Pourquoi ce sens de déplacement (retour vers `val-cendre`)** : la fixture porte déjà `lieu_courant: 'lieu.val-cendre'` et `lieux_visites: ['lieu.val-cendre', 'lieu.le-fanal']`. Un déplacement `val-cendre → le-fanal` **contredirait** `lieu_courant`. Le retour est cohérent avec les **trois** champs, avec `horloge: { tour: 7 }`, et **il montre une re-visite qui n'ajoute aucun doublon à `lieux_visites`**. **Aucun autre champ ne bouge.**

**Couleur des tests — mesuré** : `sessionCouverture.test.ts` est le **seul** consommateur (`:1`, `:66`, `:73`, `:109`, `:121`) et il ne lit que des **clés et des chemins**, **jamais une valeur de `texte`**. Changer les deux chaînes **ne fait rougir aucune assertion** ; ajouter `origine` **instancie** la ligne neuve et garde `:85-92` vert.

**Docstring** : amender « *DEUX ENTRÉES DE JOURNAL, une par membre de `RoleJournal`* » → « *…, et **un seul PAS** : les deux portent `tour: 7` — une demande et son effet.* » et ajouter « *Les deux `texte` sont des **RELEVÉS D'ÉTAT**… Cette fixture est le seul exemplaire de ligne de journal du dépôt : elle est donc **le modèle**.* »

## G. Modèle de déplacement — ce qui change, ce qui ne change pas

**Inchangé** : autorité en DONNÉE (`destinations.ts:404-406`) ; résolution = `cible ∈ (lieu_courant.acces ?? [])` **ET** `cible ∈ ids(monde.lieux)` ; **impasse** = état **CALME**, refus console, zéro entrée, `horloge.tour` inchangé ; **référence pendante** = refus **qui la NOMME** (KR-021), branche totale, sans `as`, sans lever ; **doublon** = sans effet, **aucun dédoublonnage en it2** ; **auto-référence LÉGALE** donc **acceptée**, `horloge.tour` +1, deux entrées, `lieu_courant`/`lieux_visites` inchangés.

**Amendé** : les deux entrées portent `tour = N+1` ; `lieux_visites` gagne la cible **si absente**, dans le **même geste** que `lieu_courant`.

**Je soutiens T-15** : la ligne ambiante « Accès disponibles » et `destinationsPossibles` rendent les accès **tels quels**, **non filtrés des pendantes**. Et ils rendent des **identifiants**, jamais `lieux[].nom`.

## H. Mémoire de session, bornes

- La session est un **ÉTAT D'APPAREIL** — tranché, et le motif substitué du tech-lead va dans le même sens.
- **Borne de persistance (D-38)** : se mesure sur la ligne réelle du § B, s'exprime en « nombre de **pas** avant N kio », et la revue écrit qu'elle **ne dit rien** de la borne d'injection.
- **Troncature** : la promesse de rejeu survit **uniquement** parce que le rejeu ne lit pas le journal.
- `memoire` reste typée `null` en it2.

## I. Tous les REJETÉS (BUG-082)

| # | Rejeté | Statut |
|---|---|---|
| N-1 | Rendre `lieux[].description` / `ambiance` / `dangers` à l'arrivée | **DURCI EN VETO** — trois champs `'ia'` : injectés, jamais récités. L'écran est **plus nu** qu'au tour 1 : tentation la plus probable de l'ouvrier |
| N-2 | Journaliser la saisie brute **ou** le message de refus | MAINTENU — convergence tri-rôle |
| N-3 | Rejouer en **relisant `session.journal`** | MAINTENU — durcit l'arbitrage n° 20 |
| N-4 | Basculer `journal[].texte` en `'ia'` **en bloc** en n° 10 | MAINTENU — it2 amende le **commentaire**, jamais la valeur |
| N-5 | Un champ `lieu_precedent` / `destinations` / `acces_courants` en session | MAINTENU — dérivables (KR-013) |
| N-6 | `rejouer(...)` **de production** *(sa propre proposition 1)* | **RETIRÉ par lui** — accord avec T-4 |
| N-7 ✦ | `origine` sur **les deux** entrées d'un déplacement | NOUVEAU — le verbe est déjà dans le `texte` de l'entrée `joueur` : KR-013 |
| N-8 ✦ | Journaliser `charpente.depart.texte_ouverture_joueur` | NOUVEAU — prose verbatim d'auteur dans le champ que la n° 10 lorgne |
| N-9 ✦ | Élargir `CommandeId` d'un membre `'jalon'` (ou `origine?: string`) en it3 | NOUVEAU — renforce T-16 |
| N-10 ✦ | Laisser la prose de `session-saturee.ts` | NOUVEAU — c'est le modèle que la suite recopiera |
| N-11 ✦ | Écho du jeton saisi dans `texte` (casse comprise) | NOUVEAU |
| N-12 ✦ | Avaler silencieusement les jetons en trop (`>=` au lieu de `===`) | NOUVEAU — ouverture d'un canal de texte libre |
| N-13 ✦ | Masquer les pendantes dans la ligne « Accès disponibles » | NOUVEAU — soutien à T-15 |

## J. X-3 — les deux implémentations fautives NOMMÉES, et la condition BUG-087

**Assertion** : plier la **même séquence de `Commande`** deux fois depuis le même `S0`, dans le même processus → `toEqual`.

| Mutant à ÉCRIRE | Pourquoi rien d'autre ne le voit | Attendu |
|---|---|---|
| **M1 — compteur de module** : `let n = 0` dans `commandes.ts`, `tour: ++n` au lieu de `session.horloge.tour + 1` | `tsc` muet ; ESLint muet ; `exhaustive-deps` hors sujet (pas un hook) ; **C3 ne rougit que par ordre de tests** — au premier appel, `+1` est satisfait. Coïncidence de BUG-113 : le critère épingle le **CALCUL**, jamais **LA SOURCE** | pliage **ROUGE** |
| **M2 — évasion runtime** : `(session.monde.lieux_visites as string[]).push(cible)` puis retour de la même référence | `tsc` muet ; **le grep `as any` de la QA le manque** (`as string[]` ne contient pas `any`) ; le second pliage part d'un `S0` **pollué** | pliage **ROUGE** |

**Condition, non négociable (BUG-087)** : le lot **écrit** M1 et M2, constate le rouge, révoque. **Si le pliage reste vert sur l'un des deux, l'assertion tombe** et la revue écrit qu'aucun instrument d'it2 ne couvre ce mode de panne.

**Réponse à la QA** : son relevé sur `exhaustive-deps` est juste et clôt la **stale closure**. Mais M1 et M2 ne sont ni de l'entropie ni une closure : ce sont de **l'état caché** et une **évasion de type**. Son critère d'immutabilité retiré vers un grep revient donc **gratuitement**, dans la même assertion, et au **runtime**.

## K. Confirmations à l'UX

- **`↻ MOTEUR`** : confirmé — le `→` du badge collisionnait avec le `→` de transition.
- **`#{n}` nu** : confirmé. Réserve d'usage : **le numéro se répète sur les deux lignes d'un même pas** — c'est la forme, pas un défaut.
- **`<datalist>` retiré au profit de « Accès disponibles : {ids}. »** : confirmé et **préféré** — c'est de la donnée du moteur, pas un menu proposé par un modèle ; identifiants, jamais `lieux[].nom` ; ni filtrée ni dédoublonnée à la source.
- **`{saisie}` affiché dans le refus** : confirmé, **transitoire**. Il vit dans `refus: string | null`, état de composant React — jamais dans `EtatSession`, donc **aucune ligne d'audience**. Rendu en JSX, donc échappé. **Borne** : `commandes.ts` peut interpoler `saisie` dans le `message` d'un résultat `{ ok: false }` **et nulle part ailleurs** — jamais dans une `Commande`, jamais dans une `EntreeJournal`.
