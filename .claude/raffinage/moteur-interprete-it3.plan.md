# Plan d'itération — `moteur-interprete` · itération 3

> Statut : `validé` (2026-09-30)
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-09-29
> Composition : `5 rôles` — motif : l'itération gèle la forme de `EtatSession.memoire` et fait entrer `faits_etablis` dans le contrat de sortie de R3 (narrateur), avec une politique de rétention à trancher — cœur du domaine narratif-ia et du contrat `brain/`.
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, le joueur retrouve, plusieurs tours plus tard, un fait que le monde avait établi, sans contradiction. » |
| **Tranche** | Entièrement `brain/` : `session.ts`/`memoire.ts` (forme + fenêtre + condensation) → `CopiloteService.demander('narrateur', …)` (contrat étendu, même 8ᵉ branche) → `recit.ts` (`consignerNarration`, une seule transition) → `useTourDeJeu.ts` (une ligne changée). **Aucun fichier d'écran ou de composant touché** (confirmé par 3 rôles indépendamment). |
| **Lots** | 1 lot · `contrat`, seul, exécuté en premier — pas de lot feature (`UseTourDeJeuResult` inchangé) |
| **Hors périmètre** | `Chip` cliquable, refus console qui réapparaît (dettes UI sans rapport avec `memoire`, motif de coût de fichier réfuté par le tech-lead) · budget par pas / dégradation en cascade (it4) · portée complète de KR-262 aux 8 collections (n°12) · mémoire pour R1 (dette nommée) |
| **Reporté** | Chip et refus-console → `open_questions`, sans échéance fixée (it4 ou dette à déclencheur) ; portée KR-262 élargie → n°12 |

---

## 1 — But raffiné

À la fin de cette itération, `EtatSession.memoire` prend sa forme définitive : une fenêtre glissante de 5 à 14 pas (dérivée de l'horloge, jamais stockée), des faits établis ancrés par rang et retenus en ajout seul, et un résumé condensé tous les 10 pas. R3 (narrateur) devient le seul producteur de ces trois artefacts, dans le **même appel** qui produit déjà le récit — sans jamais perdre le récit visible du joueur pour un défaut de résumé, artefact que le joueur ne lit jamais.

## 2 — Hors périmètre

- **`Chip` cliquable** (suggestions interactives) — aucun rapport avec `memoire` : vérifié par le tech-lead, `memoire` ne touche ni `PlayerInputBar.tsx` ni `EcranPartie.tsx`, `UseTourDeJeuResult` reste inchangé. Le seul motif qui aurait pu la faire entrer (« it3 rouvre ces fichiers de toute façon ») est réfuté en fait. Reportée à `open_questions`, sans échéance — it4 ou dette à déclencheur.
- **Refus console qui réapparaît** (revue tech-lead d'it2, passage 3) — même motif de retrait. Reportée à `open_questions`.
- **Un 9ᵉ rôle IA (« chroniqueur »)** — proposé puis retiré par son propre auteur (narratif-ia, tour 2, § 8 désaccord #1) : la démonstration d'un appel unique avec garde à deux niveaux (§ 4 bis) satisfait exactement la condition posée par le PM pour l'accepter. Coût évité : un rôle complet (route worker, surcharge `CopiloteService`, validateur, assembleur, `frontiere.test.ts`) pour un mécanisme qui n'apporte, sur une sortie lisible, aucune garantie que la garde à deux niveaux ne donne déjà.
- **Budget par pas, dégradation en cascade** — it4. Le budget de CETTE itération (`BUDGET_CARACTERES_NARRATEUR` remesuré) est une mesure ponctuelle, pas le mécanisme de dégradation lui-même.
- **Portée complète de KR-262** (R3 nommant PNJ, 8 collections) — n°12. Les ancres de `memoire` restent limitées aux entités déjà autorisées pour R1/R3 (lieux, objets) ; aucune ancre `personnage.*`.
- **Mémoire pour R1** (l'interprète) — dette nommée, hors goal (« j'y retourne » reste non résoluble ce tour-ci).
- **Amendement de `docs/REGLES-DU-JEU.md`/`REGLES-PLAY.md`** — aucun nécessaire ; seule contrainte appliquée : aucun champ neuf ne porte le mot « tour » (§ J1), d'où `jusqu_au_pas` et non `jusqu_au_tour`.

*(Écrit par le PM, arbitré par l'orchestrateur au tour 3 — voir § 8.)*

## 3 — Contrat de design

**Aucun.** Confirmé indépendamment par l'UX, le PM et le Tech Lead : cette itération est entièrement `brain/`, invisible pour le joueur sauf par la cohérence du récit qu'il lit déjà via R3 (`recit`, inchangé dans sa présentation). Aucun composant, aucun token, aucun placeholder, aucun texte d'interface neuf, aucun comportement clavier nouveau.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatSession.memoire` | type | émet (forme gelée) | `MemoireSession \| null` — voir § 4 bis pour le détail |
| `brain/dossier/memoire.ts` | registre | émet (module neuf, pur, sans IA) | `FENETRE_MIN`, `CADENCE`, `FENETRE_MAX`, `FAITS_INJECTES_MAX`, `borneDeFenetre(pas)`, `pasACondenser(session)`, `faitsPertinents(session)` |
| `brain/dossier/recit.ts` | registre | émet (remplace `consignerRecit`) | `consignerNarration(session, pas, apport): EtatSession` — une seule transition, récit + faits + résumé |
| `brain/dossier/sessionDestinations.ts` | registre | émet (lignes feuilles neuves) | `memoire.faits_etablis[].fait: 'ia'`, `.sur[]: 'moteur'`, `memoire.resume.texte: 'ia'`, `.jusqu_au_pas: 'moteur'` |
| `CopiloteService.demander('narrateur', …)` | service | émet (contrat étendu, MÊME 8ᵉ branche, pas de 9ᵉ) | `SortieNarrateur { recit; suggestions; faits_etablis: FaitEtabli[]; resume?: ResumeMemoire }` |
| `brain/copilote/contexte/narrateur.ts` | service | émet (assembleur étendu) | `assemblerNarrateur` rend en plus `ancres: ReadonlyMap<RangInjecte,string>` et `condensation: {de,a} \| null` |
| `worker/index.ts` INVITES/GABARIT_SORTIE | registre | émet (invite `narrateur` amendée, PAS de nouvelle entrée) | `GABARIT_SORTIE.narrateur` gagne `constats`, `condense?` ; deux gabarits (avec/sans `condense`) épinglés par `frontiere.test.ts` |
| `useTourDeJeu.ts` | service | consomme (une ligne changée) | `consignerRecit(S1, tour, recit)` → `consignerNarration(S1, tour, {recit, faits_etablis, resume})` ; `UseTourDeJeuResult` **INCHANGÉ** |
| `DossierService` / `executerCommande` | service | consomme (n°9, inchangé) | — |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| Contexte injecté | Canon (`ton`, `interdits_ton`) · `AUPARAVANT` (résumé existant, s'il existe) · `À CONDENSER` (pas `[de,a]`, **seulement si condensation due**, une ligne par pas : récit ou label du geste, blancs repliés) · `RECEMMENT` (pas de la fenêtre `(borneDeFenetre(t), t−1]`, même format) · `ETABLI` (`faitsPertinents`, une ligne par fait) · `ICI`/`CE PAS`/`EN SA POSSESSION`/`DEJA ACCOMPLI` (état, inchangé it2) · saisie, en dernier. **Jamais** : numéro de pas, `journal[].texte`, deltas passés, tentatives passées. |
| Schéma de sortie | Réseau (`NarrationRendue`, non ré-exporté) : `{narration; tentatives; constats: {phrase; ancres: RangInjecte[]}[]; condense?: string}`. Résolu (`SortieNarrateur`) : `{recit; suggestions; faits_etablis: FaitEtabli[]; resume?: ResumeMemoire}`. **Zéro clé commune** (KR-231) entre réseau/résolu, entre éléments (`{phrase,ancres} ∩ {fait,sur} = ∅`), et avec les 7 autres rôles. |
| Validation, ordre strict | (1) enveloppe : clés EXACTEMENT `{narration,tentatives,constats}` si `condense` non demandé, `+condense` optionnel sinon — toute autre clé refuse le lot (KR-236) → (2) prédicats existants (narration/tentatives, inchangés it2) → (3) prédicats des `constats` (arité, non-vide, ≤160 car., ancres 1-2 distinctes appartenant à la table, scanner `porteUneAncre` sur narration/tentatives/phrases) — **TOUT refuse le lot entier** (KR-230) → (4) **SEULEMENT SI (1)-(3) passent et que la condensation est due** : `validerCondense(condense)` séparément — son échec **ne refuse PAS** le lot, seul le résumé n'est pas mis à jour. |
| La garde à deux niveaux (§ 8, arbitrage central) | `{narration,tentatives,constats}` reste un bloc **atomique** sous KR-230, exactement comme it2. `condense` seul est découplé, parce qu'il remplit trois conditions cumulatives (KR-271 nouveau) : il porte sur une fiction **déjà persistée** (pas le pas courant), le joueur ne le lit **jamais**, et le code peut le **redemander de façon déterministe** au pas narré suivant (`pasACondenser` reste non-null tant que `jusqu_au_pas` n'avance pas). Les `constats` ne remplissent AUCUNE des trois — ils restent dans l'enveloppe atomique. |
| Échec | `condense` refusé ou absent alors que dû → **récit affiché quand même**, résumé et `jusqu_au_pas` inchangés, redemandé au pas narré suivant, **aucune bannière, aucun rejeu déclenché par ce seul défaut**. Échec de l'enveloppe (narration/tentatives/constats) → rejeu EXACTEMENT une fois (inchangé it2), puis bannière `Le récit n'a pas pu être généré.` — jamais un texte neutre écrit comme de la fiction. Jamais de composition entre deux essais de rejeu (un `resume` valide au 1er essai n'est pas gardé si le 2e essai est celui accepté). |
| Ce que l'IA **ne** fait **pas** | Ne lance aucun dé, ne modifie aucune statistique, ne nomme aucune entité par `Entite.nom` (rangs seuls, KR-262 restreint à lieux/objets), ne reçoit ni `dangers` ni donnée de personnage (n°11/12 hors périmètre), n'ancre jamais un fait sur un indice ou un jalon (KR-272 nouveau — ces ensembles ne font que croître, l'ancre y resterait toujours sélectionnable). |
| Budget | `BORNE_MEMOIRE = CONDENSE_CARACTERES_MAX + (FENETRE_MAX−1+CADENCE) × NARRATION_CARACTERES_MAX + FAITS_INJECTES_MAX × FAIT_CARACTERES_MAX + séparateurs` — **exacte** (chaque terme borné par un validateur), jamais de marge ×3 inventée. Pire cas : 23 récits passés (13 fenêtre + 10 condensation, pendant un retard). `BUDGET_CARACTERES_NARRATEUR` et `TAILLE_MAX_CORPS_IA` **remesurés par le lot**, jamais recopiés des estimations du comité (≈27-28k / ≈84 Kio annoncés par narratif-ia, à vérifier). |

## 5 — Lots

### Lot 1 — `memoire-contrat` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier — et unique lot de l'itération)
- **But** : geler la forme de `EtatSession.memoire`, étendre R3 pour produire `faits_etablis`/`resume` dans le même appel avec la garde à deux niveaux, et brancher `useTourDeJeu` sur `consignerNarration`.
- **Fichiers** :
  - `src/brain/dossier/memoire.ts` (N) — `borneDeFenetre`, `pasACondenser`, `faitsPertinents`, constantes
  - `src/brain/dossier/memoire.test.ts` (N)
  - `src/brain/dossier/session.ts` (R) — `memoire: MemoireSession | null`, `MemoireSession`, `FaitEtabli`, `ResumeMemoire`
  - `src/brain/dossier/session.test.ts` (R)
  - `src/brain/dossier/recit.ts` (R) — `consignerRecit` → `consignerNarration`
  - `src/brain/dossier/recit.test.ts` (R)
  - `src/brain/dossier/sessionDestinations.ts` (R)
  - `src/brain/dossier/sessionCouverture.test.ts` (R)
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R)
  - `src/brain/copilote/types.ts` (R) — `NarrationRendue` (+`constats`,+`condense?`), `ConstatRendu`, `SortieNarrateur` (+`faits_etablis`,+`resume?`), `FaitEtabli`/`ResumeMemoire` ré-exportés depuis `dossier/session.ts`
  - `src/brain/copilote/schemaSortie.ts` (R) — `validerNarrateur` étendu (prédicats constats), `validerCondense` (N, fonction), `IssueCondense`, constantes (`FAITS_PAR_PAS_MAX`, `FAIT_CARACTERES_MAX`, `ANCRES_PAR_FAIT_MAX`, `CONDENSE_CARACTERES_MAX`)
  - `src/brain/copilote/schemaSortie.test.ts` (R)
  - `src/brain/copilote/contexte/narrateur.ts` (R) — blocs `AUPARAVANT`/`À CONDENSER`/`ETABLI`, `ancres`, `condensation`
  - `src/brain/copilote/contexte/index.ts` (R)
  - `src/brain/copilote/contexte.test.ts` (R) — témoin « pas 2 = pas 40 » remplacé par son inverse (§ 7)
  - `src/brain/CopiloteService.ts` (R) — passage de `ancres`/`condenseDemande` au validateur, garde `never` inchangée (MÊME 8ᵉ branche)
  - `src/brain/CopiloteService.test.ts` (R)
  - `src/brain/index.ts` (R) — `consignerNarration` remplace `consignerRecit` au baril
  - `worker/index.ts` (R) — `GABARIT_SORTIE.narrateur` étendu, invite amendée (déclenchement de `condense` par le CONTENU du contexte, jamais par un compte — KR-273 nouveau)
  - `worker/index.test.ts` (R)
  - `worker/frontiere.test.ts` (R) — deux gabarits épinglés
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) — une ligne : appel à `consignerNarration`
  - `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R)
  - `src/features/play-mode/tests/verrouDeTour.test.tsx` (R) — le mock de réponse narrateur gagne `faits_etablis: []`
- **Expose** :
  ```ts
  // src/brain/dossier/session.ts
  readonly memoire: MemoireSession | null
  interface MemoireSession { readonly faits_etablis: readonly FaitEtabli[]; readonly resume?: ResumeMemoire }
  interface FaitEtabli { readonly fait: string; readonly sur: readonly string[] }              // 1..2 ancres, lieu.*|objet.*
  interface ResumeMemoire { readonly texte: string; readonly jusqu_au_pas: number }             // posé par le code
  // src/brain/dossier/memoire.ts
  const FENETRE_MIN = 5; const CADENCE = 10; const FENETRE_MAX = 14; const FAITS_INJECTES_MAX = 8
  function borneDeFenetre(pas: number): number
  function pasACondenser(session: EtatSession): { readonly de: number; readonly a: number } | null
  function faitsPertinents(session: EtatSession): readonly FaitEtabli[]
  // src/brain/dossier/recit.ts
  function consignerNarration(session: EtatSession, pas: number, apport: { recit: string; faits_etablis: readonly FaitEtabli[]; resume?: ResumeMemoire }): EtatSession
  // src/brain/copilote/types.ts (réseau, non ré-exporté) / (résolu)
  interface NarrationRendue { narration: string; tentatives: readonly string[]; constats: readonly ConstatRendu[]; condense?: string }
  interface ConstatRendu { readonly phrase: string; readonly ancres: readonly string[] }
  interface SortieNarrateur { readonly recit: string; readonly suggestions: readonly string[]; readonly faits_etablis: readonly FaitEtabli[]; readonly resume?: ResumeMemoire }
  ```
- **Critères couverts** : #1 à #8 (tous — lot unique)

*(1 lot, exécution séquentielle : aucun lot feature, `UseTourDeJeuResult` figé, aucun fichier d'écran touché.)*

## 6 — Critères d'acceptation

1. **Étant donné** un fait rendu par R3 sans ancre valide (`sur:[]` ou rang hors table) ou un identifiant qui fuite dans la prose (narration/tentative/phrase), **quand** `validerNarrateur` l'évalue, **alors** le lot ENTIER est refusé (KR-230, mutants `sur:[]` accepté / rang hors table accepté / identifiant en prose accepté vérifiés ROUGES). — *niveau : contrat* — *lot 1*
2. **Étant donné** l'horloge à un pas `t`, **quand** la fenêtre est calculée, **alors** elle vaut `(borneDeFenetre(t), t]`, dérivée EXCLUSIVEMENT de l'horloge (table de valeurs : 4→4, 14→14, 15→5, 24→14, 25→5), sans aucun trou (un pas joué en console y entre avec son label de geste, sans récit). — *niveau : unitaire* — *lot 1*
3. **Étant donné** un pas narré où `pasACondenser(session) !== null`, **quand** R3 rend un `condense` valide, **alors** le résumé est remplacé et `jusqu_au_pas` avance exactement à la borne haute de la tranche condensée — **et quand `condense` est absent ou invalide alors qu'il était dû**, **alors** le récit (`recit`, `faits_etablis`) est TOUJOURS accepté et affiché, le résumé reste inchangé, redemandé au pas narré suivant, sans bannière et sans rejeu déclenché par ce seul défaut — **et quand `condense` est présent alors que rien n'était dû**, **alors** le lot ENTIER est refusé (KR-236, enveloppe stricte), suivi du rejeu-un-coup existant puis d'une bannière en cas de nouvel échec (mutants M4-M9 du tour 2 narratif-ia vérifiés ROUGES, dont M7 pour ce dernier cas). — *niveau : contrat* — *lot 1*
4. **Étant donné** des faits établis par R3, **quand** ils sont écrits dans `memoire`, **alors** ils s'AJOUTENT SEULS (jamais résumés, réécrits ni évincés), et le contexte injecté n'en retient que les `FAITS_INJECTES_MAX` (8) plus pertinents dont l'ancre (lieu courant ou objet possédé) est actuellement présente — un objet RETIRÉ au pas courant n'est plus « possédé » et ses faits ne sont donc plus réinjectés, seulement son rang de sortie. — *niveau : unitaire* — *lot 1*
5. **Étant donné** un pas accepté (aller ou agir), **quand** R3 est appelé, **alors** c'est TOUJOURS le MÊME appel (8ᵉ branche `CopiloteService`, aucune 9ᵉ branche) qui produit récit, faits et résumé — `jusquAuRejeuUnique` reste générique, un seul `fetch` narrateur par pas (hors rejeu-un-coup existant). — *niveau : contrat* — *lot 1*
6. **Étant donné** le pas où la fenêtre franchit `borneDeFenetre(t)` pour la première fois, **quand** R3 est appelé, **alors** le récit qui vient de sortir de la fenêtre (ex. pas 1 au pas 15) disparaît du bloc `RECEMMENT` et n'apparaît plus QUE dans le bloc `À CONDENSER`, le temps que cette tranche soit absorbée — une fois absorbée, il n'apparaît plus nulle part dans le contexte ; **et**, en cas de retard de condensation (échec ou pas d'absorption joué en console), `BUDGET_CARACTERES_NARRATEUR` couvre le pire cas mesuré (23 récits, fenêtre + tranche non absorbée) sans jamais lever `trop-long` sur ce seul terme. — *niveau : contrat* — *lot 1*
7. **Étant donné** le périmètre balayé par `moteurSansIA.test.ts` (KR-260), **quand** cette itération est livrée, **alors** `useTourDeJeu.ts` reste le SEUL appelant exclu — aucun fichier nouveau n'entre dans la liste d'exclusion (aucun nouvel appelant IA n'est introduit ailleurs). — *niveau : balayage de code* — *lot 1*
8. **Étant donné** un fait établi ancré sur une entité, **quand** son type est vérifié, **alors** seule une ancre `lieu.*` ou `objet.*` est acceptée — un rang sur un `indice.*` ou un `jalon.*` est REFUSÉ dès l'assemblage du contexte (ces ensembles ne font que croître, l'ancre y resterait toujours sélectionnable, KR-272). — *niveau : unitaire* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `memoire.test.ts` → `borneDeFenetre` | table de valeurs (4,14,15,24,25) ; mutants `FENETRE_MAX` en dur / `Math.max` retiré / `<` au lieu de `<=` | unitaire | AC#2 | 1 |
| `memoire.test.ts` → `pasACondenser` | échec au pas 15 (ou console) ⇒ au pas 16, fenêtre 11-16 et `pasACondenser` = `{1,10}` ; mutants fenêtre-depuis-couverture / déclenchement `t%10===5` / indice de journal au lieu du pas | unitaire | AC#2, AC#3 | 1 |
| `memoire.test.ts` → `faitsPertinents` | 9 faits pertinents ⇒ seuls les 8 plus récents injectés ; ancre absente du contexte courant ⇒ fait exclu | unitaire | AC#4 | 1 |
| `recit.test.ts` → `consignerNarration`, une seule transition | récit + faits + résumé écrits ensemble ; identité si rien à écrire ; garde sur `resume` (n'écrit que si `jusqu_au_pas` correspond à `pasACondenser` attendu) | unitaire | AC#3, KR-013 | 1 |
| `schemaSortie.test.ts` → mutants AC#7/garde à deux niveaux | M1-M9 du tour 2 narratif-ia (ancres vides, rang hors table, identifiant en prose, `condense` invalide refusant le lot à tort, `resume` posé malgré un `condense` invalide, rejeu déclenché par un `condense` seul, `condense` non demandé accepté, composition entre essais, constat invalide qui garde le récit) | mutation ciblée | KR-230, KR-231, KR-271 | 1 |
| `contexte.test.ts` → témoin 40 pas (remplace « pas 2 = pas 40 ») | fait du pas 3 ancré présent au pas 40 si le héros y revient, absent ailleurs ; récit du pas 30 présent, du pas 3 absent ; aucun numéro d'horloge dans le contexte | unitaire | AC#6 | 1 |
| `contexte.test.ts` → borne au pire cas | 23 récits passés (retard de condensation) ⇒ `BUDGET_CARACTERES_NARRATEUR` ne lève PAS `trop-long` sur ce seul terme ; mesure re-dérivée, pas recopiée | contrat | AC#6 | 1 |
| `contexte.test.ts` → ancres limitées | rang refusé sur `indice.*`/`jalon.*` à l'assemblage | unitaire | AC#8, KR-272 | 1 |
| `worker/frontiere.test.ts` → deux gabarits | gabarit avec/sans `condense` tous deux épinglés, aucun mot « tour »/« mémoire »/« résumé » dans l'invite (la cadence ne vit que dans `memoire.ts`, KR-273) | contrat | KR-236, KR-273 | 1 |
| `moteurSansIA.test.ts` (inchangé, rejoué) | `useTourDeJeu.ts` reste seul exclu, aucune régression | balayage de code | AC#7, KR-260 | 1 |

Cas limites couverts : fenêtre à 4 pas (pas de forçage à 5) · bascule exacte à 15 · retard de condensation cumulé (25+ pas) · pas joué en console pendant une fenêtre en cours · `memoire: null` (aucun fait, aucun résumé) · fait dupliqué exact (non ajouté deux fois, décision narratif-ia § 8) · fait ancré sur une entité non actuellement présente (exclu du contexte, pas du stockage).

**Non vérifiable en l'état** — le risque résiduel nommé par narratif-ia (« si `condense` échoue à CHAQUE pas de condensation, la mémoire se troue silencieusement ») n'est pas observable par jest : c'est un comportement du modèle en production, pas une branche de code. Noté en `open_questions`, à instrumenter quand une télémétrie de session existera.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM / UX / Tech Lead | `Chip` cliquable et refus-console réintégrés en it3 (motif de tour 1 : « it3 rouvre ces fichiers de toute façon ») | `REJETÉ` | Le tech-lead a vérifié dans le code que `memoire` ne touche ni `PlayerInputBar.tsx` ni `EcranPartie.tsx` — le motif est faux en fait, pas seulement faible en principe (PM). Reportés à `open_questions`, sans échéance. |
| 2 | **Tech Lead vs Narratif & IA (arbitrage central)** | Résumé mémoire : MÊME appel R3 (`condense?` optionnel, garde à deux niveaux) vs 9ᵉ rôle `chroniqueur` séparé | `RETENU : appel unique` | **Arbitrage orchestrateur, tour 3.** Narratif-ia a proposé le `chroniqueur` au tour 1, PM et tech-lead ont convergé dessus au tour 2 — SANS voir la note de tour 2 de narratif-ia (tours parallèles), où narratif-ia est lui-même revenu à l'appel unique avec une démonstration précise (matrice d'échec, § 4 bis) que le récit visible n'est JAMAIS perdu pour un défaut de `condense` seul. Cette démonstration satisfait EXACTEMENT la condition que le PM avait posée pour accepter cette variante (« si le tech-lead démontre... j'accepte à égalité »). Coût du `chroniqueur` évité : un rôle complet pour un mécanisme qui n'apporte, sur une sortie lisible, aucune garantie de plus. Généralisé en **KR-271 nouveau**. |
| 3 | Tech Lead (tour 1) | Aucune garde plus fine que le refus de lot total n'est légale dans un seul appel (« aucun précédent de validation composite ») | `REJETÉ, mesuré` | Narratif-ia (tour 2) : ce n'est pas une réparation partielle d'UNE réponse — `condense` est un artefact séparé qui remplit trois conditions cumulatives (fiction déjà persistée, jamais lue par le joueur, reprise déterministe) que `constats` ne remplit pas. La distinction est PRINCIPIÉE, pas ad hoc. KR-271. |
| 4 | Narratif-IA (tour 1) | Ancres sur indices/jalons (première proposition) | `REJETÉ par son auteur au tour 2` | Un indice révélé n'est sélectionnable qu'une fois puis meurt (KR-268) ; un jalon atteint ne fait que croître, donc toujours sélectionnable — le filtre de pertinence dégénère en « tous les faits ». Ancres limitées à lieu courant + objets. KR-272 nouveau. |
| 5 | Tech Lead (tour 1) | Budget mémoire avec marge ×3 (« ≥37 000 / ~110 Kio ») | `REJETÉ par son auteur au tour 2` | Chaque terme de mémoire est borné par un validateur — la ×3 ne vaut que pour le terme dossier (prose auteur non bornée, KR-203). `BORNE_MEMOIRE` est exacte, sans marge inventée. |
| 6 | QA (tour 1) | Séparateur AC#8 « 15 pas → fenêtre 2-15 + résumé 1-10 » | `REJETÉ, corrigé` | Mettrait les pas 2-10 à la fois dans la fenêtre ET le résumé. Corrigé : au pas 15, fenêtre = (10,15] (5 pas), résumé couvre 1-10. Table complète § 6 AC#2. |
| 7 | Tech Lead / Narratif & IA | Nom du pointeur de condensation : `jusqu_au_tour` vs `absorbe_jusqua` vs `jusqu_au_pas` | `RETENU : jusqu_au_pas` | REGLES-PLAY § J1 : aucun champ neuf ne porte « tour ». Narratif-ia (tour 2) tranche ce nom précis, adopté. |
| 8 | Tech Lead (tour 2) | Nommage des champs stockés : `constat`/`ancres` (repris de narratif-ia tour 1) | `REJETÉ, remplacé` | Narratif-ia (tour 2) revient sur son propre tour 1 : `fait`/`sur` pour le stockage (évite le piège de lecture avec la clé réseau `constats`, KR-236), `phrase`/`ancres` réservés au réseau. Adopté par l'orchestrateur comme jeu de noms final (tableau § 4 bis annexe narratif-ia tour 2). |
| 9 | Narratif-IA (tour 1) | Chroniqueur appelé après R3 | `SANS OBJET` | Le chroniqueur lui-même est rejeté (désaccord #2) ; la question de son ordonnancement ne se pose plus. |
| 10 | Orchestrateur (reconciliation mineure) | Domicile des types réseau (`NarrationRendue`, `ConstatRendu`) : `types.ts` (précédent it1/it2) vs `schemaSortie.ts` (regroupement de la note narratif-ia tour 2) | `RETENU : types.ts` | Convention déjà établie (it1/it2) : interfaces dans `types.ts`, fonctions de validation + gabarits dans `schemaSortie.ts`. Pas de désaccord de fond, alignement de forme. |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(supprimé — la garde à deux niveaux (§ 4 bis, KR-271) est une clarification de l'application de KR-230, pas une proposition hors-cadre : elle a été signée par les 5 rôles, aucune n'a été marquée `INNOVATION` par son auteur.)*

## 10 — Définition de fini

- [x] Porte qualité verte : `npm run format` → `npx tsc --noEmit` → `npm run lint` → `npm test` (124 suites / 2078 tests, `--maxWorkers=2`)
- [x] `npm run test:mutation` — NON DÉCLENCHÉ (aucun des 4 fichiers de règles de jeu n'est touché)
- [x] Tests du § 7 écrits et passants, 24 mutants nommés vérifiés ROUGES puis restaurés
- [x] Critères du § 6 cochés un par un (8/8 — #6 reformulé après livraison, voir revue)
- [x] Aucune régression sur les tests existants (`moteur-dossier`, `dossier-copilote`, it1/it2 de `moteur-interprete`)
- [x] Aucun fichier touché hors de la liste du lot (vérifié par l'orchestrateur, `git status`)
- [x] `BUDGET_CARACTERES_NARRATEUR`/`TAILLE_MAX_CORPS_IA` mesurés par le lot : 26 956 o / 83 968 o (82 Kio)
- [x] `code-knowledge.json` mis à jour avec KR-271, KR-272, KR-273 — plafond dépassé après ajout, compacté (KR-197 `dossier-canon`) dans le même lot
- [x] `open_questions` de la spec mises à jour : Chip/refus-console (sans échéance), risque résiduel condensation (non instrumentable), entrées résolues/redondantes retirées
- [x] Dossier de revue écrit : `.claude/raffinage/moteur-interprete-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | Chroniqueur accepté comme condition remplie (démonstration narratif-ia tour 2) ; Chip/refus-console confirmés hors périmètre |
| Tech Lead | recevable sous réserve | Bascule vers l'appel unique actée (tour 2) ; témoins T3/T5 (chaînage, pas 1 absent au pas 15) intégrés au § 7 |
| UX | recevable sans réserve | Aucun contrat de design requis, confirmé |
| QA | recevable | AC#7/AC#8 amendés avec mutants séparateurs, table de valeurs corrigée |
| Narratif & IA | recevable sous réserve | Garde à deux niveaux (R1-R5 de son tour 2) intégrée : nommage `jusqu_au_pas`, ancres limitées lieu/objet, `BORNE_MEMOIRE` exacte, table AC#8 corrigée |
