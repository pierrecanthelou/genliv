# Plan d'itération — `moteur-fins` · itération `2`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-07
> Composition : 5 rôles — motif : itération touche le moteur, la mémoire de session et le mode jeu
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut reprendre sa partie là où il l'avait laissée après rechargement, ou en démarrer une nouvelle si la sauvegarde est périmée ou illisible. » |
| **Tranche** | `EcranPartie` → `AiguillagePartie` → `MagasinDeSession.lire` → `validerSession` → `PersistenceService` |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1) |
| **Hors périmètre** | mort du héros (→ it3), bandeau de l'écran de fin (→ it3), `TEXTE_MORT_HEROS` (→ it3), `effacer` (REJETÉ it1), sauvegardes multiples (G3), session au nuage, réparation de session, même graine (→ it4), `refus` dans `illisible` (→ it3) |
| **Reporté** | renumérotation n=3→4 (it2=reprise, it3=mort+bandeau, it4=graine sacrifiable) — à écrire dans spec |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut reprendre sa partie là où il l'avait laissée après rechargement, ou en démarrer une nouvelle si la sauvegarde est périmée ou illisible. »

## 2 — Hors périmètre

- **Mort du héros** : écran, texte constant, garde R5, bandeau → it3 (PM veto, consensus total).
- **Bandeau de l'écran de fin** : n'a rien à voir avec la reprise → it3.
- **`TEXTE_MORT_HEROS`**, voix factuelle, ligne de journal → it3 (NIA reporté).
- **`refus` dans `illisible`** : aucun lecteur en it2 (KR-249) → it3.
- **`effacer`** : REJETÉ en it1.
- **Sauvegardes multiples**, session au nuage, réparation de session.
- **Même graine** (Rejouer) → it4 (sacrifiable).
- **Cas limites navigateur** (retour arrière, hors ligne, crash) → it3/it4.

## 3 — Contrat de design

### EcranReprise (nouveau composant)

Composant dédié aux refus de session (périmé/illisible). **Pas** une extension d'`EcranRefus` — son registre vise la route (dossier introuvable/non jouable), pas la session.

#### `session_perimee`
- **Titre** : « Cette partie n'est plus à jour »
- **Texte** : « Le dossier a changé depuis votre dernière partie. Elle ne peut pas reprendre là où vous l'aviez laissée. »
- **Bouton** : `↻ Nouvelle partie` — style accent partagé (`boutonPrimaire.ts`)
- Focus automatique sur le bouton. Entrée relance.

#### `session_illisible`
- **Titre** : « Cette partie ne peut pas être lue »
- **Texte** : « La sauvegarde est endommagée. Une nouvelle partie la remplacera. »
- **Bouton** : `↻ Nouvelle partie` — style accent partagé
- Focus automatique sur le bouton. Entrée relance.

#### Tokens
`--space-*`, `--r-xl`, `--border-field`, `--accent`, `--text-on-accent`, `--hit-target`, `--text-strong`.

### Nouvelle partie sur partie en cours

- `IconButton` ↻ en `actionsEntete`, après 🗝, avant ✕.
- `Modal` avec `focusCancel={true}` :
  - Titre : « Abandonner la partie en cours »
  - Texte : « La progression de cette partie sera effacée. Le dossier n'est pas modifié. »
  - Boutons : `Annuler` (focus initial) et `Nouvelle partie` (`color="error"`).
  - Échap ferme le dialogue. Focus rendu au ↻ à la fermeture.

### Reprise valide

Aucun interstitiel. La partie reprend directement. `BandeauHeros` conservé.

### Style bouton accent partagé

`boutonPrimaire.ts` — constante de style partagée par `EcranRefus` et `EcranReprise` (deux appelants nommés). Aucun composant maison, juste les props du bouton.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `LectureSession` | type | expose | union discriminée `'absente' \| 'reprenable' \| 'perimee' \| 'illisible'` |
| `MagasinDeSession.lire` | service | expose | `lire(dossier: Dossier): LectureSession` |
| `Modal.focusCancel` | composant | expose | `focusCancel?: boolean` (défaut `false`) |

`validerSession` n'est PAS exporté par le baril (KR-109, aucun appelant feature).

## 4 bis — Contrat de sortie IA

**AUCUN.** It2 est 100 % code, 0 % IA. Aucun appel modèle. La mémoire, le journal et le combat sont rechargés tels quels depuis le JSON persisté. La frontière code/IA tient.

## 5 — Lots

### Lot 1 — `contrat-reprise` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : port `lire` sur `MagasinDeSession`, `validerSession`, `LectureSession`, `focusCancel` sur `Modal`
- **Fichiers** :
  - `src/brain/dossier/reprise.ts` (N) — `validerSession`, `LectureSession`
  - `src/brain/dossier/reprise.test.ts` (N) — 4 discriminants nommés + aller-retour JSON
  - `src/brain/dossier/session.ts` (R) — port `lire` dans l'interface `MagasinDeSession`
  - `src/brain/MagasinDeSession.ts` (R) — implémenter `lire`
  - `src/brain/MagasinDeSession.test.ts` (R) — 4 verdicts, mise à jour du test `Object.keys`
  - `src/brain/index.ts` (R) — `export type { LectureSession }`
  - `src/brain/components/Modal.tsx` (R) — prop `focusCancel`
  - `src/brain/components/Modal.test.tsx` (R) — focus sur Annuler, focus rendu, défaut inchangé
- **Expose** :
  ```ts
  export type LectureSession =
    | { readonly statut: 'absente' }
    | { readonly statut: 'reprenable'; readonly session: EtatSession }
    | { readonly statut: 'perimee' }
    | { readonly statut: 'illisible' }

  // reprise.ts (pas exporté par le baril)
  export function validerSession(brut: unknown, dossier: Dossier): LectureSession
  // Ordre : null/undefined → absente ; schema/dossier_id/forme → illisible ;
  // dossier_maj !== dossier.updatedAt → perimee ; sinon reprenable (session === brut, toBe).
  // Table de validateurs { [K in keyof EtatSession]-?: (v: unknown) => boolean } :
  // une 12e clé racine ne compile pas sans sa ligne.
  // Vérifie la forme de memoire : null | objet { faits_etablis: tableau, resume?: { texte: string, jusqu_au_pas: number } }.
  // N'exécute PAS I1-I5 (propriétés du chemin d'écriture, pas du lecteur).

  // MagasinDeSession
  lire(dossier: Dossier): LectureSession
  // brut.get(dossierSessionKey(dossier.id)), JSON non parsable === absente

  // session.ts : import type { LectureSession } (aucun cycle d'exécution)
  // reprise.ts importe SCHEMA_SESSION en valeur

  // Modal
  focusCancel?: boolean  // défaut false — focus sur Annuler à l'ouverture
  ```
- **Critères couverts** : #6, #7 (unitaire)

### Lot 2 — `feature-reprise`
- **Ouvrier** : `dev-lot`
- **But** : `AiguillagePartie`, `EcranReprise`, bouton ↻ Nouvelle partie, intégration reprise
- **Fichiers** :
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — monte `<AiguillagePartie>` à la place de `<PartieDemarree>`
  - `src/features/play-mode/components/AiguillagePartie.tsx` (N) — aiguillage par `LectureSession` + `finAtteinte`
  - `src/features/play-mode/components/EcranReprise.tsx` (N) — écran périmé/illisible
  - `src/features/play-mode/components/EcranReprise.test.tsx` (N) — deux cas (périmé, illisible)
  - `src/features/play-mode/components/boutonPrimaire.ts` (N) — style accent partagé
  - `src/features/play-mode/components/EcranRefus.tsx` (R) — importe `boutonPrimaire`
  - `src/features/play-mode/components/PartieEnCours.tsx` (R) — ↻ en `actionsEntete`, dialogue, prop `onNouvellePartie`
  - `src/features/play-mode/tests/reprise.test.tsx` (N) — tests d'intégration composant
  - `src/features/play-mode/hooks/useSessionPersistee.ts` (R) — docstring périmée
- **Consomme** :
  ```ts
  // depuis brain/
  import type { LectureSession } from '../../../brain'
  // sessions.lire(dossier) dans useState initializer (KR-305)

  interface AiguillagePartieProps {
    readonly dossier: Dossier
    readonly dossierId: string
    readonly tirerGraine: () => number
  }

  interface EcranRepriseProps {
    readonly statut: 'perimee' | 'illisible'
    readonly onNouvellePartie: () => void
  }

  // Aiguillage (calculé en ligne, sans miroir) :
  // lecture = useState(() => sessions.lire(dossier))
  // generation = useState(0)
  // generation === 0 && reprenable sans finAtteinte → <PartieEnCours key="reprise">
  // generation === 0 && (perimee || illisible) → <EcranReprise>
  // sinon → <PartieDemarree key={generation}>
  // onNouvellePartie = setGeneration(g => g + 1)
  ```
- **Critères couverts** : #1, #2, #3, #4, #5, #7 (composant)

## 6 — Critères d'acceptation

1. **Étant donné** aucune sauvegarde pour ce dossier, **quand** l'auteur ouvre l'Aperçu, **alors** une nouvelle partie démarre normalement (graine tirée, `ouvrirSession`). — *unitaire + composant* — *lot 1, lot 2*
2. **Étant donné** une session reprenable (même `dossier_maj`), **quand** l'auteur ouvre l'Aperçu, **alors** la partie reprend à l'état sauvegardé sans interstitiel, avec `BandeauHeros` conservé. — *composant* — *lot 2*
3. **Étant donné** une session périmée (`dossier_maj` différent), **quand** l'auteur ouvre l'Aperçu, **alors** il voit « Cette partie n'est plus à jour » avec le bouton `↻ Nouvelle partie`. — *composant* — *lot 2*
4. **Étant donné** une session illisible (JSON corrompu ou clé racine manquante/type erroné), **quand** l'auteur ouvre l'Aperçu, **alors** il voit « Cette partie ne peut pas être lue » avec le bouton `↻ Nouvelle partie`. — *composant* — *lot 2*
5. **Étant donné** une partie en cours, **quand** l'auteur clique ↻ dans l'en-tête, **alors** un dialogue « Abandonner la partie en cours » s'affiche avec focus sur Annuler ; confirmer lance une nouvelle partie. — *composant* — *lot 2*
6. **Étant donné** `validerSession(brut, dossier)`, **quand** le brut est conforme, **alors** `reprenable` avec `session === brut` (toBe, pas copie) ; **quand** une clé manque ou a un type erroné (y compris `memoire`), **alors** `illisible`. — *unitaire* — *lot 1*
7. **Étant donné** un statut périmé ou illisible affiché, **quand** aucune action, **alors** `sessions.ecrire` n'est jamais appelé (KR-305). — *unitaire + composant* — *lot 1, lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `absente – lire rend { statut: 'absente' } quand get rend null` | `expect(result).toEqual({ statut: 'absente' })` | jest | KR-199 | 1 |
| `reprenable – lire rend reprenable quand dossier_maj correspond` | `expect(result.session).toBe(brut)` (identité) | jest | KR-199, KR-116 | 1 |
| `perimee – lire rend perimee quand dossier_maj diffère` | `expect(result).toEqual({ statut: 'perimee' })` | jest | KR-199, KR-305 | 1 |
| `illisible – lire rend illisible quand clé racine manque` | `expect(result).toEqual({ statut: 'illisible' })` | jest | KR-199, KR-116 | 1 |
| `illisible – memoire corrompue rend illisible` | forme erronée de `memoire` → `illisible` | jest | KR-116, NIA | 1 |
| `aller-retour JSON – session écrite par les vraies portes se relit reprenable` | `ecrire` → `lire` → `reprenable` | jest | — | 1 |
| `focusCancel – focus sur Annuler quand le dialogue s'ouvre` | `document.activeElement` = bouton Annuler | RTL | — | 1 |
| `focusCancel défaut – sans la prop, pas de focus forcé` | garde-fou des 5 appelants existants | RTL | — | 1 |
| `ecrire jamais appelé tant que périmé affiché` | `expect(sessions.ecrire).not.toHaveBeenCalled()` | RTL | KR-305 | 2 |
| `AiguillagePartie monte PartieEnCours sur reprenable` | `getByText` du contenu de partie | RTL | — | 2 |
| `AiguillagePartie monte EcranReprise sur perimee` | `getByText('Cette partie n'est plus à jour')` | RTL | — | 2 |
| `Nouvelle partie via ↻ relance avec graine neuve` | `generation` incrémenté, `PartieDemarree` monté | RTL | — | 2 |

**Non-régression** : `moteurSansIA.test.ts` reste vert. Aucun appel `fetch`, aucun import `CopiloteService`, aucune route `/ia/` (KR-250/260).

**Non vérifiable en l'état** : un tour en vol (`carteJet`, R3 en vol) est de l'état React non persisté et se perd à la reprise — limite assumée, documentée dans la docstring d'`AiguillagePartie`.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Mort hors it2 | `RETENU` | Veto PM, consensus total. it3=mort+bandeau. |
| 2 | PM | Renumérotation n=3→4 | `RETENU` | it2=reprise, it3=mort, it4=graine. Écrire dans spec. |
| 3 | TL | `lire(dossier: Dossier)` au lieu de `lire(dossierId)` | `RETENU` | Correction de contradiction dans la spec. |
| 4 | TL | AiguillagePartie composant enfant | `RETENU` | Règles des hooks (useState après return anticipé). |
| 5 | TL | `illisible` sans `refus` | `RETENU` | Aucun lecteur (KR-249). `refus` → it3. |
| 6 | TL | `validerSession` hors baril | `RETENU` | KR-109, aucun appelant feature. |
| 7 | TL vs UX | EcranReprise vs EcranRefus étendu | `RETENU` (TL) | EcranRefus vise la route (dossier introuvable/non jouable). La session est un registre différent → composant dédié. |
| 8 | TL vs UX | `focusCancel` boolean vs union `'cancel'\|'confirm'` | `RETENU` (TL) | Aucun appelant pour `'confirm'` — dette d'abstraction à un seul appelant. |
| 9 | UX | focusCancel obligatoire (veto) | `RETENU` | Veto UX en domaine (accessibilité clavier). |
| 10 | TL | Modal.tsx dans lot `contrat` | `RETENU` | `brain/components/` = lot contrat. |
| 11 | QA | `ecrire` jamais appelé sur périmé/illisible | `RETENU` | Critère #7. Prouvable par mock. |
| 12 | QA | Cas limites navigateur (retour arrière, hors ligne) | `REPORTÉ` | → it3/it4, hors périmètre reprise. |
| 13 | NIA | Forme de `memoire` vérifiée dans `validerSession` | `RETENU` | Forme structurelle (null \| objet attendu). I1-I5 exclus (chemin d'écriture). |
| 14 | NIA | Texte de mort (voix, constante, journal) | `REPORTÉ` | → it3 avec la mort. |
| 15 | UX | Un seul verbe « Nouvelle partie » | `RETENU` | « Rejouer » réservé à it4 (même graine). |
| 16 | UX | Bouton accent partagé `boutonPrimaire.ts` | `RETENU` | Deux appelants nommés. |
| 17 | PM | Bandeau de l'écran de fin → it3 | `RETENU` | Pas de lien avec la reprise. |
| 18 | QA | 4 tests discriminants nommés | `RETENU` | KR-199. |
| 19 | UX | Bouton ↻ en en-tête avec dialogue | `RETENU` | Seul chemin de relance en it2. |
| 20 | TL (annexe) | `terminée` → AiguillagePartie appelle `finAtteinte` sur reprenable, pas 5e statut dans LectureSession | `RETENU` | Évite que `validerSession` appelle `evaluerExpr` (KR-238). |
| 21 | TL (annexe) | JSON non parsable ≡ absente (pas illisible) | `RETENU` | `PersistenceService.get` avale l'erreur de parse et rend `null`. Documenté en docstring. |

## 9 — Innovation

Aucune.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] `moteurSansIA.test.ts` reste vert (KR-250/260)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-fins-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | mort hors it2 (veto levé par consensus) |
| Tech Lead | recevable | Modal dans lot contrat (veto conditionnel levé) |
| UX | recevable | focusCancel ajouté (veto levé) |
| QA | recevable | critère #7 + 4 discriminants ajoutés (veto levé) |
| Narratif & IA | recevable | forme memoire dans validerSession (réserve levée) |
