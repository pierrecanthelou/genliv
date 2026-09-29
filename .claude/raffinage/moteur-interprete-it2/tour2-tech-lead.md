## Note de tour 2 — Tech Lead — `moteur-interprete` it2

Aucun fichier n'a été modifié et aucun test n'a été lancé. Les chiffres ci-dessous viennent de la lecture du code.

### RÉPONSE AUX OBJECTIONS

**1. PM — retirer la `Chip` cliquable : recevable.**

Ce retrait ne change aucune ligne du Lot 1. Aucun type, service ni invite ne connaît la Chip : la re-soumission au clic n'est qu'un `executeAction(texte)` côté feature. Son report ne crée donc aucune dette de contrat pour it3. Mon alternative rejetée n° 10 visait un *lot dédié*, pas le périmètre : il n'y a pas de contradiction.

`suggestions[]` garde un vrai consommateur testé : un rendu en texte simple dans `PlayerInputBar`. Trois scénarios RTL le séparent d'une implémentation fautive :
- les suggestions s'affichent sous le récit quand `issue.tour === session.horloge.tour` ;
- rien ne s'affiche quand la liste est vide (aucun conteneur vide) ni en cas d'échec de R3 ;
- elles disparaissent après un pas joué depuis la console, parce qu'elles sont alors périmées.

Le contrat (0 à 3 suggestions, 60 caractères au plus, distinctes, sans identifiant) reste tenu par `schemaSortie.test.ts`, quel que soit l'affichage.

Effet sur les lots : le Lot 2 perd deux fichiers (`Chip.tsx` et `Chip.test.tsx`), pas un. On reste à deux lots. La ligne `design_contract.suggestions` doit être amendée par écrit, avec un report nommé à it3.

Une remarque pour le PM, sans veto : si une suggestion qu'on ne peut pas cliquer n'a aucune valeur produit, reporter `tentatives` en bloc à it3 est tout aussi propre. it3 rouvre de toute façon le gabarit, le validateur et l'invite pour les faits, donc le coût y serait nul. La règle ESLint « racine `button` » proposée par l'UX devient sans objet, et elle était de toute façon rejetée : une règle pour un seul fichier, c'est une abstraction à un seul appelant.

**2. `etablis` : il entre en it3. Je retire ma décision prise en autonomie.** Trois raisons :
- **Aucun lecteur en it2.** C'est exactement le biais que je dois surveiller.
- **Un bon récit serait perdu.** Avec le refus en bloc (KR-230), un fait non ancré que personne ne lit ferait refuser, rejouer, puis dégrader un récit sain. Le joueur perdrait son récit pour une donnée morte.
- **Il faudrait injecter des rangs pour rien.** Ancrer les faits oblige à injecter des rangs dans R3, et donc à créer une table des rangs et à généraliser `porteUnRang`, pour un seul consommateur : ce validateur mort. narratif-ia n'injecte aucun rang, donc les deux disparaissent.

J'ai mesuré mon argument `tsc` : il était faux. Le mock `demanderMock = jest.fn()` n'est pas typé (`useTourDeJeu.test.ts:85`) ; le seul résolveur typé est celui de R1 (l. 114). En it3, le coût se limite à un littéral de test, à planifier au raffinage d'it3.

**Condition :** le plan it2 amende par écrit les textes suivants, au lieu de les réinterpréter :
- AC n° 6 (« rend {recit, faits_etablis[], suggestions[]} ») ;
- AC n° 7 (« dans le lot qui livre R3 ») ;
- la ligne `brain_contracts` du narrateur ;
- la ligne `sessionDestinations … memoire.faits_etablis`.

Le critère n° 7 et son mutant sont réattribués nommément au lot contrat d'it3. La réserve (2) de la QA — le type `Fait` et la table d'ancrage — passe à it3 ; elle n'est pas abandonnée.

**3. Nommage réseau : j'adopte `{narration, tentatives}` tel quel.**

Une précision : mon annexe E proposait déjà `{narration, faits, relances}` ; mon objection n° 2 visait la forme écrite dans la spec. J'ai vérifié que ni `narration` ni `tentatives` n'existe comme clé dans `src/` ou `worker/` : le seul `narration` trouvé est un mot de docstring, `worker/index.ts:526`.

Un seul ajustement : le type résolu s'appelle `SortieNarrateur`, pas `NarrationResolue`, pour suivre le précédent `InterpretationRendue` / `SortieInterprete`. `NarrationRendue` n'est pas ré-exporté par `brain/index.ts`, comme en l. 194-199.

**4. QA — qui orchestre : oui, ma proposition de tour 1 suffit.** Les deux phrases à inscrire au plan :

> `useTourDeJeu` est le seul orchestrateur du pas : R1 → `apresInterpretation` → `onSessionChange(S1)` → si `avis.type === 'aucun'`, `demander(narrateur, {session: S1})` → `onSessionChange(consignerRecit(S1, S1.horloge.tour, recit))`. Tout se passe dans un seul `try`, sous un seul verrou KR-265 relâché dans le `finally`. Ni `executerCommande` ni la console n'appellent jamais R3 : `brain/dossier/` reste à zéro IA (KR-260).

Quatre corrections à l'annexe de la QA :
- **« Le payload contient une projection `EtatMonde` » : rejeté.** La cible porte `session: S1`, vérifié en `toBe` contre l'objet passé à `onSessionChange`. La projection est calculée dans l'assembleur et testée dans `contexte.test.ts`. La mettre dans la cible, c'est mon alternative rejetée D2 : une seconde source de vérité.
- **Nouveaux fichiers `moteurSansIA.extension.test.ts` et `validerNarrateur.test.ts` : rejetés.** Une garde vit dans un seul fichier. `brain/dossier/` est déjà sous interdiction totale, donc `recit.ts` est couvert sans ligne nouvelle. Les validateurs se testent dans `schemaSortie.test.ts`, comme `validerInterprete`.
- **« Pas de test du rendu, l'écran n'existe pas en it2 » : faux.** `PlayerInputBar` et `EcranPartie` sont livrés depuis it1, avec leurs tests RTL (`PlayerInputBar.test.tsx`, `deplacement.test.tsx`). L'affichage du récit se teste en RTL et doit l'être dans le Lot 2. Sinon, « le joueur lit » ne repose que sur le hook.
- **« Récit fixe » en dégradation : formulation rejetée.** Rien n'est écrit dans `recit`, et son absence est un état légal. L'échec s'affiche en bannière.

**5. Borne `trop-long` avant tout `fetch` : acceptée, et elle était déjà dans mon Lot 1** (annexe B de mon tour 1 ; it4 ne fait que l'absorber). J'adopte la mesure de narratif-ia :
- `BUDGET_CARACTERES_NARRATEUR` vit dans `contexte/narrateur.ts` et vaut `ceil(M×3/1000)×1000`, où M est le pire cas mesuré ; la mesure est citée en commentaire.
- Le refus passe par le `MotifRefusContexte` existant `'trop-long'` (`noyau.ts:33`), comme dans les six assembleurs d'auteur.
- `TAILLE_MAX_CORPS_IA` n'est pas une contrainte à part : il suit la formule en place, un maximum sur les rôles (`worker/index.ts:571`), et `narrateur` entre dans ce maximum.
- `frontiere.test.ts` étend `pireCasDe` **et** le calcul de `ROLE_LE_PLUS_LARGE` à `narrateur`. Sans ça, les deux tests séparateurs (l. 928-934) viseraient le mauvais rôle le jour où le narrateur devient le plus large.
- it4 fait de cette constante celle, unique, de KR-261 ; ce n'est jamais une seconde constante.

**Une divergence de plus, côté UX.** L'UX suppose que le récit arrive dans `avis`, via `avis.type === 'recit'` avec `avis.recit` et `avis.suggestions`. Ce n'est pas un simple renommage, et je le rejette pour deux raisons :
- un `useState(recit)` serait un miroir de la session (D6, BUG-131) ;
- un échec de R3 poussé dans `avis` tomberait dans la branche `'statut' in avis` (`PlayerInputBar.tsx:125`). L'écran afficherait alors `TEXTE_INDISPONIBLE`, exactement la confusion que l'UX interdit.

R3 a donc son propre canal, `issueNarrateur`, indexé par tour, et le récit se lit dans le journal. Je suis d'accord avec la bannière de dégradation et avec l'`OutcomeBlock` `RÉCIT` inchangé.

### STATUT DE MES OBJECTIONS DU TOUR 1

1. **Pas de ligne `memoire.faits_etablis` en it2 : maintenue et élargie.** C'est maintenant toute la chaîne des faits qui sort d'it2 : type, validateur, table des rangs et mutant n° 7. narratif-ia converge.
2. **KR-231 : levée.** Le réseau `{narration, tentatives}` devient `{recit, suggestions}` une fois résolu, sans aucune clé commune.
3. **Invite `interprete` : maintenue, avec le texte de narratif-ia.** « un geste et autant de repères de lieux que ce geste en demande, aucun s'il n'en demande pas ». Aucune phrase propre à `agir`. Elle est livrée dans le Lot 1, sinon le critère n° 5 reste inatteignable.

Ma réserve sur le verrou partagé entre la console et le champ libre est **maintenue**.

### VERDICT

**Recevable sous réserve** de quatre points :
- **(a)** La console est refusée tant qu'un pas est en cours, et le refus est visible via la prop `refus` existante : jamais une perte silencieuse.
- **(b)** L'invite `interprete` est amendée dans le Lot 1.
- **(c)** Les critères n° 6 et n° 7, `design_contract.suggestions` et les deux lignes `brain_contracts` sont amendés par écrit dans le plan it2.
- **(d)** L'issue de R3 ne passe jamais par `avis`.

Pas de veto : aucun import croisé, aucune seconde source de vérité, et la persistance reste `onSessionChange` → `useSessionPersistee`, inchangée.

---

## ANNEXE

### Ce qui change par rapport au tour 1

**Lot 1** — les 20 mêmes fichiers ; seul leur contenu change.
- Retirés : `FaitAncre`, `PropositionNarrateur.etablis`, la table des rangs, la généralisation de `porteUnRang` (elle n'a plus de second appelant) et le mutant « fait sans `sur` ». Tout cela passe à it3.
- Ajoutés :
  - `BUDGET_CARACTERES_NARRATEUR` avec les refus `trop-long` et `cible-a-ecrire` ;
  - `consignerRecit` gagne les conditions d'identité de narratif-ia ;
  - `PropositionNarrateur` est renommé `SortieNarrateur`, et la forme réseau devient `NarrationRendue {narration, tentatives}`.
- Mutants à voir ROUGES :
  - un « ? » final accepté ;
  - une 4ᵉ tentative acceptée ;
  - un récit écrit sur un tour périmé ;
  - un contexte de budget + 1 caractère accepté ;
  - un verbe de `COMMANDES` présent dans l'invite (`worker/index.test.ts`).

**Lot 2** — 7 fichiers au lieu de 9 : `Chip.tsx` et `Chip.test.tsx` sortent. Si le comité garde la Chip, ils reviennent tels quels et il y a toujours deux lots.

### Découpage en lots

Chemins relatifs à `C:\Users\pierr\Desktop\genliv\`. N = créé, R = remplacé.

| Lot | Type | Fichiers | Expose / consomme | Porte qualité seul |
|---|---|---|---|---|
| **1 `narrateur-contrat`** | contrat, seul, en premier | `src/brain/dossier/commandes.ts` R · `src/brain/dossier/commandes.test.ts` R · `src/brain/dossier/session.ts` R · `src/brain/dossier/sessionDestinations.ts` R · `src/brain/dossier/__fixtures__/session-saturee.ts` R · `src/brain/dossier/sessionCouverture.test.ts` R · `src/brain/dossier/recit.ts` N · `src/brain/dossier/recit.test.ts` N · `src/brain/copilote/types.ts` R · `src/brain/copilote/schemaSortie.ts` R · `src/brain/copilote/schemaSortie.test.ts` R · `src/brain/copilote/contexte/narrateur.ts` N · `src/brain/copilote/contexte/index.ts` R · `src/brain/copilote/contexte.test.ts` R · `src/brain/CopiloteService.ts` R · `src/brain/CopiloteService.test.ts` R · `src/brain/index.ts` R · `worker/index.ts` R · `worker/index.test.ts` R · `worker/frontiere.test.ts` R | Expose les signatures ci-dessous | Oui (inchangé : aucun test `play-mode` n'asserte le seul verbe `ALLER` en réel) |
| **2 `narrateur-feature`** | feature, contrat figé | `src/features/play-mode/hooks/useTourDeJeu.ts` R · `src/features/play-mode/hooks/useTourDeJeu.test.ts` R · `src/features/play-mode/components/PlayerInputBar.tsx` R · `src/features/play-mode/components/PlayerInputBar.test.tsx` R · `src/features/play-mode/components/EcranPartie.tsx` R · `src/features/play-mode/tests/verrouDeTour.test.tsx` N · `src/features/play-mode/tests/moteurSansIA.test.ts` R | Consomme le Lot 1 comme une donnée immuable | Oui |

Deux lots sur une tranche verticale : l'exécution est séquentielle, sans worktree ni fusion.

### Signatures exposées par le Lot 1 (seul point de rendez-vous)

```ts
interface CibleNarrateur { role: 'narrateur'; saisie: string; session: EtatSession } // S1, déjà persistée
interface SortieNarrateur { readonly recit: string; readonly suggestions: readonly string[] } // 0..3
type ReponseNarrateur = { statut: 'propose'; proposition: SortieNarrateur } | EchecCopilote
demander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal): Promise<ReponseNarrateur> // 8e surcharge, deux sites
function consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession
//   rend la MÊME référence si tour !== session.horloge.tour, si l'entrée à `origine` de ce tour
//   porte déjà un récit, ou si aucune entrée à `origine` n'existe pour ce tour
EntreeJournal.recit?: string   // optionnel à vie ; 'journal[].recit': 'moteur' en it2
COMMANDES.agir = { label: <texte UX/narratif>, verbe: 'AGIR', refKinds: [] }
AvisInterprete                 // inchangée ; 'aucun' = commande acceptée ⇒ R3 appelé
// Non exportés du baril brain/index.ts :
interface NarrationRendue { narration: string; tentatives: readonly string[] } // copilote/types.ts
const BUDGET_CARACTERES_NARRATEUR: number // exporté par contexte/index.ts, pour frontiere.test.ts seulement
```

### Rendez-vous interne au Lot 2 (hook ↔ composants)

Il est écrit ici pour que l'agent n'implémente pas la version `avis.recit` :

```ts
type IssueNarrateur =
  | { readonly tour: number; readonly statut: 'raconte'; readonly suggestions: readonly string[] }
  | { readonly tour: number; readonly statut: 'degrade' } // échec, trop-long et cible-a-ecrire confondus
interface UseTourDeJeuResult {
  executeAction(saisie: string): Promise<boolean> // true ⇔ un pas consommé ⇒ le champ se vide (corrige la fermeture périmée sur `avis`)
  getGestelabel(id: string): string
  avis: AvisInterprete | EchecCopilote | null      // R1 seul, inchangé
  issueNarrateur: IssueNarrateur | null            // affichée ssi issue.tour === session.horloge.tour (calcul en ligne)
  isLocked: boolean
  pasEnCours(): boolean                            // lit lockedRef ; handleSoumettreConsole refuse via setRefus
}
// Le récit affiché : session.journal, entrée du tour courant qui porte `recit` — jamais un état du hook.
```

### À inscrire pour it3 (§ 8 / `open_questions`)

- les faits de R3 et le mutant n° 7 ;
- `journal[].recit` passe à `'ia'` avec sa politique de rétention ;
- la Chip en `<button>` entier, qui transmet le texte directement (remarque de l'UX, l. 42) ;
- les coûts de typage chiffrés au point 2.

---

### Décisions prises en autonomie faute de spécification

- Nom du type résolu de R3 → `SortieNarrateur` (précédent `SortieInterprete`) plutôt que `NarrationResolue` → aucun coût fonctionnel, un nom de plus à apprendre dans le baril.
- Nom de la transition d'écriture du récit → je garde `consignerRecit`, avec les conditions d'identité d'`avecRecit` → renommage mécanique dans 2 fichiers du Lot 1.
- Canal de l'issue de R3 vers l'écran → `issueNarrateur`, séparé d'`avis` et indexé par tour → par `avis` : `TEXTE_INDISPONIBLE` s'affiche pour un échec de R3 (l. 125), et les suggestions restent affichées, périmées, après un pas console.
- Affichage du récit → dérivé du journal, indépendamment d'`avis` → lié à `avis` : le récit disparaît au rechargement alors qu'il est persisté, et l'affichage dépend d'un état qui n'est pas la source de vérité. Point laissé à l'UX : `RÉCIT` et `PRÉCISEZ` peuvent s'afficher au même tour après une clarification.
- Exposition du budget narrateur → par `contexte/index.ts` seulement, pas par `brain/index.ts` → sinon une surface publique pour un seul lecteur, qui est un test.
- `ROLE_LE_PLUS_LARGE` dans `frontiere.test.ts` → calculé sur `ROLES_AUTEUR` plus `narrateur` → sinon plus rien ne prouve que `TAILLE_MAX_CORPS_IA` couvre le narrateur quand il devient le plus large.
- Retour d'`executeAction` → `Promise<boolean>` → sinon le champ reste vidé d'après l'avis du tour précédent (défaut latent d'it1).
- `TEXTE_IMPASSE` de `PlayerInputBar`, devenu inatteignable avec `agir` → retiré dans le Lot 2 (KR-235), sauf avis contraire de l'UX → gardé : du code mort présenté comme de la couverture.

### Fichiers lus

- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it2\tour1-{tech-lead,pm-produit,ux-designer,qa,narratif-ia}.md`
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\hooks\useTourDeJeu.ts` et `useTourDeJeu.test.ts`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\PlayerInputBar.tsx`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\components\EcranPartie.tsx`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\sessionDestinations.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\commandes.ts`
- `C:\Users\pierr\Desktop\genliv\worker\index.ts`
- `C:\Users\pierr\Desktop\genliv\worker\frontiere.test.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\tests\moteurSansIA.test.ts`
