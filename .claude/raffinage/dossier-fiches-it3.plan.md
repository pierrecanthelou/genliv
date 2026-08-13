# Plan d'itération — `dossier-fiches` · itération 3

> Statut : **`validé`** — porte 2 franchie le 2026-08-13 (validation humaine explicite)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-13
> Composition : **5 rôles** — motif : l'itération touche le schéma du dossier d'aventure, une règle de jeu dérivée (`maxPV`, KR-130) et les audiences de `destinations.ts`.
> Exécution : **séquentielle** (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut régler les caractéristiques de son personnage. » |
| **Tranche** | bloc 3 de l'accordéon (`FichePersonnage`) → handler d'écriture (`PanneauPersonnages`) → `DossierService.update()` → document persisté, validé par `ENUMERES_FERMES` et déclaré `moteur` dans `destinations.ts` |
| **Lots** | 2 lots · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | `tier`, tout `pv` stocké, les curseurs (it6), le retrait d'un personnage (it5), le libellé narratif dérivé du chiffre (n° 10), toute extension de `Stepper` |
| **Reporté** | la **suffisance** (« un personnage qui se bat doit-il avoir ses 3 caracs ? ») → n° 9 · le libellé par palier → n° 10, entrée `open_questions` **élargie**, pas dupliquée |

---

## 1 — But raffiné

À la fin de cette itération, **l'auteur peut régler les caractéristiques de son personnage**.

Le PV n'est pas une seconde capacité : il n'est jamais saisi, jamais stocké, jamais choisi — il s'affiche comme conséquence dérivée du même geste (`maxPV`, § 1 de `docs/REGLES-DU-JEU.md`).

## 2 — Hors périmètre

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

- **Tout mécanisme générique de « Record à clés fixes »** — pas de table `RECORDS_A_CLES_FIXES`, pas de joker dans le walker de `couverture.test.ts`, pas de point d'arrêt. Deux étalements de trois lignes (it3 pour `CHARACTERISTIC_VALUES`, it6 pour `CURSEURS`) valent mieux qu'une abstraction à deux appelants dont le rayon d'explosion est le garde d'audience du schéma.
- **`src/brain/characteristics.ts`** — non touché. `CARACTERISTIQUE_MIN` va dans `src/brain/dossier/types.ts`.
- **Toute extension de `src/brain/components/Stepper.tsx`** — retirée par l'UX au tour 2 : sous le schéma total, `Stepper` ne reçoit jamais `undefined`.
- **`tier`** (n° 13) · **tout `pv` stocké** (KR-192) · **les 6 curseurs de caractère** (it6) · **le retrait d'un personnage** (it5).
- **Le libellé narratif dérivé du chiffre** (« FO élevée ») pour le contexte modèle — n° 10.
- **Toute résolution de jet / lecture runtime des caractéristiques par le moteur** — Temps 2.
- **L'extraction `hooks/useEcriturePersonnages.ts`** — it4, quand `plan_actions[]` apportera une seconde famille de handlers de liste.
- **Un nouveau chemin de refus / bandeau pour ce bloc** — inatteignable par construction (le `clamp` interdit toute valeur hors bornes) : on ne construit pas un bandeau qui ne peut jamais s'allumer.
- **Teinte `--good` / `--bad` sur le PV** — seules réussite/échec de jet portent ces couleurs.
- **`BrouillonPersonnage` / `ChampTexte` / `commit()` / `RefusEnCours`** — inchangés, non rouverts (BUG-058, KR-197).
- **Réécriture de `REGLES-DU-JEU.md` § 1 au-delà de la phrase d'échelle** — pas une refonte du chapitre.
- **Les dispenses `LIBRES` / `SANS_DESTINATION`** posées à it2 — non rouvertes.

## 3 — Contrat de design

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

**Emplacement** — `caracteristiques` quitte la table `BLOCS_VIDES` de `FichePersonnage.tsx` (qui tombe à 5 entrées). Titre du bloc inchangé : **« Caractéristiques »** (déjà épinglé par `panneauPersonnages.test.tsx` — ne pas y toucher). Constante `BLOC_3_ID = 'caracteristiques'` à côté de `BLOC_1_ID` / `BLOC_2_ID`. Le bloc ne s'ouvre pas automatiquement : `defaultOpenId` reste le bloc 1.

**Deux états exclusifs, jamais de troisième.**

**(A) `personnage.stats === undefined`** — la grille et la ligne PV **n'existent pas**. Une seule affordance :

```
+ Régler les caractéristiques…
```

`<button type="button">` natif stylé, même patron que `+ Ajouter un personnage…` déjà en production dans `PanneauPersonnages.tsx` (`boutonAjouterStyle`) : `border: 1.5px dashed var(--accent)` · `background: var(--accent-bg)` · `color: var(--accent)` · `border-radius: var(--r-md)` · `min-height: var(--hit-target)` · `font-family: var(--font-ui)` · `font-size: var(--fs-body)`. Sentence case, pas mono, pas majuscules : c'est une action, pas un libellé de champ. **Pas un composant neuf.**

**(B) `personnage.stats` présent** (donc toujours 8 clés) :

- Légende de bloc, `legendeStyle` existant (`--font-mono`, `--fs-meta`, `--text-faint`), texte exact : **« Caractéristiques — jamais lues par le narrateur. »** *(une seule fois, à l'échelle du bloc, jamais répétée par champ)*
- Grille : `display: grid` · `gridTemplateColumns: '1fr 1fr'` · `gap: var(--space-8)`. Ordre DOM = `CHARACTERISTIC_VALUES`, aucun tri manuel → (FO, AG) / (DX, EN) / (IN, IG) / (SE, CA).
- Chaque cellule : `<Stepper label={`${CHARACTERISTICS[c].label.toUpperCase()} (${c})`} value={personnage.stats[c]} min={CARACTERISTIQUE_MIN} max={CHARACTERISTIC_MAX} />`. Libellés **dérivés du registre** (KR-117), jamais recopiés : `FORCE (FO)`, `AGILITÉ (AG)`, `DEXTÉRITÉ (DX)`, `ENDURANCE (EN)`, `INTELLIGENCE (IN)`, `INGÉNIOSITÉ (IG)`, `SENS (SE)`, `CARACTÈRE (CA)`.
- Ligne PV : `marginTop: var(--space-2)` · `paddingTop: var(--space-5)` · `borderTop: 1px solid var(--border-divider)`. Eyebrow **« PV »** (`eyebrowStyle` existant). Valeur : `--font-mono`, `--fs-title`, `--fw-semibold`, **toujours `--text-strong`** (jamais `--text-disabled`, jamais `--good`/`--bad`). Légende : **« Dérivé de Force + Agilité + Endurance — jamais stocké. »**

| État | Rendu |
|---|---|
| Vide (`stats` absent) | CTA seule, remplace intégralement grille + ligne PV |
| Renseigné | légende + grille 2×4 (valeurs réelles 1..12) + ligne PV (nombre réel) |
| Survol/actif CTA | identique à `+ Ajouter un personnage…`, aucun token neuf |
| Survol/actif Stepper | hérité d'`IconButton`, inchangé |
| Erreur | **aucune** — le `clamp` interdit toute valeur hors 1..12, aucune saisie libre |
| Chargement | sans objet — écriture synchrone via `commit()` |

**Clavier** — vide : 1 arrêt (le CTA), Entrée/Espace natifs ; après le clic, le CTA quitte le DOM et le focus se pose sur « Diminuer FORCE (FO) », premier contrôle du bloc qui vient d'apparaître. Rempli : 16 arrêts en ordre DOM. Ligne PV non focusable. Pas de modale, pas d'Échap à câbler.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Personnage.stats` | type | provides | `stats?: Record<Characteristic, number>` — **optionnel en bloc, TOTAL quand présent** |
| `CARACTERISTIQUE_MIN` | constante | provides | `export const CARACTERISTIQUE_MIN = 1` dans `dossier/types.ts`, voisine de `CONFIANCE_MIN` |
| `STATS_INITIALES` | constante | provides | `Record<Characteristic, number>` dérivé de `CHARACTERISTIC_VALUES × CARACTERISTIQUE_MIN` — **valeur SEMÉE à l'écriture, jamais un repli de LECTURE** |
| `VALEURS_DE_CARACTERISTIQUE` | registre | provides | `readonly number[]`, `Array.from` — calqué sur `CONFIANCES` |
| `ENUMERES_FERMES` | registre | provides | +8 lignes dérivées, `requis: true` |
| `DESTINATION_DES_CHAMPS` | registre | provides | +8 lignes `monde.personnages[].stats.{FO..CA}` → `moteur` |
| `DossierService.update` | service | consumes | inchangé |
| `dossier:updated` | événement | emits | inchangé |
| `maxPV` | fonction de règle | consumes | `maxPV(s: Pick<HeroStats,'FO'\|'AG'\|'EN'>)` — **UN OBJET**, jamais trois arguments |

**Déjà exportés par `brain/index.ts`, rien à y ajouter pour eux** : `CHARACTERISTICS`, `CHARACTERISTIC_VALUES`, `CHARACTERISTIC_MAX`, `maxPV`, `type Characteristic`, `Stepper`.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **`stats.*` : ABSENT du contexte, pour tous les rôles.** Aucun nombre, aucun PV dérivé, **aucune paraphrase** (« FO élevée ») ne franchit la frontière tant que la n° 10 n'a pas livré un libellé dérivé **par le code** et sa ligne d'audience. |
| Schéma de sortie | sans objet — aucun appel modèle n'existe au Temps 1. |
| Ce que l'IA **ne** fait **pas** | La liste blanche de mutations d'état du `schema: 1` est `DELTAS` et vaut **quatre** opérations (`donner_objet`, `retirer_objet`, `reveler_indice`, `atteindre_jalon`) : **aucune ne touche une carac, un PV ou l'XP**. Les 8 clés sont de la donnée **de temps d'écriture, en lecture seule au runtime**. |
| Échec de validation | À l'**import** : hors `[CARACTERISTIQUE_MIN, CHARACTERISTIC_MAX]`, non entier, ou bloc à 1-7 clés → **anomalie bloquante** (`ENUMERES_FERMES`). À l'**écran** : inatteignable, le `clamp` borne à la saisie. |

**Pourquoi `moteur` et pas `ia`** — le chiffre est un **seuil** (§ 2 : réussite = dés ≤ carac). Un modèle qui lit `FO: 9` connaît la marge avant que `challenge.ts` n'ait résolu ; il narrera « tu forces la porte sans effort » pendant que le moteur tire un échec. Ce qui remplace le chiffre côté prose existe déjà et est écrit par l'auteur : `apparence` et `fonction` (it2), dont le JSDoc dit déjà « Elle DÉCRIT, elle ne chiffre pas ».

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute **seul, en premier**.

### Lot 1 — `contrat-caracteristiques` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser la tranche de schéma `stats` — type, bornes, audiences, fixtures, tests de contrat.
- **Fichiers** :
  - `docs/REGLES-DU-JEU.md` (R) — **écrit EN PREMIER dans le lot**, avant toute ligne de code
  - `src/brain/dossier/types.ts` (R) — `stats?`, `CARACTERISTIQUE_MIN`, `STATS_INITIALES`
  - `src/brain/dossier/tables.ts` (R) — `VALEURS_DE_CARACTERISTIQUE` + 8 lignes `ENUMERES_FERMES` dérivées
  - `src/brain/dossier/destinations.ts` (R) — 8 lignes `moteur` dérivées
  - `src/brain/dossier/__fixtures__/dossier-minimal.json` (R) — bloc complet (8 clés)
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — bloc complet sur ≥ 1 des 6 personnages
  - `src/brain/dossier/couverture.test.ts` (R)
  - `src/brain/dossier/validate.test.ts` (R)
  - `src/brain/index.ts` (R) — `+ CARACTERISTIQUE_MIN`, `+ STATS_INITIALES`
- **Expose** :
  ```ts
  export const CARACTERISTIQUE_MIN = 1
  export const STATS_INITIALES: Record<Characteristic, number>  // dérivé, jamais 8 littéraux
  export interface Personnage extends Entite {
    stats?: Record<Characteristic, number>   // absent = calme ; présent ⇒ LES 8 CLÉS
  }
  export const VALEURS_DE_CARACTERISTIQUE: readonly number[]
  ```
- **Critères couverts** : #6, #7
- **NON touchés, mesuré et non recopié de KR-190** : `validate.ts` (0 ligne — les 8 bornes entrent par la boucle générique), `characteristics.ts` (**interdit** — cliquet de mutation), `suffisance.test.ts`, `sections.ts`, `amorce.ts`, `read.ts`, `roundtrip.test.ts`, `LIBRES`, `SANS_DESTINATION`, `rules.golden.test.ts`, `Stepper.tsx`.

**Texte exact à insérer dans `docs/REGLES-DU-JEU.md` § 1**, après le tableau des 8 caractéristiques, avant `### Création & état de santé` :

> **Échelle.** Une caractéristique vaut un **entier de 1 à 12**. `12` est le plafond dur (rappelé au § 5) ; `1` est le plancher, et c'est une valeur que le système utilise réellement (§ 4 : Rat géant `FO 1`, Zombie `AG 1`). La **génération du héros** (`2D4` par caractéristique, puis `1D4` réparti, plafond **10** à la création) est une **procédure de départ**, pas la borne de l'échelle : elle ne produit ni valeur sous 2 ni valeur au-dessus de 10, mais rien n'interdit à une caractéristique de sortir de cet intervalle ensuite (progression, § 5), ni à un personnage écrit dans un dossier d'aventure d'y être posé hors de lui.

### Lot 2 — `bloc-caracteristiques` `feature`

- **Ouvrier** : `dev-lot` (démarre **contrat figé**, qu'il lit comme donnée immuable)
- **But** : le bloc 3 de l'accordéon, ses deux états, son écriture.
- **Fichiers** :
  - `src/features/dossier-fiches/components/FichePersonnage.tsx` (R)
  - `src/features/dossier-fiches/components/PanneauPersonnages.tsx` (R)
  - `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` (R)
  - `src/features/dossier-fiches/tests/fichePersonnage.test.tsx` (**N**)
  - `src/features/dossier-fiches/tests/pvDerive.test.ts` (**N**)
- **Consomme / expose** :
  ```tsx
  // FichePersonnageProps — DEUX props ajoutées, les 5 autres inchangées
  onReglerCaracteristiques: () => void
  onChangeCaracteristique: (carac: Characteristic, valeur: number) => void

  // PV — EN LIGNE (KR-013/113), une seule condition, aucun ?? 0 possible
  const pv = personnage.stats === undefined ? null : maxPV(personnage.stats)

  // PanneauPersonnages — régime camp/portée : widget fermé, AUCUN brouillon
  function handleReglerCaracteristiques(id: string): void {
    commit(personnages.map((p) => (p.id === id ? { ...p, stats: STATS_INITIALES } : p)), id)
  }
  function handleChangeCaracteristique(id: string, carac: Characteristic, valeur: number): void {
    commit(personnages.map((p): Personnage =>
      p.id !== id || p.stats === undefined ? p : { ...p, stats: { ...p.stats, [carac]: valeur } }), id)
  }
  ```
- **Critères couverts** : #1, #2, #3, #4, #5
- **Contraintes dures** : `BrouillonPersonnage` / `ChampTexte` / `commit()` / `RefusEnCours` **inchangés** ; `maxPV` appelé avec **un objet** ; **jamais** `?? STATS_INITIALES` sur un chemin de LECTURE.

## 6 — Critères d'acceptation

1. **Étant donné** un personnage sans bloc `stats`, **quand** sa fiche se rend, **alors** le bloc « Caractéristiques » n'affiche que « + Régler les caractéristiques… » — aucun Stepper, aucune ligne PV — et **aucune écriture n'est émise au montage**. — *composant* — *lot 2*
2. **Étant donné** ce même personnage, **quand** l'auteur clique « + Régler les caractéristiques… », **alors** un **seul** `update()` écrit les **8** clés à `CARACTERISTIQUE_MIN`, la grille remplace le CTA, et le PV affiche `3`. — *composant* — *lot 2*
3. **Étant donné** le bloc renseigné avec Force à 1, **quand** l'auteur clique 8 fois « Diminuer FORCE » puis 20 fois « Augmenter FORCE », **alors** la valeur ne descend jamais sous `CARACTERISTIQUE_MIN` ni ne dépasse `CHARACTERISTIC_MAX`, et rien hors `[1,12]` n'est jamais écrit. — *composant* — *lot 2*
4. **Étant donné** un personnage FO=7 / AG=9 / EN=6, **quand** la fiche se rend, **alors** le PV affiché vaut exactement `22`, aucune clé `pv` n'est écrite, **et** aucun fichier de `src/features/**` ne porte la somme écrite à la main — `FichePersonnage.tsx` **importe** `maxPV`. — *composant + structurel (test-grep)* — *lot 2*
5. **Étant donné** un dossier importé portant **deux** personnages aux 8 caractéristiques distinctes et **non-plancher** (A → PV 22, B → PV 17), **quand** la fiche se monte sur A **sans aucune interaction** puis qu'on clique la ligne de B, **alors** les 8 Stepper et le PV affichent les valeurs de B, jamais un résidu de A. **`FO=1` et `PV=3` ne sont jamais seedés** — indiscernables d'un défaut de widget (BUG-064). — *composant* — *lot 2*
6. **Étant donné** les 8 clés instanciées dans **les deux** fixtures, **quand** `couverture.test.ts` s'exécute, **alors** les 8 chemins `monde.personnages[].stats.{FO..CA}` sont chacun déclarés `moteur`, et retirer une ligne fait rougir le test **par nom de champ**. — *unitaire* — *lot 1*
7. **Étant donné** un dossier importé, **quand** `validateDossier` s'exécute, **alors** `0` / `13` / `2.5` / `"3"` sont refusés, un bloc `stats` à 1-7 clés est refusé, un bloc absent est **calme**, et le dossier de référence ne produit ni erreur ni avertissement neuf. — *unitaire* — *lot 1*
8. **Étant donné** le diff final, **quand** on lance `git diff --stat -- src/brain/characteristics.ts`, **alors** le fichier n'y apparaît pas : `npm run test:mutation` **n'est pas requis** et `thresholds.break` reste à **80**. — *process de revue* — *les deux lots*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `fichePersonnage.test.tsx — "bloc stats absent : seule la CTA, aucune ecriture au montage"` | 1 bouton, 0 Stepper, 0 PV, `update` jamais appelé | composant | KR-013/113 | 2 |
| `fichePersonnage.test.tsx — "le clic sur regler ecrit les 8 cles en un seul commit"` | 1 seul `update`, 8 clés = 1, PV `3` | composant | KR-191 | 2 |
| `panneauPersonnages.test.tsx — "Force se clampe aux deux bornes 1 et 12"` | affiché et écrit ∈ [1,12] | composant | KR-165 | 2 |
| `fichePersonnage.test.tsx — "PV derive exactement de FO+AG+EN, jamais stocke"` | PV = `22`, aucune clé `pv` | composant | KR-192, KR-130 | 2 |
| `pvDerive.test.ts — "la somme FO+AG+EN n est ecrite qu une fois, dans brain"` | 0 porteur du motif `/\bstats\??\.(FO\|AG\|EN)\b[^\n]*\+/` sous `src/features/**` et `src/player/**` ; 0 `?? STATS_INITIALES` en lecture ; **discriminant** : `FichePersonnage.tsx` importe `maxPV` | structurel (test-grep, précédent `couverture.test.ts:409`) | KR-192 | 2 |
| `panneauPersonnages.test.tsx — "lecture au montage sur DEUX personnages, sans interaction"` | 8 Stepper + PV = valeurs de B ; `FO≠1`, `PV≠3` | composant | BUG-064 | 2 |
| `couverture.test.ts — "les 8 caracs sont moteur et instanciees dans les DEUX fixtures"` | dérivé de `CHARACTERISTIC_VALUES`, jamais 8 littéraux ; échoue par **nom** | unitaire | KR-190, KR-174 | 1 |
| `validate.test.ts — bornes 0 / 1 / 12 / 13, bloc partiel refuse, bloc absent calme` | anomalie bloquante hors bornes et sur 1-7 clés ; silence si absent | unitaire | KR-165, KR-191 | 1 |
| `validate.test.ts — "le dossier de reference ne produit ni erreur ni avertissement"` (existant) | message d'échec **nommant** l'avertissement, jamais un compte | unitaire | KR-190 | 1 |
| `git diff --stat -- src/brain/characteristics.ts` | fichier absent du diff | process | cliquet de mutation | revue |

Cas limites couverts : vide (bloc absent) · limite et limite+1 (`0`/`1`/`12`/`13`) · **bloc partiel** (1-7 clés) · corruption de type (`"3"`, `2.5`) · deux entités (BUG-064) · référence orpheline (inchangée, non rouverte).

**Non vérifiable en l'état** — à recopier tel quel dans la revue, jamais coché :

- **Que `stats` n'atteint aucun contexte de modèle.** `destinations.ts` le **déclare** ; rien ne le **démontre** avant l'assembleur n° 10. C'est une limite, pas une garantie.
- **`wc -l PanneauPersonnages.tsx` réel** — le « ~460 » du tech-lead est une projection sur du code pas encore écrit. À **mesurer** en QA mode B, pas à accepter sur parole. Départ : 443 l. (déjà au-dessus du signal KR-112 à 400).
- **Le comportement réel du walker sur un bloc partiel** — affirmé par lecture de code ; vrai seulement une fois les cas `validate.test.ts` écrits et passants.
- **Le déclencheur d'extraction daté « it4 »** (KR-112) — aucune date de note de raffinage n'est vérifiable par un instrument avant qu'it4 arrive.
- **La lisibilité du message d'anomalie à 12 valeurs** (« attendu : 1, 2, … ou 12 ») — aucun test de message n'existe dans ce dépôt. Hors instrument, donc hors critère, mais noté plutôt que silencieusement accepté.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead (t2) vs PM·UX·QA·narratif (t2) | **D1 — `Partial` contre `Record` TOTAL quand présent** | `RETENU : TOTAL` | Deux arguments décisifs, tous deux hors du domaine où le tech-lead argumentait. **(a) narratif-ia, frontière code/IA** : un bloc partiel crée un état où le moteur ne peut pas résoudre un jet — « refuser / prendre un défaut / laisser le modèle improviser », et il faudrait une garde à **chaque** site moteur ; le TOTAL rend l'état binaire et vérifiable en **un** point. **(b) asymétrie du regret** : sur un `schema: 1` sans migration, desserrer TOTAL → Partial est gratuit, resserrer Partial → TOTAL est impossible. La ligne rouge du tech-lead (« fabriquer 7 valeurs `moteur` que l'auteur n'a pas posées ») est tenue par le désaccord n° 2, pas par le Partial. **Lot 1.** |
| 2 | PM + UX (t2) | Le premier clic sur un stepper ne doit pas écrire 7 valeurs en silence | `RETENU` | État vide **de bloc** (« + Régler les caractéristiques… ») : le passage de « non réglé » à « réglé » est un **geste explicite**, pas un effet de bord. Idiome `+ Ajouter…` déjà en production. **Lot 2.** |
| 3 | UX (t1, retirée par elle-même en t2) | Étendre `Stepper` à `value: number \| undefined` | `REJETÉ` | Sous le schéma total, `Stepper` n'est jamais monté quand `stats` est absent : il ne reçoit jamais `undefined`. Zéro extension, zéro risque sur `ObjectEditor.tsx`, `Stepper.tsx` **hors lot**. |
| 4 | narratif-ia (t1) vs tech-lead (t1) | `requis: false` contre `requis: true` dans `ENUMERES_FERMES` | `RETENU : requis: true` | narratif-ia retire son `requis: false` : mauvais précédent recopié (`confiance_min`, feuille scalaire optionnelle). Le bon est `savoirs[].revele_si.jet.carac`, **déjà `requis: true`** sous deux porteurs optionnels. **Lot 1.** |
| 5 | narratif-ia (t1, durcie t2) | Le plancher `1` n'existe dans aucune section de `docs/REGLES-DU-JEU.md` | `RETENU` | KR-130, sens d'écriture **doc → code**. La phrase entre dans le **lot contrat**, écrite **en premier** — et pas seulement par principe : `docs/WORKFLOW.md` fait sauter les deux revues sur un changement `.md` seul, donc livrée à part, la ligne qui devient la source d'une borne de schéma serait la seule que **personne ne relit**. |
| 6 | PM (t1) | Nommer `CHARACTERISTIC_MIN` dans `characteristics.ts` | `REJETÉ` | Fichier sous score de mutation : y toucher déclenche le run **et** le cliquet `break` 80 → 85, qu'une mesure à 81,40 % ne paie pas. La constante va dans `dossier/types.ts`, près de `CONFIANCE_MIN`. **Limite écrite** : l'échelle vit alors à deux endroits (MAX dans `characteristics.ts`, MIN dans `dossier/types.ts`) — déclencheur daté, le MIN y monte au prochain travail qui touche ce fichier (n° 9). |
| 7 | tech-lead (t2) | **Veto** contre une ligne de destination **porteuse / joker** `monde.personnages[].stats` | `RETENU (veto recevable, dans son domaine)` | `feuillesDeLaFixture` ne rend jamais un objet non vide comme feuille : la ligne serait **morte le jour où elle est écrite**. Personne ne la propose — le veto est satisfait, il ne bloque rien. |
| 8 | PM (t1, retirée t2) | Ne pas ouvrir un mécanisme générique de « dispense Record » qui pré-résoudrait it6 | `RETENU` | `Object.fromEntries(REGISTRE.map(...))` **étalé au site**, une fois par itération. Pas de table `RECORDS_A_CLES_FIXES`, pas de joker, pas de point d'arrêt, `LIBRES`/`SANS_DESTINATION` inchangés. |
| 9 | narratif-ia (t2) | `?? STATS_INITIALES` en **lecture** est interdit ; en **écriture** il est la seule forme légitime | `RETENU` | Exporté depuis `brain/`, il est à un import du moteur du Temps 2, où un repli de lecture ferait résoudre un jet contre une fiche fabriquée. Docstring + assertion 2 du test-grep. **Lots 1 et 2.** |
| 10 | narratif-ia (t2) | **Jurisprudence it6** : `caractere.curseurs` suivra la même FORME, sans MÉCANISME partagé | `RETENU` | Écrit maintenant pour qu'it6 ne rejoue pas le débat. Motif **différent** de `stats` (un curseur manquant ne rend aucun jet irrésoluble ; ce qu'il casse est en aval — une branche par clé chez l'assembleur n° 10, là où on invente un trait côté prompt). → `resolved_decisions`. |
| 11 | narratif-ia (t1/t2) | `maxPV` prend **un objet**, la spec écrit `maxPV(FO,AG,EN)` | `RETENU` | Le critère d'acceptation de `specification.json` (l. 24) se réécrit `maxPV({FO,AG,EN})` à l'étape 4, sinon le dev-contrat écrit un appel qui ne compile pas. |
| 12 | narratif-ia (t1/t2) | `docs/PLAN-BASCULE-IA.dc.html` l. 201 porte `"pv"` et `"tier"` dans `stats` | `RETENU (avertissement au plan)` | **Référence de design périmée sur ce point.** Un ouvrier qui l'ouvre y lit le contraire de KR-192. Écrit noir sur blanc ici ; le `.dc.html` n'est pas modifié (ce n'est pas du code de production). |
| 13 | QA (t1, maintenue t2) | `wc -l PanneauPersonnages.tsx` avant/après, **mesuré**, pas projeté | `RETENU` | Pas un critère (non observable par un test) : ligne de la **définition de fini**, relevée en QA mode B. |
| 14 | QA (t2) | Un `Stepper.test.tsx` neuf pour la branche `undefined` | `REJETÉ` | Tombe avec le désaccord n° 3 : la branche n'existe plus. `ObjectEditor.test.tsx` reste la non-régression du composant, inchangé. |
| 15 | narratif-ia (t2) | Élargir l'`open_questions` existante (libellés par palier) aux 8 caracs | `RETENU` | Une entrée **éditée**, jamais une neuve — discipline de budget de contexte. Texte exact fourni dans `tour2-narratif-ia.md` § 7. |
| 16 | tech-lead (t2) | **Suffisance** : rien n'exige qu'un personnage qui se bat ait ses 3 caracs de PV | `REPORTÉ → n° 9` | Question de suffisance, pas de typage. Propriété du `moteur-dossier` (état du héros en session). → `open_questions`. |
| 17 | tech-lead (t1) | Aucune extraction `hooks/useEcriturePersonnages.ts` cette itération | `RETENU` | Un seul appelant aujourd'hui = la dette habituelle du dépôt (précédent `BlocIdentite.tsx`, it2). Déclencheur **daté** : it4, quand `plan_actions[]` apporte une seconde famille de handlers. |

## 9 — Innovation

*Aucune.* Le budget d'une proposition hors-cadre n'a pas été consommé : tout ce qui est retenu s'appuie sur un précédent déjà écrit dans le dépôt (`+ Ajouter…`, `jet.carac` `requis: true`, `CONFIANCE_MIN`, le test-grep de `couverture.test.ts:409`).

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` **non requis** — `src/brain/characteristics.ts` absent du diff (critère #8). Si le diff le contredit, le run devient obligatoire **et** `break` monte de +5.
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] `wc -l src/features/dossier-fiches/components/PanneauPersonnages.tsx` **mesuré** avant/après et consigné (départ : 443 l.)
- [ ] Aucune régression sur les tests existants de la feature ; les 9 sections que cette feature ne possède pas rendent toujours l'état vide de `PanneauSection` (KR-187)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-fiches-it3.revue.md`, incluant **verbatim** la section « non vérifiable en l'état » du § 7

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **levée** | les 2 propositions du tour 1 satisfaites (D6, D8) |
| Tech Lead | recevable sous réserve | veto n° 7 satisfait (personne ne propose la ligne porteuse) ; **minoritaire sur D1**, sans veto |
| UX | recevable sous réserve → **levée** | état vide déplacé au bloc ; `Stepper` intact |
| QA | recevable sous réserve → **levée** | critère d'audience réécrit en assertion ferme (« 8 clés dans les deux fixtures ») |
| Narratif & IA | recevable sous réserve → **levée** | (a) 8 lignes `moteur`, (b) doc corrigée d'abord, (c) PV sans `?? 0` — les trois au plan |
