# Tour 1 — `narratif-ia` · `dossier-format` it2

**RISQUE** — it2 est l'itération qui fait entrer des données **moteur** dans `monde` : `savoirs[].revele_si`, `evenements[].declencheur`/`.proba`/`resolutions[].consequence`, `plan_actions[].declencheur`, `contre_mesures[]`. Or `monde` est la racine que la n° 10 déclare injectable (`Pick<Dossier,'canon'|'monde'>`). **Le confinement acheté par le groupement en trois racines meurt ICI, en silence**, et la facture arrive devant l'assembleur de la n° 10.

**OBJECTION** — La décision B **se trompe d'objet**. Injecter `jalons[].declencheur_texte`, c'est donner au modèle la **même règle** que `declencheur_expr`, en prose — règle dupliquée code/prompt — et lui apprendre à provoquer le jalon. § 1.5 dit « le moteur les coche ; l'IA reçoit *voici où on en est* » : ce que l'IA doit recevoir est l'**énoncé** du jalon (« le sceau est brisé »), champ que le schéma **ne porte pas**. Idem `fins[].condition_texte` : un narrateur qui sait comment la partie finit y conduit. Seconde objection : `contrepartie` en prose libre n'est pas une porte — le moteur ne peut pas constater qu'elle est payée.

**PROPOSITION** — (1) Ajouter `jalons[].enonce_texte` (obligatoire, ≤ 20 mots) ; `ProjectionCharpente = { jalons_atteints: { id, enonce_texte }[] }`, zéro champ de `fins`, zéro de `depart`, **construite en n° 9 car elle dépend de l'état**. (2) Table `DESTINATION_DES_CHAMPS` (`ia` | `moteur` | `auteur`) + test d'exhaustivité : un champ neuf sans destination rougit. (3) `contrepartie: { objet_id, consomme }` ; le prix en prose part dans `revele_comment`. (4) `CONFIANCE_MIN/MAX = -3/+3`, testés à limite et limite+1 ; table `BUDGET_CONTEXTE`. (5) Golden test des 23 `templateId` du `BESTIARY`.

**VERDICT** — **recevable sous réserve**. (1) et (2) sont **veto s'ils sautent** : sans eux it2 livre une règle dupliquée entre code et prompt, et un contexte sans propriétaire.

---

## ANNEXE

### A. `Revelation` — forme exacte

**Registres vérifiés** : `Characteristic` = union fermée de 8 (`FO AG DX EN IN IG SE CA`) ; `ChallengeTier` = 4 valeurs avec `label`, `dice`, `notation`, `baseXp`. Les deux portent ce qu'il faut, **sans ajout**. Le `carac` d'une révélation est celui du **héros**, donc `Characteristic` et jamais `MonsterCharacteristic`. Conséquence à écrire noir sur blanc : **un jet de révélation est un challenge ordinaire** — `resolveChallenge(tc, heros[carac], rngDeGraine)`. Pas de sous-système social. Aucune règle de jet **opposé** n'existe dans `docs/REGLES-DU-JEU.md` : l'IN/IG du PNJ reste une contrainte de prompt, jamais un modificateur de dé.

| Champ | Type | Destination | Rôle |
|---|---|---|---|
| `confiance_min?` | entier ∈ `[-3, +3]` | **moteur** | Porte prédicative. Bornes fermées ici : le schéma de session du plan de cible écrit déjà `confiance: -3..3`. |
| `jet?` | `{ carac: Characteristic; tc: ChallengeTier }` | **moteur** (émet) · **IA** (libellé seul) | Le modèle ne voit jamais `carac`/`tc` bruts : il voit un libellé **dérivé** des registres. |
| `contrepartie?` | `{ objet_id: string; consomme: boolean }` | **moteur** + **IA** | **Rejeté : la prose libre** — le moteur ne peut pas constater qu'un serment a été tenu. |
| `apres_indice_id?` | `string` | **moteur** | `snake_case` comme tout le document persistant ; `createdAt`/`updatedAt` sont l'exception déjà livrée, pas la règle. |

Deux champs réclamés sur `savoirs[]` : `certitude: 'sait' | 'croit' | 'soupconne'` **obligatoire** (un `croit` est une information fausse ; sans elle une rumeur entre au carnet d'indices comme un fait) et `revele_comment?` (la manière, injectée **uniquement quand la porte est ouverte**).

### B. Comment un `Revelation` traverse un tour sans que le modèle lance le dé

**Les portes se ferment à l'ASSEMBLAGE DU CONTEXTE, pas à la validation du delta.** Filtrer après coup ne sert à rien : le modèle a déjà lâché le secret, le joueur l'a lu.

1. `etatPorte(savoir, session) → 'ouverte' | 'prix' | 'fermee'`. `fermee` → **rien n'est injecté**. `prix` → `{ indice_id, prix_libelle }` **sans la vérité**. `ouverte` → `{ indice_id, certitude, verite, revele_comment }`.
2. Schéma de sortie R4 : `{ replique, indices_reveles: string[], delta_confiance: number, porte_invoquee?, intention_suivante? }`.
3. `indices_reveles` est intersecté avec l'ensemble des `ouverte` **calculé à l'étape 1**, jamais recalculé — sinon un `delta_confiance` du même tour ouvre une porte a posteriori et le tour cesse d'être rejouable.
4. `porte_invoquee` → le moteur lit `jet.carac`/`jet.tc` **dans le dossier** ; si la sortie du modèle en porte, ils sont **ignorés**.
5. Échec de validation : **un** rejeu, puis dégradation en action gratuite, `delta_confiance = 0`, zéro delta. **Un `delta_confiance` hors bornes REJETTE la sortie, il ne se clampe pas** — clamper, c'est laisser le modèle bouger une statistique et faire semblant que non.

### C. `ProjectionCharpente` — forme exacte

```ts
export interface ProjectionCharpente {
	readonly jalons_atteints: readonly { id: string; enonce_texte: string }[]
}
```

| Champ | Destination | Injecté ? |
|---|---|---|
| `jalons[].enonce_texte` **(neuf, obligatoire, ≤ 20 mots)** | **IA** | Oui — **et seulement pour les jalons atteints** |
| `jalons[].declencheur_texte` | **auteur** + n° 7 | **Non** — l'injecter duplique `declencheur_expr` en prose et apprend au modèle à provoquer le jalon |
| `jalons[].declencheur_expr`, `.effet`, `.obligatoire` | **moteur** | Non |
| `fins[].condition_texte` / `condition_expr` | **auteur** / **moteur** | **Non** — un narrateur qui connaît les conditions de fin y conduit |
| `fins[].texte_joueur`, `depart.texte_ouverture_joueur` | joueur | **Non — ce n'est pas du contexte.** Scènes **émises verbatim** par le moteur |
| Jalons **non atteints** | — | **Jamais** — c'est du spoil |

**Conséquence structurelle** : `ProjectionCharpente` **n'est pas une projection du dossier**, puisqu'elle dépend de `session.monde.jalons_atteints`. Elle ne peut pas être un `Pick` et **n'a pas sa place en it2** comme type de `brain/dossier/`. Ce qu'it2 doit livrer, c'est **le champ `enonce_texte`** et la table de destination. Le type se construit en n° 9/10, à côté de l'assembleur, avec son test.

### D. `DESTINATION_DES_CHAMPS` — la table qui remplace l'illusion du `Pick`

Le `Pick<Dossier,'canon'|'monde'>` confine `charpente`. Il ne confine **rien dans `monde`** — et it2 remplit `monde` de données moteur. Le jour où la n° 10 écrit ce `Pick`, elle envoie au modèle les probabilités de déclenchement, les deltas et les fiches de monstre.

Proposition : un `Record` fermé `chemin → 'ia' | 'moteur' | 'auteur'` + un test d'exhaustivité qui échoue sur tout champ terminal sans destination. La n° 10 construit son contexte **depuis la table**, pas depuis un `Pick` qui ment ; chaque feature d'édition (n° 3 à 6) déclare la destination de ce qu'elle ajoute.

### E. Budget de contexte

Discriminant : **une borne qui borne ce qui entre dans un appel modèle est une constante de `brain/dossier/`, validée dès it2 ; une borne d'ergonomie de rédaction appartient à la feature qui édite.** Une borne posée dans un `Field` est invisible pour un fichier importé.

it2 pose : `BUDGET_MOTS_JALON = 20` (les énoncés sont injectés **tous ensemble** et la liste croît monotonement avec la durée de la partie) · `MAX_SAVOIRS_PAR_PNJ = 12` · `CONFIANCE_MIN/MAX = -3/+3` · la **table** `BUDGET_CONTEXTE` avec une entrée par racine injectable, **même vide et typée**, pour que n° 3/4/5 ajoutent une ligne au lieu d'inventer une constante. Une borne absente doit être visible comme un **trou**, pas comme un silence.

### F. `monstre_ref` — bon modèle, trois réserves

1. **Si `BESTIARY` change entre l'import et le démarrage de session** : un `templateId` renommé casse un dossier déjà validé et gelé, **loin de l'auteur**. Correctif à coût quasi nul : un **test golden qui épingle les 23 `templateId` par valeur**. Renommer un monstre devient un test rouge dans ce dépôt, décision consciente, au lieu d'un dossier cassé sur le terrain.
2. **Ce que le modèle ne doit jamais voir** : résoudre `monstre_ref` rend `pv`, `armour`, `weaponMultiplier`, `capacity`, `stats`. Le narrateur reçoit **le nom** et **le log d'assaut**, point.
3. `evenement` et `climat` **n'ont pas d'espace de noms** dans `ESPACES_DE_NOMS` alors que `lieux[].evenements: [ids]` les référence. it2 doit les ajouter, sinon l'intégrité référentielle d'it4 n'a pas de cible.

### G. `meta`

Si une racine `meta` survit, elle est **destination `auteur`**, jamais injectée. `public` et `duree_visee` dans le contexte d'un narrateur, c'est de la méta-fiction dans le seul bloc toujours chargé.
