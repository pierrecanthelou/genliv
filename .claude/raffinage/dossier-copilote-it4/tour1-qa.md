# Tour 1 — `qa` · `dossier-copilote` it4

**RISQUE** — « **Brouillon sans identité** » reste une **formule** tant qu'aucun test n'espionne le **SITE D'APPEL** de `frapperIdentifiant` ni ne prouve son **ABSENCE** avant le clic d'acceptation. Sans cela, on rejoue **BUG-113** (le calcul gardé, jamais la source) sur **la seule création de la feature**.

**OBJECTION** — Aucun critère ne nomme la **FORME** du schéma « distribution » (liste d'objets à plusieurs champs, zéro jeton, zéro rang) ni **les champs proposables d'une entité NEUVE** — `CHAMPS_PROPOSABLES` est **vide pour ce cas** (mesure 4). Sans **exclusion nommée** (`id`, `portee`, `plan_actions`, `savoirs`, `nom` — audience `auteur`, KR-195), le critère KR-232 « chemins de feuille, jamais familles » est **irrecevable : rien ne dit ce qui EST exclu**.

**PROPOSITION**
1. **Espion sur `frapperIdentifiant`** : zéro appel entre la résolution de `demander()` et le rendu des cartes ; **un appel synchrone par clic « + », avant `update`**. ⚠ **Mutant séparateur** : précalculer les N identifiants à la réception doit **rougir** un test qui inspecte l'état **AVANT tout clic** — sinon « jamais avant » n'est qu'**affirmé**.
2. **Trancher si la liste vide est refus ou succès pour la CRÉATION** — **troisième cas**, hors désignation/rédaction.
3. **`MotifIllisible` atteignables** : `schema`, `vide` (si refus), `identifiant`. ⚠ **`rang-inconnu` est SANS OBJET** (aucun existant référencé) — **écrit ainsi dans le type, jamais rejoué par symétrie** (BUG-084).

**VERDICT** — **recevable sous réserve** : ces deux trous comblés avant code ; sinon **veto sur KR-231/232**.

---

## ANNEXE (hors quota)

### Mesures de l'orchestrateur — contestées ou confirmées

- ⚠ **Mesure 2 confirmée à la lettre, MAIS SA PORTÉE EST FAUSSE.** `useSocleEcriturePersonnages.ts:129-131` sème bien `{ id: frapperIdentifiant('pnj'), portee: PORTEE_INITIALE, plan_actions: [], savoirs: [] }`, **sans clé `nom` du tout** (pas même une chaîne vide). Mais **un personnage manuel a déjà une IDENTITÉ** — l'identifiant est frappé **immédiatement**. **Ce n'est donc PAS un précédent pour « brouillon sans identité », seulement pour « fiche sans nom ». NE PAS CONFONDRE LES DEUX AU RAFFINAGE.**
- **Mesure 1 partiellement vérifiée** : `types.ts:288` confirme `nom?: string` ; `:866` et `:875` confirment `fonction?` et `apparence?` marqués IA, optionnels. **Je n'ai pas relu `Personnage` en entier** pour vérifier que `id`, `portee`, `plan_actions`, `savoirs` sont bien les **SEULS** requis — à confirmer avant d'écrire la graine.
- **Mesure 3 confirmée** par `code-knowledge.json` (KR-195) : la destination de `Entite.nom` est `auteur` pour les 8 collections, personnages compris, et n'est pas rouverte par `dossier-fiches`. Par KR-232, `nom` ne peut être **ni vu ni proposé**.
- **Mesures 5 et 6 : NON revérifiées indépendamment** — je me suis fiée à l'orchestrateur, cohérent avec les `resolved_decisions` des rôles précédents.

### Ce que je N'AI PAS vérifié
`CopiloteService.ts` (signature, union à 5 branches, garde `never`) · `destinations.ts` en entier · `worker/index.ts`, `PanneauCopilote.tsx`, les `CarteXxx`/`LigneXxx` — **aucun lu**, donc mon avis sur le rendu réel n'est pas fondé · les entrées complètes de BUG-113 et BUG-115 · **aucune commande exécutée** (mode raffinage, avant code).

**Lus en entier** : le cadrage, `specification.json`, `copilote/types.ts`, `copilote/schemaSortie.ts`.
