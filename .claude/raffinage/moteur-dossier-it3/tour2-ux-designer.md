# Tour 2 — ux-designer — moteur-dossier it3

```
RÉPONSE     — Au narratif (X-4) : je retire l'extension de vocabulaire aux `PredicatId`
et prends mon repli `jalons_atteints : jalon.<id>`, une seule entrée. J'ajoute les effets
en pastilles `[delta:cible]` sur cette même ligne, une par élément de `deltas[]`, sans
filtrage — y compris `atteindre_jalon`, redondant avec `texte` mais fidèle au constat ;
filtrer ouvrirait une règle éditoriale non actée. Contrairement à mon tour 1,
`JournalRow.tsx` CHANGE : un second bloc conditionnel après `texte`, même style que
`[origine]` (`metaJournal` : `--fs-meta`/`--text-faint`), zéro token neuf.

MES OBJECTIONS
- Objection tour1 (lisibilité + extension vocabulaire) → RETIRÉE : les pastilles
  résolvent la lisibilité ; l'extension répondait à un problème que le repli couvrait déjà.
- REJETÉ 1 (enonce_texte verbatim) → MAINTENUE.
- REJETÉ 2 (3e rôle RoleJournal) → MAINTENUE.
- REJETÉ 3 (accent/couleur sémantique) → MAINTENUE.
- REJETÉ 4 (panneau/compteur séparé) → DURCIE EN VETO : si `JalonsAtteints.tsx` rend
  `enonce`, c'est réciter une prose `'ia'` sans lecteur — faute de registre.
- REJETÉ 5 (deltas non rendus, KR-109) → RETIRÉE : les pastilles leur donnent un lecteur
  humain nommé.
- REJETÉ 6 (ligne dédiée `sans_effet`) → MAINTENUE : pastille uniforme, pas de ligne.
- REJETÉ 7 (ListRow) → MAINTENUE.

POSITION
X-2 — Les lignes de journal suffisent ; aucun besoin de la projection ni d'`enonce_texte`.
X-3 — `play-mode` n'ouvre que `JournalRow.tsx` (modifié) ; zéro `JalonsAtteints.tsx` ; le
critère de rendu du PM est satisfait par l'entrée #3 du journal, visible et testable en RTL.
X-4 — Repli `jalons_atteints`, une entrée, effets en pastilles — voir RÉPONSE.

VERDICT      — recevable sous réserve : le plan retient `play-mode` = `JournalRow.tsx`
seul (pas de `JalonsAtteints.tsx`, pas de consommation de la projection) ; sinon le veto
REJETÉ 4 s'arme.
```

# ANNEXE — Contrat de design FINAL

## 1. UNE seule ligne neuve, pas deux

| # | `role` | `texte` | `origine` | pastilles `deltas[]` | Badge |
|---|---|---|---|---|---|
| 1 | `joueur` | `> ALLER lieu.val-cendre` | *(absent)* | — | `↪ JOUEUR` |
| 2 | `moteur` | `lieu_courant : lieu.le-fanal → lieu.val-cendre` | `'aller'` | — | `↻ MOTEUR` |
| 3 | `moteur` **(NEUF, unique)** | `jalons_atteints : jalon.premiere-nuit` | *(absent)* | `[atteindre_jalon:jalon.premiere-nuit] [reveler_indice:indice.sceau-brise]` | `↻ MOTEUR` |

Les trois portent le **même `tour`**. **Une seule** entrée neuve par pas (correction de mon tour 1, qui en proposait deux) : le compteur d'entrées/pas reste borné, ce qui sert directement le motif du narratif (~187 o/pas).

## 2. Format exact de la pastille

Gabarit : `[{delta_id}:{cibles.join(',')}]` — mono, `metaJournal`, identique à `[origine]`.
Une pastille **par élément** de `entree.deltas`, **dans l'ordre du tableau**, **sans filtrage** (y compris `atteindre_jalon`, qui répète l'identifiant de `texte`), **sans distinction visuelle** entre `'applique'` et `'sans_effet'` — uniforme, dev-débogueur, constat complet (KR-248).

```
jalons_atteints : jalon.premiere-nuit  [atteindre_jalon:jalon.premiere-nuit] [reveler_indice:indice.sceau-brise]
```

## 3. Fichiers touchés — amendé

- **`JournalRow.tsx` — MODIFIÉ** *(correction de mon tour 1, qui le disait inchangé)* : un second bloc conditionnel après `<span>{texte}</span>` :
  ```tsx
  {entree.deltas !== undefined && entree.deltas.map((d, i) => (
    <span key={i} style={metaJournal}>[{d.delta}:{d.cibles.join(',')}]</span>
  ))}
  ```
  Réutilise `metaJournal` (déjà défini) — **zéro `CSSProperties` neuf**.
- **`EcranPartie.tsx` — inchangé** : `session.journal.map(...)` reste générique.
- **`deplacement.test.tsx`** : à vérifier par le lot — si son scénario `ALLER` déclenche déjà `jalon.premiere-nuit`, l'assertion de forme change de **contenu**, pas de composant.
- **`JalonsAtteints.tsx` : N'EXISTE PAS, ne se crée pas.**

**S'ouvre dans `play-mode`** : `JournalRow.tsx` + `deplacement.test.tsx`.
**Ne s'ouvre PAS** : `EcranPartie.tsx`, tout composant neuf, tout consommateur de `projeterJalonsAtteints`/`JalonAtteint` dans `src/features/**`.

## 4. Textes visibles

| Élément | Gabarit | Registre | Qui compose |
|---|---|---|---|
| Ligne « jalon atteint » | `jalons_atteints : {jalon_id}` | dév.-débogueur | le moteur (`brain/dossier/`) |
| Pastille effet | `[{delta_id}:{cibles.join(',')}]` | dév.-débogueur | `JournalRow.tsx`, depuis `entree.deltas` — **aucun littéral** |
| Badge | `↻ MOTEUR` (inchangé) | — | code existant |

**Aucun texte neuf n'est un littéral de composant.**

## 5. Jetons — aucun jeton neuf

Tous déjà utilisés dans `JournalRow.tsx` (vérifiés à la lecture).

## 6. Discipline de l'accent — inchangée

`--accent`, `--good`, `--bad` : **aucun usage**, y compris pour distinguer `'applique'` / `'sans_effet'`.

## 7. États

- **Défaut** : ligne 3 dès que le moteur l'a écrite, même `tour` que sa cause.
- **Vide** : aucun jalon atteignable ou vrai → aucune ligne 3. Absence normale.
- **Idempotence** (2ᵉ jalon redemandant le même `reveler_indice`) : **sa propre ligne 3** (autre `jalon_id`), pastille identique en apparence — pas de distinction visuelle.

## 8. Clavier — inchangé.

## 9. REJETÉ — statut final (BUG-082)

| # | Rejeté | Statut |
|---|---|---|
| 1 | `enonce_texte` verbatim, même en dev-débogueur | MAINTENUE |
| 2 | Un 3ᵉ membre de `RoleJournal` | MAINTENUE |
| 3 | Couleur d'accent/sémantique pour le jalon ou pour distinguer `effet` | MAINTENUE |
| 4 | Un composant `JalonsAtteints.tsx` consommant la projection | **VETO** — réciterait `enonce_texte` sans lecteur légitime |
| 5 | Rendre `journal[].deltas` dans `JournalRow` (KR-109) | **RETIRÉE** — les pastilles lui donnent un lecteur humain nommé |
| 6 | Une ligne DÉDIÉE pour un delta `'sans_effet'` | MAINTENUE — pastille uniforme |
| 7 | Un `ListRow` | MAINTENUE |
| 8 ✦ | **Étendre le vocabulaire aux `PredicatId`** *(ma propre proposition)* | **RETIRÉE** — un registre clos ne s'étend pas pour un cas que le repli couvrait déjà |

## 10. Décisions en autonomie

- **Filtrer `atteindre_jalon` des pastilles** (redondant avec `texte`) → **je ne filtre pas** → l'inverse exigerait une règle éditoriale non actée et fragile dès qu'un jalon chaîné change de forme.
- **Distinguer `'applique'`/`'sans_effet'` visuellement** → **aucune distinction** → l'inverse réintroduirait une couleur sémantique par la bande, pour un cas rare que personne n'a demandé.
- **Ordre des pastilles** → ordre du tableau `deltas[]` → un tri alphabétique romprait la correspondance avec l'ordre causal que le reste du journal respecte.
- **Une seule entrée neuve par pas** → **adopté du narratif** → conserve l'invariant de densité (~187 o/pas) que mon tour 1 mettait en risque.

## 11. Instrument recommandé

Aucune règle ESLint neuve (risque **sémantique**, hors portée AST). Le test de sérialisation du tour 1 s'étend aux **pastilles** : aucune sous-chaîne de `cibles` ne doit provenir d'un champ `'auteur'`/`'ia'` — seuls des identifiants stables y entrent, jamais un mot tapé par l'auteur.
