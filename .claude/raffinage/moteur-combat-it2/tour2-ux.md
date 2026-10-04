# Tour 2 — UX · moteur-combat it2

## Note

**RÉPONSES NOMMÉES**
- **TL O1** (second écrivain `lieu_courant`) : convergence, D5 amendé supprime le déplacement.
- **PM O1** (`fleeTarget` toujours null) : convergence. L'état « désactivé » n'a plus de déclencheur.
- **QA O1** (critères non observables) : recevable, mes critères visuels les complètent.

**MES OBJECTIONS**
1. Fuir ≠ accent : **maintenue**. Style secondaire, contrat de design mis à jour.
2. Fuir hors du groupe POSTURE : **maintenue**. Ligne d'actions séparée.
3. Bouton désactivé + texte d'aide : **retirée**. `fleeTarget` est toujours null. L'état « désactivé » n'a aucun déclencheur dans le monde actuel. Le bouton existe ssi `onFuir` est fourni ET le combat est `ongoing`. Pas de disabled.
4. Bouton maison = dette : **maintenue**, non bloquante.

**NOUVEAU** — Aide de coût ajoutée : phrase fictionnelle sous le bouton Fuir expliquant le coût de la fuite (assaut gratuit du monstre). Proposé : « Le monstre porte un dernier coup. »

**VERDICT** — Réserves, veto levé. Badge FUITE obligatoire.

## Contrat de design mis à jour

- **Placement** : ligne d'actions frère de POSTURE. `flex`, `gap: var(--space-5)`. Jouer en `flex: 1`, Fuir en `flexShrink: 0`.
- **Libellés** : bouton `Fuir ↪`, `aria-label="Fuir le combat"`, badge `FUITE` (tone neutral).
- **Style Fuir** : `--surface-card`, `--text-strong`, `--border-card`, `--r-xl`, `--font-ui`, `--fs-body`, `--fw-semibold`, `HIT_TARGET_MIN`. Pas d'accent, pas de `--bad`.
- **États** : actif (`onFuir` fourni, combat `ongoing`), absent (issue terminale ou `onFuir` absent).
- **Issue hero-fled** : Badge FUITE neutral + bouton Continuer avec focus.
- **Clavier** : Tab → SegmentedControl → Jouer → Fuir. Pas de raccourci global.
- **Aide de coût** : « Le monstre porte un dernier coup. » en `--text-muted`, `--fs-small`, sous le bouton.
