---
description: Fait cadrer par le Tech Lead, puis implémenter, l'outillage de vérification manquant — score de mutation sur brain/ et règles de lint des invariants.
argument-hint: (aucun)
---

Mise en place de l'outillage de vérification. **Ce n'est pas une itération produit** : pas de comportement utilisateur, pas de contrat de design, pas de narratif. Le comité ne siège pas — on n'en garde que le Tech Lead pour le cadrage et `dev-contrat` pour l'exécution.

## Étape 1 — cadrage par le Tech Lead

Lance le subagent `tech-lead` avec cette mission. Il est en lecture seule : il rend un plan, pas du code.

> Le dépôt vérifie aujourd'hui avec Prettier → `tsc` → ESLint → jest (jsdom + Testing Library). Deux instruments manquent. Cadre-les, sans installer de dépendance de production, et rends le plan au format `templates/plan-iteration.md` (§ 5 lots, § 7 tests, § 10 définition de fini) — un lot par instrument, listes de fichiers disjointes.
>
> **A — Score de mutation, périmètre `src/brain/` uniquement.**
> Justification à garder en tête : toute l'architecture repose sur « l'IA ne lance jamais les dés, le code les lance ». Un test vert sur une arithmétique fausse dans `combat.ts` ou `xp.ts` est le défaut le plus cher du projet, et aucun autre instrument ne le voit.
> - Runner jest, exécution **hors** de la porte de commit : un script dédié, appelé en fin d'itération.
> - Périmètre à muter : les règles — `challenge`, `combat`, `xp`, `characteristics`, `bestiary`. **Exclus** : les types, les fichiers de données pures, `index`, tout `src/features/**`, tout composant React. Justifie chaque exclusion en une ligne.
> - Mesure d'abord, seuil ensuite : lance une fois, lis le score réel, **puis** propose un plancher tenable et une marche de progression. Ne pose pas un seuil arbitraire à 80 %.
> - Rends la liste des **mutants survivants** trouvés au premier passage : c'est la vraie sortie de ce lot, plus que la config. Chacun est un test à écrire.
>
> **B — Règles de lint pour les invariants greppables.**
> Aujourd'hui ces règles vivent dans `CLAUDE.md` et dans la tête des agents ; elles doivent vivre dans ESLint. À couvrir :
> - aucun `window.localStorage` / `localStorage` dans `src/features/**` — tout passe par `PersistenceService` / `persistenceKeys.ts` (KR-011/111) ;
> - aucun import d'une feature vers une autre : `src/features/a/**` ne peut pas importer `src/features/b/**` ; seuls `src/brain/**` et les composants partagés sont autorisés ;
> - aucune valeur hexadécimale de couleur en dur dans `src/**/*.tsx` — uniquement des tokens `--*` ;
> - aucun `useEffect` d'état dérivé (KR-013/113) : si aucune règle ne le capture proprement, **dis-le** et propose une heuristique de revue plutôt qu'une fausse règle. Une règle qui produit du bruit sera désactivée dans le mois.
>
> Pour chaque règle : le mécanisme exact retenu, le message d'erreur en français, et le **nombre de violations existantes** dans le dépôt aujourd'hui. Si une règle casse du code existant, propose la marche : `warn` d'abord, `error` ensuite, ou une correction dans ce même lot si elle est petite.
>
> Contrainte transverse : aucune dépendance de production ajoutée, la porte de commit ne doit pas ralentir, et les scripts `npm` existants ne changent pas de sémantique — tu en ajoutes.

## Étape 2 — porte de plan

Applique la porte 1 de `/raffiner` (§ étape 5), réduite à ce qui s'applique : deux lots, fichiers disjoints, chaque règle avec son mécanisme et son compte de violations, seuils justifiés par une mesure et non par un chiffre rond. Puis **arrête-toi** et affiche la fiche de validation.

## Étape 3 — exécution

Après validation : `dev-contrat` sur le lot A, puis le lot B. Porte qualité verte à chaque fois. Ce sont des lots de configuration — ils ne touchent aucun fichier de feature, sauf les corrections explicitement listées et validées.

## Étape 4 — vérification avant commit

Les deux lots verts ne suffisent pas : un instrument qui ment est pire que pas d'instrument, et ceux qui l'ont écrit sont les moins bien placés pour le voir. Lance `qa` en **mode B**, contexte neuf, sur le diff non commité — plan + `git diff HEAD`, définition de fini item par item. Demande-lui explicitement de **ne croire aucun compte rendu** et de rejouer les portes lui-même. Fais-lui chercher les façons dont ce travail peut mentir, pas les façons dont il peut échouer :

- une neutralisation qui **déborde sur la logique** — un `disable` sans `restore`, une région qui couvre une valeur de retour de fonction, une neutralisation par fichier au lieu de par mutateur ; à vérifier dans le rapport JSON brut, pas dans la revue ;
- une **table dorée qui recopie une valeur fausse** — elle fige alors le bug au lieu de le verrouiller ; comparaison champ à champ contre la source, par script indépendant ;
- une **règle de lint qui ne détecte pas ce qu'elle annonce**, ou qui bruite ; sondes de faux négatif **et** de faux positif.

Corrige tout ce qui bloque, puis présente le verdict à l'humain. Rien n'est commité avant son approbation.

## Étape 5 — répercussion

Une fois vert, mets à jour :
- `CLAUDE.md` — les invariants passés en lint ne sont plus des consignes de prompt, ils sont câblés ; dis-le en une ligne plutôt que de les répéter ;
- la définition de fini de `templates/plan-iteration.md` si les noms de scripts diffèrent ;
- la skill `raffinage-iteration`, tableau des instruments : statut « à adopter » → « en place ».

## Cette commande est à usage unique

Les deux instruments ci-dessus sont écrits en dur, et l'étape 5 bascule leur statut à « en place » : une fois jouée, cette commande est consommée. **Jouée le 2026-08-02** — score de mutation (`npm run test:mutation`, `break: 80`) et les trois règles de lint sont en place, l'état de départ décrit à l'étape 1 n'existe plus.

Le tableau des instruments de `raffinage-iteration` porte encore une ligne **différée** : les specs navigateur pour le canevas (pan/zoom/glisser, disposition dagre) et la boucle de session du mode jeu. Quand elle s'ouvrira, ce sera une commande à réécrire sur ce patron — pas celle-ci à relancer.
