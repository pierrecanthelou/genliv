# Plan d'itération — `dossier-registres` · itération `5`

> Statut : `validé` (2026-08-19)
> Produit par : pm-produit · tech-lead · ux-designer · qa · **narratif-ia** — le 2026-08-19
> Composition : **`5 rôles`** — motif, différent des it1–it4 (4 rôles) : la question centrale de cette itération est une question de **destination / audience sur la frontière moteur** — `climat[].effets_regles` est déclaré `moteur` alors que `destinations.ts:513-518` affirme qu'aucun effet admis n'a de sens ambiant, et le champ neuf n'a pas d'audience décidée. Terrain de `narratif-ia`, pas seulement schéma + écran. La convocation a payé : c'est lui qui a fourni le motif réel du refus d'`EditeurEffets` (§8-1) et la seule proposition `INNOVATION` (§9).
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut tenir le registre des climats de son aventure — leur nom, leur durée, la phrase que le narrateur lira tant qu'ils durent. » |
| **Tranche** | `PanneauConditions`/`FicheClimat` (écran, 10ᵉ et dernier panneau) → `DossierService.update()` → `validateDossier` (`brain/dossier`) → persistance existante |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | `EditeurEffets` sur Climat (REJETÉ, §8-1) · retrait d'un climat persisté · `DeltaModificateur` / opérande entier (KR-208/209) · `conditions.contraintes` (KR-207) · `lieux[].acces` (KR-205) · graphe visuel (KR-204) · l'allumage/extinction de `climat_actif` (état de session, n° 9/n° 14) |
| **Reporté** | Les 3 dettes de test héritées d'it3/it4 (§8-6), avec propriétaire nommé. **Une proposition `INNOVATION`** : `Climat.manifestation` (§9). |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut tenir le registre des climats de son aventure — un **nom** interne, une **durée** en pas d'horloge (entier, consommée par la n° 14 `moteur-horloge`), et une **manifestation** : la phrase que le narrateur lira tant que ce climat est actif. La section « Conditions » cesse d'être le dernier état vide de l'éditeur, refermant la dernière racine du dossier. `effets_regles` reste un `Delta[]` **inchangé et non éditable depuis l'écran** — décision motivée en §8-1, pas une omission.

## 2 — Hors périmètre

- **`EditeurEffets` sur la fiche Climat** : REJETÉ (§8-1). Ni composant, ni carte vide, ni texte — **absence totale du DOM**. `effets_regles` reste écrit dans le document (`[]` à la création, obligatoire) et traverse toute édition sans être touché.
- **Tout `Delta` à opérande entier / `DeltaModificateur`** : KR-208/209 — ouvrir une opération numérique exige `docs/REGLES-DU-JEU.md` → table dorée → code (KR-130), propriété n° 11 / n° 13. Cette itération referme la *racine* `conditions` ; elle ne referme **pas** le § 09 du plan de cible (« des effets chiffrés sur les règles »), qui reste non tenu à la fin du Temps 1 — à écrire tel quel dans la revue.
- **Retrait (suppression) d'un climat persisté** : hors périmètre, même statut qu'it1 (indices), it2 (jalons/fins), it3 (quêtes), it4 (événements). Aucune itération de la feature ne le porte — `open_questions` niveau feature.
- **Réordonnancement des `effets_regles`** : sans objet, aucun effet n'est éditable.
- **L'allumage et l'extinction de `climat_actif`** : état de SESSION (KR-207), propriété n° 9 / n° 14. `duree` est la donnée d'auteur qui rendra l'extinction calculable ; rien dans cette itération ne la consomme.
- **`conditions.contraintes`** (faim/froid/poursuite) : KR-207, jamais un champ du dossier.
- **`lieux[].acces`** (KR-205) · **graphe visuel / repointage `tree-canvas`** (KR-204) : hors périmètre total de la feature.
- **Un compteur de mots dans l'UI** de MANIFESTATION : le dépassement surface par l'avertissement du validateur, pas par un widget.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Composants réutilisés tels quels : `Field`, `Card`, `ListRow`, `IconButton`, `Stepper`, `IssueList`. **Aucun composant neuf. Aucun token neuf.** `EditeurEffets` n'est ni importé ni rendu.

**Colonne liste** (`PanneauConditions.tsx`, anatomie `PanneauQuetes.tsx`) :

1. Eyebrow `EYEBROW_SECTION = 'CONDITIONS'` — **le titre de la section, pas le pluriel de la collection** (§8-4). Invariant mesuré sur les panneaux livrés : `EYEBROW_SECTION` égale partout le `titre` de `sections.ts` en capitales, y compris le contre-exemple `JALONS & FINS`, qui n'est le pluriel d'aucune collection.
2. Compteur, dérivé de la longueur de `monde.conditions.climat`.
3. `<ul>` de `ListRow` (`title={localiserEntite('climat', climat, index)}`, `subtitle={climat.id}`) + 2 `IconButton` **frères** dans le `<li>` possédé par le panneau : Monter `▲` / Descendre `▼`, `size={HIT_TARGET_MIN}`. Libellés : `` `Monter le climat « ${nom} »` `` — repli sans nom : `` `Monter le climat n°${index + 1} (sans nom)` `` ; symétrique pour Descendre.
4. Bouton bas : **`+ Ajouter un climat…`** (`boutonAjouterStyle`). **Commit immédiat** — aucun `CHAMPS_REQUIS` ne contraint un climat, donc jamais le brouillon différé d'it2. Littéral exact : `{ id: frapperIdentifiant('climat'), effets_regles: [] }` — `effets_regles` est **obligatoire** (`CHEMINS_DE_DELTAS` + boucle §7 de `validate.ts` → `champ-requis-vide` bloquant sans elle) ; `duree` et `manifestation` sont **absents**, jamais semés.
5. État vide, glyphe `❏` (`emptyGlyphStyle`, `aria-hidden="true"`) : **« Aucun climat — cliquez « + Ajouter un climat… » pour commencer. »**
6. Sélection par identifiant, jamais par index. Focus renvoyé sur NOM après un ajout, via une `ref` que **le panneau possède** — jamais un `querySelector` visant la fiche (Loi de Déméter, dette BUG-078).

**`FicheClimat.tsx`, dans l'ordre :**

1. `Field label="NOM DU CLIMAT" hint="interne" placeholder="Tempête de cendres"` — mono-ligne, `inputRef` cible du focus d'ajout. `Entrée` → `blur()` (commit) ; `onBlur` → commit.
2. **DURÉE** — bloc à deux états, motif de `BlocPlanActions.tsx:240-256` **réimplémenté, jamais importé** (`dossier-fiches` → `dossier-registres` serait un import inter-features : veto, et `npm run lint` le refuse déjà) :
   - `climat.duree === undefined` → `<button type="button" style={boutonAjouterStyle}>+ Poser une durée…</button>`, qui committe `DUREE_MIN` ;
   - sinon `<Stepper label="DURÉE" value={climat.duree} min={DUREE_MIN} onChange={…} />` — **`min` seul, jamais `max`** (`max` non passé ne veut pas dire « sans plafond » : c'est 99, borne d'interface, jamais du SSOT).
   - Légende sous les deux états (`legendeStyle`) : **« interne — nombre de pas d'horloge avant l'extinction du climat ; consommé par la feature n° 14 (moteur-horloge) »**.
   - **Aucun repli de lecture `?? DUREE_MIN`** : `duree === undefined` ne fabrique aucun nombre et n'écrit rien au montage (KR-013 ; précédent `BlocPlanActions.tsx:85-90` + `fichePersonnage.test.tsx:473-502`).
3. `Field label="MANIFESTATION" hint="IA — injecté au modèle tant que ce climat est actif" multiline rows={2}` (patron du hint : `ÉNONCÉ` sur `FicheJalon.tsx:112`), `placeholder="Des cendres tièdes tombent sans relâche, recouvrant toits et pavés d'un gris mat et silencieux."` — 15 mots, sous le budget de 20, pour montrer l'usage attendu. Même idiome brouillon-puis-commit-au-blur que NOM.
4. **Bandeau d'avertissement** (patron `FicheJalon.tsx:125-130` + `PanneauJalonsFins.tsx:206-216`) — `avertissements: DossierIssue[]`, prop reçue du panneau, calculée **en ligne** depuis `validateDossier(dossier).warnings.filter(i => i.path.startsWith(\`monde.conditions.climat[${index}].\`))`, **jamais un `useEffect`** (KR-189/013). Rendu si non vide : `<div role="status">` + eyebrow **« ENREGISTRÉ, AVEC AVERTISSEMENT »** + `IssueList`.
5. **Aucune section EFFETS DE RÈGLE** — absence totale du DOM. Le texte d'état vide proposé au tour 2 par `narratif-ia` a été **écarté par l'UX elle-même** (§8-1 bis) : une carte vide sans geste derrière elle est une promesse affichée sans bouton, l'idiome cassé, pire qu'une absence.
6. **Bandeau de refus**, dernière position, identique aux quatre fiches précédentes : `role="status"`, eyebrow **« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »**, `IssueList` si refus, sinon **« Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez. »**
7. **Aucun bouton de retrait de fiche** — hors périmètre.

**Tokens** (tous déjà nommés dans `dossier-registres/components/styles.ts`, **aucun neuf**) : `--space-2/3/6/8/10`, `--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--fs-h1`, `--text-label`, `--text-muted`, `--text-faint`, `--text-body`, `--track-eyebrow`, `--lh-body`, `--border-field`, `--r-md`, `--r-xl`, `--surface-inset`, `--accent`, `--accent-bg`, `--bad`, `--hit-target`.

**Clavier** : Tab suit l'ordre visuel — liste → Monter/Descendre → `+ Ajouter un climat…` → NOM → DURÉE (`+ Poser une durée…` **ou** le `Stepper`) → MANIFESTATION → bandeau d'avertissement (hors flux Tab) → bandeau de refus (hors flux Tab). `Entrée` dans NOM blur-committe ; dans MANIFESTATION (`multiline`) insère un saut de ligne. Focus revient sur NOM après un ajout.

*(Écrit par l'UX ; contrat prose de la DURÉE remplacé au tour 2 par le `Stepper` après l'arbitrage D2, eyebrow corrigé de `CLIMATS` en `CONDITIONS` par l'UX elle-même après mesure — §8-4.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Climat extends Entite` | type | fournit | `+= { duree?: number; manifestation?: string }` — les deux **optionnels** (additif, aucun dossier persisté invalidé, KR-191). `effets_regles: Delta[]` INCHANGÉ |
| `BUDGET_MOTS_MANIFESTATION` | constante | fournit | `export const BUDGET_MOTS_MANIFESTATION = 20` dans `types.ts`, à côté de `BUDGET_MOTS_JALON` (l.108) — constante **propre**, jamais `BUDGET_MOTS_JALON` réutilisé |
| `CHAMPS_ENTIERS` (`tables.ts`) | registre | fournit | `+= { path: 'monde.conditions.climat[].duree', location: 'Climat', min: DUREE_MIN }` |
| `BUDGETS_DE_MOTS` (`tables.ts`) | registre | fournit | `+= { path: 'monde.conditions.climat[].manifestation', location: 'Climat', budget: BUDGET_MOTS_MANIFESTATION, sujet: 'La manifestation de ce climat' }` — forme vérifiée : `BudgetDeMots extends ChampRequis { budget, sujet }` |
| `DESTINATION_DES_CHAMPS` (`destinations.ts`) | registre | fournit | `+= 'monde.conditions.climat[].duree': 'moteur'` et `'monde.conditions.climat[].manifestation': 'ia'` |
| `DUREE_MIN` | constante | consomme | déjà ré-exportée par `brain/index.ts` |
| `Stepper` | component | consomme | `({ label, value, onChange, min = 0, max = 99, prefix = '' })` — **`min={DUREE_MIN}` seul** |
| `validateDossier` | fonction | consomme | `.warnings` filtré par préfixe de `path`, lecture dérivée en ligne |
| `DossierService.update(id, recette): EcritureDossier` | service | consomme | inchangé — **trois racines nommées, jamais un spread de `dossier`** (patron `PanneauEvenements.tsx:162`) |
| `dossier:updated` | événement | émet | `{ dossierId: string }` |
| `frapperIdentifiant('climat')`, `localiserEntite('climat', …)` | fonction | consomme | espace déjà enregistré (`identifiers.ts:56` et `:133`) |
| `{Field, Card, ListRow, IconButton, IssueList, HIT_TARGET_MIN}` | component | consomme | inchangés |

**Zéro ligne neuve** dans `identifiers.ts`, `sections.ts`, `amorce.ts`, `deltas.ts`, `validate.ts`, `brain/index.ts` — vérifié par lecture directe au tour 2, pas supposé : l'espace `climat` et sa collection sont enregistrés depuis `dossier-format`, la section n° 9 est déjà comptée (`sections.ts:121-130`), `conditions: { climat: [] }` est déjà semé (`amorce.ts:116`), les boucles §6 bis (`CHAMPS_ENTIERS`) et §9 (`BUDGETS_DE_MOTS`) de `validate.ts` sont génériques, et **l'allow-list KR-215 de `deltas.test.ts` ne gagne aucun porteur** (`FicheClimat.tsx` ne nomme jamais `DELTAS`).

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Le lot `contrat` s'exécute seul, en premier.

### Lot 1 — `climats-contrat` — `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : donner sa forme à `Climat.duree` (entier borné) et `Climat.manifestation` (prose `ia` bornée en mots), sans toucher à `effets_regles`.
- **Fichiers** :
  - R `src/brain/dossier/types.ts`
  - R `src/brain/dossier/tables.ts`
  - R `src/brain/dossier/destinations.ts`
  - R `src/brain/dossier/__fixtures__/dossier-minimal.json`
  - R `src/brain/dossier/__fixtures__/dossier-reference.json`
  - R `src/brain/dossier/validate.test.ts`
  - R `src/brain/dossier/couverture.test.ts`
- **Expose/consomme** : voir §4.
- **Bornes pour `dev-contrat`, à ne pas redécouvrir en revue** :
  1. **`duree` est un ENTIER, jamais de la prose** (§8-2). Ligne de `CHAMPS_ENTIERS`, `min: DUREE_MIN`, destination `'moteur'`. **Zéro dispense** dans `LIBRES` — la boucle générique `POSEURS_D_ENTIER` de `validate.test.ts` refuse gratuitement borne basse / décimal / texte / booléen / `null` dès la ligne de table posée.
  2. **`location: 'Climat'`, jamais `'Conditions'`** pour les deux lignes — `'Conditions'` est le OÙ de la *liste* (`LISTES_REQUISES:370`), `'Climat'` celui d'un *champ d'un climat* (aligné sur `CHEMINS_DE_DELTAS`, `tables.ts:624`).
  3. **`manifestation` coûte EXACTEMENT UNE dispense** : `'monde.conditions.climat[].manifestation': PROSE_D_ENTITE_LIBRE` — **18ᵉ prose**, motif existant, aucun motif neuf. La ligne de `BUDGETS_DE_MOTS` **ne la remplace pas** : le budget n'AVERTIT que (`validate.ts:798-816`, `ok` reste vrai), donc une corruption chaîne → nombre traverse toujours. Contre-épreuve lue : `jalons[].enonce_texte` a un budget et **aucune** dispense parce qu'il est dans `CHAMPS_REQUIS` ; `manifestation` est optionnel.
  4. **Recompter, jamais recopier** (KR-159) : le bloc de commentaire de `couverture.test.ts:250` dit « DIX-SEPT aujourd'hui » — il passe à **dix-huit**, et le chiffre se remesure dans le fichier.
  5. **Les deux fixtures** portent `duree` et `manifestation` non vides ; la valeur de `manifestation` du dossier de référence est **≤ 20 mots** (`couverture.test.ts:462` impose « ni erreur ni avertissement » sur cette fixture).
  6. Le paragraphe « DEUX CHEMINS, ET DEUX SEULEMENT » de `tables.ts` (l.390-396) devient faux avec la 3ᵉ ligne de `CHAMPS_ENTIERS` — le retailler dans le même lot. *(Corollaire BUG-069 : une décision qui renverse une ligne écrite ailleurs annote la ligne renversée là où elle est LUE.)*
  7. **`roundtrip.test.ts` et `suffisance.test.ts` ne sont dans aucun lot, et c'est une borne, pas un oubli.** `roundtrip.test.ts:115` épingle déjà `climat[0].effets_regles → []` et son attendu est **dérivé du fichier de fixture**, donc les deux champs additifs le traversent sans édition. `suffisance.test.ts` (`CIBLE_CLIMAT_EXCLUE`) porte la décision §8-1. **Les deux sont à EXÉCUTER et constater verts, jamais à modifier** — s'ils rougissent, c'est un signal : arrêter et remonter au comité.
  8. **Ricochet `importDossier.test.tsx:114`** (`'5 anomalies'` en dur) : **aucun attendu** — les trois précédents venaient tous d'une référence vers l'espace `pnj` ; ni un entier ni une prose libre n'en produit. À exécuter et constater, pas à présumer. Si le compte bouge, c'est un signal, pas un chiffre à corriger.
- **Critères couverts** : #1, #2, #3, #4 (voir §6).

### Lot 2 — `climats-ecran`

- **Ouvrier** : `dev-lot`
- **But** : le 10ᵉ et dernier panneau — liste, fiche à trois champs, avertissement de budget rendu — câblé à `App.tsx`, remplaçant le dernier état vide de `PanneauSection.tsx`.
- **Fichiers** :
  - N `src/features/dossier-registres/components/PanneauConditions.tsx`
  - N `src/features/dossier-registres/components/FicheClimat.tsx`
  - N `src/features/dossier-registres/tests/panneauConditions.test.tsx`
  - R `src/features/dossier-registres/components/styles.ts`
  - R `src/features/dossier-registres/index.ts`
  - R `src/App.tsx` (une entrée `conditions: <PanneauConditions dossierId={route.dossierId} />`)
- **Expose/consomme** : consomme uniquement `type Climat`, `type Delta`, `type DossierIssue`, `type EcritureDossier`, `DUREE_MIN`, `validateDossier`, `localiserEntite`, `frapperIdentifiant('climat')`, `useOpenDossier`, `dossiers.update`, `{Field, Card, ListRow, IconButton, Stepper, IssueList, HIT_TARGET_MIN}`. Démarre une fois le lot 1 figé, le lit comme donnée immuable. Fournit `PanneauConditions({ dossierId }: { dossierId: string })`.
- **`EditeurEffets.tsx` n'apparaît dans AUCUN fichier de ce lot**, et `DELTAS` n'y est jamais nommé.
- **Trois contraintes dures** (ferment les trous nommés au raffinage) :
  1. **Aucune valeur fabriquée au montage** — `duree`/`manifestation` absents restent absents ; l'affordance « + Poser une durée… » est le seul chemin qui écrit `DUREE_MIN`, et seulement sur clic (KR-013).
  2. **L'avertissement de budget est RENDU** — un `warning` retourné par `validateDossier` et non affiché est un défaut (KR-183). Région `role="status"` **distincte** du bandeau de refus : les deux peuvent coexister, donc tout test utilise `getAllByRole('status')`, jamais `getByRole` nu (KR-189).
  3. **Encapsulation** — `PanneauConditions.tsx` ne cherche jamais un élément de `FicheClimat.tsx` par `querySelector` ni par libellé recopié (dette BUG-078) ; le focus après ajout passe par une `ref` que le panneau **possède** (précédent `PanneauEvenements.tsx:141`).
- **Vérifié à la lecture** : aucun fichier de `bascule-editeur`, `dossier-canon`, `dossier-fiches`, `dossier-objets` ou `tree-canvas` n'entre dans ce lot — KR-184/204/205 tenus par construction ; `DossierEditorScreen.tsx` reste intouché, la clé `conditions` s'injecte depuis `App.tsx` seul.
- **Critères couverts** : #5, #6, #7, #8 (voir §6).

*(2 lots, exécution séquentielle — le lot 2 dépend du contrat figé par le lot 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** le dossier de référence, **quand** le lot 1 est livré, **alors** `validateDossier` l'accepte sans régression, `climat[0].effets_regles` survit au round-trip comme **liste vide et non comme un absent**, et `CIBLE_CLIMAT_EXCLUE` reste le seul chemin de `CHEMINS_DE_DELTAS` sans delta admissible — *niveau : contrat* — *lot 1*
2. **Étant donné** la ligne `CHAMPS_ENTIERS` de `climat[].duree`, **quand** une valeur sous `DUREE_MIN`, décimale, textuelle, booléenne ou `null` est posée, **alors** le validateur la refuse, et son absence reste calme (aucune anomalie) — *niveau : contrat* — *lot 1*
3. **Étant donné** `climat[].manifestation` instancié dans les deux fixtures, **quand** la table des destinations est lue, **alors** son audience **vaut `ia`** — assertion de VALEUR et pas seulement d'existence, les deux dérivées de la même table dans le même test (KR-174, précédent BUG-051) — *niveau : contrat* — *lot 1*
4. **Étant donné** une `manifestation` de 20 mots puis de 21, **quand** `validateDossier` tourne, **alors** la première ne produit aucun avertissement et la seconde produit `texte-trop-long` dans `warnings` avec `errors` vide et `ok` toujours vrai (avertissant, jamais bloquant) — *niveau : contrat* — *lot 1*
5. **Étant donné** un climat sélectionné, **quand** `FicheClimat` se rend, **alors** aucun `EditeurEffets` n'y figure — l'affordance `+ Ajouter un effet…` est absente du DOM, de même que toute carte ou tout texte d'état vide la remplaçant (§8-1) — *niveau : composant* — *lot 2*
6. **Étant donné** un climat dont `effets_regles` est **non vide en mémoire**, **quand** l'auteur édite son NOM, sa DURÉE puis sa MANIFESTATION, **alors** `effets_regles` ressort **intact** du document persisté — un champ que l'écran ne montre pas n'est jamais réinitialisé par une écriture partielle — *niveau : composant* — *lot 2*
7. **Étant donné** la section Conditions vide, **quand** l'auteur clique « + Ajouter un climat… », **alors** un climat est créé immédiatement avec `effets_regles: []` **seul** (ni `duree` ni `manifestation` semés), le focus part sur NOM, et un climat sans `duree` rend l'affordance « + Poser une durée… » **sans qu'aucune écriture ne parte au montage** (KR-013/214) — *niveau : composant* — *lot 2*
8. **Étant donné** une `manifestation` dépassant le budget, **quand** la fiche se rend, **alors** l'avertissement est **visible** dans une région `role="status"` distincte du bandeau de refus (KR-183/189, assertion via `getAllByRole('status')`) — *niveau : composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `validate.test.ts` « les champs entiers ont tous leur poseur, aucun de plus » | `Object.keys(POSEURS_D_ENTIER)` == chemins de `CHAMPS_ENTIERS` | contrat | KR-117 | 1 |
| `validate.test.ts` « champ entier climat[].duree : sous DUREE_MIN, non entier ou non numerique, refuse » | `[min-1, -3, 2.5, "min", true, null]` → anomalie bloquante ; borne citée par sa constante | contrat | KR-165 | 1 |
| `validate.test.ts` « climat[].manifestation au-dela de 20 mots avertit sans bloquer » | 20 mots : `warnings=[]`, `ok=true` ; 21 mots : `codes(warnings)=['texte-trop-long']`, `errors=[]`, `ok=true` | contrat | — | 1 |
| `couverture.test.ts` sweep étendu | `climat[].duree` couvert, **aucune** entrée neuve dans `LIBRES` pour lui ; `manifestation` dispensée sous `PROSE_D_ENTITE_LIBRE`, compte remesuré 17 → 18 | contrat | KR-159/186 | 1 |
| `couverture.test.ts` « audience de climat[].manifestation : ia, instance existe » | `` `${chemin} → ${DESTINATION_DES_CHAMPS[chemin]}` `` == `` `${chemin} → ia` `` **dans le même test** que la présence en fixture | contrat | KR-174 | 1 |
| `roundtrip.test.ts` (**existant, non modifié — à exécuter**) | `climat[0].effets_regles` `toEqual([])` inchangé ; l'attendu étant dérivé du fichier, `duree`/`manifestation` traversent | contrat | KR-191, KR-208 | — |
| `suffisance.test.ts` (**existant, non modifié — à exécuter**) | `CIBLE_CLIMAT_EXCLUE` reste le seul chemin sans delta admissible | contrat | KR-208 | — |
| `dossier-format/tests/importDossier.test.tsx` (**existant, non modifié — à exécuter**) | compte d'anomalies inchangé (aucun ricochet `pnj` attendu) | contrat | KR-159 | — |
| `panneauConditions.test.tsx` « aucun EditeurEffets ne se rend sur FicheClimat » | `queryByText('+ Ajouter un effet…')` → `null`, climat sélectionné | composant | — | 2 |
| `panneauConditions.test.tsx` « editer les trois champs d un climat porteur d un effets_regles non vide le laisse intact » | fixture pose `effets_regles=[delta]` hors UI ; après les trois éditions, document persisté `toEqual([delta])` | composant | KR-013 | 2 |
| `panneauConditions.test.tsx` « + Ajouter un climat : commit immediat, effets_regles seul, focus sur NOM » | climat écrit `{id, effets_regles: []}` sans `duree` ni `manifestation` ; `document.activeElement` == champ NOM | composant | KR-214 | 2 |
| `panneauConditions.test.tsx` « DUREE : aucun repli implicite au montage » | climat sans `duree` → affordance pointillée rendue ; spy `DossierService.update` **non appelé** | composant | KR-013 | 2 |
| `panneauConditions.test.tsx` « manifestation trop longue : l avertissement est rendu, distinct du bandeau de refus » | `getAllByRole('status')` — la région d'avertissement porte le texte, le bandeau de refus reste absent | composant | KR-183/189 | 2 |
| `panneauConditions.test.tsx` « isolation des 9 autres sections » | non-régression ; compte **relevé dans `sections.ts`**, jamais recopié d'it3/it4 | composant | KR-187, KR-159 | 2 |
| `deltas.test.ts` (**existant, non modifié — à exécuter**) | l'allow-list nommée des porteurs de `DELTAS` reste à **deux** entrées (`brain/index.ts`, `EditeurEffets.tsx`) — rougit si `FicheClimat.tsx` nomme le registre | contrat | KR-215 | — |
| `npm run lint` + `lintIsolation.test.ts` (**existants**) | aucun import direct `dossier-registres` ↔ une autre feature (donc aucun fichier de `dossier-canon`/`tree-canvas` atteignable depuis ce lot, KR-204/205), aucune couleur en dur | contrat | KR-184/151/152, KR-204/205 | 1+2 |

Cas limites à couvrir : registre vide (0 climat) · un climat sans nom (repli de libellé sur les `IconButton`) · un climat sans `duree` ni `manifestation` (état calme, aucune alerte) · réordonnancement à 2 climats.

**Non vérifiable en l'état, à écrire tel quel dans la revue** : que `duree` soit réellement consommée par la n° 14 pour éteindre un climat — aucun code ne la lit aujourd'hui, l'itération pose la donnée et son audience, pas son consommateur. Le relevé « aucun fichier touché hors de la liste de son lot » est un contrôle de revue, **pas un test jest** — à noter comme tel.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | UX (tour 1) vs Tech Lead + `narratif-ia` + PM (tour 1) | `EditeurEffets` sur la fiche Climat : l'UX est POUR (KR-208 n'interdit qu'une opération entière NEUVE, pas l'usage des quatre existantes ; coût nul) | `REJETÉ` | **L'UX avait raison sur KR-208 — le tech-lead et `narratif-ia` l'ont tous deux concédé au tour 2 : l'argument d'origine du cadrage était faux.** Le refus tient sur deux autres motifs, trouvés au tour 2 : (a) **aucun instant d'application** — `Climat` ne porte ni `declencheur_texte` ni `declencheur_expr`, donc rien dans le dossier ne dit QUAND un delta s'appliquerait ; `climat_actif` est un état de session (KR-207) posé par la n° 9/n° 14 ; (b) **aucune idempotence** — rien n'enregistre « déjà appliqué », un climat qui revient ré-applique. Et le besoin exprimé est **déjà servi** par un Événement (`declencheur_expr` + `resolutions[].consequence`, livré it4), qui a un instant daté. Deux fichiers `brain/` épinglaient déjà l'exclusion : `suffisance.test.ts` (`CIBLE_CLIMAT_EXCLUE`, « le SEUL emplacement de `CHEMINS_DE_DELTAS` sans delta admissible ») et `destinations.ts:512-518` (clé déclarée **sans suffixe `[]`**, donc les éléments n'ont aucune audience). L'UX retire son objection au tour 2. |
| 1 bis | `narratif-ia` (tour 1) vs UX (tour 2) | Que rendre à la place ? `narratif-ia` proposait un état vide non éditable (« Aucun effet de règle. Les modificateurs chiffrés attendent une opération… ») | `REJETÉ` | **Arbitré par l'UX contre `narratif-ia`, sur son propre terrain** : la règle des états vides exige qu'un vide *invite l'action suivante* — les quatre autres cartes vides de la feature finissent toutes par un « + Ajouter… » cliquable. Une carte sans geste derrière elle est une promesse affichée sans bouton, l'idiome cassé, pire qu'une absence. Précédent de la feature : le silence D1 de `FicheEvenement` (it4), « le silence est celui du contrat, pas une omission ». **Rien ne se rend.** |
| 2 | PM (tour 1) vs Tech Lead + `narratif-ia` (tour 1) | Forme de la durée : prose renommée (`duree_texte`/`persistance`, PM) vs entier `duree?: number` en `CHAMPS_ENTIERS`, audience `moteur` | `RETENU` entier | Trois raisons convergentes. (a) La collision KR-198 que le PM craignait **disparaît** au lieu d'être contournée : `plan_actions[].duree` et `climat[].duree` deviennent le même mot pour la même chose — un compte de pas d'horloge. L'homonymie n'est un piège que quand les deux sens divergent (cas d'`objectif`/`enonce`), pas ici. (b) `narratif-ia` : une durée en prose laisse l'**extinction du climat sans propriétaire de code** — seul le narrateur pourrait la décider, ce qui est exactement la frontière que D1 trace. (c) QA, mesuré : l'entier est **borné gratuitement** par la boucle générique `POSEURS_D_ENTIER` (zéro dispense), alors que la prose n'a que `LIBRES`, dont la définition dit qu'« aucune règle du schéma 1 n'arbitre sa forme » — un critère bornant la prose serait irrecevable par construction. Le PM retire au tour 2. |
| 3 | `narratif-ia` (tour 1) vs PM (tour 1, « ne rien ajouter au périmètre ») | Champ NEUF `manifestation?: string`, audience `ia`, borné à 20 mots | `RETENU` — marqué **`INNOVATION`** (§9) | Le PM accepte au tour 2, **à une condition qu'il pose explicitement : rien d'autre n'entre** (retrait, `portee`, tree-canvas restent dehors ; un second champ `ia` aurait été un veto). Motif retenu : sans lui, `monde.conditions.climat[]` serait la **seule collection de registre du schéma à zéro champ `ia`**, et la n° 10 hériterait de la question « que lit le narrateur quand un climat est actif ? » avec trois portes déjà fermées — elle injecterait le libellé nu et le modèle improviserait le reste à chaque tour. Coût chiffré par lecture directe (§9), pas estimé. |
| 4 | Tech Lead (tour 1) vs UX (tour 1, cadrage) | Nom du panneau : `PanneauConditions.tsx` (nom de SECTION) vs `PanneauClimats.tsx` + eyebrow `CLIMATS` (pluriel de COLLECTION) | `RETENU` `PanneauConditions.tsx` + eyebrow `CONDITIONS` | **L'UX a mesuré et s'est corrigée elle-même, plus largement que le tech-lead ne le demandait** : `EYEBROW_SECTION` égale partout le `titre` de `sections.ts` en capitales, y compris le contre-exemple décisif `JALONS & FINS`, qui n'est le pluriel d'aucune collection. Le titre de la section 9 est « Conditions ». L'eyebrow `CLIMATS` du cadrage était donc faux sur les **deux** axes, pas un seul. Coût du choix : nul des deux côtés. |
| 5 | QA (tour 1, maintenue et resserrée tour 2) | Le critère d'acceptation n° 7 de la feature (« `effets_regles` … éditable via les opérations existantes ») n'est prouvable par aucun instrument | `RETENU` — réécrit en **deux** critères | `narratif-ia` et le tech-lead convergeaient sur une réécriture unique ; **la QA la corrige au tour 2 et c'est sa version qui est retenue** : la formulation proposée mélangeait un niveau contrat et un niveau composant dans un seul « alors », et invoquait « la liste de fichiers du lot » comme preuve — ce qui n'est pas un instrument rejouable après le merge (un refactor futur pourrait rajouter `EditeurEffets` sans que rien ne rougisse). Scindé en critère #1 (contrat : round-trip + `CIBLE_CLIMAT_EXCLUE`) et critère #5 (composant : absence RTL de `+ Ajouter un effet…`), plus le critère #6 (non-corruption), qui prouve une **troisième** chose que ni l'un ni l'autre ne couvre. |
| 6 | QA (tour 2) | Les trois dettes de test héritées d'it3/it4 — (a) `Select` EFFET à `onChange` no-op non couvert ; (b) retour de focus après retrait de ligne, non testé dans toute la feature ; (c) axe inter-fiche du jeton de remontage (KR-216) non couvert, symptôme jumeau non corrigé dans `FicheQuete.tsx:253` | `REPORTÉ` → `open_questions` de la feature | Aucune n'est fermable sans sortir des bornes de lot : le lot 2 ne touche ni `EditeurEffets.tsx`, ni `FicheQuete.tsx`, ni `brain/components/Select.tsx`, et n'introduit **aucune ligne retirable** (le climat n'est pas retirable, comme it1–it4). Propriétaires nommés : (a) la prochaine itération/lot qui touche `brain/components/Select.tsx` ; (b) et (c) ensemble — une éventuelle 6ᵉ itération de durcissement de `dossier-registres`, si le retrait (ouvert depuis it1) est un jour mandaté. **Pas de report vers `dossier-controles` (n° 7)**, qui ne touche aucun de ces fichiers. La feature se clôturant ici, elles doivent rester listées, pas disparaître dans le silence du `done`. |
| 7 | Tech Lead (tour 2) | Veto de procédure : « si le comité accepte `EditeurEffets` sur Climat, les fichiers `brain/` que cela entraîne (`suffisance.test.ts`, `roundtrip.test.ts`, clé de destination suffixée, deltas semés en fixture) entrent dans le **lot 1**, jamais dans le lot 2 » | `SANS OBJET` | Veto **dans son domaine** (découpage / contrat `brain/`), donc recevable — mais **conditionnel à une décision que le comité n'a pas prise** : `EditeurEffets` est rejeté (§8-1). La condition ne se déclenche pas, aucune `ESCALADE`. Consigné parce qu'il redeviendrait actif si quelqu'un rouvrait §8-1 plus tard. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto ne tient après le tour 2 — pas de bloc `ESCALADE`.)*

## 9 — Innovation

**`Climat.manifestation?: string`, audience `ia`, bornée à 20 mots** — proposée par `narratif-ia`, étiquetée `INNOVATION` par lui-même. Unique proposition hors-cadre de l'itération.

- **(a) La règle qu'elle infléchit** — le goal d'it5 tel qu'écrit au cadrage (« un libellé, une durée ») et la consigne du PM au tour 1 (« ne rien ajouter au périmètre »). C'est un **troisième** champ, absent aussi du § 09 du plan de cible.
- **(b) Ce qu'elle coûte** — mesuré par lecture directe, pas estimé : `types.ts` (1 champ + 1 constante `BUDGET_MOTS_MANIFESTATION = 20`), `tables.ts` (1 ligne `BUDGETS_DE_MOTS`), `destinations.ts` (1 ligne `'ia'`), `couverture.test.ts` (1 dispense sous le motif **existant** `PROSE_D_ENTITE_LIBRE`, 18ᵉ prose, + recompte 17 → 18), 2 fixtures, `validate.test.ts` (2 assertions), et côté écran 1 `Field` multi-ligne + la région d'avertissement (patron `FicheJalon.tsx:125-128`, ~15 lignes). **Zéro machinerie neuve** : `manifestation` est le jumeau exact de `monde.quetes[].consigne` (prose optionnelle, libre, `ia`), et n'ouvre aucune catégorie — cinq champs de cette forme existent déjà.
- **(c) Ce qu'on perd sans elle** — la feature livrerait la dernière racine du dossier refermée, mais `monde.conditions.climat[]` resterait la **seule collection de registre du schéma à zéro champ `ia`** : aucun contenu de climat ne serait injectable au Temps 2. La n° 10 hériterait de « que lit le narrateur quand un climat est actif ? » avec trois portes déjà fermées par cette itération (`nom` = `auteur`/KR-195, `duree` = `moteur`, `effets_regles` = `moteur`) — elle devrait soit retirer le climat du contexte de scène, contre `PLAN-BASCULE-IA.dc.html` l.411, soit rouvrir une ligne d'audience qu'on vient de figer.
- **Contrat d'injection déposé, opposable à la n° 10** : au plus **UN** climat par tour (celui que `horloge.climat_actif` désigne, jamais la collection) ; champ injecté : `manifestation` **seul** ; `id`/`nom`/`duree`/`effets_regles` **jamais injectés** ; `manifestation` absente ou vide → le bloc climat est **omis**, jamais remplacé par le `nom`, jamais paraphrasé — le repli est le silence ; dépassement du budget → avertissement non bloquant rendu à l'écran, jamais un refus.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **non applicable** (aucun de `challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts` n'est touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`panneauIndices.test.tsx` it1, `panneauJalonsFins.test.tsx` it2, `panneauQuetes.test.tsx` it3, `panneauEvenements.test.tsx` it4)
- [ ] Aucun fichier touché hors de la liste de son lot *(contrôle de revue, pas un test jest)*
- [ ] `roundtrip.test.ts`, `suffisance.test.ts` et `dossier-format/tests/importDossier.test.tsx` **exécutés et constatés verts sans être modifiés** (§5 lot 1, bornes 7 et 8) — un rouge est un signal, pas une cible
- [x] **Corollaire BUG-069 — FAIT À LA VALIDATION DU PLAN (2026-08-19), pas reporté au lot de doc.** Les décisions §8-1 et §8-2 renversent **trois** lignes écrites au cadrage, toutes annotées en place (« MISE A JOUR DU 2026-08-19 : … est CADUQUE ») dans `specification.json` : (a) `acceptance_criteria[6]` (« éditable via les opérations existantes ») ; (b) le motif de `design_contract.editeur_effets` (qui invoquait KR-208, **argument reconnu faux au tour 2**) — sa **conclusion** ne change pas, seul son motif ; (c) `brain_contracts` « Climat extended — duree?: string », caduque sur le type comme sur le champ manquant. Avancé au moment de la validation parce que la spec est écrite de toute façon à ce moment-là et qu'une contradiction laissée vivante pendant l'essaim serait lue par `dev-contrat`. **À vérifier en revue, pas à refaire.**
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-registres-it5.revue.md` — il doit porter nommément : que cette itération referme la *racine* `conditions` **sans** refermer le § 09 du plan de cible (effets chiffrés, KR-208, non tenu à la fin du Temps 1), et que la consommation réelle de `duree` par la n° 14 n'est vérifiée par personne.

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | oui — `duree` entier (collision KR-198 éteinte), `manifestation` acceptée contre l'engagement « rien d'autre n'entre » (§8-3) |
| Tech Lead | recevable | oui — `EditeurEffets` rejeté (§8-1), veto de procédure sans objet (§8-7), découpage figé à 2 lots disjoints |
| UX | recevable | oui — objection retirée au tour 2 après concession de domaine (§8-1) ; eyebrow auto-corrigé en `CONDITIONS` (§8-4) |
| QA | recevable sous réserve | oui — critère réécrit en deux niveaux, preuve par test nommé et jamais par la liste de fichiers (§8-5) ; 3 dettes reportées avec propriétaire (§8-6) |
| Narratif & IA | recevable sous réserve | oui — objection 2 desserrée du terrain de veto (§8-2) ; `manifestation` retenue avec son contrat d'injection (§9) |
