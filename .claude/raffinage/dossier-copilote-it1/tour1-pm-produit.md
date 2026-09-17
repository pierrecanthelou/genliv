# Tour 1 — PM produit — `dossier-copilote` it1

RISQUE — Bien que verticale, IT1 porte déjà la quasi-totalité des garanties de la feature entière (enveloppe 4 branches, filtre MARQUEUR_A_ECRIRE, garde d'audience stricte, scanner anti-identifiant, mémoire nulle) — voulu, coût de retrofit x10 selon le cadrage. Mais ça ne laisse plus de marge : si l'essaim découvre en route qu'un comportement de plus est nécessaire pour que le squelette tienne, il n'y a rien à couper sans rouvrir une décision déjà actée. La seule soupape encore disponible est le nombre de CHAMPS/VARIANTES démontrés, pas les garde-fous.

OBJECTION — Le critère « allow-list… exclusion de stats, Revelation.jet.carac/.tc, confiance_min, intensite, secret, duree, delai, …_expr » teste une famille de champs qu'aucun chemin d'IT1 ne peut atteindre : la cible de sortie est une énumération fermée à 3 champs de prose nommés (fonction, apparence, description_joueur). Le prouver maintenant avec l'instrument « famille » complet anticipe un risque qui n'existe qu'à partir d'IT2 (rangs) et IT3 (nombres) — une preuve d'exclusion sur un ensemble déjà structurellement inatteignable.

Deuxième point : le `design_contract` distingue REMPLISSAGE et REMPLACEMENT pour `LigneProposition`, mais le `goal` d'IT1 ne dit pas si un champ de fiche déjà écrit (non vide, sans marqueur) est demandable dès cette tranche — silence qui laisse un ouvrier trancher seul entre deux variantes visuelles et deux jeux de tests.

PROPOSITION — Coupe verticale, pas horizontale : IT1 = REMPLISSAGE seul (cible vide ou `⟨à écrire⟩`), une seule variante de `LigneProposition`. Le cas « champ déjà écrit » (REMPLACEMENT) part en itération 1-bis, avant IT2. Sur les 14 critères de feature, je retiens 8 pour IT1 (liste en annexe) et défère le critère d'allow-list « famille » à IT2, quand des champs adjacents aux exclusions apparaissent réellement.

VERDICT — recevable sous réserve (coupe REMPLISSAGE-seul + report du critère allow-list famille + clarification explicite REMPLACEMENT=hors-IT1)

---

## ANNEXE

**Les 8 critères retenus pour IT1** (numérotation du tableau `plan.acceptance_criteria`, 1 à 14) :

1. Critère 1 — réponse conforme acceptée sans second appel (fetch moqué, exactement 1 fois).
2. Critère 2 — rejeu exactement une fois puis état terminal sur double non-conformité, deux tests distincts (KR-230, non négociable).
3. Critère 3 — les 4 textes d'échec/vide distincts, discriminance prouvée dans le même test.
4. Critère 4 — écriture uniquement via `DossierService.update`, ordre persistance-puis-événement épinglé. Cœur de la valeur produit.
5. Critère 5 — refus par `validateDossier` à l'acceptation = cas nominal, rien n'est persisté.
6. Critère 6 — scanner anti-identifiant dédié, deux canaris (positif + faux positif prose française).
7. Critère 7 — garde d'audience stricte : `CHAMPS_INJECTES`, `DEROGATIONS_AUDIENCE` vide et assertée, inclusion de chemins pour le rôle.
8. Critère 9 — champ requis portant `MARQUEUR_A_ECRIRE` retiré du contexte ; si le retrait vide une partie requise, refus nommant le champ SANS appel réseau.

**Retenus mais « HORS du budget des 8 »** (motif PM : substrat technique ou corollaire du même envelope) :
- Critère 10 (mémoire nulle, 2 appels → corps identiques).
- Critère 11 (worker injoignable → message, aucune dégradation).
- Critère 12 (route worker : test node, POST dans CORS, garde de taille de corps).
- Critère 13 (non-régression dossier de référence + 10 sections en état vide).
- Critère 14 (lint + tsc zéro erreur, aucun import inter-features).

**Rejeté / différé nommément :**
- **Critère 8** (allow-list « famille ») — **DIFFÉRÉ à IT2**. Motif : la cible de sortie d'IT1 est une énumération fermée à 3 champs de prose nommés ; aucun chemin de code ne peut produire les champs interdits, donc l'instrument « famille » n'a rien à discriminer avant qu'IT2 (rangs) et IT3 (nombres) introduisent des champs adjacents. Un test d'appartenance à l'ensemble {fonction, apparence, description_joueur} suffit en IT1.
- **Variante REMPLACEMENT de `LigneProposition`** (bloc « AVANT » statique + champ « APRÈS ») — **DIFFÉRÉE en itération 1-bis**, avant IT2. Ce que l'auteur perd : il ne peut pas encore faire retravailler un champ de prose déjà écrit — seulement remplir un champ vide ou marqué `⟨à écrire⟩`. Coupe verticale (« moins de champs »), pas horizontale.

**Fichiers lus** : cadrage.md, SKILL.md (raffinage-iteration), specification.json, ROADMAP-BASCULE-IA.md (l. 140-185), worker/index.ts, DossierEditorScreen.tsx (grep `panneauControles`).
