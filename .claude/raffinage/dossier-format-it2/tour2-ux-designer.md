# Tour 2 — `ux-designer` · `dossier-format` it2

## Réponses nommées

**À `narratif-ia` (`contrepartie`)** — accepté : `{ objet_id, consomme }` ferme mon objection, plus de prose donc plus de suffixe à trancher. Reste un point : `revele_comment` demeure un champ de prose **non suffixé**, posé à côté d'un objet désormais structuré. Je ne demande pas de renommage, mais j'exige un **JSDoc avec exemple écrit**, pour qu'un auteur qui tape ce JSON à la main sache que c'est une didascalie pour l'IA, pas un dialogue verbatim.

**À `narratif-ia` et au `tech-lead` (casse)** — je tranche pour **`snake_case`**. Le code déjà livré est **100 % snake_case** hors `createdAt`/`updatedAt`, deux horodatages ISO **jamais tapés à la main**. La signature du tech-lead (`confianceMin`, `apresIndiceId`, `effetsRegles`) rompt ce précédent sans motif nouveau. **OBJECTION, pas veto** — ce n'est ni un token ni un registre de langue, c'est une cohérence de contrat de données — **mais à corriger avant code**.

**À `qa` (marqueurs résiduels)** — vérifié. Seule ma proposition A porte un marqueur en QUOI FAIRE (`{champ}`), déjà scopée pour résolution comme `{racine}`. B et C ont zéro marqueur en QUOI FAIRE ; leurs marqueurs sont dans `message`, jamais stocké en `Record`, donc hors du test incriminé. **Rien à corriger.**

**Trois registres sur le même objet** (`enonce_texte` / `declencheur_texte` / `declencheur_expr`) — lisible **par rôle**, pas par destinataire : encoder l'audience dans le nom double l'information et complique la frappe. Exigence à la place : **doc + exemple sur chaque champ**.

**Zéro fichier feature** — j'accepte. `IssueList.tsx` est générique (vérifié), le test BUG-040 couvre déjà l'anatomie entière pour un code arbitraire. Seule exigence : **`validate.test.ts` doit asserter mes textes verbatim**, pas « non vide ».

## Statut de mes objections

| # | Statut |
|---|---|
| Registre `contrepartie` | **RETIRÉE** (structurée) |
| `{champ}` sur `reference-pendante` | **MAINTENUE** |
| `valeur-hors-enumeration` | **MAINTENUE** |
| `revelation-sans-porte` | **MAINTENUE** |
| `revele_comment` sans doc/exemple | **NOUVELLE OBJECTION** (corrective) |
| `snake_case` vs `camelCase` | **NOUVELLE OBJECTION**, à corriger avant code |

## ANNEXE — textes et JSDoc

### `delta-en-prose` — canal `errors`

| QUOI | QUOI FAIRE |
|---|---|
| « Le champ « {champ} » attend une liste d'effets structurés ; il contient du texte libre. » | « ↪ Remplacez ce texte par une liste d'effets, puis réimportez-le. » |

### `porte-inconnue` — canal `errors`

| QUOI | QUOI FAIRE |
|---|---|
| « Le savoir « {nom} » porte une condition de révélation « {champ} » qui n'existe pas dans le format (attendu : confiance minimale, jet, contrepartie, ou indice préalable). » | « ↪ Supprimez cette clé ou remplacez-la par l'une des quatre portes reconnues, puis réimportez-le. » |

### `valeur-hors-enumeration` — canal `errors`

| QUOI | QUOI FAIRE |
|---|---|
| « Le champ « {champ} » vaut « {valeur} », qui n'est pas une valeur reconnue (attendu : {liste attendue}). » | « ↪ Remplacez cette valeur par l'une de celles attendues, puis réimportez-le. » |

**Jamais de nom de type TypeScript** dans `{liste attendue}` — « premier ou second », pas `'premier' \| 'second'`.

### `revelation-sans-porte` — canal `warnings`

| QUOI | QUOI FAIRE |
|---|---|
| « Le savoir « {nom} » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » | « ↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même. » |

### `reference-pendante` — QUOI FAIRE généralisé

« ↪ Corrigez « {champ} » ou ajoutez l'élément correspondant, puis réimportez-le. » — `{champ}` résolu à la **feuille** du `path`.

**OÙ pour `monstre_ref`** : l'entité résolue est l'**événement**, pas le monstre (il n'existe pas dans le dossier) — « Événement « {nom} » », repli « Événement n°{index} (sans nom) », `bestiaire.{templateId}` entre parenthèses en mono/`--text-faint`.

### JSDoc exigés

```ts
/** La MANIÈRE dont le savoir se révèle — didascalie pour l'IA, injectée
 *  UNIQUEMENT quand la porte est ouverte. Jamais un dialogue verbatim.
 *  Exemple : « Elle hésite, puis chuchote, jetant un regard vers la porte. » */
revele_comment?: string

/** AUTEUR — ce qui déclenche ce jalon. Jamais injectée au modèle (dupliquerait
 *  declencheur_expr en prose). La n° 7 la lit pour son linter.
 *  Exemple : « Le joueur porte le sceau brisé devant l'Archiviste. » */
declencheur_texte: string

/** IA — énoncé à l'ACCOMPLI du fait établi, ≤ 20 mots, injecté seulement si le
 *  jalon est atteint. Jamais la même phrase que declencheur_texte : celui-ci
 *  décrit la CONDITION, celui-là le FAIT.
 *  Exemple : « Le sceau est brisé ; l'Archiviste le sait. » */
enonce_texte: string

/** AUTEUR — condition de fin en langage naturel. Jamais injectée (un narrateur
 *  qui la connaît y conduit).
 *  Exemple : « Le héros a vaincu le Gardien ET porte la Clé d'Aldûr. » */
condition_texte: string
```

### Position finale sur la casse

Toute clé neuve d'it2 en **`snake_case`** : `confiance_min`, `apres_indice_id`, `effets_regles`, `enonce_texte`, `declencheur_texte`, `condition_texte`, `monstre_ref`, `plan_actions`, `portee`. `createdAt`/`updatedAt` restent l'unique exception, motivée.
