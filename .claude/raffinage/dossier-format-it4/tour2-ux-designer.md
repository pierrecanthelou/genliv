# Tour 2 — UX Designer · `dossier-format` it4

**RÉPONSE NOMMÉE — au tech-lead** (objection 2 : « le champ `cible` **est** le `lit:` retiré en it3 »), que je **prolonge contre lui**. J'ai relu `predicates.ts` et `expr.test.ts` : **`op` y est déjà pris** — c'est le tag de *nature du nœud* (`et`/`ou`/`non`/`predicat`, quatre valeurs fermées), jamais l'identifiant du prédicat spécifique, qui a son propre champ, `predicat`. Reprendre `op` pour loger un `DeltaId` — proposition du tech-lead **et la mienne au tour 1** — commet exactement la collision que j'ai vetée sur `cible`/`cibles` : un mot du vocabulaire d'`ExprNode` réemployé avec un autre sens. Le miroir correct de `predicat: PredicatId` est **`delta: DeltaId`**. Je me range donc sur `narratif-ia`, **contre ma propre position et celle du tech-lead**.

**MES OBJECTIONS DU TOUR 1**

- **Objection 1** (`relations`/`presences`/`acces`/`mene_a` hors it4) — **MAINTENUE**, convergence 5/5 confirmée.
- **Objection 2** (`cible` collide avec `cibles`) — **DURCIE ET TRANSFORMÉE** : je retire mon propre correctif (`grandeur`) au profit de celui du tech-lead (aucun champ typé, JSDoc en prose comme `PREDICATES`), et j'**étends** le diagnostic à `op`. Le fond — ne pas réemployer un mot d'`ExprNode` avec un autre sens — tient sur les deux champs.

**C3 — je RETIRE mes quatre entrées à opérande entier.** Je ne peux **nommer aucune section**. Vérifié par moi-même dans `docs/REGLES-DU-JEU.md` : § 1 *calcule* `PV = FO+AG+EN` et les seuils de PE ; § 5 *calcule* tout gain d'XP depuis ΔT et plafonne le bonus d'attaque à +5 **par la boutique** ; le bonus de défense n'existe dans **aucune** section (feature `action-pnj` supprimée). Aucune n'écrit une magnitude posée par l'auteur. Retrait franc, pas une défaite : le narratif a raison, et le tech-lead converge indépendamment.

**C4 — `grandeur` : table sans lecteur**, même motif que `lit:` en it3 — aucune feature d'it4 ne rend un `Select`, les n° 3/6/7 n'existent pas encore. Je le retire. Discriminant : **`delta`**.

**C6 — je me range sur `element-non-objet`** (tech-lead). « Malformé » est un mot réservé à la consigne d'`expr-malformee` (opérateur / clé / imbrication) et serait **faux** sur un scalaire à la place d'un objet ; « liste-invalide » (QA) est moins précis — il laisserait croire à un problème de longueur.

**VERDICT** — **recevable.** Toutes mes réserves du tour 1 sont levées ou transformées, aucune ne subsiste.

---

## ANNEXE — textes définitifs

### `DELTAS` — 4 entrées, schéma 1, slots de référence seuls

Littéral : `{ delta: DeltaId, cibles: string[] }` — `cibles` toujours un tableau, arité **dérivée** de `refKinds.length`. Descripteur : `{ label, refKinds }`, jamais de champ « cible » ni « grandeur » — le champ écrit est en **JSDoc, en prose**, comme `PREDICATES`. Labels alignés sur la convention déjà posée : fragment de phrase au présent, jamais de majuscules espacées (celles-ci sont réservées aux libellés de champ de formulaire, pas aux valeurs d'un `Select` de règle).

| `delta` | `label` | `refKinds` | y répond (JSDoc, prose) |
|---|---|---|---|
| `donner_objet` | « donne l'objet » | `['objet']` | `PnjGiftMutations.inventoryAdd` |
| `retirer_objet` | « retire l'objet » | `['objet']` | `computeInventoryLoss(kind:'specifique')` |
| `reveler_indice` | « révèle l'indice » | `['indice']` | `monde.indices_connus[]`, déjà cité par `indice_connu` |
| `atteindre_jalon` | « marque le jalon comme atteint » | `['jalon']` | `monde.jalons_atteints[]`, déjà cité par `jalon_atteint` |

### Codes d'anomalie — textes exacts

**`delta-inconnu`**
- OÙ : `site.location` — l'entité porteuse la plus proche (jalon / quête / événement / climat).
- QUOI : « Le champ « {champ} » utilise l'effet « {valeur} », qui n'existe pas dans le registre des effets. »
- QUOI FAIRE : `↪ Remplacez l'effet de « {champ} » par l'un de ceux que le moteur reconnaît, puis réimportez-le.`

**`delta-malforme`**
- QUOI : « Le champ « {champ} » attend un effet structuré reconnu (une clé « delta », puis ses paramètres) ; il contient « {valeur} ». »
- QUOI FAIRE : `↪ Corrigez la forme de « {champ} » dans le fichier (clé « delta » et ses paramètres), puis réimportez-le.`

**`element-non-objet`** (BUG-050)
- OÙ : `localiserEntite` sur l'entité porteuse la plus proche — **le repli existant, réutilisé**.
- QUOI : « Le champ « {champ} » attend une liste d'objets ; l'un de ses éléments n'en est pas un (« {valeur} »). »
- QUOI FAIRE : `↪ Remplacez cet élément de « {champ} » par un objet, puis réimportez-le.`

**Réutilisés sans changement** : `identifiant-invalide` et `reference-pendante` — leurs textes ne mentionnent ni `op` ni `delta`, donc le renommage ne les touche pas.

### Écartés — motif à lever avant réouverture (hérité du narratif, ratifié)

`accorder_xp` · `modifier_pv` · `modifier_pe` · `bonus_attaque` · `bonus_defense` · `modifier_carac` · `equiper_objet` · `ouvrir_combat` et tout `refKinds: ['bestiaire']` · `modifier_confiance` · `avancer_plan` · `consommer_evenement`. Je n'en rouvre aucun : **aucune section de `docs/REGLES-DU-JEU.md` ne les porte.**
