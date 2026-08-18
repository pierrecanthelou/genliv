# Revue d'itération — `dossier-registres` · itération 3

> Plan : `.claude/raffinage/dossier-registres-it3.plan.md` (validé le 2026-08-17)
> Essaim : `dev-contrat` (lot 1) → `dev-lot` (lot 2) → `integrateur` (APPROUVÉ) → `qa` mode B (CONFORME, 8/8 critères) — le 2026-08-18

## En une ligne

L'auteur peut désormais tenir le registre de ses quêtes secondaires : donneur (référence à un personnage), consigne (injectée au modèle), étapes en prose, échéance, et sa première récompense en effets de règles via `EditeurEffets` — le premier éditeur de `Delta[]` du dépôt, réutilisé sans fork par l'itération Événements.

## Critères d'acceptation (§6 du plan)

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Dossier de référence accepté sans régression après le lot contrat | **VÉRIFIÉ** | `validate.test.ts` « le dossier de reference reste accepte SANS REGRESSION quand le donneur d une quete y est orphelin, et SEULE cette anomalie remonte » |
| 2 | `DELTAS` sort du baril pour exactement deux porteurs nommés | **VÉRIFIÉ** | `deltas.test.ts` — allow-list construite avec `path.join(...)` (jamais un littéral à barre oblique, tient sous Windows) ; grep indépendant confirme `brain/index.ts` et `EditeurEffets.tsx` comme seuls porteurs hors `brain/dossier/` |
| 3 | Deux effets identiques dans `recompense[]` acceptés | **VÉRIFIÉ**, deux moitiés | SSOT : `validate.test.ts` « deux Delta identiques... sont acceptes » ; rendu : `panneauQuetes.test.tsx` « deux effets identiques rendus en deux lignes distinctes » |
| 4 | Ajout immédiat d'une quête (aucun champ requis) | **VÉRIFIÉ** | `panneauQuetes.test.tsx` « ajout immediat... » |
| 5 | DONNEUR : choix, résolution, retrait, orphelin affiché | **VÉRIFIÉ** | « donneur, choix et retrait » + « donneur orphelin affiche, jamais retire silencieusement » |
| 6 | Brouillon différé sur `libelle` d'étape ; étiquette dérivée de la position | **VÉRIFIÉ** | `types.ts` : `EtapeQuete { libelle: string }`, aucun champ `etape` ; étiquette calculée depuis l'index à chaque rendu (`FicheQuete.tsx`) ; « ajout etape differe » + « etiquette ETAPE derivee de la position » |
| 7 | Ajout à deux temps sur `EditeurEffets` ; doublons non fusionnés | **VÉRIFIÉ** | « ajout effet a deux temps » ; clé React = index (vérifié par lecture directe, pas seulement par le test) |
| 8 | État vide dédié sur une quête sans récompense | **VÉRIFIÉ** | « etat vide de RECOMPENSE » |

**8/8 critères vérifiés.**

## Diff par lot

**Lot 1 — `quetes-contrat`** (`dev-contrat`, seul, en premier) :
- R `src/brain/dossier/types.ts` — `Quete.{donneur_id?, consigne?, etapes?, echeance?}`, `EtapeQuete { libelle: string }` (aucun champ `etape`)
- R `src/brain/dossier/tables.ts` — 3 lignes (`CHAMPS_REQUIS`, `LISTES_OPTIONNELLES_STRUCTUREES`, `REFERENCES_SIMPLES`)
- R `src/brain/dossier/destinations.ts` — 4 lignes (`donneur_id`→moteur, `consigne`→ia, `etapes[].libelle`→ia, `echeance`→auteur)
- R `src/brain/dossier/couverture.test.ts`, `validate.test.ts`, `deltas.test.ts` (allow-list nommée)
- R `src/brain/dossier/__fixtures__/dossier-minimal.json`, `__fixtures__/dossier-reference.json`
- R `src/brain/index.ts` — export `DELTAS`

**Lot 2 — `quetes-ecran`** (`dev-lot`) :
- N `src/features/dossier-registres/components/PanneauQuetes.tsx`, `FicheQuete.tsx`, `EditeurEffets.tsx`
- N `src/features/dossier-registres/hooks/useEcritureEtapes.ts`
- N `src/features/dossier-registres/tests/panneauQuetes.test.tsx`
- R `src/features/dossier-registres/components/styles.ts`, `index.ts`, `src/App.tsx`

Conforme aux deux listes du plan. Zéro fichier `bascule-editeur`/`dossier-canon`/`dossier-fiches`/`tree-canvas`/`brain/components/`.

**Écart de propriété de fichiers, hors des deux lots** : `src/features/dossier-format/tests/importDossier.test.tsx` (feature déjà `done`) — un compte d'anomalies en dur passe de 4 à 5. Vérifié indépendamment par `dev-contrat`, l'intégrateur et la QA (trois lectures distinctes) : la fixture minimale n'a qu'un seul personnage, et le nouveau `Quete.donneur_id` (requis pour que la ligne de destination ne soit pas morte) y pointe nécessairement — corrompre ce personnage ajoute donc mécaniquement une `reference-pendante` de plus. Compte mesuré, pas inventé. C'est la 3ᵉ fois qu'un lot contrat de cette famille (référence simple vers l'espace `pnj` sur la fixture minimale) doit rebumper ce même test en aparté (RETOUR-COMITÉ ci-dessous).

## Ce qui a été refusé (§8 du plan, `REJETÉ`)

- **Champ `EtapeQuete.etape` stocké** — proposé au tour 1 (avec renumérotation gardée), retiré par le tech-lead lui-même au tour 2 : un ordinal persisté est de l'état dérivé miroité dans la SSOT (KR-013), et son propre précédent (`plan_actions[].etape`) désynchronise déjà après un retrait. L'ordre est celui du tableau, l'étiquette « ÉTAPE N » est recalculée à chaque rendu.
- **Test nommé de renumérotation d'`etape`** — demandé par QA au tour 1, devenu sans objet une fois le champ supprimé (rien à renuméroter).
- **Découpage en 3 lots** (`EditeurEffets` séparé de l'écran Quêtes) — aurait nommé `styles.ts`/`index.ts`/`App.tsx` en commun, propriété exclusive impossible.

## Ce qui a été reporté

- **Vigilance UX sur le gonflement possible d'`EditeurEffets`** au fil des itérations qui le réutilisent (it4) — aucun élément concret ne le justifiait cette itération, le découpage à 2 lots le borne déjà à la stricte UI du champ `recompense`.
- **Audience `ia` de `etapes[].libelle`** — arbitrée par l'orchestrateur par analogie (cohérence avec `consigne`, précédent `PlanAction.action`), faute d'un rôle l'ayant nommément tranchée au tour 2. À relire si contestée.

## Écarts assumés

- **Nom du test de non-régression** : le plan disait « isolation des 8 autres sections », le code livre « isolation des 9 autres sections » — `sections.ts` compte 10 sections au total, 9 hors Quêtes ; le « 8 » du plan était une coquille (le même schéma existe déjà dans les tests-sœurs d'it1/it2). Corrigé au chiffre réel, pas un trou de couverture.
- **`EditeurEffets` gagne une 3ᵉ prop textuelle `texteVide`** (le plan n'en nommait que 2, `titre`/`legende`) — nécessaire pour que le texte d'état vide reste paramétrable par l'appelant, condition réelle de la réutilisation sans fork promise à it4 (un texte « Aucune récompense » codé en dur serait faux pour une résolution d'événement).
- **`Select` EFFET d'une ligne déjà écrite : `onChange` no-op** plutôt qu'un état `disabled` — traduit « on ne mute jamais l'EFFET d'une ligne déjà écrite » sans toucher `brain/components/Select.tsx` (hors périmètre du lot, qui n'expose pas de prop `disabled`). Aspérité UX réelle signalée par l'intégrateur ET la QA : le champ a l'air pleinement interactif mais rejette silencieusement tout autre choix, ce qui peut se lire comme un bug. **Non couvert par un test** — aucun test n'interagit avec ce `Select` sur une ligne persistée, donc une régression future (ex. un `onChange` relié par erreur) ne ferait rougir aucune suite existante. Recommandation non bloquante : soit un test dédié, soit une prop `disabled` sur `Select.tsx` (changement `brain/`, à instruire séparément) à une itération suivante.

## Blocages non résolus

Aucun.

## Porte qualité

```
prettier --check   → vert
tsc --noEmit       → vert, 0 erreur
eslint .           → 0 erreur, 1 warning préexistant hors périmètre (src/player/CharacterCreationScreen.tsx)
jest (suite complète) → 79 suites / 1145 tests verts
```

`npm run test:mutation` : sans objet — aucun des 4 fichiers mutés n'a été touché. Table dorée : sans objet — `Quete`/`EtapeQuete` sont des clés de schéma de dossier, aucun registre de règles (`BESTIARY`/`CHALLENGE_TIERS`/`CHARACTERISTICS`/`POSTURES`) n'est en jeu.

## RETOUR-COMITÉ

**Récurrence à traiter au niveau du processus, pas au cas par cas** : c'est la 3ᵉ fois (après deux occurrences antérieures dans dossier-fiches/dossier-registres) qu'un lot contrat ajoutant une `REFERENCES_SIMPLES`/liste vers l'espace `pnj` sur la fixture minimale doit rebumper en aparté le compte d'anomalies de `dossier-format/tests/importDossier.test.tsx` (qui n'a qu'un seul personnage, donc mécaniquement la cible de toute nouvelle référence `pnj` de la fixture). Recommandation de l'intégrateur, retenue ici : tout futur lot contrat qui ajoute une référence/liste pointant vers `pnj` doit soit inclure ce fichier dans sa liste de fichiers dès le raffinage, soit le nommer explicitement en borne de lot comme édition hors-lot attendue — pour que ce ne soit plus un incident à arbitrer à chaque itération.

Second enseignement : le raffinage a correctement anticipé et résolu un trou de contrat structurel (`DELTAS` gardé hors du baril, même famille que `MARQUEUR_A_ECRIRE` en it2) AVANT le code, grâce à la lecture directe du tech-lead au tour 1 — deuxième occurrence de ce motif en deux itérations consécutives (KR-214 puis KR-215). Ça confirme la valeur de la consigne « vérifie par lecture directe du code, ne prends rien pour acquis » donnée à chaque tour du comité.
