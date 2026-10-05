CADRAGE QA — moteur-combat it3 (narrateur IA)

---

RISQUE — Testabilité du narrateur IA, rôle nouveau (R5), séparation observabilité/implémentation.

L'itération 3 introduit un rôle IA neuf (R5 commentateur) qui doit:
- Recevoir une projection structurée (CombatProjection), jamais le log texte (KR-294)
- Retourner {narration} seul avec validations (400 car max, /\d/ refusé, KR-296)
- Appliquer rejeu-une-fois-puis-silence (KR-230/283)
- Rester complètement absent de moteurSansIA.test.ts (KR-250/260)

Le risque majeur: **les critères d'acceptation nommés ne disent pas COMMENT on observe ces propriétés**.
- « Le narrateur commente chaque round en 2–3 phrases » : qu'est-ce qu'une phrase? Comment mesurer 2-3? Le texte est-il rendu et constatable par RTL?
- « Aucun chiffre » : on valide avant injection (schemaSortie.ts) ou au rendu? Quel test verrouille le pattern /\d/?
- « Rejeu-une-fois-puis-silence » : aucun test nommé qui simule l'échec + rejeu + succès, ni l'échec persistant qui doit produire silence.

---

OBJECTION 1 — Critère d'acceptation non observable.

« Le narrateur de combat commente chaque round » est une description de comportement, pas un critère observable par machine.
**Reformulation requise**: « Après chaque round (assaut résolu, posture choisie), EcranCombat affiche un élément contenant le texte retourné par l'appel R5 commentateur en POST /ia/commentateur. »

Le test observable: une intégration EcranCombat→narrateur qui vérifie que le texte retourné s'affiche dans le DOM (RTL findByText ou getByRole).

---

OBJECTION 2 — KR cités sans test de non-régression nommé.

KR-296 (« R5 retourne {narration} seul, 400 char max, /\d/ refusé ») nomme deux validations:
1. Plafond de taille en octets (400 caractères)
2. Refus du pattern /\d/ (aucun chiffre 0-9)

**Le test manquant**: frontiere.test.ts doit avoir une suite pour R5 commentateur avec:
- Cas nominal: {narration: "texte sans chiffre", longueur < 400}
- Cas limite taille: 399, 400, 401 caractères (le validateur doit rougir à 401+)
- Cas limite chiffre: {narration: "0"}, {narration: "9"}, {narration: "texte avec 5 en milieu"} — tous refusés

KR-230/283 (« rejeu-une-fois puis silence ») n'a pas de test nommé à l'intégration EcranCombat. Il faut:
- Test A: mock de l'appel R5 en échec → rejeu → succès → texte affiché
- Test B: mock de deux échecs consécutifs → plus d'appel R5, affichage silencieux

---

OBJECTION 3 — Ambiguïté sur l'arité et l'exclusion du moteur.

KR-250/260 dit « moteurSansIA.test.ts reste vert (player/ sans IA) » mais ne nomme pas le test qui verrouille l'absence de R5 dans src/player/**.

**Critère à ajouter observable**: « grep 'commentateur|R5' src/player/ retourne 0 résultats. »

---

PROPOSITION 1 — Reformuler les trois critères d'it3 concernant le narrateur.

**AC-3.1** (Observabilité): « Lors du rendu d'EcranCombat avec un combat en cours, après la résolution d'un assaut par le joueur, le composant affiche un élément contenant le texte retourné par l'appel R5 commentateur (RTL: getByRole/findByText). »

**AC-3.2** (Contrat R5): « Le rôle R5 commentateur (route POST /ia/commentateur) retourne {narration: string}. Le validateur refuse /\d/ (pattern regex) et >400 octets (taille). Canari croisé dans frontiere.test.ts confirme l'appariement rôle-gabarit. »

**AC-3.3** (Résilience): « Appel R5 échoué au tour N → rejeu une fois au même tour → (succès: affichage | échec: silence, pas de 3e tentative). » Deux suites nommées explicitement.

---

PROPOSITION 2 — Mesurer la séparation moteur-narrateur (KR-293).

Ajouter un test unitaire dans combatEngine.test.ts qui vérifie que le moteur ignore tout champ de narrative/narration et retourne le même CombatState sans effet de l'appel R5. Cela verrouille la réciprocité avec combatProjection.test.ts qui verrouille que la projection NE contient PAS CombatLogEntry.text.

---

PROPOSITION 3 — Expliciter le périmètre testé.

Ajouter une ligne à la définition de fini:
« Périmètre NOT testé: le contenu du texte narratif (« qualité prose »). Testé: form (aucun chiffre), taille (400 car max), rejeu-une-fois-silence. »

---

VERDICT: **Recevable sous réserve**

Les trois objections ci-dessus doivent être adressées AVANT la session de raffinage du comité:
1. Reformuler les critères d'acceptation en trois observables nommés (AC-3.1/3.2/3.3).
2. Nommer les tests de non-régression pour KR-296 (frontiere.test.ts + cas limites taille/chiffre) et KR-230/283 (deux suites intégration).
3. Ajouter un critère observable pour KR-250/260 (grep moteur-sans-IA).

Le périmètre produit est solide. C'est la **contractualisation des observables** qui manque.
