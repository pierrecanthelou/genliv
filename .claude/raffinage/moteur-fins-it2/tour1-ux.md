# UX — tour 1 · moteur-fins it2

RISQUE — Le chemin dominant n'est pas « F5 » mais « session périmée ». L'auteur édite puis teste, à chaque fois. S'il ressemble à une panne ou exige la souris, l'Aperçu devient pénible. Second risque : un Entrée spammé pendant un combat saute l'écran de mort si le bouton prend le focus.

OBJECTION —
1. Le goal ne dit pas où se déclenche « Nouvelle partie ». Aucun bouton n'existe.
2. Trois verbes (Recommencer, Nouvelle partie, Rejouer) désignent des gestes voisins. it3 réserve « Rejouer » à la même graine.
3. `Modal` n'a ni focus initial ni Entrée, donc le dialogue dangereux est incomplet au clavier.
4. Le goal omet mort, bandeau et bouton de relance (reports d'it1).
5. Un bouton accent inline serait copié une cinquième fois.

PROPOSITION —
- Un seul verbe : « Nouvelle partie ». IconButton ↻ en entête + dialogue `color="error"` avec Annuler.
- Étendre `EcranRefus` avec 2 codes (`session_perimee`, `session_illisible`).
- Extraire le style du bouton accent en constante partagée.
- Étendre `Modal` d'une prop `initialFocus?: 'cancel' | 'confirm'`.
- Focus sur la région de fin/mort (pas sur le bouton), focus sur le bouton pour périmée/illisible.
- `BandeauHeros` conservé sur fin et mort. EcranFin dans la colonne de 640.
- Mort : constante `TEXTE_MORT_HEROS` en `--text-strong`, zéro `--bad`.

VERDICT — recevable sous réserve (Modal, libellés unifiés, extension d'EcranRefus).

## ANNEXE — Contrat de design

### Refus de session (EcranRefus étendu)
- `session_perimee` : titre « Cette partie n'est plus à jour », texte explicatif, bouton `↻ Nouvelle partie`.
- `session_illisible` : titre « Cette partie ne peut pas être lue », bouton `↻ Nouvelle partie`.
- Aucun dialogue (rien de récupérable).

### Nouvelle partie sur partie en cours
- IconButton ↻ en `actionsEntete`, après 🗝, avant ✕.
- `Modal confirmTone="error"`, titre « Abandonner la partie en cours », Annuler + Nouvelle partie.

### Écran de mort
- h2 `MORT · {heros.name}`, OutcomeBlock, constante `TEXTE_MORT_HEROS`.
- Bouton primaire `↻ Nouvelle partie`, sans dialogue.

### Clavier
- Dialogue : focus initial sur Annuler. Échap ferme le dialogue seul.
- Fin/mort : focus sur la région de lecture.
- Périmée/illisible : focus sur le bouton.
