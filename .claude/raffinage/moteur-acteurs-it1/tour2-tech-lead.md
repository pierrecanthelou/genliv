# Raffinage `moteur-acteurs` it1 — Tour 2 — Tech Lead

## RÉPONSE AUX OBJECTIONS — nommées

**1. `refKinds:['personnage']` ne compile pas — CONCÉDÉ.** Vérifié `src/brain/dossier/identifiers.ts:42` : `ESPACES_DE_NOMS` n'a pas de clé `personnage`, l'espace est `pnj`. Je corrige partout : `COMMANDES.parler = { label: '...', verbe: 'PARLER', refKinds: ['pnj'] }`. Même erreur présente dans `design_contract.declenchement` de la spec elle-même — à corriger dans le même lot.

**2. « `narrateur.ts` n'a besoin d'AUCUNE édition » — CONCÉDÉ EN PARTIE, REJETÉ EN PARTIE.** Relu `narrateur.ts` en entier. Deux choses distinctes étaient mélangées :
- *Le fix `LIGNE_DE_PAS_MAX` : RETENU, mais minimal et sans effet numérique en it1.* `ligneDuPas` (`:414-418`) lit `porteuse.recit ?? COMMANDES[porteuse.origine].label` sans regard à l'origine — une entrée `{origine:'parler'}` entre dans `RECEMMENT`/`A CONDENSER` exactement comme `agir`/`aller`, et son `recit` est alors la RÉPLIQUE (bornée `REPLIQUE_CARACTERES_MAX=400`), pas une narration (`NARRATION_CARACTERES_MAX=800`). Le commentaire de `BUDGET_CARACTERES_NARRATEUR` dit « chacun de ses termes est borné par un VALIDATEUR, donc la somme est EXACTE » — un théorème, pas une mesure ; cette phrase est fausse tant que `LIGNE_DE_PAS_MAX` ne cite pas `REPLIQUE_CARACTERES_MAX`. Mais `400<800`, donc `Math.max(NARRATION, REPLIQUE, ...labels)` vaut TOUJOURS 800 en it1 — `BUDGET_CARACTERES_NARRATEUR` ne bouge pas d'un caractère, aucun témoin `contexte.test.ts` existant ne change. Correction de contrat (la formule doit rester vraie par construction), pas une fonctionnalité. Édition : une ligne + une phrase de docstring.
- *Le bloc `PRESENTS` : REJETÉ pour it1.* La tête de fichier de `narrateur.ts` (KR-261) liste « les onze chemins de prose `ia` » comme liste FERMÉE, vérifiée par `contexte.test.ts` ligne à ligne, et dit explicitement « HORS `monde.personnages[]` — … et les fiches de personnage (n°12) ne sont pas comptés ». Ajouter `apparence` casse cet invariant écrit, oblige une re-mesure de `BUDGET_CARACTERES_DOSSIER` sur un chemin neuf — un second comportement observable que ni le `goal` d'it1 ni aucun critère ne demande. PM a raison : it1 est une seule capacité. Narratif-IA a raison sur le fix de formule, pas sur `PRESENTS` — je sépare les deux conclusions qu'elle avait assemblées.

**3. Compteur de rang partagé vs préfixe `I` séparé — CONCÉDÉ, j'adopte le mécanisme de Narratif-IA.** Relu `assemblerInterprete` (`interprete.ts:105-130`) et `validerInterprete`/`porteUnRang` en détail. Mon compteur partagé exige de faire circuler un compteur entre deux boucles indépendantes — strictement PLUS de code. Le préfixe séparé (`I<n>`, table `personnages` à part) résout le même problème avec MOINS de code (`lieux.size+1`/`personnages.size+1` restent chacun locaux). Sécurité de validation identique dans les deux cas. Lisibilité supérieure (`I3` se lit comme « interlocuteur » sans consulter la table). Extensibilité : un futur 3e `refKind` retombe proprement sur un 3e préfixe. Je retire ma proposition et j'adopte la sienne telle qu'écrite.

## Autres points

**Pluriel (QA).** Résolu par construction quand `fonction`/`apparence` diffèrent — chaque PNJ reçoit son propre rang `I<n>` indépendamment de son `nom` (jamais injecté). Pas résolu quand `fonction` ET `apparence` sont strictement identiques entre deux PNJ (homonymes véritables) — mais je ne retiens PAS le fail-closed dur de QA : la branche `{precision}` déjà câblée pour les lieux couvre ce cas (prédicat 12 étendu à `lieux.size>=2 || personnages.size>=2`, déjà dans la proposition de Narratif-IA) — le modèle PEUT demander « lequel ? ». Non vérifiable par jest (KR-229), classé résidu de playtest, pas un bug bloquant d'it1, candidat naturel pour la dette à déclencheur de `dossier-controles.ts`.

**`validerActeur` (Narratif-IA §E) — ADOPTÉ TEL QUEL**, les 8 prédicats dans l'ordre écrit. Aucune objection technique.

**`cible_indisponible` vs `cible_inconnue` — TRANCHÉ.** Précédent exact dans `TRANSITIONS.aller` : refus en deux temps, `acces_absent` puis `cible_inconnue` (référence orpheline, KR-021). `cible_inconnue` est déjà un membre du type `RefusCommande` — le réutiliser pour « l'identifiant ne résout dans aucun `monde.personnages[]` » coûte zéro nouveau membre. Je retiens : `TRANSITIONS.parler` refuse `cible_inconnue` (réutilisé) si le `pnj_id` ne résout pas, PUIS `cible_indisponible` (un seul nouveau membre) couvrant EN BLOC « résout mais absent du lieu courant OU sans prose d'identité » — même expérience observable, le `design_contract` les traite déjà comme une seule garde. Côté UX : un seul texte banni « {cible} n'est pas ici. » pour les deux refus en it1 — `TEXTE_PNJ_MORT` rejeté comme code mort.

## MON DÉCOUPAGE EN LOTS MIS À JOUR

| Lot | Type | Fichiers (N=créé, R=remplacé) | Dépend de |
|---|---|---|---|
| **1 — contrat** | `contrat`, seul, premier | R `src/features/moteur-acteurs/specification.json` (corrige `refKinds`) ; R `src/brain/dossier/commandes.ts` (+test) — `COMMANDES.parler{..., refKinds:['pnj']}`, `TRANSITIONS.parler` (refuse `cible_inconnue` puis `cible_indisponible`, sinon consomme un pas, écrit `recit` via `consignerNarration`), `personnagesPresents(dossier,session)` ; R `src/brain/dossier/session.ts` + `sessionDestinations.ts` — `EntreeJournal.interlocuteur?: string`, audience `'moteur'`, optionnel à vie (condition bloquante de Narratif-IA, vérifiée) ; R `src/brain/copilote/types.ts` — `CibleActeur`, `ReponseActeur={replique:string}`, `TablesInterprete.personnages: ReadonlyMap<RangInjecte,string>` ; R `src/brain/CopiloteService.ts` — 10ᵉ surcharge ; R `src/brain/copilote/schemaSortie.ts` — `validerActeur` (8 prédicats), `REPLIQUE_CARACTERES_MAX=400` (exporté), `validerInterprete` (5)+(12) et `porteUnRang` étendus (`\b[PGI]\d+\b`, résolution position par position, prédicat 12 `lieux.size>=2 \|\| personnages.size>=2`) ; N `src/brain/copilote/contexte/acteur.ts` — `assemblerActeur` ; R `src/brain/copilote/contexte/interprete.ts` — candidats PNJ en rang `I<n>`, compteur propre ; R `src/brain/copilote/contexte/narrateur.ts` — édition MINIMALE : `LIGNE_DE_PAS_MAX = Math.max(NARRATION_CARACTERES_MAX, REPLIQUE_CARACTERES_MAX, ...labels)` + docstring ; AUCUN bloc `PRESENTS` ; R `src/brain/dossier/interprete.ts` — `resoudreInterpretation` par table choisie ; R `src/brain/copilote/contexte/index.ts` (barrel) ; R `worker/index.ts` — `INVITES['acteur']`/`GABARIT_SORTIE['acteur']`, mesure de `BUDGET_CARACTERES_ACTEUR` (DOSSIER×3 + MÉMOIRE exacte 2911 + SAISIE exacte 309) ; R `worker/index.test.ts`, `worker/frontiere.test.ts` ; tests R/N associés. | rien |
| **2 — feature** | `feature`, après gel du lot 1 | R `src/features/play-mode/hooks/useTourDeJeu.ts` (+test) — sur `commande==='parler'` accepté : appelle `demander(...)` après persistance, `consignerNarration(...)` et persiste ; `EchecCopilote` → bannière existante, aucun texte de repli ; verrou de tour étendu. | Lot 1 |

Aucun fichier partagé. Séquentiel, pas de worktree parallèle.

Interface figée par le lot 1 (révisée) :
```ts
// CopiloteService.ts
demander(dossier: Dossier, cible: CibleActeur, signal?: AbortSignal): Promise<ReponseActeur>
interface CibleActeur { role: 'acteur'; personnageId: string; saisie: string; session: EtatSession }
// ReponseActeur = {statut:'propose', proposition: {replique:string}} | EchecCopilote

// brain/dossier/commandes.ts
export function personnagesPresents(dossier: Dossier, session: EtatSession): readonly string[]
// COMMANDES.parler: { label: '...', verbe: 'PARLER', refKinds: ['pnj'] }
// RefusCommande gagne 'cible_indisponible' (nouveau) ; 'cible_inconnue' (existant) réutilisé

// brain/dossier/session.ts
interface EntreeJournal { readonly interlocuteur?: string } // audience 'moteur', précédent `origine`

// brain/copilote/types.ts
interface TablesInterprete {
  readonly lieux: ReadonlyMap<RangInjecte, string>
  readonly personnages: ReadonlyMap<RangInjecte, string>   // NEUF, rangs I<n>, compteur propre
  readonly gestes: ReadonlyMap<RangInjecte, CommandeId>
}
```

## Décisions prises en autonomie (delta tour 2)
- `LIGNE_DE_PAS_MAX` corrigé mais `BUDGET_CARACTERES_NARRATEUR` numériquement inchangé → si `REPLIQUE_CARACTERES_MAX` dépassait 800 dans une itération future sans cette ligne, le budget mémoire mentirait en silence.
- Bloc `PRESENTS` descopé d'it1 → sinon it1 démontrerait deux comportements et casserait l'invariant écrit « HORS `monde.personnages[]` » sans qu'aucun critère ne le demande.
- `cible_inconnue` réutilisé (pas un nouveau membre) → sinon deux membres du registre porteraient la même sémantique que `aller` déjà nommée.
- Homonymie stricte classée résidu de playtest, pas un bug it1 → un fail-closed codé exigerait une comparaison de contenu entre fiches, scope non demandé.

## VERDICT
**Recevable sous réserve stricte** : le lot 1 ci-dessus (table révisée) est le périmètre exact — `refKinds:['pnj']`, `EntreeJournal.interlocuteur?`, table `personnages`/rangs `I<n>` séparés, édition minimale de `narrateur.ts` SANS bloc `PRESENTS`, `cible_inconnue` réutilisé + `cible_indisponible` neuf. Toute tentative d'ajouter `PRESENTS` ou d'enrichir la narration de R3 au-delà de la correction de formule est un veto.
