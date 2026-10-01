RISQUE
Le point de rupture est l'attente du clic « Lancer ». Sans arbitrage écrit, un dev-lot rangera la proposition de jet dans `session.attente` par réflexe, par analogie avec `AttenteClarification` — ouvrant une union gardée fermée exprès, et risquant KR-013 si le hook la miroite aussi.

OBJECTION
Le goal ne dit pas qui écrit `EntreeJournal.jet`, qui classe l'amorce qualitative, ni où vit l'état « jet proposé, en attente du clic ». Sans ces trois réponses écrites, trois agents du même essaim improviseront trois réponses différentes — exactement le mode de panne que la skill nomme.

PROPOSITION
1. L'état « jet proposé » reste éphémère, dans un `useState` de `useTourDeJeu` — jamais `session.attente` : aucun rôle IA ne le relit au tour suivant, contrairement à la clarification (dont les deux raisons de rester dans la session — réinjection au tour suivant, persistance de l'attente — ne tiennent pas ici). Le hook expose `carteJet: PropositionJet | null` et `lancerLeDe(): Promise<void>`.
2. `brain/dossier/arbitre.ts` (nouveau) porte le gate pur `doitArbitrer(commande, session): boolean`, la classification `reussit`/`echoue`, et l'écrivain unique de `EntreeJournal.jet`.
3. Prédicat anti-tutoiement sur `enjeu_reussite`/`enjeu_echec` : REJETÉ cette itération. Aucun des huit rôles existants, y compris `narrateur` (`recit`, tout aussi lu par le joueur), n'a de garde de registre validée — seule l'invite persuade. L'ajouter ici seul créerait une incohérence entre rôles frères (famille KR-079), pas un durcissement cohérent.
4. Deux lots : `contrat` (brain/+worker/, seul, premier) puis `feature` (play-mode, séquentiel). La coupure orchestration/UI à l'intérieur de play-mode ne vaut pas un troisième lot — couplage trop fin pour un essaim (un seul consommateur réel de `carteJet`/`lancerLeDe`).

VERDICT
Recevable sous réserve — que l'interface `useTourDeJeu` (`carteJet`, `lancerLeDe`) et la non-ouverture de `session.attente` soient écrites noir sur blanc dans le plan avant l'essaim.

---

## ANNEXE — DÉCOUPAGE EN LOTS (hors quota de mots)

**Lot 1 — `contrat`** (brain/ + worker/), seul, exécuté en premier.

Fichiers créés (N) / remplacés (R) :
- R `src/brain/CopiloteService.ts` — 9e branche `CibleArbitre`/`ReponseArbitre` (surcharge publique + implémentation + `CorpsDemande`), garde `never` étendue aux 9 rôles.
- N `src/brain/copilote/contexte/arbitre.ts` — `assemblerArbitre(dossier, cible)` : lit UNIQUEMENT `lieu.description` + `lieu.dangers?` (contexte optionnel) ; ne lit JAMAIS `session.heros` — invariant testé par `copilote/contexte.test.ts`.
- R `src/brain/copilote/contexte/narrateur.ts` — étend l'assembleur R3 pour dériver la classification qualitative du jet résolu depuis `EntreeJournal.jet` du tour courant, jamais les chiffres (marge, tc, dés).
- R `src/brain/copilote/contexte/index.ts` — barrel, export `assemblerArbitre`.
- R `src/brain/copilote/schemaSortie.ts` — `validerArbitre(brut, dossier)` : forme `{jet:{carac,tc,pourquoi,enjeu_reussite,enjeu_echec}} | {sans_jet:true}` ; `carac` constaté par appartenance à `CHARACTERISTICS`, `tc` à `CHALLENGE_TIERS`, zéro clé commune avec les 8 formes réseau existantes (KR-231).
- R (au choix du dev-contrat, à figer une fois posé) `src/brain/copilote/types.ts` — si `CibleArbitre`/`ReponseArbitre`/`PropositionJet` y sont déclarés, précédent `CibleNarrateur`.
- R `src/brain/dossier/alea.ts` — `DomaineAlea` élargi de `'heros'` à `'heros' | 'jet'`, aucune autre modification de signature (`alea`/`creerRng` figés à l'it1).
- R `src/brain/dossier/session.ts` — `EntreeJournal.jet?: { readonly lieu_id: string; readonly carac: string; readonly tc: string }` (KR-248 étendu, hors prose/marge/issue) + fonction unique d'écriture (`consignerJet`, précédent `fixerHeros`/`consignerNarration`).
- N `src/brain/dossier/arbitre.ts` — `doitArbitrer(commande, session): boolean` (gate pur sur structure, jamais sur contenu de `dangers`) + classification `reussit`/`echoue` depuis `ChallengeResult.success`.
- R `src/brain/index.ts` — barrel, export des types/fonctions neufs consommés par play-mode.
- R `worker/index.ts` — `INVITES['arbitre']` + `GABARIT_SORTIE['arbitre']` (9e entrée, checklist KR-233 inchangée : plafond d'octets, garde 413, 405, 404 rôle inconnu, 503 amont non configuré, JSON) ; `INVITES['narrateur']` amendé pour recevoir en contexte la classification de jet (aucune nouvelle clé de sortie côté narrateur).
- R `worker/index.test.ts`, `worker/frontiere.test.ts` — parité de route et balayage de mots interdits, 9e rôle.
- R/N tests du lot : `schemaSortie.test.ts`, `alea.test.ts` (domaine `'jet'`), `session.test.ts` (`consignerJet`), `copilote/contexte/arbitre.test.ts`, `copilote/contexte.test.ts` (invariance : héros jamais injecté dans le contexte arbitre, quelle que soit la session).

Interface figée par ce lot (point de rendez-vous de l'essaim) :
```ts
// CopiloteService.ts
demander(dossier: Dossier, cible: CibleArbitre, signal?: AbortSignal): Promise<ReponseArbitre>
interface CibleArbitre { role: 'arbitre'; lieuId: string }
type ReponseArbitre = { statut: 'propose'; proposition: PropositionJet } | EchecCopilote
type PropositionJet =
  | { jet: { carac: string; tc: string; pourquoi: string; enjeu_reussite: string; enjeu_echec: string } }
  | { sans_jet: true }

// brain/dossier/arbitre.ts
function doitArbitrer(commande: Commande, session: EtatSession): boolean
// true ssi commande.commande === 'agir' && session.heros !== undefined — jamais sur dangers.

// brain/dossier/session.ts
function consignerJet(session: EtatSession, tour: number, jet: { lieu_id: string; carac: string; tc: string }): EtatSession
// seule porte d'écriture de EntreeJournal.jet.

// brain/dossier/alea.ts
type DomaineAlea = 'heros' | 'jet'
```

**Lot 2 — `feature`** (`play-mode`), démarre contrat figé, séquentiel après le lot 1 (pas de parallélisme : couplage trop fin pour le justifier).

Fichiers :
- R `src/features/play-mode/hooks/useTourDeJeu.ts` — dans `executeAction`, après persistance de R1, si `doitArbitrer(commande, nouvelleSession)` : appelle R2, range la proposition dans un `useState` local `carteJet` (PAS dans `session`), n'appelle PAS R3 immédiatement. Nouvelle fonction exposée `lancerLeDe()` : appelle `resolveChallenge` avec `creerRng(session.graine_alea, 'jet', indice)`, écrit `EntreeJournal.jet` via `consignerJet`, appelle R3 avec le contexte classifié, vide `carteJet`, persiste. Verrou de tour (`lockedRef`) étendu sur toute la chaîne R1→exécution→R2→attente du clic→resolveChallenge→R3 (KR-265) : le verrou reste posé PENDANT l'attente du clic (aucune autre commande ne doit pouvoir partir tant que la carte est affichée).
- N `src/features/play-mode/components/CarteJet.tsx` — composant de présentation pur : lit `carteJet` + reçoit `onLancer: () => void` en props, aucun import de `CopiloteService`, suit le `design_contract.carte_jet` de la spec (CardHead, Badge réutilisé, pas d'OutcomeBlock propre, récit par le canal existant).
- R `src/features/play-mode/components/EcranPartie.tsx` — montage conditionnel de `CarteJet` quand `carteJet !== null`, inline (pas de `useEffect`, KR-013).
- Tests : `useTourDeJeu.test.ts`, `CarteJet.test.tsx`, régression `EcranPartie`. **Aucune modification attendue de `moteurSansIA.test.ts`** — l'exemption nommée reste `useTourDeJeu.ts` seul, puisque `CarteJet.tsx`/`EcranPartie.tsx` n'importent jamais `CopiloteService` (satisfait le critère d'acceptation 8 / KR-260).

Interface exposée par `useTourDeJeu` (nouveau, consommée telle quelle par `EcranPartie`/`CarteJet`) :
```ts
interface UseTourDeJeuResult {
  // ...champs existants (executeAction, getGestelabel, avis, isLocked, issueNarrateur, pasEnCours)
  readonly carteJet: { carac: string; tc: string; pourquoi: string; enjeuReussite: string; enjeuEchec: string } | null
  readonly lancerLeDe: () => Promise<void>
}
```

Note de dimensionnement : si le comité préfère scinder le lot 2 en deux (orchestration `useTourDeJeu.ts` vs UI `CarteJet.tsx`/`EcranPartie.tsx`) pour paralléliser, la signature `UseTourDeJeuResult` ci-dessus devrait alors migrer dans le lot `contrat` pour rester un point de rendez-vous figé avant l'essaim. Pas recommandé pour cette itération : `carteJet`/`lancerLeDe` n'ont qu'un seul consommateur réel (`EcranPartie`), et figer leur signature comme contrat relèverait de l'abstraction à un seul appelant que la skill met en garde contre.

---

Fichiers de code lus pour cette analyse : `src/features/moteur-arbitre/specification.json`, `src/brain/CopiloteService.ts`, `src/brain/dossier/session.ts`, `src/brain/dossier/alea.ts`, `src/features/play-mode/hooks/useTourDeJeu.ts`, `src/brain/dossier/commandes.ts` (lignes 250-370, TRANSITIONS.agir), `worker/index.ts` (lignes 1-657, INVITES/GABARIT_SORTIE), `src/brain/copilote/types.ts`, `src/brain/challenge.ts` (signature `resolveChallenge`), `src/features/play-mode/tests/moteurSansIA.test.ts` (liste d'exclusion KR-260).

Point notable : `TRANSITIONS.agir` dans `commandes.ts` n'a probablement PAS besoin d'être modifié par cette itération — c'est un réducteur pur synchrone (tour+journal seulement, aucun jet) et le routage vers R2 est une décision d'orchestration asynchrone qui vit dans `useTourDeJeu.ts` (via le nouveau `doitArbitrer`), exactement symétrique à la façon dont R3 est aujourd'hui déclenché après persistance de R1 plutôt que depuis `commandes.ts`. À confirmer par le comité mais c'est ce qui réduit le risque de collision de fichier avec d'éventuels autres lots touchant `commandes.ts`.
