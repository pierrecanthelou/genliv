## Tech Lead, moteur-horloge it4, TOUR 2

### Réponses nommées

1. **Extinction `>=` (NIA, PM) : DÉSACCORD, je maintiens.** `blocage.ts:13-21` impose `===` parce que le constat n'écrit rien : seule l'égalité évite de répéter la ligne. L'extinction efface `climat_actif`, donc l'état est la garde et `>=` ne répète jamais. `===` laisse une tempête éternelle sur une session forgée ou persistée contre un dossier édité (`blocage.ts:27-29` les nomme). C'est le risque même de NIA.
2. **Nom du champ : `depuis`** (précédent `etape_plan.depuis`). L'exigence (c) de NIA est tenue par construction : `{id, depuis}` rend « id sans pas » irreprésentable. ACCORD sur le fond, pas sur le nom.
3. **Journal : `climat_actif : <id>`** (convention « champ : id », comme `lieu_courant`), puis `climat_eteint : <id>`. DÉSACCORD avec UX : `climat_active` n'est ni un nom de champ ni accordé.
4. **UX O4 : ACCORD.** `--bw-hair` et `--fw-semibold` existent, et `alignSelf: 'stretch'` supprime la hauteur magique. J'adopte aussi UX O1, O2 et O3, et la prop `climatNom?: string` remplace mon `climat`.
5. **QA O1 : ACCORD.** Critère observable : `horloge.climat_actif` égal à `{id, depuis}`. Pour QA O3, l'idempotence passe par `evenements_consommes` écrit à l'activation (précédent `resoudreRencontre`, `session.ts:717`), sans second drapeau.
6. **PM O3 : ACCORD.** Les effets viennent d'un dossier construit EN TEST : fixture étalée, climat inline avec `donner_objet`, passé par `validateDossier`. Les fixtures gardent `effets_regles: []` (pin `validate.test.ts:104`). Un `donner_objet` sur un objet déjà possédé doit rendre `sans_effet`.

### Mes objections

- **Veto Route B : MAINTENU.** Le PM le rejoint (O1).
- **Route C : MAINTENUE.**
- **Extraction `sessionCombat.ts` dans L1 : MAINTENUE, mais mon motif KR-112 était FAUX.** KR-112 vise composants et hooks, et j'avais déjà jugé ainsi à moteur-combat it2. Le vrai motif est le déclencheur de la dette (`ROADMAP:140`, `specification.json:88`). Je refuse le pré-lot du PM : un déplacement pur n'est pas un lot de plus, c'est le premier commit de L1.
- **L3 : RETIRÉE** (PM). `climat_id` n'a pas d'éditeur, comme `effets_regles` (démo par import JSON).
- **Risque (a) : DURCI.** `horloge: { ...session.horloge, tour }` aux trois sites de `commandes.ts` (348, 394, 457), avec un test de régression « `aller` conserve `climat_actif` ».
- **NOUVEAU : `blocage.test.ts:403` rougit.** Il fige exactement `['blocage.ts','validate.ts']` comme lecteurs de `.duree`, et `climat.ts` lit `Climat.duree`. L1 possède donc `blocage.test.ts`.

**VERDICT** : recevable, 2 lots. Question à NIA : les deltas de la ligne d'activation entrent dans CE PAS (`narrateur.ts:655`, sans fichier touché), précédent jalons. Est-ce voulu ?

---

## ANNEXE : lots (hors quota)

| Lot | Type | Fichiers (R = remplace, N = crée) |
|---|---|---|
| **L1 `contrat-climat`** | contrat, seul, premier | **Prod R** : `src/brain/dossier/{types,tables,destinations,sessionDestinations,session,commandes,horloge,evaluate}.ts`, `src/brain/index.ts` (re-pointage des 3 exports combat vers `sessionCombat`), `atteignabilite.ts` (docstring l.49-50 seule, devenue fausse). **Prod N** : `src/brain/dossier/sessionCombat.ts`, `src/brain/dossier/climat.ts`. **Tests R** : `validate`, `couverture`, `sessionCouverture`, `commandes`, `horloge`, `blocage`, `evaluate`, `session` `.test.ts`. **Tests N** : `climat.test.ts`. **Fixtures R** : `dossier-reference.json`, `dossier-minimal.json` (`climat_id` sur un Evenement SANS `monstre_ref`, `effets_regles` toujours `[]`), `session-saturee.ts` (`climat_actif`). |
| **L2 `bandeau-pas-climat`** | feature `play-mode` | **R** : `BandeauHeros.tsx`, `BandeauHeros.test.tsx`, `EcranPartie.tsx`, `EcranPartie.test.tsx` |

Aucun fichier n'est nommé par deux lots. Aucun nouvel export de `brain/index.ts` : `tickClimat` et `evenementDeClimat` restent internes (la seule porte est `executerCommande`, garde de `evaluate.test.ts`).

L1 doit passer la porte seul (tsc, jest). Ordre interne :
1. Extraction pure (jest vert, aucun champ neuf).
2. Contrat (types, tables, destinations, fixtures, tests de couverture).
3. Moteur (`climat.ts`, sélecteur, appel, spread de l'horloge).

### Signatures (point de rendez-vous L1 → L2)

```ts
// types.ts
interface Evenement { climat_id?: string }
// tables.ts : REFERENCES_SIMPLES += { path:'monde.evenements[].climat_id', espace:'climat', location:'Événements' }
// destinations.ts : 'monde.evenements[].climat_id': 'moteur'
// sessionDestinations.ts : 'horloge.climat_actif.id' et '.depuis': 'moteur'

// session.ts
readonly horloge: { readonly tour: number; readonly climat_actif?: { readonly id: string; readonly depuis: number } }

// evaluate.ts
export interface ActivationDeClimat { readonly evenement_id: string; readonly climat_id: string }
export function evenementDeClimat(dossier: Dossier, session: { readonly monde: FaitsDeSession }): ActivationDeClimat | undefined

// climat.ts (N)
export function tickClimat(dossier: Dossier, session: EtatSession): EtatSession

// L2 — BandeauHeros
interface BandeauHerosProps { readonly heros: HeroState; readonly pas: number; readonly climatNom?: string; readonly pvLive?: number; readonly peLive?: number }
```

### `tickClimat`, dans cet ordre

1. **Extinction** si `climat_actif` existe et que l'une de ces conditions tient :
   - le climat est introuvable dans le dossier ;
   - `duree` est définie et `tour − depuis >= duree`.

   Effet : `horloge` sans la clé `climat_actif` (jamais `undefined`, KR-251) et ligne `climat_eteint : <id>`, sans `deltas` ni `origine`.
2. **Activation** si aucun climat n'est actif après l'étape 1, et que `evenementDeClimat` rend quelque chose. Le tick fait alors, dans l'ordre :
   - ajouter `evenement_id` à `evenements_consommes` (sémantique d'ensemble) ;
   - appliquer chaque `effets_regles` par `appliquerDelta` ;
   - poser `climat_actif: { id, depuis: tour }` ;
   - écrire la ligne `climat_actif : <id>` avec `deltas`, sans `origine` (même forme que la ligne de jalon).

### Risque à journaliser (KR candidat, non corrigé en it4)

Un `effets_regles` contenant `atteindre_jalon` coche le jalon sans jouer son `effet[]`. `resoudreJalons` saute les jalons déjà atteints (`evaluate.ts:214`). C'est préexistant pour les quatre emplacements de deltas, donc hors périmètre, mais à écrire.
