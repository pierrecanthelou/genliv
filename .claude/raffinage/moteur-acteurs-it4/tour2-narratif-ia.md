# Narratif & IA — moteur-acteurs it4, tour 2

RÉPONSE À Tech Lead obj 1 — Tri-état `sous_epreuve` est le bon concept. Évaluation de `jet` EN DERNIER non négociable. Durci : `sous_epreuve` doit être un état de SORTIE de `evaluerSavoir`, pas un paramètre d'entrée. `savoirSousEpreuve` du Tech Lead fait exactement ça. Opt-in `peutResister` : verrou qui empêche la boucle R4-jet-R4-jet. Accord total.

MES OBJECTIONS :
1. Maintenue — condition levée. L'appel 2 EXIGE le rang dû dans `indices_reveles`. Opt-in `peutResister: false` sur l'appel 2 + rang dû le garantissent au type. Plus un veto conditionnel.
2. Retirée — convergence sur `savoirSousEpreuve`. Un seul décideur. `{carac, tc}` lu dans `revele_si.jet`.
3. Maintenue, durcie en exigence — § 6 doit couvrir : (a) porte `jet` mise en jeu en dernier ; (b) challenge ordinaire § 2 ; (c) XP selon § 5 ; (d) réussite acquise pour la session ; (e) re-tentative possible au pas suivant.

Décisions :
- `formulation_joueur` exclue de l'appel 1. Bloc `CE QUE TU GARDES` = ligne constante sans prose d'auteur.
- Ligne d'issue appel 2 écrite par le code, pas par R4.
- Enjeux non mémorisés dans `TU AS DIT`.

VERDICT — Recevable sous réserve : § 6 écrit, opt-in, `sous_epreuve` dans `evaluerSavoir`, rang dû exigé au type.
