## Note de tour 2 : Directeur narratif & IA, `moteur-interprete` it2

Lecture seule. Aucun fichier modifié, aucun test exécuté. Toutes les références de ligne ont été relevées dans `main`.

---

### RÉPONSE AUX OBJECTIONS

**Au Tech Lead, sur les trois objections structurantes (question 1)**

- **(a) `faits_etablis` sans lecteur.** Nous sommes d'accord. Son D5 m'apporte la preuve mécanique qui me manquait : `sessionCouverture.test.ts:242-243` pose un `@ts-expect-error` sur `{ faits_etablis: [] }`. Mais son `PropositionNarrateur.etablis` fait revenir par une porte latérale ce que son propre D4 rejette. `FaitAncre` fige la forme que `memoire` recevra, alors qu'aucun lecteur n'existe encore. Sur (a), ma proposition reste la plus complète (voir question 2).
- **(b) KR-231.** Nous sommes d'accord. L'annexe donne un seul jeu de noms.
- **(c) Invite R1.** Ici, le Tech Lead a vu ce que j'avais manqué : amender le texte ne suffit pas. Je reprends dans le Lot 1 tout son § B :
  - le court-circuit `tables.gestes.size === 0` devient du code mort (`[].every` vaut toujours `true`), avec ses tests ;
  - `TEXTE_IMPASSE` devient inatteignable ;
  - le texte console « aucune commande à proposer » devient faux ;
  - la liste `interdits` de `worker/index.test.ts:1283` doit être dérivée de `COMMANDES`. C'est le témoin mécanique de ma règle « l'invite ne nomme jamais un verbe ». **Je l'étends à `INVITES.narrateur`.**
  - Je reprends aussi son verrou console (D1 élargi) : une commande console pendant R3 ferait raconter un monde périmé. C'est aussi une garantie de cohérence de la fiction.
  - Et son scénario séparateur de `consignerRecit` : un `aller` qui franchit un jalon place des entrées de jalon *après* l'entrée d'`origine`.
- **Ce que j'ajoute sur (c).** `agir` est toujours satisfiable, donc il devient l'aimant de R1. `sans_commande` ne survit plus que par deux choses : la clause de `worker/index.ts:542` (« Pour tout le reste, y compris des propos qui n'ont rien à voir avec l'aventure ») et la portée du **label** d'`agir`. Ce label devient un contrat narratif, lu deux fois par un modèle (ligne G de R1, bloc « ce pas » de R3). Contraintes :
  - troisième personne au présent, même forme que `'va au lieu'` (`commandes.ts:63`) ;
  - il dit la portée : sur place, sans quitter le lieu ;
  - aucun mot de mécanique.
  - Exemple : `'agit sur place'`. La formulation revient à l'UX.
  - Témoin textuel : la clause de la l.542 survit à l'amendement.

**Au Tech Lead, sur `etablis` dès it2 (question 2) : ni requis, ni optionnel**

- **Le motif `tsc` est réfuté par le code.** Le mock narrateur est un `jest.fn()` non typé (`useTourDeJeu.test.ts:85`) : lui ajouter un membre requis en it3 ne casse pas `tsc`. Le seul motif typé est le résolveur annoté `SortieInterprete` (l.112–116). Règle pour le Lot 2 : les mocks narrateur suivent la l.85, jamais la l.112. Sinon, le lot contrat d'it3 déclare ces fichiers touchés, comme le précédent it1. C'est un coût de fixture, payé une fois.
- **Ce que coûte `etablis` en it2 : à chaque pas de chaque partie.**
  - Une table de rangs injectée dans R3 : la prose peut alors laisser fuir « L2 », d'où `porteUnRang` à généraliser.
  - Une re-résolution et un type `FaitAncre`.
  - Des jetons de sortie en plus, sur le chemin critique du pas.
  - Et surtout : un récit sain refusé en bloc (KR-230), rejoué puis dégradé à cause d'un fait que personne ne lit. Le joueur lit « Le récit n'a pas pu être généré » pour une donnée morte.
- **Un champ optionnel `etablis?` ne concilie rien.**
  - KR-160/191 (et KR-251) protègent des formes **persistées**. `PropositionNarrateur` est transitoire.
  - L'optionnel crée un double encodage permanent : `undefined` ≡ `[]`.
  - Il déclare un `FaitAncre` sans producteur ni consommateur (KR-235).
  - Il additionne les deux coûts et n'en retire aucun.
- **Le garde-fou 2 en it2 (aucune création d'entité).** Aucune entité ne peut être créée *dans l'état* : R3 n'a qu'un chemin d'écriture, une chaîne posée sur une entrée existante, après que le moteur a écrit. Un fait non ancré ne devient nocif que le jour où il est retenu puis réinjecté, c'est-à-dire en it3. Le mutant #7 part avec son lecteur.
- **Amendements explicites à écrire au plan, jamais en silence :**
  - critère #6 : forme de sortie ;
  - critère #7 : « le lot qui livre R3 » devient « le lot qui livre les faits, avec `memoire` » ;
  - `brain_contracts`, ligne `sessionDestinations` : aucune ligne `ia` en it2.

**Au PM, sur la `Chip` (question 3)**

Non, retirer la `Chip` ne réduit pas mon risque. Mon risque vit dans le contenu de la prose, pas dans le clic. Une Chip ne touche jamais l'état : elle remplit le champ et repasse par R1 puis `executerCommande`. Le risque propre aux suggestions (une action qui suppose une entité absente, comme « parler au garde ») est identique en texte et en Chip : c'est l'affichage qui cautionne, pas le clic.

La coupe du PM retire de la surface technique, rien du côté du modèle : mêmes jetons, même motif de refus du lot entier. Pas de veto, le périmètre est au PM. Si la tranche doit maigrir, je préfère retirer `tentatives` de la sortie réseau en it2 et faire entrer suggestions et Chip ensemble plus tard. Sinon, je préfère la Chip du `design_contract`.

Deux exigences quelle que soit l'option :
- une suggestion n'est jamais persistée ni exécutée directement ;
- elle est **vidée à chaque pas**. Témoin : si R3 échoue au pas N+1, les suggestions du pas N (celles d'un lieu quitté) ne sont plus affichées.

**Au Tech Lead, sur `trop-long` (question 4)**

C'est la même chose sur les trois points porteurs : le Lot 1, un refus avant tout `fetch`, une seule constante qu'it4 absorbe sans jamais la dupliquer. Deux nuances :

1. **Sens de dérivation.** « 3P + E ≤ 53 248 » cale le budget sur le plafond. La doctrine fait l'inverse :
   - P se dérive d'une **mesure** : `ceil(M×3/1000)×1000` (`registres.ts:327-345`) ;
   - `TAILLE_MAX_CORPS_IA` se re-dérive ensuite sur les huit rôles (« CE PLAFOND N'EST PAS UN CLIQUET », `worker/index.ts:644`, « il bouge » à 3c) ;
   - son inégalité devient le constat qui suit la mesure, pas la règle.
2. **Emplacement.** `BUDGET_CARACTERES_NARRATEUR` vit dans `contexte/narrateur.ts`, **hors** de `BUDGET_CARACTERES_CONTEXTE`. Sinon `ROLES_AUTEUR` ferait entrer le narrateur dans la parité auteur (son § A).

La borne ne peut pas attendre it4 : sans elle, la seule borne est le 413 du worker, classé `injoignable`. Le joueur lirait « indisponible », ce qui ment sur la cause, et le `fetch` serait déjà parti.

**Au QA, critère #6**

`demander('narrateur', {issue, deltas, projection})` contredit le D2 du Tech Lead et mon annexe A. La cible porte `session: S1`. Test reformulé : le 2ᵉ appel de `demanderMock` reçoit une session `toBe` celle transmise à `onSessionChange`. La projection se prouve au niveau de l'assembleur (témoin de confinement), jamais dans le hook. Tes trois tests du #7 (`sur:[]`, rang hors table, accepté) partent en it3.

**À l'UX, source du récit affiché**

Je retiens le récit dérivé de `session.journal` : l'entrée au tour courant qui porte `recit`. Pas `avis.recit` dans l'état du hook. Un récit tenu en état de hook est une seconde copie de la fiction persistée : après un rechargement, l'écran et l'état divergent. Sur le reste (bannière de dégradation, `OutcomeBlock` intact), nous sommes d'accord.

**Au PM, KR-262**

Maintenu : `Entite.nom` reste hors de R3. La `description` d'un lieu (audience `ia`, requise) est l'endroit où l'auteur nomme le lieu au joueur. D'accord pour une vérification sur un vrai récit en revue de fin ; ce n'est pas un test.

---

### STATUT DE MES OBJECTIONS DE TOUR 1

1. **Faits sans lecteur : maintenue et durcie.** Elle s'étend à `etablis`, requis ou optionnel. Elle entraîne l'amendement écrit des critères #6 et #7.
2. **Mémoire non spécifiée : retirée, car satisfaite.** Il y a consensus sur R3 sans état et sans paramètre `memoire`. Elle devient un invariant écrit plus le témoin pas 2 / pas 40.
3. **KR-231 : retirée, car satisfaite.** Il y a consensus ; les noms sont unifiés en annexe.
4. **« 3 des onze » : maintenue.** Personne d'autre ne l'a reprise. La `design_reference` de la spec dit « n° 10 n'en ouvre que 3 ». R1 en ouvre 1 et R3 en ouvre 4, donc **5**. Le plan it2 doit écrire la liste fermée des onze.
5. **Invite R1 : maintenue et durcie.** Elle s'ajoute au § B du Tech Lead, avec les `interdits` dérivés de `COMMANDES` pour les deux invites, les contraintes du label `agir` et le témoin de la l.542.

**Retrait propre.** Je retire la branche « le pas a bougé ⇒ même référence » de mon `avecRecit`. Le verrou champ + console la rend inatteignable, et ce serait du code défensif mort (KR-235).

---

### VERDICT

**Recevable sous réserve.** Réserves :
- les amendements écrits des critères #6, #7, de la ligne `sessionDestinations` et du « 3 des onze » ;
- la sortie de R3 sans faits en it2.

**Veto** si R3 part dans l'un de ces cas :
- sans refus `trop-long` avant `fetch` ;
- avec une entrée tirée du journal, de récits passés ou de `memoire` ;
- avec `journal[].recit` en audience `ia` ;
- ou, si le comité garde malgré tout `etablis`, avec des rangs injectés sans `porteUnRang` sur la narration.

---

### ANNEXE : types finals (un seul jeu de noms) et borne

Les noms suivent le précédent du dépôt : `XxxRendue` pour le réseau, `PropositionXxx` pour la forme résolue, `validerXxx` et `assemblerXxx`.

```ts
// brain/copilote/types.ts
interface CibleNarrateur { role: 'narrateur'; saisie: string; session: EtatSession } // S1, déjà persistée
interface NarrationRendue { narration: string; tentatives: readonly string[] }       // réseau, NON ré-exporté par le baril
interface PropositionNarrateur { readonly recit: string; readonly suggestions: readonly string[] } // résolu
type ReponseNarrateur = { statut: 'propose'; proposition: PropositionNarrateur } | EchecCopilote
// {narration, tentatives} ∩ {recit, suggestions} = ∅ (KR-231). Clés absentes de tout gabarit livré (vérifié).
// CopiloteService : 8e surcharge aux deux sites ; CorpsDemande : membre littéral { role: 'narrateur'; contexte: string }
// brain/copilote/schemaSortie.ts
validerNarrateur(brut: unknown, dossier: Dossier): { ok: true; sortie: NarrationRendue } | { ok: false; motif: MotifIllisible }
NARRATION_CARACTERES_MAX = 800 · TENTATIVE_CARACTERES_MAX = 60 · TENTATIVES_MAX = 3
// brain/copilote/contexte/narrateur.ts
assemblerNarrateur(dossier, cible) · BUDGET_CARACTERES_NARRATEUR   // hors Record<RoleCopilote>
// brain/dossier/recit.ts
consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession
// brain/dossier/session.ts
EntreeJournal.recit?: string   // optionnel à vie (persisté, KR-251) ; 'journal[].recit': 'moteur' en it2
// brain/dossier/commandes.ts
agir: { label: /* UX, contraintes ci-dessus */, verbe: 'AGIR', refKinds: [] }
```

- **Validateur.** Les règles 1 à 6 de mon annexe B du tour 1 sont inchangées. Pas de `porteUnRang`, puisqu'aucun rang n'est injecté. `max_tokens` ≈ 1 600 au pire ratio, à re-mesurer.
- **`tentatives` plutôt que `relances`.** Les clés du gabarit sont lues par le modèle. « Relance » est, en jargon de MJ, un crochet d'intrigue : ce mot inviterait le modèle à écrire du lore que l'auteur n'a pas écrit.
- **Hors it2, pour mémoire.** Le comité it3 ajoute `etablis`, **requis** (type transitoire), le réseau `faits:[{fait, sur}]`, les rangs dans R3, `porteUnRang` et le mutant #7.

**Borne de contexte confirmée**

- **Forme du contexte.** Il se calcule à partir du dossier, du lieu courant, des deltas du pas, des possessions, des jalons atteints et de la saisie. Aucun terme ne dépend du nombre de tours. Il croît avec la progression et reste borné par les totaux du dossier.
- **Mesure de M.** Sur `dossier-reference.json`, au pire état : le lieu le plus long, l'inventaire plein, tous les jalons atteints, les deltas maximaux, une saisie de 300 caractères. On asserte d'abord que les 5 chemins résolvent non vides, sinon M n'est qu'un plancher.
- **Refus.** `trop-long` avant `fetch`, zéro appel.
- **Plafond worker.** `TAILLE_MAX_CORPS_IA` est re-dérivé sur les 8 rôles. « Inchangé » doit être une mesure, pas une supposition.
- **Témoins :**
  - pas 2 et pas 40, même état ⇒ contexte identique (`===`) ;
  - dossier de référence au pire état ⇒ contexte sous P ;
  - fixture saturée ⇒ `trop-long`, zéro `fetch`.
- **Risque porté à it4, à écrire au plan.** Dans une partie, le refus est monotone : une fois franchi par l'inventaire, il ne se lève plus. La cascade du critère #9 (suggestions, fenêtre, faits) n'atteint pas le bloc « où en est le héros ».

---

### Décisions prises en autonomie faute de spécification

- `etablis` en it2 → absent, ni requis ni optionnel → sinon : rangs dans R3, `porteUnRang` généralisé et des récits refusés pour un fait sans lecteur, à chaque pas.
- `etablis` en it3 → requis → optionnel, ce serait un double encodage `undefined` ≡ `[]` à vie, sur un type qui n'est pas persisté.
- Coût `tsc` d'it3 → mocks non typés (l.85) ou fichiers déclarés touchés au contrat d'it3 → sinon, un champ mort dans le contrat du modèle.
- Clé réseau des suggestions → `tentatives` → avec `relances`, le gabarit invite le modèle à écrire des crochets d'intrigue.
- Dérivation du budget → mesure, puis re-dérivation du worker → budget calé sous 53 248 : le dossier de référence pourrait être refusé à inventaire plein.
- Branche « pas bougé » de `consignerRecit` → retirée → la garder, c'est du code défensif inatteignable.
- Label `agir` → contraintes posées, formulation laissée à l'UX → un label sans portée fait d'`agir` un aimant et rend `sans_commande` mort en pratique.
- Suggestions → vidées à chaque pas → sinon on propose les gestes d'un lieu quitté quand R3 échoue.
- Chip → pas de veto ; si la tranche maigrit, retirer `tentatives` plutôt qu'afficher du texte inerte → sinon, coût modèle et motifs de refus inchangés, sans usage.
- Refus monotone dû à l'inventaire → accepté en it2, reporté à it4 → le borner maintenant exigerait un ordre des possessions que rien ne spécifie.

**Fichiers lus** (dans `C:\Users\pierr\Desktop\genliv\`)

- `.claude\raffinage\moteur-interprete-it2\tour1-{narratif-ia,tech-lead,pm-produit,ux-designer,qa}.md`
- `src\features\moteur-interprete\specification.json`
- `src\features\play-mode\hooks\useTourDeJeu.test.ts`
- `src\brain\dossier\sessionCouverture.test.ts`
- `src\brain\dossier\commandes.ts`
- `src\brain\copilote\{schemaSortie.ts, contexte\interprete.ts, contexte\registres.ts}`
- `worker\index.ts`
