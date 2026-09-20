# Tour 2 — PM Produit — `moteur-dossier` it1

**C-1 — réponse nommée à la QA.** « Testable » n'est pas « démontrable ». Je juge ce qu'un commit sur `main` livre à l'auteur : un CTA qui navigue vers une route qu'`App.tsx` ne rend pas est une affordance mensongère expédiée en production ; un shell sans porte n'existe qu'à l'URL. Et la note QA (a) le dit elle-même — la jonction éditeur→shell n'est vérifiée par personne sans un test montant `App` sur `{name:'partie'}`. Découper la met **entre** deux itérations, donc nulle part. **Dérogation maintenue, bornée à it1.**

**OBJECTION 1 (`tourzero.ts`, deux cellules) — RETIRÉE.** Double motif mesuré : M1 (une seule cellule force déjà `VALEUR_ATTENDUE:106`, que le critère 3 interdit mot pour mot) et le relevé 1 du tech-lead (consommateur unique en `alerte` → aucune cellule ne peut changer `jouable`, mon risque ne passait donc pas par là). Je me range au narratif : it1 amende le **contrat** (H6 + oracle), **zéro cellule**. La cellule voyage avec l'itération qui la rend fausse ; « deux lots `contrat` » est un **compte**, pas un quota.

**OBJECTION 2 — MAINTENUE, rétrécie.** D5 me retourne sur la **règle** : une garde de fonction pure dans un runtime extractible est une frontière, pas une seconde source de vérité. Pas sur le **texte** : M2 rend `ouverture_a_ecrire` inatteignable par l'écran — deux textes pour un chemin unique, c'est de la prose morte. **Un seul texte rendu en it1 (`dossier_non_jouable`)** ; `'ouverture-a-ecrire'` reste une valeur de retour, prouvée par KR-244, jamais peinte.

**C-10 — ACCEPTÉ.** Hors périmètre corrigé : la **zone** `JOURNAL` et son état vide entrent ; `JournalRow` et toute **ligne** restent dehors. Contrepartie du retrait ci-dessus, pas un ajout net.

**C-11 — EXEMPTION RECEVABLE.** Une graine ne se rétro-ajoute pas et `schema:1` n'a aucune migration : l'omettre casse le rejeu des premières sessions de l'auteur. Conditions : défaut nommé et testé, source injectée.

**C-8 — d'accord** (3 et 5 hors it1). Mon critère du tour 1 est **remplacé, pas cumulé** : `App` monté sur `partie` avec `dossier-minimal.json` rend le texte d'ouverture — unique témoin de la phrase de démo.

**VERDICT — recevable sous réserve.**

---

### Hors périmètre d'it1 — version consolidée (livrable PM, remplace celle du tour 1)

Évaluateur bivalent, `appliquerDelta`, `faits.ts`, `evaluate.ts` · console et verbe `aller` · `JournalRow` et toute **ligne** de journal (la **zone** + état vide entrent) · déplacement par `lieux[].acces` · jalons et leur projection · démolition des consommateurs d'arbre · saut au champ fautif · tout bouton « reprendre »/« relancer » et `effacer()` (D6) · `quetes[].etapes` · forme interne de `memoire` · variantes d'`attente` · `depart.inventaire_initial` · `persist.ts` (D1) · scission de `controles.ts` · **toute cellule de `VALEUR_AU_TOUR_ZERO`** · **tout second texte de refus rendu à l'écran**.
