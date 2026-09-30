# Tour 1 — UX Designer — moteur-interprete it4

## RISQUE
Aucun risque de design system direct. Lecture complète de `narrateur.ts` et de la spec : cette itération fusionne `BUDGET_CARACTERES_NARRATEUR` en constante KR-261 et remplace le refus sec (ligne 177-180, déjà écrit comme risque connu) par une cascade de dégradation — tout en amont de tout rendu, zéro fichier de `src/features/play-mode/components/` prévu ni nécessaire. Le seul risque est documentaire, pas visuel : la mention « affiché en mode auteur » du plan de cible (§2.8 n°4) n'a aucune ligne de suivi dans `open_questions`, contrairement à KR-262 ou KR-267 qui ont chacun un propriétaire et un déclencheur nommés.

## OBJECTION (obligatoire)
Le `design_contract` tranche correctement — dégradation silencieuse, « le récit est produit, juste plus court », aucun message — et le cadrage confirme l'affichage auteur hors périmètre du roadmap actuel ; pas de contestation de ce tri. L'objection porte sur sa traçabilité : rien ne nomme l'écart entre la promesse du plan de cible et ce qui est livré. Sans une ligne explicite, elle se perd — le prochain lot qui rouvre `dossier-controles` (même dette-type que KR-267) n'aura aucun signal qu'un plafond devrait aussi s'y afficher.

## PROPOSITION
Ajouter à `open_questions` : « Le plafond de budget par pas n'est affiché nulle part côté auteur (plan de cible §2.8) — aucune surface ni composant choisi ; candidat naturel si un jour fait : une `ListRow`/`Badge` dans le panneau Contrôles existant, registre interface, jamais une jauge temps réel. » Propriétaire à assigner, déclencheur = prochain lot qui rouvre `dossier-controles`.

## VERDICT
Pas de veto, pas d'objection bloquante sur le code de cette itération — surface visible nulle, deux registres de langue non engagés, zéro composant DS à instancier ici. Objection forte uniquement sur la traçabilité (une ligne à ajouter).

---

## ANNEXE — CONTRAT DE DESIGN

**Aucun contrat de design requis pour l'implémentation de cette itération.** Confirmation par lecture directe :
- `src/brain/copilote/contexte/narrateur.ts` — assembleur pur, aucun JSX, aucune couleur, aucun token.
- Le hook `useTourDeJeu` / `PlayerInputBar` / `EcranPartie` ne sont pas rouverts par cette itération (contrairement à it1/it2 qui, eux, avaient un lot feature UI) — vérifié par la liste des fichiers probablement concernés du cadrage (§6), qui exclut nommément `src/features/play-mode/components/`.
- Le message fixe déjà existant `Le récit n'a pas pu être généré.` (registre interface, décidé en it2) reste inchangé — cette itération devrait même en RÉDUIRE la fréquence d'occurrence (la cascade évite le refus plutôt que de le déclencher plus tôt), donc aucune révision de copie n'est nécessaire.
- Aucun placeholder nouveau, aucun état vide nouveau, aucun usage de l'accent, aucun glyphe : rien de tout cela n'entre dans cette itération.

**Contrat minimal, SI un jour l'affichage auteur du plafond est fait (hors périmètre ici, à ne PAS anticiper)** — esquissé pour mémoire uniquement, pas à coder maintenant :
- Composant : `ListRow` (précédent : lignes de `dossier-controles`), pas un composant maison.
- Libellé (registre interface, mono majuscules) : `BUDGET DE CONTEXTE — PAR TOUR`.
- Valeur : lecture seule, dérivée de la même constante KR-261 partagée — jamais une seconde mesure.
- États : pas de « vide » à ce niveau (toujours une valeur numérique) ; pas de couleur d'accent (ce n'est ni une sélection ni une action primaire) ; à la rigueur un filet, jamais une ombre.

**Proposition ESLint** : rien de spécifique à ajouter pour cette itération — les règles déjà en place (`no-restricted-syntax` sur `#hex`/`rgb()`/`hsl()`, isolation de features) couvrent le périmètre touché, qui ne produit aucun JSX. Si le contrat minimal ci-dessus est un jour codé, la règle existante suffira encore.

---

## DÉCISIONS PRISES EN AUTONOMIE

- Écrire ou non un contrat de design complet pour l'affichage auteur du plafond, malgré son absence du périmètre → choix d'une esquisse minimale en annexe (composant + libellé), pas un contrat complet prêt à coder → un contrat complet aurait spéculé sur une surface sans consommateur réel ni itération qui la porte — exactement le type de coût que le projet nomme ailleurs (KR-266/268 : « un champ/rôle n'entre qu'avec son consommateur réel »).
- Formuler l'écart plan-de-cible/livré comme une objection à tracer plutôt que comme un simple constat neutre → choix de l'objection, avec proposition de ligne `open_questions` concrète → sans elle, le risque (déjà non nul pour KR-267, cas structurellement identique) est qu'elle se perde silencieusement une fois la feature TERMINÉE 4/4.

Fichiers lus : `src/features/moteur-interprete/specification.json`, `src/brain/copilote/contexte/narrateur.ts`.
