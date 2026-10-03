RISQUE — Que l'itération livre la plomberie (confiance stockée, delta validé, saturation documentée) sans garantir l'ouverture effective du savoir gardé par `confiance_min` — c'est-à-dire sans garantir la phrase de démo elle-même. Risque secondaire : la question ouverte #6 (signal qualitatif vers R4) dérive en seconde capacité observable si elle touche un champ de sortie ou l'UI.

OBJECTION — Les `acceptance_criteria` listés pour it3 ne pin que la mécanique de `delta_confiance` (-1/0/+1, rejet atomique, saturation). Aucun critère, au format Given/When/Then comme l'AC#4 d'it2 (« le savoir s'ouvre... test à 4 branches »), n'énonce que `confiance_min` ouvre réellement un savoir une fois le seuil de session atteint. Sans ce critère écrit dans le plan signé, l'itération peut être déclarée faite alors que « ...finit par lui ouvrir un savoir qu'il gardait » n'est jamais observé en jeu — seul l'accounting existe.

PROPOSITION — Ajouter au plan, avant le lot code, un critère explicite : « Étant donné un savoir gardé uniquement par `confiance_min=N`, quand la confiance de session du PNJ est <N / =N / >N, alors `evaluerSavoir` reste fermé / s'ouvre / reste ouvert — 3 branches testées, même patron que les 2×2 d'it2. » Et trancher la question #6 en précisant qu'elle ne peut ajouter ni champ de sortie ni affichage (au plus une ligne de prompt interne à R4), pour ne pas créer une 2e capacité observable dans la même itération.

VERDICT — recevable sous réserve (ajout du critère d'ouverture `confiance_min` au plan signé).

---

Décisions prises en autonomie faute de spécification :
- Absence de critère d'ouverture explicite pour `confiance_min` → traité comme une réserve corrigeable, pas un veto → si c'est l'inverse, je bloque tout le tour pour un oubli de rédaction alors que l'architecture (lot contrat, patron catalogue/porte, précédent it2) est déjà saine.
- Portée de la question ouverte #6 (signal qualitatif) → jugée hors de mon ressort de veto tant qu'elle ne crée ni champ de sortie ni affichage → si c'est l'inverse, on retarde l'itération sur un point qui ne change rien à la phrase de démo pour l'auteur.
- Lecture de « finit par » dans le goal → choix d'y lire une exigence de mécanique (seuil cumulatif en session), pas une exigence UX de parcours multi-tours scripté → si c'est l'inverse, on ajoute un test E2E de parcours non demandé par le goal actuel.

Fichiers lus : src/features/moteur-acteurs/specification.json ; docs/ROADMAP-BASCULE-IA.md (grep sections n°12).
