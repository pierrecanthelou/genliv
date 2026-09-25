# Tour 2 — Narratif & IA

## Statut de mes objections de tour 1

| Obj. | Statut | Ce qui la lève |
|---|---|---|
| 1. Collision de clés réseau/résolu (KR-231) | **MAINTENU. VETO sur la forme de tech-lead telle qu'elle est écrite, et sur celle de QA.** | L'adoption de la forme finale ci-dessous. La conciliation ne coûte rien. |
| 2. Arité non vérifiée | **MAINTENU** | `validerInterprete` reçoit les **deux** tables et vérifie `designe.length === refKinds.length`. La signature de tech-lead n'a qu'un `rangsConnus`, ce qui ne permet pas de contrôler l'arité. |
| 3. Saisie et question sans borne | **MAINTENU** (personne n'y répond) | Saisie de 300 caractères au plus, refusée avant `fetch`. Question de 120 caractères au plus, bornée par le validateur. |
| 4. Clarification avec moins de 2 lieux rangés | **MAINTENU**, personne ne s'y oppose | Motif `schema` dans le validateur. |

## 1. À tech-lead : la forme de `SortieInterprete`

`{commande: Commande} | {precision} | {hors_commandes:true}` bute sur un point précis. La clé `precision` est **ma clé réseau**. Un `{precision:"…"}` brut est donc déjà un `SortieInterprete` valide. Un transtypage ou un chemin non validé suffit alors à contourner les contrôles du validateur : 120 caractères au plus, « ? » final, ni identifiant, ni rang, ni marqueur, au moins 2 lieux. Et rien ne rougit. C'est exactement ce contre quoi KR-231 impose deux types disjoints. Autre faiblesse : la forme se discrimine par la présence d'une clé (`'precision' in x`), sans littéral. Il n'y a donc pas de `switch` exhaustif avec `never`.

**Conciliation** : tech-lead garde le nom `SortieInterprete`, son enveloppe `ReponseInterprete` et le placement des fichiers. Il adopte `lecture` + `question`, et `hors_commandes` devient `lecture:'sans_commande'`.

**Je corrige ma propre formule du tour 1.** J'avais écrit une intersection de trois ensembles, ce qui donne ∅ trivialement. La propriété qui compte se vérifie par paires :
- les clés réseau et les clés résolues n'ont rien en commun ;
- les clés réseau et celles de `Commande` n'ont rien en commun.

Que la forme résolue et `Commande` partagent `{commande}`, c'est légitime : `Commande` est imbriquée et `tsc` attrape toute confusion.

**À QA (proposition 2 et ligne 1 de l'annexe), nommément : VETO.** Deux points :
- La forme réseau `{"commande":"aller","cibles":["lieu.forge"]}` fait **frapper un identifiant au modèle** (KR-231, décision n6).
- « Critère 1 testé via `analyserSaisie` » : la sortie de R1 ne passe **jamais** par l'analyseur de la console. Du texte de modèle analysé par du code, c'est précisément ce que l'invariant interdit.

L'entonnoir commun est `executerCommande`, pas `analyserSaisie`. La ligne 1 doit se lire : `validerInterprete` + re-résolution par `Map.get`, sur des tables en fixture.

**Toujours à tech-lead, sur `attente`** (réserve bloquante du lot contrat, hors de mon veto) :
- **`attente: Attente | null`, requise et initialisée à `null`, contredit KR-251 et la docstring de `session.ts:114-116`.** Cette docstring dit mot pour mot que `null` rend « aucune attente » indistinguable de « variante non supportée ». Conséquence concrète : une session persistée avant ce lot n'a pas la clé. `session.attente !== null` vaut alors `true`, on obtient une attente fantôme, puis un `TypeError` sur `.question`. Il faut écrire `attente?: AttenteClarification`.
- **Les feuilles `question` et `saisie` en audience `'moteur'`** : l'argument « la garde anti-boucle est un prédicat de code » est juste pour la **garde**, qui lit la présence d'`attente` (`'moteur'`). Il ne couvre pas l'**interprétation** de la réponse. Si le modèle ne voit pas la question, il interprète « celle de gauche » à l'aveugle, et la clarification ne sert à rien. Il faut `question` et `saisie` en `'ia'`. Le cliquet de `sessionDestinations` tient toujours : il se ré-épingle sur l'ensemble exact de ces deux lignes.
- **Dans la cible, `lieuCourant: string` doit devenir `session: EtatSession`.** L'assembleur a besoin de `destinationsPossibles(dossier, session)` et de `session.attente`. Et KR-265 exige qu'`executerCommande` reçoive le **même** instantané de session.

Je soutiens le retrait de `narrateur.ts` et de `INVITES['narrateur']` : une invite sans consommateur est une invite que personne ne teste.

## 2. À UX : « SANS EFFET »

**Cohérence avec ma table C** : la structure est bonne. Le squelette de phrase est fixe, la liste est dérivée de `COMMANDES[].label`.

**Risque de fuite vers le modèle : nul par construction.** C'est strictement du texte d'interface. Il n'est pas dans `INVITES` (interdit 4), il n'est jamais persisté (`attente` ne porte que la question et la saisie) et jamais journalisé. La garde de confinement de `DESTINATION_DES_CHAMPS_DE_SESSION` le tient.

**Mais je conteste le mot et le registre** (voix et cohérence, mon domaine) :
- **Le mot.** `REGLES-PLAY.md` § J1 emploie « effet » pour le cas inverse : une commande **acceptée** qui ne change rien au monde consomme quand même un pas (« c'est la DEMANDE qui compte, jamais l'effet »). Mettre « SANS EFFET » en entête du cas à 0 pas inverse ce vocabulaire. Et en n° 11, ce mot deviendrait un troisième résultat de fiction à côté d'ÉCHEC. Je propose **`NON RECONNU`** ; UX choisit le mot final dans ces contraintes.
- **Le registre.** « Vous ne savez pas encore faire cela » affirme un fait sur le héros que l'auteur n'a pas écrit. Et un menu d'actions dans la voix de la fiction, c'est un narrateur qui propose un menu. Le texte fixe de `sans_commande` et « Reformulez votre action. » sont en **registre interface**. Par exemple : « Action non reconnue. Actions possibles ici : {labels}. »
- **Conséquence heureuse** : en registre interface, `va au lieu` se lit comme un libellé. Il n'y a donc **pas besoin d'un second champ d'affichage sur `COMMANDES`**. Deux textes pour une même action, avec un seul consommateur, finiraient par diverger.
- **`PRÉCISEZ` est réservé à la question écrite par R1.** « Reformulez » passe sous l'entête d'interface. On obtient une règle testable : `PRÉCISEZ` est affiché ⇔ `session.attente !== undefined`, et le corps affiché === `attente.question`. Ce rendu est **dérivé au rendu** (KR-013), jamais copié dans l'état du hook : sinon, après une reprise, la question disparaît de l'écran alors que le moteur la tient encore pour en attente.
- **La liste ne nomme que les gestes satisfiables dans les tables de CET appel.** Dans le cas du court-circuit (aucun lieu rangé), c'est une phrase d'impasse. Le moteur n'annonce pas « va au lieu » juste après avoir prouvé qu'aucun lieu n'est atteignable.

## 3. Le lieu sans description

**Je confirme : aucun test ni KR ne ferme ce trou en it1, et je ne bloque pas it1 dessus.**

Le moteur ne peut pas le fermer sans casser un invariant :
- un repli sur `nom` viole KR-262 ;
- un repli sur l'identifiant viole KR-231 ;
- un rang sans étiquette fait désigner le modèle à l'aveugle.

Le côté auteur ne le ferme pas non plus aujourd'hui, j'ai vérifié : `controles.ts` ne lit aucune `description`, et le contrôle de marqueur ne couvre que les 4 proses d'`AMORCE`. Une description **absente comme marquée** est donc invisible pour l'auteur. La fermer demande un contrôle dans `dossier-controles`, une autre feature ; on ne mène jamais deux tranches en parallèle.

**Ce qu'it1 livre à la place :**
- Un test de caractérisation : un accès sans description donne `tables.lieux.size` réduit, ni l'id ni le nom dans le contexte, et `executerCommande(ALLER <id>)` reste accepté en console.
- Le message d'impasse décrit au point 2.
- Un **nouveau KR** (le prochain id, KR-267 à ce jour) et une `open_question` dans la spec : « Un lieu accessible dont la description est absente ou marquée ne reçoit aucun rang. Il reste atteignable en console et devient inatteignable en saisie libre. La fermeture se fait côté auteur, par un contrôle "accès vers un lieu sans description" (propriétaire : `dossier-controles`). Déclencheur : la première surface de jeu sans console, ou la prochaine itération qui rouvre `controles.ts`. »

## Forme finale recommandée (celle que tech-lead doit adopter)

```ts
// RÉSEAU — brain/copilote/types.ts, jamais ré-exporté par brain/index.ts
export type InterpretationRendue =
	| { readonly geste: RangInjecte; readonly designe: readonly RangInjecte[] }
	| { readonly precision: string }
	| { readonly sans_commande: true }

// RÉSOLU — le seul type que la feature voit
export type SortieInterprete =
	| { readonly lecture: 'commande'; readonly commande: Commande }
	| { readonly lecture: 'clarification'; readonly question: string }
	| { readonly lecture: 'sans_commande'; readonly gestes_possibles: readonly CommandeId[] }

// Rendues par l'assembleur, UNE fois, avant la boucle de rejeu
export interface TablesInterprete {
	readonly lieux: ReadonlyMap<RangInjecte, string>      // P1… → lieu.id
	readonly gestes: ReadonlyMap<RangInjecte, CommandeId> // G1… → clé de COMMANDES
}
type CibleInterprete = { readonly role: 'interprete'; readonly saisie: string; readonly session: EtatSession }
// validerInterprete(brut: unknown, tables: TablesInterprete, dossier: Dossier)
```

Je retire le paramètre `precisionPermise` de mon annexe du tour 1, où il était nommé sans être défini. Le contrôle « moins de 2 lieux » est structurel : c'est un motif `schema`, donc il déclenche le rejeu. La garde anti-boucle, elle, n'est **pas** un échec de validation : c'est la transition qui la tranche, sans second appel.

**Transition : une seule fonction pure dans `brain/`, exhaustive (garde `never`).** Forme indicative : `apresInterpretation(dossier, session, reponse) → { session, avis }`, où `avis` est une union fermée (`aucun | non_reconnu{gestes} | reformuler | indisponible`). Le hook ne fait qu'appliquer ce résultat. Contrainte si elle vit dans `brain/dossier/` : ne jamais y écrire le mot `CopiloteService`, **même en commentaire**, car le motif de `moteurSansIA.test.ts` est une regex sur le texte source.

## Interdits de l'invite — amendés

Les interdits 2, 3, 5, 6, 7 et 8 ne changent pas.
- **1, complété** : le contexte porte le `label`, jamais le `verbe` ni la clé. Test : `contexte.texte` ne contient aucun `COMMANDES[id].verbe` (casse exacte).
- **4, étendu** : aucun texte d'interface, qu'il s'agisse :
  - des entêtes (`PRÉCISEZ`, le mot retenu pour `sans_commande`) ;
  - des libellés (`QUE FAITES-VOUS ?`, `TENTER`) ;
  - des messages fixes (Reformulez, la phrase de `sans_commande`, la phrase d'impasse).

  `QUE FAITES-VOUS ?` imité en guise de clarification serait un refus déguisé. Test : `worker/index.test.ts` balaie `INVITES.interprete` et `GABARIT_SORTIE.interprete` contre une liste littérale, sans tenir compte de la casse.
- **9, nouveau : le gabarit ne contient aucun repère valide.** Il s'écrit `{"geste": "…", "designe": ["…"]} ou {"precision": "…"} ou {"sans_commande": true}`. C'est un écart assumé au précédent `indice-detenteurs` (`["P1","P2"]`) :
  - en rédaction, l'auteur relit la proposition ;
  - en jeu, personne ne relit. Un `P1` recopié par paresse est un rang valide : il est exécuté, un pas est consommé, et rien ne rougit (KR-229) ;
  - un « … » recopié tombe en `rang-inconnu`, déclenche un rejeu, puis finit en « Reformulez » : un échec sûr plutôt qu'un échec silencieux.

## Table C — amendée

| Issue | Session | `attente` | Pas | Affiché |
|---|---|---|---|---|
| commande acceptée, **par R1 ou par la console** | rendue par `executerCommande` | retirée **par `executerCommande`**, l'entonnoir unique | +1 | rien |
| commande refusée par `executerCommande` | inchangée | retirée | 0 | reformuler (interface) |
| `sans_commande` | inchangée | retirée | 0 | entête interface + labels de `gestes_possibles` ; liste vide → impasse |
| clarification : pas d'attente en cours, ton écrit, au moins 2 lieux | + attente | posée | 0 | `PRÉCISEZ` + `attente.question`, **dérivé de la session** |
| clarification avec une attente en cours, ou ton absent | inchangée | retirée | 0 | reformuler |
| illisible après 1 rejeu | inchangée | retirée | 0 | reformuler |
| indisponible, annulé, `trop-long`, saisie de plus de 300 caractères | **même référence** | conservée | 0 | message d'interface |

Ligne neuve de la première rangée : sans elle, une commande console acceptée laisse à l'écran une question posée au lieu précédent, et cette question est ré-injectée à la saisie suivante. Cette ligne entre dans le lot qui introduit `attente`.

**Mémoire, test neuf**, qui prouve que le contexte de R1 ne grossit pas avec la session : on assemble le contexte sur une session neuve au lieu X, puis après 40 `ALLER` acceptés qui ramènent en X. Les deux `contexte.texte` doivent être égaux (`toEqual`).

## Verdict

**Recevable sous réserve.** Le veto ne tient plus que sur (a) la forme résolue de tech-lead telle qu'elle est écrite, ou la forme réseau de QA, et (b) toute sortie de R1 qui passerait par `analyserSaisie`. L'adoption de la forme finale le lève. Le reste, ce sont des amendements.

## Décisions prises en autonomie faute de spécification

- Entête de `sans_commande` → `NON RECONNU` (UX garde le choix du mot final dans les contraintes) → si on garde SANS EFFET, le mot contredit le vocabulaire « effet » de J1 et devient un 3ᵉ résultat de fiction à côté d'ÉCHEC en n° 11.
- Registre des messages fixes → interface → en registre joueur, le moteur parle avec la voix du narrateur et affirme des faits sur le héros que l'auteur n'a pas écrits.
- Second libellé joueur dans `COMMANDES` → non → sinon deux textes pour une action, un seul consommateur, et une dérive.
- Liste du message → uniquement les gestes satisfiables de l'appel → sinon le moteur annonce une action qu'il vient de prouver impossible.
- Clôture de l'attente sur une commande console → dans `executerCommande` → dans le hook seul, la règle vit à deux endroits et une question périmée survit à un déplacement.
- `PRÉCISEZ` → dérivé de `session.attente` → avec une copie dans l'état du hook, la question devient invisible après une reprise alors que la garde anti-boucle agit toujours.
- Gabarit sans repère valide → sinon un `P1` recopié s'exécute en silence.
- Anti-boucle → tranchée par la transition, pas par la validation → sinon deux appels pour une issue déjà décidée.
- Lieu sans description → KR + `open_question`, pas un blocage → bloquer it1 ouvrirait `controles.ts`, donc une seconde feature en parallèle.

Fichiers relus pour ce tour : `tour1-{tech-lead,qa,ux-designer,pm-produit}.md`, `src/brain/dossier/session.ts` (l.114-116), `src/brain/dossier/commandes.ts` (l.62-72, 186), `src/brain/dossier/controles.ts` (l.168-208), `src/features/play-mode/tests/moteurSansIA.test.ts` (l.87-91), `worker/index.ts` (l.127-134), `docs/REGLES-PLAY.md` § J1.
