# Tour 2 — QA — bascule-editeur it2

## Question 1 — round-trip validateDossier(dossiers.create(titre)) suffit-il pour KR-177 ?

**Oui, je retire ma demande d’export de FORME_ID_DOSSIER.** Le doute que soulève la question du coordinateur (le round-trip distinguerait-il un rejet par identifiant-invalide d’un rejet par une autre règle ?) ne tient pas dès lors que l’assertion est expect(v.errors).toEqual([]) — une égalité stricte au tableau vide, pas un simple ok:true. errors accumule chaque règle indépendamment (les blocs § 3 bis à § 8 bis de validate.ts poussent chacun dans le même tableau sans court-circuit) : un tableau strictement vide prouve l’absence de TOUTE entrée, identifiant-invalide compris. Il n’y a pas de trou — errors: [] est déjà l’assertion la plus stricte possible, pas une version plus faible d’un test ciblé sur un code précis. Le corollaire tient aussi dans l’autre sens : un create() qui régresserait vers createId() générique (le tiret bas que FORME_ID_DOSSIER refuse) ferait rougir ce même test sans instrumentation supplémentaire.

Ce que je recommande, non pour combler un trou de couverture mais pour la lisibilité du rouge : nommer le test « create() sème un id conforme et un seed sans erreur ni avertissement (KR-177/178) » et garder l’assertion warnings: [] du tech-lead. Nuance apportée par narratif-ia en tour 2, que je fais mienne côté testabilité : errors: [] + warnings: [] prouve la conformité au schéma, pas la jouabilité de l’amorce — aucun code d’anomalie ne connaît la notion de texte-modèle. Je ne demande donc PAS un second expect filtrant sur identifiant-invalide (ce serait une assertion plus faible que celle déjà proposée), mais je note pour la revue mode B que ce test ne doit jamais être lu comme une preuve que le seed est rédigé.

## Question 2 — tests nommés dans les deux branches (carte cliquable)

Les notes de tour 2 déjà écrites changent la donne : l’UX a retiré son opposition (tour2-ux-designer.md), le PM maintient l’inclusion, le tech-lead l’avait déjà proposée — convergence de fait vers l’inclusion. Je livre néanmoins les deux jeux de tests nommés, comme demandé, pour que l’arbitrage du tour 3 n’attende sur personne.

**Branche INCLUSE (lot 3 du tech-lead, bouton-titre de l’UX Annexe E/tour2) :**

- test nommé « cliquer le titre d’une carte lisible navigue sur la route dossier » — monter LibraryScreen DIRECTEMENT (pas App — la chausse-trappe B.3 du tech-lead : la route dossier n’existe pas dans le worktree du lot 3), retrouver le bouton nommé par le titre, clic, vérifier que router.current() vaut la route dossier avec le bon dossierId.
- test nommé « dossier:opened part avant la navigation » — même patron d’ordre que DossierService.test.ts (« open emet dossier:opened une seule fois, dans l’ordre ») : un journal d’événements pousse avant la lecture de router.current().
- test nommé « une carte illisible n’offre aucune affordance d’ouverture » — sur la branche lisible:false, le titre reste un span : aucun rôle bouton ne porte ce texte ; Tab puis Entrée sur la carte ne changent pas router.current().
- non-régression obligatoire : dossierLibrary.test.tsx compte déjà les boutons nommés « Télécharger le fichier » avec une longueur exacte — le nouveau bouton-titre ne doit pas élargir cette requête par nom ; à vérifier explicitement.
- clavier (ergonomie de rédaction) : ordre de tabulation titre puis télécharger puis supprimer, inchangé par rapport à aujourd’hui.

**Branche EXCLUE (si le tour 3 revient sur la convergence ci-dessus) :**

- test de non-régression posé dans dossierLibrary.test.tsx existant (pas un nouveau fichier) : « aucune carte, lisible ou non, ne porte de gestionnaire de clic ni de rôle bouton sur son titre » — verrouille l’état inerte actuel pour qu’une PR ultérieure ne le réintroduise pas à moitié hors du raffinage d’it3.
- aucun test sur dossier:opened déclenché depuis la bibliothèque : je le nomme explicitement pour que la revue mode B ne cherche pas un test qui n’a pas de raison d’exister ce tour-ci.
- ce que jest ne peut pas vérifier : que le report est bien écrit (pas silencieux) dans open_questions avec un propriétaire nommé — lecture de spec, pas un test ; à signaler pour ne jamais le compter « vérifié parce que jest est vert ».

## Statut de mes objections de tour 1

1. Risque (a), export de FORME_ID_DOSSIER — RETIRÉE. Motif : réponse à la Question 1 ci-dessus.
2. Risque (b), nodeCount/onAddNode non définis pour l’écran Dossier — RETIRÉE. Motif : convergence indépendante du tech-lead (Annexe A.4 : props optionnelles, rendu conditionnel groupé) et de l’UX (Annexe C : même contrat) — exactement ma proposition de tour 1, testable par une requête de rôle bouton absente.
3. Objection, « écran minimal » sans marqueur observable — RETIRÉE. Motif : l’Annexe D du tech-lead (composant DossierEditorScreen, lecture dossiers.get(dossierId), repli nommé) et l’Annexe D de l’UX (textes exacts : état introuvable, état vide, libellé de retour, texte du bouton désactivé) nomment maintenant tout ce qu’un test RTL doit lire.
4. Proposition (3), promouvoir KR-071 en critère testé — MAINTENUE, sous forme resserrée. L’Annexe D du tech-lead démontre à raison qu’un test comportemental « dossier ouvert puis supprimé mène à l’accueil » n’aurait rien à exercer en it2 (remove() n’est atteignable que depuis la bibliothèque, jamais depuis la route dossier) : la garde héritée d’App.tsx est du code mort à retirer, pas un comportement à reproduire. Mais ce retrait, annoncé en B.1 sous forme de prose, n’a AUCUN test nommé dans le tableau des lots. Précédent direct dans ce dépôt : featureDirs.test.ts (dossier-format) lit .eslintrc.cjs comme du texte pour épingler un littéral que la config ne peut pas exporter. Même geste ici : un test (nouveau fichier App.test.tsx, ou une assertion ajoutée au lot 2) lit App.tsx en texte et vérifie l’absence des deux identifiants du code retiré. Sans ce test, une régression future (un garde recopié depuis l’ancien EditorScreen.tsx, laissé intact par décision actée) ne serait vue par aucun instrument existant.

## Réponse nommée à une objection d’un autre rôle

UX, RISQUE de tour 1 : si on retexte en dur, le mauvais texte fuite sur l’un des deux écrans sans qu’aucun test ne le voie. Vérifié par lecture directe du code source (EditorTopBar.tsx, ligne du tooltip désactivé) : aucun test existant n’épingle aujourd’hui le texte par défaut du bouton désactivé. Le risque est réel, pas hypothétique. Je confirme la nécessité du fichier de test dédié à EditorTopBar que le tech-lead place dans le lot 1 (Annexe B), et j’exige qu’il épingle LES DEUX valeurs par un test chacune : le défaut inchangé (écran Book orphelin) ET la valeur injectée par l’écran dossier (texte exact citant la feature n° 9) — deux tests nommés, pas un seul.

PM et tech-lead, objection sur le critère 6 (duplication infalsifiable) : je seconde nommément — un critère qui teste un chemin sans appelant (duplicate, reporté par open_questions) est exactement le cas que mon veto de domaine couvre (critère non observable). Je rejoins le retrait de la clause de duplication — le critère corrigé, testé à la création seule, redevient falsifiable par le test de la Question 1.

Narratif & IA, tour 2 : confirme que le prédicat de forme et la regex d’identifiant d’entité sont déjà exportés du module d’identifiants pour l’id du lieu semé. Aucune duplication de regex de ce côté-là non plus. Je le note pour clore explicitement le point : le seul export encore en discussion est le marqueur de texte-modèle proposé par narratif-ia (deux appelants dans le lot 1), pas FORME_ID_DOSSIER.

## Verdict tour 2

Recevable sous réserve : réserve unique désormais, le test-grep nommé de KR-071 (App.tsx sans les deux identifiants du code retiré) à inscrire explicitement dans le lot 2 du tech-lead, avec son assertion. Mes trois autres réserves de tour 1 sont levées par les notes des trois autres rôles.
