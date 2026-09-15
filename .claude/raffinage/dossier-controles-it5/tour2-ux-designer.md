## RISQUE / OBJECTION / PROPOSITION / VERDICT (Tour 2)

**RISQUE** — Mon verdict de tour 1 (« REPRENDRE tels quels ») a été produit contre une seule question (« est-ce que ça dit *réimportez-le* ? ») alors que trois défauts indépendants pouvaient invalider un texte repris : la fuite d'une clé JSON, le glyphe `↪` hors anatomie, et — celui que j'ai manqué — l'**exactitude** de la consigne au geste réel. M3 en apporte la preuve : la consigne partagée des deux sites `condition-sans-expr` mesurés dit « Ajoutez la condition structurée correspondante » aux DEUX, alors que sur `si_bloque` ce qui manque est une **durée**, pas une condition — le message affiché deux lignes plus haut le dit lui-même. Un texte que je qualifie de « vérifié mot pour mot » contredisait son propre voisin.

**OBJECTION** — Aucune, je cède la mienne. Voir statuts ci-dessous.

**PROPOSITION** — Remédiation RÉÉCRITE, par site, pour les 10 lignes (texte exact en annexe) : glyphe retiré partout, « ce n'est pas bloquant » retiré partout (confond le canal `error`/`warning` avec le mot `niveau`, juste à côté d'une pastille qui utilise CE MÊME vocabulaire pour autre chose), et sur `si_bloque` la consigne parle enfin de **durée**. Message : REPRIS pour `texte-trop-long` (4 sites) et `revelation-sans-porte` (1 site) — confirmé par M1/M9, ce sont des phrases propres ; RÉÉCRIT pour `condition-sans-expr` (5 sites), la clé JSON dans la prose étant une faute de registre que la docstring de `controles.ts` interdit à elle-même.

**VERDICT** — Recevable sous réserve : la table à dix lignes de l'annexe ci-dessous doit passer telle quelle dans le lot, et la sonde négative du narratif (§4 de sa note) doit être étendue pour couvrir aussi « bloquant »/« pas bloquant ».

---

## Réponses nommées

### C2 — M3 : ma conclusion ne tient pas, et je le dis sans détour

**Non, elle ne tient pas.** J'ai vérifié un défaut sur trois possibles. Le tech-lead et le narratif ont raison sur les trois : le `↪` n'a jamais eu sa place dans cette anatomie (elle ne l'a jamais rendu ailleurs — `whatToDoStyle` n'a aucun glyphe dans ses quatre autres usages) ; « ce n'est pas bloquant » est un terme du canal `error`/`warning` de KR-217/225, pas du vocabulaire `niveau` (`bloquant`/`alerte`/`info`) que la pastille affiche à sa gauche — les deux vocabulaires cohabitant sur la même ligne est exactement la confusion d'axes que KR-217 existe pour interdire, appliquée cette fois à la COPIE et non à l'architecture ; et sur `si_bloque`, la consigne partagée est **factuellement fausse** — elle enverrait un auteur chercher un champ « condition structurée » qui n'existe pas sur ce bloc d'écran, quand ce qu'il doit poser est une durée. Je retire « REPRENDRE tels quels » pour la `remediation` des trois codes. Le texte exact de remplacement, par site, est en annexe — vérifié contre les 5 composants réels qui portent ces champs (`PanneauCanon.tsx`, `PanneauJalonsFins.tsx`/`FicheJalon.tsx`/`FicheFin.tsx`, `PanneauConditions.tsx`, `ObjectifsCanon.tsx`, `BlocPlanActions.tsx`, `BlocSavoirs.tsx`), pas inventé contre le wireframe.

Pour le `message` : je n'avais vérifié que 3 codes sur 4 au tour 1 (pas les sites `condition-sans-expr`). M1/M9 le confirment factuellement fautif à ce code (clé JSON dans la prose). C'est le terrain du tech-lead/narratif (C1, architecture de l'interpolation) mais la conséquence de registre est la mienne à nommer : aucun message rendu au rapport ne doit porter un nom de champ brut (`condition_texte`, `si_bloque`, `reussi_si_texte`…) — le fichier l'interdit déjà à lui-même. Je propose des formulations candidates en annexe, sans les imposer à qui écrit l'interpolation réelle.

### C4 — mon objection ferme du tour 1 : LEVÉE, à ces conditions précises

Ma proposition de tour 1 demandait exactement ce que le tech-lead a écrit : un registre littéral **privé**, une entrée par site, et « un code atteint hors table doit faire échouer un test, jamais retomber sur une section devinée ». `SITES_AVERTISSEMENT` + le balayage de totalité (§5.1-3 de sa note) satisfont ça mot pour mot. Conditions pour que la levée tienne :
1. La table est totale **par un test**, pas par relecture humaine — sans ce test, ma levée retombe en objection.
2. Les deux JSDoc (`controles.ts` l.22-23/80-81, `issues.ts` l.76) sont amendées **dans le même lot**, pas reportées — sinon un futur lecteur retrouve la phrase « il n'a rien à y lire » à côté d'un import qui la contredit, exactement le genre de silence que mon objection visait.
3. L'amendement de KR-219 (« dérivée » = calcul, pas table déclarée totale) est écrit dans `code-knowledge.json` **et** `specification.json` dans le même lot.

Sur les conditions remplies, le trailing des lignes importées reste ce qu'il était à it4 : une garantie mécanique, pas une inférence — parce que la section est déclarée des deux côtés (règles natives et sites importés), jamais dérivée d'aucun côté. Rien à distinguer visuellement entre les deux classes de lignes, donc aucune anatomie neuve.

**Sur M5 (4/10 sites → « Canon »)** : aucun problème de lisibilité. `Canon` n'a que deux champs porteurs de budget (`mj`, `partage`) plus deux conditions d'objectifs — au plus 4 lignes possibles sur un même dossier, chacune avec un `message`/`OÙ` différent (synopsis vs accroche vs condition de réussite vs condition d'échec). Quatre lignes qui pointent vers la même section ne se ressemblent pas entre elles au premier coup d'œil — le trailing sert de complément de tri, pas de seul identifiant. Rien à changer côté anatomie.

### C3 — je ratifie la table du narratif, sans réserve de mon terrain

Le discriminant (conséquence de jeu à chaque partie / état d'auteur légitime ou consommateur inexistant) ne touche que le choix du **mot** affiché par `pastilleNiveau` — `bad`/`neutral`/`muted` restent inchangés, aucun jeton neuf, aucune couleur décorative. Fait qui n'était mesuré par personne et qui renforce directement le site 4 (`climat.manifestation` → `info`) : `PanneauConditions.tsx` l.232-239 lit **déjà** `validateDossier(dossier).warnings` en ligne et rend ce même avertissement de budget pendant que l'auteur écrit le climat affiché — le futur constat du rapport sera donc redondant avec une affordance déjà visible à l'écran d'édition, ce qui est cohérent avec le vert « `info` » et avec l'argument de M5/§5 de l'orchestrateur (« état intermédiaire normal de l'écriture »). Je ne conteste aucune ligne.

### Volume / groupement — position

D'accord avec le narratif : mesurer (discipline `volume_mesure`, un relevé daté sur le clone muté, pas une assertion committée), et si le site le plus prolifique dépasse ~10 lignes, ouvrir une itération à part — pas un ajout en passant à it5. Un point qui abaisse le coût de cette itération future, vérifié en lisant `ListeControles.tsx` : le clic de chaque ligne appelle `onSelectSection(section)` — **jamais** une cible d'entité — donc grouper « 7 savoirs sans porte » en une ligne ne casse aucun contrat de clic existant, la navigation reste au niveau section comme aujourd'hui. Ce qui reste à trancher, et c'est bien un sujet neuf : l'étage OÙ (`controle.location`) perdrait sa précision par-instance dans une ligne groupée — un vrai arbitrage de design (garder N lignes sous un en-tête commun vs. fondre en une ligne à OÙ synthétique), à ne pas régler ici.

### Statut de mes objections du tour 1

1. **Arbitrage d'it1 sur la réutilisation de composant (IssueList vs ListeControles) ne rouvre pas** → **MAINTENUE**, rien ne la contredit.
2. **« REPRENDRE tels quels » pour messages ET remédiations** → **RETIRÉE partiellement** : messages `texte-trop-long`/`revelation-sans-porte` **MAINTENUE reprendre** ; remédiation des 3 codes **RETIRÉE**, remplacée par réécriture per-site (texte en annexe) ; message `condition-sans-expr` **RETIRÉE**, doit être réécrit (terrain C1, conséquence de registre nommée ici).
3. **Objection ferme « pas de table fermée déclarative = veto sur le trailing »** → **LEVÉE**, conditions au § C4 ci-dessus.
4. **`TEXTE_ETAT_CALME` inchangé** → **MAINTENUE**, personne ne la conteste.
5. **Ma proposition tour 1 de garde anti-« réimportez »** → **MAINTENUE ET DURCIE EN VETO** : je pose veto sur la fusion du lot si aucune sonde négative ne couvre, sur les 10 remédiations ET les 10 messages du rapport, l'absence de `↪`, des clés internes (`_texte`, `_expr`, `si_bloque`, `revele_si`), de « réimport », **et** de « bloquant »/« non bloquant » (extension à mon compte, absente de la sonde du narratif §4 — c'est elle qui aurait laissé passer le défaut de M3). Ce veto est déjà satisfait par ce que C2/C4 retiennent : il sert à empêcher une régression silencieuse en implémentation, pas à rouvrir le débat.

---

## ANNEXE — Contrat de design (it5, révisé tour 2)

### Anatomie — inchangée, confirmée par lecture de `ListeControles.tsx`

`<li>` → `<button type="button">` pleine largeur → `Badge` (pastille) + colonne à trois étages (`data-etage="ou"|"quoi"|"quoi-faire"`) + `trailing` (`→ {titreSection}`). Un `Controle` mappé depuis un site importé se rend **identiquement** à un `Controle` natif — même styles (`whereStyle`, `whatStyle`, `whatToDoStyle`, `trailingStyle`, tous déjà sur jetons `--*` existants, aucun neuf). `section` alimente à la fois le trailing affiché et l'action au clic (`onSelectSection(section)`), jamais deux lectures séparées — garde anti-dérive déjà en place, rien à y changer.

### Jetons — aucun nouveau, liste inchangée depuis mon annexe de tour 1

`--border-divider`, `--text-label`, `--text-body`, `--text-muted`, `--text-faint`, `--fs-eyebrow`, `--fs-body`, `--fs-meta`, `--track-eyebrow`, `--space-*`, `--r-md`, `--font-ui`, `--font-mono` (`ListeControles.tsx`) ; `--bad`, `--ink-2`, `--ink-4` (`Badge`/`pastilles.ts`). Confirmé : `info` = `muted` (même ton qu'une section saine), les trois niveaux ne se distinguent QUE par le mot (`BLOQUANT`/`ALERTE`/`INFO`), jamais par une couleur neuve — discipline de l'accent intacte.

### Table des 10 sites — `message` / `remediation`, mot pour mot

Légende : **R** = repris tel quel de `DossierIssue` (architecture C1) ; **RÉ** = réécrit, texte proposé ci-dessous ; screen-path vérifié contre le composant réel cité, sauf mention « non vérifié ».

| # | Site (chemin de table) | Code | Niveau | `message` | `remediation` (RÉÉCRITE, texte exact) |
|---|---|---|---|---|---|
| 1 | `canon.mj` | texte-trop-long | alerte | **R** — « Le canon compte {n} mots ; le budget conseillé est de 600. » | « Resserrez le synopsis MJ (Canon → Synopsis MJ). » |
| 2 | `canon.partage` | texte-trop-long | alerte | **R** — même forme, sujet « Le canon » | « Resserrez l'accroche joueur (Canon → Accroche joueur). » |
| 3 | `charpente.jalons[].enonce_texte` | texte-trop-long | alerte | **R** — sujet « L'énoncé de ce jalon » | « Resserrez l'énoncé de ce jalon (Jalons & fins → Jalons). » |
| 4 | `monde.conditions.climat[].manifestation` | texte-trop-long | info | **R** — sujet « La manifestation de ce climat » | « Resserrez cette manifestation (Conditions). » |
| 5 | `canon.objectifs[].reussi_si_texte` | condition-sans-expr | alerte | **RÉ** (proposé) — « Cette condition de réussite reste en prose : rien ne l'évaluera. » | « Posez la condition structurée de réussite (Objectifs → Condition de réussite). » |
| 6 | `canon.objectifs[].echoue_si_texte` | condition-sans-expr | alerte | **RÉ** (proposé) — « Cette condition d'échec reste en prose : rien ne l'évaluera. » | « Posez la condition structurée d'échec (Objectifs → Condition d'échec). » |
| 7 | `charpente.fins[].condition_texte` | condition-sans-expr | alerte | **RÉ** (proposé) — « Cette fin reste conditionnée par une prose : le moteur ne l'atteindra jamais tant qu'aucune condition structurée n'est posée. » | « Posez la condition structurée de cette fin (Jalons & fins → Fins). » |
| 8 | `monde.personnages[].contre_mesures[].declencheur_texte` | condition-sans-expr | alerte | **RÉ** (proposé) — « Ce déclencheur reste en prose : rien n'arme cette contre-mesure. » | « Posez le déclencheur structuré de cette contre-mesure (Personnages → Contre-mesures). » |
| 9 | `monde.personnages[].savoirs[].revele_si` | revelation-sans-porte | info | **R** — « Le savoir « {nom} » n'a aucune condition de révélation (ni confiance, ni jet, ni contrepartie, ni indice préalable) : il ne sera jamais dévoilé automatiquement. » | « Ajoutez au moins une porte de révélation, ou laissez tel quel si ce savoir ne doit jamais se révéler de lui-même (Personnages → Savoirs). » |
| 10 | `monde.personnages[].plan_actions[].si_bloque` | condition-sans-expr | info | **RÉ** (proposé) — « Cette étape ne porte aucune durée : rien ne sait combien de temps le joueur a avant qu'elle ne se déclenche. » | « Posez une durée pour cette étape (Personnages → Plan d'actions). » |

Screen-paths vérifiés par lecture directe : `Canon → Synopsis MJ` (`PanneauCanon.tsx` l.204), `Canon → Accroche joueur` (l.220), `Jalons & fins → Jalons` (`FicheJalon.tsx` l.111 « ÉNONCÉ », `PanneauJalonsFins.tsx` l.63 tab « JALONS »), `Jalons & fins → Fins` (`FicheFin.tsx` l.92 « CONDITION », tab « FINS »), `Objectifs → Condition de réussite/d'échec` (`ObjectifsCanon.tsx` l.311/326), `Personnages → Contre-mesures` (`BlocPlanActions.tsx` l.282 eyebrow « CONTRE-MESURES », l.316 « DÉCLENCHEUR »), `Personnages → Savoirs` (`BlocSavoirs.tsx` l.270 « COMMENT IL LE RÉVÈLE » — et précédent verbatim déjà en production dans `PROSES_INDICE_SANS_SOURCE`), `Personnages → Plan d'actions` (`BlocPlanActions.tsx` l.191 eyebrow « PLAN D'ACTIONS », l.250 « DURÉE », l.87 JSDoc « `duree === undefined` rend l'affordance pointillée »). **Non vérifié** : le libellé exact affiché pour le champ `manifestation` dans `PanneauConditions.tsx` (label non trouvé par lecture directe — le fichier ne semble l'exposer sous aucun `label="MANIFESTATION"` repéré) ; d'où le repli au niveau section seul « (Conditions) » plutôt qu'un sous-champ inventé.

### Sonde de registre — à écrire dans le lot (garde ma position durcie)

Sur les 10 `message` et 10 `remediation` rendus par `controleRemediation`/`Controle.message` du rapport : aucun ne contient `↪`, `_texte`, `_expr`, `si_bloque`, `revele_si`, « réimport », **ni** `bloquant`/`non bloquant`/`pas bloquant` (extension à mon compte de la sonde du narratif §4). Cas négatif à vérifier avant d'écrire la table (précédent BUG-084) : brancher `dossierIssueRemediation`/`DOSSIER_ISSUE_LABELS` verbatim doit faire rougir cette sonde.

### État vide / clavier — rien à ajouter

Chaque ligne reste un `<button type="button">` natif — Tab/Entrée gratuits, identique que le constat vienne du registre natif ou du mapping `validateDossier`. Aucun état vide neuf : la table de dix sites ne crée aucune liste ni aucun champ, seulement des lignes de rapport dérivées d'un dossier déjà écrit. Le lien vers le formulaire réel (le clic → section) mène, pour le site 10 précisément, à une affordance d'état vide **déjà conforme à la règle projet** — le champ Durée pointillé de `BlocPlanActions.tsx`.

### Registre de langue — le principe qui commande toute la table ci-dessus

Verbe nu à l'impératif, jamais de glyphe, chemin d'écran entre parenthèses en casse phrase (« Objectifs → Condition de réussite », pas « OBJECTIFS → CONDITION_REUSSITE ») — c'est le registre mesuré des cinq règles déjà livrées (M4), maintenant étendu aux dix sites importés sans exception. Aucun terme interne (nom de champ JSON, nom de fonction, mot « warning »/« error »/« canal ») n'entre dans une phrase lue par l'auteur — c'est la promesse que `controles.ts` se fait déjà à lui-même, et l'étendre à ces dix sites est ce que cette itération doit livrer, pas contourner.

Fichiers lus pendant ce tour : `src/brain/dossier/sections.ts`, `src/brain/dossier/controles.ts` (extraits), `src/brain/dossier/issues.ts` (extraits), `src/brain/dossier/pastilles.ts`, `src/brain/dossier/tables.ts` (`RACINES`, `CHAMPS_REQUIS`, `BUDGETS_DE_MOTS`, `FAMILLES_DE_CONDITIONS`), `src/features/dossier-controles/components/ListeControles.tsx`, `src/features/dossier-canon/components/PanneauCanon.tsx`, `src/features/dossier-canon/components/ObjectifsCanon.tsx`, `src/features/dossier-registres/components/PanneauJalonsFins.tsx`, `FicheJalon.tsx`, `FicheFin.tsx`, `PanneauConditions.tsx`, `src/features/dossier-fiches/components/BlocPlanActions.tsx`, `BlocSavoirs.tsx`. Plus les cinq notes de tour 1 et `mesure-orchestrateur.md` en entier.