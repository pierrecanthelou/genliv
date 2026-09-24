# Tour 2 — qa — moteur-dossier it2

RÉPONSE — **narratif** (rejeu reformulé : journal du rejeu comparé champ à champ à celui de la voie nominale) : **ne change PAS mon verdict**. Aucune entropie n'existe toujours en it2 (confirmé). Le seul bug capable de faire diverger un rejeu-pur d'une exécution UI dans une architecture synchrone/pure — un handler mémoïsé (`useCallback`) fermé sur un `session` obsolète (stale closure, double soumission) — est déjà intercepté par `react-hooks/exhaustive-deps: 'error'`, non contournable (CLAUDE.md), **AVANT** jest. Un test de comparaison de journaux testerait le linter, pas le code : même défaut que l'immutabilité contre `tsc`. **Maintenu : aucun critère de rejeu en it2, pas de C7.**
**tech-lead T-4** : sans objet puisqu'aucun critère de rejeu n'est retenu — accord de principe si un jour écrit (pliage dans le test, jamais un `rejouer()` de production).
**tech-lead § E** : **MESURÉ** — le précédent existe bien (`UIPreferencesService.test.ts:103-115`, test « is NEVER cloud-synced ») mais **SANS contre-épreuve**. Recopiable seulement en ajoutant, dans le même test, une écriture de dossier qui fait monter `pendingCount()` à 1 (motif `.toBe(1)` déjà présent dans `CloudSyncService.test.ts:181`) — sinon l'assertion `.toBe(0)` reste vraie par construction (`queuePush` sort tôt sans transport, M-5) et l'instrument ne mesure rien.

MES OBJECTIONS
- **RISQUE 1** (mutation d'« aller » sans fichier nommé) : **RETIRÉE** — `commandes.ts` nommé et mesuré (M-1/M-2, tech-lead L1).
- **RISQUE 2** (port à 1 appelant réel) : **MAINTENUE**, mais servie par C6 tel qu'écrit noir sur blanc (T-2/T-3 aligné : `ecrire` seul).
- **RISQUE 3 + OBJECTION** (replay sans source d'entropie) : **DURCIE** — voir RÉPONSE ; en plus, le critère d'IMMUTABILITÉ que j'avais proposé en repli est lui aussi **RETIRÉ du jest** (redondant avec `tsc`) et redescendu en heuristique de revue.
- **Plafond à 6 critères** : **MAINTENU à 6** (C1–C6, inchangé).

MESURES
- `src/brain/dossier/session.ts` : `EtatSession`/`EtatMonde` sont **entièrement `readonly`** (scalaires, `readonly T[]` sur les listes, `Readonly<Record<string, EtatPnj>>` pour `pnj`). `tsc --noEmit` bloque déjà toute réassignation ou `.push()` direct. Il ne reste à prouver qu'un **CONTOURNEMENT délibéré** (`as any`, `Object.assign` via cast). **Conclusion tranchée : le critère n'entre PAS comme test jest ; il entre en heuristique de revue** (`rg -n "as any" src/brain/dossier/commandes.ts src/brain/MagasinDeSession.ts` → zéro attendu, écrit noir sur blanc dans la revue).
- **Fixtures** : `dossier-minimal.json` — 1 seul lieu, `lieu.val-cendre.acces = ['lieu.val-cendre']` (auto-référence légale, sert **C3 tel quel**). `dossier-reference.json` — `lieu.foyer-du-guet.acces = ['lieu.marche-des-cendres', 'lieu.tour-effondree']` (2 accès, **cible en position 1** : sert **C1 tel quel**) ; `lieu.tour-effondree.acces` est **absent** alors que `foyer-du-guet → tour-effondree` existe (**asymétrie réelle** : sert **C2 tel quel**, en partant de `tour-effondree`). **Zéro fixture neuve, zéro fixture modifiée** pour C1/C2/C3 ⇒ `couverture.test.ts`, `tourzeroOracle.test.ts`, `sessionCouverture.test.ts` restent verts sans qu'aucun geste ne les touche.
- `moteurSansIA.test.ts` : `PLANCHER_DE_NON_VACUITE = 20` pour 47 fichiers mesurés. Fichiers neufs d'it2 **dans le périmètre balayé** : `commandes.ts` + `CadrePartie.tsx` + `EcranRefus.tsx` + `ConsoleCommandes.tsx` + `JournalRow.tsx` = **+5** (`MagasinDeSession.ts` est dans `src/brain/`, **pas** `src/brain/dossier/` : hors périmètre). Total ≈ 52 : **le test reste vert sans aucun geste**.
- **Mutant C5** : `defineRegistre` (`identifiers.ts:27-30`) est `<V>() => <K extends string>(map) => map` — **aucun `as const`, aucun `Object.freeze`**, l'objet renvoyé est mutable à l'exécution. Le mutant est donc écrivable **directement dans le test**, sans `jest.mock` : `(COMMANDES as any).sauter = { label: 'saute', verbe: 'SAUTER', refKinds: ['lieu'] }` avant d'appeler `analyserSaisie('COURIR lieu.x')` et de vérifier que le message liste bien `ALLER, SAUTER`.

VERDICT — **recevable sous réserve** : (1) la contre-épreuve § E est ajoutée dans le même test que le précédent recopié ; (2) le critère d'immutabilité est redescendu en heuristique de revue (grep), jamais un test jest ; (3) aucun critère de rejeu n'est ajouté en it2.

---

## ANNEXE

### Critères d'acceptation FINAUX (6)

**C1 — Déplacement réussi le long d'un accès orienté, cible non-première**
ÉD `dossier-reference.json`, session synthétique `lieu_courant = 'lieu.foyer-du-guet'` (fixture réelle, `acces = ['lieu.marche-des-cendres', 'lieu.tour-effondree']`) · Q `ALLER lieu.tour-effondree` (2ᵉ élément) · A `monde.lieu_courant === 'lieu.tour-effondree'`, `lieux_visites` contient la cible. Niveau : unité.
Séparateur : `const cible = lieu?.acces?.[0]` rougit (prendrait `marche-des-cendres`).

**C2 — Refus sur une arête asymétrique**
ÉD `dossier-reference.json`, session `lieu_courant = 'lieu.tour-effondree'` (`acces` **absent** dans la fixture réelle, bien que `foyer-du-guet → tour-effondree` existe) · Q `ALLER lieu.foyer-du-guet` · A refus `acces_absent`, `lieu_courant` inchangé. Niveau : unité.
Séparateur : `const estAccessible = lieuActuel.acces?.includes(cible) || lieuCible?.acces?.includes(lieuActuel.id)` rougit.

**C3 — Auto-référence légale, sans doublon**
ÉD `dossier-minimal.json`, session `lieu_courant = lieux_visites = ['lieu.val-cendre']` (`acces = ['lieu.val-cendre']`) · Q `ALLER lieu.val-cendre` · A succès, `lieux_visites` reste `['lieu.val-cendre']`, `horloge.tour` +1. Niveau : unité.
Séparateur : `const lieux_visites = [...session.monde.lieux_visites, cible]` rougit (doublon).

**C4 — `JournalRow` rend joueur/moteur, remplace l'état vide** — inchangé du tour 1. Niveau : composant RTL.

**C5 — Refus de commande inconnue, liste DÉRIVÉE du registre**
Mutant obligatoire, désormais concret : `(COMMANDES as any).sauter = { label: 'saute', verbe: 'SAUTER', refKinds: ['lieu'] }` posé en tête du test (possible car `defineRegistre` ne gèle rien) ; le message doit lister `ALLER, SAUTER`. Niveau : unité (`analyserSaisie`) + composant RTL (rendu du message).

**C6 — Port de stockage : `ecrire` a un appelant, `lire`/`effacer` non consommés**
Inchangé du tour 1, **plus la contre-épreuve mesurée** : le test recopié de `UIPreferencesService.test.ts:103-115` doit AUSSI exercer une écriture de dossier dans le même test pour faire monter `pendingCount()` à 1 (motif `CloudSyncService.test.ts:181`), sinon l'assertion `.toBe(0)` sur la session est vacuement vraie.

### Vérifié par personne — à écrire noir sur blanc dans la revue
- **KR-242** : aucun critère de rejeu déterministe en it2 — aucune source d'entropie à séparer, et le seul bug plausible (stale closure) est couvert par ESLint, pas par jest.
- **Immutabilité runtime de `S0`** : prouvée par `tsc` (types `readonly`) + heuristique de revue (grep `as any`) — **aucun test jest ne la prouve**.
- **D-6 / infobulle CTA désactivé** : toujours reporté (relevé navigateur manquant).
- **`memoire` reste `null`** : non exercé par un test dédié, simple absence vérifiée par le typage.

### REJETÉS (BUG-082)
- REJETÉ — critère de rejeu littéral « même résultat » : aucune entropie à séparer.
- REJETÉ — critère de rejeu reformulé façon narratif (journal comparé champ à champ) comme test jest en it2 : redondant avec `react-hooks/exhaustive-deps: 'error'`, testerait le linter.
- REJETÉ — `rejouer()` de production : un seul appelant (KR-109, T-4).
- REJETÉ — critère d'immutabilité comme test jest : redondant avec `tsc` sur des types entièrement `readonly`.
- REJETÉ — port à 3 méthodes en it2.
- REJETÉ — fixture à un seul accès ou cible en position 0 pour C1/C2.
- REJETÉ — liste de commandes testée avec un seul verbe, sans mutant à deuxième verbe.
- REJETÉ — précédent § E recopié sans contre-épreuve : assertion vacuement vraie (M-5).

### Fichiers mesurés ce tour
`tour1-*.md` (les 6), `src/brain/UIPreferencesService.test.ts` (80-140), `src/brain/CloudSyncService.test.ts` (grep `pendingCount`), `src/brain/dossier/session.ts`, `__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json`, `src/features/play-mode/tests/moteurSansIA.test.ts`, `src/brain/dossier/identifiers.ts:27-30`.
