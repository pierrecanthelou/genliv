# Tour 1 — UX Designer · `dossier-format` it4

**RISQUE** — Les deux scories du goal poussent vers l'invention : un ouvrier qui lit « étendre à `relations`, `presences`, `acces`, `mene_a` » sans relire le schéma peut fabriquer des champs, donc des **textes OÙ pour des entités qui n'ont ni type, ni `ESPACES_DE_NOMS`, ni `localiserEntite`**. Même risque côté BUG-050 : « table dédiée » peut tenter quelqu'un d'inventer une résolution ad hoc au lieu de réutiliser le repli déjà correct de `localiserEntite`.

**OBJECTION 1** — `relations`, `presences`, `acces`, `mene_a` restent hors it4 : zéro type, zéro racine, zéro feature éditrice — la « forme sans producteur ni consommateur » que la décision A interdit déjà pour `contre_mesures[]`. Aucune anomalie, aucun texte OÙ pour eux ici.

**OBJECTION 2** — Le champ `cible` du descripteur `DELTAS` (cité au contrat) **collide avec `cibles` d'`ExprNode`**, qui désigne partout ailleurs un **identifiant référencé**. Ici il désignerait la **statistique mutée** (pv, xp…) — un concept différent sous le même mot. Renommer en `grandeur`.

**PROPOSITION** — `DELTAS` à 6 entrées, dérivées 1:1 de `PnjGiftMutations` (pv / attaque / défense / objet) + `hero.xp` — aucune entrée `confiance` (amplitude non tranchée, reportée n° 12). Trois codes neufs seulement (`delta-inconnu`, `delta-malforme`, `element-malforme`), les références réutilisent `identifiant-invalide` / `reference-pendante` (doctrine it3). Textes exacts en annexe.

**VERDICT** — recevable sous réserve : les deux objections tranchées **dans le plan écrit**, pas seulement comprises.

---

## ANNEXE — contrat de design

### Registre `DELTAS` — 6 entrées, vocabulaire moteur (jamais lu par le joueur)

| `op` (clé, snake_case FR) | `label` | `grandeur` | `refKinds` | Paramètres |
|---|---|---|---|---|
| `gagner_objet` | « donne un objet » | `inventaire` | `['objet']` | `{ op, objet_id }` |
| `perdre_objet` | « retire un objet » | `inventaire` | `['objet']` | `{ op, objet_id }` |
| `modifier_pv` | « modifie les points de vie » | `pv` | `[]` | `{ op, valeur }` |
| `modifier_bonus_attaque` | « modifie le bonus d'attaque » | `bonus_attaque` | `[]` | `{ op, valeur }` |
| `modifier_bonus_defense` | « modifie le bonus de défense » | `bonus_defense` | `[]` | `{ op, valeur }` |
| `gagner_xp` | « accorde des points d'expérience » | `xp` | `[]` | `{ op, valeur }` |

Règle d'admission (identique à `PREDICATES`, **en commentaire, pas en table**) : un `op` n'entre que si un champ NOMMÉ de `HeroState` y répond. Écarté explicitement : `modifier_confiance` — l'échelle n'est pas tranchée avant n° 12 ; l'ajouter fige une amplitude que personne n'a arbitrée.

### Codes d'anomalie neufs (union 16 → 19)

**`delta-inconnu`** — miroir de `predicat-inconnu`.
- OÙ : `site.location` (l'entité identifiée la plus proche portant le delta — Jalon / Quête / Événement / Climat).
- QUOI : « Le champ « {champ} » utilise l'effet « {valeur} », qui n'existe pas dans le registre des effets. »
- QUOI FAIRE : `↪ Remplacez l'effet de « {champ} » par l'un de ceux que le moteur reconnaît, puis réimportez-le.`

**`delta-malforme`** — miroir d'`expr-malformee`.
- QUOI : « Le champ « {champ} » attend un effet structuré reconnu (une clé « op », puis ses paramètres) ; il contient « {valeur} ». »
- QUOI FAIRE : `↪ Corrigez la forme de « {champ} » dans le fichier (clé « op » et ses paramètres), puis réimportez-le.`

**`element-malforme`** (BUG-050).
- OÙ : `localiserEntite` sur l'entité porteuse la plus proche — **le repli existant, réutilisé**, pas de nouvelle logique de localisation.
- QUOI : « Le champ « {champ} » attend une liste d'objets ; l'un de ses éléments n'en est pas un (« {valeur} »). »
- QUOI FAIRE : `↪ Remplacez cet élément de « {champ} » par un objet, puis réimportez-le.`

### Références réutilisées (aucun code neuf, doctrine it3)

- **`identifiant-invalide`** sur `objet_id` mal formé : « L'effet « {label} » de « {champ} » fournit « {valeur} », qui n'est pas un identifiant d'objet valide. »
- **`reference-pendante`** sur `objet_id` bien formé mais introuvable : « L'effet « {label} » de « {champ} » pointe « {valeur} », qui n'existe pas dans ce dossier. »

### Hors périmètre it4 — à écrire dans le plan, pas seulement compris

Aucune anomalie, aucun `label`, aucun OÙ pour `relations`, `presences`, `acces`, `mene_a` : la décision A les assigne aux n° 4–6. `monstre_ref` : rien à ajouter, résolu depuis it2.
