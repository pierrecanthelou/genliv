# Plan d'itération — `moteur-acteurs` · itération `4`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-03
> Composition : `5 rôles` — motif : l'itération touche le moteur IA, les contrats de sortie du modèle, les prompts et le mode jeu
> Exécution : `séquentielle` (2 lots)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut voir son PNJ exiger un jet avant de confier ce qu'il sait. » |
| **Tranche** | `docs/REGLES-DU-JEU.md` § 6 → `revelation.ts` (tri-état `sous_epreuve`) → `arbitre.ts` (`epreuvesReussies`) → `schemaSortie.ts` (forme B `resiste` + rang dû) → `acteur.ts` (bloc `CE QUE TU GARDES`) → `CopiloteService.ts` (opt-in `peutResister`) → `worker/index.ts` (gabarit) → `useTourDeJeu.ts` (aiguillage R4→CarteJet→jet→R4) |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, seul, en premier) |
| **Hors périmètre** | Multi-savoirs par réplique · limite de tentatives · réussite persistante dans `EtatPnj` · ligne RÉCIT contextuelle avant la carte · affichage de confiance · `intention_suivante` · focus clavier retour |
| **Reporté** | Ligne RÉCIT avant la carte (UX obj 1, si la démo montre l'ambiguïté → it5) · Focus clavier retour après CarteJet (UX obj 3, dette à déclencheur) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut voir son PNJ exiger un jet avant de confier ce qu'il sait. »

La porte `jet` de `revele_si` devient la 4e porte honorée. R4 gagne une forme disjointe `resiste` avec les enjeux. Deux appels R4 : le premier peut rendre `resiste` → CarteJet (tel quel, KR-289) → jet résolu par `issueDuJet` (KR-281) → second R4 avec issue, rang dû exigé.

## 2 — Hors périmètre

- **Multi-savoirs par réplique** : un seul savoir mis en jeu par appel, le premier en ordre de fiche.
- **Limite de tentatives** : re-tentative illimitée, chaque tentative coûte un pas. Bornée par le § 6 de la doc.
- **Réussite persistante dans `EtatPnj`** : la réussite est dérivée du journal par `epreuvesReussies`, rien de stocké (KR-013).
- **Ligne RÉCIT contextuelle avant la carte** : les enjeux sur la carte portent l'attitude du PNJ. Pas de prose additionnelle.
- **Affichage de confiance** et `intention_suivante` : hors Temps 1.
- **Focus clavier retour** : dette à déclencheur.
- **Modification de `CarteJet.tsx`** : réutilisée tel quel (KR-289).
- **Modification de la fixture** : Harek porte déjà `jet IN/TC1` sur `indice.pas-dans-la-cendre`.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**Aucun nouveau composant.** `CarteJet` réutilisée tel quel (KR-289).

**Enjeux** (validés par le schéma de sortie, pas des libellés UI) :
- ≤ 80 caractères (`ENJEU_CARACTERES_MAX`)
- Attitude, jamais contenu du savoir
- Distincts l'un de l'autre
- Sans marqueur (`porteUnMarqueur`), sans identifiant (`porteUnIdentifiant`), sans chiffre
- Sans retour à la ligne

**Textes constants du code** (lot A) :
- Bloc `CE QUE TU GARDES` (une ligne, signal sans contenu) : « Tu gardes un secret. »
- Ligne d'issue appel 2 : « Il cède. — {enjeu_reussite} » / « Il tient bon. — {enjeu_echec} »
- Amorce appel 2 (`À L'INSTANT`) : assemblée par le code, jamais par R4

**Bannière** : la bannière d'échec IA existante est réutilisée (pas de nouveau libellé).

*(Écrit par l'UX. Un agent doit pouvoir coder sans inventer un mot ni une valeur.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `evaluerSavoir` | fonction | consomme/émet | `(dossier, faits, personnageId, savoir, epreuves?: readonly JetReussi[]) → EtatSavoir` |
| `savoirSousEpreuve` | fonction (N) | émet | `(dossier, faits, personnageId, epreuves?: readonly JetReussi[]) → Savoir \| undefined` |
| `epreuvesReussies` | fonction (N) | émet | `(session, personnageId, avantTour?) → readonly JetReussi[]` |
| `EtatSavoir` | type | émet | `'absent' \| 'revelable' \| 'deja_confie' \| 'sous_epreuve'` |
| `JetReussi` | type (N) | émet | `NonNullable<Revelation['jet']>` (= `{ carac, tc }`) |
| `CibleActeurResistible` | type (N) | émet | `{ role: 'acteur'; personnageId; saisie; session; readonly peutResister: true }` |
| `CibleActeur` | type | consomme | `{ …; readonly peutResister?: false }` + champ `epreuve?` pour appel 2 |
| `ResistanceActeur` | type (N) | émet | `{ readonly resiste: EpreuveProposee }` |
| `validerActeur` | fonction | consomme | gagne `options?: { resistePermise?; rangDu? }` |
| `validerEnjeux` | fonction (N) | émet | extraction partagée avec `validerArbitre` |
| `assemblerActeur` | fonction | consomme | gagne `options?: { epreuve?; resistible? }` |
| `CopiloteService.demander` | surcharge (N) | émet | `(dossier, cible: CibleActeurResistible, signal?) → Promise<ReponseActeur \| ResistanceActeur \| EchecCopilote>` |

## 4 bis — Contrat de sortie IA

| | |
|---|---|
| **Contexte injecté — appel 1** | Les 10 blocs actuels + `CE QUE TU GARDES` (ssi `savoirSousEpreuve` défini). Une ligne constante sans prose d'auteur. Ni `formulation_joueur`, ni `revele_comment`, ni `verite` du savoir gardé. |
| **Contexte injecté — appel 2** | Même assemblage recalculé. `CE QUE TU GARDES` absent. Une ligne `À L'INSTANT` : « Il cède. — {enjeu_reussite} » ou « Il tient bon. — {enjeu_echec} ». En cas de réussite, le savoir entre dans `CE QUE TU PEUX CONFIER` avec `revele_comment`, marqué dû. |
| **Schéma de sortie — appel 1** | Forme A `{replique, indices_reveles, delta_confiance}` (13 prédicats, inchangés) OU forme B `{resiste:{enjeu_reussite, enjeu_echec}}`. Forme B légale ssi `resistePermise`. Clés mutuellement exclusives. |
| **Schéma de sortie — appel 2** | Forme A seule. `resiste` présent → `schema`. Rang dû exigé dans `indices_reveles`, sinon `rang-inconnu`. |
| **Échec de validation** | Rejeu puis silence (KR-283). Appel 1 : pas de carte, pas de jet, pas de delta. Appel 2 : jet consigné, XP créditée, réussite dérivée, dû survit au `parler` suivant. |
| **Ce que l'IA ne fait pas** | Dés (tirés par `issueDuJet`, KR-281), stats, inventaire, XP (créditée par `xpDuJet`). `carac`/`tc` lus dans `revele_si.jet` du savoir, jamais dans la sortie R4. |
| **Budget** | +120 caractères max (blocs mutuellement exclusifs). `max_tokens` reste 700. `BUDGET_CARACTERES_ACTEUR` à remesurer. |

## 5 — Lots

> Deux lots ne peuvent pas nommer le même fichier. Un lot `contrat` s'exécute seul, en premier.

### Lot A — `brain-acteur-jet` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : écrire la règle § 6, ouvrir la porte `jet`, ajouter la forme `resiste`, exiger le rang dû, extraire `validerEnjeux`
- **Fichiers** :
  - `docs/REGLES-DU-JEU.md` (R) — § 6, paragraphe porte `jet` **commité d'abord**
  - `src/brain/dossier/revelation.ts` (R) + `src/brain/dossier/revelation.test.ts` (R)
  - `src/brain/dossier/arbitre.ts` (R) + `src/brain/dossier/arbitre.test.ts` (R)
  - `src/brain/dossier/recit.ts` (R) + `src/brain/dossier/recit.test.ts` (R)
  - `src/brain/copilote/types.ts` (R)
  - `src/brain/copilote/schemaSortie.ts` (R) + `src/brain/copilote/schemaSortie.test.ts` (R)
  - `src/brain/copilote/contexte/acteur.ts` (R) + `src/brain/copilote/contexte/acteur.test.ts` (R)
  - `src/brain/CopiloteService.ts` (R) + `src/brain/CopiloteService.test.ts` (R)
  - `worker/index.ts` (R) + `worker/index.test.ts` (R) + `worker/frontiere.test.ts` (R)
- **Expose** : `EtatSavoir` (étendu), `JetReussi`, `savoirSousEpreuve`, `epreuvesReussies`, `CibleActeurResistible`, `ResistanceActeur`, `validerEnjeux`, surcharge `demander`
- **Consomme** : `EtatSession`, `Dossier`, `Savoir`, `Revelation`, `issueDuJet`, `resolveChallenge` (via `issueDuJet` seul, KR-281), `EpreuveProposee`
- **Critères couverts** : #1, #2, #5, #6, #7 (validation), #8
- **Contraintes** :
  - Aucun nom de service ni `/ia/` dans `brain/dossier/` (KR-260, `moteurSansIA.test.ts`)
  - `arbitre.test.ts` garde l'unicité de `resolveChallenge` (KR-281)
  - Mutation non due : aucun des 4 fichiers de règles n'est touché
  - Remesurer `BUDGET_CARACTERES_ACTEUR`
  - `code-knowledge.json` à 4 o du plafond → tout KR neuf impose compaction dans ce lot

### Lot B — `cablage-jet-dialogue`
- **Ouvrier** : `dev-lot`
- **But** : câbler le flux R4→CarteJet→jet→R4 dans le hook
- **Fichiers** :
  - `src/features/play-mode/hooks/useTourDeJeu.ts` (R) + `src/features/play-mode/hooks/useTourDeJeu.test.ts` (R)
- **Consomme** : `savoirSousEpreuve`, `epreuvesReussies`, `CibleActeurResistible`, `ResistanceActeur`, `issueDuJet`, `xpDuJet`, `crediterXp`, `consignerJet`, `consignerReponseActeur`
- **Critères couverts** : #3, #4, #7 (bannière)
- **Contraintes** :
  - `propositionEncourseRef` gagne un discriminant `{kind:'arbitre'} | {kind:'acteur', personnageId}`
  - `lancerLeDe` aiguille sur l'origine : R3 pour l'arbitre, R4 appel 2 pour l'acteur
  - Ordre des effets : `onSessionChange(session + jet + XP)` part AVANT l'appel 2
  - Échec de l'appel 2 : jet et XP persistés, `setAvis(échec)`, pas de texte de repli
  - `useTourDeJeu.ts` passera d'environ 454 à ~550 lignes (KR-112 signal 400, bloquant 800) — dette reportée à n° 13

## 6 — Critères d'acceptation

1. **Étant donné** `docs/REGLES-DU-JEU.md` § 6 **quand** on lit la section portes de révélation **alors** la porte `jet` y est décrite : mise en jeu en dernier quand c'est la seule porte fermée, challenge ordinaire § 2, XP selon § 5, réussite acquise par `(carac, tc)` pour la session, re-tentative possible au pas suivant — *niveau : doc* — *lot A*

2. **Étant donné** un savoir dont `revele_si.jet` est posé et dont toutes les autres portes (`contrepartie`, `apres_indice_id`, `confiance_min`) sont ouvertes **quand** `evaluerSavoir` est appelé sans `epreuves` **alors** il rend `'sous_epreuve'` — *niveau : unitaire* — *lot A*

3. **Étant donné** un PNJ avec un savoir `sous_epreuve` **quand** R4 rend `{resiste:{enjeu_reussite, enjeu_echec}}` **alors** `CarteJet` s'affiche avec les enjeux, `carac`/`tc` lus dans `revele_si.jet` — *niveau : composant* — *lot B*

4. **Étant donné** une `CarteJet` affichée depuis R4 **quand** le joueur lance le dé **alors** `issueDuJet` est appelé (KR-281), le jet est consigné, l'XP est créditée selon § 5 — *niveau : composant* — *lot B*

5. **Étant donné** un jet réussi sur un savoir **quand** R4 appel 2 rend `indices_reveles` sans le rang dû **alors** la sortie est rejetée `rang-inconnu`, rejeu puis silence (KR-283) — *niveau : unitaire* — *lot A*

6. **Étant donné** l'appel 2 (après résolution du jet) **quand** R4 rend `{resiste:…}` **alors** la sortie est rejetée `schema` (`peutResister: false` sur `CibleActeur`) — *niveau : unitaire* — *lot A*

7. **Étant donné** l'appel 1 avec `resistePermise` **quand** `resiste` est invalide (enjeux manquants, > 80 chars, identiques, avec marqueur/identifiant/chiffre) **alors** rejeu puis silence, la bannière d'échec IA existante s'affiche — *niveau : unitaire (validation lot A) + composant (bannière lot B)* — *lots A+B*

8. **Étant donné** un PNJ avec un savoir `sous_epreuve` **quand** le contexte de l'appel 1 est assemblé **alors** ni `formulation_joueur`, ni `revele_comment`, ni `verite` du savoir gardé n'y figurent ; le bloc `CE QUE TU GARDES` est présent — *niveau : unitaire* — *lot A*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `evaluerSavoir` rend `'sous_epreuve'` quand jet seule porte fermée | tri-état correct | jest unitaire | KR-280 | A |
| `evaluerSavoir` rend `'revelable'` quand jet réussi passé en `epreuves` | réussite déverrouille | jest unitaire | KR-280 | A |
| `evaluerSavoir` rend `'absent'` quand jet fermé ET `confiance_min` fermée | fail-closed, jet en dernier | jest unitaire | KR-280 | A |
| `savoirSousEpreuve` rend le premier savoir en ordre de fiche | un seul décideur | jest unitaire | — | A |
| `savoirSousEpreuve` rend `undefined` sans héros | garde | jest unitaire | — | A |
| `epreuvesReussies` dérive les réussites du journal | dérivation correcte | jest unitaire | KR-013 | A |
| `validerActeur` accepte `resiste` quand `resistePermise: true` | forme B légale | jest unitaire | KR-287 | A |
| `validerActeur` rejette `resiste` quand `resistePermise: false` | opt-in | jest unitaire | — | A |
| `validerActeur` rejette enjeu > 80 chars, avec marqueur, identifiant, chiffre | garde enjeux | jest unitaire | — | A |
| `validerActeur` exige rang dû quand `rangDu` posé | rang obligatoire | jest unitaire | KR-283 | A |
| `assemblerActeur` exclut `formulation_joueur`/`verite` du savoir gardé | étanchéité | jest unitaire | KR-229 | A |
| `assemblerActeur` inclut `CE QUE TU GARDES` ssi `resistible && savoirSousEpreuve` défini | signal conditionnel | jest unitaire | — | A |
| `@ts-expect-error` : `CibleActeur` ne peut jamais produire `ResistanceActeur` | opt-in au type | jest type | — | A |
| `validerEnjeux` partagée par `validerArbitre` et `validerActeur` | deux appelants, même garde | jest unitaire | KR-013 | A |
| `useTourDeJeu` affiche CarteJet quand R4 rend `resiste` | flux UI | jest composant | KR-289 | B |
| `useTourDeJeu` appelle R4 appel 2 après résolution du jet | chaînage | jest composant | — | B |
| `useTourDeJeu` : R4 silence → pas de carte, bannière d'échec | cas limite | jest composant | KR-283 | B |

Cas limites à couvrir :
- **Jet + `contrepartie` encore fermée** → `evaluerSavoir` rend `'absent'`, pas `'sous_epreuve'` (lot A)
- **Sans héros** → `savoirSousEpreuve` rend `undefined`, pas de bloc, `resiste` impossible (lot A)
- **Second R4 invalide** → rejeu puis silence, jet consigné, XP créditée, dû survit au `parler` suivant (lots A+B)
- **Double soumission du dé** → verrou de tour existant (KR-265) (aucun fichier)
- **Deux savoirs avec même `(carac, tc)`** → une seule réussite ouvre les deux portes (lot A)

**Non vérifiable en l'état** — la résistance hors sujet (R4 résiste sans connaître le contenu gardé, résidu de playtest KR-229) est bornée par le coût en pas, non par un test.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM, TL, NIA | § 6 vide — doc avant le code (KR-130/279) | `RETENU` | lot A, `REGLES-DU-JEU.md` § 6 |
| 2 | TL obj 1 | Tri-état `sous_epreuve` dans `evaluerSavoir`, jet évalué en dernier | `RETENU` | lot A |
| 3 | TL obj 2, NIA | Moteur choisit le savoir, pas R4 — `savoirSousEpreuve`, un seul décideur | `RETENU` | lot A |
| 4 | TL obj 3 (veto) | Opt-in `peutResister` sur les DEUX cibles | `RETENU` | lot A |
| 5 | QA obj 1 (veto) | Dissocier AC#7 en critères disjoints et testables | `RETENU` | 8 AC au § 6 |
| 6 | NIA obj 1 (veto conditionnel, levé) | Rang dû exigé dans `indices_reveles` de l'appel 2 | `RETENU` | lot A, validateur |
| 7 | PM obj 3 | Terminologie : « jet », jamais « jet de persuasion » | `RETENU` | `plan.goal` corrigé |
| 8 | PM obj 4, NIA | Appel 1 sans secret — test d'assembleur | `RETENU` | lot A |
| 9 | TL (annexe tour 2) | Identité de l'épreuve par `(carac, tc)` pour un PNJ, pas par savoir | `RETENU` | § 6 de la doc |
| 10 | NIA (annexe tour 1) | Fait persistant `EtatPnj` pour stocker la réussite | `REJETÉ` | Dérivable stocké (KR-013). Réussite dérivée du journal par `epreuvesReussies`. TL veto, PM refuse. |
| 11 | UX obj 1 | Ligne RÉCIT contextuelle avant la carte | `REPORTÉ` | Hors périmètre it4. Les enjeux portent l'attitude. Si la démo montre l'ambiguïté, it5. |
| 12 | UX obj 3 | Focus clavier retour après CarteJet | `REPORTÉ` | Dette à déclencheur. |
| 13 | NIA (annexe tour 1) | Ligne d'issue via `AMORCE_ISSUE` du narrateur | `REJETÉ` | « réussit » est un mot interdit de réplique (KR-270). Issue assemblée par le code avec un registre propre à R4. |
| 14 | TL (annexe tour 1) | Scission du lot A en A1/A2 | `REJETÉ` | Coupe crée une dépendance A2→A1 sur la signature de `evaluerSavoir`. 2 lots contrat séquentiels pour le même coût. |

## 9 — *(pas d'innovation)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] `npm run test:mutation` non dû (aucun des 4 fichiers de règles touché)
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-acteurs-it4.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve | § 6 écrit (obj 1), terminologie corrigée (obj 3), test assembleur (obj 4) |
| Tech Lead | recevable sous réserve | tri-état (obj 1), moteur choisit (obj 2), opt-in (obj 3 veto), doc d'abord (obj 4) |
| UX | recevable sous réserve | enjeux sans secret (obj 2). Obj 1 (ligne RÉCIT) REPORTÉE, obj 3 (focus) REPORTÉE, obj 4 retirée |
| QA | recevable sous réserve | AC dissociés (obj 1 veto), test porte jet (obj 2), bannière (obj 3), lecteur nommé (obj 4), cas limites (obj 5) |
| Narratif & IA | recevable sous réserve | rang dû au type (obj 1 condition levée), obj 2 retirée, § 6 écrit (obj 3) |
