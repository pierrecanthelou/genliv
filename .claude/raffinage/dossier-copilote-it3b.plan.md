# Plan d'itération — `dossier-copilote` · itération `3b`

> Statut : **`validé`** — porte 1 (mécanique) franchie, **porte 2 (humaine) franchie le 2026-09-18**.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-18
> Composition : **5 rôles** — motif : contrat de sortie IA, invite worker, audiences du dossier.
> Exécution : **séquentielle** (2 lots) — aucun essaim, aucun worktree, aucune fusion.
> Tours : 2. **Trois vetos posés** (TL3b-1 clé réseau, TL3b-3 cible, TL3b-9 promotion `etape`) — **tous non contestés**, leurs cibles ayant concédé. Le veto conditionnel de la QA sur le prédicat de doublon **s'est dissous** : le narratif a fourni la signature séparable qu'elle exigeait, et l'arbitrage a ensuite écarté le prédicat pour un autre motif.

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut **faire compléter le plan d'actions d'un personnage**. » |
| **Tranche** | 5ᵉ carte « Compléter le plan d'actions » → `CopiloteService.demander('personnage-plan', …)` → assemblage à 9 chemins **dont le préfixe ordonné** → route worker `POST /ia/personnage-plan` → sortie **SCALAIRE** `{"intention": "…"}`, six prédicats → acceptation → `plan_actions[]` reçoit `{ etape, action }`, `etape` posé **par le code sur la liste vive** → `DossierService.update` → `dossier:updated` |
| **Lots** | 2 lots séquentiels · dont `contrat` : **oui** (lot 1, seul et en premier, **scission de `contexte.ts` incluse**) |
| **Hors périmètre** | `si_bloque`, `duree`, `declencheur_texte`, `declencheur_expr` · tout plafond de document sur `plan_actions[]` · la promotion de `etape = rang+1` dans `brain/` · le prédicat de doublon · le renommage `LigneReplique` → `LigneDecision` · la correction de `handleRetirerEtape` · tout fichier de `dossier-fiches`, `dossier-canon`, `dossier-registres`, `dossier-controles` |
| **Reporté** | promotion de `etape` (→ quand la renumérotation à la suppression sera réparée) · prédicat de doublon (→ sur une recopie **comptée**) · `si_bloque` (→ sur une étape existante portant déjà une `duree`) · `savoirs[]` au contexte (→ n° 12) · renommage `LigneDecision` (→ 3ᵉ consommateur) · union étiquetée des cibles (→ 3c) |

> **⚠ LE `goal` DE LA SPEC PORTE DEUX CLAUSES PÉRIMÉES, corrigées ici.**
> (a) « **paiera le 4ᵉ rôle sans marge si la ligne 384 de `frontiere.test.ts` n'a pas été réparée à 3a** » — **elle l'a été**, avec son cas négatif vu rouge. Dette éteinte.
> (b) « des **SOUS-ENTITÉS STRUCTURÉES, chacune portant plusieurs champs** » — **faux**. Des six champs de `PlanAction`, le modèle n'en atteint **qu'un** (§ 2). Ce qui est réellement neuf, et **ce dont 3c a besoin** : **l'unité acceptée est une sous-entité que le CODE CONSTRUIT** — `{ etape, action }`, dont le champ requis `moteur` est écrit par le code à l'instant de l'écriture. **Sans cette réécriture, un ouvrier livrera les six champs « parce que c'est écrit ».**

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur peut faire compléter le plan d'actions d'un personnage.**

Le copilote propose **une** prochaine étape, l'auteur l'accepte ou la refuse, et l'acceptation écrit `{ etape, action }` à la suite de `monde.personnages[].plan_actions[]`.

**Deux traits sont neufs, et ils répondent à « en quoi 3b diffère de 3a » :**
1. **`etape` est posé par le CODE**, au moment de l'écriture, sur la liste **vive** — le modèle ne le voit jamais et n'en rend aucun.
2. **Le contexte injecte le champ cible** — première fois que le copilote **continue** une liste **ORDONNÉE** au lieu de compléter un sac. C'est un **amendement explicite** à la doctrine de 3a (§ 4 bis).

## 2 — Hors périmètre

**Des six champs de `PlanAction`, le modèle n'en atteint qu'UN.** Ce tableau est le périmètre, et il est fermé :

| champ | audience | 3b | motif du retrait |
|---|---|---|---|
| `action` | `ia` | **RENDU** | seul champ qui traverse le réseau |
| `etape` | `moteur` | **POSÉ PAR LE CODE** | le modèle ne rend jamais un entier (doctrine it2, précédent `CERTITUDE_INITIALE`) |
| `duree` | `moteur` | **REJETÉ** | l'unité du pas d'horloge appartient à la n° 9, **non décidée** : en proposer une trancherait en passant une décision que personne n'a prise. **Et le code ne peut pas la poser non plus** (KR-221) |
| `si_bloque` | `ia` | **REJETÉ** | non vide **sans `duree`**, il allume le constat `info` de `controles.ts:727` : **chaque acceptation fabriquerait l'avertissement que le copilote prétend épargner** |
| `declencheur_texte` | `auteur` | **REJETÉ** | condition en prose désignant par **nom libre**, dans une famille délibérément **calme** (`alerteSansExpr: false`) : rien ne signalerait jamais le dossier rempli de conditions non traduites |
| `declencheur_expr` | `moteur` | **REJETÉ** | langage de conditions D1 : du code |

**Également hors périmètre** : tout **plafond de document** sur `plan_actions[]` (aucune règle n'est arbitrée — l'inventer par symétrie avec `PARLER_REPLIQUES` la déciderait en passant) · la **promotion de `etape = rang+1`** dans `brain/` · le **prédicat de doublon** · le **renommage** `LigneReplique` → `LigneDecision` · la **correction de `handleRetirerEtape`** · l'**union étiquetée** des cibles · tout fichier de `dossier-fiches`, `dossier-canon`, `dossier-registres`, `dossier-controles`.

## 3 — Contrat de design

### 3.1 Jetons — tous vérifiés existants, **aucun neuf**
Réemployés tels quels de `LigneReplique` / `CarteFaireParler` : `--border-field` · `--r-md` · `--surface-inset` · `--text-body` · `--text-muted` · `--border-rule` · `--font-ui` · `--font-mono` · `--fs-body` · `--fs-eyebrow` · `--track-eyebrow` · `--space-3/4` · `--hit-target`.

### 3.2 `CarteCompleterPlan` — **cinquième carte**, 4ᵉ active

Placée **après** `CarteFaireParler`, **avant** le placeholder « Bientôt — itération 4 » (badge **INCHANGÉ** : il nomme l'itération 4 du roadmap, pas 3b). Ordre de rendu :

1. `Select` **PERSONNAGE** — `LABEL_PERSONNAGE` réutilisé, **liste complète**.
2. **Bloc « DÉJÀ ÉCRIT »** — `EYEBROW_DEJA_ECRIT` + une entrée par étape existante, eyebrow `eyebrowEtape(n)`, **n'affichant que le texte de l'étape**. **Non focalisable. GELÉ au clic « Lancer ».**
   > **Déviation motivée du précédent répliques** : la liste est **ORDONNÉE**, donc l'ordinal est une **information réelle** qu'une réplique, ensemble non ordonné, n'a pas. Ces numéros-là sont **lus dans le document**, donc vrais.
3. `BarreLancer` — désactivation, ordre : (a) `!estDisponible()` → `TITRE_COPILOTE_NON_CONFIGURE` · (b) aucun personnage → `TITRE_AUCUN_PERSONNAGE` · (c) appel en vol. **⚠ AUCUN cas « plafond » — il n'en existe pas.**
4. `MENTION_RELANCE_PLAN` — permanente, `--text-muted`.
5. **Refus / échec** : `⊘ ` + le texte du motif (§ 3.4).
6. **Résultat** : **UNE** `LigneReplique`, précédée de l'eyebrow `EYEBROW_PROCHAINE_ETAPE`.
7. `IssueList` si l'écriture est refusée — proposition et décision **conservées**.

**Changer de personnage abandonne la proposition et le gel** — même geste que `handleChangerPersonnage` de la carte 4.

### 3.3 `LigneReplique` — **RÉEMPLOYÉE TELLE QUELLE, zéro ligne de code changée**

**Mesuré** : `LigneRepliqueProps` est `{ texte, decision?, accepterDesactive?, titreAccepterDesactive?, onAccepter, onRejeter, onOuvrirFiche }` — **aucun membre propre aux répliques**, la prop s'appelle déjà `texte`, l'eyebrow est rendu par la **carte**, et les deux props de plafond sont **optionnelles** (la carte plan ne les passe pas).

**Le seul diff autorisé sur ce fichier est sa DOCSTRING**, qui doit **nommer ses deux consommateurs**. Aucune ligne de code, aucun changement de props, aucun renommage.

> **Pourquoi pas un `LigneEtape` neuf, ni le renommage en `LigneDecision`** — les deux sont **REJETÉS** (§ 8, n° 14 et 15) : `si_bloque` sortant, `LigneEtape` serait `LigneReplique` à l'identique (110 lignes dupliquées) ; et le renommage ouvrirait **trois surfaces vertes** pour ne changer qu'un nom. **Le tech-lead a retiré sa propre proposition de renommage en s'appliquant sa règle.**

### 3.4 Textes exacts — `textes.ts`

```ts
export const CARD5_TITRE = "Compléter le plan d'actions"
export const CARD5_CORPS =
	"Propose la prochaine étape du plan d'actions de ce personnage — ce qu'il entreprend ensuite pour obtenir ce qu'il veut."
export const EYEBROW_PROCHAINE_ETAPE = 'PROCHAINE ÉTAPE'
export function eyebrowEtape(n: number): string { return `ÉTAPE ${n}` }
export const MENTION_AUCUNE_ETAPE =
	"Ce personnage n'a encore aucune étape dans son plan d'actions — la première proposée s'ajoute en tête."
export const MENTION_AUCUNE_ETAPE_AU_LANCER =
	"Ce personnage n'avait aucune étape dans son plan d'actions au lancement de cet assistant."
export const MENTION_RELANCE_PLAN =
	'Le copilote lit les étapes déjà écrites, jamais celles que vous avez refusées : chaque lancer repart de la liste enregistrée.'
export const TEXTE_REFUS_CIBLE_A_ECRIRE_PLAN =
	"Ce personnage n'a pas encore d'objectif écrit — complétez d'abord son but, dans Personnages."
export const TEXTE_REFUS_TROP_LONG_PLAN =
	"Le contexte est trop long pour proposer une étape — raccourcissez d'abord la fiche de ce personnage."
```

⚠ **`EYEBROW_PROCHAINE_ETAPE` NE PORTE AUCUN NUMÉRO, et c'est structurel.** Un numéro affiché sur la **proposition** serait calculé sur la liste **GELÉE**, alors que celui qui est écrit l'est sur la liste **VIVE** : s'ils divergent, **l'écran a menti d'un entier**. Le modèle ne rend jamais un entier, **et l'écran n'en pré-annonce pas un que le code n'a pas encore décidé.** `eyebrowEtape(n)` reste, lui : ces numéros-là sont lus dans le document.

⚠ **`MENTION_RELANCE_PLAN` NE PROMET AUCUN REFUS AUTOMATIQUE.** Le prédicat de doublon est **hors périmètre** (§ 8, n° 12) : la phrase dit ce qui est **lu** et ce qui est **oublié**, rien de plus. Toute formulation du type « une proposition identique est refusée automatiquement » serait **fausse** et est interdite.

**RETIRÉS des tours précédents** (le fait qui les fondait a disparu avec `si_bloque`) : `EYEBROW_SI_BLOQUE` · `TEXTE_SI_BLOQUE_NON_PROPOSE` · `EYEBROW_INTENTION` · `eyebrowEtapeProposee(n)`.
**Réutilisés tels quels** : `LABEL_PERSONNAGE`, `OPTION_AUCUN_PERSONNAGE`, `TITRE_AUCUN_PERSONNAGE`, `TITRE_COPILOTE_NON_CONFIGURE`, `EYEBROW_DEJA_ECRIT`, `TEXTE_ILLISIBLE`, `TEXTE_INDISPONIBLE`, `texteRefusAEcrire`, `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `LABEL_LANCER`, `LABEL_ANNULER`, `TEXTE_CHARGEMENT`.

**`LIBELLE_DES_CHAMPS` reste à QUATRE entrées** (veto de 3a, non renégociable), **et le composant neuf ne porte aucun `label="…"`** — corollaire invisible à `libelles.test.ts`. ⚠ **Aucun nom de champ n'est écrit à l'écran** : ni « INTENTION », ni « SI LE JOUEUR BLOQUE », qui vivent déjà dans `BlocPlanActions.tsx`. **Le risque « une chaîne, deux domiciles » est supprimé par construction, pas par vigilance.**

### 3.5 Le gel, et la dérivation

```ts
// figé au clic Lancer, jamais relu du dossier vivant :
const dejaEcritesGelees = (personnageParId(personnageId)?.plan_actions ?? []).map((e) => e.action)
```
`dossier` est un abonnement réveillé par `dossier:updated`, **donc par l'acceptation elle-même** (famille BUG-097/101/106/109).

⚠ **AUCUN compteur de plafond, AUCUN `accepterDesactive`** : il n'existe pas de plafond de document. `LigneReplique` reçoit ses deux props de plafond à `undefined`.
⚠ **Focus post-décision — UNE SEULE BRANCHE** : il n'y a qu'une proposition, et « Lancer » n'est **jamais** désactivé par la boucle de décision (seulement par `indisponible`/`aucunPersonnage`, état déjà vrai **avant** que la boucle ne commence). Le focus revient donc **toujours** à « Lancer ». **Zéro occurrence de la famille BUG-097/101/106/109 à instrumenter sur cette carte** — et l'invariant de BUG-109 (« ne jamais viser une cible que ce même rendu désactive ») est tenu **par construction**.

### 3.6 Clavier
`Select` → (bloc DÉJÀ ÉCRIT, non focalisable) → `BarreLancer` (Entrée = clic natif, Échap en vol = Annuler) → `+` puis `×` de l'unique ligne → après décision : **« Lancer »**.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander` | service | fournit | **4ᵉ surcharge** — aucun membre ajouté |
| `CiblePlan` | type | fournit | `{ acteurId: string }` |
| `ReponsePlan`, `PropositionPlan` | type | fournit | § 4.1 |
| `RoleCopilote` | type | fournit | **quatre** membres |
| `DossierService.update` | service | consomme | inchangée |
| `dossier:updated` | événement | émet | `{ dossierId }` |

### 4.1 `src/brain/copilote/types.ts` (R)

```ts
/** QUATRE rôles. ⚠ SANS ACCENT : la classe `[a-z-]+` de l'expression d'extraction
 *  des gabarits ET de la route `/^\/ia\/([a-z-]+)$/` l'exigent. */
export type RoleCopilote =
	| 'personnage-prose' | 'indice-detenteurs' | 'personnage-repliques' | 'personnage-plan'

/** CE QUE LE MODÈLE REND — franchit le réseau. UNE clé, UNE CHAÎNE (scalaire).
 *  NON ré-exportée par `brain/index.ts`. */
export interface IntentionRendue { intention: string }

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. ZÉRO clé commune
 *  avec `IntentionRendue` (KR-231).
 *  ⚠ DEUX MOTS POUR LA MÊME CHAÎNE, et c'est le précédent `valeur` → `texte` :
 *  `intention` ENSEIGNE AU MODÈLE ce qu'on attend et ne se confond pas avec le
 *  champ du document ; `action` NOMME LA DESTINATION et rend la recette d'écriture
 *  littérale. Quelqu'un « harmonisera » si ce commentaire n'est pas là. */
export interface PropositionPlan { acteurId: string; action: string }
```

### 4.2 `src/brain/copilote/schemaSortie.ts` (R)

```ts
export const CLES_SORTIE_PLAN = ['intention'] as const

/** ⚠ AUCUNE CONSTANTE DE BORNE, et c'est délibéré. La sortie est SCALAIRE : « deux »
 *  est NON REPRÉSENTABLE. Une liste bornée à un l'aurait rendu représentable et ne
 *  l'aurait interdit que par une constante — LA MEILLEURE GARDE EST CELLE QUI
 *  N'EXISTE PAS. Ni `ETAPES_PROPOSEES_MAX`, ni `INTENTIONS_PROPOSEES_MAX`. */

export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
	'personnage-repliques': '{"repliques": ["…", "…"]}',
	'personnage-plan': '{"intention": "…"}',
}

export function validerIntention(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & IntentionRendue) | { ok: false; motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }
```

⚠ **L'ANCÊTRE EST `validerSortie` (le rôle PROSE, scalaire), PAS `validerRepliques` (liste).** La sortie étant devenue scalaire, ce sont **les SIX prédicats de `validerSortie`** qui se transposent, pas les dix de `validerRepliques`. **Écrire dix prédicats ici serait recopier le mauvais ancêtre.**

| # | Prédicat | Motif |
|---|---|---|
| 1 | objet simple (ni tableau, ni `null`) | `schema` |
| 2 | clés = **exactement** `CLES_SORTIE_PLAN` — une clé en trop est un **refus** | `schema` |
| 3 | la clé porte une **CHAÎNE** | `schema` |
| 4 | non vide après `trim()` | `vide` |
| 5 | aucun `MARQUEUR_A_ECRIRE` (constante **importée**, KR-223) | `marqueur` |
| 6 | aucun identifiant du dossier — **`porteUnIdentifiant` réutilisée telle quelle** (KR-117) | `identifiant` |

⚠ **LE PRÉDICAT (3) EST LA GARDE DE KR-230, ET IL SE PROUVE PAR UN MUTANT.** Un `{"intention": ["a","b"]}` doit être **REFUSÉ `schema`**, jamais coercé, **jamais `[0]`**. Le mutant `Array.isArray(x) ? x[0] : x` est à **écrire et à voir rouge** : c'est le repêchage que KR-230 interdit, sous une autre forme.

**`MotifIllisible` est INCHANGÉE** — aucun membre neuf. **`'rang-inconnu'` est SANS OBJET** (aucun jeton, aucune appartenance) : ne pas l'écrire, ce serait du code mort présenté comme de la couverture (famille BUG-084, KR-235).

**Liste vide / chaîne vide = REFUS `'vide'`.** Test de rattachement de 3a appliqué : ce rôle rend **de la prose que rien ne fournit** ⇒ **RÉDACTION** ⇒ la non-réponse est un refus. Le cas « rien à prolonger » est traité **avant l'appel**, par `cible-a-ecrire`.

### 4.3 `src/brain/copilote/contexte/` (scission + 4ᵉ rôle)

```ts
CHAMPS_INJECTES['personnage-plan'] = [
	'canon.ton',                                   // REQUIS
	'canon.interdits_ton[]',
	'canon.partage.accroche_joueur',
	'monde.personnages[].fonction',
	'monde.personnages[].description_joueur',
	'monde.personnages[].but.libelle',
	'monde.personnages[].but.pourquoi',
	'monde.personnages[].caractere.jamais',
	'monde.personnages[].plan_actions[].action',   // LE PRÉFIXE ORDONNÉ, dans l'ordre du document, NON tronqué
]
PARTIES_REQUISES['personnage-plan'] = ['canon.ton']
BUDGET_CARACTERES_CONTEXTE['personnage-plan'] = 0  // ⚠ À MESURER AU LOT 1. Ne JAMAIS livrer un 0.
export function assemblerPlan(dossier: Dossier, cible: CiblePlan): ContexteProse
```

**Les neuf ont déjà la destination `'ia'` — aucune ligne neuve dans `destinations.ts`, `DEROGATIONS_AUDIENCE` reste vide et assertée vide.**

**RETIRÉS, avec leur motif :**
- **`canon.mj.synopsis_mj`** — ⚠ **le motif N'EST PAS celui de 3a.** En 3a le risque était la paraphrase *prononcée* ; ici c'est le **POINT DE VUE** : le synopsis porte ce que le personnage **ne sait pas**. Un modèle qui l'a écrit des étapes qui **anticipent l'intrigue**, et la n° 12 les injecte au rôle acteur, qui joue un personnage **qui devine** — la panne même que l'appareil `savoirs`/`revele_si` existe pour empêcher. **Ne pas recopier la phrase de 3a : l'écrire faux la ferait « harmoniser » un jour.**
- **`apparence`** — une apparence ne dit rien d'une intention ; seul chemin de fiche dont le retrait ne coûte aucune information d'intention.
- **`caractere.parler[]`** — des répliques ne disent pas ce qu'il *fait*, et ce serait un canal de paraphrase vers un champ qu'un **autre rôle** écrit.
- **`cede_si`, `curseurs.*`** — précédents 3a inchangés.
- **`savoirs[]` / contenu d'indice — REPORTÉ** (n° 12) · **`presence[]`, `relations[]` — hors tranche** (3c).

**`assemblerPlan` — quatrième fonction nommée, zéro branche de rôle.** Refus, ordre figé, **tous AVANT le moindre `fetch`** :
1. `a-ecrire` (charge `'canon.ton'`) ;
2. **`cible-a-ecrire`** — le personnage ne résout plus, **ou** `but.libelle` absent/vide/marqué. ⚠ **Prédicat NOMMÉ sur UN chemin** (`CHEMIN_BUT_CIBLE`), mécanisme exact de `CHEMIN_VERITE_CIBLE` du rôle 2 — **et NON la disjonction à sept chemins de 3a**. Motif : **on n'invente pas un PLAN à partir de rien** — un plan est la suite d'étapes vers un but ; sans but, toute suite se vaut et le modèle inventerait le but ;
3. `trop-long` — **refus, jamais de coupe** (KR-230).

⚠ **`'aucun-candidat'` est SANS OBJET** — une seule entité, aucun rang. Ne pas l'écrire.

#### La scission — où passe la couture, et pourquoi là

**On scinde ce qui varie par rôle ; on garde ENTIER ce qui doit rester TOTAL.** Les registres sont des `Record<RoleCopilote, …>` : **leur totalité EST le garde** (« un rôle ajouté sans entrée ne compile pas ») et le support du confinement KR-232. **Les éclater par rôle détruirait cette totalité à la compilation** (§ 8, n° 17).

| Fichier | Contenu | Taille visée |
|---|---|---|
| `contexte/index.ts` | barrel — re-exporte **exactement** les exports actuels | ~15 |
| `contexte/noyau.ts` | `estObjet`, `textesDuChemin`, `estRedige`, `textesRediges`, `PREFIXE_*`, `MotifRefusContexte`, `ContexteProse`, `ContexteDetenteurs` | ~120 |
| `contexte/registres.ts` | les 4 registres, **entiers** | ~250 |
| `contexte/prose.ts` · `detenteurs.ts` · `repliques.ts` | déplacés **tels quels** | ~60 / ~105 / ~80 |
| `contexte/plan.ts` | `assemblerPlan` — le 4ᵉ rôle | ~80 |

**Sans scission** : 674 lignes à 3b, **~784 à 3c** (16 lignes de marge avant le bloqueur KR-112 à 800), franchissement à l'it4. **Le dossier plutôt qu'un plat `contexte-noyau.ts`** : le barrel s'appelle `index.ts`, donc il tombe sous `coveragePathIgnorePatterns` **déjà écrit** (mesuré : `['/node_modules/', 'index.ts$']` — **aucun diff sur `jest.config.cjs`**), et **aucune instruction d'import ne change nulle part**.

### 4.4 `src/brain/CopiloteService.ts` (R)

```ts
/** ⚠ `acteurId` et JAMAIS `personnageId` : le dispatch rétrécit sur la FORME de la
 *  cible, et `CibleRepliques` est `{ personnageId }` NUE. Une 4ᵉ cible
 *  `{ personnageId }` serait LE MÊME TYPE — la surcharge déclarée l'accepte,
 *  l'implémentation la fait tomber dans `demanderRepliques` : rôle annoncé A,
 *  validateur exécuté B, `tsc` VERT. C'est le veto TL3a-5 au mot près.
 *  Le mot vient du dépôt : `dossier/types.ts:362` — « ce que le rôle ACTEUR joue ».
 *  ⚠ DETTE DATÉE : `acteurId` ne nomme aucune entité du dossier. 3c cible AUSSI un
 *  personnage — un TROISIÈME synonyme est le signal : 3c bascule alors les cinq
 *  cibles sur une UNION ÉTIQUETÉE, dans SON lot contrat. Jamais 3b. */
export interface CiblePlan { acteurId: string }

export type ReponsePlan = { statut: 'propose'; proposition: PropositionPlan } | EchecCopilote

demander(role: 'personnage-plan', dossier: Dossier, cible: CiblePlan, signal?: AbortSignal): Promise<ReponsePlan>

// LE DISPATCH — QUATRE branches, aucun repli :
if ('champ' in cible)    return demanderProse(dossier, cible, signal)
if ('indiceId' in cible) return demanderDetenteurs(dossier, cible, signal)
if ('acteurId' in cible) return demanderPlan(dossier, cible, signal)
return demanderRepliques(dossier, cible, signal)   // rétréci PAR LE COMPILATEUR

// re-résolution, ligne exacte :
return { statut: 'propose', proposition: { acteurId: cible.acteurId, action: issue.intention } }
```

⚠ **La proposition est la CIBLE plus le CONTENU** — invariant mesuré sur les trois rôles livrés (`{ entiteId, champ, texte }`, `{ indiceId, personnageIds }`, `{ personnageId, ajouts }`). Une proposition qui **renommerait la clé d'identité de sa cible** obligerait le service à traduire en recopiant : un endroit de plus où se tromper, **sans contrepartie**.

**La 4ᵉ surcharge n'ajoute AUCUN MEMBRE** : les bouchons `{ estDisponible, demander }` des tests de feature restent complets. `EchecCopilote`, `MotifRefusContexte`, `MotifIllisible`, `jusquAuRejeuUnique`, `unAller` : **INCHANGÉS**. Route `/ia/personnage-plan`.

`brain/index.ts` ré-exporte `CiblePlan`, `ReponsePlan`, `PropositionPlan`. **`IntentionRendue` jamais** (forme réseau).

### 4.5 `worker/frontiere.test.ts` (R) — **il ENTRE au lot 1**

**MESURÉ par la QA sur un 4ᵉ rôle réellement monté** (`INVITES` + `GABARIT_SORTIE` des deux côtés, `RoleCopilote` étendu, `jest` exécuté, **zéro ligne touchée dans le test**, puis revert complet) : **28 tests sur 29 s'étendent seuls** — dont `memesGabarits`, **vu rouge** sur un mésappariement injecté. **Un seul est en dur** : `toHaveLength(3)`, **ligne 319**, où `paires(ROLES)` = C(n,2) passe de **3 à 6**.

**La prédiction « zéro diff » du tour 1 est donc FAUSSE, et son auteur l'a retirée.** Le témoin devient plus fort : **le diff de `frontiere.test.ts` est EXACTEMENT cette liste, et rien d'autre.**

| Site | Ce qui change |
|---|---|
| l. 313 (titre du `it`) | retirer « trois » — le titre mentait sur la cardinalité |
| ll. 315-316 (commentaire) | idem |
| **l. 319** | `toHaveLength((ROLES.length * (ROLES.length - 1)) / 2)` **+** une assertion d'unicité des paires. ⚠ **Forme fermée INDÉPENDANTE de l'algorithme de `paires`** — ce n'est **pas** un témoin fabriqué depuis son propre sujet —, générique à N, **jamais à ré-éditer** ; la 2ᵉ ligne **rend** ce que le littéral `3` donnait en silence |
| ll. 347-367 | le couple (invite plan, sortie scalaire) ajouté au `it` de la borne, **avec son cas négatif** |
| l. 618 (commentaire « TROIS entrées ») | « une par rôle » — commentaire périmé |
| ll. 638-640 | **UNIQUEMENT si** la mesure du budget crée une égalité naturelle — voir ci-dessous |

⚠ **ZÉRO diff exigé** sur : `gabaritsSousChaines` · `invitesQuiNommentUnAutreGabarit` · `croiser` · `rolesAuMaximum` · `memesGabarits` · `extraire` · `ENTREE_GABARIT` · le `describe.each` des plafonds · le balayage du 3ᵉ porteur. **Un diff sur l'un de ces neuf = l'instrument a été plié pour entrer dans le lot qui le mesure.** C'est vérifiable à la lecture du diff, et c'est **plus fort** que « zéro diff sur le fichier », qui ne disait rien de **quoi** avait changé.

⚠ **LE PIÈGE CONDITIONNEL, ll. 638-640 — VÉRIFIÉ, il est réel.** Le test fabrique « deux rôles étroits égaux » et asserte `new Set(...).size).not.toBe(ROLES.length)`. **Si deux budgets sont DÉJÀ naturellement égaux** (p. ex. `personnage-plan` mesuré à 4 000, comme `personnage-repliques`), **l'assertion est vraie AVANT la fabrication : le test reste VERT en cessant de mesurer.** À traiter **dans le lot**, une fois la mesure connue.

⚠ **FAUSSE ALERTE À NE PAS PROPAGER, vérifiée par l'orchestrateur.** Une note de tour 2 annonce que `frontiere.test.ts:608-621` rougirait si le budget du 4ᵉ rôle égalait 6 000. **C'est faux** : ce test n'exige **pas** des budgets deux à deux distincts — c'est précisément l'assertion que **3a a supprimée**, et le commentaire des l. 610-616 le dit en toutes lettres. Il exige que **le MAXIMUM soit atteint par exactement un rôle** ; le maximum est `indice-detenteurs` à **17 000**, qu'un `personnage-plan` à 4 000 ou 6 000 ne touche pas. **Ne pas « corriger » ce test, il n'a rien.**

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Rôle** | `'personnage-plan'` · route `POST /ia/personnage-plan` · cible `{ acteurId }` |
| **Contexte** | **9 chemins**, tous `'ia'`, `DEROGATIONS_AUDIENCE` vide et assertée vide. **`synopsis_mj` retiré POUR POINT DE VUE**, **le champ cible INJECTÉ dans l'ordre du document** |
| **Sortie** | `{"intention": "…"}` — une clé, **une chaîne**, scalaire. **Aucune constante de borne** |
| **Échec** | Rejeu **exactement une fois**, puis **terminal** `illisible`. **La sortie fautive n'est JAMAIS affichée** |
| **Ce que l'IA ne fait PAS** | aucun entier, aucun identifiant, aucun nom, **aucune durée ni délai** · l'acceptation écrit `{ etape, action }` **et rien d'autre** |
| **Mémoire** | **aucune** — deux lancers ⇒ deux corps identiques. Les étapes **refusées** ne sont jamais retenues ; les étapes **écrites** sont relues du document à chaque lancer |

### L'AMENDEMENT À LA DOCTRINE 3a — à porter au registre

> **L'injection du champ cible dépend de son ORDRE, pas de son audience.**
>
> 3a a posé : le champ cible ne s'injecte pas. L'amendement le **RESTREINT, il ne l'annule pas** :
>
> **Un champ cible INTERCHANGEABLE ne s'injecte pas ; un champ cible ORDONNÉ s'injecte.**
>
> `caractere.parler[]` est un ensemble d'échantillons **sans ordre** : l'élément N ne présuppose rien, les montrer n'ouvre qu'un canal de paraphrase. `plan_actions[]` est une **SÉQUENCE** : l'étape N n'a de sens qu'après 1…N−1. **Le préfixe n'est pas la réponse — c'est la PRÉMISSE DE LA QUESTION.** Sans lui, le modèle repropose indéfiniment du matériau d'étape 1.
>
> **Asymétrie du regret** : injecter risque un **doublon** — visible à l'écran, rejeté d'un clic ; ne pas injecter risque une **incohérence de suite** — invisible à l'écran, invisible au validateur (KR-229), et **jouée telle quelle par le rôle acteur au Temps 2**. On prend le risque qu'un instrument constate.
>
> **CONTREPARTIES LIVRÉES avec l'amendement** : (1) l'auteur voit le préfixe **GELÉ** à côté de la proposition — il juge une suite, pas une phrase orpheline ; (2) **une seule étape par lancer** — sans quoi les propositions 2…n seraient écrites contre une prémisse que l'auteur peut encore refuser ; (3) l'invite dit « elle n'en répète aucune » (moitié **persuasive** seulement).
> ⚠ **LA MOITIÉ VALIDATEUR EST DÉLIBÉRÉMENT ABSENTE** (§ 8, n° 12) : aucun prédicat ne refuse la recopie. **L'écran ne doit donc rien promettre de tel** (§ 3.4).
>
> **Condition de généralisation, décidable** : tout futur champ cible de liste se range par un test unique — « **l'élément N présuppose-t-il l'élément N−1 ?** ». Oui ⇒ injection **plus les contreparties**. Non ⇒ précédent 3a inchangé.

**L'invite — MOT POUR MOT**, `INVITES['personnage-plan']`, gabarit **incrusté** par `${GABARIT_SORTIE['personnage-plan']}` :

```
Tu assistes l'AUTEUR d'un livre-jeu qui écrit le plan d'actions d'un personnage.
À partir du contexte fourni, tu proposes la PROCHAINE ÉTAPE de ce plan : ce que CE personnage-là entreprend ensuite pour obtenir ce qu'il veut.

Tu réponds par un objet JSON et rien d'autre, de la forme {"intention": "…"} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Cette étape est une INTENTION que le personnage poursuit : elle servira plus tard de consigne à qui le fait agir, elle ne sera jamais lue telle quelle à un joueur, et ce n'est jamais une phrase qu'il prononce.
Elle prolonge les étapes déjà listées, elle n'en répète aucune, et elle vient après la dernière.
Tu en proposes UNE, et toujours une : même quand le contexte est maigre, une fonction et un but suffisent à dire ce qu'un personnage entreprend ensuite.
Elle tient en une phrase et ne porte qu'UNE action.
Tu n'écris jamais de durée ni de délai — ni « au bout de trois jours », ni « le lendemain », ni « après une semaine » : le temps est compté ailleurs.
Tu n'écris jamais à quelle condition l'étape commence, ni ce que le personnage fait si elle échoue, ni aucun numéro d'étape.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**Quatre décisions à ne pas « corriger »** : (1) **le piège de recopie propre à ce rôle** — l'invite répliques (« ÉCHANTILLON DE VOIX ») produirait **des répliques** ; l'invite prose (« NOTE DE FICHE ») produirait **des descriptions**. La ligne propre est « une INTENTION … jamais une phrase qu'il prononce », **qu'aucun validateur ne peut constater** (KR-229). (2) « Tu en proposes UNE, et toujours une » est la moitié symétrique du prédicat (4) et **ne cite aucune constante** (il n'y en a plus). (3) « elle n'en répète aucune » est **persuasif seulement**. (4) **La ligne de la durée EST la ligne de l'itération** : elle ne dit ni « pas d'horloge », ni `duree`, ni `DUREE_MIN` — elle interdit le motif **en langue naturelle**, avec trois exemples, et s'arrête à « le temps est compté ailleurs ».

**Ce que l'invite n'a PAS le droit de réciter** : `DUREE_MIN` ni son chiffre · toute unité de temps de session · l'existence de `duree`, `si_bloque`, `declencheur_*` et leurs noms · le langage de conditions D1 · **le nom du champ `action` ou de tout autre champ** · la table d'audience · caractéristiques, seuils, tiers · le message ou le seuil d'un contrôle · **le mot « tour »**, réservé au round de combat.

**Le gabarit, ligne exacte, dupliquée à l'identique des deux côtés** :
```
	'personnage-plan': '{"intention": "…"}',
```
**Vérifié contre `/^\t'([a-z-]+)': '(.+)',$/gm`** : une tabulation ✓ · guillemets simples ✓ · rôle ⊂ `[a-z-]+`, **aucun accent, aucun chiffre** ✓ · virgule finale ✓ · **aucune apostrophe dans la valeur** ✓. Et `{"intention": "…"}` **n'est sous-chaîne d'aucun** des trois autres, ni réciproquement.

**`max_tokens: 200` — DÉRIVÉ par la règle du dépôt** (`jetons = L / r × 3`, arrondi à la centaine supérieure, **`r = 2` (pire) et on le dit**) :
- **P = 68** — deux sources indépendantes, **la seconde re-mesurée par l'orchestrateur** : `dossier-reference.json:172` = **67** ; `fichePersonnage.test.tsx:176` = **68**.
- enveloppe `{"intention": ""}` = **17**. `L = 85`. `r=3 ⇒ 100` ; **`r=2` ⇒ 127,5 ⇒ 200**.

⚠ **Le résultat dépend du ratio (100 contre 200)** : on prend le pire **et on le dit**. ⚠ **Ce 200 n'est PAS recopié de `personnage-prose`** — mesure sans rapport ; **la coïncidence doit être écrite dans le commentaire**, sinon un relecteur croira à une recopie et « harmonisera ».
**Mode d'échec nommé** : une intention très longue tronque le JSON ⇒ prédicat (1) ou (2) ⇒ `'schema'` ⇒ rejeu ⇒ terminal. **C'est le BON échec.**
**Contrôle de non-régression, exigible dans le lot** : appliquer la formule aux entrées de 3a doit **reproduire 400** ; sinon, rapporter l'écart **avant** d'écrire la constante.

## 5 — Lots

> **La frontière des lots EST la frontière de feature**, vérifiable d'un préfixe de chemin : lot 1 ∌ `src/features/**` ; lot 2 ⊂ `src/features/dossier-copilote/**`.
> **Le lot 1 passe `tsc --noEmit` + `jest` SEUL.**

### Lot 1 — `plan-contrat` · `contrat` · `dev-contrat` (effort élevé, seul et en premier)
**Fichiers (18)** : `src/brain/copilote/contexte.ts` (**D**) · `contexte/{index,noyau,registres,prose,detenteurs,repliques,plan}.ts` (**N** ×7) · `src/brain/copilote/contexte.test.ts` (R) · `types.ts` (R) · `schemaSortie.ts` (R) · `schemaSortie.test.ts` (R) · `src/brain/CopiloteService.ts` (R) · `CopiloteService.test.ts` (R) · `src/brain/index.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · `worker/frontiere.test.ts` (R)

**ORDRE INTERNE IMPOSÉ — la scission D'ABORD, et elle se PROUVE :**
1. **Étape A — le DÉPLACEMENT SEUL.** Pas une ligne du 4ᵉ rôle. Les **cinq** sites d'import sont `.../contexte` **sans extension** (`worker/frontiere.test.ts:37`, `contexte.test.ts:19`, `CopiloteService.ts:19`, `CopiloteService.test.ts:6`, `brain/index.ts:175`) et `tsconfig.json:8` porte `moduleResolution: "bundler"` : **aucune instruction d'import ne change**. ⚠ **Ces cinq fichiers doivent rester OCTET POUR OCTET identiques** — la QA exige un **diff vide** (`git diff --numstat` sans ligne), **la porte verte seule ne prouve rien**. L'ouvrier rejoue `tsc` + `jest` **ICI** et **reporte le diff vide**.
2. **Étape B — le 4ᵉ rôle**, dans les fichiers que A a créés.

**Ils partagent le lot, PAS la porte.** En faire deux lots est impossible (§ 8, n° 27).

**Critères couverts** : #1 à #6

### Lot 2 — `carte-plan` · feature · `dev-lot` (démarre contrat figé)
**Fichiers (7)** : `components/CarteCompleterPlan.tsx` (**N**) · `components/LigneReplique.tsx` (R — **docstring SEULE**, zéro ligne de code) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R — **seulement si** un jeton manque, sinon hors lot) · `textes.ts` (R) · `tests/planActions.test.tsx` (**N**) · `tests/panneauCopilote.test.tsx` (R — **compte de cartes, +1, une ligne**)

**Signature CONSOMMÉE, figée par le lot 1** :
`demander('personnage-plan', dossier, { acteurId }, signal): Promise<ReponsePlan>` · `PropositionPlan { acteurId, action }` · `DossierService.update`.

**LA RECETTE D'ACCEPTATION, MOT POUR MOT** (un ouvrier ne doit rien inventer ici) :
```ts
? { ...p, plan_actions: [...p.plan_actions, { etape: p.plan_actions.length + 1, action: texte }] }
```
⚠ `p` vient du `d` **de la recette** — le document **courant**, jamais le bloc gelé, jamais la proposition. **Deux clés, rien d'autre** (KR-221). `plan_actions` ∈ `LISTES_REQUISES` : toujours un tableau, **aucun `?? []`**.
**Motif** : entre la demande et l'acceptation, le plan **bouge** (ajout manuel, acceptation précédente). Un numéro calculé à la proposition est **périmé, et périmé en silence** — aucune règle d'unicité n'est arbitrée (`tables.ts:398`), et le moteur n° 14 hériterait d'un plan **inordonnable**.

**Critères couverts** : #7, #8

### Fichiers HORS de tout lot
`hooks/useDemandeCopilote.ts` *(générique `<C,P>` — **le rôle littéral est lié par la carte** ; un diff y est le signal d'une frontière franchie)* · `CarteFaireParler.tsx` · `tests/repliques.test.tsx` · `LigneProposition.tsx` · `LigneDetenteur.tsx` · `CarteCompleterFiche.tsx` · `CarteTisserIndices.tsx` · `BarreLancer.tsx` · `CarteAssistant.tsx` · `index.ts` · `tests/{cablage,acceptation,detenteurs,useDemandeCopilote}` · **tout `src/brain/dossier/**`** (dont `destinations.ts` : les six lignes de `plan_actions[]` y sont **déjà arbitrées**) · `brain/components/Select.tsx` · `jest.config.cjs` (**mesuré : le motif `index.ts$` couvre déjà le barrel**) · `lintIsolation.test.ts` · **tout `src/features/dossier-fiches/**`** · `specification.json`.

### 5.1 — Ce que le lot 1 doit MESURER *(jamais déduire)*
1. **Le diff VIDE de l'étape A** sur les cinq fichiers — `git diff --numstat` sans ligne. **La porte verte ne suffit pas.**
2. `M` **après assertion que les NEUF chemins résolvent non vides** ⇒ budget `ceil(M×3/1000)×1000`. **Jamais livrer le `0`, jamais recopier 4 000 ni 6 000.**
3. **Si le budget mesuré égale celui d'un autre rôle**, traiter `frontiere.test.ts:638-640` (fabrication devenue inerte).
4. `TAILLE_MAX_CORPS_IA` **re-dérivé sur les QUATRE rôles** — « inchangé » est une mesure.
5. `max_tokens` **dérivé**, et **la formule appliquée aux entrées de 3a doit reproduire 400**.
6. `P = 68` **re-compté programmatiquement** avant d'écrire `200`.
7. La 4ᵉ surcharge ne casse **aucun bouchon** : `tsc` sur le lot 1 **seul**.
8. `@ts-expect-error` **rouge sur chaque couple (rôle, cible) illégal**.
9. **Mutants vus rouges** : « `Array.isArray(x) ? x[0] : x` » (le repêchage de KR-230 sous une autre forme) · « une clé en trop acceptée » · « `String(brut.intention)` au lieu du prédicat (3) ».
10. **Ligne 319 vue ROUGE avant édition.**
11. **Les neuf instruments à zéro diff** — constaté sur le diff, pas supposé.
12. `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `destinations` : **verts sans une retouche**.

## 6 — Critères d'acceptation

1. **Étant donné** le contexte assemblé pour `'personnage-plan'`, **quand** le test de confinement tourne, **alors** les neuf chemins ont la destination `'ia'`, `DEROGATIONS_AUDIENCE` est vide et assertée vide, le **préfixe `plan_actions[].action` est présent DANS L'ORDRE DU DOCUMENT et non tronqué**, et `synopsis_mj` est absent **du texte de ce rôle** tout en restant **présent dans celui de `personnage-prose`** — *contrat* — *lot 1*
2. **Étant donné** un personnage dont `but.libelle` n'est pas rédigé, **quand** l'auteur lance l'assistant, **alors** la demande est refusée `cible-a-ecrire` **sans qu'aucun appel réseau ne parte**, par un **prédicat nommé sur UN chemin**, et les trois motifs de refus sont **discriminés dans le même test** — *contrat* — *lot 1*
3. **Étant donné** `{"intention": ["a","b"]}` puis `{"intention": "   "}`, **quand** elles sont validées, **alors** la première est refusée `schema` **sans qu'aucun élément ne soit repêché** (mutant `[0]` vu rouge) et la seconde `vide`, chacune par **un prédicat distinct rougissant seul** — *contrat* — *lot 1*
4. **Étant donné** l'étape A du lot 1 (déplacement seul), **quand** elle est terminée, **alors** les **cinq** fichiers importateurs ont un **diff vide** (`git diff --numstat` sans ligne) et la porte est verte, **avant** que la première ligne du 4ᵉ rôle ne soit écrite — *contrat* — *lot 1*
5. **Étant donné** les quatre rôles, **quand** `frontiere.test.ts` tourne, **alors** aucun gabarit n'est sous-chaîne d'un autre, aucune invite ne contient le gabarit d'un autre rôle, la ligne 319 a été **vue rouge avant édition**, et les **neuf instruments nommés portent zéro diff** — *contrat* — *lot 1*
6. **Étant donné** `BUDGET_CARACTERES_CONTEXTE` à quatre entrées, **quand** le test de liaison tourne, **alors** le budget du rôle neuf est celui **mesuré** (jamais `0`, jamais recopié), `TAILLE_MAX_CORPS_IA` est **re-dérivé sur les quatre**, et la borne de l'invite est celle du validateur — *contrat* — *lot 1*
7. **Étant donné** un personnage portant déjà k étapes, **quand** l'auteur accepte N propositions successives, **alors** les `etape` de son plan valent `1…k+N`, **strictement croissants et sans doublon**, `etape` étant dérivé de la **liste vive dans la recette** ; l'écriture passe par `DossierService.update` dans l'ordre persistance-puis-événement, et `plan_actions[]` ne reçoit **que** `{ etape, action }` — *composant* — *lot 2*
8. **Étant donné** un personnage sans étape, **quand** l'auteur lance puis accepte, **alors** son `plan_actions[]` en porte une et le dossier reste accepté par `validateDossier` ; **et** étant donné une écriture refusée, **alors** rien n'est persisté et la proposition reste affichée — *bout-en-bout* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| `types › zero cle commune reseau / resolu` | `IntentionRendue` × `PropositionPlan` : intersection **vide**, épinglée par `@ts-expect-error` croisé | compile-time | KR-231 | 1 |
| `contexte › confinement du 4e role` | 9 chemins `'ia'` ; `DEROGATIONS_AUDIENCE` vide | jest | KR-232 | 1 |
| `contexte › le prefixe est injecte DANS L ORDRE, non tronque` | l'amendement, prouvé | jest | amendement | 1 |
| `contexte › synopsis_mj absent ici, PRESENT chez prose` | les **deux** côtés | jest | point de vue | 1 |
| `contexte › la cible n est PAS exclue ici, contrairement aux 3 autres roles` | garde de l'amendement | jest | KR-235 | 1 |
| `contexte › les trois refus, discrimines, 0 fetch` | 3 motifs distincts, `cible-a-ecrire` sur **un** chemin nommé | jest | KR-171 | 1 |
| `contexte › BUDGET du 4e role, mesuré` | `ceil(M×3/1000)×1000`, jamais `0` | jest | KR-235 | 1 |
| `schemaSortie › un TABLEAU est refuse schema, jamais repeche` | mutant `[0]` **vu rouge** | jest | **KR-230** | 1 |
| `schemaSortie › chaine vide apres trim refusee, motif vide` | prédicat (4) seul | jest | **vide** | 1 |
| `schemaSortie › une cle en trop est un refus` | prédicat (2) seul | jest | schema | 1 |
| `schemaSortie › marqueur a ecrire refuse, constante IMPORTÉE` | le test **importe** `MARQUEUR_A_ECRIRE` | jest | KR-223 | 1 |
| `schemaSortie › identifiant du dossier refuse` | `porteUnIdentifiant` réutilisée | jest | KR-117 | 1 |
| `CopiloteService › @ts-expect-error sur les couples illegaux` | non-assignabilité structurelle | compile-time | TL3a-5 | 1 |
| `CopiloteService › rejeu une fois puis terminal` | 2 appels jamais 3 — **deux tests séparés** | jest | KR-230 | 1 |
| `CopiloteService › deux lancers, deux corps identiques` | égalité stricte | jest | mémoire | 1 |
| `CopiloteService › temoin executable du 4e role` | **la QA a mesuré que `frontiere.test.ts` ne l'étend PAS** (3 `it` nommés, pas `.each`) — il s'écrit **ici** | jest | KR-235 | 1 |
| `frontiere › les 6 paires, forme fermee` | l. 319, **vue rouge avant édition** | jest | KR-236 | 1 |
| `worker/index › route du 4e role` | POST, 404, 503, 413, tout en JSON | jest (node) | KR-233 | 1 |
| `planActions › etape posee par le CODE, 1…k+N sans doublon` | **assertion de RÉSULTAT**, pas de formule | RTL | ordonnabilité | 2 |
| `… › plan_actions ne recoit QUE etape et action` | `Object.keys` = `['etape','action']` | RTL | KR-221 | 2 |
| `… › etapes deja ecrites GELEES au lancement` | régression BUG-097 | RTL | BUG-097 | 2 |
| `… › ecriture par update, ordre persistance puis evenement` | `invocationCallOrder` | RTL | KR-004 | 2 |
| `… › changer de personnage abandonne proposition et gel` | contrepartie du gel | RTL | BUG-108 | 2 |
| `… › apres decision le focus revient a Lancer, jamais desactive` | **une seule branche** | RTL | BUG-109 | 2 |
| `… › aucun numero sur la PROPOSITION` | l'écran ne pré-annonce pas un entier | RTL | § 3.4 | 2 |
| `… › double clic Lancer` / `Annuler pendant l appel` | 1 appel / ferme sans décision | RTL | — | 2 |
| `… › textes d etat deux a deux distincts` | discriminance | RTL | KR-197/199 | 2 |
| `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `cablage`, `repliques`, `acceptation`, `detenteurs` | **verts sans retouche** | non-régression | KR-187 | revue |

**Non vérifiable en l'état** *(à recopier dans la revue)* :
- **La RECOPIE VERBATIM d'une étape existante n'est refusée par AUCUN prédicat** — le prédicat de doublon est hors périmètre (§ 8, n° 12). Parades livrées : le bloc gelé (visuel) et la ligne d'invite (persuasive). **L'écran ne promet rien d'autre.**
- **La PARAPHRASE, la CONTRADICTION avec une étape existante, la REDITE du but** — aucun instrument (KR-229).
- **La DURÉE EN PROSE** (« au bout de trois jours ») : l'invite l'interdit, **aucun validateur ne la constate**. C'est le risque majeur du rôle, et il est nommé.
- **Le défaut préexistant `handleRetirerEtape`** (filtre sans renuméroter ⇒ `length+1` peut collisionner) — **hors périmètre, journalisé, non corrigé**.
- **Le remontage du panneau à la navigation** — dette ouverte depuis l'it2.

## 8 — Registre des désaccords

> Tout `REJETÉ` d'annexe est recopié ici (BUG-082).

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead (TL3b-1) | **Clé réseau `actions`** (narratif) | **VETO — RETENU, l'auteur a concédé** | Elle porte **le nom du champ que l'acceptation écrit** (`destinations.ts:205`) ; aucun des trois gabarits livrés ne nomme sa destination (`valeur`/`detenteurs`/`repliques` contre `fonction`/`savoirs[]`/`parler[]`), et **le § F de l'invite du narratif interdit lui-même** de réciter le nom d'un champ. **Retourné à son auteur par sa propre règle.** `intention` est en outre **le mot du dépôt** : `dossier/types.ts:362` glose déjà `action` par « l'intention du personnage à cette étape ». |
| 2 | tech-lead / QA | **Clé réseau `etapes`** | **REJETÉ** | À une lettre de `etape`, entier `moteur` que le modèle ne rend jamais. La QA a **retiré le mot, maintenu la structure**. |
| 3 | tech-lead (TL3b-3) / narratif | **`CiblePlan { personnageId }`** | **VETO — RETENU, non contesté** | Type **identique** à `CibleRepliques` : la surcharge l'accepte, l'implémentation la fait tomber dans `demanderRepliques` — rôle annoncé A, validateur exécuté B, **`tsc` vert**. Trouvé **indépendamment** par les deux postes à effort élevé. |
| 4 | tech-lead | **`PropositionPlan { personnageId, … }`** | **REJETÉ** | La proposition est **la cible plus le contenu** (invariant mesuré sur les trois rôles) ; renommer la clé d'identité oblige le service à traduire en recopiant, sans contrepartie. |
| 5 | narratif / tech-lead | **`PropositionPlan { personnageId, ajouts }`** | **REJETÉ** | Structurellement identique à `PropositionRepliques` : elle s'écrirait dans `caractere.parler[]` **sans erreur de compilation**. |
| 6 | narratif (adopté) | **Une sortie de LISTE bornée à un** (`{"intentions": […]}` + `MAX = 1`) | **REJETÉ — arbitrage de l'orchestrateur contre le tech-lead** | Une liste de un rend « deux » **représentable** et ne l'interdit que par une **constante** ; la forme **scalaire** le rend **non représentable** — *la meilleure garde est celle qui n'existe pas*. La réserve du tech-lead (« la forme liste permet de REFUSER au lieu de jeter », KR-230) est **satisfaite structurellement** par le prédicat (3), dont le mutant `[0]` est **à voir rouge** ; et son bénéfice (« relever MAX plus tard ne coûte aucun contrat ») est **spéculatif** — la raison de la borne à un est **structurelle**, la relever re-casserait l'argument de cohérence. Emporte : **une constante et deux prédicats en moins**. |
| 7 | UX (retirée par son auteure) | **Une seule étape par lancer** | **RETENU — et c'est une inversion à noter** | **L'UX l'a proposée au tour 1, puis RETIRÉE au tour 2** devant trois rôles qui convergeaient ; **le PM l'avait entre-temps ADOPTÉE**, et le tech-lead comme le narratif s'y sont ralliés au tour 2. Le fait décisif est du narratif, **contre sa propre position de tour 1** : trois étapes **contredisaient son propre amendement** — le préfixe injecté n'est vrai que pour la première, les 2ᵉ et 3ᵉ sont écrites contre une prémisse que l'auteur peut refuser. **Retenu sur l'argument, pas sur le compte des voix.** |
| 8 | narratif / tech-lead / PM / UX | **`si_bloque` proposable** | **REJETÉ, 4 rôles** | Non vide **sans `duree`**, il allume le constat `info` de `controles.ts:727` : **chaque acceptation fabriquerait l'avertissement que le copilote prétend épargner**. `duree` n'est proposable ni par le modèle (unité non décidée, n° 9) ni par le code (KR-221). **REPORTÉ** : proposable un jour **sur une étape EXISTANTE portant déjà une `duree` posée par l'auteur** — miroir exact de l'injection conditionnée par l'état de session. |
| 9 | narratif | **`si_bloque` AFFICHÉ en lecture seule sans jamais être écrit** | **REJETÉ** | Une proposition que l'auteur **ne peut pas accepter** est un mensonge d'écran, **et le premier mainteneur en câblera l'acceptation « puisqu'elle est là »** — le motif n° 8 s'applique alors avec un tour de retard. |
| 10 | narratif | **`declencheur_texte` proposable** | **REJETÉ** | Condition en prose désignant des entités **par nom libre**, dans une famille délibérément **calme** (`alerteSansExpr: false`) : rien ne signalerait jamais un dossier rempli de conditions non traduites. |
| 11 | narratif | **`declencheur_expr` proposable** | **REJETÉ** | Langage de conditions D1 : du code. |
| 12 | narratif (11ᵉ prédicat) | **Refus de la recopie verbatim d'une étape existante** | **REJETÉ pour 3b — arbitrage de l'orchestrateur** | Le veto de la QA (« non séparable ») **s'est dissous** : le narratif a fourni la signature séparable (`dejaEcrites: readonly string[]`, jamais la cible) **et** un cas négatif construit sur une valeur réelle de la fixture. **Ce qui tranche est ailleurs, et c'est le tech-lead** : le refus est **PAR LOT** ⇒ rejeu ⇒ **échec TERMINAL**, sur lequel l'auteur ne peut rien — alors que le défaut prévenu est un doublon **visible sous le bloc gelé**, rejeté **d'un clic**. **On échangerait un clic contre une impasse.** Aggravant décisif : `MotifIllisible` restant inchangée, l'écran rendrait `TEXTE_ILLISIBLE` — **un message FAUX sur ce qui s'est passé**. **REPORTÉ, condition d'ouverture écrite** : une recopie **COMPTÉE** (un run, pas une intuition) ⇒ `validerIntention(brut, dossier, dejaEcrites)` + motif `'doublon'` + son texte d'écran. |
| 13 | narratif / tech-lead | **Un prédicat de SIMILARITÉ** | **REJETÉ** | La frontière testable est la **FORME** (KR-229) — 3ᵉ refus, cf. désaccord n° 33 de 3a. |
| 14 | UX (retirée par son auteure) | **Un 4ᵉ composant `LigneEtape.tsx`** | **REJETÉ** | **Mesuré** : `LigneRepliqueProps` est déjà `{ texte, … }` **sans un membre propre aux répliques**, eyebrow rendu par la carte, props de plafond **optionnelles**. `si_bloque` sortant, `LigneEtape` serait `LigneReplique` **à l'identique** — 110 lignes dupliquées. **L'UX l'a retiré elle-même au tour 2.** |
| 15 | tech-lead (retiré par son auteur) | **Renommer `LigneReplique` → `LigneDecision`** | **REPORTÉ** | Son auteur l'a retiré **en s'appliquant sa propre règle** : le réemploi coûte **zéro diff**, le renommage ouvrirait **trois surfaces vertes** pour ne changer qu'un nom. **Condition d'ouverture** : un **troisième** consommateur, ou des props cessant d'être neutres. |
| 16 | narratif (parade amendée par son auteur) | **Monter `etape = rang+1` dans `brain/` + repointer `useEcriturePlan.ts`** | **VETO du tech-lead — RETENU ; l'auteur a lui-même REPORTÉ** | Trois faits mesurés : (a) elle met un fichier de `dossier-fiches` dans le lot contrat, **cassant la frontière de lots** ; (b) **la promotion n'achète aucune couverture** — `useEcriturePlan.ts:197` garantit déjà que `index + 1` **vaut** `length + 1`, les deux écrivains appliquent **déjà** la même règle ; (c) **elle ne corrige pas le défaut visé** — `handleRetirerEtape` filtre **sans renuméroter**, un `prochaineEtape()` partagé serait **vert par-dessus ce trou**. Et la raison de fond est du narratif : **on ne promeut pas une règle avant qu'elle soit juste** — la promouvoir maintenant **ferait RATIFIER un défaut préexistant**. **Condition d'ouverture** : la renumérotation à la suppression réparée. |
| 17 | narratif (remplacement retenu) | **Une assertion de RÉSULTAT au lieu d'une formule partagée** | **RETENU — lot 2, critère #7** | *Une formule recopiée ne se vérifie pas, un résultat si.* « Après N acceptations sur un plan de k étapes non amputées, les `etape` valent `1…k+N`, strictement croissants, sans doublon. » Elle vise l'invariant narratif — **un plan doit être ordonnable** — et **se repointera telle quelle** sur l'éditeur manuel le jour où il sera réparé. |
| 18 | tech-lead | **La sonde « aucun `etape:` littéral en production »** | **REJETÉ** | `etape:` est la **clé d'objet**, présente par nécessité chez les deux écrivains : la sonde **rougirait toujours**. |
| 19 | tech-lead (retirée) | **`frontiere.test.ts` reste HORS de tout lot** | **RETIRÉE PAR SON AUTEUR devant la mesure** | La QA a **monté un 4ᵉ rôle réel et exécuté jest** : 28/29 s'étendent seuls, **un seul littéral** (l. 319). Le témoin devient **plus fort** : le diff est **exactement** la liste du § 4.5, et **neuf instruments nommés portent zéro diff**. |
| 20 | narratif | **`frontiere.test.ts:608-621` rougirait sur un budget à 6 000** | **REJETÉ — fausse alerte, vérifiée par l'orchestrateur** | Ce test n'exige **pas** des budgets deux à deux distincts : **c'est l'assertion que 3a a supprimée**, et le commentaire des l. 610-616 le dit en toutes lettres. Il exige que **le MAXIMUM soit atteint par un seul rôle** — or le maximum est `indice-detenteurs` à **17 000**. **Ne pas « corriger » ce test.** |
| 21 | tech-lead | **Le piège conditionnel `frontiere.test.ts:638-640`** | **RETENU — vérifié réel** | Si deux budgets sont **déjà naturellement égaux**, la fabrication « deux étroits égaux » est **inerte** : le test reste **VERT en cessant de mesurer**. À traiter **dans le lot**, une fois la mesure connue. |
| 22 | tech-lead | **Garder le prédicat « éléments distincts »** | **REJETÉ (sans objet)** | Inatteignable dès que la sortie n'est plus une liste — un prédicat mort est la famille `'rang-inconnu'`/BUG-084/KR-235. **La sortie scalaire le supprime avec la liste.** |
| 23 | narratif | **Recopier `max_tokens: 400` de 3a** | **REJETÉ** | Mesure différente (un élément, enveloppe **17**) ⇒ **200**. **Son auteur a retiré son propre 400 de tour 1** : il était dérivé sous une liste de trois. |
| 24 | narratif / tech-lead | **Recopier le budget de `personnage-repliques`** | **REJETÉ** | Il se **MESURE**, neuf chemins assertés non vides d'abord — sinon c'est un **plancher**. Desserrer la garde d'un rôle par la mesure d'un autre est le désaccord n° 35 de 3a. |
| 25 | tech-lead | **Un plafond de document sur `plan_actions[]`** | **REJETÉ** | Aucune règle de ce genre n'est arbitrée ; l'inventer par symétrie avec `PARLER_REPLIQUES` la **déciderait en passant**. **Conséquence retenue** : aucune logique de plafond à l'écran, et **zéro cas de la famille BUG-109 à instrumenter**. |
| 26 | tech-lead | **Scinder les registres par rôle** | **REJETÉ** | Leur totalité `Record<RoleCopilote, …>` **EST le garde** (« un rôle sans entrée ne compile pas ») et le support de KR-232 ; la scinder la remplacerait par une **convention**. |
| 27 | tech-lead | **Un lot de scission séparé du lot du 4ᵉ rôle** | **REJETÉ** | Les deux nommeraient `contexte/registres.ts` et `contexte/index.ts` — **propriété non exclusive**. La séparation s'obtient **dans le temps** (étape A prouvée par un **diff vide** avant l'étape B), pas par un lot de plus. |
| 28 | tech-lead | **Déplacer `INVITES`/`GABARIT_SORTIE` hors de `worker/index.ts`** | **REJETÉ** | `frontiere.test.ts` balaie **cette source** par une expression ancrée, **déjà réparée à 3a** : déplacer la chose mesurée et ré-ancrer la mesure **dans le lot qui ajoute un rôle** est la manière exacte dont un garde devient **inerte en restant vert**. |
| 29 | tech-lead | **Scinder `CopiloteService.ts` en 3b** | **REJETÉ** | Les quatre corps privés **ne sont pas quatre copies** ; les paramétrer recréerait le « corps commun paramétré par le rôle » que `contexte.ts` refuse. **Condition d'ouverture : la CINQUIÈME branche.** |
| 30 | tech-lead | **Un `Record<RoleCopilote, …>` générique pour schémas et bornes** | **REJETÉ, 4ᵉ fois** | Le critère de TL3a-6 tient : le rôle prose n'a pas de liste, **son entrée serait un mensonge**. |
| 31 | narratif | **`CiblePlan { personnageId, plan: true }`** | **REJETÉ** | Convention **mixte**, pire que l'un ou l'autre choix pur, et **demi-pas** vers l'union étiquetée que 3c doit faire en entier. |
| 32 | tech-lead / narratif | **Union étiquetée des cibles / renommer `CibleCopilote`** | **REPORTÉ** | Condition non échue : 3b ne touche pas `useDemandeCopilote.ts`. **C'est le TROISIÈME synonyme (3c) qui déclenche la bascule**, dans son propre lot contrat. |
| 33 | narratif | **`savoirs[]` / contenu d'indice au contexte** | **REPORTÉ** | Ce que le personnage sait rend son plan juste, mais c'est la **recomposition par rang** de la n° 12. |
| 34 | narratif | **Élargir le prédicat de doublon à `but.libelle`** | **REJETÉ** | Une **première étape restreint légitimement le but** : l'y inclure produirait des refus **faux**. |
| 35 | UX | **Recopier verbatim « INTENTION » / « SI LE JOUEUR BLOQUE »** depuis `BlocPlanActions.tsx` | **REJETÉ — et le risque est SUPPRIMÉ, pas documenté** | L'UX avait signalé elle-même « une chaîne, deux domiciles », invisible à `libelles.test.ts`. **Sa parade du tour 2 est meilleure que l'aveu** : **aucun nom de champ n'est écrit à l'écran**, seulement un eyebrow positionnel. **Le risque disparaît par construction.** |
| 36 | UX (alerte réalisée) | **`MENTION_RELANCE_SANS_MEMOIRE_PLAN`** | **REJETÉ — le NOM mentait autant que le texte** | Elle avait **prévu au tour 1** que ce texte deviendrait faux si les étapes existantes étaient injectées ; les deux postes à effort élevé l'ont ensuite tranché. **Elle a renommé la constante, pas seulement réécrit la phrase** — un identifiant qui ment survit aux relectures mieux qu'une phrase. ⚠ **Sa formulation de tour 2 promettait un refus automatique** : elle est **corrigée ici** (§ 3.4), le prédicat de doublon étant hors périmètre. |
| 37 | narratif | **Un numéro d'étape affiché sur la PROPOSITION** | **REJETÉ** | Il serait calculé sur la liste **gelée** quand l'écriture le calcule sur la liste **vive** : **l'écran annoncerait un entier que le code n'a pas encore décidé.** |
| 38 | PM | **Ne pas corriger le défaut préexistant `handleRetirerEtape`** | **RETENU, sous condition** | Hors périmètre — il **préexiste**, 3b ne change pas la règle. **Condition posée par le PM et retenue : journalisé dans `bug_history.json` DANS CE LOT**, `minor`, feature `dossier-fiches`, `discovered_at: "iteration-3b"`. Ce qu'il faut écrire : 3b **lui ouvre un second chemin d'atteinte**, elle ne le crée pas. |
| 39 | PM / tech-lead / QA | **La clause « sous-entités structurées, plusieurs champs » du `goal`** | **REJETÉE — `goal` réécrit** | **Fausse** : le modèle n'atteint **qu'un** champ sur six. Ce qui est neuf : **l'unité acceptée est une sous-entité que le CODE construit**. Sans réécriture, **un ouvrier livrera les six champs « parce que c'est écrit »**. |
| 40 | PM | **Rouvrir l'ordre 3b / 3c** | **REFUSÉ PAR SON AUTEUR** | Déjà tranché en `resolved_decisions [it3a]` ; **aucun fait nouveau ne le justifie**. Personne ne l'a contesté. |

## 9 — Innovation

*Aucune.* Le budget d'une proposition hors-cadre n'est pas consommé — les quatre décisions structurantes (4ᵉ cible disjointe, sortie scalaire, amendement d'injection, `etape` posé sur la liste vive) s'appuient toutes sur un précédent déjà livré ou sur une mesure.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **non dû** *(aucun des quatre fichiers mutés n'est dans un lot ; à constater sur le diff, pas de mémoire)*
- [ ] Les **douze mesures du § 5.1** exécutées et rapportées, **aucune déduite**
- [ ] **VU ROUGE avant d'être cru** : la ligne 319 **avant** édition · le mutant `[0]` du prédicat (3) · chaque cas négatif des six prédicats · 405/404/413/503 du rôle neuf · l'assertion « neuf chemins non vides » **avant** la mesure du budget
- [ ] **Diff VIDE** sur les cinq fichiers de l'étape A — `git diff --numstat` sans ligne, **la porte verte ne suffit pas**
- [ ] **Les neuf instruments de `frontiere.test.ts` à zéro diff**, constaté sur le diff
- [ ] Critères du § 6 cochés un par un
- [ ] Non-régression : `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `cablage`, `repliques`, `acceptation`, `detenteurs` **verts sans une retouche**
- [ ] Aucun fichier touché hors de la liste de son lot *(`specification.json` et `bug_history.json` exceptés — écrits par l'orchestrateur à l'étape 4)*
- [ ] **Heuristiques de revue** : KR-013/113 (état dérivé) et KR-112 (400 lignes)
- [ ] **Relevé du budget de contexte ÉCRIT**, et **les deux compactions dues DANS CE LOT** : `code-knowledge.json` (~72 o de marge — 3b **ne peut pas ajouter un KR** sans compacter d'abord, or elle en produira au moins un) et `specification.json` de la feature (~392 o pour une entrée de ~4 900)
- [ ] `bug_history.json` : le défaut `handleRetirerEtape` journalisé
- [ ] Dossier de revue : `.claude/raffinage/dossier-copilote-it3b.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | `goal` réécrit à un champ ✔ · un lancer = une étape ✔ · `si_bloque` hors 3b ✔ · bug journalisé ce lot ✔ |
| Tech Lead | recevable sous réserve | contrat figé avant la 1ʳᵉ ligne de lot 2 ✔ · `frontiere` entre au lot 1 ✔ · découpage à 2 lots ✔ |
| UX | recevable sous réserve | `si_bloque` hors écran ✔ · réemploi de `LigneReplique` ✔ · textes du § 3.4 ✔ · aucun nom de champ à l'écran ✔ |
| QA | recevable sous réserve | nom du champ tranché ✔ · signature du validateur réglée (prédicat écarté) ✔ · ligne 319 inscrite comme **édition attendue** ✔ · diff vide exigé à l'étape A ✔ |
| Narratif & IA | recevable sous réserve | clé `intention` concédée ✔ · sortie scalaire ✔ · amendement d'injection au registre ✔ · invite au § 4 bis ✔ · promotion `etape` reportée ✔ |
