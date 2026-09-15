# Tour 2 — `qa`

**VERDICT** : recevable — les deux réserves du tour 1 tombent, sous condition que les deux tests d'annexe soient livrés dans L1.

**RETRAIT** — (1) le hedge sur D2 (« aucun arbitrage possible tant que ce n'est pas écrit ») : retiré, tranché par le test. (2) Le RISQUE landmark : retiré, **vérifié sur pièce** — `renderScreen(brain, dossier.id)` (l. 182) n'injecte AUCUN panneau, pas même Canon. Sous un rendu conditionné à l'injection du panneau Contrôles, l'entrée n'apparaît dans aucun landmark de ce test, quel qu'il soit. Absorbé dans C8 révisé.

**MAINTIEN** — le test « marqueur au milieu » doit exister (condition « après arbitrage » levée) · C4 durci d'une sonde locale · C7/C8 ne présupposent ni le clic-vers-section ni un rendu inconditionnel.

## Réponses nommées

**Tech-lead (D4)** — confirmé sur pièce (l. 93-99 et l. 182) : un rendu conditionné laisse ce test à dix boutons sans y toucher. Ma réserve tombe.

**UX** — « 11ᵉ position dans le même `<nav>` », sans mention d'un rendu conditionnel : tension à signaler. Lue seule, cette copie autoriserait un rendu inconditionnel qui romprait C8 ; elle doit se lire **sous** la garde du tech-lead, jamais comme une licence de la contourner.

**Narratif (P2)** — rejoint.

**D2 — `includes` l'emporte, et c'est le TEST qui tranche, pas la convention.** Seul un test « marqueur au milieu » falsifie les deux comportements ; aucun critère actuel n'en écrit un, donc un `startsWith` fautif passerait tout le lot sans qu'aucune suite ne rougisse — c'est le trou exact que la QA doit fermer. `amorce.ts` le dit lui-même : « un **balayage** (n° 7) ne produit pas de faux positif » — balayage, pas préfixe.

**Glyphe en dur** — `amorce.test.ts` attraperait déjà une recopie dans `controles.ts` (son balayage porte sur tout `src/`), mais **l'échec pointerait le mauvais fichier**. Sonde locale ajoutée à `controles.test.ts` : défense en profondeur et bonne localisation, pas un remplacement.

## Critères révisés (8)

C1, C2, C3, C5, C6 — inchangés (C3 est déjà agnostique à l'endroit où vivent `niveau`/`section`).

**C4 (révisé)** — Étant donné `amorce.test.ts` inchangé ET une sonde nouvelle locale à `controles.test.ts`, quand `controles.ts` est ajouté, alors (a) les deux tests-grep d'`amorce.test.ts` restent verts sans modification, et (b) `controles.ts` ne contient le glyphe qu'à travers l'identifiant importé, jamais recopié en littéral. — *contrat, L1* — KR-223.

**C7 (révisé)** — Étant donné l'écran rendu **avec** un panneau Contrôles injecté, quand l'auteur active l'entrée « Contrôles » (clic, ou Tab jusqu'à elle puis Entrée), alors le panneau affichant le rapport de C1 apparaît, `SECTIONS.length === 10` reste vrai, et l'entrée ne porte aucun badge de compte. Ne présuppose ni le clic-vers-section, ni un mécanisme d'implémentation nommé : seul le comportement observable est testé. — *bout-en-bout, L2*

**C8 (révisé)** — Étant donné le test l. 178-192 tel qu'il existe — `renderScreen` sans aucun panneau, Contrôles compris —, quand le lot d'adoption livre l'entrée, alors ce test reste vert **sans aucune modification de son code** : `within(nav).getAllByRole('button')` reste de longueur 10. Toute rougeur, ou toute nécessité de le modifier pour repasser au vert, est un défaut (KR-117) et signale un rendu inconditionnel. — *bout-en-bout, L2*

## Deux tests ajoutés à L1

```ts
it('detecte un marqueur reste au milieu d une prose partiellement reecrite (D2)', () => {
	const dossier = construireAmorce('d1', 'Titre', '2026-01-01T00:00:00.000Z')
	const proseRetouchee = `Le seigneur de ce donjon est cruel ${MARQUEUR_A_ECRIRE} le joueur ne le sait pas encore.`
	const mute = { ...dossier, canon: { ...dossier.canon, ton: proseRetouchee } }
	const controleTon = controlerDossier(mute).controles.find((c) => c.path === 'canon.ton')
	// Avec startsWith ce controle n'existe pas : la prose ne COMMENCE plus par le
	// marqueur, elle le contient. C'est le cas que le dispositif existe pour empecher.
	expect(controleTon).toBeDefined()
	expect(controleTon?.niveau).toBe('alerte')
})

it('les messages francais n ecrivent jamais le glyphe en dur', () => {
	const source = fs.readFileSync(path.join(__dirname, 'controles.ts'), 'utf8')
	expect(source).not.toContain(MARQUEUR_A_ECRIRE)
	expect(source).toContain('MARQUEUR_A_ECRIRE')
})
```
