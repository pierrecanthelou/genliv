# Tour 1 — UX · moteur-combat it2

**RISQUE** — `hero-fled` existe dans `CombatOutcome` mais aucune ligne d'ISSUE DU COMBAT ne le couvre. Une fuite afficherait une section vide. Veto (état vide).

**OBJECTION**
1. (forte) Fuir ne doit pas être accent. L'accent marque l'action primaire (« Jouer le round »). Fuir = secondaire : contour `--border-card`, fond transparent.
2. Fuir ne doit pas se loger sous « POSTURE » (KR-297). Ligne d'actions séparée.
3. Bouton disabled hors de l'ordre de Tab — l'auteur au clavier ne découvre pas pourquoi la fuite est grisée. Texte d'aide visible nécessaire.
4. Bouton maison = 3e copie d'un bouton inline. Dette, pas bloquant.

**PROPOSITION** — Voir annexe : contrat de design complet.

**VERDICT** — Réserves, veto levé si Badge FUITE, texte d'aide, ligne d'actions séparée.

## ANNEXE — Contrat de design

- **Placement** : ligne d'actions frère de POSTURE. `flex`, `gap: var(--space-5)`. Jouer en `flex: 1`, Fuir en `flexShrink: 0`.
- **Libellés** : bouton `Fuir ↪`, `aria-label="Fuir le combat"`, badge `FUITE` (tone neutral), aide désactivé `FUITE IMPOSSIBLE — aucune issue de fuite n'est définie pour ce combat.`
- **Style Fuir** : `--surface-card`, `--text-strong`, `--border-card`, `--r-xl`, `--font-ui`, `--fs-body`, `--fw-semibold`, `HIT_TARGET_MIN`. Pas d'accent, pas de `--bad`.
- **États** : actif (fleeTarget non null, ongoing), désactivé (fleeTarget null, visible + cursor not-allowed + opacity 0.5 + texte d'aide), absent (terminal).
- **Issue hero-fled** : Badge FUITE neutral + Continuer avec focus.
- **Clavier** : Tab → SegmentedControl → Jouer → Fuir. Pas de raccourci global.
