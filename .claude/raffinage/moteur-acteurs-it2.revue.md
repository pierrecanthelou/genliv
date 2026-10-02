# Revue — `moteur-acteurs` itération 2 (n°12 du roadmap, Temps 2)

## En une ligne

L'auteur voit désormais son PNJ confier, dans sa réplique, un savoir dont le joueur vient de remplir la condition posée — visible aussitôt dans un nouveau carnet d'indices.

## Critères d'acceptation

| # | Critère | Statut | Preuve |
|---|---|---|---|
| 1 | Conjonction `contrepartie`(consomme:false)+`apres_indice_id` → `revelable` seulement si les deux tiennent ; une seule → `absent` | **VÉRIFIÉ** | `revelation.test.ts` — « 5 branches : seule (contrepartie VRAIE, apres_indice VRAI) rend revelable » |
| 2 | `confiance_min`/`jet` posé → `absent`, fail-closed même si les autres portes tiennent | **VÉRIFIÉ** | `revelation.test.ts` — conjonction ET, KR-280 |
| 3 | Sans `revele_si`, ou `formulation_joueur` absente/vide → `absent`, zéro injection | **VÉRIFIÉ** | `revelation.test.ts` — cas « contenu » |
| 4 | `contrepartie.consomme:true` proposé par R4 → TOUTE la sortie refusée | **VÉRIFIÉ** | `schemaSortie.test.ts` — `validerActeur` |
| 5 | Rang hors `rangsOuverts` → refus `rang-inconnu` ; `indices_reveles: []` → succès | **VÉRIFIÉ** | `schemaSortie.test.ts` |
| 6 | `a_dit` testé en premier → `deja_confie`, résiste à la fermeture d'une porte ensuite | **VÉRIFIÉ** | `revelation.test.ts` — mémoire |
| 7 | Carnet = jointure sur le journal (`reveler_indice`/`applique`), libellé dérivé, jamais `indices[].nom` ; état vide sinon | **VÉRIFIÉ** | `CarnetIndices.test.tsx` + câblage réel vérifié dans `EcranPartie.test.tsx` (bouton absent/présent selon l'écran, ouverture/fermeture avec une session réelle) |
| 8 | Aucun nouveau fichier dans l'exclusion `moteurSansIA.test.ts` | **VÉRIFIÉ** | `lintIsolation.test.ts` inchangé |

## Diff par lot

- **Lot A — `contrat-revelation` (`dev-contrat`, seul et en premier)** : `brain/dossier/revelation.ts` (N) + test, `brain/dossier/recit.ts` + test (écriture combinée `consignerReponseActeur`), `brain/dossier/__fixtures__/dossier-reference.json` (Harek gagne un savoir gardé), `brain/copilote/types.ts`, `brain/copilote/schemaSortie.ts` + test, `brain/copilote/contexte/acteur.ts` + test, `brain/CopiloteService.ts` + test, `worker/index.ts` + tests, `brain/components/Modal.tsx` + test (N), `brain/components/ListRow.tsx` + test. Ricochets légitimes ajoutés après coup : `brain/dossier/controles.test.ts` (R, BUG-144) et `brain/dossier/commandes.ts` (R, BUG-145/146 — nouvelle fonction exportée `verbeDeCommande`).
- **Lot B — `carnet-indices` (`dev-lot`)** : `play-mode/components/CarnetIndices.tsx` (N) + test, `CadrePartie.tsx` + test (prop `actionsEntete`), `EcranPartie.tsx` + test (point de montage du bouton 🗝 + badge, carnet), `hooks/useTourDeJeu.ts` + test (câblage `indices_reveles`).

Correspond exactement à la liste finale du plan signé (`.claude/raffinage/moteur-acteurs-it2.plan.md` § 5, mise à jour après les deux ricochets).

## Ce qui a été refusé

- **`contrepartie.consomme:true` câblé en it2** (REJETÉ, raffinage tour 2) — retirer un objet du joueur sur la base d'un choix narratif du modèle reste une mutation d'état décidée indirectement par une sortie libre. Porte structurellement fermée ; seul un futur verbe `donner <objet> <pnj>` (consentement structuré du joueur) pourra l'ouvrir.
- **`JournalRow.tsx` affichant un identifiant brut d'auteur** (REJETÉ comme défaut, raffinage tour 2) — confirmé CONFORME pour lui-même : registre développeur-débogueur déjà établi depuis l'itération jalons (n°9), explicitement distinct du registre joueur que porte le carnet. Ce précédent a été appliqué À TORT au carnet par une correction d'urgence (BUG-143) avant d'être écarté.
- **Réutilisation de `porteOuverte` pour l'évaluateur runtime de `Revelation`** (REJETÉ, QA + Narratif-IA confirment indépendamment) — polarité INVERSE (optimiste vs fermeture par défaut). Promu KR-288, jamais réutilisée, témoin greppable.
- **Décompteur local de verbes dans `CarnetIndices.tsx`** (trouvé en intégration, jamais signé) — dupliquait `COMMANDES` en violation de KR-013 ; remplacé en trois passages successifs (voir ci-dessous) avant d'aboutir à `verbeDeCommande`.

## Ce qui a été reporté

- `contrepartie.consomme:true` → ouverture via un futur verbe `donner <objet> <pnj>`, non ouvert ici.
- Résidu de playtest (KR-229, non vérifiable par jest) : un modèle qui ne cite jamais un rang offert, ou cite un rang sans vraiment confier le savoir dans sa réplique — aucune échéance forcée en it2.
- `dossier-controles.ts` : règle signalant un PNJ sans identité ou une homonymie stricte — dette à déclencheur de ce fichier, non ouverte ici.

## Écarts assumés et incidents

Quatre défauts trouvés et corrigés avant que l'utilisateur ne voie la tranche (aucun n'a atteint `main`) :

- **BUG-143** (majeur) — Sur-correction de l'orchestrateur : un défaut réel (Map locale dupliquant `COMMANDES`) corrigé en appliquant à tort le précédent `JournalRow.tsx` (origine rendu tel quel), que le plan écarte nommément pour le carnet.
- **BUG-144** (mineur) — `controles.test.ts`, ricochet légitime du lot A, signalé par `dev-contrat` dans son propre compte rendu mais non propagé par l'orchestrateur dans `deviations_from_plan` ni dans la liste du lot.
- **BUG-145** (majeur) — Le correctif de BUG-143 (import direct de `COMMANDES` dans `CarnetIndices.tsx`) violait une frontière déjà instrumentée (`commandes.test.ts`, KR-260 : seul `useTourDeJeu.ts` autorisé). Fix final : fonction exportée dédiée `verbeDeCommande(id)`.
- **BUG-146** (mineur) — Récidive de la même classe que BUG-144, sur le fichier touché par le correctif de BUG-145 lui-même (`commandes.ts`, pourtant explicitement retiré du lot en tour 2 du raffinage) ; et deux tests marqués `(R)` par le plan (`EcranPartie.test.tsx`, `useTourDeJeu.test.ts`) sans assertion sur le nouveau câblage.

Les trois rondes de correction ont nécessité quatre passages de revue tech-lead PR (3 `CHANGES REQUESTED` + 1 `APPROVE`) — plus que les itérations précédentes de cette feature. Leçon consignée dans `bug_history.moteur-acteurs.json` BUG-146 : un correctif né d'une porte qualité (pas d'un compte rendu d'ouvrier) doit être confronté à la liste de lots du plan signé, même — et surtout — s'il touche un fichier explicitement retiré à un tour antérieur.

## Porte qualité

- `tsc --noEmit` : vert.
- `jest` : 136 suites / 2349 tests, tous verts.
- ESLint : 0 erreur (1 warning pré-existant, hors périmètre de cette itération).
- Mutation (`src/brain/{challenge,combat,xp,characteristics}.ts`) : non due, aucun des 4 fichiers de règles touché par cette itération.

## Budget de contexte

Deux franchissements traités dans ce même lot (jamais reportés) :
- `code-knowledge.json` : 71 920 → 71 676/71 680 o (marge 4 o) après compaction de KR-254 et allègement de KR-274.
- `bug_history.json` : 18 142 → 12 352/15 360 o après scission de BUG-142 à 146 vers `bug_history.moteur-acteurs.json` (nouveau, précédent `bug_history.moteur-arbitre.json`).
- Le couple `CLAUDE.md`+`docs/WORKFLOW.md` s'est avéré RÉELLEMENT déjà au-dessus de son plafond (46 113/46 080 o, écart hérité d'une mesure jamais revérifiée depuis une session antérieure) : compacté à 46 067/46 080 o (deux clauses non essentielles retirées du tableau de budget).

## RETOUR-COMITÉ

- Le découpage en 2 lots (A `contrat`, B `feature`) était correct et n'a pas eu besoin d'être rouvert — les quatre incidents viennent tous de corrections POST-plan, jamais du découpage lui-même.
- Un correctif d'urgence qui invoque un précédent architectural (Déméter, isolation) doit systématiquement relire la section du plan qui le cite AVANT de l'appliquer — c'est la cause commune de BUG-143 et, par extension, de la chaîne BUG-145/146.
- Quand l'orchestrateur modifie lui-même un fichier en réaction à une porte qualité (pas sur rapport d'un ouvrier), ce fichier doit être confronté à la liste de lots du plan signé au même titre qu'un fichier touché par un `dev-lot` — sans cette étape, la leçon de BUG-144 ne s'applique pas à soi-même (BUG-146).
