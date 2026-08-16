RÉPONSE À TECH-LEAD (ordre des curseurs) — Accepté tel quel, mon regroupement par affinité est retiré. Je l'avais posé explicitement « non bloquant » ; l'argument du contrat (`CURSEUR_VALUES = Object.keys(CURSEURS)`, KR-117) et ma propre règle clavier de tour 1 — « Tab traverse la grille dans l'ordre DOM = ordre d'affichage » — convergent sans reste vers l'ordre du registre : regrouper visuellement aurait soit démenti mon contrat clavier, soit forcé un ordre DOM ≠ ordre visuel, un piège de tabulation. Aucune règle du design system n'exige un regroupement. Retiré, sans dette.

RÉPONSE À NARRATIF-IA (affichage `affinite`) — Complémentaires, pas redondants : mon `${label} (${affinite})` identifie la valeur (registre interface, terse, précédent exact `BlocCaracteristiques`) ; leur avertissement porte sur la portée mécanique — un fait distinct. Mais répété 6 fois sous chaque Stepper, c'est de la décoration textuelle (viole ma règle 5 — hiérarchie par filets/teintes, pas par répétition) et ça alourdit un registre censé rester terse. Je fusionne au site unique déjà prévu : la légende de section 1, pas un site par curseur.

TEXTE FINAL TRANCHÉ (légende, remplace mon texte de tour 1) :
« Curseurs de caractère — jamais lus par le narrateur, l'affinité (CA/IN/IG) colore la voix sans modifier aucun jet. »
Label Stepper inchangé : `${CURSEURS[id].label.toUpperCase()} (${CURSEURS[id].affinite})`.

STATUT DE MON OBJECTION TOUR 1 — **RETIRÉE**. Motif : convergence unanime — tech-lead (lot B respecte le découpage CTA=curseurs seuls) ; QA et tech-lead tranchent (b) en UI-only, exactement ma proposition (bouton disparaît, jamais désactivé — cohérent avec « l'accent ne se ternit pas, il s'efface »). Personne ne rouvre le seeding de `parler`/`jamais`/`cede_si`.

VERDICT — recevable, inchangé.
