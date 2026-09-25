# Tour 1 — Cadrage QA — moteur-interprete (n° 10)

## RISQUE

Trois frontières critiques n'ont pas d'instrument :

1. **KR-250 resserré sans réinscription** — moteurSansIA.test.ts balaie les trois racines sur l'absence de `fetch`/`CopiloteService`/`/ia/`. N° 10 le rouvre : seuls quelques fichiers (probablement `brain/dossier/interprete.ts` + play-mode) peuvent appeler le modèle. L'instrument doit être ré-écrit pour balayer **par fichier** plutôt que **par périmètre**, avec liste explicite de fichiers exemptés.

2. **Budget de contexte — onze chemins de prose `ia` sans balayage unique** — le brief dit « un seul balayage, jamais trois chemins bornés sur onze ». Aucun critère n'énumère ces chemins ni test n'existe pour les mesurer. C'est un contrat neuf qui part au lot contrat d'itération 1.

3. **KR-195 transverse : nom des entités** — destination de `Entite.nom` reste `'auteur'` alors qu'un narrateur (R3) doit prononcer les noms. Question globale sur huit collections (personnages, lieux, indices, quêtes, événements, jalons, fins, objectifs), non tranchable une par une. Brief propose re-projection par le code, jamais second champ. Aucun critère ne spécifie le périmètre ni son test.

## OBJECTION

Critère 3 pose heuristique non observable : « anti-complaisance — un échec a conséquence, PNJ méfiant ne cède sans jet ». C'est règle de jeu (n° 11), non testable en l'absence de jet — ou énumère co-dépendance, ou s'en retire.

Critère sur verbatim de R3 manquant : vérifier R3 ne remet jamais verbatim une phrase du dossier est mesure de SORTIE modèle, pas code.

## PROPOSITION

**Trois KR avant raffinage** (KR-260/261/262) :

- **KR-260** — moteurSansIA.test.ts ré-écrite, balayage par fichier, liste de fichiers exemptés documentée. Mutant obligatoire.
- **KR-261** — Énumération des onze chemins, mesure octet max (non-bloquant n° 10, rejet n° 11).
- **KR-262** — Destination `Entite.nom` : spécifier nouveau champ ou code d'assemblage, énumérer périmètre exact, tester que narrateur n'écrit jamais un nom marqué auteur.

## VERDICT

**Recevable, trois KR à verrouiller d'abord.** Spec n° 9 lue en entier, pas de régression. moteurSansIA.test.ts vit pour scinder, critique itération 1. Rajouter : liste fichiers exemptés doit venir d'une DÉCISION, pas d'un décompte.

**245 mots.**
