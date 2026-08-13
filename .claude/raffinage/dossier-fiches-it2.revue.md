# Revue d'itération — `dossier-fiches` · itération `2`

> Exécutée le 2026-08-12 · plan : `.claude/raffinage/dossier-fiches-it2.plan.md` (validé)
> Exécution : **séquentielle**, 2 lots (contrat seul et en premier, puis feature). Aucun essaim, aucun worktree, aucune fusion.
> Vérification : `qa` en mode B, contexte neuf, sondes de mutation **rejouées** plutôt que prises sur parole.

## En une ligne

**L'auteur peut écrire l'identité de son personnage** — sa fonction, son apparence, ce que le joueur en sait — dans le bloc « Identité » de l'accordéon de sa fiche ; et l'écriture a cessé d'être muette : un dossier disparu sous ses pieds le lui dit désormais, sous la fiche du personnage en cause.

## Critères — un par un, avec sa preuve

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Les trois proses persistent au blur ; un champ vide n'écrit aucune clé | **VÉRIFIÉ** | `identite: les trois proses persistent au blur` — 2 `update`, `description_joueur` vide absent (`not.toHaveProperty`), et vider un champ **déjà rempli** retire la clé |
| 2 | Lecture au montage, sans interaction, sur DEUX personnages, seconde entité atteinte par clic (BUG-064) | **VÉRIFIÉ** | `lecture au montage sur DEUX personnages, sans interaction (BUG-064)` — valeurs lues sur disque depuis les fixtures du lot 1, donc infabricables par le composant ; absence croisée assertée (`queryByDisplayValue(...).toBeNull()`) |
| 3 | Écriture indexée : seul le personnage sélectionné change (KR-197) | **VÉRIFIÉ** | `ecriture sur DEUX personnages, aucune fuite d indexation` — **sonde rejouée par le QA** : muter `personnageAffiche.id → personnages[0].id` fait rougir **exactement** ce test (1 sur 15) |
| 4 | Dossier supprimé ailleurs → `{statut:'absent'}` rendu visible, pas avalé | **VÉRIFIÉ** | `dossier supprime pendant l edition: bandeau, pas de silence` — second `createBrain()` sur le même stockage, `remove()`, blur. **Aucun mock du service** |
| 5 | Accordéon à 8 emplacements, 2ᵉ éditable, 6 placeholders recalés (3/4/5×3/6) | **VÉRIFIÉ** | `six placeholders recales` — `toHaveLength(6)`, décomptes `1/1/3/1`, les 8 titres vérifiés un par un |
| 6 | Les trois chemins valent `'ia'` (assertion sur la valeur) et sont instanciés dans les DEUX fixtures | **VÉRIFIÉ** | `les trois proses d identite sont ia et instanciees dans les DEUX fixtures` — **sonde rejouée par le QA** : muter une destination en `'moteur'` fait rougir sur la **valeur** |
| 7 | Les 6 personnages de la référence restent acceptés, sans erreur ni avertissement neuf | **VÉRIFIÉ** | `le dossier de reference ne produit ni erreur ni avertissement` — **ce test n'existait pas** au premier passage : le QA avait dû le prouver par une sonde jetable, il est désormais nommé. Message d'échec **nommant** l'avertissement (`texte-trop-long → canon.mj — Canon (MJ)`), prouvé discriminant en gonflant `canon.mj` au-delà du budget |
| 8 | `lint` + `tsc` à zéro ; les 9 sections non livrées gardent leur état vide (KR-187) | **VÉRIFIÉ** | `tsc --noEmit` exit 0 · `npm run lint` 0 erreur · `dossierEditorScreen.test.tsx` (62 tests) vert **sans modification** · aucun import croisé, aucune couleur en dur (grep) |

**Deux propriétés qui n'étaient pas des critères numérotés mais que le plan exigeait, et qui manquaient au premier passage** — refermées après le contrôle QA :

| Propriété | Verdict | Preuve |
|---|---|---|
| KR-197 — indexation d'**AFFICHAGE** du bandeau | **VÉRIFIÉ** | `bandeau de refus: un refus sur un personnage ne s affiche pas sous un autre` — sonde : remplacer le filtre par `refus !== null` fait rougir **ce test seul** |
| KR-197 — indexation d'**INVALIDATION** du bandeau | **VÉRIFIÉ** | `bandeau de refus: une ecriture reussie sur un autre personnage n efface pas le refus` — sonde : effacer inconditionnellement à tout succès fait rougir **ce test seul** |

## Diff par lot — comparé à la liste du plan

**Lot 1 `contrat-identite-personnage`** — 5 fichiers annoncés, 5 touchés, aucun en trop :

`src/brain/dossier/types.ts` · `destinations.ts` · `__fixtures__/dossier-minimal.json` · `__fixtures__/dossier-reference.json` · `couverture.test.ts`

**Lot 2 `bloc-identite-et-issue-d-ecriture`** — 3 fichiers annoncés, 3 touchés, aucun en trop :

`src/features/dossier-fiches/components/PanneauPersonnages.tsx` · `components/FichePersonnage.tsx` · `tests/panneauPersonnages.test.tsx`

Hors lots : `src/features/dossier-fiches/specification.json`, écrit par l'orchestrateur au raffinage (boucle de mémoire), plus les documents de raffinage.

**Six fichiers de plus, ajoutés APRÈS la revue de PR — élargissement assumé, hors du plan** : `src/features/dossier-canon/components/{PanneauLieux,ObjectifsCanon,FicheLieu}.tsx`, leurs deux fichiers de tests, et un module local neuf `src/features/dossier-canon/utils/refusMessages.ts` (`EYEBROW_REFUS` + `TEXTE_ABSENT` — entre features la redéclaration reste non négociable, **à l'intérieur** d'une feature c'est une divergence de typo qui attend). `RefusLieu` est élargi à `{statut, issues}` et `FicheLieu` rend les deux cas, comme `FichePersonnage` : sans ça le bandeau d'absence de `PanneauLieux` restait une **troisième** forme du même objet. Motif de l'élargissement : le `tech-lead` a relevé, hors de son propre périmètre, que le no-op muet sur `statut:'absent'` que cette itération vient de fermer pour les personnages **vivait encore à l'identique** dans `dossier-canon` — et que les deux `handleAjouter` y portaient le même défaut d'indexation que BUG-066. Une classe fermée d'un côté et laissée de l'autre est **pire que rien** : elle donne l'illusion du traitement. Voir BUG-067 (`bug_history.dossier-canon.json`).

**Interdits du plan, chacun vérifié par grep et non par confiance** : zéro ligne de `BUDGETS_DE_MOTS` · `tables.ts`, `validate.ts`, `validate.test.ts`, `suffisance.test.ts`, `issues.ts`, `read.ts`, `sections.ts`, `brain/index.ts` **non touchés** · `'monde.personnages[].nom': 'auteur'` inchangée (KR-195) · aucun `setX(resultat.warnings)` (KR-189) · aucun `jest.spyOn(dossiers,'update')` · `BlocIdentite.tsx` non créé.

## Ce qui a été refusé — et pourquoi (ce qu'un diff ne dit pas)

- **Le budget de mots sur les trois proses** (`BUDGET_MOTS_PROSE_PERSONNAGE = 60`, 3 lignes de `BUDGETS_DE_MOTS`). Proposé au tour 1 par `narratif-ia`, **retiré par lui-même au tour 2** : `destinations.ts` porte déjà **huit** chemins de prose `ia` livrés sans budget, dont deux — `canon.ton`, `canon.interdits_ton[]` — **toujours chargés**, donc plus lourds par tour que n'importe quelle fiche. Borner les 9ᵉ–11ᵉ donnerait un instrument qui avertit à 61 mots sur `apparence` et se tait sur un `ton` de 900 : le silence cesserait de signifier « sous budget ». Veto `pm-produit` (périmètre) convergent. *Fait notable du raffinage : `tech-lead` et `narratif-ia` ont **échangé leurs positions** entre les deux tours — l'argument de fréquence d'injection a fait tomber le précédent `Lieu` que `tech-lead` invoquait, juste avant que `narratif-ia` ne retire sa propre proposition pour un motif plus fort que l'objection qu'il combattait.*
- **Un critère sur la branche `statut:'refuse'`.** La branche est **construite** (elle vient de l'union du service) mais n'a **ni critère ni mock** : un `jest.spyOn(dossiers,'update').mockReturnValue({statut:'refuse'})` prouverait le rendu du bandeau, jamais qu'un auteur peut l'atteindre. Aucun champ de cette itération ne peut la produire — prose optionnelle, aucune règle de forme.
- **`BlocIdentite.tsx`.** Proposé conditionnel par `tech-lead` au tour 1, retiré par lui-même au tour 2 : `FichePersonnage.tsx` est à 317 lignes contre un seuil KR-112 à 400. Une extraction à un seul appelant est la dette habituelle du dépôt.
- **La règle durable « toute prose `ia` entrant au schéma entre avec sa ligne de budget »**, proposée en KR neuf : retirée par son auteur — une règle que huit chemins livrés violent déjà se désactive dans le mois.
- **Le retrait d'un personnage** : ne sert pas la démo, et surtout aucun retrait n'est refusable au SSOT aujourd'hui — le bouton arriverait avec un chemin d'échec intestable.

## Ce qui a été reporté — et où

| Report | Destination | Motif |
|---|---|---|
| Budget de contexte des **onze** chemins de prose `ia` (8 livrés + 3 entrants) | n° 10 (les nombres) · n° 7 `dossier-controles` (le rendu) | Un seul balayage, jamais 3 bornés sur 11. Rien d'irréversible n'est perdu à attendre : un budget est un avertissement **non bloquant**, il ne touche pas `schema: 1` et n'exige aucune migration |
| Retrait d'un personnage | **it5** | `relations[].cible_id` (it5) est la première référence qui rend le refus de retrait réel — le bouton y arrive avec sa preuve |
| Contradiction prose ↔ caractéristique (`apparence` « très fort » vs `stats.FO`) | n° 10 | Le modèle ne voit jamais `FO` : c'est une dérivation de libellé, propriété de l'assembleur |
| Destination de `Entite.nom` (KR-195) | n° 10 | Question transverse aux 8 collections nommées ; la basculer pour les seuls personnages casserait la symétrie |

## Écarts assumés

1. **`nom` suit désormais « vide ⇒ aucune clé ».** Le champ est unifié sous `ChampTexte` avec les trois proses ; l'ancien `handleBlurNom` écrivait `nom: ''`, le nouveau retire la clé. **Non écrit au plan**, signalé par l'ouvrier et examiné par le QA : `localiserEntite` traite `nom` absent et `nom: ''` **identiquement** (`nom.trim() !== ''` filtre déjà la chaîne vide), donc liste et titre rendent le même repli « (sans nom) » dans les deux cas. Aucun test existant ne contredisait l'ancien comportement. Aligne `nom` sur l'idiome déjà posé pour `objectif_id` en it1. **Acceptable, pas une régression déguisée.**
2. **Trois ajouts de rédaction dans le lot contrat** (en-tête de `types.ts`, docstring de `Personnage`, docstring de `PROSE_D_ENTITE_LIBRE` passant de « TROIS proses de `Lieu` » à « SIX proses d'entité ») — internes aux fichiers du lot, exigés par la cohérence de l'écrit : sans le troisième, le commentaire devenait faux le jour même où la constante gagne trois clés.
3. **`import type { DossierIssue }` ajouté dans `couverture.test.ts`.** `issues.ts` est hors périmètre **en modification** ; il n'est qu'importé. L'alternative aurait été un type structurel dupliqué à la main — exactement la seconde source de vérité que ce fichier existe pour interdire.
4. **Dé-duplication de la lecture de la fixture de référence** dans `couverture.test.ts` (`documentDeReference()`), les deux lectures inline passant sur le helper ; la docstring de `CHEMIN_REFERENCE` disait « lue ici que par l'assertion qui l'exige », au singulier — mise au pluriel, elles sont trois.

**Aucun blocage non résolu.**

## Porte qualité

| Instrument | Résultat |
|---|---|
| `npx tsc --noEmit` | **exit 0** |
| `npm run lint` | **0 erreur**, 1 avertissement préexistant hors périmètre (`src/player/components/CharacterCreationScreen.tsx:35`) |
| `npx jest` | **65 suites / 65 · 903 tests / 903** (889 avant l'itération) |
| `npm run test:mutation` | **sans objet** — confirmé par `git diff --name-only` : aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) n'est touché |
| Table dorée | **sans objet** — aucun registre couvert (`BESTIARY`, `CHALLENGE_TIERS`, `CHARACTERISTICS`, libellés de `POSTURES`) n'est touché |
| KR-112 | `PanneauPersonnages.tsx` **443 l.** — le correctif de BUG-066 a fait **franchir le seuil de signal** (400). Laissé tel quel : KR-112 fait de 400 un *signal*, de 800 un *bloqueur*, et l'extraction du hook `useEcriturePersonnage` est déjà un lot réservé au raffinage d'it3 — l'improviser en fin d'itération est exactement la dette que ce dépôt paie ailleurs. `FichePersonnage.tsx` 317 l. · `ObjectifsCanon.tsx` **467 l.** (était **déjà à 413 avant ce lot** — signal franchi antérieurement, pas par cette itération) · `PanneauLieux.tsx` 364 l. |
| KR-013/113 (état dérivé) | grep de l'auto-revue sur `src/features/dossier-fiches/` : **aucun site** |

## Budget de contexte — relevé du 2026-08-12 (définition de fini)

`wc -c`, plafonds de `docs/WORKFLOW.md` § Budget de contexte. **Tout est sous plafond, mais la marge est mince partout** — ce qui est le fonctionnement attendu d'un cliquet, pas une alerte.

| Fichier | Mesuré | Plafond | Marge |
|---|---:|---:|---:|
| `CLAUDE.md` + `docs/WORKFLOW.md` (couple) | 45 868 o | 45 kio | 212 o |
| `code-knowledge.json` | 76 401 o | 75 kio | 399 o |
| `bug_history.json` | 10 234 o | 10 kio | **6 o** |
| `features_history.json` | 15 344 o | 15 kio | 16 o *(intouché — la feature n'est pas terminée)* |
| `specification.json` (max : `dossier-format`) | 66 324 o | 65 kio | 236 o |
| `docs/ROADMAP-BASCULE-IA.md` | 35 355 o | 35 kio | 485 o |

`bug_history.json` a été **scindé dans ce lot-ci** au franchissement (12 124 o avant), puis **refranchi une seconde fois** en accueillant BUG-065/066/067, et ramené sous le plafond non par une scission (aucun axe ne s'appliquait — les trois défauts appartiennent à la feature vivante) mais par un **resserrement d'écriture** : le récit du comité part à cette revue, le fichier garde symptôme, cause, correctif, règle et tests nommés. Mesure finale : **10 234 o pour 10 240 — six octets de marge**. it3 le franchit à sa première entrée : **sa scission se décide à son raffinage**, pas à sa livraison. `specification.json` de `dossier-fiches` est à 49 488 o, loin du plafond.

## Ce que personne n'a vérifié

- **La branche `statut:'refuse'` du bandeau** est construite et jamais exercée : aucun champ de cette itération ne peut la produire. Elle deviendra démontrable **sans réécriture** dès qu'un champ contraint entrera (it3+).
- **Le poids réel en contexte** des trois proses (n° 12 : un appel par PNJ qui parle) : aucun instrument du dépôt ne le mesure. C'est l'objet du report n° 10 / n° 7.

## `RETOUR-COMITÉ`

1. **Le pari du plan sur KR-190 s'est vérifié.** « Une tranche de prose pure ne touche ni `tables.ts` ni `validate.ts` » : mesuré, le lot contrat n'a touché que `types.ts`, `destinations.ts`, les deux fixtures et `couverture.test.ts` — zéro ligne dans les quatre fichiers annoncés hors périmètre. **KR-190 borne le pire cas, il ne prescrit pas la liste** ; un plan qui recopie « les 8 fichiers » sans mesurer invite le `dev-contrat` à inventer du travail pour remplir la liste. C'est exactement ce que l'objection `tech-lead` du tour 1 a évité.

2. **La leçon coûteuse : une propriété transverse à deux comportements exige un test nommé pour CHACUN.** Le lot 2 a livré les deux gardes d'indexation du bandeau (KR-197) et l'a écrit dans son compte rendu — mais son seul test allumant le bandeau ne semait **qu'un personnage**, donc il serait resté vert avec les deux gardes supprimées. Une revendication de compte rendu n'est pas une preuve. C'est la 4ᵉ fois que cette classe se présente (BUG-056, BUG-061, BUG-063, ici) et **la première où elle est attrapée avant la livraison** — par le contrôle QA en mode B, pas par la porte, qui était verte. **Pour it3 : tout critère portant sur une propriété à deux moitiés s'écrit en deux critères, ou porte explicitement « prouvé séparément » dans son libellé.**

3. **Le seuil KR-112 est franchi : `PanneauPersonnages.tsx` est à 443 lignes** (396 à la fin des lots, seuil de signal 400 — les 47 lignes qui l'ont fait franchir sont **toutes** venues des correctifs de revue). Il ne l'a pas été par it3 comme on l'anticipait, mais par les correctifs de sa propre revue — ce qui dit la vraie leçon : la marge d'un fichier se consomme aussi par les corrections, pas seulement par les fonctionnalités. Rien n'est extrait dans ce lot (400 est un signal, 800 le bloqueur, et `ObjectifsCanon.tsx` vivait déjà à 413 avant). La découpe (un hook `useEcriturePersonnage` extrayant brouillon + commit + refus du panneau) doit être **actée au raffinage d'it3**, comme un lot déclaré, pas découverte à l'auto-revue. C'est un travail de structure, pas un correctif : il ne doit pas être improvisé par un ouvrier à court de place.

4. **La classe KR-197 s'est présentée QUATRE fois dans cette seule itération — et deux fois comme correctif d'elle-même.** (i) les deux indexations codées mais prouvées par aucun test (BUG-065, trouvé par la QA) ; (ii) le refus d'un ajout indexé sur un identifiant jamais persisté (BUG-066, trouvé par la revue de PR) ; (iii) la même chose dans les deux `handleAjouter` de `dossier-canon` (BUG-067) ; (iv) **le correctif de (ii) faisant servir l'ancre aux deux indexations à la fois**, si bien qu'un ajout *réussi* effaçait un refus non résolu — trouvé au second tour de revue de PR. Ce qui se répète n'est pas l'erreur, c'est sa **forme** : un identifiant qui répond à deux questions différentes (« sous qui ce refus s'affiche-t-il ? » et « quel succès l'efface-t-il ? ») et qu'on n'a séparées qu'après avoir échoué trois fois. **Pour it3 : quand une valeur sert deux rôles, elle porte deux noms, ou elle voyage par deux paramètres.** C'est plus fort que « écrire deux critères » (leçon n° 2) : c'est la parade côté code, là où la leçon n° 2 est la parade côté plan.

5. **Deux lots séquentiels valent mieux qu'un essaim quand les fichiers sont couplés.** Les trois candidats à un 3ᵉ lot (recalage des placeholders, bandeau, retrait) nommaient tous les deux mêmes fichiers ; les séparer aurait exigé un contrat extrait à un seul appelant. Le découpage **révèle** le parallélisme, il ne le fabrique pas — et cette itération n'en avait aucun à révéler.
