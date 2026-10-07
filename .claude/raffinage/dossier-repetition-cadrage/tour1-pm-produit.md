# Cadrage n°16 `dossier-repetition` — Tour 1 — PM Produit

RISQUE — Faux positifs. Selon `commandes.ts`, `parler` et `agir` ne touchent pas `monde` : les indices viennent de R4/R2, donc de l'IA. Un joueur en code n'en obtient jamais un. La ligne « indices inatteignables » de la carte ne dirait que des faussetés et doublerait `atteignabilite.ts`.

OBJECTION —
1. La carte du plan promet trois rapports, (B) en tient deux. Je l'amende.
2. Le roadmap croit que le joueur synthétique rend « Difficulté non calibrée » calculable. Ce qui la rend calculable, c'est un héros étalon écrit dans `REGLES-DU-JEU.md` (aucune section aujourd'hui, grep « étalon » = 0). La simulation ne supprime pas la convention.
3. Cette règle vit dans `dossier-controles` et `controles.ts` : l'inclure ferait toucher deux features.
4. (A) est un onzième rôle IA (prompt, budget, route), non rejouable : une feature à soi, contraire à la décision n°3 et à la graine de n°15.
5. Dépendances « 10 · 7 » périmées. (B) dépend de 9, 13, 14, 15, tous livrés.

PROPOSITION — Intention : « l'auteur lit où un joueur synthétique se bloque dans son aventure ». Je retiens (B), en 3 itérations (roadmap : 2) :
1. **Squelette** : l'auteur lit pourquoi le joueur synthétique s'arrête (fin / impasse / combat ouvert / 20 pas). Verbe `aller` seul, `repeter(dossier, graine)` pure, rien stocké (KR-013), aucun champ de schéma. Scénario séparateur : une fin vraie au pas 0 s'affiche, ce qui clôt gratuitement la dette de moteur-fins.
2. **Combat** : l'auteur voit son héros étalon survivre aux combats ou y mourir. Ordre imposé : section de règles, ligne dorée, code (KR-130). **Sacrifiable**. Repli : « victoire supposée », hypothèse datée dans le code.
3. **Couverture** : l'auteur lit ce que le joueur n'a jamais rencontré (lieux, PNJ). Politique « lieu non visité d'abord », sinon 20 pas aléatoires ne couvrent rien.

Hors périmètre de la feature entière : tout appel modèle, indices, jets, objets, `parler`/`agir`, plusieurs graines ou statistiques, saisie de graine ou de nombre de pas, historique des rapports, saut au champ fautif, branchement du CTA, règle de contrôle « Difficulté non calibrée ».

VERDICT — recevable sous réserve : (B) retenu, carte amendée, règle de contrôle sortie.

---
COMPLÉMENT (hors quota)

**Ce que la répétition apporte que le statique n'apporte pas.**
- `atteignabilite.ts` raisonne sur un modèle du moteur (hypothèses H1–H4 datées) et prouve une absence. La répétition exécute le vrai noyau (`executerCommande`, `tickHorloge`, `finAtteinte`). Elle livre donc un témoin : graine et chemin rejouables, qui prouvent une présence et ne dérivent pas du moteur.
- Elle couvre ce que le statique ne fait pas : l'atteignabilité des LIEUX (le header d'`atteignabilite.ts` dit qu'elle n'est pas écrite), les impasses, la présence des PNJ mouvante avec l'horloge, la mort au combat, la fin vraie à l'ouverture.
- Elle ne couvre rien de ce que l'IA conditionne. Ce périmètre reste au statique, sans doublon.
- Réserve honnête : si l'auteur ne voulait que « lieux inatteignables », une règle statique de contrôle coûterait moins cher. La répétition se justifie par le témoin, l'horloge et le combat. Si l'it2 est sacrifiée, n°16 perd la justification que le roadmap lui donne (le héros pour la difficulté), pas sa valeur propre.

**« Difficulté non calibrée ».** L'étalon (doc, ligne dorée, constante exposée) entre dans n°16 à l'it2, parce que le combat simulé en a besoin. La règle de contrôle elle-même sort : dette à déclencheur « étalon livré » dans `dossier-controles`. Elle y comparerait, statiquement, monstres et TC à l'étalon, sans simulation. `controles.ts` fait déjà 1 348 lignes (KR-112), ce que le Tech Lead devra regarder avant d'y ajouter une dixième règle.

**Découpage.** Chaque phrase de démo est sans « et ». Au plus 4 lots et 8 critères par itération. L'it1 n'a qu'un lot `contrat` (module pur dans `brain/`), pas de lot schéma (types/destinations/validate intacts).

## Décisions prises en autonomie
- Fourche (A) IA / (B) code → (B), code déterministe seedé → si (A) : onzième rôle IA, prompts, budget, route worker, rapport non rejouable, exclusion `moteurSansIA.test.ts` à rouvrir (KR-250/260) ; au moins une feature de plus.
- « Indices inatteignables » de la carte → retiré de n°16, propriété du statique → si gardé : faux positifs systématiques sur tout contenu gated par indice, ou double code de R4 (second modèle du moteur, H1 refaite).
- « Difficulté non calibrée » → étalon dans n°16 (it2), règle de contrôle dehors → si la règle entre : n°16 touche deux features, une it4 de plus, et `controles.ts` (1 348 l.) grossit.
- Ordre combat (it2) avant couverture (it3) → ainsi → si inversé : la couverture est mesurée sur un parcours qui meurt au premier combat, rapport trompeur ; l'it3 serait plus tôt mais sans valeur sur tout dossier à combat.
- Sacrifiable = it2, avec repli « victoire supposée » → si l'on sacrifie l'it3 à la place : on perd la seconde promesse de la carte (« PNJ jamais rencontrés »), la plus lisible pour l'auteur.
- Rapport jamais stocké (KR-013), donc pas de lot schéma → si l'auteur veut un historique : champ optionnel plus ligne `destinations.ts`, lot `contrat` seul et en premier (Décision A), plus une itération.
- 20 = constante non réglable ; terme « pas » (bandeau « PAS #n » de n°14) plutôt que « tour » de la carte → si « tour » : écart de vocabulaire avec l'écran de jeu, mineur.
- 3 itérations (minimum exigé par /cadrer) au lieu de 2 du roadmap → la ligne n°16 du roadmap (Itér., Dépend de) est à corriger : « 10 · 7 » devient 9 · 13 · 14 · 15, et 7 seulement si le rapport s'affiche dans le panneau Contrôles.
- Emplacement UI du rapport : non tranché, domaine UX. Je ne demande qu'un seul point d'entrée.

## Fichiers consultés
- docs/ROADMAP-BASCULE-IA.md (§ 2 bis dette, § 3 n°16, § 4, § 5)
- docs/PLAN-BASCULE-IA.dc.html (carte « Répétition à blanc »)
- src/features/dossier-controles/specification.json (open_questions l.504)
- src/features/moteur-fins/specification.json (open_questions)
- src/brain/dossier/atteignabilite.ts (en-tête H1–H4, exports)
- src/brain/dossier/commandes.ts (COMMANDES, RefusCommande, `parler`)
