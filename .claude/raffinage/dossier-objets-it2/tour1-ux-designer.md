**RISQUE** — Le cadrage présente les deux précédents (dossier-fiches it7 : `Modal`, dossier-canon it4 : retrait immédiat) comme deux patrons également disponibles, sans trancher. Le retrait immédiat de `PanneauLieux.tsx` contredit pourtant `CLAUDE.md` § Dangerous Actions (destructif + irréversible → dialogue obligatoire) — c'est une dette non vue, pas un modèle. Si l'essaim recopie ce patron « parce qu'il est plus court », l'auteur retire un objet sans confirmation ni retour en arrière.

**OBJECTION** — Le point 4 du cadrage traite la divergence comme encore ouverte, alors que le `design_contract` d'it1 avait déjà tranché : `composants` liste nommément « Modal (retrait) ». Rouvrir cette question au tour 1 d'it2 revient à défaire une décision déjà écrite dans la spec.

**PROPOSITION** — Retenir le patron `dossier-fiches` it7 : `RetirerObjetDialog.tsx` (précédent exact `RetirerPersonnageDialog.tsx`), bouton de retrait dans `FicheObjet.tsx` TOUJOURS actif, modale muette sur les référents. Textes exacts en annexe. Focus post-retrait via `forwardRef<FicheObjetHandle>` + `focusRetirer()` (patron `FichePersonnageHandle`, dossier-fiches it8) — jamais le `querySelector` de `PanneauLieux.tsx` (dette BUG-078, à ne pas reproduire une 3ᵉ fois).

**VERDICT** — recevable sous réserve : si le plan retient le retrait immédiat de `PanneauLieux.tsx` plutôt que `Modal`, je passe cette réserve en veto au tour 2 (composant du `design_contract` non honoré).

---

## Annexe — contrat de design du retrait (it2)

**Position tranchée : `Modal`, pas retrait immédiat.** Motif : action destructive + irréversible → `CLAUDE.md` § Dangerous Actions l'exige ; le `design_contract` d'it1 l'avait déjà anticipé (« Modal (retrait) ») ; `PanneauLieux.tsx` (immédiat) n'est pas un modèle à suivre mais une dette hors périmètre de sa propre feature — ne pas l'importer une seconde fois dans une feature neuve.

### `FicheObjet.tsx` — bouton de retrait
- Composant : `IconButton`, `tone="danger"`, `size={HIT_TARGET_MIN}`, glyphe `✕`.
- Position : pied de fiche (`piedFicheStyle`, motif `FicheLieu.tsx`, `justify-content: flex-end`).
- Libellé — **réutilise la convention déjà posée à it1 dans ce même fichier** (`libelleMonter`/`libelleDescendre`), pas celle de `FicheLieu` (qui omet « (sans nom) ») :
  - `Retirer l'objet « ${nom.trim()} »` si nommé,
  - `Retirer l'objet n°${index + 1} (sans nom)` sinon.
- TOUJOURS actif, jamais `disabled`, jamais conditionné à qui référence l'objet (même veto que dossier-fiches it7 § 8 désaccord 2) : le SSOT décide après coup, pas la fiche avant.
- `onClick` = `onDemanderRetrait` (ouvre la modale, n'écrit rien) — jamais `onRetirer` direct.

### `RetirerObjetDialog.tsx` (nouveau, précédent exact `RetirerPersonnageDialog.tsx`)
- `title="Retirer l'objet"`
- Corps, un seul nœud de texte, variable = désignation résolue par le parent (`localiserEntite('objet', objet, index)` ou équivalent « «Nom»/n°N (sans nom) ») :
  > `L'objet ${désignation} sera retiré du registre, avec son nom et sa description déjà renseignés. Cette action est irréversible.`
- `cancelLabel="Annuler"`, `confirmLabel="Retirer"`, `confirmTone="error"`.
- Muette sur les référents (même veto tech-lead/narratif-ia qu'it7) : ne reçoit ni le dossier ni la liste des personnages.
- `onClose`/`onCancel` = ferme sans écrire ; `onConfirm` = même geste synchrone que `handleConfirmerRetrait` (`PanneauPersonnages.tsx`) : fermer la modale et écrire dans le **même** gestionnaire, avant tout `useEffect`, pour que `intentionFocus` gagne contre la restauration de focus native de `Modal.tsx`.

### Bandeau de refus (dans `FicheObjet.tsx`, sous le pied de fiche)
- Réutilise `IssueList`, `role="status"`, eyebrow `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` (mono, `--bad`), et `TEXTE_ABSENT` si `statut==='absent'` — copie exacte des deux chaînes déjà posées côté Lieux/Personnages (les recopier dans un module propre à `dossier-objets`, jamais un import cross-feature).
- Indexé `RefusEnCours{objetId, statut, issues}` — deux objets distincts testés dans le même test (KR-202).

### Clavier — ce qui reste dû côté feature (`Modal.tsx` gère déjà Échap, piège de Tab, restauration de focus au démontage)
1. Ouverture : le bouton `Retirer` de `FicheObjet` déclenche la modale — le focus initial dans la modale suit l'ordre DOM natif de `Modal.tsx` (pas de geste supplémentaire requis).
2. Fermeture par Annuler/Échap/✕ : focus revient au bouton qui a ouvert la modale — géré nativement par `Modal.tsx`, rien à coder.
3. Confirmation réussie : la fiche affichée change (objet suivant/précédent, ou état vide si liste vidée) — le bouton d'origine est démonté, donc la restauration native de `Modal.tsx` ne suffit plus. Poser `intentionFocus: 'retirer' | null`, résolu en `useEffect` DOM impératif (légitime, KR-013), ciblant `ficheRef.current?.focusRetirer()` via un `FicheObjetHandle` **exposé par `FicheObjet.tsx`** (jamais un `querySelector` du panneau vers la fiche — § Encapsulation de la skill, dette BUG-078 à ne pas reproduire). Si la liste devient vide, focus sur `+ Ajouter un objet…`.
4. Aucun `setTimeout` : le retrait et la fermeture de modale sont synchrones dans le même gestionnaire (`handleConfirmerRetrait`).

**Fichiers concernés** : `src/features/dossier-objets/components/FicheObjet.tsx` (bouton + bandeau + `forwardRef`), `src/features/dossier-objets/components/RetirerObjetDialog.tsx` (nouveau), `src/features/dossier-objets/components/PanneauObjets.tsx` (état `enConfirmation`/`intentionFocus`, `handleRetirer`/`handleConfirmerRetrait`), un petit module de messages de refus propre à la feature (précédent `dossier-canon/utils/refusMessages.ts`, jamais importé cross-feature).
