# Tour 1 — `qa` · `dossier-controles` it8 (`canon-sans-objectif`)

**RISQUE** — le matériau de cette règle est une ABSENCE DE COLLECTION, jamais un élément : elle rompt sciemment la doctrine tenue par 6 règles antérieures. **Mesuré (exécuté, patch local restauré, MD5 identique avant/après, `git status --porcelain` vide)** : en BLOQUANT, **17 tests rougissent sur 3 fichiers** (`controles.test.ts` : 10, `panneauControles.test.tsx` : 4, `dossierEditorScreen.test.tsx` — une AUTRE feature — : 3) ; en ALERTE, **13 tests sur 2 fichiers**, `dossierEditorScreen.test.tsx` reste entièrement vert. **AC1 est FAUSSE dès que la règle existe, quel que soit le niveau retenu** — pas seulement un cas limite oublié.

**OBJECTION** — **REJETÉ (QA)** : conserver le texte actuel d'AC1 tel quel. C'est mesuré faux dans les deux options ; le laisser dans le plan reproduirait BUG-082.

**PROPOSITION** — (a) réécrire AC1 en « cinq lignes, dont deux BLOQUANT (depart + canon) », pas « quatre » ; (b) lister nommément dans le plan les tests certains à réécrire (10 dans `controles.test.ts` si BLOQUANT, 9 si ALERTE, + les 4 de `panneauControles.test.tsx`, + les 3 de `dossierEditorScreen.test.tsx` **si et seulement si** BLOQUANT) ; (c) placer l'entrée de registre **APRÈS `objectif-sans-chemin`** — mesuré : seul placement qui épargne « activer une ligne emet sa section » et « deux controles de meme section menent au meme endroit » ; (d) discriminer KR-197/202 par **MUTATION du MÊME dossier dans le MÊME test** (`objectifs: []` → un objectif poussé), jamais « deux canons côte à côte » — **un dossier n'a qu'un canon, la garde ne peut pas se lire littéralement ici et doit être réécrite pour ce cas.**

**VERDICT** — recevable sous réserve.

---

## ANNEXE — mesures

**Méthode.** Patch local temporaire dans `controles.ts` (entrée `canon-sans-objectif` insérée avant `avertissement-de-validation`), restauré par copie de sauvegarde hors dépôt, vérifié par MD5 avant/après (`3b73dc441c7c4a7f7409f66befe0c846` les deux fois) ; `git status --porcelain` vide à chaque restauration. *Vérifié indépendamment par l'orchestrateur : arbre propre.*

### 1. Rayon d'explosion exact — option BLOQUANT

- **`src/brain/dossier/controles.test.ts` — 10 tests rouges / 41** : `produit les quatre controles sur un dossier fraichement seme` · `jouable ne bascule vrai qu une fois le bloquant reecrit` · `chaque regle du registre exhibe un temoin qui la declenche` (TypeError — le témoin `Record<ControleId, Dossier>` n'a pas d'entrée pour la clé neuve ; **tsc l'attraperait à la porte, jest seul ne l'a pas vu**) · `les path sont des cles de DESTINATION_DES_CHAMPS` · `Controle ne porte jamais de severity` · `les messages francais n ecrivent jamais le glyphe en dur` (boucle supposant que TOUT constat sur `seme()` porte le marqueur) · `parSection porte les dix sections, dans l ordre du registre` · `rend une consigne distincte pour chacun des quatre controles` · `le lieu de depart desert bloque, et se tait sur un dossier sans personnage` · `le calme des deux fixtures et du dossier neuf ne bouge pas`.
- **`panneauControles.test.tsx` — 4/8 rouges** : `rend une ligne par controle...` (AC1, 4→5) · `dossier calme : texte d amorce, jamais une liste vide` (AC2, la scène `dossierCalme` ne touche jamais `objectifs`) · `un indice orphelin remonte une ligne BLOQUANT...` (1→2) · `un avertissement du validateur remonte une ligne ALERTE...` (l'assertion `BLOQUANT).toHaveLength(0)` devient fausse).
- **`dossierEditorScreen.test.tsx` — 3 rouges**, tous sur `BADGES_DOSSIER_NEUF[0]='ALERTE'` ou l'assertion explicite `ALERTE` pour Canon.
- **`sectionNav.test.tsx` — 0 rouge**, *confirmé par exécution, pas seulement par lecture*.

**Total : 17 tests / 3 fichiers**, dont 3 dans une feature sœur.

### 2. Même mesure — option ALERTE

**13 tests / 2 fichiers.** `dossierEditorScreen.test.tsx` passe **intégralement** (Canon reste au mot « ALERTE », `plusGrave` ne change rien) ; `controles.test.ts` perd exactement le test `parSection...` (9 au lieu de 10) ; `panneauControles.test.tsx` **inchangé** (4 — ces tests comptent des LIGNES et des TOTAUX, pas le mot).

### 3. `jouable`

Sur un dossier neuf : **inchangé dans les deux options** (`false` avant et après — `amorce-non-redigee` le rendait déjà `false`), déjà asserté (`controles.test.ts:1299`).

**Ce qui BOUGE, et c'est le vrai enjeu doctrinal** : un dossier dont les 4 proses ont été réécrites mais dont `objectifs` reste vide — **scène exacte du test `dossier calme`** — passe de `jouable: true` à `jouable: false` en BLOQUANT, reste `true` en ALERTE. Non asserté ailleurs que par ce seul test.

### 4. AC12 (KR-217, suites protégées)

Exécuté avec le patch BLOQUANT actif : `validate.test.ts`, `couverture.test.ts`, `suffisance.test.ts`, `amorce.test.ts`, `roundtrip.test.ts` — **278/278 verts**, aucune régression. Confirme que la règle ne traverse aucun canal `errors`/`warnings`.

### 5. Non mesuré, à vérifier par le lot qui écrira le code

Le choix définitif de `path` : le littéral `canon.objectifs` utilisé pour la mesure **ne satisfait PAS** `estCheminDeChamp` — ce n'est ni une clé de `DESTINATION_DES_CHAMPS` ni un préfixe de bloc valide. Un vrai `path` reste à choisir.

---

## Notes de l'orchestrateur

1. **Convergence indépendante sur le `path`** : la QA (par exécution) et le `tech-lead` (par lecture de `estCheminDeChamp`) arrivent séparément à la même conclusion — `'canon.objectifs'` est illégal. Deux méthodes, un résultat : le fait est établi.
2. **Le chiffre qui tranche le rayon inter-features** : 3 tests de `bascule-editeur` sous `bloquant`, **0 sous `alerte`**. Il recoupe exactement la mesure du `narratif-ia` (`BADGES_DOSSIER_NEUF[0]` reste `'ALERTE'`) et celle du `tech-lead` (`plusGrave` laisse `parSection.canon` inchangé). **Trois rôles, trois chemins, même résultat.**
