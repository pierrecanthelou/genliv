# Revue de clôture — `moteur-interprete` · itération 3

> Plan : `.claude/raffinage/moteur-interprete-it3.plan.md` (validé 2026-09-30)
> Exécution : séquentielle, 1 lot unique (`dev-contrat`), aucun worktree, aucun lot feature
> Vérification : relecture indépendante de l'orchestrateur (lecture du code + porte qualité rejouée)
> Porte qualité finale : `npx tsc --noEmit` vert · `npm run lint` vert (1 avertissement préexistant sans lien) · `npx jest --maxWorkers=2` 124 suites / 2078 tests, tous verts

## En une ligne

Le joueur retrouve, plusieurs tours plus tard, un fait que le monde avait établi — sans contradiction, et sans jamais perdre le récit qu'il est en train de lire à cause d'un défaut de mémoire invisible.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Fait/identifiant invalide ⇒ lot refusé (KR-230) | **VÉRIFIÉ** | `schemaSortie.test.ts` prédicats 19/20/23, mutants M1-M3 |
| 2 | Fenêtre dérivée de l'horloge, table 4/14/15/24/25, sans trou | **VÉRIFIÉ** | `memoire.test.ts`, `contexte.test.ts` (pas joué en console inclus) |
| 3 | Condensé décorrélé du refus de récit **quand il est dû** ; présent alors que non dû ⇒ refus du lot entier (KR-236) | **VÉRIFIÉ** | `schemaSortie.ts` prédicat (24) hors bloc atomique quand dû, prédicat d'enveloppe (mutant M7) sinon ; mutants M4-M9, `recit.test.ts` (garde d'écriture sur `jusqu_au_pas`) |
| 4 | Faits en ajout seul, 8 au plus injectés par pertinence | **VÉRIFIÉ** | `memoire.test.ts` (`faitsPertinents`), `recit.test.ts` (dédoublonnage) |
| 5 | Même 8ᵉ branche, pas de 9ᵉ rôle | **VÉRIFIÉ** | lecture directe : 8 `case` dans `CopiloteService.ts`, aucun rôle `chroniqueur` créé |
| 6 | Pas sorti de fenêtre : absent de `RECEMMENT`, visible dans `À CONDENSER` jusqu'à absorption, budget couvre le pire cas (23 récits) | **VÉRIFIÉ** — *texte corrigé après livraison, voir § Écarts* | `contexte.test.ts` (tests dédiés pas 15/16, budget au pire cas) |
| 7 | `moteurSansIA` inchangé, `useTourDeJeu.ts` seul exclu | **VÉRIFIÉ** | `moteurSansIA.test.ts` rejoué sans modification, vert |
| 8 | Ancres limitées lieu/objets, jamais indices/jalons | **VÉRIFIÉ** | `contexte.test.ts`, mutants « indice/jalon ancrable » |

**8/8 critères vérifiés — un texte corrigé après coup (voir ci-dessous), aucun code changé pour cette correction.**

## Diff (lot unique, conforme au § 5 du plan)

24 fichiers exactement : 22 modifiés + 2 créés (`src/brain/dossier/memoire.ts`, `memoire.test.ts`). Aucun fichier hors de cette liste — **aucun fichier de `src/features/play-mode/components/` touché**, `UseTourDeJeuResult` inchangé, confirmé par lecture directe. Artefacts légitimes hors lot : `specification.json`, `code-knowledge.json`, `bug_history.json`, `bug_history.moteur-interprete.json` (nouveau, scission), `docs/ROADMAP-BASCULE-IA.md`, `docs/WORKFLOW.md`, `CHANGELOG.md`, `package.json`, le plan et ses 10 notes de tour.

## Ce qui a été refusé (REJETÉ du registre)

- **Un 9ᵉ rôle IA `chroniqueur`** (résumé dans un appel séparé) — proposé par narratif-ia (tour 1), adopté par PM et tech-lead (tour 2), puis **retiré par son propre auteur** dans sa note de tour 2 (les tours étant parallèles, PM/tech-lead ne l'ont vu qu'après coup). Arbitré par l'orchestrateur en faveur de l'appel unique : la démonstration de narratif-ia (matrice d'échec complète, § 4 bis du plan) satisfait exactement la condition posée par le PM, sans le coût d'un rôle IA complet.
- **Chip cliquable et refus-console réintégrés en it3** — motif « it3 rouvre ces fichiers de toute façon » réfuté EN FAIT par le tech-lead (`memoire` ne touche ni `PlayerInputBar.tsx` ni `EcranPartie.tsx`).
- **Ancres sur indices/jalons** — rejeté par son propre auteur (narratif-ia, tour 2) : ces ensembles ne font que croître ou meurent après un seul pas, le filtre de pertinence dégénérerait.
- **Marge ×3 sur `BORNE_MEMOIRE`** — rejetée par son propre auteur (tech-lead, tour 2) : chaque terme est déjà borné par un validateur, la marge était inventée.
- **`condense` validé à part et récit refusé s'il échoue** (proposition initiale tech-lead tour 1) — rejeté par narratif-ia (tour 2, KR-271) puis par le tech-lead lui-même : un artefact que le joueur ne lit jamais ne doit jamais faire perdre ce qu'il lit **quand il était dû**. Deux exceptions nommées, pas des contre-exemples au principe : (a) un `condense` présent alors que rien n'était dû refuse quand même le lot entier (KR-236, mutant M7) — ce n'est pas le récit qui coûte le résumé, c'est une enveloppe non respectée ; (b) un `condense` qui dépasse `max_tokens` casse le JSON entier et perd toute la réponse (`worker/index.ts`), hors de portée d'une garde côté validateur.

## Ce qui a été reporté

- **Chip cliquable, refus-console qui réapparaît** → `open_questions`, sans échéance (it4 ou dette à déclencheur nommée quand un lot rouvre réellement ces fichiers).
- **Mémoire pour R1** (l'interprète) → dette nommée, aucun lecteur aujourd'hui.
- **Scission de `bug_history.json`** — faite DANS ce lot, pas différée : `BUG-130` → `bug_history.moteur-interprete.json` (voir § Budget de contexte ci-dessous pour le motif).

## Écarts assumés et corrections faites en cours d'itération

1. **Critère d'acceptation #6 corrigé après livraison.** Sa formulation au plan (« au pas 15, le récit du pas 1 est absent du contexte ») était un reste du témoin T5 conçu pour l'architecture `chroniqueur` rejetée — avec l'appel unique retenu, le pas qui sort de la fenêtre glissante reste visible dans le bloc `À CONDENSER` jusqu'à son absorption complète : il n'est absent QUE du bloc `RECEMMENT`, pas du contexte entier. Trouvé par `dev-contrat` en écrivant le témoin réel (`contexte.test.ts` : « au pas 15 la fenêtre vaut 11-15... et n'entre que dans la tranche à condenser »), corrigé dans le plan par l'orchestrateur. **Aucun code n'était fautif** — seule la description du critère l'était.
2. **BUG-134 (mineur)** — un test d'it2 (`useTourDeJeu.test.ts`) renvoyait la même réponse mockée aux deux appels d'un pas (R1 puis R3), masquant un `recit: undefined` sur la session sans qu'aucune assertion ne le signale. Ce qui a fait apparaître le défaut est une `TypeError` à l'exécution (`apport.faits_etablis.reduce` sur `undefined`), pas `tsc` — un mock `jest.fn()` non typé reste invisible au compilateur. Corrigé en typant `consignerNarration.apport.recit` strictement en `string` (jamais optionnel) ; ce qui protège désormais est le littéral de réponse R3 du test, annoté `satisfies SortieNarrateur`. Vérifié : ce n'était pas un chemin de production atteignable, seulement un double de test mal formé.
3. **Critère d'acceptation #3 corrigé après livraison (même classe que #6).** Sa formulation regroupait « `condense` absent, invalide, ou non demandé mais présent » sous « le récit est TOUJOURS accepté ». Faux pour la troisième branche : un `condense` présent alors que rien n'était dû refuse le LOT ENTIER (KR-236, enveloppe stricte, mutant M7), suivi d'un rejeu puis d'une bannière en cas de nouvel échec — le code et le § 4 bis du plan (ligne 60) le disaient déjà correctement, seul le critère #3 mélangeait les deux cas. Corrigé dans le plan par l'orchestrateur, après revue tech-lead de la PR. **Aucun code changé.**
4. **`BUDGET_CARACTERES_NARRATEUR` et `TAILLE_MAX_CORPS_IA` remesurés, pas recopiés des estimations du comité** — 26 956 o (comité : ≈27-28k) et 83 968 o / 82 Kio (comité : ≈84 Kio), contre 53 248 o avant cette itération. Le plafond HTTP du worker est désormais porté par le rôle `narrateur`.

## Budget de contexte

- **`code-knowledge.json`** : 71 550 o (sous son plafond 70 kio/71 680 o, marge ~130 o) après ajout de KR-271/272/273 ET compaction de KR-197 (`dossier-canon`, feature terminée, réduit à son invariant + renvoi `Corps : spec dossier-canon`).
- **`bug_history.json`** : franchissait son plafond à 16 032 o (15 kio/15 360 o, +672 o) avant correction de cette revue. **Le précédent que j'avais cité pour refuser toute scission était faux** : `bug_history.moteur-dossier.json` est né le 2026-09-24 **pendant** `moteur-dossier` it3 (feature alors EN COURS, TERMINÉE seulement le lendemain), sur l'axe de la REDONDANCE écrit dans son propre `_about` — « ne le 2026-09-24 (moteur-dossier it3...) », jamais sur l'âge de la feature. L'axe correct est donc : la leçon de l'entrée est-elle DÉJÀ PROMUE dans un instrument en lecture obligatoire ? Celle de **BUG-130** (« le compte rendu d'un agent ne se croit jamais sur le seul résumé — relire le fichier de test avant d'accepter un lot ») l'est : la skill `raffinage-iteration` la porte déjà dans sa doctrine de vérification. **BUG-130 est donc scindé maintenant** vers `bug_history.moteur-interprete.json` (nouveau fichier, né en cours de feature comme son précédent), qui n'attend pas la terminaison de `moteur-interprete`. Fichier ramené à 15 299 o (mesure finale, `git show :bug_history.json | wc -c`), marge 61 o sous le plafond. `_about` de `bug_history.json` et `docs/WORKFLOW.md` mis à jour : DIX fichiers, plus NEUF. Seul BUG-074 est explicitement épinglé par son propre `_about` (BUG-128 n'a pas cette épingle, il reste par défaut : sa leçon n'est promue nulle part).
- `src/features/moteur-interprete/specification.json` : 49 575 o — sous son plafond (65 kio).
- `docs/ROADMAP-BASCULE-IA.md` : 30 134 o — sous son plafond (30 kio), marge 586 o.
- Couple `CLAUDE.md` + `docs/WORKFLOW.md` : 46 077 o (mesure finale) — sous son plafond (45 kio/46 080 o), marge de **3 o seulement**. Chaque phrase ajoutée ou corrigée cette itération a dû être retrimée plusieurs fois pour tenir ; ce couple n'a plus de marge réelle pour absorber une future note, même d'une ligne — la prochaine écriture devra RETIRER une phrase avant d'en ajouter une.

## Porte qualité

- `npm run format` / `npx tsc --noEmit` / `npm run lint` : verts
- `npx jest` (suite complète) : **124 suites / 2078 tests, tous verts** — `panneauPersonnages.test.tsx` (dossier-fiches, BUG-128, connu, non corrigé, hors périmètre) dépasse son délai sous forte parallélisation ; confirmé par `dev-contrat` ET par l'orchestrateur qu'il échoue de façon identique sur `main`, indépendamment de cette itération. Suite complète vérifiée stable avec `--maxWorkers=2`.
- `npm run test:mutation` : **non déclenché** — aucun des 4 fichiers de règles de jeu n'est touché. 24 mutants du lot vérifiés à la main (rouge puis restauration), voir § 7 du plan.

## RETOUR-COMITÉ

- **Un désaccord structurant peut se retourner DANS le même tour, côté parallèle, sans que les autres rôles le voient.** Narratif-ia a proposé le `chroniqueur` au tour 1, PM et tech-lead ont convergé dessus au tour 2 — pendant que narratif-ia, dans sa propre note de tour 2, revenait en arrière avec une démonstration plus rigoureuse. Comme les tours 2 tournent en parallèle (chaque rôle répond aux notes de tour 1, pas aux notes de tour 2 des autres), ce genre de retournement asymétrique est structurellement possible dès qu'un rôle change d'avis en cours de tour 2. C'est exactement pour ça que l'arbitrage de tour 3 appartient à l'orchestrateur seul, jamais à un vote majoritaire des tours précédents — ici, 2 rôles sur 3 activement engagés avaient conclu dans un sens, et l'arbitrage a tranché dans l'autre, à raison.
- **Vérifier soi-même l'implémentation d'un point architectural central plutôt que de faire confiance au rapport, même détaillé.** Le rapport de `dev-contrat` était précis et honnête (il a lui-même signalé l'écart du critère #6), mais la garde à deux niveaux — le cœur de cette itération — méritait une lecture directe du code avant d'accepter le lot. Elle s'est révélée conforme, mais ce n'était pas garanti d'avance.
- **`CLAUDE.md`+`WORKFLOW.md` est maintenant fonctionnellement figé.** Une marge de 3 octets ne survivra pas à la prochaine itération qui a besoin d'y noter quoi que ce soit. La prochaine session qui doit y écrire devra RETIRER une ligne existante avant d'en ajouter une — la doctrine du fichier le dit déjà (« une règle qui entre ici en remplace une »), mais ce n'était encore jamais arrivé au sens littéral avant cette itération.
- **L'axe de scission d'un fichier append-only est la REDONDANCE (la leçon est-elle déjà promue ailleurs ?), jamais l'âge de la feature qui a produit l'entrée.** Première rédaction de cette revue, fausse : « aucun fichier `bug_history.<feature>.json` n'a le droit d'exister avant la terminaison de la feature, précédent moteur-dossier ». Le `_about` de `bug_history.moteur-dossier.json` dit le contraire noir sur blanc — né le 2026-09-24, **pendant** l'it3 de `moteur-dossier`, alors que la feature était encore EN COURS (terminée seulement le lendemain). Une feature en cours a donc droit à sa propre archive dès qu'une entrée remplit la condition de redondance — précédent vérifié dans le `_about` avant d'être cité, pas supposé.
