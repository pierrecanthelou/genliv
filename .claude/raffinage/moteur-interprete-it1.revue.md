# Revue — `moteur-interprete` · itération 1

Plan : `.claude/raffinage/moteur-interprete-it1.plan.md` (validé 2026-09-25).
Exécution : essaim séquentiel, 2 lots (`interprete-contrat` puis `interprete-feature`), aucun worktree.

## En une ligne

L'auteur peut désormais taper une action libre dans l'aperçu du jeu ; le moteur la traduit en déplacement reconnu (même entonnoir que la console), demande une précision sur une cible ambiguë, ou répond poliment qu'il ne sait pas encore le faire — sans jamais générer de prose (R3 arrive en it2).

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Déplacement reconnu → même entonnoir que la console | **VÉRIFIÉ** | `interprete.test.ts` : session produite par `apresInterpretation` `toEqual` celle d'un appel direct à `executerCommande` |
| 2 | Ambiguïté (≥2 lieux) sans attente → clarification posée | **VÉRIFIÉ** | `interprete.test.ts` : `attente` posée, `avis:{type:'clarification', question}` |
| 3 | Hors `COMMANDES` / court-circuit → `non_reconnu` | **VÉRIFIÉ** | `interprete.test.ts` + `PlayerInputBar.test.tsx` : `gestes_possibles` dérivés de la table de l'appel, jamais du registre complet |
| 4 | Anti-boucle KR-264 (attente pendante ou illisible après rejeu) | **VÉRIFIÉ** | `interprete.test.ts` : attente déjà posée + nouvelle réponse → `{type:'reformuler'}`, attente retirée |
| 5 | Rejeu-un-coup puis dégradation | **VÉRIFIÉ** | `CopiloteService.test.ts` : fautif→valide = 2 `fetch` ; deux fautifs = `illisible` |
| 6 | Verrou de tour KR-265 | **VÉRIFIÉ** | `useTourDeJeu.test.ts` : deux appels consécutifs sans attendre le premier → `demanderMock` appelé une seule fois ; garde vérifiée avant tout `await` |
| 7 | `moteurSansIA.test.ts` réécrit, exclusion nommée | **VÉRIFIÉ** | Exclusion `[useTourDeJeu.ts]`, mutant vérifié à la main (fichier temporaire créé, test constaté rouge, fichier retiré) |
| 8 | Journal ne stocke jamais la saisie brute | **VÉRIFIÉ** (niveau unitaire, Lot 1) | `interprete.test.ts` : saisie caractéristique injectée, absente du `JSON.stringify(journal)` — voir remarque sur le niveau de test |

## Diff par lot

**Lot 1 `interprete-contrat`** (15 fichiers du plan + 3 extensions de blocage) :
`session.ts`, `sessionDestinations.ts`, `interprete.ts`(N), `interprete.test.ts`(N), `copilote/types.ts`, `copilote/schemaSortie.ts`(+test), `copilote/contexte/interprete.ts`(N)(+index+test), `CopiloteService.ts`(+test), `worker/index.ts`(+test), `brain/index.ts`.
Extensions actées en cours d'essaim (blocages résolus au niveau du plan, pas au comité) : `__fixtures__/session-saturee.ts`, `sessionCouverture.test.ts` (fixture instancie `attente`, assertion « zéro ligne ia » remplacée par l'ensemble exact), `worker/frontiere.test.ts` (exemption de `interprete` de la parité `RoleCopilote`, deux familles de rôles documentées).

**Lot 2 `interprete-feature`** (8 fichiers du plan + 1 extension) :
`brain/components/Field.tsx`(+test) — extension `disabled`/`maxLength`, `PlayerInputBar.tsx`(N)(+test), `useTourDeJeu.ts`(N)(+test), `EcranPartie.tsx`, `moteurSansIA.test.ts`.
Extension : `commandes.test.ts` (exclusion nommée pour l'import de `COMMANDES` par `useTourDeJeu.ts`, exclusion des fichiers `.test.ts` du balayage — un test légitime qui compare à `COMMANDES` n'est plus confondu avec une violation d'isolation).

**Hors code** : `docs/IA-SETUP.md` (runbook, tâche séparée demandée par l'utilisateur en parallèle, sans rapport avec le plan — doc pure, review à part).

## Ce qui a été refusé (REJETÉ)

- QA proposait de scinder `moteurSansIA.test.ts` en 2 phases pour éviter une fenêtre d'observabilité aveugle sur la liste d'exclusion — REJETÉ (tech-lead, tour 2) : les deux fichiers concernés vivent dans le même lot, livrés en un seul geste atomique, la fenêtre que QA redoutait n'existe pas dans ce découpage.
- La forme de sortie IA proposée par tech-lead au tour 1 (`{commande:Commande}|{precision}|{hors_commandes:true}`) — REJETÉ, tech-lead lui-même la retire au tour 2 : elle violait KR-231 (collision de clé avec le domaine).
- Le mot d'entête `SANS EFFET` (UX, tour 1) — REJETÉ, remplacé par `NON RECONNU` : collisionnait avec le vocabulaire « effet » déjà réservé par `docs/REGLES-PLAY.md` § J1.

## Ce qui a été reporté

- **KR-267** (nouveau) — un lieu accessible sans `description` (absente ou marquée) ne reçoit aucun rang côté interprète IA, reste atteignable en console mais devient inatteignable en saisie libre. Reporté en `open_questions` de `specification.json`, propriétaire `dossier-controles` — ouvrir un panneau d'auteur dans cette itération aurait rompu la tranche verticale unique. Un test de caractérisation existe (`interprete.test.ts`/`contexte.test.ts`) pour garder le comportement actuel observable, pas pour le corriger.
- La portée complète de KR-262 (R3 nommant PNJ/lieux, 8 collections) — reste ouverte, propriétaire n°12.
- Le rejeu déterministe réel (KR-242) — cette itération prépare le terrain (journal ne stocke que des `Commande`), premier consommateur réel reste n°11.

## Écarts assumés

- Signature réelle de `apresInterpretation` : 3ᵉ paramètre `proposition: SortieInterprete` (pas `reponse: ReponseInterprete` comme esquissé au plan) + 4ᵉ paramètre `saisie: string` — forcé par KR-260 (un `import type` de `ReponseInterprete`/`EchecCopilote` depuis `interprete.ts` fait rougir le garde par mot-clé de `moteurSansIA.test.ts`, vérifié en conditions réelles). Le hook (`useTourDeJeu.ts`) inspecte `reponse.statut` lui-même avant d'appeler `apresInterpretation`.
- `RoleCopilote` n'est PAS étendu à `'interprete'` — décision tech-lead confirmée : deux familles de rôles derrière `POST /ia/:role` (mode auteur générique vs mode jeu bespoke), documentée dans `worker/frontiere.test.ts`.
- Les deux canaux de saisie (console + champ libre) sont affichés côte à côte en it1 ; la démotion visuelle de `ConsoleCommandes` mentionnée au cadrage de feature n'est couverte par aucun critère de cette itération, donc non faite.

**Blocage non résolu** : aucun.

## Écart de couverture noté par la QA (mineur, non bloquant)

Le test nommé au plan § 7 (`useTourDeJeu.test.ts → journal stocke une Commande, jamais la saisie`) n'existe qu'au niveau unitaire (`interprete.test.ts`), pas au niveau du hook/composant. La garantie est réelle (le hook ne fait que relayer ce qu'`apresInterpretation` produit, jamais un écrit parallèle au journal), mais le niveau de test spécifié par le plan pour ce critère n'est pas exactement celui livré. Noté pour la revue suivante — pas un défaut de comportement.

## Porte qualité

- Prettier : conforme, aucun fichier reformaté.
- `tsc --noEmit` : propre.
- ESLint : 0 erreur (1 warning préexistant hors périmètre, `CharacterCreationScreen.tsx`).
- `jest` : **121 suites, 1907 tests, tous verts** (1885 avant l'itération + 22 nouveaux nets).
- Score de mutation `brain/` : **non applicable** — aucun des 4 fichiers de règles de jeu (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché.

## Revue tech-lead (Build Steps étape 6)

Un finding CRITIQUE a été trouvé et corrigé avant que l'utilisateur ne voie ce diff (BUG-131) : `useTourDeJeu.ts` prenait `useState(sessionInitiale)`, une copie privée de la session jamais resynchronisée avec le parent. Le canal console (`ConsoleCommandes`) écrit directement la session du parent — une commande console acceptée entre deux soumissions du champ libre était donc silencieusement écrasée au prochain `executeAction`, qui travaillait encore sur la copie figée au premier rendu. Corrigé : `session` est maintenant un paramètre lu à chaque rendu, jamais copié (KR-013). Test de régression ajouté (`rerender` avec une session avancée, vérifie que l'appel copilote suivant utilise la session fraîche).

Deux findings supplémentaires, mineurs : la garde d'isolation `PlayerInputBar`/`ConsoleCommandes` annoncée comme « testée » (§ 7 du plan) n'existait qu'en commentaire — garde mécanisée ajoutée (même patron que `moteurSansIA.test.ts`) ; `specification.json` pas remis à jour (`status`/`plan.iterations[0].status`) — corrigé.

Verdict final tech-lead : **APPROVE**. Porte qualité après correctifs : 121 suites / 1909 tests, tsc/lint propres.

## RETOUR-COMITÉ

- Le découpage en 2 lots (contrat puis feature, séquentiel, sans worktree) a bien fonctionné pour une itération de cette taille — aucun blocage de fusion, les deux vrais blocages rencontrés (fixture de session, parité `RoleCopilote`) étaient des conséquences mécaniques et prévisibles de l'ajout d'un 7ᵉ rôle, pas des désaccords d'architecture : à anticiper explicitement au § 5 du plan pour la prochaine itération qui ajoute un rôle IA (`'narrateur'`, it2) — lister d'emblée `worker/frontiere.test.ts` et les fixtures de session parmi les fichiers probables du lot contrat.
- Le premier jet du lot 2 a livré des tests de hook à corps vide (commentaires « reporté », `jest.mock` appelé à l'intérieur d'un `it()` au lieu du niveau module) pour le critère le plus critique de l'itération (KR-265). Le précédent exact existait déjà dans le dépôt (`useDemandeCopilote.test.tsx`, `renderHook` sans `BrainProvider`) mais n'a pas été trouvé sans qu'on le pointe explicitement. À inclure la prochaine fois : quand un lot doit tester un hook qui consomme `useBrain()`, citer ce précédent dans le plan lui-même plutôt que de compter sur l'agent pour le retrouver.
- Un « test de mutant obligatoire » écrit comme une simple redite du test principal (même filtre, même regex, zéro pouvoir séparateur) a failli passer inaperçu à la première lecture du compte rendu — seule la lecture directe du fichier l'a révélé. Le compte rendu d'un agent qui affirme avoir vérifié un mutant doit systématiquement être contre-lu sur le fichier réel, jamais accepté sur la seule foi du résumé.
