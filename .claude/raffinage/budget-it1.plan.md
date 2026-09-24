# Plan de tranche hors cycle — `B3 budget-de-contexte` · lot unique + journal

> Statut : **`validé`** — cadrée par le `tech-lead` seul (précédent `B2 outillage-2`, sans comité), arbitrée par l'utilisateur le 2026-09-24.
> Exécution : **séquentielle**, 2 lots, 1 ouvrier. Pas d'essaim, pas de worktree.
> À passer **AVANT** `moteur-dossier` it3 (arbitrage option (a), inscrit dans les `open_questions` de la spec de la n° 9).

## Fiche de validation

| | |
|---|---|
| **But** | `code-knowledge.json` retrouve de la marge, et les **17 KR** du cadrage de la n° 9 y entrent enfin. |
| **Tranche** | documentaire + un test miroir. **Zéro ligne de code de production.** |
| **Lots** | **2** · L1 `contrat` (les ids que L2 consigne) · L2 journal + doctrine |
| **Hors périmètre** | toute scission de `bug_history.json` / `features_history.json` · toute correction de code · le groupe `dossier-*` · `dossier-format/specification.json` · `CLAUDE.md` · l'itération 3 |
| **Décidé par l'utilisateur** | **(1)** forme réduite · **(2)** D-2 : la re-dérivation reçoit un **plancher `5 × la plus grosse entrée`** pour les fichiers append-only |

### Pourquoi la forme est RÉDUITE, et c'est une conséquence mesurée du plancher

Le plancher adopté en D-2 ne concerne pas que `bug_history.json`. **Mesuré :**

| Fichier | Mesuré | Plafond cliqueté | Plus grosse entrée | Plafond **avec plancher** | État |
|---|---:|---:|---:|---:|---|
| `bug_history.json` | 8 082 | 5 120 → franchi | 2 007 (BUG-120) | **10 240** | sous le plafond, marge 2 158 |
| `features_history.json` | 11 934 | 10 240 → franchi | 4 296 (`dossier-copilote`) | **25 600** | sous le plafond, marge 13 666 |

Le cadrage n'avait chiffré le plancher que sur `bug_history.json`, où il conclut justement « il ne desserre rien » (5 → 10 kio, la valeur d'avant la re-dérivation). Sur `features_history.json` il porte le plafond de 10 à **25 kio**. **Les deux dépassements qui motivaient les lots 2 et 3 du cadrage disparaissent** : ces deux lots sont retirés.

**Ce qui ne bouge pas d'un octet** : `code-knowledge.json` à **76 690 / 76 800 — 110 o de marge** — et les 17 KR à y faire entrer. Le plancher ne s'y applique pas : ce fichier **se compacte**, il n'est pas append-only.

### Corollaire : les six KR de promotion tombent à trois

Les six `KR-255…260` du cadrage servaient à remplir la **condition n° 1** du `_about` de `features_history.json`, pour débloquer une scission qui n'a plus lieu. Il en reste **trois**, qui sont de vrais risques de code et non des leçons de process :

- **KR-255** — une ancre `\b` sur le `textContent` d'un CONTENEUR ne sépare rien (le DOM concatène sans séparateur, la frontière n'existe jamais). BUG-120.
- **KR-256** — quand une tranche écrit une RÈGLE **et** du code qui en dépend, relire le code à la lumière de la règle qu'elle vient d'écrire. BUG-121.
- **KR-257** — un contenu à échappements écrit à travers un heredoc shell puis une chaîne non brute perd un niveau à chaque couche, **en silence**. BUG-122.

Les leçons de process de `dossier-copilote` et `dossier-canon` it5 **n'entrent pas** : `code-knowledge.json` est un registre de risques de **code**, et ces leçons vivent déjà dans la skill `raffinage-iteration`, qui est en lecture obligatoire pour qui les applique. Les y promouvoir n'était qu'un moyen d'une scission annulée.

### La zone d'atterrissage

| | |
|---|---:|
| Mesure actuelle | 76 690 o |
| + 17 KR en forme compacte | ≈ 6 320 o |
| + 3 KR de promotion | ≈ 1 050 o |
| **Avant compaction** | **≈ 84 060 o** |
| Relief disponible (compaction 9 892 + scission 9 165) | ≈ 19 057 o |

**Cible : atterrir dans [66 561 ; 68 000] o** → plafond re-dérivé **70 kio**, marge **3,7 à 5,1 kio**. On applique donc ~16 à 17,5 kio des 19 disponibles et **on laisse délibérément du relief sur la table** : sous `ceil`, compacter au maximum (66 054 o) re-dérive à 65 kio et ne laisse que 507 o — la tranche suivante rouvrirait le chantier. **L'optimum de la formule n'est pas le minimum du fichier.**

## Lot 1 — `code-knowledge` · **`contrat`** (seul, en premier)

- **Ouvrier** : `dev-contrat`, effort élevé.
- **Fichiers** :
  - (R) `code-knowledge.json`
  - (N) `code-knowledge.arbre-condamne.json`
  - (N) `src/brain/codeKnowledge.test.ts`
  - (R) `src/features/cloud-sync/specification.json`
  - (R) `src/features/play-mode/specification.json`
  - (R) `src/features/book-library/specification.json`
  - (R) `src/features/tree-canvas/specification.json`

### Les trois mouvements, dans cet ordre

**(a) COMPACTION — aucun changement de doctrine, précédent existant.** `KR-095` porte déjà la phrase « *Corps déplacé dans `src/features/cloud-sync/specification.json` au franchissement du plafond le 2026-08-13* ». On **rejoue ce précédent** sur les 19 entrées de `cloud-sync` + `play-mode` + `game-system` et les 10 de `tree-canvas` + `book-library` : le corps descend dans le `specification.json` de la feature, l'entrée garde **son id** et une ligne de renvoi. Gain mesuré ≈ **9 167 o**. Plus `KR-109`, `KR-110`, `KR-113` réduits au renvoi vers leur règle ESLint (+ `_about` retaillé) : ≈ **725 o**.

**(b) SCISSION — décidée par l'utilisateur.** Les **29 entrées** des features supprimées le 2026-08-03 (`node-editor`, `choice-linking`, `outline-view`, `action-*`, `book-export`) décrivent du code **qui n'existe pas** et n'ont **aucune spec cible**. Elles **déménagent** vers `code-knowledge.arbre-condamne.json` — jamais supprimées : « *compacter n'est pas supprimer, c'est déplacer là où c'est lu au bon moment* ». Le `_about` du fichier vivant **nomme le déclencheur de relecture** : la démolition de frontière de la n° 9 (KR-181 amendé par KR-240) et tout repointage futur de `tree-canvas`. Gain ≈ **9 165 o**.

**(c) RATTRAPAGE.** Les 17 `KR-237`…`KR-253` entrent **en forme compacte** — invariant portable + renvoi vers `src/features/moteur-dossier/specification.json` — **ids inchangés, jamais renumérotés**. Plus `KR-255`, `KR-256`, `KR-257` ci-dessus.

### Porte d'entrée du lot, obligatoire

**Mesurer les 4 specs cibles AVANT d'y déplacer un corps** (`git show :fichier | wc -c`, octets LF). Le plafond par spec est **65 kio (66 560)**. Si une cible franchit en recevant son corps, **elle se compacte dans ce même lot**. `src/features/dossier-format/specification.json` (66 436 / 66 560, 124 o) n'est **pas** une cible et n'est pas ouvert.

### L'interface exposée — ce que L2 consigne sans le recalculer

`src/brain/codeKnowledge.test.ts`, **périmètre dérivé du disque** (précédents `lintIsolation.test.ts`, `moteurSansIA.test.ts`), chemins par `path.join` et jamais un littéral à barres obliques (KR-215, Windows) :

```
SOURCES   : <racine>/code-knowledge*.json       -> union des known_risks[].id
            src/features/*/specification.json   -> plan.known_risks[], id par /^KR-(\d{3})\b/
            <racine>/bug_history*.json          -> union des bugs[].id
ASSERTIONS
  1. tout id cité dans une spec appartient à l'union — ÉCHOUE EN NOMMANT les ids manquants
  2. aucun id KR n'apparaît deux fois dans l'union   (ids stables, jamais renumérotés)
  3. tout code-knowledge*.json / bug_history*.json / features_history*.json parse en JSON
  4. bug_history.json contient BUG-074              (mandat explicite de son _about)
  5. aucun id BUG n'apparaît deux fois sur les huit fichiers (la règle que BUG-062 a enfreinte)
```

**Chacune ferme un défaut que le dépôt a réellement payé** : 17 KR non mirrorés, renumérotation, scission fausse (BUG-086), BUG-074 archivé par erreur, BUG-062.

⚠ **L'assertion 5 dit HUIT fichiers, pas neuf** : le 9ᵉ `bug_history` du cadrage appartenait au lot 3, retiré. Le `_about` de `bug_history.json` n'est **pas** touché.

## Lot 2 — `journal et doctrine` (après L1)

- **Ouvrier** : `dev-lot`.
- **Fichiers** : (R) `docs/WORKFLOW.md` · (R) `CHANGELOG.md` · (R) `docs/ROADMAP-BASCULE-IA.md` (§ 2 bis) · (R) `README.md` · (R) `src/features/moteur-dossier/specification.json` (fermeture de l'`open_question`) · (R) `package.json` (PATCH +1)

### (a) Le plancher entre dans la doctrine — une ligne qui en REMPLACE une

`docs/WORKFLOW.md` § Budget de contexte. La phrase **« L'arrondi EST la marche — il n'y en a pas d'autre : n'ajoute jamais 5 kio "parce que ce fichier-là grossit normalement", ce serait re-desserrer le plafond que le cliquet vient de resserrer. »** (~230 o) devient **fausse** dès qu'un plancher existe : elle est **remplacée**, jamais doublée. Le couple est à 45 880 / 46 080 (200 o de marge) — bilan net ≈ 0 o, à **vérifier après écriture**.

Formule à écrire : **`plafond = max( ceil(mesure ÷ 5 kio) × 5 kio , ceil(5 × la plus grosse entrée ÷ 5 kio) × 5 kio )`, le second terme ne valant QUE pour les fichiers append-only** (`bug_history*`, `features_history*`), qui se **scindent** et ne se compactent pas. Motif, en une phrase : un plafond qui vaut trois entrées sur un fichier qui ne fait que croître se franchit à chaque itération, et un cliquet franchi à chaque itération est un décor.

### (b) La table redevient le registre écrit du cliquet

Elle **ment aujourd'hui sur deux lignes** — elle annonce 4,17 kio de marge sur `features_history.json`, franchi de 1 694 o. Les six rangées sont **réécrites sur mesure**, aucune rangée ajoutée ni retirée. Mesures à relever en fin de lot 1, jamais recopiées d'ici.

## Critères d'acceptation

1. **Étant donné** `src/brain/codeKnowledge.test.ts` livré, **quand** on retire de `code-knowledge.json` une entrée dont l'id est cité dans un `plan.known_risks`, **alors** `npm test` échoue **en nommant l'id manquant** ; l'entrée remise, il repasse vert. *Mutant posé et vu ROUGE dans le lot qui le livre — un instrument qui ne sait pas échouer ne mesure rien.* — *L1*
2. **Étant donné** les ids `KR-237` à `KR-253` cités dans la spec de la n° 9, **quand** `npm test` tourne, **alors** l'assertion 1 est verte : les 17 sont mirrorés. — *L1*
3. **Étant donné** `code-knowledge.arbre-condamne.json` créé, **quand** un id n'y vit que là, **alors** le test le compte comme mirroré — l'union est bâtie sur le **glob** `code-knowledge*.json`, jamais sur une liste écrite à la main. — *L1*
4. **Étant donné** les huit `bug_history*.json`, **quand** `npm test` tourne, **alors** `BUG-074` est dans `bug_history.json` et aucun id `BUG-xxx` n'est employé deux fois. — *L1*
5. **Étant donné** que la tranche est documentaire, **quand** on liste `git diff --name-only`, **alors** le **seul** `.ts`/`.tsx` du diff est `src/brain/codeKnowledge.test.ts`, et `prettier` → `tsc --noEmit` → `eslint` → `jest` sont verts. — *L1 et L2*
6. **Étant donné** les 29 entrées déménagées, **quand** on compare les ids avant/après, **alors** **aucun n'a disparu ni changé** : union(`code-knowledge.json`, `code-knowledge.arbre-condamne.json`) = l'ensemble d'avant, **assertion écrite dans le lot**. — *L1*
7. **Étant donné** la phrase « L'arrondi EST la marche » de `docs/WORKFLOW.md`, **quand** le lot 2 s'exécute, **alors** elle est **remplacée** par la formule à plancher — `grep` rend **zéro** occurrence de l'ancienne — et le couple toujours-chargé est **remesuré** sous 46 080. — *L2*
8. **MESURE CONSIGNÉE, pas pass/fail** — **Étant donné** les fichiers après la tranche, **quand** on relève `git show :fichier | wc -c`, **alors** les six rangées de la table portent la mesure **et** le plafond re-dérivé, `code-knowledge.json` atterrissant dans **[66 561 ; 68 000] o**. *Aucun instrument du dépôt ne garde un plafond, et on n'en crée pas : une sonde qui échoue bloquerait la livraison, ce que la doctrine interdit.* — *L2*

## Hors périmètre

- **Toute scission de `bug_history.json` ou `features_history.json`** — annulée par le plancher, mesuré ci-dessus. Aucun 9ᵉ `bug_history`, aucun déplacement vers `features_history.0.6.x-anterieures.json`, aucun `_about` de ces deux fichiers touché.
- **La correction de BUG-074** (`BlocPresence.tsx`) : c'est du code de production. L'entrée reste où son `_about` la cloue.
- **Le groupe `dossier-*`** (71 entrées, ≈ 38 kio) : c'est le schéma vivant, ce que le Temps 2 lit le plus.
- **`src/features/dossier-format/specification.json`** (124 o de marge) : n'est pas une cible.
- **Une scission de `code-knowledge.json` par feature ou par temps** : refusée (BUG-086).
- **Toute renumérotation d'id**, KR ou BUG.
- **`CLAUDE.md`**, et tout `.ts`/`.tsx` de production.
- **L'itération 3 de `moteur-dossier`**, qui reprend après.

## Définition de fini

- [ ] `npm run format` → `npx tsc --noEmit` → `npm run lint` → `npx jest` verts
- [ ] Le mutant du critère 1 écrit, **vu ROUGE**, révoqué
- [ ] Les 8 critères cochés un par un
- [ ] Les six rangées de la table **remesurées**, jamais recopiées
- [ ] `grep` sur « L'arrondi EST la marche » → **zéro**
- [ ] Couple toujours-chargé remesuré **sous 46 080**
- [ ] `open_questions` de la n° 9 : l'entrée des deux plafonds **fermée** (elle est devenue une décision)
- [ ] Revue écrite : `.claude/raffinage/budget-it1.revue.md`
