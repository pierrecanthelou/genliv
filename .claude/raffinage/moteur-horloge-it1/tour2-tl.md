# Tech Lead, tour 2, moteur-horloge it1

**RÉPONSES NOMMÉES**
- **NIA, ligne « minuterie » de la table J2 : rejetée.** `tables.ts:783-785` a déjà tranché qu'une étape sans `_expr` reste calme : le narrateur la fait avancer à la main, sur « tous les plans écrits en prose ». Une minuterie ferait avancer ces étapes toute seule et rendrait `si_bloque` inatteignable (`types.ts:433-446`). C'est le motif de votre propre R-1.
- **QA, `changementsDe` en retour du tick : rejeté.** Aucun appelant en it1, et la décision « pas de `ChangementPerceptible[]` » est déjà actée.
- **PM, quatre lots : rejeté.** Un lot, onze fichiers, tout sous `brain/`, exécution séquentielle.

**MES OBJECTIONS**
1. **AC1 contredit AC2/`types.ts`** : maintenue. Je rejoins le veto PM sans le doubler. J2 est réécrit avant tout code.
2. **`depuis` sans lecteur (KR-249)** : maintenue sur le fond, **ma proposition est RETIRÉE**. La ligne « bloqué » était un lecteur fabriqué (UX b, NIA R-2). Aucun lecteur légitime n'existe en it1 : `depuis` sort avec durée et bloqué, optionnel (KR-251), en it2. `etape_plan?: { rang }` reste un objet : `depuis` est nommé en it2, et un entier figerait la forme persistée, sans migration possible.
3. **Ligne sans `origine`/`deltas`** : maintenue, consensus UX/NIA. Elle devient un test.
4. **Fixture et couverture** : maintenue. Une seule feuille, donc comptes 3→4, 2→3, `{ pnj: 3 }`.
5. **NOUVELLE, durcie en veto** : l'entrée stockée « rang 0 » de NIA est un état dérivable. Elle pré-sème `monde.pnj` (`faits.ts:77-82`, KR-013). Sortie retenue : rang absent ≡ 0, et `etape_plan` n'est écrit qu'à un avancement.

**VERDICT** : CHANGES REQUESTED. Passe à APPROVE dès que (5) est tranché et que AC1/AC2/KR-298/roadmap ligne 14 sont réécrits.

---

## ANNEXE, découpage en lots (hors quota)

Un seul lot, `contrat`, seul. Les onze fichiers sont les mêmes qu'au tour 1. Seule l'interface rétrécit. Il n'y a ni feature ni worktree : exécution séquentielle, sans fusion.

| Lot | Type | Fichiers (N = créé, R = remplacé) |
|---|---|---|
| **A `horloge-contrat`** | `contrat`, seul | **R** `docs/REGLES-PLAY.md` (§ J2, écrit en premier) |
| | | **R** `src/brain/dossier/faits.ts` |
| | | **R** `src/brain/dossier/sessionDestinations.ts` |
| | | **R** `src/brain/dossier/__fixtures__/session-saturee.ts` |
| | | **R** `src/brain/dossier/sessionCouverture.test.ts` |
| | | **R** `src/brain/dossier/evaluate.ts` |
| | | **R** `src/brain/dossier/evaluate.test.ts` |
| | | **N** `src/brain/dossier/horloge.ts` |
| | | **N** `src/brain/dossier/horloge.test.ts` |
| | | **R** `src/brain/dossier/commandes.ts` |
| | | **R** `src/brain/dossier/commandes.test.ts` |

**J2 à écrire (REGLES-PLAY.md)**
1. `n = (rang ?? 0) + 1`. Le rang est un index dans `plan_actions[]`, jamais un tri sur `.etape` (KR-198).
2. `plan[n]` absent (plan vide, plan d'une étape, dernier rang, rang hors bornes, négatif ou non entier) : aucune avance, aucune ligne, aucune exception, même référence de session. Une seule garde `=== undefined` couvre les cinq cas.
3. Le PNJ passe à `n` ⇔ `plan[n].declencheur_expr` est présent ET vrai sur les faits après jalons. Absent = jamais (`tables.ts:783`).
4. Un cran au maximum par PNJ et par pas.
5. L'étape 0 est l'état de départ : son déclencheur n'est pas lu en it1.
6. `duree` et `si_bloque` ne sont lus nulle part en it1.

**Interfaces, dans l'ordre d'exécution**
- `faits.ts` : `EtatPnj.etape_plan?: { readonly rang: number }`.
  - Optionnel à vie. `rang 0` est légal et se lit comme l'absence.
  - Écrivain unique : `tickHorloge`. `faits.ts` n'importe toujours rien (garde `evaluate.test.ts`).
- `sessionDestinations.ts` : une seule feuille, `'monde.pnj.<id>.etape_plan.rang': 'moteur'` (union de type + table).
- Fixture : `pnj.aldur-le-sage` reçoit `etape_plan: { rang: 1 }`. La valeur n'est jamais 0, car 0 ≡ absent (doctrine de la sentinelle de `confiance: 2`). `pnj.corvin-le-marchand` reste sans le champ.
- `sessionCouverture.test.ts` : bruts 3→4, normalisés 2→3, `LIGNES_ATTENDUES = { pnj: 3 }`.
- `evaluate.ts` : `export function etapeDeclenchee(faits: FaitsDeSession, etape: PlanAction): boolean`.
  - `declencheur_expr` absent rend `false`, sinon `evaluerExpr(faits, etape.declencheur_expr)` (ordre des arguments : faits d'abord).
  - Une condition inconnue lève (KR-238, aucun `catch`).
  - Il n'est pas exporté par `brain/index.ts`.
  - Il n'a qu'un appelant, et c'est assumé : il existe parce que `evaluate.test.ts:706` interdit de lire `.declencheur_expr` ailleurs, pas par goût de réutilisation.
- `horloge.ts` : `export function tickHorloge(dossier: Dossier, session: EtatSession): EtatSession`.
  - Pure. Rend `session` à l'identique si rien ne change.
  - Écrit seulement `monde.pnj[id].etape_plan` (spread de l'entrée existante, `{ a_dit: [] }` si absente) et des lignes `role: 'moteur'`.
  - Les lignes sont ajoutées après celles des jalons, à `tour = session.horloge.tour` (jamais +1, J1), dans l'ordre de `monde.personnages[]`.
  - Texte exact : `etape_plan : {id} {n} → {n+1}` avec `n = (rang ?? 0) + 1`. Aucun champ `origine`, `deltas`, `recit`, `jet` ni `interlocuteur`.
  - Ne lit que `plan_actions[]` et `etapeDeclenchee`. Le fichier ne contient ni `op ===` ni `switch (….op)` : `expr.test.ts:424-433` recense les lecteurs d'arbre.
  - `import type` seulement vers `session.ts`, comme `commandes.ts:34`. Non exporté par `brain/index.ts`.
- `commandes.ts` : signature de `executerCommande` inchangée. Le bras ok devient `{ ok: true, session: tickHorloge(dossier, avecJalonsResolus(dossier, resultat.session)) }`. La docstring de totalité s'étend aux déclencheurs de plan.

**Tests exigés, observables (réponse à QA 1, 3, 4, 5)**
- **Scénario séparateur it1.** Plan de trois étapes [A sans déclencheur, B déclencheur T1, C déclencheur T2].
  - Pas 1 : T1 faux, T2 vrai → rang inchangé, `toBe(session)`. Prouve qu'il n'y a ni saut ni lecture de la dernière étape vraie.
  - Pas 2 : T1 vrai → `{ rang: 1 }`, une ligne `… 1 → 2`.
  - Pas 3 : T2 vrai → `{ rang: 2 }`. Un cran par pas, même si T2 était déjà vrai au pas 2.
- **Aucune lecture de `duree`** : une étape à `duree: 1`, déclencheur faux pendant cinq commandes → `toBe(session)` à chaque pas. C'est le mutant « avance à l'échéance », et il tue la lecture fautive.
- Cas limites : plan vide, une étape, dernier rang, rang 7 sur un plan de 3, rang −1, rang 1.5, déclencheur absent.
- **AC8 observable** : pour toute commande, `tickHorloge` ne change que `monde.pnj[*].etape_plan` et ajoute des lignes à `journal`. L'égalité profonde se vérifie après avoir retiré ces deux champs. S'y ajoute `moteurSansIA.test.ts` qui scanne `horloge.ts` (liste dérivée du disque), avec mutant obligatoire (KR-250) : import hors liste → rouge → retiré.
- Croisé `crediterConfiance` + `consignerReponseActeur` + tick, dans les deux ordres : `a_dit`, `confiance` et `etape_plan` survivent (trois écrivains sur `EtatPnj`).
- La couture : refus ⇒ aucun tick. Combat ⇒ refusé avant tout tick (KR-295).
- Une ligne de tick n'est jamais « porteuse » pour `ligneDuPas` ni `consignerJet`. Le contexte R3 reste octet-identique pour un pas dont le tick écrit.
- Plan en prose seule (aucun `_expr`) → PNJ immobile, aucune ligne.

**Porte du lot** : Prettier, `tsc --noEmit`, ESLint, jest complet. Gardes à relire : `evaluate.test.ts` (706 et « faits.ts n'importe RIEN »), `expr.test.ts` (recensement), `moteurSansIA.test.ts`, `sessionCouverture.test.ts`, `deltas.test.ts`.

**Hors lot, étape 4, écrits par l'orchestrateur après la porte**
- `specification.json` : goal d'it1 (phrase PM), AC1/AC2 réécrits, AC3 rattaché à it2, `brain_contracts` à `{ rang }`, ligne KR-249 du spec, `open_questions` « bloqué ».
- Roadmap ligne 14 : écart de périmètre écrit, durée/depuis/bloqué reportés en bloc à it2.
- **KR-298 réécrit en place** (« `{rang}` seul, absent ≡ 0, `depuis` entre en it2, optionnel »), jamais plus long que l'actuel. La marge de `code-knowledge.json` est de 4 o selon le tableau du budget, qui date d'avant le cadrage : à re-mesurer (`git show :code-knowledge.json | wc -c`).
- CHANGELOG, `features_history.json`, README.

**Non touchés, par conception** : `session.ts` (dette n° 13, >800 lignes), `types.ts`, `destinations.ts`, `validate.ts`, `brain/index.ts`, toute feature.

---

## Décisions prises en autonomie faute de spécification
- **Statut de l'étape 0 (« absent = plan non évalué » vs entrée de NIA)** → rang absent ≡ 0, étape 0 = état de départ, son déclencheur n'est pas lu en it1, `etape_plan` écrit seulement à l'avancement → si c'est l'inverse (entrée gardée par le déclencheur de l'étape 0) : il faut un état stocké non dérivable, une ligne d'entrée `— → 1` côté UX, et KR-298 réécrit une seconde fois. Un déclencheur posé sur l'étape 0 par un auteur est muet jusque-là : lint n° 7 à prévoir.
- **`depuis` : spec « dans la même itération » vs PM « reporté »** → reporté avec durée/bloqué, objet `{ rang }` conservé → si c'est l'inverse : soit un champ écrit sans aucun lecteur (KR-249), soit la minuterie de NIA (rejetée ci-dessus). Coût du report : en it2, `depuis` sera optionnel à vie et son lecteur devra définir « absent » (par exemple jamais bloqué) pour les sessions persistées en it1.
- **Nombre de lots (PM : quatre, moi : un)** → un seul → si c'est l'inverse : trois lots `contrat` séquentiels sur les mêmes dossiers de test, dont un sélecteur sans appelant le temps d'un lot, pour aucun parallélisme.
- **Rang hors bornes, négatif ou non entier (session persistée contre un dossier édité)** → no-op silencieux, total, sans exception ni ligne → si c'est l'inverse (lever ou exposer) : lever donne un écran blanc sur un chemin utilisateur (logique de KR-238) ; exposer demande un canal qui n'existe pas (porte `jouable` = dossier, pas session). La limite est celle de `dossier-fiches/specification.json:350` (session pendante, à nommer en n° 9+) : `PlanAction` n'a pas d'identifiant stable, `rang` est un index (KR-298).
- **`etapeDeclenchee` à un seul appelant** → gardé, car la garde KR-246 (`evaluate.test.ts:706`) l'impose → si c'est l'inverse : lire `.declencheur_expr` dans `horloge.ts` desserre la garde et la sémantique d'une condition aurait deux lecteurs.
- **Comptes de couverture 3→4, 2→3, `{ pnj: 3 }`** → déduits du nombre de feuilles de la table, une de plus → si la fixture instancie deux PNJ au lieu d'un, « absent ≠ vide » n'est plus démontré (même doctrine que `confiance`).
