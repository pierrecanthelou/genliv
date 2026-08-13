# Tour 1 — `qa` · `dossier-fiches` it3

```
RISQUE      — c'est le premier champ à bornes NUMÉRIQUES du schéma (1..CHARACTERISTIC_MAX)
              et le premier champ en forme Record<clé fixe, valeur>
              (Partial<Record<Characteristic, number>>) que couverture.test.ts descend clé
              par clé. Le précédent d'it2 (« la prose ne touche ni tables.ts ni
              validate.ts ») ne se transpose PAS ici : rien ne garantit qu'un champ borné
              + une nouvelle forme de Record traversent le lot contrat aussi bon marché.

OBJECTION   — destinations.ts n'a AUCUNE ligne ni AUCUN commentaire réservé pour
              `monde.personnages[].stats.*` (contrairement à contre_mesures, déjà arbitré
              en commentaire). Comme `stats` est Partial, le nombre de chemins terminaux
              exigés par couverture.test.ts dépend entièrement de CE QUE LES FIXTURES
              INSTANCIENT — un dev-contrat qui ne seed qu'une clé fait passer la garde au
              vert en laissant 7 chemins de production réels sans audience déclarée. Le
              critère #11 (BUG-064) n'est pas non plus opérationnalisé pour ce bloc dans le
              plan : aucune valeur seedée n'est nommée.

PROPOSITION — (1) trancher AU CADRAGE, pas au dev-contrat : les DEUX fixtures instancient
              les 8 clés de `stats`, donnant exactement 8 chemins neufs
              `monde.personnages[].stats.{FO..CA}` → `moteur` (même doctrine que
              `jet.carac`), sous le plafond ≤10 chemins déjà cité en resolved_decisions.
              (2) `wc -l PanneauPersonnages.tsx` avant/après le lot feature dans la revue —
              le fichier est DÉJÀ à 443 lignes, au-dessus du signal KR-112, avant tout
              ajout de Stepper.

VERDICT     — recevable sous réserve : le critère destinations.ts/couverture (annexe #6)
              est irrecevable tant que « 8 clés dans les deux fixtures » n'est pas écrit
              noir sur blanc.
```

---

## ANNEXE — critères d'acceptation (8 max)

**1. Réglage borné d'une caractéristique**
Étant donné le bloc Caractéristiques d'un personnage sélectionné, quand l'auteur clique 12 fois sur « Augmenter Force » puis une 13e fois, alors la valeur affichée reste `12` et `DossierService.update()` n'écrit jamais `stats.FO` au-delà de `CHARACTERISTIC_MAX`.
Niveau **composant**, instrument **jest + RTL + user-event** (déjà en place, précédent Stepper). Test nommé : `fichePersonnage.test.tsx — "Force se clampe a 12, jamais au dela (KR-165)"`.

**2. PV dérivé, jamais stocké — valeur EXACTE**
Étant donné un personnage FO=7/AG=9/EN=6, quand la fiche se rend, alors le PV affiché est exactement `22` et `personnage.stats` ne porte jamais de clé `pv` après un commit.
Niveau **composant + unit** (payload de commit), instrument **jest + RTL**. `characteristics.ts` n'étant qu'APPELÉ (pas modifié — voir critère 8), ce site est hors score de mutation : le test doit asserter le NOMBRE exact, pas « un PV s'affiche ». Test nommé : `fichePersonnage.test.tsx — "PV derive exactement de FO+AG+EN, jamais stocke (KR-192)"`.

**3. PV indisponible — cas limite**
Étant donné un personnage sans EN réglée (FO/AG présentes), quand la fiche se rend, alors le PV affiche `—`, jamais `0` ni `NaN`.
Niveau **composant**, instrument **jest + RTL**.

**4. Lecture au montage — BUG-064, deux personnages, valeurs non ambiguës**
Étant donné un dossier important deux personnages aux 8 caractéristiques distinctes et NON PLANCHER (ex. A : FO7/AG9/DX4/EN6/IN8/IG5/SE10/CA3 → PV22 ; B : FO4/AG5/DX9/EN8/IN3/IG10/SE6/CA7 → PV17), quand la fiche se monte sans interaction sur A puis qu'on clique la ligne de B, alors les 8 Stepper et le PV affichent les valeurs de B, pas un résidu de A.
Niveau **composant**, instrument **jest + RTL** (idiome déjà posé par le correctif BUG-064). **Valeur indiscernable d'un défaut de widget** : `FO=1` (plancher probable du Stepper si `stats.FO` est absent) ou `PV=3` (somme des trois planchers) — aucune des deux ne doit jamais être seedée, sinon le test ne distingue pas « lu du document » de « retombé sur défaut ».

**5. Non-régression dossier de référence**
Étant donné `dossier-reference.json` (6 personnages) après le lot contrat, quand `validateDossier` s'exécute, alors zéro erreur, zéro avertissement neuf, et les 5 personnages hors périmètre d'it3 restent bit-à-bit identiques.
Niveau **unit**, instrument **jest** (déjà en place). KR-190.

**6. Audience de `stats.*` (SOUS RÉSERVE — non recevable tel quel)**
Étant donné les 8 clés de `stats` instanciées dans les DEUX fixtures, quand `couverture.test.ts` s'exécute, alors les 8 chemins `monde.personnages[].stats.{FO..CA}` sont chacun déclarés `moteur` dans `DESTINATION_DES_CHAMPS`, et retirer une ligne fait rougir le test par nom de champ.
Niveau **unit**, instrument **couverture.test.ts** (déjà en place). KR-190. **Non recevable avant que « 8 clés dans les deux fixtures » soit écrit dans le plan** — sinon la garde peut être satisfaite avec une seule clé instanciée.

**7. Invariants transverses**
Étant donné le lot contrat + lot feature, quand `npm run lint` et `tsc --noEmit` tournent, alors zéro import direct `dossier-fiches`↔`bascule-editeur` (KR-184), zéro couleur en dur, zéro `localStorage` brut.
Niveau **lint/tsc**, instrument **ESLint + tsc** (déjà en place, règles câblées).

**8. Déclenchement (ou non) du score de mutation**
Étant donné le diff final, quand on vérifie `git diff --stat -- src/brain/challenge.ts src/brain/combat.ts src/brain/xp.ts src/brain/characteristics.ts`, alors aucun de ces 4 fichiers n'apparaît modifié (seul `characteristics.ts` est **appelé** : `maxPV`, `CHARACTERISTICS`, `CHARACTERISTIC_VALUES`, `CHARACTERISTIC_MAX`) — donc `npm run test:mutation` n'est **pas** déclenché sur la lecture actuelle du plan. **Si** le lot contrat ajoute une constante nommée (ex. `CHARACTERISTIC_MIN`, KR-165) dans `characteristics.ts`, la clause s'inverse : mutation obligatoire, `break` relevé de +5.
Niveau **process de revue**, instrument **git diff** (déjà utilisé en QA mode B).

---

Fichiers consultés : `src/features/dossier-fiches/specification.json`, `src/brain/characteristics.ts`, `src/brain/dossier/types.ts`, `src/brain/dossier/destinations.ts`, `src/brain/dossier/couverture.test.ts`, `src/brain/rules.golden.test.ts`, `src/brain/components/Stepper.tsx`, `bug_history.json` (BUG-064), `docs/REGLES-DU-JEU.md` (§ 1), la skill `raffinage-iteration`, tailles de `PanneauPersonnages.tsx` (443 l.) et `FichePersonnage.tsx` (317 l.).
