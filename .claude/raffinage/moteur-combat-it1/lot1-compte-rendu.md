# Lot 1 — `contrat-combat` — compte rendu (moteur-combat it1)

> Statut : **livré, vert**. Aucun BLOCAGE. Rien committé.
> Registre touché : **aucun** (ni `BESTIARY`, ni `CHALLENGE_TIERS`, ni `CHARACTERISTICS`, ni libellés de `POSTURES`) → table dorée non concernée, aucune section de `REGLES-DU-JEU.md` à citer pour une valeur de registre. Aucun des 4 fichiers mutés (`challenge/combat/xp/characteristics`) n'est touché (`combat.ts` n'est importé qu'en TYPE) → pas de run de mutation exigé.

## 1. Signatures réellement livrées (comparées au plan)

Toutes conformes au plan. Deux écarts de FORME, aucun de comportement visible d'un appelant (§ 2).

```ts
// src/brain/dossier/session.ts
export interface EtatCombat { readonly monstre_ref: string; readonly postures: readonly Posture[] }
// EtatSession.combat?: EtatCombat   — optionnel à vie (KR-251), jamais `| null`, clé ABSENTE (jamais `undefined`)
export type IssueCombat = 'hero-victory' | 'monster-fled' | 'hero-survived-unconscious' | 'hero-mort'
export interface BilanCombat {
  readonly issue: IssueCombat; readonly pv: number; readonly pe: number
  readonly xp: number; readonly pv_max_delta: number; readonly pe_max_delta: number
}
export function resoudreRencontre(session: EtatSession, rencontre: Rencontre): EtatSession
export function jouerPosture(session: EtatSession, posture: Posture): EtatSession
export function cloreCombat(session: EtatSession, bilan: BilanCombat): EtatSession

// src/brain/dossier/evaluate.ts
export interface Rencontre { readonly evenement_id: string; readonly monstre_ref: string }
export function evenementARencontrer(
  dossier: Dossier,
  session: { readonly monde: FaitsDeSession; readonly combat?: unknown },   // ← structurel, voir § 2 écart 1
): Rencontre | undefined

// src/brain/dossier/commandes.ts
export type RefusCommande = … | 'combat_en_cours'

// src/brain/dossier/alea.ts
export type DomaineAlea = 'heros' | 'jet' | 'combat'

// src/brain/dossier/monstre.ts   (NEUF)
export function monstreDeLaReference(reference: string): MonsterConfig | undefined

// src/brain/dossier/sessionDestinations.ts : combat, combat.monstre_ref, combat.postures[] = 'moteur'
```

`Posture` est importée de `src/brain/combat.ts` (type seul). `Rencontre` structurellement identique au littéral `{evenement_id: string; monstre_ref: string}` du plan.

### Sémantique livrée (arithmétique exacte, écrite à la main dans les tests)
- `resoudreRencontre` : pose `combat = {monstre_ref, postures: []}` ET ajoute `evenement_id` à `monde.evenements_consommes` (sémantique d'ensemble, pas de doublon, liste d'entrée rendue telle quelle si déjà présent), en un retour. `horloge`, `journal`, `heros` : MÊME RÉFÉRENCE. No-op (même référence) si `combat` existe OU `heros` absent.
- `jouerPosture` : ajoute À LA FIN. No-op (même référence) sans `combat`.
- `cloreCombat` (registre privé `CLOTURES: Record<IssueCombat, …>`, exhaustif par compilation) :
  - `hero-victory` / `monster-fled` : `pvMax' = max(1, pvMax + pv_max_delta)`, `peMax' = max(1, peMax + pe_max_delta)`, `pv' = min(bilan.pv, pvMax')`, `pe' = min(bilan.pe, peMax')`, XP via `crediterXp` (EN DERNIER, seule porte de `heros.xp`), clé `combat` RETIRÉE (`delete` sur copie, jamais `combat: undefined`).
  - `hero-survived-unconscious` : `pv = 1`, `pe = min(bilan.pe, peMax)`, AUCUNE XP, plafonds INTACTS, `combat` retiré.
  - `hero-mort` : session rendue À L'IDENTIQUE (même référence), `combat` reste.
  - No-op (même référence) sans `combat` ou sans `heros`.
  - `horloge`, `journal`, `monde` : même référence (un combat = un pas d'horloge, KR-295).
- `executerCommande` : UNE garde AVANT `TRANSITIONS` → `{ ok:false, refus:'combat_en_cours', message }` pour tout verbe (balayé depuis `COMMANDES`), prioritaire sur `acces_absent` / `cible_inconnue` / `cible_indisponible`, sans pas, sans ligne de journal, sans passe des jalons. Message : `Un combat est en cours : aucune commande n'est acceptée avant son issue.`
- `evenementARencontrer` : `undefined` si `combat` existe ; sinon le PREMIER événement (ordre du dossier) qui a `monstre_ref`, a un `declencheur_expr` VRAI (`evaluerExpr`, qui LÈVE sur entrée inconnue, aucun `catch`), n'est pas dans `evenements_consommes`. Sans `declencheur_expr` : jamais auto. Rend exactement deux clés. Ne résout PAS le monstre.
- `monstreDeLaReference` : `PREFIXE_BESTIAIRE` (de `validate.ts`, jamais retapé) + `estCleDe` (BUG-053) ; rend une COPIE profonde (KR-101 COPY-ON-USE), `undefined` sans lever sur toute référence qui ne désigne personne (casse exacte, préfixe seul, clés héritées de `Object.prototype`).

## 2. Écarts par rapport au plan

1. **`evenementARencontrer` : 2e paramètre STRUCTUREL, pas `EtatSession`.** Le garde `evaluate.test.ts` (« evaluate.ts n importe ni session.ts ni commandes.ts ») interdit à `evaluate.ts` de nommer `EtatSession` (regex sur `from './session'`, même en `import type`). Le plan ne l'avait pas vu. Pour tout appelant `evenementARencontrer(dossier, session)` avec une `EtatSession` **compile et se comporte à l'identique** — aucun impact sur le lot 2. Je n'ai ni amendé le garde ni créé de cycle.
2. **`Rencontre` exporté** (une déclaration, dans `evaluate.ts`, importée par `session.ts`) au lieu de deux littéraux `{evenement_id; monstre_ref}` recopiés. Structurellement identique.
3. **Barrel (`brain/index.ts`)** : sortent `resoudreRencontre`, `jouerPosture`, `cloreCombat` + types `EtatCombat`, `IssueCombat`, `BilanCombat`. **NE SORTENT PAS** `evenementARencontrer`, `monstreDeLaReference`, `Rencontre` (décision de moteur ; `src/player/engine/rencontre.ts` les importe EN PROFONDEUR : `../../brain/dossier/evaluate`, `../../brain/dossier/monstre`, `../../brain/dossier/session`). Le lot 2 ne peut pas toucher `brain/index.ts`.
4. Tests existants amendés par conséquence directe de la fixture saturée : `sessionCouverture.test.ts` (dispenses 6→7, racines 10→11) — prévu « si rougi » au plan.

## 3. Fichiers touchés (liste exacte)

Production : `src/brain/dossier/session.ts` (625→797 lignes ; < 800), `evaluate.ts`, `commandes.ts`, `alea.ts`, `sessionDestinations.ts`, `__fixtures__/session-saturee.ts`, `src/brain/index.ts`, `monstre.ts` (N).
Tests : `monstre.test.ts` (N), `session.test.ts`, `evaluate.test.ts`, `commandes.test.ts`, `alea.test.ts`, `sessionCouverture.test.ts`.
Aucun autre fichier. (`src/features/moteur-combat/specification.json` et `.claude/raffinage/*` étaient déjà modifiés/non suivis avant le lot.)

## 4. Tests de contrat ajoutés (52) et preuve de discriminance

Nouveaux : `evaluate.test.ts` +10, `session.test.ts` +23, `commandes.test.ts` +4, `alea.test.ts` +6, `sessionCouverture.test.ts` +2, `monstre.test.ts` 7. Tous les tests du § 7 du plan lot 1 sont présents (plus le cycle complet due→ouvert→joué→clos, l'accord `validateDossier`↔`monstreDeLaReference`, les garde-fous de forme `@ts-expect-error` : pas d'instantané, pas de posture hors registre, pas de `null`).

**Sondes de discriminance** : ~80 mutants écrits, appliqués un par un, jest lancé, restauration depuis SAUVEGARDE (jamais `git checkout`, KR-172). Tous rougissent sur le test NOMMÉ : inversion de signe des deltas, plancher 0 / 1 / 2, jauge non écrêtée / relevée, XP en direct au lieu de `crediterXp`, XP sur inconscient, `pe` non écrêtée, mort qui retire `combat`, `combat: undefined` au lieu d'un `delete`, garde combat après la transition / après les jalons / par verbe, ordre des refus, `in` au lieu d'`estCleDe`, copie superficielle, préfixe retapé, `catch` autour de l'évaluateur, dernier événement au lieu du premier, événement consommé non sauté, `monstre_ref` ignoré, hachage de domaine constant, ligne de destination basculée en `ia`/`auteur`, fixture sans `combat` / `postures` vide / triées / incomplètes. Deux survivants trouvés PUIS tués : (a) l'ordre des postures de la fixture n'était affirmé qu'en docstring → test ajouté (KR-169) ; (b) mon mutant « hachage sans domaine » était mal conçu (la longueur du nom suffit à séparer) → remplacé par « hachage constant », tué.

## 5. Appelants trouvés (Grep sur chaque symbole modifié)

- `RefusCommande` : export barrel seul ; aucun `switch`/`Record<RefusCommande,…>` ailleurs. Appelants de `executerCommande` : `EcranPartie.tsx:226` (affiche `resultat.message`, sans branche par code → compatible) et `interprete.ts:182` (`!resultat.ok` → `refus_moteur`, compatible).
- `DomaineAlea` : union ÉLARGIE ; consommateurs `alea.ts`, `arbitre.ts` (`'jet'`), `EcranCreationHeros.tsx` (`'heros'`) — aucun `Record<DomaineAlea,…>`. Sans impact.
- `EtatSession` : un champ optionnel ajouté. `keyof EtatSession` n'est exhaustif qu'à `sessionDestinations.ts` (mis à jour). Les 5 lecteurs de `SESSION_SATUREE` verts.
- Garde `moteurSansIA` : aucune occurrence des 4 motifs dans mes fichiers (commentaires inclus).
- Invariance d'audience mesurée À LA MAIN (fichier jetable, supprimé) : `assemblerInterprete`, `assemblerNarrateur`, `assemblerActeur` rendent un contexte IDENTIQUE avec et sans `session.combat` (clé seule, et via `resoudreRencontre`+`jouerPosture`) ; `assemblerArbitre` n'a pas de `session`. **Non écrite en test** (hors liste : le modèle est `contexte.test.ts:4350`) → à ajouter par QA / un lot qui rouvre ce fichier.

## 6. Porte isolée

`npx tsc --noEmit` : OK · `npx prettier --check` (fichiers touchés) : OK · `npx eslint src/brain/dossier src/brain/index.ts` : 0 · `npx jest --testPathPattern="src/brain/"` : 72 suites / 1658 tests verts · `moteurSansIA` : 4/4 · `lintIsolation` : 22/22 · jest complet : 138 suites / 2517 tests verts.

## 7. Blocages

Aucun.

## 8. Décisions prises en autonomie faute de spécification

- **2e paramètre de `evenementARencontrer`** → structurel `{monde, combat?: unknown}` plutôt que `EtatSession` → coût si l'inverse : amender/lever le garde `evaluate.test.ts` « evaluate.ts n importe ni session.ts » et ouvrir un cycle de type `evaluate`↔`session` ; les appelants n'y changent rien.
- **`Rencontre` nommée et exportée d'`evaluate.ts`** → une seule déclaration → coût si l'inverse : deux littéraux identiques dans deux modules qui divergent au premier champ ajouté.
- **Texte du refus `combat_en_cours`** (le type `ResultatCommande` exige un `message`, le plan n'en donne pas) → `Un combat est en cours : aucune commande n'est acceptée avant son issue.` → coût si l'inverse : une constante + ses assertions dans `commandes.test.ts` ; invisible en jeu tant que l'écran de combat remplace la console.
- **Place de la garde** → une seule, dans `executerCommande`, AVANT `TRANSITIONS` (prioritaire sur les autres refus) → coût si l'inverse (après résolution) : un `aller` vers un lieu inconnu en plein combat dirait `acces_absent` ; ou une garde par verbe qui oublierait le prochain verbe.
- **`resoudreRencontre` quand l'événement est déjà consommé** → le combat s'ouvre quand même, la liste est rendue telle quelle (sémantique d'ensemble) → coût si l'inverse (refuser) : un état « événement consommé sans combat » deviendrait bloquant au lieu d'être toléré.
- **`hero-survived-unconscious` applique `bilan.pe` (écrêtée à `peMax`) et IGNORE `xp`, `pv_max_delta`, `pe_max_delta`** (le plan dit seulement « pv = 1, pas d'XP ») → coût si l'inverse : si `pe` ne devait pas bouger, le héros retrouve son PE d'avant combat (repos gratuit) ; si les plafonds devaient varier, un drain de PV max infligé par un monstre qui met le héros à terre serait perdu. Une ligne chacun dans `CLOTURES`. Aligné sur l'ancien `onSurvivedUnconscious(updatedPe, …)` de `useCombat.ts`.
- **Victoire / fuite : `pv`/`pe` écrêtés au plafond neuf, SANS plancher inférieur** (un `pe` ≤ 0 reste légal : `REGLES-DU-JEU.md` § 1, « épuisé ») → coût si l'inverse : si `pv`/`pe` devaient être planchés, une ligne `Math.max`.
- **`cloreCombat` sans `combat` ou sans `heros`** → no-op, même référence → coût si l'inverse (lever, ou retirer `combat` quand même) : une session forgée sans héros mais avec `combat` serait soit un écran blanc, soit un état sans héros qui perd son combat en silence.
- **`monstreDeLaReference` rend une copie profonde (JSON)**, pas l'entrée du registre → coût si l'inverse : un consommateur qui muterait la config (rejeu, capacité) corromprait `BESTIARY` pour tous les combats suivants — le registre est épinglé par `rules.golden.test.ts`, qui ne s'exécute pas dans les tests de la feature.
- **Clause `templateId === ''` retirée de `monstreDeLaReference`** (mutant équivalent : aucune clé du registre n'est `''`) → coût si l'inverse : une ligne de défense redondante.
- **`PLANCHER_DES_MAXIMA` privé** (non exporté) → les tests épinglent le LITTÉRAL 1 du plan → coût si l'inverse : un test qui importerait la constante serait tautologique.
- **`evenementARencontrer` ne filtre pas une `monstre_ref` qui ne résout pas** (KR-021 : orpheline exposée, pas silencieuse) → coût si l'inverse : l'événement ne se déclencherait JAMAIS, sans aucun signal. **Mais voir le risque ci-dessous.**
- **Fixture saturée** : `combat = {monstre_ref: 'bestiaire.gobelin', postures: ['precise','normale','defensive']}` (ordre ni celui du registre ni son inverse, épinglé) → coût si l'inverse : un tri silencieux de la fixture.
- **Docstrings de `session.ts` resserrées** (850→797 lignes) → coût si l'inverse : un fichier > 800 lignes, seuil « merge blocker » de KR-112 (écrit pour composants/hooks, appliqué ici par prudence).
- **Valeurs plan-sourcées, ABSENTES de `docs/REGLES-DU-JEU.md`** : le plancher 1 sur `pvMax`/`peMax`, l'écrêtage des jauges au plafond neuf, `pv = 1` à l'inconscient (`REGLES-PLAY.md` E1 est un « défaut proposé »). Ce ne sont pas des entrées de registre (pas de BLOCAGE KR-130), mais le sens d'écriture « doc d'abord » voudrait qu'elles y soient écrites → **à propager par le lot 2 qui édite déjà `REGLES-PLAY.md`**, ou par l'étape Docs.

## 9. Risques et points d'attention pour le lot 2

1. **Impasse possible** : `rejouerCombat → { ok:false, refus:'monstre_inconnu' | 'heros_absent' }` laisse la session dans un combat dont AUCUNE issue ne sait clore (`cloreCombat` n'a pas d'issue « refusé ») et où TOUTE commande est refusée. Inatteignable sur un dossier validé (référence pendante refusée à l'import, KR-225), mais atteignable si le bestiaire du jeu perd un monstre entre l'écriture et la partie. Le lot 2 doit rendre cet état VISIBLE (écran/refus nommé), pas muet.
2. **Même clé d'aléa pour deux combats du même pas** : `creerRng(graine, 'combat', horloge.tour)` — deux rencontres dues au même `tour` (une fois la première close) rejouent le MÊME flux de dés. Déterministe, donc légal, mais corrélé. Plan/KR-295, non tranché ici.
3. `ouvrirRencontreSiDue` doit appeler `evenementARencontrer` APRÈS `executerCommande` (qui a déjà fait la passe des jalons) et AVANT toute persistance ; `resoudreRencontre` n'écrit ni journal ni horloge.
4. `EcranPartie.handleSoumettreConsole` affiche `resultat.message` : si l'écran de combat remplace la console, ce message n'est jamais lu ; sinon il s'affiche tel quel.
5. La session persistée avec `combat` ouvert se relit SANS `validerSession` (n'existe pas encore, KR-116) : `combat.postures` d'une valeur hors registre ne serait pas rejeté ici.
