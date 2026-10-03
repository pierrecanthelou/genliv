RISQUE — Deux dérives distinctes. (1) Rouvrir la Question 6 en raffinage reviendrait à défaire un acceptance_criterion DÉJÀ SIGNÉ au cadrage d'it3 (« R4 ne voit jamais le nombre ni le seuil ») sans repasser par le PM/cadrage. (2) `recit.ts:140-144` reste un écrivain destructeur (littéral `{a_dit:[...]}`) : non corrigé, le premier appel à `avecIndiceConfie` après it3 écrase silencieusement `confiance`.

OBJECTION — Vérifié moi-même l'objection 1 de Narratif-IA : `ROLE_10='acteur'` (worker/index.test.ts:1845), la ligne 1984 interdit bien `'confiance'` dans `INVITES['acteur'].systeme`. Fait réel. Mais la proposition B (enum `elan`) dévie du contrat déjà signé : l'AC d'it3 fixe `delta_confiance` entier `{-1,0,+1}`, rejet atomique. Le MÊME fichier porte déjà le remède : `'jet'` et `'indice'` sont explicitement EXCLUS de la liste `interdits` parce que la clé de schéma `indices_reveles` les contient — précédent nommé dans le commentaire du test lui-même. Retirer `'confiance'` de cette liste, même geste, est strictement moins cher qu'inventer un vocabulaire réseau parallèle. Sur Q6 : le bloc ENVERS LUI contredit littéralement l'AC déjà approuvée — ce n'est plus un arbitrage d'architecture, c'est une question de conformité au plan.

PROPOSITION — Un seul lot `contrat` : tout le périmètre d'it3 est `brain/`+`worker/` (la réplique passe déjà par le canal récit existant depuis it1, aucun fichier `features/`/`player/` n'a de raison d'être touché). J'ajoute `revelation.ts` (confiance_min passe de fail-closed permanent à évaluation réelle, critère 3 branches) et `recit.ts` (correction du spread) aux brain_contracts. Pas de lot feature séparé.

VERDICT — Recevable sous réserve des fichiers et signatures listés en annexe. Pas de swarm : un agent, séquentiel.

---

Réponse aux objections

Narratif-IA, Objection 1 (KR-235) — traitée, fait confirmé, remède différent : exclusion du mot de la liste `interdits` (précédent `'jet'`/`'indice'`), jamais changement de forme réseau.

Narratif-IA, Proposition B (enum `elan`) — rejetée, pas pour une raison de robustesse : un entier signé `{-1,0,+1}` n'est PAS plus fragile qu'un enum à 3 jetons (même rejet atomique, KR-230 s'applique identiquement aux deux). L'axe qui tranche est la conformité au contrat déjà signé (AC it3 écrit `delta_confiance` entier noir sur blanc), pas une préférence.

Narratif-IA, « Q6 = bloc ENVERS LUI » — rejetée, durcie en veto de conformité au plan. L'AC d'it3 énonce explicitement « R4 ne voit jamais le nombre ni le seuil » ; tout dérivé qualitatif de `confiance` injecté dans le contexte R4 est un blanchiment du même interdit. Rouvrir exige un retour au PM/cadrage.

UX vs Narratif-IA (mots interdits) — hors de mon domaine, un risque de collision signalé : si `motsInterdits.ts` finit par injecter une consigne « n'utilisez jamais tel mot » DANS le system prompt, le mot apparaît littéralement dans `INVITES['acteur'].systeme` — collision directe avec la liste `interdits` du test KR-235, à réconcilier dans le même lot quel que soit l'arbitrage de contenu.

Statut de mes propres objections de tour 1 :
- RISQUE avecIndiceConfie destructeur → MAINTENUE.
- OBJECTION recit.ts absent → DURCIE, j'y ajoute revelation.ts également absent.
- PROPOSITION (1) recit.ts + test croisé → MAINTENUE.
- PROPOSITION (2) Q6 = aucun signal → DURCIE en veto de conformité au plan.
- PROPOSITION (3) doc avant code → MAINTENUE et satisfaite (texte de Narratif-IA à verser tel quel).
- ANNEXE portesOuvertes + personnageId → RETIRÉE ET CORRIGÉE : la porte d'écriture nommée par le cadrage est `crediterConfiance(session, pnjId, delta)` dans session.ts. Le côté lecture vit dans `revelation.ts::evaluerSavoir`, qui doit gagner l'accès à `pnjId`/`EtatPnj.confiance`.
- ANNEXE delta_confiance entier [-1,0,1] sur le wire → MAINTENUE, confirmée par le texte signé du cadrage.
- ANNEXE sessionDestinations.ts nouvelle clé → MAINTENUE, confirmée mot pour mot par brain_contracts du cadrage.

Décisions prises en autonomie faute de spécification :
- Emplacement du texte d'invite décrivant delta_confiance → worker/index.ts (INVITES['acteur'].systeme), pas contexte/acteur.ts (qui assemble le contexte, pas le prompt système) → si c'est l'inverse, le correctif KR-235 vise le mauvais fichier.
- Mécanisme de correction de avecIndiceConfie → spread (`{...etatPnjExistant, a_dit:[...]}`) plutôt qu'une fonction d'update dédiée → si le cadrage préfère un second écrivain unique type crediterConfiance, le correctif de recit.ts doit déléguer à ce même point d'écriture.

Annexe technique — lot unique :

| Lot | Type | Fichiers (N=créé, R=remplacé) | Exécution |
|---|---|---|---|
| L1 | contrat | R faits.ts (EtatPnj.confiance?:number, CONFIANCE_DEPART) ; R session.ts (crediterConfiance) ; R sessionDestinations.ts (+1 ligne) ; R recit.ts (spread + ordre figé) ; R revelation.ts (confiance_min live + test 3 branches) ; R copilote/types.ts (ReponseActeur += delta_confiance) ; R CopiloteService.ts ; R worker/index.ts (INVITES['acteur'].systeme) ; R worker/index.test.ts (retrait 'confiance' de interdits) ; R docs/REGLES-DU-JEU.md (§ Confiance & Persuasion) ; R specification.json (AC 3-branches PM) ; R code-knowledge.json | Seul, séquentiel, aucun swarm |

Signatures de rendez-vous exposées par L1 :
```
type EtatPnj = { readonly a_dit: readonly string[]; readonly confiance?: number }
crediterConfiance(session: EtatSession, pnjId: string, delta: -1|0|1): EtatSession
type ReponseActeur = { replique: string; indices_reveles?: readonly string[]; delta_confiance?: -1|0|1 }
DESTINATION_DES_CHAMPS_DE_SESSION['monde.pnj.<id>.confiance'] = 'moteur'
```
Ordre figé dans recit.ts (repris de Narratif-IA, non contesté) : ré-évaluer sur l'état d'AVANT Δ → révéler → a_dit → appliquer Δ saturé via crediterConfiance → récit.

Fichiers consultés : worker/index.test.ts (l.1845, 1966-1992), sessionDestinations.ts, destinations.ts (l.283), types.ts (l.130-152, 548), specification.json (AC it3 l.23, brain_contracts l.29-43, KR-279 à 291), code-knowledge.json (KR-229, 230, 235, 270).
