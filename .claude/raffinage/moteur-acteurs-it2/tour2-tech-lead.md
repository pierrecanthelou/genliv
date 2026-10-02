# Raffinage `moteur-acteurs` it2 — Tour 2 — Tech Lead

## RÉPONSE AUX OBJECTIONS

### 1. Désaccord central — je me rallie entièrement à Narratif-IA, je retire ma proposition « zéro IA »

Je me trompais en tour 1 : j'ai contredit ma propre spécification déjà tranchée au cadrage. `specification.json` dit, AVANT le tour 1 : AC#4 (« le savoir s'ouvre et son identifiant entre dans `ReponseActeur.indices_reveles` comme un RANG ») ; `brain_contracts` (« `ReponseActeur` grandit à `{+indices_reveles}` en it2 ») ; goal it2 ; KR-285. Mon « zéro IA » était une réécriture non mandatée du plan signé. QA l'avait déjà vu au tour 1 (critère #5, rangs) — j'étais isolé dans mon désaccord.

Sur le fond technique, vérifié au code : **le mécanisme de Narratif-IA n'est pas une exception à KR-280, c'est son application littérale, au même patron que `validerDetenteurs`/`validerRelations`** : `validerDetenteurs(brut, rangsConnus: ReadonlySet<RangInjecte>)` (`schemaSortie.ts:335-370`) refuse `rang-inconnu` si un élément n'appartient pas à la table CALCULÉE PAR LE MOTEUR, lot entier refusé, liste vide acceptée — prédicats quasi identiques à ceux de Narratif-IA §C. `CopiloteService.demanderDetenteurs` (`:502-541`) : `rangsConnus` calculé, validation, re-résolution côté client par `Map.get`, jamais côté modèle (« la table des rangs ne sort JAMAIS de `brain/` »). C'est exactement « le moteur calcule un catalogue borné, le modèle choisit dedans, le moteur réévalue et résout ». Le modèle ne décide jamais qu'une porte est ouverte — il indexe dans un ensemble déjà fermé/ouvert avant l'appel, re-vérifié avant d'écrire. Mon veto de tour 1 est retiré.

Deux précisions qui réduisent la portée réelle du lot (plus petite que mon tour 1) : `TRANSITIONS.parler` (`commandes.ts`) n'a AUCUNE raison d'être rouvert — vérifié (`:411-444`), il pose seulement la garde structurelle + `interlocuteur`, jamais `recit`/`deltas`. L'écriture combinée se fait APRÈS la réponse R4, au point où `consignerNarration` est déjà appelée aujourd'hui (`useTourDeJeu.ts:245`). Je retire `commandes.ts`/`commandes.test.ts` de mon lot — erreur de tour 1.

J'ajoute un fichier que ni moi ni Narratif-IA n'avions nommé explicitement : **`worker/index.ts` et `worker/frontiere.test.ts`**. `GABARIT_SORTIE.acteur` et `INVITES.acteur.systeme` y vivent, `frontiere.test.ts` pin leur cohérence avec `CLES_SORTIE_ACTEUR`/`BUDGET_CARACTERES_ACTEUR` — ajouter `indices_reveles` sans y toucher casse ce test et désynchronise l'invite réelle du validateur.

Je retiens son veto sur `consomme:true` (fermé en it2) et son mécanisme de mémoire (`a_dit` testé en premier, savoir fermé = absent sans drapeau).

### 2. `Modal.hideFooter` / `ListRow.onSelect?` → migrent au Lot A

Oui, ma propre règle s'applique sans exception : fichiers `brain/components/`, donc contrat, ordonné en premier. Additives et rétrocompatibles (zéro régression sur les appelants existants), mais le principe ne souffre pas d'exception de taille. Intégrées au Lot A, avec un fichier de test neuf pour `Modal` et le fichier existant pour `ListRow` en R.

### 3. Hedge retiré — mécanisme UX adopté tel quel

J'adopte `CadrePartie.tsx` + prop `actionsEntete?: ReactNode`, montage exclusivement dans `EcranPartie.tsx`, jamais `BandeauHeros.tsx`. Aucune objection technique. `CadrePartie.tsx` entre dans mon Lot B, absent à tort de ma proposition de tour 1 — corrigé.

## MON DÉCOUPAGE EN LOTS MIS À JOUR

Toujours 2 lots, sous le plafond de 4.

### Lot A — `contrat-revelation` (`contrat`, seul, en premier)

| Fichier | N/R |
|---|---|
| `src/brain/dossier/revelation.ts` | N |
| `src/brain/dossier/revelation.test.ts` | N |
| `src/brain/dossier/recit.ts` | R (nouvelle fonction `consignerReponseActeur`, `consignerNarration` intacte) |
| `src/brain/dossier/recit.test.ts` | R |
| `src/brain/dossier/__fixtures__/dossier-reference.json` | R (Harek gagne un `savoirs[]` gardé par `contrepartie`+`apres_indice_id` en conjonction, `formulation_joueur` rédigée) |
| `src/brain/copilote/types.ts` | R (`ReponseActeur += indices_reveles`, `SortieActeurBrute` nommé) |
| `src/brain/copilote/schemaSortie.ts` | R (`CLES_SORTIE_ACTEUR`, `REVELATIONS_PAR_REPLIQUE_MAX`, `validerActeur` 3e paramètre) |
| `src/brain/copilote/schemaSortie.test.ts` | R |
| `src/brain/copilote/contexte/acteur.ts` | R (blocs « déjà confié »/« peux confier », `rangs: ReadonlyMap<RangInjecte,string>` additif) |
| `src/brain/copilote/contexte/acteur.test.ts` | R |
| `src/brain/CopiloteService.ts` | R (`demanderActeur` : `rangsOuverts`, re-résolution `Map.get`) |
| `src/brain/CopiloteService.test.ts` | R |
| `worker/index.ts` | R (`GABARIT_SORTIE.acteur`, `INVITES.acteur.systeme`, re-mesure `BUDGET_CARACTERES_ACTEUR`) |
| `worker/index.test.ts` | R |
| `worker/frontiere.test.ts` | R (re-pin gabarit + budget) |
| `src/brain/components/Modal.tsx` | R (`hideFooter?: boolean`) |
| `src/brain/components/Modal.test.tsx` | N |
| `src/brain/components/ListRow.tsx` | R (`onSelect?: () => void`, rendu `<div>` non focusable si absent) |
| `src/brain/components/ListRow.test.tsx` | R |

**Retiré du tour 1** (erreur de mécanisme) : `commandes.ts`, `commandes.test.ts`.

**Expose** (signatures figées) :
```ts
// brain/dossier/revelation.ts
export type EtatSavoir = 'absent' | 'revelable' | 'deja_confie'
export function evaluerSavoir(dossier: Dossier, faits: FaitsDeSession, personnageId: string, savoir: Savoir): EtatSavoir
export function savoirsRevelables(dossier: Dossier, faits: FaitsDeSession, personnageId: string): readonly string[]
export function savoirsDejaConfies(dossier: Dossier, faits: FaitsDeSession, personnageId: string): readonly string[]

// brain/dossier/recit.ts
export function consignerReponseActeur(
  session: EtatSession, pas: number, dossier: Dossier,
  apport: { readonly recit: string; readonly personnageId: string; readonly indicesReveles: readonly string[] },
): EtatSession
// Lève si un id n'est plus `revelable` à la ré-évaluation (précondition KR-238, appelant fautif).

// brain/copilote/types.ts
export interface ReponseActeur {
  readonly replique: string
  readonly indices_reveles: readonly string[] // IDENTIFIANTS, jamais des rangs
}

// brain/components/Modal.tsx / ListRow.tsx
interface ModalProps { hideFooter?: boolean }
interface ListRowProps { onSelect?: () => void }
```
**Consomme** : `PREDICATES.possede_objet`/`indice_connu`, `DELTAS.reveler_indice`, `appliquerDelta` (existants), `EtatPnj.a_dit` (existant, premier écrivain RUNTIME posé ici), `RangInjecte` (existant). Zéro changement à `types.ts`/`destinations.ts`/`validate.ts` (KR-284).
Critères couverts : AC#3, AC#4, AC#5 (moitié moteur), KR-280, KR-285.

### Lot B — `carnet-indices` (`feature`, après gel du Lot A)

| Fichier | N/R |
|---|---|
| `src/features/play-mode/components/CarnetIndices.tsx` | N |
| `src/features/play-mode/components/CarnetIndices.test.tsx` | N |
| `src/features/play-mode/components/CadrePartie.tsx` | R (`actionsEntete?: ReactNode`) |
| `src/features/play-mode/components/CadrePartie.test.tsx` | N |
| `src/features/play-mode/components/EcranPartie.tsx` | R (`carnetOuvert`, `ActionsCarnet` interne, montage `CarnetIndices`) |
| `src/features/play-mode/components/EcranPartie.test.tsx` | R |
| `src/features/play-mode/hooks/useTourDeJeu.ts` | R (branche R4 : `consignerReponseActeur` au lieu de `consignerNarration`) |
| `src/features/play-mode/hooks/useTourDeJeu.test.ts` | R |

**Expose** : rien. **Consomme** : le Lot A entier, figé.
Critères couverts : AC#5 (moitié affichage), contrat de design `carnet_indices`.

## Décisions prises en autonomie faute de spécification
- Nom du type intermédiaire (rangs bruts vs ids résolus) → `SortieActeurBrute` distinct de `ReponseActeur` → sinon un futur lecteur pourrait croire `indices_reveles` déjà résolu et le persister sans passer par `demanderActeur` (précédent `demanderDetenteurs`, KR-175).
- Domicile de l'écriture combinée → nouvelle fonction `consignerReponseActeur` dans `recit.ts`, `consignerNarration` non touchée → sinon R3 hériterait d'un paramètre qu'il n'utilisera jamais, contredisant « UNE SEULE RESPONSABILITÉ ».
- `worker/index.ts`/`frontiere.test.ts` dans le lot contrat → inclus → sinon `GABARIT_SORTIE.acteur` désynchronisé, détecté seulement en fin d'essaim.
- Portée de `consomme:true` → porte structurellement fermée, aucune alerte auteur ajoutée → avertir l'auteur ouvrirait `dossier-controles.ts`, hors périmètre.
- Fichiers de test neufs (`Modal.test.tsx`, `CadrePartie.test.tsx`) → dédiés neufs, cohérent avec l'absence de fichier existant.

## VERDICT
**Recevable.** Je lève mon veto de tour 1 dans son intégralité — c'est moi qui étais en désaccord avec la spécification déjà tranchée. Le mécanisme de Narratif-IA (rang borné choisi par le modèle, re-résolu et re-vérifié par le moteur) est conforme à KR-280, précédenté quatre fois dans le code déjà shippé. Les deux lots sont à propriété exclusive, le Lot A gèle tout ce que le Lot B lit comme donnée immuable.
