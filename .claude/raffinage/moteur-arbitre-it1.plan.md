# Plan d'itération — `moteur-arbitre` · itération `1`

> Statut : `validé` — validation utilisateur le 2026-10-01
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-01
> Composition : `5 rôles` — motif : l'itération introduit `EtatSession.heros` et `brain/dossier/alea.ts`, consommés par les assembleurs R1/R3 de `brain/copilote/contexte/*` ; la frontière code/IA et l'audience doivent être gardées même si aucun appel au modèle n'a lieu en it1.
> Exécution : `séquentielle` (2 lots, contrat puis feature)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | À l'ouverture d'une partie sans héros, l'auteur crée son héros puis le regarde vivre dans le bandeau en se déplaçant. |
| **Tranche** | Écran de création → `EtatSession.heros` (brain/dossier/session.ts) → bandeau permanent, + règle A4 (+5 PE) câblée dans `commandes.ts` sur `aller`. Zéro jet, zéro IA. |
| **Lots** | 2 lots · dont `contrat` : oui (lot A, en premier) |
| **Hors périmètre** | Jet et toute IA (R2/R3 d'arbitrage) · calcul/gain d'XP · boutique de progression · repos/potions hors A4 · renoncer au jet · suppression/édition du héros · combat (n°13). |
| **Reporté** | Correction du texte `design_contract.bandeau_heros` dans `specification.json` (couleurs) → étape 7, après validation. A4 invisible en it1 (PE toujours pleins) et absence de reprise de session (un refresh contourne la relance unique) → consignés en `known_risks`/`open_questions`, aucune action corrective en it1. |

---

## 1 — But raffiné

À la fin de cette itération, l'auteur peut créer son héros à l'ouverture d'une partie, le voir affiché dans un bandeau permanent (nom, PV, PE, XP), et observer son PE remonter de 5 (plafonné) chaque fois qu'il se déplace réellement vers un autre lieu — sans qu'aucun jet ni aucune IA n'entrent en jeu.

## 2 — Hors périmètre

- Le jet et toute IA d'arbitrage (R2/R3) — it2.
- Le calcul ou le gain d'XP — it3.
- La boutique de progression (dépense de l'XP) — hors feature, question d'accès non tranchée (REGLES-PLAY §F2).
- Repos total / potions — PE ne se régénère qu'au changement de lieu (A4), rien d'autre en it1.
- Renoncer au jet (« Laisser/Passer ») — sans objet, aucun jet en it1.
- Suppression ou édition du héros — un seul héros par session, aucune action dangereuse à prévoir ici.
- Le combat (`combat.ts`/`combatEngine.ts`) — propriété n°13.

*(Écrit par le PM. Ce qui n'est pas ici sera codé par quelqu'un.)*

## 3 — Contrat de design

**`EcranCreationHeros.tsx`** (nouveau, `src/features/play-mode/components/`) — réutilise `heroGen.ts`/`charCreation.ts` par import direct, jamais `CharacterCreationScreen.tsx` verbatim (tutoiement, type concurrent). Registre VOUVOIEMENT.

- Titre : « Créez votre héros ».
- Label NOM (police `--font-mono`), placeholder « Aldric le Téméraire ».
- Instruction : « Choisissez un lancer, puis cliquez une caractéristique pour l'assigner. »
- Compteur bonus : « Bonus 1D4 : {n} point(s) restant(s) » / une fois distribué : « ✓ tout distribué » — en `--text-strong`, jamais `--good`.
- Bouton relance : « ⟳ Relancer » / une fois utilisée : « ⟳ Relancer (utilisée) », désactivé après.
- Bouton validation (accent) : « Valider → », `disabled` tant que la répartition n'est pas complète.
- Dés du pool : taille `--hit-target` (44px) ; sélectionné = `--accent` + `--accent-bg` ; assigné = `--surface-sunken` + `--text-disabled`.
- Prop requise **`graine: number`** — alimente `creerRng(graine, 'heros', 0)` pour le tirage initial et `creerRng(graine, 'heros', 1)` pour la relance. Le composant ne lit jamais `Math.random` : `jest.spyOn(Math,'random')` doit rester à 0 appel du montage à la validation.
- États : pas de vide (pool toujours complet au montage), pas de chargement, pas d'erreur. Focus initial sur NOM.
- Clavier : Tab NOM → dés → caracs → relance → valider. Entrée sur un dé = clic. Entrée ailleurs tant que la répartition n'est pas complète : aucun effet visible. Entrée une fois complet : équivalent clic Valider. Échap : non intercepté, remonte à `CadrePartie`.

**`BandeauHeros.tsx`** (nouveau, même dossier) — bandeau permanent, registre joueur, lecture seule.

- Anatomie : bande pleine largeur, `border-bottom: var(--bw-hair) solid var(--border-subtle)`, `background: var(--surface-card)`, police `--font-mono`, taille `--fs-meta`, padding aligné sur l'`<header>` de `CadrePartie`.
- Contenu : nom (`--text-strong`, semibold) · « PV {pv}/{pvMax} » · « PE {pe}/{peMax} » · « XP {xp} » — **tous en `--text-strong`/`--text-body`, AUCUNE couleur sémantique en it1** (`--good`/`--bad` réservées au `Badge` de `CarteJet`, it2 — CLAUDE.md : « les jets se résolvent en réussite/échec, seules couleurs sémantiques », aucun jet n'existe en it1). Séparateurs 1px entre blocs.
- Lit `heros.pvMax`/`heros.peMax` tels quels — ne recalcule jamais `maxPV(heros.caracs)` (KR-013 : une seconde formule du même fait).
- Il n'affiche jamais `heros.caracs` — leur seul lecteur visuel en it1 est `EcranCreationHeros`.
- États : pas de vide (n'existe qu'une fois `session.heros` écrit), pas de survol, pas de focus (rien d'interactif).

**`CadrePartie.tsx`** (modifié) — gagne une prop optionnelle `bandeau?: ReactNode`, rendue entre `<header>` et `<div style={corps}>`. Changement additif, zéro régression pour `EcranRefus` (qui ne la passe pas).

**`EcranPartie.tsx`** (modifié, fonction `PartieEnCours`) — GARDE 7, en ligne, après les hooks déjà appelés, avant le `return <CadrePartie>` :

```tsx
// GARDE 7 (it1, moteur-arbitre) — EN LIGNE, jamais un useEffect : session.heros
// est soit présent soit absent, jamais un flag séparé à synchroniser (KR-013).
if (session.heros === undefined) {
	return (
		<CadrePartie titre={dossier.titre} sortie={{ name: 'dossier', dossierId }}>
			<EcranCreationHeros
				graine={session.graine_alea}
				onValider={(heros) => setSession(fixerHeros(session, heros))}
			/>
		</CadrePartie>
	)
}
```

Une fois `session.heros` écrit, le rendu suivant tombe dans la branche normale, où `<CadrePartie bandeau={<BandeauHeros heros={session.heros} />}>` s'affiche.

Aucune animation sur le +5 PE : le chiffre change silencieusement au rendu suivant — aucun token de motion n'existe dans le design system.

*(Écrit par l'UX, corrigé au tour 2 : le snippet initial omettait la prop `graine`, ce qui aurait fait retomber le composant sur `Math.random` par défaut.)*

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `EtatSession.heros?` | type | provides | `readonly heros?: HeroState` (import tel quel de `src/player/types.ts`, jamais une seconde forme — optionnel à vie, KR-251) |
| `fixerHeros` | service | provides | `fixerHeros(session: EtatSession, heros: HeroState): EtatSession` — pure, seul écrivain de `heros` dans toute la feature |
| `DomaineAlea` | type | provides | `type DomaineAlea = 'heros'` (union fermée ; `'jet'` entre en it2 avec son consommateur, KR-249) |
| `alea` | registry | provides | `alea(graine: number, domaine: DomaineAlea, indice: number): number` — texte littéral du `brain_contract` acté au cadrage, inchangé ; exporté par `alea.ts` pour son propre test, non ré-exporté par le barrel |
| `creerRng` | registry | provides | `creerRng(graine: number, domaine: DomaineAlea, indice: number): () => number` — adaptateur pour les consommateurs `rng: () => number` (`rollCreationPool`, `resolveChallenge` en it2) ; `indice` est une clé d'USAGE (0 = premier tirage, 1 = relance), jamais une position de tirage consommée séquentiellement entre deux indices |
| `rollCreationPool` / `maxPV` / `caracs.EN` | service | consumes | réutilisés tels quels (`src/player/engine/charCreation.ts`, `src/brain/characteristics.ts`) |
| `assemblerInterprete` / `assemblerNarrateur` | service | consumes | inchangés — garantis **invariants** à la présence de `session.heros` par ce lot (§7) |

Pas de contrat de sortie IA en it1 (aucun appel au modèle) — § 4 bis supprimée.

## 5 — Lots

### Lot A — `contrat-heros-alea` `contrat`
- **Ouvrier** : `dev-contrat` (effort élevé, seul, en premier)
- **But** : poser `EtatSession.heros?`, `brain/dossier/alea.ts`, câbler A4, garantir par test que R1/R3 restent aveugles à `heros`.
- **Fichiers** :
  - `src/brain/dossier/alea.ts` (N)
  - `src/brain/dossier/alea.test.ts` (N)
  - `src/brain/dossier/session.ts` (R) — `EtatSession.heros?`, `fixerHeros`
  - `src/brain/dossier/session.test.ts` (R)
  - `src/brain/dossier/sessionDestinations.ts` (R) — racine `heros` + ses 9 feuilles, toutes `'moteur'` sans exception
  - `src/brain/dossier/__fixtures__/session-saturee.ts` (R) — instance `heros` sentinelle (caracs non-défaut)
  - `src/brain/dossier/sessionCouverture.test.ts` (R) — `toHaveLength(9→10)`, `DISPENSES_DE_FEUILLE` gagne `heros` (sixième dispense, libellés « cinq »→« six »)
  - `src/brain/dossier/commandes.ts` (R) — règle A4 dans `TRANSITIONS.aller`, docstring corrigée
  - `src/brain/dossier/commandes.test.ts` (R) — 5 scénarios séparateurs (§7)
  - `src/brain/copilote/contexte.test.ts` (R) — test d'invariance R1/R3 avec/sans `heros`
  - `src/brain/index.ts` (R) — barrel : `creerRng`, `DomaineAlea`, `fixerHeros`
- **Expose / consomme** : signatures du § 4, exactes
- **Critères couverts** : #2, #3, #4, #6, #7, #8

### Lot B — `feature-ecrans-heros`
- **Ouvrier** : `dev-lot`
- **But** : écran de création, bandeau, câblage de la garde 7.
- **Fichiers** :
  - `src/features/play-mode/components/BandeauHeros.tsx` (N) + test
  - `src/features/play-mode/components/EcranCreationHeros.tsx` (N) + test
  - `src/features/play-mode/components/CadrePartie.tsx` (R) — prop `bandeau?: ReactNode`
  - `src/features/play-mode/components/EcranPartie.tsx` (R) — GARDE 7
- **Expose / consomme** : lit `fixerHeros`/`creerRng`/`DomaineAlea`/`EtatSession.heros?` comme contrat gelé par le lot A
- **Critères couverts** : #1, #5

*(2 lots, fichiers disjoints. Exécution séquentielle — B ne compile pas avant que A existe ; aucun worktree parallèle à inventer.)*

## 6 — Critères d'acceptation

1. **Étant donné** une session sans héros, **quand** la partie s'ouvre pour la première fois, **alors** l'auteur voit l'écran de création (répartition 2D4×8 + bonus 1D4, une relance) et valider écrit `EtatSession.heros` via `fixerHeros` — *niveau : composant* — *lot B*
2. **Étant donné** une session et un `HeroState`, **quand** `fixerHeros(session, heros)` est appelé, **alors** `EtatSession.heros` porte exactement ce `HeroState`, sans seconde forme — *niveau : contrat* — *lot A*
3. **Étant donné** une graine fixée, **quand** le pool de caractéristiques se génère via `creerRng(graine,'heros',0)`, **alors** `Math.random` n'est appelé ni par `rollCreationPool` ni par `EcranCreationHeros` — *niveau : unitaire + composant* — *lots A+B*
4. **Étant donné** un pool déjà généré à l'indice 0, **quand** le joueur relance, **alors** `creerRng(graine,'heros',1)` rend un pool différent de l'indice 0 sur une graine épinglée — *niveau : unitaire* — *lot A*
5. **Étant donné** un héros existant, **quand** l'écran de partie s'affiche, **alors** le bandeau montre nom/PV/PE/XP en tons neutres (`--text-strong`/`--text-body`), sans `--good`/`--bad` — *niveau : composant* — *lot B*
6. **Étant donné** la commande `aller`, **quand** elle est acceptée vers un lieu différent du lieu courant et qu'un héros existe, **alors** `heros.pe` gagne +5 plafonné à `peMax` ; vers le même lieu, ou sans héros, `pe` reste inchangé (et la clé `heros` reste absente si elle l'était) — *niveau : unitaire (contrat)* — *lot A*
7. **Étant donné** les assembleurs `assemblerInterprete`/`assemblerNarrateur`, **quand** `session.heros` est présent ou absent, **alors** le texte produit (et les ancres) sont identiques — *niveau : contrat* — *lot A*
8. **Étant donné** la fixture de session saturée, **quand** `sessionCouverture.test.ts` s'exécute, **alors** les 10 racines (dont `heros`) ont chacune leur ligne d'audience `moteur`, zéro ligne morte hors les six dispenses déclarées — *niveau : contrat* — *lot A*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `alea.test.ts` — même clé | `creerRng(G,'heros',0)` appelé deux fois → mêmes 17 premiers tirages | jest | KR-249 | A |
| `alea.test.ts` — indépendance des clés | l'ordre d'appel entre les indices 0 et 1 ne change aucune des deux suites | jest | — | A |
| `alea.test.ts` — indices distincts | `creerRng(G,'heros',0)` ≠ `creerRng(G,'heros',1)` sur un `G` épinglé | jest | — | A |
| `alea.test.ts` — bornes | `0 ≤ x < 1` sur N tirages et sur les graines `0` et `2³²−1` | jest | — | A |
| `session.test.ts` — `fixerHeros` | `fixerHeros(session,H).heros === H`, le reste de la session inchangé | jest (contrat) | KR-013 | A |
| `sessionDestinations` — audience | toutes les lignes `heros.*` valent `'moteur'`, zéro exception | jest (contrat) | KR-232/262 | A |
| `sessionCouverture.test.ts` | `toHaveLength(10)` ; zéro ligne morte hors six dispenses | jest (contrat) | KR-232 | A |
| `contexte.test.ts` — invariance R1 | `assemblerInterprete` identique avec/sans `heros` (sentinelle `name≠défaut`, caracs≠4, pv≠pvMax) | jest (contrat) | KR-262 | A |
| `contexte.test.ts` — invariance R3 | `assemblerNarrateur` identique avec/sans `heros` (même sentinelle) | jest (contrat) | KR-262 | A |
| `commandes.test.ts` — A4 nominal | `pe=peMax−6`, `aller` vers un autre lieu → `peMax−1` | jest | REGLES-DU-JEU.md:43 | A |
| `commandes.test.ts` — A4 plafond | `pe=peMax−2`, `aller` vers un autre lieu → `peMax` | jest | REGLES-DU-JEU.md:43 | A |
| `commandes.test.ts` — A4 auto-référent | `pe=peMax−6`, `aller` vers le même lieu (`CHEMIN_MINIMAL`) → `peMax−6` | jest | REGLES-DU-JEU.md:43 | A |
| `commandes.test.ts` — A4 sans héros | session sans `heros`, `aller` → la clé `heros` reste absente (`'heros' in session === false`) | jest | KR-251 | A |
| `commandes.test.ts` — A4 mauvais verbe | `pe=peMax−6`, `agir` → `pe` inchangé | jest | — | A |
| `EcranCreationHeros.test.tsx` — zéro hasard | `jest.spyOn(Math,'random')` reste à 0 appel, du montage à la validation | jest/RTL | KR-249 | B |
| `EcranCreationHeros.test.tsx` — relance | le pool affiché après « Relancer » diffère du pool initial, sur une graine fixée en prop | jest/RTL | — | B |
| `BandeauHeros.test.tsx` — neutre | aucune règle `--good`/`--bad` rendue ; nom/PV/PE/XP affichés tels que passés en prop | jest/RTL | — | B |
| `EcranPartie.test.tsx` — garde 7 | sans `session.heros` → `EcranCreationHeros` monté ; avec → `BandeauHeros` monté dans `CadrePartie` | jest/RTL | KR-013 | B |

Cas limites couverts : pool toujours plein au montage (pas de vide) · relance épuisée · héros absent lors d'un `aller` · auto-référence · verbe `agir` (A4 ne doit pas s'y déclencher).

**Non vérifiable en l'état** — l'aléa keyé garantit la relance unique *pendant une session*, mais `useSessionPersistee.ts` ne relit aucune session existante et la graine est retirée à chaque montage de `PartieDemarree` : un rechargement de page contourne donc la règle « une seule relance » (REGLES-PLAY §B2). Non testable tant que la reprise de session n'existe pas (hors périmètre it1) — à recopier dans la revue.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | QA | Les 9 critères de `plan.acceptance_criteria` (feature) ne sont pas ceux d'it1 (ils couvrent R2/R3/XP) | `RETENU` | Critères propres à it1 écrits au § 6 ci-dessus, distincts de `plan.acceptance_criteria` qui reste l'index des 3 itérations |
| 2 | PM / QA / Tech Lead | Tension KR-013 : `HeroState.pvMax`/`peMax` stockés (import tel quel) vs dérivés à la lecture | `RETENU` | Stockés — écrits une seule fois par `maxPV`/`caracs.EN` à la construction (`heroGen.ts`/`charCreation.ts`), jamais recalculés ailleurs. Lecteur immédiat (construction) + second lecteur annoncé et daté (it2, `tierOf(heros.caracs[carac])`) : ne rouvre pas KR-249. Risque de divergence future (si `caracs` mute après création) consigné en `known_risks` de la spec, pas résolu ici |
| 3 | UX | `--good`/`--bad` sur PV/PE dès it1 (contredit son propre `design_contract` de cadrage) | `RETENU` | Retrait, tons neutres. CLAUDE.md : « seules couleurs sémantiques = réussite/échec » — zéro jet en it1, donc zéro condition de déclenchement de `--bad`. Confirmé par PM (valeur produit nulle avant it2) et QA (à documenter pour éviter la découverte tardive) |
| 4 | Tech Lead ↔ Narratif & IA | Signature finale de l'aléa : `fluxAlea(graine,domaine,indice):()=>number` (fonction unique) vs `alea(...):number` + `creerRng(...):()=>number` (deux fonctions) | `RETENU` | `alea(graine,domaine,indice):number` (texte littéral du `brain_contract` déjà acté au cadrage, préservé sans amendement) + `creerRng(graine,domaine,indice):()=>number` comme adaptateur, **avec `indice` obligatoire** — ferme le même bug de collision de relance que `fluxAlea` visait à fermer. `fluxAlea` `REJETÉ` — motif : aucune base dans les 10 notes de cadrage ni dans la spec (vérifié par grep), aurait exigé de réécrire `brain_contracts` sans bénéfice net |
| 5 | Tech Lead ↔ Narratif & IA | Condition d'application d'A4 : inconditionnelle sur `lieuCible.id === depuis` vs `lieuCible.id !== depuis` | `RETENU` | `lieuCible.id !== depuis` (changement réel de lieu). Citation : `docs/REGLES-DU-JEU.md:43` (« changer d'écran/zone = +5 PE ; repos total = requiert une potion ») + `docs/REGLES-PLAY.md:104` (E3, « pas de régénération passive ») + cohérence avec `commandes.ts:209-211` (n°10, qui distingue déjà demande/effet pour J1). La version inconditionnelle ouvrait une potion infinie sur tout lieu auto-référent (`CHEMIN_MINIMAL`, `commandes.test.ts:123-142`) |
| 6 | Tech Lead (tour 1, auto-objection) | Périmètre de fichiers du cadrage : `sessionDestinations.ts` et la fixture saturée absents | `RETENU` | Inclus dans le lot A (§5). `sessionCouverture.test.ts`, omis par le tech-lead lui-même au tour 1, ajouté au tour 2 et confirmé au lot A ci-dessus |
| 7 | Narratif & IA | Audience gardée côté données (`sessionDestinations.ts`) mais pas côté code — aucun test ne prouve que R1/R3 ignorent `heros` | `RETENU` | Test d'invariance ajouté au lot A (`contexte.test.ts`, § 7, critère #7) |
| 8 | Narratif & IA | Le snippet GARDE 7 de l'UX ne passe pas `graine` à `EcranCreationHeros` → retomberait sur `Math.random` | `RETENU` | Corrigé au contrat de design (§ 3) : prop `graine={session.graine_alea}` explicite |
| 9 | Narratif & IA | La clé `heros` doit rester ABSENTE (pas `heros: undefined`) quand il n'y a pas de héros | `RETENU` | Spread conditionnel dans `TRANSITIONS.aller`, précédent `commandes.test.ts:117-119` ; testé au critère A4-sans-héros (§7) |
| 10 | Narratif & IA (signal, pas un veto) | A4 est invisible à l'écran en it1 : les PE partent pleins (B4) et rien ne les consomme, donc toujours plafonnés | `REPORTÉ` | Consigné en `known_risks`/`open_questions` de la spec à l'étape 7. Aucune action corrective en it1 — accepté par le PM comme une propriété du squelette (seul le test unitaire observe A4) |
| 11 | Narratif & IA (signal, pas un veto) | Aucune reprise de session (`useSessionPersistee`) : un rechargement de page contourne la relance unique (B2) | `REPORTÉ` | Consigné en `known_risks` — le plan n'affirme pas que l'aléa keyé garantit la relance unique hors session active. Propriétaire futur : l'itération qui implémente la reprise (hors périmètre it1) |
| 12 | UX | Le texte `design_contract.bandeau_heros` de `specification.json` (ligne 9, « --good si >50%... ») contredit le contrat retenu ici | `REPORTÉ` | Correction à l'étape 7 du `/raffiner` (après validation utilisateur), dans le même lot que le code — jamais un texte de spec obsolète laissé en place |

*(Aucun désaccord ne disparaît sans statut.)*

## 9 — Innovation

*(Aucune proposition hors-cadre ce tour — supprimée.)*

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] `npm run test:mutation` — **sans objet pour it1** : aucun des 4 fichiers de règles (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`) ni leur test dédié n'est touché par les lots A/B
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature (`moteurSansIA.test.ts` continue de balayer `BandeauHeros.tsx`/`EcranCreationHeros.tsx` sans exception nommée)
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/moteur-arbitre-it1.revue.md`

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | GO, sans veto | Tension KR-013 retirée (tour 2) |
| Tech Lead | APPROVE sous réserve | Réserve (périmètre de fichiers du lot A + tests manquants) satisfaite au § 5/§ 7 |
| UX | Pas de veto, objection ferme maintenue (non durcie) | Couleurs retirées au § 3 ; correction de spec reportée (§8 #12) |
| QA | Recevable sous réserve | Critères scopés (§6), KR-013 tranché (§8 #2), tests d'aléa nommés (§7) |
| Narratif & IA | Recevable sous réserve | Signature d'aléa et condition A4 tranchées (§8 #4/#5), tests d'invariance et de garde ajoutés (§7) |
