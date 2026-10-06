# Narratif & IA — tour 1 — moteur-horloge it3

**RISQUE** : Sélène au pas 40, échéance tombée au pas 4. Si « bloqué » est un ÉTAT (`>=`), le narrateur rejoue `si_bloque` à chaque pas et le journal accumule 36 lignes identiques. Le plan it2 l'avait écrit (l. 37 : « bloqué est un événement unique »). Le cadrage it3 a perdu cette phrase.

**OBJECTIONS** :
1. Le cadrage formule le blocage comme un état. Il faut l'événement `tour − origine === plan_actions[k].duree`. Atteint une seule fois car chaque pas ≥ 1 passe par exactement un tick (KR-295).
2. La règle « `etape_plan` absent ⇒ jamais en échéance » rend inatteignables les deux seuls `si_bloque` du dossier de référence. Sélène et Corvin sont à l'étape 0, n'avancent jamais → pas de `depuis`. L'objectif ne peut pas être démontré. J2 renvoyait ce point à it3.

**PROPOSITIONS** :
- P1. Prédicat pur `echeanceACePas`, seul lecteur de `duree`, appelé par le tick (journal) et par R3. Garde grep.
- P2. `etape_plan` absent ⇒ origine 0 (`creerSession`, `session.ts:598`). Dérivé, pas inventé : le tick n'écrit jamais le rang 0. `{rang ≥ 1}` sans `depuis` reste hors échéance. J2 réécrite avant le code.
- P3. `si_bloque` dans PENDANT CE TEMPS, sans nouvel en-tête. Avec `DUREE_MIN = 1`, avancer et arriver à échéance au même pas s'excluent → une ligne par PNJ au plus.
- P4. Budget : pire cas = max(action, si_bloque) par PNJ. M ≈ 2371 > 2333, donc 7000 → 8000, worker 87 040 → ~90 112. À re-mesurer.

**VERDICT** : recevable sous réserve de O1 + P1. Veto si l'injection reste un état ou si la formule vit à deux endroits.

## ANNEXE : contrat IA de `si_bloque`

Rôle R3 `narrateur` seul. Aucune nouvelle sortie de modèle.

Sélection dans PENDANT CE TEMPS, par personnage perceptible, dans l'ordre :
1. Avancé à ce pas (`depuis === tour`) → ligne `action` (it2). Stop.
2. Échéance à ce pas (`echeanceACePas`) → `textesRediges(plan_actions[k], CHEMIN_SI_BLOQUE, PREFIXE_ETAPE)`. Silence si absent/vide/marqueur.
3. Sinon → rien.

Contenu de la ligne : `replier(si_bloque)` de l'étape courante `k`. Ni rang, depuis, duree, nom, identifiant, ancre, amorce, ni mot « bloqué ».

Seconde dérogation : `CHEMIN_SI_BLOQUE` constante propre, garde dédiée. La dérogation personnage de R3 passe d'un chemin à une liste fermée de deux.

Textes à réécrire dans le même lot : `narrateur.ts:96`, `contexte/horloge.ts:41`, `destinations.ts:217-223`.

Mémoire : rien de nouveau retenu. Pas de drapeau « raconté » (KR-013).
