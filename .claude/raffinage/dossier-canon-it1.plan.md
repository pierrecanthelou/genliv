# Plan d'itération — `dossier-canon` · itération `1`

> Statut : `validé` (2026-08-10)
> Produit par : pm-produit · tech-lead · ux-designer · qa — le 2026-08-10
> Composition : `4 rôles` — motif : formulaire d'édition sur un schéma déjà défini, aucun contact avec les prompts, le moteur, la mémoire de session ou le mode jeu — `narratif-ia` n'est pas convoqué (dossier-canon, n°3, n'est pas dans la liste n°1/4/7/8+Temps 2 de `docs/ROADMAP-BASCULE-IA.md` § 4).
> Exécution : `séquentielle` (2 lots — lot 1 `contrat` seul et en premier, puis lot 2)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur réécrit le canon de son histoire — synopsis MJ, accroche joueur, ton, interdits de ton — dans un formulaire qui remplace l'état vide de la section Canon. » |
| **Tranche** | `PanneauCanon` (formulaire, brouillon local) → `DossierEditorScreen` (slot d'injection `panneaux`, précédent `LibraryScreen.importEntry`) → `DossierService.update()` (premier chemin d'écriture réel : `get` → recette → recompose enveloppe → `validateDossier` → persist-ou-refuse → `dossier:updated`) → `PersistenceService`/`CloudSyncService` |
| **Lots** | 2 lots · dont `contrat` : oui (lot 1, seul et en premier) |
| **Hors périmètre** | Départ, Objectifs des camps, Lieux (it2/it3/it4) · tout `…_expr` · `TargetPicker` générique · badge de complétion · toute validation au-delà de refusé/écrit · poignée de glisser sur les interdits de ton |
| **Reporté** | promotion de `Field.maxLength`/`showCounter` — différée tant qu'un 2e appelant réel n'existe pas (voir §8, désaccord 2) |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur ouvre un dossier, sélectionne la section Canon et y trouve un vrai formulaire (et non plus l'état vide générique) : quatre champs — synopsis MJ, accroche joueur, ton, liste des interdits de ton — dont la modification, au blur, est validée puis persistée par `DossierService.update()`, le premier chemin d'écriture réel du dossier. Un patch qui viderait un champ obligatoire est refusé sans rien écrire, message à l'écran, le texte tapé reste affiché. Un synopsis ou une accroche dépassant `BUDGET_MOTS_CANON` (600 mots) est persisté quand même, avec un avertissement visible au compteur. Les sections Départ et Lieux, bien que `featureNum: 3` dans la table de `bascule-editeur`, ne sont **pas** construites ici : elles gardent leur état vide actuel jusqu'à leurs propres itérations (2 et 4).

## 2 — Hors périmètre

- Départ, Objectifs des camps, Lieux — chacun sa propre itération (2, 3, 4). Le panneau `depart` et le panneau `lieux` restent strictement inchangés par ce lot (§8, désaccord PM tour1).
- Tout `…_expr` — aucun champ de cette itération n'est une condition structurée.
- `TargetPicker` générique — n'a aucun appelant dans cette itération (Départ.lieu_id est it2).
- Badge de complétion coloré — dépend du linter n°7, non livré (hérité de bascule-editeur).
- Poignée de glisser / réordonnancement des interdits de ton — aucun besoin exprimé, `interdits_ton` n'a pas d'ordre sémantique.
- `Field.maxLength`/`showCounter` en tant que props génériques de la primitive — reporté (§8, désaccord 2) : le compteur est rendu par `PanneauCanon` lui-même en it1.
- Toute modification de `PanneauSection.tsx` / `PANNEAU_PAR_SECTION` (bascule-editeur) — la table à 10 entrées reste intacte, le remplacement se fait par un slot d'injection au-dessus.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Mécanisme d'injection** (précédent : `ImportDossierButton` → `LibraryScreen.importEntry`, jamais un import direct entre features) :

```ts
// src/features/bascule-editeur/components/DossierEditorScreen.tsx
export interface DossierEditorScreenProps {
	dossierId: string
	/**
	 * Panneaux d'édition RÉELS, injectés par la racine de composition — jamais
	 * importés depuis une autre feature. Une section absente de la table retombe
	 * sur l'état vide `PanneauSection`.
	 */
	panneaux?: Partial<Record<SectionId, ReactNode>>
}
```
Corps : `{panneaux?.[selectedId] ?? <PanneauSection sectionId={selectedId} />}`. `PanneauSection.tsx` et `PANNEAU_PAR_SECTION` : zéro changement.

```tsx
// src/App.tsx
<DossierEditorScreen
	dossierId={route.dossierId}
	panneaux={{ canon: <PanneauCanon dossierId={route.dossierId} /> }}
/>
```

`PanneauCanon` prend `dossierId` (pas `dossier`) et lit `useOpenDossier(dossierId)` lui-même — zéro état remonté depuis `DossierEditorScreen`. Rend `null` si le dossier est absent (l'écran parent affiche déjà « Dossier introuvable. »).

**Brouillon local (résout le désaccord refus/revert, §8 désaccord 1)** : `PanneauCanon` tient un unique état `{synopsis_mj, accroche_joueur, ton, interdits_ton}`, **seedé une fois** depuis `dossier.canon` à l'ouverture (pas de `useEffect` de resynchronisation — KR-013/113), **jamais réinitialisé automatiquement**, y compris après un refus ou un `dossier:updated` du même dossier (même garde que `useOpenDossier` applique déjà contre un écho de réconciliation cloud pendant une frappe). Les 3 champs de prose committent (appellent `update()` avec le brouillon complet des 4 champs) à leur `blur` respectif ; `interdits_ton` committe immédiatement à l'ajout ou la suppression d'une ligne. Ce n'est pas une seconde source de vérité au sens KR-013 (qui vise un état DÉRIVÉ recopié en silence) : c'est un brouillon d'édition, semé une fois, jamais miroir.

**Recette d'écriture, idiome prescrit** (trois racines nommées, jamais un spread de `dossier`) :
```ts
dossiers.update(dossierId, (d) => ({
	canon: { ...d.canon, mj: { synopsis_mj }, partage: { accroche_joueur }, ton, interdits_ton },
	monde: d.monde,
	charpente: d.charpente,
}))
```

**La Card Canon — quatre champs, dans cet ordre :**

| # | Composant | `label` | `hint` | `placeholder` |
|---|---|---|---|---|
| 1 | `Field` multiline (rows 6) + compteur | `SYNOPSIS MJ` | `interne — la vérité complète` | « Rédigez ici la vérité complète de l'histoire, y compris ce que le joueur ignore encore : qui est le Gardien du Gouffre, et pourquoi il a scellé la Clé d'Aldûr. » |
| 2 | `Field` multiline (rows 4) + compteur | `ACCROCHE JOUEUR` | `lue par le joueur` | « Une brume froide s'accroche aux ruines de Val-Cendre. On raconte qu'un sceau y retient quelque chose que personne n'a jamais vu revenir. » |
| 3 | `Field` multiline (rows 2), sans compteur | `TON` | `interne — consigne injectée au modèle` | « Grave, laconique, sans ironie. » |
| 4 | liste `INTERDITS DE TON` | titre autoportant (style `label` de `Field`) | `interne — consignes injectées au modèle` | par ligne : « Pas d'anachronismes modernes. » |

Titre du bloc 4 : `<span>` reprenant le style `label` de `Field` (`font-family: var(--font-mono); font-size: var(--fs-eyebrow); color: var(--text-label); letter-spacing: var(--track-eyebrow)`), texte exact `INTERDITS DE TON`, suivi de `<span style={{ color: 'var(--ink-6)' }}> — interne, consignes injectées au modèle</span>`.

Chaque interdit : `Field` sans `label` visible, `ariaLabel="Interdit de ton n°{index+1}"`, `placeholder="Pas d'anachronismes modernes."`, ligne avec `IconButton` (`label="Retirer l'interdit n°{index+1}"`, `tone="danger"`, contenu `✕`), `gap: var(--space-3)`. Ligne finale, **toujours présente** : bouton pleine largeur `+ Ajouter un interdit…`, style repris d'`ImportDossierButton`/`NewDossierButton` : `border: 1.5px dashed var(--accent)`, `border-radius: var(--r-md)`, `color: var(--accent)`, `background: var(--accent-bg)`, `min-height: var(--hit-target)`, `padding: 7px 10px`. Liste vide = seule cette ligne s'affiche (état calme, `canon.interdits_ton` n'exige pas d'être non-vide).

**Compteur de mots (rendu par `PanneauCanon`, PAS par `Field` — §8 désaccord 2)** — un bloc sous chaque `textarea` de synopsis/accroche :
```tsx
<p data-etat={n >= BUDGET_MOTS_CANON * 0.9 ? 'avertissement' : 'normal'}>
	{n}/{BUDGET_MOTS_CANON} mots
</p>
```
`n = compterMots(valeur)` — `compterMots` importé de `brain/dossier/validate.ts` (exporté par le lot 1), jamais réimplémenté. Style : `text-align: right; font-family: var(--font-mono); font-size: var(--fs-meta); margin-top: var(--space-2)` ; couleur dérivée de `data-etat` en CSS (`--text-faint` / `--bad`) — jamais de bordure/fond sur le `textarea`. Seuil pour 600 mots = 540. Aucun `role` ARIA sur ce bloc (§8, désaccord 3) : `data-etat` est l'ancrage de test.

*Caveat à écrire en commentaire au site du compteur (tech-lead, tour 2)* : `BUDGETS_DE_MOTS` (`tables.ts`) porte sur les CONTENEURS `canon.mj`/`canon.partage` et somme toutes leurs chaînes ; le compteur du panneau ne compte QUE le brouillon du champ affiché. Les deux coïncident aujourd'hui parce que chacun de ces objets ne contient qu'une seule chaîne — par accident, pas par construction. Le premier champ ajouté à `canon.mj` ou `canon.partage` (aucune feature planifiée ne le fait) ferait diverger le compteur de l'avertissement réel : à surveiller, pas à corriger maintenant.

**`MARQUEUR_A_ECRIRE` à l'ouverture** : aucun traitement visuel spécial. Les champs affichent `AMORCE.synopsis_mj`/`accroche_joueur`/`ton` comme valeur normale (`--text-body`, pas de teinte ni d'icône) — les chevrons (`⟨à écrire⟩`) sont déjà le signal, improbables en prose rédigée ; une couleur créerait une 3e signification chromatique dans un système qui n'en réserve que deux (réussite/échec de jet).

**Refus vs avertissement — comportement final arbitré** :
- **Refus** (`statut:'refuse'`) : brouillon intact (aucun revert), focus reste sur le champ actif. Bandeau sous les 4 champs, `role="status"` : eyebrow mono `« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »` (`--bad`) suivi d'`IssueList` (promu `brain/components/`) rendant chaque `errors[]`. Seule anomalie bloquante atteignable en it1 : `champ-vide` sur `synopsis_mj`/`accroche_joueur`/`ton` — message déjà fixé par le validateur (`tables.ts:85-87`).
- **Avertissement seul** (`statut:'ecrit'`, `warnings` non vide — seul cas atteignable : `texte-trop-long`) : le patch EST persisté, aucun bandeau, aucune `IssueList`. Seul signal : le compteur du champ concerné passe `data-etat="avertissement"`.

**Registre de langue** : `ACCROCHE JOUEUR` est le seul champ JOUEUR (fiction, exception actée par dossier-format : « sous canon, mj/partage porte déjà la distinction, pas besoin du suffixe `_joueur` ») ; les trois autres sont AUTEUR/MJ.

**Tokens** (tous existants, aucun ajout) : `--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-meta`, `--fs-body`, `--track-eyebrow`, `--text-label`, `--text-body`, `--text-faint`, `--text-muted`, `--bad`, `--accent`, `--accent-bg`, `--border-field`, `--border-card`, `--surface-card`, `--paper-1`, `--r-md`, `--r-xl`, `--space-2/3/4/5/6/8`, `--hit-target`, `--lh-body`, `--ink-6`.

*(Écrit par l'UX, révisé par l'arbitrage du §8. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `DossierService.update` | service | expose | `update(id: string, recette: (dossier: Dossier) => CorpsDossier): EcritureDossier` — voir §5 lot 1 pour l'implémentation exacte |
| `CorpsDossier` / `EcritureDossier` | type | expose | `CorpsDossier = Pick<Dossier,'canon'\|'monde'\|'charpente'>` ; `EcritureDossier = {statut:'absent'} \| {statut:'refuse';errors:DossierIssue[];warnings:DossierIssue[]} \| {statut:'ecrit';dossier:Dossier;warnings:DossierIssue[]}` |
| `IssueList` | composant | expose (déplacé) | `src/brain/components/IssueList.tsx` (N) — déplacement à l'identique depuis `src/features/dossier-format/components/IssueList.tsx` (D), zéro changement de rendu |
| `compterMots` | fonction | expose (exportée) | `src/brain/dossier/validate.ts` — passe de privée à exportée, aucune autre modification |
| `DossierEditorScreenProps.panneaux` | prop | expose | `Partial<Record<SectionId, ReactNode>>`, optionnelle — voir §3 |
| `PanneauCanon` | composant | expose | `src/features/dossier-canon/components/PanneauCanon.tsx` — `{ dossierId: string }` |
| `dossier:updated` | événement | émet (2e émetteur) | déjà défini par dossier-format ; `update()` en devient le premier émetteur côté édition |
| `brain/index.ts`, `brain/components/index.ts` | barrel | R | ajout des exports `CorpsDossier`, `EcritureDossier`, `IssueList`/`IssueListProps`, `compterMots` |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier. Légende : (N) nouveau · (R) modifié · (D) supprimé.

### Lot 1 — `contrat-update-dossier` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : `brain/` gagne le premier chemin d'écriture du dossier (`DossierService.update`), et deux primitives promues à un 2e appelant réel (`IssueList`, `compterMots`).
- **Fichiers** :
  - `src/brain/DossierService.ts` (R)
  - `src/brain/DossierService.test.ts` (R)
  - `src/brain/EventBus.ts` (R — docstring seule : `dossier:updated` gagne un second émetteur)
  - `src/brain/hooks.ts` (R — docstring l. 41-52 seule, zéro code)
  - `src/brain/dossier/validate.ts` (R — `compterMots` exportée, rien d'autre)
  - `src/brain/components/IssueList.tsx` (N — déplacement à l'identique)
  - `src/brain/components/IssueList.test.tsx` (N — déplacement à l'identique)
  - `src/features/dossier-format/components/IssueList.tsx` (D)
  - `src/features/dossier-format/components/ImportDossierDialog.tsx` (R — ligne d'import seule, repointée sur `brain/`)
  - `src/brain/components/index.ts` (R)
  - `src/brain/index.ts` (R)
- **Expose / consomme** : signatures du §4.
- **Critères couverts** : #1, #3, #4, #6, #8

### Lot 2 — `formulaire-canon` *(contrat figé)*
- **Ouvrier** : `dev-lot`
- **But** : le formulaire Canon (4 champs, brouillon local, compteurs, bandeau de refus) remplace l'état vide de la section `canon` ; `DossierEditorScreen` gagne le slot d'injection ; `App.tsx` câble `PanneauCanon`.
- **Fichiers** :
  - `src/features/dossier-canon/index.ts` (N)
  - `src/features/dossier-canon/components/PanneauCanon.tsx` (N)
  - `src/features/dossier-canon/tests/panneauCanon.test.tsx` (N)
  - `src/App.tsx` (R)
  - `src/features/bascule-editeur/components/DossierEditorScreen.tsx` (R)
  - `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` (R — lignes 77 et 172-189, index 0 = Canon uniquement)
  - `.eslintrc.cjs` (R — `FEATURE_DIRS += 'dossier-canon'`)
- **Expose / consomme** : consomme `update`, `CorpsDossier`/`EcritureDossier`, `IssueList`, `compterMots`, `panneaux` (lot 1 + le slot introduit par ce lot lui-même)
- **Critères couverts** : #1, #2, #3, #4, #5, #7, #8

*(2 lots. Aucun 3e lot : le tech-lead l'a mesuré en tour 1 annexe 4 — « câblage » sans « formulaire » n'a rien à injecter, l'inverse n'est monté par personne ; aucun des deux ne passerait seul la porte qualité.)*

## 6 — Critères d'acceptation

1. **Étant donné** un dossier ouvert sur la section Canon, **quand** l'auteur modifie le synopsis MJ, l'accroche joueur ou le ton et quitte le champ (`blur`), **alors** `DossierService.update()` persiste le nouveau canon et une réouverture du panneau relit la valeur persistée — *niveau : composant + contrat* — *lot 1+2*
2. **Étant donné** un ajout ou un retrait d'interdit de ton, **quand** l'action est confirmée, **alors** `canon.interdits_ton` est persisté immédiatement, sans attendre un `blur` — *niveau : composant* — *lot 2*
3. **Étant donné** un patch qui viderait `synopsis_mj`/`accroche_joueur`/`ton`, **quand** l'auteur le soumet (blur sur champ vide), **alors** rien n'est persisté (`{statut:'refuse'}`), le champ affiche EXACTEMENT ce que l'auteur a tapé (aucun revert), et un bandeau `role="status"` + `IssueList` nomment l'anomalie — *niveau : composant + contrat* — *KR-183* — *lot 1+2*
4. **Étant donné** un synopsis ou une accroche joueur dont le nombre de mots franchit 90 % de `BUDGET_MOTS_CANON` (600), **quand** il est enregistré, **alors** l'écriture n'est JAMAIS bloquée par ce seuil (testé à 600 mots pile : `data-etat` absent/`"normal"` ; à 601 mots : `{statut:'ecrit', warnings:[...]}` persisté quand même, `data-etat="avertissement"` sur le compteur du champ) — *niveau : composant (deux bornes) + contrat* — *KR-183/KR-165* — *lot 1+2*
5. **Étant donné** un dossier fraîchement créé, **quand** l'auteur ouvre la section Canon, **alors** les champs de prose affichent `MARQUEUR_A_ECRIRE` comme valeur réelle, sans traitement visuel distinct — *niveau : composant* — *KR-178* — *lot 2*
6. **Étant donné** `DossierService.update()`, **quand** la recette renvoie des clés hors `CorpsDossier` ou tente de modifier `titre`/`id`/`schema`/`createdAt`, **alors** l'enveloppe recomposée les ignore et `updatedAt` est frappé par le service seul — *niveau : unitaire* — *KR-183* — *lot 1*
7. **Étant donné** la section Canon sélectionnée dans `DossierEditorScreen`, **quand** l'écran se rend, **alors** il affiche `PanneauCanon` (via le slot `panneaux`) et non plus l'état vide générique ; les sections `depart` et `lieux` continuent d'afficher leur état vide inchangé — *niveau : composant* — *KR-187* — *lot 2*
8. **Étant donné** le nouveau code, **quand** `npm run lint` et `tsc --noEmit` tournent, **alors** zéro erreur : aucun import direct entre `dossier-canon` et `bascule-editeur` (ESLint `no-restricted-imports`, règle existante), `FEATURE_DIRS` contient `dossier-canon`, `dossier-format` compile toujours après le déplacement d'`IssueList` — *niveau : contrat (linter+tsc)* — *KR-184* — *lot 1+2*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `DossierService.test.ts` — « update: dossier absent → statut absent, rien persisté » | `update('inconnu', recette)` ⇒ `{statut:'absent'}` ; `persistence.set` non rappelé ; `recette` jamais invoquée (spy) | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: candidat invalide → refuse, rien persisté » | recette posant `canon.mj.synopsis_mj=''` ⇒ `{statut:'refuse', errors:[...]}` ; `get(id)` après l'appel deep-equal à l'ancien dossier ; `dossier:updated` jamais émis | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: écriture propre → ecrit, warnings vides, dossier:updated émis » | recette posant `ton` valide ⇒ `{statut:'ecrit', warnings:[]}` ; `get(id).canon.ton` reflète le nouveau texte ; `events.emit('dossier:updated',{dossierId})` appelé APRÈS `persistence.set` | unitaire+contrat | KR-183/KR-004 | 1 |
| `DossierService.test.ts` — « update: écriture avec avertissement → ecrit, warnings non vide, PERSISTE quand même » | `synopsis_mj` à 601 mots ⇒ `{statut:'ecrit', warnings:[{code:'texte-trop-long',...}]}` ; `get(id)` reflète le nouveau texte | unitaire | KR-183/KR-165 | 1 |
| `DossierService.test.ts` — « update: titre/id/createdAt hors CorpsDossier, updatedAt jamais fixé par l'appelant » | recette qui tente `{...corps, titre:'hack', updatedAt:'2000-01-01'} as any` ⇒ dossier écrit garde l'ancien `titre`, `updatedAt` = horloge du service (mockée) | unitaire | KR-183 | 1 |
| `DossierService.test.ts` — « update: deepFreeze reste à site d'appel unique » | grep source `DossierService.ts` : aucune occurrence de `Object.freeze`/`deepFreeze` hors de l'import déjà utilisé par `validateDossier` | contrat (grep) | KR-166 | 1 |
| `DossierService.test.ts` — « update: Object.isFrozen sur le dossier retourné » | `resultat.dossier` gelé en profondeur (c'est le clone du validateur qui est persisté) | unitaire | KR-166 | 1 |
| `validate.test.ts` — « compterMots: chaîne vide → 0, accord avec le seuil d'avertissement » | `compterMots('') === 0` ; un texte à 601 mots (compté par `compterMots`) déclenche bien `texte-trop-long` | unitaire | — | 1 |
| `IssueList.test.tsx` (déplacé) — « rend un DossierIssue[], un message par ligne » | liste de 2 `DossierIssue` fixture → 2 lignes, texte = `issue.message` ; suite préexistante d'`ImportDossierDialog.test.tsx` reste verte SANS modification (preuve du déplacement à l'identique) | composant | — | 1 |
| `panneauCanon.test.tsx` — « rendu initial: les 4 champs portent MARQUEUR_A_ECRIRE comme valeur réelle » | `getByRole('textbox',{name:/synopsis/i})` etc. ont pour `value` un texte commençant par `MARQUEUR_A_ECRIRE` | composant | KR-178 | 2 |
| `panneauCanon.test.tsx` — « sauvegarde d'un champ au blur persiste et survit à une relecture » | saisir puis blur le champ ton → `DossierService.get(id).canon.ton` = nouvelle valeur ; remonter le panneau sur le même `dossierId` → affiche la valeur persistée ; `update` appelé UNE SEULE FOIS pour N frappes + 1 blur | composant+contrat | KR-183 | 2 |
| `panneauCanon.test.tsx` — « grep KR-013/113: aucun useEffect de resynchronisation du brouillon » | lecture source de `PanneauCanon.tsx` : le brouillon est seedé une fois (`useState(() => ...)` ou équivalent), aucun `useEffect` ne recopie `dossier.canon` vers l'état local après le montage | contrat (grep) | KR-013/113 | 2 |
| `panneauCanon.test.tsx` — « ajouter un interdit de ton l'ajoute à la liste persistée, sans attendre un blur » | affordance « + Ajouter un interdit… » (liste vide au départ) → `canon.interdits_ton` gagne l'entrée immédiatement | composant | — | 2 |
| `panneauCanon.test.tsx` — « supprimer un interdit de ton le retire de la liste persistée » | clic suppression sur une ligne existante → `canon.interdits_ton` perd l'entrée | composant | — | 2 |
| `panneauCanon.test.tsx` — « synopsis à 600 mots pile: data-etat absent ou normal » | valeur exactement `BUDGET_MOTS_CANON` mots, blur → le bloc compteur n'a pas `data-etat="avertissement"` | composant (borne) | KR-165 | 2 |
| `panneauCanon.test.tsx` — « synopsis à 601 mots: data-etat avertissement, champ persisté » | 601 mots, blur → `data-etat="avertissement"` sur le compteur ; `DossierService.get(id)` reflète le nouveau texte (non bloqué) | composant (borne) | KR-183/KR-165 | 2 |
| `panneauCanon.test.tsx` — « synopsis vidé puis blur: refus, aucun revert, bandeau affiché » | effacer le champ, blur → `DossierService.get(id).canon.mj.synopsis_mj` INCHANGÉ (ancien texte) ; le CHAMP affiche `''` (pas de revert) ; `getByRole('status')` contient `« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »` ; `IssueList` rend le message du validateur pour `canon.mj.synopsis_mj` | composant | KR-183 | 2 |
| `dossierEditorScreen.test.tsx` — « rendu de base: la section Canon affiche le panneau réel » (réécrit) | remplace l'assertion `texteEtatVide(0)` (ligne 77) par `getByRole('textbox',{name:/synopsis/i})` avec valeur `MARQUEUR_A_ECRIRE` ; `queryByText(texteEtatVide(0))` devient `null` | composant | KR-187 | 2 |
| `dossierEditorScreen.test.tsx` — « selection d'une section: index 0 rend PanneauCanon, indices 1-9 inchangés » (réécrit) | boucle paramétrée corrigée : `index===0` ⇒ assertion panneau réel ; `index!==0` (dont `depart`=1 et `lieux`=3) ⇒ `texteEtatVide(index)` conservé tel quel | composant | KR-187 | 2 |
| `featureDirs.test.ts` (dossier-format, existant) — reste vert | `readdirSync('src/features')` ⊆ `FEATURE_DIRS`, `dossier-canon` inclus | contrat | — | 2 |
| `npm run lint` (règle ESLint `no-restricted-imports` existante, pas un test neuf) — « aucun import direct dossier-canon ↔ bascule-editeur » | zéro erreur sur les fichiers des 2 lots ; la règle est déjà en place pour toutes les features (KR-011/111-style), aucune configuration nouvelle | contrat (lint) | KR-184 | 1+2 |

**Cas limites explicitement couverts** : liste `interdits_ton` vide (état calme, jamais un vide muet) · synopsis à 600 mots (borne, pas d'avertissement) · 601 mots (avertissement, non bloquant) · synopsis vidé en cours d'édition (refus explicite au blur, texte tapé préservé, jamais un no-op muet) · recette qui tente d'altérer l'enveloppe (`titre`/`updatedAt` ignorés).

**Non vérifiable en l'état** : aucune — les 8 critères sont couverts par jest/RTL ou par grep de contrat, aucun n'attend un instrument absent.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | Tech Lead (tour 1) vs UX/QA (tour 1→2) | Refus d'`update()` : ramener le champ à la valeur persistée (revert), ou garder ce que l'auteur a tapé ? | `RETENU` (garder, aucun revert) | Le tech-lead a retiré sa proposition en tour 2 après que l'UX a précisé le modèle de brouillon local (semé une fois, jamais resynchronisé — même garde que `useOpenDossier` contre un écho cloud) : la divergence écran/dossier devient explicite (bandeau) au lieu d'être silencieuse, ce qui était le risque réel du tech-lead. L'UX a ajouté un second argument non contesté : un revert global effacerait aussi un AUTRE champ valide corrigé dans la même session. |
| 2 | UX (tour 1→2) vs Tech Lead (tour 2) | Le compteur de mots devient-il une extension générique de `Field` (`maxLength`/`showCounter`), ou reste-t-il local à `PanneauCanon` ? | `RETENU` (local à `PanneauCanon`) | Le tech-lead applique la même règle qui vient de justifier la promotion d'`IssueList` dans l'autre sens : un seul appelant réel cette itération, et aucune des 3 itérations suivantes de cette feature (Départ, Objectifs, Lieux) ne réutilise ce compteur — `BUDGET_MOTS_CANON` ne couvre que `canon.mj`/`canon.partage`. Promouvoir une primitive `brain/` sans second appelant est la dette que ce dépôt refuse systématiquement (précédent `ListRow`, `IssueList` lui-même). `compterMots`, la seule partie réellement partagée, EST exportée. Non contesté par l'UX en tour 2 (elle maintient sa préférence mais ne durcit pas en veto — hors de son domaine de veto, qui est le design visuel, pas l'architecture des primitives). |
| 3 | UX (tour 2) vs Tech Lead/QA (tour 2) | `role="status"` sur le compteur de mots (en plus du bandeau de refus), ou uniquement sur le bandeau ? | `RETENU` (uniquement le bandeau) | Le tech-lead et la QA convergent indépendamment : la QA avait déjà retiré sa demande initiale de `role="status"` universel au profit d'un attribut `data-etat` non-ARIA ; le tech-lead formalise la règle (« un sélecteur stable par état, jamais deux régions concurrentes qui bavarderaient à chaque frappe »). Aucune exigence d'accessibilité n'est engagée (roadmap § 6, hors cadre) : c'est un choix de testabilité, où 2 rôles sur 3 s'accordent contre 1, et le rendu visuel est strictement identique dans les deux options — l'UX ne perd rien en pratique. |
| 4 | PM (tour 1) vs UX/QA (tour 1) | `BUDGET_MOTS_CANON` (compteur de mots) : dans le périmètre d'it1, ou différé en polish ? | `RETENU` (dans le périmètre) | Le PM a retiré son objection en tour 2, en confrontant sa propre proposition au critère d'acceptation #3 déjà écrit dans `specification.json` (avertissement rendu à l'écran, jamais silencieusement jeté) : différer le compteur rendrait ce critère invérifiable pour TOUTE la feature, puisqu'aucune des 3 autres itérations ne retouche `canon.mj`/`canon.partage`. |
| 5 | UX (tour 1) | `IssueList` (rapport d'erreurs OÙ/QUOI/QUOI-FAIRE) doit être promu de `dossier-format/components/` vers `brain/components/` avant que `dossier-canon` en ait besoin | `RETENU` | Convergence des 4 rôles au tour 2 : `dossier-canon` en est le second consommateur réel (même règle que la promotion de `ListRow` par `bascule-editeur`). Le tech-lead a chiffré le coût réel : 1 fichier déplacé + 1 seul importeur existant à repointer (`ImportDossierDialog.tsx`), zéro changement de comportement, testé par la suite existante restant verte sans modification. |
| 6 | Tech Lead (tour 1) | Le `design_contract` hérité de `dossier-format` affirmait `Field` réutilisable « tel quel, avec `maxLength`/`showCounter` » — faux à la lecture du code | `RETENU` (correction actée) | Vérifié par l'UX (tour 1) : `Field.tsx`, 127 lignes, n'a aucune des deux props aujourd'hui. La mention héritée était une anticipation jamais livrée, pas un contrat existant — corrigée par ce plan (§3, §8 désaccord 2), sans reprocher la spec de feature qui la citait de bonne foi. |

*(Aucun désaccord ne disparaît sans statut. Aucun veto n'a été émis — tous les points ci-dessus sont des objections tranchées en tour 2 par les rôles eux-mêmes ou par convergence majoritaire ; aucun bloc `ESCALADE`.)*

## 9 — Innovation

*(Aucune proposition hors-cadre cette itération.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `tsc --noEmit` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — sans objet (aucun des 4 fichiers mutés touché ; `brain/dossier/` hors périmètre, KR-161)
- [ ] Tests du §7 écrits et passants
- [ ] Critères du §6 cochés un par un
- [ ] Aucun fichier touché hors de la liste de son lot (§5)
- [ ] Suite `ImportDossierDialog.test.tsx` (dossier-format) verte sans modification après le déplacement d'`IssueList`
- [ ] `dossierEditorScreen.test.tsx` : les 9 assertions d'état vide restantes (indices 1-9) inchangées à l'octet
- [ ] `.eslintrc.cjs` : `readdirSync('src/features') ⊆ FEATURE_DIRS` toujours vert, `dossier-canon` inclus
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-canon-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable | « polish différé » du compteur retiré (désaccord #4) ; garde « depart/lieux inchangés » intégrée en §1/§2 |
| Tech Lead | recevable | revert retiré (désaccord #1) ; lot 1 étendu à `IssueList`/`compterMots` (désaccord #5) ; compteur local à `PanneauCanon` maintenu (désaccord #2) |
| UX | recevable | `role="status"` limité au bandeau (désaccord #3, préférence non retenue mais non bloquante — hors de son domaine de veto) ; brouillon local confirmé comme modèle (désaccord #1) |
| QA | recevable | `role="status"` universel retiré au profit de `data-etat` (désaccord #3) ; `IssueList` dans le lot 1 (désaccord #5) ; tests corrigés intégrés au §7 |
