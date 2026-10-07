## Tour 2 — UX Designer — moteur-fins it1

RÉPONSES CROISÉES
- PM objection (veto, phrase non verticale, mort exclue de it1) : je m'y range. Les trois textes de mort partent en it2 : titre `Vous êtes mort`, en-tête `MORT — texte du moteur`, corps « Vos forces vous abandonnent. Le monde se referme sur vous, et le silence qui suit est complet. ». It1 ne livre que le bloc FIN. Mon objection 1 (deux en-têtes distincts) change de nature. Elle ne sert plus en it1 et devient la condition d'entrée de it2.
- PM objection 4 (Rejouer sans critère, exclu de it1) : je ne m'y oppose pas. Réserve : sans bouton, l'écran de fin n'a ni sortie ni cible de focus. Il faut au moins Échap pour quitter, ou le critère d'it2 doit dire que Rejouer arrive là. Ma contrainte « un seul bouton accent » et le focus auto sur `↻ Rejouer` partent aussi en it2.
- QA objection 3 (texte de mort non spécifié) : réglée par le texte ci-dessus, à graver en it2. Narratif-IA propose une constante dans EcranFin.tsx. J'accepte, à condition que le texte soit en 2e personne, au présent, sans libellé d'interface.
- Tech Lead 5 (`fin.vigie-abandonnee` rougit commandes.test.ts) : hors de mon domaine, aucune objection.

STATUT DE MES OBJECTIONS
- 1 (en-têtes distincts fin/mort) : retirée pour it1 (un seul en-tête, `FIN — lue au joueur, mot pour mot`). Reportée en it2.
- 2 (repli invitant) : maintenue. Une fin sans texte affiche un bloc pointillé accent : « Cette fin n'a pas de texte — rédigez-la dans JALONS & FINS, onglet FINS ».
- 3 (un seul bouton accent) : retirée pour it1, reportée en it2.
- 4 (style copie locale) : maintenue. Utiliser Card / CardHead / Badge et des tokens `--*` lus dans `tokens/`, aucune valeur en dur.

DÉCISIONS EN AUTONOMIE
- Sortie d'un écran sans bouton → Échap pour quitter → si l'inverse, un écran de fin sans issue au clavier.
- Texte de mort en 2e personne → écrit par moi → si l'auteur veut le sien, il faudra un champ de dossier (hors Temps 1).

VERDICT FINAL — recevable sous réserve (repli invitant, tokens et composants existants, Échap comme issue en it1)
