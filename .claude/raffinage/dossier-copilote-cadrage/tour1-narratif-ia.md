# Tour 1 — Narratif & IA (`/cadrer dossier-copilote`) — effort élevé

RISQUE — La n° 8 pose, sans le dire, la moitié de l'infrastructure du Temps 2 : enveloppe de réponse, schéma de sortie, rejeu, assembleur de contexte, va-et-vient rang ↔ identifiant. Taillés pour un lecteur unique — l'auteur, qui sait déjà tout —, ils seront hérités par sept features dont le lecteur est le joueur, qui ne doit rien savoir. Le danger n'est pas qu'un assistant propose mal : c'est qu'un contexte de rédaction légitimement peuplé de champs `moteur` devienne le précédent qui les fait entrer dans le contexte de JEU.

OBJECTION — « toujours en proposition » n'est pas une frontière, c'est une promesse d'interface. Elle ne dit ni qui frappe l'identifiant, ni ce qui arrive à une sortie non conforme, ni ce qu'un modèle a le droit de CHIFFRER. Telle qu'elle est écrite, la ligne n° 8 autorise un modèle à proposer `stats`, `revele_si.jet.tc` et `relations[].intensite` — trois seuils que `challenge.ts` et la n° 14 lisent. Un auteur qui tamponne un `tc: 3` n'a pas écrit une règle : il a ratifié celle du modèle. Seconde objection : le cadrage ne dit nulle part que le copilote est SANS MÉMOIRE ; **une mémoire non spécifiée est un veto de mon domaine**.

PROPOSITION — (1) Un invariant en une phrase : *le modèle propose ce que l'auteur ÉCRIRAIT, jamais ce que le moteur LIT comme seuil, porte ou drapeau de routage.* Curseurs admis (KR-193 : aucun jet n'en dépend) ; `stats`, `jet.carac/tc`, `confiance_min`, `intensite`, `secret`, `duree`, tout `…_expr` : refusés. (2) **Zéro identifiant dans une sortie de modèle** — rangs entiers seulement, re-résolus par le code ; entité neuve = brouillon SANS IDENTITÉ. (3) Tout champ injecté portant `MARQUEUR_A_ECRIRE` est **retiré** du contexte ; si le retrait vide le contexte requis, l'assistant REFUSE en nommant le champ. (4) Borne de contexte mesurée puis plafonnée.

VERDICT — **recevable sous réserve**

## 1 — La frontière code / IA
| Geste | Qui |
|---|---|
| Choisir ce qui entre dans le contexte | **code** — liste blanche de chemins, par assistant, littérale et testée |
| Rédiger de la prose française | **modèle** |
| Désigner une entité existante | **modèle**, par **RANG** dans la liste injectée — jamais par identifiant ni nom libre |
| Re-résoudre un rang en identifiant | **code** |
| Frapper un identifiant neuf | **code** (`frapperIdentifiant`), **à l'acceptation**, jamais avant |
| Valider la sortie | **code** — schéma fermé, bornes nommées, rangs dans l'intervalle |
| Écrire dans le dossier | **code**, via `DossierService.update` et lui seul |
| Lancer un dé, régler un seuil, poser une porte chiffrée | **personne dans cette feature** |

**Aucune règle de jeu dans un prompt.** Aucun prompt ne récite l'échelle 1-12, les quatre TC, la formule de PV, le mapping CA/IN/IG, ni les bornes de curseur. Le prompt dit ce qu'est un curseur en français (sa `describe`, déjà dans `CURSEURS`) ; la borne est appliquée **après**, par le validateur.

## 2 — Contrat de sortie
Enveloppe commune, réutilisable par la n° 10 :
```
SortieIA<T> = { ok: true, propositions: T[] } | { ok: false, motif: MotifEchec }
MotifEchec = 'json-illisible' | 'schema-invalide' | 'identifiant-dans-la-sortie'
           | 'rang-inconnu' | 'hors-bornes' | 'texte-vide' | 'trop-long'
           | 'contexte-insuffisant' | 'indisponible'
```
Validation dans cet ordre (un échec arrête tout le lot) : `JSON.parse` total → **schéma fermé** (clé inconnue = échec) → **balayage anti-identifiant** (la sortie sérialisée testée contre `FORME_IDENTIFIANT`) → **rangs** entiers dans l'intervalle → **bornes** contre constantes nommées → **prose** non vide sous plafond.

Comportement d'échec : premier échec → **un rejeu, un seul**, avec le `motif` rendu au modèle ; second → `{ok:false, motif}`, aucune écriture, aucun brouillon partiel. **Le « dégradé » du § 2.8 n'a pas d'équivalent ici** : en jeu, dégrader = action gratuite + texte neutre parce qu'un tour doit avancer ; **en rédaction rien n'avance tout seul, le dégradé EST le refus**. Jamais de réparation partielle (« garder les 2 valides sur 3 ») : réparer, c'est interpréter.

Les trois schémas : **A · Tisser les indices** — `{detenteurs: [{pnj_rang, certitude, revele_comment, porte_suggeree?}]}` ≤ 3 ; `porte_suggeree` est un **geste, pas une valeur** (l'accept ouvre l'éditeur de portes de la n° 4 avec le type présélectionné, et **n'écrit aucun nombre**). **B · Compléter une fiche** — `curseurs?` (LES SIX OU AUCUN, jamais complété par `CURSEURS_INITIAUX`), `parler?`, `jamais?`, `cede_si?`, `but?`, `plan_actions?` (liste ORDONNÉE, le code écrit `etape`), `relations?` (`cible_rang` + `lien`, **ni `intensite` ni `secret`** ; le code écrit `intensite: 0` — neutre par le JSDoc, **inerte** par le seuil `>= 1` du transfert d'indice n° 14). **C · Éclater le synopsis** — `{personnages: [{nom, portee, camp?, objectif_rang?, fonction, but}]}` ≤ 9, **aucun `id`**.

## 3 — Budget de contexte
Toujours : `titre`, `canon.ton`, `canon.interdits_ton[]`. **Jamais, dans aucun des trois** : `schema`/`id`/`createdAt`/`updatedAt` ; tout `…_expr` ; `jalons[].effet[]`, `fins[].condition_*`, `quetes[].recompense[]`, `evenements[].resolutions[].consequence[]`, `climat[].effets_regles` (des deltas : injectés, ils apprennent au modèle à distribuer des récompenses) ; `evenements[].monstre_ref` (résout vers `pv`/`armour`/`capacity`) ; `stats` ; `revele_si.*`.

Cardinalités plafonnées **avant** toute mesure : Tisser = 1 indice + 12 fiches en projection réduite, sélection par ordre du document (pas de scoring) ; Compléter = 1 fiche entière + 12 fiches, `parler` tronqué à `PARLER_REPLIQUES` ; Éclater = 8 objectifs + 30 noms.

**Borne dure** : on **mesure d'abord** (en caractères — pas de tokenizer dans ce dépôt et on n'en fait pas entrer un) sur `dossier-minimal.json` et le dossier de référence, **puis** `plafond = ceil(mesure ÷ 2 kio) × 2 kio`, constante nommée, testée. **Ces deux documents ne sont pas mesurés : NON MESURÉ.** Au plafond : on tronque les listes déjà ordonnées ; si ça dépasse encore, on **refuse** (`motif: 'trop-long'`). Jamais un appel qui part avec un contexte tronqué à l'aveugle. Seconde borne côté serveur : la garde 413 du worker.

**Filtre `MARQUEUR_A_ECRIRE`** : tout champ injecté commençant par `⟨à écrire⟩` est **retiré** (`amorce.ts` le demande déjà : « ni par un modèle qui recevrait le canon »). Si le retrait vide une partie requise — typiquement `synopsis_mj` pour Éclater —, l'assistant **refuse** (`contexte-insuffisant`) et nomme le champ. *Un copilote qui invente l'aventure entière à partir de `⟨à écrire⟩ La vérité de cette aventure` est le pire résultat possible de cette feature.*

## 4 — Réponses aux six questions
**Q1 — `destinations.ts` gouverne-t-elle le contexte du copilote ? NON, et elle ne doit pas être étendue.** Deux contrats distincts : **le contexte de rédaction ne fuit que vers l'auteur, qui sait déjà tout ; le contexte de jeu fuit vers le joueur, qui ne doit rien savoir.** C'est ce qui rend `camp`, `objectifs[].nom` et `reussi_si_texte` admissibles ici et inadmissibles à la n° 10. Ce qui empêche la porte dérobée : le copilote **ne livre aucun assembleur générique piloté par une table d'audience**, mais **trois listes blanches littérales**. Garde testable : chaque entrée doit être une **clé de `DESTINATION_DES_CHAMPS`** (pas de chemin libre, pas de coquille, rougit si un champ disparaît), et le test **rend l'audience de chaque entrée** pour que la revue voie les champs `moteur`/`auteur` que la rédaction lit, chacun portant son commentaire de motif. `destinations.ts` reste la seule autorité sur le contexte de jeu, non ré-exportée ; les listes du copilote ne sont jamais importées par `brain/dossier/`. **Zéro lot contrat sur la triade Décision A.**

**Q2 — le motif de D1 vaut-il ?** Il a deux moitiés. « Le narrateur provoquerait le déclencheur » **tombe** en rédaction (ni tour, ni joueur, ni scène). « La même règle dans le code ET dans le prompt » **tient, mais ailleurs** : elle interdit d'en PRODUIRE la version évaluable, pas d'en LIRE le texte. D'où : **`…_texte` lisible et proposable**, **`…_expr` jamais proposé**.

**Q3 — la ligne sur les nombres** : à l'invariant du § 1. Curseurs admis ; `stats`, `jet.{carac,tc}`, `confiance_min`, `intensite`, `secret`, `duree`, `delai` rejetés. *C'est la première fois qu'un modèle produit un entier dans ce dépôt, et le seul entier admis est celui dont un fichier du dépôt certifie par écrit qu'il n'est pas une règle.*

**Q4 — la formulation qui réconcilie les deux garde-fous**, à recopier dans la spec **et** à faire hériter par la n° 10 :
> **Aucune création d'entité par le modèle.** Le modèle ne frappe jamais d'identifiant et n'écrit jamais dans le dossier. Il ne désigne une entité existante que par son **rang** dans la liste injectée. Une entité neuve est un **brouillon sans identité** : le modèle en rend le contenu, le **code** lui frappe un identifiant à l'instant — et seulement à l'instant — où **l'auteur** accepte. La règle a un unique paramètre : **l'ensemble des formes de brouillon admises**. En rédaction (n° 8) il est non vide et fermé. **En jeu (n° 9-16) il est VIDE** — et c'est ce vide, pas une seconde règle, qui donne « l'IA ne peut référencer que des identifiants existants ».

**Q5 — l'inversion d'ordre n° 8 / n° 10.** Réutilisable si on nomme d'avance. *Commun* : la famille `/ia/<role>` avec sa garde de taille et sa forme d'erreur ; le point d'extension routeur ; l'**enveloppe `SortieIA<T>`** ; le helper **valider → rejouer une fois → refuser** ; le **va-et-vient rang ↔ identifiant** — qui n'est pas une invention de la n° 8 : `destinations.ts` (l. 254-260) le décrit **déjà** comme le mécanisme prévu pour les savoirs de la n° 12. *Local* : les trois prompts, les trois listes blanches, le panneau de diff, l'absence de mémoire. *À ne surtout pas construire ici* : SSE, mémoire à trois niveaux, budget **par tour**, assembleur générique, « faits établis ».

**Q6 — jusqu'où va Tisser les indices ?** Jusqu'à la prose et l'attache, pas la mécanique. Le modèle propose **qui** (rang), **avec quelle certitude**, **comment il le dit**. Il peut proposer un **type de porte sans aucune valeur** ; l'accept ouvre l'éditeur de la n° 4. Il doit **partir du constat du linter** plutôt que rebalayer : une règle vit à un seul endroit.

**Mémoire — aucune, et c'est une propriété.** Un appel = un contexte assemblé depuis le dossier persisté, plus rien. Conséquences à écrire dans la spec parce qu'elles se voient à l'écran : une proposition refusée ne laisse **aucune trace** ; « régénérer » repart de zéro et peut légitimement rendre autre chose — **ce n'est pas un bogue, et l'interface ne doit pas promettre le contraire**. Point d'extension : une liste explicite et bornée de brouillons refusés passée dans la requête, jamais un historique implicite.

## 5 — Découpage vu de mon poste (3 itérations, l'ordre du RISQUE)
| # | Contenu | Pourquoi ici |
|---|---|---|
| **it1** | Route worker + garde de taille + enveloppe + schéma + rejeu-une-fois-puis-refus + assembleur borné + filtre `MARQUEUR_A_ECRIRE` + **Tisser les indices** + panneau de diff | Le plus petit contrat des trois : **zéro nombre de règle, zéro identifiant, zéro entité neuve**. La tranche qui prouve la frontière avant de la charger. |
| **it2** | **Compléter une fiche** | Premier contrat qui porte des **nombres** (six curseurs) et des **sous-entités**. Le lot de validation de bornes est ici. |
| **it3** | **Éclater le synopsis** | Le seul qui produit des **entités neuves** → brouillon-sans-identité + frappe à l'acceptation. En dernier parce qu'il s'appuie sur les deux mécanismes précédents. |

Le roadmap dit 3, je dis 3 : **aucune inflation demandée**. Réserve honnête : it1 est chargée et **je n'ai pas mesuré son volume — NON MESURÉ**. Si le tech-lead la trouve trop grosse, la coupe recommandée n'est **pas** le panneau de diff (l'accept champ par champ est le garde-fou, pas de la décoration) mais **l'écran** : it1 livre un `CopiloteService` testé **sans écran** — précédent `exportDossier` en n° 1 it5. Cela ferait 4 itérations ; arbitrage de volume, pas de mon domaine, et je ne le réclame pas.

Ordre inverse du plan de cible (qui liste le synopsis en premier) : le plan suit l'ordre mental de l'auteur, **je suis l'ordre du risque**. L'assistant qui peut corrompre l'identité livre **en dernier**, sur un tuyau déjà prouvé.

## REJETÉS
0. **Toute sortie contenant une chaîne en forme d'identifiant** (`pnj.…`, `indice.…`, `lieu.…`) — lot entier refusé au balayage `FORME_IDENTIFIANT` : invention ou recopie, on n'ouvre ni l'un ni l'autre chemin.
1. **`stats` proposés** — la valeur EST le seuil du jet (`REGLES-DU-JEU.md` § 2).
2. **`revele_si.jet.carac` / `.tc`** — choisir son TC, c'est choisir la difficulté d'un dé.
3. **`revele_si.confiance_min`** — seuil dont les bornes ne sont pas encore définies (propriétaire n° 12).
4. **`relations[].intensite`** — SEUIL (`>= 1` → transfert d'indice hors caméra, n° 14) ; le code écrit `0`.
5. **`relations[].secret`** — ce drapeau COMMANDE l'injection de sa propre ligne ; le modèle y déciderait ce que le narrateur du Temps 2 a le droit de voir.
6. **`plan_actions[].duree` et `contre_mesures[].delai`** — comptes de pas d'horloge lus par la n° 14.
7. **Tout `…_expr`** — seule autorité sur ce qui se déclenche ; un `_expr` accepté distraitement est une règle que personne n'a écrite.
8. **Un assembleur générique piloté par `destinations.ts`** — un assembleur à deux régimes serait la porte dérobée par laquelle un champ `moteur` atteindrait le narrateur en n° 10.
9. **Une mémoire de conversation** — une mémoire non spécifiée devient une fuite de contexte.
10. **La réparation partielle d'une sortie non conforme** — réparer, c'est interpréter.
11. **SSE / streaming** — on ne peut pas valider un schéma qu'on affiche en train d'arriver.
12. **Toute trace du copilote persistée dans le dossier** — lot contrat sur la triade, et une donnée que le validateur, le linter n° 7 et l'assembleur n° 10 devraient tous apprendre à ignorer.
13. **Un rebalayage des indices par le copilote** — `controlerDossier` livre déjà la règle ; une seconde implémentation dérive au premier changement.
14. **Un prompt qui récite une règle du jeu** — la règle vit dans `src/brain/` et `docs/REGLES-DU-JEU.md`, et s'applique au validateur de sortie, jamais en consigne.

**NON rejeté, mais hors périmètre — à ne pas confondre** : faire proposer `depart.texte_ouverture_joueur` ou `fins[].texte`. Elles sont `moteur` parce qu'**émises verbatim**, et les faire écrire **à l'exécution** les ferait varier d'une partie à l'autre ; une proposition acceptée par l'auteur est figée et ne varie plus. Le motif de `destinations.ts` ne les interdit donc pas ici — elles sont simplement absentes des trois assistants nommés. **À ne pas transformer en interdit de principe : ce serait un faux précédent que la n° 16 hériterait.**
