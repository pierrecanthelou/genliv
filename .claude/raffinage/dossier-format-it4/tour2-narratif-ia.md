# Tour 2 — Narratif & IA · `dossier-format` it4

## 1. Réponse nommée au Tech Lead (C12) — il a raison sur le fait, et ça me coûte

**Vérifié, pas argumenté** :

| Champ | Existe dans le runtime ? |
|---|---|
| `session.inventory` | **oui** — `src/player/types.ts:24`, muté `usePlaySession.ts:181` (ajout), `:256` (retrait) |
| `hero.xp` | **oui** — `types.ts:16`, muté `usePlaySession.ts:154, 182, 203, 229, 254` |
| `monde.indices_connus[]` | **non** — 0 occurrence hors la **prose JSDoc** de `predicates.ts:56` |
| `monde.jalons_atteints[]` | **non** — 0 occurrence hors `predicates.ts:58` et un commentaire de `types.ts:336` |
| `monde.lieu_courant`, `lieux_visites`, `evenements_consommes`, `pnj.<id>.a_dit` | **non** — idem, prose seule |

`SessionState` = `bookId`, `currentNodeId`, `hero`, `visitedNodes` + l'équipement. **Il n'y a pas de `monde`.**

Donc : **oui, mes `reveler_indice` et `atteindre_jalon` ont exactement le défaut que je reprochais aux autres** au regard de la règle d'admission d'it3 prise à la lettre. Pire pour moi : sur ce critère-là, **`gagner_xp` passe et mes deux entrées échouent**. Je le dis parce que prétendre l'inverse serait une règle inventée à la table.

Ce que je rectifie, et qui est la vraie réponse à « `PREDICATES.jalon_atteint` est un prédicat que rien ne peut rendre vrai » : mes deux deltas **ne réparent pas** ce défaut, ils l'**apparient**. Il existait déjà, seul, du côté lecture. J'adopte ta règle d'admission (« écrit un champ que le runtime mute déjà **OU** que `PREDICATES` lit ») et j'y ajoute l'instrument qui la rend payable :

> **Test de fermeture lecture/écriture** — `∀ d ∈ DELTAS, d.refKinds ⊆ ⋃_{p ∈ PREDICATES} p.refKinds`.
> Aujourd'hui `{objet, indice, jalon} ⊆ {objet, indice, jalon, lieu, evenement, pnj}` ✔

Trois effets mesurables : la n° 9 ne peut plus créer le champ **pour un seul côté** ; **mon veto d'it3 devient un corollaire dérivé** (`bestiaire` n'étant dans aucun `refKinds` de prédicat, aucun delta ne peut nommer un monstre — par inclusion, plus par convention) ; un delta orphelin de lecteur rougit **à l'ajout**, pas au tour 40.

**CORRECTION TECHNIQUE NEUVE, à porter au plan** — ta proposition (2) écrit `...CHEMINS_DE_DELTAS.map(c => c.path)`. **Ça ne marche pas** : le walker teste `CHEMINS_D_ARRET.has(normalise)` **avant** d'entrer dans le tableau (`couverture.test.ts:106-108`). Avec `c.path`, il s'arrête sur le **tableau**, la feuille devient `monde.quetes[].recompense`, et les quatre lignes de `destinations.ts` — toutes écrites en `…[]` — deviennent **mortes** (assertion « aucune ligne morte »). Le terme dérivé est `` CHEMINS_DE_DELTAS.map(c => `${c.path}[]`) `` : arrêt sur l'**élément**, les quatre destinations survivent inchangées, chaque delta reste corrompu individuellement. Toujours une seule liste source.

## 2. Réponse nommée à l'UX (C3) — les quatre opérandes entiers

Ta règle d'admission (« un champ NOMMÉ de `HeroState` y répond ») est **littéralement satisfaite** par tes six entrées : `pv`, `mcBonus`, `permanentArmorBonus`, `xp` existent tous et sont tous mutés. **Mon écart ne porte pas là.** Il porte sur KR-130, et sur un fait :

`PnjGiftMutations` n'est pas un relevé de règles, c'est un relevé du **modèle en arbre** — `PnjGift` vit dans `src/brain/types.ts:300`, dont `PnjGiftEffect` est décrit comme « surfaced through the **action-pnj** registry », feature supprimée par D3. Et `src/brain/types.ts:333` porte déjà la preuve du défaut : `xp?: number` documenté « **(0–5, § 5)** » — alors que **§ 5 de `docs/REGLES-DU-JEU.md` ne contient aucun gain posé par l'auteur** : tout y est `ΔT = Tier_challenge − Tier_personnage`. Cette valeur d'auteur est une **divergence pré-existante** entre le code et la source de vérité. La recopier dans `DELTAS`, c'est la **blanchir** dans le contrat que quinze features vont consommer, au lieu de la corriger là où KR-130 l'exige.

Idem pour `modifier_bonus_defense` : `permanentArmorBonus` existe, mais **aucune section du manuel ne le porte** — pas une occurrence de « PNJ » ni de « don » dans `REGLES-DU-JEU.md`.

**Qualification, sans marchandage** : ce n'est **pas un veto de mon domaine**. Personne ici ne fait lancer un dé au modèle, et un auteur qui écrit `+3 PV` appliqué par du code déterministe ne franchit pas ma frontière. C'est une **objection maintenue**, fondée sur KR-130 — terrain du comité, pas le mien : le PM et le Tech Lead peuvent me passer dessus, et **je préfère le dire moi-même que me le faire requalifier**.

Elle porte une **clause d'escalade**, et celle-là est de mon domaine : le jour où un **schéma de sortie de modèle** nomme un id de `DELTAS` portant une magnitude, c'est le modèle qui choisit la statistique — **veto sans discussion**.

Sur `grandeur` : avec un registre à références seules il n'a **plus d'objet** — aucune statistique mutée à nommer. La collision `cible`/`cibles` est réelle et se règle par la **disparition du champ**, pas par un renommage.

## 3. Statut de chacune de mes objections du tour 1

| objection | statut |
|---|---|
| La démo ne couvre que les deltas à opérande identifiant | **RETIRÉE** — sans objet : le registre n'a plus d'opérande entier à borner |
| Opérande entier écarté sur KR-130 | **MAINTENUE, requalifiée en objection** (§ 2), + clause d'escalade en veto |
| Aucun `refKinds` ne porte `bestiaire` | **VETO MAINTENU** — mais désormais **dérivé** du test de fermeture, plus une assertion isolée |
| `modifier_confiance` écarté avant n° 12 | **MAINTENUE** |
| Arrêt du balayage dérivé + refus de toute clé inconnue, indissociables | **MAINTENUE** + **CORRIGÉE** : suffixe `[]`, voir § 1 |
| `DELTAS` non exportée hors `brain/dossier/`, test-grep | **MAINTENUE** — c'est l'instrument de la clause d'escalade |
| `estCleDe` obligatoire | **MAINTENUE** |
| BUG-050 = troncature silencieuse de contexte | **MAINTENUE ET DURCIE** |

## 4. C9 — je recommande `effets_regles: []`, et je le tiens

Aucun delta de référence n'a de sens sur un climat : `types.ts:214` le définit comme « une condition ambiante qui **modifie les règles** » — sa nature même est un opérande entier. Écrire la section « effets de climat » dans ce lot reviendrait à **inventer une règle de jeu dans une itération de format**, en trois lignes, sans table dorée, sans arbitrage de l'auteur. **Non.**

Donc : `effets_regles: []` dans la fixture, **JSDoc portant la condition de réouverture**, et la branche « delta sur chaque cible » de la checklist d'it5 se lit « sur chaque cible **admissible** ».

**Deux conséquences mécaniques que l'essaim ne doit pas découvrir à la porte** — vérifiées :
1. `[]` est un tableau vide, donc une **feuille** (garde `length > 0`) au chemin `…effets_regles` — **sans** `[]`. La ligne `destinations.ts` correspondante devient donc **morte** et doit être **renommée** sur le chemin conteneur, sinon l'assertion rougit.
2. La 4ᵉ assertion tient quand même : `estInstancie` accepte l'égalité exacte, donc `CHEMINS_DE_DELTAS → …effets_regles` reste instancié. Vérifié ligne à ligne.

## 5. BUG-050 (C5) — je suis le Tech Lead, avec un écart à trancher

La dérivation `(COLLECTIONS_IDENTIFIEES ∪ LISTES_REQUISES) − CHEMINS_DE_DELTAS` couvre le cas canonique : `monde.personnages[].savoirs` est dans `LISTES_REQUISES`. Et `canon.interdits_ton` — liste de **chaînes** — n'est dans ni l'une ni l'autre, donc pas balayée : **correct par construction**.

**Mais** : `charpente.jalons[].effet` est dans `CHEMINS_DE_DELTAS`, donc **exclu** de la dérivation. Le test n° 6 de la QA (`jalons[].effet: ['du texte']`) n'aura donc **pas** le même code que le n° 5 (`savoirs: ['du texte']`) : `element-non-objet` pour l'un, **`delta-malforme`** pour l'autre. La matrice de la QA les regroupe sous un seul code — **à trancher dans le plan écrit**, sinon l'ouvrier arbitrera seul. Ma lecture : **deux codes**, parce que le message diffère (« attend une liste d'objets » vs « attend un effet structuré »), et la 5ᵉ assertion de disjonction rend la frontière visible.

Sur le fond je durcis : `savoirs: ["du texte"]` sort `ok:true` et le savoir est **silencieusement supprimé**. Le PNJ sera assemblé au contexte avec moins de savoirs que l'auteur n'en a écrits. **Si le lot doit maigrir, ce n'est pas par là** — c'est la seule des trois tranches dont le défaut est déjà en production.

## 6. Concessions

- **C4 — `op`** : concédé. Les deux vocabulaires sont fermés (un `ExprNode` dans un slot delta est refusé par `delta-inconnu`, un delta dans un `_expr` par `validateExpr`). Réserve de forme, terrain UX : `gagner_objet` et « donne un objet » n'ont pas le même sujet — choisir.
- **C6** : `element-non-objet`.
- **C7** : **soutenu** — `depart.lieu_id` dans `REFERENCES_SIMPLES` supprime un site de résolution câblé en dur (KR-117). Une référence, un résolveur.
- **C1 / C2** : convergence.

**VERDICT — recevable sous réserve.** La règle d'admission + le test de fermeture au plan écrit ; l'arrêt dérivé **suffixé `[]`** ; le renommage de la ligne de destination du climat ; le test-grep de non-export ; `estCleDe`.

---

## ANNEXE A — `DELTAS`, inventaire définitif (4 entrées)

**Règle d'admission** (celle du Tech Lead + ma clause (d)) : **(a)** il écrit un champ que le runtime mute déjà **OU** qu'un prédicat lit ; **(b)** tous ses opérandes sont des identifiants stables ; **(c)** son `refKinds` est inclus dans l'union des `refKinds` de `PREDICATES` (test) ; **(d)** le moteur peut l'appliquer **sans lancer un dé**.

| id | libellé | `refKinds` | ce qui y répond — **vérifié** |
|---|---|---|---|
| `donner_objet` | « donne l'objet » | `['objet']` | **existe** : `usePlaySession.ts:181` ; `actionEngine.ts:213`. Lu par `possede_objet` |
| `retirer_objet` | « retire l'objet » | `['objet']` | **existe** : `usePlaySession.ts:256` ; `actionEngine.ts:106` |
| `reveler_indice` | « révèle l'indice » | `['indice']` | **n'existe pas encore** — prose seule. Lecteurs déjà au contrat : `indice_connu`, `pnj_a_revele`. Le champ naît en n° 9, **pour les deux côtés à la fois** |
| `atteindre_jalon` | « marque le jalon atteint » | `['jalon']` | **n'existe pas encore** — prose seule. Lecteur `jalon_atteint`. Cas documenté : « un jalon peut rester coché à la main par le moteur d'un événement » — `declencheur_expr` est optionnel **pour ça** |

**Placement en fixture** (3 sites sur 4) : `quetes[].recompense` → `donner_objet` · `evenements[].resolutions[].consequence` → `atteindre_jalon` **+** `retirer_objet` (deux éléments : c'est aussi ce qui éprouve le balayage sur un tableau peuplé) · `jalons[].effet` → `reveler_indice` · `climat[].effets_regles` → `[]`.

## ANNEXE B — Écartés, avec leur condition de réouverture

| écarté | motif | réouverture |
|---|---|---|
| `gagner_xp` | `hero.xp` **existe et est muté** — l'écart est KR-130 seul : § 5 calcule **tout** gain depuis ΔT. Le « 0–5, § 5 » de `brain/types.ts:333` est une **divergence pré-existante**, pas une règle | une section « récompense d'auteur » dans `REGLES-DU-JEU.md` → table dorée → code. **Dans cet ordre** |
| `modifier_pv` | § 1 pose `PV = FO+AG+EN` et les seuils. Le clamp du runtime borne le *résultat*, pas la *valeur écrite* | idem |
| `modifier_bonus_attaque` | § 5 plafonne la MC à +5 avec porte `IN ≥ 6`, par la seule boutique d'XP | idem, **plus** la place du plafond |
| `modifier_bonus_defense` | existe en code, mais **« PNJ » n'apparaît pas une fois** dans le manuel | idem |
| `modifier_carac` | seul chemin runtime **payant** et plafonné à 12. En delta gratuit : progression à deux sources | une règle de progression non payante |
| `equiper_objet` | conséquence de la prise d'objet, jamais une opération d'auteur | — |
| `deplacer_vers`, `consommer_evenement` | leurs champs auront un **écrivain moteur par construction** ; un delta serait un **second écrivain du même fait** | une n° 9 qui montre que le moteur seul ne suffit pas |
| `modifier_confiance` | échelle non arbitrée avant n° 12 ; **le** delta que le modèle voudra émettre | n° 12, comme sa propre décision |
| `ouvrir_combat` / `refKinds: ['bestiaire']` | **VETO**, désormais **mécanique** : le test de fermeture le refuse sans qu'on ait à y penser | aucune |

## ANNEXE C — Contrat de sortie IA : réservation, pas contrat

- **Entrée injectée** : *aucune*. Le modèle ne voit ni un id de delta, ni une cible, ni une magnitude. Au mieux la **conséquence racontée** après application. Les quatre chemins restent `moteur`.
- **Schéma de sortie** : aucun champ ne nomme un id de `DELTAS` au schéma 1. **Attention neuve, conséquence de C4** : la clé est partagée avec `ExprNode` — un futur schéma de sortie ne doit **jamais** accepter un nœud non discriminé par son slot.
- **Échec** : delta malformé, clé inconnue, référence pendante → **rejet bloquant**, jamais de repli, jamais de clamp.
- **Instrument qui tient la réservation** (KR-169) : **test-grep** — `DELTAS` n'est référencée par aucun fichier hors `src/brain/dossier/` et n'est pas ré-exportée par `brain/index.ts` (seuls `Delta` / `DeltaId` sortent, comme types). Le jour où la n° 11 voudra la câbler dans un schéma de sortie, elle devra **supprimer un test** — c'est-à-dire **prendre la décision au lieu de la subir**.
