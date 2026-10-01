RISQUE — Inchangé, plus un trou que j'ai trouvé en relisant le code. `narrateur.ts:517` choisit l'enjeu ainsi : `issue === 'reussit' ? enjeu_reussite : enjeu_echec`. Si `'reussit'` reste dans l'union, tsc ne signale rien. Chaque « réussit nettement » est alors raconté avec l'enjeu d'échec, et aucun test ne passe au rouge.

OBJECTION
- **Au tech-lead, sur `IssueEpreuve`** : je MAINTIENS mon objection, sans en faire un veto. La formulation ne relève pas de mon veto. Je la précise : « de justesse » repose sur un seuil fixe de 3, qui ne tient pas compte de l'amplitude des dés.
  - Contre-exemple : TC1 (1D6) contre une carac à 3, le dé fait 1, soit le meilleur jet possible. CarteJet affiche « 1 vs 3 » et R3 raconte « de justesse ».
  - « Nettement » à partir de 3 est toujours vrai. « De justesse » en dessous de 3 ne l'est pas toujours.
- **Correction sur la stabilité** : l'argument est neutre, il ne joue pas pour ma position. Les trois tests changent dans les deux variantes, et je les avais listés moi-même au tour 1 :
  - `arbitre.test.ts:103` : marge 3, c'est la frontière ;
  - `contexte.test.ts:4432` et `:4452` : 1D6 contre FO 12, marge d'au moins 6.
- **`actionEngine`** : HORS de mon veto. C'est un doublon entre deux codes, aucun prompt n'est touché. Ça relève du Tech Lead.
- **Mes objections du tour 1** :
  - (1) Critère n° 6 : MAINTENUE. Mon veto porterait sur 4 classes ou un second seuil retenus dans le code, jamais sur la rédaction du critère. C'est au PM d'amender.
  - (2) « De justesse » : voir le premier point.
  - (3) Tier hors combat : RETIRÉE sur le choix, puisque tout le monde converge vers la caractéristique testée. MAINTENUE sur l'endroit : la ligne §5 s'écrit avant le code (KR-130).
  - (4) Sans objet.

PROPOSITION
- Trois membres : `'echoue' | 'reussit' | 'reussit_nettement'`.
- La ligne 517 devient `resolution.success ? …` : le côté de l'enjeu vient de `success`, jamais de la classe.
- Test à la frontière : marge égale à MARGE_FRANCHE ⇒ `réussit nettement — ${enjeu_reussite}`. La valeur attendue s'écrit depuis la règle, jamais depuis le `received`, qui afficherait `enjeu_echec`.
- Si le comité garde « de justesse », je ne bloque pas.

VERDICT — Recevable sous réserve : une seule MARGE_FRANCHE, et la ligne 517 réécrite. Le veto reste le même : 4 classes, ou un seuil recopié.

---

**ANNEXE (hors quota)**

- **Ligne 517** : c'est le seul endroit qui consomme `IssueEpreuve` en dehors d'`arbitre.ts` (grep sur `src/`). `CarteJet` lit `resultat.success`.
  - Avec le renommage complet du tech-lead, 517 devient une erreur de compilation (TS2367), ce qui force à la reprendre. C'est le vrai mérite de sa variante, et je le reconnais.
  - Dans ma variante, on obtient le même effet en nommant la réécriture de 517 dans le plan et en ajoutant le test ci-dessus.
- **Fréquence sur une longue session** : part des réussites à marge inférieure à 3, en bande équilibrée :

  | Épreuve | Carac | Réussites à marge < 3 |
  |---|---|---|
  | TC1 (1D6) | 3 | 100 % |
  | TC2 (2D5) | 6 | 80 % (12 sur 15) |
  | TC3 (3D4) | 9 | 63 % (34 sur 54) |

  Avec « de justesse », R3 met en scène un quasi-échec sur la plupart des réussites, et le registre devient monotone. La classe la plus fréquente doit rester sans qualificatif.
- **Borne** : « réussit de justesse » fait 19 caractères, soit +12 sur `BORNE_JET`. `TAILLE_MAX_CORPS_IA` reste à 83 968 dans les deux variantes, donc la borne ne départage pas. La docstring `worker/index.ts:903` est à remesurer dans tous les cas.
- **Contrat IA inchangé** :
  - R2 et le schéma de sortie de R3 ne bougent pas.
  - La ligne de `CE PAS` reste `<amorce> — <enjeu>`, sans aucun chiffre et jamais persistée.
  - L'XP n'est jamais une sortie du modèle.
- **Ordre XP / R3** : aligné avec le lot B du tech-lead. La session créditée doit être celle que reçoit `consignerNarration` (`useTourDeJeu.ts:354`), dans les deux branches. Test à prévoir : après un tour complet, `heros.xp` est crédité et le récit est consigné.

**DÉCISIONS PRISES EN AUTONOMIE FAUTE DE SPÉCIFICATION**
- Qui tranche, entre les clés du type et le texte des amorces → je tranche le texte (c'est ce que lit R3) et je laisse les clés au tech-lead → s'il renomme tout, il gagne l'erreur de compilation sur 517, sans aucun coût en tests, mais une clé `reussit_de_justesse` qui produirait le texte « réussit » mentirait sur ce qu'elle désigne.
- Comment corriger 517 → sur `success` plutôt que sur `issue !== 'echoue'` → dans l'autre sens, chaque nouvelle classe de réussite obligerait à rouvrir cette ligne.
- Statut de l'objection « de justesse » → non bloquante, elle va à l'open_question de playtest (KR-229) → la bloquer reviendrait à dépasser mon veto, qui ne couvre pas la formulation.

Fichiers relus :
- src/brain/copilote/contexte/narrateur.ts
- src/brain/dossier/arbitre.ts
- src/brain/copilote/contexte.test.ts
- src/brain/challenge.ts
- src/brain/xp.ts
- src/features/moteur-arbitre/specification.json
