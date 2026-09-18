# Tour 2 — `qa` · `dossier-copilote` it3a

```
RISQUE      — La mine TL3a-17 est réelle et MESURÉE : j'ai rejoué l'assertion exacte de
              frontiere.test.ts:384 avec un budget de rôle neuf égal à un budget existant
              (sonde jetable, jest, supprimée) — `toBe(ROLES.length)` échoue (Received: 2,
              Expected: 3). Le remplacement proposé est VERT au nominal sur ce même scénario
              ET ROUGE sur une égalité fabriquée au sommet (cas négatif exécuté, confirmé
              séparateur). Second risque, NEUF, trouvé en croisant UX et narratif-ia : leurs
              tours 1 se CONTREDISENT sur le statut de la liste vide EN SORTIE DU MODÈLE —
              UX (§G) la traite comme un état « succès », narratif-ia (C3, prédicat 6) la
              REFUSE, motif `vide`. Sans arbitrage, aucun test de cet état n'est écrivable —
              silence testable = silence produit, c'est mon domaine.

OBJECTION   — Je réponds NOMMÉMENT à TL3a-17 : recevable tel quel, MESURÉ sur pièce, pas
              seulement LU. J'ajoute une précision que le tech-lead n'a pas : le nombre exact
              de chemins injectés diverge déjà entre les deux propositions concurrentes
              (tech-lead : « onze des douze » ; narratif-ia B2 : 10, cible ET `synopsis_mj`
              retirés) — la collision à 6000 pile n'est donc PAS garantie, mais le MODE DE
              PANNE est générique et confirmé par ma sonde quelle que soit la valeur exacte.

PROPOSITION — Table des tests au § 7. J'ajoute deux tests absents des deux notes : (1)
              régression nommée BUG-097 sur `valeurAvantGelee` (narratif B3 réutilise
              explicitement ce mécanisme) ; (2) focus post-décision qui ne cible jamais
              `accepterDesactive` (prophylaxie BUG-106, UX §H le décrit sans le nommer test).

VERDICT     — Veto du tour 1 : LEVÉ sur ses deux points d'origine (canari exhaustif —
              constructible, MESURÉ ; élément-vide-en-liste — couvert par les prédicats 6+7).
              DURCI sur trois points neufs : (a) le motif « éléments distincts » doit être
              ÉCRIT dans le critère, pas seulement énoncé ; (b) le fautif « ≥ 1 » du
              tech-lead doit être pinné à l'index DERNIER ; (c) NOUVEAU veto conditionnel :
              la contradiction UX/narratif-ia sur la liste vide doit être tranchée avant que
              le lot 2 écrive un seul test d'état. `git status` propre après sondes ; jest
              complet rejoué : 98 suites / 1446 tests, vert.
```

---

## 1. Réponse nommée — TL3a-17, MESURÉ sur pièce

Sonde jetable (`worker/__qa_probe_budgets.test.ts`, supprimée, `git status` vérifié propre avant et après) :
- **Ligne 384 actuelle**, scénario mine (budgets 6000/17000/6000) : `new Set(...).size` vaut **2**, `ROLES.length` vaut **3** → l'assertion **échoue** (Received 2, Expected 3). Confirmé mécaniquement, pas déduit.
- **Remplacement proposé**, même scénario : `ROLES.filter(r => BUDGETS[r] === BUDGETS[ROLE_LE_PLUS_LARGE])` vaut `['indice-detenteurs']` → **vert**.
- **Cas négatif obligatoire** (égalité fabriquée AU SOMMET, deux rôles à 17000) : le filtre rend deux éléments → l'assertion **rougit**. Le remplacement est bien **séparateur**, pas un prédicat inerte requalifié.

**TL3a-17 est un rejet fondé, MESURÉ.**

## 2. Canari des paires (TL3a-18) — constructibilité mesurée

Sonde jetable reconstruisant `PAIRES`, `transposer` et les deux assertions, avec les **vraies** fonctions d'extraction sur les **vrais** fichiers. Sur l'état actuel à 2 rôles (1 paire) : **vert** — `PAIRES` a bien 1 élément, et la transposition fait rougir `memesGabarits` dans les deux sens et tomber les deux rôles nommés. **Constructible tel quel**, extensible mécaniquement par `ROLES` : rien dans la structure ne dépend du cardinal.

## 3. Piège de l'extraction — vérifié, pas de collision aujourd'hui

Script node en lecture seule appliquant `ENTREE_GABARIT` sur `worker/index.ts` et `schemaSortie.ts` : seules les 2×2 entrées `GABARIT_SORTIE` matchent. `BASE_CORS` n'est **jamais** capturé — confirmé que c'est bien la classe `[a-z-]+` qui l'exclut (clés à majuscules). Le nom du 3ᵉ rôle doit rester en minuscules-tirets, **déjà garanti** par `RoleCopilote` et par le test `totalite des gabarits par role`, qui dérive `ROLES` d'`Object.keys(INVITES)`. **Rien à ajouter** : le garde existant suffit.

## 4. `enveloppeConforme` — sous réserve tenable, non mesurable aujourd'hui

Les blocs `estObjetSimple` + clés exactes sont **identiques mot pour mot** entre les deux validateurs, à la constante près. `schemaSortie.test.ts` n'importe que l'API publique — aucun test n'espionne l'implémentation. L'extraction est **structurellement sûre par construction** (LU, pas MESURÉ : le 3ᵉ appelant n'existe pas encore). La réserve du tech-lead reste **à vérifier au lot 1**.

## 5. Doublon de prose — testable oui, motivé non (DURCI)

Les deux notes posent « éléments distincts » sans écrire **pourquoi** pour de la prose. **J'apporte la motivation manquante, à faire figurer dans le critère** : `PARLER_REPLIQUES = 2` est un plafond très serré — un doublon accepté **consomme un des deux seuls emplacements pour rien**, ce qui EST une conséquence d'écriture, contrairement à ce que je supposais au tour 1. Le prédicat est bien fondé, mais **la note qui le porte doit dire cette phrase**, sinon c'est le réflexe non motivé que je visais.

## 6. Contradiction NEUVE — la liste vide (veto conditionnel)

- **UX (§G)** : `succès, liste vide` → `TEXTE_AUCUNE_REPLIQUE_PROPOSEE`, **sans `⊘`**, état de succès normal.
- **narratif-ia (§C3, prédicat 6)** : `longueur ≥ 1` sinon `'vide'` — une liste vide est un **REFUS**.

Les deux ne peuvent pas être vrais ensemble. **Aucun test de cet état ne peut être écrit avant arbitrage** — veto conditionnel, pas un simple signalement.

## 7. Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `frontiere › le maximum est atteint par exactement un role` | `filter(...)` = `[ROLE_LE_PLUS_LARGE]` | contrat | KR-235 | 1 |
| `frontiere › une egalite fabriquee au sommet fait rougir` | même filtre, 2 éléments ≠ `[LARGE]` | contrat | KR-235 | 1 |
| `frontiere › canari croise sur la paire %s / %s` (`it.each(PAIRES)`) | `memesGabarits` false dans les 2 sens ; filtre = `ROLES` moins la paire | contrat | KR-236 | 1 |
| `frontiere › la cardinalite des paires est DANS le predicat` | `PAIRES.length = n(n−1)/2` | contrat | KR-236 | 1 |
| `schemaSortie › liste vide refusee, motif vide` | `{ok:false, motif:'vide'}` sur `[]` | unitaire | DÉSIGNATION≠RÉDACTION | 1 |
| `schemaSortie › element vide APRÈS un valide, lot ENTIER refuse` | `['ok','   ']` → refus | unitaire | neuf | 1 |
| `schemaSortie › mutant repechage partiel` | mutant rend `['ok']`, la vraie refuse le lot | unitaire | KR-235/BUG-087 | 1 |
| `schemaSortie › identifiant en DERNIÈRE position refuse le lot` | fautif à l'index `n−1`, pas seulement `≥1` | unitaire | KR-235/BUG-087 | 1 |
| `schemaSortie › deux repliques identiques apres trim refusees` | doublon → refus, **motivation `PARLER_REPLIQUES=2` en commentaire** | unitaire | neuf | 1 |
| `schemaSortie › cede_si absent de CHAQUE entree de CHAMPS_INJECTES` | garde TL3a-14 | unitaire | neuf | 1 |
| `CopiloteService › @ts-expect-error sur chaque couple illegal` | non-assignabilité structurelle | compile-time | TL3a-5 | 1 |
| `les 4 bouchons restent verts sans retouche` | non-régression | contrat | TL-15 | 1 (vérif) |
| `…test.tsx › accepter AJOUTE, ne remplace rien` | le tableau croît, l'ancien élément présent | composant | neuf | 2 |
| `… › Lancer desactive a PARLER_REPLIQUES, title nomme` | `disabled` + `title` | composant | TL3a-15 | 2 |
| `… › focus post-decision ne cible JAMAIS une ligne desactivee` | prophylaxie BUG-106 | composant | BUG-106 | 2 |
| `… › repliques deja ecrites GELEES au lancement` | régression **BUG-097** — *test ajouté par moi, absent des deux notes* | composant | BUG-097 | 2 |

### Non vérifiable en l'état
- **État « liste vide en sortie »** : contradiction non tranchée — aucun test écrivable avant arbitrage.
- **Doublon candidat vs réplique déjà écrite** : hors du contexte injecté par construction ; seule garde = l'œil de l'auteur sur la liste gelée — **pas d'instrument jest possible**.
- **`enveloppeConforme`** : non mesurable avant l'existence du 3ᵉ validateur.
- **BUG-106, cas « acceptation au plafond »** : dette assumée hors périmètre — noté ici plutôt que compté vérifié.
- **Budget exact du rôle neuf** : aucun rôle ne l'a mesuré ; mon test du § 1 n'en dépend pas, mais la valeur reste à mesurer au lot 1.

Sondes créées puis **supprimées** (`__qa_probe_budgets`, `__qa_probe_paires`) ; `git status --short` propre avant et après. Jest complet rejoué : **98 suites / 1446 tests, vert**.
