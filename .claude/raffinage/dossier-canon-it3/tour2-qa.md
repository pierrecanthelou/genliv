Confirmé : `sections.ts:83` — `{ num: 1, id: 'canon', ..., compte: () => SANS_COMPTE }`, constante, épinglée par `sections.test.ts:183` (`expect(canon.compte(dossier)).toBe('—')`). Le critère #7/8 est bien insatisfiable pour objectif sans modifier `sections.ts`, hors du lot contrat KR-186.

**RISQUE**

La prescription tech-lead (tour 1) couvre le chemin ÉDITION (post-`commit()`) mais pas le chemin OUVERTURE : `resultat.warnings` n'existe qu'après un commit réussi. Or `condition-sans-expr` sera vrai pour TOUT objectif déjà persisté dès qu'il porte `reussi_si_texte` sans `reussi_si_expr` — donc pour un dossier réouvert sans qu'aucun champ objectif ne soit touché, le bandeau resterait invisible au montage alors que l'anomalie existe déjà. C'est le cas le plus fréquent une fois it3 livrée, pas un cas limite marginal.

**OBJECTION**

Trois trous restent avant que le plan porte un critère observable complet : (1) comportement au MONTAGE (dossier avec objectif déjà en warning, zéro édition) — non spécifié ; (2) cas négatif nommé — objectif sans `…_texte` ⇒ aucune région rendue, pas de bandeau fantôme ; (3) deux `role="status"` simultanés (refus + warning) exigent `getAllByRole('status')` dans le test, jamais `getByRole` nu (RTL Query Safety, `docs/WORKFLOW.md`) — sinon `MultipleElementsFoundError` dès l'écriture du test.

**PROPOSITION**

Ajouter au plan : le texte rendu = `issue.message` verbatim via `IssueList`, sans re-rédaction feature ; un critère « au premier rendu, un objectif déjà non conforme affiche le warning sans édition préalable » (implique un calcul dérivé au rendu, pas seulement semé par `commit()`) ; le cas négatif nommé ; la garde `getAllByRole`.

**VERDICT**

Sur #7/8 : d'accord, retrait de it3 (pas « non testé » — insatisfiable, à retirer explicitement de la liste). Sur mon veto : **maintenu, allégé** — le principe (filtrage `path`, `IssueList`, région distincte) est recevable, mais levé seulement quand les trois points ci-dessus figurent comme critères nommés dans le plan final.

---

**Note orchestrateur (post-hoc) :** la prescription tech-lead de tour 2 (reçue après cette note QA, les deux tours 2 tournant en parallèle) remplace déjà le filtrage post-`commit()` par un `useMemo(() => validateDossier(dossier).warnings…, [dossier])` recalculé à chaque rendu — ce qui couvre structurellement le point (1) de cette objection (comportement au montage) sans qu'aucun rôle n'ait vu la note de l'autre. Convergence indépendante, retenue à l'arbitrage. Les points (2) et (3) restent à écrire explicitement au plan.
