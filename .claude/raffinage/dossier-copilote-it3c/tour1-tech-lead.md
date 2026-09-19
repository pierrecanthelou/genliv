# Tour 1 — `tech-lead` · `dossier-copilote` it3c

**RISQUE** — L'union étiquetée **saigne dans `src/features/**`, et rien ne peut l'en empêcher** : 4 cartes + 1 hook de `dossier-fiches`. **MESURÉ** : 4 littéraux de cible, 4 `const ROLE`, 1 `intensite: 0` — et **ZÉRO fichier de test** (les suites bouchonnent `demander` en `jest.Mock` **nu**, aucune n'asserte la cible). Le lot contrat les **possède** ; le lot carte ne les nomme pas. **C'est la seule raison pour laquelle 3c peut faire ce que 3b ne pouvait pas — PAS la date** : à 3b le lot carte *créait* `CarteCompleterPlan.tsx`, ici il crée un fichier neuf.

**OBJECTION** — « Le test de rattachement tranche peut-être tout seul » : **oui**, et il tranche que `relations[]` **NE S'INJECTE PAS** (interchangeable, précédent 3a). **L'appellation manquante ne se pose donc jamais**, la n° 10 garde sa question intacte. **Mais le doublon, lui, reste** — et un prédicat de validateur serait **le mauvais endroit** : *le validateur ne connaît pas le document*. Il se ferme à la **SÉLECTION** : exclure du tableau de rangs tout personnage déjà cible d'une `relations[].cible_id` du porteur — `detientDeja` recopié mot pour mot. **Un doublon cesse d'être REPRÉSENTABLE.**

**PROPOSITION** — **Le discriminant EST le rôle**, et **le paramètre `role` de `demander` DISPARAÎT** : un seul porteur, `switch (cible.role)` **total** avec garde `never`. `secret` **reste inexercé**. `intensite` s'écrit `INTENSITE_INITIALE` — **mesuré** : l'éditeur pose déjà `0`.

**VERDICT** — **ACCEPTÉ — 2 lots séquentiels.** Le lot contrat est gros (**26 fichiers**) mais **insécable** : `frontiere.test.ts:68-74` **soude le worker au `GABARIT_SORTIE` du brain**.

---

# ANNEXE (hors quota)

## A. Découpage — 2 lots, listes DISJOINTES

**LOT 1 — `contrat`, seul et en premier, 26 fichiers.** « Le contrat du 5ᵉ rôle **et** la cinquième branche ».
`CopiloteService.ts` (R — 5 cibles étiquetées, 5 surcharges, dispatch total, **corps privés RETIRÉS**) · `copilote/demandes/{appel,prose,detenteurs,repliques,plan,relations,index}.ts` (**N ×7**) · `copilote/types.ts` (R) · `schemaSortie.ts` (R) · `contexte/relations.ts` (**N**) · `contexte/registres.ts` (R) · `contexte/index.ts` (R) · **`dossier/types.ts` (R — `INTENSITE_INITIALE = 0`)** · `brain/index.ts` (R) · les 3 tests de brain (R) · `worker/{index,index.test,frontiere.test}.ts` (R) · **les QUATRE cartes livrées** (R — 1 littéral + `const ROLE` chacune) · **`dossier-fiches/hooks/useEcritureRelationsPresence.ts` (R — l. 44, `intensite: 0` → `INTENSITE_INITIALE`)**.

⚠ **`contexte/noyau.ts` N'EST PAS touché** : `assemblerRelations` rend `ContexteDetenteurs` **réutilisé sans alias** (précédent exact : `ContexteProse` rendu par `assemblerRepliques` **et** `assemblerPlan`).

**LOT 2 — `feature`, 7 fichiers.** `CarteTisserLiens.tsx` (N) · `LigneLien.tsx` (**N**, SŒUR de `LigneDetenteur`) · `textes.ts` (R) · `styles.ts` (R) · `PanneauCopilote.tsx` (R) · `tests/relations.test.tsx` (N) · `tests/panneauCopilote.test.tsx` (R).

**Disjonction vérifiée** : `lot1 ∩ lot2 = ∅`. **Lot 1 possède les 4 cartes existantes** ; lot 2 possède `PanneauCopilote`, `textes`, `styles` et les fichiers neufs.

**Pourquoi PAS un 3ᵉ lot « worker »** : `frontiere.test.ts:68-74` dérive `ROLES = Object.keys(INVITES)` (**worker**) et l'apparie aux clés de `BUDGET_CARACTERES_CONTEXTE` (**brain**). **Un lot qui n'ajoute le rôle que d'un côté est ROUGE SEUL** ⇒ il ne passe pas la porte isolément ⇒ il est mal découpé.
**Pourquoi PAS deux lots contrat** : les deux nommeraient `CopiloteService.ts` et `brain/index.ts`.

## B. Signatures — le paramètre `role` DISPARAÎT

```ts
export interface CibleCopilote  { role: 'personnage-prose';     entiteId: string; champ: ChampProseChemin }
export interface CibleIndice    { role: 'indice-detenteurs';    indiceId: string }
export interface CibleRepliques { role: 'personnage-repliques'; personnageId: string }
export interface CiblePlan      { role: 'personnage-plan';      acteurId: string }
export interface CibleRelations { role: 'personnage-relations'; personnageId: string }

demander(dossier: Dossier, cible: CibleRelations, signal?): Promise<ReponseRelations>   // ×5 surcharges
// implémentation : switch (cible.role) { … default: const _: never = cible; return _ }

export interface LienRendu { vers: RangInjecte; nature: string }          // RÉSEAU
export interface RelationsRendues { liens: readonly LienRendu[] }
export interface LienResolu { cibleId: string; lien: string }             // RE-RÉSOLU
export interface PropositionRelations { personnageId: string; ajouts: readonly LienResolu[] }
// KR-231 vérifié AUX DEUX NIVEAUX : {liens}∩{personnageId,ajouts}=∅ · {vers,nature}∩{cibleId,lien}=∅

export const RELATIONS_PROPOSEES_MAX = 3
GABARIT_SORTIE['personnage-relations'] = '{"liens": [{"vers": "P1", "nature": "…"}]}'
export function validerRelations(brut, rangsConnus: ReadonlySet<RangInjecte>, dossier): …
export function assemblerRelations(dossier, cible: CibleRelations): ContexteDetenteurs
export const INTENSITE_INITIALE = 0
```

## C. La cinquième branche — et **pourquoi `acheminer` est une FONCTION**

`CopiloteService.ts` : **502 l. aujourd'hui**, ~570 si on ajoute simplement la branche. Après extraction : **~290 l.** *(estimation, pas mesure)*.
**La couture en une phrase** : ce qui **varie par rôle** descend, ce qui est **partagé** reste entier, ce qui est **contrat** ne bouge pas de fichier. **C'est la couture exacte de la scission de 3b — même doctrine, aucun vocabulaire neuf.**

⚠ **LE PIÈGE DE L'EXTRACTION, ET IL EST INVISIBLE** : chaque corps privé fait **refus de contexte → acheminement → fetch**, dans cet ordre, **parce que l'ordre inverse ferait dire « indisponible » à un dossier dont il ne manque que le ton**. **Passer `vers: Acheminement` déjà résolu INVERSERAIT L'ORDRE EN SILENCE.** ⇒ on passe **`acheminer`, LA FONCTION**.
**Bonne nouvelle mesurée** : le témoin qui sépare les deux ordres **existe déjà** (`CopiloteService.test.ts:338` et `:688`). Il est **PAR RÔLE** parce que l'ordre vit dans chaque corps : **l'extraction ne le déplace pas, elle le rend INDISPENSABLE.** Le 5ᵉ rôle doit livrer le sien.

**Le lot contrat saigne-t-il dans `src/features/**` ? OUI, 5 fichiers, et c'est STRUCTUREL** — un discriminant ne peut pas être optionnel. **Ce qui tient le découpage n'est pas l'absence de saignement mais la PROPRIÉTÉ EXCLUSIVE.**

## D. L'union étiquetée — **coût MESURÉ avant décision**

| Site | Compte | Diff |
|---|---:|---|
| Les 4 cartes | 1 chacune | littéral + `const ROLE` retiré |
| `useDemandeCopilote.ts` | **0** | générique sur `C` — **inchangé** |
| les 5 suites de la feature | **0** | `demander: jest.Mock` **nu**, **aucun `toHaveBeenCalledWith` sur la cible** |
| `useDemandeCopilote.test.tsx` | **0** | `type Cible = { indiceId }` **local** |

**⇒ 4 fichiers de feature, ~2 lignes chacun. Le découpage ne s'effondre pas.** *Prédiction qu'aucun site n'a été manqué — `tsc` est l'arbitre, pas ce tableau.*

**Pourquoi le tag EST le rôle** : (1) `(rôle, cible)` **cesse d'être deux porteurs**, donc cesse de pouvoir diverger **par construction**, là où ~40 lignes de JSDoc défendent aujourd'hui contre cette divergence ; (2) le dispatch devient `switch` + garde `never` — **un 6ᵉ rôle sans branche ne compile pas**, là où les 4 gardes actuelles sont **explicites par convention, sans preuve d'exhaustivité** ; (3) `_role` inutilisé disparaît.

⚠ **Le risque NEUF que ça crée** : `cible.role` porte **le même nom** que `CorpsDemande.role`. Un `{ ...cible, contexte }` mettrait `personnageId` **sur le fil** (KR-231). **Parade** : chaque corps écrit son littéral **+ un témoin qui asserte le corps par ÉGALITÉ** (`toEqual`), jamais par inclusion (F-2).

**`acteurId` n'est PAS renommé** : le tag rend le synonyme **inoffensif**, et le renommage tirerait `planActions.test.tsx` dans le lot contrat. **Une dette fermée par conception n'est plus une dette.**

## E. Les cinq questions de fond

**E-2. Le validateur — ONZE prédicats, DEUX ancêtres, aucun mort.** Moitié **liste de prose** : `validerRepliques`. Moitié **appartenance** : `validerDetenteurs`. ⚠ **Le schéma fermé PAR ÉLÉMENT est neuf — aucun ancêtre.**
(1) objet simple · (2) clés exactes · (3) `Array.isArray` · (4) **chaque élément objet, clés exactement `{vers,nature}`** · (5) les deux sont des **chaînes** (jamais `String(…)`, jamais `[0]`) · (6) ≤ MAX, **refus jamais troncature** · (7) **`vers` distincts** (jamais `nature`, cf. G-13) · (8) `nature` non vide `vide` · (9) marqueur · (10) identifiant **par élément, jamais un `join`** · (11) `vers ∈ rangsConnus`, **lot entier refusé** `rang-inconnu`.
⚠ **`porteUnIdentifiant` ne touche JAMAIS `vers`** — le jeton est **notre propre chaîne**.
⚠ **PREMIER validateur dont le type de retour nomme `MotifIllisible` EN ENTIER** — les cinq motifs sont atteignables. **C'est la preuve d'« aucun mort », pas une affirmation.**

⚠ **LA LISTE VIDE = SUCCÈS — DOCTRINE NEUVE, À RATIFIER PAR LE COMITÉ**, pas une application silencieuse : *le test de rattachement 3a porte sur ce que la LISTE ÉNUMÈRE, pas sur ce que chaque élément CONTIENT.* Cette liste énumère des **désignations** dans un ensemble fourni ⇒ **désignation** ⇒ « personne » est vrai (un ermite). **La prose n'est pas ce qui est choisi, c'est la justification attachée à un choix déjà fait** ⇒ une ligne désignée à prose vide est une **non-réponse** ⇒ `'vide'`, lot entier refusé.

**E-3. `intensite` — PAS une violation de KR-221**, discriminant de 3b **au mot près** : **requis par le type** ⇒ **minimum structurel, pas semis**. **Mesuré** : `useEcritureRelationsPresence.ts:44` sème **déjà** `0` à la main ; le document persisté vaut `{ cible_id, lien, intensite: 0 }`, **`secret` ABSENT**. **Le désaccord n° 2 de 3a ne s'applique pas** : là-bas un bloc **tout au plancher** ; ici **il n'y a pas de plancher** — `0` est le **neutre**, et « neutre » est **précisément ce qu'une relation ratifiée EST tant que l'auteur ne l'a pas réglée**.
⚠ **Deux écrivains de la même graine divergeront** ⇒ `INTENSITE_INITIALE` dans `dossier/types.ts` **et la ligne 44 repointée dans le même lot**.
**`secret` reste ABSENT à l'écriture** : optionnel ⇒ **ne pas semer**. ⚠ **La symétrie EST le cœur de l'arbitrage** : `intensite` écrit **parce que requis**, `secret` omis **parce qu'optionnel**.

**E-4. L'auto-référence — légale, non désignable.** Le porteur est exclu des rangs **pour une raison TECHNIQUE, pas doctrinale** : `assemblerRelations` l'injecte déjà **comme CIBLE** ; lui donner **en plus** un rang le ferait paraître **deux fois sous deux statuts**. ⚠ **« Ce n'est pas mon terrain »** — si le PM ou le narratif veulent la didascalie de conflit intérieur, la parade est de lui donner son rang **et de le dire dans l'invite**. **Pas de veto**, défaut « exclure », coût de l'autre branche nommé.

**E-5. `secret` — ce n'est PAS 3c.** Les cinq rôles sont des rôles d'**ÉCRITURE** ; « acteur/narrateur/arbitre » n'existent pas. Fabriquer une correspondance serait **une abstraction à zéro appelant réel** (KR-109) — *mon biais, et je le refuse ici*. **Correction de doc due, aux DEUX sites** : la phrase « aucun assembleur n'existe encore » est **fausse par sa prémisse** et **deviendra un piège**.

## F. Trois critères qui exigent un SCÉNARIO DIVERGENT (leçon BUG-113)

**F-1 — l'ordre des effets** : worker **non configuré** ET `canon.ton` **marqué** ⇒ `a-ecrire`, **jamais `indisponible`**, zéro `fetch`. *Avec une config complète, les deux implémentations sont vertes — c'est l'unique état qui les sépare.*
**F-2 — la cible ne franchit pas le fil** : `toEqual` sur le corps, **pas `toContain`**. *Par inclusion, un `{...cible, contexte}` reste VERT ; par égalité, `personnageId` sur le fil rougit.*
**F-3 — le doublon se ferme à la sélection** : le porteur a déjà `cible_id === 'pnj.x'` ⇒ **aucun bloc de rang ne résout `pnj.x`**, `rangs.size === N−1`. *Une implémentation qui filtrerait à l'injection donnerait un rang puis le rejetterait — table différente, observable. « Le résultat final ne contient pas de doublon » serait vrai des deux façons.*

## G. REJETÉ — pour le registre (BUG-082)

1. **`CibleRelations { porteurId }`** (3ᵉ synonyme) — *c'est exactement le signal que 3b a daté ici.*
2. Tag `genre` **distinct** du rôle — **NON RETENU** (repli) : *table 5×2 à tenir en phase.*
3. **Deux listes parallèles** `{cibles:[…], natures:[…]}` — *un désaccord de longueur devient un mode de panne neuf.*
4. **Jeton + prose dans UNE chaîne** (`"P1: son créancier"`) — *chirurgie de chaîne sur une sortie de modèle, et l'appartenance cesse d'être un `Set.has`.*
5. **Prédicat de doublon au validateur** — *le validateur ne connaît pas le document ; le doublon se ferme à la sélection, où il devient non représentable.*
6. **Injecter `relations[]`** — *interchangeable, et exigerait l'appellation dont la n° 10 est propriétaire.*
7. **Exercer `secret` à 3c** — *abstraction à zéro appelant réel.*
8. **`type ContexteRelations = ContexteDetenteurs`** — *abstraction à un seul appelant (KR-109).*
9. **Registre paramétré pour les cinq `CLES_SORTIE_*`** — *le rôle prose n'a pas de liste.*
10. **Partager `RELATIONS_PROPOSEES_MAX` avec `PROPOSITIONS_MAX`** — *aucune raison commune d'évoluer.*
11. **Renommer `CibleCopilote` → `CibleProse`** — *condition d'ouverture non échue.*
12. **Renommer `acteurId`** — *churn pur ; tirerait `planActions.test.tsx` dans le lot contrat.*
13. **Prédicat « `nature` distinctes »** — *deux frères portent légitimement le même `lien`.*
14. **3ᵉ lot « worker »** — *rouge seul.*
15. **Deux lots contrat** — *propriété non exclusive.*
16. **`LigneDetenteur` élargie d'un `lien?`** — *une SŒUR, jamais une variante.*
17. **Couper 3c en deux itérations** — **NON RETENU** : *la moitié « couture » n'aurait AUCUNE démo — nommée en option si le comité trouve le lot 1 trop lourd.*

## H. Prédictions — **étiquetées, aucune mesurée**
1. Le lot 1 passe `tsc` + `jest` **SEUL**. *Si c'est faux, le découpage est faux.*
2. Le gabarit n'est **sous-chaîne d'aucun autre** — **à vérifier avant d'écrire l'invite**.
3. Il satisfait `ENTREE_GABARIT` — *même piège que `personnage-répliques` à l'it3a.*
4. **Le budget n'est PAS prédit** : le rôle **numérote jusqu'à `CANDIDATS_MAX`** ⇒ famille **large**. À mesurer.
5. **`TAILLE_MAX_CORPS_IA` PEUT BOUGER** — *à re-dériver, jamais reconduit par « inchangé ».*
6. **Le piège de 3b peut se ré-armer** : si le budget retombe sur une valeur déjà présente, **vérifier que la fabrication n'est pas redevenue inerte**.
7. **`CANDIDATS_MAX` réutilisée telle quelle** — *sa mesure vaut désormais pour DEUX rôles, à noter au registre.*

## Ce sur quoi je poserais un VETO au tour 2
Une cible **sans discriminant** · un `intensite: 0` **en dur** dans la carte · un `{ ...proposition.ajouts[i] }` étalé dans `relations[]` (*écrasement + semis de `secret`*) · un lot contrat qui **laisse les 4 cartes** au lot feature (*`tsc` rouge sur un lot livré seul*) · **`porteUnIdentifiant` appliqué au jeton** (*code mort présenté comme de la couverture*).
