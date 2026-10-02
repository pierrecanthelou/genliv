# Raffinage `moteur-acteurs` it1 — Tour 1 — QA

## RISQUE
KR-280 : fail-closed sur portes de révélation — aucune porte non câblée ne laisse s'échapper un savoir. En it1, la règle s'applique à la garde structurelle : PNJ absent/sans identité refuse **avant** tout appel R4. KR-282 : relations secrètes ne sortent jamais du contexte de leur porteur — testé au niveau assembleur. KR-283 : sortie R4 invalide → rejeu unique puis silence déterministe.

## OBJECTION
1. **Pluriel** : deux PNJ du même nom au lieu courant. Cadrage silence. Deux options : (A) refuse (fail-closed), (B) appelle pour le premier. **QA propose A**.
2. **Verrou de tour** : commande R4 asynchrone, implicite en it1 (cadrage l'omet). **QA propose inclusion** (cohérent KR-265).
3. **Instrument pour gardes** : CONTRAT (`commandes.ts`) + RTL pour observable.

## PROPOSITION

Huit critères observables :

1. **Appel R4 scopé, réplique seule** — Contexte injecté ne contient jamais `heros.*`, id brut PNJ, ni savoir. Schéma `{replique}` seul (pas `indices_reveles`/`delta_confiance`/`resiste`). Réplique affichée via canal RÉCIT existant. **Instruments** : CONTRAT `contexte/acteur.test.ts` (isolation), `schemaSortie.test.ts` (schéma), RTL `PartieEnCours.test.tsx`.
2. **Garde : PNJ absent du lieu** — `TRANSITIONS.parler` refuse avant R4. Aucun appel `CopiloteService`. **Instruments** : CONTRAT `commandes.test.ts`, RTL message système.
3. **Garde : PNJ sans identité** (sans `fonction` ET sans `apparence`) — Même refus que #2. **Instruments** : CONTRAT + RTL identiques.
4. **Pluriel : plusieurs candidats du même nom** — Refuse (ou log d'erreur) ; aucun appel R4. **Instruments** : CONTRAT `commandes.test.ts` (fixture deux PNJ, même nom), RTL (vérifier 0 appels R4).
5. **Audience : relation secrète isolée** — PNJ A (porteur secret vers Z) : relation dans contexte. PNJ B (non-porteur) : relation absente. **Instruments** : CONTRAT `contexte/acteur.test.ts` (deux PNJ, inspection contexte injecté).
6. **Sortie R4 invalide : rejeu + silence** — Invalide → rejeu une fois → invalide → silence (pas de réplique, bannière `EchecCopilote`). **Instruments** : CONTRAT `worker/index.test.ts` (max 2 appels R4), `schemaSortie.test.ts` (validation), RTL (bannière observable).
7. **Verrou de tour** — R4 en cours : deuxième commande refusée. **Instruments** : RTL `PartieEnCours.test.tsx` (mock `CopiloteService` + délai, deuxième commande bloquée).
8. **Non-régression `moteurSansIA.test.ts`** — Seul fichier appelant R4 entre dans l'exclusion nommée. **Instruments** : CONTRAT `lintIsolation.test.ts` (grep), inspection manuelle.

## VERDICT
**RECEVABLE SOUS RÉSERVE.** Trois conditions bloquantes :
- `sessionDestinations`/`sessionCouverture` gardent `monde.personnages[].relations[]` hors contexte R4 pour non-porteurs.
- Aucun `heros.*` (audience `moteur`) ni id brut PNJ en contexte R4.
- Pluriel (#4) : trancher refus vs. premier. **Proposé : refuse (fail-closed)** — à valider par le tech-lead.

## Décisions prises en autonomie
Verrou de tour inclus (cohérent KR-265) ; pluriel refuse par défaut ; instruments précisés par niveau.

**Prérequis non-code** : `dossier-reference.json` à adapter — Mira présente au lieu de test avec identité (`fonction` OU `apparence`).
