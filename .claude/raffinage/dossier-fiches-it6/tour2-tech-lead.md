## Note — TECH-LEAD · `dossier-fiches` it6/8 · tour 2 (contre-lecture)

**RISQUE** — Vérifié ce tour, et neuf : `BlocPresence.tsx` l. 38 porte la variante non corrigée du must-fix M1 — `if (lieux.length === 0) return <p>…` masque des `presence[]` déjà écrites. `BlocRelations.tsx` l. 66 porte, lui, la forme juste : `personnages.length < 2 && relations.length === 0`. Les deux modèles sont dans le dossier, à trois fichiers d'écart ; it6 copiera celui qu'on nomme. On nomme `BlocRelations`. `BlocPresence` part en `bug_history.json` (mineur, correction it7) — hors lot ici.

**OBJECTION** — À narratif-ia, P1 : le lot 0 « commentaires seuls » est refusé comme lot, accepté intégralement comme contenu. Motif dur : son point 3 écrit le JSDoc de `Savoir.revele_comment` dans `types.ts`, fichier où j'écris `CERTITUDE_INITIALE`. Deux lots nommant `src/brain/dossier/types.ts`, c'est précisément ce que je veto ; la propriété exclusive prime la lettre « contrat d'abord », dont l'objet est de figer un contrat devant un lecteur parallèle — il n'y en a aucun. Les deux corrections sont donc le même temps 0, une seule passe sur `types.ts`. Aucune raison de les séparer, et une raison dure de ne pas le faire.

**PROPOSITION** — Le lot rouvre `destinations.ts`, que j'avais mis hors lot au tour 1 : garde compensatoire, son diff ne contient que des lignes de commentaire, zéro entrée de la table `DESTINATIONS` — vérifiable en une commande à la revue. Et je tranche ma propre graine : `CONFIANCE_INITIALE_PORTE = 1`, strictement > `CONFIANCE_MIN` (−3), zéro ligne de `validate.ts`.

**VERDICT** — recevable. 1 lot, marqué `contrat`, +4 fichiers.

---

## ANNEXE

### A. Statut de mes objections du tour 1

| Tour 1 | Statut | Motif |
|---|---|---|
| RISQUE — graine `confiance_min` à `CONFIANCE_MIN` éteint `revelation-sans-porte` sans rien exiger | maintenu, tranché | `CONFIANCE_INITIALE_PORTE = 1` (`types.ts`, ligne d'export l. 193). −3 est prouvablement vide ; 1 exige quelque chose sous toute échelle plausible. Corriger le validateur coûterait une ligne de contrat + un test : refusé, la prémisse « contrat quasi nul » tombe. |
| OBJECTION 1 — état vide masquant des savoirs écrits | maintenue, précisée | Corps entier remplacé seulement si `personnage.savoirs.length === 0 && monde.indices.length === 0` (forme exacte de `BlocRelations.tsx` l. 66, conjonction). Si `indices.length === 0` seul : les savoirs existants se rendent, avec option orpheline « Indice introuvable — `<id>` » ; c'est la seule affordance d'ajout qui est remplacée par `TEXTE_AUCUN_INDICE_CANON`. Idem `objets` pour la porte contrepartie. C'est aussi le bouchon que demande PM — il n'y a rien de plus à écrire. |
| OBJECTION 2 — `objet_id`/`apres_indice_id` ouverts par un bouton | durcie en veto | L'annexe UX ouvre contrepartie sur `objets[0].id` et laisse `indices[0].id` implicite : un index de registre écrit une référence que personne n'a choisie — exactement ce que UX elle-même refuse pour `CERTITUDE_INITIALE`, et `indices[0]` peut être l'indice propre au savoir. Ces deux portes s'ouvrent par Select-comme-geste ; `handleOuvrirPorte{Contrepartie,ApresIndice}(index, id)` gardent leur `id` obligatoire. Corollaire général : un Select filtré rend toujours sa valeur courante en option — la self-exclusion demandée par QA porte sur les options d'ajout, jamais sur la valeur rendue, sinon première édition = réécriture silencieuse (KR-021/194). |
| PROPOSITION — 1 lot séquentiel | maintenue | +4 fichiers, toujours 1 lot, toujours aucun worktree. |

### B. Réponse à QA — le balayage `it.each` est possible sans toucher aux 20 handlers

Les 20 handlers nommés n'empêchent rien : le test ne pilote jamais le hook, il pilote le composant par nom accessible. Je refuse en revanche un `ouvrirPorte(nom, valeurs)` générique — l'union discriminée qu'il exigerait perdrait le typage par porte, seule chose qui rend le « commit conjoint de toutes les clés » vérifiable par `tsc` (jet = carac et tc ; contrepartie = objet_id et consomme). Ce serait une abstraction à 4 appelants tous dans un même composant : ma dette déclarée.

La factorisation vit à deux endroits, et l'anti-dérive est obligatoire, sinon le balayage est BUG-068 :

1. `BlocSavoirs.tsx` — un tableau descripteur local (non exporté) des 4 portes : `{ id, labelFerme, labelRetirer, estOuverte(s), ouvrir, fermer, controles }`. Un seul gabarit construit les noms accessibles ; ils ne peuvent plus diverger porte à porte.
2. `savoirs.test.tsx` — registre littéral de 4 lignes écrit dans le test, jamais importé de `BlocSavoirs` : un registre importé qui perd une porte rétrécit le `it.each` à 3 lignes vertes.
3. Garde runtime, zéro ligne de contrat — vérifié à l'instant : les 4 portes sont toutes atteignables depuis `brain` à l'exécution (`ENUMERES_FERMES` l. 253 `confiance_min`, 259/265 `jet.carac`/`tc`, 271 `contrepartie.consomme` ; `REFERENCES_SIMPLES` l. 438 `contrepartie.objet_id`, 439 `apres_indice_id`). Le test assemble les chemins des deux tables préfixés `monde.personnages[].savoirs[].revele_si.`, en dérive la famille, et exige la correspondance exacte avec ses 4 lignes + `toHaveLength(4)`. Une 5ᵉ porte au schéma, ou une porte perdue côté écran, rougit. C'est la lecture de `brain` comme donnée immuable, pas un contournement.

### C. Réponse à UX — `avertissementsD1Affiche`

Confirmé : `useSocleEcriturePersonnages.ts` l. 80-86 filtre par préfixe de chemin, pas par famille D1 — `revelation-sans-porte` remontera sans câblage. Le nom est faux et le mode de panne est nommable : quelqu'un croira le bandeau restreint à D1 et en construira un second. Renommage seul en `avertissementsAffiches`, zéro ligne de logique, 3 sites, `tsc` le garantit. Le lot rouvre donc `useSocleEcriturePersonnages.ts` — amendement explicite à ma liste « hors lot » du tour 1 : renommage uniquement, `commit` et ses deux indexations KR-197 restent intouchés.

### D. Découpage révisé — toujours 1 lot (`savoirs`, marqué `contrat`, séquentiel, aucun worktree, aucune fusion)

| # | Fichier | N/R | Temps | Contenu |
|---|---|---|---|---|
| 1 | `src/brain/dossier/types.ts` | R | 0 · contrat | `CERTITUDE_INITIALE = 'sait'`, `CONFIANCE_INITIALE_PORTE = 1`, + JSDoc `Savoir.revele_comment` (prédicat, narratif-ia B.3) |
| 2 | `src/brain/dossier/destinations.ts` | R | 0 · contrat | commentaires seuls (l. 209-211 `vérité` inexistant ; l. 224-225 `nom` = `auteur` ; l. 216-217 prédicat) — NOUVEAU |
| 3 | `src/brain/index.ts` | R | 0 | ajout des 2 constantes à la ligne d'export l. 193 |
| 4 | `src/features/dossier-fiches/components/BlocSituation.tsx` | N | 1 | décharge KR-112 — bloc 1 + `LIBELLES_CAMP`/`LIBELLES_PORTEE` |
| 5 | `src/features/dossier-fiches/components/BlocIdentite.tsx` | N | 1 | décharge — bloc 2 |
| 6 | `src/features/dossier-fiches/hooks/useEcritureSavoirs.ts` | N | 2 | famille savoirs, signature annexe D du tour 1 inchangée |
| 7 | `src/features/dossier-fiches/components/BlocSavoirs.tsx` | N | 3 | bloc 7 + descripteur local des 4 portes + `LIBELLES_CERTITUDE` |
| 8 | `src/features/dossier-fiches/hooks/useSocleEcriturePersonnages.ts` | R | 3 | renommage `avertissementsD1Affiche` → `avertissementsAffiches` — NOUVEAU |
| 9 | `src/features/dossier-fiches/hooks/useEcriturePersonnages.ts` | R | 4 | assembleur : `...savoirs` |
| 10 | `src/features/dossier-fiches/components/FichePersonnage.tsx` | R | 4 | retrait `BLOC_SAVOIRS`, câblage des 3 composants |
| 11 | `src/features/dossier-fiches/components/PanneauPersonnages.tsx` | R | 4 | `indices`/`objets`/`savoirs` passés à la fiche |
| 12 | `src/features/dossier-fiches/tests/savoirs.test.tsx` | N | 5 | balayage 4 portes + garde tables (§ B) |
| 13 | `src/features/dossier-fiches/tests/panneauPersonnages.test.tsx` | R | 5 | placeholders 2 → 1, titres, renommage |
| 14 | `src/features/dossier-fiches/tests/fichePersonnage.test.tsx` | R | 5 | seulement si la décharge le retargete (BUG-071) |
| 15 | `specification.json` · `bug_history.json` · `docs/ROADMAP-BASCULE-IA.md` | R | 6 · docs | `open_questions` n° 6 = `indices[].verite` ; BUG BlocPresence ; correction de cadrage vérifiée : Décision A l. 156 range `indices` en n° 5, le § 2 l. 170 et la ligne 150 les rangent en n° 6 (`dossier-registres`) — c'est la l. 156 qui est fausse |

**Ordre interne imposé** : temps 0 (contrat, `brain/` seul) → décharge + re-vert → hook → composant → câblage → tests → docs. Inchangé.

**Toujours pas 2 lots** : tout second découpage nomme `FichePersonnage.tsx` et `types.ts` des deux côtés. La dispense de contrat interne reste conditionnelle à l'unicité du lot : qu'un second lot apparaisse, et les fichiers 1-3 redeviennent un lot `contrat` seul et premier.

**Hors lot, à ne pas ouvrir** (liste du tour 1 moins `destinations.ts` et `useSocleEcriturePersonnages.ts`) : `tables.ts`, `validate.ts` et leurs tests, les deux fixtures, `components/styles.ts`, `Accordion.tsx`, les primitives, `useEcritureIdentite.ts`, `useEcriturePlan.ts`, `BlocCaracteristiques/BlocPlanActions/BlocRelations/BlocPresence`.

### E. Gardes de revue — ajouts au tour 1 (les 6 du tour 1 tiennent)

7. Diff de `destinations.ts` : lignes de commentaire uniquement, zéro entrée de table.
8. Corps du bloc remplacé seulement sur la conjonction (§ A, objection 1) ; test dédié « savoirs écrits + `monde.indices = []` ⇒ les savoirs restent rendus ».
9. Aucun Select ne perd sa valeur courante par filtrage (self-exclusion `apres_indice_id` incluse).
