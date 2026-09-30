# Revue de clôture — `moteur-interprete` · itération 4 (dernière, feature TERMINÉE 4/4)

> Plan : `.claude/raffinage/moteur-interprete-it4.plan.md` (validé 2026-09-30)
> Exécution : séquentielle, 1 lot unique (`dev-contrat`), aucun worktree, aucun lot feature
> Vérification : relecture indépendante de l'orchestrateur (lecture complète du code livré + porte qualité rejouée)
> Porte qualité finale : `npx tsc --noEmit` vert · `npm run lint` vert (1 avertissement préexistant sans lien) · `npx jest --maxWorkers=2` 124 suites / 2094 tests, tous verts

## En une ligne

L'auteur voit la narration se raccourcir — jamais un refus complet — plutôt que d'attendre indéfiniment quand le budget de contexte par pas est dépassé ; avec cette itération, `moteur-interprete` (n°10) est **TERMINÉE (4/4)**.

## Critères d'acceptation (§ 6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Cascade P1→P4, premier palier qui tient retenu | **VÉRIFIÉ** | I3, I4, I8, mutants M3, M4, M8 |
| 2 | Au-delà de P4 : `trop-long` avant fetch, message fixe inchangé | **VÉRIFIÉ** | I9, I11, mutant M9 |
| 3 | `condensation` reflète ce qui est réellement envoyé | **VÉRIFIÉ** | I1, I2, mutants M1, M2 |
| 4 | Suffixe d'état (hors `EN SA POSSESSION`) identique octet pour octet P0-P3 | **VÉRIFIÉ** | I5, mutant M5 |
| 5 | P4 : jamais vide, objet du pas courant toujours inclus | **VÉRIFIÉ** | I8, I9, I10, mutants M8-M10, M13 |
| 6 | Aucun champ écrit, cascade recalculée à chaque appel | **VÉRIFIÉ** | I7, I12, mutants M7a, M7b |
| 7 | R1 (`interprete.ts`) ne reçoit aucune garde de budget | **VÉRIFIÉ** | lecture directe : fichier non touché, commentaires `worker/index.ts:779` et `frontiere.test.ts` corrigés |
| 8 | `ETABLI` et `suggestions[]` jamais un levier | **VÉRIFIÉ** | mutant M12, lecture directe (aucun changement de schéma/invite) |

**8/8 critères vérifiés.**

## Diff (lot unique, conforme au § 5 du plan)

3 fichiers modifiés exactement : `src/brain/copilote/contexte/narrateur.ts`, `src/brain/copilote/contexte.test.ts`, `worker/index.ts` (commentaire seul). Aucun fichier hors de cette liste — **aucun fichier `play-mode/` touché**, `interprete.ts` non touché, `memoire.ts` non touché, aucune signature de service changée, confirmé par lecture directe. En plus du lot, corrigé par l'orchestrateur : `worker/frontiere.test.ts` (même commentaire périmé que `worker/index.ts:779`, signalé hors lot par `dev-contrat`). Artefacts légitimes hors lot : `specification.json`, `code-knowledge.json`, `features_history.json`, `docs/ROADMAP-BASCULE-IA.md`, `CHANGELOG.md`, `package.json`, le plan et ses 10 notes de tour.

## Ce qui a été refusé (REJETÉ du registre)

- **Nommer un KR-274 « message fixe au-delà du dernier palier »** (proposition QA, tour 1) — rejeté : déjà couvert par KR-230/`design_contract` existant (rejeu-un-coup puis message fixe), devient un critère d'acceptation testé (§6 #2), pas un principe nouveau à numéroter. Les KR-274/275 effectivement créés portent sur autre chose (voir § Ce qui a été retenu).
- **Fusion de KR-261 en une formule partagée entre R1 et R3 cette itération** (proposition tech-lead, tour 1) — reportée : le plan P1-P4 ne touche pas R1, aucun consommateur réel de budget pour ce rôle cette itération (KR-266/268 étendu).
- **Emplacement de la logique de palier dans `memoire.ts`** (proposition conditionnelle tech-lead, tour 2) — rejeté par narratif-ia (tour 2) : `memoire.ts` reste un module de projection pure (contrat gelé it3), y ajouter un budget en caractères d'un rôle particulier ferait dériver silencieusement `ETABLI`/`faitsPertinents`.

## Ce qui a été retenu — l'arbitrage central

**Troncature de `EN SA POSSESSION` — un retournement en deux tours, tranché par l'orchestrateur.** Tour 1 : le tech-lead propose `objets_possedes.slice(-K)` (K non mesuré) pour éviter qu'un joueur riche en objets ne bloque en permanence ; narratif-ia pose un veto absolu (« l'état n'est jamais un levier de budget », invariant I5 : suffixe d'état figé). Tour 2 : le tech-lead **retire** sa proposition et se range au veto, sans réserve. **Narratif-ia, dans la même note de tour 2 (tours parallèles, personne ne l'a vu venir), se retourne lui-même** : concède qu'un refus permanent en fin de partie est pire que l'omission, et conçoit le palier P4 dégénéré — suffixe ajusté AU BUDGET (jamais de K arbitraire), JAMAIS vide, objet du pas courant TOUJOURS inclus (I8-I10), ne joue qu'en tout dernier recours. Le PM, sans avoir vu ce P4, durcit alors SA propre objection en veto absolu contre « aucune troncature, jamais ».

**Arbitrage (tour 3, orchestrateur) : RETENU pour P4.** Motif : le veto du PM (et le veto initial de narratif-ia) visait un risque précis — le narrateur affirmant FAUSSEMENT l'absence d'un objet que le moteur dit possédé. P4 ferme structurellement ce risque : (a) l'invariant I9 garantit qu'aucun bloc vide n'est jamais envoyé quand le joueur possède quelque chose rédigé, et (b) la règle déjà écrite dans l'invite du rôle narrateur (`worker/index.ts` : « tu ne racontes aucune perte qu'il ne porte pas ») empêche le modèle de conclure à une absence, puisque `CE PAS` ne rapporte aucun delta de retrait pour un objet simplement écarté par dégradation. **Correction relevée en revue tech-lead (2ᵉ passage)** : la contrainte d'ancrage (`schemaSortie.ts`, un constat citant un rang non fourni est refusé) ne ferme PAS ce risque — elle ne lie que les CONSTATS structurés, jamais la NARRATION en prose libre ; seule (b) tient ce rôle. Le résidu honnête reste ouvert (voir `open_questions` de la spec) : `ETABLI` garde la prose des faits posés sur un objet que P4 écarte, et rien ne garantit absolument qu'un modèle n'en conclue jamais une absence sur cette seule base. L'omission résultante n'introduit pas une nouvelle classe de risque : le code omettait DÉJÀ silencieusement un objet sans `description_joueur` (précédent direct, jamais objecté). **Vérifié en code réellement livré** (pas seulement sur le papier du plan) : `narrateur.ts:559-572`, la boucle P4 décroît strictement depuis `possessions.length - 1` (le plein a déjà été essayé à P3) jusqu'à `suffixeMinimal`, et `suffixeMinimal` dérive du premier index désigné (pas un `max(1, …)` naïf) — exactement la propriété que l'invariant I10 exige.

Le risque résiduel mécanique (une résolution du moteur qui contredirait la narration) est dormant aujourd'hui (aucune commande ne cible un objet — `aller`/`agir` seuls) ; le résidu en prose (le modèle pourrait lire le sous-ensemble montré comme exhaustif) reste, lui, ouvert dès aujourd'hui — les deux sont nommés et deviennent un déclencheur explicite en `open_questions`.

## Ce qui a été reporté

- **Budget client de R1 (`interprete.ts`)** — aucune garde ajoutée. La dette nommée `worker/index.ts:779` (qui promettait sa fermeture par it4) est réassignée à la première itération qui touchera réellement R1, jamais fermée à tort.
- **Affichage du plafond « mode auteur »** (plan de cible §2.8 n°4) — aucune surface d'écran choisie, deux lignes `open_questions` distinctes (traçabilité PM/UX + risque résiduel narratif-ia), propriétaire `dossier-controles`.
- **Risque résiduel P4** (commande future ciblant un objet) — dormant, déclencheur nommé.

## Écarts assumés et corrections faites en cours d'itération

1. **Deux défauts de test auto-corrigés par la sonde de mutants, avant le rendu du lot, jamais exposés.** L'empreinte de session servant aux invariants I7/I12 était prise APRÈS la chaîne de canaris (qui avait déjà annoté la session) — mutant M7b restait vert ; corrigé en prenant l'empreinte avant tout assemblage. Le suffixe minimal de P4 n'était discriminant qu'avec un seul objet obtenu au pas (le seul objet désigné étant alors à la fois le premier ET le dernier) — mutant M13 ; corrigé en ajoutant un test à deux objets obtenus au même pas. **Non journalisés dans `bug_history.json`** : décision de l'orchestrateur, motivée par le budget serré de ce fichier (marge 61 o) et la faible portée généralisable de ces deux slips d'authoring de test, jamais exposés à une revue ni au code livré. Consigné ici pour traçabilité plutôt que forcer une entrée `bug_history.json` supplémentaire.
2. **Correction hors lot du commentaire périmé de `worker/frontiere.test.ts`** (même promesse fausse que `worker/index.ts:779`, « Fermeture nommée… it4 »), signalé par `dev-contrat` comme hors de son lot ; corrigé par l'orchestrateur dans la même passe de documentation (documentaire seulement, rien ne rougissait).
3. **`TAILLE_MAX_CORPS_IA` confirmé INCHANGÉ** (83 968 o) — vérifié par le lot ET par l'orchestrateur : la cascade ne renvoie jamais plus que `BUDGET_CARACTERES_NARRATEUR` (26 956, inchangé), donc le pire cas P0 reste le pire cas mesuré depuis it3.

## Budget de contexte

- **`code-knowledge.json`** : franchissait son plafond à 72 828 o (70 kio/71 680 o, +1 148 o) après ajout de KR-274/275. Compacté : mesure directe faite avant d'agir (pas recopiée d'un CHANGELOG passé) — les **20** entrées `dossier-format` étaient TOUTES encore en prose complète, aucune déjà compactée, malgré une mention `CHANGELOG.md` 0.7.7 (« six KR de dossier-format ») qui ne se retrouve pas dans l'état actuel du fichier (à réconcilier, non bloquant ici). Correction distincte, relevée en revue tech-lead : l'entrée compactée en it3 était KR-197 de `dossier-canon`, PAS `dossier-format` — cette revue le disait mal avant relecture. Les 20 entrées `dossier-format` (feature terminée du Temps 1, non lue par le raffinage de `moteur-interprete`) sont réduites ici à leur invariant portable + renvoi `Corps : spec dossier-format`. Mesure finale : **68 614 o**, marge ~3 066 o.
- `src/features/moteur-interprete/specification.json` : 60 278 o — sous son plafond (65 kio/66 560 o), marge ~6 282 o.
- `docs/ROADMAP-BASCULE-IA.md` : 30 497 o — sous son plafond (30 kio/30 720 o), marge **223 o seulement** — prochaine passe à surveiller de près.
- `features_history.json` : 18 782 o — sous son plafond (25 kio/25 600 o), marge confortable.
- `bug_history.json` : 15 299 o — **non touché cette itération**, marge inchangée à 61 o.
- Couple `CLAUDE.md` + `docs/WORKFLOW.md` : 46 077 o — **non touché cette itération**, marge inchangée à 3 o.

## Porte qualité

- `npx tsc --noEmit` / `npm run lint` : verts (1 avertissement préexistant sans lien, `CharacterCreationScreen.tsx`)
- `npx jest` (suite complète) : **124 suites / 2094 tests, tous verts** — mesure indépendante rejouée par l'orchestrateur après la passe de documentation complète (y compris la compaction de `code-knowledge.json`), pas seulement après le lot de code
- `npm run test:mutation` : **non déclenché** — aucun des 4 fichiers de règles de jeu n'est touché. 14 mutants nommés (M1-M13 + variantes) sur 12 invariants (I1-I12) vérifiés à la main par `dev-contrat` (rouge puis restauration comparée par `cmp`, jamais `git checkout`), voir § 7 du plan.

## RETOUR-COMITÉ

- **Un veto peut être answéré par une conception que son auteur n'a pas encore vue — l'arbitrage doit vérifier CE QUE le veto visait, pas seulement s'il tient au mot près.** Le PM a durci son objection contre « toute troncature » en réponse à la proposition tech-lead ORIGINALE (un K arbitraire) ; narratif-ia, en parallèle, avait déjà conçu une troncature d'une nature différente (ajustée au budget, jamais vide, garantie sur l'objet du pas). Lire le veto du PM au pied de la lettre aurait bloqué une solution qui répondait exactement à son motif déclaré. C'est la même classe de situation que le retournement `chroniqueur` d'it3 (RETOUR-COMITÉ de l'époque), mais ici le retournement et le durcissement se sont produits DANS LE MÊME TOUR PARALLÈLE, des deux côtés à la fois — signe que ce pattern n'est pas un accident isolé sur ce projet, et que l'arbitrage de tour 3 doit systématiquement se demander « le désaccord qui semble ouvert porte-t-il encore sur la MÊME proposition ? ».
- **Un invariant de « suffixe garanti » se teste avec au moins deux cibles simultanées, jamais une seule.** La cible unique est, par construction, à la fois la première ET la dernière désignée : un calcul faux (`max(1, …)` sans chercher l'index le plus à gauche) reste indiscriminable tant qu'un seul scénario est testé. Trouvé par la sonde de mutants de `dev-contrat` lui-même (mutant M13), pas par une revue extérieure — la discipline de « mutant écrit et vérifié rouge » a fonctionné exactement comme prévu, y compris contre son propre auteur.
- **Le budget de contexte de `code-knowledge.json` franchit son plafond à chaque itération qui ajoute 2-3 KR, avec un mécanisme de compaction toujours disponible (features terminées) mais jamais définitivement résolu.** Quatrième franchissement consécutif (it1 K261-267 sans franchissement documenté, it2, it3, it4) sur le même fichier. `dossier-format` n'a PLUS AUCUNE entrée non compactée après cette passe — cette réserve est épuisée. La prochaine réserve légitime sera `dossier-controles` (12 entrées, 5 850 caractères) ou `dossier-copilote` (8 entrées, 5 664 caractères) — à mesurer avant de compacter, ces deux features étant plus proches de features EN COURS (n°11 consomme `CopiloteService`) qu'une simple lecture par nom de feature ne le montre.
