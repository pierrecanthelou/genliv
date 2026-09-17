# Tour 1 — QA

**RISQUE** — Le témoin de la mesure C du cadrage (`dossier-minimal.json`, `charpente.fins[0].condition_expr` = `et(possede_objet(clef-de-basalte), non(lieu_courant_est(val-cendre)))`) n'a AUCUN pouvoir séparateur : un modèle naïf « `lieu_courant_est` toujours faux » et le modèle juste « `lieu_courant_est(depart)` = vrai » rendent le MÊME booléen final (faux) — le « et » masque l'inversion manquante car sa branche `possede_objet` est déjà fausse (aucun inventaire de départ, H5). Le risque réel n'est pas seulement Q1/Q2/Q3 : c'est de livrer une implémentation fautive sur `lieu_courant_est` / `lieu_visite` qu'AUCUN témoin existant ne fait rougir — famille BUG-087 (valeur attendue ≠ pouvoir séparateur, deux vérifications distinctes).

**OBJECTION** — Le témoin de mesure C ne sépare rien au niveau du verdict final. Toute affirmation de plan qui le citerait comme preuve suffisante serait fausse. Seconde objection, sur la définition écrite : « le statut de `lieu_visite(départ)` à t=0 n'est tranché nulle part » (mesure C) et aucune fixture n'exerce `lieu_visite` dans un `echoue_si_expr` — un critère qui fixerait cette valeur sans témoin est irrecevable (veto de terrain).

**PROPOSITION** — (1) Le lot écrit un témoin DÉDIÉ, non masqué par un `et`/`ou` : `echoue_si_expr = non(lieu_courant_est(depart))` SEUL, valeur mesurée sur code juste ET sur l'implémentation fautive nommée, avant adoption. (2) Trancher Q3 en trivalué / indécidable pour `lieu_visite` tant qu'aucun témoin ne le sépare. (3) Nommer au plan les tests qui bougent.

**VERDICT** — recevable sous réserve.

---

## Détail des mesures (lecture directe des fixtures et du code ; `jest` non rejoué — voir réserve de l'orchestrateur)

### 1. Tests qui bougent quand une 9e règle entre au registre et tire une fois sur `dossier-reference.json` — tous dans `src/brain/dossier/controles.test.ts`

- `chaque regle du registre exhibe un temoin qui la declenche` (~l.593) : `TEMOINS: Record<ControleId, Dossier>` est TOTAL par compilation — n'accepte pas la 9e clé sans témoin écrit. Casse **de compilation**, pas seulement de valeur.
- `la section de chaque controle est celle declaree, jamais derivee du path` (~l.480) : `NEUVES: Record<Exclude<ControleId,'amorce-non-redigee'>, ...>` — même mécanique.
- `les path sont des cles de DESTINATION_DES_CHAMPS` (~l.635) : `expect(new Set(controles.map(c=>c.id)).size).toBe(Object.keys(CONTROLES).length)` (l.664) rougit sans témoin pour la 9e règle.
- `les huit regles ecrivent le meme registre de langue, sur les deux colonnes` (~l.1647) : balayage (l.1698) + le libellé doit devenir « neuf » ; `TERMES_INTERDITS` peut devoir grossir si la prose neuve introduit une famille de mots interdits (précédent it7/it8/it9).
- `le calme des deux fixtures et du dossier neuf ne bouge pas` (~l.1590) : `seme()` produit `canon.objectifs: []` → `neuf.controles` **INCHANGÉ**. `minimal.objectifs[0].echoue_si_expr = ou(evenement_consomme, pnj_a_revele)`, les deux faux à t=0 → `minimal.controles` **INCHANGÉ**. `reference.controles` reçoit **une ligne de plus**, sur `objectif.proteger-le-sceau` — seul mouvement attendu.

Pas de test UI qui bouge : `dossierEditorScreen.test.tsx` porte sur un dossier fraîchement créé (`canon.objectifs: []`), la 9e règle y reste muette ; son « huit » compte les sections de nav, pas les règles. `pastilles.test.ts` dérive son ensemble depuis `CONTROLES` — ne casse que si un `niveau` hors `bloquant/alerte/info` apparaissait.

### 2. Implémentations fautives plausibles, témoin discriminant, existence du témoin

- **(i) « tous les prédicats faux à t=0 »** — se trompe sur `lieu_courant_est`. Témoin : `echoue_si_expr = non(lieu_courant_est(depart))` SEUL. **N'EXISTE PAS** dans les fixtures ; le seul site actuel est masqué par un `et`. **À fabriquer.**
- **(ii) évaluation qui descend dans `non` sans inverser** — témoin : tout `echoue_si_expr` niant un prédicat faux à t=0. **EXISTE** : `dossier-reference.json` `objectifs[1].echoue_si_expr = non(possede_objet(sceau-de-cendre))`.
- **(iii) règle par objectif vs règle de collection** — témoin : deux objectifs, un seul fautif. **EXISTE** : `dossier-reference.json` (objectifs[0] négatif, objectifs[1] positif, même collection).

### 3. Matériau réel (mesure A) — confirmé

`objectifs[0].echoue_si_expr = evenement_consomme(...)` (négatif, sans négation — même le modèle naïf le rend juste faux) et `objectifs[1].echoue_si_expr = non(possede_objet(...))` (positif réel). Même collection, même dossier partagé. **KR-197/202 servis sans aucune mutation de fixture.**

### Ce que je n'ai pas pu constater
La forme exacte du code (Q2) : il n'y a pas d'implémentation à mesurer au cadrage. Mon objection sur `lieu_visite(départ)` et sur le pouvoir séparateur de la mesure C doit être reprise au tour 2 par tech-lead / narratif-ia.
