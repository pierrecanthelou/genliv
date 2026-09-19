# Plan d'itération — `dossier-copilote` · itération `3c`

> Statut : **`validé`** — porte 1 (mécanique) franchie le 2026-09-18, **porte 2 (humaine) franchie le 2026-09-19**. Exécutable par `/essaim`.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-18
> Composition : **5 rôles** — motif : contrat de sortie IA, invite worker, audiences du dossier.
> Exécution : **séquentielle** (2 lots) — aucun essaim, aucun worktree, aucune fusion.
> Tours : 2. **Les deux postes à effort élevé ont ÉCHANGÉ LEURS POSITIONS entre les tours** (le tech-lead a retiré sa liste, le narratif sa scalaire) — **l'arbitrage tranche sur l'argument, jamais sur le mouvement** (précédent it2).

## Fiche de validation *(à lire en deux minutes)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut **faire compléter les relations d'un personnage**. » |
| **Tranche** | 6ᵉ carte → `demander(dossier, { role:'personnage-relations', personnageId }, signal)` → contexte à **deux ensembles** (porteur `FICHE` ⊃ candidats `P1…PN`) → route worker → sortie `{"rapports":[{"envers","nature"}]}`, **12 prédicats** → acceptation ligne par ligne → `relations[]` reçoit `{ cible_id, lien, intensite }` → `update` → `dossier:updated` |
| **Lots** | 2 séquentiels · dont `contrat` : **oui** (lot 1, seul et en premier, **union étiquetée des 5 cibles incluse**) |
| **Hors périmètre** | `intensite` proposée · `secret` (proposé, dérivé, **ou exercé**) · l'injection de `relations[]` · la re-projection d'appellation (**propriété n° 10**) · l'auto-référence **proposable** · la scission de `CopiloteService.ts` · un scanner de noms propres · la correction du trou « porteur disparu » **dans les cartes 3 et 5** |
| **Reporté** | scission `demandes/**` (→ 6ᵉ rôle **ou** 600 l.) · `secret` exercé (→ n° 10) · appellation re-projetée (→ n° 10) · auto-référence proposable (→ quand le nom sera re-projetable) · suffixe « (envers lui-même) » (→ s'il trouve un producteur côté fiche) |

> ⚠ **Le `goal` de la spec dit « le premier rôle MÊLANT le rang de l'it2 et la sous-entité de 3b ».** C'est **exact**, et c'est ce qui rend l'itération dure : le modèle rend **à la fois** un jeton de désignation **et** de la prose. **Aucun rôle livré ne fait les deux.**

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur peut faire compléter les relations d'un personnage.**

Le copilote propose **jusqu'à trois** relations — pour chacune, **un autre personnage désigné par RANG** et **la nature du lien en prose** —, l'auteur les accepte ou les refuse **une par une**, et chaque acceptation ajoute `{ cible_id, lien, intensite }` à `monde.personnages[].relations[]`.

**Ce qui est neuf** : c'est le **premier rôle mixte** — un **jeton** (mécanisme de l'it2) **et** de la **prose** (mécanisme de 3a/3b) dans le même élément. Il en découle un contexte à **deux ensembles**, un validateur à **douze** prédicats, et une **règle de tranchage** que le comité a dû écrire (§ 4 bis).

## 2 — Hors périmètre

`Relation` porte **quatre** champs ; **un seul est `'ia'`** :

| champ | requis | audience | 3c |
|---|---|---|---|
| `lien` | **oui** | **`ia`** | **RÉDIGÉ par le modèle** — seul champ qui traverse |
| `cible_id` | **oui** | `moteur` | **DÉSIGNÉ par RANG**, re-résolu par `Map.get` — le modèle ne frappe jamais un identifiant |
| `intensite` | **oui** | `moteur` | **POSÉ par le code** (`INTENSITE_INITIALE`) — **non proposable** |
| `secret` | non | `moteur` | **OMIS** — optionnel ⇒ **on ne sème pas** (KR-221) |

⚠ **La symétrie EST le cœur de l'arbitrage** : `intensite` **écrit parce que REQUIS**, `secret` **omis parce qu'OPTIONNEL**. Mesuré : le document persisté par l'éditeur manuel vaut `{cible_id, lien, intensite: 0}`, **`secret` absent**.

**Également hors périmètre** : l'**injection de `relations[]`** · la **re-projection d'appellation** (n° 10) · **`secret` exercé** · l'**auto-référence proposable** · la **scission de `CopiloteService.ts`** · un **scanner de noms propres** · la **correction du trou « porteur disparu » dans `CarteFaireParler` et `CarteCompleterPlan`** (préexistant, journalisé, non corrigé).

## 3 — Contrat de design

### 3.1 Jetons — **zéro neuf**, les 11 déjà consommés par `styles.ts`
`--space-3/4` · `--font-ui`/`--font-mono` · `--fs-body`/`--fs-eyebrow` · `--track-eyebrow` · `--text-body`/`--text-muted`/`--text-label` · `--border-field` · `--r-md` · `--surface-inset` · `--hit-target`.

### 3.2 `CarteCompleterRelations` — **sixième carte**, 5ᵉ active
**Nom arbitré** : `CarteCompleterRelations` + `LigneRelation`. ⚠ **`CarteTisserLiens`/`LigneLien` sont REJETÉS** — « tisser » est **déjà le geste de la carte 2** (indices), qui **désigne sans porter de prose** ; et `LigneLien` introduirait un **troisième mot** (relation / lien) pour un champ que le schéma nomme `relations[]`. **Le tech-lead a cédé entièrement.**

Ordre : `Select` PERSONNAGE → bloc **DÉJÀ ÉCRIT** (gelé au clic Lancer, **par copie de valeurs**) → `BarreLancer` → mention permanente → refus/échec (`⊘`) → **jusqu'à 3** `LigneRelation`, chacune précédée de `eyebrowRelationProposee(n)` **rendu par la CARTE** → `MENTION_RELATION_CREEE`, **une fois par carte**, sous la dernière ligne.

⚠ **La résolution du NOM de la cible se fait AU RENDU** (`dossier.monde.personnages.find`), **jamais dans `brain/`, jamais envoyée au réseau**. **Ce n'est PAS le problème d'injection de la n° 10** : rien n'empêche l'écran de l'auteur de lire un champ d'audience `auteur`. Repli `TEXTE_CIBLE_INTROUVABLE` si `find` échoue — **KR-021 : exposé, jamais filtré**, la ligne s'affiche quand même.

### 3.3 `LigneRelation` — **SŒUR** de `LigneDetenteur` et `LigneReplique`, jamais une variante
```ts
export interface LigneRelationProps {
	/** localiserEntite('pnj', cibleId, index) — calculée par la CARTE. JAMAIS un rang à l'écran. */
	designation: string
	/** LienResolu.lien, rendu TEL QUEL — aucun Field, aucun chemin. */
	lien: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
export interface LigneRelationHandle { focusAccepter: () => void }
```
Rendu : eyebrow `ENVERS` → `designationDetenteurStyle` (**jeton de `LigneDetenteur`**) → `blocLectureRepliqueStyle` (**bloc de `LigneReplique`**, `pre-wrap`) → actions identiques aux deux sœurs. « Ouvrir la fiche » ouvre **le PORTEUR**.

**REJETÉ — étendre `LigneDetenteur` d'un `lien?` ou `LigneReplique` d'un `designation?`** : sœur, jamais variante — et `LigneReplique` est **réemployée telle quelle par deux cartes précisément parce qu'elle ne porte aucun membre propre à un consommateur**.

⚠ **GLYPHE : `×`, PAS `✕`.** Une « correction » du tour 2 proposait `✕`. **Vérifiée fausse par l'orchestrateur** : les **trois** composants de ligne livrés (`LigneDetenteur:53`, `LigneProposition:91`, `LigneReplique`) utilisent `×`, et leurs docstrings le nomment. `✕` existe ailleurs (`Modal.tsx`, `ImageUpload.tsx`) **pour un geste différent — fermer un conteneur, pas rejeter une proposition**. L'appliquer créerait une 4ᵉ ligne **incohérente avec les trois autres**.

### 3.4 Textes exacts — `textes.ts`
```ts
export const CARD6_TITRE = 'Compléter les relations'
export const CARD6_CORPS =
	"Propose un autre personnage de ce dossier que celui-ci connaît, et la nature de ce qui les lie."
export const EYEBROW_ENVERS = 'ENVERS'
export function eyebrowRelationProposee(n: number): string { return `RELATION PROPOSÉE ${n}` }
export const MENTION_AUCUNE_RELATION =
	"Ce personnage n'a encore aucune relation connue — la première proposée s'ajoute."
export const MENTION_AUCUNE_RELATION_AU_LANCER =
	"Ce personnage n'avait aucune relation connue au lancement de cet assistant."
export const MENTION_RELATION_CREEE =
	"Comme une relation ajoutée à la main, celle-ci est enregistrée avec une intensité neutre — à régler ensuite dans la fiche (Personnages → Relations)."
export const TEXTE_CIBLE_INTROUVABLE = 'Personnage introuvable — référence rompue.'
export const TEXTE_PORTEUR_DISPARU =
	"Ce personnage a été retiré du dossier depuis le lancement — relancez l'assistant."
export const TEXTE_REFUS_CIBLE_A_ECRIRE_RELATIONS =
	"Ce personnage n'a encore aucune fiche écrite — complétez-la d'abord, dans Personnages."
export const TEXTE_REFUS_AUCUN_CANDIDAT_RELATIONS =
	"Ce dossier n'a pas d'autre personnage à lui lier — tous sont déjà liés, ou il est seul."
export const TEXTE_REFUS_TROP_LONG_RELATIONS =
	"Le contexte est trop long pour proposer des relations — raccourcissez d'abord les fiches de ce dossier."
```
⚠ **`MENTION_RELATION_CREEE` dit la PARITÉ, pas l'exception.** La formulation du tour 1 (« non réglée **par le copilote** ») suggérait une carence propre à cette carte ; **mesuré**, le chemin d'écriture pose **déjà** `0` à la main. **Son auteure l'a réécrite d'elle-même.**
⚠ **AUCUNE mention sur l'auto-référence non proposée** : `CARD6_CORPS` porte déjà « un **autre** personnage », et l'écrire ouvrirait **une liste non bornée de ce qui n'est pas proposé** — **une mention d'honnêteté, pas deux**.
⚠ **AUCUNE promesse** sur les deux modes non gardés (§ 7).
**`LIBELLE_DES_CHAMPS` reste à QUATRE entrées**, et **le composant neuf ne porte aucun `label="…"`** — **4ᵉ occurrence du corollaire TL3a-3**.

### 3.5 Gel, focus
Gel **par copie de valeurs** au clic Lancer (`relations[]` n'a pas d'id propre — même geste que 3b, **jamais une référence**). **Aucun plafond de document** sur `relations[]` ⇒ **pas de prop `accepterDesactive`** ; la borne à 3 contraint **la proposition**, pas le document.
⚠ **Focus post-décision** : ligne suivante **non décidée**, sinon `Lancer`. **Jamais une cible que ce même rendu désactive** (BUG-109).

## 4 — Contrats `brain/`

### 4.1 L'UNION ÉTIQUETÉE — **les cinq cibles, et le paramètre `role` DISPARAÎT**
```ts
export interface CibleCopilote  { role: 'personnage-prose';     entiteId: string; champ: ChampProseChemin }
export interface CibleIndice    { role: 'indice-detenteurs';    indiceId: string }
export interface CibleRepliques { role: 'personnage-repliques'; personnageId: string }
export interface CiblePlan      { role: 'personnage-plan';      acteurId: string }
export interface CibleRelations { role: 'personnage-relations'; personnageId: string }

demander(dossier: Dossier, cible: CibleRelations, signal?: AbortSignal): Promise<ReponseRelations>  // ×5
// impl. : switch (cible.role) { … default: { const _exhaustif: never = cible; return _exhaustif } }
```
**Motif — VETO, MESURÉ** : `CopiloteService.ts:490-492` **retombe sur `demanderRepliques` PAR DÉFAUT**, et `CibleRepliques`/`CibleRelations` seraient **structurellement identiques** ⇒ rôle annoncé A, validateur exécuté B, **`tsc` vert**. C'est le signal que **le plan de 3b a daté ici**.
**Gains** : (1) `(rôle, cible)` **cesse d'être deux porteurs**, donc **cesse de pouvoir diverger par construction** ; (2) `switch` + garde `never` ⇒ **un 6ᵉ rôle sans branche ne compile pas**, là où les gardes actuelles sont **explicites par convention, sans preuve d'exhaustivité** ; (3) `_role` inutilisé disparaît.
⚠ **Risque NEUF créé, et sa parade** : `cible.role` porte **le même nom** que `CorpsDemande.role`. Un `{ ...cible, contexte }` mettrait `personnageId` **sur le fil** (KR-231). **Parade : chaque corps écrit son littéral, plus un témoin qui asserte le corps par `toEqual`, JAMAIS par inclusion** (critère #5).
**`acteurId` n'est PAS renommé** : le tag rend le synonyme **inoffensif**, et le renommage tirerait `planActions.test.tsx` dans le lot contrat. **Une dette fermée par conception n'est plus une dette.**

### 4.2 Formes, validateur
```ts
export const CLES_SORTIE_RELATIONS = ['rapports'] as const
export const RELATIONS_PROPOSEES_MAX = 3
GABARIT_SORTIE['personnage-relations'] = '{"rapports": [{"envers": "P1", "nature": "…"}, {"envers": "P3", "nature": "…"}]}'

export interface RapportRendu { envers: RangInjecte; nature: string }            // RÉSEAU
export interface RapportsRendus { rapports: readonly RapportRendu[] }
export interface LienResolu { cibleId: string; lien: string }                    // RE-RÉSOLU
export interface PropositionRelations { personnageId: string; ajouts: readonly LienResolu[] }
// KR-231 AUX DEUX NIVEAUX : {rapports}∩{personnageId,ajouts}=∅ · {envers,nature}∩{cibleId,lien}=∅

export function validerRelations(brut: unknown, rangsConnus: ReadonlySet<RangInjecte>, dossier: Dossier):
	{ ok: true; sortie: RapportsRendus } | { ok: false; motif: MotifIllisible }
export function assemblerRelations(dossier: Dossier, cible: CibleRelations): ContexteDetenteurs  // SANS alias
export const INTENSITE_INITIALE = 0   // le point NEUTRE, jamais le plancher (INTENSITE_MIN = -3)
```
⚠ **`rapports`, PAS `liens`** : `liens` est **le pluriel exact du champ `lien`** — c'est **nommer le champ** (veto 3b), et la confusion **à une lettre** que KR-231 a fermée. **Les quatre clés livrées diffèrent toutes de leur champ.** Un **quasi-synonyme** est légitime ; **le mot du champ, non.**
⚠ **`envers`, pas `vers`** : **le mot que l'écran rend déjà** (`EYEBROW_ENVERS`) — *un mot, une notion, des deux côtés de la frontière* — et c'est la **préposition du sentiment dirigé**.
⚠ **Le gabarit montre `P1` puis `P3`** : les rangs sont des **adresses**, pas un ordre à parcourir.

**LES DOUZE PRÉDICATS, chacun prouvable seul** :
(1) objet simple `schema` · (2) clés **exactement** `CLES_SORTIE_RELATIONS` `schema` · (3) `Array.isArray` `schema` · (4) **chaque élément objet simple, clés exactement `['envers','nature']`** `schema` · (5) les deux sont des **CHAÎNES** — *un tableau meurt ici, **jamais `[0]`, jamais `String(…)`*** `schema` · (6) ≤ `RELATIONS_PROPOSEES_MAX`, **refus jamais troncature** (KR-230) `schema` · **(7) longueur ≥ 1** `vide` · (8) chaque `nature` non vide après `trim()` `vide` · (9) **`envers` distincts** `schema` — *jamais `nature` : **deux frères portent légitimement le même lien*** · (10) aucun `MARQUEUR_A_ECRIRE`, constante **IMPORTÉE** `marqueur` · (11) `porteUnIdentifiant(nature)` **par élément, jamais un `join`** `identifiant` · (12) `rangsConnus.has(envers)` `rang-inconnu`.

⚠ **`envers` n'est JAMAIS passé au scanner d'identifiants** — le jeton est **l'une de nos propres chaînes** ; l'y passer serait **du code mort présenté comme de la couverture** (BUG-084, KR-235). **Veto des deux postes à effort élevé, écrit pour que personne ne « symétrise ».**
⚠ **PREMIER validateur dont le type de retour nomme `MotifIllisible` EN ENTIER, et les CINQ motifs sont atteignables** — **c'est la preuve d'« aucun prédicat mort », pas une affirmation.**
**Refus du LOT ENTIER** : accepter `envers` en jetant `nature` ferait **ratifier une relation à moitié inventée par le code**.

### 4.3 Contexte — **DEUX ENSEMBLES, UNE UNION** (veto, ratifié)

⚠ **LE VETO, SOUS FORME DÉCIDABLE** : *une seule liste plate parcourue avec **le même filtre de préfixe** pour le porteur et pour les candidats.*
**MESURÉ** : `detenteurs.ts:84` filtre la cible sur `PREFIXE_INDICE`, `:111` les candidats sur `PREFIXE_PERSONNAGE` — **séparés gratuitement par le préfixe**. **Ici les deux sont `monde.personnages[]`** ⇒ une liste plate donnerait aux **huit candidats exactement les lignes du porteur**, dont le `but.pourquoi` de huit inconnus. **Et aucun test actuel ne rougirait.**

**UNION (8 chemins, tous `'ia'`)** — c'est elle seule que voit le confinement KR-232 :
`canon.ton` · `canon.interdits_ton[]` · `canon.partage.accroche_joueur` · `monde.personnages[].fonction` · `.description_joueur` · `.but.libelle` · `.but.pourquoi` · `.plan_actions[].action`

**`CHEMINS_CANDIDAT` (4)**, const **local** à `contexte/relations.ts` : `fonction`, `description_joueur`, `but.libelle`, `plan_actions[].action`.
⚠ **LISTE POSITIVE LITTÉRALE, JAMAIS une soustraction** : un `filter(c => c !== 'but.pourquoi')` **reste vert et RÉ-ÉLARGIT TOUT SEUL** au 9ᵉ chemin (famille KR-235).
⚠ **DEUX TESTS, PAS UN** : l'**inclusion** dans l'union (rouge si l'union rétrécit) **et** le **canari d'absence** de `but.pourquoi` (rouge si quelqu'un « harmonise »). **Le second ne se déduit pas du premier.**
⚠ **ET LE TÉMOIN QUI COMPTE N'EST PAS SUR LES LISTES, IL EST SUR LE TEXTE ASSEMBLÉ** : un candidat au `but.pourquoi` **non vide et distinct** ⇒ le texte contient celui **du porteur**, **jamais** celui du candidat. **Une assertion sur les listes seules resterait verte sur une boucle qui ignore la liste.**

**Retraits motivés** : `but.pourquoi` **chez les candidats** (*le pourquoi privé de huit inconnus pour une valeur discriminante quasi nulle — **c'est cette ligne qui justifie la scission***) · `synopsis_mj` (**point de vue**, motif 3b) · **`caractere.jamais`** (⚠ **motif NEUF** : *`jamais` borne un **comportement** ; un lien est **éprouvé, pas agi** — l'injecter invite à écrire le lien comme une action que le personnage refuserait*) · `apparence` · `caractere.parler[]` · `cede_si` · `curseurs.*` · **`relations[]`** · `presence[]`, `savoirs[]`, `stats`, `camp`, `portee`, `nom`.

**Troncature** : `plan_actions[].action` au **premier** élément **chez les candidats seulement** ; **non tronqué chez le porteur**. **Aucune chaîne n'est jamais coupée.**
**Mise en page** : porteur → **`FICHE`** · candidats → `P1`…`PN`. ⚠ **JAMAIS `PERSONNAGE`** : un en-tête commençant par `P` **entre en collision avec l'alphabet des rangs** ⇒ `rang-inconnu` ⇒ rejeu ⇒ terminal.

**SÉLECTION — déterministe, sans modèle** :
1. ⚠ **EXCLURE LE PORTEUR** — **veto**. Le motif technique (« il paraîtrait deux fois ») est **vrai mais INSUFFISANT** : **mesuré**, l'invariant `entitesInjectees === [cible.id, ...rangs.values()]` (`contexte.test.ts:543`) **reste satisfait avec le doublon, aucun instrument ne rougirait**. **Ce qui décide** : `nom` n'est **jamais injecté** (KR-195) ⇒ **rien ne dit au modèle que les deux blocs sont la même personne** ⇒ il écrirait « il se méfie de lui » **en croyant qu'ils sont deux**. **Ce n'est pas un doublon, c'est une FICTION FAUSSE**, invisible au validateur (`P3 ∈ rangs` ⇒ vert) **comme à l'écran**.
2. **Exclure toute cible déjà liée** — `detientDeja` **recopié** de `detenteurs.ts:96`, **pas un `some` maison**. **Un doublon cesse d'être REPRÉSENTABLE.**
3. `portee === 'premier'` d'abord, puis l'ordre du document — **`portee` SÉLECTIONNE, jamais injectée**.
4. Tronquer à `CANDIDATS_MAX` (**réutilisée telle quelle**, pas dupliquée — ⚠ *sa mesure vaut désormais pour **deux** rôles*).
5. ⚠ **Pas une ligne, pas de rang** — *un bloc vide **enseignerait** « celui-là n'a rien », ce qui est une **affirmation** ; le repli est le silence.*
6. `P1`,`P2`,… **aucune conversion numérique**, `Map.get` sur la chaîne.

**Symétrie à écrire une fois** : « pas une ligne, pas de jeu » sert **deux fois** — chez un **candidat** elle coûte son rang, chez le **porteur** elle est le refus `cible-a-ecrire`.

**REFUS DE CONTEXTE — ordre figé, tous AVANT le moindre `fetch`** :
`a-ecrire` (`canon.ton`) → **`cible-a-ecrire`** (**disjonction** sur les 4 chemins du porteur, patron répliques — *un lien peut naître d'une fonction, d'une réputation **ou** d'un but*) → **`aucun-candidat`** (table vide) → `trop-long` (**refus, jamais coupure**).
⚠ **PREMIER RÔLE À UTILISER LES QUATRE MOTIFS. Aucun motif neuf, aucune charge neuve.**

### 4.4 `INTENSITE_INITIALE` — et les **DEUX** sites à repointer
`export const INTENSITE_INITIALE = 0` dans `src/brain/dossier/types.ts`, ré-exporté par `brain/index.ts`.
**4ᵉ instance d'une doctrine écrite** (`STATS_INITIALES`, `CONFIANCE_INITIALE_PORTE`, `CURSEURS_INITIAUX`). **Un `0` en dur au site d'écriture est KR-165.**
⚠ **DEUX sites littéraux dans `useEcritureRelationsPresence.ts` : l. 44 ET l. 137.** *Le tour 1 n'en citait qu'un ; son auteur a corrigé sa propre note.* **Repointer un seul laisserait la divergence que la constante existe pour fermer.**

⚠ **`src/brain/dossier/**` entrait au lot 1 — ce qui rompt le témoin « zéro diff » de 3b.** Arbitrage : ce témoin était **un constat de non-débordement d'un lot, pas un invariant permanent** — rien à 3b n'introduisait de graine partagée. **TÉMOIN DE REMPLACEMENT, plus fin, à livrer comme critère** :
> `DOSSIER_SCHEMA` **inchangé** · **zéro diff** sur `destinations.ts`, `tables.ts`, `validate.ts`, `couverture.test.ts` · le diff de `dossier/types.ts` est **PUREMENT ADDITIF** (une constante + sa docstring) — **aucun champ, aucune règle de validation, aucune entrée d'audience**.

## 4 bis — Contrat de sortie IA

### LA RÈGLE DE TRANCHAGE — DÉSIGNATION vs RÉDACTION, cas MIXTE
> Un rôle qui rend **à la fois** un jeton et de la prose se range selon **ce que l'acceptation d'un élément ÉCRIT AU DOSSIER** :
> — l'élément porte une **prose RÉDIGÉE PAR LE MODÈLE** ⇒ **RÉDACTION** ⇒ liste vide = **REFUS `vide`** ;
> — l'élément ne porte que des **handles re-résolus** et des **valeurs posées par le code** ⇒ **DÉSIGNATION** ⇒ liste vide = **SUCCÈS**.
>
> ⚠ **Le critère porte sur « RÉDIGÉE PAR LE MODÈLE », PAS sur l'audience `'ia'`** — et c'est **le seul endroit où il peut être mal appliqué** : `savoirs[].certitude` **EST `'ia'`** alors que le rôle détenteurs, qui l'écrit, est une **désignation** (le code la pose). **Un critère écrit « champ `ia` » classerait détenteurs en rédaction et CONTREDIRAIT UN RÔLE LIVRÉ.**
>
> **Vérifié sur les quatre rôles livrés, zéro exception.** `Relation` écrit `lien`, **prose du modèle** ⇒ **RÉDACTION** ⇒ **vide = REFUS**.

**ARBITRAGE DE LA DIVERGENCE CENTRALE — LISTE, `MAX = 3`, VIDE = REFUS.** *(§ 8 n° 1)*

### L'invite — MOT POUR MOT
Gabarit **incrusté** par `${GABARIT_SORTIE['personnage-relations']}` :
```
Tu assistes l'AUTEUR d'un livre-jeu qui règle ce qui attache un personnage aux autres.
La demande te donne UNE fiche de personnage, puis une liste d'autres personnages repérés P1, P2, … Tu désignes ceux à qui celui de la fiche est attaché, et tu écris pour chacun ce qui les attache.

Tu réponds par un objet JSON et rien d'autre, de la forme {"rapports": [{"envers": "P1", "nature": "…"}, {"envers": "P3", "nature": "…"}]} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

Chaque repère est recopié tel quel depuis la liste, entre guillemets ; tu n'en inventes aucun et tu ne désignes jamais deux fois le même.
Chaque nature est une DIDASCALIE : elle dit ce que celui de la fiche éprouve envers l'autre et ce qui l'y a mené ; elle servira plus tard de consigne à qui le fait agir, et elle ne sera jamais lue telle quelle à un joueur.
Tu en donnes trois au plus, et au moins une : même quand la liste est maigre, une fonction et un but suffisent à dire ce qui rapproche ou sépare deux personnes d'une même histoire.
Chaque nature ne dit que ce que CE personnage-là éprouve, jamais ce que l'autre éprouve en retour.
Chaque nature se tient seule : elle ne parle que de ces deux personnes et ne renvoie à aucune des autres que tu proposes.
Tu dis par les mots la force de ce qui les attache, jamais par un chiffre ni par une échelle.
Tu ne donnes de nom à personne : dans ces phrases, ces deux-là se disent « il », « elle », « son frère », « celle qui tient la forge », jamais par un nom.
Chaque nature tient en une phrase, et ce n'est jamais une phrase qu'il prononce ni une chose qu'il entreprend.
Tu respectes le ton de l'aventure et ses interdits de ton.
Tu n'écris jamais d'identifiant, jamais de chiffre de caractéristique, jamais de seuil ni de règle de jeu, jamais le nom d'un autre champ.
```

**Sept décisions à ne pas « corriger »** :
1. ⚠ **LE PIÈGE DE RECOPIE : `indice-detenteurs` (`worker/index.ts:188`)**, l'autre rôle à rangs donc le **jumeau structurel apparent**. Sa ligne « **Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification** » recopiée ici **TUE LE SEUL CHAMP `ia`** ⇒ `nature` manquant ⇒ `schema` ⇒ rejeu ⇒ terminal. **Un rôle qui ne peut JAMAIS réussir, et RIEN NE ROUGIRAIT au dépôt** — les tests de forme passeraient, **seule la production le dirait**. Sa jumelle (l. 187, « une liste vide est une réponse juste ») produirait le même néant par l'autre bout.
2. **Runner-up** : le JSDoc de `lien` dit « même famille que `plan_actions[].action` », ce qui invite à recopier **« une INTENTION »** (3b) ⇒ *une action datable qui cesse d'être vraie une fois faite, gelée dans un champ que le moteur traite en **fait permanent***. **Même famille ≠ même chose : une intention se FAIT, un lien s'ÉPROUVE.** La queue « **ni une chose qu'il entreprend** » ferme **les deux** recopies **sans prononcer le mot « intention »**.
3. ⚠ **« trois au plus » — le garde `frontiere.test.ts:354` S'APPLIQUE** : `BORNE_EN_TOUTES_LETTRES[3] = 'trois au plus'` doit se trouver **littéralement** dans l'invite, et **aucune autre borne en toutes lettres** ne s'y trouve.
4. **« et au moins une »** est la moitié **symétrique** du prédicat (7).
5. ⚠ **« ne renvoie à aucune des autres que tu proposes » — ligne NEUVE, propre à la liste, et c'est LA CONTREPARTIE EXIGÉE de la concession.** Trois liens d'un seul jet forment une **constellation** ; l'auteur en accepte deux et en refuse un ⇒ **une prose qui renvoie à une relation qui n'existe pas**. **Moitié validateur DÉLIBÉRÉMENT ABSENTE** (KR-229) ⇒ **l'écran ne doit rien promettre de tel.**
6. **« jamais ce que l'autre éprouve en retour »** — un fait du **PORTEUR**, jamais de la **PAIRE**.
7. ⚠ **La ligne du degré interdit le CHIFFRE et l'ÉCHELLE, pas la charge émotionnelle** : le JSDoc dit que `lien` « REMPLACE le chiffre côté prose » — **« reste neutre » viderait le champ de ce pour quoi il existe**.

**Interdit de réciter** : `INTENSITE_MIN`/`MAX` · le nom `intensite`, toute paraphrase de degré · l'existence de `secret`, `cible_id`, `relations` · **le nom du champ `lien`** · ⚠ **le seuil `intensite >= 1` du transfert d'indice hors caméra** — *un modèle qui le connaît écrirait des liens **pour ouvrir ce canal*** · la table d'audience · `CANDIDATS_MAX` · seuils, tiers · **le mot « tour »**.

**`max_tokens: 700` — DÉRIVÉ.** **P = 109** (deux sources ; ⚠ *le tour 1 disait 110, **re-compté c'est 109***). Enveloppe **107** (pire rang `P10`). `L = 434`. `r=3 ⇒ 500` ; **`r=2` (PIRE) ⇒ 651 ⇒ 700**. ⚠ **Dépend du ratio : on prend le pire ET ON LE DIT.** ⚠ **700 ne coïncide avec AUCUNE valeur livrée** (200·100·400·200) — **son entrée doit dire « aucune coïncidence »**, ce qu'aucun des quatre précédents n'a eu à écrire.
**Mode d'échec nommé** : trois `nature` longues tronquent le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. **C'est le bon échec.**

**Mémoire : AUCUNE** — deux demandes ⇒ **deux corps identiques par égalité stricte**. ⚠ **Une relation acceptée devient NON RE-PROPOSABLE — non par mémoire, mais parce que LA SÉLECTION L'EXCLUT au lancer suivant** (`detientDeja`). **C'est le patron de l'IT2 (un détenteur accepté devient inénonçable), PAS celui de 3a** (une réplique acceptée reste re-proposable).

**Le garde de source contre le nommage** — substitut au scanner rejeté : `INVITES['personnage-relations'].systeme` contient « **Tu ne donnes de nom à personne** », **plus un cas négatif fabriqué**. ⚠ **LIMITE DÉCLARÉE DANS LE TEST : il épingle LA PRÉSENCE DE LA CONSIGNE, jamais son obéissance.**

## 5 — Lots

> **Frontière vérifiable d'un préfixe**… **sauf pour le lot contrat, et c'est STRUCTUREL** : un discriminant ne peut pas être optionnel. **Ce qui tient le découpage n'est pas l'absence de saignement, c'est la PROPRIÉTÉ EXCLUSIVE** — le lot 2 ne nomme **aucun** des fichiers de feature du lot 1.

### Lot 1 — `relations-contrat` · `contrat` · `dev-contrat` — **21 fichiers**
`src/brain/CopiloteService.ts` (R) · `copilote/types.ts` (R) · `copilote/schemaSortie.ts` (R) · **`copilote/contexte/relations.ts` (N)** · `contexte/registres.ts` (R) · `contexte/index.ts` (R) · **`src/brain/dossier/types.ts` (R — additif seul)** · `src/brain/index.ts` (R) · `copilote/schemaSortie.test.ts` (R) · `copilote/contexte.test.ts` (R) · `CopiloteService.test.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · `worker/frontiere.test.ts` (R) · **les 4 cartes livrées** `{CarteCompleterFiche,CarteTisserIndices,CarteFaireParler,CarteCompleterPlan}.tsx` (R — ~2 l. chacune) · **`hooks/useDemandeCopilote.ts` (R — DOCSTRING SEULE, zéro ligne de code)** · **`tests/useDemandeCopilote.test.tsx` (R — docstring seule)** · **`dossier-fiches/hooks/useEcritureRelationsPresence.ts` (R — l. 44 ET l. 137)**

**Signature EXPOSÉE** *(figée avant que le lot 2 démarre — il ne pourra plus la questionner)* :
```ts
// src/brain/index.ts
export type { CibleRelations, RapportRendu, RapportsRendus, LienResolu, PropositionRelations }
export { INTENSITE_INITIALE, RELATIONS_PROPOSEES_MAX, CLES_SORTIE_RELATIONS }
// CopiloteService — 5e surcharge, ZERO membre ajoute (les bouchons de test survivent)
demander(dossier: Dossier, cible: CibleRelations, signal?: AbortSignal): Promise<ReponseRelations>
// ReponseRelations = { ok: true; proposition: PropositionRelations } | { ok: false; refus: RefusCopilote }
```
⚠ **Le compte rendu du lot 1 transmet la signature RÉELLEMENT livrée, pas celle-ci** — si elle diverge, c'est elle qui fait foi pour le lot 2.

**Critères couverts** : #1 à #6

### Lot 2 — `carte-relations` · feature · `dev-lot` — **7 fichiers**
`components/CarteCompleterRelations.tsx` (**N**) · `components/LigneRelation.tsx` (**N**) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R — **possiblement zéro diff**, les 11 jetons sont déjà consommés ; **propriété du lot quand même**) · `textes.ts` (R) · `tests/relations.test.tsx` (**N**) · `tests/panneauCopilote.test.tsx` (R — compte de cartes **+1**)

**Signature CONSOMMÉE** : `demander(dossier, { role:'personnage-relations', personnageId }, signal)` · `PropositionRelations { personnageId, ajouts: LienResolu[] }` · `INTENSITE_INITIALE` · `DossierService.update`.
**LA RECETTE, MOT POUR MOT** :
```ts
relations: [...(p.relations ?? []), { cible_id: cibleId, lien, intensite: INTENSITE_INITIALE }]
```
⚠ **TROIS clés, `secret` ABSENT** · **jamais `{ ...ajout }` étalé** (il porterait `cibleId`/`personnageId` au document) · `p` vient du `d` **courant** · ⚠ **GARDE PRÉALABLE OBLIGATOIRE** : si le `personnageId` gelé **ne résout plus**, **aucun `update`**, `TEXTE_PORTEUR_DISPARU`, **jamais `decision:'acceptee'`**.

**Critères couverts** : #7, #8

### Fichiers HORS de tout lot — **et ZÉRO DIFF est un témoin livrable**
`contexte/{noyau,prose,detenteurs,repliques,plan}.ts` · `dossier/{destinations,tables,validate,couverture.test}.ts` · `{LigneDetenteur,LigneReplique,CarteAssistant,BarreLancer}.tsx` · `tests/{acceptation,detenteurs,repliques,planActions,cablage}` · `jest.config.cjs` · `lintIsolation.test.ts`.
⚠ **Relevé exigé : `git diff --numstat` sur cette liste, PAS un grep d'imports** — leçon n° 3 du `RETOUR-COMITÉ` de 3b, où un relevé par grep n'avait pas pu voir un `readFileSync`.

### 5.1 — Ce que le lot 1 doit MESURER *(jamais déduire)*
1. **`M` après assertion que les HUIT chemins résolvent non vides**, `CANDIDATS_MAX` **saturé** ⇒ `ceil(M×3/1000)×1000`. ⚠ **Si la mesure déplaît, on BAISSE `CANDIDATS_MAX` — jamais le budget.**
2. ⚠ **`TAILLE_MAX_CORPS_IA` (52 224) PEUT BOUGER POUR LA PREMIÈRE FOIS** — ce rôle est le **second plus large**, et la marge mesurée est **~379 caractères**. À **re-dériver en octets UTF-8 sur les CINQ rôles** — **ce n'est PAS un cliquet**, « inchangé » est une mesure.
3. **Si le budget retombe sur 4 000 ou 17 000**, vérifier que le canari « deux rôles étroits aux budgets différents » **n'est pas redevenu inerte**. ⚠ **Mesuré par la QA : la fabrication est DÉJÀ auto-gardée par un `throw` explicite** ⇒ **le risque existe mais n'est plus silencieux**.
4. **Le gabarit confronté à `ENTREE_GABARIT`** (`/^\t'([a-z-]+)': '(.+)',$/gm`) **et** testé **sous-chaîne d'aucun des quatre autres** — **avant d'écrire l'invite**.
5. ⚠ **Le bloc `max_tokens` de `worker/index.test.ts` est ÉCRIT À LA MAIN PAR ROUTE, PAS dérivé** (mesuré) — **le 5ᵉ rôle n'en hérite de rien**. Le lot livre le sien, **disant « aucune coïncidence »**.
6. `P = 109` **re-compté programmatiquement** avant d'écrire `700`.
7. **La 5ᵉ surcharge ne casse aucun bouchon** : `tsc` sur le lot 1 **SEUL**. ⚠ *Si c'est faux, le découpage est faux.*
8. **`@ts-expect-error` rouge sur chaque couple (rôle, cible) illégal**, dont **celui qu'une cible `{personnageId}` nue aurait laissé compiler**.
9. **Mutants vus rouges** : `[0]` sur un élément · `String(…)` · une clé en trop · **un `join` avant le scan** · **le filtre négatif `filter(c => c !== 'but.pourquoi')`**.
10. **Les fichiers à zéro diff**, constaté par `git diff --numstat`.
11. `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `destinations`, `relationsPresence` : **verts sans une retouche**.

## 6 — Critères d'acceptation

1. **Étant donné** un dossier où un candidat porte un `but.pourquoi` **non vide et distinct** de celui du porteur, **quand** `assemblerRelations` tourne, **alors** le texte assemblé contient le `but.pourquoi` **du porteur** et **JAMAIS celui du candidat** ; les huit chemins de l'union sont `'ia'`, `DEROGATIONS_AUDIENCE` est vide et assertée vide, `CHEMINS_CANDIDAT` est **inclus** dans l'union et `but.pourquoi` en est **absent** — *contrat* — *lot 1*
2. **Étant donné** un porteur ayant déjà une relation vers `pnj.x` dans un dossier de N personnages, **quand** la table de rangs est construite, **alors** `rangs.size === N−2`, **aucun** rang ne résout `porteur.id` **ni** `pnj.x`, `entitesInjectees[0] === porteur.id`, et `"P2"` résout le **DEUXIÈME** identifiant de la table — *contrat* — *lot 1*
3. **Étant donné** un worker **non configuré** ET `canon.ton` **marqué**, **quand** l'auteur lance, **alors** le refus est `a-ecrire` (**jamais `indisponible`**) **sans qu'aucun `fetch` ne parte**, et les **quatre** motifs de refus sont **discriminés dans le même test** — *contrat* — *lot 1*
4. **Étant donné** `{"rapports": []}`, puis `{"rapports":[{"envers":"FICHE","nature":"…"}]}`, puis deux éléments visant `"P1"`, **quand** ils sont validés, **alors** les motifs sont respectivement **`vide` (et non `schema`)**, **`rang-inconnu` (et non `schema`)** et un **refus du lot entier** — chacun rougissant seul si son prédicat est neutralisé — *contrat* — *lot 1*
5. **Étant donné** une cible portant `role` **et** `personnageId`, **quand** la demande part, **alors** `JSON.parse(init.body)` **`toEqual`** `{ role, contexte }` — **égalité, jamais inclusion** — et le dispatch à cinq branches compile avec sa garde `never` — *contrat* — *lot 1*
6. **Étant donné** `BUDGET_CARACTERES_CONTEXTE` à cinq entrées, **quand** le test de liaison tourne, **alors** le budget du rôle neuf est celui **mesuré** (`CANDIDATS_MAX` saturé, huit chemins assertés non vides), `TAILLE_MAX_CORPS_IA` est **re-dérivé sur les cinq**, `max_tokens` vaut **700** et son bloc **écrit à la main** atteste qu'il **ne coïncide avec aucun autre** — *contrat* — *lot 1*
7. **Étant donné** une proposition rendue à l'écran, **quand** l'auteur l'accepte, **alors** `relations[]` reçoit **exactement** `{ cible_id, lien, intensite }` avec `expect(relation.intensite).toBe(0)` et `expect('secret' in relation).toBe(false)`, `INTENSITE_INITIALE` étant **importée** ; **et** étant donné un porteur **retiré du dossier depuis le lancement**, **quand** l'auteur accepte, **alors** **aucun `update`** ne part, le texte dédié s'affiche et **la ligne n'est jamais marquée acceptée** — *composant* — *lot 2*
8. **Étant donné** un personnage sans relation, **quand** l'auteur lance puis accepte deux propositions, **alors** son `relations[]` en porte deux et le dossier reste accepté par `validateDossier` ; **et** étant donné une **auto-relation déjà écrite à la main** (KR-194), **alors** elle est **intacte** après l'acceptation — *bout-en-bout* — *lot 2*

### 6 bis — Chaque KR cité, son test nommé
| KR | Ce qu'il garde | Test nommé |
|---|---|---|
| **KR-221** | ne jamais semer un optionnel que l'auteur n'a pas posé | critère **#7** — `expect('secret' in relation).toBe(false)` |
| **KR-230** | refuser, jamais tronquer ni repêcher | critère **#4** + `schemaSortie.test.ts` — « quatre rapports ⇒ refus `schema`, aucune troncature » |
| **KR-231** | zéro clé commune entre forme réseau et forme re-résolue | critère **#5** (`toEqual`, jamais inclusion) + `schemaSortie.test.ts` — « `{rapports}` ∩ `{personnageId,ajouts}` = ∅ » **aux deux niveaux** |
| **KR-232** | ce qu'un modèle VOIT et ce qu'on lui DONNE sont deux listes | critère **#1** — les 8 chemins de l'union sont `'ia'`, `DEROGATIONS_AUDIENCE` assertée **vide** |
| **KR-195** | `nom` est d'audience `auteur` | critère **#1** (contrainte d'audience) + `contexte.test.ts` — « aucun `nom` dans le texte assemblé » ; ⚠ **c'est de ce KR que découle le motif du § 8 n° 6** |
| **KR-194** | l'auto-référence est LÉGALE au document | critère **#8** — une auto-relation écrite à la main reste **intacte** ; critère **#2** — le porteur n'a **aucun rang** |
| **KR-165** | aucun littéral au site d'écriture | critère **#7** (`INTENSITE_INITIALE` **importée**) + les **deux** sites repointés (§ 4.4) |
| **KR-235** | un instrument non mesuré n'est pas un instrument | les **onze mesures** du § 5.1 + critère **#6** + les **cinq mutants vus rouges** (§ 5.1-9) |
| **KR-021** | exposer une référence rompue, jamais la filtrer | `relations.test.tsx` — « cible introuvable : la ligne s'affiche **quand même**, avec `TEXTE_CIBLE_INTROUVABLE` » |
| **KR-229** | la frontière testable est la FORME, jamais la qualité | ⚠ **couvert par un AVEU, pas par un test** : § 7 nomme les quatre angles morts, et le garde de source sur l'invite **déclare sa limite DANS le test** |
| **KR-109** | pas d'abstraction à un seul appelant | ⚠ **non testable — règle de revue** ; il est cité comme **motif de REJET** (§ 8 n° 24 et n° 31), pas comme invariant à garder |

## 7 — Ce que personne ne pourra vérifier *(à recopier dans la revue)*
- **Un NOM PROPRE INVENTÉ dans `nature`** — ⚠ **et le scanner est REJETÉ pour un motif qui retourne l'argument : il est INVERSÉ.** `nom` n'étant injecté nulle part, un scanner sur les `nom` du dossier **rougirait sur une prose JUSTE** (le modèle a deviné le bon nom) et **resterait VERT sur le nom inventé — qui est exactement le bug**. Substitut livré : un **garde de source** sur l'invite, **dont la limite est déclarée dans le test** (il épingle **la présence de la consigne**, jamais son obéissance).
- **Une `nature` qui RENVOIE à une autre proposition du même lot** — la ligne d'invite l'interdit, **aucun prédicat ne peut le constater** (KR-229). **C'est le risque propre à la liste, et il est le prix assumé de la concession.**
- **La paraphrase, la contradiction avec une relation existante, le « lien » qui est en fait une intention.**
- **Le trou « porteur disparu » dans `CarteFaireParler` (3a) et `CarteCompleterPlan` (3b)** — **préexistant, journalisé, NON corrigé ici.**

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead ↔ narratif | **LISTE (`MAX=3`) contre SCALAIRE** | **RETENU : LISTE, `MAX=3`, VIDE = REFUS `vide`** | ⚠ **LES DEUX AUTEURS ONT ÉCHANGÉ LEURS POSITIONS** — arbitrage **sur l'argument**. Décisif, et c'est le narratif **contre sa propre forme** : il avait lui-même qualifié `relations[]` d'**INTERCHANGEABLE**, or la doctrine dit *ordonné ⇒ une par lancer (3b)*, *interchangeable ⇒ **liste acceptée une par une (3a)*** — **3a gouverne, et 3a est une liste**. Le « une par lancer » de 3b était propre au cas **ORDONNÉ + INJECTÉ**. **Et la moitié des coûts que le tech-lead opposait à la liste s'évapore** dès que le vide est un **refus** : plus de doctrine neuve, plus d'état d'écran indiscernable d'un échec. |
| 2 | PM | **VETO sur toute sortie `liens: []`** | **SATISFAIT, non contourné** | Son veto portait sur le vide **présenté comme un SUCCÈS**. Le prédicat **(7) `longueur ≥ 1 ⇒ vide`** le rend **impossible** : une réponse vide est un **refus nommé**, jamais un succès. **Le veto est tenu par la forme retenue.** |
| 3 | tech-lead | **Doctrine « liste vide = succès »** | **REJETÉE, non ratifiée** | Remplacée par la **règle de tranchage du cas mixte** (§ 4 bis), qui se **vérifie sur les quatre rôles livrés sans exception** — et dont le narratif nomme **le seul piège** : le critère porte sur « rédigée par le modèle », **pas** sur l'audience `'ia'`, sans quoi il **contredirait le rôle détenteurs**. |
| 4 | QA | **Scalaire plus testable** (11 prédicats dont un sans motif nommé) | **SATISFAIT** | Son objection portait sur le prédicat « `vers` distincts » **sans motif dans `MotifIllisible`**. Le contrat retenu le **nomme** : prédicat (9), motif `schema`. |
| 5 | narratif | **VETO — deux ensembles porteur ⊃ candidats** | **RETENU, ratifié par le tech-lead** | **Mesuré** : chez détenteurs, cible et candidats se séparent **par le préfixe** ; ici les deux sont `monde.personnages[]`. Une liste plate donnerait aux huit candidats **les lignes du porteur**, **et aucun test actuel ne rougirait**. **Durci** : liste **positive**, **deux** tests, et **le témoin porte sur le TEXTE ASSEMBLÉ**. |
| 6 | narratif | **VETO — porteur exclu des rangs** | **RETENU** | ⚠ **Le motif technique du tech-lead est VRAI mais INSUFFISANT — mesuré** : l'invariant `entitesInjectees` **reste satisfait avec le doublon**. Ce qui décide : **`nom` n'est jamais injecté** ⇒ **le modèle croirait les deux blocs être deux personnes** ⇒ **une FICTION FAUSSE**, invisible au validateur **comme à l'écran**. |
| 7 | QA | **VETO — auto-référence non filtrée** | **RETENU, mais RÉ-ORIENTÉ** *(les deux postes à effort élevé l'ont trouvé indépendamment)* | Tel qu'écrit, il **teste l'inverse de la décision**. **KR-194 dit que l'auto-référence est LÉGALE AU DOCUMENT, pas qu'elle est PROPOSABLE.** Deux assertions, **toutes deux** au plan : le porteur **n'a aucun rang** (critère #2) **et** une auto-relation **déjà écrite** est **intacte** (critère #8). |
| 8 | QA | **`P2` → 2ᵉ id** · **`toBe(0)` jamais `toBeFalsy`** | **RETENUS** | ⚠ **Ils valent identiquement dans les deux formes** — indépendants du débat. `0` est **truthy-fragile** : un `intensite \|\| DEFAUT` en aval le confondrait avec « absent ». |
| 9 | tech-lead | **Scission `copilote/demandes/**`** | **RETIRÉE PAR SON AUTEUR — REPORTÉE** | **Mesuré** : 502 l., ~570 avec la branche — **sous le bloqueur (800)**, et le signal à 400 **vise les composants et hooks, pas un service**. Elle ajoutait **7 fichiers et un piège d'ordre invisible** au lot le plus chargé. *« Je m'applique ma propre règle. »* **Condition d'ouverture : le 6ᵉ rôle, ou 600 lignes.** |
| 10 | UX ↔ tech-lead | **`CarteTisserLiens`/`LigneLien`** | **REJETÉS — le tech-lead a cédé** | « Tisser » est **déjà le geste de la carte 2**, qui **désigne sans porter de prose** ; et `LigneLien` est un **3ᵉ synonyme** du champ `relations[]` — ⚠ **exactement le travers que le tech-lead condamne lui-même** en rejetant `porteurId`. |
| 11 | narratif ↔ tech-lead | **Clé `liens` contre `rapports`** | **RETENU : `rapports`** | `liens` est **le pluriel exact du champ `lien`** ⇒ **nommer le champ** (veto 3b) + confusion **à une lettre** (KR-231). **Les quatre clés livrées diffèrent toutes de leur champ.** Un **quasi-synonyme** est légitime, **le mot du champ non**. |
| 12 | narratif ↔ tech-lead | **`vers` contre `envers`** | **RETENU : `envers`** | C'est **le mot que l'écran rend déjà** (`EYEBROW_ENVERS`) — *un mot, une notion, des deux côtés de la frontière* — et la **préposition du sentiment dirigé**, là où `vers` est directionnel. |
| 13 | UX | **Glyphe `✕` au lieu de `×`** | **REJETÉ — vérifié faux par l'orchestrateur** | Les **trois** composants de ligne livrés utilisent `×` et leurs docstrings le nomment ; `✕` sert ailleurs à **fermer un conteneur**, pas à **rejeter une proposition**. L'appliquer créerait une 4ᵉ ligne **incohérente avec les trois autres**. |
| 14 | UX | **`MENTION_RELATION_CREEE` disant « non réglée par le copilote »** | **RÉVISÉE PAR SON AUTEURE** | **Mesuré** : le chemin d'écriture pose **déjà** `0` à la main ⇒ la mention doit dire **la PARITÉ, pas l'exception**. |
| 15 | narratif | **« Le copilote emprunte le MÊME chemin d'écriture »** | **RETIRÉE PAR SON AUTEUR** | **Fausse** : `useEcritureRelationsPresence` est un hook de `dossier-fiches`, **que `dossier-copilote` ne peut pas importer** (isolation câblée en ESLint). **Ce qui se partage** : la **constante** et la **forme écrite**. |
| 16 | tech-lead | **`dossier/types.ts` et `dossier-fiches` dans le lot contrat** | **RETENU, avec témoin de remplacement** | Le « zéro diff » de 3b était **un constat de non-débordement, pas un invariant permanent**. Le témoin devient **plus fin** (§ 4.4). ⚠ **Et son propre tour 1 ne citait qu'UN des deux sites littéraux — corrigé : l. 44 ET l. 137.** |
| 17 | narratif / tech-lead | **Scanner de noms propres** | **REJETÉ** | ⚠ **L'instrument est INVERSÉ** : il rougit sur la prose **juste** et reste vert sur le nom **inventé**. **Le livrer serait pire que rien** — il donnerait l'illusion que le risque est couvert. **Substitut livré** : garde de source **avec sa limite déclarée dans le test**. |
| 18 | narratif | **Injecter `relations[]`** | **REJETÉ** | **Interchangeable** (test de rattachement) ; et sans appellation, « son créancier » **sans dire de qui** serait **non seulement inutile mais ACTIF** — le modèle le rattacherait à l'un des `Pn` affichés. |
| 19 | narratif / tech-lead | **Exercer `secret` à 3c** | **REJETÉ — mais SA JUSTIFICATION est corrigée** | Les cinq rôles sont des rôles d'**ÉCRITURE** ; « acteur/narrateur/arbitre » n'existent pas. ⚠ **Le prédicat n'est PAS amendé ; sa phrase « aucun assembleur n'existe encore » est FACTUELLEMENT FAUSSE** (cinq existent) et **deviendra un piège** — **réécrite AUX DEUX SITES**, 5ᵉ instance de l'instrument. |
| 20 | tech-lead | **Prédicat de doublon au validateur** | **REJETÉ** | *Le validateur ne connaît pas le document* ; le doublon **contre le document** se ferme à la **SÉLECTION**, où il cesse d'être **représentable**. Le doublon **intra-lot**, lui, est le prédicat (9) — *la sélection ne peut pas le voir*. |
| 21 | tech-lead / narratif | **`porteUnIdentifiant` sur le jeton `envers`** | **REJETÉ — veto des deux** | Le jeton est **l'une de nos propres chaînes** : **code mort présenté comme de la couverture** (BUG-084, KR-235). |
| 22 | tech-lead | **`CibleRelations { porteurId }`** | **REJETÉ** | **3ᵉ synonyme** — c'est précisément **le signal que 3b a daté ici**. |
| 23 | tech-lead | **Renommer `acteurId`** | **REJETÉ** | **Churn pur** : le tag rend le synonyme **inoffensif**, et le renommage tirerait `planActions.test.tsx` dans le lot contrat. **Une dette fermée par conception n'est plus une dette.** |
| 24 | tech-lead | **`type ContexteRelations = ContexteDetenteurs`** | **REJETÉ** | Abstraction à un seul appelant (KR-109) — précédent `ContexteProse` réutilisé **sans alias** par deux rôles. |
| 25 | tech-lead | **Registre paramétré des cinq `CLES_SORTIE_*`** | **REJETÉ, 5ᵉ fois** | Le rôle prose n'a pas de liste : **son entrée serait un mensonge**. |
| 26 | tech-lead | **Partager `RELATIONS_PROPOSEES_MAX`** | **REJETÉ** | Même valeur aujourd'hui, **aucune raison commune d'évoluer**. |
| 27 | tech-lead | **3ᵉ lot « worker »** | **REJETÉ** | `frontiere.test.ts:68/74` **soude** `INVITES` (worker) et `BUDGET_…` (brain) : **un lot qui n'ajoute le rôle que d'un côté est ROUGE SEUL**. |
| 28 | tech-lead | **Deux lots contrat** | **REJETÉ** | Ils nommeraient tous deux `CopiloteService.ts` et `brain/index.ts`. |
| 29 | tech-lead | **Couper 3c en deux itérations** | **NON RETENU** | **La moitié « couture » n'aurait AUCUNE démo**, et le lot 1 **a perdu 7 fichiers** depuis le tour 1. |
| 30 | UX / narratif | **Mention d'écran sur l'auto-référence non proposée** | **REJETÉE** | `CARD6_CORPS` porte **déjà** « un **autre** personnage » ; l'écrire ouvrirait **une liste non bornée de ce qui n'est pas proposé** et **apprendrait à l'auteur à lire les mentions comme du bruit**. **Une mention d'honnêteté, pas deux.** |
| 31 | UX | **Suffixe « (envers lui-même) »** | **REPORTÉ** | **Aucun producteur côté copilote** (le porteur est hors rangs) ; à garder **seulement** s'il en trouve un côté fiche, sinon **constante à zéro appelant** (KR-109). |
| 32 | UX | **Curseur `intensite` éditable à la ratification** | **REJETÉ** | **Aucun geste manuel ne l'offre au même point d'entrée** — capacité neuve hors périmètre. |
| 33 | UX | **Afficher `intensite` brute / un badge « secret »** | **REJETÉS** | Un **nombre nu n'apprend rien que `lien` ne dise déjà** ; et exposer `secret` **créerait une promesse que rien ne tient**. |
| 34 | narratif | **`caractere.jamais` au contexte** | **REJETÉ — motif NEUF** | `jamais` borne un **COMPORTEMENT** ; un lien est **ÉPROUVÉ, pas agi**. L'injecter **invite à écrire le lien comme une action que le personnage refuserait**. |
| 35 | narratif | **`but.pourquoi` chez les candidats** | **REJETÉ** | **Le pourquoi privé de huit inconnus**, pour une valeur discriminante que `but.libelle` donne déjà — **c'est cette ligne qui justifie la scission**. |
| 36 | narratif | **En-tête `PERSONNAGE`** | **REJETÉ** | **Collision avec l'alphabet des rangs** ⇒ `{"envers":"PERSONNAGE"}` ⇒ `rang-inconnu` ⇒ rejeu ⇒ terminal. |
| 37 | narratif | **Recopier l'invite détenteurs ou « une INTENTION »** | **REJETÉS** | La première **TUE LE SEUL CHAMP `ia`** — *un rôle qui ne peut jamais réussir, et rien ne rougirait* ; la seconde produirait **une action datable gelée dans un champ que le moteur traite en fait permanent**. |
| 38 | tech-lead | **Corriger le trou « porteur disparu » dans les cartes 3 et 5** | **REPORTÉ** | **Préexistant** (famille BUG-114) ; **journalisé `minor` dans le même lot**, précédent `handleRetirerEtape`. **3c le ferme pour SA carte** (critère #7). |
| 39 | QA | **`TAILLE_MAX_CORPS_IA` peut bouger** | **RETENU comme mesure à faire** | **Non vérifiable avant que le budget existe** ; marge mesurée **~379 caractères**. |
| 40 | QA | **Le piège de 3b peut se ré-armer** | **ATTÉNUÉ — mesuré par elle** | La fabrication est **déjà auto-gardée par un `throw` explicite** ⇒ **le risque existe, mais il n'est plus SILENCIEUX**. |

> **Les onze lignes qui suivent viennent des ANNEXES des notes de tour.** Elles sont recopiées ici et non laissées là-bas : une note condensée garde les conclusions et **perd les refus motivés** — c'est exactement ce qui a produit BUG-082. Un `REJETÉ` d'annexe **n'existe pas pour l'essaim**.

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 41 | tech-lead | **Deux listes parallèles `{cibles:[…], natures:[…]}`** | **REJETÉ** | **Un désaccord de longueur devient un mode de panne NEUF** — et il faudrait un 13ᵉ prédicat pour l'attraper. La forme retenue rend l'incohérence **non représentable**. |
| 42 | tech-lead | **Jeton + prose dans UNE chaîne** (`"P1: son créancier"`) | **REJETÉ** | **Chirurgie de chaîne sur une sortie de modèle**, et l'appartenance au rang **cesse d'être un `Set.has`** pour devenir un parsing — donc faillible là où elle est aujourd'hui totale. |
| 43 | tech-lead | **Tag `genre` distinct du rôle** (table 5×2) | **REJETÉ** | Une **table 5×2 à tenir en phase à la main** — c'est la divergence que l'union étiquetée (§ 4.1) vient précisément de fermer. |
| 44 | tech-lead | **Renommer `CibleCopilote` → `CibleProse`** | **REPORTÉ** | **Condition d'ouverture non échue** ; à rouvrir quand un 2ᵉ rôle de prose pure existera. |
| 45 | tech-lead | **Prédicat « `nature` distinctes »** | **REJETÉ** | ⚠ **Le seul prédicat d'unicité recevable porte sur `envers`, jamais sur `nature`** : **deux frères portent légitimement le même lien**. Écrit au prédicat (9) pour que personne ne « symétrise ». |
| 46 | UX / tech-lead | **Étendre `LigneDetenteur` d'un `lien?`** | **REJETÉ** | Une ligne avec lien et une ligne sans n'ont **ni la même hauteur ni le même sens de lecture** — **une SŒUR, jamais une variante**. |
| 47 | UX / tech-lead | **Étendre `LigneReplique` d'un `designation?`** | **REJETÉ — motif inversé et décisif** | `LigneReplique` est **réemployée TELLE QUELLE par DEUX cartes (3a, 3b) PRÉCISÉMENT parce qu'elle ne porte aucun membre propre à un consommateur**. Lui en ajouter un **détruirait la propriété qui la rend réutilisable** — l'argument de réemploi joue **contre** l'extension, pas pour. |
| 48 | narratif | **Que le modèle rende `intensite` ou une paraphrase de degré** | **REJETÉ — veto de domaine** | ⚠ **Un seuil de jeu en dépend** : `intensite >= 1` commande le transfert d'indice hors caméra. Un degré rendu par le modèle **déplacerait une règle du jeu dans un prompt**. L'invite interdit **le chiffre et l'échelle**, jamais la charge — § 4 bis, décision 7. |
| 49 | narratif | **Dériver `secret` de la prose** (« et ne l'a jamais dit à personne » ⇒ `secret: true`) | **REJETÉ — veto de domaine** | **Le modèle poserait un drapeau MOTEUR par la bande**, et `secret` **commande une audience**. C'est la raison pour laquelle `secret` est **omis** et non « posé à `false` » (KR-221). |
| 50 | tech-lead | **`intensite: 0` en dur dans la carte** | **REJETÉ** | **KR-165** — quatre précédents nomment la graine dans `brain/` (`STATS_INITIALES`, `CONFIANCE_INITIALE_PORTE`, `CURSEURS_INITIAUX`). |
| 51 | tech-lead | **Ne PAS repointer `useEcritureRelationsPresence.ts`** | **REJETÉ** | **Une graine à deux domiciles diverge en silence** — et c'est le seul mode de panne qu'aucun test existant ne verrait, puisque les deux valent `0` aujourd'hui. **Les DEUX sites** (l. 44 et l. 137). |

## 9 — Innovation
*Aucune.* Les quatre décisions structurantes (union étiquetée, deux ensembles, règle du cas mixte, `INTENSITE_INITIALE`) s'appuient toutes sur un précédent livré ou sur une mesure.

## 10 — Définition de fini
- [ ] Porte verte : `format` → `typecheck` → `lint` → `test`
- [ ] `test:mutation` — **à constater sur le diff**, pas de mémoire
- [ ] Les **onze mesures du § 5.1** exécutées et rapportées
- [ ] **VU ROUGE avant d'être cru** : les cinq mutants du § 5.1-9 · chaque cas négatif des douze prédicats · le cas négatif du garde de source sur l'invite · les `@ts-expect-error`
- [ ] **`git diff --numstat`** sur la liste « zéro diff », **pas un grep**
- [ ] Critères du § 6 cochés un par un
- [ ] Non-régression : les sept suites nommées **vertes sans une retouche**
- [ ] **Relevé du budget de contexte ÉCRIT** — ⚠ `code-knowledge.json` à **72 o**, `dossier-format/specification.json` à **73 o**, le couple `CLAUDE.md`/`WORKFLOW.md` à **154 o**, `ROADMAP` à **173 o** : **les cibles faciles sont épuisées, la prochaine compaction n'est pas un ajustement**
- [ ] `bug_history.json` : le trou « porteur disparu » des cartes 3 et 5 journalisé
- [ ] Revue : `.claude/raffinage/dossier-copilote-it3c.revue.md`

## 11 — Signatures
| Rôle | Verdict | Réserve |
|---|---|---|
| PM | **ACCEPTÉ** | exclusions écrites ✔ · veto `liens: []` **tenu par le prédicat (7)** ✔ |
| Tech Lead | recevable sous réserve | contrat figé avant le lot 2 ✔ · union étiquetée ✔ · scission retirée ✔ · nommage cédé ✔ |
| UX | recevable sous réserve | `LigneRelation` sœur ✔ · mention de parité ✔ · **glyphe `×` maintenu contre sa proposition** ✔ |
| QA | **veto levé au plan** | ses **quatre** séparateurs sont aux critères #2, #4, #7, #8 — dont **QA-3 ré-orienté** ✔ |
| Narratif & IA | recevable sous réserve | deux ensembles ✔ · porteur hors rangs ✔ · `rapports`/`envers` ✔ · invite au § 4 bis ✔ |
