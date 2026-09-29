TOUR 2 — QA — moteur-interprete it2/4 — RÉPONSE AUX TRANCHES EXPLICITES

### RÉPONSE AUX OBJECTIONS

**Point 1 : Architecture R1+exécution+R3**
Tech Lead a décidé et écrit précisément : R3 dans le même try que R1, juste après onSessionChange(S1), verrou KR-265 étendu, console refusée pendant le vol, motif .demander( ajouté à la garde. Cela lève complètement la réserve (qui demandait exactement cette clarté architecturale). ✓ LEVÉE.

**Point 2 : faits_etablis et critère #7**
Tech Lead et narratif-ia s'alignent : faits_etablis n'a aucun lecteur en it2 (memoire=null en it2, arrive en it3), donc sort du schéma de sortie de R3. Conséquence : **le critère #7 de la spec DOIT être retiré du périmètre covert par it2** et reporté à it3 avec sa structure de test (mutant, table d'ancrages, validerNarrateur). Les scénarios séparateurs pour consignerRecit/avecRecit et sortie narrateur sont précis et cohérents. ✓ COHÉRENT, AVEC RETRAIT EXPLICITE #7.

**Point 3 : Chip cliquable et testabilité de suggestions[]**
Retrait de la Chip simplifie la testabilité : texte brut se teste avec getAllByText (simple), Chip nécessite gérer état disabled + handlers + rendu conditionnel (deux niveaux). Mais UX a un contrat écrit pour un Chip de it2. **C'est une décision Produit/UX à trancher maintenant**, pas un défaut de plan. Si Chip quitte it2 → lot feature passe de 4 à 3 fichiers → contrat UX devient contrat it3. ✓ SIMPLIFICATION RÉELLE, DÉCISION À TRANCHER.

**Point 4 : Défaut latent d'it1 en PlayerInputBar**
Constat du Tech Lead confirmé : fermeture périmée fait que le champ se vide selon l'avis du tour précédent, pas du courant. **Doit devenir un critère de non-régression explicite** : test dans PlayerInputBar.test.tsx, scenario deux tours consécutifs, mutant ramène le bug. Bug reporter dans bug_history.json (severity major, discovered_at it1). ✓ OUI, IMPÉRATIF.

### STATUT DE MES PROPRES OBJECTIONS (TOUR 1)

| Objection | Statut |
|---|---|
| Architecture R1+R3 indécise | **Retirée** : décision précise du Tech Lead. |
| Critère #7 sans table | **Retirée** : critère sort de it2. |
| Cas limites non énumérés | **Maintenue** : à lister dans le plan. |
| KR-260 mutant mal nommé | **Durcie** : quatrième motif .demander( ajouté, plus fort. |

Risque résiduel : Chip/texte brut — décision à trancher entre PM et UX.

### VERDICT

**RECEVABLE SOUS RÉSERVE**

Quatre réserves levables avant code :
1. **Critère #7 retiré explicitement** de plan.acceptance_criteria → reporté à it3.
2. **Cas limites énumérés** dans le plan : R3 indisponible, suggestions vides, aucun jalon au pas courant, pas à jalons multiples.
3. **Défaut latent d'it1 corrigé** + test de non-régression « champ se vide selon avis du tour courant » dans PlayerInputBar.test.tsx.
4. **Chip cliquable : tranche PM/UX** — si retrait en it2, contrat UX devient contrat it3 (zéro impact code it2, aucune régression).

**Critères couverts par it2 (mise à jour)** : 10 (était 11, #7 reporté).

### ANNEXE — Critères observables, mise à jour

Les 10 critères de it2 (sans #7) :

1. **R1 reçoit « agir »** → Jest + useTourDeJeu.test.ts, mock CopiloteService, mutant : enlever agir de COMMANDES → test rougit.
2. **AGIR sans changement du monde** → Jest + session.test.ts, TRANSITIONS.agir, assertion `S1.monde === session.monde` (toBe), mutant : cloner monde → rougit.
3. **Deux entrées journal** → Jest + session.test.ts, deux rôles (joueur, moteur) au tour courant.
4. **Horloge +1** → Jest + session.test.ts, S1.horloge.tour === session.horloge.tour + 1.
5. **R3 seulement si avis === 'aucun'** → Jest + useTourDeJeu.test.ts, trois saisies (valide/clarif/non_reconnu), seule la valide déclenche R3.
6. **R3 APRÈS persistance, projection fraîche** → Jest + useTourDeJeu.test.ts, onSessionChange avant demander(narrateur), payload.session === S1 (tour courant).
7. ~~Faits sans rang refusés~~ → **REPORTÉ IT3**.
8. **Récit sur entrée à origine** → Jest + consignerRecit.test.ts, scenario à jalons multiples (pas d'écriture sur jalons après).
9. **Récit affiché dans OutcomeBlock** → RTL + PlayerInputBar.test.tsx, getByText("RÉCIT") + vérification contenu.
10. **Suggestions en texte brut** (ou Chip si PM/UX gardent) → RTL, getAllByText ou boutons selon décision.
11. **R3 indisponible → message + pas conservé** → Jest + mock {statut:'indisponible'}, assertion monde persisté.
12. **Champ se vide selon tour courant** (non-régression it1) → RTL + PlayerInputBar.test.tsx, deux tours, avis différents, timing.

**Cas limites énumérés** :
- Aucune suggestion
- Pas 0 (ouverture) → R3 jamais appelé
- Jalons franchis au pas → récit sur origine seulement
- Pas tardif (t=40) → contexte stable
- R3 timeout → injoignable

**Exclusions explicites** :
- Aucun test faits_etablis (it3)
- Aucun test Chip interactif (si quitte it2)
- Aucun test narrateur avec dangers/personnages (it3+)
- Aucun test SSE (projet : prose jamais en flux)

---

**Fichiers clés attendus au Lot 1 (contrat)** :
- brain/copilote/contexte/narrateur.ts (N)
- brain/copilote/types.ts (R, PropositionNarrateur = {recit, suggestions})
- brain/copilote/schemaSortie.ts (R, validerNarrateur, test mutant sur validation)
- brain/dossier/recit.ts (N, consignerRecit / avecRecit)
- brain/dossier/commandes.ts (R, AGIR ajouté)
- worker/index.ts (R, invites narrateur amendées + agir)

**Fichiers clés attendus au Lot 2 (feature)** :
- features/play-mode/hooks/useTourDeJeu.ts (R, R3 orchestration)
- features/play-mode/components/PlayerInputBar.tsx (R, fermeture périmée corrigée, récit + suggestions affichés)
- [Chip.tsx (N) OU rien] selon décision PM/UX

Aucune modification au contrat de OutcomeBlock (KR-109 : pas de variant en it2).
