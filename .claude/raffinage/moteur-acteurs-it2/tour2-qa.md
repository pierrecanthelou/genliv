# Raffinage `moteur-acteurs` it2 — Tour 2 — QA

## RÉPONSE AUX OBJECTIONS — nommées

**Veto sur `consomme:true`** — Narratif-IA ferme `consomme:true` en it2 (le modèle ne doit jamais décider de retirer un objet du joueur). Le code it2 rejettera toute sortie R4 comportant une révélation d'un savoir gardé par `contrepartie.consomme:true`. Ajouté au critère #3/#4.

**Polarité inversée de `porteOuverte`** — Confirmé par lecture de `atteignabilite.ts:282` : `revele_si === undefined → true`, sémantique éditoriale (« pas de porte posée = pas d'obstacle lint »). Au runtime de révélation c'est l'inverse : « pas de porte = jamais révélé ». Narratif-IA (§A, point 2) le dit déjà. Un indice sans `revele_si` ou avec `{}` doit retourner `absent`, jamais `revelable` par vacuité — recopié au critère #5/#8.

**Cas limites du § J/K non couverts** — Sept nouveaux cas séparateurs : (1) savoir sans porte → `absent` ; (2) deux portes vraies mais `confiance_min` posé → `absent` ; (3) deux portes vraies mais `jet` posé → `absent` ; (4) portes ouvertes mais indice sans `formulation_joueur` → `absent` du contexte ; (5) `formulation_joueur` vide/whitespace → `absent` ; (6) `consomme:true` en sortie R4 → TOUTE la sortie refusée, `rang-inconnu` ; (7) rang hors `rangsOuverts` (ou pris dans « déjà confié ») → `rang-inconnu`, toute la sortie refusée y compris réplique.

**Schéma de sortie strict** — `indices_reveles: string[]` (rangs, jamais ids) + `replique: string`, tous deux obligatoires ; longueur ≤ `REVELATIONS_PAR_REPLIQUE_MAX=1` ; liste vide = succès ; validation AVANT application.

**Prérequis fixture** — Mesuré sur `dossier-reference.json` : aucun PNJ ne porte un savoir révélable par `contrepartie`(consomme:false)+`apres_indice_id` en conjonction. Tobin porte `trace-du-guet` avec `consomme:true` (fermé en it2). Mira porte `sceau-brise-a-nouveau` avec `confiance_min`+`apres_indice_id` (confiance_min fermée). La fixture doit être enrichie d'un tiers savoir testant la vraie conjonction ET requise en it2.

**Assembleur et re-résolution** — `assemblerActeur` rend `ReadonlyMap<RangInjecte, indice_id>`, seul lecteur `validerActeur(brut, dossier, rangsOuverts)`. Les rangs ne s'échappent jamais vers la feature — identifiants re-résolus, livrés à `ReponseActeur.indices_reveles: string[]`. Un test d'assembleur valide cette porte.

## MES CRITÈRES/TESTS MIS À JOUR

**Huit critères observables (CONTRAT + RTL) :**

1. **Deux portes en conjonction (ET)** — scénario séparateur obligatoire. CONTRAT `evaluate.test.ts` : Cas A (contrepartie seule vraie) → `absent` ; Cas B (apres_indice_id seule vraie) → `absent` ; Cas C (les deux vrais) → `revelable` ; Cas D (les deux vrais + confiance_min posé) → `absent` ; Cas E (les deux vrais + jet posé) → `absent`.
2. **Idempotence** — CONTRAT + RTL `CarnetIndices.test.tsx` : réclamer le même savoir deux fois → une ligne du carnet.
3. **Isolation du bloc « déjà confié »** — CONTRAT `evaluate.test.ts` : `indice_id ∈ a_dit[pnj]` → état `deja_confie`, testé EN PREMIER, aucun rang, sans didascalie, résiste même si une porte se referme après.
4. **Rejet atomique sur `consomme:true`** — CONTRAT `validerActeur.test.ts` : sortie proposant un indice gardé par `contrepartie.consomme:true` → refus `schema`, TOUTE la sortie refusée, aucun `reveler_indice`/`a_dit` écrit.
5. **Rangs validés dans `rangsOuverts`** — CONTRAT `validerActeur.test.ts` : chaque élément de `indices_reveles` ∈ `rangsOuverts` (jamais le bloc « déjà confié ») ; hors table → `rang-inconnu`, toute la sortie refusée.
6. **Indices sans contenu écrit restent absents du contexte** — CONTRAT `evaluate.test.ts`+`assemblerActeur.test.ts` : `formulation_joueur` absente/vide → `absent`, zéro ligne « CE QUE TU PEUX CONFIER ». Mesure fixture : `indice.lettre-de-la-vigie` (savoir de Sélène) n'a pas de `formulation_joueur`.
7. **Carnet dérivé du journal, jamais de l'état** — RTL `CarnetIndices.test.tsx` : chaque ligne = jointure sur `session.journal[].deltas` filtré `reveler_indice`/`applique` ; libellé dérivé du journal, jamais `monde.indices[].nom` ; aucun état nouveau ; vide → invite, zéro ListRow.
8. **Périmètre des trois portes fermées** — CONTRAT `evaluate.test.ts` : `confiance_min`/`jet` posés → `absent` en it2, jamais ouvert par défaut (vacuité).

**Instruments** : `evaluate.test.ts` (8 branchements) + `assemblerActeur.test.ts` (isolation 2 PNJ) + `validerActeur.test.ts` (schéma, rangs hors table, `consomme:true`) + `schemaSortie.test.ts` (littéraux) + RTL `CarnetIndices.test.tsx` + RTL `PlayerInputBar.test.tsx` (refus avant R4) + mutation `&&` sur la conjonction.

**Décisions prises en autonomie** : rang `S<n>` recalculé par appel, jamais persisté (chaque test construit sa propre table) ; bloc « CE QUE TU PEUX CONFIER » = seuls les rangs révélables, bloc « DÉJÀ CONFIÉ » = sans rang, isolation stricte ; `indices_reveles` porte des identifiants, jamais des rangs bruts qui fuiraient vers la feature ; `formulation_joueur` vide ≠ absente, les deux donnent `absent` (sécurité) ; rang inventé = rejet atomique.

## VERDICT

**RECEVABLE SOUS RÉSERVE STRICTE** de quatre actions :
1. Avant le code : enrichir `dossier-reference.json` d'un PNJ présent portant un savoir révélable par `contrepartie`(consomme:false)+`apres_indice_id` en conjonction ET (zéro cas aujourd'hui).
2. Au lot contrat : trois indices présents, dont un avec `formulation_joueur` vide et un sans `revele_si`.
3. Les cinq cas A→E du scénario séparateur doivent chacun être une branche distincte d'un contrat unique tuant OU.
4. Vérification technique : confirmer que `porteOuverte` n'est jamais réutilisée au runtime de révélation (seul appel actuel : `atteignabilite.ts:282`, usage éditorial) — grep à l'appui, sinon violation de contrat grave.

Pas de nouveau contrat Dossier (`types.ts`/`destinations.ts`/`validate.ts` restent intouchés) — it2 n'étend que le runtime, pas le schéma éditeur.
