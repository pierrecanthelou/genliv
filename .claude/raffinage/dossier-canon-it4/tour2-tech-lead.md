# Tour 2 — Tech Lead — dossier-canon it4

**RISQUE** — Le fait nouveau retire un risque et en découvre un autre. Le refus SSOT ne couvre **que** le lieu référencé ; le lieu non référencé, lui, part avec ses quatre champs de prose et rien ne le retient — aucun undo n'existe dans cette application. Et les référents vont se multiplier (n° 4 personnages, n° 5 objets, n° 6 événements) : toute liste « qui pointe un lieu » écrite **côté feature** sera silencieusement incomplète dans six semaines, tout en ayant l'air d'une garde. C'est le seul vrai danger d'architecture de cette itération.

**OBJECTION** — Deux prémisses à corriger. À l'UX : « 1-2 champs pour un objectif » est faux — `Objectif` porte `nom` + `reussi_si_texte` + `echoue_si_texte`, trois proses, retirées sans confirmation à it3. Le volume ne distingue pas. Au PM : le motif d'it3 est écrit noir sur blanc dans la spec (« aucune référence vivante à `objectif.id` ») — c'est un argument de **référence**, pas de perte de données ; il ne se transporte donc pas à `Lieu`, qui est une cible de lien.

**PROPOSITION** — `Modal` **oui**, sur un motif disjoint du refus. Le refus protège le **document** (intégrité référentielle, SSOT, zéro code neuf, épinglé `validate.test.ts:270`). Le `Modal` protège le **travail de l'auteur** (prose irréversible) et il porte exactement là où le refus ne porte pas : le lieu non référencé. Ensembles complémentaires, pas redondants. Confirmer → tenter → bandeau si refusé. **Aucun pré-vol**, aucun prédicat de feature sur `charpente.depart.lieu_id`.

**VERDICT** — recevable sous réserve. Découpage **inchangé, 2 lots confirmés**. Trois réserves ci-dessous, dont une durcie en veto.

---

## RÉPONSES TOUR 2

**À l'UX (Modal) — accepté, re-motivé.** Ta proposition (2) est la bonne et le fait nouveau la rend gratuite : la tentative passe par `DossierService.update()`, revient `statut:'refuse'` / `reference-pendante`, le bandeau `role="status"` + `IssueList` la rend. Mais ne motive pas le `Modal` par ce cas-là : sur le lieu de départ, le `Modal` est **inutile** (rien ne sera perdu, l'écriture n'aura pas lieu) et ajoute une confirmation avant un refus. Sa juridiction est l'autre moitié : le lieu **non** référencé, où `update()` réussit et où quatre champs disparaissent sans recours. Formulation du corps de la modale : nommer la prose perdue, jamais promettre la suppression.

**Au PM (« contrat livré sans surface d'écriture ») — objection accueillie, risque déjà nul par construction du lot.** Un lot n'est pas une livraison : l'unité de commit est l'**itération** (WORKFLOW, per-feature unit — un PATCH, un stop). Le lot 1 n'a aucun critère d'acceptation observable à lui seul : le compteur `SECTIONS[3].compte()` qui passe de 1 à 2 fiches, la fiche à quatre champs, la relecture après réouverture ne sont vérifiables que par le lot 2. Un lot 1 committé seul serait un `chore` sans valeur, pas une itération close — la porte utilisateur (étape 7) ne le laisserait pas passer. Ton veto reste utile comme garde-fou, il ne mord sur rien ici : le lot 2 est nommé, fichier par fichier, dans l'annexe du tour 1, et il inclut le câblage `App.tsx` sans lequel le panneau n'est atteignable par personne. Précédent littéral : it3 avait la même forme (contrat `camp` puis `ObjectifsCanon.tsx`), et la feature n'a pas été déclarée close sur le contrat seul.

**À la QA (non-régression Départ) — tes points (2) et (4) se règlent moins cher que prévu, (3) et (5) sont maintenus.**
- **(4) `panneauDepart.test.tsx` : non-régression par compilation, pas par réécriture.** Ce fichier n'appartient à **aucun** lot et ne doit pas bouger. `Lieu extends Entite` n'ajoute que des champs **optionnels** : un littéral `Entite` reste assignable à `Lieu`, donc `lieux: [...d.monde.lieux, lieu]` (`panneauDepart.test.tsx:41`) compile inchangé, et `seme.monde.lieux[0].nom` reste `undefined` (L95). Si un jour ce fichier doit être édité pour que `tsc` passe, c'est que quelqu'un a rendu un champ requis — veto immédiat.
- **Sentinelle à nommer explicitement** : `amorce.test.ts:107` — `expect(SEME.monde.lieux).toEqual([{ id: 'lieu.amorce' }])`. C'est le témoin que le lot 1 **ne sème rien**. Il doit rester vert **sans être touché**. Un lot qui le modifie a semé une valeur par défaut : veto.
- **(2) suppression du lieu de départ** : le niveau unitaire est **déjà couvert** (`validate.test.ts:270-278`, code `reference-pendante`, `path`, `entityId`, `location` tous épinglés). Ne le redouble pas. Ce que le lot 2 doit à cette itération est le niveau **rendu**, et c'est exactement le risque KR-183 (une anomalie rendue par le service puis jetée en silence) : un test `panneauLieux.test.tsx` qui confirme la modale sur le lieu de départ, puis assert (a) le bandeau de refus visible, (b) le lieu **toujours dans la liste**, (c) `dossiers.get(id).monde.lieux` de longueur inchangée. Zéro production neuve.
- **(3) `dossierEditorScreen.test.tsx` index 3** : maintenu, et c'est là que va l'assertion du compteur 1 → 2 fiches — le compteur est rendu par l'écran de `bascule-editeur`, pas par le panneau. Pas de conflit de propriété : ce fichier appartient au lot 2 (KR-187).
- **(5) garde d'absence lecture **et** mutation sur le `Record` de brouillons** : maintenu, BUG-058, non négociable — patron `ObjectifsCanon.tsx:168-175` recopié tel quel.

**Statut de mes propres positions du tour 1**

| # | Position tour 1 | Statut |
|---|---|---|
| 1 | « la définition ne dit rien de la suppression… il n'y aura pas de retrait » | **RETIRÉE** — le fait nouveau la périme : le retrait existe, et son seul cas dangereux est structurellement impossible depuis it2. |
| 2 | `dangers` → `'auteur'` | **RETIRÉE** — `destinations.ts:34-36` définit `'auteur'` comme « pas une donnée de jeu, une note de rédaction ». Un piège et un loup rôdeur **sont** de la donnée de jeu. La frontière que D1 trace est le **déclencheur** (`…_expr` / son jumeau `…_texte`), pas la description d'un péril. Trois lignes `'ia'`, donc. |
| 3 | `description` / `ambiance` → `'ia'` ; `nom` reste `'auteur'` | **MAINTENUE.** |
| 4 | `dangers?: string` (prose), pas `string[]` | **MAINTENUE.** |
| 5 | Lot contrat à **6** fichiers, pas 9 — `tables.ts`, `validate.ts`, `amorce.ts` intouchés | **MAINTENUE**, re-vérifiée : zéro champ requis, zéro référence neuve. |
| 6 | Fixtures obligatoires dans le lot contrat | **DURCIE EN VETO.** Les trois lignes de `destinations.ts` **et** les instances dans `dossier-minimal.json` partent ensemble ou pas du tout : séparées, l'une rougit (`couverture.test.ts` L293/L301), et n'en faire aucune des deux ne rougit **rien** — trois champs entreraient au schéma sans audience déclarée. |
| 7 | Bandeau de refus dans `PanneauLieux` | **MAINTENUE, condition corrigée** : il s'allume sur `resultat.statut === 'refuse'` rendu par `commit()`, **jamais** sur un prédicat calculé côté feature. |
| 8 | motif `LIBRES` = `TEXTE_OPTIONNEL_LIBRE` | **CORRIGÉE** — ce motif dit « jumeau prose **d'une condition** », ce que ces trois champs ne sont pas. Nouvelle constante partagée, ex. `PROSE_D_ENTITE_LIBRE`. |

---

## ANNEXE — Découpage en lots (révisé : contenu de 3 cases, aucun mouvement de fichier)

**2 lots, propriété disjointe, exécution séquentielle.**

### Lot 1 — `contrat-lieu` · contrat · 6 fichiers (inchangé)
`src\brain\dossier\types.ts` (R) · `src\brain\index.ts` (R) · `src\brain\dossier\destinations.ts` (R) · `src\brain\dossier\__fixtures__\dossier-minimal.json` (R) · `src\brain\dossier\__fixtures__\dossier-reference.json` (R) · `src\brain\dossier\couverture.test.ts` (R).

**Signature figée :**
```ts
export interface Lieu extends Entite {
	description?: string
	ambiance?: string
	dangers?: string
}
// Monde.lieux: Lieu[] — extension par champs OPTIONNELS, panneauDepart.test.tsx compile intact.
```
```ts
'monde.lieux[].description': 'ia',
'monde.lieux[].ambiance': 'ia',
'monde.lieux[].dangers': 'ia',
```
**Intouchés, vérifiables à l'octet :** `tables.ts`, `validate.ts`, `amorce.ts` (+ sentinelle `amorce.test.ts:107`), `identifiers.ts`, `sections.ts`.

### Lot 2 — `panneau-lieux` · feature · 5 fichiers (+1 conditionnel)
`PanneauLieux.tsx` (N) · `FicheLieu.tsx` (N, seulement si dépassement ~350 lignes, KR-112) · `tests\panneauLieux.test.tsx` (N) · `features\dossier-canon\index.ts` (R) · `src\App.tsx` (R) · `features\bascule-editeur\tests\dossierEditorScreen.test.tsx` (R, KR-187).

**Contraintes révisées :**
- Suppression : `Modal` toujours, motivé par la perte irréversible de prose — pas par l'intégrité référentielle.
- `commit()` lit le retour de `dossiers.update()` et allume le bandeau sur `statut === 'refuse'`. Interdit : tout prédicat feature `lieu.id === dossier.charpente.depart.lieu_id` en pré-vol.
- Pas de retour arrière du brouillon sur refus.
- Sélection `useState<string|null>` local, lieu courant calculé en ligne, jamais de `useEffect` de resynchronisation.
- `Record<id, BrouillonLieu>`, garde d'absence en lecture ET mutation.
- Zéro import de `bascule-editeur`.

**Non promu délibérément** : le bandeau Refus (3ᵉ exemplaire) reste feature-local — extraction différée au 4ᵉ appelant réel, à porter en `open_questions`.
