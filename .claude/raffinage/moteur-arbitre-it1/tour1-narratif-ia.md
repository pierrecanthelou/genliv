# Raffinage `moteur-arbitre` it1 — Tour 1 — Narratif & IA

**RISQUE** — Aucune IA n'entre dans cette itération. Pourtant `CibleNarrateur.session` transporte désormais `heros` jusqu'aux assembleurs R1 et R3, et rien ne prouve qu'ils l'ignorent. Le défaut le plus probable est ailleurs : `rollCreationPool(rng = Math.random)` (`charCreation.ts:18`). Si on oublie de passer le flux keyé, le code compile quand même et passe tout test de bornes.

**OBJECTION**
1. `alea(...): number` (brain_contract) ne peut alimenter aucun consommateur. `rollCreationPool` tire 17 fois et `resolveChallenge` N fois, tous deux via `() => number`. L'appelant devrait donc incrémenter `indice` lui-même. La relance chevaucherait alors le pool 0, à moins que l'appelant sache qu'un pool coûte 17 tirages (Déméter).
2. A4 placée hors de `TRANSITIONS.aller` : la console et la saisie libre divergent, et le rejeu (KR-248) ne la reproduit pas. A4 en `DeltaId` : `LECTURE_DES_EFFETS` (Record total) obligerait le narrateur à lire le +5 PE. De plus, `deltas.ts:30-33` écarte nommément `modifier_pe`.
3. L'audience est gardée côté données (`lignesIa` exact), pas côté code.

**PROPOSITION**
- `fluxAlea(graine, domaine: 'heros', indice): () => number`, avec une union de domaines fermée. Trois tests : même clé → même suite ; l'ordre d'appel entre clés ne change rien (ce test tue le compteur global) ; `0 ≤ x < 1` (à 1, `randInt` rend max+1).
- `EcranCreationHeros` : `spyOn(Math,'random')` à 0 appel, du montage à la validation.
- `contexte.test.ts` : les textes de R1 et R3 sont identiques avec et sans `heros`. Un mutant qui injecte `heros.name` doit rougir.
- A4 vit dans `TRANSITIONS.aller`, seulement si `cible !== depuis`, sans delta ni entrée de journal.
- Toutes les lignes `heros.*` sont `moteur`. Les caracs s'écrivent `` `heros.caracs.${Characteristic}` ``. La docstring de `heros.name` donne le motif et la condition de réouverture.

**VERDICT** — recevable sous réserve (objections 1 et 2 réglées au lot `contrat`).

---

## ANNEXE (hors quota) — aucun contrat de sortie IA en it1, voici à la place le contrat des portes

**A. Ce que chaque rôle de jeu lit de la session (vérifié dans le code)**
- `assemblerInterprete` (`copilote/contexte/interprete.ts:91-152`) lit `monde.lieu_courant` (via `destinationsPossibles`), `attente` et la saisie. Il ne lit pas `heros`.
- `assemblerNarrateur` (`narrateur.ts:452-576`) lit `monde.lieu_courant`, `monde.objets_possedes`, `journal[].{tour,origine,recit,deltas}`, `horloge.tour` et `memoire`. Il ne lit pas `heros`.
- `CopiloteService` n'envoie que `contexte.texte` (`CopiloteService.ts:696`, `:773`). Aucun objet de session ne part sur le réseau.
- La session n'est pas synchronisée (`MagasinDeSession`, `session.ts:325-350`). `heros.name` ne part donc pas non plus au KV.
- **Conclusion : aucune porte n'est ouverte aujourd'hui.** La proposition 3 transforme cette lecture du code en fait testé.

**B. Contrat d'aléa**
- Signature : `fluxAlea(graine: number, domaine: DomaineAlea, indice: number): () => number`, avec `type DomaineAlea = 'heros'`. `'jet'` entre en it2 avec son consommateur (KR-249).
- Le flux est séquentiel À L'INTÉRIEUR d'une clé (une fonction pure y consomme un nombre fixe de tirages), jamais d'une clé à l'autre. C'est la seule lecture compatible avec la décision actée « keyé, jamais séquentiel ».
- Usage en it1 :
  - premier tirage : `rollCreationPool(fluxAlea(g,'heros',0))` ;
  - relance : indice `1` ;
  - aucun indice 2 n'est atteignable (B2).
- Le pool se dérive de (graine, indice). Il n'est jamais stocké en session (KR-013).
- **Ce que cet aléa NE garantit PAS en it1 (vérifié)** : `EcranPartie.tsx:110` tire une graine neuve à chaque montage, et il n'y a pas de reprise. Recharger la page contourne donc B2. Le plan ne doit pas affirmer que l'aléa keyé protège la relance : il la protégera quand la reprise relira `graine_alea`.

**C. Lignes d'audience à poser au lot `contrat`**
Fichiers : `sessionDestinations.ts`, `__fixtures__/session-saturee.ts`, `sessionCouverture.test.ts`.
- `heros: 'moteur'` pour la racine, exigée par la compilation. Elle devient la sixième dispense déclarée (racine porteuse).
- `heros.name`, les 8 `heros.caracs.${Characteristic}`, `heros.pv`, `heros.pe`, `heros.xp` : toutes `moteur`. Le template literal rend les caracs exhaustives par compilation, sans normalisation `<id>` côté test.
- La fixture saturée doit instancier `heros`, sinon ces lignes sont mortes dès leur écriture. Le compte des racines passe de 9 à 10 (`sessionCouverture.test.ts:123`).
- `lignesIa` (`:236-258`) reste **inchangé en valeur**. C'est lui qui rougit, par son nom, si une ligne `heros.*` bascule.
- Docstring de `heros.name` : « Saisie libre du joueur. Le narrateur vouvoie et n'en a pas besoin. Réouverture seulement avec une borne en caractères, une normalisation (précédent `attente.saisie`) et `lignesIa` amendé en valeur — jamais par défaut. »

**D. Test d'invariance**
- On assemble le narrateur deux fois : `assemblerNarrateur(d,{session:S,saisie})` et `assemblerNarrateur(d,{session:{...S,heros:H},saisie})`. Les deux `texte` doivent être identiques. Même test pour R1.
- `H.name` vaut `'SENTINELLE-HEROS'` et les caracs ne sont pas les valeurs par défaut.
- Ce test est plus fort qu'une simple recherche de sentinelle : il voit aussi les chiffres.
- Avant de le signer, il faut écrire le mutant (ajouter `session.heros?.name` à `CE PAS`) et constater qu'il rougit.
- Expiration nommée : en it2, R3 dépendra de l'issue d'un jet, donc indirectement des caracs. L'invariance devra alors être restreinte aux pas sans jet, en commentaire et jamais en silence (KR-195/196).

**E. A4**
- Emplacement : `TRANSITIONS.aller` (`commandes.ts:213`), après les refus.
- Calcul : `pe = min(pe+5, EN)`, seulement si `heros` est présent et que `lieuCible.id !== depuis`.
- Sa docstring « CE QU'IL ÉCRIT, ET RIEN D'AUTRE » (`:207-211`) doit être corrigée.
- Ni `DeltaId`, ni pastille, ni ligne de journal. Le `CE PAS` du narrateur continue d'afficher `aucun changement`, ce qui reste vrai pour la fiction.
- Scénarios séparateurs obligatoires :
  - `pe = peMax−6` sépare +5, le plafond et le no-op ;
  - `pe = peMax−2` sépare le plafond d'un +5 non plafonné.
- **Signal PM/QA, pas un veto** : en it1, rien ne consomme de PE. La jauge est toujours pleine, donc A4 est **invisible dans l'interface**. Seul le test unitaire la voit.

**F.** `FICHIERS_EXCLUS_PLAY_MODE` (`moteurSansIA.test.ts:107`) garde une seule entrée (`useTourDeJeu.ts`). `BandeauHeros` et `EcranCreationHeros` sont balayés sans exception.

**G. Signal au tech-lead (KR-013/249, pas un veto)**
- `peMax` est littéralement une copie de `caracs.EN` (`charCreation.ts:74`, `heroGen.ts:8`, B4).
- Si `pvMax`/`peMax` sont stockés, `heros.caracs` n'a **aucun lecteur** en it1 : le bandeau affiche nom/PV/PE/XP. Les dériver donne au contraire aux caracs leur premier lecteur (KR-249).
- `mcBonus` est écrit à 0 et personne ne le lit.

## Décisions prises en autonomie faute de spécification
- Type de retour d'`alea` → `() => number`, un flux par clé → avec `number`, l'appelant fait lui-même l'arithmétique d'indices et la relance chevauche le pool 0.
- Registre des domaines → union fermée, `'heros'` seul → en `string`, une faute de frappe (`'héros'`) crée un second flux en silence ; poser `'jet'` dès it1 violerait KR-249.
- Condition d'A4 → `cible !== depuis` (« changer d'écran/zone », `REGLES-DU-JEU.md:43`), et non « lieu jamais visité » comme le suggère le « nouveau lieu » du critère → l'inverse code une autre règle que la source de vérité (KR-130).
- Trace d'A4 → ni delta ni journal → un delta impose au narrateur une lecture (Record total), et la mécanique finit racontée.
- Création du héros au journal → aucune entrée (ce n'est pas un pas, § J1) → sinon le nom entre dans `journal[].texte`, dont l'audience `moteur` repose sur « pas un caractère que le joueur a tapé » (`sessionDestinations.ts:183-186`).
- Forme de la garde côté code → égalité des contextes avec et sans héros → une sentinelle seule ne détecte pas les chiffres.

## Fichiers relus
- src/brain/dossier/session.ts
- src/brain/dossier/sessionDestinations.ts
- src/brain/dossier/sessionCouverture.test.ts
- src/brain/dossier/commandes.ts
- src/brain/dossier/deltas.ts
- src/brain/copilote/contexte/narrateur.ts
- src/brain/copilote/contexte/interprete.ts
- src/brain/CopiloteService.ts
- src/brain/challenge.ts
- src/player/types.ts
- src/player/engine/heroGen.ts
- src/player/engine/charCreation.ts
- src/features/play-mode/components/EcranPartie.tsx
- src/features/play-mode/tests/moteurSansIA.test.ts
- src/features/moteur-arbitre/specification.json
- .claude/raffinage/moteur-arbitre-cadrage/tour2-narratif-ia.md
- docs/REGLES-DU-JEU.md
- docs/REGLES-PLAY.md
- code-knowledge.json
