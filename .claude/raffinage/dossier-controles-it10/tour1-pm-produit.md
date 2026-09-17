# Tour 1 — PM Produit

**RISQUE** — Un BLOQUANT sans geste d'auteur possible : mesure E confirme qu'aucune surface d'éditeur n'écrit `echoue_si_expr` NI un inventaire de départ (`Depart` = `{lieu_id, texte_ouverture_joueur}`, aucun champ objets). Contrairement au contre-précédent cité (`objectif-sans-chemin`, dont la remédiation nomme des écrans producteurs qui existent réellement), ici il n'existe même pas d'écran producteur à nommer pour « donner l'objet au départ ». Un bloquant sans remède réel réplique BUG-090 (consigne circulaire, it8) — sur la DERNIÈRE itération de la feature, sans créneau pour corriger après coup.

**OBJECTION** — Sur la définition écrite : le goal se reformule proprement en une phrase (« l'auteur voit qu'un des objectifs qu'il a posés est déjà perdu dès l'ouverture »), donc raffinable. Mais Q4 tente d'y adjoindre les `fins` — une deuxième cible, un deuxième « et » implicite — alors que la mesure du cadrage dit explicitement « aucune fin des deux fixtures n'est vraie à t=0 » : zéro témoin positif réel. Étendre maintenant, c'est du travail spéculatif payé par cette itération sans valeur démontrable.

**PROPOSITION** — Q4 : objectifs seuls cette itération ; `fins[].condition_expr` part en `open_questions` pour la feature qui aura un témoin réel (chiffrable : 0 positif mesuré = 0 raison de l'inclure ici). Q1 : je ne tranche pas bloquant/alerte à l'aveugle — je pose la condition que le niveau retenu doit avoir une remédiation dont le geste nommé est PROUVÉ existant (grep sur la source, même patron que le critère 6 anti-BUG-090 d'it8) ; si aucun geste ne se prouve, le niveau descend à alerte, doctrine d'it8 appliquée à la lettre.

**VERDICT** — recevable sous réserve (Q1 conditionné à la preuve de remédiation, Q4 tranché vers objectifs seuls).
