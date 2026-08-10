# Plan d'itération — `bascule-editeur` · itération `3`

> Statut : `validé` (2026-08-09)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-09
> Composition : `4 rôles` — motif : navigation UI pure sur un schéma déjà défini (comptages de tableaux existants) ; aucun contact avec les prompts, le moteur, la mémoire de session ou le mode jeu — `narratif-ia` n'est pas convoqué.
> Exécution : `séquentielle` (2 lots — lot 1 `contrat` seul et en premier, puis lot 2)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur navigue dans son dossier ouvert par une liste de dix sections, chacune affichant son compteur de fiches. » |
| **Tranche** | `DossierEditorScreen` (écran, 2 colonnes) → `SECTIONS`/`ListRow` (registre + composant `brain/`, lus/rendus) → `useOpenDossier` (hook `brain/`, abonné à `dossier:updated`) — lecture seule, aucune écriture nouvelle en persistance cette itération |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | badge de complétion coloré (n°7 `dossier-controles`) · drag/réordonnancement des sections et poignée de `ListRow` (n°5) · écrans d'édition des fiches individuelles par section (n°3 à n°6) · démolition physique de `BookService.ts`/`kinds.ts`/`tree.ts`/`EditorScreen.tsx`/route `'editor'` de `App.tsx` (n°9, KR-181) · repointage réel de `tree-canvas` sur un graphe de relations/indices (n°6, KR-180) · renommer/dupliquer un dossier (déjà hors périmètre it1/it2) |
| **Reporté** | linter `dossier-controles` pour un badge de complétion dynamique (n°7) · câblage réel du drag sur `ListRow`, poignée `⠿` (n°5) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre un dossier et navigue par une liste de dix sections (Canon, Départ, Personnages, Lieux, Objets, Indices, Quêtes, Événements, Conditions, Jalons & fins), chacune affichant un compteur exact de fiches ; cliquer une section affiche à droite un état nommé, honnête sur ce qui existe déjà. `tree-canvas` cesse d'être atteint depuis la composition en production (déjà vrai aujourd'hui, désormais verrouillé par un test) — il reste en sommeil, intact, sur disque.

## 2 — Hors périmètre

- Badge de complétion coloré — dépend du linter n°7 `dossier-controles`, non livré. Le slot `trailing` réserve sa place (voir §3).
- Drag / réordonnancement des sections, poignée `⠿` de `ListRow` — `ListRow` est porté **sans** cette poignée ni aucune prop associée ; la n°5 l'ajoutera avec son vrai câblage.
- Tout écran d'édition de fiche individuelle (Canon, une entité, un jalon...) — n°3 à n°6. Le panneau droit de cette itération n'affiche qu'un état nommé, jamais une fiche.
- `src/EditorScreen.tsx`, la variante `{name:'editor', bookId}` du type `Route`, et `src/App.tsx` : **intouchés à l'octet près**. Leur démolition physique reste n°9 (KR-181) — voir §8, désaccord 1.
- Repointage réel de `tree-canvas` sur un graphe de relations/indices (KR-180) — mesuré dans `src/brain/dossier/types.ts` : les données n'existent pas avant n°4/n°5/n°6.
- Renommer ou dupliquer un dossier — sans propriétaire d'itération, comme avant cette feature.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Layout** : sous `EditorTopBar` (inchangé), la zone `<main>` de `DossierEditorScreen` passe de « état vide centré unique » à deux colonnes — nav gauche largeur fixe `280px` (bordure droite `1px solid var(--border-subtle)`, `overflow-y: auto`), panneau droit `flex: 1`.

**Nav — 10 `ListRow` (brain/components, à porter), dans l'ordre exact du schéma Dossier :**

| # | Section | `titre` (casse phrase) | `subtitle` (clé technique, mono faible) | Glyphe (panneau) | Feature réelle (texte état vide) |
|---|---|---|---|---|---|
| 1 | Canon | Canon | `canon` | ✎ | n°3 `dossier-canon` |
| 2 | Départ | Départ | `charpente.depart` | ✎ | n°3 `dossier-canon` |
| 3 | Personnages | Personnages | `monde.personnages` | ❏ | n°4 `dossier-fiches` |
| 4 | Lieux | Lieux | `monde.lieux` | ❏ | n°3 `dossier-canon` |
| 5 | Objets | Objets | `monde.objets` | ❏ | n°5 `dossier-objets` |
| 6 | Indices | Indices | `monde.indices` | ❏ | n°6 `dossier-registres` |
| 7 | Quêtes | Quêtes | `monde.quetes` | ❏ | n°6 `dossier-registres` |
| 8 | Événements | Événements | `monde.evenements` | ❏ | n°6 `dossier-registres` |
| 9 | Conditions | Conditions | `monde.conditions` | ⊘ | n°6 `dossier-registres` |
| 10 | Jalons & fins | Jalons & fins | `charpente.jalons · charpente.fins` | ⊘ | n°6 `dossier-registres` |

Glyphes (`aria-hidden`, `color: var(--text-faint)`) : `✎` blocs de prose · `❏` listes d'entités · `⊘` Conditions/Jalons & fins (ni prose ni liste libre).

**`trailing` = `descripteur.compte(dossier)` — un `Badge tone="muted"`, un TEXTE, jamais un nombre nu :**
- Canon, Départ → **`« — »`** constant (slot réservé — ni l'un ni l'autre n'est une collection de fiches ; « configuré » est retiré, voir §8 désaccord 4).
- Personnages/Lieux/Objets/Indices/Quêtes/Événements/Conditions → `« {n} fiche(s) »` (accord singulier/pluriel).
- Jalons & fins → `« {n} jalon(s) · {n} fin(s) »`.
- **Aucun** `Badge tone="good"`/`"bad"`/`"accent"` nulle part sur ce `trailing` — réservé au futur linter n°7, même `Badge`, seul le `tone` variera plus tard.

**État vide du panneau droit (sélection d'une section)** — patron dashed déjà utilisé par `LibraryScreen`/`DossierEditorScreen` (`border: 1.5px dashed var(--border-field)`, `background: var(--paper-1)`, `border-radius: var(--r-xl)`, centré) :

Texte exact, **identique pour les 10 sections**, jamais le gabarit « Aucun·e {section}. » (faux pour Canon/Départ/Lieux dès la création — `DossierService.create()` sème déjà du contenu dans ces trois) :

> **« {Section} — l'écran d'édition arrive avec la feature n°{X}. »**

avec `{Section}` = le `titre` de la ligne et `{X}` = la colonne « Feature réelle » du tableau ci-dessus (ex. « Canon — l'écran d'édition arrive avec la feature n°3. », « Personnages — l'écran d'édition arrive avec la feature n°4. »). Glyphe de la section (`font-size: var(--fs-h1)`, `color: var(--text-faint)`) au-dessus du texte (`color: var(--text-muted)`, `line-height: var(--lh-body)`). Aucun bouton « + Ajouter » désactivé.

**`ListRow` (brain/components, à porter depuis `design_handoff_gamebook_editor/components/surfaces/ListRow.jsx`) — interface RÉDUITE, sans la poignée de glisser source (résidu d'un usage objet/butin à drag, sans sens pour 10 lignes fixes) :**
```ts
export interface ListRowProps {
	title: string
	subtitle?: ReactNode
	leading?: ReactNode
	trailing?: ReactNode
	selected?: boolean   // défaut false
	onSelect: () => void // REQUIS — aucune variante non interactive n'a d'appelant cette itération
}
```
Rendu : `<button type="button">` racine, `min-height: 44px`, `aria-current={selected ? 'true' : undefined}` (nav de sélection, pas une bascule). États : défaut (`border: 1px solid var(--border-subtle)`, `background: var(--surface-card)`), sélectionné (`border: 1.5px solid var(--accent)`, `background: var(--accent-bg-2)`) — pas de règle `:hover` distincte (aucune dans la source). Un commentaire dans `ListRow.tsx` nomme la feature n°5 comme propriétaire futur de la poignée `⠿` et de son câblage — pas de prop `draggable` posée par avance (voir §8, désaccord 3).

**Registre de langue** : toute cette surface (nav, sous-titres, états vides) est AUTEUR — aucun texte `_joueur`.

**Clavier (ergonomie de rédaction, pas accessibilité — décision projet actée)** : Tab/Shift+Tab parcourt les 10 `ListRow` dans l'ordre du tableau ; Entrée/Espace sur une ligne focalisée la sélectionne comme un clic ; le focus reste sur la ligne activée (le panneau droit ne contient aucun élément focalisable cette itération).

**Tokens** (tous confirmés existants dans `src/styles/tokens/`) : `--border-subtle`, `--accent`, `--accent-bg-2`, `--surface-card`, `--r-xl`, `--fs-body`, `--fw-semibold`, `--text-strong`, `--fs-meta`, `--text-faint`, `--lh-snug`, `--paper-1`, `--border-field`, `--text-muted`, `--fs-h1`, `--lh-body`, `--space-3/8/10/12`. Aucune valeur en dur — pas de `--space-11` (l'échelle saute de `--space-10` à `--space-12`).

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `SECTIONS` | registre | expose | `src/brain/dossier/sections.ts` (N) — `SECTIONS: readonly SectionDescripteur[]` (10 entrées, `num` 1..10 strictement croissant) ; `SectionDescripteur = { num: number; id: SectionId; titre: string; cle: string; compte(dossier: Dossier): string }` — `compte()` rend toujours un **texte**, jamais un nombre (voir §3) |
| `ListRow` | composant | expose | `src/brain/components/ListRow.tsx` (N) — signature §3, sans poignée de glisser ni prop `draggable` |
| `useOpenDossier` | hook | expose | `src/brain/hooks.ts` (R) — `useOpenDossier(dossierId: string \| null): Dossier \| null`, jumeau de `useOpenBook` (`useSyncExternalStore`), abonné à `dossier:updated`/`dossier:deleted` — honore le report d'it2 (rafraîchissement live) |
| `Route` | type | **INCHANGÉ** | `src/brain/Router.ts` — zéro modification, y compris commentaire. La variante `{name:'editor', bookId}` reste, propriété n°9 |
| `brain/components/index.ts`, `brain/index.ts` | barrel | R | ajout des exports `ListRow`/`ListRowProps`, `useOpenDossier` — même patron que les 15 exports existants |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot 1 — `contrat-sections-listrow` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `brain/` gagne le registre `SECTIONS` (10 descripteurs, `compte()` textuel), le composant `ListRow` (sans poignée), et le hook `useOpenDossier` (rafraîchissement live sur `dossier:updated`, report d'it2).
- **Fichiers** : `src/brain/dossier/sections.ts` (N) · `src/brain/dossier/sections.test.ts` (N) · `src/brain/components/ListRow.tsx` (N) · `src/brain/components/ListRow.test.tsx` (N) · `src/brain/hooks.ts` (R) · `src/brain/hooks.dossier.test.tsx` (N) · `src/brain/components/index.ts` (R) · `src/brain/index.ts` (R)
- **Expose / consomme** : signatures du §4. `src/brain/Router.ts` **n'est pas touché** (fichier gelé, voir §8 désaccord 1).
- **Critères couverts** : #1, #2, #6

### Lot 2 — `nav-sections-dossier` *(contrat figé)*
- **Ouvrier** : `dev-lot`
- **But** : `DossierEditorScreen` bascule sur le layout 2 colonnes ; nav de 10 `ListRow` consommant `SECTIONS` ; panneau droit affichant l'état nommé par section ; clavier Tab/Entrée-Espace ; verrouillage de la cessation d'appel vers la route `'editor'`.
- **Fichiers** : `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R) · `src/features/bascule-editeur/components/SectionNav.tsx` (N) · `src/features/bascule-editeur/components/PanneauSection.tsx` (N) · `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R) · `src/features/bascule-editeur/tests/demontageArbre.test.ts` (N)
- **Expose / consomme** : consomme `SECTIONS`, `ListRow`, `useOpenDossier` (lot 1)
- **Critères couverts** : #1, #3, #4, #5, #7

*(2 lots. Aucun 3ᵉ lot : il aurait fallu toucher `EditorScreen.tsx`/`App.tsx`, refusé — §8 désaccord 1.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier ouvert, **quand** `DossierEditorScreen` se rend, **alors** la nav affiche les 10 `ListRow` dans l'ordre exact de `SECTIONS`, chaque `trailing` = `descripteur.compte(dossier)` — jamais recalculé localement (grep confirmant l'absence de `.length`/`.filter`/`.reduce` dans le composant de nav hors `sections.ts`) — *niveau : composant + contrat (grep)* — *KR-013* — *lots 1+2*
2. **Étant donné** chaque descripteur de `SECTIONS`, **quand** on appelle `compte(dossier)`, **alors** Canon et Départ rendent `« — »`, les 7 sections-listes rendent `« {n} fiche(s) »` (accord), Jalons & fins rend `« {n} jalon(s) · {n} fin(s) »` — *niveau : unitaire* — *lot 1*
3. **Étant donné** une `ListRow` sélectionnée (clic ou clavier), **quand** le panneau droit se rend, **alors** il affiche, au mot près, `« {Section} — l'écran d'édition arrive avec la feature n°{X}. »` avec le glyphe de sa famille, testé sur un dossier issu de `DossierService.create()` — *niveau : composant* — *lot 2*
4. **Étant donné** la nav au clavier, **quand** l'auteur presse Tab/Shift+Tab, **alors** le focus parcourt les 10 `ListRow` dans l'ordre ; Entrée/Espace sur une ligne focalisée la sélectionne comme un clic — *niveau : composant* — *lot 2*
5. **Étant donné** le rendu des 10 `ListRow`, **quand** on grep le DOM/les props, **alors** aucun `Badge` n'a `tone="good"`/`"bad"`/`"accent"` sur son `trailing` — seulement `tone="muted"` — *niveau : composant (grep de rendu)* — *lot 2*
6. **Étant donné** `DossierEditorScreen` déjà monté, **quand** `dossier:updated` est émis (ex. réconciliation cloud), **alors** `useOpenDossier` répercute le nouveau dossier et les 10 compteurs affichés se mettent à jour sans remontage — *niveau : contrat (hook) + composant* — *lot 1+2* — *report d'it2*
7. **Étant donné** le dépôt à l'issue de l'itération, **quand** on grep `src/` (hors `**/tests/**` et `*.test.ts(x)`) pour un appel `.navigate({ name: 'editor'`, **alors** la liste de contrevenants est vide (déjà vrai aujourd'hui — verrou anti-régression, pas un changement de code) ; `src/App.tsx`, `src/EditorScreen.tsx`, `src/brain/Router.ts` restent inchangés à l'octet (`git diff --stat` vide) ; les 40 tests de `tree-canvas` (`TreeCanvas.test.tsx`=10, `geometry.test.ts`=25, `nodeView.test.ts`=2) et `cloud-sync/ConflictDialog.test.tsx`=3 restent verts, comptés avant/après ; `tree-canvas/specification.json` porte la mention « en sommeil depuis n°2, repointage hérité par n°6 » — *niveau : contrat (grep+diff) + non-régression* — *KR-181* — *lot 2 (grep) + hors-lot (annotation doc, intégrateur, étape 4)*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `sections.test.ts` — « 10 entrées, ordre du schéma » | `SECTIONS.length===10`, `num` 1..10 strictement croissant, `id`/`titre`/`cle` conformes au §3 | unitaire | KR-013 | 1 |
| `sections.test.ts` — « compte() par section, valeurs exactes » | Canon/Départ→`'—'` ; les 7 sections-listes→`'{n} fiche(s)'` sur fixture ; Jalons&fins→`'{n} jalon(s) · {n} fin(s)'` | unitaire | — | 1 |
| `ListRow.test.tsx` — « rendu sans poignée, onSelect requis » | aucun glyphe `⠿` dans le DOM ; clic déclenche `onSelect` | composant | — | 1 |
| `ListRow.test.tsx` — « selected → aria-current + bordure accent » | `aria-current='true'` ssi `selected` | composant | — | 1 |
| `hooks.dossier.test.tsx` — « useOpenDossier répercute dossier:updated » | émettre `dossier:updated` après montage → nouvelle valeur rendue | contrat | — | 1 |
| `dossierEditorScreen.test.tsx` — « nav des 10 sections, ordre + compteurs exacts » | 10 `ListRow` rendues, `trailing` = `compte()` attendu par section | composant | KR-013 | 2 |
| `dossierEditorScreen.test.tsx` — « grep KR-013 : aucun recalcul local » | lecture du composant de nav, absence de `.length`/`.filter`/`.reduce` hors `sections.ts` | contrat (grep) | KR-013 | 2 |
| `dossierEditorScreen.test.tsx` — « sélection → état vide au mot près (10 textes) » | 10 assertions littérales, dossier issu de `create()` | composant | — | 2 |
| `dossierEditorScreen.test.tsx` — « clavier Tab/Shift+Tab + Entrée/Espace » | ordre de focus sur les 10 lignes ; activation clavier == clic | composant | — | 2 |
| `dossierEditorScreen.test.tsx` — « aucun badge de complétion coloré » | grep `tone="good"`/`"bad"` absent sur le `trailing` des 10 `ListRow` | contrat (grep) | — | 2 |
| `demontageArbre.test.ts` — « aucun appel de production vers {name:'editor'} » | marcheur récursif de `src/` (hors `**/tests/**`, `.ts`/`.tsx` seulement), regex `/\.navigate\(\s*\{\s*name:\s*['"]editor['"]/s`, `expect(contrevenants).toEqual([])` | contrat (grep) | KR-181 | 2 |

Cas limites couverts : dossier fraîchement créé (0 personnage/objet/indice, mais Canon/Départ/Lieux déjà peuplés — le cas normal, pas un cas limite déguisé) · départ toujours résolu (`compte()` constant, aucune branche à atteindre) · pluriel/singulier du compteur de fiches.

**Non vérifiable en l'état** — aucune : les 7 critères sont couverts par jest/RTL ou par mesure manuelle consignée en revue (§8 désaccord 9), aucun n'attend un instrument absent.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM/QA (tour 1) vs Tech Lead (tour 1→2) | `EditorScreen.tsx` : vidé de ses imports interdits, ou intouché ? | `RETENU` (intouché) | Le Tech Lead a mesuré (lecture réelle de `TreeCanvas.test.tsx`) que vider **ou** supprimer le fichier met au rouge 10 tests d'intégration de `tree-canvas` (hors périmètre de cette feature), qui montent `<App/>` sur la route `'editor'` et assertent la composition rendue d'`EditorScreen`. PM et QA ont retiré leur proposition en tour 2. Le critère #30 hérité est remplacé par le critère #7 ci-dessus (verrou anti-régression sur l'atteignabilité en production, pas un grep de contenu de fichier). |
| 2 | Tech Lead (tour 1) | Retirer la variante `{name:'editor', bookId}` du type `Route` ? | `REJETÉ` | Option évaluée puis explicitement écartée par son propre auteur : casse `tsc` en production dans `tree-canvas/TreeCanvas.tsx:51` et `cloud-sync/ConflictDialog.tsx:14`, deux features hors périmètre. Veto durci au tour 2 (jamais recommandé activement). |
| 3 | UX (tour 1) vs Tech Lead (tour 1) | Poignée `⠿` de `ListRow` : prop `draggable?` optionnelle, ou omission totale ? | `RETENU` (omission) | L'UX a retiré sa proposition en tour 2 : une prop sans appelant réel cette itération est une branche jamais testée dans un composant `brain/`. La n°5 l'ajoutera avec son vrai câblage (`onReorder`). Un commentaire dans `ListRow.tsx` nomme cette propriété future. |
| 4 | Tech Lead (tour 2) | Réouverture du `resolved_decision` existant « Départ : compteur non numérique (« configuré »/« — ») » en « — constant, pour Canon et Départ » | `RETENU` (réouverture actée) | `charpente.depart.lieu_id` est un `CHAMPS_REQUIS` que `validateDossier` bloque s'il ne résout pas, et `DossierService.get()` re-valide — tout dossier que l'écran peut tenir en main a donc un départ qui résout. La branche « configuré »/pendant est inatteignable depuis cette écran ; l'afficher systématiquement serait un voyant tautologiquement vert. Non contesté par les autres rôles au tour 2. |
| 5 | UX (tour 1) | Le gabarit d'état vide « Aucun·e {section}. » ment pour Canon/Départ/Lieux (déjà peuplées par `DossierService.create()`) | `RETENU` | Texte neutre adopté pour les **10** sections (pas seulement les 3 fautives, pour une seule règle sans exception) : « {Section} — l'écran d'édition arrive avec la feature n°{X}. » — voir §3. |
| 6 | UX (tour 1) | Le cadrage supposait 3 features distinctes pour Canon/Départ/Lieux | `RETENU corrigé` | Vérifié dans `docs/ROADMAP-BASCULE-IA.md` § 2 : les trois pointent vers la même n°3 `dossier-canon`. Table corrigée en §3. |
| 7 | Tech Lead (tour 1) | Ajout de `useOpenDossier` (rafraîchissement live sur `dossier:updated`) au lot contrat, absent du goal brut | `RETENU` | Ce n'est pas une extension de périmètre : `bascule-editeur-it2.plan.md`, fiche de validation, ligne « Reporté », assignait déjà ce rafraîchissement à it3 explicitement. Exécution d'un report déjà assigné, pas une innovation. |
| 8 | QA (tour 1) | Le cadrage citait « ~5 suites » de tests `tree-canvas` | `RETENU corrigé` | Mesuré : 3 suites/40 tests au total en comptant `ConflictDialog.test.tsx` (10+25+2+3) ; seuls les 10 de `TreeCanvas.test.tsx` seraient affectés par une modification d'`EditorScreen.tsx`. Chiffre porté au §7/§10. |
| 9 | QA (tour 2) | `git diff --stat` vide seul est-il une preuve de non-régression suffisante ? | `RETENU` (non, insuffisant seul) | Le lot 1 touche `brain/hooks.ts`/`brain/components/index.ts`/`brain/index.ts`, dans le graphe d'import de `TreeCanvas.tsx` — une régression là ne toucherait aucun des chemins gelés. Un compte de tests figé (40, quatre suites nommées) est ajouté en Définition de fini, en plus du diff vide. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto n'a tenu contre lui-même au tour 2 — pas de bloc `ESCALADE` : le seul veto du Tech Lead a été adopté par tous, pas contesté.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération — supprimé.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés touché ; à confirmer par grep en fin d'itération, pas à supposer)
- [ ] Tests du §7 écrits et passants
- [ ] Critères du §6 cochés un par un
- [ ] `git diff --stat` **vide** sur les 3 chemins gelés : `src/App.tsx`, `src/EditorScreen.tsx`, `src/brain/Router.ts`
- [ ] Compte de tests `tree-canvas`/`cloud-sync` figé et vert avant/après, consigné dans la revue : `TreeCanvas.test.tsx`=10, `geometry.test.ts`=25, `nodeView.test.ts`=2, `ConflictDialog.test.tsx`=3 (40 au total) — **sans aucune modification** de ces 4 fichiers
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `src/features/tree-canvas/specification.json` porte la mention « en sommeil depuis n°2, repointage hérité par n°6 » (hors-lot, étape 4, avant présentation)
- [ ] Dossier de revue écrit : `.claude/raffinage/bascule-editeur-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | proposition « vidé » retirée au profit du veto Tech Lead (désaccord #1), mapping de features corrigé adopté (désaccord #6) |
| Tech Lead | recevable sous réserve | réserves bloquantes : critère #7 réécrit (désaccord #1), `useOpenDossier` livré par le lot 1 (désaccord #7) — les deux sont dans ce plan |
| UX | recevable sous réserve | poignée `draggable` retirée (désaccord #3), gabarit d'état vide corrigé pour les 10 sections (désaccord #5) — les deux intégrés en §3 |
| QA | recevable sous réserve | critère #30 hérité reformulé et observable (désaccord #1), baseline de non-régression corrigée et doublée d'un compte de tests (désaccords #8, #9) — intégrés en §7/§10 |
