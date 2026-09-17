# Cadrage — feature n° 8 `dossier-copilote` (étape 0 de `/cadrer`)

Dépôt : `C:\Users\pierr\Desktop\genliv`. Version courante `0.6.43`. Les features n° 1 à 7 du Temps 1 sont **terminées** ; `dossier-copilote` est la **dernière feature du Temps 1**, et la première du dépôt à faire un appel à un modèle.

## L'intention (roadmap § 2, ligne n° 8)

> « …faire proposer un texte par l'IA, champ par champ »
> 3 assistants (**Éclater le synopsis**, **Compléter une fiche**, **Tisser les indices**), **toujours en proposition**, panneau de **diff accepté champ par champ**. La « Répétition à blanc » du plan de cible **n'est pas ici** — elle exige le moteur, elle est déplacée en n° 16.

Roadmap : **3 itérations prévues, comité à 5 rôles** (`narratif-ia` convoqué). Dépend de la n° 6 — satisfaite.

Plan de cible (`docs/PLAN-BASCULE-IA.dc.html` § 1.7, lignes 283-293), les trois assistants retenus :

- **Éclater le synopsis** — depuis le synopsis + les objectifs : propose la distribution (3 premiers plans, 4 seconds, 2 antagonistes) avec objectifs et une phrase de caractère.
- **Compléter une fiche** — propose curseurs, répliques types, plan d'actions en 4 étapes et relations plausibles avec les fiches déjà écrites.
- **Tisser les indices** — vérifie que chaque indice a au moins deux détenteurs ou sources, et propose qui d'autre pourrait le connaître, et à quelle condition.

## Ce qui existe déjà et sera réutilisé

- **`DossierService.update(id, recette) → EcritureDossier`** (`src/brain/DossierService.ts`) — le seul chemin d'écriture du dossier, cinq temps dont l'ordre EST le contrat, `validateDossier` avant toute écriture, `dossier:updated` émis après persistance (KR-004). Une proposition acceptée passe **par là**, jamais en direct.
- **Le schéma complet** — `src/brain/dossier/types.ts` (1 511 l.), treize racines, forme complète livrée par les n° 3 à 6. `validateDossier` (841 l.), `issues.ts` (20 codes fermés), `identifiers.ts` (`frapperIdentifiant`, `ESPACES_DE_NOMS`, `FORME_IDENTIFIANT`).
- **`destinations.ts`** (609 l.) — la table d'AUDIENCE de chaque champ terminal (`ia` | `moteur` | `auteur`), gardée par `couverture.test.ts`. Son propre en-tête dit : « **Aucun assembleur n'existe avant la n° 10** ; la table déclare l'intention et force la déclaration, elle ne démontre pas le confinement. » Elle n'est **pas** ré-exportée par `brain/index.ts`.
- **`controlerDossier`** (n° 7, `dossier/controles.ts`) — 9 règles livrées. **Dont la règle « indice à moins de deux producteurs » : bloquant à 0, alerte à 1** (`controles.ts` ~l. 860-890). La moitié DÉTECTION de « Tisser les indices » **est donc déjà livrée** ; le copilote n'apporte que la moitié PROPOSITION.
- **`MARQUEUR_A_ECRIRE = '⟨à écrire⟩'`** (`dossier/amorce.ts`) et les quatre proses semées (`texte_ouverture_joueur` bloquant, `synopsis_mj` / `accroche_joueur` / `ton` en alerte) — exactement les champs de départ de « Éclater le synopsis ».
- **`brain/components/`** : `Field`, `ListRow`, `Card`, `Badge`, `Modal`, `IssueList`, `Toggle`, `Select`, `SegmentedControl`, `TargetPicker`, `Stepper`, `IconButton`, `ImageUpload`, `OutcomesEditor`, `ObjectEditor`.
- **`DossierEditorScreen`** (`features/bascule-editeur`) — `panneaux?: Partial<Record<SectionId, ReactNode>>` + `panneauControles?: (onSelectSection: (s: SectionId) => void) => ReactNode` (**render-prop, prop SŒUR** de `panneaux`, jamais une onzième clé de section). Injection depuis `src/App.tsx`, racine de composition — aucune feature n'en importe une autre (KR-184).
- **`CloudSettingsService`** (`getWorkerUrl` / `getSyncKey` / `isConfigured`) et `CloudflareKVTransport` — **seul appelant `fetch` du dépôt** (2 sites).

## Ce qui n'existe pas du tout, et que cette feature doit créer

1. **Aucun appel à un modèle, nulle part.** `worker/index.ts` fait **111 lignes** et n'expose qu'une famille de routes, `/kv/:key` en GET/PUT/DELETE. Ni `ROUTE_LIMITS`, ni limiteur de débit, ni route SSE, ni réponse JSON d'IA (`docs/WORKFLOW.md`, § Worker Route Parity, qui le dit en toutes lettres).
2. **Aucun service `brain/` d'appel modèle**, aucun contrat de sortie, aucun comportement d'échec, aucun budget de contexte, **aucune infrastructure de prompt**. Le roadmap donne cette infrastructure à la **n° 10** (« Pose l'infrastructure de prompt et les garde-fous du § 2.8 »). Le copilote la poserait **avant** — c'est une inversion d'ordre du plan, à arbitrer explicitement.
3. **Aucun panneau de diff** nulle part dans le dépôt.
4. **Aucune clé d'API, aucun réglage de modèle** — `CloudSettingsService` ne porte que l'URL du worker et la clé de sync.

## Ce qui sera remplacé

**Rien.** La feature est purement **additive**, comme les n° 5 et n° 6. Aucune démolition n'est planifiée ici (`playExport`, `Book`/`Edge`, `tree-canvas` partent en n° 9).

## Décisions du roadmap qui contraignent ce cadrage

- **D2 (§ 1)** — *tous les appels IA passent par le worker*. Clé d'API jamais côté client, **une route par rôle IA**, SSE pour la narration. Chaque route neuve suit la checklist **Worker Route Parity**. **Le hors-ligne n'est pas traité en v1** : sans worker joignable, on s'arrête proprement sur un message, on ne dégrade pas vers un modèle local.
- **Décision n° 4 (§ 0)** — *l'IA ne lance jamais les dés et ne modifie jamais une statistique*. Or « Compléter une fiche » propose des **curseurs** (six entiers, destination `moteur`, `dossier/curseurs.ts`) ; le schéma porte aussi `stats` (huit caractéristiques, `moteur`, bloc TOTAL quand présent) et `Revelation.jet { carac, tc }`.
- **Décision n° 2** — un seul modèle, un seul niveau d'effort en v1, mais **le code prévoit un routeur de modèle et d'effort** : point d'extension **nommé dans le worker**, pas livré.
- **Décision n° 3** — à chaque fourche, la version la plus bête qui marche, pourvu que le point d'extension soit nommé.
- **Décision n° 6** — identifiants stables partout. Le modèle ne frappe **jamais** un identifiant : `frapperIdentifiant` est du code.
- **Garde-fou § 2.8 « Aucune création d'entité »** — écrit pour le **jeu** : « l'IA ne peut référencer que des identifiants existants du dossier ». Or « Éclater le synopsis » **crée neuf personnages**. La frontière rédaction / jeu doit être écrite, sinon la contradiction apparente sera redécouverte au Temps 2.
- **Garde-fou § 2.8 « Sortie structurée obligatoire »** — objet typé validé par schéma, une sortie non conforme est **rejouée une fois** puis dégradée.
- **Décision A (2026-08-04), corollaire non négociable (veto tech-lead)** — `brain/dossier/types.ts`, `destinations.ts` et `validate.ts` ne sont **jamais** dans un lot de type `feature` : toute feature qui ajoute un champ au schéma ouvre un lot `contrat`, **seul et en premier**.
- **KR-167** — aucune fonction ne convertit un `Book` en `Dossier` ni l'inverse.

## Features voisines impactées

- **`bascule-editeur`** — si le copilote reçoit sa propre destination de navigation (précédent exact : « Contrôles »), `DossierEditorScreen.tsx` gagne une **troisième prop sœur** : fichier possédé par `bascule-editeur`, donc lot `contrat`. L'alternative — un bouton dans chaque panneau de section — toucherait `PanneauCanon`/`PanneauPersonnages`/`PanneauIndices`, fichiers possédés par `dossier-canon`, `dossier-fiches` et `dossier-registres` : **propriété exclusive de fichier, veto tech-lead** (précédent KR-200, `lieux[].acces`). **C'est la question de découpage n° 1.**
- **`cloud-sync`** — `worker/index.ts` est partagé et n'a aucun propriétaire de feature déclaré ; les routes IA y atterrissent.
- **`dossier-controles`** — précédent de surface (nav + panneau + render-prop) et **source déjà livrée** du diagnostic « indice sans deux producteurs ».
- **`dossier-canon` / `dossier-fiches` / `dossier-registres`** — propriétaires des écrans où une proposition acceptée se verra.

## État du budget de contexte, mesuré ce jour (octets en LF de l'index git)

| Fichier | Mesuré | Plafond | État |
|---|---:|---:|---|
| `CLAUDE.md` + `docs/WORKFLOW.md` | 46 052 | 46 080 | **28 o de marge** — saturé |
| `code-knowledge.json` | **77 456** | 76 800 | **AU-DESSUS de +656 o** |
| `bug_history.json` | 9 775 | 10 240 | ok |
| `features_history.json` | 9 730 | 10 240 | ok |
| `docs/ROADMAP-BASCULE-IA.md` | 35 493 | 35 840 | 347 o de marge |
| `specification.json`, par feature | max 66 436 | 66 560 | ok |

`.claude/raffinage/dossier-controles-it10.revue.md` (l. 78) : le dépassement de `code-knowledge.json` a été **arbitré par l'humain — livrer, puis compacter avant la n° 8**, propriétaire recommandé « une tranche `outillage` avant la n° 8 », et **« le fichier ne reçoit plus rien d'ici là »**. Or `/cadrer` produit des `known_risks` dont `CLAUDE.md` exige le miroir dans `code-knowledge.json`. **À trancher au tour 3.**

Prochain identifiant de risque disponible : **KR-229** (le dernier écrit est KR-228).

## Composition du comité

**Cinq rôles** — les quatre socles **plus `narratif-ia`**. Motif écrit, non discrétionnaire : le roadmap (§ 4, l. 220) réserve `narratif-ia` aux n° 1, 4, 7, **8** et tout le Temps 2 ; et cette feature est la **première du dépôt à toucher un prompt, un contrat de sortie de modèle et un budget de contexte** — exactement le domaine de veto de ce rôle.
