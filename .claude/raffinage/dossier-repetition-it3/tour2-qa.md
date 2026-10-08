# QA — dossier-repetition it3, tour 2

RÉPONSES AUX AUTRES
- [TL] Critères 3,7,9 périmés → acquiescer. Exclure de la spec, relever la numérotation.
- [UX] États vides → acté. Trois états observables et testables.
- [NIA] trace + `lieux_visites` → acté pour la testabilité.

STATUT DE MES OBJECTIONS
1. Critère #8 non observable → RETIRÉE (co-présence `presence[].lieu_id ∈ lieux_visites` rend le critère observable)
2. État aucun blocage → RETIRÉE (UX a spécifié les trois états vides)
3. ListeConstats/dépliable → RETIRÉE (in-scope/out-scope clarifié)
4. Niveau de test → RETIRÉE (un seul lot, signatures claires)
5. Définition de fini → MAINTENUE (critères observables, KR couvertes, cas limites, pas de mutation car brain/ pas touché)

VERDICT FINAL — recevable sous réserve (retirer critères périmés, écrire définition de fini)
