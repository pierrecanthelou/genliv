# Tour 1 — Tech Lead — dossier-canon it4

**RISQUE** — Les fixtures. Le cadrage dit qu'elles peuvent rester intouchées : c'est faux dès qu'on déclare une destination. `couverture.test.ts` porte « aucune ligne morte dans DESTINATION_DES_CHAMPS » (L301) — une ligne sans instance dans `dossier-minimal.json` rougit — et son symétrique « toute feuille a une destination » (L293) rougit si on peuple la fixture sans déclarer. Le lot contrat est donc indivisible : types + destinations + fixture + LIBRES, d'un bloc. Le vrai piège est l'inverse : ne toucher ni `destinations.ts` ni la fixture ne fait **rien** rougir — et trois champs de prose entrent alors au dossier sans audience déclarée, que la n° 10 classera par omission.

**OBJECTION** — « probablement 'auteur' » pour les trois : je récuse pour deux. `monde` est « la couche que le modèle lit pour raconter » (`types.ts` L288) ; une description de lieu non injectée n'est lue par personne. `nom` vaut `'auteur'` parce que CLAUDE.md le déclare **interne** — la description est *player-facing* par la même phrase. Seconde objection : la définition ne dit rien de la **suppression** d'un lieu, seul chemin de toute la feature où `statut:'refuse'` est réellement atteignable (retirer le lieu de `charpente.depart`). Dernière itération : non tranché, il n'y aura pas de retrait.

**PROPOSITION** — `dangers?: string`, prose, pas `string[]` : un tableau ajoute un suffixe `[]` au chemin de destination et un second régime d'édition dans la carte, sans gagner une ligne de `tables.ts`. Destinations : description/ambiance → `'ia'`, dangers → `'auteur'` (jumeau prose d'une embuscade, motif d'`evenements[].declencheur_texte`). Lot contrat **mesuré à 6 fichiers, pas 9** : zéro champ requis ⇒ `tables.ts`, `validate.ts`, `amorce.ts` intouchés.

**VERDICT** — recevable sous réserve : les trois destinations tranchées nommément par le comité (la n° 10 lira cette table), et le sort de la suppression écrit dans la définition.

---

## ANNEXE — Découpage en lots

**2 lots, propriété disjointe, exécution séquentielle** (aucun parallélisme réel : un seul lot feature, donc ni worktree ni fusion — même forme qu'it3).

### Lot 1 — `contrat-lieu` · type **contrat** · seul et premier · 6 fichiers

| Fichier | N/R | Contenu |
|---|---|---|
| `src\brain\dossier\types.ts` | R | `interface Lieu extends Entite` + `Monde.lieux: Lieu[]` (L291) |
| `src\brain\index.ts` | R | `export type { Lieu }` |
| `src\brain\dossier\destinations.ts` | R | 3 lignes, après `'monde.lieux[].nom'` (L123) |
| `src\brain\dossier\__fixtures__\dossier-minimal.json` | R | **obligatoire** : les 3 champs sur `lieu.val-cendre` (L80), sinon les 3 lignes sont mortes |
| `src\brain\dossier\__fixtures__\dossier-reference.json` | R | 2 lieux sur 5 portent les 3 champs. Non exigé par un test (`suffisance.test.ts` n'impose que `reference ⊆ minimal`), mais c'est la fixture qui prouve la suffisance narrative |
| `src\brain\dossier\couverture.test.ts` | R | 3 entrées `LIBRES` sous un motif partagé (patron `TEXTE_OPTIONNEL_LIBRE`, L212) : corrompre une prose optionnelle ne fait rien rougir |

**Signature exposée — figée, lue comme donnée immuable par le lot 2 :**

```ts
export interface Lieu extends Entite {
	description?: string
	ambiance?: string
	dangers?: string
}
// Monde.lieux: Lieu[] — covariant : PanneauDepart.tsx L133-139 compile inchangé
```
```ts
'monde.lieux[].description': 'ia',
'monde.lieux[].ambiance': 'ia',
'monde.lieux[].dangers': 'auteur',
```

Vérifiable seul : `jest src/brain` (couverture ×4 assertions, suffisance, roundtrip, validate, DossierService, CloudSync). **Non touchés, vérifiables à l'octet :** `tables.ts`, `validate.ts`, `amorce.ts` (+`amorce.test.ts` L107 `toEqual([{ id: 'lieu.amorce' }])` doit rester vert : rien n'est semé), `identifiers.ts`, `sections.ts` — tout y est déjà.

### Lot 2 — `panneau-lieux` · type **feature** · démarre contrat figé · 5 fichiers (+1 conditionnel)

| Fichier | N/R | Contenu |
|---|---|---|
| `...\src\features\dossier-canon\components\PanneauLieux.tsx` | N | liste `ListRow` à gauche + fiche à droite |
| `...\src\features\dossier-canon\components\FicheLieu.tsx` | N *(conditionnel)* | à créer **seulement** si `PanneauLieux` dépasse ~350 lignes (KR-112). Même propriétaire ⇒ aucune collision |
| `...\src\features\dossier-canon\tests\panneauLieux.test.tsx` | N | |
| `...\src\features\dossier-canon\index.ts` | R | `export { PanneauLieux }` |
| `src\App.tsx` | R | `lieux: <PanneauLieux dossierId={route.dossierId} />` (L33-36) |
| `...\src\features\bascule-editeur\tests\dossierEditorScreen.test.tsx` | R | branche `index === 3` + `SondePanneauLieux` (KR-187 : ce test se réécrit **dans** ce lot) |

**Signature consommée :**

```ts
import { useBrain, useOpenDossier, frapperIdentifiant, localiserEntite,
         ListRow, Field, IconButton, Modal, HIT_TARGET_MIN, type Lieu } from '../../../brain'

export interface PanneauLieuxProps { dossierId: string }
export function PanneauLieux({ dossierId }: PanneauLieuxProps): JSX.Element | null

// écriture — patch étroit, précédent ObjectifsCanon.tsx L132-138 :
dossiers.update(dossierId, (d) => ({ canon: d.canon, monde: { ...d.monde, lieux }, charpente: d.charpente }))
// libellé de ligne : localiserEntite('lieu', lieu, index)
// identifiant neuf : frapperIdentifiant('lieu')   // 2e appelant réel, annoncé au docstring d'it3 (identifiers.ts L97-100)
```

**Contraintes portées par le lot :**
- sélection = `useState<string | null>` local ; le lieu courant est calculé **en ligne** (`lieux.find(...) ?? null`) — jamais un `useEffect` qui resynchronise après suppression ou adoption cloud (KR-013/113).
- brouillon `Record<id, BrouillonLieu>` avec garde d'absence **en lecture et en mutation** (BUG-058).
- suppression : `Modal` de confirmation (action dangereuse) **+** bandeau `role="status"` sur `statut:'refuse'` quand le lieu est celui de `charpente.depart` — chemin **atteignable** ici, contrairement à `ObjectifsCanon`.
- zéro import de `bascule-editeur` (KR-184). `PanneauSection.tsx` reste intouché : sa ligne `lieux` doit demeurer dans le `Record<SectionId, …>` pour `tsc`.

**Hors des deux lots, à vérifier intouchés :** `PanneauCanon.tsx`, `PanneauDepart.tsx`, `ObjectifsCanon.tsx`, `PanneauSection.tsx`, `tables.ts`, `validate.ts`, `amorce.ts`, `sections.ts`, `identifiers.ts`.
