# Tour 2 — `ux-designer` · `dossier-fiches` it3 (contre-lecture)

## 1. Réponses nominales

**Tech-lead, OBJECTION 1** (`Partial` + `maxPV` ne compilent pas, `stats.FO ?? 0` serait une seconde source de vérité) — **j'accepte sans réserve**. Argument de typage imparable, hors de mon domaine à contester. Le schéma passe à `Record<Characteristic, number>` optionnel en bloc, total quand présent.

**Mais je refuse nommément la ligne de rendu du lot 2** : `value={(personnage.stats ?? STATS_INITIALES)[carac]}`. Elle affiche « 1 » sur les 8 Stepper **dès le montage, sans qu'aucune écriture n'ait eu lieu** — exactement la paire que **QA interdit elle-même** au critère 4 (« `FO=1` … ou `PV=3` … aucune ne doit jamais être seedée, sinon le test ne distingue pas *lu du document* de *retombé sur défaut* »). C'est mon RISQUE de tour 1 qui se matérialise dans le code de la proposition censée le clore.

**QA, critère 3** (« sans EN réglée, FO/AG présentes ») — sous le schéma TOTAL, cet état est **irréalisable** dans un dossier valide. À réécrire « `stats` totalement absent → PV `—` » ; tel qu'écrit, aucune fixture valide ne peut l'exercer.

## 2. Mes objections du tour 1, une à une

- **RISQUE** (Stepper ne sait pas rendre l'absence) — **maintenu comme constat, résolu comme conception** : il s'est vérifié dans le code même du tech-lead. Résolu **sans toucher `Stepper`**.
- **OBJECTION** (le goal ne tranche pas le rendu de l'absence) — **retirée** : tranchée ce tour.
- **PROPOSITION** (étendre `Stepper` à `value: number | undefined`) — **RETIRÉE, REMPLACÉE**. Sous le schéma TOTAL, `Stepper` n'est **jamais** monté quand `stats` est absent (le bloc entier bascule sur un état vide, pas un état vide *par champ*) : il ne reçoit jamais `undefined`. Zéro extension, zéro risque sur `ObjectEditor.tsx`, composant inchangé — meilleure lecture de la règle « composants avant CSS » que ma proposition de tour 1.
- **PV jamais teinté `--good`/`--bad`** — maintenu, non contesté, acquis.
- **D2** (`Stepper` absent de la liste du tech-lead) — **clos, pas d'ajout** : l'absence était correcte, pas un oubli. `Stepper.tsx` ne fait **pas** partie du lot.

**Aucun veto.** Le désaccord était un état vide mal placé, réglé par un déplacement d'échelle — du champ au bloc.

## 3. D1 tranché

**Q1 — rendu mot pour mot si `STATS_INITIALES` alimente l'affichage (proposition littérale du tech-lead).** Au montage d'un personnage jamais réglé, sans aucune interaction :

```
FORCE (FO)          1
AGILITÉ (AG)        1
DEXTÉRITÉ (DX)      1
ENDURANCE (EN)      1
INTELLIGENCE (IN)   1
INGÉNIOSITÉ (IG)    1
SENS (SE)           1
CARACTÈRE (CA)      1
PV                  3
```

**Non acceptable.** Un dossier jamais touché rend un personnage à l'apparence entièrement réglée — huit « 1 » et un PV calculé — indiscernable d'un auteur qui aurait délibérément minimisé chaque caractéristique. Viole la règle des états vides (une valeur qui a l'air réelle n'est pas une invite à agir) et le critère 4 de QA, qui interdit nommément cette paire de nombres comme fixture parce qu'elle ne prouve rien.

**Q2 — troisième forme. Oui : un état vide DE BLOC, pas de champ.**

> **Bloc « Caractéristiques », `personnage.stats === undefined`** : la grille et la ligne PV **n'existent pas**. À leur place, une seule affordance, pointillé accent, texte exact **« + Régler les caractéristiques… »** — même patron que `+ Ajouter un personnage…` déjà en production dans `PanneauPersonnages.tsx` (`boutonAjouterStyle` : `border: 1.5px dashed var(--accent)`, `background: var(--accent-bg)`, `color: var(--accent)`, `border-radius: var(--r-md)`, `min-height: var(--hit-target)`, `font-family: var(--font-ui)`, `font-size: var(--fs-body)` — sentence case, pas mono, pas majuscules : c'est une action, pas un libellé de champ).
>
> Au clic : le parent commit `{ ...p, stats: STATS_INITIALES }` **en un seul geste explicite** — les 8 clés à 1 apparaissent, mais parce que l'auteur vient de les demander, pas en silence au montage. Le bloc bascule en état « renseigné », et `stats` y est **toujours complet** : aucun état intermédiaire n'est jamais atteignable, ni en mémoire ni à l'écran.

**Coût au `Stepper` : zéro.** Il n'est monté que lorsque `stats` existe — jamais `undefined`, donc pas d'extension de type, pas de branche « — », pas de risque sur `ObjectEditor.tsx`. Strictement moins cher que ma proposition de tour 1 **et** que la lecture littérale de celle du tech-lead.

## 4. Contrat de design final

**Emplacement** : inchangé — `caracteristiques` quitte `BLOCS_VIDES`, titre **« Caractéristiques »** (déjà épinglé par test, ne pas toucher).

**Contenu — deux états exclusifs, jamais de troisième :**

```tsx
personnage.stats === undefined ? (
  <button type="button" onClick={onReglerCaracteristiques} style={boutonReglerStyle}>
    + Régler les caractéristiques…
  </button>
) : (
  <>
    <p style={legendeStyle}>Caractéristiques — jamais lues par le narrateur.</p>
    <div style={gridCaracteristiquesStyle /* display:grid, gridTemplateColumns:'1fr 1fr', gap:'var(--space-8)' */}>
      {CHARACTERISTIC_VALUES.map((c) => (
        <Stepper key={c}
          label={`${CHARACTERISTICS[c].label.toUpperCase()} (${c})`}
          value={personnage.stats[c]}
          onChange={(v) => onChangeCaracteristique(c, v)}
          min={CARACTERISTIQUE_MIN} max={CHARACTERISTIC_MAX} />
      ))}
    </div>
    <div style={pvRowStyle /* marginTop: var(--space-2), paddingTop: var(--space-5), borderTop: 1px solid var(--border-divider) */}>
      <span style={eyebrowStyle}>PV</span>
      <p style={pvValeurStyle /* font-mono, --fs-title, --fw-semibold, TOUJOURS --text-strong */}>
        {maxPV(personnage.stats)}
      </p>
      <p style={legendeStyle}>Dérivé de Force + Agilité + Endurance — jamais stocké.</p>
    </div>
  </>
)
```

**Textes exacts** : `+ Régler les caractéristiques…` · `FORCE (FO)`, `AGILITÉ (AG)`, `DEXTÉRITÉ (DX)`, `ENDURANCE (EN)`, `INTELLIGENCE (IN)`, `INGÉNIOSITÉ (IG)`, `SENS (SE)`, `CARACTÈRE (CA)` (dérivés de `CHARACTERISTICS`, KR-117) · `PV` · `Caractéristiques — jamais lues par le narrateur.` (répond à D9, **une seule fois, échelle du bloc, pas du champ**) · `Dérivé de Force + Agilité + Endurance — jamais stocké.`

**Composants** : `Card`, `Stepper` (**non modifié**). Le CTA est un `<button>` natif stylé, même patron que celui déjà en production — pas un composant neuf.

**États :**

| État | Rendu |
|---|---|
| Vide (`stats` absent) | CTA seule, remplace intégralement grille + ligne PV |
| Renseigné (`stats` présent — toujours 8 clés) | légende de bloc + grille 2×4 (valeurs réelles 1..12) + ligne PV (nombre réel, toujours `--text-strong`) |
| Survol/actif CTA | identique à `+ Ajouter un personnage…`, aucun token neuf |
| Survol/actif Stepper | hérité d'`IconButton`, inchangé |
| Erreur | aucune — `clamp` interdit toute valeur hors 1..12 |
| Chargement | sans objet |

**Clavier** : vide → 1 arrêt (le CTA), Entrée/Espace natifs ; après le clic, le CTA quitte le DOM et le focus se pose sur « Diminuer FORCE (FO) », premier contrôle du bloc qui vient d'apparaître. Rempli → 16 arrêts en ordre DOM (FO, AG / DX, EN / IN, IG / SE, CA). Ligne PV non focusable. Pas de modale, pas d'Échap.

**Registres de langue** : bloc entièrement interface/rédaction, aucune prose fiction. Le seul risque de confusion (l'axe moteur/narrateur, hors de l'axe joueur/interne déjà outillé par `HINT_*`) est couvert par la légende de bloc, à l'économie — une ligne, pas huit.

**Fichiers** : `FichePersonnage.tsx`, `PanneauPersonnages.tsx` (nouveau `handleReglerCaracteristiques`, symétrique à `handleChangeCaracteristique`). **`src/brain/components/Stepper.tsx` reste HORS LOT.**
