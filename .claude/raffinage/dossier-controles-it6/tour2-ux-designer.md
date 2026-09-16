# Tour 2 — ux-designer — dossier-controles it6

**RÉPONSE À C3 (mesure du tech-lead)** — je corrige ma note. « Zéro fichier de feature » était faux tel qu'écrit : je visais l'absence de fichier RENDU neuf (aucun composant, aucun token), pas l'absence de tout fichier de feature touché. `panneauControles.test.tsx:145` ancre `/aucun enchaînement/`, et si le texte que je fixe cesse de contenir ce fragment, ce test doit être réécrit — dans le même lot, comme le tech-lead l'a déjà lui-même prévu (« il le possède »). Sur la question de fond posée : **NON, ce n'est pas acceptable qu'un ancrage de test dicte une tournure à l'auteur.** Un test vérifie qu'un texte est présent et non vide, il ne fige pas son libellé — quand la vérité du message (mon critère non négociable) entre en conflit avec un fragment épinglé, **le texte gagne et l'ancre se met à jour dans le même lot**. Ce n'est donc pas un veto de ma part contre le tech-lead ; c'est l'exécution de la clause qu'il a lui-même écrite.

**RÉPONSE À C1** — mon `REJETÉ` (b) ne tient PAS contre la variante narratif. Il visait un patch précis : garder le message actuel (qui nie « aucun enchaînement ») et ne retoucher QUE la remédiation par une clause conditionnelle — message toujours faux, charge de deviner reportée sur l'auteur. La variante narratif n'est pas ce patch : elle REMPLACE le message par une formulation vraie dans les deux configurations (« aucun chemin praticable »), et la remédiation nomme la condition sans reproposer le geste neutralisé. Mes deux contraintes non négociables du tour 1 (message jamais faux sur un enchaînement existant ; remédiation jamais un geste déjà neutralisé) sont satisfaites par UN texte, pas deux. **Je retire donc mon exigence de deux paires et adopte le texte unique** — sous condition que le champ jamais introduit sur `ConstatControle` reste vrai (il l'est, confirmé par narratif et tech-lead).

**Sur C2** : les deux moitiés se jugent séparément. Le message ALERTE reste vrai inchangé ; **je corrige mon tour 1 sur la remédiation** — je n'avais vérifié QUE le message, pas l'opérabilité du dernier membre de la remédiation. Erreur d'audit de ma part, corrigée en annexe.

**VERDICT — recevable sous réserve** : uniquement la mise à jour de l'ancre de test dans le même lot que le texte (déjà prévue par le tech-lead) et la relecture de la docstring d'it3 (déjà actée par tech-lead + narratif). **Aucun veto.**

---

## ANNEXE — Disposition de chaque REJETÉ et objection du tour 1

**Objection tour 1 (deux paires message/remédiation)** — **RETIRÉE**, remplacée par le texte unique narratif. Motif : mes deux garanties sont satisfaites sans discriminant de type, ce que je n'avais pas envisagé au tour 1 faute d'avoir cherché une formulation assez abstraite pour rester vraie dans les deux configurations.

**REJETÉ (a)** — « garder le message bloquant unique actuel pour le cas boucle » : **MAINTENU**. Aucune variante en jeu ne propose de laisser le texte actuel inchangé.

**REJETÉ (b)** — « patcher la remédiation par une clause conditionnelle en gardant l'ancien message faux » : **MAINTENU contre cette configuration précise** (message inchangé + patch de remédiation seul) ; **RETIRÉ en tant qu'objection à la variante narratif**, qui n'est pas ce patch. Principe qui survit, reformulé pour le plan : *la remédiation ne peut jamais être seule à changer si le message reste littéralement faux.*

**REJETÉ (c)** — « nommer l'autre membre du cycle dans le message » : **MAINTENU**, incontesté. Toujours faux pour l'auto-boucle et les cycles à 3+.

**Correction propre (C2, remédiation ALERTE)** : mon tour 1 disait « aucun changement de texte » pour le seuil ALERTE en n'auditant que le message. Le message reste inchangé (vrai) ; la remédiation, elle, doit changer — je l'avais manqué.

## CONTRAT DE DESIGN FINAL — textes exacts, à recopier tels quels

**0. Surface** : zéro fichier de rendu neuf, zéro nouveau composant, zéro nouveau token, zéro nouveau `NiveauControle`. `PASTILLES.bloquant`/`alerte` inchangés. Le seul fichier de feature touché est `src/features/dossier-controles/tests/panneauControles.test.tsx` — un fichier EXISTANT modifié, dans le même lot que le texte (L1/T2).

**1. BLOQUANT** — texte unique, couvre « 0 producteur brut » ET « cycle/auto-boucle sans source réelle après saturation » (aucun champ discriminant requis sur `ConstatControle`) :

- message : « Aucun chemin praticable ne donne cet indice : le joueur ne pourra jamais l'obtenir. »
- remédiation : « Ancrez la chaîne : confiez cet indice — ou l'un de ceux qui y mènent — à un personnage (Personnages → Savoirs), ou révélez-le par un effet « révèle l'indice ». Un enchaînement depuis un indice lui-même inaccessible ne suffit pas. »

**2. ALERTE** :

- message : **INCHANGÉ** — « Cet indice n'est accessible que par un seul chemin : si le joueur le manque, il devient inaccessible. »
- remédiation : **CHANGÉE** (dernier membre seulement) — « Ouvrez-lui un second chemin — un autre personnage (Personnages → Savoirs), un effet « révèle l'indice », ou un enchaînement depuis un indice que le joueur peut lui-même obtenir (Indices → Mène à). »

**3. Registre vérifié** : indicatif présent impersonnel sur les deux messages (sujet = l'indice/le chemin, jamais « vous »), impératif 2e pers. pluriel sur les deux remédiations (« Ancrez », « confiez », « révélez », « Ouvrez-lui »), chemins d'écran entre parenthèses, zéro glyphe, zéro terme interne (« mene_a », « cycle », « boucle », « saturation », « point fixe », « Map » absents des quatre textes finaux).

**4. Ancre de test** — recommandation (l'édition reste au lot L1) : `panneauControles.test.tsx:145` passe de `/aucun enchaînement/` à `/chemin praticable/` (fragment stable du nouveau message bloquant). Si l'ouvrier choisit un autre fragment stable du texte final, c'est recevable — la contrainte est « ancre le texte FINAL », pas « préserve tel mot ».

**5. Docstring `controles.ts:249-258`** — hors mon écriture (developer-facing), mais je confirme la nécessité actée par tech-lead + narratif de remplacer « trois familles comptées, trois familles offertes » par une formule notant que la troisième famille (enchaînement) est offerte **sous condition explicitée dans la phrase**, pas retirée.

**6. État vide, clavier, PASTILLES** : inchangés — aucun impact de cette tranche.

Fichiers relus : `src/brain/dossier/controles.ts:240-272`, `src/features/dossier-controles/tests/panneauControles.test.tsx:139-151`, les cinq notes tour 1 en entier.
