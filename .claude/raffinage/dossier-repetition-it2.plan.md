# Plan d'itération — `dossier-repetition` · itération `2`

> Statut : `validé`
> Produit par : pm-produit · tech-lead · ux-designer · qa · narratif-ia — le 2026-10-08
> Composition : `5 rôles` — motif : l'itération touche le moteur de combat et les règles du jeu
> Exécution : `séquentielle` (1 lot)

## Fiche de validation *(à lire en deux minutes — le reste du plan est pour les agents)*

| | |
|---|---|
| **Démo** | « À la fin, l'auteur peut voir son joueur synthétique affronter les combats de son aventure au lieu de s'y arrêter. » |
| **Tranche** | `repeter.ts` (boucle combat) → `PanneauRepetition.tsx` (rendu des 5 motifs) ; pas de `brain/` ni de persistance |
| **Lots** | 1 lot · dont `contrat` : non |
| **Hors périmètre** | étalon (reporté), compteur `combats_gagnes`/trace, fuite, autres postures, butin/repos, stats à l'écran, lieux/PNJ non atteints |
| **Reporté** | étalon → itération future (§ 8 n° 1) ; badge `combats_gagnes` vs `combats_traverses` (§ 8 n° 3) |

---

## 1 — But raffiné

« À la fin de cette itération, l'auteur peut voir son joueur synthétique affronter les combats de son aventure au lieu de s'y arrêter. »

## 2 — Hors périmètre

- **Héros étalon** : section REGLES-DU-JEU.md, table dorée, `etalon.ts` — reporté à une itération future (KR-130 doc → test → code s'appliquera intégralement).
- **Badge / compteur de combats** : `combats_traverses` est dans le rapport (§ 6 n° 6) ; le Badge visible est reporté à it3 (dépliable des pas).
- Fuite et autres postures : le joueur synthétique joue toujours `'normale'` et ne fuit jamais.
- Butin, repos, équipement.
- Affichage des stats du héros à l'écran, étalon paramétrable par l'auteur.
- Lieux et PNJ non atteints (it3).
- Restructuration des critères par itération dans la spec (QA proposition 1 : édition de spec seule, hors lots).

## 3 — Contrat de design

**Composants.** `Card` (shadow=false), `Badge` (tone `neutral` uniquement), `ListRow`. Aucun nouveau composant. Le bouton primaire reste l'objet local `buttonStyle`.

**Tokens.** Tous vérifiés : `--text-strong`, `--text-body`, `--text-label`, `--fs-title`, `--fs-body`, `--fs-eyebrow`, `--lh-body`, `--track-eyebrow`, `--font-mono`, `--space-1/5/7`, `--accent`, `--accent-bg`, `--accent-line`, `--hit-target`. Interdits : `--good*`, `--bad*`, tout hex, tout `px` littéral.

**Eyebrow (inchangé).** `ARRÊT — PAS {pas} SUR {PAS_MAX}`. La borne de rounds de combat est `ROUNDS_MAX`, constante exportée à côté de `PAS_MAX`, jamais retapée dans le JSX.

**Textes par motif.** Voix à la 3e personne, passé composé, noms internes, « arrêt » partout, « blocage » nulle part. Le mot « round » suit le doc des règles (11 occurrences contre 2 pour « tour »).

| Motif | Titre (`--fs-title`, `--text-strong`) | Corps (`--text-body`) |
|---|---|---|
| `fin` | Le joueur synthétique a atteint la fin « {fin.nom} ». | — |
| `impasse` | Impasse pour un joueur qui ne fait qu'aller. | — |
| `mort` | Le joueur synthétique est mort face à {monstre.nom}. | Relancez pour tirer un autre parcours. |
| `combat_sans_issue` | Le combat contre {monstre.nom} n'a pas été tranché en {ROUNDS_MAX} rounds. | Ni le joueur synthétique ni {monstre.nom} ne l'a emporté. |
| `pas_max` | Le joueur synthétique a parcouru {PAS_MAX} pas sans atteindre de fin. | — |

**Nom du monstre.** Résolu via `BESTIARY_BY_TEMPLATE[ref.slice(PREFIXE_BESTIAIRE.length)]?.name`. Repli : « un monstre du bestiaire ». Jamais l'identifiant brut. Les deux exports sont déjà utilisés par `FicheEvenement.tsx`.

**Mort.** Token `--text-strong`, jamais `--bad` ni `--good` (KR-308). Le bleu ne marque pas un résultat.

**Structure du rendu.** Un `switch` exhaustif sur `r.arret` avec garde `default: never`. Un seul `ListRow` lieu par motif. Un motif sans copie ne compile pas.

**ListRow lieu.** `title` = nom du lieu, `subtitle` = description du lieu. Si introuvable, rien ne s'affiche, jamais l'identifiant.

**Clavier (inchangé).** `autoFocus` sur le bouton primaire. Entrée lance/relance. Tab : un seul contrôle par état. `Relancer` reste monté d'un résultat au suivant.

## 4 — Contrats `brain/` touchés

| Contrat | Type | Sens | Signature figée |
|---|---|---|---|
| `jouerPosture` | service | consomme | `(session: EtatSession, posture: Posture) => EtatSession` |
| `cloreCombat` | service | consomme | `(session: EtatSession, bilan: BilanCombat) => EtatSession` |
| `fixerHeros` | service | consomme | `(session: EtatSession, hero: HeroState) => EtatSession` |
| `BESTIARY_BY_TEMPLATE` | registre | consomme | `Record<string, BestiaryEntry>` |
| `PREFIXE_BESTIAIRE` | constante | consomme | `string` |

| Contrat `player/engine/` | Type | Sens | Signature figée |
|---|---|---|---|
| `rejouerCombat` | service | consomme | `(s: EtatSession) => RejeuCombat` |
| `bilanDe` | service | consomme | `(e: CombatState) => BilanCombat \| undefined` |
| `ouvrirRencontreSiDue` | service | consomme | `(dossier: Dossier, session: EtatSession) => EtatSession` |
| `finAtteinte` | service | consomme | `(dossier: Dossier, session: EtatSession) => {fin_id} \| undefined` |

Aucun contrat ajouté, aucun modifié. Zéro lot `contrat`.

## 4 bis — Contrat de sortie IA

Supprimé. Zéro appel modèle. Zéro prompt. Zéro prose générée. Frontière vérifiée par NIA.

## 5 — Lots

> Un seul lot : retirer `combat_ouvert` casse la compilation du panneau, les deux fichiers sont couplés.

### Lot 1 — `boucle-combat`
- **Ouvrier** : `dev-lot`
- **But** : Remplacer l'arrêt `combat_ouvert` par une boucle de combat (posture normale, bornée à `ROUNDS_MAX`). Deux nouveaux motifs d'arrêt : `mort` et `combat_sans_issue`. Panneau refait en switch exhaustif.
- **Fichiers** :
  - `src/features/dossier-repetition/utils/repeter.ts` (R)
  - `src/features/dossier-repetition/components/PanneauRepetition.tsx` (R)
  - `src/features/dossier-repetition/tests/repeter.test.ts` (R)
  - `src/features/dossier-repetition/tests/panneauRepetition.test.tsx` (R)
  - `src/features/dossier-repetition/tests/repeterCombat.integration.test.ts` (N)
- **Expose** :
  ```ts
  export const PAS_MAX = 20
  export const ROUNDS_MAX = 50
  export type MotifArret = 'fin' | 'impasse' | 'pas_max' | 'mort' | 'combat_sans_issue'
  export type RapportRepetition = {
    readonly graine: number
    readonly pas: number
    readonly lieu_id: string
    readonly combats_traverses: number
  } & (
    | { readonly arret: 'fin'; readonly fin_id: string }
    | { readonly arret: 'mort'; readonly monstre_ref: string }
    | { readonly arret: 'combat_sans_issue'; readonly monstre_ref: string }
    | { readonly arret: 'impasse' }
    | { readonly arret: 'pas_max' }
  )
  ```
- **Consomme** : `jouerPosture`, `cloreCombat`, `fixerHeros` (brain) ; `rejouerCombat`, `bilanDe`, `ouvrirRencontreSiDue`, `finAtteinte` (player/engine) ; `BESTIARY_BY_TEMPLATE`, `PREFIXE_BESTIAIRE` (brain)
- **Critères couverts** : #1–#8
- **Supprimé** : variante `'combat_ouvert'` du type, sa branche dans le panneau, les tests `combat_ouvert_*` d'it1 (réécrits, pas supprimés)
- **Inchangé** : `creerHerosSynthetique` (export pour test, restera jusqu'à l'étalon en it4), `creerRng(graine, 'heros', 0)`

**Architecture de la boucle de combat** (TL, validée NIA) :

Après `ouvrirRencontreSiDue`, si `session.combat` :
1. Poser `ROUNDS_MAX` fois `jouerPosture(session, 'normale')` sur une copie locale.
2. Un seul appel à `rejouerCombat` — il rejoue toutes les postures et s'arrête au premier `outcome` terminal (`rencontre.ts:93`). Coût O(N), pas O(N²).
3. Si `rejouerCombat` rend `ok: false` : throw d'invariant (référence invalide au SSOT, `validate.ts:459`).
4. `bilanDe` sur le résultat.
5. Pas de bilan → `combat_sans_issue` (arrêt).
6. Issue `hero-mort` → `mort` (arrêt). `cloreCombat` NON appelé.
7. Sinon → `cloreCombat(session_originale, bilan)`, `combats_traverses` +1, puis `finAtteinte` au même pas (KR-303). Le parcours continue.

Les postures gonflées ne sortent jamais de la boucle. `repeter.ts` n'importe jamais `combatEngine` ni ne construit de `SessionState` (veto TL maintenu).

## 6 — Critères d'acceptation

1. **Étant donné** un dossier jouable avec un combat sur le chemin, **quand** `repeter(dossier, graine)` est appelé, **alors** le rapport ne contient jamais `combat_ouvert` — l'union `MotifArret` ne porte que `fin | impasse | pas_max | mort | combat_sans_issue`. — *unitaire — lot 1*
2. **Étant donné** un combat dont le héros meurt, **quand** la boucle de combat se termine, **alors** le rapport rend `arret: 'mort'` avec `monstre_ref`, `cloreCombat` n'est PAS appelé, et `executerCommande` n'est plus appelé ensuite. — *unitaire (mocké) — lot 1*
3. **Étant donné** un combat dont le rejeu rend `ongoing` à chaque round, **quand** `ROUNDS_MAX` postures ont été jouées sans issue, **alors** le rapport rend `arret: 'combat_sans_issue'` avec `monstre_ref`. Le nombre exact de postures jouées est `ROUNDS_MAX` (mutant ±1 tue le test, KR-315). — *unitaire (mocké) — lot 1*
4. **Étant donné** un combat non mortel (victoire ou fuite du monstre), **quand** la boucle se termine, **alors** `cloreCombat` est appelé avec le bilan, les PV/PE/XP du héros sont mutés (usure cumulative), `combats_traverses` est incrémenté, et le parcours continue au pas suivant. — *unitaire — lot 1*
5. **Étant donné** un combat résolu au même pas qu'une fin, **quand** la boucle se termine en victoire, **alors** `finAtteinte` est évalué après `cloreCombat` au même pas (KR-303 : `finAtteinte` n'est jamais évalué pendant que `combat` est ouvert). — *unitaire — lot 1*
6. **Étant donné** un parcours qui traverse au moins un combat, **quand** le rapport est produit, **alors** `combats_traverses` compte le nombre de combats dont le héros est sorti vivant (y compris `hero-survived-unconscious`). — *unitaire — lot 1*
7. **Étant donné** un résultat `mort` ou `combat_sans_issue`, **quand** le panneau l'affiche, **alors** le nom du monstre est résolu via `BESTIARY_BY_TEMPLATE` (jamais l'identifiant brut), le switch est exhaustif avec `default: never`, et la mort utilise `--text-strong` (KR-308). — *composant — lot 1*
8. **Étant donné** le même dossier et la même graine, **quand** `repeter` est appelé deux fois, **alors** les deux rapports sont identiques (KR-304). — *intégration (moteur réel) — lot 1*

## 7 — Tests nommés

| Test | Assertion | Niveau | KR couvert | Lot |
|---|---|---|---|---|
| `mort_ne_clot_pas` | `cloreCombat` non appelé sur `hero-mort`, `executerCommande` non rappelé | jest (mocké) | KR-312 | 1 |
| `combat_sans_issue` | exactement `ROUNDS_MAX` appels de `jouerPosture`, mutant ±1 rouge | jest (mocké) | KR-315 | 1 |
| `survie_et_suite` | combat non mortel → `cloreCombat` appelé, parcours continue, `combats_traverses` +1 | jest (mocké) | KR-295 | 1 |
| `combat_puis_fin_meme_pas` | `finAtteinte` évalué après combat résolu, pas pendant | jest (mocké) | KR-303 | 1 |
| `rejeu_refuse` | `rejouerCombat` `ok:false` → throw | jest (mocké) | — | 1 |
| `integration_deterministe` | graines 0-9, jamais `combat_ouvert`, même graine = même rapport | jest (moteur réel) | KR-304 | 1 |
| `rejeu_en_un_coup_equivaut_au_pas_a_pas` | rejouerCombat en un coup donne le même bilan que N appels pas à pas | jest (moteur réel) | KR-292 | 1 |
| `panneau_switch_exhaustif` | chaque motif rend un titre, `mort` et `combat_sans_issue` résolvent le nom du monstre | RTL (composant) | KR-308 | 1 |

**Non vérifiable en l'état** : le faux signal de la posture normale (un joueur réel ferait mieux) — c'est le risque reconnu par le PM, non instrumentable sans IA tactique.

## 8 — Registre des désaccords

| # | Rôle | Désaccord | Statut | Motif / destination |
|---|---|---|---|---|
| 1 | PM (t1) | Étalon hors it2 → it4 | `REPORTÉ` | PM a retracté au tour 2, mais TL et NIA ont convergé sur le report. L'étalon porte KR-130 (doc → test → code) et sera une itération future, pas forcément it4. Le héros seedé reste en it2. |
| 2 | PM (t1) | `combat_ouvert` inatteignable après la boucle | `RETENU` | Variante supprimée de l'union, branche du panneau retirée, tests réécrits. Consensus 5/5. |
| 3 | PM (t2) | Badge `combats_gagnes` refusé en it2 | `REJETÉ` | Le champ `combats_traverses` (entier dérivé) est dans le rapport (critère #6). Le Badge visible est reporté à it3 — l'entier dans le type suffit pour it2 ; le Badge coûte un critère de composant. PM seul contre TL+UX+NIA. |
| 4 | TL (t1) | Veto si `repeter` fabrique un SessionState ou appelle combatEngine | `RETENU` | Veto conditionnel maintenu. Vérifié à la revue : aucun import de `combatEngine` ni de `SessionState` dans `repeter.ts`. |
| 5 | TL (t2) | `ROUNDS_MAX = 50` (vs PM/NIA 30) | `RETENU` | L'architecture rejeu-en-un-coup rend le coût O(N). 50 réduit les faux `combat_sans_issue`. Exporté, muté à ±1. |
| 6 | TL (t2) | `combats_traverses` pas `combats_gagnes` | `RETENU` | `hero-survived-unconscious` n'est pas une victoire (1 PV, 0 XP). Le terme « traversé » est techniquement exact. |
| 7 | UX (t1) | Nom brut du monstre = faute de registre | `RETENU` | Veto UX (domaine). Résolu via `BESTIARY_BY_TEMPLATE`, repli « un monstre du bestiaire ». Consensus 5/5. |
| 8 | UX (t1+t2) | Switch exhaustif + garde `never` | `RETENU` | Consensus TL+UX+QA. Un motif sans copie ne compile pas. |
| 9 | QA (t2) | `ROUNDS_MAX` muté et chiffré | `RETENU` | Couvert par le témoin `combat_sans_issue` : exactement `ROUNDS_MAX` postures, mutant ±1 rouge. |
| 10 | NIA (t1) | Stats étalon non écrites dans le doc | `REPORTÉ` | Migre avec l'étalon. KR-130 (doc → test → code) reste un veto pour l'itération qui le porte. |
| 11 | NIA (t1) | Mutation inter-combats non spécifiée | `RETENU` | `cloreCombat` après chaque combat non mortel. Critère #4. NIA a retiré au tour 2 (TL plan l'inclut). |
| 12 | PM (t2, annexe) | SACRIFIABLE resserré à L1 (étalon) | `REPORTÉ` | Avec l'étalon reporté, SACRIFIABLE reste sur it2 entière comme écrit dans la spec. |

## 9 — Innovation

Supprimé. Aucune proposition `INNOVATION` retenue.

## 10 — Définition de fini

- [ ] Porte qualité verte : `npm run format` → `npm run typecheck` → `npm run lint` → `npm test`
- [ ] Tests du § 7 écrits et passants
- [ ] Critères du § 6 cochés un par un
- [ ] Aucune régression sur les tests existants de la feature
- [ ] Aucun fichier touché hors de la liste de son lot
- [ ] Dossier de revue écrit : `.claude/raffinage/dossier-repetition-it2.revue.md`

`npm run test:mutation` n'est PAS requis : l'itération ne touche aucun des 4 fichiers mutés (`challenge.ts`, `combat.ts`, `xp.ts`, `characteristics.ts`).

## 11 — Signatures

| Rôle | Verdict | Réserve levée |
|---|---|---|
| PM | recevable sous réserve → **recevable** | spec réécrite à 8 critères (annexe PM t2), étalon reporté, veto retiré |
| Tech Lead | recevable sous réserve → **recevable** | 1 lot, étalon reporté, ROUNDS_MAX=50, switch exhaustif |
| UX | recevable sous réserve → **recevable** | nom du monstre résolu (veto levé), combat_ouvert retiré, switch exhaustif |
| QA | recevable sous réserve → **recevable** | type amendé, ROUNDS_MAX chiffré+muté, switch exhaustif, usure cumulative testée |
| Narratif & IA | **recevable** | étalon reporté avec KR-130 intact, usure dans le plan, zéro IA confirmé |
