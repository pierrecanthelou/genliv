# Plan d'itération — `dossier-copilote` · itération `4` *(la dernière de la feature)*

> Statut : **`validé`** — porte 1 (mécanique) franchie, **porte 2 (humaine) franchie le 2026-09-19**. Exécutable par `/essaim`.
> Comité : **5 rôles** — motif : contrat de sortie IA, invite worker, audiences du dossier, **création d'entité**.
> Exécution : **séquentielle** (2 lots) — aucun essaim, aucun worktree, aucune fusion.
> Tours : 2. **Aucun veto ne survit au tour 2** — le narratif a **retiré le sien de lui-même** (hors domaine), le tech-lead a **cédé sur sa propre doctrine**. Aucune escalade.

## Fiche de validation *(à lire en deux minutes)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut **faire éclater le synopsis en une distribution de personnages**. » |
| **Tranche** | 6ᵉ carte → `demander(dossier, { role:'monde-distribution' }, signal)` → contexte à **5 chemins** (canon + bloc `DEJA ECRIT`) → route worker → sortie `{"distribution":[{"place","poursuite"}]}`, **12 prédicats** → acceptation ligne par ligne → **le code frappe l'identifiant** et écrit `{ id, portee, plan_actions:[], savoirs:[], fonction, but:{libelle} }` → `update` → `dossier:updated` |
| **Lots** | 2 séquentiels · dont `contrat` : **oui** (lot 1, seul et en premier, **18 fichiers**, registre de libellés inclus) |
| **Hors périmètre** | `nom` (proposé, dérivé **ou saisi**) · `description_joueur` et `apparence` **dans la sortie** · `but.pourquoi`, `but.echeance` · `camp`, `objectif_id`, `stats`, `portee` proposés · le rattachement aux objectifs · l'élargissement de `CHAMPS_PROPOSABLES` · **la scission de `CopiloteService.ts`** |
| **Reporté** | scission `copilote/demandes/**` (**condition ÉCHUE, différée par décision de comité**) · `but.pourquoi` (n° 12 / Temps 2) · appellation re-projetée (n° 10) · rattachement aux objectifs (n° 10) · l'unicité de la distribution au-delà de `DEJA_ECRITS_MAX` |

> ⚠ **C'est la DERNIÈRE itération de la feature.** Ce qui n'est pas tranché ici part en `open_questions` **sans repêchage**.

---

## 1 — But raffiné

**À la fin de cette itération, l'auteur peut faire éclater le synopsis en une distribution de personnages.**

Le copilote propose **jusqu'à trois** fiches — pour chacune **la place** que la personne occupe et **ce qu'elle poursuit** —, l'auteur les accepte ou les refuse **une par une**, et **chaque acceptation crée un personnage** : le **code** frappe l'identifiant à cet instant-là, jamais avant.

**Ce qui est neuf, et c'est tout** : **le seul assistant qui CRÉE**. Les cinq précédents écrivent dans une entité qui existe déjà.

## 2 — Hors périmètre

**`Personnage` n'a que QUATRE champs requis** — `id`, `portee`, `plan_actions`, `savoirs` (mesuré). Ce que l'acceptation écrit, et rien d'autre :

| champ | source | motif |
|---|---|---|
| `fonction` | **le modèle** (`place`) | la valeur de la tranche : **requis**, exigence PM |
| `but.libelle` | **le modèle** (`poursuite`) | **requis** — § 4 bis |
| `id` | **le code**, `frapperIdentifiant('pnj')` | **à l'acceptation, jamais avant** |
| `portee` | **le code**, `PORTEE_INITIALE` | `moteur` — un modèle qui la choisit écrit une donnée de moteur |
| `plan_actions`, `savoirs` | **le code**, `[]` | plancher de requis |

**ABSENTS, jamais semés (KR-221)** : `nom`, `camp`, `objectif_id`, `apparence`, `description_joueur`, `stats`, `but.pourquoi`, `but.echeance`, `contre_mesures`, `relations`, `presence`, `caractere`.

⚠ **`description_joueur` est hors sortie ET hors contexte** — voir § 4 bis, c'est l'arbitrage central.
⚠ **Personne ne nomme le brouillon**, et c'est **la PARITÉ** : `handleAjouter` crée **déjà** un personnage sans nom. **Aucun geste de saisie** n'est introduit.

## 3 — Contrat de design

### 3.1 Jetons — **zéro neuf**
`eyebrowStyle` · `separateurLigneStyle` · `listeDetenteursStyle` · `actionsDetenteurStyle` · `mentionStyle` · `refusSyncStyle` — tous déjà exportés par `components/styles.ts`. `Field`, `Badge`, `IconButton` inchangés. ⚠ **`styles.ts` sera possiblement à zéro diff — propriété du lot quand même.**

### 3.2 `CarteEclaterSynopsis` — la 6ᵉ carte, et **le slot existe déjà**
⚠ **Réutilise le slot `CARD3_*`**, qui vit aujourd'hui comme placeholder « Bientôt — itération 4 » rendu par `PanneauCopilote:66`. **Ne PAS créer de `CARD7`.**

⚠ **Pas de `Select` de ciblage** — cette carte **ne cible aucune entité existante**, sa source est `canon.*`. `BarreLancer` désactivée **uniquement** sur `indisponible`.
Corps : `BarreLancer` → état d'échec → **jusqu'à 3** `LigneFichePersonnage`, séparées par `separateurLigneStyle`, chacune précédée de `eyebrowPersonnagePropose(n)` **rendu par la CARTE** → `MENTION_PERSONNAGE_SANS_NOM` **en mention permanente sous la liste**, jamais conditionnelle à une acceptation — *l'auteur doit le savoir AVANT d'accepter*.

### 3.3 `LigneFichePersonnage` — **sœur**, et la première à porter DEUX proses
```ts
export interface LigneFichePersonnageProps {
	eyebrow: string
	/** DEUX éléments. Les `label` sont RÉSOLUS PAR LA CARTE depuis LIBELLE_DES_CHAMPS —
	 *  la ligne ne porte JAMAIS un `chemin`. */
	champs: { label: string; valeur: string }[]
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void; onRejeter: () => void; onOuvrirFiche: () => void
}
export interface LigneFichePersonnageHandle { focusAccepter: () => void }
```
Rendu : eyebrow → **un `Field` en lecture seule par champ** (`onChange={() => {}}`, doctrine de `LigneProposition`) → ⚠ **UNE SEULE paire d'actions sous l'ensemble** — *le brouillon est indivisible* → après décision, `Badge` + `LIEN_OUVRIR_FICHE` sur acceptée seule → `onSelectSection('personnages')`, **jamais un id ciblé** (rouvrirait BUG-082).

⚠ **`TL3a-3` est BORNÉ, pas abandonné** : le corollaire « aucun `label=` » visait une ligne rendant **UNE** prose anonyme — *rien à distinguer, donc aucun label*. **Ici il y en a DEUX, et rien ne les distinguerait.** Il reste entier ailleurs, et **les deux libellés viennent du registre, aucune chaîne n'est retapée**.

⚠ **Ne PAS porter un `chemin: CheminLibelle` dans la ligne** : `CheminLibelle` gagne la même itération des entrées de **forme différente** (`canon.*` top-level contre `monde.personnages[].*` à trois niveaux). **Résoudre les `label` côté carte découple la ligne de cette irrégularité.**

⚠ **GLYPHE `×`, JAMAIS `✕`** — les quatre lignes livrées l'utilisent ; `✕` sert à **fermer un conteneur**.
⚠ **Aucune désactivation du `+`** : `monde.personnages[]` n'a **aucun plafond de document**.
⚠ **Aucune garde « porteur disparu »** — **il n'y a pas de porteur** : l'entité n'existe pas avant l'acceptation. Le seul refus d'écriture possible est un `statut:'refuse'` du SSOT, **cas nominal** (KR-234), proposition **maintenue à l'écran**.

### 3.4 Textes exacts — `textes.ts`
```ts
export const CARD3_TITRE = 'Éclater le synopsis'   // INCHANGÉ
export const CARD3_CORPS =
	"Propose une distribution de personnages à partir du synopsis, de l'accroche et du ton."
// ⚠ CARD3_BADGE SUPPRIMÉ — la carte n'est plus « Bientôt ».
// ⚠ Le corps passe du FUTUR au PRÉSENT : « Proposera… » devient une PROMESSE FAUSSE
//   le jour où la carte est active. Il décrit la SOURCE, pas la forme de sortie.

export function eyebrowPersonnagePropose(n: number): string { return `PERSONNAGE PROPOSÉ ${n}` }

export const MENTION_PERSONNAGE_SANS_NOM =
	"Un personnage accepté n'a pas encore de nom — donnez-lui-en un dans sa fiche (Personnages → Identité)."
```
**Réutilisés SANS reformulation** : `LABEL_ACCEPTER`, `LABEL_REJETER`, `BADGE_ACCEPTE`, `BADGE_REJETE`, `LIEN_OUVRIR_FICHE`, `TEXTE_INDISPONIBLE`, `TEXTE_ILLISIBLE`, `TEXTE_CHARGEMENT`, `TITRE_COPILOTE_NON_CONFIGURE`, **et `texteRefusAEcrire(…)`**.

⚠ **AUCUN texte de refus dédié.** Le littéral `TEXTE_REFUS_SYNOPSIS_A_ECRIRE` proposé au tour 1 est **retiré par son auteure** : dès que `canon.mj.synopsis_mj` entre au registre, `texteRefusAEcrire(LIBELLE_DES_CHAMPS[echec.chemin].libelle)` le nomme. **Le garder serait une seconde source d'un libellé d'écran.**
⚠ **Aucune mention sur les doublons ni sur les renvois croisés** — **aucun prédicat ne les constate. L'écran ne promet que ce qu'un instrument tient.**

### 3.5 Focus, clavier
Identique aux cinq cartes livrées. ⚠ **Focus post-décision** : ligne suivante **non décidée**, sinon `Lancer`, **et jamais une cible que ce même rendu désactive** (BUG-109).
⚠ **Clé React et clé de `decisions` : LA POSITION**, jamais un identifiant — **il n'existe pas encore**. Stable parce que `ajouts` est figé pour la session. Idem la `Map` de `ref`.

## 4 — Contrats `brain/`

### 4.1 La 6ᵉ branche de l'union étiquetée — **première cible à CHARGE VIDE**
```ts
export interface CibleDistribution { role: 'monde-distribution' }   // aucun champ
export interface FicheBrouillon { fonction: string; but: { libelle: string } }
export interface PropositionDistribution { ajouts: readonly FicheBrouillon[] }
export type ReponseDistribution =
	| { statut: 'propose'; proposition: PropositionDistribution }
	| EchecCopilote
demander(dossier: Dossier, cible: CibleDistribution, signal?: AbortSignal): Promise<ReponseDistribution>
```
⚠ **La surcharge se pose AUX DEUX SITES** de `CopiloteService.ts` (l'interface publique **et** l'implémentation) — *en oublier un rend l'appel impossible côté feature*.
⚠ **`FicheBrouillon` N'EST PAS assignable à `Personnage`** (quatre requis manquants) : **la décision actée « brouillon sans identité » devient un INVARIANT DE COMPILATION, pas une convention.** `@ts-expect-error` sur `const p: Personnage = brouillon`, **vu rouge**.
⚠ **PREMIÈRE PROPOSITION SANS IDENTIFIANT DE CIBLE.** L'invariant des cinq rôles livrés — « la proposition est LA CIBLE PLUS LE CONTENU » — **ne s'applique pas** : la cible est le dossier. **Ne pas ajouter de `dossierId` « par symétrie ».**
⚠ **`{ ...cible, contexte }` reste INTERDIT** — il serait **inoffensif ici** (charge vide, rien à fuiter), **et c'est exactement pourquoi** : il serait **généralisé aux cinq autres**, où il met `personnageId`/`indiceId`/`champ` sur le fil (KR-231). **Littéral écrit + témoin `toEqual`, jamais par inclusion.**

### 4.2 Forme réseau et validateur
```ts
interface FicheReseau        { place: string; poursuite: string }        // NON ré-exportée
interface DistributionRendue { distribution: readonly FicheReseau[] }    // NON ré-exportée
export const CLES_SORTIE_DISTRIBUTION = ['distribution'] as const
export const FICHES_PROPOSEES_MAX = 3
GABARIT_SORTIE['monde-distribution'] = '{"distribution": [{"place": "…", "poursuite": "…"}, {"place": "…", "poursuite": "…"}]}'
// KR-231 AUX DEUX NIVEAUX : {distribution} ∩ {ajouts} = ∅ · {place,poursuite} ∩ {fonction,but} = ∅
```
| Clé réseau | → document | Pourquoi ce mot |
|---|---|---|
| `distribution` | *(la liste)* | **le mot de la démo**. **Pas `personnages`** (nom de la collection ⇒ nommer le champ, veto 3b), **pas `fiches`** (mot d'écran). |
| `place` | `fonction` | le JSDoc dit « la charge qu'il occupe ». **Pas `fonction`** (nom du champ), **pas `metier`** (RÉTRÉCIT — un seigneur n'a pas de métier), ⚠ **pas `role`** — **collision frontale** avec `CorpsDemande.role` et `Cible*.role`. |
| `poursuite` | `but.libelle` | **Pas `but`** (nom du champ), **pas `objectif`** (KR-198), **pas `quete`** — collection **ET** espace de noms, **mordrait le scanner d'identifiants**. |

**LES DOUZE PRÉDICATS** *(compte du narratif ; le tech-lead en compte **15** en scindant par champ — ⚠ **la revue doit dire LEQUEL des deux comptes elle donne**, sinon elle comparera deux grandeurs différentes)* :
(1) objet simple `schema` · (2) clés **exactement** `CLES_SORTIE_DISTRIBUTION` `schema` · (3) `Array.isArray` `schema` · (4) chaque élément objet simple, clés **exactement** `['place','poursuite']` `schema` · (5) les **deux** sont des CHAÎNES — *un tableau meurt ici, **jamais `[0]`, jamais `String(…)`*** `schema` · (6) ≤ `FICHES_PROPOSEES_MAX`, **refus jamais troncature** (KR-230) `schema` · (7) longueur ≥ 1 `vide` · (8) les **deux** non vides après `trim()` `vide` · (9) **éléments distincts SUR LE COUPLE** `schema` · (10) aucun `MARQUEUR_A_ECRIRE`, constante **IMPORTÉE**, sur les deux proses `marqueur` · (11) `porteUnIdentifiant` **par élément et par champ, jamais un `join`** `identifiant` · (12) **aucune clé en trop au second niveau** — signal KR-236 `schema`.

⚠ **Le prédicat (9) est NEUF et NE SE SYMÉTRISE PAS** : **deux gardes partagent légitimement une `place`**, **deux prétendants partagent légitimement une `poursuite`** — **seul le COUPLE identique est du remplissage**. *Un prédicat sur une seule clé refuserait une réponse juste.* Son cas négatif exige **trois** témoins : couple identique ⇒ rejet · même `place`, `poursuite` différente ⇒ accepté · l'inverse ⇒ accepté.

⚠ **QUATRE motifs atteignables, pas cinq.** `'rang-inconnu'` est **SANS OBJET** — aucun jeton, aucune table d'appartenance. **À ÉCRIRE dans le type et le commentaire, JAMAIS rejoué par symétrie** (BUG-084, KR-235). ⚠ **Et `brain/index.ts:176-180` reste VRAI et ne doit pas être « harmonisé »** : le **5ᵉ** rôle est bien le premier à nommer `MotifIllisible` **en entier** ; **le 6ᵉ ne la nomme PAS en entier**, et c'est à écrire.

**Refus du LOT ENTIER** sur un seul élément fautif — repêcher les valides ferait **ratifier une distribution amputée sans que l'auteur le sache** (KR-230).

### 4.3 Contexte — **CINQ chemins**, tous `'ia'`, `DEROGATIONS_AUDIENCE` vide

| Chemin | Rôle |
|---|---|
| `canon.mj.synopsis_mj` | ⚠ **requis n° 1 — LA SOURCE** |
| `canon.ton` | **requis n° 2** |
| `canon.interdits_ton[]` | contrainte |
| `canon.partage.accroche_joueur` | contrainte |
| `monde.personnages[].fonction` | ⚠ **LISTE NÉGATIVE** — les déjà écrits, **sans rang**, bloc `DEJA ECRIT`, `DEJA_ECRITS_MAX = 12` |

⚠ **LE RENVERSEMENT DU SYNOPSIS EST SÛR, et le motif est décidable** — `synopsis_mj` a été **retiré** des contextes de 3b et 3c « pour point de vue » ; ici il est la source :
> **TEST DE RATTACHEMENT** : *la prose rendue sera-t-elle un jour jouée, prononcée ou éprouvée PAR quelqu'un ?* **Oui** ⇒ retrait (3a/3b/3c). **Non — c'est une note de fiche lue par un narrateur** ⇒ injection (it1, it4).

**Précédent livré qui le confirme** : `personnage-prose` **reçoit déjà `synopsis_mj`**. Et le discriminant qui dit ce que le renversement coûte : **là-bas HUIT chemins de fiche bornent la prose, ici ZÉRO. 0 contre 8 est un discriminant, pas une pente.**

⚠ **POURQUOI LA LISTE NÉGATIVE EST REQUISE, ET NON « CUTTABLE »** — les deux postes à effort élevé y sont arrivés **indépendamment**, puis le tech-lead a **retiré son « sans dommage »** sur deux faits : (1) **le doublon n'est pas VISIBLE** — les acceptés s'affichent dans `PanneauPersonnages`, **pas dans la carte** ; sans `nom`, l'auteur devrait comparer **deux proses de mémoire, entre deux panneaux** — *ce n'est pas un coût visible, c'est un coût rappelé* ; (2) **sans borne nommée, le budget serait un PLANCHER et non une mesure**.

**Retraits, aux motifs PROPRES** : **`description_joueur`** — *montrer huit réputations publiques invite à en écrire une* (§ 4 bis) · **`but.libelle`** — ⚠ *c'est **la moitié de ce que le modèle écrit** ; l'injecter fait écrire « autour » des buts acceptés, une **constellation** de la distribution déjà ratifiée* · `apparence`, `caractere.*`, `plan_actions[].action`, `relations[]`, `savoirs[]`, `presence[]` — hors tranche · `stats`, `camp`, `portee`, `nom`, `objectif_id` — `moteur`/`auteur` · **`canon.objectifs[]`** — **zéro clé `'ia'`** (mesuré), sous garde stricte le modèle recevrait une liste vide.

```ts
export const DEJA_ECRITS_MAX = 12
```
⚠ **Constante propre, JAMAIS `CANDIDATS_MAX`** — **le sens est INVERSE** : `CANDIDATS_MAX` borne des **désignables**, celle-ci borne des **exclus**. **Motif propre de la valeur** : la boucle visée est « presser, accepter jusqu'à trois, presser encore » ⇒ **quatre pressions × trois = 12**.
⚠ **Aucun rang, aucune table de rangs** : rien ne désigne personne — une table serait un instrument **sans consommateur** (KR-235) **et une invitation à la référence croisée**. En-tête **`DEJA ECRIT`**, jamais `P…` ni `FICHE`.
**Pas une ligne, pas de bloc** : zéro déjà écrit ⇒ **bloc ABSENT**, jamais vide.
**Ordre de troncature** : `portee === 'premier'` d'abord, puis l'ordre du document — mécanisme de 3c réutilisé tel quel, **`portee` SÉLECTIONNE et n'est jamais injectée**.
⚠ **LIMITE DÉCLARÉE** : une borne de **contexte** n'est **pas** une garantie d'unicité. Au-delà de 12, un doublon redevient possible et **aucun prédicat ne le constate** — **l'écran ne promet donc rien.**

**`PARTIES_REQUISES['monde-distribution'] = ['canon.mj.synopsis_mj', 'canon.ton']`**
⚠ **PREMIER rôle à DEUX requis.** Sur cinq rôles, le `chemin` de `'a-ecrire'` **n'a jamais pu valoir que `'canon.ton'`** — *cette itération lui donne sa seconde valeur, ce qui est la différence entre une charge et une constante déguisée*. **`MotifRefusContexte` reste INCHANGÉE à quatre membres.**
⚠ **L'ORDRE décide quel champ l'écran nomme** : **le synopsis d'abord** — *le manque le plus spécifique à CETTE carte avant le filtre générique des six rôles*.

**REFUS — ordre figé, tous AVANT le moindre `fetch`** :
`a-ecrire('canon.mj.synopsis_mj')` → `a-ecrire('canon.ton')` → `trop-long` (**refus, jamais coupure**).
⚠ **`'cible-a-ecrire'` et `'aucun-candidat'` sont INATTEIGNABLES ICI — à DIRE, pas à taire.** `'cible-a-ecrire'` signifie « l'entité **CIBLE** n'a rien d'écrit » : ici la cible est `monde.personnages[]`, **vide par définition**. Et **un monde vide est le CAS NOMINAL** — *le premier geste après l'écriture du synopsis*. **Les recopier refuserait l'usage principal du rôle.**

### 4.4 Le registre de libellés : **4 → 6 entrées**
```ts
'canon.mj.synopsis_mj':            { libelle: 'SYNOPSIS MJ',   hint: /* verbatim de PanneauCanon.tsx */ },
'monde.personnages[].but.libelle': { libelle: "CE QU'IL VEUT", hint: "interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur" },
```
**Extraction VERBATIM, aucune chaîne réécrite** (KR-117). `CheminLibelle` est `keyof typeof` : **elle s'élargit seule, aucune ligne au baril.**

⚠ **LA CO-PROPRIÉTÉ EST FORCÉE, PAS CHOISIE** : poser une entrée **sans repointer sa fiche d'origine** laisse `libelles.test.ts` **ROUGE** — **il n'existe AUCUN état vert intermédiaire entre les deux, ce qui INTERDIT d'en faire deux lots. C'est la définition même d'un lot contrat.** D'où `PanneauCanon.tsx` **et** `BlocPlanActions.tsx` au lot 1. **L'isolation n'est pas entamée** : les deux importent de `brain/`, jamais l'un l'autre.

⚠ **SIX SITES DEVIENNENT FAUX LE MÊME JOUR**, tous au lot 1 :
`libelles.ts` (docstring des critères d'entrée) · `PanneauCanon.tsx` (la même phrase) · **`brain/index.ts:185` (« reste à quatre entrées »)** · **`libelles.test.ts:39` — LE TITRE DU TEST « quatre entrees, pas une de plus »** · la liste exacte et l'épinglage valeur par valeur de `libelles.test.ts` · **`specification.json:302`** *(hors lot — l'étape documentation)*.

**Restent INLINE, un seul lecteur chacun** : `ACCROCHE JOUEUR`, `POURQUOI`, `ÉCHÉANCE`, les `PLACEHOLDER_*`. ⚠ **Ne pas promouvoir `ACCROCHE JOUEUR` « puisqu'on y est »** : injectée **mais jamais requise** ⇒ **aucune branche ne peut la nommer** ⇒ ligne de registre **sans producteur** (KR-235).

## 4 bis — L'ARBITRAGE CENTRAL : le second champ

**RETENU : `but.libelle`. REJETÉ : `description_joueur`.** *(§ 8 n° 1)*

Les deux postes à effort élevé ont proposé **le même premier champ** et **un second incompatible**. **Le tech-lead a cédé au tour 2, sur sa propre doctrine.** Quatre arguments **indépendants** convergent :

1. ⚠ **CHAÎNAGE — vérifié à la ligne par l'orchestrateur.** `contexte/plan.ts:36` nomme `CHEMIN_BUT_CIBLE = 'monde.personnages[].but.libelle'`, et `:94` **refuse `'cible-a-ecrire'` dès que ce chemin ne résout pas**. **Une fiche acceptée SANS `but` est refusée par un rôle DÉJÀ LIVRÉ.** Avec `fonction`+`but.libelle` la fiche ouvre **QUATRE** rôles (`prose`, `repliques`, `relations` — disjonction d'identité, `fonction` suffit — **et `plan`**) ; avec `fonction`+`description_joueur`, **TROIS, et `personnage-plan` REFUSE**. ⚠ **L'itération 4 est la dernière : elle doit livrer une fiche que les cinq rôles précédents savent lire.**
2. **LE SEUL TROU DU DISPOSITIF.** `CHAMPS_PROPOSABLES` = `fonction` · `apparence` · `description_joueur`. **`but.libelle` n'est écrit par AUCUN rôle.** `description_joueur` l'est déjà, **à un clic**. **Mettre `description_joueur` ici double une capacité livrée et laisse le trou ouvert ; `but.libelle` le ferme. Le choix n'est pas symétrique.**
3. **CE QUE L'AUTEUR TRANCHE** *(PM, sur la valeur)* — « distribuer, c'est **répartir des rôles dramatiques**, pas décrire des réputations ». Deux gardes de même `place` aux `poursuite` **opposées** sont **deux personnages** ; aux `reputation` différentes, **un personnage décrit deux fois**. **`but.libelle` porte la DISCRIMINATION.**
4. **AUDIENCE, EN DERNIER ET NON EN PREMIER** *(le dépôt l'écrit déjà, vérifié)* — hint de `description_joueur` : **« lue par le joueur »** ; `HINT_BUT_LIBELLE` : **« interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur »**.

> **TEST DE RATIFICATION** *(pourquoi le couple déjà livré à l'it1 ne vaut pas précédent)* : à l'instant d'accepter, l'auteur a-t-il **une fiche écrite par lui** contre laquelle lire la prose publique ? **Oui** (it1, entité existante) ⇒ la fuite **détonne**. **Non** (it4) ⇒ **la fuite est INDISCERNABLE DE L'INVENTION RÉUSSIE.**

⚠ **KR-229 impose alors la parade par la FORME, jamais par une ligne d'invite** — c'est la doctrine du tech-lead, et c'est elle qui l'a fait céder. **Le champ public sort de la sortie : la fuite n'a plus de canal.**

### La règle de tranchage, et pourquoi il n'y a **PAS** de troisième cas
> **Le critère unique : la liste vide porte-t-elle une information que le code n'a pas ?**
> **DÉSIGNATION** — le code a fourni l'ensemble des candidats ; « aucun ne convient » est **une réponse** ⇒ **vide = succès**.
> **RÉDACTION** — « je n'ai rien écrit » n'est pas une réponse, c'est **une non-exécution** : *le code savait déjà qu'il n'y avait rien, c'est pour ça qu'il a demandé* ⇒ **vide = refus**.
> **CRÉATION** — ⚠ **il n'existe AUCUN ensemble de candidats à épuiser** (c'est le motif même pour lequel `'aucun-candidat'` est écarté). **Sans ensemble, la vacuité ne peut rien signifier.** ⇒ **REFUS `'vide'`. Le troisième cas ne se referme pas par convention : IL N'A PAS D'INSTANCE.**

⚠ **Corollaire de cohérence** : la ligne d'invite « trois au plus, **et au moins une** » est **la moitié symétrique du prédicat (7)**. Si quiconque renversait vers « vide = succès », **cette ligne devrait tomber dans le même lot** — sinon le rôle promet ce que le code dément.

### L'invite — mot pour mot
```
Tu assistes l'AUTEUR d'un livre-jeu qui cherche qui peuple son histoire.
À partir du contexte fourni, tu proposes des personnes que cette histoire-là suppose : ce que chacune est dans ce monde, et ce que chacune veut.

Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['monde-distribution']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.

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
1. ⚠ **LE PIÈGE DE RECOPIE LE PLUS COÛTEUX** — la ligne de nommage de `personnage-relations` cite **« celle qui tient la forge »** comme désignation *légitime*. **Recopiée ici, elle AUTORISE LA PÉRIPHRASE PAR LA CHARGE — la seule erreur de référence que ce rôle puisse commettre.** La ligne d'ici **interdit nommément la périphrase et la charge**.
2. « Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification » (`indice-detenteurs`) **tuerait LES DEUX champs qui traversent** — *un rôle qui ne peut jamais réussir, et rien ne rougirait au dépôt*. Sa jumelle « une liste vide est une réponse juste » produirait le même néant par l'autre bout.
3. « une INTENTION … ce qu'il entreprend ensuite » (`personnage-plan`) gèlerait **une action datable** dans un champ que le moteur lit comme un **vouloir permanent**. La queue ferme la recopie **sans prononcer le mot « intention »**.
4. ⚠ **La ligne du visage RESTE et devient STRUCTURELLE** : *« ni son visage, ni sa voix, ni ce qui se raconte d'elle »* bloque `apparence`, bloque `description_joueur`, et **referme le canal synopsis → public** — **une ceinture sur une bretelle, maintenant que le champ public n'est plus dans la sortie, et elle ne coûte rien**.
5. « trois au plus, **et au moins une** » figure **en plus** du contrat, jamais à la place.

**Interdit de réciter** : `FICHES_PROPOSEES_MAX` · `DEJA_ECRITS_MAX` · toute **autre** borne en toutes lettres · les noms de champs (`fonction`, `but`, `libelle`, `nom`, `portee`, `camp`, `objectif_id`, `plan_actions`, `savoirs`, `apparence`, `description_joueur`) · **le fait que le code frappe un identifiant** · la table d'audience · le langage D1 · seuils et tiers · **le mot « tour »**.

⚠ **`'trois au plus' EXISTE DÉJÀ** dans `BORNE_EN_TOUTES_LETTRES` : le garde « la borne de l'invite est celle du validateur » s'étend **sans toucher la table** — **à ARMER explicitement sur ce rôle, avec son cas négatif fabriqué.**

**`max_tokens` — DÉRIVÉ, aucun chiffre non mesuré.** `P_place` et `P_poursuite` **attestées sur deux sources indépendantes**, `L = 3 × (P_place + P_poursuite) + E`, **r = 2 pris comme pire cas**. **Dire si le résultat dépend du ratio, et s'il coïncide avec l'une des cinq valeurs livrées** (200 · 100 · 400 · 200 · 700). **Mode d'échec nommé** : trois fiches longues tronquent le JSON ⇒ `schema` ⇒ rejeu ⇒ terminal. **C'est le bon échec.**

**Mémoire : AUCUNE.** Deux lancers ⇒ **deux corps identiques par égalité stricte**. **Le document est la seule mémoire.** ⚠ **Conséquences écrites plutôt que découvertes** : une fiche **refusée** ne laisse **aucune trace** et **peut revenir** — *prix assumé de « le document est la seule mémoire » ; stocker les refus inventerait un état de session dans un éditeur qui n'en a pas* ; une fiche **acceptée** disparaît **par le bloc des déjà écrits**, jamais par une mémoire.

## 5 — Lots

### Lot 1 — `distribution-contrat` · `contrat` · `dev-contrat` — **18 fichiers** (+1 conditionnel)
`src/brain/copilote/types.ts` (R) · `copilote/schemaSortie.ts` (R) · **`copilote/validateurs.ts` (N — CONDITIONNEL)** · **`copilote/contexte/distribution.ts` (N)** · `contexte/registres.ts` (R) · `contexte/index.ts` (R) · `src/brain/CopiloteService.ts` (R) · `src/brain/dossier/libelles.ts` (R) · `src/brain/dossier/libelles.test.ts` (R) · `src/brain/index.ts` (R) · `copilote/schemaSortie.test.ts` (R) · `copilote/contexte.test.ts` (R) · `CopiloteService.test.ts` (R) · `worker/index.ts` (R) · `worker/index.test.ts` (R) · `worker/frontiere.test.ts` (R) · **`src/features/dossier-canon/components/PanneauCanon.tsx` (R)** · **`src/features/dossier-fiches/components/BlocPlanActions.tsx` (R)**

**Signature EXPOSÉE** *(figée avant que le lot 2 démarre)* — **baril relu ligne à ligne, leçon BUG-116** :
```ts
export type { CibleDistribution, ReponseDistribution, PropositionDistribution, FicheBrouillon }
// ZÉRO valeur neuve : frapperIdentifiant, PORTEE_INITIALE, localiserEntite,
// LIBELLE_DES_CHAMPS, MotifIllisible, MotifRefusContexte, EchecCopilote sortent DÉJÀ.
```
⚠ **NE SORTENT PAS** : `FicheReseau`, `DistributionRendue` (**formes RÉSEAU**), `validerDistribution`, `CLES_SORTIE_DISTRIBUTION`, `FICHES_PROPOSEES_MAX`, `DEJA_ECRITS_MAX`, `GABARIT_SORTIE`, `assemblerDistribution`, `CHAMPS_INJECTES`, `DEROGATIONS_AUDIENCE`, `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`, `CANDIDATS_MAX`. **Six précédents livrés le disent.**
⚠ **Le compte rendu du lot 1 transmet la signature RÉELLEMENT livrée** — si elle diverge, **c'est elle qui fait foi**.

**Critères couverts** : #1 à #6

### Lot 2 — `carte-distribution` · feature · `dev-lot` — **9 fichiers**
`components/CarteEclaterSynopsis.tsx` (**N**) · `components/LigneFichePersonnage.tsx` (**N**) · `components/CarteAssistant.tsx` (R) · `components/PanneauCopilote.tsx` (R) · `components/styles.ts` (R — possiblement zéro diff) · `textes.ts` (R) · `tests/distribution.test.tsx` (**N**) · `tests/panneauCopilote.test.tsx` (R) · `tests/cablage.test.ts` (R)

**Signature CONSOMMÉE** : `demander(dossier, { role:'monde-distribution' }, signal)` · `PropositionDistribution { ajouts: FicheBrouillon[] }` · `frapperIdentifiant('pnj')` · `PORTEE_INITIALE` · `LIBELLE_DES_CHAMPS` · `DossierService.update`.

**LA RECETTE, MOT POUR MOT** :
```ts
const nouveau: Personnage = {
	id: frapperIdentifiant('pnj'),            // DANS le gestionnaire d'acceptation, JAMAIS au rendu
	portee: PORTEE_INITIALE,
	plan_actions: [],
	savoirs: [],
	fonction: brouillon.fonction,
	but: { libelle: brouillon.but.libelle },  // sous-entité construite PAR LE CODE (précédent 3b)
}
// puis : personnages: [...d.monde.personnages, nouveau]
```
⚠ **SIX clés écrites. `{ ...brouillon }` est INTERDIT, et l'imbrication AGGRAVE le motif** : un spread superficiel porterait **`but` PAR RÉFÉRENCE**, partagé entre l'état d'écran et le document.
⚠ **`CarteAssistant.badge?` perd son UNIQUE consommateur** — la prop **et** l'import `Badge` **partent dans ce lot**, sinon c'est **une surface publique à zéro appelant livrée le jour même** (KR-109).

**Critères couverts** : #7, #8

### Fichiers HORS de tout lot — **et « zéro diff » est un livrable**
⚠ **`hooks/useDemandeCopilote.ts` — MESURÉ : il est DÉJÀ `useDemandeCopilote<C, P>`, générique, prouvé sur cinq instanciations. La sixième coûte ZÉRO.** · `LigneProposition`, `LigneDetenteur`, `LigneReplique`, `LigneRelation`, `BarreLancer` · les **cinq** cartes livrées · `contexte/{noyau,prose,detenteurs,repliques,plan,relations}.ts` · ⚠ **`brain/dossier/types.ts`** — *le témoin « zéro diff » REVIENT, différence lisible avec 3c : cette itération n'ajoute **aucun champ au schéma et aucune graine**. Le seul fichier de `brain/dossier/` touché est `libelles.ts`* · `dossier/{destinations,tables,validate,couverture.test}.ts` · `dossier-fiches/**` sauf `BlocPlanActions.tsx` · `lintIsolation.test.ts` · `jest.config.cjs`.
**Relevé par `git diff --numstat`, PAS un grep d'imports** — leçon n° 3 du `RETOUR-COMITÉ` de 3b.

### 5.1 — Ce que le lot 1 doit MESURER *(jamais déduire)*
1. **`M`** sur le contexte réellement assemblé, `DEJA_ECRITS_MAX` **saturé**, **après avoir asserté que les CINQ chemins résolvent non vides** ⇒ `ceil(M×3/1000)×1000`. ⚠ *Sinon le nombre est un **plancher**, pas une mesure.* **Si la mesure déplaît, on baisse `DEJA_ECRITS_MAX` — jamais le budget.**
2. **`TAILLE_MAX_CORPS_IA` re-dérivé en octets UTF-8 sur les SIX rôles.** ⚠ *Il a bougé à 3c (52 224 → 53 248) et a changé de porteur — « inchangé » est une mesure, pas un défaut.*
3. **`max_tokens` dérivé**, `P` **re-compté programmatiquement**, **pire ratio pris ET dit**, **coïncidence dite**. Le bloc de `worker/index.test.ts` est **écrit à la main par route**.
4. **Le gabarit confronté à `ENTREE_GABARIT`** **et** testé **sous-chaîne d'aucun des cinq autres** — **avant d'écrire l'invite**.
5. **`tsc` sur le lot 1 SEUL** : (a) la 6ᵉ surcharge, **aux deux sites**, ne casse **aucun bouchon** ; (b) **l'élargissement de `CheminLibelle` ne fait bouger AUCUNE des cinq cartes** ni `LigneProposition`. ⚠ *Si (b) est faux, le découpage est faux.*
6. **`@ts-expect-error` vus rouges** : ⚠ **`const p: Personnage = brouillon`** · chaque couple (rôle, charge) illégal · une cible `{ personnageId }` sur ce rôle.
7. ⚠ **Lignes de `schemaSortie.ts` — MESURÉES APRÈS LE CORPS, AVANT LES DOCSTRINGS.** Mesuré : **638** aujourd'hui, projection **[728 ; 795]** — **le seuil de 800 n'est PAS dégagé, 5 lignes de marge au pire.** **Si > 800, la scission se fait DANS CE LOT**, sous forme **pré-nommée** : `copilote/validateurs.ts` (**les six validateurs**), les registres restant dans `schemaSortie.ts`. ⚠ **Conséquence dite d'avance** : `validateurs.ts` atterrirait **~490 l. — signal KR-112 (400), pas bloqueur (800) : ON S'ARRÊTE LÀ.**
8. ⚠ **Lignes de `CopiloteService.ts`** — mesuré **574**, projection **~630**. *Relevé obligatoire : la condition de scission est échue, et sa dérogation est au § 8 n° 9.*
9. **`BORNE_EN_TOUTES_LETTRES`** : `'trois au plus'` **littéralement** dans l'invite, **aucune autre** borne en toutes lettres, **cas négatif FABRIQUÉ**.
10. **Mutants vus rouges** : `[0]` sur un élément · `String(…)` · une clé en trop **au second niveau** · un `join` avant le scan · **une troncature au lieu du refus** · ⚠ **le mutant du COUPLE** (unicité réduite à une seule clé).
11. **`git diff --numstat`** sur la liste zéro-diff — **pas un grep**.

## 6 — Critères d'acceptation

1. **Étant donné** un dossier dont les cinq chemins résolvent non vides et qui porte des personnages déjà écrits, **quand** `assemblerDistribution` tourne, **alors** le texte assemblé contient le `synopsis_mj` et un bloc `DEJA ECRIT` **sans aucun rang**, les cinq chemins sont `'ia'`, `DEROGATIONS_AUDIENCE` est assertée **vide**, `description_joueur` et `but.libelle` en sont **absents** ; **et** sur un dossier **sans aucun personnage**, le bloc est **ABSENT, jamais vide** — *contrat* — *lot 1*
2. **Étant donné** un dossier sans synopsis **et** sans `canon.ton`, **quand** l'auteur lance, **alors** le refus est `a-ecrire` **portant le chemin du SYNOPSIS** (jamais celui du ton), **sans qu'aucun `fetch` ne parte** ; **et** sur un dossier **sans aucun personnage**, aucun refus ne part — **`'cible-a-ecrire'` et `'aucun-candidat'` sont assertés INATTEIGNABLES** — *contrat* — *lot 1*
3. **Étant donné** `{"distribution":[]}`, puis deux éléments au **couple identique**, puis deux éléments de **même `place` aux `poursuite` différentes**, **quand** ils sont validés, **alors** les résultats sont respectivement **`vide`**, **refus du lot entier** et **ACCEPTÉ** ; **et** les **quatre** motifs atteignables sont discriminés, **`'rang-inconnu'` étant asserté sans objet et non rejoué** — *contrat* — *lot 1*
4. **Étant donné** la 6ᵉ cible à **charge vide**, **quand** la demande part, **alors** `JSON.parse(init.body)` **`toEqual`** `{ role, contexte }` — **égalité, jamais inclusion** —, le dispatch à six branches compile avec sa garde `never`, **et `const p: Personnage = brouillon` NE COMPILE PAS** — *contrat* — *lot 1*
5. **Étant donné** `BUDGET_CARACTERES_CONTEXTE` à six entrées, **quand** le test de liaison tourne, **alors** le budget est celui **mesuré** (`DEJA_ECRITS_MAX` saturé, cinq chemins assertés non vides), `TAILLE_MAX_CORPS_IA` est **re-dérivé sur les six**, `max_tokens` est **dérivé** et son bloc dit **s'il coïncide ou non** avec l'une des cinq valeurs livrées, et `'trois au plus'` est **littéralement** dans l'invite — *contrat* — *lot 1*
6. **Étant donné** `LIBELLE_DES_CHAMPS` passé à **six** entrées, **quand** `libelles.test.ts` tourne, **alors** **aucune des deux chaînes cédées n'est retapée** dans `PanneauCanon.tsx` ni `BlocPlanActions.tsx`, **les deux fiches LISENT le registre**, et les **cinq** sites qui annonçaient « quatre entrées » sont corrigés — *contrat* — *lot 1*
7. **Étant donné** trois fiches proposées et rendues, **quand** l'auteur refuse la deuxième puis accepte la première et la troisième, **alors** l'espion sur `frapperIdentifiant` compte **ZÉRO appel avant tout clic**, **zéro après le refus**, puis **exactement deux**, et `monde.personnages[]` reçoit **deux entrées aux identifiants DISTINCTS** portant exactement `{ id, portee, plan_actions, savoirs, fonction, but }`, **`nom` absent** — *composant* — *lot 2*
8. **Étant donné** un dossier dont le synopsis est écrit, **quand** l'auteur lance puis accepte une fiche, **alors** le dossier reste accepté par `validateDossier` **et** le personnage créé est immédiatement **recevable par `assemblerPlan`** (son `but.libelle` résout, donc `personnage-plan` ne rend pas `'cible-a-ecrire'`) — *bout-en-bout* — *lot 2*

### 6 bis — Chaque KR cité, son test nommé
| KR | Test nommé |
|---|---|
| **KR-221** | critère **#7** — `nom` **absent**, et aucun optionnel semé |
| **KR-230** | critère **#3** — refus du lot entier, **jamais de troncature** |
| **KR-231** | critère **#4** (`toEqual`) + `schemaSortie.test.ts` — `{place,poursuite}` ∩ `{fonction,but}` = ∅, **aux deux niveaux**, avec `@ts-expect-error` croisés |
| **KR-232** | critère **#1** — cinq chemins `'ia'`, `DEROGATIONS_AUDIENCE` assertée **vide** |
| **KR-195** | critère **#7** — `nom` n'est **ni proposé ni semé** ; ⚠ c'est de ce KR que découle l'arbitrage « personne ne nomme le brouillon » |
| **KR-229** | ⚠ **couvert par un AVEU, pas par un test** : § 7 nomme les angles morts, et **c'est ce KR qui a fait céder le tech-lead** — ce qui n'est pas testable se ferme **par la forme** |
| **KR-165** | critère **#7** — `PORTEE_INITIALE` **importée**, aucun littéral au site |
| **KR-235** | les **onze mesures** du § 5.1 + critère **#5** + **les six mutants vus rouges** |
| **KR-117** | critère **#6** — **zéro chaîne retapée**, les deux fiches **lisent** le registre |
| **KR-234** | § 3.3 — un `statut:'refuse'` du SSOT est le **cas nominal**, proposition maintenue à l'écran |
| **KR-109** | ⚠ **non testable — règle de revue** ; cité comme **motif de REJET** (§ 8 n° 11, 12, 20) et comme motif du retrait de `CarteAssistant.badge?` |
| **KR-112** | § 5.1-7 et 5.1-8 — **deux relevés de lignes obligatoires** |
| **KR-236** | critère **#3**, prédicat (12) — **une clé en trop au SECOND niveau est un refus** ; et § 5.1-4, le gabarit **dupliqué** côté worker confronté à `ENTREE_GABARIT` |
| **KR-003** | critère **#7** — deux acceptations donnent **deux identifiants DISTINCTS**, `frapperIdentifiant` ne dérivant jamais d'un nom ni d'une prose |
| **KR-198** | ⚠ **non testable — cité comme MOTIF DE REJET** (§ 8 n° 30) : le mot `objectif` est déjà pris, d'où `poursuite` |

## 7 — Ce que personne ne pourra vérifier *(à recopier dans la revue)*
- ⚠ **Deux figures qui sont la même personne dite deux fois**, au-delà de `DEJA_ECRITS_MAX`. **Sans nom ni identifiant, rien ne peut le constater** — et c'est le prix assumé d'une borne de **contexte**, qui n'est **pas** une garantie d'unicité. **L'écran ne promet rien.**
- ⚠ **Une `poursuite` qui RENVOIE à une autre proposition du même lot.** L'invite l'interdit **nommément, y compris par la périphrase et la charge** ; **aucun prédicat ne peut le constater** (KR-229). ⚠ **Ce qui le borne réellement, c'est LA FORME** : l'élément **ne porte aucune fente de désignation** — pas de rang, pas de handle —, donc une référence croisée reste **confinée dans la prose que l'auteur lit avant d'accepter** et **ne peut pas produire de pointeur cassé**. **C'est la différence avec 3c**, et c'est ce qui a retenu le narratif de poser un veto.
- **Une distribution sans rapport avec le synopsis** · **la paraphrase** · **le nom propre inventé** (le scanner reste refusé, **instrument inversé** — il rougirait sur une prose juste et resterait vert sur le nom inventé).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | tech-lead ↔ narratif | **Second champ : `description_joueur` contre `but.libelle`** | **RETENU : `but.libelle`** | ⚠ **LE TECH-LEAD A CÉDÉ AU TOUR 2, SUR SA PROPRE DOCTRINE** : le lectorat joueur **n'est codé nulle part dans `destinations.ts`** ⇒ la fuite est **hors frontière testable** ⇒ **KR-229 impose la parade par la FORME**. Et **quatre arguments indépendants** convergent (§ 4 bis), dont le **chaînage vérifié à la ligne** par l'orchestrateur. |
| 2 | tech-lead | **`personnage-prose` écrit déjà `description_joueur` en recevant `synopsis_mj`** | **MAINTENU COMME FAIT, RETIRÉ COMME DÉFENSE** *(par son auteur)* | Le fait **rend sûr le renversement du synopsis** et est conservé à ce titre. Ce qui le distingue d'ici : **là-bas HUIT chemins de fiche bornent la prose, ici ZÉRO** — *0 contre 8 est un discriminant, pas une pente*. |
| 3 | narratif | **VETO sur `description_joueur` en sortie** | ⚠ **REQUALIFIÉ EN OBJECTION FORTE PAR SON PROPRE AUTEUR** | *« L'audience d'un champ de document n'est pas dans mon domaine de veto ; l'y forcer aurait usé l'instrument avant la n° 12. »* **Le fond gagne autrement.** L'orchestrateur ratifie la requalification : elle était juste. |
| 4 | tech-lead ↔ narratif | **Nom du rôle : `'monde-distribution'` contre `'synopsis-distribution'`** | **RETENU : `'monde-distribution'`** | ⚠ **LES DEUX ONT ÉCHANGÉ LEURS POSITIONS entre les tours** — troisième itération d'affilée. Arbitré **sur l'argument, jamais sur le mouvement** : **un seul des deux mouvements est ARGUMENTÉ** (le narratif : *une clé de route se nomme par sa destination, qui ne bouge pas ; le contexte, lui, a bougé à chaque itération ; et `monde-` est le seul préfixe qui dise « aucune entité cible »*). Et il **respecte la convention des cinq livrés** — ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ : `synopsis-` nommerait **la source**, ce qu'aucun rôle ne fait. |
| 5 | narratif ↔ orchestrateur | **La mesure 5 du cadrage (« QUATRE chemins ») est fausse** | **RETENU — le contexte est de CINQ chemins** | ⚠ **L'orchestrateur avait tort.** « Quatre » n'est exact **qu'à la première pression** : sans les `fonction` déjà écrites, le modèle repropose la même distribution, l'auteur accepte, **le dossier porte des jumeaux à identifiants distincts, et rien ne le constate**. |
| 6 | tech-lead | **« Cuttable sans dommage »** sur cette injection | **RETIRÉ PAR SON AUTEUR — promu à REQUIS** | Deux faits : (1) **le doublon n'est pas VISIBLE** — les acceptés vivent dans un **autre panneau**, et sans `nom` l'auteur devrait comparer **deux proses de mémoire entre deux panneaux** — *pas un coût visible, un coût rappelé* ; (2) **sans borne nommée, le budget serait un plancher, pas une mesure**. |
| 7 | qa | **Espion sur le SITE D'APPEL de `frapperIdentifiant`** | **RETENU — réserve DURCIE, satisfaite** | ⚠ **L'invariant de type NE LE REMPLACE PAS, et le tech-lead l'a reconnu** : `FicheBrouillon` n'a aucune fente `id`, **mais un `useMemo` de précalcul À CÔTÉ compile parfaitement**. **`tsc` tient la FORME, jamais le MOMENT.** Mutant séparateur nommé : **le précalcul à la réception**. Critère #7. ⚠ **Le `jest.fn` DÉLÈGUE au vrai** — sinon « deux identifiants distincts » serait **verte et vide**. |
| 8 | qa ↔ narratif | **« La création est un troisième cas » (vide = succès ou refus ?)** | **REJETÉ : il n'y a pas de troisième cas** | ⚠ **Le critère n'est pas la dichotomie, c'en est la conséquence** : *la liste vide porte-t-elle une information que le code n'a pas ?* En création, **il n'existe aucun ensemble de candidats à épuiser** — c'est le motif même pour lequel `'aucun-candidat'` est écarté. **Sans ensemble, la vacuité ne peut rien signifier** ⇒ **REFUS `'vide'`. Le troisième cas n'a pas d'instance.** |
| 9 | tech-lead | **Scission `copilote/demandes/**` — condition ÉCHUE des deux côtés** | **REPORTÉ — dérogation RATIFIÉE par l'orchestrateur** | ⚠ **La condition auto-imposée à 3c (« 6ᵉ rôle OU 600 lignes ») est échue : le 6ᵉ rôle arrive, et la projection est ~630 (mesuré 574).** Dérogation accordée sur le motif écrit : **600 est un déclencheur maison, le bloqueur KR-112 est 800** ; mêler un refactor de service à **la dernière livraison d'une feature**, dans un lot contrat **déjà à 18 fichiers**, **achète un risque contre zéro gain d'itération**. ⚠ **Le relevé reste OBLIGATOIRE** (§ 5.1-8) : une dérogation mesurée n'est pas une dérogation tacite. → `open_questions`, n° 10. |
| 10 | tech-lead | **Scission conditionnelle de `schemaSortie.ts`** | **RETENU comme instruction conditionnelle** | **638 mesuré, projection [728 ; 795] — le seuil de 800 n'est PAS dégagé, 5 lignes au pire.** Mesure **avant les docstrings**, scission **dans ce lot** si franchi, **forme pré-nommée pour qu'elle ne s'improvise pas**, et **on s'arrête à `validateurs.ts`** (~490 l., signal et non bloqueur). |
| 11 | tech-lead | **Fabrique `creerPersonnageBrouillon()` dans `brain/`** | **REJETÉ** | ⚠ **Discriminant écrit pour ne pas être redébattu : une GRAINE DE VALEUR monte dans `brain/`, une FORME D'ÉCRITURE reste au site.** La première diverge **en silence** (`0` et `0` sont verts) ; la seconde est tenue par **`tsc`**. **La seule valeur du germe, `PORTEE_INITIALE`, sort déjà.** **KR-109 déguisé en KR-165.** |
| 12 | tech-lead | **Élargir `CHAMPS_PROPOSABLES` / `ChampProseChemin`** | **REJETÉ** | Rendrait **représentable une demande de prose sur une entité qui n'existe pas**. **Le rôle EST les champs.** ⚠ **Décision COUPLÉE au n° 1** : si `description_joueur` avait été retenu, ce rejet perdait son motif et le registre devait être rouvert **dans le même lot**. |
| 13 | ux ↔ tech-lead | **`TEXTE_REFUS_SYNOPSIS_A_ECRIRE`, littéral dédié** | **RETIRÉ PAR SON AUTEURE** | Le veto qui le motivait a été **levé par son propre porteur** : *la branche que ce veto disait impossible, cette itération la produit*. Le garder serait une **seconde source d'un libellé d'écran**. |
| 14 | ux | **`chemin: CheminLibelle` porté par la ligne** | **RETIRÉ PAR SON AUTEURE** | `CheminLibelle` gagne la même itération des entrées de **forme différente** (top-level contre trois niveaux). **Résoudre les `label` côté carte découple la ligne de cette irrégularité.** |
| 15 | ux | **Dupliquer le libellé de `but.libelle` en littéral local** | **REJETÉ — par son auteure, contre elle-même** | *« Second domicile pour un fait déjà canonique ailleurs — exactement la faute que je reprochais au tour 1, retournée contre moi si je l'acceptais ici. »* |
| 16 | ux ↔ tech-lead | **Le corollaire TL3a-3 (« aucun `label=` ») s'applique-t-il ?** | **RETENU : BORNÉ, pas abandonné** | Il visait une ligne rendant **UNE** prose anonyme — *rien à distinguer, donc aucun label*. **Ici il y en a DEUX, et rien ne les distinguerait.** **Hors de son périmètre, pas une entorse ; il reste entier ailleurs.** |
| 17 | tech-lead ↔ narratif | **Compte de prédicats : 14/15 contre 11/12** | **RETENU : 12, compte du narratif** | ⚠ **C'est le MÊME ensemble compté deux fois, sauf un** — le tech-lead scinde par champ. **Le seul écart réel était l'unicité de couple, qu'il ACCEPTE.** ⚠ **La revue doit dire LEQUEL des deux comptes elle donne**, sinon elle comparera **deux grandeurs différentes**. |
| 18 | tech-lead | **Prédicat d'unicité sur `charge`/`place` seule** | **REJETÉ — amendé en unicité de COUPLE** | **Deux gardes partagent légitimement une `place` ; deux prétendants une `poursuite`.** *Un prédicat sur une seule clé refuserait une réponse juste.* **Seul le couple identique est du remplissage.** |
| 19 | ux ↔ narratif | **Ordre de `PARTIES_REQUISES`** | **RETENU : le synopsis d'abord** | **L'ORDRE décide quel champ l'écran nomme.** *Le manque le plus spécifique à CETTE carte avant le filtre générique des six rôles* — **on nomme le SUJET manquant, pas le STYLE.** Les deux rôles y arrivent séparément. |
| 20 | tech-lead | **`FicheBrouillon` dérivée de `Personnage`** (`Pick`/`Partial`/`Omit`) | **REJETÉ** | ⚠ **Toute dérivation SUIT le schéma** : le jour où `Personnage` gagne une prose, **le modèle gagne un champ sans qu'une ligne change**. La forme reste **écrite à la main et FERMÉE**. |
| 21 | tech-lead | **Réutiliser `But` comme type du champ imbriqué** | **REJETÉ** | `But` autorise `pourquoi` et `echeance` : **rouvrirait deux champs que personne ne valide**. `{ libelle: string }` est **assignable à `But` sans lui être égale**. |
| 22 | tech-lead | **Un espion tenu par un test-grep de source** | **REJETÉ** | Un `useMemo` de précalcul **est une occurrence de plus au même fichier** : ⚠ **le grep COMPTE, il ne SÉPARE pas.** |
| 23 | narratif / tech-lead | **`'cible-a-ecrire'` pour le synopsis manquant** | **REJETÉ** | ⚠ **Décisif** : le motif signifie « l'entité **CIBLE** n'a rien d'écrit ». Ici la cible est `monde.personnages[]`, **vide par définition** — **le refus serait vrai au moment précis où l'assistant doit servir**. |
| 24 | narratif / tech-lead | **`'aucun-candidat'` sur un monde vide** | **REJETÉ** | **Refuserait LE CAS NOMINAL du rôle** — le premier geste après l'écriture du synopsis. |
| 25 | tech-lead | **Promouvoir `ACCROCHE JOUEUR` « puisqu'on y est »** | **REJETÉ** | Injectée **mais jamais requise** ⇒ **aucune branche ne peut la nommer** ⇒ **ligne de registre sans producteur** (KR-235). La condition d'ouverture vaut **champ par champ**. |
| 26 | tech-lead | **Un second lot contrat pour le registre** | **REJETÉ** | ⚠ **Il n'existe AUCUN état vert intermédiaire** entre poser l'entrée et repointer la fiche : `libelles.test.ts` est **rouge** entre les deux. **La co-propriété est forcée, pas choisie.** |
| 27 | tech-lead | **Un 3ᵉ lot « worker »** | **REJETÉ** | `frontiere.test.ts` **soude** `INVITES` (worker) et `BUDGET_…` (brain) : **un lot qui n'ajoute le rôle que d'un côté est ROUGE SEUL.** *(7ᵉ instance du même refus)* |
| 28 | tech-lead | **`role` comme nom de champ réseau d'élément** | **REJETÉ — veto maintenu** | **Collision frontale** avec `CorpsDemande.role` **et** `Cible*.role` depuis 3c. |
| 29 | tech-lead | **Clé de liste `figures` / `personnages`** | **REJETÉ : `distribution`** | `personnages` est **le nom de la collection** ⇒ nommer le champ (veto 3b). Entre `figures` et `distribution`, **le tech-lead a cédé lui-même** : *« un seul mot doit rester debout »*, et `distribution` est **le mot de la démo**. |
| 30 | narratif | **Clés `metier` / `quete` / `objectif`** | **REJETÉES** | `metier` **RÉTRÉCIT** (un seigneur n'a pas de métier) · `quete` est **collection ET espace de noms** — *mordrait le scanner d'identifiants* · `objectif` est pris (KR-198). |
| 31 | narratif | **Injecter `but.libelle` des déjà écrits** | **REJETÉ** | ⚠ **C'est la MOITIÉ de ce que le modèle écrit** : l'injecter fait écrire **« autour » des buts déjà ratifiés** — une **constellation** de la distribution acceptée, exactement la panne que 3c a nommée. **La dé-duplication se joue sur la PLACE, pas sur le vouloir.** |
| 32 | narratif | **Injecter `description_joueur` des déjà écrits** | **REJETÉ** | *Montrer huit réputations publiques **invite à en écrire une*** — et c'est le canal que le n° 1 vient de fermer. |
| 33 | narratif | **Un `nom` proposé, même « provisoire »** | **REJETÉ** | KR-195 ; ⚠ **un nom provisoire SURVIVRAIT à la relecture parce qu'il a l'air rédigé**, et ce serait un optionnel semé (KR-221). |
| 34 | ux / tech-lead | **Un champ de saisie du nom à l'acceptation** | **REJETÉ** | Transforme *accepter/refuser* en *accepter/**éditer**/refuser* — **classe d'interaction neuve, sur la dernière itération, sans filet** — et imposerait un requis **plus strict que le schéma**. `nom` appartient à `BlocIdentite.tsx`. |
| 35 | tech-lead | **Dériver `nom` de `fonction` côté code** | **REJETÉ** | **Seconde règle de nommage, silencieuse**, plus un optionnel semé. |
| 36 | tech-lead | **Dériver l'identifiant du `nom` ou de la `place`** | **REJETÉ** | KR-003 ; `frapperIdentifiant` le refuse par construction — **deux forgerons se marcheraient dessus**. |
| 37 | ux | **Appeler `localiserEntite` sur un brouillon** | **REJETÉ — vérifié par l'orchestrateur** | ⚠ **Hors contrat de la fonction**, qui suppose un index **stable dans une collection PERSISTÉE**. Le dépôt tranche déjà dans l'autre sens : `libelleLigneAjoutJalon` rend **un littéral**, *« JAMAIS le repli "{Type} n°N (sans nom)" de `localiserEntite` (celui-là désigne une entité déjà persistée) »*. |
| 38 | ux | **Un badge ou un ton alarmiste sur « sans nom »** | **REJETÉ** | ⚠ **Ce n'est pas une erreur, c'est l'état normal d'un personnage neuf** : `mentionStyle`, jamais `refusSyncStyle`. |
| 39 | tech-lead | **Réutiliser `LigneReplique` deux fois par fiche** | **REJETÉ** | Donnerait **DEUX boutons « Accepter » pour un brouillon INDIVISIBLE** ; et `LigneReplique` reste réutilisable **précisément parce qu'elle ne porte aucun membre propre à un consommateur**. |
| 40 | narratif | **Des rangs `P1…Pn` sur les déjà écrits** | **REJETÉ** | Rien ne désigne personne : **table sans consommateur** (KR-235) **ET invitation à la référence croisée**. |
| 41 | narratif / tech-lead | **Réutiliser `CANDIDATS_MAX` pour le bloc des déjà écrits** | **REJETÉ** | ⚠ **Le SENS est INVERSE** : `CANDIDATS_MAX` borne des **désignables**, `DEJA_ECRITS_MAX` borne des **exclus**. **6ᵉ refus du registre partagé.** |
| 42 | tech-lead | **Aligner la borne de sortie sur ses trois jumelles** | **REJETÉ** | Même valeur aujourd'hui, **aucune raison commune d'évoluer**. **7ᵉ instance.** |
| 43 | tech-lead | **`type ContexteDistribution = ContexteProse`** | **REJETÉ** | Abstraction à un seul appelant (KR-109) — `ContexteProse` est **déjà réutilisé SANS alias par trois rôles**. |
| 44 | narratif / tech-lead | **Un 3ᵉ champ de prose (`apparence`)** | **REJETÉ** | +4 prédicats, **+~35 % de `max_tokens`**, et ⚠ **`apparence` est le seul des trois dont le retrait ne coûte aucune information** — *déjà servie par `personnage-prose`*. |
| 45 | narratif | **Un prédicat de non-doublon contre le DOSSIER** | **REJETÉ** | **Comparaison de PROSE**, pas de forme : **hors frontière testable** (KR-229). Se joue **au contexte**, jamais au validateur. |
| 46 | narratif | **Repêcher les fiches valides d'un lot fautif** | **REJETÉ** | **Réparation silencieuse** : l'auteur ratifierait **une distribution amputée sans le savoir** (KR-230). |
| 47 | narratif | **Recopier la ligne de nommage de 3c** | **REJETÉ** | ⚠ Son exemple **« celle qui tient la forge » AUTORISE la périphrase par la charge** — **la seule erreur de référence que ce rôle puisse commettre.** |
| 48 | narratif | **Une ligne d'invite « deuxième personne, présent, immersive »** | **REJETÉ** | `fonction` et `but.libelle` sont du **contexte injecté**, jamais émis verbatim — une prose en voix de scène **deviendrait fausse** le jour où le moteur l'injecterait. |
| 49 | narratif / tech-lead | **Une promesse d'écran sur « pas de doublons » ou « pas de renvois croisés »** | **REJETÉ** | **Aucun prédicat ne les constate. L'écran ne promet que ce qu'un instrument tient.** |
| 50 | narratif | **Une mémoire des fiches refusées** | **REJETÉ** | **Inventerait un état de session dans un éditeur qui n'en a pas.** La conséquence — *une fiche refusée peut revenir* — est **déclarée, pas masquée**. |
| 51 | narratif | **Un cinquième `MotifRefusContexte`** | **REJETÉ** | `a-ecrire` **avec charge** suffit dès l'entrée au registre ; **un motif sans charge serait strictement moins informatif**. |
| 52 | narratif | **Exercer `secret`, `camp` ou `objectif_id`** | **REJETÉ** | `moteur`. ⚠ **`camp` est en outre un SPOILER** : *un narrateur qui sait qu'un personnage est antagoniste le joue hostile avant que la scène ne l'ait révélé*. `objectif_id` est un **handle** — le modèle **écrirait une référence**. |
| 53 | narratif / tech-lead | **Injecter `canon.objectifs[]`** | **REJETÉ** | **Zéro clé `'ia'`** (mesuré) : sous garde stricte, **liste vide**. Ratifie « v1 sans rattachement aux objectifs ». |
| 54 | narratif | **Un scanner de noms propres** | **REJETÉ** | ⚠ **Instrument INVERSÉ** : il **rougirait sur une prose juste** et **resterait vert sur le nom inventé**. *Le livrer serait pire que rien.* |

## 9 — Innovation
*Aucune.* Les quatre décisions structurantes (second champ, cible à charge vide, contexte à cinq chemins, espion sur la frappe d'identifiant) s'appuient toutes sur un précédent livré ou sur une mesure.

## 10 — Définition de fini
- [ ] Porte verte : `format` → `typecheck` → `lint` → `test`
- [ ] `test:mutation` — **à constater sur le diff**, pas de mémoire *(aucun des 4 fichiers mutés n'est attendu au diff)*
- [ ] **Les onze mesures du § 5.1** exécutées et rapportées — ⚠ **dont les DEUX relevés de lignes** (`schemaSortie.ts` **avant docstrings**, `CopiloteService.ts`)
- [ ] **VU ROUGE avant d'être cru** : les six mutants du § 5.1-10 · **le mutant du précalcul d'identifiants** · chaque cas négatif des douze prédicats · **les trois témoins du prédicat de couple** · le cas négatif de `BORNE_EN_TOUTES_LETTRES` · les `@ts-expect-error` dont `const p: Personnage = brouillon`
- [ ] **`git diff --numstat`** sur la liste « zéro diff », **pas un grep**
- [ ] Critères du § 6 cochés un par un ; ⚠ **la revue dit LEQUEL des deux comptes de prédicats elle donne**
- [ ] Non-régression : `libelles`, `couverture`, `controles`, `curseurs`, `validate`, `destinations`, `relationsPresence`, et les **cinq** suites de cartes livrées — **vertes sans une retouche**
- [ ] **Relevé du budget de contexte ÉCRIT** — ⚠ `specification.json` de la feature est à **139 o** de son plafond ; `code-knowledge.json` à **72 o** ; le couple `CLAUDE.md`/`WORKFLOW.md` à **154 o**. **Il n'y a plus de marge : la compaction de cette itération devra être structurelle.**
- [ ] `bug_history` : tout constat de la revue de PR journalisé
- [ ] **`features_history.json` — ⚠ C'EST LA DERNIÈRE ITÉRATION DE LA FEATURE** : l'entrée de fin de feature s'écrit ici, pas ailleurs
- [ ] Revue : `.claude/raffinage/dossier-copilote-it4.revue.md`

## 11 — Signatures
| Rôle | Verdict | Réserve |
|---|---|---|
| PM | **RECEVABLE, aucun veto** | `fonction` requis ✔ · champ 2 tranché sur la valeur ✔ · borne à 3 ✔ |
| Tech Lead | **RECEVABLE** | **a cédé R1 sur sa propre doctrine** ✔ · baril relu ligne à ligne ✔ · deux relevés de lignes exigés ✔ |
| UX | recevable sous réserve | `LigneFichePersonnage` sœur ✔ · TL3a-3 **borné** ✔ · registre à 6, `BlocPlanActions` repointé ✔ |
| QA | **réserve DURCIE, satisfaite au plan** | espion nommé et porté par le critère #7 ✔ · critère de relevé de lignes en définition de fini ✔ |
| Narratif & IA | recevable sous réserve (R2, R3, R4) | ⚠ **a retiré son propre veto** ✔ · cinq chemins ✔ · **R4 reste un veto ARMÉ : qu'on ajoute un rang ou un handle à l'élément, et il tombe** |
