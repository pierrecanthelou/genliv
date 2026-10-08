# dossier-repetition it1 — UX — Tour 2

RÉPONSE À Tech Lead, objection 2 (« Rejouer à l'identique » sans effet). Raison : résultat dérivé en ligne, rejouer la même graine redessine le même écran. Bouton sans effet = faute d'interface. **RETIRÉ.** Un seul bouton après lancement : `Relancer`. Soutient aussi le veto n°1 (domaine `'repetition'`).

RÉPONSE À PM, objection 3 (`ouverture_a_ecrire`). D'accord : un seul état de refus. Inatteignable derrière `jouable`. Copie factuelle adoptée.

MES OBJECTIONS
1. Risque « message positif » : **RETIRÉE**. PM aligné, copie factuelle.
2. `Chip`/`CardHead` absents : **RETIRÉE**. Intégré au contrat (Badge neutre, eyebrow local).
3. « 4 états » faux : **RETIRÉE**. 3 états : invite, résultat, à corriger.
4. Cible du lien : **MAINTENUE**. Lien vers `bloquants[0].section`.
5. Vocabulaire : **MAINTENUE**. « Arrêt » partout, « impasse » pour le motif seul, « blocage » nulle part.
6. Échap : **RETIRÉE**. Pas une modale.

VERDICT : recevable, sans veto.

Contrat révisé :
- **Invite** : fond `--accent-bg`, bordure pointillé `--accent-line`. « Lancez la répétition : un joueur synthétique parcourt votre dossier et vous dit où il s'arrête. »
- **À corriger** : eyebrow `RÉPÉTITION IMPOSSIBLE`, message du bloquant, lien « Corriger dans {section} ».
- **Résultat** : eyebrow `ARRÊT — PAS {n} SUR 20`, titre/corps par motif, ListRow du lieu.
- **Boutons** : `Lancer la répétition` avant, `Relancer` après. Focus auto sur primaire.
- **Interdits** : `--good*`, `--bad*`, valeurs en dur.
