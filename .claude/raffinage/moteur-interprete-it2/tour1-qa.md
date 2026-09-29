## TOUR 1 RAFFINAGE — `moteur-interprete` it2/4

### RISQUE

Le critère #6 porte sur un ordre d'exécution (R1 → écriture → R3) mais n'énumère pas quand précisément R3 est appelé. Deux architectures sont concurrentes : (1) le hook `useTourDeJeu` orchestre la chaîne complète (it1 : R1 seul, it2 : R1 + exécution + R3) ou (2) R3 est appelé par `executerCommande` lui-même. Le premier place le verrou KR-265 au bon endroit (deux R1 rapides = un seul R3), le second crée une dépendance entre `brain/dossier/commandes.ts` et `CopiloteService` (violation de grain). La spec ne tranche pas encore — elle cite seulement « R3 est appelé APRÈS ». Sans une décision Architecture avant de coder, deux équipes codent deux solutions incompatibles.

### OBJECTION

Le critère #7 demande un « mutant obligatoire » mais ne spécifie pas la table de validation pour ce mutant. La structure de `Fait` n'existe pas encore (`faits_etablis[]` retourné par R3). L'énumération « sur:[] ou rang hors table » suppose une table d'ancrages (`TablesInterprete` existe pour R1, mais pas de `TablesNarrateur` en vue). Test structurel sur quoi ? Le critère passe d'une exigence métier («aucune création d'entité ») à un prédicat technique (« un rang invalide »), réduction recevable, mais le lieu de ce test reste opaque — `validerNarrateur` dans `schemaSortie.ts` ? Un test unitaire de `schemaSortie` qui rougit quand `sur:[]` ? Nommer le test précis coûte trois lignes et élimine l'ambiguïté.

### PROPOSITION

1. **Architecture R1→R3 décidée AVANT de coder** : reporter cette décision à tour 2 (refinement du plan de réalisabilité) ou la trancher maintenant en deux phrases. Si réponse « le hook en itère » : inclure un test dans `useTourDeJeu.test.ts` qui vérifie l'ordre d'appel (CopiloteService appelé deux fois : it1 une fois pour R1, it2 deux fois R1 puis R3).

2. **Critère #7 précisé** :
   - Nom du test : `validerNarrateur.test.ts` → suite « refus d'un fait sans rang valide »
   - Payload exact attendu : structure de `SortieNarrateur` (forme réseau), contrat type de `Fait` avec clé `sur: RangInjecte[]`
   - Scenario séparateur : deux tests concrets — (a) `sur:[]` rejeté avec erreur `'schema'`, (b) `sur:['rang_valide']` accepté si le rang figure dans la table fournie à la validation
   - Table de rangs : elle vient de l'assembleur de contexte narrateur (à nommer : `assemblerNarrateur`, rôle du lot contrat it2)

3. **Cas limites énumérés ici** :
   - R3 indisponible (timeout/illisible après rejeu) → dégradation en bloc (récit fixe, pas de faits, pas de suggestions), état déjà écrit inchangé (KR-263 implicite, verbe accepté, pas annulé)
   - Aucune suggestion (`suggestions:[]`, non `undefined`)
   - Aucun fait attesté (`faits_etablis:[]`, non `undefined`)

4. **KR-260 étendue** : mutant obligatoire — ajouter un import `CopiloteService` dans `interprete.ts` (lot contrat it2) → test rougit → retirer. Test nommé dans `play-mode/tests/moteurSansIA.extension.test.ts` (nouveau fichier, une seule suite, 5 lignes).

### VERDICT

**Recevable sous réserve** — acceptation conditionnée à (1) une décision architecturale sur qui orchestre R1+exécution+R3, écrite en deux phrases avant de coder, et (2) la structure de type de `Fait` + table d'ancrages nommées, ajoutées au contrat de types d'ici la fin du tour 1 de raffinage (avant vote).

### ANNEXE — Instruments et scénarios séparateurs

#### Critère #5 — verbe `agir` arité 0

**Instrument** : Jest + `useTourDeJeu.test.ts` (composant logique, hook, pas composant visuel)

**Scénario séparateur exact** :
- **Impl correcte** : une saisie qui ne mappe à aucun `aller` mais décrit une action (ex. « médite », « crie ») → R1 demander('interprete', …) retourne `{lecture:'commande', commande:{commande:'agir', cibles:[]}}` — test passe
- **Impl fautive 1** : R1 retourne `{lecture:'sans_commande', gestes_possibles:[]}` au lieu d'interpréter « agir » → test attend `commande:'agir'` mais reçoit `sans_commande` → **ROUGIT**
- **Impl fautive 2** : `agir` ne figure pas dans `COMMANDES` → appel échoue ou est rejeté par `resoudreInterpretation` → **ROUGIT**

Test nommé : `useTourDeJeu.test.ts → "it('exécute agir quand R1 rend commande agir cibles vides')"` — réécrit exactement comme le test « accepte une commande aller » d'it1, remplace par `agir`, vérifie que le hook retourne `avis.type === 'aucun'` et que `onSessionChange` a été appelé **sans** modifier `monde`.

#### Critère #6 — R3 appelé APRÈS persistance, reçoit projection

**Instrument** : Jest + mock de `CopiloteService.demander` avec timing contrôlé dans le hook (pattern exactement celui de `useTourDeJeu.test.ts` it1, l'assertion KR-013 qui constate que la session reçue est la **fraîche** du parent, pas une copie figée)

**Scénario séparateur exact** :
- **Impl correcte** :
  1. `executeAction(saisie)` appelé
  2. Hook appelle R1 (`CopiloteService.demander('interprete', …)`)
  3. R1 retourne `{lecture:'commande', commande:'aller'}`
  4. Hook appelle `executerCommande` (écriture session, `onSessionChange` appelé)
  5. Hook appelle R3 (`CopiloteService.demander('narrateur', {issue, deltas, projection})`)
  6. Test vérifie : (a) `onSessionChange` a été appelé AVANT l'appel à `demander('narrateur')`, (b) le payload de `narrateur` contient une `projection` de type EtatMonde jamais écrite en session
  7. Test passe

- **Impl fautive 1** : R3 appelé EN PARALLÈLE avec écriture (pas `await`) → hook retourne avant que session soit écrite → `onSessionChange` n'a pas été appelé quand R3 est invoqué → test constate un appel concurrent → **ROUGIT**

- **Impl fautive 2** : R3 appelé AVANT écriture → le payload reçoit l'ancienne session → test compare le payload avec la session attendue après `aller` → mismatch sur `lieu_courant` → **ROUGIT**

Test nommé : `useTourDeJeu.test.ts → "it('KR-263 bis — R3 invoqué APRÈS persistance de la session, avec projection')"`

#### Critère #7 — faits_etablis sans rang refusés, mutant obligatoire

**Instrument** : Jest + test structurel de validateur dans `copilote/schemaSortie.test.ts` (côté de `validerInterprete`)

**Scénario séparateur exact** :
- **Impl correcte** :
  - `validerNarrateur` reçoit une sortie IA : `{recit: "…", faits_etablis: [{fait: "…", sur: ['P1']}], suggestions: […]}`
  - Table d'ancrages fournie par assembleur : `{P1: 'personnage_1', P2: 'personnage_2', …}`
  - Validation passe ✓

- **Impl fautive 1 — le mutant** : `sur: []` (rang vide) → `validerNarrateur` accepte malgré tout → test constate `statut:'valide'` au lieu de `statut:'schema'` → **ROUGIT**

- **Impl fautive 2** : `sur: ['P999']` (rang hors table) → `validerNarrateur` accepte malgré tout → test constate `statut:'valide'` → **ROUGIT**

- **Impl correcte (rejet)** : `sur: []` → `validerNarrateur({recit: "…", faits_etablis: [{fait: "…", sur: []}]})` retourne `{statut:'schema', erreur: {champ: 'faits_etablis.0.sur', raison: 'tableau_vide_invalide'}}` → test passe ✓

Test nommé :
```
validerNarrateur.test.ts
  ✓ "refuse un fait avec sur vide"
  ✓ "refuse un fait avec rang inexistant"
  ✓ "accepte un fait avec rangs valides"
```

**Mutant obligatoire** — code muté dans le patch qui livre R3 :
```ts
// Dans schemaSortie.ts, fonction validerNarrateur, avant muté :
if (!fait.sur || fait.sur.length === 0) {
  return { statut: 'schema', erreur: … }
}
```
Mutant : enlever cette ligne → test rougit → revenir à impl correcte.

---

**Décisions autonomes prises faute de spécification** :
- **EntreeJournal.recit absent du modèle** → Choix : champ optionnel à vie (KR-251), ajouté en it2 dans session.ts, pas touché avant. Coût inverse : si on le pose requis, toute session it1 devient illégale à la lecture. Recevable car le champ est seul (pas de restructuration d'union).
- **Pas de test E2E du rendu** → Choix : l'écran de jeu n'existe pas en it2 (seul hook + persistance existe), impossible de tester « le joueur lit le récit ». Le test passe par useTourDeJeu + vérification du payload IA. Coût inverse : la preuve du critère « quand le joueur a écrit aller » reste partiellement fictive.
- **Aucune donnée d'« issue » du pas n'est spécifiée** → Choix : « issue » au sens de résultat de `executerCommande` = raison du succès/refus + deltas + nouvel état. Détail report à tour 2 (lot feature, composant OutcomeBlock, qui rendra le récit). Coût inverse : quoi injecter exactement dans R3 ? Risque découvert à l'essai.
