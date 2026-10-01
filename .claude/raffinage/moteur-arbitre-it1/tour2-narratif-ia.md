# Raffinage `moteur-arbitre` it1 — Tour 2 — Narratif & IA

**RISQUE** — Deux erreurs de fait passent d'une note à l'autre, et l'essaim les coderait telles quelles.
- Le tech-lead présente `creerRng(graine, domaine)` comme « retenu au cadrage tour 2 », et l'UX le reprend. Or ce nom ne figure dans aucune des dix notes de cadrage, ni dans la spec.
- A4 « inconditionnelle » rendrait des PE à un héros qui ne se déplace pas.

**OBJECTION** — Au tech-lead, sur l'aléa : le cadrage a acté `alea(graine, domaine, indice)`, et l'indice y désigne un **usage** (`0` = premier tirage, `1` = relance). Un `creerRng` sans indice relance donc le pool 0 à l'identique, ou bien cache l'usage dans la chaîne `domaine`.

Sur A4, la source de vérité tranche. `REGLES-DU-JEU.md:43` dit : « changer d'écran/zone = +5 PE ; repos total = requiert une potion ». Le point E3 ajoute : « pas de régénération passive ». Une auto-référence ne change ni d'écran ni de zone.

**PROPOSITION**
- Je retire `fluxAlea` et je prends les deux fonctions du tech-lead, avec `creerRng(graine, domaine: DomaineAlea, indice)`. `alea(…): number` reste mot pour mot.
- A4 s'applique seulement si `lieuCible.id !== depuis`. Le plafond lit `heros.peMax`.
- Le lot A gagne `sessionCouverture.test.ts` (sinon jusqu'à trois assertions rougissent) et le test d'invariance des contextes. La table et la fixture ne gardent que la moitié données.

**VERDICT** — Recevable sous ces trois réserves. Pas de veto : en it1, rien ne passe au modèle.

---

## ANNEXE (hors quota)

### 0. Statut de mes objections du tour 1

| # | Objection du tour 1 | Statut | Motif |
|---|---|---|---|
| 1 | `alea(...): number` n'alimente aucun consommateur `() => number` | **Maintenue, déplacée** | L'adaptateur du tech-lead règle le problème du type de retour, et il le règle mieux que moi : il garde mot pour mot le texte du contrat `brain`, alors que le mien l'amendait. Il reste un défaut : l'indice d'usage disparaît. L'objection est satisfaite si `creerRng` porte l'indice. Je retire le nom `fluxAlea`. |
| 2 | A4 hors de `TRANSITIONS.aller`, ou A4 en `DeltaId` | **Retirée** sur l'emplacement et sur la trace | Le tech-lead converge : A4 vit dans `TRANSITIONS.aller`, sans delta ni journal. Seule la condition résiduelle reste en désaccord, tranchée au § 2 par citation. |
| 3 | Audience gardée côté données, pas côté code | **Maintenue**, en condition de verdict (pas en veto) | La convergence ne la satisfait pas (§ 3). Ce n'est pas un veto parce qu'aucun assembleur ne lit `heros` aujourd'hui (vérifié au tour 1, annexe A) : la porte est fermée, mais par lecture du code, pas par un test. |
| Signal G | `heros.caracs` sans lecteur si `pvMax`/`peMax` sont stockés | **Retiré** | KR-013 est tranché par le tech-lead : c'est de l'architecture, pas mon domaine. Une correction factuelle à l'UX : `EcranCreationHeros` lit le `CreationPool` **avant** l'écriture, jamais `session.heros.caracs`. Le premier lecteur de cette feuille sera `tierOf(heros.caracs[carac])`, en it2. Ça n'a aucun enjeu narratif. |
| Mon annexe C | Liste des lignes `heros.*` | **Corrigée par moi** | J'avais omis `heros.pvMax`, `heros.peMax` et `heros.mcBonus`. Sur ce point, la liste du tech-lead est complète et la mienne ne l'était pas. |

### 1. Contradiction a — signature de l'aléa : ce que le cadrage a réellement acté

**Faits (grep `creerRng` sur tout le dépôt)** — Il n'apparaît que dans 2 fichiers : `moteur-arbitre-it1/tour1-tech-lead.md` et `moteur-arbitre-it1/tour2-ux-designer.md`. On en compte **zéro** dans `moteur-arbitre-cadrage/` (les dix notes) et zéro dans `specification.json`.
- La note de cadrage tour 2 du tech-lead dit seulement : « `brain/dossier/alea.ts`, hors des 4 fichiers mutés — MAINTENUE ». Elle ne donne aucune signature.
- Sa seule signature au cadrage était `creerRngDeSession(graine, curseur)` (cadrage tour 1, §1). Il l'a lui-même retirée en it1 tour 1.

**Ce qui EST acté :**
- `brain_contracts[1]` : « alea(graine, domaine, indice): number … jamais un flux séquentiel ».
- `resolved_decisions` sur le héros : « le rng qu'ils utilisent doit dériver de graine_alea via alea(graine,'heros',n), jamais Math.random ».
- `resolved_decisions` sur le flux séquentiel : « alea(graine, domaine, indice), une clé par usage, jamais un compteur global ».
- Le corps de ces décisions est `cadrage/tour2-narratif-ia.md` § D : « `n=0` premier tirage, `1` relance … Jets : `alea(graine,'jet',horloge.tour)` ».

**Le cadrage se contredit lui-même, et il faut l'écrire comme tel.**
- Un `: number` ne peut pas alimenter `rollCreationPool(rng: () => number)`, qui tire 17 fois (8×2D4 + 1D4, `charCreation.ts:18-24`). C'est pourtant ce qu'exige la deuxième décision.
- Ni mon `fluxAlea` ni son `creerRng` ne sont des faits acquis : ce sont deux adaptateurs pour résoudre cette contradiction.
- À consigner dans `resolved_decisions` comme **« AMENDÉ (raffinage it1) »**, jamais comme « retenu au cadrage ». Sans cela, l'UX recopie déjà (tour 2, § objection) une décision que personne n'a prise.

**Pourquoi sa forme l'emporte sur le nombre de fonctions** — Elle garde le texte acté `alea(graine, domaine, indice): number` mot pour mot. Et le nombre de fonctions est une question d'architecture, donc de son domaine.

**Pourquoi sa forme perd sur la clé** — Sa docstring dit : « Curseur LOCAL … remis à zéro à chaque appel de `creerRng` ». La troisième coordonnée d'`alea` devient alors une position de tirage. Conséquences :
- **Relance (B2)** : `creerRng(g,'heros')` rappelé redonne le pool 0, et la relance est un no-op visible. L'autre issue est un domaine `'heros_relance'`, c'est-à-dire un usage caché dans une chaîne libre.
- **it2** : `creerRng(g,'jet')` donne **le même flux à chaque jet**, à moins d'une clé `'jet:'+tour`. C'est une clé composée par concaténation, que ni le type ni un test ne ferment.
- **Ambiguïté** : `alea(g,'heros',1)` voudrait dire « 2ᵉ tirage du pool 0 » chez lui et « relance » dans le texte acté. Une même coordonnée aurait deux sens.

**Contrat résolu (proposé au comité) :**
```ts
/** Les usages de l'aléa — registre FERMÉ. 'jet' entre en it2 avec son consommateur (KR-249). */
export type DomaineAlea = 'heros'

/** Le nombre d'un USAGE, dans [0, 1). Pur : même (graine, domaine, indice) → même valeur.
 *  `indice` est une clé d'USAGE (création : 0 premier tirage, 1 relance ; it2 : horloge.tour),
 *  JAMAIS une position de tirage. Texte du brain_contract, inchangé. */
export function alea(graine: number, domaine: DomaineAlea, indice: number): number

/** Le flux d'un USAGE, pour les consommateurs `rng: () => number` (rollCreationPool,
 *  resolveChallenge). La position de tirage est LOCALE à la fermeture : jamais un paramètre,
 *  jamais partagée. Deux appels de même clé → deux flux identiques. */
export function creerRng(graine: number, domaine: DomaineAlea, indice: number): () => number
```
- Exporter `alea` ou le garder interne relève du tech-lead.
- Comment lire « jamais un flux séquentiel » (`known_risks`) : ce qui a été rejeté, c'est le flux **global** du QA au cadrage, où l'ordre de consommation entre usages change les résultats.
- Un flux **par clé**, consommé par une seule fonction pure qui tire un nombre fixe de fois, n'est pas ce flux-là. Il est d'ailleurs inévitable tant que `rollCreationPool` et `resolveChallenge` sont réutilisés tels quels (décision actée). Ceci est à écrire dans la docstring.

**Tests de `alea.test.ts`, chacun avec ce qu'il tue :**
1. `creerRng(G,'heros',0)` appelé deux fois rend les 17 mêmes premiers tirages. Tue : un curseur partagé.
2. Tirer la clé 1 puis la clé 0 donne les mêmes suites que l'ordre inverse. Tue : le compteur global.
3. `creerRng(G,'heros',0)` diffère de `creerRng(G,'heros',1)` sur un G épinglé, avec une assertion de non-vacuité écrite. Tue : la signature à deux paramètres, où la relance redonne le pool 0.
4. `0 ≤ x < 1` sur N tirages et sur les graines extrêmes (0 et 2³²−1). Tue : une sortie à 1, pour laquelle `randInt` rend max+1 (`challenge.ts:63`).

**Côté écran, dans `EcranCreationHeros.test.tsx` :**
5. `jest.spyOn(Math,'random')` doit rester à 0 appel du montage à la validation. Il faut monter le composant **seul**, avec `graine` en prop : `PartieDemarree` appelle `Math.random` une fois par `tirerGraine` (`EcranPartie.tsx:70-71`, `:110`).
6. Le pool affiché vaut `rollCreationPool(creerRng(G,'heros',0))`, puis `…(G,'heros',1)` après « Relancer ». C'est le câblage de l'indice qui est testé, pas le hachage.

**Réponses nommées :**
- **Au QA (tour 1)** : la cible est `rollCreationPool`, pas `rollHero`. `rollHero` (`heroGen.ts:37`) génère sans la répartition du bonus par le joueur, et c'est la variante rejetée au cadrage. En it1, `rollHero` et `rollHeroCaracs` gardent zéro appelant dans les features. Votre note de tour 2 l'a déjà corrigé, j'en prends acte.
- **À l'UX** : le snippet de la GARDE 7, `<EcranCreationHeros onValider=… />`, ne passe pas la graine. S'il est codé à la lettre, le composant retombe sur le `Math.random` par défaut. C'est exactement le défaut le plus probable que j'ai nommé au tour 1. La garde doit passer `graine={session.graine_alea}` : c'est **le** premier lecteur de `graine_alea` (KR-249). Dans le composant, le pool se **dérive** de `(graine, relanceUtilisee ? 1 : 0)`. Il n'est jamais un état miroir, ni stocké en session (KR-013).

**Signal maintenu (pas un veto)** — Il n'y a pas de reprise : `useSessionPersistee.ts:37-39` dit « personne ne RELIT cette session ». Et la graine est retirée à chaque montage. Recharger la page contourne donc B2. Le plan ne doit pas affirmer qu'en it1 l'aléa keyé garantit la relance unique.

### 2. Contradiction b — condition d'A4 : la citation qui tranche

**Texte exact :**
- `docs/REGLES-DU-JEU.md:43` (§ 1, « Endurance (PE) »). C'est la source de vérité (KR-130) : « - **Récupération** : changer d'écran/zone = **+5 PE** ; repos total = requiert une **potion**. »
- `docs/REGLES-PLAY.md:104` : « **E3. Récupération PE hors potion.** Uniquement +5 par changement d'écran (§ 1), pas de régénération passive. » (marqueur de décision omis)
- `docs/REGLES-PLAY.md:29` : « **A4. Changement d'écran = +5 PE** (récupération, § 1). … *Défaut : OK, appliqué à chaque transition de nœud.* »
- `docs/REGLES-PLAY.md:12` : « le **+5 PE par changement de lieu** (cette section, A4 ; `docs/REGLES-DU-JEU.md:43` … clause Récupération) »

**Lecture :**
1. **Le fait générateur.** Il est défini à la ligne 43, et A4 y renvoie lui-même par « (récupération, § 1) » : c'est « changer d'écran/zone ». Le code décrit l'auto-référence comme « un déplacement auto-référent, dont le monde ne bouge pas » (`commandes.ts:210`). Aucune zone ne change.
2. **« appliqué à chaque transition de nœud » est une clause de fréquence.** Elle s'applique à chaque changement, et pas seulement au premier lieu visité : c'est pourquoi j'ai rejeté « jamais visité » au tour 1. Elle est écrite sous le titre « Changement d'écran ». La lire comme « chaque commande `aller` » contredit E3 (« pas de régénération passive ») et la seconde moitié de **la même ligne 43** (« repos total = requiert une potion »).
3. **J1 confirme, a contrario.** J1 (`REGLES-PLAY.md:192`) est la seule règle qui fasse compter l'auto-référence, et elle le fait pour l'**horloge**, explicitement par la demande : « Une commande acceptée dont l'état du monde ne bouge pas — déplacement auto-référent — en consomme un : c'est la DEMANDE qui compte, jamais l'effet. » A4, elle, est définie par l'effet.
4. **Exploit concret.** Dans le dossier de test `CHEMIN_MINIMAL` (`commandes.test.ts:123-142`), `lieu.val-cendre` a pour **seul** accès lui-même. Avec la version inconditionnelle, `ALLER lieu.val-cendre` en boucle donne +5 PE sans bouger. Dès qu'une ressource PE se consomme (piège en it2, round en n° 13), c'est une potion infinie.
5. **Réponse nommée au tech-lead.** Il écrit qu'« un auteur câblant un accès auto-référent verrait son héros ne jamais récupérer de PE ». C'est exactement la règle : rester sur place ne repose pas. L'auteur qui veut une récupération place une potion (ligne 43). Et un lieu dont l'auto-accès est la seule sortie est une impasse, que le schéma qualifie d'« état CALME » (`types.ts:1014`).
6. **Sa phrase se contredit elle-même.** Il écrit « Gardé inconditionnel sur `lieuCible.id === depuis` », mais son snippet ne porte aucune condition. L'UX et le QA l'ont lu comme « s'applique à l'auto-référence », et je le traite ainsi.

**Pour l'orchestrateur (demande du QA, tour 2)** — Ce n'est pas un arbitrage entre deux rôles. KR-130 renvoie la question au document, et le document tranche.

**Contrat A4 :**
- **Emplacement** : `TRANSITIONS.aller`, après les refus. Un refus ne consomme rien (J1).
- **Condition** : `session.heros !== undefined && lieuCible.id !== depuis`.
- **Calcul** : `pe = Math.min(heros.peMax, heros.pe + 5)`. Le plafond lit `heros.peMax`, jamais `caracs.EN` : relire `caracs.EN` serait la seconde formule que le tech-lead interdit lui-même au bandeau (KR-013).
- **Le 5** : une constante nommée dans `commandes.ts`. La valeur attendue du test est écrite depuis `REGLES-DU-JEU.md:43`, jamais recopiée du code.
- **Héros absent** : la clé `heros` doit rester **ABSENTE**, pas « présente et indéfinie ». Le ternaire du tech-lead écrit `heros: undefined` ; il faut un spread conditionnel. Le précédent est `commandes.test.ts:117-119`. C'est un signal pour lui, dans son domaine.
- **Trace** : ni `DeltaId`, ni entrée de journal, ni récit. Rien de neuf n'entre dans `CE PAS`.
- **Docstring** : « CE QU'IL ÉCRIT, ET RIEN D'AUTRE » (`commandes.ts:207-211`) est amendée de `heros.pe`, « quand la zone change ».

**Scénarios séparateurs (`commandes.test.ts`) :**

| Session | Geste | Attendu | Tue |
|---|---|---|---|
| pe = peMax−6, cible ≠ départ | aller | peMax−1 | A4 absente, constante fausse |
| pe = peMax−2, cible ≠ départ | aller | peMax | plafond absent |
| pe = peMax−6, auto-référence (`CHEMIN_MINIMAL`) | aller | peMax−6 | version inconditionnelle |
| sans héros | aller | `'heros' in session === false` | `heros: undefined` écrit |
| pe = peMax−6 | agir | inchangé | A4 câblée sur le mauvais verbe |

**Critère 3 à réécrire** — « vers un nouveau lieu » devient « vers un lieu différent du lieu courant ; une auto-référence ne récupère rien ». Jamais « jamais visité ».

**Signal au PM (pas un veto, c'est son domaine)** — Les PE partent pleins (B4 ; `charCreation.ts:81`) et rien ne les consomme en it1. En jeu réel, A4 est donc toujours écrêtée à zéro : **le bandeau ne bouge jamais au déplacement**. Votre point (d) le dit, mais la phrase de démo (« le regarde vivre dans le bandeau en se déplaçant ») promet encore une observation qu'it1 ne peut pas produire.

### 3. Point 4 — l'audience : la convergence ne couvre que la moitié données

- **Acquis avec le tech-lead** : toutes les lignes `heros.*` sont `moteur`, et la table comme la fixture saturée sont dans le lot A. C'était mon annexe C, pas mon objection 3.
- **L'instrument dit lui-même qu'il ne prouve pas le confinement.** `sessionCouverture.test.ts:32-36` : « L'AUDIENCE RÉELLE. La table déclare une intention et force une déclaration ; elle ne démontre pas le confinement — la moitié CODE de cette preuve est `moteurSansIA.test.ts` ».
- **Et `moteurSansIA.test.ts` ne couvre pas ce cas.** Il balaie play-mode et le runtime à la recherche d'appels réseau. Il ne regarde pas si `brain/copilote/contexte/*` lit `session.heros`.
- **Son seul fichier exclu fait entrer le héros.** `useTourDeJeu.ts:76` passe la session entière dans `CibleNarrateur.session: EtatSession` (`copilote/types.ts:524`). Dès it1, le héros arrive au seuil des assembleurs de R1 et R3.
- **Condition** — Test d'invariance dans `src/brain/copilote/contexte.test.ts`, au lot A. Je corrige le chemin du tour 1 : le fichier est `copilote/contexte.test.ts`, pas sous `contexte/`.
  - On compare `assemblerNarrateur` avec la session `S`, puis avec `{...S, heros: H}`. `texte` et `ancres` doivent être identiques. Même test pour `assemblerInterprete`.
  - `H` est un héros piège : `name: 'SENTINELLE-HEROS'`, des caracs différentes de 4 partout, pv ≠ pvMax, pe ≠ peMax, xp ≠ 0.
  - Avant de signer le test, on écrit le mutant qui injecte `session.heros?.name` dans `CE PAS`, et on constate qu'il rougit.
  - Expiration nommée : en it2, l'invariance se restreint aux pas sans jet, en commentaire (KR-195/196).
- **C'est aussi la borne du budget de contexte** : en it1, Δ = 0 caractère par pas pour R1 et R3, prouvé par ce test.

**Corrections à la table du tech-lead (vérifiées sur l'instrument) :**
- **`'heros.caracs.<id>'` ne correspond pas à l'instrument.** La normalisation `<id>` se fait côté test et ne lit que les clés de `SESSION_SATUREE.monde.pnj` (`sessionCouverture.test.ts:72-77`). Le balayage rendra donc `heros.caracs.FO`…`heros.caracs.CA`. Deux assertions rougissent : « toute feuille a une ligne » (×8) et « aucune ligne morte » (sur `heros.caracs.<id>`). Correctif : `` `heros.caracs.${Characteristic}` `` dans `CheminDeFeuilleDeSession`. Les 8 clés deviennent exigées par la compilation et correspondent au balayage, sans toucher à la normalisation.
- **`sessionCouverture.test.ts` manque à son lot A.**
  - `DISPENSES_DE_FEUILLE` gagne `heros`, sixième racine porteuse ; les libellés « cinq » doivent suivre.
  - `toHaveLength(9)` passe à 10 (`:123`).
  - Réponse nommée : sa propre objection au cadrage (« l'agent découvre le blocage EN COURS DE LOT ») s'applique mot pour mot à ce lot.
- **`lignesIa` (`:236-258`)** reste inchangé en valeur. C'est lui qui rougit, par son nom, si une ligne `heros.*` bascule.
- **Docstring de `heros.name`** : c'est une saisie libre du joueur, et le narrateur, qui vouvoie, n'en a pas besoin. On ne la rouvre qu'avec une borne en caractères, une normalisation (précédent `attente.saisie`) et `lignesIa` amendé en valeur.

### 4. Grille Narratif & IA appliquée à it1

| # | Point vérifié | État en it1 |
|---|---|---|
| 1 | Frontière code / IA | Le dé passe par `creerRng` puis `rollCreationPool`. Les stats passent par `fixerHeros` et A4 dans `TRANSITIONS`. La narration ne reçoit rien de neuf. |
| 2 | Contrat de sortie du modèle | Aucun nouvel appel IA, aucun contrat nouveau. |
| 3 | Budget de contexte | Δ = 0, prouvé par le test du § 3. |
| 4 | Identifiants stables | A4 compare deux identifiants de lieu. Les domaines d'aléa forment une union fermée, jamais des chaînes libres. |
| 5 | Mémoire de session | Le héros n'est ni retenu, ni résumé, ni oublié par la mémoire du narrateur. La création et A4 n'écrivent aucune entrée de journal ; `aller` écrit toujours 2 entrées. |
| 6 | Cohérence de la fiction | Le narrateur ignore tout du héros, il ne peut donc pas le contredire. |
| 7 | Voix | Pas de génération en it1. Le texte d'écran vouvoie (contrat UX), comme R3. |
| 8 | Garde-fous | Sans objet en it1. |

## Décisions prises en autonomie faute de spécification
- Nombre de fonctions d'aléa : le cadrage n'a fixé que `alea(graine,domaine,indice): number` → les deux fonctions du tech-lead, avec un `creerRng` qui porte l'indice → avec une seule fonction rendant `() => number`, il faudrait amender le type du contrat `brain`. Avec un `creerRng` sans indice, la relance rejoue le pool 0 et la clé de jet d'it2 se fabrique par concaténation de chaînes.
- Statut de l'écart du cadrage (`: number` contre `rng`) → consigné comme AMENDEMENT dans `resolved_decisions` → sinon une « décision du cadrage » que personne n'a prise se propage ; c'est déjà arrivé ce tour, l'UX l'a recopiée.
- Sens de « chaque transition de nœud » (A4) → une clause de fréquence, sous le titre « Changement d'écran » → l'inverse code une régénération sans déplacement, que E3 et la ligne 43 interdisent (KR-130), et ouvre une potion infinie dès qu'on consomme des PE.
- Plafond d'A4 → lit `heros.peMax`, jamais `caracs.EN` → l'inverse crée une seconde formule du même fait (KR-013).
- Place du test d'invariance → lot A, `src/brain/copilote/contexte.test.ts` → au lot B, il arriverait après le premier rendu qui transporte le héros, donc après l'ouverture de la porte.
- Valeurs dorées du hachage d'aléa → non posées en it1 → à poser quand la reprise relira `graine_alea`. Avant, une valeur recopiée de la sortie du code n'aurait aucune source (doctrine `table-doree`), et un changement de hachage ne casse aucune session rejouable.

## Fichiers lus / consultés ce tour

**Citation exacte retrouvée pour A4** — `docs/REGLES-DU-JEU.md:43` : « - **Récupération** : changer d'écran/zone = **+5 PE** ; repos total = requiert une **potion**. » Confirmée par `docs/REGLES-PLAY.md:104` (E3) et `:29` (A4).

**Notes de raffinage it1** — tour1-{narratif-ia,tech-lead,pm-produit,ux-designer,qa}.md, tour2-{ux-designer,qa,pm-produit}.md (parus pendant ce tour).

**Notes de cadrage** — cadrage/tour1-tech-lead.md, tour2-tech-lead.md, tour2-narratif-ia.md ; grep `creerRng|fluxAlea|alea\(` sur les 10 notes, puis grep `creerRng` sur tout le dépôt.

**Spec et règles** — specification.json, docs/REGLES-DU-JEU.md (1-50), docs/REGLES-PLAY.md (1-50, 104, 188-194).

**Code** — commandes.ts (150-300), commandes.test.ts (115-150), dossier/types.ts (995-1017), sessionDestinations.ts, sessionCouverture.test.ts (1-130, grep), charCreation.ts, heroGen.ts, player/types.ts (20-35), challenge.ts (grep rng), EcranPartie.tsx (55-118), useSessionPersistee.ts, useTourDeJeu.ts (grep), moteurSansIA.test.ts (grep), copilote/types.ts (grep CibleNarrateur), copilote/contexte.test.ts (grep), copilote/contexte/narrateur.ts (300-360).
