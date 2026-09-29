## Note de tour 1 — Tech Lead — `moteur-interprete` it2

**RISQUE** — R3 double la fenêtre réseau (jusqu'à 2 × 45 s). Pendant ce temps, la console, qui n'est pas sous le verrou, peut accepter un pas. `useTourDeJeu` l'écrasera ensuite avec S1 et S2, calculés sur la session d'avant la soumission. C'est BUG-131 : il a été corrigé entre deux soumissions, jamais pendant le vol.

Autre point : R3 ne peut vivre que dans `useTourDeJeu`, car un seul verrou KR-265 doit couvrir R1 → exécution → R3. L'« exclusion étendue au nouveau fichier » du critère #10 n'a donc pas de fichier à exclure. Or le garde ne voit pas l'accès réel `copilote.demander(`. L'exclusion actuelle ne tient qu'au mot `CopiloteService` écrit dans une docstring (constaté à la lecture, jest non exécuté).

**OBJECTION** —
1. Pas de ligne `memoire.faits_etablis` en it2 : `memoire` est typée `null`, la ligne serait morte et anticiperait it3.
2. La forme `{recit, faits_etablis, suggestions}` viole KR-231 : ses clés réseau portent les noms de leurs champs de destination (`EntreeJournal.recit`, `memoire.faits_etablis`). La forme résolue ne peut alors plus s'en distinguer.
3. L'invite `interprete` exige « un ou plusieurs lieux ». Sans amendement, `agir` (zéro repère) est inatteignable, et le critère #5 avec lui.

**PROPOSITION** — Deux lots, exécutés l'un après l'autre.
- R3 est appelé dans le même `try` que R1, juste après `onSessionChange(S1)`. La console est refusée tant que le pas est en cours.
- L'issue et les deltas du pas se lisent dans `S1.journal` au tour courant ; ils ne sont jamais passés en paramètre à côté (KR-013).
- `consignerRecit(session, tour, recit)` est une fonction pure dans `brain/dossier/`. Elle pose le récit sur l'entrée qui porte `origine` pour ce tour-là.
- `journal[].recit` reste `moteur` en it2 : aucun assembleur ne la lit.
- Garde : un quatrième motif `.demander(`, cherché sur la source sans commentaires, avec son mutant.

**VERDICT** — recevable sous réserve de (1), (2), (3) et du verrou partagé console + champ libre.

---

## ANNEXE

### A. Vérifications demandées

**Garde `never`.** `narrateur` s'ajoute comme les sept rôles existants :
- une `CibleNarrateur` ;
- un membre littéral `{ role: 'narrateur'; contexte: string }` dans `CorpsDemande` (jamais `{...cible, contexte}`) ;
- la 8ᵉ surcharge **aux deux endroits** (l'interface et l'implémentation) ;
- l'union élargie en paramètre et en retour ;
- un `case 'narrateur'` dans le `switch`.

`RoleCopilote` n'est **pas** étendu, comme pour `interprete`. `ROLES_AUTEUR` de `worker/frontiere.test.ts` filtre sur `BUDGET_CARACTERES_CONTEXTE`, donc `narrateur` en est exclu automatiquement. Il lui faut un `describe` « hors parité » calqué sur celui d'`interprete`, avec l'extraction `^\tnarrateur: '(.+)',$` (Prettier retire les guillemets de la clé).

**KR-013.**
- `recit` n'est pas dérivable : c'est une sortie de modèle, absente du chemin de rejeu (critère #12).
- Les suggestions sont un état du hook, jamais de la session.
- Les faits ne sont persistés nulle part en it2.
- La projection d'`EtatMonde` est calculée dans l'assembleur.
- Seul risque de dérivable : passer l'issue ou les deltas par la cible. C'est rejeté (voir D2).

**Isolation.** Tout ce qui est neuf passe par le baril `brain/index.ts`. La dette existante — l'import profond de `COMMANDES` par `useTourDeJeu`, avec son exclusion nommée dans `commandes.test.ts` — n'est pas rouverte. Le libellé d'`agir` y transitera.

**Encapsulation.**
- Les Chips sont rendues par `PlayerInputBar`, qui possède l'état `saisie`. Jamais par `EcranPartie` allant remplir le champ d'un autre composant.
- Le récit réutilise `OutcomeBlock` tel quel. L'axe `variant` entre avec le jet (n° 11, décision D-18).

### B. Conséquences mécaniques du Lot 1 (mesurées dans le code)

- **Court-circuit devenu du code mort.** `gesteSatisfiable('agir')` vaut `[].every(...)`, donc toujours `true`. Le court-circuit `tables.gestes.size === 0` de `CopiloteService.demanderInterprete` devient inatteignable.
  - À retirer : la branche et ses deux tests (`CopiloteService.test.ts:2056`, `contexte.test.ts:2820`).
  - À réécrire : « impasse → le geste `agir` est rangé, et le `fetch` part ».
  - `contexte.test.ts:2767` passe de `['G1']` à `['G1','G2']`.
- **`commandes.test.ts`** : les messages des lignes 291–339 passent de « ALLER » à « ALLER, AGIR », et l'assertion `Object.keys(COMMANDES)` de la ligne 337 change.
- **`worker/index.test.ts:1283`** : la liste `interdits` est écrite à la main. Je propose de la dériver de `COMMANDES` (id, verbe, libellé) : les tests worker importent déjà `src/brain` (précédent `frontiere.test.ts`). Mutant : un verbe dont le libellé figure dans l'invite doit faire rougir le test.
- **`TRANSITIONS.agir`** : `horloge +1`, une entrée joueur `> AGIR`, une entrée moteur avec `origine: 'agir'`.
  - Témoin : `resultat.session.monde` **toBe** `session.monde` (même référence). `toEqual` laisserait passer une copie.
- **`consignerRecit`** :
  - Invariant : `journal.every(e => e.recit === undefined || e.origine !== undefined)`.
  - `monde`, `horloge`, `attente` et toutes les autres entrées gardent la même référence.
  - Si aucune entrée ne porte d'`origine` pour ce tour, la session est rendue telle quelle.
  - **Scénario séparateur obligatoire** : un `aller` qui franchit un jalon, donc des entrées de jalon *après* l'entrée d'`origine`. Une implémentation « dernière entrée » y diverge.
- **Validateur.** Un seul fait sans ancrage fait refuser **toute** la sortie (KR-230), puis rejeu, puis dégradation.
- **Table des rangs.** Produite une seule fois par `assemblerNarrateur`, consultée par le validateur (`has`) et par la re-résolution (`get`) : la même paire, jamais re-dérivée ni exportée (précédent `TablesInterprete`).
- **`porteUnRang`.** Il a désormais deux appelants : on le généralise à un ensemble de clés au lieu d'écrire un second scanner.
- **Plafond du corps worker.** `narrateur` n'a pas de budget client en it2. Une scène chargée peut dépasser `TAILLE_MAX_CORPS_IA` (53 248 o) : le worker répond 413, que le client classe `injoignable`, et le joueur voit « indisponible » au lieu de `trop-long`.
  - Proposition : un plafond nommé dans `contexte/narrateur.ts`, avec 3 × plafond + E ≤ 53 248, un refus `trop-long` avant tout `fetch`, et la couverture étendue dans `frontiere.test.ts`.
  - it4 absorbe ce plafond dans la constante unique de KR-261 ; ce n'est jamais une seconde constante.

### C. Notes pour le Lot 2

- **Ordre dans le hook** : R1 → `apresInterpretation` → `onSessionChange(S1)` → si `avis.type === 'aucun'`, appel `demander(narrateur, {session: S1})` → en cas de succès, `onSessionChange(consignerRecit(S1, S1.horloge.tour, recit))` → en cas d'échec, message fixe de dégradation → déverrouillage dans le `finally`.
- **Témoin « persisté avant R3 »** : R3 ne se résout jamais, et `sessions.ecrire` a pourtant reçu S1.
- **Affichage du récit** : il est dérivé de `session.journal` (l'entrée du tour courant qui porte `recit`). Jamais un `useState(recit)` dans le hook.
- **Verrou pour la console** : le hook expose `pasEnCours(): boolean`, qui lit `lockedRef`. `handleSoumettreConsole` refuse quand il vaut `true`.
  - Témoin : une commande console soumise pendant que R3 est en attente n'est jamais perdue en silence.
- **Défaut latent de l'it1, même famille (fermeture périmée)** : `PlayerInputBar.handleSubmit` lit `avis` dans la fermeture du rendu d'avant la soumission. Le champ se vide donc selon l'avis du tour **précédent**. À corriger dans ce lot.
- **`moteurSansIA.test.ts`** :
  - La liste d'exclusion reste `[useTourDeJeu.ts]`.
  - Ajout d'un motif `/\.demander\s*\(/` appliqué à la source sans commentaires (précédent `sansCommentaires` de `commandes.test.ts`). `\bcopilote\b` est écarté : il donne un faux positif sur le chemin d'import de `interprete.ts:32`.
  - Les trois motifs existants restent appliqués sur la source brute.
  - Mutants : ôter `useTourDeJeu` de la liste *et* sa docstring doit faire rougir le test ; ajouter `copilote.demander(` dans `PlayerInputBar` aussi.
- **Code mort côté écran** : `TEXTE_IMPASSE` de `PlayerInputBar` devient inatteignable (`gestes_possibles` n'est jamais vide avec `agir`). À retirer, ou à garder avec un motif écrit ; c'est à l'UX de trancher.

### D. Alternatives REJETÉES (à recopier au § 8)

1. **R3 dans un hook séparé** (`useRecit.ts`) pour donner un fichier à l'exclusion du critère #10 : cela fait deux verrous, ou un verrou partagé exposé entre hooks. KR-265 veut un seul pas en cours de R1 à R3.
2. **`CibleNarrateur.issue` / `.deltas` passés par le hook** : ce serait une seconde source de ce que `S1.journal` dit déjà (KR-013), qui divergerait sur un pas à jalons.
3. **Récit posé sur une entrée de journal neuve (`role: 'narrateur'`)** : rouvre le registre fermé `RoleJournal`, exige un `texte` vide ou dupliqué, et `JournalRow` afficherait une ligne vide.
4. **Stocker les faits en it2 (`EntreeJournal.faits?`)** : c'est un chemin de traverse qui fige la forme de `memoire` avant it3, et c'est irréversible (KR-251).
5. **Ligne `memoire.faits_etablis` en it2** : `memoire` vaut `null`, la ligne serait morte, et le `@ts-expect-error` de `sessionCouverture.test.ts` l'interdit.
6. **`useState(recit)` dans le hook** : un miroir de la session (KR-013, BUG-131).
7. **Chips rendues par `EcranPartie`** : il faudrait un handle ou une recherche DOM dans un composant qu'on ne possède pas (Encapsulation).
8. **`BlocRecit.tsx` ou un `variant` sur `OutcomeBlock`** : abstraction sans second appelant.
9. **Deux lots contrat (`agir` / R3)** : ils partageraient `CopiloteService.ts` et son test, `contexte.test.ts`, `worker/index.ts` et son test.
10. **Un lot dédié à `Chip`** : son seul consommateur est dans le Lot 2 ; le coût de fusion dépasserait le gain.
11. **Étendre `RoleCopilote` à `narrateur`** : précédent `interprete` (les trois registres + `frontiere.test.ts`).
12. **Filtrer les faits non ancrés et garder le reste** : réparation silencieuse et second décideur (KR-230).
13. **Garder le court-circuit « par défense »** : il est inatteignable par construction ; ce serait du code mort présenté comme de la couverture (KR-235).

### E. Découpage en lots

Chemins relatifs à `C:\Users\pierr\Desktop\genliv\`. N = créé, R = remplacé.

| Lot | Type | Fichiers | Expose / consomme | Porte qualité seule |
|---|---|---|---|---|
| **1 `narrateur-contrat`** | contrat, seul, en premier | `src/brain/dossier/commandes.ts` R · `src/brain/dossier/commandes.test.ts` R · `src/brain/dossier/session.ts` R · `src/brain/dossier/sessionDestinations.ts` R · `src/brain/dossier/__fixtures__/session-saturee.ts` R · `src/brain/dossier/sessionCouverture.test.ts` R · `src/brain/dossier/recit.ts` N · `src/brain/dossier/recit.test.ts` N · `src/brain/copilote/types.ts` R · `src/brain/copilote/schemaSortie.ts` R · `src/brain/copilote/schemaSortie.test.ts` R (mutant « fait sans sur » vérifié ROUGE) · `src/brain/copilote/contexte/narrateur.ts` N · `src/brain/copilote/contexte/index.ts` R · `src/brain/copilote/contexte.test.ts` R · `src/brain/CopiloteService.ts` R · `src/brain/CopiloteService.test.ts` R · `src/brain/index.ts` R · `worker/index.ts` R (invites `narrateur` + amendement `interprete`) · `worker/index.test.ts` R · `worker/frontiere.test.ts` R | Expose les signatures ci-dessous | Oui : aucun test `play-mode` n'asserte le seul verbe `ALLER` en réel (vérifié : `consoleCommandes.test.tsx` passe par un harnais local) |
| **2 `narrateur-feature`** | feature, contrat figé | `src/features/play-mode/hooks/useTourDeJeu.ts` R · `src/features/play-mode/hooks/useTourDeJeu.test.ts` R · `src/features/play-mode/components/PlayerInputBar.tsx` R · `src/features/play-mode/components/PlayerInputBar.test.tsx` R · `src/features/play-mode/components/Chip.tsx` N · `src/features/play-mode/components/Chip.test.tsx` N · `src/features/play-mode/components/EcranPartie.tsx` R · `src/features/play-mode/tests/verrouDeTour.test.tsx` N · `src/features/play-mode/tests/moteurSansIA.test.ts` R | Consomme le Lot 1 comme une donnée immuable | Oui |

Deux lots sur une tranche verticale : l'exécution est séquentielle, sans worktree ni fusion.

**Signatures exposées par le Lot 1** — le seul point de rendez-vous entre les deux lots. Les noms des clés réseau restent à arbitrer par narratif-ia ; l'invariant, lui, ne se négocie pas.

```ts
interface CibleNarrateur { role: 'narrateur'; saisie: string; session: EtatSession } // session = S1, après exécution
type ReponseNarrateur = { statut: 'propose'; proposition: PropositionNarrateur } | EchecCopilote
demander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal): Promise<ReponseNarrateur> // 8e surcharge, deux sites
interface PropositionNarrateur { readonly recit: string; readonly suggestions: readonly string[]; readonly etablis: readonly FaitAncre[] }
interface FaitAncre { readonly enonce: string; readonly ancres: readonly string[] } // identifiants résolus, au moins un
// réseau, non exporté : { narration, faits: [{ fait, sur: RangInjecte[] }], relances } — aucune clé commune avec la forme résolue
function consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession
EntreeJournal.recit?: string              // optionnel à vie ; audience 'moteur' en it2
COMMANDES.agir = { label: <texte UX/narratif>, verbe: 'AGIR', refKinds: [] }
AvisInterprete // inchangée ; 'aucun' signifie « commande acceptée », donc R3 est appelé (docstring amendée)
```

### Décisions prises en autonomie faute de spécification

- Quelle entrée du journal porte `recit` → l'entrée qui porte `origine` pour ce tour → si c'était une entrée neuve : `RoleJournal` rouvert, et `JournalRow`, la fixture et la sémantique de `journal[].role` à reprendre, soit environ 4 fichiers de plus au contrat.
- Audience de `journal[].recit` en it2 → `moteur` (précédent `texte_ouverture_joueur` : émis mot pour mot, jamais injecté) ; le passage à `ia` revient à it3, qui devra traiter la saisie du joueur blanchie par R3 (KR-248) → si c'était `ia` : une autorisation dormante, et un assembleur obligé de la lire, c'est-à-dire une politique de rétention qui appartient à it3.
- Console pendant un pas en vol → refusée → si elle reste ouverte : S1 est calculé sur la session d'avant la soumission, donc une perte silencieuse reste possible même avec un `setState` fonctionnel.
- R3 sur les commandes console → non (registre développeur) → si oui : un second appelant hors exclusion, et un verrou partagé entre deux composants.
- `etablis` présent dans `PropositionNarrateur` dès it2 (lecteur nommé : it3) → oui → sinon it3 ajoute un membre requis, et les mocks de la feature cassent `tsc` pendant le seul lot contrat d'it3.
- Fait non ancré → toute la sortie est refusée → si le refus est par élément : second décideur et réparation silencieuse.
- `AvisInterprete` `'aucun'` → non renommé → sinon, du remaniement sans gain dans `types.ts`, `interprete.ts`, 3 tests et `PlayerInputBar`.
- Texte d'impasse de `ConsoleCommandes` (« aucune commande à proposer », devenu faux avec `AGIR`) → REPORTÉ en `open_questions` → si corrigé ici : 2 fichiers de plus au Lot 2.
- Plafond de contexte de `narrateur` → posé en it2 sous un nom, absorbé par KR-261 en it4 → sinon un 413 silencieux, affiché comme « indisponible ».
