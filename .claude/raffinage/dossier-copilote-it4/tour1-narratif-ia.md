# Tour 1 — `narratif-ia` · `dossier-copilote` it4

**RISQUE** — Seul rôle qui écrive une **entité entière** depuis `synopsis_mj`. Retiré de 3a/3b/3c « pour point de vue », le synopsis est ici **indispensable** : sans lui la distribution ne contient que ce que le joueur sait déjà. **Le renversement est SÛR — à une condition** : que la sortie **perde `description_joueur`**. C'est le champ « réputation publique, ce qui se dit de lui ». Un modèle qui **invente** une personne DEPUIS le secret y déverse le secret ; l'auteur ratifie d'un clic, le narrateur de la n° 12 le lira comme **public**, et **aucun validateur ne peut le voir** (KR-229).

**OBJECTION**
1. `CHAMPS_PROPOSABLES` (3 proses) : **deux n'ont rien à faire ici**. `apparence` et `description_joueur` sont **déjà servies** par le rôle prose sur une fiche existante — les remettre ici **double une capacité livrée** et ouvre le seul canal de fuite du synopsis.
2. ⚠ **« QUATRE chemins » est faux DÈS LE DEUXIÈME CLIC** : sans les `fonction` déjà écrites, le modèle repropose la même distribution, l'auteur accepte, **le dossier porte des jumeaux à identifiants distincts. Rien ne le constate.**
3. `canon.mj.synopsis_mj` devient **requis** — or `libelles.ts` écrit « il n'est jamais requis, donc aucune branche ne peut le nommer ». **Cette ligne est périmée par l'itération.**

**PROPOSITION** — Deux champs par élément (`place` + `poursuite` → `fonction` + `but.libelle`). Les `fonction` déjà écrites injectées **sans rang**, sous `DEJA_ECRITS_MAX = 12`. `synopsis_mj` promu `CheminLibelle` et **second requis** : zéro motif neuf. **Liste vide = REFUS.**

**VERDICT** — **recevable sous réserve** (R1 à R4).

---

## 0 · Les quatre réserves, décidables

| # | Réserve | Si elle tombe |
|---|---|---|
| **R1** | La sortie porte **deux** champs : `place`, `poursuite`. **Ni `apparence`, ni `description_joueur`**, ni aucun champ `moteur`. | **VETO** : le synopsis alimente un champ d'audience publique, sans instrument pour le voir. |
| **R2** | Les `fonction` **déjà écrites** entrent dans le contexte, sous borne nommée, **sans rang**. | Contexte sans borne utile + **fabrique de doublons invisibles**. |
| **R3** | `canon.mj.synopsis_mj` devient le **second requis**, et `LIBELLE_DES_CHAMPS` gagne sa ligne. | Un **cinquième** `MotifRefusContexte` inventé pour rien. |
| **R4** | La ligne de nommage de 3c est **réécrite, jamais recopiée**. | Le modèle est **autorisé** à se référer à ses propres fiches par périphrase. |

## 1 · Le renversement du synopsis — la doctrine, pour qu'on ne la re-dérive pas

Les trois retraits antérieurs ont **un seul motif sous deux formulations** : la prose rendue finira **attribuée à un personnage** — prononcée (3a), agie (3b), éprouvée (3c) — et un personnage ne doit pas savoir ce que le synopsis sait. **Ici la prose n'est attribuée à personne : il n'y a pas encore de personne.** Le modèle est au **siège de l'auteur**, pas au siège d'un acteur. **Précédent direct et déjà livré : `personnage-prose` (it1) REÇOIT `synopsis_mj`.**

> **TEST DE RATTACHEMENT, décidable sans rouvrir le débat** : *la prose rendue sera-t-elle un jour jouée, prononcée ou éprouvée PAR quelqu'un ?* **Oui** ⇒ retrait pour point de vue (3a/3b/3c). **Non — c'est une note de fiche lue par un narrateur** ⇒ injection (it1, it4).

**Ce que le renversement coûte** : un rôle qui **complète** est borné par la fiche existante ; un rôle qui **crée** n'a d'autre matière que le synopsis, donc la corrélation entre le secret et ce qu'il écrit est **maximale**. **La parade n'est pas une ligne d'invite (inconstatable), c'est le RETRAIT DU CHAMP PUBLIC DE LA SORTIE** (R1) : la fuite synopsis → public **n'a plus de canal**.

## 2 · Le nœud — une distribution sans noms

**Énonçable ?** Oui, c'est l'état normal du dépôt : `handleAjouter` crée sans nom, `localiserEntite` rend le repli, et **toute référence du dossier est par identifiant**. Le discriminant que l'auteur lit à l'acceptation est la **`place`**, pas le nom.

**Le risque de référence, nommé précisément** : le modèle écrit trois fiches d'un seul jet — une **constellation**. Il écrira « le forgeron » en 1 puis « celle qui a trahi le forgeron » en 3. L'auteur accepte 1 et 3, refuse 2. Il reste une prose qui renvoie à quelqu'un qui **n'a jamais existé** : pas de `nom` à réconcilier, pas d'id à faire pendre, donc **ni KR-021 ni le linter ne peuvent le voir**.

**Ce qui le ferme par la FORME** : l'élément **ne porte aucune fente de désignation** — pas d'`envers`, pas de rang, pas de handle. Une référence croisée reste donc **confinée dans la prose que l'auteur lit avant d'accepter** ; elle **ne peut pas produire de pointeur cassé**. ⚠ **C'est la différence avec 3c**, où un `envers` pouvait viser un `Pn` refusé ensuite. **C'est ce qui me retient de poser un veto.**
**Par l'invite, persuasif seulement, et déclaré tel** : aucun prédicat ne peut le constater, **donc l'écran ne promet rien**.

## 3 · Le contrat de sortie — `synopsis-distribution`

**Nom du rôle** : `'synopsis-distribution'`, sans accent (classe `[a-z-]+` de la route). ⚠ **Premier rôle dont la cible ne vise aucune entité** : `CibleDistribution { role: 'synopsis-distribution' }`, **charge vide** — l'union étiquetée de 3c la porte seule, la garde `never` s'étend.

**Gabarit** : `'{"distribution": [{"place": "…", "poursuite": "…"}, {"place": "…", "poursuite": "…"}]}'`

| Clé réseau | → document | Pourquoi ce mot |
|---|---|---|
| `distribution` | *(la liste)* | mot de la démo. **Pas `fiches`** (mot d'écran), **pas `personnages`** (nom de collection). |
| `place` | `fonction` | le JSDoc de `fonction` dit « la charge qu'il occupe ». **Pas `fonction`** (nom du champ, veto 3b) ; **pas `metier`**, qui RÉTRÉCIT ; **pas `role`** — collision frontale avec `CorpsDemande.role` et `Cible*.role`. |
| `poursuite` | `but.libelle` | **Pas `but`** (nom du champ), **pas `objectif`** (KR-198), **pas `quete`** — collection **et** espace de noms, mordrait le scanner d'identifiants. |

```ts
interface FicheResolue { fonction: string; but: { libelle: string } }
interface PropositionDistribution { ajouts: readonly FicheResolue[] }
// {place,poursuite} ∩ {fonction,but} = ∅ (KR-231, aux deux niveaux)
```
⚠ **PREMIÈRE PROPOSITION SANS IDENTIFIANT DE CIBLE.** L'invariant mesuré sur les cinq rôles livrés — « la proposition est LA CIBLE PLUS LE CONTENU » — **ne s'applique pas** : la cible est le dossier. **À écrire, sinon quelqu'un ajoutera un `dossierId` « par symétrie »**, identifiant de plus sans lecteur.

**Ce que le code pose à l'acceptation** :
```
{ id: frapperIdentifiant('pnj'), portee: PORTEE_INITIALE, plan_actions: [], savoirs: [], fonction, but: { libelle } }
```
`camp`, `objectif_id`, `apparence`, `description_joueur`, `stats`, `nom`, `but.pourquoi`, `but.echeance` — **ABSENTS, jamais semés** (KR-221). Écrire le **littéral** au site, jamais un spread (discipline 3c).

**Prédicats — `validerDistribution`**, ancêtre `validerRelations` (deux niveaux), jamais `validerRepliques` :
(1) objet simple `schema` · (2) clés exactement `['distribution']` `schema` · (3) `Array.isArray` `schema` · (4) chaque élément objet simple, clés **exactement** `['place','poursuite']` `schema` · (5) les **deux** sont des CHAÎNES `schema` · (6) ≤ `FICHES_PROPOSEES_MAX`, **refus jamais troncature** `schema` · (7) longueur ≥ 1 `vide` · (8) les **deux** proses non vides après `trim()` `vide` · (9) éléments distincts **sur le COUPLE** `schema` · (10) aucun `MARQUEUR_A_ECRIRE`, sur les deux proses `marqueur` · (11) aucun identifiant, **par élément, jamais un `join`** `identifiant`.

⚠ **Le prédicat (9) est NEUF et ne se « symétrise » pas** : **deux gardes partagent légitimement une `place`**, **deux prétendants partagent légitimement une `poursuite`** — seul le **couple** identique est du remplissage. Un prédicat sur une seule clé **refuserait une réponse juste**.

⚠ **QUATRE motifs, pas cinq** : `'rang-inconnu'` est **sans objet** (aucun jeton, aucune table) — l'écrire serait du **code mort présenté comme de la couverture** (BUG-084, KR-235).

## 4 · La règle de tranchage du cas mixte, appliquée

Accepter écrit : `id`, `portee`, `plan_actions`, `savoirs` **posés par le code**, et `fonction` + `but.libelle` **rédigés par le modèle** ⇒ **RÉDACTION** ⇒ **liste vide = REFUS `'vide'`**. **Le test de rattachement de 3a concorde** : rien ne fournit une distribution. **Les deux critères donnent la même réponse — preuve que la règle n'a pas eu à être pliée.**

⚠ **Piège d'assembleur, à écrire : `'aucun-candidat'` NE S'APPLIQUE PAS ICI.** Un monde vide est le **cas nominal** — c'est le premier geste après l'écriture du synopsis. **Le recopier refuserait l'usage principal.**

## 5 · Le contexte — **CINQ** chemins

`canon.ton` · `canon.interdits_ton[]` · **`canon.mj.synopsis_mj` ← LA SOURCE** · `canon.partage.accroche_joueur` · **`monde.personnages[].fonction` ← restreint aux DÉJÀ ÉCRITS, sans rang**

**Retraits, aux motifs NEUFS** : **`description_joueur`** — retiré du contexte pour la même raison que de la sortie (R1), *montrer huit réputations publiques invite à en écrire une* · **`but.libelle`** — ⚠ *c'est **la moitié de ce que le modèle écrit** ; l'injecter fait écrire « autour » des buts existants, une **constellation** de la distribution déjà acceptée* · `caractere.*`, `apparence`, `plan_actions[].action`, `relations[]`, `savoirs[]`, `presence[]` — hors tranche · `stats`, `camp`, `portee`, `nom`, `objectif_id` — `moteur`/`auteur`. **`DEROGATIONS_AUDIENCE` reste vide.**

```ts
export const DEJA_ECRITS_MAX = 12
```
⚠ **Constante propre, JAMAIS `CANDIDATS_MAX`** — **le sens est INVERSE** : `CANDIDATS_MAX` borne des **désignables**, celle-ci borne des **exclus**. **Motif propre de la valeur** : la boucle visée est « presser, accepter jusqu'à trois, presser encore » ⇒ **quatre pressions × trois = 12**.
**Aucun rang, aucune table de rangs** : rien ne désigne personne — une table serait un instrument **sans consommateur** (KR-235) **et** une invitation à s'y référer. En-tête **`DEJA ECRIT`**, jamais `P…` ni `FICHE`. **Pas une ligne, pas de bloc** ; zéro déjà écrit ⇒ **bloc absent**, jamais vide.
**Limite déclarée** : une borne de **contexte** n'est pas une garantie d'unicité — au-delà de 12 un doublon redevient possible et **aucun prédicat ne le constate**. **L'écran ne promet rien.**

**Budget** : formule inchangée, mesurée `DEJA_ECRITS_MAX` **saturé**, **après avoir asserté que les CINQ chemins résolvent non vides** — sinon le nombre est un **plancher, pas une mesure**. **Aucun chiffre ici : je n'écris pas une valeur que personne n'a mesurée.** `TAILLE_MAX_CORPS_IA` **à re-dériver sur les SIX rôles** dans le même lot — « inchangé » devra être une mesure.

**`PARTIES_REQUISES` — DEUX entrées** : `['canon.ton', 'canon.mj.synopsis_mj']`. **Premier rôle à deux requis** ; la boucle existante les traite dans l'ordre, **zéro motif neuf**, `MotifRefusContexte` **inchangée à quatre**. ⚠ **Le commentaire d'en-tête de `libelles.ts` devient FAUX** et se corrige dans le même lot.

**Refus, ordre figé, tous avant tout `fetch`** : `a-ecrire`(`canon.ton`) → `a-ecrire`(`canon.mj.synopsis_mj`) → `trop-long`. **Ni `cible-a-ecrire` ni `aucun-candidat`.**

**Mémoire** : **aucune session au Temps 1**. La seule mémoire est **le document**. Une fiche **refusée** ne laisse **aucune trace** et peut revenir — *prix assumé de « le document est la seule mémoire »* ; une fiche **acceptée** disparaît **par le bloc des déjà écrits**, pas par une mémoire.

## 6 · L'invite — mot pour mot

`FICHES_PROPOSEES_MAX = 3`, **cinquième constante littérale, jamais partagée**. Effet utile : **`'trois au plus'` existe DÉJÀ dans `BORNE_EN_TOUTES_LETTRES`**, le garde s'étend **sans toucher la table** — à armer sur ce rôle **avec son cas négatif fabriqué**.

```
Tu assistes l'AUTEUR d'un livre-jeu qui cherche qui peuple son histoire.
À partir du contexte fourni, tu proposes des personnes que cette histoire-là suppose : ce que chacune est dans ce monde, et ce que chacune veut.

Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['synopsis-distribution']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque PLACE dit ce que cette personne est parmi les autres — sa charge, son rang, ce qui la fait tenir là. Elle ne dit ni son visage, ni sa voix, ni ce qui se raconte d'elle.
Chaque POURSUITE dit ce que cette personne VEUT et tient à obtenir ; ce n'est jamais ce qu'elle s'apprête à faire ensuite, ni une phrase qu'elle prononce.
Tu en donnes trois au plus, et au moins une : une histoire suppose toujours quelqu'un.
Tu ne proposes personne que le contexte énumère déjà, et deux de tes propositions ne sont jamais la même personne.
Chaque proposition se tient SEULE : elle ne parle que d'une personne, et ne renvoie à aucune des autres que tu proposes — ni par un nom, ni par une charge, ni par une périphrase.
Tu ne donnes de nom à personne et tu n'en inventes aucun : celui qui te lit les nommera lui-même.
Ces textes serviront plus tard de consigne à qui fait vivre ces personnes ; ils ne seront jamais lus tels quels à un joueur.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**Cinq décisions d'écriture à ne pas « corriger »** :
1. ⚠ **LE PIÈGE DE RECOPIE LE PLUS COÛTEUX DE L'ITÉRATION** — la ligne de nommage de `personnage-relations` cite **« celle qui tient la forge »** comme désignation *légitime*. Recopiée ici, elle **AUTORISE LA PÉRIPHRASE PAR LA CHARGE**, c'est-à-dire **la seule erreur de référence que ce rôle puisse commettre**.
2. « Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification » (`indice-detenteurs`) **tuerait les deux champs qui traversent** — **un rôle qui ne peut jamais réussir, et rien ne rougirait au dépôt**.
3. « une INTENTION … ce qu'il entreprend ensuite » (`personnage-plan`) gèlerait une **action datable** dans un champ que le moteur lit comme un **vouloir permanent**. La queue ferme la recopie **sans prononcer le mot « intention »**.
4. ⚠ **La ligne du visage est la ligne de l'itération** : *« ni son visage, ni sa voix, ni ce qui se raconte d'elle »* fait **trois** choses — bloque `apparence`, bloque `description_joueur`, et **referme le canal synopsis → public** — **sans nommer aucun champ**.
5. « trois au plus, **et au moins une** » — moitié symétrique du prédicat (7) : sans elle, **invite et validateur se contrediraient**.

**Interdit de réciter** : `FICHES_PROPOSEES_MAX` · `DEJA_ECRITS_MAX` · toute **autre** borne en toutes lettres · les noms de champs (`fonction`, `but`, `libelle`, `nom`, `portee`, `camp`, `objectif_id`, `plan_actions`, `savoirs`, `apparence`, `description_joueur`) · le fait que le code frappe un identifiant · la table d'audience · le langage D1 · seuils et tiers · **le mot « TOUR »**.

**`max_tokens` — la dérivation, pas la valeur** : `P_place` et `P_poursuite` **attestées sur deux sources indépendantes**, `L = 3 × (P_place + P_poursuite) + E`, **r = 2 pris comme pire cas**. **Dire si le résultat dépend du ratio, et s'il coïncide avec une valeur livrée** (200, 100, 400, 200, 700). **Mode d'échec nommé** : trois fiches longues tronquent le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. **C'est le bon échec.**

## 7 · Ce que ce poste laisse partir en `open_questions`
- **`but.pourquoi` n'est écrit par aucun rôle** — champ où la vérité MJ a légitimement sa place. Propriétaire : n° 12 ou Temps 2. **Ne pas l'ajouter ici** : troisième prose par élément, budget et coût de lecture doublés.
- **Aucune appellation re-projetée** — `nom` reste `auteur`, question **transverse**, n° 10.
- **L'unicité de la distribution n'est constatée par personne** — bornée par le contexte, jamais garantie.

## REJETÉS — pour le registre (BUG-082)

| Rejeté | Motif |
|---|---|
| **`description_joueur` dans la sortie** | Champ de **réputation publique** alimenté depuis `synopsis_mj` : **canal de fuite du secret** vers le narrateur de la n° 12, invisible à tout instrument (KR-229). **C'est R1 — sans elle mon verdict bascule.** |
| **`apparence` dans la sortie** | Déjà servie par `personnage-prose`. **Double une capacité livrée** et alourdit la lecture d'acceptation. |
| **`portee` choisie par le modèle** | `moteur` ; elle **SÉLECTIONNE** déjà les candidats en 3c. Posée par le code. |
| **`camp` proposé, même « pour aider »** | `moteur` **et spoiler** : un narrateur qui sait qu'un personnage est antagoniste **le joue hostile avant que la scène ne l'ait révélé**. Optionnel ⇒ omis (KR-221). |
| **`objectif_id` proposé** | `moteur`, **handle** — le modèle écrirait une référence. Et `canon.objectifs[]` n'a **aucune** clé `'ia'`. |
| **Un `nom` proposé, même « provisoire »** | KR-195 ; un nom provisoire **survivrait à la relecture parce qu'il a l'air rédigé**. |
| **Dériver l'identifiant du `nom` ou de la `place`** | KR-003 ; deux forgerons se marcheraient dessus. |
| **Des rangs `P1…Pn` sur les déjà écrits** | Table **sans consommateur** (KR-235) **et** invitation à la référence croisée. |
| **Réutiliser `CANDIDATS_MAX`** | **Sens inverse** (désignables vs exclus) — 5ᵉ refus du registre partagé. |
| **Réutiliser `PROPOSITIONS_MAX` / `REPLIQUES_PROPOSEES_MAX` / `RELATIONS_PROPOSEES_MAX`** | Même motif. |
| **`'aucun-candidat'` sur un monde vide** | Refuserait **le cas nominal** du rôle. |
| **Un cinquième `MotifRefusContexte`** | `a-ecrire` **avec charge** suffit dès que le synopsis entre dans `LIBELLE_DES_CHAMPS`. |
| **Un prédicat « places distinctes » ou « poursuites distinctes »** | **Refuserait une réponse juste.** Seul le **couple** est un doublon. |
| **Un prédicat de non-doublon contre le dossier** | Comparaison de **prose** — hors frontière testable. Se joue au **contexte**. |
| **Repêcher les fiches valides d'un lot fautif** | Réparation silencieuse (KR-230). |
| **Recopier la ligne de nommage de 3c** | Elle **autorise** la périphrase par la charge. |
| **Une ligne « deuxième personne, présent, immersive »** | `fonction` et `but.libelle` sont du **contexte injecté**, jamais émis verbatim. |
| **Une promesse d'écran sur « pas de doublons »** | Aucun prédicat ne les constate. |
| **Une mémoire des fiches refusées** | Inventerait un état de session dans un éditeur qui n'en a pas. |
| **`role` / `quete` / `metier` / `fiches` comme clés réseau** | Collision avec `Cible*.role` · `quete` est collection **et** espace de noms · `metier` rétrécit · `fiches` est un mot d'écran. |

---

**CONTESTATION D'UNE MESURE DU CADRAGE** : la mesure n° 5 (« le contexte disponible est de QUATRE chemins ») est exacte **à la première pression seulement**. `monde.personnages[].fonction` est `'ia'`, **déjà injecté par quatre rôles livrés**, et son absence ici est **la cause d'un défaut que rien ne constate**. **Le contexte de ce rôle est de CINQ chemins.**
