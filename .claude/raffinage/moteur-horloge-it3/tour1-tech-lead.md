# Tech Lead — tour 1 — moteur-horloge it3

**RISQUE** : le constat de blocage est une décision à deux sites (le tick l'écrit au journal, R3 injecte `si_bloque`). Copiée, elle diverge sans bruit. Budget : `si_bloque` (~100 car.) remplace `action` (~50) au pire cas. M passe de 2283 à ~2370 (> 2333), budget dossier 7000 → 8000, `TAILLE_MAX_CORPS_IA` 87 040 → ~90 112. `worker/` entre dans le périmètre.

**OBJECTIONS** :
1. `tour − depuis >= duree` est un niveau, pas un événement : journal et réinjection à chaque pas. Seul le front `===` tient sans champ stocké (KR-013).
2. Les `continue` de `horloge.ts:118-119` sautent le contrôle pour les lignes 4 à 7 de J2.
3. Le cadrage dit « absent ≡ jamais, tranché ». J2 dit « l'it3 le relit ». Sélène et Corvin ont un plan d'UNE étape avec `duree` + `si_bloque`, n'avancent jamais → `si_bloque` inatteignable sur le dossier de référence.
4. Lire `.duree`/`.depuis` dans `horloge.ts` casse la garde source `horloge.test.ts:780-796`.

**PROPOSITIONS** :
- `blocage.ts` (N) : un site de décision, deux appelants (précédent KR-246 `etapeDeclenchee`).
- Journal : `etape_bloquee : <id> <k+1>`.
- R3 : action OU `si_bloque`, jamais les deux.
- `session.ts` (846 lignes) n'est pas rouvert.
- Sonde `jest` sur le point 3 avant de trancher ; fichier rouge hors L1 → couper l'itération.

**VERDICT** : recevable sous réserve. Conditions : front `===`, `worker/` dans L2, point 3 écrit dans J2 avant le code.

## ANNEXE : découpage en lots

Deux lots `contrat` séquentiels (L1 puis L2), aucun lot `feature`. Même schéma que it2.

| Lot | Type | Fichiers |
|---|---|---|
| **L1 `moteur-blocage`** | contrat | N `blocage.ts` · N `blocage.test.ts` · R `horloge.ts` · R `horloge.test.ts` · R `evaluate.test.ts` (baril) · R `REGLES-PLAY.md` (J2) · R `faits.ts` (commentaire, si origine 0) |
| **L2 `narrateur-si-bloque`** | contrat | R `contexte/horloge.ts` · R `narrateur.ts` · R `contexte.test.ts` · R `worker/index.ts` · R `worker/index.test.ts` · R `worker/frontiere.test.ts` |

Signatures figées par L1 :
```ts
// blocage.ts
export interface ConstatDeBlocage { readonly rang: number; readonly etape: PlanAction }
export function etapeBloqueeAuPas(
  personnage: Personnage, entree: EtatPnj | undefined, tour: number,
): ConstatDeBlocage | undefined
// front === : tour - origine === etape.duree
// Ne lit ni declencheur_*, ni si_bloque, ni action.
```

L2 consomme `etapeBloqueeAuPas` + `personnagesPresents`. Par PNJ perceptible : si `depuis === tour` → action (it2), sinon constat → `si_bloque`. Le « sinon » est structurel.
