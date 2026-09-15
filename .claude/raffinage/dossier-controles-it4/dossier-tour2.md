# Dossier du tour 2 — `dossier-controles` it4

**À lire en entier.** Notes du tour 1 : `tour1-pm-produit.md` · `tour1-tech-lead.md` · `tour1-ux-designer.md` · `tour1-qa.md`. Mesures : `mesure-orchestrateur.md` — **elle fait foi sur les chiffres**.

Verdicts du tour 1 : **quatre « recevable sous réserve », aucun veto.**

> **Circonstance à connaître** : la session s'est interrompue pendant le tour 1. `tech-lead`, `ux-designer` et `qa` ont **chacun été invoqués deux fois**. Les doublons sont fusionnés dans les notes ci-dessus ; leurs divergences internes sont listées telles quelles et font partie des désaccords à trancher.

---

## A — ⚠ CORRECTION DE L'ORCHESTRATEUR : la tension n° 2 du cadrage était FAUSSE

J'avais écrit, en la présentant comme mesurée : « sur 10 contrôles du dossier de référence, **aucune règle ne mène à son propre remède** ».

**C'est faux.** Relevé indépendamment par le tech-lead **et** par la QA, puis vérifié par moi (`mesure-orchestrateur.md` § 4) :

> **9 contrôles sur 10 mènent exactement à leur remède. Les 10 en offrent un sur place. Sur un dossier neuf, 4 sur 4. Zéro cul-de-sac pur.**

J'avais généralisé à toutes les règles un critère d'it3 qui ne portait que sur `indice-sans-source` — **précisément la règle qui ne se déclenche jamais** sur la fixture que je citais.

**Ce que ça change pour vous** : vos conclusions tiennent, **vos motifs changent**. Ce n'est plus « la valeur tient malgré le cul-de-sac », c'est « **il n'y a pas de cul-de-sac** ». Et surtout, cela **dissout le rejet R10 du tech-lead** (voir B-1).

## B — LES DÉSACCORDS OUVERTS

**B-1 · Le trailing `→ {section.titre}` — CONFLIT FRONTAL.**
L'**UX** en fait sa **réserve non négociable** : le rendu doit dire **où mène le clic, avant le clic**, sinon il contredit la ligne QUOI FAIRE que l'UX a elle-même écrite à it3. Le **tech-lead** le **REJETTE** (R10) : « un libellé qui nomme la section de destination contredirait la ligne QUOI FAIRE dans **10 cas sur 10** », et « le lot n'introduit aucune chaîne française neuve ».
→ **Le motif de R10 repose sur la prémisse corrigée en A.** À 9/10 au lieu de 0/10, nommer la destination **n'est plus un mensonge, c'est une confirmation**. Tech-lead : maintiens-tu R10 sur un autre motif, ou tombe-t-il ? UX : ton trailing survit-il si le tech-lead objecte le coût plutôt que l'honnêteté ?

**B-2 · Le SURVOL — décide si un fichier CSS entre au lot.**
UX invocation 1 : `background: var(--surface-sunken)`, **en CSS seul** (module CSS obligatoire, les pseudo-classes n'existent pas en `CSSProperties`). UX invocation 2 : **aucun survol**, `cursor: pointer` seul, doctrine `ListRow` reconduite (« la source n'en a pas, un survol inventé ici divergerait »). `ListeControles.tsx` est aujourd'hui **100 % styles en ligne**.

**B-3 · La casse et la couleur du trailing.** `textTransform: uppercase` + `--text-faint` (inv. 2) contre sentence case + `--text-label` (inv. 1).

**B-4 · Le nom et la forme du rappel.** `onAllerALaSection` (TL inv. 1) contre `onSelectSection` (TL inv. 2, UX, QA). Et l'`api` : **objet** `{ allerALaSection }` (inv. 1) contre **fonction nue** `(allerALaSection) => ReactNode` (inv. 2). *Rappel : `SectionNav` expose déjà `onSelect`.*

**B-5 · Ce que `ListeControles` émet.** Le tech-lead veut qu'elle émette **le `Controle` entier** (`onControleActive` / `onSelectionner`) et que `PanneauControles` fasse `controle → section` **en un seul endroit** — « le jour où la destination change, un seul fichier bouge et cette présentation pure l'ignore ». L'UX veut `onSelectSection(controle.section)` **directement**. *Note : la position du tech-lead est la seule qui survit à it5/it6 sans rouvrir `ListeControles`.*

**B-6 · Le chiffrage.** ~12 lignes de production (TL inv. 1) contre **~25 lignes / 4 fichiers, 4 tests neufs, 3 réécrits** (TL inv. 2). Le PM objecte que « ~7 lignes » sous-estime. Le tech-lead inv. 2 démontre que **le poste coûteux n'est pas le clavier** (un `<button>` natif donne Tab/Entrée gratuitement) mais **ce que le bouton entraîne** : `<p>` est du contenu de flux, invalide dans un `<button>`, donc trois étages passent en `<span>` et **deux comptages de test tombent avec eux**.

**B-7 · La phrase de démo.** PM : « …mène l'auteur à **la section qui porte l'absence signalée** — jamais à la section du remède. » Tech-lead : « …la section **où le constat a été produit** ». *Convergence sur le sens ; reste à choisir les mots.* **Attention** : avec la correction A, la clause « jamais à la section du remède » est désormais **fausse dans 9 cas sur 10**.

**B-8 · La demande de la QA sur `resolved_decisions`** : y écrire que ce critère sera ***superseded*, pas régressé**, si it5/it6 routaient un jour vers le remède — pour qu'un futur QA en mode B ne lise pas la réécriture comme une régression.

---

## C — CONVERGENCES (ne pas re-débattre sans élément neuf)

1. **UN SEUL LOT**, six fichiers, **pas de lot `contrat`** (aucun fichier de `brain/`), pas de worktree, pas de fusion. Les deux découpages concevables échouent **tous deux sur `App.tsx`**, que deux lots ne peuvent pas nommer, et produisent un lot incapable de passer `tsc` isolément.
2. **`SectionNav.tsx` reste HORS du lot.** `selectedId` est déjà dérivé et `onSelect` est déjà `setDestination` : le surlignage suit **par le chemin livré**. → l'affirmation que j'avais portée à la spec (« il rouvre `SectionNav.tsx` **et** `DossierEditorScreen.tsx` ») est **à moitié fausse**.
3. **`<button type="button">` enveloppant toute la ligne**, `<li>` réduit au filet de séparation. Pas de `role="button"` + `tabIndex` maison, pas de `onKeyDown` — Entrée/Espace sont natifs (doctrine `ListRow`).
4. **`SectionId` seul traverse la frontière, jamais `DestinationNav`** : le panneau ne peut pas exprimer `'controles'`, donc **ne peut pas fabriquer l'état illégal de BUG-082** — l'invariant est tenu par le **type**, pas par une consigne.
5. **Le rappel est REQUIS**, jamais optionnel (précédent `niveauxParSection`, it2).
6. **Aucun type importé entre features** : le rendez-vous est **structurel**, à `App.tsx` seul.
7. **Tension n° 3 (le rapport disparaît) : fausse alerte**, confirmée par les trois rôles — le rendu exclusif est déjà le paradigme des dix autres sections, et l'entrée « Contrôles » est un landmark **permanent**.
8. **Le focus après clic** (le bouton focalisé se démonte, le focus retombe sur `<body>`) est **signalé, non mandaté** — il exige un `ref` sur `ListRow`, primitive `brain/` à un seul appelant, veto maintenu depuis it1.

## D — MESURES QUI FONT FOI

- **Ligne de base** : 4 suites, **35 tests verts** (`dossierEditorScreen` 26 · `panneauControles` 4 · `sectionNav` 1 · `createDossierFlow` 4).
- **`jest` reste VERT et `tsc` rougit** sur un type mésapparié : **3 erreurs, 3 fichiers**, dont `DossierEditorScreen.tsx:125` — le fichier qui **consomme** la prop, absent de mon cadrage. *« Combien de tests rougissent » était la mauvaise question.*
- **`panneauControles.test.tsx` épingle l'inverse exact de l'itération** : `queryAllByRole('button')).toHaveLength(0)` et `not.toHaveAttribute('tabindex')`. **Ce test se RENVERSE nommément, il ne se supprime jamais.**
- **Deux comptages `querySelectorAll('p') → 3`** meurent avec le passage en `<span>`. Ancre de remplacement proposée par le tech-lead : `button > span:last-child > span` (`Badge` rend le premier `<span>`, la colonne est le dernier).
- **Écart non tranché** : `dossierEditorScreen.test.tsx` porte **26** tests, le journal d'it3 écrit « 28 → 28 ».

## E — REJETS NOMMÉS AU TOUR 1 (aucun ne doit disparaître — BUG-082)

**Tech-lead** — R1 contexte/service `brain/` de navigation · R2 union `ReactNode | ((api) => ReactNode)` · R3 rappel optionnel · R4 dériver la destination d'un texte d'affichage · R5 `sectionRemede`/`remedeSection` sur `Controle` · R6 table `ControleId → SectionId` · R7 garder le rapport affiché à côté de la section · R8 défilement/focus sur la ligne de nav · R9 extraire une primitive partagée vers `brain/components/` · **R10 libellé nommant la section de destination** *(motif reposant sur la prémisse corrigée en A)* · R11 marquer le lot `contrat` par précaution.

**PM** — refus préventif de `remedeSection` : deuxième cible **plurielle** (`indice-sans-source` a trois remèdes), donc « pas un ajout de nav, une deuxième itération de logique ».

**UX** — aucune primitive neuve (`Chip` n'a jamais été implémenté : 0 fichier, 0 appelant) · aucun `--accent` dans ce composant · aucun verbe dans l'affordance.

**QA** — aucun rejet ; deux réserves : le motif de la tension n° 2 **doit** être réécrit sur la mesure, et la réécriture du test d'inversion **doit** être nommée au plan.
