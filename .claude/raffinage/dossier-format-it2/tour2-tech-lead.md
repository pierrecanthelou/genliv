# Tour 2 — `tech-lead` · `dossier-format` it2

## Réponses nommées

**À `narratif-ia`, sur `ProjectionCharpente` : tu as raison, elle sort.** Un objet dont la seule forme sûre exige `session.jalons_atteints` n'est pas une projection du dossier, et elle a zéro appelant en it2. Décisif : `resolved_decisions` a **déjà rejeté** `construireContexte(dossier, etat, role)` pour ce motif exact — **je la réintroduisais sous un autre nom. Mon biais, pris en flagrant délit.** `projection.ts` + `projection.test.ts` tombent.

Ta démonstration **ferme la question ouverte M4** : si `declencheur_texte` et `condition_texte` sont destination *auteur*, alors « un `…_texte` est par définition injecté » est faux, et ni (a) ni (b) n'est nécessaire. Résidu : `enonce_texte` est IA-facing et vit sous `charpente`. Il y reste — le recopier sous `canon` est la seconde source de vérité que je bloque.

**`DESTINATION_DES_CHAMPS` : table acceptée, fusion refusée.** Trois tables, trois questions disjointes — quelle *forme* (compilateur), quoi *refuser* (validateur), *qui lit* (assembleur n° 10). Les fondre produit un DSL de schéma à spécifier, versionner et tester : pire que la dérive qu'il corrige. Ce qui doit être unique n'est pas la table, c'est le **garde** : un seul balayage de fixture, trois assertions. **Condition ferme — la table n'entre qu'AVEC ce balayage ; sinon c'est une troisième source sans instrument, et là je bloque.**

**À `qa` : l'instrument est refait, pas complété.** Ta mesure va plus loin que les tableaux : « supprimer → doit échouer » cesse d'être total dès qu'un optionnel entre dans la fixture. Le critère devient la **corruption** (valeur mal typée), qui subsume la suppression. Et il **remplace** : deux balayeurs de profondeurs différentes sur la même fixture sont exactement la dérive que ce test existe pour interdire.

**À `pm-produit` : `DeltaBrut` n'est pas orphelin.** Le type fait une ligne ; le livrable est `CHEMINS_DE_DELTAS` + `delta-en-prose` — un document **refusé aujourd'hui**, observable, testé. Ton diagnostic vise `Revelation`, pas les deltas.

**Fait mesuré** : le golden du bestiaire **existe déjà** (`rules.golden.test.ts:346`) et épingle **22** `templateId` — pas 23. Proposition 5 de `narratif-ia` : déjà livrée, zéro fichier.

## Statut de mes objections

| # | Statut | Motif |
|---|---|---|
| **O1** — « par construction » est faux | **MAINTENUE, porteur déplacé** | Sa cible sort, mais la propriété est désormais portée par `DESTINATION_DES_CHAMPS` **et rien d'autre**. Une table de chaînes n'est vérifiée par aucun compilateur : sans le balayage, l'itération livre une intention |
| **O2** — `types.ts` rouvert par quatre features | **DURCIE EN VETO, élargie** | La surface passe à 3 fichiers (`types.ts`, `destinations.ts`, `validate.ts`). **Veto sur tout plan de lots — celui-ci ou ceux des n° 3 à 6 — qui nomme l'un de ces trois fichiers dans un lot de type `feature`** |
| **P1** — `projeterCharpente` | **RETIRÉE** | Démonstration de `narratif-ia` + précédent `construireContexte` |
| **P2** — `DeltaBrut` + `CHEMINS_DE_DELTAS` | **MAINTENUE** | Règle de refus testée, pas un type nu |
| **P3** — `meta` n'est pas une racine | **MAINTENUE** | Compatible avec `qa` : sort du décompte, la propriété reste |

## Découpage RÉVISÉ — **UN SEUL LOT**, type `contrat`

Fait revérifié : **zéro fichier de `src/features/**` et `src/player/**`**. `IssueList.tsx` rend `message`/`location`/`dossierIssueRemediation(issue)` sans brancher sur `code` ; la seule branche par code (`FILE_ERROR_MESSAGES`) est fermée sur `FileReadErrorCode`, intouché. Pas de worktree, pas de fusion, **zéro risque d'intégration** sur l'itération qui réécrit le contrat.

**Créés (N) — 2** : `src/brain/dossier/destinations.ts` · `src/brain/dossier/couverture.test.ts`
**Remplacés (R) — 9** : `types.ts` · `identifiers.ts` · `issues.ts` · `validate.ts` · `validate.test.ts` · `identifiers.test.ts` · `roundtrip.test.ts` · `__fixtures__/dossier-minimal.json` · `src/brain/index.ts`
**Sortis** : `projection.ts`, `projection.test.ts`. **Non touchés** : `bestiary.ts`, `rules.golden.test.ts` (déjà conforme), `freeze.ts`, `read.ts`, `DossierService.ts`, `CloudSyncService.ts`.

## Arbitrage de casse

La docstring d'it1 (`types.ts:99`) annonce `effetsRegles` en camelCase et mon tour 1 l'a recopiée. **`narratif-ia` § A a raison** : le document persistant est en `snake_case`, `createdAt`/`updatedAt` sont l'exception déjà livrée. Je tranche **`effets_regles`** ; la docstring périmée se corrige dans le même lot.

## `feuilleDe` — condition d'implémentation (réponse à `ux-designer`)

`feuilleDe` est aujourd'hui **privée dans `validate.ts`**, et `issues.ts` ne peut pas l'importer de là — `validate.ts` importe déjà `issues.ts`, ce serait un **cycle**. Elle **monte dans `identifiers.ts`** (module bas, où vit déjà `resoudreChemin`), exportée, et apprend à retirer l'indice de tableau : `monde.evenements[3].monstre_ref` → `monstre_ref`.

## `couverture.test.ts` — forme concrète

```ts
function feuillesDeLaFixture(doc, prefixe = ''): string[]
// descend objets ET tableaux ; index normalisé en '[]' ; dédupliqué.
// Normaliser est indispensable : sinon ajouter un 2ᵉ personnage double les chemins
// et le test échoue par cardinalité au lieu d'échouer par NOM de champ.
function corrompre(doc, chemin): Doc   // remplace la feuille par une valeur du MAUVAIS type
```

Trois assertions : **couverture par corruption** (sauf `LIBRES`, nommé + motif) · **couverture de destination** (sauf `SANS_DESTINATION`, nommé + motif) · **disjonction** héritée d'it1.

**Remplacement, pas ajout** : le `describe('exhaustivite des tables du validateur')` de `validate.test.ts` est **SUPPRIMÉ** et classé tel au journal (KR-162).

**Conséquence sur la fixture** : `dossier-minimal.json` doit porter **une occurrence de chaque champ neuf, y compris les optionnels** — `monde.evenements` est `[]` aujourd'hui, donc `monstre_ref` serait invisible au balayage. C'est elle, et non les tables, qui est l'entrée unique de l'instrument.
