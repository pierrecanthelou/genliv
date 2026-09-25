# Tour 1 — Tech Lead

RISQUE — Le point de rendez-vous le plus fragile n'est pas `CopiloteService` (bien rodé, 6 branches existantes) mais `EtatSession.attente`, qui traverse DEUX fichiers qui doivent bouger ensemble dans le lot contrat : `session.ts` (le type, jusqu'ici absent — pas même `null`) et `sessionDestinations.ts` (exhaustif par `keyof EtatSession`, donc la clé racine ET ses feuilles de variante doivent y entrer le même jour, sous peine de `tsc` rouge sur l'un des deux). Si l'essaim scinde ça en deux lots, il recrée exactement le risque que Décision A veut fermer.

OBJECTION — Le `brain_contracts` de la spec regroupe en une seule ligne `brain/copilote/contexte/{interprete,narrateur}.ts`. `narrateur.ts` est le contrat d'it2 (R3 n'existe pas encore, KR-263/266 : un rôle n'entre qu'avec son consommateur). Le créer maintenant, même vide, serait une abstraction sans second appelant réel dans CETTE itération — précédent `OutcomeBlock`/KR-109 cité par la spec elle-même. À retirer du périmètre du lot contrat d'it1.

PROPOSITION — Deux lots seulement (contrat, puis feature, jamais en parallèle — c'est une tranche verticale). Le rôle `'interprete'` désigne ses candidats-lieux par rang (`P1…PN`), jamais par `id` brut ni `nom` (précédent `indice-detenteurs`) : `description` de `Lieu` est la seule prose exposée (KR-262). `brain/dossier/interprete.ts` ne fait QUE la re-résolution rang→identifiant, zéro appel à `executerCommande` — c'est l'orchestrateur feature qui rappelle l'entonnoir existant.

VERDICT — recevable sous réserve : retirer `narrateur.ts` et l'entrée INVITES `'narrateur'` du lot contrat d'it1 ; `attente` et sa table d'audience livrés atomiquement dans le même lot.

---

## ANNEXE — Découpage en lots

### LOT 1 — `contrat` (seul, en premier, brain/ + worker/ exclusivement)

| Fichier | Statut | Rôle |
|---|---|---|
| `src/brain/dossier/session.ts` | R | Ajoute la clé racine `attente: Attente` (type `{type:'clarification', question:string, saisie:string} \| null`) ; `ouvrirSession` initialise `attente: null`. |
| `src/brain/dossier/sessionDestinations.ts` | R | Ajoute la ligne racine `attente` (porteuse, `'moteur'`) + les feuilles `attente.type`, `attente.question`, `attente.saisie` (toutes `'moteur'` — aucune n'est injectée, la garde anti-boucle KR-264 est un prédicat de code, pas un contexte de modèle). |
| `src/brain/dossier/interprete.ts` | N | Prédicats purs : re-résolution rang→`lieu.id` à partir de la table de rangs rendue par l'assembleur (précédent `Map.get`, KR-231/175). Zéro import de service, zéro appel à `executerCommande`. |
| `src/brain/copilote/types.ts` | R | Ajoute les formes réseau/résolues du rôle `interprete` — noms disjoints de `IntentionRendue`/`PropositionPlan` (ex. `SortieInterpreteRendue` / `SortieInterprete`), ZÉRO clé commune entre les deux côtés (KR-231), y compris pour `clarification`/`sans_commande` (renommer côté résolu, même discipline que `valeur→texte`, `intention→action`). |
| `src/brain/copilote/schemaSortie.ts` | R | `validerInterprete(brut, rangsConnus, dossier)` — même gabarit que `validerRelations`/`validerDetenteurs` (clés exactes, motifs `schema`/`rang-inconnu`/…). |
| `src/brain/copilote/contexte/interprete.ts` | N | Assemble saisie + candidats-lieux en rangs (via `destinationsPossibles` + `Lieu.description`, jamais `nom` — KR-262) + verbes dérivés de `COMMANDES` + ton/interdits_ton. **`narrateur.ts` n'entre PAS ici (it2).** |
| `src/brain/copilote/contexte/index.ts` | R | Ré-exporte `assemblerInterprete`. |
| `src/brain/CopiloteService.ts` | R | 7ᵉ branche : `CibleInterprete{role:'interprete', saisieId?}` (charge à confirmer par l'agent), `ReponseInterprete`, `demanderInterprete`, ajout aux deux sites de surcharge + garde `never`. Corps littéral, jamais `{...cible, contexte}` (KR-231, motif déjà écrit dans le fichier). |
| `worker/index.ts` | R | `INVITES['interprete']` + `GABARIT_SORTIE['interprete']` seuls ajoutés — **PAS** `'narrateur'`. Contrat de route à 7 branches inchangé (Worker Route Parity). |
| `worker/index.test.ts` | R | Couverture du rôle neuf, gabarit épinglé. |
| `src/brain/index.ts` | R | Ré-exporte les symboles neufs consommés par la feature (`Attente`, `SortieInterprete`, la fonction de re-résolution, le type de cible copilote). |

**Interface exposée par ce lot (point de rendez-vous unique) :**
```ts
// brain/index.ts, consommé tel quel par le lot feature :
demander(dossier: Dossier, cible: { role: 'interprete'; saisie: string; lieuCourant: string }, signal?: AbortSignal): Promise<ReponseInterprete>
type ReponseInterprete = { statut: 'propose'; proposition: SortieInterprete } | EchecCopilote
type SortieInterprete =
  | { readonly commande: Commande }        // Commande = type déjà exporté de commandes.ts
  | { readonly precision: string }         // ex-clarification, nom disjoint du réseau
  | { readonly hors_commandes: true }      // ex-sans_commande, nom disjoint du réseau
```
(Noms finaux à la discrétion de l'agent contrat, sous la seule contrainte KR-231 : zéro clé commune avec la forme réseau.)

### LOT 2 — `feature` (après, contrat figé et lu comme donnée immuable)

| Fichier | Statut | Rôle |
|---|---|---|
| `src/features/play-mode/components/PlayerInputBar.tsx` | N | Champ `QUE FAITES-VOUS ?`, `<form>` natif, pas de `onKeyDown` maison. |
| `src/features/play-mode/hooks/useTourDeJeu.ts` | N | Orchestrateur : verrou de tour (KR-265, invariant logique, pas juste `disabled`), appelle `CopiloteService.demander(dossier, {role:'interprete', …})`, puis route la `Commande` résolue par le MÊME `executerCommande` que la console. C'est le fichier qui devient l'exclusion nommée. |
| `src/features/play-mode/components/EcranPartie.tsx` | R | Câble `PlayerInputBar`/`useTourDeJeu` à côté de `ConsoleCommandes` (démotée visuellement, jamais retirée). Rend la variante clarification via `OutcomeBlock` (eyebrow `PRÉCISEZ`, réutilisé sans modification — props déjà génériques, vérifié). |
| `src/features/play-mode/tests/moteurSansIA.test.ts` | R | KR-260 : balayage par racine conservé pour `player/` et `brain/dossier/` (ZÉRO exception) ; `play-mode/` gagne une liste d'exclusion nommée = `[useTourDeJeu.ts]`. Mutant obligatoire : import hors liste → rouge → retrait. |

**Aucun fichier commun entre les deux lots.** `Chip.tsx` n'existe pas dans cette itération (décision de cadrage) — absent des deux listes.
