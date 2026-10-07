# Narratif & IA — tour 2 · moteur-fins it2

## Réponses nommées

- **PM O1 (veto mort hors it2)** : accepté. La mort porte un contrat narratif complet, noyer dans la reprise.
- **TL O1 (`lire(dossier)`)** : sain. Comparaison `dossier_maj` empêche un contexte empoisonné.
- **TL O3 (`illisible` sans `refus`)** : accepté. Pas de lecteur narratif.
- **UX O2 (un seul verbe)** : accepté. « Nouvelle partie » est neutre, du moteur pas du récit.

## Mes objections

- **O1 (texte de mort)** : **REPORTÉE** vers it3. Proposition intacte : `TEXTE_MORT_HEROS`, voix factuelle, ligne de journal.
- **Réserve `validerSession` / forme de `memoire`** : **MAINTENUE** dans it2. Vérifier forme de `memoire` (null | MemoireSession), `faits_etablis` tableau, `resume.texte` string, `resume.jusqu_au_pas` nombre. Sans cette vérification, JSON corrompu passe `reprenable` et empoisonne le contexte modèle.

## ANNEXE — Contrat de sortie IA

**AUCUN.** It2 est 100 % code, 0 % IA. La frontière tient.
