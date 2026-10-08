# dossier-repetition it1 — QA — Tour 2

**Réponse TL (9 témoins vs mes 5 assertions):**
QA accepte : tes 9 témoins détaillent précisément ce que j'ai nommé « scinder critère 3 ». Complémentaires, non redondants. Tes témoins tracent l'_ordre causal et les cas limites_ (`fin pas 0 / pas n`, `impasse pas 0 / pas ≥1`, reproductibilité graine) ; mes assertions sont les _classes d'états_ que le code doit tenir. Exemple : « Un rapport avec motif=fin est produit » c'est ma classe ; « Fin est atteinte au pas 0 ET au pas 30 » ce sont tes deux témoins du même motif. Tes 9 cas me permettent de nommer exactement mes 5 assertions au lieu de parler d'un vague « motif d'arrêt ». Prise de position : **accepter les 9 témoins, c'est valider ma scission**.

**Réponse PM (`ouverture_a_ecrire` inatteignable):**
QA accepte — c'est un gain d'instrumentation. Retirer ce critère du veto. Les 8 critères du capage couvrent les trois états visibles du panneau (invite / résultat / à corriger). Rien de testable ne se perd.

**Repositionnement de mes vetos:**

1. **Scinder critère 3:** MAINTENIR. PM, TL et tes 9 témoins l'ordonnent. it1 = {fin, impasse, combat_ouvert, pas_max}, it2 = {mort, combat_sans_issue}.

2. **moteurSansIA.test.ts (critère 10):** DURCIR. Préciser : « `src/features/dossier-repetition/utils/` n'entre **pas** dans RACINES_DU_PERIMETRE — tes 9 témoins supposent `repeter` isolé. Le test vise seul le périmètre player + brain/moteur, jamais utils/. Zéro 4e racine en it1. »

3. **KR-312 (combat_ouvert):** MAINTENIR ET DURCIR. C'est ton témoin « combat_ouvert avec monstre_ref ». Ajouter critère : « Un rapport motif=combat_ouvert arrête la boucle, l'état du panneau demeure 'à corriger'. L'accès ne devient pas 'non jouable'. »

**Verdict:** Recevable sous réserve : les 8 critères PM ventilataires, tes 9 témoins nommés en L2, scission actée avant code.
