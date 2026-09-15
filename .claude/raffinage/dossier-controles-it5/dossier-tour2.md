# Dossier du TOUR 2 — `dossier-controles` itération 5

Tu as déjà rendu une note au tour 1. **Lis les quatre autres**, puis réponds.

## Ce que tu dois lire

| Rôle | Fichier |
|---|---|
| PM | `.claude/raffinage/dossier-controles-it5/tour1-pm-produit.md` |
| Tech-lead | `.claude/raffinage/dossier-controles-it5/tour1-tech-lead.md` |
| Narratif & IA | `.claude/raffinage/dossier-controles-it5/tour1-narratif-ia.md` |
| UX | `.claude/raffinage/dossier-controles-it5/tour1-ux-designer.md` |
| QA | `.claude/raffinage/dossier-controles-it5/tour1-qa.md` |
| **Mesures de l'orchestrateur** | `.claude/raffinage/dossier-controles-it5/mesure-orchestrateur.md` — **§§ 8 à 11 sont NEUFS depuis le tour 1** |
| Cadrage | `.claude/raffinage/dossier-controles-it5/cadrage.md` |

## Ce que tu dois rendre

1. **Réponds NOMMÉMENT à au moins une objection d'un autre rôle qui empiète sur ton domaine.** Nomme-la par son identifiant (R1…R9, rejet n° 1…8, critère 1…8, C1…C8 ci-dessous).
2. **Statue sur CHACUNE de tes propres objections du tour 1** : `RETIRÉE` (avec le motif), `MAINTENUE`, ou `DURCIE EN VETO`.
3. Un veto doit être **dans ton domaine**. Hors domaine, je le requalifie en objection sans te le redemander.

> **Une note sans objection sera renvoyée.** Un accord unanime sur une impossibilité n'est pas une mesure (leçon d'it3).

---

# CE QUE J'AI MESURÉ DEPUIS, ET QUI TRANCHE DÉJÀ CERTAINS POINTS

Ces faits ne sont pas des avis. Ils sont reproductibles, sondes jetées, arbre et `tsc` vérifiés après coup. **Ne les rejuge pas — construis dessus, ou montre que la mesure est fausse.**

**M1 — Les chaînes réelles (§ 9).** `condition-sans-expr` rend littéralement « Le champ « **`condition_texte`** » … » et « Le champ « **`si_bloque`** » … » : **une clé JSON dans la prose lue par l'auteur**. Le narratif avait raison ; **R7 du tech-lead est faux sur 5 sites sur 10**.

**M2 — Fait que personne n'avait vu (§ 9.2).** Les deux messages `condition-sans-expr` **divergent déjà** (« condition structurée » pour la fin, « aucune durée » pour `si_bloque`). `validate.ts` écrit **déjà un message par site**, pas par code.

**M3 — La remédiation partagée est FAUSSE à un site mesuré (§ 9.3).** Les deux sites reçoivent « ↪ Ajoutez la condition structurée correspondante… » ; sur `si_bloque`, ce qui manque est une **`duree`**, et le message le dit lui-même. **La consigne contredit son propre message.**

**M4 — Le registre des cinq règles, mesuré (§ 9.4).** « Donnez… », « Ajoutez… », « Écrivez… », « Rédigez… » : verbe nu à l'impératif, **zéro `↪`**, chemin d'écran entre parenthèses. **Mais** la garde citée en R8 (`controles.test.ts` l. 676, `startsWith('Rédigez')`) **ne couvre que la règle d'amorce** : aucun test n'empêche aujourd'hui un `↪` d'entrer dans le rapport.

**M5 — La garde d'it3 encode une coïncidence (§ 8).** `constat.path.split('.')[0] !== constat.section` échoue sur **4 des 10 sites**, tous `canon.*`. **Cause dans `sections.ts` : `canon` est la SEULE des dix sections dont la `cle` n'a pas de point.** Pour elle, le prédicat est **structurellement insatisfiable**. Choisir un autre témoin ne règle pas la question, il la reporte : la première itération qui déclarera `section: 'canon'` sur un `path` en `canon.*` fera rougir cette garde **en étant correcte**.

**M6 — La garde KR-217 interdit plus que son propre commentaire ne motive (§ 10).** Son commentaire motive par le canal **`error`** (KR-225) ; son assertion interdit **le module entier**, donc aussi `warnings` — le seul canal dont tout l'intérêt est qu'il **survit** à la persistance. Le remplacement a donc sa forme écrite d'avance : **interdire `.errors`, autoriser `.warnings`.**

**M7 — Le coût, chiffré (§ 11).** `validateDossier` = **0,743 ms** contre **0,018 ms** pour `controlerDossier` sur la référence (13 ko) : **×41**. Le rapport passe à 0,768 ms, soit ~1,5 ms par rendu d'écran — **négligeable en absolu, énorme en facteur**. Conséquences : **R3 se durcit** (4 entrées ⇒ 8 validations ⇒ ~5,9 ms, plus du tiers d'une trame) ; **R6 tient sur un nombre** et non plus sur une doctrine. Réserve : mesuré sur 13 ko, et le coût croît avec la taille du dossier.

**M8 — La dette d'it4 est mécaniquement dans le périmètre.** Le test `chaque ligne est un arret de tabulation` vit dans `src/features/dossier-controles/tests/panneauControles.test.tsx`, **qui est dans la liste de fichiers de L1**. La condition posée par le tech-lead (« si ce test vit dans l'un des trois fichiers que L1 ouvre déjà, il se corrige ici ») est **remplie**. Ce n'est plus une question ouverte.

**M9 — Rappel, et c'est ma propre erreur de cadrage.** Mon § 8 écrivait « aucun ne peut être `bloquant` **par construction — ce sont des `warning`** ». C'est la **confusion d'axes que KR-217 existe pour interdire**. **Le verdict est bon (zéro `bloquant` à it5), le motif est faux.** Motif juste : *aucun de ces dix sites, **pris seul**, ne rend l'aventure injouable*. Laisser l'ancien motif **interdirait à it6 d'écrire la règle de collection bloquante** qu'elle doit écrire.

---

# LES DÉSACCORDS OUVERTS — chacun doit recevoir un statut

## C1 — Le `message` : repris tel quel, ou réécrit ?

- **Tech-lead R7** : REJETTE la réécriture. « `DossierIssue.message` est déjà une phrase rédigée et interpolée avec les comptes réels ; une copie serait une seconde vérité qui dérive. »
- **Narratif § 4** : réécriture **obligatoire** pour les 5 sites `condition-sans-expr` (clé JSON dans la prose) ; **reprendre** les deux autres codes, qui portent le décompte mesuré.
- **Mesuré : M1, M2.** La prémisse de R7 est vraie pour 2 codes, fausse pour 5 sites.

→ **Tech-lead** : R7 est-il `RETIRÉ`, ou restreint aux deux codes où sa prémisse tient ? Et comment écrire une prose par site **sans** recréer la seconde vérité que R7 craint — sachant (M2) que `validate.ts` écrit déjà par site ?
→ **Narratif** : le décompte « 601 mots » doit-il traverser sans être retapé, et par quel mécanisme ?

## C2 — La `remediation` : reprise, ou réécrite ?

- **UX § 2** : « **REPRENDRE** tels quels, vérifié mot pour mot » — aucun ne dit « réimportez-le ».
- **Narratif § 4** + **tech-lead R8** : RÉÉCRIRE — le `↪` n'existe nulle part dans l'anatomie du rapport, et « ce n'est pas bloquant » **contredit la pastille ALERTE** posée à côté.
- **Mesuré : M3, M4.** L'UX a vérifié **un** défaut possible (« réimportez ») sur trois. La consigne partagée est **inexacte** sur `si_bloque`.

→ **UX, tu es seule contre deux, et la mesure n'est pas de ton côté : réponds nommément à M3.** Ta conclusion « reprendre » tient-elle sur un texte factuellement faux à l'un de ses deux sites ?
→ **Tech-lead** : R8 est juste sur le fond et **faux sur son instrument** (M4). Quelle garde le remplace ?

## C3 — Le niveau des dix sites — **le QA pose un VETO**

- **QA** : veto sur toute clôture sans **table fermée `site → NiveauControle`**, 10 lignes, totale par compilation.
- **Narratif § 1** : la livre — **7 `alerte` / 3 `info` / 0 `bloquant`**, discriminant unique (« le jeu en souffre à chaque partie et l'auteur ne le verra qu'en jouant » vs « aucun consommateur, ou état d'auteur légitime »).
- Points internes contestables : **site 9** (`revele_si` → `info`, le narratif s'y **sépare de la note de convocation**) et **site 4** (`climat` → `info`, « aucun moteur ne sait appliquer un climat »).

→ **QA** : la table du narratif lève-t-elle ton veto ? Dis-le explicitement.
→ **Tous** : contestez une ligne, ou ratifiez la table. **Un silence vaut ratification** et je l'écrirai ainsi.

## C4 — La `section` : déclarée ou dérivée ? Et KR-219 s'amende-t-il ?

- **Tech-lead § 3** : une table **écrite ligne à ligne par la règle productrice** n'est pas un calcul ; précédent `PROSES_AMORCE` **dans le même fichier**. KR-219 se **précise** ; `issues.ts:76` s'**amende**.
- **Narratif rejet 2** : la section **et** le niveau se déclarent par site. **KR-219 est SA garde** — c'est à lui de dire comment elle bouge.
- **UX** : objection ferme — sans table fermée et déclarative, veto sur le trailing des lignes importées ; la garantie d'it4 (« le trailing est le seul élément mécaniquement garanti juste et complet ») serait rompue **en silence**, sous une anatomie identique.
- **Mesuré : M5.** Et M5 ouvre une question que **personne n'a posée** : le prédicat de la garde d'it3 est insatisfiable pour `canon`.

→ **Narratif** : rédige l'amendement de KR-219, ou refuse-le. **Et réponds à M5** : la garde d'it3 se corrige-t-elle ici, ou se documente-t-elle comme dette nommée d'it6 ?
→ **Tech-lead** : ton § 5.6 dit « choisis un témoin non-`canon` ». M5 dit que c'est un contournement. Assumes-tu le contournement, ou la garde se réécrit-elle ?

## C5 — La garde KR-217 de `controles.test.ts` l. 336-342

- **QA critère 4** : elle **rougit à coup sûr** si l'import est retenu ; elle doit être **remplacée**, pas conservée.
- **Mesuré : M6.** Forme du remplacement écrite d'avance par son propre commentaire.

→ **Quelqu'un conteste-t-il la LECTURE de `.warnings` ?** Si non, dites-le, que je l'écrive `RETENU` sans ambiguïté.

## C6 — La phrase de l'itération — un problème mécanique

Le PM défend, mot pour mot, pour `iterations[5].goal` :

> « À la fin de cette itération, l'auteur qui laisse une fin, un blocage ou une révélation sans leur pendant structuré, ou un synopsis trop long, le voit dans son rapport sans réimporter — **et** `condition-sans-expr` sert aussi de signal pré-requis à it6. »

**Elle porte un « et » de coordination, que la porte 1 interdit à la phrase de démo.** Le point 2 du PM (« le bénéfice it6 doit être NOMMÉ, jamais dissimulé ») est légitime et **sera tenu** — dans la section valeur du plan, pas soudé à la phrase de démo.

→ **PM** : acceptes-tu la scission (phrase de démo côté auteur ; bénéfice it6 nommé dans la section valeur) ? Si tu la refuses, dis pourquoi le « et » doit tenir dans la phrase elle-même.

## C7 — La preuve de reachability par formulaire, exigée par le PM

Le PM conditionne son GO à « la preuve de reachability par formulaire pour au moins deux des quatre codes ».

**Déjà mesurée — § 5 de mes mesures**, et le résultat est plus fort que la demande : les cinq champs porteurs sont édités par des panneaux livrés, et **les composants répondent dans leur propre JSDoc** — `FicheFin.tsx` l. 15 (« `condition_texte` est le SEUL champ `CHAMPS_REQUIS` »), `BlocPlanActions.tsx` l. 87 (« `duree === undefined` rend l'affordance pointillée »). **Les deux états qui déclenchent `condition-sans-expr` sont l'ÉTAT PAR DÉFAUT du formulaire.**

→ **PM** : ta condition est-elle levée ? **Et la conséquence qui inverse le § 1** : l'avertissement n'est pas rare, c'est **l'état intermédiaire normal de l'écriture** — les fixtures sont *finies*, un dossier d'auteur en cours ne l'est jamais.

## C8 — Un piège de rédaction à ne pas laisser au plan

Le tech-lead recommande en **§ 6** `texte-trop-long` sur `canon.mj` comme **preuve verticale la moins chère**, et interdit en **§ 5.6** un témoin `canon.*` pour `NEUVES`. **Les deux sont justes — ce sont deux tests différents.** Mais posés à trois pages d'écart, un ouvrier les confondra.

→ **QA** : formule la phrase unique qui tient les deux sans se contredire, et qui passera telle quelle dans le plan.

---

# RAPPELS DE PROCÉDURE

- **Tout rejet nommé doit survivre au plan.** Les registres de rejets (tech-lead R1-R9, narratif 1-8, QA § 6) seront recopiés au § 8 du plan. Un rejet qui meurt en annexe est la classe **BUG-082**.
- **Aucune affirmation sur ce qu'un test ferait sans l'avoir rejoué.** C'est la classe **BUG-084**, et cette itération en a déjà corrigé deux (M1 contre R7, M4 contre R8).
- **Toute mesure destructive sur l'arbre partagé se VÉRIFIE après coup, jamais ne s'annonce.** `git status` + `npm run typecheck`. Un revert annoncé et non effectif a déjà cassé `tsc` à it4.
- Périmètre figé : **1 lot**, marqué `contrat`, **8 critères au plus**. Aucun lot contrat sur `validate.ts`, `types.ts`, `destinations.ts`, `tables.ts`, `sections.ts`.
