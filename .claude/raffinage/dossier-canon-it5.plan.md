# Plan d'itération — `dossier-canon` · itération `5` *(roadmap § 2 bis, tranche B1)*

> Statut : `validé` — par l'humain le 2026-09-19
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-19
> Composition : **5 rôles** — motif : l'itération ajoute un champ au dossier d'aventure, donc une ligne d'audience ; c'était la seule question que le cadrage laissait ouverte.
> Exécution : **séquentielle** (2 lots)
> ✅ Étape 7 faite (2026-09-19) : `src/features/dossier-canon/specification.json` rouvert — `status` `done` → `in-progress`, `n: 4 → 5`, itération 5 ajoutée (`planned`), 5 `resolved_decisions` et 4 `open_questions` reportées. **Compacté dans le même geste** (le report franchissait le plafond de 65 kio) : les `verdicts` des quatre itérations closes sont réduits à leur fait non évident + le renvoi à leur revue — 68 322 → **64 267 o**.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut **relier ses lieux les uns aux autres**. » |
| **Tranche** | fiche d'un lieu → section « ACCÈS DEPUIS CE LIEU » → `Select` de la cible → `PanneauLieux` committe par `DossierService.update` → `validateDossier` refuse une cible pendante ou vide → `monde.lieux[].acces[]` persisté, une entrée par sens |
| **Lots** | 2 lots · dont `contrat` : **oui** (lot 1, seul et en premier) |
| **Hors périmètre** | `acces[].description` · liste « ACCESSIBLE DEPUIS » · bouton « créer le passage réciproque » · rider `validate.ts` · levée de KR-224 · toute règle de contrôle neuve · `condition_expr` / `cache` · tout graphe |
| **Reporté** | `acces[].description` → `open_questions`, propriétaire **n° 10** · liste « ACCESSIBLE DEPUIS » → itération ultérieure, contrat UX conservé · rider `validate.ts` → ré-armé sur le fichier |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut relier ses lieux les uns aux autres.

## 2 — Hors périmètre

- `acces[].description` — la prose par arête. Demandée par `narratif-ia` (veto tour 1), **retirée par lui-même au tour 2 sur mesure**.
- La liste « ACCESSIBLE DEPUIS » en lecture seule — seconde démonstration, aucun verbe neuf pour l'auteur.
- Un bouton « créer le passage réciproque » — ce serait l'écriture de deux entrées, arbitrage UX à part entière.
- Le rider `validate.ts` (4 sites d'avertissement sans `entityId`, `designerSavoir`).
- La levée de KR-224 dans `atteignabilite.ts` — seconde démonstration.
- Toute règle de contrôle neuve ; `acces[].condition_expr` ; `acces[].cache` ; un delta `deplacer_vers` ; toute visualisation de graphe.

## 3 — Contrat de design

**Position** : section nouvelle dans `FicheLieu.tsx`, après « DANGERS », avant le pied de fiche. Aucune modale, aucun graphe.

**Composants** — tous existants : `Card`, `Field` (×4, inchangés), `Select` (un par ligne écrite + un pour l'ajout), `IconButton` (`tone="danger"`, `size={HIT_TARGET_MIN}`, glyphe `✕`).

**Textes exacts — à ne pas reformuler** :

```
EYEBROW_ACCES          = 'ACCÈS DEPUIS CE LIEU'
LEGENDE_ACCES          = 'Les lieux que l'on peut rejoindre depuis celui-ci — un passage dans l'autre sens ne se déduit pas : ajoutez-le depuis l'autre lieu.'
TEXTE_AUCUN_AUTRE_LIEU = 'Aucun autre lieu à relier — ajoutez-en un second avec « + Ajouter un lieu… ».'
TEXTE_AJOUTER_ACCES    = '+ Ajouter un accès vers un autre lieu…'
```

`Select` par ligne écrite : `label="LIEU CIBLE"`. `ariaLabel` du `Select` d'ajout : `"Ajouter un accès vers un autre lieu"`. Bouton de retrait : `` `Retirer l'accès vers ${designation}` ``, avec `designation = localiserEntite('lieu', cible, index)`.

**Tokens — les huit sont vérifiés existants**, aucune valeur en dur, aucun token neuf : `--font-mono`, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`, `--fs-meta`, `--text-faint`, `--space-2`, `--space-3`.

| État | Rendu |
|---|---|
| **vide** — < 2 lieux, aucun accès | `<p>` avec `TEXTE_AUCUN_AUTRE_LIEU`, pas de `Select` |
| **vide** — ≥ 2 lieux, liste d'accès vide *(cas normal au démarrage)* | légende + `Select` d'ajout seul, valeur `''`, option 0 = `TEXTE_AJOUTER_ACCES`. Jamais un vide nu |
| **défaut** — N accès écrits | N lignes (`Select` + `IconButton` ✕), puis le `Select` d'ajout, remis à `''` après chaque ajout |
| **erreur** — cible retirée ailleurs | `avecOrpheline(...)` → « Lieu introuvable — <id> », jamais filtrée en silence (KR-021) |
| auto-référence persistée | résout normalement dans les lignes écrites, **jamais** marquée orpheline |
| auto-référence à l'ajout | **exclue** des options du `Select` d'ajout **seul** |
| **erreur** — refus d'écriture | bandeau `EYEBROW_REFUS` / `TEXTE_ABSENT` existant, inchangé |

**Clavier** *(ergonomie de rédaction)* : chaque `Select` est un `<select>` natif — flèches, Entrée/Espace, Échap, rien à écrire. Tab : DANGERS → lignes d'accès (`Select` puis ✕, ordre du tableau) → `Select` d'ajout → « Retirer le lieu ». Ordre visuel = ordre DOM, aucun `tabIndex` manuel.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `Lieu.acces` | registre (schéma) | émet | `acces?: string[]` sur `interface Lieu`, après `dangers` |
| `LISTES_OPTIONNELLES_TEXTUELLES` | registre | émet | `{ path: 'monde.lieux[].acces', location: 'Lieux' }` — jumelle de `monde.indices[].mene_a` (`tables.ts:494`) |
| `REFERENCES_SIMPLES` | registre | émet | `{ path: 'monde.lieux[].acces[]', espace: 'lieu', location: 'Lieux' }` — jumelle de `monde.indices[].mene_a[]` (`tables.ts:607`). **Docstring l. 547 « NEUF » → « DIX », remesurée (KR-159)** |
| `DESTINATIONS` | registre | émet | `'monde.lieux[].acces[]': 'moteur'`, après `'monde.lieux[].dangers'` |
| `DossierService.update` | service | consomme | inchangé — le lot 2 passe par le `commit(lieux, lieuId)` existant |

**Commentaire obligatoire au-dessus de la ligne de destination**, texte arrêté par `narratif-ia` (tour 2, annexe A), **non reformulable** : la topologie est `moteur` parce qu'un identifiant est un **handle** — le code résout, le modèle reçoit le contenu du lieu sous l'audience de ce lieu-là, jamais la clé ; injectée telle quelle, la liste des cibles donnerait au narrateur **la carte**. C'est aussi la seule **autorité** sur le déplacement : le moteur refuse toute destination absente de cette liste, **même si la prose l'a racontée** — la règle vit en donnée, jamais en consigne de prompt. L'**étiquette** d'une sortie pour la n° 10 n'est **pas** tranchée ici (voir § 8, désaccord 3).

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-acces-lieu` `contrat`

- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `acces` au schéma, à ses deux tables, à sa ligne d'audience et à la fixture.
- **Fichiers** : `src/brain/dossier/types.ts` (R) · `src/brain/dossier/tables.ts` (R) · `src/brain/dossier/destinations.ts` (R) · `src/brain/dossier/__fixtures__/dossier-reference.json` (R) · `src/brain/dossier/__fixtures__/dossier-minimal.json` (R) · `src/brain/dossier/validate.test.ts` (R)

> **AMENDEMENT DU 2026-09-19, après le BLOCAGE remonté par `dev-contrat` — le plan validé avait tort sur un fichier.** Il interdisait de toucher `dossier-minimal.json`. Or **trois assertions, dans deux fichiers hors de tout lot, exigent que la fixture MINIMALE instancie tout chemin de table et toute clé de destination** : `couverture.test.ts:486` (aucune ligne morte), `couverture.test.ts:528` (4e assertion — tout chemin de table a une instance dans la fixture, qui balaie `CHEMIN_FIXTURE`, la **minimale**, pas la référence) et `suffisance.test.ts:244` (aucune clé en trop face à la minimale). Mesuré : 3 échecs, une seule cause.
> **D'où vient l'erreur** : le comité a mesuré la table `LIBRES` de `couverture.test.ts` — correctement, aucune dispense n'était due — puis a généralisé du résultat d'**une** famille d'assertions à **tout le fichier**. Mesurer une assertion ne dit rien des autres assertions du même fichier.
> **Remède retenu, variante (a), mesurée verte à 1038/1038** : une ligne dans l'unique lieu de la minimale, `"acces": ["lieu.val-cendre"]` — auto-référence **légale et sans garde** (KR-194) qui résout. La variante (b) (ajouter un second lieu) a été **mesurée** et casse 3 tests de plus dans 2 fichiers supplémentaires (`identifiers.test.ts:172`, `validate.test.ts`) : elle annexerait deux fichiers hors lot.
> **Pourquoi le lot 1 et pas le lot 2** : `__fixtures__/` est du domaine du contrat. Confier un fichier de `src/brain/` à un lot `feature` violerait la Décision A (« `brain/` n'est jamais dans un lot `feature` »).
> **`couverture.test.ts` reste non modifié** — le critère d'acceptation tient, seul « `dossier-minimal.json` intouché » tombe.
- **Expose** : les quatre signatures du § 4. JSDoc de `acces` : arête **ORIENTÉE**, une entrée = un sens, un passage réciproque = **deux** entrées ; aucun inverse stocké ni dérivé (KR-013) ; auto-référence **légale et sans garde** (KR-194), l'exclusion vit à l'écran ; liste vide = état calme.
- **Fixture** : **3 entrées** sur les 5 lieux — un aller simple **plus** une paire réciproque, pour que la réciprocité soit *visible*. Toutes doivent résoudre.
- **Poseurs** : inscrire le chemin dans `POSEURS` (références, `validate.test.ts:3053`) **et** dans `POSEURS_DE_LISTE_TEXTUELLE` (`:1879`) — les deux portent une assertion d'exhaustivité contre leur table.
- **Critères couverts** : #1, #2, #3, #4, #5
- **Acceptation** : `npx jest src/brain` vert · **`validate.ts` non modifié** · **`couverture.test.ts` non modifié** · `suffisance.test.ts` non modifié · `atteignabilite.ts` non modifié · `identifiers.test.ts` non modifié · aucun fichier de `src/features/`. *(« `dossier-minimal.json` intouché » retiré par l'amendement ci-dessus — le fichier entre dans le lot, avec la seule ligne d'instanciation.)*

### Lot 2 — `acces-a-l-ecran` `feature`

- **Ouvrier** : `dev-lot` — démarre **contrat figé**, qu'il lit comme une donnée immuable.
- **But** : la section d'édition des accès, et le retrait de la dette d'encapsulation qu'elle rouvrirait.
- **Fichiers** : `src/features/dossier-canon/components/FicheLieu.tsx` (R) · `src/features/dossier-canon/components/PanneauLieux.tsx` (R) · `src/features/dossier-canon/components/styles.ts` (**N**) · `src/features/dossier-canon/tests/panneauLieux.test.tsx` (R)
- **Consomme** : `type Lieu` (avec `acces?: string[]`), `avecOrpheline`, `localiserEntite`, `Select`, `IconButton`, `HIT_TARGET_MIN` depuis `../../../brain` — tous vérifiés atteignables (`brain/index.ts:565`, `export * from './components'`).
- **Expose** :

```ts
export interface FicheLieuHandle { focusRetirer: () => void }   // BUG-078

export interface FicheLieuProps {
	lieu: Lieu
	/** TOUS les lieux, ordre du document, SELF COMPRIS — options des lignes déjà
	 *  écrites. Seule la ligne D'AJOUT exclut `lieu.id` (précédent FicheIndice.tsx:198). */
	lieux: Lieu[]
	index: number
	brouillon: BrouillonLieu
	refus: RefusLieu | null
	nomInputRef: Ref<HTMLInputElement>
	onChangeChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onBlurChamp: (champ: keyof BrouillonLieu, valeur: string) => void
	onAjouterAcces: (cibleId: string) => void
	onChangerAcces: (rang: number, cibleId: string) => void
	onRetirerAcces: (rang: number) => void
	onRetirer: () => void
}
export const FicheLieu = forwardRef<FicheLieuHandle, FicheLieuProps>(…)

// PanneauLieux.tsx — tous via le `commit(lieux, lieuId)` existant, patch étroit
function handleAjouterAcces(id: string, cibleId: string): void   // no-op si cibleId === ''
function handleChangerAcces(id: string, rang: number, cibleId: string): void
function handleRetirerAcces(id: string, rang: number): void
```

`acces` **n'entre pas dans `BrouillonLieu`** : le `Select` committe directement (précédent `presence[].lieu_id` / `BlocPresence`).

- **Contraintes dures** :
  - **Aucun nouveau `querySelector` par `aria-label`.** L'ajout d'accès rouvre l'effet `intentionFocus` de `PanneauLieux.tsx:99`, où vit déjà BUG-078 ; le réflexe serait la **4e occurrence** de la classe, la 2e dans ce fichier. **BUG-078 se corrige ici** par `useImperativeHandle({ focusRetirer })` — `IconButton` est déjà `forwardRef` (`brain/components/IconButton.tsx:30`), donc **zéro fichier `brain/`**.
  - **`styles.ts`** : tokens déplacés **à l'identique** depuis `PanneauLieux.tsx:285-364`, aucune valeur recréée. Ce n'est pas une abstraction, c'est la scission KR-112 : `PanneauLieux` (364 l. + ~45 l. de gestionnaires ≈ 410 l.) franchit le signal de 400 ; après extraction, ~330 l.
  - **Aucun inverse stocké ni recalculé**, sous aucune forme.
- **Critères couverts** : #6, #7, #8
- **Porte aussi l'étape 4 des Build Steps** (jamais un troisième lot) : `specification.json`, `code-knowledge.json`, `CHANGELOG.md`, `features_history.json`, colonne `Statut` du § 2 bis, budget de contexte.

**Hors de toute propriété** — un lot qui croit en avoir besoin **s'arrête et remonte** : `validate.ts`, `couverture.test.ts`, `atteignabilite.ts`, `controles.ts`, `App.tsx`, `dossier-minimal.json`, `brain/index.ts`, `FicheIndice.tsx`, `src/features/dossier-canon/index.ts`.

## 6 — Critères d'acceptation

1. **Étant donné** les lieux A et B existants, **quand** l'auteur ajoute un accès de A vers B, **alors** `A.acces` contient `B.id` **et** `B.acces` reste inchangé (KR-013) — *contrat* — *lot 1*
2. **Étant donné** un `acces` citant un identifiant absent du dossier, **quand** `validateDossier` s'exécute, **alors** `reference-pendante` est rendue au chemin exact, nommant l'orphelin — *contrat* — *lot 1*
3. **Étant donné** un lieu dont `acces` cite son propre identifiant, **quand** `validateDossier` s'exécute, **alors** aucune anomalie n'est levée (KR-194) — *contrat* — *lot 1*
4. **Étant donné** un `acces` contenant une chaîne vide, **quand** `validateDossier` s'exécute, **alors** elle est refusée — *contrat* — *lot 1*
5. **Étant donné** le dossier de référence enrichi de 3 entrées (aller simple + paire réciproque), **quand** `validateDossier` s'exécute, **alors** `ok: true` sans régression sur les anomalies préexistantes — *contrat* — *lot 1*
6. **Étant donné** ≥ 2 lieux au dossier, **quand** l'auteur ouvre la section d'un lieu, **alors** `EYEBROW_ACCES` et `LEGENDE_ACCES` sont rendus mot pour mot **et** le lieu courant est absent des options du `Select` d'ajout — *composant* — *lot 2*
7. **Étant donné** un accès dont la cible a été retirée ailleurs, **quand** la fiche se rend, **alors** l'option de repli « Lieu introuvable — <id> » s'affiche, jamais filtrée en silence (KR-021) — *composant* — *lot 2*
8. **Étant donné** une fiche portant ≥ 1 accès, **quand** l'auteur navigue au clavier, **alors** l'ordre de tabulation suit DANGERS → lignes d'accès (`Select` puis ✕) → `Select` d'ajout → « Retirer le lieu », sans `tabIndex` manuel — *composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `acces ne crée jamais l'inverse` | après écriture A→B, `A.acces` contient `B.id` **et** `B.acces` est inchangé — **deux lieux distincts**, sinon le témoin épingle une coïncidence | contrat | KR-013 | 1 |
| *(boucle `REFERENCES_SIMPLES`)* | `reference-pendante` au chemin exact — **gratuit**, l'inscription du poseur suffit | contrat | KR-021 | 1 |
| *(exhaustivité, `validate.test.ts:3154`)* | `Object.keys(POSEURS)` = les chemins de `REFERENCES_SIMPLES` — **rougit si le lot ajoute l'entrée de table sans son poseur**. C'est le garde qui force le test, pas une formalité | contrat | — | 1 |
| `un lieu peut s'accéder lui-même` | aucune anomalie sur `acces: [lieu.id]` | contrat | KR-194 | 1 |
| `une chaîne vide dans acces est refusée` | exerce la borne `validate.ts:422` (`!endsWith('[]')`) | contrat | — | 1 |
| `la référence enrichie reste valide` | `ok: true`, anomalies préexistantes inchangées | contrat | — | 1 |
| `la section des accès rend ses textes et exclut le lieu courant` | `EYEBROW_ACCES` + `LEGENDE_ACCES` mot pour mot ; `lieu.id` absent des options d'ajout, **présent** dans celles d'une ligne écrite | composant | — | 2 |
| `une cible retirée reste désignable` | option « Lieu introuvable — <id> » rendue | composant | KR-021 | 2 |
| `l'ordre de tabulation traverse les accès` | `user-event`, séquence du § 3 | composant | — | 2 |
| `le retrait d'un lieu ne cherche plus le bouton par aria-label` | `PanneauLieux` appelle `focusRetirer()` ; aucun `querySelector` d'`aria-label` dans le fichier | composant | BUG-078 | 2 |

**Cas limites couverts** : vide (liste absente, < 2 lieux) · référence orpheline · chaîne vide · auto-référence · annulation (`Select` remis à `''`).
**Cas limite NON couvert, limite assumée et datée** : **doublon** — `acces` portant deux fois la même cible n'a aucune garde, exactement comme `mene_a` aujourd'hui. Le dédoublonnage se fera **à l'injection**, charge de la n° 10.

**Non vérifiable en l'état — à recopier dans la revue.** Trois points, chacun **mesuré** plutôt que supposé :

- Le **rendu visuel** de la section : jsdom ne calcule aucun layout. ESLint vérifie que les valeurs sont des tokens, jamais la mise en page.
- **KR-159 — le compte « NEUF » de la docstring de `REFERENCES_SIMPLES` (l. 547) n'est épinglé par aucun test.** Vérifié : rien dans `src/brain/dossier/*.test.ts` n'assertionne la longueur de cette table ni le mot de sa docstring. L'assertion d'exhaustivité de `validate.test.ts:3154` force un *poseur par référence*, pas le compte écrit en prose. Le passage à « DIX » est donc une **discipline de revue**, et un oubli resterait vert.
- **KR-112 — aucune règle `max-lines` dans `.eslintrc.cjs`.** Vérifié. Le franchissement du signal de 400 lignes par `PanneauLieux.tsx` et le retour à ~330 après extraction se **constatent à la main** dans la revue ; aucun instrument ne les surveille.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | `narratif-ia` | `acces[]` en objet `{vers_lieu_id, description?}` — **veto tour 1** | `REJETÉ` | **Retiré par son auteur au tour 2, sur mesure** : `Lieu` porte déjà trois proses `ia` (`destinations.ts:395-397`) ; une prose par arête serait une seconde source de vérité sur le même fait. Le précédent `Climat.manifestation` ne transfère pas — là, l'entité entière était muette |
| 2 | `pm-produit` | Regroupement `vers_lieu_id` + `description` — **veto tour 2** | `SANS OBJET` | Le désaccord 1 ayant été retiré **en parallèle**, plus rien ne les regroupe. La condition attachée est retenue en 3 |
| 3 | `pm-produit` + `narratif-ia` | `description` ne doit pas partir en report **flou**, sinon c'est le pari rejeté 4 fois (`tier` KR-192, `Quete.lie_au_canon` KR-206, `Indice.portee`, classifications d'`Evenement`) | `REPORTÉ` | `open_questions` de la spec, **propriétaire n° 10**, texte arrêté (annexe B de `narratif-ia` tour 2) + une ligne au § 2 bis du roadmap. **Pas** une it6 pré-numérotée : ça présupposerait la réponse (b) et préempterait KR-195, qui appartient à la n° 10 |
| 4 | `pm` maintenu · `tech-lead` renforcé · `qa` retirée | Rider `validate.ts` (4 sites sans `entityId`, `designerSavoir`) | `REJETÉ` du périmètre | **Ré-armé sur le fichier `validate.ts`**, en `known_risk` nommé. Mesuré : `acces` ne demande **aucune ligne** de `validate.ts` (`:422`). **La ligne du roadmap qui l'armait « donc B1 » repose sur une prémisse fausse et doit être corrigée** |
| 5 | `tech-lead` (prop. 2, puis conseille de couper) · `pm` · `ux` | Liste « ACCESSIBLE DEPUIS » en lecture seule | `REPORTÉ` | Aucun verbe neuf pour l'auteur, et jamais injectée (les arêtes entrantes sont du spoiler). **Contrat de texte UX conservé tel quel** pour l'itération qui la portera |
| 6 | `tech-lead` | Aucune garde d'auto-référence au SSOT | `RETENU` | L'exclusion vit à l'écran, ligne d'ajout seule (KR-194, précédent `mene_a`) |
| 7 | `tech-lead` | « forme structurée = 7e famille D1 » — **interdit de tour 1** | `REJETÉ` | Mesuré faux, **retiré par son auteur** : D1 ne régit que les couples `…_texte`/`…_expr`, et `monde` porte déjà sept objets structurés. Ne pas figer ce motif — l'objet était **légal**, seulement inutile |
| 8 | `tech-lead` · `narratif-ia` | Doublons dans `acces` | `RETENU` comme limite | Aucune garde, comme `mene_a`. Dédoublonnage à l'injection, n° 10 |
| 9 | `ux-designer` | Réserve sur la formulation des textes | `RETENU` | Les textes du § 3 sont contractuels ; un agent d'essaim ne les reformule pas |
| 10 | `tech-lead` (tour 2) | Ajouter `couverture.test.ts` et `brain/index.ts` au lot 1 | `REJETÉ` pour cette forme | Les deux corrections étaient motivées par la forme objet (dispense `LIBRES` pour `description`, publication du type `AccesLieu`). **Mesuré par la QA** : avec `string[]`, zéro ligne de `couverture.test.ts`, aucun type neuf à publier |
| 11 | `qa` | Ambiguïté de « relier » — risque d'écriture symétrique dans le handler | `RETENU` | **Maintenue contre la légende UX seule** : le texte répare la lecture de l'écran, pas le code d'écriture. Devient le critère #1, sur deux lieux distincts |

> **Artefact de tour parallèle, à savoir en lisant les notes** : `tech-lead`, `ux-designer` et `pm-produit` ont rendu leur tour 2 **pendant** que `narratif-ia` retirait son veto. Les trois ont donc argumenté contre une demande disparue — le `tech-lead` a livré une annexe complète pour la forme objet, l'`ux-designer` le contrat de texte du champ `ISSUE`. Ces parties sont **caduques** ; ce qui en survit est repris ci-dessus et signalé en tête de chaque note.

## 9 — Innovation

*(aucune)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet** : l'itération ne touche ni `challenge`, ni `combat`, ni `xp`, ni `characteristics`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de `dossier-canon`
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-canon-it5.revue.md`
- [ ] **Correction du roadmap** : la ligne « Rider `validate.ts` → déclencheur : … donc **B1** » du § 2 bis est fausse (mesurée) — le déclencheur est le fichier, pas cette tranche

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **veto sans objet** (désaccord 2) | oui — condition portée en désaccord 3 |
| Tech Lead | recevable sous réserve | oui — interdit de tour 1 retiré par lui-même (désaccord 7) |
| UX | recevable sous réserve | **réserve maintenue, préventive** : les textes du § 3 ne se reformulent pas |
| QA | recevable sous réserve | oui — objection « rider » retirée ; objection « relier » convertie en critère #1 |
| Narratif & IA | **veto retiré** → recevable | oui — exigence restante satisfaite : commentaire d'audience (§ 4) + report nommé (désaccord 3) |
