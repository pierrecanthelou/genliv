# Cadrage — feature n°6 `dossier-registres`

Statut : **validé** (2026-08-17). Écrit dans `src/features/dossier-registres/specification.json` et répercuté dans `docs/ROADMAP-BASCULE-IA.md` (§2 l.150/170, §1 bis `tree-canvas`, §5 `quetes[].etapes`) — la compaction de budget déclenchée par ces mêmes édits (36790 → 35705 o, sous le plafond de 35 kio) est faite dans le même lot. Prochaine étape : `/raffiner dossier-registres 1`.

Comité : 4 rôles socles (PM, Tech Lead, UX, QA), pas de `narratif-ia` — décision du roadmap (`docs/ROADMAP-BASCULE-IA.md` §2 l.150 : « 4 rôles » ; §2 l.220 : `narratif-ia` réservé aux n°1/4/7/8 + Temps 2). Cette feature est schéma + écrans, comme `dossier-objets`/`dossier-canon` — aucune nouvelle frontière prompt/moteur/mémoire de session.

Notes brutes : `.claude/raffinage/dossier-registres-cadrage/tour{1,2}-{pm-produit,tech-lead,ux-designer,qa}.md`.

## Arbitrage (tour 3, orchestrateur)

| # | Désaccord | Statut | Motif |
|---|---|---|---|
| 1 | Nombre et découpage d'itérations | **RETENU** — 5 itérations : Indices · Jalons & fins · Quêtes · Événements · Climat | Convergence Tech Lead + UX + QA au tour 2 (PM soutenait 4, mais sa position était contingente d'une proposition tech-lead tour 1 que tech-lead a lui-même retirée au tour 2 avec un motif plus fort) |
| 2 | Graphe visuel des indices (repointage `tree-canvas`) | **REJETÉ, hors périmètre total** | Veto tech-lead confirmé unanimement au tour 2 (durci, PM retire sa proposition, UX durcit son rejet, QA durcit en veto) : `tree-canvas` est câblé sur `BookNode`/`Edge` condamnés, sa démolition physique est déjà planifiée en n°9, `demontageArbre.test.ts` (possédé par `bascule-editeur`) verrouille sa non-atteignabilité, et aucun instrument du dépôt ne couvre pan/zoom/layout (specs navigateur différées). `indices[].mene_a` est livré comme DONNÉE + repli textuel (ListRow/localiserEntite) uniquement |
| 3 | `jalons`/`fins` : dans n°6 ou réassigné (n°7) ? | **RETENU — reste dans n°6**, itération propre | 3 rôles sur 4 (tech-lead tour 2, UX, QA) convergent indépendamment : le roadmap l'assigne déjà deux fois à n°6 (§2 l.162, §5 l.234, motif « dépend du registre DELTAS que n°6 introduit ») ; n°7 lit `condition_texte`/`declencheur_texte` déjà présents, livrer le linter avant l'écran qui répare nommerait un défaut sans réparation |
| 4 | Ordre des 5 itérations | **RETENU — ordre tech-lead** : Indices(1) → Jalons&Fins(2) → Quêtes(3) → Événements(4) → Climat(5) | Tech-lead est le domaine désigné pour « l'ordre imposé par les dépendances » (skill raffinage-iteration). Jalons&Fins est la tranche la moins chère (D1 déjà câblé depuis n°1, un seul champ neuf) — la placer tôt limite le risque avant les tranches plus riches. UX proposait « dernier » (motif langue, plus faible : le motif d'avertissement D1 existe déjà ailleurs dans le dépôt, pas besoin de le roder dans CETTE feature d'abord) ; QA proposait « entre Quêtes et Climat » sans motif de dépendance concret. Les deux dissensions sont notées, pas silencieuses |
| 5 | `Quete.lie_au_canon` | **REJETÉ** | Forme sans consommateur nommé, dérivable — même anti-patron déjà tranché deux fois par `dossier-objets` it1 (« tier », « objet de scénario », KR-192-like). Devient un badge dérivé futur (n°7) si un besoin réel apparaît, jamais un champ auteur |
| 6 | `Evenement.nature` (monstre\|scene\|obstacle) | **RETENU au schéma, cas `'monstre'` REPORTÉ** | `nature` reste au schéma (distinction scene/obstacle a une vraie valeur auteur) ; la question de dériver `'monstre'` depuis `monstre_ref` plutôt que de la stocker part en `open_questions`, à trancher au raffinage de l'itération 4 |
| 7 | `conditions.contraintes` (faim/froid/poursuite) | **REJETÉ définitivement** | Ce sont des états de SESSION (bandeau d'horloge, plan-cible §2.7), pas une donnée du dossier auteur — mauvais document, pas seulement « sans consommateur ». Propriété éventuelle de n°9, jamais de n°6 |
| 8 | `Climat.effets_regles` — « effets chiffrés » du plan-cible | **RETENU inchangé (Delta[]), REPORTÉ pour l'extension** | `DELTAS` n'admet aujourd'hui aucun opérande entier ; ouvrir un `DeltaModificateur` exige `docs/REGLES-DU-JEU.md` → table dorée → code (KR-130), propriétaire n°11/n°13, pas cette feature |
| 9 | Récompense de quête en XP | **REPORTÉ** | Aucune entrée `DELTAS` à opérande entier ; `ΔT` (roadmap §5) encore à définir par n°11 |
| 10 | `lieux[].acces` (KR-200, hérité de `dossier-objets`) | **REJETÉ pour n°6, `open_questions` maintenue** | Son écran vivrait dans `PanneauLieux.tsx`/`FicheLieu.tsx`, possédés par `dossier-canon` (déjà `done`) — un lot de n°6 qui les toucherait violerait la propriété exclusive de fichier (veto tech-lead, § encapsulation). Recommandation non mandatée : itération 5 de `dossier-canon` |
| 11 | `EditeurEffets` (composant partagé pour `Delta[]`) | **RETENU** | Composant local à `dossier-registres/components/`, né en itération 3 (Quêtes), réutilisé sans fork par l'itération 4 (Événements). Pas promu `brain/components/` avant un 2e appelant EXTÉRIEUR à la feature (KR-109) |
| 12 | Libellés `lie_a_histoire` (Événements) | **RETENU** — proposition UX | SegmentedControl en tête de liste, deux onglets « LIÉS À LA TRAME » / « LIBRES » — jamais le mot « canon » (réservé, mais devenu sans objet côté Quêtes depuis le rejet de `lie_au_canon`) |
| 13 | Deux tests neufs pour jalons/fins (condition QA) | **RETENU** | (a) `couverture.test.ts` étend sa table aux `Delta[]` de jalons/fins ; (b) garde D1 en région `role="status"` avec discriminance à deux entités (un jalon/une fin conforme, un non conforme) — condition posée par QA pour que l'itération 2 entre dans le découpage, actée en `known_risks` |
| 14 | Correction roadmap : `quetes[].etapes` (§5) | **RETENU** | « n°1 · n°9 » → « n°6 (la forme) · n°9 (l'avancement) » — périmé depuis la Décision A qui donne la forme complète de `quetes` à n°6 |
| 15 | Corrections roadmap : phrase §2 l.170 et §1bis l.87 (`tree-canvas`) | **RETENU** | Retirer « + son graphe » de la phrase de démo n°6 ; `tree-canvas | repointée (n°6)` → `en sommeil ; repointage NON ASSIGNÉ`, avec renvoi vers ce cadrage |

Aucun veto ne tient encore après le tour 2 — pas de bloc `ESCALADE`.

## Contenu prévu de `features/dossier-registres/specification.json` (à écrire après validation)

```json
{
	"feature": "dossier-registres",
	"created_at": "2026-08-17",
	"status": "planned",
	"design_reference": "docs/ROADMAP-BASCULE-IA.md §2 l.150/170 (intention, comité à 4 rôles) et §5 (trous à combler, corrigés par ce cadrage). docs/PLAN-BASCULE-IA.dc.html lignes 190-241 (schéma abrégé) et 546-553 (description des 4 sections) — RÉFÉRENCE PARTIELLEMENT PÉRIMÉE (CLAUDE.md : les .dc.html ne sont pas du code de production) : le graphe visuel évoqué en ligne 266 n'est PAS repris (tree-canvas hors périmètre, cadrage 2026-08-17, KR-204) ; conditions.contraintes (ligne 232-233) n'est PAS repris (état de session, pas une donnée du dossier auteur, KR-207) ; quetes[].lie_au_canon (ligne 219) est REJETÉ (forme sans consommateur, KR-206). La forme qui fait foi est src/brain/dossier/types.ts, telle qu'arbitrée par dossier-format et étendue par cette feature. Les 4 sections (indices, quêtes, événements, conditions — index 6/7/8/9 de src/brain/dossier/sections.ts) plus la section jalons-fins (index 10) sont aujourd'hui des états vides honnêtes rendus par PanneauSection.tsx (bascule-editeur) — cette feature les remplace un panneau à la fois, sans jamais importer directement bascule-editeur (KR-184).",
	"plan": {
		"goal": "Donner à l'auteur les cinq derniers écrans de registre de son dossier — indices (avec leurs enchaînements en liste textuelle), jalons & fins, quêtes, événements (liés à la trame ou libres), climat — de sorte que chaque identifiant déjà référencé ailleurs dans le schéma (indice_id des savoirs, condition_texte/declencheur_texte des fins/jalons) cesse d'être une référence orpheline, et que l'auteur puisse fermer la boucle de son aventure.",
		"design_contract": {
			"surface": "5 panneaux (indices, jalons-fins, quetes, evenements, conditions) remplacent l'état vide de bascule-editeur section par section, injection via App.tsx (prop panneaux de DossierEditorScreen), jamais d'import direct (KR-184). Motif commun : liste-à-gauche ListRow (réordonnancement composé par 2 IconButton Monter/Descendre, jamais une prop sur ListRow.tsx, précédent dossier-objets) + fiche-à-droite Card avec Field. Retrait : Modal + IssueList, jamais immédiat (précédent RetirerObjetDialog).",
			"references_croisees": "Select + avecOrpheline() + localiserEntite() pour toute référence (donneur_id, mene_a[], monstre_ref) — précédent BlocSavoirs.tsx/BlocRelations.tsx (dossier-fiches). JAMAIS TargetPicker (lié à BookNode, modèle condamné).",
			"editeur_effets": "Un seul composant EditeurEffets, local à dossier-registres/components/ (KR-109, pas promu brain/ avant 2e appelant extérieur), né en itération 3 (Quêtes, recompense: Delta[]), réutilisé sans fork par l'itération 4 (Événements, resolutions[].consequence). Climat (it5) n'en a pas besoin : aucune opération Delta à opérande entier n'existe pour effets_regles (KR-208), donc pas d'éditeur dédié dans cette feature.",
			"graphe_hors_perimetre": "indices[].mene_a se rend en LISTE TEXTUELLE d'identifiants (ListRow/localiserEntite), jamais un canevas. Le repointage visuel de tree-canvas sur le graphe de relations+indices (roadmap §1bis) est HORS PÉRIMÈTRE TOTAL de cette feature — veto tech-lead confirmé unanimement (KR-204).",
			"lie_a_histoire": "Événements : SegmentedControl en tête de liste, deux onglets « LIÉS À LA TRAME » / « LIBRES », pilote lie_a_histoire (filtre de liste, pas un chip par ligne). Jamais le mot « canon » côté Événements.",
			"d1_jalons_fins": "Garde D1 (declencheur_texte/condition_texte sans son jumeau _expr) rendue par lecture DÉRIVÉE (useMemo sur validateDossier(dossier).warnings), région role=\"status\" distincte de tout bandeau de refus (précédent dossier-canon it3, dossier-fiches it4 ; code-knowledge.json risk l.557 nommait déjà cette feature comme porteuse attendue pour jalons/fins/evenements).",
			"composants": "Réutilisés tels quels : Field, ListRow, Card, IconButton, Badge, Modal, IssueList, Select, SegmentedControl, Toggle. Un seul composant neuf hors EditeurEffets : aucun — tous les autres motifs ont un précédent direct.",
			"textes": "Placeholders proposés (UX, tour 1) : Quêtes — titre \"La dette du forgeron\", vide \"Aucune quête — cliquez « + Ajouter une quête… » pour commencer.\" ; Indices — verite \"Le sceau a été brisé par le gardien lui-même, vingt ans plus tôt.\", formulation_joueur \"Une odeur de cendre froide, là où elle ne devrait pas être.\" ; Événements — declencheur_texte \"Le joueur revient à Val-Cendre après la tempête.\" ; Climat — libellé \"Tempête de cendres\". Chaque section reprend le motif vide « Aucun·e X — cliquez « + Ajouter... » pour commencer. »"
		},
		"acceptance_criteria": [
			"Étant donné le dossier de référence, quand chaque itération de dossier-registres est livrée, alors les entités déjà persistées restent acceptées par validateDossier sans régression de leurs champs hors du lot en cours (non-régression nommée, précédent dossier-objets critère 6).",
			"Étant donné un indice référencé par savoirs[].indice_id ou savoirs[].revele_si.apres_indice_id d'un personnage, quand l'auteur consulte le registre Indices, alors mene_a[] affiche la relation source→cible en LISTE TEXTUELLE d'identifiants — jamais un rendu canevas (KR-204).",
			"Étant donné un jalon ou une fin dont declencheur_texte/condition_texte est renseigné sans son jumeau _expr, quand la fiche se rend, alors un avertissement D1 est visible via une lecture DÉRIVÉE, jamais un état semé une fois (précédent dossier-canon it3/dossier-fiches it4).",
			"Étant donné un événement lie_a_histoire: true et un second false, quand le panneau Événements se rend, alors le premier apparaît dans « Liés à la trame » et jamais dans « Libres », et réciproquement (discriminance à deux entités, KR-197/199/202).",
			"Étant donné une quête, quand l'auteur lui ajoute une récompense via EditeurEffets, alors la ligne est persistée comme entrée de Delta[], et le même composant est réutilisé sans fork par Événements — critère d'architecture, prouvé par l'absence d'un second composant équivalent dans le lot Événements.",
			"Étant donné un climat, quand l'auteur lui donne un libellé et une durée, alors ces deux champs sont persistés ; effets_regles reste un Delta[] éditable via les opérations existantes, sans nouvelle opération à opérande entier (KR-208).",
			"Étant donné le nouveau code, quand npm run lint et tsc --noEmit tournent, alors zéro erreur : aucun import direct entre dossier-registres et bascule-editeur (KR-184), aucune couleur en dur, et aucun fichier de dossier-canon ou tree-canvas dans la liste de fichiers d'un lot de cette feature (KR-205/KR-204).",
			"Étant donné les 5 itérations strictement sérielles (un seul lot contrat par itération, KR-210), quand une itération est raffinée, alors son lot contrat ne partage aucun fichier brain/dossier/* en cours d'écriture avec une itération non encore livrée."
		],
		"brain_contracts": [
			{ "type": "type", "name": "Indice extends Entite (brain/dossier/types.ts) — portee?, verite?, formulation_joueur?, mene_a?: string[] — monde.indices cesse d'être Entite[]", "direction": "provides" },
			{ "type": "registry", "name": "PORTEES_INDICE / PorteeIndice — registre fermé distinct de PORTEES (personnage) et PORTEES_CONTRE_MESURE", "direction": "provides" },
			{ "type": "type", "name": "Fin extended — texte?: string (prose émise au joueur, consommateur futur n°15)", "direction": "provides" },
			{ "type": "type", "name": "Quete extended — donneur_id?, objectif?, etapes?: EtapeQuete[], echeance? — recompense: Delta[] inchangé", "direction": "provides" },
			{ "type": "type", "name": "EtapeQuete — { etape: number, libelle: string }, liste ordonnée de prose, sans declencheur_expr (D1 reste à six familles)", "direction": "provides" },
			{ "type": "type", "name": "Evenement extended — lie_a_histoire?: boolean, nature?: NatureEvenement", "direction": "provides" },
			{ "type": "registry", "name": "NATURES_EVENEMENT / NatureEvenement — registre fermé (monstre|scene|obstacle)", "direction": "provides" },
			{ "type": "type", "name": "Climat extended — duree?: string — effets_regles: Delta[] inchangé", "direction": "provides" },
			{ "type": "component", "name": "dossier-registres/components/EditeurEffets — composant local (KR-109), né en it3 Quêtes, réutilisé sans fork par it4 Événements", "direction": "provides" },
			{ "type": "service", "name": "DossierService.update(id, recette): EcritureDossier — réutilisé sans changement de signature", "direction": "consumes" },
			{ "type": "event", "name": "dossier:updated", "direction": "emits", "payload": { "dossierId": "string" } },
			{ "type": "component", "name": "brain/components/{Field, ListRow, Card, IconButton, Badge, Modal, IssueList, Select, SegmentedControl, Toggle}", "direction": "consumes" }
		],
		"walking_skeleton": "Itération 1 (Indices) est la tranche la plus fine : un indice se crée, porte une vérité, une formulation joueur, et peut être chaîné à d'autres indices via mene_a (liste textuelle, jamais un graphe visuel), remplaçant l'état vide de la section Indices. Les 4 itérations suivantes donnent leur forme aux registres restants (jalons & fins, quêtes, événements, climat), chacune une tranche de schéma distincte, jamais deux lots contrat dans la même itération (KR-210).",
		"n": 5,
		"iterations": [
			{ "id": 1, "goal": "L'auteur tient le registre des indices de son aventure — une vérité pour le MJ, une formulation lue par le joueur, et les indices vers lesquels chacun mène (mene_a[], rendu en liste textuelle d'identifiants, jamais un graphe visuel — tree-canvas reste hors périmètre, KR-204) — refermant le namespace indice.<id> déjà résolu par dossier-fiches it6.", "status": "planned" },
			{ "id": 2, "goal": "L'auteur tient les jalons et les fins de son aventure — la dernière trace de l'ancien arbre de choix — avec le texte que le moteur émettra au joueur quand une fin est atteinte (Fin.texte, consommateur futur n°15), et l'avertissement D1 déjà connu (déclencheur sans expression) rendu visible sur chaque fiche (KR-211, deux tests nommés).", "status": "planned" },
			{ "id": 3, "goal": "L'auteur tient le registre de ses quêtes secondaires — donneur, objectif, étapes, échéance — et gagne son premier éditeur de récompense (EditeurEffets, composant né ici et réutilisé sans fork par les itérations suivantes).", "status": "planned" },
			{ "id": 4, "goal": "L'auteur tient ses deux listes d'événements séparées par l'interrupteur « lié à la trame » / « libres », chacun pouvant s'adosser au bestiaire existant (monstre_ref, déjà câblé) et porter ses propres résolutions via l'éditeur de récompense hérité de l'itération Quêtes.", "status": "planned" },
			{ "id": 5, "goal": "L'auteur tient le registre des climats de son aventure — un libellé, une durée — refermant la dernière racine du dossier ; ses effets de règles restent un Delta[] inchangé, sans nouvelle opération à opérande entier (KR-208).", "status": "planned" }
		],
		"known_risks": [
			"KR-204 : le graphe visuel des indices (repointage de tree-canvas sur les relations+accès+indices, roadmap §1bis/§2 l.170) est HORS PÉRIMÈTRE TOTAL de dossier-registres — veto tech-lead confirmé unanimement au tour 2 du cadrage : tree-canvas est câblé sur BookNode/Edge condamnés, sa démolition physique est déjà planifiée en n°9, demontageArbre.test.ts (possédé par bascule-editeur) verrouille sa non-atteignabilité, et aucun instrument du dépôt ne couvre pan/zoom/layout (specs navigateur différées). indices[].mene_a est livré comme DONNÉE + repli textuel uniquement. Le repointage visuel, si un jour repris, est un chantier à part, non planifié.",
			"KR-205 : lieux[].acces (KR-200, ouvert par dossier-objets) reste HORS PÉRIMÈTRE de dossier-registres — son écran vivrait dans PanneauLieux.tsx/FicheLieu.tsx, possédés par dossier-canon (déjà done) ; un lot de n°6 qui les toucherait violerait la propriété exclusive de fichier. Propriétaire recommandé mais NON MANDATÉ par ce cadrage : une itération 5 de dossier-canon.",
			"KR-206 : Quete.lie_au_canon est REJETÉ (forme sans consommateur, dérivable — même anti-patron que tier/objet-de-scénario, dossier-objets it1). Evenement.nature reste au schéma mais son cas 'monstre' (dérivable de monstre_ref) est REPORTÉ au raffinage de l'itération 4 pour trancher forme vs dérivation.",
			"KR-207 : conditions.contraintes (plan-cible : faim/froid/poursuite) N'EST PAS un champ du dossier — ce sont des états de SESSION (bandeau d'horloge, plan-cible §2.7), propriété éventuelle de n°9 moteur-dossier. Ne pas confondre avec monde.conditions.climat[], seule famille de Conditions après cette feature.",
			"KR-208 : Climat.effets_regles reste Delta[] inchangé, SANS éditeur d'opérande entier dans cette feature — DELTAS n'admet aujourd'hui aucune opération numérique (« effets chiffrés sur les règles » du plan-cible n'est pas atteignable avec le registre actuel). Ouvrir un DeltaModificateur exige docs/REGLES-DU-JEU.md → table dorée → code (KR-130) ; propriétaire recommandé n°11/n°13.",
			"KR-209 : la récompense en XP (Quete.recompense visant xp, plan-cible l.218) reste hors périmètre — aucune entrée DELTAS ne porte d'opérande entier, et ΔT (roadmap §5) est encore à définir par n°11.",
			"KR-210 : comme dossier-fiches (KR-190), chaque itération de cette feature ouvre un lot contrat distinct sur les mêmes fichiers (types.ts, tables.ts, destinations.ts, validate.ts, 2 fixtures, couverture.test.ts, brain/index.ts) — deux lots contrat ne coexistent jamais dans la même itération ; les 5 itérations sont strictement sérielles.",
			"KR-211 : l'itération 2 (jalons & fins) n'entre au découpage qu'accompagnée de DEUX tests nommés (condition posée par QA, tour 2) : (a) couverture.test.ts étend sa table aux Delta[] de jalons/fins, au même rang que récompense/effets déjà couverts pour quêtes/événements ; (b) garde D1 en région role=\"status\" distincte du bandeau de refus, assertion via getAllByRole('status'), discriminance sur deux entités distinctes (un jalon/une fin conforme, un non conforme — motif KR-197/199/202). Précédent : code-knowledge.json risk l.557 nommait déjà dossier-registres n6 comme porteuse attendue de ce motif pour jalons/fins/evenements."
		]
	},
	"implementation": {
		"iterations_log": [],
		"resolved_decisions": [],
		"open_questions": [
			"OUVERT (hérité de dossier-objets, KR-200/KR-205) — propriétaire réel de lieux[].acces : ce cadrage confirme qu'il ne peut PAS être n°6 (fichiers possédés par dossier-canon, déjà done). Recommandation non mandatée : itération 5 de dossier-canon.",
			"OUVERT — Evenement.nature==='monstre' est potentiellement dérivable de monstre_ref plutôt que stocké séparément (même anti-patron que lie_au_canon/tier) — à trancher au raffinage de l'itération 4, pas au cadrage.",
			"OUVERT — le repointage visuel de tree-canvas (graphe de relations+accès+indices) n'a plus de feature porteuse après ce cadrage (il était supposé n°6 par le roadmap §1bis, désormais corrigé en « non assigné »). Nécessite : (a) que lieux[].acces trouve un propriétaire, (b) un instrument de test navigateur (aujourd'hui différé). Recommandation : cadrer une feature dédiée le jour où ces deux préalables sont levés, pas avant."
		]
	}
}
```

## Corrections à `docs/ROADMAP-BASCULE-IA.md` (à appliquer après validation, dans le même geste)

1. **§2, tableau, ligne `dossier-registres`** : colonne « Itér. » `4` → `5`.
2. **§2, paragraphe « 6 · `dossier-registres` »** : retirer « + son graphe » ; ajouter la mention de l'écran jalons & fins (déjà assignée par §5 mais absente de ce paragraphe) et un renvoi vers ce cadrage pour le périmètre exact.
3. **§1 bis, ligne `tree-canvas`** : colonne « Sort » `repointée (n°6)` → `en sommeil ; repointage NON ASSIGNÉ`, avec une note « CORRECTION (cadrage `dossier-registres`, 2026-08-17) » expliquant que le graphe visuel est hors périmètre de n°6 (KR-204) et que `lieux[].acces` n'a toujours pas de propriétaire (KR-200/205).
4. **§5, dernière ligne du tableau des trous** : `quetes[].etapes … | n° 1 · n° 9` → `n° 6 (la forme) · n° 9 (l'avancement)`.
