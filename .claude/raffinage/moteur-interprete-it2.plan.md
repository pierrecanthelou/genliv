# Plan d'itération — `moteur-interprete` · itération 2

> Statut : `validé` (2026-09-29)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-29
> Composition : `5 rôles` — motif : l'itération ajoute le second rôle IA du mode jeu (R3, narrateur) et un nouveau verbe (`agir`), touche le moteur et les invites du worker.
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, le joueur lit en quelques phrases ce que son action a produit, qu'elle ait déplacé son héros (`aller`) ou non (`agir`, nouveau verbe arité 0). » |
| **Tranche** | `PlayerInputBar`/`EcranPartie` (écran) → `useTourDeJeu` (orchestrateur : R1 → exécution → `onSessionChange(S1)` → R3, un seul verrou KR-265) → `CopiloteService.demander('narrateur', …)` (worker, `narrateur.ts`) → `consignerRecit` (transition pure `brain/dossier/`) → `EtatSession` persistée → récit relu depuis `session.journal` |
| **Lots** | 2 lots · dont `contrat` : oui (Lot 1, seul et premier) |
| **Hors périmètre** | `faits_etablis`/mémoire (it3) · `Chip` cliquable (it3, `suggestions[]` affiché en lecture seule en it2) · dégradation en cascade du budget par pas (it4) · jets de dés/`dangers` (n°11) · PNJ nommés/KR-262 élargi (n°12) |
| **Reporté** | AC #7 de la spec (« fait sans rang refusé ») + son mutant → it3, avec `faits_etablis` ; contrôle auteur « lieu sans description » → `dossier-controles` (déjà acté it1, inchangé) |

---

## 1 — But raffiné

À la fin de cette itération, une commande acceptée (déplacement reconnu ou action libre non ciblée) déclenche, après exécution et persistance, un second appel modèle (R3, narrateur) qui produit un court récit et jusqu'à trois suggestions ; le joueur les lit dans le bloc `RÉCIT` sous son champ de saisie — sans qu'aucune donnée ne soit inventée, retenue d'un tour à l'autre, ou attribuée à une entité non ancrée dans l'état déjà écrit.

## 2 — Hors périmètre

- `faits_etablis`/`etablis` et leur validation (« un fait sans rang est refusé ») — aucun lecteur avant `memoire` (it3, KR-249/266) ; R3 est **sans état** en it2 (aucune mémoire, aucun récit passé injecté).
- `Chip` cliquable (le geste clic-remplit-et-soumet) — `suggestions[]` est reçu, validé et **affiché en lecture seule** (texte simple, visuellement non interactif) en it2 ; la primitive `Chip` entre en it3.
- Dégradation en cascade du budget par pas (suggestions retirées, puis fenêtre réduite, puis faits retirés) — it4 ; seule la borne dure `trop-long` (refus avant tout `fetch`) entre en it2.
- `memoire` (fenêtre glissante, résumé) — reste gelée jusqu'en it3.
- Jets de dés, `marge`, `dangers` — n°11 ; `agir` reste un no-op mécanique strict, sans jet.
- Personnages/PNJ nommés, portée de KR-262 aux 8 collections — n°12 ; R3 nomme un lieu par sa `description`, jamais par `Entite.nom`.
- Rejeu déterministe réel (moteur d'aléa) — n°11 ; cette itération continue seulement de garantir que le journal ne stocke jamais la saisie brute.
- Contrôle auteur « lieu accessible sans `description` » — hors feature (`dossier-controles`), déjà reporté en it1 (KR-267), inchangé.
- Amendement de `docs/REGLES-PLAY.md` § J1 — aucun nécessaire, déjà verbe-agnostique (vérifié it1, confirmé).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Composants
- **`OutcomeBlock`** (existant, **inchangé**, KR-109 — pas de nouvelle prop) : réutilisé pour un 3ᵉ état, `entete="RÉCIT"`, corps = `recit` (prose R3, verbatim, 2e personne, présent), affiché ssi une entrée du tour courant porte un `recit` valide. Même famille que `PRÉCISEZ`/`NON RECONNU`.
- **Liste de suggestions** (inline, PAS de nouveau composant `Chip` en it2) : `<ul>` sans puce, sous `OutcomeBlock`, jamais dans son `children`. Style strictement **non interactif** — condition de recevabilité du report de `Chip` à it3 :
  - `suggestionsListStyle` : `margin: var(--space-3) 0 0`, `padding: 0`, `list-style: none`, `display: flex`, `flex-direction: column`, `gap: var(--space-1)`.
  - `suggestionItemStyle` : `font-family: var(--font-ui)`, `font-size: var(--fs-sm)`, `color: var(--text-strong)` — **aucune bordure, aucun `border-radius`, aucun `background`, aucun `cursor`, aucun `:hover`** (rien qui évoque un contrôle cliquable).
  - Aucun glyphe préfixe, aucun en-tête (« PISTES » etc.) : le récit au-dessus suffit à contextualiser.
  - État vide (`suggestions.length === 0`) : rien n'est rendu, aucun conteneur vide.
  - Les suggestions du tour N ne survivent jamais au tour N+1 : dérivées de la même entrée de journal que le récit, jamais d'un état séparé.
- **Bannière interface** (idiome déjà posé en it1, pas un composant neuf) : réutilisée pour la dégradation de R3 — `TEXTE_RECIT_INDISPONIBLE = 'Le récit n'a pas pu être généré.'` — **jamais** dans `OutcomeBlock` (registre interface, pas prose joueur), **jamais** `TEXTE_INDISPONIBLE` d'it1 (celui-là couvre un échec de R1 avant toute exécution ; celui-ci couvre un échec APRÈS que l'état a déjà été écrit — deux situations différentes pour le joueur).
- **`PlayerInputBar`** (existant, R) : corrige le défaut latent d'it1 (fermeture périmée — le champ se vidait selon l'avis du tour **précédent**). Un seul point d'entrée `soumettre(texte: string)`, appelé par Entrée et réutilisable tel quel par `Chip.onSelect` en it3 — jamais deux chemins de soumission distincts.
- **`ConsoleCommandes`** : inchangée dans son rendu ; son *comportement* gagne un refus pendant qu'un pas est en cours (§ 4 bis), visible via la prop `refus` déjà existante — jamais une perte silencieuse.

### Label du verbe `agir` (contrat narratif, KR-269 nouveau)
Le `label` de `COMMANDES.agir` est lu par le modèle à deux endroits (l'invite de R1, le bloc « ce pas » de R3) — c'est sa seule source pour comprendre la portée du verbe, donc :
- 3ᵉ personne, présent, même forme que `'va au lieu'` (`commandes.ts:63`) ;
- dit la portée : une action **sur place**, sans quitter le lieu ;
- **aucun mot de mécanique** (pas de « jet », « réussite », etc.).
- Texte figé : `'agit sur place'` — respecte les trois contraintes ci-dessus, aucune autre formulation à inventer par l'agent.

### Textes exacts (nouvelles constantes, même patron `TEXTE_*`)
```
ENTETE_RECIT              = 'RÉCIT'
TEXTE_RECIT_INDISPONIBLE  = 'Le récit n'a pas pu être généré.'   // bannière interface, PAS OutcomeBlock
```
*(Correction post-Lot 1, 2026-09-29 : la formulation initiale « ce tour-ci » violait `docs/REGLES-PLAY.md` § J1 — « tour » réservé au round de combat, jamais dans un libellé d'écran, cf. § 8 désaccord #18 ci-dessous. Trouvé par `dev-contrat` en relisant le contrat de design avant de rendre la main sur le Lot 1.)*
Invite `interprete` (amendement, remplace le texte actuel « un ou plusieurs lieux ») :
```
« un geste et autant de repères de lieux que ce geste en demande, aucun s'il n'en demande pas »
```
Aucune phrase propre à `agir` dans l'invite — sa portée vit entièrement dans son `label` (voir ci-dessus).

### Tokens (aucun nouveau)
`--font-ui`, `--fs-sm`, `--fs-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--text-strong`, `--text-muted`, `--space-1`, `--space-3`, `--font-mono`.

### États
| Situation | Champ | Bouton | Console | Affiché |
|---|---|---|---|---|
| Pas en cours (R1→exécution→R3) | `disabled` | `disabled`, `…` | **refusée** (verrou étendu, KR-265) | rien de nouveau tant que R3 n'a pas répondu |
| R3 réussi | vidé (via `soumettre`), `autoFocus` | actif | déverrouillée | `OutcomeBlock entete="RÉCIT"` + suggestions (si non vide) |
| R3 dégradé (contexte trop long / indisponible / illisible après rejeu) | vidé (le pas est acquis) | actif | déverrouillée | bannière `⊘ Le récit n'a pas pu être généré.` |
| `agir` sans cible plausible détectée par R1 | comme `sans_commande` d'it1 (inchangé) | actif | déverrouillée | `NON RECONNU` (inchangé) |

### Clavier
Inchangé d'it1 (Entrée native, `disabled` réel coupe `Tab`). Aucune exigence sur la liste de suggestions (non interactive, hors du flux `Tab`).

### Registres de langue
- `recit`, `suggestions[]` : registre JOUEUR, 2e personne, présent — même registre que la clarification d'it1.
- `TEXTE_RECIT_INDISPONIBLE` : registre INTERFACE PLAT, jamais la voix du narrateur.
- `ConsoleCommandes` : inchangée, registre développeur-débogueur.

*(Écrit par l'UX, amendé par Narratif & IA et Tech Lead au tour 2 — voir § 8.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander('narrateur', …)` | service | émet (8ᵉ branche) | `demander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal): Promise<ReponseNarrateur>` |
| `COMMANDES.agir` | registre | émet (entrée neuve) | `{ label: string /* contrat narratif, § 3 */, verbe: 'AGIR', refKinds: [] }` — arité 0 |
| `EntreeJournal.recit` | type | émet (champ neuf) | `readonly recit?: string` — optionnel à vie (KR-160/191/251) |
| `sessionDestinations.ts` | registre | émet (ligne neuve) | `'journal[].recit': 'moteur'` en it2 (bascule `'ia'` différée à it3, politique de rétention pas encore posée) |
| `brain/dossier/recit.ts` | registre | émet (module neuf) | `consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession` — même référence si `tour !== session.horloge.tour`, si l'entrée à `origine` de ce tour porte déjà un récit, ou si aucune entrée à `origine` n'existe pour ce tour |
| `brain/copilote/contexte/narrateur.ts` | registre | émet (module neuf) | `assemblerNarrateur(dossier, cible)` + `BUDGET_CARACTERES_NARRATEUR: number` (refus `trop-long` avant tout `fetch`, mesuré sur le dossier de référence, absorbé par la constante unique KR-261 en it4) |
| `worker/index.ts` | registre | émet (entrée neuve + amendement) | `INVITES['narrateur']`, `GABARIT_SORTIE['narrateur']` ; `INVITES['interprete']` amendé (§ 3) — contrat de route à 7 branches inchangé dans sa forme |
| `worker/index.test.ts` | registre | émet (amendement) | la liste `interdits` (mots bannis des invites `interprete`+`narrateur`) est **dérivée** de `COMMANDES` (id, verbe, libellé), jamais recopiée à la main (KR-270 nouveau) |
| `useTourDeJeu` (feature) | service | consomme (Lot 1 comme donnée immuable) | orchestre R1 → `apresInterpretation` → `onSessionChange(S1)` → si `avis.type === 'aucun'`, `demander('narrateur', {session: S1, saisie})` → `onSessionChange(consignerRecit(S1, S1.horloge.tour, recit))`, un seul verrou KR-265 relâché dans le `finally` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | `canon.ton`/`interdits_ton[]`/`accroche_joueur` (si écrits) · `monde.lieux[].description` du lieu courant (**REQUISE** : absente/marquée ⇒ refus `cible-a-ecrire`, zéro `fetch`) + `ambiance` · les deltas `effet:'applique'` du pas courant, dérivés de `session.journal` où `tour === horloge.tour` (jamais stockés, KR-013) : objet donné/retiré, indice révélé, jalon franchi · « où en est le héros » : objets possédés (`description_joueur`), jalons déjà atteints (`enonce_texte`, via `evaluate.ts`) · la saisie du joueur, normalisée, en dernier. **Aucune mémoire, aucun récit passé, aucun `journal`, aucune `attente`.** |
| Schéma de sortie | Réseau (`NarrationRendue`, jamais ré-exporté) : `{narration: string; tentatives: readonly string[]}`. Résolu (`SortieNarrateur`) : `{recit: string; suggestions: readonly string[]}` (0 à 3). **Zéro clé commune** réseau/résolu (KR-231) ; ni l'un ni l'autre ne partage de clé avec `InterpretationRendue`/`SortieInterprete` ou `validerIntention`/`CLES_SORTIE_PLAN`. |
| Validation (`validerNarrateur`) | clés exactes `{narration, tentatives}` → `narration` non vide après `trim`, ≤ 800 caractères, ne finit jamais par « ? » → `tentatives` : 0 à 3 chaînes non vides, ≤ 60 caractères, distinctes → aucun `MARQUEUR_A_ECRIRE` → aucun identifiant du dossier (élément par élément, jamais après `join`) |
| Échec de validation | Refus de contexte (`trop-long`, `cible-a-ecrire`) : **zéro `fetch`**. `indisponible` : un seul appel, sans rejeu. Forme invalide : rejeu **exactement une fois**, puis dégradé. **Dans les trois cas** : le pas reste acquis (jamais annulé), `recit` absent (état légal, KR-251), zéro suggestion, bannière fixe, verrou relâché — jamais un texte neutre écrit comme de la fiction. |
| Mémoire | **Aucune** — R3 est sans état en it2 : même monde au pas 2 et au pas 40 ⇒ contexte identique (témoin séparateur, § 7). |
| Ce que l'IA **ne** fait **pas** | Ne lance aucun dé, ne modifie aucune statistique, ne connaît aucun verbe/libellé de `COMMANDES`, ne retient aucun fait d'un tour à l'autre (`faits_etablis` reporté à it3), ne nomme aucune entité par `Entite.nom` (KR-262 restreint à la `description` du lieu), ne reçoit ni `dangers` ni `synopsis_mj` (spoil, hors périmètre n°11). |
| Budget de contexte (KR-261) | `BUDGET_CARACTERES_NARRATEUR` mesuré au pire cas sur le dossier de référence (`ceil(M×3/1000)×1000`), posé dans `contexte/narrateur.ts`, hors `BUDGET_CARACTERES_CONTEXTE` (parité auteur). `TAILLE_MAX_CORPS_IA` re-dérivé sur les 8 rôles ; `frontiere.test.ts` étend `pireCasDe`/`ROLE_LE_PLUS_LARGE` à `narrateur`. **Chemins de prose IA ouverts par n°10 : 5 sur 11** — 1 par R1 (`lieux.description`), 4 par R3 (`lieux.ambiance`, `objets.description_joueur`, `indices.formulation_joueur`, `jalons.enonce_texte`) ; le Lot 1 vérifie et documente en tête de `contexte/narrateur.ts` la liste fermée des 11 chemins (KR-261, jamais écrite ailleurs) et confirme ce compte. |

## 5 — Lots

### Lot 1 — `narrateur-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : le 8ᵉ rôle de `CopiloteService` (narrateur), le verbe `agir`, la transition pure d'écriture du récit, la borne de contexte, et l'amendement des deux invites — rien de tout cela n'a de consommateur visuel avant le Lot 2, mais tout y est verrouillé par type et par test.
- **Fichiers** :
  - `src/brain/dossier/commandes.ts` (R) — `agir` ajouté
  - `src/brain/dossier/commandes.test.ts` (R)
  - `src/brain/dossier/session.ts` (R) — `EntreeJournal.recit?`
  - `src/brain/dossier/sessionDestinations.ts` (R) — `'journal[].recit': 'moteur'`
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R)
  - `src/brain/dossier/sessionCouverture.test.ts` (R)
  - `src/brain/dossier/recit.ts` (N) — `consignerRecit`
  - `src/brain/dossier/recit.test.ts` (N)
  - `src/brain/copilote/types.ts` (R) — `CibleNarrateur`, `NarrationRendue`, `SortieNarrateur`, `ReponseNarrateur`
  - `src/brain/copilote/schemaSortie.ts` (R) — `validerNarrateur`
  - `src/brain/copilote/schemaSortie.test.ts` (R)
  - `src/brain/copilote/contexte/narrateur.ts` (N) — `assemblerNarrateur`, `BUDGET_CARACTERES_NARRATEUR`
  - `src/brain/copilote/contexte/index.ts` (R)
  - `src/brain/copilote/contexte.test.ts` (R)
  - `src/brain/CopiloteService.ts` (R) — 8ᵉ branche, garde `never`
  - `src/brain/CopiloteService.test.ts` (R)
  - `src/brain/index.ts` (R) — ré-exports (`NarrationRendue`/budget NON ré-exportés)
  - `worker/index.ts` (R) — `INVITES['narrateur']`, `GABARIT_SORTIE['narrateur']`, `INVITES['interprete']` amendé
  - `worker/index.test.ts` (R) — `interdits` dérivée de `COMMANDES`
  - `worker/frontiere.test.ts` (R) — `narrateur` hors parité auteur, `ROLE_LE_PLUS_LARGE`/`pireCasDe` étendus
- **Expose** :
  ```ts
  interface CibleNarrateur { role: 'narrateur'; saisie: string; session: EtatSession } // S1, déjà persistée
  interface NarrationRendue { narration: string; tentatives: readonly string[] }       // réseau, non ré-exporté
  interface SortieNarrateur { readonly recit: string; readonly suggestions: readonly string[] } // résolu, 0..3
  type ReponseNarrateur = { statut: 'propose'; proposition: SortieNarrateur } | EchecCopilote
  demander(dossier: Dossier, cible: CibleNarrateur, signal?: AbortSignal): Promise<ReponseNarrateur> // 8e surcharge
  function consignerRecit(session: EtatSession, tour: number, recit: string): EtatSession
  EntreeJournal.recit?: string
  COMMANDES.agir = { label: string, verbe: 'AGIR', refKinds: [] }
  const BUDGET_CARACTERES_NARRATEUR: number // exporté par contexte/index.ts, pour frontiere.test.ts seulement
  ```
- **Critères couverts** : #1, #2, #3, #4, #7, #8

### Lot 2 — `narrateur-feature`
- **Ouvrier** : `dev-lot`
- **But** : orchestrer R3 dans `useTourDeJeu` après persistance, afficher le récit et les suggestions, verrouiller la console pendant le pas, corriger la fermeture périmée d'it1, étendre `moteurSansIA.test.ts` — contrat du Lot 1 lu comme donnée immuable.
- **Fichiers** :
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R)
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R)
  - `src/features/play-mode/components/PlayerInputBar.tsx` (R) — `soumettre(texte)` unique, liste de suggestions inline, `OutcomeBlock entete="RÉCIT"`, bannière de dégradation R3
  - `src/features/play-mode/components/PlayerInputBar.test.tsx` (R)
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — verrou console (`pasEnCours()`, refus visible)
  - `src/features/play-mode/tests/verrouDeTour.test.tsx` (N) — commande console pendant un pas en vol, jamais perdue silencieusement
  - `src/features/play-mode/tests/moteurSansIA.test.ts` (R) — motif `.demander(` ajouté à la garde, mutant obligatoire
- **Signature interne** (hook ↔ composants, pas un contrat `brain/` — écrite ici pour qu'aucun agent n'implémente `avis.type === 'recit'`) :
  ```ts
  type IssueNarrateur =
    | { readonly tour: number; readonly statut: 'raconte'; readonly suggestions: readonly string[] }
    | { readonly tour: number; readonly statut: 'degrade' }
  interface UseTourDeJeuResult {
    executeAction(saisie: string): Promise<boolean> // true ⇔ un pas consommé ⇒ le champ se vide
    avis: AvisInterprete | EchecCopilote | null      // R1 seul, inchangé
    issueNarrateur: IssueNarrateur | null            // affichée ssi issue.tour === session.horloge.tour
    isLocked: boolean
    pasEnCours(): boolean                            // handleSoumettreConsole refuse via setRefus si true
  }
  // Le récit affiché est dérivé de session.journal (entrée du tour courant qui porte `recit`) — jamais un état du hook.
  ```
- **Consomme** : l'interface exposée par le Lot 1, telle quelle.
- **Critères couverts** : #1, #2, #3, #4, #5, #6, #7, #8

*(2 lots, exécution séquentielle : le Lot 2 dépend entièrement du contrat figé par le Lot 1, aucun parallélisme réel.)*

## 6 — Critères d'acceptation

1. **Étant donné** un texte joueur qui ne mappe à aucune cible d'`aller` mais décrit une action plausible sur place, **quand** R1 le traduit, **alors** il rend `{commande:'agir', cibles:[]}` (arité 0) — l'invite `interprete` amendée rend `agir` atteignable sans nommer aucun verbe. — *niveau : unitaire* — *lot 1*
2. **Étant donné** la commande `agir` exécutée, **quand** le moteur consomme le pas, **alors** `session.monde` reste la MÊME référence (`toBe`), l'horloge avance de 1, et deux entrées journal sont écrites (joueur + moteur à `origine`) — jamais de modification de `EtatMonde`. — *niveau : unitaire* — *lot 1*
3. **Étant donné** une commande acceptée (aller ou agir) et sa session déjà persistée (`onSessionChange(S1)`), **quand** le tour se termine, **alors** `useTourDeJeu` appelle R3 APRÈS coup, dans le même verrou KR-265, sans jamais lui injecter de mémoire ni de récit passé (R3 sans état, même contexte au pas 2 et au pas 40). — *niveau : composant* — *lot 1 (contrat) + lot 2 (câblage)*
4. **Étant donné** une sortie de R3 non conforme au schéma OU un contexte dépassant `BUDGET_CARACTERES_NARRATEUR`, **quand** elle est reçue ou refusée avant tout `fetch`, **alors** le pas reste acquis, `recit` est absent (état légal), zéro suggestion, et la bannière fixe « Le récit n'a pas pu être généré. » est affichée — jamais un texte neutre écrit comme de la fiction. — *niveau : contrat* — *lot 1*
5. **Étant donné** un récit produit par R3, **quand** le joueur le lit, **alors** il est affiché dans `OutcomeBlock entete="RÉCIT"`, dérivé de `session.journal` (jamais d'un état miroir du hook) ; les suggestions (0 à 3) sont affichées en texte simple non cliquable sous le bloc, rien n'est rendu si la liste est vide. — *niveau : composant* — *lot 2*
6. **Étant donné** un pas de jeu en cours (R1→exécution→R3), **quand** une commande console est soumise, **alors** elle est refusée de façon visible (jamais perdue silencieusement) tant que le verrou n'est pas relâché ; le champ de saisie se vide désormais selon l'avis du tour COURANT, pas du tour précédent (correction du défaut latent d'it1). — *niveau : composant* — *lot 2*
7. **Étant donné** le périmètre balayé par `moteurSansIA.test.ts` (KR-260), **quand** `narrateur` est appelé depuis `useTourDeJeu.ts`, **alors** l'exclusion nommée existante couvre l'appel via un motif `.demander(` (mutant obligatoire, vérifié ROUGE puis retiré) — `brain/dossier/` et `src/player/` restent sous interdiction totale. — *niveau : balayage de code* — *lot 1 (motif) + lot 2 (fichier appelant)*
8. **Étant donné** les invites `interprete` (amendée) et `narrateur` (neuve), **quand** elles sont vérifiées, **alors** elles ne contiennent aucun verbe, libellé ou clé de `COMMANDES` — la liste `interdits` de `worker/index.test.ts` est dérivée de `COMMANDES`, jamais recopiée à la main. — *niveau : contrat* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `commandes.test.ts` → `agir` ajouté | `COMMANDES.agir` existe, arité 0, mutant : le retirer → invite/critère #1 rougit | unitaire | KR-263 | 1 |
| `recit.test.ts` → `consignerRecit` écrit sur l'entrée à `origine` | scénario à jalons multiples : entrées de jalon postérieures à l'entrée d'`origine` ne sont pas confondues | unitaire | KR-013 | 1 |
| `recit.test.ts` → identité si rien à écrire | `tour !== horloge.tour`, entrée déjà porteuse d'un récit, ou aucune entrée à `origine` → même référence (`toBe`) | unitaire | KR-235 | 1 |
| `schemaSortie.test.ts` → `validerNarrateur`, mutants | un « ? » final accepté → ROUGE ; une 4ᵉ tentative acceptée → ROUGE ; un identifiant du dossier laissé passer → ROUGE | mutation ciblée | KR-231 | 1 |
| `contexte.test.ts` → R3 sans état | contexte assemblé au pas 2 vs au pas 40 sur le même monde → `toEqual` | unitaire | narratif-ia (véto levé) | 1 |
| `contexte.test.ts` → refus `trop-long` | fixture saturée → `MotifRefusContexte:'trop-long'`, zéro `fetch` | unitaire | KR-261 | 1 |
| `CopiloteService.test.ts` → rejeu-un-coup rôle `narrateur` | réponse fautive puis valide = 2 `fetch` ; deux fautives = dégradé ; 503/413/réseau = 1 `fetch`, pas annulé | contrat | — | 1 |
| `worker/index.test.ts` → `interdits` dérivée de `COMMANDES` | balayage littéral de `INVITES.interprete`/`INVITES.narrateur` contre la liste dérivée, pas recopiée | contrat | KR-270 (nouveau) | 1 |
| `worker/frontiere.test.ts` → `narrateur` hors parité auteur, budget re-dérivé | `ROLE_LE_PLUS_LARGE`/`pireCasDe` incluent `narrateur` | contrat | KR-261 | 1 |
| `useTourDeJeu.test.ts` → R3 appelé après persistance | 2ᵉ appel `demanderMock` reçoit une session `toBe` celle transmise à `onSessionChange` | composant | KR-013 | 2 |
| `useTourDeJeu.test.ts` → R3 seulement si `avis.type === 'aucun'` | 3 saisies (valide / clarification / non_reconnu) → seule la valide déclenche `demander('narrateur', …)` | composant | KR-264 | 2 |
| `useTourDeJeu.test.ts` → `executeAction` retourne `true`/`false` selon le pas courant | corrige la fermeture périmée : le champ se vide selon l'issue de CE tour | composant | BUG-132 (nouveau — distinct de BUG-131, qui est le miroir de session KR-013 d'it1) | 2 |
| `PlayerInputBar.test.tsx` → `OutcomeBlock entete="RÉCIT"` + suggestions | `getByText('RÉCIT')`, contenu du récit, suggestions en `<li>` non cliquables, rien si vide | composant | — | 2 |
| `verrouDeTour.test.tsx` → commande console pendant un pas en vol | refus visible (`refus` posé), jamais une perte silencieuse, zéro appel R1 concurrent | composant | KR-265 | 2 |
| `moteurSansIA.test.ts` → mutant motif `.demander(` | ajouter `copilote.demander(` dans `PlayerInputBar` → ROUGE → retrait | balayage de code | KR-260 | 2 |

Cas limites couverts : suggestions vides · pas 0 (ouverture, R3 jamais appelé) · jalons franchis au pas (récit sur l'entrée d'origine seulement) · pas tardif (t=40, contexte stable) · R3 indisponible/trop-long/illisible après rejeu · double soumission sous verrou · commande console pendant le vol.

**Non vérifiable en l'état** — tous les critères d'acceptation (§ 6) sont couverts par un instrument existant. Deux KR cités au § 8 sont des heuristiques de revue, pas des invariants testables par jest :
- **KR-268** (champ IA sans lecteur = coût sans contrepartie) — se vérifie à la lecture du plan/du diff, pas par une assertion runtime : la garantie est l'ABSENCE de `faits_etablis`/`etablis` dans le schéma d'it2, pas quelque chose qu'un test positif peut épingler.
- **KR-269** (le `label` d'un verbe est un contrat narratif : 3e personne, présent, zéro mot de mécanique) — qualité de prose, jugée en revue humaine (dev-contrat + UX) au moment où le texte est écrit, pas par un test automatisé.

Le score de mutation `brain/` ne s'applique pas à cette itération : `recit.ts`/`schemaSortie.ts`/`contexte/narrateur.ts` ne sont pas dans le périmètre des 4 fichiers de règles de jeu.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM (tour 1) | `Chip` cliquable dans le même lot que le premier récit R3 gonfle la tranche | `RETENU`, rétréci au tour 2 | `suggestions[]` reste affiché en it2 (texte simple, lecture seule) ; seul le geste clic-remplit-et-soumet (`Chip` interactive) part en it3 |
| 2 | Tech Lead (tour 1) | `PropositionNarrateur.etablis` posé dès it2, validé mais jamais lu, « pour la stabilité tsc future » | `REJETÉ` (retiré par son auteur au tour 2) | Argument tsc réfuté par mesure (le mock narrateur n'est pas typé) ; `faits_etablis`/`etablis` intégralement hors périmètre it2, reportés à it3 avec leur mutant. AC#7 de la spec retiré du périmètre it2. Généralisé en **KR-268 (nouveau)** : un champ de la forme de sortie d'un rôle IA n'entre au schéma que si un lecteur réel existe DANS LA MÊME itération — même optionnel « pour la stabilité future », c'est un coût sans contrepartie |
| 3 | Tech Lead vs Narratif & IA | Nom du type résolu de R3 : `SortieNarrateur` (tech-lead) vs `PropositionNarrateur` (narratif-ia) | `RETENU : SortieNarrateur` | Suit exactement le précédent déjà livré (`InterpretationRendue`/`SortieInterprete`, it1), pas une convention concurrente |
| 4 | UX (tour 1) | Récit affiché via `avis.type === 'recit'` dans l'état du hook | `REJETÉ` (tech-lead + narratif-ia, tour 2) | Canal séparé `issueNarrateur` (déclencheur) + récit dérivé de `session.journal` (source de vérité) — un miroir d'état est le motif exact de BUG-131 (KR-013). Contrat visuel de l'UX (`OutcomeBlock`, tokens) inchangé |
| 5 | QA (tour 1) | Nouveaux fichiers de test dédiés (`moteurSansIA.extension.test.ts`, `validerNarrateur.test.ts`) | `REJETÉ` (tech-lead, tour 2) | Une garde/un validateur vit dans un seul fichier déjà existant (`moteurSansIA.test.ts`, `schemaSortie.test.ts`), précédent `validerInterprete` |
| 6 | Tech Lead (tour 1) | Projection d'`EtatMonde` passée en paramètre explicite à R3 | `REJETÉ` (par son auteur, alternative D2) | Seconde source de vérité (KR-013) ; la cible porte `session: S1`, la projection se calcule dans l'assembleur |
| 7 | Tech Lead / Narratif & IA | Verrou de tour étendu à toute la chaîne R1→exécution→R3, console refusée pendant le vol | `RETENU` | Consensus unanime tour 2 ; corrige BUG-131 (risque identifié par tech-lead, tour 1) |
| 8 | Tech Lead | Défaut latent d'it1 : fermeture périmée dans `PlayerInputBar.handleSubmit` (le champ se vide selon l'avis du tour PRÉCÉDENT) | `RETENU` | Corrigé dans le Lot 2 (`executeAction(): Promise<boolean>`), test de non-régression au § 7 ; à journaliser dans `bug_history.json` (sévérité majeure, `discovered_at: iteration-2`, origine it1) |
| 9 | Narratif & IA | Invite `interprete` doit être amendée pour rendre `agir` atteignable, sans nommer aucun verbe | `RETENU` | « un geste et autant de repères de lieux que ce geste en demande, aucun s'il n'en demande pas » — § 3, Lot 1 |
| 10 | Narratif & IA | Le `label` d'`agir` est un contrat narratif lu deux fois par le modèle | `RETENU` | KR-269 (nouveau) — 3e personne, présent, portée « sur place », zéro mot de mécanique ; formulation confiée à l'UX |
| 11 | Tech Lead / Narratif & IA | Liste `interdits` de `worker/index.test.ts` recopiée à la main | `RETENU : dérivée de COMMANDES` | KR-270 (nouveau) — étendue à `INVITES.narrateur` |
| 12 | Narratif & IA | Refus `trop-long` du contexte narrateur avant tout `fetch`, dès it2 (pas seulement it4) | `RETENU` | `BUDGET_CARACTERES_NARRATEUR` dans le Lot 1, absorbé par la constante unique KR-261 en it4 |
| 13 | Narratif & IA | `journal[].recit` doit rester audience `'moteur'` en it2, pas `'ia'` | `RETENU` | La bascule à `'ia'` est une politique de rétention qui appartient à it3 (mémoire) |
| 14 | Narratif & IA | « 3 des onze chemins de prose IA » (roadmap) n'est étayé par aucune liste écrite ; n°10 en ouvre en réalité 5 | `RETENU` | Liste fermée des onze chemins à documenter en tête de `contexte/narrateur.ts` (§ 4 bis), compte de 5 confirmé par le Lot 1 |
| 15 | Narratif & IA | Branche défensive « le pas a bougé ⇒ même référence » dans `consignerRecit` : code mort vu le verrou (KR-235) ? | `RETENU (garder)` | Fonction pure exportée de `brain/`, invariant vérifiable indépendamment du verrou UI qui l'appelle aujourd'hui — pas un code défensif inatteignable au niveau de la fonction elle-même |
| 16 | PM | KR-262 restreint à R1 : un récit qui ne peut nommer ni lieu ni PNJ risque de lire comme un texte générique, en particulier pour `agir` | `RETENU (condition de clôture)` | Vérification manuelle en revue de fin d'itération sur un vrai récit d'`agir` produit sur le dossier de référence — pas un test automatisé, § 10 |
| 17 | Tech Lead | `TEXTE_IMPASSE` de `PlayerInputBar` devient du code mort (`agir` toujours satisfiable) | `RETENU` | Retiré dans le Lot 2 (KR-235), sauf régression visuelle signalée par l'UX en revue |
| 18 | `dev-contrat` (Lot 1) | `TEXTE_RECIT_INDISPONIBLE` tel qu'écrit au § 3 (« … ce tour-ci ») viole `docs/REGLES-PLAY.md` § J1 (mot « tour » interdit dans tout libellé d'écran) | `RETENU : corrigé` | Texte figé en `'Le récit n'a pas pu être généré.'`, § 3 corrigé le 2026-09-29 avant le lancement du Lot 2 — aucun mot temporel de remplacement nécessaire (précédent `TEXTE_INDISPONIBLE` d'it1, déjà sans référence au tour) |
| 19 | `dev-contrat` (Lot 1) | `ConsoleCommandes.tsx` (`TEXTE_IMPASSE`, hors liste des deux lots) devient potentiellement inexact avec `agir` toujours satisfiable ; docstrings périmées dans `contexte/interprete.ts` (hors liste, non modifiées) | `REPORTÉ` | Hors périmètre des deux lots de cette itération (ni l'un ni l'autre ne nomme ces fichiers) ; signalé à la revue de clôture (§ 10), correction à faire dans une itération qui rouvre ces fichiers ou en dette explicite |
| 20 | `dev-contrat` (Lot 1) | Voix du narrateur (vouvoiement, comme R1) vs `charpente.fins[].texte` du dossier de référence (tutoiement) | `REPORTÉ` | Constat sur le contenu du dossier de référence, pas un défaut de code ; à vérifier en revue de clôture, propriétaire dossier-canon si une correction de contenu est décidée |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(supprimé — aucune proposition hors-cadre au-delà de ce que le cadre autorisait déjà)*

## 10 — Définition de fini

- [x] Porte qualité verte : `npm run format` → `npx tsc --noEmit` → `npm run lint` → `npm test` (123 suites / 2003 tests, mesure finale post-revue tech-lead, 3 passages)
- [x] `npm run test:mutation` — NON DÉCLENCHÉ (aucun des 4 fichiers de règles de jeu n'est touché par cette itération)
- [x] Tests du § 7 écrits et passants
- [x] Critères du § 6 cochés un par un (8/8, revue QA mode B)
- [x] Aucune régression sur les tests existants de la feature (`moteur-dossier`, `dossier-copilote`, it1 de `moteur-interprete`)
- [x] Aucun fichier touché hors de la liste de son lot
- [x] Défaut latent d'it1 (fermeture périmée, `PlayerInputBar.handleSubmit`) journalisé dans `bug_history.json` — **BUG-132** (sévérité majeure, `discovered_at: iteration-2`, distinct de BUG-131)
- [ ] Revue de clôture : un vrai récit d'`agir` produit sur le dossier de référence ne lit pas comme un texte générique (désaccord #16) — **NON EXÉCUTÉE** : nécessite un appel réel au worker/modèle, hors de ce qu'une session sans playtest peut prouver ; à faire avant de considérer cette itération définitivement close
- [x] `code-knowledge.json` mis à jour avec KR-268, KR-269, KR-270 (au-dessus de son plafond, compaction due — voir revue)
- [x] Désaccords #19 et #20 (dette hors périmètre : `ConsoleCommandes.tsx` `TEXTE_IMPASSE`, docstrings périmées de `contexte/interprete.ts`, tutoiement de `fins[].texte`) consignés dans la revue de clôture, pas silencieusement oubliés
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-interprete-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | `Chip` rétrécie à un report de l'interaction seule ; AC#7 retiré du périmètre ; condition de clôture KR-262 ajoutée au § 10 |
| Tech Lead | recevable sous réserve | `etablis` retiré (décision propre corrigée) ; découpage en lots mis à jour (Lot 2 : 7 fichiers) ; console verrouillée pendant le pas |
| UX | recevable sous réserve | Variant texte simple des suggestions (non cliquable), dégradation R3 en bannière, `soumettre(texte)` unique pour it3 |
| QA | recevable sous réserve | AC#7 reporté à it3, cas limites énumérés au § 7, non-régression de la fermeture périmée ajoutée |
| Narratif & IA | recevable sous réserve | R3 sans état, `{narration,tentatives}`→`{recit,suggestions}`, borne `trop-long` dans le Lot 1, invite amendée, liste des 11 chemins à documenter |
