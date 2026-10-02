# Raffinage `moteur-acteurs` it2 — Tour 2 — UX Designer

## RÉPONSE AUX OBJECTIONS — nommée

**À Narratif-IA (§ G), sur `JournalRow.tsx` — vérifié moi-même, le fait technique est confirmé, le diagnostic est infirmé.**

J'ai lu `src/features/play-mode/components/JournalRow.tsx` (lignes 55-64) : oui, pour toute entrée dont `deltas` contient `{delta:'reveler_indice', cibles:['indice.trace-du-guet']}`, le composant rend littéralement `[reveler_indice:indice.trace-du-guet]` — un identifiant d'auteur brut, verbatim. Le fait est exact.

Mais ce n'est **pas** un défaut à corriger en it2 : `EcranPartie.tsx:226-228` documente explicitement que le Journal est un « registre développeur-débogueur », distinct du « registre joueur » (qui se limite au seul `OutcomeBlock`/`texte_ouverture_joueur`). `docs/EXIGENCE-APERCU-DU-JEU.md` § 5 confirme l'audience : l'écran `play-mode` est l'« Aperçu du jeu », l'outil de test de l'AUTEUR, avec « un journal… pour le débogage » — pas un joueur final lisant de la fiction. Le pattern `[{delta}:{cibles}]` est en place depuis l'itération 3 (jalons), déjà accepté par un tour de raffinage antérieur ; `reveler_indice` emprunte un chemin déjà câblé, jamais exercé par ce delta précis jusqu'ici. Pour l'auteur qui teste son dossier, voir `[reveler_indice:indice.trace-du-guet]` est une information de débogage utile.

**Verdict sur ce point précis : pas de lot, pas de correctif.** Le carnet reste le seul endroit où ce savoir doit apparaître en registre fiction (déjà prévu, Tour 1 § 2). Les deux surfaces ont des publics différents par construction documentée, pas par oubli.

## Point qui, lui, touche réellement mon contrat (trouvé en creusant sa remarque)

En vérifiant le trajet texte/recit, j'ai trouvé un vrai risque pour `CarnetIndices` : le Lot A du Tech Lead (texte = `'indices_connus : <id>'`, écho mécanique façon jalon) et le § E de Narratif-IA (`recit = replique`, prose réelle du PNJ) produisent un contenu de nature DIFFÉRENTE sur l'entrée que mon carnet va lire. Mon annexe Tour 1 § 2 prévoyait `recit = entree.recit`, sinon repli sur `entree.texte`. Si c'est la version Tech Lead qui s'écrit (pas de champ `recit`, seulement `texte:'indices_connus : indice.trace-du-guet'`) et que mon repli s'active, **le carnet afficherait l'identifiant brut comme corps de ligne** — exactement la confusion nom-interne/description-joueur que ma règle n°7 interdit, cette fois en registre joueur authentique (le carnet n'a pas l'excuse « debug » du Journal). Ce serait un veto, pas une réserve.

Ce point est ORTHOGONAL au désaccord R4-choisit/moteur-décide : peu importe QUI déclenche la révélation, l'entrée de journal qui porte le delta `reveler_indice` doit porter, à côté, une PROSE RÉELLE lisible par le joueur — jamais un gabarit `'<clé> : <id>'`.

## Sur le désaccord central (R4 choisit vs 100% automatique) — confirmation demandée

**Confirmé : aucun impact sur le mécanisme de mon contrat.** `CarnetIndices` dérive toujours de la même façon — jointure sur `session.journal[].deltas` contenant `{delta:'reveler_indice', effet:'applique', cibles:[id]}` — que l'écrivain de ce delta soit `TRANSITIONS.parler` appelé automatiquement (Tech Lead) ou gaté par la sortie validée de R4 (Narratif-IA). Point de montage, bouton 🗝, `Modal.hideFooter`, `ListRow.onSelect?` : zéro changement dans les deux cas. Seule la SOURCE de `recit` varie, et ce n'est pas une conséquence du désaccord lui-même mais de la forme choisie pour écrire l'entrée de journal.

## MA PROPOSITION MISE À JOUR

1. `JournalRow.tsx` : aucun changement, aucun lot. À confirmer par PM/Tech Lead que le Journal reste registre développeur-débogueur par convention déjà établie.
2. **Ajout à Lot A (contrat), pas un lot neuf** : quelle que soit l'issue du désaccord R4/moteur, l'entrée qui porte `{delta:'reveler_indice', effet:'applique'}` doit porter un champ de prose réelle — j'accepte indifféremment `recit` (Narratif-IA) ou que `texte` lui-même porte la réplique plutôt qu'un écho mécanique — à charge du Tech Lead de trancher le nom, mais le contenu ne peut pas être `'indices_connus : <id>'`. Je corrige mon annexe Tour 1 § 2 : `recit = entree.recit ?? entree.texte` SEULEMENT SI le comité garantit que l'un des deux porte de la prose sur cette entrée précise ; sinon mon repli sur `entree.texte` est retiré de mon contrat et devient un veto tant que la garantie n'est pas écrite.

## VERDICT

**Recevable sous réserve** — une seule réserve nouvelle, ciblée : le comité acte explicitement, dans Lot A, que l'entrée `reveler_indice applique` porte de la prose réelle (quel que soit le nom du champ, quel que soit le déclencheur). Sans cette ligne écrite, je passe en veto sur le repli `entree.texte` de mon propre contrat — pas sur `JournalRow.tsx`, qui est hors de mon domaine et déjà conforme à une convention antérieure.

## Décisions prises en autonomie faute de spécification (Tour 2)
- `JournalRow.tsx` affiche l'id brut d'un delta → traité comme conforme (registre développeur-débogueur déjà établi, pas un défaut it2) → si le comité juge que le Journal doit devenir registre joueur pur, il faudrait réviser aussi l'affichage de `atteindre_jalon` depuis l'itération 3, chantier bien plus large, hors périmètre de cette itération.
- Repli de `recit` sur `entree.texte` dans `CarnetIndices` → conditionné à une garantie explicite du Lot A que cette entrée porte de la prose → sans cette garantie écrite, le carnet affiche un identifiant d'auteur en registre joueur, veto de ma règle n°7, découvert seulement à l'essaim sinon.
