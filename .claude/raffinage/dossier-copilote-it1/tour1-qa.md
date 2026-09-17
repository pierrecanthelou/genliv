# Tour 1 — QA — `dossier-copilote` it1

RISQUE — Le scanner anti-identifiant (AC6 / KR-235) est le seul garde qui empêche une fuite d'id de franchir la porte, et son canari « prose bénigne » a DÉJÀ été mesuré défaillant sur une version non ancrée naïve : `'Il dit: « Enfin.tout est pret. » Elle range son objet.favori.'` produit `['fin.tout','objet.favori']` (mesure existante, `.claude/raffinage/dossier-copilote-cadrage/tour2-qa.md` § C3). `fin` et `objet` sont deux des onze espaces de noms ET des mots français courants. Un scanner qui passe la porte sans que CE canari précis ait été rejoué contre l'implémentation réelle peut soit rester inerte (ancré, KR-235 déjà vécu une fois), soit refuser une prose saine et casser la démo elle-même à l'acceptation.

OBJECTION — Le critère (spec l. 22) exige « ses deux canaris dans le même test » mais ne les FIXE pas littéralement : sans ça, « recevable » se prouve avec un couple de canaris complaisant (une phrase qui ne contient aucun des 11 préfixes) qui laisserait passer exactement le cas déjà mesuré fautif.

PROPOSITION — Épingler dans le lot contrat les deux chaînes littérales : fuite = un champ contenant `pnj.aldur-2` ; bénigne = la phrase déjà mesurée ci-dessus, mot pour mot. Le lot ne se signe qu'après un run réel des deux contre le regex choisi (pas une déduction) — sinon même défaut que BUG-084 / BUG-087 mais avant l'essaim au lieu qu'après.

VERDICT — recevable sous réserve (scanner à canaris épinglés et rejoués ; 8 critères au plus, voir annexe (f)).

---

## ANNEXE

### (a) Environnement node pour la route worker — MESURÉ

Probes créés puis supprimés, `git status --short` vérifié propre après nettoyage.

- `npx jest src/brain/__qa_probe_node_env__.test.ts` avec docblock `/** @jest-environment node */` → PASS, `typeof window === 'undefined'`. `jest-environment-node` est déjà présent dans `node_modules` (transitif de jest core) — **aucune dépendance neuve à installer**.
- Discriminant : sans docblock, même run → `typeof window === 'object'` → PASS (confirme jsdom par défaut, donc le premier résultat n'est pas un faux positif d'environnement).
- `npx jest --config jest.config.cjs --listTests | grep worker` → aucun résultat. Test posé directement sous `worker/__qa_probe_reachable__.test.ts` puis lancé par chemin exact → **« No tests found »** ; jest affiche lui-même `testMatch: .../src/**/*.test.{ts,tsx} - 87 matches`, `Pattern: worker\...test.ts - 0 matches`.

**Conclusion mesurée** : le docblock suffit, zéro travail sur l'environnement. Le vrai manque est `testMatch`/`roots` — `worker/` n'y figure pas du tout sur le `jest.config.cjs` du disque. C'est un chiffrage d'une ligne (`testMatch: [..., '<rootDir>/worker/**/*.test.ts']`), pas une case déjà cochée : le lot contrat doit l'écrire explicitement.

### (b) Pouvoir séparateur

- *Rejeu exactement une fois* : **NON MESURÉ** (`CopiloteService` n'existe pas). Argument de conception : le critère « 1 appel si conforme » seul n'attrape ni « 0 rejeu » (refus direct sans second essai) ni « boucle jusqu'à succès » (rejeu illimité). Il faut le couple (conforme du premier coup = 1 appel ; deux non-conformes = 2 appels ET état terminal, rien persisté) et, à l'essaim, écrire réellement les deux implémentations fautives (0 rejeu / rejeu illimité avec un 3ᵉ mock qui réussirait) et vérifier qu'elles rougissent — sinon même défaut que BUG-087.
- *Discriminance des 4 textes* : quatre `getByText` séparés, chacun sur un rendu isolé, ne prouvent PAS l'inégalité des chaînes — un même texte copié-collé sur 4 états passerait ces 4 tests. Il faut une assertion explicite d'inégalité (`new Set([T1,T2,T3,T4]).size === 4`, ou 6 comparaisons `.not.toBe`) EN PLUS du rendu par état. Argument logique, **NON MESURÉ** faute de code à date.
- *Absence de mémoire* : « 2 lancers ⇒ corps identiques » attrape un id de requête, un horodatage ou un historique de refus injecté dans le CORPS. Il n'attrape RIEN si cette fuite est mise dans un EN-TÊTE HTTP plutôt que le corps — à nommer comme **limite du témoin**, pas comme un trou à corriger ici. **NON MESURÉ**.

### (c) Scanner anti-identifiant

Forme proposée : `\b(pnj|lieu|objet|indice|quete|objectif|jalon|fin|evenement|climat|bestiaire)\.[a-z0-9-]+` appliqué sur les valeurs de PROSE du JSON parsé (jamais sur le blob brut avant parse). MESURÉ que le couple de canaris ci-dessus casse une version naïve (source : cadrage, **pas rejoué aujourd'hui** faute de code — à rejouer par `dev-contrat` avant signature, jamais supposé résolu).

### (d) Confinement

- **MESURÉ (lecture)** : `feuillesDeLaFixture` est bien `export function` dans `src/brain/dossier/couverture.test.ts` (l. 154). Importable depuis `brain/copilote/*.test.ts` par chemin relatif — techniquement légal (aucune règle n'interdit d'importer d'un `.test.ts` voisin dans `brain/`), mais **NON MESURÉ** que ça compile réellement une fois utilisé (à vérifier au premier essaim).
- `DESTINATION_DES_CHAMPS` n'est **pas** ré-exporté par `brain/index.ts` (grep confirmé, commentaire l. 126 l'assume délibéré) : la table de confinement doit l'importer en **import profond direct** depuis `'../dossier/destinations'`, jamais via le barrel — ce n'est pas une violation d'isolation puisque tout reste dans `brain/`.

### (e) Non-régression nommée

Trouvé (lecture) : `dossierEditorScreen.test.tsx` porte déjà un `describe('selection d une section: etat vide au mot pres', …)` paramétré section par section (l. 450), et un garde de placement par regex sur le texte source pour `panneauControles AVANT panneaux` (l. 666-680). Pour la 11ᵉ destination « Copilote » : ajouter une entrée au même describe paramétré, et étendre le garde de placement (`panneauCopilote` = 3ᵉ prop sœur, donc son ordre relatif à `panneauControles` doit être vérifié par le même mécanisme texte-source, pas réinventé).

### (f) Proposition à 8 critères au plus

Les 14 de la spec sont déjà tous d'it1 (aucun rang / nombre / entité) — rien ne part réellement vers it2-4 ; le problème est le COMPTE, signal de coupe de la skill. Regroupement en 8, chacun avec son niveau :

1. Réponse conforme ⇒ 1 appel (unitaire brain).
2. Rejeu une fois puis terminal, 2 témoins dans 1 critère (unitaire brain).
3. 4 textes distincts, assertion d'inégalité incluse (composant RTL).
4. `DossierService.update`, ordre persist→event, refus `validateDossier` = nominal (unitaire + composant).
5. Scanner anti-identifiant, 2 canaris épinglés et rejoués (unitaire brain).
6. Confinement `feuillesDeLaFixture` + `DEROGATIONS_AUDIENCE` vide assertée + allow-list nommée (unitaire brain).
7. `MARQUEUR_A_ECRIRE` retiré ⇒ refus sans fetch ; 2 lancers ⇒ corps identiques (unitaire brain).
8. Route worker : test node (`testMatch` étendu), POST dans CORS, garde de taille ; non-régression 10 sections vides + doc de référence ; lint/tsc zéro erreur (route node + composant + porte de commit).

### Fichiers lus / commandes exécutées

`.claude/raffinage/dossier-copilote-it1/cadrage.md`, SKILL.md (raffinage-iteration), `src/features/dossier-copilote/specification.json`, `bug_history.dossier-controles.json` (BUG-082/084/087), `jest.config.cjs`, `jest.mutation.cjs`, `src/brain/dossier/couverture.test.ts`, `worker/index.ts`, `src/brain/dossier/destinations.ts` (extrait), `src/brain/index.ts` (grep), `src/brain/dossier/identifiers.ts`, `src/brain/CloudflareKVTransport.test.ts`, `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (grep), `.claude/raffinage/dossier-copilote-cadrage/tour2-qa.md`.
Commandes : deux probes jest sous `src/brain/` (créés puis supprimés) et un probe sous `worker/` (créé puis supprimé) ; `git status --short` vérifié propre après nettoyage.
