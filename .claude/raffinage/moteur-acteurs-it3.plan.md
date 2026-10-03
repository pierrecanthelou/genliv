# Plan d'itération — `moteur-acteurs` · itération 3

> Statut : `validé` (2026-10-03)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-03
> Composition : 5 rôles — motif : l'itération touche le moteur IA (R4), le schéma de session (`EtatPnj.confiance`) et `docs/REGLES-DU-JEU.md` (KR-130/279).
> Exécution : séquentielle (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur voit la confiance qu'un PNJ accorde au joueur, gagnée réplique après réplique, finir par lui ouvrir un savoir qu'il gardait. » |
| **Tranche** | `parler <pnj>` (inchangé depuis it1) → R4 propose `delta_confiance` en plus de sa réplique → le moteur re-vérifie les révélations sur l'état d'avant Δ, les applique, PUIS crédite/sature la confiance de session du PNJ (`crediterConfiance`, seule porte d'écriture) → au tour suivant, si le seuil `confiance_min` est atteint, le savoir entre dans le catalogue borné (`CE QUE TU PEUX CONFIER`) et R4 peut le confier. |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, seul et en premier) |
| **Hors périmètre** | `jet` (4e porte, it4) ; `contrepartie.consomme:true` ; verbe `donner` ; bloc `PRESENTS` de R3 ; **signal qualitatif de confiance injecté au contexte R4** (« bloc ENVERS LUI ») — débattu en détail, rejeté pour it3, voir § 8 ; curseur `caractere.curseurs.mefiance` (aucun lecteur). |
| **Reporté** | Bloc qualitatif de confiance vers R4 → dette à déclencheur (playtest KR-229, une incohérence ton/état mesurée au-delà de K=4 répliques). `contrepartie.consomme:true` → verbe `donner` futur. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur voit la confiance qu'un PNJ accorde au joueur, gagnée réplique après réplique, finir par lui ouvrir un savoir qu'il gardait — la 3e des quatre portes de révélation (`confiance_min`) devient honorée, `jet` restant seule fermée (it4).

## 2 — Hors périmètre

- `jet` (4e et dernière porte, it4) — `issueDuJet`/`CarteJet` non touchés.
- `contrepartie.consomme:true` — reste structurellement fermé, aucun retrait d'objet.
- Verbe `donner <objet> <pnj>`.
- Bloc `PRESENTS` de R3 (déjà écarté en it1).
- **Signal qualitatif de la confiance injecté au contexte R4** (proposé par Narratif-IA tour 1 sous le nom « bloc ENVERS LUI », retiré par elle-même au tour 2 après vérification critère par critère : aucun AC d'it3 ne l'exige, le catalogue borné suffit à démontrer l'ouverture). Versé en dette à déclencheur : playtest KR-229, si une incohérence ton/état est mesurée en partie réelle au-delà de K=4 répliques.
- Un fichier `motsInterdits.ts` séparé — le besoin de l'UX (éviter que « confiance » entre en dur, sans registre, dans plusieurs invites) se résout en étendant la liste `interdits` déjà existante de `worker/index.test.ts` (précédent exact : `'jet'`/`'indice'` déjà exclus pour la même raison), pas en créant une nouvelle abstraction pour un problème déjà résolu deux fois par exclusion.
- Curseur `caractere.curseurs.mefiance` (`'moteur'`, aucun lecteur) — le lire exigerait d'abord une règle en `REGLES-DU-JEU.md`, hors périmètre ici.
- Toute surface d'écran neuve, toute jauge, tout badge numérique — AUCUN affichage chiffré au joueur (même doctrine que marge/TC, moteur-arbitre it2).

*(Écrit par le PM, validé à l'unanimité au tour 2. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Aucune surface d'écran neuve.** `delta_confiance` et `EtatPnj.confiance` sont d'audience `moteur` exclusivement — zéro ligne `'ia'`, zéro rendu UI (pas de Modal, pas de ListRow, pas de badge). Le canal de restitution reste celui d'it1/it2 : la `replique` de R4 par le canal RÉCIT existant.

**Registres de langue, précision apportée par ce raffinage (corrige l'ambiguïté du design_contract d'it1, ligne 14, relevée par l'UX) :**
- Le balayage « aucun mot de mécanique » (`worker/index.test.ts`, précédent KR-235/270) porte EXCLUSIVEMENT sur le BLOC SYSTÈME de l'invite (`INVITES['acteur'].systeme`), JAMAIS sur la `replique` produite par le modèle.
- La `replique` reste prose libre : elle PEUT légitimement contenir « confiance » en diégèse (« je ne vous fais pas confiance » est un signal narratif voulu, pas une fuite de mécanique).
- La seule garde côté `replique` qui subsiste est l'absence de chiffre `[0-9]` (déjà actée, inchangée).
- `'confiance'` est RETIRÉ de la liste `interdits` de `worker/index.test.ts:1978-1989` (même geste que `'jet'`/`'indice'`, déjà exclus avec le même motif documenté) — le wire introduit un champ `delta_confiance`, le mot devient légitimement nécessaire à l'invite.

Aucun token, aucun composant, aucun état vide concerné par cette itération.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatPnj.confiance` | type | fournit | `interface EtatPnj { readonly a_dit: readonly string[]; readonly confiance?: number }` (`faits.ts`) |
| `CONFIANCE_DEPART` | constante | fournit | `export const CONFIANCE_DEPART = 0` (`types.ts`, à côté de `CONFIANCE_MIN`/`CONFIANCE_MAX`/`CONFIANCE_INITIALE_PORTE`) |
| `crediterConfiance` | service | fournit | `crediterConfiance(session: EtatSession, pnjId: string, delta: -1 \| 0 \| 1): EtatSession` (`session.ts`) — SEULE porte d'écriture de `EtatPnj.confiance`, précédent `fixerHeros`/`crediterXp`/`consignerJet` |
| `sessionDestinations` | registre | fournit | `'monde.pnj.<id>.confiance': 'moteur'`, ajoutée au TYPE `CheminDeFeuilleDeSession` ET au registre (sinon `sessionCouverture.test.ts` ne prouve rien par compilation) |
| `portesOuvertes` | fonction interne | modifie | `portesOuvertes(faits: FaitsDeSession, personnageId: string, revele_si: Revelation \| undefined): boolean` (`revelation.ts`) — gagne `personnageId` pour lire `faits.pnj[personnageId]?.confiance ?? CONFIANCE_DEPART` dans la branche `confiance_min` ; ÉVALUÉE EN LIGNE, jamais via `PREDICATES` (comparaison numérique contre un état par-PNJ, pas une appartenance de registre fermé — même statut attendu pour `jet` en it4) |
| `ReponseActeur` | type | fournit | `interface ReponseActeur { readonly replique: string; readonly indices_reveles: readonly string[]; readonly delta_confiance: -1 \| 0 \| 1 }` — REQUIS, pas optionnel (même statut que `indices_reveles`) |
| `SortieActeurBrute` | type | fournit | `+= readonly delta_confiance: unknown` (brut, validé par `validerActeur`) |
| `validerActeur` | fonction | modifie | `CLES_SORTIE_ACTEUR` gagne `'delta_confiance'` ; prédicat (13) ajouté en fin de liste : `typeof brut.delta_confiance === 'number' && DELTAS_CONFIANCE_VALIDES.includes(brut.delta_confiance)` sinon `motif: 'schema'` — refus atomique, réplique comprise |
| `consignerReponseActeur` | fonction | modifie | `apport` gagne `readonly deltaConfiance: -1 \| 0 \| 1` ; ordre figé : re-vérification des révélations sur l'état D'AVANT Δ → `reveler_indice` → `a_dit` → `crediterConfiance` (Δ saturé) → `recit` |
| `avecIndiceConfie` | fonction interne | corrige | `recit.ts:143` — spread de l'entrée `EtatPnj` existante avant d'écrire `a_dit`, jamais un littéral à une seule clé (préserve `confiance`) |
| `demanderActeur` | service | modifie | `CopiloteService.ts` — passe `delta_confiance` identique de `SortieActeurBrute` validé à `ReponseActeur`, AUCUNE re-résolution (contrairement aux rangs de `indices_reveles`) |
| `docs/REGLES-DU-JEU.md` | doc | fournit | Nouvelle section « 6. Confiance & Persuasion » — bornes, `CONFIANCE_DEPART`, amplitude Δ, règle de saturation — ÉCRITE AVANT LE CODE (KR-130/279), texte figé au § 4 bis |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | **INCHANGÉ depuis it2** — aucun bloc neuf. La confiance n'entre que PAR SON EFFET : quand `confiance_min` est atteint, le savoir apparaît dans le catalogue `CE QUE TU PEUX CONFIER` (`S<n>`), comme n'importe quel autre savoir ouvert. `BUDGET_CARACTERES_DOSSIER_ACTEUR` inchangé. |
| Schéma de sortie | `{"replique": string, "indices_reveles": ["S<n>"] (≤1), "delta_confiance": -1\|0\|1}` — les TROIS clés toujours exigées (KR-236) |
| Échec de validation | `delta_confiance` hors `{-1,0,1}` (ou absent, ou mal typé) → refus ATOMIQUE de toute la sortie (réplique comprise) → rejeu exactement une fois (KR-230) → au second échec, KR-283 : aucune réplique, aucune révélation, aucune confiance modifiée, bannière d'échec existante. Session identique PAR RÉFÉRENCE. |
| Ce que l'IA **ne** fait **pas** | Ne voit jamais le nombre de confiance ni le seuil d'une porte ; ne sature jamais elle-même (le moteur sature dans `crediterConfiance`) ; ne décide jamais qu'un savoir est ouvert (le catalogue borné le lui montre déjà fermé ou ouvert). |

**Texte de `docs/REGLES-DU-JEU.md` § 6 « Confiance & Persuasion » (figé, à recopier tel quel dans le lot A) :**

> La confiance d'un PNJ envers le héros est un entier de `[CONFIANCE_MIN, CONFIANCE_MAX]` = `[-3, +3]`, propre à ce PNJ. Un PNJ jamais crédité vaut `CONFIANCE_DEPART = 0`.
>
> Chaque réplique ACCEPTÉE porte une variation `Δ ∈ {-1, 0, +1}`. Toute autre valeur rend la réplique entière irrecevable : Δ n'est jamais écrêtée.
>
> `confiance ← min(MAX, max(MIN, confiance + Δ))`. C'est l'ÉTAT qui sature, jamais Δ. Une réplique refusée n'applique rien.
>
> Δ s'applique APRÈS les révélations de la même réplique : une réplique ne peut ni ouvrir un savoir par sa propre variation, ni refermer celui qu'elle vient de confier.
>
> Une porte `confiance_min = s` est ouverte ssi `confiance ≥ s`, en conjonction avec les autres portes posées (fail-closed, KR-280).
>
> La confiance ne décroît pas avec le temps et n'a aucune autre source : aucun delta de confiance n'entre dans le registre `DELTAS`.

## 5 — Lots

### Lot A — `contrat-confiance` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : ouvrir la 3e porte de révélation (`confiance_min`), fail-closed, contre un état de confiance de session par PNJ ; étendre le schéma de sortie R4 ; écrire la règle du jeu avant le code (KR-130/279).
- **Fichiers** :
  - `docs/REGLES-DU-JEU.md` (R) — § 6 « Confiance & Persuasion », texte figé au § 4 bis ci-dessus, écrit EN PREMIER dans ce lot, avant tout fichier `.ts`
  - `src/brain/dossier/types.ts` (R) — `CONFIANCE_DEPART = 0`
  - `src/brain/dossier/faits.ts` (R) + `faits.test.ts` (R) — `EtatPnj.confiance?: number`
  - `src/brain/dossier/session.ts` (R) + `session.test.ts` (R) — `crediterConfiance`
  - `src/brain/dossier/sessionDestinations.ts` (R) + `sessionCouverture.test.ts` (R) — `'monde.pnj.<id>.confiance': 'moteur'`, type + registre
  - `src/brain/dossier/recit.ts` (R) + `recit.test.ts` (R) — fix `avecIndiceConfie` (spread), `consignerReponseActeur` gagne `deltaConfiance`, ordre figé
  - `src/brain/dossier/revelation.ts` (R) + `revelation.test.ts` (R) — `portesOuvertes` gagne `personnageId`, branche `confiance_min` évaluée en ligne
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (R) — Harek gagne un 3e savoir gardé UNIQUEMENT par `confiance_min:1`, `formulation_joueur` rédigée sur son indice cible (aucun PNJ présent de la fixture ne porte aujourd'hui une porte de confiance démontrable seule)
  - `src/brain/copilote/types.ts` (R) — `ReponseActeur`/`SortieActeurBrute` += `delta_confiance`
  - `src/brain/copilote/schemaSortie.ts` (R) + `schemaSortie.test.ts` (R) — `validerActeur`, prédicat 13
  - `src/brain/CopiloteService.ts` (R) + `CopiloteService.test.ts` (R) — `demanderActeur` passe `delta_confiance`
  - `worker/index.ts` (R) — invite du rôle acteur, explique `delta_confiance` sans réciter borne/seuil/effet
  - `worker/index.test.ts` (R) — retrait de `'confiance'` de la liste `interdits` (précédent `'jet'`/`'indice'`), nouveau test sur la forme du schéma
- **Expose / consomme** : signatures figées au § 4
- **Critères couverts** : #1 à #7

### Lot B — `cablage-confiance` `feature`
- **Ouvrier** : `dev-lot`
- **But** : câbler `delta_confiance` depuis la réponse R4 jusqu'à l'écriture de session, dans la boucle de jeu.
- **Fichiers** :
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — le point d'appel à `consignerReponseActeur` passe `deltaConfiance: reponseActeur.delta_confiance`
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R) — propagation jusqu'à la session (confiance créditée et/ou saturée)
- **Expose / consomme** : consomme le Lot A entier (figé)
- **Critères couverts** : #8

*(2 lots, sous le plafond de 4.)*

## 6 — Critères d'acceptation

1. **Étant donné** un savoir gardé UNIQUEMENT par `confiance_min = N` (aucune autre porte posée), **quand** la confiance de session du PNJ est `< N` / `= N` / `> N`, **alors** `evaluerSavoir` rend `'absent'` / `'revelable'` / `'revelable'` respectivement — 3 branches. *(contrat — lot A)*
2. **Étant donné** une réponse R4 portant `delta_confiance` hors de `{-1, 0, 1}` (absent, mal typé, ou hors bornes), **quand** `validerActeur` l'examine, **alors** TOUTE la sortie est refusée (réplique comprise), rejouée exactement une fois (KR-283), puis sans réplique ni révélation ni confiance modifiée au second échec. *(contrat — lot A)*
3. **Étant donné** une confiance de session à `CONFIANCE_MIN` (ou `CONFIANCE_MAX`), **quand** un `delta_confiance` qui la pousserait hors borne est appliqué, **alors** elle reste à la borne — saturation testée aux DEUX bornes. *(contrat — lot A)*
4. **Étant donné** un PNJ sans aucune entrée `faits.pnj[id]` (jamais encore crédité), **quand** sa confiance est lue (porte `confiance_min` ou première écriture), **alors** la valeur par défaut est `CONFIANCE_DEPART = 0`. *(contrat — lot A)*
5. **Étant donné** une réplique acceptée qui révèle un indice ET porte un `delta_confiance` non nul sur le MÊME appel, **quand** `consignerReponseActeur` applique l'apport, **alors** la re-vérification des révélations et leur application se font SUR L'ÉTAT D'AVANT Δ, et Δ est appliqué APRÈS — un Δ négatif au même tour ne referme jamais rétroactivement le savoir qu'il vient de confier. *(contrat — lot A)*
6. **Étant donné** un PNJ dont `EtatPnj` porte déjà `a_dit` (ou déjà `confiance`), **quand** l'autre champ est écrit pour la première fois (révélation puis créditation, ou l'inverse), **alors** les DEUX champs survivent sur la même entrée — aucun écrasement croisé. *(contrat — lot A)*
7. **Étant donné** l'invite système du rôle acteur, **quand** `worker/index.test.ts` la scanne, **alors** elle ne récite toujours aucun mot de mécanique interdit (registre étendu, `'confiance'` retiré avec le même motif documenté que `'jet'`/`'indice'`), et ne récite ni borne ni seuil ni règle de saturation. *(contrat — lot A)*
8. **Étant donné** une réponse R4 réelle (mockée en test) portant `delta_confiance`, **quand** `useTourDeJeu` la traite, **alors** la confiance de session du PNJ visé est créditée et/ou saturée en conséquence, visible à l'appel suivant. *(bout-en-bout — lot B)*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `revelation.test.ts` — confiance_min, 3 branches | `<N` fermé, `=N` et `>N` ouverts (seule cette porte posée) | contrat | KR-280 | A |
| `schemaSortie.test.ts` — delta_confiance invalide | `2`, `-2`, `0.5`, `"1"`, `true`, `null`, absent → refus atomique total | contrat | KR-230 | A |
| `session.test.ts` — crediterConfiance, saturation | `-3 + (-1) → -3` ; `+3 + (+1) → +3` | contrat | KR-279 | A |
| `session.test.ts` / `revelation.test.ts` — défaut | PNJ sans `faits.pnj[id]` → lecture `CONFIANCE_DEPART` | contrat | KR-013 | A |
| `recit.test.ts` — ordre figé | révélation + Δ négatif au même appel : révélation appliquée, confiance décrémentée APRÈS, aucune levée | contrat | KR-238 | A |
| `recit.test.ts` — écriture croisée | révéler puis créditer, et l'inverse : `a_dit` et `confiance` survivent tous les deux | contrat | KR-013 | A |
| `worker/index.test.ts` — liste `interdits` | `'confiance'` retiré, test passe ; aucune borne/seuil récité | contrat | KR-235/270 | A |
| `CopiloteService.test.ts` — demanderActeur | `delta_confiance` passe identique de `SortieActeurBrute` à `ReponseActeur`, aucune re-résolution | contrat | KR-231 | A |
| `sessionCouverture.test.ts` | `'monde.pnj.<id>.confiance'` couvert au type, audience `'moteur'` | contrat | KR-232 | A |
| `useTourDeJeu.test.ts` — propagation | `delta_confiance` d'une réponse R4 mockée crédite/sature la confiance de session | feature | KR-013 | B |

Cas limites couverts : confiance jamais créditée (défaut) · saturation aux DEUX bornes · delta hors forme (nombre non entier, chaîne, booléen, absent) · délai d'un tour entre franchissement du seuil et apparition dans le catalogue (ordre figé) · écriture croisée `a_dit`/`confiance` dans les deux ordres · rejeu échoué = session identique par référence.

**Non vérifiable en l'état** — à recopier dans la revue : un modèle qui ne cite jamais un `delta_confiance` cohérent avec le ton de sa réplique (zigzag émotionnel non halluciné mais incohérent) — KR-229, playtest, aucune échéance forcée en it3.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM | Aucun critère ne garantissait l'ouverture effective de `confiance_min` (seule la plomberie du delta était testée) | `RETENU` | AC#1 (3 branches) ajouté au § 6, test nommé au § 7 |
| 2 | Tech Lead | `recit.ts` absent de la liste `brain_contracts` d'it3 alors que son correctif ferme le contrat | `RETENU` | Ajouté au lot A (`avecIndiceConfie`, test croisé) |
| 3 | Tech Lead | `revelation.ts` également absent — l'ouverture réelle de `confiance_min` y vit | `RETENU` | Ajouté au lot A |
| 4 | UX | Le design_contract d'it1 (ligne 14) confond « invite système » et « réplique » pour le balayage des mots de mécanique | `RETENU` | Clarifié au § 3 : le balayage ne porte que sur l'invite système, jamais sur la réplique |
| 5 | UX | Créer `src/brain/copilote/.../motsInterdits.ts`, registre partagé des mots interdits | `REJETÉ` | Tech Lead + Narratif-IA convergent : le besoin se résout en étendant la liste `interdits` déjà existante (précédent `'jet'`/`'indice'`) — un nouveau fichier serait une abstraction pour un problème déjà résolu deux fois |
| 6 | QA | VETO tour 1 : doc `REGLES-DU-JEU.md` absente, question du signal à R4 non tranchée, plan non signé | `REJETÉ` (QA retire elle-même son veto au tour 2) | Doc figée au § 4 bis, signal tranché (désaccord #7), ce document est le plan |
| 7 | Narratif-IA (puis QA) vs Tech Lead/PM | Signal qualitatif de confiance injecté au contexte R4 (« bloc ENVERS LUI ») | `REJETÉ` (Narratif-IA se rétracte elle-même au tour 2, vérifié critère par critère : aucun AC ne l'exige, le catalogue borné suffit) | Dette à déclencheur : playtest KR-229 |
| 8 | Narratif-IA vs Tech Lead | Forme réseau de Δ : enum `elan` (3 jetons) vs entier brut `-1\|0\|1` | `REJETÉ` l'enum (Narratif-IA se rétracte : l'AC du cadrage fixe déjà un entier, aucun gain de robustesse) | Entier retenu, conforme au cadrage signé |
| 9 | Narratif-IA vs UX | Bannir « confiance » et synonymes de la `replique` elle-même | `REJETÉ` (UX amende sa propre proposition après l'objection de Narratif-IA : faux positif légitime, « je ne vous fais pas confiance ») | Seule l'invite système est scannée, jamais `replique` — § 3 |
| 10 | Tech Lead (tour 2, auto-rétractation) | « `portesOuvertes` n'a pas besoin de `personnageId`, `crediterConfiance` suffit » | `REJETÉ` (par l'orchestrateur, en arbitrage) | Confusion entre écriture (`crediterConfiance`, session.ts) et lecture (`portesOuvertes`, revelation.ts) — les deux sont nécessaires, le tour 1 du Tech Lead était correct sur ce point précis |
| 11 | Tech Lead | « Un seul lot `contrat`, aucun fichier `features/` à toucher » | `REJETÉ` (par l'orchestrateur, en arbitrage) | `consignerReponseActeur` reçoit son `apport` de `useTourDeJeu.ts` (`features/play-mode/`) — précédent exact d'it1/it2 (lot B toujours présent pour le câblage du hook). Lot B ajouté, minimal (2 fichiers) |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(Aucune proposition hors-cadre retenue cette itération — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` (scopé aux fichiers du lot) → `tsc --noEmit` → `npm run lint` → `jest`
- [ ] `npm run test:mutation` — NON DÛ (aucun des 4 fichiers de règles touché)
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (it1/it2)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-acteurs-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | AC#1 (ouverture 3 branches) entré au plan |
| Tech Lead | recevable sous réserve | `recit.ts`/`revelation.ts` entrés au lot A ; forme réseau = entier ; lot B rétabli |
| UX | recevable sous réserve | § 3 clarifié (invite ≠ réplique) ; `motsInterdits.ts` résolu par extension de liste existante |
| QA | recevable sous réserve (veto retiré) | Doc figée, 10 tests nommés, signal tranché |
| Narratif & IA | recevable sous réserve | Signal ENVERS LUI et enum `elan` retirés par elle-même ; ordre Δ-après-révélation retenu |
