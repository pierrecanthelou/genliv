# Revue — `dossier-canon` itération 5 (« Accès ») · tranche B1 du roadmap § 2 bis

**En une ligne** : l'auteur **relie ses lieux les uns aux autres** — il ajoute, change et retire un accès sortant depuis la fiche d'un lieu, là où le dossier n'avait aucune topologie. C'est la dette la plus ancienne du Temps 1, sans propriétaire depuis trois cadrages (refusée en n° 5 KR-200, impossible en n° 6 KR-205, reconfirmée par la n° 7).

**Exécution** : séquentielle, 2 lots, aucun worktree, aucune fusion. L'`integrateur` est **sans objet** en mode séquentiel — il fusionne des worktrees, et il n'y en avait pas ; le contrôle de propriété et la porte globale ont été faits par l'orchestrateur.

---

## Critères

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | `A.acces` contient `B.id` **et** `B.acces` reste inchangé (KR-013) | **VÉRIFIÉ** *(après correction)* | `panneauLieux.test.tsx:421` — `ajouter un acces ne modifie jamais la cible (KR-013)`, sur le **chemin d'écriture réel** (`user.selectOptions`). **Pouvoir séparateur démontré** : mutant d'écriture symétrique → rouge (`Received: ["lieu.amorce"]`), code juste → vert |
| 2 | Cible absente → `reference-pendante` au chemin exact | **VÉRIFIÉ** | `validate.test.ts:3474` — discriminance contre un voisin qui résout dans la même liste |
| 3 | Auto-référence → aucune anomalie (KR-194) | **VÉRIFIÉ** | `validate.test.ts:3427`. **Pouvoir séparateur démontré** par la QA : garde d'auto-référence greffée dans `validate.ts` → le test rougit et nomme l'invariant |
| 4 | Chaîne vide → refusée | **VÉRIFIÉ** | `validate.test.ts:3453`, `identifiant-invalide` à `monde.lieux[0].acces[0]` (exerce `validate.ts:422`) |
| 5 | Référence enrichie → `ok:true`, sans régression | **VÉRIFIÉ** | `validate.test.ts:3494`, motif discriminant BUG-072 : accepté intact, puis une seule corruption isolée au bon rang |
| 6 | Textes mot pour mot + lieu courant exclu de l'ajout | **VÉRIFIÉ** | `panneauLieux.test.tsx:385`. Les 4 textes comparés **caractère par caractère** par la QA, apostrophes comprises |
| 7 | Cible retirée ailleurs → « Lieu introuvable — <id> » (KR-021) | **VÉRIFIÉ** | `panneauLieux.test.tsx:514`, rendu pur — scénario inatteignable par écriture réelle puisque le SSOT le refuse |
| 8 | Ordre de tabulation, sans `tabIndex` | **VÉRIFIÉ** | `panneauLieux.test.tsx:440`, `user.tab()` ; absence de `tabIndex` confirmée par grep |

**Plus un témoin hors critères** : `le retrait d un lieu ne cherche plus le bouton par aria-label (BUG-078)` — grep de source, doublé d'un test comportemental réel du focus.

---

## Diff par lot

| Lot | Fichiers prévus | Fichiers touchés | Écart |
|---|---|---|---|
| 1 `contrat-acces-lieu` | 5, puis **6** par amendement | 6 | conforme à l'amendement |
| 2 `acces-a-l-ecran` | 4 | 4 | conforme |

`types.ts` · `tables.ts` · `destinations.ts` · `__fixtures__/dossier-reference.json` · `__fixtures__/dossier-minimal.json` *(amendement)* · `validate.test.ts` — puis `FicheLieu.tsx` · `PanneauLieux.tsx` · `styles.ts` (N) · `panneauLieux.test.tsx`.

Aucun fichier parasite. `validate.ts`, `couverture.test.ts`, `suffisance.test.ts`, `identifiers.test.ts`, `atteignabilite.ts`, `controles.ts`, `brain/index.ts` : **tous intacts**, aucun n'a rougi.

**Mesures KR-112** (aucun instrument — constat manuel) : `PanneauLieux.tsx` 364 → **334** (objectif du plan atteint) ; `FicheLieu.tsx` 181 → **354** ; `styles.ts` 94 (neuf).
**Mesure KR-159** : `REFERENCES_SIMPLES` porte **10** entrées, recomptées à la main par la QA ; la docstring dit « DIX ». Juste.

---

## Ce qui a été refusé, et pourquoi — un diff ne le dit pas

- **`acces[].description`**, la prose par arête. Demandée par `narratif-ia` en **veto** au tour 1, **retirée par lui-même au tour 2 sur mesure** : `Lieu` porte déjà trois proses `ia` (`destinations.ts:395-397`), une prose par arête serait une **seconde source de vérité narrative sur le même fait**, injectée dans le même contexte de tour. Le précédent invoqué (`Climat.manifestation`) ne transfère pas : là, l'entité entière était muette.
- **La forme objet** `{vers_lieu_id, description?}`. **Légale** — l'argument « 7e famille D1 » du tech-lead est mesuré **faux** (D1 ne régit que les couples `…_texte`/`…_expr` ; `monde` porte déjà sept objets structurés) — mais **inutile** une fois `description` écartée. Ne pas figer le motif faux au profit de la conclusion juste.
- **La liste « ACCESSIBLE DEPUIS »** (qui mène ici) : aucun verbe neuf pour l'auteur, et jamais injectable (les arêtes entrantes sont la forme de la carte, donc du spoiler).
- **Une garde d'auto-référence au SSOT** : refusée, l'exclusion vit à l'écran, sur la ligne d'ajout seule.
- **Une garde de doublon** : refusée, limite assumée et datée, comme `mene_a`.
- **Le rider `validate.ts`** (4 sites sans `entityId`, `designerSavoir`) : hors périmètre. **Mesuré** : `acces` ne demande aucune ligne de `validate.ts` — la ligne du roadmap qui armait ce rider « donc B1 » reposait sur une **prémisse fausse**.

## Ce qui a été reporté, et où

| Report | Destination |
|---|---|
| `acces[].description` / l'étiquette d'une sortie | `open_questions` de la spec, **propriétaire n° 10**, avec ses deux options (le `nom` de la cible via KR-195, ou la prose par arête) |
| Liste « ACCESSIBLE DEPUIS » | `open_questions` ; contrat de texte UX conservé tel quel dans `tour2-ux-designer.md` § 2 |
| Doublons dans `acces` | `open_questions` — dédoublonnage à l'injection, n° 10 |
| Rider `validate.ts` | ré-armé sur le fichier, roadmap § 2 bis |

---

## Écarts assumés

1. **Le plan avait tort sur un fichier.** Il interdisait `dossier-minimal.json` ; trois gardes d'instanciation l'exigeaient (`couverture.test.ts:486`, `:528`, `suffisance.test.ts:244`). Amendement posé, motif écrit dans le plan. Remède : une ligne, `"acces": ["lieu.val-cendre"]`, arête réflexive légale (KR-194). La variante « second lieu » a été **mesurée** et écartée : elle cassait 3 tests de plus dans 2 fichiers supplémentaires.
2. **`FicheLieu.tsx` à 354 lignes contre ~220 prévues** (+61 %). Sous le signal de scission de 400, donc acceptable — mais l'estimation du plan était fausse, et **aucun instrument ne surveille ça** (pas de règle `max-lines`). La pression KR-112 s'est déplacée du panneau vers la fiche.
3. **Le commentaire d'audience de `destinations.ts`, marqué « non reformulable », a été reformulé et étendu.** La QA confirme que tout le contenu obligatoire y est (handle / carte / autorité « même si la prose l'a racontée » / étiquette non tranchée). Accepté sans aller-retour : le risque que la clause gardait ne s'est pas matérialisé.
4. **La mise à jour documentaire est sortie du lot 2** et portée par l'orchestrateur — le plan la lui confiait pour éviter un troisième lot ; la faire au niveau de l'orchestrateur sert la même intention sans créer de lot, et le contexte d'arbitrage (CHANGELOG, colonne `Statut`, correction du roadmap) n'était pas dans les mains de l'ouvrier.

**Aucun blocage non résolu.**

---

## Porte qualité

| | |
|---|---|
| `prettier --check` | vert |
| `tsc --noEmit` | vert |
| `eslint` | vert — 0 erreur (1 warning préexistant dans `src/player/`, hors diff) |
| `jest` complet | **102 suites / 1750 tests, tous verts** |
| Score de mutation | **sans objet**, confirmé par `git diff --stat` : ni `challenge.ts`, ni `combat.ts`, ni `xp.ts`, ni `characteristics.ts` dans le diff |

**Rejoué indépendamment par la QA en mode B**, pas recopié des comptes rendus d'ouvriers.

## Non vérifié par personne

- Le **rendu visuel** de la section : jsdom ne calcule aucun layout. ESLint garantit que les valeurs sont des tokens, jamais la mise en page.
- **KR-159** : aucun test n'épingle le compte de la docstring. Il est juste aujourd'hui parce qu'il a été recompté à la main ; un oubli futur resterait vert.
- **KR-112** : aucune règle `max-lines`. Les 354 lignes de `FicheLieu.tsx` se constatent, rien ne les surveille.

---

## `RETOUR-COMITÉ` — ce que ce découpage a appris

**1. Un critère qui garde un invariant d'ÉCRITURE doit nommer le CHEMIN d'écriture, pas seulement l'état résultant.** Le critère #1 disait « quand l'auteur ajoute un accès, alors `B.acces` reste inchangé ». L'ouvrier l'a honoré par un test contrat qui mute le document **à la main** et appelle `validateDossier` — vert, et gardant un endroit où le défaut ne peut pas naître. La QA en mode B a écrit le mutant (écriture symétrique dans `handleAjouterAcces`, en un seul `commit()` pour passer aussi l'assertion « un seul appel ») : **550 tests verts, mutant compris**. Le comité avait pourtant identifié le risque au bon endroit — la QA du raffinage avait maintenu son objection *contre* la légende UX en disant « le risque vit dans le code d'écriture, pas dans la copie ». Le diagnostic était juste, la formulation du critère ne l'a pas transporté.

**2. Mesurer une assertion d'un fichier ne dit rien des autres assertions du même fichier.** Le comité a mesuré la table `LIBRES` de `couverture.test.ts` — correctement : aucune dispense n'était due. Puis il a écrit « `couverture.test.ts` non modifié » comme critère d'acceptation, généralisant d'**une** famille d'assertions à **tout le fichier**. Le même fichier portait, sur d'autres lignes, l'invariant d'instanciation qui a bloqué le lot 1. La conclusion partielle était juste, sa portée non.

**3. Le tour 2 parallèle fait converger des rôles vers une position déjà abandonnée.** `narratif-ia` a retiré son veto pendant que `tech-lead`, `ux-designer` et `pm-produit` rédigeaient leur réponse **contre** ce veto. Résultat : une annexe de découpage complète pour la forme objet, un contrat de texte pour un champ `ISSUE`, et un veto de regroupement sans cible. Rien de perdu ici — l'orchestrateur a marqué les parties caduques — mais le coût est réel et il se répétera. Piste pour la skill : quand un veto est retiré au tour 2, les notes rendues **après** ce retrait devraient être relancées, ou le retrait diffusé avant qu'elles ne se closent.

**4. Une correction n'est « appliquée » qu'après relecture du disque — jamais après exécution supposée réussie.** À la revue de PR, l'orchestrateur a rapporté au tech-lead que la correction n° 4 (roadmap) était faite. Elle ne l'était pas : elle vivait dans le même script Python que la correction n° 5 (CHANGELOG), placée avant elle, et l'assertion du n° 5 a échoué — précisément parce qu'elle supposait une ligne vide dont l'absence *était* le défaut à corriger. Python s'est arrêté, les éditions du roadmap n'ont jamais tourné, et l'état a été rapporté depuis le code écrit plutôt que depuis le disque. **C'est la leçon n° 1 de cette même itération — un témoin vert qui ne garde rien — appliquée au rapport de revue au lieu d'un test.** Deux règles, par ordre de force : (a) une correction n'est appliquée qu'après relecture du disque — la re-revue l'a attrapée pour le coût d'un `Grep` ; (b) un script d'édition documentaire ne met jamais deux fichiers indépendants derrière une même assertion — un fichier, un script, ou des `try` séparés.

**5. Un ouvrier qui s'arrête vaut mieux qu'un ouvrier qui s'élargit.** `dev-contrat` a rencontré 3 échecs hors de son périmètre, a **mesuré les deux remèdes** plutôt que d'en appliquer un, a restauré le fichier après mesure, et a rendu une tranche propre avec une décision à prendre. La variante qu'il a écartée annexait deux fichiers supplémentaires. C'est le comportement que le prompt demandait et il a tenu sous pression.
