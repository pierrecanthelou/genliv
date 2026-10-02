# Raffinage `moteur-acteurs` it1 — Tour 2 — QA

## RÉPONSE AUX OBJECTIONS — nommées

### 1. Critère « pluriel » — deux PNJ du même nom
**Objection acceptée.** Le mécanisme de R1 (rang `I1`, `I2`…) était ma méprise. R1 ne résout jamais par nom littéral : il projette `fonction`/`apparence` (déjà `ia`) pour identifier les candidats. Deux PNJ portant des `fonction`/`apparence` IDENTIQUES forment un scénario d'ambiguïté de contenu D'AUTEUR, non un bug de code.
**Révision** : critère devient observationnel sur la projection : « Deux PNJ présents distincts par `fonction`/`apparence` doivent être distingués par R1 en rangs `I1`/`I2` uniques. Si indistinguables, c'est un défaut D'AUTEUR, pas un défaut de code. »
**Instrument** : test d'assembleur `contexte/acteur.test.ts` — vérifier `assemblerActeur` énumère chaque PNJ présent avec sa `identiteDe(pnj)` non vide et distincte des autres.

### 2. Huit scénarios de test de Narratif-IA (Annexe I)
**Acceptés intégralement**, chacun devient un cas d'usage de test d'assembleur ou de contrat : (1) prédicat par position `{parler,['P1']}`/`{aller,['I1']}` → tous deux `rang-inconnu` ; (2) mémoire isolée (séquence A×3/B×2/A×3 avec échec R4 → K=4 de A seul, jamais B) ; (3) contexte isolé (témoins uniques par champ, A ne reçoit jamais les champs de B) ; (4) faits du lieu vs héros (seul le lieu arrive à R4) ; (5) identité obligatoire (`cible-a-ecrire` sans fonction/apparence) ; (6) R3 injecte `apparence` seule ; (7) `doitArbitrer('parler')` = false ; (8) `LIGNE_DE_PAS_MAX ≥ REPLIQUE_CARACTERES_MAX`.

### 3. Critère 2 — Garde « mort » de PNJ
**Objection acceptée, descopé d'it1.** Aucun `EtatPnj.mort` n'existe avant n°13 (combat). Tester une garde sur état inatteignable produit du code mort. Garde structurelle ramenée à présence + identité non vide seules.

### 4. Audience de `relations[]` / `cede_si`
**Objection acceptée, clarification.** Narratif-IA : TOUTES les relations (pas juste secrètes) et `cede_si` sortent d'it1 — aucune n'entre réellement. Mon critère 5 testait un différentiel pertinent seulement à partir d'it2+. **Révision** : critère absolu — « En it1, aucune clé `relations`, aucune `cede_si` dans le contexte R4 injecté. »
**Instrument** : CONTRAT `contexte/acteur.test.ts` — inspecter le bloc, vérifier l'absence de `relations`/`cede_si` (audit sur `CHAMPS_INJECTES_ACTEUR`).

## MES CRITÈRES/TESTS MIS À JOUR

Dix critères observables (8 + 2 de non-régression) :

1. **Appel R4 scopé à un PNJ, réplique seule** (KR-231/262/285) — contexte sans `heros.*`, id brut, aucun savoir ; schéma `{replique}` exact ; réplique affichée via RÉCIT existant. Instruments : `contexte/acteur.test.ts`, `schemaSortie.test.ts`, RTL `PartieEnCours.test.tsx`.
2. **Garde : PNJ absent ou sans identité** (KR-262/280) — refus avant tout appel R4 si absence OU identité vide ; message « {cible} n'est pas ici. » ; pas de « mort » (n°13). Instruments : `commandes.test.ts` (TRANSITIONS.parler), RTL bannière.
3. **R1 résout par rang de position, jamais par nom** (KR-231/262) — `{parler, designe}` résout en `I<n>` par table de `refKinds[i]='pnj'`. Instruments : `schemaSortie.test.ts:validerInterprete` (prédicat 5 par position), `porteUnRang` étendu, `dossier/interprete.ts`. Scénario 1 ci-dessus.
4. **Candidats PNJ distincts et identifiables** (KR-262/284) — tout PNJ présent avec identité non vide reçoit un rang `I` unique, aucune énumération de nom littéral. Instruments : `contexte/acteur.test.ts`. Scénario 5 ci-dessus.
5. **Audience : aucune relation en it1** (KR-282/280) — toutes relations (y compris secrètes) et `cede_si` hors contexte R4. Instruments : `contexte/acteur.test.ts` (audit), grep `assemblerActeur`.
6. **Sortie R4 invalide : rejeu une fois, puis silence** (KR-283/230/285) — rejeu unique, puis silence (pas de réplique/delta/indice), bannière `EchecCopilote` existante, aucun texte de repli écrit par le code. Instruments : `worker/index.test.ts` (max 2 appels), `schemaSortie.test.ts:validerActeur`, RTL bannière. Scénario 2 ci-dessus.
7. **Verrou de tour** (KR-265) — deuxième commande refusée pendant l'attente de R4, levé au resolve. Instruments : RTL `PartieEnCours.test.tsx` (mock + délai).
8. **Mémoire de répliques isolée par PNJ** (KR-282/284) — R4 pour PNJ X reçoit ses 4 dernières répliques (`{origine:'parler', interlocuteur:X}`), jamais d'un autre PNJ, jamais de label en repli. Instruments : `contexte/acteur.test.ts`, scénario 2.
9. ~~R3 ne reçoit qu'apparence des PNJ présents (bloc PRESENTS)~~ — **à retirer si le veto du PM sur `PRESENTS` (tour 2) est confirmé en arbitrage : hors périmètre d'it1, aucun lecteur, R3 jamais appelé sur `parler`.**
10. **Non-régression : seul `moteurSansIA.test.ts` étendu** (KR-260) — aucun nouveau fichier dans l'exclusion nommée hors ceux appelant `CopiloteService` pour le rôle `acteur`. Instruments : `lintIsolation.test.ts` (grep).

**Non testable par jest (playtest)** : cohérence de voix (KR-229/270), contradiction de nom au-delà de K=4 répliques (résidu KR-284, session longue réelle).

## VERDICT
**Recevable sous réserve stricte.** Trois conditions bloquantes :
1. Lot contrat élargi conformément au Tech Lead (tour1 annexe C) : `schemaSortie.ts` + `contexte/interprete.ts` + `dossier/interprete.ts` inclus, un seul lot contrat.
2. Critère 2 confirmé : garde présence + identité seule, pas de « mort » (n°13).
3. Critère 5 confirmé : aucune relation, aucun `cede_si` en it1.

**Prérequis non-code** : `dossier-reference.json` — Mira présente au lieu de test, identité non vide (`fonction` OU `apparence`).

**Note pour l'arbitrage** : mon critère 9 (bloc `PRESENTS`) a été écrit en parallèle du veto du PM sur ce même bloc (tour 2) — à concilier à l'arbitrage, probablement en retirant le critère 9 d'it1.
