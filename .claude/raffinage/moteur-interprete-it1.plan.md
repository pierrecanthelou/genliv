# Plan d'itération — `moteur-interprete` · itération 1

> Statut : `validé` (2026-09-25)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-25
> Composition : `5 rôles` — motif : l'itération ouvre le premier appel modèle du mode jeu (R1), touche le moteur et la mémoire de session.
> Exécution : `essaim` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, le joueur écrit une action libre ; le moteur la traduit en déplacement s'il en reconnaît un, répond qu'il ne peut pas encore le faire, ou demande une précision — jamais de prose, R3 n'existe pas encore. » |
| **Tranche** | `PlayerInputBar` (écran) → `useTourDeJeu` (orchestrateur feature, verrou de tour) → `CopiloteService.demander('interprete', …)` (appel modèle, worker) → `interprete.ts` (re-résolution + transition pure `brain/`) → `executerCommande` (même entonnoir que la console) → `EtatSession` persistée |
| **Lots** | 2 lots · dont `contrat` : oui (Lot 1, seul et premier) |
| **Hors périmètre** | `agir` (it2) · R3/narrateur, bloc de récit, `Chip` (it2) · `memoire` (it3) · budget par pas (it4) · contrôle auteur "lieu sans description" (hors feature, reporté) |
| **Reporté** | KR-267 (lieu sans `description` inatteignable en saisie libre) → `open_questions`, propriétaire `dossier-controles`, déclencheur : première surface de jeu sans console, ou prochaine itération qui rouvre `controles.ts` |

---

## 1 — But raffiné

À la fin de cette itération, le joueur écrit une action libre dans un nouveau champ de saisie ; R1 la traduit en déplacement reconnu (même entonnoir que la console), en demande de précision, ou en refus poli — jamais en prose, jamais en dé lancé, jamais en statistique modifiée.

## 2 — Hors périmètre

- `agir` (verbe d'arité 0) — entre en it2 avec son consommateur narratif R3 (KR-263).
- R3/narrateur, `journal[].recit`, bloc de récit joueur, `Chip` de suggestions — it2.
- `memoire` (fenêtre glissante, résumé) — reste gelée à sa forme actuelle jusqu'en it3 (KR-249/266).
- Budget par pas, dégradation en cascade, balayage des onze chemins de prose `ia` — it4.
- Contrôle auteur détectant un lieu accessible sans `description` — hors feature (`dossier-controles`), reporté en `open_questions` (KR-267 nouveau, voir § 8, désaccord 21).
- Démotion visuelle de `ConsoleCommandes` — mentionnée au cadrage de feature mais non couverte par un critère d'acceptation de cette itération ; `ConsoleCommandes` reste inchangée.
- Rejeu déterministe réel (moteur d'aléa, replay complet d'une session) — propriétaire n°11 ; cette itération ne fait que garantir que le journal ne stocke jamais la saisie brute (critère 8).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

### Composants
- **`PlayerInputBar`** (NEUF, `src/features/play-mode/components/PlayerInputBar.tsx`) : `<form>` natif + `Field` (`brain/components`, registre NON mono) + `<button type="submit">` au patron exact de `ConsoleCommandes.boutonExecuter` (mêmes tokens, couleur neutre en `disabled`). Zéro import de `ConsoleCommandes` et réciproquement (garde de test dédiée, § 7).
- **`Field`** (`src/brain/components/Field.tsx`, EXTENSION additive) : `disabled?: boolean` (attribut HTML réel sur `<input>`/`<textarea>`, jamais un habillage visuel seul) + `maxLength?: number` (idem, transmis tel quel).
- **`OutcomeBlock`** (existant, inchangé) : réutilisé pour DEUX états seulement, `entete` variable, **zéro nouvelle prop** :
  - `entete="PRÉCISEZ"` — **seulement** quand `avis.type === 'clarification'` (invariant testable : `PRÉCISEZ` affiché ⇔ `session.attente !== undefined`), corps = `attente.question` VERBATIM (prose R1), jamais réécrit ni copié dans l'état du hook (dérivé au rendu, KR-013).
  - `entete="NON RECONNU"` — quand `avis.type === 'non_reconnu'`, corps dérivé (voir Textes exacts).
- **Bannière interface** (idiome répliqué de `ConsoleCommandes`, PAS un nouveau composant partagé — `<p role="status">` + `<span aria-hidden="true">⊘ </span>` + texte fixe, styles `--font-mono`/`--fs-meta`/`--text-muted`) : utilisée pour `avis.type === 'reformuler'`, `avis.type === 'refus_moteur'`, et toute panne réseau (`EchecCopilote`). Définie localement dans `PlayerInputBar.tsx`, zéro import de `ConsoleCommandes`.
- `ConsoleCommandes` : inchangé, aucun couplage.

### Textes exacts (constantes nommées en tête de fichier, patron `LIBELLE_*`/`PLACEHOLDER_*`/`TEXTE_*`/`ENTETE_*`)
```
LIBELLE_CHAMP         = 'QUE FAITES-VOUS ?'
PLACEHOLDER_CHAMP     = 'Décrivez ce que vous tentez…'
LIBELLE_BOUTON_REPOS  = 'TENTER'
LIBELLE_BOUTON_VERROU = '…'
MAXLONGUEUR_SAISIE    = 300   // maxLength natif sur Field, aucun message associé (le plafond HTML rend le dépassement structurellement impossible)

ENTETE_PRECISION      = 'PRÉCISEZ'
// corps : attente.question, verbatim, jamais réécrit

ENTETE_NON_RECONNU    = 'NON RECONNU'
// corps, gestes_possibles non vide :
GABARIT_NON_RECONNU   = (labels) => `Action non reconnue. Actions possibles ici : ${labels.join(', ')}.`
// corps, gestes_possibles vide (court-circuit, aucun geste satisfiable) :
TEXTE_IMPASSE         = 'Aucune action ne semble possible ici.'

TEXTE_REFORMULER      = 'Reformulez votre action.'          // bannière interface, PAS OutcomeBlock
TEXTE_REFUS_MOTEUR    = "Cette action n'a pas pu s'exécuter."  // bannière interface
TEXTE_INDISPONIBLE    = 'Le service est momentanément indisponible.'  // bannière interface — SOUS RÉSERVE (voir § 8, désaccord 23) : dev-contrat vérifie d'abord si un texte équivalent existe déjà pour un des 6 rôles actuels de CopiloteService et le réutilise verbatim le cas échéant
```
`GABARIT_NON_RECONNU` dérive ses labels de `COMMANDES[id].label` pour `id` dans `avis.gestes_possibles` **uniquement** (jamais la liste complète du registre) — un geste dont aucune cible n'est atteignable au tour courant n'est jamais annoncé comme possible.

### Tokens (aucun nouveau — tous déjà en usage dans `OutcomeBlock.tsx` / `ConsoleCommandes.tsx` / `Field.tsx`)
`--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-row`, `--fs-meta`, `--track-eyebrow`, `--track-eyebrow-wide`, `--text-label`, `--text-body`, `--text-strong`, `--text-faint`, `--text-muted`, `--text-on-accent`, `--border-field`, `--border-card`, `--r-md`, `--r-lg`, `--surface-sunken`, `--surface-card`, `--accent`, `--space-2`, `--space-3`, `--space-5`, `--space-7`, `--hit-target`, `--bw-hair`, `--lh-body`, `--lh-loose`.

### États
| `avis` / issue | Champ | Texte saisi | Bouton | Affiché |
|---|---|---|---|---|
| Défaut (avant 1re saisie) | actif | vide, placeholder visible | `TENTER` actif (accent) | rien |
| Verrouillé (appel modèle en cours) | `disabled` | conservé | `disabled`, `…` | rien |
| `avis.type === 'aucun'` (commande acceptée) | remonté (`key=session.horloge.tour`), vidé + `autoFocus` | vidé | `TENTER` actif | rien |
| `avis.type === 'refus_moteur'` | actif | conservé | `TENTER` actif | bannière `⊘ Cette action n'a pas pu s'exécuter.` |
| `avis.type === 'non_reconnu'` | actif | conservé | `TENTER` actif | `OutcomeBlock entete="NON RECONNU"` + gabarit dérivé ou texte d'impasse |
| `avis.type === 'clarification'` | actif | conservé | `TENTER` actif | `OutcomeBlock entete="PRÉCISEZ"` + `attente.question` verbatim |
| `avis.type === 'reformuler'` (anti-boucle ou illisible après rejeu) | actif | conservé | `TENTER` actif | bannière `⊘ Reformulez votre action.` |
| `EchecCopilote` (indisponible / annulé / trop-long) | actif | conservé (session à la même référence) | `TENTER` actif | bannière `⊘ Le service est momentanément indisponible.` |

### Clavier
- `Entrée` soumet nativement (un seul `<input>` dans un `<form>`) — aucun `onKeyDown` maison.
- `disabled` réel → `Tab` saute champ et bouton pendant le verrou (natif, gratuit).
- `autoFocus` sur remontage (`key={session.horloge.tour}`), jamais de gestion manuelle de focus ailleurs.
- Pas de `Modal` dans ce flux → pas de règle de retour de focus déclencheur.

### Registres de langue
- `PlayerInputBar` (label, placeholder, bouton) : registre interface mono-majuscule (`QUE FAITES-VOUS ?`, `TENTER`) ; placeholder 2e personne (frontière normale de `Field`).
- Prose de clarification (verbatim R1) : registre JOUEUR, 2e personne, présent.
- Tous les autres textes fixes (`NON RECONNU`, impasse, reformuler, refus moteur, indisponible) : registre INTERFACE PLAT, jamais la voix du narrateur — le moteur ne doit jamais affirmer un fait sur le héros que l'auteur n'a pas écrit.
- `ConsoleCommandes` : registre développeur-débogueur, inchangé, zéro mélange.

*(Écrit par l'UX, amendé par Narratif & IA au tour 2 — voir § 8.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `CopiloteService.demander('interprete', …)` | service | émet (7ᵉ branche) | `demander(dossier: Dossier, cible: { role: 'interprete'; saisie: string; session: EtatSession }, signal?: AbortSignal): Promise<ReponseInterprete>` |
| `EtatSession.attente` | type | émet (champ neuf) | `readonly attente?: AttenteClarification` — `interface AttenteClarification { readonly type: 'clarification'; readonly question: string; readonly saisie: string }` — optionnel à vie (KR-251), **jamais** `X \| null` |
| `sessionDestinations.ts` | registre | émet (lignes neuves) | `attente: 'moteur'` (racine porteuse) · `attente.type: 'moteur'` · `attente.question: 'ia'` · `attente.saisie: 'ia'` |
| `brain/dossier/interprete.ts` | registre | émet (module neuf) | `resoudreInterpretation(tables: TablesInterprete, rendu: InterpretationRendue): SortieInterprete \| RefusInterprete` (re-résolution pure) + `apresInterpretation(dossier: Dossier, session: EtatSession, reponse: ReponseInterprete): { session: EtatSession; avis: AvisInterprete }` (transition pure, seul décideur de l'anti-boucle KR-264 et de la clôture d'`attente`) |
| `worker/index.ts` | registre | émet (entrée neuve) | `INVITES['interprete']`, `GABARIT_SORTIE['interprete']` — contrat de route à 7 branches inchangé |
| `commandes.ts` (`executerCommande`) | service | consomme (inchangé) | `apresInterpretation` appelle `executerCommande(dossier, session, commande)` — MÊME entonnoir que la console, jamais réimplémenté |
| `Field` (`brain/components`) | composant | émet (extension) | `disabled?: boolean`, `maxLength?: number` — additifs, un seul appelant neuf (`PlayerInputBar`) |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | `canon.ton` / `canon.interdits_ton[]` (si écrits) · candidats-lieux en rangs `P1…Pn` (étiquette = `monde.lieux[].description`, JAMAIS `nom` — KR-262 ; source = `destinationsPossibles`, même fonction que `TRANSITIONS.aller`) · gestes en rangs `G1…Gk` dérivés de `COMMANDES` à chaque appel (l'invite ne connaît AUCUN verbe/clé/libellé de `COMMANDES`) · description du lieu courant (`ICI`, sans rang, jamais désignable) · `attente.question`/`attente.saisie` si une attente est en cours · la saisie du joueur, normalisée, en dernier |
| Schéma de sortie | Réseau (`InterpretationRendue`, jamais ré-exporté) : `{geste: RangInjecte; designe: readonly RangInjecte[]}` \| `{precision: string}` \| `{sans_commande: true}`. Résolu (`SortieInterprete`, seul type vu par la feature) : `{lecture:'commande'; commande: Commande}` \| `{lecture:'clarification'; question: string}` \| `{lecture:'sans_commande'; gestes_possibles: readonly CommandeId[]}`. **Zéro clé commune** entre réseau et résolu, et le réseau ne contient JAMAIS un identifiant du dossier (KR-231) — seulement des rangs. |
| Validation (`validerInterprete`, ordre strict) | objet simple à clés exactes → branche `geste` : `geste ∈ rangsGestes` (pas de normalisation de casse), `designe` de longueur `=== COMMANDES[geste].refKinds.length` (arité, **seul décideur** de ce chemin, KR-013), chaque élément `∈ rangsLieux` → branche `precision` : chaîne non vide, ≤ 120 caractères, finit par `?`, sans `MARQUEUR_A_ECRIRE`, sans identifiant ni rang, refusée si `rangsLieux.size < 2` → branche `sans_commande` : `=== true` |
| Échec de validation | Rejeu EXACTEMENT une fois (`jusquAuRejeuUnique`, précédent des 6 rôles existants), puis dégradation : `avis.type === 'reformuler'`, texte fixe, jamais un texte neutre écrit comme de la fiction |
| Mémoire | Rien d'un tour à l'autre sauf `attente` (jamais le journal, jamais `memoire`) ; le journal ne stocke que des `Commande` structurées, jamais la saisie brute ni la prose de R1 |
| Ce que l'IA **ne** fait **pas** | Ne lance aucun dé, ne modifie aucune statistique, ne connaît aucun verbe/libellé de `COMMANDES`, ne connaît aucun texte d'interface (`PRÉCISEZ`, `NON RECONNU`, les messages fixes), ne connaît aucune règle de jeu (§ J1, tours, seuils) — elle traduit, elle ne raconte pas (R3 n'existe pas encore) |

## 5 — Lots

### Lot 1 — `interprete-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser le 7ᵉ rôle de `CopiloteService`, la re-résolution et la transition pures, et la clé `attente` de `EtatSession` — rien de tout cela n'a de consommateur avant le Lot 2, mais tout y est verrouillé par type et par test.
- **Fichiers** :
  - `src/brain/dossier/session.ts` (R) — `attente?: AttenteClarification`
  - `src/brain/dossier/sessionDestinations.ts` (R) — 4 lignes neuves, commentaire "zéro ligne ia" corrigé
  - `src/brain/dossier/interprete.ts` (N) — `resoudreInterpretation`, `apresInterpretation`
  - `src/brain/dossier/interprete.test.ts` (N)
  - `src/brain/copilote/types.ts` (R) — `InterpretationRendue`, `SortieInterprete`, `TablesInterprete`, `AvisInterprete`
  - `src/brain/copilote/schemaSortie.ts` (R) — `validerInterprete`
  - `src/brain/copilote/schemaSortie.test.ts` (R) — mutants obligatoires (arité, garde `<2`, scanner de rangs)
  - `src/brain/copilote/contexte/interprete.ts` (N) — `assemblerInterprete`
  - `src/brain/copilote/contexte/index.ts` (R)
  - `src/brain/copilote/contexte.test.ts` (R)
  - `src/brain/CopiloteService.ts` (R) — 7ᵉ branche, garde `never`
  - `src/brain/CopiloteService.test.ts` (R)
  - `worker/index.ts` (R) — `INVITES['interprete']`, `GABARIT_SORTIE['interprete']` seuls (**pas** `'narrateur'`)
  - `worker/index.test.ts` (R)
  - `src/brain/index.ts` (R) — ré-exports
- **Expose** :
  ```ts
  demander(dossier: Dossier, cible: { role: 'interprete'; saisie: string; session: EtatSession }, signal?: AbortSignal): Promise<ReponseInterprete>
  apresInterpretation(dossier: Dossier, session: EtatSession, reponse: ReponseInterprete): { session: EtatSession; avis: AvisInterprete }
  type AvisInterprete =
    | { readonly type: 'aucun' }
    | { readonly type: 'non_reconnu'; readonly gestes_possibles: readonly CommandeId[] }
    | { readonly type: 'clarification'; readonly question: string }
    | { readonly type: 'reformuler' }
    | { readonly type: 'refus_moteur' }
  ```
- **Critères couverts** : #1, #2, #3, #4, #5, #8

### Lot 2 — `interprete-feature`
- **Ouvrier** : `dev-lot`
- **But** : le champ de saisie joueur, le verrou de tour, et la réécriture nommée de `moteurSansIA.test.ts` — contrat du Lot 1 lu comme donnée immuable.
- **Fichiers** :
  - `src/brain/components/Field.tsx` (R) — `disabled?`, `maxLength?`
  - `src/brain/components/Field.test.tsx` (R) — témoins `disabled`/`maxLength` produisent l'attribut HTML réel
  - `src/features/play-mode/components/PlayerInputBar.tsx` (N)
  - `src/features/play-mode/components/PlayerInputBar.test.tsx` (N)
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (N) — verrou de tour (KR-265), appelle `demander` puis `apresInterpretation`, applique le résultat
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (N)
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — câblage, `ConsoleCommandes` inchangée
  - `src/features/play-mode/tests/moteurSansIA.test.ts` (R) — exclusion nommée `[useTourDeJeu.ts]`, mutant obligatoire
- **Consomme** : l'interface exposée par le Lot 1, telle quelle.
- **Critères couverts** : #1, #2, #3, #4, #6, #7, #8

## 6 — Critères d'acceptation

1. **Étant donné** un texte joueur qui désigne un déplacement reconnu par `lieux[].acces`, **quand** R1 le traduit, **alors** `apresInterpretation` rend `{session (mise à jour par executerCommande), avis:{type:'aucun'}}` — MÊME entonnoir que la console. — *niveau : unitaire* — *lot 1*
2. **Étant donné** un texte joueur ambigu sur une cible réelle (≥2 lieux rangés) sans attente déjà pendante, **quand** R1 ne peut pas trancher, **alors** `attente` est posée et `avis = {type:'clarification', question}` — prose contrainte (≤120 car., finit par `?`, sans identifiant/rang/marqueur). — *niveau : unitaire* — *lot 1*
3. **Étant donné** un texte joueur hors `COMMANDES` ou un court-circuit sans geste satisfiable, **quand** R1 le traite, **alors** `avis = {type:'non_reconnu', gestes_possibles}` — message dérivé de `COMMANDES[].label`, jamais écrit en dur, jamais une clarification utilisée comme refus déguisé. — *niveau : unitaire* — *lot 1*
4. **Étant donné** une attente déjà pendante ou une sortie illisible après un rejeu, **quand** une nouvelle réponse arrive, **alors** `avis = {type:'reformuler'}` (message fixe), `attente` retirée, jamais un second état d'écran (KR-264, garde anti-boucle). — *niveau : unitaire* — *lot 1*
5. **Étant donné** une sortie de modèle non conforme au schéma, **quand** elle est reçue, **alors** elle est rejouée EXACTEMENT une fois puis dégradée — jamais un état corrompu. — *niveau : contrat* — *lot 1*
6. **Étant donné** deux soumissions du champ de saisie dans le même tick, **quand** le verrou de tour est actif (KR-265), **alors** EXACTEMENT UN appel à `CopiloteService.demander` part. — *niveau : composant* — *lot 2*
7. **Étant donné** le périmètre balayé par `moteurSansIA.test.ts` (KR-260, réécrit), **quand** un fichier de production de `src/player/` ou `src/brain/dossier/` est lu, **alors** aucun n'appelle `fetch`/`CopiloteService`/une URL `/ia/` (interdiction TOTALE inchangée) ; SEULE `src/features/play-mode/` porte une exclusion nommée par fichier (`useTourDeJeu.ts`), avec mutant obligatoire vérifié rouge. — *niveau : balayage de code* — *lot 2*
8. **Étant donné** l'exécution d'une commande acceptée, **quand** le journal est écrit, **alors** il ne stocke qu'une `Commande` structurée (verbe + cibles résolues), jamais la saisie brute ni la prose de R1 (KR-248 étendu, préparation du rejeu déterministe n°11). — *niveau : unitaire* — *lot 1 (forme) + lot 2 (câblage)*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `interprete.test.ts` → aller reconnu | `resoudreInterpretation` rend `{lecture:'commande', commande:{commande:'aller',cibles:[id]}}` sur un rang connu | unitaire | — | 1 |
| `interprete.test.ts` → 6 témoins d'échec | `designe` de longueur ≠ arité, clés mêlées, `sans_commande:false`, `g1` non normalisé, précision contenant un rang, précision avec table < 2 lieux → chacun un motif exact | unitaire | KR-231 | 1 |
| `interprete.test.ts` → anti-boucle | attente déjà pendante + nouvelle réponse quelconque → `avis.type==='reformuler'`, attente retirée, un seul appel modèle consommé | unitaire | KR-264 | 1 |
| `interprete.test.ts` → apresInterpretation appelle executerCommande | sur `lecture:'commande'`, la session rendue est `toEqual` à celle que produirait `executerCommande` appelé directement | unitaire | KR-013 | 1 |
| `schemaSortie.test.ts` → mutant arité | retirer `designe.length === refKinds.length` → ROUGE | mutation ciblée | KR-231 | 1 |
| `schemaSortie.test.ts` → mutant garde `<2` | retirer `rangsLieux.size < 2` → ROUGE | mutation ciblée | KR-264 | 1 |
| `schemaSortie.test.ts` → mutant scanner de rangs | retirer `porteUnRang` → ROUGE | mutation ciblée | KR-231 | 1 |
| `CopiloteService.test.ts` → rejeu-un-coup rôle `interprete` | réponse fautive puis valide = 2 `fetch`, corps `toEqual`, résolus contre la même table ; deux fautives = dégradation ; 503/413/réseau/abandon = 1 `fetch` | contrat | — | 1 |
| `contexte.test.ts` → contexte ne grossit pas avec la session | contexte assemblé sur session neuve au lieu X vs après 40 `ALLER` acceptés revenant en X → `toEqual` | unitaire | KR-261 (préparation) | 1 |
| `worker/index.test.ts` → INVITES/GABARIT ne récitent aucun texte d'interface ni verbe de COMMANDES | balayage littéral de `INVITES.interprete`/`GABARIT_SORTIE.interprete` contre la liste des interdits | contrat | KR-236 | 1 |
| `Field.test.tsx` → `disabled`/`maxLength` réels | `disabled`/`maxLength` posés produisent l'attribut HTML, pas un habillage visuel seul | composant | — | 2 |
| `PlayerInputBar.test.tsx` → aucun import croisé avec `ConsoleCommandes` | garde statique, les deux sens | composant | — | 2 |
| `useTourDeJeu.test.ts` → deux appels rapides → un seul copilote | `executeAction` appelé deux fois consécutivement (`await Promise.resolve()` entre les deux) → `jest.spyOn(CopiloteService,'demander')` `toHaveBeenCalledTimes(1)` | composant | KR-265 | 2 |
| `useTourDeJeu.test.ts` → journal stocke une Commande, jamais la saisie | après acceptation, `journal` ne contient aucune sous-chaîne de la saisie brute | composant | KR-248 | 2 |
| `useTourDeJeu.test.ts` → lieu sans description | un accès sans `description` (ou marquée) ne reçoit aucun rang ; `executerCommande(ALLER <id>)` reste accepté en console | composant | KR-267 (nouveau) | 2 |
| `moteurSansIA.test.ts` → mutant KR-260 | import de `CopiloteService` hors liste dans `play-mode/` → ROUGE → retrait | balayage de code | KR-260 | 2 |

Cas limites couverts : vide (saisie vide → `sans_commande`/impasse) · très long (saisie ≥300 car., `precision` ≥120 car.) · doublon (rang recopié en boucle, précision citant un rang) · hors ligne (`EchecCopilote`) · référence orpheline (lieu sans description) · annulation (`AbortSignal`) · double soumission (verrou KR-265).

**Non vérifiable en l'état** — aucun critère de cette itération n'est hors instrument existant (jest + Testing Library couvrent tout le périmètre it1 ; le score de mutation `brain/` ne s'applique pas, `interprete.ts`/`schemaSortie.ts` ne sont pas dans son périmètre des 4 fichiers de règles).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | `acceptance_criteria` de la spec mélange les 4 itérations sans balise | `RETENU` | Sous-ensemble it1 gelé au § 6 de ce plan + reporté dans `specification.json` à l'étape 7 (§ 2 hors-périmètre explicite) |
| 2 | QA | Contrat de `SortieInterprete` non gravé avant le code | `RETENU` | Formalisé au § 4 bis, forme finale de narratif-ia (tour 2), adoptée par tech-lead |
| 3 | QA | Aucun test d'isolation du verrou de tour nommé avant le code | `RETENU` | Test nommé au § 7 (`useTourDeJeu.test.ts → deux appels rapides`) |
| 4 | QA | Scinder `moteurSansIA.test.ts` en 2 phases (liste vide puis remplie) pour éviter une fenêtre d'observabilité aveugle | `REJETÉ` | Le lot 2 livre `moteurSansIA.test.ts` et `useTourDeJeu.ts` dans le MÊME commit atomique — aucune fenêtre où la liste nomme un fichier fantôme (tech-lead, tour 2) |
| 5 | Tech Lead | `narrateur.ts`/`INVITES['narrateur']` hors périmètre it1 | `RETENU` | Consensus unanime des 5 rôles au tour 2 ; absent du Lot 1 |
| 6 | Tech Lead (tour1) | Forme `SortieInterprete = {commande:Commande}\|{precision}\|{hors_commandes:true}` | `REJETÉ` | Viole KR-231 (collision de clé `commande`/`Commande` et `precision` non discriminée par littéral) — tech-lead la retire lui-même au tour 2 |
| 7 | Narratif & IA | Veto : la forme réseau ne doit jamais partager de clé avec le domaine (`Commande`) ni permettre un contournement du validateur | `RETENU` | Forme finale `InterpretationRendue`/`SortieInterprete` au § 4 bis, vérifiée par paires de clés disjointes |
| 8 | Narratif & IA | Veto : la sortie de R1 ne doit jamais passer par `analyserSaisie` (QA l'avait citée par erreur) | `RETENU` | § 7 corrigé : tests via `validerInterprete` + `resoudreInterpretation` (Map.get), jamais `analyserSaisie` |
| 9 | Narratif & IA | `TRANSITIONS.aller` lit `cibles[0]` sans revérifier l'arité | `RETENU` | `validerInterprete` est le gatekeeper UNIQUE de l'arité sur ce chemin (KR-013) ; mutant obligatoire au § 7 ; `interprete.ts` ne revérifie pas (éviterait un second décideur) |
| 10 | Narratif & IA | Saisie et question de clarification sans borne | `RETENU` | `SAISIE_CARACTERES_MAX=300` (maxLength natif), `PRECISION_CARACTERES_MAX=120` (validateur) — § 3 et § 4 bis |
| 11 | Narratif & IA | Clarification représentable avec moins de 2 lieux rangés | `RETENU` | Motif `schema` dans `validerInterprete` si `rangsLieux.size < 2` |
| 12 | Tech Lead / Narratif & IA | `attente: X \| null` vs `attente?: X` | `RETENU` | Optionnel (`attente?: AttenteClarification`), jamais `\| null` — KR-251, docstring `session.ts:114-116` citée par narratif-ia, confirmée par tech-lead après relecture |
| 13 | Narratif & IA | `attente.question`/`attente.saisie` doivent être audience `'ia'`, pas `'moteur'` | `RETENU` | Déjà aligné dans la table de tech-lead (tour 2) ; sans quoi le modèle ne verrait jamais sa propre question |
| 14 | Narratif & IA | La cible du rôle `interprete` doit porter `session: EtatSession`, pas seulement `lieuCourant` | `RETENU` | L'assembleur a besoin de `destinationsPossibles`+`attente` ; KR-265 exige le même instantané pour `executerCommande` |
| 15 | Narratif & IA | Une seule fonction pure de transition dans `brain/` (`apresInterpretation`), plutôt que la logique éclatée dans le hook | `RETENU` | Ajoutée à `interprete.ts` (Lot 1) — centralise l'anti-boucle et la clôture d'`attente`, KR-013 (un seul décideur) |
| 16 | UX vs Narratif & IA | Mot d'entête pour `sans_commande` : `SANS EFFET` (UX) ou `NON RECONNU` (narratif-ia) | `RETENU : NON RECONNU` | `SANS EFFET` collisionne avec le vocabulaire « effet » déjà réservé par `docs/REGLES-PLAY.md` § J1 (action acceptée sans effet sur le monde) et anticipe un 3ᵉ résultat de fiction que n°11 doit nommer librement |
| 17 | Narratif & IA | Registre du message `sans_commande` : voix narrative (« vous ne savez pas encore… ») vs interface plate | `RETENU : interface plate` | Le moteur ne doit jamais affirmer un fait sur le héros que l'auteur n'a pas écrit ; gabarit corrigé au § 3 |
| 18 | UX | Rendu de « refus moteur »/« indisponible » : bannière interface répliquée de `ConsoleCommandes`, pas `OutcomeBlock` | `RETENU` | `OutcomeBlock` réservé à la prose/corps instructif dérivé, jamais à un aveu technique |
| 19 | Narratif & IA | « Reformulez votre action. » doit sortir d'`OutcomeBlock`/`PRÉCISEZ` pour préserver l'invariant `PRÉCISEZ ⇔ attente pendante` | `RETENU` | Rendu par la bannière interface (§ 3), pas `OutcomeBlock` — corrige la proposition initiale d'UX (tour 1) qui le logeait sous `entete="PRÉCISEZ"` |
| 20 | UX | `Field` doit gagner `disabled`/`maxLength` en extension additive, pas un composant maison | `RETENU` | § 4, Lot 2 |
| 21 | PM (proposé par narratif-ia) | Un lieu accessible sans `description` devient inatteignable en saisie libre — qui porte la charge d'un contrôle auteur ? | `REPORTÉ` | `open_questions` de `specification.json`, KR-267 nouveau, propriétaire `dossier-controles` — ouvrir une feature d'auteur dans cette itération romprait la tranche verticale unique (`brain/`+`play-mode`) ; test de caractérisation ajouté au § 7 |
| 22 | PM | `canon.ton` non requis → aucune clarification n'atteint jamais le joueur sans lui, dégradation silencieuse | `RETENU tel quel` | Dégradation gracieuse, même patron que R3/budget (it4, §2.8 garde-fou 4) — doctrine squelette d'abord |
| 23 | UX | Textes `TEXTE_REFUS_MOTEUR`/`TEXTE_INDISPONIBLE` proposés à titre provisoire | `RETENU sous réserve` | `dev-contrat` vérifie d'abord si un texte équivalent existe déjà pour un des 6 rôles actuels de `CopiloteService` et le réutilise verbatim le cas échéant, sinon garde les textes du § 3 |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(supprimé — aucune proposition hors-cadre au-delà de ce que le cadre autorisait déjà)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — NON DÉCLENCHÉ (aucun des 4 fichiers de règles de jeu n'est touché par cette itération)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`moteur-dossier`, `dossier-copilote`)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-interprete-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | Sous-ensemble it1 gelé dans `specification.json` à l'étape 7 |
| Tech Lead | recevable sous réserve | Forme finale de sortie IA adoptée, table de lots révisée intégrée |
| UX | recevable sous réserve | Contrat de design complété (§ 3), un mot d'entête corrigé par arbitrage (désaccord 16) |
| QA | recevable sous réserve | Tests d'isolation et mutants intégrés au § 7 |
| Narratif & IA | recevable sous réserve | Forme de sortie IA, bornes de caractères et transition pure intégrées au § 4 bis / Lot 1 |
