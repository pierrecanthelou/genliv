# Plan d'itération — `moteur-horloge` · itération `3`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-06
> Composition : 5 rôles — motif : l'itération touche le moteur (tick, constat de blocage) et le contexte IA (injection `si_bloque` dans R3)
> Exécution : `séquentielle` (2 lots `contrat`, L1 puis L2, sans worktree)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur lit qu'un PNJ coincé trop longtemps à une étape change d'approche. » |
| **Tranche** | `blocage.ts` (prédicat pur) → `horloge.ts` (tick : constat au journal) → `contexte/horloge.ts` (R3 : injection `si_bloque` dans PENDANT CE TEMPS) → `worker/` (plafonds si budget bouge) |
| **Lots** | 2 lots séquentiels · tous deux `contrat` (tout est dans `brain/` + `worker/` + doc) |
| **Hors périmètre** | minuterie (durée échue ≠ avancement), effet de monde de `si_bloque`, transferts d'indices, contre-mesures, climat/bandeau (it4), migration des sessions it1/it2, drapeau « raconté » stocké, modification de l'invite du narrateur, extraction de `replier` dans `noyau.ts` |
| **Reporté** | `replier` dupliqué → dette à déclencheur · invite du narrateur → non une dette (NIA) · extraction `sessionCombat.ts` → it4 |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur lit qu'un PNJ coincé trop longtemps à une étape change d'approche.

## 2 — Hors périmètre

- Durée échue qui fait avancer le PNJ (la minuterie est abolie — une durée échue CONSTATE un blocage, elle ne fait jamais avancer, § J2).
- `si_bloque` appliqué comme effet de monde (c'est une didascalie narrative, pas un delta).
- Transferts d'indices et contre-mesures (hors n° 14).
- Climat, bandeau PAS #n et CLIMAT · {nom} (it4).
- Migration des sessions écrites en it1 (`{rang}` sans `depuis`) ou it2.
- Drapeau « raconté » ou état « bloqué » stocké (KR-013 : le blocage est dérivé).
- Modification de l'invite du narrateur (`PENDANT CE TEMPS` n'est cité par aucune invite, KR-273).
- Extraction de `replier` dans `noyau.ts` (dette à déclencheur : un seul duplication, deux appelants dans le même sous-arbre).

## 3 — Contrat de design

Aucun composant UI neuf. Tout est moteur + contexte IA + journal.

**Journal** : `etape_bloquee : <id> <k+1>` — `role: 'moteur'`, au `tour` du pas courant. Snake_case minuscule ASCII, base 1, même registre que `etape_plan :` et `jalons_atteints :`. Sans prose `si_bloque`, sans `origine`, `deltas`, `recit`, `jet`, `interlocuteur`. La ligne s'écrit même sans `si_bloque` rédigé (l'auteur voit toujours le constat).

**PENDANT CE TEMPS** : une ligne `si_bloque` peut apparaître pour un PNJ bloqué et perceptible, au même format qu'une ligne `action` (prose d'auteur repliée sur une ligne, sans rang, identifiant, nom, ni mot « bloqué »).

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `etapeBloqueeAuPas` | service | émet | `(personnage: Personnage, entree: EtatPnj \| undefined, tour: number) → ConstatDeBlocage \| undefined` |
| `ConstatDeBlocage` | type | émet | `{ readonly rang: number; readonly courante: PlanAction }` |
| `tickHorloge` | service | consomme `etapeBloqueeAuPas` | signature INCHANGÉE `(dossier, session) → EtatSession` |
| `lignesPendantCeTemps` | service | consomme `etapeBloqueeAuPas` | signature INCHANGÉE `(dossier, session) → readonly string[]` |
| `CHEMIN_SI_BLOQUE` | constante | émet | `'monde.personnages[].plan_actions[].si_bloque'` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Contexte injecté** | R3 seul. `si_bloque` entre dans le bloc PENDANT CE TEMPS, une ligne par PNJ perceptible et bloqué. Sélection par personnage : (1) avancé à ce pas (`depuis === tour`) → action (it2, prioritaire), (2) sinon, bloqué (`etapeBloqueeAuPas` retourne un constat) → `textesRediges(constat.courante, CHEMIN_SI_BLOQUE, PREFIXE_ETAPE).map(replier)`, (3) sinon → silence. Jamais les deux pour un même PNJ au même pas. |
| **Schéma de sortie** | INCHANGÉ : `{narration, tentatives, constats, condense?}`. `validerNarrateur` inchangé. Aucune clé neuve. |
| **Échec de validation** | INCHANGÉ. Le bloc est hors cascade. `si_bloque` non rédigé → silence, sans repli sur `action` ni `nom`. |
| **Ce que l'IA ne fait pas** | Elle ne sait pas qu'un PNJ est « bloqué ». Elle reçoit une prose d'auteur et la raconte. Pas de mot de mécanique, pas de « blocage », pas de « durée écoulée ». |

**Seconde dérogation** : `CHEMIN_SI_BLOQUE` fait passer la dérogation personnage de R3 d'un chemin à une liste fermée de deux (`CHEMIN_ACTION_DE_PLAN` + `CHEMIN_SI_BLOQUE`). Garde dédiée dans `contexte.test.ts` : audience `ia`, absent de `CHAMPS_INJECTES_NARRATEUR` (8 chemins), absent de la liste fermée des onze.

**Docstrings à amender dans le même lot** (précédent BUG-082) : `narrateur.ts:96` (« ni `si_bloque` » → « les DEUX chemins ») et `contexte/horloge.ts:41-42` (« `si_bloque` arrive à l'itération 3 » → réécrit au présent).

**Mémoire** : rien de nouveau retenu. Pas de drapeau « raconté » (KR-013).

**Budget** : `si_bloque` REMPLACE `action` (sélections disjointes). Le pire cas prend max(action, si_bloque) par PNJ. M à mesurer avec `pireCasNarrateur()` dans `contexte.test.ts`. Si M > 2333 : `BUDGET_CARACTERES_DOSSIER` 7000 → 8000, `TAILLE_MAX_CORPS_IA` 87 040 → 90 112, pins dans `worker/frontiere.test.ts` ajustés. Si M ≤ 2333 : 7000 et `worker/` hors lot.

## 5 — Lots

> Deux lots `contrat`, séquentiels (L1 en premier, L2 après). Même schéma que moteur-horloge it2. Aucun lot `feature`. Pas de worktree ni de fusion.

### Lot 1 — `L1-moteur-blocage` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : Prédicat de blocage pur + constat au journal du tick. J2 réécrite EN PREMIER.
- **Pré-étape** : sonde `jest` sur les fixtures portant `duree` (`dossier-reference.json`, `dossier-minimal.json`). Identifier les tests rouges. Les absorber en R (assertions seules). Si > 6 fichiers rouges hors L1 : STOP et rapporter à l'orchestrateur.
- **Fichiers** :
  - N `src/brain/dossier/blocage.ts`
  - N `src/brain/dossier/blocage.test.ts`
  - R `src/brain/dossier/horloge.ts`
  - R `src/brain/dossier/horloge.test.ts`
  - R `src/brain/dossier/evaluate.test.ts` (garde baril : `etapeBloqueeAuPas` ni exporté par `brain/index.ts` ni importé par `'./dossier/blocage'`)
  - R `src/brain/dossier/faits.ts` (docstring l.53-60 : la règle « le moteur n'invente JAMAIS une origine » est amendée — le prédicat de blocage dérive l'origine 0 pour rang 0, sans la stocker)
  - R `docs/REGLES-PLAY.md` (J2 : lignes 4/7 `>=` → `===`, règle 8 reformulée « `depuis` ne décide jamais d'un avancement — seul le prédicat de blocage le lit », chapeau l.195, règle d'origine « rang 0 ou absent → origine 0 ; rang ≥ 1 sans depuis → jamais en échéance »)
  - R tests rouges de la sonde (assertions seules, fichiers à identifier par la sonde)
- **Expose** :
  ```ts
  // blocage.ts — feuille pure, import type seulement (./faits, ./types)
  export interface ConstatDeBlocage {
    readonly rang: number
    readonly courante: PlanAction
  }
  export function etapeBloqueeAuPas(
    personnage: Personnage,
    entree: EtatPnj | undefined,
    tour: number,
  ): ConstatDeBlocage | undefined
  // rang = entree?.etape_plan?.rang ?? 0
  // courante = personnage.plan_actions?.[rang]
  // origine = entree?.etape_plan?.depuis ?? (rang === 0 ? 0 : undefined)
  // constat ssi courante?.duree != null && origine != null
  //            && tour - origine === courante.duree   (===, jamais >=)
  // Total : rang négatif, non entier ou hors plan → undefined.
  // Ne lit ni declencheur_*, ni si_bloque, ni action, ni .etape.
  ```
- **Tick, ordre figé** :
  1. Garde hors bornes : no-op total, pas de constat (inchangé).
  2. Si étape visée existe et `etapeDeclenchee` → `avancer`, puis `continue`. L'avancement et le constat s'excluent par le flot de contrôle.
  3. Sinon : `etapeBloqueeAuPas(personnage, existant, courante.horloge.tour)`. Si constat → ligne journal `etape_bloquee : <id> <rang+1>`, `role: 'moteur'`, au `tour` courant. Sans `origine`, `deltas`, `recit`, `jet`. Même référence de session si rien.
- **Critères couverts** : #1, #3, #4, #5, #6, #7

### Lot 2 — `L2-narrateur-si-bloque` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, séquentiel après L1)
- **But** : Injection de `si_bloque` dans PENDANT CE TEMPS + ajustement budget si nécessaire.
- **Fichiers** :
  - R `src/brain/copilote/contexte/horloge.ts`
  - R `src/brain/copilote/contexte/narrateur.ts` (docstring dérogation l.86-101 + `BUDGET_CARACTERES_DOSSIER` si M > 2333)
  - R `src/brain/copilote/contexte.test.ts`
  - R `worker/index.ts` (`TAILLE_MAX_CORPS_IA` si budget bouge)
  - R `worker/frontiere.test.ts` (pins si budget bouge)
- **Consomme** : `etapeBloqueeAuPas` (L1), `personnagesPresents` (existant), `textesRediges` (existant), `PREFIXE_ETAPE` (existant).
- **Expose** :
  ```ts
  // contexte/horloge.ts — signature INCHANGÉE
  export const CHEMIN_SI_BLOQUE = 'monde.personnages[].plan_actions[].si_bloque'
  export function lignesPendantCeTemps(
    dossier: Dossier, session: EtatSession
  ): readonly string[]
  // Par PNJ perceptible :
  //   depuis === tour → action (it2, inchangé)
  //   sinon, etapeBloqueeAuPas → textesRediges(constat.courante, CHEMIN_SI_BLOQUE, PREFIXE_ETAPE)
  //   sinon → []
  // Le « sinon » est structurel : avancement et blocage s'excluent.
  // contexte/horloge.ts ne lit jamais .duree (garde contexte.test.ts).
  ```
- **Pré-étape L2** : mesurer M avec `pireCasNarrateur()`. Si M > 2333, ajuster les constantes. Si M ≤ 2333, `worker/index.ts` et `worker/frontiere.test.ts` sortent du lot.
- **Critères couverts** : #2, #8

## 6 — Critères d'acceptation

1. **Étant donné** un PNJ dont `tour − origine === duree` **quand** le tick tourne **alors** le journal porte `etape_bloquee : <id> <k+1>` au tour courant, `role: 'moteur'`, même sans `si_bloque` rédigé — *unitaire* — *L1*
2. **Étant donné** un PNJ bloqué, présent au lieu courant, avec `si_bloque` rédigé **quand** R3 assemble **alors** une ligne `si_bloque` repliée apparaît dans PENDANT CE TEMPS — *contrat* — *L2*
3. **Étant donné** un PNJ dont le déclencheur est vrai ET l'échéance tombe au même pas **quand** le tick tourne **alors** le PNJ avance (une seule ligne `etape_plan`), pas de constat — *unitaire* — *L1*
4. **Étant donné** `etape_plan` absent ou `{rang: 0}` sans `depuis` **quand** le prédicat évalue **alors** l'origine vaut 0 et le blocage est possible (Sélène bloquée au pas 4) — *unitaire* — *L1*
5. **Étant donné** `{rang ≥ 1}` sans `depuis` **quand** le prédicat évalue **alors** jamais en échéance — *unitaire* — *L1*
6. **Étant donné** le prédicat `etapeBloqueeAuPas` **quand** un grep cherche `.duree` dans le dépôt **alors** seul `blocage.ts` le lit (KR-246 : un seul site de décision) — *contrat* — *L1*
7. **Étant donné** `horloge.ts` **quand** un grep cherche `.duree` ou `.depuis` en lecture **alors** zéro occurrence (la garde source existante reste verte) — *contrat* — *L1*
8. **Étant donné** le budget dossier après ajout `si_bloque` **quand** M est mesuré par `pireCasNarrateur()` **alors** `BUDGET_CARACTERES_DOSSIER` ajusté si M > 2333, inchangé sinon — *contrat* — *L2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `blocage.test.ts: duree−1 pas de constat` | `etapeBloqueeAuPas` retourne `undefined` à `tour − origine = duree − 1` | jest | — | L1 |
| `blocage.test.ts: duree produit constat` | retourne `{rang, courante}` à `tour − origine === duree` | jest | — | L1 |
| `blocage.test.ts: duree+1 pas de second constat` | retourne `undefined` à `tour − origine = duree + 1` (front `===`, pas `>=`) | jest | KR-013 | L1 |
| `blocage.test.ts: avancement-emporte-blocage` | quand déclencheur vrai ET échéance, avancement seul | jest | KR-246 | L1 |
| `blocage.test.ts: dernier-rang-bloque` | dernier rang avec `duree` peut être bloqué | jest | — | L1 |
| `blocage.test.ts: absent-ou-rang0-sans-depuis-origine-0` | `etape_plan` absent → origine 0, `{rang:0}` sans `depuis` → origine 0 | jest | KR-013 | L1 |
| `blocage.test.ts: rang-ge1-sans-depuis-jamais` | `{rang:1}` sans `depuis` → `undefined` | jest | KR-251 | L1 |
| `blocage.test.ts: rang-hors-bornes-no-op` | rang négatif, non entier, hors plan → `undefined` | jest | — | L1 |
| `blocage.test.ts: sans-duree-pas-de-constat` | `duree` absent → `undefined` | jest | — | L1 |
| `horloge.test.ts: journal-etape-bloquee` | le tick écrit `etape_bloquee : <id> <k+1>` au pas d'échéance | jest | — | L1 |
| `horloge.test.ts: journal-meme-sans-si-bloque` | `duree` sans `si_bloque` → la ligne journal s'écrit quand même | jest | — | L1 |
| `horloge.test.ts: garde-source-duree-depuis` | `horloge.ts` ne contient ni `.duree` ni `.depuis` en lecture | contrat | KR-246 | L1 |
| `evaluate.test.ts: garde-baril-blocage` | ni `etapeBloqueeAuPas` ni `'./dossier/blocage'` dans `brain/index.ts` | contrat | — | L1 |
| `contexte.test.ts: pnj-bloque-present-si-bloque` | PNJ perceptible + constat + `si_bloque` rédigé → ligne dans PENDANT CE TEMPS | jest | — | L2 |
| `contexte.test.ts: pnj-bloque-absent-silence` | PNJ bloqué mais absent du lieu → rien en R3 (journal oui) | jest | — | L2 |
| `contexte.test.ts: si-bloque-sans-etape-plan` | `si_bloque` posé mais `etape_plan` absent → pas d'injection (veto QA O3) | jest | — | L2 |
| `contexte.test.ts: garde-CHEMIN-SI-BLOQUE` | audience `ia`, absent de `CHAMPS_INJECTES_NARRATEUR` et de la liste des onze | contrat | — | L2 |
| `contexte.test.ts: etape-plan-meme-reference` | à l'échéance, `etape_plan` garde la même référence (la minuterie reste abolie) | jest | — | L1 |

**Non vérifiable en l'état** : le budget conditionnel (critère #8) dépend de la mesure en L2 — la valeur de M n'est connue qu'après écriture du code.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM O1 | Goal = liste de champs, pas phrase de démo | `RETENU` | phrase de démo adoptée : « l'auteur lit qu'un PNJ coincé trop longtemps à une étape change d'approche » |
| 2 | PM O2 | Journal et R3 = deux sites de décision (KR-246) | `RETENU` | prédicat unique `etapeBloqueeAuPas` dans `blocage.ts`, unanimité 5/5 |
| 3 | PM O3 | Étape 0 : `depuis` absent rend `si_bloque` inatteignable | `RETENU` | position TL adoptée : rang 0 ou absent → origine 0 ; rang ≥ 1 sans `depuis` → jamais. Satisfait le veto PM (Sélène/Corvin atteignables) et la réserve NIA (pas de `depuis` inventé pour rang ≥ 1) |
| 4 | PM O4 | J2 règle 8 contredit it3 | `RETENU` | règle 8 reformulée (« `depuis` ne décide jamais d'un avancement ») ; lignes 4/7 passent de `>=` à `===` ; réécrit EN PREMIER dans L1 |
| 5 | PM O5 | `CHEMIN_SI_BLOQUE` constante et garde propres | `RETENU` | constante + garde dédiée dans `contexte.test.ts`, L2 |
| 6 | QA O1 | Test `depuis` absent + `duree` posée | `RETENU` | absorbé dans `blocage.test.ts: rang-ge1-sans-depuis-jamais` et `absent-ou-rang0-sans-depuis-origine-0` |
| 7 | QA O2 | Avancement/blocage mutuellement exclusifs | `RETENU` | test `blocage.test.ts: avancement-emporte-blocage`, L1 |
| 8 | QA O3 | `si_bloque` sans `etape_plan` pas d'injection | `RETENU` | test `contexte.test.ts: si-bloque-sans-etape-plan`, L2 (veto QA satisfait) |
| 9 | UX O1 | MAJUSCULES casseraient le registre journal | `RETENU` | `etape_bloquee` en snake_case minuscule, MAJUSCULES réservées au bandeau it4 |
| 10 | UX O2 | `>=` produit du spam | `RETENU` | front `===`, unanimité 5/5 |
| 11 | TL O1 | `>=` est un niveau, pas un événement | `RETENU` | front `===`, KR-013 |
| 12 | TL O2 | `continue` de `horloge.ts:118-119` sautent le contrôle | `RETENU` | fusion en un seul `if` avancer+`continue`, constat ensuite, L1 |
| 13 | TL O3 | Sélène/Corvin `si_bloque` inatteignable | `RETENU` | absorbé dans D3 (origine 0 pour rang 0) |
| 14 | TL O4 | Lire `.duree`/`.depuis` dans `horloge.ts` casse la garde | `RETENU` | `blocage.ts` le résout — `horloge.ts` ne lit ni `.duree` ni `.depuis` |
| 15 | NIA O1 | Injection comme état, pas événement | `RETENU` | front `===`, unanimité 5/5 |
| 16 | NIA O2 | `etape_plan` absent → origine 0 | `REJETÉ` | NIA l'a elle-même retirée au tour 2 (« inventer un `depuis` viole le contrat it2 »). La position TL (rang 0 → origine 0, rang ≥ 1 → jamais) est adoptée, qui ne stocke rien et respecte le contrat |
| 17 | NIA P2 | `si_bloque` remplace `action` (disjoints, pas additive) | `RETENU` | le pire cas prend max(action, si_bloque) par PNJ ; budget à mesurer, pas à supposer |
| 18 | TL annexe | `replier` dupliqué non remonté dans `noyau.ts` | `REPORTÉ` | dette à déclencheur — un seul duplication, deux appelants, même sous-arbre |
| 19 | TL annexe | Invite du narrateur non amendée | `REJETÉ` | NIA tour 2 : « pas une dette, PENDANT CE TEMPS n'est cité par aucune invite » |
| 20 | NIA annexe | Texte d'auteur peut contredire la présence statique | `REPORTÉ` | limite d'écriture, à noter pour l'auteur — hors périmètre moteur |
| 21 | UX tour 2 | Libellé du champ `si_bloque` pour l'auteur | `REPORTÉ` | touche l'éditeur de dossier (feature `dossier-format`), pas le moteur. Le libellé UX est enregistré pour le raffinage de la fiche de plan |
| 22 | TL tour 2 | `worker/index.test.ts` sort de L2 | `RETENU` | pas de pin statique dans ce fichier |

## 9 — *(supprimé — aucune innovation)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Sonde jest exécutée en pré-étape de L1, rouges absorbés
- [ ] Budget M mesuré en pré-étape de L2, constantes ajustées si M > 2333
- [ ] J2 réécrite dans `docs/REGLES-PLAY.md` AVANT tout code (L1)
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-horloge-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | O3 : position TL adoptée (rang 0 → origine 0), Sélène/Corvin atteignables. O4 : J2 réécrite avant le code. O5 : `CHEMIN_SI_BLOQUE` avec garde. |
| Tech Lead | recevable | O2 : fusion `continue`. O4 : résolue par `blocage.ts`. |
| UX | recevable sous réserve | O1 : `etape_bloquee` snake_case. O2 : `===` unanime. |
| QA | recevable sous réserve | O2 : test `avancement-emporte-blocage`. O3 : test `si-bloque-sans-etape-plan` (veto satisfait). |
| Narratif & IA | recevable | O1 : `===` unanime. O2 : retirée (validateur signale le contenu mort). |
