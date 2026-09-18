# Tour 1 — `qa` · `dossier-copilote` it3b (mode A)

**Fichiers lus** : le cadrage, `src/brain/copilote/schemaSortie.ts`, `src/brain/copilote/contexte.ts`, `worker/frontiere.test.ts`, `.claude/raffinage/dossier-copilote-it3a.revue.md`, `src/brain/dossier/types.ts` (`PlanAction`, ~l. 359-390), `src/brain/dossier/destinations.ts` (~l. 201-224).

**Sonde EXÉCUTÉE** : script Node éphémère recalculant `paires(ROLES)` pour n=3 et n=4 (fonction copiée telle quelle de `frontiere.test.ts`) → **confirmé 3 → 6**.

**NON VÉRIFIÉ, et je le signale** : pas de `jest` lancé — le 4ᵉ rôle n'existe pas encore dans le code, il n'y a rien à exécuter côté suite réelle. Toute affirmation sur la généricité des autres instruments (balayage exhaustif, précondition sous-chaîne, `rolesAuMaximum`) vient de **lecture de code, pas d'exécution**.

---

**RISQUE** — Le `goal` (« plusieurs champs ») **surdimensionne le contrat** : seule `action` est `'ia'` à la création. `etape` est moteur, jamais rendu par le modèle (doctrine it2) ; `declencheur_texte` est auteur ; `declencheur_expr`/`duree` moteur ; `si_bloque`, bien que `'ia'`, n'est injectable que sous **un fait de session inexistant avant la n° 10**. L'exposer ici rejoue l'**asymétrie du regret** vétoée en 3a.

**OBJECTION** — DÉSIGNATION/RÉDACTION n'est pas tranchée par écrit. Ce rôle rend une **LISTE** (forme détenteurs) mais de **RÉDACTION** (esprit répliques) : liste vide = **refus `'vide'`**, pas succès — sinon un ouvrier calque le mauvais précédent **par analogie de forme**. Aucun critère ne fixe le gabarit JSON ni l'ordre des prédicats ; « sous-entité vide ou dégénérée » reste indéfini.

**PROPOSITION** — Fixer le gabarit **AVANT** le code : `{"etapes": ["…"]}` (**chaînes nues**, comme répliques), **pas d'objets imbriqués** — réutilise les 10 prédicats de `validerRepliques`, zéro machine neuve ; `etape` assignée par le code (`max+1`), testée nommément (« étape strictement croissante, jamais fournie par le modèle »). Si des objets sont requis, **numéroter les prédicats en docstring avant le code**, comme `schemaSortie.ts`. **MESURÉ (node, exécuté)** : `paires(ROLES)` passe de **3 à 6** au 4ᵉ rôle — `frontiere.test.ts` (« trois transpositions », `toHaveLength(3)`) doit devenir **6**, sinon rougit **pour la mauvaise raison**. Balayage exhaustif et précondition sous-chaîne restent génériques à N (**lecture, non exécutés** faute du 4ᵉ rôle) ; la rotation reste, depuis 3a, canari de dérangement total.

**VERDICT** — **recevable sous réserve** — DÉSIGNATION/RÉDACTION et gabarit écrits avant code.
