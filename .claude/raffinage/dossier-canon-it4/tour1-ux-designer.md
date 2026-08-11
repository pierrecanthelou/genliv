# Tour 1 — UX Designer — dossier-canon it4

**RISQUE** — Premier écran de la feature à combiner liste-sélection (`ListRow`, jamais consommé en écriture) et un `Record<id, Brouillon>` à 3 champs de prose — l'anatomie exacte de BUG-058 (garde absence sur lecture *et* mutation), déjà signalée en `open_questions` d'it3. Second risque : `ListRow` documente elle-même « pas de règle `:hover` » — le motif « Hover-reveal row actions » de `docs/WORKFLOW.md` ne s'applique donc pas ici sans rouvrir ce composant.

**OBJECTION** — Le goal ne tranche pas la suppression. Le précédent « pas de confirmation » (it1/it3) repose sur « aucune référence vivante à cet id » — **faux pour Lieu** : `charpente.depart.lieu_id` est une référence réelle, déjà livrée (it2), vers `monde.lieux`. Supprimer le lieu de départ n'est pas inerte comme un interdit de ton ; c'est le cas que le domaine appelle « référence pendante », normalement bloquante et jamais silencieuse.

**PROPOSITION** — (1) Retrait toujours confirmé par `Modal` (précédent `DeleteDossierDialog.tsx`, `confirmTone="error"`), déclenché depuis la fiche à droite, jamais depuis la `ListRow` (pas de `trailing` destructeur dans une liste dense). (2) La tentative de retrait du lieu référencé par `charpente.depart.lieu_id` passe par `DossierService.update()` normalement — refus par référence pendante, rendu par le bandeau `Refus` déjà câblé, aucune machinerie neuve. (3) `subtitle` de `ListRow` = `lieu.id` (mono, technique — respecte l'anatomie du composant, pas un extrait de prose).

**VERDICT** — recevable sous réserve (garde de suppression + garde `Record` à trancher explicitement, pas hérités en silence).

---

## ANNEXE — Contrat de design

### Composants
- `ListRow` (`brain/components/ListRow.tsx`) — colonne gauche, un `title` par lieu, **aucune modification du composant**.
- `Card` (`brain/components/Card.tsx`) — fiche à droite, `padding` par défaut.
- `Field` (`brain/components/Field.tsx`) — 4 champs de la fiche.
- `IconButton` (`brain/components/IconButton.tsx`) — retirer le lieu, `tone="danger"`.
- `Modal` (`brain/components/Modal.tsx`) — confirmation de suppression, précédent exact `DeleteDossierDialog.tsx`.
- **Aucune primitive maison.** Le bloc « + Ajouter un lieu… » reprend à l'identique l'anatomie déjà livrée par `ObjectifsCanon.tsx` (`boutonAjouterStyle`), pas un nouveau composant.

### Layout
Deux colonnes : gauche = liste `ListRow` (une ligne par `monde.lieux[]`, jamais triée — même garde que `PanneauDepart` sur `localiserEntite`), sous elle le bouton dashed accent « + Ajouter un lieu… ». Droite = `Card` unique contenant la fiche du lieu sélectionné. Sélection par défaut au montage : premier lieu du tableau (`index 0`, donc `lieu.amorce` sur un dossier neuf).

### Tokens (noms vérifiés dans `src/styles/tokens/*.css`)
`--space-1..12`, `--hit-target`, `--r-md`, `--r-xl`, `--r-3xl`, `--surface-card`, `--surface-inset`, `--border-subtle`, `--border-field`, `--accent`, `--accent-bg`, `--accent-bg-2`, `--bad`, `--bad-line`, `--text-strong`, `--text-body`, `--text-faint`, `--text-label`, `--text-muted`, `--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--track-eyebrow`, `--lh-body`, `--fw-semibold`, `--shadow-modal`.

### Textes exacts
- Eyebrow de section (au-dessus de la liste, même patron que `ObjectifsCanon`) : `LIEUX`
- `ListRow.title` : sortie brute de `localiserEntite('lieu', lieu, index)` — `Lieu « Val-Cendre »` / `Lieu n°1 (sans nom)`. Ne pas reformater (critère d'acceptation §7, déjà arbitré).
- `ListRow.subtitle` : `lieu.id` (ex. `lieu.amorce`, `lieu.7f3a1c`) — mono, technique, jamais de prose.
- Bouton d'ajout : `+ Ajouter un lieu…`
- `Field label="NOM DU LIEU"` hint `interne` — placeholder `La Caverne d'Aldûr`
- `Field label="DESCRIPTION" multiline rows={3}` hint `interne — jamais lu par le joueur` — placeholder `Une grotte basse aux parois calcaires, à une heure de marche au nord de Val-Cendre ; l'entrée est dissimulée par un rideau de lierre.`
- `Field label="AMBIANCE" multiline rows={2}` hint `interne — jamais lu par le joueur` — placeholder `Air humide, écho des gouttes, une odeur de cendre froide qui ne devrait pas être là.`
- `Field label="DANGERS" multiline rows={2}` hint `interne — jamais lu par le joueur` — placeholder `Un piège à lanière tendu près de l'autel ; les échos attirent parfois un loup des cendres.`
- `IconButton label="Retirer le lieu « {titre} »"` (ou repli sans nom), `tone="danger"`, glyphe `✕`.
- `Modal title="Supprimer le lieu"` `cancelLabel="Annuler"` `confirmLabel="Supprimer"` `confirmTone="error"`, corps : `Le lieu « {nom} » sera supprimé définitivement, avec sa description, son ambiance et ses dangers. Cette action est irréversible.` (repli sans nom → `Le lieu n°{index} (sans nom) sera supprimé…`).
- Refus par référence pendante (lieu de départ) : réutilise le bandeau `role="status"` existant, `EYEBROW_REFUS = "CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` — pas de texte neuf.

### États
- **Défaut** : liste ≥1 ligne (jamais vide, `lieu.amorce` toujours semé) ; fiche du lieu sélectionné affichée à droite.
- **Sélectionné** : `ListRow` teinte `--accent-bg-2` / bordure `--accent`, `aria-current="true"` — géré par le composant, rien à ajouter.
- **Vide (fiche neuve, ex. `lieu.amorce`)** : les 4 `Field` affichent leur `placeholder`, jamais une valeur réelle vide muette.
- **Vide défensif (0 lieu, ex. import corrompu)** : fiche à droite = même gabarit dashed que `PanneauSection` (`border 1.5px dashed var(--border-field)`, glyphe `❏`), texte `Aucun lieu — cliquez « + Ajouter un lieu… » pour commencer.` — cas non normalement atteignable, mais jamais un vide muet.
- **Erreur / refus** : bandeau `role="status"` réutilisé, cas unique = tentative de retrait du lieu référencé par `charpente.depart.lieu_id`.

### Clavier
- Ajout : clic/`Entrée` sur « + Ajouter un lieu… » → commit immédiat → nouvelle `ListRow` sélectionnée → focus posé sur `NOM DU LIEU` (`Field autoFocus`), l'auteur tape sans reprendre la souris.
- Navigation liste : `Tab` traverse les `ListRow` (racine `<button>` native, déjà acquis) puis le bouton d'ajout puis les 4 champs de la fiche puis le bouton retirer.
- Suppression : `Entrée`/`Espace` sur le bouton retirer ouvre `Modal` ; `Échap` ferme sans supprimer ; focus revient au bouton retirer à la fermeture (mécanisme déjà dans `Modal.tsx`, rien à recoder).

Fichiers consultés : `src\brain\components\ListRow.tsx`, `...\Field.tsx`, `...\Card.tsx`, `...\IconButton.tsx`, `...\Modal.tsx`, `...\IssueList.tsx`, `src\features\dossier-canon\components\{PanneauCanon,PanneauDepart,ObjectifsCanon}.tsx`, `src\features\book-library\components\DeleteDossierDialog.tsx`, `src\brain\dossier\{types,amorce,destinations,identifiers}.ts`, `src\styles\tokens\{colors,spacing,typography}.css`, `src\features\dossier-canon\specification.json`.
