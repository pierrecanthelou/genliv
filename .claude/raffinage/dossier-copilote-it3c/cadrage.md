# Cadrage — `dossier-copilote` itération `3c`

> Envoyé **identique** aux cinq rôles. Lecture bornée : ce cadrage + les 3 à 6 fichiers que vous jugez nécessaires.

**Démo visée** : « à la fin de cette itération, l'auteur peut **faire compléter les relations d'un personnage**. » Une phrase, sans « et ».

**`goal` brut (spec)** : *Les relations : l'auteur demande au copilote de compléter `monde.personnages[].relations[]` — une sous-entité qui **DÉSIGNE UNE AUTRE ENTITÉ**, donc **le premier rôle mêlant le mécanisme de RANG de l'it2 et la sous-entité structurée de 3b**. Dernière des trois tranches de l'ancienne itération 3. `relations[].intensite` reste **NON PROPOSABLE**, même arbitrage que les six curseurs.*

**État de la feature** : **4/6 livrées** (it1 prose · it2 détenteurs par rang · it3a répliques, liste de prose · it3b plan d'actions, sous-entité construite par le code). 3c pose le **5ᵉ rôle**.

## Le fait structurant — mesuré, pas supposé

`Relation` (`src/brain/dossier/types.ts:579`) porte **quatre** champs (`destinations.ts:304-333`) :

| champ | requis | type | audience |
|---|---|---|---|
| `cible_id` | **oui** | `string` | **`moteur`** — un identifiant est un **HANDLE**, résolu par le code, **jamais injecté tel quel** |
| `lien` | **oui** | `string` | **`ia`** — la NATURE du lien en prose de jeu d'acteur. **Seul champ `ia`** |
| `intensite` | **oui** | `number` | **`moteur`** — et le `goal` le déclare **NON PROPOSABLE**, même arbitrage que les six curseurs |
| `secret` | non | `boolean` | **`moteur`** |

**Comme à 3b, un seul champ est `'ia'`.** Mais deux choses sont neuves, et c'est là qu'est le travail :

1. **`cible_id` DÉSIGNE UNE AUTRE ENTITÉ.** Le modèle ne frappe jamais un identifiant (décision n° 6 du roadmap) : il **désigne par RANG**, mécanisme livré à l'it2 (`P1`..`PN`, appartenance à la table rendue par l'assembleur, re-résolution par `Map.get`, **aucune conversion numérique**). C'est le premier rôle qui rend **à la fois** un jeton de désignation **et** de la prose.
2. **`intensite` est REQUISE et non proposable.** À 3b, `etape` était requis et le **code** le posait par une formule sans ambiguïté (`length + 1`). Ici, quelle valeur pose le code — et peut-il en poser une ? ⚠ `0` est **neutre**, donc une **vraie valeur**, pas un plancher : le désaccord n° 2 de 3a (« un bloc tout au plancher est **indistinguable d'un réglage délibéré** », KR-221) s'applique-t-il, ou non ?

## Le problème que le schéma nomme déjà, et que personne n'a résolu

Le JSDoc de `cible_id` écrit noir sur blanc : **« CE QU'IL RÉSOUT N'EST PAS ENCORE INJECTABLE. »** Le `nom` d'un personnage est destination **`auteur`** (`destinations.ts:146`, KR-195). Donc **une ligne de `relations[]` injectée aujourd'hui donnerait « son créancier » SANS DIRE DE QUI** — la moitié de l'information.

La moitié manquante est une `open_question` dont **la feature n° 10 est propriétaire** : « **appellation re-projetée par le CODE à l'assemblage, jamais une seconde clé au schéma** ». Le JSDoc précise ce que la réponse **n'est pas** : ni une bascule de `nom` vers `'ia'`, ni un champ `appellation` de plus.

⚠ **Ce problème concerne l'INJECTION des relations existantes.** Le test de rattachement livré à 3b le tranche peut-être tout seul — **à vous de le dire** : *« l'élément N présuppose-t-il l'élément N−1 ? »* Une collection de relations est-elle **ORDONNÉE** (⇒ s'injecte, précédent 3b) ou **INTERCHANGEABLE** (⇒ ne s'injecte pas, précédent 3a) ?

## `secret` — le premier champ dont l'injection dépend de QUI DEMANDE

Son JSDoc porte **le prédicat entier**, écrit à deux sites : une ligne de `relations[]` n'entre **que** dans le contexte de l'appel **acteur du personnage qui la porte** ; si `secret !== true`, elle entre **en plus** chez le **narrateur**. **Jamais** chez un autre personnage, ni chez la cible, ni chez l'arbitre. Un champ absent se traite comme `false`, et `secret: false` **n'est pas « public »** — il élargit d'**un** rôle.
Le JSDoc ajoute : **« ZÉRO mécanisme de code en itération 5 : aucun assembleur n'existe encore à exercer. »** Un assembleur existe désormais. Est-ce 3c qui l'exerce, ou la n° 10 ?

## Précédents qui s'appliquent (déjà tranchés — ne les rejouez pas)

- **Le modèle ne rend que des JETONS, jamais un entier** (it2) — aucune conversion numérique nulle part.
- **Le code pose la valeur que le modèle ne choisit pas** (`CERTITUDE_INITIALE`, it2) — mais **KR-221** interdit de **semer un optionnel** que l'auteur n'a pas posé. À 3b, le discriminant retenu était : *écrire le minimum **structurel** (un champ **requis** par le type) n'est pas semer*.
- **La clé réseau nomme la FORME, jamais le CHAMP** (3b, veto).
- **DÉSIGNATION vs RÉDACTION** (3a) : un rôle de désignation choisit dans un ensemble **fourni par le contexte** — liste vide = **succès** ; un rôle de rédaction écrit ce que rien ne fournit — vide = **refus**. ⚠ **Ce rôle-ci fait LES DEUX.**
- **L'injection du champ cible dépend de son ORDRE, pas de son audience** (3b).
- **Zéro clé commune** forme réseau / forme re-résolue (KR-231) · **cibles disjointes deux à deux** : `{entiteId,champ}` / `{indiceId}` / `{personnageId}` / `{acteurId}`. ⚠ **Une cinquième cible sur un personnage sera le TROISIÈME synonyme — le plan de 3b a écrit que c'est LE SIGNAL de la bascule sur une UNION ÉTIQUETÉE, dans le lot contrat de 3c.**
- **Le budget de contexte se MESURE**, jamais recopié ; **aucun plafond de document** n'est inventé en passant.

## KR connus

KR-021 (référence pendante **exposée**, jamais filtrée) · KR-117 · **KR-194 (l'auto-référence est LÉGALE** : `cible_id === personnage.id` est une didascalie de conflit intérieur) · KR-195 (le `nom` est `auteur`) · KR-221 · KR-229 · KR-230 · KR-231 · KR-232 · KR-233 · KR-235 · KR-236 · KR-004 · KR-013/113 · KR-112.

## Fichiers probablement concernés

`src/brain/copilote/contexte/{registres,relations(N)}.ts` · `copilote/{types,schemaSortie}.ts` (+ tests) · `src/brain/CopiloteService.ts` (+ test) · `src/brain/index.ts` · `worker/{index,index.test,frontiere.test}.ts` · `src/features/dossier-copilote/{components/,textes.ts,tests/}`.
**Bonne nouvelle mesurée** : la scission de 3b fait que le 5ᵉ rôle **ajoute un fichier** (`contexte/relations.ts`) au lieu de gonfler un monolithe.

## Deux dettes à cadrer ICI

1. **Le budget, et il n'a plus de marge.** `code-knowledge.json` : **72 o**. `dossier-format/specification.json` : **73 o**. `CLAUDE.md` + `WORKFLOW.md` : **154 o**. `docs/ROADMAP-BASCULE-IA.md` : **173 o**. `dossier-copilote/specification.json` : ~1 900 o après **trois** compactions. **Les cibles faciles de `code-knowledge.json` sont épuisées** (les KR câblés en ESLint sont déjà des pointeurs). La prochaine compaction n'est pas un ajustement — **dites où elle coupe**.
2. **`CopiloteService.ts` est à 502 lignes.** Le plan de 3b a écrit la condition d'ouverture : **la CINQUIÈME branche**, c'est-à-dire celle-ci.

## Ce qu'on attend de vous

`RISQUE / OBJECTION / PROPOSITION / VERDICT`, 250 mots max. **Au moins une objection.** Annexe autorisée pour `tech-lead`, `ux-designer`, `narratif-ia`.

⚠ **Toute affirmation sur la couleur d'un test se MESURE.** Et une leçon vient d'être inscrite dans la skill (§ « une ASSERTION DE RÉSULTAT ne remplace une formule que si le SCÉNARIO fait DIVERGER les sources ») : **un critère en « Alors ⟨résultat⟩ » doit nommer l'état du monde où les implémentations candidates ne rendent PAS le même résultat.** Sinon il épingle une coïncidence — c'est ce qui a coûté le témoin cardinal de 3b (BUG-113).
