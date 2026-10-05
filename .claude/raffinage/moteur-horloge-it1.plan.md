# Plan d'itération — `moteur-horloge` · itération `1`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-05
> Composition : 5 rôles — motif : itération moteur, frontière code/IA, contrat de sortie IA
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut lire au journal qu'un PNJ est passé à l'étape suivante de son plan dès que le déclencheur de cette étape est vrai. » |
| **Tranche** | `REGLES-PLAY.md` § J2 → `faits.ts` (type) → `sessionDestinations.ts` (audience) → `evaluate.ts` (sélecteur) → `horloge.ts` (tick pur) → `commandes.ts` (couture) → `horloge.test.ts` + `commandes.test.ts` (preuve) |
| **Lots** | 1 lot · `contrat` : oui (tout sous `brain/` ou `docs/`) |
| **Hors périmètre** | bandeau « PAS #n », bloc R3 « PENDANT CE TEMPS », durée / `depuis` / bloqué / `si_bloque`, minuterie, climat, UI neuve, prédicat sur `etape_plan`, enrichissement R4, extraction `sessionCombat.ts`, tout effet de monde d'une étape, `changementsDe` |
| **Reporté** | durée + `depuis` + bloqué + minuterie → it2 (bloc indissociable, NIA : `depuis` entre avec la formule dans le même lot) · bandeau → it2 · enrichissement R4 → indéfini · nombre d'itérations 3→4 → cadrage futur |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut lire au journal qu'un PNJ est passé à l'étape suivante de son plan dès que le déclencheur de cette étape est vrai. »

## 2 — Hors périmètre

- **Durée / `depuis` / bloqué / `si_bloque`** — bloc indissociable, reporté it2. Contrainte de phasage (NIA, non négociable) : `depuis` entre AVEC la formule `tour − depuis >= duree[k]`, même lot, même itération.
- **Minuterie** (durée sans déclencheur → avance) — reporté it2, avance où l'éditeur promet « bloqué ».
- **Bandeau « PAS #n »** — it2 (cadrage).
- **Bloc R3 « PENDANT CE TEMPS »** — it2.
- **Enrichissement R4** (injection de rang/action dans le contexte acteur) — reporté indéfiniment.
- **Climat** — it3 ou it4.
- **UI neuve** — aucune. Le journal est la seule surface.
- **Prédicat sur `etape_plan`** — aucun `ExprNode` ne lit `rang`.
- **`changementsDe`** en retour du tick — aucun appelant en it1.
- **Extraction `sessionCombat.ts`** — dette n° 13.
- **Tout effet de monde d'une étape** — hors n° 14.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Aucun composant nouveau, aucun token nouveau, aucun état vide nouveau. `JournalRow` est réutilisé tel quel. Le clavier ne change pas.

**Ligne de journal du tick** (format UX, base 1) :
- Premier avancement (etape_plan était absent) : `etape_plan : {pnj.id} {rang+1}` — sans flèche (précédent `lieu_courant`, `commandes.ts:400`).
- Avancements suivants : `etape_plan : {pnj.id} {ancien_rang+1} → {nouveau_rang+1}`.
- `role: 'moteur'`, aucun champ `origine`, `deltas`, `recit`, `jet`, `interlocuteur`.
- Pas de prose, pas de verbe, pas de nom d'action, pas de `si_bloque` (veto UX registre).

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatPnj.etape_plan` | type | émet | `readonly etape_plan?: { readonly rang: number }` — optionnel à vie (KR-251) |
| `sessionDestinations` | registre | émet | `'monde.pnj.<id>.etape_plan.rang': 'moteur'` — une seule feuille |
| `etapeDeclenchee` | service | émet | `(faits: FaitsDeSession, etape: PlanAction) => boolean` — dans `evaluate.ts` |
| `tickHorloge` | service | émet | `(dossier: Dossier, session: EtatSession) => EtatSession` — dans `horloge.ts` |
| `executerCommande` | service | consomme | signature inchangée ; bras ok : `tickHorloge(dossier, avecJalonsResolus(…))` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Contexte injecté** | aucun — gardes `contexte/acteur.ts:76` et `narrateur.ts` inchangées |
| **Schéma de sortie** | aucun — aucun appel modèle |
| **Échec de validation** | sans objet — le tick est pur et total sur un dossier `jouable` |
| **Ce que l'IA ne fait pas** | dés, stats, inventaire, XP, durée, bloqué — tout résolus par le moteur |
| **Audience** | `'moteur'` sur `etape_plan.rang` — un modèle qui lirait `rang` connaîtrait l'étape et jouerait une urgence non constatée |
| **Preuve exigée** | `moteurSansIA.test.ts` vert ; fixture instancie `etape_plan.rang` (pas `depuis`) ; aucune ligne `'ia'` dans `sessionDestinations.ts` |

## 5 — Lots

> Un seul lot. Tout fichier touché est sous `brain/` ou `docs/`. Exécution séquentielle, sans worktree ni fusion.

### Lot A — `horloge-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : § J2 de REGLES-PLAY.md, type `etape_plan`, sélecteur `etapeDeclenchee`, tick pur `tickHorloge`, couture dans `executerCommande`
- **Fichiers** :
  - `docs/REGLES-PLAY.md` (R) — § J2, table complète avec portions it2 marquées, écrit **en premier**
  - `src/brain/dossier/faits.ts` (R) — `EtatPnj.etape_plan?: { readonly rang: number }`
  - `src/brain/dossier/sessionDestinations.ts` (R) — une feuille `'monde.pnj.<id>.etape_plan.rang': 'moteur'`
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — `pnj.aldur-le-sage` reçoit `etape_plan: { rang: 1 }` (jamais 0, car absent ≡ 0). `pnj.corvin-le-marchand` reste sans.
  - `src/brain/dossier/sessionCouverture.test.ts` (R) — comptes recalculés depuis la doc (une feuille de plus), pas depuis le rouge
  - `src/brain/dossier/evaluate.ts` (R) — `export function etapeDeclenchee(faits, etape): boolean`
  - `src/brain/dossier/evaluate.test.ts` (R) — tests de `etapeDeclenchee`, garde ligne 706 inchangée
  - `src/brain/dossier/horloge.ts` (N) — `export function tickHorloge(dossier, session): EtatSession`
  - `src/brain/dossier/horloge.test.ts` (N) — table J2, scénario séparateur, cas limites, croisé, couture
  - `src/brain/dossier/commandes.ts` (R) — `tickHorloge(dossier, avecJalonsResolus(dossier, resultat.session))`
  - `src/brain/dossier/commandes.test.ts` (R) — couture refus/combat
- **Expose** : `etapeDeclenchee`, `tickHorloge` (ni l'un ni l'autre exporté par `brain/index.ts`)
- **Consomme** : `evaluerExpr` (evaluate.ts), `avecJalonsResolus` (commandes.ts), `EtatPnj`/`FaitsDeSession` (faits.ts), `Dossier`/`PlanAction` (types.ts), `EtatSession` (session.ts — `import type` seulement)
- **Critères couverts** : #1–#8

**Ordre d'exécution dans le lot** :
1. `REGLES-PLAY.md` § J2
2. `faits.ts` (type)
3. `sessionDestinations.ts` (audience)
4. fixture + `sessionCouverture.test.ts` (comptes)
5. `evaluate.ts` + `evaluate.test.ts` (sélecteur)
6. `horloge.ts` + `horloge.test.ts` (tick + preuve)
7. `commandes.ts` + `commandes.test.ts` (couture)

## 6 — Critères d'acceptation

1. **Étant donné** un PNJ à rang k (ou absent ≡ 0) dont `plan_actions[k+1]` porte un `declencheur_expr`, **quand** le joueur exécute une commande qui rend ce déclencheur vrai (évalué sur les faits après jalons), **alors** `etape_plan` est écrit à `{ rang: k+1 }` et une ligne `role: 'moteur'` au format base 1 apparaît au journal. — *unitaire* — *lot A*

2. **Étant donné** un PNJ dont `plan_actions[k+1]` porte un `declencheur_expr` faux, **quand** le joueur exécute des commandes (même si `duree` est posée et échue sur l'étape courante), **alors** le PNJ reste au même rang, aucune ligne n'est ajoutée, et `tickHorloge` rend la même référence (`toBe`). — *unitaire* — *lot A*

3. **Étant donné** un PNJ au dernier rang, ou rang hors bornes, ou plan vide, ou plan d'une étape, **quand** le joueur exécute une commande, **alors** `tickHorloge` ne modifie ni `etape_plan` ni `journal` et rend la même référence (`toBe`). — *unitaire* — *lot A*

4. **Étant donné** un PNJ dont aucune étape de `plan_actions` ne porte de `declencheur_expr` (plan en prose seule), **quand** le joueur exécute des commandes, **alors** le PNJ est immobile et aucune ligne n'apparaît. — *unitaire* — *lot A*

5. **Étant donné** une commande refusée ou un combat en cours, **quand** `executerCommande` rend `{ ok: false }`, **alors** `tickHorloge` n'est pas appelé. — *unitaire* — *lot A*

6. **Étant donné** un PNJ avec `etape_plan`, `a_dit` et `confiance`, **quand** le tick écrit `etape_plan`, **alors** `a_dit` et `confiance` survivent sans mutation (croisé trois écrivains). — *unitaire* — *lot A*

7. **Étant donné** une ligne produite par le tick, **alors** elle ne porte ni `origine`, ni `deltas`, ni `recit`, ni `jet`, ni `interlocuteur`, et n'est jamais « porteuse » pour `ligneDuPas` ni `consignerJet`. — *unitaire* — *lot A*

8. **Étant donné** une session avant et après `tickHorloge`, **alors** seuls `monde.pnj[*].etape_plan` et `journal` diffèrent ; tout autre champ de `EtatSession` est structurellement identique. — *unitaire* — *lot A*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `horloge.test.ts` — scénario séparateur 3 étapes [A sans décl, B décl T1, C décl T2] | Pas 1 T1 faux T2 vrai → `toBe(session)` ; pas 2 T1 vrai → `{ rang: 1 }` + 1 ligne ; pas 3 T2 vrai → `{ rang: 2 }` + 1 ligne | jest | AC1, AC2 | A |
| `horloge.test.ts` — aucune lecture de `duree` | Étape à `duree: 1`, décl faux pendant 5 pas → `toBe(session)` chaque pas | jest | AC2 | A |
| `horloge.test.ts` — cas limites | plan vide, une étape, dernier rang, rang 7/plan 3, rang −1, rang 1.5, décl absent → `toBe(session)` | jest | AC3 | A |
| `horloge.test.ts` — plan prose seule | Aucun `_expr` dans plan → PNJ immobile, aucune ligne | jest | AC4 | A |
| `horloge.test.ts` — croisé trois écrivains | `crediterConfiance` + `consignerReponseActeur` + tick, deux ordres : `a_dit`, `confiance`, `etape_plan` survivent | jest | AC6, KR-298 | A |
| `horloge.test.ts` — ligne non porteuse | Ligne du tick sans `origine`/`deltas`/`recit`/`jet`/`interlocuteur` ; `ligneDuPas` et `consignerJet` ne la ramassent pas | jest | AC7 | A |
| `horloge.test.ts` — périmètre du tick | Après retrait de `monde.pnj[*].etape_plan` et des lignes ajoutées, session deep-equal à l'entrée | jest | AC8 | A |
| `horloge.test.ts` — contexte R3 octet-identique | Pour un pas dont le tick écrit, le contexte R3 ne change pas | jest | KR-295 (NIA) | A |
| `commandes.test.ts` — couture refus/combat | Refus → aucun tick ; combat → refusé avant tout tick | jest | AC5, KR-295 | A |
| `evaluate.test.ts` — `etapeDeclenchee` | Décl absent → `false` ; décl vrai → `true` ; décl faux → `false` ; condition inconnue → lève | jest | KR-246 | A |
| `evaluate.test.ts` — garde ligne 706 | `.declencheur_expr` n'est lu que par `evaluate.ts` | jest | KR-246 | A |
| `moteurSansIA.test.ts` — scan `horloge.ts` | `horloge.ts` dans la liste dérivée du disque, import hors liste → rouge | jest | KR-250 | A |
| `sessionCouverture.test.ts` — comptes | Feuilles brutes de `monde.pnj.` recalculées depuis la doc (une de plus), normalisées, `LIGNES_ATTENDUES` | jest | — | A |

Cas limites couverts : vide (plan vide) · dernier rang · hors bornes (rang > length, négatif, non entier) · déclencheur absent · durée posée (ignorée) · croisé écrivains · refus · combat.

**Non vérifiable en l'état** — aucun.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM (veto) | Goal/AC1 « ou durée s'écoule » contredit `types.ts:433-446` | RETENU | Goal réécrit : déclencheur seul |
| 2 | PM, TL, NIA | `depuis` sans lecteur en it1 (KR-249) | RETENU | `etape_plan?: { rang }` seul ; `depuis` entre en it2 avec la formule de durée, même lot (NIA non négociable) |
| 3 | TL (veto) | Entrée stockée « rang 0 » = état dérivable (KR-013) | RETENU | absent ≡ 0 ; `etape_plan` écrit au seul avancement |
| 4 | UX (veto) | Registre : identifiants + rang base 1 seulement, pas de prose | RETENU | Format § 3 |
| 5 | TL, PM | 1 lot (TL) vs 4 lots (PM) | RETENU (TL) | Un seul lot `contrat`, exécution séquentielle |
| 6 | NIA | J2 écrit avant tout code, table complète avec portions it2 marquées | RETENU | § J2 de `REGLES-PLAY.md`, lot A étape 1 |
| 7 | PM | Roadmap ligne 14 : retrait de périmètre | RETENU | Durée/depuis/bloqué retirés, écart consigné |
| 8 | NIA R-1 | Avancer à l'échéance quel que soit le déclencheur suivant | REJETÉ | Contredit `types.ts:433-446`, rend `si_bloque` inatteignable |
| 9 | NIA R-2 | Stocker `bloque: boolean` ou écrire une ligne « bloquée » en it1 | REJETÉ | Dérivable (KR-013), sans consommateur avant it2 |
| 10 | NIA R-3 | Mettre une `origine` sur la ligne du tick | REJETÉ | Casse invariant `recit ⇒ origine` (`recit.ts:100`) |
| 11 | NIA R-4 | Recopier `plan_actions[].action` dans le texte du journal | REJETÉ | Prose `ia` verbatim interdite (3ᵉ source) |
| 12 | NIA R-5 | Lire `.declencheur_expr` dans `horloge.ts` | REJETÉ | Garde `evaluate.test.ts:706` (KR-246) |
| 13 | NIA R-6 | Avancer de plusieurs crans par pas | REJETÉ | `duree` imprévisible pour l'auteur (J1) |
| 14 | NIA R-7 | Injecter quoi que ce soit dans R3/R4 en it1 | REJETÉ | PENDANT CE TEMPS = it2, enrichissement R4 reporté |
| 15 | NIA R-8 | Écrire `depuis` sans consommateur dans le même lot | REJETÉ | KR-249 |
| 16 | TL | Ligne « bloqué » comme lecteur de `depuis` | REJETÉ | Dérivable (KR-013), retirée par TL au tour 2 |
| 17 | PM | Minuterie NIA (J2 cas 2) dans it1 | REJETÉ | Avance où l'éditeur promet « bloqué » (= R-1) |
| 18 | QA | AC3 (bandeau) dépend it2 | REPORTÉ | it2 |
| 19 | UX | Label « ÉTAPE BLOQUÉE » au journal | REPORTÉ | it2, avec durée/bloqué/R3 |
| 20 | NIA | Minuterie (durée sans déclencheur) | REPORTÉ | it2, bloc indissociable durée/depuis/bloqué |
| 21 | NIA | `changementsDe` en retour du tick | REPORTÉ | it2, aucun appelant en it1 |
| 22 | PM | Nombre d'itérations 3→4 | REPORTÉ | Cadrage futur, noté en `open_questions` |

## 9 — Innovation

Aucune.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste du lot A
- [ ] Gardes à relire : `evaluate.test.ts` (706 + « faits.ts n'importe RIEN »), `expr.test.ts` (recensement), `moteurSansIA.test.ts`, `sessionCouverture.test.ts`, `deltas.test.ts`
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-horloge-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | APPROVE | Veto levé : goal réécrit (déclencheur seul), durée/depuis/bloqué hors it1 |
| Tech Lead | APPROVE | Veto levé : absent ≡ 0 (KR-013), AC/KR réécrits, 1 lot |
| UX | APPROVE | Registre identifiants base 1, pas de bloqué, premier passage sans flèche |
| QA | APPROVE | AC réécrits, J2 + scénario séparateur, AC3 reporté it2 |
| Narratif & IA | APPROVE | J2 avant code, `depuis` reporté avec contrainte de phasage non négociable |
