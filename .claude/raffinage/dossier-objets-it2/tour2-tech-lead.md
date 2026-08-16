# Raffinage `dossier-objets` it2 — Tour 2 (Tech Lead)

**À QA — la fixture : compatibles, et c'est ta version qui prend le test principal.** Je retire la primauté de P1. La discriminance KR-202 est une question d'**indexation du refus**, pas de données réelles : une fixture à 2 objets isole la variable, la référence la noie. Une condition dure, sinon mon « zéro `brain/` » tombe : *locale* veut dire **construite en test** (`dossiers.create()` + `dossiers.update()`) dans `retraitObjet.test.tsx` — **jamais** un fichier neuf sous `src\brain\dossier\__fixtures__\`, qui serait un fichier `brain/`, donc un lot `contrat` pour une fixture. Je garde **une ligne** sur la référence réelle, hors discriminance : `objet.lanterne-de-corvin` refusé. Le critère #6 relit déjà le fichier ; c'est la seule chose qui verrait quelqu'un retirer cette contrepartie et vider la garantie d'it2 en silence (KR-156).

**À PM — oui, sans réserve.** Critère #4 et goal : « nomme le **personnage porteur** », sans « /savoir ». Observable sur `issue.location` (« Personnage « … » »), jamais sur le message, qui dit `Le champ « objet_id » pointe « objet.x », qui n'existe pas dans ce dossier.` Le savoir part en `open_questions`.

**À QA — armement du « aucun pré-vol ».** Bouton actif + verbatim : retenu. Le spy seul ne prouve rien — `update` est appelé dans les deux mondes. Deux ajouts : (1) asserter la **recette** — `updateSpy.mock.calls[0][1](dossier).monde.objets` ne contient plus l'id : la feature a tenté, le SSOT a refusé ; (2) faute d'auto-référence sur `Objet`, un **test-grep** (précédent critère #7 / KR-187) : ni `PanneauObjets.tsx` ni `FicheObjet.tsx` ne contiennent `personnages` ni `savoirs`. Le pré-vol devient inécrivable, pas seulement absent.

**À UX** — aucun désaccord : Modal, tranché.

**Statut** — Objection 1 **MAINTENUE** (converge avec PM). Objection 2 **MAINTENUE** (P2). P1 **AMENDÉE** (QA l'emporte sur le test principal). P3 maintenue en `open_question`.

**VERDICT — recevable sous réserve** : P2, réécriture du critère #4, fixture construite en test.

---

## Annexe — lots (inchangés) et précision

Toujours **un seul lot `dev-lot`**, exécution séquentielle, aucun `contrat`, aucun worktree. Aucune signature ne bouge par rapport au tour 1 (`FicheObjetHandle.focusRetirer()`, `designationDe(objet, index)`, `RetirerObjetDialogProps{ nomAffiche, onConfirm, onCancel }`, `RefusEnCours{ objetId, statut, issues }`, `commit(objets, objetId, { resout })`).

| # | Fichier | N/R | Note |
|---|---|---|---|
| 1 | `src\features\dossier-objets\components\RetirerObjetDialog.tsx` | N | Modal, muet sur les référents |
| 2 | `src\features\dossier-objets\components\FicheObjet.tsx` | R | `forwardRef<FicheObjetHandle>`, `designationDe` exporté, bandeau de refus |
| 3 | `src\features\dossier-objets\components\PanneauObjets.tsx` | R | `enConfirmation`, `RefusEnCours`, `boutonAjouterRef` dans **les deux** branches |
| 4 | `src\features\dossier-objets\components\styles.ts` | N | P2 — déplacement des 99 lignes `CSSProperties` (PanneauObjets.tsx:241-339) |
| 5 | `src\features\dossier-objets\tests\retraitObjet.test.tsx` | N | Discriminance sur fixture **construite en test** ; test-grep anti-pré-vol ; 1 ligne sur la référence réelle |
| 6 | `src\features\dossier-objets\tests\panneauObjets.test.tsx` | R si nécessaire | A priori intact |

**Ajout au hors-périmètre du plan, à écrire noir sur blanc** : aucun fichier de `src\brain\` — **y compris `src\brain\dossier\__fixtures__\`**. Une fixture partagée neuve requalifierait l'itération en lot `contrat` ; c'est le seul chemin par lequel le découpage à un lot peut se casser.
