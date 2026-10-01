# Cadrage n°11 `moteur-arbitre` — Tour 2 — PM Produit

## RISQUE
Trois découpages concurrents risquent de bloquer le tour 3 ; et ma propre IT2 de tour 1 (« R3 narre issue+marge ») viole telle quelle le veto 1 de narratif-ia si je ne la corrige pas maintenant.

## OBJECTION
Je nomme le découpage **tech-lead** — son IT2 (« rôle arbitre + carte de jet cliquable ») laisse le branchement `resolveChallenge`/R3 en IT3. Un jet demandé sans narration d'issue dans le même lot est le no-op invisible que QA cite (précédent KR-263). Objection maintenue contre ce découpage précis — pas contre le tech-lead en général, ses points (1) `HeroState`, (3) `alea.ts` séparé, (4) ΔT caduc sont acceptés tels quels.

Sur le routage, je retiens **narratif-ia** (le code vérifie `dangers` non vide avant d'appeler R2) contre le tech-lead (R2 systématique). Vérifié `src/brain/dossier/types.ts:985` : le commentaire « risque, il ne le déclenche pas » décrit le comportement Temps 1 — rien ne joue encore — ce n'est pas une décision figée qui interdirait à la n°11 d'attacher une conséquence mécanique à ce champ. Aucune réouverture. Le gating tient « une phrase sans et » ; l'appel systématique bruite le squelette et facture un aller-retour IA à vide sur chaque action neutre.

## PROPOSITION
Je retire « issue+marge » de ma définition IT2 — R3 ne reçoit que les amorces catégorisées, jamais les chiffres (veto narratif-ia 1 accepté). Marge fine + XP restent groupées en IT3. Le bandeau héros permanent reste dans IT1 — pas une 4e itération, je ne cède pas à la tri-partition UX.

## VERDICT
Voir statuts ligne à ligne + découpage révisé en annexe.

---

## STATUT DE MES OBJECTIONS TOUR 1

1. « Veto si pas découpée en exactement 3 itérations héros / dé / XP » → **durcie et reformulée**. Toujours 3 itérations, mais durcie sur deux points précis : (a) veto explicite si R2 et son branchement R3 sont séparés en deux lots (invalide le découpage tech-lead tel quel) ; (b) veto explicite si le routage est « R2 systématique » plutôt que gaté sur `dangers` (invalide la proposition (2) du tech-lead).
2. « Hors périmètre : boutique de progression, `combat.ts` » → **maintenue**. Personne ne l'a contestée ; le tech-lead confirme lui-même via `alea.ts` que les 4 fichiers mutés ne sont pas touchés en IT1/IT2.
3. « IT2 = R2→resolveChallenge→R3 narre issue+marge » (tour 1) → **retirée et corrigée**, par cohérence avec le veto narratif-ia 1 (audience avant injection, déjà tranché par CLAUDE.md — « l'IA ne lance jamais les dés », « deux proses seulement émises verbatim »). R3 ne narre plus que des amorces qualitatives (réussit / réussit de justesse / échoue) ; la marge chiffrée et le calcul ΔT/XP basculent entièrement en IT3.
4. Le veto narratif-ia 2 (R2 ne voit jamais la fiche du héros, seulement le texte de `dangers`) → **adopté comme contrainte de mon découpage**, condition de fond pour toute IT2 proposée au tour 3.

---

## ANNEXE : DÉCOUPAGE RÉVISÉ (3 itérations, ordre de construction)

**IT1 — le héros existe.** `EtatSession.heros?: HeroState` (import direct de `src/player/types.ts`, pas de doublon). Nouveaux composants `BandeauHeros` (permanent) + `EcranCreationHeros`, réutilisant `heroGen.ts`/`charCreation.ts` (logique pure) mais jamais `HeroStatusBar.tsx`/`CharacterCreationScreen.tsx` verbatim. Règle A4 (+5 PE) câblée. Démo en une phrase : « l'auteur voit son héros existant et sa fiche, sans jouer de jet. » Hors périmètre : tout jet, tout XP.

**IT2 — le dé binaire, gaté et narré dans le même lot.** Routage : après R1, le code vérifie si le lieu courant porte un `dangers` rédigé non vide ; si non, R2 n'est pas appelé. Si oui, R2 reçoit UNIQUEMENT le texte de `dangers` (jamais la fiche du héros), répond `{jet:{...}}` ou `{sans_jet:true}`. RNG isolé dans `brain/dossier/alea.ts`. `resolveChallenge` appelé, `graine_alea` journalisée comme entrée du rejeu (KR-248), attente persistée avant la carte. R3 narre l'issue en amorces qualitatives seulement (réussit / échoue), pas de marge fine, pas d'XP. Démo : « l'auteur voit le moteur lancer le dé qu'il a demandé et en raconter le résultat. »

**IT3 — la marge compte, l'XP suit.** Amorces nuancées (réussite nette / de justesse), table dorée du seuil de marge, branchement `challengeXp`/ΔT, extension `EntreeJournal`. Démo : « l'auteur voit son héros gagner de l'XP selon la marge du jet. » Hors périmètre : boutique de progression, `combat.ts`.

## Fichiers consultés
`docs/ROADMAP-BASCULE-IA.md` (138-139, 159, 170), `src/brain/dossier/types.ts:985` (commentaire `dangers`), listing `src/player/`.
