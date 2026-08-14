## Note UX-Designer — tour 1 — dossier-fiches it7 (retrait d'un personnage)

**RISQUE** — Appliquer le précédent Lieu (retrait immédiat, sans modale) au Personnage sans réexaminer sa prémisse : « le seul cas dangereux est déjà bloqué par le validateur ». Ce blocage protège l'INTÉGRITÉ référentielle (rien ne pointe plus vers l'entité), jamais la PERTE de son propre contenu. Un personnage NON référencé — le cas ordinaire — n'a aujourd'hui aucune garde : 7 blocs remplis (identité, stats, plan, relations, présence, savoirs) disparaissent d'un clic, sans confirmation ni retour arrière.

**OBJECTION** — Le motif écrit du précédent Lieu généralise mal. CLAUDE.md § Dangerous Actions ne porte aucune clause d'exemption « déjà protégé ailleurs » : il exige une modale pour toute action qui supprime ou retire définitivement des données. Lieu (3 champs plats) rendait déjà cette omission discutable ; l'étendre telle quelle à Personnage prolonge un raisonnement déjà fragile sur un cas d'un tout autre ordre de grandeur, sans que le cadrage ne le réexamine.

**PROPOSITION** — Retenir la modale : `Modal` de `brain/components/` réutilisé tel quel, patron `DeleteDossierDialog.tsx` (39 lignes) recopié en un fichier neuf, même gate uniforme quel que soit le taux de remplissage. Coût chiffré : ~40 lignes neuves, zéro composant maison, zéro token neuf.

**VERDICT** — recevable sous réserve : la modale de confirmation est retenue.

---

## ANNEXE — contrat de design

### 1. Bouton de retrait (inchangé que la modale soit retenue ou non)

- Composant : `IconButton` `tone="danger"` `size={HIT_TARGET_MIN}`, glyphe `✕`.
- Position : dans `FichePersonnage.tsx`, fin de `champsStyle`, après `<Accordion .../>` et avant le bandeau de refus.
- Libellé, fonction `libelleRetirer(personnage, index)`, aligné sur `localiserEntite('pnj', …)` :
  - nom renseigné : `Retirer le personnage « Aldûr le Sage »`
  - repli : `Retirer le personnage n°4 (sans nom)`

### 2. Modale (RETENUE)

- Nouveau fichier `RetirerPersonnageDialog.tsx`, calqué sur `DeleteDossierDialog.tsx` — `Modal` importé de `brain/components/`, aucun style neuf.
- `title` : `Retirer le personnage`
- Corps : `Le personnage « Aldûr le Sage » sera retiré de l'aventure, avec l'identité, les caractéristiques, le plan d'actions, les relations, la présence et les savoirs déjà renseignés. Cette action est irréversible.` (repli sans nom : `Le personnage n°4 (sans nom) sera retiré…`)
- `cancelLabel="Annuler"`, `confirmLabel="Retirer"`, `confirmTone="error"`.
- État : `personnageEnConfirmationRetraitId: string | null`, possédé par `PanneauPersonnages.tsx`. Clic sur le bouton ouvre la modale (n'appelle pas `handleRetirer` directement) ; `onConfirm` appelle `handleRetirer(id)` puis ferme ; `onCancel`/`onClose`/Échap ferme sans écrire.
- Clavier : porté par `Modal.tsx` existant, zéro câblage neuf.
- Retrait refusé (SSOT) : la modale se ferme, le bandeau existant reprend la main (`role="status"`, eyebrow `CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ`).
- Retrait réussi : sélection retombe sur le personnage précédent, focus suit sur son bouton retirer.
- Dernier personnage retiré : la section retombe sur l'état vide déjà livré à it1.

### 3. Repli si le comité écarte la modale malgré l'objection

Alors, au minimum : un bandeau `role="status"` doit apparaître avant le clic destructeur, nommant ce qui va être perdu — repli non recommandé.
