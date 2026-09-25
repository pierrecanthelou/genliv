# TOUR 2 — Tech Lead

## Réponses nommées

**1) Forme de sortie de R1 — je concède intégralement à narratif-ia, je retire ma proposition de tour 1.**

Ma table de tour 1 proposait `SortieInterprete = {commande: Commande} | {precision} | {hors_commandes:true}` en laissant « les noms finaux à la discrétion de l'agent contrat ». C'est exactement le trou que narratif-ia et QA (objection 1) pointent : en nommant le membre réseau `commande` avec pour valeur le type `Commande` lui-même, un `{cibles:['P2']}` du modèle (un RANG, pas un id résolu) prend la forme d'une `Commande` valide et peut se faufiler jusqu'à `executerCommande` sans repasser par un validateur qui distingue rang et identifiant — précisément le bug que narratif-ia trace (« Destination inconnue : «P2» » au lieu d'un refus `rang-inconnu`). J'ai vérifié le précédent réel dans `brain/copilote/types.ts` (les six rôles livrés, `PropositionRendue`/`PropositionResolue`, `DetenteursRendus`/`PropositionDetenteurs`, `RapportRendu`/`LienResolu`, etc.) : la discipline KR-231 y est appliquée systématiquement par des **noms de clé disjoints ET un renommage sémantique** (`valeur→texte`, `intention→action`, `nature→lien`, `place/poursuite→fonction/but`) — jamais une forme réseau qui emprunte le nom d'un type de domaine existant.

Je retiens donc, verbatim, le double type de narratif-ia :
```ts
// RÉSEAU — brain/copilote/types.ts, NON ré-exportée (précédent : les 5 rôles existants)
export type InterpretationRendue =
	| { geste: RangInjecte; designe: readonly RangInjecte[] }
	| { precision: string }
	| { sans_commande: true }

// RÉSOLU — ne franchit jamais le réseau, ré-exportée par brain/index.ts
export type SortieInterprete =
	| { readonly lecture: 'commande'; readonly commande: Commande }
	| { readonly lecture: 'clarification'; readonly question: string }
	| { readonly lecture: 'sans_commande' }
```
Vérification KR-231 : `{geste,designe,precision,sans_commande} ∩ {lecture,commande,question} = ∅`. `Commande` n'apparaît que NESTÉE sous `SortieInterprete.commande`, un type qui n'est produit QUE par `interprete.ts` après validation complète — jamais lui-même la forme brute reçue du réseau, donc pas de risque de confusion à la frontière qui compte. C'est un point tranché, plus de discrétion laissée à l'agent contrat.

**2) Vérification d'arité — elle vit dans `validerInterprete` (schemaSortie.ts), pas dans `interprete.ts`.**

J'ai relu `commandes.ts` : le chemin console a un décideur unique pour l'arité — `analyserSaisie` (l.133 : `jetons.length !== 1 + COMMANDES[trouve].refKinds.length`), avec sa propre docstring qui pose l'invariant architectural : « un validateur QUI validerait ET un moteur qui résout font DEUX décideurs, qui divergeront (KR-013). Une règle du jeu ne vit qu'à un seul endroit. » `TRANSITIONS.aller` lit `cibles[0]` sans revérifier, en confiance totale dans ce que son unique gatekeeper amont a garanti.

Le chemin interprète a la même topologie : `validerInterprete` (prédicat 2 dans l'annexe de narratif-ia, `designe.length === COMMANDES[geste].refKinds.length`) est le gatekeeper unique de CE chemin, occupant exactement la même position qu'`analyserSaisie` — validation AVANT construction de la `Commande`. `interprete.ts` (re-résolution, pur `Map.get`) reçoit donc un `InterpretationRendue` déjà arité-conforme et ne doit PAS revérifier : le faire créerait le second décideur que la docstring de `commandes.ts` interdit nommément, et un second décideur peut diverger du premier (ex. quelqu'un relâche le validateur sans toucher la re-résolution, ou l'inverse). La garde contre la régression n'est pas une double vérification runtime mais un test : le mutant obligatoire de narratif-ia (annexe E, « arité retirée → l'exécution part alors vers P1 → à constater ROUGE ») va dans `schemaSortie.test.ts`, verrouillant que ce seul gatekeeper tient. Je l'ajoute explicitement à LOT 1.

`TRANSITIONS.aller` et `commandes.ts` ne bougent PAS dans cette itération — confirmé, aucun fichier de LOT 1 ni LOT 2 ne les touche.

**3) Test du verrou de tour — ajouté nommément à LOT 2.**

`src/features/play-mode/tests/useTourDeJeu.test.ts` (N) entre dans la table, avec le scénario exact de la PROPOSITION 3 de QA : deux appels consécutifs sur la fonction exposée par le hook (via `await Promise.resolve()` entre les deux, sans délai), `jest.spyOn(CopiloteService, 'demander')`, assertion `toHaveBeenCalledTimes(1)`. C'est un test d'orchestrateur en isolation (mock `DossierService` + spy service), pas un test RTL de `PlayerInputBar` — le DOM ne peut constater qu'une réalisation UI (`disabled`), pas l'invariant logique.

Sur la PROPOSITION 1 de QA (scinder `moteurSansIA.test.ts` en deux phases, liste vide dans le lot contrat puis remplie dans le lot feature) : je ne l'adopte **pas**, mais pour une raison structurelle, pas parce que le risque est faux. Le risque que QA décrit — une fenêtre où la liste d'exclusion nomme un fichier fantôme — n'existe que si `moteurSansIA.test.ts` et `useTourDeJeu.ts` sont livrés dans des lots ou des commits séparés. Dans mon découpage, les deux vivent dans LE MÊME lot (LOT 2), livré en un seul commit une fois son gate (tsc+jest) vert — il n'y a jamais d'état intermédiaire committé où la liste nomme un fichier qui n'existe pas encore. Scinder `moteurSansIA.test.ts` entre les deux lots violerait en plus la règle de propriété exclusive (rule 1) : un seul fichier, un seul lot. Je retiens donc le BESOIN de QA (nommer le fichier, faire rougir le mutant) sans sa FORME (split en deux phases), qui n'a de sens que sous un essaim parallélisé — ce qui n'est pas ce découpage.

**4) `attente` : optionnel (`attente?:`), je corrige ma proposition de tour 1.**

J'ai relu `session.ts` en entier. Deux éléments y tranchent la question sans ambiguïté, plus fort que je ne l'avais anticipé au tour 1 :
- Le style dominant du fichier pour un champ optionnel à vie est bien `champ?:` (`origine?: CommandeId`, `deltas?: readonly DeltaJournalise[]`), jamais `X | null` — confirmé par grep, zéro occurrence de la forme `| null` sur un champ optionnel dans ce fichier (`memoire: null` est un type FIXE non-optionnel, cas different : racine RÉSERVÉE sans forme représentable encore, pas un optionnel).
- Le fichier dit LUI-MÊME, en toutes lettres, pourquoi `attente` ne doit PAS suivre le patron `memoire: null` : « Une racine `attente: null` rendrait indistinguables « aucune attente » et « variante non supportée » ». C'est exactement l'argument de narratif-ia, et c'est déjà écrit dans le contrat actuel par un précédent auteur — je n'avais pas relu ce passage au tour 1, d'où mon erreur.

Je retiens donc `readonly attente?: AttenteClarification` (renommé depuis mon `Attente` de tour 1 — un seul membre en it1, pas une union prématurée : KR-263/266 veut un second producteur nommé avant d'ouvrir une union). `ouvrirSession` ne pose PAS la clé (absence native, comme `origine`/`deltas` non posés sur une entrée qui n'en a pas).

Correctif additionnel trouvé en relisant `sessionDestinations.ts` : la racine `attente` est la **quatrième** « racine porteuse » (comme `horloge`/`monde`/`journal` — aucune instance de la clé racine elle-même dans la fixture saturée, seules ses feuilles y figurent), et `attente.question`/`attente.saisie` sont les **deux premières lignes `'ia'`** de ce fichier. Son docstring affirme aujourd'hui « ZÉRO LIGNE 'ia', ET C'EST UNE DÉCISION » — LOT 1 doit corriger cette affirmation **en commentaire** (KR-195/196, jamais en valeur silencieuse) puisqu'elle devient factuellement fausse dès ce lot. Je l'ajoute à la table.

## Mon objection de tour 1 (narrateur.ts hors périmètre it1)

**MAINTENUE**, non durcie en veto — elle n'a plus besoin de l'être : elle est devenue un point de consensus, pas un point de friction. PM la scope explicitement hors it1 par sa lecture croisée des critères, narratif-ia ne touche jamais `narrateur.ts` dans son annexe (R1 seul), QA classe l'item « agir »/R3 comme it2 dans son tableau des critères, UX confirme zéro modification de `ConsoleCommandes`/registre narratif dans ce lot. Aucune des quatre notes ne rouvre la question. Je la garde au dossier comme veto latent (si un agent de l'essaim tentait d'ajouter `narrateur.ts` ou l'entrée `INVITES['narrateur']`, ce serait un rejet immédiat au gate), mais il n'y a plus de désaccord à trancher.

---

## ANNEXE — Table de lots RÉVISÉE (finale)

### LOT 1 — `contrat` (seul, en premier, `brain/` + `worker/` exclusivement)

| Fichier | Statut | Rôle |
|---|---|---|
| `src/brain/dossier/session.ts` | R | Ajoute `readonly attente?: AttenteClarification` (optionnel, JAMAIS `X \| null` — KR-251, style dominant du fichier). `export interface AttenteClarification { readonly type: 'clarification'; readonly question: string; readonly saisie: string }`. `ouvrirSession` ne pose pas la clé. |
| `src/brain/dossier/sessionDestinations.ts` | R | Ajoute la racine porteuse `attente: 'moteur'` (quatrième dispense, màj du commentaire « trois racines porteuses » → « quatre ») + feuilles `attente.type: 'moteur'`, `attente.question: 'ia'`, `attente.saisie: 'ia'` (deux premières lignes `'ia'` du fichier — corriger en COMMENTAIRE l'affirmation « ZÉRO LIGNE 'ia' » du docstring, KR-195/196). Étend `CheminDeFeuilleDeSession`. |
| `src/brain/dossier/interprete.ts` | N | Re-résolution PURE rang→identifiant (`Map.get` uniquement, zéro conversion numérique) à partir d'un `InterpretationRendue` déjà validé. **Ne revérifie PAS l'arité** (déjà garantie par `validerInterprete`, seul décideur — KR-013, docstring `commandes.ts:13-14`). Zéro appel à `executerCommande`, zéro import de service. |
| `src/brain/copilote/types.ts` | R | Ajoute `InterpretationRendue` (réseau, NON ré-exportée) et `SortieInterprete` (résolu, ré-exportée) — forme retenue de narratif-ia verbatim, voir contrat ci-dessus. Zéro clé commune entre les deux, et zéro clé de `Commande` au niveau top du réseau. |
| `src/brain/copilote/schemaSortie.ts` | R | `validerInterprete(brut, rangsLieux, rangsGestes, dossier, precisionPermise)` — prédicats ordonnés de l'annexe narratif-ia (schema/vide/rang-inconnu/marqueur/identifiant), **arité stricte `===`** comme seul décideur de ce chemin. |
| `src/brain/copilote/contexte/interprete.ts` | N | Assemble saisie + candidats-lieux en rangs (`destinationsPossibles`, `Lieu.description` jamais `nom` — KR-262) + gestes dérivés de `COMMANDES` + ton/interdits_ton + `attente.question`/`attente.saisie` si présents. **`narrateur.ts` n'entre pas ici (it2, consensus des 5 notes).** |
| `src/brain/copilote/contexte/index.ts` | R | Ré-exporte `assemblerInterprete`. |
| `src/brain/CopiloteService.ts` | R | 7ᵉ branche : `CibleInterprete{role:'interprete', saisie, lieuCourant}`, `ReponseInterprete`, `demanderInterprete`, garde `never` mise à jour. |
| `worker/index.ts` | R | `INVITES['interprete']` + `GABARIT_SORTIE['interprete']` seuls — **pas** `'narrateur'`. |
| `worker/index.test.ts` | R | Couverture du rôle neuf + gabarit épinglé. |
| `src/brain/copilote/schemaSortie.test.ts` | R | Mutants obligatoires (narratif-ia annexe E) : arité retirée → ROUGE, garde `< 2` retirée → ROUGE, scanner de rangs retiré → ROUGE. |
| `src/brain/index.ts` | R | Ré-exporte `AttenteClarification`, `SortieInterprete`, la fonction de re-résolution, le type de cible copilote. |

**Interface exposée (point de rendez-vous unique, gelé) :**
```ts
demander(dossier: Dossier, cible: { role: 'interprete'; saisie: string; lieuCourant: string }, signal?: AbortSignal): Promise<ReponseInterprete>
type ReponseInterprete = { statut: 'propose'; proposition: SortieInterprete } | EchecCopilote
type SortieInterprete =
  | { readonly lecture: 'commande'; readonly commande: Commande }
  | { readonly lecture: 'clarification'; readonly question: string }
  | { readonly lecture: 'sans_commande' }
type AttenteClarification = { readonly type: 'clarification'; readonly question: string; readonly saisie: string }
// EtatSession.attente?: AttenteClarification — absente = aucune attente, jamais null (KR-251)
```

### LOT 2 — `feature` (après, contrat figé et lu comme donnée immuable)

| Fichier | Statut | Rôle |
|---|---|---|
| `src/brain/components/Field.tsx` | R | Ajoute `disabled?: boolean`, propagé sur l'attribut HTML réel `<input>`/`<textarea>` (jamais un overlay visuel seul) — extension additive, seul consommateur nouveau cette itération est `PlayerInputBar`. |
| `src/features/play-mode/components/PlayerInputBar.tsx` | N | `<form>` natif + `Field` (non mono) + bouton `<button type="submit">` — libellés `QUE FAITES-VOUS ?` / `TENTER` / `…`, aucun `onKeyDown` maison. |
| `src/features/play-mode/hooks/useTourDeJeu.ts` | N | Orchestrateur : verrou de tour (invariant logique, pas seulement `disabled`), appelle `CopiloteService.demander(dossier, {role:'interprete', saisie, lieuCourant})`, route la `Commande` résolue par le MÊME `executerCommande` que la console. Fichier ajouté à l'exclusion nommée de `moteurSansIA.test.ts`, dans ce même lot. |
| `src/features/play-mode/tests/useTourDeJeu.test.ts` | N | Test d'orchestration en isolation (mock `DossierService`, spy `CopiloteService.demander`) : deux appels consécutifs (`await Promise.resolve()` entre eux) → `toHaveBeenCalledTimes(1)`. Couvre aussi le tableau des issues de narratif-ia (annexe C : commande acceptée / refusée / sans_commande / clarification / anti-boucle / illisible / panne réseau — session à la même référence). |
| `src/features/play-mode/components/EcranPartie.tsx` | R | Câble `PlayerInputBar`/`useTourDeJeu` à côté de `ConsoleCommandes` (inchangée, démotion visuelle hors périmètre it1 — signalé par UX, pas un critère d'acceptation de cette itération). Rend `OutcomeBlock` avec `entete="PRÉCISEZ"` / `entete="SANS EFFET"`, zéro nouvelle prop sur `OutcomeBlock`. |
| `src/features/play-mode/tests/moteurSansIA.test.ts` | R | KR-260 : balayage conservé pour `player/` et `brain/dossier/` (zéro exception) ; `play-mode/` gagne l'exclusion nommée `[useTourDeJeu.ts]`, écrite dans CE lot, en même temps que le fichier qu'elle nomme — aucune fenêtre aveugle inter-lots (séquentiel, un seul commit). Mutant obligatoire : import hors liste → ROUGE → retrait. |

**Aucun fichier commun entre les deux lots.**

## Décisions prises en autonomie faute de spécification

- Nom du type d'attente (`Attente` proposé au tour 1 vs `AttenteClarification`) → **`AttenteClarification`, un seul membre, pas d'union prématurée** → si un second producteur de variante `attente` arrive avant l'it2/n°11 documentée, il faudra ouvrir l'union à ce moment-là (KR-263/266), coût nul aujourd'hui car aucun code ne dépend encore du nom.
- Portée du mutant obligatoire sur l'arité → **posé dans `schemaSortie.test.ts` (LOT 1), pas dans `interprete.test.ts`** → si l'inverse, le test se retrouverait dans un fichier qui ne peut pas constater la vraie ligne mutée (le prédicat vit dans le validateur, pas dans la re-résolution) et le mutant resterait un survivant silencieux.
- Propriété de `Field.tsx` (brain/components, extension additive) → **rattachée à LOT 2, pas verrouillée en LOT 1** → si un second consommateur de `disabled` apparaissait dans la même itération (aucun signalé), il faudrait alors reconsidérer si cette extension mérite son propre lot contrat ; avec un seul appelant (`PlayerInputBar`), la geler en LOT 1 serait une abstraction prématurée sans second appelant réel.
