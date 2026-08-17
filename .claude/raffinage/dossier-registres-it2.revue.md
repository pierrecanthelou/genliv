# Revue d'itération — `dossier-registres` · itération 2

> Plan : `.claude/raffinage/dossier-registres-it2.plan.md` (validé le 2026-08-17)
> Essaim : `dev-contrat` (lot 1) → `dev-lot` (lot 2) → `integrateur` (APPROUVÉ) → `qa` mode B (2 correctifs demandés, appliqués) — le 2026-08-17

## En une ligne

L'auteur peut désormais tenir le registre « Jalons & fins » de son dossier : créer un jalon ou une fin, écrire la prose que le joueur lira à l'arrivée sur une fin (`Fin.texte`), réordonner chaque collection, et voir l'avertissement D1 (déclencheur/condition sans expression) apparaître automatiquement sur une fin non conforme — jamais sur un jalon, silencieux par design.

## Critères d'acceptation (§6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Dossier de référence accepté sans régression après le lot contrat | **VÉRIFIÉ** | `couverture.test.ts` « le texte d une fin est moteur… » + `validate.test.ts` (inchangé, toujours vert sur la fixture avec `texte`) |
| 2 | `charpente.fins[].texte` résout `moteur`, sur les deux fixtures | **VÉRIFIÉ** | Même test, assertions sur `cheminsDeLaFixture()` (minimale) et `feuillesDeLaFixture(documentDeReference())` (référence) |
| 3 | « + Ajouter » crée une entrée locale, rien n'est écrit tant que les champs requis sont vides | **VÉRIFIÉ** | `ajout jalon differe…` / `ajout fin differe…` — `charpente.jalons`/`fins` reste à sa longueur d'origine tant que les champs requis manquent |
| 4 | Champs requis complétés → commit atomique, accepté sans `champ-requis-vide` | **VÉRIFIÉ** | Mêmes tests — Jalon : les deux champs (`declencheur_texte` + `enonce_texte`) ; Fin : `condition_texte` seul, `texte` jamais gatant (rempli en premier sans effet, puis toujours éditable après commit) |
| 5 | Brouillon incomplet abandonné → disparaît sans dialogue, dossier inchangé | **VÉRIFIÉ** | `abandon silencieux…` — 3 déclencheurs (changement d'onglet, changement de sélection, démontage), longueur du document inchangée à chaque étape **et** `queryAllByRole('status')` à 0 après chacun (assertion ajoutée en réponse à la QA mode B, voir « Écarts corrigés ») |
| 6 | Discriminance D1 à trois entités dans le même test | **VÉRIFIÉ** | `discriminance D1 a trois entites…` — fin non conforme → 1 région `status` ; fin conforme (`fin.vigie-sauvee`, `condition_expr` présent) → 0 ; jalon non conforme (`jalon.second-guet`) → 0. `FicheJalon` reçoit réellement la prop `avertissements` (test séparé `FicheJalon (rendu pur)` prouve que le code de rendu existe et fonctionnerait si le validateur cessait de se taire) |
| 7 | Reorder clic + clavier, jalons et fins, fiche affichée stable par id | **VÉRIFIÉ** | `reorder clic + clavier…` |
| 8 | Sélection et compteur indépendants par onglet, jamais fusionnés | **VÉRIFIÉ** | `selection independante par onglet…` |

**8/8 critères vérifiés.**

## Diff par lot

**Lot 1 — `jalons-fins-contrat`** (`dev-contrat`, seul, en premier) :
- R `src/brain/dossier/types.ts` — `Fin.texte?: string`
- R `src/brain/dossier/destinations.ts` — `'charpente.fins[].texte': 'moteur'`
- R `src/brain/dossier/couverture.test.ts` — dispense `PROSE_D_ENTITE_LIBRE` + test nommé de destination
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json` — `texte` instancié sur chaque fin existante, `condition_expr` conservé partout

Conforme à la liste du plan. Écart interne signalé par l'ouvrier (hors liste de fichiers, aucune conséquence) : 8 phrases de JSDoc préexistantes dans `types.ts`/`destinations.ts` affirmant que `texte_ouverture_joueur` est « la seule prose émise mot pour mot » sont devenues fausses avec l'ajout de `Fin.texte` — corrigées dans les deux mêmes fichiers, zéro valeur d'audience modifiée.

**Lot 2 — `jalons-fins-ecran`** (`dev-lot`) :
- N `src/features/dossier-registres/components/PanneauJalonsFins.tsx`, `FicheJalon.tsx`, `FicheFin.tsx`
- N `src/features/dossier-registres/hooks/useEcritureJalons.ts`, `useEcritureFins.ts` (extraction conditionnelle KR-112 — le panneau franchissait 400 lignes une fois câblé, ramené à 406 l. panneau / 123 l. + 107 l. hooks ; conditionnalité pré-autorisée par le plan §5)
- N `src/features/dossier-registres/tests/panneauJalonsFins.test.tsx`
- R `src/features/dossier-registres/components/styles.ts` (additif), `index.ts`, `src/App.tsx`

Conforme à la liste du plan. Zéro fichier `src/brain/`, zéro fichier `SegmentedControl.tsx`/`bascule-editeur`/`dossier-canon`/`tree-canvas` — vérifié par l'intégrateur.

## Ce qui a été refusé (§8 du plan, `REJETÉ`)

- **Semis d'un texte-marqueur (`MARQUEUR_A_ECRIRE`) pour créer un jalon/une fin** — la première option envisagée par le tech-lead au tour 1. Retournée par lui-même au tour 2 : semer le marqueur dans `condition_texte` allume l'avertissement D1 sur toute fin fraîchement créée, ce qui contredit un principe déjà posé et testé (`amorce.test.ts` : un document/une entité neuve ne s'ouvre jamais déjà en alerte). Retenu à la place : un brouillon différé, précédent réel `useEcriturePlan.ts` (`dossier-fiches`).
- **Découpage en 3-4 lots (un par collection Jalon/Fin)** — un lot « jalons » et un lot « fins » auraient nommé quatre fichiers communs (panneau, styles.ts, index.ts, App.tsx), propriété exclusive impossible.

## Ce qui a été reporté

- **Vigilance UX sur `SegmentedControl`** — porte deux sémantiques dans cette feature (bascule en it2, filtre en it4/Événements). Aucune conséquence code cette itération (zéro prop nouvelle, zéro fichier touché), mais la lisibilité du composant reste à relire explicitement au raffinage de l'itération 4.
- **Retrait (suppression) d'un jalon/fin persisté** — reste sans itération porteuse dans le plan à 5 itérations de la feature, même statut que les autres collections depuis it1 (`open_questions` de `specification.json`, étendu à jalon/fin ce tour-ci).

## Écarts assumés

- **Rôle ARIA du `SegmentedControl`** : le plan (§3, écrit par l'UX au raffinage) supposait `role="tablist"` ; le composant réel expose `role="radiogroup"`/`role="radio"`. `dev-lot` a suivi le composant existant tel qu'il est (contrat figé, zéro fichier touché) plutôt que le texte du plan, et écrit ses tests contre le rôle réel. Confirmé par l'intégrateur : imprécision de texte du plan, aucune conséquence de contrat.

## Écarts corrigés avant cette revue (trouvés par la QA mode B)

1. **Critère #5** — le test « abandon silencieux » prouvait l'absence d'écriture mais pas l'absence de bandeau affiché. Ajout de `expect(screen.queryAllByRole('status')).toHaveLength(0)` aux trois points d'abandon (changement d'onglet, changement de sélection, avant démontage).
2. **KR-214** (le risque posé par ce raffinage — `CHAMPS_REQUIS` + brouillon différé) était dans `specification.json` mais absent de `code-knowledge.json`. Mirroré (étape Docs, obligatoire par CLAUDE.md).
3. Nit non bloquant : un commentaire de test disait « les 8 autres racines » en en listant 9 — corrigé en « 9 ».

Porte qualité entièrement re-vérifiée après ces trois correctifs (voir ci-dessous) — aucune régression introduite.

## Blocages non résolus

Aucun.

## Porte qualité

```
prettier --check   → vert
tsc --noEmit       → vert, 0 erreur
eslint .           → 0 erreur, 1 warning préexistant hors périmètre (src/player/CharacterCreationScreen.tsx)
jest (suite complète) → 78 suites / 1127 tests verts
```

`npm run test:mutation` : sans objet — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'a été touché. Table dorée : sans objet — aucun registre couvert par `rules.golden.test.ts` n'est en jeu.

## RETOUR-COMITÉ

Le découpage en 2 lots (contrat minimal + écran) a tenu sans ajustement. Le vrai risque de cette itération n'était pas le découpage mais une hypothèse de départ (le geste d'ajout d'it1 se généralise tel quel) invalidée par la lecture directe du code — la porte 1 mécanique du raffinage ne l'aurait pas vue (elle contrôle la forme du plan, pas la validité de ses suppositions techniques). Ce que ça apprend pour la suite : sur une feature qui pose des champs `CHAMPS_REQUIS` neufs pour l'écran qui les édite, le tech-lead doit vérifier `tables.ts`/`validate.ts` AVANT d'écrire l'annexe de découpage, pas après — ici corrigé au tour 2 mais aurait pu l'être dès le tour 1. KR-214 capture la règle générale pour ne pas la redécouvrir à it3/it4/it5. Second enseignement, mineur : le contrat de design (§3) ne doit pas deviner l'ARIA role d'un composant `brain/` existant sans le relire — un renvoi au fichier source aurait évité l'écart (sans conséquence ici, mais coûterait plus cher sur un composant moins simple).
