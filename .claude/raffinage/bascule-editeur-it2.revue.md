# Revue d'itération — `bascule-editeur` · itération 2

> Plan : `.claude/raffinage/bascule-editeur-it2.plan.md` (validé le 2026-08-09)
> Essaim : lot 1 (`dev-contrat`, seul) → lots 2+3 (`dev-lot`, un seul ouvrier en séquence — règle « ≤2 lots restants » de la skill essaim) → `integrateur` → `qa` mode B → `tech-lead` (revue PR)
> Verdict QA mode B : **RECEVABLE SOUS RÉSERVE** (2 réserves de process, aucune de code — voir § Écarts assumés)
> Verdict tech-lead (PR, diff stagé) : **APPROVE** — 0 critique, 0 majeur, 7 mineurs ; 6 corrigés avant présentation, 1 tranché sans changement de code (voir § Revue tech-lead)

## Revue tech-lead (§ Build Steps étape 6, avant la revue utilisateur)

| Sév. | Constat | Issue |
|---|---|---|
| mineur | `EventBus.ts:24` — la docstring de `dossier:created` ne citait que `DossierService.importDossier`, plus `create` | **Corrigé** — les deux émetteurs nommés |
| mineur | `LibraryScreen.tsx` — trois docblocks stales (« + Nouveau livre », « unused this iteration », « nothing to open before it2 ») | **Corrigé** — réécrits pour refléter it2 |
| mineur | `DossierCard.tsx` — docblock stale (« inert `<article>` ») alors que la prop `onOpen` et le rendu `<button>` existent | **Corrigé** |
| mineur | `DossierCard.tsx` — le bouton-titre cliquable fait ~23px de haut contre `--hit-target: 44px` | **Tranché sans changement de code** : décision projet déjà actée (raffinage-iteration, § accessibilité) — les cibles ≥44px sont retirées du cadre de blocage ; le contrat UX du plan § 3 a délibérément figé cette forme (bouton-texte, pas la carte entière) |
| mineur | `EditorTopBar.test.tsx` — un test de `brain/` pinnait le texte réel d'une feature (« feature n° 9 ») | **Corrigé** — fixture neutre (`'Raison de test'`), l'assertion sur le texte réel reste seule dans `dossierEditorScreen.test.tsx` |
| mineur | `useCreateDossier.ts` — la garde anti-double-soumission n'est jamais réarmée ; le commentaire en surpromettait la portée | **Corrigé** — commentaire réécrit pour dire exactement ce qui protège (réentrance synchrone) et ce qui ne l'est pas (un hook qui resterait monté après un create réussi) |
| mineur | `specification.json` / `code-knowledge.json` — KR-177 disait encore « testé à la création ET à la duplication », contredisant le désaccord #8 du plan | **Corrigé** dans les deux fichiers |

Observation non bloquante du tech-lead, pour it3 : `dossierLibrary.test.tsx` monte `<App/>`, donc dépend transitivement de `book-creation`/`bascule-editeur` — pas une violation d'isolation (c'est le composition-root légitime), mais à garder en tête si cette suite rougit pour une raison qui n'est pas la sienne.

**Incident de process distinct, découvert et corrigé pendant cette même étape** : un `npx prettier --write` lancé par erreur sur les fichiers `.md` (hors du script `format` du projet, qui ne cible que `src/**/*.{ts,tsx,css}`) a fait gonfler `docs/ROADMAP-BASCULE-IA.md` de ~20 Kio par un simple alignement de colonnes de tableau, franchissant largement son plafond de budget de contexte. Restauré depuis l'index git (`git restore`) avant tout commit — aucun contenu perdu, confirmé par grep. `code-knowledge.json` a par ailleurs franchi son plafond de 2 octets suite à la correction KR-177 ci-dessus ; reformulé de deux phrases pour repasser sous la limite (76 760 / 76 800 o).

## En une ligne

L'auteur peut désormais créer un dossier d'aventure valide depuis sa bibliothèque et atterrir sur son écran d'édition, ou rouvrir n'importe quel dossier déjà présent en cliquant son titre — ce qu'il ne pouvait pas faire avant cette itération (aucune création de dossier, aucun écran d'édition, aucune route dossier n'existaient).

## Critères d'acceptation (§ 6 du plan)

| # | Critère (résumé) | Statut | Preuve |
|---|---|---|---|
| 1 | `create()` sème un id conforme et un seed sans erreur ni avertissement | **VÉRIFIÉ** | `DossierService.test.ts` : `validateDossier(dossiers.create(titre))` → `errors:[]`, `warnings:[]`, `ok:true` |
| 2 | `dossier:created` puis `dossier:opened`, dans l'ordre, jusqu'à l'écran | **VÉRIFIÉ** | `createDossierFlow.test.tsx` : `order === ['dossier:created','dossier:opened']`, magasin déjà écrit au premier événement, `heading` du titre rendu |
| 3 | « + Nouveau dossier » de retour dans `LibraryScreen` | **VÉRIFIÉ** | `dossierLibrary.test.tsx` : les deux affordances (« + Nouveau dossier », « Importer un dossier ») co-présentes |
| 4 | `DossierEditorScreen` : titre, retour, sans nœud/+Nœud ; repli « Dossier introuvable. » | **VÉRIFIÉ** | `dossierEditorScreen.test.tsx` : heading = titre, `queryByRole('button',{name:/nœud/i})` → null ; dossierId inconnu → texte exact + retour accueil |
| 5 | « Aperçu du jeu » visible, désactivé, texte nommé « feature n° 9 » — 2 tests distincts | **VÉRIFIÉ** | `EditorTopBar.test.tsx` (défaut écran Book inchangé) + `dossierEditorScreen.test.tsx` (texte injecté, comparé caractère à caractère par la QA) |
| 6 | Clic sur le titre d'une carte lisible ouvre le dossier ; carte illisible sans affordance | **VÉRIFIÉ** | `dossierLibrary.test.tsx` : ordre `dossier:opened`→navigation, route exacte ; branche `lisible:false` ne rend qu'un `span`, jamais un bouton |
| 7 | Garde morte KR-071 retirée d'`App.tsx` (aucune garde de remplacement) | **VÉRIFIÉ** | grep indépendant QA : `book:deleted`/`isEditingBook` absents d'`App.tsx` |
| 8 | Amorce du seed : marqueur en tête des 4 textes, unique dans `src/`, `lieux[0]` sans `nom` | **VÉRIFIÉ** | `amorce.test.ts` : `startsWith(MARQUEUR_A_ECRIRE)` ×4, balayage source → une seule occurrence (`amorce.ts` lui-même), `not.toHaveProperty('nom')` |

## Diff par lot, comparé à la liste du plan (§ 5)

- **Lot 1** (`contrat-dossier-create`) : 9 fichiers, exactement ceux du plan — `Router.ts`, `DossierService.ts`(+test), `EditorTopBar.tsx`(+test), `utils/id.ts`(+test), `dossier/amorce.ts`(+test). Aucun écart.
- **Lot 2** (`creation-et-ecran-dossier`) : 17 fichiers (N/R/D), exactement ceux du plan — `book-creation/*` renommé Book→Dossier, `bascule-editeur/components/DossierEditorScreen.tsx` neuf, `App.tsx` repointé. Aucun écart.
- **Lot 3** (`ouvrir-un-dossier-depuis-la-bibliotheque`) : 4 fichiers du plan touchés, **plus `src/style.css`**, absent de toute liste de lot — voir Écarts assumés.

## Ce qui a été refusé (registre § 8 du plan)

- Exporter `FORME_ID_DOSSIER` pour tester `createDossierId()` directement (désaccord #2) — le round-trip `validateDossier()` est strictement plus fort et n'exporte rien.
- Exporter un prédicat `estTexteDeSeed()` aux côtés de `MARQUEUR_A_ECRIRE` (désaccord #3) — zéro appelant, ses deux lecteurs futurs (n° 7, n° 9) n'ont pas le même besoin.
- Une garde `dossier:deleted` de remplacement dans `App.tsx` (désaccord #7) — inatteignable depuis la route dossier ; le repli `dossier===null` de l'écran couvre tous les cas réels.
- Un test fonctionnel « supprimer pendant que l'écran est ouvert → accueil » (désaccord #7) — remplacé par un test-grep plus fort sur le retrait effectif du code mort.

## Ce qui a été reporté

- KR-178 corrigé dans `specification.json` (désaccord #10) — fait avant l'ouverture du lot 1 (non observable a posteriori, note QA § 7, mais conforme à l'ordre demandé).
- Détection d'une amorce non rédigée (n° 7) et refus d'ouverture de partie dessus (n° 9) — `open_questions` de la spec, constante et textes déjà en place, comportements non construits.
- Rafraîchissement live du titre sur `dossier:updated` pendant que l'écran est ouvert — propriétaire it3.
- Renommer/dupliquer un dossier — toujours sans propriétaire d'itération.

## Écarts assumés

1. **`TITRE_PAR_DEFAUT` ('Dossier sans titre')** — valeur de copie non arbitrée par le comité de raffinage (absente des 10 notes de tours et du plan, qui ne nommait que la constante). Le lot 1 l'a posée en la documentant explicitement comme non arbitrée, et l'a justifiée : elle est inatteignable depuis l'UI de cette itération (« Créer » reste désactivé et le clavier Entrée gardé tant que le titre trimé est vide — confirmé indépendamment par l'intégrateur ET la QA, deux fois, sur le code réel, pas sur la documentation). Aucun lot 2/3 ne la consomme. **À confirmer par l'UX avant le commit** — c'est un changement d'une ligne si le texte doit changer, sans impact sur aucun test.
2. **`src/style.css` modifié hors de toute liste de lot.** Le lot 3 avait besoin d'une règle de survol (`text-decoration: underline` sur le titre cliquable) cohérente avec le patron « hover-reveal » déjà utilisé par la carte sœur (`.dossier-card__actions`, déjà dans `style.css`). Le plan n'avait inclus `style.css` dans aucun lot. Le worker du lot 3 a d'abord contourné avec un `<style>` scopé inline dans `LibraryScreen.tsx` (documenté comme écart), corrigé par l'intégrateur (déplacement vers `style.css`, autorisation explicite donnée par l'orchestrateur pour cette correction de forme) puis re-vérifié indépendamment par la QA (règle en place, aucun résidu inline, aucun changement de couleur vers l'accent). Fonctionnellement correct des deux côtés ; reste un écart au plan § 5 à assumer plutôt qu'à cacher.

Aucun blocage non résolu.

## Porte qualité

| Étape | Résultat |
|---|---|
| Prettier | vert |
| `tsc --noEmit` | vert, 0 erreur |
| ESLint | 0 erreur, 1 warning pré-existant hors périmètre (`CharacterCreationScreen.tsx`, non touché) |
| Jest | **54 suites / 765 tests, tous verts** — confirmé indépendamment 3 fois (lot 1, intégrateur, QA) |
| `test:mutation` (`brain/`) | sans objet — confirmé par grep, aucun des 4 fichiers mutés (`challenge.ts`/`combat.ts`/`xp.ts`/`characteristics.ts`) dans le diff |
| Suites `tree-canvas`/`cloud-sync` (route `editor` encore montée) | intactes, vertes, aucune modification |

## RETOUR-COMITÉ

- **Un plan qui fait naître une interaction de survol sur un composant déjà doté d'une règle CSS globale sœur (ex. `.dossier-card__actions`) doit inclure le fichier de style partagé (`src/style.css`) dans la liste du lot concerné** — sinon l'ouvrier choisit entre dupliquer le mécanisme (style inline) ou déborder du périmètre, et personne d'autre que l'intégrateur ne peut trancher a posteriori. À vérifier systématiquement au tour tech-lead du raffinage suivant dès qu'un lot touche une interaction hover/focus sur un composant déjà stylé globalement.
- **Une constante nommée dans un plan (ex. `TITRE_PAR_DEFAUT`) doit porter sa valeur littérale**, même si elle semble inatteignable depuis l'UI de l'itération qui l'introduit — sinon le lot contrat doit deviner une copie qui n'est pas la sienne à écrire. Le tour UX du raffinage devrait systématiquement balayer le § 4 (contrats brain/) pour toute constante de repli citée sans valeur, pas seulement le § 3 (contrat de design).
- La règle « ≤2 lots restants après le contrat → un seul `dev-lot` en séquence » a bien tenu ses promesses annoncées par la skill essaim (« pas de worktree, pas de fusion, pas de blocage croisé ») : zéro conflit, une seule porte qualité à la fin des deux lots, un seul compte rendu à recouper.
