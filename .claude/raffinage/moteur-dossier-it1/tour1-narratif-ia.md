# Tour 1 — Narratif & IA — `moteur-dossier` it1

**RISQUE** — KR-241 motive la table d'audience de session par « `journal[].texte`, `memoire.*` et `attente.payload` **iront** au modèle ». Prise au pied de la lettre, it1 écrira `'journal[].texte': 'ia'` pour un canal qui n'a ni injecteur, ni assembleur, ni borne. Une ligne `ia` est une **autorisation**, et les lignes d'audience ne se rejouent jamais (KR-195/196) : la n°10 la trouverait **signée d'avance** — par le seul rôle dont le travail était de la refuser.

**OBJECTION** — « `EtatMonde`, 7 champs, **un par prédicat** » fabrique `monde.objets_possedes` alors que `predicates.ts:49` nomme déjà le champ qui répond à `possede_objet` : « l'inventaire de session — **déjà lu** par `sessionEngine.filterChoicesByPrereq` », c'est-à-dire `SessionEquipmentState.inventory` (`src/player/types.ts:24`) — la moitié de `src/player/types.ts` qui **survit**. Vérifié et écarté : `currentNodeId` / `visitedNodes` (`:54`, `:56`) sont dans `SessionState`, moitié arbre, éteinte en it4 — ce sont des remplacements, pas des doublons. Reste **une** collision réelle, non nommée au cadrage, figée par un lot `contrat`, et invisible jusqu'au lot qui composera un héros : 7ᵉ occurrence de KR-013.

**PROPOSITION** — (1) it1 **nomme le survivant** : `monde.objets_possedes` est la seule source d'inventaire, `SessionEquipmentState.inventory` meurt avec le lot qui compose `heros` (propriétaire nommé au plan), test-grep de lecteur unique. (2) **Zéro ligne `ia`** dans la table d'audience d'it1, **assertée** ; la n°10 doit **supprimer cette assertion** dans le lot qui livre son assembleur — la traversée de frontière devient un geste visible en diff, moitié *données* de ce que KR-250 fait côté *code*.

**VERDICT** — **recevable sous réserve**. (1) et (2) au plan. La réserve (2) devient veto au tour 2 si la table d'it1 porte une ligne `ia` sans injecteur nommé.

---

# ANNEXE

## 0. Le contrat de sortie IA d'it1

| | it1 |
|---|---|
| **Entrée injectée** | **∅** — aucun assembleur, aucun champ de dossier ni de session n'entre dans un contexte de modèle |
| **Schéma de sortie** | **∅** — aucun appel |
| **Comportement en cas d'échec de validation** | **sans objet** |

« ∅ » n'est pas auto-évident : il se tient par **deux** gardes, pas une.
- **Côté code** : `moteurSansIA.test.ts` (KR-250) — zéro `fetch`, zéro `CopiloteService`, zéro URL `/ia/`, liste dérivée du disque, pouvoir séparateur prouvé dans le lot qui le livre.
- **Côté données** : **zéro ligne `ia`** dans `DESTINATION_DES_CHAMPS_DE_SESSION`. Un grep ne voit pas une autorisation d'audience ; une autorisation d'audience ne voit pas un `fetch`. Les deux ensemble rendent « aucune ligne générée par un modèle » **constatable** au lieu de déclaratif.

Le **premier** contrat de sortie réel appartient à la n°10. it1 ne doit **rien** en pré-signer : ni une ligne `ia`, ni une borne d'injection, ni une forme de `memoire`, ni une variante d'`attente`.

## 1. Table d'audience de session — it1, ligne par ligne

`src/brain/dossier/sessionDestinations.ts`, `Destination` **réutilisé** depuis `destinations.ts`.

**Clés racines** — `Record<keyof EtatSession, Destination>`, exhaustif **par compilation** (7 lignes, arbitrage n°7) :

| clé racine | `Destination` | motif |
|---|---|---|
| `schema` | `moteur` | garde de version — précédent exact `schema` du dossier |
| `dossier_id` | `moteur` | un identifiant est un **handle** : le code résout, le modèle reçoit le contenu |
| `graine_alea` | `moteur` | l'entropie de la partie. Injectée, le modèle connaîtrait l'issue d'un jet **avant** le moteur : la ligne la plus proche du veto « l'IA ne lance jamais les dés » |
| `horloge` | `moteur` | précédents `plan_actions[].duree`, `contre_mesures[].delai`, `climat[].duree`, tous `moteur` |
| `monde` | `moteur` | 6 appartenances + 1 égalité, toutes sur des identifiants |
| `journal` | `moteur` | voir `journal[].texte` ci-dessous |
| `memoire` | `moteur` | typée `null` en it1 : **un `null` ne s'injecte pas**. La n°10, propriétaire, **remplace cette ligne racine par des lignes de feuille** dans le lot qui livre l'assembleur |

**Feuilles textuelles et terminales** — balayage pleine profondeur, échec **par nom de champ** (modèle `couverture.test.ts`) :

| chemin | `Destination` | motif |
|---|---|---|
| `schema`, `dossier_id`, `graine_alea` | `moteur` | feuilles scalaires, mêmes clés |
| `horloge.tour` | `moteur` | le compte, pas sa paraphrase. Aucun libellé d'écoulement tant que la n°10 n'en a pas livré un **dérivé par le code** avec sa propre ligne |
| `horloge.climat_actif` | `moteur` | clé **réservée**, `null` en it1, propriétaire n°14 (KR-207) |
| `monde.lieu_courant` | `moteur` | handle de lieu |
| `monde.lieux_visites[]` | `moteur` | handles |
| `monde.objets_possedes[]` | `moteur` | handles |
| `monde.indices_connus[]` | `moteur` | handles — **et c'est la porte** de `monde.indices[].verite`, `ia` *sous condition d'état* dans `destinations.ts` |
| `monde.jalons_atteints[]` | `moteur` | handles — **et c'est la porte** de `charpente.jalons[].enonce_texte`, `ia` pour un jalon **atteint** seulement |
| `monde.evenements_consommes[]` | `moteur` | handles |
| `monde.pnj.<id>.a_dit[]` | `moteur` | handles (chemin à indices effacés) |
| `monde.pnj.<id>.confiance` | `moteur` | clé **réservée**, `null` en it1, propriétaire n°12 |
| `journal[].tour` | `moteur` | |
| `journal[].role` | `moteur` | registre clos, discriminant de rendu |
| **`journal[].texte`** | **`moteur` en it1** | Zéro injecteur existe. `ia` aujourd'hui = autorisation dormante. La n°10 la bascule à `ia` **dans le lot** qui livre à la fois l'assembleur **et** la borne de résumé |
| `memoire` | `moteur` | feuille `null` |

**Motif de chaque ligne `ia` : il n'y en a aucune, et c'est la ligne la plus importante de la table.** Toute valeur `ia` en it1 désignerait un canal sans consommateur — ce que KR-249 refuse pour un *champ*, appliqué à une *audience*.

**Ce que cette table donne gratuitement à la n°10** : deux des quatre champs `ia` *sous condition d'état* de `destinations.ts` reçoivent enfin le **nom du fait de session** qui les ouvre — `indices[].verite` ← `monde.indices_connus[]`, `jalons[].enonce_texte` ← `monde.jalons_atteints[]`. Les deux autres (`savoirs[].revele_comment`, `plan_actions[].si_bloque`) n'ont **pas** leur porte dans la session d'it1 : propriétaires n°12 et n°14.

**Piège de fixture, mesuré sur le précédent `climat[].effets_regles`** : une **liste vide est une feuille**, donc le balayage rend `monde.lieux_visites` (sans `[]`) sur une session d'ouverture, et les lignes en `[]` seraient **mortes le jour même**. Deux fixtures, deux usages : la fixture du **balayage** est écrite à la main, **saturée** (toutes les collections non vides, au moins une entrée `pnj`) ; la fixture de l'**oracle** (§ 4) est la session d'ouverture réelle.

## 2. `EtatMonde` — les 7 champs, un par prédicat, et leur valeur à l'ouverture

Noms **relevés** depuis `predicates.ts`, jamais inventés.

| champ | prédicat | valeur à l'ouverture, it1 | cellule `VALEUR_AU_TOUR_ZERO` | accord |
|---|---|---|---|---|
| `lieu_courant: string` | `lieu_courant_est` | `charpente.depart.lieu_id` | `'vrai'` ssi cible = départ, `'faux'` sinon, `indecidable` si départ non posé | **accord** |
| `lieux_visites: readonly string[]` | `lieu_visite` | `[]` | `indecidable` | pas de contradiction ; devient `[depart]` en **it2** (décision ii) |
| `objets_possedes: readonly string[]` | `possede_objet` | `[]` | `'faux'` | **accord** (H5/H6) |
| `indices_connus: readonly string[]` | `indice_connu` | `[]` | `'faux'` | **accord en it1** ; **faux positif en it3** sur `dossier-minimal.json` (KR-252) |
| `jalons_atteints: readonly string[]` | `jalon_atteint` | `[]` | `indecidable` | amendée en **it3** (décision i) |
| `evenements_consommes: readonly string[]` | `evenement_consomme` | `[]` | `indecidable` | contre-exemple au dépôt — reste `indecidable` |
| `pnj: Readonly<Record<string, EtatPnj>>`, `EtatPnj = { readonly a_dit: readonly string[]; readonly confiance: null }` | `pnj_a_revele` | **`{}`** | `'faux'` | **accord** (H3) |

1. **`pnj` démarre à `{}`, pas une entrée par `monde.personnages[]`** — pré-semer serait une copie dérivée d'une collection du dossier (KR-013). `pnj_a_revele(p,i)` se lit `pnj[p]?.a_dit.includes(i) ?? false` : **clé absente = état légal**.
2. **`confiance` est réservée en `null`, jamais `number` ni `0`** — un `number` fixerait l'échelle que la n°12 possède.
3. **`lieu_courant: string`, jamais `string | null`** — un nullable serait une seconde représentation de « partie non ouverte » que la porte `jouable` interdit déjà : état illégal représentable.
4. **`readonly` partout** : le seul écrivain est `appliquerDelta` (it3), qui rend un nouvel état.

## 3. Ce qu'it1 doit REFUSER d'écrire (KR-249)

**Refusé — ni champ, ni clé réservée** :

| refusé | motif | où ça revient |
|---|---|---|
| `monde.pnj.<id>.sait` | KR-253, 6ᵉ KR-013. Aucun lecteur, **aucun écrivain possible** | n°14, en **delta** (`savoirs_acquis[]`) |
| `memoire.{resume_long, resume_recent, faits_etablis}` | la clé racine est le point d'extension, **la forme interne ne l'est pas** | n°10 |
| `attente` **et sa racine** | zéro producteur en it1. Une racine `attente: null` rendrait indistinguables « aucune attente » et « variante non supportée ». Elle entre en `attente?` **avec sa première variante**, légal par KR-251 | n°10 (`clarification`), n°11 (`jet`, `posture`) |
| `heros`, `combat` | décision actée : composés dans `src/player/types.ts` | n°11 |
| `journal[].deltas` | rien ne l'écrit ni ne le lit en it1 ; **optionnel à vie** quand il entre | it3 (KR-247/251) |
| toute prose autre que `journal[].texte` | **troisième source de prose**, hors du contrat « deux proses seulement » | n°10, avec son audience |
| une **copie gelée du dossier** dans la session | seconde source de vérité. Le gel est **par référence** (`dossier_id`), jamais par recopie | — |
| `tour_precedent`, `nb_lieux_visites`, `dernier_jalon`, `est_en_combat` | KR-013 | — |

**Clés réservées, propriétaire nommé** — trois, pas une de plus : `memoire` → `null`, n°10 · `horloge.climat_actif` → `null`, n°14 · `monde.pnj.<id>.confiance` → `null`, n°12.

**L'unique exemption à KR-249, écrite comme une exemption** : `graine_alea` est **écrite** à la création et **lue par personne** dans toute la feature — le premier lecteur est la n°11. Admise quand même : **une graine ne se rétro-ajoute pas.** Une session née en it1 et reprise sous la n°11 devrait en inventer une en cours de partie, et la promesse de rejeu (KR-242) ne tiendrait jamais pour elle. Deux exigences attachées : **défaut nommé et testé**, et **capture par une source injectée** — jamais un `Math.random` implicite au point d'usage (précédent : le `rng` non semé de `combat.ts:107`, qui fait osciller le score de mutation de ±1 mutant).

**Point d'attention pour le tech-lead** : si `src/player/` compose un jour un objet plus large que `EtatSession` pour le persister, l'exhaustivité **par compilation** ne couvre plus qu'un **sous-ensemble strict** de ce qui est écrit sur disque. À écrire en it1 : *l'objet persisté d'it1 **est** `EtatSession`, rien de plus ; le lot qui compose davantage porte la ligne d'audience du type composé et fait balayer la fixture **composée**.*

## 4. Réponse tranchée au point 7(b)

**Tranché : it1 amende le CONTRAT de `tourzero.ts`, jamais ses VALEURS. Les trois cellules restent telles quelles, et l'amendement qui entre est l'ORACLE.**

**Pourquoi aucune valeur ne peut bouger en it1.** La discipline écrite dans le fichier est : *toute cellule `vrai`/`faux` nomme soit le champ du document qui la détermine, soit la clause de H6 qui la suppose.* À la fin d'it1, la clause « aucun delta n'est appliqué avant la première action » est **encore vraie** : rien ne marque le départ visité (it2), rien ne déclenche un jalon (it3). Écrire dès it1 la valeur qu'it2 et it3 rendront vraie, c'est asserter en avance du code — et si l'une des deux glissait, le linter assertrait un faux **dans la direction interdite**.

**Ce qui entre en it1, et qui ne peut pas attendre.**
1. **L'oracle** — un témoin qui confronte la **session d'ouverture** produite par it1 à `VALEUR_AU_TOUR_ZERO`, prédicat par prédicat, sur `__fixtures__/dossier-minimal.json`. Assertion de **solidité** seulement : *aucune cellule `'vrai'`/`'faux'` ne contredit l'état d'ouverture*. Les `indecidable` ne sont pas assertés — perte de précision, direction sûre, consignée comme mesure. **C'est l'instrument qui n'existe pas** : `tourzero.test.ts:106` recopie la table dans le test et la compare à un double d'elle-même, `:260` ne tire que sur un huitième prédicat, et aucun test ne confronte la table à un **état**. it1 est la **première** itération où cet état existe.
2. **La docstring H6** — « deux décisions que la n°9 n'a PAS prises » devient faux au moment où le lot `contrat` d'it1 est signé. H6 nomme les décisions, **leurs itérations propriétaires** (ii → it2, i → it3) et le fait que les trois `indecidable` tiennent **jusqu'à ce que le code qui les rend fausses atterrisse**.
3. **Le chaînage table ↔ type** — chaque cellule nomme en JSDoc le champ d'`EtatMonde` qu'elle value. Deux tables indexées par `PredicatId` existent désormais sans aucun lien entre elles.

**Pourquoi ça ne peut pas attendre it2.**
- **Un instrument livré dans le même lot que le changement qu'il doit attraper n'a jamais été vu échouer dans l'état pour lequel il a été écrit.** Livré en it1, l'oracle est vert sur une table non amendée ; c'est ce vert-là qui donne un sens au rouge d'it3.
- **it2 n'a pas de lot `contrat`** : l'arbitrage n°13 en a acté **deux**, it1 et it3. Les y toucher en it2 ouvrirait un **troisième** lot `contrat`, que le cadrage a fermé.

**Ce que l'oracle attrape, et ce qu'il n'attrape pas — asymétrie voulue.**
- **Attrapé (it3, direction interdite)** : la décision (i) fait partir `jalon.premiere-nuit` au tour zéro → `reveler_indice(indice.sceau-brise)` → `indices_connus` non vide, pendant que la cellule `indice_connu: () => 'faux'` (`tourzero.ts:132`) asserte le contraire. Sous `non(...)` : faux positif. L'oracle rougit.
- **Non attrapé (it2, direction sûre)** : la décision (ii) rend `lieux_visites = [depart]` alors que la cellule vaut `indecidable`. Rien ne rougit — faux négatif seul. L'amendement reste **explicitement** dans le `goal` d'it2.

**Exigence de mesure — je suis en lecture seule et je n'ai PAS exécuté jest.** Le lot qui livre l'oracle doit (a) le vérifier **vert** sur la table non amendée d'it1, et (b) prouver son **pouvoir séparateur** en écrivant le mutant d'it3 — une session d'ouverture dont `indices_connus` contient `indice.sceau-brise` — et en le vérifiant **rouge** avant de le retirer (BUG-087).

## 5. Ce que je ne rejoue pas

Les 43 arbitrages du cadrage, nommément n°17, n°18, n°27, n°32/33, n°6, n°15. Les deux points rouverts ici — la **valeur** des lignes d'audience et le **contenu exact** de l'amendement `tourzero.ts` — n'ont été tranchés ni au cadrage ni dans le `goal`.
