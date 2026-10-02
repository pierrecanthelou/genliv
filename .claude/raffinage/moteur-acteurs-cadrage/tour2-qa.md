# Cadrage n°12 `moteur-acteurs` — Tour 2 — QA

## RÉPONSE AUX OBJECTIONS — nommées

### PM (Risque + Proposition it1)
« Une porte posée par l'auteur mais pas encore honorée par le moteur **doit se comporter comme fermée, jamais comme absente** — sinon un indice se révèle alors que l'auteur avait posé une condition que personne ne vérifie encore. »

### Narratif-IA (Annexe § B)
« Portes que l'itération ne sait pas encore évaluer : FERMÉES (fail-closed). […] **Inverser ferait fuir ces savoirs dès it2.** »

### Ma révision
**J'abandonne ma proposition « ouvert par défaut ». Elle crée un scénario de fuite silencieuse :**
1. Auteur écrit `Savoir { révélation { confiance_min: 2 } }` en it1.
2. Moteur n'évalue pas encore `confiance_min` en it1.
3. Sous ma règle ancienne : pas de porte câblée → savoir ouvert → **le secret sort sans condition**.
4. **Aucun test n'attrape ce défaut** tant qu'on n'écrit pas explicitement : « révélation avec porte non câblée = fermée ».
5. À it2, on ajoute l'évaluateur de `confiance_min`, mais trop tard — le savoir s'échappe déjà depuis it1.

C'est exactement le contre-type de ma propre règle de testabilité : une affirmation sur la couleur d'un test (« porte non câblée = fermée ») doit se *mesurer*, pas se *déduire*. Le PM et Narratif-IA l'ont vu.

**Verdict révision** : les deux coéquipiers ont raison. La règle est **fail-closed : toute porte de révélation posée par l'auteur mais non câblée par une itération donnée reste fermée**, jamais ignorée.

---

## MES CRITÈRES/KR MIS À JOUR

**Critères d'acceptation** (révisés) :
1. **Schéma R4** — Étant donné un appel R4 valide (description PNJ + historique), quand le moteur le décode, alors la sortie porte `{replique: string, indices_reveles: string[], delta_confiance: number}` exactement, validée en `worker/index.test.ts` (KR-233 appliqué). *(inchangé)*
2. **Portes de révélation : fail-closed + conjointes** — Étant donné un savoir ayant `confiance_min=2` ET `contrepartie(objet_x)` ET `apres_indice_y`, quand le moteur évalue la révélation : si les TROIS conditions tiennent, elle s'ouvre (test à 8 branches, 2³, dont seule vrai/vrai/vrai révèle). **Ajout fail-closed** : étant donné un savoir avec `confiance_min=2` posé par l'auteur, quand une itération n'évalue pas encore `confiance_min`, alors la révélation reste fermée — test : `Revelation {confiance_min:2}` injecté sans évaluateur câblé → `isOpen === false`, jamais ouvert par défaut. *(KR-280, périmètre étendu)*
3. **Portes avec jet** — Étant donné une porte `jet?:{carac, tc}`, quand elle s'ouvre dans la chaîne d'évaluation, alors le moteur appelle `issueDuJet` (unique site, `brain/dossier/arbitre.ts`) et utilise l'issue pour valider/refuser — jamais un second appel à `resolveChallenge` (KR-281). *(inchangé)*
4. **Indice idempotent** — Étant donné un indice déjà dans `session.indices_connus`, quand une révélation porte cet `indice_id`, alors la liste retournée à R4 ne le porte pas en doublon (no-op) — comparateur [avant,après] (KR-013). *(inchangé)*
5. **Audience avant injection R4** — Étant donné deux PNJ : A avec `secret(relation vers Z)==true`, B sans secret, quand `sessionDestinations` classe les champs de contexte, alors `monde.personnages[].relations[]` reste hors du contexte R4 pour qui n'en est pas le porteur, vérifié par une table d'audience (`sessionCouverture`, deux tests discriminants). **Ajout** : si une clé change d'audience (`auteur`→`ia` conditionnel, ex. `Personnage.nom`), la couverture d'audience est mise à jour en conséquence — sonde avant/après exécutée dans la revue d'itération. *(KR-282, étendu)*
6. **PNJ absent du lieu** — Étant donné un PNJ X non présent au lieu courant (ou déclaré mort), quand « parler X » est exécuté, alors une garde DE STRUCTURE refuse AVANT tout appel R4, jamais un « je ne suis pas là » produit par le modèle (KR-262 étendu). *(inchangé)*
7. **Repli en cas de sortie invalide R4** — Étant donné une réponse R4 non conforme au schéma, quand elle arrive au moteur, alors elle est REJOUÉE EXACTEMENT UNE FOIS puis dégradée en sortie neutre déterministe — verrou de tour tenu (KR-265), pas de corruption (KR-248/265 étendu). *(inchangé)*

**KR-279 à -283** (révisées pour absorber le fail-closed) :
- **KR-279** — La mécanique de confiance (bornes, calcul du delta, seuils) doit être ÉCRITE dans `docs/REGLES-DU-JEU.md` avant la première itération qui la consomme (KR-130) ; chaque critère qui la cite nomme sa section. *(inchangée)*
- **KR-280 — Portes de révélation : conjonction ET + fail-closed** — Les quatre portes se testent EN CONJONCTION, jamais OU ni partiellement. **Plus** : toute porte posée par l'auteur mais non câblée par une itération donnée est traitée comme FERMÉE — test explicite requis, jamais ouvert par défaut, jamais ignoré. *(étendu)*
- **KR-281** — `issueDuJet` reste l'unique site d'appel de `resolveChallenge` dans tout le dépôt ; témoin greppable. *(inchangée)*
- **KR-282 — Audience avant injection R4 + changements d'audience** — `EtatPnj.a_dit` et une `Relation.secret` hors de son porteur ne partent JAMAIS en contexte R4 — ligne `sessionDestinations` dédiée, deux tests discriminants de `sessionCouverture`. **Plus** : tout changement d'audience d'une clé existante (ex. `Personnage.nom`) est accompagné d'une sonde avant/après dans la revue d'itération. *(étendu)*
- **KR-283** — Sortie R4 invalide = rejeu une fois puis repli déterministe ; jamais de silence, jamais de corruption. *(inchangée)*

## VERDICT
**RECEVABLE** — veto initial levé.

Ma proposition sur le fail-closed était une faille de design transverse, pas une erreur locale de testabilité. Le PM et Narratif-IA l'ont interceptée en appliquant la doctrine même que j'emploie d'habitude.

Les trois conditions bloquantes de tour 1 restent :
1. Avant toute implémentation, ajouter une section « Confiance & Persuasion » à `docs/REGLES-DU-JEU.md` (bornes, formule du delta, seuils d'application) ; chaque itération y renvoie explicitement.
2. Confirmer en raffinage que `sessionDestinations`/`sessionCouverture` gardent `monde.personnages[].relations[]` hors du contexte R4 pour qui n'en est pas le porteur, et qu'aucune ligne n'expose `EtatPnj.a_dit` brut.
3. L'itération « porte jet » vérifie qu'aucun contexte de révélation n'isole une statistique du PNJ ou du héros — le CODE calcule l'issue, l'IA ne voit jamais la fiche.

Sans ces trois conditions : veto.

## Décisions prises en autonomie (Tour 2)
- Abandon de « savoirs sans porte = ouverts par défaut » → adoption du fail-closed → empêche une fuite silencieuse qu'aucun test implicite n'aurait attrapée.
- Extension de KR-282 pour couvrir les *changements* d'audience d'une clé existante, pas seulement la présence/absence d'un champ.
- Conservation des trois autres réserves de tour 1, sans relâchement ni durcissement.
