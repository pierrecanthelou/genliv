# Cadrage n°11 `moteur-arbitre` — Tour 1 — QA

## RISQUE
La feature n°11 est le premier point d'injection d'un rôle IA (R2, « arbitre ») APRÈS l'exécution d'une commande. Elle doit introduire `EtatSession.heros` — première brique de l'état de personnage au moteur (KR-249, exemption nommée) — sans recourir à d'autres modules. Trois fragilités :
1. Le champ héros n'existe pas et son schéma n'est pas arbitré.
2. L'articulation entre R1 et R2 via `monde.lieux[].dangers` (audience narrateur, jamais injecté) reste floue : R2 propose-t-il en temps réel après arrivée sur lieu, ou R1 reçoit-elle des candidats de jet de départ ?
3. Le score de mutation : la clause « appeler sans modifier » n'a pas de réponse tranchée — toucher à `challenge.ts`/`xp.ts` déclenche-t-il, ou seule une modification ?

## OBJECTION (critique)
Le walking skeleton proposé est insuffisant : **sans R3 (narrateur) réel qui consomme `{issue, marge}` et raconte immédiatement**, la feature reste un aller-simple mécanique. Le précédent de n°10 (`moteur-interprete`, it2) est explicite : un verbe de commande n'entre que si son consommateur narratif existe dans la MÊME itération (KR-263). **Un jet qui ne reçoit aucun récit est un no-op** qui reste invisible au joueur — ce n'est pas un point d'appui stable pour des itérations futures. Cela implique que R3 doit être intégré (ou réellement branché) dès l'itération 1, non déféré.

## PROPOSITION

1. **Itération 1 doit brancher R3 de facto** : lot contrat pose R2 comme branche neuve de `CopiloteService.demander()`, et branche l'issue du jet dans le contexte que R3 (déjà existant depuis n°10) reçoit ; lot feature ajoute le Panneau de dés + l'orchestrateur qui appelle `resolveChallenge` puis déclenche R3.
2. **Question `dangers` → déclencheur de raffinage** : si R1 n'injecte pas `dangers` en it1, elle les ignore. Les déclencheurs de pièges/rencontres sont hors périmètre. Un lieu sans danger = pas de proposition de jet (nominal, pas d'erreur).
3. **Graine aléatoire (`EtatSession.graine_alea`)** : elle doit avancer d'un état par appel `resolveChallenge`. Deux jets sur le même lieu sans changer de nœud consomment deux états distincts (jamais rejoué). Test discriminant : deux dés lancés de suite produisent des résultats différents.
4. **Score de mutation** : appeler sans modifier = pas de déclic. Si l'itération touche UNE SEULE LIGNE de `challenge.ts`, `xp.ts`, `characteristics.ts`, le cliquet s'applique (`break` +5, plafond 90). Mesurer avant raffinage.

## VERDICT

**À TRANCHER AU RAFFINAGE AVANT ITÉRATION** :
- Schéma exact de `EtatSession.heros` (champs minimaux : niveau ? PV courant/max ? PE courant/max ? XP ? inventaire ?)
- Articulation R1/R2 sur `dangers` : silencieuse (R1 ignore) ou explicite (R1 et R2 en parleront dès que possible) ?
- R2 et le branchement de R3 : une ou deux itérations ?
- Quelle structure exacte R2 rend pour un jet demandé : `{carac, tc, pourquoi, enjeu_reussite, enjeu_echec}` — tous requis ? Types ?

**DÉFINITION DE FINI ITÉRATION 1 (proposée, squelette)** :
- Lot 1 **contrat** :
  - `EtatSession` gagne le champ `heros` (type à définir, audience)
  - `CopiloteService.demander()` gagne la branche 'arbitre' (R2)
  - `brain/dossier/arbitre.ts` (orchestrateur pur, appelle `resolveChallenge`, structure la sortie)
  - `worker/index.ts` : route `/ia/arbitre` avec contrat `INVITES`
  - `brain/dossier/session.ts` : `graine_alea` consommée à chaque `resolveChallenge` (séquentielle, jamais reproduite)
  - Schéma de sortie R2 et validateur R2 (KR-231, pas de clé commune avec `SortieInterprete`)
  - Tests : `moteurSansIA.test.ts` étendu (aucun import de `CopiloteService` dans les deux racines balayées)
- Lot 2 **feature** :
  - Nouveau composant `PanneauDes` (affiche carac, tc, pourquoi, enjeux, bouton « Lancer »)
  - Orchestrateur de pas (verrou KR-265 étendu : R1 → exécution → R2 attente → joueur clique → R3)
  - Test de composant : affichage correct + soumission du dé

**Cas limites à couvrir** :
- Aucun danger au lieu courant → pas de R2 appelé
- Jet demandé alors qu'une clarification est en attente → refus (KR-264 étendu)
- Caractéristique invalide ou TC hors `CHALLENGE_TIERS` → rejet atomique avec rejeu-un-coup
- Deux clics « Lancer » dans le même tick → exactement un appel (verrou)
- RNG : la graine avance, deux lancers de suite donnent des résultats différents

**Test décisif** : un test de bout-en-bout partiel (`BrainProvider`+`EcranPartie`) où le joueur arrive sur un lieu, R2 lui propose un jet (ex. FO vs TC2), le joueur clique « Lancer », l'état de session change (graine avancée, PV/XP modifiés post-narration de R3), le texte de récit s'affiche.

**SCORE DE MUTATION** : mesuré avant la première itération, `break` établi sur mesure réelle des fichiers de logique `challenge.ts`/`xp.ts`/`characteristics.ts`. Zéro modification attendue en n°11.

## Décisions prises en autonomie (faute de spécification)
- R3/narrateur réellement branché en it1 (pas déféré) → coût : dimensionnement plus lourd, mais coût KR-263 évité et chaîne traversée à l'issue de l'itération.
- `graine_alea` consommée par `resolveChallenge` → sinon des résultats déjà-vu ; le code futur pourrait avoir besoin de pistes alternatives, mais pas probable avant n°13 combat.
- `dangers` hors it1 → la première UI de jeu reste muette sur les enjeux narratifs, mais élimine un lot contrat dossier transverse inévitable sinon.
