# Plan d'itération — `dossier-format` · itération `2`

> Statut : `validé` — porte 2 (humaine) franchie le 2026-08-04
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-04
> Composition : `5 rôles` — motif : l'itération fait entrer des **données moteur** dans la racine que la n° 10 déclare injectable, et tranche la frontière d'audience du schéma. Sans `narratif-ia`, la frontière code/IA se décide par défaut.
> Exécution : `séquentielle` (1 lot `contrat`, sans worktree)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut **voir refusé un dossier dont une donnée mécanique est mal formée**. » |
| **Tranche** | fichier `.json` écrit à la main → `inspectDossierFile` → `validateDossier` (4 codes neufs) → `ImportDossierDialog` état `invalid` → `IssueList` (générique depuis it1, aucun fichier de feature touché) |
| **Lots** | 1 lot · type `contrat` : **oui** (seul) |
| **Hors périmètre** | la forme complète des racines (décision A) · le type et la fonction `ProjectionCharpente` · tout protocole d'assemblage de contexte · `meta` comme racine |
| **Reporté** | 6 points — dont le protocole de révélation (n° 9-12) et la projection de charpente (n° 9) |
| **Innovation** | 1 — `DESTINATION_DES_CHAMPS` |

> ### ⚠ Cette itération AMENDE la décision B validée le 2026-08-04
>
> La décision B disait : « `ProjectionCharpente` typée portant les seules feuilles `…_texte` (`jalons[].declencheur_texte`, `fins[].condition_texte`) ». **Le comité l'a corrigée sur deux points, et il a raison sur les deux.**
>
> 1. **Mauvais contenu.** `declencheur_texte` est `declencheur_expr` **en français** : l'injecter met la même règle dans le code et dans le prompt, et apprend au modèle à provoquer le jalon. Le plan de cible § 1.5 promet « le moteur les coche ; l'IA reçoit *voici où on en est* » — ses exemples sont des **énoncés de fait** (« le sceau est brisé »), pas des déclencheurs. Idem `fins[].condition_texte` : un narrateur qui sait comment la partie finit y conduit.
> 2. **Mauvais endroit.** La projection dépend de `session.jalons_atteints` : ce n'est pas une projection du **dossier**, donc elle n'a rien à faire dans `brain/dossier/`. Le tech-lead a reconnu qu'il réintroduisait sous un autre nom le `construireContexte` que `resolved_decisions` avait déjà rejeté.
>
> **Ce qui survit de la décision B** : le principe que `charpente` n'est pas « jamais vue » mais « jamais vue entière ». **Ce qui change** : la charge utile devient l'**énoncé des jalons déjà atteints** (champ `enonce_texte`, neuf), et la projection part en **n° 9**, avec son assembleur et son test.
>
> **Ce qu'it2 en livre** : le champ `enonce_texte` et sa borne. Rien d'autre. `declencheur_texte` et `condition_texte` restent au schéma, destination **auteur + linter n° 7**, jamais injectés.

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut **voir refusé un dossier dont une donnée mécanique est mal formée** — une référence de monstre qui ne résout pas, une valeur hors énumération, un effet écrit en prose, une porte de révélation inconnue.

C'est la contrepartie observable des **corrections irréversibles** : celles qu'aucune migration ne rattrape et qui doivent précéder la n° 3 `dossier-canon`.

## 2 — Hors périmètre

- **La forme complète des treize racines** (décision A du 2026-08-04) : chaque racine reçoit sa forme complète dans la feature qui l'**édite** — `canon` en n° 3, `personnages` en n° 4, `lieux`/`objets`/`indices` en n° 5, `quetes`/`evenements`/`conditions` en n° 6. it2 ne pose que ce qui est **irréversible**.
- **Le type et la fonction `ProjectionCharpente`** — n° 9. Aucun critère de cette itération ne nomme sa forme finale (veto QA, veto PM).
- **Tout protocole d'assemblage de contexte** : `etatPorte()`, le schéma de sortie R4, le rejeu unique, l'interdiction de clamper `delta_confiance` — n° 9 à n° 12 (veto partiel PM). La **décision** entre en `resolved_decisions` ; le **code** non.
- **`meta` comme racine** : `titre` est déjà une racine de `Dossier`, `ton` vit sous `canon`, `meta.voix` a été rejeté. `auteur`/`public`/`duree_visee` n'ont ni éditeur ni lecteur. Décision actée, aucun code.
- **`BUDGET_CONTEXTE` et `MAX_SAVOIRS_PAR_PNJ`** — retirés par leur auteur (table sans lecteur) et reportés en n° 4 / n° 9.
- **Le type `Delta`** — it4. it2 pose `DeltaBrut` et l'interdiction de la prose, pas la forme des effets.
- **Le golden des `templateId` du bestiaire** — **déjà livré** : `rules.golden.test.ts:346` en épingle 22 par valeur et par ordre. À citer comme non-régression existante, pas à créer.

## 3 — Contrat de design

**Aucun fichier de feature n'est touché.** `IssueList.tsx` rend `location` / `message` / `dossierIssueRemediation(issue)` **sans brancher sur `code`** (vérifié), et la seule branche par code de la feature (`FILE_ERROR_MESSAGES`) est fermée sur `FileReadErrorCode`, intouché. Les quatre codes neufs remontent donc à l'écran **par la donnée**, sans une ligne de composant.

Contrepartie exigée par l'UX : **`validate.test.ts` asserte les textes verbatim**, jamais « non vide ».

### 3.1 — Casse des clés : `snake_case`, tranché

Toute clé neuve d'it2 en **`snake_case`** — `confiance_min`, `apres_indice_id`, `effets_regles`, `enonce_texte`, `declencheur_texte`, `condition_texte`, `monstre_ref`, `plan_actions`, `portee`, `certitude`, `revele_comment`. Le code livré à it1 est 100 % `snake_case` ; `createdAt`/`updatedAt` sont l'unique exception, motivée (horodatages ISO jamais tapés à la main). **La docstring de `types.ts:99` qui annonce `effetsRegles` en camelCase est périmée et se corrige dans le même lot.**

### 3.2 — Les quatre codes d'anomalie neufs

| code | canal | QUOI | QUOI FAIRE |
|---|---|---|---|
| `valeur-hors-enumeration` | `errors` | « Le champ « {champ} » vaut « {valeur} », qui n'est pas une valeur reconnue (attendu : {liste attendue}). » | « ↪ Remplacez cette valeur par l'une de celles attendues, puis réimportez-le. » |
| `delta-en-prose` | `errors` | « Le champ « {champ} » attend une liste d'effets structurés ; il contient du texte libre. » | « ↪ Remplacez ce texte par une liste d'effets, puis réimportez-le. » |
| `porte-inconnue` | `errors` | « Le savoir « {nom} » porte une condition de révélation « {champ} » qui n'existe pas dans le format (attendu : confiance minimale, jet, contrepartie, ou indice préalable). » | « ↪ Supprimez cette clé ou remplacez-la par l'une des quatre portes reconnues, puis réimportez-le. » |
| `revelation-sans-porte` | `warnings` | « Le savoir « {nom} » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » | « ↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même. » |

**Les marqueurs de la colonne QUOI sont interpolés au site d'appel dans `validate.ts`**, jamais stockés dans `DOSSIER_ISSUE_LABELS` — l'assertion existante « aucun marqueur résiduel » reste donc valide. **Jamais de nom de type TypeScript** dans `{liste attendue}` : écrire « premier ou second », pas `'premier' | 'second'`.

`revelation-sans-porte` ne se déclenche que si **les quatre portes sont absentes simultanément** ; une seule porte posée reste calme (l'absent calme d'it1). Il ne dégrade jamais le badge « Dossier valide » — même statut que `canon-trop-long`.

### 3.3 — `reference-pendante` généralisé

Son QUOI FAIRE est aujourd'hui **câblé en dur sur `depart.lieu_id`** (`issues.ts:62`) : `monstre_ref` en hériterait un texte trompeur — même famille que BUG-042. Nouveau texte à marqueur, résolu par `dossierIssueRemediation` **exactement comme `{racine}`** :

> « ↪ Corrigez « {champ} » ou ajoutez l'élément correspondant, puis réimportez-le. »

**OÙ pour `monstre_ref`** : l'entité résolue est l'**événement**, jamais le monstre (il n'existe pas dans le dossier) — « Événement « {nom} » », repli « Événement n°{index} (sans nom) », `bestiaire.{templateId}` entre parenthèses en `var(--font-mono)` / `var(--text-faint)`.

### 3.4 — JSDoc obligatoires (l'auteur tape ce JSON à la main)

```ts
/** La MANIÈRE dont le savoir se révèle — didascalie pour l'IA, injectée
 *  UNIQUEMENT quand la porte est ouverte. Jamais un dialogue verbatim.
 *  Exemple : « Elle hésite, puis chuchote, jetant un regard vers la porte. » */
revele_comment?: string

/** AUTEUR — ce qui déclenche ce jalon. Jamais injectée au modèle (dupliquerait
 *  declencheur_expr en prose). La n° 7 la lit pour son linter.
 *  Exemple : « Le joueur porte le sceau brisé devant l'Archiviste. » */
declencheur_texte: string

/** IA — énoncé à l'ACCOMPLI du fait établi, ≤ BUDGET_MOTS_JALON, injecté
 *  seulement si le jalon est atteint. Jamais la même phrase que
 *  declencheur_texte : celui-ci décrit la CONDITION, celui-là le FAIT.
 *  Exemple : « Le sceau est brisé ; l'Archiviste le sait. » */
enonce_texte: string

/** AUTEUR — condition de fin en langage naturel. Jamais injectée (un narrateur
 *  qui la connaît y conduit).
 *  Exemple : « Le héros a vaincu le Gardien ET porte la Clé d'Aldûr. » */
condition_texte: string
```

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `brain/dossier/types.ts` | type | modifie | `DeltaBrut = Record<string, unknown>` · `BUDGET_MOTS_JALON = 20` · `CONFIANCE_MIN = -3` / `CONFIANCE_MAX = 3` · `PlanAction { etape; action }` · `Revelation { confiance_min?; jet?: { carac: Characteristic; tc: ChallengeTier }; contrepartie?: { objet_id; consomme }; apres_indice_id? }` · `Savoir { indice_id; certitude: 'sait'\|'croit'\|'soupconne'; revele_comment?; revele_si? }` · `Personnage extends Entite { portee: 'premier'\|'second'; plan_actions: PlanAction[]; savoirs: Savoir[] }` · `Resolution { resultat; consequence: DeltaBrut[] }` · `Evenement extends Entite { monstre_ref?; resolutions: Resolution[] }` · `Quete extends Entite { recompense: DeltaBrut[] }` · `Climat extends Entite { effets_regles: DeltaBrut[] }` · `Conditions { climat: Climat[] }` · `Jalon extends Entite { enonce_texte; declencheur_texte; effet: DeltaBrut[] }` · `Fin extends Entite { condition_texte }` |
| `brain/dossier/destinations.ts` | registre | crée | `Destination = 'ia' \| 'moteur' \| 'auteur'` · `DESTINATION_DES_CHAMPS: Record<string, Destination>` — clés = chemins à **indices effacés** (`charpente.jalons[].enonce_texte`). **Docstring obligatoire** : ces clés sont des chaînes qu'aucun compilateur ne relie à `types.ts` ; l'exhaustivité est portée par `couverture.test.ts` et par rien d'autre |
| `brain/dossier/identifiers.ts` | registre | modifie | `ESPACES_DE_NOMS` 9 → **11** (`evenement` → « Événement », `climat` → « Climat ») · `COLLECTIONS_IDENTIFIEES` 8 → **10** · **`export function feuilleDe(path): string`** — montée depuis `validate.ts` (cycle vérifié : `validate.ts` importe déjà `issues.ts`), et elle **apprend à retirer l'indice de tableau** : `monde.evenements[3].monstre_ref` → `monstre_ref` |
| `brain/dossier/issues.ts` | registre | modifie | `DossierIssueCode` 8 → **12** codes · `DOSSIER_ISSUE_LABELS` étendu · `dossierIssueRemediation` gagne un **second `.replace`** pour `{champ}`. **Signature inchangée** |
| `brain/dossier/validate.ts` | service | modifie | `CHEMINS_DE_DELTAS` (4 entrées) · `PORTES_DE_REVELATION` (4 clés) · `ENUMERES_FERMES` (`portee`, `certitude`) · résolution `monstre_ref` contre `BESTIARY_BY_TEMPLATE`. **Des lignes de table, jamais des branches** (KR-117) |
| `brain/index.ts` | baril | modifie | ré-exporte les types neufs ; `DESTINATION_DES_CHAMPS` **n'est pas exporté** (aucun consommateur hors `brain/dossier/` avant la n° 10) |

**Vérifié, dans le domaine du tech-lead** : `bestiary.ts` n'importe que la couche règles — **jamais `tree.ts`**. Faire dépendre `validate.ts` du bestiaire ne fait pas revivre le modèle d'arbre dans le module dossier ; **KR-167 tient**.

## 5 — Lots

### Lot 1 — `contrat-dossier-it2` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul)
- **But** : les corrections irréversibles du schéma, les quatre codes d'anomalie, et le garde-fou de destination.
- **Fichiers créés (N) — 2** : `src/brain/dossier/destinations.ts` · `src/brain/dossier/couverture.test.ts`
- **Fichiers remplacés (R) — 9** : `src/brain/dossier/types.ts` · `identifiers.ts` · `issues.ts` · `validate.ts` · `validate.test.ts` · `identifiers.test.ts` · `roundtrip.test.ts` · `__fixtures__/dossier-minimal.json` · `src/brain/index.ts`
- **Non touchés** : `bestiary.ts` · `rules.golden.test.ts` (**déjà conforme**) · `freeze.ts` · `read.ts` · `DossierService.ts` · `CloudSyncService.ts` · `characteristics.ts` · `challenge.ts`. **Zéro fichier dans `src/features/**` et `src/player/**`.**
- **Expose** : les six contrats du § 4
- **Critères couverts** : #1 à #8

> **Un seul lot, et c'est un choix mesuré.** Tout second lot serait la coupe **horizontale** que la skill interdit (« schéma » vs « validateur »), ou nommerait `types.ts` / `validate.ts` / `index.ts` dans les deux — collision. L'essaim garde son sens (plan → ouvrier → intégrateur → QA mode B → dossier de revue) ; il perd le parallélisme, et gagne **zéro risque d'intégration** sur l'itération qui réécrit le contrat.

> **La fixture est l'entrée unique de l'instrument.** `dossier-minimal.json` doit porter **une occurrence de chaque champ neuf, y compris les optionnels** — `monde.evenements` est `[]` aujourd'hui, donc `monstre_ref` et `resolutions[].consequence` seraient invisibles au balayage. Elle reste `ok: true`.

## 6 — Critères d'acceptation

1. **Étant donné** un `evenements[].monstre_ref` valant `bestiaire.<inconnu>`, **quand** on valide, **alors** `reference-pendante` est bloquante, `location` nomme l'**événement** (jamais le monstre), et le QUOI FAIRE porte « monstre_ref » — `{champ}` résolu — *unitaire* — *lot 1*
2. **Étant donné** un `portee` ou un `certitude` hors de son énumération, **quand** on valide, **alors** `valeur-hors-enumeration` est bloquante, nomme la valeur fautive et les valeurs attendues **en français**, sans nom de type TypeScript — *unitaire* — *lot 1*
3. **Étant donné** une **chaîne** à l'un des quatre chemins de `CHEMINS_DE_DELTAS`, **quand** on valide, **alors** `delta-en-prose` est bloquante ; **étant donné** un objet aux mêmes chemins, **alors** il passe et traverse le round-trip intact — *unitaire* — *lot 1*
4. **Étant donné** un `revele_si` portant une clé hors des quatre portes, **quand** on valide, **alors** `porte-inconnue` est bloquante ; **étant donné** un `revele_si` dont les quatre portes sont absentes, **alors** `revelation-sans-porte` apparaît en `warnings`, `errors` reste vide et `ok` reste `true` — *unitaire* — *lot 1*
5. **Étant donné** un `enonce_texte` absent, puis à `BUDGET_MOTS_JALON` mots, puis à `BUDGET_MOTS_JALON + 1`, **quand** on valide, **alors** le premier est bloquant, le deuxième calme, le troisième un avertissement — chaque borne étant une constante **nommée** (KR-165) — *unitaire* — *lot 1*
6. **Étant donné** un `confiance_min` valant `CONFIANCE_MIN - 1` puis `CONFIANCE_MAX + 1`, **quand** on valide, **alors** chacun est refusé ; **étant donné** les deux bornes exactes, **alors** elles passent — *unitaire* — *lot 1*
7. **Étant donné** chaque feuille terminale de la fixture réelle, **quand** on la **corrompt** (valeur du mauvais type), **alors** la validation échoue — sauf si la feuille est nommée dans `LIBRES` avec son motif ; **et** chaque feuille a une entrée dans `DESTINATION_DES_CHAMPS`, sauf si elle est nommée dans `SANS_DESTINATION` avec son motif — *contrat* — *lot 1*
8. **Étant donné** la fixture enrichie lue depuis le disque, **quand** on l'importe puis on l'exporte, **alors** toutes les formes neuves survivent deep-equal, restent re-validables et gelées — *contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validate › monstre_ref pendant nomme l evenement, pas le monstre` | `reference-pendante`, `location` = l'événement | jest | KR-021, KR-164 | 1 |
| `validate › le QUOI FAIRE de reference-pendante resout {champ}` | « monstre_ref » et « lieu_id » selon le site | jest | KR-164 | 1 |
| `validate › portee hors enumeration est bloquant` | `valeur-hors-enumeration`, valeurs attendues en français | jest | KR-117 | 1 |
| `validate › certitude hors enumeration est bloquant` | idem, second site du même code | jest | KR-117 | 1 |
| `validate › une chaine a chacun des quatre chemins de delta est refusee` | **4 cas séparés** → `delta-en-prose` | jest | KR-162 | 1 |
| `validate › un objet aux quatre chemins de delta passe` | assertion discriminante du précédent | jest | KR-162 | 1 |
| `validate › une porte inconnue dans revele_si est bloquante` | `porte-inconnue` | jest | KR-117 | 1 |
| `validate › une revelation sans aucune porte avertit sans bloquer` | `warnings`, `ok:true`, `errors:[]` | jest | KR-165 | 1 |
| `validate › une seule porte posee reste calme` | discriminant du précédent | jest | — | 1 |
| `validate › enonce_texte absent / 20 mots / 21 mots` | bloquant / calme / avertissement | jest | KR-165 | 1 |
| `validate › confiance_min aux bornes et hors bornes` | limite et limite+1 des deux côtés | jest | KR-165 | 1 |
| `issues › les douze codes sont prefixes et sans marqueur residuel` | regex **généralisée** `/\{[a-z_]+\}/` sur tous les codes | jest | KR-164 | 1 |
| `issues › les textes des quatre codes neufs sont asserts VERBATIM` | égalité exacte, jamais « non vide » | jest | KR-164 | 1 |
| `couverture › toute feuille corrompue est refusee, ou nommee dans LIBRES` | balayage **pleine profondeur**, tableaux inclus | jest (contrat) | KR-169 | 1 |
| `couverture › toute feuille a une destination, ou est nommee dans SANS_DESTINATION` | même walker, une seule source | jest (contrat) | KR-169 | 1 |
| `couverture › une dispense nommant une feuille deja couverte est morte` | disjonction, héritée d'it1 | jest | BUG-044 | 1 |
| `identifiers › evenement et climat sont des espaces de noms` | `ESPACES_DE_NOMS` à 11 | jest | KR-117 | 1 |
| `identifiers › feuilleDe retire l indice de tableau` | `monde.evenements[3].monstre_ref` → `monstre_ref` | jest | — | 1 |
| `roundtrip › toutes les formes neuves survivent import puis export` | deep-equal + re-validable + gelé | jest (contrat) | KR-156, KR-166 | 1 |
| `types › DeltaBrut refuse une chaine a la compilation` | `@ts-expect-error` ciblé, sous `tsc` | tsc | KR-169 | 1 |

**Le walker est écrit UNE fois et exporté une fois.** Deux balayeurs de profondeurs différentes sur la même fixture divergeraient en silence — c'est précisément le mode de défaillance que ce test existe pour interdire.

**Le `describe('exhaustivite des tables du validateur')` de `validate.test.ts` est SUPPRIMÉ**, pas conservé à côté : il s'arrête à deux niveaux et exclut les tableaux, où vivent **tous** les champs d'it2 — il resterait vert sur du code faux. Classé `SUPPRIMÉ` au journal d'itération (KR-162).

**Changement de critère assumé** : « supprimer une clé → doit échouer » cesse d'être total dès qu'un optionnel entre dans la fixture (`revele_si`, `monstre_ref`). Le critère devient la **corruption** — valeur du mauvais type — qui subsume la suppression et vaut pour les optionnels contraints.

**Non vérifiable en l'état** — à recopier dans la revue :
- Aucun instrument ne prouve qu'une clé de `charpente` n'atteint pas un contexte IA : **aucun assembleur n'existe avant la n° 10**. `DESTINATION_DES_CHAMPS` déclare l'intention et force la déclaration ; elle ne prouve pas le confinement.
- Un `@ts-expect-error` prouve qu'**une** forme fautive nommée est rejetée, pas l'absence de toute autre voie d'élargissement.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | narratif-ia | Injecter `declencheur_texte` / `condition_texte` met la même règle dans le code et dans le prompt, et apprend au modèle à provoquer le jalon | `RETENU` (veto, dans son domaine) | **La décision B est amendée.** La projection sort d'it2, donc rien n'est injecté ici ; les deux champs restent au schéma, destination **auteur**. La roadmap § 5 et `types.ts:114` disaient déjà « jamais injectée à l'IA » — la décision B contredisait deux documents contraignants |
| 2 | narratif-ia | `ProjectionCharpente` dépend de `session.jalons_atteints` : ce n'est pas une projection du dossier | `RETENU` | Confirmé par le tech-lead, qui reconnaît réintroduire `construireContexte` sous un autre nom. **REPORTÉ → n° 9** |
| 3 | narratif-ia | `jalons[].enonce_texte` — le FAIT, pas la règle | `RETENU` | Lot 1. `nom` ne peut pas en tenir lieu : il est optionnel (un contexte alimenté par un optionnel se vide en silence), il est **interne** (`CLAUDE.md`), et il est déjà le OÙ du rapport d'anomalie |
| 4 | narratif-ia | `DESTINATION_DES_CHAMPS` — le `Pick` ne confine **rien dans `monde`**, et it2 y fait entrer des données moteur | `RETENU` — **INNOVATION** | Son auteur l'a retirée (« table sans lecteur ») ; je passe outre. Son argument vaut pour une *fonction* sans appelant ; une *table sous test d'exhaustivité* a un travail **immédiat** — forcer n° 3 à n° 6 à déclarer l'audience de chaque champ ajouté. **Condition ferme du tech-lead : la table n'entre qu'AVEC le balayage** |
| 5 | narratif-ia | `contrepartie: { objet_id, consomme }`, jamais de la prose | `RETENU` | Le moteur ne peut pas constater qu'un serment a été tenu : ce n'est pas une porte, c'est une intention — elle va dans `revele_comment` |
| 6 | narratif-ia | `certitude` obligatoire sur `Savoir` | `RETENU` | Sans elle une rumeur entre au carnet d'indices comme un fait établi, et le garde-fou « faits établis » défend une contradiction |
| 7 | narratif-ia | Golden des `templateId` du bestiaire | `REJETÉ` | **Déjà livré** : `rules.golden.test.ts:346` en épingle 22 par valeur et par ordre. Mesure de `narratif-ia` fausse (23) ; QA a mesuré juste |
| 8 | narratif-ia | Protocole de révélation : `etatPorte`, schéma R4, rejeu unique, clamp interdit | `REPORTÉ → n° 9-12` | Exige une `session` que rien en it2 ne construit (veto partiel PM). **La décision « les portes se ferment à l'ASSEMBLAGE du contexte, jamais par filtrage de la sortie » entre en `resolved_decisions` maintenant** — non écrite, la n° 11 filtrerait a posteriori et le joueur aurait déjà lu le secret |
| 9 | narratif-ia | `BUDGET_CONTEXTE`, `MAX_SAVOIRS_PAR_PNJ` | `REPORTÉ → n° 4 / n° 9` | Retirés par leur auteur : table sans lecteur. Les constantes **suivent leur champ** — d'où `BUDGET_MOTS_JALON` et `CONFIANCE_MIN/MAX` retenus, leurs champs étant au périmètre |
| 10 | tech-lead | « par construction » est faux — TypeScript est structurel | `RETENU` | Désaccord 1 d'it1, déjà `RETENU`. La propriété est portée par la table **et rien d'autre** : sans le balayage, l'itération livre une intention (KR-169) |
| 11 | tech-lead | `types.ts` / `destinations.ts` / `validate.ts` ne doivent **jamais** être dans un lot de type `feature` | `RETENU` (veto, dans son domaine) | Quatre features vont rouvrir ces fichiers. À écrire en `resolved_decisions` : **toute feature qui ajoute un champ au schéma ouvre un lot `contrat`, seul et premier** |
| 12 | tech-lead | Fusionner les trois sources de vérité du schéma (types / tables de validation / destinations) | `REJETÉ` | Trois questions disjointes — quelle forme, quoi refuser, qui lit. Les fondre produit un DSL de schéma à spécifier, versionner et tester : pire que la dérive qu'il corrige. Ce qui doit être unique est le **garde**, pas la table |
| 13 | tech-lead | `DeltaBrut` + `CHEMINS_DE_DELTAS` + `delta-en-prose` | `RETENU` | Contre le PM : ce n'est pas un type nu mais une **règle de refus testée** — un document refusé aujourd'hui, observable |
| 14 | tech-lead | `meta` n'est pas une racine | `RETENU` | Décision actée, aucun code. Sort du décompte des livrables (QA) |
| 15 | qa | L'instrument d'exhaustivité existant exclut **structurellement** les tableaux, où vivent tous les champs d'it2 | `RETENU` | La prise la plus solide du tour 1. Walker **pleine profondeur**, chemins normalisés, balayage de **tous** les éléments, couvert seulement si **chaque** instance rougit — sinon l'instrument ment plus qu'il n'informe |
| 16 | qa | Aucun critère d'it2 ne peut nommer la forme finale de `ProjectionCharpente` | `RETENU` (veto, dans son domaine) | Cohérent avec les désaccords 2 et 18 |
| 17 | qa | `@ts-expect-error` recevable, mais **ponctuel** | `RETENU` | Un par risque nommé, jamais un général |
| 18 | pm-produit | Sortir `Revelation` et les deltas d'it2 | `RETIRÉ` par son auteur | La forme resserrée est bon marché ; un champ optionnel ajouté en it3 n'est pas une migration. **Mais veto partiel maintenu sur le protocole** (désaccord 8) |
| 19 | pm-produit | La phrase de démo d'origine est un décalque de celle d'it1 | `RETENU en partie` | Sa phrase de remplacement énumérait trois cas à tirets — un « et » déguisé. Resserrée en « une donnée mécanique mal formée » |
| 20 | ux-designer | `snake_case` contre le `camelCase` de la signature du tech-lead | `RETENU` | Ergonomie de rédaction — son domaine. Le tech-lead a concédé ; la docstring périmée de `types.ts:99` se corrige dans le même lot |
| 21 | ux-designer | `reference-pendante` a son QUOI FAIRE câblé en dur sur `depart.lieu_id` | `RETENU` | Même famille que BUG-042. `feuilleDe` **monte dans `identifiers.ts`** — cycle vérifié : `validate.ts` importe déjà `issues.ts` |
| 22 | ux-designer | `valeur-hors-enumeration` et `revelation-sans-porte` | `RETENU` | Sans le premier, une `portee` valant « troisieme » passe **en silence** |
| 23 | ux-designer | `delta-en-prose` et `porte-inconnue` étaient introduits **sans texte** | `RETENU` | Sans eux un ouvrier les invente. Textes au § 3.2 |
| 24 | ux-designer | JSDoc avec **exemple écrit** sur les champs de prose | `RETENU` | L'auteur tape ce JSON à la main jusqu'à la n° 3 |
| 25 | ux-designer | Les textes doivent être assertés **verbatim**, jamais « non vide » | `RETENU` | Contrepartie du fait qu'aucun écran ne les rend avant la n° 2 |

## 9 — Innovation

**`DESTINATION_DES_CHAMPS`** — un `Record` fermé `chemin → 'ia' | 'moteur' | 'auteur'`, sous test d'exhaustivité.

- **La règle qu'elle infléchit** : « une abstraction à un seul appelant est une dette », et son corollaire appliqué deux fois dans cette feature — `construireContexte` et `list`/`remove` sont sortis faute de lecteur. Cette table **n'a aucun lecteur avant la n° 10**.
- **Ce qu'elle coûte** : un fichier, une ligne par champ terminal, et une assertion dans un balayage qui existe déjà par ailleurs. Elle grandit d'une ligne à chaque champ ajouté par n° 3 à n° 6.
- **Ce qu'on perd sans elle** : `Pick<Dossier, 'canon' | 'monde'>` est la seule signature de confinement dont on dispose, et **elle ne confine rien dans `monde`** — or it2 y fait entrer `evenements[].proba`, `resolutions[].consequence`, `plan_actions[].declencheur_expr`, `contre_mesures[]`, `climat[].effets_regles`, et `monstre_ref` qui résout vers `pv` / `armour` / `capacity`. Le jour où la n° 10 écrit ce `Pick`, elle envoie tout cela au modèle. La table est ce qui transforme une découverte de la n° 10 en une déclaration obligatoire de la n° 3.

Ce qui la distingue d'une abstraction sans appelant : **son test la lit dès aujourd'hui**, et il rougit dès qu'un champ arrive sans destination.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] **Non-régression** : les 559 tests d'it1 restent verts, à l'exception du `describe('exhaustivite des tables du validateur')` **explicitement SUPPRIMÉ** et remplacé par `couverture.test.ts` — classé `SUPPRIMÉ` au journal (KR-162)
- [ ] **Zéro ligne** dans `src/features/**` et `src/player/**`
- [ ] `npm run test:mutation` : **sans objet** (KR-161) — aucun des 4 fichiers mutés n'est touché ; `stryker.config.json` intact
- [ ] Tests du § 7 écrits et passants ; les quatre textes neufs assertés **verbatim**
- [ ] Critères du § 6 cochés un par un
- [ ] Aucun fichier touché hors de la liste du lot
- [ ] Le walker de couverture est écrit **une seule fois** et exporté ; `grep` confirme qu'il n'en existe pas un second
- [ ] `DESTINATION_DES_CHAMPS` n'est **pas** exporté du baril `brain/index.ts`
- [ ] Toute clé neuve est en `snake_case` ; la docstring `effetsRegles` de `types.ts:99` est corrigée
- [ ] **BUG-043 reste ouvert** : la précondition de provenance de `validateDossier` se clôt à la **feature n° 2 `bascule-editeur`**, pas à cette itération 2 — ne pas compter sa non-fermeture comme un trou (précision QA)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-format-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | Phrase de démo resserrée · protocole hors périmètre (veto partiel retenu) · `meta` en décision et non en livrable |
| Tech Lead | approuvé sous réserve | Lot unique `contrat` · `projeterCharpente` retirée par son auteur · **veto retenu** sur les trois fichiers de schéma jamais en lot `feature` · table acceptée **avec** son balayage |
| UX | feu vert sous réserve | `snake_case` tranché · quatre textes écrits · `{champ}` généralisé · JSDoc à exemples · textes assertés verbatim |
| QA | conditionnel → levé | Angle mort des tableaux corrigé par un walker unique pleine profondeur · **veto retenu** sur `ProjectionCharpente` · golden du bestiaire reconnu déjà livré · BUG-043 désambiguïsé |
| Narratif & IA | recevable sous réserve | **Veto retenu** — les déclencheurs ne sont pas injectés, la décision B est amendée · `enonce_texte` retenu · `contrepartie` structurée · `certitude` obligatoire · protocole reporté mais **sa décision écrite maintenant** |
