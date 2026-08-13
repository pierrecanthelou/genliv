# Tour 2 — `narratif-ia` · `dossier-fiches` it3 (contre-lecture)

## 1. Réponse nominale — tech-lead, OBJECTION 1

**Tu as raison sur le fond et tort sur le remède exact.** C'est moi qui ai interdit le `?? 0` et moi qui ai proposé la forme qui l'appelle. **Je me range au TOTAL.**

Mais ton lot 2 contient **deux fois** la forme que je refuse, et une seule est légitime :

```tsx
value={(personnage.stats ?? STATS_INITIALES)[carac]}                  // ← REPLI DE LECTURE — à retirer
{ ...p, stats: { ...(p.stats ?? STATS_INITIALES), [carac]: valeur } } // ← semis d'ÉCRITURE — gardé
```

Le premier affiche `1` pour un personnage dont l'auteur n'a rien écrit : le mensonge visuel que l'**ux-designer** a nommé, et exactement la valeur que la **qa** interdit de semer (critère 4). Ton `?? STATS_INITIALES` **de lecture** était la seule chose qui faisait paraître vos deux notes incompatibles.

`STATS_INITIALES` reste, mais **sous garde nommée** : docstring « valeur SEMÉE à l'écriture, jamais un repli de LECTURE », et le test-grep de D7 étendu pour interdire `?? STATS_INITIALES`. Motif : exporté depuis `brain/`, il est à un import du moteur du Temps 2, où `stats ?? STATS_INITIALES` ferait résoudre un jet contre une fiche fabriquée que personne n'a écrite. **Pas un veto** — mon veto porte sur ce que le modèle fait — mais ma réserve la plus dure de l'itération.

**À `pm-produit`** : je **rejette** ta proposition (2) « nommer `CHARACTERISTIC_MIN` dans `characteristics.ts` ». Fichier sous score de mutation : y toucher déclenche le run **et** le cliquet `break` 80 → 85, que la mesure du 2026-08-02 (81,40 %) ne paie pas. La constante va dans `src/brain/dossier/types.ts`.

## 2. D1 et D4 tranchés : TOTAL, `requis: true`

**`stats?: Record<Characteristic, number>` — optionnel en bloc, TOTAL quand présent, `requis: true` sur les 8 lignes.**

**(a) L'argument de frontière, qui est le mien et qu'aucune note n'a écrit.** Un bloc `stats` partiel crée un état d'exécution où le moteur **ne peut pas résoudre un jet** : `challenge.ts` teste `dés ≤ carac`, et « le PNJ n'a pas de FO » n'a que trois réponses possibles — refuser le jet, prendre un défaut, ou **laisser le modèle improviser**. La troisième est mon veto ; la deuxième est la règle dupliquée. Seule la première est saine, et pour l'obtenir il faut une garde à **chaque** site moteur, c'est-à-dire la même règle écrite N fois. Avec le TOTAL, l'état est **binaire et vérifiable en un seul point** : `stats === undefined` (personnage non mécaniquement jouable) ou les 8 clés (tout jet résoluble). Une caractéristique manquante en cours de partie est le genre de trou où quelqu'un finit par écrire « demande au modèle ».

**(b) L'asymétrie du regret sur un `schema: 1` sans migration.** Aujourd'hui les deux formes sont également sûres : aucun dossier persisté ne porte `stats` (KR-191 satisfait des deux côtés). La différence est **plus tard**. Sous `Partial`, des dossiers à bloc partiel existeront dans la nature ; les resserrer un jour exigera un chemin de migration que `schema: 1` **n'a pas**. Sous TOTAL, l'inverse est gratuit : desserrer TOTAL → `Partial` n'invalide jamais rien. **Sur un schéma sans migration, on choisit la contrainte qu'on peut encore relâcher, jamais la laxité qu'on ne pourra plus resserrer.**

**(c) `requis: true` coûte zéro ligne.** Mon `requis: false` du tour 1 est **RETIRÉ** : j'avais recopié le mauvais précédent. `confiance_min` est une **feuille scalaire optionnelle** ; `stats.FO` est une feuille d'un **bloc optionnel**. Le bon précédent est `savoirs[].revele_si.jet.carac`, **déjà `requis: true`** alors que `revele_si` et `jet` sont tous deux optionnels (`tables.ts` l. 148-153). Vérifié dans `sitesDe` (`validate.ts` l. 154-183) : au segment `stats` la valeur vaut `undefined`, au segment `FO` le `if (!estObjet(site.valeur)) continue` coupe — **aucun site produit**. Bloc absent = calme, sans une ligne de `validate.ts`. Bloc à 1-7 clés = 7 sites `undefined` refusés.

**Conséquences à répercuter :**
- L'état « partiel » de la table UX (§ 6, ligne 2) devient **inatteignable** dans un document valide — la ligne tombe.
- Le critère **qa n° 3** se **scinde** : `validate.test.ts` (« un `stats` à 1-7 clés est refusé à l'import ») + composant (« un personnage **sans bloc** `stats` »).
- Mon repli PV se simplifie : **une seule condition**, `stats === undefined ? null : maxPV(personnage.stats)`. Plus d'endroit où loger un `?? 0`.

## 3. Statut de mes objections du tour 1

| # | Objection | Statut |
|---|---|---|
| 1 | `stats.*` → `moteur`, 8 lignes dérivées, 8 clés dans les deux fixtures | **maintenue** — non contestée |
| 2 | Le plancher `1` n'existe dans aucune section de `REGLES-DU-JEU.md` | **DURCIE** — la doc se corrige **dans le même lot** |
| 3 | `maxPV` prend **un objet**, pas trois arguments | **maintenue** — le critère de la spec (l. 24) doit être réécrit `maxPV({FO,AG,EN})` |
| 4 | PV `—` jamais `?? 0` | **maintenue, simplifiée** |
| 5 | `requis: false` | **RETIRÉE** — mauvais précédent |
| 6 | Élargir l'`open_questions` existante | **maintenue** |
| 7 | `PLAN-BASCULE-IA.dc.html` l. 201 (`"pv"`, `"tier"`) est **périmé** | **maintenue** — à écrire noir sur blanc : un dev-contrat qui ouvre la référence y lit le contraire de KR-192 |
| 8 | Personne ne peut prouver que `stats` n'atteint aucun contexte de modèle | **maintenue** — limite de revue, pas garantie |
| 9 | Aucun `test:mutation` tant que `characteristics.ts` est intact | **maintenue et renforcée** |

**Aucun veto.**

## 4. D5 — la correction de `docs/REGLES-DU-JEU.md`

**Section** : § 1 « Le Personnage (variables d'état) ». **Insertion après le tableau des 8 caractéristiques (après la ligne 29), avant `### Création & état de santé`.**

**Texte exact :**

> **Échelle.** Une caractéristique vaut un **entier de 1 à 12**. `12` est le plafond dur (rappelé au § 5) ; `1` est le plancher, et c'est une valeur que le système utilise réellement (§ 4 : Rat géant `FO 1`, Zombie `AG 1`). La **génération du héros** (`2D4` par caractéristique, puis `1D4` réparti, plafond **10** à la création) est une **procédure de départ**, pas la borne de l'échelle : elle ne produit ni valeur sous 2 ni valeur au-dessus de 10, mais rien n'interdit à une caractéristique de sortir de cet intervalle ensuite (progression, § 5), ni à un personnage écrit dans un dossier d'aventure d'y être posé hors de lui.

J'ai volontairement **retiré** ma formule du tour 1 « pour le héros comme pour tout personnage non joueur » : elle créait en passant une mécanique de jet du PNJ que les règles ne portent pas — mon biais, sans place dans le fichier qui fait foi.

**Elle DOIT partir dans le même lot que le code**, et pas seulement par KR-130. Raison mécanique : `docs/WORKFLOW.md` fait sauter la revue tech-lead **et** la revue utilisateur à tout changement qui ne touche **que** des `.md`. Livrée en commit séparé, la phrase qui devient la source d'une borne de schéma serait la seule ligne de l'itération que **personne ne relit**.

**Aucune ligne dorée neuve** : `rules.golden.test.ts` épingle `CHARACTERISTIC_MAX`, `CHARACTERISTIC_VALUES`, `MONSTER_CHARACTERISTICS`, `DEFAULT_CHARACTERISTIC` ; son périmètre est les 4 fichiers mutés. `CARACTERISTIQUE_MIN` dans `dossier/types.ts` en est hors, comme `CONFIANCE_MIN`/`MAX`.

## 5. D7 — test-grep confirmé, avec son porteur et sa limite

**Fichier** : `src/features/dossier-fiches/tests/pvDerive.test.ts` (neuf). Précédent : `featureDirs.test.ts` (même patron `path.join(__dirname,'..','..')` + lecture texte).

**Trois assertions** : (1) aucun fichier de `src/features/**` ni `src/player/**` ne contient une somme écrite à la main sur `stats` — motif `/\bstats\??\.(FO|AG|EN)\b[^\n]*\+/` ; (2) aucun `?? STATS_INITIALES` hors du chemin d'écriture ; (3) `FichePersonnage.tsx` **importe** `maxPV` — discriminant, sans quoi (1) et (2) passeraient sur un fichier qui n'affiche plus de PV du tout.

**Ce qu'il ne couvre PAS, à écrire dans sa docstring (KR-173)** : il attrape la somme **écrite sur `stats`**, pas toute réécriture concevable (destructuration intermédiaire, helper local, autre module). C'est un grep, pas une preuve. Il rend le chemin **le plus court** vers la duplication rouge, et c'est le seul que quelqu'un prendra.

## 6. D8 — jurisprudence it6 : **assumée, forme identique, mécanisme séparé**

**`caractere.curseurs` suivra la même forme que `stats`** : `curseurs?: Record<Curseur, number>`, optionnel en bloc, TOTAL quand présent, 6 lignes `ENUMERES_FERMES` dérivées de `CURSEURS` avec `requis: true`, 6 lignes `moteur`, 6 clés dans les deux fixtures. Écrit ici pour qu'it6 ne rejoue pas ce débat.

**Le motif n'est PAS le même, et il faut le dire pour que la jurisprudence tienne.** Un curseur manquant ne rend aucun jet irrésoluble — le mapping CA/IN/IG est documentaire (KR-193). Ce qu'un bloc partiel casse est **en aval** : l'assembleur n° 10 dérivera un libellé par curseur, et un bloc à 5 clés sur 6 lui impose une **branche par clé**. C'est là qu'on invente un défaut côté prompt (« s'il n'a pas de courage, dis qu'il est moyennement courageux ») — un trait fabriqué injecté dans le contexte, mon domaine plein.

**Réponse directe au PM : même FORME, aucun MÉCANISME partagé.** Un `Object.fromEntries(REGISTRE.map(...))` étalé **au site**, une fois pour `CHARACTERISTIC_VALUES` en it3, une fois pour `CURSEURS` en it6. **Pas** de table `RECORDS_A_CLES_FIXES`, **pas** de wildcard dans le walker, **pas** de point d'arrêt, `LIBRES`/`SANS_DESTINATION` inchangés. Deux étalements de trois lignes valent mieux qu'une abstraction à deux appelants dont le rayon d'explosion est le garde d'audience du schéma.

## 7. D9 — la ligne exacte pour `specification.json`

**Éditer l'entrée existante** (« OUVERT, propriétaire non assigné — le texte des libellés par palier de curseur… »), ne pas en ajouter une neuve :

> "OUVERT, propriétaire non assigné — le texte des libellés DÉRIVÉS d'une valeur numérique de personnage, dans ses DEUX occurrences : par palier de curseur de caractère (ex. la formulation exacte de « très méfiant » pour un curseur à 7-8, it6) ET par palier de caractéristique (ex. ce qu'un narrateur lit d'un FO à 11, it3). Même problème, même instrument, même propriétaire : c'est du contenu de prompt, sans consommateur avant l'assembleur n° 10 — le poser en it3 comme en it6 serait une forme sans producteur (décision A). it3 ne livre que les 8 valeurs numériques, destination moteur ; it6 ne livre que le registre numérique + le champ affinite documentaire. Corollaire tenu par les deux itérations : aucun nombre de caractéristique ni de curseur n'entre dans un contexte de modèle, ni en brut ni en paraphrase, tant que n° 10 n'a pas livré ce libellé ET sa ligne d'audience."
