# Plan d'itération — `moteur-horloge` · itération `2`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-05
> Composition : `5 rôles` — motif : l'itération touche le moteur (horloge), l'assembleur R3 (contexte narrateur) et la frontière code/IA (audience des champs injectés)
> Exécution : `séquentielle` (2 lots contrat)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur lit, dans le récit du narrateur, ce qu'un PNJ présent a fait pendant son dernier pas. » |
| **Tranche** | tick moteur (`horloge.ts`) écrit `depuis` → assembleur R3 (`contexte/horloge.ts`) sélectionne les PNJ avancés au lieu courant → bloc PENDANT CE TEMPS injecté dans le prompt → narrateur intègre dans sa prose |
| **Lots** | 2 lots · tous `contrat` : L1 brain/dossier, L2 brain/copilote + worker |
| **Hors périmètre** | durée, bloqué, si_bloque, bandeau PAS #n, climat, contre-mesures, transfert d'indices, enrichissement R4, minuterie |
| **Reporté** | durée + bloqué + si_bloque → it3 · climat + bandeau → it4 · n° 14 passe de 3 à 4 itérations |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur lit, dans le récit du narrateur, ce qu'un PNJ présent a fait pendant son dernier pas. »

## 2 — Hors périmètre

- Durée (`duree`), bloqué, `si_bloque`, minuterie — it3.
- Bandeau `PAS #n`, `CLIMAT · {nom}` — it4.
- Climat activation/extinction — it4.
- Extraction `sessionCombat.ts` — it4.
- Contre-mesures, transfert d'indices — hors n° 14.
- Enrichissement R4 (état courant du PNJ dans le contexte `parler`) — hors n° 14.
- Modificateurs numériques — KR-208 interdit.
- Filtre par lieux adjacents — seul `personnagesPresents` (lieu courant) s'applique.
- Narration des pas `parler`/console — pas de surface R3 là, doctrine inchangée (pas courant seul).
- Pointeur de narration en session — champ neuf interdit.
- Label « ÉTAPE BLOQUÉE » en majuscules — décision de registre en it3.
- `si_bloque` répété à chaque pas — hors scope, bloqué est un événement unique.
- Tri-état `declencheurDEtape` — retiré (minuterie abolie, booléen `etapeDeclenchee` suffit).

## 3 — Contrat de design

Aucun composant UI touché en it2. Aucun token, aucun état vide nouveau.

- Ligne de journal d'avancement : inchangée (it1), registre interface, terse, minuscule — `etape_plan : <id> <k+1> → <n+1>`.
- Interdit en it2 : tout texte de fiction au journal, tout libellé joueur sur la ligne moteur, tout accent/`--good`/`--bad` sur les éléments d'horloge.
- Clavier : inchangé.
- Dette notée pour it3+ : `fontWeight: 'bold'` et `width: '1px'` en dur dans `BandeauHeros.tsx` (l.65, l.74) — dette à déclencheur, veto UX quand le fichier sera rouvert.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatPnj.etape_plan` | service | émet | `etape_plan?: { readonly rang: number; readonly depuis?: number }` — `depuis` optionnel (KR-251), écrit `= session.horloge.tour` à chaque avancement, jamais autrement. |
| `sessionDestinations` | registre | émet | `'monde.pnj.<id>.etape_plan.depuis': 'moteur'` |
| `tickHorloge` | service | émet | Signature INCHANGÉE : `tickHorloge(dossier: Dossier, session: EtatSession): EtatSession`. Corps étendu : `avancer()` écrit `{ rang, depuis: session.horloge.tour }`. |
| `lignesPendantCeTemps` | service | émet | `lignesPendantCeTemps(dossier: Dossier, session: EtatSession): readonly string[]` — une ligne par PNJ avancé à ce pas ET présent au lieu courant, prose `plan_actions[rang].action` ; silence si action absente. |
| `CHEMIN_ACTION_DE_PLAN` | registre | émet | `'monde.personnages[].plan_actions[].action'` — constante dans `contexte/horloge.ts`, garde dédiée dans `contexte.test.ts`. |
| `personnagesPresents` | service | consomme | Existant dans `commandes.ts`, inchangé. Filtre de perceptibilité unique. |
| `executerCommande` | service | consomme | Signature INCHANGÉE. Le tick tourne déjà après les jalons. |

**Logique de sélection de `lignesPendantCeTemps`** (interne, non exportée, mais documentée pour testabilité — QA) :
- Un PNJ a avancé à ce pas ⟺ `session.monde.pnj[id].etape_plan?.depuis === session.horloge.tour`.
- Perceptible ⟺ `id ∈ personnagesPresents(dossier, session)`.
- La ligne est la prose `plan_actions[rang].action`, repliée. Silence si absente ou marquée.
- Ordre : `monde.personnages[]` (document). Ni `rang`, ni `depuis`, ni `id` dans le texte.

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Contexte injecté** | Bloc PENDANT CE TEMPS, posé après CE PAS et avant EN SA POSSESSION. Une ligne par PNJ avancé + présent + action rédigée. Prose `plan_actions[rang].action` seule, sans identifiant. Ne s'écrit que si ≥ 1 ligne. |
| **Schéma de sortie** | Inchangé (`NarrationRendue`). PENDANT CE TEMPS est une ENTRÉE (contexte), pas une sortie. |
| **Échec de validation** | Inchangé. Budget dépassé → cascade P0-P4 existante. PENDANT CE TEMPS hors cascade (ni levier ni invariant). |
| **Ce que l'IA ne fait pas** | Ne décide jamais qu'un PNJ avance (moteur). Ne lit jamais `etape_plan.rang`, `depuis`, `declencheur_expr`, `duree`. Ne lit `plan_actions[].action` que dans PENDANT CE TEMPS, étape courante du PNJ désigné par le moteur. |

**Budget** : `BUDGET_CARACTERES_DOSSIER` re-mesuré. Le terme M franchit vraisemblablement 2000 (actuellement 1997), donc la constante passe de 6000 à 7000 (`ceil(M×3/1000)×1000`). Le `max` du worker et l'invite se re-dérivent dans le même lot. `pireCasNarrateur()` étendu pour inclure la plus longue `action` d'un PNJ présent. Prose non bornée → marge ×3 sur le terme dossier.

**Renversement de doctrine** : `narrateur.ts:76` exclut « toute donnée de personnage ». L'injection de `plan_actions[].action` est une dérogation écrite. Le chemin est dans une constante propre (`CHEMIN_ACTION_DE_PLAN`) dans `contexte/horloge.ts`, avec garde dédiée. `CHAMPS_INJECTES_NARRATEUR` reste à 8 chemins (le nouveau chemin n'y entre pas), et la garde `contexte.test.ts:3094` reste intacte.

## 5 — Lots

> Deux lots `contrat`, séquentiels. Aucun lot feature. `evaluate.ts`, `types.ts`, `destinations.ts`, `validate.ts`, `session.ts`, `copilote/types.ts`, `useTourDeJeu.ts` et tout fichier `play-mode/components/` ne sont touchés par aucun lot.

### Lot 1 — `L1-moteur-depuis` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : écrire `depuis = horloge.tour` à chaque avancement, déclarer l'audience, réécrire J2 colonne it2
- **Fichiers** :
  - `docs/REGLES-PLAY.md` (R) — J2 colonne it2 : minuterie abolie, `duree` sur k, `depuis`
  - `src/brain/dossier/faits.ts` (R) — `etape_plan?: { readonly rang: number; readonly depuis?: number }`
  - `src/brain/dossier/sessionDestinations.ts` (R) — `'monde.pnj.<id>.etape_plan.depuis': 'moteur'`
  - `src/brain/dossier/horloge.ts` (R) — `avancer()` écrit `{ rang, depuis: session.horloge.tour }`
  - `src/brain/dossier/horloge.test.ts` (R)
  - `src/brain/dossier/commandes.test.ts` (R) — test de couture
  - `src/brain/dossier/sessionCouverture.test.ts` (R) — assertions R-8 « pas de depuis » inversées
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — `depuis` instancié
- **Expose** : `EtatPnj.etape_plan.depuis`, audience `moteur`, `tickHorloge` signature inchangée
- **Consomme** : rien de neuf
- **Critères couverts** : #1, #2, #3

### Lot 2 — `L2-narrateur-pendant-ce-temps` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, après L1 figé)
- **But** : bloc PENDANT CE TEMPS dans l'assembleur R3, budget re-mesuré, max worker re-dérivé
- **Fichiers** :
  - `src/brain/copilote/contexte/horloge.ts` (N) — `lignesPendantCeTemps`, `CHEMIN_ACTION_DE_PLAN`
  - `src/brain/copilote/contexte/narrateur.ts` (R) — bloc PENDANT CE TEMPS après CE PAS, dérogation l.76, `BUDGET_CARACTERES_DOSSIER` re-mesuré
  - `src/brain/copilote/contexte.test.ts` (R) — tests du bloc, garde du chemin, audience, silence
  - `worker/index.ts` (R) — `max` du worker re-dérivé
  - `worker/index.test.ts` (R) — `PENDANT CE TEMPS` dans le balayage d'en-têtes
  - `worker/frontiere.test.ts` (R) — pins re-dérivées
- **Expose** : `lignesPendantCeTemps(dossier, session): readonly string[]`, `CHEMIN_ACTION_DE_PLAN`
- **Consomme** : `EtatPnj.etape_plan.depuis` (L1), `personnagesPresents` (existant)
- **Critères couverts** : #4, #5, #6, #7

## 6 — Critères d'acceptation

1. **Étant donné** un PNJ avec `plan_actions` et un déclencheur vrai sur l'étape suivante **quand** une commande est acceptée **alors** `etape_plan.depuis === session.horloge.tour` dans l'entrée PNJ mise à jour — *unitaire · L1*
2. **Étant donné** un PNJ dont le déclencheur suivant est faux **quand** une commande est acceptée **alors** `depuis` n'est pas écrit, `rang` inchangé — *unitaire · L1*
3. **Étant donné** une session 0.7.21 où `etape_plan = { rang }` sans `depuis` **quand** le tick tourne **alors** le comportement it1 est inchangé (pas de crash, `depuis` n'est pas inventé) — *unitaire · L1*
4. **Étant donné** un PNJ avancé à ce pas ET présent au lieu courant, avec `action` rédigée **quand** l'assembleur R3 compose le contexte **alors** le bloc PENDANT CE TEMPS contient la prose de `action` — *contrat · L2*
5. **Étant donné** un PNJ avancé à ce pas mais PAS au lieu courant **quand** l'assembleur R3 compose le contexte **alors** aucune ligne pour ce PNJ dans PENDANT CE TEMPS — *contrat · L2*
6. **Étant donné** un PNJ avancé à ce pas, présent au lieu courant, `action` NON rédigée **quand** l'assembleur R3 compose le contexte **alors** silence (aucune ligne) — *contrat · L2*
7. **Étant donné** PENDANT CE TEMPS injecté dans le pire cas **quand** `BUDGET_CARACTERES_DOSSIER` et `max` du worker sont re-dérivés **alors** `frontiere.test.ts` et `index.test.ts` passent — *contrat · L2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `horloge.test.ts` « avancement écrit depuis = tour » | `session.monde.pnj[id].etape_plan.depuis === session.horloge.tour` | jest | KR-298 | L1 |
| `horloge.test.ts` « pas d'avancement → pas de depuis » | `depuis` absent ou inchangé | jest | KR-298 | L1 |
| `horloge.test.ts` « session 0.7.21 {rang} sans depuis » | pas de crash, rang avance normalement | jest | KR-251 | L1 |
| `sessionCouverture.test.ts` « depuis présent » | assertions R-8 inversées | jest | KR-298 | L1 |
| `commandes.test.ts` « couture depuis » | `depuis` écrit après commande acceptée | jest | KR-298 | L1 |
| `contexte.test.ts` « PENDANT CE TEMPS : PNJ avancé + présent + action » | prose de `action` dans le bloc | contrat | — | L2 |
| `contexte.test.ts` « PENDANT CE TEMPS : PNJ absent du lieu → silence » | pas de ligne | contrat | — | L2 |
| `contexte.test.ts` « PENDANT CE TEMPS : action non rédigée → silence » | pas de ligne | contrat | — | L2 |
| `contexte.test.ts` « chemin action : audience ia, garde dédiée » | constante présente, garde sanctionnée | contrat | — | L2 |
| `contexte.test.ts` « depuis et rang absents du texte de contexte » | ni nombre ni identifiant dans la ligne | contrat | — | L2 |
| `frontiere.test.ts` « pins budget re-dérivées » | frontiere verte après re-mesure | contrat | — | L2 |
| `index.test.ts` « PENDANT CE TEMPS dans le balayage d'en-têtes » | le modèle n'apprend pas l'en-tête | contrat | — | L2 |
| `moteurSansIA.test.ts` « horloge.ts sans appel modèle » | source de horloge.ts sans import modèle | jest | KR-250 | L1 |

**Non vérifiable en l'état** : la qualité de la prose narrative de l'IA intégrant PENDANT CE TEMPS (dépend du modèle, pas d'un instrument).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Veto de coupe : 3 comportements fusionnés (avancement, bloqué, bandeau) | `RETENU` | It2 réduit à depuis + R3. Bloqué → it3, bandeau → it4. |
| 2 | PM | 5 itérations pour n° 14 (2a/2b/2c/3/4) | `REJETÉ` | 4 itérations (TL). Regrouper bandeau + climat (même fichier) et bloqué + durée (même mécanisme). |
| 3 | PM | Perceptibilité hors périmètre | `REJETÉ` | `personnagesPresents` existe déjà dans `commandes.ts`. Le filtre est dans L2. |
| 4 | PM | `depuis` absent ≡ 0 | `REJETÉ` | TL t2 : `etape_plan.depuis` absent (sessions 0.7.21) ≡ jamais en échéance. Distinction avec `etape_plan` absent ≡ rang 0 (KR-013). |
| 5 | PM | `duree` échue = bloqué, J2 minuterie abolie | `RETENU` | Consensus 5 rôles. J2 réécrite dans L1. |
| 6 | TL | `changementsDuPas` exporté de brain/dossier | `REJETÉ` | TL l'a retiré lui-même (un seul appelant). Sélection inline dans `contexte/horloge.ts`. |
| 7 | TL | Tri-état `declencheurDEtape` | `REJETÉ` | TL l'a retiré (minuterie abolie). Booléen `etapeDeclenchee` suffit. |
| 8 | TL | Budget narrateur franchit palier 2000 | `RETENU` | Re-mesure dans L2. BUDGET de 6000 à 7000 si M > 2000. |
| 9 | TL | `duree` lue sur k (étape courante) | `RETENU` | Consensus. types.ts:433 fait foi. |
| 10 | TL | Bloqué sans lecteur en it2 | `REPORTÉ` | Reposé en it3, lecteur = `si_bloque` dans PENDANT CE TEMPS. |
| 11 | TL | `depuis` conservé en it2 (veto durci) | `RETENU` | KR-249 : lecteur = sélection du bloc PENDANT CE TEMPS (`depuis === tour`). |
| 12 | UX | Phrase « sous le récit » fausse | `RETENU` | Corrigée → « dans le récit du narrateur ». |
| 13 | UX | Prop `pas`, jamais `tour` (J1) | `REPORTÉ` | Prop pas en it4 (bandeau). |
| 14 | UX | ÉTAPE BLOQUÉE = faute de registre | `REPORTÉ` | Décision de registre en it3. Ligne journal minuscule, mono MAJUSCULES réservé au bandeau. |
| 15 | UX | `1px`/`bold` en dur dans BandeauHeros | `REPORTÉ` | Dette à déclencheur. Veto UX quand le fichier sera rouvert (it4). |
| 16 | QA | Critère mélange construction/narratif | `RETENU` | Séparé : contrat = bloc R3, usage = prose IA (non vérifiable). |
| 17 | QA | Filtre spatial non spécifié | `RETENU` | `personnagesPresents` (lieu courant). |
| 18 | QA | Architecture `changementsDuPas` non explicite | `RETENU` (compromis) | Sélection inline (TL), logique documentée dans le plan § 4. `lignesPendantCeTemps` = contrat testable. |
| 19 | NIA | `plan_actions[].action` = nouveau chemin injecté | `RETENU` | Constante dans `contexte/horloge.ts`, garde dédiée. Dérogation à narrateur.ts:76 documentée. |
| 20 | NIA | `depuis` absent (sessions 0.7.21) | `RETENU` (TL t2) | ≡ jamais en échéance. Distinct de `etape_plan` absent ≡ rang 0. |
| 21 | NIA | Label ÉTAPE BLOQUÉE | `REPORTÉ` | It3. |
| 22 | NIA | Bloc PENDANT CE TEMPS levier cascade P1.5 | `REJETÉ` | Hors cascade (TL, NIA concède t2). |

## 9 — Innovation

*Aucune.*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `moteurSansIA.test.ts` vert (KR-250/260)
- [ ] `BUDGET_CARACTERES_DOSSIER` et `max` du worker re-mesurés (pas recopiés)
- [ ] J2 colonne it2 réécrite AVANT le code (NIA)
- [ ] Dérogation à `narrateur.ts:76` documentée dans le code
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-horloge-it2.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | veto levé par la coupe (it2 réduit, 4 itérations) |
| Tech Lead | recevable | `depuis` conservé en it2 (veto durci accepté) |
| UX | recevable | zéro composant UI en it2 (contrat de langue seul) |
| QA | recevable | logique de sélection documentée dans § 4 (compromis) |
| Narratif & IA | recevable | `action` = chemin unique ouvert, garde dédiée, budget re-mesuré |
