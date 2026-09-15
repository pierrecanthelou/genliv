# Revue d'itération — `dossier-controles` · itération 3

> Livrée le 2026-09-15 · 1 lot `contrat` · **non committée** au moment d'écrire
> Plan : `.claude/raffinage/dossier-controles-it3.plan.md` (validé, porte 2 franchie)
> Notes de comité : `.claude/raffinage/dossier-controles-it3/` (5 rôles × 2 tours + `mesure-fixtures.md`)

## En une ligne

**L'auteur voit désormais qu'un indice qu'aucune source ne produit rend son aventure injouable** — et, dans le même rapport, un lieu de départ sans personne, un personnage qu'on ne peut rencontrer nulle part, un personnage sans voix propre.

## Les 8 critères

| # | Verdict | Preuve |
|---|---|---|
| 1 — compteur unifié 0/1/≥2 | **VÉRIFIÉ** | `controles.test.ts` `un indice sans aucun producteur bloque, un seul producteur alerte, deux se taisent`. QA mode B a **recalculé l'arithmétique à la main** sur la fixture avant de lire le test |
| 2 — cycle `mene_a` | **VÉRIFIÉ** | `un cycle mene_a sans autre source rend deux alertes, pas deux bloquants`. Discriminance **prouvée par sonde** : boucle `mene_a` retirée → rouge |
| 3 — départ désert + garde de vacuité | **VÉRIFIÉ** | Deux tests (bloquant + silence sur `construireAmorce()`, longueur 4 sur `seme()` ; et référence pendante). Sonde : garde retirée → 6 rouges sur `controles.test.ts` |
| 4 — personnage sans présence | **VÉRIFIÉ** | Deux entités dans le même test (KR-197/202) |
| 5 — personnage sans voix (KR-221) | **VÉRIFIÉ** | Témoin calme portant `caractere` **avec les six curseurs à `CURSEUR_MIN`**, balayés via `CURSEUR_VALUES` — aucune valeur de curseur n'est lue |
| 6 — registre total, section/niveau/path | **VÉRIFIÉ** | Trois tests conjoints ; `path.split('.')[0] !== section` vrai pour les 4 entrées neuves |
| 7 — `jouable` et étanchéité des canaux | **VÉRIFIÉ**, trou fermé après la QA | `jouable === false` asserté inline ; aucun import de `validateDossier` (balayage de source). **La QA mode B a mesuré que l'absence de `severity` n'était tenue QUE par le typage pour les 4 entrées neuves** — une assertion d'exécution a été ajoutée dans le balayage des témoins (donc totale par compilation) |
| 8 — les 6 assertions de ligne de base | **VÉRIFIÉ** | Toutes réécrites via `pourLaRegle(rapport, 'amorce-non-redigee')`, jamais en compte global. Les 8 suites nommées exécutées vertes |

## Diff par lot — conforme au plan, aucune violation

| Fichier | Prévu | Livré |
|---|---|---|
| `src/brain/dossier/controles.ts` | R | R (+379 l.) |
| `src/brain/dossier/controles.test.ts` | R | R (+~430 l.) |
| `src/features/dossier-controles/tests/panneauControles.test.tsx` | R | R (+62 l., **1 test**, les 3 existants intacts) |
| `src/features/bascule-editeur/tests/dossierEditorScreen.test.tsx` | R | R (+21 l., **littéral seul**, zéro assertion modifiée) |

`src/features/dossier-controles/specification.json` est modifié **hors lot**, par l'orchestrateur (report de raffinage) — légitime et attendu.

## Ce qui a été REFUSÉ, et pourquoi — ce qu'un diff ne dira jamais

- **Deux entrées de registre pour orphelin + goulot** — un seul compteur, deux seuils ; scinder aurait été KR-164 en sens inverse. La formulation concurrente à deux branches disjointes laissait `indice.cendres-tiedes` (0 savoir + 1 delta) **tomber entre les branches** : le linter se serait tu sur un indice à source unique. Son auteur l'a retirée.
- **« Indice orphelin » lue depuis `savoirs[].indice_id` seul** — faux positif bloquant **mesuré** sur la fixture de toutes les preuves.
- **Abaisser « indice orphelin » à alerte au nom de l'audience `ia`** — la clause d'it1 était **mesurément fausse** et a été **amendée** dans la spec, pas glosée. Nouveau critère : *la nature du geste qui éteint le voyant* — rédiger de la prose n'est jamais bloquant, poser une référence peut l'être.
- **Une exception d'audience pour un seul chemin** — une exception par chemin cesse d'être une règle au troisième cas. Doctrine conservée.
- **Ajouter `…presence` / `…caractere.parler` à `DESTINATION_DES_CHAMPS`** — ligne morte par construction, rougie par `couverture.test.ts`.
- **Dériver la `section` du `path`** — KR-219, démontré trois fois dans le fichier livré.
- **Section `lieux` pour « départ désert »** — retirée par l'UX après vérification : `depart` a pour clé `charpente.depart`, racine exacte du chemin fautif, et router le bloquant vers `lieux` allumerait un rouge sur une section **où aucun geste ne l'éteint**.
- **Borner « sans voix » à `portee === 'premier'`** — retirée par le narratif sur un motif plus fort que le chiffre : `portee` est le **plancher du schéma**, la borne serait **inerte** sur un dossier réel.
- **La saturation de `mene_a` dès it3** — retirée par le tech-lead après avoir construit la mutation qui l'aurait prouvée : **quatre champs**, donc son propre refus de la fixture d'exercice par la porte de derrière.
- **Un marcheur de chemins générique** pour les sites de deltas — veto tech-lead : second moteur de traversée du schéma, dérivant de la grammaire figée de `sitesDe`.
- **Épingler le volume de `dossier-reference.json` en assertion committée** — accrocherait cette feature à une fixture lue par huit suites et possédée par personne.
- **Toute règle jugeant la qualité d'une prose** — veto narratif, retenu comme doctrine : *une règle dont le verdict n'est pas décidable par une fonction pure et totale du `Dossier` est un appel de modèle, pas une règle de linter.*
- **Grouper, trier ou plafonner les lignes** — masquer un bloquant derrière un plafond contredit le but du linter.

## Ce qui a été REPORTÉ

- **Le clic d'une ligne vers sa section** → **itération 4 nommée**, propriétaire PM, déclencheur événementiel (le commit qui ferme it3). Après **deux** reports muets — celui-ci ne l'est plus.
- **La saturation de `mene_a`** → **it6**, avec l'extraction de `producteursParIndice` vers `atteignabilite.ts`. Le test du cycle **et** celui de l'auto-référence basculeront alors délibérément d'alerte en bloquant.
- **Le pont vers les avertissements de `validateDossier`** → **it5** (pré-requis d'it6 par KR-222).
- **La réserve `climat[].effets_regles`** → `open_questions`, propriétaire n° 14.

## Écarts assumés

1. **Quatre écarts déclarés par l'ouvrier**, tous jugés justifiés et dans le périmètre par la QA mode B : la garde de source (actée en D-10 mais **absente du § 7 du plan** — défaut du plan, corrigé depuis) · l'extension du test forgé au repli `''` · l'amendement d'une docstring devenue fausse · `entityId` renseigné — **extrapolation raisonnable mais non mandatée par le plan écrit**, notée pour mémoire.
2. **Deux affirmations du plan mesurées fausses par la QA mode B**, et corrigées **en ajoutant les tests manquants** plutôt qu'en adoucissant le texte : le cas limite « auto-référence `mene_a` » était annoncé couvert sans l'être ; l'absence de `severity` n'était tenue que par le typage pour les 4 entrées neuves. Les deux tests ont été **sondés** : `severity` injecté par `Object.assign` passe `tsc` et rougit le balayage ; la boucle `mene_a` retirée fait rougir trois tests au lieu de deux.
3. **`SourceIndice` est inobservable** — la fonction étant privée, aucun test ne peut tenir la forme de la valeur de la `Map`. Assumé ; c'est ce qui a dicté sa minimalité (un champ).
4. **`controles.ts` fait 674 lignes** (+379). KR-112 borne les *composants et hooks*, pas un module de logique `brain/` — et le dossier compte déjà `types.ts` (1511), `validate.ts` (841), `tables.ts` (770). À surveiller, pas à bloquer : la scission naturelle est l'extraction déjà contractée pour it6.

## Ce que personne n'a vérifié

- **KR-224** — la prémisse « aucun accès alternatif au premier tour » qui fonde le bloquant « départ désert » n'est vérifiée par **aucun test et ne peut pas l'être** : il n'existe aucun graphe de lieux à interroger. Écrit en `open_questions` pour que personne ne la croie couverte parce que jest est vert.
- **La largeur rendue** du badge composé — jsdom ne calcule aucun layout (hérité d'it2).

## Relevé de volume — mesuré le 2026-09-15, jamais recopié

`controlerDossier(dossier-reference.json)` → **10 lignes, `jouable: false`** · **1 bloquant / 4 alertes / 5 infos**
Par règle : `depart-desert` 1 · `personnage-sans-presence` 4 · `personnage-sans-voix` 5 · **`indice-sans-source` 0**.

**Fait à retenir** : la règle vedette de l'itération est **muette sur le dossier de référence** — ses quatre indices sont à exactement deux producteurs. La régularité relevée au comité est confirmée par le code livré.

## Porte qualité

| | |
|---|---|
| `prettier --check` | **clean** |
| `tsc --noEmit` | **0 erreur** |
| `npm run lint` | **0 erreur**, 1 warning **préexistant et hors lot** (`src/player/components/CharacterCreationScreen.tsx:35`) |
| `npm test` | **85 suites / 1214 tests, tous verts** (avant : 85 / 1213) |
| Score de mutation | **sans objet** — aucun des 4 fichiers mutés n'est au diff, confirmé par mesure et non supposé |
| Table dorée | **sans objet** — aucun registre couvert n'est touché |

## Incident hors périmètre, tracé ici parce qu'il s'est produit pendant l'itération

`docs/EXIGENCE-APERCU-DU-JEU.md` (supprimé, 62 l.) et `docs/REGLES-DU-JEU.md` (amputé de son en-tête « Source de vérité », 13 l.) ont été abîmés par un agent de la session, **sans aucun rapport avec l'itération** — le dépôt était propre au lancement. **Restaurés depuis `HEAD`** par l'orchestrateur ; les deux diffs étant purement soustractifs, aucune ligne écrite n'a été perdue, et la suite complète est repassée verte après restauration. **Aucun agent n'a déclaré avoir touché ces chemins** : le fait a été découvert parce que le rapport du lot les mentionnait comme « préexistants à son lancement », ce qu'ils n'étaient pas.

## Dette écrite, à payer au commit SUIVANT (`.md` seul, sans revue)

**La règle de budget de contexte ne fixe pas sa convention de mesure, et son instrument change donc de verdict sans que le contenu change.** Mesuré ici : le couple `CLAUDE.md` + `docs/WORKFLOW.md` vaut **45 993 o en LF** et **46 473 o en CRLF** — +480 o pour zéro caractère tapé, soit un octet par ligne. Le dépôt est en `core.autocrlf=true`, donc la sortie canonique de `git checkout` est en CRLF, mais `WORKFLOW.md` traînait sur disque en LF depuis une session antérieure. Le plafond de 45 kio a été posé le 2026-08-13 sur une mesure dont la convention n'est pas écrite.

**Rien n'a été compacté sur ce signal**, et c'est délibéré : le cliquet du plafond existe pour empêcher la doctrine de gonfler, pas pour la faire maigrir sur un artefact d'outil. Compacter de vraies règles pour payer des octets que personne n'a tapés serait strictement pire que le dépassement. *Même doctrine que le `RuntimeError` de Stryker : un instrument qui rend un verdict différent sans changement de contenu est en panne, on le répare, on ne le contourne pas.*

**Pourquoi pas dans ce lot** : la clause coûte ~100 o contre ~87 o de marge — elle franchirait le plafond qu'elle clarifie. Elle doit donc **remplacer** du texte (`CLAUDE.md` : « une règle qui entre ici en remplace une »). C'est un changement `.md` seul, que le workflow autorise à committer directement. À poser au commit suivant, pour que la prochaine session ne re-panique pas sur le même faux signal.

## `RETOUR-COMITÉ` — ce que ce découpage a appris

1. **Les deux défauts les plus chers n'ont été trouvés qu'au TOUR 2, et aucun n'était dans le code qu'on modifiait** : le balayage de discriminance de `controles.test.ts` exigeait que *chaque* règle parle sur un dossier semé — contrainte que les règles neuves ne peuvent structurellement pas satisfaire ; et un littéral de test d'une autre feature suffisait à casser une assertion. **Leçon : le tour 1 lit le fichier qu'on modifie, le tour 2 lit ceux qui le consomment.**
2. **Un accord unanime sur une impossibilité n'est pas une mesure.** L'orchestrateur et le tech-lead avaient conclu que « `mene_a` à plat contre saturé » n'était pas prouvable ; la QA a trouvé la mutation d'**un seul champ** qui le prouve — remplacer la collection plutôt que d'y ajouter une arête. Les deux premiers avaient cherché la même forme de mutation et s'étaient confortés mutuellement.
3. **Trois affirmations fausses du tour 1 ont été corrigées par mesure au tour 2, dont deux de l'orchestrateur.** La règle « une affirmation sur la couleur d'un test se mesure » a fonctionné — mais seulement parce qu'un rôle disposait d'un exécuteur. **Le tech-lead n'en a eu aucun aux deux tours** et a dû tout étiqueter « déduit de la forme » ; c'est le poste à effort élevé qui produit le découpage, et c'est celui qui mesure le moins.
4. **La QA mode B a de nouveau trouvé ce que la porte ne voit pas** : deux affirmations du plan optimistes dans le sens qui **surestime la couverture**. Même direction dangereuse qu'à it2 (BUG-084). Corrigées en **écrivant les tests manquants**, pas en adoucissant le plan.
5. **Une contrepartie actée dans le registre des désaccords (§ 8) doit être répercutée au § 7.** D-10 promettait une garde de source que le tableau des tests ne listait pas : l'ouvrier l'a livrée quand même, mais un ouvrier moins scrupuleux l'aurait omise sans que rien ne rougisse.
