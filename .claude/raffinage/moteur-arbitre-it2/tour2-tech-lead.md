# Tour 2 — tech-lead — `moteur-arbitre` it2

## Réponses nommées aux 4 tensions

**1) `CibleArbitre` / `saisie` (narratif-ia, objection 1) — je me corrige, RETENU.** `useTourDeJeu.executeAction(saisie)` tient déjà `saisie` et la fait déjà voyager jusqu'à R1 (`CibleInterprete.saisie`) et R3 (`CibleNarrateur.saisie`) sans jamais la stocker en session — l'omettre de `CibleArbitre` n'était pas une garde d'audience supplémentaire, c'était un trou fonctionnel que j'ai laissé passer en tour1 : sans elle, R2 ne sait pas CE QUE le joueur tente et ne peut proposer ni `carac` ni enjeux pertinents à l'action réelle. Lot 1 corrigé : `CibleArbitre = { role:'arbitre'; saisie:string; lieu_id:string }`, toujours **sans** `session` — le durcissement par TYPE (jamais `heros`, jamais la mémoire) tient, narratif-ia et moi convergeons dessus explicitement.

**2) Schéma de sortie (narratif-ia, § C) — réouverture PARTIELLE du cadrage, motivée, pas molle.** Le wrapper `jet`/`sans_jet` fixé en cadrage est un homonyme **littéral** de `EntreeJournal.jet` — le champ que mon propre lot1 écrit dans `session.ts`. C'est exactement l'anti-motif que le précédent `narration` (réseau) ≠ `recit` (stocké), `tentatives` ≠ `suggestions`, `condense` ≠ `resume.texte` existe pour fermer (KR-231, voir `src/brain/index.ts:136,145-158` et `copilote/types.ts:559,583`). Un dev qui lit `.jet` sur une réponse R2 et `.jet` sur une entrée de journal lit deux formes différentes sous le même nom — confusion grep, confusion refactor, exactement ce que le précédent interdit.

Je tranche : **je renomme UNIQUEMENT le wrapper** → `epreuve` / `sans_epreuve`. Je **rejette** le reste de la proposition de narratif-ia (renommer `carac`→`aptitude`, `tc`→`difficulte`, `enjeu_reussite`→`si_reussi`, `enjeu_echec`→`si_rate`) : ces champs sont des **rangs re-résolus par appartenance** (`carac` ∈ `CHARACTERISTICS`, `tc` ∈ `CHALLENGE_TIERS`), pas des valeurs copiées verbatim sans contrôle — aucun homonyme réel à lever là, et renommer sans motif, c'est le churn que CLAUDE.md/WORKFLOW.md proscrit (abstraction/diff gratuit). `pourquoi` : **retiré** du schéma (pas renommé) — ni la carte (contrat UX exhaustif, 7 états, aucune mention) ni R3 ne le lisent ; KR-249 s'applique tel quel à un champ de sortie de modèle, pas seulement à `EtatSession`.

Schéma figé pour l'essaim :
```
{ epreuve: { carac: string; tc: string; enjeu_reussite: string; enjeu_echec: string } }
| { sans_epreuve: true }
```
Motif en une phrase : **un nom de champ qui traverse le réseau ET vit en session sous le même nom est le bug que ce projet a déjà payé une fois et nommé (narration/recit) — je ne le repaie pas une deuxième fois pour une question de confort cosmétique.**

**3) `Card.tsx` (UX) — RETENU, entre au lot 1.** C'est un fichier `brain/components/` : une feature ne peut pas le toucher, donc il n'a jamais sa place dans le lot 2. Prop ajouté : `shadow?: boolean`, défaut `true` (zéro régression sur les appelants existants — aucun autre composant ne passe `shadow={false}` aujourd'hui). `CarteJet.tsx` (lot 2) le consomme via `<Card shadow={false}>`, sans jamais toucher au fichier lui-même.

**4) QA — gaps fermés, pas juste accusés réception.**
- Son critère 4 demandait un test nommé pour le gate pur : absent de mon annexe tour1, qui ne listait que des tests d'assembleur/session. **Ajouté** : `src/brain/dossier/arbitre.test.ts` (nouveau fichier, lot 1) — `aller` jamais R2, `agir` sans héros jamais R2, `agir`+héros+`dangers` absent appelle quand même R2.
- Son critère 5 assumait `CorpsDemande.contexte = {lieu_id, description, dangers_texte?}` — **cette forme est maintenant fausse** : avec `saisie` ajoutée (point 1) et le catalogue de rangs nécessaire pour que R2 choisisse un `carac`/`tc` valide (voir § B de narratif-ia — sans lui, R2 devine ou invente hors du registre fermé), la forme réelle est plus riche. Le test `toEqual` strict qu'elle demande reste le bon instrument, mais sur la forme corrigée ci-dessous (annexe).
- Son constat sur `{sans_jet:true}` nominal sous-testé est juste : mon lot2 tour1 ne nommait que `useTourDeJeu.test.ts`/`CarteJet.test.tsx`/régression `EcranPartie` sans scénario explicite pour cette branche. **Ajouté** à `useTourDeJeu.test.ts` : `R2 rend {sans_epreuve:true} → aucune CarteJet ne monte, R3 est appelé immédiatement avec le même pas, session avance sans EntreeJournal.jet` — couvre en même temps l'état 2 du contrat UX (tour1-ux-designer.md).
- Son abandon du critère 9 (« rejeu unique » générique déjà couvert par `jusquAuRejeuUnique`) : je confirme substantivement, c'est de la machinerie déjà réutilisée par mon lot1, rien à construire — mais la reformulation du texte de critère reste la plume de PM/QA, pas la mienne.

## Statut de mes propres objections de tour 1

- Réserve du VERDICT tour1 (interface `useTourDeJeu` + non-ouverture de `session.attente` écrites noir sur blanc) — **MAINTENUE**, et maintenant satisfaite par l'annexe ci-dessous (interface complète, `carteJet` reste un `useState` local, jamais `session.attente`).
- Prédicat anti-tutoiement — **REJET maintenu** (je l'avais déjà rejeté en tour1 pour absence de garde validée sur les 8 rôles frères). Narratif-ia l'a retiré indépendamment, pour une raison technique plus forte que la mienne (le `\b` ASCII de JS matche « tête »/« vêtu », faux positifs qui tueraient des jets valides). Je **adopte sa mitigation** : la constante partagée `TENTATIONS` (lue par les invites R2 et R3, enjeux à l'infinitif) — elle tient dans mon lot1 (`worker/index.ts`, déjà propriétaire de `INVITES['arbitre']`), aucun fichier nouveau, aucun nouveau lot.
- Deux lots, pas trois — **MAINTENU**. Aucune des quatre tensions n'a fait apparaître un second fichier partagé entre lot1 et lot2 ; `Card.tsx` confirme même la règle plutôt que de la menacer (un fichier `brain/` de plus dans le lot `contrat`, jamais dans le lot `feature`).
- Note de dimensionnement (ne pas scinder lot2 orchestration/UI) — **MAINTENUE**, un seul consommateur réel toujours vrai.

---

## ANNEXE — Découpage en lots, mis à jour

**Lot 1 — `contrat`** (`brain/` + `worker/`), seul, exécuté en premier. *(deltas vs tour1 en gras)*

Fichiers créés (N) / remplacés (R) :
- R `src/brain/CopiloteService.ts` — 9e branche `CibleArbitre`/`ReponseArbitre` (surcharge publique + implémentation + `CorpsDemande`), garde `never` étendue aux 9 rôles.
- R `src/brain/copilote/contexte/arbitre.ts` — `assemblerArbitre(dossier, cible)` : lit `lieu.description` (requis) + `lieu.dangers` (optionnel) + `canon.ton`/`canon.interdits_ton` (optionnel, seulement si écrits) + **un CATALOGUE dérivé de `CHARACTERISTICS`/`CHALLENGE_TIERS` (8 lignes `C<n> — <label> : <describe>`, 4 lignes `D<n> — <difficulty>`, jamais les notations de dés, jamais `baseXp`) + `cible.saisie` normalisée, en dernier** ; ne lit **jamais** `cible.session` (absent du type) ; invariant testé par `copilote/contexte/arbitre.test.ts`.
- R `src/brain/copilote/contexte/narrateur.ts` — étend l'assembleur R3 pour dériver la classification qualitative du jet résolu depuis `EntreeJournal.jet` du tour courant, jamais les chiffres.
- R `src/brain/copilote/contexte/index.ts` — barrel, export `assemblerArbitre`.
- R `src/brain/copilote/schemaSortie.ts` — **`validerArbitre(brut, dossier)` : forme `{epreuve:{carac,tc,enjeu_reussite,enjeu_echec}} | {sans_epreuve:true}`** (wrapper renommé, `pourquoi` retiré) ; `carac`/`tc` constatés par appartenance à `CHARACTERISTICS`/`CHALLENGE_TIERS` ; prédicats 7-9 de narratif-ia (prose non vide/bornée, aucun identifiant, aucun chiffre `[0-9]`, `si_reussi`≠`si_rate` après trim) adoptés tels quels ; zéro clé commune avec les 8 formes réseau existantes **ni avec `EntreeJournal.jet`** (KR-231).
- R (au choix du dev-contrat, à figer une fois posé) `src/brain/copilote/types.ts` — `CibleArbitre`/`ReponseArbitre`/`PropositionEpreuve`.
- R `src/brain/dossier/alea.ts` — `DomaineAlea` élargi de `'heros'` à `'heros' | 'jet'`.
- R `src/brain/dossier/session.ts` — `EntreeJournal.jet?: { readonly lieu_id: string; readonly carac: string; readonly tc: string }` (nom STOCKÉ, inchangé, disjoint du nom RÉSEAU `epreuve`) + fonction unique d'écriture `consignerJet`.
- N `src/brain/dossier/arbitre.ts` — `doitArbitrer(commande, session): boolean` (gate pur sur structure) + classification `reussit`/`echoue` depuis `ChallengeResult.success`.
- **N `src/brain/dossier/arbitre.test.ts`** — `aller` jamais R2 ; `agir` sans héros jamais R2 ; `agir`+héros+`dangers` absent appelle quand même R2 ; classification réussit/échoue.
- **R `src/brain/components/Card.tsx`** — nouveau prop `shadow?: boolean` (défaut `true`), zéro régression sur les appelants existants.
- R `src/brain/index.ts` — barrel, export des types/fonctions neufs.
- R `worker/index.ts` — `INVITES['arbitre']` (voix à l'infinitif, constante `TENTATIONS` partagée R2/R3, catalogue injecté jamais récité, `sans_epreuve` si l'issue n'est pas incertaine) + `GABARIT_SORTIE['arbitre']` (schéma `epreuve`/`sans_epreuve`) ; `INVITES['narrateur']` amendé pour recevoir la classification de jet en contexte.
- R `worker/index.test.ts`, `worker/frontiere.test.ts` — parité de route, 9e rôle, scanner de mots interdits sur rangs C/D dérivés (disjonction avec A/P/G à vérifier explicitement par test — voir § décisions autonomes).
- R/N tests du lot : `schemaSortie.test.ts` (**y compris un cas nominal `{sans_epreuve:true}` accepté, pas seulement les refus**), `alea.test.ts`, `session.test.ts` (`consignerJet`), `copilote/contexte/arbitre.test.ts`, `copilote/contexte.test.ts` (invariance héros + catalogue stable), **`CopiloteService.test.ts` : `toEqual` strict sur `CorpsDemande.contexte` complet (lieu + canon conditionnel + catalogue + saisie), zéro `heros.*`, zéro identifiant brut**.

Interface figée par ce lot (point de rendez-vous de l'essaim) :
```ts
// CopiloteService.ts
demander(dossier: Dossier, cible: CibleArbitre, signal?: AbortSignal): Promise<ReponseArbitre>
interface CibleArbitre { role: 'arbitre'; saisie: string; lieu_id: string }  // JAMAIS session : héros et mémoire inatteignables par le TYPE
type ReponseArbitre = { statut: 'propose'; proposition: PropositionEpreuve } | EchecCopilote
type PropositionEpreuve =
  | { epreuve: { carac: string; tc: string; enjeu_reussite: string; enjeu_echec: string } }
  | { sans_epreuve: true }

// brain/dossier/arbitre.ts
function doitArbitrer(commande: Commande, session: EtatSession): boolean
// true ssi commande.commande === 'agir' && session.heros !== undefined — jamais sur dangers.

// brain/dossier/session.ts
function consignerJet(session: EtatSession, tour: number, jet: { lieu_id: string; carac: string; tc: string }): EtatSession
// seule porte d'écriture de EntreeJournal.jet — nom stocké, disjoint du nom réseau `epreuve`.

// brain/dossier/alea.ts
type DomaineAlea = 'heros' | 'jet'

// brain/components/Card.tsx
interface CardProps { /* …existant… */ shadow?: boolean }  // défaut true
```

**Lot 2 — `feature`** (`play-mode`), démarre contrat figé, séquentiel après le lot 1.

Fichiers (inchangés dans leur liste vs tour1, contenu amendé) :
- R `src/features/play-mode/hooks/useTourDeJeu.ts` — après persistance de R1, si `doitArbitrer(...)` : appelle R2 avec `{role:'arbitre', saisie, lieu_id}` (jamais `session`), range la proposition dans un `useState` local `carteJet` (jamais `session.attente`). Si `{sans_epreuve:true}` ou dégradation : appelle R3 immédiatement, comme avant cette itération. `lancerLeDe()` : `resolveChallenge` via `creerRng(graine_alea,'jet',indice)`, `consignerJet`, R3, vide `carteJet`, persiste. Verrou de tour étendu sur toute la chaîne (KR-265).
- N `src/features/play-mode/components/CarteJet.tsx` — composant pur, lit `carteJet` (shape locale, sans `pourquoi`) + `onLancer`, `<Card shadow={false}>`, aucun import `CopiloteService`.
- R `src/features/play-mode/components/EcranPartie.tsx` — montage conditionnel inline (KR-013).
- Tests : `useTourDeJeu.test.ts` (**+ cas nominal `{sans_epreuve:true}` : aucune CarteJet, R3 immédiat, session avance sans `EntreeJournal.jet`**), `CarteJet.test.tsx`, régression `EcranPartie`. Aucune modification attendue de `moteurSansIA.test.ts`.

Interface exposée par `useTourDeJeu` (amendée — `pourquoi` retiré) :
```ts
interface UseTourDeJeuResult {
  // …champs existants…
  readonly carteJet: { carac: string; tc: string; enjeuReussite: string; enjeuEchec: string } | null
  readonly lancerLeDe: () => Promise<void>
}
```

## Amendement proposé au critère d'acceptation 4 (à formaliser par l'orchestrateur en tour 3)

Remplacer « reçoit UNIQUEMENT la description du lieu et, s'il existe, le texte de dangers » par : « reçoit la description du lieu, son texte de dangers s'il existe, le ton du canon s'il est écrit, un catalogue dérivé des caractéristiques et tiers de challenge, et la saisie du joueur qui a déclenché le geste — **jamais la fiche du héros, jamais la mémoire** ». L'invariant protégé (exclusion du héros) ne bouge pas ; seule l'énumération s'élargit à ce que le cadrage n'avait pas détaillé.

## Décisions prises en autonomie faute de spécification

- Contenu exact injecté par `assemblerArbitre` au-delà de « lieu + dangers » (catalogue C/D, canon optionnel, saisie) n'était pas écrit au cadrage → j'ai adopté le catalogue + la saisie (sans eux R2 ne peut choisir un `carac`/`tc` valide ni savoir ce que le joueur tente) → si c'est l'inverse, le modèle devine les codes hors du registre fermé ou propose des enjeux sans rapport avec l'action tentée, et le validateur dégrade systématiquement en `sans_epreuve`.
- Nom du wrapper de sortie réseau (`jet`/`sans_jet` fixé au cadrage vs homonyme détecté) → renommé en `epreuve`/`sans_epreuve`, reste du schéma intact → si c'est l'inverse (garder `jet`), `reponse.proposition.jet` et `session.journal[i].jet` portent deux formes différentes sous le même nom — le piège de confusion que `narration`≠`recit` existe pour fermer.
- Disjonction des préfixes de rangs C/D vis-à-vis des scanners existants (A, P, G) — narratif-ia signale « à vérifier » sans trancher → j'assume la disjonction par construction des deux registres fermés, mais j'exige un test d'appartenance croisée explicite dans `worker/frontiere.test.ts` (déjà dans la liste du lot1) plutôt que de la laisser implicite → si c'est faux, un rang de catalogue pourrait être confondu avec un geste existant dans un scanner partagé, laissant passer une sortie corrompue.
- Valeur par défaut du prop `Card.shadow` → `true` (comportement actuel inchangé pour tout appelant existant) → si c'était `false` par défaut, toute carte existante du dépôt perdrait son ombre sans modification de son site d'appel — régression visuelle silencieuse et large.

## Fichiers lus pour ce tour

`.claude/raffinage/moteur-arbitre-it2/tour1-{tech-lead,narratif-ia,ux-designer,qa,pm-produit}.md`, `src/features/moteur-arbitre/specification.json` (intégral), `src/brain/dossier/commandes.ts` (COMMANDES, `agir` arité 0), `src/brain/dossier/interprete.ts` (flux `saisie`), `src/features/play-mode/hooks/useTourDeJeu.ts` (intégral), `src/brain/copilote/types.ts:519-525` (`CibleNarrateur`), `code-knowledge.json` KR-229 à KR-233, `src/brain/index.ts:120-161` (précédent `narration`≠`recit`, `repliques`≠`ajouts`), `src/brain/copilote/schemaSortie.ts:971-975`, `src/brain/CopiloteService.ts:748`, `src/brain/CopiloteService.test.ts:2206`.
