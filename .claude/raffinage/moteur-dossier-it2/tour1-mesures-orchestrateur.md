# Mesures de l'orchestrateur, entre le tour 1 et le tour 2

Leçon n° 3 de la revue d'it1 : « l'orchestrateur a rejoué au dépôt l'affirmation la plus load-bearing du tour 1 **avant** d'ouvrir le tour 2. Elle était fausse, et elle a changé la forme de l'itération. » Voici les relevés. **Ils font foi sur les notes du tour 1.**

## Ce qui est CONFIRMÉ

| # | Affirmation | Auteur | Relevé |
|---|---|---|---|
| M-1 | `expr.test.ts` balaie `brain/dossier/` pour `/\.?\bop\s*===\s*'/` et `/\bswitch\s*\(\s*[\w.]*\bop\s*\)/`, **commentaires compris**, et compare la liste triée à `[atteignabilite.ts, expr.ts, tourzero.ts]` | tech-lead | **VRAI**. `fichiersDuModule()` (`:349-354`) filtre `.ts` **et exclut `.test.ts`** — le piège ne vise donc que les fichiers de production. Un `commandes.ts` contenant `op === '` même en docstring ferait rougir `:420` |
| M-2 | La garde anti-parseur (`parseExpr`/`parseCondition`/`compileExpr`/`lexExpr`) ne couvre que `brain/dossier/` | tech-lead | **VRAI** — et **plus large qu'annoncé** : elle balaie `readdirSync(MODULE_DOSSIER).filter(endsWith('.ts'))`, donc **tests compris**. `commandes.test.ts` y est soumis aussi |
| M-3 | `CloudSyncService.get` délègue à `local.get` ⟹ un critère de RELECTURE serait vert dans les deux magasins (coïncidence, BUG-113) | tech-lead | **VRAI** (`get<T>(key) { return local.get<T>(key) }`) |
| M-4 | `CloudSyncService.remove()` ne propage rien | tech-lead | **VRAI** (`remove(key) { local.remove(key) }`, sans `queue`) |
| M-5 | `queuePush` sort tôt sans transport ⟹ une assertion `pendingCount() === 0` est VACUE sans contre-épreuve | tech-lead | **VRAI** (`if (transport === undefined) return`). La contre-épreuve exigée est justifiée |
| M-6 | `Field` box est en `--font-ui` ; `FieldProps` n'a ni `mono` ni `list` ; l'extension est additive | ux | **VRAI** (`shared.fontFamily: 'var(--font-ui)'`). **25 appelants** relevés au dépôt |
| M-7 | `ListRow.onSelect` est REQUIS (« aucune variante non interactive n'a d'appelant ») | ux | **VRAI** |
| M-8 | `deplacer_vers` est écarté nommément de `DELTAS` | qa | **VRAI** — un déplacement n'est pas un delta, la transition est bespoke |
| M-9 | `destinations.ts` porte « le moteur refuse toute destination absente de cette liste, MÊME SI LA PROSE L'A RACONTÉE. La règle vit ICI, en DONNÉE » sur `'monde.lieux[].acces[]': 'moteur'` (`:404-410`) | narratif | **VRAI**. it2 est bien le premier exécutant de cette phrase |
| M-10 | `defineRegistre` et `EspaceDeNoms` (`lieu` inclus) sont exportés par `identifiers.ts` | tech-lead | **VRAI** (`identifiers.ts:27-30`, `:41-44`) |
| M-11 | `docs/REGLES-PLAY.md § J1` réserve à la n° 9 ce que vaut UN pas d'horloge | narratif | **VRAI**, et plus fort que cité — voir M-13 |

## Ce que les mesures FONT APPARAÎTRE, et que personne n'a soulevé

### M-12 — `Field.tsx` est un fichier de `brain/`, donc l'extension proposée par l'UX est un geste de lot `contrat`

`src/brain/components/Field.tsx`. La règle du dépôt : **tout lot touchant `brain/` est marqué `contrat` et ordonné en premier.** Or :
- L1 (`contrat`, tech-lead) **ne liste pas** `Field.tsx` ;
- L2 a pour territoire **exclusif** `src/features/play-mode/**`.

Donc, tel qu'écrit, **le contrat de design de l'UX n'est réalisable par aucun lot du découpage du tech-lead**. Trois issues, et le tour 2 doit en choisir une :
(a) `Field.tsx` entre dans L1 (+2 props, 25 appelants inchangés) ;
(b) la console n'utilise pas `Field` et rend son `<input>` en propre dans `play-mode` — au prix d'un composant de saisie maison, ce que l'UX a précisément voulu éviter ;
(c) la console utilise `Field` **tel quel**, sans `mono` ni `list` — donc sans `<datalist>` et avec une boîte en `--font-ui` pour une saisie d'identifiants.

### M-13 — `horloge.tour` porte déjà le mot que `REGLES-PLAY.md` réserve au combat

`§ J1` écrit, verbatim : « *Ce que vaut UN pas n'est pas tranché ici : propriété de la feature n° 9 `moteur-dossier` (n° 14 pour son avancement). **Le mot « tour » reste réservé au round de combat par `REGLES-DU-JEU.md`.*** »

Or `EtatSession.horloge.tour` est **livré depuis it1** et épinglé en trois endroits : `session.test.ts:153` (`toEqual({ tour: 0 })`), `session.test.ts:178` (la liste triée des 8 racines), `sessionDestinations.ts:52` (`'horloge.tour'`) + `sessionCouverture.test.ts:41`. `REGLES-DU-JEU.md` dit bien **round** partout (§ 3).

**it2 est la première itération qui FAIT AVANCER cette horloge**, et l'UX propose de rendre `#{tour}` à l'écran dans chaque `JournalRow` : la collision de vocabulaire, invisible tant que la valeur restait 0 et interne, devient visible à l'auteur. Trois lectures possibles, à trancher :
(a) le champ garde son nom, et `§ J1` est amendé pour lever la réserve côté session (un pas d'horloge de session s'appelle « tour », le round de combat aussi, le contexte désambiguïse) ;
(b) le champ garde son nom mais **l'écran** ne dit jamais « tour » (`JournalRow` rend `#{n}` sans libellé, ou « pas ») ;
(c) le champ est renommé — **coût mesuré** : 4 sites de test/table + le contrat gelé d'it1, et aucun chemin de migration en `schema: 1`.

Rappel de doctrine : **`docs/REGLES-DU-JEU.md` / `REGLES-PLAY.md` font foi, et on corrige la doc, jamais l'inverse** (KR-130). Mais la doc désigne ici la n° 9 comme propriétaire : c'est donc à **cette itération** d'écrire la réponse dans `§ J1`, pas de la subir.

## Les cinq désaccords ouverts que le tour 2 doit traiter nommément

| # | Désaccord | Positions |
|---|---|---|
| **X-1** | **`Field.tsx` et le lot `contrat`** (M-12) | ux : extension `mono`+`list` · tech-lead : L1 ne le liste pas, L2 borné à `play-mode` |
| **X-2** | **`journal[].origine?`** | narratif : ADMIS (écrit par `commandes.ts`, lu par `JournalRow`, ligne d'audience `'moteur'`, sinon « la première ligne de journal du projet reste sans cause auditable, à vie ») · tech-lead **T-12** : aucun champ de session neuf en it2, `sessionDestinations.ts` et `sessionCouverture.test.ts` **hors de tout lot** |
| **X-3** | **Le rejeu** | narratif : `rejouer(dossier, graine, commandes)` PURE, de production · tech-lead **T-4** : REJETÉ, un seul appelant (KR-109), pliage écrit **dans le test** · qa : **aucun scénario séparateur n'existe en it2**, remplacer par un critère d'IMMUTABILITÉ ou reporter à la n° 11 |
| **X-4** | **Le port de stockage** | pm : « nomme ton second appelant réel et tranche la reprise, **sinon veto au tour 2** » · tech-lead : `ecrire` SEUL, reprise hors périmètre (**T-3**), **motif substitué** — le port ne se justifie plus par l'extractibilité mais par la frontière magasin brut / décorateur de synchronisation · qa : d'accord, **à condition que la revue l'écrive noir sur blanc** |
| **X-5** | **L'algorithme de la console** | ux : appartenance à un **ensemble fini** de commandes complètes, jamais un split — **mais** ses DEUX messages de refus distincts (verbe inconnu / destination hors accès) exigent de séparer verbe et argument · tech-lead : `analyserSaisie` fait un `split` sur l'espace, ≤ 2 jetons, lookup de registre |

**Convergence déjà acquise, à écrire et non à rejouer** : une commande refusée **n'est jamais journalisée** (ux, tech-lead F.1, narratif rejeté n° 2 — les trois indépendamment). Et : aucune ligne `'ia'`, `memoire` reste `null`, `EditorTopBar.tsx` hors de tout lot (D-6 toujours reporté faute du relevé navigateur).
