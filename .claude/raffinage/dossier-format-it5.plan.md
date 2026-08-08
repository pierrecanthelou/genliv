# Plan d'itération — `dossier-format` · itération `5`

> Statut : `validé` par l'auteur du produit le 2026-08-08. Porte 1 (mécanique) verte, porte 2 (humaine) franchie. Reporté dans `src/features/dossier-format/specification.json`.
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-08-08
> Composition : `5 rôles` — motif : l'itération écrit le contenu du dossier d'aventure lui-même (six personnages, cinq lieux) et fixe le premier exemplaire complet que la n° 10 mesurera pour son contexte — touche le dossier d'aventure au sens de la skill `raffinage-iteration`.
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin de cette itération, l'auteur peut partir d'un dossier de référence complet plutôt que d'une page blanche. » |
| **Tranche** | Un fichier JSON réel sur disque (`src/brain/dossier/__fixtures__/dossier-reference.json`), prouvé par un test `brain/` qui lit ce fichier et fait rougir par NOM de branche absente — aucun écran, l'affordance d'import déjà livrée en it1 suffit à le charger tel quel (KR-156). |
| **Lots** | 1 lot · `contrat` : non — aucun fichier de production `src/brain/dossier/*.ts` touché |
| **Hors périmètre** | forme complète de `lieux`/`objets`/`indices` (n°5/n°6) · téléchargement/export (n°2) · « antagoniste » et « relation secrète » comme branches (n°4) · « scène figée » (n°10) · `budget-injectable` (aucun propriétaire avant n°9/n°10) |
| **Reporté** | téléchargement → n°2 (clôturé par une décision, pas un silence) · antagoniste + relation secrète → n°4 · scène figée → n°10 (correction du libellé `open_questions`) · plafond agrégé d'injectable → n°9/n°10 |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut partir d'un dossier de référence complet plutôt que d'une page blanche. » Le dossier de référence est un fichier JSON réel, à six personnages et cinq lieux, dont la suffisance narrative est prouvée par une checklist à sept branches nommées — chacune ancrée sur un champ existant du schéma livré (it1-it4), aucune n'invente de champ.

## 2 — Hors périmètre

- **Forme complète de `lieux[]` / `objets[]` / `indices[]`** — reste `Entite {id, nom?}` ; appartient à n°5/n°6 (Décision A).
- **Téléchargement / export JSON** — `exportDossier` existe déjà au contrat et reste prouvé par un test `brain/` (pas d'affordance visible) ; aucune surface de l'éditeur ne liste les dossiers (`LibraryScreen` ne rend que `books`), l'ajouter inventerait un écran (KR-156). Reporté n°2, nommément, avec une entrée `resolved_decisions` qui ferme le sujet — troisième et dernier report de cette question dans cette feature, il ne glisse plus en silence.
- **« antagoniste » comme branche de la checklist** — le seul ancrage disponible (`objectifs[].echoue_si_expr` référençant un personnage) teste « ce personnage est cité dans une condition d'échec », pas « ce personnage est un antagoniste » : aucun champ n'exprime l'opposition (`camp` arrive en n°4). Une branche verte sur un proxy qui ne teste pas ce qu'elle prétend tester est le patron que cette feature a déjà purgé deux fois (it3, it4) — elle ne s'y reprend pas une troisième. Remplacée par une branche qui teste un registre réel : `certitude` (§ 6, critère 2).
- **« relation secrète » comme branche** — aucun champ `relations[]` au schéma. Même motif, même destination : n°4.
- **« scène figée » comme branche** — `texte_ouverture_joueur` est déjà obligatoire et déjà rempli par tout dossier valide (y compris `dossier-minimal.json`) : une assertion de non-vacuité ne discrimine rien du dossier de référence. Sa propriété définissante (« émise VERBATIM par le moteur ») est un CHEMIN DE CODE, pas une valeur de champ — elle attend son champ en n°10. `open_questions` (spec, ligne 398) sera corrigée : elle affirme aujourd'hui « le format porte un texte et un drapeau », faux — le drapeau n'existe nulle part dans `types.ts`.
- **`budget-injectable` (branche neuve proposée puis retirée par son auteur)** — la charge injectable dépend de `session.jalons_atteints` et vit à côté de l'assembleur n°9/10, qui n'existe pas ; même motif que le retrait de `BUDGET_CONTEXTE` en it2 (« une table sans lecteur »). Une ligne de mesure (mots de `canon.mj` + `canon.partage`) est portée en revue d'itération, sans code, sans constante.
- **Tout fichier de production `src/brain/dossier/*.ts`** (`types.ts`, `tables.ts`, `destinations.ts`, `predicates.ts`, `deltas.ts`, `validate.ts`) — le lot ne les touche pas ; un ouvrier qui en a besoin a franchi le périmètre et s'arrête.
- **Le score de mutation** — sans objet (KR-161, aucun des 4 fichiers mutés touché).

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

Aucune surface neuve, aucun composant, aucun token. Cette itération ne touche ni `src/features/**` ni aucun fichier `.tsx` — données + test uniquement (KR-156 : l'affordance d'import existante n'est l'instrument de preuve d'aucun critère).

Deux éléments UX à garder en mémoire pour de futures itérations, sans action ici :
1. **n°2 (export)** : bouton = extension de la ligne de confirmation d'`ImportDossierButton.tsx`, texte exact « Télécharger le fichier », patron `retryButtonStyle` (bouton texte, pas d'icône — aucun glyphe canonique ne porte le sens « télécharger »).
2. **Écran « Point de départ » (itération non désignée)** : quand `texte_ouverture_joueur` gagnera une zone de saisie, le placeholder reprend le gabarit déjà écrit dans `dossier-minimal.json:121` (« Vous poussez la porte de l'auberge du Fanal ; la salle se tait. ») — amorce fiction, jamais un champ vide.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `validateDossier` | service | consomme | `(input: unknown): DossierValidation` — `./validate`, inchangée |
| `DELTAS`, `CHEMINS_DE_DELTAS` | registre | consomme | `./deltas`, `./tables` — la clôture des sites de deltas s'asserte contre `CHEMINS_DE_DELTAS.length`, jamais recopiée |
| `CERTITUDES`, `PORTEES` | registre | consomme | `./types` — lus pour ancrer les branches 1 et 2 de la checklist |
| `Dossier`, `DossierValidation` | type | consomme | `./types`, `./validate` |

**Rien n'est exposé.** Aucune signature nouvelle, aucun fichier de production modifié — le lot est un consommateur pur des cinq contrats ci-dessus.

*(§ 4 bis omise : aucun appel modèle en it5, donc aucun contrat de sortie IA — vérifié par le rôle Narratif & IA au tour 1 et confirmé au tour 2. Le risque qu'il porte — le dossier de référence devient le premier exemplaire complet mesuré par l'assembleur de contexte de la n° 10, sans borne agrégée aujourd'hui — n'est pas un contrat à figer ici : c'est une ligne de mesure portée au § 10.)*

## 5 — Lots

> Un seul lot : l'itération produit une donnée (fixture JSON) et un test qui la lit. Inventer un second lot ne révélerait aucun parallélisme, il fabriquerait une fusion pour rien.

### Lot 1 — `dossier-reference`
- **Ouvrier** : `dev-lot`, effort standard, sans worktree, séquentiel — aucun contrat `brain/` n'est exposé, ce n'est pas un lot `contrat`.
- **But** : livrer le dossier de référence (six personnages, cinq lieux) comme fichier JSON réel, et la checklist de suffisance à sept branches qui le prouve.
- **Fichiers** :
  - `src/brain/dossier/__fixtures__/dossier-reference.json` (N)
  - `src/brain/dossier/suffisance.test.ts` (N)
  - `src/features/dossier-format/specification.json` (R — goal d'it5, `resolved_decisions`, `open_questions`, statut de l'itération)
  - `CHANGELOG.md` (R), `features_history.json` (R), `README.md` (R), `package.json` (R — PATCH +1), `docs/ROADMAP-BASCULE-IA.md` (R — colonne Statut, § 1 ter si besoin), `bug_history.json` (R — si un défaut est levé en auto-revue), `code-knowledge.json` (R — si un KR neuf apparaît)
- **Expose / consomme** : consomme uniquement (§ 4) ; n'expose rien.
- **Critères couverts** : tous (§ 6), un seul lot.

*(1 lot. Aucun découpage supplémentaire — le tech-lead l'a mesuré : `dossier-minimal.json` est lue par sept fichiers de test existants, dont plusieurs épinglent `id`/`titre` ; la faire grossir toucherait sept fichiers pour rien. Le dossier de référence est un SECOND fichier, lu par un seul test neuf.)*

## 6 — Critères d'acceptation

*(7 branches sous UN critère de suffisance + 4 critères de forme = 5 critères. Sous le plafond de 8.)*

1. **Étant donné** le dossier de référence (six personnages, cinq lieux) lu depuis le FICHIER réel, **quand** on appelle `validateDossier`, **alors** elle retourne `ok: true`, `errors: []` **et** `warnings: []` — sans exception, sans avertissement caché derrière un « c'est juste un warning ». *(contrat)* — *lot 1*
2. **Étant donné** la checklist de suffisance, **quand** elle s'exécute contre le dossier de référence, **alors** chacune des SEPT branches suivantes est non vide, chaque échec nommant la branche par son NOM, jamais un contrôle à l'œil : `portee=second` · `fin avec …_expr` (`Fin.condition_expr`) · `savoir avec porte apres_indice` (`Savoir.revele_si.apres_indice_id`) · `jalon sans declencheur_expr mais atteignable par un delta atteindre_jalon` · `événement sans declencheur_texte ni declencheur_expr` · `certitude non-sait (croit ou soupçonne) sur au moins un savoir` · `delta sur chaque cible ADMISSIBLE`. *(contrat)* — *lot 1*
3. **Étant donné** le dossier de référence, **quand** on compare l'ensemble de ses clés JSON à celui de `dossier-minimal.json`, **alors** aucune clé n'est en trop — le dossier de référence n'introduit AUCUNE surface de schéma que la fixture minimale ne porte déjà, garde mécanique contre un champ ajouté hors périmètre. *(contrat)* — *lot 1*
4. **Étant donné** le dossier de référence, **quand** on compte les sites de deltas réellement parcourus par le test, **alors** ce compte est égal à `CHEMINS_DE_DELTAS.length` — un cinquième emplacement ajouté demain fait rougir ici plutôt que de passer inaperçu. *(contrat)* — *lot 1*
5. **Étant donné** le dossier de référence lu depuis le FICHIER réel, **quand** on l'importe puis l'exporte par les fonctions publiques (`DossierService.importDossier` / `.exportDossier`), **alors** le document réexporté est deep-equal à l'import et reste valide (round-trip, KR-156). *(contrat)* — *lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `le dossier de reference valide sans erreur ni avertissement` | `validateDossier(reference)` → `ok:true, errors:[], warnings:[]` | contrat | critère 1 | 1 |
| `chaque branche de la checklist de suffisance est non vide` | `BRANCHES.filter(b => !b.predicat(reference))` → `[]`, échec par nom de branche | contrat | KR-157, critère 2 | 1 |
| `portee=second est instanciee` | au moins un `Personnage.portee === 'second'` | unitaire | KR-157 | 1 |
| `une fin porte condition_expr` | au moins un `Fin.condition_expr` défini | unitaire | KR-157 | 1 |
| `un savoir porte une porte apres_indice` | au moins un `Savoir.revele_si.apres_indice_id` défini | unitaire | KR-157 | 1 |
| `un jalon sans declencheur_expr est atteignable par un delta` | jalon avec `declencheur_expr` absent, et son `id` figure comme cible d'un `Delta{delta:'atteindre_jalon'}` dans `effet[]`/`consequence[]`/`recompense[]` | unitaire | durcissement narratif tour 2 | 1 |
| `un evenement sans declencheur_texte ni declencheur_expr` | au moins un `Evenement` avec les deux champs absents | unitaire | KR-157 | 1 |
| `une certitude non-sait est instanciee` | au moins un `Savoir.certitude` ∈ `{'croit','soupconne'}` | unitaire | remplace la branche « antagoniste » retirée | 1 |
| `delta sur chaque cible admissible` | chaque emplacement de `CHEMINS_DE_DELTAS` dont la cible est admissible (hors `climat[].effets_regles`, sans delta admissible) porte au moins un `Delta` instancié | unitaire | correction it4, critère 2 | 1 |
| `aucune cle en trop face a dossier-minimal` | `Object.keys` profonds du dossier de référence ⊆ ceux de `dossier-minimal.json` | contrat | critère 3 | 1 |
| `le compte de sites de deltas parcourus egale CHEMINS_DE_DELTAS.length` | assertion de clôture | contrat | critère 4 | 1 |
| `le dossier de reference traverse import puis export intact` | deep-equal post round-trip | contrat | KR-156, critère 5 | 1 |

Cas limites : **sans objet pour la plupart** — cette itération ne touche aucune UI (pas de vide/doublon/hors-ligne/annulation/double soumission à couvrir). Le seul cas limite pertinent est déjà un critère : un `warnings` non vide doit faire échouer le critère 1, pas être ignoré comme « juste un avertissement ».

**Non vérifiable en l'état** — à recopier dans la revue : la fidélité narrative du dossier de référence comme « bon exemple » au-delà de ce qu'un test nomme (lecture humaine, pas instrument) · le nombre de mots injectables (`canon.mj.synopsis_mj` + `canon.partage.accroche_joueur`) doit être mesuré et cité tel quel, sans plafond posé (aucun assembleur avant n°10) · qu'`open_questions` et `resolved_decisions` de la spec ont bien été mises à jour (téléchargement clôturé, scène figée corrigée, antagoniste/relation secrète renvoyées n°4).

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | QA → tous | Le critère 9 existant de la spec dit encore « delta sur chaque cible » sans ADMISSIBLE, alors que `resolved_decisions` d'it4 l'a déjà tranché | `RETENU` | Corrigé dans ce plan (§ 6, critère 2) et dans `specification.json` du lot. Décalage confirmé par lecture directe, pas supposé |
| 2 | PM / Tech Lead / QA / Narratif | « scène figée » comme branche de la checklist | `REJETÉ` — reformulation refusée, branche exclue | `texte_ouverture_joueur` non vide est vrai de TOUT dossier valide : non discriminant (KR-162). Sa propriété réelle (émission verbatim) est un chemin de code, attend n°10. Consensus unanime après que le narratif a retiré sa propre reformulation |
| 3 | PM / QA / Narratif → Tech Lead (tour 1) | « antagoniste », requalifiée et gardée par le Tech Lead au tour 1 (« personnage cité dans `echoue_si_expr` ») | `REJETÉ` — arbitrage orchestrateur | Le proxy disponible teste « un personnage est cité dans une condition d'échec », pas « c'est un antagoniste » : aucun champ ne modélise l'opposition (`camp`, n°4). Même défaut que « scène figée » (branche verte sans tester ce qu'elle prétend), et le Tech Lead a lui-même proposé un remplacement plus solide (`certitude`) dans ce même tour. **Arbitré contre la lettre des notes de QA et Narratif du tour 2** (qui avaient accepté la requalification avant de voir le retrait du Tech Lead) — leur propre doctrine (KR-162, invoquée par QA contre la reformulation narrative du point 2) s'applique symétriquement ici |
| 4 | Tech Lead | Branche de remplacement : `certitude ∈ {croit, soupçonne}` sur au moins un savoir | `RETENU` | Registre `CERTITUDES` existant, jamais instancié dans la fixture minimale ; teste une propriété narrative réelle (« une rumeur n'est pas un fait ») sans inventer de champ. Non contesté au tour 2 |
| 5 | PM / Tech Lead / QA / Narratif | « relation secrète » comme branche | `REPORTÉ n°4` | Aucun champ `relations[]` au schéma ; aucune feature éditrice avant n°4 (Décision A). Consensus unanime dès le tour 1 |
| 6 | PM / Tech Lead / UX | Téléchargement (affordance d'export) en it5 | `REPORTÉ n°2` | Aucune surface de l'éditeur ne liste les dossiers (`LibraryScreen` ne rend que `books`) ; l'ajouter inventerait un écran (KR-156). Consensus unanime dès le tour 1, UX fournit le contrat de design par avance (§ 3) |
| 7 | QA | Le report du téléchargement doit être une décision ÉCRITE (`resolved_decisions`), pas un silence — troisième glissement de la même question depuis it3 | `RETENU` | Condition de recevabilité de la QA, sans coût : une entrée `resolved_decisions` ferme le sujet dans ce lot (§ 5, fichiers du lot 1) |
| 8 | Narratif | `budget-injectable` — 8ᵉ branche neuve, plafond de mots injectables agrégé | `REPORTÉ n°9/n°10`, retirée par son propre auteur au tour 2 | Même motif que le retrait de `BUDGET_CONTEXTE` en it2 : une table sans lecteur avant l'assembleur de contexte, qui n'existe pas. Remplacée par une ligne de mesure en revue (§ 7, sans code) |
| 9 | Narratif | Durcissement : le jalon sans `declencheur_expr` doit être atteignable par un delta `atteindre_jalon`, sinon c'est du lore mort | `RETENU` | Mécanique, sur champs et registre existants (`deltas.ts`), aucun champ neuf. Intégré à la branche 4 du critère 2 (§ 6) et au test nommé correspondant (§ 7) |
| 10 | Narratif | `warnings: []` non négociable — sa seule garantie que le canon reste sous les budgets de mots existants | `RETENU` | Déjà la position de tous les rôles (critère 1, § 6) ; confirmé sans opposition |
| 11 | PM / Tech Lead | Phrase de démo : « charger » (proposée au cadrage) vs « partir d'un dossier de référence complet » (goal déjà écrit) | `RETENU` — seconde formulation | Le Tech Lead objectait que « charger » implique une UI qui n'existe pas dans cette itération (Variante A test-only). Le PM a tranché pour la formulation du goal déjà écrit, vraie sous Variante A : l'affordance d'import existante (it1) suffit, aucune nouvelle surface n'est nécessaire pour que la phrase soit honnête |
| 12 | Tech Lead | Découpage en lots : Variante A (1 lot test-only) vs Variante B (2 lots, dont un `contrat`, avec UI de chargement dédiée) | `RETENU` — Variante A | Conséquence directe du désaccord 11 : la démo ne promet pas de clic, donc aucune UI à câbler. Recommandation du Tech Lead lui-même, non contestée |

**Aucun veto ne tient après le tour 2** — pas de bloc `ESCALADE`. Le seul arbitrage tranché contre une majorité de notes (désaccord 3) l'est sur une incohérence entre les notes du tour 2 elles-mêmes : QA et Narratif avaient répondu au tour 1 du Tech Lead (qui gardait la branche) avant que celui-ci ne se rétracte dans sa propre note de tour 2 — les trois rôles n'ont donc jamais confronté la version finale les uns des autres sur ce point précis, propriété du fonctionnement en parallèle sans second échange. L'orchestrateur tranche en faveur de la cohérence interne (la doctrine KR-162 que QA applique elle-même au désaccord 2 s'applique symétriquement ici) plutôt qu'en faveur du compte de notes.

## 9 — Innovation

**Aucune.** La seule proposition hors-cadre (`budget-injectable`) a été retirée par son propre auteur au tour 2. Budget non consommé.

## 10 — Définition de fini

- [ ] Porte qualité verte : Prettier → `tsc --noEmit` → `npm run lint` → `jest` complet
- [ ] `npm run test:mutation` — **sans objet** (KR-161, aucun des 4 fichiers mutés touché)
- [ ] Tests du § 7 écrits et passants, échec par NOM de branche vérifié (pas seulement le cas vert)
- [ ] Les 5 critères du § 6 cochés un par un
- [ ] Aucune régression sur les 7 fichiers de test existants qui lisent `dossier-minimal.json` (elle n'est ni renommée ni modifiée par ce lot)
- [ ] Aucun fichier de production `src/brain/dossier/*.ts` touché — vérifié par `git diff --stat`
- [ ] `specification.json` : goal d'it5 confirmé, `resolved_decisions` reçoit les entrées téléchargement/antagoniste-relation-secrète/scène-figée, `open_questions` reçoit `budget-injectable` (propriétaire n°9/10) et perd les trois questions désormais tranchées ; `open_questions` existante sur la « scène figée » (ligne 398) corrigée : retirer la mention d'un « drapeau » qui n'existe pas dans `types.ts`
- [ ] `docs/ROADMAP-BASCULE-IA.md` : colonne Statut de `dossier-format` passe à **5/5**, et la feature est marquée `terminée` — c'est la dernière itération
- [ ] Ligne de revue portée (§ 7, non vérifiable en l'état) : nombre de mots de `canon.mj.synopsis_mj` + `canon.partage.accroche_joueur` du dossier de référence, cité tel quel
- [ ] `CHANGELOG.md`, `features_history.json`, `README.md` mis à jour ; `package.json` PATCH +1
- [ ] Budget de contexte relevé (`docs/WORKFLOW.md` § Budget de contexte) — `specification.json` de `dossier-format` était déjà proche de son plafond à it4 (66 272/66 560 o) ; à remesurer après l'ajout des entrées de ce lot, compaction dans le même lot si le plafond est franchi
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-format-it5.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | feu vert | critère 9 réécrit à 7 branches + report antagoniste/relation secrète n°4 + téléchargement clôturé par décision écrite |
| Tech Lead | APPROUVÉ | 1 seul lot, aucun fichier de production `brain/` touché, remplacement `certitude` accepté |
| UX | recevable, sans objet | aucune surface neuve en it5 ; contrat de design pour n°2 livré par avance (§ 3) |
| QA | recevable | 4 conditions posées au tour 2, toutes intégrées (§ 6 critère 2 corrigé, scène figée exclue, `resolved_decisions` téléchargement, `budget-injectable` hors code) |
| Narratif & IA | recevable | reformulation « scène figée » retirée, `budget-injectable` retiré et remplacé par une ligne de revue, durcissement du jalon intégré, `warnings: []` non négociable retenu |

---

**Plan écrit dans `.claude/raffinage/dossier-format-it5.plan.md`. Valide, ou dis ce qui doit changer.**
