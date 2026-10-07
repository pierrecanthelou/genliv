## Tour 2 — Narratif-IA — moteur-fins it1

RÉPONSES CROISÉES
- [PM] objection 1 (deux tranches fin/mort) : D'accord. finAtteinte est purement code (evaluerExpr), aucun appel IA neuf. La mort passe en it2 avec son texte, sa garde R5, et le commentateur. Pas d'objection narratif-IA.
- [Tech Lead] condition_texte hors useTourDeJeu : Confirmé depuis mon domaine. condition_texte est audience=auteur (destinations.ts). finAtteinte consomme condition_expr (audience=moteur) et rend Fin avec texte (audience=joueur, verbatim). Le champ auteur ne franchit jamais la frontière runtime — c'est exactement la garde d'audience. Rien à ajouter.
- [UX] texte de mort proposé : Bien narrativement (deuxième personne, présent, immersif, pas de mécanique exposée). Mais c'est du périmètre it2. Pour it2 : constante nommée dans le code (ex. TEXTE_MORT), jamais dans un prompt IA — deux seules proses verbatim (CLAUDE.md), et celle-ci en est une troisième, du moteur.

STATUT DE MES OBJECTIONS
- objection 1 (texte de mort non défini, constante nommée) : REPORTÉE — suit la mort en it2 par le découpage PM. Reste valide pour it2 : constante code, testée, hors prompt.

VERDICT FINAL — recevable

La garde R3 (narrateur coupé au pas dont l'issue est une fin) reste dans le périmètre it1 — elle vit dans useTourDeJeu, qui appelle finAtteinte après exécution et avant l'appel R3. C'est du code pur, aucun contrat IA neuf. La frontière code/IA est intacte.

Décisions prises en autonomie faute de spécification :
- La garde R3 vit dans useTourDeJeu (après onSessionChange, avant l'appel copilote.demander narrateur) → choisi parce que c'est le seul orchestrateur IA → si placée dans EcranPartie, elle duplique la détection de fin entre deux sites
