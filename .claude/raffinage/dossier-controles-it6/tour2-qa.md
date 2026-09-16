# Tour 2 — qa — dossier-controles it6

## ANNEXE MESURÉE (les trois relevés mandatés — exécutés, pas déduits)

### Baseline avant tout — run réel

    npx jest src/brain/dossier/controles.test.ts src/brain/dossier/suffisance.test.ts \
      src/brain/dossier/couverture.test.ts src/brain/dossier/validate.test.ts \
      src/brain/dossier/roundtrip.test.ts src/brain/dossier/amorce.test.ts \
      src/brain/dossier/pastilles.test.ts src/features/dossier-controles --silent

→ `Test Suites: 8 passed, 8 total` / `Tests: 324 passed, 324 total`. C'est le dénominateur réel de « combien bascule ».

### 1. Rapport de `dossier-reference.json` / `dossier-minimal.json` sous saturation

Script jetable (`scratchpad/mesure-saturation.js`), qui **réimplémente indépendamment** l'algorithme actuel (à plat, copié de `controles.ts`) et le point fixe du tech-lead, directement sur les fixtures du disque — sans dépendre d'un `atteignabilite.ts` qui n'existe pas encore :

    === dossier-reference.json ===
    indice.pas-dans-la-cendre      flat=2 (silence)   sature=2 (silence)
    indice.sceau-brise-a-nouveau   flat=2 (silence)   sature=2 (silence)
    indice.lettre-de-la-vigie      flat=2 (silence)   sature=2 (silence)
    indice.trace-du-guet           flat=2 (silence)   sature=2 (silence)

    === dossier-minimal.json ===
    indice.cendres-tiedes          flat=1 (alerte)    sature=1 (alerte)
    indice.sceau-brise             flat=3 (silence)   sature=3 (silence)

**Conclusion : la prédiction du tech-lead est VRAIE, mesurée.** Sur `dossier-reference.json`, `pas-dans-la-cendre` est bien primaire ×2 (un savoir de Harek + le delta du jalon), et sa fermeture couvre ses deux `mene_a` sans rien changer au compte — 0 constat `indice-sans-source`. Sur `dossier-minimal.json`, les deux lignes de base (`controles.test.ts:590` et `:636-655`) sont **inchangées**, mesuré.

### 2. Assertions qui basculent — décompte exact, exécuté

Second script (`scratchpad/mesure-cas-mutes.js`), mêmes deux algorithmes appliqués aux dossiers mutés du fichier de test :

    cycle A<->B, sans savoir/delta            → A=0(bloquant) B=0(bloquant)   [actuel: 2 alertes]  BASCULE
    cycle A<->B + savoir sur A                → A=2(silence)  B=1(alerte)                          NOUVEAU
    auto-boucle nue A->A                      → A=0(bloquant)                 [actuel: 1 alerte]   BASCULE
    auto-boucle + savoir sur A                → A=2(silence)                                       NOUVEAU
    chaîne A(savoir)->B->C, ordre [C,B,A]     → A=1 B=1 C=1 (tous alerte)                          confirme point fixe
    chaîne ROMPUE A(savoir)->B, B-/->C        → A=1 B=1(alerte) C=0(bloquant)                      confirme non sur-propagation

**Décompte final, fichier par fichier :**

| Fichier | `it` touchés | Nature |
|---|---|---|
| `controles.test.ts` | **3 / 46** (l.609-634, l.657-685, l.744) | 2 réécrits, 1 littéral de chaîne changé |
| `controles.test.ts` l.590, l.636-655, l.687-727 | 0 | **inchangés, mesuré** |
| `suffisance.test.ts` | 0 | aucune occurrence de `mene_a`/`indice-sans-source`/`producteursParIndice` |
| `couverture.test.ts` | 0 | 3 occurrences de `mene_a`, toutes sur `DESTINATION_DES_CHAMPS` |
| `validate.test.ts` | 0 | ~20 occurrences de `mene_a`, toutes sur le canal `errors` — orthogonal |
| `roundtrip.test.ts`, `amorce.test.ts`, `pastilles.test.ts` | 0 | aucune occurrence |
| `panneauControles.test.tsx:145` | **0 ou 1, selon l'arbitrage C1** | voir ci-dessous |

Total plancher garanti : **3 tests sur 324** bougent pour la logique pure. Le tech-lead avait raison de corriger l'« aucun fichier de feature » du cadrage, mais avec la précision manquante que ce fichier ne bascule **que conditionnellement** au choix de prose — jamais par la saturation elle-même.

### 3. Devenir des balayages de source de `controles.test.ts`

Tous les usages de `SOURCE_CONTROLES` vérifiés un par un (l.489-490, 508-509, 1007-1112) :

- `l.489-490` (`MARQUEUR_A_ECRIRE`), `l.508-509` (`.errors`/`.warnings`), `l.1007-1112` (bloc `SITES_AVERTISSEMENT`, `split('.')`) — **aucun ne teste `producteursParIndice`**, tous restent pleinement significatifs. Aucun ne devient vert-et-vide.
- `l.729-745` (porteur unique de `'reveler_indice'`) — grep du littéral EXACT : il n'apparaît qu'à la ligne du filtre, à l'intérieur du corps qui migre en entier. Après déplacement, `controles.ts` porte **zéro** occurrence, `atteignabilite.ts` en porte **une**. **Ce test ne peut pas devenir vert-et-vide** : si l'assertion n'est pas réécrite, `porteurs` vaudra `['atteignabilite.ts']` et le test **rougit fort**.

**Conclusion : aucune garde de source ne devient verte-et-vide dans ce lot.** Le mode de panne « instrument qui ne sait pas échouer » ne se matérialise pas ici — mais il ne se déduisait pas, il se vérifiait.

---

## Réponse nommée à C1/C2, sous l'angle du coût en assertions — mon terrain

- **Mécanisme UX (deux textes, texte 1 verbatim inchangé)** : coût = **0 assertion existante réécrite**. Vérifié que `panneauControles.test.tsx:145` teste `indice.trace-oubliee`, un indice à **zéro producteur de toute nature** (fixture `dossierOrphelin`, l.105-124) : exactement le cas que le texte 1 inchangé continue de couvrir. Aucune assertion de `controles.test.ts` n'épingle le contenu littéral de `PROSES_INDICE_SANS_SOURCE`.
- **Mécanisme PM / narratif tour 1 (texte unique reformulé)** : les deux wordings **suppriment littéralement** « aucun enchaînement ». Coût mesuré = **1 assertion à réécrire**, `panneauControles.test.tsx:145` (échec loud, pas un vert-et-vide).
- **Aucun des trois mécanismes ne rend un test existant vert-et-vide.**
- **Ma préférence, motivée par le coût mesuré** : deux textes pour le bloquant + la correction de la remédiation ALERTE (`controles.ts:270`), qui ne coûte aucune assertion nulle part (vérifié : aucun test n'épingle ce fragment).

Je réponds aussi à l'**Objection 1 du tech-lead** : mesurée et confirmée, avec la précision que ce fichier ne bascule que conditionnellement.

## Mon objection de tour 1 — statut

- Volet « `controles.test.ts:744` nommément listé » → **RETIRÉE**, satisfaite par le plan tech-lead et vérifiée par grep.
- Volet « témoin de propagation positive » → **RETIRÉE pour la partie ordre** : mesuré, mon ordre `[A,B,C]` **ne discrimine pas** une mono-passe naïve (A=1,B=1,C=1 par coïncidence). L'ordre `[C,B,A]` du tech-lead la fait échouer. **MAINTENUE pour la partie pairage négatif** : aucun témoin du tech-lead ne pairait la chaîne rompue, exécutée ici (C=0 vs A=B=1), et elle attrape une **troisième** famille de bug — la clôture qui sur-propage par composante connexe.

**Témoin consolidé (C4)** : chaîne `A(savoir) → B → C`, `monde.indices` ordonné **`[C, B, A]`**. Positif : A=B=C=1 — attrape (a) la mono-passe en ordre document et (b) le filtre « racine seulement ». Négatif, DANS LE MÊME test : la même chaîne sans l'arête `B→C` — C reste à 0, A et B à 1 — attrape la sur-propagation.

## Critères d'acceptation exigés — voir § 6 du plan

**VERDICT — recevable sous réserve.** Réserve unique et mesurée : le plan doit trancher explicitement le mécanisme C1/C2 **avant** l'essaim — pas à la discrétion de l'ouvrier — et nommer le sort exact de `panneauControles.test.tsx:145` selon ce choix.
