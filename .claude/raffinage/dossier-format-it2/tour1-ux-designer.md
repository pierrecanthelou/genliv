# Tour 1 — `ux-designer` · `dossier-format` it2

**RISQUE** — Aucun écran (confirmé), mais deux failles concrètes surgissent de l'extension. `reference-pendante` a son QUOI FAIRE **câblé en dur sur `depart.lieu_id`** (`issues.ts:62`) : `monstre_ref` (point 4), DEUXIÈME référence de ce type, en hériterait un texte **trompeur** — même famille que BUG-042. `portee` (point 1) est un énuméré fermé qu'**aucune table actuelle** ne sait refuser hors énumération (`RACINES`/`CHAMPS_REQUIS` ne testent que présence/non-vide) : une valeur invalide (« troisieme ») passe **en silence**.

**OBJECTION** — Registre : `contrepartie` de `Revelation` n'est pas suffixé, donc lu par défaut comme auteur/MJ — mais s'il nourrit le contexte IA en fait déclaratif, il appartient au registre `…_texte` établi par D1. Confondre les deux est exactement le veto que je porte ; **à trancher avant code**, pas laissé à l'ouvrier. `plan_actions[]` n'a aucun champ nommé au cadrage : rien à juger, mais tout texte adressé au joueur qu'il contiendra portera `_joueur`.

**PROPOSITION** — Généraliser `reference-pendante` par un marqueur `{champ}` (même mécanisme que `{racine}`). Ajouter `valeur-hors-enumeration` pour `portee`. Trancher `contrepartie` → `contrepartie_texte` si IA-facing, sinon documenter l'exception dans le type. Une `Revelation` aux quatre portes absentes reste **CALME** (chaque porte est individuellement optionnelle), mais « rien n'est posé » est une intention distincte d'« indécis » — j'ajoute un **avertissement non bloquant** dédié, même registre que `canon-trop-long`.

**VERDICT** — **recevable sous réserve** : les trois textes d'annexe adoptés, `contrepartie` tranché avant code.

---

## ANNEXE — textes exacts

### A. `reference-pendante` — généraliser le QUOI FAIRE

Le QUOI FAIRE actuel est spécifique à `depart.lieu_id` — inexploitable pour `monstre_ref`. Remplacer par un texte à marqueur, résolu par `dossierIssueRemediation` **exactement comme `{racine}`** (même fonction, un second `.replace`) :

| canal | QUOI (au site d'appel) | QUOI FAIRE |
|---|---|---|
| `errors` | ex. `monstre_ref` : « L'événement « {nom évén.} » (`bestiaire.{templateId}`) ne correspond à aucun monstre du bestiaire. » | « ↪ Corrigez « {champ} » ou ajoutez l'élément correspondant, puis réimportez-le. » |

`{champ}` se résout à la **feuille** du `path` (dernier segment, sans indice de tableau) — `lieu_id`, `monstre_ref`. Aucun changement de `severity`.

**OÙ pour `monstre_ref`** : entité résolue = l'**événement**, pas le monstre (le monstre n'existe pas dans le dossier, on ne peut pas le nommer) — « Événement « {nom} » », repli « Événement n°{index} (sans nom) », `bestiaire.{templateId}` entre parenthèses en mono/`--text-faint`.

### B. `valeur-hors-enumeration` — NOUVEAU code, canal `errors`

Couvre `portee` et tout futur champ à énuméré fermé (le format en produira d'autres en it3/it4).

| QUOI | QUOI FAIRE |
|---|---|
| « Le champ « {champ} » vaut « {valeur} », qui n'est pas une valeur reconnue (attendu : {liste attendue}). » | « ↪ Remplacez cette valeur par l'une de celles attendues, puis réimportez-le. » |

**Jamais de nom de type TypeScript** dans `{liste attendue}` — écrire « premier ou second », pas `'premier' | 'second'`.

### C. `revelation-sans-porte` — NOUVEAU code, canal `warnings`

Ne bloque jamais l'import, ne dégrade pas le badge « Dossier valide » — même statut que `canon-trop-long`. Ne se déclenche que si **les quatre portes** sont absentes **simultanément** ; une seule porte posée reste calme.

| QUOI | QUOI FAIRE |
|---|---|
| « Le savoir « {nom} » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » | « ↪ Ajoutez au moins une porte, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même. » |

**OÙ** : « Personnage « {nom} » — savoir « {nom du savoir} » », repli « Personnage « {nom} » — savoir n°{index} (sans nom) ».

### D. Points vérifiés sans écart

- **Point 3** (deltas typés) : structure mécanique pure, aucune prose — pas de suffixe à débattre. Un tableau vide (`effet: []`) reste **calme** par construction ; pas de nouveau code.
- **Point 5** (`ProjectionCharpente`) : aucune surface auteur ; ses feuilles `…_texte` héritent du registre tranché par D1. Sa propriété relève de KR-169 — un test-grep, pas un texte visible ; hors de mon mandat.
- **Point 6** (`meta`) : `public`/`duree_visee` (si retenus) sont des métadonnées auteur/produit, jamais lues par le joueur — pas de suffixe, pas de nouveau code.
