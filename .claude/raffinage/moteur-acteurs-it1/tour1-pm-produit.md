# Raffinage `moteur-acteurs` it1 — Tour 1 — PM Produit

## RISQUE
Le risque n'est pas dans ce qui reste à inventer mais dans ce qui est déjà tranché et pourrait se rouvrir en raffinage : `ReponseActeur` strictement `{replique}` (KR-285), zéro savoir/confiance/jet (consensus tour 2 du cadrage, PM lui-même s'étant rétracté sur `confiance_min` en it1), aucun second canal d'affichage (précédent `OutcomeBlock` rejeté), aucune réplique de repli écrite par le code sur sortie invalide (KR-283, veto Narratif-IA maintenu). Si un rôle réintroduit l'un de ces points « pour gagner du temps plus tard », c'est une réouverture de décision actée, pas une amélioration.

## OBJECTION
Les « fichiers probables » incluent `brain/copilote/contexte/narrateur.ts`. Le goal d'it1 est : le joueur parle, le PNJ répond — une seule capacité. Si cette modification dépasse l'ajout de la table de candidats PNJ (projection `fonction`/`apparence`, pour que R1 reconnaisse `parler <pnj>`) et se met à enrichir la narration de R3 sur d'autres verbes (`aller`/`agir`), l'itération touche deux comportements observables, pas un — ce n'est plus démontrable en une phrase.

## PROPOSITION
Verrouiller it1 à 2 lots : (1) contrat — `commandes.ts`, `copilote/types.ts`, `CopiloteService.ts`, `worker/index.ts` ; (2) feature — `contexte/acteur.ts` (nouveau) + extension strictement limitée à la table de candidats PNJ dans `interprete.ts`/`narrateur.ts`, sans aucune nouvelle capacité de narration pour `aller`/`agir`. Fixture : déjà démontrable sans travail préalable — `lieu.foyer-du-guet` (forgeron) et `lieu.marche-des-cendres` (marchand) portent `fonction`/`apparence` et `presence`, contrairement à Mira (it2). Critères d'it1 : les 2 du plan (PNJ répond / PNJ absent refusé avant R4) + KR-283 (sortie invalide → silence + bannière, absent de la liste `acceptance_criteria` mais cité en `known_risks` — à QA de le rendre observable) + le périmètre `moteurSansIA.test.ts`. Hors périmètre, non négociable : toute porte de `Revelation`, carnet d'indices, confiance, jet — reportés tels quels en it2/3/4.

## VERDICT
Recevable sous réserve : confirmation du Tech Lead que la touche à `narrateur.ts` est bornée à la table de candidats, rien de plus.

---

## Décisions prises en autonomie faute de spécification
- Quels critères d'acceptation globaux (9, non étiquetés par itération) relèvent d'it1 → j'ai retenu les 2 premiers + KR-283 + le périmètre `moteurSansIA.test.ts` → si l'inverse (tout le bloc des 9 jugé applicable dès it1), l'itération se jugerait sur des critères que son propre scope (zéro savoir) rend vides par construction, un échec garanti pour rien.
- Portée de la touche à `narrateur.ts` (non détaillée dans « fichiers probables ») → j'ai posé qu'elle se limite à la table de candidats PNJ, zéro nouvelle narration sur `aller`/`agir` → si l'inverse, it1 démontre deux comportements et cesse d'être une tranche verticale.

## Fichiers lus
`src/features/moteur-acteurs/specification.json` (entier) ; `.claude/raffinage/moteur-acteurs-cadrage/tour1-pm-produit.md` ; `.claude/raffinage/moteur-acteurs-cadrage/tour2-{narratif-ia,tech-lead}.md` ; `src/brain/dossier/commandes.ts` (entier) ; `src/brain/CopiloteService.ts` (grep signatures) ; `src/brain/dossier/__fixtures__/dossier-reference.json` (grep `fonction`/`apparence`/`presence`).
