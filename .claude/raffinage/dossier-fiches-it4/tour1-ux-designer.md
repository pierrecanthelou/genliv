# RISQUE / OBJECTION / PROPOSITION / VERDICT

**RISQUE.** Le bloc 4 est fermé par défaut (`defaultOpenId` reste le bloc 1) et `Accordion` garde le contenu des blocs fermés monté en `display:none`. Si l'avertissement D1 (KR-189, `plan_actions[].declencheur_texte`/`contre_mesures[].declencheur_texte` sans jumeau `_expr`) est rendu À L'INTÉRIEUR du contenu du bloc 4 — copie littérale du précédent `ObjectifsCanon` — il devient invisible tant que l'auteur n'a pas cliqué précisément ce bloc, contredisant « doit s'allumer au montage » et rejouant la classe KR-199 (portée promise > portée tenue) sur la surface, pas sur un test.

**OBJECTION.** (1) `ListRow` figure dans « composants réutilisés tels quels » du contrat, mais sa racine est un `<button>` : y imbriquer des `Field`/`Stepper` interactifs est invalide — il ne peut pas porter une ligne d'étape ou de contre-mesure. (2) Le contrat verrouille le TITRE de bloc « Objectif & plan d'actions » (KR-198) mais aucun libellé de CHAMP pour `but.libelle` : un simple « OBJECTIF » au niveau champ recréerait, en interface, la confusion que KR-198 a précisément tranchée au niveau schéma face à « OBJECTIF RATTACHÉ » du bloc 1.

**PROPOSITION.** Rendre l'avertissement D1 comme SECOND `role="status"`, frère de `<Accordion>` (comme le bandeau de refus existant), jamais imbriqué dans un bloc. Ligne d'étape/contre-mesure = `<div>` bordé `--border-divider` + fond `--surface-sunken`, PAS `Card` (évite l'empilement d'ombres sur une liste répétée), avec `IconButton ✕` — extension de l'idiome déjà en place (`ligneInterditStyle`), zéro composant neuf. Sous-en-tête « OBJECTIF PERSONNEL » pour `but`, distinct de « OBJECTIF RATTACHÉ ». Deux widgets chiffrables pour `duree` : Stepper (nombre) ou Field simple ligne (prose) ; `si_bloque` = Field multiline dans les deux hypothèses.

**VERDICT : recevable sous réserve** (verrouiller les deux points de l'objection avant le lot contrat).

---

# ANNEXE — contrat de design exploitable

## Bloc 4 — accordéon, id `objectif-plan-actions`, titre **« Objectif & plan d'actions »** (inchangé, épinglé)

Structure interne, dans l'ordre :

### A. Sous-section « OBJECTIF PERSONNEL » (`but`)
Eyebrow mono caps `OBJECTIF PERSONNEL` — **jamais** « OBJECTIF » nu (collision avec « OBJECTIF RATTACHÉ » du bloc 1).

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| `but.libelle` | `Field` (multiline, rows=2) | `CE QU'IL VEUT` | `interne — prose de jeu d'acteur, jamais lue telle quelle par le joueur` | *« Retrouver le sceau brisé et le remettre en place avant que la brume ne revienne. »* |
| `but.pourquoi` (optionnel) | `Field` (multiline, rows=2) | `POURQUOI` | `interne — motivation, si elle mérite d'être dite` | *« Il porte la faute d'avoir laissé le sceau se briser, cinquante ans plus tôt. »* |
| `but.echeance` (optionnel, destination OUVERTE — non tranchée ici) | `Field` (simple ligne) | `ÉCHÉANCE` | `interne — optionnel, à quel moment ce but devient caduc` | *« Avant la pleine lune prochaine. »* |

Commit au blur, brouillon par champ — même idiome que le bloc Identité (it2).

### B. Sous-section « PLAN D'ACTIONS » (`plan_actions[]`)
Eyebrow `PLAN D'ACTIONS` + légende (`legendeStyle`, sous l'eyebrow) : *« Suite d'étapes vers l'objectif — chacune avec son intention, son déclencheur et une porte de sortie si le joueur bloque le personnage. »*

État vide (0 étape) : **aucune ligne**, seul le bouton pointillé visible — ce n'est PAS une absence (un plan vide au départ est légitime), c'est l'état vide standard du dépôt.

Par étape, une ligne bordée (`div`, `border: 1px solid var(--border-divider)`, `background: var(--surface-sunken)`, `borderRadius: var(--r-md)`, `padding: var(--space-4)`) contenant :

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| — | eyebrow non éditable, dérivé de l'index | `ÉTAPE {n}` | — | — |
| `action` | `Field` (multiline, rows=2) | `INTENTION` | `interne — jamais lu par le joueur — ce que le personnage joue à cette étape` | *« Retourne au sanctuaire à la nuit tombée pour consulter les archives. »* |
| `declencheur_texte` | `Field` (multiline, rows=2) | `DÉCLENCHEUR` | `interne — ce qui fait passer le personnage à cette étape` | *« Le joueur mentionne le sceau brisé devant lui. »* (exemple canonique déjà écrit dans `types.ts`, réutilisé verbatim) |
| `duree` — **HYPOTHÈSE A (nombre)** | `Stepper` | `DURÉE (EN TOURS)` | — | bornes à nommer par tech-lead/narratif-ia (aucune constante existante) |
| `duree` — **HYPOTHÈSE B (prose)** | `Field` (simple ligne) | `DURÉE` | `interne — délai avant que cette étape échoie` | *« Environ trois jours. »* |
| `si_bloque` | `Field` (multiline, rows=2), **dans les deux hypothèses** | `SI LE JOUEUR BLOQUE` | `interne — ce que fait le personnage si son avancée est empêchée` | *« Il change d'approche : au lieu du sanctuaire, il tente sa chance auprès du forgeron. »* |
| suppression | `IconButton`, `tone="danger"`, glyphe `✕` | `Retirer l'étape n°{n}` | — | — |

Note de symétrie (non décisionnelle) : `contre_mesures[].delai` est déjà destination `moteur` — argument favorable à l'hypothèse A pour `duree`, à confirmer par narratif-ia/tech-lead, pas par moi.

Sous la liste : bouton pointillé `boutonPointilleStyle` (réutilisé tel quel, module `styles.ts` existant) — texte **« + Ajouter une étape… »**.

Comportement clavier : après clic sur « + Ajouter une étape… », focus déplacé impérativement (même idiome que `handleClicRegler` d'it3 — ref keyée sur l'identité du personnage, pas un booléen) vers le premier contrôle de la nouvelle ligne (`INTENTION`). Tab traverse dans l'ordre DOM naturel (ÉTAPE → INTENTION → DÉCLENCHEUR → DURÉE → SI LE JOUEUR BLOQUE → ✕ Retirer). Pas de confirmation à la suppression (précédent `interdits_ton`/`ObjectifsCanon` : édition de contenu, pas suppression d'entité référencée).

### C. Sous-section « CONTRE-MESURES » (`contre_mesures[]`) — **section interne, gated `camp === 'antagoniste'`**

**Titre exact : eyebrow `CONTRE-MESURES`.** Légende : *« Réservé aux antagonistes — actions armées en réaction à ce que le joueur déclenche. »*

Précédée d'un séparateur identique à celui de la ligne PV du bloc 3 (`borderTop: 1px solid var(--border-divider)`, `paddingTop: var(--space-5)`).

**Absence (protagoniste ou camp non choisi) : AUCUNE trace dans le DOM** — ni eyebrow, ni légende, ni bouton pointillé. Pas de CTA « + Ajouter des contre-mesures… » pour un protagoniste (conforme KR-196 — c'est une absence, pas un état vide).

**Présence (antagoniste, 0 contre-mesure) :** section visible, seul le bouton pointillé **« + Ajouter une contre-mesure… »** est affiché — le gating porte sur le camp, pas sur le contenu.

Par contre-mesure, même ligne bordée que le plan d'actions :

| Champ | Widget | Label | Hint | Placeholder |
|---|---|---|---|---|
| — | eyebrow non éditable | `CONTRE-MESURE {n}` | — | — |
| `action` | `Field` (multiline, rows=2) | `INTENTION` (même libellé que plan_actions — symétrie) | `interne — jamais lu par le joueur` | *« Fait fouiller le sanctuaire par ses hommes avant l'aube. »* |
| `declencheur_texte` | `Field` (multiline, rows=2) | `DÉCLENCHEUR` | `interne — la condition qui arme cette contre-mesure` | *« Le joueur revient à Val-Cendre après la tempête. »* (exemple canonique déjà écrit dans `types.ts` pour un autre `declencheur_texte`, réutilisé pour cohérence de voix) |
| `delai`, `portee` | hors périmètre de ma tâche — non dessinés ici | — | — | — |
| suppression | `IconButton`, `tone="danger"`, `✕` | `Retirer la contre-mesure n°{n}` | — | — |

## D. Avertissement D1 (KR-189) — **hors accordéon**, sibling de `<Accordion>` dans `champsStyle`, APRÈS le bandeau de refus existant (même ordre que `ObjectifsCanon.tsx`)

- Second `role="status"`, distinct de celui du bandeau de refus (`getAllByRole('status')`).
- Eyebrow réutilisée verbatim : **« ENREGISTRÉ, AVEC AVERTISSEMENT »** (même phrase que `ObjectifsCanon.tsx` — vocabulaire unique dans le produit, reste vraie au montage puisque « enregistré » décrit l'état persisté, pas une action de session).
- `<IssueList issues={avertissementsD1} />`, dérivé `useMemo` sur `validateDossier(dossier).warnings` filtré au personnage sélectionné (même granularité que `refus`).
- Rendu conditionnel : uniquement si le tableau dérivé est non vide (`avertissementsD1.length > 0 &&`) — jamais un `IssueList` vide sous un eyebrow.

## Registres de langue vérifiés
Tous les libellés de champs (`INTENTION`, `DÉCLENCHEUR`, `DURÉE`, `SI LE JOUEUR BLOQUE`, `CE QU'IL VEUT`, `POURQUOI`, `ÉCHÉANCE`, `OBJECTIF PERSONNEL`, `CONTRE-MESURES`) sont mono, majuscules espacées, registre interface. Tous les placeholders sont en fiction 2e-personne-absente/présent, univers Val-Cendre déjà établi (continuité avec les placeholders des blocs 1-3). Aucun terme anglais, aucun jargon technique (`_expr`, `ExprNode`) exposé à l'auteur.
