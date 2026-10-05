# Tech Lead, tour 1, moteur-horloge it1

**RISQUE**
Le tick crée un deuxième lecteur de `.declencheur_expr` dans `brain/dossier/`. `evaluate.test.ts:706` (`['evaluate.ts']`, KR-246) rougit. De plus, `EtatPnj` aura trois écrivains : `crediterConfiance`, `avecIndiceConfie` et le tick. Précédent n° 12 it3 : un littéral destructeur.

**OBJECTION**
1. AC1 (« durée échue ⇒ avance ») contredit AC2, `types.ts:433` et `validate.ts:724`. Là, durée échue ⇒ *bloqué*, sinon `si_bloque` est inatteignable. Tant que c'est ouvert, aucune table de vérité n'est testable.
2. KR-249 : `depuis` n'a aucun lecteur de production en it1, puisque le bandeau arrive en it2.
3. La ligne de journal du tick ne doit porter ni `origine` ni `deltas`. `ligneDuPas` (`narrateur.ts:444`) et `consignerJet` (`session.ts:644`) sélectionnent sur `origine`, et `duPas` (`narrateur.ts:587`) lit `deltas`.
4. Le cadrage est incomplet : `session-saturee.ts` et `sessionCouverture.test.ts` (comptes `pnj`) rougissent sans mise à jour.

**PROPOSITION**
- Sélecteur `etapeDeclenchee` dans `evaluate.ts` (précédent `evenementARencontrer`). `horloge.ts` n'ouvre jamais un `ExprNode` (garde `expr.test.ts`). Attention, `evaluerExpr(faits, noeud)` a l'ordre inverse de celui du cadrage.
- Avance ⇔ le déclencheur de `plan_actions[rang+1]` est vrai. Un déclencheur absent n'entre jamais automatiquement (règle jalons/événements). Au plus une étape par pas.
- Une ligne « bloqué » quand `tour − depuis === duree` : c'est le lecteur de `depuis`.
- Test croisé des trois écrivains. Ligne d'identifiants seuls.
- `session.ts` (>800 lignes) reste intouché.

**VERDICT**
CHANGES REQUESTED. Un seul lot `contrat`, aucun lot feature.

---

## ANNEXE, découpage en lots (hors quota)

Un seul lot. Tout fichier touché est sous `brain/` ou `docs/`, et l'itération n'a aucune UI. Il n'y a donc ni lot feature ni parallélisme à révéler : exécution séquentielle, sans worktree ni fusion. Deux lots `contrat` successifs seraient séquentiels de toute façon. Ils laisseraient aussi le premier (type + audience sans écrivain) en violation de KR-249 le temps d'un lot.

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

**Interfaces, dans l'ordre d'exécution du lot**
- `faits.ts` ajoute à `EtatPnj` : `readonly etape_plan?: { readonly rang: number; readonly depuis: number }`. `rang` est l'index dans `plan_actions[]`, jamais un tri sur `etape`. Le champ est optionnel à vie. `faits.ts` n'importe toujours rien (garde `evaluate.test.ts`).
- `sessionDestinations.ts` ajoute deux chemins à `CheminDeFeuilleDeSession` : `'monde.pnj.<id>.etape_plan.rang'` et `'monde.pnj.<id>.etape_plan.depuis'`. Les deux valent `'moteur'`.
- La fixture instancie `etape_plan` sur un PNJ.
- `sessionCouverture.test.ts` recalcule ses comptes. Valeurs attendues, à vérifier depuis la doc et non depuis le rouge : feuilles brutes de `monde.pnj.` 3 → 5, normalisées 2 → 4, `LIGNES_ATTENDUES` `{ pnj: 4 }`.
- `evaluate.ts` exporte `etapeDeclenchee(faits: FaitsDeSession, etape: PlanAction): boolean`.
  - Un `declencheur_expr` absent rend `false`. Une condition inconnue lève (KR-238, aucun `catch`).
  - Il n'importe ni `session.ts` ni `commandes.ts`.
  - Il n'est pas exporté par `brain/index.ts`.
  - La ligne 706 de `evaluate.test.ts` reste `['evaluate.ts']`. Son test cible est dans ce fichier.
- `horloge.ts` exporte `tickHorloge(dossier: Dossier, session: EtatSession): EtatSession`.
  - Elle est pure et rend la même référence quand rien ne change.
  - Elle n'écrit que `monde.pnj[id].etape_plan` (spread de l'entrée existante, `{ a_dit: [] }` si absente) et des lignes de journal `role: 'moteur'`, à `tour = session.horloge.tour`.
  - Ces lignes viennent après les lignes de jalons et ne portent aucun champ `origine`, `deltas`, `recit`, `jet` ni `interlocuteur`.
  - Elle ne lit que `plan_actions[]` (tableau, `.duree`) et `etapeDeclenchee`. Elle n'inspecte jamais `.op`.
  - Elle ne touche ni `horloge`, ni `heros`, ni `combat`.
  - Le texte de la ligne est composé d'identifiants et d'un rang seulement, jamais de `nom`, `action` ou `si_bloque`.
  - Elle n'est pas exportée par `brain/index.ts`.
- `commandes.ts` : `executerCommande(dossier, session, commande): ResultatCommande` garde sa signature. Le bras ok devient `{ ok: true, session: tickHorloge(dossier, avecJalonsResolus(dossier, resultat.session)) }`. La docstring de totalité doit être étendue aux déclencheurs de plan.

**Tests exigés dans le lot**
- Table de vérité de J2 (déclencheur vrai/faux, absent, dernier rang, bloqué à égalité exacte, un seul pas par tick).
- Croisé `crediterConfiance` + `consignerReponseActeur` + tick, dans les deux ordres : `a_dit`, `confiance` et `etape_plan` survivent.
- Tick no-op ⇒ `toBe(session)`.
- La couture : refus ⇒ aucun tick ; combat ⇒ refusé avant tout tick.
- Une ligne de tick n'est jamais « porteuse » pour `ligneDuPas` ni `consignerJet`.
- Le contexte R3 reste octet-identique pour un pas dont le tick écrit.

**Porte du lot** : Prettier, `tsc --noEmit`, ESLint, jest complet. Les gardes à relire explicitement : `evaluate.test.ts` (706 et « faits.ts n'importe RIEN »), `expr.test.ts` (recensement des lecteurs), `moteurSansIA.test.ts` (`horloge.ts` est scanné), `sessionCouverture.test.ts`, `deltas.test.ts` (aucun `DELTAS[...]` hors `evaluate.ts` et `validate.ts`).

**Hors lot, étape 4 du build, écrits par l'orchestrateur après la porte** : `specification.json`, `code-knowledge.json`, roadmap, CHANGELOG, `features_history.json`, README.
- Marge de `code-knowledge.json` : 4 octets sous 70 kio. Tout KR ajouté impose une compaction dans le même lot de doc.

**Non touchés, par conception** : `session.ts` (dette n° 13, >800 lignes, extraction absorbée par it3), `types.ts`, `destinations.ts`, `validate.ts`, `brain/index.ts`, toute feature.
