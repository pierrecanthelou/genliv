## RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE** — Le piège nommé par la consigne est réel et mesuré : les trois fixtures (`dossier-minimal.json`, `dossier-reference.json`, `construireAmorce`) rendent **zéro** avertissement de `validateDossier`. Aucune assertion existante de `controles.test.ts` (26 tests) ni de `panneauControles.test.tsx` (7 tests) ne mute un champ producteur d'avertissement (`revele_si`, `duree`, `condition_expr`, `synopsis_mj`). Conséquence : un lot qui câble le pont **à l'envers, ou pas du tout**, laisserait les deux suites vertes à l'identique. « Suites inchangées » n'est donc pas une preuve, c'est un silence d'instrument.

**OBJECTION** — Le cadrage laisse ouvert, pour ce même tour, l'arbitrage niveau (alerte/info) des dix sites (§ 8) *et* le choix import-vs-double-source (§ 9). Un critère qui ne fixe ni l'un ni l'autre n'est pas observable : « le rapport agrège les avertissements » ne dit pas quel test rougirait sur quel niveau. Je pose veto sur toute clôture de raffinage sans une table fermée `site → NiveauControle` (10 lignes, balayée par compilation) et sans le choix architectural tranché — les deux conditionnent le fichier et l'assertion de chaque critère.

**PROPOSITION** — Chaque critère doit s'appuyer sur une mutation d'UN SEUL champ produisant un avertissement réel (les 4 vérifiées ci-dessous), jamais sur les trois fixtures dormantes seules. Le test KR-217 actuel (source-scan `not.toContain('validateDossier')`) doit être remplacé, pas conservé — voir § 5 annexe.

**VERDICT** : **non prêt** — retour comité, tour 2, tant que la table de niveaux et le choix d'architecture ne sont pas fixés par écrit.

---

## ANNEXE

### 1. Critères d'acceptation proposés (8, `Étant donné/Quand/Alors`)

1. **Discriminant** — Étant donné `dossier-minimal.json` cloné avec `savoirs[0].revele_si` mis à `{}` (un seul champ), quand `controlerDossier` est appelé, alors un contrôle de section `personnages` apparaît, **absent sur le clone non muté** (les deux résultats comparés dans le même test). Niveau unitaire (contrat `brain/`), `src/brain/dossier/controles.test.ts`.
2. **Niveau jamais bloquant** — Étant donné les quatre mutations à un seul champ (`synopsis_mj` > 600 mots, `revele_si: {}`, `charpente.fins[0].condition_expr` supprimé, `plan_actions[0].duree` supprimé), quand `controlerDossier` est appelé sur chaque clone, alors chaque contrôle produit porte `niveau ∈ {'alerte','info'}`, jamais `'bloquant'`. Niveau unitaire, `controles.test.ts`.
3. **Section déclarée, table totale** — Étant donné les dix sites du § 7 du cadrage, quand chacun est mappé par la règle importée, alors sa `section` observée est celle de la table du cadrage (ex. `revele_si` → `personnages`, `charpente.fins[].condition_texte` → `jalons-fins`), vérifiée par un `Record` total fermé par compilation — pas une énumération échantillonnée (KR-199). Niveau unitaire, `controles.test.ts`.
4. **Garde KR-217 reformulée** — Étant donné le code source de `controles.ts` après le lot, quand un balayage de source est exécuté, alors aucune occurrence de `.errors` sur un résultat de `validateDossier` n'existe (seul `.warnings` est lu). Ce test **remplace** `'le rapport ne passe jamais par le canal errors ou warnings du validateur'` (l.336-342), devenu structurellement rouge si l'import est retenu. Niveau unitaire (source-scan), `controles.test.ts`.
5. **Non-régression des trois dormantes** — Étant donné `dossier-minimal.json`, `dossier-reference.json` (intact) et `construireAmorce(...)`, quand `controlerDossier` est appelé, alors le rapport est strictement identique (mêmes contrôles, mêmes comptes) à l'état pré-lot. Niveau unitaire, `controles.test.ts` + `panneauControles.test.tsx`, assertions numériques non modifiées.
6. **JSDoc renversée, source-scan** — Étant donné la phrase actuelle de `controles.ts` (« il n'a rien à y lire »), quand la voie import est retenue, alors un balayage de source constate qu'elle ne subsiste plus littéralement dans le fichier. Niveau unitaire (source-scan), `controles.test.ts`.
7. **Remédiation non fuyante** — Étant donné un contrôle mappé depuis un avertissement importé, quand `controleRemediation` est appelé, alors la chaîne rendue est une prose propre à `controles.ts`, jamais `dossierIssueRemediation` ni un message technique sérialisé. Niveau unitaire, `controles.test.ts`.
8. **Rendu composant** — Étant donné un contrôle importé rendu dans le panneau via une fixture **locale** clonée-mutée (jamais `dossier-minimal.json`/`dossier-reference.json`, cf. resolved_decision it3), quand le panneau est rendu, alors sa ligne suit l'anatomie à trois lignes + pastille déjà en production, sans nœud neuf. Niveau composant, `panneauControles.test.tsx`.

### 2. Vérification de la mesure du cadrage — REJOUÉE

Rejouée par un test-sonde temporaire (`src/brain/dossier/__probe_it5_qa.test.ts`, écrit, exécuté, puis supprimé — `git status` et `npm run typecheck` revenus identiques après coup) :

- **Zéro avertissement confirmé, et déjà couvert par des tests existants et verts** — pas seulement mesuré ad hoc :
  - `dossier-minimal.json` → `validate.test.ts` l.85 (`la fixture minimale passe sans erreur`, `warnings` = `[]`).
  - `dossier-reference.json` (intact) → `validate.test.ts` l.1019/1027 (comparaison « corrompu vs intact », `intact.warnings` = `[]`).
  - dossier neuf (`construireAmorce`) → `amorce.test.ts` l.86-94 (« rend un document que le validateur accepte sans erreur ni avertissement »).
- **Les quatre codes, chacun atteignable par une mutation d'UN SEUL champ sur `dossier-minimal.json`** — les 4 tests-sondes passent :
  - `texte-trop-long` : `canon.mj.synopsis_mj` porté à 650 mots (budget = 600, `BUDGET_MOTS_CANON`).
  - `revelation-sans-porte` : `savoirs[0].revele_si = {}`.
  - `condition-sans-expr` (fin) : `charpente.fins[0].condition_expr` supprimé, `condition_texte` conservé.
  - `condition-sans-expr` (si_bloque) : `plan_actions[0].duree` supprimé, `si_bloque` conservé.

**Le cadrage est exact sur ce point** — contrairement aux deux itérations précédentes, aucune mesure fausse trouvée ici.

### 3. Le piège du lot — le test qui discrimine

Un test « le rapport contient N contrôles » sur `dossier-minimal.json`/`dossier-reference.json`/`construireAmorce` ne prouve **rien** : les trois rendent zéro avertissement, donc N est identique que le pont soit câblé, câblé à l'envers, ou absent. **Le test qui discrimine** est le critère 1 ci-dessus : cloner `dossier-minimal.json`, muter **un seul** champ producteur d'avertissement (`revele_si: {}` est le plus simple — un seul avertissement, une seule règle importée concernée), puis comparer **dans le même test** le rapport du clone muté à celui du clone intact. Il rougirait si le pont n'était pas câblé parce que : (a) le module `controles.ts` n'appelant pas `validateDossier` (voie rejetée) ou ne lisant pas `.warnings` (voie retenue mais bridée), le clone muté produirait un rapport **identique** à l'intact — la mutation n'aurait aucun effet observable. C'est l'absence de delta entre muté et intact, et non le compte absolu, qui porte la preuve.

### 4. Ligne de base (exécutée avant tout changement)

- `controles.test.ts` : **26/26 verts**.
- `validate.test.ts` : **204/204 verts** (suite complémentaire au périmètre demandé, lue pour contexte KR-217).
- `panneauControles.test.tsx` : **7/7 verts**.

**Bascule si `controles.ts` importe les avertissements** : **zéro** des assertions existantes ne bascule dans `controles.test.ts` ni `panneauControles.test.tsx` — confirmé par grep exhaustif : aucune des deux suites ne mute jamais `revele_si`, `duree`, `condition_expr` ou un texte au-delà du budget de mots. C'est plus sévère qu'à it3 (où six assertions basculaient, quatre nommées) : ici, **aucune ne bascule du tout**, ce qui est précisément le signal que ces suites ne peuvent pas, seules, prouver le câblage — d'où le critère 1 et le test-sonde du § 3, à écrire neuf.

### 5. KR-217 — le test de source rougit

Confirmé par lecture : `controles.test.ts` l.336-342 —
```js
it('le rapport ne passe jamais par le canal errors ou warnings du validateur', () => {
  expect(SOURCE_CONTROLES).not.toContain('validateDossier')
  expect(SOURCE_CONTROLES).not.toContain("from './validate'")
})
```
**Si le lot retient l'import, ce test rougit à coup sûr** — il teste littéralement l'absence d'import, pas l'invariant réel de KR-217. Or KR-217 (relu dans `code-knowledge.json` l.697) porte sur un point plus étroit : ses propres règles ne doivent jamais **produire** via le canal `DossierIssue`/`errors`/`warnings` (motif d'origine : `suffisance.test.ts` rougirait si « indice à détenteur unique » sortait par ce canal). Il ne tranche pas la question inverse — **lire** `.warnings` en entrée d'un mapping vers un type frère. **Ce que ce test doit devenir** (critère 4 ci-dessus) : un balayage de source qui interdit toute lecture de `.errors` sur un résultat de `validateDossier` (garde l'axe ÉCRIT/JOUABLE de KR-217 intact) plutôt que d'interdire l'import lui-même. Sans ce remplacement écrit dans le plan, la porte qualité rejette le lot dès `jest`.

### 6. Rejets nommés

- **REJET** — prouver le pont sur `dossier-minimal.json`/`dossier-reference.json`/`construireAmorce` seuls : les trois y produisent zéro avertissement mesuré, un vert dessus ne prouve rien (§ 3).
- **REJET** — laisser `Controle.niveau` ou tout champ voisin porter une valeur de `DossierIssueSeverity` (`'error'`/`'warning'`) : romprait l'axe ÉCRIT/JOUABLE que KR-217 pose explicitement à deux vocabulaires distincts.
- **REJET** — clore ce tour sans une table fermée `site → NiveauControle` sur les dix sites (§ 8 du cadrage) : un niveau non tranché n'est pas un critère observable, c'est une décision reportée en silence dans le code.
- **REJET** — conserver tel quel le test `controles.test.ts` l.336-342 si la voie import est retenue : vérifié par lecture, il rougit à coup sûr (§ 5).