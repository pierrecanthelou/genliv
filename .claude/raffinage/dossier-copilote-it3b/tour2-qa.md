# Tour 2 — `qa` · `dossier-copilote` it3b

**Au tech-lead, sur mon domaine — MESURÉ, exécuté** (annexe A) : **sa prédiction « zéro diff » est FAUSSE.** J'ai simulé un 4ᵉ rôle réel (`INVITES` + `GABARIT_SORTIE` des deux côtés, `RoleCopilote` étendu, `tsc` + `jest` réellement lancés). Résultat : 29 tests, **un seul rouge** — `toHaveLength(3)`, **ligne 319**, `paires(ROLES)` rend 6. Les 28 autres passent, **y compris** après injection à la main d'un vrai mésappariement sur le rôle simulé : `memesGabarits` l'a détecté **sans qu'aucune ligne du fichier ne soit touchée** — le garde KR-236 s'étend bien seul. Je **reclasse** son heuristique : un diff **borné à la ligne 319** (3→6) n'est **pas** un signal de frontière franchie, c'est la conséquence mécanique de C(n,2) ; **tout AUTRE diff sur ce fichier le reste**.

**Mes objections du tour 1** :
- **DÉSIGNATION/RÉDACTION** → **RETIRÉE** — confirmée indépendamment par pm-produit et ux-designer ; liste vide = refus `'vide'` tenu.
- **Proposition `{"etapes":[…]}`** → **RETIRÉE sur le mot, MAINTENUE sur la structure**. Le tech-lead rejette « etapes » (à une lettre d'`etape`, entier moteur requis) ET « actions » ; narratif-ia choisit pourtant « actions » côté réseau — **les deux postes à effort élevé divergent entre eux mais convergent contre mon mot**. Structure exigée quel que soit le nom : **chaîne nue, gabarit gelé avant code, prédicats de `validerRepliques` réutilisés**.

**11ᵉ prédicat (narratif-ia)** : testable en fonction pure, **NON SÉPARABLE tel quel** — `validerIntentions(brut, dossier)` **n'a pas la cible**, donc pas le sous-ensemble d'actions du personnage visé. **DURCI EN VETO si non résolu avant code.**

**Étape A** : la porte verte est **insuffisante** pour « octet pour octet identiques » — **exige un diff vide / un hash nommé**, en plus de `tsc` + `jest`.

**VERDICT** — **recevable sous réserve** : nom du champ tranché hors de moi, **signature de `validerIntentions` réglée** si le 11ᵉ prédicat est retenu, **ligne 319 inscrite au plan comme édition ATTENDUE** (pas une alerte).

---

## Annexe A — mesure EXÉCUTÉE sur `worker/frontiere.test.ts`

**Protocole** (jetable, entièrement revert via `git checkout --`, arbre confirmé propre avant/après) : ajout d'un **vrai** 4ᵉ rôle `'zzz-sonde-qa'` — `RoleCopilote`, `CHAMPS_INJECTES`/`PARTIES_REQUISES`/`BUDGET_CARACTERES_CONTEXTE`, `GABARIT_SORTIE` (**schemaSortie.ts ET worker/index.ts**), `INVITES`. **Zéro ligne touchée dans `frontiere.test.ts`.** `npx jest worker/frontiere.test.ts` réellement lancé (ts-jest, diagnostics actifs — le probe est donc aussi un `tsc` de fait).

**Run 1** (29 tests) :
```
× le balayage exhaustif › chacune des trois transpositions fait rougir le balayage
  Expected length: 3, Received length: 6
Tests: 1 failed, 28 passed, 29 total
```
**Run 2** (mésappariement délibéré injecté sur le gabarit worker du rôle simulé) : `totalite des gabarits par role` **rouge immédiatement** — **sans toucher `frontiere.test.ts`**. Confirme que le garde central vit.
**Revert** → run 3, **27/27 verts**, baseline retrouvée à l'identique.

**Relevé ligne par ligne — dépendance au nombre de rôles N :**

| Ligne(s) | Instrument | Générique à N ? |
|---|---|---|
| 68 `ROLES = Object.keys(INVITES)` | totalité dérivée | Oui |
| 90-95 `ENTREE_GABARIT`, `extraire` | extraction | Oui |
| 109-112 `memesGabarits` | liaison + cardinalité | Oui — **vu rouge sur mésappariement réel** |
| 132-135 `croiser` | rotation-1 | Oui, mais **plafonné en pouvoir dès N≥2** (déjà documenté, pas dégradé par le 4ᵉ rôle) |
| 147-149 `paires` | combinatoire C(N,2) | Oui (fonction) |
| **319 `expect(toutes).toHaveLength(3)`** | **littéral** | **NON — seule ligne à éditer, 3→6, CONFIRMÉ PAR EXÉCUTION** |
| 172-178 balayage exhaustif | — | Oui — **vu vert et séparateur** |
| 347-367 borne réplique (`ROLE_REPLIQUES` nommé) | spécifique à un rôle | n/a |
| 369-392 curseurs | spécifique | n/a |
| 396-406 `it.each(ROLES)` invite↔gabarit | — | Oui — **4 exécutions, la 4ᵉ a réellement tourné et pu échouer** |
| **475-573 témoins exécutables** (3 `it` **nommés**, pas `.each`) | **NON extensibles automatiquement** | **Un 4ᵉ témoin de bout-en-bout devra être écrit AILLEURS (`CopiloteService.test.ts`, lot 1) : `frontiere.test.ts` ne le fournira pas seul.** |
| 576-666 plafonds `describe.each(ROLES)` | — | Oui — **4ᵉ itération a tourné, budget arbitraire testé et discriminant** |

**Aucun instrument trouvé qui devienne vert PAR ACCIDENT à N=4** (contrairement au précédent de 3a sur `rolesAuMaximum`, déjà corrigé) — **vérifié par exécution, pas seulement par lecture**.

## Annexe B — définition de fini

**VU ROUGE avant crédit** : ligne 319 (la voir échouer **avant** édition) · chaque cas négatif fabriqué de `validerIntentions` (schema/vide/marqueur/identifiant, et le 11ᵉ si retenu) · 405/404/413/503 du rôle neuf · l'assertion « neuf chemins non vides » **AVANT** la mesure du budget (sinon plancher, pas mesure) · **diff vide / hash** sur les 4 fichiers de l'étape A.
**VERT sans retouche** : le reste de `frontiere.test.ts` (**28/29 mesuré**) · `schemaSortie.test.ts`, `CopiloteService.test.ts`, `panneauCopilote.test.tsx` (hors +1 compte de cartes) · `lintIsolation.test.ts`.

## Non vérifié par moi

Le budget réel du 4ᵉ rôle (dépend du lot) · `useEcriturePlan.ts:201` en repointage · score de mutation (**hors périmètre** — `brain/copilote` n'est pas parmi les 4 fichiers mutés) · tout `src/features/dossier-copilote` (lot 2, aucun fichier lu ce tour).
