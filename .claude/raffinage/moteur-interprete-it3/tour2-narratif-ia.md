## Tour 2 : Directeur narratif & IA · `moteur-interprete` it3 (mémoire)

### RÉPONSE AUX OBJECTIONS

**Au tech-lead : résumé dans R3 ou chroniqueur. Je choisis (a) et je retire le chroniqueur.**

Ce que j'ai vérifié dans le code :
- **Aucun précédent de validation composite.** Les huit validateurs de `schemaSortie.ts` sont tous atomiques : ils rendent `{ok:true; sortie} | {ok:false; motif}`. Celui-ci serait le premier.
- **(a) se fait sans second appel quand la sortie est lisible.** `jusquAuRejeuUnique` (`CopiloteService.ts:389`) est générique en `S` et ne rejoue que sur `ok:false`. Si le statut composite est porté par la branche de succès, un refus de mémoire est un `ok:true` : il ne déclenche ni rejeu ni dégradé. La boucle ne change pas.
- **Un JSON cassé reste couplé, et on ne peut pas l'éviter.** Le worker renvoie le texte du modèle tel quel (`worker/index.ts:872`, sans `tool_use` ni `response_format`, décision ratifiée l. 772). Le client fait un seul `res.json()` (`CopiloteService.ts:364`). Un JSON cassé dans `condense` perd donc toute la réponse. Un parseur partiel serait une réparation (KR-230), je le rejette.
- **Ce reste de couplage est acceptable, et je le nomme.** Il existe déjà pour le récit seul. Le rejeu le couvre. La troncature est exclue si `max_tokens` inclut `CONDENSE_CARACTERES_MAX` au ratio le plus défavorable. Il ne reste que le double échec de syntaxe sur un pas de condensation. Ce n'est pas un motif pour créer un 9ᵉ rôle.

**La frontière du découplage n'est pas celle de l'énoncé (a).** D'un côté, `{narration, tentatives, constats}` reste atomique. De l'autre, `{condense}` est découplé seul.

Le critère : un artefact ne sort du refus de lot que s'il remplit trois conditions.
1. Il parle d'une fiction **déjà persistée**.
2. Le joueur ne le lit jamais.
3. Le code sait le **reprendre de façon déterministe**.

`condense` remplit les trois : il porte sur des pas passés, et comme le pointeur ne bouge pas, il est redemandé au pas narré suivant. Les `constats` échouent sur les conditions 1 et 3 : ils parlent du récit de CE pas, et rien ne les ré-extrait ensuite. Si on les découplait, le joueur lirait un récit dont les faits durables ne sont pas retenus, d'où des contradictions plus tard. Et une ancre inventée n'invaliderait plus le récit qui l'a produite ; c'est l'argument du tech-lead, que je reprends.

**Pourquoi le chroniqueur ne se justifie plus.** Quand la sortie est lisible, un `condense` refusé laisse exactement l'état persistant qu'aurait laissé un échec du chroniqueur :
- le récit est posé ;
- le résumé et le pointeur sont inchangés ;
- on réessaie au pas suivant.

Le chroniqueur ne protège donc que du JSON cassé. En échange, il coûte un rôle complet et un appel de plus sous le verrou KR-265. Le calcul ne tient plus.

**« Deux voix dans une même sortie »** : ce n'est pas un motif de veto. Le glissement de temps est un risque d'invite, gardé par le test apparié de `frontiere.test.ts`. Le chroniqueur aurait le même risque. Le repli R5 du tech-lead n'est pas déclenché.

**Au tech-lead : le budget (son objection 1 et son RISQUE).**
- **D'accord sur le pire cas `FENETRE_MAX + CADENCE`**, soit 23 récits passés : 13 dans la fenêtre et 10 dans la tranche, pendant un retard. Il est obligatoire. Un budget calé sur 14 récits lèverait `trop-long` du pas 16 au pas 24 après UN échec de condensation : le narrateur se tairait neuf pas, justement quand il doit rattraper.
- **Désaccord sur la méthode.** Le ×3 ne vaut que pour le terme dossier, dont la prose n'est pas bornée (KR-203). Chaque terme de mémoire est borné par un validateur, donc `BORNE_MEMOIRE` est exacte : la tripler serait une marge inventée. J'estime `BORNE_MEMOIRE` à ≈ 21 000 et le total à ≈ 27 000–28 000 avec le dossier. `TAILLE_MAX_CORPS_IA` monterait donc vers ≈ 84 kio, pas ~110. Le lot doit le mesurer.
- **Les bornes chiffrées des faits sont fixées** :
  - en sortie : `FAITS_PAR_PAS_MAX` = 2, `FAIT_CARACTERES_MAX` = 160, `ANCRES_PAR_FAIT_MAX` = 2 ;
  - en contexte : `FAITS_INJECTES_MAX` = 8.
- **Le stockage reste en ajout seul, sans plafond.** Le budget lit ce qui est injecté, pas ce qui est stocké. Je refuse `FAITS_RETENUS_MAX` sur le stockage : évincer des faits ramène les contradictions.

**Au tech-lead : les types d'ancre (mon objection 3, contre son annexe B).** Je refuse les rangs sur « indices (ce pas) » et « jalons atteints » :
- **Un indice n'est révélé qu'une fois.** L'ancre n'est sélectionnable qu'au pas où elle est créée, puis elle est morte (KR-268).
- **`jalons_atteints` ne fait que croître.** L'ancre y reste présente pour toujours, donc le fait est injecté à chaque pas et occupe les 8 places. Le sélecteur revient à « tous les faits ».

Règle : on ne pose un rang d'ancre que sur une entité dont la présence dans le contexte peut disparaître puis revenir. Ce sont le lieu courant et les objets (ceux de ce pas et ceux possédés).

**Au QA : AC#8.**
- **Son séparateur 2 est faux.** « 15 pas → fenêtre de 14 (2–15) plus un résumé 1–10 » met les pas 2 à 10 à la fois dans la fenêtre et dans le résumé, et la fenêtre ne descend jamais à 5.
- **Les bonnes valeurs** : au pas 15, la fenêtre est (10,15], soit 5 pas, et `jusqu_au_pas` = 10 si la condensation réussit.
- **Deux noms n'existent pas dans le contrat.** `resumes.length` : il n'y a qu'un résumé, glissant. `validerMemoire` : les prédicats de `constats` sont dans `validerNarrateur` (AC#7), ceux de `condense` dans `validerCondense`.
- **Je garde de sa note** : au pas 4, la fenêtre vaut 4 (aucun forçage à 5). Et son mutant « index d'entrée au lieu de pas », utile parce qu'un pas peut porter plusieurs entrées de journal.

**Au PM** : avec (a), la démo tient en un seul appel R3, sans scission. Chip et refus-console restent hors périmètre, l'annexe G ne change pas.

### STATUT DE MES OBJECTIONS (tour 1)

1. **Échec du résumé et couverture inconnue — retirée.**
   - Le tech-lead stocke le pointeur et dérive la fenêtre de l'horloge. Son séparateur (échec au pas 15 ⇒ au pas 16, fenêtre 11..16 et `pasACondenser` = {1,10}) est le mien.
   - Le couplage KR-230 est fermé par la garde à deux niveaux.
   - Le chroniqueur est retiré.
   - Seule condition : le champ se nomme `jusqu_au_pas` (J1).
2. **Rangs dans R3 sans scanner — retirée.** Le tech-lead adopte le scanner. Conditions maintenues :
   - préfixe `A`, distinct de celui de l'interprète ;
   - quatre sites scannés : narration, chaque tentative, chaque phrase, et `condense`.
3. **Ancres sur indices et jalons — maintenue, et durcie** par l'argument des ensembles qui ne font que croître (ci-dessus).
4. **Témoin « pas 2 = pas 40 » — retirée.** Le tech-lead le remplace par son inverse ; on réunit ses quatre assertions et mes témoins (a) à (d).

Deux retraits de plus :
- **Question structurante (chroniqueur)** : retirée au profit de (a), avec la frontière `{narration, tentatives, constats}` | `{condense}`.
- **« Fenêtre à 15 au pas de bascule »** (H.1) : retirée, je l'avais mal lu. La fenêtre au pas 15 est (10,15], soit 5 pas. `À CONDENSER` est un bloc distinct, borné et compté dans `BORNE_MEMOIRE`.

### VERDICT — recevable sous réserve

Aucune réserve n'est un veto, toutes sont testables :
- **R1** — Garde à deux niveaux, exactement sur cette frontière, avec les mutants M4 à M9 ROUGES.
- **R2** — Le champ s'appelle `jusqu_au_pas`, jamais `jusqu_au_tour` (REGLES-PLAY § J : aucun champ neuf ne porte « tour »).
- **R3** — Ancres limitées au lieu courant et aux objets.
- **R4** — `BORNE_MEMOIRE` exacte, calculée sur un pire cas de 23 récits, sans ×3.
- **R5** — Table AC#8 du QA corrigée.

---

## ANNEXE : signatures finales, variante (a)

### Un seul jeu de noms

| Objet | Retenu | Écarté | Motif |
|---|---|---|---|
| Fait stocké | `FaitEtabli {fait, sur}` | `{constat, ancres}` | `constat` est contenu dans la clé réseau `constats` : piège de lecture (KR-236) |
| Résumé stocké | `ResumeMemoire {texte, jusqu_au_pas}` | `jusqu_au_tour`, `absorbe_jusqua` | J1. Le nom du tech-lead est gardé, à un mot près |
| Racine | `MemoireSession` | `MemoireDeSession` | Nom du tech-lead |
| Réseau | `constats: [{phrase, ancres}]`, `condense?` | `retenus: [{phrase, sur}]` | `ancres` rime avec le préfixe de rang `A` que le modèle lit dans le contexte |
| Résolu | `faits_etablis`, `resume` | `etablis` | Précédent `recit` : la clé résolue porte le nom de sa destination |
| Fonctions | `borneDeFenetre(pas)`, `pasACondenser` → `{de, a}` | `debutDeFenetre`, `absorptionDue` | Noms du tech-lead ; le paramètre se nomme `pas` (J1) |
| Borne de sortie | `CONDENSE_CARACTERES_MAX` | `RESUME_CARACTERES_MAX` | Nommée d'après la clé réseau qu'elle borne (précédent `NARRATION_CARACTERES_MAX`) |

Vérification KR-231 (égalité stricte, comme dans `schemaSortie.test.ts`) :
- listes : `{narration, tentatives, constats, condense} ∩ {recit, suggestions, faits_etablis, resume} = ∅` ;
- éléments : `{phrase, ancres} ∩ {fait, sur} = ∅` ;
- aucune collision avec les sept autres rôles ni avec `EntreeJournal`.

### Session (`src/brain/dossier/session.ts`, lot contrat)

```ts
readonly memoire: MemoireSession | null   // élargit `null` (KR-251)
export interface MemoireSession {
	readonly faits_etablis: readonly FaitEtabli[]   // ajout seul, jamais résumés, réécrits ni évincés
	readonly resume?: ResumeMemoire                 // absent avant la 1re condensation réussie, jamais `| null`
}
export interface FaitEtabli {
	readonly fait: string                // 'ia', au plus FAIT_CARACTERES_MAX
	readonly sur: readonly string[]      // 'moteur', 1..ANCRES_PAR_FAIT_MAX identifiants distincts, lieu.* | objet.* seulement
}
export interface ResumeMemoire {
	readonly texte: string               // 'ia', au plus CONDENSE_CARACTERES_MAX
	readonly jusqu_au_pas: number        // 'moteur', posé par le code depuis condensation.a, jamais par le modèle
}
```

Invariants :
- **I1** — « Rien retenu » ne s'écrit que `null`.
- **I2** — `jusqu_au_pas % CADENCE === 0` et `jusqu_au_pas <= borneDeFenetre(horloge.tour)`.
- **I3** — Pas de `pas` ni de `tour` sur un fait.
- **I4** — Aucun prédicat, ni `evaluerExpr`, ni `executerCommande`, ni `resoudreJalons` ne lit `memoire` : elle reste hors du rejeu.
- **I5** — `sur` ne contient que des `lieu.*` et des `objet.*`.

Aucune clé `fenetre`.

### `src/brain/dossier/memoire.ts` (pur, sans IA)

```ts
export const FENETRE_MIN = 5
export const CADENCE = 10
export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1   // 14, dérivé
export const FAITS_INJECTES_MAX = 8
export function borneDeFenetre(pas: number): number    // CADENCE * max(0, floor((pas - FENETRE_MIN) / CADENCE))
export function pasACondenser(session: EtatSession): { readonly de: number; readonly a: number } | null
//   couvert = resume?.jusqu_au_pas ?? 0 ; couvert < borneDeFenetre(horloge.tour) ? { de: couvert + 1, a: couvert + CADENCE } : null
export function faitsPertinents(session: EtatSession): readonly FaitEtabli[]
//   sur ∩ ({lieu_courant} ∪ objets possédés) ≠ ∅ ; les FAITS_INJECTES_MAX plus récents, en ordre chronologique
```

### `src/brain/dossier/recit.ts`

```ts
export function consignerNarration(
	session: EtatSession,
	pas: number,
	apport: { readonly recit: string; readonly faits_etablis: readonly FaitEtabli[]; readonly resume?: ResumeMemoire },
): EtatSession
```

- **Une seule transition**, et le premier récit du pas gagne : la règle vaut pour le récit, les faits et le résumé.
- **Garde sur le résumé.** `resume` n'est écrit que si `apport.resume.jusqu_au_pas === pasACondenser(session)?.a` ; sinon la partie résumé reste inchangée. C'est le chemin d'écriture qui tient I2, pas la confiance dans l'appelant.
- **I1 à l'écriture.** Sans fait et sans résumé, `memoire` reste `null`.
- **Types.** Seulement des types de `dossier/` : aucun type de `copilote/` (KR-260).

### `src/brain/copilote/schemaSortie.ts`

```ts
export const CLES_SORTIE_NARRATEUR = ['narration', 'tentatives', 'constats'] as const
export const CLE_CONDENSE = 'condense'
export const FAITS_PAR_PAS_MAX = 2
export const FAIT_CARACTERES_MAX = 160
export const ANCRES_PAR_FAIT_MAX = 2
export const CONDENSE_CARACTERES_MAX = 1200

export interface ConstatRendu { readonly phrase: string; readonly ancres: readonly RangInjecte[] }
export interface NarrationRendue {
	readonly narration: string
	readonly tentatives: readonly string[]
	readonly constats: readonly ConstatRendu[]
	readonly condense?: string
}
export type IssueCondense =
	| { readonly ok: true; readonly texte: string }
	| { readonly ok: false; readonly motif: 'schema' | 'vide' | 'marqueur' | 'identifiant' }

export function validerCondense(brut: unknown, dossier: Dossier, ancres: ReadonlyMap<RangInjecte, string>): IssueCondense

export function validerNarrateur(
	brut: unknown,
	dossier: Dossier,
	attendu: { readonly ancres: ReadonlyMap<RangInjecte, string>; readonly condenseDemande: boolean },
):
	| { ok: true; sortie: Omit<NarrationRendue, 'condense'> & { readonly condense: IssueCondense | null } }   // null : non demandé
	| { ok: false; motif: MotifIllisible }
```

**Enveloppe (refus de lot quand elle échoue)**
- **Si `condenseDemande` est faux** : les clés valent EXACTEMENT `CLES_SORTIE_NARRATEUR`. Un `condense` présent est un refus de lot `schema` : c'est le signal de dérive KR-236.
- **Si `condenseDemande` est vrai** : les clés contiennent au moins `CLES_SORTIE_NARRATEUR` et au plus ces clés plus `condense`. Toute autre clé est un refus de lot. **Un `condense` absent donne `condense: {ok:false, motif:'schema'}`, et le lot est accepté.**

**Ordre d'évaluation**
1. Enveloppe, prédicats (1) et (2).
2. Prédicats (3) à (13) existants.
3. Prédicats (14) à (22) des constats (ma table du tour 1, avec `retenus` → `constats` et `sur` → `ancres`), dont `porteUneAncre` (`\bA\d+\b` ∩ `Map.has`) sur la narration, chaque tentative et chaque phrase.

Tous les prédicats de 1 à 3 **refusent le lot entier** (KR-230). Ensuite, **seulement si tout est passé** et que la condensation est demandée : `validerCondense(brut.condense)`.

**`validerCondense`**, chaque prédicat se prouve seul :
- C1 — chaîne ⇒ sinon `schema` ;
- C2 — non vide après trim ⇒ sinon `vide` ;
- C3 — au plus `CONDENSE_CARACTERES_MAX` ⇒ sinon `schema` ;
- C4 — ne finit pas par « ? » ⇒ sinon `schema` ;
- C5 — aucun `MARQUEUR_A_ECRIRE` ⇒ sinon `marqueur` ;
- C6 — aucun identifiant du dossier ⇒ sinon `identifiant` ;
- C7 — aucune ancre (`porteUneAncre`) ⇒ sinon `identifiant`.

La docstring écrit le critère d'exception (conditions 1 à 3) : c'est ce qui l'empêche de s'étendre aux artefacts des n° 11 et 12.

### Service et assembleur

- **`assemblerNarrateur`** rend, sur sa branche `ok` : `{ texte, ancres, condensation: {de, a} | null }`. `condensation = pasACondenser(cible.session)` est **calculé une fois**. Il sert à écrire le bloc `À CONDENSER`, à donner `condenseDemande = condensation !== null`, et à fournir `jusqu_au_pas = condensation.a`. Trois consommateurs pour un seul calcul.
- **Forme résolue** :
  ```ts
  SortieNarrateur { recit; suggestions; faits_etablis: FaitEtabli[]; resume?: ResumeMemoire }
  ```
  - `sur` se résout par `ancres.get`. Si `get` ne trouve rien, c'est un refus `schema` par défense.
  - `resume` n'est présent que si `condense.ok`.
- **`ReponseNarrateur` ne change pas.** Le motif du refus de mémoire n'en sort pas, parce que personne ne le lirait (KR-249/268).
- **`jusquAuRejeuUnique` ne change pas.**

### Matrice d'échec

| Cas | Récit | Faits | Résumé et pointeur | Rejeu | Ce que voit le joueur |
|---|---|---|---|---|---|
| JSON illisible, y compris cassé dans `condense` | refusé | aucun | inchangés | oui, 1 fois | bannière it2 après le 2ᵉ échec |
| Clé inconnue, ou `condense` non demandé mais présent | refusé | aucun | inchangés | oui | idem |
| Narration, tentatives ou constats invalides | refusé | aucun | inchangés | oui | idem |
| Récit valide, `condense` demandé mais absent ou invalide | **affiché** | retenus | **inchangés, redemandé au pas narré suivant** | **non** | rien |
| Récit valide, `condense` valide | affiché | retenus | résumé remplacé, `jusqu_au_pas = a` | non | rien de plus |
| Service indisponible ou 503 | refusé | aucun | inchangés | non | bannière |
| La console franchit une cadence | aucun appel (KR-260) | — | inchangés, demandé au prochain pas en saisie libre | — | — |

On ne compose **jamais** deux essais : un `condense` valide à l'essai 1 n'est pas gardé si l'essai 2 est celui qui est accepté.

### Contexte R3 (ordre et borne)

**Ordre des blocs** :
1. Canon.
2. `AUPARAVANT` (résumé).
3. `À CONDENSER` : pas `[de, a]`, seulement quand la condensation est due.
4. `RECEMMENT` : pas `(borneDeFenetre(t), t−1]`.
5. `ETABLI` : `faitsPertinents`.
6. `ICI A1`, `CE PAS`, `EN SA POSSESSION`, `DEJA ACCOMPLI`.
7. Saisie.

**Règles de rendu**
- Une ligne par pas, avec les blancs repliés. On y met le récit, ou à défaut le label de la commande.
- Jamais de numéro de pas, ni de `journal[].texte`, ni de tentatives, ni de deltas passés.
- La tranche à condenser et la fenêtre ne se recouvrent jamais : `a <= borne`.

**Borne**
```
BORNE_MEMOIRE = CONDENSE_CARACTERES_MAX
              + (FENETRE_MAX − 1 + CADENCE) × NARRATION_CARACTERES_MAX   // 23 récits, pendant un retard
              + FAITS_INJECTES_MAX × FAIT_CARACTERES_MAX
              + séparateurs et en-têtes                                    // exacte, sans ×3
BUDGET_CARACTERES_NARRATEUR = ceil(M_dossier × 3 / 1000) × 1000 + BORNE_MEMOIRE
```

### Invite du worker (`condense`)

- **Déclenchement.** `condense` est demandé **d'après le contenu** (« quand la demande porte aussi des moments plus anciens à condenser »), jamais d'après un compte. L'invite ne cite ni en-tête de bloc, ni « mémoire », ni « résumé », ni « tour ». **La cadence ne vit que dans `memoire.ts`.**
- **Voix.** Deuxième personne, passé composé, factuelle. Le texte réécrit ensemble ce qui précédait et les moments à condenser, sans reprendre ce qui est déjà établi. Aucun dialogue, aucun nom donné, aucun chiffre, aucune mécanique, aucune question.
- **Gabarits.** Deux gabarits, avec et sans `condense`, tous deux épinglés dans `frontiere.test.ts`.
- **`max_tokens`.** P gagne `CONDENSE_CARACTERES_MAX` + `FAITS_PAR_PAS_MAX` × (`FAIT_CARACTERES_MAX` + longueur des rangs) + l'enveloppe, au ratio r = 2. C'est ce qui exclut la troncature tant que le modèle reste dans ses bornes.

### Mutants et témoins à voir ROUGES

- **AC#7 (refus de lot)**
  - M1 — `ancres: []` accepté.
  - M2 — rang hors table accepté.
  - M3 — « A1 » accepté dans la narration.
- **Garde à deux niveaux**
  - M4 — un `condense` invalide refuse le lot ⇒ ROUGE (le récit doit être présent).
  - M5 — un `condense` invalide mais `jusqu_au_pas` avancé ou `resume` posé ⇒ ROUGE.
  - M6 — un refus de `condense` déclenche un rejeu ⇒ ROUGE (un seul `fetch`).
  - M7 — un `condense` non demandé est accepté ⇒ ROUGE.
  - M8 — composition entre essais (essai 1 avec récit invalide et `condense` valide, essai 2 avec récit valide et `condense` invalide) : un `resume` est présent ⇒ ROUGE.
  - M9 — un constat invalide avec un récit valide, et le récit est gardé ⇒ ROUGE.
- **AC#8**
  - `FENETRE_MAX` écrit en dur ; `max(0, …)` retiré ; `<` à la place de `<=` ;
  - fenêtre fixe ; `CADENCE` = 5 ; index d'entrée au lieu de pas (QA) ;
  - fenêtre dérivée de la couverture, et déclenchement par `t % 10 === 5` (séparateurs du tech-lead).
- **Témoin 40 pas** : les quatre assertions du tech-lead, plus mes témoins (a) à (d) du tour 1.

### Mémoire : ce qui est retenu, résumé et oublié, et quand

- **Retenus pour toujours** : les faits (au plus 2 par pas), dont 8 au plus sont injectés, choisis par pertinence.
- **Résumés** : à chaque pas narré où `pasACondenser` n'est pas nul, l'ancien résumé et la tranche sont réécrits en 1200 caractères au plus. Le détail s'y perd progressivement, et c'est assumé.
- **Oubliés** : un pas qui sort de la fenêtre n'est plus lu qu'à travers le résumé. Pendant un retard, il n'est lu nulle part (trou borné), mais ses faits restent.
- **Jamais retenus** : les tentatives, les deltas passés et les numéros de pas.
- **Risque résiduel** : si `condense` échoue à chaque fois, l'échec est silencieux. La borne de contexte tient, mais la mémoire se troue. Jest ne peut pas le voir (c'est le comportement du modèle) ; il faudra l'instrumenter quand une télémétrie de session existera.

### KR proposés

1. Un artefact de sortie n'est découplé du refus de lot que s'il parle d'une fiction déjà persistée, n'est jamais lu par le joueur, et que le code sait le reprendre de façon déterministe. Aujourd'hui, seul `condense` remplit ces conditions.
2. On ne pose un rang d'ancre que sur une entité dont la présence dans le contexte peut disparaître puis revenir. Un ensemble qui ne fait que croître ne sélectionne rien.
3. La cadence ne vit que dans `memoire.ts`. L'invite décide de `condense` d'après la présence du bloc, jamais d'après un compte.
4. (Tour 1) Toute sortie de modèle réinjectée est repliée sur une ligne, sous un en-tête.

### Alternatives rejetées (à recopier au § 8)

- **Chroniqueur (9ᵉ rôle).** Sur une sortie lisible, il laisse le même état persistant que la garde à deux niveaux. Il ne protège que du JSON cassé, que le rejeu couvre déjà, pour le prix d'un rôle complet et d'un appel sous verrou.
- **Découpler aussi `constats`.** Le joueur lirait des faits que la mémoire ne retient pas.
- **Parseur JSON partiel.** C'est une réparation (KR-230).
- **Rejeu sur un refus de mémoire.** Il jetterait un récit valide pour un artefact qu'on peut reprendre au pas suivant.
- **×3 sur `BORNE_MEMOIRE`.** Une marge inventée.
- **`FAITS_RETENUS_MAX` sur le stockage.** L'éviction ramène les contradictions.
- **Ancres sur les indices et les jalons.** Soit elles ne sont jamais resélectionnées, soit elles le sont toujours.
- **Mon H.1 du tour 1** (« `resume?` dans `SortieNarrateur` rejeté ») est retiré de cette liste.

---

## Décisions prises en autonomie faute de spécification

- Frontière du découplage → `condense` seul, `constats` atomiques → si les constats sont découplés, le joueur lit un récit dont les faits durables ne sont pas retenus, et une ancre inventée n'invalide plus son récit.
- `condense` demandé mais absent → refus de mémoire, récit gardé → en refus de lot, l'oubli de la clé optionnelle (la panne la plus probable) coûterait le récit, et mon objection 1 reviendrait par l'enveloppe.
- `condense` présent sans avoir été demandé → refus de lot (KR-236) → en refus de mémoire seul, une dérive de l'invite passerait inaperçue à l'exécution.
- Refus de mémoire → pas de rejeu, nouvel essai au pas suivant → avec un rejeu, un récit valide serait jeté (rien n'est retenu entre essais) pour un artefact qu'on peut reprendre.
- Aucune composition entre essais → composer reviendrait à fusionner deux sorties de modèle, donc à réparer (KR-230).
- Motif du refus de `condense` → gardé dans le retour du validateur, absent de `ReponseNarrateur` → s'il était exposé, ce serait un champ sans lecteur (KR-249/268).
- Nom du pointeur → `jusqu_au_pas` → avec `jusqu_au_tour`, un premier champ neuf porterait « tour », ce qui lèverait sans le dire la réserve de REGLES-PLAY § J.
- Pire cas du budget → 23 récits → avec 14, `trop-long` se lèverait du pas 16 au pas 24 après un seul échec, et le narrateur se tairait justement quand il doit rattraper.
- R3 voit les faits pendant qu'il condense → accepté, l'invite lui demande de ne pas les reprendre → sinon il faudrait un second appel (retour au chroniqueur) pour cacher au plus 8 lignes.
- Voix de `condense` → deuxième personne, passé composé → au présent, R3 relirait le passé comme l'état courant.
- Doublons exacts de faits → toujours non ajoutés à l'écriture ; reste ouvert avec le tech-lead s'il y voit une réparation → sinon, des places d'injection sont gaspillées.

---

**Fichiers lus** :
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-narratif-ia.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-tech-lead.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-pm-produit.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-ux-designer.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it3\tour1-qa.md`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.ts` (les 8 validateurs, l. 260–1103)
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.test.ts` (tests d'intersection KR-231)
- `C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts` (l. 330–406, 715–769)
- `C:\Users\pierr\Desktop\genliv\worker\index.ts` (l. 590–876)
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\session.ts`
- `C:\Users\pierr\Desktop\genliv\docs\REGLES-PLAY.md` (§ J)

Aucun fichier modifié.
