RISQUE — Le risque architecture n°1 est confirmé sur le code réel : `avecIndiceConfie` (`src/brain/dossier/recit.ts:140-144`) construit `{ a_dit: [...existant, indiceId] }` en LITTÉRAL, écrasant tout autre champ de `EtatPnj[personnageId]`. Dès que `confiance?: number` existe, tout tour où un PNJ révèle un indice efface silencieusement sa confiance créditée (et vice-versa si `crediterConfiance` est écrit sans la même discipline). C'est exactement KR-013/175 en formation : une seconde écriture de registre qui ne préserve pas son voisin.

OBJECTION — La liste `brain_contracts` d'it3 dans la spec (faits.ts, session.ts, sessionDestinations.ts, REGLES-DU-JEU.md) N'INCLUT PAS `recit.ts`, alors que son correctif est une condition de fermeture du contrat lui-même, pas un détail de lot feature : sans lui, `EtatPnj` à deux champs n'est pas un contrat sûr, c'est un piège posé. Le lot contrat ne peut pas se déclarer figé tant que ce fichier n'y est pas nommé.

PROPOSITION — (1) Ajouter `src/brain/dossier/recit.ts` (fonction `avecIndiceConfie` seule) au lot contrat it3, avec le même patron que la future `crediterConfiance` : spreader `faits.pnj[id]` existant avant d'écrire la feuille touchée, jamais un littéral à une clé. Test de non-régression obligatoire : révéler un indice PUIS créditer confiance (et l'inverse) → les deux champs survivent sur la même entrée `EtatPnj`. (2) Trancher ici la question ouverte n°6 : AUCUN signal qualitatif à R4 en it3 (delta décidé sur la réplique/situation seule) — cohérent avec le refus it1 de coller deux capacités, évite un second bloc injecté + registre de libellés + re-mesure de `BUDGET_CARACTERES_DOSSIER_ACTEUR` non demandés par les AC. (3) `docs/REGLES-DU-JEU.md` § Confiance & Persuasion : aujourd'hui ZÉRO occurrence — confirmé absent, condition bloquante réellement non remplie, doit être écrite et relue avant tout code, saturation testée explicitement (ni `session.ts` ni `faits.ts` ne sont dans le périmètre muté Stryker).

VERDICT — recevable sous réserve (correctif `recit.ts` dans le lot contrat + tranchage explicite de la question n°6 + doc écrite avant code).

---

ANNEXE — observations techniques détaillées

**1. Le risque du point 5, vérifié sur le code réel**

- `src/brain/dossier/faits.ts:34-36` — `EtatPnj` a aujourd'hui UN SEUL champ (`a_dit`). La docstring (l.30-32) annonce déjà explicitement « `confiance` : propriétaire n° 12, NON DÉCLARÉE » — bon signe, la feature a anticipé l'ajout en commentaire sans le câbler en avance (KR-195/196 respecté).
- `src/brain/dossier/recit.ts:140-144` (`avecIndiceConfie`) :
  ```ts
  function avecIndiceConfie(faits: FaitsDeSession, personnageId: string, indiceId: string): FaitsDeSession {
      const existant = estCleDe(faits.pnj, personnageId) ? faits.pnj[personnageId].a_dit : []
      if (existant.includes(indiceId)) return faits
      return { ...faits, pnj: { ...faits.pnj, [personnageId]: { a_dit: [...existant, indiceId] } } }
  }
  ```
  La ligne de retour construit `{ a_dit: [...] }` — un objet à UNE clé — et non `{ ...faits.pnj[personnageId], a_dit: [...] }`. Avec deux champs sur `EtatPnj`, cette fonction EST un écrivain destructeur de `confiance` dès qu'elle s'exécute. Appelée depuis `consignerReponseActeur` (l.204-209), donc à CHAQUE révélation d'indice.
- Patron correct déjà présent ailleurs dans le même fichier à titre de précédent : `fixerHeros` (`session.ts:546-548`) et `crediterXp` (`session.ts:587-590`) spreadent toujours l'objet existant avant de poser la feuille touchée — c'est CE patron, appliqué un niveau plus bas, qu'`avecIndiceConfie` doit adopter, et que la future `crediterConfiance` doit suivre dès l'écriture initiale pour ne pas reproduire le même bug en sens inverse.
- Conclusion : le risque n'est pas hypothétique, il est positionnellement certain si `recit.ts` reste hors du lot contrat. Fixer les DEUX fonctions dans le MÊME lot contrat, avec un test croisé explicite (ordre A: révéler puis créditer ; ordre B: créditer puis révéler — les deux doivent converger vers le même état final).

**2. `revelation.ts` — mécanique de la conjonction pour `confiance_min`**

- `portesOuvertes(faits, revele_si)` (l.91-108) ferme AUJOURD'HUI `confiance_min` et `jet` inconditionnellement (l.95-96), sans recevoir `personnageId` dans sa signature actuelle.
- Pour honorer `confiance_min`, `portesOuvertes` doit lire `faits.pnj[personnageId]?.confiance ?? CONFIANCE_DEPART` et comparer au seuil — ce qui impose d'ajouter `personnageId` à sa signature (appelée uniquement depuis `evaluerSavoir`, l.129, qui a déjà `personnageId` — threading trivial, UN appelant à modifier). Risque faible : changement de signature d'une fonction non exportée.
- La conjonction reste un ET strict : ajouter la lecture de `confiance_min` ne touche à aucune autre porte, patron régulier, conforme KR-280.

**3. `schemaSortie.ts::validerActeur` — extension pour `delta_confiance`**

- `CLES_SORTIE_ACTEUR = ['replique', 'indices_reveles']` (l.1531) piloté comme ensemble EXACT de clés — ajouter `'delta_confiance'` est une ligne de registre + un prédicat de plus, précédent direct `validerArbitre` (membership sur des registres fermés).
- Le refus atomique est déjà implémenté pour `indices_reveles` via `rangsOuverts.has(rang)` (prédicat 12, l.1654) — même patron pour `delta_confiance` : `typeof === 'number' && [-1,0,1].includes(valeur)`, sinon refus total. Le registre `[-1,0,1]` doit être déclaré UNE SEULE FOIS et importé, jamais recopié en dur.
- Pas de re-résolution nécessaire pour `delta_confiance` (contrairement à `indices_reveles`, rang→id) : la valeur passe identique de `SortieActeurBrute` à `ReponseActeur`.

**4. Audience et doc**

- `sessionDestinations.ts` : la ligne `'monde.pnj.<id>.confiance': 'moteur'` doit être ajoutée EN MÊME TEMPS que le chemin au type `CheminDeFeuilleDeSession` (l.77 actuel ne porte que `'monde.pnj.<id>.a_dit[]'`) — sinon le compilateur n'exige rien et `sessionCouverture.test.ts` ne peut pas prouver l'exhaustivité. Précédent BUG-144/146 de cette même feature : des fichiers de garde oubliés du lot signé — à nommer explicitement.
- `docs/REGLES-DU-JEU.md` : grep confirmé ZÉRO occurrence de « Confiance »/« confiance_min »/« CONFIANCE ». KR-130/279 bloquant réellement : aucun code d'it3 ne doit être écrit avant cette section.

**5. Question ouverte n°6 — avis**

Les deux options sont architecturalement propres. Mais ajouter un signal qualitatif à R4 engage un NOUVEAU bloc injecté dans `contexte/acteur.ts`, un registre fermé de libellés, et une re-mesure de `BUDGET_CARACTERES_DOSSIER_ACTEUR`. Rien dans les acceptance_criteria d'it3 ne l'exige. Recommandation : trancher POUR « aucun signal » en arbitrage, et consigner l'option inverse comme dette à déclencheur nommée (même doctrine que `contrepartie.consomme:true`).

**6. Isolation / imports** — rien d'anormal : tous les fichiers concernés sont dans `src/brain/dossier/` et `src/brain/copilote/`, aucun import inter-features détecté. Découpage final recommandé : un lot contrat unique couvrant `faits.ts`+`session.ts`(nouvelle `crediterConfiance`)+`sessionDestinations.ts`+`recit.ts`(fix `avecIndiceConfie`)+`revelation.ts`+`schemaSortie.ts`+`copilote/types.ts`+`CopiloteService.ts`+`docs/REGLES-DU-JEU.md`, suivi d'un lot feature fin (`useTourDeJeu.ts` + test) — deux lots, séquentiels.
