# Tour 1 — `tech-lead`

RISQUE — **La bascule de la LIGNE DE BASE, invisible jusqu'à la fusion.** Dans `dossier-minimal.json`, `indice.cendres-tiedes` (l. 159) n'a qu'UN producteur — le `reveler_indice` de `monde.evenements[0].resolutions[0].consequence` (l. 194). « Goulot » s'y déclenche, or QUATRE assertions de `controles.test.ts` (l. 115, 143, 257, 265) pincent un compte GLOBAL sur ce clone. Un compte global parie qu'aucune règle future ne parlera sur la fixture : it3 perd ce pari, it5 le reperdra. **La DONNÉE est lue ; la COULEUR des tests n'est PAS mesurée** — aucun exécuteur à ce poste.

OBJECTION 1 — « cinq règles » compte des EMPLACEMENTS, pas des causes. Orphelin (0 producteur) et goulot (1 producteur) sont UNE cause à deux seuils sur UN compteur ; `ControleDescripteur.niveaux` existe pour ça, et it1 a déjà tranché ainsi pour `amorce-non-redigee`. **QUATRE entrées.**

OBJECTION 2 — Le cadrage annonce « une fixture d'exercice locale (N) ». La `resolved_decision` d'it1 l'interdit nommément : clone muté d'UN seul champ, dans le test. J'infirme ce fichier.

PROPOSITION — (a) les quatre tests d'amorce filtrent par `id === 'amorce-non-redigee'` (~6 lignes) + une sonde neuve épingle la ligne de base du clone ; (b) le `path` reste une clé LITTÉRALE DÉJÀ PRÉSENTE de `DESTINATION_DES_CHAMPS`, choisie par entrée — aucune clé neuve, aucun normaliseur ; (c) l'index des producteurs reste PRIVÉ à `controles.ts`, en `Map` et non en `Record` (KR-175 ne se pose alors pas) ; `atteignabilite.ts` naît à it5, **par EXTRACTION**.

VERDICT — **recevable sous réserve** (quatre entrées · ligne de base réécrite · clause d'audience amendée).

## ANNEXE

### 1. Découpage — UN SEUL LOT, marqué `contrat`

Motif : it1 et it2 ont construit la surface GÉNÉRIQUE exprès pour ça. Cinq règles n'ajoutent **aucune forme** : zéro composant, zéro prop, zéro export neuf de `brain/index.ts`. **Rien à paralléliser** — et les deux découpages concevables (index vs règles ; indices vs personnages) **partagent tous deux `controles.ts`**, veto de propriété non disjointe. *Le découpage révèle le parallélisme, il ne le crée pas.*

| Lot | Type | Fichier | N/R | Contenu |
|---|---|---|---|---|
| L1 | `contrat` | `src/brain/dossier/controles.ts` | R | +4 entrées de `CONTROLES`, +index privé des producteurs, +proses FR |
| L1 | | `src/brain/dossier/controles.test.ts` | R | +~10 tests, réécriture des 4 assertions de compte global, sonde de ligne de base |
| L1 | | `src/features/dossier-controles/tests/panneauControles.test.tsx` | R | **+1 test seulement** (preuve VERTICALE = la phrase de démo). Les 3 existants inchangés |

**HORS lot, assertion à tenir** : `brain/index.ts` · `destinations.ts` · `types.ts` · `validate.ts` · `tables.ts` (lu) · `pastilles.ts` · `sections.ts` · `PanneauControles.tsx` · `ListeControles.tsx` · **tout `src/features/bascule-editeur/**`**. **L'itération ne touche AUCUNE autre feature** — première itération de n° 7 dans ce cas.

**Condition de validité du lot unique** : les quatre règles doivent être **muettes sur un dossier fraîchement semé**. Mesuré sur `construireAmorce` (`personnages: []`, `indices: []`) : orphelin, goulot, sans-présence, sans-voix se taisent d'eux-mêmes ; **seul « départ désert » doit être gardé** (R-7). Sinon `panneauControles.test.tsx` **et** `dossierEditorScreen.test.tsx` entrent au lot et le critère n° 1 de la spec doit être amendé.

### 2. Signatures

**Rien de public ne change** — `ConstatControle`, `Controle`, `ControleDescripteur`, `controlerDossier`, `controleRemediation` intacts. *Un contrat qui ne bouge pas est le meilleur résultat possible d'une itération de registre.*

Privé neuf (non exporté) :

```ts
type SourceIndice = 'savoir' | 'delta' | 'mene_a'
function producteursParIndice(dossier: Dossier): Map<string, SourceIndice[]>
```

`Map` et non `Record` : indexée par une valeur venue du document, donc KR-175 ne se pose pas. Sites de deltas lus depuis **`CHEMINS_DE_DELTAS`** (`tables.ts` l. 636-641), jamais re-listés (KR-199), filtre `delta === 'reveler_indice'`. ⚠ `CHEMINS_DE_DELTAS[].location` est un **LIBELLÉ** (« Jalons », « Climat »), **pas un `SectionId`** : il n'entre jamais dans `ConstatControle.section`.

Quatre entrées : `indice-sans-source` (`niveaux: ['bloquant','alerte']`, section `indices`, path `monde.indices[].id`) · `depart-desert` (`['bloquant']`, section `depart`, path `charpente.depart.lieu_id`) · `personnage-sans-presence` (`['alerte']`, section `personnages`, path `monde.personnages[].presence[].lieu_id`) · `personnage-sans-voix` (`['info']`, section `personnages`, path `monde.personnages[].caractere.parler[]`).

**Détail que l'ouvrier ne peut pas deviner** : la `remediation` d'it1 dispatche sur `constat.path` ; `indice-sans-source` a **un seul `path` pour deux niveaux**, donc sa remédiation dispatche sur **`constat.niveau`**. Repli obligatoire : chaîne **vide**, jamais une levée.

### 3. Tension n° 1 — vérifiée de sa main

`presence[].lieu_id` (l. 337, `moteur`) ✅ · `caractere.parler[]` (l. 360, `ia`) ✅ · `monde.indices[].id` (l. 410) ✅ · `charpente.depart.lieu_id` (l. 566) ✅ · `monde.personnages[].id` (l. 145) ✅. **Sans le suffixe `[]` : AUCUNE** (`…presence`, `…caractere.parler`, `…caractere`).

**L'option « ajouter la clé manquante » est FERMÉE par un test existant** : `destinations.ts` l. 87-90 écrit qu'une telle ligne « serait morte le jour même où elle est écrite, et l'assertion "aucune ligne morte" de `couverture.test.ts` la ferait rougir ».

**Position** : le `path` est une **DESTINATION**, pas une assertion d'existence — il nomme la feuille qui devrait porter la valeur, au chemin de TABLE, choisi **par entrée**, littéralement, jamais dérivé ni normalisé (un normaliseur n'aurait qu'un appelant : dette).

### 4. Quatre entrées, pas cinq

1. **Un seul compteur les produit** — `0` → bloquant, `1` → alerte, `≥2` → silence. Deux entrées liraient deux fois le même index : deux parcours, deux vérités.
2. **La spec a déjà tranché cette forme deux fois** — `amorce-non-redigee` est UNE entrée à deux niveaux ; « objectif sans chemin » est déclarée bloquante/alerte selon le même compteur. Scinder ici obligerait à scinder là : **KR-164 en sens inverse**.
3. **`ControleDescripteur.niveaux` n'a pas d'autre raison d'exister** — une itération qui émet un niveau par entrée le rend décoratif.

### 5. REJETS nommés (→ § 8 du plan)

- **R-1 — REJETÉ : deux entrées pour orphelin + goulot.** Un compteur, deux seuils ; scinder serait KR-164 en sens inverse.
- **R-2 — REJETÉ : la fixture d'exercice locale (N) du § 4 du cadrage.** La `resolved_decision` d'it1 prescrit le clone muté d'un seul champ ; une fixture de plus est une troisième vérité figée.
- **R-3 — REJETÉ : créer `brain/dossier/atteignabilite.ts` à it3.** Un seul appelant, et le second sature un AUTRE graphe (faits/prédicats, pas indices). **Charge écrite pour it5 : elle EXTRAIT l'index privé, elle ne le ré-implémente pas.**
- **R-4 — REJETÉ : ajouter `…presence` ou `…caractere.parler` à `DESTINATION_DES_CHAMPS`.** Ligne morte par construction, rougie par `couverture.test.ts` ; la feature a juré de n'ouvrir aucun lot contrat sur ce fichier.
- **R-5 — REJETÉ : dériver la `section` du `path`.** KR-219 — `indice-sans-source` en est la démonstration (path `indices`, remède dans Personnages).
- **R-6 — REJETÉ : abaisser « indice orphelin » à alerte au nom de l'audience.** La mesure du cadrage est juste (l. 261 = `ia`), mais le critère est une **disjonction sur trois producteurs**, dont `mene_a[]` (l. 438) et les sites de `CHEMINS_DE_DELTAS`, tous `moteur`. **Amendement proposé** : *la clause d'audience porte sur les champs de PROSE, jamais sur les RÉFÉRENCES structurelles.* Abaisser tuerait la phrase de démo, qui exige `jouable === false`.
- **R-7 — POSITION (terrain PM/UX) : « départ désert » se TAIT quand `monde.personnages` est vide.** Doctrine `etat_vide` déjà écrite ; le silence n'est pas indistinguable (KR-222), le badge « 0 fiche » discrimine. Gain : critère n° 1 intact, deux fichiers de test hors lot, itération à une seule feature.
- **R-8 — POSITION chiffrée (tension n° 3, terrain PM) : ne pas intégrer le clic de ligne.** Il rouvre `SectionNav.tsx` + `DossierEditorScreen.tsx`, soit une **deuxième feature** dans la seule itération de n° 7 qui n'en touche aucune, et transforme un lot unique en deux lots séquentiels. **Ne pas le reporter une troisième fois en silence** — lui donner une itération propre, ou l'écrire mort dans `open_questions` avec son propriétaire. *Un report muet répété est la façon dont une dette cesse d'être lisible.*

### 6. Non mesuré, déclaré

- **Toute couleur de test** — aucun exécuteur à ce poste. Un `npx jest` est dû avant l'écriture du plan.
- L'audience de `monde.conditions.climat[].effets_regles[]` (4ᵉ site de `CHEMINS_DE_DELTAS`).
- La taille finale de `controles.ts` (302 l. aujourd'hui, ~550-600 attendues ; bloqueur KR-112 à 800).
