# Tour 1 — `ux-designer` · `dossier-fiches` it3

```
RISQUE      — Le bloc Caractéristiques est le premier endroit du schéma où « non renseigné »
              (clé absente de `stats?: Partial<Record<Characteristic, number>>`) doit rester
              visuellement distinct de « renseigné au plancher » (1), alors que Stepper
              (brain/components/Stepper.tsx) ne rend aujourd'hui qu'un `number`. Sans
              décision explicite, l'ouvrier soit pré-remplit silencieusement les 8 clés à 1
              au montage (viole l'idiome « additif, jamais coercé » posé par camp/objectif_id
              en it1), soit affiche « 1 » sans rien écrire — un mensonge visuel indiscernable
              d'une vraie valeur. Risque second, mineur mais réel : la tentation de teinter le
              PV dérivé en --good/--bad (lecture « jauge de vie ») violerait la règle des deux
              seules couleurs sémantiques (réussite/échec de jet) — le PV n'est le résultat
              d'aucun jet.

OBJECTION   — Le `goal` écrit « Stepper, bornes 1..CHARACTERISTIC_MAX » comme une anatomie
              close, mais ne tranche rien sur le rendu d'une caractéristique absente : la
              question ouverte du cadrage (« un Stepper ne sait pas rendre absent ») reste
              sans réponse dans la définition telle qu'écrite, alors qu'elle conditionne le
              composant lui-même, pas seulement son contenu.

PROPOSITION — Étendre Stepper de façon additive : `value: number | undefined`, affichage
              « — » en --text-disabled (token déjà commenté « disabled / placeholder glyph »)
              quand absent, --text-strong sinon ; le premier clic +/− écrit `min`, jamais une
              pré-écriture silencieuse au montage — même idiome que `SegmentedControl
              value: T|undefined` d'it1. Non cassant : l'unique consommateur actuel
              (ObjectEditor.tsx) passe toujours un nombre défini. Grille 2×4,
              `gap: var(--space-8)` (18px), motif dominant des grilles `1fr 1fr` du wireframe
              (4 occurrences).

VERDICT     — recevable sous réserve (extension Stepper actée en tour 2 avec tech-lead ;
              PV jamais teinté --good/--bad).
```

---

## ANNEXE — contrat de design

### 1. Emplacement dans l'accordéon

`BLOCS_VIDES` (`FichePersonnage.tsx`) perd son entrée `{ id: 'caracteristiques', titre: 'Caractéristiques', iteration: 3 }`. Une constante `BLOC_3_ID = 'caracteristiques'` s'ajoute à côté de `BLOC_1_ID`/`BLOC_2_ID`, avec un contenu réel inséré dans `sections` entre le bloc « Identité » et le reste de `BLOCS_VIDES.map(...)` (qui tombe à 5 entrées). Titre inchangé : **« Caractéristiques »** — déjà épinglé par `panneauPersonnages.test.tsx`, ne pas y toucher.

### 2. Anatomie exacte du contenu du bloc

Deux zones verticales, séparées par un filet (hiérarchie par bordure, jamais par ombre — règle 5) :

**(A) Grille des 8 Stepper**

```
gridStyle: { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)' }
```

Ordre DOM = `CHARACTERISTIC_VALUES` (`['FO','AG','DX','EN','IN','IG','SE','CA']`), aucun tri manuel — lecture en 4 lignes de 2 : (FO, AG) / (DX, EN) / (IN, IG) / (SE, CA).

Chaque cellule :
```tsx
<Stepper
  label={`${CHARACTERISTICS[c].label.toUpperCase()} (${c})`}
  value={personnage.stats?.[c]}
  onChange={(v) => onChangeCaracteristique(c, v)}
  min={1}
  max={CHARACTERISTIC_MAX}
/>
```
Libellés exacts, **dérivés du registre `CHARACTERISTICS`, jamais une liste recopiée** (KR-117) : `FORCE (FO)`, `AGILITÉ (AG)`, `DEXTÉRITÉ (DX)`, `ENDURANCE (EN)`, `INTELLIGENCE (IN)`, `INGÉNIOSITÉ (IG)`, `SENS (SE)`, `CARACTÈRE (CA)`.

**(B) Ligne PV dérivée**

```
pvRowStyle: { marginTop: 'var(--space-2)', paddingTop: 'var(--space-5)', borderTop: '1px solid var(--border-divider)' }
```
- Eyebrow **« PV »** — réutilise `eyebrowStyle` déjà défini dans le fichier (font-mono, `--fs-eyebrow`, `--text-label`, `--track-eyebrow`).
- Valeur : `--font-mono`, `--fs-title`, `--fw-semibold` ; couleur `--text-strong` si calculable, **`--text-disabled` si repli** (jamais `--good`/`--bad`).
- Texte du repli : **« — »**.
- Légende, sous la valeur, réutilise `legendeStyle` existant (`--font-mono`, `--fs-meta`, `--text-faint`) : texte exact **« Dérivé de Force + Agilité + Endurance — jamais stocké. »**

Dérivation, en ligne, dans `FichePersonnage` (composant pur, aucun prop ni state supplémentaire — KR-013/113) :
```ts
const { FO, AG, EN } = personnage.stats ?? {}
const pv = FO !== undefined && AG !== undefined && EN !== undefined ? maxPV({ FO, AG, EN }) : null
```

### 3. Extension de `Stepper` (brain/components/Stepper.tsx) — additive, proposée

```ts
value: number | undefined
```
- Affichage : `value === undefined ? '—' : `${prefix}${value}`` — couleur conditionnelle `--text-disabled` / `--text-strong`.
- Boutons : premier clic +/− depuis « non défini » écrit `min` (jamais un état intermédiaire ni une pré-écriture au montage) :
  - incrément : `onChange(clamp((value ?? min - 1) + 1))`
  - décrément : `onChange(clamp((value ?? min + 1) - 1))`
- `IconButton` labels inchangés (`Diminuer ${label}` / `Augmenter ${label}`) → « Diminuer FORCE (FO) », « Augmenter FORCE (FO) », noms distincts par caractéristique.
- Non cassant : seul consommateur actuel `ObjectEditor.tsx` (`value={value.reinforcementBonus?.rollBonus ?? 0}`) passe toujours un `number` défini — comportement inchangé.

### 4. Composants — rien de neuf

`Card`, `Stepper` (étendu ci-dessus). Aucun composant maison. Pas de `Field`, pas de `Select` dans ce bloc — que des nombres bornés.

### 5. Registres de langue

Bloc entièrement **interface/rédaction** : aucune prose fiction ici. Les seuls textes visibles sont des libellés mono en MAJUSCULES (`FORCE (FO)` … `PV`) et une légende technique. Aucun risque de confusion de registre sur ce bloc précis.

### 6. États

| État | Rendu |
|---|---|
| Défaut (rien renseigné) | 8 Stepper affichent « — » ; PV affiche « — » + légende |
| Partiel (ex. seul FO renseigné) | Stepper FO en `--text-strong` ; les 7 autres « — » ; PV reste « — » (3 requis non réunis) |
| Complet (FO, AG, EN renseignées ; les 5 autres optionnelles) | PV affiche le nombre en `--text-strong`/`--fs-title` |
| Survol/actif | hérité d'`IconButton`, inchangé |
| Erreur | aucune — bornes 1..12 appliquées par `clamp`, aucune saisie libre, aucune valeur hors bornes atteignable |
| Chargement | sans objet — écriture synchrone via `commit()` |

### 7. Clavier

Tab traverse la grille en ordre DOM (= ordre de lecture visuel, ligne par ligne) : 16 arrêts (2 boutons natifs `<button>` × 8 Stepper), Entrée/Espace activent nativement, aucun gestionnaire custom. La ligne PV n'est pas focusable (lecture seule, aucun `tabIndex`). Pas de modale dans ce bloc → pas d'Échap à câbler.

---

**Fichiers lus** : `specification.json`, `src/brain/characteristics.ts`, `src/brain/components/Stepper.tsx`, `ObjectEditor.tsx`, `components/index.ts`, `src/brain/index.ts`, `FichePersonnage.tsx`, `PanneauPersonnages.tsx`, `Accordion.tsx`, `design_handoff_gamebook_editor/tokens/{colors,spacing,typography}.css`, `docs/PLAN-BASCULE-IA.dc.html` (§ blocs).
