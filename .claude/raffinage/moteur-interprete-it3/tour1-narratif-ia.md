## Tour 1 — Directeur narratif & IA · `moteur-interprete` it3 (mémoire)

**RISQUE** — Pour la première fois, une sortie de modèle devient l'entrée des appels suivants, par la persistance. Un fait inventé, un récit qui dérive ou une injection glissée dans une saisie (et reprise par le récit) devient canon pendant 14 pas. Via les faits et le résumé, il le reste pour toujours.

**OBJECTION** —
1. AC#8 ne dit pas ce qui se passe quand le résumé échoue : soit la fenêtre dépasse 14, soit il y a un trou. L'esquisse `{resume, faits_etablis[]}` ne sait pas jusqu'où le résumé couvre. Un 503, ou une console qui franchit le pas 15, efface alors dix pas sans trace.
2. Ancrer par rang fait entrer des rangs dans R3, qui n'en a plus depuis it2. Sans scanner de rang sur la narration, les tentatives et les faits, « A1 » arrive jusqu'au joueur.
3. Un fait ancré sur un indice ou un jalon n'est jamais réinjecté. C'est KR-268 appliqué au type d'ancre.
4. Le témoin it2 « pas 2 = pas 40 » doit être réécrit en témoin séparateur, pas supprimé.

**PROPOSITION** —
- La fenêtre se dérive de l'horloge seule et reste entre 5 et 14 pas, sans condition.
- `resume.absorbe_jusqua` est stocké, parce qu'il dépend des échecs.
- Un retard du résumé crée un trou nommé, rattrapé d'une cadence à chaque pas narré. Les faits, qui ne passent jamais par la fenêtre, comblent ce trou.
- **Question structurante : je tranche pour un second appel conditionnel, un 9ᵉ rôle `chroniqueur`, appelé avant R3.** Un `resume?` dans R3 aurait trois défauts :
  - l'échec d'un artefact que le joueur ne voit pas ferait perdre le récit (KR-230) ;
  - le champ serait mort neuf pas sur dix (KR-268) ;
  - la fenêtre monterait à 15 au pas de bascule.
- Ancres : le lieu courant et les objets du contexte, rien d'autre. Les faits sont injectés par pertinence d'identifiant, 8 au plus.
- La borne de la mémoire se calcule à partir des bornes des validateurs, sans marge.

**VERDICT** — recevable sous réserve.

---

## ANNEXE (hors quota)

### A. Forme de `EtatSession.memoire` (lot contrat, `src/brain/dossier/session.ts`)

```ts
readonly memoire: null | MemoireDeSession   // on élargit le type `null` : une session écrite avant it3 reste légale (KR-251)

export interface MemoireDeSession {
  /** Ajout seul, ordre chronologique. Jamais résumés, jamais réécrits, jamais évincés. */
  readonly faits_etablis: readonly FaitEtabli[]
  /** Absent tant qu'aucune absorption n'a réussi. Jamais `| null` (précédent `attente?`). */
  readonly resume?: ResumeDeSession
}
export interface FaitEtabli {
  readonly constat: string            // 'ia' : prose, au plus FAIT_CARACTERES_MAX
  readonly ancres: readonly string[]  // 'moteur' : 1 à 2 identifiants distincts, lieu.* | objet.* seulement
}
export interface ResumeDeSession {
  readonly texte: string              // 'ia'
  readonly absorbe_jusqua: number     // 'moteur' : dernier pas absorbé. Posé par le code, jamais par le modèle
}
```

**Invariants**, chacun vérifié par un test, et la fixture saturée instancie chaque feuille :
- **I1** — `memoire === null || faits_etablis.length > 0 || resume !== undefined`. Le code n'écrit jamais `{faits_etablis: []}` sans résumé : ce serait un second encodage de `null`.
- **I2** — `absorbe_jusqua % CADENCE === 0` et `absorbe_jusqua <= debutDeFenetre(horloge.tour)`.
- **I3** — Aucun champ `pas`/`tour` sur un fait : rien ne le lirait (KR-249), et l'ordre du tableau donne déjà la chronologie. Pour tout nom neuf, c'est « pas », jamais « tour » (REGLES-PLAY § J1).
- **I4** — `memoire` n'est lu par aucun prédicat, ni par `evaluerExpr`, `executerCommande` ou `resoudreJalons`. La mémoire est hors rejeu, comme `recit` (KR-248/242). Le code ne lit que les `ancres`, et seulement pour choisir ce qu'il injecte.

**Module `src/brain/dossier/memoire.ts`** (nouveau, pur, sans IA, il part avec `src/player/`) :

```ts
export const FENETRE_MIN = 5
export const CADENCE = 10
export const FENETRE_MAX = FENETRE_MIN + CADENCE - 1       // 14, dérivée, jamais stockée
export const FAITS_INJECTES_MAX = 8                         // valeur de décision ; it4 la ramène à K
export function debutDeFenetre(pas: number): number         // Math.max(0, CADENCE * Math.floor((pas - FENETRE_MIN) / CADENCE))
export function absorptionDue(session: EtatSession): { apres: number; jusqua: number } | null
//   j = resume?.absorbe_jusqua ?? 0 ; renvoie (j, j + CADENCE] si j + CADENCE <= debutDeFenetre(horloge.tour)
export function faitsPertinents(session: EtatSession): readonly FaitEtabli[]
//   ancres ∩ ({lieu_courant} ∪ objets_possedes) ≠ ∅ ; les FAITS_INJECTES_MAX plus récents, en ordre chronologique
export function absorber(session: EtatSession, resume: string, jusqua: number): EtatSession
//   même référence si jusqua ≠ absorptionDue(session)?.jusqua
export function consignerNarration(session: EtatSession, pas: number, recit: string, etablis: readonly FaitEtabli[]): EtatSession
//   récit ET faits en UNE seule transition (un seul onSessionChange) ; mêmes cas d'identité que consignerRecit
//   Aucun type de copilote/ en paramètre : KR-260 (le garde de moteurSansIA rougit sur un import de ce type)
```

**Témoin AC#8.** Valeurs tirées de la formule, que le lot doit mesurer :

| pas | début de fenêtre | taille de fenêtre |
|---|---|---|
| 3 | 0 | 3 |
| 14 | 0 | 14 |
| 15 | 10 | 5 |
| 24 | 10 | 14 |
| 25 | 20 | 5 |

Mutants à voir ROUGES : `FENETRE_MAX` écrit en dur ; `Math.max(0, …)` retiré (pas 3 → −10) ; `<` à la place de `<=`.

### B. Audiences (`sessionDestinations.ts`)

- La ligne racine `memoire: 'moteur'` est **remplacée** par des feuilles :
  - `memoire.faits_etablis[].constat: 'ia'`
  - `memoire.faits_etablis[].ancres[]: 'moteur'`
  - `memoire.resume.texte: 'ia'`
  - `memoire.resume.absorbe_jusqua: 'moteur'`
  - les lignes porteuses, déclarées comme dispenses.
- `journal[].recit` passe de `'moteur'` à `'ia'` : bascule en valeur, et on corrige le commentaire (KR-195/196). Le champ n'est injecté que pour les pas de la fenêtre ou de la tranche à condenser.
- `journal[].texte` reste `'moteur'`.
- Garde de confinement (KR-232) : les chemins de session injectés entrent dans les listes `CHAMPS_INJECTES_*` des deux assembleurs.

### C. Sortie de R3 étendue

- **Réseau** `NarrationRendue` : `{narration, tentatives, retenus: [{phrase, sur: ["A1"]}]}`.
- **Résolu** `SortieNarrateur` : `{recit, suggestions, etablis: readonly FaitEtabli[]}`.
- **KR-231 aux deux niveaux** :
  - `{narration,tentatives,retenus} ∩ {recit,suggestions,etablis} = ∅` ;
  - `{phrase,sur} ∩ {constat,ancres} = ∅` ;
  - aucune de ces clés n'est prise par les neuf autres formes, y compris `chronique`.
- **Gabarit** : `{"narration": "…", "tentatives": ["…"], "retenus": [{"phrase": "…", "sur": ["A2"]}]}`. Il montre `A2` et non `A1` : un rang est une adresse, pas un ordre (précédent P1/P3).
- **Rangs dans le contexte** :
  - Préfixe `A` (ancre), jamais `P`/`G` : deux scanners, deux espaces de rangs.
  - Un rang sur l'en-tête `ICI` (lieu courant) et un sur chaque ligne d'objet (CE PAS obtient/n'a plus, EN SA POSSESSION).
  - Un rang par identifiant.
  - La table `ancres: ReadonlyMap<RangInjecte, string>` est rendue par `assemblerNarrateur` et ne sort jamais de `brain/` (précédent `TablesInterprete`).
  - Indices et jalons ne reçoivent pas de rang.

**Prédicats ajoutés à `validerNarrateur`**, qui reçoit maintenant `ancres`. On refuse toujours le lot entier (KR-230) :

| # | Prédicat | Motif | Note |
|---|---|---|---|
| 14 | `retenus` est un tableau | `schema` | |
| 15 | longueur ≤ `FAITS_PAR_PAS_MAX` = 2 | `schema` | La liste vide est un **succès** (voir sous le tableau). |
| 16 | chaque élément a exactement les clés `{phrase, sur}` | `schema` | Signal KR-236 au second niveau. |
| 17 | `phrase` est une chaîne non vide après trim | `vide` | |
| 17 bis | `phrase` ≤ `FAIT_CARACTERES_MAX` = 160 et ne finit pas par « ? » | `schema` | |
| 18 | `sur` : chaînes distinctes, 1 ≤ longueur ≤ `ANCRES_PAR_FAIT_MAX` = 2 | `schema` | **Mutant AC#7 n°1 : `sur: []` accepté → ROUGE.** |
| 19 | chaque élément de `sur` appartient à `ancres` | `rang-inconnu` | **Mutant AC#7 n°2 : un rang hors table accepté → ROUGE.** |
| 20 | phrases distinctes après trim | `schema` | |
| 21 | ni marqueur ni identifiant, phrase par phrase, jamais sur un `join` | `marqueur` / `identifiant` | |
| 22 | nouveau `porteUneAncre` (`\bA\d+\b` ∩ `Map.has`) sur la narration, chaque tentative et chaque phrase | `identifiant` | **Mutant n°3 : « A1 » dans la narration accepté → ROUGE.** |

La règle du cas mixte classerait `retenus` comme une rédaction, donc la liste vide y serait un refus. On l'écrit contre cette règle : « rien de durable n'a changé » est une information que le code n'a pas. Refuser la liste vide forcerait un fait inventé à chaque `agir`.

- **Ré-résolution** : `sur` → `ancres` par `Map.get`. Si `get` ne trouve rien, la réponse est traitée comme illisible, motif `schema`, par défense (précédent `interprete`).
- **Échec** : rien ne change par rapport à it2. Le rejeu est fait une fois, puis on dégrade :
  - pas de récit, **aucun fait retenu** ;
  - le pas reste acquis ;
  - la bannière d'it2 s'affiche.

  Un fait fautif coûte donc le récit. C'est le prix de KR-230, et le plafond de 2 faits par pas le limite.
- **`max_tokens` du narrateur** : se re-dérive, avec P = 800 + 3×60 + 2×(160 + rangs).

### D. Ce qui est injecté dans R3 (`assemblerNarrateur`), dans cet ordre

1. **Canon** — inchangé.
2. **`AUPARAVANT`** — `memoire.resume.texte`, s'il existe.
3. **`RECEMMENT`** — chaque pas p de `(debutDeFenetre(t), t−1]`, dans l'ordre chronologique, **une ligne par pas** :
   - le `recit` de p s'il existe, sinon `COMMANDES[origine].label` (KR-269 : le label est désormais lu à trois endroits) ;
   - blancs repliés (`\s+` → espace) : un récit réinjecté ne peut pas imiter un en-tête de bloc. C'est la garde contre une injection qui persisterait.
   - Jamais : un numéro de pas, `journal[].texte`, les deltas passés (l'état les reflète déjà), les `tentatives` (jamais persistées).
4. **`ETABLI`** — `faitsPertinents(S)`, une ligne par fait, repliée.
5. **`ICI A1`**, puis **`CE PAS`**, **`EN SA POSSESSION`**, **`DEJA ACCOMPLI`** — l'état vient **après** la mémoire. L'invite l'écrit : « ce que la demande dit d'ici et de maintenant prime sur ce qui a été retenu ».
6. **`saisie`** — en dernier.

**Borne**

```
BUDGET_CARACTERES_NARRATEUR = ceil(M_dossier × 3 / 1000) × 1000     // M_dossier re-mesuré avec les étiquettes de rang
                            + BORNE_MEMOIRE                          // calculée
BORNE_MEMOIRE = RESUME_CARACTERES_MAX
              + (FENETRE_MAX − 1) × NARRATION_CARACTERES_MAX
              + FAITS_INJECTES_MAX × FAIT_CARACTERES_MAX
              + séparateurs et en-têtes
              ≈ 1200 + 10 400 + 1280 + ~300 ≈ 13 200
```

- `BORNE_MEMOIRE` est exacte par construction, puisqu'un validateur borne chaque terme. Elle ne prend jamais la marge ×3.
- Conséquence à tester : sur le dossier de référence, une mémoire saturée ne produit **jamais** `trop-long`. Seul le terme dossier peut le produire.
- `TAILLE_MAX_CORPS_IA` se re-dérive sur les neuf rôles. Il bouge, vers ~61 kio : c'est une mesure, pas un desserrage.
- En it4, les deux termes rejoignent la constante unique de KR-261.

**Témoins séparateurs**, qui remplacent « pas 2 = pas 40 » (même monde, même mémoire) :
- (a) récit d'un pas ≤ `debutDeFenetre(t)` modifié ⇒ contexte IDENTIQUE ;
- (b) récit d'un pas dans la fenêtre modifié ⇒ contexte DIFFÉRENT ;
- (c) fait ancré sur un lieu non courant et un objet non possédé ⇒ absent ;
- (d) 9 faits pertinents ⇒ seuls les 8 plus récents sont injectés.

### E. Le 9ᵉ rôle : `chroniqueur`

**Quand il est appelé**
- Dans `useTourDeJeu`, sur un pas accepté (`aucun`), APRÈS `onSessionChange(S1)` et AVANT R3, si `absorptionDue(S1) ≠ null`.
- Sous le même verrou KR-265.
- Une cadence au plus par pas : au plus un appel de plus par pas (deux avec le rejeu). Coût nommé : un pas sur dix est plus lent.

**Ce qu'il reçoit (`assemblerChroniqueur`)**
- `canon.ton` et `canon.interdits_ton[]` ;
- `AUPARAVANT` : l'ancien résumé ;
- `A CONDENSER` : les pas `(apres, jusqua]` du journal, une ligne repliée par pas (récit ou label), dans l'ordre chronologique.
- Rien d'autre. Ni scène, ni état, ni faits : ils ne sont jamais résumés, et les lui montrer les ferait dupliquer. Ni rang, ni nombre.

**Forme de sortie**
- Réseau : `ChroniqueRendue { chronique: string }`.
- Résolu : `SortieChroniqueur { resume: string }`.
- `absorbe_jusqua` est posé par le code (précédent `CERTITUDE_INITIALE`/`etape`).

**Validation (`validerChroniqueur`)**
- objet dont les clés sont exactement `{chronique}` ;
- une chaîne, non vide (`vide`) ;
- au plus `RESUME_CARACTERES_MAX` = 1200 caractères (`schema`) ;
- ne finit pas par « ? » ;
- aucun marqueur, aucun identifiant ;
- pas de scanner de rang : aucun rang n'est injecté (KR-235).

**Voix (dans l'invite)** : deuxième personne, passé composé, factuelle. Elle ne dit que ce que disent les pas : aucun dialogue, aucun nom, aucun chiffre, aucune mécanique, jamais « tour ».

**En cas d'échec** (refusé, indisponible, ou illisible après le rejeu unique)
- Aucun message au joueur : entretenir la mémoire n'est pas de la fiction.
- `memoire` et `absorbe_jusqua` restent inchangés, et R3 est **appelé quand même**.
- Nouvel essai au prochain pas narré.
- Pendant le retard, les pas `(absorbe_jusqua, debutDeFenetre(t)]` ne sont ni dans la fenêtre ni dans le résumé : c'est un **trou nommé**, borné, rattrapé d'une cadence à chaque succès. Les faits établis pendant ces pas restent injectés.
- Témoin : chroniqueur illisible et narrateur valide ⇒ le récit s'affiche et `absorbe_jusqua` ne bouge pas ; au pas suivant, le chroniqueur est rappelé.

**Console qui franchit une cadence** : aucun appel, la console reste sans IA (KR-260). Le rattrapage se fait au prochain pas en saisie libre. C'est ce cas qui justifie de stocker `absorbe_jusqua`.

**Bornes et coût**
- `max_tokens` se dérive de `RESUME_CARACTERES_MAX`.
- `BUDGET_CARACTERES_CHRONIQUEUR` = terme canon mesuré + (`RESUME_CARACTERES_MAX` + `CADENCE` × `NARRATION_CARACTERES_MAX` + séparateurs), cette seconde partie étant calculée.
- Coût nommé : une 9ᵉ branche `never`, un 9ᵉ `CorpsDemande`, une entrée `INVITES`/`GABARIT` dans le worker, les interdits dérivés de `COMMANDES` étendus au rôle (KR-270), `frontiere.test.ts`.
- L'exclusion de `moteurSansIA` ne change pas : l'appelant reste `useTourDeJeu.ts`.

### F. Frontière avec it4 et les n° 11, 12, 14

- **n° 11** — Les futurs `jets` du journal n'entrent jamais dans la fenêtre ni dans la tranche à condenser : le récit porte déjà l'issue. Aucun fait ni résumé ne doit contenir de résultat mécanique. Le scanner ne le voit pas : c'est l'invite, avec les interdits dérivés, qui le porte. La mémoire est hors du rejeu de KR-242.
- **n° 12** — Les ancres `personnage.*` appartiennent à la n° 12. **R4 ne reçoit jamais `faits_etablis` tel quel** : ce sont les souvenirs du narrateur, pas les savoirs d'un PNJ (cadrage par le point de vue). Sinon, la mémoire rend le PNJ omniscient. KR-262 est respecté : les faits sont de la prose, ancrés par rang, et aucun `Entite.nom` n'est injecté.
- **n° 14** — Le « résumé perceptible » de l'horloge (§ 2.7) n'est **pas** `memoire.resume` : le nom est réservé, le producteur est différent.
- **it4** — La forme supporte la cascade sans changement : la même dérivation ramène la fenêtre à `FENETRE_MIN`, et `faitsPertinents` ramène les faits à K.
- **R1** — Il reste sans mémoire en it3, car le goal ne lui donne aucun lecteur. « J'y retourne » reste donc non résoluble : c'est une dette nommée.

### G. Ce qui sort de mon domaine

- **`Chip` cliquable** — aucun lien avec le contrat de mémoire. Je demande seulement un invariant : une suggestion n'est jamais persistée, n'entre ni dans la fenêtre ni dans `memoire`, et un clic repasse par R1. Le PM tranche.
- **Refus console qui réapparaît** — c'est de l'UI, hors de mon domaine.

### H. Alternatives REJETÉES (à recopier au § 8)

1. **`resume?` dans `SortieNarrateur` (même appel)** — lie l'échec d'un artefact invisible au récit que lit le joueur (KR-230). Champ mort neuf pas sur dix (KR-268). `max_tokens` de R3 alourdi en permanence. Deux registres de voix dans un seul appel. Fenêtre à 15 au pas de bascule, ce qui viole AC#8.
2. **Fenêtre stockée** (`memoire.fenetre`) — une copie du journal (KR-013).
3. **`FENETRE_MAX` stocké ou écrit en dur** — KR-013 et AC#8.
4. **Résumé sans `absorbe_jusqua`** (oubli définitif en cas d'échec) — un 503 ou une console au mauvais pas efface dix pas pour toujours.
5. **Fenêtre qui s'allonge tant que le résumé échoue** — contexte sans borne.
6. **Chroniqueur appelé APRÈS R3** — le R3 du pas de bascule verrait un trou de dix pas.
7. **Résumé calculé par le code** — un pas `agir` n'y laisserait que « agit sur place », donc aucune information. À rouvrir sur une mesure de dérive.
8. **Ancres sur des indices ou des jalons** — jamais réinjectées, donc sans lecteur.
9. **Ancre par nom ou par prose libre** — un identifiant stable est obligatoire.
10. **Tous les faits injectés à chaque pas** — le contexte grossirait avec la durée de la partie.
11. **Éviction FIFO des faits stockés** — l'oubli ramènerait exactement la contradiction que les faits empêchent. Leur croissance, au plus 2 × 160 caractères par pas, reste inférieure à celle du journal, déjà acceptée.
12. **`pas` stocké sur chaque fait** — aucun lecteur (KR-249).
13. **Numéro de pas injecté** — il invite le modèle à citer une mécanique, et contredit le « aucun nombre » d'it2.
14. **`retenus` vide refusé** — une machine à complaisance.
15. **Faits réécrits ou fusionnés par le modèle** — le PLAN § 2.8 dit « jamais résumés ».

---

## Décisions prises en autonomie faute de spécification

- Échec du résumé → nouvel essai au pas narré suivant, grâce à `absorbe_jusqua` stocké → l'inverse (oubli définitif) perd dix pas de prose à chaque 503 ou à chaque franchissement par la console.
- Place du chroniqueur → avant R3 → après R3, le pas de bascule serait raconté avec un trou de dix pas ; le prix de mon choix est un pas sur dix plus lent.
- Fenêtre en cas de retard → toujours 5-14, dérivée ; les faits comblent le trou → l'inverse fait grossir le contexte sans borne pendant une panne.
- Types d'ancre → lieu courant et objets du contexte seulement → avec tous les types, des ancres mortes et du bruit de rangs dans R3.
- Pertinence → lieu courant ∪ objets possédés, 8 plus récents → injecter tous les faits fait croître le contexte avec la partie.
- Bornes (`FAITS_PAR_PAS_MAX` 2, `FAIT_CARACTERES_MAX` 160, `ANCRES_PAR_FAIT_MAX` 2, `RESUME_CARACTERES_MAX` 1200, `FAITS_INJECTES_MAX` 8) → valeurs de décision, pas des mesures → plus larges, elles alourdissent linéairement la borne de chaque pas.
- Stockage des faits → sans plafond, comme le journal → un plafond FIFO ramène les contradictions.
- Échec du chroniqueur → silencieux à l'écran → une bannière parlerait de mécanique au joueur.
- Doublons exacts (même constat après trim, mêmes ancres) → non ajoutés à l'écriture ; c'est de l'idempotence de stockage, et le joueur ne lit aucune prose modifiée → sans cela, des emplacements d'injection gaspillés sur des répétitions. Si le tech-lead y voit une réparation (KR-230), je retire.
- Préfixe de rang → `A` → réutiliser `P` ferait se croiser les scanners de deux rôles.
- Voix du résumé → deuxième personne, passé composé → à la 3ᵉ personne, R3 risque de changer de personne.
- Pas sans récit dans la fenêtre → une ligne de label → l'omettre ferait un trou dans la chronologie.
- Écriture du récit et des faits → une seule transition (`consignerNarration`) → avec deux écritures, un récit peut rester sans ses faits après une coupure.
- `memoire: null` → conservé pour l'ouverture et les sessions antérieures → le rendre toujours objet obligerait à réécrire `ouvrirSession` et crée un double encodage.
- Nouveaux KR à proposer au tech-lead :
  - toute sortie de modèle réinjectée est repliée sur une ligne, sous un en-tête ;
  - une ancre n'est admise que pour un type d'entité qui a un chemin de réinjection.

---

Fichiers lus :
- `C:\Users\pierr\Desktop\genliv\src\features\moteur-interprete\specification.json`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\session.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\dossier\sessionDestinations.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\types.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\schemaSortie.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\copilote\contexte\narrateur.ts`
- `C:\Users\pierr\Desktop\genliv\src\brain\CopiloteService.ts`
- `C:\Users\pierr\Desktop\genliv\worker\index.ts`
- `C:\Users\pierr\Desktop\genliv\src\features\play-mode\hooks\useTourDeJeu.ts`
- `C:\Users\pierr\Desktop\genliv\docs\ROADMAP-BASCULE-IA.md` (§ 3)
- `C:\Users\pierr\Desktop\genliv\docs\PLAN-BASCULE-IA.dc.html` (§ 2.5, 2.8, 2.10)
- `C:\Users\pierr\Desktop\genliv\docs\REGLES-PLAY.md` (§ J1)
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-cadrage\tour1-narratif-ia.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-cadrage\tour2-narratif-ia.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it2\tour2-narratif-ia.md`
- `C:\Users\pierr\Desktop\genliv\.claude\raffinage\moteur-interprete-it2.plan.md`
