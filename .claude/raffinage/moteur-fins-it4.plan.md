# Plan d'itération — `moteur-fins` · itération `4`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-07
> Composition : 5 rôles — motif : l'itération touche le mode jeu (moteur, session, écrans terminaux)
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut relancer sa partie terminée avec les mêmes dés. » |
| **Tranche** | EcranFin / EcranMort → AiguillagePartie (`{generation, graine?}`) → PartieDemarree (`graineImposee ?? tirerGraine()`) → ouvrirSession → useSessionPersistee |
| **Lots** | 1 lot feature · contrat : non |
| **Hors périmètre** | Affichage de la graine · rejeu des commandes · rejouer après rechargement · cas limites navigateur · focus auto sur Rejouer · refus dans illisible · barre d'actions commune · règles ESLint UX · maxWidth/border en tokens |
| **Reporté** | L2 docs (`EXIGENCE-APERCU-DU-JEU.md`) → ligne armée au roadmap · 7 règles ESLint → dette outillage · maxWidth 480, border, :hover boutonSecondaire → dette quand rouvert |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut relancer sa partie terminée avec les mêmes dés. »

## 2 — Hors périmètre

- Rejeu automatique des commandes (macro) et persistance de R1/R4/commandes. Ce serait un champ optionnel d'`EtatSession` et un lot `contrat`.
- Afficher, copier ou saisir une graine. Le mot « graine » n'entre pas dans l'interface.
- Rejouer en cours de partie. Ce serait une action dangereuse avec dialogue.
- Rejouer après rechargement : une partie terminée rouverte ouvre directement une nouvelle partie (décision #20, close).
- Conserver le héros entre deux parties.
- Focus auto sur Rejouer (Entrée doit rester « Nouvelle partie »).
- Cas limites navigateur (retour arrière, hors ligne, crash) — KR-242 (intra-process) les exclut.
- Refus dans « illisible » — dette à déclencheur « reprise.ts rouvert ».
- Changer les libellés ou le dialogue existants de « Nouvelle partie ».
- Barre d'actions commune aux deux écrans (duplication tolérée).
- Les 7 règles ESLint proposées par UX (tranche outillage).
- `tabIndex={0}` sur le journal d'EcranMort (arrêt Tab mort).
- `:hover` sur `boutonSecondaire` (CSSProperties ne le permet pas).

## 3 — Contrat de design

**Composants**
- `boutonPrimaire` (existant) : « ↻ Nouvelle partie ». Porte `autoFocus` sur les deux écrans.
- `boutonSecondaire` (N `boutonSecondaire.ts`) : « ↪ Rejouer — mêmes dés ». Tokens : `fontFamily var(--font-mono)`, `fontSize var(--fs-meta)`, `padding var(--space-3) var(--space-5)`, `borderRadius var(--r-md)`, `border var(--bw-hair) solid var(--border-field)`, `background var(--surface-card)`, `color var(--text-strong)`, `fontWeight var(--fw-semibold)`, `minHeight var(--hit-target)`, `cursor pointer`. `type="button"`.

**Barre d'actions** (conteneur inline, pas de composant) :
- `display: 'flex'`, `flexWrap: 'wrap'`, `gap: 'var(--space-5)'`, `alignItems: 'center'`.
- Ordre DOM : Nouvelle partie (primaire, autoFocus) → Rejouer (secondaire).

**Aide** (une ligne sous la barre, les deux écrans) :
- « Mêmes dés dès la création du héros. Le récit peut changer. »
- Tokens : `fontSize var(--fs-body)`, `color var(--text-muted)`, `lineHeight var(--lh-body)`, `fontFamily var(--font-ui)`, `margin 0`.
- EcranMort : la ligne existante (« La partie est terminée. Le dossier n'est pas modifié. ») reste au-dessus.

**États**
- `onRejouer` absent (undefined) sur EcranFin : ni bouton, ni aide.
- `onRejouer` requis sur EcranMort : bouton toujours présent.
- Pas de Modal : la partie est terminée, rien n'est détruit.

**Clavier**
- Focus initial : Nouvelle partie (les deux écrans). Entrée l'active.
- Tab : Nouvelle partie → Rejouer → sortie du Cadre.

**Registre de langue**
- « dés » dans l'interface, « graine » dans le code seul.
- KR-308 : aucune couleur `--good` / `--bad` sur ces écrans.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatSession.graine_alea` | champ | consomme | `graine_alea: number` |
| `ouvrirSession` | service | consomme | `ouvrirSession(dossier, { graine_alea })` |
| `creerRng` | service | consomme | `creerRng(graine, domaine, indice)` |

Aucun contrat ajouté, modifié ou créé. Zéro fichier `brain/`.

## 5 — Lots

### Lot 1 — `rejouer` (feature)
- **Ouvrier** : `dev-lot`
- **But** : Ajouter « ↪ Rejouer — mêmes dés » sur EcranFin et EcranMort, câbler la graine vivante jusqu'à ouvrirSession.
- **Fichiers** :
  - N `src/features/play-mode/components/boutonSecondaire.ts`
  - R `src/features/play-mode/components/EcranFin.tsx`
  - R `src/features/play-mode/components/EcranMort.tsx`
  - R `src/features/play-mode/components/PartieEnCours.tsx` (381 l., cible ≤ 395)
  - R `src/features/play-mode/components/AiguillagePartie.tsx`
  - R `src/features/play-mode/components/EcranFin.test.tsx`
  - R `src/features/play-mode/components/EcranMort.test.tsx`
  - R `src/features/play-mode/tests/mortDuHeros.test.tsx` (onRejouer requis rend tsc rouge)
  - N `src/features/play-mode/tests/rejeuDeterministe.test.ts` (pur, sans DOM)
  - N `src/features/play-mode/tests/rejouer.test.tsx` (RTL)
- **Consomme** : `EtatSession.graine_alea`, `ouvrirSession`, `creerRng` en lecture seule
- **Critères couverts** : #1, #2, #3, #4
- **Interdit** : `brain/**`, `player/**`, `reprise.ts`, `useTourDeJeu.ts`, `session.ts`, `code-knowledge.json`, `boutonPrimaire.ts`

**Signatures :**
```ts
// boutonSecondaire.ts
export const boutonSecondaire: CSSProperties

// EcranFin.tsx
EcranFinProps += readonly onRejouer?: () => void  // bouton absent si undefined

// EcranMort.tsx
EcranMortProps += readonly onRejouer: () => void  // requis

// PartieEnCours.tsx
PartieEnCoursProps += readonly onRejouer: (graine: number) => void  // session.graine_alea du VIVANT
PartieDemarreeProps += readonly graineImposee?: number
                   += readonly onRejouer: (graine: number) => void
// graine = graineImposee ?? tirerGraine()   // JAMAIS ||  (graine 0 valide)

// AiguillagePartie.tsx — UN état, pas deux
useState<{ readonly generation: number; readonly graine?: number }>({ generation: 0 })
handleNouvellePartie → { generation: n+1, graine: undefined }
handleRejouer(g)     → { generation: n+1, graine: g }
```

**Budget `PartieEnCours.tsx` :** 381 → ~395 lignes. Marge de 5 avant KR-112 (400).

**Limite assumée (docstring AiguillagePartie) :** Rejouer n'existe que sur l'écran terminal vivant. Après rechargement la graine est perdue (KR-242).

## 6 — Critères d'acceptation

1. **Étant donné** un EcranFin ou EcranMort vivant avec `onRejouer`, **quand** l'auteur clique « ↪ Rejouer — mêmes dés », **alors** une partie neuve s'ouvre (tour 0, journal vide, héros absent) avec la `graine_alea` de la partie terminée, sans appeler `tirerGraine`. Graine 0 valide. Session persistée porte cette graine. — *composant + RTL* — *lot 1*

2. **Étant donné** deux `ouvrirSession` avec la même graine et les mêmes commandes scriptées, **quand** on compare les sessions à chaque pas, **alors** elles sont `toEqual` et les logs de combat identiques. Une graine différente donne un journal différent. Le dossier reste inchangé. — *unitaire (pur)* — *lot 1*

3. **Étant donné** une partie relancée via Rejouer, **quand** l'auteur clique « ↻ Nouvelle partie », **alors** `tirerGraine` est rappelée. — *RTL* — *lot 1*

4. **Étant donné** le lot livré, **quand** `jest` s'exécute, **alors** `moteurSansIA.test.ts` reste vert. Aucun champ ajouté. Aucun fichier de règles touché. — *régression* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR | Lot |
|---|---|---|---|---|
| rejeuDeterministe : même graine + script = sessions égales | toEqual à chaque pas | pur | KR-304 | L1 |
| rejeuDeterministe : graine différente = journal différent | log ≠ (anti-vacuité) | pur | KR-304 | L1 |
| rejeuDeterministe : graine_alea inchangée | === graine initiale | pur | KR-304 | L1 |
| rejeuDeterministe : dossier immutable | structuredClone = toEqual | pur | KR-304 | L1 |
| rejeuDeterministe : Math.random = 0 appels | spyOn après setup | pur | KR-304 | L1 |
| rejouer : tirerGraine non rappelée | mock.calls.length inchangé | RTL | — | L1 |
| rejouer : dés de création identiques | même pool affiché | RTL | KR-304 | L1 |
| rejouer : Nouvelle partie après Rejouer rappelle tirerGraine | mock.calls.length +1 | RTL | — | L1 |
| rejouer : graine 0 valide | ?? pas double pipe | RTL | — | L1 |
| rejouer : onRejouer avec session.graine_alea | EcranFin ET EcranMort | RTL | — | L1 |
| EcranFin : bouton Rejouer + onRejouer | getByRole + click | composant | — | L1 |
| EcranFin : autoFocus sur Nouvelle partie | document.activeElement | composant | — | L1 |
| EcranFin : sans onRejouer = pas de bouton | queryByRole = null | composant | — | L1 |
| EcranMort : bouton Rejouer + onRejouer | getByRole + click | composant | — | L1 |
| EcranMort : autoFocus sur Nouvelle partie | test existant inchangé | composant | — | L1 |

**Non vérifiable** : rechargement réel — session persistée avec la bonne graine en est la preuve indirecte.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM vs TL/UX/NIA | « mêmes dés » vs « même graine » | RETENU « mêmes dés » | « graine » absent de l'interface |
| 2 | UX | Affichage GRAINE · {n} | REJETÉ | UX retire ; preuve = pool de dés |
| 3 | UX | autoFocus Nouvelle partie EcranFin | RETENU | Trou clavier, TL accepte |
| 4 | UX | tabIndex journal EcranMort | REJETÉ | UX retire, TL refuse |
| 5 | TL vs UX | boutonSecondaire : N fichier | RETENU | 4 importeurs, nom mentirait |
| 6 | UX | :hover boutonSecondaire | REJETÉ | CSSProperties ; dette |
| 7 | TL | L2 docs EXIGENCE-APERCU-DU-JEU | REPORTÉ | Ligne armée au roadmap |
| 8 | UX | Barre d'actions commune | REJETÉ | UX retire |
| 9 | UX | 7 règles ESLint | REPORTÉ | Tranche outillage |
| 10 | QA | « mêmes commandes relues » | REJETÉ | QA retire ; KR-248 |
| 11 | QA | EntreeJournal.test.ts | REJETÉ | decision_modele inexistant |
| 12 | UX | maxWidth 480 en dur | REPORTÉ | Dette, aucun token |
| 13 | UX | border 1px dans boutonPrimaire | REPORTÉ | Hors lot |
| 14 | QA vs TL | 3 combats dans test pur | REJETÉ | 1 suffit |
| 15 | NIA | Aide « tirages identiques » | RETENU reformulé | Falsifiable : « Mêmes dés dès la création du héros. Le récit peut changer. » |

## 10 — Définition de fini

- [ ] Porte qualité verte : format → typecheck → lint → jest
- [ ] Pas de test:mutation (aucun fichier de règles touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants
- [ ] Aucun fichier hors liste du lot
- [ ] PartieEnCours.tsx ≤ 400 lignes après Prettier
- [ ] Libellé de Rejouer ne contient pas « Nouvelle partie »
- [ ] Revue écrite : .claude/raffinage/moteur-fins-it4.revue.md

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | Recevable sous réserve | « mêmes dés » retenu, hors périmètre respecté |
| Tech Lead | Approuvé sous réserve | CA 21/22 réécrits, CA QA non retenue |
| UX | Recevable | boutonSecondaire tokens seuls |
| QA | Conforme | Tests nommés par TL |
| Narratif & IA | Recevable | Ligne d'aide mentionnant variabilité narrative |
