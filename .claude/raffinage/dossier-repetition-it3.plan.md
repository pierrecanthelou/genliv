# Plan d'itération — `dossier-repetition` · itération `3`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-08
> Composition : `5 rôles` — motif : l'itération lit `monde.lieux` et `monde.personnages` du dossier d'aventure
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut lire ce que son joueur synthétique n'a pas atteint sur ce parcours » |
| **Tranche** | `repeter.ts` (rapport enrichi) → `PanneauRepetition.tsx` (section non-atteints) |
| **Lots** | 1 lot feature · 0 contrat |
| **Hors périmètre** | parler/agir · héros étalon · dépliable des pas · trace par pas · `parcours` ordonné · ListeConstats composant · score de mutation |
| **Reporté** | dépliable + trace → it4 sacrifiable · étalon → dette à déclencheur |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut lire quels lieux et quels personnages son joueur synthétique n'a pas atteints sur ce parcours.

## 2 — Hors périmètre

- **parler/agir** — no-op sur `monde` (commandes.ts:393,:445), décale le RNG (KR-304). Co-présence suffit. Unanime.
- **Héros étalon** — aucun consommateur (calibrage rejeté). Dette à déclencheur.
- **Dépliable des pas** — second comportement (relire le parcours). Exige une `trace` par pas. Veto PM. Reporté it4.
- **trace par pas** — suit le dépliable. `lieux_visites` suffit pour les constats de couverture.
- **`parcours: readonly string[]`** — chemin ordonné avec doublons, ne sert qu'au dépliable (it4). `lieux_visites` est le SSOT du moteur.
- **ListeConstats composant** — ~310 lignes estimées, sous 400 (KR-112). Inline ListRow + `<ul>`. Extraction si it4 pousse la taille.
- **Score de mutation** — brain/ non touché (KR-313, `repeter.ts` est dans `features/`).
- **Badge `combats_traverses`** — déjà rendu par l'it2, inchangé.

## 3 — Contrat de design

**Zone ajoutée** dans l'état « résultat » de PanneauRepetition, entre le motif d'arrêt et le bouton Relancer.

**Structure verticale :**

```
[contenu existant it2 : eyebrow arrêt · badges · motif · ListRow lieu]

Eyebrow secondaire  « NON ATTEINT SUR CE PARCOURS »
                     fs: var(--fs-eyebrow), font-family: var(--font-mono),
                     fw: var(--fw-semibold), color: var(--text-label),
                     letter-spacing: var(--track-eyebrow)
                     (même style que les eyebrows existants du panneau)

  Groupe LIEUX
    Label           « Lieux » — fs: var(--fs-eyebrow), font-family: var(--font-mono),
                    color: var(--text-label)
    <ul>            ListRow lecture seule pour chaque lieu non visité
                    titre = localiserEntite(dossier, lieu.id)
    État vide       « Tous les lieux ont été visités par ce parcours. »
                    fs: var(--fs-body), color: var(--text-muted), font-style: italic

  Groupe PERSONNAGES
    Label           « Personnages » — fs: var(--fs-eyebrow), font-family: var(--font-mono),
                    color: var(--text-label)
    <ul>            ListRow lecture seule pour chaque PNJ non atteint (placés uniquement)
                    titre = localiserEntite(dossier, personnage.id)
    État vide A     « Tous les personnages placés ont été croisés par ce parcours. »
                    fs: var(--fs-body), color: var(--text-muted), font-style: italic
    État vide B     « Aucun personnage dans le dossier. »
                    fs: var(--fs-body), color: var(--text-muted), font-style: italic

[bouton Relancer existant]
```

**Définitions :**
- Lieu non atteint : `!rapport.lieux_visites.includes(lieu.id)`
- PNJ placé : `(personnage.presence ?? []).length > 0`
- PNJ atteint (co-présence) : au moins un `presence[].lieu_id` est dans `new Set(rapport.lieux_visites)`
- PNJ non atteint : placé ET non atteint
- État vide B prioritaire sur A si `monde.personnages.length === 0`

**Tokens :** aucun token neuf. `--fs-eyebrow`, `--font-mono`, `--fw-semibold`, `--text-label`, `--track-eyebrow`, `--fs-body`, `--text-muted` existants.

**Clavier :** les ListRow lecture seule sont hors tabulation. Tab traverse les éléments interactifs existants (Relancer).

**Textes exacts :**
- Eyebrow : `NON ATTEINT SUR CE PARCOURS`
- Labels : `Lieux` · `Personnages`
- Vide lieux : `Tous les lieux ont été visités par ce parcours.`
- Vide PNJ (tous croisés) : `Tous les personnages placés ont été croisés par ce parcours.`
- Vide PNJ (aucun) : `Aucun personnage dans le dossier.`

## 4 — Contrats `brain/` touchés

Aucun. `repeter.ts` est dans `features/dossier-repetition/utils/` (KR-313). `localiserEntite` est déjà exporté de `brain/index.ts`, consommé en lecture seule.

## 5 — Lots

### Lot 1 — `couverture-parcours`
- **Ouvrier** : `dev-lot`
- **But** : enrichir le rapport de `lieux_visites`, afficher la section non-atteints dans le panneau
- **Fichiers** : `src/features/dossier-repetition/utils/repeter.ts` (R) · `src/features/dossier-repetition/tests/repeter.test.ts` (R) · `src/features/dossier-repetition/tests/repeterCombat.integration.test.ts` (R) · `src/features/dossier-repetition/components/PanneauRepetition.tsx` (R) · `src/features/dossier-repetition/tests/panneauRepetition.test.tsx` (R)
- **Consomme** : `localiserEntite` (brain/index.ts, déjà exporté)
- **Expose** : `RapportRepetition.lieux_visites: readonly string[]`
- **Critères couverts** : #1–#7

## 6 — Critères d'acceptation

1. **Étant donné** un dossier avec 3 lieux et un départ, **quand** `repeter()` produit un rapport, **alors** `rapport.lieux_visites` est un tableau de `string` contenant au minimum le lieu de départ — *unitaire — lot 1*

2. **Étant donné** un rapport dont `lieux_visites` ne contient pas tous les lieux du dossier, **quand** le panneau rend l'état résultat, **alors** une section « NON ATTEINT SUR CE PARCOURS » liste les lieux absents, nom résolu par `localiserEntite` — *composant — lot 1*

3. **Étant donné** un dossier avec des personnages ayant `presence[].lieu_id`, **quand** aucun de ces `lieu_id` n'est dans `lieux_visites`, **alors** ces personnages apparaissent dans le groupe « Personnages » de la section non-atteints — *composant — lot 1*

4. **Étant donné** un personnage sans `presence` (ou `presence: []`), **quand** le panneau rend la section non-atteints, **alors** ce personnage n'apparaît pas dans la liste — *composant — lot 1*

5. **Étant donné** tous les lieux du dossier présents dans `lieux_visites`, **quand** le panneau rend, **alors** le groupe Lieux affiche « Tous les lieux ont été visités par ce parcours. » — *composant — lot 1*

6. **Étant donné** tous les personnages placés atteints par co-présence, **quand** le panneau rend, **alors** le groupe Personnages affiche « Tous les personnages placés ont été croisés par ce parcours. » — *composant — lot 1*

7. **Étant donné** une graine fixe et un dossier identique, **quand** `repeter()` est appelé deux fois, **alors** `lieux_visites` est identique dans les deux rapports (KR-304) — *unitaire — lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `repeter.test.ts` « rapport porte lieux_visites lu de session.monde » | `rapport.lieux_visites` contient le départ et les lieux traversés | jest unitaire | — | 1 |
| `repeter.test.ts` « lieux_visites inclut le départ » | `rapport.lieux_visites[0] === depart.lieu_id` | jest unitaire | — | 1 |
| `repeter.test.ts` « lieux_visites sans doublon (va-et-vient) » | `new Set(lieux_visites).size === lieux_visites.length` | jest unitaire | — | 1 |
| `repeter.test.ts` « même graine même lieux_visites » | deux appels → `lieux_visites` identiques | jest unitaire | KR-304 | 1 |
| `panneauRepetition.test.tsx` « lieux non visités affichés » | les noms des lieux absents apparaissent | jest composant | — | 1 |
| `panneauRepetition.test.tsx` « PNJ non atteints par co-présence » | PNJ dont aucun `presence[].lieu_id` ∈ `lieux_visites` affiché | jest composant | — | 1 |
| `panneauRepetition.test.tsx` « PNJ sans presence exclus du constat » | PNJ avec `presence: []` absent de la liste | jest composant | — | 1 |
| `panneauRepetition.test.tsx` « état vide lieux — tous visités » | texte « Tous les lieux ont été visités par ce parcours. » | jest composant | — | 1 |
| `panneauRepetition.test.tsx` « état vide PNJ — tous placés croisés » | texte « Tous les personnages placés ont été croisés par ce parcours. » | jest composant | — | 1 |
| `panneauRepetition.test.tsx` « état vide PNJ — aucun dans le dossier » | texte « Aucun personnage dans le dossier. » | jest composant | — | 1 |

**Non vérifiable en l'état** — l'absence d'identifiant brut dans le JSX (pas de règle ESLint ; contrôle visuel en revue).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | TL (t2) vs PM/NIA/UX (t2) | `lieux_visites` (SSOT moteur) vs `parcours` (chemin ordonné) | `RETENU` (TL) | `session.monde.lieux_visites` est le SSOT du moteur (session.ts:578, commandes.ts:350). Zéro recalcul. `parcours` reporté à it4 avec le dépliable. PM/NIA/UX avaient adopté `parcours` du tour 1 TL, que le TL a retiré au tour 2 après vérification du code. |
| 2 | PM (t1+t2, veto) | Dépliable + trace dans it3 | `RETENU` (PM) | Second comportement (relire le parcours). Exige `trace` neuve. Reporté it4 sacrifiable. |
| 3 | UX/NIA (t2) vs PM/TL/QA (t2) | PNJ sans `presence[]` : exclu vs listé | `RETENU` (UX/NIA) | Un PNJ sans lieu est inatteignable par construction. L'afficher en « non atteint » est un faux diagnostic (le parcours n'y est pour rien). L'état vide « tous croisés » devient inatteignable si on les liste. Contrôles le signale déjà. Le filtre coûte une ligne. |
| 4 | TL (t1+t2) | ListeConstats composant local (2 appelants) | `REJETÉ` | ~310 l. estimées, sous 400 (KR-112). Pas d'abstraction prématurée. Inline ListRow + `<ul>`. Si it4 pousse la taille → extraction. |
| 5 | UX (t1) | Libellé « EN {n} PAS · PARCOURS N°{graine} » dans l'eyebrow | `REJETÉ` partiellement | Eyebrow : « NON ATTEINT SUR CE PARCOURS » (PM, TL). Les badges existants (graine, pas, combats) de l'it2 restent inchangés et portent déjà ces informations. |
| 6 | QA (t1, veto) | Critère #8 non observable : « PNJ atteint » non défini | `RETENU` (levé) | Définition co-présence écrite en critères #3–#4. Veto levé au tour 2. |
| 7 | QA (t2) | Définition de fini chiffrée | `RETENU` | Gate : format + typecheck + lint + jest. Pas de mutation (brain/ non touché). |
| 8 | TL (t1) | Critères 3, 7, 9 de la spec périmés | `RETENU` | Critères de l'it2, ne s'appliquent plus. À retirer de la spec active. |
| 9 | TL (t1) | Fermeture `rapporter` pour les 7 sorties | `REJETÉ` | Hors périmètre it3. Le champ `lieux_visites` requis fait échouer `tsc` sur un site oublié — garde suffisante. |
| 10 | NIA (t1) | `lieux_visites` + `trace` dans le rapport | `REJETÉ` partiellement | `lieux_visites` retenu (SSOT moteur). `trace` reportée avec le dépliable (it4). Les deux ensemble violeraient KR-013 (`lieux_visites` se dérive de `trace`). |

## 9 — Innovation

*(aucune)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste du lot
- [ ] `localiserEntite` utilisé pour tout nom affiché (aucun identifiant brut dans le JSX)
- [ ] Textes exacts du § 3 copiés tels quels (pas de rédaction par l'ouvrier)
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-repetition-it3.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | dépliable + trace reportés (veto durci → retenu) |
| Tech Lead | recevable sous réserve | `lieux_visites` SSOT retenu, `parcours` retiré |
| UX | recevable sous réserve | « placés » dans l'état vide, `localiserEntite` obligatoire, pas de CSS propre |
| QA | recevable sous réserve | définition co-présence écrite, critères périmés retirés, définition de fini posée |
| Narratif & IA | recevable sous réserve | co-présence définie en critère observable, PNJ sans presence exclus |
