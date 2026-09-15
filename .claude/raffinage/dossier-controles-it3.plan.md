# Plan d'itération — `dossier-controles` · itération `3`

> Statut : `validé` — porte 2 franchie le 2026-09-15.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-15
> Composition : `5 rôles` — motif : l'itération définit ce qui rend une aventure **jouable** à partir de la substance du dossier (savoirs, indices, présences, `caractere.parler`), et l'une des tensions mesurées était une question d'**audience** `ia`/`moteur`. Le narratif a tranché cette tension et fourni l'inventaire des six chemins producteurs, sans lequel la règle bloquante était un faux positif.
> Exécution : `séquentielle` — **1 lot unique**, marqué `contrat`. Pas d'essaim, pas de worktree, pas de fusion.
> Découpage amont : l'itération 3 du cadrage portait **deux** livrables ; coupée le 2026-09-15 par décision humaine (voir § 8, D-0).

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit qu'un indice **qu'aucune source ne produit** rend son aventure injouable. » |
| **Tranche** | `brain/dossier/controles.ts` (4 entrées de registre + l'index privé des producteurs) → `controlerDossier` → `PanneauControles` rend les lignes, `SectionNav` allume les badges. **Aucune surface neuve** : it1 et it2 ont livré le rendu générique exprès. Aucune persistance — le rapport est recalculé à chaque rendu. |
| **Lots** | **1 lot** · dont `contrat` : **oui** (L1, seul) |
| **Hors périmètre** | Le pont vers les avertissements de `validateDossier` · l'atteignabilité et « canon sans objectif » · le clic d'une ligne vers sa section · la saturation transitive de `mene_a` · `Indice.portee` · la difficulté calibrée · le rendu de `jouable` en verdict global · tout tri, groupement ou plafonnement de la liste · toute assertion de teinte au rendu |
| **Reporté** | Le clic de ligne → **itération 4 nommée**, propriétaire PM, déclencheur = le commit qui ferme it3 *(validé le 2026-09-15 : le pont passe en it5, l'atteignabilité en it6)* · la saturation de `mene_a` → **it6**, avec l'itération d'atteignabilité, test séparateur déjà écrit · la réserve `climat[].effets_regles` → `open_questions`, propriétaire n° 14 |

**Ce que ce raffinage a changé par rapport au cadrage** — six points, tous mesurés :
1. « Cinq règles » devient **quatre entrées de registre** : orphelin et goulot sont une cause à deux seuils sur un seul compteur.
2. La **phrase de démo du cadrage encodait la définition rejetée** (« que personne ne détient » : `indice.cendres-tiedes` n'est détenu par personne et l'aventure reste jouable). Corrigée.
3. La `resolved_decision` d'it1 sur l'audience est **mesurément fausse** ; elle s'amende, elle ne se glose pas.
4. « Indice orphelin » lue depuis `savoirs[]` seul serait un **faux positif bloquant sur la fixture de toutes les preuves**.
5. « Départ désert » se déclenche **par vacuité** sur tout dossier neuf si elle n'est pas gardée.
6. Le cadrage annonçait « aucune autre feature touchée » : **faux**, un littéral de test de `bascule-editeur` est atteint par le changement de contrat.

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit qu'un indice qu'aucune source ne produit rend son aventure injouable.

## 2 — Hors périmètre

- **Le pont vers les avertissements de `validateDossier`** — itération distincte, coupée du cadrage le 2026-09-15.
- **L'atteignabilité par saturation et « canon sans objectif »** — dépendent d'`atteignabilite.ts`, qui n'existe pas et ne naîtra **que par extraction** (§ 4).
- **Le clic d'une ligne vers sa section** — reporté deux fois, désormais **itération 4 nommée avec propriétaire** (§ 8, D-20). Y toucher ferait entrer une deuxième feature en production.
- **La saturation transitive de `mene_a`** — livrée à plat, charge d'**it6** écrite (§ 8, D-11) : elle voyage avec l'atteignabilité, pas seule.
- **`Indice.portee` et « Intrigue en second plan »** · **« Difficulté non calibrée »** (n° 16) · **le focus dans le champ fautif** — décisions closes au cadrage, non rouvrables.
- **Le rendu de `jouable` en verdict global** — premier rendu légitime en n° 9 (`previewDisabledReason`).
- **Tout tri, groupement, plafonnement ou pagination de la liste** — l'acquis « aucune vue ne trie » tient ; masquer un bloquant derrière un plafond est le contresens de fond.
- **Toute différenciation visuelle** au-delà du couple mot+teinte de `pastilles.ts`.
- **Toute assertion de teinte au rendu** — l'instrument est cassé (`toHaveStyle` passe sur n'importe quel jeton `var()`).
- **Toute modification de `DESTINATION_DES_CHAMPS`, `types.ts`, `validate.ts`, `tables.ts`, `pastilles.ts`, `sections.ts`, `brain/index.ts`**, et des **deux fixtures partagées**.

## 3 — Contrat de design

**Aucune surface neuve.** `ListeControles` rend déjà n'importe quel `Controle[]` dans l'anatomie à trois lignes + pastille ; `badgeSection` fusionne déjà compte et niveau ; le texte d'état calme (« … passe tous les contrôles **connus**. ») **reste vrai** avec quatre règles de plus et ne change pas.

**Les cinq textes, à écrire tels quels.** `location` = `localiserEntite(espace, entité, index)` — repli « {Type} n°{index} (sans nom) ». Aucun terme interne (`Delta`, `refKinds`, `SourceIndice`, `savoirs[].indice_id`) n'atteint la prose. Aucun message ne dit « votre aventure est injouable » : `jouable` est dérivé dans `RapportControles` et nulle part ailleurs.

| # | Règle · niveau | `section` | `path` | QUOI (constat) | QUOI FAIRE (remédiation) |
|---|---|---|---|---|---|
| 1 | `indice-sans-source` · **BLOQUANT** (0 producteur) | `indices` | `monde.indices[].id` | « Aucun personnage, aucun effet et aucun enchaînement ne donne cet indice : le joueur ne pourra jamais l'obtenir. » | « Confiez-le à un personnage (Personnages → Savoirs), révélez-le par un effet « révèle l'indice », ou faites-y mener un autre indice (Indices → Mène à). » |
| 2 | `indice-sans-source` · **ALERTE** (1 producteur) | `indices` | `monde.indices[].id` | « Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible. » | « Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement depuis un autre indice (Indices → Mène à). » |
| 3 | `depart-desert` · **BLOQUANT** | `depart` | `charpente.depart.lieu_id` | « Aucun personnage n'est présent au lieu de départ, le seul tour que l'auteur ne peut plus rattraper en jeu : la partie s'ouvre sans interlocuteur. » | « Donnez une présence dans ce lieu à au moins un personnage (Personnages → Présence), ou changez le lieu de départ (Départ). » |
| 4 | `personnage-sans-presence` · **ALERTE** | `personnages` | `monde.personnages[].presence[].lieu_id` | « Ce personnage n'a de présence dans aucun lieu : le joueur ne pourra jamais le rencontrer. » | « Ajoutez au moins une présence à ce personnage — un lieu, et si besoin un moment (Personnages → Présence). » |
| 5 | `personnage-sans-voix` · **INFO** | `personnages` | `monde.personnages[].caractere.parler[]` | « Ce personnage n'a aucune réplique type : le modèle inventera sa façon de parler, et elle changera d'un tour à l'autre. » | « Écrivez une ou deux répliques telles qu'il les dirait (Caractère exploitable → Manière de parler). » |

**Ancres de navigation vérifiées dans le code** : `Savoirs` (`FichePersonnage.tsx` l. 277, titre de bloc) · `MÈNE À` (`FicheIndice.tsx` l. 157) · `PRÉSENCE` (`BlocPresence.tsx` l. 51) · `MANIÈRE DE PARLER` (`BlocCaractere.tsx` l. 158) · `révèle l'indice` (`deltas.ts` l. 67).

**Registre de langue, non amendable** : constat à l'**indicatif présent impersonnel**, sujet = le document ; remédiation à l'**impératif, 2ᵉ personne du pluriel**. Jamais de deuxième personne immersive ni de présent narratif — *le linter n'est pas le narrateur*.

**Deux contraintes propositionnelles** : (a) « rien ne peut **jamais** le faire parvenir au joueur » n'est affirmable que parce que le code vérifie **les six chemins** ; (b) l'énumération des remèdes est **isomorphe** à l'ensemble des producteurs comptés — trois familles comptées, trois familles offertes. Le message 2 ne nomme **aucune** famille (« un seul **chemin** », jamais « un seul **personnage** » : mesuré faux sur `cendres-tiedes`).

**Clavier / états** : inchangés. Aucune interaction neuve.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CONTROLES` | registre | étendu | **4 entrées neuves**, déclarées **APRÈS** `amorce-non-redigee` (ordre des clés = ordre de rendu) |
| `controlerDossier` | service | inchangé | `(dossier: Dossier) => RapportControles` — **aucune signature publique ne change** |
| `controleRemediation` | service | inchangé | `(controle: Controle) => string` |
| `producteursParIndice` | fonction **privée** à `controles.ts` | neuve | `(dossier: Dossier) => Map<string, SourceIndice[]>` — pure, totale, ne ferme sur rien (en particulier pas sur `CONTROLES`) |

**Aucun export neuf de `brain/index.ts`.** *Un contrat qui ne bouge pas est le meilleur résultat possible d'une itération de registre.*

**`producteursParIndice` est le CONTRAT D'EXTRACTION d'it6** : elle garde ce **nom** en traversant vers `atteignabilite.ts`, où elle sera **déplacée, jamais réécrite**. Un déplacement se relit en diff ; une réécriture sous un autre nom passe inaperçue.

**Les six chemins producteurs** (union, pas branches disjointes) : `monde.personnages[].savoirs[].indice_id` · les **4 sites de `CHEMINS_DE_DELTAS`** filtrés sur `delta === 'reveler_indice'` (quêtes/récompense, événements/résolutions, climat/effets_regles, jalons/effet) · `monde.indices[].mene_a[]` **lu à plat**.

**Les quatre sites de deltas se lisent en ACCÈS TYPÉS**, jamais par un marcheur de chemins générique. Motif (veto tech-lead, dans son domaine) : `sitesDe` est **privée à `validate.ts`** et son import est déjà interdit par un test existant (`SOURCE_CONTROLES).not.toContain("from './validate'")`) ; en réécrire un dans `controles.ts` créerait un **second moteur de traversée** du schéma, non typé, qui dériverait de la grammaire figée de `sitesDe`. La garde KR-199 n'est pas l'énumération mais la **mesure** : `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` + un delta planté à chacun des quatre sites.

⚠ `CHEMINS_DE_DELTAS[].location` est un **LIBELLÉ** (« Jalons », « Climat »), **jamais un `SectionId`** : il n'entre pas dans `ConstatControle.section`.

**Le compteur, forme exacte :**

```ts
const producteurs = producteursParIndice(dossier)
for (const [index, indice] of dossier.monde.indices.entries()) {
    const nombre = producteurs.get(indice.id)?.length ?? 0   // absent de la Map = ZÉRO
    if (nombre >= 2) continue
    const niveau = nombre === 0 ? 'bloquant' : 'alerte'
    …
}
```

Trois points non devinables : **(a)** le `?? 0` — sans lui, `undefined.length` ferait **lever** `controlerDossier`, qui est pure et totale au contrat ; **(b)** le `message` dispatche sur le **`niveau`** (table privée `Record<'bloquant' | 'alerte', …>`, **jamais** `Record<NiveauControle, …>` qui exigerait une ligne `info` que cette règle n'émet pas) ; **(c)** repli de `remediation` : chaîne **vide**, jamais une levée, jamais une consigne inventée — un appelant peut tenir un `Controle` forgé.

**Les trois gardes de `depart-desert`** — la règle se tait si : `monde.personnages` est **vide** (un monde sans casting ne manque pas quelqu'un *ici*, il manque quelqu'un *partout*) · `charpente.depart.lieu_id` ne résout **aucun lieu** (c'est une anomalie `error` que le canal des contrôles ne doit pas doubler, KR-217 ; et sans cette garde `localiserEntite('lieu', undefined, -1)` rendrait « Lieu n°0 (sans nom) » en production) · sinon elle compare `depart.lieu_id` aux `presence[].lieu_id` de tous les personnages.

> **Pourquoi la garde de vide est obligatoire et ne peut pas être « mécanique »** : « départ désert » est une propriété **de la collection**, pas de ses éléments. Un prédicat universel sur l'ensemble vide est **vrai** — c'est de la logique, aucune reformulation ne le contourne. Les quatre autres règles sont des `filter` et se taisent d'elles-mêmes.

## 5 — Lots

### Lot 1 — `regles-de-registre` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, **seul**)
- **But** : les quatre entrées de `CONTROLES` et l'index privé des producteurs, avec la ligne de base des tests remise d'aplomb.
- **Fichiers** (4, tous **R**) :
  - `src/brain/dossier/controles.ts` — +4 entrées (**après** `amorce-non-redigee`), +`producteursParIndice`, +les proses du § 3
  - `src/brain/dossier/controles.test.ts` — réécriture des **6** assertions de ligne de base, **refonte du balayage l. 172-186**, +les corps de test du § 7
  - `src/features/dossier-controles/tests/panneauControles.test.tsx` — **+1 test** (preuve verticale). Les 3 existants **inchangés**
  - `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` — **+2 champs dans UN littéral** (l. 337). **Aucune assertion modifiée**
- **Critères couverts** : #1 à #8

**Pourquoi un lot unique** : zéro composant, zéro prop, zéro export neuf — **rien à paralléliser**. Les deux découpages concevables (index vs règles ; indices vs personnages) **partagent tous deux `controles.ts`** : propriété non disjointe, veto. *Le découpage révèle le parallélisme, il ne le crée pas.*

**Le signal de coupe « plus d'une feature » ne se déclenche pas** : l'itération ne touche **aucun fichier de production** d'une autre feature ; elle amende **un littéral** dans **un** test de `bascule-editeur`, rendu nécessaire par le changement de contrat `brain/` lui-même — et la skill excepte nommément le lot `contrat`.

**Le correctif du test voisin, en toutes lettres** — compléter le littéral, **jamais** l'assertion :

```ts
personnages: [{
    id: 'pnj.aldur-le-sage', portee: 'premier', plan_actions: [], savoirs: [],
    presence: [{ lieu_id: dossier.charpente.depart.lieu_id }],   // jamais 'lieu.amorce' en dur
    caractere: { parler: ['Je ne dirai rien avant la nuit.'] },
}]
```

Réécrire l'assertion en `'1 fiche · ALERTE'` accrocherait un test de `bascule-editeur` au **jeu de règles de `dossier-controles`** — couplage inter-features par assertion, qui rougirait à chaque règle future. **Refusé.**

## 6 — Critères d'acceptation

1. **Étant donné** un indice sans savoir, sans delta `reveler_indice` et sans `mene_a` entrant, dans un clone de `dossier-minimal.json` muté d'un seul champ, **quand** `controlerDossier` s'exécute, **alors** un constat `bloquant` de section `indices` et de path `monde.indices[].id` est produit ; **et** le même indice porté à **exactement un** producteur rend `alerte` ; **et** porté à **deux** rend le silence — les trois états dans le même test. — *contrat* — *L1*
2. **Étant donné** un clone dont `monde.indices` est remplacé par le cycle `A.mene_a=['B']` / `B.mene_a=['A']`, sans aucune autre source, **quand** le rapport est calculé, **alors** chacun des deux porte une **ALERTE** (lecture à plat) — le test nomme l'implémentation retenue et son basculement attendu à it6. — *contrat* — *L1*
3. **Étant donné** un clone où l'unique personnage n'est plus présent au `charpente.depart.lieu_id`, **quand** le rapport est calculé, **alors** un `bloquant` de section `depart` est produit ; **et étant donné** `construireAmorce()` (zéro personnage), **alors** aucun constat « départ désert » n'est produit et `controlerDossier(seme()).controles` garde une longueur de **4**. — *contrat* — *L1*
4. **Étant donné** un personnage sans `presence[]` et un autre avec au moins une présence, **quand** le rapport est calculé, **alors** une `alerte` est produite pour le premier **seul**. — *contrat* — *L1*
5. **Étant donné** un personnage sans `caractere.parler` (absent ou vide) et un autre avec au moins une réplique **et tous ses curseurs à `CURSEUR_MIN`**, **quand** le rapport est calculé, **alors** une `info` est produite pour le premier **seul**, et aucun constat n'est fondé sur une **valeur** de curseur (KR-221). — *contrat* — *L1*
6. **Étant donné** un `Record<ControleId, Dossier>` **total par compilation** exhibant un témoin par règle, **quand** le registre est balayé depuis `Object.keys(CONTROLES)`, **alors** chaque règle produit au moins un constat, chaque constat rend un niveau ∈ `descripteur.niveaux` et un `path` clé de `DESTINATION_DES_CHAMPS` (`estCleDe`, jamais `in`), **et** pour chacune des 4 entrées neuves `path.split('.')[0] !== section` (KR-219 étendu). — *contrat* — *L1*
7. **Étant donné** un dossier portant au moins un bloquant, **quand** le rapport est calculé, **alors** `jouable` est faux, `controles.ts` n'importe jamais `validateDossier` (balayage de source) et aucun `Controle` ne porte `severity`. — *contrat + revue de source* — *L1*
8. **Étant donné** les six assertions de ligne de base identifiées (l. 115, 121, 129, 143, 257, 265), **quand** elles sont rejouées après le lot, **alors** chacune est réécrite en compte **FILTRÉ par règle** (`controle.id === 'amorce-non-redigee'`), jamais en compte global, et les suites `controles.test.ts`, `panneauControles.test.tsx`, `dossierEditorScreen.test.tsx`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts`, `pastilles.test.ts` sont vertes. — *porte de commit + revue de source* — *L1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `un indice sans aucun producteur bloque, un seul producteur alerte, deux se taisent` | les trois états sur le même clone | contrat | KR-197/202, KR-164 | L1 |
| `un cycle mene_a sans autre source rend deux alertes, pas deux bloquants` | lecture à plat nommée | contrat | KR-222 | L1 |
| `mene_a compte comme producteur` | `charpente.jalons[0].effet = []` → `sceau-brise` reste **calme** (savoir + `mene_a` = 2) ; sans `mene_a` il serait à 1 → alerte | contrat | — | L1 |
| `les quatre sites de deltas sont tous lus` | un `reveler_indice` planté à chacun des 4 sites est vu ; `expect(CHEMINS_DE_DELTAS).toHaveLength(4)` | contrat | KR-199 | L1 |
| `le lieu de depart desert bloque, et se tait sur un dossier sans personnage` | les deux moitiés + longueur 4 sur `seme()` | contrat | KR-222 | L1 |
| `un depart pendant ne produit aucun controle` | troisième garde | contrat | KR-217, KR-225 | L1 |
| `un personnage sans presence alerte, un personnage place se tait` | deux entités, même test | contrat | KR-197/202 | L1 |
| `personnage sans voix propre ne se fonde jamais sur une valeur de curseur` | curseurs tous à `CURSEUR_MIN` sur le témoin calme | contrat | **KR-221** | L1 |
| `chaque regle du registre exhibe un temoin qui la declenche` | `Record<ControleId, Dossier>` total | contrat | KR-199 | L1 |
| `la section de chaque controle est declaree, jamais derivee du path` | étendu aux 4 entrées : `path.split('.')[0] !== section` | contrat | **KR-219** | L1 |
| `les path sont des cles de DESTINATION_DES_CHAMPS` | `estCleDe` sur le rapport complet | contrat | KR-175 | L1 |
| `le clone intact porte exactement une alerte indice-sans-source` | **sonde de ligne de base** — sans elle, la prochaine règle refera la bascule en silence | contrat | — | L1 |
| `un indice orphelin remonte une ligne BLOQUANT dans le panneau` | **preuve verticale = la phrase de démo** ; matche un **fragment** distinctif, jamais une phrase entière recopiée (encapsulation) | composant | — | L1 |
| `un seul site filtre le delta reveler_indice dans brain/dossier` | garde de source — **contrepartie actée en D-10**, omise de ce § 7 à la rédaction du plan ; ajoutée à la livraison | contrat | — | L1 |
| `un indice qui se mene_a lui-meme est compte comme tout autre arete` | auto-référence : **1 producteur → alerte**, puis l'arête retirée → **bloquant**. *Ajouté après la QA mode B, qui a mesuré que le cas était annoncé « couvert » sans l'être* | contrat | KR-194 | L1 |

**KR-217 à l'exécution** : l'assertion « aucun `Controle` ne porte `severity` » est balayée **dans** le test des témoins (`Record` total), donc elle couvre les cinq règles et toute règle future. *Ajoutée après la QA mode B, qui a mesuré qu'elle n'était tenue que par le typage pour les 4 entrées neuves — or un constat assemblé dynamiquement échappe au contrôle d'excès de propriété. Sonde exécutée : un `severity` injecté par `Object.assign` passe `tsc` et rougit ce test.*

Cas limites couverts : collection vide (les 4 règles) · vide **vacant** (départ désert) · référence pendante (départ) · cycle `A↔B` · **auto-référence `mene_a`** (légale, KR-194) · `Controle` forgé (repli de `remediation`).

**Non vérifiable en l'état — à recopier dans la revue :**
- **KR-224** — la prémisse « aucun accès alternatif au premier tour » n'est vérifiée par **aucun test** et ne peut pas l'être : il n'existe aucun graphe de lieux à interroger. Un futur ajout de graphe devra la reprendre.
- **Le relevé de volume** sur `dossier-reference.json` (1 bloquant / 4 alertes / 5 infos / 10 lignes) est un **fait daté de la revue**, pas une assertion committée (§ 8, D-9).
- **La largeur rendue** du badge composé — jsdom ne calcule aucun layout (hérité d'it2).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| D-0 | orchestrateur | L'itération 3 du cadrage portait deux livrables sans phrase de démo commune | `RETENU` | Coupée par décision humaine le 2026-09-15 : le pont des avertissements part en itération distincte |
| D-1 | TL R-1, narratif, QA | Deux entrées de registre pour orphelin + goulot | `REJETÉ` | Un seul compteur, deux seuils ; scinder serait **KR-164 en sens inverse**. La formulation à deux branches de la QA laisse `cendres-tiedes` (0 savoir + 1 delta) **entre** ses branches — silence de classe KR-222. La QA l'a retirée |
| D-2 | TL R-2 | La fixture d'exercice locale (N) annoncée au cadrage | `REJETÉ` | Le `Record<ControleId, Dossier>` fabrique les témoins **dans le test** ; une fixture de plus est une troisième vérité figée |
| D-3 | narratif, TL R-6, PM | « Indice orphelin » abaissée à alerte au nom de l'audience `ia` de `savoirs[].indice_id` | `REJETÉ` | La clause d'it1 est **mesurément fausse** (l. 261 = `ia`) et s'**amende**. Formulation retenue : *le critère n'est pas l'audience de la clé lue, c'est la **nature du geste** qui éteint le voyant* — rédiger de la prose `ia` n'est jamais bloquant, poser une **référence** peut l'être. Discriminant : `includes`/`trim` vs `===`/appartenance |
| D-4 | narratif, TL, QA | « Indice orphelin » calculée depuis `savoirs[].indice_id` seul | `REJETÉ` | **Faux positif bloquant mesuré** sur la fixture de toutes les preuves |
| D-5 | narratif | Une **exception** d'audience accordée au seul chemin `savoirs[].indice_id` | `REJETÉ` | Une exception par chemin cesse d'être une règle au troisième cas. **Doctrine conservée au registre**, sans objet sur le cas d'espèce |
| D-6 | TL R-4, QA | Ajouter `…presence` / `…caractere.parler` à `DESTINATION_DES_CHAMPS` | `REJETÉ` | Ligne **morte par construction** (`destinations.ts` l. 87-90), rougie par l'assertion « aucune ligne morte » de `couverture.test.ts` (l. 540-546, vérifiée) |
| D-7 | TL R-5, narratif | Dériver la `section` d'un contrôle de son `path` | `REJETÉ` | KR-219. Démontré trois fois : `indice-sans-source` (path `indices`, remède dans Personnages), `depart-desert` (path `charpente`, section `depart`, repère sur un Lieu, remède dans Personnages) |
| D-8 | UX | Section `lieux` pour « départ désert » | `REJETÉ` | **Retiré par son auteur** après vérification de `sections.ts` : `depart` a `cle: 'charpente.depart'`, racine exacte du path fautif. Et router le bloquant vers `lieux` allumerait un rouge sur une section **sans aucun geste** qui l'éteigne — cul-de-sac de navigation. Le `location` de l'UX (`localiserEntite('lieu', …)`) est **conservé** : `section` et `location` sont deux champs distincts |
| D-9 | narratif | Borner « sans voix propre » à `portee === 'premier'` | `REJETÉ` | **Retiré par son auteur**, sur un motif plus fort que le chiffre : `portee` est le **plancher du schéma**, posé à `'premier'` à la création (`types.ts` l. 271-278) — la borne est **inerte** sur un dossier réel, les 8 points gagnés sont un artefact de la fixture. Le PM ajoute l'asymétrie inexplicable avec « sans présence », non bornée |
| D-10 | narratif | `atteignabilite.ts` créé dès it3 (« deux parcours seraient deux vérités ») | `REJETÉ` | **Retiré par son auteur** : les deux positions ne produisent **qu'un seul parcours à tout instant**, le rejet visait une option que personne ne proposait. Contrepartie **RETENUE** : nom figé `producteursParIndice`, charge d'**extraction** écrite pour it6, `brain_contracts` corrigé de « itération 4 » en « itération 6, par extraction », + une garde de source (un seul site filtrant `delta === 'reveler_indice'` dans `brain/dossier/`) |
| D-11 | TL | Saturation de `mene_a` par point fixe dès it3 | `REJETÉ` | **Retiré par son auteur** après avoir construit la mutation : elle exigeait **quatre champs**, donc son propre R-2 par la porte de derrière. Lecture **à plat** retenue — sens d'erreur permissif : sur un cycle elle rend ALERTE là où la saturation rendrait BLOQUANT, **sous-gradué, jamais éteint** |
| D-12 | QA | « `mene_a` à plat vs saturé est indiscriminable » (position de l'orchestrateur et du TL) | `REJETÉ` | **La QA a trouvé la mutation** : remplacer `monde.indices` par le cycle `A↔B` est **UN SEUL champ**. Vérifié : à plat 2 alertes, saturé 2 bloquants. Le choix est donc **prouvable** et porte un test nommé (§ 7) |
| D-13 | TL R-7, QA | « Départ désert » sans garde `personnages.length > 0` | `REJETÉ` | Se déclenche **par vacuité** sur tout dossier neuf (prédicat universel sur l'ensemble vide). Unanime |
| D-14 | TL | Un marcheur de chemins générique dans `controles.ts` pour les sites de deltas | `REJETÉ` | **Veto tech-lead, dans son domaine** : second moteur de traversée du schéma, non typé, dérivant de la grammaire figée de `sitesDe` (privée à `validate.ts`, import déjà interdit par un test). **Quatre accès typés** |
| D-15 | narratif | Exclure `climat[].effets_regles` des producteurs | `REJETÉ` | Sur une règle **bloquante**, l'erreur permise est le faux négatif, jamais le faux positif. Coût mesuré **nul** (les deux fixtures le portent vide). Réserve → `open_questions`, propriétaire n° 14 |
| D-16 | narratif | Toute règle jugeant la **qualité** d'une prose | `VETO — RETENU` | Dans son domaine, et **sans coût** : personne ne le propose. Formulation durcie retenue comme doctrine : *une règle dont le verdict n'est pas décidable par une fonction **pure et totale** du `Dossier` n'est pas une règle de linter, c'est un appel de modèle* |
| D-17 | UX | Grouper / trier / plafonner les lignes du panneau | `REJETÉ` | L'acquis « aucune vue ne trie » tient ; masquer un bloquant derrière un plafond contredit le but du linter. Maintenu par son auteur |
| D-18 | UX | Le relevé de volume **committé en test** (`toHaveLength(10)` sur `dossier-reference.json`) | `REJETÉ` **comme test**, `RETENU` **comme fait de revue** | `controles.test.ts` ne lit que `dossier-minimal.json` ; épingler un compte sur une fixture lue par **huit suites et possédée par personne** ferait rougir `dossier-controles` pour un défaut qui n'est pas le sien (TL 3.E, QA rejet n° 1). Et le compte **dépend de D-19** (1/4 vs 0/5) — cible mouvante. L'inquiétude de l'UX (« un chiffre recopié rote ») est **fondée** : le relevé est un fait **daté** de la revue, à refaire, pas à recopier |
| D-19 | PM (terrain), narratif (réserve) | Le niveau de « départ désert » : bloquant ou alerte | `RETENU` : **bloquant, avec prémisse écrite** | Le PM tranche sur son terrain : *le lieu de départ est le seul point **sans itinéraire de contournement**, puisqu'aucune partie n'atteint un deuxième tour sans être passée par lui. KR-224 amortit l'absence d'un PNJ **isolé** ; il ne dit rien du tour zéro.* Le narratif ajoute que KR-224 porte sur l'**existence d'un chemin**, jamais sur la **connaissance d'une destination**. La prémisse entre **mot pour mot dans le message** (exigence QA), pas seulement en note |
| D-20 | PM, TL R-8, UX | Intégrer le clic de ligne → section dans it3 | `REPORTÉ` → **itération 4 nommée** | Ferait entrer une **deuxième feature en production** dans la seule itération de n° 7 qui n'en touche aucune, et un lot unique en deux lots. **Troisième report, mais plus muet** : itération nommée, propriétaire **PM**, déclencheur **événementiel** (le commit qui ferme it3). **Validé par l'humain le 2026-09-15** : décale le pont en it5 et l'atteignabilité en it6 |
| D-21 | narratif | La phrase de démo du cadrage encode la définition rejetée | `RETENU` | « que personne ne détient » est **mesurément faux** : `cendres-tiedes` n'est détenu par personne et l'aventure reste jouable. Corrigé en « **qu'aucune source ne produit** » dans la fiche, le § 1 et `iterations[3].goal` |
| D-22 | TL, QA | « L'itération ne touche aucune autre feature » (TL, tour 1) | `REJETÉ` | **Retiré par son auteur**, mesuré faux : `dossierEditorScreen.test.tsx` l. 337 injecte un personnage sans `presence` ni `caractere`. Formulation juste : *aucun fichier de **production** d'une autre feature* |
| D-23 | QA, TL | « Quatre assertions de ligne de base » (orchestrateur et TL) | `REJETÉ` | **SIX**, mesuré indépendamment deux fois : l. 115, **121**, **129**, 143, 257, 265. Plus le balayage de discriminance l. 172-186, d'une autre nature — **septième site** |
| D-24 | QA | « KR-219 gardé mais pas testable pour les 4 entrées » (QA, tour 1) | `REJETÉ` | **Retiré par son auteur**, reposait sur une affirmation fausse : dans les **quatre** cas le premier segment du `path` diffère de la `section`. Le test est possible et **exigé** (critère 6) |

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] *(score de mutation : **sans objet** — l'itération ne touche ni `challenge`, ni `combat`, ni `xp`, ni `characteristics`)*
- [ ] Les 13 tests du § 7 écrits et passants
- [ ] Les 8 critères du § 6 cochés un par un
- [ ] Les **six** assertions de ligne de base réécrites en comptes **filtrés**, et le balayage l. 172-186 refondu en `Record<ControleId, Dossier>` total
- [ ] Les 4 entrées déclarées **APRÈS** `amorce-non-redigee` (l. 122-124 et 144 lisent `controles[0]`)
- [ ] Aucun fichier touché hors des **4** de L1
- [ ] Relevé de volume sur `dossier-reference.json` **refait** et daté dans la revue (ventilé par niveau)
- [ ] Budget de contexte relevé (`specification.json` de la feature, `code-knowledge.json`)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-controles-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **levée** | « une ligne par règle » : les cinq lignes existent (§ 3) |
| Tech Lead | recevable sous réserve → **levée** | 4 entrées · compteur `?? 0` · `mene_a` à plat · section `depart` · 6 assertions + balayage · accès typés · littéral voisin complété |
| UX | recevable sous réserve → **levée** | textes finaux écrits (§ 3) ; relevé de volume → revue (D-18) |
| QA | recevable sous réserve → **levée** | garde de vide écrite (§ 4) · `path` tranché · KR-219 testé (critère 6) |
| Narratif & IA | recevable sous réserve → **levée** | clause d'audience **amendée** (D-3) · démo corrigée (D-21) · six points propositionnels tenus (§ 3) · charge d'extraction écrite (D-10) · réserve climat (D-15) · test du cycle (§ 7) |

**Aucun `ESCALADE`** : le seul veto (D-16) est dans le domaine de son émetteur, ne bloque aucune décision de cette itération, et est retenu comme doctrine.
