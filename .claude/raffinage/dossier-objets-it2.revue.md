# Revue — `dossier-objets` itération 2 (clôture, 2/2)

**En une ligne** : l'auteur retire un objet de son registre — confirmé par une modale, refusé et motivé (personnage porteur nommé) par le dossier si un savoir le référence encore. **La feature `dossier-objets` (n°5) est terminée.**

## Critères d'acceptation (§6 du plan)

| # | Critère | Verdict | Preuve |
|---|---|---|---|
| 1 | Retrait réussi, fermeture modale, focus objet suivant / « + Ajouter » si vide | **VÉRIFIÉ** | `retraitObjet.test.tsx` — « retrait sans reference: reussi... » + « retrait du dernier objet: liste vide... » |
| 2 | Discriminance à deux objets, même test, fixture en mémoire | **VÉRIFIÉ** | « discriminance: un objet referme par contrepartie refuse, un objet libre reussit, MEME TEST » |
| 3 | Annuler/Échap : rien écrit, focus revient au bouton Retirer | **VÉRIFIÉ** | deux tests distincts, `updateSpy` non appelé + focus vérifié |
| 4 | Aucune recherche DOM ; aucune connaissance de personnages/savoirs côté feature | **VÉRIFIÉ** | tests-grep + grep direct QA, zéro occurrence |
| 5 | `objet.lanterne-de-corvin` (référence réelle) refusé, hors discriminance | **VÉRIFIÉ** | test dédié, lecture seule de `dossier-reference.json` |
| 6 | Les 3 objets de la référence restent intacts | **VÉRIFIÉ** (indirect — `toHaveLength(3)` après tentative refusée ; l'écriture a échoué avant persistance) | même test que #5 |
| 7 | Les 9 sections non livrées gardent leur état vide (KR-187) | **VÉRIFIÉ** | `dossierEditorScreen.test.tsx`, 21/21, non modifié |
| 8 | Lint/tsc zéro erreur, zéro fichier `brain/` dans le diff | **VÉRIFIÉ** | confirmé par grep direct sur `git status` |

Les 8 critères sont vérifiés.

## Diff par lot

**Lot unique — `retrait-objet`** (aucun `contrat`) :
- `src/features/dossier-objets/components/RetirerObjetDialog.tsx` (N)
- `src/features/dossier-objets/components/FicheObjet.tsx` (R) — `forwardRef<FicheObjetHandle>`, `designationDe`, bouton `✕`, bandeau de refus
- `src/features/dossier-objets/components/PanneauObjets.tsx` (R) — `enConfirmation`, `RefusEnCours`, `commit(objets, objetId, {resout})`, focus par handle
- `src/features/dossier-objets/components/styles.ts` (N) — extraction KR-112, tokens identiques (vérifié ligne à ligne par l'intégrateur)
- `src/features/dossier-objets/tests/retraitObjet.test.tsx` (N) — 11 tests

`panneauObjets.test.tsx` (it1) : **non touché**, resté vert sans modification — la prédiction du plan s'est vérifiée. **Zéro fichier `src/brain/`** dans le diff, vérifié par grep à trois reprises (dev-lot, intégrateur, QA mode B).

## Ce qui a été refusé

Aucun `REJETÉ` cette itération : tous les désaccords du raffinage ont convergé (`RETIRÉ`) ou ont été tranchés (`RETENU`) — voir `.claude/raffinage/dossier-objets-it2.plan.md` §8. Le plus structurant : le comité a découvert dès le tour 1 que le refus de retrait n'exigeait aucun code `brain/` (couvert depuis dossier-fiches it6), ce qui a fait tomber le lot `contrat` — première itération de cette feature sans lui.

## Ce qui a été reporté

- **Nommage du savoir précis** dans le message de refus — le SSOT ne nomme que le personnage porteur (`REFERENCES_SIMPLES` n'a pas de `sujet` dynamique pour ce chemin). Noté en `open_questions` de `specification.json`.
- **Promotion de `EYEBROW_REFUS`/`TEXTE_ABSENT`** vers `brain/components/` — 3ᵉ copie identique à travers Lieux/Personnages/Objets, mais toucher deux features déjà `done` est hors périmètre. Noté en `open_questions`.
- **Suivi des garanties tacites de `dossier-reference.json`** (ex. `objet.lanterne-de-corvin` doit rester protégé) — préoccupation transverse à toutes les features qui écrivent dans la référence partagée, hors mandat de cette itération. Noté en `open_questions`.
- **Propriété d'un objet par un personnage (qui le porte) et jet requis pour l'utiliser** — soulevé par l'utilisateur au moment de la validation du plan. Recherche menée : ces deux capacités existaient dans le modèle d'arbre condamné (`GameObject`/`TakeableObject`/`PnjGift`, encore consommées par `src/player/`) mais n'ont été reprises par AUCUNE feature du roadmap actuel — ni n°5, ni n°6, ni Temps 2. Noté en détail dans `open_questions` avec une recommandation de propriétaire (n°6 `dossier-registres` pour l'authored, `moteur-acteurs`/`moteur-arbitre` pour l'état dynamique), à trancher par un futur cadrage.

## Écarts assumés

- **Sonde de focus post-retrait (KR-199)** : le plan prescrivait une sonde « candidats multiples » (`querySelectorAll('button[aria-label^="Retirer"]').length > 1`), calquée sur `FichePersonnage.tsx` dont l'accordéon laisse plusieurs boutons « Retirer… » simultanément dans le DOM. `FicheObjet.tsx` n'a structurellement qu'**un seul** bouton de retrait (pas de sous-blocs répétés) — le mécanisme littéral n'a pas de support DOM ici. L'ouvrier a adapté la sonde en préservant l'intention KR-199 : vérifier explicitement l'absence du candidat qu'un mutant d'index viserait, en plus de la présence du focus sur le bon candidat — discriminance équivalente, mécanisme différent, documenté dans le test.
- **Critère #6 prouvé indirectement** (`toHaveLength(3)` après tentative refusée, pas une égalité profonde champ à champ) — suffisant en pratique puisque l'écriture a échoué avant toute persistance, mais noté par QA comme preuve implicite plutôt qu'explicite.

**Un ajout hors plan à la porte de commit** : `src/features/dossier-fiches/tests/caractere.test.tsx` — le test « un curseur se regle sans prefix signe et se clampe aux deux bornes » (~30 clics `user-event` réels, légitimement long) dépassait de façon reproductible le timeout Jest de 5000ms sous la suite complète (deux tentatives de commit bloquées par le hook de pre-commit ; passait en isolation à 3992/5000ms — marge déjà nulle). Corrigé en relevant son timeout à 15000ms (3ᵉ argument de `it()`, aucune assertion ni logique touchée) ; suite complète relancée après correctif, 75/75 suites vertes. Non journalisé en `bug_history.json` (ferait franchir son plafond pour une correction d'une ligne dont la trace vit déjà dans le commentaire du test) — noté ici pour mémoire.

Aucun blocage non résolu.

## Porte qualité

- **Prettier** : vert.
- **`tsc --noEmit`** : 0 erreur.
- **`npm run lint`** : 0 erreur (1 warning préexistant et sans rapport, hors diff).
- **Jest, périmètre de l'itération** : `dossier-objets` → 2 suites / 20 tests verts (11 nouveaux + 9 existants intacts).
- **Jest, suite complète** : **75 suites / 1074 tests, tous verts** (1063 après it1 + 11 nouveaux = 1074, cohérent — aucune régression, le flake de `caractere.test.tsx` ne s'est même pas manifesté sur ce run).
- **`npm run test:mutation`** : sans objet — zéro fichier `brain/` dans le diff, confirmé à trois reprises.

## Budget de contexte

Relevé (`wc -c`, 2026-08-16, à la revue de PR) : `docs/ROADMAP-BASCULE-IA.md` à **35 709 o** pour un plafond de **35 840 o** (35 kio) — marge de **131 o**, tient sans compaction. `code-knowledge.json` à 76 710 o (inchangé depuis it1, plafond 76 800 o, marge 90 o). `src/features/dossier-objets/specification.json` à 29 106 o (plafond 66 560 o, large marge — la feature est close, ce fichier n'grossira plus). `features_history.json` à 9 490 o (plafond 10 240 o) après sa 2ᵉ entrée (`dossier-objets`). Le prochain lot qui touche `docs/ROADMAP-BASCULE-IA.md` doit re-mesurer avant d'écrire : la marge y est la plus fine du dépôt.

## `RETOUR-COMITÉ`

Le raffinage a évité un lot `contrat` inutile en vérifiant le mécanisme existant AVANT de planifier un découpage — la fixture de référence (`dossier-reference.json`) s'est révélée entièrement référencée (ses 3 objets sont tous protégés par un mécanisme différent), ce que le tech-lead et la QA ont découvert indépendamment dès le tour 1 : un signe que la vérification directe du code prime sur la lecture littérale du goal brut. Le désaccord le plus structurant (fixture de test locale vs réutilisation de la référence réelle pour la discriminance) s'est résolu proprement au tour 2 par une mesure empirique de QA (0/3 précédents dans les features soeurs) plutôt qu'une préférence — à rejouer : chercher le précédent avant de trancher un choix de matériau de test. Le plan prescrivait un mécanisme de sonde de focus qui ne correspondait pas à la forme réelle du composant (accordéon à blocs répétés vs fiche à bouton unique) — l'écart a été détecté et corrigé par l'ouvrier lui-même, en préservant l'intention plutôt que la lettre : à noter pour le prochain raffinage qui prescrit un mécanisme de test précis, vérifier qu'il a un support DOM réel dans le composant qu'il prescrit avant de l'écrire dans le plan.
