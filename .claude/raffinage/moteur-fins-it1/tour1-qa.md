## CADRAGE MOTEUR-FINS ITÉRATION 1 — ANALYSE QA MODE A

Contexte cité : spec moteur-fins it1 (goal: « L'auteur voit la partie s'arrêter sur le texte de sa fin ou la mort du héros »), KR-302/303/307/308 et spec moteur-dossier livrée (architecture de finAtteinte, évaluateur bivalent, architecture de RefusCommande).

### RISQUE
Trois critères d'acceptation pour IT1 manquent de clarté testable, risquant des trous découverts en mode B (après code) :
— KR-302 (deux fins vraies) : énonce l'ordre du document mais pas le scénario séparateur (deux fins, quelle fixture, quelle assertion)
— Critère 4 (RefusCommande après fin/mort) : note « deux chemins » dans design_contract, omis dans acceptance_criteria
— Critère 5 (mort en --text-strong) : « texte constant » non spécifié littéralement

### OBJECTIONS MAJEURES

1. CRITIQUE — Deux chemins du refus non énumérés (Critère 4)
Aucune commande après fin/mort passe par handleSoumettreConsole (console) ET executeAction (saisie libre). La spec design_contract le note ; le critère 4 non. Risque : test couvre un chemin, l'autre reste découvert.
• Observable : oui (deux appels ou assertions duelles)
• Nommé : non — doit dire « test X couvre console ET saisie libre »
• Instrument : Jest + RTL suffisant
VETO tant que le critère ne distingue pas les deux chemins d'entrée.

2. CRITIQUE — KR-302 sans cas séparateur nommé (Critère 2)
« Première dans l'ordre » est correct mais le plan ne nomme pas : fixture avec deux fins vraies, et l'assertion qui distingue [0] de [1].
• Observable : finAtteinte retourne Fin à index 0, pas 1
• Nommé : non — doit dire « finAtteinte.test.ts : dossier-reference porte deux fins vraies au pas X ; finAtteinte(dossier, session).id === charpente.fins[0].id »
• Instrument : Jest pur
VETO tant que KR-302 ne cite pas la fixture et l'assertion séparatrice.

3. MAJEURE — Critère 5 : texte de mort non spécifié
« Texte constant du moteur » — pas écrit où. La spec design_contract reste muette, acceptance_criteria n'en donne pas la valeur.
• Observable : oui (screen.getByText('…') + token --text-strong)
• Nommé : non — plan doit dire « affiche '…' (texte X), EcranMort.test.tsx prouve »
• Instrument : RTL suffisant
VETO tant que le critère ne précise pas le texte exigeant.

4. MINEURE — Critères sans traçabilité test
Aucun critère ne cite son test par fichier+ligne. Chaque observable doit avoir un test nommé. Exemple : « Critère 1 : EcranFin.test.tsx line NNN cherche 'texte_fin' par screen.getByText ».

### DÉCISIONS AUTONOMES — Ce qui n'était pas tranché

— Définir le texte de mort (« Le héros est mort » ou autre) → spécification dans REGLES-PLAY.md ou constante nommée du moteur, avec source
— Tester finAtteinte sur dossier-reference ou fixture neuve → dossier-reference doit avoir deux fins vraies pour prouver KR-302. Si elle ne les a pas, l'ajouter (coût : une fixture de plus)
— Garde useTourDeJeu pour R3/R5 non-appel → critère 6 le dit, reste à nommer le test (spy + toHaveBeenCalledTimes(0))

### VERDICT : RECADRAGE NÉCESSAIRE
Pas de rejet ; les trois observables sont réels et testables (bon instrument). C'est la SPÉCIFICATION DU COMMENT OBSERVER (deux fins, deux chemins, texte nommé) qui manque. Tant que ces trois critères ne nomment pas leur cas séparateur ou leur valeur exigeante, la définition de fini est floue et le mode B risquera des trous.

Définition de fini exigée :
1. Critère 2 : fixture nommée avec deux fins vraies + assertion finAtteinte(…) === fins[0]
2. Critère 4 : test nominé « console ET saisie libre refusent après fin/mort » (deux chemins distincts)
3. Critère 5 : texte exigeant cité et EcranMort.test.tsx s'approprie la preuve
4. Tous critères : traçabilité test (fichier + assertion clé)
