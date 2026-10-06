# Narratif & IA — tour 2 — moteur-horloge it3

**Réponses nommées** :
- TL O3 (Sélène/Corvin inatteignable) : confirmé. Contenu mort = panne silencieuse. Sonde jest nécessaire. Vérifier que le validateur avertit d'un `si_bloque` orphelin sans `duree`.

**Statut des objections** :
1. Front `===` : **maintenue**. Unanimité.
2. Origine 0 : **RETIRÉE**. Le TL a raison : inventer un `depuis` que personne n'a écrit viole le contrat it2. La réponse est le validateur + la sonde, pas le moteur. `si_bloque` sur étape 0 sans avancement = contenu mort, le linter le signale.

**Points nommés** :
- Nom du prédicat : adopte `etapeBloqueeAuPas` (TL).
- `destinations.ts` : déjà correct (l.224 `si_bloque: 'ia'`). Docstrings à amender : `narrateur.ts:96` et `contexte/horloge.ts:42`.
- Invite du worker : pas une dette. `PENDANT CE TEMPS` n'est cité par aucune invite.
- Budget : `si_bloque` REMPLACE `action` (sélections disjointes). M reste sous 2334 si `si_bloque` plus courts que `action` les plus longues — à MESURER. Palier 7000 tient si M ≤ 2333.

**Contrat IA mis à jour** : sélection PENDANT CE TEMPS en deux chemins disjoints (avancé → action, bloqué → si_bloque, jamais les deux). `CHEMIN_SI_BLOQUE` constante propre. Schéma de sortie INCHANGÉ. Journal = relevé d'état, pas de prose `si_bloque` dedans.

**VERDICT** : recevable.
