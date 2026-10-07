# QA — tour 1 · moteur-fins it2

RISQUE — Timing d'exécution (KR-305) — `validerSession` DOIT s'exécuter dans l'initialiseur de `useState`, AVANT la première écriture de `useSessionPersistee`. Si elle tourne en effet ou trop tard, les deux écritures se croisent et la garantie de validation avant persistence est perdue. Un test qui vérifie « la fonction existe » sans vérifier son MOMENT D'EXÉCUTION ne discrimine pas l'implémentation fautive.

OBJECTION —
1. Observable flou sur le périmé (critère 2). Le critère nomme le résultat mais omet le POINT D'INTÉGRATION de la comparaison : quand `DossierService.get` est-elle appelée ? Faux négatif vs faux positif ne se discriminent que si le timing est spécifié.
2. Discrimination des statuts insuffisante (critères 2–5). Quatre statuts doivent être testés en DISCRIMINANTS, pas dans une matrice unifiée. Un test unique à quatre branches rate les cas limites (KR-199).

PROPOSITION —
1. Timing explicite au critère 2 : vérifier que `DossierService.get(dossier_id)` n'est appelée qu'UNE FOIS au montage.
2. Découper la discrimination en quatre tests nommés (pas une matrice paramétrée) : absente, reprenable, perimee, illisible.
3. Ajouter un critère de non-régression : « moteurSansIA.test.ts reste vert. Aucun appel `fetch`, aucun import `CopiloteService`, aucune route `/ia/` n'entre dans le périmètre. » (KR-250/260).

VERDICT — recevable sous réserve. Les trois propositions doivent entrer dans le plan avant l'essaim.
