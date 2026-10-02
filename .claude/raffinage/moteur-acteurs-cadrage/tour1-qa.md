# Cadrage n°12 `moteur-acteurs` — Tour 1 — QA

## RISQUE
L'absence de mécanique de confiance dans `docs/REGLES-DU-JEU.md` crée une chaîne de dépendance circulaire invisible : une itération qui sort des critères avant que la doc l'expose les écrira sur des chiffres déduits du code, pas l'inverse (KR-130 inversé). Les quatre portes de révélation (confiance_min, jet, contrepartie, apres_indice_id) doivent être évaluées **en conjonction** (ET logique), et tout test qui ne prouve qu'une porte seule laisse passer des bugs de court-circuit. Enfin, R4 reçoit un contexte qui ne doit jamais inclure `EtatPnj.a_dit` brut ni les secrets de relations — c'est une projection, pas un reflux ; l'absence de garde sur cette audience duplique le piège de moteur-arbitre it2 (BUG-138), et l'ajout de sessionDestinations/sessionCouverture est obligatoire, pas optionnel.

## OBJECTION
1. **Mécanique de confiance non arbitrée.** Le roadmap nomme `delta_confiance` dans la sortie R4 sans énoncer bornes, formules, seuils ni condition d'application. KR-130 exige une source écrite. Tant que `docs/REGLES-DU-JEU.md` ne porte pas une section « Confiance & Persuasion » citée explicitement dans chaque critère qui la consomme, aucun critère n'est observable — on valide du code, pas un contrat de jeu.
2. **Flou sur le contrat R4.** La signature `{replique, indices_reveles, delta_confiance}` — `delta_confiance` est-il un nombre atomique ou `{pnj_id, delta}` ? Qui l'accumule, le moteur ou l'appelant ? Contrat de worker inachevé = contrat de route inachevé.
3. **Isolation audience de R4.** Aucun critère ne nomme que R4 ne reçoit JAMAIS la fiche du PNJ (nom, stats, relations secrètes). C'est une tension transverse de KR-232/262, et elle touche sessionDestinations + deux tests de couverture : sans les nommer, le critère laisse filer une fuite qui n'apparaît qu'en playtest.

## PROPOSITION

**Critères d'acceptation** (chacun observable par jest + contrats) :
1. **Schéma R4** — Étant donné un appel R4 valide (description PNJ + historique), quand le moteur le décode, alors la sortie porte `{replique: string, indices_reveles: string[], delta_confiance: number}` exactement, validée en `worker/index.test.ts` comme pour les 9 autres rôles (KR-233 appliqué).
2. **Portes de révélation conjointes** — Étant donné un savoir ayant `confiance_min=2` ET `contrepartie(objet_x)` ET `apres_indice_y`, quand le moteur évalue la révélation, alors elle n'est acceptée que si LES TROIS conditions tiennent [confiance ≥2, joueur possède objet_x, indices_connus contient indice_y] — test à 8 branches (2³) dont seule la combinaison (vrai,vrai,vrai) révèle (KR-280).
3. **Portes avec jet** — Étant donné une porte `jet?:{carac, tc}` sur une révélation, quand elle s'ouvre dans la chaîne d'évaluation, alors le moteur appelle `issueDuJet` (unique site, `brain/dossier/arbitre.ts`) et utilise l'issue pour valider/refuser la révélation — jamais un second appel à `resolveChallenge` (KR-281).
4. **Indice idempotent** — Étant donné un indice déjà dans `session.indices_connus`, quand une révélation porte cet `indice_id`, alors la liste retournée à R4 ne le porte pas en doublon (no-op) — test comparateur [avant,après] `indices_connus` (KR-013 appliqué).
5. **Audience avant injection R4** — Étant donné deux PNJ : A avec `secret(relation vers Z)==true`, B sans secret, quand `sessionDestinations` classe les champs de contexte, alors `monde.personnages[].relations[]` reste hors du contexte R4 pour la cible/un tiers (jamais injecté hors de son porteur) et une table d'audience (`sessionCouverture`) le vérifie (KR-282).
6. **PNJ absent du lieu** — Étant donné un PNJ X non présent au lieu courant (ou déclaré mort), quand « parler X » est exécuté, alors une garde DE STRUCTURE refuse AVANT tout appel R4, jamais un « je ne suis pas là » produit par le modèle (KR-262 étendu).
7. **Repli en cas de sortie invalide R4** — Étant donné une réponse R4 non conforme au schéma, quand elle arrive au moteur, alors elle est REJOUÉE EXACTEMENT UNE FOIS puis dégradée en une sortie neutre déterministe (`replique` de repli, `indices_reveles: []`, `delta_confiance: 0`) — verrou de tour tenu (KR-265), pas de corruption (KR-248/265 étendu, pattern moteur-arbitre it2).

**KR-279 à -283** :
- KR-279 — La mécanique de confiance (bornes, calcul du delta, seuils) doit être ÉCRITE dans `docs/REGLES-DU-JEU.md` avant la première itération qui la consomme (source de vérité, KR-130) ; chaque critère qui la cite nomme sa section, sinon il est irrecevable.
- KR-280 — Les quatre portes de révélation se testent EN CONJONCTION (ET), jamais OU ni partiellement — contre-épreuve unitaire qui simule une seule porte vraie / le reste faux.
- KR-281 — `issueDuJet` reste l'unique site d'appel de `resolveChallenge` dans tout le dépôt ; témoin greppable.
- KR-282 — `EtatPnj.a_dit` et une `Relation.secret` hors de son porteur ne partent JAMAIS en contexte R4 — ligne `sessionDestinations` dédiée au bloc pnj, deux tests discriminants de `sessionCouverture` avec deux PNJ distincts.
- KR-283 — Sortie R4 invalide = rejeu une fois puis repli déterministe ; jamais de silence, jamais de corruption.

**Découpage itératif indicatif** (le roadmap propose 4, non contraignant) :
- **It1** (contrat + minimal) : type de réponse acteur, `EtatPnj.confiance?` optionnel posé avec son premier lecteur, branche R4 au worker + `CopiloteService`, savoirs sans évaluation de porte (aucune révélation conditionnée encore).
- **It2** (portes structurées sans jet) : `confiance_min`, `contrepartie`, `apres_indice_id` évalués en conjonction.
- **It3** (porte jet) : intégration `issueDuJet` — vigilance à ne jamais faire fuiter une stat du PNJ.
- **It4** (polish / cas limites) : repli déterministe, carnet d'indices si porté par cette feature.

## VERDICT
Recevable sous réserve — trois conditions bloquantes :
1. Avant toute implémentation, ajouter une section « Confiance & Persuasion » à `docs/REGLES-DU-JEU.md` (bornes, formule du delta, seuils d'application) ; chaque itération qui la consomme y renvoie explicitement (KR-130).
2. Confirmer au raffinage que `sessionDestinations`/`sessionCouverture` gardent `monde.personnages[].relations[]` hors du contexte R4 pour qui n'en est pas le porteur, et qu'aucune ligne n'expose `EtatPnj.a_dit` brut hors de son usage prévu.
3. L'itération « porte jet » vérifie auprès du précédent `moteur-arbitre` qu'aucun contexte de révélation n'isole une statistique du PNJ ou du héros : le CODE calcule l'issue, l'IA ne voit jamais la fiche.

Sans ces trois conditions : veto — mécanique non documentée, audience non gardée, risque de second site de résolution.
