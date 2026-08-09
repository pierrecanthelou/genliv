# Tour 2 — PM Produit — bascule-editeur it2

**Réponse nommée à l'objection UX (Annexe E : « ne pas l'inclure dans it2 »).**

Je maintiens ma proposition de tour 1 : le clic carte→éditeur reste dans it2. L'argument de lettre du goal ne tient pas — « une phrase sans et » teste si on chaîne deux comportements distincts, pas si le texte brut nomme littéralement chaque entrée d'un même comportement (atteindre l'écran d'édition d'un dossier). Et la « décision déjà actée » que l'UX invoque n'existe pas sous cette forme : j'ai vérifié `resolved_decisions` et `open_questions` en entier — aucune des deux ne nomme « navigation carte→éditeur » avec un propriétaire ou une itération cible. La seule trace est la phrase de récapitulatif du goal d'it1 (« restent hors périmètre, nommément reportés »), sans destinataire — contrairement à rename/duplicate, qui ont leur propre `open_question` avec porteur écrit (« la prochaine feature qui touche book-library »). Ce n'est donc pas une décision qu'on rouvre, c'est une charge laissée sans porteur qu'on assigne enfin. Face à ça, « la spec ne le demande pas littéralement » ne pèse pas contre « un dossier créé devient définitivement injoignable » — c'est mon terrain de veto (valeur auteur nulle), et le tech-lead confirme un coût nul et un lot réversible (Annexe C, lot 3 détachable, propriété disjointe, « si le comité déplace le périmètre, c'est le lot 3 qui part »). Je ne durcis pas en veto : cette réversibilité retire la seule raison d'y aller.

**Statut de mes objections de tour 1.** AC#6 (« testé à la création ET à la duplication ») : MAINTENUE, converge avec le tech-lead (Annexe A.2). Se réécrit « testé à la création uniquement » ; duplicate() reste sans propriétaire d'itération dans open_questions, à ne pas refermer ici.

**VERDICT** — recevable sous réserve : lot 3 (clic carte→éditeur) retenu, AC#6 corrigé.

---

Fichiers relus pour ce tour : `.claude/raffinage/bascule-editeur-it2/tour1-tech-lead.md`, `tour1-ux-designer.md`, `tour1-qa.md`, `tour1-narratif-ia.md`, et re-vérification de `src/features/bascule-editeur/specification.json` (`resolved_decisions` et `open_questions` en entier, lignes 108-142) pour confirmer l'absence d'un propriétaire nommé pour « navigation carte→éditeur ».
