# UX Designer — moteur-combat it1 — Tour 2

## Réponses aux objections croisées

**TL (extensions dans le lot feature) et PM (DÉFAITE terminale).** Les deux fichiers sont dans brain/components/. Extension strictement additive, sans changement de comportement pour les appelants existants.

**Découverte.** IconButton.tsx:49 écrit fontSize: '11px' en dur. Le lot remplace par le token --fs-* réel.

## Statut de mes objections

1. **Pas de bouton plein** : maintenue. Extension : prop wide sur IconButton, tone accent.
2. **État vide du journal** : durcie en veto. Texte : « Le combat commence. Choisissez une posture, puis lancez le round. »
3. **Tutoiement** : durcie en veto, vouvoiement partout.
4. **« Prochain round → »** : retirée.
5. **SegmentedControl sans flèches** : maintenue.

## Rendu exact après DÉFAITE

- Badge ton neutre : DÉFAITE.
- Ligne mono : PARTIE TERMINÉE — Échap ou « Quitter le test ».
- Aucun bouton d'action. Les commandes disparaissent.
- Le focus passe sur « Quitter le test ». Échap ferme.

**VERDICT** : approuvé sous réserve de la correction du 11px et du vouvoiement.
