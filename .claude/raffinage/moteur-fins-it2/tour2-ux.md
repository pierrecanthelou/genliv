# UX — tour 2 · moteur-fins it2

## Réponses nommées

- **TL O1/O2 (EcranReprise, AiguillagePartie)** : session valide se reprend sans interstitiel. Périmé/illisible : pas de choix, pas d'écran à part → j'étends EcranRefus. Point concédé : `TITRE_REFUS` est une constante unique, elle devient un champ `titre` du descripteur.
- **PM O1 / TL O5 (sortir la mort)** : d'accord. O4 retirée pour la mort. Maintenue pour le bandeau et le bouton de relance.
- **QA O1 (timing périmé)** : l'écran de refus/reprise doit être posé avant tout rendu de contenu périmé.
- **NIA O1 (`TEXTE_MORT_HEROS`)** : reporté en it3.

## Mes objections

- O1 (pas de bouton) : **maintenue**.
- O2 (un seul verbe) : **maintenue**.
- O3 (Modal focus initial) : **DURCIE EN VETO**. Dialogue dangereux incomplet au clavier.
- O5 (bouton accent copié) : **maintenue**.

Risque résiduel : session 0 PV reprise en it2 sans traitement (it3).

## ANNEXE — Contrat de design mis à jour

- `session_perimee` : titre « Cette partie n'est plus à jour », bouton `↻ Nouvelle partie`.
- `session_illisible` : titre « Cette partie ne peut pas être lue », bouton `↻ Nouvelle partie`.
- Nouvelle partie sur partie en cours : `IconButton` ↻, `Modal` avec `focusCancel`, titre « Abandonner la partie en cours ».
- Reprise valide : aucun interstitiel, `BandeauHeros` conservé.
- Retiré d'it2 : écran de mort, `TEXTE_MORT_HEROS`.
