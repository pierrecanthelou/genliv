# Tour 2 — `qa` (contre-lecture)

> **Vérification de procédure faite AVANT tout le reste** : `git status --short` → aucun fichier tracké modifié ; `npm run typecheck` → zéro erreur. **Le revert de l'expérience contrôlée du tour 1 est confirmé effectif, vérifié indépendamment, pas seulement re-annoncé.**

## 1. Contre-lecture — réponse nommée à B-6 / § D : la conversion `<p>` → `<span>` est une inférence NON MESURÉE, et elle est fausse

Le tech-lead écrivait « `<p>` (flow) invalide dans `<button>` (phrasing) → `<span>` », et le dossier en tirait « **deux comptages meurent** ». **C'est exactement le geste que la skill interdit** — « ce test rougirait » sans l'avoir rejoué — et c'est une **deuxième occurrence** de cette classe dans le même dossier.

**Mesuré, deux sondes, jetées après usage :**

1. `render(<button><span>badge</span><div><p>a</p><p>b</p><p>c</p></div></button>)` avec `console.error` espionné → **DOM produit tel quel**, **zéro appel à `console.error`** (le `validateDOMNesting` de React ne couvre pas ce couple de balises).
2. Reproduction exacte de la forme planifiée, rejouée contre les **assertions verbatim** du test réel : `not.toHaveAttribute('role','button')` **passe**, `not.toHaveAttribute('tabindex')` **passe**, `querySelectorAll('p')).toHaveLength(3)` **passe** (3, pas 0 — **aucun reparenting jsdom**). **Seule** `queryAllByRole('button')).toHaveLength(0)` bascule, parce que c'est la seule des quatre qui interroge autre chose que le `<li>`.

**Explication** : React (client-only ici — zéro `renderToString`, vérifié) construit le DOM par `createElement`/`appendChild`, **pas en parsant une chaîne HTML** — les règles d'auto-fermeture du parseur, qui reparenteraient un `<p>` mal placé, ne s'appliquent **qu'à un parsing de texte**. Aucune règle ESLint du dépôt ne couvre ce cas non plus.

**Conséquence sur la question posée** (« quel instrument garde trois étages non vides quand ils deviennent des `<span>` ? ») : **les étages n'ont pas besoin de le devenir.** L'instrument actuel garde ce qu'il gardait, et il est **plus robuste** que l'ancre `button > span:last-child > span` — laquelle suppose en plus, sans le dire, que la colonne passe aussi en `<span>`, et casse au premier enfant ajouté. **Je ne propose pas mieux : je propose de ne pas en écrire.**

*En aparté, ceci réduit aussi le chiffrage B-6 — les « trois autres assertions qui meurent » ne meurent pas.*

## 2. B-1 depuis mon terrain

Avec la correction A, le motif de R10 tombe. Mais **si le trailing entre au plan, il doit porter une assertion** — sinon c'est un texte non observable, donc non vérifié. **La bonne assertion n'est PAS un test de libellé** (« la ligne affiche exactement `→ Personnages` »), fragile et couplé à une copie encore en arbitrage. C'est une **assertion de COHÉRENCE** : pour une même ligne, le fragment affiché après `→` — dérivé dans le test **par le même mécanisme qu'en production**, jamais un littéral — doit être **exactement** le `SectionId` que reçoit le rappel au clic de **cette même ligne**. Cela constate « le rendu ne ment jamais sur sa destination », **sans figer un seul mot de copie**.

## 3. L'écart 26 vs 28 — TRANCHÉ, mesuré

`npx jest dossierEditorScreen.test.tsx` → **26 passed**. Le fichier a une boucle `TITRES.forEach` (10 entrées) qui génère 10 tests dynamiques à partir d'un seul `it()` — d'où l'écart avec les 17 `it(` littéraux.

Comparé aux **trois** commits pertinents (avant it3, it3, actuel) : **même nombre d'`it(`, même `TITRES` à 10 entrées, aux trois révisions.** Le seul diff d'it3 est un complètement de littéral de fixture, **zéro test ajouté ou retiré**.

> **Verdict : le compte n'a jamais changé — il a toujours été 26. La ligne « 28 → 28 » du journal d'it3 est une ERREUR DE JOURNAL**, pas le signe d'une régression. À corriger dans le même geste que la clôture d'it4 : *c'est une dette de journal à ne pas reporter davantage.*

## 4. Les 8 critères FINAUX, fusionnés

Arbitrages intégrés : un lot ; rappel **REQUIS** ; `<button>` natif ; `SectionId` seul traverse. **Correction principale que j'apporte à ma PROPRE première invocation** : son critère « discriminance navigation » cliquait une ligne réelle **à travers les deux features dans le même test** — lisible comme un bout-en-bout unique, que KR-184 interdit. Je le remplace par la **paire** sonde (`DossierEditorScreen` seul) + contrat isolé (`PanneauControles`).

1. **Câblage** — sonde locale appelant `onSelectSection('indices')`, destination initiale `SECTIONS[0]` (Canon, jamais Indices) → « Indices » porte **seule** `aria-current` (égalité stricte, jamais une inclusion) et le panneau cède la place. *(composant)*
2. **Contrat, clic ET clavier** — deux contrôles de sections **DIFFÉRENTES** dans le même rendu (KR-197/202), clic puis Tab+Entrée → une fois par activation, avec exactement chaque `SectionId`, **sans `querySelector`**. **RENVERSE nommément** `queryAllByRole('button')).toHaveLength(0)`. *(composant + user-event)*
3. **Doublon de section** — deux contrôles de même section → même valeur émise. *(composant)*
4. **Dossier calme** — aucune ligne cliquable ; test existant **inchangé**. *(composant)*
5. **Câblage réel de la racine** — `App.tsx` passe le rappel, `panneauControles` avant `panneaux`. **Aucun test-grep existant ne couvre `panneauControles` aujourd'hui**, vérifié. *(source)*
6. **Non-régression KR-218** — tests existants verts **sans modification** ; ils vivent dans `sectionNav.test.tsx`, **pas** `panneauControles.test.tsx` *(correction de ma première note)*. *(composant)*
7. **Non-régression de forme — MESURÉE, pas déduite** — `<li>` sans `role`/`tabindex` et les deux comptages d'étages **restent verts sans aucune modification** si l'on ne convertit pas. **Aucune ancre de remplacement n'est due.** *(composant)*
8. **Ligne de base + porte `jest` ET `tsc`** — les 4 suites vertes moins l'unique assertion inversée, **jamais supprimée**, ET `tsc --noEmit` propre sur les 3 fichiers identifiés. **`jest` seul ne suffit pas.** *(porte)*

## 5. B-8 — la phrase pour `resolved_decisions`, mot pour mot

> « Si it5 ou it6 font un jour router le clic vers la section du remède (par ex. un champ `remedeSection` sur `Controle`, rejeté en R5 à it4 comme itération de logique à part), le critère de navigation d'it4 (clic → section qui porte l'absence signalée) sera **SUPERSEDED** par le nouveau contrat, **jamais RÉGRESSÉ** : le test qui change alors documente un contrat plus précis, pas une perte de comportement — un futur QA en mode B ne doit pas lire cette réécriture comme une régression. »

## 6. Statut de mes objections et réserves

| # | Contenu | Statut |
|---|---|---|
| 1 | « Aucune règle ne mène à son propre remède » est FAUSSE | **RÉGLÉE** — reprise par le tech-lead, vérifiée par l'orchestrateur |
| 2 | Le motif de la tension n° 2 doit être réécrit sur la mesure | **RÉGLÉE** |
| 3 | La réécriture du test d'inversion doit être nommée au plan | **MAINTENUE mais PRÉCISÉE** — **seule UNE** des quatre assertions se renverse ; le plan doit nommer **CETTE** assertion, pas « le test » en bloc |
| 4 | Figer le rappel REQUIS vs optionnel | **RÉGLÉE** — REQUIS |
| 5 | KR-184 interdit un test bout-en-bout unique | **MAINTENUE et APPLIQUÉE** — c'est elle qui m'a fait corriger mon propre critère 1 |
| 6 | `resolved_decisions` doit écrire « superseded, pas régressé » | **MAINTENUE** — phrase fournie |
| 7 | Écart 26 vs 28 | **TRANCHÉ** — erreur de journal |
| 8 | *(nouvelle)* La conversion `<p>` → `<span>` et son ancre | **OBJECTION NOUVELLE, mesurée, pas un veto** — la conversion n'est pas nécessaire, donc l'ancre est inutile **et plus fragile** que l'instrument existant |

**Aucun veto.** Les deux réserves vivantes (n° 3 précisée, n° 8 nouvelle) sont réglables à l'écriture du plan ; **aucune n'appelle une reconvocation du comité**.

## 7. Ce que je n'ai pas pu vérifier

Le nom exact du rappel (arbitrage tech-lead/PM) · le **survol, la casse et la couleur** du trailing — hors instrument, `toHaveStyle` sur un jeton `var()` est un instrument **cassé**, déjà tracé BUG-084 dans ce projet. **Le tour 3 les tranche sur le design, jamais sur le test.** · le focus après clic — aucun critère n'en dépend.
