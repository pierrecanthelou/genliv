# Note tech-lead — tour 2 (contre-lecture) cadrage `moteur-interprete` (n°10)

**RÉPONSE À narratif-ia (tension 1)** — `docs/REGLES-PLAY.md` § J1, relu en entier : « un (1) pas d'horloge de session = une (1) commande de joueur ACCEPTÉE par le moteur » (tranché itération 2 de `moteur-dossier`), déjà verbe-agnostique — aucune commande n'y est nommée. Aucun texte à amender pour qu'`agir` consomme un pas ; la règle le couvre déjà telle quelle. Ce qui grossit réellement le lot est du code : `commandes.ts` (`agir`, arité 0, dans `COMMANDES` + `TRANSITIONS` — `Record<CommandeId, Transition>` exhaustif par compilation, vérifié dans le fichier) et un nouveau `brain/dossier/interprete.ts` (prédicats purs de re-résolution rang→id de la sortie R1, zéro import service), plus `brain/copilote/contexte/{interprete,narrateur}.ts` — sans eux `CopiloteService.demander()` ne compile pas pour ses deux rôles neufs. Lot contrat final : **9 fichiers (3N+6R)**, toujours seul, premier. `docs/REGLES-PLAY.md` n'en fait PAS partie, contrairement à ce que demandait narratif-ia.

**RÉPONSE À ux-designer (tension 3), durcie en objection** — `Chip` reste hors `brain/components/` à ce lot. Précédent exact, une itération plus tôt, même feature : `OutcomeBlock.tsx` porte dans sa propre docstring « KR-109 : ce composant reste dans `features/play-mode/components/` tant qu'il n'a qu'un consommateur. Un second, dans une autre feature, le ferait descendre dans `brain/components/` ». Un usage futur spéculatif (tags d'indices, feature non planifiée) n'est pas un second appelant nommé de cette itération. `Chip` part dans le lot feature.

**Tension 2** — L'unique exception à `moteurSansIA.test.ts` : `src/features/play-mode/hooks/useTourDeJeu.ts` (nouveau, même patron que `useSessionPersistee.ts` déjà présent dans ce répertoire), seul futur importeur de `CopiloteService`.

**Tension 4** — Compatible, avec une correction : la réécriture du test ne se fait PAS dans le lot contrat (liste d'exclusion vide, vacueuse) mais dans le lot feature qui crée `useTourDeJeu.ts` — la liste nommée et le mutant obligatoire s'y vérifient sur un fichier réel, jamais sur un nom promis.

**VERDICT** — Deux lots : contrat (9 fichiers) puis feature play-mode consommant le contrat figé. Toujours ≤4, pas de veto nouveau.

---

## Annexe — table des lots révisée (hors quota)

| Lot | Type | Fichiers (N=nouveau, R=remplace) | Interface exposée/consommée |
|---|---|---|---|
| 1 | **contrat**, seul, premier | N `src/brain/dossier/interprete.ts` · N `src/brain/copilote/contexte/interprete.ts` · N `src/brain/copilote/contexte/narrateur.ts` · R `src/brain/dossier/session.ts` (memoire?, EntreeJournal.recit?, optionnels à vie KR-251) · R `src/brain/dossier/commandes.ts` (verbe `agir`, arité 0) · R `src/brain/dossier/sessionDestinations.ts` · R `src/brain/CopiloteService.ts` (rôles `interprete`/`narrateur`, types `Cible*/Reponse*` disjoints de `personnage-plan`) · R `src/brain/copilote/schemaSortie.ts` · R `worker/index.ts` (2 entrées `INVITES`) | Expose : `CopiloteService.demander('interprete'\|'narrateur', …)`, `Commande` (rangs→id résolus), `SortieInterprete`, `EtatSession.memoire`/`journal[].recit`. Consomme : rien (racine du contrat). |
| 2 | feature (play-mode), séquentiel après lot 1 | N `src/features/play-mode/hooks/useTourDeJeu.ts` · N `src/features/play-mode/components/PlayerInputBar.tsx` · N `src/features/play-mode/components/Chip.tsx` · R `src/features/play-mode/components/EcranPartie.tsx` · R `src/features/play-mode/tests/moteurSansIA.test.ts` (balayage par fichier, exclusion nommée = `useTourDeJeu.ts`, mutant obligatoire) | Consomme : le contrat du lot 1, figé. Expose : rien de plus loin (feuille de l'arbre d'appel). |

Aucun fichier partagé entre les deux lots — propriété exclusive tenue.

## Décisions prises en autonomie faute de spécification

- Amendement de `docs/REGLES-PLAY.md` § J1 pour `agir` → j'ai choisi : aucun amendement (règle déjà verbe-agnostique, vérifiée texte en main) → si c'est l'inverse (amender quand même), le coût est un lot contrat qui touche un `.md` sans ajouter de garantie, et un précédent qui fait croire que KR-130 exige une réouverture de doc à chaque verbe ajouté alors que la généricité de la règle est justement ce qui l'évite.
- Domicile de `Chip` (`brain/components/` vs feature-local) → j'ai choisi feature-local, précédent `OutcomeBlock`/KR-109 → si c'est l'inverse (transverse dès ce lot), le coût est une primitive sans second appelant réel — exactement le biais d'abstraction prématurée que je dois surveiller, et une dette KR-109 ouverte dans le sens inverse de sa doctrine écrite.
- Fichier exact portant l'exception `moteurSansIA.test.ts` → j'ai choisi (approximatif, nommé) `useTourDeJeu.ts` dans `play-mode/hooks/` → si l'appel IA finit par se loger directement dans `EcranPartie.tsx` plutôt que dans un hook dédié, la liste d'exclusion de QA doit suivre et `EcranPartie.tsx` grossit plus vite vers la limite KR-112 (400/800 lignes).
- Moment de la réécriture de `moteurSansIA.test.ts` (lot contrat vs lot feature) → j'ai choisi lot feature, confirmé depuis tour 1 → si c'est l'inverse (réécrit dans le lot contrat avec liste vide), le test traverse un état transitoire où l'exclusion nommée ne pointe vers aucun fichier réel — une exception ajoutée en avance de phase deviendrait invisible à la revue de mutant.

## Fichiers vérifiés pour cette note (chemins absolus, en plus de ceux du tour 1)

- `src/brain/dossier/commandes.ts` (entier — `COMMANDES`, `TRANSITIONS: Record<CommandeId, Transition>` exhaustif par compilation, docstring sur la reconstruction du texte de journal jamais un écho de la saisie)
- `src/features/play-mode/tests/moteurSansIA.test.ts` (entier — balayage actuel par 3 racines fixes, zéro exclusion, plancher par racine)
- `docs/REGLES-PLAY.md` (§ J1 entier, lignes 188-194 — règle déjà verbe-agnostique)
- `src/features/play-mode/components/OutcomeBlock.tsx` (docstring KR-109, précédent direct pour le domicile de `Chip`)
- Glob `src/features/play-mode/**/*.ts*` (confirme `hooks/useSessionPersistee.ts` comme seul hook existant — patron de nommage pour `useTourDeJeu.ts`)
- Glob `src/brain/copilote/contexte/*.ts` (confirme les 8 fichiers existants — précédent pour `interprete.ts`/`narrateur.ts` neufs)
