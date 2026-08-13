# Tour 1 — `tech-lead` · `dossier-fiches` it3

```
RISQUE      — `stats` est la première forme « Record à clés fixes » du schéma, et le walker
              de `couverture.test.ts` la décompose en 8 FEUILLES. Avec `Partial`, les deux
              gardes se contredisent : la 4e assertion exige une instance par chemin de
              table, « aucune ligne morte » interdit une ligne sans instance. Un dossier où
              l'auteur n'a réglé que FO rend l'un des deux rouge. L'échappatoire qu'un
              ouvrier prendra alors — une dispense dans `LIBRES`/`SANS_DESTINATION`, ou un
              point d'arrêt dans le walker — retire l'audience déclarée de 8 champs moteur :
              exactement la fuite que `destinations.ts` existe pour rendre impossible.

OBJECTION 1 — `Partial<Record<Characteristic,number>>` et `maxPV` ne compilent pas ensemble :
              `maxPV` exige `Pick<HeroStats,'FO'|'AG'|'EN'>`, donc `number`, jamais
              `number|undefined`. L'ouvrier écrira `stats.FO ?? 0` — seconde source de vérité
              sur `PV = FO+AG+EN`, ce que KR-192 interdit nommément.

OBJECTION 2 — « bornes 1..CHARACTERISTIC_MAX » : le **1** n'est dans aucune section de
              `docs/REGLES-DU-JEU.md` (§ 1 : génération 2D4, plafond 10 à la création,
              plafond dur 12). KR-130 impose le sens d'écriture doc → code.

PROPOSITION — `stats?: Record<Characteristic, number>` : optionnel EN BLOC, TOTAL quand
              présent, `requis: true` sur les 8 lignes. 8 lignes dérivées de
              `CHARACTERISTIC_VALUES` dans `ENUMERES_FERMES` + 8 dans
              `DESTINATION_DES_CHAMPS` → `moteur`. Mesuré : 0 ligne dans `validate.ts`,
              0 dispense, 0 point d'arrêt, intégralité et bornes gratuites.
              `CARACTERISTIQUE_MIN`/`STATS_INITIALES` dans `dossier/types.ts` (précédent
              `PORTEE_INITIALE`), JAMAIS dans `characteristics.ts` : le toucher déclenche le
              cliquet de mutation (break 80→85) pour zéro bénéfice.

VERDICT     — recevable sous réserve.
```

---

## ANNEXE — découpage en lots

**2 lots, exécution SÉQUENTIELLE, aucun essaim, aucun worktree.** Le lot 2 ne peut pas être scindé : `FichePersonnage.tsx` déclare la prop que `PanneauPersonnages.tsx` passe et que le test exerce — trois fichiers, une seule porte qualité franchissable.

### Lot 1 — `contrat` (seul, en premier)

Fichiers (tous **R**, aucun **N**) :
- `src/brain/dossier/types.ts`
- `src/brain/dossier/tables.ts`
- `src/brain/dossier/destinations.ts`
- `src/brain/dossier/__fixtures__/dossier-minimal.json`
- `src/brain/dossier/__fixtures__/dossier-reference.json`
- `src/brain/dossier/couverture.test.ts`
- `src/brain/dossier/validate.test.ts`
- `src/brain/index.ts`

**Signature exposée** (le seul point de rendez-vous du lot 2) :

```ts
// dossier/types.ts
export const CARACTERISTIQUE_MIN = 1                 // borne NOMMÉE (KR-165), voisine de CONFIANCE_MIN
export const STATS_INITIALES: Record<Characteristic, number>   // dérivé de CHARACTERISTIC_VALUES × CARACTERISTIQUE_MIN
export interface Personnage extends Entite {
  …
  stats?: Record<Characteristic, number>   // OPTIONNEL en bloc (KR-191) ; présent ⇒ les 8 clés
}
// dossier/tables.ts
export const VALEURS_DE_CARACTERISTIQUE: readonly number[]     // Array.from(...) — calqué mot pour mot sur CONFIANCES
// brain/index.ts
export { …, CARACTERISTIQUE_MIN, STATS_INITIALES } from './dossier/types'
```

`CHARACTERISTICS`, `CHARACTERISTIC_VALUES`, `CHARACTERISTIC_MAX`, `maxPV`, `type Characteristic` et `Stepper` sont **déjà** exportés par `brain/index.ts` : rien à y ajouter pour eux.

**Ce que le lot NE touche PAS — mesuré, pas recopié de KR-190 :**
- `src/brain/dossier/validate.ts` — **non touché**. Les 8 bornes entrent par `ENUMERES_FERMES`, balayée par la boucle générique du § 6 ; même constat qu'à it1 (`iterations_log[0].architecture_choices[3]`).
- `src/brain/characteristics.ts` — **interdit**. Fichier sous score de mutation : le toucher oblige à `npm run test:mutation` et à relever `break` de +5 (WORKFLOW, § cliquet), pour une constante qui n'y a rien à faire.
- `suffisance.test.ts`, `sections.ts`, `amorce.ts`, `read.ts`, `roundtrip.test.ts` — non touchés (vérifié : `suffisance` exige seulement clés(référence) ⊆ clés(minimal), satisfait dès que les deux fixtures portent `stats` ; `sections.ts` ne fait que compter ; `amorce.ts` sème `personnages: []`).

### Tranchage de la question ouverte : le Record `stats` dans les destinations

**8 lignes, DÉRIVÉES, audience `moteur`. Ni dispense, ni chemin normalisé, ni point d'arrêt.**

```ts
// destinations.ts, dans DESTINATION_DES_CHAMPS
...Object.fromEntries(CHARACTERISTIC_VALUES.map((c) => [`monde.personnages[].stats.${c}`, 'moteur' as const])),
// tables.ts, dans ENUMERES_FERMES
...CHARACTERISTIC_VALUES.map((carac) => ({
  path: `monde.personnages[].stats.${carac}`, location: 'Personnages',
  valeurs: VALEURS_DE_CARACTERISTIQUE, requis: true,
})),
```

Pourquoi cette forme et pas les deux autres :
- **`moteur`** — même arbitrage que `savoirs[].revele_si.jet.carac` : « le modèle ne voit jamais `carac`/`tc` bruts ». Un chiffre injecté est une règle de jeu dans le prompt. À confirmer par `narratif-ia`, mais la ligne existante fait précédent.
- **Aucune dispense** — la corruption du walker remplace un nombre par une chaîne ; `valeurs.includes('du texte…')` est faux → bloquant. `LIBRES` et `SANS_DESTINATION` restent **inchangés** : it3 ne rouvre pas le débat des dispenses d'it2.
- **`requis: true`** est ce qui rend le « total quand présent » **vrai** et pas seulement typé. `sitesDe` ne produit **aucun** site quand `stats` est absent (segment `stats` → `undefined`, segment `FO` → `!estObjet` → `continue`) : un personnage sans `stats` reste calme. Mais un `stats: { FO: 3 }` écrit à la main produit 7 sites `undefined` → refusés. Sans cette ligne, le dossier gelé promettrait un `Record` complet et `maxPV` rendrait `NaN` — classe exacte de BUG-049.
- **Bénéfice gratuit** : l'énuméré fermé rejette aussi `0`, `13`, `2.5` et `"3"`. Une table `min/max` maison aurait coûté une branche dans `validate.ts` et laissé passer les non-entiers.
- **Contrepartie assumée** : le message d'anomalie énumère 12 valeurs (« attendu : 1, 2, … ou 12 »). C'est le prix du précédent `CONFIANCES` (7 valeurs). Si l'UX le refuse au tour 2, l'alternative est une table `BORNES_NUMERIQUES` + une branche dans `validate.ts` : je la chiffre à +1 fichier au lot contrat et +1 code d'anomalie, et je ne la recommande pas.

**Fixtures** : `stats` complet (8 clés) sur `pnj.aldur-le-sage` dans la minimale — sans quoi la 4e assertion nomme 8 orphelins — et sur **au moins un** des six personnages de la référence.

**`couverture.test.ts`** : un test nommé, dérivé de `CHARACTERISTIC_VALUES`, jamais huit littéraux — assertion sur la **valeur** de la destination (KR-174, leçon de BUG-051) + présence dans les deux fixtures.
**`validate.test.ts`** : bornes à la limite et limite+1 (`0`, `1`, `12`, `13`), plus le bloc partiel refusé et le bloc absent calme.

### Lot 2 — `feature` (démarre contrat figé)

Fichiers (tous **R**) :
- `src/features/dossier-fiches/components/FichePersonnage.tsx`
- `src/features/dossier-fiches/components/PanneauPersonnages.tsx`
- `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx`

**Signature consommée / exposée :**

```tsx
// FichePersonnageProps — UNE prop ajoutée, les 5 autres inchangées
onChangeCaracteristique: (carac: Characteristic, valeur: number) => void

// bloc 3, les 8 Steppers DÉRIVÉS du registre (KR-117), jamais une liste locale
CHARACTERISTIC_VALUES.map((carac) => (
  <Stepper key={carac} label={CHARACTERISTICS[carac].label}
    value={(personnage.stats ?? STATS_INITIALES)[carac]}
    min={CARACTERISTIQUE_MIN} max={CHARACTERISTIC_MAX}
    onChange={(v) => onChangeCaracteristique(carac, v)} />
))

// PV : calculé EN LIGNE (KR-013/113), jamais stocké (KR-192), jamais réimplémenté
const pv = personnage.stats === undefined ? null : maxPV(personnage.stats)

// PanneauPersonnages — régime camp/portée : widget fermé, AUCUN brouillon
function handleChangeCaracteristique(id: string, carac: Characteristic, valeur: number): void {
  commit(dossierActuel.monde.personnages.map((p): Personnage =>
    p.id !== id ? p : { ...p, stats: { ...(p.stats ?? STATS_INITIALES), [carac]: valeur } }), id)
}
```

Contraintes dures du lot : `BrouillonPersonnage` / `ChampTexte` **inchangés** (ne pas rouvrir BUG-058) ; `commit()` et `RefusEnCours` **inchangés** (KR-197 déjà refermé à it2 — un stepper hors bornes est impossible par construction, donc **aucun nouveau chemin de refus à construire**, doctrine « ne pas construire un bandeau qui ne peut jamais s'allumer ») ; la ligne `{ id: 'caracteristiques', … }` quitte la table `BLOCS_VIDES` ; `maxPV(stats)` appelé avec **un objet**, jamais trois arguments.

**Point laissé à l'arbitrage UX/PM au tour 2** (défaut donné, non tranché) : `stats` absent affiche les 8 steppers au plancher et le PV en « — », rien n'étant écrit tant que l'auteur n'a pas agi. L'incohérence visuelle 1+1+1 vs « — » est réelle ; l'alternative est un état vide « + Régler les caractéristiques… » qui écrit les 8 clés au clic.

### KR-112 et les 443 lignes de `PanneauPersonnages.tsx`

Mesure : 443 lignes, dont **86 de constantes de style** (l. 358-443) et ~120 de docstrings — le corps exécutable fait ~240 lignes. Le lot 2 y ajoute **un** handler et **une** prop : ~460 lignes projetées, loin du blocage à 800.

**Aucune extraction cette itération.** Le seul découpage honnête est la couche d'écriture (`commit` + `refus` + les 5 handlers) dans un `hooks/useEcriturePersonnages.ts` : elle n'aurait **qu'un seul appelant** aujourd'hui — la dette que ce dépôt refuse par principe (précédent d'it2 : `BlocIdentite.tsx` non créé). Je **date le déclencheur** : it4 (`plan_actions[]` + `contre_mesures[]`) apporte une seconde famille de handlers de liste — c'est là que l'extraction se fait, dans son propre lot, avant la tranche de schéma. `FichePersonnage.tsx` (317 l.) passe à ~365 avec le bloc 3 : sous le seuil, pas de `BlocCaracteristiques.tsx`.

### Contrôles d'isolation

Aucun import entre `dossier-fiches` et `dossier-canon`/`bascule-editeur` (KR-184) — tout passe par `brain/`. Aucun `localStorage`. Aucune couleur en dur. Aucune copie privée du document : `stats` est lu depuis `useOpenDossier`, jamais mis en miroir dans un état local — c'est précisément pourquoi les steppers n'ont **pas** de brouillon.
