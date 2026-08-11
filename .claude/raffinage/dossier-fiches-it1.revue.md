# Revue d'itération — `dossier-fiches` · itération `1`

> Plan : `.claude/raffinage/dossier-fiches-it1.plan.md` (validé le 2026-08-11)
> Exécution : 3 lots — 1 `contrat` (`dev-contrat`, seul et en premier) puis 2 lots feature **en séquence** (et non en parallèle : la règle de l'essaim ne paie le parallélisme qu'à partir de 3 lots restants).
> Version : `0.6.17`

## En une ligne

L'auteur peut **situer un personnage dans son histoire** — lui donner un nom, un camp, un plan, et le rattacher à un objectif du canon — là où la section Personnages n'affichait qu'un état vide.

## Critères d'acceptation

| # | Verdict | Preuve |
|---|---|---|
| 1 | **VÉRIFIÉ** | `panneauPersonnages.test.tsx` — `it('creation: {id, portee:premier, plan_actions:[], savoirs:[]}, camp et nom absents, liste + bloc 1 deplie')`. Assertions : `portee==='premier'`, listes vides, `not.toHaveProperty('camp')`, `not.toHaveProperty('nom')`, repli « Personnage n°1 (sans nom) », `aria-expanded="true"` sur le bloc 1. |
| 2 | **VÉRIFIÉ** | idem — `it('nom en-tete: Field hors accordeon, persiste au blur, la liste et le titre refletent la nouvelle valeur')`. La frappe seule n'écrit pas (`updateSpy` non appelé), le blur écrit une fois, la valeur survit au remontage. |
| 3 | **VÉRIFIÉ**, discriminance éprouvée | idem — `it('camp/plan: commit immediat (un seul appel par clic), badge conditionnel sur camp')`. **Sonde QA** : un double appel injecté dans `handleChangeCamp` fait rougir `toHaveBeenCalledTimes(1)`. |
| 4 | **VÉRIFIÉ** | deux tests — `it('objectif Select etat vide: message exact si 0 objectif dans le canon, aucun Select rendu')` et `it('objectif Select avec objectifs: option Aucun + une par objectif, le choix persiste objectif_id (ou retire la cle)')`. |
| 5 | **VÉRIFIÉ**, discriminance éprouvée | idem — `it('7 placeholders: compte exact = 7 (pas 6 ni 8), textes distincts par iteration cible, titres exacts dans l ordre')`. **Sonde QA** : un bloc gardant son titre mais perdant son texte de placeholder fait tomber le compte à 6 et rougir la ligne — l'assertion de compte porte bien, elle n'est pas doublée par celle des titres. |
| 6 | **VÉRIFIÉ**, discriminance éprouvée | `objectifsCanon.test.tsx` — `it('retirer un objectif reference par un personnage est refuse: objectif conserve, bandeau de refus role status')`. **Sonde QA** : une suppression optimiste locale fait rougir l'assertion « l'objectif reste dans la liste » **alors que le bandeau serait resté vert** — les trois assertions du critère ne sont pas redondantes. |
| 7 | **VÉRIFIÉ** | Pas de test neuf, mais deux instruments existants et non modifiés l'attestent : `suffisance.test.ts` charge `dossier-reference.json` **au niveau module** et lève à l'import si `!ok` (une fixture cassée aurait fait tomber la suite entière, pas un test isolé), et `it('le dossier de reference valide sans erreur ni avertissement')` assert `errors:[]`/`warnings:[]`. Les 6 personnages sont là, un seul porte `camp`/`objectif_id`. |
| 8 | **VÉRIFIÉ** | `tsc --noEmit` 0 erreur · `eslint src` 0 erreur (1 avertissement pré-existant hors périmètre, `CharacterCreationScreen.tsx`, dette BUG-025 déclarée en `overrides`) · `featureDirs.test.ts` vert, `dossier-fiches` ajouté à `FEATURE_DIRS`. Aucun import croisé `dossier-fiches`↔`bascule-editeur` ni ↔`dossier-canon`, vérifié dans les deux sens **y compris dans les tests**. |

**8 critères sur 8 vérifiés.** Aucun « non vérifié par personne ».

## Diff par lot — comparé à la liste du plan

| Lot | Fichiers déclarés | Fichiers touchés | Écart |
|---|---|---|---|
| 1 `contrat` | 11 | 11 | aucun |
| 2 | 7 | 7 | aucun |
| 3 | 2 | 2 | aucun |

Contrôle de propriété par l'`integrateur` : **aucun fichier hors périmètre, aucune entrée de liste laissée intacte**. Les seuls fichiers touchés hors lots sont ceux que le processus écrit lui-même (`specification.json`, `code-knowledge.json`, journaux, `CHANGELOG.md`, `README.md`, roadmap, dossier de raffinage).

## Ce qui a été refusé — et pourquoi

Ce qu'un relecteur ne peut pas deviner du diff :

- **Le retrait d'un personnage** (`REJETÉ`, proposé par l'UX comme symétrie avec `PanneauLieux`/`ObjectifsCanon`, qui livrent création **et** retrait). Motif : ne sert pas la démo d'it1, et un personnage encore vide n'a aucun coût de nettoyage réel à ce stade. Reporté à it2.
- **`RefusEnCours{personnageId, issues}` dans `PanneauPersonnages`** (`REJETÉ`, veto initial de la QA, **retiré par la QA elle-même au tour 2** après relecture d'`ObjectifsCanon.tsx` v1). Motif : aucun champ d'it1 ne peut produire `statut:'refuse'` depuis ce bloc — camp fermé, plan fermé-et-requis, `objectif_id` résout-ou-vide. Construire un bandeau qui ne peut jamais s'allumer serait du code non testable. La doctrine était déjà écrite en commentaire dans le dépôt ; l'itération l'a suivie plutôt que de la contredire.
- **Un 3ᵉ segment « Aucun » sur le `SegmentedControl` du camp** (`REJETÉ` implicitement par la signature retenue). Motif : `onChange` reste `(value: T) => void` et n'émet jamais `undefined` — un segment « Aucun » **écrirait une valeur** dans le document pour dire qu'il n'y en a pas. Un retour à « non renseigné » passera par un bouton « effacer » dédié, le jour où le besoin existe.
- **`fiche{nom, apparence, …}` comme sous-objet** (`REJETÉ` au cadrage, confirmé ici) : doublonnerait `Entite.nom`, deux sources pour un même nom.

## Ce qui a été reporté — et où

- Retrait d'un personnage → `open_questions`, propriétaire **raffinage it2**.
- `RefusEnCours` dans `PanneauPersonnages` → `open_questions`, propriétaire **raffinage it2** — c'est là que la prose libre (`fonction`/`apparence`/`description_joueur`) exposera un vrai chemin de refus. **KR-197 s'y applique directement.**
- `quete_id`, `Personnage.tier`, destination de `objectif.echeance` et de `presence[].quand`, libellés par palier de curseur → `open_questions`, propriétaires n° 6 / n° 13 / raffinage it3 / raffinage it4 / n° 10.

## Écarts assumés

1. **`dossier-minimal.json` et non `dossier-reference.json`** porte le garde d'exhaustivité (`couverture.test.ts:73`), contrairement à ce que supposait le désaccord n° 6 du plan ; `suffisance.test.ts` impose en outre `clés(reference) ⊆ clés(minimal)`. Conséquence : `camp` et `objectif_id` sont instanciés **dans les deux** fixtures — toutes deux déjà dans la liste du lot 1, donc aucun fichier hors périmètre. Le plan avait raison sur la nécessité, faux sur le fichier.
2. **L'itération touche trois features** (`dossier-fiches`, `bascule-editeur` par son test, `dossier-canon` par le lot 3) — un signal de coupe de la skill, relevé et **assumé** à la porte 1 : le lot 3 est le *fallout direct* du lot contrat, pas du travail hors sujet.
3. **Une dispense `LIBRES` ajoutée** pour `monde.personnages[].objectif_id` dans le balayage de couverture (une chaîne corrompue en nombre ne fait rien rougir, la boucle de `REFERENCES_SIMPLES` ne parlant que de chaînes). Forme et motif **identiques à la dispense pré-existante** de `revele_si.apres_indice_id` — rien de neuf n'est arbitré.
4. **Détails visuels de l'accordéon non spécifiés au § 3** (bordure et fond de la racine) : repris de l'annexe UX du tour 1 quand elle disait quelque chose, sinon alignés sur le token de bordure de `ListRow`. Choix d'implémentation, pas une valeur du contrat.

## Blocages non résolus

Aucun.

## Porte qualité

| Instrument | Résultat |
|---|---|
| `prettier --check` | vert |
| `tsc --noEmit` | 0 erreur |
| `eslint src` | 0 erreur · 1 avertissement pré-existant hors périmètre (BUG-025) |
| `jest` | **65 suites / 887 tests, tous verts** |
| `test:mutation` | **sans objet** — aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché |

## Ce que la vérification QA a changé

La QA en mode B a rendu **« livrable avec réserve »** sur un lot pourtant vert, et la réserve était juste : dans `ObjectifsCanon.tsx`, le bandeau de refus s'effaçait au premier commit réussi venu, **même sur un objectif sans rapport** avec celui dont l'écriture avait été refusée. Elle ne l'a pas déduit du code — elle a monté une sonde à deux objectifs distincts et l'a constaté.

C'est **BUG-063**, troisième occurrence de la même classe après BUG-056 (`PanneauCanon`) et BUG-061 (`PanneauLieux`), en deux features. Corrigé avant que quoi que ce soit n'atteigne `main` : `refus` devient `{ objectifId, issues }`, `commit()` reçoit l'objectif en cause, un succès n'efface que s'il touche le **même** objectif. Le test qui le prouve monte deux objectifs ; la réintroduction de l'effacement global le fait rougir seul (1 rouge sur 14), le test mono-entité restant vert — ce qui est exactement la démonstration que le premier test livré ne pouvait pas faire ce travail.

## Ce que la revue de PR a changé

Verdict `REQUEST_CHANGES` au premier tour, sur une tranche déjà verte et déjà passée par la QA. Une majeure et quatre mineures, toutes corrigées avant que quoi que ce soit n'atteigne `main`.

- **La majeure était un nom de clé, pas un bug.** `Personnage.objectif_id` (référence vers le canon, `moteur`) allait cohabiter à it3 avec un bloc `objectif` (la prose du personnage, `ia`) — deux clés `objectif*` voisines sur le même objet, exactement la collision `plan` / `plan_actions` que l'en-tête de `types.ts` compte parmi ses corrections **irréversibles**. Rien n'aurait rougi : les deux chemins sont distincts, le walker de couverture ne collisionne pas. Le défaut ne se serait payé qu'à la n° 10, quand un champ `moteur` serait parti dans un contexte de modèle parce qu'un lecteur aurait supposé que les deux vont ensemble. Tranché **ici** et non différé à it3, parce que `schema: 1` n'a aucun chemin de migration : `objectif_id` part en persistance dès ce commit et ne se renomme plus, alors que la clé d'it3 est encore libre. Le bloc d'it3 s'appellera **`but`** — gravé en **KR-198**, dans la docstring du champ, et dans `design_contract.but_pas_objectif`.
- **`AccordionSection.trailing` retiré** : rendu, mais zéro appelant et zéro test. Une abstraction à zéro consommateur n'est pas un contrat, c'est de la dette — elle reviendra en trois lignes quand it2 voudra afficher le PV dérivé dans un en-tête de bloc.
- **BUG-063 reclassé `discovered_at: "regression"`** : lu dans le fichier de `dossier-canon`, `"iteration-1"` se serait lu « `dossier-canon` it1, 2026-08-08 », alors que le défaut a été trouvé pendant `dossier-fiches` it1, **après** que la feature soit passée `done`.
- **La formule du budget de contexte se contredisait elle-même** : la phrase promettait « `ceil(…)` **plus une marche de 5 kio** » pour les fichiers à croissance normale, et **aucune ligne de la table ne l'avait jamais appliquée**. Le danger est asymétrique — quelqu'un qui applique la phrase à la lettre re-dérive `bug_history.json` à 15 kio, ce que le cliquet inversé interdit. La clause dit désormais que l'arrondi **est** la marche.
- **Une réserve du relecteur qui s'est révélée juste sans qu'il puisse la vérifier** : il n'avait pas de shell et a signalé que `code-knowledge.json` 74 851 → 75 386 (+535 o) était irréconciliable avec 8 KR neufs. Mesure faite : les 8 KR valent 4 700 o, et le cadrage avait **aussi compacté 4 164 o** (KR-062, 063, 067, 090 raccourcis) sans que rien ne le dise. Consigné au CHANGELOG.

## `RETOUR-COMITÉ`

1. **Un test de symétrie mono-entité n'est pas un test de symétrie.** Le lot 3 avait écrit « refus sur A, puis succès sur A → le bandeau part » et l'avait présenté comme la garde d'invalidation. Ce test reste vert sous la régression qu'il prétend interdire. Toute exigence d'invalidation posée par un plan doit désormais **nommer les deux entités** dans le critère, sinon l'ouvrier écrira le test facile de bonne foi. C'est ce qui est gravé en KR-197.
2. **La distinction affichage / invalidation mérite d'être écrite dans le plan, pas laissée au codeur.** Trois occurrences, trois fois le même raisonnement de bonne foi (« cette carte n'a pas de sélection par élément, donc un état global suffit ») — vrai pour l'affichage, faux pour l'invalidation. it2 construira `RefusEnCours` dans `PanneauPersonnages` : son plan doit poser les deux, séparément.
3. **Le comité s'est trompé sur un fichier, pas sur une intention.** Le désaccord n° 6 (instancier les champs neufs dans une fixture) était juste ; il désignait la mauvaise fixture. Un plan qui nomme un fichier de test précis devrait le faire vérifier au tour 2 par celui qui l'a lu, pas par celui qui s'en souvient.
4. **Le lot 3 valide la notion de lot « fallout ».** Un lot hors périmètre strict de la feature, justifié par une régression que le lot contrat introduit mécaniquement, s'est révélé être le lot le plus risqué des trois. À reconduire — mais en sachant que ce n'est pas le petit lot d'appoint qu'il semble être.
5. **Un nom de clé de schéma est une décision d'itération, pas un détail de rédaction.** La majeure de la revue de PR ne portait sur aucun comportement : elle portait sur deux clés voisines qu'un lecteur futur associerait à tort. Sur un `schema: 1` sans chemin de migration, une clé livrée est une clé figée — donc **toute itération qui pose une clé doit aussi trancher les clés voisines que les itérations suivantes ont déjà annoncées**, tant qu'elles sont encore libres. Le comité a la spec sous les yeux : c'est lui qui est le mieux placé pour voir la collision, pas le relecteur du diff.
6. **Le budget de contexte se relit comme une mesure, donc une incohérence de deux chiffres est un signal.** Le relecteur a repéré sans shell que `code-knowledge.json` ne pouvait pas n'avoir grossi que de 535 o pour 8 KR neufs — et il avait raison, une compaction de 4,2 kio était passée sous silence. Une compaction non consignée rend le relevé suivant illisible : elle se note au CHANGELOG, au même titre qu'une scission.
