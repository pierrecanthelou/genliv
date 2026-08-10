RISQUE — le seul choix réel du Select tant que la feature n° 4 (Lieux) n'est pas livrée est `{lieu.amorce (sans nom)}` : un menu à une seule option lit comme un contrôle cassé ou décoratif, pas comme le « choisir le lieu de départ parmi ceux existants » que promet la définition — risque direct sur la règle des états vides que je porte.

OBJECTION — la définition fixe le mécanisme (Select généralisé, `localiserEntite()`) mais aucun texte : label, hint, placeholder du panneau Départ, traitement du cas à une seule option, et registre du texte d'ouverture ne sont écrits nulle part. Sans ça, le lot feature invente au clavier, et perd la discipline à deux registres que l'it1 avait posée (hints « interne » / « lue par le joueur » du Canon, bandeau de refus, pas de compteur hors périmètre).

PROPOSITION — contrat de design complet en annexe : libellés et hint exacts, placeholder repris tel quel de `dossier-minimal.json` (jamais inventé), réutilisation identique du bandeau de refus de it1 (même eyebrow), Select sans hint (`lieu_id` hors registre de prose, cadrage point 10), et **aucun compteur de mots** sur `texte_ouverture_joueur` — absent de `BUDGETS_DE_MOTS` (`tables.ts`), copier le compteur du Canon serait une contrainte fictive. Plus une légende discrète, tokens seuls, pour le cas à une option (voir annexe), au lieu de laisser le Select seul face à un unique choix muet.

VERDICT — recevable sous réserve : le plan reprend les libellés/hints/placeholders de l'annexe mot pour mot, n'ajoute ni compteur ni Select désactivé, et rend explicitement le cas à une seule option.

---

**ANNEXE — contrat de design PanneauDepart**

Patron : reproduit `PanneauCanon.tsx` à l'identique pour le layout — `pageStyle` (padding `var(--space-8)`, `flex:1`, `overflowY:auto`) → `Card` → `champsStyle` (`display:flex; flex-direction:column; gap:var(--space-6)`).

**Champ 1 — Select lieu de départ**
- Composant `Select` (`brain/components/Select.tsx`), pas de composant maison.
- `label` = `"LIEU DE DÉPART"` (mono, uppercase — le composant applique déjà `--font-mono`/`--fs-eyebrow`/`--track-eyebrow`, ne pas dupliquer le style).
- Pas de `hint` (référence technique, hors registre de prose — cadrage point 10).
- `options` = `dossier.monde.lieux.map((lieu, i) => ({ value: lieu.id, label: localiserEntite('lieu', lieu, i) }))`, dans l'ordre du tableau (même index que `localiserEntite`, jamais retrié — un tri qui désynchronise l'index romprait le libellé de repli).
- `value` = `brouillon.lieu_id` (ou lecture directe du dossier, à trancher tour 2).
- Commit : `onChange` commite **immédiatement** via `dossiers.update()` (le composant `Select` n'expose pas d'`onBlur` — ne pas en ajouter un côté panneau).
- **Cas à une seule option** (`options.length === 1`) : une légende sous le Select, texte exact : `« Un seul lieu existe pour l'instant — ajoutez-en d'autres depuis la section Lieux. »`, tokens `font-family: var(--font-mono); font-size: var(--fs-meta); color: var(--text-faint)`, `margin-top: var(--space-2)` (même famille que `compteurStyle` de PanneauCanon, sans le rôle de compteur).

**Champ 2 — texte d'ouverture**
- `Field` multiline, `label="TEXTE D'OUVERTURE"`, `hint="lue par le joueur, mot pour mot"`, `rows={5}`.
- `placeholder` (jamais inventé, repris de `dossier-minimal.json`) : `"Vous poussez la porte de l'auberge du Fanal ; la salle se tait."`
- Commit au blur, même idiome que `handleBlurSynopsis`.
- **Aucun compteur de mots** — `charpente.depart.texte_ouverture_joueur` n'est pas dans `BUDGETS_DE_MOTS`.

**Refus** : même composant, même microcopie que it1 — `role="status"`, eyebrow `"CE CHANGEMENT N'A PAS ÉTÉ ENREGISTRÉ"` (couleur `var(--bad)`), `IssueList`, brouillon jamais réinitialisé.

**Clavier** : `<select>` natif + `<textarea>` natifs — Tab traverse dans l'ordre DOM (Select puis Field), pas de modale donc pas d'Échap à gérer ; Entrée dans le textarea insère un saut de ligne (comportement attendu, le commit se fait au blur, comme le Canon).

**Icônes/couleurs** : aucune nouvelle — pas de badge, pas d'accent décoratif ; `--accent` n'apparaît nulle part dans ce panneau (pas de sélection multiple, pas d'action primaire).
