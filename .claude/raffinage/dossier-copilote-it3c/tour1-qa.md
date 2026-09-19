# Tour 1 — `qa` · `dossier-copilote` it3c

**RISQUE** — Ce rôle combine **pour la première fois** un **JETON** (désignation par rang) et de la **PROSE** (rédaction) dans **UN seul objet retourné**. Aucun validateur livré ne couvre ce cas mixte, et le cadrage dit lui-même que la doctrine DÉSIGNATION/RÉDACTION **« ne tranche pas »** ici. **Sans critère qui nomme un scénario séparateur, on répète BUG-113** (assertion de résultat vraie des deux côtés d'un mutant).

**Trois résultats pressentis, quatre divergences à exiger explicitement :**
1. **`cible_id` re-résolu** : exiger **≥ 2 candidats de rang distincts** et vérifier que `P2` résout le **DEUXIÈME** id (pas le premier) — sépare un bug d'indexation d'un `Map.get` correct.
2. **`intensite` posée par le code** : exiger **`toBe(0)`, jamais `toBeFalsy`/`ok(valeur)`** — ⚠ **`0` est truthy-fragile**, un `intensite || DEFAUT` en aval le confondrait avec « absent » (précédent KR-221).
3. **Auto-référence (KR-194)** : exiger un scénario où **le personnage source figure lui-même dans la table de rangs**, et vérifier qu'il **N'EST PAS filtré** — sépare un nettoyage « raisonnable » (bug) d'une implémentation correcte.
4. **Référence orpheline (KR-021)** : cible résolue au gel, personnage supprimé avant acceptation → l'écriture doit **exposer l'échec**, pas produire le **no-op silencieux de la famille BUG-114** (4 précédents, jamais corrigés).

**OBJECTION** — **cible déjà en relation** (doublon de `cible_id`) n'est pas arbitrée dans le cadrage ; **le sort d'une réponse vide n'est pas tranché** malgré la demande explicite.

**PROPOSITION** — écrire ces 4 scénarios comme **critères `Alors`-avec-état-séparateur avant l'essaim** ; trancher doublon + vide, sinon les porter en `open_questions`.

**VERDICT** — **pas de veto sur le cadrage**, mais **je bloquerai en tour 2 si les critères livrés n'ont pas nommé ces états séparateurs**.

---

## ANNEXE — instruments vérifiés (lecture seule, **aucune exécution** jest/tsc, le code de 3c n'existe pas)

- **`worker/frontiere.test.ts`** § « les deux plafonds » : `ROLES = Object.keys(INVITES)` — **DÉRIVÉ**, donc le piège 638-640 (`rolesAuMaximum`, `paires(etroits).find`) et le `describe.each(ROLES)` **s'étendront AUTOMATIQUEMENT** au 5ᵉ rôle sans code neuf. *Vérifié en lisant la construction, non rejoué.*
- ⚠ **`worker/index.test.ts:346-361, 476-499, 616-634`** : le test « `max_tokens` VARIE / COÏNCIDENCE épinglée » est **ÉCRIT À LA MAIN par route, PAS dérivé** — le rôle 4 nomme explicitement sa coïncidence avec le rôle 1 (l. 626-630). **Le 5ᵉ rôle N'AURA PAS cet instrument sauf si l'ouvrier l'écrit : à exiger comme critère de fini, pas à supposer hérité.**
- **`schemaSortie.ts`** : les trois validateurs existants n'ont **aucun code mutualisable** pour « jeton + prose » — un **4ᵉ validateur est à écrire**, pas à dériver par copie (aucun précédent `rang-inconnu` + `vide` combinés).
- **NON VÉRIFIÉ** : existence ou non d'une **contrainte d'unicité `cible_id`** dans `tables.ts` — fichier non ouvert. **À faire avant le plan.**
- `bug_history.dossier-copilote.json` (BUG-113, BUG-114) lu en entier — confirmé source des deux leçons citées par le cadrage.
