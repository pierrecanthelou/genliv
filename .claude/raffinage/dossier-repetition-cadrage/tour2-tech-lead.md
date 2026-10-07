# Cadrage n°16 `dossier-repetition` — Tour 2 — Tech Lead

**À NIA, extraire la chaîne** : le pur est déjà factorisé. useTourDeJeu est 460 lignes d'orchestration asynchrone IA. Les fonctions pures (executerCommande, ouvrirRencontreSiDue, finAtteinte) sont des imports distincts. Divergence gérée par les mêmes imports, pas par une extraction commune.

**Domicile : tranché.** `features/dossier-repetition/utils/`. Pas brain/ (arête brain→player). Pas player/engine/ (gonfle le runtime extractible).

**PM contre moi (it1)** : je cède. it1 = aller seul. Mais :
- (a) Le héros est posé dès it1 (sans heros, resoudreRencontre rend la session inchangée).
- (b) L'arrêt `combat_ouvert` est testé et jamais compté en blocage.

**Mes objections**
1. (rien à extraire) : **maintenue**, précisée.
2. (exécuteur pas dans brain/) : **maintenue** (PM et UX écrivent encore « module du brain »).
3. (verdict pas dans CONTROLES) : **retirée** (PM sort la règle en dette).

**VERDICT** : recevable, 3 itérations, zéro lot `contrat`.

Signatures, lots révisés et témoins nommés en annexe.
