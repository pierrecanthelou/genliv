# Plan d'itération — `moteur-fins` · itération `1`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-06
> Composition : 5 rôles — motif : l'itération touche le moteur de jeu et la frontière code/IA (garde R3 narrateur)
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur lit, mot pour mot, la fin qu'il a écrite quand sa condition devient vraie. » |
| **Tranche** | `finAtteinte` (evaluate.ts) → garde `partie_terminee` (commandes.ts) → garde R2/R3/R4 (useTourDeJeu) → `EcranFin` (PartieEnCours → EcranFin.tsx) via pont `player/engine/fin.ts` |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, brain/) |
| **Hors périmètre** | écran de mort · texte de mort · garde R5 (commentateur) · bouton Rejouer · persistance de session · reprise après rechargement · rejeu à graine égale · fin vraie dès l'ouverture (avant création du héros) · tout champ nouveau dans le dossier · règles ESLint nouvelles |
| **Reporté** | mort → it2 (avec arbitrage R5 nommé) · en-têtes distincts fin/mort → it2 · bouton Rejouer + focus auto → it2+ · redécoupage it2/it3/it4 → cadrage it2 · texte de mort (constante nommée) → it2 |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur lit, mot pour mot, la fin qu'il a écrite quand sa condition devient vraie.

## 2 — Hors périmètre

- Écran de mort (texte, en-tête, titre) → it2.
- Garde R5 (commentateur de combat) et arbitrage avec le livré n° 13 → it2.
- Bouton « ↻ Rejouer » et focus automatique → it2+.
- Persistance de session, reprise après rechargement → it2.
- Rejeu à graine égale → it3.
- Fin vraie dès l'ouverture ou avant la création du héros.
- Tout champ nouveau dans le dossier (schema: 1).
- Règles ESLint proposées par l'UX (5 règles) — dette à déclencheur.
- `ActionsCarnet.tsx` (extraction retirée, coupe `PartieEnCours.tsx` suffit pour KR-112).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Structure** : `<CadrePartie titre sortie={{name:'dossier',dossierId}} bandeau={<BandeauHeros …/>}>` → `PartieEnCours` → aiguillage : jeu normal OU `<section aria-label="Fin de partie">` (EcranFin).

**Composant `EcranFin`** — contenu seul, monté dans le `CadrePartie` de `PartieEnCours`.

| Cas | Titre `<h2>` | En-tête `OutcomeBlock` | Corps |
|---|---|---|---|
| Fin avec texte | `FIN · {Fin.nom}` (nom résolu par `fin_id`, jamais `condition_texte`) | `FIN — lue au joueur, mot pour mot` | `Fin.texte` verbatim (`white-space: pre-wrap`, déjà dans `OutcomeBlock`) |
| Fin sans texte (KR-307) | `FIN · {Fin.nom}` | aucun `OutcomeBlock` | Bloc pointillé invitant : « Cette fin n'a pas de texte — rédigez-la dans JALONS & FINS, onglet FINS, pour que le moteur la lise au joueur. » |

`Fin.nom` vide ou absent → `Fin sans nom`.

**Tokens**
- Titre : `--font-ui`, `--fs-h2`, `--fw-semibold`, `--track-tight`, `--text-strong`, `margin: 0`.
- `OutcomeBlock` : inchangé (`--surface-card`, `--border-card`, `--r-lg`, `--space-7`, `--fs-row`, `--lh-loose`, `--text-strong`, en-tête `--text-label`).
- Repli pointillé (KR-307) : `--bw-strong dashed --border-field`, `--r-xl`, fond `--paper-1`, padding `--space-10 --space-8`, glyphe `⬚` en `--fs-h1` / `--text-faint`, texte `--text-muted`, `--lh-body`. Même anatomie que `etatVide`.
- Interdits dans `EcranFin.tsx` : `--bad*`, `--good*`, toute ombre, tout hex ou `rgb()`.

**Clavier** : Échap via `CadrePartie` (déjà câblé, navigue vers `sortie`). Pas de bouton Rejouer en it1. Pas de focus automatique.

**États** : fin avec texte · fin sans texte · pas d'état chargement (synchrone) · pas d'état erreur dans EcranFin.

*(Écrit par l'UX.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `finAtteinte` | service | émet | `finAtteinte(dossier: Dossier, session: { readonly monde: FaitsDeSession; readonly combat?: unknown }): FinAtteinte \| undefined` |
| `FinAtteinte` | type | émet | `{ readonly fin_id: string; readonly texte?: string }` |
| `RefusCommande` | type | émet | `+= 'partie_terminee'` |
| `executerCommande` | service | consomme | signature INCHANGÉE ; garde `partie_terminee` après `combat_en_cours`, avant `TRANSITIONS` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | Néant — aucune donnée de fin n'entre dans un contexte de modèle. `condition_texte` = audience auteur, jamais injectée. |
| Schéma de sortie | Néant — aucune sortie IA consommée. |
| Échec de validation | Non applicable (aucun appel IA). |
| Ce que l'IA **ne** fait **pas** | R3 (narrateur) coupé au pas dont l'issue est une fin. R5 (commentateur) hors périmètre it1. Aucun appel IA neuf. |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-fin` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `finAtteinte` pure dans `evaluate.ts` + garde `partie_terminee` dans `commandes.ts`
- **Fichiers** :
  - `src/brain/dossier/evaluate.ts` (R) — `finAtteinte`, `FinAtteinte`
  - `src/brain/dossier/commandes.ts` (R) — garde après `combat_en_cours`, message constant
  - `src/brain/dossier/interprete.ts` (R) — commentaire l.150-152 seul (« inatteignable » devient faux)
  - `src/brain/dossier/evaluate.test.ts` (R) — séparateur KR-302, param structurel, garde-baril-fin
  - `src/brain/dossier/commandes.test.ts` (R) — balayage `partie_terminee` pour chaque verbe + reprise des l.1067-1074
  - `src/brain/dossier/session.test.ts` (R) — seulement si rouge (7 usages de l'embuscade)
- **Expose** :
  ```ts
  export interface FinAtteinte { readonly fin_id: string; readonly texte?: string }
  export function finAtteinte(
    dossier: Dossier,
    session: { readonly monde: FaitsDeSession; readonly combat?: unknown },
  ): FinAtteinte | undefined
  // Rend undefined si session.combat !== undefined (KR-303).
  // Première charpente.fins[] dont condition_expr est définie ET evaluerExpr rend true (KR-302).
  // texte : clé absente si Fin.texte absent (KR-307, jamais discriminé sur le contenu).
  // Lève sur nœud inconnu (KR-238).
  export type RefusCommande = /* existants */ | 'combat_en_cours' | 'partie_terminee'
  // executerCommande : ordre = combat_en_cours, partie_terminee, TRANSITIONS.
  ```
- **Critères couverts** : #1, #2, #3, #4
- **Porte** : `tsc --noEmit` + `jest` verts, ce lot seul.

### Lot 2 — `feature-ecran-fin`
- **Ouvrier** : `dev-lot`
- **But** : extraction `PartieEnCours.tsx` d'`EcranPartie.tsx` (KR-112), aiguillage fin dans `PartieEnCours`, `EcranFin.tsx`, garde R2/R3/R4 dans `useTourDeJeu`, pont `player/engine/fin.ts`
- **Fichiers** :
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — shell + gardes 1-5 + `PartieDemarree` + `tirerGraine` (~100 l.)
  - `src/features/play-mode/components/PartieEnCours.tsx` (N) — déplacement pur puis aiguillage fin (~300 l.)
  - `src/features/play-mode/components/EcranFin.tsx` (N) — contenu fin, ~90 l.
  - `src/features/play-mode/components/EcranFin.test.tsx` (N) — verbatim + repli KR-307 + titre
  - `src/player/engine/fin.ts` (N) — réexport seul `{ finAtteinte, type FinAtteinte }` depuis `brain/dossier/evaluate`
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — garde entre ÉTAPE 5 et R2
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R) — garde R2/R3/R4
  - `src/features/play-mode/tests/finDePartie.test.tsx` (N) — écran de fin après commande, saisie retirée
  - `src/features/play-mode/tests/combatParConsole.test.tsx` (R) — adaptation l.115 (fin vraie à la clôture)
  - `src/features/play-mode/components/EcranPartie.test.tsx` (R) — seulement si rouge
- **Consomme** : `finAtteinte`, `FinAtteinte` via `player/engine/fin` (jamais d'import direct de `brain/dossier/evaluate` côté feature)
- **Expose** :
  ```ts
  // EcranFin.tsx
  export interface EcranFinProps { readonly fin: FinAtteinte; readonly nom: string }
  // PartieEnCours.tsx
  export interface PartieEnCoursProps {
    readonly dossier: Dossier; readonly dossierId: string
    readonly session: EtatSession
  }
  // nom = dossier.charpente.fins.find(f => f.id === fin.fin_id)?.nom || 'Fin sans nom'
  ```
- **Critères couverts** : #5, #6, #7
- **Ordre interne** :
  1. Extraction pure d'abord (PartieEnCours.tsx) — suite existante verte, aucun test modifié.
  2. EcranFin + aiguillage dans PartieEnCours.
  3. Garde useTourDeJeu.
- **Contraintes** :
  - L'aiguillage reste DANS `PartieEnCours`, après tous les hooks. `useTourDeJeu` doit rester monté.
  - Aucun import de `brain/dossier/evaluate` côté feature : seul `player/engine/fin` est lisible.
  - `moteurSansIA.test.ts` balaie `CopiloteService`, `.demander(`, `/ia/` : ne pas recopier de docstring contenant ces motifs.
  - Repli de fin sans texte si `texte === undefined || texte.trim() === ''`.

## 6 — Critères d'acceptation

1. **Étant donné** un dossier dont une fin a `condition_expr` définie et `evaluerExpr` rend `true` pour le monde de la session, et `session.combat` est `undefined`, **quand** on appelle `finAtteinte(dossier, session)`, **alors** il rend `FinAtteinte {fin_id, texte?}` de cette fin. — *niveau : unitaire* — *lot 1*

2. **Étant donné** un monde de session où deux fins ont `condition_expr` définie et vraie, **quand** on appelle `finAtteinte`, **alors** il rend la première dans l'ordre de `charpente.fins[]` (KR-302). — *niveau : unitaire* — *lot 1*

3. **Étant donné** une session avec `combat !== undefined`, **quand** on appelle `finAtteinte`, **alors** il rend `undefined` (KR-303). — *niveau : unitaire* — *lot 1*

4. **Étant donné** une session où `finAtteinte(dossier, session)` rend un résultat, **quand** `executerCommande` est appelé avec n'importe quel verbe de `COMMANDES`, **alors** il rend `{ ok: false, refus: 'partie_terminee' }`. — *niveau : contrat* — *lot 1*

5. **Étant donné** une commande acceptée dont la session résultante rend `finAtteinte !== undefined`, **quand** le pas se résout, **alors** `PartieEnCours` affiche `EcranFin` avec `Fin.texte` rendu verbatim, titre « FIN · {nom} », et ni la console ni la saisie libre ne sont montées. — *niveau : composant* — *lot 2*

6. **Étant donné** une commande acceptée dont la session résultante rend `finAtteinte !== undefined`, **quand** `useTourDeJeu` traite la réponse, **alors** R2 (jet), R3 (narrateur) et R4 (descripteur) ne sont pas appelés. — *niveau : unitaire* — *lot 2*

7. **Étant donné** une fin atteinte dont `texte` est `undefined` ou vide (`trim`), **quand** `EcranFin` est affiché, **alors** il affiche le bloc pointillé invitant « Cette fin n'a pas de texte — rédigez-la dans JALONS & FINS, onglet FINS, pour que le moteur la lise au joueur. » (KR-307). — *niveau : composant* — *lot 2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `evaluate.test.ts`: `finAtteinte rend la première fin dont la condition est vraie` | `finAtteinte(dossier, sessionMonde).fin_id === 'fin.vigie-sauvee'` | jest | — | 1 |
| `evaluate.test.ts`: `KR-302 deux fins vraies, première dans l'ordre du document` | monde identique, `fins` inversé → `fin.vigie-abandonnee` | jest | KR-302 | 1 |
| `evaluate.test.ts`: `KR-303 combat ouvert bloque finAtteinte` | `session.combat` défini → `undefined` | jest | KR-303 | 1 |
| `evaluate.test.ts`: `fin sans condition_expr ignorée` | `condition_expr` absent → ignorée | jest | — | 1 |
| `evaluate.test.ts`: `garde-baril-fin` | `finAtteinte` hors baril `brain/index.ts` | jest | — | 1 |
| `commandes.test.ts`: `partie_terminee pour chaque verbe de COMMANDES après fin` | balayage `aller`/`agir`/`parler` → `{ ok: false, refus: 'partie_terminee' }` | jest | — | 1 |
| `commandes.test.ts`: `mort conserve combat_en_cours` | session avec `combat` → `combat_en_cours` | jest | — | 1 |
| `commandes.test.ts`: `commandes après victoire, dossier à fins neutralisées` | reprise l.1067-1074 | jest | — | 1 |
| `EcranFin.test.tsx`: `affiche Fin.texte verbatim` | `screen.getByText(texteDeTest)` | RTL | — | 2 |
| `EcranFin.test.tsx`: `KR-307 repli invitant sans texte` | `screen.getByText(/rédigez-la dans JALONS/)` | RTL | KR-307 | 2 |
| `EcranFin.test.tsx`: `titre FIN · nom` | `screen.getByRole('heading', { name: /FIN/ })` | RTL | — | 2 |
| `finDePartie.test.tsx`: `écran de fin après commande, saisie retirée` | `EcranFin` monté, console et saisie libre absentes | RTL | — | 2 |
| `useTourDeJeu.test.ts`: `garde coupe R2/R3/R4 après fin` | `copilote.demander` non appelé pour ce pas | jest | — | 2 |
| `combatParConsole.test.tsx`: `adaptation fin.vigie-abandonnee` | après clôture du combat, la fin est atteinte | RTL | — | 2 |

Cas limites couverts : deux fins vraies (ordre) · fin sans `condition_expr` · fin sans texte (vide, `undefined`) · combat ouvert · victoire sans fin.

**Non vérifiable en l'état** — `moteurSansIA.test.ts` vert : vérifié par la porte qualité, pas par un test neuf.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Phrase non verticale (« fin ou mort » = deux tranches) | `RETENU` | It1 = fin seule. Mort en it2. Consensus des 5 rôles. |
| 2 | PM | Critère 4 contredit (mort = `combat_en_cours`, pas `partie_terminee`) | `RETENU` | Critère réécrit : `partie_terminee` = fin seule. Mort garde `combat_en_cours` livré. |
| 3 | PM | R5 renverse livré n° 13 (`commentateur.ts:136` écrit `hero-mort` exprès) | `REPORTÉ` | It2 mort. Arbitrage nommé obligatoire avant toute coupe de R5. |
| 4 | PM | Rejouer au squelette sans critère, préempte it3 | `RETENU` | Exclu d'it1. Bouton + focus + graine → it2+. |
| 5 | PM | R2/R3/R4 vs R3 seul | `RETENU` | Une garde unique coupe les trois (TL, consensus T2). |
| 6 | PM | 4 lots | `REJETÉ` | Les lots 2/3/4 du PM partagent `EcranPartie.tsx`/`PartieEnCours.tsx` (violation fichiers disjoints). 2 lots TL retenus. |
| 7 | TL | `finAtteinte` param structurel `{ monde; combat? }` + retour `FinAtteinte {fin_id, texte?}` | `RETENU` | Lot 1 contrat. Doctrine `Rencontre`/`JalonAtteint`. |
| 8 | TL | Coupe `PartieEnCours.tsx`, pas `PartieDemarree` (cycle d'import) | `RETENU` | Lot 2 feature. |
| 9 | TL | Pont `player/engine/fin.ts` (réexport seul) | `RETENU` | Lot 2. Doctrine `brain/index.ts:574-578`. |
| 10 | TL | `fin.vigie-abandonnee` rougit `commandes.test.ts:1067-1074` | `RETENU` | Lot 1 contrat (reprise du test). |
| 11 | TL | `ActionsCarnet.tsx` retiré | `RETENU` | Coupe `PartieEnCours.tsx` suffit pour KR-112. |
| 12 | UX | En-têtes distincts fin/mort | `REPORTÉ` | It2. Un seul en-tête « FIN — lue au joueur, mot pour mot » en it1. |
| 13 | UX | Repli invitant (KR-307) | `RETENU` | Lot 2. Bloc pointillé avec action. |
| 14 | UX | Bouton accent Rejouer + focus auto | `REPORTÉ` | It2+. Échap via CadrePartie = issue en it1. |
| 15 | UX | Copie locale du style repli | `RETENU` | Toléré (KR-109 : un seul module). Dette à déclencheur. |
| 16 | QA | Deux chemins console + saisie libre | `RETENU` | Critère #5 nomme les deux. Test brain (balayage) + test feature (saisie retirée). |
| 17 | QA | KR-302 fixture + assertion séparatrice | `RETENU` | Lot 1. Fixture dossier-reference + `fins` inversé. |
| 18 | QA | Texte de mort non spécifié | `REPORTÉ` | It2. Constante nommée, testée, hors prompt. |
| 19 | QA | Traçabilité test (chaque critère → test nommé) | `RETENU` | § 7 du plan. |
| 20 | NIA | Texte de mort constante code hors prompt | `REPORTÉ` | It2. Suit la mort. |
| 21 | NIA | R5 déjà dans `projeterAssaut` (phase === 'ended') | `REJETÉ` | PM vérifié au code (`combatProjection.ts:19-35`). `projeterAssaut` ne teste pas `phase`. R5 est appelé sur `hero-mort` (livré n° 13). |
| 22 | PM T2 | 4 itérations (fin, mort, reprise, graine+Rejouer) vs 3 du cadrage | `REPORTÉ` | Cadrage de it2. Le redécoupage se traite quand on y arrive. |

## 9 — Innovation

*(Aucune proposition INNOVATION retenue. Section supprimée.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `moteurSansIA.test.ts` vert (KR-250/260)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `EcranPartie.tsx` ≤ 400 l. après extraction (KR-112)
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-fins-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | it1 = fin seule (levée) |
| Tech Lead | recevable sous réserve | spec réécrite fin seule, 2 lots (levée) |
| UX | recevable sous réserve | repli invitant (retenu § 3), Échap comme issue (retenu § 3) |
| QA | recevable sous réserve | 2 chemins (retenu #16), KR-302 fixture (retenu #17), traçabilité (retenu § 7) |
| Narratif & IA | recevable | — |
