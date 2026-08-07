# Tour 1 — Narratif & IA · `dossier-format` it4

**RISQUE** — `DELTAS` est le vocabulaire de ce qu'une sortie de modèle pourra un jour *demander*. La décision n° 4 ne tombera pas le jour où l'IA lancera un dé : elle tombera le jour où la n° 11 écrira « le modèle renvoie une liste de deltas, le moteur les valide et les applique ». Ça **se lit conforme** — le moteur applique — et c'est pourtant le modèle qui choisit la statistique. Le registre naît sans dire **qui l'émet**, et personne ne le lui demandera après.

**OBJECTION** — (1) La phrase de démo ne couvre que les deltas à opérande **identifiant**. Trois opérations du relevé (`xp`, `pv`, `pe`) portent un **entier** : leur risque n'est pas la référence, c'est la **borne** — aucun critère de l'itération ne les tient. (2) Plus grave : **`docs/REGLES-DU-JEU.md` ne contient AUCUNE règle d'XP, de PV ou de PE posée par l'auteur.** § 5 *calcule* tout gain depuis ΔT ; § 1 *calcule* `PV = FO+AG+EN` et la récupération de PE. Admettre `accorder_xp: 3` écrit une règle de jeu **dans le dossier avant de l'écrire dans la source de vérité** — KR-130, sens d'écriture permanent — et le dossier gelé la figerait chez l'auteur.

**PROPOSITION** — `DELTAS` schéma 1 = **slots de référence uniquement**, **4 entrées** (annexe A), même règle d'admission que `PREDICATES`, opérande entier **écarté avec sa condition de réouverture nommée**. Trois réserves chiffrables : aucun `refKinds` ne porte `bestiaire` (1 assertion) · `DELTAS` n'est pas exportée hors `brain/dossier/` (1 test-grep) · `estCleDe` au site d'indexation (KR-175).

**VERDICT** — recevable sous réserve.

---

## ANNEXE A — Inventaire de `DELTAS` : relevé, pas conception

**Règle d'admission** (calquée sur `PREDICATES`, durcie d'un point) : un delta n'entre que si (a) un champ **nommé** de l'état de session le reçoit, (b) l'opération **existe déjà** dans le runtime, (c) tous ses opérandes sont des **identifiants stables**, et (d) — clause neuve — **le moteur peut l'appliquer sans lancer un dé**. Un delta dont la magnitude exige un jet n'est pas un delta : c'est une demande de jet. Même motif qui a sorti `jet_reussi` de `PREDICATES`.

| id | libellé | cible | ce qui y répond dans le runtime |
|---|---|---|---|
| `donner_objet` | « donne l'objet » | inventaire | `applyPnjGift` → `PnjGiftMutations.inventoryAdd` ; `usePlaySession.takeObject` |
| `retirer_objet` | « retire l'objet » | inventaire | `computeInventoryLoss(kind:'specifique')` → `inventory.filter` |
| `reveler_indice` | « révèle l'indice » | indices connus | `monde.indices_connus[]` — champ **déjà cité** par le prédicat `indice_connu` |
| `atteindre_jalon` | « marque le jalon atteint » | jalons | `monde.jalons_atteints[]` — champ cité par `jalon_atteint`, cas **déjà promis** par `types.ts` : « un jalon peut rester coché à la main par le moteur d'un événement » |

**Forme du littéral**, sans grammaire neuve, jumelle d'`ExprNode` : `{ delta: 'donner_objet', cibles: ['objet.clef-de-basalte'] }`. `cibles` reste un **tableau même à l'arité 1**, l'arité est **dérivée** de `refKinds.length`, le descripteur est `{ label, refKinds }` — le même que `PredicatDescripteur`, sans le copier.

**Écartés, motif à lever avant réouverture** :

| écarté | motif |
|---|---|
| `accorder_xp` | **§ 5 ne connaît aucun gain d'XP posé par l'auteur** — tout gain y est calculé depuis ΔT. Réouverture : une section de `docs/REGLES-DU-JEU.md`, puis la table dorée, puis le code. Jamais l'inverse |
| `modifier_pv` | § 1 calcule `PV = FO+AG+EN` et pose les seuils ; aucune magnitude d'auteur n'y existe. Le clamp du runtime est une **règle de § 1**, à ne pas confondre avec « un delta hors bornes rejette » — le premier borne le *résultat*, le second refuse la *valeur écrite* |
| `modifier_pe` | § 1 documente `+5` au changement de zone et `−1` par round : des **constantes de règle**, pas des valeurs d'auteur |
| `bonus_attaque` | § 5 plafonne la MC à **+5** avec porte `IN ≥ 6`, appliquée par la seule boutique d'XP. Un bonus d'auteur contournerait un plafond que le dossier ne connaît pas |
| `bonus_defense` | **absent de la doc des règles** — il vient des dons PNJ d'`action-pnj`, feature supprimée. Une valeur qu'aucune section ne porte |
| `modifier_carac` | seul chemin runtime = `applyCaracUpgrade`, **payant** et plafonné à 12. En delta gratuit, c'est la progression en double source |
| `equiper_objet` | `autoEquipObject` est une **conséquence** de la prise d'objet, pas une opération d'auteur |
| `ouvrir_combat` / tout `refKinds: ['bestiaire']` | **VETO de principe** : it3 a acheté « aucun prédicat ne peut ouvrir un combat » mécaniquement. Un delta qui nomme un monstre **détruit la propriété de l'autre côté** |
| `modifier_confiance` | n° 12 — la mécanique de l'échelle n'est pas écrite. C'est **le** delta que le modèle voudra émettre : l'admettre avant qu'il ait un domicile de session est exactement le glissement que la décision n° 4 interdit |
| `avancer_plan`, `consommer_evenement` | aucune horloge avant la n° 14 |

**Conséquence à tenir, à ne pas découvrir en it5** : avec un registre à slots de référence, `monde.conditions.climat[].effets_regles` **n'a aucun delta admissible** — un climat ne donne pas d'objet. La branche « delta sur chaque cible » de la checklist d'it5 doit donc se lire « sur chaque cible **admissible** », et `effets_regles: []` est légitime au sens de la doctrine absent/vide. Alternative honnête : écrire la section « effets de climat » dans `docs/REGLES-DU-JEU.md` **dans ce lot**. Je recommande la première : une itération de format n'est pas le lieu où s'invente une règle de jeu.

## ANNEXE B — Destinations

Aucune ligne neuve n'est nécessaire — **à une condition**. Les quatre lignes `…[]` sont déjà `moteur`. Mais dès qu'un delta porte des clés, le balayage pleine profondeur descendra dedans et **réclamera une destination pour chacune**.

Réserve : le balayage doit **s'arrêter au delta**, et cet arrêt doit être **dérivé de `CHEMINS_DE_DELTAS`**, jamais re-listé — mot pour mot le veto d'it3, pour la même raison. Contrepartie **indissociable** : le validateur de delta refuse **toute clé inconnue**. Sans elle, l'opacité devient une cachette.

## ANNEXE C — Contrat de sortie IA

**Aucun dans cette itération**, et je n'en demande pas (une table sans lecteur est une dette). Ce que je dépose est une **réservation** :

- **Entrée injectée** : *aucune*. Le modèle ne voit ni un id de delta, ni une magnitude, ni une cible — au mieux la **conséquence racontée** après application.
- **Schéma de sortie** : aucun champ de sortie modèle ne nomme un id de `DELTAS` au schéma 1. Le seul candidat futur est `delta_confiance` (n° 12), qui revient comme **sa propre décision**.
- **Échec** : la règle déjà écrite reste la règle — un delta hors bornes **rejette la sortie, il ne se clampe pas**.
- **Instrument qui tient la réservation** (KR-169) : un **test-grep** — `DELTAS` n'est référencée par aucun fichier hors `brain/dossier/` et n'est pas ré-exportée par `brain/index.ts`. Le jour où la n° 11 voudra la câbler dans un schéma de sortie, elle devra **supprimer un test** — c'est-à-dire prendre la décision au lieu de la subir.

## ANNEXE D — Sur BUG-050, vu de mon poste

Ce n'est pas seulement une brèche de validation. `savoirs: ["du texte"]` sort `ok:true` : le savoir est **silencieusement supprimé** du personnage. Le PNJ sera assemblé au contexte avec moins de savoirs que l'auteur n'en a écrits, `revele_comment` compris — et rien ne rougit, ni à l'import, ni au tour 40. C'est une **troncature silencieuse de contexte**, mon terrain.

L'autre moitié du même risque : un `apres_indice_id` ou un `contrepartie.objet_id` **pendant** n'est pas une coquille de référence, c'est une **porte qui ne s'ouvrira jamais** — le savoir est mort, l'auteur ne le voit pas, et la n° 12 injectera un PNJ qui ne peut rien dire. Résoudre ces trois champs est donc bien la tranche de l'itération.
