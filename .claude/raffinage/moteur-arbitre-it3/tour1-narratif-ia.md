RISQUE — La nuance peut devenir une seconde règle. Le critère n° 6 de la spec liste QUATRE amorces (réussit / de justesse / nettement / échoue). La quatrième exige un second seuil qui n'existe pas dans §5 (KR-261). Et aucun test par valeur ne distingue `MARGE_FRANCHE` d'un `3` recopié dans `arbitre.ts`.

OBJECTION
1. Le critère n° 6 contredit le but de l'itération, qui compte trois états. Il faut l'amender.
2. « De justesse » sur les marges 0 à 2 affirme une étroitesse que le code ne mesure pas. CarteJet affiche « 12 vs 14 » et le récit dit « de justesse » : les deux se contredisent.
3. §5 ne dit pas quelle caractéristique fixe le Tier_personnage hors combat. Seul `actionEngine.ts:38` tranche (la caractéristique testée), donc c'est le code qui décide. KR-130 : on ajoute d'abord une ligne dans la doc.
4. Point 5 : rien ne fuit vers le joueur, qui voit déjà plus que R3 (dés, valeur). R3 gagne un bit d'information, jamais la marge. La doctrine reste la même, à condition que (b) et (c) tiennent.

PROPOSITION
a. Un ensemble fermé de trois classes {échoue, réussit, réussit nettement}. On garde le « réussit » d'it2, on ajoute une seule entrée, et l'échec n'a pas de nuance.
b. Témoin KR-261 : `jest.mock('../xp')` avec `MARGE_FRANCHE = 5` ⇒ une marge de 4 rend `reussit`. Le test doit être vu rouge sur un `3` littéral.
c. Invariance de R3 : FO 12 contre FO 9 sur TC1 (marges différentes, même classe garantie), puis deux sessions qui ne diffèrent que par `heros.xp` ⇒ texte identique.
d. L'XP est créditée par une fonction pure de `brain/`, avant l'`await` de R3, dans la session dont héritent les deux branches. Sinon `consignerNarration(sessionAvecJet…)` (`useTourDeJeu.ts:354`) écrase le crédit.
e. L'invite ne change pas. La liste des mots interdits est dérivée d'`AMORCE_ISSUE`.

VERDICT — recevable sous réserve. Veto si l'on retient quatre états ou un seuil recopié.

---

ANNEXE (hors quota) — Contrat IA concerné. Aucune nouvelle sortie de modèle.

- **R2** : inchangé (entrée, schéma `{epreuve}|{sans_epreuve}`, rejeu unique puis dégradation).
- **R3, entrée injectée** : la ligne de `CE PAS` reste `<amorce> — <enjeu advenu>`.
  - L'amorce vient d'un `Record<IssueEpreuve,string>` fermé à 3 valeurs.
  - Jamais de chiffres, ni `carac`/`tc`, ni `heros.*`, ni XP.
  - La ligne n'est jamais réduite par la cascade, jamais persistée, jamais remise en mémoire : seul le récit, déjà borné, entre dans `RECEMMENT`/`AUPARAVANT`. La mémoire de session ne change pas.
- **Borne du contexte** : `BORNE_JET` se recalcule seule.
  - « réussit nettement » fait 17 caractères ⇒ 100 (+10) ; `BUDGET_CARACTERES_NARRATEUR` passe de 27 046 à 27 056.
  - `TAILLE_MAX_CORPS_IA` = ceil((3×27 056 + 2 743)/1024)×1024 = 83 968, donc inchangée.
  - Marge avant le palier suivant : 29 caractères sur l'amorce la plus longue, puisque (83 968 − 2 743)/3 = 27 075.
  - La docstring `worker/index.ts:903` (« max('réussit','échoue') … = 90 ») est à remesurer dans le même lot.
- **R3, sortie** : le schéma de `validerNarrateur` ne change pas. En cas d'échec : un rejeu, puis `degrade`. L'XP reste créditée, elle ne dépend pas de R3.
- **XP** : aucune sortie de modèle.
  - Calcul : `challengeXp({challengeTier: challengeTierValue(tc), heroTier: tierOf(caracs[carac]), success, baseXp: CHALLENGE_TIERS[tc].baseXp, margin})`, à partir d'`issueDuJet`.
  - Si `issueDuJet` rend `undefined`, rien n'est crédité (pas de 0 inventé).
  - ⚠ `actionEngine.resolveRoll` assemble déjà exactement ces arguments. Un second assemblage serait une règle en double. C'est au tech-lead d'arbitrer.
- **Tests qui changent volontairement** (à lister dans le plan, pour qu'aucun ouvrier ne « répare » le seuil pour les remettre au vert) :
  - `arbitre.test.ts:103` (marge 3 ⇒ `reussit`, c'est la frontière même) ;
  - `contexte.test.ts:4432` et `:4452` (FO 12 contre TC1 ⇒ nettement).
- **Test de la frontière 2/3** : le tirage ne dépend pas de la valeur de la caractéristique (rng indexé sur graine, 'jet', tour). On lit donc `r = issueDuJet(...).roll`, puis on pose carac = r+2, puis r+3.
- **Correction factuelle** : la docstring d'`arbitre.ts` dit « seule appelante dans tout le dépôt ». Or le témoin ne balaie que `src/features/**`, et `src/player/engine/{actionEngine,combatEngine,capacityEffects}.ts` appellent `resolveChallenge`. À reformuler, puisque le fichier est rouvert.
- **Ce que jest ne peut pas vérifier (KR-229)** : R3 qui raconte un gain sur « réussit nettement » alors que la ligne dit `aucun changement`. L'invite est la seule garde. C'est à verser à l'open_question de playtest existante.

---

DÉCISIONS PRISES EN AUTONOMIE FAUTE DE SPÉCIFICATION
- Formulation de la classe du milieu (« de justesse » dans le but, rien ailleurs) → j'ai choisi « réussit » tout court, plus « réussit nettement » → avec « de justesse », le récit affirme une étroitesse à une marge de 2 et contredit CarteJet. Retour possible : une chaîne, la borne se recalcule.
- Nuance sur l'échec → aucune → sinon il faut un seuil négatif absent de §5, ce qui viole KR-261 et KR-130.
- Ordre entre le crédit d'XP et R3 → avant l'`await`, dans `brain/` (REGLES-PLAY §F3 : « immédiatement après ») → après, l'XP est perdue sur la branche « propose » (écrasement) ou dupliquée dans deux branches.
- Tier_personnage hors combat → la caractéristique testée, écrite d'abord dans §5 → avec la MC ou la meilleure caractéristique, les valeurs d'XP changent, et le choix aurait été fait depuis le code.
- Faut-il expliquer les classes dans l'invite de R3 → non → sinon la classification existe aussi dans le prompt et dérive au premier changement de seuil.

Fichiers lus :
- src/features/moteur-arbitre/specification.json
- src/brain/dossier/arbitre.ts
- src/brain/xp.ts
- src/brain/challenge.ts
- src/brain/copilote/contexte/narrateur.ts
- src/brain/copilote/contexte.test.ts
- src/features/play-mode/hooks/useTourDeJeu.ts
- src/player/engine/actionEngine.ts
- worker/index.ts
- docs/REGLES-DU-JEU.md
- docs/REGLES-PLAY.md
