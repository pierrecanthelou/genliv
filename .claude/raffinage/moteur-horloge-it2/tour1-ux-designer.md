# UX — moteur-horloge it2 — TOUR 1

**RISQUE** — La phrase de démo promet une surface qui n'existe pas. Le journal est rendu AVANT la console, et le récit R3 est rendu PLUS BAS, dans `PlayerInputBar` (`OutcomeBlock` après le champ). « Sous le récit du narrateur » est donc faux avec `JournalRow`. Livrer la phrase telle quelle imposerait un composant neuf, que le design_contract interdit.

**OBJECTION**
1. Phrase de démo et design_contract se contredisent. Je corrige la phrase : « l'auteur lit, au journal, ce qui a changé dans le monde pendant son dernier pas ; le bandeau lui dit à quel pas il est ».
2. « PAS #n » n'est pas défini. `BandeauHeros` ne reçoit que `heros`. Il lui faut une prop `pas`. Nommée `pas`, jamais `tour` (J1).
3. « ÉTAPE BLOQUÉE » en majuscules mono est un libellé d'interface. Le journal est un relevé d'état en minuscules. Deux registres = faute. Je tranche : ligne de journal `etape_plan : <id> <k+1> bloquée`, forme existante.
4. Dette dans le fichier rouvert : `width: '1px'` et `fontWeight: 'bold'` en dur.

**PROPOSITION** — 1 prop, 1 bloc, 0 composant neuf. Correction de 2 valeurs en dur.

**VERDICT** — recevable sous réserve (objections 1 et 3 tranchées).

## ANNEXE — CONTRAT DE DESIGN

### BandeauHeros.tsx
- Prop `pas: number` requise. Rendu `PAS #{pas}` après XP avec séparateur.
- Tokens : `--text-body` (label), `--text-strong` (valeur), `--font-mono`, `--fs-meta`.
- Interdit : `--accent`, `--good`, `--bad`.
- Correction : `fontWeight: 'bold'` → `var(--fw-bold)`, `width: '1px'` → `var(--bw-hair)`.
- `PAS #0` au départ, jamais vide.

### JournalRow
- Aucune modification. Lignes moteur passent tel quel.

### EcranPartie.tsx
- `<BandeauHeros … pas={session.horloge.tour} />`.

### Textes exacts
- Bandeau : `PAS #{pas}`
- Avancement : `etape_plan : <id> <k+1> → <n+1>` (inchangé it1)
- Bloqué : `etape_plan : <id> <k+1> bloquée` (une seule fois, égalité stricte)

### Tests BandeauHeros.test.tsx
- `PAS #7` pour `pas={7}`, `PAS #0` pour `pas={0}`
- Pas de « tour » dans le texte
- Pas de `--good`/`--bad`/`--accent`
- Plus de `1px` en dur

## Décisions prises en autonomie
- Phrase corrigée (journal, pas « sous le récit »)
- Bloqué = ligne journal, pas label d'interface
- Prop nommée `pas`, requise
- `PAS #0` au départ
- Bloqué émis une seule fois (égalité stricte)
- Nettoyage `1px`/`bold` dans le même lot
