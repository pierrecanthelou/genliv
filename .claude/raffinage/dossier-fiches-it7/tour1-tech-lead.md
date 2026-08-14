## Note d'ouverture — TECH-LEAD, dossier-fiches it7/8

**RISQUE** — Le danger de it7 n'est pas le retrait, c'est la modale *informée*. Une confirmation qui veut dire à l'auteur qui référence le personnage doit recalculer côté feature ce que `validateDossier` sait déjà : duplication de la règle SSOT → veto. Vérifié, pas supposé : `tables.ts:451` (`relations[].cible_id`, espace `pnj`) + la boucle `validate.ts:384-416` refusent déjà, et `sitesDe` (`validate.ts:167-196`, ligne 189) résout le OÙ sur le personnage référençant — le bandeau nommera « Personnage « Brann » » sans une ligne neuve. Zéro fichier `brain/` : confirmé.

**OBJECTION** — La définition est muette sur deux comportements que le code doit trancher et qu'aucun précédent ne transpose. (1) Retirer le dernier personnage : `setSelection` est publiquement `(id: string) => void`, incapable de porter `null` — la retombée doit vivre dans le socle, jamais dans le panneau. (2) Les brouillons orphelins : le précédent Lieu supprime l'entrée du brouillon au retrait, mais depuis la scission d'it5 il y a quatre `Record<personnageId, …>` dans quatre sous-hooks. Non écrit, un dev inventera quatre `handleRetirerBrouillon`.

**PROPOSITION** — (a) `handleRetirer: () => EcritureDossier` dans le socle seul (~28 l.), retombée `restants[max(index-1,0)] ?? null`, zéro purge de brouillon, motivée en commentaire (identifiant jamais réutilisé) ; (b) si modale retenue : `PiedFichePersonnage.tsx` neuf (~70 l.) monté `key={personnage.id}`, état local — jamais une 3ᵉ indexation KR-197 — et interdiction écrite d'y compter les référents ; sans modale, +12 l. inline (362→374, sous le signal KR-112) ; (c) tests dans un fichier neuf — `panneauPersonnages.test.tsx` est à 843 lignes.

**VERDICT** — recevable sous réserve (les deux silences tranchés avant codage ; interdiction écrite de tout pré-vol de référence côté feature).

---

## Annexe technique

### A. Découpage en lots — 1 lot, séquentiel, sans essaim

Mesure faite avant de proposer : la chaîne d'appel est `useSocleEcriturePersonnages` → `useEcriturePersonnages` → `PanneauPersonnages` → `FichePersonnage`. Tout découpage « hook / UI » ferait porter à chaque lot un fichier que l'autre nomme, et le lot hook ne passerait pas la porte qualité seul. Le découpage révèle le parallélisme, il ne le fabrique pas — précédent it2, it6 (lot unique).

| Lot | Marque | Fichier | N/R | Taille avant → après |
|---|---|---|---|---|
| L1 — `it7-retrait-personnage` | non-contrat (zéro `brain/`) | `hooks/useSocleEcriturePersonnages.ts` | R | 147 → ~180 |
| | | `hooks/useEcriturePersonnages.ts` | R | 125 → 127 |
| | | `components/FichePersonnage.tsx` | R | 362 → ~375 |
| | | `components/PanneauPersonnages.tsx` | R | 194 → ~218 |
| | | `components/PiedFichePersonnage.tsx` | N (seulement si modale retenue) | 0 → ~70 |
| | | `tests/retraitPersonnage.test.tsx` | N | 0 → ~200 |
| | | docs de l'étape 4 (spec, CHANGELOG, README, roadmap Statut → 7/8, package.json PATCH) | R | — |

Lot 2 optionnel (essaim) — `bug-074-presence` (BlocPresence.tsx + relationsPresence.test.tsx), fichiers disjoints mais **non recommandé** : BUG-074 daté « au prochain lot touchant ce fichier », it7 ne le touche pas, précédent de veto PM sur un lot fallout non causé.

### B. Interfaces exactes

```ts
// useSocleEcriturePersonnages.ts — ajout à UseSocleEcriturePersonnagesResult
/** Retire le personnage AFFICHÉ. Rend le résultat brut : le refus SSOT
 *  n'est jamais avalé, l'appelant sait s'il doit déplacer le focus. Aucun
 *  retrait optimiste. */
handleRetirer: () => EcritureDossier
```

```tsx
// FichePersonnage.tsx — deux props de plus (l'index manque aujourd'hui,
// requis par le repli du libellé, précédent FicheLieu.tsx:54-58)
index: number
onRetirer: () => void
// `Retirer le personnage « ${nom.trim()} »`  |  `Retirer le personnage n°${index + 1}`
```

Corps de `handleRetirer` (transposition littérale de `PanneauLieux.tsx:174-198`) :
```ts
const index = dossier.monde.personnages.findIndex((p) => p.id === personnageAffiche.id)
if (index === -1) return { statut: 'absent' }
const resultat = commit(personnages.filter((p) => p.id !== id), id)
if (resultat.statut !== 'ecrit') return resultat
const restants = resultat.dossier.monde.personnages
setSelection(restants.length === 0 ? null : restants[Math.max(index - 1, 0)].id)
return resultat
```

Focus (`PanneauPersonnages.tsx`) : `intentionFocus` + `panneauRef` + un seul `useEffect`, au-dessus des retours anticipés, sélecteur `button[aria-label^="Retirer le personnage"]`, précédent `PanneauLieux.tsx:95-102`.

### C. Invariants imposés au lot

1. Aucun pré-vol de référence en code feature — le refus vient du SSOT, après coup. Veto sinon.
2. `commit()` et ses deux indexations KR-197 restent dans le socle, jamais recopiées.
3. Retrait refusé ⇒ liste, sélection et focus inchangés ; bandeau sous la fiche du personnage VISÉ.
4. Brouillons : rien à purger, écrit en commentaire.
5. Auto-référence (KR-194) : se retirer soi-même emporte ses propres `relations[]` dans le même `filter` — aucun code dédié, mais un test nommé.

### D. Critères d'acceptation demandés en plus

- Retrait du dernier personnage → état vide, aucun crash de focus.
- Retrait refusé par un AUTRE personnage : bandeau nomme le référençant, pas le retiré.
- Sonde de discriminance du focus (KR-199) : plusieurs boutons « Retirer … » dans le DOM, le focus atterrit sur le bon.

### E. Tension modale — coût mesuré

`Modal` (212 l.) consommable sans une ligne neuve ; `DeleteDossierDialog.tsx` fait 39 lignes. Le coût réel n'est pas le dialogue, c'est : l'état d'ouverture (survivrait au changement de personnage si mal isolé — parade : `PiedFichePersonnage.tsx` monté `key={personnage.id}`) et le focus (`Modal` restaure le focus au démontage sur l'élément qui l'a ouvert, qui vient d'être retiré du DOM — court contre `intentionFocus`, +1 test). Position : le mécanisme du précédent Lieu se transpose littéralement ; seule son absence de modale est légitimement rouvrable — son motif (« le seul cas dangereux est déjà bloqué ») est faux ici. J'accepte une modale MUETTE, je refuse une modale qui compte les référents.

### F. Taille (KR-112) — 5e itération consécutive de dette déplacée

`BlocSavoirs.tsx` 487, `useEcriturePlan.ts` 415, `FichePersonnage.tsx` 362, `useEcritureRelationsPresence.ts` 389 : tous sous le bloqueur 800, aucun ne se résorbe.
