# Mesure de l'orchestrateur — entre le tour 1 et le tour 2

## Q1 — l'amendement de `lieu_visite` fait-il rougir `tourzero.test.ts` ?

Geste : cellule `lieu_visite: () => 'indecidable'` remplacée par la forme a trois bras
proposee par le tech-lead (annexe B). `npx jest src/brain/dossier/tourzero.test.ts`.

```
Tests: 2 failed, 6 passed, 8 total
 :200  « lieu_visite · nu → true »   attendu « lieu_visite · nu → false »
 :242  et(VRAI, INDECIS)  rend « se trouve dans le lieu · lieu.temoin · nu »  attendu « silence »
```

Cause : `feuilleNue('lieu_visite')` vise `cibleDe('lieu')` = `lieu.temoin`, et
`LIEU_DU_DEPART = cibleDe('lieu')` — la cible generique DES lieux EST le depart du
dossier fabrique. La cellule amendee rend donc `'vrai'` la ou la table attend
`indecidable`, et `INDECIS = feuilleNue('lieu_visite')` (`:228`) cesse d'etre indecis.

**Conclusion** : la QA a raison, le tech-lead se trompe. L'amendement n'AJOUTE pas des
cas : il oblige a modifier `VALEUR_ATTENDUE` (`:106`) et a repointer `INDECIS`, donc a
TOUCHER des cas existants — ce que le critere d'acceptation 3 interdit mot pour mot.

Arbre restaure (`cp` depuis la sauvegarde), 8/8 vert, `git status` propre hors
`.claude/raffinage/moteur-dossier-it1/`.

## Q2 — le refus sur MARQUEUR_A_ECRIRE double-t-il une regle livree ? (objection 2 du PM)

`src/brain/dossier/controles.ts:168-176` — CONFIRME :

```ts
const PROSES_AMORCE: Record<keyof typeof AMORCE, ProseAmorce> = {
	texte_ouverture_joueur: {
		niveau: 'bloquant',
		path: 'charpente.depart.texte_ouverture_joueur',
		message: `Ce texte porte encore le marqueur ${MARQUEUR_A_ECRIRE} : …`,
```

Les trois autres proses semees (`synopsis_mj`, `accroche_joueur`, `ton`) sont `alerte`.
Donc : un dossier dont le texte d'ouverture porte le marqueur a `jouable === false`, et
la porte du shell l'a DEJA refuse avant qu'`ouvrirSession` ne soit appele.
