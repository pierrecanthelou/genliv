RISQUE — le risque majeur est une répétition de KR-199 sous une forme à 4 portes : un test « lecture au montage » qui ne pose qu'une ou deux des quatre portes (ex. seulement `jet`) prouverait la lecture d'un sous-ensemble en se faisant passer pour la preuve des quatre — exactement le motif BUG-068 (« les 8 » prouvé sur 3, échantillon recouvrant). `revele_si.apres_indice_id` ajoute un cas limite neuf non couvert par le précédent `relationsPresence.test.tsx` : la porte doit EXCLURE l'indice propre au savoir (self-exclusion), donc un dossier à un seul indice total doit afficher l'état vide alors que `monde.indices.length !== 0`.

OBJECTION — le critère racine #6, tel qu'écrit, a un Étant-donné/Alors incohérent : « un savoir portant un `revele_si.jet` » n'établit rien sur `confiance_min`/`contrepartie`/`apres_indice_id`, et pourtant l'Alors conclut que « les 4 portes ... sont éditables ». Une seule scène ne peut pas prouver les quatre. Le critère doit se scinder en un scénario par porte, ou porter explicitement « chacune des 4 portes s'ajoute/se retire indépendamment, prouvé séparément » — sinon un unique test vert masquera 3 portes sans preuve, comme KR-197 le documente pour les propriétés à deux moitiés.

PROPOSITION — nommer, avant code : (1) le test de montage à 2 personnages et 4 portes simultanément non fabricables (annexe) ; (2) les 3 états vides distincts (indices, objets, self-exclusion d'`apres_indice_id`) ; (3) une phrase de doctrine explicite « aucun RefusEnCours possible sur ce bloc » (précédent it1/it3, sinon test manquant) ; (4) `wc -l` avant/après sur `FichePersonnage.tsx`/sous-hooks reporté dans la revue, `BlocSavoirs.tsx` créé avant son contenu (KR-112).

VERDICT — recevable sous réserve.

---

## ANNEXE — tests nommés

1. **"lecture au montage sans interaction, 4 portes non fabricables, deux personnages distincts"**
   Niveau : composant (RTL). Sème 2 personnages avec chacun un savoir aux 4 portes renseignées à des valeurs impossibles à produire par défaut widget (`confiance_min != 0`, `carac`/`tc` non-premiers de leur registre, `objet_id` + `consomme:true`, `apres_indice_id` = un second indice) ; monte sans clic ; affiche le premier ; sélectionne le second par clic de ligne. Preuve KR-199/critère racine #11.

2. **"porte indice prealable exclut l'indice propre au savoir (self-exclusion)"**
   Niveau : composant. Un seul indice au total = celui référencé par `indice_id` ; le Select de la porte `apres_indice_id` est absent / état vide, même si `monde.indices.length !== 0`. Cas limite référence orpheline évitée par construction.

3. **"etat vide monde.indices : tout le corps du bloc Savoirs est remplace, aucun bouton d'ajout"**
   Niveau : composant. `monde.indices = []`. `TEXTE_AUCUN_INDICE_CANON` affiché seul.

4. **"etat vide monde.objets : seule la porte contrepartie est indisponible, le reste du bloc reste actif"**
   Niveau : composant. indices non vide, `objets = []`. `TEXTE_AUCUN_OBJET_CANON` scoping local.

5. **"ajout d'un savoir pose indice_id sans ecrire, chaque porte s'ajoute et se retire independamment"**
   Niveau : composant. Reprend le patron Select-comme-geste-d'ajout de `relationsPresence.test.tsx` (`updateSpy` non appelé avant premier champ committant) ; retirer une porte (ex. confiance) laisse les 3 autres intactes — 4 assertions séparées, pas une assertion groupée.

6. **"ecriture sur DEUX personnages, aucune fuite d'indexation — savoirs"** (si un état de refus existe) OU note de doctrine explicite dans le plan si aucun `RefusEnCours` n'est possible sur ce bloc (précédent it1/it3, KR-197 n'a alors pas d'objet ici — à écrire noir sur blanc, pas supposé).

7. **Non-régression** : "le dossier de reference (6 personnages) reste accepte par validateDossier sans modification de champs hors savoirs[]" — critère racine #8, niveau contrat/brain — à réexécuter même si zéro lot contrat attendu (vérifie que `tables.ts`/`destinations.ts` déjà écrits ne bougent pas silencieusement).

8. **Def-de-fini non-jest** : `wc -l` sur `FichePersonnage.tsx` et `useEcriturePersonnages.ts`/sous-hooks relevé dans la revue avant/après le lot ; `BlocSavoirs.tsx` créé avant que son contenu ne soit écrit dans `FichePersonnage.tsx` (KR-112, note du plan).
