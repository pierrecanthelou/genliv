RISQUE — Vérifié par lecture directe : `deltas.test.ts:174` (`expect(porteurs).toEqual([])`, parcours récursif de `RACINE_SRC` sur TOUT `src/`) interdit bien tout fichier hors `brain/dossier/`, discriminant confirmé ligne 179. L'affirmation tech-lead tient.

OBJECTION — Le mécanisme proposé (`porteurs.filter(f => !AUTORISES.includes(f))`, sous-ensemble) est le bon patron : vert lot 1 seul (`porteurs=['brain/index.ts']` ⊆ AUTORISES) et vert lot 1+2. MAIS l'exemple écrit dans l'annexe tour1-tech-lead a une valeur fausse : `AUTORISES = ['index.ts', ...]`. `RACINE_SRC = MODULE_DOSSIER/../.. = src/`, donc `path.relative` produit `brain/index.ts`, jamais `index.ts` nu. Avec la valeur telle qu'écrite, le lot 1 ROUGIT SEUL — l'inverse de ce que l'annexe annonce. Défaut de plan, pas de constat.

OBJECTION — Aucun test nommé n'existe pour la renumérotation d'`etape`. Exiger, niveau unitaire (jest seul, pure, pas RTL) : `it('handleRetirerEtape renumerote 1,2 apres retrait du milieu sur 3 etapes, jamais 1,3')` sur `useEcritureEtapes` isolé.

PROPOSITION — `consigne`/`enonce` : sans impact sur `couverture.test.ts`/`destinations.ts` (mêmes lignes de table quel que soit le libellé). Mais `enonce` ravive une collision RTL réelle, pas théorique : `Jalon.enonce_texte` rend déjà `getByRole('textbox', {name:/énoncé/i})` (`panneauJalonsFins.test.tsx:145,432`). Deux « ÉNONCÉ » sur `dossier-registres` = ambiguïté RTL (règle « RTL Query Safety ») sauf libellé distinct écrit au plan — l'UX tour1 ne l'a pas anticipé. Mes 4 tests tour1 (non-régression, orpheline, doublons, état vide) : tous couvrables jest+RTL, aucun autre instrument requis.

Mon objection tour1 (CHAMPS_REQUIS d'`etapes[].libelle`) : retirée, actée par (a). Mes 3 tests UI nommés : maintenus, à inscrire au plan.

VERDICT — recevable sous réserve (AUTORISES corrigé, libellé ÉNONCÉ distinct, test renumérotation nommé).
