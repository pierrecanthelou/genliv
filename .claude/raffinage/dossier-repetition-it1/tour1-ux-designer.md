# dossier-repetition it1 — UX — Tour 1

**RISQUE** — Le panneau « aucun blocage (message positif) » affirme plus que le code ne sait. Un seul parcours aléatoire de 20 pas ne prouve pas l'absence de blocage. Le vert (`--good`) est réservé aux jets : l'utiliser serait un contresens sémantique.

**OBJECTION**
1. `Chip` et `CardHead` n'existent pas dans `brain/components`. Utiliser `Badge tone="neutral"` pour « Parcours n°{n} », plus eyebrow + titre en styles locaux (précédent Copilote).
2. « 4 états » est faux. Les états réels : jamais lancé, refus « non jouable », refus « ouverture à écrire », résultat.
3. « non jouable → Jalons & fins » trop étroit. La cible est `bloquants[0].section`.
4. Vocabulaire : « arrêt » pour tout motif, « impasse » pour le seul motif impasse. « Blocage » disparaît de l'interface.
5. « Échap ferme » ne s'applique pas : ce n'est pas une modale.

**PROPOSITION**
- État local `graine: number | null`. Résultat dérivé en ligne (KR-310). « Relancer » = `graine + 1`.
- Le panneau affiche des noms internes (`nom`), jamais `description_joueur` ni `texte_ouverture_joueur`.
- Tous les Badges sont neutres.
- Page : colonne, `gap: var(--space-8)`, `padding: var(--space-12)`, `overflowY: auto`.

**VERDICT** — Recevable sous réserve : objections 1, 2 et 4 intégrées au contrat.

---

## ANNEXE — Contrat de design

**Montage.** Prop sœur `panneauRepetition?: (onSelectSection) => ReactNode`. Destination `'repetition'` après Copilote. `estSectionId` exclut la 3e destination (BUG-082). Ordre Contrôles/Copilote/Répétition épinglé par test.

**Composants.** Card (shadow={false}), Badge (tone="neutral"), ListRow, boutons natifs locaux.

**Tokens.** `--surface-card`, `--surface-inset`, `--accent`, `--accent-bg`, `--accent-line`, `--text-on-accent`, `--text-strong`, `--text-body`, `--text-muted`, `--text-label`, `--font-ui`, `--font-mono`, `--fs-eyebrow`, `--fs-body`, `--fs-title`, `--fw-semibold`, `--space-*`, `--r-md`, `--border-*`, `--hit-target`. Interdit : `--good*`, `--bad*`, valeurs en dur.

**Carte 1 — lanceur.** Eyebrow `RÉPÉTITION`. Titre `Un joueur synthétique parcourt votre dossier`. Badge `Parcours n°{n}` après lancement. Boutons : `Lancer la répétition` (accent, autoFocus) avant, `Relancer` (accent) + `Rejouer à l'identique` (neutre) après.

**Carte 2 — états.**
1. Jamais lancé : dashed `--accent-line`, fond `--accent-bg`, texte d'invite.
2. Refus non jouable : eyebrow `RÉPÉTITION IMPOSSIBLE`, message du bloquant, lien vers la section.
3. Refus ouverture : eyebrow `RÉPÉTITION IMPOSSIBLE`, lien vers Départ.
4. Résultat : eyebrow `ARRÊT — PAS {n} SUR 20`, titre/corps par motif, ListRow du lieu.

**Clavier.** Tab visuel, Entrée active, Échap sans effet.
