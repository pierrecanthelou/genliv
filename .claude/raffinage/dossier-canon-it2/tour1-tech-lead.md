RISQUE — Recopier le patron `Brouillon` de `PanneauCanon` sur `lieu_id`. Un `Select` n'a pas de blur : un brouillon local de la **référence** devient une seconde source de vérité. Si une adoption cloud retire ce lieu, `<select>` sans option correspondante rend `selectedIndex = -1` (champ vide), et le commit suivant écrit un lieu que l'auteur n'a jamais choisi — référence réécrite en silence. Mon terrain de veto.

OBJECTION 1 — « Généralise le Select existant » est faux tel qu'écrit : `Select<T extends string>` est **déjà** générique sur `{value,label}` et n'a **zéro consommateur** aujourd'hui (grep : aucun fichier de `features/`). `PanneauDepart` en est le premier. Le « généraliser » modifierait `brain/components/Select.tsx` — donc un **second lot contrat** dans une itération qui n'en supporte qu'un. Et rien ne le demande : `depart.lieu_id` est une référence simple bloquante, donc un dossier lisible a toujours ≥ 1 lieu et sa valeur courante est toujours dans les options — aucun état vide à inventer.

OBJECTION 2 — KR-183 (« warnings **rendus** ») n'a ici aucune implémentation possible : aucun budget ne porte `texte_ouverture_joueur`, les seuls warnings atteignables viennent d'autres sections. À trancher explicitement, pas à laisser tomber pour le 2ᵉ panneau d'affilée.

PROPOSITION — Un seul champ de brouillon (`texte_ouverture_joueur`, semé une fois, commit au blur) ; `lieu_id` lu en ligne depuis `dossier.charpente.depart`, commit au `change` (patron `handleAjouterInterdit`). Le test épingle le libellé mot pour mot (« Lieu n°1 (sans nom) ») : le couplage format-de-rapport → libellé d'option devient visible. Aucune extraction d'un hook d'écriture partagé à 2 sites ; si it4 en fait 3, il vivra dans `features/dossier-canon/hooks/`, jamais dans `brain/`.

VERDICT — **recevable sous réserve** (les trois points tranchés au tour 2).

---

## ANNEXE — découpage en lots (2 lots, séquentiels, sans worktree ni fusion)

| # | Lot | Type | Fichiers (N = créé, R = remplacé) |
|---|-----|------|-----------------------------------|
| 1 | `contrat-localiser-entite` | **contrat** (seul, premier) | R `src/brain/index.ts` — ajoute `localiserEntite` à la ligne d'export de `./dossier/identifiers` **et** met à jour le bloc de commentaire l.121-139 qui nomme ce qui reste délibérément dedans (`collectIds`, `feuilleDe`, `deepFreeze` : inchangés)<br>R `src/brain/dossier/identifiers.test.ts` — 1 test : joignable depuis le baril + repli exact sur entité sans `nom` |
| 2 | `panneau-depart` | feature | N `src/features/dossier-canon/components/PanneauDepart.tsx`<br>N `src/features/dossier-canon/tests/panneauDepart.test.tsx`<br>R `src/features/dossier-canon/index.ts`<br>R `src/App.tsx`<br>R `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` — **uniquement** le cas `index === 1` du describe paramétré (l.188-211) + la sonde locale `SondePanneauDepart` (KR-187, KR-184 : jamais le vrai composant) |

**Propriété exclusive** : aucun fichier n'apparaît deux fois. `specification.json`, `code-knowledge.json`, `CHANGELOG.md`, `features_history.json`, `docs/ROADMAP-BASCULE-IA.md` restent hors lots (étape 4 des Build Steps, tenue par l'intégrateur après fusion) — sinon deux lots les nommeraient.

**Frontière dure** : `src/brain/components/Select.tsx` **n'est nommé par aucun lot**. Si le panneau a besoin de quelque chose que `Select` n'offre pas, le lot 2 s'arrête et le comité re-découpe — il ne rustine pas une primitive `brain/` depuis un lot feature. Idem `features/bascule-editeur/components/**` : **zéro fichier source** de la feature sœur n'est touché — c'est la preuve que le slot `panneaux` d'it1 tient.

**Interfaces (seul point de rendez-vous entre les deux lots)**

- Lot 1 **expose**, signature **inchangée** :
  `localiserEntite(espace: EspaceDeNoms, entite: unknown, index: number): string` — repli `` `${label} n°${index + 1} (sans nom)` ``, importable depuis `'../../../brain'`. `EspaceDeNoms` y est déjà exporté (`brain/index.ts` l.172).
- Lot 2 **consomme** (contrat figé, lu comme une donnée immuable) : `localiserEntite`, `Select`, `Field`, `Card`, `IssueList`, `useOpenDossier`, `useBrain().dossiers.update(id, recette)`, `type Dossier | CorpsDossier`.
- Lot 2 **expose** : `export function PanneauDepart({ dossierId }: PanneauDepartProps): JSX.Element | null` depuis `features/dossier-canon/index.ts`, câblé en racine de composition :
  `panneaux={{ canon: <PanneauCanon dossierId={route.dossierId} />, depart: <PanneauDepart dossierId={route.dossierId} /> }}`.
  Recette d'écriture : `(d) => ({ canon: d.canon, monde: d.monde, charpente: { ...d.charpente, depart: { ...d.charpente.depart, <champ patché> } } })` — trois racines nommées, jamais un spread de `dossier`.

**Pourquoi 2 et pas 3** : le lot 1 fait **une ligne d'export + un test**. Il est petit par construction et ne doit pas être rembourré (généraliser `Select`, promouvoir un hook d'écriture, sortir `nommerEntite`) pour « valoir un agent » — c'est exactement le biais que ce poste doit surveiller. Il existe séparément uniquement parce qu'il touche `brain/` et que le contrat se fige avant la feature.
