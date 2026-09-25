# Tour 2 — QA (Contre-lecture)

## Réponses nommément aux 4 points demandés

### 1. OBJECTION 1 (contrat de `SortieInterprete`) — SUFFISANT pour lever ?

**OUI.** Tech-lead (Annexe Table de lots) + narratif-ia (Annexe B) ensemble formalisent :
- **Contrat dual** : formes réseau (`InterpretationRendue` : geste/designe/precision/sans_commande) et résolues (`SortieInterprete` : lecture/commande/question), KR-231 respectée (zéro clé commune).
- **Prédicats de validation** (section B narratif-ia) : objet simple, clés exactes, arité === refKinds.length, precision ≤ 120 chars finissant par ?, rangsLieux.size ≥ 2, sans_commande === true, etc.
- **Point de rendez-vous unique** : brain/index.ts exporte interface + types, consommés par lot feature.
- **Garde supplémentaire** (section D narratif-ia) : INVITES['interprete'] liste ce que le modèle ne peut **jamais** dire — critique contre fuite de données.

**Besoin avant essaim** : tech-lead valide l'alignement exact des noms finaux de champs (lecture/commande/question) entre sa table et la section B de narratif-ia ; aucun doubleur ne doit subsister.

**Remarque** : la garde ESLint sur INVITES relève du worker, pas du code de feature — pas de veto là-dessus.

---

### 2. OBJECTION 2 (verrou KR-265 : test avant code) — PROPOSITION 3 tient-elle ?

**OUI, MAINTENUE ET AFFINÉE.**

Narratif-ia section E donne des témoins de **rejeu** (réponse fautive → valide = 2 fetch ; deux fautives = illisible ; etc.) mais RIEN sur le **doublon utilisateur** (deux soumissions du champ dans le même tick → un seul fetch). C'est un problème distinct : c'est la garde du verrou de tour, pas l'orchestration de rejeu.

Tech-lead nomme `useTourDeJeu.ts` comme l'orchestrateur et dit « verrou logique testable vit dans l'orchestrateur/hook » mais ne prescrit pas de test précis avant le code. PROPOSITION 3 reste cruciale.

**Test affiné** :
- Nom exact : `src/features/play-mode/tests/useTourDeJeu.test.ts → deux appels rapides dans le même tick → un seul copilote`
- Scénario : appeler deux fois `executeAction` consécutivement (await Promise.resolve() entre, ou deux .call() même tick), spy sur `CopiloteService.demander` → `toHaveBeenCalledTimes(1)`.
- Fichier : `useTourDeJeu.test.ts` (fait partie du lot 2 feature, mais le **test est écrit avant le hook**).

Critère 10 du tableau ANNEXE est bien posé ; il n'y a qu'à le graver avec cette précision de test avant essaim.

---

### 3. PROPOSITION 1 (deux phases pour moteurSansIA.test.ts) — encore nécessaire ?

**NON, RETIRÉE.** Tech-lead lot structure élimine le problème.

Découpage en deux lots sériels :
- **Lot 1 (contrat)** : brain/ + worker/ exclusivement, zéro `moteurSansIA.test.ts`.
- **Lot 2 (feature)** : `useTourDeJeu.ts` créé, PUIS `moteurSansIA.test.ts` réécrit avec liste `[useTourDeJeu.ts]`.

Le fichier existe et compile au moment où la liste le nomme → zéro fenêtre silencieuse → zéro cycle. L'observation est garantie par l'ordre des lots, pas par une réécriture en deux phases.

---

### 4. Témoins et mutants narratif-ia (section E) — lesquels intégrer à mon tableau ?

**TOUS LES 6 TÉMOINS + 3 MUTANTS.**

| Quoi | Intégration |
|---|---|
| Témoins d'échec : designe≠arité, clés mêlées, sans_commande:false, g1, precision+rang, precision+<2lieux | Critère 1-bis : ajouter test `brain/dossier/interprete.test.ts → validerInterprete: 6 témoins d'échec` |
| Mutant arité | brain/dossier/interprete.ts: retirer vérif `designe.length === COMMANDES[id].refKinds.length` → rouge |
| Mutant garde <2 lieux | brain/dossier/interprete.ts: retirer `rangsLieux.size < 2` → rouge |
| Mutant scanner rangs | brain/dossier/interprete.ts: retirer `porteUnRang` regex → rouge |
| Mutant KR-260 existant | moteurSansIA.test.ts: import hors liste → rouge (déjà compté) |

Total mutants obligatoires : 4 (trois logiques + un balayage code).

---

## Tableau final — Critères it1 avec tests précis

| Critère | Énoncé court | Niveau | Test nommé / Fichier | Notes |
|---------|---|---|---|---|
| 1 | Aller → {lecture:'commande', commande} | Unitaire pur | `brain/dossier/interprete.test.ts → analyserSaisie aller` | Fixture candidats rangs P1…Pn, assertion SortieInterprete |
| 1-bis | Rejet 6 témoins (designe≠arité, clés mêlées, g1, precision+rang, precision+<2lieux, sans_commande:false) | Unitaire pur | `brain/dossier/interprete.test.ts → validerInterprete: 6 témoins d'échec` | Chaque témoin → motif exact (schema/identifiant/etc) |
| 2 | Clarification sur ambiguïté | Unitaire pur | `brain/dossier/interprete.test.ts → analyserSaisie clarification` | Mock + fixture 2 lieux, retour {lecture:'clarification', question} |
| 2-bis | Aucune 2e clarification si attente en cours (KR-264) | Unitaire pur | `brain/dossier/interprete.test.ts → attente bloque clarification` | Attente={type:'clarification'} → appel suivant ignoré |
| 3 | Sans_commande sur hors COMMANDES | Unitaire pur | `brain/dossier/interprete.test.ts → analyserSaisie sans_commande` | Saisie invalide pour tous gestes → {lecture:'sans_commande'} |
| 4 | Rejeu une seule fois + dégradation (jusquAuRejeuUnique) | Composant RTL | `src/features/play-mode/tests/useTourDeJeu.test.ts → rejeu une seule fois` | 2 bouchons fetch (fautif+valide), 2 appels copilote, tables stables |
| 10 | Deux soumissions champ = un appel copilote (verrou KR-265) | Composant RTL | `src/features/play-mode/tests/useTourDeJeu.test.ts → deux appels rapides → un seul copilote` | Spy CopiloteService, toHaveBeenCalledTimes(1) |
| 11 | moteurSansIA réécrit, exclusion nommée, mutant obligatoire | Balayage code | `src/features/play-mode/tests/moteurSansIA.test.ts` | Liste [useTourDeJeu.ts], mutant import hors liste → rouge |
| 12 | Journal stocke Commande jamais saisie brute | Unitaire pur | `src/features/play-mode/tests/useTourDeJeu.test.ts → journal Commande` | Assertion journal[].entree ≠ saisie |

**Mutants obligatoires** (rouges à écrire/constater avant commit) :
- Arité `designe.length === COMMANDES[id].refKinds.length` retirée
- Garde `rangsLieux.size < 2` retirée
- Scanner `porteUnRang` regex retiré
- Import CopiloteService hors liste dans moteurSansIA.test.ts

---

## SYNTHÈSE DES 3 PROPOSITIONS

| Proposition | Tour 1 | Réponse Tour 2 | Statut final |
|---|---|---|---|
| **P1** — Deux phases moteurSansIA | Observabilité cyclique | Tech-lead lot séquentiel répond | **RETIRÉE** |
| **P2** — Graver contrat SortieInterprete | Contrat manquant | Tech-lead + narratif-ia gravent deux formes + validateur + section D | **MAINTENUE** — demander alignement noms tour 2 |
| **P3** — Test verrou avant hook | Pas de test orchestration nommé | Narratif-ia ignore crit 10, tech-lead nomme hook sans test précis | **DURCIE EN VETO** — test d'isolation écrit avant code |

---

## VERDICT TOUR 2

**RECEVABLE SOUS TROIS RÉSERVES CLOSEABLES AVANT ESSAIM :**

1. **Tech-lead** : certifier alignement exact des noms finaux (lecture/commande/question) avec narratif-ia section B.
2. **Narratif-ia** : confirmer que INVITES contraintes (section D) s'appliquent **uniquement worker**, zéro garde ESLint feature.
3. **Essaim** : écrire et passer le test d'isolation du verrou AVANT le hook — nom exact `deux appels rapides → un seul copilote`, fixture/spy précis, `toHaveBeenCalledTimes(1)`.

Aucun reblockage attendu — clarifications écrites, pas d'architecture.
