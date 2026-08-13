# Tour 2 — `qa` · `dossier-fiches` it3 (contre-lecture)

## 1. Réponses nommées

**À `narratif-ia` (D7, test-grep).** Recevable, et ce n'est pas une extrapolation d'instrument : le précédent existe **littéralement** dans le module que ce lot touche —
`couverture.test.ts:409` : `it('le walker de couverture n est ecrit qu une fois dans le module dossier')`, avec `fs.readdirSync` + `fs.readFileSync` + **signature construite par morceaux** pour que le test ne se satisfasse pas de lui-même. Même patron réutilisable tel quel côté `dossier-fiches`. Intégré à ma liste (critère 2).

**À `tech-lead` (D6).** Confirmé recevable en **assertion ferme** : `git diff --stat` reste l'instrument, la clause « si ajouté » disparaît puisque les trois rôles convergent sur `dossier/types.ts`.

**À `ux-designer` (D2, extension `Stepper`).** J'ai mesuré : `Stepper.tsx` n'a **aucun** test dédié aujourd'hui. Un test de non-régression existe et exerce déjà le chemin `onChange` du bouton `+` — `ObjectEditor.test.tsx:6` (`reinforcementBonus rollBonus is persisted via onChange (AC C5)`), qui couvre le chemin « valeur définie » (0 → 1), inchangé par l'extension. Il ne couvre **pas** le nouveau chemin (`value === undefined` → premier clic écrit `min`) : branche neuve, jamais exercée nulle part. J'exigeais donc un `Stepper.test.tsx` neuf. *(Note de l'orchestrateur : l'UX retire l'extension au tour 2 — ce critère tombe avec elle.)*

## 2. Statuts sur mes propres objections du tour 1

- **RISQUE** (contradiction des deux gardes sous `Partial`) — **retirée sur le fond** : l'issue TOTAL est exactement ce que mon risque appelait implicitement.
- **OBJECTION** (aucune ligne réservée pour `stats`, chemins dépendant des fixtures) — **retirée**. « 8 lignes dérivées, `requis: true`, les deux fixtures nommées » était ma condition exacte.
- **PROPOSITION (1) 8 clés dans les deux fixtures** — **satisfaite**, devient une clause du critère 6.
- **PROPOSITION (2) `wc -l` avant/après** — **MAINTENUE**, pas durcie en veto. Le tech-lead répond par une **projection** (443 → ~460, estimée sur un diff pas encore écrit) : recevable pour le cadrage, ce n'est pas une mesure. J'exige un `wc -l` **réel**, post-lot, consigné en revue Mode B — ce n'est pas observable par un test, donc pas un des 8 slots : c'est une ligne de la définition de fini.
- **VERDICT** (« critère 6 irrecevable tel quel ») — **réserve levée**.

## 3. Critères finaux (sous l'hypothèse TOTAL, recommandée)

**1. Réglage borné, aux deux extrémités.** Étant donné le bloc renseigné avec Force à 1, quand l'auteur clique 8 fois « Diminuer FORCE » puis 20 fois « Augmenter FORCE », alors la valeur ne descend jamais sous `CARACTERISTIQUE_MIN` ni ne dépasse `CHARACTERISTIC_MAX`, et `update()` n'écrit jamais `stats.FO` hors `[1,12]`. — *composant, jest+RTL+user-event*

**2. PV dérivé — valeur exacte, jamais recalculé ailleurs.** Étant donné FO=7/AG=9/EN=6, quand la fiche se rend, alors (a) le PV affiché vaut exactement `22` et aucune clé `pv` n'est écrite ; (b) aucun fichier de `src/features/**` ne porte la somme écrite à la main, et `FichePersonnage.tsx` **importe** `maxPV`. — *(a) composant ; (b) unit/structurel, test-grep, précédent `couverture.test.ts:409`*

**3. Bloc absent.** Étant donné un personnage sans bloc `stats`, quand la fiche se rend, alors le bloc montre la seule affordance « + Régler les caractéristiques… », aucun Stepper, aucune ligne PV, et **aucune écriture au montage**. — *composant*
*Le cas « EN manque seule » n'existe plus dans le flux UI sous TOTAL ; il reste couvert côté import par `validate.test.ts` (lot 1).*

**4. Lecture au montage — BUG-064, deux personnages.** Étant donné deux personnages aux 8 caractéristiques distinctes et **non-plancher** (A → PV22, B → PV17), quand la fiche se monte sur A **sans interaction** puis qu'on clique la ligne de B, alors les 8 Stepper et le PV affichent B, jamais un résidu de A. **`FO=1` et `PV=3` ne doivent JAMAIS être seedés** — indiscernables d'un défaut de widget. — *composant, idiome déjà en place `panneauPersonnages.test.tsx:348`*

**5. Non-régression dossier de référence.** 6 personnages, zéro erreur/avertissement neuf, les personnages hors périmètre inchangés. — *unit*

**6. Audience de `stats.*` — assertion ferme.** 8 lignes `moteur` dérivées de `CHARACTERISTIC_VALUES`, `requis: true` sur les 8 lignes d'`ENUMERES_FERMES`, 8 clés instanciées dans **les deux** fixtures ; retirer une ligne fait rougir par nom de champ. — *unit, `couverture.test.ts`*

**7. Bornes à l'import.** `0` / `13` / `2.5` / `"3"` refusés ; bloc à 1-7 clés refusé ; bloc absent calme. — *unit, `validate.test.ts`*

**8. Score de mutation — assertion ferme.** `git diff --stat -- src/brain/characteristics.ts` ne montre **rien** ; `npm run test:mutation` **n'est pas requis**, `break` reste à 80. — *process de revue*

## 4. Non vérifiable en l'état

- **Que `stats` n'atteint aucun contexte de modèle** (narratif-ia) — `destinations.ts` le déclare, rien ne le démontre avant l'assembleur n° 10. Limite, pas garantie.
- **`wc -l PanneauPersonnages.tsx` réel** — « ~460 » est une projection sur du code pas encore écrit. À mesurer en Mode B, pas à accepter sur parole.
- **Le comportement réel du walker sur un bloc partiel** — affirmé par lecture de code ; vrai seulement une fois les cas `validate.test.ts` écrits et passants.
- **Le déclencheur d'extraction daté « it4 »** (KR-112) — aucune date de note de raffinage n'est vérifiable par un instrument avant qu'it4 arrive.
- **La lisibilité du message d'anomalie à 12 valeurs** (« attendu : 1, 2, … ou 12 ») — aucun test d'UX de message n'existe dans ce dépôt. Hors instrument, donc hors critère, mais noté plutôt que silencieusement accepté.
