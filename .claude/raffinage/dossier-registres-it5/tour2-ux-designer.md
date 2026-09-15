# Tour 2 — `ux-designer` · `dossier-registres` it5

**Réponse nommée — D1 (retirée) + le texte d'état vide.** Je retire mon objection du tour 1. L'argument que je n'avais pas — un `Delta` porte une date d'application, un climat est ambiant — est un fait de domaine que mon terrain (design system) ne peut pas trancher, et `suffisance.test.ts` (`CIBLE_CLIMAT_EXCLUE`) + `destinations.ts:512-518` le confirment en code, pas seulement en discours. Sur le texte d'état vide proposé par `narratif-ia` : je tranche **rien ne se rend**. Ma propre règle des états vides exige qu'un vide *invite l'action suivante* — les quatre autres cartes vides de cette feature se terminent toutes par un « + Ajouter… » cliquable. Une carte « Aucun effet de règle… attendent une opération que le registre ne porte pas encore » n'a aucun geste derrière elle : c'est une promesse affichée sans bouton, l'idiome cassé, pire qu'une absence. Précédent déjà accepté : mon propre tour 1 point 5 (« Aucune région D1 — le silence n'est pas un oubli ») et le commentaire inline de `FicheEvenement.tsx` (« le silence est celui du contrat, pas une omission »). Même traitement : la section EFFETS DE RÈGLE n'existe pas dans le DOM de `FicheClimat`.

**D4 — vérifié dans le code, plus grave que ce que le tech-lead a dit.** `EYEBROW_SECTION` égale partout le `titre` de `sections.ts` en capitales (`QUÊTES`↔Quêtes, `INDICES`↔Indices, `ÉVÉNEMENTS`↔Événements, `JALONS & FINS`↔Jalons & fins). Le `titre` de la section 9 est **« Conditions »**, pas « Climats ». Mon eyebrow `CLIMATS` était faux sur les deux axes, pas un seul : fichier ET eyebrow. Je m'aligne sur `PanneauConditions.tsx` et je corrige l'eyebrow en `CONDITIONS`. Aucune coexistence à arbitrer.

**D2/D3 — j'accepte les deux, contrat figé en annexe.** Le placeholder de prose est caduc, remplacé par un `Stepper`. `manifestation` entre : son hint suit le patron déjà écrit pour `ÉNONCÉ` de `FicheJalon`, et son dépassement de budget ne demande **aucun composant neuf**.

**Statut de mon objection tour 1 : retirée.**

---

## ANNEXE — Contrat de design FIGÉ

### Fichiers
`PanneauConditions.tsx` (liste) + `FicheClimat.tsx` (fiche). Eyebrow : `EYEBROW_SECTION = 'CONDITIONS'` (aligné sur `sections.ts` titre « Conditions »).

### Colonne liste
- `<ul>` de `ListRow` (`title={localiserEntite('climat', climat, index)}`, `subtitle={climat.id}`) + deux `IconButton` frères Monter/Descendre, libellés `` `Monter le climat « ${nom} »` `` / repli `` `Monter le climat n°${index+1} (sans nom)` ``, symétrique pour Descendre. `size={HIT_TARGET_MIN}`.
- Bouton : **`+ Ajouter un climat…`** (`boutonAjouterStyle`), commit immédiat `{ id: frapperIdentifiant('climat'), effets_regles: [] }`, focus renvoyé sur NOM.
- État vide : glyphe `❏` (`emptyGlyphStyle`, `aria-hidden="true"`) + **« Aucun climat — cliquez « + Ajouter un climat… » pour commencer. »** (`emptyTextStyle`).

### Fiche `FicheClimat`, champ par champ dans l'ordre

**1. NOM DU CLIMAT**
- `Field`, `label="NOM DU CLIMAT"`, `hint="interne"`, mono-ligne, `placeholder="Tempête de cendres"`.
- `inputRef={nomInputRef}` (cible du focus d'ajout). `Entrée` → `blur()` (commit). `onBlur` → commit.

**2. DURÉE** — remplace intégralement le contrat prose du tour 1.
- Pas de `Field`. Bloc à deux états, patron *réimplémenté* de `BlocPlanActions.tsx:240-256` (jamais importé), réutilisant `boutonAjouterStyle` déjà présent dans ce fichier-ci (zéro CSS neuf).
- `climat.duree === undefined` → `<button type="button" onClick={() => onChangeDuree(DUREE_MIN)} style={boutonAjouterStyle}>+ Poser une durée…</button>`
- `climat.duree !== undefined` → `<Stepper label="DURÉE" value={climat.duree} min={DUREE_MIN} onChange={onChangeDuree} />` — **`min` seul, jamais `max`**.
- Légende sous les deux états, `style={legendeStyle}` : **« interne — nombre de pas d'horloge avant l'extinction du climat ; consommé par la feature n° 14 (moteur-horloge) »**.
- Aucun repli de lecture `?? DUREE_MIN` (KR-013).

**3. MANIFESTATION** — champ neuf.
- `Field`, `label="MANIFESTATION"`, `hint="IA — injecté au modèle tant que ce climat est actif"` (patron de `ÉNONCÉ` sur `FicheJalon.tsx:112`), `multiline`, `rows={2}`.
- `placeholder="Des cendres tièdes tombent sans relâche, recouvrant toits et pavés d'un gris mat et silencieux."` (15 mots — sous le budget de 20).
- Même idiome brouillon-puis-commit-au-blur que NOM.
- **Aucun compteur de mots dans l'UI.** Le dépassement surface via le bandeau ci-dessous.

**4. Bandeau d'avertissement** (patron `FicheJalon.tsx:125-130`)
- `avertissements: DossierIssue[]` — prop reçue du panneau, calculée **en ligne** depuis `validateDossier(dossier).warnings.filter(...)`, jamais un `useEffect`.
- Rendu seulement si `avertissements.length > 0` : `<div role="status" style={bandeauAvertissementStyle}><p style={eyebrowAvertissementStyle}>ENREGISTRÉ, AVEC AVERTISSEMENT</p><IssueList issues={avertissements} /></div>`.

**5. Aucune section EFFETS DE RÈGLE** — ni `EditeurEffets`, ni carte vide, ni texte. Absence totale du DOM.

**6. Bandeau de refus** — identique aux quatre fiches précédentes : `role="status"`, eyebrow **« CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ »**, `IssueList` si `refus`, sinon **« Ce dossier n'existe plus — il a été supprimé ailleurs pendant que vous l'éditiez. »**

**7. Aucun bouton de retrait de fiche** — hors périmètre.

### Tokens (tous déjà nommés dans `styles.ts`, zéro token neuf)
`--space-2/3/6/8/10`, `--font-mono`, `--font-ui`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--fs-h1`, `--text-label`, `--text-muted`, `--text-faint`, `--text-body`, `--track-eyebrow`, `--lh-body`, `--border-field`, `--r-md`, `--r-xl`, `--surface-inset`, `--accent`, `--accent-bg`, `--bad`, `--hit-target`.

### Parcours clavier
Tab : ligne(s) de la liste → Monter/Descendre → `+ Ajouter un climat…` → `Card` : NOM → DURÉE (`+ Poser une durée…` **ou** le `Stepper`) → MANIFESTATION → bandeau d'avertissement (hors flux Tab) → bandeau de refus. `Entrée` dans NOM committe (blur) ; dans MANIFESTATION (`multiline`) insère un saut de ligne. Focus revient sur NOM après un ajout.
