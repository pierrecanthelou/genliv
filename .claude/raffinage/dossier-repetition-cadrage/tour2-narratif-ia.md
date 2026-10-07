# Cadrage n°16 `dossier-repetition` — Tour 2 — Narratif & IA

**Au TL « rien à extraire »** : accepté. Les fonctions pures sont des imports distincts. L'extraction aurait créé une abstraction à un seul vrai appelant.

**Au PM « indices retirés »** : confirmé. consignerReponseActeur exige recit (texte modèle) et indicesReveles (choisis par R4). Sans IA, aucun des deux n'existe.

**Domicile features/** : compatible. Zéro contrat IA, zéro sortie modèle.

**Mes objections**
1. Extraction en fonctions pures : **retirée**.
2. PNJ via consignerReponseActeur : **retirée** (sans IA, pas simulable).
3. PNJ fermé absorbe 20 pas : **maintenue**, reportée à it3.
4. Mots pris : **retirée** (consensus « non atteint en 20 pas »).

VERDICT : recevable. Zéro contrat IA.
