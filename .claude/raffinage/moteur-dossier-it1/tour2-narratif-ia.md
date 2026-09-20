# Tour 2 — Narratif & IA — `moteur-dossier` it1

**C-3 — `VETO`**, sur les deux lignes : `'journal[].texte': 'ia'` et `memoire: 'ia'`.
*Domaine* — le journal croît d'une entrée par tour : une ligne `ia` sans borne **est** « contexte sans borne » ; `memoire: 'ia'` autorise l'injection d'une mémoire dont la forme est refusée à it1 — « mémoire de session non spécifiée ». Mes deux clauses de veto, mot pour mot.
*Coût adverse, mesuré sur `destinations.ts`* — ses lignes se corrigent en **commentaire**, jamais en **valeur** (KR-195/196, trois corrections datées, zéro valeur changée). La permission serait donc acquise pour toujours, signée par l'itération qui n'a ni assembleur, ni granularité par rôle, ni borne, ni comportement d'échec.
*Levée, immédiate* — les deux à `moteur` ; la prévision descend en commentaire ; plus l'assertion « zéro ligne `ia` », que la n°10 devra supprimer d'un geste visible en diff.

**Objection du tour 1 (collision d'inventaire) — `MAINTENUE`, allégée.** J'adopte son nom, `inventaire` : `predicates.ts:49` écrit littéralement « l'inventaire de session ». Je ne maintiens plus qu'une clause d'une phrase, pas un champ.

**C-4(c) — tech-lead, tu as raison, je retire `[]`.** C'est un **état incohérent**, pas une décision en attente : (ii) est tranchée (arbitrage n°10). Renfort : l'ouverture **décrit** le lieu de départ, verbatim ; `lieux_visites: []` ferait re-décrire ce lieu comme une découverte au passage suivant — la fiction se contredit d'un tour à l'autre.

**C-2 — (β), et ton argument structurel est le mien.** « it2 n'a pas de lot `contrat` » tue **(γ)**, pas (β). On diverge sur **ce qui** bouge. M1 tranche : la cellule oblige à toucher `VALEUR_ATTENDUE:106` et `INDECIS` — ce que le critère 3 interdit — et tes relevés 1–2 montrent qu'elle n'achète **aucun** comportement observable. Donc `lieu_visite` **et** `indice_connu` amendées **ensemble** dans le lot `contrat` d'it3 ; l'ORACLE en it1 rend it3 incapable de l'oublier. Le critère 3 n'est pas vide : il est **mal adressé** — il devient le critère de l'oracle.

**C-7 — bonne frontière, pas une règle dupliquée. C-11 — satisfait, une réserve.**

**VERDICT — recevable sous réserve.** Veto C-3 levable par deux valeurs.

---

# ANNEXE — uniquement ce qui CHANGE

## 1. Ce que je concède au tech-lead

| # | Ma position tour 1 | Retirée au profit de | Motif |
|---|---|---|---|
| C-4(a) | `objets_possedes` | **`inventaire`** (sa forme) | `predicates.ts:49` nomme le champ « l'**inventaire** de session » |
| C-4(b) | `horloge.climat_actif: null` et `pnj.<id>.confiance: null` réservés | **non déclarés** | Ma propre règle KR-249 ne réserve que les **clés racines** ; ni l'une ni l'autre n'en est une. KR-251 rend l'ajout futur optionnel à vie : la réservation n'achète **rien** qu'un commentaire ne donne. Un `confiance: null` devrait en outre s'écrire sur **chaque** entrée `pnj`, à jamais. Je demande seulement la **ligne de commentaire nommant le propriétaire** |
| C-4(c) | `lieux_visites: []` | **`[charpente.depart.lieu_id]`** | ci-dessus |
| C-2 | ORACLE seul, cellules intouchées pour toujours | ORACLE en it1, **les deux cellules ensemble en it3** | M1 + ses relevés 1–2 |

`memoire: null` reste réservée — elle **est** une clé racine, et c'est l'extension la plus dangereuse du lot.

## 2. Table d'audience de session — deux défauts structurels de `C.2`

**Défaut 1 — huit lignes de feuille manquent, trois lignes sont mortes.** Le balayage est **pleine profondeur** et `feuillesDeLaFixture` ne rend **jamais un objet non vide comme feuille**. Sur `session-saturee`, `horloge`, `monde` et `journal` sont des objets non vides : ils ne sont **pas** des feuilles. Donc, en l'état de `C.2` : l'assertion « aucune ligne morte » rougit sur ces **trois** lignes, et le balayage échoue par nom de champ sur **huit** feuilles sans ligne (`horloge.tour` + les sept de `monde`).

**Défaut 2 — `monde.pnj` est un `Record` à clé dynamique, forme que le dossier n'a jamais eue.** Le walker de `feuilles.ts` efface les **indices de tableau**, pas les **clés de Record** : réutilisé tel quel, il rend `monde.pnj.pnj-aldur.a_dit[]`. L'adapter fait rougir `couverture.test.ts:515`. **Résolution : ne pas toucher `feuilles.ts`** ; normaliser `<id>` **après** le retour du walker, dans le balayage de session seul.

**La table que je signe** — valeurs : **zéro `ia`** :

```ts
type CheminDeFeuilleDeSession =
	| 'horloge.tour'
	| 'monde.lieu_courant'
	| 'monde.lieux_visites[]'
	| 'monde.inventaire[]'
	| 'monde.indices_connus[]'
	| 'monde.jalons_atteints[]'
	| 'monde.evenements_consommes[]'
	| 'monde.pnj.<id>.a_dit[]'
	| 'journal[].tour'
	| 'journal[].role'
	| 'journal[].texte'
```

| chemin | `Destination` | ce qui change / motif |
|---|---|---|
| `schema`, `dossier_id`, `graine_alea` | `moteur` | inchangé (racines **et** feuilles) |
| `horloge`, `monde`, `journal` | `moteur` | **dispensées** de « ligne morte » : existent pour l'exhaustivité par compilation |
| `horloge.tour` | `moteur` | **AJOUTÉE** — précédents `plan_actions[].duree`, `climat[].duree` |
| `monde.lieu_courant` … `monde.pnj.<id>.a_dit[]` | `moteur` | **AJOUTÉES** — handles. `indices_connus[]` est **la porte** de `indices[].verite` ; `jalons_atteints[]` celle de `jalons[].enonce_texte` |
| `journal[].tour`, `journal[].role` | `moteur` | inchangé |
| **`journal[].texte`** | **`moteur`** | **CHANGÉE — veto.** `// n° 10 la bascule à 'ia' DANS le lot qui livre l'assembleur ET la borne de résumé.` |
| **`memoire`** | **`moteur`** | **CHANGÉE — veto.** `// typée null : un null ne s'injecte pas. n° 10 REMPLACE cette ligne racine par des lignes de FEUILLE.` |

**Assertion supplémentaire** : `Object.values(DESTINATION_DES_CHAMPS_DE_SESSION).every((d) => d !== 'ia')`, commentée *« La n° 10 supprime cette ligne dans le lot qui livre son assembleur — pas avant, pas séparément. »* Moitié **données** de ce que `moteurSansIA.test.ts` fait côté **code**.

## 3. `EtatMonde` — la forme finale que je signe

Un seul écart avec `C.1` : `EtatPnj` **nommé** (domicile du commentaire de propriétaire, référent du chemin d'audience).

**Valeurs à l'ouverture** : `lieu_courant = charpente.depart.lieu_id` · `lieux_visites = [charpente.depart.lieu_id]` · les quatre autres listes `[]` · **`pnj = {}`**.

Trois clauses de docstring :
1. **`pnj = {}`, jamais une entrée par `monde.personnages[]`** — pré-semer serait une copie dérivée (KR-013). `pnj_a_revele(p,i)` se lit `pnj[p]?.a_dit.includes(i) ?? false` : clé absente = état légal.
2. **`lieu_courant: string`, jamais `string | null`** — un nullable serait une seconde représentation de « partie non ouverte ».
3. **La clause d'inventaire** : *« le champ d'inventaire d'`EtatMonde` est le SEUL inventaire de session. `SessionEquipmentState.inventory` (`src/player/types.ts:24`) est l'inventaire de la session d'ARBRE, orphelin en it4 : l'itération qui compose un héros (n°11) se repointe ici. »* Mesuré : `predicates.ts:49` désigne aujourd'hui `filterChoicesByPrereq`, c'est-à-dire l'**ancien** inventaire ; sans la phrase, le premier lecteur suivra le mauvais champ.

**Cohérence avec `VALEUR_AU_TOUR_ZERO`** : `lieu_visite` reste `indecidable` alors que l'état dit « visité » — la cellule est **imprécise, pas fausse** ; la direction interdite reste fermée, et le seul consommateur est une `alerte` qui sous-tire. L'ORACLE d'it1 est donc **vert**, et rouge en it3 sur `indice_connu`.

## 4. C-7 — la frontière est bonne

**Le test qui décide est mon invariant** : `src/player/` est **extrait et livré sans l'éditeur**. Dans ce build il n'existe ni `controlerDossier`, ni CTA, ni porte de shell. Si `ouvrirSession` ne refuse pas, la surface extraite émet `⟨à écrire⟩` **verbatim à un vrai joueur**, sur l'un des deux seuls champs émis mot pour mot. La porte de l'éditeur est **ergonomique** ; le refus du moteur est une **correction**. Deux audiences, deux conséquences, **une donnée** (`MARQUEUR_A_ECRIRE` importé). Précédent maison : trois modules pour trois questions sur `ExprNode`.

**Les deux conditions qui l'empêchent de DEVENIR une duplication**, à écrire dans `ouvrirSession` :
1. **Le refus du moteur est plus GROSSIER que le contrôle, jamais plus fin.** Il teste **un** champ et **ne réimplémente ni `PROSES_AMORCE`, ni ses quatre proses, ni la classification `bloquant`/`alerte`**.
2. `RefusOuverture` reste un registre **clos** ; tout second membre nomme la donnée qu'il lit.

**Résidu réel de l'objection du PM** : la branche est **inatteignable par l'écran** en it1. Son témoin doit donc appeler `ouvrirSession` **directement**, jamais à travers le shell.

## 5. C-11 — `graine_alea` : satisfait, une réserve

- **Source injectée** — satisfait, et mieux : le paramètre est **requis**, pas défaillant. Je retire la moitié « défaut nommé » de mon exigence.
- **Tirage une seule fois** — `useState(() => …)` : signé.
- **Réserve, la seule** : le **tirage** côté feature reste anonyme. C'est la **seule entropie de toute la feature**, et un `Math.random()` inline n'est nommé par rien et testable par rien. Demande : une fonction nommée (`tirerGraine()`) ou une prop à défaut nommé, pour que le test du shell la fixe. Précédent : le `rng` non semé de `combat.ts:107`.
- Rappel non contesté : `graine_alea` est **l'unique exemption nommée à KR-249**.
