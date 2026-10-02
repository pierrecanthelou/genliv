# Raffinage `moteur-acteurs` it1 — Tour 2 — Narratif & IA

## RÉPONSE AUX OBJECTIONS — nommées

### 1. PM et Tech Lead — le bloc `PRESENTS` et `narrateur.ts`

**Je retire `PRESENTS` d'it1. Le PM a raison** : ce bloc changerait la narration de `aller` et de `agir`, ce qui ferait deux comportements observables.

Le risque « le PNJ change de nom ou d'apparence » ne dépend pas de ce bloc. Il est tenu par le bloc `TOI` de R4 : l'identité est relue dans le dossier à chaque appel, jamais mémorisée. Reporter le bloc coûte la découverte des présents, pas la cohérence. L'invite de R3 dit déjà « tu n'ajoutes rien que la demande ne décrit pas » (`worker/index.ts:686`). Sans le bloc, R3 ne mentionnera personne — il n'inventera pas pour autant une silhouette qui contredirait l'apparence écrite par l'auteur.

Gain : deux épingles existantes restent vertes sans retouche (`contexte.test.ts:3083` : 8 chemins injectés ; `:3094` : aucun chemin `monde.personnages[]`). `CHAMPS_INJECTES_NARRATEUR` et `BUDGET_CARACTERES_DOSSIER` ne bougent pas.

**Je maintiens une seule ligne dans `narrateur.ts`, et ce n'est pas `PRESENTS`.** `ligneDuPas` (`narrateur.ts:414-417`) lit `recit ?? label` pour toute entrée qui porte une `origine`. Dès it1, une réplique validée par `validerActeur` est donc une ligne de pas dans la mémoire de R3. La docstring de `LIGNE_DE_PAS_MAX` (`:198-200`) devient fausse (« un récit, borne de `validerNarrateur`, ou un libellé »). La valeur ne change pas : max(800, 400, libellés) = 800, `BORNE_MEMOIRE` reste à 20 956. Le danger vient plus tard : si `REPLIQUE_CARACTERES_MAX` dépasse un jour 800, la borne devient fausse sans que rien ne le signale ; l'AC#6 existant ne le verrait pas (il sature la mémoire avec des récits de `NARRATION_CARACTERES_MAX`).

J'exige l'une des deux corrections : **(a), préférée** — ajouter `REPLIQUE_CARACTERES_MAX` dans le `Math.max` et corriger la docstring (aucun comportement ni aucune valeur ne change, entre dans le lot contrat unique du Tech Lead, l'objection du PM ne s'applique pas puisqu'aucune capacité de narration n'est ajoutée) ; **(b)** — une épingle `REPLIQUE ≤ NARRATION` dans `contexte.test.ts`, docstring corrigée. Ne rien faire laisse une borne de contexte qui ne tient que par coïncidence.

Correction au tableau de lots du Tech Lead : `LIGNE_DE_PAS_MAX` ne « bouge pas avec le label `parler` » — les libellés font ~30 caractères contre 800. Ce sont R4 et R1 qui obligent à re-mesurer `TAILLE_MAX_CORPS_IA` (voir point 3).

### 2. Tech Lead — compteur `P` partagé contre préfixe `I`

Ton souci (deux « P1 » dans un même prompt) est réglé par les deux mécanismes : `I1` et `P1` sont des textes différents. Ce qui départage, c'est l'invite, un contrat avec le modèle (`worker/index.ts:593,597,598` : « une liste de lieux repérés P1, P2… », « autant de repères de lieux », « hésite entre plusieurs lieux »).

**Si l'invite n'est pas réécrite**, elle dit au modèle qu'un rang P désignant un PNJ est un lieu — « je vais voir le marchand » donne `aller P<n>`, refusé en `rang-inconnu`, et le rejeu (même contexte, KR-230) reproduit l'erreur : échec systématique, pas aléatoire.

**Si l'invite est réécrite** (« lieux et personnes repérés P… »), le jeton ne dit plus de quelle nature est le rang — le modèle doit deviner dans la prose, or les `fonction` de la fixture nomment des lieux (« Marchand du marché des cendres… »), donc un bloc P nommant un lieu ne se distingue plus d'un bloc de lieu.

**Le rang d'un PNJ dépendrait alors du nombre de lieux accessibles et décrits** : il suffit d'un accès de plus pour que chaque PNJ change de rang, et chaque contexte épinglé bouge pour une retouche sans rapport.

Avec `I`, le coût est faible : une ligne de légende dans l'invite, sans nommer aucun verbe (KR-270) ; les lignes 597-598 passent à « lieux ou personnes » ; dans le code, `[PG]` devient `[PGI]` dans `porteUnRang`. Aucune collision de lettre (`A<n>` appartient à R3, le `P` des rôles auteur vit dans d'autres invites). Le même schéma vaudra pour les rangs suivants (`S<n>` pour les savoirs en it2) : une lettre par nature, sans décalage en cascade.

### 3. QA — le scénario « pluriel »

**Je confirme que « deux PNJ du même nom » n'est pas un cas du moteur.** `nom` reste d'audience `auteur` : R1 et R4 ne le voient jamais. R3 « ne donne de nom à personne ». La console désigne par identifiant, R1 par rang — un seul identifiant dans les deux cas.

**L'option A de QA (refuser), telle qu'écrite, est un veto.** Pour refuser « deux PNJ du même nom », le moteur devrait comparer des `nom`, décider sur un nom libre. Son test n°4 figerait un mauvais comportement.

**Ma nuance** : le seul pluriel réel, ce sont deux PNJ présents dont les identités (`fonction`+`apparence`) sont identiques ou trop proches. Le code détecte l'égalité exacte, pas la proximité — défaut d'auteur, qui relève de `dossier-controles` (question déjà ouverte, `spec:98`). En it1, l'issue est déjà déterministe : soit R1 choisit un rang (sans conséquence, ni savoir ni état touché), soit il pose une `precision` (admise, `personnages.size≥2`), soit une deuxième ambiguïté bascule en `reformuler` (anti-boucle KR-264). Pas de garde moteur en it1 ; la question devient sérieuse en it2 (savoirs différents), à rouvrir à ce moment avec un contrôle d'éditeur.

**Test proposé à la place du n°4** : A et B présents, même `nom`, identités distinctes ; le contexte de R1 porte deux rangs I, aucun `nom` ; un R1 simulé rend `I2` ; le contexte de R4 contient alors l'identité de B et rien de A.

## MA POSITION MISE À JOUR

1. **`PRESENTS`** : reporté en it2, ou dans la tranche « le joueur voit qui est là » déjà proposée au cadrage. Dans `narrateur.ts`, seule la formule (a) ou l'épingle (b) entre, rien d'autre.
2. **La fixture ne permet pas la démo annoncée par le PM.** Seuls deux PNJ ont une `presence` : Sélène (sans `fonction` ni `apparence`, donc non identifiable) et Corvin. Harek n'a ni `presence` ni `apparence`. Le marché n'a pas de description, donc inatteignable en saisie libre (KR-267). Sans `PRESENTS`, la démo sur la fixture livrée revient à « deviner que Corvin est là ». Le report n'est acceptable que si le scénario de démo nomme l'indice de prose qui mène au PNJ (rejoint le prérequis de QA) — ex. donner à Harek une `presence` au Foyer et une `apparence`, la description du Foyer dit déjà « une forge ». À trancher entre QA et le Tech Lead : fixture partagée modifiée ou fixture locale.
3. **La dette de budget de R1, omise au tour 1 — je l'assume.** `worker/index.ts:876-881` et le roadmap (l.168) la réassignent à « la première itération qui touchera réellement R1 » : c'est celle-ci. R1 gagne une table de prose d'auteur dont le schéma ne borne pas le nombre d'entrées ; sa seule borne est `TAILLE_MAX_CORPS_IA`, un dépassement donnant un 413 classé `injoignable` (refus sûr, mal classé). Minimum en it1 : mesurer le pire cas de R1 sur la fixture (PNJ compris), écrire la mesure dans la docstring du worker, la tenir dans `frontiere.test.ts` (déjà dans le lot). À arbitrer au tour 3 : budget client avec refus `trop-long` avant envoi, ou nouveau report avec déclencheur nommé — pas un report silencieux.
4. **Mon veto du tour 1 tient toujours, et le lot du Tech Lead ne le couvre pas.** `session.ts`/`sessionDestinations.ts` doivent poser `EntreeJournal.interlocuteur?` (audience `moteur`, optionnel à vie). Son lot les omet alors que son `acteur.ts` promet « K=4 répliques DE CE PNJ » — sans ce champ il ne reste qu'à relire `texte`.

Deux écarts à régler au tour 3, sans veto : écrire `refKinds:['pnj']` et non `'personnage'` ; garder `relations[]`/`cede_si` hors d'it1 (contredit aussi le test n°5 de QA, à concilier dans le même sens que moi).

## VERDICT

**Recevable sous réserve** de quatre points : le préfixe `I` ; la correction (a) ou (b) sur `LIGNE_DE_PAS_MAX` ; la mesure de R1 ; un scénario de démo qui nomme son indice.

**Veto** dans deux cas : `interlocuteur` n'entre pas au lot contrat ; le pluriel est gardé par une comparaison de `nom`.

## Décisions prises en autonomie faute de spécification
- Sort de `PRESENTS` → hors d'it1 → s'il était maintenu, `aller`/`agir` changeraient en it1, `M` serait re-mesuré, deux épingles existantes casseraient.
- Forme de la correction de `LIGNE_DE_PAS_MAX` → formule (a) plutôt qu'épingle (b) → avec (b), relever `REPLIQUE` serait interdit au lieu d'être recalculé.
- Dette de budget de R1 → mesure obligatoire en it1, budget client renvoyé au tour 3 → reporter sans mesurer ferait glisser une dette réassignée une troisième fois.
- Pluriel → aucune garde moteur en it1, remède côté éditeur en it2 → une garde par `nom` serait une décision sur nom libre (veto) ; une garde par égalité exacte d'identité rendrait deux PNJ inatteignables sans que l'auteur sache pourquoi.
- Démo d'it1 → doit nommer son indice de prose → sinon elle prouve que le code marche, pas que la partie se joue.

## Fichiers vérifiés
`.claude/raffinage/moteur-acteurs-it1/tour1-{pm-produit,tech-lead,ux-designer,qa,narratif-ia}.md` ; `.claude/raffinage/moteur-acteurs-cadrage/tour1-narratif-ia.md` ; `src/brain/copilote/contexte/{interprete,narrateur}.ts` ; `src/brain/copilote/contexte.test.ts` ; `src/brain/copilote/schemaSortie.ts` ; `src/brain/dossier/interprete.ts` ; `worker/index.ts` ; `worker/frontiere.test.ts` ; `src/brain/dossier/__fixtures__/dossier-reference.json` ; `docs/ROADMAP-BASCULE-IA.md` (l.168) ; `code-knowledge.json` (KR-261) ; `src/features/moteur-acteurs/specification.json`.
