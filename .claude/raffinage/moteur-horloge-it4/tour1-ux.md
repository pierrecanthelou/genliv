## UX Designer — moteur-horloge it4 — tour 1

**RISQUE** : le bandeau est le seul endroit où l'horloge devient lisible. Trois dérives possibles : un `nom` de climat pris pour une prose de joueur, le mot « tour » qui fuit dans l'interface, un composant maison pour « CLIMAT ».

**OBJECTION 1** : la docstring de `BandeauHeros.tsx` dit « registre joueur ». PAS #n et CLIMAT · {nom} sont du registre interface (mono, MAJUSCULES). Le `nom` est interne. La prose que le joueur lit est `manifestation`, jamais montrée au bandeau. La docstring doit être corrigée.

**OBJECTION 2** : `session.horloge.tour` existe sous ce nom. L'étiquette visible est PAS. La prop s'appelle `pas`, jamais `tour`, parce que types.ts:1404 réserve « tour » au combat.

**OBJECTION 3** : aucun placeholder prévu quand il n'y a pas de climat. Le bloc CLIMAT est absent sans climat — écart assumé à la règle « jamais de vide », car types.ts dit « absent ≠ vide, état calme, jamais une alerte ».

**OBJECTION 4** : la dette ne se limite pas à `1px`/`bold`. `height: '1.5em'` est un nombre magique, et le commentaire « semibold via CSS custom property » est faux (code écrit `'bold'`).

**PROPOSITION** : aucun composant neuf. Effets du climat en pastilles `[delta:cibles]` via `JournalRow` existant.

**VERDICT** : recevable sous réserve (objections 1, 2 et 4 intégrées au code livré).

---

## ANNEXE — contrat de design

### PAS #n
- Position : dernier bloc après XP, séparateur identique. Ordre : nom | PV | PE | XP | PAS #n | CLIMAT · nom.
- Forme : `PAS <span style={valeur}>#{pas}</span>`. Tokens : --text-body, --text-strong.
- Prop : `pas: number`, obligatoire. Lecture directe de `horloge.tour`, sans recalcul.

### CLIMAT · {nom}
- Position : dernier bloc, avec séparateur. Rendu seulement si `climatNom !== undefined`.
- Prop : `climatNom?: string`. Résolution en ligne par EcranPartie.
- Forme : `CLIMAT <span>·</span> <span style={valeur}>{climatNom}</span>`.
- Sans climat actif : bloc absent. Nom vide : `CLIMAT · Sans nom`. Id introuvable : bloc absent.

### Dette corrigée
- Séparateur : `width: 'var(--bw-hair)'`, `alignSelf: 'stretch'` (pas de height magique).
- Nom héros : `fontWeight: 'var(--fw-semibold)'`. Commentaire mensonger supprimé.
- Docstring corrigée.

### Tokens utilisés : --font-mono, --fs-meta, --fw-semibold, --text-strong, --text-body, --border-subtle, --surface-card, --bw-hair, --space-2, --space-3, --space-7.

### Journal role=moteur : climat_active : <id> (avec deltas), climat_eteint : <id> (sans deltas). Même registre que etape_bloquee.
