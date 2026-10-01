# Cadrage n°11 `moteur-arbitre` — Tour 1 — PM Produit

## RISQUE
L'intention telle qu'écrite masque un prérequis muet : aucun héros n'existe dans `EtatSession` (`src/brain/dossier/session.ts`). Traitée comme une seule itération, « voir le dé lancé » entraînerait de facto un lot géant (création du héros + panneau de dés + arbitre + XP), violant KR-249 (un champ n'entre qu'avec son écrivain ET son lecteur réels dans la MÊME itération, jamais préposé par avance) et la règle « squelette d'abord ».

## OBJECTION
La phrase de démo fournie omet ce que `docs/REGLES-PLAY.md` § A nomme pourtant explicitement comme propriété de la n°11 : « +5 PE par changement de lieu » (A4), qui ne peut exister avant que `EtatSession.heros` existe — le texte cite ce fait lui-même (« l'ouvrir ici violerait KR-249 »). Une itération qui ignorerait ce prérequis livrerait un jet résolu pour un joueur sans héros à qui l'attribuer : pas une tranche verticale, une fiction.

## PROPOSITION
Trois itérations, dans l'ordre où le roadmap les annonce déjà (`n: 3`, ligne 159 de `docs/ROADMAP-BASCULE-IA.md`) :

- **IT1 — le héros existe.** Repointage de l'écran de création déjà conservé (`player/engine/heroGen.ts`, `charCreation.ts`, `CharacterCreationScreen`, § 0 bis du roadmap — réutilisés, pas réécrits) vers `EtatSession.heros` (écrit ET lu dans le même lot, via `HeroStatusBar`, également déjà conservé). La règle A4 (+5 PE au déplacement, `commande.aller`) s'attache ici : c'est la première itération où `heros.PE` existe, et REGLES-PLAY.md nomme cette itération comme sa seule propriétaire possible. Aucun jet, aucune IA d'arbitrage.
- **IT2 — le dé.** Un danger de lieu (`monde.lieux[].dangers`, prose auteur jamais injectée avant cette feature) déclenche R2, qui rend `{carac, tc, pourquoi, enjeu_reussite, enjeu_echec}` ; le joueur voit la carte, clique « lancer », `resolveChallenge` (déjà pur, `challenge.ts`) résout avec `rng` seedé par `graine_alea` — première consommatrice réelle, posée sans lecteur depuis l'itération 1 de `moteur-dossier` — et R3 (déjà existant depuis n°10 it2, 8e branche de `CopiloteService`) narre l'issue + la marge. C'est la phrase du roadmap, mot pour mot, sans rien d'autre.
- **IT3 — l'XP.** `challengeXp`/`deltaBand` (déjà purs, `xp.ts`) créditent le héros depuis l'issue et la marge produites par IT2, visible quelque part (barre de statut ou journal), calculé par le code seul — jamais l'IA.

**Hors périmètre**, explicitement : la boutique de progression (dépense de l'XP, `XpShopScreen`) — écran séparé, question d'accès F2 de `REGLES-PLAY.md` non tranchée, ouvrirait un second vertical dans la même feature ; `combat.ts`/`combatEngine.ts` — propriété n°13, malgré une ligne de la dette § 2 bis (`docs/ROADMAP-BASCULE-IA.md` § « dette à déclencheur », ligne « Égalité d'AT × compteur de Garde aiguisée ») qui les rattache par erreur au déclencheur « n°11 » : c'est n°13 qui écrira la boucle de round de `combatEngine.ts`, pas cette feature — incohérence relevée sans être tranchée ici.

## VERDICT
Recevable sous réserve : uniquement si découpée en ces 3 itérations numérotées, IT1 raffinée en premier. En l'état d'une seule itération monolithique, c'est un veto (couche horizontale non démontrable en une phrase, hors squelette d'abord).

---

## Décisions prises en autonomie faute de spécification

- Le nombre et la frontière exacte des itérations n'étaient pas tranchés → alignement sur les 3 itérations déjà pré-annoncées par `docs/ROADMAP-BASCULE-IA.md` ligne 159 (`moteur-arbitre`, `n: 3`), découpées héros → jet → XP → sinon le nombre affiché au roadmap devient faux avant même le premier `/raffiner`, ou une 4e itération naît pour une règle d'une ligne.
- Le rattachement de la règle A4 (+5 PE au changement de lieu) à IT1 plutôt qu'à une itération séparée → rattaché à IT1 parce que `REGLES-PLAY.md` § A nomme explicitement `commande.aller`/n°11 comme seul propriétaire possible et qu'elle ne peut exister avant que `heros` existe → sinon une 4e itération naît pour une règle qui ne produit aucune démo propre.
- L'inclusion ou non de la boutique de progression → exclue parce que `REGLES-PLAY.md` F2 est une question d'orchestration ouverte, non résolue par cette feature, et qu'ouvrir `XpShopScreen` ajouterait un second vertical → sinon IT3 dépasse le format squelette et sa phrase de démo prend un second « et ».
- L'articulation R1/R2 (comment le code décide qu'un danger déclenche un jet, `lieux[].dangers` étant de la prose libre, pas une expression structurée) → volontairement laissée ouverte pour le tech-lead et narratif-ia au raffinage d'IT2, sans la trancher ici ni gonfler IT2 en attendant.

## Fichiers consultés
`docs/ROADMAP-BASCULE-IA.md`, `docs/REGLES-DU-JEU.md` (§5, lignes 190-233), `docs/REGLES-PLAY.md` (§A, B, F, G en entier), `src/brain/xp.ts`, `src/brain/dossier/types.ts` (champ `dangers`, ligne ~985), `src/brain/copilote/contexte/narrateur.ts` (lignes 57-75, audience fermée `dangers`), `src/features/moteur-interprete/specification.json` (précédent de découpage 4 itérations), `code-knowledge.json` (KR-230, KR-249, KR-261—KR-275), `.claude/skills/raffinage-iteration/SKILL.md`.
