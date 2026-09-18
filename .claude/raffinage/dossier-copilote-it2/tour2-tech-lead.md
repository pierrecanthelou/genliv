# Tour 2 — `tech-lead` · `dossier-copilote` it2

```
RISQUE      — Le découpage, pas le contrat. J'ai MESURÉ la seule chose qui décide
              d'un lot : les trois suites de la feature bouchonnent le copilote par
              `brain.copilote = { estDisponible, demander }` (panneauCopilote:55,
              acceptation:54, useDemandeCopilote:37). AJOUTER une méthode à
              `CopiloteService` casse ces trois assignations — le lot contrat ne
              passerait plus `tsc` seul. Le paramètre est annoté `jest.Mock` NU
              (= `Mock<any,any>`), donc une méthode SURCHARGÉE, elle, passe. Toute la
              frontière des lots tient sur ce fait.

OBJECTION   — `narratif-ia` C4 : une union discriminée par le rôle sur UNE méthode
              non surchargée. Je réponds nommément : elle ferme le même état illégal
              que mes deux méthodes, mais elle force l'appelant à rétrécir la branche
              de succès au runtime alors qu'il connaît son rôle à la compilation — et
              surtout elle fait entrer les 3 bouchons dans le lot contrat. Je concède
              le fond (le rôle cesse d'être un paramètre libre) par une SURCHARGE sur
              le littéral de rôle : `demander('indice-detenteurs', d, {entiteId,champ})`
              devient une erreur de compilation, et zéro fichier de feature bouge.

PROPOSITION — 2 lots, frontière = préfixe de chemin : lot 1 ∌ `src/features/**`,
              lot 2 ⊂ `src/features/dossier-copilote/**`. Disjonction prouvable d'un
              grep. C5 tranché : `destinations.ts` + `dossier/types.ts` +
              `couverture.test.ts` ENTRENT au lot 1.

VERDICT     — recevable sous réserve. Une seule réserve dure : TL-7 et TL-8 passent
              en VETO.
```

---

# ANNEXE

## 0 — Ce que je n'ai PAS pu mesurer, et c'est une limite d'outillage

**Je n'ai aucun outil d'exécution dans cette session** (Read/Grep/Glob seulement) : je n'ai pas pu rejouer `libelles.test.ts` ni `frontiere.test.ts`. Ce que j'ai fait à la place est une **lecture d'assertions littérales, ligne à ligne, avec le littéral cible en main** — strictement plus fort qu'au tour 1, strictement moins fort qu'un run. **Toute affirmation de couleur ci-dessous est à rejouer par `dev-contrat` avant signature** (`npx jest src/brain/dossier/libelles.test.ts worker/frontiere.test.ts src/brain/dossier/couverture.test.ts`). Je les marque `LU`, jamais `MESURÉ`.

Faits `LU` décisifs :
- `src/features/dossier-registres/components/FicheIndice.tsx:131` porte `label="VÉRITÉ"` et `hint="MJ — jamais vue du joueur"`.
- `src/brain/dossier/libelles.test.ts:131-140` exige, pour **chaque** entrée du registre, **zéro** porteur de `label="<libellé>"` dans tout `src/` hors tests. `:43` épingle `toHaveLength(4)` + la liste exacte.
- `src/brain/copilote/contexte.ts:61` — `PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]>`. Le type interdit d'y écrire `monde.indices[].verite` sans l'entrée de registre.
- `worker/frontiere.test.ts:31` importe `BUDGET_CARACTERES_CONTEXTE` en **scalaire** (employé l. 269/275/281) : le passage au `Record` fait échouer `tsc` sur ce fichier. Il ne peut donc pas rester en l'état, quoi qu'on décide.
- `couverture.test.ts` porte l'instrument « prédicat présent aux DEUX sites, mot pour mot » **trois fois** (`cede_si` l.1309, `secret` l.1350, `manifestation` l.1388) — et **aucune** pour `verite`. Les deux sites de `verite` (`destinations.ts:412-425`, `types.ts:1048-1060`) ne sont épinglés par **aucun** test aujourd'hui.
- Aucun test de la feature n'assert la phase `'decide'` (grep `tests/` : zéro occurrence).
- `RoleCopilote` est exporté par `brain/index.ts:131` mais **n'est employé par aucun fichier de feature**.

## 1 — Les onze conflits, tranchés

### C1 — la certitude · **JE CONCÈDE À `narratif-ia`, intégralement**
Leur mesure emporte la décision : `certitude` ne décide de rien dans `atteignabilite.ts`, donc un `croit` éteint l'alerte comme un `sait` — le copilote effacerait son propre déclencheur avec une information fausse. **`DetenteurRendu` disparaît**, et je vais plus loin qu'eux : `DetenteurResolu` disparaît aussi. La proposition résolue est `{ indiceId, personnageIds: readonly string[] }`, la certitude étant posée par la carte depuis `CERTITUDE_INITIALE` (déjà exporté par `brain/index.ts:276`, **une seule autorité, la même que l'éditeur manuel**).
Bénéfice non prévu : l'invariant it1 « ZÉRO clé commune entre forme réseau et forme résolue » est **restauré** (`detenteurs` vs `personnageIds`), et la note d'invariant que j'avais écrite au tour 1 (§ A.1) **tombe, sans objet**.

### C2 — liste vide · **JE CONCÈDE**
Mon prédicat (4) est **retiré**. Motif : le prédicat de non-vacuité de l'it1 portait sur une **prose scalaire** (une chaîne vide est une non-réponse) ; une **liste** vide est une réponse. `{"detenteurs": []}` est un **succès**, branche `propose` à zéro élément. `'vide'` reste dans `MotifIllisible` — il a toujours son producteur, `validerSortie` — mais `validerDetenteurs` ne peut pas le rendre, et sa signature le dit littéralement.

### C3 — nom du rôle · **`'indice-detenteurs'`, MAINTENU**
Motif, et il est grammatical, pas dogmatique : le nom existant `personnage-prose` se lit **`<entité CIBLE>-<ce qu'on demande>`** — « la prose d'un personnage ». Par la même grammaire, la cible est l'indice et la demande porte sur ses détenteurs → `indice-detenteurs`. `personnage-detenteurs` se lirait « les détenteurs d'un personnage », qui ne veut rien dire. Second argument, vérifiable : le nom du rôle doit appairer le type de cible (`CibleIndice { indiceId }`) — c'est ce qui rend la surcharge lisible au point d'appel. Le commentaire de `types.ts:10-14` motive la règle par « un lieu et un personnage ne partagent aucun chemin injecté » ; ici les deux familles de chemins sont injectées, donc la règle **sous-détermine** et la grammaire tranche.

### C4 — forme de la cible · **SYNTHÈSE, pas compromis**
- **Surface publique** : UNE méthode `demander`, **surchargée sur le littéral de rôle**. Le rôle cesse d'être un paramètre libre (ce que `narratif-ia` demande), l'appairage (rôle, cible) est fermé à la compilation (ce que je demande), le type de retour reste exact par branche (ce que la carte consomme), **et les trois bouchons de test survivent** (ce que le découpage exige).
- **Interne** : l'union discriminée de `narratif-ia` vit là où le dispatch vit réellement — deux fonctions d'assemblage nommées, pas un paramètre `role`.
- Implémentation sans `as` : déclarer `demander` comme **fonction à surcharges** dans le corps de `createCopiloteService` (deux signatures + une implémentation élargie), puis `return { estDisponible, demander }`. La variable porte alors exactement le type de l'interface.

### C5 — la condition d'état de `verite` · **LES DEUX SITES ENTRENT AU LOT 1**
Ils quittent ma liste « hors lot ». Coût de non-régression, `LU` :
1. `DESTINATION_DES_CHAMPS['monde.indices[].verite']` **reste `'ia'`** — la ré-écriture ne touche que du **commentaire**. Zéro changement de comportement, zéro ondulation `tsc` (le JSDoc de `Indice.verite` n'est pas un type).
2. L'épinglage d'audience `couverture.test.ts:957` (`['monde.indices[].verite','ia']`) reste vert : la valeur ne bouge pas.
3. Aucun instrument « deux sites » ne vise `verite` aujourd'hui → **rien ne rougit du seul fait de réécrire**.
4. Contrepartie **obligatoire et dans le même lot** : une **quatrième instance** de l'instrument existant (`couverture.test.ts`, patron de `secret`/`cede_si`/`manifestation`) — le paragraphe est LU du JSDoc de `Indice.verite` et cherché dans `destinations.ts`, jamais écrit en littéral dans le test (troisième porteur interdit). Sans elle, R1 (« jamais contournée en silence ») n'a aucune porte : une ré-écriture à un seul site est exactement le contournement silencieux.
5. La clause (b) de `narratif-ia` (« le schéma de sortie du rôle ne peut porter aucune prose ») se teste dans **`schemaSortie.test.ts`**, déjà au lot : `CLES_SORTIE_DETENTEURS` vaut `['detenteurs']`, et toute valeur non-chaîne-de-rang est refusée. Aucun fichier neuf.

### C6 — `LIBELLES_CERTITUDE` · **REJETÉ pour cette itération, REPORTÉ avec condition d'ouverture**
L'objection UX est **fondée** — un registre de langue à deux domiciles dérive — mais les deux issues sont fermées ici : promouvoir exige de modifier `dossier-fiches/components/BlocSavoirs.tsx` (interdit, critère 14, exception bornée et non renouvelable) ; retaper localement crée le second domicile qu'elle dénonce.
**Sortie, et elle est meilleure que les deux** : C1 étant tombé, la certitude vaut **toujours** `'sait'` — un `Badge` par ligne afficherait une constante comme si c'était une donnée. **La carte 2 n'affiche aucun libellé de certitude.** Elle porte **une** phrase, une seule fois, dans `textes.ts` (`MENTION_CERTITUDE`), qui dit que les détenteurs acceptés sont enregistrés comme sachant l'indice et où l'ajuster. Zéro registre, zéro fichier interdit, et l'auteur est mieux informé qu'avec trois badges identiques.
**Condition d'ouverture du report** : la première itération autorisée à toucher `dossier-fiches` ET ayant un second consommateur réel des trois libellés.

### C7 — `LIBELLE_DES_CHAMPS` · **TL-8 MAINTENUE et DURCIE EN VETO**
Le refus du rôle détenteurs **ne nomme aucun champ par le registre** — il le nomme **en prose, côté feature**. Mécanisme exact :
- un motif **neuf sans charge** : `{ motif: 'cible-a-ecrire' }` dans `MotifRefusContexte` (il ne *peut pas* réutiliser `a-ecrire`, dont le `chemin` est typé `CheminLibelle` et n'admet pas `monde.indices[].verite`) ;
- le texte actionnable vit dans `textes.ts` de la feature et nomme « la vérité de cet indice » **en français courant**, pas en `label` MONO.
Pourquoi ce n'est pas un contournement : `libelles.test.ts:131-140` surveille la **forme `label="…"`**, pas le mot (son propre commentaire l. 132-135 le dit) ; et les deux tests d'unicité de `hint` (l. 142-151) n'itèrent que sur deux chemins codés en dur. Une phrase de prose ne les touche ni l'un ni l'autre.
Le VETO porte sur l'autre branche : faire entrer la 5ᵉ entrée obligerait soit à éditer `FicheIndice.tsx` (`dossier-registres`, interdit — et c'est un détail d'implémentation d'un composant voisin manipulé à distance), soit à **modifier le témoin** pour le faire taire — « une garde qui apprend à modifier son témoin est pire que pas de garde », littéralement écrit l. 165-168 du fichier lui-même.

### C8 — `useDemandeCopilote.ts` · **LOT 2. Je retire ma recommandation du tour 1.**
Motif, et c'est une mesure qui m'a fait changer d'avis : le hook n'a besoin de rien de neuf **si le contrat ne casse pas la voie prose**. Avec la surcharge (C4), `const ROLE = 'personnage-prose' as const` (hook l. 12) reste un **littéral**, donc l'appel l. 68 résout la première surcharge et compile inchangé ; `ReponseCopilote` reste non générique ; `texteEchec(reponse: ReponseCopilote)` (`PanneauCopilote:65`) compile car sa cascade a une branche de repli, pas de contrôle d'exhaustivité.
**Conséquence exacte sur les deux listes** : `hooks/useDemandeCopilote.ts` et `tests/useDemandeCopilote.test.tsx` **sortent du lot 1 et entrent au lot 2**. Le lot 1 ne nomme **plus aucun fichier de `src/features/`**, et le lot 2 les possède tous. La frontière devient un préfixe de chemin.

### C9 — bornes · **compatibles, et voici la composition**
```
K  = CANDIDATS_MAX = 8                      ← variable LIBRE (contexte.ts)
M  = longueur du contexte assemblé, K SATURÉ, indice le mieux rempli
BUDGET_CARACTERES_CONTEXTE['indice-detenteurs'] = ceil(M × 3 / 1000) × 1000
TAILLE_MAX_CORPS_IA = max sur les rôles de ceil((3 × budget[rôle] + E[rôle]) / 1024) × 1024
PROPOSITIONS_MAX = 3   (schemaSortie.ts)  ─┐ deux moitiés d'une même borne,
max_tokens = 100       (worker/index.ts)  ─┘ dérivées dans le même lot
```
Le `Record` est le **contenant** ; K est ce qu'on tourne. Règle inscrite au plan : **si la mesure déplaît, on baisse K — on ne monte jamais le budget.** Trois domiciles, un par autorité : K à l'assembleur, `PROPOSITIONS_MAX` au validateur, `max_tokens` à l'invite. Duplication **nommée et assumée** : l'invite dit « jamais plus de trois » en toutes lettres alors que `PROPOSITIONS_MAX` vaut 3 — l'invite persuade, le validateur décide ; personne ne « corrige » ça par un import (le worker n'importe pas `src/brain/`).

### C10 — `entitesInjectees` · **MAINTENU, reformulé — et l'orchestrateur a raison**
La dérivation demandée est **impossible** : `entitesInjectees` doit porter l'indice cible, qui n'a **pas** de rang. Mais l'objection KR-117 de `narratif-ia` est juste sur le fond, alors je supprime sa cause : **une seule traversée, deux projections**. Chaque candidat retenu pousse son identifiant dans `entitesInjectees` **et** son rang dans `rangs` dans la même itération de boucle ; ce ne sont pas deux listes à tenir en phase, c'est un sous-produit. Invariant asserté : `[...rangs.values()] ⊆ entitesInjectees`, et `entitesInjectees` contient en plus l'indice cible.
Corollaire de forme : **deux types de contexte**, pas un champ `rangs` vide pour le rôle prose (`ContexteProse` / `ContexteDetenteurs`) — l'état illégal « une prose avec des rangs » n'est pas représentable.

### C11 — le cas de recette · **composé en mémoire, jamais la fixture**
Le précédent existe et il est dans le fichier même : `contexte.ts:80-83` documente que l'entité de mesure de l'it1 est **composée par `contexte.test.ts`**, « la fixture n'appartenant pas à ce lot ».
- **Cas passant** (contrat et feature) : dossier cloné de la référence, un indice avec `verite` **et** `formulation_joueur` écrits, dont on retire un producteur pour qu'il soit signalé, et K candidats. Composition en mémoire, dans le test qui en a besoin.
- **Cadeau mesuré pour la QA** : le **refus** `cible-a-ecrire` se démontre, lui, sur la fixture **INTACTE** — `indice.trace-du-guet` est l'unique constat `indice-sans-source` (`controles.test.ts:1143-1147`, assertion verte) et il n'a **ni** `verite` **ni** `formulation_joueur`. Le chemin nominal et le chemin de refus ont donc chacun leur support, et le second ne coûte aucune composition.

## 2 — Statut de mes treize `REJETÉ` et de mon objection · formulés pour le § 8 (BUG-082)

| # | Désaccord | Statut | Motif — recopiable tel quel |
|---|---|---|---|
| TL-1 | Une cible commune `CibleCopilote {entiteId, champ?}` pour les deux rôles | **MAINTENUE** | Rend représentable « une demande de prose sans champ » et « une demande de détenteurs avec un champ ». Deux types de cible, appairés au rôle par la surcharge. |
| TL-2 | Une seule méthode `demander(role, dossier, cible, signal?)` **non surchargée** | **MAINTENUE, REFORMULÉE** | Le couple (rôle, cible) y devient un état illégal représentable et le type de retour cesse d'être lisible — **« sans surcharges »**, mot que portait déjà mon motif du tour 1. La forme **surchargée sur le littéral de rôle** est RETENUE : elle ferme l'appairage à la compilation ET ne casse aucun bouchon de feature. |
| TL-3 | Rendre `CLES_SORTIE` générique pour piloter les deux validateurs | **MAINTENUE** | Un registre paramétré pour une prose scalaire ET une collection donne une déclaration unique à deux formes sans raison d'évoluer ensemble. Deux registres littéraux. |
| TL-4 | Un `if (role === 'indice-detenteurs')` dans `assemblerContexte` | **RETIRÉE — je me suis trompé, et c'est mesuré** | J'avais écrit « le corps est le même, seule l'origine des chemins diffère ». **Faux** : les deux rôles diffèrent sur **cinq** points (racine des chemins, blocs numérotés, troncature à K, champ cible exclu — prose seulement, champ cible requis — détenteurs seulement). Une table de portées n'en couvrirait que deux et laisserait les trois autres en branches de rôle : une abstraction à moitié vraie coûte plus qu'aucune. **Retenu à la place : deux fonctions nommées (`assemblerProse`, `assemblerDetenteurs`) partageant les primitives (`textesDuChemin`, `estRedige`, le bloc, la garde de budget), zéro branche de rôle dans l'un ou l'autre corps.** C'est exactement le biais que mon poste doit surveiller : abstraire trop tôt. |
| TL-5 | Un drapeau `numerotee: boolean` sur chaque portée | **RETIRÉE — sans objet** | `Portee`/`ProfilRole`/`PROFILS` disparaissent avec TL-4. |
| TL-6 | Accepter les rangs valides d'un lot et écarter ceux qui ne résolvent pas | **MAINTENUE** | Réparation silencieuse : l'auteur ratifierait une liste tronquée sans le savoir. `narratif-ia` converge. Hors de mon domaine de veto — objection, pas blocage. |
| TL-7 | Filtrer à l'acceptation les détenteurs qui détiennent déjà l'indice | **DURCIE EN VETO** | Deux autorités pour un même prédicat de candidature — c'est la **source de vérité dupliquée**, terrain de mon veto. Le prédicat vit dans l'assembleur, qui **ne numérote pas** un détenteur actuel : ceux-là sont *inénonçables*, pas *filtrés*. Un filtre à l'acceptation divergerait au premier changement, sans qu'aucun test ne le voie. |
| TL-8 | Une cinquième entrée (`monde.indices[].verite`) dans `LIBELLE_DES_CHAMPS` | **DURCIE EN VETO** | `LU` (non rejoué, à confirmer d'un `jest` ciblé) : `FicheIndice.tsx:131` porte `label="VÉRITÉ"`, et `libelles.test.ts:131-140` exige **zéro** porteur de `label="<libellé>"` dans tout `src/` hors tests — la 5ᵉ entrée fait donc rougir le registre, et la seule façon de le reverdir est d'éditer `dossier-registres` (interdit à cette feature depuis l'it2) ou de modifier le témoin (interdit par le témoin lui-même, l. 165-168). `toHaveLength(4)` + la liste exacte de `:43-51` rougissent en prime. **Le refus du rôle détenteurs ne nomme donc aucun champ par le registre : il le nomme en prose, dans `textes.ts`, via le motif neuf `'cible-a-ecrire'`.** |
| TL-9 | Un `BUDGET_CARACTERES_CONTEXTE` scalaire re-dérivé sur le rôle le plus large | **MAINTENUE** | Desserrerait la garde du rôle étroit par la mesure d'un rôle voisin, sans un seul test rouge (KR-235). `Record<RoleCopilote, number>`, une mesure par rôle. |
| TL-10 | Garder le test de LIAISON sur `ROLE = 'personnage-prose'` + un second `it` | **MAINTENUE, renforcée** | Le pouvoir séparateur des deux canaris ne vaut que pour le rôle qui sature le plafond. Nouveau fait `LU` : `frontiere.test.ts:31` importe `BUDGET_CARACTERES_CONTEXTE` en **scalaire** et l'emploie l. 269/275/281 — le passage au `Record` fait **échouer `tsc`** sur ce fichier ; le laisser tel quel n'est même plus une option disponible. |
| TL-11 | Découper l'extraction KR-112 et la carte 2 en deux lots | **MAINTENUE** | Les deux nomment `PanneauCopilote.tsx` : propriété exclusive violée. Les séparer exigerait un emplacement pré-câblé pour un unique consommateur (KR-109), ou un fichier créé par un lot et remplacé par l'autre. |
| TL-12 | Un troisième lot `worker/` seul | **MAINTENUE** | `worker/frontiere.test.ts` importe des **deux** côtés de la frontière : c'est sa raison d'être (docstring l. 23-26). |
| TL-13 | Conserver la phase `'decide'` dans `useDemandeCopilote` en plus de la décision portée par la carte | **MAINTENUE, mesurée** | Deux états pour ce qui est affiché — la forme rejetée nommément au raffinage de `dossier-controles` it1 et livrée quand même (BUG-082). Avec une décision **par ligne**, elle devient inexprimable. Fait `LU` : **aucun test de la feature n'assert `'decide'`** (grep sur `tests/`, zéro occurrence) — la sortir ne casse aucun témoin, et `PanneauCopilote` porte **déjà** `decisionAffichee` (l. 93-96), qui devient l'unique état. |
| **Objection du tour 1** — « aucun entier ne sort d'un modèle » est faux si le rang est un `number` | — | **RETIRÉE parce que SATISFAITE** | Le comité converge : rang = **jeton-chaîne `P1…PN`**, validé par **appartenance** à `ContexteDetenteurs.rangs`, **aucune conversion numérique nulle part** (`Number`, `parseInt`, indexation arithmétique interdits). La phrase du goal devient littéralement vraie ; les cinq prédicats numériques n'ont jamais à être écrits. |

### Cinq `REJETÉ` neufs, issus du tour 2 (à recopier au § 8 eux aussi)

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| TL-14 | Promouvoir `LIBELLES_CERTITUDE` de `dossier-fiches/components/BlocSavoirs.tsx` vers `brain/dossier/types.ts` dans cette itération | **REJETÉ / REPORTÉ** | La promotion exige de modifier `dossier-fiches` (critère 14 : exception bornée à l'it1, **non renouvelable**) ; la retaper localement crée le second domicile que l'objection UX dénonce à juste titre. C1 étant tombé, la certitude vaut toujours `'sait'` : la carte 2 n'affiche **aucun** libellé de certitude et porte **une** phrase (`MENTION_CERTITUDE`). Report ouvert quand une itération pourra toucher `dossier-fiches` avec un second consommateur réel. |
| TL-15 | Un lot contrat qui **AJOUTE une méthode** à `CopiloteService` (`demanderProse`/`demanderDetenteurs`) | **REJETÉ** | `LU`, trois sites : `brain.copilote = { estDisponible, demander }` (`panneauCopilote.test.tsx:55`, `acceptation.test.tsx:54`, `useDemandeCopilote.test.tsx:37`). Une méthode de plus rend ces trois littéraux incomplets ⇒ le lot contrat **ne passe plus `tsc` seul**, ce qui est interdit, et il doit alors happer des fichiers de feature que le lot 2 doit posséder. La **surcharge** franchit le même test : le bouchon est annoté `jest.Mock` nu (`Mock<any,any>`), assignable à n'importe quelle signature d'appel. |
| TL-16 | Donner un paramètre de type par défaut à `ReponseCopilote<P = PropositionResolue>` pour ne pas toucher aux fichiers de feature | **REJETÉ** | Un shim permanent écrit pour satisfaire une frontière de lot, qui fait en outre silencieusement signifier « réponse du rôle prose » à un nom générique. On écrit **deux unions nommées** partageant `EchecCopilote` — deux lignes, zéro ambiguïté. |
| TL-17 | Un registre-valeur `ROLES_COPILOTE = [...] as const` pour itérer sur les rôles | **REJETÉ** | `Record<RoleCopilote, …>` donne déjà la totalité **à la compilation** (`GABARIT_SORTIE`, `CHAMPS_INJECTES`, `PARTIES_REQUISES`, `BUDGET_CARACTERES_CONTEXTE`). Le seul consommateur d'une liste à l'exécution est un test, qui dérive ses clés du `Record` du côté brain et les compare à celles d'`INVITES` côté worker — c'est exactement le garde « un rôle sans entrée » demandé, sans registre neuf. |
| TL-18 | Partager `actionsStyle`/`lienStyle` entre `LigneProposition.tsx` et `LigneDetenteur.tsx` | **REJETÉ** | Rouvrirait un fichier livré et intact pour deux objets de style, entre deux composants dont la divergence est **attendue** (un diff `Field` contre un nom + actions). La duplication est nommée et assumée ici ; elle ne l'est pas pour un registre de langue (TL-14), et c'est la différence : deux dispositions flex identiques ne sont pas un mot français à deux orthographes. |

## 3 — DÉCOUPAGE FINAL · **2 lots séquentiels, aucun essaim, aucun worktree, aucune fusion**

> **La frontière des lots EST la frontière de feature.** Lot 1 ne nomme **aucun** fichier sous `src/features/` ; lot 2 ne nomme **que** des fichiers sous `src/features/dossier-copilote/`. La disjonction se vérifie d'un préfixe de chemin, pas d'une relecture ligne à ligne. C'est la propriété qui a manqué à toutes mes autres tentatives de découpage.
> **Le lot 1 passe `tsc --noEmit` + `jest` SEUL** — et c'est la contrainte qui a dicté la surcharge (C4/TL-15/C8).

### Lot 1 — `second-role` · **`contrat`** · seul, en premier · `dev-contrat` (effort **élevé**)

But : faire exister le rôle `indice-detenteurs` de bout en bout **sans aucun écran** — condition d'audience ré-écrite et épinglée, invite, gabarit apparié, schéma de sortie, assembleur, table des rangs, re-résolution, les deux budgets re-dérivés, protocole amont ratifié.

**Ordre interne imposé** : `dossier/types.ts` + `dossier/destinations.ts` + `couverture.test.ts` (la permission d'injecter `verite`, **d'abord** — tout le reste en dépend) → `copilote/types.ts` → `copilote/schemaSortie.ts` (+ test) → `copilote/contexte.ts` (+ test, **la mesure de M**) → `worker/index.ts` (+ `index.test.ts`) → `worker/frontiere.test.ts` → `CopiloteService.ts` (+ test) → `brain/index.ts` **en dernier**.

| Fichier | N/R |
|---|---|
| `src/brain/dossier/types.ts` | R |
| `src/brain/dossier/destinations.ts` | R |
| `src/brain/dossier/couverture.test.ts` | R |
| `src/brain/copilote/types.ts` | R |
| `src/brain/copilote/schemaSortie.ts` | R |
| `src/brain/copilote/schemaSortie.test.ts` | R |
| `src/brain/copilote/contexte.ts` | R |
| `src/brain/copilote/contexte.test.ts` | R |
| `src/brain/CopiloteService.ts` | R |
| `src/brain/CopiloteService.test.ts` | R |
| `src/brain/index.ts` | R |
| `worker/index.ts` | R |
| `worker/index.test.ts` | R |
| `worker/frontiere.test.ts` | R |

- **EXPOSE** (via `brain/index.ts`) : `CibleIndice`, `ReponseDetenteurs`, `EchecCopilote`, `PropositionDetenteurs`, `RoleCopilote` (2 membres), `MotifIllisible` (+`'rang-inconnu'`), `CopiloteService` à `demander` **surchargée**. Inchangés et non renommés : `CibleCopilote`, `ReponseCopilote`, `PropositionResolue`, `CHAMPS_PROPOSABLES`.
- **N'EXPOSE PAS** : `RangInjecte`, `DetenteursRendus`, `validerDetenteurs`, `GABARIT_SORTIE`, `PROPOSITIONS_MAX`, `CANDIDATS_MAX`, `BUDGET_CARACTERES_CONTEXTE`, `CHAMPS_INJECTES`, `PARTIES_REQUISES`, `assemblerProse`, `assemblerDetenteurs`, `ContexteProse`, `ContexteDetenteurs`, `MotifRefusContexte`. **La table des rangs ne sort jamais de `brain/copilote/` — KR-231 tenu par la PORTÉE, pas par une convention.**
- **CONSOMME sans les modifier** : `CERTITUDES`/`Certitude`/`CERTITUDE_INITIALE`, `MARQUEUR_A_ECRIRE`, `collectIds`, `ESPACES_DE_NOMS`, `DESTINATION_DES_CHAMPS` (import profond, **garde de test, jamais pilote** — KR-232), `CloudSettingsService`.
- **Ferme `open_questions` n° 4** : **Anthropic Messages, version épinglée `2023-06-01`, ratifié comme décision de comité.** Les deux passages de `worker/index.ts` qui écrivent « C'EST LE CHOIX DE L'OUVRIER, PAS UNE DÉCISION DU COMITÉ » (l. 188-194 et l. 258-262) sont **ré-écrits** dans ce lot. Exigence : le second rôle **n'étend pas le couplage** — `premierTexte` et le bloc de requête de `handleIa` restent les deux seuls sites ; `INVITES['indice-detenteurs']` n'apporte que `{systeme, max_tokens}` ; ni `tool_use` ni `response_format`.

### Lot 2 — `deux-cartes` · feature · démarre **contrat figé** · `dev-lot` (effort standard)

But : la carte 2 active, l'extraction KR-112, l'acceptation détenteur par détenteur, la consommation d'`estDisponible`.

| Fichier | N/R |
|---|---|
| `src/features/dossier-copilote/components/PanneauCopilote.tsx` | R |
| `src/features/dossier-copilote/components/CarteAssistant.tsx` | N |
| `src/features/dossier-copilote/components/CarteCompleterFiche.tsx` | N |
| `src/features/dossier-copilote/components/CarteTisserIndices.tsx` | N |
| `src/features/dossier-copilote/components/LigneDetenteur.tsx` | N |
| `src/features/dossier-copilote/components/BarreLancer.tsx` | N |
| `src/features/dossier-copilote/components/styles.ts` | N |
| `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` | R |
| `src/features/dossier-copilote/textes.ts` | R |
| `src/features/dossier-copilote/tests/useDemandeCopilote.test.tsx` | R |
| `src/features/dossier-copilote/tests/panneauCopilote.test.tsx` | R |
| `src/features/dossier-copilote/tests/acceptation.test.tsx` | R |
| `src/features/dossier-copilote/tests/detenteurs.test.tsx` | N |

- **CONSOMME** : tout le lot 1 via `brain/`, plus `controlerDossier`/`Controle`/`ControleId`, `pastilleNiveau`, `localiserEntite`, `CERTITUDE_INITIALE`, `Savoir`, `Indice`, `DossierService.update`, `useOpenDossier`. **Aucun import vers une autre feature** (KR-184) — ni `dossier-fiches`, ni `dossier-registres`, ni `dossier-canon`.
- **`LigneProposition.tsx` n'est PAS touché** (vérifié : autonome, ne lit que `brain/` et `textes.ts`) — il **ne figure dans aucun lot**, et une retouche y serait le signal qu'on a forcé une réutilisation (objection UX, retenue).
- **`App.tsx` n'est PAS touché** ; `tests/cablage.test.ts` reste vert **sans retouche** — une retouche y serait le signal qu'un lot a franchi une frontière.
- ⚠ **Coût prévisible, à écrire au plan** : une **seconde** carte active fait apparaître un **second bouton « Lancer »**. `panneauCopilote.test.tsx` et `acceptation.test.tsx` doivent **cadrer leurs requêtes** (`within(screen.getByRole('region', { name: CARD1_TITRE }))`) sinon `getMultipleElementsFoundError` (KR sur la sécurité des requêtes RTL). C'est pourquoi `CarteAssistant` rend un `<section aria-label={titre}>` : un **point d'ancrage exposé délibérément** par la carte, pas une recherche DOM à distance.

### Fichiers explicitement HORS de tout lot

`src/brain/dossier/libelles.ts` · `src/brain/dossier/libelles.test.ts` · `src/brain/dossier/controles.ts` et `controles.test.ts` · `src/brain/dossier/atteignabilite.ts` · `src/brain/dossier/pastilles.ts` · `src/brain/dossier/__fixtures__/dossier-reference.json` · `src/App.tsx` · `src/features/dossier-copilote/tests/cablage.test.ts` · `src/features/dossier-copilote/index.ts` · `src/features/dossier-copilote/components/LigneProposition.tsx` · `lintIsolation.test.ts` · **tout fichier de `dossier-canon`, `dossier-fiches`, `dossier-registres`** · `specification.json` (écrit par l'orchestrateur à l'étape 4, jamais par un lot).

## 4 — SIGNATURES LITTÉRALES FINALES · à recopier telles quelles dans le plan

> Un ouvrier de l'essaim ne lit pas les notes de tour. Ce qui suit est son seul point de rendez-vous.

### 4.1 `src/brain/copilote/types.ts` (R)

```ts
/** DEUX rôles. Le nom se lit ⟨entité CIBLE⟩-⟨ce qu'on demande⟩ — « la prose d'un
 *  personnage », « les détenteurs d'un indice ». C'est AUSSI le segment de route
 *  (`/ia/indice-detenteurs`) et la clé des tables d'invites et de gabarits. */
export type RoleCopilote = 'personnage-prose' | 'indice-detenteurs'

// ── INCHANGÉS, aucune de ces lignes ne bouge : ChampProseCle, CHAMPS_PROPOSABLES,
//    ChampProseChemin, PropositionRendue, PropositionResolue.

/** ALIAS DE LISIBILITÉ, et RIEN DE PLUS : `string` ne garantit rien. La SEULE
 *  garantie d'un rang est son APPARTENANCE à `ContexteDetenteurs.rangs`, constatée
 *  par `validerDetenteurs`. Forme du jeton : `P1`, `P2`, … `PN`. AUCUNE conversion
 *  numérique nulle part — ni `Number`, ni `parseInt`, ni indexation arithmétique :
 *  c'est ce qui supprime la classe entière des décalages base-0/base-1. */
export type RangInjecte = string

/** CE QUE LE MODÈLE REND pour `indice-detenteurs` — franchit le réseau. UNE clé,
 *  un tableau de JETONS DE RANG. Aucun identifiant, aucune prose, aucune certitude
 *  (KR-231). NON ré-exporté par `brain/index.ts`. */
export interface DetenteursRendus {
	detenteurs: readonly RangInjecte[]
}

/** CE QUE LE CODE RE-RÉSOUT — ne franchit JAMAIS le réseau. `indiceId` vient de
 *  l'état d'écran, chaque `personnageId` d'un `Map.get` sur la table des rangs.
 *  ZÉRO clé commune avec `DetenteursRendus` : on ne peut pas passer l'une pour
 *  l'autre par mégarde. La CERTITUDE n'est pas ici — le code écrit
 *  `CERTITUDE_INITIALE`, comme l'éditeur quand l'auteur crée un savoir à la main. */
export interface PropositionDetenteurs {
	indiceId: string
	personnageIds: readonly string[]
}
```

### 4.2 `src/brain/copilote/contexte.ts` (R)

```ts
export const CHAMPS_INJECTES: Record<RoleCopilote, readonly string[]> = {
	'personnage-prose': [ /* les 12 chemins de l'it1, INCHANGÉS */ ],
	'indice-detenteurs': [
		'canon.ton',
		'canon.interdits_ton[]',
		'canon.mj.synopsis_mj',
		'monde.indices[].verite',
		'monde.indices[].formulation_joueur',
		'monde.personnages[].fonction',
		'monde.personnages[].plan_actions[].action',
		'monde.personnages[].description_joueur',
		'monde.personnages[].but.libelle',
	],
}

/** La soupape. VIDE, et un test l'asserte vide. Injecter `verite` n'est PAS une
 *  dérogation d'audience — le champ est DÉJÀ `ia` — c'est la levée d'une CONDITION
 *  TEMPORELLE, ré-écrite à ses deux sites par ce lot. Ne pas confondre les deux. */
export const DEROGATIONS_AUDIENCE: readonly string[] = []

export const PARTIES_REQUISES: Record<RoleCopilote, readonly CheminLibelle[]> = {
	'personnage-prose': ['canon.ton'],
	'indice-detenteurs': ['canon.ton'],
}

/** LA VARIABLE LIBRE de la borne de contexte. Si la mesure de `M` déplaît, ON
 *  BAISSE K — on ne monte jamais le budget. */
export const CANDIDATS_MAX = 8

/** PAR RÔLE, et c'est le point dur de cette itération : un scalaire partagé ferait
 *  desserrer la garde du rôle étroit par la mesure du rôle large, sans un seul test
 *  rouge. Chaque entrée est RE-DÉRIVÉE par `ceil(M_rôle × 3 / 1000) × 1000` sur une
 *  mesure de CE rôle-là. Ce n'est PAS un cliquet. */
export const BUDGET_CARACTERES_CONTEXTE: Record<RoleCopilote, number> = {
	'personnage-prose': 6000, // MESURÉ 2026-09-17 (M = 1783), INCHANGÉ
	'indice-detenteurs': 0,   // ⚠ À MESURER AU LOT 1, K SATURÉ. Ne pas livrer un 0.
}

export type MotifRefusContexte =
	| { motif: 'a-ecrire'; chemin: CheminLibelle }
	/** JAMAIS de charge : « trop long » pointe la fiche, pas un champ. */
	| { motif: 'trop-long' }
	/** NEUF — l'entité CIBLE n'a pas le contenu sans lequel la demande n'a pas de
	 *  sens (la `verite` de l'indice). AUCUNE charge, et c'est délibéré : le champ
	 *  n'a pas d'entrée dans `LIBELLE_DES_CHAMPS` et n'en aura pas (§ 8, TL-8) — le
	 *  texte d'écran le nomme EN PROSE, côté feature. */
	| { motif: 'cible-a-ecrire' }
	/** NEUF — aucun candidat numérotable : tous les personnages détiennent déjà cet
	 *  indice, ou il n'y en a aucun. Refus AVANT tout `fetch` : il n'y a rien à
	 *  demander. Aucune charge, comme `trop-long`. */
	| { motif: 'aucun-candidat' }

/** `texte` est DÉTERMINISTE : ni date, ni identifiant, ni aléa — « deux lancers ⇒
 *  deux corps identiques » reste vrai par égalité stricte. */
export type ContexteProse =
	| { ok: true; texte: string; entitesInjectees: readonly string[] }
	| ({ ok: false } & MotifRefusContexte)

export type ContexteDetenteurs =
	| {
			ok: true
			texte: string
			/** TOUTES les entités injectées — l'audit de confinement. Contient l'indice
			 *  CIBLE, qui n'a PAS de rang : `entitesInjectees` ne peut donc pas être
			 *  dérivé de `rangs`. Ce n'est pas deux listes à tenir en phase — c'est UNE
			 *  traversée, DEUX projections, écrites dans la même itération de boucle. */
			entitesInjectees: readonly string[]
			/** LES SEULES entités DÉSIGNABLES, jeton → identifiant. Le numéro écrit dans
			 *  `texte` et la clé de cette table sortent de la MÊME variable, jamais de
			 *  deux boucles. Invariant asserté au test : `[...rangs.values()]` ⊆
			 *  `entitesInjectees`. NE SORT JAMAIS de `brain/copilote/`. */
			rangs: ReadonlyMap<RangInjecte, string>
	  }
	| ({ ok: false } & MotifRefusContexte)

/** INCHANGÉ dans son comportement : les SIX règles de l'it1 restent prouvées sur
 *  cette fonction-ci, et sur elle seule. */
export function assemblerProse(dossier: Dossier, cible: CibleCopilote): ContexteProse

/**
 * L'ASSEMBLEUR DU SECOND RÔLE. AUCUNE branche `if (role === …)` ici ni dans
 * `assemblerProse` : les deux fonctions partagent les PRIMITIVES
 * (`textesDuChemin`, `estRedige`, la composition d'un bloc, la garde de budget),
 * jamais un corps commun paramétré — elles diffèrent sur cinq points, pas un.
 *
 * SÉLECTION DES CANDIDATS, déterministe, sans modèle : (1) exclure les détenteurs
 * actuels de l'indice ; (2) `portee === 'premier'` d'abord, puis ordre du document ;
 * (3) tronquer à `CANDIDATS_MAX` ; (4) un candidat dont les QUATRE chemins sont
 * vides ou marqués n'est PAS injecté et ne reçoit PAS de rang — un bloc vide
 * enseignerait « ce personnage n'a rien », ce qui est une affirmation ; le repli est
 * le silence. `portee` SÉLECTIONNE, elle n'est jamais injectée (audience `moteur`).
 *
 * REFUS, dans l'ordre, tous AVANT le moindre `fetch` : `a-ecrire` (canon.ton),
 * `cible-a-ecrire` (la `verite` de l'indice manque ou est marquée),
 * `aucun-candidat` (table des rangs vide), `trop-long`.
 */
export function assemblerDetenteurs(dossier: Dossier, cible: CibleIndice): ContexteDetenteurs
```

**Forme du texte assemblé** (prolongement de l'it1, le rang servant d'en-tête de bloc) :
```
canon.ton
⟨…⟩

monde.indices[].verite
⟨…⟩

P1
monde.personnages[].fonction
⟨…⟩
monde.personnages[].plan_actions[].action
⟨…⟩

P2
monde.personnages[].plan_actions[].action
⟨…⟩
```

### 4.3 `src/brain/copilote/schemaSortie.ts` (R)

```ts
export const CLES_SORTIE = ['valeur'] as const                 // INCHANGÉ
export const CLES_SORTIE_DETENTEURS = ['detenteurs'] as const
export const PROPOSITIONS_MAX = 3

/** LE GABARIT, désormais APPARIÉ AU RÔLE — et c'est la moitié de la garde KR-236 :
 *  avec une constante par rôle, l'appariement n'existerait que dans le test, qui en
 *  deviendrait un troisième porteur. `Record<RoleCopilote, string>` le rend TOTAL à
 *  la compilation : un rôle ajouté sans gabarit ne compile pas.
 *  DUPLIQUÉ dans `worker/index.ts` — aucun import `worker/` → `src/brain/` : la
 *  liaison est un BALAYAGE DE SOURCE (`worker/frontiere.test.ts`).
 *  ⚠ FORME D'ÉCRITURE IMPOSÉE, une entrée par ligne, une tabulation d'indentation,
 *  identique des deux côtés — c'est ce que l'expression ancrée du test extrait. */
export const GABARIT_SORTIE: Record<RoleCopilote, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

export type MotifIllisible = 'schema' | 'vide' | 'marqueur' | 'identifiant' | 'rang-inconnu'

/** INCHANGÉ — six prédicats, `dossier` pour le scanner d'appartenance. */
export function validerSortie(
	brut: unknown,
	dossier: Dossier,
): ({ ok: true } & PropositionRendue) | { ok: false; motif: MotifIllisible }

/**
 * LES PRÉDICATS DE FORME de la sortie `indice-detenteurs`. `rangsConnus` vient de
 * `ContexteDetenteurs.rangs` : le validateur ne CALCULE aucun rang, il constate une
 * APPARTENANCE.
 *
 * Le type de retour dit littéralement ce qui est atteignable : `'vide'`,
 * `'marqueur'` et `'identifiant'` sont SANS OBJET ici et ne sont pas « rejoués par
 * symétrie » — aucune prose n'est rendue par ce rôle, et un jeton qui passe
 * l'appartenance est l'une de nos propres chaînes. Les écrire serait du code mort
 * présenté comme de la couverture (famille BUG-084).
 *
 * Les prédicats, dans l'ordre, chacun prouvé seul :
 *   (1) objet simple ............................................. 'schema'
 *   (2) clés = EXACTEMENT `CLES_SORTIE_DETENTEURS` ............... 'schema'
 *   (3) `Array.isArray(brut.detenteurs)` ......................... 'schema'
 *   (4) chaque élément est une CHAÎNE ............................ 'schema'
 *   (5) longueur ≤ `PROPOSITIONS_MAX` — une liste de 6 est un REFUS,
 *       jamais une troncature ................................... 'schema'
 *   (6) éléments DISTINCTS (deux savoirs identiques sinon) ....... 'schema'
 *   (7) chaque élément ∈ `rangsConnus` .................... 'rang-inconnu'
 *
 * LA LISTE VIDE EST UN SUCCÈS. Le prédicat de non-vacuité de l'it1 NE SE TRANSPORTE
 * PAS : il portait sur une prose scalaire, où le vide est une non-réponse ; sur une
 * liste, le vide EST une réponse. Punir la réponse honnête est une machine à
 * complaisance — un modèle qui ne peut pas dire « personne » nommera quelqu'un.
 *
 * Hors bornes, malformé, doublon, `2.5`, `-1`, `"toto"` : le LOT ENTIER est refusé,
 * donc rejeu une fois puis état terminal. Accepter les rangs valides et jeter les
 * autres serait une réparation silencieuse — l'auteur ratifierait une liste tronquée
 * sans savoir qu'elle l'est (§ 8, TL-6).
 */
export function validerDetenteurs(
	brut: unknown,
	rangsConnus: ReadonlySet<RangInjecte>,
): ({ ok: true } & DetenteursRendus) | { ok: false; motif: 'schema' | 'rang-inconnu' }
```

### 4.4 `src/brain/CopiloteService.ts` (R)

```ts
/** INCHANGÉ, et délibérément NON RENOMMÉ : c'est la cible du rôle PROSE, et trois
 *  fichiers de feature l'importent sous ce nom. La cible du second rôle est
 *  `CibleIndice`. Le renommage en `CibleProse` est une dette NOMMÉE, à payer par la
 *  première itération qui touche à la fois le hook et ce fichier. */
export interface CibleCopilote {
	entiteId: string
	champ: ChampProseChemin
}

/** Pas de `champ` ici, et ce n'est pas un oubli : on ne demande pas un champ, on
 *  demande QUI. Un `champ?` optionnel sur une cible commune rendrait représentable
 *  « une demande de prose sans champ » (§ 8, TL-1). */
export interface CibleIndice {
	indiceId: string
}

/** LES TROIS BRANCHES D'ÉCHEC, extraites : elles sont RIGOUREUSEMENT les mêmes pour
 *  tous les rôles et doivent le rester. Ré-exportée par `brain/index.ts` — l'état
 *  d'écran des deux cartes la porte. */
export type EchecCopilote =
	| ({ statut: 'refuse' } & MotifRefusContexte)
	| { statut: 'indisponible'; raison: RaisonIndisponible }
	| { statut: 'illisible'; motif: MotifIllisible }

/** DEUX unions nommées, jamais un générique à défaut : `ReponseCopilote` garde son
 *  nom ET son sens (rôle prose), et aucun appelant existant ne bouge. */
export type ReponseCopilote = { statut: 'propose'; proposition: PropositionResolue } | EchecCopilote
export type ReponseDetenteurs = { statut: 'propose'; proposition: PropositionDetenteurs } | EchecCopilote

/**
 * SURCHARGE SUR LE LITTÉRAL DE RÔLE — et c'est le point de contrat le plus chargé
 * de l'itération, alors voici les trois raisons, dans l'ordre :
 *
 *  1. `demander('indice-detenteurs', d, { entiteId, champ })` est une ERREUR DE
 *     COMPILATION : le couple (rôle, cible) cesse d'être un état représentable.
 *     Une méthode unique non surchargée ne l'obtient pas ; deux méthodes l'obtiennent
 *     aussi, mais paient le point 3.
 *  2. Le type de retour reste EXACT par branche : la carte 1 ne rétrécit jamais au
 *     runtime une proposition dont elle connaît la forme à la compilation.
 *  3. Elle N'AJOUTE AUCUN MEMBRE à l'interface. Les trois suites de la feature
 *     bouchonnent par `brain.copilote = { estDisponible, demander }` avec un
 *     paramètre annoté `jest.Mock` NU (`Mock<any, any>`) : un membre de plus rend
 *     ces littéraux incomplets et le lot contrat ne passe plus `tsc` SEUL — donc il
 *     happe des fichiers de feature, et le découpage s'effondre. Une surcharge, elle,
 *     passe : `(...args: any[]) => any` satisfait chaque signature d'appel.
 *
 * ⚠ Un appelant qui détient `role: RoleCopilote` (union, non littéral) ne satisfait
 * AUCUNE surcharge. C'est voulu : chaque carte connaît son rôle statiquement.
 *
 * IMPLÉMENTATION SANS `as` : dans le corps de `createCopiloteService`, déclarer
 * `demander` en FONCTION à surcharges (les deux signatures publiques + une
 * implémentation élargie), puis `return { estDisponible, demander }` — la variable
 * porte alors exactement le type de l'interface.
 */
export interface CopiloteService {
	estDisponible(): boolean
	demander(
		role: 'personnage-prose',
		dossier: Dossier,
		cible: CibleCopilote,
		signal?: AbortSignal,
	): Promise<ReponseCopilote>
	demander(
		role: 'indice-detenteurs',
		dossier: Dossier,
		cible: CibleIndice,
		signal?: AbortSignal,
	): Promise<ReponseDetenteurs>
}
```

```ts
/** PRIVÉ. CE QUI PART SUR LE FIL — ni date, ni identifiant, ni nonce : c'est ce qui
 *  rend « deux lancers ⇒ deux corps identiques » démontrable par égalité stricte.
 *  Union et non `champ?` : le rôle détenteurs n'a pas de champ, et un optionnel
 *  rendrait le corps de prose sans champ représentable. */
type CorpsDemande =
	| { role: 'personnage-prose'; champ: ChampProseChemin; contexte: string }
	| { role: 'indice-detenteurs'; contexte: string }
```
`unAller` est **inchangé**. La boucle « rejeu exactement une fois puis état terminal » est extraite en **une** fonction privée paramétrée par `(corps, valider)` — deux appelants, même fichier, invisible au contrat. **Ordre des effets inchangé** : refus de contexte → configuration → `fetch` → validation → rejeu unique → terminal.

### 4.5 `worker/index.ts` (R)

```ts
/** ⚠ MÊME FORME D'ÉCRITURE que `src/brain/copilote/schemaSortie.ts` — une entrée
 *  par ligne, une tabulation — c'est ce que l'expression ancrée de
 *  `frontiere.test.ts` extrait des DEUX côtés. */
const GABARIT_SORTIE: Record<string, string> = {
	'personnage-prose': '{"valeur": "…"}',
	'indice-detenteurs': '{"detenteurs": ["P1", "P2"]}',
}

export const INVITES: Record<string, { systeme: string; max_tokens: number }> = {
	'personnage-prose': {
		systeme: [ /* INCHANGÉ, sauf `${GABARIT_SORTIE['personnage-prose']}` */ ].join('\n'),
		max_tokens: 200,
	},
	'indice-detenteurs': {
		systeme: [
			"Tu assistes l'AUTEUR d'un livre-jeu qui répartit ce que ses personnages savent.",
			'La demande te donne UN fait, et une liste de personnages repérés P1, P2, … Tu désignes ceux d\'entre eux qui pourraient plausiblement connaître ce fait, au vu de ce que la liste dit d\'eux, et de rien d\'autre.',
			'',
			`Tu réponds par un objet JSON et rien d'autre, de la forme ${GABARIT_SORTIE['indice-detenteurs']} : aucune autre clé, aucun commentaire, aucun texte avant ou après.`,
			'',
			"Chaque élément est un repère de la liste, recopié tel quel. Tu n'en inventes aucun, tu ne répètes aucun repère, et tu n'en donnes jamais plus de trois.",
			"Tu en donnes moins, ou aucun, quand la liste ne t'en dit pas assez pour choisir : une liste vide est une réponse juste.",
			"Tu ne rédiges rien d'autre : ni nom, ni phrase, ni justification.",
		].join('\n'),
		max_tokens: 100, // DÉRIVÉ (pire cas 3 rangs à deux chiffres ≈ 40 car. ⇒ 13-20 jetons × 3, arrondi à la centaine). JAMAIS recopié de 200.
	},
}

/** RE-DÉRIVÉ AU LOT 1 : `max` sur les rôles de `ceil((3 × budget[rôle] + E[rôle]) / 1024) × 1024`.
 *  UN SEUL plafond, calé sur le pire rôle : la garde worker protège le BUDGET MODÈLE,
 *  c'est le budget CLIENT — lui, par rôle — qui refuse en amont. Doctrine non rouverte. */
export const TAILLE_MAX_CORPS_IA = /* MESURÉ */ 0
```
La route `^\/ia\/([a-z-]+)$` accepte `indice-detenteurs` **sans modification**. `max_tokens` est déjà lu de `invite.max_tokens` (l. 280) : rien d'autre à changer sur la voie amont.

### 4.6 `worker/frontiere.test.ts` (R) — ce qu'il doit devenir, faute de quoi il devient décoratif

1. **Extraction ancrée sur l'ENTRÉE, plus sur la déclaration** — une seule expression, employée des deux côtés, qui rend un `Map<role, gabarit>` :
   ```ts
   const ENTREE_GABARIT = /^\t'([a-z-]+)': '(.+)',$/gm
   ```
   Contrainte (a) tenue : le test ne contient **aucun** des littéraux, il les extrait. Contrainte (b) tenue : cardinalité **dans** le prédicat — deux tables vides sont trivialement égales.
2. **Totalité** : les clés extraites côté brain, les clés extraites côté worker et `Object.keys(INVITES)` forment **le même ensemble**. Un rôle sans gabarit, ou un gabarit sans invite, rougit. (Le côté brain est déjà total par `Record<RoleCopilote, string>`, c'est `tsc` qui le tient ; le test propage la totalité au worker, qui ne peut pas importer le type.)
3. **Appariement** : pour chaque rôle, `INVITES[rôle].systeme` contient le gabarit **de ce rôle**.
4. **Canari CROISÉ, obligatoire** : intervertir les deux gabarits **en mémoire** et rejouer le prédicat du cas nominal doit rendre `false`. Un canari qui se contente de retirer un gabarit ne distingue pas « absent » de « mal apparié » — et le mal-apparié est le seul défaut qu'une table à deux entrées rende possible. **À écrire, pas à supposer.**
5. **Le témoin exécutable** (worker → validateur, même processus) est **rejoué pour le second rôle** : sortie conforme construite depuis le gabarit extrait, `demander('indice-detenteurs', …)`, résultat `propose` avec des `personnageIds` re-résolus.
6. **Les deux plafonds** : `const ROLE = …` disparaît au profit d'un `describe.each(Object.keys(INVITES))`. Une enveloppe **paramétrée par le rôle** :
   ```ts
   const enveloppe = (role: string): string =>
       JSON.stringify({ role, champ: 'monde.personnages[].description_joueur', contexte: '' }) + INVITES[role].systeme
   ```
   Le `champ` est conservé pour **tous** les rôles bien que le corps détenteurs n'en porte pas : il ne peut que **sur**-estimer l'enveloppe, donc la garde reste conservatrice, et cela évite un second porteur de la forme du corps. Le « tient sous le plafond » est asserté **pour chaque rôle** ; les **deux canaris séparateurs** (−1 Ko sur le plafond, +400 sur le budget) portent sur le rôle **le plus large**, `Math.max` sur `BUDGET_CARACTERES_CONTEXTE` — **dérivé, jamais écrit**. Sur le rôle étroit ils resteraient verts en ne discriminant rien.

### 4.7 `src/brain/dossier/types.ts` + `destinations.ts` (R) — la condition d'état, mot pour mot aux DEUX sites

Paragraphe à écrire **à l'identique** au JSDoc de `Indice.verite` (`types.ts`, actuellement l. 1048-1060) **et** dans le commentaire de `'monde.indices[].verite'` (`destinations.ts`, actuellement l. 412-425) :

> CONDITION D'ÉTAT — **en JEU** : le champ n'entre dans le contexte qu'après constat du moteur (carnet d'indices, n° 12). **En RÉDACTION** il n'existe aucune session : la condition n'a pas de sujet, elle ne devient pas « fausse ». Le champ entre alors **si et seulement si** (a) un rôle le nomme **explicitement** dans `CHAMPS_INJECTES`, et (b) le schéma de sortie de ce rôle **ne peut porter aucune prose** — sans quoi la vérité ressortirait paraphrasée dans le dossier, par le seul canal que l'itération 1 a nommé non couvert.

Instrument obligatoire, **même lot**, quatrième instance du patron existant de `couverture.test.ts` (`secret` l. 1350, `cede_si` l. 1309, `manifestation` l. 1388) : le paragraphe est **LU** du JSDoc, aplati (préfixe de commentaire effacé), puis **cherché** dans `destinations.ts` ; trois clauses discriminantes assertées pour que la comparaison ne vaille pas sur une phrase tronquée. **Le paragraphe n'est JAMAIS écrit en littéral dans le test** — ce serait un troisième porteur, exactement ce que le patron interdit.

### 4.8 `src/features/dossier-copilote/hooks/useDemandeCopilote.ts` (R) — lot 2

```ts
/** QUATRE phases. La machine d'APPEL, et rien d'autre : la phase `'decide'` SORT
 *  (§ 8, TL-13) — avec une décision PAR LIGNE elle est inexprimable, et elle
 *  doublait `decisionAffichee`, déjà porté par la carte. `accepter()`/`refuser()`
 *  disparaissent avec elle. La branche d'échec porte `EchecCopilote` et non la
 *  réponse entière : `'propose'` cesse d'être un statut représentable sur un échec,
 *  et le commentaire « possible sur le TYPE mais jamais produit ici » disparaît. */
export type EtatDemande<P> =
	| { phase: 'repos' }
	| { phase: 'en-cours' }
	| { phase: 'proposition'; proposition: P }
	| { phase: 'echec'; echec: EchecCopilote }

export interface UseDemandeCopiloteResult<C, P> {
	etat: EtatDemande<P>
	/** Ne fait RIEN si un appel est déjà en vol — le garde est `enVolRef`, PAS le
	 *  `disabled` du bouton : deux clics synchrones passent avant le re-rendu. */
	lancer: (cible: C) => void
	annuler: () => void
}

/**
 * `demander` est LU AU MOMENT DE L'APPEL, jamais stocké dans un ref ni capturé par
 * un effet : aucune fermeture périmée possible (KR-004), et la carte peut le
 * refermer sur son `dossier` courant. `dossier` n'est plus un paramètre du hook —
 * le panneau garde l'unique abonnement et ne rend ses cartes que sur un dossier non
 * nul.
 *
 * INCHANGÉS, et à NE PAS réécrire : l'abandon au démontage, la garde
 * `controleur.signal.aborted` sur la résolution tardive, la branche `.catch` (une
 * promesse rompue est une indisponibilité), et surtout le `.finally` qui ne rouvre
 * le garde QUE si `controleurRef.current === controleur` — c'est la séquence
 * Lancer(A) → Annuler → Lancer(B), et elle a son test dédié.
 */
export function useDemandeCopilote<C, P>(
	demander: (cible: C, signal: AbortSignal) => Promise<{ statut: 'propose'; proposition: P } | EchecCopilote>,
): UseDemandeCopiloteResult<C, P>
```

### 4.9 Les composants du lot 2

```ts
/** La coquille : `useOpenDossier`, la garde de nullité, `estDisponible` calculé EN
 *  LIGNE au rendu (jamais un `useState`/`useEffect`, KR-013/113), les trois cartes
 *  dans l'ordre, le passage d'`onSelectSection`. AUCUNE logique d'assistant. ≤ 120 l. */
export interface PanneauCopiloteProps {
	dossierId: string
	onSelectSection: (section: SectionId) => void
}

/** Coquille visuelle : `<Card>` + `<section aria-label={titre}>` + eyebrow + titre +
 *  `Badge` optionnel + `children`. Absorbe `Entete` ET `CardBientot`.
 *  Le `aria-label` est un POINT D'ANCRAGE EXPOSÉ DÉLIBÉRÉMENT — c'est lui que les
 *  tests cadrent (`within(getByRole('region', { name: CARD1_TITRE }))`) maintenant
 *  qu'il y a DEUX boutons « Lancer » à l'écran. Jamais une recherche DOM à distance. */
export interface CarteAssistantProps {
	titre: string
	corps: string
	badge?: string
	children?: ReactNode
}

/** Bouton Lancer + `title` de désactivation + région `role="status"` + Annuler +
 *  Échap + LA CHORÉGRAPHIE DE FOCUS (les deux `ref` et son `useEffect`, qui
 *  descendent ici depuis `PanneauCopilote`). DEUX appelants dès cette itération.
 *  N'expose QUE des intentions : jamais un `ref`, jamais un `getBouton()`. */
export interface BarreLancerProps {
	enCours: boolean
	desactive: boolean
	titreDesactive?: string
	onLancer: () => void
	onAnnuler: () => void
}

/** Sœur de `LigneProposition`, PAS une variante — `chemin`/`valeurAvant`/
 *  `valeurApres` n'ont aucun sens sur un détenteur, et les rendre optionnels
 *  casserait la garantie de forme que `LigneProposition` porte pour la carte 1.
 *  AUCUNE prop `certitude` : elle vaut toujours `CERTITUDE_INITIALE`, et un badge
 *  constant afficherait une donnée que personne n'a choisie (§ 8, TL-14). */
export interface LigneDetenteurProps {
	/** `localiserEntite('pnj', personnage, index)` — calculée par la carte. */
	designation: string
	decision?: 'acceptee' | 'rejetee'
	onAccepter: () => void
	onRejeter: () => void
	onOuvrirFiche: () => void
}

export interface CarteCompleterFicheProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}
export interface CarteTisserIndicesProps {
	dossierId: string
	dossier: Dossier
	indisponible: boolean
	onSelectSection: (section: SectionId) => void
}
```

**`components/styles.ts` (N)** — module de constantes, pas un composant : `pageStyle`, `carteStyle`, `enTeteStyle`, `eyebrowStyle`, `titreStyle`, `corpsStyle`, `ligneLancerStyle`, `boutonBase`, `lancerActifStyle`, `lancerDesactiveStyle`, `chargementStyle`, `annulerStyle`, `refusSyncStyle`. Déplacés **sans modification de valeur** depuis `PanneauCopilote.tsx` (l. 316-421). Cinq appelants.

**`textes.ts` (R)** — constantes neuves, libellés exacts à fixer par l'UX, **noms** imposés : `CARD2_CORPS_ACTIF`, `LABEL_INDICE`, `OPTION_AUCUN_INDICE_SIGNALE`, `TITRE_AUCUN_INDICE_SIGNALE`, `TEXTE_AUCUN_DETENTEUR_TROUVE`, `TEXTE_REFUS_CIBLE_A_ECRIRE`, `TEXTE_REFUS_AUCUN_CANDIDAT`, `TEXTE_REFUS_TROP_LONG_DETENTEURS`, `TITRE_COPILOTE_NON_CONFIGURE`, `MENTION_CERTITUDE`, `MENTION_RELANCE_SANS_MEMOIRE`. `CARD2_BADGE` est **supprimée** (la carte quitte l'état futur).
⚠ **`TEXTE_REFUS_TROP_LONG` est spécifique au rôle prose** (« raccourcissez d'abord la fiche de ce personnage ») : pour l'autre rôle, le même motif `'trop-long'` signifie « ce dossier a trop de personnages ». La discrimination se fait **au composant**, sans toucher `brain/`. Sans cette ligne au plan, la carte 2 réutilisera la constante et affichera une consigne fausse.

## 5 — Trois pièges à écrire au plan, qu'un ouvrier isolé ne verra pas

1. **LE GEL DE LA PROPOSITION.** Accepter le détenteur n° 1 écrit dans le dossier → `useOpenDossier` se réveille → `controlerDossier` recalcule → **l'indice peut quitter la liste des signalés au milieu de l'acceptation**. La liste ouverte, l'indice ciblé et les décisions déjà prises doivent être **gelés au geste `Lancer`**, exactement comme `valeurAvantGelee` (`PanneauCopilote.tsx:99-108`), **jamais re-dérivés au rendu**. Sans cette ligne, un ouvrier livrera une carte qui s'efface pendant qu'on l'utilise.
2. **L'EFFET DE BORD PRODUIT, à arbitrer par le PM et à ÉCRIRE.** Accepter un détenteur crée un `Savoir` **sans `revele_si`**, ce qui allume l'avertissement `revelation-sans-porte` du linter. Éteindre un bloquant en allumant une alerte n'est pas un veto d'architecture — mais si ce n'est pas écrit, l'itération se démontre **en déplaçant un voyant**.
3. **`estDisponible()` N'EST PAS RÉACTIF** (il délègue à `CloudSettingsService.isConfigured()`, aucun abonnement). Si le panneau n'est pas remonté à la navigation, un réglage posé après coup laisse « Lancer » désactivé jusqu'au remontage. **Le remontage à la navigation est à MESURER au lot 2, pas à supposer** — et la limite doit figurer dans la revue même si la mesure est rassurante. C'est la contrepartie de la clôture d'`open_questions` n° 5 (`estDisponible` **est consommée** : `PanneauCopilote` calcule `const indisponible = !copilote.estDisponible()` en ligne et le passe aux deux `BarreLancer` avec une raison nommée — la dette KR-109 se ferme sans rien retirer).

## 6 — Ce qui reste NON MESURÉ à la fin de ce tour (à ne compter comme vérifié par personne)

1. **Aucun test n'a été rejoué** — je n'ai aucun outil d'exécution (§ 0). Tout `LU` est à confirmer par `dev-contrat` avant de signer le lot 1.
2. **`M` du rôle `indice-detenteurs`**, donc `BUDGET_CARACTERES_CONTEXTE['indice-detenteurs']`, donc `TAILLE_MAX_CORPS_IA`, donc `E` : **non mesurés**, formules seulement. Les `0` des signatures sont des marqueurs, **pas des valeurs à livrer**.
3. **`CANDIDATS_MAX = 8`** est une valeur d'ENTRÉE proposée, pas une mesure : elle se révise à la baisse si `M` déplaît.
4. **Le remontage du panneau à la navigation** (§ 5 n° 3).
5. **Le taux réel de complaisance** et toute qualité de désignation : **non mesurables dans ce dépôt** (KR-229). C'est pourquoi tout est porté par des **refus déterministes**.
6. **La mémoire entre deux lancers** : un candidat REFUSÉ peut réapparaître au lancer suivant (un candidat ACCEPTÉ, non — il devient détenteur actuel, donc inénonçable par construction). Rien de faux, simplement **non promis** : l'écran doit **dire** qu'une relance repart de zéro (`MENTION_RELANCE_SANS_MEMOIRE`).
