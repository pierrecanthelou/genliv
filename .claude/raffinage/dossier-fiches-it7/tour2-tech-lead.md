## Note TECH-LEAD — tour 2 (contre-lecture) — `dossier-fiches` it7/8

**RISQUE** — Le vrai risque neuf n'est pas la modale, c'est l'ordre des effets. Vérifié dans `Modal.tsx:51-56` : la restauration de focus est un cleanup de `useEffect`. React vide les `destroy` avant les `create` d'un même commit, et `previouslyFocused` est détaché après le retrait (`focus()` sur un nœud non connecté est un no-op, jsdom compris). `intentionFocus` gagne donc mécaniquement — à une condition non écrite : fermeture et retrait dans le MÊME gestionnaire. Fermée dans un commit ultérieur, la modale rend le focus à un nœud mort et il retombe sur `document.body`.

**OBJECTION** — Deux sources de vérité dans la proposition UX : la modale stocke `personnageEnConfirmationRetraitId`, mais `handleRetirer()` agit sur `personnageAffiche`. Deux réponses possibles à « quel personnage est retiré ». Et en vérifiant le point 1 j'ai trouvé une deuxième occurrence vivante du défaut de narratif-ia, sur le composant même d'it7 : `texte-trop-long` (`issues.ts:103`) dit « l'import n'est pas bloqué » et est rendu aujourd'hui par `FichePersonnage.tsx:319` (`avertissementsAffiches`), hors de tout import.

**PROPOSITION** — (a) garde en ligne `enConfirmation === personnageAffiche.id &&` : une sélection périmée ferme la modale sans `useEffect`, une seule source ; (b) corriger `issues.ts:93` et `:103` — deux lignes, zéro test cassé pour la seconde ; (c) lot unique marqué `contrat`, temps 0 = `brain/` seul, re-vert avant la feature ; (d) `PiedFichePersonnage.tsx` retiré du lot — fichier à un seul appelant que la placement UX rend inutile.

**VERDICT** — recevable. 1 lot `contrat`, séquentiel, sans essaim.

---

## Annexe

### A. Point 1 — `issues.ts` casse-t-il « zéro fichier brain/ » ? Oui. Lot marqué contrat.

Narratif-ia a raison et ma ligne du tour 1 était fausse — je la retire. J'ai mesuré le rayon avant de trancher :

- `src/brain/dossier/issues.ts:93` — 1 ligne. Le texte est lu par l'auteur d'it7 : `FichePersonnage.tsx:311` rend `<IssueList issues={refus.issues} />`, et `IssueList.tsx:29` rend `dossierIssueRemediation(issue)`. Ce n'est pas une correction cosmétique hors chemin.
- `src/brain/dossier/validate.test.ts:412-417` — 2 assertions à chaîne exacte cassent. En revanche `validate.test.ts:1846-1852` utilise `toContain('« monstre_ref »')` et survit. « Une ligne, zéro refonte » (PM) est juste au fond, mais coûte 2 fichiers `brain/`.
- Deuxième ligne proposée, `issues.ts:103` (`texte-trop-long`) : aucune assertion à chaîne exacte dans le dépôt. Coût de test : zéro.

**Décision** : le lot est marqué `contrat`, avec un temps 0 imposé (`brain/` seul, re-vert `tsc`+`jest`, puis la feature) — précédent it6 littéral. La dispense que j'avais écrite à it6 reste valable et reste conditionnelle à l'unicité du lot : aucun second lot ne coexiste, donc pas de lot `contrat` séparé.

**Ce que je refuse d'ouvrir** : les ~10 autres libellés de `DOSSIER_ISSUE_LABELS` qui disent encore « puis réimportez-le ». Même classe, hors du chemin observable d'it7. À consigner en BUG + note (pas un KR, seuil = 3e occurrence), balayage porté par la feature qui possède la surface d'anomalies.

### B. Point 2 — l'ordre UX résout-il le conflit de focus ? Oui, mécaniquement, sous une condition écrite.

Chaîne vérifiée : `onConfirm` → `setEnConfirmation(null)` + `handleRetirer()` (qui appelle `setSelection`) + `setIntentionFocus('retirer')`. React 18 groupe les trois dans un commit. Dans la phase passive de ce commit, l'ordre est destroy puis create : le cleanup de `Modal` part avant l'effet `intentionFocus`. Double sécurité : le bouton capturé par `Modal` est détaché à ce moment, et `focus()` sur un nœud non connecté ne fait rien.

Deux invariants écrits :

1. Fermeture et retrait dans le même gestionnaire synchrone. Aucun `useEffect`, aucune promesse, aucun `setTimeout` entre les deux.
2. `setIntentionFocus` seulement si `statut === 'ecrit'`. Sur refus SSOT le bouton visé est toujours monté : `Modal` lui restaure légitimement le focus.

```ts
const [enConfirmation, setEnConfirmation] = useState<string | null>(null)
function handleConfirmerRetrait() {
	setEnConfirmation(null)
	const resultat = ecriture.handleRetirer()
	if (resultat.statut === 'ecrit') setIntentionFocus('retirer')
}
```

La garde `enConfirmation === personnageAffiche.id` remplace le `key={personnage.id}` du tour 1 et supprime le besoin de `PiedFichePersonnage.tsx`.

### C. Statut de chacune de mes positions du tour 1

| Position tour 1 | Statut | Motif |
|---|---|---|
| RISQUE — aucun pré-vol de référence en code feature | durcie en veto | Discriminant KR-194 : un pré-vol verrait la relation auto-référentielle et refuserait à tort. |
| « Zéro fichier brain/ : confirmé » | retirée | Fausse. `issues.ts:93`+`:103` sont sur le chemin observable d'it7 ; le lot devient contrat. |
| Retombée de sélection dans le socle (`setSelection(null)`) | maintenue | Non tranchée par le comité. `restants[max(index-1,0)] ?? null`, socle seul. |
| Brouillons orphelins, rien à purger | maintenue | Motivée en commentaire (identifiant jamais réutilisé). |
| `PiedFichePersonnage.tsx` neuf, `key={personnage.id}` | retirée | La garde en ligne de § B donne la même garantie à coût nul. |
| Fichier de test neuf | maintenue | `panneauPersonnages.test.tsx` est à 843 lignes. |
| Conflit `Modal` / `intentionFocus` | retirée comme conflit, convertie en 2 invariants | Voir § B. |
| KR-112, dette déplacée | maintenue | Constat, pas un blocage. |
| Lot 2 optionnel `bug-074-presence` | retirée | it7 ne touche pas `BlocPresence.tsx`, lot fallout non causé. |

### D. Liste de tests finale (fusion TL + QA + narratif-ia)

`src/features/dossier-fiches/tests/retraitPersonnage.test.tsx` (neuf, ~260 l.) :

| # | Test | Prouve | Origine |
|---|---|---|---|
| 1 | retirer un personnage non référencé : liste N→N-1, écriture réelle, aucun retrait optimiste | chemin nominal | QA |
| 2 | refus par `relations[].cible_id` d'un tiers : liste inchangée, bandeau visible et nommant le référençant | refus au SSOT + OÙ correct | QA + narratif A.1 |
| 3 | refus par `pnj_a_revele` imbriqué sous `non`/`et` à profondeur ≥ 2 | récursion de `collectRefs` | narratif-ia |
| 4 | auto-référence seule : le personnage et sa propre relation partent dans le même commit, `reference-pendante` absente | KR-194 côté écriture, discriminant anti-pré-vol | narratif-ia + QA |
| 5 | un refus de retrait sur A ne s'affiche pas sous B après changement de sélection | KR-197, moitié affichage | QA |
| 6 | une écriture réussie sur A (édition ou retrait) efface le refus sur A ; sur B ne l'efface pas | KR-197, moitié invalidation, deux entités | QA |
| 7 | retirer le dernier personnage → état vide d'it1, aucun crash de focus | `setSelection(null)` | TL |
| 8 | focus après retrait réussi sur le bouton « Retirer… » de la fiche retombée, sonde KR-199 (plusieurs boutons « Retirer le personnage ») | parité Lieu + fermeture différée | QA + TL |
| 9 | modale, 3 `it` : clic Retirer n'écrit rien ; Annuler/Échap ferme sans écrire ; Retirer de la modale commite | arbitrage modale observable | QA |
| 10 | refus AVEC modale : la modale se ferme, le bandeau prend la main, sélection et focus restent sur le personnage visé | invariant § B.2 | TL |
| 11 | après retrait : canon/charpente/autres personnages intacts hors la relation orpheline attendue, `validateDossier` sans erreur | non-régression + critère racine n°8 | QA |

`validate.test.ts` (R) : réécrire les 2 assertions exactes l.412-417 + une assertion « la remédiation ne dit plus réimportez ».

### E. Découpage en lots — révisé : 1 lot, marqué contrat, séquentiel

| Temps | Fichier | N/R | Contenu |
|---|---|---|---|
| 0 · contrat | `src/brain/dossier/issues.ts` | R | 2 lignes (`:93`, `:103`) |
| 0 · contrat | `src/brain/dossier/validate.test.ts` | R | assertions exactes + garde anti-retour |
| 1 | `hooks/useSocleEcriturePersonnages.ts` | R | `handleRetirer`, retombée de sélection |
| 2 | `hooks/useEcriturePersonnages.ts` | R | ré-export |
| 3 | `components/RetirerPersonnageDialog.tsx` | N | calqué sur `DeleteDossierDialog.tsx` |
| 4 | `components/FichePersonnage.tsx` | R | bouton, props `index`+`onDemanderRetrait` |
| 5 | `components/PanneauPersonnages.tsx` | R | `enConfirmation`, garde en ligne, `intentionFocus` |
| 6 | `tests/retraitPersonnage.test.tsx` | N | les 11 tests |
| 7 · docs | spec/bug_history/code-knowledge/CHANGELOG/README/roadmap/package.json | R | statut 7/8 + BUG + note ouverte |

**Invariants imposés** : aucun pré-vol de référence côté feature (veto) — étendu par narratif-ia au bouton jamais désactivé et à la modale jamais conditionnée ; `commit()`/KR-197 restent dans le socle ; refus ⇒ liste/sélection/focus inchangés ; fermeture modale + retrait dans le même gestionnaire synchrone ; `setIntentionFocus` seulement si `statut === 'ecrit'`.

**Hors lot** : `tables.ts`, `validate.ts`, `predicates.ts`, `expr.ts`, `DossierService.ts`, `Modal.tsx`, `IssueList.tsx`, `BlocPresence.tsx`, les 4 sous-hooks d'écriture d'it5, `panneauPersonnages.test.tsx`, les 10 autres libellés de `DOSSIER_ISSUE_LABELS`.
