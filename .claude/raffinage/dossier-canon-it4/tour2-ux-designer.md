# Tour 2 — UX Designer — dossier-canon it4

**RISQUE** — Le risque qui reste après retrait du Modal : la fiche est en mode maître-détail (contrairement à `ObjectifsCanon`, liste plate de cartes), donc supprimer le lieu *sélectionné* pose une question que le précédent it3 ne pose pas — quelle carte s'affiche ensuite ? Un flou ici produirait un vide muet ou un focus perdu, ce qui reste dans mon domaine.

**OBJECTION** — Aucune nouvelle objection de fond ; je révise la mienne du tour 1 (voir RÉPONSES).

**PROPOSITION** — Suppression immédiate par `IconButton tone="danger"` sur la fiche (précédent `ObjectifsCanon.handleRetirer`, aucun Modal). Après un retrait réussi, sélection = lieu précédent dans le tableau (`index - 1`), ou premier restant si l'élément retiré était en tête ; le focus suit sur le bouton retirer de la fiche nouvellement affichée. Si le retrait est refusé (référence pendante), rien ne bouge côté liste/fiche (état dérivé de la SSOT, jamais de copie locale optimiste) — seul le bandeau `Refus` apparaît.

**VERDICT** — Modal retirée de ma proposition tour 1. Réserve tour 1 levée.

---

## RÉPONSES TOUR 2

**À PM** — ton motif « déjà acté it1/it3 » est valide, y compris sur le volume que je contestais. Vérifié dans le code : `ObjectifsCanon` (it3) supprime déjà sans confirmation une entité à 4 champs dont **2 multiligne** (`nom`, `camp`, `reussi_si_texte` rows=2, `echoue_si_texte` rows=2) via un simple `IconButton tone="danger"`. Lieu (`nom`, `description` rows=3, `ambiance` rows=2, `dangers` rows=2) est plus dense d'un champ multiligne — 3 contre 2 — mais ce n'est pas un saut qualitatif, seulement quantitatif. Ma comparaison tour 1 était invalide ; je la retire.

**Au tech-lead** — tu distingues juste : mon Modal n'était plus motivé par l'intégrité référentielle (le FAIT NOUVEAU confirme que `validateDossier` la bloque déjà, code `reference-pendante`, bandeau `Refus` câblé depuis it1) mais par l'irréversibilité de la prose. Ce second motif est lui aussi déjà tranché par le précédent it3, qui accepte une perte de volume comparable sans confirmation. Je n'ai donc aucun motif propre à mon périmètre (design system, états vides, clavier, registre de langue) pour traiter Lieu différemment. Le Modal était redondant à double titre. Retiré.

**Sur la garde `Record`** — retirée de ma réserve : ton annexe la couvre déjà nommément (« brouillon `Record<id, BrouillonLieu>` avec garde d'absence en lecture et en mutation, BUG-058 »). Ce n'est pas mon domaine, rien à ajouter.

---

## ANNEXE — Contrat de design (deltas uniquement)

### Composants
- **`Modal` retirée de ce lot.** Suppression immédiate, précédent `ObjectifsCanon.tsx` (`handleRetirer`), pas de confirmation.
- Reste : `ListRow`, `Card`, `Field`, `IconButton` (`tone="danger"`, sur la fiche, jamais sur la `ListRow`).

### Textes exacts (mise à jour)
- Supprimer les 4 lignes `Modal title=…` du tour 1 — plus de composant, plus de texte associé.
- `IconButton label="Retirer le lieu « {titre} »"` (repli sans nom → `Retirer le lieu n°{index}`), `tone="danger"`, glyphe `✕` — inchangé, déclenche le retrait **directement**.
- Refus par référence pendante : inchangé — bandeau `role="status"`, `EYEBROW_REFUS` existant, aucun texte neuf.

### Clavier (réécrit)
- Suppression : `Entrée`/`Espace` sur le bouton retirer (fiche) supprime **immédiatement**, sans étape intermédiaire.
- Si le retrait réussit : sélection retombe sur le lieu d'`index - 1` (ou le premier restant si l'élément retiré était en tête) ; le focus suit sur le bouton retirer de la fiche nouvellement affichée — jamais de focus perdu dans le vide.
- Si le retrait est refusé (lieu de `charpente.depart.lieu_id`) : aucun changement de sélection ni de focus, le bandeau `Refus` apparaît au-dessus de la fiche inchangée.

### Tokens
Retirer `--shadow-modal` de la liste (plus utilisé dans ce contrat) ; le reste des tokens tour 1 est inchangé.

Tout le reste de l'annexe tour 1 (Layout, États, textes des 4 `Field`, `ListRow.subtitle`) est inchangé et reste en vigueur.

**Fichiers consultés ce tour** : `src\features\dossier-canon\components\ObjectifsCanon.tsx`, `src\features\dossier-canon\components\PanneauCanon.tsx`.
