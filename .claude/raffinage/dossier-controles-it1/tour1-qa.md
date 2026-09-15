# Tour 1 — `qa`

**VERDICT** : recevable sous réserve — deux points doivent être épinglés avant l'essaim, sinon deux lots livrables divergeront sur un comportement observable qu'aucun test ne peut arbitrer.

**RISQUE** — `dossierEditorScreen.test.tsx › nav des dix sections` (l. 178-192) fait `getByRole('navigation', { name: 'Sections du dossier' })`, puis `within(nav).getAllByRole('button')`, asserte `toHaveLength(10)`, et **indexe** `TITRES[index]` / `COMPTES_DOSSIER_NEUF[index]`, deux tableaux à dix entrées. Une onzième entrée posée dans ce landmark ne fait pas seulement échouer l'assertion : elle **sort en erreur d'index**. Le cadrage dit « séparée par un borderTop » sans dire si c'est le **même** `<nav>` ou un second landmark — cette ambiguïté décide à elle seule si le test doit être touché (régression assumée) ou rester vert (le toucher serait un défaut).

**OBJECTION** — l'algorithme de détection n'est écrit nulle part : `startsWith` (convention déjà tenue par `amorce.test.ts`, « porte la marque EN TÊTE ») et `includes` divergent **exactement** sur le cas limite « marqueur au milieu ». Sans arbitrage, deux implémentations passent tous les critères et se contredisent, et aucun test ne peut dire laquelle est fautive. *(→ le tech-lead tranche `includes` ; désaccord ouvert.)*

**PROPOSITION** — (1) trancher en une phrase laquelle des deux lectures du landmark est correcte, et si c'est celle qui touche le test l. 186, le dire explicitement comme régression attendue **dans le lot d'adoption**. (2) Écrire la détection retenue dans le JSDoc de la règle.

## Critères d'itération (8 au plus)

1. **C1 — les quatre lignes ensemble.** Étant donné un dossier produit par `construireAmorce()`, quand `controlerDossier` est appelé, alors `controles` compte exactement 4 éléments : 1 `bloquant`/`depart` sur `charpente.depart.texte_ouverture_joueur`, 3 `alerte`/`canon` balayées depuis les clés d'`AMORCE` (KR-199, jamais quatre littéraux) ; `jouable === false`. — *unitaire, L1*
2. **C2 — discriminance, un seul champ, même test.** Étant donné dans le MÊME test un clone de `dossier-minimal.json` (aucune prose marquée — mesuré) et ce clone muté d'UN champ préfixé de `MARQUEUR_A_ECRIRE` importé, quand `controlerDossier` est appelé sur chacun, alors le premier produit 0 contrôle et le second exactement 1, au niveau attendu ; restaurer la valeur retombe à 0 dans le même test. — *unitaire, L1* — KR-197/202
3. **C3 — section déclarée, jamais dérivée.** Étant donné le rapport de C1, quand on compare la section de chaque contrôle à celle que la règle déclare, alors les quatre coïncident — le bloquant vaut `'depart'`, jamais `'charpente'`, ce que donnerait une dérivation naïve du premier segment de `path`. — *unitaire, L1* — KR-219
4. **C4 — marqueur importé, gardes intactes.** Étant donné `amorce.test.ts` inchangé, quand `controles.ts` et son test sont ajoutés, alors ses deux tests-grep restent verts SANS modification d'assertion. — *contrat, L1* — KR-223
5. **C5 — type frère, aucun canal `error`.** Étant donné le rapport de C1, quand on inspecte chaque contrôle, alors aucun ne porte `severity`, aucun `niveau` hors `bloquant|alerte`, et cela sans jamais lire `validateDossier(...).errors`/`.warnings`. — *unitaire, L1* — KR-217, KR-225
6. **C6 — le panneau rend le rapport ; état calme sans liste vide nue.** Étant donné le rapport de C1 puis un dossier calme, quand le panneau est rendu, alors on lit une ligne BLOQUANT et trois ALERTE avec leur phrase française (jamais un code technique), et le dossier calme rend un texte d'état calme. — *composant, L2*
7. **C7 — adoption hors du registre `SECTIONS`, clavier compris.** Étant donné l'écran rendu avec un dossier neuf, quand l'auteur active l'entrée « Contrôles » (clic ou Tab + Entrée), alors le panneau s'affiche, `SECTIONS.length === 10` reste vrai, et cette entrée ne porte aucun badge de compte. — *bout-en-bout, L2*
8. **C8 — non-régression du landmark existant.** Étant donné le test l. 178-192 tel qu'il existe, quand le lot d'adoption livre l'entrée, alors ce test reste vert SANS modification ; toute rougeur est un défaut (KR-117), sauf décision de cadrage explicite contraire. — *bout-en-bout, L2*

## Piège de discriminance — mesuré

`dossier-minimal.json` ne porte le marqueur sur **aucune** de ses quatre proses : c'est un dossier rédigé, donc naturellement calme. `construireAmorce()` le porte sur les quatre, toujours. Les deux fixtures sont réellement distinctes, pas le même dossier vu deux fois. **Mais** C1 et C2 restent deux tests distincts et nécessaires : C1 seul ne prouve pas la discriminance par champ, C2 seul ne prouve pas que les quatre se déclenchent ensemble au bon niveau chacun.

## Cas limites

Prose vide (ne plante pas, ne déclenche pas) · marqueur seul sans consigne (déclenche) · **marqueur au milieu** (comportement fixé par l'algorithme retenu — test à écrire *après* arbitrage) · prose rédigée contenant le glyphe par hasard · dossier jamais passé par `construireAmorce` (couvert par la branche calme de C2). Collections vides : hors périmètre d'it1, la règle ne lit que quatre champs scalaires.

## Non-régression chiffrée

- `dossierEditorScreen.test.tsx` l. 186 : vert sans modification si l'entrée vit hors du landmark, ou n'est pas rendue quand aucun panneau n'est injecté. Les sondes de source l. 194 (KR-013, aucun recalcul de compteur) et l. 203 (aucun badge coloré) doivent rester vertes : rien dans it1 n'introduit `tone="good"/"bad"/"accent"` **dans `SectionNav`**.
- `brain/index.ts` gagnant des exports : aucune suite ne rougit, les gardes d'`amorce.test.ts` portant sur l'absence de trois chaînes précises. Une collision d'export serait signalée par `tsc` avant tout test.
- `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `roundtrip.test.ts` : vertes sans modification ; leur rougeur serait le signal direct d'une sortie de périmètre.

## Non vérifiable en l'état *(à recopier dans la revue)*

- Le `borderTop` du contrat de design : jsdom ne calcule aucun layout — seule la présence d'un jeton attendu est vérifiable, jamais le rendu.
- La totalité de `controlerDossier` : aucun test ne prouve l'absence d'exception sur tout `Dossier` typé possible ; seul un échantillonnage des cas limites.
- Les sondes de source au-delà de la ligne 415 de `dossierEditorScreen.test.tsx` (fichier non lu en entier).
- Le comportement « marqueur au milieu », tant que l'algorithme n'est pas arbitré.
- L'ordre de tabulation exact entre les dix sections et « Contrôles », et le focus visible.
