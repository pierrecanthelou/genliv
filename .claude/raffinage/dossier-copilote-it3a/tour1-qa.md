# Tour 1 — `qa` · `dossier-copilote` it3a

```
RISQUE      — Deux trous testables non couverts par le plan actuel. (a) Le canari croisé
              de KR-236 (worker/frontiere.test.ts, croiser() l.106-110) fait une ROTATION
              à N éléments : à 2 gabarits elle est exhaustive, à 3 elle ne teste que 3 des
              6 appariements ordonnés possibles (MESURÉ par lecture : croise[i] =
              gabarit[(i+1)%3] ne couvre jamais la paire « inverse »). Une invite qui
              embrasse par erreur le gabarit du rôle non-adjacent au cycle resterait VERTE.
              (b) Le prédicat de non-vacuité de l'it2 (« liste vide = succès ») répond à une
              question DIFFÉRENTE de « élément vide au milieu d'une liste par ailleurs
              pleine » — aucun critère ne les distingue, et pour de la PROSE (contrairement
              aux jetons P1..PN) un élément blanc est un défaut de FORME, pas une
              non-réponse honnête.

OBJECTION   — Silence testable = silence produit. Le plan doit NOMMER, pas laisser un
              ouvrier trancher : scanner par-élément vs par-lot (perte de position si la
              liste est jointe avant scan), identifiant en position N≠0, canari croisé
              exhaustif.

PROPOSITION — 4 critères à ajouter/amender, niveau contrat (jest+jsdom) : (1) canari croisé
              EXHAUSTIF — pour chaque rôle, aucun AUTRE gabarit (tous, pas le seul voisin de
              rotation) n'apparaît dans son invite ; (2) élément vide/blanc en milieu de
              liste ⇒ lot entier refusé, motif DISTINCT de « liste vide » ; (3) identifiant
              fuité en DERNIÈRE position (pas la première) ⇒ lot entier refusé ; (4)
              non-régression nommée citant BUG-097/101/106 si `CarteCompleterFiche`
              réintroduit un état dérivé d'un abonnement réveillé par son propre geste, ou
              un focus post-décision sur bouton désactivable.

VERDICT     — Veto CONDITIONNEL : pas sur le périmètre produit, mais sur l'absence, dans le
              plan à raffiner, d'un critère nommant le canari croisé exhaustif et
              l'élément-vide-en-liste. Jest exécuté vert (111 tests / 5 suites) ;
              `git status` propre, aucune sonde laissée.
```

---

## Détail par question

**1. Implémentations fautives pour une LISTE DE PROSE** — à écrire comme mutants nommés, sur le modèle de `schemaSortie.test.ts` :
- **repêchage partiel élément par élément** : `[valide, invalide, valide]` filtré silencieusement en `[valide, valide]` au lieu du refus du lot entier — récurrence directe de TL-6/BUG-087 sur un troisième type de contenu ;
- **scan du lot joint plutôt que de chaque élément** : un identifiant ou `MARQUEUR_A_ECRIRE` niché dans l'élément 2 ou 3 doit faire rougir le lot entier ; un scanner qui ne regarde que `elements[0]`, ou qui `.join('\n')` avant de scanner, passerait à tort *(à trancher : un identifiant à cheval sur deux éléments joints doit-il compter ?)* ;
- **élément non textuel emballé** (`{texte: "…"}` au lieu d'une chaîne nue) — sans prédicat dédié, `String(élément)` masquerait le défaut ;
- **liste rendue comme chaîne unique multi-lignes** au lieu d'un tableau JSON — confusion de schéma avec l'it1 ;
- **doublon élément-à-élément non arbitré** : contrairement à l'it2 (un doublon de rang = deux `Savoir` identiques, donc refusé), un doublon de PROSE n'a pas de conséquence d'écriture équivalente — **à trancher explicitement** plutôt que de recopier par réflexe le refus de l'it2, ce serait un critère non motivé.

Rappel BUG-087 tenu : chaque mutant doit être écrit et **VU rouge** sur le vrai code, jamais déduit.

**2. Prédicat de non-vacuité** — l'argument de l'it2 (« punir la réponse honnête est une machine à complaisance ») tient pour la liste **vide dans son ensemble** (transport direct). Il ne tient **PAS** pour un élément vide noyé dans une liste pleine : ce n'est pas « je n'ai rien à dire », c'est un **artefact de forme** (padding, gabarit mal rempli). Côté testabilité, le point dur : ce cas n'a **nommément aucun witness** aujourd'hui — ni `schemaSortie.test.ts` ni `contexte.test.ts` ne portent `['bonne phrase', '', 'autre phrase']`. Critère rédigeable tel quel : « Étant donné une liste dont un élément est vide ou uniquement des blancs **après** un élément valide, quand la sortie est validée, alors le lot entier est refusé, motif `vide`, **distinct** du succès à liste totalement vide. » Aucun obstacle d'instrument.

**3. Scanner anti-identifiant, par élément ou par lot** — pas de code écrit pour la liste de prose, donc rien à mesurer sur le réel ; sur l'existant scalaire, `porteUnIdentifiant` est un prédicat sur UNE chaîne. `elements.some(porteUnIdentifiant)` est **déjà correct par élément** — mais aucun test ne le prouve, la fonction n'ayant pas d'appelant sur un tableau. Les deux canaris de l'it1 (`objet.favori` bénin, `lieu.amorce` fuite) survivent **mécaniquement** si le futur validateur réutilise `porteUnIdentifiant` sans le retaper (KR-117). Critère à écrire : « aucune réimplémentation du scanner, appliqué à CHAQUE élément, preuve par les deux canaris existants sur un élément **non-0**. »

**4. Canari croisé à 3 gabarits** — rejoué (`npx jest worker/frontiere.test.ts`, vert). Le fichier est **déjà générique** sur `ROLES = Object.keys(INVITES)` (l. 51) et tous les `describe.each` (totalité, appariement, plafonds) s'étendent sans modification. Le seul point non générique est `croiser()` et son usage en sous-test (b) de `canari croise` (l. 157-163) : à N=3 il teste (rôle0→gabarit1), (rôle1→gabarit2), (rôle2→gabarit0) — **jamais** (rôle0→gabarit2), (rôle1→gabarit0), (rôle2→gabarit1). Il faut soit une seconde rotation en sens inverse, soit — **plus robuste et qui scale à N quelconque** — une boucle exhaustive `ROLES.filter(autre => autre !== role && invite(role).includes(gabarit(autre)))` par rôle. À écrire dans le **lot contrat de 3a**, puisque cette itération ajoute potentiellement un 3ᵉ gabarit.

**5. Non-régression sur un 3ᵉ rôle** — vérifié par lecture : `CHAMPS_INJECTES`, `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE` (l. 34, 80, 139) et `GABARIT_SORTIE` sont **tous** `Record<RoleCopilote, …>` — ajouter un rôle à l'union fait échouer `tsc` sur **chaque** table incomplète, **dans le lot qui l'ajoute**, pas en silence. C'est la fermeture directe du problème que l'it2 avait découvert **après coup** (import scalaire de `frontiere.test.ts`). Aucun test existant ne rougirait silencieusement — soit `tsc` bloque tout de suite, soit rien ne bouge. **Seul le canari croisé (point 4) est un cas où rien ne rougit alors que ça devrait.**

**6. Trois dettes ouvertes** — cette tranche ne touche ni `Select.tsx` (BUG-106), ni le remontage du panneau, ni la recette Worker Route Parity : aucune n'est fermée ni rouverte par construction. **Risque à surveiller** si `CarteCompleterFiche` réutilise le pattern gel/dégel de `CarteTisserIndices` (probable, ils partagent `LigneProposition`) : même récurrence que BUG-097/101 sur un composant neuf — critère de non-régression **nommé** recommandé plutôt qu'espéré via la revue seule.

**7. Curseurs** — hors du périmètre testable de 3a par construction. Si le comité choisit « non proposables », garde utile : « aucun chemin `caractere.<curseur>` n'apparaît dans `CHAMPS_INJECTES` d'aucun rôle » — une seule assertion d'inclusion, motif déjà utilisé par le critère 8 pour exclure `intensite`.

Fichiers lus : cadrage, `specification.json`, `dossier-copilote-it2.revue.md`, `bug_history.json`, `bug_history.dossier-copilote.json`, `schemaSortie.test.ts`, `worker/frontiere.test.ts`, `copilote/types.ts`, `copilote/contexte.ts`, `CopiloteService.ts`. Jest exécuté (111 tests, verts) ; aucun fichier modifié.
